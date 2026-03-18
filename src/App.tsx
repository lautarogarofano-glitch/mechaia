import { useState, useEffect } from 'react';
import { VehicleForm } from './components/VehicleForm';
import { ChatInterface } from './components/ChatInterface';
import { HistorySidebar } from './components/HistorySidebar';
import { Auth } from './components/Auth';
import { Pricing } from './components/Pricing';
import { AdminDashboard } from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { VehicleData, DiagnosisSession, Message, Subscription } from './types/vehicle';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'chat' | 'admin'>('form');
  const isAdmin = user?.email === (import.meta.env.VITE_ADMIN_EMAIL || 'lautarogarofano@gmail.com');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleData | null>(null);
  const [currentDiagnosticId, setCurrentDiagnosticId] = useState<string | undefined>(undefined);
  const [currentMessages, setCurrentMessages] = useState<Message[] | undefined>(undefined);
  const [currentIsCompleted, setCurrentIsCompleted] = useState(false);
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null | 'loading'>('loading');

  // Verificar si hay usuario logueado al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      loadUserDiagnostics();
      loadSubscription();
    } else {
      setSubscription(null);
    }
  }, [user]);

  // Manejar retorno de Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/');
      setTimeout(() => loadSubscription(), 2000); // esperar webhook
    }
  }, []);

  const loadSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status, messages_used, messages_limit, trial_diagnostics_remaining')
      .single();

    if (data) {
      setSubscription(data as Subscription);
    } else {
      // Usuario nuevo — crear trial automáticamente
      const { data: newSub } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user?.id,
          plan: 'turbo',
          status: 'trial',
          trial_diagnostics_remaining: 5,
          messages_limit: null,
        })
        .select()
        .single();
      setSubscription(newSub as Subscription);
    }
  };

  const loadUserDiagnostics = async () => {
    setLoadError('');
    const { data, error } = await supabase
      .from('diagnostics')
      .select('id, patente, marca, modelo, año, motor, ecu, falla, codigo_obd, kilometraje, conversacion, created_at, status')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setLoadError('No se pudo cargar el historial. Revisá tu conexión.');
      return;
    }

    if (data) {
      const formattedSessions: DiagnosisSession[] = data.map((d: any) => ({
        id: d.id,
        vehicle: {
          patente: d.patente,
          marca: d.marca,
          modelo: d.modelo,
          año: d.año,
          motor: d.motor,
          ecu: d.ecu,
          falla: d.falla,
          codigoObd: d.codigo_obd,
          kilometraje: d.kilometraje,
        },
        messages: d.conversacion || [],
        createdAt: new Date(d.created_at),
        status: d.status === 'completed' ? 'completed' : 'active',
      }));
      setSessions(formattedSessions);
    }
  };

  const handleVehicleSubmit = async (data: VehicleData) => {
    setCurrentVehicle(data);
    setCurrentMessages(undefined);
    setCurrentIsCompleted(false);

    if (user) {
      const { data: inserted, error } = await supabase
        .from('diagnostics')
        .insert({
          user_id: user.id,
          patente: data.patente,
          marca: data.marca,
          modelo: data.modelo,
          año: data.año,
          motor: data.motor,
          ecu: data.ecu,
          falla: data.falla,
          codigo_obd: data.codigoObd,
          kilometraje: data.kilometraje,
          conversacion: [],
          status: 'active',
        })
        .select()
        .single();

      if (!error && inserted) {
        setCurrentDiagnosticId(inserted.id);
        loadUserDiagnostics();

        // Decrementar trial si aplica
        if (subscription && subscription !== 'loading' && subscription.status === 'trial') {
          const remaining = subscription.trial_diagnostics_remaining - 1;
          await supabase
            .from('subscriptions')
            .update({ trial_diagnostics_remaining: remaining, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
          setSubscription({ ...subscription, trial_diagnostics_remaining: remaining });
        }
      }
    }

    setCurrentView('chat');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
    setCurrentMessages(undefined);
    setCurrentIsCompleted(false);
  };

  const handleNewSession = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
    setCurrentMessages(undefined);
    setCurrentIsCompleted(false);
  };

  const handleSelectSession = (session: DiagnosisSession) => {
    setCurrentVehicle(session.vehicle);
    setCurrentDiagnosticId(session.id);
    setCurrentMessages(session.messages);
    setCurrentIsCompleted(session.status === 'completed');
    setCurrentView('chat');
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string) => {
    const { error } = await supabase.from('diagnostics').delete().eq('id', id);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      // Si el diagnóstico eliminado es el actual, volver al formulario
      if (currentDiagnosticId === id) {
        handleBackToForm();
      }
    }
  };

  const handleCompleteSession = async () => {
    if (!currentDiagnosticId) return;
    const { error } = await supabase
      .from('diagnostics')
      .update({ status: 'completed' })
      .eq('id', currentDiagnosticId);
    if (!error) {
      setCurrentIsCompleted(true);
      setSessions((prev) =>
        prev.map((s) => (s.id === currentDiagnosticId ? { ...s, status: 'completed' } : s))
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessions([]);
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
    setCurrentMessages(undefined);
    setCurrentIsCompleted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-3xl">🔧</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  if (subscription === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <img src="/logo.png" alt="MechaIA" className="w-16 h-16 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (subscription && typeof subscription !== 'string') {
    const isTrialExhausted = subscription.status === 'trial' && subscription.trial_diagnostics_remaining <= 0;
    const isInactive = !['active', 'trial'].includes(subscription.status);
    if (isTrialExhausted || isInactive) {
      return <Pricing trialExhausted={isTrialExhausted} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20">
        <HistorySidebar
          sessions={sessions}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          subscription={subscription}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 shadow-xl">
            <HistorySidebar
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              subscription={subscription}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Top Navigation */}
        {currentView === 'form' && (
          <nav className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="MechaIA" className="w-10 h-10 object-contain" />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">MechaIA</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                {user.email}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Salir
              </button>
              <button
                onClick={handleNewSession}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl"
              >
                + Nuevo
              </button>
            </div>
          </nav>
        )}

        {/* Content */}
        <main className="px-4 pb-8 lg:px-8">
          {loadError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm flex items-center justify-between">
              <span>{loadError}</span>
              <button onClick={loadUserDiagnostics} className="ml-4 underline text-xs">Reintentar</button>
            </div>
          )}
          {currentView === 'admin' && user ? (
            <AdminDashboard user={user} onBack={() => setCurrentView('form')} />
          ) : currentView === 'form' ? (
            <div className="pt-8">
              <VehicleForm onSubmit={handleVehicleSubmit} />
            </div>
          ) : currentVehicle ? (
            <ChatInterface
              vehicle={currentVehicle}
              onBack={handleBackToForm}
              diagnosticId={currentDiagnosticId}
              initialMessages={currentMessages}
              isCompleted={currentIsCompleted}
              onComplete={handleCompleteSession}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
