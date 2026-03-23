import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'reset';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (message.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar.';
  if (message.includes('User already registered')) return 'Ya existe una cuenta con ese email.';
  if (message.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('Unable to validate email')) return 'El email ingresado no es válido.';
  if (message.includes('For security purposes')) return 'Esperá unos segundos antes de intentar de nuevo.';
  return message;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMessage('¡Cuenta creada! Revisá tu email para confirmar y luego iniciá sesión.');
        setMode('login');
      } else if (mode === 'reset') {
        await fetch('/api/send-reset-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        setSuccessMessage('Si tu email está registrado, recibirás un link para restablecer tu contraseña.');
        setMode('login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      setError(translateError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="/logo.png" alt="MechaIA" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">MechaIA</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {mode === 'login' && 'Iniciá sesión para continuar'}
            {mode === 'register' && 'Creá tu cuenta'}
            {mode === 'reset' && 'Restablecé tu contraseña'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              placeholder="taller@ejemplo.com"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); setSuccessMessage(''); }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
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
              {mode === 'register' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {loading
              ? 'Cargando...'
              : mode === 'login'
              ? 'Iniciar sesión'
              : mode === 'register'
              ? 'Crear cuenta'
              : 'Enviar email de recuperación'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          {mode === 'login' && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿No tenés cuenta?{' '}
              <button
                onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Registrate
              </button>
            </p>
          )}
          {(mode === 'register' || mode === 'reset') && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                className="text-blue-600 dark:text-blue-400 font-medium"
              >
                Iniciá sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
