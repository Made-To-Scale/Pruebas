import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircleIcon } from '../components/Icons';

// --- Types ---

// The raw structure from Supabase
type BackendAvatar = {
  id: string;
  project_id: string;
  slot: number;
  etiqueta: string | null;
  profile: any | null; // Can be object or JSON string
  is_selected: boolean;
  created_at: string;
};

// The normalized structure for the UI
type NormalizedAvatar = {
  id: string;
  project_id: string;
  slot: number;
  title: string;
  headline: string;
  data: {
    rango_edad?: string;
    sexo?: string;
    nivel_ingresos?: string;
    nivel_estudios?: string;
    situacion_laboral?: string;
    miembros_unidad_familiar?: number;
    estado_civil?: string;
    idiomas?: string[];
    intereses_directos?: string[];
    intereses_relacionados?: string[];
    hobbies?: string[];
    tipos_sitios_web?: string[];
  };
  is_selected: boolean;
  created_at: string;
};

// Helper to normalize the incoming avatar data into a consistent shape for the UI
const normalizeAvatar = (avatar: BackendAvatar): NormalizedAvatar => {
  let profile: any = {};
  if (avatar.profile && typeof avatar.profile === 'object') {
    profile = avatar.profile;
  } else if (typeof avatar.profile === 'string') {
    try {
      profile = JSON.parse(avatar.profile);
    } catch (e) {
      console.error(`Error parsing profile for avatar ${avatar.id}`, e);
    }
  }

  const newData = profile.data || {};

  // This handles both old (profile.demografia) and new (profile.data.rango_edad) structures.
  const data = {
    rango_edad: newData.rango_edad ?? profile.demografia?.rango_edad,
    sexo: newData.sexo ?? profile.demografia?.sexo,
    nivel_ingresos: newData.nivel_ingresos ?? profile.demografia?.nivel_ingresos,
    nivel_estudios: newData.nivel_estudios ?? profile.demografia?.nivel_estudios,
    situacion_laboral: newData.situacion_laboral ?? profile.demografia?.situacion_laboral,
    miembros_unidad_familiar: newData.miembros_unidad_familiar ?? profile.demografia?.miembros_unidad_familiar,
    estado_civil: newData.estado_civil ?? profile.demografia?.estado_civil,
    idiomas: newData.idiomas ?? profile.demografia?.idiomas,
    intereses_directos: newData.intereses_directos ?? profile.intereses?.directos,
    intereses_relacionados: newData.intereses_relacionados ?? profile.intereses?.relacionados,
    hobbies: newData.hobbies ?? profile.intereses?.hobbies,
    tipos_sitios_web: newData.tipos_sitios_web ?? profile.digital?.tipos_sitios_web,
  };
  
  return {
    id: avatar.id,
    project_id: avatar.project_id,
    slot: avatar.slot,
    title: avatar.etiqueta ?? profile.name ?? `Avatar ${avatar.slot}`,
    headline: profile.headline ?? '',
    data,
    is_selected: !!avatar.is_selected,
    created_at: avatar.created_at,
  };
};

type Contexto1 = {
  ResumenEjecutivo: string;
  EvidenciasYDatos: {
    IndicadorEstudio: string;
    DatoPorcentaje?: string;
    Ano?: string;
    FuenteEntidad?: string;
    URL?: string;
  }[];
  DolenciasQueAlivia: {
    DolorSintoma: string;
    EvidenciaMecanismo: string;
    Fuente?: string;
    URL?: string;
  }[];
  InsightsPublicitarios: string[];
};

type Contexto2 = {
  query?: string;
  total_encontrados?: number;
  comentarios: {
    comentario: string;
    sentimiento?: 'positivo' | 'neutral' | 'negativo' | 'mixto';
    url?: string;
  }[];
};

type ToastMessage = {
  message: string;
  type: 'success' | 'error';
};

// --- Helper Icons ---

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


// --- Sub-components ---

const SentimentBadge: React.FC<{ sentiment: string | undefined }> = ({ sentiment }) => {
    const styles = {
        positivo: 'bg-green-100 text-green-800',
        negativo: 'bg-red-100 text-red-800',
        neutral: 'bg-slate-100 text-slate-800',
        mixto: 'bg-yellow-100 text-yellow-800',
    };
    const sentimentKey = sentiment as keyof typeof styles;
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[sentimentKey] || styles.neutral}`}>{sentiment || 'neutral'}</span>;
};

const AvatarDetailModal: React.FC<{ avatar: NormalizedAvatar | null; onClose: () => void }> = ({ avatar, onClose }) => {
    if (!avatar) return null;

    const renderList = (items: any[] | undefined) => {
        if (!items || items.length === 0) return <p className="text-sm text-slate-500">No disponible.</p>;
        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                    <span key={index} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-sm rounded-md">{item}</span>
                ))}
            </div>
        );
    };

    const renderDetail = (label: string, value: any) => {
        if (value === undefined || value === null || value === '') return null;
        return <p className="text-sm"><span className="font-semibold text-slate-600">{label}:</span> <span className="text-slate-800">{value}</span></p>;
    }

    return (
        <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose}>
            <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col transition-transform duration-300 transform translate-x-0" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">{avatar.title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-700 mb-2">Demografía</h4>
                        <div className="space-y-1">
                            {renderDetail('Rango de edad', avatar.data.rango_edad)}
                            {renderDetail('Sexo', avatar.data.sexo)}
                            {renderDetail('Nivel de ingresos', avatar.data.nivel_ingresos)}
                            {renderDetail('Nivel de estudios', avatar.data.nivel_estudios)}
                            {renderDetail('Situación laboral', avatar.data.situacion_laboral)}
                            {renderDetail('Miembros unidad familiar', avatar.data.miembros_unidad_familiar)}
                        </div>
                         <div className="mt-3">
                            <h5 className="font-semibold text-sm text-slate-600 mb-1">Idiomas</h5>
                            {renderList(avatar.data.idiomas)}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-slate-700 mb-2">Intereses</h4>
                        <h5 className="font-semibold text-sm text-slate-600 mt-3 mb-1">Directos</h5>
                        {renderList(avatar.data.intereses_directos)}
                        <h5 className="font-semibold text-sm text-slate-600 mt-3 mb-1">Relacionados</h5>
                        {renderList(avatar.data.intereses_relacionados)}
                        <h5 className="font-semibold text-sm text-slate-600 mt-3 mb-1">Hobbies</h5>
                        {renderList(avatar.data.hobbies)}
                    </div>
                     <div>
                        <h4 className="font-bold text-slate-700 mb-2">Digital</h4>
                        <h5 className="font-semibold text-sm text-slate-600 mt-3 mb-1">Tipos de sitios web</h5>
                        {renderList(avatar.data.tipos_sitios_web)}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---

const ProjectAvatarsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [avatars, setAvatars] = useState<NormalizedAvatar[]>([]);
    const [contexto1, setContexto1] = useState<Contexto1 | null>(null);
    const [contexto2, setContexto2] = useState<Contexto2 | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'c1' | 'c2'>('c1');
    const [modalAvatar, setModalAvatar] = useState<NormalizedAvatar | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    
    const storageKey = useMemo(() => `mts:selectedSlots:${projectId}`, [projectId]);

    const [selectedSlots, setSelectedSlots] = useState<number[]>(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.warn(`Error reading localStorage key “${storageKey}”:`, error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(selectedSlots));
        } catch (error) {
            console.warn(`Error setting localStorage key “${storageKey}”:`, error);
        }
    }, [selectedSlots, storageKey]);
    

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const avatarsPromise = supabase
                .from('avatars')
                .select('id, project_id, slot, etiqueta, profile, is_selected, created_at')
                .eq('project_id', projectId)
                .order('slot');
            
            const contextsPromise = supabase
                .from('contexts')
                .select('kind, content')
                .eq('project_id', projectId)
                .in('kind', ['context_p1', 'context_p2']);

            const [{ data: avatarsData, error: avatarsError }, { data: contextsData, error: contextsError }] = await Promise.all([avatarsPromise, contextsPromise]);

            if (avatarsError) throw avatarsError;
            if (contextsError) throw contextsError;
            
            const mappedAvatars: NormalizedAvatar[] = (avatarsData || []).map(normalizeAvatar);
            setAvatars(mappedAvatars);
            
            const c1 = contextsData?.find(c => c.kind === 'context_p1');
            const c2 = contextsData?.find(c => c.kind === 'context_p2');
            setContexto1(c1?.content as Contexto1 || null);
            setContexto2(c2?.content as Contexto2 || null);

        } catch (err: any) {
            setError('Error al cargar datos. ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleSelection = (slot: number) => {
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
    };

    const handleClearSelection = () => {
        setSelectedSlots([]);
    };

    const handleAnalyze = async () => {
        if (!projectId || selectedSlots.length === 0) return;
        setIsAnalyzing(true);
        setToast(null);

        try {
            const { data: briefData, error: briefError } = await supabase
                .from('briefs')
                .select('id')
                .eq('project_id', projectId)
                .single();

            if (briefError || !briefData) {
                throw new Error('No se pudo encontrar el brief asociado a este proyecto.');
            }

            const selectedAvatarsForPayload = avatars
                .filter(a => selectedSlots.includes(a.slot))
                .map(a => ({
                    avatar_id: a.id,
                    slot: a.slot,
                    name: a.title,
                    headline: a.headline,
                    data: a.data,
                }));
            
            const payload = {
                project_id: projectId,
                brief_id: briefData.id,
                avatars: selectedAvatarsForPayload,
                run_sequential: true,
                source: 'ui',
            };

            const response = await fetch('https://sswebhook.made-to-scale.com/webhook/detalle-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Error del servidor (${response.status}): ${errorBody}`);
            }

            const responseData = await response.json();
            const acceptedCount = responseData.accepted?.length || 0;
            setToast({ message: `Análisis encolado para ${acceptedCount} avatares. Puedes seguir el progreso en Resultados.`, type: 'success' });
            
            handleClearSelection();
            
            navigate(`/proyectos/${projectId}/resultados`);

        } catch (err: any) {
            setToast({ message: err.message || 'Ocurrió un error al iniciar el análisis.', type: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isLoading) return (
        <div>
            <div className="animate-pulse">
                <div className="h-8 w-1/3 bg-slate-200 rounded-md"></div>
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-4">
                       <div className="h-10 w-full bg-slate-200 rounded-md"></div>
                       <div className="h-64 w-full bg-slate-200 rounded-md"></div>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({length: 4}).map((_, i) => <div key={i} className="h-60 bg-slate-200 rounded-lg"></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;

    return (
    <>
      <div className="pb-24"> {/* Padding bottom to avoid overlap with sticky bar */}
        <h2 className="text-3xl font-bold text-slate-800">Elige tus Avatares para Análisis</h2>
        <p className="mt-1 text-slate-600">Revisa el contexto y selecciona uno o más avatares para analizar.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Contexts */}
            <aside className="lg:col-span-1">
                <div className="sticky top-8">
                    <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
                        <button onClick={() => setActiveTab('c1')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'c1' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/50'}`}>Contexto 1</button>
                        <button onClick={() => setActiveTab('c2')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'c2' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/50'}`}>Contexto 2</button>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 border rounded-lg h-[600px] overflow-y-auto">
                        {activeTab === 'c1' && (contexto1 ? (
                            <div className="space-y-6 text-sm">
                                <div><h4 className="font-bold text-slate-700 mb-1">Resumen Ejecutivo</h4><p className="text-slate-600 whitespace-pre-wrap">{contexto1.ResumenEjecutivo}</p></div>
                                <div><h4 className="font-bold text-slate-700 mb-2">Evidencias y Datos</h4>
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-200"><tr className="text-slate-600">
                                            <th className="p-2">Indicador</th><th className="p-2">Dato</th><th className="p-2">Fuente</th>
                                        </tr></thead>
                                        <tbody>{contexto1.EvidenciasYDatos.map((e,i) => <tr key={i} className="border-b"><td className="p-2">{e.IndicadorEstudio}</td><td className="p-2">{e.DatoPorcentaje||'N/A'}</td><td className="p-2">{e.URL ? <a href={e.URL} target="_blank" className="text-blue-600 hover:underline">{e.FuenteEntidad || 'Link'}</a> : e.FuenteEntidad}</td></tr>)}</tbody>
                                    </table>
                                </div>
                                <div><h4 className="font-bold text-slate-700 mb-2">Dolencias que alivia</h4><ul className="space-y-3">{contexto1.DolenciasQueAlivia.map((d,i) => <li key={i}><strong className="block text-slate-800">{d.DolorSintoma}</strong><p className="text-slate-600">{d.EvidenciaMecanismo}</p></li>)}</ul></div>
                                <div><h4 className="font-bold text-slate-700 mb-2">Insights Publicitarios</h4><ul className="list-disc list-inside space-y-1 text-slate-600">{contexto1.InsightsPublicitarios.map((insight,i) => <li key={i}>{insight}</li>)}</ul></div>
                            </div>
                        ) : <p>Contexto 1 no disponible.</p>)}
                        
                        {activeTab === 'c2' && (contexto2 ? (
                             <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-slate-600"><span className="font-semibold">Query:</span> <code className="text-xs bg-slate-200 p-1 rounded">{contexto2.query}</code></p>
                                    <p className="text-slate-600"><span className="font-semibold">Resultados:</span> {contexto2.total_encontrados}</p>
                                </div>
                                <div className="space-y-4">{contexto2.comentarios.map((c,i) => (
                                    <div key={i} className="p-3 bg-white border rounded-md">
                                        <div dangerouslySetInnerHTML={{ __html: c.comentario }} className="prose prose-sm max-w-none text-slate-800" />
                                        <div className="mt-2 flex justify-between items-center">
                                            <SentimentBadge sentiment={c.sentimiento} />
                                            {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center">Ver original <ExternalLinkIcon className="w-3 h-3 ml-1" /></a>}
                                        </div>
                                    </div>
                                ))}</div>
                            </div>
                        ) : <p>Contexto 2 no disponible.</p>)}
                    </div>
                </div>
            </aside>

            {/* Right Column: Avatars */}
            <main className="lg:col-span-2">
                {avatars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {avatars.map(avatar => {
                            const isSelectedForAnalysis = selectedSlots.includes(avatar.slot);
                            const age = avatar.data?.rango_edad;
                            const gender = avatar.data?.sexo;
                            const income = avatar.data?.nivel_ingresos;
                            return (
                                <div key={avatar.id} 
                                    onClick={() => handleToggleSelection(avatar.slot)}
                                    className={`relative bg-white rounded-lg border shadow-sm cursor-pointer transition-all duration-200 ${isSelectedForAnalysis ? 'border-green-500 ring-2 ring-green-500/50' : 'border-slate-200 hover:border-slate-400'}`}>
                                    
                                    {isSelectedForAnalysis && (
                                        <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-slate-800">{avatar.title}</h3>
                                        {avatar.headline ? (
                                            <p className="text-sm text-slate-600 h-10 mt-1 line-clamp-2">{avatar.headline}</p>
                                        ) : (
                                            <div className="h-10 mt-1"></div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-3 h-8 overflow-hidden">
                                            {age && <span className="text-xs bg-slate-100 px-2 py-1 rounded">{age}</span>}
                                            {gender && <span className="text-xs bg-slate-100 px-2 py-1 rounded">{gender}</span>}
                                            {income && <span className="text-xs bg-slate-100 px-2 py-1 rounded line-clamp-1">{income}</span>}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50/70 border-t rounded-b-lg flex items-center justify-between">
                                        <button onClick={(e) => { e.stopPropagation(); setModalAvatar(avatar); }} className="text-sm font-semibold text-slate-700 hover:text-slate-900">Ver ficha</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                        <h3 className="text-xl font-semibold text-slate-700">Sin avatares</h3>
                        <p className="mt-2 text-slate-500">No se encontraron avatares generados para este proyecto.</p>
                     </div>
                )}
            </main>
        </div>
      </div>

      <AvatarDetailModal avatar={modalAvatar} onClose={() => setModalAvatar(null)} />
      
      {/* Sticky Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 transition-transform duration-300 ${selectedSlots.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center justify-between h-20">
                <div className="flex items-center space-x-4">
                    <p className="font-semibold text-slate-800">{selectedSlots.length} avatares seleccionados</p>
                    <button onClick={handleClearSelection} className="text-sm text-slate-600 hover:underline">Limpiar selección</button>
                </div>
                <button onClick={handleAnalyze} disabled={isAnalyzing || selectedSlots.length === 0} className="px-6 py-3 text-base font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed">
                    {isAnalyzing ? 'Encolando...' : `Analizar ${selectedSlots.length} seleccionados`}
                </button>
            </div>
        </div>
      </div>
      
      {toast && (
          <div className={`fixed bottom-5 right-5 text-white px-5 py-3 rounded-lg shadow-lg flex items-center z-50 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}>
              <CheckCircleIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${toast.type === 'success' ? 'text-green-400' : 'text-red-300'}`} />
              {toast.message}
          </div>
      )}
    </>
    );
};

export default ProjectAvatarsPage;
