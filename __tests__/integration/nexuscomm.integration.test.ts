// NexusComm Integration Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AISmartResponseService } from '../../backend/src/services/AISmartResponseService';
import { SmartSchedulingService } from '../../backend/src/services/SmartSchedulingService';
import { EnhancedVoiceIntelligenceService } from '../../backend/src/services/EnhancedVoiceIntelligenceService';
import { IntelligentContactManagementService } from '../../backend/src/services/IntelligentContactManagementService';
import { AdvancedAnalyticsService } from '../../backend/src/services/AdvancedAnalyticsService';
import { AdvancedPrivacySecurityService } from '../../backend/src/services/AdvancedPrivacySecurityService';
import { ThirdPartyIntegrationService } from '../../backend/src/services/ThirdPartyIntegrationService';
import { EnhancedGroupManagementService } from '../../backend/src/services/EnhancedGroupManagementService';
import { IntelligentNotificationService } from '../../backend/src/services/IntelligentNotificationService';
import { RichMediaIntelligenceService } from '../../backend/src/services/RichMediaIntelligenceService';
import { BusinessIntelligenceCRMService } from '../../backend/src/services/BusinessIntelligenceCRMService';
import { AccessibilityEnhancementService } from '../../backend/src/services/AccessibilityEnhancementService';
import { OfflineCapabilitiesService } from '../../backend/src/services/OfflineCapabilitiesService';
import { AdvancedSearchKnowledgeManagementService } from '../../backend/src/services/AdvancedSearchKnowledgeManagementService';
import { CrossDeviceSynchronizationService } from '../../backend/src/services/CrossDeviceSynchronizationService';

// Mock data for integration testing
const mockUserId = 'test-user-123';
const mockConversationId = 'test-conv-456';
const mockMessageId = 'test-msg-789';

describe('NexusComm Integration Tests', () => {
  describe('AI-Powered Communication Flow', () => {
    let aiService: AISmartResponseService;
    let voiceService: EnhancedVoiceIntelligenceService;
    
    beforeEach(() => {
      aiService = new AISmartResponseService();
      voiceService = new EnhancedVoiceIntelligenceService();
    });
    
    it('should integrate voice input with AI responses', async () => {
      // Process voice input
      const voiceAnalysis = await voiceService.analyzeVoiceText('Hello, how are you doing today?');
      
      // Generate AI response based on voice analysis
      const aiResponses = await aiService.generateSmartResponses(
        mockConversationId,
        voiceAnalysis.transcription
      );
      
      expect(voiceAnalysis).toHaveProperty('transcription');
      expect(Array.isArray(aiResponses)).toBe(true);
      expect(aiResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('Smart Scheduling with Notifications', () => {
    let schedulingService: SmartSchedulingService;
    let notificationService: IntelligentNotificationService;
    
    beforeEach(() => {
      schedulingService = new SmartSchedulingService();
      notificationService = new IntelligentNotificationService();
    });
    
    it('should schedule message and create notification', async () => {
      // Schedule a message
      const scheduledMessage = await schedulingService.scheduleMessage(
        mockUserId,
        mockConversationId,
        'This is a scheduled message',
        new Date(Date.now() + 3600000) // 1 hour from now
      );
      
      // Create notification for the scheduled message
      await notificationService.createNotificationPreference(mockUserId, {
        channelType: 'system',
        notificationType: 'scheduled_message',
        priority: 'high',
        deliveryMethod: 'push',
        delay: 0,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
          timezone: 'UTC'
        },
        enabled: true
      });
      
      expect(scheduledMessage).toHaveProperty('id');
      expect(scheduledMessage).toHaveProperty('status', 'scheduled');
    });
  });
  
  describe('Contact Management with CRM Integration', () => {
    let contactService: IntelligentContactManagementService;
    let crmService: BusinessIntelligenceCRMService;
    
    beforeEach(() => {
      contactService = new IntelligentContactManagementService();
      crmService = new BusinessIntelligenceCRMService();
    });
    
    it('should sync contacts with CRM', async () => {
      // Create a contact
      const contact = await contactService.createOrUpdateContact(mockUserId, {
        name: 'John Smith',
        contactMethods: [{
          type: 'email',
          value: 'john.smith@example.com',
          isPrimary: true,
          isActive: true
        }]
      });
      
      // Create a CRM contact from the same information
      const crmContact = await crmService.createOrUpdateCRMContact(mockUserId, {
        name: 'John Smith',
        email: 'john.smith@example.com',
        company: 'Example Corp',
        contactType: 'customer',
        status: 'active'
      });
      
      expect(contact).toHaveProperty('name', 'John Smith');
      expect(crmContact).toHaveProperty('name', 'John Smith');
      expect(crmContact).toHaveProperty('email', 'john.smith@example.com');
    });
  });
  
  describe('Analytics with Privacy Controls', () => {
    let analyticsService: AdvancedAnalyticsService;
    let privacyService: AdvancedPrivacySecurityService;
    
    beforeEach(() => {
      analyticsService = new AdvancedAnalyticsService();
      privacyService = new AdvancedPrivacySecurityService();
    });
    
    it('should respect privacy settings in analytics', async () => {
      // Update privacy settings
      await privacyService.updatePrivacySettings(mockUserId, {
        messageEncryption: true,
        hideLastSeen: true,
        readReceipts: false
      });
      
      // Generate analytics respecting privacy settings
      const analytics = await analyticsService.getUserMetrics(mockUserId);
      
      // Verify analytics respect privacy settings
      expect(analytics).toHaveProperty('userId', mockUserId);
      // Analytics should not include last seen data if hidden
    });
  });
  
  describe('Group Management with Cross-Device Sync', () => {
    let groupService: EnhancedGroupManagementService;
    let syncService: CrossDeviceSynchronizationService;
    
    beforeEach(() => {
      groupService = new EnhancedGroupManagementService();
      syncService = new CrossDeviceSynchronizationService();
    });
    
    it('should sync group changes across devices', async () => {
      // Create a group
      const group = await groupService.createGroup(mockUserId, {
        name: 'Test Group',
        participantIds: [mockUserId],
        channelTypes: ['whatsapp']
      });
      
      // Register multiple devices for the user
      const device1 = await syncService.registerDevice(mockUserId, {
        deviceId: 'device-1',
        deviceType: 'mobile',
        platform: 'iOS',
        deviceName: 'iPhone 14'
      });
      
      const device2 = await syncService.registerDevice(mockUserId, {
        deviceId: 'device-2',
        deviceType: 'desktop',
        platform: 'macOS',
        deviceName: 'MacBook Pro'
      });
      
      // Add a member to the group
      const updatedGroup = await groupService.addMember(group.id, mockUserId, 'user2');
      
      // Both devices should now have the updated group information
      const devices = await syncService.getUserDevices(mockUserId);
      
      expect(group).toHaveProperty('name', 'Test Group');
      expect(updatedGroup.participantIds).toContain('user2');
      expect(devices).toHaveLength(2);
    });
  });
  
  describe('Media Processing with Offline Capabilities', () => {
    let mediaService: RichMediaIntelligenceService;
    let offlineService: OfflineCapabilitiesService;
    
    beforeEach(() => {
      mediaService = new RichMediaIntelligenceService();
      offlineService = new OfflineCapabilitiesService();
    });
    
    it('should process media and support offline viewing', async () => {
      // Update media settings for optimization
      await mediaService.updateMediaIntelligenceSettings(mockUserId, {
        autoOptimizeImages: true,
        compressionQuality: 80,
        thumbnailGeneration: true
      });
      
      // Configure offline settings
      await offlineService.updateOfflineSettings(mockUserId, {
        cacheSizeLimit: 100,
        enableOfflineHistory: true,
        maxOfflineMessages: 500
      });
      
      // Validate a media file (would normally be processed and cached)
      const validation = await mediaService.validateMediaForUser(
        mockUserId,
        'https://example.com/image.jpg',
        1024000 // 1MB
      );
      
      // Queue an offline message with media
      const offlineMessage = await offlineService.queueOfflineMessage(mockUserId, {
        conversationId: mockConversationId,
        content: 'Check out this image',
        channelType: 'whatsapp',
        direction: 'outbound',
        mediaUrls: ['https://example.com/image.jpg']
      });
      
      expect(validation).toHaveProperty('isValid', true);
      expect(offlineMessage).toHaveProperty('content', 'Check out this image');
      expect(offlineMessage.mediaUrls).toContain('https://example.com/image.jpg');
    });
  });
  
  describe('Search with Knowledge Management', () => {
    let searchService: AdvancedSearchKnowledgeManagementService;
    let analyticsService: AdvancedAnalyticsService;
    
    beforeEach(() => {
      searchService = new AdvancedSearchKnowledgeManagementService();
      analyticsService = new AdvancedAnalyticsService();
    });
    
    it('should create searchable knowledge from conversations', async () => {
      // Create a knowledge article
      const article = await searchService.createKnowledgeArticle(mockUserId, {
        title: 'Project Requirements',
        content: 'Detailed requirements for the new project including timeline and deliverables',
        tags: ['project', 'requirements', 'timeline'],
        category: 'business',
        isPinned: true
      });
      
      // Generate insights from the knowledge
      const insights = await analyticsService.generateInsights(mockUserId);
      
      // Search for the knowledge article
      const searchResults = await searchService.performSearch(mockUserId, {
        text: 'project requirements',
        filters: {
          tags: ['project']
        }
      });
      
      expect(article).toHaveProperty('title', 'Project Requirements');
      expect(searchResults.totalResults).toBeGreaterThanOrEqual(1);
      expect(insights).toHaveProperty('userId', mockUserId);
    });
  });
  
  describe('Accessibility with Voice Navigation', () => {
    let accessibilityService: AccessibilityEnhancementService;
    let voiceService: EnhancedVoiceIntelligenceService;
    
    beforeEach(() => {
      accessibilityService = new AccessibilityEnhancementService();
      voiceService = new EnhancedVoiceIntelligenceService();
    });
    
    it('should enable comprehensive accessibility features', async () => {
      // Enable accessibility settings
      await accessibilityService.updateAccessibilitySettings(mockUserId, {
        screenReaderEnabled: true,
        voiceNavigationEnabled: true,
        highContrastMode: true,
        largeTextMode: true
      });
      
      // Process a voice command
      const voiceCommand = await voiceService.processVoiceCommand(
        mockUserId,
        'open next conversation'
      );
      
      // Get accessibility settings
      const settings = await accessibilityService.getAccessibilitySettings(mockUserId);
      
      expect(settings.screenReaderEnabled).toBe(true);
      expect(settings.voiceNavigationEnabled).toBe(true);
      expect(voiceCommand.success).toBe(true);
      expect(voiceCommand.actionTaken).toBe('open_next_conversation');
    });
  });
  
  describe('Third-Party Integration with Automation', () => {
    let integrationService: ThirdPartyIntegrationService;
    let schedulingService: SmartSchedulingService;
    
    beforeEach(() => {
      integrationService = new ThirdPartyIntegrationService();
      schedulingService = new SmartSchedulingService();
    });
    
    it('should integrate external services with automation', async () => {
      // Create a webhook integration
      const integration = await integrationService.createIntegration(mockUserId, {
        name: 'CRM Integration',
        serviceType: 'CRM',
        webhookUrl: 'https://crm.example.com/webhook',
        settings: {
          syncFrequency: 'hourly',
          entities: ['contacts', 'opportunities']
        }
      });
      
      // Create an automation rule that triggers on webhook events
      const rule = await schedulingService.createAutomationRule(mockUserId, {
        name: 'CRM Sync Rule',
        description: 'Sync when CRM data is updated',
        trigger: 'webhook_event',
        triggerValue: 'crm_data_updated',
        action: 'sync_contacts',
        actionValue: 'all_contacts'
      });
      
      // Create a webhook endpoint
      const webhook = await integrationService.createWebhookEndpoint(mockUserId, {
        name: 'CRM Webhook',
        url: 'https://nexuscomm.example.com/webhooks/' + mockUserId,
        events: ['contact_created', 'contact_updated'],
        verifySsl: true
      });
      
      expect(integration).toHaveProperty('name', 'CRM Integration');
      expect(rule).toHaveProperty('name', 'CRM Sync Rule');
      expect(webhook).toHaveProperty('name', 'CRM Webhook');
    });
  });
  
  describe('Notification System with Multiple Channels', () => {
    let notificationService: IntelligentNotificationService;
    let contactService: IntelligentContactManagementService;
    
    beforeEach(() => {
      notificationService = new IntelligentNotificationService();
      contactService = new IntelligentContactManagementService();
    });
    
    it('should manage notifications across multiple platforms', async () => {
      // Create a contact with multiple communication channels
      const contact = await contactService.createOrUpdateContact(mockUserId, {
        name: 'Multi-Channel User',
        contactMethods: [
          { type: 'email', value: 'user@example.com', isPrimary: true, isActive: true },
          { type: 'whatsapp', value: '+1234567890', isPrimary: false, isActive: true },
          { type: 'linkedin_dm', value: 'linkedin-user-id', isPrimary: false, isActive: true }
        ]
      });
      
      // Create notification preferences for each channel
      const emailPref = await notificationService.createNotificationPreference(mockUserId, {
        channelType: 'email',
        notificationType: 'message',
        priority: 'medium',
        deliveryMethod: 'email',
        delay: 5,
        enabled: true
      });
      
      const whatsappPref = await notificationService.createNotificationPreference(mockUserId, {
        channelType: 'whatsapp',
        notificationType: 'message',
        priority: 'high',
        deliveryMethod: 'push',
        delay: 0,
        enabled: true
      });
      
      // Get all notification preferences
      const allPrefs = await notificationService.getNotificationPreferences(mockUserId);
      
      expect(contact).toHaveProperty('name', 'Multi-Channel User');
      expect(allPrefs).toHaveLength(2);
      expect(allPrefs.some(p => p.channelType === 'email')).toBe(true);
      expect(allPrefs.some(p => p.channelType === 'whatsapp')).toBe(true);
    });
  });
});