import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CommandCenter } from './pages/CommandCenter';
import { CitizenPortal } from './pages/CitizenPortal';
import { TrackIncidentPage } from './pages/TrackIncidentPage';
import { ResponderPortal } from './pages/ResponderPortal';
import { InventoryPortal } from './pages/InventoryPortal';
import { ScenarioCommander } from './pages/ScenarioCommander';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
      retry: 1,
    },
  },
});

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-command-darkest flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-command-darkest">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Operational Layout Routes */}
            <Route
              path="/command"
              element={
                <AppLayout>
                  <CommandCenter />
                </AppLayout>
              }
            />
            <Route
              path="/citizen"
              element={
                <AppLayout>
                  <CitizenPortal />
                </AppLayout>
              }
            />
            <Route
              path="/track"
              element={
                <AppLayout>
                  <TrackIncidentPage />
                </AppLayout>
              }
            />
            <Route
              path="/responder"
              element={
                <AppLayout>
                  <ResponderPortal />
                </AppLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <AppLayout>
                  <InventoryPortal />
                </AppLayout>
              }
            />
            <Route
              path="/scenario"
              element={
                <AppLayout>
                  <ScenarioCommander />
                </AppLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <AppLayout>
                  <AnalyticsPage />
                </AppLayout>
              }
            />
            <Route
              path="/health"
              element={
                <AppLayout>
                  <SystemHealthPage />
                </AppLayout>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

