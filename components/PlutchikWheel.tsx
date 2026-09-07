import React from 'react';
import { PlutchikEmotions } from '../types';
import { Smile, Shield, AlertCircle, Zap, CloudRain, Flame, Compass, Sparkles } from 'lucide-react';

interface PlutchikWheelProps {
  emotions: PlutchikEmotions;
  sentimientoGlobal?: string | null;
  compact?: boolean;
  className?: string;
}

interface EmotionConfig {
  key: keyof PlutchikEmotions;
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
  barColor: string;
  icon: React.ElementType;
}

const EMOTIONS_CONFIG: EmotionConfig[] = [
  {
    key: 'alegria',
    label: 'Alegría',
    color: '#eab308',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    barColor: 'from-amber-400 to-yellow-500',
    icon: Smile,
  },
  {
    key: 'confianza',
    label: 'Confianza',
    color: '#10b981',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    barColor: 'from-emerald-400 to-teal-500',
    icon: Shield,
  },
  {
    key: 'sorpresa',
    label: 'Sorpresa',
    color: '#06b6d4',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    barColor: 'from-cyan-400 to-blue-400',
    icon: Zap,
  },
  {
    key: 'anticipacion',
    label: 'Anticipación',
    color: '#f97316',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    barColor: 'from-orange-400 to-amber-500',
    icon: Compass,
  },
  {
    key: 'tristeza',
    label: 'Tristeza',
    color: '#6366f1',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    barColor: 'from-indigo-400 to-blue-500',
    icon: CloudRain,
  },
  {
    key: 'miedo',
    label: 'Miedo',
    color: '#059669',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    barColor: 'from-teal-500 to-emerald-600',
    icon: AlertCircle,
  },
  {
    key: 'aversion',
    label: 'Aversión',
    color: '#8b5cf6',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    barColor: 'from-purple-400 to-violet-600',
    icon: Sparkles,
  },
  {
    key: 'ira',
    label: 'Ira',
    color: '#ef4444',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    barColor: 'from-rose-500 to-red-600',
    icon: Flame,
  },
];

export const PlutchikWheel: React.FC<PlutchikWheelProps> = ({
  emotions,
  sentimientoGlobal,
  compact = false,
  className = '',
}) => {
  // Calcular valor máximo para escalar barras
  const values = EMOTIONS_CONFIG.map((cfg) => Number(emotions[cfg.key]) || 0);
  const maxVal = Math.max(...values, 0.01);
  const totalVal = values.reduce((sum, v) => sum + v, 0);

  const getSentimentBadge = (sentiment?: string | null) => {
    if (!sentiment) return null;
    const s = sentiment.toLowerCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    if (s.includes('positi')) {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400';
    } else if (s.includes('negati')) {
      badgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400';
    } else if (s.includes('neutr')) {
      badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        {sentiment}
      </span>
    );
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {sentimientoGlobal && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sentimiento</span>
            {getSentimentBadge(sentimientoGlobal)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {EMOTIONS_CONFIG.map((cfg) => {
            const rawVal = Number(emotions[cfg.key]) || 0;
            const percentage = totalVal > 0 ? Math.round((rawVal / totalVal) * 100) : 0;
            const barPct = Math.min(100, Math.round((rawVal / maxVal) * 100));
            const Icon = cfg.icon;

            return (
              <div
                key={cfg.key}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Icon size={12} style={{ color: cfg.color }} />
                    {cfg.label}
                  </span>
                  <span className="font-mono font-bold text-[10px]" style={{ color: cfg.color }}>
                    {percentage > 0 ? `${percentage}%` : rawVal.toFixed(1)}
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Espectro Emocional de Plutchik
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pesos calculados por el modelo de Databricks
          </p>
        </div>
        {getSentimentBadge(sentimientoGlobal)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EMOTIONS_CONFIG.map((cfg) => {
          const rawVal = Number(emotions[cfg.key]) || 0;
          const percentage = totalVal > 0 ? Math.round((rawVal / totalVal) * 100) : 0;
          const barPct = Math.min(100, Math.round((rawVal / maxVal) * 100));
          const Icon = cfg.icon;

          return (
            <div
              key={cfg.key}
              className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${cfg.bgLight} ${cfg.bgDark} ${cfg.borderColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Icon size={15} style={{ color: cfg.color }} />
                  {cfg.label}
                </span>
                <span className="text-xs font-mono font-black" style={{ color: cfg.color }}>
                  {rawVal.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor} transition-all duration-500`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span>Intensidad</span>
                <span className="font-bold">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
