import React, { useState } from 'react';
import { Save, Key, ShieldCheck, ExternalLink, AlertTriangle, Loader2, Facebook, Youtube } from 'lucide-react';

// Si usas Vite
const baseUrl = import.meta.env.VITE_API_URL;

export const SettingsView: React.FC = () => {
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

      const response = await fetch(`${baseUrl}api/scraper/bulk_update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Configuración de APIs</h2>
        <p className="text-slate-500 mt-1">Gestión segura de tokens para rotación automática.</p>
      </div>

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
    </div>
  );
};