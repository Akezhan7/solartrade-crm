import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: 'Проверка состояния сервиса' })
  @ApiResponse({ status: 200, description: 'Сервис работает нормально' })
  @Get()
  async healthCheck() {
    try {
      // Проверяем подключение к базе данных
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected'
        },
        api: {
          status: 'running'
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'error',
          message: error.message
        },
        api: {
          status: 'running'
        }
      };
    }
  }
}
