"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

type Language = 'en' | 'bn'; // Add your supported languages here

const LanguageContext = createContext<any>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('en');

  // Persist language choice in LocalStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[lang];
    keys.forEach(k => { result = result?.[k]; });
    return result || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);