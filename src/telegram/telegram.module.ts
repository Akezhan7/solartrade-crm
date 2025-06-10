import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramTestController } from './telegram-test.controller';
import { TelegramTestUIController } from './telegram-test-ui.controller';
import { TelegramSchedulerService } from './services/telegram-scheduler.service';

@Module({
  controllers: [
    TelegramController, 
    TelegramWebhookController, 
    TelegramTestController,
    TelegramTestUIController
  ],
  providers: [TelegramService, TelegramSchedulerService],
  exports: [TelegramService],
})
export class TelegramModule {}