
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  LightbulbIcon, 
  MegaphoneIcon, 
  CheckCircleIcon, 
  ArrowTrendingUpIcon, 
  GlobeAltIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  SparklesIcon
} from '../components/Icons';

interface CompetitorDetail {
  id: string;
  project_id: string;
  nombre: string;
  web_url?: string;
  clasificacion: string; 
  producto_principal?: string;
  propuesta_valor?: string;
  precio_estimado?: string;
  causa_justa_mision?: string;
  curriculum_enfoque?: string;
  acreditaciones_clave?: string;
  voz_marca?: string;
  justificacion_relevancia?: string;
  // Campos adicionales potenciales que podrían venir del SQL
  [key: string]: any;
}

// --- Helper Components ---

const DetailCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center gap-2">
      {icon && <span className="text-slate-500">{icon}</span>}
      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5 flex-grow">
      {children}
    </div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-slate-100 text-slate-700" }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {children}
    </span>
);

const ClassificationBadge: React.FC<{ type: string }> = ({ type }) => {
  let displayType = type || 'Competidor';

  // Normalización específica solicitada
  if (displayType === 'Elite B2C' || displayType === 'Directo - IA') {
    displayType = 'Directo - IA';
  }

  const normalizedType = displayType.toLowerCase();
  let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
  
  // Al normalizar a "Directo - IA", automáticamente caerá en la condición "direct" (rojo)
  if (normalizedType.includes('direct')) colorClass = 'bg-red-100 text-red-800 border-red-200';
  else if (normalizedType.includes('indirect')) colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
  else if (normalizedType.includes('referente') || normalizedType.includes('aspiracional')) colorClass = 'bg-purple-100 text-purple-800 border-purple-200';

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize border ${colorClass}`}>
      {displayType}
    </span>
  );
};

// --- Main Component ---

const CompetitorDetailPage: React.FC = () => {
  // Aseguramos que los nombres de parámetros coincidan con el router (:id y :competitorId)
  const { id: projectId, competitorId } = useParams<{ id: string; competitorId: string }>();
  const navigate = useNavigate();
  
  const [competitor, setCompetitor] = useState<CompetitorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitorDetail = async () => {
      if (!projectId || !competitorId) {
        setError("Faltan identificadores en la URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching competitor: ${competitorId} for project: ${projectId}`);
        
        const { data, error } = await supabase
          .from('competitors_strategic')
          .select('*')
          .eq('id', competitorId)
          .eq('project_id', projectId) // Seguridad adicional
          .single();

        if (error) throw error;
        if (!data) throw new Error("Competidor no encontrado.");

        setCompetitor(data);

      } catch (err: any) {
        console.error("Error fetching competitor detail:", err);
        setError(err.message || 'No se pudo cargar el detalle del competidor.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitorDetail();
  }, [projectId, competitorId]);

  if (isLoading) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-slate-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500">Cargando análisis profundo...</p>
        </div>
    );
  }

  if (error) {
      return (
        <div className="p-8 text-center max-w-2xl mx-auto mt-10 bg-red-50 rounded-xl border border-red-100">
            <ShieldExclamationIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar competidor</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button 
                onClick={() => navigate(-1)} 
                className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
                Volver atrás
            </button>
        </div>
      );
  }

  if (!competitor) return null; // Should be handled by error state but just in case

  let hostname = competitor.web_url;
  try {
      if (hostname && !hostname.startsWith('http')) hostname = 'https://' + hostname;
      if (hostname) hostname = new URL(hostname).hostname;
  } catch(e) {
      hostname = competitor.web_url; 
  }

  const formatText = (text: string | undefined) => {
      if (!text) return <span className="text-slate-400 italic">No disponible</span>;
      return <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{text}</p>;
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Navigation */}
      <button 
        onClick={() => navigate(`/proyectos/${projectId}/competencia`)} 
        className="mb-6 text-sm text-slate-500 hover:text-slate-900 flex items-center transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al listado
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8 relative overflow-hidden">
        {/* Background decorative accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{competitor.nombre}</h1>
              <ClassificationBadge type={competitor.clasificacion} />
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                {competitor.web_url && (
                    <a 
                        href={competitor.web_url.startsWith('http') ? competitor.web_url : `https://${competitor.web_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 font-medium transition-colors"
                    >
                        <GlobeAltIcon className="w-4 h-4" />
                        {hostname}
                    </a>
                )}
            </div>
          </div>

          {/* Price Tag */}
          <div className="bg-emerald-50 px-5 py-4 rounded-xl border border-emerald-100 text-right min-w-[140px]">
             <span className="block text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Precio Estimado</span>
             <span className="text-xl font-bold text-emerald-900">{competitor.precio_estimado || 'N/A'}</span>
          </div>
        </div>
        
        {/* Relevancia Contextual */}
        {competitor.justificacion_relevancia && (
           <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg mt-0.5">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase mb-1">Por qué es relevante para tu proyecto</h4>
                    <p className="text-slate-600 italic text-lg">
                        “{competitor.justificacion_relevancia}”
                    </p>
                  </div>
              </div>
           </div>
        )}
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Core Value */}
        <DetailCard 
            title="Propuesta de Valor Única" 
            icon={<MegaphoneIcon className="w-5 h-5 text-indigo-500" />}
            className="border-t-4 border-t-indigo-500"
        >
            {formatText(competitor.propuesta_valor)}
        </DetailCard>

        {/* Product Details */}
        <DetailCard 
            title="Producto / Servicio Principal" 
            icon={<LightbulbIcon className="w-5 h-5 text-amber-500" />}
            className="border-t-4 border-t-amber-500"
        >
            {formatText(competitor.producto_principal)}
        </DetailCard>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Brand Soul */}
        <DetailCard title="Misión y Causa Justa" icon={<SparklesIcon className="w-5 h-5 text-pink-500" />}>
            {formatText(competitor.causa_justa_mision)}
        </DetailCard>

        {/* Methodology */}
        <DetailCard title="Método y Enfoque" icon={<ChartBarIcon className="w-5 h-5 text-blue-500" />}>
            {formatText(competitor.curriculum_enfoque)}
        </DetailCard>

        {/* Authority */}
        <DetailCard title="Acreditaciones y Autoridad" icon={<CheckCircleIcon className="w-5 h-5 text-teal-500" />}>
             {formatText(competitor.acreditaciones_clave)}
        </DetailCard>
        
        {/* Tone of Voice */}
        <DetailCard title="Voz de Marca" icon={<DocumentTextIcon className="w-5 h-5 text-slate-500" />}>
            {formatText(competitor.voz_marca)}
        </DetailCard>

      </div>
    </div>
  );
};

export default CompetitorDetailPage;
