"use client";

import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-bold transition-all
        flex items-center gap-2
        ${language === 'ar' 
          ? "font-cairo text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300" 
          : "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        }
      `}
      title={language === 'en' ? "Switch to Arabic" : "Switch to English"}
    >
      <span className="text-lg leading-none mb-0.5">
        {language === 'en' ? "ع" : "EN"}
      </span>
      {/* <span className="hidden md:inline">
        {language === 'en' ? "العربية" : "English"}
      </span> */}
    </button>
  );
}
