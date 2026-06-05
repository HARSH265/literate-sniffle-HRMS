import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Employee from '../src/models/Employee.model.js';

dotenv.config();

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const emp = await Employee.findOne({});
  if (!emp) {
    console.log('No employee found');
    process.exit();
  }
  emp.bankSplitPercent = 30;
  emp.bankDetails = {
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    ifscCode: 'TEST0001',
    accountType: 'savings',
    accountHolderName: emp.fullName,
  };
  emp.secondaryBank = {
    bankName: 'Other Bank',
    accountNumber: '9876543210',
    ifscCode: 'OTHR0001',
    accountType: 'savings',
    accountHolderName: emp.fullName,
  };
  await emp.save();
  console.log('Updated employee', emp._id.toString());
  await mongoose.disconnect();
})();
