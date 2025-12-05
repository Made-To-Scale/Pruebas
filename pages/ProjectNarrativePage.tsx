
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    PencilSquareIcon, 
    BookOpenIcon, 
    SwatchIcon, 
    FunnelIcon, 
    ListBulletIcon, 
    PuzzlePieceIcon, 
    LightbulbIcon, 
    ExclamationTriangleIcon,
    ChevronDownIcon
} from '../components/Icons';

// --- Types ---

interface Narrative {
    id: string;
    project_id: string;
    causa_justa: any;
    tono_de_voz: any;
    framework_narrativo: any;
    filtro_carl_jung: any;
    ideas_deslizar: any;
    stack_persuasion: any;
}

// --- Helpers & parsers ---

const safeJsonParse = (input: any): any => {
    if (!input) return null;
    if (typeof input === 'object') return input;
    if (typeof input === 'string') {
        try {
            // Check if it looks like JSON to avoid trying to parse plain text unnecessarily
            const trimmed = input.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                return JSON.parse(input);
            }
            return input; // Return as string if not JSON
        } catch (e) {
            return input; // Return original string on failure
        }
    }
    return input;
};

// --- Visual Sub-components ---

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mts-green mb-4"></div>
        <p className="text-slate-500 text-sm">Cargando estrategia narrativa...</p>
    </div>
);

const EmptySection = ({ message = "No hay datos disponibles." }: { message?: string }) => (
    <div className="p-6 bg-slate-50 rounded-lg border border-slate-100 text-center">
        <p className="text-slate-400 text-sm italic">{message}</p>
    </div>
);

interface CollapsibleSectionProps { 
    title: string; 
    subtitle?: string; 
    icon: React.ReactNode; 
    children?: React.ReactNode; 
    className?: string;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
    title, 
    subtitle, 
    icon, 
    children, 
    className = "",
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${className}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors text-left"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 flex-shrink-0">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight">{title}</h3>
                        {subtitle && <p className="text-sm text-slate-500 mt-0.5 font-normal">{subtitle}</p>}
                    </div>
                </div>
                <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="w-5 h-5" />
                </div>
            </button>
            
            {isOpen && (
                <div className="p-6 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- 1. Causa Justa Component ---

const CausaJustaHero = ({ data }: { data: any }) => {
    const raw = safeJsonParse(data);
    
    // Normalization: Extract string from object if needed
    let text = "";
    if (typeof raw === 'string') {
        text = raw;
    } else if (typeof raw === 'object' && raw !== null) {
        // Try common keys or the uppercase root key
        const root = raw.CAUSA_JUSTA || raw.causa_justa || raw;
        if (typeof root === 'string') text = root;
        else if (typeof root === 'object') {
            text = root.descripcion || root.mision || root.statement || JSON.stringify(root);
        }
    }

    if (!text) return null;

    return (
        <CollapsibleSection
            title="La Causa Justa"
            subtitle="El propósito superior que guía la narrativa"
            icon={<BookOpenIcon className="w-6 h-6 text-mts-green" />}
            className="border-mts-green/20"
            defaultOpen={true}
        >
             <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-mts-navy to-[#1a2e4d] text-white shadow-md p-8">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-mts-green opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                    <p className="text-xl md:text-2xl font-medium leading-relaxed text-white text-center md:text-left">
                        "{text}"
                    </p>
                </div>
            </div>
        </CollapsibleSection>
    );
};

// --- 2. Tone of Voice Component ---

const ToneOfVoiceTable = ({ data }: { data: any }) => {
    const raw = safeJsonParse(data);
    // Unwrap root if exists
    const list = Array.isArray(raw) ? raw : (raw?.TONO_DE_VOZ || raw?.tono_de_voz || []);

    if (!Array.isArray(list) || list.length === 0) return <EmptySection />;

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-4 w-[20%]">Características</th>
                        <th className="px-5 py-4 w-[45%]">Descripción</th>
                        <th className="px-5 py-4 w-[35%]">Ejemplo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {list.map((item: any, idx: number) => (
                        <tr key={idx} className={idx % 2 !== 0 ? 'bg-slate-50/50' : ''}>
                            <td className="px-5 py-4 font-bold text-slate-800 align-top">
                                {item.caracteristica || item.nombre || 'N/A'}
                            </td>
                            <td className="px-5 py-4 text-slate-600 align-top leading-relaxed whitespace-pre-wrap">
                                {item.descripcion || item.description || '-'}
                            </td>
                            <td className="px-5 py-4 align-top">
                                <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-900 px-3 py-2 rounded-lg italic text-xs leading-relaxed">
                                    "{item.ejemplo || item.example || '...'}"
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- 3. Archetypes Filter Component ---

const ArchetypesTable = ({ data }: { data: any }) => {
    // 1. Parsing Logic
    const parseArchetypes = (raw: any) => {
        if (!raw) return null;
        let json = raw;
        if (typeof raw === 'string') {
            try {
                json = JSON.parse(raw);
            } catch {
                return null;
            }
        }
        // Strict mapping based on user request (FILTRO_ARQUETIPOS is the root)
        const root = json.FILTRO_ARQUETIPOS ?? json;
        if (!root) return null;
        return root;
    };

    const archetypes = parseArchetypes(data);

    // 2. Define rows configuration
    const config = [
        { key: "filtro_principal", label: "FILTRO PRINCIPAL" },
        { key: "arquetipo_primario", label: "ARQUETIPO PRIMARIO" },
        { key: "arquetipo_secundario", label: "ARQUETIPO SECUNDARIO" },
        { key: "modulador", label: "MODULADOR" },
    ];

    // 3. Map rows
    const rows = config.map((rowConfig) => {
        const item = archetypes ? (archetypes[rowConfig.key] || {}) : {};
        
        // Keys strictly from prompt
        const component = item["Componente"] || "No especificado";
        const definition = item["Definición"] || "No especificado";
        const keyTraits = item["Características_clave_como_suena"] || "No especificado";
        const microcopy = item["Ejemplos_de_microcopy"] || "";
        
        let weight = item["peso_porcentual"] || "";
        // Normalize percentage
        if (typeof weight === "string" && weight.trim() !== "") {
            weight = weight.trim();
            if (!weight.includes("%")) weight = `${weight}%`;
        } else if (typeof weight === "number") {
             weight = `${weight}%`;
        }

        return {
            ...rowConfig,
            component,
            definition,
            keyTraits,
            microcopy,
            weight
        };
    });

    if (!archetypes) return <EmptySection message="Datos de arquetipos no disponibles." />;

    return (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
             <table className="min-w-full text-sm text-left table-fixed">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 w-[25%] border-r border-slate-100 last:border-r-0">Componente</th>
                        <th className="px-6 py-4 w-[40%] border-r border-slate-100 last:border-r-0">Definición</th>
                        <th className="px-6 py-4 w-[35%]">Características Clave</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                            {/* Componente */}
                            <td className="px-6 py-5 align-top border-r border-slate-50 last:border-r-0">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-bold text-slate-900 text-lg leading-tight">
                                        {row.component}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {row.label}
                                    </span>
                                    {row.weight && (
                                        <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-mts-green/20 text-emerald-800 border border-mts-green/30">
                                            {row.weight}
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* Definición */}
                            <td className="px-6 py-5 align-top text-slate-600 leading-relaxed whitespace-pre-wrap border-r border-slate-50 last:border-r-0">
                                {row.definition}
                            </td>

                            {/* Características Clave */}
                            <td className="px-6 py-5 align-top text-slate-600 leading-relaxed">
                                {row.keyTraits !== "No especificado" ? (
                                    <div className="space-y-4">
                                         <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Cómo suena</span>
                                            <p>{row.keyTraits}</p>
                                         </div>
                                         {row.microcopy && (
                                             <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Microcopy</span>
                                                <p className="italic bg-slate-50 p-2 rounded border border-slate-100">"{row.microcopy}"</p>
                                             </div>
                                         )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic">No especificado</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- 4. Narrative Framework Component ---

const FrameworkTimeline = ({ data }: { data: any }) => {
    let raw = safeJsonParse(data);
    if (raw?.NARRATIVA) raw = raw.NARRATIVA;
    else if (raw?.narrativa) raw = raw.narrativa;

    if (!raw) return <EmptySection />;

    const steps = [
        { key: 'evidencia', title: 'Evidencia (El Gancho)', icon: '1' },
        { key: 'tierra_prometida', title: 'Tierra Prometida', icon: '2' },
        { key: 'cambio_inevitable', title: 'Cambio Inevitable', icon: '3' },
        { key: 'ganadores_y_perdedores', title: 'Ganadores y Perdedores', icon: '4' },
        { key: 'herramientas_necesarias', title: 'Herramientas Necesarias', icon: '5' },
    ];

    return (
        <div className="relative pl-4 space-y-0">
            {/* Vertical Line */}
            <div className="absolute left-[1.15rem] top-4 bottom-8 w-0.5 bg-slate-200"></div>

            {steps.map((step, idx) => {
                const text = raw[step.key] || raw[step.key.toUpperCase()];
                if (!text) return null;

                return (
                    <div key={step.key} className="relative flex items-start gap-5 pb-10 last:pb-0 group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-mts-green text-emerald-700 font-bold flex items-center justify-center text-sm z-10 shadow-sm group-hover:scale-110 transition-transform">
                            {step.icon}
                        </div>
                        <div className="flex-1 pt-1">
                            <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-2">
                                {step.title}
                            </h4>
                            <p className="text-slate-600 leading-relaxed text-base bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {text}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- 5. Ideas Grid Component ---

const IdeasGrid = ({ data }: { data: any }) => {
    let raw = safeJsonParse(data);
    // Unwrap root
    if (raw?.IDEAS_A_DESLIZAR) raw = raw.IDEAS_A_DESLIZAR;
    else if (raw?.ideas_a_deslizar) raw = raw.ideas_a_deslizar;

    const list = Array.isArray(raw) ? raw : [];

    if (list.length === 0) return <EmptySection />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item: any, idx: number) => (
                <div key={idx} className="p-5 bg-yellow-50/50 rounded-xl border border-yellow-100 hover:border-yellow-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start gap-3">
                        <LightbulbIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-slate-800 text-base mb-2">
                                {item.idea || item.titulo || `Idea #${idx + 1}`}
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {item.descripcion || item.detalle || JSON.stringify(item)}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- 6. Persuasion Stack Component ---

const StackGrid = ({ data }: { data: any }) => {
    let raw = safeJsonParse(data);
    
    // Logic to extract the inner object with the lists
    let content = raw;

    // Direct match for the key described by user
    if (content?.STACK_PERSUASION_MARCA) {
        content = content.STACK_PERSUASION_MARCA;
    }
    // Fallback: Check if wrapped in stack_persuasion
    else if (content?.stack_persuasion) {
         // Check if nested inside stack_persuasion
         if (content.stack_persuasion.STACK_PERSUASION_MARCA) {
             content = content.stack_persuasion.STACK_PERSUASION_MARCA;
         } else {
             content = content.stack_persuasion;
         }
    }
    // Fallback: Check if wrapped in uppercase STACK_PERSUASION
    else if (content?.STACK_PERSUASION) {
        content = content.STACK_PERSUASION;
    }
    
    if (!content || typeof content !== 'object') return <EmptySection />;

    // Helper to format keys (snake_case to Title Case)
    const formatTitle = (key: string) => {
        return key
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    const keys = Object.keys(content).filter(k => {
        const val = content[k];
        return Array.isArray(val) && val.length > 0;
    });

    if (keys.length === 0) return <EmptySection message="No se encontraron datos en el Stack de Persuasión." />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {keys.map((key, idx) => {
                const items = content[key];
                return (
                    <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-mts-green text-mts-navy text-xs font-bold shadow-sm">
                                {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                                {formatTitle(key)}
                            </h4>
                        </div>
                        <ul className="space-y-2">
                            {items.map((item: string, i: number) => (
                                <li key={i} className="flex items-start text-sm text-slate-700 leading-snug">
                                    <span className="text-mts-green mr-2 mt-1.5 text-[8px] flex-shrink-0">●</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};


// --- MAIN PAGE ---

const ProjectNarrativePage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    
    // Updated state to hold a single narrative object instead of an array
    const [narrative, setNarrative] = useState<Narrative | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;
            setIsLoading(true);
            setError(null);
            try {
                // Fetch Single Narrative for the Project
                const { data, error: narrativeError } = await supabase
                    .from('narratives')
                    .select('*')
                    .eq('project_id', projectId)
                    .maybeSingle();

                if (narrativeError) throw narrativeError;

                setNarrative(data);

            } catch (err: any) {
                console.error("Error fetching narrative data:", err);
                setError(err.message || "Error al cargar datos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (isLoading) return <LoadingSpinner />;
    
    if (error) {
        return (
            <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-red-800 font-bold mb-2">Error de Carga</h3>
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        );
    }

    if (!narrative) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <PencilSquareIcon className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Sin Estrategia Narrativa</h3>
                <p className="text-slate-500 mt-2 max-w-md">
                    No se ha generado la narrativa para este proyecto. Completa el brief y genera el análisis para desbloquear esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 animate-fade-in w-full">
            {/* Page Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Estrategia Narrativa</h2>
                <p className="text-slate-600 mt-2 max-w-3xl text-lg">
                    Define el storytelling, la personalidad y los ángulos de persuasión del proyecto.
                </p>
            </div>

            {/* CONTENT (Full Width) */}
            <div className="w-full space-y-6 animate-fade-in">
                
                {/* 1. Causa Justa */}
                <CausaJustaHero data={narrative.causa_justa} />

                {/* 2. Tono de Voz */}
                <CollapsibleSection 
                    title="Tono de Voz" 
                    subtitle="Guía de cómo debe sonar la marca"
                    icon={<SwatchIcon className="w-5 h-5 text-pink-600" />}
                    defaultOpen={true}
                >
                    <ToneOfVoiceTable data={narrative.tono_de_voz} />
                </CollapsibleSection>

                {/* 3. Filtro Arquetipos */}
                <CollapsibleSection 
                    title="Arquetipos (Filtro)" 
                    subtitle="La personalidad subconsciente de la marca desglosada"
                    icon={<FunnelIcon className="w-5 h-5 text-orange-600" />}
                    defaultOpen={true}
                >
                    <ArchetypesTable data={narrative.filtro_carl_jung} />
                </CollapsibleSection>

                {/* 4. Framework Narrativo */}
                <CollapsibleSection 
                    title="Framework Narrativo" 
                    subtitle="La estructura paso a paso de tu historia de ventas"
                    icon={<PuzzlePieceIcon className="w-5 h-5 text-blue-600" />}
                    defaultOpen={true}
                >
                    <FrameworkTimeline data={narrative.framework_narrativo} />
                </CollapsibleSection>

                {/* 5. Ideas para Deslizar */}
                <CollapsibleSection 
                    title="Ideas para Deslizar" 
                    subtitle="Conceptos clave a insertar en la mente del cliente"
                    icon={<LightbulbIcon className="w-5 h-5 text-yellow-500" />}
                    defaultOpen={true}
                >
                    <IdeasGrid data={narrative.ideas_deslizar} />
                </CollapsibleSection>

                {/* 6. Stack Persuasión */}
                <CollapsibleSection 
                    title="Stack de Persuasión" 
                    subtitle="Principios psicológicos activos divididos por ángulo"
                    icon={<ListBulletIcon className="w-5 h-5 text-emerald-600" />}
                    defaultOpen={true}
                >
                    <StackGrid data={narrative.stack_persuasion} />
                </CollapsibleSection>

            </div>
        </div>
    );
};

export default ProjectNarrativePage;
