import { IsOptional, IsNotEmpty, IsEmail, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Иван', description: 'Имя контактного лица' })
  @IsOptional()
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Петров', description: 'Фамилия контактного лица' })
  @IsOptional()
  @IsNotEmpty({ message: 'Фамилия не может быть пустой' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+7 (123) 456-78-90', description: 'Телефон контактного лица' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ivan@example.com', description: 'Email контактного лица' })
  @IsOptional()
  @IsEmail({}, { message: 'Неверный формат email' })
  email?: string;

  @ApiPropertyOptional({ example: '1980-01-01', description: 'Дата рождения контактного лица' })
  @IsOptional()
  @IsDateString({}, { message: 'Неверный формат даты' })
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Генеральный директор', description: 'Должность контактного лица' })
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: 'Дополнительное описание или заметки' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID клиента' })
  @IsOptional()
  @IsNotEmpty({ message: 'ID клиента не может быть пустым' })
  clientId?: string;
}
