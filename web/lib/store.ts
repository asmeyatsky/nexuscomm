'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setTokens: (accessToken) =>
        set({
          accessToken,
          isLoading: false,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-store',
    }
  )
);

// Conversations Store
export interface Conversation {
  id: string;
  participantNames: string[];
  lastMessage?: string;
  unreadCount: number;
  lastMessageTimestamp?: Date;
}

export interface ConversationState {
  conversations: Conversation[];
  selectedId: string | null;
  setConversations: (conversations: Conversation[]) => void;
  selectConversation: (id: string) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  selectedId: null,
  setConversations: (conversations) => set({ conversations }),
  selectConversation: (id) => set({ selectedId: id }),
}));

// Theme Store
export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));
