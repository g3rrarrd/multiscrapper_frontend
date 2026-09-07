import React from 'react';
import LogoLoto from '../utils/Logo loto-.svg';
import { 
  LayoutDashboard, 
  Search, 
  UserRound,
  Settings, 
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Layers
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'scraper' | 'perfil' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'scraper' | 'perfil' | 'settings') => void;
  user: { displayName: string; email: string };
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scraper', label: 'Extractores & Posts', icon: Search },
    { id: 'perfil', label: 'Perfil 360', icon: UserRound },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-slate-800/80 shadow-xl shrink-0">
        {/* Branding */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <img 
              src={LogoLoto} 
              alt="Loto Logo" 
              className="w-5 h-5 object-contain filter brightness-0 invert" 
            />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              Multi-Scraper
            </h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Media Pro HN
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-bold text-left ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.01]' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sección de Usuario y Logout */}
        <div className="px-4 py-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="px-2 flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white uppercase shadow-md shrink-0">
              {user.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email || 'Conectado'}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 text-xs font-bold group"
          >
            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-slate-300">API Django 5.0</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span>Sistema</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white capitalize">
              {activeTab === 'scraper' ? 'Extractores & Posts Unitarios' : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                {user.displayName.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline">
                {user.displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};