import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async create(createClientDto: CreateClientDto, userId: string) {
    // Создаем клиента с компанией, если указана
    const client = await this.prisma.client.create({
      data: {
        name: createClientDto.name,
        phone: createClientDto.phone,
        email: createClientDto.email,
        description: createClientDto.description,
        // Если есть данные о компании, создаем вложенную запись
        ...(createClientDto.company && {
          company: {
            create: {
              name: createClientDto.company.name,
              inn: createClientDto.company.inn,
              kpp: createClientDto.company.kpp || '',
              address: createClientDto.company.address,
              bankDetails: createClientDto.company.bankDetails || '',
            },
          },
        }),
      },
      include: {
        company: true,
      },
    });

    // Создаем запись о взаимодействии
    await this.prisma.interaction.create({
      data: {
        type: 'NOTE',
        content: `Клиент ${client.name} добавлен в систему`,
        clientId: client.id,
        createdById: userId,
      },
    });

    // Отправляем уведомление в Telegram
    try {
      await this.telegramService.notifyNewClient(client);
    } catch (error) {
      console.error('Failed to send telegram notification:', error.message);
    }

    return client;
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        company: true,
        deals: {
          include: {
            manager: true,
          },
        },
        tasks: {
          include: {
            assignee: true,
          },
        },
        interactions: {
          include: {
            // Удаляем createdBy, т.к. это поле не существует в схеме
            // createdBy: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Клиент с ID ${id} не найден`);
    }

    return client;
  }

  async update(id: string, updateClientDto: any) {
    // Проверяем, существует ли клиент
    const existingClient = await this.prisma.client.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!existingClient) {
      throw new NotFoundException(`Клиент с ID ${id} не найден`);
    }

    // Обновляем клиента
    const clientUpdate: any = {
      name: updateClientDto.name,
      phone: updateClientDto.phone,
      email: updateClientDto.email,
      description: updateClientDto.description,
    };

    // Обновляем данные о компании, если они есть
    if (updateClientDto.company) {
      if (existingClient.company) {
        // Если у клиента уже есть компания, обновляем ее
        await this.prisma.clientCompany.update({
          where: { id: existingClient.company.id },
          data: {
            name: updateClientDto.company.name,
            inn: updateClientDto.company.inn,
            kpp: updateClientDto.company.kpp || '',
            address: updateClientDto.company.address,
            bankDetails: updateClientDto.company.bankDetails || '',
          },
        });
      } else {
        // Если компании нет, создаем новую
        await this.prisma.clientCompany.create({
          data: {
            name: updateClientDto.company.name,
            inn: updateClientDto.company.inn,
            kpp: updateClientDto.company.kpp || '',
            address: updateClientDto.company.address,
            bankDetails: updateClientDto.company.bankDetails || '',
            client: {
              connect: { id }
            }
          },
        });
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: clientUpdate,
      include: {
        company: true,
      },
    });
  }

  async remove(id: string) {
    // Проверяем, существует ли клиент
    await this.findOne(id);
    
    // Удаляем клиента (в реальных системах часто используется софт-делит)
    await this.prisma.client.delete({
      where: { id },
    });
    
    return { success: true, message: `Клиент с ID ${id} успешно удален` };
  }

  async addInteraction(clientId: string, data: any, userId: string) {
    // Проверяем, существует ли клиент
    await this.findOne(clientId);
    
    // Создаем запись о взаимодействии
    const interaction = await this.prisma.interaction.create({
      data: {
        type: data.type,
        content: data.content,
        clientId: clientId,
        createdById: userId,
      },
      include: {
        client: true,
        // Удаляем createdBy, т.к. это поле не существует в схеме
        // createdBy: true,
      },
    });
    
    return interaction;
  }

  async getInteractions(clientId: string) {
    // Проверяем, существует ли клиент
    await this.findOne(clientId);
    
    // Получаем все взаимодействия клиента
    return this.prisma.interaction.findMany({
      where: { clientId },
      include: {
        // Удаляем createdBy, т.к. это поле не существует в схеме
        // createdBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}