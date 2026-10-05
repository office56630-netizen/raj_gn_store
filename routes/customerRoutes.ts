import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.ts';
import { User } from '../models/User.ts';
import { Transaction } from '../models/Transaction.ts';
import { Notification } from '../models/Notification.ts';
import {
  calculateCustomerBalance,
  calculateCustomerLedger,
  calculateAllCustomersBalances,
} from '../utils/calculations.ts';
import {
  authenticateJWT,
  requireAdmin,
  logAudit,
  AuthenticatedRequest,
} from '../middleware/auth.ts';

const router = Router();

// Helper to verify customer access authorization
function canAccessCustomer(req: AuthenticatedRequest, customerId: string): boolean {
  if (req.user?.role === 'admin' && !req.user.isImpersonating) return true;
  if (req.user?.role === 'customer' || req.user?.isImpersonating) {
    return req.user.customerId?.toString() === customerId;
  }
  return false;
}

// GET /api/customers
// Admin only: List all customers with search, status filter, and calculated balances
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, status, page = 1, limit = 50 } = req.query;

      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { customerCode: searchRegex },
          { city: searchRegex },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [customers, total] = await Promise.all([
        Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Customer.countDocuments(query),
      ]);

      // Calculate balances for all customers
      const balancesMap = await calculateAllCustomersBalances();

      const enrichedCustomers = customers.map((c) => {
        const idStr = (c._id as mongoose.Types.ObjectId).toString();
        const fin = balancesMap[idStr] || { totalCredit: 0, totalDebit: 0, balance: 0, count: 0 };
        return {
          ...c,
          totalCredit: fin.totalCredit,
          totalDebit: fin.totalDebit,
          balance: fin.balance,
          transactionCount: fin.count,
        };
      });

      res.json({
        success: true,
        data: {
          customers: enrichedCustomers,
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
  }
);

// GET /api/customers/:id
// Admin or Authorized Customer: Get customer account profile and financial summary
router.get(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!canAccessCustomer(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You cannot view another customer’s account',
        });
        return;
      }

      const customer = await Customer.findById(id).lean();
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      const [financialSummary, recentTransactions, productsBought, notifications] = await Promise.all([
        calculateCustomerBalance(id),
        Transaction.find({ customerId: id }).sort({ transactionDate: -1, createdAt: -1 }).limit(10).lean(),
        Transaction.distinct('productName', { customerId: id, type: 'CREDIT', productName: { $ne: '' } }),
        Notification.find({
          $or: [{ customerId: id }, { isBroadcast: true }],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

      res.json({
        success: true,
        data: {
          customer,
          financialSummary,
          recentTransactions,
          productsBought,
          notifications,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/customers
// Admin only: Create new customer + create customer portal login account
router.post(
  '/',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, email, phone, address, city, state, pincode, status, customerCode, password } = req.body;

      if (!name || !email || !phone) {
        res.status(400).json({
          success: false,
          message: 'Name, email, and phone number are required',
        });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();

      // Check duplicate email and phone
      const existingCustomer = await Customer.findOne({
        $or: [{ email: cleanEmail }, { phone: cleanPhone }],
      });

      if (existingCustomer) {
        const isEmailDup = existingCustomer.email.toLowerCase() === cleanEmail;
        res.status(409).json({
          success: false,
          message: isEmailDup
            ? 'A customer with this email address already exists'
            : 'A customer with this phone number already exists',
        });
        return;
      }

      // Generate unique customer code if not provided
      let finalCode = customerCode?.trim().toUpperCase();
      if (!finalCode) {
        const count = await Customer.countDocuments();
        finalCode = `CUST-${1000 + count + 1}`;
      }

      const customer = await Customer.create({
        customerCode: finalCode,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        status: status || 'active',
      });

      // Create Customer User login account
      const loginPassword = password || 'Customer@123456';
      const hashedPassword = await bcrypt.hash(loginPassword, 10);

      await User.create({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        password: hashedPassword,
        role: 'customer',
        customerId: customer._id,
        status: 'active',
      });

      await logAudit(
        req,
        'Customer Created',
        `Created customer ${customer.name} (${customer.customerCode}) with portal access`,
        (customer._id as any).toString()
      );

      res.status(201).json({
        success: true,
        message: 'Customer and portal account created successfully',
        data: {
          customer,
          defaultPassword: loginPassword,
        },
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'Customer code, email, or phone number already in use',
        });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PUT /api/customers/:id
// Admin only: Edit customer details
router.put(
  '/:id',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, email, phone, address, city, state, pincode, status } = req.body;

      const customer = await Customer.findById(id);
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      if (email && email.toLowerCase() !== customer.email) {
        const existing = await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
        if (existing) {
          res.status(409).json({ success: false, message: 'Email is already used by another customer' });
          return;
        }
        customer.email = email.trim().toLowerCase();
        // Also update corresponding user email
        await User.updateOne({ customerId: id }, { email: customer.email });
      }

      if (phone && phone !== customer.phone) {
        const existing = await Customer.findOne({ phone: phone.trim(), _id: { $ne: id } });
        if (existing) {
          res.status(409).json({ success: false, message: 'Phone is already used by another customer' });
          return;
        }
        customer.phone = phone.trim();
        await User.updateOne({ customerId: id }, { phone: customer.phone });
      }

      if (name) {
        customer.name = name.trim();
        await User.updateOne({ customerId: id }, { name: customer.name });
      }

      if (address !== undefined) customer.address = address;
      if (city !== undefined) customer.city = city;
      if (state !== undefined) customer.state = state;
      if (pincode !== undefined) customer.pincode = pincode;
      if (status) {
        customer.status = status;
        await User.updateOne({ customerId: id }, { status });
      }

      await customer.save();

      await logAudit(
        req,
        'Customer Updated',
        `Updated customer profile: ${customer.name} (${customer.customerCode})`,
        (customer._id as any).toString()
      );

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/customers/:id
// Admin only: Delete customer and associated user
router.delete(
  '/:id',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await Customer.findById(id);

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      // Check if customer has active transactions
      const txnCount = await Transaction.countDocuments({ customerId: id });
      if (txnCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete customer with ${txnCount} recorded transaction(s). Please delete or archive their transactions first to preserve ledger integrity.`,
        });
        return;
      }

      await Promise.all([
        Customer.findByIdAndDelete(id),
        User.deleteMany({ customerId: id }),
        Notification.deleteMany({ customerId: id }),
      ]);

      await logAudit(
        req,
        'Customer Deleted',
        `Deleted customer record: ${customer.name} (${customer.customerCode})`,
        id
      );

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/customers/:id/ledger
// Complete customer ledger with running balance
router.get(
  '/:id/ledger',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!canAccessCustomer(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You cannot view another customer’s ledger',
        });
        return;
      }

      const customer = await Customer.findById(id).lean();
      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      const ledgerData = await calculateCustomerLedger(id);

      res.json({
        success: true,
        data: {
          customer,
          ...ledgerData,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/customers/:id/balance
router.get(
  '/:id/balance',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!canAccessCustomer(req, id)) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You cannot view another customer’s balance',
        });
        return;
      }

      const summary = await calculateCustomerBalance(id);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
