import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal server error';

  // Log error
  console.error(`[${code}] ${statusCode}: ${message}`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    timestamp: new Date(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Async handler to catch async errors
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
