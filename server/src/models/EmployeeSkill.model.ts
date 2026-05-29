import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeSkill extends Document {
  employee: mongoose.Types.ObjectId;
  skill: mongoose.Types.ObjectId;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  lastUsedAt?: Date;
  certified: boolean;
  certificationExpiry?: Date;
  source: 'self-reported' | 'manager-assigned' | 'training-completed';
}

const EmployeeSkillSchema = new Schema<IEmployeeSkill>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    yearsOfExperience: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    certified: { type: Boolean, default: false },
    certificationExpiry: { type: Date },
    source: {
      type: String,
      enum: ['self-reported', 'manager-assigned', 'training-completed'],
      default: 'self-reported',
    },
  },
  { timestamps: true },
);

EmployeeSkillSchema.index({ employee: 1, skill: 1 }, { unique: true });
EmployeeSkillSchema.index({ skill: 1 });

const EmployeeSkill = mongoose.model<IEmployeeSkill>('EmployeeSkill', EmployeeSkillSchema);

export default EmployeeSkill;
