import { IsEmail, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Иван Иванов', description: 'Имя пользователя' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Пароль пользователя' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: 'Менеджер по продажам', description: 'Должность пользователя' })
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Роль пользователя' })
  @IsEnum(UserRole, { message: 'Неверная роль пользователя' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Статус активности пользователя' })
  @IsBoolean({ message: 'Статус активности должен быть boolean' })
  @IsOptional()
  isActive?: boolean;
}