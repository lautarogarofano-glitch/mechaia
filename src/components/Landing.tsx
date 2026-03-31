import { useState, useEffect } from 'react';

interface LandingProps {
  onStartAuth: () => void;
}

export function Landing({ onStartAuth }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectPlan = (plan: 'base' | 'turbo') => {
    localStorage.setItem('selectedPlan', plan);
    onStartAuth();
  };

  return (
    <div className="bg-slate-950 text-white">
      <LandingNav scrolled={scrolled} onStartAuth={onStartAuth} />
      <HeroSection onStartAuth={onStartAuth} />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection onSelectPlan={handleSelectPlan} onStartAuth={onStartAuth} />
      <CtaSection onStartAuth={onStartAuth} />
      <FooterSection />
    </div>
  );
}

// ── Navbar ──────────────────────────────────────────────────────────────────

function LandingNav({ scrolled, onStartAuth }: { scrolled: boolean; onStartAuth: () => void }) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MechaIA" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg">MechaIA</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onStartAuth}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-colors"
          >
            Iniciar sesión
          </button>
          <button
            onClick={onStartAuth}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            Empezar gratis →
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Placeholders temporales (se implementan en tareas siguientes) ────────────

function HeroSection({ onStartAuth: _onStartAuth }: { onStartAuth: () => void }) {
  return <section className="pt-32 pb-20 px-4 text-center"><p className="text-slate-400">Hero — próxima tarea</p></section>;
}
function ProblemSection() {
  return <section className="py-20 px-4 bg-slate-900 text-center"><p className="text-slate-400">Problema — próxima tarea</p></section>;
}
function HowItWorksSection() {
  return <section id="como-funciona" className="py-20 px-4 text-center"><p className="text-slate-400">Cómo funciona — próxima tarea</p></section>;
}
function FeaturesSection() {
  return <section className="py-20 px-4 bg-slate-900 text-center"><p className="text-slate-400">Features — próxima tarea</p></section>;
}
function PricingSection({ onSelectPlan: _onSelectPlan, onStartAuth: _onStartAuth }: { onSelectPlan: (p: 'base' | 'turbo') => void; onStartAuth: () => void }) {
  return <section className="py-20 px-4 text-center"><p className="text-slate-400">Precios — próxima tarea</p></section>;
}
function CtaSection({ onStartAuth: _onStartAuth }: { onStartAuth: () => void }) {
  return <section className="py-20 px-4 text-center"><p className="text-slate-400">CTA — próxima tarea</p></section>;
}
function FooterSection() {
  return <footer className="py-8 px-4 border-t border-slate-800"><p className="text-slate-500 text-sm text-center">Footer — próxima tarea</p></footer>;
}
