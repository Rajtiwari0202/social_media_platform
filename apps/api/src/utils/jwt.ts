import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from '@social/shared';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  tokenVersion: number;
}

/**
 * Sign a short-lived access JWT
 */
export const signAccessToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    issuer: 'social-media-platform',
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

/**
 * Verify and decode an access JWT
 */
export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'social-media-platform',
  }) as AuthTokenPayload;
};
