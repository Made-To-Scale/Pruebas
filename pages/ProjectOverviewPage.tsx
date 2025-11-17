
import React from 'react';

const ProjectOverviewPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800">Detalle del Proyecto</h2>
      <p className="mt-2 text-slate-600">
        Esta es la página de detalle del proyecto. Aquí se mostrará un resumen general, el estado y las métricas clave.
      </p>
      {/* Placeholder content */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700">Estado</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">Activo</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700">Avatares Generados</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">12</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700">Documentos</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">5</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewPage;
