import { Router, Response } from 'express';
import { DailyCashbook } from '../models/DailyCashbook.ts';
import { Transaction } from '../models/Transaction.ts';
import { authenticateJWT, requireAdmin, logAudit, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Helper to compute cash totals
function calculateCashbookTotals(data: any) {
  const openingCash = Number(data.openingCash) || 0;
  const directSales = Number(data.directSales) || 0;
  const khataCollections = Number(data.khataCollections) || 0;
  const onlineSales = Number(data.onlineSales) || 0;
  const otherInflow = Number(data.otherInflow) || 0;

  const totalInflow = directSales + khataCollections + onlineSales + otherInflow;

  const outflows = Array.isArray(data.outflows) ? data.outflows : [];
  let totalOutflow = 0;
  let totalCashOutflow = 0;
  let totalOnlineOutflow = 0;

  for (const item of outflows) {
    const amt = Number(item.amount) || 0;
    totalOutflow += amt;
    if (item.paymentMode === 'ONLINE_UPI') {
      totalOnlineOutflow += amt;
    } else if (item.paymentMode === 'CASH') {
      totalCashOutflow += amt;
    }
  }

  // Physical cash expected in Galla drawer = Opening Cash + Cash Inflows (direct cash sales + khata cash collections + other cash) - Cash Outflows
  // Note: online sales do not enter physical cash drawer
  const expectedCash = openingCash + directSales + khataCollections + otherInflow - totalCashOutflow;

  const d = data.denominations || {};
  const c500 = Number(d.c500) || 0;
  const c200 = Number(d.c200) || 0;
  const c100 = Number(d.c100) || 0;
  const c50 = Number(d.c50) || 0;
  const c20 = Number(d.c20) || 0;
  const c10 = Number(d.c10) || 0;
  const coin10 = Number(d.coin10) || 0;
  const c5 = Number(d.c5) || 0;
  const coin5 = Number(d.coin5) || 0;
  const coin2 = Number(d.coin2) || 0;
  const coin1 = Number(d.coin1) || 0;
  const cCoins = Number(d.cCoins) || 0;

  const totalCounted =
    c500 * 500 +
    c200 * 200 +
    c100 * 100 +
    c50 * 50 +
    c20 * 20 +
    c10 * 10 +
    coin10 * 10 +
    c5 * 5 +
    coin5 * 5 +
    coin2 * 2 +
    coin1 * 1 +
    cCoins;

  const cashVariance = totalCounted - expectedCash;

  return {
    openingCash,
    directSales,
    khataCollections,
    onlineSales,
    otherInflow,
    totalInflow,
    outflows,
    totalOutflow,
    totalCashOutflow,
    totalOnlineOutflow,
    expectedCash,
    denominations: {
      c500,
      c200,
      c100,
      c50,
      c20,
      c10,
      coin10,
      c5,
      coin5,
      coin2,
      coin1,
      cCoins,
      totalCounted,
    },
    cashVariance,
  };
}

// GET /api/cashbook/day/:date - Get cashbook for specific day
router.get(
  '/day/:date',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date } = req.params; // YYYY-MM-DD format

      // 1. Fetch cashbook record if exists
      let record = await DailyCashbook.findOne({ date });

      // 2. Aggregate actual customer khata cash collections recorded on this date
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      const khataTxns = await Transaction.find({
        transactionDate: { $gte: startOfDay, $lte: endOfDay },
        type: 'DEBIT', // Customer payments / जमा
      });

      const automatedKhataCollected = khataTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

      if (!record) {
        // If no record exists for this date, look up previous day's counted cash or expected cash as suggested opening balance
        const prevRecord = await DailyCashbook.findOne({ date: { $lt: date } }).sort({ date: -1 });
        const suggestedOpening = prevRecord
          ? (prevRecord.denominations?.totalCounted || prevRecord.expectedCash || 0)
          : 0;

        res.json({
          success: true,
          data: {
            date,
            openingCash: suggestedOpening,
            directSales: 0,
            khataCollections: automatedKhataCollected,
            onlineSales: 0,
            otherInflow: 0,
            totalInflow: automatedKhataCollected,
            outflows: [],
            totalOutflow: 0,
            totalCashOutflow: 0,
            totalOnlineOutflow: 0,
            denominations: {
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
            },
            expectedCash: suggestedOpening + automatedKhataCollected,
            cashVariance: -(suggestedOpening + automatedKhataCollected),
            closingNotes: '',
            isClosed: false,
            isNewDay: true,
            automatedKhataCollected,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...record.toObject(),
          isNewDay: false,
          automatedKhataCollected,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/cashbook/day/:date - Upsert daily cashbook
router.post(
  '/day/:date',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const {
        openingCash,
        directSales,
        khataCollections,
        onlineSales,
        otherInflow,
        outflows,
        denominations,
        closingNotes,
        isClosed,
      } = req.body;

      const computed = calculateCashbookTotals({
        openingCash,
        directSales,
        khataCollections,
        onlineSales,
        otherInflow,
        outflows,
        denominations,
      });

      const updated = await DailyCashbook.findOneAndUpdate(
        { date },
        {
          date,
          ...computed,
          closingNotes: closingNotes || '',
          isClosed: !!isClosed,
          createdBy: req.user?._id,
        },
        { new: true, upsert: true, runValidators: true }
      );

      await logAudit(
        req,
        'Daily Cashbook Updated',
        `Cashbook for date ${date} updated. Sales: ₹${computed.directSales}, Outflows: ₹${computed.totalOutflow}, Counted Cash: ₹${computed.denominations.totalCounted}`,
        (updated._id as any).toString()
      );

      res.json({
        success: true,
        message: 'दैनिक रोकड़ बही सफलतापूर्वक सुरक्षित की गई (Cashbook saved successfully)',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/cashbook/day/:date/outflow - Quick add single outflow entry
router.post(
  '/day/:date/outflow',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const { partyName, category, amount, paymentMode, billNumber, description } = req.body;

      if (!partyName || !amount) {
        res.status(400).json({
          success: false,
          message: 'सप्लायर का नाम और राशि आवश्यक है (Supplier name and amount are required)',
        });
        return;
      }

      let cashbook = await DailyCashbook.findOne({ date });
      if (!cashbook) {
        cashbook = new DailyCashbook({
          date,
          openingCash: 0,
          directSales: 0,
          khataCollections: 0,
          onlineSales: 0,
          otherInflow: 0,
          outflows: [],
        });
      }

      cashbook.outflows.push({
        partyName: partyName.trim(),
        category: category || 'DISTRIBUTOR',
        amount: Number(amount),
        paymentMode: paymentMode || 'CASH',
        billNumber: (billNumber || '').trim(),
        description: (description || '').trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });

      // Recalculate totals
      const computed = calculateCashbookTotals(cashbook.toObject());
      Object.assign(cashbook, computed);
      await cashbook.save();

      await logAudit(
        req,
        'Supplier Outflow Added',
        `Paid ₹${amount} to ${partyName} (${category}) on ${date}`,
        (cashbook._id as any).toString()
      );

      res.status(201).json({
        success: true,
        message: 'भुगतान प्रविष्टि जोड़ी गई (Expense entry added)',
        data: cashbook,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/cashbook/day/:date/outflow/:outflowId - Remove single outflow entry
router.delete(
  '/day/:date/outflow/:outflowId',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { date, outflowId } = req.params;

      const cashbook = await DailyCashbook.findOne({ date });
      if (!cashbook) {
        res.status(404).json({ success: false, message: 'Cashbook record not found' });
        return;
      }

      cashbook.outflows = cashbook.outflows.filter((o: any) => o._id?.toString() !== outflowId);

      const computed = calculateCashbookTotals(cashbook.toObject());
      Object.assign(cashbook, computed);
      await cashbook.save();

      res.json({
        success: true,
        message: 'प्रविष्टि हटा दी गई (Expense entry removed)',
        data: cashbook,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/cashbook/history - List recent cashbook entries
router.get(
  '/history',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 30;
      const records = await DailyCashbook.find().sort({ date: -1 }).limit(limit);

      // Compute aggregate stats across records
      const totalSalesAll = records.reduce((sum, r) => sum + (r.directSales || 0) + (r.onlineSales || 0), 0);
      const totalOutflowsAll = records.reduce((sum, r) => sum + (r.totalOutflow || 0), 0);
      const totalCashVariance = records.reduce((sum, r) => sum + (r.cashVariance || 0), 0);

      res.json({
        success: true,
        data: {
          records,
          summary: {
            totalDays: records.length,
            totalSalesAll,
            totalOutflowsAll,
            netCashDifference: totalCashVariance,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/cashbook/supplier-suggestions - Common supplier names used before
router.get(
  '/supplier-suggestions',
  authenticateJWT,
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const distinctParties = await DailyCashbook.aggregate([
        { $unwind: '$outflows' },
        {
          $group: {
            _id: { partyName: '$outflows.partyName', category: '$outflows.category' },
            count: { $sum: 1 },
            lastUsed: { $max: '$date' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]);

      const suggestions = distinctParties.map((p) => ({
        partyName: p._id.partyName,
        category: p._id.category,
      }));

      res.json({ success: true, data: suggestions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
