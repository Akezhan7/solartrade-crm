import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateClientCompanyDto } from './create-client-company.dto';

export class CreateClientDto {
  @ApiProperty({ example: 'ООО "СтройТех"', description: 'Имя или название клиента' })
  @IsNotEmpty({ message: 'Имя клиента не может быть пустым' })
  name: string;

  @ApiProperty({ example: '+7 (495) 123-45-67', description: 'Телефон клиента' })
  @IsNotEmpty({ message: 'Телефон не может быть пустым' })
  phone: string;

  @ApiProperty({ example: 'client@example.com', description: 'Email клиента' })
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

  @ApiPropertyOptional({ description: 'Дополнительное описание или заметки' })
  @IsOptional()
  description?: string;
  @ApiPropertyOptional({ type: CreateClientCompanyDto, description: 'Данные о компании клиента' })
  @IsOptional()
  company?: CreateClientCompanyDto;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID менеджера, ответственного за клиента' })
  @IsOptional()
  managerId?: string;
}