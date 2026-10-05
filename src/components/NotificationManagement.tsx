import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  Radio,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Customer, NotificationItem, api } from '../services/api.ts';

interface NotificationManagementProps {
  preselectedCustomer?: Customer | null;
}

export const NotificationManagement: React.FC<NotificationManagementProps> = ({
  preselectedCustomer,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [target, setTarget] = useState<'single' | 'multiple' | 'all'>(
    preselectedCustomer ? 'single' : 'all'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomer?._id || '');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [type, setType] = useState('Payment Reminder');
  const [priority, setPriority] = useState('Normal');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notificationTypes = [
    'General',
    'Payment Reminder',
    'Credit Update',
    'Debit Update',
    'Product Update',
    'Important',
    'System',
    'Offer',
    'Due Payment',
  ];

  const priorities = ['Normal', 'Medium', 'High', 'Urgent'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsRes, custsRes] = await Promise.all([
        api.notifications.getAll(),
        api.customers.getAll({ limit: 200, status: 'active' }),
      ]);
      setNotifications(notifsRes.data.notifications);
      setCustomers(custsRes.data.customers);

      if (!selectedCustomerId && custsRes.data.customers.length > 0) {
        setSelectedCustomerId(custsRes.data.customers[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    if (!title.trim() || !message.trim()) {
      setActionMessage({ type: 'error', text: 'Title and message cannot be empty' });
      return;
    }

    setSending(true);
    try {
      await api.notifications.send({
        target,
        customerId: target === 'single' ? selectedCustomerId : undefined,
        customerIds: target === 'multiple' ? selectedCustomerIds : undefined,
        type,
        title: title.trim(),
        message: message.trim(),
        priority,
      });

      setActionMessage({ type: 'success', text: 'Notification dispatched successfully.' });
      setTitle('');
      setMessage('');
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.delete(id);
      setNotifications(notifications.filter((n) => n._id !== id));
      setActionMessage({ type: 'success', text: 'Notification deleted from system.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete' });
    }
  };

  const toggleMultiCustomer = (cId: string) => {
    if (selectedCustomerIds.includes(cId)) {
      setSelectedCustomerIds(selectedCustomerIds.filter((id) => id !== cId));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, cId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Notification Center</h2>
        <p className="text-xs text-slate-500 mt-1">
          Broadcast announcements, payment reminders, and credit/debit alerts to customer accounts.
        </p>
      </div>

      {/* Alert banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
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
            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Grid: Compose on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Send className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Compose New Dispatch</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            {/* Target Radio Selection */}
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Recipient Target</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`py-1.5 font-semibold rounded text-[11px] transition-all cursor-pointer ${
                    target === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Customers
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('single')}
                  className={`py-1.5 font-semibold rounded text-[11px] transition-all cursor-pointer ${
                    target === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('multiple')}
                  className={`py-1.5 font-semibold rounded text-[11px] transition-all cursor-pointer ${
                    target === 'multiple' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Multiple
                </button>
              </div>
            </div>

            {/* Target Selectors */}
            {target === 'single' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {target === 'multiple' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Recipients ({selectedCustomerIds.length} chosen)
                </label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {customers.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCustomerIds.includes(c._id)}
                        onChange={() => toggleMultiCustomer(c._id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{c.name} ({c.customerCode})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {notificationTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Notification Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Payment Reminder: Due in 3 days"
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">Message Body</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your outstanding payment is due soon. Please contact our office or submit payment via NEFT/UPI."
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : 'Send Notification'}</span>
            </button>
          </form>
        </div>

        {/* History Table (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sent Notification History</h3>
              <p className="text-[11px] text-slate-500">Log of messages transmitted to customer portals</p>
            </div>
            <button
              onClick={loadData}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[580px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications dispatched yet.
              </div>
            ) : (
              notifications.map((n) => {
                const isBroadcast = n.isBroadcast || !n.customerId;
                const custName = (n.customerId as Customer)?.name || (isBroadcast ? 'ALL CUSTOMERS (Broadcast)' : 'Customer');

                return (
                  <div key={n._id} className="p-4 hover:bg-slate-50 transition-colors text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{n.title}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              n.priority === 'Urgent' || n.priority === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {n.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Recipient: <span className="font-semibold text-slate-700">{custName}</span> · {n.type}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {n.message}
                    </p>
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
