import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Scale,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  MessageCircle,
  Phone,
  PiggyBank,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface AdminDashboardProps {
  onNavigate: (view: string, data?: any) => void;
  onOpenAddCredit: (customerId?: string) => void;
  onOpenAddDebit: (customerId?: string) => void;
  onOpenAddAdvance?: (customerId?: string) => void;
  onOpenAddCustomer: () => void;
  refreshTrigger?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenAddCredit,
  onOpenAddDebit,
  onOpenAddAdvance,
  onOpenAddCustomer,
  refreshTrigger = 0,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.reports.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchStats();
  };

  const metrics = stats?.metrics || {
    totalCustomers: 0,
    totalCredit: 0,
    totalDebit: 0,
    totalAdvance: 0,
    totalOutstanding: 0,
    totalTransactions: 0,
    todayCredit: 0,
    todayDebit: 0,
    todayAdvance: 0,
  };

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  const sendWhatsAppReminder = (customer: any) => {
    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `नमस्ते ${customer.name} जी! आपके किराना स्टोर खाते में कुल बाकी उधार ₹${(customer.balance || 0).toLocaleString(
        'en-IN'
      )} है। कृपया सुविधा अनुसार जमा करवाएं। धन्यवाद!`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              किराना खाता डैशबोर्ड (Khata Dashboard)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              उधार (लाल) · जमा (हरा) · एडवांस (नीला)
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reload latest statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">रीलोड (Sync)</span>
          </button>
        </div>

        {/* Big Action Buttons (Opposite color theme: Credit=RED, Debit=GREEN, Advance=CYAN) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          {/* Credit / Udhar -> RED */}
          <button
            onClick={() => onOpenAddCredit()}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>उधार जोड़ें</span>
          </button>

          {/* Debit / Jama -> GREEN */}
          <button
            onClick={() => onOpenAddDebit()}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>जमा करें</span>
          </button>

          {/* Advance -> CYAN */}
          <button
            onClick={() => (onOpenAddAdvance ? onOpenAddAdvance() : onOpenAddDebit())}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PiggyBank className="w-4 h-4 shrink-0" />
            <span>एडवांस</span>
          </button>

          {/* Add Customer */}
          <button
            onClick={onOpenAddCustomer}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>नया खाता</span>
          </button>
        </div>
      </div>

      {/* 4 Main Financial Khata Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Khata Customers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">कुल ग्राहक</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.totalCustomers}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              सक्रिय खाताधारक
            </div>
          </div>
        </div>

        {/* Card 2: Total Udhar / Credit (RED) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-rose-50/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600"></div>
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">कुल उधार दिया (Credit)</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-700 truncate">
              {formatCurrency(metrics.totalCredit)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-600 mt-0.5 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3 h-3 shrink-0" />
              <span>सामान दिया (लेना बाकी)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Jama / Debit (GREEN) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-emerald-50/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">कुल जमा मिला (Debit)</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 truncate">
              {formatCurrency(metrics.totalDebit)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3 h-3 shrink-0" />
              <span>रुपये प्राप्त हुए</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Baaki / Outstanding Balance (AMBER/RED) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-amber-50/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600"></div>
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">कुल बाकी (लेना है)</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-800 truncate">
              {formatCurrency(metrics.totalOutstanding)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-700 mt-0.5 font-medium flex items-center justify-between">
              <span>उधार - (जमा + एडवांस)</span>
              {metrics.totalAdvance > 0 && (
                <span className="text-cyan-700 font-bold">एडवांस: {formatCurrency(metrics.totalAdvance)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Outstanding Khata Customers & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Highest Pending Baaki Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                अधिकतम बाकी वाले ग्राहक (Top Baaki Khata)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">जिनसे रुपये लेने बाकी हैं</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="min-h-[44px] flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              सभी ग्राहक देखें
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats?.topOutstandingCustomers || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                अभी कोई बाकी खाता नहीं है। "नया खाता" जोड़ें।
              </div>
            ) : (
              (stats?.topOutstandingCustomers || []).map((cust: any) => (
                <div
                  key={cust.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                          cust.balance > 0 ? 'text-rose-700' : cust.balance < 0 ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {formatCurrency(Math.abs(cust.balance))}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400">
                        {cust.balance > 0 ? 'उधार बाकी' : cust.balance < 0 ? 'एडवांस जमा' : 'बराबर'}
                      </div>
                    </div>

                    {/* 1-Click WhatsApp Reminder button */}
                    <button
                      onClick={() => sendWhatsAppReminder(cust)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </button>

                    {/* Receive Jama -> GREEN */}
                    <button
                      onClick={() => onOpenAddDebit(cust.id)}
                      className="min-h-[40px] px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      जमा लें
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                हालिया लेनदेन (Recent Khata Entries)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                उधार (लाल) · जमा (हरा) · एडवांस (नीला)
              </p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="min-h-[44px] flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              सभी लेनदेन
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats?.recentTransactions || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                अभी कोई लेनदेन दर्ज नहीं हुआ है। "उधार" या "जमा" जोड़ें।
              </div>
            ) : (
              (stats?.recentTransactions || []).map((txn: any) => {
                const isCredit = txn.type === 'CREDIT';
                const isAdvance = txn.type === 'ADVANCE';
                return (
                  <div
                    key={txn._id}
                    className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCredit
                            ? 'bg-rose-100 text-rose-800'
                            : isAdvance
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCredit ? '+' : isAdvance ? '★' : '-'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {txn.customerId?.name || 'ग्राहक'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {txn.productName || txn.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                          isCredit
                            ? 'text-rose-700'
                            : isAdvance
                            ? 'text-cyan-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isCredit ? '+ ' : isAdvance ? '★ ' : '- '}
                        {formatCurrency(txn.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(txn.transactionDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
