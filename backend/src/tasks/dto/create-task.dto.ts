import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskStatus } from '@prisma/client';

// Определяем перечисление TaskPriority локально, так как может быть проблема с импортом из @prisma/client
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Название задачи' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Подробное описание задачи', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Статус задачи',
    enum: TaskStatus,
    default: TaskStatus.NEW,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ 
    description: 'Приоритет задачи',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    required: false 
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ description: 'Срок выполнения задачи' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'ID ответственного пользователя' })
  @IsNotEmpty()
  @IsUUID()
  assigneeId: string;

  @ApiProperty({ description: 'ID клиента, с которым связана задача', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'ID сделки, с которой связана задача', required: false })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiProperty({ description: 'Дата завершения задачи', required: false })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}