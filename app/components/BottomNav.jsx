'use client';

import { Home, AlertCircle, User, Lightbulb, Activity } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function BottomNav({ onTabChange, activeTab = 'home' }) {
  const { t } = useLanguageSimple();
  
  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'market', icon: Activity, label: t('liveMarket') },
    { id: 'recommendations', icon: Lightbulb, label: t('recommendations') },
    { id: 'alerts', icon: AlertCircle, label: t('alerts') },
    { id: 'profile', icon: User, label: t('me') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center py-2 sm:py-3 px-1 sm:px-2 shadow-2xl backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 gap-0.5 sm:gap-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-300 transform flex-1 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 bg-gradient-to-b from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 scale-110 shadow-md'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:scale-105'
            }`}
          >
            <Icon size={20} className="mb-0.5 sm:mb-1 transition-transform sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap leading-tight text-center max-w-[4.5rem] sm:max-w-none truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
