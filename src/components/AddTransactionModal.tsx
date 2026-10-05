import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  Clock,
  Check,
  CreditCard,
  QrCode,
  Banknote,
  PiggyBank,
} from 'lucide-react';
import { Customer, Product, api } from '../services/api.ts';

interface AddTransactionModalProps {
  initialType: 'CREDIT' | 'DEBIT' | 'ADVANCE';
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  initialType,
  initialCustomerId,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<'CREDIT' | 'DEBIT' | 'ADVANCE'>(initialType || 'CREDIT');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Kirana Store Quick Shortcuts
  const quickKiranaItems = [
    { label: 'Atta (आटा)', price: 420 },
    { label: 'Rice (चावल)', price: 350 },
    { label: 'Sugar (चीनी)', price: 90 },
    { label: 'Oil (तेल 1L)', price: 145 },
    { label: 'Milk (दूध)', price: 65 },
    { label: 'Dal (दाल)', price: 130 },
    { label: 'Tea (चाय पत्ती)', price: 120 },
    { label: 'Spices (मसाले)', price: 80 },
    { label: 'Soap/Washing (साबुन)', price: 60 },
  ];

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          api.customers.getAll({ limit: 200, status: 'active' }),
          api.products.getAll({ limit: 200, status: 'active' }),
        ]);
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);

        if (!customerId && cRes.data.customers.length > 0) {
          setCustomerId(cRes.data.customers[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  // Quick Amount Adder
  const addQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  // Quick Kirana Item Selector
  const selectQuickItem = (item: { label: string; price: number }) => {
    setProductName(item.label);
    setDescription(`किराना सामान: ${item.label}`);
    if (!amount || amount === '0') {
      setAmount(item.price.toString());
    }
  };

  const handleProductChange = (prodId: string) => {
    setProductId(prodId);
    if (!prodId) {
      setProductName('');
      return;
    }

    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      setProductName(prod.name);
      setAmount(prod.price.toString());
      setDescription(
        type === 'CREDIT'
          ? `सामान दिया: ${prod.name}`
          : type === 'ADVANCE'
          ? `एडवांस जमा: ${prod.name}`
          : `पेमेंट जमा: ${prod.name}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerId) {
      setErrorMessage('कृपया ग्राहक चुनें (Please select a customer)');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('कृपया मान्य राशि दर्ज करें (Enter a valid amount greater than 0)');
      return;
    }

    setSubmitting(true);
    try {
      let finalDescription = description.trim();
      if (!finalDescription) {
        if (type === 'CREDIT') {
          finalDescription = productName ? `सामान उधार: ${productName}` : 'किराना सामान उधार दिया';
        } else if (type === 'ADVANCE') {
          finalDescription = `एडवांस जमा (${paymentMode})`;
        } else {
          finalDescription = `पेमेंट जमा (${paymentMode})`;
        }
      }

      let finalRef = referenceNumber.trim();
      if (type !== 'CREDIT' && paymentMode && !finalRef.includes(paymentMode)) {
        finalRef = finalRef ? `${paymentMode} · ${finalRef}` : paymentMode;
      }

      await api.transactions.create({
        customerId,
        type,
        isAdvance: type === 'ADVANCE',
        productId: productId || undefined,
        productName: productName.trim() || undefined,
        amount: numAmount,
        description: finalDescription,
        referenceNumber: finalRef,
        transactionDate,
        notes: notes.trim() || undefined,
      });

      let typeLabel = 'उधार (Credit)';
      if (type === 'DEBIT') typeLabel = 'जमा (Debit)';
      if (type === 'ADVANCE') typeLabel = 'एडवांस जमा (Advance)';

      onSuccess(`${typeLabel} ₹${numAmount.toLocaleString('en-IN')} सफलतापूर्वक दर्ज किया गया।`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record entry');
    } finally {
      setSubmitting(false);
    }
  };

  const isCredit = type === 'CREDIT';
  const isAdvance = type === 'ADVANCE';
  const isDebit = type === 'DEBIT';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0"></div>

        {/* Header - RED for Credit, GREEN for Debit, CYAN for Advance */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between text-white shrink-0 ${
            isCredit ? 'bg-rose-600' : isAdvance ? 'bg-cyan-700' : 'bg-emerald-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {isCredit ? (
              <TrendingUp className="w-5 h-5 shrink-0" />
            ) : isAdvance ? (
              <PiggyBank className="w-5 h-5 shrink-0" />
            ) : (
              <TrendingDown className="w-5 h-5 shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {isCredit
                  ? 'सामान दिया / उधार (Credit Entry)'
                  : isAdvance
                  ? 'एडवांस जमा / पेशगी (Advance Deposit)'
                  : 'रुपये मिले / जमा (Payment Debit)'}
              </h3>
              <p className="text-[11px] opacity-90">
                {isCredit
                  ? 'ग्राहक के खाते में उधार जोड़ेगा (लेना बाकी)'
                  : isAdvance
                  ? 'ग्राहक का अग्रिम जमा (ग्राहकीय एडवांस शेष रहेगा)'
                  : 'ग्राहक के खाते में से बाकी उधार कम करेगा'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Smooth Scrolling */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {errorMessage}
            </div>
          )}

          {/* 3-Way Type Toggle: Udhar (RED) vs Jama (GREEN) vs Advance (CYAN) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('CREDIT')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                isCredit ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>उधार (Credit)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('DEBIT')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                isDebit ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>जमा (Payment)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('ADVANCE')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                isAdvance ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              <span>एडवांस (Advance)</span>
            </button>
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ग्राहक चुनें (Select Customer) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="">-- ग्राहक चुनें (Choose Customer) --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone}) ·{' '}
                  {(c.balance || 0) > 0
                    ? `उधार बाकी: ₹${(c.balance || 0).toLocaleString('en-IN')}`
                    : (c.balance || 0) < 0
                    ? `एडवांस जमा: ₹${Math.abs(c.balance || 0).toLocaleString('en-IN')}`
                    : 'हिसाब बराबर'}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Field with Big Indian Currency Display */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              राशि (Amount in ₹) <span className="text-rose-500">*</span>
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
                placeholder="0.00"
                className={`block w-full min-h-[50px] pl-10 pr-4 text-xl font-bold font-mono border rounded-xl focus:ring-2 bg-white ${
                  isCredit
                    ? 'border-rose-300 focus:ring-rose-500 text-rose-700'
                    : isAdvance
                    ? 'border-cyan-300 focus:ring-cyan-500 text-cyan-800'
                    : 'border-emerald-300 focus:ring-emerald-500 text-emerald-700'
                }`}
              />
            </div>

            {/* Quick Currency Chips (+50, +100, +200, +500, +1000, +2000) */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">त्वरित राशि:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => addQuickAmount(q)}
                  className="min-h-[32px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer"
                >
                  +{q}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="min-h-[32px] px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* If Credit: Optional Product Catalog Picker & Quick Items */}
          {isCredit && (
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  दुकान उत्पाद चुनें (Select Catalog Item - Optional)
                </label>
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white"
                >
                  <option value="">-- उत्पाद सूची से चुनें (Optional) --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} · ₹{p.price.toLocaleString('en-IN')} ({p.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Kirana Shortcuts Chips */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                  किराना त्वरित सामान (Quick Items):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickKiranaItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => selectQuickItem(item)}
                      className="min-h-[32px] px-2 py-1 rounded-lg border border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-50/50 text-[11px] text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3 text-rose-500" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector (For Debit or Advance) */}
          {(isDebit || isAdvance) && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                भुगतान का माध्यम (Payment Method)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                    paymentMode === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>नकद (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI / QR')}
                  className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                    paymentMode === 'UPI / QR'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('Bank Transfer')}
                  className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                    paymentMode === 'Bank Transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Bank / Cheque</span>
                </button>
              </div>
            </div>
          )}

          {/* Item Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                विवरण (Description) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isCredit
                    ? 'उदा. आटा, दाल, तेल'
                    : isAdvance
                    ? 'उदा. अगले महीने का एडवांस जमा'
                    : 'उदा. नकद भुगतान प्राप्त'
                }
                className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">तारीख (Date)</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 font-mono"
              />
            </div>
          </div>

          {/* Reference / Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              रिफरेंस / पर्ची नंबर / नोट (Optional)
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="उदा. बिल #102, UPI Ref ID..."
              className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 font-mono"
            />
          </div>

          {/* Footer Submit Bar with Distinct Colors */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`min-h-[44px] px-6 py-2.5 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-sm ${
                isCredit
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : isAdvance
                  ? 'bg-cyan-700 hover:bg-cyan-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting
                ? 'दर्ज हो रहा है...'
                : isCredit
                ? 'उधार जोड़ें (Credit)'
                : isAdvance
                ? 'एडवांस जमा करें (Advance)'
                : 'जमा करें (Payment Debit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
