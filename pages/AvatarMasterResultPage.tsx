import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowTrendingUpIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '../components/Icons';

// --- Types ---
type MasterSection =
  | 'motivadores'
  | 'dolores'
  | 'escenas_dolor'
  | 'pensamientos_internos'
  | 'experiencias_pasadas'
  | 'miedos_ocultos'
  | 'objeciones_y_faqs'
  | 'creencias_loc1_2'
  | 'creencias_loc3_4'
  | 'niveles_consciencia'
  | 'obstaculos_logisticos';

type MasterOutputsBySection = {
  [K in MasterSection]?: any;
};

type LocFilter = 'all' | 1 | 2 | 3 | 4 | 5;
type LocLevel = 1 | 2 | 3 | 4 | 5;

// --- Main Page Component ---
const AvatarMasterResultPage: React.FC = () => {
    const { id: projectId, avatarId } = useParams<{ id: string; avatarId: string }>();
    const navigate = useNavigate();

    const [sectionsByKey, setSectionsByKey] = useState<MasterOutputsBySection>({});
    const [avatarName, setAvatarName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locFilter, setLocFilter] = useState<LocFilter>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !avatarId) {
                setError("Faltan parámetros en la URL.");
                return setIsLoading(false);
            }
            setIsLoading(true);
            try {
                const outputPromise = supabase.from('avatar_master_outputs').select('*').eq('project_id', projectId).eq('avatar_id', avatarId);
                const avatarPromise = supabase.from('avatars').select('etiqueta, profile').eq('id', avatarId).single();

                const [{ data: outputData, error: outputError }, { data: avatarData, error: avatarError }] = await Promise.all([outputPromise, avatarPromise]);

                if (outputError) throw outputError;
                if (avatarError) console.warn("Could not fetch avatar info:", avatarError.message);

                const transformedSections: MasterOutputsBySection = {};
                (outputData || []).forEach(row => {
                    transformedSections[row.section as MasterSection] = row.data;
                });
                setSectionsByKey(transformedSections);
                
                if (avatarData) {
                    const profile = typeof avatarData.profile === 'string' ? JSON.parse(avatarData.profile) : avatarData.profile;
                    setAvatarName(avatarData.etiqueta || profile?.name || 'Avatar sin nombre');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [projectId, avatarId]);

    const LOC_OPTIONS: { value: LocFilter; label: string; shortLabel: string; }[] = [
        { value: 'all', label: 'Ver todo', shortLabel: 'Todo' },
        { value: 1, label: 'LoC 1 · Inconsciente', shortLabel: 'LoC 1' },
        { value: 2, label: 'LoC 2 · Consciente del problema', shortLabel: 'LoC 2' },
        { value: 3, label: 'LoC 3 · Consciente de la solución', shortLabel: 'LoC 3' },
        { value: 4, label: 'LoC 4 · Consciente del producto', shortLabel: 'LoC 4' },
        { value: 5, label: 'LoC 5 · Totalmente consciente', shortLabel: 'LoC 5' },
    ];
    
    if (isLoading) {
        return <div className="p-8 text-center text-slate-600">Cargando Dossier Maestro...</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="bg-slate-50 min-h-full -m-6 p-4 md:p-6 lg:p-8">
            <button onClick={() => navigate(-1)} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver a resultados
            </button>
            
            <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm pt-2 pb-4 -mx-4 px-4 mb-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">
                        Dossier Maestro: <span className="text-slate-600">{avatarName}</span>
                    </h1>
                     <div className="flex-shrink-0 w-full md:w-auto overflow-x-auto">
                        <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg space-x-1">
                            {LOC_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setLocFilter(opt.value)}
                                    className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-200 whitespace-nowrap ${
                                        locFilter === opt.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="hidden sm:inline">{opt.label}</span>
                                    <span className="sm:hidden">{opt.shortLabel}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GainsColumn sections={sectionsByKey} />
                <PainsColumn sections={sectionsByKey} />
                <BarriersColumn sections={sectionsByKey} locFilter={locFilter} />
            </main>
        </div>
    );
};

// --- Column Components ---

const Column: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        {children}
    </div>
);

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; }> = ({ title, subtitle, children }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-4 text-sm space-y-3">{children}</div>
    </div>
);

const GainsColumn: React.FC<{ sections: MasterOutputsBySection }> = ({ sections }) => {
    const motivadores = sections.motivadores;
    return (
        <Column icon={<ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />} title="GAINS (Por qué SÍ)">
            <Card title="Motivadores de compra" subtitle="Deseos superficiales (lo que dicen)">
                {motivadores?.deseos_superficiales?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {motivadores.deseos_superficiales.map((d: string, i: number) => <li key={i}>{d}</li>)}
                    </ul>
                ) : <p className="text-slate-400 italic">No disponible.</p>}
            </Card>
            <Card title="Motivos profundos" subtitle="Motivaciones reales (lo que piensan de verdad)">
                 {motivadores?.motivos_reales_profundos?.length > 0 ? (
                    <ul className="space-y-2">
                        {motivadores.motivos_reales_profundos.map((m: string, i: number) => (
                            <li key={i} className="pl-3 border-l-2 border-green-500 text-slate-700 font-medium">{m}</li>
                        ))}
                    </ul>
                ) : <p className="text-slate-400 italic">No disponible.</p>}
            </Card>
        </Column>
    );
};

const PainsColumn: React.FC<{ sections: MasterOutputsBySection }> = ({ sections }) => {
    const escenas = sections.escenas_dolor?.momentos_decisivos || [];
    const pensamientos = sections.pensamientos_internos?.dolores || [];
    const experiencias = sections.experiencias_pasadas?.frustraciones_acumuladas || [];

    return (
        <Column icon={<ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />} title="PAINS (Por qué AHORA)">
            <Card title="Puntos de dolor / Escenas clave">
                {escenas.length > 0 ? escenas.map((e: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">{e.tipo_activacion}</span>
                        <p className="font-bold text-slate-800 my-1.5">"{e.frase_cliente_se_dice}"</p>
                        <p className="text-xs text-slate-500">{e.momento_decisivo_real}</p>
                        <p className="text-right mt-1"><span className="px-1.5 py-0.5 text-xs rounded-full bg-white ring-1 ring-slate-200">{e.micro_emocion_detonante}</span></p>
                    </div>
                )) : <p className="text-slate-400 italic">No disponible.</p>}
            </Card>
            <Card title="Pensamientos internos por dolor">
                 {pensamientos.length > 0 ? pensamientos.map((d: any, i: number) => (
                     <div key={i} className={i > 0 ? 'mt-4 pt-4 border-t' : ''}>
                         <h4 className="font-semibold text-slate-700 mb-2">{d.nombre_dolor}</h4>
                         <div className="flex flex-wrap gap-2">
                             {d.pensamientos_internos.map((p: any, j: number) => (
                                <div key={j} className="flex items-center gap-2 text-xs bg-slate-100 p-1.5 rounded-md">
                                     <span className={`px-1.5 py-0.5 rounded font-medium ${p.emocion === 'Miedo' ? 'bg-red-200 text-red-900' : 'bg-orange-200 text-orange-900'}`}>{p.emocion}</span>
                                     <span className="text-slate-700 pr-1">"{p.pensamiento}"</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )) : <p className="text-slate-400 italic">No disponible.</p>}
            </Card>
             <Card title="Experiencias pasadas (lo que ya ha probado)">
                {experiencias.length > 0 ? experiencias.map((exp: any, i: number) => (
                     <div key={i} className="p-3 bg-slate-50 rounded-lg border space-y-1.5">
                         <h4 className="font-bold text-slate-800">{exp.frustracion}</h4>
                         <p><strong className="text-slate-500">Probó:</strong> {exp.que_ha_probado_ya}</p>
                         <p><strong className="text-slate-500">No funcionó porque:</strong> {exp.por_que_no_funciono}</p>
                         <p><strong className="text-slate-500">Hoy se manifiesta:</strong> {exp.como_se_manifesta_hoy}</p>
                     </div>
                )) : <p className="text-slate-400 italic">No disponible.</p>}
            </Card>
        </Column>
    );
};

const BarriersColumn: React.FC<{ sections: MasterOutputsBySection, locFilter: LocFilter }> = ({ sections, locFilter }) => {
    
    const getLocMeta = (level: LocLevel) => {
        const niveles = sections.niveles_consciencia?.p7_niveles_consciencia ?? [];
        return niveles.find((n: any) => n.nivel === level);
    };

    const renderLocMeta = (level: LocLevel) => {
        const meta = getLocMeta(level);
        if (!meta) return null;
        return (
            <Card title={`Nivel ${level} – ${meta.etiqueta}`} subtitle="Preguntas y conversaciones">
                {meta.que_preguntas?.length > 0 && <div><h4 className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Preguntas</h4><ul className="list-disc list-inside text-slate-600">{meta.que_preguntas.map((q: string, i: number) => <li key={i}>{q}</li>)}</ul></div>}
                {meta.que_conversaciones?.length > 0 && <div className="mt-2"><h4 className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Conversaciones</h4><ul className="list-disc list-inside text-slate-600">{meta.que_conversaciones.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul></div>}
            </Card>
        );
    };

    const renderContent = () => {
        switch (locFilter) {
            case 1:
                const creencias1 = (sections.creencias_loc1_2?.creencias_limitantes || []).filter((c: any) => c.categoria === "Sobre sí mismos" || c.nivel_consciencia_schwartz === "Inconsciente");
                return <>
                    {renderLocMeta(1)}
                    <Card title="Creencias sobre sí mismo">{creencias1.map((c: any, i: number) => <p key={i} className="italic text-slate-700">"{c.creencia}"</p>)}</Card>
                </>;
            case 2:
                const creencias2 = (sections.creencias_loc1_2?.creencias_limitantes || []).filter((c: any) => c.nivel_consciencia_schwartz === "Consciente del problema");
                const experiencias = sections.experiencias_pasadas?.frustraciones_acumuladas?.slice(0, 5) || [];
                return <>
                    {renderLocMeta(2)}
                    <Card title="Creencias (problema sin solución)">{creencias2.map((c: any, i: number) => <p key={i} className="italic">"{c.creencia}"</p>)}</Card>
                    <Card title="Experiencias pasadas que alimentan cinismo">{experiencias.map((e: any, i: number) => <p key={i} className="font-medium">{e.frustracion}</p>)}</Card>
                </>;
            case 3:
                 const creencias3 = (sections.creencias_loc3_4?.creencias_limitantes || []).filter((c: any) => c.nivel_consciencia_schwartz === "Consciente de la solución");
                 const objeciones3 = (sections.objeciones_y_faqs?.objeciones_compra || []).filter((o: any) => ["Racional", "Logística"].includes(o.tipo_objecion));
                 return <>
                    {renderLocMeta(3)}
                    <Card title="Creencias sobre el método">{creencias3.map((c: any, i: number) => <p key={i} className="italic">"{c.creencia}"</p>)}</Card>
                    <Card title="Objeciones al método">{objeciones3.map((o: any, i: number) => <p key={i}>{o.objecion_o_duda}</p>)}</Card>
                 </>;
            case 4:
                const miedos4 = sections.miedos_ocultos?.miedos_no_racionales || [];
                const objeciones4 = sections.objeciones_y_faqs?.objeciones_compra || [];
                const creencias4 = (sections.creencias_loc3_4?.creencias_limitantes || []).filter((c: any) => c.nivel_consciencia_schwartz === "Consciente del producto");
                return <>
                    {renderLocMeta(4)}
                    <Card title="Miedos ocultos">{miedos4.map((m: any, i: number) => <p key={i}>{m.miedo_no_racional}</p>)}</Card>
                    <Card title="Objeciones de compra">{objeciones4.map((o: any, i: number) => <p key={i}>{o.objecion_o_duda}</p>)}</Card>
                    <Card title="Creencias sobre el producto">{creencias4.map((c: any, i: number) => <p key={i} className="italic">"{c.creencia}"</p>)}</Card>
                </>;
            case 5:
                const faqs5 = sections.objeciones_y_faqs?.dudas_frecuentes || [];
                const obstaculos5 = sections.obstaculos_logisticos?.obstaculos || [];
                 return <>
                    {renderLocMeta(5)}
                    <Card title="FAQs">{faqs5.map((f: any, i: number) => <p key={i}><strong>P:</strong> {f.duda_frecuente}</p>)}</Card>
                    <Card title="Obstáculos logísticos">{obstaculos5.map((o: any, i: number) => <p key={i}>{o.obstaculo_desafio_real}</p>)}</Card>
                 </>;
            case 'all':
                return <>
                    <Card title="Miedos ocultos">{sections.miedos_ocultos?.miedos_no_racionales?.map((m: any, i: number) => <p key={i}>{m.miedo_no_racional}</p>)}</Card>
                    <Card title="Creencias LoC 1-2">{sections.creencias_loc1_2?.creencias_limitantes?.map((c: any, i: number) => <p key={i} className="italic">"{c.creencia}" <span className="text-xs text-white bg-slate-400 px-1.5 py-0.5 rounded-full ml-1">{c.nivel_consciencia_schwartz}</span></p>)}</Card>
                    <Card title="Creencias LoC 3-4">{sections.creencias_loc3_4?.creencias_limitantes?.map((c: any, i: number) => <p key={i} className="italic">"{c.creencia}" <span className="text-xs text-white bg-slate-400 px-1.5 py-0.5 rounded-full ml-1">{c.nivel_consciencia_schwartz}</span></p>)}</Card>
                    <Card title="Objeciones de compra">{sections.objeciones_y_faqs?.objeciones_compra?.map((o: any, i: number) => <p key={i}>{o.objecion_o_duda} <span className="text-xs text-white bg-slate-400 px-1.5 py-0.5 rounded-full ml-1">{o.tipo_objecion}</span></p>)}</Card>
                    <Card title="FAQs">{sections.objeciones_y_faqs?.dudas_frecuentes?.map((f: any, i: number) => <p key={i}><strong>P:</strong> {f.duda_frecuente}</p>)}</Card>
                    <Card title="Obstáculos logísticos">{sections.obstaculos_logisticos?.obstaculos?.map((o: any, i: number) => <p key={i}>{o.obstaculo_desafio_real}</p>)}</Card>
                </>;
            default:
                return null;
        }
    };
    
    return (
        <Column icon={<ShieldExclamationIcon className="w-8 h-8 text-blue-500" />} title="BARRIERS (Por qué NO)">
            {renderContent()}
        </Column>
    );
};

export default AvatarMasterResultPage;
