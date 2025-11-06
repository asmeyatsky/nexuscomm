/**
 * MessageSuggestion Value Object Tests
 */

import { describe, it, expect } from 'vitest';
import { MessageSuggestion } from '../domain/valueObjects/MessageSuggestion';

describe('MessageSuggestion Value Object', () => {
  it('should create valid message suggestion', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        {
          text: 'Thanks for the update!',
          confidence: 0.95,
          tone: 'professional',
          lengthCategory: 'short',
        },
      ],
      'User received a status update',
    );

    expect(suggestion.getMessageId()).toBe('msg-1');
    expect(suggestion.getConversationId()).toBe('conv-1');
    expect(suggestion.getSuggestions()).toHaveLength(1);
    expect(suggestion.getSuggestions()[0].text).toBe('Thanks for the update!');
  });

  it('should require messageId', () => {
    expect(() => {
      new MessageSuggestion(
        '',
        'conv-1',
        [
          {
            text: 'test',
            confidence: 0.8,
            tone: 'casual',
            lengthCategory: 'short',
          },
        ],
        'context',
      );
    }).toThrow('messageId is required');
  });

  it('should require conversationId', () => {
    expect(() => {
      new MessageSuggestion(
        'msg-1',
        '',
        [
          {
            text: 'test',
            confidence: 0.8,
            tone: 'casual',
            lengthCategory: 'short',
          },
        ],
        'context',
      );
    }).toThrow('conversationId is required');
  });

  it('should require at least one suggestion', () => {
    expect(() => {
      new MessageSuggestion('msg-1', 'conv-1', [], 'context');
    }).toThrow('At least one suggestion is required');
  });

  it('should limit suggestions to 5', () => {
    expect(() => {
      new MessageSuggestion(
        'msg-1',
        'conv-1',
        Array.from({ length: 6 }, (_, i) => ({
          text: `Suggestion ${i}`,
          confidence: 0.8,
          tone: 'professional' as const,
          lengthCategory: 'short' as const,
        })),
        'context',
      );
    }).toThrow('Maximum 5 suggestions allowed');
  });

  it('should validate confidence values', () => {
    expect(() => {
      new MessageSuggestion(
        'msg-1',
        'conv-1',
        [
          {
            text: 'test',
            confidence: 1.5, // Invalid
            tone: 'casual',
            lengthCategory: 'short',
          },
        ],
        'context',
      );
    }).toThrow('confidence must be between 0 and 1');
  });

  it('should get top suggestions sorted by confidence', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        { text: 'Low confidence', confidence: 0.5, tone: 'casual', lengthCategory: 'short' },
        { text: 'High confidence', confidence: 0.95, tone: 'professional', lengthCategory: 'medium' },
        { text: 'Medium confidence', confidence: 0.75, tone: 'empathetic', lengthCategory: 'medium' },
      ],
      'context',
    );

    const topTwo = suggestion.getTopSuggestions(2);
    expect(topTwo).toHaveLength(2);
    expect(topTwo[0].confidence).toBe(0.95);
    expect(topTwo[1].confidence).toBe(0.75);
  });

  it('should check if suggestions are expired', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        {
          text: 'test',
          confidence: 0.8,
          tone: 'casual',
          lengthCategory: 'short',
        },
      ],
      'context',
      0, // TTL 0 minutes
    );

    // Should be expired immediately
    expect(suggestion.isExpired()).toBe(true);
  });

  it('should calculate average confidence', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        { text: 'One', confidence: 0.8, tone: 'casual', lengthCategory: 'short' },
        { text: 'Two', confidence: 0.9, tone: 'professional', lengthCategory: 'medium' },
        { text: 'Three', confidence: 0.6, tone: 'empathetic', lengthCategory: 'short' },
      ],
      'context',
    );

    const avgConfidence = suggestion.getAverageConfidence();
    expect(avgConfidence).toBeCloseTo(0.7667, 2);
  });

  it('should filter suggestions by confidence', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        { text: 'High 1', confidence: 0.9, tone: 'casual', lengthCategory: 'short' },
        { text: 'High 2', confidence: 0.85, tone: 'professional', lengthCategory: 'medium' },
        { text: 'Low', confidence: 0.6, tone: 'empathetic', lengthCategory: 'short' },
      ],
      'context',
    );

    const highConfidence = suggestion.getSuggestionsByConfidence(0.8);
    expect(highConfidence).toHaveLength(2);
    expect(highConfidence.every((s) => s.confidence >= 0.8)).toBe(true);
  });

  it('should return immutable suggestions', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        {
          text: 'Original',
          confidence: 0.8,
          tone: 'casual',
          lengthCategory: 'short',
        },
      ],
      'context',
    );

    const suggestions1 = suggestion.getSuggestions();
    suggestions1[0].text = 'Modified'; // Try to mutate

    const suggestions2 = suggestion.getSuggestions();
    expect(suggestions2[0].text).toBe('Original'); // Should still be original
  });

  it('should have valid expiry time in future', () => {
    const suggestion = new MessageSuggestion(
      'msg-1',
      'conv-1',
      [
        {
          text: 'test',
          confidence: 0.8,
          tone: 'casual',
          lengthCategory: 'short',
        },
      ],
      'context',
      60, // 60 minutes
    );

    expect(suggestion.isExpired()).toBe(false);
    const expiresAt = suggestion.getExpiresAt();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
