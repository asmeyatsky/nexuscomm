/**
 * MessageAnalysis Value Object Tests
 */

import { describe, it, expect } from 'vitest';
import { MessageAnalysis } from '../domain/valueObjects/MessageAnalysis';

describe('MessageAnalysis Value Object', () => {
  it('should create a valid MessageAnalysis', () => {
    const analysis = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1,
        overall: 'positive',
        confidence: 0.95,
      },
      { primary: 'greeting', confidence: 0.9 },
      [{ name: 'friendly', relevance: 0.85 }],
      ['User is friendly'],
    );

    expect(analysis.getMessageId()).toBe('msg-1');
    expect(analysis.getSentiment().overall).toBe('positive');
    expect(analysis.getCategories().primary).toBe('greeting');
  });

  it('should validate sentiment scores sum to 1', () => {
    expect(() => {
      new MessageAnalysis(
        'msg-1',
        {
          positive: 0.5,
          neutral: 0.3,
          negative: 0.1, // Sum = 0.9, not 1
          overall: 'positive',
          confidence: 0.9,
        },
        { primary: 'test', confidence: 0.8 },
        [],
        [],
      );
    }).toThrow('Sentiment scores must sum to 1');
  });

  it('should validate confidence is between 0 and 1', () => {
    expect(() => {
      new MessageAnalysis(
        'msg-1',
        {
          positive: 0.7,
          neutral: 0.2,
          negative: 0.1,
          overall: 'positive',
          confidence: 1.5, // Invalid
        },
        { primary: 'test', confidence: 0.8 },
        [],
        [],
      );
    }).toThrow('Confidence must be between 0 and 1');
  });

  it('should require messageId', () => {
    expect(() => {
      new MessageAnalysis(
        '',
        {
          positive: 0.7,
          neutral: 0.2,
          negative: 0.1,
          overall: 'positive',
          confidence: 0.9,
        },
        { primary: 'test', confidence: 0.8 },
        [],
        [],
      );
    }).toThrow('messageId is required');
  });

  it('should check confidence level', () => {
    const highConfidence = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.8,
        neutral: 0.1,
        negative: 0.1,
        overall: 'positive',
        confidence: 0.95,
      },
      { primary: 'greeting', confidence: 0.9 },
      [],
      [],
    );

    expect(highConfidence.isConfident(0.9)).toBe(true);
    expect(highConfidence.isConfident(0.99)).toBe(false);
  });

  it('should get tone description', () => {
    const analysis = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.8,
        neutral: 0.1,
        negative: 0.1,
        overall: 'positive',
        confidence: 0.9,
      },
      { primary: 'greeting', confidence: 0.9 },
      [],
      [],
    );

    const tone = analysis.getToneDescription();
    expect(tone).toContain('Positive');
    expect(tone).toContain('greeting');
  });

  it('should return immutable sentiment data', () => {
    const analysis = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1,
        overall: 'positive',
        confidence: 0.9,
      },
      { primary: 'test', confidence: 0.8 },
      [],
      [],
    );

    const sentiment1 = analysis.getSentiment();
    sentiment1.positive = 0.999; // Try to mutate

    const sentiment2 = analysis.getSentiment();
    expect(sentiment2.positive).toBe(0.7); // Should still be original value
  });

  it('should handle multiple themes', () => {
    const themes = [
      { name: 'urgent', relevance: 0.9 },
      { name: 'complaint', relevance: 0.85 },
      { name: 'request', relevance: 0.7 },
    ];

    const analysis = new MessageAnalysis(
      'msg-1',
      {
        positive: 0.2,
        neutral: 0.3,
        negative: 0.5,
        overall: 'negative',
        confidence: 0.92,
      },
      { primary: 'complaint', secondary: ['request'], confidence: 0.88 },
      themes,
      ['Multiple issues identified'],
    );

    expect(analysis.getThemes()).toHaveLength(3);
    expect(analysis.getThemes()[0].name).toBe('urgent');
  });
});
