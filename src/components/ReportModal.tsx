import { useState } from 'react';

interface ReportModalProps {
  onConfirm: (data: ReportData) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export interface ReportData {
  diagnosticoFinal: string;
  trabajosRealizados: string;
  observaciones: string;
}

export function ReportModal({ onConfirm, onClose, isGenerating }: ReportModalProps) {
  const [data, setData] = useState<ReportData>({
    diagnosticoFinal: '',
    trabajosRealizados: '',
    observaciones: '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">

        <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reporte final</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Completá los datos que van a aparecer en el informe para el cliente.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
              Diagnóstico final <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={data.diagnosticoFinal}
              onChange={e => setData({ ...data, diagnosticoFinal: e.target.value })}
              placeholder="Ej: Falla en sensor de temperatura del motor. El sensor enviaba lecturas incorrectas causando mezcla rica de combustible y pérdida de potencia."
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-0 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
              Trabajos realizados <span className="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={data.trabajosRealizados}
              onChange={e => setData({ ...data, trabajosRealizados: e.target.value })}
              placeholder="Ej: Reemplazo de sensor de temperatura NTC, limpieza de cuerpo de aceleración, escaneo y borrado de códigos de falla."
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-0 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
              Observaciones <span className="text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={data.observaciones}
              onChange={e => setData({ ...data, observaciones: e.target.value })}
              placeholder="Ej: Se recomienda revisión de correa de distribución en próximo service. Próximo turno en 5.000 km."
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-0 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(data)}
            disabled={isGenerating || !data.diagnosticoFinal.trim()}
            className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            {isGenerating ? '⏳ Generando PDF...' : 'Generar PDF'}
          </button>
        </div>

      </div>
    </div>
  );
}
