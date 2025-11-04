/**
 * Message Entity Tests
 * 
 * Architectural Intent:
 * - Tests for the Message domain entity
 * - Validates business rules and invariants
 * - Ensures proper encapsulation and immutability
 * - Follows testing guidelines from skill.md
 * 
 * Key Design Decisions:
 * 1. Tests all business methods
 * 2. Verifies immutability (original unchanged after operations)
 * 3. Validates error conditions
 * 4. Tests edge cases and limits
 */

import { Message } from '@domain/entities/Message';
import { MessageContent } from '@domain/value_objects/MessageContent';
import { Attachment } from '@domain/value_objects/Attachment';
import { Reaction } from '@domain/value_objects/Reaction';

describe('Message Entity', () => {
  const baseMessageProps = {
    conversationId: 'conv-123',
    userId: 'user-123',
    senderExternalId: 'ext-123',
    senderName: 'Test User',
    content: new MessageContent({ text: 'Hello, world!' }),
    channelType: 'internal',
    externalId: 'ext-msg-123',
    direction: 'outbound' as const,
    createdAt: new Date(),
  };

  describe('constructor', () => {
    it('should create a message with valid properties', () => {
      const message = new Message(baseMessageProps);

      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe('conv-123');
      expect(message.userId).toBe('user-123');
      expect(message.senderExternalId).toBe('ext-123');
      expect(message.senderName).toBe('Test User');
      expect(message.content.text).toBe('Hello, world!');
      expect(message.channelType).toBe('internal');
      expect(message.externalId).toBe('ext-msg-123');
      expect(message.direction).toBe('outbound');
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', () => {
      const message = new Message(baseMessageProps);

      expect(message.isRead).toBe(false);
      expect(message.status).toBe('sent');
      expect(message.isEdited).toBe(false);
      expect(message.isDeleted).toBe(false);
      expect(message.replyCount).toBe(0);
      expect(message.attachments).toEqual([]);
      expect(message.reactions).toEqual([]);
      expect(message.editHistory).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should create a new message with isRead set to true', () => {
      const originalMessage = new Message(baseMessageProps);
      const updatedMessage = originalMessage.markAsRead();

      expect(originalMessage.isRead).toBe(false);
      expect(updatedMessage.isRead).toBe(true);
      expect(originalMessage).not.toBe(updatedMessage);
      expect(updatedMessage.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsDelivered', () => {
    it('should create a new message with status set to delivered', () => {
      const originalMessage = new Message({
        ...baseMessageProps,
        status: 'sent'
      });
      const updatedMessage = originalMessage.markAsDelivered();

      expect(originalMessage.status).toBe('sent');
      expect(updatedMessage.status).toBe('delivered');
      expect(originalMessage).not.toBe(updatedMessage);
    });
  });

  describe('markAsReadReceipt', () => {
    it('should create a new message with status set to read', () => {
      const originalMessage = new Message({
        ...baseMessageProps,
        status: 'delivered'
      });
      const updatedMessage = originalMessage.markAsReadReceipt();

      expect(originalMessage.status).toBe('delivered');
      expect(updatedMessage.status).toBe('read');
      expect(originalMessage).not.toBe(updatedMessage);
    });
  });

  describe('updateContent', () => {
    it('should update content and add to edit history', () => {
      const originalContent = new MessageContent({ text: 'Original content' });
      const newContent = new MessageContent({ text: 'Updated content' });
      
      const originalMessage = new Message({
        ...baseMessageProps,
        content: originalContent,
        createdAt: new Date(Date.now() - 1000) // Ensure it's within edit window
      });
      
      const updatedMessage = originalMessage.updateContent(newContent);

      expect(originalMessage.content.text).toBe('Original content');
      expect(updatedMessage.content.text).toBe('Updated content');
      expect(updatedMessage.isEdited).toBe(true);
      expect(updatedMessage.editHistory).toHaveLength(1);
      expect(updatedMessage.editHistory[0].content.text).toBe('Original content');
      expect(originalMessage).not.toBe(updatedMessage);
    });

    it('should throw error if edit window has expired', () => {
      const originalContent = new MessageContent({ text: 'Original content' });
      const newContent = new MessageContent({ text: 'Updated content' });
      
      // Create a message from 20 minutes ago (beyond 15 min window)
      const oldDate = new Date(Date.now() - 20 * 60 * 1000); 
      const oldMessage = new Message({
        ...baseMessageProps,
        content: originalContent,
        createdAt: oldDate
      });

      expect(() => oldMessage.updateContent(newContent, 15 * 60 * 1000))
        .toThrow('Edit window has expired');
    });
  });

  describe('softDelete', () => {
    it('should create a new deleted message', () => {
      const originalMessage = new Message(baseMessageProps);
      const deletedMessage = originalMessage.softDelete();

      expect(originalMessage.isDeleted).toBe(false);
      expect(deletedMessage.isDeleted).toBe(true);
      expect(deletedMessage.deletedAt).toBeInstanceOf(Date);
      expect(originalMessage).not.toBe(deletedMessage);
    });
  });

  describe('addReaction', () => {
    it('should add a new reaction', () => {
      const reaction = new Reaction({
        id: 'reaction-1',
        userId: 'user-2',
        emoji: '👍',
        messageId: 'msg-1',
        createdAt: new Date()
      });

      const originalMessage = new Message(baseMessageProps);
      const updatedMessage = originalMessage.addReaction(reaction);

      expect(originalMessage.reactions).toHaveLength(0);
      expect(updatedMessage.reactions).toHaveLength(1);
      expect(updatedMessage.reactions[0].emoji).toBe('👍');
      expect(originalMessage).not.toBe(updatedMessage);
    });

    it('should replace existing reaction from same user with same emoji', () => {
      const reaction1 = new Reaction({
        id: 'reaction-1',
        userId: 'user-2',
        emoji: '👍',
        messageId: 'msg-1',
        createdAt: new Date()
      });

      const reaction2 = new Reaction({
        id: 'reaction-2',
        userId: 'user-2',
        emoji: '👍',
        messageId: 'msg-1',
        createdAt: new Date()
      });

      const originalMessage = new Message({
        ...baseMessageProps,
        reactions: [reaction1]
      });
      
      const updatedMessage = originalMessage.addReaction(reaction2);

      expect(updatedMessage.reactions).toHaveLength(1);
      expect(updatedMessage.reactions[0].id).toBe('reaction-2');
    });
  });

  describe('removeReaction', () => {
    it('should remove a reaction', () => {
      const reaction1 = new Reaction({
        id: 'reaction-1',
        userId: 'user-2',
        emoji: '👍',
        messageId: 'msg-1',
        createdAt: new Date()
      });

      const reaction2 = new Reaction({
        id: 'reaction-2',
        userId: 'user-3',
        emoji: '❤️',
        messageId: 'msg-1',
        createdAt: new Date()
      });

      const originalMessage = new Message({
        ...baseMessageProps,
        reactions: [reaction1, reaction2]
      });
      
      const updatedMessage = originalMessage.removeReaction('user-2', '👍');

      expect(originalMessage.reactions).toHaveLength(2);
      expect(updatedMessage.reactions).toHaveLength(1);
      expect(updatedMessage.reactions[0].id).toBe('reaction-2');
      expect(originalMessage).not.toBe(updatedMessage);
    });
  });

  describe('addReply', () => {
    it('should increment reply count', () => {
      const originalMessage = new Message({
        ...baseMessageProps,
        replyCount: 5
      });
      const updatedMessage = originalMessage.addReply();

      expect(originalMessage.replyCount).toBe(5);
      expect(updatedMessage.replyCount).toBe(6);
      expect(originalMessage).not.toBe(updatedMessage);
    });
  });

  describe('isFromUser', () => {
    it('should return true if message is from specified user', () => {
      const message = new Message(baseMessageProps);
      
      expect(message.isFromUser('user-123')).toBe(true);
      expect(message.isFromUser('user-456')).toBe(false);
    });
  });

  describe('canBeEdited', () => {
    it('should return true if within edit window and not deleted', () => {
      const recentMessage = new Message({
        ...baseMessageProps,
        createdAt: new Date(Date.now() - 1000), // 1 second ago
        isDeleted: false
      });

      expect(recentMessage.canBeEdited(5000)).toBe(true); // 5 second window
    });

    it('should return false if outside edit window', () => {
      const oldMessage = new Message({
        ...baseMessageProps,
        createdAt: new Date(Date.now() - 10000), // 10 seconds ago
        isDeleted: false
      });

      expect(oldMessage.canBeEdited(5000)).toBe(false); // 5 second window
    });

    it('should return false if message is deleted', () => {
      const recentMessage = new Message({
        ...baseMessageProps,
        createdAt: new Date(Date.now() - 1000), // 1 second ago
        isDeleted: true
      });

      expect(recentMessage.canBeEdited()).toBe(false);
    });
  });
});