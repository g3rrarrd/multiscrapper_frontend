import React from 'react';
import LogoLoto from '../utils/Logo loto-.svg';

import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  Github,
  LogOut 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'scraper' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'scraper' | 'settings') => void;
  user: { displayName: string; email: string };
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scraper', label: 'Extractors', icon: Search },
    { id: 'settings', label: 'Configuration', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg flex items-center justify-center">
            <img 
              src={LogoLoto} 
              alt="Loto Logo" 
              className="w-5 h-5 object-contain" 
            />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Loto Scraper HN</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* --- SECCIÓN DE USUARIO Y LOGOUT --- */}
        <div className="px-4 py-4 border-t border-slate-800 space-y-3">
          <div className="px-4">
            <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">CONNECTED TO BACKEND</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">Django API v2.4</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/70 backdrop-blur-md border-b flex items-center justify-between px-8 z-10">
          <div className="text-slate-500 text-sm font-medium">
            Social Media / <span className="text-slate-900 capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Github size={20} />
            </button>
            {/* Avatar con inicial */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {user.displayName.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};