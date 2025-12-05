
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';

// This type should ideally be in a shared types file
interface Project {
  id: string;
  created_at: string;
  name: string;
  objective: string | null;
  status: string;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // NOTE: In a real app with authentication, you'd get the user first.
        // const { data: { user } } = await supabase.auth.getUser();
        // if (!user) throw new Error("Authentication required.");
        // .eq('user_id', user.id)

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        setProjects(data || []);
      } catch (err: any) {
         // A more user-friendly message for the common case of failed connection
        if (err.message.includes('Failed to fetch')) {
             setError('No se pudo conectar con la base de datos. Verifica la configuración de Supabase.');
        } else {
            setError(err.message || 'Ocurrió un error al cargar los proyectos.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-center">
          <p className="font-semibold">Error al cargar proyectos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-slate-700">Sin proyectos aún</h3>
          <p className="mt-2 text-slate-500">
            ¡Comienza creando tu primer proyecto para verlo aquí!
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 px-4 py-2 bg-mts-green text-mts-navy text-sm font-bold rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-sm"
          >
            Crear Nuevo Proyecto
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Proyectos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-mts-green text-mts-navy text-sm font-bold rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-sm"
        >
          Nuevo Proyecto
        </button>
      </div>
      
      {renderContent()}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ProjectsPage;
