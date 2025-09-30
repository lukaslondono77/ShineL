import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Suppress ResizeObserver errors (harmless Monaco Editor warnings)
const resizeObserverLoopErr = () => {
  const resizeObserverErr = window.console.error;
  window.console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications')) {
      return;
    }
    resizeObserverErr(...args);
  };
};
resizeObserverLoopErr();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);