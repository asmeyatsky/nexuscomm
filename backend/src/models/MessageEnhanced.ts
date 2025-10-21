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
import { Conversation } from './Conversation';
import { Account } from './Account';
import { Reaction } from './Reaction';

@Entity('messages_enhanced')
@Index(['conversationId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['externalId', 'channelType'])
@Index(['parentId'])
export class MessageEnhanced {
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

  // Rich text content
  @Column({ type: 'jsonb' })
  contentData: {
    text: string;
    html?: string;
    entities?: Array<{
      type: 'mention' | 'hashtag' | 'code' | 'link';
      offset: number;
      length: number;
      data?: any;
    }>;
  };

  @Column({
    type: 'enum',
    enum: ['whatsapp', 'sms', 'email', 'instagram_dm', 'linkedin_dm', 'telegram', 'slack'],
  })
  channelType: string;

  @Column({ type: 'varchar', length: 500 })
  externalId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  externalThreadId: string;

  // Threading support
  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'integer', default: 0 })
  replyCount: number;

  // Media attachment
  @Column({ type: 'jsonb', default: '[]' })
  attachments: Array<{
    id: string;
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    thumbnailUrl?: string;
    name: string;
    size: number;
    mimeType: string;
  }>;

  // Message state
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: ['inbound', 'outbound'],
  })
  direction: 'inbound' | 'outbound';

  @Column({
    type: 'varchar',
    length: 50,
    default: 'sent',
  })
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'queued' | 'pending';

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  // Editing & deletion
  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  editHistory: Array<{
    content: string;
    editedAt: Date;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @ManyToOne(() => Account, (account) => account.sentMessages, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'senderAccountId' })
  senderAccount: Account;

  @ManyToOne(() => MessageEnhanced, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parentMessage: MessageEnhanced;

  @OneToMany(() => MessageEnhanced, (message) => message.parentMessage)
  replies: MessageEnhanced[];

  @OneToMany(() => Reaction, (reaction) => reaction.message, { cascade: true })
  reactions: Reaction[];
}
