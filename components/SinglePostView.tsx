import React, { useState } from 'react';
import { 
  Instagram, Twitter, Video, Facebook, Youtube, 
  Search, Play, Loader2, CheckCircle2, AlertCircle, 
  MessageCircle, Heart, Eye, Users, Calendar, 
  ExternalLink, Sparkles, Database, Layers, ArrowRight
} from 'lucide-react';
import { PlatformKey, SinglePostResponse, ScrapeResult } from '../types';
import { scraperApi } from '../api/axiosConfig';
import { PlutchikWheel } from './PlutchikWheel';
import { CommentsDrawer } from './CommentsDrawer';

interface PlatformConfig {
  key: PlatformKey;
  name: string;
  icon: React.ElementType;
  gradient: string;
  badgeColor: string;
  inputLabel: string;
  paramName: string;
  placeholder: string;
  example: string;
  hint: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    key: 'ig',
    name: 'Instagram',
    icon: Instagram,
    gradient: 'from-amber-500 via-rose-500 to-purple-600',
    badgeColor: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    inputLabel: 'URL del Post de Instagram',
    paramName: 'post_url',
    placeholder: 'https://www.instagram.com/p/CODIGO_POST/',
    example: 'https://www.instagram.com/loto_hn/p/C_abc123/',
    hint: 'Pega la URL completa de la publicación o reel.',
  },
  {
    key: 'tk',
    name: 'TikTok',
    icon: Video,
    gradient: 'from-cyan-400 via-slate-900 to-rose-500',
    badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    inputLabel: 'Video ID o URL de TikTok',
    paramName: 'videoId',
    placeholder: '7306132438047116586 o URL',
    example: 'https://www.tiktok.com/@usuario/video/7306132438047116586',
    hint: 'Ingresa el ID numérico o pega el enlace completo y lo extraeremos.',
  },
  {
    key: 'x',
    name: 'X (Twitter)',
    icon: Twitter,
    gradient: 'from-slate-900 via-sky-900 to-sky-600',
    badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    inputLabel: 'Tweet ID o URL del Tweet',
    paramName: 'tweet_id',
    placeholder: '1671370010743263233 o URL',
    example: 'https://x.com/usuario/status/1671370010743263233',
    hint: 'Ingresa el ID del tweet o pega el enlace de X.',
  },
  {
    key: 'fb',
    name: 'Facebook',
    icon: Facebook,
    gradient: 'from-blue-600 to-indigo-700',
    badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    inputLabel: 'URL del Post de Facebook',
    paramName: 'post_url',
    placeholder: 'https://www.facebook.com/photo?fbid=1709187494547460',
    example: 'https://www.facebook.com/pagina/posts/1709187494547460',
    hint: 'Pega la URL del post. Se codificará automáticamente.',
  },
  {
    key: 'yt',
    name: 'YouTube',
    icon: Youtube,
    gradient: 'from-red-600 via-rose-700 to-red-800',
    badgeColor: 'text-red-500 bg-red-500/10 border-red-500/20',
    inputLabel: 'Video ID o URL de YouTube',
    paramName: 'video_id',
    placeholder: 'fX-g6XNrkiA o URL',
    example: 'https://www.youtube.com/watch?v=fX-g6XNrkiA',
    hint: 'Ingresa el ID del video o pega el enlace de YouTube o youtu.be.',
  },
];

export const SinglePostView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('ig');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<SinglePostResponse | null>(null);
  const [history, setHistory] = useState<SinglePostResponse[]>([]);
  
  // Drawer de comentarios
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<{
    id: number | string;
    username: string;
  } | null>(null);

  const activeConfig = PLATFORMS.find(p => p.key === selectedPlatform) || PLATFORMS[0];

  // Auto-limpiador y extractor inteligente de ID/URL
  const extractParamValue = (input: string, platform: PlatformKey): string => {
    const raw = input.trim();
    if (!raw) return '';

    try {
      if (platform === 'yt') {
        if (raw.includes('youtube.com') || raw.includes('youtu.be')) {
          const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          if (url.hostname.includes('youtu.be')) {
            return url.pathname.replace('/', '').split('?')[0];
          }
          const v = url.searchParams.get('v');
          if (v) return v;
          const segments = url.pathname.split('/').filter(Boolean);
          if (segments.includes('shorts')) {
            return segments[segments.indexOf('shorts') + 1] || raw;
          }
        }
      }

      if (platform === 'tk') {
        if (raw.includes('tiktok.com')) {
          const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          const match = url.pathname.match(/\/video\/(\d+)/);
          if (match && match[1]) return match[1];
        }
      }

      if (platform === 'x') {
        if (raw.includes('twitter.com') || raw.includes('x.com')) {
          const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          const match = url.pathname.match(/\/status(?:es)?\/(\d+)/);
          if (match && match[1]) return match[1];
        }
      }
    } catch {
      // Retorna raw si falla el parseo
    }

    return raw;
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanParam = extractParamValue(inputValue, selectedPlatform);

    if (!cleanParam) {
      setError('Por favor ingresa un enlace o identificador válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await scraperApi.scrapeSinglePost(selectedPlatform, cleanParam);
      setCurrentResult(data);
      setHistory(prev => [data, ...prev.filter(h => h.post_id !== data.post_id)]);
    } catch (err: any) {
      console.error('Error al procesar post unitario:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error al procesar la publicación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openComments = (postId: number | string, username: string) => {
    setSelectedPostForComments({ id: postId, username });
    setCommentsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Visual */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
            <Sparkles size={14} />
            Módulo de Extracción Unitaria
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
            Scraping de Publicación Individual
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Analiza cualquier publicación específica de Instagram, TikTok, X, Facebook o YouTube. Extrae métricas clave, comentarios y sentimientos en tiempo real.
          </p>
        </div>
      </div>

      {/* Selector de Red Social */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PLATFORMS.map((plat) => {
          const isSelected = selectedPlatform === plat.key;
          const Icon = plat.icon;

          return (
            <button
              key={plat.key}
              onClick={() => {
                setSelectedPlatform(plat.key);
                setInputValue('');
                setError(null);
              }}
              className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plat.gradient} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">{plat.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">
                  param: {plat.paramName}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Formulario de Entrada */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleExtract} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Search size={14} className="text-blue-500" />
              {activeConfig.inputLabel}
            </label>
            <span className="text-[11px] text-slate-400">
              Ej: <span className="font-mono text-slate-600 dark:text-slate-300">{activeConfig.example}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activeConfig.placeholder}
                className="w-full h-14 pl-5 pr-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-all"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Limpiar
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span>Extraer Post</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            💡 {activeConfig.hint}
          </p>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error en la extracción</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tarjeta de Resultado Actual */}
      {currentResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-500" />
              Resultado de la Extracción
            </h3>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                currentResult.status === 'created'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {currentResult.status === 'created' ? '✨ Creado Nuevo' : '📦 Existente en DB'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ID #{currentResult.post_id}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6">
            {/* Cabecera del post */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-white shadow-md`}>
                  <activeConfig.icon size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      @{currentResult.username}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {currentResult.platform}
                    </span>
                    {currentResult.post?.is_loto && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        Loto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={13} />
                    {currentResult.post?.post_date || currentResult.post?.date || 'Fecha de publicación N/A'}
                  </p>
                </div>
              </div>

              {/* Botón de Comentarios Guardados */}
              <button
                onClick={() => openComments(currentResult.post_id, currentResult.username)}
                className="px-5 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-sm flex items-center justify-center gap-2 transition-all group"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                <span>Ver Comentarios ({currentResult.comments_saved ?? currentResult.post?.comments ?? 0})</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-500" /> Likes
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {(currentResult.post?.likes ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-blue-500" /> Comentarios
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {(currentResult.post?.comments ?? currentResult.comments_saved ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye size={14} className="text-amber-500" /> Vistas
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {(currentResult.post?.views ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-500" /> Seguidores
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {(currentResult.post?.followers ?? currentResult.post?.usuario?.followers ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Texto de la descripción */}
            {currentResult.post?.description && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Descripción del Contenido
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {currentResult.post.description}
                </div>
              </div>
            )}

            {/* Desglose Emocional y de Sentimientos */}
            <PlutchikWheel
              emotions={currentResult.post || {}}
              sentimientoGlobal={currentResult.post?.sentimiento_global}
            />
          </div>
        </div>
      )}

      {/* Historial de la Sesión */}
      {history.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers size={18} className="text-slate-500" />
              Posts Consultados en esta Sesión ({history.length})
            </h4>
            <button
              onClick={() => setHistory([])}
              className="text-xs font-semibold text-rose-500 hover:underline"
            >
              Limpiar historial
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <div
                key={item.post_id}
                onClick={() => setCurrentResult(item)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  currentResult?.post_id === item.post_id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    @{item.username}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.platform}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>Post #{item.post_id}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {item.comments_saved ?? 0} comentarios
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawer de comentarios */}
      <CommentsDrawer
        isOpen={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        postId={selectedPostForComments?.id}
        postUsername={selectedPostForComments?.username}
      />
    </div>
  );
};
