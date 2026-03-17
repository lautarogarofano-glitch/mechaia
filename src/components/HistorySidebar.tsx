import { useState } from 'react';
import type { DiagnosisSession } from '../types/vehicle';

interface HistorySidebarProps {
  sessions: DiagnosisSession[];
  onSelectSession: (session: DiagnosisSession) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function HistorySidebar({ sessions, onSelectSession, onNewSession, onDeleteSession }: HistorySidebarProps) {
  const [search, setSearch] = useState('');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filtered = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.vehicle.marca.toLowerCase().includes(q) ||
      s.vehicle.modelo.toLowerCase().includes(q) ||
      s.vehicle.patente.toLowerCase().includes(q) ||
      s.vehicle.falla.toLowerCase().includes(q)
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este diagnóstico?')) {
      onDeleteSession(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="MechaIA" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">MechaIA</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Asistente de diagnóstico</p>
          </div>
        </div>
        <button onClick={onNewSession} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium">
          + Nuevo Diagnóstico
        </button>
      </div>

      <div className="px-3 pt-3 pb-1">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por patente, marca..."
          className="w-full h-9 px-3 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg border-0 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Historial</span>
          {sessions.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">({sessions.length})</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search ? 'Sin resultados' : 'No hay diagnósticos previos'}
            </p>
            {!search && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Comenzá uno nuevo para guardar el historial</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">🚗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {session.vehicle.marca} {session.vehicle.modelo}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {session.status === 'completed' && (
                          <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                        )}
                        <span
                          role="button"
                          onClick={(e) => handleDelete(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity text-xs px-1"
                          title="Eliminar"
                        >
                          🗑
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{session.vehicle.patente}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                      {session.vehicle.falla.substring(0, 40)}{session.vehicle.falla.length > 40 ? '...' : ''}
                    </p>
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
