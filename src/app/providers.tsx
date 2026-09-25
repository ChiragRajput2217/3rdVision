import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';
import { useSimulation } from '../hooks/useSimulation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

const RealtimeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useSocket(); // Mount Socket.IO listeners
  useSimulation(); // Mount Demo Flow simulation interval
  return <>{children}</>;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealtimeInitializer>{children}</RealtimeInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
