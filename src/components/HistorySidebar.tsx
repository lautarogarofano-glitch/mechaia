import type { DiagnosisSession } from '../types/vehicle';

interface HistorySidebarProps {
  sessions: DiagnosisSession[];
  onSelectSession: (session: DiagnosisSession) => void;
  onNewSession: () => void;
}

export function HistorySidebar({ sessions, onSelectSession, onNewSession }: HistorySidebarProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">MechaIA</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Asistente de diagnóstico</p>
          </div>
        </div>
        <button onClick={onNewSession} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium">+ Nuevo Diagnóstico</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">🕐 Historial</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay diagnósticos previos</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Comenzá uno nuevo para guardar el historial</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <button key={session.id} onClick={() => onSelectSession(session)} className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">🚗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{session.vehicle.marca} {session.vehicle.modelo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.vehicle.patente}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{session.vehicle.falla.substring(0, 40)}...</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(session.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-center text-slate-400 dark:text-slate-500">MechaIA v1.0 · Argentina 🇦🇷</p>
      </div>
    </div>
  );
}
