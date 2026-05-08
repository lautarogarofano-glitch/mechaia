import { useState } from 'react';
import { GlassButton } from '../../glass/GlassButton';
import { runAction } from '../../../lib/adminApi';
import type { AdminUserDetail, Plan, SubscriptionStatus } from '../../../types/admin';

interface ChangePlanActionProps {
  userId: string;
  currentPlan: Plan | null;
  currentStatus: SubscriptionStatus | null;
  onResult: (detail: AdminUserDetail) => void;
}

const ALLOWED_STATUS: SubscriptionStatus[] = ['trial', 'active', 'inactive', 'cancelled'];

export function ChangePlanAction({
  userId,
  currentPlan,
  currentStatus,
  onResult,
}: ChangePlanActionProps) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(currentPlan === 'base' ? 'base' : 'turbo');
  const [status, setStatus] = useState<SubscriptionStatus>(
    currentStatus && ALLOWED_STATUS.includes(currentStatus) ? currentStatus : 'active'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const execute = async () => {
    setBusy(true);
    setError('');
    try {
      const detail = await runAction(userId, { action: 'change_plan', plan, status });
      onResult(detail);
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <GlassButton variant="default" onClick={() => setOpen(true)} className="w-full justify-center">
        Cambiar plan
      </GlassButton>
    );
  }

  const selectClasses =
    'w-full bg-glass-bg border border-glass-border rounded-lg px-3 py-2 text-glass-text focus:outline-none focus:ring-2 focus:ring-accent-violet/60';

  return (
    <div className="space-y-2">
      <label className="text-sm text-glass-mute block">Plan</label>
      <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)} className={selectClasses}>
        <option value="base">Base ($11.45/mes, 150 msg)</option>
        <option value="turbo">Turbo ($19.20/mes, ilimitado)</option>
      </select>

      <label className="text-sm text-glass-mute block mt-2">Estado</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
        className={selectClasses}
      >
        <option value="trial">Trial</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
        <option value="cancelled">Cancelado</option>
      </select>

      <div className="flex gap-2 mt-3">
        <GlassButton variant="primary" onClick={execute} disabled={busy} className="flex-1 justify-center">
          {busy ? '...' : 'Confirmar'}
        </GlassButton>
        <GlassButton variant="ghost" onClick={() => setOpen(false)} disabled={busy} className="flex-1 justify-center">
          Cancelar
        </GlassButton>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
