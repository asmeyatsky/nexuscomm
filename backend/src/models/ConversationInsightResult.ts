/**
 * ConversationInsightResult
 * TypeORM entity for storing conversation analytics and insights.
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

@Entity('conversation_insights')
@Index(['conversationId', 'periodStart'])
@Index(['conversationId', 'createdAt'])
@Index(['healthStatus'])
export class ConversationInsightResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column({ type: 'int' })
  totalMessages: number;

  @Column({ type: 'int' })
  uniqueParticipants: number;

  @Column({ type: 'int' })
  averageResponseTimeMs: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  averageSentiment: 'positive' | 'neutral' | 'negative';

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  sentimentScore: number; // 0-1

  @Column({ type: 'int' })
  healthScore: number; // 0-100

  @Column({
    type: 'varchar',
    length: 20,
  })
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';

  @Column('simple-array')
  healthReasons: string[];

  @Column('simple-array')
  recommendations: string[];

  @Column('simple-json')
  topTopics: Array<{
    topic: string;
    messageCount: number;
    percentage: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;

  @Column('simple-json')
  participantStats: Array<{
    userId: string;
    messageCount: number;
    averageMessageLength: number;
    responseTimeMs: number;
    engagementLevel: number;
  }>;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  engagementTrend?: 'increasing' | 'decreasing' | 'stable';

  @Column({ type: 'int', nullable: true })
  trendPercent?: number; // -100 to 100

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}
