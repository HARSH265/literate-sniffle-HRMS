import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'department' | 'designation' | 'specificEmployees';
  targetIds?: mongoose.Types.ObjectId[];
  attachments?: { url: string; name: string; size: number }[];
  scheduledAt?: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  readBy: { user: mongoose.Types.ObjectId; readAt: Date }[];
  isActive: boolean;
  notificationsSent: boolean;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'department', 'designation', 'specificEmployees'],
      default: 'all',
    },
    targetIds: [{ type: Schema.Types.ObjectId, refPath: 'targetAudience' }],
    attachments: [
      {
        url: { type: String },
        name: { type: String },
        size: { type: Number },
      },
    ],
    scheduledAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
    notificationsSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AnnouncementSchema.index({ isActive: 1, createdAt: -1 });
AnnouncementSchema.index({ priority: 1, createdAt: -1 });
AnnouncementSchema.index({ scheduledAt: 1 }, { sparse: true });
AnnouncementSchema.index({ expiresAt: 1 }, { sparse: true });

const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
