import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';
import { cn } from '../../lib/utils';

interface AdminStatsData {
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

type ValueColor = 'violet' | 'cyan' | 'green' | 'amber' | 'slate' | 'red' | 'pink';

function StatCard({
  label,
  value,
  sub,
  color = 'violet',
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: ValueColor;
}) {
  const colors: Record<ValueColor, string> = {
    violet: 'text-violet-300',
    cyan: 'text-cyan-300',
    green: 'text-emerald-300',
    amber: 'text-amber-300',
    slate: 'text-slate-200',
    red: 'text-red-300',
    pink: 'text-pink-300',
  };
  return (
    <GlassCard className="p-4">
      <p className="text-xs text-glass-mute uppercase tracking-wide mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', colors[color])}>{value}</p>
      {sub && <p className="text-xs text-glass-dim mt-1">{sub}</p>}
    </GlassCard>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-glass-mute uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const res = await fetch('/api/admin-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (!cancelled) setError('API no disponible. Levanta `vercel dev` para usar los endpoints, no `npm run dev`.');
          return;
        }
        let data: any;
        try {
          data = await res.json();
        } catch {
          if (!cancelled) setError(`HTTP ${res.status}`);
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError(data.error || `HTTP ${res.status}`);
        } else if (!cancelled) {
          setStats(data);
        }
      } catch (e: any) {
        if (!cancelled) setError(`Error de conexion: ${e?.message || 'desconocido'}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const netMonthly = stats ? stats.revenue.estimatedMonthly - stats.api.estimatedCostUSD : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <GlassButton variant="ghost" onClick={() => setRefreshKey((k) => k + 1)}>
          ↻ Actualizar
        </GlassButton>
      </div>

      {error && (
        <GlassCard className="p-4">
          <p className="text-sm text-red-300">{error}</p>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-glass-mute">
          Cargando estadisticas...
        </div>
      ) : (
        stats && (
          <>
            <div>
              <SectionHeading>Usuarios</SectionHeading>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total usuarios" value={stats.totalUsers} color="violet" />
                <StatCard label="Nuevos este mes" value={stats.newUsersThisMonth} color="green" />
                <StatCard label="Diagnosticos totales" value={stats.diagnostics.total} color="slate" />
                <StatCard label="Diagnosticos este mes" value={stats.diagnostics.thisMonth} color="cyan" />
              </div>
            </div>

            <div>
              <SectionHeading>Suscripciones</SectionHeading>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Trial activo" value={stats.subscriptions.trialActive} sub="Con diagnosticos restantes" color="violet" />
                <StatCard label="Trial agotado" value={stats.subscriptions.trialExhausted} sub="Listos para convertir" color="amber" />
                <StatCard label="Plan Base" value={stats.subscriptions.baseActive} sub="$11.45/mes" color="green" />
                <StatCard label="Plan Turbo" value={stats.subscriptions.turboActive} sub="$19.20/mes" color="cyan" />
                <StatCard label="Inactivos" value={stats.subscriptions.inactive} sub="Cancelados / vencidos" color="slate" />
              </div>
            </div>

            <div>
              <SectionHeading>Ingresos estimados</SectionHeading>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Base" value={`$${(stats.revenue.baseCount * 11.45).toFixed(2)}`} sub={`${stats.revenue.baseCount} x $11.45`} color="green" />
                <StatCard label="Turbo" value={`$${(stats.revenue.turboCount * 19.2).toFixed(2)}`} sub={`${stats.revenue.turboCount} x $19.20`} color="cyan" />
                <StatCard label="Total mensual bruto" value={`$${stats.revenue.estimatedMonthly.toFixed(2)}`} sub="USD estimado" color="green" />
                <StatCard label="Neto estimado" value={`$${netMonthly.toFixed(2)}`} sub="Bruto - costo API" color={netMonthly >= 0 ? 'green' : 'red'} />
              </div>
            </div>

            <div>
              <SectionHeading>Costo API Anthropic</SectionHeading>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Mensajes usados (total)" value={stats.api.totalMessagesUsed.toLocaleString()} sub="Acumulado historico" color="slate" />
                <StatCard label="Costo estimado" value={`$${stats.api.estimatedCostUSD.toFixed(3)}`} sub="~$0.003 por mensaje (promedio)" color="amber" />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
