import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TaskStatus, Task } from '@prisma/client';
import axios from 'axios';

// Определяем перечисление TaskPriority локально
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Расширяем интерфейс Task для включения priority
interface TaskWithPriority extends Task {
  priority: TaskPriority;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private telegramToken: string;
  private telegramChatId: string;
  private notificationsEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // При инициализации загружаем настройки из базы данных
    this.loadSettings();
  }
  private async loadSettings() {
    try {
      const settings = await this.prisma.telegramSettings.findFirst();
      if (settings) {
        this.telegramToken = settings.botToken; // Исправлено с token на botToken
        this.telegramChatId = settings.chatId;
        this.notificationsEnabled = settings.isActive; // Исправлено с isEnabled на isActive
        
        // Для отладки
        this.logger.log(`Загружены настройки Telegram из БД: 
          Токен: ${this.telegramToken?.substring(0, 6)}... 
          Chat ID: ${this.telegramChatId}
          Активно: ${this.notificationsEnabled}`);
      } else {
        // Если настройки не найдены, берем их из переменных окружения или устанавливаем по умолчанию
        // Поддерживаем оба варианта имени переменной для совместимости
        this.telegramToken = this.configService.get('TELEGRAM_BOT_TOKEN', '') || this.configService.get('TELEGRAM_TOKEN', '');
        this.telegramChatId = this.configService.get('TELEGRAM_CHAT_ID', '');
        this.notificationsEnabled = this.configService.get('TELEGRAM_ENABLED', 'false') === 'true';
        
        // Для отладки
        this.logger.log(`Загружены настройки Telegram из переменных окружения: 
          Токен: ${this.telegramToken?.substring(0, 6)}...
          Chat ID: ${this.telegramChatId}
          Активно: ${this.notificationsEnabled}`);
        
        // Создаем запись с настройками по умолчанию
        await this.prisma.telegramSettings.create({
          data: {
            botToken: this.telegramToken, // Исправлено с token на botToken
            chatId: this.telegramChatId,
            isActive: this.notificationsEnabled, // Исправлено с isEnabled на isActive
            notifyNewClients: true,
            notifyNewDeals: true,
            notifyNewTasks: true,
            notifyTaskDeadlines: true,
            taskReminderHours: [24, 1],
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to load Telegram settings:', error.message);
    }
  }

  async getSettings() {
    const settings = await this.prisma.telegramSettings.findFirst();
    return settings || { 
      botToken: '', // Исправлено с token на botToken
      chatId: '', 
      isActive: false, // Исправлено с isEnabled на isActive
      notifyNewClients: true,
      notifyNewDeals: true,
      notifyNewTasks: true,
      notifyTaskDeadlines: true,
      taskReminderHours: [24, 1]
    };
  }

  async updateSettings(settingsData: any) {
    const { token, chatId, isEnabled, ...otherSettings } = settingsData;
    
    let settings = await this.prisma.telegramSettings.findFirst();
    
    if (settings) {
      settings = await this.prisma.telegramSettings.update({
        where: { id: settings.id },
        data: {
          botToken: token, // Исправлено с token на botToken
          chatId,
          isActive: isEnabled, // Исправлено с isEnabled на isActive
          ...otherSettings
        },
      });
    } else {
      settings = await this.prisma.telegramSettings.create({
        data: {
          botToken: token, // Исправлено с token на botToken
          chatId,
          isActive: isEnabled, // Исправлено с isEnabled на isActive
          notifyNewClients: otherSettings.notifyNewClients || true,
          notifyNewDeals: otherSettings.notifyNewDeals || true,
          notifyNewTasks: otherSettings.notifyNewTasks || true,
          notifyTaskDeadlines: otherSettings.notifyTaskDeadlines || true,
          taskReminderHours: otherSettings.taskReminderHours || [24, 1],
        },
      });
    }
    
    // Обновляем данные в памяти
    this.telegramToken = token;
    this.telegramChatId = chatId;
    this.notificationsEnabled = isEnabled;
    
    return settings;
  }
  async sendMessage(message: string): Promise<boolean> {
    if (!this.notificationsEnabled) {
      this.logger.log('Telegram notifications are disabled');
      return false;
    }
    
    if (!this.telegramToken) {
      this.logger.error('Telegram bot token is not configured');
      return false;
    }
    
    if (!this.telegramChatId) {
      this.logger.error('Telegram chat ID is not configured');
      return false;
    }

    // Используем улучшенный метод sendTelegramMessage
    return this.sendTelegramMessage(this.telegramChatId, message);
  }
  /**
   * Проверяет соединение с Telegram API с помощью getMe и валидирует настройки
   */
  async checkTelegramConnection(): Promise<{ success: boolean; botInfo?: any; settings?: any; error?: string; chatIdValid?: boolean }> {
    try {
      // Проверяем наличие токена
      if (!this.telegramToken) {
        this.logger.error('Токен Telegram не настроен');
        return { 
          success: false, 
          error: 'Токен Telegram не настроен',
          chatIdValid: false
        };
      }

      // Получаем текущие настройки из БД
      const settings = await this.prisma.telegramSettings.findFirst();
      
      // Проверяем соединение с API
      const url = `https://api.telegram.org/bot${this.telegramToken}/getMe`;
      this.logger.log(`Проверка соединения с Telegram API: ${url.substring(0, 45)}...`);
      
      const response = await axios.get(url);
      
      let botConnectionSuccess = false;
      let botInfo = null;
      
      if (response.data && response.data.ok) {
        this.logger.log(`Соединение с Telegram API установлено. Бот: ${response.data.result.username}`);
        botConnectionSuccess = true;
        botInfo = response.data.result;
      } else {
        this.logger.error(`Ошибка при проверке соединения с Telegram API: ${JSON.stringify(response.data)}`);
        return { 
          success: false, 
          error: `Неверный ответ API: ${JSON.stringify(response.data)}`,
          settings: settings,
          chatIdValid: false
        };
      }
      
      // Проверяем валидность chat ID, если он установлен
      let chatIdValid = false;
      let chatIdError = null;
      
      if (this.telegramChatId) {
        try {
          const testUrl = `https://api.telegram.org/bot${this.telegramToken}/getChat`;
          const chatResponse = await axios.post(testUrl, {
            chat_id: this.telegramChatId
          });
          
          if (chatResponse.data && chatResponse.data.ok) {
            chatIdValid = true;
            this.logger.log(`Chat ID валиден: ${chatResponse.data.result.title || chatResponse.data.result.username || this.telegramChatId}`);
          } else {
            chatIdError = `Неверный ответ API при проверке Chat ID: ${JSON.stringify(chatResponse.data)}`;
            this.logger.error(chatIdError);
          }
        } catch (chatError) {
          chatIdError = chatError.message;
          this.logger.error(`Ошибка при проверке Chat ID: ${chatIdError}`);
          
          if (chatError.response) {
            this.logger.error(`Статус ответа: ${chatError.response.status}`);
            this.logger.error(`Тело ответа: ${JSON.stringify(chatError.response.data)}`);
          }
        }
      } else {
        chatIdError = 'Chat ID не настроен';
        this.logger.error(chatIdError);
      }
      
      return { 
        success: botConnectionSuccess, 
        botInfo: botInfo,
        settings: settings,
        chatIdValid: chatIdValid,
        error: chatIdError
      };
    } catch (error) {
      this.logger.error(`Ошибка при проверке соединения с Telegram API: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`Статус ответа: ${error.response.status}`);
        this.logger.error(`Тело ответа: ${JSON.stringify(error.response.data)}`);
      }
      
      return { 
        success: false, 
        error: error.message,
        chatIdValid: false
      };
    }
  }

  async sendTestMessage(): Promise<{ success: boolean; message: string }> {
    const success = await this.sendMessage('Тестовое сообщение от CRM SolarTrade. Настройки Telegram работают корректно.');
    
    return {
      success,
      message: success
        ? 'Тестовое сообщение успешно отправлено'
        : 'Не удалось отправить тестовое сообщение. Проверьте настройки Telegram.',
    };
  }

  async notifyNewClient(client: any): Promise<boolean> {
    const message = `
🆕 <b>Новый клиент добавлен</b>
<b>Имя:</b> ${client.name}
<b>Email:</b> ${client.email}
<b>Телефон:</b> ${client.phone}
${client.company ? `\n<b>Компания:</b> ${client.company.name}` : ''}
`;

    return this.sendMessage(message);
  }

  async notifyNewDeal(deal: any): Promise<boolean> {
    const message = `
💰 <b>Новая сделка создана</b>
<b>Название:</b> ${deal.title}
<b>Клиент:</b> ${deal.client?.name || 'Неизвестно'}
<b>Сумма:</b> ${deal.amount} ${deal.currency || 'RUB'}
<b>Статус:</b> ${deal.status}
<b>Менеджер:</b> ${deal.manager?.name || 'Не назначен'}
`;

    return this.sendMessage(message);
  }

  async notifyDealCompleted(deal: any): Promise<boolean> {
    const message = `
✅ <b>Сделка успешно завершена</b>
<b>Название:</b> ${deal.title}
<b>Клиент:</b> ${deal.client?.name || 'Неизвестно'}
<b>Сумма:</b> ${deal.amount} ${deal.currency || 'RUB'}
<b>Менеджер:</b> ${deal.manager?.name || 'Не назначен'}
`;

    return this.sendMessage(message);
  }

  async notifyTaskDue(task: any): Promise<boolean> {
    const message = `
⚠️ <b>Напоминание о задаче</b>
<b>Задача:</b> ${task.title}
<b>Срок:</b> ${new Date(task.dueDate).toLocaleString('ru-RU')}
<b>Ответственный:</b> ${task.assignee?.name || 'Не назначен'}
${task.client ? `\n<b>Клиент:</b> ${task.client.name}` : ''}
${task.deal ? `\n<b>Сделка:</b> ${task.deal.title}` : ''}
`;

    return this.sendMessage(message);
  }

  /**
   * Проверяет и отправляет уведомления о заданиях с приближающимися сроками
   */
  async checkTaskDeadlines(): Promise<{ success: boolean; sent: number; errors: number }> {
    try {
      const settings = await this.prisma.telegramSettings.findFirst();
      if (!settings || !settings.isActive || !settings.notifyTaskDeadlines || !settings.botToken || !settings.chatId) {
        this.logger.warn('Notification for task deadlines is disabled');
        return { success: true, sent: 0, errors: 0 };
      }

      // Получаем настройки напоминаний (в часах)
      const reminderHours = settings.taskReminderHours || [24, 8, 2];
      
      const now = new Date();
      let sentCount = 0;
      let errorCount = 0;

      // Для каждого интервала напоминания
      for (const hours of reminderHours) {
        // Рассчитываем диапазон времени для проверки
        const minTime = new Date(now.getTime() + (hours * 60 * 60 * 1000) - (15 * 60 * 1000)); // -15 минут для погрешности
        const maxTime = new Date(now.getTime() + (hours * 60 * 60 * 1000) + (15 * 60 * 1000)); // +15 минут для погрешности

        // Находим задачи, срок которых наступает через указанное количество часов
        const tasks = await this.prisma.task.findMany({
          where: {
            status: {
              not: TaskStatus.COMPLETED
            },
            dueDate: {
              gte: minTime,
              lte: maxTime
            }
          },
          include: {
            assignee: true,
            client: true,
            deal: true
          }
        });

        this.logger.log(`Found ${tasks.length} tasks with deadline in ${hours} hours`);

        // Отправляем уведомления для каждой задачи
        for (const task of tasks) {
          try {
            const formattedDate = task.dueDate.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            // Определяем приоритет задачи
            let priorityText = 'Средний';
            let priorityEmoji = '🟠';
            
            if ('priority' in task) {
              const priority = (task as any).priority;
              if (priority === 'HIGH') {
                priorityText = 'Высокий';
                priorityEmoji = '🔴';
              } else if (priority === 'MEDIUM') {
                priorityText = 'Средний';
                priorityEmoji = '🟠';
              } else if (priority === 'LOW') {
                priorityText = 'Низкий';
                priorityEmoji = '🟢';
              }
            }

            // Формируем сообщение
            let message = `
⚠️ <b>Напоминание о сроке задачи</b>

До истечения срока задачи осталось ${hours} ${this.formatHoursWord(hours)}:

<b>Задача:</b> ${task.title}
<b>Срок:</b> ${formattedDate}
<b>Ответственный:</b> ${task.assignee?.name || 'Не назначен'}
<b>Приоритет:</b> ${priorityEmoji} ${priorityText}
`;

            if (task.client) {
              message += `<b>Клиент:</b> ${task.client.name}\n`;
            }

            if (task.deal) {
              message += `<b>Сделка:</b> ${task.deal.title}\n`;
            }

            // Отправляем сообщение
            const sent = await this.sendTelegramMessage(settings.chatId, message);
            
            if (sent) {
              sentCount++;
              this.logger.log(`Sent deadline notification for task ${task.id}`);
            } else {
              errorCount++;
              this.logger.error(`Failed to send deadline notification for task ${task.id}`);
            }
          } catch (error) {
            errorCount++;
            this.logger.error(`Error sending deadline notification for task ${task.id}: ${error.message}`);
          }
        }
      }

      return { success: true, sent: sentCount, errors: errorCount };
    } catch (error) {
      this.logger.error(`Error checking task deadlines: ${error.message}`);
      return { success: false, sent: 0, errors: 1 };
    }
  }

  /**
   * Отправляет ежедневную сводку по активным задачам
   */
  async sendDailySummary(): Promise<{ success: boolean; sent: boolean }> {
    try {
      const settings = await this.prisma.telegramSettings.findFirst();
      if (!settings || !settings.isActive || !settings.botToken || !settings.chatId) {
        this.logger.warn('Telegram уведомления отключены или некорректно настроены');
        return { success: true, sent: false };
      }

      // Получаем текущую дату
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Находим задачи на сегодня
      const todayTasks = await this.prisma.task.findMany({
        where: {
          status: {
            not: 'COMPLETED',
          },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          assignee: true,
          client: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

      // Находим просроченные задачи
      const overdueTasks = await this.prisma.task.findMany({
        where: {
          status: {
            not: 'COMPLETED',
          },
          dueDate: {
            lt: today,
          },
        },
        include: {
          assignee: true,
          client: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 5,
      });

      // Форматируем дату
      const formattedDate = today.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Формируем сообщение
      let message = `📊 <b>Ежедневная сводка по задачам</b>\n<b>${formattedDate}</b>\n\n`;

      if (todayTasks.length > 0) {
        message += `<b>Задачи на сегодня (${todayTasks.length}):</b>\n\n`;
        
        for (let i = 0; i < Math.min(todayTasks.length, 10); i++) {
          const task = todayTasks[i];
          const dueTime = new Date(task.dueDate).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          });
          
          // Определяем приоритет
          let priorityEmoji = '🟠';
          if ('priority' in task) {
            const priority = (task as any).priority;
            if (priority === 'HIGH') priorityEmoji = '🔴';
            else if (priority === 'LOW') priorityEmoji = '🟢';
          }
          
          message += `${i + 1}. ${priorityEmoji} <b>${task.title}</b>\n`;
          message += `⏰ ${dueTime} • 👤 ${task.assignee.name}\n`;
          if (task.client) {
            message += `🏢 ${task.client.name}\n`;
          }
          message += `\n`;
        }
        
        if (todayTasks.length > 10) {
          message += `... и еще ${todayTasks.length - 10} задач\n\n`;
        }
      } else {
        message += `<b>На сегодня нет активных задач</b>\n\n`;
      }

      if (overdueTasks.length > 0) {
        message += `<b>⚠️ Просроченные задачи (${overdueTasks.length}):</b>\n\n`;
        
        for (let i = 0; i < Math.min(overdueTasks.length, 5); i++) {
          const task = overdueTasks[i];
          const dueDate = new Date(task.dueDate).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
          });
          
          // Определяем приоритет
          let priorityEmoji = '🟠';
          if ('priority' in task) {
            const priority = (task as any).priority;
            if (priority === 'HIGH') priorityEmoji = '🔴';
            else if (priority === 'LOW') priorityEmoji = '🟢';
          }
          
          message += `${i + 1}. ${priorityEmoji} <b>${task.title}</b>\n`;
          message += `⏰ ${dueDate} • 👤 ${task.assignee.name}\n`;
          if (task.client) {
            message += `🏢 ${task.client.name}\n`;
          }
          message += `\n`;
        }
        
        if (overdueTasks.length > 5) {
          message += `... и еще ${overdueTasks.length - 5} просроченных задач\n`;
        }
      }

      // Отправляем сообщение
      const sent = await this.sendTelegramMessage(settings.chatId, message);
      
      return {
        success: true,
        sent: sent,
      };
    } catch (error) {
      this.logger.error(`Ошибка при отправке ежедневной сводки: ${error.message}`);
      return {
        success: false,
        sent: false,
      };
    }
  }
  /**
   * Правильно склоняет слово "час" в зависимости от числа
   */  private formatHoursWord(hours: number): string {
    if (hours % 10 === 1 && hours % 100 !== 11) {
      return 'час';
    } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
      return 'часа';
    } else {
      return 'часов';
    }
  }

  async setWebhook() {
    try {
      if (!this.telegramToken) {
        return {
          success: false,
          message: 'Токен Telegram не настроен',
        };
      }

      const webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL', '');
      
      if (!webhookUrl) {
        return {
          success: false,
          message: 'URL для webhook не настроен. Проверьте переменную окружения TELEGRAM_WEBHOOK_URL',
        };
      }

      const url = `https://api.telegram.org/bot${this.telegramToken}/setWebhook`;
      const response = await axios.post(url, {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      });

      if (response.data && response.data.ok) {
        this.logger.log(`Webhook настроен: ${webhookUrl}`);
        return {
          success: true,
          message: `Webhook успешно настроен: ${webhookUrl}`,
        };
      } else {
        this.logger.error(`Ошибка при настройке webhook: ${JSON.stringify(response.data)}`);
        return {
          success: false,
          message: `Ошибка при настройке webhook: ${response.data.description || 'Неизвестная ошибка'}`,
        };
      }
    } catch (error) {
      this.logger.error(`Ошибка при настройке webhook: ${error.message}`);
      return {
        success: false,
        message: `Ошибка при настройке webhook: ${error.message}`,
      };
    }
  }

  async processWebhook(webhookData: any) {
    try {
      this.logger.log(`Получен webhook: ${JSON.stringify(webhookData)}`);

      // Обрабатываем сообщения
      if (webhookData.message) {
        return this.processMessage(webhookData.message);
      }

      // Обрабатываем callback-запросы (нажатия на inline-кнопки)
      if (webhookData.callback_query) {
        return this.processCallbackQuery(webhookData.callback_query);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при обработке webhook: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async processMessage(message: any) {
    try {
      const chatId = message.chat.id;
      const text = message.text || '';

      // Проверяем, есть ли команда в сообщении
      if (text.startsWith('/')) {
        return this.processCommand(text, chatId);
      }

      // Отправляем приветственное сообщение для всех других сообщений
      await this.sendTelegramMessage(chatId, 'Привет! Я бот SolarTrade CRM. Используйте команды для взаимодействия.');
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при обработке сообщения: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async processCommand(command: string, chatId: number) {
    try {
      const commandLower = command.toLowerCase();

      if (commandLower.startsWith('/start')) {
        await this.sendTelegramMessage(chatId, `
Добро пожаловать в SolarTrade CRM!

Доступные команды:
/tasks - Показать срочные задачи
/deals - Показать активные сделки
/help - Показать справку
        `);
        return { success: true };
      }

      if (commandLower.startsWith('/help')) {
        await this.sendTelegramMessage(chatId, `
SolarTrade CRM Bot - помощник для работы с CRM.

Доступные команды:
/tasks - Показать срочные задачи
/deals - Показать активные сделки
/settings - Настройки уведомлений
/help - Показать это сообщение
        `);
        return { success: true };
      }

      if (commandLower.startsWith('/tasks')) {
        return this.sendTasksList(chatId);
      }

      if (commandLower.startsWith('/deals')) {
        return this.sendDealsList(chatId);
      }

      // Если команда не распознана
      await this.sendTelegramMessage(chatId, 'Неизвестная команда. Используйте /help для просмотра списка команд.');
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при обработке команды: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async processCallbackQuery(callbackQuery: any) {
    try {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      // Обработка различных callback-запросов
      if (data.startsWith('task_')) {
        const taskId = data.replace('task_', '');
        return this.sendTaskDetails(chatId, taskId);
      }

      if (data.startsWith('deal_')) {
        const dealId = data.replace('deal_', '');
        return this.sendDealDetails(chatId, dealId);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при обработке callback-запроса: ${error.message}`);
      return { success: false, error: error.message };
    }
  }  private async sendTasksList(chatId: number) {
    try {
      // Получаем список задач с приближающимися сроками
      const tasks = await this.prisma.task.findMany({
        where: {
          status: {
            not: 'COMPLETED',
          },
          dueDate: {
            lte: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // задачи на ближайшие 24 часа
          },
        },
        include: {
          assignee: true,
          client: true,
        },
        orderBy: {
          dueDate: 'asc' // Сортировка по сроку (ближайшие в начале)
        },
        take: 5,
      });

      if (tasks.length === 0) {
        await this.sendTelegramMessage(chatId, 'На ближайшие 24 часа нет срочных задач.');
        return { success: true };
      }

      let message = '<b>Срочные задачи на ближайшие 24 часа:</b>\n\n';      for (const task of tasks) {
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        message += `📌 <b>${task.title}</b>\n`;
        message += `⏰ Срок: ${formattedDate}\n`;
        message += `👤 Отв.: ${task.assignee.name}\n`;
        if (task.client) {
          message += `🏢 Клиент: ${task.client.name}\n`;
        }
        message += `\n`;
      }

      await this.sendTelegramMessage(chatId, message);
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при отправке списка задач: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendDealsList(chatId: number) {
    try {
      // Получаем список активных сделок
      const deals = await this.prisma.deal.findMany({
        where: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED'],
          },
        },
        include: {
          client: true,
          manager: true,
        },
        take: 5,
      });

      if (deals.length === 0) {
        await this.sendTelegramMessage(chatId, 'Нет активных сделок на данный момент.');
        return { success: true };
      }

      let message = '<b>Активные сделки:</b>\n\n';
      
      for (const deal of deals) {
        message += `💼 <b>${deal.title}</b>\n`;
        message += `💰 Сумма: ${deal.amount} ${deal.currency}\n`;
        message += `🏢 Клиент: ${deal.client.name}\n`;
        message += `👤 Менеджер: ${deal.manager.name}\n`;
        message += `📊 Статус: ${this.getDealStatusText(deal.status)}\n\n`;
      }

      await this.sendTelegramMessage(chatId, message);
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при отправке списка сделок: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private getDealStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'NEW': 'Новая',
      'NEGOTIATION': 'Переговоры',
      'PROPOSAL': 'Предложение',
      'AGREEMENT': 'Согласование',
      'PAID': 'Оплачена',
      'INSTALLATION': 'Монтаж',
      'COMPLETED': 'Завершена',
      'CANCELLED': 'Отменена',
    };
    
    return statusMap[status] || status;
  }

  private async sendTaskDetails(chatId: number, taskId: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: true,
          client: true,
          deal: true,
          createdBy: true,
        },
      });

      if (!task) {
        await this.sendTelegramMessage(chatId, 'Задача не найдена.');
        return { success: false };
      }

      const dueDate = new Date(task.dueDate);
      const formattedDate = dueDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      let message = `<b>🔍 Детали задачи</b>\n\n`;
      message += `<b>Название:</b> ${task.title}\n`;
      if (task.description) {
        message += `<b>Описание:</b> ${task.description}\n`;
      }
      message += `<b>Срок:</b> ${formattedDate}\n`;      message += `<b>Статус:</b> ${this.getTaskStatusText(task.status)}\n`;
      message += `<b>Приоритет:</b> ${this.getTaskPriorityText((task as any).priority || 'MEDIUM')}\n`;
      message += `<b>Ответственный:</b> ${task.assignee.name}\n`;
      
      if (task.client) {
        message += `<b>Клиент:</b> ${task.client.name}\n`;
      }
      
      if (task.deal) {
        message += `<b>Сделка:</b> ${task.deal.title}\n`;
      }

      await this.sendTelegramMessage(chatId, message);
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при отправке деталей задачи: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendDealDetails(chatId: number, dealId: string) {
    try {
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          client: true,
          manager: true,
        },
      });

      if (!deal) {
        await this.sendTelegramMessage(chatId, 'Сделка не найдена.');
        return { success: false };
      }

      let message = `<b>🔍 Детали сделки</b>\n\n`;
      message += `<b>Название:</b> ${deal.title}\n`;
      if (deal.description) {
        message += `<b>Описание:</b> ${deal.description}\n`;
      }
      message += `<b>Сумма:</b> ${deal.amount} ${deal.currency}\n`;
      message += `<b>Статус:</b> ${this.getDealStatusText(deal.status)}\n`;
      message += `<b>Клиент:</b> ${deal.client.name}\n`;
      message += `<b>Менеджер:</b> ${deal.manager.name}\n`;
      
      if (deal.estimatedClosingDate) {
        const estimatedDate = new Date(deal.estimatedClosingDate);
        const formattedDate = estimatedDate.toLocaleDateString('ru-RU');
        message += `<b>Планируемая дата закрытия:</b> ${formattedDate}\n`;
      }

      await this.sendTelegramMessage(chatId, message);
      return { success: true };
    } catch (error) {
      this.logger.error(`Ошибка при отправке деталей сделки: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private getTaskStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'NEW': 'Новая',
      'IN_PROGRESS': 'В работе',
      'COMPLETED': 'Завершена',
      'CANCELLED': 'Отменена',
      'POSTPONED': 'Отложена',
    };
    
    return statusMap[status] || status;
  }

  private getTaskPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      'LOW': 'Низкий',
      'MEDIUM': 'Средний',
      'HIGH': 'Высокий',
    };
    
    return priorityMap[priority] || priority;
  }
  private async sendTelegramMessage(chatId: number | string, text: string) {
    try {
      if (!this.telegramToken) {
        this.logger.error('Токен Telegram не настроен');
        return false;
      }

      if (!chatId) {
        this.logger.error('Chat ID Telegram не указан');
        return false;
      }

      // Логируем данные для отладки
      this.logger.log(`Отправка сообщения в Telegram: 
        Токен: ${this.telegramToken?.substring(0, 6)}...
        Chat ID: ${chatId}
        Длина текста: ${text.length} символов`);
      
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      this.logger.log(`URL запроса: ${url.substring(0, 45)}...`);
      
      const response = await axios.post(url, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      });

      if (response.data && response.data.ok) {
        this.logger.log(`Сообщение успешно отправлено в Telegram, message_id: ${response.data.result?.message_id}`);
        return true;
      } else {
        this.logger.error(`Ошибка в ответе Telegram API: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Ошибка при отправке сообщения в Telegram: ${error.message}`);
      
      if (error.response) {
        // Логируем детали ответа для более точной диагностики
        this.logger.error(`Статус ответа: ${error.response.status}`);
        this.logger.error(`Тело ответа: ${JSON.stringify(error.response.data)}`);
      }
      
      return false;
    }
  }

  async sendTaskNotification(task: any): Promise<boolean> {
    try {
      // Проверяем настройки и активность уведомлений
      const settings = await this.prisma.telegramSettings.findFirst();
      if (!settings || !settings.isActive || !settings.botToken || !settings.chatId) {
        this.logger.warn('Telegram notifications are disabled or not configured');
        return false;
      }

      // Получаем данные о задаче
      const fullTask = await this.prisma.task.findUnique({
        where: { id: task.id },
        include: {
          assignee: true,
          client: true,
          deal: true,
        },
      });

      if (!fullTask) {
        this.logger.error(`Task with ID ${task.id} not found`);
        return false;
      }

      // Форматируем дату
      const dueDate = new Date(fullTask.dueDate);
      const formattedDate = dueDate.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Определяем приоритет
      let priorityText = 'Средний';
      let priorityEmoji = '🟠';
      
      // Используем условные блоки вместо прямого доступа к fullTask.priority
      if (fullTask && 'priority' in fullTask) {
        const priority = (fullTask as any).priority;
        if (priority === 'HIGH') {
          priorityText = 'Высокий';
          priorityEmoji = '🔴';
        } else if (priority === 'MEDIUM') {
          priorityText = 'Средний';
          priorityEmoji = '🟠';
        } else if (priority === 'LOW') {
          priorityText = 'Низкий';
          priorityEmoji = '🟢';
        }
      }

      // Составляем сообщение
      let message = `
🔔 <b>Новая задача в CRM</b>

<b>Задача:</b> ${fullTask.title}
<b>Срок:</b> ${formattedDate}
<b>Ответственный:</b> ${fullTask.assignee?.name || 'Не назначен'}
<b>Приоритет:</b> ${priorityEmoji} ${priorityText}
`;

      if (fullTask.client) {
        message += `<b>Клиент:</b> ${fullTask.client.name}\n`;
      }

      if (fullTask.deal) {
        message += `<b>Сделка:</b> ${fullTask.deal.title}\n`;
      }

      if (fullTask.description) {
        message += `\n<b>Описание:</b> ${fullTask.description.substring(0, 200)}${fullTask.description.length > 200 ? '...' : ''}\n`;
      }

      // Отправляем сообщение
      const response = await this.sendTelegramMessage(
        settings.chatId,
        message
      );

      return response === true;
    } catch (error) {
      this.logger.error('Error sending task notification:', error.message);
      return false;
    }
  }
}