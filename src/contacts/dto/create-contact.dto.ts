import { IsNotEmpty, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Иван', description: 'Имя контактного лица' })
  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  firstName: string;

  @ApiProperty({ example: 'Петров', description: 'Фамилия контактного лица' })
  @IsNotEmpty({ message: 'Фамилия не может быть пустой' })
  lastName: string;

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

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID клиента' })
  @IsNotEmpty({ message: 'ID клиента не может быть пустым' })
  clientId: string;
}
