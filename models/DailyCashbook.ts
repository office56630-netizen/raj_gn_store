import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupplierOutflow {
  _id?: string;
  partyName: string;
  category: 'DISTRIBUTOR' | 'WHOLESALER' | 'DAIRY' | 'BAKERY' | 'EXPENSE' | 'SALARY' | 'OTHER';
  amount: number;
  paymentMode: 'CASH' | 'ONLINE_UPI' | 'CREDIT';
  billNumber?: string;
  description?: string; // what goods purchased, e.g. "50 Milk pouches", "Sugar 2 bags"
  time?: string;
}

export interface IDenominations {
  c500: number;
  c200: number;
  c100: number;
  c50: number;
  c20: number;
  c10: number;
  coin10: number;
  c5: number;
  coin5: number;
  coin2: number;
  coin1: number;
  cCoins: number; // other loose coins if any
  totalCounted: number;
}

export interface IDailyCashbook extends Document {
  date: string; // YYYY-MM-DD
  openingCash: number;
  directSales: number;
  khataCollections: number;
  onlineSales: number;
  otherInflow: number;
  totalInflow: number;
  outflows: ISupplierOutflow[];
  totalOutflow: number;
  totalCashOutflow: number;
  totalOnlineOutflow: number;
  denominations: IDenominations;
  expectedCash: number;
  cashVariance: number;
  closingNotes?: string;
  isClosed: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierOutflowSchema = new Schema<ISupplierOutflow>(
  {
    partyName: {
      type: String,
      required: [true, 'Supplier / Party name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['DISTRIBUTOR', 'WHOLESALER', 'DAIRY', 'BAKERY', 'EXPENSE', 'SALARY', 'OTHER'],
      default: 'DISTRIBUTOR',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'ONLINE_UPI', 'CREDIT'],
      default: 'CASH',
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  },
  { _id: true }
);

const DenominationsSchema = new Schema<IDenominations>(
  {
    c500: { type: Number, default: 0, min: 0 },
    c200: { type: Number, default: 0, min: 0 },
    c100: { type: Number, default: 0, min: 0 },
    c50: { type: Number, default: 0, min: 0 },
    c20: { type: Number, default: 0, min: 0 },
    c10: { type: Number, default: 0, min: 0 },
    coin10: { type: Number, default: 0, min: 0 },
    c5: { type: Number, default: 0, min: 0 },
    coin5: { type: Number, default: 0, min: 0 },
    coin2: { type: Number, default: 0, min: 0 },
    coin1: { type: Number, default: 0, min: 0 },
    cCoins: { type: Number, default: 0, min: 0 },
    totalCounted: { type: Number, default: 0 },
  },
  { _id: false }
);

const DailyCashbookSchema = new Schema<IDailyCashbook>(
  {
    date: {
      type: String,
      required: [true, 'Date in YYYY-MM-DD is required'],
      unique: true,
      trim: true,
    },
    openingCash: {
      type: Number,
      default: 0,
      min: 0,
    },
    directSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    khataCollections: {
      type: Number,
      default: 0,
      min: 0,
    },
    onlineSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherInflow: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalInflow: {
      type: Number,
      default: 0,
    },
    outflows: [SupplierOutflowSchema],
    totalOutflow: {
      type: Number,
      default: 0,
    },
    totalCashOutflow: {
      type: Number,
      default: 0,
    },
    totalOnlineOutflow: {
      type: Number,
      default: 0,
    },
    denominations: {
      type: DenominationsSchema,
      default: () => ({
        c500: 0,
        c200: 0,
        c100: 0,
        c50: 0,
        c20: 0,
        c10: 0,
        coin10: 0,
        c5: 0,
        coin5: 0,
        coin2: 0,
        coin1: 0,
        cCoins: 0,
        totalCounted: 0,
      }),
    },
    expectedCash: {
      type: Number,
      default: 0,
    },
    cashVariance: {
      type: Number,
      default: 0,
    },
    closingNotes: {
      type: String,
      trim: true,
      default: '',
    },
    isClosed: {
      type: Boolean,
      default: false,
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

export const DailyCashbook: Model<IDailyCashbook> =
  mongoose.models.DailyCashbook ||
  mongoose.model<IDailyCashbook>('DailyCashbook', DailyCashbookSchema);
