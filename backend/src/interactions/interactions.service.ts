import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  async create(createInteractionDto: any, userId: string) {
    return this.prisma.interaction.create({
      data: {
        ...createInteractionDto,
        createdById: userId,
      },
      include: {
        client: true,
      },
    });
  }

  async findAll() {
    return this.prisma.interaction.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID ${id} not found`);
    }

    return interaction;
  }

  async findByClient(clientId: string) {
    // Проверяем существование клиента
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.interaction.findMany({
      where: { clientId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(id: string) {
    const interaction = await this.prisma.interaction.findUnique({
      where: { id },
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction with ID ${id} not found`);
    }

    return this.prisma.interaction.delete({
      where: { id },
    });
  }

  async getInteractionStats(startDate: Date, endDate: Date) {
    // Получаем количество взаимодействий по типам за указанный период
    const interactionsByType = await this.prisma.interaction.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Получаем количество взаимодействий по сотрудникам за указанный период
    const interactionsByUser = await this.prisma.interaction.groupBy({
      by: ['createdById'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Получаем данные о пользователях для добавления имен
    const userIds = interactionsByUser.map(item => item.createdById);
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true, // Используем поле name вместо firstName и lastName
      },
    });

    // Добавляем имена пользователей к статистике
    const interactionsByUserWithNames = interactionsByUser.map(item => {
      const user = users.find(u => u.id === item.createdById);
      return {
        userId: item.createdById,
        userName: user ? user.name : 'Unknown', // Используем поле name
        count: item._count.id,
      };
    });

    return {
      byType: interactionsByType.map(item => ({
        type: item.type,
        count: item._count.id,
      })),
      byUser: interactionsByUserWithNames,
      total: interactionsByType.reduce((acc, item) => acc + item._count.id, 0),
      period: {
        startDate,
        endDate,
      },
    };
  }
}