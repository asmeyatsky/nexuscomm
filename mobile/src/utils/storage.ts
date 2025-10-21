import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: 'nexuscomm_access_token',
  REFRESH_TOKEN: 'nexuscomm_refresh_token',
  USER: 'nexuscomm_user',
  ACCOUNTS: 'nexuscomm_accounts',
  CONVERSATIONS: 'nexuscomm_conversations',
  FILTERS: 'nexuscomm_filters',
};

export const storage = {
  // Tokens
  async setAccessToken(token: string) {
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async setRefreshToken(token: string) {
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  // User
  async setUser(user: any) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const user = await AsyncStorage.getItem(KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  // Accounts
  async setAccounts(accounts: any[]) {
    await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  async getAccounts(): Promise<any[]> {
    const accounts = await AsyncStorage.getItem(KEYS.ACCOUNTS);
    return accounts ? JSON.parse(accounts) : [];
  },

  // Conversations
  async setConversations(conversations: any[]) {
    await AsyncStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
  },

  async getConversations(): Promise<any[]> {
    const conversations = await AsyncStorage.getItem(KEYS.CONVERSATIONS);
    return conversations ? JSON.parse(conversations) : [];
  },

  // Filters
  async setFilters(filters: any[]) {
    await AsyncStorage.setItem(KEYS.FILTERS, JSON.stringify(filters));
  },

  async getFilters(): Promise<any[]> {
    const filters = await AsyncStorage.getItem(KEYS.FILTERS);
    return filters ? JSON.parse(filters) : [];
  },

  // Clear all
  async clear() {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER,
      KEYS.ACCOUNTS,
      KEYS.CONVERSATIONS,
      KEYS.FILTERS,
    ]);
  },
};
