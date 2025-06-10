import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientCompanyDto {
  @ApiProperty({ example: 'ООО "СтройТех"', description: 'Наименование компании клиента' })
  @IsNotEmpty({ message: 'Наименование компании не может быть пустым' })
  name: string;

  @ApiProperty({ example: '7701234567', description: 'ИНН компании' })
  @IsNotEmpty({ message: 'ИНН не может быть пустым' })
  inn: string;

  @ApiPropertyOptional({ example: '770101001', description: 'КПП компании' })
  @IsOptional()
  kpp?: string;

  @ApiProperty({ example: 'г. Москва, ул. Строительная, д. 15', description: 'Адрес компании' })
  @IsNotEmpty({ message: 'Адрес не может быть пустым' })
  address: string;

  @ApiPropertyOptional({ example: 'Р/С 40702810123456789012 в ПАО Сбербанк', description: 'Банковские реквизиты' })
  @IsOptional()
  bankDetails?: string;
}