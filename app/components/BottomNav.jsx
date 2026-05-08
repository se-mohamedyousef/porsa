'use client';

import { useEffect, useState } from 'react';
import { Home, BarChart3, AlertCircle, User, Lightbulb } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function BottomNav({ onTabChange, activeTab = 'home' }) {
  const { t, language } = useLanguageSimple();
  
  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'stocks', icon: BarChart3, label: t('stocks') },
    { id: 'recommendations', icon: Lightbulb, label: t('recommendations') },
    { id: 'alerts', icon: AlertCircle, label: t('alerts') },
    { id: 'profile', icon: User, label: t('me') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center py-3 shadow-2xl backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 transform w-full ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 bg-gradient-to-b from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 scale-110 shadow-md'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:scale-105'
            }`}
          >
            <Icon size={24} className="mb-1 transition-transform" />
            <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
