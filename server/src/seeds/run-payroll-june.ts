import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import { PayrollService } from '../modules/payroll/payroll.service.js';

const MONGODB_URI = 'mongodb+srv://jadounharsh020:singhharshitfghtrvdhs@cluster0.eqxs9ki.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Atlas');

  // Get admin user ID
  const admin = await mongoose.connection.db.collection('users').findOne({ role: 'super-admin' });
  if (!admin) { console.error('No admin'); process.exit(1); }
  const userId = admin._id.toString();
  console.log('Admin ID:', userId);

  // Check if payroll already exists for June 2026
  const existing = await mongoose.connection.db.collection('payrollruns').findOne({ month: '2026-06' });
  if (existing) {
    console.log('Payroll for June 2026 already exists, deleting...');
    await mongoose.connection.db.collection('payrollruns').deleteOne({ month: '2026-06' });
    await mongoose.connection.db.collection('payrollitems').deleteMany({ month: '2026-06' });
  }

  console.log('\nRunning payroll for June 2026...');
  const result = await PayrollService.runPayroll(6, 2026, userId);

  console.log('\n═══════════════════════════════════════════════');
  console.log('  PAYROLL RUN RESULT — June 2026');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Run ID:              ${result.runId}`);
  console.log(`  Month:               ${result.month}`);
  console.log(`  Status:              ${result.status}`);
  console.log(`  Total Employees:     ${result.totalEmployees}`);
  console.log(`  Total Gross:         ₹${result.totalGross?.toLocaleString()}`);
  console.log(`  Total Deductions:    ₹${result.totalDeductions?.toLocaleString()}`);
  console.log(`  Total Net Pay:       ₹${result.totalNetPay?.toLocaleString()}`);
  console.log(`  Employer Contrib:    ₹${result.totalEmployerContributions?.toLocaleString()}`);
  console.log('═══════════════════════════════════════════════');

  // Get a few sample payroll items for verification
  const items = await mongoose.connection.db.collection('payrollitems')
    .find({ month: '2026-06' })
    .project({ employee: 1, presentDays: 1, absentDays: 1, weeklyOffs: 1, holidays: 1, effectiveWorkingDays: 1, basicEarnings: 1, grossEarnings: 1, totalDeductions: 1, netPay: 1, halfDays: 1, paidLeaveDays: 1, unpaidLeaveDays: 1 })
    .limit(5)
    .toArray();

  console.log('\n  Sample Payroll Items:');
  console.log('  ─────────────────────────────────────────');
  for (const item of items) {
    const emp = await mongoose.connection.db.collection('employees').findOne({ _id: item.employee }, { projection: { employeeCode: 1, fullName: 1, salaryType: 1, baseSalary: 1, dailyWage: 1 } });
    if (!emp) continue;
    console.log(`  ${emp.employeeCode} ${emp.fullName} (${emp.salaryType} ₹${emp.baseSalary || emp.dailyWage}/day)`);
    console.log(`    Present: ${item.presentDays} | Absent: ${item.absentDays} | Half: ${item.halfDays} | WO: ${item.weeklyOffs} | Holiday: ${item.holidays} | Leave: ${item.paidLeaveDays}p/${item.unpaidLeaveDays}u`);
    console.log(`    Effective Days: ${item.effectiveWorkingDays} | Basic: ₹${item.basicEarnings?.toLocaleString()} | Gross: ₹${item.grossEarnings?.toLocaleString()} | Deductions: ₹${item.totalDeductions?.toLocaleString()} | Net: ₹${item.netPay?.toLocaleString()}`);
    console.log('');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Payroll run failed:', err.message || err);
  process.exit(1);
});
