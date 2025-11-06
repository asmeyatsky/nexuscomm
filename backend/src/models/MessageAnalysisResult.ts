/**
 * MessageAnalysisResult Entity
 * Stores AI analysis results for messages including sentiment, categorization, and suggestions.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Message } from './Message';
import { User } from './User';

@Entity('message_analysis_results')
@Index(['messageId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['sentiment', 'createdAt'])
export class MessageAnalysisResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  messageId: string;

  @Column({ type: 'uuid' })
  userId: string;

  // Sentiment Analysis
  @Column({ type: 'float' })
  sentimentPositive: number; // 0-1

  @Column({ type: 'float' })
  sentimentNeutral: number; // 0-1

  @Column({ type: 'float' })
  sentimentNegative: number; // 0-1

  @Column({ type: 'varchar', length: 50 })
  sentiment: 'positive' | 'neutral' | 'negative';

  @Column({ type: 'float' })
  sentimentConfidence: number; // 0-1

  // Categorization
  @Column({ type: 'varchar', length: 100 })
  primaryCategory: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
  secondaryCategories: string[];

  @Column({ type: 'float' })
  categoryConfidence: number; // 0-1

  // Themes
  @Column({ type: 'jsonb', default: '[]' })
  themes: Array<{
    name: string;
    relevance: number;
  }>;

  // Key Insights
  @Column({ type: 'text', array: true, default: '{}' })
  keyInsights: string[];

  // Summary (optional)
  @Column({ type: 'text', nullable: true })
  summary: string;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  analyzedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Message, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
