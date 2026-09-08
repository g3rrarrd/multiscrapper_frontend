import React, { useState, useRef, useEffect } from 'react';
import { Platform, ScrapeResult, PlatformKey } from '../types';
import { 
  FileUp, Trash2, Play, Loader2, 
  Download, Search, Heart, MessageCircle, 
  Instagram, Twitter, Video, History, X, Users,
  Facebook, Youtube, Eye, MessageSquare, Layers,
  ChevronDown, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { scraperApi } from '../api/axiosConfig';
import { SinglePostView } from './SinglePostView';
import { CommentsDrawer } from './CommentsDrawer';
import { PlutchikWheel } from './PlutchikWheel';

interface ScraperViewProps {
  platform?: Platform | PlatformKey;
}

export const ScraperView: React.FC<ScraperViewProps> = ({ platform: initialPlatform = Platform.INSTAGRAM }) => {
  const [activeMode, setActiveMode] = useState<'bulk' | 'single'>('bulk');
  const [currentPlatform, setCurrentPlatform] = useState<PlatformKey>(
    (initialPlatform as PlatformKey) || 'ig'
  );
  const [inputMode, setInputMode] = useState<'manual' | 'file'>('manual');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastStartedAt, setLastStartedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | number | null>(null);

  // Drawer de comentarios
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id?: string | number; username?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);

  // Efecto para la barra de progreso
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 400);
      return () => clearInterval(interval);
    } else if (!isPolling) {
      setProgress(0);
    }
  }, [isProcessing, isPolling]);

  const getExpectedCount = () => {
    switch (currentPlatform) {
      case 'yt': return 25;
      case 'x': return 19;
      case 'fb': return 16;
      case 'tk': return 15;
      case 'ig': return 12;
      default: return 10;
    }
  };

  const cleanTarget = (input: string): string => {
    let cleaned = input.trim();
    if (!cleaned || cleaned.toLowerCase() === 'link' || cleaned.toLowerCase() === 'username') return '';
    try {
      if (cleaned.includes('http')) {
        const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
        const segments = url.pathname.split('/').filter(s => s.length > 0);
        
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
          return (url.searchParams.get('v') || segments[segments.length - 1]).replace('@', '');
        }
        
        if (segments.length > 0) {
          let user = segments[0];
          if (['groups', 'pages', 'reels'].includes(user) && segments[1]) user = segments[1];
          // Limpiamos parámetros de URL y quitamos el '@'
          return user.split('?')[0].replace('@', '');
        }
      }
    } catch {
      // Ignorar fallo de parseo
    }
    // Para casos que no son URL o caen aquí por respaldo, también quitamos el '@'
    return cleaned.split('?')[0].split('/')[0].replace('@', '');
  };

  const isCorrectPlatform = (line: string): boolean => {
    const l = line.toLowerCase();
    if (!l.includes('http')) return true; 
    if (currentPlatform === 'ig') return l.includes('instagram.com');
    if (currentPlatform === 'tk') return l.includes('tiktok.com');
    if (currentPlatform === 'x') return l.includes('twitter.com') || l.includes('x.com');
    if (currentPlatform === 'fb') return l.includes('facebook.com') || l.includes('fb.com');
    if (currentPlatform === 'yt') return l.includes('youtube.com') || l.includes('youtu.be');
    return false;
  };

  const fetchResults = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      const newData = await scraperApi.getLatestResults({
        platform: currentPlatform,
        since: lastStartedAt || undefined,
      });

      if (newData.length > 0) {
        setResults(prev => {
          const combined = [...newData, ...prev];
          const uniqueResults = Array.from(
            new Map(combined.map(item => [item.id, item])).values()
          );

          if (uniqueResults.length >= getExpectedCount()) {
            setIsPolling(false);
            setStatus(`Extracción completada con ${uniqueResults.length} publicaciones.`);
            setProgress(100);
          }
          return uniqueResults;
        });
      }
    } catch (error: any) {
      console.error('Polling error:', error);
      setIsPolling(false);
      setStatus(error.response?.status === 401 ? 'Sesión expirada.' : 'Error al obtener resultados.');
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(fetchResults, 16000);
      fetchResults();
    }
    return () => clearInterval(interval);
  }, [isPolling, lastStartedAt]);

  const handleRunScraper = async () => {
    const allLines = manualText.split('\n').map(l => l.trim()).filter(Boolean);
    const targets = allLines
      .filter(line => isCorrectPlatform(line))
      .map(t => cleanTarget(t))
      .filter(Boolean);

    if (targets.length === 0) {
      setStatus(`Error: No hay objetivos válidos para ${currentPlatform.toUpperCase()}`);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setResults([]); 
    setStatus(`Iniciando extracción en ${currentPlatform.toUpperCase()} para: ${targets.join(', ')}`);

    try {
      const data = await scraperApi.triggerExtraction(currentPlatform, targets);
      setLastStartedAt(data.started_at); 
      setIsPolling(true); 
      setStatus(`Procesando lista en hilos daemon del servidor...`);
    } catch (error: any) {
      setStatus(error.response?.data?.error || error.message || 'Error al iniciar extracción.');
      setIsPolling(false);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchHistory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setStatus(`Buscando en base de datos para "${searchTerm}"...`);
    
    try {
      const data = await scraperApi.getUserHistory(searchTerm);
      setResults(data);
      setStatus(`Encontradas ${data.length} coincidencias en el historial.`);
    } catch {
      setStatus('Error de conexión al consultar historial.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/)
        .map(line => line.replace(/[",]/g, '').trim()) 
        .filter(line => {
          const l = line.toLowerCase();
          return l.length > 0 && l !== 'link' && l !== 'username';
        });

      if (lines.length === 0) {
        setStatus('Archivo vacío o sin formato reconocido.');
        return;
      }

      setManualText(lines.join('\n'));
      setStatus(`${lines.length} objetivos cargados desde CSV.`);
      setInputMode('manual');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const headers = [
      'ID', 'Platform', 'Username', 'Followers', 'Date', 'Likes', 'Comments', 
      'Views', 'Is Loto', 'Global Sentiment', 'Joy', 'Trust', 'Fear', 
      'Surprise', 'Sadness', 'Disgust', 'Anger', 'Anticipation', 'Description'
    ];
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...results.map(r => [
        r.id,
        (r.platform || currentPlatform).toUpperCase(),
        `"${r.username}"`,
        r.followers || 0,
        r.post_date || r.date || '',
        r.likes || 0,
        r.comments || 0,
        r.views || 0,
        r.is_loto ? 'YES' : 'NO',
        r.sentimiento_global || r.sentiment || 'N/A',
        r.alegria || 0,
        r.confianza || 0,
        r.miedo || 0,
        r.sorpresa || 0,
        r.tristeza || 0,
        r.aversion || 0,
        r.ira || 0,
        r.anticipacion || 0,
        `"${(r.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${currentPlatform}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openComments = (postId: string | number, username: string) => {
    setCommentTarget({ id: postId, username });
    setCommentsDrawerOpen(true);
  };

  const PLATFORM_ICONS: Record<string, React.ElementType> = {
    ig: Instagram,
    tk: Video,
    x: Twitter,
    fb: Facebook,
    yt: Youtube,
  };

  const PLATFORM_COLORS: Record<string, string> = {
    ig: 'from-amber-400 via-rose-500 to-purple-600',
    tk: 'from-cyan-400 to-rose-500',
    x: 'from-slate-900 to-sky-600',
    fb: 'from-blue-600 to-indigo-700',
    yt: 'from-red-600 to-rose-700',
  };

  return (
    <div className="space-y-6">
      {/* Barra de progreso */}
      {(isProcessing || isPolling) && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-slate-100 dark:bg-slate-800">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Selector de Modo: Extracción Masiva vs Post Individual */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveMode('bulk')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'bulk'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers size={16} />
            <span>Extracción Masiva</span>
          </button>
          <button
            onClick={() => setActiveMode('single')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'single'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} className="text-amber-500" />
            <span>Post Individual</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API 5 Redes Disponibles</span>
        </div>
      </div>

      {/* Si el modo activo es Post Individual, renderizamos SinglePostView */}
      {activeMode === 'single' ? (
        <SinglePostView />
      ) : (
        <>
          {/* Header y Selector de Red Social para Masivo */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-tr ${PLATFORM_COLORS[currentPlatform]} text-white shadow-md`}>
                {React.createElement(PLATFORM_ICONS[currentPlatform] || MessageSquare, { size: 24 })}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Scraper Masivo: {currentPlatform === 'ig' ? 'Instagram' : currentPlatform === 'tk' ? 'TikTok' : currentPlatform === 'x' ? 'X / Twitter' : currentPlatform === 'fb' ? 'Facebook' : 'YouTube'}
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Extracción Asíncrona con Análisis Databricks
                </p>
              </div>
            </div>

            {/* Redes */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full lg:w-auto">
              {(['ig', 'tk', 'x', 'fb', 'yt'] as PlatformKey[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setCurrentPlatform(id);
                    setResults([]);
                    setIsPolling(false);
                    setIsProcessing(false);
                    setStatus(null);
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentPlatform === id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {id === 'ig' ? 'Instagram' : id === 'tk' ? 'TikTok' : id === 'x' ? 'X' : id === 'fb' ? 'Facebook' : 'YouTube'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PANEL DE ENTRADA */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-6">
                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider">
                  <button 
                    onClick={() => setInputMode('manual')} 
                    className={`flex-1 py-3.5 transition-colors ${
                      inputMode === 'manual' 
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Manual
                  </button>
                  <button 
                    onClick={() => setInputMode('file')} 
                    className={`flex-1 py-3.5 transition-colors ${
                      inputMode === 'file' 
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Cargar CSV
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {inputMode === 'manual' ? (
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder={`Ingresa un objetivo por línea:\nhttps://${currentPlatform === 'ig' ? 'instagram.com/usuario' : currentPlatform === 'tk' ? 'tiktok.com/@usuario' : currentPlatform === 'yt' ? 'youtube.com/@canal' : 'facebook.com/pagina'}\n@perfil_objetivo\nnombre_usuario`}
                      className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200 transition-all resize-none placeholder:text-slate-400"
                    />
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-all group text-center"
                    >
                      <FileUp size={36} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 mb-3 transition-colors" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Seleccionar archivo CSV</p>
                      <p className="text-xs text-slate-400 mt-1">Una columna con nombres o enlaces</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </div>
                  )}

                  <button 
                    onClick={handleRunScraper} 
                    disabled={isProcessing || !manualText.trim()}
                    className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                    <span>INICIAR EXTRACCIÓN</span>
                  </button>

                  {status && (
                    <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-mono flex items-start gap-2.5">
                      <span className="text-blue-400 animate-pulse mt-0.5">❯</span>
                      <span className="leading-relaxed">{status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL DE RESULTADOS */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[820px]">
                
                {/* Buscador Histórico */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
                  <form onSubmit={handleSearchHistory} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar en historial por username o regex (ej: * o .*noticias.*)..."
                      className="block w-full pl-10 pr-32 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-1">
                      {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="p-1 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSearching || !searchTerm}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
                      >
                        {isSearching ? <Loader2 size={13} className="animate-spin" /> : <History size={13} />}
                        <span>BUSCAR DB</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Cabecera de Tabla */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">Publicaciones Extraídas</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{results.length} registros</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadCSV} 
                      disabled={results.length === 0}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all shadow-sm"
                    >
                      <Download size={13}/> <span>CSV</span>
                    </button>
                    <button 
                      onClick={() => { setResults([]); setStatus(null); }} 
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
                      title="Limpiar lista"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>

                {/* Tabla de Publicaciones */}
                <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {results.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-16 text-center text-slate-400">
                      <Search size={48} className="stroke-[1.2] opacity-25 mb-3" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Sin datos para mostrar</p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        Inicia una extracción masiva o busca en el historial de la base de datos.
                      </p>
                    </div>
                  ) : (
                    results.map((res) => {
                      const Icon = PLATFORM_ICONS[res.platform] || MessageSquare;
                      const isExpanded = expandedPostId === res.id;

                      return (
                        <div key={res.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl bg-gradient-to-tr ${PLATFORM_COLORS[res.platform] || 'from-slate-700 to-slate-900'} text-white shadow-sm`}>
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900 dark:text-white">
                                    @{res.username}
                                  </span>
                                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {res.platform}
                                  </span>
                                  {res.is_loto && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                      Loto
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {res.post_date || res.date || 'Fecha N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Métricas y Acciones */}
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1 text-rose-500" title="Likes">
                                <Heart size={14} fill="currentColor" /> {res.likes?.toLocaleString() || 0}
                              </span>

                              <button
                                onClick={() => openComments(res.id, res.username)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 transition-colors"
                                title="Ver comentarios de esta publicación"
                              >
                                <MessageCircle size={14} />
                                <span>{res.comments?.toLocaleString() || 0}</span>
                              </button>

                              <span className="flex items-center gap-1 text-slate-500" title="Vistas">
                                <Eye size={14} /> {res.views?.toLocaleString() || 0}
                              </span>

                              <button
                                onClick={() => setExpandedPostId(isExpanded ? null : res.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                title="Ver emociones y descripción"
                              >
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Vista expandida con descripción y PlutchikWheel */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                              {res.description && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-sans leading-relaxed">
                                  {res.description}
                                </p>
                              )}

                              <PlutchikWheel
                                emotions={res}
                                sentimientoGlobal={res.sentimiento_global || res.sentiment}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drawer para comentarios */}
      <CommentsDrawer
        isOpen={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        postId={commentTarget?.id}
        postUsername={commentTarget?.username}
      />
    </div>
  );
};