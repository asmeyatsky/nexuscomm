import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { BusinessIntelligenceCRMService } from '@services/BusinessIntelligenceCRMService';

const businessIntelligenceCRMService = new BusinessIntelligenceCRMService();

export const createOrUpdateCRMContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, company, jobTitle, contactType, status, leadSource, assignedTo, tags, socialProfiles, notes, metadata } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Contact name is required',
      code: 'MISSING_CONTACT_NAME',
      timestamp: new Date(),
    });
  }

  try {
    const contact = await businessIntelligenceCRMService.createOrUpdateCRMContact(req.userId!, {
      name,
      email,
      phone,
      company,
      jobTitle,
      contactType,
      status,
      leadSource,
      assignedTo,
      tags: tags || [],
      socialProfiles,
      notes: notes || [],
      metadata
    });

    res.status(201).json({
      success: true,
      data: { contact },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating/updating CRM contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create or update CRM contact',
      code: 'CRM_CONTACT_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getCRMContacts = asyncHandler(async (req: Request, res: Response) => {
  const { status, contactType, tags, assignedTo, searchTerm, sortBy, sortOrder } = req.query;

  try {
    const contacts = await businessIntelligenceCRMService.getCRMContacts(req.userId!, {
      status: status ? (Array.isArray(status) ? status : [status]).map(s => s.toString()) : undefined,
      contactType: contactType ? (Array.isArray(contactType) ? contactType : [contactType]).map(ct => ct.toString()) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]).map(t => t.toString()) : undefined,
      assignedTo: assignedTo as string,
      searchTerm: searchTerm as string,
      sortBy: sortBy as 'name' | 'lastContacted' | 'status' | 'value',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.status(200).json({
      success: true,
      data: { contacts },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting CRM contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get CRM contacts',
      code: 'GET_CRM_CONTACTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createBusinessOpportunity = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, contactId, value, probability, stage, expectedCloseDate, pipeline, tags, activities, assignedTo, metadata } = req.body;

  if (!title || !contactId || value === undefined || probability === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Title, contact ID, value, and probability are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const opportunity = await businessIntelligenceCRMService.createBusinessOpportunity(req.userId!, {
      title,
      description,
      contactId,
      value,
      probability,
      stage: stage || 'prospecting',
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
      pipeline: pipeline || 'sales',
      tags: tags || [],
      activities: activities || [],
      assignedTo: assignedTo || req.userId,
      metadata
    });

    res.status(201).json({
      success: true,
      data: { opportunity },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating business opportunity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create business opportunity',
      code: 'CREATE_OPPORTUNITY_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getBusinessOpportunities = asyncHandler(async (req: Request, res: Response) => {
  const { stage, contactId, pipeline, assignedTo, searchTerm } = req.query;

  try {
    const opportunities = await businessIntelligenceCRMService.getBusinessOpportunities(req.userId!, {
      stage: stage ? (Array.isArray(stage) ? stage : [stage]).map(s => s.toString()) : undefined,
      contactId: contactId as string,
      pipeline: pipeline as string,
      assignedTo: assignedTo as string,
      searchTerm: searchTerm as string
    });

    res.status(200).json({
      success: true,
      data: { opportunities },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting business opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business opportunities',
      code: 'GET_OPPORTUNITIES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const createCustomerInteraction = asyncHandler(async (req: Request, res: Response) => {
  const { contactId, type, channel, direction, content, outcome, sentiment, importance, metadata } = req.body;

  if (!contactId || !type || !content) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID, type, and content are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const interaction = await businessIntelligenceCRMService.createCustomerInteraction(req.userId!, {
      contactId,
      type,
      channel,
      direction,
      content,
      outcome,
      sentiment: sentiment || 0,
      importance: importance || 'medium',
      metadata
    });

    res.status(201).json({
      success: true,
      data: { interaction },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error creating customer interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer interaction',
      code: 'CREATE_INTERACTION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getCustomerInteractions = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { limit, offset, type, startDate, endDate, sortBy, sortOrder } = req.query;

  if (!contactId) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID is required',
      code: 'MISSING_CONTACT_ID',
      timestamp: new Date(),
    });
  }

  try {
    const interactions = await businessIntelligenceCRMService.getCustomerInteractions(req.userId!, contactId, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      type: type ? (Array.isArray(type) ? type : [type]).map(t => t.toString()) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      sortBy: sortBy as 'date' | 'type' | 'importance',
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.status(200).json({
      success: true,
      data: { interactions },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting customer interactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer interactions',
      code: 'GET_INTERACTIONS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const analyzeCommunicationPatterns = asyncHandler(async (req: Request, res: Response) => {
  try {
    const patterns = await businessIntelligenceCRMService.analyzeCommunicationPatterns(req.userId!);

    res.status(200).json({
      success: true,
      data: { patterns },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error analyzing communication patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze communication patterns',
      code: 'ANALYZE_PATTERNS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateSalesFunnel = asyncHandler(async (req: Request, res: Response) => {
  const { pipelineId } = req.query;

  try {
    const funnel = await businessIntelligenceCRMService.generateSalesFunnel(req.userId!, pipelineId as string);

    res.status(200).json({
      success: true,
      data: { funnel },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating sales funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales funnel',
      code: 'GENERATE_FUNNEL_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateBusinessInsights = asyncHandler(async (req: Request, res: Response) => {
  const { period } = req.query;

  try {
    const insights = await businessIntelligenceCRMService.generateBusinessInsights(
      req.userId!,
      (period as 'daily' | 'weekly' | 'monthly' | 'quarterly') || 'monthly'
    );

    res.status(200).json({
      success: true,
      data: { insights },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating business insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate business insights',
      code: 'GENERATE_INSIGHTS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const updateContactTags = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const { tags } = req.body;

  if (!contactId || !tags || !Array.isArray(tags)) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID and tags array are required',
      code: 'MISSING_REQUIRED_FIELDS',
      timestamp: new Date(),
    });
  }

  try {
    const contact = await businessIntelligenceCRMService.updateContactTags(req.userId!, contactId, tags);

    res.status(200).json({
      success: true,
      data: { contact },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating contact tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact tags',
      code: 'UPDATE_TAGS_ERROR',
      timestamp: new Date(),
    });
  }
});

export const getContactTimeline = asyncHandler(async (req: Request, res: Response) => {
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
    const timeline = await businessIntelligenceCRMService.getContactTimeline(req.userId!, contactId);

    res.status(200).json({
      success: true,
      data: { timeline },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting contact timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contact timeline',
      code: 'GET_TIMELINE_ERROR',
      timestamp: new Date(),
    });
  }
});

export const predictNextAction = asyncHandler(async (req: Request, res: Response) => {
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
    const prediction = await businessIntelligenceCRMService.predictNextAction(req.userId!, contactId);

    res.status(200).json({
      success: true,
      data: { prediction },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error predicting next action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict next action',
      code: 'PREDICT_ACTION_ERROR',
      timestamp: new Date(),
    });
  }
});

export const generateContactScores = asyncHandler(async (req: Request, res: Response) => {
  try {
    const scores = await businessIntelligenceCRMService.generateContactScores(req.userId!);

    res.status(200).json({
      success: true,
      data: { scores },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error generating contact scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate contact scores',
      code: 'GENERATE_SCORES_ERROR',
      timestamp: new Date(),
    });
  }
});

export const importContacts = asyncHandler(async (req: Request, res: Response) => {
  const { contacts, source } = req.body;

  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      error: 'Contacts array is required',
      code: 'MISSING_CONTACTS',
      timestamp: new Date(),
    });
  }

  try {
    const result = await businessIntelligenceCRMService.importContacts(req.userId!, contacts, source || 'manual');

    res.status(200).json({
      success: true,
      data: { result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import contacts',
      code: 'IMPORT_CONTACTS_ERROR',
      timestamp: new Date(),
    });
  }
});