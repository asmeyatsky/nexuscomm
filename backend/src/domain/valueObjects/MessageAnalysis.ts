/**
 * MessageAnalysis Value Object
 * Represents the AI analysis results of a message including sentiment, category, and themes.
 * This is an immutable value object that encapsulates AI-derived insights about a message.
 */

export interface SentimentScore {
  positive: number; // 0-1 score
  neutral: number;  // 0-1 score
  negative: number; // 0-1 score
  overall: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1 confidence score
}

export interface MessageCategory {
  primary: string;
  secondary?: string[];
  confidence: number; // 0-1
}

export interface MessageTheme {
  name: string;
  relevance: number; // 0-1
}

export class MessageAnalysis {
  private readonly messageId: string;
  private readonly sentiment: SentimentScore;
  private readonly categories: MessageCategory;
  private readonly themes: MessageTheme[];
  private readonly summary?: string;
  private readonly keyInsights: string[];
  private readonly analyzedAt: Date;

  constructor(
    messageId: string,
    sentiment: SentimentScore,
    categories: MessageCategory,
    themes: MessageTheme[],
    keyInsights: string[],
    summary?: string,
  ) {
    this.messageId = messageId;
    this.sentiment = sentiment;
    this.categories = categories;
    this.themes = themes;
    this.keyInsights = keyInsights;
    this.summary = summary;
    this.analyzedAt = new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.messageId || this.messageId.trim().length === 0) {
      throw new Error('messageId is required');
    }

    const sentimentSum =
      this.sentiment.positive + this.sentiment.neutral + this.sentiment.negative;
    if (Math.abs(sentimentSum - 1) > 0.01) {
      throw new Error('Sentiment scores must sum to 1');
    }

    if (this.sentiment.confidence < 0 || this.sentiment.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }

    if (this.categories.confidence < 0 || this.categories.confidence > 1) {
      throw new Error('Category confidence must be between 0 and 1');
    }
  }

  getMessageId(): string {
    return this.messageId;
  }

  getSentiment(): SentimentScore {
    return { ...this.sentiment };
  }

  getCategories(): MessageCategory {
    return { ...this.categories };
  }

  getThemes(): MessageTheme[] {
    return [...this.themes];
  }

  getKeyInsights(): string[] {
    return [...this.keyInsights];
  }

  getSummary(): string | undefined {
    return this.summary;
  }

  getAnalyzedAt(): Date {
    return new Date(this.analyzedAt);
  }

  /**
   * Check if the analysis is confident enough for recommendations
   * @param threshold - Confidence threshold (0-1)
   */
  isConfident(threshold: number = 0.7): boolean {
    return (
      this.sentiment.confidence >= threshold &&
      this.categories.confidence >= threshold
    );
  }

  /**
   * Get overall tone description for UI display
   */
  getToneDescription(): string {
    const sentiment = this.sentiment.overall;
    const primaryCategory = this.categories.primary;
    return `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} tone - ${primaryCategory}`;
  }
}
