import React, { useState } from 'react';
import { Save, Key, ShieldCheck, AlertTriangle, Loader2, Facebook, Youtube, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import api from '../api/axiosConfig';

// Si usas Vite
const baseUrl = import.meta.env.VITE_API_URL;

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api' | 'password'>('api');
  const [isSaving, setIsSaving] = useState(false);
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
  const [cpLoading, setCpLoading] = useState(false);
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
      const body: Record<string, string> = {
        [cpIdentifierType]: cpIdentifier.trim(),
        new_password: cpNewPassword,
      };
      const { data } = await api.post<{ status: string; message: string }>('scraper/change_password/', body);
      setCpSuccess(data.message);
      setCpIdentifier('');
      setCpNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Error al cambiar la contraseña.';
      setCpError(msg);
    } finally {
      setCpLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ig: { general: keys.ig_keys.split(',').map(k => k.trim()).filter(k => k) },
        tk: { 
          search: keys.tk_search.split(',').map(k => k.trim()).filter(k => k),
          posts: keys.tk_posts.split(',').map(k => k.trim()).filter(k => k)
        },
        x: {
          search: keys.x_search.split(',').map(k => k.trim()).filter(k => k),
          posts: keys.x_posts.split(',').map(k => k.trim()).filter(k => k)
        },
        fb: { general: keys.fb_keys.split(',').map(k => k.trim()).filter(k => k) },
        yt: { general: keys.yt_keys.split(',').map(k => k.trim()).filter(k => k) }
      };

      const token = localStorage.getItem('access_token');

      const response = await fetch(`${baseUrl}api/scraper/bulk_update/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Configuración guardada y encriptada en la base de datos.');
      } else {
        alert('Error al guardar las llaves.');
      }
    } catch (error) {
      alert('Error de conexión con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Configuración</h2>
        <p className="text-slate-500 mt-1">Gestión de APIs, credenciales y contraseñas.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('api')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'api' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <KeyRound size={15} />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'password' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Lock size={15} />
          Cambiar contraseña
        </button>
      </div>

      {/* ── TAB: API KEYS ── */}
      {activeTab === 'api' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">

            {/* INSTAGRAM */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Key size={16} className="text-pink-500" />
                Instagram Keys (RapidAPI)
              </label>
              <textarea
                placeholder="key1, key2, key3..."
                value={keys.ig_keys}
                onChange={(e) => setKeys({...keys, ig_keys: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                rows={2}
              />
            </div>

            {/* TIKTOK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={16} className="text-slate-900" />
                  TikTok Search Keys
                </label>
                <textarea
                  value={keys.tk_search}
                  onChange={(e) => setKeys({...keys, tk_search: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={16} className="text-slate-900" />
                  TikTok Posts Keys
                </label>
                <textarea
                  value={keys.tk_posts}
                  onChange={(e) => setKeys({...keys, tk_posts: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
            </div>

            {/* X (TWITTER) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={16} className="text-blue-400" />
                  X User Search Keys
                </label>
                <textarea
                  value={keys.x_search}
                  onChange={(e) => setKeys({...keys, x_search: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={16} className="text-blue-400" />
                  X Timeline Keys
                </label>
                <textarea
                  value={keys.x_posts}
                  onChange={(e) => setKeys({...keys, x_posts: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
            </div>

            {/* FACEBOOK & YOUTUBE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Facebook size={16} className="text-[#1877F2]" />
                  Facebook Keys
                </label>
                <textarea
                  value={keys.fb_keys}
                  onChange={(e) => setKeys({...keys, fb_keys: e.target.value})}
                  placeholder="key1, key2..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Youtube size={16} className="text-[#FF0000]" />
                  YouTube Data API Keys
                </label>
                <textarea
                  value={keys.yt_keys}
                  onChange={(e) => setKeys({...keys, yt_keys: e.target.value})}
                  placeholder="AIzaSy..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
              <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                Las llaves se encriptan mediante AES-256 en Django antes de almacenarse.
                Separa múltiples llaves con comas para que los scripts roten automáticamente cuando una se agote.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Configuración
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: CAMBIAR CONTRASEÑA ── */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <Lock size={20} className="text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Cambiar contraseña de usuario</h3>
              <p className="text-xs text-slate-500 mt-0.5">Actualiza la contraseña de cualquier usuario (mínimo 8 caracteres).</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-2">
              {(['username', 'email'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCpIdentifierType(t); setCpIdentifier(''); setCpSuccess(''); setCpError(''); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${cpIdentifierType === t ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400'}`}
                >
                  {t === 'username' ? 'Username' : 'Email'}
                </button>
              ))}
            </div>

            <input
              type={cpIdentifierType === 'email' ? 'email' : 'text'}
              placeholder={cpIdentifierType === 'username' ? 'Nombre de usuario…' : 'correo@ejemplo.com'}
              value={cpIdentifier}
              onChange={(e) => setCpIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none"
            />

            <div className="relative">
              <input
                type={cpShowPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                value={cpNewPassword}
                onChange={(e) => setCpNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setCpShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {cpShowPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {cpError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                <AlertTriangle size={15} className="shrink-0" /> {cpError}
              </div>
            )}
            {cpSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                <ShieldCheck size={15} className="shrink-0" /> {cpSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={cpLoading}
                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                {cpLoading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={17} />}
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};