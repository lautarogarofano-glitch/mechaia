import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Globe,
  MoreVertical,
  Smartphone,
  Download,
  Apple,
} from 'lucide-react';
import { cn } from '../lib/utils';

type Platform = 'ios' | 'android' | 'samsung';

interface Step {
  icon: typeof Share;
  title: string;
  desc: string;
}

const PLATFORMS: { id: Platform; label: string; sub: string; icon: typeof Apple }[] = [
  { id: 'ios', label: 'iPhone', sub: 'Safari', icon: Apple },
  { id: 'android', label: 'Android', sub: 'Chrome', icon: Smartphone },
  { id: 'samsung', label: 'Samsung', sub: 'Internet', icon: Smartphone },
];

const STEPS: Record<Platform, Step[]> = {
  ios: [
    {
      icon: Globe,
      title: 'Abrí mechaia.app en Safari',
      desc: 'En iPhone tiene que ser sí o sí Safari (Chrome de iPhone no permite instalar PWA). Si entraste con otro browser, copiá la URL y pegala en Safari.',
    },
    {
      icon: Share,
      title: 'Tocá el botón Compartir',
      desc: 'Es el ícono del cuadrado con la flecha hacia arriba. Lo encontrás abajo (iPhone moderno) o arriba (versiones viejas) de la pantalla.',
    },
    {
      icon: PlusSquare,
      title: 'Bajá hasta "Agregar a Pantalla de Inicio"',
      desc: 'Tenés que hacer scroll dentro del menú. La opción aparece con un ícono de un "+" en un cuadrado.',
    },
    {
      icon: CheckCircle2,
      title: 'Tocá "Agregar" y listo',
      desc: 'El ícono de MechaIA queda en tu pantalla principal. Al abrirlo se ve como app, sin barra del navegador.',
    },
  ],
  android: [
    {
      icon: Globe,
      title: 'Abrí mechaia.app en Chrome',
      desc: 'En Android funciona perfecto desde Chrome. También sirve Edge, Firefox y la mayoría de los navegadores modernos.',
    },
    {
      icon: MoreVertical,
      title: 'Abrí el menú ⋮',
      desc: 'Está arriba a la derecha — son tres puntos verticales. Tocalo.',
    },
    {
      icon: Download,
      title: 'Tocá "Instalar app"',
      desc: 'Si no aparece "Instalar app" buscá "Agregar a la pantalla de inicio". Hace lo mismo.',
    },
    {
      icon: CheckCircle2,
      title: 'Confirmá y listo',
      desc: 'El ícono queda en tu cajón de apps junto al resto. Lo abrís y se siente como una app nativa.',
    },
  ],
  samsung: [
    {
      icon: Globe,
      title: 'Abrí mechaia.app en Samsung Internet',
      desc: 'Es el navegador que viene por defecto en los Galaxy. Si preferís Chrome, mirá la pestaña de Android.',
    },
    {
      icon: MoreVertical,
      title: 'Abrí el menú ☰',
      desc: 'Las tres líneas horizontales en la parte de abajo, a la derecha de la barra de direcciones.',
    },
    {
      icon: Download,
      title: 'Tocá "Agregar página a"',
      desc: 'Se abre un sub-menú. Elegí "Pantalla de inicio".',
    },
    {
      icon: CheckCircle2,
      title: 'Confirmá y listo',
      desc: 'El ícono queda en tu home, al toque.',
    },
  ],
};

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'ios';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Android/.test(ua)) return 'android';
  return 'ios';
}

interface InstallAppModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallAppModal({ open, onClose }: InstallAppModalProps) {
  const initial = useMemo(detectPlatform, []);
  const [tab, setTab] = useState<Platform>(initial);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const steps = STEPS[tab];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-white">
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Instalar MechaIA en tu cel</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800/60 rounded-2xl border border-slate-700">
            {PLATFORMS.map((p) => {
              const active = tab === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTab(p.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all',
                    active
                      ? 'bg-slate-950 border border-slate-700 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-blue-400' : '')} />
                  <span className={cn('text-xs font-semibold', active ? 'text-white' : '')}>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{p.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <ol className="px-6 py-6 space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-300" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-slate-700 my-1" aria-hidden />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">PASO {i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="px-6 pb-6 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-300">Tip:</strong> al instalarla, MechaIA se abre como
            una app — sin barras del navegador, con tu logo en el home y entrada directa al
            historial de diagnósticos.
          </p>
        </div>
      </div>
    </div>
  );
}
