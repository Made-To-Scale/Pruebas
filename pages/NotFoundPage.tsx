
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-slate-400">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800 mt-4">Página no encontrada</h2>
      <p className="text-slate-600 mt-2">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Link
        to="/proyectos"
        className="mt-6 inline-block px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors duration-200 shadow-sm"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;
