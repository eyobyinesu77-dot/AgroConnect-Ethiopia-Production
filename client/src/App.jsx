import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <CartProvider>
            <Router>
              <Toaster position="top-right" />
              <AppRoutes />
            </Router>
          </CartProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </AuthProvider>
  );
}
