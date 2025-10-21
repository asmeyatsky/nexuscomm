import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useMessageStore } from '@store/index';
import { apiService } from '@services/api';
import { formatTime } from '@utils/date';
import { Message } from '@types/index';

interface MessageListProps {
  conversationId: string;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isOutbound = message.direction === 'outbound';

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isOutbound ? styles.outbound : styles.inbound,
      ]}
    >
      {!isOutbound && (
        <View>
          <Text style={styles.senderName}>{message.senderName}</Text>
          <Text style={styles.channelName}>{message.channelType}</Text>
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isOutbound ? styles.bubbleOutbound : styles.bubbleInbound,
        ]}
      >
        <Text style={isOutbound ? styles.textOutbound : styles.textInbound}>
          {message.content}
        </Text>
      </View>

      <Text
        style={[
          styles.timestamp,
          isOutbound ? styles.timestampOutbound : styles.timestampInbound,
        ]}
      >
        {formatTime(new Date(message.createdAt))}
      </Text>

      {isOutbound && (
        <Text style={styles.status}>{message.status}</Text>
      )}
    </View>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { messages, isLoading, setLoading, setMessages, setError, setSelectedConversation } =
    useMessageStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setSelectedConversation(conversationId);
      const data = await apiService.getMessages(conversationId);
      setMessages(data.messages);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversationId, setMessages, setLoading, setError, setSelectedConversation]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
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
  messageBubbleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'column',
  },
  outbound: {
    alignItems: 'flex-end',
  },
  inbound: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 10,
    color: '#9ca3af',
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleOutbound: {
    backgroundColor: '#3b82f6',
  },
  bubbleInbound: {
    backgroundColor: '#f3f4f6',
  },
  textOutbound: {
    color: '#ffffff',
    fontSize: 15,
  },
  textInbound: {
    color: '#1f2937',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  timestampOutbound: {
    color: '#9ca3af',
  },
  timestampInbound: {
    color: '#9ca3af',
  },
  status: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
