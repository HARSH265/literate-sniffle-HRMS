import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketId: string;
  subject: string;
  description: string;
  category: 'it' | 'hr' | 'facilities' | 'payroll' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  requestedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  comments: {
    user: mongoose.Types.ObjectId;
    message: string;
    attachments?: { url: string; name: string; size: number }[];
    createdAt: Date;
  }[];
  attachments?: { url: string; name: string; size: number }[];
  resolvedAt?: Date;
  closedAt?: Date;
  slaDeadline?: Date;
  slaBreached: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  attachments: [{
    url: { type: String },
    name: { type: String },
    size: { type: Number },
  }],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: { type: String, unique: true, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['it', 'hr', 'facilities', 'payroll', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: [CommentSchema],
    attachments: [{
      url: { type: String },
      name: { type: String },
      size: { type: Number },
    }],
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    slaDeadline: { type: Date },
    slaBreached: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ priority: 1, createdAt: -1 });
TicketSchema.index({ requestedBy: 1, createdAt: -1 });
TicketSchema.index({ assignedTo: 1, createdAt: -1 });
const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
export default Ticket;
