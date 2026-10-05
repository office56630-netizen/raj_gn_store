import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.ts';
import { Product } from '../models/Product.ts';
import { Transaction } from '../models/Transaction.ts';
import { calculateAllCustomersBalances } from '../utils/calculations.ts';
import { authenticateJWT, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/reports/dashboard-stats
// Main overview statistics for Admin Dashboard
router.get(
  '/dashboard-stats',
  authenticateJWT,
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Start of today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [
        totalCustomers,
        totalProducts,
        totalTransactions,
        creditDebitTotals,
        todayTotals,
        monthlyTrendsRaw,
        recentTransactions,
      ] = await Promise.all([
        Customer.countDocuments({ status: 'active' }),
        Product.countDocuments({ status: 'active' }),
        Transaction.countDocuments(),
        // Overall credit & debit totals
        Transaction.aggregate([
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
            },
          },
        ]),
        // Today's credit & debit
        Transaction.aggregate([
          {
            $match: {
              transactionDate: { $gte: startOfToday },
            },
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
            },
          },
        ]),
        // Monthly breakdown for last 6 months
        Transaction.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$transactionDate' },
                month: { $month: '$transactionDate' },
                type: '$type',
              },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        // Recent 6 transactions
        Transaction.find()
          .populate('customerId', 'name customerCode')
          .sort({ transactionDate: -1, createdAt: -1 })
          .limit(6)
          .lean(),
      ]);

      let totalCredit = 0;
      let totalDebit = 0;
      let totalAdvance = 0;
      for (const item of creditDebitTotals) {
        if (item._id === 'CREDIT') totalCredit = Math.round(item.total * 100) / 100;
        if (item._id === 'DEBIT') totalDebit = Math.round(item.total * 100) / 100;
        if (item._id === 'ADVANCE') totalAdvance = Math.round(item.total * 100) / 100;
      }
      const totalOutstanding = Math.round((totalCredit - (totalDebit + totalAdvance)) * 100) / 100;

      let todayCredit = 0;
      let todayDebit = 0;
      let todayAdvance = 0;
      for (const item of todayTotals) {
        if (item._id === 'CREDIT') todayCredit = Math.round(item.total * 100) / 100;
        if (item._id === 'DEBIT') todayDebit = Math.round(item.total * 100) / 100;
        if (item._id === 'ADVANCE') todayAdvance = Math.round(item.total * 100) / 100;
      }

      // Customer outstanding balances
      const balancesMap = await calculateAllCustomersBalances();
      const customers = await Customer.find().lean();

      const customerBalances = customers
        .map((c) => {
          const id = (c._id as mongoose.Types.ObjectId).toString();
          const fin = balancesMap[id] || { totalCredit: 0, totalDebit: 0, balance: 0, count: 0 };
          return {
            id,
            name: c.name,
            customerCode: c.customerCode,
            phone: c.phone,
            email: c.email,
            balance: fin.balance,
            totalCredit: fin.totalCredit,
            totalDebit: fin.totalDebit,
          };
        })
        .sort((a, b) => b.balance - a.balance);

      // Format monthly trends
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap: Record<string, { month: string; credit: number; debit: number }> = {};

      for (const item of monthlyTrendsRaw) {
        const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        const label = `${months[item._id.month - 1]} ${item._id.year}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = { month: label, credit: 0, debit: 0 };
        }
        if (item._id.type === 'CREDIT') {
          monthlyMap[key].credit += Math.round(item.total);
        } else if (item._id.type === 'DEBIT') {
          monthlyMap[key].debit += Math.round(item.total);
        }
      }

      const monthlyTrends = Object.values(monthlyMap);

      res.json({
        success: true,
        data: {
          metrics: {
            totalCustomers,
            totalCredit,
            totalDebit,
            totalAdvance,
            totalOutstanding,
            totalTransactions,
            totalProducts,
            todayCredit,
            todayDebit,
            todayAdvance,
          },
          monthlyTrends,
          topOutstandingCustomers: customerBalances.slice(0, 5),
          recentTransactions,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/reports/customers
// Detailed Customer Financial Balances Report
router.get(
  '/customers',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, balanceStatus } = req.query;

      const query: any = {};
      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { customerCode: regex }, { phone: regex }, { email: regex }];
      }

      const customers = await Customer.find(query).sort({ name: 1 }).lean();
      const balancesMap = await calculateAllCustomersBalances();

      let reportData = customers.map((c) => {
        const id = (c._id as mongoose.Types.ObjectId).toString();
        const fin = balancesMap[id] || { totalCredit: 0, totalDebit: 0, balance: 0, count: 0 };
        return {
          id,
          customerCode: c.customerCode,
          name: c.name,
          email: c.email,
          phone: c.phone,
          city: c.city || 'N/A',
          status: c.status,
          totalCredit: fin.totalCredit,
          totalDebit: fin.totalDebit,
          balance: fin.balance,
          transactionCount: fin.count,
        };
      });

      if (balanceStatus === 'outstanding') {
        reportData = reportData.filter((r) => r.balance > 0);
      } else if (balanceStatus === 'settled') {
        reportData = reportData.filter((r) => r.balance === 0);
      } else if (balanceStatus === 'credit_advance') {
        reportData = reportData.filter((r) => r.balance < 0);
      }

      res.json({
        success: true,
        data: reportData,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/reports/transactions
// Filterable Transaction Audit Report
router.get(
  '/transactions',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, customerId, type, productId } = req.query;

      const query: any = {};
      if (customerId && customerId !== 'all') {
        query.customerId = new mongoose.Types.ObjectId(customerId as string);
      }
      if (type && type !== 'all') {
        query.type = (type as string).toUpperCase();
      }
      if (productId && productId !== 'all') {
        query.productId = new mongoose.Types.ObjectId(productId as string);
      }
      if (startDate || endDate) {
        query.transactionDate = {};
        if (startDate) query.transactionDate.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.transactionDate.$lte = end;
        }
      }

      const transactions = await Transaction.find(query)
        .populate('customerId', 'name customerCode phone email')
        .populate('productId', 'name productCode category')
        .sort({ transactionDate: -1, createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/reports/products
// Product Performance & Financial Volume Report
router.get(
  '/products',
  authenticateJWT,
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const products = await Product.find().lean();

      // Aggregate transaction totals per product
      const productStats = await Transaction.aggregate([
        { $match: { productId: { $ne: null } } },
        {
          $group: {
            _id: { productId: '$productId', type: '$type' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]);

      const statsMap: Record<string, { totalCredit: number; totalDebit: number; totalCount: number }> = {};
      for (const stat of productStats) {
        const prodId = stat._id.productId.toString();
        if (!statsMap[prodId]) {
          statsMap[prodId] = { totalCredit: 0, totalDebit: 0, totalCount: 0 };
        }
        if (stat._id.type === 'CREDIT') {
          statsMap[prodId].totalCredit += stat.totalAmount;
        } else {
          statsMap[prodId].totalDebit += stat.totalAmount;
        }
        statsMap[prodId].totalCount += stat.count;
      }

      const report = products.map((p) => {
        const id = (p._id as mongoose.Types.ObjectId).toString();
        const stat = statsMap[id] || { totalCredit: 0, totalDebit: 0, totalCount: 0 };
        return {
          id,
          productCode: p.productCode,
          name: p.name,
          category: p.category,
          price: p.price,
          status: p.status,
          totalTransactions: stat.totalCount,
          totalCredit: stat.totalCredit,
          totalDebit: stat.totalDebit,
        };
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
