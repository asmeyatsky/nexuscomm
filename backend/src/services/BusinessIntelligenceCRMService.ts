import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import { User } from '@models/User';
import { Contact } from '@models/Contact';
import { AppError } from '@middleware/errorHandler';

// Define business intelligence and CRM interfaces
export interface CRMContact {
  id: string;
  userId: string; // The user who owns this CRM record
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  contactType: 'lead' | 'customer' | 'prospect' | 'partner' | 'vendor';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurturing';
  leadSource?: string; // How the contact was acquired
  assignedTo?: string; // User ID of the person assigned to this contact
  tags: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  communicationHistory: {
    lastContacted: Date;
    contactCount: number;
    channelDistribution: Record<string, number>; // How they were contacted
    nextAction?: {
      action: string;
      scheduledDate: Date;
      completed: boolean;
    };
  };
  valueEstimate?: number; // Estimated deal value
  notes: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessOpportunity {
  id: string;
  userId: string;
  title: string;
  description?: string;
  contactId: string; // Associated contact
  value: number; // Deal value
  probability: number; // 0-100 percentage
  stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'value_proposition' | 'id_decision_makers' | 'perception_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  pipeline: string; // Which sales pipeline it's in
  tags: string[];
  activities: Array<{
    type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal';
    description: string;
    date: Date;
    completed: boolean;
    notes?: string;
  }>;
  createdBy: string; // User ID
  assignedTo: string; // User ID
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessInsight {
  id: string;
  userId: string;
  metric: string; // 'response_rate', 'conversion_rate', 'revenue', etc.
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  comparisonValue?: number; // Previous period value for comparison
  variance?: number; // Difference from previous period
  recommendations: string[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface SalesFunnel {
  id: string;
  userId: string;
  title: string;
  stages: Array<{
    name: string;
    probability: number; // Win probability at this stage
    count: number; // Number of opportunities
    value: number; // Total value of opportunities
  }>;
  totalOpportunities: number;
  totalValue: number;
  estimatedRevenue: number; // Based on probabilities
  conversionRate?: number; // Overall conversion rate
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationPattern {
  contactId: string;
  userId: string;
  responseTime: number; // Average response time in hours
  communicationFrequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  preferredChannel: string;
  bestContactTime: string; // HH:MM format
  engagementLevel: 'high' | 'medium' | 'low';
  lastInteraction: Date;
  metadata: Record<string, any>;
}

export interface CustomerInteraction {
  id: string;
  userId: string;
  contactId: string;
  type: 'message' | 'call' | 'email' | 'meeting' | 'demo';
  channel: string; // 'whatsapp', 'email', 'linkedin', etc.
  direction: 'inbound' | 'outbound';
  content: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  sentiment: number; // -1 to 1 scale
  importance: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
  createdAt: Date;
}

export class BusinessIntelligenceCRMService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);
  private userRepository = AppDataSource.getRepository(User);
  private contactRepository = AppDataSource.getRepository(Contact);

  constructor() {
    // Initialize business intelligence and CRM service
  }

  /**
   * Create or update a CRM contact
   */
  async createOrUpdateCRMContact(
    userId: string,
    contactData: Omit<CRMContact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'communicationHistory'>
  ): Promise<CRMContact> {
    // Check if contact already exists
    const existingContact = await this.contactRepository.findOne({
      where: [
        { email: contactData.email, userId },
        { phone: contactData.phone, userId },
        { name: contactData.name, userId }
      ]
    });

    let crmContact: CRMContact;

    if (existingContact) {
      // Update existing contact
      crmContact = {
        ...existingContact as unknown as CRMContact,
        name: contactData.name || existingContact.name,
        email: contactData.email || (existingContact as any).email,
        phone: contactData.phone || (existingContact as any).phone,
        company: contactData.company || (existingContact as any).company,
        jobTitle: contactData.jobTitle || (existingContact as any).jobTitle,
        contactType: contactData.contactType || 'lead',
        status: contactData.status || 'new',
        leadSource: contactData.leadSource,
        assignedTo: contactData.assignedTo,
        tags: contactData.tags || [],
        socialProfiles: contactData.socialProfiles,
        notes: contactData.notes || [],
        metadata: contactData.metadata || {},
        updatedAt: new Date()
      };
    } else {
      // Create new contact
      crmContact = {
        id: `crm-contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        jobTitle: contactData.jobTitle,
        contactType: contactData.contactType || 'lead',
        status: contactData.status || 'new',
        leadSource: contactData.leadSource,
        assignedTo: contactData.assignedTo,
        tags: contactData.tags || [],
        socialProfiles: contactData.socialProfiles,
        communicationHistory: {
          lastContacted: new Date(),
          contactCount: 0,
          channelDistribution: {}
        },
        notes: contactData.notes || [],
        metadata: contactData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // In a real implementation, this would be saved to the database
    console.log('Created/updated CRM contact:', crmContact);

    return crmContact;
  }

  /**
   * Get CRM contacts with filtering and sorting
   */
  async getCRMContacts(
    userId: string,
    filters?: {
      status?: string[];
      contactType?: string[];
      tags?: string[];
      assignedTo?: string;
      searchTerm?: string;
      sortBy?: 'name' | 'lastContacted' | 'status' | 'value';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<CRMContact[]> {
    // In a real implementation, this would query the database with filters
    // For now, return mock contacts
    return [
      {
        id: 'crm-contact-1',
        userId,
        name: 'John Smith',
        company: 'Acme Corp',
        contactType: 'customer',
        status: 'qualified',
        tags: ['hot_lead', 'enterprise'],
        communicationHistory: {
          lastContacted: new Date(Date.now() - 86400000), // 1 day ago
          contactCount: 5,
          channelDistribution: { email: 3, whatsapp: 2 }
        },
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create a business opportunity
   */
  async createBusinessOpportunity(
    userId: string,
    opportunityData: Omit<BusinessOpportunity, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<BusinessOpportunity> {
    const opportunity: BusinessOpportunity = {
      id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...opportunityData,
      createdBy: userId,
      metadata: opportunityData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created business opportunity:', opportunity);

    return opportunity;
  }

  /**
   * Get business opportunities with filtering
   */
  async getBusinessOpportunities(
    userId: string,
    filters?: {
      stage?: string[];
      contactId?: string;
      pipeline?: string;
      min_value?: number;
      max_value?: number;
      assignedTo?: string;
      searchTerm?: string;
    }
  ): Promise<BusinessOpportunity[]> {
    // In a real implementation, this would query the database with filters
    // For now, return mock opportunities
    return [
      {
        id: 'opp-1',
        userId,
        title: 'Enterprise Software Deal',
        description: 'Large enterprise software implementation',
        contactId: 'contact-1',
        value: 150000,
        probability: 75,
        stage: 'proposal',
        pipeline: 'sales',
        tags: ['enterprise', 'software'],
        activities: [],
        createdBy: userId,
        assignedTo: userId,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Create a customer interaction record
   */
  async createCustomerInteraction(
    userId: string,
    interactionData: Omit<CustomerInteraction, 'id' | 'userId' | 'createdAt'>
  ): Promise<CustomerInteraction> {
    const interaction: CustomerInteraction = {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...interactionData,
      createdAt: new Date()
    };

    // In a real implementation, this would be saved to the database
    console.log('Created customer interaction:', interaction);

    return interaction;
  }

  /**
   * Get customer interaction history
   */
  async getCustomerInteractions(
    userId: string,
    contactId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string[];
      startDate?: Date;
      endDate?: Date;
      sortBy?: 'date' | 'type' | 'importance';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<CustomerInteraction[]> {
    // In a real implementation, this would query the database
    // For now, return mock interactions
    return [
      {
        id: 'int-1',
        userId,
        contactId,
        type: 'message',
        channel: 'whatsapp',
        direction: 'outbound',
        content: 'Followed up on the proposal',
        sentiment: 0.8,
        importance: 'high',
        createdAt: new Date()
      }
    ];
  }

  /**
   * Analyze communication patterns with contacts
   */
  async analyzeCommunicationPatterns(userId: string): Promise<CommunicationPattern[]> {
    // In a real implementation, this would analyze message data to find patterns
    // For now, return mock patterns
    return [
      {
        contactId: 'contact-1',
        userId,
        responseTime: 2.5, // 2.5 hours average response time
        communicationFrequency: 'weekly',
        preferredChannel: 'email',
        bestContactTime: '10:00',
        engagementLevel: 'high',
        lastInteraction: new Date(Date.now() - 86400000),
        metadata: {}
      }
    ];
  }

  /**
   * Generate sales funnel data
   */
  async generateSalesFunnel(userId: string, pipelineId?: string): Promise<SalesFunnel> {
    // In a real implementation, this would aggregate opportunity data
    // For now, return mock funnel data
    const stages = [
      { name: 'Prospecting', probability: 10, count: 15, value: 150000 },
      { name: 'Qualification', probability: 30, count: 8, value: 120000 },
      { name: 'Proposal', probability: 60, count: 5, value: 90000 },
      { name: 'Negotiation', probability: 80, count: 3, value: 60000 },
      { name: 'Closed Won', probability: 100, count: 2, value: 50000 }
    ];

    const totalOpportunities = stages.reduce((sum, stage) => sum + stage.count, 0);
    const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
    const estimatedRevenue = stages.reduce((sum, stage) => sum + (stage.value * stage.probability / 100), 0);

    const funnel: SalesFunnel = {
      id: `funnel-${Date.now()}`,
      userId,
      title: pipelineId ? `Pipeline: ${pipelineId}` : 'Main Sales Funnel',
      stages,
      totalOpportunities,
      totalValue,
      estimatedRevenue,
      conversionRate: totalOpportunities > 0 ? stages[stages.length - 1].count / totalOpportunities * 100 : 0,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return funnel;
  }

  /**
   * Generate business insights
   */
  async generateBusinessInsights(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'): Promise<BusinessInsight[]> {
    // In a real implementation, this would analyze various metrics
    // For now, return mock insights
    return [
      {
        id: `insight-${Date.now()}-1`,
        userId,
        metric: 'response_rate',
        value: 78, // 78% response rate
        trend: 'increasing',
        period,
        comparisonValue: 72, // Previous period was 72%
        variance: 6, // 6% improvement
        recommendations: [
          'Continue current outreach strategy',
          'Focus on email communications on Tuesday-Thursday',
          'Follow up with leads within 2 hours'
        ],
        metadata: {},
        createdAt: new Date()
      },
      {
        id: `insight-${Date.now()}-2`,
        userId,
        metric: 'conversion_rate',
        value: 15, // 15% conversion rate
        trend: 'stable',
        period,
        comparisonValue: 16,
        variance: -1,
        recommendations: [
          'Review sales process at proposal stage',
          'Enhance product demonstration approach',
          'Improve lead qualification criteria'
        ],
        metadata: {},
        createdAt: new Date()
      },
      {
        id: `insight-${Date.now()}-3`,
        userId,
        metric: 'revenue',
        value: 45000, // $45,000 revenue
        trend: 'increasing',
        period,
        comparisonValue: 41000,
        variance: 4000,
        recommendations: [
          'Focus on high-value opportunities',
          'Increase marketing spend for successful channels',
          'Nurture existing customers for repeat business'
        ],
        metadata: {},
        createdAt: new Date()
      }
    ];
  }

  /**
   * Create or update contact tags
   */
  async updateContactTags(userId: string, contactId: string, tags: string[]): Promise<CRMContact> {
    // In a real implementation, this would update the contact's tags in the database
    // For now, return a mock updated contact
    return {
      id: contactId,
      userId,
      name: 'Mock Contact',
      contactType: 'lead',
      status: 'new',
      tags,
      communicationHistory: {
        lastContacted: new Date(),
        contactCount: 0,
        channelDistribution: {}
      },
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get contact timeline (all interactions with a contact)
   */
  async getContactTimeline(userId: string, contactId: string): Promise<Array<Conversation | Message | CustomerInteraction>> {
    // In a real implementation, this would aggregate all interactions with the contact
    // Including conversations, messages, and CRM interactions
    // For now, return mock timeline data
    return [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        userId,
        senderExternalId: contactId,
        senderName: 'Contact Name',
        content: 'Initial inquiry about services',
        channelType: 'email',
        externalId: 'ext-1',
        direction: 'inbound',
        status: 'read',
        isRead: true,
        createdAt: new Date(Date.now() - 7 * 86400000) // 7 days ago
      } as any,
      {
        id: 'interaction-1',
        userId,
        contactId,
        type: 'call',
        channel: 'phone',
        direction: 'outbound',
        content: 'Follow-up call to discuss requirements',
        sentiment: 0.7,
        importance: 'high',
        createdAt: new Date(Date.now() - 5 * 86400000) // 5 days ago
      } as any
    ];
  }

  /**
   * Predict next best action for a contact
   */
  async predictNextAction(userId: string, contactId: string): Promise<{
    action: string;
    confidence: number; // 0-1 scale
    expectedOutcome: string;
    optimalTime: Date;
    recommendedChannel: string;
  }> {
    // In a real implementation, this would use ML models to predict the next best action
    // Based on communication patterns, contact status, and historical data
    // For now, return mock prediction
    return {
      action: 'Send personalized email about case studies',
      confidence: 0.85,
      expectedOutcome: 'Increased engagement and move to next stage',
      optimalTime: new Date(Date.now() + 2 * 86400000), // 2 days from now
      recommendedChannel: 'email'
    };
  }

  /**
   * Generate contact scoring/ranking
   */
  async generateContactScores(userId: string): Promise<Array<{
    contactId: string;
    contactName: string;
    score: number; // 0-100 scale
    scoreFactors: string[];
    recommendedAction: string;
  }>> {
    // In a real implementation, this would calculate contact scores based on:
    // - Engagement level
    // - Communication frequency
    // - Deal value
    // - Interaction sentiment
    // - Time since last contact
    // For now, return mock scores
    return [
      {
        contactId: 'contact-1',
        contactName: 'John Smith',
        score: 92,
        scoreFactors: ['high engagement', 'recent contact', 'large deal potential'],
        recommendedAction: 'Schedule demo this week'
      },
      {
        contactId: 'contact-2',
        contactName: 'Jane Doe',
        score: 78,
        scoreFactors: ['medium engagement', 'follow up needed', 'good deal potential'],
        recommendedAction: 'Send follow-up email'
      },
      {
        contactId: 'contact-3',
        contactName: 'Bob Johnson',
        score: 45,
        scoreFactors: ['low engagement', 'no recent contact', 'uncertain interest'],
        recommendedAction: 'Requalify or reassign'
      }
    ];
  }

  /**
   * Import contacts from external sources
   */
  async importContacts(userId: string, contactsData: any[], source: string): Promise<{
    imported: number;
    skipped: number;
    errors: number;
    errorDetails: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const contactData of contactsData) {
      try {
        // Validate contact data
        if (!contactData.name) {
          errorDetails.push(`Contact missing name: ${JSON.stringify(contactData)}`);
          errors++;
          continue;
        }

        // Check for duplicates
        const existingContact = await this.contactRepository.findOne({
          where: [
            { email: contactData.email, userId },
            { phone: contactData.phone, userId }
          ]
        });

        if (existingContact) {
          skipped++;
          continue;
        }

        // Create the CRM contact
        await this.createOrUpdateCRMContact(userId, {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          jobTitle: contactData.jobTitle,
          contactType: contactData.contactType || 'lead',
          status: contactData.status || 'new',
          leadSource: source,
          tags: contactData.tags || [],
          notes: [`${source} import on ${new Date().toISOString()}`]
        });

        imported++;
      } catch (error) {
        errors++;
        errorDetails.push(`Error importing contact ${contactData.name || 'unknown'}: ${error.message}`);
      }
    }

    return {
      imported,
      skipped,
      errors,
      errorDetails
    };
  }
}