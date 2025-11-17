import React from 'react';

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: { field: string; message: string }[];
  fieldLabels: Record<string, string>;
}

const MissingFieldsModal: React.FC<MissingFieldsModalProps> = ({ isOpen, onClose, missingFields, fieldLabels }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-start pt-20 p-4 transition-opacity duration-300" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-slate-800">Faltan campos por completar</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Por favor, revisa los siguientes campos antes de continuar. Al cerrar esta ventana, te llevaremos al primer campo que necesita tu atención.
          </p>
          <ul className="mt-4 space-y-2 bg-slate-50 p-4 rounded-md border border-slate-200 max-h-60 overflow-y-auto">
            {missingFields.map(({ field, message }) => (
              <li key={field} className="text-sm">
                <span className="font-semibold text-slate-700">{fieldLabels[field] || field}:</span>
                <span className="text-slate-600 ml-2">{message}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissingFieldsModal;
