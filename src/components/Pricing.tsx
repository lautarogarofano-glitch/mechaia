import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PricingProps {
  onBack?: () => void;
  trialExhausted?: boolean;
}

export function Pricing({ onBack, trialExhausted }: PricingProps) {
  const [loading, setLoading] = useState<'base' | 'turbo' | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (plan: 'base' | 'turbo') => {
    setLoading(plan);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Error al iniciar el pago');
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="MechaIA" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {trialExhausted ? '¡Usaste tus 5 diagnósticos gratis!' : 'Elegí tu plan'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {trialExhausted
              ? 'Suscribite para seguir diagnosticando sin límites.'
              : 'Diagnósticos precisos para tu taller. Cancelá cuando quieras.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Base */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="mb-6">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Plan Base</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">$11.45</span>
                <span className="text-slate-500 dark:text-slate-400">/mes</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                '150 mensajes por mes',
                'Diagnóstico guiado paso a paso',
                'Historial de diagnósticos',
                'Funciona con cualquier scanner',
                'Soporte por email',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-green-500 font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('base')}
              disabled={loading !== null}
              className="w-full py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              {loading === 'base' ? 'Redirigiendo...' : 'Suscribirme al Base'}
            </button>
          </div>

          {/* Plan Turbo */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMENDADO
              </span>
            </div>

            <div className="mb-6">
              <span className="text-sm font-medium text-blue-200 uppercase tracking-wide">Plan Turbo</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$19.20</span>
                <span className="text-blue-200">/mes</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Mensajes ilimitados',
                'Diagnóstico guiado paso a paso',
                'Historial de diagnósticos',
                'Funciona con cualquier scanner',
                'Prioridad en soporte',
                'Acceso a nuevas funciones primero',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white">
                  <span className="text-blue-200 font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('turbo')}
              disabled={loading !== null}
              className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loading === 'turbo' ? 'Redirigiendo...' : 'Suscribirme al Turbo'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Cobro automático mensual con tarjeta. Cancelá cuando quieras desde tu perfil.
        </p>

        {onBack && (
          <div className="text-center mt-4">
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
