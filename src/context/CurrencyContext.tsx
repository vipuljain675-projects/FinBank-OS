'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Define Supported Currencies & Rates (Base: USD)
// You can update these rates manually or fetch them from an API later
const RATES = {
  USD: { rate: 1, locale: 'en-US', currency: 'USD' },
  INR: { rate: 86.5, locale: 'en-IN', currency: 'INR' }, // ₹1 = $0.011
  EUR: { rate: 0.92, locale: 'de-DE', currency: 'EUR' },
  GBP: { rate: 0.79, locale: 'en-GB', currency: 'GBP' },
};

type CurrencyCode = keyof typeof RATES;

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Default to INR because you are Indian! 🇮🇳
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  // Optional: Load preference from LocalStorage so it remembers you
  useEffect(() => {
    const saved = localStorage.getItem('finbank_currency') as CurrencyCode;
    if (saved && RATES[saved]) setCurrency(saved);
  }, []);

  const handleSetCurrency = (c: CurrencyCode) => {
    setCurrency(c);
    localStorage.setItem('finbank_currency', c);
  };

  // The Magic Function: Converts & Formats
  const format = (amount: number) => {
    const { rate, locale, currency: code } = RATES[currency];
    const converted = amount * rate;
    
    // Intl.NumberFormat handles the "Lakhs/Crores" vs "Millions" commas automatically!
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Custom Hook for easy access
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
}