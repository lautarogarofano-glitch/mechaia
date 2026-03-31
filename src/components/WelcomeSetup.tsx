import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface WelcomeSetupProps {
  onComplete: () => void;
}

export function WelcomeSetup({ onComplete }: WelcomeSetupProps) {
  const [workshopName, setWorkshopName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopName.trim()) {
      setError('El nombre del taller es obligatorio.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        workshop_name: workshopName.trim(),
        city: city.trim() || undefined,
      },
    });

    setLoading(false);

    if (updateError) {
      setError('No se pudo guardar la información. Intentá de nuevo.');
      return;
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="MechaIA" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            Bienvenido a MechaIA
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2">
            Antes de empezar, contanos sobre tu taller
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del taller <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              placeholder="Ej: Taller Mecánico García"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Ciudad
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Buenos Aires"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !workshopName.trim()}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Guardando...' : 'Comenzar'}
          </button>
        </form>
      </div>
    </div>
  );
}
