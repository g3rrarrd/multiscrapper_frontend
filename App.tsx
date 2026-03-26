import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ScraperView } from './components/ScraperView';
import { SettingsView } from './components/SettingsView';
import { Platform } from './types';
import { RoleManager } from './components/RoleManage';
import { PERMISSION_DENIED_EVENT, emitPermissionDenied } from './utils/permissionEvents';
import Saludos from './components/Saludos';

type UserProfile = {
  displayName: string;
  email: string;
};

// ─── Router interno ───────────────────────────────────────────────────────────

const AppRouter: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [user, setUser] = useState<UserProfile>({ displayName: 'Usuario', email: '' });
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('No tienes permisos para realizar esta acción o ver este contenido.');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'settings'>('dashboard');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'roles'>('general');
  
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');

    if (accessToken) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as Partial<UserProfile>;
          setUser({
            displayName: parsed.displayName || 'Usuario',
            email: parsed.email || '',
          });
        } catch {
          setUser({ displayName: 'Usuario', email: '' });
        }
      }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    const onPermissionDenied = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setPermissionMessage(customEvent.detail || 'No tienes permisos para realizar esta acción o ver este contenido.');
      setPermissionModalOpen(true);
    };

    globalThis.addEventListener(PERMISSION_DENIED_EVENT, onPermissionDenied as EventListener);

    const originalFetch = globalThis.fetch.bind(globalThis);
    const patchedFetch: typeof globalThis.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 403) {
        emitPermissionDenied();
        return response;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          if (data?.error === 'No tienes permiso') {
            emitPermissionDenied('No tienes permiso para esta operación.');
          }
        } catch {
          // Ignora errores de parseo y deja que cada vista maneje su respuesta.
        }
      }

      return response;
    };

    globalThis.fetch = patchedFetch;

    return () => {
      globalThis.removeEventListener(PERMISSION_DENIED_EVENT, onPermissionDenied as EventListener);
      globalThis.fetch = originalFetch;
    };
  }, []);

  if (!ready) {
    return (
      <div style={loadingStyle}>
        <span style={spinnerStyle} />
        Cargando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(profile) => {
          setUser({
            displayName: profile.displayName || 'Usuario',
            email: profile.email || '',
          });
          setShowWelcome(true);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    setIsAuthenticated(false);
    setUser({ displayName: 'Usuario', email: '' });
  };

  const navigateToScraper = (platform: Platform) => {
    setSelectedPlatform(platform);
    setActiveTab('scraper');
  };

  if (showWelcome) {
    return (
      <Saludos
        displayName={user.displayName}
        onFinish={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      >
        {activeTab === 'dashboard' && <Dashboard onPlatformSelect={navigateToScraper} displayName={user.displayName} />}
        {activeTab === 'scraper'   && <ScraperView platform={selectedPlatform} />}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Header de Configuración */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
                <p className="text-slate-500 text-sm">Administra el comportamiento del sistema y permisos.</p>
              </div>
            </div>

            {/* NAVEGACIÓN DE SUB-PESTAÑAS */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveSettingsTab('general')}
                className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeSettingsTab === 'general'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                General & API Keys
              </button>
              <button
                onClick={() => setActiveSettingsTab('roles')}
                className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeSettingsTab === 'roles'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Gestión de Roles
              </button>
            </div>

            {/* CONTENIDO CONDICIONAL DE SUB-PESTAÑAS */}
            <div className="mt-6 animate-in fade-in duration-300">
              {activeSettingsTab === 'general' ? (
                <SettingsView />
              ) : (
                <RoleManager token={localStorage.getItem('access_token') || ''} />
              )}
            </div>
          </div>
        )}
      </Layout>

      {permissionModalOpen && (
        <div style={permissionOverlayStyle}>
          <div style={permissionModalStyle}>
            <div style={permissionIconStyle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="#B42318" strokeWidth="2" />
                <path d="M12 7v6M12 16h.01" stroke="#B42318" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 style={permissionTitleStyle}>Acceso denegado</h3>
            <p style={permissionMessageStyle}>{permissionMessage}</p>
            <button
              type="button"
              style={permissionButtonStyle}
              onClick={() => setPermissionModalOpen(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Root ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => <AppRouter />;

export default App;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const loadingStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: '#F3F2F1',
  fontFamily: "'Segoe UI', sans-serif", color: '#605E5C',
  fontSize: '14px', gap: '10px',
};

const spinnerStyle: React.CSSProperties = {
  width: '16px', height: '16px', borderRadius: '50%',
  border: '2px solid #C7E0F4', borderTopColor: '#0078D4',
  display: 'inline-block', animation: 'spin 0.7s linear infinite',
};

const permissionOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '16px',
};

const permissionModalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '24px',
  boxShadow: '0 24px 50px rgba(2, 6, 23, 0.25)',
  border: '1px solid #FEE4E2',
  textAlign: 'center',
};

const permissionIconStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  margin: '0 auto 12px',
  background: '#FEE4E2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const permissionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '22px',
  fontWeight: 700,
  color: '#101828',
};

const permissionMessageStyle: React.CSSProperties = {
  margin: '0 0 18px',
  fontSize: '14px',
  lineHeight: 1.5,
  color: '#475467',
};

const permissionButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  background: '#B42318',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: '14px',
  padding: '10px 18px',
  cursor: 'pointer',
};
