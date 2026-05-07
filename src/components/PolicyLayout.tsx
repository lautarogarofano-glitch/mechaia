import { useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en';

interface PolicyLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  lang: Lang;
  onToggleLang: () => void;
}

export function PolicyLayout({ title, lastUpdated, children, lang, onToggleLang }: PolicyLayoutProps) {
  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>{lang === 'es' ? 'Volver' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="MechaIA" className="w-7 h-7 object-contain" />
              <span className="font-semibold text-slate-200">MechaIA</span>
            </a>
            <button
              onClick={onToggleLang}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors tracking-widest"
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-sm text-slate-500">
            {lang === 'es' ? 'Última actualización: ' : 'Last updated: '}
            {lastUpdated}
          </p>
        </header>

        <div className="prose-policy text-slate-300 leading-relaxed space-y-6">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">
              {lang === 'es' ? 'Privacidad' : 'Privacy'}
            </a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">
              {lang === 'es' ? 'Términos' : 'Terms'}
            </a>
            <a href="/refund" className="hover:text-slate-300 transition-colors">
              {lang === 'es' ? 'Reembolsos' : 'Refunds'}
            </a>
          </div>
          <p>© {new Date().getFullYear()} MechaIA</p>
        </footer>
      </article>
    </div>
  );
}

export function usePolicyLang(): [Lang, () => void] {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'es';
    return (localStorage.getItem('lang') as Lang) || 'es';
  });
  const toggle = () => {
    const next: Lang = lang === 'es' ? 'en' : 'es';
    setLang(next);
    localStorage.setItem('lang', next);
  };
  return [lang, toggle];
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mt-8 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
