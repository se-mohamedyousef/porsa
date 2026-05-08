'use client';

import { useState } from 'react';
import { Bell, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function SimpleAlerts({ userId, language }) {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { t } = useLanguageSimple();
  const [formData, setFormData] = useState({
    symbol: '',
    condition: 'above',
    targetPrice: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.targetPrice || !formData.email) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'add_alert',
          alert: {
            id: `alert_${Date.now()}`,
            symbol: formData.symbol.toUpperCase(),
            condition: formData.condition,
            targetPrice: parseFloat(formData.targetPrice),
            email: formData.email,
            active: true,
            createdAt: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const newAlert = {
          id: `alert_${Date.now()}`,
          symbol: formData.symbol.toUpperCase(),
          condition: formData.condition,
          targetPrice: parseFloat(formData.targetPrice),
          email: formData.email,
          active: true
        };
        setAlerts([...alerts, newAlert]);
        setFormData({ symbol: '', condition: 'above', targetPrice: '', email: '' });
        setShowForm(false);
        alert('Alert set successfully!');
      }
    } catch (error) {
      console.error('Error setting alert:', error);
      alert('Failed to set alert');
    }
  };

  const handleDelete = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  return (
    <div className="pb-24 space-y-4">
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-black text-gray-900 dark:text-white px-4">{t('activeAlerts')} ({alerts.length})</h3>
          {alerts.map((alert, index) => (
            <div 
              key={alert.id}
              className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200 dark:border-red-400/30 flex items-center justify-between mx-4 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                  <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-lg">{alert.symbol}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    {alert.condition === 'above' ? '📈 Price ↑ above' : '📉 Price ↓ below'} <span className="font-black text-red-600 dark:text-red-400">{alert.targetPrice} EGP</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                className="p-2 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 rounded-lg transition-all transform hover:scale-110 active:scale-95"
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
          onClick={() => setShowForm(true)}
          className="mx-4 w-[calc(100%-2rem)] px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-black text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
        >
          <Plus size={24} />
          {t('addNewAlert')}
        </button>
      ) : (
        <div className="mx-4 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600 p-6 space-y-4 shadow-lg">
          <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            {t('setNewAlert')}
          </h3>

          {/* Stock Symbol */}
          <div>
            <label className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">{t('whichStock')}</label>
            <input
              type="text"
              placeholder="e.g., EBANK"
              value={formData.symbol}
              onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
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
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-black text-sm hover:bg-gray-400 dark:hover:bg-slate-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              {t('setAlert')}
            </button>
          </div>
        </div>
      )}

      {alerts.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">🔔</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No alerts set yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Get notified when stock prices change</p>
        </div>
      )}
    </div>
  );
}
