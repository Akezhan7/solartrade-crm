import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, DealStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async getStats() {
    // Получаем текущую дату
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentYear = currentDate.getFullYear();
    
    // Активные задачи (не завершенные и не отмененные)
    const activeTaskCount = await this.prisma.task.count({
      where: {
        status: {
          notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED]
        }
      }
    });

    // Завершенные задачи
    const completedTaskCount = await this.prisma.task.count({
      where: {
        status: TaskStatus.COMPLETED
      }
    });

    // Активные сделки (не завершенные и не отмененные)
    const activeDealCount = await this.prisma.deal.count({
      where: {
        status: {
          notIn: [DealStatus.COMPLETED, DealStatus.CANCELLED]
        }
      }
    });

    // Все сделки
    const totalDeals = await this.prisma.deal.count();

    // Общая сумма сделок
    const dealsValueResult = await this.prisma.deal.aggregate({
      _sum: {
        amount: true
      }
    });
    const totalRevenue = dealsValueResult._sum.amount?.toNumber() || 0;

    // Общее количество клиентов
    const totalClients = await this.prisma.client.count();

    // Новых клиентов в этом месяце
    const newClientsThisMonth = await this.prisma.client.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    // Получаем выручку по месяцам для графика
    const months = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const currentMonth = currentDate.getMonth();
    
    // Получаем данные по выручке за последние 6 месяцев
    const revenueByMonth = [];
    const revenueLabels = [];
    
    // Собираем выручку за последние 6 месяцев
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12; // Корректный индекс месяца с учетом перехода между годами
      const year = currentYear - (monthIndex > currentMonth ? 1 : 0);
      
      const startOfMonth = new Date(year, monthIndex, 1);
      const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      
      // Получаем выручку за этот месяц
      const monthlyRevenueResult = await this.prisma.deal.aggregate({
        _sum: {
          amount: true
        },
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: {
            not: DealStatus.CANCELLED
          }
        }
      });
      
      revenueLabels.unshift(months[monthIndex]);
      revenueByMonth.unshift(monthlyRevenueResult._sum.amount?.toNumber() || 0);
    }
    
    // Получение статистики сделок по статусам
    const dealStatuses = Object.values(DealStatus);
    const dealsByStatusLabels = [];
    const dealsByStatusData = [];
      // Переводы статусов для отображения
    const statusTranslations = {
      [DealStatus.NEW]: 'Новые',
      [DealStatus.NEGOTIATION]: 'В переговорах',
      [DealStatus.PROPOSAL]: 'Предложение',
      [DealStatus.AGREEMENT]: 'Согласование',
      [DealStatus.PAID]: 'Оплачено',
      [DealStatus.INSTALLATION]: 'Монтаж',
      [DealStatus.COMPLETED]: 'Завершенные',
      [DealStatus.CANCELLED]: 'Отмененные'
    };
    
    // Собираем данные о количестве сделок по статусам
    for (const status of dealStatuses) {
      const count = await this.prisma.deal.count({
        where: { status }
      });
      
      dealsByStatusLabels.push(statusTranslations[status] || status);
      dealsByStatusData.push(count);
    }
    
    // Получаем предстоящие сделки (с ближайшими датами закрытия)
    const upcomingDeals = await this.prisma.deal.findMany({
      where: {
        status: {
          notIn: [DealStatus.COMPLETED, DealStatus.CANCELLED]
        },
        estimatedClosingDate: {
          gte: currentDate
        }
      },
      orderBy: {
        estimatedClosingDate: 'asc'
      },
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Форматируем предстоящие сделки для фронтенда
    const formattedUpcomingDeals = upcomingDeals.map(deal => ({
      id: deal.id,
      title: deal.title,
      amount: deal.amount.toNumber(),
      currency: deal.currency,
      status: deal.status,
      clientName: deal.client?.name || 'Неизвестный клиент',
      managerName: deal.manager?.name || 'Не назначен',
      estimatedClosingDate: deal.estimatedClosingDate?.toISOString() || null
    }));

    // Активные задачи для отображения на дашборде
    const activeTasks = await this.prisma.task.findMany({
      where: {
        status: {
          notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED]
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5,
      include: {
        assignee: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });    // Форматируем задачи для фронтенда
    const formattedActiveTasks = activeTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate.toISOString(),
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: task.assignee.name
      } : null,
      client: task.client ? {
        id: task.client.id,
        name: task.client.name
      } : null,      deal: task.deal ? {
        id: task.deal.id,
        title: task.deal.title
      } : null
    }));
    
    // Возвращаем собранные данные
    return {
      stats: {
        activeTasks: activeTaskCount,
        completedTasks: completedTaskCount,
        activeDeals: activeDealCount,
        totalDeals: totalDeals,
        totalRevenue: totalRevenue,
        totalClients: totalClients,
        newClientsThisMonth: newClientsThisMonth
      },
      activeTasks: formattedActiveTasks,
      upcomingDeals: formattedUpcomingDeals,
      revenueByMonth: {
        labels: revenueLabels,
        data: revenueByMonth
      },
      dealsByStatus: {
        labels: dealsByStatusLabels,
        data: dealsByStatusData
      }
    };
  }

  async getLatestTasks(limit: number = 5) {
    const tasks = await this.prisma.task.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        assignee: true,
        client: true,
        deal: true
      }
    });

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate.toISOString(),
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: task.assignee.name
      } : null,
      client: task.client ? {
        id: task.client.id,
        name: task.client.name
      } : null,
      deal: task.deal ? {
        id: task.deal.id,
        title: task.deal.title
      } : null
    }));
  }

  async getLatestClients(limit: number = 5) {
    // Находим клиентов с наибольшим количеством сделок
    const clients = await this.prisma.client.findMany({
      take: limit,
      include: {
        company: true,
        deals: true,
      },
      orderBy: [
        // Сначала сортируем по количеству сделок
        {
          deals: {
            _count: 'desc'
          }
        },
        // Затем по дате создания (если количество сделок одинаковое)
        {
          createdAt: 'desc'
        }
      ]
    });

    return clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      companyName: client.company?.name || null,
      dealsCount: client.deals.length
    }));
  }

  async getLatestDeals(limit: number = 5) {
    const deals = await this.prisma.deal.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: true,
        manager: true
      }
    });

    return deals.map(deal => ({
      id: deal.id,
      title: deal.title,
      amount: deal.amount.toNumber(),
      currency: deal.currency,
      status: deal.status,
      client: deal.client ? {
        id: deal.client.id,
        name: deal.client.name
      } : null,
      manager: deal.manager ? {
        id: deal.manager.id,
        name: deal.manager.name
      } : null,
      createdAt: deal.createdAt.toISOString(),
      estimatedClosingDate: deal.estimatedClosingDate ? deal.estimatedClosingDate.toISOString() : null
    }));
  }
}
