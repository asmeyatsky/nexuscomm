import { Request, Response } from 'express';
import { AuthService } from '@services/AuthService';
import { asyncHandler } from '@middleware/errorHandler';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
      accessToken,
      refreshToken,
    },
    timestamp: new Date(),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
      accessToken,
      refreshToken,
    },
    timestamp: new Date(),
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.userId!);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user?.id,
        email: user?.email,
        username: user?.username,
        displayName: user?.displayName,
        profilePicture: user?.profilePicture,
        isEmailVerified: user?.isEmailVerified,
      },
    },
    timestamp: new Date(),
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.userId!, req.body);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
      },
    },
    timestamp: new Date(),
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  const user = await authService.verifyEmail(token as string);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    },
    timestamp: new Date(),
  });
});
