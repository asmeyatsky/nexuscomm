import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAccountStore, useMessageStore, useConversationStore } from '@store/index';
import { apiService } from '@services/api';
import { voiceService } from '@services/voiceService';
import { messageSendingService } from '@services/messageSendingService';
import { Account, ChannelType } from '@types/index';

interface ContextualReplyProps {
  conversationId: string;
  messageId: string;
  isVisible: boolean;
  onClose: () => void;
  onMessageSent?: () => void;
}

export const ContextualReply: React.FC<ContextualReplyProps> = ({
  conversationId,
  messageId,
  isVisible,
  onClose,
  onMessageSent,
}) => {
  const { accounts } = useAccountStore();
  const { conversations, selectedConversation } = useConversationStore();
  const { addMessage } = useMessageStore();
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');

  const availableChannels = Array.from(new Set(accounts.map((a) => a.channelType)));
  const conversation = selectedConversation?.id === conversationId ? selectedConversation : conversations.find(c => c.id === conversationId) || null;

  const handleChannelSelect = (channel: ChannelType) => {
    setSelectedChannel(channel);
    const account = accounts.find((a) => a.channelType === channel);
    setSelectedAccount(account || null);
    setShowChannelPicker(false);
  };

  const handleVoiceInput = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      await voiceService.stopListening();
      setIsRecording(false);
      return;
    }

    try {
      // Check if voice recognition is available
      const isAvailable = await voiceService.isAvailable();
      if (!isAvailable) {
        Alert.alert('Voice Recognition', 'Voice recognition is not available on this device.');
        return;
      }

      setIsRecording(true);
      setRecordedText('');
      
      voiceService.startListening((text) => {
        if (text) {
          // Append to current content
          setContent(prev => prev ? `${prev} ${text}` : text);
          setRecordedText(text);
        }
        setIsRecording(false);
      });
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Error', 'Failed to start voice recognition.');
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSend = useCallback(async () => {
    if (!content.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setIsLoading(true);

      let message;
      if (selectedChannel && selectedAccount) {
        // Use manual channel selection
        message = await apiService.sendMessage(
          conversationId,
          content,
          []
        );
      } else {
        // Use automatic platform selection
        if (conversation) {
          message = await messageSendingService.processAndSendMessage({
            conversationId,
            content,
            inputMethod: recordedText ? 'voice' : 'text',
            conversation,
            accounts,
            mediaUrls: []
          });
        } else {
          // Fallback to default behavior
          message = await apiService.sendMessage(
            conversationId,
            content,
            []
          );
        }
      }

      addMessage(message);
      setContent('');
      setSelectedChannel(null);
      setSelectedAccount(null);
      setRecordedText('');

      if (onMessageSent) {
        onMessageSent();
      }

      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [content, selectedChannel, selectedAccount, conversationId, conversation, accounts, addMessage, recordedText, onMessageSent, onClose]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reply</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>Send via:</Text>
          <TouchableOpacity
            style={styles.channelSelector}
            onPress={() => setShowChannelPicker(!showChannelPicker)}
          >
            <Text style={styles.selectorText}>
              {selectedChannel ? selectedChannel.toUpperCase() : 'Select Channel'}
            </Text>
          </TouchableOpacity>

          {showChannelPicker && (
            <View style={styles.channelPicker}>
              <FlatList
                data={availableChannels}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.channelOption,
                      selectedChannel === item && styles.selectedChannelOption,
                    ]}
                    onPress={() => handleChannelSelect(item)}
                  >
                    <Text style={styles.channelOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Account Info */}
        {selectedAccount && (
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Account:</Text>
            <Text style={styles.accountName}>{selectedAccount.displayName}</Text>
          </View>
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            multiline
            value={content}
            onChangeText={setContent}
            editable={!isLoading}
            placeholderTextColor="#999"
          />
          
          {/* Voice Input Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonActive
            ]}
            onPress={handleVoiceInput}
            disabled={isLoading}
          >
            <Text style={styles.voiceButtonText}>
              {isRecording ? '● Stop' : '🎤 Voice'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!content.trim()) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!content.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  channelSelector: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  selectorText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  channelPicker: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#ffffff',
    maxHeight: 200,
  },
  channelOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedChannelOption: {
    backgroundColor: '#eff6ff',
  },
  channelOptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  accountInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  voiceButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  voiceButtonActive: {
    backgroundColor: '#dc2626', // Red background when recording
  },
  voiceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
