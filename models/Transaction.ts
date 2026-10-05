import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'CREDIT' | 'DEBIT' | 'ADVANCE';

export interface ITransaction extends Document {
  transactionCode: string;
  customerId: mongoose.Types.ObjectId;
  type: TransactionType;
  isAdvance?: boolean;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  amount: number;
  description: string;
  referenceNumber?: string;
  transactionDate: Date;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionCode: {
      type: String,
      required: [true, 'Transaction code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['CREDIT', 'DEBIT', 'ADVANCE'],
        message: '{VALUE} is not a valid transaction type (must be CREDIT, DEBIT, or ADVANCE)',
      },
      required: [true, 'Transaction type is required'],
      index: true,
    },
    isAdvance: {
      type: Boolean,
      default: false,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    productName: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
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

TransactionSchema.index({ customerId: 1, transactionDate: -1 });
TransactionSchema.index({ transactionCode: 1 }, { unique: true });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
