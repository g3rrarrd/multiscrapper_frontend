import React, { useEffect, useState } from 'react';
import { Platform, PlatformKey } from '../types';
import { 
  Instagram, 
  Twitter, 
  Video, 
  ArrowRight,
  Users,
  Eye,
  Heart,
  Facebook,
  Youtube,
  Sparkles,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../api/axiosConfig';

interface DashboardProps {
  onPlatformSelect: (platform: Platform) => void;
  displayName?: string;
}

interface MetricsData {
  total_extracted: number;
  total_profiles: number;
  avg_engagement: number;
  platform_distribution: { [key: string]: number };
  weekly_volume: { [key: string]: number };
  users_api_calls: { [key: string]: number };
}

export const Dashboard: React.FC<DashboardProps> = ({ onPlatformSelect, displayName }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('scraper/get_metrics/')
      .then(res => {
        setMetrics(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando métricas:', err);
        setLoading(false);
      });
  }, []);

  const chartData = metrics ? Object.entries(metrics.weekly_volume || {}).map(([name, count]) => ({
    name,
    count
  })) : [];

  const platforms = [
    { 
      id: Platform.INSTAGRAM, 
      name: 'Instagram', 
      icon: Instagram, 
      gradient: 'from-amber-400 via-rose-500 to-purple-600',
      badge: 'Looter API',
      description: 'Extracción de perfiles masivos, captions y publicaciones individuales.' 
    },
    { 
      id: Platform.TIKTOK, 
      name: 'TikTok', 
      icon: Video, 
      gradient: 'from-cyan-400 via-slate-900 to-rose-500',
      badge: 'Scraper7 API',
      description: 'Búsqueda de usuarios, extracción de posts y comentarios por videoId.' 
    },
    { 
      id: Platform.X, 
      name: 'X (Twitter)', 
      icon: Twitter, 
      gradient: 'from-slate-900 via-sky-900 to-sky-600',
      badge: 'API v45',
      description: 'Resolución de rest_id, tweets masivos y tweets individuales por ID.' 
    },
    { 
      id: Platform.FACEBOOK, 
      name: 'Facebook', 
      icon: Facebook, 
      gradient: 'from-blue-600 to-indigo-700',
      badge: 'Scraper3 API',
      description: 'Páginas públicas, scraping por post_url y análisis de comentarios.' 
    },
    { 
      id: Platform.YOUTUBE, 
      name: 'YouTube', 
      icon: Youtube, 
      gradient: 'from-red-600 via-rose-700 to-red-800',
      badge: 'Data API v3',
      description: 'Estadísticas de canales, videos recientes y paginación de comentarios.' 
    },
  ];

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando métricas en tiempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Saludo y Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900 mb-2">
            <Activity size={14} /> Panel Central de Inteligencia
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bienvenido, <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">{displayName || 'Usuario'}</span> 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Monitoreo en vivo de extracciones, distribución multired y análisis de sentimientos.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Base de Datos Conectada</span>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Perfiles Extraídos', 
            value: metrics?.total_profiles?.toLocaleString() || '0', 
            icon: Users, 
            color: 'text-blue-600 dark:text-blue-400', 
            bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60' 
          },
          { 
            label: 'Posts Registrados', 
            value: metrics?.total_extracted?.toLocaleString() || '0', 
            icon: Eye, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60' 
          },
          { 
            label: 'Engagement Mediano', 
            value: `${metrics?.avg_engagement || 0}%`, 
            icon: Heart, 
            color: 'text-rose-600 dark:text-rose-400', 
            bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60' 
          },
          { 
            label: 'Top Usuario Activo', 
            value: metrics && Object.entries(metrics.users_api_calls || {}).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A', 
            icon: TrendingUp, 
            color: 'text-amber-600 dark:text-amber-400', 
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60' 
          },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-1">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
            <div className={`p-3.5 rounded-2xl border ${stat.bg} ${stat.color} shadow-sm`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Tarjetas de Plataformas con Lanzador Directo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-500" />
            Lanzador de Extractores por Plataforma
          </h3>
          <span className="text-xs text-slate-400 font-semibold">5 Redes Activas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {platforms.map((p) => (
            <button 
              key={p.id} 
              onClick={() => onPlatformSelect(p.id)} 
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <p.icon size={22} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {p.badge}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">{p.name}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                <span>Extraer Ahora</span>
                <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gráficos de Volumen y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volumen Semanal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Volumen Semanal de Extracción
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '12px' 
                  }} 
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Plataforma */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Distribución por Red Social
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics?.platform_distribution || {}).map(([platform, count], i) => {
              const total = metrics?.total_extracted || 1;
              const percentage = Math.round((count / total) * 100);
              
              const platformColors: Record<string, { bar: string; text: string }> = {
                ig: { bar: 'bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600', text: 'text-pink-600 dark:text-pink-400' },
                tk: { bar: 'bg-gradient-to-r from-cyan-400 to-rose-500', text: 'text-cyan-600 dark:text-cyan-400' },
                x: { bar: 'bg-gradient-to-r from-slate-700 to-sky-500', text: 'text-sky-600 dark:text-sky-400' },
                fb: { bar: 'bg-gradient-to-r from-blue-600 to-indigo-600', text: 'text-blue-600 dark:text-blue-400' },
                yt: { bar: 'bg-gradient-to-r from-red-600 to-rose-600', text: 'text-red-600 dark:text-red-400' },
              };

              const style = platformColors[platform.toLowerCase()] || { bar: 'bg-blue-600', text: 'text-blue-600' };

              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={`uppercase font-mono ${style.text}`}>
                      {platform === 'ig' ? 'Instagram' : platform === 'tk' ? 'TikTok' : platform === 'x' ? 'X (Twitter)' : platform === 'fb' ? 'Facebook' : 'YouTube'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {count.toLocaleString()} posts ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${style.bar} rounded-full transition-all duration-700`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};