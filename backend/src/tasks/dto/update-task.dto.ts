import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ example: 'Подготовить коммерческое предложение', description: 'Название задачи' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Подготовить КП для клиента X на основе...', description: 'Описание задачи' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS, description: 'Статус задачи' })
  @IsEnum(TaskStatus, { message: 'Неверный статус задачи' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2025-05-10T00:00:00Z', description: 'Срок выполнения задачи' })
  @IsDateString({}, { message: 'Неверный формат даты' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID ответственного за выполнение' })
  @IsUUID('4', { message: 'ID ответственного должен быть в формате UUID' })
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID связанного клиента' })
  @IsUUID('4', { message: 'ID клиента должен быть в формате UUID' })
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002', description: 'ID связанной сделки' })
  @IsUUID('4', { message: 'ID сделки должен быть в формате UUID' })
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ example: '2025-05-08T14:30:00Z', description: 'Дата выполнения задачи' })
  @IsDateString({}, { message: 'Неверный формат даты' })
  @IsOptional()
  completedAt?: string;

  @ApiProperty({ description: 'Флаг завершения задачи', required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}