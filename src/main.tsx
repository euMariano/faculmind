import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // Importa o AuthProvider

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider> {/* Envolve o App com o AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
