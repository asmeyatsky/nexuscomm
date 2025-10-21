import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Message } from './Message';
import { IdentityFilter } from './IdentityFilter';

export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'instagram_dm' | 'linkedin_dm' | 'telegram' | 'slack';

@Entity('accounts')
@Unique(['userId', 'channelType', 'identifier'])
@Index(['userId', 'channelType'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['whatsapp', 'sms', 'email', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'],
  })
  channelType: ChannelType;

  @Column({ type: 'varchar', length: 255 })
  identifier: string; // phone number, email address, username

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 1000, nullable: true, select: false })
  accessToken: string;

  @Column({ type: 'varchar', length: 1000, nullable: true, select: false })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'integer', default: 0 })
  syncStatus: number; // 0: not synced, 1: syncing, 2: synced, 3: error

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @CreateDateColumn()
  connectedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Message, (message) => message.senderAccount)
  sentMessages: Message[];

  @OneToMany(() => IdentityFilter, (filter) => filter.account)
  identityFilters: IdentityFilter[];
}
