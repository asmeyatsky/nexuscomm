import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param text - Text to encrypt
 * @param encryptionKey - Encryption key (must be 32 bytes for AES-256)
 * @returns Encrypted text in format: iv:encryptedText
 */
export function encrypt(text: string, encryptionKey: string): string {
  const key = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt encrypted data using AES-256-CBC
 * @param encryptedText - Encrypted text in format: iv:encryptedText
 * @param encryptionKey - Encryption key (must be 32 bytes for AES-256)
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string, encryptionKey: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');

  const key = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest();

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}

/**
 * Generate random token for verification
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
