import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Account } from './Account';

@Entity('identity_filters')
@Index(['userId', 'order'])
export class IdentityFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', array: true })
  accountIds: string[]; // Array of account IDs that belong to this filter

  @Column({ type: 'varchar', length: 7, default: '#3b82f6' })
  color: string; // Hex color code

  @Column({ type: 'integer' })
  order: number; // Display order

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.identityFilters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToMany(() => Account, { eager: true })
  @JoinTable({
    name: 'identity_filter_accounts',
    joinColumn: { name: 'filterId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'accountId', referencedColumnName: 'id' },
  })
  accounts: Account[];
}
