
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  DocumentTextIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  MegaphoneIcon, 
  ArrowTrendingUpIcon, 
  PencilSquareIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '../components/Icons';

// --- Components ---

const SummaryCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: React.ReactNode; 
  to: string; 
  color: string;
  loading?: boolean;
}> = ({ title, value, subtitle, icon, to, color, loading }) => (
    <Link to={to} className="group relative flex flex-col justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-300 h-full">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
                {icon}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6 text-slate-300">
                <ChevronDownIcon className="w-5 h-5 -rotate-90" />
            </div>
        </div>
        <div className="mt-6">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            {loading ? (
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
            )}
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>
        </div>
    </Link>
);

const ActionCard: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  to: string;
}> = ({ title, description, icon, to }) => (
    <Link to={to} className="group flex items-center p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200">
        <div className="w-12 h-12 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors flex-shrink-0">
            {icon}
        </div>
        <div className="ml-4 flex-1">
            <h4 className="text-base font-bold text-slate-800 group-hover:text-slate-900">{title}</h4>
            <p className="text-sm text-slate-500 leading-snug mt-0.5">{description}</p>
        </div>
        <div className="text-slate-300 group-hover:text-slate-500 transition-colors ml-2">
            <ChevronDownIcon className="w-5 h-5 -rotate-90" />
        </div>
    </Link>
);

const ActivityItem: React.FC<{ 
  type: 'update' | 'create' | 'alert'; 
  title: string; 
  meta: string; 
  time: string; 
}> = ({ type, title, meta, time }) => {
    let icon = <DocumentTextIcon className="w-4 h-4" />;
    let color = "bg-blue-100 text-blue-600";

    if (type === 'create') {
        icon = <SparklesIcon className="w-4 h-4" />;
        color = "bg-emerald-100 text-emerald-600";
    } else if (type === 'alert') {
        icon = <MegaphoneIcon className="w-4 h-4" />;
        color = "bg-amber-100 text-amber-600";
    }

    return (
        <div className="flex items-start py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors px-4 -mx-4 rounded-lg">
            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${color} flex-shrink-0`}>
                {icon}
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{meta}</p>
            </div>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">{time}</span>
        </div>
    );
};

// --- Main Page ---

const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [stats, setStats] = useState({
        briefCompleted: false,
        avatarsCount: 0,
        competitorsCount: 0,
        adsCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!id) return;
            try {
                // 1. Brief Status
                const { data: brief } = await supabase
                    .from('briefs')
                    .select('is_valid')
                    .eq('project_id', id)
                    .single();
                
                // 2. Avatars Count
                const { count: avatars } = await supabase
                    .from('avatars')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', id);

                // 3. Competitors Count
                const { count: competitors } = await supabase
                    .from('competitors_strategic')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', id);

                // 4. Ads Count
                const { count: ads } = await supabase
                    .from('ads_creation')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', id);

                setStats({
                    briefCompleted: brief?.is_valid || false,
                    avatarsCount: avatars || 0,
                    competitorsCount: competitors || 0,
                    adsCount: ads || 0
                });
            } catch (e) {
                console.error("Error loading stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [id]);

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fade-in">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Panel Principal</h2>
                    <p className="text-slate-500 mt-2 text-lg font-light">Visión general y estado de tu proyecto.</p>
                </div>
                <div className="text-sm text-slate-400 font-medium bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    Actualizado hoy
                </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard 
                    title="Brief Estratégico"
                    value={stats.briefCompleted ? "Completado" : "Pendiente"}
                    subtitle="Base de conocimiento"
                    icon={<DocumentTextIcon className="w-6 h-6" />}
                    to={`/proyectos/${id}/brief`}
                    color="text-blue-600"
                    loading={loading}
                />
                <SummaryCard 
                    title="Avatares Activos"
                    value={stats.avatarsCount}
                    subtitle="Perfiles analizados"
                    icon={<SparklesIcon className="w-6 h-6" />}
                    to={`/proyectos/${id}/avatares`}
                    color="text-purple-600"
                    loading={loading}
                />
                <SummaryCard 
                    title="Competidores"
                    value={stats.competitorsCount}
                    subtitle="En seguimiento"
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    to={`/proyectos/${id}/competencia`}
                    color="text-amber-600"
                    loading={loading}
                />
                <SummaryCard 
                    title="Anuncios Creados"
                    value={stats.adsCount}
                    subtitle="Listos para lanzar"
                    icon={<MegaphoneIcon className="w-6 h-6" />}
                    to={`/proyectos/${id}/anuncios`}
                    color="text-emerald-600"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Quick Actions - 2/3 Width */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Accesos Rápidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ActionCard 
                            title="Editar Estrategia" 
                            description="Modifica el brief, objetivos o datos base."
                            icon={<PencilSquareIcon className="w-6 h-6" />}
                            to={`/proyectos/${id}/brief`}
                        />
                        <ActionCard 
                            title="Analizar Avatares" 
                            description="Consulta los dolores y deseos profundos."
                            icon={<SparklesIcon className="w-6 h-6" />}
                            to={`/proyectos/${id}/avatares`}
                        />
                        <ActionCard 
                            title="Espiar Competencia" 
                            description="Revisa anuncios y estrategias rivales."
                            icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
                            to={`/proyectos/${id}/competencia`}
                        />
                        <ActionCard 
                            title="Generar Creatividades" 
                            description="Crea nuevos guiones y copies de venta."
                            icon={<MegaphoneIcon className="w-6 h-6" />}
                            to={`/proyectos/${id}/anuncios`}
                        />
                    </div>
                </div>

                {/* Recent Activity - 1/3 Width */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Actividad</h3>
                            <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">Ver todo</button>
                        </div>
                        
                        <div className="space-y-1">
                            {/* Static Data for UI Demo */}
                            <ActivityItem 
                                type="create" 
                                title="Anuncio generado" 
                                meta="Campaña TOFU - Avatar 1" 
                                time="2h" 
                            />
                            <ActivityItem 
                                type="update" 
                                title="Brief actualizado" 
                                meta="Sección de oferta ajustada" 
                                time="1d" 
                            />
                            <ActivityItem 
                                type="alert" 
                                title="Competidor detectado" 
                                meta="Nuevo anuncio en librería" 
                                time="2d" 
                            />
                            <ActivityItem 
                                type="create" 
                                title="Proyecto creado" 
                                meta="Configuración inicial" 
                                time="3d" 
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProjectDetailPage;
