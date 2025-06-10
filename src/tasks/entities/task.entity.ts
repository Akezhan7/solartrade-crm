import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { Deal } from '../../deals/entities/deal.entity';

export enum TaskStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @ApiProperty({
    description: 'Название задачи',
    example: 'Позвонить клиенту и уточнить детали заказа',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Описание задачи',
    example: 'Необходимо уточнить желаемый тип солнечных панелей и количество',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Срок выполнения задачи',
    example: '2025-05-20T14:00:00Z',
  })
  @Column({ type: 'timestamp' })
  dueDate: Date;

  @ApiProperty({
    description: 'Статус задачи',
    enum: TaskStatus,
    example: TaskStatus.NEW,
  })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.NEW,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Приоритет задачи (от 1 до 5)',
    example: 3,
  })
  @Column({ default: 3 })
  priority: number;

  @ApiProperty({
    description: 'Дата завершения задачи',
    example: '2025-05-18T15:30:00Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ApiProperty({
    description: 'ID ответственного сотрудника',
    example: '9e391faf-c0b1-4b0e-9a36-8520afb974f4',
  })
  @Column()
  assigneeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ApiProperty({
    description: 'ID сотрудника, создавшего задачу',
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
  })
  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ApiProperty({
    description: 'ID клиента, связанного с задачей',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @Column({ nullable: true })
  clientId?: string;

  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client?: Client;

  @ApiProperty({
    description: 'ID сделки, связанной с задачей',
    example: '3d54f06c-51f1-4b9b-8c7c-6d86d20a4a0b',
  })
  @Column({ nullable: true })
  dealId?: string;

  @ManyToOne(() => Deal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dealId' })
  deal?: Deal;

  @Column({ default: false })
  reminderSent: boolean;
}