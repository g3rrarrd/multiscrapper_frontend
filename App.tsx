import React, { useState, useEffect } from 'react';
import {
  MsalProvider,
  useIsAuthenticated,
  useMsal,
} from '@azure/msal-react';
import { PublicClientApplication, EventType, InteractionStatus } from '@azure/msal-browser';
import { msalConfig } from './auth/authConfig';
import LoginPage from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ScraperView } from './components/ScraperView';
import { SettingsView } from './components/SettingsView';
import { Platform } from './types';

/** Singleton MSAL instance — creado una sola vez fuera del árbol React */
const msalInstance = new PublicClientApplication(msalConfig);

// LOGIN_SUCCESS también dispara en redirect flow luego de handleRedirectPromise()
msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGIN_SUCCESS &&
    event.payload &&
    'account' in event.payload &&
    event.payload.account
  ) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

// ─── Router interno ───────────────────────────────────────────────────────────

const AppRouter: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [ready, setReady] = useState(false);
  const [isBackendAuthenticated, setIsBackendAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'settings'>('dashboard');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.INSTAGRAM);

  useEffect(() => {
    instance.initialize()
      .then(() => instance.handleRedirectPromise())
      .then(async (result) => {
        const account = result?.account ?? instance.getActiveAccount() ?? accounts[0];
        if (account){
          instance.setActiveAccount(account)

          const token = localStorage.getItem('access_token');
          if (!token && result){
            try{
              const response = await fetch(`http://localhost:8000/api/auth/azure-login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: result.idToken }),
              });

              const data = await response.json();
              if (data.access){
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                setIsBackendAuthenticated(true);
              }
            }  catch (err){
            console.error('Error during backend authentication:', err);
          } 
          } else if (token){
            setIsBackendAuthenticated(true);
          }
        }
      })
      .catch((err) => {
        if (err?.errorCode !== 'no_token_request_cache_error') {
          console.error('[MSAL]', err);
        }
      })
      .finally(() => setReady(true));
  }, [instance, accounts]);

  if (!ready || inProgress === InteractionStatus.HandleRedirect) {
    return (
      <div style={loadingStyle}>
        <span style={spinnerStyle} />
        Cargando sesión corporativa…
      </div>
    );
  }

  // Obtenemos la cuenta activa para extraer la info del perfil
  const activeAccount = instance.getActiveAccount() ?? accounts[0];

  if (!isAuthenticated || !activeAccount || !isBackendAuthenticated) {
    return <LoginPage />;
  }

  // Formateamos los datos para el componente Layout
  const userPayload = {
    displayName: activeAccount.name ?? 'Usuario',
    email: activeAccount.username // Este es el correo principal en Microsoft Entra ID
  };

  const handleLogout = () => {
    instance.logoutRedirect({ 
      account: activeAccount,
      // Opcional: puedes definir a dónde ir tras el logout
      postLogoutRedirectUri: window.location.origin 
    });
  };

  const navigateToScraper = (platform: Platform) => {
    setSelectedPlatform(platform);
    setActiveTab('scraper');
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={userPayload} // Pasamos el objeto con nombre y email
      onLogout={handleLogout} // Pasamos la función de cierre de sesión
    >
      {activeTab === 'dashboard' && <Dashboard onPlatformSelect={navigateToScraper} />}
      {activeTab === 'scraper'   && <ScraperView platform={selectedPlatform} />}
      {activeTab === 'settings'  && <SettingsView />}
    </Layout>
  );
};

// ─── Root ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <MsalProvider instance={msalInstance}>
    <AppRouter />
  </MsalProvider>
);

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
