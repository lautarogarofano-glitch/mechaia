import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

interface ResetPasswordProps {
  onDone: () => void;
}

export function ResetPassword({ onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError('No se pudo actualizar la contraseña. El link puede haber expirado.');
      return;
    }

    setSuccess(true);
    setTimeout(() => onDone(), 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="/logo.png" alt="MechaIA" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">MechaIA</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Ingresá tu nueva contraseña</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm text-center">
            ¡Contraseña actualizada! Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-12 px-4 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
