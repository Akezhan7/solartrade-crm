import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, TaskPriority } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '@prisma/client';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    // Проверяем существование ответственного
    const assignee = await this.prisma.user.findUnique({
      where: { id: createTaskDto.assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException(`Пользователь с ID ${createTaskDto.assigneeId} не найден`);
    }

    // Проверяем существование клиента, если указан
    if (createTaskDto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: createTaskDto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Клиент с ID ${createTaskDto.clientId} не найден`);
      }
    }

    // Проверяем существование сделки, если указана
    if (createTaskDto.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: createTaskDto.dealId },
      });

      if (!deal) {
        throw new NotFoundException(`Сделка с ID ${createTaskDto.dealId} не найдена`);
      }
    }    // Создаем задачу    // Создаем объект данных для задачи
    const taskData: any = {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || TaskStatus.NEW,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        dueDate: new Date(createTaskDto.dueDate),
        assigneeId: createTaskDto.assigneeId,
        clientId: createTaskDto.clientId,
        dealId: createTaskDto.dealId,
        createdById: userId,
    };
    
    // Создаем задачу
    const task = await this.prisma.task.create({
      data: taskData,
      include: {
        assignee: true,
        client: true,
        deal: true,
        createdBy: true,
      },
    });    // Если с задачей связан клиент, создаем запись о взаимодействии
    if (task.clientId) {
      await this.prisma.interaction.create({
        data: {
          type: 'TASK',
          content: `Создана новая задача: ${task.title}`,
          clientId: task.clientId,
          createdById: userId,
        },
      });
    }
      // Отправляем уведомление в Telegram
    try {
      // Получаем настройки Telegram
      const telegramSettings = await this.prisma.telegramSettings.findFirst();
      
      // Проверяем, включены ли уведомления для новых задач
      if (telegramSettings && telegramSettings.isActive && telegramSettings.notifyNewTasks) {
        // Отправляем уведомление
        const sentNotification = await this.telegramService.sendTaskNotification(task);
        if (sentNotification) {
          this.logger.log(`Уведомление о задаче ${task.id} успешно отправлено в Telegram`);
        } else {
          this.logger.warn(`Не удалось отправить уведомление о задаче ${task.id} в Telegram`);
        }
      }
    } catch (error) {
      // Логируем ошибку, но не прерываем основной процесс
      this.logger.error(`Ошибка при отправке уведомления в Telegram: ${error.message}`);
    }

    return task;
  }
  async findAll(filters?: any, user?: any) {
    const where: any = {};

    // Apply role-based filtering
    if (user) {
      if (user.role !== 'ADMIN') {
        // MANAGER and SALES users can only see tasks assigned to them
        where.assigneeId = user.id;
      }
    }

    // Применяем фильтры, если они указаны
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.assigneeId) {
        // If an admin is filtering by assignee, override the default role-based filter
        where.assigneeId = filters.assigneeId;
      }
      if (filters.clientId) {
        where.clientId = filters.clientId;
      }
      if (filters.dealId) {
        where.dealId = filters.dealId;
      }
      if (filters.dueDate) {
        const dueDate = new Date(filters.dueDate);
        where.dueDate = {
          gte: new Date(dueDate.setHours(0, 0, 0, 0)),
          lt: new Date(dueDate.setHours(23, 59, 59, 999)),
        };
      }
      if (filters.overdue === 'true') {
        where.dueDate = {
          lt: new Date(),
        };
        where.status = {
          not: TaskStatus.COMPLETED,
        };
      }
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: true,
        client: true,
        deal: true,
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });
  }
  async findOne(id: string, user?: any) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        client: true,
        deal: true,
        createdBy: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    // Check if user has access to this task
    if (user && user.role !== 'ADMIN' && task.assigneeId !== user.id && task.createdById !== user.id) {
      throw new NotFoundException(`У вас нет доступа к задаче с ID ${id}`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    // Проверяем, существует ли задача
    const existingTask = await this.findOne(id);

    // Подготавливаем данные для обновления
    const updateData: any = { ...updateTaskDto };

    // Конвертируем строковые даты в объекты Date
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }
    if (updateTaskDto.completedAt) {
      updateData.completedAt = new Date(updateTaskDto.completedAt);
    }

    // Если статус меняется на COMPLETED, и задача еще не завершена,
    // устанавливаем время выполнения
    if (updateTaskDto.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    // Обновляем задачу
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: true,
        client: true,
        deal: true,
      },
    });

    // Если с задачей связан клиент и изменился статус, создаем запись о взаимодействии
    if (updatedTask.clientId && updateTaskDto.status && updateTaskDto.status !== existingTask.status) {
      await this.prisma.interaction.create({
        data: {
          type: 'TASK',
          content: `Статус задачи "${updatedTask.title}" изменен с ${existingTask.status} на ${updateTaskDto.status}`,
          clientId: updatedTask.clientId,
          createdById: userId,
        },
      });
    }

    return updatedTask;
  }

  async remove(id: string) {
    // Проверяем, существует ли задача
    await this.findOne(id);

    // Удаляем задачу
    await this.prisma.task.delete({
      where: { id },
    });

    return { success: true, message: `Задача с ID ${id} успешно удалена` };
  }

  async getTasksForToday(userId: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Получаем все задачи пользователя на сегодня
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          lt: tomorrow,
        },
      },
      include: {
        client: true,
        deal: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getOverdueTasks(userId: string) {
    const today = new Date();

    // Получаем все просроченные задачи пользователя
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          lt: today,
        },
      },
      include: {
        client: true,
        deal: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getUpcomingTasks(userId: string, days: number = 7) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    // Получаем все задачи пользователя на ближайшие дни
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          gte: today,
          lte: endDate,
        },
      },
      include: {
        client: true,
        deal: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }
}