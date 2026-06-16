'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Bell, Trash2, Plus, AlertTriangle, CheckCircle, AlertCircle as AlertIcon } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function SimpleAlerts({ userId, currentPrices = {}, portfolio = [], triggeredAlerts: autoAlerts = [] }) {
  const { t } = useLanguageSimple();

  const initialForm = {
    symbol: '',
    condition: 'above',
    targetPrice: '',
    email: ''
  };

  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(initialForm);

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const isTriggered = useCallback(
    (alert) => {
      const currentPrice = toNumber(currentPrices?.[alert.symbol]);
      const targetPrice = toNumber(alert.targetPrice);

      if (currentPrice == null || targetPrice == null) return false;
      if (alert.condition === 'above') return currentPrice >= targetPrice;
      return currentPrice <= targetPrice;
    },
    [currentPrices]
  );

  const triggeredAlerts = useMemo(
    () => alerts.filter((alert) => isTriggered(alert)),
    [alerts, isTriggered]
  );

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !isTriggered(alert)),
    [alerts, isTriggered]
  );

  // Fetch saved alerts on mount
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const userData = await response.json();

      if (userData.alerts && Array.isArray(userData.alerts)) {
        setAlerts(userData.alerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setErrorMessage('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    } else {
      setAlerts([]);
      setLoading(false);
    }
  }, [userId, fetchAlerts]);

  const validateForm = () => {
    const symbol = formData.symbol.trim().toUpperCase();
    const targetPrice = toNumber(formData.targetPrice);
    const email = formData.email.trim();

    if (!symbol) return 'Please enter a stock symbol.';
    if (!targetPrice || targetPrice <= 0) return 'Please enter a valid target price.';
    if (!email || !email.includes('@')) return 'Please enter a valid email address.';
    return '';
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setErrorMessage('');
    setSaving(true);

    const alertId = `alert_${Date.now()}`;
    const newAlert = {
      id: alertId,
      symbol: formData.symbol.trim().toUpperCase(),
      condition: formData.condition,
      targetPrice: Number(formData.targetPrice),
      email: formData.email.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add_alert',
          alert: newAlert
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save alert');
      }

      setAlerts((prev) => [...prev, newAlert]);
      setFormData(initialForm);
      setShowForm(false);
    } catch (error) {
      console.error('Error setting alert:', error);
      setErrorMessage('Failed to set alert. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alertId) => {
    const previousAlerts = alerts;
    const updatedAlerts = alerts.filter((a) => a.id !== alertId);
    setAlerts(updatedAlerts);
    setErrorMessage('');

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'update_alerts',
          alerts: updatedAlerts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      setAlerts(previousAlerts);
      setErrorMessage('Could not delete alert. Please try again.');
    }
  };

  const handleOpenForm = () => {
    setFormError('');
    setErrorMessage('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormError('');
    setFormData(initialForm);
  };

  if (loading) {
    return (
      <div className="pb-6 space-y-4">
        <div className="mx-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 space-y-4">
      {/* Summary */}
      <div className="mx-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              {t('priceAlerts') || 'Price Alerts'}
            </p>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
              {alerts.length} total • {activeAlerts.length} active • {triggeredAlerts.length} triggered
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
            <Bell className="w-5 h-5 text-red-600 dark:text-red-300" />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Auto-Triggered Alerts from Portfolio Monitoring */}
      {autoAlerts && autoAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-black text-red-900 dark:text-red-200 px-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Portfolio Alerts
          </h3>
          {autoAlerts.map((alert, idx) => (
            <div
              key={alert.id || idx}
              className={`rounded-xl p-4 border-2 flex items-start gap-3 mx-4 shadow-md ${
                alert.severity === 'critical'
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/40 dark:to-pink-900/40 border-red-400 dark:border-red-500'
                  : alert.severity === 'success'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-green-400 dark:border-green-500'
                    : alert.severity === 'warning'
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 border-amber-400 dark:border-amber-500'
                      : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-200 dark:bg-red-800/60' :
                alert.severity === 'success' ? 'bg-green-200 dark:bg-green-800/60' :
                alert.severity === 'warning' ? 'bg-amber-200 dark:bg-amber-800/60' :
                'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                {alert.severity === 'critical' ? '🔴' : alert.severity === 'success' ? '🎯' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{alert.message}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alert.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Triggered Alerts (High Priority) */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-black text-amber-900 dark:text-amber-200 px-4 flex items-center gap-2">
            <AlertIcon className="w-5 h-5" />
            🔥 {t('alerts')} Triggered!
          </h3>
          {triggeredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-xl p-4 border-2 border-amber-400 dark:border-amber-500 flex items-center justify-between mx-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-200 dark:bg-amber-800/60 rounded-lg">
                  <AlertIcon className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="font-black text-amber-900 dark:text-amber-100 text-lg">{alert.symbol} ⚡ TARGET HIT!</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-semibold">
                    Current: {toNumber(currentPrices[alert.symbol])?.toFixed(2) || '—'} EGP | Target: {toNumber(alert.targetPrice)?.toFixed(2)} EGP
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="p-2 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-700 dark:text-amber-300 rounded-lg transition-colors"
                title="Mark as done"
              >
                <CheckCircle size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-black text-gray-900 dark:text-white px-4">
            {t('activeAlerts') || 'Active Alerts'} ({activeAlerts.length})
          </h3>
          {activeAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-400/30 flex items-center justify-between mx-4 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-lg">{alert.symbol}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    {alert.condition === 'above' ? 'Price above' : 'Price below'} <span className="font-black text-blue-600 dark:text-blue-400">{toNumber(alert.targetPrice)?.toFixed(2)} EGP</span>
                    {toNumber(currentPrices[alert.symbol]) != null && ` (Current: ${toNumber(currentPrices[alert.symbol]).toFixed(2)})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                title="Delete alert"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Alerts Message */}
      {alerts.length === 0 && !showForm && (
        <div className="mx-4 text-center py-8">
          <div className="text-5xl mb-3">🔔</div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg">{t('noAlerts')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('setAlerts')}</p>
        </div>
      )}

      {/* Add Alert Button/Form */}
      {!showForm ? (
        <button
          onClick={handleOpenForm}
          className="mx-4 w-[calc(100%-2rem)] px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-black text-lg transition-colors flex items-center justify-center gap-2 shadow-xl"
        >
          <Plus size={24} />
          {t('addNewAlert')}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mx-4 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600 p-6 space-y-4 shadow-lg">
          <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            {t('setNewAlert')}
          </h3>

          {formError && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
              {formError}
            </div>
          )}

          {/* Stock Symbol */}
          <div>
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">{t('whichStock')}</label>
            <input
              type="text"
              placeholder="e.g., EBANK"
              value={formData.symbol}
              onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              maxLength={10}
            />
          </div>

          {/* Condition */}
          <div>
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">{t('alertWhen')}</label>
            <select
              value={formData.condition}
              onChange={e => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="above">{t('priceGoesAbove')}</option>
              <option value="below">{t('priceGoesBelow')}</option>
            </select>
          </div>

          {/* Target Price */}
          <div>
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">{t('targetPrice')}</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g., 50.00"
              value={formData.targetPrice}
              onChange={e => setFormData({ ...formData, targetPrice: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">{t('email')}</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseForm}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-black text-sm hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors"
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-60 text-white rounded-xl font-black text-sm transition-colors shadow-lg"
              disabled={saving}
            >
              {saving ? 'Saving...' : t('setAlert')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
