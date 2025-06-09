import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { TelegramService } from '../telegram/telegram.service';
import { UserRole, Client, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}
  async create(createClientDto: CreateClientDto, userId: string) {
    // Получаем информацию о пользователе, который создает клиента
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    // Определяем ID менеджера для клиента:
    // 1. Если указан managerId в запросе и пользователь ADMIN - используем его
    // 2. Иначе используем ID текущего пользователя
    const managerId = (user?.role === UserRole.ADMIN && createClientDto.managerId) 
      ? createClientDto.managerId 
      : userId;
      
    // Проверяем существование менеджера
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId }
    });
    
    if (!manager) {
      throw new NotFoundException(`Менеджер с ID ${managerId} не найден`);
    }
      // Создаем клиента с компанией, если указана
    const client = await this.prisma.client.create({
      data: {
        name: createClientDto.name,
        phone: createClientDto.phone,
        email: createClientDto.email,
        description: createClientDto.description,
        manager: {
          connect: { id: managerId }
        },
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
  async findAll(user) {
    // Если пользователь - администратор, показываем всех клиентов
    // Если менеджер или sales - только своих клиентов
    let where = {};
    if (user.role !== UserRole.ADMIN) {
      where = { 
        manager: {
          id: user.id
        }
      };
    }
    
    return this.prisma.client.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user?: any) {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Клиент с ID ${id} не найден`);
    }

    // Access control check
    const foundClient = await this.prisma.$queryRaw`
      SELECT "manager_id" FROM clients WHERE id = ${id}
    `;
    
    const managerId = foundClient[0]?.manager_id;

    if (user && user.role !== UserRole.ADMIN && managerId !== user.id) {
      throw new NotFoundException(`У вас нет доступа к клиенту с ID ${id}`);
    }

    return client;
  }

  async update(id: string, updateClientDto: any, user?: any) {
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
    
    // Access control check
    const foundClient = await this.prisma.$queryRaw`
      SELECT "manager_id" FROM clients WHERE id = ${id}
    `;
    
    const managerId = foundClient[0]?.manager_id;

    if (user && user.role !== UserRole.ADMIN && managerId !== user.id) {
      throw new NotFoundException(`У вас нет доступа для редактирования клиента с ID ${id}`);
    }

    // Обновляем клиента
    const clientUpdate: any = {
      name: updateClientDto.name,
      phone: updateClientDto.phone,
      email: updateClientDto.email,
      description: updateClientDto.description,
    };
    
    // Если пользователь - админ и указан новый менеджер, обновляем его
    if (user?.role === UserRole.ADMIN && updateClientDto.managerId) {
      // Проверяем существование нового менеджера
      const manager = await this.prisma.user.findUnique({
        where: { id: updateClientDto.managerId }
      });
      
      if (!manager) {
        throw new NotFoundException(`Менеджер с ID ${updateClientDto.managerId} не найден`);
      }
        clientUpdate.manager = { connect: { id: updateClientDto.managerId } };
    }

    // Обновляем данные о компании, если они есть
    if (updateClientDto.company) {
      if (existingClient.companyId) {
        // Если у клиента уже есть компания, обновляем ее
        await this.prisma.clientCompany.update({
          where: { id: existingClient.companyId },
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
        company: true
      },
    });
  }

  async remove(id: string, user?: any) {
    // Проверяем, существует ли клиент и имеет ли пользователь к нему доступ
    const client = await this.findOne(id, user);
    
    // Access control check
    const foundClient = await this.prisma.$queryRaw`
      SELECT "manager_id" FROM clients WHERE id = ${id}
    `;
    
    const managerId = foundClient[0]?.manager_id;
    
    // Только админ или ответственный менеджер может удалить клиента
    if (user && user.role !== UserRole.ADMIN && managerId !== user.id) {
      throw new NotFoundException(`У вас нет прав для удаления клиента с ID ${id}`);
    }
    
    // Удаляем клиента (в реальных системах часто используется софт-делит)
    await this.prisma.client.delete({
      where: { id },
    });
    
    return { success: true, message: `Клиент с ID ${id} успешно удален` };
  }

  async addInteraction(clientId: string, data: any, userId: string, user?: any) {
    // Проверяем, существует ли клиент и имеет ли пользователь к нему доступ
    await this.findOne(clientId, user);
    
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
      },
    });
    return interaction;
  }

  async getInteractions(clientId: string, user?: any) {
    // Проверяем, существует ли клиент и имеет ли пользователь к нему доступ
    await this.findOne(clientId, user);
    
    // Получаем взаимодействия клиента
    return this.prisma.interaction.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContacts(clientId: string, user?: any) {
    // Проверяем, существует ли клиент и имеет ли пользователь к нему доступ
    await this.findOne(clientId, user);
    
    // Получаем контакты клиента
    return this.prisma.contact.findMany({
      where: { clientId },
      orderBy: { lastName: 'asc' },
    });
  }
}