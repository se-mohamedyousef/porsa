"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

export default function SidebarMenu({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onShowProfile,
}) {
  const { t, dir } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation mounting
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <div
         className={`
          fixed top-0 bottom-0 z-[70] w-3/4 max-w-xs bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-out
          ${dir === 'rtl' ? 'left-0' : 'right-0'} 
          ${isOpen 
            ? "translate-x-0" 
            : dir === 'rtl' ? "-translate-x-full" : "translate-x-full"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('porsa')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section (if logged in) */}
          {currentUser && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xl">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                </div>
                <div>
                   <p className="font-bold text-gray-900 dark:text-gray-100">{currentUser.name || t('profile')}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.phone}</p>
                </div>
              </div>
              <button
                onClick={() => {
                    onShowProfile();
                    onClose();
                }}
                className="w-full py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-sm"
              >
                {t('profile')}
              </button>
            </div>
          )}

          {/* Navigation Links / Settings */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Settings Group */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">{t('overview')}</h3> {/* Reusing a general label or adding 'Settings'? using overview for now structurally */}
              
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</span>
                    <LanguageToggle />
                 </div>
                 
                 <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                    <ThemeToggle />
                 </div>
              </div>
            </div>

          </div>

          {/* Logout Footer */}
          {currentUser && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-800">
               <button
                onClick={() => {
                    onLogout();
                    onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors font-semibold"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 {t('logout')}
               </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
