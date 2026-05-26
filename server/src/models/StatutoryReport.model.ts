import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStatutoryReport extends Document {
  reportType: 'pf-ecr' | 'pf-form-5' | 'pf-form-10' | 'esi-return' | 'pt-return' | 'custom';
  month: string;
  financialYear: string;
  status: 'generated' | 'downloaded' | 'filed';
  generatedAt: Date;
  generatedBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  data: Record<string, unknown>;
  filePath?: string;
  fileName?: string;
  filedDate?: Date;
  acknowledgementNo?: string;
}

interface StatutoryReportModel extends Model<IStatutoryReport> {}

const StatutoryReportSchema = new Schema<IStatutoryReport>(
  {
    reportType: {
      type: String,
      enum: ['pf-ecr', 'pf-form-5', 'pf-form-10', 'esi-return', 'pt-return', 'custom'],
      required: true,
    },
    month: { type: String, required: true },
    financialYear: { type: String, required: true },
    status: {
      type: String,
      enum: ['generated', 'downloaded', 'filed'],
      default: 'generated',
    },
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    data: { type: Schema.Types.Mixed, default: {} },
    filePath: { type: String },
    fileName: { type: String },
    filedDate: { type: Date },
    acknowledgementNo: { type: String },
  },
  { timestamps: true },
);

StatutoryReportSchema.index({ reportType: 1, month: 1, financialYear: 1 });

const StatutoryReport = mongoose.model<IStatutoryReport, StatutoryReportModel>('StatutoryReport', StatutoryReportSchema);

export default StatutoryReport;
