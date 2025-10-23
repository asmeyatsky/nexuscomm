import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { Contact } from '@models/Contact';
import { Account } from '@models/Account';
import { AppError } from '@middleware/errorHandler';

// Define analytics interfaces
export interface UserCommunicationMetrics {
  userId: string;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalConversations: number;
  activeConversations: number;
  responseRate: number; // Percentage of messages replied to
  avgResponseTime: number; // In hours
  mostActiveTime: string; // Most active time of day (HH format)
  preferredChannel: string;
  engagementScore: number; // Composite score
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationAnalytics {
  conversationId: string;
  participantCount: number;
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  firstMessageAt: Date;
  lastMessageAt: Date;
  avgResponseTime: number; // In hours
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  engagementLevel: 'high' | 'medium' | 'low';
  channelDistribution: Record<string, number>; // Distribution by channel
}

export interface ContactAnalytics {
  contactId: string;
  userId: string;
  totalExchanges: number;
  avgResponseTime: number; // In hours
  lastContactedAt: Date;
  contactFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  sentimentScore: number; // Average sentiment (0-1 scale)
  preferredChannel: string;
  relationshipStrength: number; // Composite score
}

export interface PlatformUsageAnalytics {
  userId: string;
  platformUsage: Record<string, number>; // Count of messages per platform
  platformEngagement: Record<string, number>; // Engagement score per platform
  platformResponseTime: Record<string, number>; // Avg response time per platform
  platformSentiment: Record<string, number>; // Avg sentiment per platform
  createdAt: Date;
}

export interface ProductivityInsights {
  userId: string;
  optimalResponseTime: string; // Best time to respond (HH:MM)
  communicationPeakHours: string[]; // Hours with most activity
  responseEffectiveness: number; // How effective responses are
  distractionReduction: number; // How well notifications are managed
  communicationBalance: number; // Work-life balance score
  weeklySummary: {
    messagesSent: number;
    messagesReceived: number;
    avgResponseTime: number;
    topContacts: string[];
    sentimentTrend: 'improving' | 'declining' | 'stable';
  };
}

export class AdvancedAnalyticsService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private contactRepository = AppDataSource.getRepository(Contact);
  private accountRepository = AppDataSource.getRepository(Account);

  constructor() {
    // Initialize analytics service
  }

  /**
   * Generate user communication metrics
   */
  async getUserMetrics(userId: string): Promise<UserCommunicationMetrics> {
    // Get all user messages
    const allMessages = await this.messageRepository.find({
      where: { userId }
    });

    // Get all user conversations
    const allConversations = await this.conversationRepository.find({
      where: { userId }
    });

    // Calculate metrics
    const totalMessagesSent = allMessages.filter(m => m.direction === 'outbound').length;
    const totalMessagesReceived = allMessages.filter(m => m.direction === 'inbound').length;
    const totalConversations = allConversations.length;
    const activeConversations = allConversations.filter(c => !c.isArchived).length;

    // Calculate response rate (simplified)
    const responseRate = totalMessagesSent > 0 ? 
      (totalMessagesSent / (totalMessagesSent + totalMessagesReceived)) * 100 : 0;

    // Calculate average response time (simplified)
    const avgResponseTime = 2; // Placeholder - in hours

    // Determine most active time (simplified)
    const mostActiveTime = '09'; // Placeholder

    // Determine preferred channel (simplified)
    const channelCounts: Record<string, number> = {};
    allMessages.forEach(m => {
      channelCounts[m.channelType] = (channelCounts[m.channelType] || 0) + 1;
    });
    
    const preferredChannel = Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    return {
      userId,
      totalMessagesSent,
      totalMessagesReceived,
      totalConversations,
      activeConversations,
      responseRate,
      avgResponseTime,
      mostActiveTime,
      preferredChannel,
      engagementScore: 75, // Placeholder
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate conversation analytics
   */
  async getConversationAnalytics(conversationId: string, userId: string): Promise<ConversationAnalytics> {
    // Verify user has access to conversation
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId }
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
    }

    // Get all messages in conversation
    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' }
    });

    // Calculate metrics
    const totalMessages = messages.length;
    const messagesSent = messages.filter(m => m.direction === 'outbound').length;
    const messagesReceived = messages.filter(m => m.direction === 'inbound').length;
    const firstMessageAt = messages[0]?.createdAt || new Date();
    const lastMessageAt = messages[messages.length - 1]?.createdAt || new Date();

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    // Simplified response time calculation
    const avgResponseTime = 4; // Placeholder in hours

    // Calculate channel distribution
    const channelDistribution: Record<string, number> = {};
    messages.forEach(m => {
      channelDistribution[m.channelType] = (channelDistribution[m.channelType] || 0) + 1;
    });

    return {
      conversationId,
      participantCount: conversation.participantIds.length,
      totalMessages,
      messagesSent,
      messagesReceived,
      firstMessageAt,
      lastMessageAt,
      avgResponseTime,
      sentimentTrend: 'neutral', // Placeholder
      engagementLevel: 'medium', // Placeholder
      channelDistribution
    };
  }

  /**
   * Generate contact analytics
   */
  async getContactAnalytics(contactId: string, userId: string): Promise<ContactAnalytics> {
    // This would require more complex logic to link contacts to conversations/messages
    // For now, we'll create a simplified version
    
    // In a real implementation, we'd need to connect contacts to conversations
    // using contact IDs or similar linking mechanisms
    
    return {
      contactId,
      userId,
      totalExchanges: 25, // Placeholder
      avgResponseTime: 3, // Placeholder in hours
      lastContactedAt: new Date(Date.now() - 86400000), // 1 day ago
      contactFrequency: 'weekly', // Placeholder
      sentimentScore: 0.7, // Placeholder (0-1 scale)
      preferredChannel: 'whatsapp', // Placeholder
      relationshipStrength: 80 // Placeholder
    };
  }

  /**
   * Generate platform usage analytics
   */
  async getPlatformUsageAnalytics(userId: string): Promise<PlatformUsageAnalytics> {
    const messages = await this.messageRepository.find({
      where: { userId }
    });

    // Calculate platform usage
    const platformUsage: Record<string, number> = {};
    const platformResponseTimes: Record<string, number> = {};
    
    messages.forEach(m => {
      platformUsage[m.channelType] = (platformUsage[m.channelType] || 0) + 1;
      // Simplified response time tracking
      platformResponseTimes[m.channelType] = platformResponseTimes[m.channelType] || 2; // Placeholder
    });

    return {
      userId,
      platformUsage,
      platformEngagement: platformUsage, // Using usage as proxy for engagement for now
      platformResponseTime: platformResponseTimes,
      platformSentiment: { whatsapp: 0.7, email: 0.6, sms: 0.8 }, // Placeholder
      createdAt: new Date()
    };
  }

  /**
   * Generate productivity insights
   */
  async getProductivityInsights(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<ProductivityInsights> {
    // Get user's communication data
    const messages = await this.messageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100 // Limit for performance
    });

    // Calculate insights
    const recentMessages = messages.slice(0, 20); // Look at recent messages
    
    // Determine optimal response time based on when user is most responsive
    const optimalResponseTime = '09:00'; // Placeholder
    
    // Determine peak communication hours
    const peakHours: string[] = ['09', '10', '14', '15']; // Placeholder
    
    // Calculate weekly summary
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekMessages = messages.filter(m => m.createdAt > oneWeekAgo);
    const weekSent = weekMessages.filter(m => m.direction === 'outbound').length;
    const weekReceived = weekMessages.filter(m => m.direction === 'inbound').length;
    
    return {
      userId,
      optimalResponseTime,
      communicationPeakHours: peakHours,
      responseEffectiveness: 85, // Placeholder
      distractionReduction: 70, // Placeholder
      communicationBalance: 75, // Placeholder
      weeklySummary: {
        messagesSent: weekSent,
        messagesReceived: weekReceived,
        avgResponseTime: 2.5, // Placeholder
        topContacts: ['John Doe', 'Jane Smith'], // Placeholder
        sentimentTrend: 'stable' // Placeholder
      }
    };
  }

  /**
   * Get communication trends for a user
   */
  async getCommunicationTrends(userId: string, days: number = 30): Promise<{
    dailyActivity: { date: string; sent: number; received: number }[];
    weeklyTrend: { week: string; sent: number; received: number }[];
    channelGrowth: Record<string, { date: string; count: number }[]>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get messages in date range
    const messages = await this.messageRepository.find({
      where: {
        userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      order: { createdAt: 'ASC' }
    });

    // Group by date
    const dailyActivity: Record<string, { sent: number; received: number }> = {};
    
    messages.forEach(msg => {
      const dateStr = msg.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyActivity[dateStr]) {
        dailyActivity[dateStr] = { sent: 0, received: 0 };
      }
      
      if (msg.direction === 'outbound') {
        dailyActivity[dateStr].sent++;
      } else {
        dailyActivity[dateStr].received++;
      }
    });

    // Convert to array format
    const dailyActivityArr = Object.entries(dailyActivity)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by week
    const weeklyTrend: Record<string, { sent: number; received: number }> = {};
    
    messages.forEach(msg => {
      const week = this.getWeekFromDate(msg.createdAt);
      
      if (!weeklyTrend[week]) {
        weeklyTrend[week] = { sent: 0, received: 0 };
      }
      
      if (msg.direction === 'outbound') {
        weeklyTrend[week].sent++;
      } else {
        weeklyTrend[week].received++;
      }
    });

    const weeklyTrendArr = Object.entries(weeklyTrend)
      .map(([week, counts]) => ({ week, ...counts }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Channel growth
    const channelGrowth: Record<string, Record<string, number>> = {};
    
    messages.forEach(msg => {
      const dateStr = msg.createdAt.toISOString().split('T')[0];
      const channel = msg.channelType;
      
      if (!channelGrowth[channel]) {
        channelGrowth[channel] = {};
      }
      
      channelGrowth[channel][dateStr] = (channelGrowth[channel][dateStr] || 0) + 1;
    });

    // Convert channel growth to arrays
    const formattedChannelGrowth: Record<string, { date: string; count: number }[]> = {};
    
    Object.entries(channelGrowth).forEach(([channel, dateCounts]) => {
      formattedChannelGrowth[channel] = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    });

    return {
      dailyActivity: dailyActivityArr,
      weeklyTrend: weeklyTrendArr,
      channelGrowth: formattedChannelGrowth
    };
  }

  /**
   * Helper to get week string from date
   */
  private getWeekFromDate(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Get week number from date
   */
  private getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsDashboard(userId: string): Promise<{
    userMetrics: UserCommunicationMetrics;
    platformAnalytics: PlatformUsageAnalytics;
    productivityInsights: ProductivityInsights;
    communicationTrends: any; // Simplified for this implementation
  }> {
    const [userMetrics, platformAnalytics, productivityInsights, communicationTrends] = 
      await Promise.all([
        this.getUserMetrics(userId),
        this.getPlatformUsageAnalytics(userId),
        this.getProductivityInsights(userId),
        this.getCommunicationTrends(userId, 30)
      ]);

    return {
      userMetrics,
      platformAnalytics,
      productivityInsights,
      communicationTrends
    };
  }
}