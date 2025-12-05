
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ExternalLinkIcon, SparklesIcon, ArrowPathIcon, ExclamationTriangleIcon, ShieldExclamationIcon, XCircleIcon } from '../components/Icons';

// --- Types ---

type BackendAvatar = {
  id: string;
  project_id: string;
  slot: number;
  etiqueta: string | null;
  profile: any | null;
};

type NormalizedAvatar = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  age: string | null;
  gender: string | null;
  income: string | null;
  slot: number;
  data: any;
};

// Progress tracking for avatars
type AvatarProgress = {
    avatarId: string;
    sectionsCount: number;
    isReady: boolean;
};

const normalizeAvatar = (avatar: BackendAvatar): NormalizedAvatar => {
  let profile: any = {};
  if (avatar.profile) {
    if (typeof avatar.profile === 'object') {
      profile = avatar.profile;
    } else if (typeof avatar.profile === 'string') {
      try {
        profile = JSON.parse(avatar.profile);
      } catch (e) {
        console.error(`Error parsing profile for avatar ${avatar.id}`, e);
      }
    }
  }
  const data = profile.data || {};

  // Helper function to check multiple potential keys for a value
  const getValue = (keys: string[]): string | null => {
      for (const key of keys) {
          if (data[key]) return data[key];
          // Check case-insensitive
          const lowerKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
          if (lowerKey && data[lowerKey]) return data[lowerKey];
      }
      return null;
  };

  const getAvatarDisplayName = (): string => {
      const candidates = [
          data?.nombre,
          profile?.nombre,
          data?.name,
          profile?.name
      ];

      for (const candidate of candidates) {
          if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
              const clean = candidate.trim();
              // Validate it's not just "Avatar X" or similar generic placeholders if found in JSON
              if (!/^avatar\s*\d+$/i.test(clean)) {
                  return clean;
              }
          }
      }

      // Fallback 1: Database label (etiqueta)
      if (avatar.etiqueta && avatar.etiqueta.trim().length > 0) {
          return avatar.etiqueta.trim();
      }

      // Fallback 2: Generic Slot Name
      return `Avatar ${avatar.slot}`;
  };

  return {
    id: avatar.id,
    project_id: avatar.project_id,
    name: getAvatarDisplayName(),
    description: profile.headline ?? 'Sin descripción.',
    age: getValue(['rango_edad', 'edad', 'age', 'years', 'rango_de_edad']),
    gender: getValue(['sexo', 'genero', 'gender', 'sex']),
    income: getValue(['nivel_ingresos', 'ingresos', 'income', 'nse', 'nivel_socioeconomico']),
    slot: avatar.slot,
    data: data,
  };
};

// --- Context Types (P1 - Market Research) ---

type EvidenceItem = {
  Ano: string;
  URL?: string;
  FuenteEntidad?: string;
  DatoPorcentaje?: string;
  IndicadorEstudio?: string;
};

type AilmentItem = {
  URL?: string;
  Fuente: string;
  DolorSintoma: string;
  EvidenciaMecanismo: string;
};

type MarketContextData = {
  ResumenEjecutivo: string;
  EvidenciasYDatos: EvidenceItem[];
  DolenciasQueAlivia: AilmentItem[];
  InsightsPublicitarios: string[];
};

// --- Context Types (P2 - Social Listening / Radar) ---

type SocialItem = {
  cita: string;
  url: string;
  
  // Normalized fields for display
  displayTag: string;   // Maps to dolor_validado, motivo_fallo, or objecion_validada
  displaySource: string; // Maps to fuente or producto_criticado
};

type SocialContextData = {
  dolores: SocialItem[];
  fallos: SocialItem[];
  objeciones: SocialItem[];
  total_items: number;
};

// --- Sub-components ---

const Spinner: React.FC<{className?: string}> = ({className}) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
     <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);

// --- Avatar Card Component ---

const AvatarCard: React.FC<{
  avatar: NormalizedAvatar;
  progress: AvatarProgress;
  projectId: string;
}> = ({ avatar, progress, projectId }) => {
    const { isReady, sectionsCount } = progress;
    // Total modules expected is roughly 10
    const TOTAL_MODULES = 10;
    const percentage = Math.min(100, Math.round((sectionsCount / TOTAL_MODULES) * 100));

    return (
        <Link 
            to={`/proyectos/${projectId}/avatares/${avatar.id}/analysis`}
            className="group relative flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200"
        >
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
                {isReady ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                        <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                        Ready
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm animate-pulse">
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Procesando
                    </span>
                )}
            </div>

            <div className="p-6 flex-grow">
                {/* Avatar Icon / Placeholder */}
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                     <SparklesIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>

                <h3 className="font-bold text-lg text-slate-800 pr-4 mb-2">{avatar.name}</h3>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{avatar.description}</p>
                
                {/* Demographics Tags - Only rendered if data exists */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {avatar.age && (
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{avatar.age}</span>
                    )}
                    {avatar.gender && (
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{avatar.gender}</span>
                    )}
                    {avatar.income && (
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 line-clamp-1">{avatar.income}</span>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-medium text-slate-500">
                        {isReady ? 'Análisis completado' : 'Generando módulos...'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                        {sectionsCount}/{TOTAL_MODULES}
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-700 ease-out ${isReady ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Hover Action Hint */}
            <div className="absolute inset-0 rounded-xl border-2 border-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
        </Link>
    );
};

// --- Context Components ---

const SocialItemCard: React.FC<{ item: SocialItem; type: 'dolor' | 'fallo' | 'objecion' }> = ({ item, type }) => {
    
    // Configuración visual unificada con branding: 
    // Borde izquierdo: MTS Green (#18ec5f)
    // Tag: Fondo Slate suave, Texto MTS Navy (#0b1526)
    const border = 'border-l-4 border-l-mts-green';
    const badge = 'bg-slate-100 text-mts-navy border-slate-200';
    
    return (
        <div className={`bg-white p-3 rounded-lg shadow-sm border border-slate-200 ${border} hover:shadow-md transition-shadow group`}>
            {/* Cita - Main Hero */}
            <div className="flex items-start gap-3 mb-2">
                <ChatBubbleIcon className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1 group-hover:text-slate-400 transition-colors" />
                <p className="text-slate-800 text-base font-bold leading-snug">
                    "{item.cita}"
                </p>
            </div>

            {/* Análisis y Metadata - Supporting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                
                {/* Tag moved to left but smaller/subtle */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badge}`}>
                    {item.displayTag}
                </span>
                
                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="truncate max-w-[200px] font-medium" title={item.displaySource}>
                        {item.displaySource}
                    </span>
                    {item.url && item.url !== '#' && (
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline whitespace-nowrap"
                            title="Ver contexto original"
                        >
                            Ver <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ContextAccordionItemProps {
  type: 'market' | 'social';
  marketData?: MarketContextData;
  socialData?: SocialContextData;
  isOpen: boolean;
  onToggle: () => void;
}

const ContextAccordionItem: React.FC<ContextAccordionItemProps> = ({ type, marketData, socialData, isOpen, onToggle }) => {
  const isMarket = type === 'market';
  const [activeTab, setActiveTab] = useState<'dolores' | 'fallos' | 'objeciones'>('dolores');

  // Config for header
  const config = isMarket ? {
    title: "Radar de evidencia y mercado",
    subtitle: "Síntesis de papers, datos y estudios sobre la categoría.",
    badge: "Research cuantitativo",
    badgeColor: "bg-indigo-100 text-indigo-800",
    icon: <DocumentTextIcon className="w-5 h-5 text-indigo-600" />,
  } : {
    title: "Radar de conversación y cultura digital",
    subtitle: "Lo que dice la gente real en foros y redes sociales.",
    badge: socialData ? `${socialData.total_items} menciones analizadas` : "Escucha social",
    badgeColor: "bg-fuchsia-100 text-fuchsia-800",
    icon: <ChatBubbleLeftRightIcon className="w-5 h-5 text-fuchsia-600" />,
  };

  return (
    <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white border-slate-300 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
      {/* Header */}
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 hidden md:block p-2 bg-slate-50 rounded-lg">
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.badgeColor}`}>
                {config.badge}
              </span>
            </div>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>

          <div className="flex-shrink-0 md:self-center mt-2 md:mt-0">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-slate-100' : 'bg-slate-50'}`}>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
             </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-100 animate-fade-in bg-slate-50/50">
            
            {/* --- SOCIAL LISTENING VIEW (P2) --- */}
            {!isMarket && socialData && (
                <div className="mt-4">
                     {/* Tabs Navigation */}
                     <div className="flex space-x-1 bg-slate-200/60 p-1 rounded-lg inline-flex mb-6">
                         {[
                             { id: 'dolores', label: 'Dolores', icon: ExclamationTriangleIcon },
                             { id: 'fallos', label: 'Fallos de Competencia', icon: XCircleIcon },
                             { id: 'objeciones', label: 'Objeciones', icon: ShieldExclamationIcon }
                         ].map(tab => {
                             const Icon = tab.icon;
                             return (
                                 <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white text-slate-800 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                 >
                                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    {tab.label}
                                    <span className="ml-1.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">
                                        {socialData[tab.id as 'dolores' | 'fallos' | 'objeciones']?.length || 0}
                                    </span>
                                 </button>
                             );
                         })}
                     </div>

                     {/* Content List */}
                     <div className="space-y-4">
                        {activeTab === 'dolores' && socialData.dolores.map((item, idx) => (
                            <SocialItemCard key={idx} item={item} type="dolor" />
                        ))}
                        {activeTab === 'fallos' && socialData.fallos.map((item, idx) => (
                            <SocialItemCard key={idx} item={item} type="fallo" />
                        ))}
                        {activeTab === 'objeciones' && socialData.objeciones.map((item, idx) => (
                            <SocialItemCard key={idx} item={item} type="objecion" />
                        ))}

                        {/* Empty State */}
                        {socialData[activeTab].length === 0 && (
                             <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-white/50">
                                 <p className="text-slate-400 font-medium">No se encontraron registros para esta categoría.</p>
                             </div>
                        )}
                     </div>
                </div>
            )}

            {/* --- MARKET RESEARCH VIEW (P1) --- */}
            {isMarket && marketData && (
                <div className="space-y-8 mt-4">
                    {/* Resumen */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Resumen ejecutivo</h4>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {marketData.ResumenEjecutivo}
                        </p>
                    </div>

                    {/* Tabla Datos */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Evidencias y datos clave</h4>
                        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Indicador / Estudio</th>
                                <th className="px-4 py-3 font-semibold">Dato destacado</th>
                                <th className="px-4 py-3 font-semibold">Fuente</th>
                                <th className="px-4 py-3 font-semibold">Año</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {marketData.EvidenciasYDatos?.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-800">{item.IndicadorEstudio}</td>
                                <td className="px-4 py-3 text-slate-700">{item.DatoPorcentaje}</td>
                                <td className="px-4 py-3 text-slate-600">
                                    {item.URL ? (
                                    <a href={item.URL} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                        {item.FuenteEntidad} <ExternalLinkIcon className="w-3 h-3" />
                                    </a>
                                    ) : (
                                    <span>{item.FuenteEntidad}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-500">{item.Ano}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Cards Dolencias */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Mecanismos y dolencias</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketData.DolenciasQueAlivia?.map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h5 className="font-bold text-slate-800 mb-2 text-lg">{item.DolorSintoma}</h5>
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{item.EvidenciaMecanismo}</p>
                            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                                <span className="text-slate-400 font-medium truncate max-w-[60%]">{item.Fuente}</span>
                                {item.URL && (
                                    <a href={item.URL} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                                    Ver estudio <ExternalLinkIcon className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Insights Tags */}
                    {marketData.InsightsPublicitarios && marketData.InsightsPublicitarios.length > 0 && (
                        <div>
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 px-1">Insights publicitarios</h4>
                             <div className="flex flex-wrap gap-2">
                                {marketData.InsightsPublicitarios.map((insight, idx) => (
                                    <span key={idx} className="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-100">
                                        {insight}
                                    </span>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

const ContextBlock: React.FC<{ marketData: MarketContextData | null; socialData: SocialContextData | null }> = ({ marketData, socialData }) => {
  const [openSection, setOpenSection] = useState<'market' | 'social' | null>(null);

  if (!marketData && !socialData) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Conoce el contexto antes de elegir avatares</h2>
        <p className="text-slate-500 mt-1">Accede al research de mercado y a la escucha social para tomar decisiones con cabeza.</p>
      </div>
      
      <div className="space-y-4">
        {marketData && (
          <ContextAccordionItem 
            type="market" 
            marketData={marketData} 
            isOpen={openSection === 'market'} 
            onToggle={() => setOpenSection(openSection === 'market' ? null : 'market')} 
          />
        )}
        
        {socialData && (
          <ContextAccordionItem 
            type="social" 
            socialData={socialData} 
            isOpen={openSection === 'social'} 
            onToggle={() => setOpenSection(openSection === 'social' ? null : 'social')} 
          />
        )}
      </div>
    </div>
  );
};


// --- Main Page ---

const ProjectAvatarsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const [avatars, setAvatars] = useState<NormalizedAvatar[]>([]);
    
    // Progress Map: AvatarId -> Count of outputs
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    
    // Context Data State
    const [marketContext, setMarketContext] = useState<MarketContextData | null>(null);
    const [socialContext, setSocialContext] = useState<SocialContextData | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const extractContextData = (content: any, kind: 'context_p1' | 'context_p2'): any => {
        if (!content) return null;
        let parsed = content;
        if (typeof content === 'string') {
            try { parsed = JSON.parse(content); } catch { return null; }
        }

        if (kind === 'context_p1') {
             const root = parsed.p1_contexto || parsed;
             return {
                ResumenEjecutivo: root.ResumenEjecutivo || '',
                EvidenciasYDatos: Array.isArray(root.EvidenciasYDatos) ? root.EvidenciasYDatos : [],
                DolenciasQueAlivia: Array.isArray(root.DolenciasQueAlivia) ? root.DolenciasQueAlivia : [],
                InsightsPublicitarios: Array.isArray(root.InsightsPublicitarios) ? root.InsightsPublicitarios : []
             } as MarketContextData;
        } else {
             // kind === 'context_p2'
             const root = parsed.p2_contexto || parsed;
             
             // Extract raw arrays based on provided keys
             const rawDolores = Array.isArray(root.cazador_dolor) ? root.cazador_dolor : [];
             const rawFallos = Array.isArray(root.cazador_fallos) ? root.cazador_fallos : [];
             const rawObjeciones = Array.isArray(root.cazador_objeciones) ? root.cazador_objeciones : [];
             
             const mapToSocialItem = (item: any, type: 'dolor' | 'fallo' | 'objecion'): SocialItem => {
                 let displayTag = 'Detectado';
                 let displaySource = 'Fuente desconocida';
                 let cita = item.cita || '';
                 
                 // Normalize based on type specific fields
                 if (type === 'dolor') {
                     displayTag = item.dolor_validado || 'Dolor validado';
                     displaySource = item.fuente || 'Fuente externa';
                 } else if (type === 'fallo') {
                     displayTag = item.motivo_fallo || 'Fallo detectado';
                     displaySource = item.producto_criticado || 'Producto competencia';
                 } else if (type === 'objecion') {
                     // Specific mapping for objeciones based on request:
                     // duda_textual -> cita
                     // freno_mental -> displayTag
                     cita = item.duda_textual || item.cita || '';
                     displayTag = item.freno_mental || item.objecion_validada || 'Objeción';
                     displaySource = item.fuente || 'Fuente externa';
                 }

                 return {
                     cita: cita,
                     url: item.url || '#',
                     displayTag,
                     displaySource
                 };
             };

             const dolores = rawDolores.map((i: any) => mapToSocialItem(i, 'dolor'));
             const fallos = rawFallos.map((i: any) => mapToSocialItem(i, 'fallo'));
             const objeciones = rawObjeciones.map((i: any) => mapToSocialItem(i, 'objecion'));
             
             return {
                 dolores,
                 fallos,
                 objeciones,
                 total_items: dolores.length + fallos.length + objeciones.length
             } as SocialContextData;
        }
    };

    // Initial Fetch
    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [avatarsRes, contextsRes, outputsRes] = await Promise.all([
                supabase.from('avatars').select('id, project_id, slot, etiqueta, profile').eq('project_id', projectId).order('slot'),
                supabase.from('contexts').select('kind, content').eq('project_id', projectId).in('kind', ['context_p1', 'context_p2']),
                // Initial output count check
                supabase.from('avatar_master_outputs').select('avatar_id, section').eq('project_id', projectId)
            ]);

            if (avatarsRes.error) throw avatarsRes.error;
            if (contextsRes.error) throw contextsRes.error;
            if (outputsRes.error) throw outputsRes.error;

            setAvatars((avatarsRes.data || []).map(normalizeAvatar));

            // Parse Contexts
            const p1Row = contextsRes.data?.find(c => c.kind === 'context_p1');
            const p2Row = contextsRes.data?.find(c => c.kind === 'context_p2');
            setMarketContext(extractContextData(p1Row?.content, 'context_p1'));
            setSocialContext(extractContextData(p2Row?.content, 'context_p2'));

            // Calculate Progress
            const newProgressMap: Record<string, Set<string>> = {};
            (outputsRes.data || []).forEach((row: any) => {
                if(!newProgressMap[row.avatar_id]) newProgressMap[row.avatar_id] = new Set();
                newProgressMap[row.avatar_id].add(row.section);
            });
            
            const finalCountMap: Record<string, number> = {};
            Object.keys(newProgressMap).forEach(key => {
                finalCountMap[key] = newProgressMap[key].size;
            });
            setProgressMap(finalCountMap);

        } catch (err: any) {
            setError('Error al cargar datos: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    
    // Polling for Progress updates
    useEffect(() => {
        if (!projectId) return;

        const refreshProgress = async () => {
            const { data, error } = await supabase
                .from('avatar_master_outputs')
                .select('avatar_id, section')
                .eq('project_id', projectId);
            
            if (!error && data) {
                const newProgressMap: Record<string, Set<string>> = {};
                data.forEach((row: any) => {
                    if(!newProgressMap[row.avatar_id]) newProgressMap[row.avatar_id] = new Set();
                    newProgressMap[row.avatar_id].add(row.section);
                });
                
                const finalCountMap: Record<string, number> = {};
                Object.keys(newProgressMap).forEach(key => {
                    finalCountMap[key] = newProgressMap[key].size;
                });
                setProgressMap(finalCountMap);
            }
        };

        const intervalId = setInterval(refreshProgress, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, [projectId]);


    if (isLoading) return <div className="flex justify-center items-center p-20"><Spinner className="w-10 h-10 text-slate-300" /></div>;
    if (error) return <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;

    return (
    <>
        <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Avatares Estratégicos</h2>
            <p className="text-slate-600 max-w-3xl mb-8">
                Aquí tienes a tus avatares generados. Entra en cada uno para ver su evolución en tiempo real.
            </p>

            <div className="space-y-8">
                {/* Context Block */}
                <ContextBlock marketData={marketContext} socialData={socialContext} />

                <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Perfiles Detectados</h3>
                    {avatars.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {avatars.map(avatar => {
                                const count = progressMap[avatar.id] || 0;
                                const isReady = count >= 10;
                                
                                return (
                                    <AvatarCard
                                        key={avatar.id}
                                        avatar={avatar}
                                        progress={{
                                            avatarId: avatar.id,
                                            sectionsCount: count,
                                            isReady
                                        }}
                                        projectId={projectId!}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 mt-4 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                            <SparklesIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-xl font-semibold text-slate-700">Sin avatares generados</h3>
                            <p className="mt-2 text-slate-500">Ve a la pestaña "Brief" para generar el contexto y los avatares.</p>
                            <Link to={`/proyectos/${projectId}/brief`} className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
                                Ir al Brief
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </>
    );
};

export default ProjectAvatarsPage;
