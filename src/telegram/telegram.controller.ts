import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('telegram')
@Controller('telegram')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @ApiOperation({ summary: 'Получить текущие настройки Telegram' })
  @ApiResponse({ status: 200, description: 'Настройки Telegram' })
  @Roles(UserRole.ADMIN)
  @Get('settings')
  getSettings() {
    return this.telegramService.getSettings();
  }

  @ApiOperation({ summary: 'Обновить настройки Telegram' })
  @ApiResponse({ status: 200, description: 'Настройки Telegram обновлены' })
  @Roles(UserRole.ADMIN)
  @Post('settings')
  updateSettings(@Body() settingsData: any) {
    return this.telegramService.updateSettings(settingsData);
  }

  @ApiOperation({ summary: 'Отправить тестовое сообщение' })
  @ApiResponse({ status: 200, description: 'Тестовое сообщение отправлено' })
  @Roles(UserRole.ADMIN)
  @Post('test-message')
  sendTestMessage() {
    return this.telegramService.sendTestMessage();
  }

  @ApiOperation({ summary: 'Проверить задачи с приближающимися сроками' })
  @ApiResponse({ status: 200, description: 'Проверка выполнена' })
  @Roles(UserRole.ADMIN)
  @Post('check-deadlines')
  checkTaskDeadlines() {
    return this.telegramService.checkTaskDeadlines();
  }

  @ApiOperation({ summary: 'Тестирование подключения к Telegram' })
  @ApiResponse({ status: 200, description: 'Результат тестирования' })
  @Roles(UserRole.ADMIN)
  @Post('test')
  testConnection() {
    return this.telegramService.sendTestMessage();
  }

  @ApiOperation({ summary: 'Отправить сообщение через Telegram' })
  @ApiResponse({ status: 200, description: 'Результат отправки' })
  @Post('send-message')
  async sendMessage(@Body() body: { message: string }) {
    const result = await this.telegramService.sendMessage(body.message);
    return { success: !!result, message: result ? 'Сообщение отправлено успешно' : 'Не удалось отправить сообщение' };
  }

  @ApiOperation({ summary: 'Отправить ежедневную сводку по задачам' })
  @ApiResponse({ status: 200, description: 'Сводка отправлена' })
  @Roles(UserRole.ADMIN)
  @Post('daily-summary')
  sendDailySummary() {
    return this.telegramService.sendDailySummary();
  }
}