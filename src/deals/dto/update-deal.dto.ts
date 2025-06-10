import { IsOptional, IsNumber, IsEnum, Min, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DealStatus } from '@prisma/client';

export class UpdateDealDto {
  @ApiPropertyOptional({ example: 'Установка солнечных панелей', description: 'Название сделки' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Установка панелей на крышу офисного здания', description: 'Описание сделки' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 450000, description: 'Сумма сделки' })
  @IsNumber({}, { message: 'Сумма должна быть числом' })
  @Min(0, { message: 'Сумма не может быть отрицательной' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: 'RUB', description: 'Валюта сделки' })
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: DealStatus, example: DealStatus.NEGOTIATION, description: 'Статус сделки' })
  @IsEnum(DealStatus, { message: 'Неверный статус сделки' })
  @IsOptional()
  status?: DealStatus;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID клиента' })
  @IsUUID('4', { message: 'ID клиента должен быть в формате UUID' })
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'ID ответственного менеджера' })
  @IsUUID('4', { message: 'ID менеджера должен быть в формате UUID' })
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ example: '2025-12-15T00:00:00Z', description: 'Ожидаемая дата закрытия сделки' })
  @IsDateString({}, { message: 'Неверный формат даты' })
  @IsOptional()
  estimatedClosingDate?: string;

  @ApiPropertyOptional({ example: '2025-12-20T00:00:00Z', description: 'Фактическая дата закрытия сделки' })
  @IsDateString({}, { message: 'Неверный формат даты' })
  @IsOptional()
  actualClosingDate?: string;

  @ApiPropertyOptional({ example: 'Солнечные панели 10кВт + инвертор', description: 'Информация о продукте' })
  @IsOptional()
  productInfo?: string;

  @ApiPropertyOptional({ example: 70, description: 'Вероятность заключения сделки в процентах' })
  @IsNumber({}, { message: 'Вероятность должна быть числом' })
  @Min(0, { message: 'Вероятность не может быть отрицательной' })
  @IsOptional()
  probability?: number;

  @ApiPropertyOptional({ example: 'Рекомендация', description: 'Источник сделки' })
  @IsOptional()
  source?: string;
}