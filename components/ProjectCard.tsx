import React from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  created_at: string;
  name: string;
  objective: string | null;
  status: string;
}

interface ProjectCardProps {
  project: Project;
}

const statusStyles: { [key: string]: string } = {
  activo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  finalizado: 'bg-red-100 text-red-800',
  default: 'bg-slate-100 text-slate-800',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const badgeClass = statusStyles[project.status?.toLowerCase()] || statusStyles.default;
  
  const formattedDate = new Date(project.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link 
      to={`/proyectos/${project.id}/brief`} 
      className="block bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900 pr-2">
          {project.name}
        </h3>
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${badgeClass}`}>
          {project.status || 'Indefinido'}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600 line-clamp-2 min-h-[40px]">
        {project.objective || 'Sin objetivo definido.'}
      </p>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Creado el: {formattedDate}
        </p>
      </div>
    </Link>
  );
};

export default ProjectCard;
