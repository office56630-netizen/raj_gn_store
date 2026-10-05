import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Phone,
  Printer,
  Calendar,
  CreditCard,
  MessageCircle,
  PiggyBank,
} from 'lucide-react';
import { Customer, api } from '../services/api.ts';

interface CustomerAccountViewModalProps {
  customer: Customer | null;
  onClose: () => void;
  onAddCredit: (customerId: string) => void;
  onAddDebit: (customerId: string) => void;
  onAddAdvance?: (customerId: string) => void;
  onSendNotification: (customer: Customer) => void;
  onImpersonate: (customer: Customer) => void;
}

export const CustomerAccountViewModal: React.FC<CustomerAccountViewModalProps> = ({
  customer,
  onClose,
  onAddCredit,
  onAddDebit,
  onAddAdvance,
  onSendNotification,
  onImpersonate,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const [accountRes, ledgerRes] = await Promise.all([
          api.customers.getById(customer._id),
          api.customers.getLedger(customer._id),
        ]);
        setData({
          ...accountRes.data,
          ledgerEntries: ledgerRes.data.entries,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountData();
  }, [customer]);

  if (!customer) return null;

  const summary = data?.financialSummary || { totalCredit: 0, totalDebit: 0, totalAdvance: 0, balance: 0 };

  const sendWhatsAppReminder = () => {
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `नमस्ते ${customer.name} जी,\nआपके किराना स्टोर खाते में बाकी राशि ₹${(summary.balance || 0).toLocaleString(
        'en-IN'
      )} है। कृपया समय मिलने पर जमा करवा दें। धन्यवाद! - किराना स्टोर`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const formatCurrency = (val?: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{customer.name}</h3>
                <span className="font-mono text-[10px] text-slate-700 bg-slate-200 px-2 py-0.2 rounded font-bold">
                  {customer.customerCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{customer.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={sendWhatsAppReminder}
              className="min-h-[40px] px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">तगादा</span>
            </button>

            <button
              onClick={handlePrint}
              className="min-h-[40px] px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">प्रिंट</span>
            </button>

            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Summary Cards with Opposite Colors: Credit=RED, Debit=GREEN */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Credit -> RED */}
            <div className="bg-rose-50 border border-rose-200 p-3 sm:p-4 rounded-xl">
              <span className="text-[10px] sm:text-xs font-semibold text-rose-800 uppercase block">
                कुल उधार (Credit)
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-rose-700 mt-1 truncate">
                {formatCurrency(summary.totalCredit)}
              </div>
            </div>

            {/* Debit -> GREEN */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 sm:p-4 rounded-xl">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-800 uppercase block">
                कुल जमा (Debit)
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-emerald-700 mt-1 truncate">
                {formatCurrency(summary.totalDebit)}
              </div>
            </div>

            {/* Balance */}
            <div
              className={`p-3 sm:p-4 rounded-xl border ${
                summary.balance > 0
                  ? 'bg-rose-50/50 border-rose-300'
                  : summary.balance < 0
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] sm:text-xs font-semibold uppercase block ${
                  summary.balance > 0 ? 'text-rose-800' : summary.balance < 0 ? 'text-emerald-800' : 'text-slate-600'
                }`}
              >
                {summary.balance > 0 ? 'उधार बाकी (Due)' : summary.balance < 0 ? 'एडवांस जमा' : 'हिसाब बराबर'}
              </span>
              <div
                className={`text-base sm:text-xl font-extrabold font-mono mt-1 truncate ${
                  summary.balance > 0 ? 'text-rose-700' : summary.balance < 0 ? 'text-emerald-700' : 'text-slate-800'
                }`}
              >
                {formatCurrency(Math.abs(summary.balance))}
              </div>
            </div>
          </div>

          {/* Big Touch Action Buttons with Opposite Color Theme */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-1 border-b border-slate-200 pb-3">
            {/* Credit -> RED */}
            <button
              onClick={() => {
                onClose();
                onAddCredit(customer._id);
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ सामान उधार दिया</span>
            </button>

            {/* Debit -> GREEN */}
            <button
              onClick={() => {
                onClose();
                onAddDebit(customer._id);
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ रुपये जमा किए</span>
            </button>

            {/* Advance -> CYAN */}
            <button
              onClick={() => {
                onClose();
                if (onAddAdvance) onAddAdvance(customer._id);
                else onAddDebit(customer._id);
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PiggyBank className="w-4 h-4" />
              <span>+ एडवांस जमा</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onImpersonate(customer);
              }}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer sm:ml-auto"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>ग्राहक पोर्टल लॉगिन</span>
            </button>
          </div>

          {/* Ledger Table with Running Balance */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between">
              <span>खाता बही (Ledger Statement)</span>
              <span className="font-mono text-slate-500">कुल प्रविष्टियां: {data?.ledgerEntries?.length || 0}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 whitespace-nowrap">तारीख</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">प्रकार</th>
                    <th className="py-2.5 px-3">विवरण</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap text-rose-700">उधार (+)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap text-emerald-700">जमा (-)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap text-cyan-700">एडवांस</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">बाकी (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        खाता विवरण लोड हो रहा है...
                      </td>
                    </tr>
                  ) : (data?.ledgerEntries || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        कोई लेनदेन नहीं मिला।
                      </td>
                    </tr>
                  ) : (
                    (data?.ledgerEntries || []).map((entry: any) => {
                      const isCredit = entry.type === 'CREDIT';
                      const isAdvance = entry.type === 'ADVANCE';
                      return (
                        <tr key={entry._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {new Date(entry.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCredit
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : isAdvance
                                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isCredit ? 'उधार' : isAdvance ? 'एडवांस' : 'जमा'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">
                            <div className="font-semibold">{entry.productName || entry.description}</div>
                            {entry.referenceNumber && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Ref: {entry.referenceNumber}
                              </div>
                            )}
                          </td>
                          {/* Credit in RED */}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-bold whitespace-nowrap">
                            {entry.creditAmount ? formatCurrency(entry.creditAmount) : '—'}
                          </td>
                          {/* Debit in GREEN */}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold whitespace-nowrap">
                            {entry.debitAmount ? formatCurrency(entry.debitAmount) : '—'}
                          </td>
                          {/* Advance in CYAN */}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-cyan-700 font-bold whitespace-nowrap">
                            {entry.advanceAmount ? formatCurrency(entry.advanceAmount) : '—'}
                          </td>
                          {/* Running Balance */}
                          <td
                            className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                              entry.runningBalance > 0
                                ? 'text-rose-700'
                                : entry.runningBalance < 0
                                ? 'text-emerald-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>खाता कोड: {customer.customerCode}</span>
          <button
            onClick={onClose}
            className="min-h-[36px] px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
