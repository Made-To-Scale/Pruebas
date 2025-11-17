
import React from 'react';
import { Outlet, useParams, NavLink, Link } from 'react-router-dom';
import { DocumentTextIcon, HomeIcon, SparklesIcon, BeakerIcon } from '../components/Icons';

const ProjectDetailLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 border ${
      isActive
        ? 'bg-white text-slate-900 border-slate-200 shadow-sm'
        : 'text-slate-600 hover:bg-white hover:text-slate-900 border-transparent'
    }`;


  return (
    <div>
      <div className="mb-6">
        <Link to="/proyectos" className="text-sm text-slate-500 hover:underline mb-2 block">&larr; Volver a Proyectos</Link>
        <h1 className="text-3xl font-bold text-slate-800">Proyecto: {id}</h1>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
          <NavLink to={`/proyectos/${id}/detalle`} className={navLinkClasses} end>
            <HomeIcon className="w-4 h-4 mr-2" />
            Detalle
          </NavLink>
          <NavLink to={`/proyectos/${id}/brief`} className={navLinkClasses}>
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Brief
          </NavLink>
          <NavLink to={`/proyectos/${id}/avatares`} className={navLinkClasses}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            Avatares
          </NavLink>
          <NavLink to={`/proyectos/${id}/resultados`} className={navLinkClasses}>
            <BeakerIcon className="w-4 h-4 mr-2" />
            Resultados
          </NavLink>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-[400px]">
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectDetailLayout;
