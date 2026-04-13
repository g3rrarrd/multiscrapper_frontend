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
} from 'lucide-react';
import api from '../api/axiosConfig';

type ScrapePost = Record<string, unknown>;

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

const formatWeight = (value?: number | null) => {
	if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
	return value.toFixed(2);
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
			return 'Regex de posts invalida';
		}
	}, [postFilterText, postRegexMode]);

	const postFieldOptions = useMemo(() => {
		const defaults = ['all', 'platform', 'post_date', 'date', 'followers', 'likes', 'comments', 'views', 'description', 'sentimiento_global', 'is_loto'];
		const dynamic = profile?.posts.flatMap((post) => Object.keys(post)) ?? [];
		return Array.from(new Set([...defaults, ...dynamic]));
	}, [profile]);

	const latestPostDate = useMemo(() => {
		if (!profile?.posts?.length) return profile?.latest_post_date ?? null;
		let max: Date | null = null;
		for (const post of profile.posts) {
			const rawDate = post.post_date ?? post.date;
			if (!rawDate) continue;
			const d = new Date(String(rawDate));
			if (!Number.isNaN(d.getTime()) && (max === null || d > max)) max = d;
		}
		return max ? max.toISOString() : profile.latest_post_date ?? null;
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
			await api.get<InfluencerProfilePayload>('scraper/influencer_profile/');
		} catch (error: any) {
			const payload = error?.response?.data as InfluencerProfilePayload | undefined;
			const list = payload?.influencers_list ?? [];
			setInfluencersList(Array.isArray(list) ? list : []);
			if (payload?.error) {
				setStatusMessage(payload.error);
			}
			setIsLoadingList(false);
			return;
		}

		setIsLoadingList(false);
	};

	useEffect(() => {
		loadInfluencersList();
	}, []);

	const handleSearchProfile = async (event?: React.FormEvent) => {
		if (event) event.preventDefault();

		const username = usernameInput.trim();
		if (!username) {
			setStatusMessage('Escribe un username para consultar el perfil 360.');
			return;
		}

		setIsSearching(true);
		setStatusMessage(null);

		try {
			const response = await api.get<InfluencerProfilePayload>('scraper/influencer_profile/', {
				params: { username },
			});

			setProfile(response.data.influencer ?? null);
			setPostFilterField('all');
			setPostFilterText('');
			setPostRegexMode(false);
			setPostDateFrom('');
			setPostDateTo('');
			setPostIsLotoFilter('all');
			setInfluencersList(response.data.influencers_list ?? []);
			setStatusMessage(null);
		} catch (error: any) {
			const payload = error?.response?.data as InfluencerProfilePayload | undefined;
			setProfile(null);

			if (payload?.influencers_list) {
				setInfluencersList(payload.influencers_list);
			}

			setStatusMessage(payload?.error ?? 'No se pudo consultar el perfil del influencer.');
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
			<div className="flex flex-col gap-2">
				<h2 className="text-3xl font-bold text-slate-900">Perfil 360 de Influencer</h2>
				<p className="text-slate-500">Consulta perfil, actividad completa y filtra el listado con texto o regex.</p>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
				<aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4 h-fit">
					<form onSubmit={handleSearchProfile} className="space-y-3">
						<label className="text-xs font-bold uppercase tracking-wide text-slate-500">Username</label>
						<div className="flex gap-2">
							<input
								type="text"
								value={usernameInput}
								onChange={(e) => setUsernameInput(e.target.value)}
								placeholder="influencer_x"
								className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
							/>
							<button
								type="submit"
								disabled={isSearching}
								className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold flex items-center gap-2"
							>
								{isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
								Buscar
							</button>
						</div>
					</form>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold uppercase tracking-wide text-slate-500">Listado de influencers</label>
							<button
								type="button"
								onClick={loadInfluencersList}
								disabled={isLoadingList}
								className="text-xs text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400"
							>
								{isLoadingList ? 'Actualizando...' : 'Actualizar'}
							</button>
						</div>

						<div className="space-y-2">
							<div className="relative">
								<Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
								<input
									type="text"
									value={listFilter}
									onChange={(e) => setListFilter(e.target.value)}
									placeholder={regexMode ? 'Ej: ^ana|mario$' : 'Buscar texto...'}
									className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
								/>
							</div>

							<label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 select-none">
								<input
									type="checkbox"
									checked={regexMode}
									onChange={(e) => setRegexMode(e.target.checked)}
									className="rounded border-slate-300"
								/>
								Activar filtro regex
							</label>

							{regexError && (
								<p className="text-xs text-rose-600 font-medium">{regexError}</p>
							)}
						</div>

						<div className="rounded-xl border border-slate-200 overflow-hidden">
							<div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 font-semibold flex items-center justify-between">
								<span>Coincidencias</span>
								<span>{filteredInfluencers.length}</span>
							</div>
							<div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
								{isLoadingList ? (
									<div className="p-4 text-sm text-slate-500 flex items-center gap-2">
										<Loader2 size={14} className="animate-spin" /> Cargando listado...
									</div>
								) : filteredInfluencers.length > 0 ? (
									filteredInfluencers.map((name) => (
										<button
											key={name}
											type="button"
											onClick={() => setUsernameInput(name)}
											className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
										>
											@{name}
										</button>
									))
								) : (
									<div className="p-4 text-sm text-slate-500">No hay resultados para el filtro actual.</div>
								)}
							</div>
						</div>
					</div>
				</aside>

				<section className="space-y-4 min-w-0">
					{statusMessage && (
						<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-start gap-3">
							<AlertTriangle size={18} className="mt-0.5 shrink-0" />
							<p className="text-sm font-medium">{statusMessage}</p>
						</div>
					)}

					{!profile ? (
						<div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center text-slate-500">
							Selecciona un influencer o escribe su username para ver su perfil 360.
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500">Username</p>
									<p className="text-2xl font-bold text-slate-900 mt-2">@{profile.username}</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
										<Users size={14} /> Seguidores actuales
									</p>
									<p className="text-2xl font-bold text-slate-900 mt-2">{profile.latest_followers.toLocaleString('es-ES')}</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500">Posts registrados</p>
									<p className="text-2xl font-bold text-slate-900 mt-2">{profile.total_posts.toLocaleString('es-ES')}</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
										<Globe size={14} /> Plataforma reciente
									</p>
									<p className="text-2xl font-bold text-slate-900 mt-2 uppercase">{profile.latest_platform || 'N/A'}</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
										<CalendarDays size={14} /> Ultimo post
									</p>
								<p className="text-sm font-semibold text-slate-800 mt-2">{formatDate(latestPostDate)}</p>
								</div>

								<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
									<p className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
										<Clock3 size={14} /> Ultima actualizacion
									</p>
									<p className="text-sm font-semibold text-slate-800 mt-2">{formatDate(profile.last_updated)}</p>
								</div>
							</div>

							<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
								<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
									<h3 className="text-lg font-bold text-slate-900">Posts completos del influencer</h3>
									<span className="text-sm text-slate-500">{filteredPosts.length} / {profile.posts.length} registros</span>
								</div>

								<div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70">
									<div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3 items-center">
										<select
											value={postFilterField}
											onChange={(e) => setPostFilterField(e.target.value)}
											className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
										>
											{postFieldOptions.map((field) => (
												<option key={field} value={field}>{field}</option>
											))}
										</select>

										<input
											type="text"
											value={postFilterText}
											onChange={(e) => setPostFilterText(e.target.value)}
											placeholder={postRegexMode ? 'Regex para posts...' : 'Texto para filtrar posts...'}
											className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
										/>

										<label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 select-none justify-self-start md:justify-self-end">
											<input
												type="checkbox"
												checked={postRegexMode}
												onChange={(e) => setPostRegexMode(e.target.checked)}
												className="rounded border-slate-300"
											/>
											Regex
										</label>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
										<select
											value={postIsLotoFilter}
											onChange={(e) => setPostIsLotoFilter(e.target.value as 'all' | 'true' | 'false')}
											className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
										>
											<option value="all">Loto: todos</option>
											<option value="true">Loto: SI</option>
											<option value="false">Loto: NO</option>
										</select>
										<input
											type="date"
											value={postDateFrom}
											onChange={(e) => setPostDateFrom(e.target.value)}
											className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
											aria-label="Fecha desde"
										/>
										<input
											type="date"
											value={postDateTo}
											onChange={(e) => setPostDateTo(e.target.value)}
											className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
											aria-label="Fecha hasta"
										/>
									</div>
									{postRegexError && <p className="text-xs text-rose-600 mt-2">{postRegexError}</p>}
								</div>

								{filteredPosts.length === 0 ? (
									<div className="p-6 text-sm text-slate-500">No hay posts disponibles para este influencer.</div>
								) : (
									<div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
										{filteredPosts.map((post, index) => {
											const platform = safeString(post.platform).toUpperCase();
											const postDate = safeString(post.post_date ?? post.date);
											const followers = safeString(post.followers);
											const likes = safeString(post.likes);
											const comments = safeString(post.comments);
											const sentiment = safeString(post.sentimiento_global);
											const preview = safeString(post.description ?? post.caption ?? post.text);

											return (
												<div key={safeString(post.id ?? `${profile.username}-${index}`)} className="rounded-xl border border-slate-200 p-4 bg-white">
													<div className="flex items-center justify-between gap-3 text-xs uppercase font-bold text-slate-500">
														<span>Post #{index + 1}</span>
														<span>{platform}</span>
													</div>
													<div className="mt-3 grid grid-cols-2 gap-3 text-sm">
														<div>
															<p className="text-slate-500 text-xs uppercase">Fecha</p>
															<p className="text-slate-700 break-words">{postDate}</p>
														</div>
														<div>
															<p className="text-slate-500 text-xs uppercase">Sentimiento</p>
															<p className="text-slate-700 uppercase">{sentiment}</p>
														</div>
														<div>
															<p className="text-slate-500 text-xs uppercase">Followers</p>
															<p className="text-slate-700">{followers}</p>
														</div>
														<div>
															<p className="text-slate-500 text-xs uppercase">Likes</p>
															<p className="text-slate-700">{likes}</p>
														</div>
														<div>
															<p className="text-slate-500 text-xs uppercase">Comentarios</p>
															<p className="text-slate-700">{comments}</p>
														</div>
													</div>
													<div className="mt-3">
														<p className="text-slate-500 text-xs uppercase mb-1">Detalle</p>
														<p className="text-slate-700 text-sm break-words">{preview || 'N/A'}</p>
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
		</div>
	);
};

export default PerfilInfluencer;
