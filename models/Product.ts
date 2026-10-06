import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  productCode: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productCode: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
