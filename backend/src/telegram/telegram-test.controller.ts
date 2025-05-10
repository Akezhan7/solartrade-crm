import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from './telegram-webhook.controller';

@Controller('telegram-test')
export class TelegramTestController {
  private readonly logger = new Logger(TelegramTestController.name);
  
  constructor(private readonly telegramService: TelegramService) {}

  @Get('check-connection')
  @Public()
  async checkConnection() {
    this.logger.log('Запрос на проверку соединения с Telegram API');
    return this.telegramService.checkTelegramConnection();
  }

  @Post('send-test-message')
  @Public()
  async sendTestMessage() {
    this.logger.log('Запрос на отправку тестового сообщения');
    return this.telegramService.sendTestMessage();
  }

  @Post('check-deadlines')
  @Public()
  async testCheckDeadlines() {
    this.logger.log('Запрос на тестовую проверку задач с приближающимися сроками');
    return this.telegramService.checkTaskDeadlines();
  }

  @Post('daily-summary')
  @Public()
  async testDailySummary() {
    this.logger.log('Запрос на тестовую отправку ежедневной сводки');
    return this.telegramService.sendDailySummary();
  }

  @Post('custom-message')
  @Public()
  async sendCustomMessage(@Body() data: { message: string }) {
    this.logger.log('Запрос на отправку произвольного сообщения');
    if (!data || !data.message) {
      return { success: false, message: 'Не указан текст сообщения' };
    }

    const success = await this.telegramService.sendMessage(data.message);
    
    return {
      success,
      message: success
        ? 'Сообщение успешно отправлено'
        : 'Не удалось отправить сообщение. Проверьте настройки Telegram и журнал ошибок.',
    };
  }
}
