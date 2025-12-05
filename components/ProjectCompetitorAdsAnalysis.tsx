
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MegaphoneIcon, 
  CheckCircleIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  VideoCameraIcon,
  PhotoIcon,
  XCircleIcon,
  LightbulbIcon,
  DocumentTextIcon,
  FireIcon
} from './Icons';

// --- Types ---

interface AdCompetitorInput {
  id: number;
  name: string;
  adsLibraryUrl: string;
}

interface AdCreative {
  id: string;
  media_url: string;
  media_type: string;
  hook_gancho?: string;
  competitor_id: string;
  competitor_name?: string;
  // Campos de análisis detallado
  full_copy?: string;
  dolor_principal?: string;
  dolores_secundarios?: string;
  nivel_consciencia?: string;
  framework_narrativo?: string;
  idea_principal?: string;
  promesa_central?: string;
  cta_copy?: string;
  miedos_activados?: string;
  tribu_audiencia?: string;
  arquetipo_marca?: string;
  estilo_visual?: string;
  posicionamiento_implicito?: string;
  resumen_tactico?: string;
  [key: string]: any;
}

type FormatFilter = 'all' | 'image' | 'video';

// --- Icons Local ---

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const FunnelIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

// --- Helpers ---

const cleanMediaUrl = (url: any): string => {
  if (!url) return '';
  
  // Si ya es un array real JS, tomamos el primero
  if (Array.isArray(url) && url.length > 0) {
      return String(url[0]).trim();
  }

  let cleaned = String(url).trim();
  
  // Manejo de cadenas JSON de arrays (ej: '["https://..."]')
  if ((cleaned.startsWith('["') || cleaned.startsWith("['")) && (cleaned.endsWith('"]') || cleaned.endsWith("']"))) {
      try {
          const parsed = JSON.parse(cleaned.replace(/'/g, '"')); 
          if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed[0];
          }
      } catch (e) {
          // Fallback con regex si falla el parseo
          const match = cleaned.match(/['"](https?:\/\/[^'"]+)['"]/);
          if (match) return match[1];
      }
  }
  
  // Limpiar comillas dobles extra si es un string simple que viene con comillas
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
};

const isVideoType = (type: string): boolean => {
    const t = (type || '').toLowerCase();
    return t.includes('video') || t.includes('reel') || t.includes('mp4');
};

const cleanCopyText = (text: string | undefined): string => {
    if (!text) return '';
    // Elimina patrones tipo {{product.name}}, {{product.brand}}, etc.
    let cleaned = text.replace(/\{\{.*?\}\}/g, '');
    // Elimina múltiples saltos de línea innecesarios
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
};

// --- Sub-components ---

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({ title, children, defaultOpen = false, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden mb-3 transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left bg-slate-50/50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'} transition-colors`}>
                         {icon || <LightbulbIcon className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-slate-700 uppercase tracking-wide text-xs md:text-sm">{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 border-t border-slate-100 text-sm text-slate-700 leading-relaxed bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

const AnalysisRenderer: React.FC<{ content: any }> = ({ content }) => {
    if (!content) return null;
    let parsedContent = content;
    if (typeof content === 'string') {
        try {
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) parsedContent = JSON.parse(content);
        } catch (e) { parsedContent = content; }
    }

    if (typeof parsedContent === 'string') {
        const paragraphs = parsedContent.split('\n\n');
        return <div className="p-4 bg-white rounded-xl border border-slate-200">{paragraphs.map((p, i) => <p key={i} className="text-slate-700 leading-relaxed text-sm mb-3 last:mb-0">{p}</p>)}</div>;
    }
    if (Array.isArray(parsedContent)) {
        return <Accordion title="Puntos Clave" defaultOpen={true}><ul className="space-y-2">{parsedContent.map((item, idx) => <li key={idx} className="flex items-start gap-2"><span className="text-indigo-400 mt-1.5">•</span><span>{typeof item === 'object' ? JSON.stringify(item) : item}</span></li>)}</ul></Accordion>;
    }
    if (typeof parsedContent === 'object' && parsedContent !== null) {
        const entries = Object.entries(parsedContent).filter(([key]) => key !== 'id' && key !== 'created_at');
        return <div className="space-y-2">{entries.map(([key, value], index) => {
            const title = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            return <Accordion key={index} title={title} defaultOpen={index === 0}>{Array.isArray(value) ? <ul className="space-y-3">{value.map((v, i) => <li key={i} className="flex items-start gap-2.5"><span className="text-indigo-500 font-bold mt-0.5">•</span><span className="flex-1">{typeof v === 'string' ? v : JSON.stringify(v)}</span></li>)}</ul> : typeof value === 'object' && value !== null ? <div className="space-y-3">{Object.entries(value).map(([k, v], i) => <div key={i} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="font-bold text-slate-800 capitalize block mb-1">{k.replace(/_/g, ' ')}</span><span className="text-slate-600 block leading-relaxed">{String(v)}</span></div>)}</div> : <p className="whitespace-pre-wrap leading-relaxed">{String(value)}</p>}</Accordion>;
        })}</div>;
    }
    return <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm font-mono text-slate-700 overflow-auto max-h-96">{JSON.stringify(parsedContent, null, 2)}</div>;
};

// --- Media Components ---

const MediaDisplay: React.FC<{ url: string; isVideo: boolean; className?: string; controls?: boolean; autoPlay?: boolean }> = ({ url, isVideo, className, controls = true, autoPlay = false }) => {
    if (isVideo) {
        return (
            <video 
                src={url} 
                className={`w-full h-full object-cover ${className}`} 
                controls={controls}
                autoPlay={autoPlay}
                loop={autoPlay}
                muted={autoPlay} // Muted for autoplay
                playsInline
            />
        );
    }
    return (
        <img 
            src={url} 
            alt="Ad creative" 
            className={`w-full h-full object-contain bg-black ${className}`} 
            loading="lazy"
        />
    );
};

const MediaCard: React.FC<{ ad: AdCreative; onClick: () => void }> = ({ ad, onClick }) => {
    const finalUrl = cleanMediaUrl(ad.media_url);
    const isVideo = isVideoType(ad.media_type);

    // Masonry styles rely on "break-inside-avoid" and removing fixed aspect ratios.
    // We let the image determine height (w-full h-auto).

    if (!finalUrl) {
        return (
             <div className="bg-slate-50 rounded-xl border border-slate-200 mb-4 break-inside-avoid flex flex-col items-center justify-center p-6 text-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Media no disponible</p>
                <p className="text-[10px] text-slate-300 mt-1 truncate w-full px-2">{ad.competitor_name}</p>
             </div>
        );
    }

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:ring-2 hover:ring-indigo-500 transition-all duration-300 cursor-pointer mb-5 break-inside-avoid"
        >
            {/* Overlay Name Tag */}
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="text-[10px] font-bold text-slate-700 bg-white/90 px-2 py-1 rounded-md shadow-sm border border-slate-100 backdrop-blur-sm truncate max-w-[120px] block">
                    {ad.competitor_name || 'Competidor'}
                </span>
            </div>

            {/* Type Indicator */}
            <div className="absolute top-2 right-2 z-10 text-white/80 pointer-events-none">
                 {isVideo ? <VideoCameraIcon className="w-4 h-4 drop-shadow-md" /> : <PhotoIcon className="w-4 h-4 drop-shadow-md" />}
            </div>

            {/* Media Content - Natural Size */}
            <div className="w-full bg-slate-100">
                {isVideo ? (
                    <video 
                        src={finalUrl} 
                        className="w-full h-auto object-cover block" 
                        muted 
                        playsInline
                        onMouseOver={event => (event.target as HTMLVideoElement).play().catch(() => {})}
                        onMouseOut={event => { (event.target as HTMLVideoElement).pause(); (event.target as HTMLVideoElement).currentTime = 0; }}
                    />
                ) : (
                    <img 
                        src={finalUrl} 
                        alt={`Ad by ${ad.competitor_name}`} 
                        className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-105" 
                        loading="lazy"
                    />
                )}
            </div>
        </div>
    );
};

// --- Detail Modal ---

const DetailField: React.FC<{ label: string; value: string | undefined; icon?: React.ReactNode; isFullWidth?: boolean }> = ({ label, value, icon, isFullWidth = false }) => {
    if (!value) return null;
    return (
        <div className={`bg-slate-50 p-3 rounded-lg border border-slate-100 ${isFullWidth ? 'col-span-full' : ''}`}>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                {icon}
                {label}
            </h4>
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
        </div>
    );
};

const AdDetailModal: React.FC<{ ad: AdCreative | null; onClose: () => void }> = ({ ad, onClose }) => {
    // Lock scroll when modal is open
    useEffect(() => {
        if (ad) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [ad]);

    if (!ad) return null;

    const finalUrl = cleanMediaUrl(ad.media_url);
    const isVideo = isVideoType(ad.media_type);
    const cleanedCopy = cleanCopyText(ad.full_copy);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full h-full md:h-[90vh] md:max-w-7xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
                
                {/* Close Button (Mobile) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors md:hidden"
                >
                    <XCircleIcon className="w-6 h-6" />
                </button>

                {/* LEFT COLUMN: Analysis (Expanded Width for readability) */}
                <div className="w-full md:w-1/2 lg:w-7/12 h-full bg-white overflow-y-auto custom-scrollbar border-r border-slate-200 order-2 md:order-1 flex flex-col">
                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-6 z-20 flex justify-between items-start">
                        <div>
                             <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Análisis Táctico</span>
                             <h2 className="text-2xl font-bold text-slate-900 mt-2">{ad.competitor_name}</h2>
                             <p className="text-sm text-slate-500 mt-1">Desglose de elementos persuasivos</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 1. Hook - Highlighted */}
                        {ad.hook_gancho && (
                             <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <FireIcon className="w-4 h-4 text-orange-500" />
                                    Gancho / Hook
                                </h3>
                                <p className="text-lg font-medium text-slate-800 leading-snug">"{ad.hook_gancho}"</p>
                             </div>
                        )}

                        {/* 2. Organized Accordions */}
                        
                        <Accordion title="Identidad y Audiencia" defaultOpen={true} icon={<CheckCircleIcon className="w-4 h-4" />}>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailField label="Arquetipo" value={ad.arquetipo_marca} />
                                <DetailField label="Tribu / Audiencia" value={ad.tribu_audiencia} />
                                <DetailField label="Nivel de Consciencia" value={ad.nivel_consciencia} isFullWidth />
                                <DetailField label="Posicionamiento Implícito" value={ad.posicionamiento_implicito} isFullWidth />
                            </div>
                        </Accordion>

                        <Accordion title="Narrativa y Estrategia" icon={<LightbulbIcon className="w-4 h-4" />}>
                             <div className="space-y-4">
                                <DetailField label="Idea / Ángulo Principal" value={ad.idea_principal} />
                                <DetailField label="Promesa Central" value={ad.promesa_central} />
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailField label="Framework" value={ad.framework_narrativo} />
                                    <DetailField label="Estilo Visual" value={ad.estilo_visual} />
                                </div>
                                <DetailField label="Resumen Táctico" value={ad.resumen_tactico} />
                             </div>
                        </Accordion>

                        <Accordion title="Psicología y Dolor" icon={<ExclamationTriangleIcon className="w-4 h-4" />}>
                            <div className="space-y-4">
                                <DetailField label="Dolor Principal" value={ad.dolor_principal} />
                                <DetailField label="Miedos Activados" value={ad.miedos_activados} />
                                <DetailField label="Dolores Secundarios" value={ad.dolores_secundarios} />
                            </div>
                        </Accordion>

                        <Accordion title="Caption / Copy" icon={<DocumentTextIcon className="w-4 h-4" />}>
                             <div className="space-y-4">
                                <DetailField label="Caption (Limpio)" value={cleanedCopy} isFullWidth />
                                <DetailField label="Call to Action" value={ad.cta_copy} isFullWidth />
                             </div>
                        </Accordion>

                    </div>
                </div>

                {/* RIGHT COLUMN: Creative (Slightly Narrower) */}
                <div className="w-full md:w-1/2 lg:w-5/12 h-[40vh] md:h-full bg-slate-900 relative order-1 md:order-2 flex items-center justify-center p-4 md:p-8">
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors hidden md:block"
                        title="Cerrar"
                    >
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                    
                    <div className="w-full h-full max-h-[85vh] flex items-center justify-center rounded-lg overflow-hidden">
                         <MediaDisplay url={finalUrl} isVideo={isVideo} className="max-h-full max-w-full object-contain" />
                    </div>
                </div>

            </div>
        </div>
    );
};

// --- Main Component ---

const ProjectCompetitorAdsAnalysis: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  
  // Data State
  const [analysisText, setAnalysisText] = useState<any>(null);
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Filters State
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('all');

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdCreative | null>(null);

  // Form State
  const [competitors, setCompetitors] = useState<AdCompetitorInput[]>([
    { id: 1, name: '', adsLibraryUrl: '' },
    { id: 2, name: '', adsLibraryUrl: '' },
    { id: 3, name: '', adsLibraryUrl: '' },
  ]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        if (!projectId) return;
        setIsLoadingData(true);
        setDbError(null);
        try {
            // 1. Get Analysis Text
            const { data: strategyData } = await supabase
                .from('competitor_strategies')
                .select('analisis_final_anuncios')
                .eq('project_id', projectId)
                .maybeSingle();
            
            if (strategyData) {
                setAnalysisText(strategyData.analisis_final_anuncios);
            }

            // 2. Get Competitors List
            const { data: compsData } = await supabase
                .from('competitors_strategic')
                .select('id, nombre')
                .eq('project_id', projectId);
            
            const compMap = new Map<string, string>();
            if (compsData && compsData.length > 0) {
                compsData.forEach(c => {
                    compMap.set(c.id, c.nombre);
                });
                setSuggestedNames(compsData.map(c => c.nombre));
            }

            // 3. Get Ads from competitor_ads_tactical
            const { data: adsData, error: adsError } = await supabase
              .from('competitor_ads_tactical')
              .select('*') 
              .eq('project_id', projectId)
              .order('created_at', { ascending: false });

            if (adsError) {
              console.error('Error fetching ads:', adsError);
              setDbError(adsError.message);
            }
            
            let mappedAds: AdCreative[] = [];

            if (adsData) {
                mappedAds = adsData.map((ad: any) => ({
                    ...ad,
                    competitor_name: compMap.get(ad.competitor_id) || compMap.get(ad.Competitor_Id) || ad.competitor_name || 'Competidor',
                    media_url: ad.media_url || ad.Media_Url || ad.Media_url || '',
                    media_type: ad.media_type || ad.Media_Type || 'image',
                    hook_gancho: ad.hook_gancho || ad.Hook_Gancho || ''
                }));
            }

            setAds(mappedAds);

        } catch (err: any) {
            console.error("Error loading data:", err);
            setDbError(err.message || 'Error desconocido cargando anuncios');
        } finally {
            setIsLoadingData(false);
        }
    };
    fetchData();
  }, [projectId]);

  // Handlers
  const handleInputChange = (id: number, field: keyof AdCompetitorInput, value: string) => {
    setCompetitors(prev => prev.map(comp => comp.id === id ? { ...comp, [field]: value } : comp));
    if (formError) setFormError(null);
  };

  const handleAddSlot = () => {
    if (competitors.length < 5) setCompetitors(prev => [...prev, { id: Date.now(), name: '', adsLibraryUrl: '' }]);
  };

  const handleRemoveSlot = (id: number) => {
    if (competitors.length > 3) setCompetitors(prev => prev.filter(comp => comp.id !== id));
  };

  const handleAnalyze = async () => {
    setSuccessMessage(null);
    setFormError(null);
    if (competitors.length < 3) { setFormError("Mínimo 3 competidores."); return; }
    if (competitors.some(c => !c.name.trim() || !c.adsLibraryUrl.trim())) { setFormError("Completa todos los campos."); return; }

    setIsAnalyzing(true);
    try {
      const payload = {
          project_id: projectId,
          competitors: competitors.map(c => ({ name: c.name, ads_library_url: c.adsLibraryUrl }))
      };
      
      const response = await fetch('https://sswebhook.made-to-scale.com/webhook/analisisanuncios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Error de conexión con el servidor de análisis.");
      
      setSuccessMessage("Análisis solicitado con éxito. Los resultados aparecerán aquí pronto.");
      setTimeout(() => { setShowForm(false); setSuccessMessage(null); }, 4000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Computed Values for Filtering
  const uniqueCompetitors = useMemo(() => {
      const names = new Set(ads.map(ad => ad.competitor_name).filter(Boolean));
      return Array.from(names).sort();
  }, [ads]);

  const filteredAds = useMemo(() => {
      return ads.filter(ad => {
          const matchesCompetitor = selectedCompetitor === 'all' || ad.competitor_name === selectedCompetitor;
          const isVideo = isVideoType(ad.media_type);
          const matchesFormat = selectedFormat === 'all' 
              ? true 
              : selectedFormat === 'video' ? isVideo : !isVideo;
          return matchesCompetitor && matchesFormat;
      });
  }, [ads, selectedCompetitor, selectedFormat]);


  // Shared Form Render
  const renderFormBody = () => (
    <>
        <div className="space-y-3 mb-6">
            {competitors.map((comp, index) => (
            <div key={comp.id} className="flex gap-3">
                <div className="w-8 h-10 flex items-center justify-center bg-slate-100 text-slate-500 font-bold rounded text-xs shrink-0 select-none">
                    #{index + 1}
                </div>
                <div className="relative w-1/3">
                    <input
                        type="text"
                        list="competitor-suggestions"
                        placeholder="Nombre competidor"
                        value={comp.name}
                        onChange={(e) => handleInputChange(comp.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                    />
                </div>
                <input
                    type="url"
                    placeholder="Enlace a Ads Library (ej: facebook.com/ads/library/...)"
                    value={comp.adsLibraryUrl}
                    onChange={(e) => handleInputChange(comp.id, 'adsLibraryUrl', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors"
                />
                    <button onClick={() => handleRemoveSlot(comp.id)} disabled={competitors.length <= 3} className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            ))}
        </div>
        
        {formError && <p className="text-red-600 text-sm mb-4 flex items-center gap-2 bg-red-50 p-3 rounded-md border border-red-100"><ExclamationTriangleIcon className="w-4 h-4"/> {formError}</p>}
        {successMessage && <p className="text-green-600 text-sm mb-4 flex items-center gap-2 bg-green-50 p-3 rounded-md border border-green-100"><CheckCircleIcon className="w-4 h-4"/> {successMessage}</p>}

        <div className="flex gap-3 pt-2">
            <button onClick={handleAddSlot} disabled={competitors.length >= 5} className="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors">
                <PlusIcon className="w-3 h-3 inline mr-1" /> Añadir fila
            </button>
            <div className="flex-1"></div>
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all active:scale-95">
                {isAnalyzing ? 'Enviando...' : 'Lanzar Análisis'}
            </button>
        </div>
        <datalist id="competitor-suggestions">{suggestedNames.map((name, i) => <option key={i} value={name} />)}</datalist>
    </>
  );

  const renderSwipeFile = () => (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800">Swipe File</h3>
                <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-full">{filteredAds.length} resultados</span>
            </div>
            
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                 <div className="relative">
                     <select 
                        value={selectedCompetitor} 
                        onChange={(e) => setSelectedCompetitor(e.target.value)}
                        className="appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     >
                         <option value="all">Todos los competidores</option>
                         {uniqueCompetitors.map((c, i) => <option key={i} value={c as string}>{c}</option>)}
                     </select>
                     <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                     <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>
                 
                 <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                     <button 
                        onClick={() => setSelectedFormat('all')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedFormat === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         Todo
                     </button>
                     <button 
                        onClick={() => setSelectedFormat('image')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedFormat === 'image' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         Fotos
                     </button>
                     <button 
                        onClick={() => setSelectedFormat('video')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedFormat === 'video' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         Vídeos
                     </button>
                 </div>
            </div>
        </div>

        {dbError && (
             <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                 <ExclamationTriangleIcon className="w-5 h-5" />
                 <span>Error cargando anuncios: {dbError}</span>
             </div>
        )}

        {filteredAds.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <MegaphoneIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No se encontraron creatividades.</p>
                <p className="text-slate-400 text-sm mt-1">Prueba a cambiar los filtros o lanza un nuevo análisis.</p>
            </div>
        ) : (
            /* Masonry Layout using CSS Columns */
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5">
                {filteredAds.map((ad) => (
                    <MediaCard key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
                ))}
            </div>
        )}
      </div>
  );

  if (isLoadingData) {
      return (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 animate-pulse">
              <MegaphoneIcon className="w-10 h-10 mb-4 opacity-50" />
              <p>Cargando inteligencia...</p>
          </div>
      );
  }

  const hasAnalysis = Boolean(analysisText);

  // --- VIEW 1: EMPTY STATE (Form is Hero) ---
  if (!hasAnalysis && ads.length === 0) {
      return (
          <div className="max-w-6xl mx-auto py-8 animate-fade-in">
             <div className="text-center mb-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mb-6 ring-4 ring-indigo-50/50">
                    <MegaphoneIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Analizador de Creatividades</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                    Introduce a tus competidores para espiar sus anuncios activos, detectar sus ganchos y desglosar su estrategia con IA.
                </p>
             </div>

             <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative mb-16 max-w-4xl mx-auto">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="p-8 md:p-10">
                    {renderFormBody()} 
                </div>
             </div>
             
             {(ads.length > 0 || dbError) && (
                 <div className="mt-12 pt-12 border-t border-slate-200">
                    {renderSwipeFile()}
                 </div>
             )}
          </div>
      );
  }

  // --- VIEW 2: DASHBOARD STATE (Analysis + Grid) ---
  return (
    <>
        <div className="animate-fade-in pb-12">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MegaphoneIcon className="w-6 h-6 text-indigo-600" />
                    Inteligencia de Anuncios
                </h2>
            </div>
            <button 
                onClick={() => setShowForm(!showForm)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm flex items-center gap-2 ${showForm ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'}`}
            >
                {showForm ? <><XCircleIcon className="w-4 h-4" /> Cancelar</> : <><PlusIcon className="w-4 h-4" /> Nuevo Análisis</>}
            </button>
        </div>

        {/* Toggleable Form */}
        {showForm && (
            <div className="mb-10 bg-white rounded-xl border border-indigo-100 shadow-md p-6 animate-fade-in-down relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h3 className="font-bold text-slate-800 mb-6 text-lg">Configurar Nueva Búsqueda</h3>
                {renderFormBody()}
            </div>
        )}

        {/* Analysis Block */}
        {hasAnalysis && (
            <div className="mb-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 relative">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-xl text-slate-800">Conclusiones Estratégicas</h3>
                    </div>
                    <AnalysisRenderer content={analysisText} />
            </div>
        )}

        {/* Swipe File Grid */}
        {renderSwipeFile()}
        </div>

        {/* Detail Modal */}
        <AdDetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />
    </>
  );
};

export default ProjectCompetitorAdsAnalysis;
