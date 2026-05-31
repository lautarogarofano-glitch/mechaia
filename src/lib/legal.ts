// Registro central de documentos legales de MECHAIA y versión del paquete contractual.
// El contrato (Carta Oferta de Servicios) y sus documentos integrantes se versionan en
// conjunto con CONTRACT_VERSION. Cualquier cambio sustancial al texto legal debe SUBIR
// esta versión: así el audit trail (tabla contract_acceptances) registra qué versión
// exacta aceptó cada usuario, conforme Cap. 4.4 y 16.5 de las Condiciones Generales.

import condicionesEs from '../legal/condiciones-generales.es.md?raw';
import usoAceptableEs from '../legal/uso-aceptable.es.md?raw';
import consentimientoIaEs from '../legal/consentimiento-ia.es.md?raw';
import transferenciasEs from '../legal/transferencias-internacionales.es.md?raw';

/** Versión del paquete contractual completo (Condiciones + documentos integrantes). */
export const CONTRACT_VERSION = '1.0';

/** Fecha de vigencia del paquete contractual vigente. */
export const CONTRACT_LAST_UPDATED = '2026-05-31';

export type LegalDocKey =
  | 'condiciones'
  | 'uso-aceptable'
  | 'consentimiento-ia'
  | 'transferencias-internacionales';

export interface LegalDocMeta {
  key: LegalDocKey;
  /** Ruta pública donde se renderiza el documento. */
  path: string;
  title: string;
  /** Cuerpo del documento en markdown (es). */
  body: string;
}

/** Documentos legales renderizados desde markdown en la app. */
export const LEGAL_DOCS: Record<LegalDocKey, LegalDocMeta> = {
  condiciones: {
    key: 'condiciones',
    path: '/condiciones',
    title: 'Condiciones Generales de Contratación',
    body: condicionesEs,
  },
  'uso-aceptable': {
    key: 'uso-aceptable',
    path: '/uso-aceptable',
    title: 'Política de Uso Aceptable',
    body: usoAceptableEs,
  },
  'consentimiento-ia': {
    key: 'consentimiento-ia',
    path: '/consentimiento-ia',
    title: 'Consentimiento para el Uso de Inteligencia Artificial',
    body: consentimientoIaEs,
  },
  'transferencias-internacionales': {
    key: 'transferencias-internacionales',
    path: '/transferencias-internacionales',
    title: 'Consentimiento para Transferencias Internacionales de Datos',
    body: transferenciasEs,
  },
};

/**
 * Snapshot de los documentos que el usuario acepta al registrarse. Se persiste como
 * parte del registro de aceptación para acreditar exactamente qué se aceptó y en qué versión.
 */
export const ACCEPTED_DOCUMENTS: { doc: string; version: string }[] = [
  { doc: 'condiciones-generales', version: CONTRACT_VERSION },
  { doc: 'privacy', version: CONTRACT_VERSION },
  { doc: 'refund', version: CONTRACT_VERSION },
  { doc: 'uso-aceptable', version: CONTRACT_VERSION },
  { doc: 'consentimiento-ia', version: CONTRACT_VERSION },
  { doc: 'transferencias-internacionales', version: CONTRACT_VERSION },
];

/** Estructura del consentimiento capturado en el signup. */
export interface AcceptanceSnapshot {
  contractVersion: string;
  acceptedConditions: boolean;
  acceptedAiConsent: boolean;
  acceptedIntlTransfer: boolean;
  documents: { doc: string; version: string }[];
}

const PENDING_KEY = 'mechaia_pending_acceptance';

/** Guarda el consentimiento dado en el signup para registrarlo al primer acceso autenticado. */
export function storePendingAcceptance(snapshot: AcceptanceSnapshot): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage no disponible — el registro se hará igual al autenticarse (ver record-acceptance)
  }
}

export function readPendingAcceptance(): AcceptanceSnapshot | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as AcceptanceSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearPendingAcceptance(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // noop
  }
}
