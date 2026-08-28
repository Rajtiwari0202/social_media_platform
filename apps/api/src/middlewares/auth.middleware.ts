import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthTokenPayload } from '../utils/jwt.js';
import { AppError } from './error.middleware.js';
import { prisma } from '../lib/prisma.js';
import { UserRole } from '@social/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Authenticate incoming request using Access JWT from Header or Cookie
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError(401, 'Unauthorized', 'Authentication token is required to access this resource.');
    }

    let payload: AuthTokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, 'Invalid Token', 'The provided access token is invalid or expired.');
    }

    // Verify token version matches user record (for instant session revocation)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, tokenVersion: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new AppError(401, 'User Not Found', 'The user associated with this token no longer exists.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new AppError(401, 'Session Revoked', 'Session has been invalidated. Please log in again.');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - attaches user if valid token exists without throwing if not
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, tokenVersion: true, deletedAt: true },
      });

      if (user && !user.deletedAt && user.tokenVersion === payload.tokenVersion) {
        req.user = payload;
      }
    } catch {
      // Ignore invalid token on optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control middleware
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized', 'Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'Forbidden', 'You do not have permission to perform this action.');
    }

    next();
  };
};
