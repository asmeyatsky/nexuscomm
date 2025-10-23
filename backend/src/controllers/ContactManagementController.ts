import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { IntelligentContactManagementService } from '@services/IntelligentContactManagementService';

const intelligentContactService = new IntelligentContactManagementService();

export const createOrUpdateContact = asyncHandler(async (req: Request, res: Response) => {
  const contactData = req.body;

  if (!contactData.name) {
    return res.status(400).json({
      success: false,
      error: 'Contact name is required',
      code: 'MISSING_CONTACT_NAME',
      timestamp: new Date(),
    });
  }

  try {
    const contact = await intelligentContactService.createOrUpdateContact(
      req.userId!,
      contactData
    );

    res.status(201).json({
      success: true,
      data: { contact },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating/updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create or update contact',
      code: 'CONTACT_CREATE_UPDATE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getContact = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: 'Contact identifier is required',
      code: 'MISSING_IDENTIFIER',
      timestamp: new Date(),
    });
  }

  try {
    const contact = await intelligentContactService.getContact(req.userId!, identifier);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        code: 'CONTACT_NOT_FOUND',
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      data: { contact },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contact',
      code: 'GET_CONTACT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const linkContactMethods = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { methods } = req.body;

  if (!contactId || !methods || !Array.isArray(methods)) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID and methods array are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const linkedMethods = await intelligentContactService.linkContactMethods(contactId, methods);

    res.status(200).json({
      success: true,
      data: { methods: linkedMethods },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error linking contact methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link contact methods',
      code: 'LINK_CONTACT_METHODS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createSmartGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color, smartGroupRule } = req.body;

  if (!name || !smartGroupRule) {
    return res.status(400).json({
      success: false,
      error: 'Name and smart group rule are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const group = await intelligentContactService.createSmartGroup(req.userId!, {
      name,
      description,
      color: color || '#007AFF', // Default blue color
      smartGroupRule
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

export const createStaticGroup = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, color, contactIds } = req.body;

  if (!name || !contactIds || !Array.isArray(contactIds)) {
    return res.status(400).json({
      success: false,
      error: 'Name and contact IDs array are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const group = await intelligentContactService.createStaticGroup(req.userId!, {
      name,
      description,
      color: color || '#007AFF',
      contactIds
    });

    res.status(201).json({
      success: true,
      data: { group },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating static group:', error);
    res.status(500).json({
      success: true,
      error: 'Failed to create static group',
      code: 'CREATE_STATIC_GROUP_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getCommunicationPatterns = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;

  if (!contactId) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID is required',
      code: 'MISSING_CONTACT_ID',
      timestamp: new Date(),
    });
  }

  try {
    const patterns = await intelligentContactService.analyzeCommunicationPatterns(contactId, req.userId!);

    res.status(200).json({
      success: true,
      data: { patterns },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting communication patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get communication patterns',
      code: 'GET_COMMUNICATION_PATTERNS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const suggestBestContactTime = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;

  if (!contactId) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID is required',
      code: 'MISSING_CONTACT_ID',
      timestamp: new Date(),
    });
  }

  try {
    const bestTime = await intelligentContactService.suggestBestContactTime(contactId, req.userId!);

    res.status(200).json({
      success: true,
      data: { bestTime },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error suggesting best contact time:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest best contact time',
      code: 'SUGGEST_BEST_CONTACT_TIME_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getAllContacts = asyncHandler(async (req: Request, res: Response) => {
  const { relationship, tags, searchQuery, sortBy, sortOrder } = req.query;

  try {
    const contacts = await intelligentContactService.getAllContacts(req.userId!, {
      relationship: relationship as string,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]).map(t => t.toString()) : undefined,
      searchQuery: searchQuery as string,
      sortBy: sortBy as 'name' | 'lastContacted' | 'priority',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.status(200).json({
      success: true,
      data: { contacts, total: contacts.length },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting all contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contacts',
      code: 'GET_CONTACTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getContactRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query;

  try {
    const recommendations = await intelligentContactService.getContactRecommendations(
      req.userId!,
      limit ? parseInt(limit as string) : 5
    );

    res.status(200).json({
      success: true,
      data: { recommendations },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting contact recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contact recommendations',
      code: 'GET_CONTACT_RECOMMENDATIONS_ERROR',
      timestamp: new Date(),
    });
  }
});