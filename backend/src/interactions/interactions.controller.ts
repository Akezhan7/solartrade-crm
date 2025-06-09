import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('interactions')
@Controller('interactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @ApiOperation({ summary: 'Создание нового взаимодействия с клиентом' })
  @ApiResponse({ status: 201, description: 'Взаимодействие успешно создано' })
  @Post()
  create(@Body() createInteractionDto: any, @Req() req) {
    return this.interactionsService.create(createInteractionDto, req.user.id);
  }

  @ApiOperation({ summary: 'Получение списка всех взаимодействий' })
  @ApiResponse({ status: 200, description: 'Список взаимодействий' })
  @Get()
  findAll() {
    return this.interactionsService.findAll();
  }

  @ApiOperation({ summary: 'Получение взаимодействия по ID' })
  @ApiResponse({ status: 200, description: 'Данные взаимодействия' })
  @ApiResponse({ status: 404, description: 'Взаимодействие не найдено' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interactionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Получение всех взаимодействий с конкретным клиентом' })
  @ApiResponse({ status: 200, description: 'Список взаимодействий клиента' })
  @ApiResponse({ status: 404, description: 'Клиент не найден' })
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.interactionsService.findByClient(clientId);
  }
  @ApiOperation({ summary: 'Обновление взаимодействия' })
  @ApiResponse({ status: 200, description: 'Взаимодействие обновлено' })
  @ApiResponse({ status: 404, description: 'Взаимодействие не найдено' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInteractionDto: any) {
    return this.interactionsService.update(id, updateInteractionDto);
  }

  @ApiOperation({ summary: 'Удаление взаимодействия' })
  @ApiResponse({ status: 200, description: 'Взаимодействие удалено' })
  @ApiResponse({ status: 404, description: 'Взаимодействие не найдено' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.interactionsService.remove(id);
  }

  @ApiOperation({ summary: 'Получение статистики по взаимодействиям за период' })
  @ApiResponse({ status: 200, description: 'Статистика по взаимодействиям' })
  @Get('stats')
  getInteractionStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    return this.interactionsService.getInteractionStats(start, end);
  }
}