import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('client_companies')
export class ClientCompany extends BaseEntity {
  @Column()
  name: string;
  
  @Column()
  inn: string;
  
  @Column({ nullable: true })
  kpp: string;
  
  @Column()
  address: string;
  
  @Column({ nullable: true })
  bankDetails: string;
}