import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useQueueStore } from './store/queueStore';

import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { Dashboard } from './pages/Dashboard';
import { PatientOnboarding } from './pages/Receptionist/PatientOnboarding';
import { QueueScheduler } from './pages/Receptionist/QueueScheduler';
import { BillingDesk } from './pages/Receptionist/BillingDesk';
import { ConsultationPad } from './pages/Doctor/ConsultationPad';
import { PrescriptionQueue } from './pages/Pharmacist/PrescriptionQueue';
import { InventoryManager } from './pages/Pharmacist/InventoryManager';
import { UserManagement } from './pages/Admin/UserManagement';
import { AuditLogs } from './pages/Admin/AuditLogs';
import { FinancialAnalytics } from './pages/Admin/FinancialAnalytics';
import { LiveQueueBoard } from './components/LiveQueueBoard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    },
  },
});

function MainLayout() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { user } = useAuthStore();
  const { initializeSocket, disconnectSocket } = useQueueStore();

  useEffect(() => {
    // Connect WebSocket and pass callback to invalidate queries on queue updates
    initializeSocket(() => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['liveQueue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptionsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['invoicesList'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryList'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogsList'] });
    });

    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  // Bind Ctrl+K patient quick search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchBtn = document.querySelector('header button');
        if (searchBtn instanceof HTMLButtonElement) {
          searchBtn.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Full screen digital signage view for live waiting board
  if (currentTab === 'live-queue-board') {
    return <LiveQueueBoard onBack={() => setCurrentTab('dashboard')} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'reception-onboarding':
        return <PatientOnboarding />;
      case 'reception-queue':
        return <QueueScheduler />;
      case 'reception-billing':
        return <BillingDesk />;
      case 'doctor-consult':
        return <ConsultationPad />;
      case 'pharmacy-prescriptions':
        return <PrescriptionQueue />;
      case 'pharmacy-inventory':
        return <InventoryManager />;
      case 'admin-users':
        return <UserManagement />;
      case 'admin-audit':
        return <AuditLogs />;
      case 'admin-finance':
        return <FinancialAnalytics />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header currentTab={currentTab} />
        <main className="flex-grow overflow-y-auto no-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthenticated ? <MainLayout /> : <Login />}
    </QueryClientProvider>
  );
}
