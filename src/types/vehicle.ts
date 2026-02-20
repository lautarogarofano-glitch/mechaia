export interface VehicleData {
  patente: string;
  marca: string;
  modelo: string;
  año: string;
  motor: string;
  ecu: string;
  falla: string;
  codigoObd?: string;
  kilometraje?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DiagnosisSession {
  id: string;
  vehicle: VehicleData;
  messages: Message[];
  createdAt: Date;
  status: 'active' | 'completed';
}
