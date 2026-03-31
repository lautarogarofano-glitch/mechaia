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

function HeroSection({ onStartAuth }: { onStartAuth: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-20 px-4 overflow-hidden">
      {/* Glow de fondo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          IA para talleres mecánicos
        </div>

        {/* Título */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
          El asistente de diagnóstico{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            que trabaja junto a tu scanner
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Ingresás los datos del vehículo, chateás con la IA y recibís un diagnóstico paso a paso —{' '}
          <span className="text-slate-300">con informe PDF para entregar al cliente.</span>
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button
            onClick={onStartAuth}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-900/30"
          >
            Empezar gratis
          </button>
          <a
            href="#como-funciona"
            className="px-8 py-3.5 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white rounded-xl font-medium text-base transition-colors"
          >
            Ver cómo funciona ↓
          </a>
        </div>

        {/* Mockup del chat */}
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-900">
          {/* Barra superior del mockup */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
              <span className="text-sm font-medium text-slate-200">MechaIA — Diagnóstico</span>
            </div>
            <span className="text-xs text-green-400 font-medium">● En sesión</span>
          </div>
          {/* Mensajes simulados */}
          <div className="p-4 space-y-3 text-left">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs">🔧</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-xs">
                Hola, soy MechaIA. ¿Cuál es la falla que presenta el vehículo?
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                VW Golf 2010, tira P0301 — fallo de encendido cilindro 1
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs">🔧</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-sm">
                Entendido. ¿Ya cambiaste las bujías recientemente? Y ¿el fallo es constante o solo en frío?
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                Bujías nuevas, el fallo es solo en frío
              </div>
            </div>
            {/* Indicador de escribiendo */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-xs">🔧</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
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
