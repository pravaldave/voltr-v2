import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';

window.onerror = (message) => {
  if (message && message.toString().includes('Object is disposed')) return true;
  return false;
};

window.onunhandledrejection = (event) => {
  if (event.reason?.message?.includes('Object is disposed')) event.preventDefault();
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <CurrencyProvider>
    <App />
  </CurrencyProvider>
);
