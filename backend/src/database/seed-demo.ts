import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from '../config/database';
import { User } from '../models/User';
import { Account, ChannelType } from '../models/Account';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { encrypt, hashPassword } from '../utils/encryption';

const DEMO_EMAIL = 'demo@nexuscomm.app';
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'demo1234';
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'demo_encryption_secret_32_chars!';

function daysAgo(days: number, hours = 0, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function seedDemo(): Promise<void> {
  await initializeDatabase();

  const userRepo = AppDataSource.getRepository(User);
  const accountRepo = AppDataSource.getRepository(Account);
  const conversationRepo = AppDataSource.getRepository(Conversation);
  const messageRepo = AppDataSource.getRepository(Message);

  console.log('\n--- NexusComm Demo Seed ---\n');

  // Find or create demo user
  let user = await userRepo.findOne({ where: { email: DEMO_EMAIL } });

  if (user) {
    console.log('Cleaning existing demo data...');
    await messageRepo.delete({ userId: user.id });
    await conversationRepo.delete({ userId: user.id });
    await accountRepo.delete({ userId: user.id });
    await userRepo.remove(user);
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  user = userRepo.create({
    email: DEMO_EMAIL,
    username: DEMO_USERNAME,
    displayName: 'Demo User',
    passwordHash,
    isEmailVerified: true,
    status: 'active',
    lastLoginAt: new Date(),
    preferences: { theme: 'system', notifications: true },
  });
  user = await userRepo.save(user);
  console.log(`Created demo user: ${user.email} (${user.id})`);

  // --- Accounts ---
  const accountDefs: Array<{
    channelType: ChannelType;
    identifier: string;
    displayName: string;
    syncStatus: number;
    hasToken: boolean;
    metadata: Record<string, unknown>;
    lastSyncedAt: Date | null;
  }> = [
    {
      channelType: 'whatsapp',
      identifier: '+1 555 234 8900',
      displayName: 'WhatsApp Business',
      syncStatus: 2,
      hasToken: true,
      metadata: { phoneId: 'waba_phone_001', accountId: 'waba_acct_001', webhookVerifyToken: 'nexus_verify_demo' },
      lastSyncedAt: daysAgo(0, 9, 0),
    },
    {
      channelType: 'email',
      identifier: 'demo@nexuscomm.app',
      displayName: 'Work Email',
      syncStatus: 2,
      hasToken: true,
      metadata: {},
      lastSyncedAt: daysAgo(0, 8, 30),
    },
    {
      channelType: 'instagram_dm',
      identifier: '@nexuscomm_official',
      displayName: 'NexusComm Instagram',
      syncStatus: 2,
      hasToken: true,
      metadata: { igUserId: 'ig_17841400000000' },
      lastSyncedAt: daysAgo(0, 10, 15),
    },
    {
      channelType: 'linkedin_dm',
      identifier: 'linkedin.com/in/demo-user',
      displayName: 'LinkedIn Profile',
      syncStatus: 2,
      hasToken: true,
      metadata: { personUrn: 'urn:li:person:demo-user-001' },
      lastSyncedAt: daysAgo(0, 7, 45),
    },
    {
      channelType: 'sms',
      identifier: '+1 555 234 8901',
      displayName: 'Business SMS',
      syncStatus: 0,
      hasToken: false,
      metadata: {},
      lastSyncedAt: null,
    },
    {
      channelType: 'telegram',
      identifier: '@nexuscomm_bot',
      displayName: 'Telegram Bot',
      syncStatus: 0,
      hasToken: false,
      metadata: {},
      lastSyncedAt: null,
    },
    {
      channelType: 'slack',
      identifier: 'demo@nexuscomm.slack.com',
      displayName: 'Slack Workspace',
      syncStatus: 0,
      hasToken: false,
      metadata: {},
      lastSyncedAt: null,
    },
  ];

  const accounts: Record<string, Account> = {};
  for (const def of accountDefs) {
    const account = accountRepo.create({
      userId: user.id,
      channelType: def.channelType,
      identifier: def.identifier,
      displayName: def.displayName,
      isActive: true,
      syncStatus: def.syncStatus,
      metadata: def.metadata,
      lastSyncedAt: def.lastSyncedAt,
      accessToken: def.hasToken ? encrypt(`mock_access_token_${def.channelType}`, ENCRYPTION_SECRET) : undefined,
      refreshToken: def.hasToken ? encrypt(`mock_refresh_token_${def.channelType}`, ENCRYPTION_SECRET) : undefined,
      tokenExpiresAt: def.hasToken ? daysAgo(-30) : undefined, // 30 days from now
    });
    accounts[def.channelType] = await accountRepo.save(account);
  }
  console.log(`Created ${Object.keys(accounts).length} accounts`);

  // --- Conversations & Messages ---

  // Helper to create a conversation and its messages
  async function createConversation(params: {
    participantName: string;
    participantId: string;
    channel: ChannelType;
    accountKey: string;
    messages: Array<{
      direction: 'inbound' | 'outbound';
      content: string;
      daysAgo: number;
      hours: number;
      minutes: number;
    }>;
    unreadCount: number;
  }): Promise<void> {
    const account = accounts[params.accountKey];
    const msgs = params.messages;
    const lastMsg = msgs[msgs.length - 1];

    const conversation = conversationRepo.create({
      userId: user!.id,
      participantIds: [params.participantId],
      participantNames: [params.participantName],
      participantAvatars: [],
      channels: [params.channel],
      lastMessage: lastMsg.content,
      lastMessageTimestamp: daysAgo(lastMsg.daysAgo, lastMsg.hours, lastMsg.minutes),
      lastMessageDirection: lastMsg.direction,
      unreadCount: params.unreadCount,
    });
    const savedConversation = await conversationRepo.save(conversation);

    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      const isInbound = msg.direction === 'inbound';
      const message = messageRepo.create({
        conversationId: savedConversation.id,
        userId: user!.id,
        senderAccountId: isInbound ? null : account.id,
        senderExternalId: isInbound ? params.participantId : account.identifier,
        senderName: isInbound ? params.participantName : 'Demo User',
        content: msg.content,
        channelType: params.channel,
        externalId: `${params.channel}_msg_${savedConversation.id.slice(0, 8)}_${i + 1}`,
        direction: msg.direction,
        status: 'delivered',
        isRead: msg.direction === 'outbound' || i < msgs.length - params.unreadCount,
        mediaUrls: [],
        metadata: {},
        createdAt: daysAgo(msg.daysAgo, msg.hours, msg.minutes),
      });
      await messageRepo.save(message);
    }
  }

  // 1. Sarah Chen via WhatsApp — product launch timing
  await createConversation({
    participantName: 'Sarah Chen',
    participantId: 'wa_sarah_chen_001',
    channel: 'whatsapp',
    accountKey: 'whatsapp',
    unreadCount: 1,
    messages: [
      { direction: 'inbound', content: 'Hey! Quick question — are we still targeting March 15th for the product launch?', daysAgo: 3, hours: 10, minutes: 15 },
      { direction: 'outbound', content: 'Hi Sarah! Yes, March 15th is confirmed. The engineering team just wrapped up the final sprint.', daysAgo: 3, hours: 10, minutes: 22 },
      { direction: 'inbound', content: 'Perfect. I\'ll sync with the PR team to get the press release out by March 10th. Can you send me the updated feature list?', daysAgo: 3, hours: 10, minutes: 30 },
      { direction: 'inbound', content: 'Also, the investor deck needs the new metrics. Can we schedule a 30-min call tomorrow?', daysAgo: 1, hours: 14, minutes: 5 },
    ],
  });

  // 2. Marketing Team via Email — Q1 campaign review
  await createConversation({
    participantName: 'Marketing Team',
    participantId: 'marketing-team@nexuscomm.app',
    channel: 'email',
    accountKey: 'email',
    unreadCount: 0,
    messages: [
      { direction: 'inbound', content: 'Subject: Q1 Campaign Review\n\nHi team, attached is the Q1 campaign performance report. Highlights:\n- Email open rates up 23%\n- Social engagement increased 45%\n- Lead gen exceeded target by 12%\n\nLet\'s discuss optimizations for Q2 in our Thursday meeting.', daysAgo: 5, hours: 9, minutes: 0 },
      { direction: 'outbound', content: 'Great numbers! A few questions before Thursday:\n1. Which campaigns drove the highest conversion rate?\n2. Should we increase the social ad budget based on the engagement data?\n3. Any A/B test results from the landing page experiments?', daysAgo: 5, hours: 11, minutes: 30 },
      { direction: 'inbound', content: 'Good questions! I\'ll pull the conversion data and A/B test results. Short answer on social budget: yes, we\'re seeing 3.2x ROAS on Instagram ads specifically. Will have the full breakdown ready for Thursday.', daysAgo: 4, hours: 16, minutes: 45 },
    ],
  });

  // 3. Alex Rivera via Instagram DM — brand collaboration
  await createConversation({
    participantName: 'Alex Rivera',
    participantId: 'ig_alex_rivera_creative',
    channel: 'instagram_dm',
    accountKey: 'instagram_dm',
    unreadCount: 1,
    messages: [
      { direction: 'inbound', content: 'Love what you\'re building with NexusComm! I run a design studio and would love to explore a brand collaboration. We have 50K+ engaged followers in the tech/startup space.', daysAgo: 2, hours: 15, minutes: 0 },
      { direction: 'outbound', content: 'Thanks Alex! We\'re definitely open to collaborations. What kind of partnership did you have in mind? We\'re particularly interested in co-created content or case studies.', daysAgo: 2, hours: 16, minutes: 20 },
      { direction: 'inbound', content: 'I was thinking a co-branded video series on "Modern Communication for Startups." We handle production, you provide the expertise. Could do 4-6 episodes. Want me to send over a rough proposal?', daysAgo: 1, hours: 11, minutes: 30 },
    ],
  });

  // 4. David Park via LinkedIn DM — partnership opportunity
  await createConversation({
    participantName: 'David Park',
    participantId: 'li_david_park_cto',
    channel: 'linkedin_dm',
    accountKey: 'linkedin_dm',
    unreadCount: 0,
    messages: [
      { direction: 'inbound', content: 'Hi! I\'m the CTO at Integra Solutions. We\'re building a CRM that could really benefit from a unified messaging integration. Would you be open to a partnership discussion?', daysAgo: 6, hours: 13, minutes: 0 },
      { direction: 'outbound', content: 'Hi David! That sounds like a great fit. We\'ve been looking to expand our integration ecosystem. What does your current messaging stack look like?', daysAgo: 6, hours: 14, minutes: 15 },
      { direction: 'inbound', content: 'We currently use separate integrations for email (SendGrid), WhatsApp (Twilio), and have nothing for social DMs. Your unified approach would simplify our stack significantly. Free for a call next week?', daysAgo: 5, hours: 10, minutes: 0 },
    ],
  });

  // 5. Sarah Chen via Email — same person, different channel
  await createConversation({
    participantName: 'Sarah Chen',
    participantId: 'sarah.chen@partnerco.com',
    channel: 'email',
    accountKey: 'email',
    unreadCount: 1,
    messages: [
      { direction: 'inbound', content: 'Subject: Partnership Agreement Draft\n\nHi, following up from our WhatsApp conversation. I\'ve attached the draft partnership agreement for your review. Key points:\n- Revenue share: 70/30\n- Exclusivity period: 6 months\n- Launch support included\n\nPlease review and let me know if you have any questions.', daysAgo: 1, hours: 9, minutes: 0 },
      { direction: 'outbound', content: 'Thanks Sarah! I\'ve reviewed the draft. Everything looks good except the exclusivity clause — can we discuss reducing it to 3 months? I\'ll mark up the document and send it back by EOD.', daysAgo: 0, hours: 11, minutes: 45 },
    ],
  });

  // --- Summary ---
  const accountCount = await accountRepo.count({ where: { userId: user.id } });
  const syncedCount = await accountRepo.count({ where: { userId: user.id, syncStatus: 2 } });
  const conversationCount = await conversationRepo.count({ where: { userId: user.id } });
  const messageCount = await messageRepo.count({ where: { userId: user.id } });

  console.log('\n=== Seed Complete ===');
  console.log(`User:          ${user.email} / ${DEMO_PASSWORD}`);
  console.log(`Accounts:      ${accountCount} total (${syncedCount} synced, ${accountCount - syncedCount} not synced)`);
  console.log(`Conversations: ${conversationCount}`);
  console.log(`Messages:      ${messageCount}`);
  console.log('\nChannels:');
  for (const def of accountDefs) {
    const status = def.syncStatus === 2 ? 'Connected' : 'Not Synced';
    console.log(`  ${def.channelType.padEnd(14)} ${def.identifier.padEnd(30)} ${status}`);
  }
  console.log('');
}

seedDemo()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
