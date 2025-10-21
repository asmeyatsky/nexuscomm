import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Conversation } from './Conversation';
import { Account } from './Account';

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['externalId', 'channelType'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  senderAccountId: string;

  @Column({ type: 'varchar', length: 255 })
  senderExternalId: string;

  @Column({ type: 'varchar', length: 255 })
  senderName: string;

  @Column({ type: 'text', nullable: true })
  senderAvatar: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ['whatsapp', 'sms', 'email', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'],
  })
  channelType: string;

  @Column({ type: 'varchar', length: 500 })
  externalId: string; // ID from the platform

  @Column({ type: 'varchar', length: 500, nullable: true })
  externalThreadId: string;

  @Column({ type: 'text', array: true, default: '{}' })
  mediaUrls: string[];

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: ['inbound', 'outbound'],
  })
  direction: 'inbound' | 'outbound';

  @Column({ type: 'varchar', length: 50, default: 'sent' })
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'queued';

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => Account, (account) => account.sentMessages, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'senderAccountId' })
  senderAccount: Account;
}
