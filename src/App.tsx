import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  Package,
  Bell,
  FileSpreadsheet,
  ShieldAlert,
  LogOut,
  KeyRound,
  PlusCircle,
  Store,
  ChevronRight,
  Shield,
  User as UserIcon,
  Home,
  BookOpen,
  Menu,
} from 'lucide-react';
import {
  api,
  User,
  Customer,
  Transaction,
  NotificationItem,
  getStoredToken,
  clearStoredToken,
  saveAdminBackupToken,
  restoreAdminToken,
  setStoredToken,
} from './services/api.ts';

import { Navbar } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CustomerManagement } from './components/CustomerManagement.tsx';
import { CustomerAccountViewModal } from './components/CustomerAccountViewModal.tsx';
import { TransactionManagement } from './components/TransactionManagement.tsx';
import { AddTransactionModal } from './components/AddTransactionModal.tsx';
import { AddEditCustomerModal } from './components/AddEditCustomerModal.tsx';
import { ProductManagement } from './components/ProductManagement.tsx';
import { NotificationManagement } from './components/NotificationManagement.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { CustomerPortal } from './components/CustomerPortal.tsx';
import { TransactionDetailModal } from './components/TransactionDetailModal.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { LegalModal } from './components/LegalModals.tsx';

function AppContent() {
  const { lang, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  // Admin Active Tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'customers' | 'transactions' | 'products' | 'notifications' | 'reports' | 'audit-logs'>('dashboard');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Legal Modal
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Modals state
  const [accountViewCustomer, setAccountViewCustomer] = useState<Customer | null>(null);
  const [addTxnModal, setAddTxnModal] = useState<{ open: boolean; type: 'CREDIT' | 'DEBIT' | 'ADVANCE'; customerId?: string }>({
    open: false,
    type: 'CREDIT',
  });
  const [customerModal, setCustomerModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [notifTargetCustomer, setNotifTargetCustomer] = useState<Customer | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<Transaction | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const triggerDataRefresh = () => {
    setDataVersion((v) => v + 1);
    loadNotifications();
  };

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to prevent any infinite loading freeze
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoadingInitial(false);
    }, 3500);

    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        if (isMounted) setLoadingInitial(false);
        clearTimeout(safetyTimer);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (isMounted) {
          setCurrentUser(res.data.user);
          setCustomerData(res.data.customer);
          loadNotifications();
        }
      } catch (err) {
        clearStoredToken();
        if (isMounted) {
          setCurrentUser(null);
          setCustomerData(null);
        }
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) setLoadingInitial(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleLoginSuccess = (user: User, customer: Customer | null) => {
    setCurrentUser(user);
    setCustomerData(customer);
    loadNotifications();
    showToast(`लॉगिन सफल: ${user.name}`);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    clearStoredToken();
    setCurrentUser(null);
    setCustomerData(null);
  };

  const handleImpersonate = async (cust: Customer) => {
    try {
      const currentToken = getStoredToken();
      if (currentToken) {
        saveAdminBackupToken(currentToken);
      }

      const res = await api.auth.impersonate(cust._id);
      setStoredToken(res.data.token);

      const meRes = await api.auth.getMe();
      setCurrentUser(meRes.data.user);
      setCustomerData(meRes.data.customer);
      loadNotifications();
      showToast(`ग्राहक खाता दृश्य: ${cust.name}`);
    } catch (err: any) {
      showToast(`Impersonation failed: ${err.message}`);
    }
  };

  const handleStopImpersonating = async () => {
    const restored = restoreAdminToken();
    if (restored) {
      try {
        const meRes = await api.auth.getMe();
        setCurrentUser(meRes.data.user);
        setCustomerData(null);
        setAdminTab('customers');
        loadNotifications();
        showToast('दुकानदार एडमिन पैनल पर लौटे।');
      } catch (err) {
        clearStoredToken();
        setCurrentUser(null);
      }
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center text-slate-400 text-xs space-y-3">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span className="block font-medium">किराना खाता बही शुरू हो रही है...</span>
          <button
            onClick={() => {
              clearStoredToken();
              window.location.reload();
            }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            यदि लोड न हो तो रीलोड करें (Reset &amp; Reload)
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin' && !currentUser.isImpersonating;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        customerData={customerData}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefreshNotifications={loadNotifications}
        onLogout={handleLogout}
        onStopImpersonating={handleStopImpersonating}
        onChangePasswordOpen={() => setChangePasswordOpen(true)}
        onOpenNotifications={() => {
          if (isAdmin) setAdminTab('notifications');
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onReload={triggerDataRefresh}
      />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-5 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in max-w-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        ></div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6 pb-24 md:pb-8">
        {/* Admin Sidebar Navigation */}
        {isAdmin && (
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
              isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col justify-between p-4">
              <div className="space-y-4">
                {/* Store Header inside Drawer */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">किराना खाता बही</h4>
                      <span className="text-[10px] text-slate-500">जनरल स्टोर एडमिन</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Primary Navigation */}
                <nav className="space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setAdminTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'dashboard'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>डैशबोर्ड (Dashboard)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('customers');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'customers'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>ग्राहक खाता (Customers)</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('transactions');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'transactions'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>लेनदेन बही (Transactions)</span>
                  </button>

                  {/* Fast Action Buttons in Drawer */}
                  <div className="pt-2 pb-1 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      त्वरित प्रविष्टि (Quick Entry)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setAddTxnModal({ open: true, type: 'CREDIT' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                      <span>{lang === 'hi' ? '+ उधार सामान दिया' : '+ Add Credit Goods'}</span>
                    </div>
                    <span className="text-[10px] font-mono">CREDIT</span>
                  </button>

                  <button
                    onClick={() => {
                      setAddTxnModal({ open: true, type: 'DEBIT' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'hi' ? '+ रुपये जमा मिले' : '+ Received Payment'}</span>
                    </div>
                    <span className="text-[10px] font-mono">DEBIT</span>
                  </button>

                  <button
                    onClick={() => {
                      setAddTxnModal({ open: true, type: 'ADVANCE' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 transition-colors cursor-pointer mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-cyan-600" />
                      <span>{lang === 'hi' ? '+ एडवांस पेशगी जमा' : '+ Advance Deposit'}</span>
                    </div>
                    <span className="text-[10px] font-mono">ADVANCE</span>
                  </button>

                  <div className="border-t border-slate-100 my-2"></div>

                  <button
                    onClick={() => {
                      setAdminTab('products');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'products'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'किराना सामान सूची (Items)' : 'Items & Products'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('notifications');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'notifications'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'संदेश व तगादा (Notices)' : 'Reminders & Notices'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('reports');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'reports'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'खाता रिपोर्ट व प्रिंट (Reports)' : 'Ledger Reports & Print'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdminTab('audit-logs');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${
                      adminTab === 'audit-logs'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'सुरक्षा ऑडिट लॉग' : 'Security Audit Logs'}</span>
                  </button>
                </nav>
              </div>

              {/* Bottom Drawer Legal Links */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setLegalModal('privacy');
                    }}
                    className="hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    {t('privacyPolicy')}
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setLegalModal('terms');
                    }}
                    className="hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    {t('termsConditions')}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                  <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>सुरक्षित डेटाबेस · Rate Limited</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main View Area */}
        <main className="flex-1 min-w-0">
          {isAdmin ? (
            <>
              {adminTab === 'dashboard' && (
                <AdminDashboard
                  onNavigate={(tab) => setAdminTab(tab as any)}
                  onOpenAddCredit={(cId) => setAddTxnModal({ open: true, type: 'CREDIT', customerId: cId })}
                  onOpenAddDebit={(cId) => setAddTxnModal({ open: true, type: 'DEBIT', customerId: cId })}
                  onOpenAddAdvance={(cId) => setAddTxnModal({ open: true, type: 'ADVANCE', customerId: cId })}
                  onOpenAddCustomer={() => setCustomerModal({ open: true, customer: null })}
                  refreshTrigger={dataVersion}
                />
              )}

              {adminTab === 'customers' && (
                <CustomerManagement
                  onViewAccount={(c) => setAccountViewCustomer(c)}
                  onViewLedger={(c) => setAccountViewCustomer(c)}
                  onAddCredit={(cId) => setAddTxnModal({ open: true, type: 'CREDIT', customerId: cId })}
                  onAddDebit={(cId) => setAddTxnModal({ open: true, type: 'DEBIT', customerId: cId })}
                  onAddAdvance={(cId) => setAddTxnModal({ open: true, type: 'ADVANCE', customerId: cId })}
                  onSendNotification={(c) => {
                    setNotifTargetCustomer(c);
                    setAdminTab('notifications');
                  }}
                  onImpersonate={handleImpersonate}
                  onEditCustomer={(c) => setCustomerModal({ open: true, customer: c })}
                  onOpenAddCustomer={() => setCustomerModal({ open: true, customer: null })}
                  refreshTrigger={dataVersion}
                />
              )}

              {adminTab === 'transactions' && (
                <TransactionManagement
                  onOpenAddCredit={(cId) => setAddTxnModal({ open: true, type: 'CREDIT', customerId: cId })}
                  onOpenAddDebit={(cId) => setAddTxnModal({ open: true, type: 'DEBIT', customerId: cId })}
                  onOpenAddAdvance={(cId) => setAddTxnModal({ open: true, type: 'ADVANCE', customerId: cId })}
                  onViewTransaction={(t) => setTransactionDetail(t)}
                  refreshTrigger={dataVersion}
                />
              )}

              {adminTab === 'products' && <ProductManagement />}

              {adminTab === 'notifications' && (
                <NotificationManagement preselectedCustomer={notifTargetCustomer} />
              )}

              {adminTab === 'reports' && <ReportsView />}

              {adminTab === 'audit-logs' && <AuditLogsView />}
            </>
          ) : (
            <CustomerPortal
              customer={customerData}
              onOpenChangePassword={() => setChangePasswordOpen(true)}
              onViewTransactionDetail={(t) => setTransactionDetail(t)}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from Mobile Design Reference) */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden pb-safe shadow-lg">
          <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
            {/* 1. Dashboard */}
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                adminTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">डैशबोर्ड</span>
            </button>

            {/* 2. Customers / Khata */}
            <button
              onClick={() => setAdminTab('customers')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                adminTab === 'customers' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">खाता</span>
            </button>

            {/* 3. Center Big Quick Entry (+) Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => setAddTxnModal({ open: true, type: 'CREDIT' })}
                className="w-12 h-12 -mt-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                title="त्वरित लेनदेन"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
            </div>

            {/* 4. Transactions */}
            <button
              onClick={() => setAdminTab('transactions')}
              className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
                adminTab === 'transactions' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">लेनदेन</span>
            </button>

            {/* 5. More Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="min-h-[48px] flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 font-medium cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">मेन्यू</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {addTxnModal.open && (
        <AddTransactionModal
          initialType={addTxnModal.type}
          initialCustomerId={addTxnModal.customerId}
          onClose={() => setAddTxnModal({ open: false, type: 'CREDIT' })}
          onSuccess={(msg) => {
            showToast(msg);
            triggerDataRefresh();
          }}
        />
      )}

      {customerModal.open && (
        <AddEditCustomerModal
          customer={customerModal.customer}
          onClose={() => setCustomerModal({ open: false, customer: null })}
          onSuccess={(msg) => {
            showToast(msg);
            triggerDataRefresh();
          }}
        />
      )}

      {accountViewCustomer && (
        <CustomerAccountViewModal
          customer={accountViewCustomer}
          onClose={() => setAccountViewCustomer(null)}
          onAddCredit={(cId) => setAddTxnModal({ open: true, type: 'CREDIT', customerId: cId })}
          onAddDebit={(cId) => setAddTxnModal({ open: true, type: 'DEBIT', customerId: cId })}
          onAddAdvance={(cId) => setAddTxnModal({ open: true, type: 'ADVANCE', customerId: cId })}
          onSendNotification={(c) => {
            setNotifTargetCustomer(c);
            setAdminTab('notifications');
          }}
          onImpersonate={handleImpersonate}
        />
      )}

      {transactionDetail && (
        <TransactionDetailModal
          transaction={transactionDetail}
          onClose={() => setTransactionDetail(null)}
          isAdmin={currentUser?.role === 'admin'}
          onUpdateSuccess={(updatedTxn) => {
            setTransactionDetail(updatedTxn);
            triggerDataRefresh();
            showToast(lang === 'hi' ? 'बिल राशि व विवरण अपडेट किया गया!' : 'Bill amount updated successfully!');
          }}
        />
      )}

      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}

      {/* Global Privacy Policy & Terms Modal */}
      <LegalModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />

      {/* Global Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 mt-auto bg-white/60 no-print">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="hover:text-slate-900 underline underline-offset-2 cursor-pointer font-medium"
          >
            {t('privacyPolicy')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="hover:text-slate-900 underline underline-offset-2 cursor-pointer font-medium"
          >
            {t('termsConditions')}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          CredEx Kirana Store Digital Ledger © 2026 · Rate Limited &amp; Encrypted
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
