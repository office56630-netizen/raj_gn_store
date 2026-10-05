import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Transaction, Customer, Product, api } from '../services/api.ts';

interface TransactionManagementProps {
  onOpenAddCredit: (customerId?: string) => void;
  onOpenAddDebit: (customerId?: string) => void;
  onOpenAddAdvance?: (customerId?: string) => void;
  onViewTransaction: (transaction: Transaction) => void;
  refreshTrigger?: number;
}

export const TransactionManagement: React.FC<TransactionManagementProps> = ({
  onOpenAddCredit,
  onOpenAddDebit,
  onOpenAddAdvance,
  onViewTransaction,
  refreshTrigger = 0,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, pages: 1 });

  // Modals & messages
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFiltersData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.customers.getAll({ limit: 200 }),
        api.products.getAll({ limit: 200 }),
      ]);
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.transactions.getAll({
        search,
        customerId: selectedCustomer,
        type: selectedType,
        startDate,
        endDate,
        page,
        limit: 30,
      });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load transactions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchTransactions(1);
  }, [search, selectedCustomer, selectedType, startDate, endDate, refreshTrigger]);

  const handleDelete = async (txn: Transaction) => {
    if (!window.confirm(`क्या आप लेनदेन ${txn.transactionCode} हटाना चाहते हैं? ग्राहक का बैलेंस पुनः गणना होगा।`)) {
      return;
    }

    try {
      setDeletingId(txn._id);
      await api.transactions.delete(txn._id);
      setActionMessage({ type: 'success', text: `लेनदेन ${txn.transactionCode} हटाया गया।` });
      fetchTransactions(pagination.page);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'लेनदेन नहीं हटाया जा सका।' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;

    try {
      await api.transactions.update(editingTxn._id, {
        amount: editingTxn.amount,
        type: editingTxn.type,
        description: editingTxn.description,
        referenceNumber: editingTxn.referenceNumber,
        notes: editingTxn.notes,
        transactionDate: editingTxn.transactionDate,
      });
      setActionMessage({ type: 'success', text: `लेनदेन ${editingTxn.transactionCode} सुधारा गया।` });
      setEditingTxn(null);
      fetchTransactions(pagination.page);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'अपडेट विफल रहा' });
    }
  };

  const formatCurrency = (val?: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            किराना लेनदेन पंजी (All Transactions)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            उधार और जमा की संपूर्ण खाता प्रविष्टियां
          </p>
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          <button
            onClick={() => onOpenAddCredit()}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ उधार (Credit)</span>
          </button>

          <button
            onClick={() => onOpenAddDebit()}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ जमा (Debit)</span>
          </button>

          <button
            onClick={() => (onOpenAddAdvance ? onOpenAddAdvance() : onOpenAddDebit())}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ एडवांस</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer ml-4 min-h-[30px] min-w-[30px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 sm:space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="विवरण, कोड या रिफरेंस खोजें..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">सभी ग्राहक (All)</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">सभी प्रकार (उधार, जमा, एडवांस)</option>
            <option value="CREDIT">केवल उधार (Credit - लाल)</option>
            <option value="DEBIT">केवल जमा (Debit - हरा)</option>
            <option value="ADVANCE">केवल एडवांस (Advance - नीला)</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
            title="From Date"
          />
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6">
            लेनदेन लोड हो रहे हैं...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6">
            कोई लेनदेन प्रविष्टि नहीं मिली।
          </div>
        ) : (
          transactions.map((t) => {
            const isCredit = t.type === 'CREDIT';
            const isAdvance = t.type === 'ADVANCE';
            const custName = (t.customerId as Customer)?.name || 'ग्राहक';

            return (
              <div
                key={t._id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCredit
                          ? 'bg-rose-100 text-rose-800'
                          : isAdvance
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isCredit ? '+' : isAdvance ? '★' : '-'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{custName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(t.transactionDate).toLocaleDateString()} · {t.transactionCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                        isCredit
                          ? 'text-rose-700'
                          : isAdvance
                          ? 'text-cyan-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isCredit ? '+ ' : isAdvance ? '★ ' : '- '}
                      {formatCurrency(t.amount)}
                    </span>
                    <span
                      className={`block text-[9px] font-bold uppercase ${
                        isCredit
                          ? 'text-rose-700'
                          : isAdvance
                          ? 'text-cyan-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isCredit ? 'उधार दिया' : isAdvance ? 'एडवांस जमा' : 'जमा मिला'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="truncate">{t.productName || t.description}</span>
                  {t.referenceNumber && (
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      Ref: {t.referenceNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onViewTransaction(t)}
                    className="min-h-[36px] px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    पर्ची (Receipt)
                  </button>
                  <button
                    onClick={() => setEditingTxn(t)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">तारीख</th>
                <th className="py-3 px-4">कोड</th>
                <th className="py-3 px-4">ग्राहक</th>
                <th className="py-3 px-4">प्रकार</th>
                <th className="py-3 px-4">सामान / विवरण</th>
                <th className="py-3 px-4">रिफरेंस</th>
                <th className="py-3 px-4 text-right">राशि (₹)</th>
                <th className="py-3 px-4 text-center">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    लेनदेन सूची लोड हो रही है...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    कोई लेनदेन नहीं मिला।
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isCredit = t.type === 'CREDIT';
                  const custName = (t.customerId as Customer)?.name || 'ग्राहक';

                  return (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {t.transactionCode}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        {custName}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.type === 'CREDIT'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : t.type === 'ADVANCE'
                              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {t.type === 'CREDIT' ? 'उधार' : t.type === 'ADVANCE' ? 'एडवांस' : 'जमा'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-800 max-w-[200px] truncate">
                        {t.productName || t.description}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {t.referenceNumber || '—'}
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-mono tabular-nums font-extrabold whitespace-nowrap ${
                          t.type === 'CREDIT'
                            ? 'text-rose-700'
                            : t.type === 'ADVANCE'
                            ? 'text-cyan-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {t.type === 'CREDIT' ? '+ ' : t.type === 'ADVANCE' ? '★ ' : '- '}
                        {formatCurrency(t.amount)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewTransaction(t)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTxn(t)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-slide-up sm:animate-none">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                लेनदेन सुधारें: {editingTxn.transactionCode}
              </h3>
              <button
                onClick={() => setEditingTxn(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">प्रकार (Type)</label>
                <select
                  value={editingTxn.type}
                  onChange={(e) => setEditingTxn({ ...editingTxn, type: e.target.value as any })}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl p-2 bg-white font-bold"
                >
                  <option value="CREDIT">उधार (CREDIT)</option>
                  <option value="DEBIT">जमा (DEBIT)</option>
                  <option value="ADVANCE">एडवांस (ADVANCE)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">राशि (₹ Amount)</label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  required
                  value={editingTxn.amount}
                  onChange={(e) => setEditingTxn({ ...editingTxn, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl p-2 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">विवरण (Description)</label>
                <input
                  type="text"
                  required
                  value={editingTxn.description}
                  onChange={(e) => setEditingTxn({ ...editingTxn, description: e.target.value })}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">रिफरेंस नंबर</label>
                <input
                  type="text"
                  value={editingTxn.referenceNumber || ''}
                  onChange={(e) => setEditingTxn({ ...editingTxn, referenceNumber: e.target.value })}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl p-2 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  सहेजें (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
