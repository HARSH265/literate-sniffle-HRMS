import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Employee from '../models/Employee.model.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const emps = await Employee.find().sort({ employeeCode: 1 }).lean();
  emps.forEach((e: any) => console.log(e.employeeCode, '-', e.fullName));
  await mongoose.disconnect();
}

run().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
