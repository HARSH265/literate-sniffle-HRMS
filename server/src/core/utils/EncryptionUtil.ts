import crypto from 'crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return encryptedText;
  }
}

export function encryptBankDetails(bankDetails: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!bankDetails) return undefined;
  
  return {
    bankName: bankDetails.bankName,
    accountNumber: bankDetails.accountNumber ? encrypt(String(bankDetails.accountNumber)) : undefined,
    ifscCode: bankDetails.ifscCode ? encrypt(String(bankDetails.ifscCode)) : undefined,
    accountType: bankDetails.accountType,
  };
}

export function decryptBankDetails(bankDetails: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!bankDetails) return undefined;
  
  return {
    bankName: bankDetails.bankName,
    accountNumber: bankDetails.accountNumber ? decrypt(String(bankDetails.accountNumber)) : undefined,
    ifscCode: bankDetails.ifscCode ? decrypt(String(bankDetails.ifscCode)) : undefined,
    accountType: bankDetails.accountType,
  };
}