import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types/vehicle';

interface SettingsProps {
  user: User;
  subscription?: Subscription | null;
  onBack: () => void;
}

type Tab = 'taller' | 'cuenta' | 'plan' | 'facturacion';

const PORTAL_URL = 'https://app.lemonsqueezy.com/my-orders';

export function Settings({ user, subscription, onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('taller');

  // Mi Taller state
  const [workshopName, setWorkshopName] = useState(user.user_metadata?.workshop_name || '');
  const [city, setCity] = useState(user.user_metadata?.city || '');
  const [tallerSaving, setTallerSaving] = useState(false);
  const [tallerSuccess, setTallerSuccess] = useState('');
  const [tallerError, setTallerError] = useState('');

  // Cuenta state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSaveTaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopName.trim()) {
      setTallerError('El nombre del taller es obligatorio.');
      return;
    }
    setTallerSaving(true);
    setTallerError('');
    setTallerSuccess('');

    const { error } = await supabase.auth.updateUser({
      data: {
        workshop_name: workshopName.trim(),
        city: city.trim() || undefined,
      },
    });

    setTallerSaving(false);
    if (error) {
      setTallerError('No se pudo guardar. Intentá de nuevo.');
    } else {
      setTallerSuccess('Datos del taller guardados correctamente.');
      setTimeout(() => setTallerSuccess(''), 3000);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (error) {
      setPasswordError(error.message || 'No se pudo cambiar la contraseña.');
    } else {
      setPasswordSuccess('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    }
  };

  const handleUpgrade = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan: 'turbo' }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const planLabel = () => {
    if (!subscription) return 'Sin plan';
    if (subscription.status === 'trial') return 'Trial';
    if (subscription.plan === 'turbo') return 'Turbo';
    if (subscription.plan === 'base') return 'Base';
    return subscription.plan;
  };

  const planColor = () => {
    if (!subscription) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    if (subscription.status === 'trial') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    if (subscription.plan === 'turbo') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'taller', label: 'Mi Taller', icon: '🏠' },
    { id: 'cuenta', label: 'Cuenta', icon: '👤' },
    { id: 'plan', label: 'Mi Plan', icon: '⭐' },
    { id: 'facturacion', label: 'Facturación', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
          >
            <span>&#8592;</span> Volver
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1">
            {/* Mi Taller */}
            {activeTab === 'taller' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Mi Taller</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Esta información aparecerá en los reportes PDF que generés.
                </p>
                <form onSubmit={handleSaveTaller} className="space-y-5">
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
                  {tallerError && <p className="text-sm text-red-600 dark:text-red-400">{tallerError}</p>}
                  {tallerSuccess && <p className="text-sm text-green-600 dark:text-green-400">{tallerSuccess}</p>}
                  <button
                    type="submit"
                    disabled={tallerSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
                  >
                    {tallerSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </div>
            )}

            {/* Cuenta */}
            {activeTab === 'cuenta' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Cuenta</h2>
                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      readOnly
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">El email no se puede modificar.</p>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Cambiar contraseña</h3>
                    <form onSubmit={handleSavePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          minLength={8}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repetí la contraseña"
                          minLength={8}
                          className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
                      {passwordSuccess && <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>}
                      <button
                        type="submit"
                        disabled={passwordSaving || !newPassword || !confirmPassword}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
                      >
                        {passwordSaving ? 'Guardando...' : 'Cambiar contraseña'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Mi Plan */}
            {activeTab === 'plan' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Mi Plan</h2>

                {/* Plan badge */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${planColor()}`}>
                    {planLabel()}
                  </span>
                  {subscription?.status === 'active' && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Activo</span>
                  )}
                </div>

                {/* Usage stats */}
                {subscription && (
                  <div className="space-y-4 mb-6">
                    {subscription.status === 'trial' && (
                      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 dark:text-slate-400">Diagnósticos gratuitos restantes</span>
                          <span className="font-semibold text-orange-700 dark:text-orange-400">
                            {subscription.trial_diagnostics_remaining} / 5
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${(subscription.trial_diagnostics_remaining / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Prueba gratuita — incluye funcionalidades del plan Turbo.
                        </p>
                      </div>
                    )}

                    {subscription.status === 'active' && subscription.messages_limit !== null && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 dark:text-slate-400">Mensajes usados este período</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-400">
                            {subscription.messages_used} / {subscription.messages_limit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (subscription.messages_used / subscription.messages_limit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {subscription.status === 'active' && subscription.messages_limit === null && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                          Mensajes ilimitados incluidos en tu plan.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {subscription && (subscription.status === 'trial' || (subscription.status === 'active' && subscription.plan === 'base')) && (
                    <button
                      onClick={handleUpgrade}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                    >
                      Mejorar a Turbo
                    </button>
                  )}

                  {subscription?.status === 'active' && (
                    <a
                      href={PORTAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm text-center"
                    >
                      Gestionar suscripción
                    </a>
                  )}
                </div>

                {subscription?.status === 'active' && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href={PORTAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Cancelar suscripción
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Facturación */}
            {activeTab === 'facturacion' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Facturación</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Gestioná tu suscripción, historial de pagos y método de pago desde el portal de Lemon Squeezy.
                </p>

                <a
                  href={PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Abrir portal de facturación
                </a>

                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
                  Los pagos son procesados de forma segura por Lemon Squeezy.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
