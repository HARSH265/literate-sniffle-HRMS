import dns from 'dns';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import Shift from '../models/Shift.model.js';
import Employee from '../models/Employee.model.js';
import CompanySettings from '../models/CompanySettings.model.js';
import Holiday from '../models/Holiday.model.js';
import WeeklyOffRule from '../models/WeeklyOffRule.model.js';
import LeaveType from '../models/LeaveType.model.js';
import LoanType from '../models/LoanType.model.js';
import { ROLES } from '../config/constants.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = 'mongodb+srv://jadounharsh020:singhharshitfghtrvdhs@cluster0.eqxs9ki.mongodb.net/hrms?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to Atlas');
}

// ─── DEPARTMENTS ───
const DEPT_DATA = [
  { name: 'PCB Design', code: 'DES', description: 'PCB layout design, Gerber generation, DFM analysis' },
  { name: 'Production', code: 'PROD', description: 'PCB manufacturing floor — etching, drilling, lamination, plating' },
  { name: 'Surface Mount Technology', code: 'SMT', description: 'SMT assembly line — pick & place, reflow, AOI' },
  { name: 'Quality Control', code: 'QC', description: 'Incoming, in-process, and final inspection and testing' },
  { name: 'Maintenance', code: 'MNT', description: 'Equipment maintenance, calibration, facility upkeep' },
  { name: 'Store & Inventory', code: 'STORE', description: 'Raw materials (copper clad, chemicals, drills), finished goods' },
  { name: 'HR & Admin', code: 'HR', description: 'Human resources, payroll, compliance, admin' },
  { name: 'Accounts & Finance', code: 'FIN', description: 'Accounts payable/receivable, GST, TDS, statutory filings' },
  { name: 'Security', code: 'SEC', description: 'Factory security, access control, CCTV' },
  { name: 'IT', code: 'IT', description: 'ERP, network, servers, helpdesk' },
];

// ─── DESIGNATIONS ───
function getDesignations(deptMap: Record<string, string>) {
  return [
    // PCB Design
    { name: 'PCB Designer', department: deptMap['DES'] },
    { name: 'Senior PCB Designer', department: deptMap['DES'] },
    { name: 'Design Manager', department: deptMap['DES'] },
    // Production
    { name: 'Machine Operator', department: deptMap['PROD'] },
    { name: 'Line Worker', department: deptMap['PROD'] },
    { name: 'Production Supervisor', department: deptMap['PROD'] },
    { name: 'Production Manager', department: deptMap['PROD'] },
    // SMT
    { name: 'SMT Operator', department: deptMap['SMT'] },
    { name: 'SMT Technician', department: deptMap['SMT'] },
    { name: 'SMT Supervisor', department: deptMap['SMT'] },
    { name: 'SMT Engineer', department: deptMap['SMT'] },
    // QC
    { name: 'QC Inspector', department: deptMap['QC'] },
    { name: 'QC Engineer', department: deptMap['QC'] },
    { name: 'QC Manager', department: deptMap['QC'] },
    // Maintenance
    { name: 'Maintenance Technician', department: deptMap['MNT'] },
    { name: 'Maintenance Engineer', department: deptMap['MNT'] },
    // Store
    { name: 'Store Keeper', department: deptMap['STORE'] },
    { name: 'Store Manager', department: deptMap['STORE'] },
    // HR
    { name: 'HR Executive', department: deptMap['HR'] },
    { name: 'HR Manager', department: deptMap['HR'] },
    // Finance
    { name: 'Accountant', department: deptMap['FIN'] },
    { name: 'Finance Manager', department: deptMap['FIN'] },
    // Security
    { name: 'Security Guard', department: deptMap['SEC'] },
    { name: 'Security Officer', department: deptMap['SEC'] },
    // IT
    { name: 'IT Support', department: deptMap['IT'] },
    { name: 'IT Manager', department: deptMap['IT'] },
  ];
}

// ─── EMPLOYEE DATA GENERATOR ───
const FIRST_NAMES_M = [
  'Rajesh','Suresh','Mahesh','Ramesh','Dinesh','Ganesh','Mukesh','Umesh',
  'Amit','Sumit','Rohit','Mohit','Ashish','Gaurav','Nikhil','Pankaj',
  'Deepak','Manoj','Vinod','Sunil','Prakash','Ajay','Vijay','Sanjay',
  'Ravi','Karan','Arun','Naveen','Pawan','Rahul','Sachin','Anil',
  'Vikram','Arun','Raju','Lalu','Mantu','Chintu','Pintu','Tinku',
  'Jitendra','Surendra','Narendra','Dharmendra','Mahendra','Yogesh',
  'Hitesh','Jayesh','Bhavesh','Kinjal','Niral','Parth','Harsh','Jay',
  'Tushar','Chetan','Niraj','Kamlesh','Bharat','Naresh','Rakesh',
];
const FIRST_NAMES_F = [
  'Sunita','Priya','Anita','Sita','Gita','Nita','Rita','Mita',
  'Kavita','Savita','Mamta','Pooja','Neelam','Suman','Reena','Seema',
  'Asha','Usha','Varsha','Sarita','Meena','Kamla','Geeta','Indu',
  'Pinki','Soniya','Rani','Neha','Deepa','Rupa','Jyoti','Aarti',
  'Priti','Mamta','Sushila','Kusum','Leela','Champa','Lata','Vandana',
];
const LAST_NAMES = [
  'Kumar','Singh','Sharma','Verma','Gupta','Yadav','Mishra','Pandey',
  'Tiwari','Jaiswal','Mahto','Oron','Lakra','Kerketta','Topno','Munda',
  'Besra','Hansdak','Tudu','Soren','Devi','Patel','Mehta','Shah',
  'Reddy','Nair','Iyer','Mukherjee','Das','Bose','Chatterjee','Banerjee',
];
const FATHER_NAMES = [
  'Mohan','Ram','Shyam','Krishna','Hari','Gopal','Madhav','Lakshman',
  'Bharat','Laxman','Dashrath','Janak','Vijay','Raj','Suresh','Mahesh',
  'Dinesh','Ganesh','Ramesh','Sunil','Prakash','Devendra','Raghu','Basdev',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface EmployeeSeed {
  employeeCode: string;
  fullName: string;
  fatherName: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary';
  department: mongoose.Types.ObjectId;
  designation: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage: number;
  overtimeEligible: boolean;
  status: 'active';
  contactNumber?: string;
}

function generateEmployees(
  deptMap: Record<string, string>,
  desMap: Record<string, string>,
  shiftMap: Record<string, string>
): EmployeeSeed[] {
  const employees: EmployeeSeed[] = [];
  let empNum = 1;

  const pad = (n: number) => String(n).padStart(3, '0');

  function addBatch(
    count: number,
    deptCode: string,
    desName: string,
    shiftName: string,
    category: 'worker' | 'office-staff',
    empType: 'permanent' | 'contract' | 'temporary',
    salaryMin: number,
    salaryMax: number,
    otEligible: boolean,
    startYear: number
  ) {
    for (let i = 0; i < count; i++) {
      const isF = Math.random() < 0.25;
      const first = isF ? randomFrom(FIRST_NAMES_F) : randomFrom(FIRST_NAMES_M);
      const last = randomFrom(LAST_NAMES);
      const year = randomBetween(startYear, 2025);
      const month = randomBetween(1, 12);
      const day = randomBetween(1, 28);
      const isMonthly = category !== 'worker';
      const base = randomBetween(salaryMin, salaryMax);
      employees.push({
        employeeCode: `ORN${pad(empNum++)}`,
        fullName: `${first} ${last}`,
        fatherName: `${randomFrom(FATHER_NAMES)} ${last}`,
        category,
        employmentType: empType,
        department: deptMap[deptCode] as unknown as mongoose.Types.ObjectId,
        designation: desMap[desName] as unknown as mongoose.Types.ObjectId,
        shift: shiftMap[shiftName] as unknown as mongoose.Types.ObjectId,
        joiningDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        salaryType: isMonthly ? 'monthly' : 'daily',
        baseSalary: base,
        dailyWage: isMonthly ? 0 : Math.round((base / 26) * 100) / 100,
        overtimeEligible: otEligible,
        status: 'active',
        contactNumber: `9${randomBetween(100000000, 999999999)}`,
      });
    }
  }

  // Production — 85 workers + 5 supervisors + 2 managers
  addBatch(85, 'PROD', 'Machine Operator', 'Morning Shift', 'worker', 'permanent', 12000, 18000, true, 2018);
  addBatch(15, 'PROD', 'Line Worker', 'Evening Shift', 'worker', 'permanent', 11000, 16000, true, 2019);
  addBatch(10, 'PROD', 'Line Worker', 'Night Shift', 'worker', 'contract', 10000, 15000, true, 2021);
  addBatch(5, 'PROD', 'Production Supervisor', 'Morning Shift', 'worker', 'permanent', 22000, 30000, false, 2017);
  addBatch(2, 'PROD', 'Production Manager', 'General Shift', 'office-staff', 'permanent', 45000, 65000, false, 2015);

  // SMT — 30 operators + 5 technicians + 3 supervisors + 2 engineers
  addBatch(30, 'SMT', 'SMT Operator', 'Morning Shift', 'worker', 'permanent', 14000, 20000, true, 2019);
  addBatch(10, 'SMT', 'SMT Operator', 'Evening Shift', 'worker', 'permanent', 14000, 20000, true, 2020);
  addBatch(5, 'SMT', 'SMT Technician', 'Morning Shift', 'worker', 'permanent', 20000, 28000, false, 2018);
  addBatch(3, 'SMT', 'SMT Supervisor', 'General Shift', 'office-staff', 'permanent', 30000, 40000, false, 2016);
  addBatch(2, 'SMT', 'SMT Engineer', 'General Shift', 'office-staff', 'permanent', 40000, 55000, false, 2017);

  // QC — 12 inspectors + 4 engineers + 2 managers
  addBatch(12, 'QC', 'QC Inspector', 'Morning Shift', 'worker', 'permanent', 15000, 22000, false, 2018);
  addBatch(3, 'QC', 'QC Inspector', 'Evening Shift', 'worker', 'contract', 14000, 20000, false, 2021);
  addBatch(4, 'QC', 'QC Engineer', 'General Shift', 'office-staff', 'permanent', 30000, 42000, false, 2017);
  addBatch(2, 'QC', 'QC Manager', 'General Shift', 'office-staff', 'permanent', 50000, 70000, false, 2015);

  // PCB Design — 6 designers + 3 seniors + 1 manager
  addBatch(6, 'DES', 'PCB Designer', 'General Shift', 'office-staff', 'permanent', 25000, 38000, false, 2019);
  addBatch(3, 'DES', 'Senior PCB Designer', 'General Shift', 'office-staff', 'permanent', 40000, 55000, false, 2016);
  addBatch(1, 'DES', 'Design Manager', 'General Shift', 'office-staff', 'permanent', 60000, 80000, false, 2014);

  // Maintenance — 6 technicians + 2 engineers
  addBatch(6, 'MNT', 'Maintenance Technician', 'Morning Shift', 'worker', 'permanent', 16000, 24000, true, 2018);
  addBatch(2, 'MNT', 'Maintenance Engineer', 'General Shift', 'office-staff', 'permanent', 32000, 45000, false, 2017);

  // Store — 5 keepers + 1 manager
  addBatch(5, 'STORE', 'Store Keeper', 'General Shift', 'worker', 'permanent', 14000, 20000, false, 2019);
  addBatch(1, 'STORE', 'Store Manager', 'General Shift', 'office-staff', 'permanent', 35000, 45000, false, 2016);

  // HR — 2 executives + 1 manager
  addBatch(2, 'HR', 'HR Executive', 'General Shift', 'office-staff', 'permanent', 22000, 32000, false, 2020);
  addBatch(1, 'HR', 'HR Manager', 'General Shift', 'office-staff', 'permanent', 45000, 60000, false, 2015);

  // Finance — 2 accountants + 1 manager
  addBatch(2, 'FIN', 'Accountant', 'General Shift', 'office-staff', 'permanent', 25000, 35000, false, 2019);
  addBatch(1, 'FIN', 'Finance Manager', 'General Shift', 'office-staff', 'permanent', 50000, 70000, false, 2014);

  // Security — 6 guards + 1 officer
  addBatch(4, 'SEC', 'Security Guard', 'Morning Shift', 'worker', 'permanent', 12000, 16000, true, 2020);
  addBatch(3, 'SEC', 'Security Guard', 'Night Shift', 'worker', 'contract', 12000, 16000, true, 2021);
  addBatch(1, 'SEC', 'Security Officer', 'General Shift', 'office-staff', 'permanent', 22000, 30000, false, 2018);

  // IT — 2 support + 1 manager
  addBatch(2, 'IT', 'IT Support', 'General Shift', 'office-staff', 'permanent', 25000, 38000, false, 2020);
  addBatch(1, 'IT', 'IT Manager', 'General Shift', 'office-staff', 'permanent', 55000, 75000, false, 2016);

  return employees;
}

// ─── HOLIDAYS ───
function getHolidays(year: number) {
  return [
    { name: 'Republic Day', date: `${year}-01-26`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'Maha Shivaratri', date: `${year}-02-26`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Holi', date: `${year}-03-14`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Good Friday', date: `${year}-04-18`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Dr. Ambedkar Jayanti', date: `${year}-04-14`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'May Day', date: `${year}-05-01`, type: 'national', year, isPaid: true, applicableTo: 'worker' },
    { name: 'Independence Day', date: `${year}-08-15`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'Janmashtami', date: `${year}-08-16`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Ganesh Chaturthi', date: `${year}-08-27`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'Dussehra', date: `${year}-10-20`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Diwali', date: `${year}-11-08`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
    { name: 'Christmas', date: `${year}-12-25`, type: 'festival', year, isPaid: true, applicableTo: 'all' },
  ];
}

// ─── MAIN SEED ───
async function seed() {
  await connectDB();

  // Clean existing data
  console.log('Cleaning existing data...');
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  console.log('All collections cleared');

  const year = new Date().getFullYear();

  // 1. Admin user
  console.log('Creating admin user...');
  await User.create({
    name: 'Rajiv Menon',
    email: 'admin@oriancircuits.com',
    password: 'Admin@1234',
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });
  console.log('Admin: admin@oriancircuits.com / Admin@1234');

  // HR user
  await User.create({
    name: 'Priya Sharma',
    email: 'hr@oriancircuits.com',
    password: 'Hr@123456',
    role: ROLES.HR_ADMIN,
    isActive: true,
  });
  console.log('HR: hr@oriancircuits.com / Hr@123456');

  // Accounts user
  await User.create({
    name: 'Vikram Patel',
    email: 'accounts@oriancircuits.com',
    password: 'Acct@123456',
    role: ROLES.ACCOUNTS,
    isActive: true,
  });
  console.log('Accounts: accounts@oriancircuits.com / Acct@123456');

  // 2. Company Settings
  console.log('Creating company settings...');
  await CompanySettings.create({
    companyInfo: {
      name: 'Orian Circuits Pvt. Ltd.',
      address: 'Plot No. 42, Phase III, SIDCO Industrial Estate, Maraimalai Nagar, Tamil Nadu 603209',
      phone: '+91-44-27456789',
      email: 'info@oriancircuits.com',
      financialYearStart: 4,
      cin: 'U31909TN2014PTC097654',
      gstin: '33AABCO1234A1Z5',
      tan: 'CHEN01234B',
      pan: 'AABCO1234B',
      pfEstablishmentCode: 'TNCHN0012345000',
      esiCode: '41234567890001000',
      ptRegistrationNumber: 'TN-PT-2014-001234',
      payCycle: 'monthly',
      payPeriod: '26th-25th',
      salaryCreditDate: 1,
      currency: 'INR',
    },
    payrollConfig: {
      overtimeBase: 'basic',
      overtimeMultiplier: 2,
      halfDayDeductionPercent: 50,
      lateDeductionPerDay: 0,
      paidWeeklyOff: true,
      paidHolidays: true,
      defaultWorkingDays: 26,
      standardHoursPerDay: 8,
      payrollLockDays: 5,
      unfinalizeWindowDays: 3,
      otTricksEnabled: false,
      otRoundingMinutes: 15,
      otRoundingMethod: 'round',
      otMultiplierBasicOnly: false,
      perDayCalcMethod: '26',
      lopCalcMethod: '26',
      roundingFinalSalary: 'nearest',
      roundingPrecision: 1,
      negativeNetPayAllow: false,
      arrearsAutoCalculate: true,
      multiBankSplit: false,
      makerCheckerEnabled: false,
      lopPerDayBase: '26',
      lopComponentsAffected: ['basic', 'hda', 'da'],
      lopImpactsPf: true,
      lopImpactsEsi: true,
      lopImpactsBonus: true,
      lopAutoFromAttendance: true,
      lopReversalAllowed: true,
      lopReversalDeadline: 'next-month',
      minimumWage: 11000,
    },
    attendanceConfig: {
      pastEntryLimitDays: 7,
      lateMarkEnabled: true,
      lateMarkThresholdMinutes: 15,
      lateToHalfDayAfterOccurrences: 3,
      qrKioskEnabled: true,
      qrRefreshIntervalSeconds: 30,
      qrTokenExpirySeconds: 60,
      geofencingEnabled: false,
      geofenceLatitude: 12.8645,
      geofenceLongitude: 80.2245,
      geofenceRadiusMeters: 500,
      totpEnabled: false,
      shiftStartTime: '06:00',
      shiftEndTime: '14:00',
      gracePeriodMinutes: 10,
      lateMarkAsAbsent: false,
      lateTreatWorkAsOT: false,
      supervisorOverrideEnabled: true,
      deviceBindingEnabled: false,
      maxDevicesPerEmployee: 2,
      sandwichRuleEnabled: true,
      compOffEarnRule: 'holiday-work',
      compOffValidityDays: 30,
      regularizationAllowed: true,
      regularizationDeadlineDays: 90,
    },
    allowanceConfig: [
      { name: 'House Rent Allowance', type: 'percentage', value: 40, applicableTo: 'all', isActive: true },
      { name: 'Dearness Allowance', type: 'percentage', value: 30, applicableTo: 'all', isActive: true },
      { name: 'Transport Allowance', type: 'fixed', value: 1600, applicableTo: 'office-staff', isActive: true },
      { name: 'Meal Allowance', type: 'fixed', value: 1500, applicableTo: 'worker', isActive: true },
      { name: 'Shift Allowance', type: 'fixed', value: 2000, applicableTo: 'worker', isActive: true },
      { name: 'Skill Allowance', type: 'fixed', value: 3000, applicableTo: 'all', isActive: true },
    ],
    deductionConfig: [
      { name: 'PF', type: 'percentage', value: 12, applicableTo: 'all', isActive: true },
      { name: 'ESI', type: 'percentage', value: 0.75, applicableTo: 'all', isActive: true },
      { name: 'Professional Tax', type: 'fixed', value: 200, applicableTo: 'all', isActive: true },
    ],
    authConfig: {
      tokenExpiry: '24h',
      refreshTokenExpiry: '7d',
      passwordMinLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialChar: true,
      passwordHistoryCount: 5,
    },
    notificationConfig: {
      emailEnabled: false,
      notifyOnPayrollRun: true,
      notifyOnEmployeeAdded: true,
      notifyOnUserCreated: true,
      notifyOnAttendanceEntry: false,
      notifyOnLeaveApplied: true,
      notifyOnLeaveApproved: true,
    },
    employeeCodeConfig: { prefix: 'ORN', startNumber: 250, padding: 3, isAutoGenerate: true },
    departmentCodeConfig: { prefix: 'DPT', startNumber: 1, padding: 2, isAutoGenerate: false },
    employeeDefaults: {
      defaultCategory: 'worker',
      defaultEmploymentType: 'permanent',
      defaultSalaryType: 'monthly',
      defaultWorkingDays: 26,
    },
    leaveConfig: {
      financialYearStartMonth: 4,
      accrualDayOfMonth: 1,
      defaultApprovalLevels: 2,
      allowCancelAfterApproval: true,
      cancelAfterApprovalDaysLimit: 3,
      deductionPriority: 'unpaid-first',
      allowanceProRateMode: 'days',
      deductionProRateMode: 'days',
    },
    loanConfig: {
      defaultApprovalLevels: 2,
      maxLoanPercentageOfSalary: 50,
      minRepaymentPeriodMonths: 3,
      maxRepaymentPeriodMonths: 24,
      deductionPriority: 'after-tax',
    },
    statutoryConfig: {
      pfEnabled: true,
      pfWageCeiling: 15000,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      epsRate: 8.33,
      edliRate: 0.5,
      pfAdminCharges: 0.5,
      edliAdminCharges: 0.2,
      esiEnabled: true,
      esiThreshold: 21000,
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
      ptEnabled: true,
      ptSlabs: [
        {
          state: 'Tamil Nadu',
          slabs: [
            { minSalary: 0, maxSalary: 20000, amount: 0, frequency: 'monthly' },
            { minSalary: 20001, maxSalary: 30000, amount: 100, frequency: 'monthly' },
            { minSalary: 30001, maxSalary: 45000, amount: 230, frequency: 'monthly' },
            { minSalary: 45001, maxSalary: 60000, amount: 310, frequency: 'monthly' },
            { minSalary: 60001, maxSalary: 75000, amount: 410, frequency: 'monthly' },
            { minSalary: 75001, maxSalary: 100000, amount: 520, frequency: 'monthly' },
            { minSalary: 100001, maxSalary: 999999999, amount: 620, frequency: 'monthly' },
          ],
        },
      ],
    },
    employeeSelfService: {
      essEnabled: true,
      allowAddressUpdate: true,
      allowBankUpdate: true,
      allowEmergencyContactUpdate: true,
      allowPhoneUpdate: true,
      changeRequiresApproval: false,
      maxChangesPerMonth: 5,
    },
    announcementConfig: {
      announcementsEnabled: true,
      maxAnnouncementLength: 5000,
      allowAttachments: true,
      maxAttachmentSizeMb: 10,
      autoExpireDays: 30,
      allowScheduling: true,
    },
    helpdeskConfig: {
      ticketsEnabled: true,
      autoAssign: true,
      maxAttachments: 5,
      slaHoursUrgent: 4,
      slaHoursHigh: 8,
      slaHoursNormal: 24,
      slaHoursLow: 72,
    },
    assetConfig: {
      assetManagementEnabled: true,
      autoGenerateAssetCode: true,
      assetCodePrefix: 'AST',
      assetCodePadding: 4,
      allowMultipleAllocation: false,
      maintenanceReminderDays: 30,
      categories: ['Laptop', 'Monitor', 'ESD Wristband', 'Soldering Station', 'Multimeter', 'Tool Kit', 'ID Card', 'Uniform', 'Vehicle'],
      conditions: ['New', 'Good', 'Fair', 'Damaged', 'Retired'],
    },
    documentConfig: {
      documentRepoEnabled: true,
      maxFileSizeMb: 10,
      allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
      autoExpireReminderDays: 30,
      enableVersioning: false,
      maxVersions: 3,
      categories: [
        { name: 'Identity Proof', accessRoles: ['super-admin', 'hr-admin', 'hr-staff', 'accounts'] },
        { name: 'Address Proof', accessRoles: ['super-admin', 'hr-admin', 'hr-staff'] },
        { name: 'Educational', accessRoles: ['super-admin', 'hr-admin'] },
        { name: 'Experience', accessRoles: ['super-admin', 'hr-admin'] },
        { name: 'Other', accessRoles: ['super-admin', 'hr-admin'] },
      ],
      tags: ['aadhaar', 'pan', 'passport', 'resume', 'offer-letter', 'relieving-letter'],
    },
    shiftSwapConfig: {
      shiftSwapEnabled: true,
      requireManagerApproval: true,
      maxSwapsPerMonth: 2,
      swapDeadlineHours: 24,
      allowRecurringSwaps: false,
      notifyOnMatch: true,
      shiftPreferenceEnabled: true,
    },
    travelConfig: {
      travelEnabled: false,
      requirePreApproval: true,
      maxAdvanceAmount: 10000,
      mileageRatePerKm: 8,
      perDiemRate: 1200,
      perDiemEligible: false,
      maxClaimsPerMonth: 5,
      reimbursementProcessingDays: 7,
      allowPartialReimbursement: true,
      expenseCategories: ['Travel', 'Stay', 'Food', 'Other'],
      approvalLevels: 2,
      autoApprovalUpTo: 2000,
    },
    gratuityConfig: {
      gratuityEnabled: true,
      gratuityActApplicable: true,
      minServiceYears: 5,
      maxGratuityAmount: 2000000,
      calculationMethod: 'statutory',
      customMultiplier: 15,
      considerMonthlyWages: true,
    },
    performanceConfig: {
      performanceEnabled: true,
      reviewFrequency: 'half-yearly',
      reviewPeriodStartMonth: 4,
      selfReviewRequired: true,
      managerReviewRequired: true,
      enable360Feedback: false,
      ratingScale: '1-5',
      goalCreationDeadlineDays: 30,
      reviewSubmissionDeadlineDays: 15,
      allowEmployeeGoalSetting: true,
      autoCloseAfterDays: 90,
      ratingLabels: { '1': 'Needs Improvement', '2': 'Below Expectations', '3': 'Meets Expectations', '4': 'Exceeds Expectations', '5': 'Outstanding' },
    },
    trainingConfig: {
      trainingEnabled: true,
      autoEnrollByDesignation: false,
      certificationExpiryReminderDays: 30,
      allowSelfEnrollment: true,
      maxSelfEnrollmentsPerEmployee: 5,
      trainingCategories: ['Safety', 'Quality', 'Technical', 'Soft Skills', 'Compliance', 'ESD Handling'],
      trainingModes: ['Classroom', 'Online', 'On-the-Job', 'Workshop'],
      skillCategories: ['PCB Design', 'SMT Assembly', 'Quality Inspection', 'Equipment Operation', 'Safety Protocols'],
    },
  });
  console.log('Company settings created');

  // 3. Departments
  console.log('Creating departments...');
  const depts = await Department.insertMany(DEPT_DATA.map((d) => ({ ...d, isActive: true })));
  const deptMap: Record<string, string> = {};
  depts.forEach((d) => { deptMap[d.code] = d._id.toString(); });
  console.log(`${depts.length} departments created`);

  // 4. Designations
  console.log('Creating designations...');
  const desData = getDesignations(deptMap);
  const des = await Designation.insertMany(desData.map((d) => ({ ...d, isActive: true })));
  const desMap: Record<string, string> = {};
  des.forEach((d) => { desMap[d.name] = d._id.toString(); });
  console.log(`${des.length} designations created`);

  // 5. Shifts
  console.log('Creating shifts...');
  const shiftData = [
    { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'Night Shift', startTime: '22:00', endTime: '06:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'General Shift', startTime: '09:00', endTime: '18:00', workingHours: 8, applicableTo: 'office-staff' },
  ];
  const shifts = await Shift.insertMany(shiftData.map((s) => ({ ...s, isActive: true })));
  const shiftMap: Record<string, string> = {};
  shifts.forEach((s) => { shiftMap[s.name] = s._id.toString(); });
  console.log(`${shifts.length} shifts created`);

  // 6. Weekly Off Rules
  console.log('Creating weekly off rules...');
  await WeeklyOffRule.insertMany([
    { name: 'Sunday Off - Workers', category: 'worker', offDays: [0], isActive: true },
    { name: 'Sunday Off - Office Staff', category: 'office-staff', offDays: [0], isActive: true },
  ]);
  console.log('Weekly off rules created');

  // 7. Holidays
  console.log('Creating holidays...');
  const holidays = getHolidays(year);
  await Holiday.insertMany(holidays);
  console.log(`${holidays.length} holidays created for ${year}`);

  // 8. Leave Types
  console.log('Creating leave types...');
  await LeaveType.insertMany([
    { name: 'Casual Leave', code: 'CL', maxDaysPerYear: 12, maxDaysPerApplication: 4, carryForward: false, carryForwardLimit: 0, isPaid: true, sortOrder: 1 },
    { name: 'Sick Leave', code: 'SL', maxDaysPerYear: 12, maxDaysPerApplication: 5, carryForward: true, carryForwardLimit: 6, isPaid: true, sortOrder: 2 },
    { name: 'Earned Leave', code: 'EL', maxDaysPerYear: 15, maxDaysPerApplication: 10, carryForward: true, carryForwardLimit: 30, encashable: true, isPaid: true, sortOrder: 3 },
    { name: 'Maternity Leave', code: 'ML', maxDaysPerYear: 182, maxDaysPerApplication: 182, carryForward: false, carryForwardLimit: 0, isPaid: true, applicableToGender: 'female', sortOrder: 4 },
    { name: 'Paternity Leave', code: 'PL', maxDaysPerYear: 5, maxDaysPerApplication: 5, carryForward: false, carryForwardLimit: 0, isPaid: true, applicableToGender: 'male', sortOrder: 5 },
    { name: 'Unpaid Leave', code: 'UL', maxDaysPerYear: 30, maxDaysPerApplication: 30, carryForward: false, carryForwardLimit: 0, isPaid: false, deductionMethod: 'basic-plus-allowances', sortOrder: 6 },
    { name: 'Compensatory Off', code: 'CO', maxDaysPerYear: 10, maxDaysPerApplication: 2, carryForward: false, carryForwardLimit: 0, isPaid: true, sortOrder: 7 },
  ]);
  console.log('Leave types created');

  // 9. Loan Types
  console.log('Creating loan types...');
  await LoanType.insertMany([
    { name: 'Emergency Loan', code: 'EMG', maxAmount: 50000, interestRate: 0, maxTenure: 12, isActive: true },
    { name: 'Salary Advance', code: 'ADV', maxAmount: 30000, interestRate: 0, maxTenure: 3, isActive: true },
    { name: 'Festival Loan', code: 'FES', maxAmount: 25000, interestRate: 0, maxTenure: 6, isActive: true },
    { name: 'Education Loan', code: 'EDU', maxAmount: 100000, interestRate: 6, maxTenure: 24, isActive: true },
  ]);
  console.log('Loan types created');

  // 10. Employees
  console.log('Creating 200+ employees...');
  const employees = generateEmployees(deptMap, desMap, shiftMap);
  await Employee.insertMany(employees);
  console.log(`${employees.length} employees created`);

  // Create user accounts for managers and key staff
  console.log('Creating user accounts for key staff...');
  const managerEmps = employees.filter(e =>
    e.designation.toString() === desMap['Production Manager'] ||
    e.designation.toString() === desMap['HR Manager'] ||
    e.designation.toString() === desMap['Finance Manager'] ||
    e.designation.toString() === desMap['QC Manager'] ||
    e.designation.toString() === desMap['IT Manager']
  );

  for (const emp of managerEmps) {
    const desName = desData.find(d => d._id?.toString() === emp.designation.toString() || desMap[d.name] === emp.designation.toString())?.name || '';
    let role = ROLES.MANAGER;
    if (desName === 'HR Manager') role = ROLES.HR_ADMIN;
    if (desName === 'Finance Manager') role = ROLES.ACCOUNTS;
    if (desName === 'IT Manager') role = ROLES.HR_ADMIN;

    const emailName = emp.fullName.toLowerCase().replace(/\s+/g, '.');
    try {
      await User.create({
        name: emp.fullName,
        email: `${emailName}@oriancircuits.com`,
        password: 'Pass@1234',
        role,
        isActive: true,
        employeeId: emp._id,
      });
    } catch {
      // skip duplicate
    }
  }
  console.log('Key staff user accounts created');

  console.log('\n═══════════════════════════════════════');
  console.log('  ORIAN CIRCUITS PVT. LTD.');
  console.log('  PCB Manufacturing — Seed Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`  Departments:     ${depts.length}`);
  console.log(`  Designations:    ${des.length}`);
  console.log(`  Shifts:          ${shifts.length}`);
  console.log(`  Holidays:        ${holidays.length}`);
  console.log(`  Employees:       ${employees.length}`);
  console.log('───────────────────────────────────────');
  console.log('  Admin login:     admin@oriancircuits.com / Admin@1234');
  console.log('  HR login:        hr@oriancircuits.com / Hr@123456');
  console.log('  Accounts login:  accounts@oriancircuits.com / Acct@123456');
  console.log('  Staff login:     <name>@oriancircuits.com / Pass@1234');
  console.log('═══════════════════════════════════════\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
