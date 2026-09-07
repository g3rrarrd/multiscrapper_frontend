import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, MessageSquare, Search, Download, Loader2, 
  Calendar, ArrowUpDown, Instagram, Twitter, Video, 
  Facebook, Youtube, MessageCircle
} from 'lucide-react';
import { PostComment } from '../types';
import { scraperApi } from '../api/axiosConfig';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string | number | null;
  postUsername?: string;
  userQuery?: {
    username: string;
    platform: string;
  } | null;
  initialComments?: PostComment[];
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  postId,
  postUsername,
  userQuery,
  initialComments,
}) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [userTotals, setUserTotals] = useState<{ totalPosts?: number; totalComments?: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setComments([]);
      setSearchTerm('');
      setError(null);
      setUserTotals(null);
      return;
    }

    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
      return;
    }

    const loadComments = async () => {
      setLoading(true);
      setError(null);
      try {
        if (postId) {
          const data = await scraperApi.getPostComments(postId);
          setComments(data);
        } else if (userQuery) {
          const res = await scraperApi.getUserComments(userQuery.username, userQuery.platform);
          setComments(res.comments || []);
          setUserTotals({
            totalPosts: res.total_posts,
            totalComments: res.total_comments,
          });
        }
      } catch (err: any) {
        console.error('Error cargando comentarios:', err);
        setError(err.response?.data?.error || err.message || 'No se pudieron obtener los comentarios.');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [isOpen, postId, userQuery, initialComments]);

  // Filtrado y ordenamiento de comentarios
  const filteredComments = useMemo(() => {
    let result = [...comments];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => (c.texto || '').toLowerCase().includes(term));
    }

    result.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [comments, searchTerm, sortOrder]);

  const exportCSV = () => {
    if (comments.length === 0) return;
    const headers = ['ID', 'Post_ID', 'Platform', 'Fecha', 'Comentario'];
    const rows = filteredComments.map((c) => [
      c.id ?? '',
      c.post ?? (postId ?? ''),
      c.platform ?? '',
      c.created_at ?? '',
      `"${(c.texto || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `comentarios_${postId || userQuery?.username || 'export'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlatformIcon = (plat?: string) => {
    const p = (plat || '').toLowerCase();
    if (p === 'ig') return <Instagram size={14} className="text-pink-500" />;
    if (p === 'tk') return <Video size={14} className="text-cyan-400" />;
    if (p === 'x') return <Twitter size={14} className="text-sky-400" />;
    if (p === 'fb') return <Facebook size={14} className="text-blue-500" />;
    if (p === 'yt') return <Youtube size={14} className="text-red-500" />;
    return <MessageCircle size={14} className="text-slate-400" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Fecha no disponible';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {postId ? `Comentarios del Post #${postId}` : `Comentarios de @${userQuery?.username}`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {postUsername && `Publicado por @${postUsername} • `}
              {userQuery && `Historial en ${userQuery.platform.toUpperCase()} • `}
              {comments.length} comentarios registrados
            </p>
            {userTotals && (
              <div className="flex items-center gap-3 pt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Total Posts: {userTotals.totalPosts}</span>
                <span>•</span>
                <span>Total Comentarios: {userTotals.totalComments}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Búsqueda, orden y exportar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en comentarios..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Cambiar orden de fecha"
            >
              <ArrowUpDown size={14} />
              <span>{sortOrder === 'desc' ? 'Más recientes' : 'Más antiguos'}</span>
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredComments.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-all shadow-sm"
              title="Descargar CSV con comentarios"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Contenido de comentarios */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium">Cargando comentarios...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <span>{error}</span>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <MessageSquare size={48} className="stroke-[1.2] opacity-30 mb-3" />
              <p className="text-base font-bold text-slate-700 dark:text-slate-300">Sin comentarios encontrados</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 max-w-xs mt-1">
                {searchTerm ? 'No hay coincidencias para el término buscado.' : 'Esta publicación no contiene comentarios guardados en la base de datos.'}
              </p>
            </div>
          ) : (
            filteredComments.map((comment, index) => (
              <div
                key={comment.id || `c-${index}`}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
                      {(comment.platform || 'C').charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {getPlatformIcon(comment.platform)}
                      <span className="uppercase text-[11px] font-mono text-slate-500">
                        {comment.platform || 'General'}
                      </span>
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    {formatDate(comment.created_at)}
                  </span>
                </div>

                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap pl-8">
                  {comment.texto}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {filteredComments.length} de {comments.length} comentarios</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
