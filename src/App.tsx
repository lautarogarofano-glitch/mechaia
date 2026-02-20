import { useState, useEffect } from 'react';
import { VehicleForm } from './components/VehicleForm';
import { ChatInterface } from './components/ChatInterface';
import { HistorySidebar } from './components/HistorySidebar';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import type { VehicleData, DiagnosisSession } from './types/vehicle';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'chat'>('form');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleData | null>(null);
  const [currentDiagnosticId, setCurrentDiagnosticId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verificar si hay usuario logueado al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar diagnósticos del usuario
  useEffect(() => {
    if (user) {
      loadUserDiagnostics();
    }
  }, [user]);

  const loadUserDiagnostics = async () => {
    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
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
        status: 'active',
      }));
      setSessions(formattedSessions);
    }
  };

  const handleVehicleSubmit = async (data: VehicleData) => {
    setCurrentVehicle(data);
    
    // Guardar en Supabase
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
        })
        .select()
        .single();

      if (!error && inserted) {
        setCurrentDiagnosticId(inserted.id);
        loadUserDiagnostics();
      }
    }

    setCurrentView('chat');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
  };

  const handleNewSession = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
  };

  const handleSelectSession = (session: DiagnosisSession) => {
    setCurrentVehicle(session.vehicle);
    setCurrentDiagnosticId(session.id);
    setCurrentView('chat');
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessions([]);
    setCurrentView('form');
    setCurrentVehicle(null);
    setCurrentDiagnosticId(undefined);
  };

  // Mostrar loading
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

  // Mostrar login si no hay usuario
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // App principal
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20">
        <HistorySidebar 
          sessions={sessions} 
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">MechaIA</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                {user.email}
              </span>
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
          {currentView === 'form' ? (
            <div className="pt-8">
              <VehicleForm onSubmit={handleVehicleSubmit} />
            </div>
          ) : currentVehicle ? (
            <ChatInterface 
              vehicle={currentVehicle} 
              onBack={handleBackToForm}
              diagnosticId={currentDiagnosticId}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
