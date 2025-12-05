
import React, { useState, useEffect } from 'react';
import { Outlet, useParams, NavLink, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DocumentTextIcon, HomeIcon, SparklesIcon, ChartBarIcon, PencilSquareIcon, MegaphoneIcon, Squares2X2Icon } from '../components/Icons';

const ProjectDetailLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectName = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('name')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProjectName(data.name);
        } else {
          setProjectName('Proyecto no encontrado');
        }
      } catch (err) {
        console.error("Error fetching project name:", err);
        setProjectName('Error al cargar');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectName();
  }, [id]);

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 border ${
      isActive
        ? 'bg-white text-mts-navy border-slate-200 shadow-sm ring-1 ring-mts-green/20'
        : 'text-slate-600 hover:bg-white hover:text-slate-900 border-transparent'
    }`;


  return (
    <div>
      <div className="mb-6">
        <Link to="/proyectos" className="text-sm text-slate-500 hover:underline mb-2 block">&larr; Volver a Proyectos</Link>
        <h1 className="text-3xl font-bold text-slate-800">
          Proyecto: {isLoading ? 'Cargando...' : projectName || id}
        </h1>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
          <NavLink to={`/proyectos/${id}/detalle`} className={navLinkClasses} end>
            <HomeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Detalle
          </NavLink>
          <NavLink to={`/proyectos/${id}/brief`} className={navLinkClasses}>
            <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Brief
          </NavLink>
          <NavLink to={`/proyectos/${id}/avatares`} className={navLinkClasses}>
            <SparklesIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Avatares
          </NavLink>
          <NavLink to={`/proyectos/${id}/competencia`} className={navLinkClasses}>
            <ChartBarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Competencia
          </NavLink>
          <NavLink to={`/proyectos/${id}/narrativa`} className={navLinkClasses}>
            <PencilSquareIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Narrativa
          </NavLink>
          <NavLink to={`/proyectos/${id}/anuncios`} className={navLinkClasses}>
            <MegaphoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            Anuncios
          </NavLink>
          <NavLink to={`/proyectos/${id}/dashboard`} className={navLinkClasses}>
            <Squares2X2Icon className="w-4 h-4 mr-2 flex-shrink-0" />
            Dashboard
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
