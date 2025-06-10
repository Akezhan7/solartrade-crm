import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Получить настройки компании' })
  @ApiResponse({ status: 200, description: 'Настройки компании' })
  @Get('company')
  getCompanySettings() {
    return this.settingsService.getCompanySettings();
  }

  @ApiOperation({ summary: 'Обновить настройки компании' })
  @ApiResponse({ status: 200, description: 'Настройки компании обновлены' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('company')
  updateCompanySettings(@Body() companyData: any) {
    return this.settingsService.updateCompanySettings(companyData);
  }

  @ApiOperation({ summary: 'Получить пользовательские настройки' })
  @ApiResponse({ status: 200, description: 'Пользовательские настройки' })
  @Get('user')
  getUserSettings(@Req() req: any) {
    return this.settingsService.getUserSettings(req.user.sub);
  }

  @ApiOperation({ summary: 'Обновить пользовательские настройки' })
  @ApiResponse({ status: 200, description: 'Пользовательские настройки обновлены' })
  @Post('user')
  updateUserSettings(@Req() req: any, @Body() settingsData: any) {
    return this.settingsService.updateUserSettings(req.user.sub, settingsData);
  }

  @ApiOperation({ summary: 'Получить системные настройки' })
  @ApiResponse({ status: 200, description: 'Системные настройки' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('system')
  getSystemSettings() {
    return this.settingsService.getSystemSettings();
  }

  @ApiOperation({ summary: 'Обновить системные настройки' })
  @ApiResponse({ status: 200, description: 'Системные настройки обновлены' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('system')
  updateSystemSettings(@Body() settingsData: any) {
    return this.settingsService.updateSystemSettings(settingsData);
  }
}