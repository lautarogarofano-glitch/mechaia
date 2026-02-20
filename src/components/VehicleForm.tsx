import { useState } from 'react';
import type { VehicleData } from '../types/vehicle';

interface VehicleFormProps {
  onSubmit: (data: VehicleData) => void;
}

export function VehicleForm({ onSubmit }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleData>({
    patente: '', marca: '', modelo: '', año: '', motor: '', ecu: '', falla: '', codigoObd: '', kilometraje: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof VehicleData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.patente && formData.marca && formData.modelo && formData.año && formData.falla;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white text-3xl">🔧</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Diagnóstico</h2>
        <p className="text-slate-500 dark:text-slate-400">Completá los datos del vehículo para comenzar</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Patente</label>
            <input type="text" placeholder="AB 123 CD" value={formData.patente} onChange={(e) => handleChange('patente', e.target.value.toUpperCase())} className="w-full h-12 px-4 text-lg font-semibold tracking-wide bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Año</label>
            <input type="text" placeholder="2015" value={formData.año} onChange={(e) => handleChange('año', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Marca</label>
            <input type="text" placeholder="Volkswagen" value={formData.marca} onChange={(e) => handleChange('marca', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Modelo</label>
            <input type="text" placeholder="Gol Trend" value={formData.modelo} onChange={(e) => handleChange('modelo', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Motor</label>
            <input type="text" placeholder="1.6 MSI" value={formData.motor} onChange={(e) => handleChange('motor', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ECU</label>
            <input type="text" placeholder="Siemens" value={formData.ecu} onChange={(e) => handleChange('ecu', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Código OBD2 (opcional)</label>
            <input type="text" placeholder="P0420" value={formData.codigoObd} onChange={(e) => handleChange('codigoObd', e.target.value.toUpperCase())} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kilometraje (opcional)</label>
            <input type="text" placeholder="85000" value={formData.kilometraje} onChange={(e) => handleChange('kilometraje', e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción de la falla</label>
          <textarea placeholder="Describí los síntomas: vibración en ralentí, pérdida de potencia, luz de check engine encendida..." value={formData.falla} onChange={(e) => handleChange('falla', e.target.value)} className="w-full min-h-[120px] p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none" />
        </div>
        <button type="submit" disabled={!isValid} className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">🔧 Iniciar Diagnóstico</button>
      </form>
    </div>
  );
}
