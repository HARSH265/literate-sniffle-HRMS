import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';

async function verify() {
  await mongoose.connect('mongodb+srv://jadounharsh020:singhharshitfghtrvdhs@cluster0.eqxs9ki.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0');
  const db = mongoose.connection.db!;

  const run = await db.collection('payrollruns').findOne({ month: '2026-06' });
  console.log('=== PAYROLL RUN SUMMARY ===');
  console.log('Month:', run?.month);
  console.log('Status:', run?.status);
  console.log('Total Employees:', run?.totalEmployees);
  console.log('Total Gross:', run?.totalGross);
  console.log('Total Deductions:', run?.totalDeductions);
  console.log('Total Net Pay:', run?.totalNetPay);
  console.log('Employer Contributions:', run?.totalEmployerContributions);

  const items = await db.collection('payrollitems').find({ month: '2026-06' }).toArray();
  const empIds = items.map((i: any) => i.employee);
  const emps = await db.collection('employees').find({ _id: { $in: empIds } }).project({ _id: 1, category: 1, salaryType: 1, baseSalary: 1, dailyWage: 1, employeeCode: 1 }).toArray();
  const empMap = new Map(emps.map((e: any) => [e._id.toString(), e]));

  let workers = { count: 0, totalNet: 0, totalBasic: 0 };
  let staff = { count: 0, totalNet: 0, totalBasic: 0 };

  for (const item of items) {
    const emp = empMap.get(item.employee.toString());
    if (!emp) continue;
    if (emp.category === 'worker') {
      workers.count++;
      workers.totalNet += item.netPay || 0;
      workers.totalBasic += item.basicEarnings || 0;
    } else {
      staff.count++;
      staff.totalNet += item.netPay || 0;
      staff.totalBasic += item.basicEarnings || 0;
    }
  }

  console.log('\n=== BREAKDOWN ===');
  console.log(`Workers: ${workers.count} | Total Basic: ₹${Math.round(workers.totalBasic).toLocaleString()} | Total Net: ₹${Math.round(workers.totalNet).toLocaleString()}`);
  console.log(`Staff: ${staff.count} | Total Basic: ₹${Math.round(staff.totalBasic).toLocaleString()} | Total Net: ₹Math${Math.round(staff.totalNet).toLocaleString()}`);

  // Verify a specific worker
  const sampleItem = items[0];
  const sampleEmp = empMap.get(sampleItem.employee.toString());
  console.log('\n=== MANUAL VERIFICATION (ORN001) ===');
  console.log('Salary Type:', sampleEmp?.salaryType);
  console.log('Daily Wage:', sampleEmp?.dailyWage);
  console.log('Present:', sampleItem.presentDays, '| WO:', sampleItem.weeklyOffs, '| Holiday:', sampleItem.holidays);
  console.log('Effective Days:', sampleItem.effectiveWorkingDays);
  const expectedBasic = (sampleEmp?.dailyWage || 0) * sampleItem.effectiveWorkingDays;
  console.log('Expected Basic (daily * effective):', expectedBasic);
  console.log('Actual Basic:', sampleItem.basicEarnings);
  console.log('Match:', Math.abs(expectedBasic - sampleItem.basicEarnings) < 1 ? 'YES ✅' : 'NO ❌');

  // Verify a monthly employee
  const monthlyItem = items.find((i: any) => {
    const e = empMap.get(i.employee.toString());
    return e?.salaryType === 'monthly';
  });
  if (monthlyItem) {
    const monthlyEmp = empMap.get(monthlyItem.employee.toString());
    console.log('\n=== MANUAL VERIFICATION (Monthly Employee) ===');
    console.log('Code:', monthlyEmp?.employeeCode);
    console.log('Base Salary:', monthlyEmp?.baseSalary);
    console.log('Present:', monthlyItem.presentDays, '| WO:', monthlyItem.weeklyOffs, '| Holiday:', monthlyItem.holidays);
    console.log('Effective Days:', monthlyItem.effectiveWorkingDays);
    const expectedMonthlyBasic = (monthlyEmp?.baseSalary || 0) * (monthlyItem.effectiveWorkingDays / 26);
    console.log('Expected Basic (base * effective/26):', expectedMonthlyBasic);
    console.log('Actual Basic:', monthlyItem.basicEarnings);
    console.log('Match:', Math.abs(expectedMonthlyBasic - monthlyItem.basicEarnings) < 1 ? 'YES ✅' : 'NO ❌');
  }

  // Top 5 highest net pay
  const sorted = [...items].sort((a: any, b: any) => (b.netPay || 0) - (a.netPay || 0));
  console.log('\n=== TOP 5 HIGHEST NET PAY ===');
  for (const item of sorted.slice(0, 5)) {
    const emp = empMap.get(item.employee.toString());
    console.log(`${emp?.employeeCode} ${emp?.salaryType} | Net: ₹${item.netPay?.toLocaleString()} | Basic: ₹${item.basicEarnings?.toLocaleString()}`);
  }

  // Bottom 5 lowest net pay
  console.log('\n=== BOTTOM 5 LOWEST NET PAY ===');
  for (const item of sorted.slice(-5)) {
    const emp = empMap.get(item.employee.toString());
    console.log(`${emp?.employeeCode} ${emp?.salaryType} | Net: ₹${item.netPay?.toLocaleString()} | Basic: ₹${item.basicEarnings?.toLocaleString()} | Present: ${item.presentDays} | WO: ${item.weeklyOffs}`);
  }

  process.exit(0);
}
verify();
