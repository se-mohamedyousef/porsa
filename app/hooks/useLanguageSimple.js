// app/hooks/useLanguageSimple.js
"use client";
import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { translations } from '@/app/utils/translations';

export function useLanguageSimple() {
  const [language, setLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme: contextToggleTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setMounted(true);
      return;
    }
    const savedLang = localStorage.getItem('porsaLanguage') || localStorage.getItem('language') || 'en';
    
    setLanguage(savedLang);
    setIsRTL(savedLang === 'ar');
    
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    
    setMounted(true);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setIsRTL(lang === 'ar');
    if (typeof window !== 'undefined') {
      localStorage.setItem('porsaLanguage', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const toggleTheme = () => {
    contextToggleTheme();
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  if (!mounted) {
    return {
      language: 'en',
      isRTL: false,
      changeLanguage: () => {},
      toggleTheme: () => {},
      theme: 'light',
      t: (key) => key
    };
  }

  return {
    language,
    isRTL,
    changeLanguage,
    toggleTheme,
    theme,
    t
  };
}
