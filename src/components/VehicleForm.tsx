import { useState } from 'react';
import type { VehicleData } from '../types/vehicle';

interface VehicleFormProps {
  onSubmit: (data: VehicleData) => void;
}

// Patente argentina: viejo formato AAA 123, nuevo formato AB 123 CD (Mercosur)
const PATENTE_REGEX = /^[A-Z]{3}\s?\d{3}$|^[A-Z]{2}\s?\d{3}\s?[A-Z]{2}$/;

const currentYear = new Date().getFullYear();

const MARCAS = [
  'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep',
  'Kia', 'Mercedes-Benz', 'Nissan', 'Peugeot', 'Renault', 'Suzuki',
  'Toyota', 'Volkswagen', 'Volvo',
];

const MODELOS_POR_MARCA: Record<string, string[]> = {
  Chevrolet: ['Agile', 'Captiva', 'Classic', 'Cobalt', 'Corsa', 'Cruze', 'Equinox', 'Montana', 'Onix', 'S10', 'Spin', 'Tracker'],
  Citroën: ['Berlingo', 'C3', 'C4', 'C5', 'Jumpy', 'Nemo', 'Xsara Picasso'],
  Fiat: ['Cronos', 'Doblò', 'Ducato', 'Fiorino', 'Idea', 'Linea', 'Mobi', 'Palio', 'Punto', 'Siena', 'Strada', 'Toro', 'Uno'],
  Ford: ['EcoSport', 'Edge', 'Escort', 'Explorer', 'F-100', 'F-150', 'Fiesta', 'Focus', 'Ka', 'Maverick', 'Mondeo', 'Ranger', 'Territory'],
  Honda: ['City', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Jazz', 'WR-V'],
  Hyundai: ['Accent', 'Creta', 'Elantra', 'Getz', 'i10', 'i20', 'i30', 'Santa Fe', 'Tucson'],
  Jeep: ['Cherokee', 'Commander', 'Compass', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  Kia: ['Cerato', 'Picanto', 'Rio', 'Sorento', 'Sportage', 'Stonic'],
  'Mercedes-Benz': ['A 200', 'C 200', 'C 300', 'E 200', 'GLA', 'GLC', 'Sprinter', 'Vito'],
  Nissan: ['Frontier', 'Kicks', 'Leaf', 'March', 'Murano', 'Pathfinder', 'Sentra', 'X-Trail'],
  Peugeot: ['206', '207', '208', '2008', '3008', '301', '307', '308', '408', '5008', 'Expert', 'Partner'],
  Renault: ['Alaskan', 'Clio', 'Duster', 'Fluence', 'Kangoo', 'Koleos', 'Kwid', 'Logan', 'Master', 'Megane', 'Oroch', 'Sandero', 'Symbol'],
  Suzuki: ['Baleno', 'Grand Vitara', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'],
  Toyota: ['Camry', 'Corolla', 'Etios', 'GR Supra', 'Hilux', 'Land Cruiser', 'Prius', 'RAV4', 'Rush', 'SW4', 'Yaris'],
  Volkswagen: ['Amarok', 'Caddy', 'Gol', 'Golf', 'Jetta', 'Passat', 'Polo', 'Saveiro', 'T-Cross', 'Taos', 'Tiguan', 'Up', 'Vento'],
  Volvo: ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90'],
};

export function VehicleForm({ onSubmit }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleData>({
    patente: '', marca: '', modelo: '', año: '', motor: '', ecu: '', falla: '', codigoObd: '', kilometraje: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleData, string>>>({});

  const modelos = MODELOS_POR_MARCA[formData.marca] ?? [];

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleData, string>> = {};

    const patenteClean = formData.patente.replace(/\s/g, '');
    if (!patenteClean) {
      newErrors.patente = 'Requerido';
    } else if (!PATENTE_REGEX.test(formData.patente)) {
      newErrors.patente = 'Formato inválido (ej: AB 123 CD)';
    }

    if (!formData.marca) newErrors.marca = 'Requerido';
    if (!formData.modelo) newErrors.modelo = 'Requerido';

    const año = parseInt(formData.año);
    if (!formData.año) {
      newErrors.año = 'Requerido';
    } else if (isNaN(año) || año < 1950 || año > currentYear + 1) {
      newErrors.año = `Entre 1950 y ${currentYear + 1}`;
    }

    if (!formData.falla.trim()) newErrors.falla = 'Describí la falla';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof VehicleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    // Al cambiar marca, limpiar modelo
    if (field === 'marca') setFormData(prev => ({ ...prev, marca: value, modelo: '' }));
  };

  const fieldClass = (field: keyof VehicleData) =>
    `w-full h-12 px-4 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white ${
      errors[field]
        ? 'border-red-400 dark:border-red-500'
        : 'border-slate-200 dark:border-slate-700'
    }`;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center pb-6">
        <div className="w-16 h-16 mx-auto mb-4">
          <img src="/logo.png" alt="MechaIA" className="w-16 h-16 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Diagnóstico</h2>
        <p className="text-slate-500 dark:text-slate-400">Completá los datos del vehículo para comenzar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Patente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="AB 123 CD"
              value={formData.patente}
              onChange={(e) => handleChange('patente', e.target.value.toUpperCase())}
              maxLength={9}
              className={`${fieldClass('patente')} text-lg font-semibold tracking-wide`}
            />
            {errors.patente && <p className="text-xs text-red-500">{errors.patente}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Año <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="2015"
              value={formData.año}
              onChange={(e) => handleChange('año', e.target.value)}
              min={1950}
              max={currentYear + 1}
              className={fieldClass('año')}
            />
            {errors.año && <p className="text-xs text-red-500">{errors.año}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="marcas-list"
              placeholder="Volkswagen"
              value={formData.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              className={fieldClass('marca')}
            />
            <datalist id="marcas-list">
              {MARCAS.map((m) => <option key={m} value={m} />)}
            </datalist>
            {errors.marca && <p className="text-xs text-red-500">{errors.marca}</p>}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Modelo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="modelos-list"
              placeholder="Gol Trend"
              value={formData.modelo}
              onChange={(e) => handleChange('modelo', e.target.value)}
              className={fieldClass('modelo')}
            />
            {modelos.length > 0 && (
              <datalist id="modelos-list">
                {modelos.map((m) => <option key={m} value={m} />)}
              </datalist>
            )}
            {errors.modelo && <p className="text-xs text-red-500">{errors.modelo}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motor</label>
            <input
              type="text"
              placeholder="1.6 MSI"
              value={formData.motor}
              onChange={(e) => handleChange('motor', e.target.value)}
              className={fieldClass('motor')}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ECU</label>
            <input
              type="text"
              placeholder="Siemens"
              value={formData.ecu}
              onChange={(e) => handleChange('ecu', e.target.value)}
              className={fieldClass('ecu')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Código OBD2 <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="P0420"
              value={formData.codigoObd}
              onChange={(e) => handleChange('codigoObd', e.target.value.toUpperCase())}
              className={fieldClass('codigoObd')}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Kilometraje <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="85000"
              value={formData.kilometraje}
              onChange={(e) => handleChange('kilometraje', e.target.value)}
              className={fieldClass('kilometraje')}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Descripción de la falla <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describí los síntomas: vibración en ralentí, pérdida de potencia, luz de check engine encendida..."
            value={formData.falla}
            onChange={(e) => handleChange('falla', e.target.value)}
            className={`w-full min-h-[120px] p-4 rounded-xl bg-white dark:bg-slate-800 border resize-none text-slate-900 dark:text-white ${
              errors.falla ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.falla && <p className="text-xs text-red-500">{errors.falla}</p>}
        </div>

        <button
          type="submit"
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg"
        >
          🔧 Iniciar Diagnóstico
        </button>
      </form>
    </div>
  );
}
