import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  IndianRupee,
  PlusCircle,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Share2,
  History,
  TrendingUp,
  TrendingDown,
  Truck,
  Milk,
  ShoppingBag,
  Coffee,
  Coins,
  RefreshCw,
  Clock,
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  Building2,
  Receipt,
} from 'lucide-react';
import {
  api,
  DailyCashbookData,
  SupplierOutflowItem,
  CashDenominations,
} from '../services/api.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface DailyCashbookViewProps {
  onRefreshGlobalData?: () => void;
}

export const DailyCashbookView: React.FC<DailyCashbookViewProps> = ({
  onRefreshGlobalData,
}) => {
  const { lang, t } = useLanguage();

  // Current Date State (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  // Cashbook Data
  const [cashbook, setCashbook] = useState<DailyCashbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [denomTab, setDenomTab] = useState<'all' | 'notes' | 'coins'>('all');

  // Supplier Autocomplete Suggestions
  const [supplierSuggestions, setSupplierSuggestions] = useState<
    { partyName: string; category: string }[]
  >([]);

  // History Drawer State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<DailyCashbookData[]>([]);
  const [historySummary, setHistorySummary] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Outflow Form State
  const [showAddOutflow, setShowAddOutflow] = useState(false);
  const [newOutflow, setNewOutflow] = useState<{
    partyName: string;
    category:
      | 'DISTRIBUTOR'
      | 'WHOLESALER'
      | 'DAIRY'
      | 'BAKERY'
      | 'EXPENSE'
      | 'SALARY'
      | 'OTHER';
    amount: string;
    paymentMode: 'CASH' | 'ONLINE_UPI' | 'CREDIT';
    billNumber: string;
    description: string;
  }>({
    partyName: '',
    category: 'DISTRIBUTOR',
    amount: '',
    paymentMode: 'CASH',
    billNumber: '',
    description: '',
  });

  // Load Cashbook for selected date
  const loadCashbook = async (date: string) => {
    setLoading(true);
    try {
      const res = await api.cashbook.getDay(date);
      setCashbook(res.data);
    } catch (err: any) {
      console.error('Failed to load cashbook for date:', date, err);
    } finally {
      setLoading(false);
    }
  };

  // Load Supplier suggestions on mount
  useEffect(() => {
    api.cashbook
      .getSupplierSuggestions()
      .then((res) => setSupplierSuggestions(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Reload when selectedDate changes
  useEffect(() => {
    loadCashbook(selectedDate);
  }, [selectedDate]);

  // Load history when drawer opens
  const openHistoryDrawer = async () => {
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.cashbook.getHistory(30);
      setHistoryRecords(res.data.records);
      setHistorySummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Date Navigator Helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === getTodayStr();

  // Temporary Inflow / Outflow changes in local state
  const handleInflowChange = (field: keyof DailyCashbookData, value: number) => {
    if (!cashbook) return;
    setCashbook({
      ...cashbook,
      [field]: Math.max(0, value),
    });
  };

  // Denominations Handlers
  const handleDenominationChange = (key: keyof CashDenominations, count: number) => {
    if (!cashbook) return;
    const cleanCount = Math.max(0, Math.floor(count) || 0);
    const newDenom = {
      ...cashbook.denominations,
      [key]: cleanCount,
    };

    // Recompute total counted
    const totalCounted =
      (newDenom.c500 || 0) * 500 +
      (newDenom.c200 || 0) * 200 +
      (newDenom.c100 || 0) * 100 +
      (newDenom.c50 || 0) * 50 +
      (newDenom.c20 || 0) * 20 +
      (newDenom.c10 || 0) * 10 +
      (newDenom.coin10 || 0) * 10 +
      (newDenom.c5 || 0) * 5 +
      (newDenom.coin5 || 0) * 5 +
      (newDenom.coin2 || 0) * 2 +
      (newDenom.coin1 || 0) * 1 +
      (newDenom.cCoins || 0);

    newDenom.totalCounted = totalCounted;

    setCashbook({
      ...cashbook,
      denominations: newDenom,
    });
  };

  // Real-time Calculations
  const calculations = useMemo(() => {
    if (!cashbook) {
      return {
        totalInflow: 0,
        totalCashOutflow: 0,
        totalOnlineOutflow: 0,
        totalOutflow: 0,
        expectedCash: 0,
        totalCounted: 0,
        notesTotal: 0,
        coinsTotal: 0,
        variance: 0,
      };
    }

    const opening = Number(cashbook.openingCash) || 0;
    const directSales = Number(cashbook.directSales) || 0;
    const khata = Number(cashbook.khataCollections) || 0;
    const online = Number(cashbook.onlineSales) || 0;
    const other = Number(cashbook.otherInflow) || 0;

    const totalInflow = directSales + khata + online + other;

    let totalCashOutflow = 0;
    let totalOnlineOutflow = 0;
    let totalOutflow = 0;

    for (const item of cashbook.outflows || []) {
      const amt = Number(item.amount) || 0;
      totalOutflow += amt;
      if (item.paymentMode === 'ONLINE_UPI') {
        totalOnlineOutflow += amt;
      } else {
        totalCashOutflow += amt;
      }
    }

    // Expected cash in drawer = Opening + Direct Cash Sales + Khata Collections + Other Inflow - Cash Outflows
    const expectedCash = opening + directSales + khata + other - totalCashOutflow;

    const d = cashbook.denominations || {
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
    };

    const notesTotal =
      (d.c500 || 0) * 500 +
      (d.c200 || 0) * 200 +
      (d.c100 || 0) * 100 +
      (d.c50 || 0) * 50 +
      (d.c20 || 0) * 20 +
      (d.c10 || 0) * 10 +
      (d.c5 || 0) * 5;

    const coinsTotal =
      (d.coin10 || 0) * 10 +
      (d.coin5 || 0) * 5 +
      (d.coin2 || 0) * 2 +
      (d.coin1 || 0) * 1 +
      (d.cCoins || 0);

    const totalCounted = notesTotal + coinsTotal;

    const variance = totalCounted - expectedCash;

    return {
      totalInflow,
      totalCashOutflow,
      totalOnlineOutflow,
      totalOutflow,
      expectedCash,
      totalCounted,
      notesTotal,
      coinsTotal,
      variance,
    };
  }, [cashbook]);

  // Quick Add Outflow
  const handleAddOutflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newOutflow.amount);
    if (!newOutflow.partyName.trim() || isNaN(amt) || amt <= 0) {
      alert(lang === 'hi' ? 'कृपया सप्लायर का नाम और सही राशि दर्ज करें' : 'Please enter supplier name and valid amount');
      return;
    }

    try {
      const res = await api.cashbook.addOutflow(selectedDate, {
        partyName: newOutflow.partyName.trim(),
        category: newOutflow.category,
        amount: amt,
        paymentMode: newOutflow.paymentMode,
        billNumber: newOutflow.billNumber.trim(),
        description: newOutflow.description.trim(),
      });

      setCashbook(res.data);
      setNewOutflow({
        partyName: '',
        category: 'DISTRIBUTOR',
        amount: '',
        paymentMode: 'CASH',
        billNumber: '',
        description: '',
      });
      setShowAddOutflow(false);
      showToast(lang === 'hi' ? 'सप्लायर भुगतान दर्ज हुआ!' : 'Supplier payment recorded!');
    } catch (err: any) {
      alert(err.message || 'Failed to add payment entry');
    }
  };

  // Remove Outflow
  const handleDeleteOutflow = async (outflowId: string) => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस भुगतान प्रविष्टि को हटाना चाहते हैं?' : 'Remove this payment entry?')) {
      return;
    }

    try {
      const res = await api.cashbook.deleteOutflow(selectedDate, outflowId);
      setCashbook(res.data);
      showToast(lang === 'hi' ? 'प्रविष्टि हटा दी गई' : 'Payment entry removed');
    } catch (err: any) {
      alert(err.message || 'Failed to remove entry');
    }
  };

  // Save / Close Day
  const handleSaveDay = async (markClosed: boolean = false) => {
    if (!cashbook) return;
    setSaving(true);
    try {
      const res = await api.cashbook.saveDay(selectedDate, {
        openingCash: cashbook.openingCash,
        directSales: cashbook.directSales,
        khataCollections: cashbook.khataCollections,
        onlineSales: cashbook.onlineSales,
        otherInflow: cashbook.otherInflow,
        outflows: cashbook.outflows,
        denominations: cashbook.denominations,
        closingNotes: cashbook.closingNotes,
        isClosed: markClosed ? true : cashbook.isClosed,
      });

      setCashbook(res.data);
      showToast(
        markClosed
          ? lang === 'hi'
            ? 'दैनिक रोकड़ बही बंद व सुरक्षित की गई!'
            : 'Day cashbook closed and recorded!'
          : lang === 'hi'
          ? 'रोकड़ बही सुरक्षित की गई!'
          : 'Cashbook saved successfully!'
      );
      if (onRefreshGlobalData) onRefreshGlobalData();
    } catch (err: any) {
      alert(err.message || 'Failed to save cashbook');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // WhatsApp Share Generator
  const shareOnWhatsApp = () => {
    if (!cashbook) return;

    const formattedDate = new Date(selectedDate).toLocaleDateString(
      lang === 'hi' ? 'hi-IN' : 'en-IN',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

    const d = cashbook.denominations || ({} as any);
    const coinsDetail: string[] = [];
    if (d.coin10) coinsDetail.push(`₹10×${d.coin10}`);
    if (d.coin5) coinsDetail.push(`₹5×${d.coin5}`);
    if (d.coin2) coinsDetail.push(`₹2×${d.coin2}`);
    if (d.coin1) coinsDetail.push(`₹1×${d.coin1}`);
    if (d.cCoins) coinsDetail.push(`अन्य=₹${d.cCoins}`);
    const coinsBreakdownStr = coinsDetail.length > 0 ? `\n   • सिक्के विवरण: ${coinsDetail.join(', ')}` : '';

    const text = `🏪 *किराना दैनिक रोकड़ हिसाब (Kirana Daily Cash)*
📅 तारीख: ${formattedDate}
---------------------------------
💰 सुबह का गल्ला (Opening): ₹${cashbook.openingCash.toLocaleString('en-IN')}
📈 कुल बिक्री व आमदनी: ₹${calculations.totalInflow.toLocaleString('en-IN')}
   • नकद बिक्री: ₹${cashbook.directSales.toLocaleString('en-IN')}
   • उधार वसूली: ₹${cashbook.khataCollections.toLocaleString('en-IN')}
   • ऑनलाइन UPI: ₹${cashbook.onlineSales.toLocaleString('en-IN')}

🛒 सप्लायर व दुकान खर्च: ₹${calculations.totalOutflow.toLocaleString('en-IN')}
   • नकद भुगतान: ₹${calculations.totalCashOutflow.toLocaleString('en-IN')}
   • ऑनलाइन भुगतान: ₹${calculations.totalOnlineOutflow.toLocaleString('en-IN')}

💵 गल्ला रोकड़ स्थिति:
   • अपेक्षित गल्ला (Expected): ₹${calculations.expectedCash.toLocaleString('en-IN')}
   • कुल गिना नकद: ₹${calculations.totalCounted.toLocaleString('en-IN')} (नोट: ₹${calculations.notesTotal.toLocaleString('en-IN')} | सिक्के: ₹${calculations.coinsTotal.toLocaleString('en-IN')})${coinsBreakdownStr}
   • अंतर (Variance): ${
     calculations.variance === 0
       ? '✅ हिसाब बराबर (Matched)'
       : calculations.variance > 0
       ? `➕ ₹${calculations.variance.toLocaleString('en-IN')} अधिक (Surplus)`
       : `⚠️ ₹${Math.abs(calculations.variance).toLocaleString('en-IN')} कम (Shortage)`
   }
---------------------------------
CredEx Kirana Digital Ledger`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'DAIRY':
        return { label: lang === 'hi' ? 'डेयरी / दूध' : 'Dairy / Milk', icon: Milk, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'DISTRIBUTOR':
        return { label: lang === 'hi' ? 'डिस्ट्रिब्यूटर' : 'Distributor', icon: Truck, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'WHOLESALER':
        return { label: lang === 'hi' ? 'थोक व्यापारी' : 'Wholesaler', icon: Building2, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'BAKERY':
        return { label: lang === 'hi' ? 'बेकरी / अंडा' : 'Bakery/Eggs', icon: ShoppingBag, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'EXPENSE':
        return { label: lang === 'hi' ? 'दुकान खर्च' : 'Shop Expense', icon: Coffee, color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'SALARY':
        return { label: lang === 'hi' ? 'मजदूरी / वेतन' : 'Labor / Salary', icon: Wallet, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      default:
        return { label: lang === 'hi' ? 'अन्य खरीद' : 'Other Purchase', icon: Receipt, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Date Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{t('cashbook')}</span>
                {cashbook?.isClosed && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">
                    {lang === 'hi' ? 'दिन बंद (Closed)' : 'Closed'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'दैनिक नकद बिक्री, सप्लायर माल खरीद, दुकान खर्च व गल्ला नोट गणना'
                  : 'Daily cash sales, supplier purchases, expenses & cash tally'}
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Navigator */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent px-2 py-1 font-bold text-slate-800 text-xs border-0 focus:ring-0 cursor-pointer"
            />
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {lang === 'hi' ? 'आज (Today)' : 'Today'}
            </button>
          )}

          {/* Action Tools */}
          <button
            onClick={shareOnWhatsApp}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Share Daily Summary on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 no-print"
            title="Print Daily Sheet"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t('print')}</span>
          </button>

          <button
            onClick={openHistoryDrawer}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="View Past Days History"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">{lang === 'hi' ? 'इतिहास' : 'History'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xs border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <span>{lang === 'hi' ? 'रोकड़ बही लोड हो रही है...' : 'Loading cashbook records...'}</span>
        </div>
      ) : (
        cashbook && (
          <>
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Opening Cash */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 relative overflow-hidden">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  {t('openingCash')}
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 text-lg sm:text-2xl font-bold font-mono text-slate-900">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      value={cashbook.openingCash || ''}
                      onChange={(e) => handleInflowChange('openingCash', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 sm:w-32 bg-transparent font-bold border-b border-dashed border-slate-300 focus:border-emerald-600 focus:outline-hidden p-0 font-mono text-lg sm:text-2xl text-slate-900"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {lang === 'hi' ? 'सुबह दुकान खोलते समय गल्ला' : 'Cash in drawer in morning'}
                </span>
              </div>

              {/* 2. Total Inflow (Sales + Collections) */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  {lang === 'hi' ? 'कुल बिक्री व आमदनी' : 'Total Sales & Inflow'}
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-700">
                    ₹{calculations.totalInflow.toLocaleString('en-IN')}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  नकद: ₹{(cashbook.directSales + cashbook.khataCollections).toLocaleString('en-IN')} | UPI: ₹{cashbook.onlineSales.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 3. Total Supplier & Shop Payments */}
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                  {lang === 'hi' ? 'कुल सप्लायर व दुकान खर्च' : 'Total Outflows / Purchases'}
                </span>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="text-lg sm:text-2xl font-bold font-mono text-rose-700">
                    ₹{calculations.totalOutflow.toLocaleString('en-IN')}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  नकद दिया: ₹{calculations.totalCashOutflow.toLocaleString('en-IN')} | ऑनलाइन: ₹{calculations.totalOnlineOutflow.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 4. Expected Galla vs Counted (Tally Status) */}
              <div
                className={`rounded-2xl p-4 shadow-xs border transition-colors ${
                  calculations.variance === 0
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                    : calculations.variance > 0
                    ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                    : 'bg-rose-50/50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {lang === 'hi' ? 'रोकड़ मिलान (Tally)' : 'Galla Tally'}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      calculations.variance === 0
                        ? 'bg-emerald-600 text-white'
                        : calculations.variance > 0
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {calculations.variance === 0
                      ? t('matched')
                      : calculations.variance > 0
                      ? `+₹${calculations.variance}`
                      : `-₹${Math.abs(calculations.variance)}`}
                  </span>
                </div>

                <div className="mt-1.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {lang === 'hi' ? 'गिने गए नोट-सिक्के' : 'Physical Counted'}
                    </span>
                    <span className="text-base sm:text-xl font-extrabold font-mono text-slate-900 block leading-tight">
                      ₹{calculations.totalCounted.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                      नोट: ₹{calculations.notesTotal.toLocaleString('en-IN')} | सिक्के: ₹{calculations.coinsTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">
                      {lang === 'hi' ? 'खाता अनुसार' : 'Expected'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-slate-700">
                      ₹{calculations.expectedCash.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Sections: Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN: Inflows & Supplier Outflows (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Daily Inflow Breakdown (विक्रय व वसूली) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'hi' ? '1. दिन की नकद व ऑनलाइन बिक्री (Inflows)' : '1. Daily Sales & Inflow'}</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      ₹{calculations.totalInflow.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                    {/* Counter Cash Sales */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('directSales')} <span className="text-emerald-600 font-bold">(Cash)</span>
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={cashbook.directSales || ''}
                          onChange={(e) => handleInflowChange('directSales', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {lang === 'hi' ? 'दुकान काउंटर पर हुई नकद बिक्री' : 'Daily cash sales at shop counter'}
                      </span>
                    </div>

                    {/* Online UPI Sales */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('onlineSales')} <span className="text-indigo-600 font-bold">(PhonePe/GPay)</span>
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={cashbook.onlineSales || ''}
                          onChange={(e) => handleInflowChange('onlineSales', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {lang === 'hi' ? 'QR कोड या खाते में ऑनलाइन मिला' : 'Digital QR/UPI payments'}
                      </span>
                    </div>

                    {/* Khata Cash Collections */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">{t('khataCollections')}</label>
                        {cashbook.automatedKhataCollected !== undefined && (
                          <button
                            type="button"
                            onClick={() =>
                              handleInflowChange('khataCollections', cashbook.automatedKhataCollected || 0)
                            }
                            className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                            title="Auto-fill from transactions recorded in ledger today"
                          >
                            Auto: ₹{cashbook.automatedKhataCollected}
                          </button>
                        )}
                      </div>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={cashbook.khataCollections || ''}
                          onChange={(e) => handleInflowChange('khataCollections', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {lang === 'hi' ? 'उधार ग्राहकों से आई नकद वसूली' : 'Credit customers payments collected'}
                      </span>
                    </div>

                    {/* Other Inflows */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block font-semibold text-slate-700 mb-1">
                        {lang === 'hi' ? 'अन्य नकद प्राप्ति (Other Inflows)' : 'Other Inflow'}
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={cashbook.otherInflow || ''}
                          onChange={(e) => handleInflowChange('otherInflow', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {lang === 'hi' ? 'घर से लाए या अन्य नकद प्राप्ति' : 'Deposits / other cash additions'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Supplier Outflows & Purchases (थोक खरीद व सप्लायर भुगतान) */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-rose-600" />
                        <span>{lang === 'hi' ? '2. सप्लायर भुगतान व दुकान खरीद (Purchases)' : '2. Supplier Payouts & Purchases'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lang === 'hi'
                          ? 'डेयरी, डिस्ट्रिब्यूटर, थोक व्यापारी भुगतान व दुकान खर्चे'
                          : 'Distributor, Dairy, Wholesaler & Shop expenses'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddOutflow(!showAddOutflow)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{showAddOutflow ? (lang === 'hi' ? 'बंद करें' : 'Close') : (lang === 'hi' ? '+ भुगतान जोड़ें' : '+ Add Payment')}</span>
                    </button>
                  </div>

                  {/* Add Outflow Form Drawer / Inline Form */}
                  {showAddOutflow && (
                    <form
                      onSubmit={handleAddOutflow}
                      className="mt-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3 text-xs animate-slide-up"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-950">
                          {lang === 'hi' ? 'नया भुगतान / खरीद प्रविष्टि दर्ज करें' : 'Record Supplier Payment / Expense'}
                        </span>
                        <span className="text-[10px] text-slate-500">* आवश्यक फ़ील्ड</span>
                      </div>

                      {/* Category Chips Preset */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {lang === 'hi' ? 'सप्लायर / खर्च श्रेणी (Category)' : 'Payment Category'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { id: 'DISTRIBUTOR', label: lang === 'hi' ? '🏢 डिस्ट्रिब्यूटर (Agency)' : 'Distributor' },
                            { id: 'WHOLESALER', label: lang === 'hi' ? '📦 थोक व्यापारी (Wholesale)' : 'Wholesaler' },
                            { id: 'DAIRY', label: lang === 'hi' ? '🥛 डेयरी / दूध सप्लायर' : 'Dairy Supplier' },
                            { id: 'BAKERY', label: lang === 'hi' ? '🍞 बेकरी / अंडा / सब्जी' : 'Bakery/Perishables' },
                            { id: 'EXPENSE', label: lang === 'hi' ? '☕ दुकान खर्च (Tea/Rent)' : 'Shop Expense' },
                            { id: 'SALARY', label: lang === 'hi' ? '🚚 मजदूरी / भाड़ा' : 'Labor / Transport' },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setNewOutflow({ ...newOutflow, category: cat.id as any })}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all text-left truncate cursor-pointer ${
                                newOutflow.category === cat.id
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Supplier Name & Amount */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {lang === 'hi' ? 'सप्लायर / पार्टी का नाम (Supplier Name)' : 'Party / Supplier Name'} *
                          </label>
                          <input
                            type="text"
                            required
                            value={newOutflow.partyName}
                            onChange={(e) => setNewOutflow({ ...newOutflow, partyName: e.target.value })}
                            placeholder={lang === 'hi' ? 'उदा. अमूल दूध, पारले एजेंसी, मेट्रो होलसेल' : 'e.g. Amul Dairy, Metro Wholesale'}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                          />

                          {/* Quick suggestions if available */}
                          {supplierSuggestions.length > 0 && !newOutflow.partyName && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {supplierSuggestions.slice(0, 4).map((s, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    setNewOutflow({
                                      ...newOutflow,
                                      partyName: s.partyName,
                                      category: s.category as any,
                                    })
                                  }
                                  className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                  {s.partyName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {lang === 'hi' ? 'भुगतान राशि (Amount in ₹)' : 'Amount (₹)'} *
                          </label>
                          <div className="relative rounded-lg shadow-2xs">
                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              required
                              value={newOutflow.amount}
                              onChange={(e) => setNewOutflow({ ...newOutflow, amount: e.target.value })}
                              placeholder="0"
                              className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Mode & Bill Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {lang === 'hi' ? 'भुगतान माध्यम (Payment Mode)' : 'Payment Mode'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setNewOutflow({ ...newOutflow, paymentMode: 'CASH' })}
                              className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                newOutflow.paymentMode === 'CASH'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            >
                              💵 {lang === 'hi' ? 'गल्ले से नकद' : 'Cash'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewOutflow({ ...newOutflow, paymentMode: 'ONLINE_UPI' })}
                              className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                newOutflow.paymentMode === 'ONLINE_UPI'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            >
                              📱 {lang === 'hi' ? 'ऑनलाइन UPI' : 'Online UPI'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {lang === 'hi' ? 'बिल / पर्ची नंबर (Optional Bill #)' : 'Bill / Invoice Number'}
                          </label>
                          <input
                            type="text"
                            value={newOutflow.billNumber}
                            onChange={(e) => setNewOutflow({ ...newOutflow, billNumber: e.target.value })}
                            placeholder="e.g. INV-8492"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>

                      {/* Purchased Goods Description */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {lang === 'hi' ? 'क्या सामान खरीदा / विवरण (Goods Purchased / Details)' : 'Goods Purchased / Description'}
                        </label>
                        <input
                          type="text"
                          value={newOutflow.description}
                          onChange={(e) => setNewOutflow({ ...newOutflow, description: e.target.value })}
                          placeholder={
                            lang === 'hi'
                              ? 'उदा. दूध 40 पैकेट + दही 10 कप, शक्कर 2 बोरी, चाय पत्ती'
                              : 'e.g. 40 milk pouches, 2 sugar bags, tea carton'
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* Submit button */}
                      <div className="pt-1 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddOutflow(false)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'hi' ? 'भुगतान सुरक्षित करें' : 'Record Payment'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Outflow List */}
                  <div className="mt-4 divide-y divide-slate-100">
                    {cashbook.outflows.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        {lang === 'hi'
                          ? 'आज कोई सप्लायर भुगतान दर्ज नहीं हुआ है। ऊपर बटन दबाकर जोड़ें।'
                          : 'No supplier payments recorded for this date yet.'}
                      </div>
                    ) : (
                      cashbook.outflows.map((outflow, idx) => {
                        const catMeta = getCategoryLabel(outflow.category);
                        const CatIcon = catMeta.icon;

                        return (
                          <div
                            key={outflow._id || idx}
                            className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${catMeta.color}`}
                              >
                                <CatIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900">{outflow.partyName}</span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${catMeta.color}`}
                                  >
                                    {catMeta.label}
                                  </span>
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                      outflow.paymentMode === 'CASH'
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : 'bg-indigo-50 text-indigo-800'
                                    }`}
                                  >
                                    {outflow.paymentMode === 'CASH' ? 'नकद (Cash)' : 'ऑनलाइन (UPI)'}
                                  </span>
                                </div>

                                {outflow.description && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                                    📦 {outflow.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                                  {outflow.billNumber && <span>बिल #: {outflow.billNumber}</span>}
                                  {outflow.time && <span>समय: {outflow.time}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold font-mono text-sm sm:text-base text-rose-700">
                                ₹{outflow.amount.toLocaleString('en-IN')}
                              </span>
                              {outflow._id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOutflow(outflow._id!)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Physical Cash Denominations (नोट और सिक्का गणना) (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {t('denominations')}
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          {lang === 'hi' ? 'गल्ले में मौजूद नोट व सिक्कों की गिनती' : 'Cash drawer note & coin tally'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {lang === 'hi' ? 'कुल नकदी' : 'Counted'}
                      </span>
                      <span className="text-base font-extrabold font-mono text-slate-900">
                        ₹{calculations.totalCounted.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Denomination Category Switcher / Tabs */}
                  <div className="mt-3 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDenomTab('all')}
                      className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                        denomTab === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'hi' ? 'सभी (All)' : 'All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDenomTab('notes')}
                      className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        denomTab === 'notes'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>💵</span>
                      <span>{lang === 'hi' ? 'नोट' : 'Notes'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">₹{calculations.notesTotal}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDenomTab('coins')}
                      className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        denomTab === 'coins'
                          ? 'bg-white text-amber-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🪙</span>
                      <span>{lang === 'hi' ? 'सिक्के' : 'Coins'}</span>
                      <span className="text-[10px] text-amber-700 font-mono">₹{calculations.coinsTotal}</span>
                    </button>
                  </div>

                  {/* Denomination Rows Container */}
                  <div className="mt-3 space-y-3 text-xs">
                    {/* SECTION 1: Currency Notes (करेंसी नोट) */}
                    {(denomTab === 'all' || denomTab === 'notes') && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span>💵</span>
                            <span>{lang === 'hi' ? 'करेंसी नोट (Notes)' : 'Currency Notes'}</span>
                          </span>
                          <span className="font-mono text-slate-700">
                            उप-योग: ₹{calculations.notesTotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {[
                          { key: 'c500', note: 500, label: '₹500 Note', color: 'text-stone-800 bg-stone-100 border border-stone-300' },
                          { key: 'c200', note: 200, label: '₹200 Note', color: 'text-amber-800 bg-amber-100 border border-amber-300' },
                          { key: 'c100', note: 100, label: '₹100 Note', color: 'text-blue-800 bg-blue-100 border border-blue-300' },
                          { key: 'c50', note: 50, label: '₹50 Note', color: 'text-cyan-800 bg-cyan-100 border border-cyan-300' },
                          { key: 'c20', note: 20, label: '₹20 Note', color: 'text-lime-800 bg-lime-100 border border-lime-300' },
                          { key: 'c10', note: 10, label: '₹10 Note', color: 'text-orange-900 bg-orange-100 border border-orange-300' },
                          { key: 'c5', note: 5, label: '₹5 Note', color: 'text-slate-700 bg-slate-100 border border-slate-300' },
                        ].map((row) => {
                          const count = (cashbook.denominations as any)?.[row.key] || 0;
                          const subtotal = count * row.note;

                          return (
                            <div
                              key={row.key}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 w-28">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] shrink-0 ${row.color}`}
                                >
                                  ₹{row.note}
                                </span>
                                <span className="text-slate-400 text-[11px]">✕</span>
                              </div>

                              {/* Quick Count +/- Buttons & Input */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDenominationChange(row.key as any, count - 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                                  title="घटाएं (-1)"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={count === 0 ? '' : count}
                                  onChange={(e) =>
                                    handleDenominationChange(row.key as any, parseInt(e.target.value, 10) || 0)
                                  }
                                  placeholder="0"
                                  className="w-12 sm:w-14 text-center font-bold font-mono py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDenominationChange(row.key as any, count + 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                                  title="जोड़ें (+1)"
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="w-20 text-right font-mono font-bold text-slate-800 text-xs">
                                ₹{subtotal.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SECTION 2: Indian Coins (भारतीय सिक्के - 10 Rs, 5 Rs, 2 Rs, 1 Rs) */}
                    {(denomTab === 'all' || denomTab === 'coins') && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-amber-900 border-t border-slate-200/60 pt-2">
                          <span className="flex items-center gap-1.5">
                            <span>🪙</span>
                            <span>
                              {lang === 'hi'
                                ? 'भारतीय सिक्के (10 रु, 5 रु, 2 रु, 1 रु)'
                                : 'Coins (₹10, ₹5, ₹2, ₹1)'}
                            </span>
                          </span>
                          <span className="font-mono text-amber-800">
                            उप-योग: ₹{calculations.coinsTotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {[
                          {
                            key: 'coin10',
                            value: 10,
                            label: lang === 'hi' ? '₹10 सिक्का' : '₹10 Coin',
                            badge: '₹10',
                            style: 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs font-extrabold',
                            desc: '10 Rs Coin',
                          },
                          {
                            key: 'coin5',
                            value: 5,
                            label: lang === 'hi' ? '₹5 सिक्का' : '₹5 Coin',
                            badge: '₹5',
                            style: 'bg-yellow-100 text-yellow-950 border border-yellow-300 shadow-2xs font-extrabold',
                            desc: '5 Rs Coin',
                          },
                          {
                            key: 'coin2',
                            value: 2,
                            label: lang === 'hi' ? '₹2 सिक्का' : '₹2 Coin',
                            badge: '₹2',
                            style: 'bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs font-extrabold',
                            desc: '2 Rs Coin',
                          },
                          {
                            key: 'coin1',
                            value: 1,
                            label: lang === 'hi' ? '₹1 सिक्का' : '₹1 Coin',
                            badge: '₹1',
                            style: 'bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs font-extrabold',
                            desc: '1 Rs Coin',
                          },
                        ].map((coin) => {
                          const count = (cashbook.denominations as any)?.[coin.key] || 0;
                          const subtotal = count * coin.value;

                          return (
                            <div
                              key={coin.key}
                              className="flex items-center justify-between p-2 rounded-xl bg-amber-50/40 border border-amber-200/60 hover:border-amber-300 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 w-28">
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 ${coin.style}`}
                                >
                                  {coin.badge}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 text-[11px] block truncate">
                                    {coin.label}
                                  </span>
                                </div>
                                <span className="text-slate-400 text-[11px]">✕</span>
                              </div>

                              {/* Quick Count +/- Buttons & Input */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDenominationChange(coin.key as any, count - 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                                  title="घटाएं (-1 सिक्का)"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={count === 0 ? '' : count}
                                  onChange={(e) =>
                                    handleDenominationChange(coin.key as any, parseInt(e.target.value, 10) || 0)
                                  }
                                  placeholder="0"
                                  className="w-12 sm:w-14 text-center font-bold font-mono py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDenominationChange(coin.key as any, count + 1)}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                                  title="जोड़ें (+1 सिक्का)"
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="w-20 text-right font-mono font-bold text-amber-900 text-xs">
                                ₹{subtotal.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}

                        {/* Loose / Other Coins (अन्य खुले सिक्के - कुल राशि) */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/40 border border-amber-200/60">
                          <div className="flex items-center gap-2 min-w-0 w-28">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] shrink-0 bg-amber-200 text-amber-900">
                              {lang === 'hi' ? 'अन्य सिक्के' : 'Loose Coins'}
                            </span>
                            <span className="text-slate-400 text-[10px]">कुल ₹</span>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={cashbook.denominations?.cCoins || ''}
                              onChange={(e) =>
                                handleDenominationChange('cCoins', parseFloat(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-24 text-center font-bold font-mono py-1 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="w-20 text-right font-mono font-bold text-amber-900 text-xs">
                            ₹{(cashbook.denominations?.cCoins || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tally Card Comparison */}
                  <div className="mt-4 p-3.5 rounded-xl border bg-slate-50 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>{lang === 'hi' ? 'खाता अनुसार गल्ले में होना चाहिए:' : 'Expected in Drawer:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{calculations.expectedCash.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>{lang === 'hi' ? 'गिनती में कुल नकद मिला:' : 'Physical Cash Counted:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{calculations.totalCounted.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold">
                      <span>{lang === 'hi' ? 'रोकड़ अंतर (मिलान):' : 'Difference / Variance:'}</span>
                      <span
                        className={`font-mono text-sm ${
                          calculations.variance === 0
                            ? 'text-emerald-700'
                            : calculations.variance > 0
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {calculations.variance === 0
                          ? `✅ ${lang === 'hi' ? 'बराबर (0)' : 'Matched (0)'}`
                          : calculations.variance > 0
                          ? `+₹${calculations.variance.toLocaleString('en-IN')} (फालतू/Excess)`
                          : `-₹${Math.abs(calculations.variance).toLocaleString('en-IN')} (कमी/Shortage)`}
                      </span>
                    </div>
                  </div>

                  {/* Closing Notes */}
                  <div className="mt-4">
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      {lang === 'hi' ? 'रोकड़ टिप्पणी / नोट्स (Closing Notes)' : 'Daily Closing Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={cashbook.closingNotes || ''}
                      onChange={(e) => setCashbook({ ...cashbook, closingNotes: e.target.value })}
                      placeholder={
                        lang === 'hi'
                          ? 'उदा. दूध वाले को ₹1200 नकद दिए, रात को गल्ला बंद किया।'
                          : 'Notes regarding today expenses or cash variance'
                      }
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Save Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveDay(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? (lang === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : (lang === 'hi' ? 'रोकड़ सुरक्षित करें' : 'Save Cashbook')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveDay(true)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Save and mark day register as closed"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'दिन क्लोज करें' : 'Close Day'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {/* History Drawer Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'hi' ? 'पिछला दैनिक रोकड़ इतिहास (30 दिन)' : 'Past Cashbook History (30 Days)'}
                </h3>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Aggregates */}
            {historySummary && (
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'hi' ? 'कुल बिक्री' : 'Total Sales'}
                  </span>
                  <span className="font-bold font-mono text-emerald-700">
                    ₹{historySummary.totalSalesAll?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'hi' ? 'कुल सप्लायर खर्च' : 'Total Payouts'}
                  </span>
                  <span className="font-bold font-mono text-rose-700">
                    ₹{historySummary.totalOutflowsAll?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-indigo-100">
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'hi' ? 'रोकड़ अंतर' : 'Net Variance'}
                  </span>
                  <span
                    className={`font-bold font-mono ${
                      historySummary.netCashDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    ₹{historySummary.netCashDifference?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* History Records List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5 text-xs">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <span>Loading history...</span>
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {lang === 'hi' ? 'कोई पिछला रिकॉर्ड उपलब्ध नहीं है' : 'No records found.'}
                </div>
              ) : (
                historyRecords.map((rec) => {
                  const recDate = new Date(rec.date).toLocaleDateString(
                    lang === 'hi' ? 'hi-IN' : 'en-IN',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  );

                  return (
                    <div
                      key={rec.date}
                      onClick={() => {
                        setSelectedDate(rec.date);
                        setHistoryOpen(false);
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{recDate}</span>
                          {rec.isClosed && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                          <span>
                            बिक्री: <strong className="text-emerald-700">₹{(rec.directSales + rec.onlineSales).toLocaleString('en-IN')}</strong>
                          </span>
                          <span>
                            सप्लायर: <strong className="text-rose-700">₹{rec.totalOutflow.toLocaleString('en-IN')}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">गल्ला नकद</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{rec.denominations?.totalCounted?.toLocaleString('en-IN') || rec.expectedCash?.toLocaleString('en-IN')}
                        </span>
                        <div className="text-[10px] mt-0.5">
                          {rec.cashVariance === 0 ? (
                            <span className="text-emerald-600 font-bold">बराबर</span>
                          ) : rec.cashVariance > 0 ? (
                            <span className="text-amber-600 font-bold">+₹{rec.cashVariance}</span>
                          ) : (
                            <span className="text-rose-600 font-bold">-₹{Math.abs(rec.cashVariance)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
