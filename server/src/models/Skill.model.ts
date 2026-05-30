import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  category: string;
  description: string;
  isActive: boolean;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SkillSchema.index({ category: 1 });
SkillSchema.index({ isActive: 1 });

const Skill = mongoose.model<ISkill>('Skill', SkillSchema);

export default Skill;
