import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';

export enum InteractionType {
  PHONE_CALL = 'PHONE_CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  MESSENGER = 'MESSENGER',
  OTHER = 'OTHER',
}

@Entity('interactions')
export class Interaction extends BaseEntity {
  @Column({
    type: 'enum',
    enum: InteractionType,
    default: InteractionType.OTHER,
  })
  type: InteractionType;

  @Column()
  content: string;

  @Column({ nullable: true })
  result: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Client, client => client.interactions)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;
}