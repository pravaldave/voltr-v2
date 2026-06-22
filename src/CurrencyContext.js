import { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD'];

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('INR');
  const [rates, setRates]       = useState({});

  const fetchRates = async (base = 'USD') => {
    try {
      const r    = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
      const data = await r.json();
      setRates(data.rates);
    } catch {}
  };

  const convert = (amount, fromCurrency) => {
    if (!amount) return 0;
    if (fromCurrency === currency) return amount;
    // convert to USD first then to target
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
