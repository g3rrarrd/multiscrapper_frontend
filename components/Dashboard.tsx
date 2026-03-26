import React, { useEffect, useState } from 'react';
import { Platform } from '../types';
import { 
  Instagram, 
  Twitter, 
  Video, 
  ArrowRight,
  Users,
  Eye,
  Heart,
  Facebook,
  Youtube
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
import api from '../api/axiosConfig'

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
}

const baseUrl = import.meta.env.VITE_API_URL;

export const Dashboard: React.FC<DashboardProps> = ({ onPlatformSelect, displayName }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      api.get('scraper/get_metrics/') // Ya no necesitas la URL completa ni los headers
        .then(res => {
          setMetrics(res.data);
          setLoading(false);
        })
        .catch(err => console.error(err));
  }, []);

  // Formatear datos para el gráfico de Recharts
  const chartData = metrics ? Object.entries(metrics.weekly_volume).map(([name, count]) => ({
    name,
    count
  })) : [];

const platforms = [
    { id: Platform.INSTAGRAM, name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500', description: 'Loot profiles and timeline media.' },
    { id: Platform.TIKTOK, name: 'TikTok', icon: Video, color: 'bg-black', description: 'Search users and extract post stats.' },
    { id: Platform.X, name: 'X (Twitter)', icon: Twitter, color: 'bg-slate-900', description: 'Analyze timelines and user metadata.' },
    { id: 'fb' as Platform, name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', description: 'Scrape public group posts and pages.' },
    { id: 'yt' as Platform, name: 'YouTube', icon: Youtube, color: 'bg-[#FF0000]', description: 'Extract video metadata and comments.' },
  ];

  if (loading) return <div className="p-10 text-center text-slate-500">Loading real-time metrics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            Bienvenido, <span className="text-blue-600">{displayName || 'Usuario'}</span> 👋
          </h2>
          <p className="text-slate-500 mt-1">Monitor your scraping tasks and extracted data insights.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-medium text-slate-600">
          Live Database Connected
        </div>
      </div>

      {/* Quick Stats con Datos Reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Profiles', value: metrics?.total_profiles.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Posts Extracted', value: metrics?.total_extracted.toLocaleString(), icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Engagement', value: `${metrics?.avg_engagement}%`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Platform Cards (Sin cambios, solo navegación) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <button key={p.id} onClick={() => onPlatformSelect(p.id)} className="group relative bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-left overflow-hidden">
            <div className={`${p.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <p.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
            <p className="text-slate-500 text-sm mt-2">{p.description}</p>
            <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
              Launch Scraper <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Chart Section con Datos Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Extraction Volume (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución Real por Plataforma */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Distribution</h3>
          <div className="space-y-6">
            {Object.entries(metrics?.platform_distribution || {}).map(([platform, count], i) => {
              const percentage = metrics ? Math.round((count / metrics.total_extracted) * 100) : 0;
              const colors: { [key: string]: string } = {
                      ig: 'bg-pink-500',
                      x: 'bg-slate-900',
                      tk: 'bg-black',
                      fb: 'bg-[#1877F2]',
                      yt: 'bg-[#FF0000]'
                    };
              const barColor = colors[platform.toLowerCase()] || 'bg-slate-400';
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{platform.toUpperCase()}</span>
                    <span className="text-slate-500 font-bold">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{width: `${percentage}%`}}></div>
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