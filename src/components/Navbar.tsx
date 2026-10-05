import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  KeyRound,
  ArrowLeftRight,
  Store,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { User, Customer, NotificationItem, api } from '../services/api.ts';
import { useLanguage, LanguageSelector } from '../context/LanguageContext.tsx';

interface NavbarProps {
  currentUser: User | null;
  customerData: Customer | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onRefreshNotifications: () => void;
  onLogout: () => void;
  onStopImpersonating?: () => void;
  onChangePasswordOpen: () => void;
  onOpenNotifications: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onReload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  customerData,
  notifications,
  unreadCount,
  onRefreshNotifications,
  onLogout,
  onStopImpersonating,
  onChangePasswordOpen,
  onOpenNotifications,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onReload,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleManualReload = () => {
    setIsReloading(true);
    if (onReload) onReload();
    setTimeout(() => setIsReloading(false), 800);
  };

  const isImpersonating = currentUser?.isImpersonating;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="truncate">
              Viewing as Customer: <strong>{customerData?.name || currentUser?.name}</strong>{' '}
              ({customerData?.customerCode || 'PORTAL'})
            </span>
          </div>
          <button
            onClick={onStopImpersonating}
            className="min-h-[36px] flex items-center gap-1 bg-slate-950 text-white px-2.5 py-1 rounded text-xs hover:bg-slate-800 transition-colors font-medium whitespace-nowrap cursor-pointer shrink-0 ml-2"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Return to</span> Admin
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: Mobile Toggle & Store Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  Kirana Khata Book
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  {currentUser?.role === 'admin' && !isImpersonating
                    ? 'दुकानदार खाता (General Store)'
                    : 'ग्राहक खाता (Customer Ledger)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Switcher (English / Hindi) */}
            <LanguageSelector className="hidden sm:inline-flex mr-1" />

            {/* Direct Sync / Reload Button */}
            <button
              onClick={handleManualReload}
              disabled={isReloading}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="रीलोड / डाटा सिंक (Reload / Sync Data)"
              aria-label="Reload and sync data"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isReloading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Notification Bell with 44x44px Touch Target */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center relative rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-88 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications to display
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                            !notif.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900 line-clamp-1">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        onOpenNotifications();
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile with Touch Target */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="min-h-[44px] flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="font-semibold text-slate-900 truncate max-w-[120px]">
                    {currentUser?.name}
                  </div>
                  <div className="text-slate-500 text-[10px] capitalize">
                    {isImpersonating ? 'Admin (Acting)' : currentUser?.role}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span className="font-medium capitalize">{currentUser?.role} Account</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onChangePasswordOpen();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Change Password
                  </button>

                  {isImpersonating && onStopImpersonating && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onStopImpersonating();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer min-h-[44px]"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                      Exit Customer View
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <div className="px-4 py-2 flex items-center justify-between sm:hidden">
                    <span className="text-[11px] text-slate-500 font-medium">भाषा / Lang:</span>
                    <LanguageSelector />
                  </div>

                  <div className="border-t border-slate-100 my-1 sm:hidden"></div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
