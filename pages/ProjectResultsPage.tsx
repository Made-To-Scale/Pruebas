import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircleIcon, XCircleIcon } from '../components/Icons';

// --- Types ---

type JobStatus = 'queued' | 'processing' | 'running' | 'done' | 'succeeded' | 'failed' | 'canceled';
type JobStatusTone = 'warning' | 'info' | 'success' | 'destructive';

interface AvatarAnalysisJob {
  id: string;
  project_id: string;
  avatar_id: string;
  avatar_slot: number;
  status: JobStatus;
  created_at: string;
  error?: string;
  payload?: {
    name: string;
    headline: string;
    [key:string]: any;
  };
}

interface AvatarOutput {
  id: string;
  project_id: string;
  job_id: string;
  section: string;
  created_at: string;
  data: any;
}

type AvatarAnalysis = {
    jobId: string;
    avatarId: string;
    status: JobStatus;
    finalStatus: JobStatus;
    name: string;
    headline: string;
    avatarSlot: number;
    createdAt: string;
    error?: string;
    sections: AvatarOutput[];
    completedSections: number;
    totalSections: number;
};

// --- Utils ---

function getJobStatus(jobStatus: JobStatus | null | undefined): { label: string; tone: JobStatusTone } {
  switch (jobStatus) {
    case 'queued':
      return { label: 'En cola', tone: 'warning' };
    case 'processing':
    case 'running':
      return { label: 'En proceso', tone: 'info' };
    case 'done':
    case 'succeeded':
      return { label: 'Completado', tone: 'success' };
    case 'failed':
      return { label: 'Error', tone: 'destructive' };
    case 'canceled':
      return { label: 'Cancelado', tone: 'warning' };
    default:
      return { label: 'En cola', tone: 'warning' };
  }
}

// --- Icons ---
const ClockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ArrowPathIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181 9.995l-3.182-3.182a8.25 8.25 0 010-11.664l3.181-3.182" /></svg>
);

// --- Custom Hook for Data Fetching and Polling ---

const useAvatarResults = (projectId: string | undefined) => {
    const [jobs, setJobs] = useState<AvatarAnalysisJob[]>([]);
    const [outputs, setOutputs] = useState<AvatarOutput[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const refreshAll = useCallback(async (isPolling = false) => {
        if (!projectId) return;
        if (!isPolling) setIsLoading(true);
        setError(null);
        try {
            const { data: jobsData, error: jobsError } = await supabase
                .from('analysis_jobs')
                .select('id, project_id, avatar_id, avatar_slot, status, created_at, error, payload')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;
            
            const jobIds = (jobsData || []).map(j => j.id);

            if (jobIds.length > 0) {
              const { data: outputsData, error: outputsError } = await supabase
                  .from('avatar_outputs')
                  .select('*')
                  .in('job_id', jobIds);
              if (outputsError) throw outputsError;
              setOutputs(outputsData || []);
            } else {
              setOutputs([]);
            }
            
            setJobs(jobsData || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        refreshAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    useEffect(() => {
        if (!autoRefresh) return;
        const intervalId = setInterval(() => refreshAll(true), 5000);
        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshAll]);

    const joinedData = useMemo<AvatarAnalysis[]>(() => {
        const outputsByJobId = new Map<string, AvatarOutput[]>();
        for (const output of outputs) {
            if (output.job_id) {
                if (!outputsByJobId.has(output.job_id)) outputsByJobId.set(output.job_id, []);
                outputsByJobId.get(output.job_id)!.push(output);
            }
        }
        
        return jobs.map(job => {
            const jobOutputs = outputsByJobId.get(job.id) ?? [];
            const completedSections = new Set(jobOutputs.map(o => o.section.replace(/\s+/g, "").toLowerCase())).size;
            const totalSections = 4; // Hardcoded to 4 sections we care about
            
            const isTerminal = ['done', 'succeeded', 'failed', 'canceled'].includes(job.status);
            const allSectionsPresent = completedSections >= totalSections;
            const finalStatus = allSectionsPresent && !isTerminal ? 'succeeded' : job.status;

            return {
                jobId: job.id,
                avatarId: job.avatar_id,
                status: job.status,
                finalStatus: finalStatus,
                name: job.payload?.name || `Avatar #${job.avatar_slot}`,
                headline: job.payload?.headline || '',
                avatarSlot: job.avatar_slot,
                createdAt: job.created_at,
                error: job.error,
                sections: jobOutputs,
                completedSections,
                totalSections,
            };
        });
    }, [jobs, outputs]);

    return { joinedData, isLoading, error, autoRefresh, setAutoRefresh, refreshAll };
};

// --- Sub-components for Results Page---

export const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const { label, tone } = getJobStatus(status);
  const styles: Record<JobStatusTone, string> = {
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
  };
  const icons: Record<string, React.ReactElement> = {
    'En cola': <ClockIcon className="w-4 h-4" />,
    'En proceso': <ArrowPathIcon className="w-4 h-4 animate-spin-slow" />,
    'Completado': <CheckCircleIcon className="w-4 h-4" />,
    'Error': <XCircleIcon className="w-4 h-4" />,
    'Cancelado': <XCircleIcon className="w-4 h-4" />,
  };
  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${styles[tone]}`}>
      {icons[label]} {label}
    </span>
  );
};

const ResultCard: React.FC<{ data: AvatarAnalysis; projectId: string; }> = ({ data, projectId }) => {
    const { finalStatus, name, headline, createdAt, completedSections, totalSections, error, avatarId } = data;
    const formattedDate = new Date(createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-800 pr-2">{name}</h3>
                    <StatusBadge status={finalStatus} />
                </div>
                {headline && <p className="mt-1 text-sm text-slate-600 line-clamp-2 min-h-[40px]">{headline}</p>}
                
                <div className="mt-4">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium text-slate-700">Progreso:</span>
                        <span className="text-sm font-mono text-slate-500">{completedSections}/{totalSections} bloques</span>
                    </div>
                </div>
                {error && finalStatus === 'failed' && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 line-clamp-2">Error: {error}</p>
                )}
                <p className="mt-4 text-xs text-slate-500"><strong>Encolado:</strong> {formattedDate}</p>
            </div>
            <div className="p-4 bg-slate-50/70 border-t rounded-b-lg">
                <Link to={`/proyectos/${projectId}/resultados/avatar/${avatarId}`} className={`w-full text-center block px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors duration-200 ${
                    finalStatus === 'failed' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-700'
                }`}>
                    Ver análisis maestro
                </Link>
            </div>
        </div>
    );
};


// --- Main Component ---
const ProjectResultsPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { joinedData, isLoading, error, autoRefresh, setAutoRefresh, refreshAll } = useAvatarResults(projectId);

    const renderGridView = () => {
        if (isLoading && joinedData.length === 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                            <div className="animate-pulse flex flex-col space-y-4">
                                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
                                <div className="mt-4 pt-4 border-t border-slate-100"><div className="h-9 bg-slate-200 rounded w-full"></div></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;
        }

        if (joinedData.length === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.242.013.487.02.73.022h.012a2.25 2.25 0 012.248 2.248c0 .243.009.488.022.731v5.714a2.25 2.25 0 00.659 1.591L19 14.5M9.75 3.104c.242.013.487.02.73.022h.012a2.25 2.25 0 00-2.248 2.248c0 .243.009.488.022.731M15 14.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25M15 14.5a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25" /></svg>
                    <h3 className="mt-4 text-xl font-semibold text-slate-700">Todavía no hay análisis en cola</h3>
                    <p className="mt-2 text-slate-500">
                        Selecciona avatares en la pestaña anterior para iniciar un análisis.
                    </p>
                    <Link to={`/proyectos/${projectId}/avatares`} className="mt-6 inline-block px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors duration-200 shadow-sm">
                        Ir a Avatares
                    </Link>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedData.map(d => (
                    <ResultCard key={d.jobId} data={d} projectId={projectId!} />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">Estado de Análisis</h2>
                    <p className="mt-1 text-slate-600">Sigue el progreso de los análisis de avatares en tiempo real.</p>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                    <button onClick={() => refreshAll(false)} disabled={isLoading} className="text-slate-600 hover:text-slate-800 disabled:opacity-50" title="Refrescar manualmente">
                        <ArrowPathIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center">
                        <span className="text-sm text-slate-600 mr-2">Auto-refresco:</span>
                        <label htmlFor="auto-refresh-toggle" className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} id="auto-refresh-toggle" className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-slate-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                        </label>
                    </div>
                </div>
            </div>

            {renderGridView()}
        </>
    );
};

export default ProjectResultsPage;