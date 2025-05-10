import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsObject, IsOptional } from 'class-validator';

// Определение типа для пользователя Telegram
class TelegramUser {
  @ApiProperty({ description: 'ID пользователя в Telegram' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Имя пользователя в Telegram (если указано)' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ description: 'Фамилия пользователя в Telegram (если указано)' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ description: 'Username пользователя в Telegram (если указано)' })
  @IsOptional()
  @IsString()
  username?: string;
}

// Определение типа для сообщения от Telegram
class TelegramMessage {
  @ApiProperty({ description: 'ID сообщения' })
  @IsNumber()
  message_id: number;

  @ApiProperty({ description: 'Информация об отправителе' })
  @IsObject()
  from: TelegramUser;

  @ApiProperty({ description: 'Информация о чате' })
  @IsObject()
  chat: {
    id: number;
    type: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    title?: string;
  };

  @ApiProperty({ description: 'Дата отправки сообщения (Unix timestamp)' })
  @IsNumber()
  date: number;

  @ApiProperty({ description: 'Текст сообщения (если это текстовое сообщение)' })
  @IsString()
  @IsOptional()
  text?: string;
}

// Основной класс для веб-хука от Telegram
export class TelegramWebhookDto {
  @ApiProperty({ description: 'Идентификатор обновления' })
  @IsNotEmpty()
  @IsNumber()
  update_id: number;

  @ApiProperty({ description: 'Полученное сообщение', required: false })
  @IsOptional()
  @IsObject()
  message?: TelegramMessage;
}
