import { AppDataSource } from '@config/database';
import { Conversation } from '@models/Conversation';
import { Message } from '@models/Message';
import { User } from '@models/User';
import { Account } from '@models/Account';
import { AppError } from '@middleware/errorHandler';

// Define group management interfaces
export interface Group {
  id: string;
  userId: string; // The user who created/owns the group
  name: string;
  description?: string;
  participantIds: string[]; // User IDs in the group
  participantDetails?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: Date;
    lastSeen?: Date;
  }>;
  channelTypes: string[]; // ['whatsapp', 'email', 'slack', etc.]
  isSmartGroup: boolean; // If true, membership is dynamic based on rules
  smartGroupRule?: string; // Rule to determine membership
  settings: {
    allowInvites: boolean;
    allowAdminChanges: boolean;
    requireApproval: boolean;
    autoAddNewContacts: boolean;
    maxParticipants: number;
    messageHistoryRetention: number; // In days
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupActivity {
  groupId: string;
  userId: string;
  action: 'join' | 'leave' | 'add_member' | 'remove_member' | 'message_sent' | 'settings_changed';
  targetUserId?: string; // For actions that target a specific user
  messageContent?: string; // For message_sent actions
  changes?: Record<string, any>; // For settings_changed actions
  timestamp: Date;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  channelType: string;
  mediaUrls?: string[];
  isPinned: boolean;
  replyToMessageId?: string;
  reactions: Array<{
    emoji: string;
    userId: string;
    userName: string;
    timestamp: Date;
  }>;
  mentions: string[]; // User IDs mentioned in the message
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupInsight {
  groupId: string;
  mostActiveUsers: Array<{ userId: string; name: string; messageCount: number }>;
  peakActivityTimes: string[]; // Best times for engagement
  commonTopics: string[];
  engagementScore: number; // 0-100
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  retentionRate: number; // Percentage of members who remain active
  createdAt: Date;
}

export class EnhancedGroupManagementService {
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private messageRepository = AppDataSource.getRepository(Message);
  private userRepository = AppDataSource.getRepository(User);

  constructor() {
    // Initialize group management service
  }

  /**
   * Create a new group
   */
  async createGroup(
    userId: string,
    groupData: {
      name: string;
      description?: string;
      participantIds: string[];
      channelTypes: string[];
      isSmartGroup?: boolean;
      smartGroupRule?: string;
      settings?: Partial<Group['settings']>;
    }
  ): Promise<Group> {
    // Verify all participants exist
    const participants = await this.userRepository.findByIds(groupData.participantIds);
    if (participants.length !== groupData.participantIds.length) {
      throw new AppError(404, 'One or more participants not found', 'PARTICIPANTS_NOT_FOUND');
    }

    const group: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId, // Creator becomes owner
      name: groupData.name,
      description: groupData.description,
      participantIds: [...new Set([...groupData.participantIds, userId])], // Include creator
      participantDetails: participants.map(p => ({
        id: p.id,
        name: p.displayName || p.username,
        avatar: p.profilePicture,
        role: p.id === userId ? 'admin' : 'member',
        joinedAt: new Date()
      })),
      channelTypes: groupData.channelTypes,
      isSmartGroup: groupData.isSmartGroup || false,
      smartGroupRule: groupData.smartGroupRule,
      settings: {
        allowInvites: true,
        allowAdminChanges: true,
        requireApproval: false,
        autoAddNewContacts: false,
        maxParticipants: 100,
        messageHistoryRetention: 365,
        ...groupData.settings
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create a conversation for this group
    await this.createGroupConversation(group);

    // Log the group creation activity
    await this.logGroupActivity(group.id, userId, 'join');

    return group;
  }

  /**
   * Create a group conversation to track group communications
   */
  private async createGroupConversation(group: Group): Promise<void> {
    const conversation = this.conversationRepository.create({
      id: `conv-${group.id}`,
      userId: group.userId,
      participantIds: group.participantIds,
      participantNames: group.participantDetails?.map(p => p.name) || [],
      participantAvatars: group.participantDetails?.map(p => p.avatar || '') || [],
      channels: group.channelTypes as any, // Assuming channelTypes match conversation channel types
      isGroup: true, // Assuming there's a group field in conversation model
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.conversationRepository.save(conversation);
  }

  /**
   * Get a group by ID
   */
  async getGroup(groupId: string, userId: string): Promise<Group | null> {
    // In a real implementation, this would fetch from the groups table
    // For now, return a mock group
    return {
      id: groupId,
      userId,
      name: 'Mock Group',
      participantIds: [userId, 'user2', 'user3'],
      participantDetails: [
        { id: userId, name: 'Current User', role: 'admin', joinedAt: new Date() },
        { id: 'user2', name: 'Participant 2', role: 'member', joinedAt: new Date() },
        { id: 'user3', name: 'Participant 3', role: 'member', joinedAt: new Date() }
      ],
      channelTypes: ['whatsapp', 'email'],
      isSmartGroup: false,
      settings: {
        allowInvites: true,
        allowAdminChanges: true,
        requireApproval: false,
        autoAddNewContacts: false,
        maxParticipants: 100,
        messageHistoryRetention: 365
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update group settings
   */
  async updateGroup(groupId: string, userId: string, updates: Partial<Group>): Promise<Group> {
    // Verify user has admin rights
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Check if user is admin
    const userRole = group.participantDetails?.find(p => p.id === userId)?.role;
    if (userRole !== 'admin' && userRole !== 'moderator') {
      throw new AppError(403, 'Only admins can update group settings', 'INSUFFICIENT_PERMISSIONS');
    }

    // Apply updates
    const updatedGroup = { ...group, ...updates, updatedAt: new Date() };

    // Log the settings change activity
    await this.logGroupActivity(groupId, userId, 'settings_changed', undefined, undefined, updates);

    return updatedGroup;
  }

  /**
   * Add a member to the group
   */
  async addMember(groupId: string, userId: string, targetUserId: string): Promise<Group> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Check permissions
    const userRole = group.participantDetails?.find(p => p.id === userId)?.role;
    if (userRole !== 'admin' && userRole !== 'moderator' && !group.settings.allowInvites) {
      throw new AppError(403, 'Insufficient permissions to add members', 'INSUFFICIENT_PERMISSIONS');
    }

    // Check if user is already in the group
    if (group.participantIds.includes(targetUserId)) {
      throw new AppError(400, 'User is already a member of this group', 'USER_ALREADY_IN_GROUP');
    }

    // Verify target user exists
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new AppError(404, 'Target user not found', 'TARGET_USER_NOT_FOUND');
    }

    // Update group with new member
    const updatedGroup = {
      ...group,
      participantIds: [...group.participantIds, targetUserId],
      participantDetails: [
        ...group.participantDetails || [],
        {
          id: targetUserId,
          name: targetUser.displayName || targetUser.username,
          avatar: targetUser.profilePicture,
          role: 'member',
          joinedAt: new Date()
        }
      ],
      updatedAt: new Date()
    };

    // Log the member addition activity
    await this.logGroupActivity(groupId, userId, 'add_member', targetUserId);

    return updatedGroup;
  }

  /**
   * Remove a member from the group
   */
  async removeMember(groupId: string, userId: string, targetUserId: string): Promise<Group> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Check permissions - only admins can remove members
    const userRole = group.participantDetails?.find(p => p.id === userId)?.role;
    if (userRole !== 'admin' && userRole !== 'moderator') {
      throw new AppError(403, 'Only admins can remove members', 'INSUFFICIENT_PERMISSIONS');
    }

    // Can't remove the group owner
    if (targetUserId === group.userId) {
      throw new AppError(400, 'Cannot remove group owner', 'CANNOT_REMOVE_OWNER');
    }

    // Update group without the member
    const updatedGroup = {
      ...group,
      participantIds: group.participantIds.filter(id => id !== targetUserId),
      participantDetails: (group.participantDetails || []).filter(p => p.id !== targetUserId),
      updatedAt: new Date()
    };

    // Log the member removal activity
    await this.logGroupActivity(groupId, userId, 'remove_member', targetUserId);

    return updatedGroup;
  }

  /**
   * Leave a group
   */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Don't allow group owner to leave
    if (userId === group.userId) {
      throw new AppError(400, 'Group owner cannot leave. Transfer ownership first.', 'OWNER_CANNOT_LEAVE');
    }

    // Update group without the user
    const updatedGroup = {
      ...group,
      participantIds: group.participantIds.filter(id => id !== userId),
      participantDetails: (group.participantDetails || []).filter(p => p.id !== userId),
      updatedAt: new Date()
    };

    // In a real implementation, this would update the database
    console.log('Group updated after user left:', updatedGroup);

    // Log the leave activity
    await this.logGroupActivity(groupId, userId, 'leave');
  }

  /**
   * Send a group message
   */
  async sendGroupMessage(
    groupId: string,
    senderId: string,
    content: string,
    options?: {
      channelType?: string;
      mediaUrls?: string[];
      replyToMessageId?: string;
      mentions?: string[];
    }
  ): Promise<GroupMessage> {
    const group = await this.getGroup(groupId, senderId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Verify sender is a member of the group
    if (!group.participantIds.includes(senderId)) {
      throw new AppError(403, 'Sender is not a member of this group', 'SENDER_NOT_GROUP_MEMBER');
    }

    const sender = group.participantDetails?.find(p => p.id === senderId);

    const message: GroupMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      senderId,
      senderName: sender?.name || 'Unknown User',
      senderAvatar: sender?.avatar,
      content,
      channelType: options?.channelType || group.channelTypes[0] || 'whatsapp',
      mediaUrls: options?.mediaUrls,
      isPinned: false,
      replyToMessageId: options?.replyToMessageId,
      reactions: [],
      mentions: options?.mentions || [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to a group_messages table
    console.log('Group message sent:', message);

    return message;
  }

  /**
   * Get group messages
   */
  async getGroupMessages(
    groupId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      since?: Date;
    }
  ): Promise<GroupMessage[]> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Verify user is a member of the group
    if (!group.participantIds.includes(userId)) {
      throw new AppError(403, 'User is not a member of this group', 'USER_NOT_GROUP_MEMBER');
    }

    // In a real implementation, this would fetch from the group_messages table
    // For now, return mock messages
    return [
      {
        id: 'msg-1',
        groupId,
        senderId: userId,
        senderName: 'User',
        content: 'Hello everyone!',
        channelType: 'whatsapp',
        createdAt: new Date(),
        updatedAt: new Date(),
        reactions: [],
        mentions: [],
        metadata: {}
      }
    ];
  }

  /**
   * Pin a group message
   */
  async pinMessage(groupId: string, userId: string, messageId: string): Promise<GroupMessage> {
    // Verify user is admin or moderator
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    const userRole = group.participantDetails?.find(p => p.id === userId)?.role;
    if (userRole !== 'admin' && userRole !== 'moderator') {
      throw new AppError(403, 'Only admins can pin messages', 'INSUFFICIENT_PERMISSIONS');
    }

    // In a real implementation, this would update the message's isPinned status
    // For now, return a mock updated message
    return {
      id: messageId,
      groupId,
      senderId: userId,
      senderName: 'User',
      content: 'Pinned message',
      channelType: 'whatsapp',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: true,
      reactions: [],
      mentions: [],
      metadata: {}
    };
  }

  /**
   * Get group insights and analytics
   */
  async getGroupInsights(groupId: string, userId: string): Promise<GroupInsight> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Verify user is a member of the group
    if (!group.participantIds.includes(userId)) {
      throw new AppError(403, 'User is not a member of this group', 'USER_NOT_GROUP_MEMBER');
    }

    // In a real implementation, this would analyze group activity data
    // For now, return mock insights
    return {
      groupId,
      mostActiveUsers: [
        { userId: 'user1', name: 'Active User 1', messageCount: 45 },
        { userId: 'user2', name: 'Active User 2', messageCount: 32 },
        { userId: userId, name: 'Current User', messageCount: 28 }
      ],
      peakActivityTimes: ['09:00-11:00', '14:00-16:00', '19:00-21:00'], // Peak hours
      commonTopics: ['Project Updates', 'Weekly Reviews', 'Team Coordination'],
      engagementScore: 82, // Out of 100
      sentimentTrend: 'positive',
      retentionRate: 92, // Percentage
      createdAt: new Date()
    };
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    // In a real implementation, this would fetch all groups the user belongs to
    // For now, return mock groups
    return [
      {
        id: 'group-1',
        userId,
        name: 'Work Team',
        participantIds: [userId, 'user2', 'user3'],
        participantDetails: [
          { id: userId, name: 'Current User', role: 'admin', joinedAt: new Date() },
          { id: 'user2', name: 'Team Member 2', role: 'member', joinedAt: new Date() },
          { id: 'user3', name: 'Team Member 3', role: 'member', joinedAt: new Date() }
        ],
        channelTypes: ['whatsapp', 'email'],
        isSmartGroup: false,
        settings: {
          allowInvites: true,
          allowAdminChanges: true,
          requireApproval: false,
          autoAddNewContacts: false,
          maxParticipants: 100,
          messageHistoryRetention: 365
        },
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Search groups by name or description
   */
  async searchGroups(userId: string, query: string): Promise<Group[]> {
    // In a real implementation, this would search groups in the database
    // For now, return mock results
    return [];
  }

  /**
   * Log group activity
   */
  async logGroupActivity(
    groupId: string,
    userId: string,
    action: GroupActivity['action'],
    targetUserId?: string,
    messageContent?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const activity: GroupActivity = {
      groupId,
      userId,
      action,
      targetUserId,
      messageContent,
      changes,
      timestamp: new Date()
    };

    // In a real implementation, this would be saved to a group_activities table
    console.log('Group activity logged:', activity);
  }

  /**
   * Get group activity history
   */
  async getGroupActivityHistory(
    groupId: string,
    userId: string,
    options?: {
      limit?: number;
      since?: Date;
    }
  ): Promise<GroupActivity[]> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
    }

    // Verify user is a member of the group
    if (!group.participantIds.includes(userId)) {
      throw new AppError(403, 'User is not a member of this group', 'USER_NOT_GROUP_MEMBER');
    }

    // In a real implementation, this would fetch from the group_activities table
    // For now, return mock activities
    return [
      {
        groupId,
        userId,
        action: 'join',
        timestamp: new Date()
      }
    ];
  }

  /**
   * Create a smart group based on rules
   */
  async createSmartGroup(
    userId: string,
    groupData: {
      name: string;
      description?: string;
      smartGroupRule: string; // Rule to determine membership
      channelTypes: string[];
      settings?: Partial<Group['settings']>;
    }
  ): Promise<Group> {
    return await this.createGroup(userId, {
      ...groupData,
      participantIds: [], // Will be populated by the rule
      isSmartGroup: true
    });
  }
}