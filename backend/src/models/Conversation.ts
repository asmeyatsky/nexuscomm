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
} from 'typeorm';
import { User } from './User';
import { Message } from './Message';

@Entity('conversations')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isArchived'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'text', array: true })
  participantIds: string[]; // External IDs from various platforms

  @Column({ type: 'text', array: true })
  participantNames: string[];

  @Column({ type: 'text', array: true })
  participantAvatars: string[]; // URLs

  @Column({
    type: 'enum',
    enum: ['whatsapp', 'sms', 'email', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'],
    array: true,
  })
  channels: string[];

  @Column({ type: 'text', nullable: true })
  lastMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageTimestamp: Date;

  @Column({ type: 'varchar', length: 50, default: 'outbound' })
  lastMessageDirection: 'inbound' | 'outbound';

  @Column({ type: 'integer', default: 0 })
  unreadCount: number;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isMuted: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>; // Custom tags, notes, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages: Message[];
}
