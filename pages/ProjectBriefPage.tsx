
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import MissingFieldsModal from '../components/MissingFieldsModal';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from '../components/Icons';

// --- Types and Helpers ---

type BriefPayload = {
  nombre_comercial: string;
  nombre_interno: string;
  mision_empresa: string;
  vision_empresa: string;
  tipo_oferta: 'producto' | 'servicio' | 'infoproducto' | 'saas' | '';
  sector: string;
  propuesta_valor_promesa: string;
  url_producto?: string;
  segmento_cliente_objetivo: string;
  problema_principal_resuelve: string;
  personas_experimentan_problema: string;
  transformacion_deseada: string;
  pais_objetivo: string;
  precio_aprox: string;
  objetivo_proyecto: string;
  tema_clave: string;
  competidores_relevantes: string[];
  referentes_inspiracion: string[];
  tiene_limites_comunicacion: 'si' | 'no' | '';
  detalles_limites_comunicacion: string;
};

const initialFormData: BriefPayload = {
  nombre_comercial: '',
  nombre_interno: '',
  mision_empresa: '',
  vision_empresa: '',
  tipo_oferta: '',
  sector: '',
  propuesta_valor_promesa: '',
  url_producto: '',
  segmento_cliente_objetivo: '',
  problema_principal_resuelve: '',
  personas_experimentan_problema: '',
  transformacion_deseada: '',
  pais_objetivo: '',
  precio_aprox: '',
  objetivo_proyecto: '',
  tema_clave: '',
  competidores_relevantes: [],
  referentes_inspiracion: [],
  tiene_limites_comunicacion: '',
  detalles_limites_comunicacion: '',
};

function validateBriefPayload(p: BriefPayload): { ok: boolean; missing: string[] } {
  const required: (keyof BriefPayload)[] = [
    'nombre_comercial',
    'nombre_interno',
    'mision_empresa',
    'vision_empresa',
    'tipo_oferta',
    'sector',
    'propuesta_valor_promesa',
    'segmento_cliente_objetivo',
    'problema_principal_resuelve',
    'personas_experimentan_problema',
    'transformacion_deseada',
    'pais_objetivo',
    'precio_aprox',
    'objetivo_proyecto',
    'tema_clave',
    'tiene_limites_comunicacion'
  ];

  const missing = required.filter(k => {
    const v = p[k];
    if (v === undefined || v === null || v === '') return true;
    if (Array.isArray(v) && v.length === 0 && k !== 'competidores_relevantes' && k !== 'referentes_inspiracion') return true; // Arrays optional unless specified
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
  });

  // Validación condicional para límites
  if (p.tiene_limites_comunicacion === 'si' && !p.detalles_limites_comunicacion.trim()) {
      missing.push('detalles_limites_comunicacion');
  }

  if (p.url_producto) {
    try {
      new URL(p.url_producto);
    } catch (_) {
      if (!missing.includes('url_producto')) {
        missing.push('url_producto');
      }
    }
  }

  return { ok: missing.length === 0, missing };
}

// --- Component Constants ---

const BRIEF_FIELDS = [
    { id: 'nombre_comercial', label: 'Nombre comercial', helper: 'El nombre con el que se conoce tu marca o empresa.', type: 'text', required: true },
    { id: 'nombre_interno', label: 'Nombre del producto/servicio (interno)', helper: 'El nombre específico de lo que vendes.', type: 'text', required: true },
    { id: 'mision_empresa', label: 'Misión de la empresa', helper: '¿Cuál es la razón de ser de tu negocio? ¿Por qué existe?', type: 'textarea', required: true },
    { id: 'vision_empresa', label: 'Visión de la empresa', helper: '¿A dónde queréis llegar? ¿Cuál es la aspiración futura?', type: 'textarea', required: true },
    { id: 'tipo_oferta', label: 'Tipo de oferta', helper: 'Clasifica tu oferta principal.', type: 'select', options: ['producto', 'servicio', 'infoproducto', 'saas'], required: true },
    { id: 'sector', label: 'Sector / Industria', helper: '¿A qué mercado pertenece tu negocio?', type: 'text', required: true },
    { id: 'propuesta_valor_promesa', label: 'Propuesta de valor / Promesa', helper: '¿Qué resultado único prometes a tus clientes?', type: 'textarea', required: true },
    { id: 'url_producto', label: 'URL del producto/servicio (opcional)', helper: 'El enlace directo a la página de tu oferta.', type: 'url', required: false },
    { id: 'segmento_cliente_objetivo', label: 'Segmento de cliente objetivo', helper: 'Describe a tu cliente ideal en detalle.', type: 'textarea', required: true },
    { id: 'problema_principal_resuelve', label: 'Problema principal que resuelve', helper: '¿Cuál es el dolor más grande que eliminas?', type: 'textarea', required: true },
    { id: 'personas_experimentan_problema', label: '¿Quiénes experimentan este problema?', helper: 'Describe las características de estas personas.', type: 'textarea', required: true },
    { id: 'transformacion_deseada', label: 'Transformación deseada del cliente', helper: '¿Cómo cambia la vida de tu cliente después de usarte?', type: 'textarea', required: true },
    { id: 'objetivo_proyecto', label: 'Objetivo del proyecto', helper: '¿Qué buscas lograr con esta campaña/proyecto?', type: 'textarea', required: true },
    { id: 'tema_clave', label: 'Tema clave', helper: 'Una palabra o frase que resuma el ángulo principal.', type: 'text', required: true },
    { id: 'pais_objetivo', label: 'País objetivo', helper: 'El mercado geográfico principal.', type: 'text', required: true },
    { id: 'precio_aprox', label: 'Precio aproximado', helper: 'Indica el precio y la moneda (ej: 99 USD).', type: 'text', required: true },
    { id: 'competidores_relevantes', label: 'Competidores relevantes (opcional)', helper: 'Nombra a tus competidores directos o indirectos.', type: 'chips', required: false },
    { id: 'referentes_inspiracion', label: 'Marcas referentes / Inspiración (opcional)', helper: 'Marcas que te inspiran en tono, estilo y comunicación.', type: 'chips', required: false },
    { id: 'tiene_limites_comunicacion', label: '¿Hay límites o líneas rojas en comunicación?', helper: 'Cosas que NO se deben decir o hacer.', type: 'boolean_conditional', required: true },
];

const CompetitorChips: React.FC<{ value: string[], onChange: (value: string[]) => void }> = ({ value, onChange }) => {    
    const [inputValue, setInputValue] = useState('');
    
    const handleAdd = () => {
        if (inputValue && !value.includes(inputValue)) {
            onChange([...value, inputValue.trim()]);
            setInputValue('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (itemToRemove: string) => {
        onChange(value.filter(item => item !== itemToRemove));
    };

    return (
        <div>
            <div className="flex">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-l-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                    placeholder="Escribe y presiona Enter..."
                />
                <button type="button" onClick={handleAdd} className="mt-1 px-4 py-2 bg-slate-200 text-slate-700 border-y border-r border-slate-300 rounded-r-md text-sm font-medium hover:bg-slate-300">Añadir</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                {value.map(item => (
                    <span key={item} className="flex items-center bg-slate-200 text-slate-800 text-sm font-medium px-3 py-1 rounded-full">
                        {item}
                        <button type="button" onClick={() => handleRemove(item)} className="ml-2 text-slate-500 hover:text-slate-800">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};


const ProjectBriefPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState<{ name: string; status: string } | null>(null);
    const [formData, setFormData] = useState<BriefPayload>(initialFormData);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [missingFields, setMissingFields] = useState<{ field: string; message: string }[]>([]);
    const [urlError, setUrlError] = useState('');
    const [canGenerate, setCanGenerate] = useState(false);

    const inputRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const projectPromise = supabase.from('projects').select('name, status').eq('id', id).single();
                const briefPromise = supabase.from('briefs').select('payload, is_valid').eq('project_id', id).single();

                const [{ data: projectData, error: projectError }, { data: briefData, error: briefError }] = await Promise.all([projectPromise, briefPromise]);

                if (projectError) throw projectError;
                setProject(projectData);

                if (briefData?.payload) {
                    let payloadData: BriefPayload;
                    if (typeof briefData.payload === 'string') {
                        try {
                            payloadData = JSON.parse(briefData.payload);
                        } catch (e) {
                            console.error('Failed to parse brief payload:', e);
                            payloadData = initialFormData; // Fallback to initial form data
                        }
                    } else {
                        payloadData = briefData.payload as BriefPayload;
                    }
                    const completeBriefData = { ...initialFormData, ...payloadData };
                    setFormData(completeBriefData);
                    if (briefData.is_valid) {
                       setCanGenerate(true);
                       setIsEditing(false);
                    }
                }
                if (briefError && briefError.code !== 'PGRST116') {
                    console.warn("Error fetching brief:", briefError.message);
                }

            } catch (err: any) {
                setPageError('Error al cargar los datos del proyecto.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (field: keyof BriefPayload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setCanGenerate(false);
        if (field === 'url_producto') {
            validateUrlOnBlur(value);
        }
    };
    
    const validateUrlOnBlur = (value: string) => {
        if (!value) {
            setUrlError('');
            return true;
        }
        try {
            new URL(value);
            setUrlError('');
            return true;
        } catch (_) {
            setUrlError('Por favor, introduce una URL válida (ej: https://dominio.com).');
            return false;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setToastMessage(null);
    
        const payload = formData;
        const { ok, missing } = validateBriefPayload(payload);
    
        if (!ok) {
            const fieldLabels = BRIEF_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: f.label }), {} as Record<string, string>);
            // Add custom label for the conditional field if not present
            fieldLabels['detalles_limites_comunicacion'] = 'Detalles de los límites';

            const formattedMissing = missing.map(field => ({
                field,
                message: field === 'url_producto' 
                    ? 'La URL no es válida.' 
                    : `El campo "${fieldLabels[field] || field}" es obligatorio.`
            }));
            setMissingFields(formattedMissing);
            setIsModalOpen(true);
            setIsSaving(false);
            return;
        }
    
        try {
            const { data, error, status } = await supabase
                .from('briefs')
                .upsert({
                    project_id: id!,
                    payload,
                    version: 1,
                    is_valid: ok,
                    missing_fields: missing,
                }, { onConflict: 'project_id' })
                .select('id')
                .single();
    
            if (error) {
                console.error('[BRIEF_UPSERT_ERROR]', { status, code: (error as any).code, message: error.message });
                setToastMessage({ message: 'No se pudo guardar el brief.', type: 'error' });
            } else {
                setToastMessage({ message: 'Brief guardado', type: 'success' });
                setCanGenerate(true);
                setIsEditing(false);
            }
    
        } catch (err: any) {
            console.error('[BRIEF_SAVE_FATAL]', err);
            setToastMessage({ message: 'Ocurrió un error inesperado guardando el brief.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        setToastMessage(null);
    
        const payload = formData;
        const { ok, missing } = validateBriefPayload(payload);
    
        if (!ok) {
            const fieldLabels = BRIEF_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: f.label }), {} as Record<string, string>);
            fieldLabels['detalles_limites_comunicacion'] = 'Detalles de los límites';
            
            const formattedMissing = missing.map(field => ({
                field,
                message: field === 'url_producto' 
                    ? 'La URL no es válida.' 
                    : `El campo "${fieldLabels[field] || field}" es obligatorio.`
            }));
            setMissingFields(formattedMissing);
            setIsModalOpen(true);
            setIsGenerating(false);
            return;
        }
    
        try {
            // Step 1: Save the brief and get its ID
            const { data: briefData, error: saveError } = await supabase
                .from('briefs')
                .upsert({
                    project_id: id!,
                    payload,
                    version: 1,
                    is_valid: ok,
                    missing_fields: missing,
                }, { onConflict: 'project_id' })
                .select('id')
                .single();
    
            if (saveError) {
                console.error('[GENERATE_ERROR] Supabase save failed:', saveError);
                throw new Error(`Error al guardar el brief: ${saveError.message}`);
            }
            if (!briefData?.id) {
                console.error('[GENERATE_ERROR] Brief ID not returned after save.');
                throw new Error('No se pudo obtener el ID del brief guardado.');
            }
    
            const briefId = briefData.id;

            // Update UI state after successful save
            setIsEditing(false);
            setCanGenerate(true);
    
            // Step 2: Call the webhook
            if (!user) {
                throw new Error("No se pudo obtener el usuario autenticado para la generación.");
            }
            
            const webhookUrl = 'https://sswebhook.made-to-scale.com/webhook/buyer-parte1';
            const webhookPayload = {
                project_id: id,
                brief_id: briefId,
                user_id: user.id,
                brief_version: 1, // This is hardcoded in the upsert
            };

            setToastMessage({ message: 'Generación iniciada. Ve a Avatares para seguir el progreso.', type: 'success' });
            console.log(`[handleGenerate] Calling webhook. Method: POST, URL: ${webhookUrl}`, webhookPayload);
            
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            });
    
            if (!webhookResponse.ok) {
                const errorBody = await webhookResponse.text();
                console.error(`[handleGenerate] Webhook call failed. Status: ${webhookResponse.status}`, errorBody);
                throw new Error(`La generación falló (estado ${webhookResponse.status}): ${errorBody || 'El servidor no proporcionó detalles.'}`);
            }
    
            console.log(`[handleGenerate] Webhook call successful. Status: ${webhookResponse.status}`);
    
            // Step 3: Navigate after a delay
            setTimeout(() => {
                navigate(`/proyectos/${id}/avatares`);
            }, 1000);
    
        } catch (err: any) {
             setIsGenerating(false); // Stop loading only on error, otherwise keep it until navigation
             if (err instanceof TypeError && err.message === 'Failed to fetch') {
                console.error('[GENERATE_ERROR] Network error (Failed to fetch). Possible CORS issue.', err);
                setToastMessage({ message: 'Error de red. No se pudo contactar al servicio de generación. Revisa la consola para más detalles.', type: 'error' });
            } else {
                console.error('[GENERATE_ERROR] An error occurred:', err);
                setToastMessage({ message: err.message || 'Ocurrió un error inesperado.', type: 'error' });
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            if (missingFields.length > 0) {
                const firstMissingFieldKey = missingFields[0].field;
                const fieldElement = inputRefs.current[firstMissingFieldKey];
                if (fieldElement) {
                    fieldElement.focus({ preventScroll: true });
                    fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 100);
    };

    const isFieldCompleted = (fieldId: keyof BriefPayload): boolean => {
        const value = formData[fieldId];
        if (fieldId === 'detalles_limites_comunicacion') {
            // Solo cuenta si 'tiene_limites_comunicacion' es 'si'
            return formData.tiene_limites_comunicacion !== 'si' || (!!value && (value as string).trim().length > 0);
        }
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
    };
    
    // Calcular campos requeridos excluyendo 'detalles_limites_comunicacion' porque es condicional
    // Lo manejamos visualmente según el estado
    const requiredFieldsList = BRIEF_FIELDS.filter(f => f.required);
    
    let completedRequiredFieldsCount = 0;
    let totalRequiredFields = requiredFieldsList.length;

    requiredFieldsList.forEach(field => {
        const isCompleted = isFieldCompleted(field.id as keyof BriefPayload);
        if (field.id === 'tiene_limites_comunicacion') {
             if (isCompleted) {
                 // Si ha respondido SI, verificamos si ha rellenado los detalles
                 if (formData.tiene_limites_comunicacion === 'si' && !formData.detalles_limites_comunicacion.trim()) {
                     // No sumar
                 } else {
                     completedRequiredFieldsCount++;
                 }
             }
        } else {
             if (isCompleted) completedRequiredFieldsCount++;
        }
    });

    const progressPercentage = totalRequiredFields > 0 ? (completedRequiredFieldsCount / totalRequiredFields) * 100 : 0;

    if (isLoading) {
        return <div className="text-center p-8">Cargando brief...</div>;
    }
    
    if (pageError) {
        return <div className="text-center p-8 text-red-600">{pageError}</div>;
    }

    return (
        <>
            {/* Loading Overlay */}
            {isGenerating && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-mts-green/20 rounded-full animate-ping"></div>
                        <div className="relative bg-white p-4 rounded-full shadow-lg border border-slate-100">
                            <SparklesIcon className="w-12 h-12 text-mts-green animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Analizando mercado y generando avatares...</h3>
                    <p className="text-slate-500 max-w-md text-center">
                        Estamos procesando tu brief, analizando la competencia y detectando tus perfiles ideales. Esto puede tardar unos segundos.
                    </p>
                    <div className="mt-8 w-64 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-mts-green h-full rounded-full animate-progress-indeterminate"></div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">{project?.name || 'Cargando...'}</h2>
                    <p className="mt-1 text-slate-600">Completa la siguiente información para definir la estrategia del proyecto.</p>
                </div>
                 <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${project?.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {project?.status || 'Indefinido'}
                 </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2 space-y-8">
                    <fieldset disabled={!isEditing}>
                        {BRIEF_FIELDS.map(({ id, label, helper, type, options }) => {
                            const fieldId = id as keyof BriefPayload;
                            
                            if (type === 'boolean_conditional') {
                                return (
                                    <div key={id} ref={el => { inputRefs.current[id] = el; }}>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                                        <div className="flex gap-6 mb-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={id}
                                                    value="si" 
                                                    checked={formData[fieldId] === 'si'} 
                                                    onChange={() => handleChange(fieldId, 'si')}
                                                    className="focus:ring-slate-500 h-4 w-4 text-slate-800 border-slate-300"
                                                />
                                                <span className="ml-2 text-sm text-slate-700">Sí</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={id}
                                                    value="no" 
                                                    checked={formData[fieldId] === 'no'} 
                                                    onChange={() => handleChange(fieldId, 'no')}
                                                    className="focus:ring-slate-500 h-4 w-4 text-slate-800 border-slate-300"
                                                />
                                                <span className="ml-2 text-sm text-slate-700">No</span>
                                            </label>
                                        </div>
                                        {formData[fieldId] === 'si' && (
                                            <div className="mt-3 animate-fade-in">
                                                <label htmlFor="detalles_limites_comunicacion" className="block text-sm font-medium text-slate-700 mb-1">
                                                    Indica cuáles son esos límites o líneas rojas:
                                                </label>
                                                <textarea
                                                    id="detalles_limites_comunicacion"
                                                    ref={el => { inputRefs.current['detalles_limites_comunicacion'] = el; }}
                                                    rows={3}
                                                    value={formData.detalles_limites_comunicacion}
                                                    onChange={(e) => handleChange('detalles_limites_comunicacion', e.target.value)}
                                                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                                    placeholder="Ej: No usar lenguaje agresivo, no mencionar a competidores..."
                                                />
                                            </div>
                                        )}
                                        <p className="mt-2 text-sm text-slate-500">{helper}</p>
                                    </div>
                                );
                            }

                            return (
                                <div key={id}>
                                    <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
                                    {type === 'textarea' ? (
                                        <textarea id={id} rows={4}
                                            ref={el => { inputRefs.current[id] = el; }}
                                            value={formData[fieldId] as string}
                                            onChange={(e) => handleChange(fieldId, e.target.value)}
                                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    ) : type === 'select' ? (
                                        <select id={id}
                                            ref={el => { inputRefs.current[id] = el; }}
                                            value={formData[fieldId] as string}
                                            onChange={(e) => handleChange(fieldId, e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md disabled:bg-slate-50 disabled:text-slate-500"
                                        >
                                            <option value="">Selecciona una opción</option>
                                            {options?.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
                                        </select>
                                    ) : type === 'chips' ? (
                                        <div ref={el => { inputRefs.current[id] = el; }} tabIndex={-1}>
                                            <CompetitorChips 
                                                value={formData[fieldId] as string[]}
                                                onChange={(value) => handleChange(fieldId, value)}
                                            />
                                        </div>
                                    ) : (
                                        <input type={type} id={id}
                                            ref={el => { inputRefs.current[id] = el; }}
                                            value={formData[fieldId] as string}
                                            onChange={(e) => handleChange(fieldId, e.target.value)}
                                            onBlur={(e) => type === 'url' ? validateUrlOnBlur(e.target.value) : undefined}
                                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    )}
                                    <p className={`mt-2 text-sm ${id === 'url_producto' && urlError ? 'text-red-600' : 'text-slate-500'}`}>
                                        {id === 'url_producto' && urlError ? urlError : helper}
                                    </p>
                                </div>
                            )
                        })}
                    </fieldset>
                </div>

                <aside className="lg:col-span-1">
                    <div className="sticky top-8 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800">Checklist del Brief</h3>
                        <p className="text-sm text-slate-500 mt-1">Completa y guarda los cambios para continuar.</p>
                        
                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">Progreso (requeridos)</span>
                                <span className="text-sm font-medium text-slate-700">{completedRequiredFieldsCount} de {totalRequiredFields}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-slate-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.3s ease-in-out' }}></div>
                            </div>
                        </div>

                        <ul className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-2">
                            {BRIEF_FIELDS.map(({ id, label, required }) => {
                                const isCompleted = isFieldCompleted(id as keyof BriefPayload);
                                let displayLabel = label;
                                
                                // Caso especial visual para el campo condicional
                                let visualCompleted = isCompleted;
                                if (id === 'tiene_limites_comunicacion' && formData.tiene_limites_comunicacion === 'si' && !formData.detalles_limites_comunicacion.trim()) {
                                    visualCompleted = false;
                                    displayLabel = "Límites: Detalles requeridos";
                                }

                                return (
                                <li key={id} className={`flex items-center text-sm ${!required && 'opacity-70'}`}>
                                    {visualCompleted ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                                    ) : (
                                        <XCircleIcon className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
                                    )}
                                    <span className={visualCompleted ? 'text-slate-700' : 'text-slate-500'}>{displayLabel}</span>
                                </li>
                            )})}
                        </ul>
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            {isEditing ? (
                                <button onClick={handleSave} disabled={isSaving || isGenerating} className="w-full mb-2 px-4 py-2.5 bg-mts-navy text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="w-full mb-2 px-4 py-2.5 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors duration-200 shadow-sm">
                                    Editar Brief
                                </button>
                            )}
                            
                            <button onClick={handleGenerate} disabled={!canGenerate || isGenerating || isSaving} className="w-full px-4 py-2.5 bg-mts-green text-mts-navy text-sm font-bold rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 flex items-center justify-center gap-2">
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-mts-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Iniciando...
                                    </>
                                ) : 'Generar contexto y avatares'}
                            </button>
                            {!canGenerate && isEditing && <p className="text-xs text-slate-500 mt-2 text-center">Debes guardar los cambios para poder generar.</p>}
                        </div>
                    </div>
                </aside>
            </div>
            
            <MissingFieldsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                missingFields={missingFields}
                fieldLabels={BRIEF_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: f.label }), {} as Record<string, string>)}
            />

            {toastMessage && (
                <div className={`fixed bottom-5 right-5 text-white px-5 py-3 rounded-lg shadow-lg flex items-center animate-fade-in-up max-w-md ${toastMessage.type === 'success' ? 'bg-mts-navy' : 'bg-red-600'}`}>
                    {toastMessage.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 mr-3 text-mts-green flex-shrink-0" />
                    ) : (
                        <XCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    )}
                    {toastMessage.message}
                </div>
            )}
        </>
    );
};

export default ProjectBriefPage;
