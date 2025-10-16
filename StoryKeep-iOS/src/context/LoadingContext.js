import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [operations, setOperations] = useState(new Map());
  const [counter, setCounter] = useState(0);

  const startLoading = useCallback((operationName = 'operation') => {
    const operationId = Date.now() + Math.random();
    setOperations(prev => {
      const newOps = new Map(prev);
      newOps.set(operationId, {
        name: operationName,
        startTime: Date.now()
      });
      setCounter(newOps.size);
      return newOps;
    });
    return operationId;
  }, []);

  const stopLoading = useCallback((operationId) => {
    setOperations(prev => {
      const newOps = new Map(prev);
      newOps.delete(operationId);
      setCounter(newOps.size);
      return newOps;
    });
  }, []);

  const getActiveOperations = useCallback(() => {
    return Array.from(operations.entries()).map(([id, data]) => ({
      id,
      ...data,
      duration: Date.now() - data.startTime
    }));
  }, [operations]);

  return (
    <LoadingContext.Provider
      value={{
        startLoading,
        stopLoading,
        counter,
        operations: getActiveOperations()
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};
