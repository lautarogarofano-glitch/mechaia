import { useState, useEffect } from 'react';
import { AlertCircle, Clock, MessageSquare, FileText, Smartphone, History, Zap, Wrench, CheckCircle } from 'lucide-react';

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
  const problems = [
    {
      icon: <AlertCircle className="w-6 h-6 text-red-400" />,
      text: 'El scanner tira un código pero no te dice qué hacer después',
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-400" />,
      text: 'Perdés horas buscando en foros o llamando a otros talleres',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-yellow-400" />,
      text: 'El cliente pregunta qué tiene el auto y no sabés cómo explicarlo',
    },
  ];

  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
          Diagnosticar sin contexto cuesta{' '}
          <span className="text-red-400">tiempo y plata</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {problems.map((p, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="mb-4">{p.icon}</div>
              <p className="text-slate-300 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xl font-semibold text-white">
          MechaIA cambia eso.
        </p>
      </div>
    </section>
  );
}
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: <Wrench className="w-6 h-6 text-blue-400" />,
      title: 'Ingresá los datos del vehículo',
      description: 'Marca, modelo, motor, kilometraje, falla y código OBD. Funciona con cualquier scanner del mercado.',
    },
    {
      number: '02',
      icon: <MessageSquare className="w-6 h-6 text-indigo-400" />,
      title: 'Chateá con la IA',
      description: 'MechaIA te hace las preguntas correctas, analiza los síntomas y te guía paso a paso hacia el diagnóstico.',
    },
    {
      number: '03',
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      title: 'Descargá el informe PDF',
      description: 'Generá un documento profesional con el diagnóstico completo, listo para entregar al cliente.',
    },
  ];

  return (
    <section id="como-funciona" className="py-24 px-4 bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          Tres pasos y ya estás diagnosticando
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              <div className="text-6xl font-black text-slate-800 leading-none mb-4 select-none">
                {step.number}
              </div>
              <div className="mb-3">{step.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      title: 'Diagnóstico guiado por IA',
      description: 'Hace las preguntas correctas en el orden correcto para llegar al diagnóstico más probable.',
    },
    {
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
      title: 'PDF descargable',
      description: 'Informe profesional con el diagnóstico completo para entregar al cliente.',
    },
    {
      icon: <History className="w-5 h-5 text-blue-400" />,
      title: 'Historial de diagnósticos',
      description: 'Todos tus casos guardados y accesibles desde cualquier dispositivo.',
    },
    {
      icon: <Wrench className="w-5 h-5 text-indigo-400" />,
      title: 'Compatible con cualquier scanner',
      description: 'Ingresás el código OBD manualmente — sin cables ni conexiones especiales.',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-blue-400" />,
      title: 'Funciona en el celular',
      description: 'Usalo desde el taller sin necesidad de computadora.',
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      title: '5 diagnósticos gratis',
      description: 'Empezás sin tarjeta de crédito para probar la herramienta con tus propios casos.',
    },
  ];

  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          Todo lo que necesita tu taller
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function PricingSection({
  onSelectPlan,
  onStartAuth,
}: {
  onSelectPlan: (plan: 'base' | 'turbo') => void;
  onStartAuth: () => void;
}) {
  const basePlanFeatures = [
    '150 mensajes por mes',
    'Diagnóstico guiado paso a paso',
    'Informe PDF descargable',
    'Historial de diagnósticos',
    'Compatible con cualquier scanner',
    'Soporte por email',
  ];

  const turboPlanFeatures = [
    'Mensajes ilimitados',
    'Diagnóstico guiado paso a paso',
    'Informe PDF descargable',
    'Historial de diagnósticos',
    'Compatible con cualquier scanner',
    'Soporte prioritario',
    'Acceso a nuevas funciones primero',
  ];

  return (
    <section className="py-24 px-4 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Planes simples, sin sorpresas
        </h2>
        <p className="text-slate-400 text-center mb-14">
          Cancelá cuando quieras. Sin permanencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Base */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Plan Base</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$11.45</span>
                <span className="text-slate-400">/mes</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {basePlanFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan('base')}
              className="w-full py-3 border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl font-semibold transition-all"
            >
              Empezar con Base
            </button>
          </div>

          {/* Plan Turbo */}
          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8">
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMENDADO
              </span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Plan Turbo</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$19.20</span>
                <span className="text-blue-200">/mes</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {turboPlanFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle className="w-4 h-4 text-blue-200 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan('turbo')}
              className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold transition-colors"
            >
              Empezar con Turbo
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          También podés empezar con{' '}
          <button onClick={onStartAuth} className="text-slate-300 hover:text-white underline transition-colors">
            5 diagnósticos gratis. Sin tarjeta.
          </button>
        </p>
      </div>
    </section>
  );
}
function CtaSection({ onStartAuth }: { onStartAuth: () => void }) {
  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-center shadow-2xl shadow-blue-900/30">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tu taller merece mejores diagnósticos
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Empezá con 5 diagnósticos gratis. Sin tarjeta. Sin compromiso.
          </p>
          <button
            onClick={onStartAuth}
            className="px-10 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-lg transition-colors shadow-lg"
          >
            Empezar gratis hoy
          </button>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MechaIA" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-slate-300">MechaIA</span>
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} MechaIA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
