'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, LogOut, Bell, Shield, Settings, Lock, Eye, EyeOff, Mail, Phone, Calendar, CheckCircle, AlertCircle, ChevronRight, Copy, Download } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function SimpleProfile({ user, onLogout, language: langProp }) {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [copied, setCopied] = useState(false);
  const { t, changeLanguage, isRTL, language, toggleTheme, theme } = useLanguageSimple();

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('porsaCurrentUser');
      onLogout?.();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sectionTranslations = {
    account: t('account'),
    security: t('security'),
    notifications: t('notifications'),
    preferences: t('preferences'),
    about: t('about'),
  };

  return (
    <div className={`min-h-screen pb-24 space-y-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Profile Card - Premium */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 px-4 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-4 relative z-10 mb-6`}>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-400 dark:from-yellow-400 dark:to-orange-500 flex items-center justify-center text-4xl shadow-lg border-4 border-white/20">
            👤
          </div>
          <div>
            <h2 className="text-3xl font-black text-white drop-shadow-lg">{user?.name || t('profile') || 'User'}</h2>
            <p className="text-sm text-white/80 font-bold">Premium Member ✨</p>
          </div>
        </div>

        {/* User Stats */}
        <div className={`grid grid-cols-3 gap-2 relative z-10`}>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Portfolio</p>
            <p className="text-2xl font-black text-white">0 EGP</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Stocks</p>
            <p className="text-2xl font-black text-white">0</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Return</p>
            <p className="text-2xl font-black text-white text-green-300">0%</p>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-20">
        <div className={`flex gap-1 px-4 py-3 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
          {['account', 'security', 'notifications', 'preferences', 'about'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all transform hover:scale-105 ${
                activeSection === section
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {sectionTranslations[section]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4 pt-4">
        {/* ACCOUNT SECTION */}
        {activeSection === 'account' && (
          <div className="space-y-4">
            {/* Profile Info Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-5 border-2 border-blue-200 dark:border-blue-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 mb-4`}>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                  <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide mb-1">{t('phone') || 'Phone Number'}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{user?.phoneNumber || user?.phone || '—'}</p>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(user?.phoneNumber || user?.phone)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                {copied ? t('saved') || 'Copied!' : t('success') || 'Copy'}
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-5 border-2 border-purple-200 dark:border-purple-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 mb-4`}>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">May 7, 2026</p>
                </div>
              </div>
              <div className="w-full py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                Account Verified
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3">
              <Settings size={20} />
              Edit Profile
            </button>
          </div>
        )}

        {/* SECURITY SECTION */}
        {activeSection === 'security' && (
          <div className="space-y-4">
            {/* Change Password */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-3xl p-5 border-2 border-red-200 dark:border-red-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 mb-4`}>
                <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl">
                  <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-red-700 dark:text-red-300 font-bold uppercase tracking-wide mb-1">Password</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">••••••••</p>
                </div>
              </div>
              <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all">
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-3xl p-5 border-2 border-emerald-200 dark:border-emerald-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 flex-1`}>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wide mb-1">Two-Factor Auth</p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Disable</p>
                  </div>
                </div>
                <button className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-gray-600 shadow-md transition-all">
                  <span className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg translate-x-1" />
                </button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-3xl p-5 border-2 border-sky-200 dark:border-sky-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 mb-4`}>
                <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-2xl">
                  <AlertCircle className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-sky-700 dark:text-sky-300 font-bold uppercase tracking-wide mb-1">Active Sessions</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">1 Device</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">macOS • Last active now</p>
                </div>
              </div>
              <button className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-sm transition-all">
                Logout All Devices
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeSection === 'notifications' && (
          <div className="space-y-4">
            {/* Push Notifications */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-3xl p-5 border-2 border-orange-200 dark:border-orange-700 flex items-center justify-between">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 flex-1`}>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-2xl">
                  <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Get alerts on your device</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                  notifications ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-5 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-between">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 flex-1`}>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Receive important updates</p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                  emailNotifications ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${emailNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Price Alerts */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-5 border-2 border-purple-200 dark:border-purple-700 flex items-center justify-between">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 flex-1`}>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl">
                  <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Price Alerts</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Notify when prices change</p>
                </div>
              </div>
              <button
                onClick={() => setPriceAlerts(!priceAlerts)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                  priceAlerts ? 'bg-gradient-to-r from-emerald-600 to-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${priceAlerts ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* PREFERENCES SECTION */}
        {activeSection === 'preferences' && (
          <div className="space-y-4">
            {/* Dark Mode */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 flex-1`}>
                <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                  {theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{theme === 'dark' ? 'On' : 'Off'}</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                  theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-yellow-300 to-yellow-400'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Language */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-5 border-2 border-purple-200 dark:border-purple-700">
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 mb-4`}>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl">
                  <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">Language</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{language === 'en' ? 'English' : 'العربية'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-4 py-3 rounded-xl font-black text-sm transition-all transform hover:scale-105 ${
                    language === 'en'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-slate-600'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={`px-4 py-3 rounded-xl font-black text-sm transition-all transform hover:scale-105 ${
                    language === 'ar'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-slate-600'
                  }`}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT SECTION */}
        {activeSection === 'about' && (
          <div className="space-y-4">
            {/* App Version */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-5 border-2 border-indigo-200 dark:border-indigo-700">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wide mb-2">App Version</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mb-3">1.0.0</p>
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Download size={16} />
                Check for Updates
              </button>
            </div>

            {/* About */}
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-3xl p-5 border-2 border-sky-200 dark:border-sky-700">
              <p className="text-xs text-sky-700 dark:text-sky-300 font-bold uppercase tracking-wide mb-3">About Porsa</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-4">
                Porsa is your premium EGX portfolio tracker powered by AI-driven insights. Manage your Egyptian stocks with confidence and get real-time recommendations.
              </p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-sm transition-all">
                  Privacy Policy
                </button>
                <button className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-sm transition-all">
                  Terms of Service
                </button>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-3xl p-5 border-2 border-teal-200 dark:border-teal-700">
              <p className="text-xs text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wide mb-2">Support</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-3">Need help? Contact our support team</p>
              <button className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition-all">
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Button - Fixed at Bottom */}
      <div className="px-4 pb-4 sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
        >
          <LogOut size={24} />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-sm font-black text-transparent bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text">Porsa © 2026</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">EGX Portfolio Tracker</p>
      </div>
    </div>
  );
}
