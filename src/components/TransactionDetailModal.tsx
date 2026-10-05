import React, { useState } from 'react';
import {
  X,
  Receipt,
  CheckCircle,
  Calendar,
  Hash,
  Tag,
  FileText,
  User,
  Printer,
  Edit3,
  Save,
  AlertCircle,
  IndianRupee,
  Clock,
  PiggyBank,
  Check,
} from 'lucide-react';
import { Transaction, Customer, Product, api } from '../services/api.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateSuccess?: (updatedTxn: Transaction) => void;
  isAdmin?: boolean;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onUpdateSuccess,
  isAdmin = true,
}) => {
  const { lang, t } = useLanguage();
  if (!transaction) return null;

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(transaction.amount?.toString() || '0');
  const [type, setType] = useState(transaction.type || 'CREDIT');
  const [description, setDescription] = useState(transaction.description || '');
  const [productName, setProductName] = useState(transaction.productName || '');
  const [referenceNumber, setReferenceNumber] = useState(transaction.referenceNumber || '');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [transactionDate, setTransactionDate] = useState(
    transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : ''
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isCredit = type === 'CREDIT';
  const isAdvance = type === 'ADVANCE';
  const customer = transaction.customerId as Customer;
  const product = transaction.productId as Product;

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया मान्य राशि दर्ज करें (0 से अधिक)'
          : 'Please enter a valid bill amount greater than 0'
      );
      return;
    }

    setSaving(true);
    try {
      const res = await api.transactions.update(transaction._id, {
        amount: numAmount,
        type: type as any,
        description: description.trim(),
        productName: productName.trim(),
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
        transactionDate: transactionDate || undefined,
      });

      setSuccessMsg(
        lang === 'hi'
          ? 'बिल राशि व विवरण सफलतापूर्वक बदल दिया गया!'
          : 'Bill amount and details updated successfully!'
      );
      setIsEditing(false);

      if (onUpdateSuccess) {
        onUpdateSuccess(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col my-auto animate-slide-up sm:animate-none">
        {/* Receipt Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                isCredit
                  ? 'bg-rose-100 text-rose-700'
                  : isAdvance
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAdvance ? <PiggyBank className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'hi' ? 'दुकान बिल पर्ची (Invoice)' : 'Transaction Invoice Receipt'}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 truncate">
                {transaction.transactionCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Edit bill amount"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'राशि सुधारें' : 'Edit Bill'}</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success / Error Message Banner */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* View vs Edit Mode */}
        {!isEditing ? (
          /* READ ONLY RECEIPT VIEW */
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
            {/* Amount Callout - Opposite Colors (Credit=RED, Debit=GREEN, Advance=CYAN) */}
            <div
              className={`text-center py-4 rounded-xl border ${
                isCredit
                  ? 'bg-rose-50/40 border-rose-200'
                  : isAdvance
                  ? 'bg-cyan-50/40 border-cyan-200'
                  : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isCredit
                    ? 'text-rose-800'
                    : isAdvance
                    ? 'text-cyan-800'
                    : 'text-emerald-800'
                }`}
              >
                {isCredit
                  ? lang === 'hi'
                    ? 'उधार दिया (Credit Entry - सामान दिया)'
                    : 'Credit Entry (Purchased on Credit)'
                  : isAdvance
                  ? lang === 'hi'
                    ? 'एडवांस जमा (Advance Deposit)'
                    : 'Advance Deposit'
                  : lang === 'hi'
                  ? 'जमा मिला (Payment Debit - प्राप्त हुआ)'
                  : 'Debit Entry (Payment Settled)'}
              </span>

              <div
                className={`text-3xl font-extrabold font-mono tabular-nums mt-1 ${
                  isCredit
                    ? 'text-rose-700'
                    : isAdvance
                    ? 'text-cyan-700'
                    : 'text-emerald-700'
                }`}
              >
                {isCredit ? '+ ' : isAdvance ? '★ ' : '- '}
                {formatCurrency(transaction.amount)}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                {new Date(transaction.transactionDate).toLocaleDateString()}
              </span>
            </div>

            {/* Key-Value Details List */}
            <div className="space-y-2.5 divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">
                  {lang === 'hi' ? 'ग्राहक खाता' : 'Customer Account'}
                </span>
                <span className="font-semibold text-slate-900 text-right">
                  {customer?.name || 'Customer'}
                  {customer?.customerCode && (
                    <span className="font-mono text-slate-500 block text-[11px]">
                      {customer.customerCode} · {customer?.phone}
                    </span>
                  )}
                </span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">{lang === 'hi' ? 'सामान / विवरण' : 'Item / Description'}</span>
                <span className="font-semibold text-slate-900 text-right">
                  {transaction.productName || product?.name || transaction.description}
                </span>
              </div>

              {transaction.description && transaction.description !== transaction.productName && (
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">{lang === 'hi' ? 'विवरण' : 'Details'}</span>
                  <span className="text-slate-800 text-right max-w-[200px] font-medium">
                    {transaction.description}
                  </span>
                </div>
              )}

              {transaction.referenceNumber && (
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">
                    {lang === 'hi' ? 'रिफरेंस / बिल #' : 'Invoice / Ref #'}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 text-right">
                    {transaction.referenceNumber}
                  </span>
                </div>
              )}

              {transaction.notes && (
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">{lang === 'hi' ? 'नोट्स' : 'Notes'}</span>
                  <span className="text-slate-600 text-right max-w-[200px] italic">
                    {transaction.notes}
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">{lang === 'hi' ? 'दर्ज तारीख' : 'Created At'}</span>
                <span className="font-mono text-slate-500 text-right text-[11px]">
                  {new Date(transaction.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'बिल राशि बदलें (Edit)' : 'Edit Bill Amount'}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer ml-auto"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* EDIT BILL AMOUNT FORM */
          <form onSubmit={handleSaveBill} className="p-5 sm:p-6 space-y-3.5 text-xs overflow-y-auto">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {lang === 'hi'
                  ? 'बिल राशि या विवरण बदलने पर ग्राहक का खाता बही स्वतः अपडेट हो जाएगा।'
                  : 'Editing the bill amount will automatically recalculate the customer balance.'}
              </span>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'लेनदेन का प्रकार (Type)' : 'Transaction Type'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('CREDIT')}
                  className={`min-h-[38px] rounded-lg font-bold transition-all cursor-pointer ${
                    type === 'CREDIT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  उधार (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setType('DEBIT')}
                  className={`min-h-[38px] rounded-lg font-bold transition-all cursor-pointer ${
                    type === 'DEBIT' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  जमा (Debit)
                </button>
                <button
                  type="button"
                  onClick={() => setType('ADVANCE')}
                  className={`min-h-[38px] rounded-lg font-bold transition-all cursor-pointer ${
                    type === 'ADVANCE' ? 'bg-cyan-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  एडवांस (Advance)
                </button>
              </div>
            </div>

            {/* Bill Amount in ₹ */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'बिल राशि (Bill Amount in ₹)' : 'Bill Amount (₹)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-5 h-5 text-slate-700" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full min-h-[46px] pl-10 pr-3 font-bold font-mono text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'सामान / विवरण (Description)' : 'Item / Description'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[42px] border border-slate-300 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'रिफरेंस / पर्ची नंबर' : 'Reference / Bill #'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full min-h-[42px] border border-slate-300 rounded-xl px-3 py-2 font-mono bg-white"
              />
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'तारीख (Date)' : 'Transaction Date'}
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full min-h-[42px] border border-slate-300 rounded-xl px-3 py-2 font-mono bg-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'hi' ? 'नोट्स (Optional Notes)' : 'Notes'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[42px] border border-slate-300 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[42px]"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? lang === 'hi'
                      ? 'सुरक्षित हो रहा है...'
                      : 'Saving...'
                    : lang === 'hi'
                    ? 'बिल राशि अपडेट करें'
                    : 'Save Bill Amount'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
