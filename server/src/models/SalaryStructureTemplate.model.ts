import mongoose, { Schema, Document, Model } from 'mongoose';

export interface TemplateComponent {
  componentCode: string;
  calcType: string;
  calcValue: number;
  calcReferenceComponent?: string;
  isMandatory: boolean;
  sortOrder: number;
}

export interface ISalaryStructureTemplate extends Document {
  name: string;
  description?: string;
  applicableTo: {
    categories: string[];
    employmentTypes: string[];
    departments: mongoose.Types.ObjectId[];
    locations: string[];
    grades: string[];
  };
  components: TemplateComponent[];
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

type SalaryStructureTemplateModel = Model<ISalaryStructureTemplate>;

const templateComponentSchema = new Schema(
  {
    componentCode: { type: String, required: true },
    calcType: { type: String, required: true },
    calcValue: { type: Number, required: true },
    calcReferenceComponent: { type: String },
    isMandatory: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const SalaryStructureTemplateSchema = new Schema<ISalaryStructureTemplate>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    applicableTo: {
      categories: { type: [String], default: [] },
      employmentTypes: { type: [String], default: [] },
      departments: { type: [{ type: Schema.Types.ObjectId, ref: 'Department' }], default: [] },
      locations: { type: [String], default: [] },
      grades: { type: [String], default: [] },
    },
    components: { type: [templateComponentSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);


SalaryStructureTemplateSchema.index({ isActive: 1 });

const SalaryStructureTemplate = mongoose.model<ISalaryStructureTemplate, SalaryStructureTemplateModel>(
  'SalaryStructureTemplate',
  SalaryStructureTemplateSchema,
);

export default SalaryStructureTemplate;
