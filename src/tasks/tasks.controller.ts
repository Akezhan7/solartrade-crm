import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Создание новой задачи' })
  @ApiResponse({ status: 201, description: 'Задача успешно создана' })
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }
  @ApiOperation({ summary: 'Получение списка всех задач с возможностью фильтрации' })
  @ApiResponse({ status: 200, description: 'Список задач' })  @Get()
  findAll(
    @Req() req,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('clientId') clientId?: string,
    @Query('dealId') dealId?: string,
    @Query('dueDate') dueDate?: string,
    @Query('overdue') overdue?: string,
  ) {
    const filters = {
      status,
      assigneeId,
      clientId,
      dealId,
      dueDate,
      overdue,
    };
    return this.tasksService.findAll(filters, req.user);
  }
  @ApiOperation({ summary: 'Получение задачи по ID' })
  @ApiResponse({ status: 200, description: 'Данные задачи' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.tasksService.findOne(id, req.user);
  }
  @ApiOperation({ summary: 'Обновление данных задачи' })
  @ApiResponse({ status: 200, description: 'Данные задачи обновлены' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @ApiOperation({ summary: 'Удаление задачи' })
  @ApiResponse({ status: 200, description: 'Задача удалена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @ApiOperation({ summary: 'Получение задач пользователя на сегодня' })
  @ApiResponse({ status: 200, description: 'Список задач на сегодня' })
  @Get('user/today')
  getTasksForToday(@Req() req) {
    return this.tasksService.getTasksForToday(req.user.id);
  }

  @ApiOperation({ summary: 'Получение просроченных задач пользователя' })
  @ApiResponse({ status: 200, description: 'Список просроченных задач' })
  @Get('user/overdue')
  getOverdueTasks(@Req() req) {
    return this.tasksService.getOverdueTasks(req.user.id);
  }

  @ApiOperation({ summary: 'Получение предстоящих задач пользователя' })
  @ApiResponse({ status: 200, description: 'Список предстоящих задач' })
  @Get('user/upcoming')
  getUpcomingTasks(@Req() req, @Query('days') days?: number) {
    return this.tasksService.getUpcomingTasks(req.user.id, days ? parseInt(days.toString()) : 7);
  }
}