import { useCallback, useEffect, useState } from 'react';
import { GlassPanel } from '../glass/GlassPanel';
import { GlassBadge } from '../glass/GlassBadge';
import { GlassCard } from '../glass/GlassCard';
import { getUserDetail } from '../../lib/adminApi';
import type { AdminUserDetail } from '../../types/admin';
import { BlockAction } from './actions/BlockAction';
import { GrantMessagesAction } from './actions/GrantMessagesAction';
import { ChangePlanAction } from './actions/ChangePlanAction';

interface UserDrawerProps {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}

const FULL_DATE = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const DATETIME = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return FULL_DATE.format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return DATETIME.format(new Date(iso));
}

function actionLabel(action: AdminUserDetail['recent_actions'][number]['action']): string {
  switch (action) {
    case 'block': return 'Bloqueado';
    case 'unblock': return 'Desbloqueado';
    case 'grant_messages': return 'Mensajes regalados';
    case 'extend_trial': return 'Trial extendido';
    case 'change_plan': return 'Plan cambiado';
  }
}

function payloadSummary(action: string, payload: Record<string, unknown> | null): string {
  if (!payload) return '';
  if (action === 'grant_messages' || action === 'extend_trial') {
    return `${payload.qty} ${action === 'extend_trial' ? 'diags' : 'msgs'}`;
  }
  if (action === 'change_plan') {
    return `${payload.plan} / ${payload.status}`;
  }
  return '';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-glass-mute uppercase tracking-widest">{title}</h3>
      {children}
    </section>
  );
}

export function UserDrawer({ userId, onClose, onChanged }: UserDrawerProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getUserDetail(userId);
      setDetail(d);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleResult = (next: AdminUserDetail) => {
    setDetail(next);
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <GlassPanel
        liquid={false}
        className="absolute right-0 top-0 h-full w-full sm:w-[480px] overflow-y-auto p-6 animate-slide-in-right rounded-none rounded-l-3xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-glass-text">Usuario</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-glass-mute hover:text-glass-text text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {error && (
          <GlassCard className="p-4 mb-4">
            <p className="text-sm text-red-300">{error}</p>
          </GlassCard>
        )}

        {loading ? (
          <p className="text-glass-mute text-sm">Cargando...</p>
        ) : (
          detail && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-accent-violet/30 border border-accent-violet/40 flex items-center justify-center text-xl font-semibold text-violet-100">
                  {(detail.user.workshop_name || detail.user.email).trim().charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-glass-text break-all">{detail.user.email}</p>
                  <p className="text-sm text-glass-mute">{detail.user.workshop_name || 'Sin taller asignado'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {detail.user.banned_until ? (
                      <GlassBadge tone="red">Bloqueado</GlassBadge>
                    ) : detail.subscription ? (
                      <>
                        <GlassBadge tone={detail.subscription.plan === 'turbo' ? 'cyan' : 'green'}>
                          {detail.subscription.plan === 'turbo' ? 'Turbo' : 'Base'}
                        </GlassBadge>
                        <GlassBadge tone={detail.subscription.status === 'trial' ? 'violet' : detail.subscription.status === 'active' ? 'green' : 'slate'}>
                          {detail.subscription.status}
                        </GlassBadge>
                      </>
                    ) : (
                      <GlassBadge tone="neutral">Sin suscripcion</GlassBadge>
                    )}
                  </div>
                  <p className="text-xs text-glass-dim mt-2">Miembro desde {formatDate(detail.user.created_at)}</p>
                </div>
              </div>

              {/* Suscripcion */}
              {detail.subscription && (
                <Section title="Suscripcion">
                  <GlassCard className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-glass-mute">Plan</span>
                      <span className="text-glass-text font-medium">{detail.subscription.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-glass-mute">Estado</span>
                      <span className="text-glass-text font-medium">{detail.subscription.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-glass-mute">Mensajes</span>
                      <span className="text-glass-text font-geist-mono">
                        {detail.subscription.messages_used}/{detail.subscription.messages_limit ?? '∞'}
                      </span>
                    </div>
                    {detail.subscription.status === 'trial' && (
                      <div className="flex justify-between">
                        <span className="text-glass-mute">Trial restante</span>
                        <span className="text-glass-text font-geist-mono">
                          {detail.subscription.trial_diagnostics_remaining} diags
                        </span>
                      </div>
                    )}
                    {detail.subscription.current_period_end && (
                      <div className="flex justify-between">
                        <span className="text-glass-mute">Renueva</span>
                        <span className="text-glass-text">{formatDate(detail.subscription.current_period_end)}</span>
                      </div>
                    )}
                    {detail.subscription.lemon_subscription_id && (
                      <div className="flex justify-between">
                        <span className="text-glass-mute">Lemon ID</span>
                        <span className="text-glass-text font-geist-mono text-xs">{detail.subscription.lemon_subscription_id}</span>
                      </div>
                    )}
                  </GlassCard>
                </Section>
              )}

              {/* Acciones */}
              <Section title="Acciones">
                <div className="space-y-3">
                  <BlockAction
                    userId={detail.user.id}
                    isBlocked={!!detail.user.banned_until}
                    onResult={handleResult}
                  />
                  <GrantMessagesAction
                    userId={detail.user.id}
                    isTrial={detail.subscription?.status === 'trial'}
                    onResult={handleResult}
                  />
                  <ChangePlanAction
                    userId={detail.user.id}
                    currentPlan={detail.subscription?.plan ?? null}
                    currentStatus={detail.subscription?.status ?? null}
                    onResult={handleResult}
                  />
                </div>
              </Section>

              {/* Diagnosticos recientes */}
              <Section title={`Diagnosticos recientes (${detail.recent_diagnostics.length})`}>
                {detail.recent_diagnostics.length === 0 ? (
                  <p className="text-sm text-glass-dim">Sin diagnosticos</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.recent_diagnostics.map((d) => (
                      <li key={d.id}>
                        <GlassCard className="p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-glass-text truncate">
                              {d.patente || 'sin patente'} <span className="text-glass-dim">·</span>{' '}
                              <span className="text-glass-mute">{[d.marca, d.modelo].filter(Boolean).join(' ')}</span>
                            </p>
                            <span className="text-xs text-glass-dim shrink-0">{formatDate(d.created_at)}</span>
                          </div>
                          {d.falla && (
                            <p className="text-xs text-glass-mute mt-1 line-clamp-2">{d.falla}</p>
                          )}
                        </GlassCard>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Audit log */}
              <Section title="Acciones admin recientes">
                {detail.recent_actions.length === 0 ? (
                  <p className="text-sm text-glass-dim">Sin acciones registradas</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.recent_actions.map((a) => (
                      <li key={a.id}>
                        <GlassCard className="p-3 text-xs">
                          <div className="flex items-baseline justify-between">
                            <span className="text-glass-text font-medium">{actionLabel(a.action)}</span>
                            <span className="text-glass-dim">{formatDateTime(a.created_at)}</span>
                          </div>
                          <div className="text-glass-mute mt-1">
                            por {a.actor_email}
                            {payloadSummary(a.action, a.payload) && (
                              <span className="text-glass-dim"> · {payloadSummary(a.action, a.payload)}</span>
                            )}
                          </div>
                        </GlassCard>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          )
        )}
      </GlassPanel>
    </div>
  );
}
