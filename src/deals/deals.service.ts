import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { TelegramService } from '../telegram/telegram.service';
import { DealStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async create(createDealDto: CreateDealDto, userId: string) {
    // Проверяем, существует ли клиент
    const client = await this.prisma.client.findUnique({
      where: { id: createDealDto.clientId },
    });

    if (!client) {
      throw new NotFoundException(`Клиент с ID ${createDealDto.clientId} не найден`);
    }

    // Проверяем существование менеджера
    const manager = await this.prisma.user.findUnique({
      where: { id: createDealDto.managerId },
    });

    if (!manager) {
      throw new NotFoundException(`Менеджер с ID ${createDealDto.managerId} не найден`);
    }

    // Создаем сделку
    const deal = await this.prisma.deal.create({
      data: {
        ...createDealDto,
        createdById: userId,
        estimatedClosingDate: createDealDto.estimatedClosingDate ? new Date(createDealDto.estimatedClosingDate) : null,
      },
      include: {
        client: true,
        manager: true,
      },
    });

    // Создаем запись о взаимодействии
    await this.prisma.interaction.create({
      data: {
        type: 'DEAL',
        content: `Создана новая сделка: ${deal.title} на сумму ${deal.amount}`,
        clientId: deal.clientId,
        createdById: userId,
      },
    });

    // Отправляем уведомление в Telegram
    try {
      await this.telegramService.notifyNewDeal(deal);
    } catch (error) {
      console.error('Failed to send telegram notification:', error.message);
    }

    return deal;
  }
  async findAll(user) {
    // Filter deals based on user role
    // ADMIN sees all deals, MANAGER and SALES see only their own deals
    const where = user.role === 'ADMIN' ? {} : { managerId: user.id };

    return this.prisma.deal.findMany({
      where,
      include: {
        client: true,
        manager: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async findOne(id: string, user?: any) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        client: true,
        manager: true,
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Сделка с ID ${id} не найдена`);
    }

    // Check if user has access to this deal
    if (user && user.role !== 'ADMIN' && deal.managerId !== user.id) {
      throw new NotFoundException(`У вас нет доступа к сделке с ID ${id}`);
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, userId: string) {
    // Проверяем, существует ли сделка
    const existingDeal = await this.findOne(id);

    // Если меняется статус на COMPLETED, устанавливаем actualClosingDate
    let dataToUpdate: any = { ...updateDealDto };

    if (updateDealDto.status === DealStatus.COMPLETED && !existingDeal.actualClosingDate) {
      dataToUpdate.actualClosingDate = new Date();
    }

    // Конвертируем строковые даты в объекты Date
    if (updateDealDto.estimatedClosingDate) {
      dataToUpdate.estimatedClosingDate = new Date(updateDealDto.estimatedClosingDate);
    }
    if (updateDealDto.actualClosingDate) {
      dataToUpdate.actualClosingDate = new Date(updateDealDto.actualClosingDate);
    }

    // Обновляем сделку
    const updatedDeal = await this.prisma.deal.update({
      where: { id },
      data: dataToUpdate,
      include: {
        client: true,
        manager: true,
      },
    });

    // Создаем запись о взаимодействии о изменении сделки
    if (updateDealDto.status && updateDealDto.status !== existingDeal.status) {
      await this.prisma.interaction.create({
        data: {
          type: 'DEAL',
          content: `Статус сделки изменен с ${existingDeal.status} на ${updateDealDto.status}`,
          clientId: existingDeal.clientId,
          createdById: userId,
        },
      });
    }

    // Отправляем уведомление в Telegram при изменении статуса на COMPLETED
    if (updateDealDto.status === DealStatus.COMPLETED && existingDeal.status !== DealStatus.COMPLETED) {
      try {
        await this.telegramService.notifyDealCompleted(updatedDeal);
      } catch (error) {
        console.error('Failed to send telegram notification:', error.message);
      }
    }

    return updatedDeal;
  }

  async remove(id: string) {
    // Проверяем, существует ли сделка
    await this.findOne(id);

    // Удаление сделки (в реальных системах часто используется софт-делит)
    await this.prisma.deal.delete({
      where: { id },
    });

    return { success: true, message: `Сделка с ID ${id} успешно удалена` };
  }

  async getStatsByPeriod(startDate: Date, endDate: Date) {
    // Общее количество сделок в периоде
    const totalDeals = await this.prisma.deal.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Завершенные сделки
    const completedDeals = await this.prisma.deal.count({
      where: {
        status: DealStatus.COMPLETED,
        actualClosingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Общая сумма сделок
    const totalAmount = await this.prisma.deal.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Сумма завершенных сделок
    const completedAmount = await this.prisma.deal.aggregate({
      where: {
        status: DealStatus.COMPLETED,
        actualClosingDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Сделки по статусам
    const dealsByStatus = await this.prisma.deal.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return {
      totalDeals,
      completedDeals,
      totalAmount: totalAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
      dealsByStatus,
    };
  }
}