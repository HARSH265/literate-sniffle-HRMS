import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient: mongoose.Types.ObjectId;
  isRead: boolean;
  module: string;
  link?: string;
}

type NotificationModel = Model<INotification>;

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRead: { type: Boolean, default: false },
    module: { type: String, required: true },
    link: { type: String },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ createdAt: 1 });

const Notification = mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema);

export default Notification;