import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  employeeCode: string;
  fullName: string;
  fatherName: string;
  category: 'worker' | 'office-staff';
  employmentType: 'permanent' | 'contract' | 'temporary' | 'trainee';
  department: mongoose.Types.ObjectId;
  designation: mongoose.Types.ObjectId;
  shift: mongoose.Types.ObjectId;
  joiningDate: Date;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  dailyWage: number;
  overtimeEligible: boolean;
  status: 'active' | 'inactive' | 'terminated';
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
  photo?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

interface EmployeeModel extends Model<IEmployee> {}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeCode: { type: String, required: true, unique: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['worker', 'office-staff'],
    },
    employmentType: {
      type: String,
      required: true,
      enum: ['permanent', 'contract', 'temporary', 'trainee'],
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    designation: { type: Schema.Types.ObjectId, ref: 'Designation', required: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    joiningDate: { type: Date, required: true },
    salaryType: {
      type: String,
      required: true,
      enum: ['monthly', 'daily'],
    },
    baseSalary: { type: Number, required: true, min: 0 },
    dailyWage: { type: Number, default: 0, min: 0 },
    overtimeEligible: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    contactNumber: { type: String },
    address: { type: String },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountType: { type: String, enum: ['savings', 'current'] },
    },
    photo: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ category: 1 });
EmployeeSchema.index({ shift: 1 });

const Employee = mongoose.model<IEmployee, EmployeeModel>('Employee', EmployeeSchema);

export default Employee;