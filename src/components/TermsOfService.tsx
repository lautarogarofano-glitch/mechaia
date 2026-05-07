import { PolicyLayout, Section, usePolicyLang } from './PolicyLayout';

const LAST_UPDATED = '2026-05-07';

export function TermsOfService() {
  const [lang, toggleLang] = usePolicyLang();
  const t = translations[lang];

  return (
    <PolicyLayout title={t.title} lastUpdated={LAST_UPDATED} lang={lang} onToggleLang={toggleLang}>
      <p className="text-slate-400">{t.intro}</p>

      <Section title={t.acceptance.title}>
        <p>{t.acceptance.body}</p>
      </Section>

      <Section title={t.service.title}>
        <p>{t.service.body}</p>
        <div className="border-l-4 border-amber-500/60 bg-amber-500/10 px-5 py-4 rounded-r-lg my-4">
          <p className="font-semibold text-amber-200 mb-1">{t.service.disclaimerTitle}</p>
          <p className="text-amber-100/90 text-sm">{t.service.disclaimerBody}</p>
        </div>
      </Section>

      <Section title={t.account.title}>
        <ul className="list-disc pl-6 space-y-2">
          {t.account.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </Section>

      <Section title={t.plans.title}>
        <p>{t.plans.body}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-slate-200">{t.plans.trial.label}:</strong> {t.plans.trial.body}</li>
          <li><strong className="text-slate-200">{t.plans.base.label}:</strong> {t.plans.base.body}</li>
          <li><strong className="text-slate-200">{t.plans.turbo.label}:</strong> {t.plans.turbo.body}</li>
        </ul>
        <p>{t.plans.lemon}</p>
        <p className="font-semibold text-slate-200">{t.plans.noRefund}</p>
        <p>{t.plans.cancellation}</p>
      </Section>

      <Section title={t.acceptableUse.title}>
        <p>{t.acceptableUse.intro}</p>
        <ul className="list-disc pl-6 space-y-2">
          {t.acceptableUse.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p>{t.acceptableUse.consequence}</p>
      </Section>

      <Section title={t.intellectualProperty.title}>
        <p>{t.intellectualProperty.platform}</p>
        <p>{t.intellectualProperty.userContent}</p>
      </Section>

      <Section title={t.warranty.title}>
        <p>{t.warranty.body}</p>
      </Section>

      <Section title={t.liability.title}>
        <p>{t.liability.body}</p>
        <p className="text-slate-400">{t.liability.cap}</p>
      </Section>

      <Section title={t.modifications.title}>
        <p>{t.modifications.body}</p>
      </Section>

      <Section title={t.termination.title}>
        <p>{t.termination.body}</p>
      </Section>

      <Section title={t.lawAndJurisdiction.title}>
        <p>{t.lawAndJurisdiction.body}</p>
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
    title: 'Términos y Condiciones',
    intro: 'Estos términos rigen el uso de MechaIA. Al crear una cuenta o usar el servicio aceptás estos términos. Te pedimos que los leas con atención, especialmente las secciones de descargo, garantías y límites de responsabilidad.',
    acceptance: {
      title: '1. Aceptación de los términos',
      body: 'Al registrarte y/o utilizar MechaIA, manifestás que sos mayor de 18 años, que tenés capacidad legal para contratar y que aceptás estos Términos y Condiciones, así como nuestra Política de Privacidad y Política de Reembolsos. Si no estás de acuerdo, no podés utilizar el servicio.',
    },
    service: {
      title: '2. Descripción del servicio',
      body: 'MechaIA es una plataforma de software como servicio (SaaS) que asiste a mecánicos y talleres en el diagnóstico de fallas vehiculares mediante inteligencia artificial y una base de conocimiento técnica. El servicio incluye: chat con asistente IA, generación de informes en PDF, historial de diagnósticos y panel de administración.',
      disclaimerTitle: '⚠️ Importante — MechaIA es una herramienta de apoyo, no un reemplazo del juicio profesional',
      disclaimerBody: 'Las respuestas que entrega MechaIA son orientativas y se generan con modelos de inteligencia artificial que pueden contener errores, omisiones o información desactualizada. La decisión final sobre el diagnóstico, las pruebas a realizar y la reparación a aplicar es responsabilidad exclusiva del mecánico profesional. MechaIA no reemplaza el conocimiento técnico, la experiencia práctica ni los manuales de servicio del fabricante. NO somos responsables por daños materiales, lesiones, pérdidas económicas o consecuencias derivadas de aplicar diagnósticos o reparaciones basadas en las respuestas del servicio.',
    },
    account: {
      title: '3. Cuenta de usuario',
      items: [
        'Tenés que registrarte con un email válido y crear una contraseña de al menos 6 caracteres.',
        'Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta.',
        'Tenés que notificarnos inmediatamente si sospechás un acceso no autorizado a tu cuenta.',
        'Una cuenta corresponde a un único profesional o taller. No podés compartirla ni revenderla.',
        'Los datos que cargás (vehículos, fallas, etc.) deben ser veraces y obtenidos lícitamente.',
      ],
    },
    plans: {
      title: '4. Planes, pago y cancelación',
      body: 'Ofrecemos los siguientes planes:',
      trial: {
        label: 'Trial gratuito',
        body: '5 diagnósticos gratis al crear la cuenta, sin necesidad de tarjeta. Una vez agotados, tenés que contratar un plan pago para seguir usando el servicio.',
      },
      base: {
        label: 'Plan Base',
        body: 'USD 11.45 por mes, 150 mensajes con el asistente por mes.',
      },
      turbo: {
        label: 'Plan Turbo',
        body: 'USD 19.20 por mes, mensajes ilimitados con el asistente.',
      },
      lemon: 'Los pagos los procesa Lemon Squeezy actuando como Merchant of Record. La factura la emite Lemon Squeezy, que también se hace cargo de los impuestos aplicables (IVA, sales tax, etc.) según tu país.',
      noRefund: 'No realizamos reembolsos. Para más detalles, ver la Política de Reembolsos.',
      cancellation: 'Podés cancelar tu suscripción en cualquier momento desde tu perfil. La cancelación tiene efecto al finalizar el período pagado: vas a poder seguir usando el servicio hasta esa fecha y no se te volverá a cobrar.',
    },
    acceptableUse: {
      title: '5. Uso aceptable',
      intro: 'Al usar MechaIA, te comprometés a NO:',
      items: [
        'Usar el servicio para fines ilegales, fraudulentos o que violen derechos de terceros.',
        'Cargar datos personales de terceros sin su consentimiento.',
        'Intentar acceder a cuentas, sistemas o datos a los que no estés autorizado.',
        'Aplicar ingeniería inversa, desensamblar, descompilar ni intentar extraer el código fuente del servicio.',
        'Usar bots, scrapers o cualquier mecanismo automatizado para extraer datos masivamente.',
        'Revender, sublicenciar ni compartir tu acceso con terceros.',
        'Sobrecargar deliberadamente la infraestructura o eludir los límites de mensajes.',
        'Usar el servicio para entrenar modelos de IA propios o de terceros.',
      ],
      consequence: 'Si detectamos un uso indebido podemos suspender o cerrar tu cuenta sin reembolso, además de iniciar las acciones legales que correspondan.',
    },
    intellectualProperty: {
      title: '6. Propiedad intelectual',
      platform: 'MechaIA, su logo, código fuente, diseño, base de conocimiento curada y todo el material publicado en la plataforma son propiedad de Lautaro Garofano y/o sus licenciantes, y están protegidos por las leyes de propiedad intelectual aplicables. Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar el servicio mientras tu cuenta esté activa.',
      userContent: 'Los datos que cargás vos (vehículos, mensajes, descripciones de fallas) son de tu propiedad. Vos nos otorgás el permiso necesario para procesarlos a fin de prestarte el servicio (incluyendo enviarlos a los proveedores listados en la Política de Privacidad). No reclamamos propiedad sobre tus datos.',
    },
    warranty: {
      title: '7. Garantía',
      body: 'El servicio se presta "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo, expresas o implícitas. No garantizamos que el servicio sea ininterrumpido, libre de errores, ni que las respuestas del asistente sean precisas, completas o adecuadas para un caso particular. Hacemos esfuerzos razonables para mantener una buena calidad, pero al ser un servicio basado en IA, las respuestas pueden contener errores.',
    },
    liability: {
      title: '8. Limitación de responsabilidad',
      body: 'En la máxima medida permitida por la ley aplicable, MechaIA y su responsable no serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de ganancias, pérdida de datos, daños a vehículos derivados de aplicar diagnósticos, costos de reparación, pérdida de clientes ni cualquier otro daño derivado del uso o imposibilidad de uso del servicio.',
      cap: 'En cualquier caso, la responsabilidad total acumulada de MechaIA hacia un usuario por cualquier reclamo no superará el monto pagado por ese usuario en los 3 meses inmediatamente anteriores al hecho que originó el reclamo.',
    },
    modifications: {
      title: '9. Modificaciones del servicio y los términos',
      body: 'Podemos modificar el servicio, los planes, los precios o estos términos en cualquier momento. Te notificaremos los cambios sustanciales por email y/o mediante un aviso visible en la aplicación, con al menos 15 días de antelación cuando los cambios afecten tu plan vigente. Si no estás de acuerdo con los cambios, podés cancelar tu cuenta antes de que entren en vigencia.',
    },
    termination: {
      title: '10. Terminación',
      body: 'Podés cerrar tu cuenta en cualquier momento desde la sección de configuración o escribiéndonos. Nosotros podemos suspender o cerrar tu cuenta si incumplís estos términos, si dejás de pagar tu suscripción, o si hay un motivo legal o de seguridad que lo justifique. En caso de cierre por incumplimiento, no se realizan reembolsos.',
    },
    lawAndJurisdiction: {
      title: '11. Ley aplicable y jurisdicción',
      body: 'Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia derivada de estos términos o del uso del servicio se someterá a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, Argentina, salvo que la ley aplicable a los consumidores establezca lo contrario.',
    },
    contact: {
      title: '12. Contacto',
      body: 'Para consultas legales o relacionadas con estos términos, escribinos a',
    },
  },
  en: {
    title: 'Terms of Service',
    intro: 'These terms govern the use of MechaIA. By creating an account or using the service you accept these terms. Please read them carefully, especially the disclaimer, warranty and liability sections.',
    acceptance: {
      title: '1. Acceptance of terms',
      body: 'By registering and/or using MechaIA, you represent that you are 18 or older, that you have legal capacity to enter into a contract, and that you accept these Terms of Service, our Privacy Policy and our Refund Policy. If you do not agree, you may not use the service.',
    },
    service: {
      title: '2. Service description',
      body: 'MechaIA is a software-as-a-service (SaaS) platform that assists mechanics and workshops in diagnosing vehicle faults through artificial intelligence and a curated technical knowledge base. The service includes: AI assistant chat, PDF report generation, diagnostic history, and an admin panel.',
      disclaimerTitle: '⚠️ Important — MechaIA is a support tool, not a replacement for professional judgment',
      disclaimerBody: 'The responses provided by MechaIA are guidance only, generated by artificial intelligence models that may contain errors, omissions, or outdated information. The final decision about the diagnosis, the tests to perform, and the repairs to apply is the sole responsibility of the professional mechanic. MechaIA does not replace technical expertise, hands-on experience, or the manufacturer\'s service manuals. We are NOT responsible for property damage, injury, economic loss, or consequences arising from applying diagnoses or repairs based on the service\'s responses.',
    },
    account: {
      title: '3. User account',
      items: [
        'You must register with a valid email and create a password of at least 6 characters.',
        'You are responsible for keeping your password confidential and for all activity carried out from your account.',
        'You must notify us immediately if you suspect unauthorized access to your account.',
        'One account corresponds to a single professional or workshop. You may not share or resell it.',
        'The data you upload (vehicles, faults, etc.) must be truthful and lawfully obtained.',
      ],
    },
    plans: {
      title: '4. Plans, payment and cancellation',
      body: 'We offer the following plans:',
      trial: {
        label: 'Free trial',
        body: '5 free diagnostics when you create the account, no credit card required. Once exhausted, you must subscribe to a paid plan to continue using the service.',
      },
      base: {
        label: 'Base Plan',
        body: 'USD 11.45 per month, 150 messages with the assistant per month.',
      },
      turbo: {
        label: 'Turbo Plan',
        body: 'USD 19.20 per month, unlimited messages with the assistant.',
      },
      lemon: 'Payments are processed by Lemon Squeezy acting as Merchant of Record. The invoice is issued by Lemon Squeezy, which also handles applicable taxes (VAT, sales tax, etc.) according to your country.',
      noRefund: 'We do not issue refunds. See the Refund Policy for details.',
      cancellation: 'You can cancel your subscription at any time from your profile. Cancellation takes effect at the end of the paid period: you can continue using the service until that date, and you will not be charged again.',
    },
    acceptableUse: {
      title: '5. Acceptable use',
      intro: 'When using MechaIA, you agree NOT to:',
      items: [
        'Use the service for unlawful, fraudulent, or rights-infringing purposes.',
        'Upload personal data of third parties without their consent.',
        'Attempt to access accounts, systems or data you are not authorized to.',
        'Reverse-engineer, disassemble, decompile, or attempt to extract the source code of the service.',
        'Use bots, scrapers, or any automated mechanism to extract data in bulk.',
        'Resell, sublicense, or share your access with third parties.',
        'Deliberately overload the infrastructure or bypass message limits.',
        'Use the service to train your own or third-party AI models.',
      ],
      consequence: 'If we detect misuse we may suspend or close your account without refund, and pursue any applicable legal action.',
    },
    intellectualProperty: {
      title: '6. Intellectual property',
      platform: 'MechaIA, its logo, source code, design, curated knowledge base and all material published on the platform are the property of Lautaro Garofano and/or its licensors, and are protected by applicable intellectual-property laws. We grant you a limited, non-exclusive, non-transferable, revocable license to use the service while your account is active.',
      userContent: 'The data you upload (vehicles, messages, fault descriptions) belongs to you. You grant us the necessary permission to process it in order to deliver the service (including sending it to the providers listed in the Privacy Policy). We do not claim ownership over your data.',
    },
    warranty: {
      title: '7. Warranty',
      body: 'The service is provided "AS IS" and "AS AVAILABLE", without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that the assistant\'s responses will be accurate, complete, or suitable for a particular case. We make reasonable efforts to maintain quality, but as an AI-based service, responses may contain errors.',
    },
    liability: {
      title: '8. Limitation of liability',
      body: 'To the maximum extent permitted by applicable law, MechaIA and its operator shall not be liable for indirect, incidental, special, consequential or punitive damages, including loss of profits, loss of data, vehicle damage arising from applying diagnoses, repair costs, loss of customers or any other damage arising from the use or inability to use the service.',
      cap: 'In any case, the total cumulative liability of MechaIA toward a user for any claim shall not exceed the amount paid by that user in the 3 months immediately preceding the event giving rise to the claim.',
    },
    modifications: {
      title: '9. Modifications to the service and terms',
      body: 'We may modify the service, plans, prices, or these terms at any time. We will notify you of substantial changes by email and/or through a visible notice in the application, with at least 15 days\' advance notice when changes affect your active plan. If you disagree with the changes, you can cancel your account before they take effect.',
    },
    termination: {
      title: '10. Termination',
      body: 'You can close your account at any time from the settings section or by writing to us. We may suspend or close your account if you breach these terms, fail to pay your subscription, or for legal or security reasons. In case of closure for breach, no refunds are issued.',
    },
    lawAndJurisdiction: {
      title: '11. Governing law and jurisdiction',
      body: 'These terms are governed by the laws of the Argentine Republic. Any dispute arising from these terms or the use of the service shall be submitted to the ordinary courts of the City of Buenos Aires, Argentina, unless applicable consumer-protection law provides otherwise.',
    },
    contact: {
      title: '12. Contact',
      body: 'For legal inquiries or questions related to these terms, write to us at',
    },
  },
} as const;
