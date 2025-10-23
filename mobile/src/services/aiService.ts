import { apiService } from './api';

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Get smart response suggestions for a conversation
   */
  async getSmartResponses(conversationId: string, previousMessage?: string): Promise<string[]> {
    try {
      const response = await apiService.client.get('/ai/smart-responses', {
        params: {
          conversationId,
          previousMessage
        }
      });
      
      return response.data.data.suggestions || [];
    } catch (error) {
      console.error('Error getting smart responses:', error);
      return [];
    }
  }

  /**
   * Analyze message tone
   */
  async analyzeMessageTone(content: string): Promise<{ tone: string; sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
    try {
      const response = await apiService.client.post('/ai/analyze-tone', {
        content
      });
      
      return response.data.data.analysis;
    } catch (error) {
      console.error('Error analyzing message tone:', error);
      return {
        tone: 'neutral',
        sentiment: 'neutral',
        confidence: 0.5
      };
    }
  }

  /**
   * Generate a draft response
   */
  async generateDraftResponse(conversationId: string, userInput: string): Promise<string> {
    try {
      const response = await apiService.client.post('/ai/draft-response', {
        conversationId,
        userInput
      });
      
      return response.data.data.draft;
    } catch (error) {
      console.error('Error generating draft response:', error);
      return userInput; // Return original input as fallback
    }
  }
}

export const aiService = AIService.getInstance();