import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ClientCompany } from './client-company.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Deal } from '../../deals/entities/deal.entity';
import { Interaction } from '../../interactions/entities/interaction.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  name: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  description: string;

  @OneToOne(() => ClientCompany, {
    cascade: true,
    eager: false,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  company: ClientCompany;

  @OneToMany(() => Task, task => task.client)
  tasks: Task[];

  @OneToMany(() => Deal, deal => deal.client)
  deals: Deal[];

  @OneToMany(() => Interaction, interaction => interaction.client, {
    cascade: true,
  })
  interactions: Interaction[];
}