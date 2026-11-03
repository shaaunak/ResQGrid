import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OverviewPage } from './pages/OverviewPage';
import { LandingPage } from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { LoginPage } from './pages/LoginPage';
import { CommandCenter } from './pages/CommandCenter';
import { CitizenPortal } from './pages/CitizenPortal';
import { TrackIncidentPage } from './pages/TrackIncidentPage';
import { ResponderPortal } from './pages/ResponderPortal';
import { InventoryPortal } from './pages/InventoryPortal';
import { ScenarioCommander } from './pages/ScenarioCommander';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { EvidencePage } from './pages/EvidencePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DocsPage } from './pages/DocsPage';
import { MissionTracePage } from './pages/MissionTracePage';

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
    <div className="min-h-screen bg-rq-bg flex flex-col font-sans text-rq-ink">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-rq-bg">{children}</main>
      </div>
      <CommandPalette />
      <KeyboardShortcutsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <WebSocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Landing & Overview */}
                <Route
                  path="/"
                  element={
                    <AppLayout>
                      <OverviewPage />
                    </AppLayout>
                  }
                />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Operational Core Routes - Protected by Real RBAC */}
                <Route
                  path="/command"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <CommandCenter />
                      </AppLayout>
                    </ProtectedRoute>
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
                  path="/trace"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <MissionTracePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mission-trace/:incidentId"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <MissionTracePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mission-trace"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <MissionTracePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/responder"
                  element={
                    <ProtectedRoute allowedRoles={['RESPONDER', 'OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <ResponderPortal />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['COORDINATOR', 'OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <InventoryPortal />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scenarios"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <ScenarioCommander />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scenario"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <ScenarioCommander />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN', 'COORDINATOR']}>
                      <AppLayout>
                        <AnalyticsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/evidence"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN', 'COORDINATOR']}>
                      <AppLayout>
                        <EvidencePage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <AuditLogPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
                      <AppLayout>
                        <SystemHealthPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/docs"
                  element={
                    <AppLayout>
                      <DocsPage />
                    </AppLayout>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
