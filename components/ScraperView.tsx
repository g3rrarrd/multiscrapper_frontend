import React, { useState, useRef, useEffect } from 'react';
import { Platform, ScrapeResult } from '../types';
import { 
  FileUp, Trash2, Play, Loader2, 
  Download, Search, Heart, MessageCircle, 
  Instagram, Twitter, Video, History, X, Users
  ,Facebook, Youtube
} from 'lucide-react';

export const ScraperView: React.FC<{ platform: Platform }> = ({ platform: initialPlatform }) => {
  const [currentPlatform, setCurrentPlatform] = useState<Platform>(initialPlatform);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetchingRef = useRef(false);

  // Configuración de API
  const baseUrl = import.meta.env.VITE_API_URL;
  const API_BASE = `${baseUrl}api/scraper`;

  // Efecto para la barra de progreso visual
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
    switch(currentPlatform) {
      case 'yt': return 25;
      case 'x': return 20;
      case 'fb': return 16;
      case 'tk': return 15;
      case 'ig': return 12;
      default: return 10;
    }
  };

  // Limpieza de URLs para extraer solo el username
  const cleanTarget = (input: string): string => {
    let cleaned = input.trim();
    if (!cleaned || cleaned.toLowerCase() === 'link' || cleaned.toLowerCase() === 'username') return '';
    try {
      if (cleaned.includes('http')) {
        const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
        const segments = url.pathname.split('/').filter(s => s.length > 0);
        
        // Lógica para YouTube (Videos o Canales)
        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
          return url.searchParams.get('v') || segments[segments.length - 1].replace('@', '');
        }
        
        // Lógica para Facebook (Grupos o Páginas)
        if (segments.length > 0) {
          let user = segments[0];
          if (['groups', 'pages', 'reels'].includes(user) && segments[1]) user = segments[1];
          return user.split('?')[0];
        }
      }
    } catch (e) {}
    return cleaned.split('?')[0].split('/')[0].replace('@', '');
  };

  // Identificar si el link corresponde a la plataforma activa
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

  // Obtención de resultados (Polling)
  const fetchResults = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams({ 
        platform: currentPlatform.toLowerCase() 
      });
      if (lastStartedAt) params.append('since', lastStartedAt);

      const response = await fetch(`${API_BASE}/latest_results/?${params.toString()}`, {
        method: 'GET',
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const newData: ScrapeResult[] = await response.json();
        
        if (newData.length > 0) {
          setResults(prev => {
            const combined = [...newData, ...prev];
            // Eliminar duplicados por ID
            const uniqueResults = Array.from(
              new Map(combined.map(item => [item.id, item])).values()
            );

            // 2. Lógica de parada: Si ya tenemos lo que esperábamos de la plataforma
            if (uniqueResults.length >= getExpectedCount()) {
              setIsPolling(false);
              setStatus(`Proceso completado con ${uniqueResults.length} registros.`);
              setProgress(100);
            }
            return uniqueResults;
          });
        }
      } else {
        // 3. Si hay error (401, 500, etc.), detenemos el polling para no saturar
        setIsPolling(false);
        setStatus(response.status === 401 ? "Sesión expirada." : "Error al obtener resultados.");
      }
    } catch (error) {
      console.error("Polling error:", error);
      setIsPolling(false); // Detener también si hay error de red
    } finally {
      // 4. CRÍTICO: Liberar el bloqueo siempre, pase lo que pase
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(fetchResults, 3000);
      fetchResults();
    }
    return () => clearInterval(interval);
  }, [isPolling, lastStartedAt]);

  // Disparar el Scraper
  const handleRunScraper = async () => {
    const allLines = manualText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Filtrar targets por plataforma seleccionada
    const targets = allLines
      .filter(line => isCorrectPlatform(line))
      .map(t => cleanTarget(t))
      .filter(t => t !== '');

    if (targets.length === 0) {
      setStatus(`Error: No hay perfiles válidos para ${currentPlatform.toUpperCase()}`);
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setResults([]); 
    setStatus(`Iniciando extracción en ${currentPlatform.toUpperCase()} para: ${targets.join(', ')}`);

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE}/trigger_extraction/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ platform: currentPlatform.toLowerCase(), targets }),
      });

      const data = await response.json();
      if (response.ok) {
        setLastStartedAt(data.started_at); 
        setIsPolling(true); 
        setStatus(`Procesando lista...`);
      } else {
        throw new Error(data.error || 'Error en el servidor');
      }
    } catch (error: any) {
      setStatus(error.message || 'Error al iniciar.');
      setIsPolling(false);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  // Búsqueda histórica en DB
  const handleSearchHistory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setStatus(`Buscando registros de "${searchTerm}"...`);
    
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE}/user_history/?query=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setStatus(`Encontrados ${data.length} registros.`);
      } else {
        setResults([]);
        setStatus("Sin coincidencias en la base de datos.");
      }
    } catch (error) {
      setStatus("Error de conexión.");
    } finally {
      setIsSearching(false);
    }
  };

  // Carga de Archivo CSV
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
        setStatus("Archivo vacío o inválido.");
        return;
      }

      setManualText(lines.join('\n'));
      setStatus(`${lines.length} perfiles cargados. Filtro de plataforma activo.`);
      setInputMode('manual');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Exportar a CSV
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
        r.platform?.toUpperCase() || currentPlatform.toUpperCase(),
        `"${r.username}"`,
        r.followers || 0,
        r.post_date || '',
        r.likes || 0,
        r.comments || 0,
        r.views || 0,
        r.is_loto ? 'YES' : 'NO',
        r.sentimiento_global || 'N/A',
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

  return (
    <div className="space-y-6">
      {/* Barra de progreso superior */}
      {(isProcessing || isPolling) && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-700 ease-in-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Header y Selector de Red Social */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-full lg:w-auto flex items-center gap-3 sm:gap-4 min-w-0">
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${currentPlatform === 'ig' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white' : currentPlatform === 'tk' ? 'bg-black text-white' : 'bg-blue-400 text-white'}`}>
                {currentPlatform === 'ig' && <Instagram size={24} />}
                {currentPlatform === 'tk' && <Video size={24} />}
                {currentPlatform === 'x' && <Twitter size={24} />}
                {currentPlatform === 'fb' && <Facebook size={24} />}
                {currentPlatform === 'yt' && <Youtube size={24} />}
            </div>
            <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight truncate">{currentPlatform} Scraper</h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versión 1.0 - Alcance Completo</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap lg:flex-nowrap bg-slate-100 p-1 rounded-xl gap-1 w-full lg:w-auto">
          {['ig', 'tk', 'x', 'fb', 'yt'].map((id) => (
            <button
              key={id}
              onClick={() => {
                setCurrentPlatform(id as Platform);
                setResults([]);
                setIsPolling(false);
                setIsProcessing(false);
                setStatus(null);
              }}
              className={`w-full md:w-auto px-2.5 sm:px-4 md:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold leading-tight text-center whitespace-nowrap transition-all ${currentPlatform === id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {id === 'ig' ? 'Instagram' : id === 'tk' ? 'TikTok' : id === 'x' ? 'X / Twitter' : id === 'fb' ? 'Facebook' : 'YouTube'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PANEL DE ENTRADA */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="flex border-b bg-slate-50 text-[10px] font-black uppercase tracking-widest">
              <button onClick={() => setInputMode('manual')} className={`flex-1 py-4 ${inputMode === 'manual' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Manual</button>
              <button onClick={() => setInputMode('file')} className={`flex-1 py-4 ${inputMode === 'file' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Cargar CSV</button>
            </div>
            <div className="p-6">
              {inputMode === 'manual' ? (
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={`Ejemplo:\nhttps://instagram.com/usuario\n@perfil\nusuario_123`}
                  className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all resize-none"
                />
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-16 flex flex-col items-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                  <FileUp size={40} className="text-slate-300 group-hover:text-blue-500 mb-4 transition-colors" />
                  <p className="text-sm font-bold text-slate-600 text-center">Seleccionar Archivo</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                </div>
              )}
              <button 
                onClick={handleRunScraper} 
                disabled={isProcessing || !manualText.trim()}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                EXTRAER AHORA
              </button>
              {status && (
                <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-mono flex items-center gap-2">
                  <span className="text-blue-400 animate-pulse">❯</span> {status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DE RESULTADOS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
            
            {/* Buscador en Base de Datos */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <form onSubmit={handleSearchHistory} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar en historial por usuario o regex..."
                  className="block w-full pl-10 pr-32 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 gap-1">
                  {searchTerm && (
                    <button type="button" onClick={() => setSearchTerm('')} className="p-1.5 text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching || !searchTerm}
                    className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50 transition-all"
                  >
                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
                    BUSCAR DB
                  </button>
                </div>
              </form>
            </div>

            {/* Cabecera de Tabla */}
            <div className="p-6 border-b flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-800">Panel de Datos</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{results.length} registros</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={downloadCSV} 
                  disabled={results.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-30 transition-all"
                >
                  <Download size={14}/> CSV
                </button>
                <button 
                  onClick={() => { setResults([]); setStatus(null); }} 
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>

            {/* Tabla Principal */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Perfil / Red</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Seguidores</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Engagement</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-32 text-center text-slate-300">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium italic">Sin datos para mostrar</p>
                      </td>
                    </tr>
                  ) : (
                    results.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${
                              res.platform === 'ig' ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 
                              res.platform === 'tk' ? 'bg-black' : 'bg-blue-400'
                            } text-white`}>
                              {res.platform === 'ig' && <Instagram size={12} />}
                              {res.platform === 'tk' && <Video size={12} />}
                              {res.platform === 'x' && <Twitter size={12} />}
                              {res.platform === 'fb' && <Facebook size={12} />}
                              {res.platform === 'yt' && <Youtube size={12} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">@{res.username}</p>
                              <p className="text-[9px] text-slate-400 font-mono uppercase">{res.platform}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-700">{res.followers?.toLocaleString() || 'N/A'}</span>
                            <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Users size={8}/> FANS</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-4 text-xs font-black">
                            <span className="text-rose-500 flex items-center gap-1"><Heart size={12} fill="currentColor"/> {res.likes?.toLocaleString() || 0}</span>
                            <span className="text-blue-500 flex items-center gap-1"><MessageCircle size={12} fill="currentColor"/> {res.comments || 0}</span>
                          </div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-600">
                          {res.post_date || 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${
                            res.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            res.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                            'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {res.sentiment || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};