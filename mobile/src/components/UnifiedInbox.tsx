import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useConversationStore, useFilterStore } from '@store/index';
import { apiService } from '@services/api';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedInboxProps {
  onSelectConversation: (conversationId: string) => void;
}

export const UnifiedInbox: React.FC<UnifiedInboxProps> = ({
  onSelectConversation,
}) => {
  const {
    conversations,
    setConversations,
    selectConversation,
    isLoading,
    setLoading,
    setError,
  } = useConversationStore();

  const { filters, selectedFilterId } = useFilterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getConversations();
      setConversations(data.conversations);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setConversations, setLoading, setError]);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Filter conversations based on search and selected filter
  useEffect(() => {
    let result = conversations;

    // Apply filter if selected
    if (selectedFilterId) {
      const selectedFilter = filters.find((f) => f.id === selectedFilterId);
      if (selectedFilter) {
        result = result.filter((conv) =>
          conv.channels.some((channel) =>
            selectedFilter.accountIds.some((id) => id)
          )
        );
      }
    }

    // Apply search
    if (searchQuery) {
      result = result.filter((conv) =>
        conv.participantNames
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        conv.lastMessage
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredConversations(result);
  }, [conversations, searchQuery, selectedFilterId, filters]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
    },
    [onSelectConversation]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleSelectConversation(item.id)}
    >
      <View style={styles.conversationContent}>
        <View style={styles.headerRow}>
          <Text style={styles.participantName}>
            {item.participantNames.join(', ')}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.timestamp}>
            {item.lastMessageTimestamp
              ? formatDistanceToNow(new Date(item.lastMessageTimestamp), {
                  addSuffix: true,
                })
              : ''}
          </Text>

          <View style={styles.channelsContainer}>
            {item.channels.map((channel: string, idx: number) => (
              <View key={idx} style={styles.channelBadge}>
                <Text style={styles.channelText}>
                  {channel.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && conversations.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conversationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conversationContent: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 13,
    color: '#6b7280',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  channelsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  channelBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  channelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
