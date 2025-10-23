import { AppDataSource } from '@config/database';
import { Message } from '@models/Message';
import { Conversation } from '@models/Conversation';
import axios from 'axios';

export class AISmartResponseService {
  private messageRepository = AppDataSource.getRepository(Message);
  private conversationRepository = AppDataSource.getRepository(Conversation);

  constructor() {
    // Constructor empty - using axios directly
  }

  /**
   * Generate smart response suggestions based on conversation context
   */
  async generateSmartResponses(conversationId: string, previousMessage?: string): Promise<string[]> {
    try {
      // Fetch recent messages in the conversation for context
      const recentMessages = await this.getConversationContext(conversationId, 5);
      
      // Create a prompt for the AI model based on conversation context
      const prompt = this.buildSmartResponsePrompt(recentMessages, previousMessage);
      
      // Call the OpenAI API to generate response suggestions using axios
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that suggests brief, contextually appropriate responses for a messaging app. 
            Provide 3 to 5 response options that are concise and suitable for the conversation context. 
            Format as a JSON array of strings.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Parse the response and extract suggestions
      const suggestions = this.parseResponseSuggestions(response.data.choices[0].message.content);
      return suggestions;
    } catch (error) {
      console.error('Error generating smart responses:', error);
      // Fallback responses if AI fails
      return [
        'Thanks for the update!',
        'I\'ll get back to you soon',
        'Let me check and confirm'
      ];
    }
  }

  /**
   * Get conversation context for AI analysis
   */
  private async getConversationContext(conversationId: string, limit: number = 5): Promise<Message[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Build prompt for smart response generation
   */
  private buildSmartResponsePrompt(messages: Message[], previousMessage?: string): string {
    const context = messages.map(msg => 
      `[${msg.direction === 'inbound' ? 'THEM' : 'YOU'}]: ${msg.content}`
    ).join('\n');

    const prompt = `
      Conversation context:
      ${context}
      
      ${previousMessage ? `User wants to respond to: "${previousMessage}"` : ''}
      
      Provide 3 to 5 brief, contextually appropriate response suggestions. 
      Each suggestion should be natural and conversational.
      Format your answer as a JSON array of strings.
    `;

    return prompt;
  }

  /**
   * Parse the AI response to extract response suggestions
   */
  private parseResponseSuggestions(aiResponse: string | null): string[] {
    if (!aiResponse) {
      return [];
    }

    try {
      // Try to parse as JSON first (expected format)
      const parsed = JSON.parse(aiResponse);
      if (Array.isArray(parsed)) {
        // Ensure each item is a string and not too long
        return parsed
          .filter(item => typeof item === 'string')
          .map(item => item.trim())
          .filter(item => item.length > 0 && item.length < 200)
          .slice(0, 5);
      }
    } catch (e) {
      // If not JSON, try to extract suggestions from plain text
      const matches = aiResponse.match(/\d+\.\s*(.*?)(?=\n\d+\.|$)/gs);
      if (matches) {
        return matches
          .map(match => match.replace(/^\d+\.\s*/, '').trim())
          .filter(item => item.length > 0 && item.length < 200)
          .slice(0, 5);
      }
    }

    // If all parsing fails, return empty array
    return [];
  }

  /**
   * Analyze message tone to help with response suggestions
   */
  async analyzeMessageTone(content: string): Promise<{ tone: string; sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze the tone and sentiment of the following message. 
            Respond with a JSON object in the format: 
            {"tone": "formal|casual|friendly|professional|concerned|excited|etc", 
             "sentiment": "positive|neutral|negative", 
             "confidence": 0.0-1.0}`
          },
          {
            role: 'user',
            content: `Analyze this message: "${content}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      try {
        const analysis = JSON.parse(response.data.choices[0].message.content);
        return {
          tone: analysis.tone || 'neutral',
          sentiment: analysis.sentiment || 'neutral',
          confidence: analysis.confidence || 0.5
        };
      } catch (parseError) {
        return {
          tone: 'neutral',
          sentiment: 'neutral',
          confidence: 0.5
        };
      }
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
   * Generate a draft response based on context and user input
   */
  async generateDraftResponse(conversationId: string, userInput: string): Promise<string> {
    try {
      const recentMessages = await this.getConversationContext(conversationId, 3);
      const context = recentMessages.map(msg => 
        `[${msg.direction === 'inbound' ? 'THEM' : 'YOU'}]: ${msg.content}`
      ).join('\n');

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are helping to draft a response in a conversation. Create a natural, contextually appropriate response based on the conversation history and user input.'
          },
          {
            role: 'user',
            content: `Conversation:\n${context}\n\nUser wants to respond: "${userInput}"\n\nDraft an appropriate response:`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content?.trim() || userInput;
    } catch (error) {
      console.error('Error generating draft response:', error);
      return userInput; // Fallback to original input
    }
  }
}