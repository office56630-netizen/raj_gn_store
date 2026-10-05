import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'General'
  | 'Payment Reminder'
  | 'Credit Update'
  | 'Debit Update'
  | 'Product Update'
  | 'Important'
  | 'System'
  | 'Offer'
  | 'Due Payment';

export type NotificationPriority = 'Normal' | 'Medium' | 'High' | 'Urgent';

export interface INotification extends Document {
  notificationId: string;
  customerId?: mongoose.Types.ObjectId | null;
  isBroadcast: boolean;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'General',
        'Payment Reminder',
        'Credit Update',
        'Debit Update',
        'Product Update',
        'Important',
        'System',
        'Offer',
        'Due Payment',
      ],
      default: 'General',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Medium', 'High', 'Urgent'],
      default: 'Normal',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ customerId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
