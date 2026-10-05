import React, { useState } from 'react';
import {
  Store,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Phone,
  Mail,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { api, User as UserType, Customer as CustomerType, setStoredToken } from '../services/api.ts';
import { useLanguage, LanguageSelector } from '../context/LanguageContext.tsx';
import { LegalModal } from './LegalModals.tsx';

interface LoginViewProps {
  onLoginSuccess: (user: UserType, customer: CustomerType | null) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Clean empty state — No demo auto-fills!
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // Public registration is strictly for customers only
  const role = 'customer';

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Legal modal state
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया मोबाइल नंबर या ईमेल और पासवर्ड दर्ज करें।'
          : 'Please enter your mobile number or email and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login(identifier.trim(), password);
      setStoredToken(res.data.token);
      onLoginSuccess(res.data.user, res.data.customer);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'hi'
            ? 'लॉगिन विफल रहा। कृपया अपना मोबाइल नंबर/ईमेल और पासवर्ड जांचें।'
            : 'Login failed. Please verify your mobile number/email and password.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !phone.trim() || !password) {
      setErrorMessage(
        lang === 'hi'
          ? 'कृपया नाम, मोबाइल नंबर और पासवर्ड दर्ज करें।'
          : 'Please enter name, mobile number, and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
      });
      setStoredToken(res.data.token);
      onLoginSuccess(res.data.user, res.data.customer);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'hi' ? 'पंजीकरण विफल रहा।' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Header with Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <LanguageSelector />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-xl mb-3">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {t('appTitle')}
        </h1>
        <p className="mt-1 text-xs text-slate-400">{t('appSubtitle')}</p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-200">
          {/* Mode Switch: Sign In vs Register */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`min-h-[40px] rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              {t('login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`min-h-[40px] rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              {t('register')}
            </button>
          </div>

          {/* Error & Success Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <span className="font-bold">{lang === 'hi' ? 'त्रुटि:' : 'Error:'}</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM (Clean Empty Inputs, No Auto-fill) */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('mobileOrEmail')}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('mobilePlaceholder')}
                    className="block w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('password')}</label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="block w-full min-h-[44px] pl-9 pr-10 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading
                  ? lang === 'hi'
                    ? 'सत्यापित हो रहा है...'
                    : 'Signing In...'
                  : t('login')}
              </button>
            </form>
          )}

          {/* REGISTER FORM (Clean Empty Inputs, No Auto-fill) */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs" autoComplete="off">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('fullName')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                    className="block w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('mobileNumber')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="block w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('optionalEmail')}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('password')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      lang === 'hi' ? 'कम से कम 6 अक्षर' : 'At least 6 characters'
                    }
                    className="block w-full min-h-[44px] pl-9 pr-10 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'hi'
                    ? 'ग्राहक खाता (Customer Khata) — केवल ग्राहक पंजीकरण उपलब्ध है। दुकानदार एडमिन खाते पहले से अधिकृत हैं।'
                    : 'Customer Khata — Public registration is for customer accounts only. Storekeeper admin access is restricted.'}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading
                  ? lang === 'hi'
                    ? 'खाता बन रहा है...'
                    : 'Creating Account...'
                  : lang === 'hi'
                  ? 'ग्राहक खाता बनाएं'
                  : 'Register Customer Account'}
              </button>
            </form>
          )}

          {/* Legal Agreement Notice */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500">
            <span>{t('legalNotice')}</span>
            <div className="mt-1.5 flex items-center justify-center gap-3 font-semibold text-indigo-600">
              <button
                type="button"
                onClick={() => setLegalModalType('privacy')}
                className="hover:underline cursor-pointer"
              >
                {t('privacyPolicy')}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLegalModalType('terms')}
                className="hover:underline cursor-pointer"
              >
                {t('termsConditions')}
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('secureLogin')}</span>
        </div>
      </div>

      {/* Privacy Policy & Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};
