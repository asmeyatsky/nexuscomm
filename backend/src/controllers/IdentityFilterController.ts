import { Request, Response } from 'express';
import { IdentityFilterService } from '@services/IdentityFilterService';
import { asyncHandler } from '@middleware/errorHandler';

const filterService = new IdentityFilterService();

export const createFilter = asyncHandler(async (req: Request, res: Response) => {
  const filter = await filterService.createFilter(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: { filter },
    timestamp: new Date(),
  });
});

export const getFilters = asyncHandler(async (req: Request, res: Response) => {
  const filters = await filterService.getUserFilters(req.userId!);

  res.status(200).json({
    success: true,
    data: { filters },
    timestamp: new Date(),
  });
});

export const getFilter = asyncHandler(async (req: Request, res: Response) => {
  const { filterId } = req.params;
  const filter = await filterService.getFilterById(filterId, req.userId!);

  if (!filter) {
    return res.status(404).json({
      success: false,
      error: 'Filter not found',
      code: 'FILTER_NOT_FOUND',
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    data: { filter },
    timestamp: new Date(),
  });
});

export const updateFilter = asyncHandler(async (req: Request, res: Response) => {
  const { filterId } = req.params;
  const filter = await filterService.updateFilter(filterId, req.userId!, req.body);

  res.status(200).json({
    success: true,
    data: { filter },
    timestamp: new Date(),
  });
});

export const deleteFilter = asyncHandler(async (req: Request, res: Response) => {
  const { filterId } = req.params;
  await filterService.deleteFilter(filterId, req.userId!);

  res.status(200).json({
    success: true,
    data: { message: 'Filter deleted successfully' },
    timestamp: new Date(),
  });
});

export const reorderFilters = asyncHandler(async (req: Request, res: Response) => {
  const { filterIds } = req.body;
  const filters = await filterService.reorderFilters(req.userId!, filterIds);

  res.status(200).json({
    success: true,
    data: { filters },
    timestamp: new Date(),
  });
});
