import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class WebhookDto {
  @ApiProperty({ description: 'Telegram update object' })
  @IsObject()
  update_id: number;

  @ApiProperty({ description: 'Message data', required: false })
  @IsOptional()
  @IsObject()
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };

  @ApiProperty({ description: 'Callback query data', required: false })
  @IsOptional()
  @IsObject()
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
        first_name: string;
        username?: string;
        type: string;
      };
      date: number;
      text: string;
    };
    data: string;
  };
}
