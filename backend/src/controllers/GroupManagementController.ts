import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { EnhancedGroupManagementService } from '@services/EnhancedGroupManagementService';

const enhancedGroupManagementService = new EnhancedGroupManagementService();

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, participantIds, channelTypes, isSmartGroup, smartGroupRule, settings } = req.body;

  if (!name || !participantIds || !channelTypes) {
    return res.status(400).json({
      success: false,
      error: 'Group name, participant IDs, and channel types are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const group = await enhancedGroupManagementService.createGroup(req.userId!, {
      name,
      description,
      participantIds,
      channelTypes,
      isSmartGroup,
      smartGroupRule,
      settings
    });

    res.status(201).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group',
      code: 'CREATE_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({
      success: false,
      error: 'Group ID is required',
      code: 'MISSING_GROUP_ID',
      timestamp: new Date(),
    });
  }

  try {
    const group = await enhancedGroupManagementService.getGroup(groupId, req.userId!);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
        code: 'GROUP_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group',
      code: 'GET_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const updates = req.body;

  try {
    const group = await enhancedGroupManagementService.updateGroup(groupId, req.userId!, updates);

    res.status(200).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update group',
      code: 'UPDATE_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      error: 'Target user ID is required',
      code: 'MISSING_TARGET_USER_ID',
      timestamp: new Date(),
    });
  }

  try {
    const group = await enhancedGroupManagementService.addMember(groupId, req.userId!, targetUserId);

    res.status(200).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error adding member to group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member to group',
      code: 'ADD_MEMBER_ERROR',
      timestamp: new Date(),
    });
  }
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      error: 'Target user ID is required',
      code: 'MISSING_TARGET_USER_ID',
      timestamp: new Date(),
    });
  }

  try {
    const group = await enhancedGroupManagementService.removeMember(groupId, req.userId!, targetUserId);

    res.status(200).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member from group',
      code: 'REMOVE_MEMBER_ERROR',
      timestamp: new Date(),
    });
  }
});

export const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;

  try {
    await enhancedGroupManagementService.leaveGroup(groupId, req.userId!);

    res.status(200).json({
      success: true,
      data: { message: 'Successfully left group' },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave group',
      code: 'LEAVE_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});

export const sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { content, channelType, mediaUrls, replyToMessageId, mentions } = req.body;

  if (!content) {
    return res.status(400).json({
      success: false,
      error: 'Message content is required',
      code: 'MISSING_MESSAGE_CONTENT',
      timestamp: new Date(),
    });
  }

  try {
    const message = await enhancedGroupManagementService.sendGroupMessage(groupId, req.userId!, content, {
      channelType,
      mediaUrls,
      replyToMessageId,
      mentions
    });

    res.status(201).json({
      success: true,
      data: { message },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send group message',
      code: 'SEND_GROUP_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { limit, offset, since } = req.query;

  try {
    const messages = await enhancedGroupManagementService.getGroupMessages(groupId, req.userId!, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      since: since ? new Date(since as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: { messages },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting group messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group messages',
      code: 'GET_GROUP_MESSAGES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const pinMessage = asyncHandler(async (req: Request, res: Response) => {
  const { groupId, messageId } = req.params;

  if (!messageId) {
    return res.status(400).json({
      success: false,
      error: 'Message ID is required',
      code: 'MISSING_MESSAGE_ID',
      timestamp: new Date(),
    });
  }

  try {
    const message = await enhancedGroupManagementService.pinMessage(groupId, req.userId!, messageId);

    res.status(200).json({
      success: true,
      data: { message },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pin message',
      code: 'PIN_MESSAGE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getGroupInsights = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;

  try {
    const insights = await enhancedGroupManagementService.getGroupInsights(groupId, req.userId!);

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting group insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group insights',
      code: 'GET_GROUP_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getUserGroups = asyncHandler(async (req: Request, res: Response) => {
  try {
    const groups = await enhancedGroupManagementService.getUserGroups(req.userId!);

    res.status(200).json({
      success: true,
      data: { groups },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user groups',
      code: 'GET_USER_GROUPS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const searchGroups = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
      code: 'MISSING_SEARCH_QUERY',
      timestamp: new Date(),
    });
  }

  try {
    const groups = await enhancedGroupManagementService.searchGroups(req.userId!, query as string);

    res.status(200).json({
      success: true,
      data: { groups },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error searching groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search groups',
      code: 'SEARCH_GROUPS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getGroupActivityHistory = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { limit, since } = req.query;

  try {
    const activities = await enhancedGroupManagementService.getGroupActivityHistory(groupId, req.userId!, {
      limit: limit ? parseInt(limit as string) : 50,
      since: since ? new Date(since as string) : undefined
    });

    res.status(200).json({
      success: true,
      data: { activities },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting group activity history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group activity history',
      code: 'GET_GROUP_ACTIVITY_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createSmartGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, smartGroupRule, channelTypes, settings } = req.body;

  if (!name || !smartGroupRule || !channelTypes) {
    return res.status(400).json({
      success: false,
      error: 'Group name, smart group rule, and channel types are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const group = await enhancedGroupManagementService.createSmartGroup(req.userId!, {
      name,
      description,
      smartGroupRule,
      channelTypes,
      settings
    });

    res.status(201).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating smart group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create smart group',
      code: 'CREATE_SMART_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});