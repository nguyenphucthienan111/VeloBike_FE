import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { API_BASE_URL } from './constants';

// Patch fetch to auto-add ngrok bypass header when using ngrok tunnel
if (API_BASE_URL.includes('ngrok')) {
  const originalFetch = window.fetch;
  window.fetch = (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set('ngrok-skip-browser-warning', '1');
    return originalFetch(input, { ...init, headers });
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);