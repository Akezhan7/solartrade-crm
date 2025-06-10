import { IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty({ example: 'Установка солнечных панелей', description: 'Название сделки' })
  @IsNotEmpty({ message: 'Название сделки не может быть пустым' })
  title: string;

  @ApiPropertyOptional({ example: 'Установка панелей на крышу офисного здания', description: 'Описание сделки' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 450000, description: 'Сумма сделки' })
  @IsNumber({}, { message: 'Сумма должна быть числом' })
  @Min(0, { message: 'Сумма не может быть отрицательной' })
  amount: number;

  @ApiPropertyOptional({ example: 'RUB', description: 'Валюта сделки', default: 'RUB' })
  @IsOptional()
  currency?: string;

  @ApiProperty({ enum: DealStatus, example: DealStatus.NEW, description: 'Статус сделки' })
  @IsEnum(DealStatus, { message: 'Неверный статус сделки' })
  status: DealStatus;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID клиента' })
  @IsUUID('4', { message: 'ID клиента должен быть в формате UUID' })
  @IsNotEmpty({ message: 'ID клиента не может быть пустым' })
  clientId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID ответственного менеджера' })
  @IsUUID('4', { message: 'ID менеджера должен быть в формате UUID' })
  @IsNotEmpty({ message: 'ID менеджера не может быть пустым' })
  managerId: string;

  @ApiPropertyOptional({ example: '2025-12-15T00:00:00Z', description: 'Ожидаемая дата закрытия сделки' })
  @IsDateString({}, { message: 'Неверный формат даты' })
  @IsOptional()
  estimatedClosingDate?: string;

  @ApiPropertyOptional({ example: 'Солнечные панели 10кВт + инвертор', description: 'Информация о продукте' })
  @IsOptional()
  productInfo?: string;

  @ApiPropertyOptional({ example: 70, description: 'Вероятность заключения сделки в процентах', default: 50 })
  @IsNumber({}, { message: 'Вероятность должна быть числом' })
  @Min(0, { message: 'Вероятность не может быть отрицательной' })
  @IsOptional()
  probability?: number;

  @ApiPropertyOptional({ example: 'Сайт', description: 'Источник сделки' })
  @IsOptional()
  source?: string;
}