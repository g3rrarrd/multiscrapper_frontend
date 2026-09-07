import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Filter,
  Globe,
  Loader2,
  Search,
  Users,
  MessageSquare,
  Heart,
  Eye,
  Sparkles,
  Instagram,
  Twitter,
  Video,
  Facebook,
  Youtube,
  MessageCircle,
  ChevronRight
} from 'lucide-react';
import api from '../api/axiosConfig';
import { scraperApi } from '../api/axiosConfig';
import { PlutchikWheel } from './PlutchikWheel';
import { CommentsDrawer } from './CommentsDrawer';

type ScrapePost = Record<string, any>;

type InfluencerDetails = {
  username: string;
  total_posts: number;
  latest_platform: string;
  latest_followers: number;
  latest_post_date: string | null;
  last_updated: string | null;
  sentimiento_global?: string | null;
  is_loto?: boolean;
  alegria?: number | null;
  confianza?: number | null;
  miedo?: number | null;
  sorpresa?: number | null;
  tristeza?: number | null;
  aversion?: number | null;
  ira?: number | null;
  anticipacion?: number | null;
  posts: ScrapePost[];
};

type InfluencerProfilePayload = {
  influencer?: InfluencerDetails;
  influencers_list?: string[];
  error?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const safeString = (value: unknown) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getPostFieldValue = (post: ScrapePost, field: string): unknown => {
  if (field === 'all') return Object.values(post).join(' ');
  return post[field];
};

export const PerfilInfluencer: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState('');
  const [influencersList, setInfluencersList] = useState<string[]>([]);
  const [listFilter, setListFilter] = useState('');
  const [regexMode, setRegexMode] = useState(false);
  const [profile, setProfile] = useState<InfluencerDetails | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [postFilterField, setPostFilterField] = useState('all');
  const [postFilterText, setPostFilterText] = useState('');
  const [postRegexMode, setPostRegexMode] = useState(false);
  const [postDateFrom, setPostDateFrom] = useState('');
  const [postDateTo, setPostDateTo] = useState('');
  const [postIsLotoFilter, setPostIsLotoFilter] = useState<'all' | 'true' | 'false'>('all');

  // Drawer de comentarios
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<{ id?: string | number; username?: string } | null>(null);
  const [userCommentsQuery, setUserCommentsQuery] = useState<{ username: string; platform: string } | null>(null);

  const regexError = useMemo(() => {
    if (!regexMode || !listFilter.trim()) return null;
    try {
      new RegExp(listFilter, 'i');
      return null;
    } catch {
      return 'Expresión regular inválida';
    }
  }, [regexMode, listFilter]);

  const filteredInfluencers = useMemo(() => {
    const term = listFilter.trim();
    if (!term) return influencersList;

    if (regexMode) {
      if (regexError) return influencersList;
      const pattern = new RegExp(term, 'i');
      return influencersList.filter((item) => pattern.test(item));
    }

    const normalized = term.toLowerCase();
    return influencersList.filter((item) => item.toLowerCase().includes(normalized));
  }, [influencersList, listFilter, regexMode, regexError]);

  const postRegexError = useMemo(() => {
    if (!postRegexMode || !postFilterText.trim()) return null;
    try {
      new RegExp(postFilterText, 'i');
      return null;
    } catch {
      return 'Regex de posts inválida';
    }
  }, [postFilterText, postRegexMode]);

  const postFieldOptions = useMemo(() => {
    const defaults = ['all', 'platform', 'post_date', 'date', 'followers', 'likes', 'comments', 'views', 'description', 'sentimiento_global', 'is_loto'];
    const dynamic = profile?.posts.flatMap((post) => Object.keys(post)) ?? [];
    return Array.from(new Set([...defaults, ...dynamic]));
  }, [profile]);

  const filteredPosts = useMemo(() => {
    if (!profile) return [];
    const term = postFilterText.trim();

    let byText = profile.posts;
    if (term) {
      if (postRegexMode) {
        if (postRegexError) return profile.posts;
        const pattern = new RegExp(term, 'i');
        byText = profile.posts.filter((post) => {
          const value = safeString(getPostFieldValue(post, postFilterField));
          return pattern.test(value);
        });
      } else {
        const normalized = term.toLowerCase();
        byText = profile.posts.filter((post) => {
          const value = safeString(getPostFieldValue(post, postFilterField)).toLowerCase();
          return value.includes(normalized);
        });
      }
    }

    let byLoto = byText;
    if (postIsLotoFilter !== 'all') {
      const expected = postIsLotoFilter === 'true';
      byLoto = byText.filter((post) => post.is_loto === expected);
    }

    if (!postDateFrom && !postDateTo) return byLoto;

    const start = postDateFrom ? new Date(`${postDateFrom}T00:00:00`) : null;
    const end = postDateTo ? new Date(`${postDateTo}T23:59:59`) : null;

    return byLoto.filter((post) => {
      const rawDate = post.post_date ?? post.date;
      if (!rawDate) return false;
      const current = new Date(String(rawDate));
      if (Number.isNaN(current.getTime())) return false;
      if (start && current < start) return false;
      if (end && current > end) return false;
      return true;
    });
  }, [
    profile,
    postFilterField,
    postFilterText,
    postRegexMode,
    postRegexError,
    postIsLotoFilter,
    postDateFrom,
    postDateTo,
  ]);

  const loadInfluencersList = async () => {
    setIsLoadingList(true);
    setStatusMessage(null);

    try {
      // Obtener todos los posts y extraer usernames únicos
      const posts = await scraperApi.getUserHistory('*');
      const uniqueUsernames = Array.from(new Set(posts.map((p: any) => p.username).filter(Boolean))) as string[];
      setInfluencersList(uniqueUsernames.sort());
    } catch (error: any) {
      console.error('Error cargando lista de influencers:', error);
      setStatusMessage('No se pudo cargar la lista de influencers.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadInfluencersList();
  }, []);

  const handleSearchProfile = async (targetUsername?: string) => {
    const username = (targetUsername || usernameInput).trim();
    if (!username) {
      setStatusMessage('Escribe un username para consultar el perfil 360.');
      return;
    }

    setIsSearching(true);
    setStatusMessage(null);

    try {
      // Usar user_history para buscar posts del usuario
      const posts = await scraperApi.getUserHistory(username);

      if (!posts || posts.length === 0) {
        setProfile(null);
        setStatusMessage(`No se encontraron posts para el usuario "${username}".`);
        return;
      }

      // Agregar datos del perfil desde los posts
      const latestPost = posts[0];
      const sentimientos = {
        alegria: latestPost.alegria,
        confianza: latestPost.confianza,
        miedo: latestPost.miedo,
        sorpresa: latestPost.sorpresa,
        tristeza: latestPost.tristeza,
        aversion: latestPost.aversion,
        ira: latestPost.ira,
        anticipacion: latestPost.anticipacion,
      };

      const builtProfile: InfluencerDetails = {
        username: latestPost.username,
        total_posts: posts.length,
        latest_platform: latestPost.platform,
        latest_followers: latestPost.followers ?? latestPost.usuario?.followers ?? 0,
        latest_post_date: latestPost.post_date ?? latestPost.date ?? latestPost.created_at ?? null,
        last_updated: latestPost.created_at ?? null,
        sentimiento_global: latestPost.sentimiento_global ?? null,
        is_loto: latestPost.is_loto,
        ...sentimientos,
        posts,
      };

      setProfile(builtProfile);
      setPostFilterField('all');
      setPostFilterText('');
      setPostRegexMode(false);
      setPostDateFrom('');
      setPostDateTo('');
      setPostIsLotoFilter('all');
      setStatusMessage(null);
    } catch (error: any) {
      setProfile(null);
      const msg = error?.response?.data?.error ?? 'No se pudo consultar el perfil del influencer.';
      setStatusMessage(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    const p = (platform || '').toLowerCase();
    if (p === 'ig') return <Instagram size={14} className="text-pink-500" />;
    if (p === 'tk') return <Video size={14} className="text-cyan-400" />;
    if (p === 'x') return <Twitter size={14} className="text-sky-400" />;
    if (p === 'fb') return <Facebook size={14} className="text-blue-500" />;
    if (p === 'yt') return <Youtube size={14} className="text-red-500" />;
    return <Globe size={14} className="text-slate-400" />;
  };

  const openPostComments = (postId: string | number, username: string) => {
    setUserCommentsQuery(null);
    setSelectedPostComments({ id: postId, username });
    setCommentsDrawerOpen(true);
  };

  const openAllUserComments = () => {
    if (!profile) return;
    setSelectedPostComments(null);
    setUserCommentsQuery({
      username: profile.username,
      platform: profile.latest_platform || 'tk',
    });
    setCommentsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Header Visual */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Perfil 360 de Influencer
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Analiza el rendimiento global, huella multired, espectro de sentimientos Plutchik y comentarios.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Barra Lateral: Buscador y Lista de Perfiles */}
        <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-5 space-y-5 h-fit">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearchProfile(); }} 
            className="space-y-3"
          >
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Buscar Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="ej: loto_hn"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-500/10"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Buscar</span>
              </button>
            </div>
          </form>

          {/* Listado con filtro */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Influencers en Base de Datos
              </label>
              <button
                type="button"
                onClick={loadInfluencersList}
                disabled={isLoadingList}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold disabled:text-slate-400"
              >
                {isLoadingList ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  placeholder={regexMode ? 'Ej: ^loto|noticias$' : 'Filtrar nombre...'}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={regexMode}
                  onChange={(e) => setRegexMode(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Habilitar Regex</span>
              </label>

              {regexError && (
                <p className="text-xs text-rose-500 font-medium">{regexError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 font-bold flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <span>Coincidencias</span>
                <span className="font-mono">{filteredInfluencers.length}</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {isLoadingList ? (
                  <div className="p-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-500" /> Cargando listado...
                  </div>
                ) : filteredInfluencers.length > 0 ? (
                  filteredInfluencers.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setUsernameInput(name);
                        handleSearchProfile(name);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors flex items-center justify-between group"
                    >
                      <span>@{name}</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-400 text-center">Sin resultados.</div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Sección Principal de Datos */}
        <section className="space-y-6 min-w-0">
          {statusMessage && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium">{statusMessage}</p>
            </div>
          )}

          {!profile ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 shadow-sm">
              <Search size={54} className="stroke-[1.2] opacity-20" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Selecciona o busca un influencer</h3>
              <p className="text-xs max-w-sm text-slate-400">
                Podrás ver sus métricas acumuladas, publicaciones completas, espectro emocional y consultar todos sus comentarios.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjetas de Estadísticas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                  <p className="text-xs uppercase font-bold text-slate-500">Handle Oficial</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">@{profile.username}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                      Plataforma: {profile.latest_platform || 'N/A'}
                    </span>
                    {profile.is_loto && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        Loto Contenido
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                  <p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-500" /> Seguidores Actuales
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {profile.latest_followers.toLocaleString('es-ES')}
                  </p>
                  <p className="text-[11px] text-slate-400">Actualizado según DimUsuario</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                  <p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-indigo-500" /> Publicaciones
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {profile.total_posts.toLocaleString('es-ES')}
                  </p>
                  <p className="text-[11px] text-slate-400">Última fecha: {formatDate(profile.latest_post_date)}</p>
                </div>
              </div>

              {/* Espectro Emocional Plutchik del Influencer */}
              <PlutchikWheel
                emotions={profile}
                sentimientoGlobal={profile.sentimiento_global}
              />

              {/* Botón de acción: Explorar todos los comentarios del usuario */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                <div className="space-y-1">
                  <h4 className="font-bold text-base flex items-center gap-2">
                    <MessageSquare size={18} />
                    Comentarios Registrados de @{profile.username}
                  </h4>
                  <p className="text-xs text-blue-100">
                    Consulta el total de comentarios acumulados de este perfil en {profile.latest_platform.toUpperCase()}.
                  </p>
                </div>
                <button
                  onClick={openAllUserComments}
                  className="px-5 py-2.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 transition-all shrink-0 shadow-sm"
                >
                  <MessageCircle size={16} />
                  <span>Explorar Comentarios del Perfil</span>
                </button>
              </div>

              {/* Listado y Filtros de Publicaciones del Influencer */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Publicaciones Extraídas
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {filteredPosts.length} / {profile.posts.length} posts
                  </span>
                </div>

                {/* Filtros dinámicos */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-center">
                    <select
                      value={postFilterField}
                      onChange={(e) => setPostFilterField(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {postFieldOptions.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={postFilterText}
                      onChange={(e) => setPostFilterText(e.target.value)}
                      placeholder={postRegexMode ? 'Regex en posts...' : 'Filtrar posts por texto...'}
                      className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={postRegexMode}
                        onChange={(e) => setPostRegexMode(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Regex</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={postIsLotoFilter}
                      onChange={(e) => setPostIsLotoFilter(e.target.value as any)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="all">Filtro Loto: Todos</option>
                      <option value="true">Contenido Loto: SÍ</option>
                      <option value="false">Contenido Loto: NO</option>
                    </select>
                    <input
                      type="date"
                      value={postDateFrom}
                      onChange={(e) => setPostDateFrom(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      title="Desde"
                    />
                    <input
                      type="date"
                      value={postDateTo}
                      onChange={(e) => setPostDateTo(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      title="Hasta"
                    />
                  </div>
                  {postRegexError && <p className="text-xs text-rose-500 font-medium">{postRegexError}</p>}
                </div>

                {/* Grid de Posts */}
                {filteredPosts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No se encontraron posts que coincidan con los filtros aplicados.
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPosts.map((post, index) => {
                      const platform = safeString(post.platform).toLowerCase();
                      const postDate = safeString(post.post_date ?? post.date);
                      const likes = Number(post.likes) || 0;
                      const commentsCount = Number(post.comments) || 0;
                      const views = Number(post.views) || 0;
                      const sentiment = safeString(post.sentimiento_global || post.sentiment);
                      const preview = safeString(post.description ?? post.caption ?? post.text);
                      const postId = post.id ?? index;

                      return (
                        <div 
                          key={postId}
                          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="font-mono font-bold uppercase text-slate-500">
                                {platform} • Post #{index + 1}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{postDate}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1 text-rose-500">
                              <Heart size={13} fill="currentColor" /> {likes.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-blue-500">
                              <MessageCircle size={13} /> {commentsCount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Eye size={13} /> {views.toLocaleString()}
                            </span>
                          </div>

                          {preview && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                              {preview}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Sentimiento: {sentiment}
                            </span>

                            {/* Botón para ver comentarios individuales del post */}
                            <button
                              onClick={() => openPostComments(postId, profile.username)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <MessageCircle size={13} />
                              <span>Ver Comentarios</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Drawer de Comentarios */}
      <CommentsDrawer
        isOpen={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        postId={selectedPostComments?.id}
        postUsername={selectedPostComments?.username}
        userQuery={userCommentsQuery}
      />
    </div>
  );
};

export default PerfilInfluencer;
