import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState([]);

  const startLoading = useCallback((message = 'Loading...') => {
    setLoadingCount(prev => prev + 1);
    setLoadingMessages(prev => [...prev, message]);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount(prev => Math.max(0, prev - 1));
    setLoadingMessages(prev => prev.slice(1));
  }, []);

  const isLoading = loadingCount > 0;
  const currentMessage = loadingMessages[loadingMessages.length - 1] || 'Loading...';

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingCount,
        currentMessage,
        startLoading,
        stopLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
