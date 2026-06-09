/**
 * Migration: Add defaults for all new fields in PayrollItem documents.
 *
 * This complements the earlier migration that added a subset of fields.
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
    {
      $or: [
        { bankSplitPercent: { $exists: false } },
        { primaryBankAmount: { $exists: false } },
        { secondaryBankAmount: { $exists: false } },
        { paidDaysBreakdown: { $exists: false } },
        { lopDetails: { $exists: false } },
        { proRataDetails: { $exists: false } },
        { complianceFlags: { $exists: false } },
        { taxComputation: { $exists: false } },
        { componentWiseEarnings: { $exists: false } },
        { componentWiseDeductions: { $exists: false } },
        { arrears: { $exists: false } },
        { employerContributions: { $exists: false } },
        { variableInputs: { $exists: false } },
      ],
    },
    {
      $set: {
        bankSplitPercent: 0,
        primaryBankAmount: null,
        secondaryBankAmount: null,
        paidDaysBreakdown: null,
        lopDetails: null,
        proRataDetails: null,
        complianceFlags: [],
        taxComputation: null,
        componentWiseEarnings: [],
        componentWiseDeductions: [],
        arrears: null,
        employerContributions: [],
        variableInputs: [],
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