import React, { useState } from 'react';
import { Save, Key, ShieldCheck, AlertTriangle, Loader2, Facebook, Youtube, Eye, EyeOff, Lock, KeyRound, CheckCircle2, ExternalLink } from 'lucide-react';
import api from '../api/axiosConfig';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api' | 'password'>('api');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [keys, setKeys] = useState({
    ig_keys: '',
    tk_search: '',
    tk_posts: '',
    x_search: '',
    x_posts: '',
    fb_keys: '',
    yt_keys: ''
  });

// --- Cambiar contraseña ---
  const [cpIdentifier, setCpIdentifier] = useState('');
  const [cpIdentifierType, setCpIdentifierType] = useState<'username' | 'email'>('username');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpShowPassword, setCpShowPassword] = useState(false);
  const [cpLoading, setCpLoading] = useState(false); // Cambiado a useState(false)
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpError, setCpError] = useState('');

  const handleChangePassword = async () => {
    setCpSuccess('');
    setCpError('');
    if (!cpIdentifier.trim() || !cpNewPassword) {
      setCpError('Completa todos los campos.');
      return;
    }
    if (cpNewPassword.length < 8) {
      setCpError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCpLoading(true);
    try {
      const payload = {
        [cpIdentifierType]: cpIdentifier.trim(),
        new_password: cpNewPassword,
      };

      const response = await api.post('scraper/change_password/', payload);
      setCpSuccess(response.data.message || 'Contraseña actualizada correctamente.');
      setCpIdentifier('');
      setCpNewPassword('');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Error al cambiar la contraseña.';
      setCpError(msg);
    } finally {
      setCpLoading(false);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const payload = {
        ig: { general: keys.ig_keys.split(',').map(k => k.trim()).filter(Boolean) },
        tk: { 
          search: keys.tk_search.split(',').map(k => k.trim()).filter(Boolean),
          posts: keys.tk_posts.split(',').map(k => k.trim()).filter(Boolean)
        },
        x: {
          search: keys.x_search.split(',').map(k => k.trim()).filter(Boolean),
          posts: keys.x_posts.split(',').map(k => k.trim()).filter(Boolean)
        },
        fb: { general: keys.fb_keys.split(',').map(k => k.trim()).filter(Boolean) },
        yt: { general: keys.yt_keys.split(',').map(k => k.trim()).filter(Boolean) }
      };

      await api.post('scraper/bulk_update/', payload);
      setSaveStatus({
        type: 'success',
        message: 'Configuración guardada y encriptada con AES-128 en la base de datos de Django.'
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.detail || 'Error al actualizar las llaves de API.';
      setSaveStatus({
        type: 'error',
        message: msg
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Configuración</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Gestión centralizada de llaves API por plataforma y contraseñas.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('api')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'api' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound size={15} />
          <span>API Keys por Red</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'password' 
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock size={15} />
          <span>Cambiar Contraseña</span>
        </button>
      </div>

      {/* ── TAB: API KEYS ── */}
      {activeTab === 'api' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6">
          <div className="p-6 sm:p-8 space-y-6">
            {/* INSTAGRAM */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Key size={15} className="text-pink-500" />
                Instagram Keys (RapidAPI)
              </label>
              <textarea
                placeholder="key1, key2, key3..."
                value={keys.ig_keys}
                onChange={(e) => setKeys({...keys, ig_keys: e.target.value})}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                rows={2}
              />
            </div>

            {/* TIKTOK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={15} className="text-cyan-400" />
                  TikTok Search Keys
                </label>
                <textarea
                  value={keys.tk_search}
                  onChange={(e) => setKeys({...keys, tk_search: e.target.value})}
                  placeholder="key_search_1, key_search_2..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={15} className="text-rose-400" />
                  TikTok Posts Keys
                </label>
                <textarea
                  value={keys.tk_posts}
                  onChange={(e) => setKeys({...keys, tk_posts: e.target.value})}
                  placeholder="key_posts_1, key_posts_2..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
            </div>

            {/* X (TWITTER) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={15} className="text-sky-400" />
                  X Search Keys
                </label>
                <textarea
                  value={keys.x_search}
                  onChange={(e) => setKeys({...keys, x_search: e.target.value})}
                  placeholder="key_search_x..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck size={15} className="text-sky-400" />
                  X Timeline Keys
                </label>
                <textarea
                  value={keys.x_posts}
                  onChange={(e) => setKeys({...keys, x_posts: e.target.value})}
                  placeholder="key_posts_x..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
            </div>

            {/* FACEBOOK & YOUTUBE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Facebook size={15} className="text-[#1877F2]" />
                  Facebook Keys
                </label>
                <textarea
                  value={keys.fb_keys}
                  onChange={(e) => setKeys({...keys, fb_keys: e.target.value})}
                  placeholder="key_fb_1, key_fb_2..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Youtube size={15} className="text-[#FF0000]" />
                  YouTube Data API Keys
                </label>
                <textarea
                  value={keys.yt_keys}
                  onChange={(e) => setKeys({...keys, yt_keys: e.target.value})}
                  placeholder="AIzaSy..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-slate-800 dark:text-slate-200"
                  rows={2}
                />
              </div>
            </div>

            {/* Aviso de seguridad */}
            <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl">
              <ShieldCheck className="text-blue-500 shrink-0" size={20} />
              <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                Las llaves se encriptan con Fernet (AES-128-CBC + HMAC) en el servidor Django. La rotación automática avanza al índice siguiente en caso de recibir respuestas HTTP 429.
              </p>
            </div>

            {saveStatus && (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                saveStatus.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}>
                {saveStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{saveStatus.message}</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              <span>Guardar Configuración</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: CAMBIAR CONTRASEÑA ── */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cambiar contraseña de usuario</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Actualiza la credencial de cualquier usuario existente (mínimo 8 caracteres).</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex gap-2">
              {(['username', 'email'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCpIdentifierType(t); setCpIdentifier(''); setCpSuccess(''); setCpError(''); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    cpIdentifierType === t 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {t === 'username' ? 'Por Username' : 'Por Email'}
                </button>
              ))}
            </div>

            <input
              type={cpIdentifierType === 'email' ? 'email' : 'text'}
              placeholder={cpIdentifierType === 'username' ? 'Nombre de usuario…' : 'correo@ejemplo.com'}
              value={cpIdentifier}
              onChange={(e) => setCpIdentifier(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <div className="relative">
              <input
                type={cpShowPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                value={cpNewPassword}
                onChange={(e) => setCpNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setCpShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {cpShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {cpError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle size={15} className="shrink-0" /> <span>{cpError}</span>
              </div>
            )}
            {cpSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={15} className="shrink-0" /> <span>{cpSuccess}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleChangePassword}
                disabled={cpLoading}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
              >
                {cpLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                <span>Actualizar Contraseña</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};