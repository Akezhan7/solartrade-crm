import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramService } from '../telegram.service';

@Injectable()
export class TelegramSchedulerService {
  private readonly logger = new Logger(TelegramSchedulerService.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Проверка задач с приближающимися сроками выполнения
   * Запускается каждый час в 00 минут
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleTaskDeadlineCheck() {
    this.logger.log('Запуск проверки задач с приближающимися сроками');

    try {
      const result = await this.telegramService.checkTaskDeadlines();
      
      if (result.success) {
        this.logger.log(`Проверка завершена: отправлено ${result.sent} уведомлений, ошибок: ${result.errors}`);
      } else {
        this.logger.error('Ошибка при проверке задач с приближающимися сроками');
      }
    } catch (error) {
      this.logger.error(`Ошибка при проверке задач: ${error.message}`);
    }
  }
  /**
   * Ежедневная сводка по активным задачам
   * Запускается каждый день в 09:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailySummary() {
    this.logger.log('Отправка ежедневной сводки по задачам');
    
    try {
      const result = await this.telegramService.sendDailySummary();
      
      if (result.success && result.sent) {
        this.logger.log('Ежедневная сводка по задачам успешно отправлена');
      } else if (result.success && !result.sent) {
        this.logger.log('Ежедневная сводка не отправлена: уведомления отключены или не настроены');
      } else {
        this.logger.error('Ошибка при отправке ежедневной сводки по задачам');
      }
    } catch (error) {
      this.logger.error(`Ошибка при отправке ежедневной сводки: ${error.message}`);
    }
  }
}
