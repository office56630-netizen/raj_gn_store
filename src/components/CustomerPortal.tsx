import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  Package,
  Bell,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  KeyRound,
  Shield,
  Download,
  Eye,
  RefreshCw,
  Phone,
  Store,
} from 'lucide-react';
import { Customer, Transaction, NotificationItem, LedgerEntry, api } from '../services/api.ts';

interface CustomerPortalProps {
  customer: Customer | null;
  onOpenChangePassword: () => void;
  onViewTransactionDetail: (txn: Transaction) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  onOpenChangePassword,
  onViewTransactionDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'transactions' | 'products' | 'notifications' | 'profile'>('dashboard');
  const [financialSummary, setFinancialSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0, transactionCount: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [productsBought, setProductsBought] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Transaction Search & Filters
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('all');

  const loadCustomerData = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const [accountRes, ledgerRes, notifRes] = await Promise.all([
        api.customers.getById(customer._id),
        api.customers.getLedger(customer._id),
        api.notifications.getAll(),
      ]);

      setFinancialSummary(accountRes.data.financialSummary);
      setRecentTransactions(accountRes.data.recentTransactions);
      setProductsBought(accountRes.data.productsBought);
      setLedgerEntries(ledgerRes.data.entries);
      setNotifications(notifRes.data.notifications);
      setUnreadNotifCount(notifRes.data.unreadCount);

      const txnsRes = await api.transactions.getAll({ limit: 100 });
      setAllTransactions(txnsRes.data.transactions);
    } catch (err) {
      console.error('Failed to load customer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customer]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await api.notifications.markAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const filteredTransactions = allTransactions.filter((t) => {
    if (txnTypeFilter !== 'all' && t.type !== txnTypeFilter) return false;
    if (txnSearch) {
      const q = txnSearch.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchProd = t.productName?.toLowerCase().includes(q);
      const matchRef = t.referenceNumber?.toLowerCase().includes(q);
      const matchCode = t.transactionCode?.toLowerCase().includes(q);
      if (!matchDesc && !matchProd && !matchRef && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              खाता कोड: {customer?.customerCode}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 mt-1.5">
            नमस्ते, {customer?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            किराना स्टोर पर आपके खाते की स्थिति और सभी लेनदेन विवरण
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomerData}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Account"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>खाता पर्ची प्रिंट</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards with Opposite Theme */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Credit -> RED */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs relative overflow-hidden bg-rose-50/10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600"></div>
          <span className="text-[10px] sm:text-xs font-bold text-rose-800 uppercase block truncate">
            कुल उधार लिया (Credit)
          </span>
          <div className="mt-2 text-base sm:text-2xl font-extrabold font-mono tabular-nums text-rose-700 truncate">
            {formatCurrency(financialSummary.totalCredit)}
          </div>
          <span className="hidden sm:block text-[11px] text-slate-500 mt-1">
            कुल सामान उधार लिया
          </span>
        </div>

        {/* Total Debit -> GREEN */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-emerald-200 shadow-2xs relative overflow-hidden bg-emerald-50/10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase block truncate">
            कुल जमा किया (Debit)
          </span>
          <div className="mt-2 text-base sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-700 truncate">
            {formatCurrency(financialSummary.totalDebit)}
          </div>
          <span className="hidden sm:block text-[11px] text-slate-500 mt-1">
            कुल भुगतान जमा कराया
          </span>
        </div>

        {/* Current Balance */}
        <div
          className={`p-3.5 sm:p-5 rounded-2xl border shadow-2xs relative overflow-hidden ${
            financialSummary.balance > 0
              ? 'bg-rose-50/20 border-rose-300'
              : financialSummary.balance < 0
              ? 'bg-emerald-50/20 border-emerald-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              financialSummary.balance > 0 ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          ></div>
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase block truncate ${
              financialSummary.balance > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}
          >
            {financialSummary.balance > 0
              ? 'कुल बाकी (Due)'
              : financialSummary.balance < 0
              ? 'आपकी एडवांस जमा'
              : 'हिसाब बराबर'}
          </span>
          <div
            className={`mt-2 text-base sm:text-2xl font-extrabold font-mono tabular-nums truncate ${
              financialSummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(Math.abs(financialSummary.balance))}
          </div>
          <span className="hidden sm:block text-[11px] text-slate-500 mt-1">
            {financialSummary.balance > 0 ? 'दुकानदार को देना बाकी है' : 'आपके खाते में अग्रिम जमा है'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[85px] min-h-[40px] font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          डैशबोर्ड
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 min-w-[100px] min-h-[40px] font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          खाता बही (Ledger)
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 min-w-[100px] min-h-[40px] font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          लेनदेन ({allTransactions.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 min-w-[100px] min-h-[40px] font-bold rounded-lg transition-all cursor-pointer relative ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          सूचनाएं
          {unreadNotifCount > 0 && (
            <span className="ml-1 bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadNotifCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[85px] min-h-[40px] font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
          }`}
        >
          प्रोफाइल
        </button>
      </div>

      {/* TAB 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">हाल के लेनदेन (Recent Activity)</h3>
                <p className="text-[11px] text-slate-500">दुकान पर दर्ज हालिया सामान व जमा</p>
              </div>
              <button
                onClick={() => setActiveTab('ledger')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                पूरा खाता देखें
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  अभी कोई लेनदेन दर्ज नहीं हुआ है।
                </div>
              ) : (
                recentTransactions.map((t) => {
                  const isCredit = t.type === 'CREDIT';
                  const isAdvance = t.type === 'ADVANCE';
                  return (
                    <div
                      key={t._id}
                      onClick={() => onViewTransactionDetail(t)}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
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
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {t.productName || t.description}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(t.transactionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
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
                          className={`block text-[9px] font-bold ${
                            isCredit
                              ? 'text-rose-700'
                              : isAdvance
                              ? 'text-cyan-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isCredit ? 'उधार' : isAdvance ? 'एडवांस' : 'जमा'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Official Ledger Statement */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">खाता बही (Running Ledger Statement)</h3>
              <p className="text-[11px] text-slate-500">हर लेनदेन के बाद लगातार बाकी बैलेंस</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">वर्तमान बाकी</span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-indigo-700">
                {formatCurrency(financialSummary.balance)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 whitespace-nowrap">तारीख</th>
                  <th className="py-2.5 px-3">विवरण</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">उधार (+)</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">जमा (-)</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">बाकी बैलेंस</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      कोई खाता विवरण उपलब्ध नहीं है।
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(entry.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <div className="font-semibold">{entry.productName || entry.description}</div>
                        {entry.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ref: {entry.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-bold whitespace-nowrap">
                        {entry.creditAmount ? formatCurrency(entry.creditAmount) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold whitespace-nowrap">
                        {entry.debitAmount ? formatCurrency(entry.debitAmount) : '—'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-extrabold whitespace-nowrap ${
                          entry.runningBalance > 0
                            ? 'text-rose-700'
                            : entry.runningBalance < 0
                            ? 'text-emerald-700'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                placeholder="सामान या विवरण खोजें..."
                className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <select
              value={txnTypeFilter}
              onChange={(e) => setTxnTypeFilter(e.target.value)}
              className="min-h-[44px] border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
            >
              <option value="all">सभी प्रकार (उधार, जमा, एडवांस)</option>
              <option value="CREDIT">केवल उधार (Credit - लाल)</option>
              <option value="DEBIT">केवल जमा (Debit - हरा)</option>
              <option value="ADVANCE">केवल एडवांस (Advance - नीला)</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                कोई लेनदेन नहीं मिला।
              </div>
            ) : (
              filteredTransactions.map((t) => {
                const isCredit = t.type === 'CREDIT';
                const isAdvance = t.type === 'ADVANCE';
                return (
                  <div
                    key={t._id}
                    onClick={() => onViewTransactionDetail(t)}
                    className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {t.productName || t.description}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(t.transactionDate).toLocaleDateString()} · {t.transactionCode}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs sm:text-sm font-extrabold font-mono tabular-nums ${
                          isCredit
                            ? 'text-rose-700'
                            : isAdvance
                            ? 'text-cyan-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isCredit ? '+ ' : isAdvance ? '★ ' : '- '}
                        {formatCurrency(t.amount)}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold block hover:underline">
                        पर्ची देखें
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">दुकानदार से संदेश व सूचनाएं</h3>
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                सभी पढ़ा हुआ मार्क करें
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                कोई नई सूचना नहीं है।
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 transition-colors ${
                    !notif.isRead ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer shrink-0"
                      >
                        पढ़ा
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs max-w-lg space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">खाता प्रोफाइल व सुरक्षा</h3>
            <button
              onClick={onOpenChangePassword}
              className="min-h-[40px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
            >
              पासवर्ड बदलें
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">ग्राहक का नाम</span>
              <span className="text-sm font-bold text-slate-900">{customer?.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">मोबाइल नंबर</span>
                <span className="font-mono font-bold text-slate-800">{customer?.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">खाता कोड</span>
                <span className="font-mono font-bold text-slate-800">{customer?.customerCode}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">पता / गाँव / कॉलोनी</span>
              <span className="text-slate-800">{customer?.address || 'पता दर्ज नहीं है'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
