import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, Header } from './components';
import { LoginView, ForgotPasswordView, DashboardView, EditorView, UserManagementView, MyPopsView, RevisionsView, SettingsView, PopView, ProfileView, DepartmentsView } from './views';
import type { View } from './types';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedPopId, setSelectedPopId] = useState<string | null>(null);
  const { session, isLoading } = useAuth();

  const handleSelectPop = (id: string, newView: View = 'viewer') => {
    setSelectedPopId(id);
    setView(newView);
  };

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        // force login if no session and not in reset password view
        if (view !== 'forgot-password' && view !== 'login') {
          setView('login');
        }
      } else if (view === 'login' || view === 'forgot-password') {
        // redirect to dashboard if authenticated
        setView('dashboard');
      }
    }
  }, [session, isLoading, view]);

  const renderView = () => {
    switch (view) {
      case 'login': return <LoginView setView={setView} />;
      case 'forgot-password': return <ForgotPasswordView setView={setView} />;
      case 'editor': return <EditorView setView={setView} popId={selectedPopId} onPopCreated={(id) => handleSelectPop(id, 'editor')} />;
      case 'viewer': return <PopView setView={setView} popId={selectedPopId} />;
      case 'users': return <UserManagementView setView={setView} />;
      case 'my-pops': return <MyPopsView setView={setView} onSelectPop={handleSelectPop} />;
      case 'reviews': return <RevisionsView setView={setView} onSelectPop={handleSelectPop} />;
      case 'settings': return <SettingsView />;
      case 'profile': return <ProfileView setView={setView} />;
      case 'departments': return <DepartmentsView setView={setView} />;
      case 'dashboard':
      default: return <DashboardView setView={setView} onSelectPop={handleSelectPop} />;
    }
  };

  const isAuthView = view === 'login' || view === 'forgot-password';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 size-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {!isAuthView ? (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
          <Header setView={setView} />
          <div className="flex flex-1 overflow-hidden min-h-0">
            <Sidebar currentView={view} setView={setView} />
            <main className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 overflow-y-auto"
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      ) : (
        renderView()
      )}
    </div>
  );
}
