/**
 * ScheduledMessage
 * TypeORM entity for managing scheduled messages with AI recommendations.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './Conversation';
import { User } from './User';

@Entity('scheduled_messages')
@Index(['conversationId', 'scheduledTime'])
@Index(['userId', 'status'])
@Index(['status', 'scheduledTime'])
@Index(['createdAt'])
export class ScheduledMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  userId: string; // User who will send the message

  @Column('text')
  content: string;

  @Column({ type: 'timestamp' })
  scheduledTime: Date; // When to send

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed' | 'cancelled'; // Message status

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  urgency?: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  engagementScore?: number; // AI recommendation confidence (0-1)

  @Column('text', { nullable: true })
  schedulingReason?: string; // Why this time was recommended

  @Column('simple-array', { nullable: true })
  alternativeTimeWindows?: string[]; // Other recommended times

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON metadata for scheduling context

  @Column({ type: 'int', nullable: true })
  retryCount: number = 0;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string; // Error if failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date; // When message was actually sent

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
