import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: any,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id || req.headers?.['x-request-id'] || 'req_unknown';
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');

  // Sanitize message: never expose internal database passwords or stack in error response
  let safeMessage = err.message || 'An unexpected error occurred. Please try again.';
  if (statusCode === 500 && env.NODE_ENV === 'production') {
    safeMessage = 'Internal Server Error. Please contact support.';
  }

  // Scrub any accidental secret matches from error message
  if (typeof safeMessage === 'string') {
    safeMessage = safeMessage
      .replace(/rzp_(live|test)_[a-zA-Z0-9]+/g, 'rzp_***')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza***');
  }

  console.error(`[Error] [${requestId}] ${statusCode} ${errorCode}:`, err.message);

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: safeMessage,
      requestId,
      ...(err.details ? { details: err.details } : {}),
      ...(env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
    },
  });
};
