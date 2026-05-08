import { GlassTable, GlassTHead, GlassTH, GlassTBody, GlassTR, GlassTD } from '../glass/GlassTable';
import { GlassBadge } from '../glass/GlassBadge';
import { GlassCard } from '../glass/GlassCard';
import type { AdminUserRow, Plan, SubscriptionStatus } from '../../types/admin';

const SHORT_DATE = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });

function relativeFromNow(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `hace ${years} año${years > 1 ? 's' : ''}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return '—';
  return SHORT_DATE.format(new Date(iso));
}

function planBadge(plan: Plan | null) {
  if (!plan) return <GlassBadge tone="neutral">—</GlassBadge>;
  return plan === 'turbo' ? (
    <GlassBadge tone="cyan">Turbo</GlassBadge>
  ) : (
    <GlassBadge tone="green">Base</GlassBadge>
  );
}

function statusBadge(row: AdminUserRow) {
  if (row.banned_until) return <GlassBadge tone="red">Bloqueado</GlassBadge>;
  const status: SubscriptionStatus | null = row.status;
  if (!status) return <GlassBadge tone="neutral">Sin sub</GlassBadge>;
  const map: Record<SubscriptionStatus, { tone: 'violet' | 'green' | 'amber' | 'slate' | 'red'; label: string }> = {
    trial: { tone: 'violet', label: 'Trial' },
    active: { tone: 'green', label: 'Activo' },
    inactive: { tone: 'slate', label: 'Inactivo' },
    cancelled: { tone: 'slate', label: 'Cancelado' },
    past_due: { tone: 'amber', label: 'Vencido' },
  };
  const cfg = map[status];
  return <GlassBadge tone={cfg.tone}>{cfg.label}</GlassBadge>;
}

function consumptionLabel(row: AdminUserRow): string {
  if (row.banned_until) return '—';
  if (row.status === 'trial') return `${row.trial_diagnostics_remaining}/5 trial`;
  if (row.messages_limit === null) return `${row.messages_used}/∞`;
  return `${row.messages_used}/${row.messages_limit}`;
}

function initial(row: AdminUserRow): string {
  const src = row.workshop_name || row.email || '?';
  return src.trim().charAt(0).toUpperCase();
}

interface UsersTableProps {
  rows: AdminUserRow[];
  loading: boolean;
  error: string;
  onRowClick: (id: string) => void;
}

export function UsersTable({ rows, loading, error, onRowClick }: UsersTableProps) {
  if (error) {
    return (
      <GlassCard className="p-4">
        <p className="text-sm text-red-300">{error}</p>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <GlassTable>
        <GlassTHead>
          <tr>
            <GlassTH>Usuario</GlassTH>
            <GlassTH>Plan / Estado</GlassTH>
            <GlassTH>Diagnosticos</GlassTH>
            <GlassTH>Consumo</GlassTH>
            <GlassTH>Signup</GlassTH>
          </tr>
        </GlassTHead>
        <GlassTBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassTR key={i}>
              <GlassTD colSpan={5}>
                <div className="h-8 rounded-lg bg-glass-bg animate-pulse" />
              </GlassTD>
            </GlassTR>
          ))}
        </GlassTBody>
      </GlassTable>
    );
  }

  if (rows.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <p className="text-glass-mute">Sin resultados</p>
      </GlassCard>
    );
  }

  return (
    <GlassTable>
      <GlassTHead>
        <tr>
          <GlassTH>Usuario</GlassTH>
          <GlassTH>Plan / Estado</GlassTH>
          <GlassTH>Diagnosticos</GlassTH>
          <GlassTH>Consumo</GlassTH>
          <GlassTH>Signup</GlassTH>
        </tr>
      </GlassTHead>
      <GlassTBody>
        {rows.map((row) => (
          <GlassTR key={row.id} onClick={() => onRowClick(row.id)}>
            <GlassTD>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-violet/30 border border-accent-violet/40 flex items-center justify-center text-sm font-semibold text-violet-100">
                  {initial(row)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-glass-text truncate">{row.email}</p>
                  <p className="text-xs text-glass-mute truncate">{row.workshop_name || 'Sin taller'}</p>
                </div>
              </div>
            </GlassTD>
            <GlassTD>
              <div className="flex flex-col gap-1">
                {planBadge(row.plan)}
                {statusBadge(row)}
              </div>
            </GlassTD>
            <GlassTD>
              <div>
                <p className="text-sm font-medium text-glass-text">{row.diagnostics_count}</p>
                <p className="text-xs text-glass-mute">{relativeFromNow(row.last_diagnostic_at)}</p>
              </div>
            </GlassTD>
            <GlassTD>
              <span className="text-sm text-glass-text font-geist-mono">{consumptionLabel(row)}</span>
            </GlassTD>
            <GlassTD>
              <span className="text-sm text-glass-mute">{shortDate(row.created_at)}</span>
            </GlassTD>
          </GlassTR>
        ))}
      </GlassTBody>
    </GlassTable>
  );
}
