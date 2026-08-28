import argon2 from 'argon2';
import crypto from 'crypto';

// Argon2id parameters matching OWASP recommendations for high security
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 parallel threads
};

/**
 * Hash a plain text password using Argon2id
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
};

/**
 * Verify a plain text password against an Argon2id hash
 */
export const verifyPassword = async (hash: string, plainPassword: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
};

/**
 * Generate a cryptographically secure random hex token (default 64 characters)
 */
export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure database storage
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
