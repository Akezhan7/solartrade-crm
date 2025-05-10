import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';

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
  async sendTaskNotification(task: TaskWithPriority): Promise<void> {
    // Здесь будет код для отправки уведомления
    const formattedDate = new Date(task.dueDate).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Определяем приоритет
    let priorityText = 'Средний';
    let priorityEmoji = '🟠';
    
    if (task.priority === TaskPriority.HIGH) {
      priorityText = 'Высокий';
      priorityEmoji = '🔴';
    } else if (task.priority === TaskPriority.MEDIUM) {
      priorityText = 'Средний';
      priorityEmoji = '🟠';
    } else if (task.priority === TaskPriority.LOW) {
      priorityText = 'Низкий';
      priorityEmoji = '🟢';
    }
    
    const message = `
🔔 <b>Новая задача в CRM</b>

<b>Задача:</b> ${task.title}
<b>Срок:</b> ${formattedDate}
<b>Приоритет:</b> ${priorityText} ${priorityEmoji}
<b>ID задачи:</b> ${task.id}
    `.trim();
    
    // Отправить сообщение через Telegram API
    // Этот код будет добавлен позже
  }
}
