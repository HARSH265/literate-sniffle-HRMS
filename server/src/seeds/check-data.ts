import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Employee from '../models/Employee.model.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ email: 'harshit@hrms.com' }).lean();
  const emp = await Employee.findOne({ employeeCode: 'EMP056' }).lean();
  console.log('User found:', !!user);
  console.log('Emp found:', !!emp);
  if (user) console.log('User name:', user.name, '| Role:', user.role);
  if (emp) console.log('Emp name:', emp.fullName, '| Code:', emp.employeeCode);
  await mongoose.disconnect();
}

check()
  .then(() => process.exit(0))
  .catch((e) => { console.error('Check failed:', e.message); process.exit(1); });
