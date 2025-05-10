import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('deals')
@Controller('deals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @ApiOperation({ summary: 'Создание новой сделки' })
  @ApiResponse({ status: 201, description: 'Сделка успешно создана' })
  @Post()
  create(@Body() createDealDto: CreateDealDto, @Req() req) {
    return this.dealsService.create(createDealDto, req.user.id);
  }

  @ApiOperation({ summary: 'Получение списка всех сделок' })
  @ApiResponse({ status: 200, description: 'Список сделок' })
  @Get()
  findAll() {
    return this.dealsService.findAll();
  }

  @ApiOperation({ summary: 'Получение сделки по ID' })
  @ApiResponse({ status: 200, description: 'Данные сделки' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @ApiOperation({ summary: 'Обновление данных сделки' })
  @ApiResponse({ status: 200, description: 'Данные сделки обновлены' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto, @Req() req) {
    return this.dealsService.update(id, updateDealDto, req.user.id);
  }

  @ApiOperation({ summary: 'Удаление сделки' })
  @ApiResponse({ status: 200, description: 'Сделка удалена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }

  @ApiOperation({ summary: 'Получение статистики по сделкам за период' })
  @ApiResponse({ status: 200, description: 'Статистика сделок' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('stats/period')
  getStatsByPeriod(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    return this.dealsService.getStatsByPeriod(start, end);
  }
}