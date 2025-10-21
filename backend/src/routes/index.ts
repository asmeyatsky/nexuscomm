import { Router, Request, Response } from 'express';
import { authenticateToken } from '@middleware/auth';
import * as AuthController from '@controllers/AuthController';
import * as AccountController from '@controllers/AccountController';
import * as ConversationController from '@controllers/ConversationController';
import * as MessageController from '@controllers/MessageController';
import * as IdentityFilterController from '@controllers/IdentityFilterController';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/profile', authenticateToken, AuthController.getProfile);
router.put('/auth/profile', authenticateToken, AuthController.updateProfile);
router.get('/auth/verify-email', AuthController.verifyEmail);

// Account routes
router.post('/accounts', authenticateToken, AccountController.addAccount);
router.get('/accounts', authenticateToken, AccountController.getAccounts);
router.get('/accounts/:accountId', authenticateToken, AccountController.getAccount);
router.post('/accounts/:accountId/disconnect', authenticateToken, AccountController.disconnectAccount);
router.patch('/accounts/:accountId/sync-status', authenticateToken, AccountController.updateSyncStatus);

// Conversation routes
router.post('/conversations', authenticateToken, ConversationController.createConversation);
router.get('/conversations', authenticateToken, ConversationController.getConversations);
router.get('/conversations/:conversationId', authenticateToken, ConversationController.getConversation);
router.post('/conversations/:conversationId/mark-read', authenticateToken, ConversationController.markAsRead);
router.post('/conversations/:conversationId/toggle-archive', authenticateToken, ConversationController.toggleArchive);
router.post('/conversations/:conversationId/toggle-pin', authenticateToken, ConversationController.togglePin);
router.post('/conversations/:conversationId/toggle-mute', authenticateToken, ConversationController.toggleMute);
router.get('/conversations/search', authenticateToken, ConversationController.searchConversations);

// Message routes
router.post('/messages', authenticateToken, MessageController.createMessage);
router.get('/conversations/:conversationId/messages', authenticateToken, MessageController.getMessages);
router.get('/messages/:messageId', authenticateToken, MessageController.getMessage);
router.post('/messages/:messageId/mark-read', authenticateToken, MessageController.markAsRead);
router.post('/conversations/:conversationId/mark-all-read', authenticateToken, MessageController.markConversationAsRead);
router.delete('/messages/:messageId', authenticateToken, MessageController.deleteMessage);
router.patch('/messages/:messageId/status', authenticateToken, MessageController.updateMessageStatus);
router.get('/messages/search', authenticateToken, MessageController.searchMessages);

// Identity Filter routes
router.post('/filters', authenticateToken, IdentityFilterController.createFilter);
router.get('/filters', authenticateToken, IdentityFilterController.getFilters);
router.get('/filters/:filterId', authenticateToken, IdentityFilterController.getFilter);
router.put('/filters/:filterId', authenticateToken, IdentityFilterController.updateFilter);
router.delete('/filters/:filterId', authenticateToken, IdentityFilterController.deleteFilter);
router.post('/filters/reorder', authenticateToken, IdentityFilterController.reorderFilters);

export default router;
