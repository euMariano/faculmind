import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { createApi, ApiService } from '../services/api';
import { useAuth } from './AuthContext';

const ApiContext = createContext<ApiService | null>(null);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  const apiInstance = useMemo(() => {
    return createApi(getToken);
  }, [getToken]);

  return (
    <ApiContext.Provider value={apiInstance}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiService => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi deve ser usado dentro de um ApiProvider');
  }
  return context;
};
