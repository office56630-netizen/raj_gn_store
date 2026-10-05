import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Bell,
  ArrowLeftRight,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Customer, api } from '../services/api.ts';

interface CustomerManagementProps {
  onViewAccount: (customer: Customer) => void;
  onViewLedger: (customer: Customer) => void;
  onAddCredit: (customerId: string) => void;
  onAddDebit: (customerId: string) => void;
  onAddAdvance?: (customerId: string) => void;
  onSendNotification: (customer: Customer) => void;
  onImpersonate: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenAddCustomer: () => void;
  refreshTrigger?: number;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  onViewAccount,
  onViewLedger,
  onAddCredit,
  onAddDebit,
  onAddAdvance,
  onSendNotification,
  onImpersonate,
  onEditCustomer,
  onOpenAddCustomer,
  refreshTrigger = 0,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, pages: 1 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.customers.getAll({
        search,
        status: statusFilter,
        page,
        limit: 30,
      });
      setCustomers(res.data.customers);
      setPagination(res.data.pagination);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to fetch customers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, refreshTrigger]);

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`क्या आप ${customer.name} का खाता हटाना चाहते हैं?`)) {
      return;
    }

    try {
      setDeletingId(customer._id);
      await api.customers.delete(customer._id);
      setActionMessage({ type: 'success', text: `ग्राहक ${customer.name} का खाता हटाया गया।` });
      fetchCustomers(pagination.page);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'ग्राहक खाता नहीं हटाया जा सका।' });
    } finally {
      setDeletingId(null);
    }
  };

  const sendWhatsAppReminder = (c: Customer) => {
    const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `नमस्ते ${c.name} जी,\nआपके किराना स्टोर खाते में बाकी राशि ₹${(c.balance || 0).toLocaleString('en-IN')} है। कृपया समय मिलने पर जमा करवा दें। धन्यवाद! - किराना स्टोर`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  const formatCurrency = (val?: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            ग्राहक खाता बही (Customer Khata Book)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            सभी ग्राहकों का उधार, जमा और बाकी बैलेंस
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCustomers(pagination.page)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Reload List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddCustomer}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नया ग्राहक जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Alert banner */}
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
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नाम, मोबाइल नंबर या कोड से खोजें..."
            className="w-full min-h-[44px] pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="all">सभी खाते (All)</option>
            <option value="active">चालू खाते (Active)</option>
            <option value="inactive">बंद खाते (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List View (Visible on small screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6">
            ग्राहक सूची लोड हो रही है...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6">
            कोई ग्राहक नहीं मिला। ऊपर से "नया ग्राहक जोड़ें"।
          </div>
        ) : (
          customers.map((c) => {
            const balance = c.balance || 0;
            return (
              <div
                key={c._id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                {/* Header: Name, Code & Balance */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-[11px] text-slate-600 font-mono flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {c.customerCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-semibold">बाकी राशि (Due)</span>
                    <span
                      className={`text-base font-extrabold font-mono tabular-nums ${
                        balance > 0 ? 'text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>

                {/* Sub-info: Udhar vs Jama breakdown */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">कुल उधार (Credit)</span>
                    <span className="text-rose-700 font-bold">{formatCurrency(c.totalCredit)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">कुल जमा (Debit)</span>
                    <span className="text-emerald-700 font-bold">{formatCurrency(c.totalDebit)}</span>
                  </div>
                </div>

                {/* Big Mobile Touch Actions Bar (Credit=RED, Debit=GREEN, Advance=CYAN) */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onAddCredit(c._id)}
                    className="min-h-[44px] flex items-center justify-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                    <span>+ उधार</span>
                  </button>

                  <button
                    onClick={() => onAddDebit(c._id)}
                    className="min-h-[44px] flex items-center justify-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ जमा</span>
                  </button>

                  <button
                    onClick={() => (onAddAdvance ? onAddAdvance(c._id) : onAddDebit(c._id))}
                    className="min-h-[44px] flex items-center justify-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>+ एडवांस</span>
                  </button>

                  <button
                    onClick={() => onViewAccount(c)}
                    className="min-h-[44px] flex items-center justify-center gap-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>खाता</span>
                  </button>
                </div>

                {/* Secondary Actions: WhatsApp Reminder & Impersonation */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <button
                    onClick={() => sendWhatsAppReminder(c)}
                    className="min-h-[36px] flex items-center gap-1.5 text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp तगादा</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onImpersonate(c)}
                      className="min-h-[36px] flex items-center gap-1 text-purple-700 font-semibold hover:underline cursor-pointer"
                      title="Login as customer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>ग्राहक पोर्टल</span>
                    </button>

                    <button
                      onClick={() => onEditCustomer(c)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(c)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">खाता कोड</th>
                <th className="py-3 px-4">ग्राहक नाम व संपर्क</th>
                <th className="py-3 px-4">पता / स्थान</th>
                <th className="py-3 px-4 text-right">कुल उधार</th>
                <th className="py-3 px-4 text-right">कुल जमा</th>
                <th className="py-3 px-4 text-right">बाकी राशि (Balance)</th>
                <th className="py-3 px-4 text-center">स्थिति</th>
                <th className="py-3 px-4 text-center">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ग्राहक सूची लोड हो रही है...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    कोई ग्राहक खाता नहीं मिला।
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const balance = c.balance || 0;
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {c.customerCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {c.phone}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{c.address || c.city || '—'}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-semibold">
                        {formatCurrency(c.totalCredit)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {formatCurrency(c.totalDebit)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                        <span className={balance > 0 ? 'text-rose-700' : balance < 0 ? 'text-emerald-700' : 'text-slate-700'}>
                          {formatCurrency(balance)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onAddCredit(c._id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Add Credit (+ उधार)"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onAddDebit(c._id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Add Debit (+ जमा)"
                          >
                            <TrendingDown className="w-4 h-4" />
                          </button>

                          {onAddAdvance && (
                            <button
                              onClick={() => onAddAdvance(c._id)}
                              className="p-1.5 text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 rounded transition-colors cursor-pointer text-xs font-bold"
                              title="Add Advance (+ एडवांस)"
                            >
                              एडवांस
                            </button>
                          )}

                          <button
                            onClick={() => sendWhatsAppReminder(c)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="WhatsApp Reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onViewAccount(c)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="View Account"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onImpersonate(c)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors cursor-pointer"
                            title="Login as Customer"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditCustomer(c)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c._id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
