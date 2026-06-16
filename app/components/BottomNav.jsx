'use client';

import { Home, AlertCircle, User, Activity, Bot, Star } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function BottomNav({ onTabChange, activeTab = 'home' }) {
  const { t } = useLanguageSimple();
  
  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'market', icon: Activity, label: t('liveMarket') },
    { id: 'recommendations', icon: Star, label: t('topPicks') },
    { id: 'ai-workspace', icon: Bot, label: t('aiWorkspace') },
    { id: 'alerts', icon: AlertCircle, label: t('alerts') },
    { id: 'profile', icon: User, label: t('me') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center py-2 sm:py-3 px-1 sm:px-2 shadow-2xl gap-0.5 sm:gap-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-colors duration-150 flex-1 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={20} className="mb-0.5 sm:mb-1 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap leading-tight text-center max-w-[4.5rem] sm:max-w-none truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
