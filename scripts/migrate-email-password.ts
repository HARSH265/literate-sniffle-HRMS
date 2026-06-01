/**
 * Migration script to encrypt any plaintext email password stored in CompanySettings.
 * Run with: `tsx scripts/migrate-email-password.ts`
 */
import 'dotenv/config';
import { connectDatabase } from '../server/src/config/db.js';
import CompanySettings from '../server/src/models/CompanySettings.model.js';
import { encryptEmailConfig } from '../server/src/core/utils/EncryptionUtil.js';
import { logger } from '../server/src/core/logger/logger.js';

async function migrate() {
  await connectDatabase();
  const settings = await CompanySettings.findOne();
  if (!settings) {
    logger.info('No CompanySettings document found – nothing to migrate');
    process.exit(0);
  }
  const emailConfig = settings.emailConfig as any;
  if (!emailConfig) {
    logger.info('No emailConfig present – nothing to migrate');
    process.exit(0);
  }
  // If password already looks encrypted (contains two colons), skip
  const pwd = emailConfig.password as string | undefined;
  if (!pwd) {
    logger.info('Email password not set – nothing to migrate');
    process.exit(0);
  }
  const isEncrypted = pwd.split(':').length === 3 && /^[0-9a-f]+$/.test(pwd.split(':')[0]);
  if (isEncrypted) {
    logger.info('Email password already encrypted – migration not required');
    process.exit(0);
  }
  // Encrypt and save
  settings.emailConfig = encryptEmailConfig(emailConfig);
  await settings.save();
  logger.info('Email password encrypted and saved');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
