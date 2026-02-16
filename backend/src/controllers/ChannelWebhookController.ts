import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { AppDataSource } from '@config/database';
import { Account } from '@models/Account';
import { ChannelSyncService } from '@services/ChannelSyncService';
import { MessageIngestionService, ExternalMessage } from '@services/MessageIngestionService';
import pino from 'pino';

const logger = pino({ name: 'ChannelWebhookController' });
const channelSyncService = new ChannelSyncService();
const ingestionService = new MessageIngestionService();
const accountRepository = AppDataSource.getRepository(Account);

/**
 * GET /webhooks/channel/whatsapp — Meta webhook verification challenge
 */
export const verifyWhatsAppWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';

  if (mode === 'subscribe' && token === expectedToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('WhatsApp webhook verification failed');
  return res.status(403).json({ error: 'Verification failed' });
};

/**
 * POST /webhooks/channel/whatsapp — Incoming WhatsApp messages
 */
export const handleWhatsAppWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  logger.info({ object: payload?.object }, 'WhatsApp webhook received');

  // Acknowledge immediately to avoid Meta retries
  res.status(200).json({ status: 'ok' });

  try {
    // Extract phone number from the webhook to find the matching account
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const phoneNumberId = value?.metadata?.phone_number_id;

    if (!phoneNumberId || !value?.messages?.length) return;

    // Find account by metadata.phoneId
    const accounts = await accountRepository
      .createQueryBuilder('a')
      .where('a.channelType = :type', { type: 'whatsapp' })
      .andWhere('a.isActive = true')
      .getMany();

    const account = accounts.find(
      (a) => a.metadata?.phoneId === phoneNumberId
    );

    if (!account) {
      logger.warn({ phoneNumberId }, 'No matching WhatsApp account found');
      return;
    }

    for (const msg of value.messages) {
      const externalMessage: ExternalMessage = {
        externalId: msg.id,
        senderId: msg.from,
        senderName: value.contacts?.[0]?.profile?.name || msg.from,
        content: msg.text?.body || '',
        timestamp: new Date(Number(msg.timestamp) * 1000),
        direction: 'inbound',
        mediaUrls: msg.image ? [msg.image.id] : [],
        metadata: { type: msg.type },
      };

      await ingestionService.ingestMessage(
        account.userId,
        account.id,
        'whatsapp',
        externalMessage
      );
    }
  } catch (error) {
    logger.error({ error }, 'Error processing WhatsApp webhook');
  }
});

/**
 * POST /webhooks/channel/instagram — Incoming Instagram DMs
 */
export const handleInstagramWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  logger.info('Instagram webhook received');

  res.status(200).json({ status: 'ok' });

  try {
    const messaging = payload?.entry?.[0]?.messaging;
    if (!messaging?.length) return;

    for (const event of messaging) {
      const recipientId = event.recipient?.id;

      // Find account by metadata.igUserId or identifier
      const account = await accountRepository
        .createQueryBuilder('a')
        .where('a.channelType = :type', { type: 'instagram_dm' })
        .andWhere('a.isActive = true')
        .andWhere('(a.identifier = :recipientId)', { recipientId })
        .getOne();

      if (!account) {
        logger.warn({ recipientId }, 'No matching Instagram account found');
        continue;
      }

      const externalMessage: ExternalMessage = {
        externalId: event.message?.mid || String(event.timestamp),
        senderId: event.sender?.id || '',
        senderName: event.sender?.id || 'Instagram User',
        content: event.message?.text || '',
        timestamp: new Date(event.timestamp),
        direction: 'inbound',
        mediaUrls: event.message?.attachments?.map((a: { payload?: { url?: string } }) => a.payload?.url).filter(Boolean) || [],
      };

      await ingestionService.ingestMessage(
        account.userId,
        account.id,
        'instagram_dm',
        externalMessage
      );
    }
  } catch (error) {
    logger.error({ error }, 'Error processing Instagram webhook');
  }
});

/**
 * POST /webhooks/channel/linkedin — Incoming LinkedIn messages
 */
export const handleLinkedInWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;
  logger.info('LinkedIn webhook received');

  res.status(200).json({ status: 'ok' });

  try {
    if (!payload?.eventMeta) return;

    const senderUrn = payload.eventMeta.senderUrn;
    const recipientUrn = payload.eventMeta.recipientUrn;

    // Find account by metadata.personUrn or identifier
    const account = await accountRepository
      .createQueryBuilder('a')
      .where('a.channelType = :type', { type: 'linkedin_dm' })
      .andWhere('a.isActive = true')
      .andWhere('(a.identifier = :recipientUrn)', { recipientUrn })
      .getOne();

    if (!account) {
      logger.warn({ recipientUrn }, 'No matching LinkedIn account found');
      return;
    }

    const externalMessage: ExternalMessage = {
      externalId: payload.eventMeta.eventId || String(Date.now()),
      senderId: senderUrn || '',
      senderName: senderUrn || 'LinkedIn User',
      content: payload.eventContent?.textContent || '',
      timestamp: new Date(payload.eventMeta.eventCreatedTime || Date.now()),
      direction: 'inbound',
    };

    await ingestionService.ingestMessage(
      account.userId,
      account.id,
      'linkedin_dm',
      externalMessage
    );
  } catch (error) {
    logger.error({ error }, 'Error processing LinkedIn webhook');
  }
});
