import { useState } from 'react';
import { GlassButton } from '../../glass/GlassButton';
import { runAction } from '../../../lib/adminApi';
import type { AdminUserDetail } from '../../../types/admin';

interface BlockActionProps {
  userId: string;
  isBlocked: boolean;
  onResult: (detail: AdminUserDetail) => void;
}

export function BlockAction({ userId, isBlocked, onResult }: BlockActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const execute = async () => {
    setBusy(true);
    setError('');
    try {
      const detail = await runAction(userId, { action: isBlocked ? 'unblock' : 'block' });
      onResult(detail);
      setConfirming(false);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <GlassButton
        variant={isBlocked ? 'primary' : 'danger'}
        onClick={() => setConfirming(true)}
        className="w-full justify-center"
      >
        {isBlocked ? 'Desbloquear' : 'Bloquear'}
      </GlassButton>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-glass-mute">
        {isBlocked ? '¿Restaurar acceso?' : '¿Bloquear acceso a este usuario?'}
      </p>
      <div className="flex gap-2">
        <GlassButton
          variant={isBlocked ? 'primary' : 'danger'}
          onClick={execute}
          disabled={busy}
          className="flex-1 justify-center"
        >
          {busy ? '...' : 'Confirmar'}
        </GlassButton>
        <GlassButton
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="flex-1 justify-center"
        >
          Cancelar
        </GlassButton>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
