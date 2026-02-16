import { AccountService } from '@services/AccountService';
import { MessageIngestionService, ExternalMessage } from '@services/MessageIngestionService';
import { WhatsAppIntegration } from '@/integrations/WhatsAppIntegration';
import { GmailIntegration } from '@/integrations/GmailIntegration';
import { InstagramIntegration } from '@/integrations/InstagramIntegration';
import { LinkedInIntegration } from '@/integrations/LinkedInIntegration';
import { BaseIntegration } from '@/integrations/BaseIntegration';
import { Account, ChannelType } from '@models/Account';
import pino from 'pino';

const logger = pino({ name: 'ChannelSyncService' });

/**
 * Orchestrates the sync lifecycle for connected accounts.
 * Creates integration instances, triggers initial sync, and normalizes messages.
 */
export class ChannelSyncService {
  private accountService = new AccountService();
  private ingestionService = new MessageIngestionService();

  /**
   * Create the correct integration instance from an account's decrypted tokens.
   * Throws for unsupported channel types.
   */
  createIntegration(account: Account): BaseIntegration {
    const { channelType, accessToken, identifier, metadata } = account;

    if (!accessToken) {
      throw new Error(`No access token available for account ${account.id}`);
    }

    switch (channelType) {
      case 'whatsapp':
        return new WhatsAppIntegration(
          (metadata?.accountId as string) || '',
          (metadata?.phoneId as string) || '',
          accessToken,
          (metadata?.webhookVerifyToken as string) || ''
        );

      case 'email':
        return new GmailIntegration(accessToken);

      case 'instagram_dm':
        return new InstagramIntegration(
          accessToken,
          (metadata?.igUserId as string) || identifier
        );

      case 'linkedin_dm':
        return new LinkedInIntegration(
          accessToken,
          (metadata?.personUrn as string) || identifier
        );

      case 'sms':
      case 'telegram':
      case 'slack':
        throw new Error(`Channel type "${channelType}" is not yet supported for sync`);

      default:
        throw new Error(`Unknown channel type: ${channelType}`);
    }
  }

  /**
   * Trigger the initial sync for a newly connected account.
   * Sets syncStatus 0 → 1 (syncing) → 2 (synced) or 3 (error).
   * This runs asynchronously — callers should not await it in the request path.
   */
  async triggerInitialSync(accountId: string, userId: string): Promise<void> {
    logger.info({ accountId, userId }, 'Starting initial sync');

    try {
      // Set status to syncing (1)
      await this.accountService.updateSyncStatus(accountId, 1, userId);

      // Get account with decrypted tokens
      const account = await this.accountService.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found after creation');
      }

      // Skip sync if no access token is configured
      if (!account.accessToken) {
        logger.info({ accountId }, 'No access token — marking as synced with no messages');
        await this.accountService.updateSyncStatus(accountId, 2, userId);
        return;
      }

      const integration = this.createIntegration(account);
      const rawMessages = await integration.fetchMessages();

      const normalized = this.normalizeMessages(account.channelType, rawMessages);

      const { created, skipped } = await this.ingestionService.ingestMessages(
        userId,
        accountId,
        account.channelType,
        normalized
      );

      logger.info({ accountId, created, skipped }, 'Initial sync complete');

      // Set status to synced (2)
      await this.accountService.updateSyncStatus(accountId, 2, userId);
    } catch (error) {
      logger.error({ accountId, error }, 'Initial sync failed');

      // Set status to error (3)
      try {
        await this.accountService.updateSyncStatus(accountId, 3, userId);
      } catch (statusError) {
        logger.error({ accountId, statusError }, 'Failed to update sync status to error');
      }
    }
  }

  /**
   * Normalize raw provider-specific messages into the common ExternalMessage format.
   */
  normalizeMessages(channelType: ChannelType, rawData: unknown): ExternalMessage[] {
    switch (channelType) {
      case 'whatsapp':
        return this.normalizeWhatsAppMessages(rawData);
      case 'email':
        return this.normalizeGmailMessages(rawData);
      case 'instagram_dm':
        return this.normalizeInstagramMessages(rawData);
      case 'linkedin_dm':
        return this.normalizeLinkedInMessages(rawData);
      default:
        return [];
    }
  }

  private normalizeWhatsAppMessages(rawData: unknown): ExternalMessage[] {
    const data = rawData as { data?: Array<Record<string, unknown>> };
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((msg) => ({
      externalId: String(msg.id || ''),
      senderId: String(msg.from || ''),
      senderName: String(msg.from || 'Unknown'),
      content: String((msg.text as Record<string, unknown>)?.body || msg.text || ''),
      timestamp: new Date(Number(msg.timestamp) * 1000 || Date.now()),
      direction: 'inbound' as const,
      metadata: { type: msg.type },
    }));
  }

  private normalizeGmailMessages(rawData: unknown): ExternalMessage[] {
    const data = rawData as { messages?: Array<{ id: string; threadId?: string }> };
    if (!data?.messages || !Array.isArray(data.messages)) return [];

    // Gmail fetchMessages returns message IDs — full content requires getMessage().
    // For initial sync we create placeholder entries; real content is fetched on demand.
    return data.messages.map((msg) => ({
      externalId: String(msg.id),
      senderId: 'gmail-sender',
      senderName: 'Email Sender',
      content: '(Email synced — open to view)',
      timestamp: new Date(),
      direction: 'inbound' as const,
      metadata: { threadId: msg.threadId, needsFullFetch: true },
    }));
  }

  private normalizeInstagramMessages(rawData: unknown): ExternalMessage[] {
    const data = rawData as { data?: Array<Record<string, unknown>> };
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((conv) => ({
      externalId: String(conv.id || ''),
      senderId: String(conv.id || ''),
      senderName: 'Instagram User',
      content: String(conv.snippet || ''),
      timestamp: new Date(String(conv.updated_time) || Date.now()),
      direction: 'inbound' as const,
    }));
  }

  private normalizeLinkedInMessages(rawData: unknown): ExternalMessage[] {
    const data = rawData as { elements?: Array<Record<string, unknown>> };
    if (!data?.elements || !Array.isArray(data.elements)) return [];

    return data.elements.map((elem) => ({
      externalId: String(elem.id || ''),
      senderId: String(elem.participants || ''),
      senderName: 'LinkedIn User',
      content: String(elem.lastActivity || ''),
      timestamp: new Date(Number(elem.lastActivityAt) || Date.now()),
      direction: 'inbound' as const,
    }));
  }
}
