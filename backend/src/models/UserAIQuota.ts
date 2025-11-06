/**
 * UserAIQuota Entity
 * Tracks AI usage, costs, and quotas per user.
 * Enforces rate limiting and spending limits.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('user_ai_quotas')
@Index(['userId'])
@Index(['monthResetDate'])
export class UserAIQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  // Usage Tracking (Daily)
  @Column({ type: 'integer', default: 0 })
  requestsToday: number;

  @Column({ type: 'integer', default: 0 })
  tokensUsedToday: number;

  @Column({ type: 'float', default: 0 })
  costToday: number; // in USD

  @Column({ type: 'timestamp' })
  dayResetDate: Date; // When daily counters reset

  // Usage Tracking (Monthly)
  @Column({ type: 'integer', default: 0 })
  requestsThisMonth: number;

  @Column({ type: 'integer', default: 0 })
  tokensUsedThisMonth: number;

  @Column({ type: 'float', default: 0 })
  costThisMonth: number; // in USD

  @Column({ type: 'timestamp' })
  monthResetDate: Date; // When monthly counters reset

  // Quotas and Limits
  @Column({ type: 'integer', default: 1000 })
  dailyRequestLimit: number; // Requests per day

  @Column({ type: 'integer', default: 100000 })
  dailyTokenLimit: number; // Tokens per day

  @Column({ type: 'float', default: 10 })
  dailyCostLimit: number; // USD per day

  @Column({ type: 'integer', default: 20000 })
  monthlyRequestLimit: number; // Requests per month

  @Column({ type: 'integer', default: 1000000 })
  monthlyTokenLimit: number; // Tokens per month

  @Column({ type: 'float', default: 100 })
  monthlyCostLimit: number; // USD per month

  // Rate Limiting
  @Column({ type: 'timestamp', nullable: true })
  rateLimitResetAt: Date; // When rate limiting resets

  @Column({ type: 'boolean', default: false })
  isRateLimited: boolean;

  // Status
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  disabledReason: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.aiQuota, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
