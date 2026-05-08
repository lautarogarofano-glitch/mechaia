import { useState } from 'react';
import { GlassButton } from '../../glass/GlassButton';
import { runAction } from '../../../lib/adminApi';
import type { AdminUserDetail } from '../../../types/admin';

interface GrantMessagesActionProps {
  userId: string;
  isTrial: boolean;
  onResult: (detail: AdminUserDetail) => void;
}

export function GrantMessagesAction({ userId, isTrial, onResult }: GrantMessagesActionProps) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const label = isTrial ? 'Extender trial' : 'Regalar mensajes';

  const execute = async () => {
    setBusy(true);
    setError('');
    try {
      const detail = await runAction(userId, { action: 'grant_messages', qty });
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
        {label}
      </GlassButton>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-glass-mute block">
        {isTrial ? 'Diagnosticos a sumar al trial' : 'Mensajes a descontar del consumo'}
      </label>
      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
        min={1}
        max={500}
        className="w-full bg-glass-bg border border-glass-border rounded-lg px-3 py-2 text-glass-text focus:outline-none focus:ring-2 focus:ring-accent-violet/60"
      />
      <div className="flex gap-2">
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
