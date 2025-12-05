import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StatusBadge } from './ProjectResultsPage';

// --- Types ---

type LevelBlock = {
  id: string;
  project_id: string;
  job_id: string;
  avatar_id: string;
  level: number;
  block: number;
  section: string;
  data: any;
  created_at: string;
};

type JobInfo = {
  name: string;
  status: any;
};

// --- Helper Components ---

const SubCard: React.FC<{ title: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`mt-4 rounded-lg border border-slate-200 bg-white ${className}`}>
        <h4 className="bg-slate-50 px-4 py-2 text-md font-semibold text-slate-700 border-b border-slate-200 rounded-t-lg">{title}</h4>
        <div className="p-4">{children}</div>
    </div>
);

const DataTable: React.FC<{ headers: string[], rows: (React.ReactNode)[][] }> = ({ headers, rows }) => (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
                <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3 text-left font-medium text-slate-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                    <tr key={i} className="align-top hover:bg-slate-50">
                        {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-800 whitespace-pre-line">{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const BulletList: React.FC<{ title: string; items: string[] | undefined }> = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mt-4">
            <h5 className="font-semibold text-slate-700">{title}</h5>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-600">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};


// --- Block-Specific Renderers ---

const GridCard: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-lg border border-slate-200 bg-white flex flex-col">
        <h4 className="bg-slate-50 px-4 py-2 text-md font-semibold text-slate-700 border-b border-slate-200 rounded-t-lg">{title}</h4>
        <div className="p-4 flex-grow">{children}</div>
    </div>
);

const Block7Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p7_1_radiografia_dolores')?.data;
    if (!data) return <p className="text-sm text-slate-500">Datos no disponibles.</p>;

    const labels: Record<string, string> = {
        evasiones: "Evasiones",
        frases_reales: "Frases reales",
        dolores_profundos: "Dolores profundos",
        sesgos_cognitivos: "Sesgos cognitivos",
        costes_oportunidad: "Costes de oportunidad",
        emociones_dominantes: "Emociones dominantes",
        dolores_identificados: "Dolores identificados"
    };

    const dataEntries = Object.entries(data).filter(([key, value]) => labels[key] && Array.isArray(value) && value.length > 0);

    if (dataEntries.length === 0) {
        return <p className="text-sm text-slate-500">No se encontraron datos para mostrar.</p>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-4">
            {dataEntries.map(([key, value]) => (
                <GridCard key={key} title={labels[key]}>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                        {(value as string[]).map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </GridCard>
            ))}
        </div>
    );
};

const Block8Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p8_momentos_decisivos')?.data;
    if (!Array.isArray(data) || data.length === 0) {
        return <p className="text-sm text-slate-500">No se encontraron momentos decisivos.</p>;
    }

    return (
        <DataTable
            headers={[
                "Momento",
                "Contexto",
                "Frase del cliente",
                "Micro-emoción",
                "Tipo de activación",
                "Mensaje de oportunidad"
            ]}
            rows={data.map((item: any) => [
                item.momento,
                item.contexto,
                item.frase_cliente,
                item.micro_emocion,
                item.tipo_activacion,
                item.oportunidad_mensaje
            ])}
        />
    );
};

const Block9Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const doloresData = sections.find(s => s.section === 'p9_dolores')?.data;
    const pensamientosData = sections.find(s => s.section === 'p9_2_pensamientos_internos')?.data;
    const escenasData = sections.find(s => s.section === 'p9_3_escenas')?.data;

    return (
        <div className="space-y-6">
            {doloresData && (
                <SubCard title="Dolores normalizados">
                    <DataTable
                        headers={["Dolor", "Estado", "Por qué es clave", "Cómo detectarlo", "Acción de marketing"]}
                        rows={(Array.isArray(doloresData.dolores) ? doloresData.dolores : []).map((d: any) => [d.dolor, d.estado, d.por_que_clave, d.como_detectarlo, d.accion_marketing])}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <BulletList title="Titulares sugeridos" items={doloresData.titulares} />
                        <BulletList title="Top dolores prioritarios" items={doloresData.top_dolores} />
                    </div>
                </SubCard>
            )}
            {pensamientosData && (
                 <SubCard title="Pensamientos internos por dolor">
                    <div className="space-y-4">
                        {Object.entries(pensamientosData.pensamientos_por_dolor || {}).map(([dolor, pensamientos]: [string, any]) => (
                             <SubCard key={dolor} title={<span className="font-normal"><span className="font-semibold">Dolor:</span> {dolor}</span>}>
                                <DataTable
                                    headers={["Emoción", "Pensamiento"]}
                                    rows={(Array.isArray(pensamientos) ? pensamientos : []).map((p: any) => [p.emocion, p.pensamiento])}
                                />
                            </SubCard>
                        ))}
                    </div>
                </SubCard>
            )}
            {escenasData && (
                <SubCard title="Escenas clave">
                    <div className="space-y-4">
                        {(Array.isArray(escenasData.escenas_clave) ? escenasData.escenas_clave : []).map((escena: any, index: number) => (
                             <SubCard key={index} title={<span className="font-normal"><span className="font-semibold">Dolor Identificado:</span> {escena.dolor_identificado}</span>}>
                                <DataTable
                                    headers={["Momento", "Lugar", "Acción", "Pensamiento", "Sensaciones", "Cierre"]}
                                    rows={(Array.isArray(escena.escenas) ? escena.escenas : []).map((e: any) => [e.momento, e.lugar, e.accion, e.pensamiento, e.sensaciones, e.cierre])}
                                />
                            </SubCard>
                        ))}
                    </div>
                </SubCard>
            )}
        </div>
    );
};

const Block10Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p10_comparación_interna_y_externa')?.data;
    if (!data) return null;
    return (
        <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Comparación interna y externa</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-lg text-slate-700 mb-2">Comparaciones externas</h3>
                    <DataTable
                        headers={["Frase del cliente", "Emoción", "Se compara con", "Uso en copy"]}
                        rows={(data.externas || []).map((item: any) => [item.frase, item.emocion, item.se_compara_con, item.uso_copy])}
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-slate-700 mb-2">Comparaciones internas</h3>
                    <DataTable
                        headers={["Frase del cliente", "Emoción", "Se compara con", "Uso en copy"]}
                        rows={(data.internas || []).map((item: any) => [item.frase, item.emocion, item.se_compara_con, item.uso_copy])}
                    />
                </div>
            </div>
        </div>
    );
};

const Block11Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p11_mapa_frustraciones_acumuladas')?.data;
    if (!data) return null;
    return (
         <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Mapa de frustraciones acumuladas</h2>
            <DataTable
                headers={["Tipo", "Emoción", "Frustración", "Por qué falla", "Qué ha probado", "Manifestación actual"]}
                rows={(data.frustraciones || []).map((f: any) => [f.tipo, f.emocion, f.frustracion, f.por_que_fallo, f.que_ha_probado, f.manifestacion_actual])}
            />
        </div>
    );
};

const Block12Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p12_creencias_limitantes')?.data;
    if (!data) return null;
    const [openCreencia, setOpenCreencia] = useState<string | null>(null);

    const DetailItem: React.FC<{label:string, value:string}> = ({label, value}) => (
        <div>
            <p className="text-xs font-semibold text-slate-600">{label}</p>
            <p className="text-sm text-slate-800">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {(data || []).map((category: any, catIndex: number) => (
                <SubCard key={catIndex} title={`Creencias limitantes – ${category.categoria}`}>
                    <div className="space-y-2">
                        {(category.creencias || []).map((creencia: any, creIndex: number) => {
                             const key = `${catIndex}-${creIndex}`;
                             const isOpen = openCreencia === key;
                            return (
                            <div key={key} className="border rounded-lg overflow-hidden">
                                <button onClick={() => setOpenCreencia(isOpen ? null : key)} className="w-full flex justify-between items-center p-3 text-left bg-slate-50 hover:bg-slate-100">
                                    <span className="flex-1 font-medium text-slate-800">{creencia.creencia}</span>
                                    <div className="flex items-center ml-4">
                                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full mr-2">Prioridad {creencia.prioridad}</span>
                                        <svg className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="p-4 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <DetailItem label="Por qué bloquea" value={creencia.por_que_bloquea} />
                                                <DetailItem label="Raíz psicológica" value={creencia.raiz_psicologica} />
                                                <DetailItem label="Sesgo cognitivo" value={creencia.sesgo_cognitivo} />
                                                <DetailItem label="Costes de oportunidad" value={creencia.costes_oportunidad} />
                                            </div>
                                            <div className="space-y-3">
                                                <DetailItem label="Consecuencias personales" value={creencia.consecuencias_personales} />
                                                <DetailItem label="Consecuencias profesionales" value={creencia.consecuencias_profesionales} />
                                                <DetailItem label="Etapa de funnel" value={creencia.etapa_funnel} />
                                                <DetailItem label="Idea de contenido" value={creencia.idea_contenido} />
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <BulletList title="Frases textuales" items={creencia.frases_textuales} />
                                            <BulletList title="Pensamientos internos" items={creencia.pensamientos_internos} />
                                            <BulletList title="Ángulos de copy" items={creencia.angulos_copy} />
                                        </div>
                                        {creencia.mini_estructura_copy && (
                                            <div className="p-3 bg-slate-50 border rounded-md">
                                                <h5 className="font-semibold text-slate-700 mb-2">Mini estructura de copy</h5>
                                                <div className="space-y-2 text-sm">
                                                    <p><strong className="text-slate-600">Hook:</strong> {creencia.mini_estructura_copy.hook}</p>
                                                    <p><strong className="text-slate-600">Insight:</strong> {creencia.mini_estructura_copy.insight}</p>
                                                    <p><strong className="text-slate-600">Prueba:</strong> {creencia.mini_estructura_copy.prueba}</p>
                                                    <p><strong className="text-slate-600">Cierre:</strong> {creencia.mini_estructura_copy.cierre}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                </SubCard>
            ))}
        </div>
    );
};

const Block13Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p13_faqs_objecciones')?.data;
    if (!data) return null;
    return (
        <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">FAQs y objeciones</h2>
            <DataTable
                headers={["Frase del cliente", "Elemento", "Tipo de objeción", "Nivel de consciencia", "Impacto si no resuelve"]}
                rows={(data.items || []).map((item: any) => [
                    <div><p>{item.frase_cliente}</p><p className="text-xs text-slate-500 mt-1">{item.objecion_o_duda}</p></div>,
                    item.tipo_elemento,
                    item.tipo_objecion,
                    item.nivel_consciencia,
                    item.impacto_si_no_resuelve,
                ])}
            />
        </div>
    );
};

const Block14Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p14_objeciones_creencias_limitantes')?.data;
    if (!data) return null;
    return (
         <SubCard title={
            <div className="flex justify-between items-center">
                <span>Objeciones profundas</span>
                {data.categoria && <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">{data.categoria}</span>}
            </div>
         }>
            <DataTable
                headers={["Tipo", "Objeción", "Frase del cliente", "Por qué es peligrosa", "Contraargumento / ángulo"]}
                rows={(data.items || []).map((item: any) => [item.tipo, item.objecion, item.frase_cliente, item.por_que_peligrosa, item.contraargumento_o_angulo])}
            />
        </SubCard>
    );
};

const Block15Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p15_miedos_bloquear_compra')?.data;
    if (!data) return null;
    return (
        <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Miedos que bloquean la compra</h2>
            <DataTable
                headers={["Nº", "Miedo no racional", "Nivel de impacto", "Emoción asociada", "Consecuencia si no se resuelve", "Frase interna", "Qué lo activa", "Por qué es difícil de confesar"]}
                rows={(data.items || []).map((item: any) => [
                    item["Nº"],
                    item["Miedo No Racional"],
                    item["Nivel de impacto"],
                    item["Emoción asociada"],
                    item["Consecuencia si no se resuelve"],
                    item["Frase que el cliente se diría en su mente"],
                    item["¿Qué lo activa? (Situación / estímulo)"],
                    item["¿Por qué este miedo es difícil de confesar?"],
                ])}
            />
        </div>
    );
};

const Block16Content: React.FC<{ sections: LevelBlock[] }> = ({ sections }) => {
    const data = sections.find(s => s.section === 'p16_coste_oportunidad')?.data;
    if (!data) return null;
    return (
         <SubCard title="Coste de oportunidad">
            {data.meta && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-4 p-2 bg-slate-50 rounded-md border">
                    <span><strong>Idioma:</strong> {data.meta.language}</span>
                    <span><strong>Avatar ID:</strong> {data.meta.avatar_id}</span>
                    <span><strong>Fecha:</strong> {new Date(data.meta.created_at).toLocaleString('es-ES')}</span>
                </div>
            )}
            <DataTable
                headers={["Nº", "Frase interna", "Tipo de coste", "Identidad bloqueada", "Consecuencia silenciosa", "Coste de oportunidad oculto"]}
                rows={(data.costes_oportunidad || []).map((item: any) => [
                    item["Nº"],
                    item.frase_interna,
                    item.tipo_de_coste,
                    item.identidad_bloqueada,
                    item.consecuencia_silenciosa,
                    item.coste_de_oportunidad_oculto,
                ])}
            />
        </SubCard>
    );
};

// --- Generic Fallback Renderer ---
function FallbackContent({ sections }: { sections: LevelBlock[] }) {
    return (
        <div className="space-y-4">
            {sections.map(s => (
                 <pre key={s.id} className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 overflow-x-auto">
                    <strong>{s.section}</strong>
                    <hr className="my-2"/>
                    {JSON.stringify(s.data, null, 2)}
                </pre>
            ))}
        </div>
    );
}

function renderBlockContent(blockNumber: number, sections: LevelBlock[]) {
    // This logic relies on having only one section type per block for blocks 7 & 8
    const mainSection = sections[0]?.section;

    switch (blockNumber) {
        case 7:
            if (mainSection === 'p7_1_radiografia_dolores') return <Block7Content sections={sections} />;
            return <FallbackContent sections={sections} />;
        case 8:
            if (mainSection === 'p8_momentos_decisivos') return <Block8Content sections={sections} />;
            return <FallbackContent sections={sections} />;
        case 9: return <Block9Content sections={sections} />;
        case 10: return <Block10Content sections={sections} />;
        case 11: return <Block11Content sections={sections} />;
        case 12: return <Block12Content sections={sections} />;
        case 13: return <Block13Content sections={sections} />;
        case 14: return <Block14Content sections={sections} />;
        case 15: return <Block15Content sections={sections} />;
        case 16: return <Block16Content sections={sections} />;
        default: return <FallbackContent sections={sections} />;
    }
}


// --- Accordion Components ---
const Accordion: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="space-y-3">{children}</div>;

const AccordionItem: React.FC<{ isOpen: boolean; onToggle: () => void; children: React.ReactNode; trigger: React.ReactNode; }> = ({ isOpen, onToggle, children, trigger }) => (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all overflow-hidden">
        <button onClick={onToggle} className="w-full flex justify-between items-center p-4 text-left" aria-expanded={isOpen}>
            {trigger}
            <svg className={`w-5 h-5 text-slate-500 transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
);


// --- Main Page Component ---

const LevelDetailPage: React.FC = () => {
    const { id: projectId, avatarId, level } = useParams<{ id: string, avatarId: string, level: string }>();
    const navigate = useNavigate();
    
    const [blocks, setBlocks] = useState<LevelBlock[]>([]);
    const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openBlocks, setOpenBlocks] = useState<number[]>([]);

    const toggleBlock = (blockNumber: number) => {
        setOpenBlocks(prev => prev.includes(blockNumber) ? prev.filter(b => b !== blockNumber) : [...prev, blockNumber]);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId || !avatarId || !level) {
                setError("Faltan parámetros en la URL.");
                return setIsLoading(false);
            }
            try {
                const { data: levelData, error: levelError } = await supabase
                    .from('avatar_level_outputs')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('avatar_id', avatarId)
                    .eq('level', level);

                if (levelError) throw levelError;
                setBlocks(levelData || []);

                if (levelData && levelData.length > 0) {
                    setOpenBlocks([levelData.sort((a,b) => a.block - b.block)[0].block]);
                    const firstJobId = levelData[0].job_id;
                    const { data: jobData, error: jobError } = await supabase
                        .from('analysis_jobs').select('status, payload').eq('id', firstJobId).single();
                    if (jobError) console.warn("Could not fetch job info:", jobError.message);
                    if (jobData) setJobInfo({ name: jobData.payload?.name || `Avatar`, status: jobData.status });
                } else {
                     const { data: avatarData } = await supabase
                        .from('avatars').select('etiqueta, profile').eq('id', avatarId).single();
                     if (avatarData) {
                         const profile = typeof avatarData.profile === 'string' ? JSON.parse(avatarData.profile) : avatarData.profile;
                         setJobInfo({ name: avatarData.etiqueta || profile?.name || 'Avatar', status: 'unknown' });
                     }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [projectId, avatarId, level]);

    const blocksByNumber = useMemo(() => {
        const grouped = new Map<number, LevelBlock[]>();
        blocks.forEach(block => {
            if (!grouped.has(block.block)) grouped.set(block.block, []);
            try {
                const parsedData = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
                grouped.get(block.block)!.push({ ...block, data: parsedData });
            } catch (e) {
                console.error(`Error parsing JSON for section ${block.section}`, e);
                // Push with raw data to allow fallback display
                grouped.get(block.block)!.push(block);
            }
        });
        return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
    }, [blocks]);

    if (isLoading) return <div className="p-8 text-center">Cargando detalles del nivel...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="bg-slate-50 min-h-full -m-6 p-6">
            <button onClick={() => navigate(-1)} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver al análisis
            </button>

            <div className="flex flex-col md:flex-row justify-between md:items-start mb-2 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Nivel de consciencia {level}</h2>
                    <p className="text-slate-500">{jobInfo?.name || 'Avatar'}</p>
                </div>
                {jobInfo?.status && <div className="flex-shrink-0 pt-1"><StatusBadge status={jobInfo.status} /></div>}
            </div>
            
             <div className="text-sm text-slate-600 mb-8 border-b border-slate-200 pb-4">
                Análisis del nivel {level} de consciencia para {jobInfo?.name}. Encontrados {blocks.length} secciones en {blocksByNumber.size} bloques.
            </div>

            {blocksByNumber.size > 0 ? (
                 <Accordion>
                    {[...blocksByNumber.entries()].map(([blockNumber, sections]) => (
                        <AccordionItem
                            key={blockNumber}
                            isOpen={openBlocks.includes(blockNumber)}
                            onToggle={() => toggleBlock(blockNumber)}
                            trigger={<span className="text-lg font-semibold text-slate-900">Bloque {blockNumber}</span>}
                        >
                           {renderBlockContent(blockNumber, sections)}
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                    <h3 className="text-xl font-semibold text-slate-700">Sin datos para este nivel</h3>
                    <p className="mt-2 text-slate-500">No se encontraron resultados de análisis para el nivel {level} de este avatar.</p>
                </div>
            )}
        </div>
    );
};

export default LevelDetailPage;