import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.ts';
import { Customer } from '../models/Customer.ts';
import { Product } from '../models/Product.ts';
import { Notification } from '../models/Notification.ts';
import {
  authenticateJWT,
  requireAdmin,
  logAudit,
  AuthenticatedRequest,
} from '../middleware/auth.ts';

const router = Router();

// GET /api/transactions
// Filter by search, date range, customer, type (CREDIT/DEBIT), product, amount
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      customerId,
      type,
      productId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 50,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    // Customer security enforcement: Customers can ONLY see their own transactions!
    if (req.user?.role === 'customer' || req.user?.isImpersonating) {
      if (!req.user.customerId) {
        res.status(403).json({ success: false, message: 'No customer account linked to user' });
        return;
      }
      query.customerId = new mongoose.Types.ObjectId(req.user.customerId);
    } else if (customerId && customerId !== 'all') {
      query.customerId = new mongoose.Types.ObjectId(customerId as string);
    }

    if (type && type !== 'all') {
      query.type = (type as string).toUpperCase();
    }

    if (productId && productId !== 'all') {
      query.productId = new mongoose.Types.ObjectId(productId as string);
    }

    // Date range filtering
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    // Amount filtering
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Search query on description, referenceNumber, transactionCode, productName
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { transactionCode: searchRegex },
        { description: searchRegex },
        { referenceNumber: searchRegex },
        { productName: searchRegex },
        { notes: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {
      [sortBy as string]: sortOrder === 'asc' ? 1 : -1,
      createdAt: -1,
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('customerId', 'name customerCode email phone')
        .populate('productId', 'name productCode category price')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customerId', 'name customerCode email phone address city')
      .populate('productId', 'name productCode category price')
      .populate('createdBy', 'name email role')
      .lean();

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    // Customer security check
    if (req.user?.role === 'customer' || req.user?.isImpersonating) {
      const custId = (transaction.customerId as any)?._id?.toString() || transaction.customerId?.toString();
      if (custId !== req.user.customerId?.toString()) {
        res.status(403).json({ success: false, message: 'Access denied: Not your transaction' });
        return;
      }
    }

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transactions
// Admin only: Record Credit or Debit transaction
router.post('/', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      type,
      productId,
      productName,
      amount,
      description,
      referenceNumber,
      transactionDate,
      notes,
      transactionCode,
    } = req.body;

    if (!customerId || !type || amount === undefined || amount === null) {
      res.status(400).json({
        success: false,
        message: 'Customer, transaction type (CREDIT/DEBIT), and amount are required',
      });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Transaction amount must be a positive number greater than zero',
      });
      return;
    }

    const upperType = type.toUpperCase();
    if (upperType !== 'CREDIT' && upperType !== 'DEBIT' && upperType !== 'ADVANCE') {
      res.status(400).json({
        success: false,
        message: 'Transaction type must be CREDIT, DEBIT, or ADVANCE',
      });
      return;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    let finalProductName = productName?.trim() || '';
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        if (!finalProductName) finalProductName = product.name;
      }
    }

    // Auto-generate transaction code if missing
    let finalCode = transactionCode?.trim().toUpperCase();
    if (!finalCode) {
      const count = await Transaction.countDocuments();
      finalCode = `TXN-${1000 + count + 1}`;
    }

    const isAdvance = upperType === 'ADVANCE' || Boolean(req.body.isAdvance);

    let defaultDesc = 'Payment Received';
    if (upperType === 'CREDIT') defaultDesc = 'Goods/Services Credit';
    if (upperType === 'ADVANCE') defaultDesc = 'एडवांस जमा (Advance Deposit)';

    const transaction = new Transaction({
      transactionCode: finalCode,
      customerId: customer._id,
      type: upperType,
      isAdvance,
      productId: productId ? new mongoose.Types.ObjectId(productId) : undefined,
      productName: finalProductName,
      amount: numAmount,
      description: description?.trim() || defaultDesc,
      referenceNumber: referenceNumber?.trim() || '',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      notes: notes?.trim() || '',
      createdBy: req.user?._id ? (req.user._id as any) : undefined,
    });
    await transaction.save();

    // Automated Notification Creation for Customer
    const formattedAmount = `₹${numAmount.toLocaleString('en-IN')}`;
    let notifTitle = 'Debit Recorded';
    if (upperType === 'CREDIT') notifTitle = 'Credit Added';
    if (upperType === 'ADVANCE') notifTitle = 'Advance Received';

    let notifMessage = `Payment/Debit of ${formattedAmount} has been recorded against your account (Ref: ${transaction.referenceNumber || 'Cash/Direct'}).`;
    if (upperType === 'CREDIT') {
      notifMessage = `${formattedAmount} credit has been added to your account for ${finalProductName || transaction.description}.`;
    } else if (upperType === 'ADVANCE') {
      notifMessage = `Advance payment of ${formattedAmount} has been credited to your account.`;
    }

    const notifCount = await Notification.countDocuments();
    await Notification.create({
      notificationId: `NOTIF-${200 + notifCount + 1}`,
      customerId: customer._id,
      isBroadcast: false,
      type: upperType === 'CREDIT' ? 'Credit Update' : 'Debit Update',
      title: notifTitle,
      message: notifMessage,
      priority: 'Normal',
      isRead: false,
      createdBy: req.user?._id ? (req.user._id as any) : undefined,
    });

    // Audit Log
    await logAudit(
      req,
      upperType === 'CREDIT' ? 'Credit Added' : 'Debit Added',
      `${upperType} of ${formattedAmount} recorded for ${customer.name} (${customer.customerCode}) - ${transaction.description}`,
      transaction.transactionCode
    );

    res.status(201).json({
      success: true,
      message: `${upperType} transaction recorded successfully`,
      data: transaction,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Transaction code is already in use' });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/transactions/:id
// Admin only: Edit transaction
router.put('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      amount,
      type,
      description,
      referenceNumber,
      transactionDate,
      notes,
      productId,
      productName,
    } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const previousData = {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
    };

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
        return;
      }
      transaction.amount = numAmount;
    }

    if (type) {
      const upperType = type.toUpperCase();
      if (upperType !== 'CREDIT' && upperType !== 'DEBIT' && upperType !== 'ADVANCE') {
        res.status(400).json({ success: false, message: 'Type must be CREDIT, DEBIT, or ADVANCE' });
        return;
      }
      transaction.type = upperType;
      transaction.isAdvance = upperType === 'ADVANCE';
    }

    if (description) transaction.description = description.trim();
    if (referenceNumber !== undefined) transaction.referenceNumber = referenceNumber.trim();
    if (notes !== undefined) transaction.notes = notes.trim();
    if (transactionDate) transaction.transactionDate = new Date(transactionDate);
    if (productId !== undefined) {
      transaction.productId = productId ? new mongoose.Types.ObjectId(productId) : undefined;
    }
    if (productName !== undefined) transaction.productName = productName.trim();

    await transaction.save();

    await logAudit(
      req,
      'Transaction Edited',
      `Edited transaction ${transaction.transactionCode}: Amount changed from ₹${previousData.amount} (${previousData.type}) to ₹${transaction.amount} (${transaction.type})`,
      transaction.transactionCode
    );

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/transactions/:id
// Admin only: Delete transaction
router.delete('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const code = transaction.transactionCode;
    const details = `${transaction.type} of ₹${transaction.amount} for customer ${transaction.customerId}`;

    await Transaction.findByIdAndDelete(id);

    await logAudit(
      req,
      'Transaction Deleted',
      `Deleted transaction ${code}: ${details}`,
      code
    );

    res.json({
      success: true,
      message: 'Transaction deleted successfully. Customer balance recalculated.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
