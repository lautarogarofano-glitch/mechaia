import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  subscriptions: {
    trialActive: number;
    trialExhausted: number;
    baseActive: number;
    turboActive: number;
    inactive: number;
  };
  revenue: {
    estimatedMonthly: number;
    baseCount: number;
    turboCount: number;
  };
  diagnostics: {
    total: number;
    thisMonth: number;
  };
  api: {
    totalMessagesUsed: number;
    estimatedCostUSD: number;
  };
}

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
}

function StatCard({ label, value, sub, color = 'blue' }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'amber' | 'slate' | 'red';
}) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    slate: 'text-slate-700 dark:text-slate-300',
    red: 'text-red-500 dark:text-red-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const res = await fetch('/api/admin-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Error obteniendo estadísticas');
        } else {
          setStats(data);
        }
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshKey]);

  const netMonthly = stats ? stats.revenue.estimatedMonthly - stats.api.estimatedCostUSD : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MechaIA" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              ↻ Actualizar
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              ← Volver
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Cargando estadísticas...</div>
          </div>
        ) : stats && (
          <div className="space-y-6">

            {/* Usuarios */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Usuarios</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total usuarios" value={stats.totalUsers} color="blue" />
                <StatCard label="Nuevos este mes" value={stats.newUsersThisMonth} color="green" />
                <StatCard label="Diagnósticos totales" value={stats.diagnostics.total} color="slate" />
                <StatCard label="Diagnósticos este mes" value={stats.diagnostics.thisMonth} color="blue" />
              </div>
            </div>

            {/* Suscripciones */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Suscripciones</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Trial activo" value={stats.subscriptions.trialActive} sub="Con diagnósticos restantes" color="blue" />
                <StatCard label="Trial agotado" value={stats.subscriptions.trialExhausted} sub="Listos para convertir" color="amber" />
                <StatCard label="Plan Base" value={stats.subscriptions.baseActive} sub="$11.45/mes" color="green" />
                <StatCard label="Plan Turbo" value={stats.subscriptions.turboActive} sub="$19.20/mes" color="green" />
                <StatCard label="Inactivos" value={stats.subscriptions.inactive} sub="Cancelados / vencidos" color="slate" />
              </div>
            </div>

            {/* Revenue */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Ingresos estimados</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Base"
                  value={`$${(stats.revenue.baseCount * 11.45).toFixed(2)}`}
                  sub={`${stats.revenue.baseCount} × $11.45`}
                  color="green"
                />
                <StatCard
                  label="Turbo"
                  value={`$${(stats.revenue.turboCount * 19.20).toFixed(2)}`}
                  sub={`${stats.revenue.turboCount} × $19.20`}
                  color="green"
                />
                <StatCard
                  label="Total mensual bruto"
                  value={`$${stats.revenue.estimatedMonthly.toFixed(2)}`}
                  sub="USD estimado"
                  color="green"
                />
                <StatCard
                  label="Neto estimado"
                  value={`$${netMonthly.toFixed(2)}`}
                  sub="Bruto − costo API"
                  color={netMonthly >= 0 ? 'green' : 'red'}
                />
              </div>
            </div>

            {/* API Cost */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Costo API Anthropic</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Mensajes usados (total)"
                  value={stats.api.totalMessagesUsed.toLocaleString()}
                  sub="Acumulado histórico"
                  color="slate"
                />
                <StatCard
                  label="Costo estimado"
                  value={`$${stats.api.estimatedCostUSD.toFixed(3)}`}
                  sub="~$0.003 por mensaje (promedio)"
                  color="amber"
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
