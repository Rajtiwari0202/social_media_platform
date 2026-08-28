import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateRandomToken, hashToken } from '../src/utils/crypto.js';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';

describe('Cryptography & Security Utilities', () => {
  it('should hash and verify passwords using Argon2id', async () => {
    const rawPassword = 'SuperSecretPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'WrongPassword456!');
    expect(isInvalid).toBe(false);
  });

  it('should generate cryptographically random tokens and hash with SHA-256', () => {
    const token = generateRandomToken(32);
    expect(token).toHaveLength(64); // 32 bytes in hex = 64 characters

    const hashed1 = hashToken(token);
    const hashed2 = hashToken(token);

    expect(hashed1).toHaveLength(64); // SHA-256 hex length
    expect(hashed1).toEqual(hashed2);
  });

  it('should sign and verify access JWTs with custom claims', () => {
    const payload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      username: 'raj_tiwari',
      role: 'USER' as const,
      tokenVersion: 1,
    };

    const token = signAccessToken(payload);
    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toEqual(payload.userId);
    expect(decoded.username).toEqual(payload.username);
    expect(decoded.role).toEqual(payload.role);
    expect(decoded.tokenVersion).toEqual(payload.tokenVersion);
  });
});
