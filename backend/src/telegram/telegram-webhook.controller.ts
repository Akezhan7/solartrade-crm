import { Body, Controller, Get, Post, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WebhookDto } from './dto/webhook.dto';

// Локальное определение декоратора Public
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('telegram-webhook')
@Controller('telegram-webhook')
export class TelegramWebhookController {
  constructor(private readonly telegramService: TelegramService) {}

  @ApiOperation({ summary: 'Endpoint for Telegram webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @Post()
  @Public()
  async processWebhook(@Body() webhookData: WebhookDto) {
    return this.telegramService.processWebhook(webhookData);
  }

  @ApiOperation({ summary: 'Set webhook for Telegram bot' })
  @ApiResponse({ status: 200, description: 'Webhook set' })
  @Get('set')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async setWebhook() {
    return this.telegramService.setWebhook();
  }
}
