import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'registration' | 'approval' | 'event_update' | 'reminder' | 'rating';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    required: true,
    enum: ['registration', 'approval', 'event_update', 'reminder', 'rating']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);