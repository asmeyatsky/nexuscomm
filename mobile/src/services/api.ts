import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@store/index';

const API_URL = 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) throw new Error('No refresh token');

            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            useAuthStore.getState().setTokens(accessToken, refreshToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (error) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, username: string, displayName: string, password: string) {
    const response = await this.client.post('/auth/register', {
      email,
      username,
      displayName,
      password,
    });
    return response.data.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data.data.user;
  }

  async updateProfile(displayName: string, profilePicture?: string) {
    const response = await this.client.put('/auth/profile', {
      displayName,
      profilePicture,
    });
    return response.data.data.user;
  }

  // Account endpoints
  async addAccount(channelType: string, identifier: string, displayName: string, accessToken?: string, metadata?: any) {
    const response = await this.client.post('/accounts', {
      channelType,
      identifier,
      displayName,
      accessToken,
      metadata,
    });
    return response.data.data.account;
  }

  async getAccounts() {
    const response = await this.client.get('/accounts');
    return response.data.data.accounts;
  }

  async getAccount(accountId: string) {
    const response = await this.client.get(`/accounts/${accountId}`);
    return response.data.data.account;
  }

  async disconnectAccount(accountId: string) {
    await this.client.post(`/accounts/${accountId}/disconnect`);
  }

  // Conversation endpoints
  async createConversation(participantIds: string[], participantNames: string[], channels: string[]) {
    const response = await this.client.post('/conversations', {
      participantIds,
      participantNames,
      channels,
    });
    return response.data.data.conversation;
  }

  async getConversations(archived?: boolean, limit?: number, offset?: number) {
    const response = await this.client.get('/conversations', {
      params: { archived, limit, offset },
    });
    return response.data.data;
  }

  async getConversation(conversationId: string) {
    const response = await this.client.get(`/conversations/${conversationId}`);
    return response.data.data.conversation;
  }

  async markConversationAsRead(conversationId: string) {
    const response = await this.client.post(`/conversations/${conversationId}/mark-read`);
    return response.data.data.conversation;
  }

  async toggleArchive(conversationId: string) {
    const response = await this.client.post(`/conversations/${conversationId}/toggle-archive`);
    return response.data.data.conversation;
  }

  async togglePin(conversationId: string) {
    const response = await this.client.post(`/conversations/${conversationId}/toggle-pin`);
    return response.data.data.conversation;
  }

  async toggleMute(conversationId: string) {
    const response = await this.client.post(`/conversations/${conversationId}/toggle-mute`);
    return response.data.data.conversation;
  }

  async searchConversations(query: string) {
    const response = await this.client.get('/conversations/search', {
      params: { query },
    });
    return response.data.data.conversations;
  }

  // Message endpoints
  async sendMessage(conversationId: string, content: string, mediaUrls?: string[], autoSelectPlatform?: boolean) {
    const response = await this.client.post('/messages', {
      conversationId,
      content,
      mediaUrls,
      autoSelectPlatform,
    });
    return response.data.data.message;
  }

  // Voice message endpoint
  async sendVoiceMessage(conversationId: string, voiceContent: string, targetPlatform?: string, mediaUrls?: string[]) {
    const response = await this.client.post('/messages/voice', {
      conversationId,
      voiceContent,
      targetPlatform,
      mediaUrls,
    });
    return response.data.data.message;
  }

  // Email message endpoint
  async sendEmailMessage(conversationId: string, emailData: any) {
    const response = await this.client.post('/messages/email', {
      conversationId,
      emailData,
    });
    return response.data.data.message;
  }

  // Email response endpoint
  async sendEmailResponse(conversationId: string, emailResponse: string, targetPlatform?: string, mediaUrls?: string[]) {
    const response = await this.client.post('/messages/email-response', {
      conversationId,
      emailResponse,
      targetPlatform,
      mediaUrls,
    });
    return response.data.data.message;
  }

  async getMessages(conversationId: string, limit?: number, offset?: number) {
    const response = await this.client.get(`/conversations/${conversationId}/messages`, {
      params: { limit, offset },
    });
    return response.data.data;
  }

  async markMessageAsRead(messageId: string) {
    const response = await this.client.post(`/messages/${messageId}/mark-read`);
    return response.data.data.message;
  }

  async deleteMessage(messageId: string) {
    await this.client.delete(`/messages/${messageId}`);
  }

  async searchMessages(query: string) {
    const response = await this.client.get('/messages/search', {
      params: { query },
    });
    return response.data.data.messages;
  }

  // Filter endpoints
  async createFilter(name: string, accountIds: string[], description?: string, color?: string) {
    const response = await this.client.post('/filters', {
      name,
      accountIds,
      description,
      color,
    });
    return response.data.data.filter;
  }

  async getFilters() {
    const response = await this.client.get('/filters');
    return response.data.data.filters;
  }

  async updateFilter(filterId: string, updates: any) {
    const response = await this.client.put(`/filters/${filterId}`, updates);
    return response.data.data.filter;
  }

  async deleteFilter(filterId: string) {
    await this.client.delete(`/filters/${filterId}`);
  }

  async reorderFilters(filterIds: string[]) {
    const response = await this.client.post('/filters/reorder', { filterIds });
    return response.data.data.filters;
  }
}

export const apiService = new ApiService();
