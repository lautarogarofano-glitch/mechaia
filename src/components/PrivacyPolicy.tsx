import { PolicyLayout, Section, usePolicyLang } from './PolicyLayout';

const LAST_UPDATED = '2026-05-07';

export function PrivacyPolicy() {
  const [lang, toggleLang] = usePolicyLang();
  const t = translations[lang];

  return (
    <PolicyLayout title={t.title} lastUpdated={LAST_UPDATED} lang={lang} onToggleLang={toggleLang}>
      <p className="text-slate-400">{t.intro}</p>

      <Section title={t.responsable.title}>
        <p>{t.responsable.body}</p>
        <ul className="list-disc pl-6 space-y-1 text-slate-400">
          <li><strong className="text-slate-200">{t.responsable.name}:</strong> Lautaro Garofano</li>
          <li><strong className="text-slate-200">{t.responsable.country}:</strong> {t.responsable.argentina}</li>
          <li><strong className="text-slate-200">{t.responsable.email}:</strong> <a href="mailto:legal@mechaia.app" className="text-blue-400 hover:underline">legal@mechaia.app</a></li>
        </ul>
      </Section>

      <Section title={t.dataCollected.title}>
        <p>{t.dataCollected.body}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-slate-200">{t.dataCollected.account.title}:</strong> {t.dataCollected.account.body}</li>
          <li><strong className="text-slate-200">{t.dataCollected.usage.title}:</strong> {t.dataCollected.usage.body}</li>
          <li><strong className="text-slate-200">{t.dataCollected.technical.title}:</strong> {t.dataCollected.technical.body}</li>
          <li><strong className="text-slate-200">{t.dataCollected.payment.title}:</strong> {t.dataCollected.payment.body}</li>
        </ul>
      </Section>

      <Section title={t.purposes.title}>
        <ul className="list-disc pl-6 space-y-2">
          {t.purposes.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p className="text-slate-400 italic">{t.purposes.note}</p>
      </Section>

      <Section title={t.providers.title}>
        <p>{t.providers.body}</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-slate-200">Supabase</strong> — {t.providers.supabase}</li>
          <li><strong className="text-slate-200">Anthropic (Claude)</strong> — {t.providers.anthropic}</li>
          <li><strong className="text-slate-200">Google (Gemini)</strong> — {t.providers.google}</li>
          <li><strong className="text-slate-200">Lemon Squeezy</strong> — {t.providers.lemon}</li>
          <li><strong className="text-slate-200">Vercel</strong> — {t.providers.vercel}</li>
        </ul>
        <p className="text-slate-400">{t.providers.transfer}</p>
      </Section>

      <Section title={t.rights.title}>
        <p>{t.rights.body}</p>
        <ul className="list-disc pl-6 space-y-1">
          {t.rights.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <p>
          {t.rights.exercise}{' '}
          <a href="mailto:legal@mechaia.app" className="text-blue-400 hover:underline">legal@mechaia.app</a>.
        </p>
        <p className="text-slate-400">{t.rights.aaip}</p>
      </Section>

      <Section title={t.retention.title}>
        <p>{t.retention.body}</p>
      </Section>

      <Section title={t.cookies.title}>
        <p>{t.cookies.body}</p>
      </Section>

      <Section title={t.minors.title}>
        <p>{t.minors.body}</p>
      </Section>

      <Section title={t.changes.title}>
        <p>{t.changes.body}</p>
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
    title: 'Política de Privacidad',
    intro: 'En MechaIA tomamos en serio la privacidad de los datos de los talleres y mecánicos que usan nuestra plataforma. Este documento explica qué datos recolectamos, para qué los usamos, con quién los compartimos y cómo podés ejercer tus derechos.',
    responsable: {
      title: '1. Responsable del tratamiento',
      body: 'El responsable del tratamiento de los datos personales es:',
      name: 'Responsable',
      country: 'País',
      email: 'Email de contacto',
      argentina: 'Argentina',
    },
    dataCollected: {
      title: '2. Datos que recolectamos',
      body: 'Para prestar el servicio recolectamos las siguientes categorías de datos:',
      account: {
        title: 'Datos de cuenta',
        body: 'Email, contraseña (hasheada, nunca en texto plano), nombre del taller y configuración de tu perfil.',
      },
      usage: {
        title: 'Datos de uso del servicio',
        body: 'Datos de los vehículos que cargás (patente, marca, modelo, motor, ECU, kilometraje, código OBD, descripción de la falla), mensajes intercambiados con el asistente IA, e historial de diagnósticos generados.',
      },
      technical: {
        title: 'Datos técnicos',
        body: 'Dirección IP (para limitar abusos del servicio), tipo de navegador, fecha y hora de las solicitudes, y cookies técnicas necesarias para mantener tu sesión iniciada.',
      },
      payment: {
        title: 'Datos de pago',
        body: 'Cuando contratás un plan pago, los datos de tu tarjeta los procesa nuestro proveedor de pagos Lemon Squeezy. MechaIA NO almacena ni tiene acceso a los números de tarjeta. Solo recibimos un identificador de suscripción y el estado del pago.',
      },
    },
    purposes: {
      title: '3. Para qué usamos tus datos',
      items: [
        'Prestar el servicio de diagnóstico (procesar tus consultas y generar respuestas con IA).',
        'Mantener tu cuenta activa, autenticarte y proteger tu sesión.',
        'Mejorar la experiencia del producto (analizar uso agregado y anónimo).',
        'Cumplir con obligaciones fiscales y legales relacionadas con la facturación.',
        'Comunicarnos con vos sobre cambios del servicio, soporte técnico o avisos importantes.',
      ],
      note: 'No usamos tus mensajes ni los datos de tus diagnósticos para entrenar modelos de inteligencia artificial. No vendemos tus datos a terceros.',
    },
    providers: {
      title: '4. Proveedores con los que compartimos datos',
      body: 'Para que el servicio funcione, compartimos algunos datos con proveedores especializados que actúan como encargados del tratamiento:',
      supabase: 'Base de datos y autenticación. Almacena tu cuenta, tus diagnósticos y archivos. Servidores en EE.UU. y/o UE.',
      anthropic: 'Procesa los mensajes del chat para generar las respuestas del diagnóstico. Servidores en EE.UU.',
      google: 'Genera los embeddings que permiten buscar información técnica relevante (RAG). Servidores en EE.UU.',
      lemon: 'Procesa los pagos como Merchant of Record. Almacena los datos de la tarjeta. Servidores en EE.UU.',
      vercel: 'Hosting de la aplicación y métricas anónimas de rendimiento. Servidores en EE.UU. y/o UE.',
      transfer: 'Algunos de estos proveedores procesan datos fuera de Argentina. Al usar MechaIA, aceptás esta transferencia internacional, en los términos del artículo 12 de la Ley 25.326.',
    },
    rights: {
      title: '5. Tus derechos',
      body: 'En cualquier momento podés ejercer los siguientes derechos sobre tus datos personales (artículos 14 a 17 de la Ley 25.326):',
      items: [
        'Acceso: pedirnos una copia de los datos que tenemos sobre vos.',
        'Rectificación: corregir datos inexactos o incompletos.',
        'Supresión: pedir que eliminemos tu cuenta y tus datos asociados.',
        'Oposición: oponerte a un tratamiento determinado de tus datos.',
        'Portabilidad: recibir tus datos en un formato estructurado.',
      ],
      exercise: 'Para ejercer cualquiera de estos derechos escribinos a',
      aaip: 'También podés presentar un reclamo ante la Agencia de Acceso a la Información Pública (AAIP), autoridad de aplicación de la Ley 25.326.',
    },
    retention: {
      title: '6. Por cuánto tiempo conservamos tus datos',
      body: 'Conservamos tus datos mientras tu cuenta esté activa. Si cancelás tu cuenta, eliminamos tus datos personales en un plazo máximo de 12 meses, excepto aquellos que estamos obligados a conservar por motivos fiscales o legales (típicamente 10 años para registros contables).',
    },
    cookies: {
      title: '7. Cookies',
      body: 'Usamos cookies técnicas necesarias para mantener tu sesión iniciada y recordar tu idioma preferido. No usamos cookies publicitarias ni de seguimiento entre sitios. La librería de analytics de Vercel solo registra métricas agregadas y anónimas (sin tu IP completa).',
    },
    minors: {
      title: '8. Menores de edad',
      body: 'MechaIA es un servicio profesional pensado para mecánicos y talleres mayores de 18 años. No recolectamos a sabiendas datos de menores de edad. Si detectamos que una cuenta pertenece a un menor, la cerraremos.',
    },
    changes: {
      title: '9. Cambios a esta política',
      body: 'Podemos actualizar esta política cuando cambien las funcionalidades del servicio o las leyes aplicables. Los cambios sustanciales te los comunicaremos por email a la dirección registrada en tu cuenta y/o mediante un aviso visible en la aplicación. La fecha de "última actualización" arriba indica cuándo se modificó por última vez.',
    },
    contact: {
      title: '10. Contacto',
      body: 'Si tenés cualquier consulta sobre esta política o sobre el tratamiento de tus datos, escribinos a',
    },
  },
  en: {
    title: 'Privacy Policy',
    intro: 'At MechaIA we take seriously the privacy of the workshops and mechanics who use our platform. This document explains what data we collect, what we use it for, who we share it with, and how you can exercise your rights.',
    responsable: {
      title: '1. Data controller',
      body: 'The party responsible for processing personal data is:',
      name: 'Controller',
      country: 'Country',
      email: 'Contact email',
      argentina: 'Argentina',
    },
    dataCollected: {
      title: '2. Data we collect',
      body: 'To deliver the service we collect the following categories of data:',
      account: {
        title: 'Account data',
        body: 'Email, password (hashed, never in plain text), workshop name and your profile settings.',
      },
      usage: {
        title: 'Service usage data',
        body: 'Vehicle data you enter (license plate, make, model, engine, ECU, mileage, OBD code, fault description), messages exchanged with the AI assistant, and history of diagnostics generated.',
      },
      technical: {
        title: 'Technical data',
        body: 'IP address (to limit service abuse), browser type, date and time of requests, and technical cookies needed to keep your session active.',
      },
      payment: {
        title: 'Payment data',
        body: 'When you subscribe to a paid plan, your card details are processed by our payment provider Lemon Squeezy. MechaIA does NOT store or have access to card numbers. We only receive a subscription identifier and the payment status.',
      },
    },
    purposes: {
      title: '3. What we use your data for',
      items: [
        'Delivering the diagnostic service (processing your queries and generating AI responses).',
        'Keeping your account active, authenticating you and protecting your session.',
        'Improving the product experience (analyzing aggregate, anonymized usage).',
        'Complying with tax and legal obligations related to billing.',
        'Communicating with you about service changes, technical support, or important notices.',
      ],
      note: 'We do NOT use your messages or diagnostic data to train AI models. We do NOT sell your data to third parties.',
    },
    providers: {
      title: '4. Providers we share data with',
      body: 'For the service to work, we share some data with specialized providers acting as data processors:',
      supabase: 'Database and authentication. Stores your account, diagnostics and files. Servers in the US and/or EU.',
      anthropic: 'Processes chat messages to generate diagnostic responses. Servers in the US.',
      google: 'Generates the embeddings used to retrieve relevant technical information (RAG). Servers in the US.',
      lemon: 'Processes payments as Merchant of Record. Stores card data. Servers in the US.',
      vercel: 'Application hosting and anonymous performance metrics. Servers in the US and/or EU.',
      transfer: 'Some of these providers process data outside Argentina. By using MechaIA, you accept this international transfer, under article 12 of Argentine Law 25.326.',
    },
    rights: {
      title: '5. Your rights',
      body: 'At any time you can exercise the following rights over your personal data (articles 14 to 17 of Law 25.326):',
      items: [
        'Access: request a copy of the data we hold about you.',
        'Rectification: correct inaccurate or incomplete data.',
        'Deletion: request that we remove your account and associated data.',
        'Objection: object to a specific use of your data.',
        'Portability: receive your data in a structured format.',
      ],
      exercise: 'To exercise any of these rights, write to us at',
      aaip: 'You may also file a claim with the Argentine Agency for Access to Public Information (AAIP), the enforcement authority of Law 25.326.',
    },
    retention: {
      title: '6. How long we keep your data',
      body: 'We keep your data while your account is active. If you cancel your account, we delete your personal data within 12 months, except data we are required to retain for tax or legal reasons (typically 10 years for accounting records).',
    },
    cookies: {
      title: '7. Cookies',
      body: 'We use technical cookies needed to keep your session active and remember your preferred language. We do not use advertising or cross-site tracking cookies. The Vercel analytics library records only aggregate, anonymous metrics (without your full IP).',
    },
    minors: {
      title: '8. Minors',
      body: 'MechaIA is a professional service intended for mechanics and workshops aged 18 or older. We do not knowingly collect data from minors. If we detect that an account belongs to a minor, we will close it.',
    },
    changes: {
      title: '9. Changes to this policy',
      body: 'We may update this policy when service features or applicable laws change. We will notify you of substantial changes by email to the address registered in your account and/or through a visible notice in the application. The "last updated" date above indicates when it was last modified.',
    },
    contact: {
      title: '10. Contact',
      body: 'If you have any questions about this policy or about how we process your data, write to us at',
    },
  },
} as const;
