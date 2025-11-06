/**
 * ConversationSummary
 * Immutable value object representing a summarized conversation or message thread.
 */

export type SummaryLength = 'brief' | 'standard' | 'detailed';

export interface SummaryMetrics {
  messageCount: number;
  wordCount: number;
  participantCount: number;
  topicCount: number;
}

export class ConversationSummary {
  readonly conversationId: string;
  readonly messageIds: string[];
  readonly summary: string;
  readonly length: SummaryLength;
  readonly keyPoints: string[];
  readonly mainTopics: string[];
  readonly participants: string[];
  readonly metrics: SummaryMetrics;
  readonly generatedAt: Date;
  readonly expiresAt: Date;

  constructor(
    conversationId: string,
    messageIds: string[],
    summary: string,
    length: SummaryLength,
    keyPoints: string[],
    mainTopics: string[],
    participants: string[],
    metrics: SummaryMetrics,
    generatedAt: Date = new Date(),
    ttlHours: number = 24,
  ) {
    if (!conversationId || conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!summary || summary.trim().length === 0) {
      throw new Error('summary is required');
    }

    if (summary.length > 5000) {
      throw new Error('summary must not exceed 5000 characters');
    }

    if (keyPoints.length === 0) {
      throw new Error('at least one key point is required');
    }

    if (mainTopics.length === 0) {
      throw new Error('at least one main topic is required');
    }

    if (participants.length === 0) {
      throw new Error('at least one participant is required');
    }

    if (metrics.messageCount < messageIds.length) {
      throw new Error('messageCount must be at least messageIds.length');
    }

    this.conversationId = conversationId;
    this.messageIds = Object.freeze([...messageIds]);
    this.summary = summary;
    this.length = length;
    this.keyPoints = Object.freeze([...keyPoints]);
    this.mainTopics = Object.freeze([...mainTopics]);
    this.participants = Object.freeze([...participants]);
    this.metrics = Object.freeze({ ...metrics });
    this.generatedAt = new Date(generatedAt);
    this.expiresAt = new Date(generatedAt.getTime() + ttlHours * 60 * 60 * 1000);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Get summary by generating appropriate length based on content
   */
  getFormattedSummary(): string {
    const header = `Summary (${this.length}):\n\n`;
    const mainSection = `${this.summary}\n\n`;
    const keyPointsSection = `Key Points:\n${this.keyPoints.map((p) => `• ${p}`).join('\n')}\n\n`;
    const topicsSection = `Main Topics: ${this.mainTopics.join(', ')}\n`;
    const participantsSection = `Participants: ${this.participants.join(', ')}\n`;
    const metricsSection = `\nMetrics:\n- Messages: ${this.metrics.messageCount}\n- Words: ${this.metrics.wordCount}\n- Participants: ${this.metrics.participantCount}`;

    return header + mainSection + keyPointsSection + topicsSection + participantsSection + metricsSection;
  }

  /**
   * Check if summary covers significant content
   */
  isMeaningful(): boolean {
    return (
      this.keyPoints.length >= 1 &&
      this.mainTopics.length >= 1 &&
      this.metrics.messageCount >= 2 &&
      this.metrics.wordCount >= 50
    );
  }
}
