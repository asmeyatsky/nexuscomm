/**
 * MessageSuggestion Value Object
 * Represents AI-generated reply suggestions based on conversation context.
 * This is an immutable value object that encapsulates suggested responses.
 */

export interface SuggestedReply {
  text: string;
  confidence: number; // 0-1 score
  tone: 'professional' | 'casual' | 'empathetic' | 'humorous';
  lengthCategory: 'short' | 'medium' | 'long';
  rationale?: string;
}

export class MessageSuggestion {
  private readonly messageId: string;
  private readonly conversationId: string;
  private readonly suggestions: SuggestedReply[];
  private readonly contextSummary: string;
  private readonly generatedAt: Date;
  private readonly expiresAt: Date;

  constructor(
    messageId: string,
    conversationId: string,
    suggestions: SuggestedReply[],
    contextSummary: string,
    ttlMinutes: number = 60,
  ) {
    this.messageId = messageId;
    this.conversationId = conversationId;
    this.suggestions = suggestions;
    this.contextSummary = contextSummary;
    this.generatedAt = new Date();
    this.expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    this.validate();
  }

  private validate(): void {
    if (!this.messageId || this.messageId.trim().length === 0) {
      throw new Error('messageId is required');
    }

    if (!this.conversationId || this.conversationId.trim().length === 0) {
      throw new Error('conversationId is required');
    }

    if (!Array.isArray(this.suggestions) || this.suggestions.length === 0) {
      throw new Error('At least one suggestion is required');
    }

    if (this.suggestions.length > 5) {
      throw new Error('Maximum 5 suggestions allowed');
    }

    this.suggestions.forEach((suggestion, index) => {
      if (!suggestion.text || suggestion.text.trim().length === 0) {
        throw new Error(`Suggestion ${index} text is required`);
      }

      if (suggestion.confidence < 0 || suggestion.confidence > 1) {
        throw new Error(
          `Suggestion ${index} confidence must be between 0 and 1`,
        );
      }

      // Trim text to reasonable length
      if (suggestion.text.length > 1000) {
        suggestion.text = suggestion.text.substring(0, 1000) + '...';
      }
    });
  }

  getMessageId(): string {
    return this.messageId;
  }

  getConversationId(): string {
    return this.conversationId;
  }

  getSuggestions(): SuggestedReply[] {
    return this.suggestions.map((s) => ({ ...s }));
  }

  /**
   * Get top N suggestions sorted by confidence
   */
  getTopSuggestions(count: number = 3): SuggestedReply[] {
    return [...this.suggestions]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count)
      .map((s) => ({ ...s }));
  }

  getContextSummary(): string {
    return this.contextSummary;
  }

  getGeneratedAt(): Date {
    return new Date(this.generatedAt);
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  /**
   * Check if the suggestions are still valid
   */
  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  /**
   * Get average confidence of all suggestions
   */
  getAverageConfidence(): number {
    if (this.suggestions.length === 0) return 0;
    const sum = this.suggestions.reduce((acc, s) => acc + s.confidence, 0);
    return sum / this.suggestions.length;
  }

  /**
   * Get suggestions above a confidence threshold
   */
  getSuggestionsByConfidence(minConfidence: number = 0.7): SuggestedReply[] {
    return this.suggestions
      .filter((s) => s.confidence >= minConfidence)
      .map((s) => ({ ...s }));
  }
}
