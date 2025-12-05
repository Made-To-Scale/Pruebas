
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChartBarIcon, 
  ShieldExclamationIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  LightbulbIcon,
  MegaphoneIcon
} from '../components/Icons';
import ProjectCompetitorAdsAnalysis from '../components/ProjectCompetitorAdsAnalysis';

// --- Types ---

interface CompetitorStrategy {
  id: string;
  project_id: string;
  analisis_final_ia?: any; // Puede ser JSONB o texto
  created_at: string;
}

interface Competitor {
  id: string;
  project_id: string;
  nombre: string;
  web_url?: string;
  clasificacion: string; 
  propuesta_valor?: string;
}

type TabType = 'strategy' | 'ads';

// --- Components ---

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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${colorClass}`}>
      {displayType}
    </span>
  );
};

const Spinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-slate-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// --- Main Page ---

const ProjectCompetitorsPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  
  // State for Strategy Tab
  const [strategyRow, setStrategyRow] = useState<CompetitorStrategy | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);

      try {
        const [strategyRes, competitorsRes] = await Promise.all([
          supabase
            .from('competitor_strategies')
            .select('id, project_id, analisis_final_ia, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          supabase
            .from('competitors_strategic')
            .select('id, project_id, nombre, web_url, clasificacion, propuesta_valor')
            .eq('project_id', projectId)
            .order('nombre')
        ]);

        if (strategyRes.error) throw strategyRes.error;
        if (competitorsRes.error) throw competitorsRes.error;

        setStrategyRow(strategyRes.data);
        setCompetitors(competitorsRes.data || []);

      } catch (err: any) {
        console.error("Error fetching competitors data:", err);
        setError(err.message || 'Error al cargar los datos de competencia.');
      } finally {
        setIsLoading(false);
      }
    };

    // We load strategy data on mount regardless of tab, for smoother UX
    fetchData();
  }, [projectId]);

  // Helper to render strategy sections
  const renderStrategyContent = () => {
    if (!strategyRow?.analisis_final_ia) return null;

    const rawData = strategyRow.analisis_final_ia;
    let parsedData: any = rawData;

    if (typeof rawData === 'string') {
      try {
        if (rawData.trim().startsWith('{') || rawData.trim().startsWith('[')) {
            parsedData = JSON.parse(rawData);
        }
      } catch (e) {
        parsedData = rawData;
      }
    }

    if (typeof parsedData === 'object' && parsedData !== null) {
        const data = parsedData.output || parsedData;
        const sections = [
           { key: 'resumen_ejecutivo', title: 'Resumen Ejecutivo' },
           { key: 'resumen_ejecutivo_ceo', title: 'Resumen Ejecutivo' },
           { key: 'angulo_ataque', title: 'Ángulo de Ataque' },
           { key: 'angulo_ataque_unico', title: 'Ángulo de Ataque Único' },
           { key: 'brecha_mercado', title: 'Brecha de Mercado' },
           { key: 'brecha_metodologica', title: 'Brecha Metodológica' },
           { key: 'patron_dominante', title: 'Patrón Dominante' },
           { key: 'patron_mercado_dominante', title: 'Patrón de Mercado Dominante' },
        ];

        const availableSections = sections.filter(s => data[s.key]);

        if (availableSections.length > 0) {
            return (
                <div className="space-y-6">
                    {availableSections.map(({ key, title }) => (
                        <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <LightbulbIcon className="w-4 h-4 text-amber-500" />
                                {title}
                            </h4>
                            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                                {typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return (
             <div className="bg-slate-50 p-4 rounded text-xs font-mono text-slate-600 overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
             </div>
        );
    }

    if (typeof parsedData === 'string') {
         return (
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed prose prose-slate max-w-none">
                {parsedData}
            </div>
         );
    }
    return <p className="text-slate-400 italic">Formato de análisis no reconocido.</p>;
  };

  const renderStrategyTab = () => {
    if (isLoading) return <div className="py-20 text-center"><Spinner /><p className="text-slate-500 mt-4 text-sm">Cargando inteligencia de mercado...</p></div>;
    
    return (
        <>
            {/* Strategy Summary */}
            {strategyRow?.analisis_final_ia ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-10 relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Resumen Estratégico del Mercado</h3>
                            <p className="text-sm text-slate-500">Visión general generada por IA</p>
                        </div>
                    </div>
                    {renderStrategyContent()}
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-100 text-blue-800 p-6 rounded-xl mb-10 flex items-start gap-4">
                    <div className="p-2 bg-white rounded-full shadow-sm flex-shrink-0">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Análisis general pendiente</h3>
                        <p className="text-sm mt-1 opacity-80">
                            Aún no se ha generado el resumen estratégico global.
                        </p>
                    </div>
                </div>
            )}

            {/* Competitors List */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                        Competidores Detectados
                        <span className="ml-3 bg-slate-100 text-slate-600 text-sm font-semibold px-3 py-1 rounded-full border border-slate-200">
                            {competitors.length}
                        </span>
                    </h3>
                </div>

                {competitors.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 text-center bg-slate-50">
                        <ChartBarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-slate-700">No se encontraron competidores</h4>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            Parece que aún no hemos analizado competidores específicos para este proyecto.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {competitors.map(comp => {
                            let hostname = comp.web_url;
                            try {
                                if (hostname && !hostname.startsWith('http')) hostname = 'https://' + hostname;
                                if (hostname) hostname = new URL(hostname).hostname;
                            } catch(e) { hostname = comp.web_url; }

                            return (
                                <div 
                                    key={comp.id}
                                    className="bg-white flex flex-col p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 group h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="pr-2 overflow-hidden">
                                            <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate" title={comp.nombre}>{comp.nombre}</h4>
                                            {comp.web_url && (
                                                <a 
                                                    href={comp.web_url.startsWith('http') ? comp.web_url : `https://${comp.web_url}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 truncate max-w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <GlobeAltIcon className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{hostname}</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                            <ClassificationBadge type={comp.clasificacion} />
                                        </div>
                                    </div>

                                    <div className="flex-grow mb-6">
                                        <p className="text-sm text-slate-600 line-clamp-3">
                                            {comp.propuesta_valor || "Sin propuesta de valor definida en el resumen."}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-50">
                                        <Link 
                                            to={`/proyectos/${projectId}/competencia/${comp.id}`}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                                        >
                                            Ver análisis completo
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
  };


  return (
    <div className="min-h-screen pb-10">
      {/* Header & Navigation */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Inteligencia de Competencia</h2>
        <p className="text-slate-600 mt-2 max-w-3xl">
          Analiza la estrategia de mercado y desglosa los anuncios ganadores de tus rivales.
        </p>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg inline-flex mt-6 border border-slate-200">
            <button
                onClick={() => setActiveTab('strategy')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'strategy' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <ChartBarIcon className="w-4 h-4" />
                Estrategia de Mercado
            </button>
            <button
                onClick={() => setActiveTab('ads')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'ads' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
                <MegaphoneIcon className="w-4 h-4" />
                Análisis de Anuncios
            </button>
        </div>
      </div>

      {error && activeTab === 'strategy' && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3 animate-fade-in">
            <ShieldExclamationIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-bold">Error de conexión</p>
                <p className="text-sm">{error}</p>
            </div>
         </div>
      )}

      {/* Content Area */}
      <div>
        {activeTab === 'strategy' ? renderStrategyTab() : <ProjectCompetitorAdsAnalysis />}
      </div>

    </div>
  );
};

export default ProjectCompetitorsPage;
