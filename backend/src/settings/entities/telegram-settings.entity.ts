import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('telegram_settings')
export class TelegramSettings extends BaseEntity {
  @Column({ name: 'bot_token', nullable: true })
  botToken: string;
  
  @Column({ name: 'chat_id', nullable: true })
  chatId: string;
  
  @Column({ name: 'notify_new_clients', default: true })
  notifyNewClients: boolean;
  
  @Column({ name: 'notify_new_deals', default: true })
  notifyNewDeals: boolean;
  
  @Column({ name: 'notify_new_tasks', default: true })
  notifyNewTasks: boolean;
  
  @Column({ name: 'notify_task_deadlines', default: true })
  notifyTaskDeadlines: boolean;
  
  @Column({ name: 'is_active', default: false })
  isActive: boolean;
}