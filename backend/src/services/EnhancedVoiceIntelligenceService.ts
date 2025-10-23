import axios from 'axios';
import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { AppError } from '@middleware/errorHandler';

export interface VoiceAnalysisResult {
  emotion: string;
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  tone: string;
  speakingSpeed: number; // words per minute
  pitch: number; // hertz
  stressLevel: number; // 0-1 scale
  keywords: string[];
}

export interface VoiceProcessingResult {
  transcription: string;
  analysis: VoiceAnalysisResult;
  language: string;
  duration: number; // in seconds
}

export class EnhancedVoiceIntelligenceService {
  private messageRepository = AppDataSource.getRepository(Message);

  constructor() {
    // Initialize with API keys or configuration if needed
  }

  /**
   * Process voice input with emotion detection and analysis
   */
  async processVoiceInput(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      analyzeEmotion?: boolean;
      detectLanguage?: boolean;
      includeKeywords?: boolean;
    }
  ): Promise<VoiceProcessingResult> {
    try {
      // For now, we'll simulate the processing since we don't have actual audio processing
      // In a real implementation, this would send the audio to a service like:
      // - Google Speech-to-Text with sentiment analysis
      // - AWS Transcribe with Comprehend
      // - Azure Speech Services
      // - Custom ML model for emotion detection
      
      // Simulate transcription
      const transcription = await this.simulateTranscription(audioBuffer);
      
      // Simulate voice analysis
      const analysis = await this.analyzeVoiceCharacteristics(transcription);
      
      return {
        transcription,
        analysis,
        language: options?.language || 'en',
        duration: audioBuffer.length / 1000000 // rough approximation
      };
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw new AppError(500, 'Failed to process voice input', 'VOICE_PROCESSING_ERROR');
    }
  }

  /**
   * Simulate voice transcription (in real implementation, this would use actual STT service)
   */
  private async simulateTranscription(audioBuffer: Buffer): Promise<string> {
    // In a real implementation, this would send the audio to a transcription service
    // For now, return a simulated transcription
    return 'This is a simulated transcription of the audio input. In the full implementation, this would be actual speech-to-text conversion.';
  }

  /**
   * Analyze voice characteristics including emotion detection
   */
  private async analyzeVoiceCharacteristics(transcription: string): Promise<VoiceAnalysisResult> {
    // In a real implementation, this would use:
    // 1. Audio analysis for voice characteristics (pitch, speed, stress)
    // 2. NLP for sentiment and emotion analysis
    // 3. ML models for emotion detection
    
    // For now, we'll analyze just the text content using the existing AI service logic
    const sentiment = this.analyzeSentiment(transcription);
    const emotion = this.detectEmotion(transcription);
    const keywords = this.extractKeywords(transcription);
    
    // Simulated voice characteristics
    return {
      emotion,
      confidence: 0.8,
      sentiment,
      tone: this.determineTone(transcription),
      speakingSpeed: this.estimateSpeakingSpeed(transcription),
      pitch: 150, // average pitch in Hz
      stressLevel: this.estimateStressLevel(transcription),
      keywords
    };
  }

  /**
   * Analyze sentiment of the text
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple keyword-based sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'awesome', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Detect emotion from text
   */
  private detectEmotion(text: string): string {
    const emotions = [
      { name: 'happy', keywords: ['happy', 'joy', 'excited', 'pleased', 'delighted'] },
      { name: 'sad', keywords: ['sad', 'depressed', 'unhappy', 'sorrow', 'grief'] },
      { name: 'angry', keywords: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated'] },
      { name: 'fearful', keywords: ['scared', 'afraid', 'nervous', 'worried', 'anxious'] },
      { name: 'surprised', keywords: ['surprised', 'shocked', 'amazed', 'astonished'] },
      { name: 'disgusted', keywords: ['disgusted', 'sick', 'repulsed', 'nauseous'] }
    ];
    
    for (const emotion of emotions) {
      for (const keyword of emotion.keywords) {
        if (text.toLowerCase().includes(keyword)) {
          return emotion.name;
        }
      }
    }
    
    return 'neutral';
  }

  /**
   * Determine tone from text
   */
  private determineTone(text: string): string {
    if (text.includes('?') && (text.toLowerCase().includes('when') || text.toLowerCase().includes('how'))) {
      return 'inquisitive';
    } else if (text.includes('!') && text.length > 20) {
      return 'excited';
    } else if (text.toLowerCase().includes('please') || text.toLowerCase().includes('thank you')) {
      return 'polite';
    } else if (text.includes('urgent') || text.toLowerCase().includes('asap')) {
      return 'urgent';
    }
    
    return 'neutral';
  }

  /**
   * Estimate speaking speed from text
   */
  private estimateSpeakingSpeed(text: string): number {
    // Average speaking speed is about 150-160 words per minute
    const words = text.split(/\s+/).length;
    const estimatedDuration = words / 3; // roughly 3 words per second
    return Math.round((words / estimatedDuration) * 60); // words per minute
  }

  /**
   * Estimate stress level from text
   */
  private estimateStressLevel(text: string): number {
    // Simple stress detection based on capitalization, punctuation, and keywords
    let stressScore = 0;
    
    // Check for excessive punctuation
    if ((text.match(/[!]/g) || []).length > 2) stressScore += 0.3;
    if ((text.match(/[?]/g) || []).length > 2) stressScore += 0.2;
    
    // Check for aggressive keywords
    const aggressiveKeywords = ['calm down', 'stop', 'enough', 'shut up', 'hate'];
    for (const keyword of aggressiveKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        stressScore += 0.4;
      }
    }
    
    // Check for ALL CAPS
    const allCapsMatches = text.match(/[A-Z]{3,}/g);
    if (allCapsMatches) {
      stressScore += Math.min(0.5, allCapsMatches.length * 0.1);
    }
    
    return Math.min(1.0, stressScore);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in reality, this would use NLP
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    return words
      .filter(word => word.length > 3 && !commonWords.includes(word) && !word.match(/^\d+$/))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Process text for voice-like characteristics (for text that came from voice)
   */
  async analyzeVoiceText(text: string): Promise<VoiceAnalysisResult> {
    return this.analyzeVoiceCharacteristics(text);
  }

  /**
   * Generate emotion-appropriate response suggestions
   */
  async getEmotionAppropriateResponses(
    conversationId: string,
    detectedEmotion: string,
    sentiment: 'positive' | 'neutral' | 'negative'
  ): Promise<string[]> {
    // Based on detected emotion, suggest appropriate responses
    const emotionResponses: Record<string, string[]> = {
      happy: [
        'That\'s wonderful to hear!',
        'I\'m so glad you\'re happy!',
        'Great news! 😊'
      ],
      sad: [
        'I\'m sorry you\'re feeling down',
        'That sounds difficult. How can I help?',
        'Sending you support during this time 💙'
      ],
      angry: [
        'I understand your frustration',
        'Let me address your concerns',
        'I\'m here to help resolve this'
      ],
      fearful: [
        'I\'m here to help you through this',
        'What specifically concerns you?',
        'Is there anything I can do to help?'
      ],
      surprised: [
        'Wow, that\'s unexpected!',
        'Really? Tell me more!',
        'That\'s quite surprising!'
      ]
    };
    
    const baseResponses = emotionResponses[detectedEmotion] || [
      'Thanks for sharing',
      'I understand',
      'How can I help?'
    ];
    
    // Add sentiment-appropriate variations
    if (sentiment === 'negative') {
      return [...baseResponses, 'I\'m sorry to hear that', 'That sounds challenging'];
    } else if (sentiment === 'positive') {
      return [...baseResponses, 'That\'s great!', 'I\'m happy to hear that'];
    }
    
    return baseResponses;
  }
}