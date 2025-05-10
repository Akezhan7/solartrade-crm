import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Public } from './telegram-webhook.controller';

@Controller('telegram-test-ui')
export class TelegramTestUIController {
  @Get()
  @Public()
  async getTestPage(@Res() response: Response) {
    try {
      const filePath = path.join(__dirname, '../test/telegram-test.html');
      
      if (fs.existsSync(filePath)) {
        response.setHeader('Content-Type', 'text/html');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        response.send(fileContent);
      } else {
        response.status(404).json({ error: 'Test page not found' });
      }
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }
}
