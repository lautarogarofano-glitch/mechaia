import { PolicyLayout, Section, usePolicyLang } from './PolicyLayout';

const LAST_UPDATED = '2026-05-07';

export function RefundPolicy() {
  const [lang, toggleLang] = usePolicyLang();
  const t = translations[lang];

  return (
    <PolicyLayout title={t.title} lastUpdated={LAST_UPDATED} lang={lang} onToggleLang={toggleLang}>
      <p className="text-slate-400">{t.intro}</p>

      <Section title={t.policy.title}>
        <div className="border-l-4 border-amber-500/60 bg-amber-500/10 px-5 py-4 rounded-r-lg my-2">
          <p className="font-semibold text-amber-200">{t.policy.headline}</p>
        </div>
        <p>{t.policy.body}</p>
      </Section>

      <Section title={t.trial.title}>
        <p>{t.trial.body}</p>
      </Section>

      <Section title={t.cancellation.title}>
        <p>{t.cancellation.body}</p>
        <ol className="list-decimal pl-6 space-y-2">
          {t.cancellation.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
        <p>{t.cancellation.afterCancel}</p>
      </Section>

      <Section title={t.exceptions.title}>
        <p>{t.exceptions.body}</p>
        <ul className="list-disc pl-6 space-y-2">
          {t.exceptions.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p>
          {t.exceptions.howTo}{' '}
          <a href="mailto:legal@mechaia.app" className="text-blue-400 hover:underline">legal@mechaia.app</a>
          {t.exceptions.howToEnd}
        </p>
      </Section>

      <Section title={t.lemon.title}>
        <p>{t.lemon.body}</p>
      </Section>

      <Section title={t.contact.title}>
        <p>
          {t.contact.body}{' '}
          <a href="mailto:legal@mechaia.app" className="text-blue-400 hover:underline">legal@mechaia.app</a>.
        </p>
      </Section>
    </PolicyLayout>
  );
}

const translations = {
  es: {
    title: 'Política de Reembolsos y Cancelación',
    intro: 'Esta política explica cómo funcionan los reembolsos y la cancelación de suscripciones en MechaIA. La leéste antes de contratar un plan y te recomendamos revisarla cuando vayas a cancelar.',
    policy: {
      title: '1. Política general',
      headline: 'No realizamos reembolsos.',
      body: 'Una vez procesado el pago de un período (mensual), no se devuelve dinero por el resto del período aunque dejes de usar el servicio o canceles antes de que termine. Esta política aplica a todos los planes pagos (Base y Turbo) y a todas las renovaciones.',
    },
    trial: {
      title: '2. Trial gratuito',
      body: 'MechaIA ofrece un trial gratuito de 5 diagnósticos al crear la cuenta, sin necesidad de tarjeta de crédito. Te recomendamos aprovecharlo para evaluar si el servicio es adecuado para tu taller antes de contratar un plan pago.',
    },
    cancellation: {
      title: '3. Cómo cancelar tu suscripción',
      body: 'Podés cancelar tu suscripción en cualquier momento, sin trámites ni preguntas. Para cancelar:',
      steps: [
        'Iniciá sesión en MechaIA.',
        'Andá a la sección "Configuración" desde el menú lateral.',
        'En "Plan y suscripción", clickeá "Cancelar suscripción" y confirmá.',
      ],
      afterCancel: 'Una vez cancelada, vas a poder seguir usando el servicio hasta el final del período pagado en curso. No se te volverá a cobrar a partir de esa fecha.',
    },
    exceptions: {
      title: '4. Excepciones',
      body: 'Como excepción a la política general, podemos analizar la devolución del importe en estos casos puntuales:',
      items: [
        'Cobro duplicado por un error técnico (mismo período cobrado dos veces).',
        'Cobro tras una cancelación efectiva ya confirmada por nosotros o por Lemon Squeezy.',
        'Imposibilidad total de usar el servicio durante todo un período pagado por una caída de nuestra plataforma atribuible a nosotros.',
      ],
      howTo: 'Para reportar uno de estos casos, escribinos a',
      howToEnd: ' dentro de los 30 días del cobro, indicando el ID de tu suscripción y una breve descripción del problema. Vamos a responderte en un plazo máximo de 7 días hábiles.',
    },
    lemon: {
      title: '5. Procesador de pagos',
      body: 'Los pagos los procesa Lemon Squeezy actuando como Merchant of Record. Esto significa que la factura la emite Lemon Squeezy y que el reembolso, cuando corresponda, lo procesan ellos. El dinero suele aparecer reintegrado en tu medio de pago entre 5 y 10 días hábiles después de aprobado el reembolso.',
    },
    contact: {
      title: '6. Contacto',
      body: 'Para cualquier consulta sobre esta política, escribinos a',
    },
  },
  en: {
    title: 'Refund and Cancellation Policy',
    intro: 'This policy explains how refunds and subscription cancellation work at MechaIA. Please read it before subscribing to a plan, and review it again when you decide to cancel.',
    policy: {
      title: '1. General policy',
      headline: 'We do not issue refunds.',
      body: 'Once the payment for a billing period (monthly) has been processed, no money is returned for the remainder of that period, even if you stop using the service or cancel before it ends. This policy applies to all paid plans (Base and Turbo) and to all renewals.',
    },
    trial: {
      title: '2. Free trial',
      body: 'MechaIA offers a free trial of 5 diagnostics when you create your account, with no credit card required. We recommend using it to evaluate whether the service is right for your workshop before subscribing to a paid plan.',
    },
    cancellation: {
      title: '3. How to cancel your subscription',
      body: 'You can cancel your subscription at any time, with no questions asked. To cancel:',
      steps: [
        'Sign in to MechaIA.',
        'Go to the "Settings" section from the side menu.',
        'Under "Plan and subscription", click "Cancel subscription" and confirm.',
      ],
      afterCancel: 'After cancelling, you can keep using the service until the end of the current paid period. You will not be charged again from that date onward.',
    },
    exceptions: {
      title: '4. Exceptions',
      body: 'As an exception to the general policy, we may consider a refund in these specific cases:',
      items: [
        'Duplicate charge due to a technical error (same period charged twice).',
        'Charge after a cancellation already confirmed by us or by Lemon Squeezy.',
        'Total inability to use the service for an entire paid period due to a platform outage attributable to us.',
      ],
      howTo: 'To report one of these cases, write to us at',
      howToEnd: ' within 30 days of the charge, including your subscription ID and a brief description of the issue. We will reply within 7 business days.',
    },
    lemon: {
      title: '5. Payment processor',
      body: 'Payments are processed by Lemon Squeezy acting as Merchant of Record. This means Lemon Squeezy issues the invoice and any refund, when applicable, is processed by them. Refunds typically appear on your payment method 5 to 10 business days after approval.',
    },
    contact: {
      title: '6. Contact',
      body: 'For any inquiry about this policy, write to us at',
    },
  },
} as const;
