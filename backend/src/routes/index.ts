import { Router, Request, Response } from 'express';
import { authenticateToken } from '@middleware/auth';
import { aiRateLimit } from '@middleware/aiRateLimit';
import * as AuthController from '@controllers/AuthController';
import * as AccountController from '@controllers/AccountController';
import * as ConversationController from '@controllers/ConversationController';
import * as MessageController from '@controllers/MessageController';
import * as MessageProcessingController from '@controllers/MessageProcessingController';
import * as AISmartResponseController from '@controllers/AISmartResponseController';
import * as SmartSchedulingController from '@controllers/SmartSchedulingController';
import * as VoiceIntelligenceController from '@controllers/VoiceIntelligenceController';
import * as ContactManagementController from '@controllers/ContactManagementController';
import * as AdvancedAnalyticsController from '@controllers/AdvancedAnalyticsController';
import * as PrivacySecurityController from '@controllers/PrivacySecurityController';
import * as ThirdPartyIntegrationController from '@controllers/ThirdPartyIntegrationController';
import * as GroupManagementController from '@controllers/GroupManagementController';
import * as IntelligentNotificationController from '@controllers/IntelligentNotificationController';
import * as RichMediaIntelligenceController from '@controllers/RichMediaIntelligenceController';
import * as BusinessIntelligenceCRMController from '@controllers/BusinessIntelligenceCRMController';
import * as AccessibilityEnhancementController from '@controllers/AccessibilityEnhancementController';
import * as OfflineCapabilitiesController from '@controllers/OfflineCapabilitiesController';
import * as AdvancedSearchKnowledgeManagementController from '@controllers/AdvancedSearchKnowledgeManagementController';
import * as CrossDeviceSynchronizationController from '@controllers/CrossDeviceSynchronizationController';
import * as IdentityFilterController from '@controllers/IdentityFilterController';
import * as AIAnalysisController from '@controllers/AIAnalysisController';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/profile', authenticateToken, AuthController.getProfile);
router.put('/auth/profile', authenticateToken, AuthController.updateProfile);
router.get('/auth/verify-email', AuthController.verifyEmail);

// Account routes
router.post('/accounts', authenticateToken, AccountController.addAccount);
router.get('/accounts', authenticateToken, AccountController.getAccounts);
router.get('/accounts/:accountId', authenticateToken, AccountController.getAccount);
router.post('/accounts/:accountId/disconnect', authenticateToken, AccountController.disconnectAccount);
router.patch('/accounts/:accountId/sync-status', authenticateToken, AccountController.updateSyncStatus);

// Conversation routes
router.post('/conversations', authenticateToken, ConversationController.createConversation);
router.get('/conversations', authenticateToken, ConversationController.getConversations);
router.get('/conversations/:conversationId', authenticateToken, ConversationController.getConversation);
router.post('/conversations/:conversationId/mark-read', authenticateToken, ConversationController.markAsRead);
router.post('/conversations/:conversationId/toggle-archive', authenticateToken, ConversationController.toggleArchive);
router.post('/conversations/:conversationId/toggle-pin', authenticateToken, ConversationController.togglePin);
router.post('/conversations/:conversationId/toggle-mute', authenticateToken, ConversationController.toggleMute);
router.get('/conversations/search', authenticateToken, ConversationController.searchConversations);

// Message routes
router.post('/messages', authenticateToken, MessageProcessingController.createMessage); // Updated to use processing controller
router.post('/messages/voice', authenticateToken, MessageProcessingController.processVoiceMessage);
router.post('/messages/email', authenticateToken, MessageProcessingController.processEmailMessage);
router.post('/messages/email-response', authenticateToken, MessageProcessingController.processEmailResponse);

// AI Smart Responses
router.get('/ai/smart-responses', authenticateToken, AISmartResponseController.getSmartResponses);
router.post('/ai/analyze-tone', authenticateToken, AISmartResponseController.analyzeMessageTone);
router.post('/ai/draft-response', authenticateToken, AISmartResponseController.generateDraftResponse);

// Smart Scheduling & Automation
router.post('/scheduling/schedule-message', authenticateToken, SmartSchedulingController.scheduleMessage);
router.get('/scheduling/scheduled-messages', authenticateToken, SmartSchedulingController.getScheduledMessages);
router.delete('/scheduling/scheduled-messages/:scheduledMessageId', authenticateToken, SmartSchedulingController.cancelScheduledMessage);
router.post('/automation/rules', authenticateToken, SmartSchedulingController.createAutomationRule);
router.get('/automation/rules', authenticateToken, SmartSchedulingController.getAutomationRules);
router.put('/automation/rules/:ruleId', authenticateToken, SmartSchedulingController.updateAutomationRule);
router.post('/automation/rules/:ruleId/toggle', authenticateToken, SmartSchedulingController.toggleAutomationRule);

// Enhanced Voice Intelligence
router.post('/voice/process', authenticateToken, VoiceIntelligenceController.processVoiceInput);
router.post('/voice/analyze-text', authenticateToken, VoiceIntelligenceController.analyzeVoiceText);
router.post('/voice/emotion-responses', authenticateToken, VoiceIntelligenceController.getEmotionAppropriateResponses);

// Intelligent Contact Management
router.post('/contacts', authenticateToken, ContactManagementController.createOrUpdateContact);
router.get('/contacts/:identifier', authenticateToken, ContactManagementController.getContact);
router.post('/contacts/:contactId/link-methods', authenticateToken, ContactManagementController.linkContactMethods);
router.post('/contacts/groups/smart', authenticateToken, ContactManagementController.createSmartGroup);
router.post('/contacts/groups', authenticateToken, ContactManagementController.createStaticGroup);
router.get('/contacts/:contactId/patterns', authenticateToken, ContactManagementController.getCommunicationPatterns);
router.get('/contacts/:contactId/best-time', authenticateToken, ContactManagementController.suggestBestContactTime);
router.get('/contacts', authenticateToken, ContactManagementController.getAllContacts);
router.get('/contacts/recommendations', authenticateToken, ContactManagementController.getContactRecommendations);

// Advanced Analytics & Insights
router.get('/analytics/user-metrics', authenticateToken, AdvancedAnalyticsController.getUserMetrics);
router.get('/analytics/conversations/:conversationId', authenticateToken, AdvancedAnalyticsController.getConversationAnalytics);
router.get('/analytics/contacts/:contactId', authenticateToken, AdvancedAnalyticsController.getContactAnalytics);
router.get('/analytics/platform-usage', authenticateToken, AdvancedAnalyticsController.getPlatformUsageAnalytics);
router.get('/analytics/productivity-insights', authenticateToken, AdvancedAnalyticsController.getProductivityInsights);
router.get('/analytics/communication-trends', authenticateToken, AdvancedAnalyticsController.getCommunicationTrends);
router.get('/analytics/dashboard', authenticateToken, AdvancedAnalyticsController.getAnalyticsDashboard);

// Advanced Privacy & Security
router.get('/privacy/settings', authenticateToken, PrivacySecurityController.getPrivacySettings);
router.put('/privacy/settings', authenticateToken, PrivacySecurityController.updatePrivacySettings);
router.get('/security/settings', authenticateToken, PrivacySecurityController.getSecuritySettings);
router.put('/security/settings', authenticateToken, PrivacySecurityController.updateSecuritySettings);
router.post('/security/encryption-keys', authenticateToken, PrivacySecurityController.generateEncryptionKeys);
router.get('/privacy/retention', authenticateToken, PrivacySecurityController.getDataRetentionSettings);
router.put('/privacy/retention', authenticateToken, PrivacySecurityController.updateDataRetentionSettings);
router.post('/privacy/retention/check', authenticateToken, PrivacySecurityController.checkDataRetention);
router.get('/privacy/report', authenticateToken, PrivacySecurityController.generatePrivacyReport);
router.post('/security/check-access', authenticateToken, PrivacySecurityController.hasResourceAccess);

// Third-Party Integrations & Webhooks
router.post('/integrations', authenticateToken, ThirdPartyIntegrationController.createIntegration);
router.put('/integrations/:integrationId', authenticateToken, ThirdPartyIntegrationController.updateIntegration);
router.get('/integrations', authenticateToken, ThirdPartyIntegrationController.getUserIntegrations);
router.post('/integrations/:integrationId/test', authenticateToken, ThirdPartyIntegrationController.testIntegration);
router.post('/webhooks', authenticateToken, ThirdPartyIntegrationController.createWebhookEndpoint);
router.put('/webhooks/:endpointId', authenticateToken, ThirdPartyIntegrationController.updateWebhookEndpoint);
router.delete('/webhooks/:endpointId', authenticateToken, ThirdPartyIntegrationController.deleteWebhookEndpoint);
router.get('/webhooks', authenticateToken, ThirdPartyIntegrationController.getUserWebhookEndpoints);
router.post('/webhooks/:webhookId/test', authenticateToken, ThirdPartyIntegrationController.generateWebhookTestEvent);
router.get('/webhooks/:webhookId/logs', authenticateToken, ThirdPartyIntegrationController.getWebhookLogs);
router.post('/webhooks/:userId/:webhookId', ThirdPartyIntegrationController.handleIncomingWebhook); // Public endpoint
router.post('/events', authenticateToken, ThirdPartyIntegrationController.createIntegrationEvent);

// Enhanced Group Management
router.post('/groups', authenticateToken, GroupManagementController.createGroup);
router.get('/groups/:groupId', authenticateToken, GroupManagementController.getGroup);
router.put('/groups/:groupId', authenticateToken, GroupManagementController.updateGroup);
router.post('/groups/:groupId/add-member', authenticateToken, GroupManagementController.addMember);
router.post('/groups/:groupId/remove-member', authenticateToken, GroupManagementController.removeMember);
router.post('/groups/:groupId/leave', authenticateToken, GroupManagementController.leaveGroup);
router.post('/groups/:groupId/messages', authenticateToken, GroupManagementController.sendGroupMessage);
router.get('/groups/:groupId/messages', authenticateToken, GroupManagementController.getGroupMessages);
router.post('/groups/:groupId/messages/:messageId/pin', authenticateToken, GroupManagementController.pinMessage);
router.get('/groups/:groupId/insights', authenticateToken, GroupManagementController.getGroupInsights);
router.get('/groups', authenticateToken, GroupManagementController.getUserGroups);
router.get('/groups/search', authenticateToken, GroupManagementController.searchGroups);
router.get('/groups/:groupId/activity', authenticateToken, GroupManagementController.getGroupActivityHistory);
router.post('/groups/smart', authenticateToken, GroupManagementController.createSmartGroup);

// Intelligent Notification System
router.post('/notifications/preferences', authenticateToken, IntelligentNotificationController.createNotificationPreference);
router.put('/notifications/preferences/:channelType/:notificationType', authenticateToken, IntelligentNotificationController.updateNotificationPreferences);
router.get('/notifications/preferences', authenticateToken, IntelligentNotificationController.getNotificationPreferences);
router.post('/notifications', authenticateToken, IntelligentNotificationController.createIntelligentNotification);
router.post('/notifications/rules', authenticateToken, IntelligentNotificationController.createNotificationRule);
router.get('/notifications/insights', authenticateToken, IntelligentNotificationController.getNotificationInsights);
router.get('/notifications/pending', authenticateToken, IntelligentNotificationController.getPendingNotifications);
router.post('/notifications/:notificationId/read', authenticateToken, IntelligentNotificationController.markNotificationAsRead);
router.post('/notifications/bulk', authenticateToken, IntelligentNotificationController.sendBulkNotifications);
router.get('/notifications/dnd-status', authenticateToken, IntelligentNotificationController.isUserInDoNotDisturbMode);

// Rich Media Intelligence
router.get('/media/settings', authenticateToken, RichMediaIntelligenceController.getMediaIntelligenceSettings);
router.put('/media/settings', authenticateToken, RichMediaIntelligenceController.updateMediaIntelligenceSettings);
router.post('/media/process', authenticateToken, RichMediaIntelligenceController.processMediaFile);
router.post('/media/optimize', authenticateToken, RichMediaIntelligenceController.optimizeMediaForPlatform);
router.post('/media/analyze', authenticateToken, RichMediaIntelligenceController.analyzeMediaContent);
router.post('/media/batch-process', authenticateToken, RichMediaIntelligenceController.batchProcessMediaFiles);
router.get('/media/insights', authenticateToken, RichMediaIntelligenceController.getMediaIntelligenceInsights);
router.post('/media/validate', authenticateToken, RichMediaIntelligenceController.validateMediaForUser);

// Business Intelligence & CRM
router.post('/crm/contacts', authenticateToken, BusinessIntelligenceCRMController.createOrUpdateCRMContact);
router.get('/crm/contacts', authenticateToken, BusinessIntelligenceCRMController.getCRMContacts);
router.post('/crm/opportunities', authenticateToken, BusinessIntelligenceCRMController.createBusinessOpportunity);
router.get('/crm/opportunities', authenticateToken, BusinessIntelligenceCRMController.getBusinessOpportunities);
router.post('/crm/interactions', authenticateToken, BusinessIntelligenceCRMController.createCustomerInteraction);
router.get('/crm/contacts/:contactId/interactions', authenticateToken, BusinessIntelligenceCRMController.getCustomerInteractions);
router.get('/crm/communication-patterns', authenticateToken, BusinessIntelligenceCRMController.analyzeCommunicationPatterns);
router.get('/crm/sales-funnel', authenticateToken, BusinessIntelligenceCRMController.generateSalesFunnel);
router.get('/crm/insights', authenticateToken, BusinessIntelligenceCRMController.generateBusinessInsights);
router.put('/crm/contacts/:contactId/tags', authenticateToken, BusinessIntelligenceCRMController.updateContactTags);
router.get('/crm/contacts/:contactId/timeline', authenticateToken, BusinessIntelligenceCRMController.getContactTimeline);
router.get('/crm/contacts/:contactId/next-action', authenticateToken, BusinessIntelligenceCRMController.predictNextAction);
router.get('/crm/contact-scores', authenticateToken, BusinessIntelligenceCRMController.generateContactScores);
router.post('/crm/contacts/import', authenticateToken, BusinessIntelligenceCRMController.importContacts);

// Accessibility Enhancement
router.get('/accessibility/settings', authenticateToken, AccessibilityEnhancementController.getAccessibilitySettings);
router.put('/accessibility/settings', authenticateToken, AccessibilityEnhancementController.updateAccessibilitySettings);
router.post('/accessibility/voice-command', authenticateToken, AccessibilityEnhancementController.processVoiceCommand);
router.post('/accessibility/screen-reader/message', authenticateToken, AccessibilityEnhancementController.generateScreenReaderTextForMessage);
router.post('/accessibility/screen-reader/conversation', authenticateToken, AccessibilityEnhancementController.generateScreenReaderTextForConversation);
router.post('/accessibility/voice-commands', authenticateToken, AccessibilityEnhancementController.createVoiceCommand);
router.get('/accessibility/voice-commands', authenticateToken, AccessibilityEnhancementController.getUserVoiceCommands);
router.post('/accessibility/keyboard-shortcuts', authenticateToken, AccessibilityEnhancementController.createKeyboardShortcut);
router.get('/accessibility/keyboard-shortcuts', authenticateToken, AccessibilityEnhancementController.getUserKeyboardShortcuts);
router.post('/accessibility/feedback', authenticateToken, AccessibilityEnhancementController.recordAccessibilityFeedback);
router.get('/accessibility/insights', authenticateToken, AccessibilityEnhancementController.getAccessibilityInsights);
router.post('/accessibility/media-alt-text', authenticateToken, AccessibilityEnhancementController.getMediaTextAlternative);
router.get('/accessibility/ui-config', authenticateToken, AccessibilityEnhancementController.getAccessibleUIConfiguration);
router.post('/accessibility/validate-component', authenticateToken, AccessibilityEnhancementController.validateComponentAccessibility);

// Offline Capabilities
router.get('/offline/settings', authenticateToken, OfflineCapabilitiesController.getOfflineSettings);
router.put('/offline/settings', authenticateToken, OfflineCapabilitiesController.updateOfflineSettings);
router.post('/offline/messages', authenticateToken, OfflineCapabilitiesController.queueOfflineMessage);
router.get('/offline/pending-sync', authenticateToken, OfflineCapabilitiesController.getPendingSyncItems);
router.get('/offline/messages', authenticateToken, OfflineCapabilitiesController.getOfflineMessages);
router.post('/offline/sync', authenticateToken, OfflineCapabilitiesController.triggerSync);
router.get('/offline/sync-status', authenticateToken, OfflineCapabilitiesController.getSyncStatus);
router.delete('/offline/cache', authenticateToken, OfflineCapabilitiesController.clearOfflineCache);
router.get('/offline/export', authenticateToken, OfflineCapabilitiesController.exportOfflineData);
router.get('/offline/storage-usage', authenticateToken, OfflineCapabilitiesController.getOfflineStorageUsage);
router.post('/offline/network-status', authenticateToken, OfflineCapabilitiesController.handleNetworkStatusChange);
router.post('/offline/compact-storage', authenticateToken, OfflineCapabilitiesController.compactOfflineStorage);

// Advanced Search & Knowledge Management
router.get('/search', authenticateToken, AdvancedSearchKnowledgeManagementController.performSearch);
router.post('/knowledge/articles', authenticateToken, AdvancedSearchKnowledgeManagementController.createKnowledgeArticle);
router.post('/knowledge/articles/from-message', authenticateToken, AdvancedSearchKnowledgeManagementController.createArticleFromMessage);
router.get('/knowledge/articles', authenticateToken, AdvancedSearchKnowledgeManagementController.getKnowledgeArticles);
router.post('/knowledge/topics', authenticateToken, AdvancedSearchKnowledgeManagementController.upsertKnowledgeTopic);
router.get('/knowledge/topics', authenticateToken, AdvancedSearchKnowledgeManagementController.getKnowledgeTopics);
router.get('/knowledge/insights', authenticateToken, AdvancedSearchKnowledgeManagementController.generateKnowledgeInsights);
router.post('/messages/:messageId/annotate', authenticateToken, AdvancedSearchKnowledgeManagementController.annotateMessage);
router.get('/messages/:messageId/annotations', authenticateToken, AdvancedSearchKnowledgeManagementController.getMessageAnnotations);
router.post('/knowledge/generate-tags', authenticateToken, AdvancedSearchKnowledgeManagementController.generateTags);
router.post('/knowledge/summarize-conversation', authenticateToken, AdvancedSearchKnowledgeManagementController.createConversationSummary);
router.post('/knowledge/find-related', authenticateToken, AdvancedSearchKnowledgeManagementController.findRelatedContent);
router.put('/knowledge/articles/:articleId', authenticateToken, AdvancedSearchKnowledgeManagementController.updateKnowledgeArticle);
router.delete('/knowledge/articles/:articleId', authenticateToken, AdvancedSearchKnowledgeManagementController.deleteKnowledgeArticle);
router.post('/search/semantic', authenticateToken, AdvancedSearchKnowledgeManagementController.semanticSearch);
router.get('/search/suggestions', authenticateToken, AdvancedSearchKnowledgeManagementController.getSearchSuggestions);

// Cross-Device Synchronization
router.post('/devices', authenticateToken, CrossDeviceSynchronizationController.registerDevice);
router.put('/devices/:deviceId/activity', authenticateToken, CrossDeviceSynchronizationController.updateDeviceActivity);
router.get('/devices', authenticateToken, CrossDeviceSynchronizationController.getUserDevices);
router.get('/sync/sessions', authenticateToken, CrossDeviceSynchronizationController.getUserSyncSessions);
router.get('/devices/:deviceId/preferences', authenticateToken, CrossDeviceSynchronizationController.getDevicePreferences);
router.put('/devices/:deviceId/preferences', authenticateToken, CrossDeviceSynchronizationController.updateDevicePreferences);
router.get('/sync/history', authenticateToken, CrossDeviceSynchronizationController.getSyncHistory);
router.post('/sync/force', authenticateToken, CrossDeviceSynchronizationController.forceSync);
router.get('/sync/status', authenticateToken, CrossDeviceSynchronizationController.getSyncStatus);
router.post('/devices/:deviceId/disconnect', authenticateToken, CrossDeviceSynchronizationController.handleDeviceDisconnection);
router.post('/devices/:deviceId/reconnect', authenticateToken, CrossDeviceSynchronizationController.handleDeviceReconnection);
router.get('/devices/:deviceId/sync-token', authenticateToken, CrossDeviceSynchronizationController.getDeviceSyncToken);
router.post('/devices/:deviceId/remote-wipe', authenticateToken, CrossDeviceSynchronizationController.remoteWipeDevice);
router.delete('/devices/:deviceId/access', authenticateToken, CrossDeviceSynchronizationController.revokeDeviceAccess);
router.get('/devices/inactive', authenticateToken, CrossDeviceSynchronizationController.getInactiveDevices);
router.post('/sync/migrate', authenticateToken, CrossDeviceSynchronizationController.migrateData);

router.get('/conversations/:conversationId/messages', authenticateToken, MessageController.getMessages);
router.get('/messages/:messageId', authenticateToken, MessageController.getMessage);
router.post('/messages/:messageId/mark-read', authenticateToken, MessageController.markAsRead);
router.post('/conversations/:conversationId/mark-all-read', authenticateToken, MessageController.markConversationAsRead);
router.delete('/messages/:messageId', authenticateToken, MessageController.deleteMessage);
router.patch('/messages/:messageId/status', authenticateToken, MessageController.updateMessageStatus);
router.get('/messages/search', authenticateToken, MessageController.searchMessages);

// Identity Filter routes
router.post('/filters', authenticateToken, IdentityFilterController.createFilter);
router.get('/filters', authenticateToken, IdentityFilterController.getFilters);
router.get('/filters/:filterId', authenticateToken, IdentityFilterController.getFilter);
router.put('/filters/:filterId', authenticateToken, IdentityFilterController.updateFilter);
router.delete('/filters/:filterId', authenticateToken, IdentityFilterController.deleteFilter);
router.post('/filters/reorder', authenticateToken, IdentityFilterController.reorderFilters);

// AI Analysis routes (with rate limiting)
router.post(
  '/ai/analyze-sentiment',
  authenticateToken,
  aiRateLimit,
  AIAnalysisController.analyzeSentiment,
);
router.post(
  '/ai/categorize-message',
  authenticateToken,
  aiRateLimit,
  AIAnalysisController.categorizeMessage,
);
router.post(
  '/ai/reply-suggestions',
  authenticateToken,
  aiRateLimit,
  AIAnalysisController.generateReplySuggestions,
);
router.post(
  '/ai/search',
  authenticateToken,
  aiRateLimit,
  AIAnalysisController.semanticSearch,
);
router.get('/ai/health', AIAnalysisController.checkAIServiceHealth);
router.get('/ai/usage', authenticateToken, AIAnalysisController.getAIUsageMetrics);

export default router;
