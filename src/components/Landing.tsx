import { useState, useEffect } from 'react';
import { AlertCircle, Clock, MessageSquare, FileText, Smartphone, History, Zap, Wrench, CheckCircle } from 'lucide-react';
import { LiquidBackground } from './glass/LiquidBackground';

type Lang = 'es' | 'en';

const translations = {
  es: {
    nav: {
      login: 'Iniciar sesión',
      cta: 'Empezar gratis →',
    },
    hero: {
      badge: 'IA para talleres mecánicos',
      title: (
        <>
          Tu scanner encuentra el código.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            MechaIA encuentra la causa.
          </span>
        </>
      ),
      subtitle: (
        <>
          Deja de buscar en foros y llamar a otros talleres. Describe los síntomas, ingresa el código y recibe
          un diagnóstico paso a paso —{' '}
          <span className="text-slate-300">con un informe PDF que tu cliente va a entender.</span>
        </>
      ),
      cta: 'Empezar gratis',
      secondaryCta: 'Ver cómo funciona ↓',
      mockupHeader: 'MechaIA — Diagnóstico',
      mockupStatus: '● En sesión',
      mockupMsg1: '¿Cuál es la falla que presenta el vehículo?',
      mockupMsg2: 'VW Golf 2010, tira P0301 — fallo de encendido cilindro 1',
      mockupMsg3: '¿Las bujías son nuevas? ¿El fallo es constante o solo en frío?',
      mockupMsg4: 'Bujías nuevas, el fallo es solo en frío',
    },
    problem: {
      title: 'El diagnóstico es más difícil',
      titleHighlight: 'de lo que parece',
      cards: [
        'P0301 puede ser 10 cosas distintas. El código no te dice cuál.',
        'Esa falla intermitente que desaparece en cuanto el auto entra al taller.',
        '¿Cómo justificas un diagnóstico cuando el cliente cree que el scanner "lo lee solo"?',
      ],
      closing: 'MechaIA cierra esa brecha.',
    },
    howItWorks: {
      title: 'Tres pasos y ya estás diagnosticando',
      steps: [
        {
          title: 'Ingresa los datos del vehículo',
          description: 'Marca, modelo, motor, kilometraje, falla y código OBD. Funciona con cualquier scanner del mercado.',
        },
        {
          title: 'Chatea con la IA',
          description: 'MechaIA hace las preguntas correctas, analiza los síntomas y te guía paso a paso hacia el diagnóstico.',
        },
        {
          title: 'Descarga el informe PDF',
          description: 'Un documento profesional con el diagnóstico completo, listo para entregar al cliente.',
        },
      ],
    },
    features: {
      title: 'Todo lo que necesita tu taller',
      items: [
        {
          title: 'Diagnóstico guiado por IA',
          description: 'Te dice qué testear y en qué orden — no solo qué códigos hay presentes.',
        },
        {
          title: 'Informe PDF para el cliente',
          description: 'Entrega un reporte profesional que explica por qué cobraste lo que cobraste.',
        },
        {
          title: 'Historial de diagnósticos',
          description: 'Todos tus casos guardados y accesibles desde cualquier dispositivo.',
        },
        {
          title: 'Compatible con cualquier scanner',
          description: 'Ingresas el código OBD manualmente — sin cables ni conexiones especiales.',
        },
        {
          title: 'Funciona en el celular',
          description: 'Úsalo desde el taller sin necesidad de computadora.',
        },
        {
          title: '5 diagnósticos gratis',
          description: 'Empieza sin tarjeta de crédito para probarlo con tus propios casos.',
        },
      ],
    },
    pricing: {
      title: 'Planes simples, sin sorpresas',
      subtitle: 'Cancela cuando quieras. Sin permanencia.',
      base: {
        label: 'Plan Base',
        price: '$11.45',
        period: '/mes',
        features: [
          '150 mensajes por mes',
          'Diagnóstico guiado paso a paso',
          'Informe PDF descargable',
          'Historial de diagnósticos',
          'Compatible con cualquier scanner',
          'Soporte por email',
        ],
        cta: 'Empezar con Base',
      },
      turbo: {
        label: 'Plan Turbo',
        badge: 'RECOMENDADO',
        price: '$19.20',
        period: '/mes',
        features: [
          'Mensajes ilimitados',
          'Diagnóstico guiado paso a paso',
          'Informe PDF descargable',
          'Historial de diagnósticos',
          'Compatible con cualquier scanner',
          'Soporte prioritario',
          'Acceso a nuevas funciones primero',
        ],
        cta: 'Empezar con Turbo',
      },
      freeNote: '5 diagnósticos gratis. Sin tarjeta.',
      freeNotePrefix: 'También puedes empezar con ',
    },
    cta: {
      title: 'Diagnostica más rápido. Explica mejor. Cobra por lo que sabes.',
      subtitle: 'Empieza con 5 diagnósticos gratis. Sin tarjeta. Sin compromiso.',
      button: 'Empezar gratis hoy',
    },
    footer: {
      rights: 'Todos los derechos reservados.',
      privacy: 'Privacidad',
      terms: 'Términos',
      refund: 'Reembolsos',
    },
  },
  en: {
    nav: {
      login: 'Sign in',
      cta: 'Start free →',
    },
    hero: {
      badge: 'AI for auto repair shops',
      title: (
        <>
          Your scanner finds the code.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            MechaIA finds the cause.
          </span>
        </>
      ),
      subtitle: (
        <>
          Stop cross-referencing forums and calling other shops. Describe the symptoms, enter the code, and get
          a step-by-step diagnostic —{' '}
          <span className="text-slate-300">with a professional PDF report your client will actually understand.</span>
        </>
      ),
      cta: 'Start free',
      secondaryCta: 'See how it works ↓',
      mockupHeader: 'MechaIA — Diagnostic',
      mockupStatus: '● Active session',
      mockupMsg1: "What's the issue the vehicle is showing?",
      mockupMsg2: 'VW Golf 2010, P0301 — cylinder 1 misfire',
      mockupMsg3: 'Are the spark plugs new? Is the misfire constant or only when cold?',
      mockupMsg4: 'New plugs, only misfires when cold',
    },
    problem: {
      title: 'Diagnostics are harder',
      titleHighlight: 'than people think',
      cards: [
        'P0301 could be 10 different things. The code doesn\'t tell you which one.',
        "That intermittent fault that disappears as soon as the car hits the bay.",
        'How do you justify a $150 diagnostic when the client thinks the scanner "just reads it"?',
      ],
      closing: 'MechaIA closes that gap.',
    },
    howItWorks: {
      title: 'Three steps and you\'re diagnosing',
      steps: [
        {
          title: 'Enter vehicle data',
          description: 'Make, model, engine, mileage, fault, and OBD code. Works with any scanner on the market.',
        },
        {
          title: 'Chat with the AI',
          description: 'MechaIA asks the right questions, analyzes the symptoms, and guides you step by step to the diagnosis.',
        },
        {
          title: 'Download the PDF report',
          description: 'A professional document with the full diagnostic, ready to hand to the client.',
        },
      ],
    },
    features: {
      title: 'Everything your shop needs',
      items: [
        {
          title: 'AI-guided diagnostic',
          description: "Tells you what to test next and in what order — not just what codes are present.",
        },
        {
          title: 'PDF report for the client',
          description: 'Send a professional report that explains why you charged what you charged.',
        },
        {
          title: 'Diagnostic history',
          description: 'All your cases saved and accessible from any device.',
        },
        {
          title: 'Works with any scanner',
          description: 'Enter the OBD code manually — no cables or special connections needed.',
        },
        {
          title: 'Works on mobile',
          description: 'Use it from the shop floor without a computer.',
        },
        {
          title: '5 free diagnostics',
          description: 'Start without a credit card and try it on your own real cases.',
        },
      ],
    },
    pricing: {
      title: 'Simple plans, no surprises',
      subtitle: 'Cancel anytime. No commitment.',
      base: {
        label: 'Base Plan',
        price: '$11.45',
        period: '/mo',
        features: [
          '150 messages per month',
          'Step-by-step guided diagnostic',
          'Downloadable PDF report',
          'Diagnostic history',
          'Works with any scanner',
          'Email support',
        ],
        cta: 'Start with Base',
      },
      turbo: {
        label: 'Turbo Plan',
        badge: 'RECOMMENDED',
        price: '$19.20',
        period: '/mo',
        features: [
          'Unlimited messages',
          'Step-by-step guided diagnostic',
          'Downloadable PDF report',
          'Diagnostic history',
          'Works with any scanner',
          'Priority support',
          'Early access to new features',
        ],
        cta: 'Start with Turbo',
      },
      freeNote: '5 free diagnostics. No credit card.',
      freeNotePrefix: 'Or start with ',
    },
    cta: {
      title: 'Diagnose faster. Explain better. Get paid for what you know.',
      subtitle: 'Start with 5 free diagnostics. No credit card. No commitment.',
      button: 'Start free today',
    },
    footer: {
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
      refund: 'Refunds',
    },
  },
};

interface LandingProps {
  onStartAuth: () => void;
}

export function Landing({ onStartAuth }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'es';
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === 'es' ? 'en' : 'es';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const handleSelectPlan = (plan: 'base' | 'turbo') => {
    localStorage.setItem('selectedPlan', plan);
    onStartAuth();
  };

  const t = translations[lang];

  return (
    <div className="bg-slate-950 text-white">
      <LandingNav scrolled={scrolled} onStartAuth={onStartAuth} t={t} lang={lang} onToggleLang={toggleLang} />
      <HeroSection onStartAuth={onStartAuth} t={t} />
      <ProblemSection t={t} />
      <HowItWorksSection t={t} />
      <FeaturesSection t={t} />
      <PricingSection onSelectPlan={handleSelectPlan} onStartAuth={onStartAuth} t={t} />
      <CtaSection onStartAuth={onStartAuth} t={t} />
      <FooterSection t={t} />
    </div>
  );
}

// ── Navbar ──────────────────────────────────────────────────────────────────

function LandingNav({
  scrolled,
  onStartAuth,
  t,
  lang,
  onToggleLang,
}: {
  scrolled: boolean;
  onStartAuth: () => void;
  t: typeof translations['es'];
  lang: Lang;
  onToggleLang: () => void;
}) {
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
            onClick={onToggleLang}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors tracking-widest"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button
            onClick={onStartAuth}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-xl transition-colors"
          >
            {t.nav.login}
          </button>
          <button
            onClick={onStartAuth}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            {t.nav.cta}
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ onStartAuth, t }: { onStartAuth: () => void; t: typeof translations['es'] }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-20 px-4 overflow-hidden isolate">
      <LiquidBackground />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {t.hero.badge}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
          {t.hero.title}
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button
            onClick={onStartAuth}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-900/30"
          >
            {t.hero.cta}
          </button>
          <a
            href="#como-funciona"
            className="px-8 py-3.5 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white rounded-xl font-medium text-base transition-colors"
          >
            {t.hero.secondaryCta}
          </a>
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-700 shadow-2xl overflow-hidden bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
              <span className="text-sm font-medium text-slate-200">{t.hero.mockupHeader}</span>
            </div>
            <span className="text-xs text-green-400 font-medium">{t.hero.mockupStatus}</span>
          </div>
          <div className="p-4 space-y-3 text-left">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs">🔧</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-xs">
                {t.hero.mockupMsg1}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                {t.hero.mockupMsg2}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs">🔧</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-200 max-w-sm">
                {t.hero.mockupMsg3}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                {t.hero.mockupMsg4}
              </div>
            </div>
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

// ── Problem ───────────────────────────────────────────────────────────────────

function ProblemSection({ t }: { t: typeof translations['es'] }) {
  const icons = [
    <AlertCircle className="w-6 h-6 text-red-400" />,
    <Clock className="w-6 h-6 text-orange-400" />,
    <MessageSquare className="w-6 h-6 text-yellow-400" />,
  ];

  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
          {t.problem.title}{' '}
          <span className="text-red-400">{t.problem.titleHighlight}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {t.problem.cards.map((text, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="mb-4">{icons[i]}</div>
              <p className="text-slate-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xl font-semibold text-white">{t.problem.closing}</p>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorksSection({ t }: { t: typeof translations['es'] }) {
  const icons = [
    <Wrench className="w-6 h-6 text-blue-400" />,
    <MessageSquare className="w-6 h-6 text-indigo-400" />,
    <FileText className="w-6 h-6 text-blue-400" />,
  ];
  const numbers = ['01', '02', '03'];

  return (
    <section id="como-funciona" className="py-24 px-4 bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t.howItWorks.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.howItWorks.steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              <div className="text-6xl font-black text-slate-800 leading-none mb-4 select-none">{numbers[i]}</div>
              <div className="mb-3">{icons[i]}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

function FeaturesSection({ t }: { t: typeof translations['es'] }) {
  const icons = [
    <Zap className="w-5 h-5 text-blue-400" />,
    <FileText className="w-5 h-5 text-indigo-400" />,
    <History className="w-5 h-5 text-blue-400" />,
    <Wrench className="w-5 h-5 text-indigo-400" />,
    <Smartphone className="w-5 h-5 text-blue-400" />,
    <CheckCircle className="w-5 h-5 text-green-400" />,
  ];

  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t.features.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((f, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/40 hover:bg-slate-800/80 transition-all"
            >
              <div className="mb-3">{icons[i]}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function PricingSection({
  onSelectPlan,
  onStartAuth,
  t,
}: {
  onSelectPlan: (plan: 'base' | 'turbo') => void;
  onStartAuth: () => void;
  t: typeof translations['es'];
}) {
  return (
    <section className="py-24 px-4 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">{t.pricing.title}</h2>
        <p className="text-slate-400 text-center mb-14">{t.pricing.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.pricing.base.label}</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{t.pricing.base.price}</span>
                <span className="text-slate-400">{t.pricing.base.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.base.features.map((f) => (
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
              {t.pricing.base.cta}
            </button>
          </div>

          <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8">
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {t.pricing.turbo.badge}
              </span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">{t.pricing.turbo.label}</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{t.pricing.turbo.price}</span>
                <span className="text-blue-200">{t.pricing.turbo.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {t.pricing.turbo.features.map((f) => (
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
              {t.pricing.turbo.cta}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          {t.pricing.freeNotePrefix}
          <button onClick={onStartAuth} className="text-slate-300 hover:text-white underline transition-colors">
            {t.pricing.freeNote}
          </button>
        </p>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CtaSection({ onStartAuth, t }: { onStartAuth: () => void; t: typeof translations['es'] }) {
  return (
    <section className="py-24 px-4 bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-center shadow-2xl shadow-blue-900/30">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-blue-100 mb-8 text-lg">{t.cta.subtitle}</p>
          <button
            onClick={onStartAuth}
            className="px-10 py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-lg transition-colors shadow-lg"
          >
            {t.cta.button}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function FooterSection({ t }: { t: typeof translations['es'] }) {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MechaIA" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-slate-300">MechaIA</span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-slate-500">
          <a href="/privacy" className="hover:text-slate-300 transition-colors">{t.footer.privacy}</a>
          <a href="/terms" className="hover:text-slate-300 transition-colors">{t.footer.terms}</a>
          <a href="/refund" className="hover:text-slate-300 transition-colors">{t.footer.refund}</a>
        </nav>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} MechaIA. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
