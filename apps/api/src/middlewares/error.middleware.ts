import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { ApiErrorResponse } from '@social/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly title: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, title: string, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.title = title;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const instance = req.originalUrl;

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const invalidParams = err.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    }));

    const response: ApiErrorResponse = {
      type: 'https://api.socialplatform.com/errors/validation-failed',
      title: 'Validation Error',
      status: 422,
      detail: 'The request payload failed input schema validation.',
      instance,
      invalidParams,
      timestamp,
    };

    res.status(422).json(response);
    return;
  }

  // 2. Custom Application Errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      type: `https://api.socialplatform.com/errors/${err.title.toLowerCase().replace(/\s+/g, '-')}`,
      title: err.title,
      status: err.statusCode,
      detail: err.message,
      instance,
      timestamp,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // 3. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const targets = (err.meta?.target as string[]) || [];
      const response: ApiErrorResponse = {
        type: 'https://api.socialplatform.com/errors/conflict',
        title: 'Resource Conflict',
        status: 409,
        detail: `Unique constraint violated on field: ${targets.join(', ')}`,
        instance,
        timestamp,
      };
      res.status(409).json(response);
      return;
    }

    if (err.code === 'P2025') {
      const response: ApiErrorResponse = {
        type: 'https://api.socialplatform.com/errors/not-found',
        title: 'Resource Not Found',
        status: 404,
        detail: 'The requested resource could not be found.',
        instance,
        timestamp,
      };
      res.status(404).json(response);
      return;
    }
  }

  // 4. Fallback Internal Server Error
  logger.error({ err, path: req.path, method: req.method }, '💥 Unhandled Server Exception');

  const response: ApiErrorResponse = {
    type: 'https://api.socialplatform.com/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected internal error occurred on the server.',
    instance,
    timestamp,
  };

  res.status(500).json(response);
};
