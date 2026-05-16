import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import Shift from '../models/Shift.model.js';
import Employee from '../models/Employee.model.js';
import CompanySettings from '../models/CompanySettings.model.js';
import Holiday from '../models/Holiday.model.js';
import WeeklyOffRule from '../models/WeeklyOffRule.model.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not defined');
  }
  await mongoose.connect(MONGODB_URI);
  console.log('DB connected for seeding');
}

async function seedAdmin() {
  const existing = await User.findOne({ email: 'admin@hrms.com' });
  if (existing) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  await User.create({
    name: 'Super Admin',
    email: 'admin@hrms.com',
    password: 'admin123',
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });

  console.log('Admin user created: admin@hrms.com / admin123');
}

async function seedDepartments() {
  const count = await Department.countDocuments();
  if (count > 0) {
    console.log('Departments already seeded, skipping...');
    return;
  }

  const departments = [
    { name: 'Production', code: 'PROD', description: 'Manufacturing production floor' },
    { name: 'Quality Control', code: 'QC', description: 'Quality assurance and control' },
    { name: 'Maintenance', code: 'MNT', description: 'Equipment maintenance and repair' },
    { name: 'Store and Inventory', code: 'STORE', description: 'Raw materials and finished goods' },
    { name: 'HR and Admin', code: 'HR', description: 'Human resources and administration' },
    { name: 'Accounts and Finance', code: 'FIN', description: 'Finance and accounting' },
    { name: 'Security', code: 'SEC', description: 'Factory security' },
    { name: 'IT', code: 'IT', description: 'Information technology' },
  ];

  await Department.insertMany(departments.map((d) => ({ ...d, isActive: true })));
  console.log('Departments seeded');
}

async function seedDesignations() {
  const count = await Designation.countDocuments();
  if (count > 0) {
    console.log('Designations already seeded, skipping...');
    return;
  }

  const departments = await Department.find().lean();
  const deptMap: Record<string, string> = {};
  departments.forEach((d) => {
    deptMap[d.code] = d._id.toString();
  });

  const designations = [
    { name: 'Worker', department: deptMap['PROD'] },
    { name: 'Supervisor', department: deptMap['PROD'] },
    { name: 'QC Inspector', department: deptMap['QC'] },
    { name: 'QC Manager', department: deptMap['QC'] },
    { name: 'Maintenance Technician', department: deptMap['MNT'] },
    { name: 'Maintenance Engineer', department: deptMap['MNT'] },
    { name: 'Store Keeper', department: deptMap['STORE'] },
    { name: 'Store Manager', department: deptMap['STORE'] },
    { name: 'HR Executive', department: deptMap['HR'] },
    { name: 'HR Manager', department: deptMap['HR'] },
    { name: 'Accountant', department: deptMap['FIN'] },
    { name: 'Finance Manager', department: deptMap['FIN'] },
    { name: 'Security Guard', department: deptMap['SEC'] },
    { name: 'Security Officer', department: deptMap['SEC'] },
    { name: 'IT Support', department: deptMap['IT'] },
    { name: 'IT Manager', department: deptMap['IT'] },
  ];

  await Designation.insertMany(designations.map((d) => ({ ...d, isActive: true })));
  console.log('Designations seeded');
}

async function seedShifts() {
  const count = await Shift.countDocuments();
  if (count > 0) {
    console.log('Shifts already seeded, skipping...');
    return;
  }

  const shifts = [
    { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'Evening Shift', startTime: '14:00', endTime: '22:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'Night Shift', startTime: '22:00', endTime: '06:00', workingHours: 8, applicableTo: 'worker' },
    { name: 'General Shift', startTime: '09:00', endTime: '18:00', workingHours: 8, applicableTo: 'office-staff' },
  ];

  await Shift.insertMany(shifts.map((s) => ({ ...s, isActive: true })));
  console.log('Shifts seeded');
}

async function seedCompanySettings() {
  const existing = await CompanySettings.countDocuments();
  if (existing > 0) {
    console.log('CompanySettings already seeded, skipping...');
    return;
  }

  await CompanySettings.create({
    companyInfo: {
      name: 'Manufacturing Company',
      financialYearStart: 4,
    },
  });

  console.log('CompanySettings seeded');
}

async function seedHolidays() {
  const count = await Holiday.countDocuments();
  if (count > 0) {
    console.log('Holidays already seeded, skipping...');
    return;
  }

  const year = new Date().getFullYear();
  const holidays = [
    { name: 'Republic Day', date: `${year}-01-26`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'Independence Day', date: `${year}-08-15`, type: 'national', year, isPaid: true, applicableTo: 'all' },
    { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'national', year, isPaid: true, applicableTo: 'all' },
  ];

  await Holiday.insertMany(holidays);
  console.log('Holidays seeded');
}

async function seedWeeklyOffRules() {
  const count = await WeeklyOffRule.countDocuments();
  if (count > 0) {
    console.log('WeeklyOffRules already seeded, skipping...');
    return;
  }

  await WeeklyOffRule.create({
    name: 'Sunday Off',
    category: 'all',
    offDays: [0],
    isActive: true,
  });

  console.log('WeeklyOffRules seeded');
}

async function seedEmployees() {
  const count = await Employee.countDocuments();
  if (count > 0) {
    console.log('Employees already seeded, skipping...');
    return;
  }

  const departments = await Department.find().lean();
  const designations = await Designation.find().lean();
  const shifts = await Shift.find().lean();

  const getDept = (code: string) => departments.find((d) => d.code === code)?._id;
  const getDes = (name: string) => designations.find((d) => d.name === name)?._id;
  const getShift = (name: string) => shifts.find((s) => s.name === name)?._id;

  const employees = [
    {
      employeeCode: 'EMP001',
      fullName: 'Rajesh Kumar',
      fatherName: 'Mohan Kumar',
      category: 'worker',
      employmentType: 'permanent',
      department: getDept('PROD'),
      designation: getDes('Worker'),
      shift: getShift('Morning Shift'),
      joiningDate: '2023-01-15',
      salaryType: 'monthly',
      baseSalary: 15000,
      overtimeEligible: true,
      status: 'active',
    },
    {
      employeeCode: 'EMP002',
      fullName: 'Sunita Devi',
      fatherName: 'Ram Singh',
      category: 'worker',
      employmentType: 'permanent',
      department: getDept('PROD'),
      designation: getDes('Worker'),
      shift: getShift('Morning Shift'),
      joiningDate: '2023-03-01',
      salaryType: 'monthly',
      baseSalary: 14000,
      overtimeEligible: true,
      status: 'active',
    },
    {
      employeeCode: 'EMP003',
      fullName: 'Anil Sharma',
      fatherName: 'Prakash Sharma',
      category: 'worker',
      employmentType: 'contract',
      department: getDept('QC'),
      designation: getDes('QC Inspector'),
      shift: getShift('Morning Shift'),
      joiningDate: '2024-01-10',
      salaryType: 'monthly',
      baseSalary: 18000,
      overtimeEligible: false,
      status: 'active',
    },
    {
      employeeCode: 'EMP004',
      fullName: 'Priya Patel',
      fatherName: 'Jayesh Patel',
      category: 'office-staff',
      employmentType: 'permanent',
      department: getDept('HR'),
      designation: getDes('HR Executive'),
      shift: getShift('General Shift'),
      joiningDate: '2022-06-15',
      salaryType: 'monthly',
      baseSalary: 25000,
      overtimeEligible: false,
      status: 'active',
    },
    {
      employeeCode: 'EMP005',
      fullName: 'Vikram Singh',
      fatherName: 'Surendra Singh',
      category: 'office-staff',
      employmentType: 'permanent',
      department: getDept('FIN'),
      designation: getDes('Accountant'),
      shift: getShift('General Shift'),
      joiningDate: '2021-09-01',
      salaryType: 'monthly',
      baseSalary: 30000,
      overtimeEligible: false,
      status: 'active',
    },
  ];

  await Employee.insertMany(employees);
  console.log('Sample employees seeded (5)');
}

export async function runSeeds() {
  console.log('Running seeds...');
  await connectDB();
  await seedAdmin();
  await seedCompanySettings();
  await seedDepartments();
  await seedDesignations();
  await seedShifts();
  await seedWeeklyOffRules();
  await seedHolidays();
  await seedEmployees();
  console.log('All seeds complete');
}

runSeeds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });