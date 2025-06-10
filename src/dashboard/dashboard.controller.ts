import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from '.';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Получение данных для дашборда' })
  @ApiResponse({ status: 200, description: 'Данные дашборда' })
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @ApiOperation({ summary: 'Получение последних задач' })
  @ApiResponse({ status: 200, description: 'Последние задачи' })
  @Get('latest-tasks')
  getLatestTasks(@Query('limit') limit: string = '5') {
    return this.dashboardService.getLatestTasks(parseInt(limit, 10));
  }

  @ApiOperation({ summary: 'Получение последних клиентов' })
  @ApiResponse({ status: 200, description: 'Последние клиенты' })
  @Get('latest-clients')
  getLatestClients(@Query('limit') limit: string = '5') {
    return this.dashboardService.getLatestClients(parseInt(limit, 10));
  }

  @ApiOperation({ summary: 'Получение последних сделок' })
  @ApiResponse({ status: 200, description: 'Последние сделки' })
  @Get('latest-deals')
  getLatestDeals(@Query('limit') limit: string = '5') {
    return this.dashboardService.getLatestDeals(parseInt(limit, 10));
  }

  @ApiOperation({ summary: 'Получение всех данных для дашборда в одном запросе' })
  @ApiResponse({ status: 200, description: 'Все данные дашборда' })
  @Get()
  async getAllDashboardData(@Query('limit') limit: string = '5') {
    const limitValue = parseInt(limit, 10);
    const stats = await this.dashboardService.getStats();
    const latestTasks = await this.dashboardService.getLatestTasks(limitValue);
    const latestClients = await this.dashboardService.getLatestClients(limitValue);
    const latestDeals = await this.dashboardService.getLatestDeals(limitValue);
    
    return {
      ...stats,
      latestTasks,
      latestClients,
      latestDeals
    };
  }
}
