import { useState } from 'react';
import { VehicleForm } from './components/VehicleForm';
import { ChatInterface } from './components/ChatInterface';
import { HistorySidebar } from './components/HistorySidebar';
import type { VehicleData, DiagnosisSession } from './types/vehicle';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'form' | 'chat'>('form');
  const [currentVehicle, setCurrentVehicle] = useState<VehicleData | null>(null);
  const [sessions, setSessions] = useState<DiagnosisSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleVehicleSubmit = (data: VehicleData) => {
    setCurrentVehicle(data);
    
    const newSession: DiagnosisSession = {
      id: Date.now().toString(),
      vehicle: data,
      messages: [],
      createdAt: new Date(),
      status: 'active',
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentView('chat');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
  };

  const handleNewSession = () => {
    setCurrentView('form');
    setCurrentVehicle(null);
  };

  const handleSelectSession = (session: DiagnosisSession) => {
    setCurrentVehicle(session.vehicle);
    setCurrentView('chat');
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="hidden lg:block fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20">
        <HistorySidebar 
          sessions={sessions} 
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 shadow-xl">
            <HistorySidebar 
              sessions={sessions} 
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
            />
          </div>
        </div>
      )}

      <div className="lg:ml-72 min-h-screen">
        {currentView === 'form' && (
          <nav className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>☰</button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">MechaIA</h1>
              </div>
            </div>
            <button onClick={handleNewSession} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl">+ Nuevo</button>
          </nav>
        )}

        <main className="px-4 pb-8 lg:px-8">
          {currentView === 'form' ? (
            <div className="pt-8">
              <VehicleForm onSubmit={handleVehicleSubmit} />
            </div>
          ) : currentVehicle ? (
            <ChatInterface vehicle={currentVehicle} onBack={handleBackToForm} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
