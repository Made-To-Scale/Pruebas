import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un proyecto.');
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      setIsLoading(false);
      return;
    }

    try {
      const newProject = { 
        name, 
        objective,
        user_id: user.id 
      };

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(newProject)
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        onClose();
        navigate(`/proyectos/${data.id}/brief`);
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al crear el proyecto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-slate-800">Nuevo Proyecto</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Ingresa los detalles básicos para comenzar tu nuevo proyecto.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700">Nombre del proyecto</label>
                <input
                  type="text"
                  id="projectName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                  placeholder="Ej: Campaña de Verano 2024"
                  required
                />
              </div>
              <div>
                <label htmlFor="projectObjective" className="block text-sm font-medium text-slate-700">Objetivo (Opcional)</label>
                <textarea
                  id="projectObjective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                  placeholder="Describe brevemente el objetivo principal de este proyecto."
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-b-lg flex justify-end items-center space-x-3">
             {error && <p className="text-sm text-red-600 flex-1">{error}</p>}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;