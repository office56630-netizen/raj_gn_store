import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  Receipt,
  Package,
  Calendar,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'transactions' | 'products'>('customers');
  const [loading, setLoading] = useState(true);

  // Customer Report Data & Filters
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [balanceStatus, setBalanceStatus] = useState('all');

  // Transaction Report Data & Filters
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txnType, setTxnType] = useState('all');

  // Product Report Data
  const [productData, setProductData] = useState<any[]>([]);

  const fetchCustomerReport = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getCustomersReport({
        search: customerSearch,
        balanceStatus,
      });
      setCustomerData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionReport = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getTransactionsReport({
        startDate,
        endDate,
        type: txnType,
      });
      setTransactionData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReport = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getProductsReport();
      setProductData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'customers') fetchCustomerReport();
    else if (activeTab === 'transactions') fetchTransactionReport();
    else if (activeTab === 'products') fetchProductReport();
  }, [activeTab, customerSearch, balanceStatus, startDate, endDate, txnType]);

  const formatCurrency = (val?: number) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  // CSV Export utility
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `credex-${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'customers') {
      headers = ['Customer ID', 'Customer Name', 'Phone', 'Email', 'City', 'Total Credit', 'Total Debit', 'Balance', 'Status'];
      rows = customerData.map((c) => [
        `"${c.customerCode}"`,
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        `"${c.city || ''}"`,
        `"${c.totalCredit}"`,
        `"${c.totalDebit}"`,
        `"${c.balance}"`,
        `"${c.status}"`,
      ]);
    } else if (activeTab === 'transactions') {
      headers = ['Date', 'Txn Code', 'Customer', 'Type', 'Product', 'Amount', 'Reference', 'Description'];
      rows = transactionData.map((t) => [
        `"${new Date(t.transactionDate).toLocaleDateString()}"`,
        `"${t.transactionCode}"`,
        `"${t.customerId?.name || ''}"`,
        `"${t.type}"`,
        `"${t.productName || ''}"`,
        `"${t.amount}"`,
        `"${t.referenceNumber || ''}"`,
        `"${t.description.replace(/"/g, '""')}"`,
      ]);
    } else if (activeTab === 'products') {
      headers = ['Product Code', 'Product Name', 'Category', 'Price', 'Transactions Count', 'Total Credit Volume', 'Total Debit Volume'];
      rows = productData.map((p) => [
        `"${p.productCode}"`,
        `"${p.name}"`,
        `"${p.category || ''}"`,
        `"${p.price}"`,
        `"${p.totalTransactions}"`,
        `"${p.totalCredit}"`,
        `"${p.totalDebit}"`,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Financial Reports & Auditing</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export balance sheets, transaction audit registries, and product volumes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Segmented Report Selector (No Print) */}
      <div className="flex rounded-lg bg-slate-100 p-1 text-xs no-print">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Customer Balance Report
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Transaction Audit Registry
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Product Performance Report
        </button>
      </div>

      {/* Filter Bar for Active Tab (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs no-print">
        {activeTab === 'customers' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer name, ID, phone..."
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={balanceStatus}
              onChange={(e) => setBalanceStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Balance States</option>
              <option value="outstanding">Outstanding Receivables (Balance &gt; 0)</option>
              <option value="settled">Settled Accounts (Balance = 0)</option>
              <option value="credit_advance">Advance Paid / Credit (Balance &lt; 0)</option>
            </select>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Entry Type</label>
              <select
                value={txnType}
                onChange={(e) => setTxnType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white text-slate-700"
              >
                <option value="all">All Transactions (Credit & Debit)</option>
                <option value="CREDIT">Credit Only</option>
                <option value="DEBIT">Debit Only</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="text-slate-500">
            Aggregated metrics of catalog products, sales volumes, and ledger debits/credits.
          </div>
        )}
      </div>

      {/* Report Printable Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-2 sm:p-4">
        {/* Printable Header */}
        <div className="hidden print-only mb-6 border-b border-black pb-3">
          <h1 className="text-xl font-bold">CredEx Financial Services</h1>
          <p className="text-xs text-gray-600">
            Report: {activeTab.toUpperCase()} | Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* 1. Customer Report Table */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3 text-right">Total Credit</th>
                  <th className="py-2.5 px-3 text-right">Total Debit</th>
                  <th className="py-2.5 px-3 text-right">Calculated Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading report data...</td>
                  </tr>
                ) : customerData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No customers found.</td>
                  </tr>
                ) : (
                  customerData.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{c.customerCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{c.phone}</td>
                      <td className="py-2.5 px-3 text-slate-600">{c.city}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {formatCurrency(c.totalCredit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-semibold">
                        {formatCurrency(c.totalDebit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(c.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Transaction Report Table */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Txn Code</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Ref #</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading transactions...</td>
                  </tr>
                ) : transactionData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No transactions recorded.</td>
                  </tr>
                ) : (
                  transactionData.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {new Date(t.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{t.transactionCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{t.customerId?.name || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.productName || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            t.type === 'CREDIT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{t.referenceNumber || '—'}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                          t.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Product Performance Report Table */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Product Code</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Standard Price</th>
                  <th className="py-2.5 px-3 text-center">Txn Count</th>
                  <th className="py-2.5 px-3 text-right">Total Credit Issued</th>
                  <th className="py-2.5 px-3 text-right">Total Debit Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading product report...</td>
                  </tr>
                ) : productData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No products found.</td>
                  </tr>
                ) : (
                  productData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{p.productCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(p.price)}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{p.totalTransactions}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {formatCurrency(p.totalCredit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700 font-semibold">
                        {formatCurrency(p.totalDebit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
