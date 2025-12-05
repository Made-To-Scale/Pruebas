
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// --- Types ---

type MasterSectionKey =
  | 'motivadores'
  | 'dolores'
  | 'pensamientos_internos'
  | 'escenas_dolor'
  | 'experiencias_pasadas'
  | 'niveles_consciencia'
  | 'creencias_loc1_2'
  | 'creencias_loc3_4'
  | 'miedos_ocultos'
  | 'objeciones_y_faqs'
  | 'obstaculos';

type MasterOutputsBySection = {
  [K in MasterSectionKey]?: any;
};

type LocLevel = 1 | 2 | 3 | 4 | 5;

// --- Helper Components ---

const Accordion: React.FC<{ title: React.ReactNode; subtitle?: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, subtitle, children, isOpen, onToggle }) => (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm transition-all duration-300">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-5 text-left group">
            <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-mts-navy transition-colors">{title}</h2>
                {/* Subtitle removed from trigger to hide when closed */}
            </div>
            <svg className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 ml-4 transform ${isOpen ? 'rotate-180 text-mts-green' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isOpen && (
            <div className="p-5 pt-0 animate-fade-in">
                {subtitle && (
                    <div className="mb-6 pb-2 border-b border-slate-100">
                        <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                )}
                {children}
            </div>
        )}
    </div>
);

const BulletList: React.FC<{ items: (string|null)[] | undefined, className?: string }> = ({ items, className }) => {
    const validItems = items?.filter(item => typeof item === 'string' && item.trim() !== '');
    if (!validItems || validItems.length === 0) return <p className="text-slate-400 text-xs italic">No hay datos.</p>;
    return (
        <ul className={`space-y-2 text-slate-700 text-sm ${className}`}>
            {validItems.map((item, i) => (
                <li key={i} className="flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-mts-green mr-2.5 mt-1.5 flex-shrink-0"></span>
                    <span className="flex-1 leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
};

const Pill: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({ children, color = 'bg-slate-100 text-slate-700', className = '' }) => (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${color} ${className}`}>
        {children}
    </span>
);

// --- Buyer Persona Card Components ---

const InfoSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm ${className}`}>
        <h3 className="text-mts-navy font-semibold text-lg mb-3 border-b border-slate-200 pb-2">{title}</h3>
        <div className="text-slate-700">
            {children}
        </div>
    </div>
);

const TagList: React.FC<{ items: string[] }> = ({ items }) => {
    if (!items || items.length === 0) return <span className="text-slate-400 text-sm italic">No especificado</span>;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-medium shadow-sm">
                    {item}
                </span>
            ))}
        </div>
    );
};

const BuyerPersonaCard: React.FC<{ profile: any; action?: React.ReactNode }> = ({ profile, action }) => {
    const data = profile || {};
    const demo = data.datos_demograficos || {};
    
    // Helper to ensure array
    const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);

    // Helper to find value in root or nested demographics object
    const getVal = (...keys: string[]) => {
        for (const k of keys) {
            if (data[k]) return data[k];
            if (demo[k]) return demo[k];
        }
        return '-';
    };

    return (
        <div className="bg-white border-l-4 border-l-mts-green rounded-2xl shadow-sm p-6 md:p-8 mb-8 border-y border-r border-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{data.nombre || data.name || 'Avatar Sin Nombre'}</h1>
                    {/* UPDATED: Reduced font size to text-sm for better hierarchy as requested */}
                    <p className="mt-3 text-sm text-slate-600 font-normal leading-relaxed max-w-4xl">
                        "{data.headline || data.resumen_biografia || 'Sin descripción disponible.'}"
                    </p>
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>

            <hr className="border-slate-100 mb-8" />

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Datos Demográficos */}
                <InfoSection title="Datos Demográficos">
                    <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-0">
                            <span className="text-slate-800 font-bold">Edad</span>
                            <span className="text-slate-600 font-normal text-sm">{getVal('edad', 'edad_rango', 'rango_edad', 'age')}</span>
                        </li>
                        <li className="flex justify-between items-start border-b border-slate-200/60 pb-2 last:border-0 gap-4">
                            <span className="text-slate-800 font-bold flex-shrink-0">Rol / Título</span>
                            <span className="text-slate-600 text-right leading-tight font-normal text-sm">{getVal('rol_titulo', 'cargo', 'role', 'job_title')}</span>
                        </li>
                        <li className="flex justify-between items-start border-b border-slate-200/60 pb-2 last:border-0 gap-4">
                            <span className="text-slate-800 font-bold flex-shrink-0">Industria</span>
                            <span className="text-slate-600 text-right leading-tight font-normal text-sm">{getVal('sector_industria', 'sector', 'industry')}</span>
                        </li>
                        <li className="block pt-2">
                            <span className="text-slate-800 font-bold block mb-2">Contexto</span>
                            {/* UPDATED: Reduced text size from text-lg to text-sm */}
                            <p className="text-slate-700 text-sm leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                {getVal('contexto_empresa', 'situacion_vital', 'contexto')}
                            </p>
                        </li>
                    </ul>
                </InfoSection>

                {/* 5. Objeciones */}
                <InfoSection title="Objeciones Típicas">
                    <BulletList items={toArray(data.objeciones_tipicas || data.objeciones)} />
                </InfoSection>

                {/* 6. Creencias Arraigadas */}
                <InfoSection title="Creencias Arraigadas">
                    <BulletList items={toArray(data.creencias_arraigadas || data.creencias)} />
                </InfoSection>

                {/* 7. Frustraciones Cotidianas */}
                <InfoSection title="Frustraciones Cotidianas">
                    <BulletList items={toArray(data.frustraciones_cotidianas || data.frustraciones)} />
                </InfoSection>

                {/* 8. Niveles (Consciencia / Sofisticación) */}
                <InfoSection title="Niveles Estratégicos">
                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel de Consciencia</span>
                            <div className="bg-white px-3 py-2 rounded border border-slate-200 text-slate-800 font-semibold">
                                {data.nivel_conciencia || data.nivel_consciencia || '-'}
                            </div>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel de Sofisticación</span>
                            <div className="bg-white px-3 py-2 rounded border border-slate-200 text-slate-800 font-semibold">
                                {data.nivel_sofisticacion || '-'}
                            </div>
                        </div>
                    </div>
                </InfoSection>

                {/* 9. Palabras Textuales */}
                <InfoSection title="Diccionario del Cliente">
                    <TagList items={toArray(data.palabras_textuales_detectadas || data.palabras_clave)} />
                </InfoSection>

            </div>
        </div>
    );
};

// --- Page Specific Components ---

const MotivationsSection: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return <p>No hay datos de motivaciones.</p>;
    return (
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
                <h3 className="font-semibold text-slate-800 mb-3">Deseos superficiales</h3>
                <BulletList items={data.deseos_superficiales} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800 mb-3">Motivos reales profundos</h3>
                <BulletList items={data.motivos_reales_profundos} />
            </div>
        </div>
    );
};

// Component for a single thought row (Stateless)
const ThoughtItem = ({ item }: { item: any }) => {
    // Normalize emotion string for matching
    const emotionLower = (item.emocion || '').toLowerCase();
    
    let tagStyles = "bg-slate-100 text-slate-600 border-slate-200"; // default
    
    // Frustración: Amber soft
    if (emotionLower.includes('frustra')) {
        tagStyles = "bg-[#FFF8E1] text-[#B76E00] border-[#F9C97D]";
    } 
    // Miedo: Red soft
    else if (emotionLower.includes('miedo') || emotionLower.includes('temor')) {
        tagStyles = "bg-[#FEF2F2] text-[#B91C1C] border-[#EE8A8A]";
    } 
    // Deseo: Green soft
    else if (emotionLower.includes('deseo') || emotionLower.includes('anhelo')) {
        tagStyles = "bg-[#F0FDF4] text-[#15803D] border-[#9CD3A9]";
    }

    return (
        <div className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl transition-all hover:border-slate-300 hover:shadow-sm h-full">
             <div className="flex-shrink-0 mt-0.5">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${tagStyles} uppercase tracking-wider bg-opacity-60 border-opacity-60`}>
                    {item.emocion}
                </span>
             </div>
             <p className="text-sm text-slate-600 italic leading-relaxed">
                "{item.pensamiento}"
             </p>
        </div>
    );
};

// Component for the Pain Point Accordion
const PainPointAccordion = ({ dolor }: { dolor: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Sort Helper: Frustration (1) -> Fear (2) -> Desire (3) -> Others (4)
    const getSortWeight = (emocion: string) => {
        const lower = (emocion || '').toLowerCase();
        if (lower.includes('frustra')) return 1;
        if (lower.includes('miedo')) return 2;
        if (lower.includes('deseo')) return 3;
        return 4;
    };

    const thoughts = dolor.pensamientos_internos || [];
    const sortedThoughts = [...thoughts].sort((a: any, b: any) => getSortWeight(a.emocion) - getSortWeight(b.emocion));

    return (
        <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden mb-3 shadow-sm hover:shadow transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100 transition-colors group"
            >
                <div className="flex-1 pr-4">
                    <h3 className="text-base font-normal text-slate-700 leading-tight tracking-wide group-hover:text-slate-900">
                        {dolor.nombre_dolor}
                    </h3>
                </div>
                <div className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>

            {isOpen && (
                <div className="p-5 pt-2 border-t border-slate-200/50 animate-fade-in bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         {sortedThoughts.length > 0 ? (
                            sortedThoughts.map((p: any, pIndex: number) => (
                                <ThoughtItem key={pIndex} item={p} />
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic col-span-full">No se encontraron pensamientos internos.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const PainsAndThoughtsSection: React.FC<{ data: any; mainPainPoint?: string }> = ({ data, mainPainPoint }) => {
    const dolores = data?.dolores;

    if ((!Array.isArray(dolores) || dolores.length === 0) && !mainPainPoint) {
        return <p>No hay datos de dolores o pensamientos internos.</p>;
    }

    return (
        <div className="space-y-6">
            {/* 1. Featured Pain Point Box */}
            {mainPainPoint && (
                <div className="bg-mts-navy rounded-xl p-6 md:p-8 shadow-sm text-white border border-slate-800">
                    <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-mts-green mb-3 opacity-90">Dolor Principal</h3>
                    <p className="text-lg md:text-xl font-medium leading-relaxed font-sans text-white/95">
                        "{mainPainPoint}"
                    </p>
                </div>
            )}

            {/* 2. List of Pain Points (Accordions) */}
            {Array.isArray(dolores) && dolores.length > 0 && (
                <div className="space-y-2">
                    {dolores.map((dolor: any, index: number) => (
                        <PainPointAccordion key={index} dolor={dolor} />
                    ))}
                </div>
            )}
        </div>
    );
};


const DecisiveMomentsSection: React.FC<{ data: any }> = ({ data }) => {
    if (!data?.momentos_decisivos) return <p>No hay datos de momentos decisivos.</p>;
    // UPDATED: Added left border for timeline effect, improved Pill colors
    return (
        <div className="space-y-8 pl-6 border-l-2 border-slate-200 ml-2 py-2">
             {data.momentos_decisivos.map((momento: any, index: number) => (
                <div key={index} className="flex flex-col items-start relative">
                    {/* UPDATED: Blue soft pill with navy text */}
                    <Pill color="bg-blue-50 text-mts-navy" className="mb-2 uppercase tracking-wide text-[10px] border border-blue-100">{momento.tipo_activacion}</Pill>
                    <p className="font-semibold text-slate-800 italic text-lg leading-relaxed">“{momento.frase_cliente_se_dice}”</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{momento.momento_decisivo_real}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        <span className="font-semibold">Detonante:</span> {momento.micro_emocion_detonante}
                    </div>
                </div>
            ))}
        </div>
    );
};

const FrustrationsSection: React.FC<{ data: any }> = ({ data }) => {
    const frustrations = data?.frustraciones_acumuladas;
    if (!frustrations || frustrations.length === 0) return <p>No hay datos de frustraciones.</p>;
    return (
        // UPDATED: 'overflow-auto' to enable vertical scroll for sticky header
        <div className="overflow-auto rounded-lg border border-slate-300 bg-white max-h-[500px]">
            <table className="min-w-full text-sm">
                {/* Sticky header stays fixed relative to the container */}
                <thead className="bg-slate-800 text-white sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">Frustracion (hipótesis)</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Qué ha probado (suposición)</th>
                        <th className="px-4 py-3 text-left font-semibold">Por qué no funcionó (suposición)</th>
                        <th className="px-4 py-3 text-left font-semibold">Emoción</th>
                        <th className="px-4 py-3 text-left font-semibold">Cómo se manifiesta hoy (suposición)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {frustrations.map((item: any, index: number) => (
                        <tr key={index} className="align-top hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-800 font-medium">{item.frustracion}</td>
                            <td className="px-4 py-3 text-slate-600"><Pill>{item.tipo}</Pill></td>
                            <td className="px-4 py-3 text-slate-600">{item.que_ha_probado_ya}</td>
                            <td className="px-4 py-3 text-slate-600">{item.por_que_no_funciono}</td>
                            <td className="px-4 py-3 text-slate-600">{item.emocion_subyacente}</td>
                            <td className="px-4 py-3 text-slate-600">{item.como_se_manifesta_hoy}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FullBulletedList: React.FC<{ items: (string | null)[] | undefined, textSize?: string }> = ({ items, textSize = "text-sm" }) => {
    const validItems = items?.filter(item => typeof item === 'string' && item.trim() !== '');
    if (!validItems || validItems.length === 0) return <p className="text-slate-400 text-xs italic leading-snug">N/A</p>;
    return (
        <ul className="space-y-1.5">
            {validItems.map((item, i) => (
                <li key={i} className={`${textSize} text-slate-700 leading-snug flex items-start`}>
                    <span className="text-slate-400 mr-2 mt-0.5">&#8226;</span>
                    <span className="flex-1">{item}</span>
                </li>
            ))}
        </ul>
    );
};

const LocMapSection: React.FC<{ data: any; onVerDetalle: (level: LocLevel) => void; }> = ({ data, onVerDetalle }) => {
    const niveles = data?.p7_niveles_consciencia;
    if (!Array.isArray(niveles) || niveles.length === 0) return <p>No hay datos de niveles de consciencia.</p>;

    const fixedLocLabels: Record<string, string> = {
        '1': 'Completamente inconsciente',
        '2': 'Consciente del problema',
        '3': 'Consciente de la solución',
        '4': 'Consciente del producto',
        '5': 'Totalmente consciente',
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm border-collapse table-fixed min-w-[800px] md:min-w-0">
            <thead className="bg-slate-50">
                <tr className="border-b border-slate-300">
                    <th className="px-4 py-4 text-left font-semibold text-slate-600 w-48 align-top">Nivel de consciencia</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-600 align-top">Preguntas que se hace</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-600 align-top">Conversaciones / Búsquedas</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-600 align-top">Retos a los que se enfrenta</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-600 align-top">Miedos / Preocupaciones</th>
                </tr>
            </thead>
            <tbody>
                {niveles.map((nivel: any) => (
                    <tr key={nivel.nivel} className="border-b border-slate-200 hover:bg-slate-100/50 even:bg-slate-50">
                        <td className="px-4 py-5 align-top break-words">
                            <div className="flex flex-col h-full min-h-[140px] justify-between">
                                <div className="flex flex-col">
                                    <p className="font-bold text-slate-900 text-base mb-1">{`Nivel ${nivel.nivel}`}</p>
                                    <p className="font-medium text-slate-500 leading-tight text-xs uppercase tracking-wide">
                                        {fixedLocLabels[nivel.nivel]}
                                    </p>
                                </div>
                                
                                <div className="flex-1"></div>

                                <div>
                                    <button 
                                        onClick={() => onVerDetalle(nivel.nivel as LocLevel)} 
                                        className="block mt-2 px-3 py-2 text-xs font-bold text-mts-navy bg-mts-green rounded-lg hover:bg-green-400 shadow-sm transition-colors w-full text-center"
                                    >
                                        Ver detalle
                                    </button>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-5 text-slate-700 align-top leading-relaxed"><div className="flex items-center h-full"><FullBulletedList items={nivel.que_preguntas} textSize="text-sm" /></div></td>
                        <td className="px-4 py-5 text-slate-700 align-top leading-relaxed"><div className="flex items-center h-full"><FullBulletedList items={nivel.que_conversaciones} textSize="text-sm" /></div></td>
                        <td className="px-4 py-5 text-slate-700 align-top leading-relaxed"><div className="flex items-center h-full"><FullBulletedList items={nivel.retos} textSize="text-sm" /></div></td>
                        <td className="px-4 py-5 text-slate-700 align-top leading-relaxed"><div className="flex items-center h-full"><FullBulletedList items={nivel.miedos} textSize="text-sm" /></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    );
};

const CollapsibleGridGroup: React.FC<{ title: string; data: any[]; cardComponent: React.FC<any>; anchorId?: string }> = ({ title, data, cardComponent: Card, anchorId }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (!Array.isArray(data) || data.length === 0) return null;

    return (
        <div id={anchorId} className="mb-12 scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-mts-green rounded-full"></span>
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <div key={index} className={`transition-all duration-300 ${isExpanded ? 'col-span-full' : ''}`}>
                            <Card 
                                item={item} 
                                isOpen={isExpanded} 
                                onToggle={() => setExpandedIndex(isExpanded ? null : index)} 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CreenciaCollapsibleCard: React.FC<{ item: any; isOpen?: boolean; onToggle?: () => void }> = ({ item, isOpen: externalIsOpen, onToggle: externalOnToggle }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    
    // Controlled or uncontrolled mode
    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;
    const onToggle = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen));

    const DetailSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
        <div className={`mb-6 last:mb-0 ${className}`}>
            <h5 className="text-xs font-bold uppercase text-mts-navy tracking-wider mb-2">{title}</h5>
            {children}
        </div>
    );
    
    return (
        <div className={`bg-[#F8FAFC] rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 ${isOpen ? 'ring-2 ring-slate-200 bg-white' : 'hover:shadow-md'}`}>
            <button onClick={onToggle} className="w-full p-6 text-left flex justify-between items-start gap-4">
                <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 text-lg leading-snug">{item.creencia_texto}</h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Pill color="bg-mts-navy text-white" className="shadow-sm">{item.categoria}</Pill>
                        <Pill color="bg-white border border-slate-200 text-slate-600">Prioridad {item.prioridad}</Pill>
                    </div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 bg-slate-100 text-slate-600' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            
            {isOpen && (
                <div className="p-6 pt-2 border-t border-slate-100 animate-fade-in">
                    <div className="space-y-6">
                        <DetailSection title="Por qué bloquea">
                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{item.por_que_bloquea}</p>
                        </DetailSection>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <DetailSection title="Raíz Psicológica">
                                <p className="text-sm text-slate-700 leading-relaxed">{item.raiz_psicologica}</p>
                            </DetailSection>
                            <DetailSection title="Sesgo Cognitivo">
                                <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium">{item.sesgo_cognitivo}</span>
                            </DetailSection>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <DetailSection title="Frases Textuales">
                                <BulletList items={item.frases_textuales} className="bg-white" />
                            </DetailSection>
                            <DetailSection title="Pensamientos Internos">
                                <BulletList items={item.pensamientos_internos} className="bg-white" />
                            </DetailSection>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                             <DetailSection title="Consecuencias y Costes">
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-slate-400 text-xs uppercase mb-2">Consecuencias Personales</strong>
                                        <p className="text-slate-700 mb-2"><span className="font-semibold text-slate-500 text-xs">Corto:</span> {item.consecuencias?.corto_plazo_personal || 'N/A'}</p>
                                        <p className="text-slate-700"><span className="font-semibold text-slate-500 text-xs">Largo:</span> {item.consecuencias?.largo_plazo_personal || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-slate-400 text-xs uppercase mb-2">Consecuencias Profesionales</strong>
                                        <p className="text-slate-700 mb-2"><span className="font-semibold text-slate-500 text-xs">Corto:</span> {item.consecuencias?.corto_plazo_profesional || 'N/A'}</p>
                                        <p className="text-slate-700"><span className="font-semibold text-slate-500 text-xs">Largo:</span> {item.consecuencias?.largo_plazo_profesional || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                                     <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
                                        <strong className="font-bold block text-xs uppercase mb-1 opacity-70">Coste Oportunidad Personal</strong> 
                                        {item.costes_oportunidad?.personal || 'N/A'}
                                     </div>
                                     <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800">
                                        <strong className="font-bold block text-xs uppercase mb-1 opacity-70">Coste Oportunidad Profesional</strong> 
                                        {item.costes_oportunidad?.profesional || 'N/A'}
                                     </div>
                                </div>
                             </DetailSection>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const LevelDetailModal: React.FC<{ level: LocLevel | null; onClose: () => void; sections: MasterOutputsBySection }> = ({ level, onClose, sections }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (level) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [level]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!level) return null;

    const isLevel1or2 = level === 1 || level === 2;
    const fixedLocLabels: Record<string, string> = {
        '1': 'Completamente inconsciente', '2': 'Consciente del problema', '3': 'Consciente de la solución',
        '4': 'Consciente del producto', '5': 'Totalmente consciente',
    };

    const getTitle = () => {
        if (isLevel1or2) return "Nivel 1 y 2 – Inconsciente y Problema";
        return `Nivel ${level} – ${fixedLocLabels[level]}`;
    };
    
    const SimpleCardWrapper: React.FC<{children: React.ReactNode, isOpen?: boolean, onToggle?: () => void, title: string}> = ({children, isOpen, onToggle, title}) => (
        <div className={`bg-[#F8FAFC] rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 h-full flex flex-col ${isOpen ? 'bg-white ring-2 ring-slate-200' : 'hover:shadow-md'}`}>
            <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={onToggle}>
                <h4 className="font-semibold text-slate-900 text-lg leading-snug">{title}</h4>
                {onToggle && (
                     <div className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 bg-slate-100 text-slate-600' : ''}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                )}
            </div>
            {children}
        </div>
    );

    const MiedoCard: React.FC<{item: any, isOpen?: boolean, onToggle?: () => void}> = ({item, isOpen, onToggle}) => (
        <SimpleCardWrapper title={item.miedos_no_racional || item.miedo_no_racional} isOpen={isOpen} onToggle={onToggle}>
            <p className="text-sm italic text-slate-600 mt-2 mb-4 leading-relaxed">“{item.frase_interna_cliente}”</p>
            <div className="mt-auto">
                <Pill color="bg-red-50 text-red-700 border border-red-100">{item.emocion_asociada}</Pill>
            </div>
            
            {isOpen && (
                <div className="mt-6 pt-4 border-t border-slate-100 animate-fade-in space-y-4">
                     {item.por_que_es_dificil_de_confesar && (
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-xs font-bold text-slate-500 uppercase block mb-1">Por qué es difícil de confesar</strong>
                            <p className="text-sm text-slate-700">{item.por_que_es_dificil_de_confesar}</p>
                         </div>
                     )}
                     
                     {(item.consecuencia_si_no_resuelve || item.que_lo_activa) && (
                         <div className="grid md:grid-cols-2 gap-4">
                            {item.consecuencia_si_no_resuelve && (
                                <div>
                                    <strong className="text-xs font-bold text-slate-500 uppercase block mb-1">Consecuencia</strong>
                                    <p className="text-sm text-slate-700">{item.consecuencia_si_no_resuelve}</p>
                                </div>
                            )}
                            {item.que_lo_activa && (
                                <div>
                                    <strong className="text-xs font-bold text-slate-500 uppercase block mb-1">Activador</strong>
                                    <p className="text-sm text-slate-700">{item.que_lo_activa}</p>
                                </div>
                            )}
                         </div>
                     )}
                </div>
            )}
        </SimpleCardWrapper>
    );

    const ObjecionCard: React.FC<{item: any, isOpen?: boolean, onToggle?: () => void}> = ({item, isOpen, onToggle}) => (
        <SimpleCardWrapper title={item.objecion_clave || item.objecion} isOpen={isOpen} onToggle={onToggle}>
            <p className="text-sm italic text-slate-600 mt-2 mb-4 leading-relaxed">“{item.frase_cliente}”</p>
            <div className="mt-auto">
                <Pill color="bg-orange-50 text-orange-700 border border-orange-100">{item.tipo_objecion}</Pill>
            </div>
            {isOpen && (
                <div className="mt-6 pt-4 border-t border-slate-100 animate-fade-in space-y-4">
                     {(item.por_que_es_peligrosa || item.impacto_si_no_resuelve) && (
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <strong className="text-xs font-bold text-slate-500 uppercase block mb-1">Por qué es peligrosa</strong>
                            <p className="text-sm text-slate-700">{item.por_que_es_peligrosa || item.impacto_si_no_resuelve}</p>
                         </div>
                     )}
                     {item.contraargumento_o_angulo && (
                         <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <strong className="text-xs font-bold text-green-700 uppercase block mb-1">Contraargumento / Ángulo</strong>
                            <p className="text-sm text-green-800">{item.contraargumento_o_angulo}</p>
                         </div>
                     )}
                </div>
            )}
        </SimpleCardWrapper>
    );
    
    const FaqCard: React.FC<{item: any}> = ({item}) => (
        <SimpleCardWrapper title={item.duda_frecuente}>
             <p className="text-sm italic text-slate-600 mt-2">“{item.frase_cliente}”</p>
        </SimpleCardWrapper>
    );
    
    const ObstaculoCard: React.FC<{item: any}> = ({item}) => (
        <SimpleCardWrapper title={item.obstaculo_desafio_real}>
            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <strong className="font-bold text-blue-700 text-xs uppercase block mb-1">Estrategia</strong>
                <p className="text-sm text-blue-900">{item.estrategia_para_superarlo}</p>
            </div>
        </SimpleCardWrapper>
    );
    
    // Navigation Anchors
    const navItems = [];
    if (isLevel1or2 && sections.creencias_loc1_2?.creencias_limitantes?.length > 0) navItems.push({id: 'creencias', label: 'Creencias'});
    if (level === 3) {
        if(sections.creencias_loc3_4?.creencias_limitantes?.length > 0) navItems.push({id: 'creencias', label: 'Creencias'});
        if(sections.miedos_ocultos?.miedos_no_racionales?.length > 0) navItems.push({id: 'miedos', label: 'Miedos'});
        if(sections.objeciones_y_faqs?.objeciones_compra?.length > 0) navItems.push({id: 'objeciones', label: 'Objeciones'});
    }
    if (level === 4) {
        if(sections.creencias_loc3_4?.creencias_limitantes?.length > 0) navItems.push({id: 'creencias', label: 'Creencias'});
        if(sections.miedos_ocultos?.miedos_no_racionales?.length > 0) navItems.push({id: 'miedos', label: 'Miedos'});
        if(sections.objeciones_y_faqs?.objeciones_compra?.length > 0) navItems.push({id: 'objeciones', label: 'Objeciones'});
        if(sections.obstaculos?.obstaculos?.length > 0) navItems.push({id: 'obstaculos', label: 'Obstáculos'});
    }
    if (level === 5) {
        if(sections.objeciones_y_faqs?.objeciones_compra?.length > 0) navItems.push({id: 'objeciones', label: 'Objeciones'});
        if(sections.objeciones_y_faqs?.dudas_frecuentes?.length > 0) navItems.push({id: 'faqs', label: 'FAQs'});
        if(sections.obstaculos?.obstaculos?.length > 0) navItems.push({id: 'obstaculos', label: 'Obstáculos'});
    }

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if(el) el.scrollIntoView({behavior: 'smooth'});
    };

    const renderModalContent = () => {
        const creencias12 = sections.creencias_loc1_2?.creencias_limitantes || [];
        const creencias34 = sections.creencias_loc3_4?.creencias_limitantes || [];
        const miedos = sections.miedos_ocultos?.miedos_no_racionales || [];
        const { objeciones_compra, dudas_frecuentes } = sections.objeciones_y_faqs || {};
        const obstaculos = sections.obstaculos?.obstaculos || [];
        
        if (isLevel1or2) {
            return <div className="space-y-4">
                {creencias12.length > 0 ? 
                    <CollapsibleGridGroup title="Creencias limitantes LoC 1 y 2" data={creencias12} cardComponent={CreenciaCollapsibleCard} anchorId="creencias" /> 
                    : <p className="text-sm text-slate-500 text-center py-4">No se encontraron creencias limitantes para este nivel.</p>
                }
            </div>
        }
        
        switch (level) {
            case 3:
                return <div className="space-y-4">
                    <CollapsibleGridGroup title="Creencias limitantes (Solución)" data={creencias34} cardComponent={CreenciaCollapsibleCard} anchorId="creencias" />
                    <CollapsibleGridGroup title="Miedos ocultos" data={miedos} cardComponent={MiedoCard} anchorId="miedos" />
                    <CollapsibleGridGroup title="Objeciones de compra" data={objeciones_compra} cardComponent={ObjecionCard} anchorId="objeciones" />
                </div>;
            case 4:
                return <div className="space-y-4">
                    <CollapsibleGridGroup title="Creencias limitantes (Producto)" data={creencias34} cardComponent={CreenciaCollapsibleCard} anchorId="creencias" />
                    <CollapsibleGridGroup title="Miedos específicos" data={miedos} cardComponent={MiedoCard} anchorId="miedos" />
                    <CollapsibleGridGroup title="Objeciones de riesgo" data={objeciones_compra} cardComponent={ObjecionCard} anchorId="objeciones" />
                    <CollapsibleGridGroup title="Obstáculos logísticos" data={obstaculos} cardComponent={ObstaculoCard} anchorId="obstaculos" />
                </div>;
            case 5:
                return <div className="space-y-4">
                    <CollapsibleGridGroup title="Objeciones finales" data={objeciones_compra} cardComponent={ObjecionCard} anchorId="objeciones" />
                    <CollapsibleGridGroup title="FAQs y dudas" data={dudas_frecuentes} cardComponent={FaqCard} anchorId="faqs" />
                    <CollapsibleGridGroup title="Fricciones logísticas" data={obstaculos} cardComponent={ObstaculoCard} anchorId="obstaculos" />
                </div>;
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-[95vw] md:w-[80vw] h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header Sticky */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-white z-20 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{getTitle()}</h2>
                        <p className="text-sm text-slate-500 mt-1">Detalle profundo del estado mental del cliente</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Internal Nav - Sticky below header */}
                {navItems.length > 1 && (
                     <div className="px-8 py-3 bg-white/95 backdrop-blur-sm border-b border-slate-100 flex gap-4 overflow-x-auto z-10 flex-shrink-0">
                        {navItems.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => scrollTo(item.id)}
                                className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium hover:bg-mts-navy hover:text-white transition-colors whitespace-nowrap"
                            >
                                {item.label}
                            </button>
                        ))}
                     </div>
                )}

                {/* Body Scrollable */}
                <div className="flex-grow overflow-y-auto p-8 bg-white custom-scrollbar">
                    {renderModalContent()}
                </div>
            </div>
        </div>
    );
}


// --- Main Page Component ---
const AvatarMasterResultPage: React.FC = () => {
    const { id: projectId, avatarId, jobId } = useParams<{ id: string; avatarId: string; jobId?: string }>();
    const navigate = useNavigate();

    const [sections, setSections] = useState<MasterOutputsBySection>({});
    
    // State to hold comprehensive profile data for the Buyer Persona Card
    const [profileData, setProfileData] = useState<any>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const [openAccordions, setOpenAccordions] = useState<string[]>(['motivations']);
    const [modalLevel, setModalLevel] = useState<LocLevel | null>(null);

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !avatarId) {
                setError("Faltan parámetros en la URL.");
                return setIsLoading(false);
            }
            setIsLoading(true);
            try {
                let query = supabase.from('avatar_master_outputs').select('*').eq('project_id', projectId).eq('avatar_id', avatarId);
                if (jobId) query = query.eq('job_id', jobId);

                const { data: outputData, error: outputError } = await query;
                if (outputError) throw outputError;

                if (outputData.length === 0) throw new Error("No se encontraron datos de análisis para este avatar.");

                const transformedSections = outputData.reduce((acc, row) => {
                    let parsedData = row.data;
                    if (typeof parsedData === 'string') {
                        try {
                            parsedData = JSON.parse(parsedData);
                        } catch (e) {
                            console.error(`Error parsing master output section ${row.section}:`, e);
                            parsedData = {}; // Fallback to an empty object to prevent crashes
                        }
                    }
                    acc[row.section as MasterSectionKey] = parsedData;
                    return acc;
                }, {} as MasterOutputsBySection);
                setSections(transformedSections);
                
                // Added slot to selection
                const { data: avatarData, error: avatarError } = await supabase.from('avatars').select('etiqueta, profile, slot').eq('id', avatarId).single();
                if(avatarError) throw avatarError;

                if (avatarData) {
                    const profile = (typeof avatarData.profile === 'string' ? JSON.parse(avatarData.profile) : avatarData.profile) || {};
                    
                    // FIX: Merge root properties with data properties to ensure demographics are found
                    const mergedData = { ...profile, ...(profile.data || {}) };
                    
                    // Fallback name logic if specific fields are missing
                    let displayName = mergedData.nombre || mergedData.name || avatarData.etiqueta || `Avatar ${avatarData.slot || ''}`;
                    if(!displayName || (typeof displayName === 'string' && displayName.trim() === '')) displayName = "Avatar";

                    // Merge all available data sources into one profile object for the card
                    setProfileData({
                        ...mergedData,
                        nombre: displayName,
                        headline: mergedData.headline || mergedData.resumen_biografia,
                    });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [projectId, avatarId, jobId]);

    const handleDownloadReport = async () => {
        if (!projectId || !avatarId || !profileData) return;
        setIsDownloading(true);
        try {
            const response = await fetch(
              "https://sswebhook.made-to-scale.com/webhook/descargar-doc",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  project_id: projectId,
                  avatar_id: avatarId,
                }),
              }
            );
        
            if (!response.ok) {
              throw new Error("Network error");
            }
        
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
        
            const a = document.createElement("a");
            a.href = url;
            const safeName = (profileData.nombre || 'avatar').replace(/[^a-z0-9áéíóúñ\s-]/gi, '').trim(); 
            a.download = `Informe-${safeName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          } catch (err) {
            alert("Error al generar el documento. Inténtalo de nuevo.");
          } finally {
            setIsDownloading(false);
          }
    };
    
    if (isLoading) return <div className="p-8 text-center text-slate-600">Cargando Dossier Maestro...</div>;
    
    if (error) return (
        <div className="p-8 text-center bg-red-50 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-800">Error al cargar el análisis</h2>
            <p className="text-red-700 mt-2">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700">Volver</button>
        </div>
    );

    return (
        <>
            <div className="bg-slate-50 min-h-full -m-6 p-4 sm:p-6">
                <div className="w-full max-w-7xl mx-auto space-y-5">
                    <button onClick={() => navigate(-1)} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Volver a Avatares
                    </button>
                    
                    {/* Buyer Persona Card replaces HeaderAvatarSummary */}
                    {profileData && (
                        <BuyerPersonaCard 
                            profile={profileData} 
                            action={
                                <button
                                  className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-sm flex items-center"
                                  onClick={handleDownloadReport}
                                  disabled={isDownloading}
                                >
                                  {isDownloading ? (
                                      <span className="flex items-center">
                                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Generando PDF...
                                      </span>
                                  ) : (
                                      <>
                                        Descargar informe (PDF)
                                      </>
                                  )}
                                </button>
                            }
                        />
                    )}
                    
                    <Accordion title="Motivaciones del avatar" subtitle="Qué le mueve realmente a actuar" isOpen={openAccordions.includes('motivations')} onToggle={() => toggleAccordion('motivations')}>
                        <MotivationsSection data={sections.motivadores} />
                    </Accordion>

                    <Accordion title="Puntos de dolor principales y diálogo interno" isOpen={openAccordions.includes('pains')} onToggle={() => toggleAccordion('pains')}>
                        <PainsAndThoughtsSection data={sections.pensamientos_internos} mainPainPoint={profileData?.dolor_principal} />
                    </Accordion>

                    <Accordion title="Momentos decisivos (escenas de activación)" isOpen={openAccordions.includes('moments')} onToggle={() => toggleAccordion('moments')}>
                        <DecisiveMomentsSection data={sections.escenas_dolor} />
                    </Accordion>

                    <Accordion title="Frustraciones acumuladas y cicatrices del pasado" isOpen={openAccordions.includes('frustrations')} onToggle={() => toggleAccordion('frustrations')}>
                        <FrustrationsSection data={sections.experiencias_pasadas} />
                    </Accordion>

                    <Accordion title="Mapa de niveles de consciencia" isOpen={openAccordions.includes('map')} onToggle={() => toggleAccordion('map')}>
                        <LocMapSection data={sections.niveles_consciencia} onVerDetalle={(level) => setModalLevel(level)} />
                    </Accordion>

                </div>
            </div>
            <LevelDetailModal level={modalLevel} onClose={() => setModalLevel(null)} sections={sections} />
        </>
    );
};

export default AvatarMasterResultPage;
