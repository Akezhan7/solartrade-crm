import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [TelegramModule, ContactsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}