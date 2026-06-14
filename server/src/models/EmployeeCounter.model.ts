import mongoose, { Schema, Model } from 'mongoose';

interface IEmployeeCounter {
  _id: string;
  seq: number;
}

const EmployeeCounterSchema = new Schema<IEmployeeCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0, required: true },
});

const EmployeeCounter: Model<IEmployeeCounter> = mongoose.models.EmployeeCounter
  || mongoose.model<IEmployeeCounter>('EmployeeCounter', EmployeeCounterSchema);

export default EmployeeCounter;
