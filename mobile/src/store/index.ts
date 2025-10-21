import { create } from 'zustand';
import {
  User,
  AuthState,
  ConversationState,
  MessageState,
  AccountState,
  FilterState,
  Conversation,
  Message,
  Account,
  IdentityFilter,
} from '@types/index';

/**
 * Auth Store
 */
export const useAuthStore = create<AuthState & {
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  }),
}));

/**
 * Conversations Store
 */
export const useConversationStore = create<ConversationState & {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  deleteConversation: (conversationId: string) => void;
  selectConversation: (conversation: Conversation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number) => void;
}>((set) => ({
  conversations: [],
  selectedConversation: null,
  isLoading: false,
  error: null,
  total: 0,
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  updateConversation: (conversation) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversation.id ? conversation : c
      ),
      selectedConversation:
        state.selectedConversation?.id === conversation.id
          ? conversation
          : state.selectedConversation,
    })),
  deleteConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
    })),
  selectConversation: (conversation) => set({ selectedConversation: conversation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTotal: (total) => set({ total }),
}));

/**
 * Messages Store
 */
export const useMessageStore = create<MessageState & {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  setSelectedConversation: (conversationId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number) => void;
  clearMessages: () => void;
}>((set) => ({
  messages: [],
  selectedConversationId: null,
  isLoading: false,
  error: null,
  total: 0,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === message.id ? message : m
      ),
    })),
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),
  setSelectedConversation: (conversationId) =>
    set({ selectedConversationId: conversationId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setTotal: (total) => set({ total }),
  clearMessages: () => set({ messages: [] }),
}));

/**
 * Accounts Store
 */
export const useAccountStore = create<AccountState & {
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),
  removeAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== accountId),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

/**
 * Filters Store
 */
export const useFilterStore = create<FilterState & {
  setFilters: (filters: IdentityFilter[]) => void;
  addFilter: (filter: IdentityFilter) => void;
  updateFilter: (filter: IdentityFilter) => void;
  removeFilter: (filterId: string) => void;
  selectFilter: (filterId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}>((set) => ({
  filters: [],
  selectedFilterId: null,
  isLoading: false,
  error: null,
  setFilters: (filters) => set({ filters }),
  addFilter: (filter) =>
    set((state) => ({
      filters: [...state.filters, filter],
    })),
  updateFilter: (filter) =>
    set((state) => ({
      filters: state.filters.map((f) =>
        f.id === filter.id ? filter : f
      ),
    })),
  removeFilter: (filterId) =>
    set((state) => ({
      filters: state.filters.filter((f) => f.id !== filterId),
    })),
  selectFilter: (filterId) => set({ selectedFilterId: filterId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
