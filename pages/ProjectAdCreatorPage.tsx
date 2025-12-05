
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  MegaphoneIcon,
  PlusIcon,
  VideoCameraIcon,
  PhotoIcon,
  Squares2X2Icon,
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  FunnelIcon,
  UserCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  SwatchIcon,
  LightbulbIcon,
  ExclamationTriangleIcon
} from '../components/Icons';

// --- Types ---

interface AvatarSimple {
  id: string;
  name: string;
  tofu?: any;
  mofu?: any;
  bofu?: any;
}

interface NarrativeSimple {
  avatar_id: string;
  stack_persuasion: any;
}

interface AdFormState {
  avatarId: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU' | '';
  format: 'image' | 'video' | 'carousel' | '';
  angle: string;
  angleSource?: string;
  scriptType: string;
  videoDurationPreset: string; // '15', '30', '45', '60', '90', '120', 'custom'
  customVideoDuration: string;
  carouselSlides: number;
}

// Database Row Type
interface AdCreationRow {
  id: string;
  project_id: string;
  avatar_id: string;
  format: 'image' | 'video' | 'carousel';
  funnel_stage: string;
  script_type: string; // AIDA | PAS | 4Ps | FAB | Storytelling
  angle_source: string;
  angle: string;
  video_duration_seconds?: number;
  carousel_slides?: number;
  payload: {
    nombre_comercial?: string;
    nombre_interno?: string;
    tipo_oferta?: string;
    propuesta_valor_promesa?: string;
    [key: string]: any;
  };
  framework_narrativo: any;
  causa_justa: any; // string or json
  tono_de_voz: any;
  filtro_carl_jung: any;
  ideas_deslizar: any;
  profile_headline: string;
  script: any; // The structured script JSON
  status: string;
  created_at: string;
  
  // Frontend helpers
  avatarName?: string; 
}

// --- Helper Functions ---

const safeJsonParse = (input: any): any => {
    if (!input) return null;
    if (typeof input === 'object') return input;
    if (typeof input === 'string') {
        try {
            let cleaned = input.trim();
            // Handle Markdown code blocks often returned by LLMs (```json ... ```)
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
            }
            return JSON.parse(cleaned);
        } catch (e) {
            console.warn("JSON Parse warning:", e);
            return input;
        }
    }
    return input;
};

const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return null;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
};

// Robust helper to unwrap nested JSON responses often returned by LLMs
const unwrapScript = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    // If keys are like "guion", "script", "AIDA", etc., return the inner object
    const keys = Object.keys(data);
    if (keys.length === 1) {
        const key = keys[0].toLowerCase();
        // Check for common wrappers OR generic "guion_" prefix
        if (
            ['guion', 'script', 'anuncio', 'response', 'output', 'aida', 'pas', 'fab', '4ps', 'storytelling'].includes(key) || 
            key.startsWith('guion_') || 
            key.startsWith('script_')
        ) {
            return unwrapScript(data[keys[0]]);
        }
    }
    
    // Also check for specific property "estructura" often used in 4Ps or others
    if (data.estructura && typeof data.estructura === 'object') {
        return { ...data, ...data.estructura }; // Merge to keep other props but flatten structure
    }

    return data;
};

// Robust helper to find content using multiple possible keys
const resolveContent = (obj: any, keys: string[]): any => {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of keys) {
        if (obj[key] !== undefined) return obj[key];
        // Case insensitive check
        const lowerKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        if (lowerKey && obj[lowerKey] !== undefined) return obj[lowerKey];
    }
    return null;
};

// Helper to ensure we never pass objects to React children (Error #31)
const ensureString = (val: any) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ');
    if (typeof val === 'object') {
        // Prevent passing objects.
        return undefined; 
    }
    return String(val);
};

// Normalize a script block to standard format
const normalizeBlock = (block: any) => {
    if (!block) return null;
    if (typeof block === 'string') {
        return { mainText: block };
    }
    if (typeof block !== 'object') return { mainText: String(block) };
    
    // Handle nested scenes if present in the block object (common in Storytelling/FAB)
    const rawScenes = resolveContent(block, ['escenas', 'scenes', 'shots', 'pasos']);
    
    return {
        duration: ensureString(resolveContent(block, ['rango_tiempo', 'duracion', 'duracion_segundos', 'tiempo', 'duration', 'seconds'])),
        voiceText: ensureString(resolveContent(block, ['voz', 'voice', 'locucion', 'narrador', 'speaker', 'audio', 'voz_en_off'])),
        mainText: ensureString(resolveContent(block, ['resumen', 'summary', 'guion', 'texto', 'texto_principal', 'transcripcion', 'copy', 'contenido', 'script', 'dialogo', 'texto_guion'])),
        visualText: ensureString(resolveContent(block, ['visual', 'descripcion_visual', 'imagen', 'escena', 'video_description'])),
        visualList: resolveContent(block, ['elementos_visuales', 'puntos_visuales', 'visual_notes', 'visual_cues']), // Arrays valid here
        scenes: rawScenes, // Keep array intact for mapping
        notes: ensureString(resolveContent(block, ['notas_direccion', 'notas', 'notes', 'direccion'])),
        tone: ensureString(resolveContent(block, ['tono_aplicado', 'tono', 'tone']))
    };
};

// --- Components ---

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "bg-slate-100 text-slate-700" }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
        {children}
    </span>
);

// --- Script Renderers ---

const ScriptSectionBlock = ({ 
    title, 
    duration, 
    voiceText, 
    mainText, 
    visualText, 
    visualList,
    scenes,
    notes,
    tone,
    isCTA = false
}: { 
    title: string, 
    duration?: string | number, 
    voiceText?: string, 
    mainText?: string, 
    visualText?: string, 
    visualList?: string[],
    scenes?: any[],
    notes?: string,
    tone?: string,
    isCTA?: boolean
}) => (
    <div className={`p-5 rounded-xl border mb-4 last:mb-0 ${isCTA ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <h4 className={`font-bold uppercase tracking-wider text-xs ${isCTA ? 'text-indigo-700' : 'text-slate-500'}`}>{title}</h4>
            {duration && <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{duration}s</span>}
        </div>
        
        {voiceText && (
            <p className="text-xs text-slate-500 mb-2 italic font-medium">🗣️ {voiceText}</p>
        )}
        
        {mainText && (
            <div className={`text-sm leading-relaxed whitespace-pre-wrap mb-3 ${isCTA ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                {mainText}
            </div>
        )}

        {(visualText || (visualList && visualList.length > 0)) && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Visual</p>
                {visualText && <p className="text-xs text-slate-600">{visualText}</p>}
                {visualList && Array.isArray(visualList) && (
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                        {visualList.map((v, i) => <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>)}
                    </ul>
                )}
            </div>
        )}

        {(notes || tone) && (
             <div className="mt-3 pt-2 border-t border-slate-200/50 text-xs text-slate-500 flex flex-col gap-1">
                {notes && <span><strong>Dirección:</strong> {notes}</span>}
                {tone && <span><strong>Tono:</strong> {tone}</span>}
            </div>
        )}

        {/* Render nested scenes if available (for the new video format) */}
        {scenes && Array.isArray(scenes) && scenes.length > 0 && (
            <div className="mt-4 space-y-3">
                {scenes.map((scene: any, idx: number) => {
                    // Safe access to scene properties
                    const time = ensureString(scene.timestamp || scene.tiempo || scene.time || (scene.duracion_segundos ? `${scene.duracion_segundos}s` : ''));
                    const visual = ensureString(scene.descripcion_visual || scene.visual);
                    const audio = ensureString(scene.voz_en_off || scene.audio || scene.narracion);
                    const sceneNotes = ensureString(scene.notas_direccion || scene.notes || scene.notas);
                    const sceneTone = ensureString(scene.tono_aplicado || scene.tone);
                    
                    return (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-slate-700">Escena {idx + 1}</span>
                                {time && (
                                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-500 font-mono">
                                        {time}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {visual && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 min-w-[40px]">Visual</span>
                                        <span className="text-slate-600 leading-snug">{visual}</span>
                                    </div>
                                )}
                                {audio && (
                                    <div className="flex gap-2 items-start">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 min-w-[40px]">Audio</span>
                                        <span className="text-slate-800 italic leading-snug">"{audio}"</span>
                                    </div>
                                )}
                            </div>
                             {(sceneNotes || sceneTone) && (
                                <div className="mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500 flex flex-col gap-1">
                                    {sceneNotes && (
                                         <span><strong>Nota:</strong> {sceneNotes}</span>
                                    )}
                                    {sceneTone && (
                                         <span><strong>Tono:</strong> {sceneTone}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

// Generic Scene Viewer for Video Scripts (Handles flat arrays of scenes)
const ScriptViewerVideoScenes = ({ script }: { script: any }) => {
    // Try to find the array of scenes
    const scenes = resolveContent(script, ['escenas', 'scenes', 'steps', 'shots']);
    
    if (!scenes || !Array.isArray(scenes)) return null;

    return (
        <div className="space-y-4">
            {scenes.map((scene: any, idx: number) => {
                const num = scene.numero_escena || idx + 1;
                const type = scene.tipo || 'Escena';
                const duration = ensureString(scene.duracion_segundos || scene.duration);
                const visual = ensureString(scene.visual || scene.video_description || scene.descripcion_visual);
                const audio = ensureString(scene.voz_en_off || scene.audio || scene.voice_over);
                const sound = ensureString(scene.musica_sonido || scene.sound);
                const notes = ensureString(scene.notas_direccion || scene.notes);
                const tone = ensureString(scene.tono_aplicado || scene.tone);
                
                return (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">Escena {num}</span>
                                <Badge className="bg-white border-slate-200 text-xs">{type}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                {(scene.timestamp_inicio || scene.tiempo || scene.timestamp) && <span className="text-[10px] font-mono text-slate-400">{scene.timestamp_inicio || scene.tiempo || scene.timestamp}</span>}
                                {duration && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">{duration}s</Badge>}
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Audio Column */}
                                <div>
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Audio / Voz en off</h5>
                                    <p className="text-sm text-slate-800 italic leading-relaxed">"{audio || 'Sin audio'}"</p>
                                    {sound && (
                                        <div className="mt-2 flex items-start gap-1.5">
                                            <span className="text-xs">🎵</span>
                                            <span className="text-xs text-slate-500">{sound}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Visual Column */}
                                <div>
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Visual</h5>
                                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                        {visual || 'Sin descripción visual'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Notes/Tone */}
                            {(notes || tone) && (
                                <div className="pt-2 border-t border-slate-50 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    {notes && <span><strong className="text-slate-600">Dirección:</strong> {notes}</span>}
                                    {tone && <span><strong className="text-slate-600">Tono:</strong> {tone}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {script.microcopy_cta && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Call to Action (Microcopy)</span>
                    <p className="text-lg font-bold text-indigo-900">{ensureString(script.microcopy_cta)}</p>
                </div>
            )}
        </div>
    );
};

const ScriptViewerAIDA = ({ script }: { script: any }) => {
    if (!script) return null;
    
    if ((Array.isArray(script.escenas) || Array.isArray(script.scenes)) && !script.atencion && !script.attention) {
        return <ScriptViewerVideoScenes script={script} />;
    }

    const atencion = normalizeBlock(resolveContent(script, ['atencion', 'attention', 'atención', 'step_1']));
    const interes = normalizeBlock(resolveContent(script, ['interes', 'interest', 'interés', 'step_2']));
    const deseo = normalizeBlock(resolveContent(script, ['deseo', 'desire', 'step_3']));
    const accion = normalizeBlock(resolveContent(script, ['accion', 'action', 'acción', 'cta', 'cierre', 'step_4']));

    return (
        <div className="space-y-2">
            {atencion && <ScriptSectionBlock title="1. Atención" {...atencion} />}
            {interes && <ScriptSectionBlock title="2. Interés" {...interes} />}
            {deseo && <ScriptSectionBlock title="3. Deseo" {...deseo} />}
            {accion && <ScriptSectionBlock title="4. Acción" {...accion} isCTA />}
        </div>
    );
};

const ScriptViewerPAS = ({ script }: { script: any }) => {
    if (!script) return null;
    
    if ((Array.isArray(script.escenas) || Array.isArray(script.scenes)) && !script.problema) {
        return <ScriptViewerVideoScenes script={script} />;
    }

    const problema = normalizeBlock(resolveContent(script, ['seccion_1_problema', 'problema', 'problem', 'pain']));
    const agitacion = normalizeBlock(resolveContent(script, ['seccion_2_agitacion', 'agitacion', 'agitation', 'agitate']));
    const solucion = normalizeBlock(resolveContent(script, ['seccion_3_solucion', 'solucion', 'solution', 'solve']));
    const cierre = normalizeBlock(resolveContent(script, ['seccion_4_cierre', 'cierre', 'cta', 'call_to_action']));

    return (
        <div className="space-y-2">
            {problema && <ScriptSectionBlock title="Problema" {...problema} />}
            {agitacion && <ScriptSectionBlock title="Agitación" {...agitacion} />}
            {solucion && <ScriptSectionBlock title="Solución" {...solucion} />}
            {cierre && <ScriptSectionBlock title="Cierre / CTA" {...cierre} isCTA />}
        </div>
    );
};

const ScriptViewer4Ps = ({ script }: { script: any }) => {
    if (!script) return null;
    
    if ((Array.isArray(script.escenas) || Array.isArray(script.scenes)) && !script.PROMISE && !script.promise && !script.problema) {
        return <ScriptViewerVideoScenes script={script} />;
    }

    const title = ensureString(script.metadata?.titulo_interno || script.titulo);

    const promise = normalizeBlock(resolveContent(script, ['PROMISE', 'Promise', 'promesa', 'promise']));
    const picture = normalizeBlock(resolveContent(script, ['PICTURE', 'Picture', 'picture', 'imagen']));
    const proof = normalizeBlock(resolveContent(script, ['PROOF', 'Proof', 'proof', 'prueba']));
    const push = normalizeBlock(resolveContent(script, ['PUSH', 'Push', 'push', 'cta', 'propuesta']));
    
    return (
        <div className="space-y-2">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>}
            {promise && <ScriptSectionBlock title="1. Promise (Promesa)" {...promise} />}
            {picture && <ScriptSectionBlock title="2. Picture (Imagen)" {...picture} />}
            {proof && <ScriptSectionBlock title="3. Proof (Prueba)" {...proof} />}
            {push && <ScriptSectionBlock title="4. Push (Empuje)" {...push} isCTA />}
        </div>
    );
};

const ScriptViewerFAB = ({ script }: { script: any }) => {
    if (!script) return null;
    
    if ((Array.isArray(script.escenas) || Array.isArray(script.scenes)) && !script.FEATURE && !script.feature) {
        return <ScriptViewerVideoScenes script={script} />;
    }

    const title = ensureString(script.titulo || script.metadata?.titulo_interno || (script.metadata?.angulo_principal ? `Ángulo: ${script.metadata.angulo_principal}` : null));

    const features = normalizeBlock(resolveContent(script, ['FEATURE', 'feature', 'seccion_features', 'features', 'caracteristicas']));
    const advantages = normalizeBlock(resolveContent(script, ['ADVANTAGE', 'advantage', 'seccion_advantages', 'advantages', 'ventajas']));
    const benefits = normalizeBlock(resolveContent(script, ['BENEFIT', 'benefit', 'seccion_benefits', 'benefits', 'beneficios']));
    const cta = normalizeBlock(resolveContent(script, ['CTA', 'cta', 'seccion_cta', 'call_to_action', 'cierre']));

    return (
        <div className="space-y-2">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>}
            {features && <ScriptSectionBlock title="Feature (Característica)" {...features} />}
            {advantages && <ScriptSectionBlock title="Advantage (Ventaja)" {...advantages} />}
            {benefits && <ScriptSectionBlock title="Benefit (Beneficio)" {...benefits} />}
            {cta && <ScriptSectionBlock title="Call to Action" {...cta} isCTA />}
        </div>
    );
};

const ScriptViewerStorytelling = ({ script }: { script: any }) => {
    if (!script) return null;
    
    const title = ensureString(script.titulo || script.metadata?.titulo_interno || (script.metadata?.angulo_principal ? `Ángulo: ${script.metadata.angulo_principal}` : null));

    const personaje = normalizeBlock(resolveContent(script, ['personaje', 'contexto_emocional', 'contexto', 'context', 'hook', 'gancho']));
    const conflicto = normalizeBlock(resolveContent(script, ['conflicto', 'conflict', 'problema', 'pain']));
    const transformacion = normalizeBlock(resolveContent(script, ['transformacion', 'punto_inflexion', 'climax', 'inflexion', 'solucion', 'resultado', 'result', 'resolucion', 'beneficio']));
    const cta = normalizeBlock(resolveContent(script, ['cta', 'call_to_action', 'cierre', 'accion']));
    
    return (
        <div className="space-y-2">
            {title && <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>}
            {personaje && <ScriptSectionBlock title="Personaje / Contexto" {...personaje} />}
            {conflicto && <ScriptSectionBlock title="Conflicto" {...conflicto} />}
            {transformacion && <ScriptSectionBlock title="Transformación" {...transformacion} />}
            {cta && <ScriptSectionBlock title="Call to Action" {...cta} isCTA />}
        </div>
    );
};

const ScriptViewerCarousel = ({ script }: { script: any }) => {
    if (!script) return null;
    
    const strategy = script.estrategia_carrusel || {};
    const slides = Array.isArray(script.slides) ? script.slides : [];

    return (
        <div className="space-y-6">
            {/* Strategy Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 uppercase mb-2">Estrategia del Carrusel</h4>
                {strategy.titulo_interno && (
                    <div className="mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Título Interno:</span>
                        <p className="text-slate-700 text-sm">{ensureString(strategy.titulo_interno)}</p>
                    </div>
                )}
                {strategy.hook_principal_razonamiento && (
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Razonamiento del Hook:</span>
                        <p className="text-slate-600 text-sm italic">"{ensureString(strategy.hook_principal_razonamiento)}"</p>
                    </div>
                )}
            </div>

            {/* Slides */}
            <div className="space-y-4">
                {slides.map((slide: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700 text-sm">Slide {slide.numero_slide || idx + 1}</span>
                            {slide.rol_slide && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">{ensureString(slide.rol_slide)}</Badge>}
                        </div>
                        <div className="p-4 space-y-4">
                            
                            {/* Visual */}
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <PhotoIcon className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Prompt Visual</h5>
                                    <p className="text-sm text-slate-700 leading-relaxed">{ensureString(slide.prompt_visual)}</p>
                                </div>
                            </div>

                            {/* Overlay Text */}
                            {slide.texto_grande_overlay && (
                                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-1">Texto en Imagen (Overlay)</h5>
                                    <p className="text-sm font-bold text-slate-800">"{ensureString(slide.texto_grande_overlay)}"</p>
                                </div>
                            )}

                            {/* Purpose */}
                            {slide.proposito_psicologico && (
                                <div>
                                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-1">Propósito Psicológico</h5>
                                    <p className="text-xs text-slate-500">{ensureString(slide.proposito_psicologico)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ScriptViewerImage = ({ script }: { script: any }) => {
    if (!script) return null;
    
    // Structure: { "conceptos": [ ... ] }
    const concepts = Array.isArray(script.conceptos) ? script.conceptos : [];

    if (concepts.length === 0) return <div className="text-slate-500 italic">No se encontraron conceptos visuales.</div>;

    return (
        <div className="space-y-8">
            {concepts.map((concept: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                        <h4 className="font-bold text-slate-800 text-base">
                            Concepto {idx + 1}: {ensureString(concept.framework || 'Sin título')}
                        </h4>
                    </div>
                    <div className="p-5 space-y-5">
                        
                        {/* Visual Description */}
                        <div>
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <PhotoIcon className="w-4 h-4" /> Descripción Visual
                            </h5>
                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {ensureString(concept.prompt_visual)}
                            </p>
                        </div>

                        {/* Text on Image */}
                        {concept.texto_en_imagen && (
                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                    Texto en Imagen
                                </h5>
                                <div className="text-sm font-bold text-indigo-900 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    "{ensureString(concept.texto_en_imagen)}"
                                </div>
                            </div>
                        )}

                        {/* Caption / Copy */}
                        {concept.caption_copy && (
                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4" /> Propuesta de Copy (Caption)
                                </h5>
                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-slate-200">
                                    {ensureString(concept.caption_copy)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ScriptRenderer = ({ type, format, script }: { type: string, format: string, script: any }) => {
    const rawParsed = safeJsonParse(script);
    const parsedScript = unwrapScript(rawParsed);
    
    if (!parsedScript) return <div className="text-slate-400 italic p-4">Guion no disponible.</div>;

    // Direct match for formats
    if (format === 'carousel') return <ScriptViewerCarousel script={parsedScript} />;
    if (format === 'image') return <ScriptViewerImage script={parsedScript} />;

    // For video, we first check if it has the "escenas" array structure typical of flat video scripts
    // OR if it's the new nested structure which will be handled by the specific viewers
    if ((Array.isArray(parsedScript.escenas) || Array.isArray(parsedScript.scenes)) && !parsedScript.problema && !parsedScript.atencion && !parsedScript.features && !parsedScript.PROMISE && !parsedScript.promise && !parsedScript.FEATURE && !parsedScript.contexto && !parsedScript.personaje && !parsedScript.metadata) {
        return <ScriptViewerVideoScenes script={parsedScript} />;
    }

    // Fallback to framework-specific viewers which now support nested scenes
    const t = (type || '').toUpperCase();
    if (t === 'AIDA') return <ScriptViewerAIDA script={parsedScript} />;
    if (t === 'PAS') return <ScriptViewerPAS script={parsedScript} />;
    if (t === '4PS' || t === '4Ps') return <ScriptViewer4Ps script={parsedScript} />;
    if (t === 'FAB') return <ScriptViewerFAB script={parsedScript} />;
    if (t.includes('STORY')) return <ScriptViewerStorytelling script={parsedScript} />;

    // Generic fallback
    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto max-h-[500px]">
            <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                {JSON.stringify(parsedScript, null, 2)}
            </pre>
        </div>
    );
};

// --- Modal ---

const AdDetailModal = ({ ad, onClose }: { ad: AdCreationRow | null, onClose: () => void }) => {

    // Lock body scroll
    useEffect(() => {
        if (ad) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [ad]);

    if (!ad) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-slide-in-right"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 bg-white flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                {ad.payload?.nombre_comercial || 'Anuncio Generado'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {ad.payload?.nombre_interno || ad.payload?.tipo_oferta || 'Sin nombre interno'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 capitalize">
                            {ad.format === 'video' ? <VideoCameraIcon className="w-3 h-3 mr-1"/> : <PhotoIcon className="w-3 h-3 mr-1"/>}
                            {ad.format}
                        </Badge>
                        <Badge className="bg-purple-50 text-purple-700 border-purple-100">{ad.script_type}</Badge>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100">{ad.funnel_stage}</Badge>
                        {ad.video_duration_seconds && <Badge className="bg-slate-100 text-slate-600">{formatDuration(ad.video_duration_seconds)}</Badge>}
                        {ad.angle_source && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">{ad.angle_source}</Badge>}
                    </div>

                    {ad.angle && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Ángulo</p>
                            <p className="text-sm text-slate-700 italic">"{ad.angle}"</p>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-white custom-scrollbar">
                    <div className="animate-fade-in">
                        <ScriptRenderer type={ad.script_type} format={ad.format} script={ad.script} />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                    <span className="text-xs text-slate-400">
                        Generado el {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Custom Delete Modal ---

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    dontAskAgain, 
    setDontAskAgain 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
    dontAskAgain: boolean;
    setDontAskAgain: (val: boolean) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar anuncio?</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Esta acción no se puede deshacer. El anuncio se borrará permanentemente.
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                    <input 
                        type="checkbox" 
                        id="dontAsk"
                        checked={dontAskAgain}
                        onChange={(e) => setDontAskAgain(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="dontAsk" className="text-sm text-slate-600 cursor-pointer select-none">No volver a preguntar</label>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- AdCard Component (Updated) ---

interface AdCardProps {
  ad: AdCreationRow;
  onDelete: (id: string) => void;
  onClick: (ad: AdCreationRow) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, onDelete, onClick }) => {
    let displayTitle = 'Anuncio Generado';

    if (ad.format === 'image') {
        displayTitle = 'Anuncio Imagen';
    } else if (ad.format === 'carousel') {
        displayTitle = 'Anuncio Carrusel';
    } else if (ad.format === 'video') {
        const type = (ad.script_type && ad.script_type !== 'NULL') ? ad.script_type : 'Video';
        displayTitle = `Anuncio ${type}`;
    }

    return (
      <div 
        onClick={() => onClick(ad)}
        className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
      >
          <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      ad.funnel_stage === 'TOFU' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      ad.funnel_stage === 'MOFU' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-orange-50 text-orange-700 border-orange-100'
                  }`}>
                      <FunnelIcon className="w-3 h-3" />
                      {ad.funnel_stage}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                      {ad.format === 'video' ? <VideoCameraIcon className="w-4 h-4" /> : 
                       ad.format === 'carousel' ? <Squares2X2Icon className="w-4 h-4" /> : 
                       <PhotoIcon className="w-4 h-4" />}
                  </div>
              </div>
              
              <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {displayTitle}
              </h3>
              <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                  <UserCircleIcon className="w-3 h-3" /> {ad.avatarName || 'Avatar'}
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ángulo</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{ad.angle || 'Sin ángulo definido'}</p>
              </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                  <span className="text-xs text-slate-400 font-medium">Ver detalle</span>
              </div>
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(ad.id); }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1" 
                    title="Eliminar"
                  >
                      <TrashIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
      </div>
    );
};

// --- Main Page Component ---

const ProjectAdCreatorPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();

  // Data State
  const [avatars, setAvatars] = useState<AvatarSimple[]>([]);
  const [narratives, setNarratives] = useState<NarrativeSimple[]>([]);
  const [generatedAds, setGeneratedAds] = useState<AdCreationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdCreationRow | null>(null);

  // Delete Logic State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [dontAskDeleteConfirmation, setDontAskDeleteConfirmation] = useState(false);

  // Form State
  const [formData, setFormData] = useState<AdFormState>({
    avatarId: '',
    funnelStage: '',
    format: '',
    angle: '',
    angleSource: '',
    scriptType: '',
    videoDurationPreset: '30',
    customVideoDuration: '',
    carouselSlides: 5,
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      try {
        // 1. Fetch Avatars
        const { data: avatarsData } = await supabase
          .from('avatars')
          .select('id, etiqueta, profile, tofu, mofu, bofu')
          .eq('project_id', projectId)
          .order('slot');
        
        const mappedAvatars = (avatarsData || []).map(a => {
            let name = a.etiqueta;
            if (!name && a.profile) {
                try {
                    const p = typeof a.profile === 'string' ? JSON.parse(a.profile) : a.profile;
                    name = p.name;
                } catch {}
            }
            return { 
                id: a.id, 
                name: name || `Avatar ${a.id.substring(0, 4)}`,
                tofu: a.tofu,
                mofu: a.mofu,
                bofu: a.bofu
            };
        });
        setAvatars(mappedAvatars);

        // 2. Fetch Narratives (for Persuasion Stack)
        const { data: narrativesData } = await supabase
          .from('narratives')
          .select('avatar_id, stack_persuasion')
          .eq('project_id', projectId);

        setNarratives(narrativesData || []);

        // 3. Fetch Existing Ads
        const { data: adsData, error: adsError } = await supabase
            .from('ads_creation')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (adsError) throw adsError;

        // Enrich ads with avatar names
        const enrichedAds = (adsData || []).map(ad => ({
            ...ad,
            avatarName: mappedAvatars.find(av => av.id === ad.avatar_id)?.name || 'Avatar'
        }));

        setGeneratedAds(enrichedAds);

      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Derived State: Persuasion Angles
  const availableAngles = useMemo(() => {
    if (!formData.avatarId) return {};

    // 1. Try to get angles from specific Avatar funnel columns (TOFU/MOFU/BOFU)
    if (formData.funnelStage) {
        const avatar = avatars.find(a => a.id === formData.avatarId);
        if (avatar) {
             const stageKey = formData.funnelStage.toLowerCase() as 'tofu' | 'mofu' | 'bofu';
             let content = avatar[stageKey];

             if (content) {
                 // Ensure we have an object structure for the select optgroups
                 if (typeof content === 'string') {
                     try { content = JSON.parse(content); } catch { content = [content]; }
                 }
                 
                 if (Array.isArray(content)) {
                     // If it's a flat list, wrap it in a generic category
                     return { [`Estrategia ${formData.funnelStage}`]: content };
                 } else if (typeof content === 'object') {
                     // If it's already categorized
                     return content;
                 }
             }
        }
    }
    
    // 2. Fallback to general Narrative Persuasion Stack
    const narrative = narratives.find(n => n.avatar_id === formData.avatarId);
    if (!narrative || !narrative.stack_persuasion) return {};

    let stack = narrative.stack_persuasion;
    if (typeof stack === 'string') {
        try { stack = JSON.parse(stack); } catch { return {}; }
    }
    if (stack.STACK_PERSUASION) stack = stack.STACK_PERSUASION;
    else if (stack.stack_persuasion) stack = stack.stack_persuasion;

    return stack;
  }, [formData.avatarId, formData.funnelStage, avatars, narratives]);

  // Handlers
  const handleGenerate = async () => {
    if (!formData.avatarId || !formData.funnelStage || !formData.format || !formData.angle) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
    }
    if (formData.format === 'video' && !formData.scriptType) {
        alert("Selecciona un tipo de guion para el vídeo.");
        return;
    }
    
    let videoDurationSeconds = null;
    if (formData.format === 'video') {
        if (formData.videoDurationPreset === 'custom') {
            if (!formData.customVideoDuration) {
                alert("Por favor introduce una duración personalizada en segundos.");
                return;
            }
            videoDurationSeconds = parseInt(formData.customVideoDuration);
        } else {
            videoDurationSeconds = parseInt(formData.videoDurationPreset);
        }
    }

    let carouselSlides = null;
    if (formData.format === 'carousel') {
        carouselSlides = formData.carouselSlides;
    }

    setIsGenerating(true);
    try {
        // Fix: Clean angle source if it comes from the dynamic funnel columns to avoid backend workflow errors
        let safeAngleSource = formData.angleSource || null;
        if (safeAngleSource && safeAngleSource.startsWith('Estrategia ')) {
             safeAngleSource = null; 
        }

        const payload = {
            project_id: projectId,
            avatar_id: formData.avatarId,
            funnel_stage: formData.funnelStage,
            format: formData.format,
            script_type: formData.scriptType,
            angle: formData.angle,
            angle_idea: formData.angle,
            angle_source: safeAngleSource,
            video_duration_seconds: videoDurationSeconds,
            carousel_slides: carouselSlides
        };

        const response = await fetch('https://sswebhook.made-to-scale.com/webhook/creacion-anuncios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor: ${errorText || response.statusText}`);
        }

        // Refetch to get the exact DB record created
        const { data: newAdsData, error: newAdsError } = await supabase
            .from('ads_creation')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (newAdsError) throw newAdsError;
        
        const enriched = (newAdsData || []).map(ad => ({
            ...ad,
            avatarName: avatars.find(av => av.id === ad.avatar_id)?.name || 'Avatar'
        }));
        
        setGeneratedAds(enriched);
        setIsFormOpen(false); 
        setFormData({ 
            ...formData, 
            angle: '', 
            angleSource: '', 
            scriptType: '',
            customVideoDuration: '',
            videoDurationPreset: '30',
            carouselSlides: 5
        });

    } catch (err: any) {
        console.error(err);
        alert(`Hubo un error al generar el anuncio: ${err.message}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
      const skipConfirm = localStorage.getItem('skipDeleteConfirm') === 'true';
      if (skipConfirm) {
          performDelete(id);
      } else {
          setAdToDelete(id);
          setIsDeleteModalOpen(true);
      }
  };

  const performDelete = async (id: string) => {
      try {
          const { error } = await supabase.from('ads_creation').delete().eq('id', id);
          if (error) throw error;
          setGeneratedAds(prev => prev.filter(ad => ad.id !== id));
      } catch(e) {
          console.error("Error deleting ad:", e);
          alert("No se pudo eliminar el anuncio.");
      }
  };

  const handleConfirmDelete = () => {
      if (!adToDelete) return;
      
      if (dontAskDeleteConfirmation) {
          localStorage.setItem('skipDeleteConfirm', 'true');
      }
      
      performDelete(adToDelete);
      setIsDeleteModalOpen(false);
      setAdToDelete(null);
  };

  // --- Render Helpers ---

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm text-center animate-fade-in">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
            <MegaphoneIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Crea tu primer anuncio</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
            Genera guiones de vídeo, copies persuasivos e ideas creativas optimizadas para Meta Ads basadas en tus avatares.
        </p>
        <button 
            onClick={() => setIsFormOpen(true)}
            className="px-8 py-3 bg-mts-green text-mts-navy font-bold rounded-lg hover:bg-green-400 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
        >
            <PlusIcon className="w-5 h-5" />
            Crear Anuncio
        </button>
    </div>
  );

  // --- Main Render ---

  if (isLoading) {
      return (
          <div className="min-h-[60vh] flex items-center justify-center">
              <LoadingSpinner />
          </div>
      );
  }

  return (
    <div className="pb-20 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Creador de Anuncios</h2>
            <p className="text-slate-600 mt-2">
              Transforma tu estrategia en creatividades listas para lanzar.
            </p>
          </div>
          {generatedAds.length > 0 && !isFormOpen && (
              <button 
                  onClick={() => setIsFormOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
              >
                  <PlusIcon className="w-4 h-4" />
                  Crear Nuevo
              </button>
          )}
      </div>

      {/* 1. CREATION FORM (Expandable) */}
      {isFormOpen && (
          <div className="mb-12 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-fade-in-down">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-mts-green" />
                      Configura tu nuevo anuncio
                  </h3>
                  <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <XCircleIcon className="w-6 h-6" />
                  </button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                  
                  {/* Step 1: Avatar */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">1. ¿A quién nos dirigimos?</label>
                      <div className="flex flex-wrap gap-2">
                          {avatars.map(avatar => (
                              <button
                                  key={avatar.id}
                                  onClick={() => setFormData({ ...formData, avatarId: avatar.id, angle: '', angleSource: '' })}
                                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                      formData.avatarId === avatar.id 
                                      ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                  {avatar.name}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Step 2: Funnel Level */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">2. Nivel del Funnel</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                          {[
                              { id: 'TOFU', label: 'TOFU (Top)', desc: 'Consciencia / Atracción' },
                              { id: 'MOFU', label: 'MOFU (Middle)', desc: 'Consideración / Educación' },
                              { id: 'BOFU', label: 'BOFU (Bottom)', desc: 'Conversión / Venta' }
                          ].map(level => (
                              <button
                                  key={level.id}
                                  onClick={() => setFormData({ ...formData, funnelStage: level.id as any })}
                                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                                      formData.funnelStage === level.id 
                                      ? 'bg-slate-800 border-slate-800 shadow-md transform scale-[1.02]' 
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                  <span className={`font-bold ${formData.funnelStage === level.id ? 'text-white' : 'text-slate-800'}`}>
                                      {level.label}
                                  </span>
                                  <span className={`text-xs mt-1 ${formData.funnelStage === level.id ? 'text-slate-300' : 'text-slate-500'}`}>{level.desc}</span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Step 3: Format */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">3. Formato del anuncio</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                          {[
                              { id: 'image', label: 'Imagen Única', icon: <PhotoIcon className="w-5 h-5"/> },
                              { id: 'video', label: 'Vídeo / Reel', icon: <VideoCameraIcon className="w-5 h-5"/> },
                              { id: 'carousel', label: 'Carrusel', icon: <Squares2X2Icon className="w-5 h-5"/> },
                          ].map(fmt => (
                              <button
                                  key={fmt.id}
                                  onClick={() => setFormData({ ...formData, format: fmt.id as any, scriptType: '' })}
                                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border font-medium transition-all ${
                                      formData.format === fmt.id 
                                      ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                  {fmt.icon}
                                  {fmt.label}
                              </button>
                          ))}
                      </div>
                      
                      {formData.format === 'video' && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-2xl animate-fade-in">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Duración del vídeo</label>
                           <div className="flex flex-wrap gap-2">
                              {['15', '30', '45', '60', '90', '120'].map(sec => (
                                <button 
                                  key={sec}
                                  onClick={() => setFormData({...formData, videoDurationPreset: sec})}
                                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                                    formData.videoDurationPreset === sec 
                                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm ring-1 ring-slate-800' 
                                      : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'
                                  }`}
                                >
                                  {sec}s
                                </button>
                              ))}
                              <button 
                                onClick={() => setFormData({...formData, videoDurationPreset: 'custom'})}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                                  formData.videoDurationPreset === 'custom' 
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm ring-1 ring-slate-800' 
                                    : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'
                                }`}
                              >
                                Personalizado
                              </button>
                           </div>
                           {formData.videoDurationPreset === 'custom' && (
                              <div className="mt-3">
                                <div className="relative max-w-[150px]">
                                  <input 
                                    type="number" 
                                    min="1"
                                    placeholder="Segundos" 
                                    value={formData.customVideoDuration}
                                    onChange={(e) => setFormData({...formData, customVideoDuration: e.target.value})}
                                    className="block w-full pl-3 pr-8 py-2 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                  <span className="absolute right-3 top-2 text-slate-400 text-sm">seg</span>
                                </div>
                              </div>
                           )}
                        </div>
                      )}

                      {formData.format === 'carousel' && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 max-w-2xl animate-fade-in">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Número de slides</label>
                          <div className="flex flex-wrap gap-2">
                             {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                               <button 
                                 key={num}
                                 onClick={() => setFormData({...formData, carouselSlides: num})}
                                 className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded-md border transition-colors ${
                                    formData.carouselSlides === num 
                                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm ring-1 ring-slate-800' 
                                      : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'
                                  }`}
                               >
                                 {num}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Step 4: Angle */}
                  <div className={`transition-opacity duration-300 ${!formData.avatarId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                          4. Ángulo Psicológico {formData.avatarId && <span className="font-normal text-slate-500 ml-1">(del Stack de Persuasión)</span>}
                      </label>
                      
                      {!formData.avatarId ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400">Selecciona un avatar primero para ver sus ángulos.</div>
                      ) : (
                          <div className="relative max-w-2xl">
                              <select
                                  value={formData.angle}
                                  onChange={(e) => {
                                      const val = e.target.value;
                                      let src = '';
                                      for (const [cat, items] of Object.entries(availableAngles)) {
                                          if (Array.isArray(items) && items.includes(val)) {
                                              src = cat;
                                              break;
                                          }
                                      }
                                      setFormData({ ...formData, angle: val, angleSource: src });
                                  }}
                                  className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 shadow-sm"
                              >
                                  <option value="">Selecciona un ángulo de ataque...</option>
                                  {Object.entries(availableAngles).map(([category, items]: [string, any]) => {
                                      if (!Array.isArray(items) || items.length === 0) return null;
                                      return (
                                          <optgroup key={category} label={category}>
                                              {items.map((item: string, idx: number) => (
                                                  <option key={`${category}-${idx}`} value={item}>{item}</option>
                                              ))}
                                          </optgroup>
                                      );
                                  })}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                  <ChevronDownIcon className="w-4 h-4" />
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Step 5: Script Type */}
                  {formData.format === 'video' && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-bold text-slate-700 mb-3">5. Estructura del Guion</label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {['AIDA', 'PAS', '4Ps', 'FAB', 'Storytelling'].map(type => (
                                  <button
                                      key={type}
                                      onClick={() => setFormData({ ...formData, scriptType: type })}
                                      className={`px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
                                          formData.scriptType === type 
                                          ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                      }`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* Action */}
                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="px-8 py-3 bg-mts-green text-mts-navy font-bold rounded-xl hover:bg-green-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                      >
                          {isGenerating ? (
                              <>
                                  <LoadingSpinner />
                                  Generando magia...
                              </>
                          ) : (
                              <>
                                  Generar Anuncio
                                  <SparklesIcon className="w-5 h-5" />
                              </>
                          )}
                      </button>
                  </div>

              </div>
          </div>
      )}

      {/* 2. STATES */}
      {generatedAds.length === 0 ? (
          <EmptyState />
      ) : (
          <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Resultados Generados</h3>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{generatedAds.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedAds.map(ad => (
                      <AdCard 
                        key={ad.id} 
                        ad={ad} 
                        onDelete={handleDeleteClick} 
                        onClick={(ad) => setSelectedAd(ad)}
                      />
                  ))}
              </div>
          </div>
      )}

      {/* DETAIL MODAL */}
      <AdDetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />

      {/* DELETE MODAL */}
      <DeleteConfirmationModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => { setIsDeleteModalOpen(false); setAdToDelete(null); }}
          onConfirm={handleConfirmDelete}
          dontAskAgain={dontAskDeleteConfirmation}
          setDontAskAgain={setDontAskDeleteConfirmation}
      />

    </div>
  );
};

export default ProjectAdCreatorPage;
