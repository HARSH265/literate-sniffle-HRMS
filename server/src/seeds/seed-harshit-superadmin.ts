import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Employee from '../models/Employee.model.js';
import Department from '../models/Department.model.js';
import Designation from '../models/Designation.model.js';
import Shift from '../models/Shift.model.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not defined');
  await mongoose.connect(MONGODB_URI);
  console.log('DB connected');
}

async function seedHarshitSuperAdmin() {
  const existingUser = await User.findOne({ email: 'harshit@hrms.com' });
  if (existingUser) {
    console.log('Harshit Singh user already exists, skipping...');
    return;
  }

  const existingEmp = await Employee.findOne({ employeeCode: 'EMP056' });
  if (existingEmp) {
    console.log('Harshit Singh employee already exists, skipping...');
    return;
  }

  const departments = await Department.find().lean();
  const designations = await Designation.find().lean();
  const shifts = await Shift.find().lean();

  if (!departments.length || !designations.length || !shifts.length) {
    console.log('Departments/Designations/Shifts not seeded yet. Run npm run seed first.');
    return;
  }

  const itDept = departments.find((d: any) => d.code === 'IT');
  const itManagerDes = designations.find((d: any) => d.name === 'IT Manager');
  const generalShift = shifts.find((s: any) => s.name === 'General Shift');

  if (!itDept || !itManagerDes || !generalShift) {
    console.log('Required department/designation/shift not found. Ensure seed has been run.');
    return;
  }

  const employee = await Employee.create({
    employeeCode: 'EMP056',
    fullName: 'Harshit Singh',
    fatherName: 'Mr. Singh',
    category: 'office-staff',
    employmentType: 'permanent',
    department: itDept._id,
    designation: itManagerDes._id,
    shift: generalShift._id,
    joiningDate: '2024-01-01',
    salaryType: 'monthly',
    baseSalary: 75000,
    overtimeEligible: false,
    status: 'active',
    contactNumber: '+91-9876543210',
    address: '123, MG Road, Mumbai - 400001',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '12345678901',
      ifscCode: 'SBIN0001234',
      accountType: 'savings',
    },
    pfUAN: 'UAN123456789',
    esiNumber: 'ESI1234567890',
  });

  console.log(`Employee created: ${employee.fullName} (${employee.employeeCode})`);

  await User.create({
    name: 'Harshit Singh',
    email: 'harshit@hrms.com',
    password: 'Harshit@1234',
    role: ROLES.SUPER_ADMIN,
    isActive: true,
    employeeId: employee._id,
    preferredLanguage: 'en',
  });

  console.log('Super admin user created: harshit@hrms.com / Harshit@1234');
}

connectDB()
  .then(() => seedHarshitSuperAdmin())
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
