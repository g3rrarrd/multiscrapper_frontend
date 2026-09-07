import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosConfig';

interface UserData {
  id: number;
  username: string;
  first_name: string;
  email: string;
}

export const RoleManager: React.FC<{ token?: string }> = () => {
  const [userList, setUserList] = useState<UserData[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Usuario');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const roles = ['Admin_Scraper', 'Colaborador', 'Usuario', 'Gerente', 'Director'];

  // Cargar usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get<UserData[]>('scraper/list_users/');
        if (Array.isArray(data)) {
          setUserList(data);
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) return;
    
    setLoading(true);
    setMessage(null);

    try {
      await api.post('scraper/assign_role/', {
        username: selectedUsername,
        group_name: selectedGroup,
        clear_existing: true,
      });

      setMessage({ type: 'success', text: `Rol "${selectedGroup}" asignado correctamente a @${selectedUsername}` });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Error en la asignación de rol.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Gestión de Roles y Permisos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asigna grupos de seguridad a los usuarios de la plataforma.</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SELECT DE USUARIOS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Usuario Registrado</label>
              <div className="relative">
                <select
                  disabled={fetchingUsers}
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">
                    {fetchingUsers ? 'Cargando usuarios...' : '-- Selecciona un usuario --'}
                  </option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.first_name ? `${u.first_name} (@${u.username})` : `@${u.username}`} - {u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELECT DE ROLES */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rol / Grupo Asignado</label>
              <div className="relative">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* MENSAJES DE ESTADO */}
          {message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold transition-all ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* BOTÓN SUBMIT */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !selectedUsername || fetchingUsers}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 text-xs transition-all"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              <span>Actualizar Rol</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};