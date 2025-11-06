/**
 * AIUsageLog Entity
 * Logs all AI service operations for auditing and cost tracking.
 * Enables detailed analysis of AI feature usage patterns.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export type AIOperation =
  | 'analyze_sentiment'
  | 'categorize_message'
  | 'generate_suggestions'
  | 'semantic_search'
  | 'generate_embedding';

export type AIOperationStatus = 'success' | 'failure' | 'rate_limited' | 'quota_exceeded';

@Entity('ai_usage_logs')
@Index(['userId', 'createdAt'])
@Index(['operation', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['createdAt'])
export class AIUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  // Operation Details
  @Column({
    type: 'enum',
    enum: [
      'analyze_sentiment',
      'categorize_message',
      'generate_suggestions',
      'semantic_search',
      'generate_embedding',
    ],
  })
  operation: AIOperation;

  @Column({ type: 'varchar', length: 50 })
  model: string; // e.g., 'claude-3-5-sonnet'

  @Column({
    type: 'enum',
    enum: ['success', 'failure', 'rate_limited', 'quota_exceeded'],
  })
  status: AIOperationStatus;

  // Resource Usage
  @Column({ type: 'integer' })
  inputTokens: number;

  @Column({ type: 'integer' })
  outputTokens: number;

  @Column({ type: 'integer' })
  totalTokens: number;

  // Cost
  @Column({ type: 'float' })
  estimatedCost: number; // in USD

  // Request/Response
  @Column({ type: 'integer' })
  requestSize: number; // bytes

  @Column({ type: 'integer' })
  responseSize: number; // bytes

  @Column({ type: 'integer' })
  responseTimeMs: number; // milliseconds

  // Error Handling
  @Column({ type: 'varchar', length: 255, nullable: true })
  errorCode: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // Context
  @Column({ type: 'uuid', nullable: true })
  messageId: string;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
