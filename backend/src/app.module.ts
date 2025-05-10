import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { DealsModule } from './deals/deals.module';
import { TasksModule } from './tasks/tasks.module';
import { InteractionsModule } from './interactions/interactions.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Загрузка конфигураций из .env файла
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Настройка планировщика задач
    ScheduleModule.forRoot(),
    
    // Подключение Prisma
    PrismaModule,    // Импортируем все модули приложения
    AuthModule,
    UsersModule,
    ClientsModule,
    DealsModule,
    TasksModule,
    InteractionsModule,
    SettingsModule,
    HealthModule,
    HealthModule,
    TelegramModule,
    DashboardModule,
  ],
})
export class AppModule {}