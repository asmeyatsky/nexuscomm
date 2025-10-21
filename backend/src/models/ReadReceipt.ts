import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Message } from './Message';
import { User } from './User';
import { Conversation } from './Conversation';

@Entity('read_receipts')
@Index(['conversationId', 'userId', 'readAt'])
@Index(['messageId', 'userId'])
export class ReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'uuid', nullable: true })
  messageId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamp' })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => Message, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
