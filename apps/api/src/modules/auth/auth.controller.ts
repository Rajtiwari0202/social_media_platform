import { Request, Response, NextFunction, CookieOptions } from 'express';
import { authService, AuthService } from './auth.service.js';
import { env } from '../../config/env.js';
import { RegisterInput, LoginInput } from '@social/shared';
import { AppError } from '../../middlewares/error.middleware.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input: RegisterInput = req.body;
      const result = await this.service.register(input);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      res.status(201).json({
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input: LoginInput = req.body;
      const result = await this.service.login(input);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!rawToken) {
        throw new AppError(401, 'Unauthorized', 'Refresh token is required.');
      }

      const result = await this.service.refreshTokens(rawToken);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      res.status(200).json({
        status: 'success',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await this.service.logout(rawToken);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/api/v1/auth',
      });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'Authentication required.');
      }

      await this.service.logoutAll(req.user.userId);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/api/v1/auth',
      });

      res.status(200).json({
        status: 'success',
        message: 'All active sessions have been invalidated.',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'Authentication required.');
      }

      const user = await this.service.getCurrentUser(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
