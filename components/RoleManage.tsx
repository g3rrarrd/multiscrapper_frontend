import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  first_name: string;
  email: string;
}

export const RoleManager: React.FC<{ token: string }> = ({ token }) => {
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/scraper/list_users/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUserList(data);
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsername) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/scraper/assign_role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: selectedUsername,
          group_name: selectedGroup,
          clear_existing: true
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Rol asignado correctamente a ${selectedUsername}` });
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.error || 'Error en la asignación.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gestión de Roles</h3>
            <p className="text-sm text-slate-500">Selecciona un usuario de la lista para cambiar sus permisos.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleAssignRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SELECT DE USUARIOS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Usuario Existente</label>
              <div className="relative">
                <select
                  disabled={fetchingUsers}
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 appearance-none disabled:opacity-50"
                  required
                >
                  <option value="">{fetchingUsers ? 'Cargando...' : 'Selecciona un colaborador'}</option>
                  {userList.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.first_name || u.username} ({u.email})
                    </option>
                  ))}
                </select>
                <Users className="absolute left-3 top-3 text-slate-400" size={18} />
              </div>
            </div>

            {/* SELECT DE ROLES */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rol a Asignar</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 appearance-none"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedUsername}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Cambios'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};