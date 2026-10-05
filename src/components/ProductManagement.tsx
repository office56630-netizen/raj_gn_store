import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Tag,
  DollarSign,
  X,
  ShoppingBag,
} from 'lucide-react';
import { Product, api } from '../services/api.ts';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Grains & Flour (अनाज और आटा)');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = useState(false);

  // Messages
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const kiranaCategories = [
    'Grains & Flour (अनाज और आटा)',
    'Edible Oils & Ghee (तेल और घी)',
    'Spices & Masala (मसाले)',
    'Dairy & Milk (डेयरी व दूध)',
    'Snacks & Biscuits (नाश्ता व बिस्कुट)',
    'Personal Care & Soaps (साबुन व शैम्पू)',
    'Household & Cleaning (डिटर्जेंट व सफाई)',
    'Beverages & Tea (चाय, कॉफी)',
    'General (अन्य सामान)',
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll({
        search,
        category: categoryFilter,
        status: statusFilter,
      });
      setProducts(res.data.products);
      setCategories(res.data.categories);
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setProductCode('');
    setPrice('');
    setCategory('Grains & Flour (अनाज और आटा)');
    setDescription('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setProductCode(p.productCode);
    setPrice(p.price.toString());
    setCategory(p.category || 'General');
    setDescription(p.description || '');
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setActionMessage({ type: 'error', text: 'मूल्य 0 या उससे अधिक होना चाहिए।' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.products.update(editingProduct._id, {
          name,
          price: numPrice,
          category,
          description,
          status,
        });
        setActionMessage({ type: 'success', text: `सामान ${name} का मूल्य/विवरण अपडेट हुआ।` });
      } else {
        await api.products.create({
          name,
          productCode: productCode || undefined,
          price: numPrice,
          category,
          description,
          status,
        });
        setActionMessage({ type: 'success', text: `किराना सामान ${name} सूची में जोड़ा गया।` });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'प्रक्रिया विफल रही' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`क्या आप ${product.name} को हटाना चाहते हैं?`)) return;

    try {
      const res = await api.products.delete(product._id);
      setActionMessage({ type: 'success', text: res.message || 'सामान हटाया गया।' });
      fetchProducts();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'नहीं हटाया जा सका' });
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
            किराना सामान व मूल्य सूची (Product Catalog)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            दुकान का सामान, श्रेणी और बिक्री मूल्य
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Reload List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openCreateModal}
            className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>नया सामान जोड़ें</span>
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

      {/* Search & Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="सामान का नाम खोजें (आटा, तेल, दाल)..."
            className="w-full min-h-[44px] pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[44px] text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700"
        >
          <option value="all">सभी श्रेणियां (All Categories)</option>
          {kiranaCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6 sm:col-span-2">
            सामान सूची लोड हो रही है...
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200 p-6 sm:col-span-2">
            कोई सामान नहीं मिला। "नया सामान जोड़ें"।
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                  {p.category}
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900 mt-1 block">
                  {formatCurrency(p.price)}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-rose-600 hover:text-rose-800 rounded-xl bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">कोड</th>
                <th className="py-3 px-4">सामान का नाम</th>
                <th className="py-3 px-4">श्रेणी (Category)</th>
                <th className="py-3 px-4 text-right">बिक्री मूल्य</th>
                <th className="py-3 px-4 text-center">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    सामान लोड हो रहे हैं...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    कोई सामान नहीं मिला।
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {p.productCode}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.name}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {p.category}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      {formatCurrency(p.price)}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-slide-up sm:animate-none">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'सामान सुधारें' : 'नया किराना सामान जोड़ें'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  सामान का नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. आशीर्वाद आटा 10kg, फॉर्च्यून तेल 1L"
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  बिक्री मूल्य (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="420"
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">श्रेणी (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2 bg-white"
                >
                  {kiranaCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">विवरण (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="पैकिंग साइज या ब्रांड"
                  className="w-full min-h-[44px] border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'सहेज रहे हैं...' : 'सहेजें (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
