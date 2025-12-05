
import React from 'react';
import { ArrowTrendingUpIcon, CurrencyDollarIcon, PresentationChartLineIcon, CheckCircleIcon } from '../components/Icons';

const MetricCard: React.FC<{ title: string; value: string; change?: string; positive?: boolean; icon?: React.ReactNode }> = ({ title, value, change, positive, icon }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
            </div>
            {icon && <div className="p-2 bg-slate-50 rounded-lg text-slate-400">{icon}</div>}
        </div>
        {change && (
            <div className={`text-xs font-medium flex items-center ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
                <ArrowTrendingUpIcon className={`w-3 h-3 mr-1 ${!positive && 'rotate-180'}`} />
                {change} vs mes anterior
            </div>
        )}
    </div>
);

const ProjectDashboardPage: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Meta Ads Dashboard</h2>
            <p className="text-slate-600 mt-1">Métricas en tiempo real del rendimiento de tus campañas.</p>
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Últimos 30 días</span>
            <button className="px-3 py-1.5 text-sm font-medium bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 shadow-sm">
                Filtrar fecha
            </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
            title="Inversión Total" 
            value="€1,245.00" 
            change="+12.5%" 
            positive={true} // Spending more is not always bad, but contextually usually neutral/red. Let's assume scaling up is good.
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
        />
        <MetricCard 
            title="ROAS (Retorno)" 
            value="4.2x" 
            change="+0.8%" 
            positive={true}
            icon={<PresentationChartLineIcon className="w-5 h-5" />}
        />
        <MetricCard 
            title="Coste por Resultado" 
            value="€3.50" 
            change="-10.2%" 
            positive={true} // Lower cost is good
            icon={<CheckCircleIcon className="w-5 h-5" />}
        />
        <MetricCard 
            title="CTR (Click-Through)" 
            value="1.85%" 
            change="+0.2%" 
            positive={true}
            icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
        />
      </div>

      {/* Main Chart Placeholder */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Rendimiento: Inversión vs Ventas</h3>
          <div className="h-64 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
              <div className="text-center">
                  <PresentationChartLineIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Gráfico de rendimiento simulado (Integración Meta API pendiente)</p>
              </div>
          </div>
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Campañas Activas</h3>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                          <th className="px-6 py-3">Nombre Campaña</th>
                          <th className="px-6 py-3">Estado</th>
                          <th className="px-6 py-3">Inversión</th>
                          <th className="px-6 py-3">Resultados</th>
                          <th className="px-6 py-3">Coste/Res.</th>
                          <th className="px-6 py-3">ROAS</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">TOFU - Tráfico Frío - Avatar 1</td>
                          <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Activa</span></td>
                          <td className="px-6 py-4 text-slate-600">€450.00</td>
                          <td className="px-6 py-4 text-slate-600">125 Leads</td>
                          <td className="px-6 py-4 text-slate-600">€3.60</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">--</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">MOFU - Retargeting - Webinars</td>
                          <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Activa</span></td>
                          <td className="px-6 py-4 text-slate-600">€210.50</td>
                          <td className="px-6 py-4 text-slate-600">15 Ventas</td>
                          <td className="px-6 py-4 text-slate-600">€14.03</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">4.5x</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">BOFU - Oferta Directa</td>
                          <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Aprendizaje</span></td>
                          <td className="px-6 py-4 text-slate-600">€584.50</td>
                          <td className="px-6 py-4 text-slate-600">42 Ventas</td>
                          <td className="px-6 py-4 text-slate-600">€13.91</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">3.8x</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default ProjectDashboardPage;
