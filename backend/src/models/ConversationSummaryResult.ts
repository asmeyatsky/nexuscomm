/**
 * ConversationSummaryResult
 * TypeORM entity for storing conversation summaries.
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

@Entity('conversation_summaries')
@Index(['conversationId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['summaryLength'])
export class ConversationSummaryResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column()
  userId: string; // User who requested summary

  @Column('simple-array')
  messageIds: string[];

  @Column({ type: 'varchar', length: 10 })
  summaryLength: 'brief' | 'standard' | 'detailed';

  @Column('text')
  summary: string;

  @Column('simple-array')
  keyPoints: string[];

  @Column('simple-array')
  mainTopics: string[];

  @Column('simple-array')
  participants: string[];

  @Column({ type: 'int' })
  messageCount: number;

  @Column({ type: 'int' })
  wordCount: number;

  @Column({ type: 'int' })
  participantCount: number;

  @Column({ type: 'int' })
  topicCount: number;

  @Column({ type: 'int', nullable: true })
  ttlMinutes: number; // Cache TTL in minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // When this summary expires from cache

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
