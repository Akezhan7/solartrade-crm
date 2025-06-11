// Сервис для работы с Telegram API
interface TelegramSettings {
  botToken: string;
  chatId: string;
}

interface TelegramNotificationOptions {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  assigneeName: string;
  clientName?: string;
  priority?: string; // Добавляем приоритет (опциональное поле)
}

interface DealNotificationOptions {
  dealId: string;
  dealTitle: string;
  amount: number;
  clientName: string;
  managerName: string;
}

interface TelegramNotificationResult {
  success: boolean;
  error?: string;
}

class TelegramService {
  private settings: TelegramSettings = {
    botToken: process.env.REACT_APP_TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.REACT_APP_TELEGRAM_CHAT_ID || ''
  };  async getSettings(): Promise<any> {
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/telegram/settings`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      this.settings = {
        botToken: data.botToken || '',
        chatId: data.chatId || ''
      };
      
      return data;
    } catch (error) {
      console.error('Error fetching telegram settings:', error);
      return null;
    }
  }
  async updateSettings(settings: any): Promise<any> {
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/telegram/settings`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      
      // Update local settings
      if (data.botToken && data.chatId) {
        this.settings = {
          botToken: data.botToken,
          chatId: data.chatId
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error updating telegram settings:', error);
      return {
        success: false,
        error: 'Ошибка при обновлении настроек Telegram'
      };
    }
  }

  isBotConfigured(): boolean {
    return !!(this.settings.botToken && this.settings.chatId);
  }
  async sendMessage(message: string): Promise<TelegramNotificationResult> {
    if (!this.isBotConfigured()) {
      console.warn('Telegram bot is not configured');
      return {
        success: false,
        error: 'Бот не настроен'
      };
    }    try {
      // Используем API бекенда для отправки сообщений в Telegram
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/telegram/send-message`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Telegram API error:', data.message);
        return {
          success: false,
          error: data.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending telegram message:', error);
      return {
        success: false,
        error: 'Ошибка при отправке сообщения'
      };
    }
  }
  
  async sendNewTaskNotification(options: TelegramNotificationOptions): Promise<TelegramNotificationResult> {
    const { taskId, taskTitle, dueDate, assigneeName, clientName, priority } = options;
    
    // Определяем иконку для приоритета
    let priorityIcon = '⚪️';
    let priorityText = 'Не указан';
    
    if (priority) {
      switch(priority) {
        case 'LOW':
          priorityIcon = '🟢';
          priorityText = 'Низкий';
          break;
        case 'MEDIUM':
          priorityIcon = '🟡';
          priorityText = 'Средний';
          break;
        case 'HIGH':
          priorityIcon = '🔴';
          priorityText = 'Высокий';
          break;
      }
    }
    
    const message = `
<b>🔔 Новая задача в CRM</b>

<b>Задача:</b> ${taskTitle}
<b>Приоритет:</b> ${priorityIcon} ${priorityText}
<b>Ответственный:</b> ${assigneeName}
<b>Срок:</b> ${new Date(dueDate).toLocaleString()}
${clientName ? `<b>Клиент:</b> ${clientName}` : ''}
<b>ID задачи:</b> ${taskId}
    `.trim();

    return this.sendMessage(message);
  }
  
  async sendNewDealNotification(options: DealNotificationOptions): Promise<TelegramNotificationResult> {
    const { dealId, dealTitle, amount, clientName, managerName } = options;
    
    const message = `
<b>💼 Новая сделка в CRM</b>

<b>Сделка:</b> ${dealTitle}
<b>Клиент:</b> ${clientName}
<b>Менеджер:</b> ${managerName}
<b>Сумма:</b> ${new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}
<b>ID сделки:</b> ${dealId}
    `.trim();

    return this.sendMessage(message);
  }
  
  async sendNewClientNotification(clientId: string, clientName: string): Promise<TelegramNotificationResult> {
    const message = `
<b>👤 Новый клиент в CRM</b>

<b>Клиент:</b> ${clientName}
<b>ID клиента:</b> ${clientId}
    `.trim();

    return this.sendMessage(message);
  }
  
  async sendDeadlineNotification(options: TelegramNotificationOptions, hoursRemaining: number): Promise<TelegramNotificationResult> {
    const { taskId, taskTitle, dueDate, assigneeName, clientName, priority } = options;
    
    // Определяем иконку для приоритета
    let priorityIcon = '⚪️';
    let priorityText = 'Не указан';
    
    if (priority) {
      switch(priority) {
        case 'LOW':
          priorityIcon = '🟢';
          priorityText = 'Низкий';
          break;
        case 'MEDIUM':
          priorityIcon = '🟡';
          priorityText = 'Средний';
          break;
        case 'HIGH':
          priorityIcon = '🔴';
          priorityText = 'Высокий';
          break;
      }
    }
    
    const message = `
<b>⚠️ Приближается срок выполнения задачи</b>

<b>Задача:</b> ${taskTitle}
<b>Приоритет:</b> ${priorityIcon} ${priorityText}
<b>Ответственный:</b> ${assigneeName}
<b>Срок:</b> ${new Date(dueDate).toLocaleString()}
<b>Осталось времени:</b> ${hoursRemaining} ч.
${clientName ? `<b>Клиент:</b> ${clientName}` : ''}
<b>ID задачи:</b> ${taskId}
    `.trim();

    return this.sendMessage(message);
  }    async testConnection(): Promise<TelegramNotificationResult> {
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/telegram/test`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      
      return {
        success: data.success,
        error: data.success ? undefined : data.message
      };
    } catch (error) {
      console.error('Error testing telegram connection:', error);
      return {
        success: false,
        error: 'Ошибка при тестировании подключения к Telegram'
      };
    }
  }
}

export default new TelegramService();
