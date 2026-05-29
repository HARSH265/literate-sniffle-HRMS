import mongoose, { Schema, Document as MongooseDoc } from 'mongoose';

export interface IDocument extends MongooseDoc {
  title: string;
  description?: string;
  category: string;
  file: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  };
  employee?: mongoose.Types.ObjectId;
  isCompanyDocument: boolean;
  version: number;
  previousVersions: {
    file: { url: string; name: string; size: number; mimeType: string };
    version: number;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];
  tags: string[];
  expiryDate?: Date;
  expiryNotificationSent: boolean;
  accessRoles: string[];
  uploadedBy: mongoose.Types.ObjectId;
  downloadCount: number;
  isActive: boolean;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String },
    category: { type: String, required: true },
    file: {
      url: { type: String, required: true },
      name: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
    },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isCompanyDocument: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        file: {
          url: { type: String },
          name: { type: String },
          size: { type: Number },
          mimeType: { type: String },
        },
        version: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
    expiryDate: { type: Date },
    expiryNotificationSent: { type: Boolean, default: false },
    accessRoles: [{ type: String }],
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    downloadCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DocumentSchema.index({ category: 1, isActive: 1 });
DocumentSchema.index({ employee: 1 });
DocumentSchema.index({ isCompanyDocument: 1 });
DocumentSchema.index({ expiryDate: 1 }, { sparse: true });

const Document = mongoose.model<IDocument>('Document', DocumentSchema);

export default Document;
