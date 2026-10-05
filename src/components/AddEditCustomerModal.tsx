import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, KeyRound, CheckCircle2 } from 'lucide-react';
import { Customer, api } from '../services/api.ts';

interface AddEditCustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({
  customer,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!customer;

  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [customerCode, setCustomerCode] = useState(customer?.customerCode || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [city, setCity] = useState(customer?.city || '');
  const [state, setState] = useState(customer?.state || '');
  const [pincode, setPincode] = useState(customer?.pincode || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(customer?.status || 'active');
  const [password, setPassword] = useState('Customer@123456');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (isEditing && customer) {
        await api.customers.update(customer._id, {
          name,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          status,
        });
        onSuccess(`Customer ${name} updated successfully.`);
      } else {
        await api.customers.create({
          name,
          email,
          phone,
          customerCode: customerCode || undefined,
          address,
          city,
          state,
          pincode,
          status,
          password,
        });
        onSuccess(`Customer ${name} and customer portal account created.`);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? `Edit Customer: ${customer?.name}` : 'Register New Customer'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing
                  ? 'Update customer details and contact information'
                  : 'Creates customer master record and customer portal login'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Code</label>
              <input
                type="text"
                disabled={isEditing}
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                placeholder="Auto-generated (e.g. CUST-1005)"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase bg-slate-50 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, street, suite number"
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="400001"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          {!isEditing && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <label className="block font-medium text-indigo-950 mb-1">
                Initial Portal Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-indigo-200 rounded-lg p-1.5 font-mono text-xs bg-white text-slate-900"
              />
              <span className="text-[10px] text-indigo-700 mt-1 block">
                The customer can use this password to sign in to their Customer Portal.
              </span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="active">Active (Full access to credit transactions)</option>
              <option value="inactive">Inactive (Suspended)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
