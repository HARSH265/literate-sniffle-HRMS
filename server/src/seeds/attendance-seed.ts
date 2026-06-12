import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://jadounharsh020:singhharshitfghtrvdhs@cluster0.eqxs9ki.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';

const ATTENDANCE_SCHEMA = new mongoose.Schema({}, { strict: false, collection: 'attendanceentries' });
const AttendanceEntry = mongoose.model('AttendanceEntry', ATTENDANCE_SCHEMA);

const EMPLOYEE_SCHEMA = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EMPLOYEE_SCHEMA);

const HOLIDAY_SCHEMA = new mongoose.Schema({}, { strict: false, collection: 'holidays' });
const Holiday = mongoose.model('Holiday', HOLIDAY_SCHEMA);

const USER_SCHEMA = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', USER_SCHEMA);

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Atlas');

  // Get admin user for enteredBy
  const admin = await User.findOne({ role: 'super-admin' }).lean();
  if (!admin) { console.error('No admin user found'); process.exit(1); }
  const adminId = admin._id;

  // Get all active employees
  const employees = await Employee.find({ status: 'active' }).select('_id employeeCode fullName shift category').lean();
  console.log(`Found ${employees.length} active employees`);

  // Get holidays for Apr-Jun 2026
  const holidays = await Holiday.find({ year: 2026 }).lean();
  const holidayDates = new Set(holidays.map(h => {
    const d = new Date(h.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }));
  console.log(`Found ${holidays.length} holidays for 2026`);

  // Attendance patterns by category
  // Workers: ~85% present, ~5% absent, ~3% half-day, ~2% leave, weekly-off on Sunday
  // Office staff: ~90% present, ~3% absent, ~2% half-day, ~3% leave, weekly-off on Sunday

  const months = [
    { year: 2026, month: 4, name: 'April' },
    { year: 2026, month: 5, name: 'May' },
    { year: 2026, month: 6, name: 'June' },
  ];

  let totalEntries = 0;

  for (const { year, month, name } of months) {
    console.log(`\nGenerating attendance for ${name} ${year}...`);
    const daysInMonth = new Date(year, month, 0).getDate();
    const entries: any[] = [];

    for (const emp of employees) {
      const isWorker = emp.category === 'worker';
      const isOfficeStaff = emp.category === 'office-staff';

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Skip future dates
        if (date > new Date()) continue;

        // Weekly off on Sunday
        if (dayOfWeek === 0) {
          entries.push({
            employee: emp._id,
            date: date,
            status: 'weekly-off',
            inTime: '',
            outTime: '',
            totalHours: 0,
            isLate: false,
            isLatePresent: false,
            source: 'manual-register-entry',
            enteredBy: adminId,
            createdAt: date,
            updatedAt: date,
          });
          continue;
        }

        // Holiday check
        if (holidayDates.has(dateStr)) {
          // Some workers work on holidays (overtime), most don't
          if (isWorker && Math.random() < 0.15) {
            // Worker on holiday - work with OT
            const inTime = '06:00';
            const outTime = '14:00';
            entries.push({
              employee: emp._id,
              date: date,
              status: 'present',
              inTime,
              outTime,
              totalHours: 8,
              isLate: false,
              isLatePresent: false,
              source: 'manual-register-entry',
              enteredBy: adminId,
              createdAt: date,
              updatedAt: date,
            });
          } else {
            entries.push({
              employee: emp._id,
              date: date,
              status: 'holiday',
              inTime: '',
              outTime: '',
              totalHours: 0,
              isLate: false,
              isLatePresent: false,
              source: 'manual-register-entry',
              enteredBy: adminId,
              createdAt: date,
              updatedAt: date,
            });
          }
          continue;
        }

        // Regular working day - generate status based on probabilities
        const rand = Math.random();
        let status: string;
        let inTime = '';
        let outTime = '';
        let totalHours = 0;
        let isLate = false;
        let isLatePresent = false;

        if (isWorker) {
          // Worker patterns
          if (rand < 0.82) {
            // Present (82%)
            status = 'present';
            const shiftStart = '06:00';
            // Most arrive on time, some late
            if (Math.random() < 0.12) {
              // Late arrival
              const lateMins = Math.floor(Math.random() * 45) + 16; // 16-60 min late
              const inHour = 6 + Math.floor(lateMins / 60);
              const inMin = lateMins % 60;
              inTime = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}`;
              isLate = true;
              isLatePresent = true;
            } else {
              inTime = `${String(6 + Math.floor(Math.random() * 2)).padStart(2, '0')}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
            }
            outTime = '14:00';
            totalHours = 8;
          } else if (rand < 0.87) {
            // Absent (5%)
            status = 'absent';
          } else if (rand < 0.91) {
            // Half-day (4%)
            status = 'half-day';
            inTime = '06:00';
            outTime = '10:00';
            totalHours = 4;
          } else {
            // Leave (9%)
            status = 'leave';
          }
        } else {
          // Office staff patterns
          if (rand < 0.87) {
            // Present (87%)
            status = 'present';
            if (Math.random() < 0.10) {
              // Late
              const lateMins = Math.floor(Math.random() * 30) + 16;
              const inHour = 9 + Math.floor(lateMins / 60);
              const inMin = lateMins % 60;
              inTime = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}`;
              isLate = true;
              isLatePresent = true;
            } else {
              inTime = `09:${String(Math.floor(Math.random() * 15)).padStart(2, '0')}`;
            }
            outTime = '18:00';
            totalHours = 8;
          } else if (rand < 0.91) {
            // Absent (4%)
            status = 'absent';
          } else if (rand < 0.94) {
            // Half-day (3%)
            status = 'half-day';
            inTime = '09:00';
            outTime = '13:00';
            totalHours = 4;
          } else {
            // Leave (6%)
            status = 'leave';
          }
        }

        entries.push({
          employee: emp._id,
          date: date,
          status,
          inTime,
          outTime,
          totalHours,
          isLate,
          isLatePresent,
          source: 'manual-register-entry',
          enteredBy: adminId,
          createdAt: date,
          updatedAt: date,
        });
      }
    }

    // Bulk insert for this month
    if (entries.length > 0) {
      // Clear existing entries for this month first
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      await AttendanceEntry.deleteMany({ date: { $gte: startDate, $lte: endDate } });

      // Insert in batches of 5000
      const batchSize = 5000;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        await AttendanceEntry.insertMany(batch, { ordered: false });
      }
      totalEntries += entries.length;
      console.log(`  ${entries.length} entries created for ${name}`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('  ATTENDANCE SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Total entries: ${totalEntries}`);
  console.log(`  Months: Apr, May, Jun 2026`);
  console.log(`  Employees: ${employees.length}`);
  console.log('═══════════════════════════════════════\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
