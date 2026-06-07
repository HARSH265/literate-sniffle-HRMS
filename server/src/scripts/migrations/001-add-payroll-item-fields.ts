/**
 * Migration: Add missing fields to existing PayrollItem documents.
 * 
 * New fields added in the payroll enhancement:
 *   - bankSplitPercent (Number, default 0)
 *   - primaryBankAmount (Number)
 *   - secondaryBankAmount (Number)
 *   - paidDaysBreakdown (Mixed)
 *   - lopDetails (Mixed)
 *   - proRataDetails (Mixed)
 *   - complianceFlags (Array, default [])
 *   - taxComputation (Mixed)
 *   - componentWiseEarnings (Array, default [])
 *   - componentWiseDeductions (Array, default [])
 *   - arrears (Mixed)
 *   - employerContributions (Array, default [])
 *   - variableInputs (Array, default [])
 * 
 * Run: npx ts-node --esm server/src/scripts/migrations/001-add-payroll-item-fields.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

async function migrate(): Promise<void> {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not available');
  }

  const payrollItems = db.collection('payrollitems');

  const result = await payrollItems.updateMany(
    { bankSplitPercent: { $exists: false } },
    {
      $set: {
        bankSplitPercent: 0,
        employerContributions: [],
        variableInputs: [],
        complianceFlags: [],
        componentWiseEarnings: [],
        componentWiseDeductions: [],
      },
    },
  );

  console.log(`Migration complete. Modified ${result.modifiedCount} PayrollItem documents.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
