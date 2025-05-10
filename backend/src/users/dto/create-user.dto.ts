import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Иван Иванов', description: 'Имя пользователя' })
  @IsNotEmpty({ message: 'Имя пользователя не может быть пустым' })
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Пароль пользователя' })
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @ApiPropertyOptional({ example: 'Менеджер по продажам', description: 'Должность пользователя' })
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.SALES, description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Неверная роль пользователя' })
  role?: UserRole;
}