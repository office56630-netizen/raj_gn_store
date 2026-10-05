import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.ts';

export interface CustomerFinancialSummary {
  totalCredit: number;
  totalDebit: number;
  totalAdvance: number;
  balance: number;
  transactionCount: number;
}

export interface LedgerEntry {
  _id: string;
  transactionCode: string;
  transactionDate: Date;
  type: 'CREDIT' | 'DEBIT' | 'ADVANCE';
  isAdvance?: boolean;
  productId?: string;
  productName: string;
  description: string;
  referenceNumber: string;
  notes: string;
  amount: number;
  creditAmount: number | null;
  debitAmount: number | null;
  advanceAmount: number | null;
  runningBalance: number;
}

/**
 * Calculates financial balance for a specific customer directly from transactions
 */
export async function calculateCustomerBalance(
  customerId: string | mongoose.Types.ObjectId
): Promise<CustomerFinancialSummary> {
  const custId = typeof customerId === 'string' ? new mongoose.Types.ObjectId(customerId) : customerId;

  const summary = await Transaction.aggregate([
    { $match: { customerId: custId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalCredit = 0;
  let totalDebit = 0;
  let totalAdvance = 0;
  let transactionCount = 0;

  for (const item of summary) {
    if (item._id === 'CREDIT') {
      totalCredit = Math.round(item.total * 100) / 100;
    } else if (item._id === 'DEBIT') {
      totalDebit = Math.round(item.total * 100) / 100;
    } else if (item._id === 'ADVANCE') {
      totalAdvance = Math.round(item.total * 100) / 100;
    }
    transactionCount += item.count;
  }

  // Balance = Total Credit - (Total Debit + Total Advance)
  const balance = Math.round((totalCredit - (totalDebit + totalAdvance)) * 100) / 100;

  return {
    totalCredit,
    totalDebit,
    totalAdvance,
    balance,
    transactionCount,
  };
}

/**
 * Generates an audit-grade chronological ledger with running balance
 */
export async function calculateCustomerLedger(
  customerId: string | mongoose.Types.ObjectId
): Promise<{
  summary: CustomerFinancialSummary;
  entries: LedgerEntry[];
}> {
  const custId = typeof customerId === 'string' ? new mongoose.Types.ObjectId(customerId) : customerId;

  // Sort ascending by transactionDate, then createdAt
  const txns = await Transaction.find({ customerId: custId })
    .sort({ transactionDate: 1, createdAt: 1 })
    .lean();

  let runningBalance = 0;
  let totalCredit = 0;
  let totalDebit = 0;
  let totalAdvance = 0;

  const entries: LedgerEntry[] = txns.map((t: any) => {
    const isCredit = t.type === 'CREDIT';
    const isAdvance = t.type === 'ADVANCE' || Boolean(t.isAdvance);
    const amount = Number(t.amount);

    if (isCredit) {
      runningBalance += amount;
      totalCredit += amount;
    } else if (isAdvance) {
      runningBalance -= amount;
      totalAdvance += amount;
    } else {
      runningBalance -= amount;
      totalDebit += amount;
    }

    runningBalance = Math.round(runningBalance * 100) / 100;

    let defaultName = 'पेमेंट जमा';
    if (isCredit) defaultName = 'उधार सामान';
    if (isAdvance) defaultName = 'एडवांस जमा';

    return {
      _id: (t._id as mongoose.Types.ObjectId).toString(),
      transactionCode: t.transactionCode,
      transactionDate: t.transactionDate,
      type: t.type,
      isAdvance,
      productId: t.productId ? t.productId.toString() : undefined,
      productName: t.productName || defaultName,
      description: t.description || '',
      referenceNumber: t.referenceNumber || '',
      notes: t.notes || '',
      amount: amount,
      creditAmount: isCredit ? amount : null,
      debitAmount: !isCredit && !isAdvance ? amount : null,
      advanceAmount: isAdvance ? amount : null,
      runningBalance,
    };
  });

  totalCredit = Math.round(totalCredit * 100) / 100;
  totalDebit = Math.round(totalDebit * 100) / 100;
  totalAdvance = Math.round(totalAdvance * 100) / 100;
  const balance = Math.round((totalCredit - (totalDebit + totalAdvance)) * 100) / 100;

  return {
    summary: {
      totalCredit,
      totalDebit,
      totalAdvance,
      balance,
      transactionCount: txns.length,
    },
    entries,
  };
}

/**
 * Calculates aggregate balances for all customers efficiently via MongoDB aggregation
 */
export async function calculateAllCustomersBalances(): Promise<
  Record<string, { totalCredit: number; totalDebit: number; totalAdvance: number; balance: number; count: number }>
> {
  const aggregated = await Transaction.aggregate([
    {
      $group: {
        _id: { customerId: '$customerId', type: '$type' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const map: Record<string, { totalCredit: number; totalDebit: number; totalAdvance: number; balance: number; count: number }> = {};

  for (const row of aggregated) {
    const custId = row._id.customerId.toString();
    if (!map[custId]) {
      map[custId] = { totalCredit: 0, totalDebit: 0, totalAdvance: 0, balance: 0, count: 0 };
    }

    if (row._id.type === 'CREDIT') {
      map[custId].totalCredit = Math.round(row.totalAmount * 100) / 100;
    } else if (row._id.type === 'DEBIT') {
      map[custId].totalDebit = Math.round(row.totalAmount * 100) / 100;
    } else if (row._id.type === 'ADVANCE') {
      map[custId].totalAdvance = Math.round(row.totalAmount * 100) / 100;
    }
    map[custId].count += row.count;
  }

  for (const custId in map) {
    map[custId].balance =
      Math.round((map[custId].totalCredit - (map[custId].totalDebit + map[custId].totalAdvance)) * 100) / 100;
  }

  return map;
}
