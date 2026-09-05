import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { NotificationItem } from './components/NotificationsPopover';
import { FinanceCopilotDrawer } from './features/copilot/FinanceCopilotDrawer';

// Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ReconciliationPage } from './features/reconciliation/ReconciliationPage';
import { BatchDetailPage } from './features/reconciliation/BatchDetailPage';
import { DataSourcesPage } from './features/data-sources/DataSourcesPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { SettlementsPage } from './features/settlements/SettlementsPage';
import { BankStatementsPage } from './features/bank-statements/BankStatementsPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { ExceptionsPage } from './features/exceptions/ExceptionsPage';
import { ExceptionDetailPage } from './features/exceptions/ExceptionDetailPage';
import { VerificationPage } from './features/verification/VerificationPage';
import { EvaluationsPage } from './features/evaluations/EvaluationsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { AuditLogsPage } from './features/audit/AuditLogsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';

import { authApi, evaluationsApi } from './api';
import { User } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const qClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ledgeriq_sidebar_collapsed') === 'true';
  });
  const [isSeeding, setIsSeeding] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'System Initialized',
      description: 'Connected to local SQLite database with deterministic 4-tier reconciliation engine.',
      timestamp: 'Just now',
      type: 'info',
    },
  ]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const token = localStorage.getItem('ledgeriq_token');
    if (!token) {
      navigate('/login');
      return;
    }
    authApi
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('ledgeriq_token');
        navigate('/login');
      });
  }, [navigate]);

  // Global Keyboard Shortcuts (Ctrl+K, ?, Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/textareas
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('ledgeriq_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const batch = await evaluationsApi.seedDemo(100, 42);
      addToast('success', `Reconciled 100 Benchmark Records: ${batch.matched_records} matched, ${batch.exception_records} exceptions.`);
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: 'Benchmark Batch Completed',
          description: `Batch ${batch.name} finished with 70.0% match rate in ${batch.processing_time_ms}ms.`,
          timestamp: 'Just now',
          type: 'success',
          link: `/batches/${batch.id}`,
        },
        ...prev,
      ]);
      qClient.invalidateQueries();
      navigate(`/batches/${batch.id}`);
    } catch (err: any) {
      addToast('error', `Benchmark failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ledgeriq_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased">
      {/* Top Header */}
      <Navbar
        user={user}
        notifications={notifications}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onSeedDemo={handleSeedDemo}
        onLogout={handleLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onClearNotifications={() => setNotifications([])}
        isSeeding={isSeeding}
      />

      {/* Main Workspace Layout (Sidebar + Fluid Scrollable Content) */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* Real natural scrolling area without artificial height lock */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-[1600px] mx-auto w-full">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
              <Route path="/batches/:batchId" element={<BatchDetailPage />} />
              <Route path="/data-sources" element={<DataSourcesPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/settlements" element={<SettlementsPage />} />
              <Route path="/bank-statements" element={<BankStatementsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/exceptions" element={<ExceptionsPage />} />
              <Route path="/exceptions/:exceptionId" element={<ExceptionDetailPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/evaluations" element={<EvaluationsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Compact Enterprise SaaS Footer */}
      <Footer />

      {/* Global Modals & Overlays */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenCopilot={() => {
          setIsSearchOpen(false);
          setIsCopilotOpen(true);
        }}
        onSeedDemo={() => {
          setIsSearchOpen(false);
          handleSeedDemo();
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <FinanceCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={() => {
                  queryClient.invalidateQueries();
                }}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <SignupPage
                onSignupSuccess={() => {
                  queryClient.invalidateQueries();
                }}
              />
            }
          />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
