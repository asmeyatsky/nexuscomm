import { Request, Response } from 'express';
import { AccountService } from '@services/AccountService';
import { asyncHandler } from '@middleware/errorHandler';

const accountService = new AccountService();

export const addAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountService.addAccount(req.userId!, req.body);

  res.status(201).json({
    success: true,
    data: { account },
    timestamp: new Date(),
  });
});

export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await accountService.getUserAccounts(req.userId!);

  res.status(200).json({
    success: true,
    data: { accounts },
    timestamp: new Date(),
  });
});

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const account = await accountService.getAccountById(accountId, req.userId!);

  if (!account) {
    return res.status(404).json({
      success: false,
      error: 'Account not found',
      code: 'ACCOUNT_NOT_FOUND',
      timestamp: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    data: { account },
    timestamp: new Date(),
  });
});

export const disconnectAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  await accountService.disconnectAccount(accountId, req.userId!);

  res.status(200).json({
    success: true,
    data: { message: 'Account disconnected successfully' },
    timestamp: new Date(),
  });
});

export const updateSyncStatus = asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { status } = req.body;

  const account = await accountService.updateSyncStatus(accountId, status, req.userId!);

  res.status(200).json({
    success: true,
    data: { account },
    timestamp: new Date(),
  });
});
