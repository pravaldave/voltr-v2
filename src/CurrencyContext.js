import { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD'];

const HARDCODED_RATES = {
  INR: 84.5, EUR: 0.92, GBP: 0.79,
  JPY: 149.5, AED: 3.67, SGD: 1.34, AUD: 1.53,
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('INR');
  const rates = HARDCODED_RATES;
  const fetchRates = async () => {};

  const convert = (amount, fromCurrency) => {
    if (!amount) return 0;
    if (fromCurrency === currency) return amount;
    const toUSD  = fromCurrency === 'USD' ? amount : amount / (rates[fromCurrency] || 1);
    const result = currency === 'USD' ? toUSD : toUSD * (rates[currency] || 1);
    return result;
  };

  const symbol = { USD:'$', INR:'₹', EUR:'€', GBP:'£', JPY:'¥', AED:'د.إ', SGD:'S$', AUD:'A$' };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, fetchRates, rates, symbol: symbol[currency] || currency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
