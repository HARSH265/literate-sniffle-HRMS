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
  status: 'active' | 'inactive' | 'terminated' | 'archived';
  contactNumber?: string;
  address?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'savings' | 'current';
  };
  photo?: string;
  documents?: Array<{
    type: 'aadhar' | 'pan' | 'voter' | 'driver_license' | 'passport' | 'other';
    fileName: string;
    filePath: string;
    uploadedAt: Date;
  }>;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  totpSecret?: string;
  totpEnabled: boolean;
  registeredDeviceId?: string;
  pfUAN?: string;
  esiNumber?: string;
  pfJoiningDate?: Date;
  pfExempted: boolean;
  esiExempted: boolean;
  ptExempted: boolean;
  ptState?: string;
}

type EmployeeModel = Model<IEmployee>;

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
      enum: ['active', 'inactive', 'terminated', 'archived'],
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
    documents: [{
      type: { type: String, enum: ['aadhar', 'pan', 'voter', 'driver_license', 'passport', 'other'] },
      fileName: String,
      filePath: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
    registeredDeviceId: { type: String },
    pfUAN: { type: String },
    esiNumber: { type: String },
    pfJoiningDate: { type: Date },
    pfExempted: { type: Boolean, default: false },
    esiExempted: { type: Boolean, default: false },
    ptExempted: { type: Boolean, default: false },
    ptState: { type: String },
  },
  { timestamps: true },
);

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ category: 1 });
EmployeeSchema.index({ shift: 1 });
EmployeeSchema.index({ designation: 1 });
EmployeeSchema.index({ fullName: 1 });
EmployeeSchema.index({ fatherName: 1 });

const Employee = mongoose.model<IEmployee, EmployeeModel>('Employee', EmployeeSchema);

export default Employee;