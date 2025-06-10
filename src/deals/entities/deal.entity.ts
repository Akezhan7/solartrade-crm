import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

export enum DealStatus {
  NEW = 'new',
  NEGOTIATION = 'negotiation',
  PROPOSAL = 'proposal',
  AGREEMENT = 'agreement',
  PAID = 'paid',
  INSTALLATION = 'installation',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('deals')
export class Deal extends BaseEntity {
  @ApiProperty({
    description: 'Название сделки',
    example: 'Установка солнечных панелей для дома',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Описание сделки',
    example: 'Монтаж 10 солнечных панелей на крыше дома, подключение к электросети',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Сумма сделки',
    example: 15000,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @ApiProperty({
    description: 'Валюта сделки',
    example: 'RUB',
  })
  @Column({ default: 'RUB' })
  currency: string;

  @ApiProperty({
    description: 'Статус сделки',
    enum: DealStatus,
    example: DealStatus.NEW,
  })
  @Column({
    type: 'enum',
    enum: DealStatus,
    default: DealStatus.NEW,
  })
  status: DealStatus;

  @ApiProperty({
    description: 'ID клиента, связанного со сделкой',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @Column()
  clientId: string;

  @ManyToOne(() => Client, client => client.deals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ApiProperty({
    description: 'ID ответственного сотрудника',
    example: '9e391faf-c0b1-4b0e-9a36-8520afb974f4',
  })
  @Column()
  managerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'managerId' })
  manager: User;

  @ApiProperty({
    description: 'Предполагаемая дата закрытия сделки',
    example: '2025-07-15',
  })
  @Column({ type: 'date', nullable: true })
  estimatedClosingDate?: Date;

  @ApiProperty({
    description: 'Дата фактического закрытия сделки',
    example: '2025-07-20',
  })
  @Column({ type: 'date', nullable: true })
  actualClosingDate?: Date;

  @ApiProperty({
    description: 'Информация о продукте или услуге',
    example: 'Солнечные панели SolarX Pro - 10 шт., инвертор PowerMax - 1 шт.',
  })
  @Column({ type: 'text', nullable: true })
  productInfo?: string;

  @ApiProperty({
    description: 'Вероятность закрытия (в процентах)',
    example: 70,
  })
  @Column({ default: 50 })
  probability: number;

  @ApiProperty({
    description: 'Источник сделки',
    example: 'Реклама в Instagram',
  })
  @Column({ nullable: true })
  source?: string;
}