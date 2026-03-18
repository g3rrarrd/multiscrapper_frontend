import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import LogoLoto from '../utils/Logo loto-.svg';

const MicrosoftIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
    <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
    <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const LoginPage: React.FC = () => {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // loginRedirect navega a Microsoft — no devuelve Promise con resultado.
      // El token llega de vuelta en App.tsx → handleRedirectPromise().
      await instance.loginRedirect(loginRequest);
    } catch (err: any) {
      // Solo errores antes de la navegación (ej. interaction_in_progress)
      const code = err?.errorCode ?? '';
      if (code === 'interaction_in_progress') {
        setError('Ya hay un inicio de sesión en curso. Espera un momento.');
      } else {
        setError(`Error al iniciar sesión: ${err?.message ?? 'Error desconocido'}`);
      }
      setLoading(false);
    }
    // No hay finally con setLoading(false) — la página navega a Microsoft
  };

  return (
    <div style={styles.root}>
      <div style={styles.meshBg} />

      <div style={styles.card}>
        <div style={styles.logoArea}>
          <img src={LogoLoto} alt="Logo" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Bienvenido</h1>
        <p style={styles.subtitle}>
          Inicia sesión con tu cuenta corporativa de Microsoft para continuar.
        </p>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>Acceso seguro</span>
          <span style={styles.dividerLine} />
        </div>

        <button
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onClick={handleLogin}
          disabled={loading}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#106EBE'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = loading ? '#E8E8E8' : '#0078D4'; }}
        >
          {loading ? (
            <>
              <span style={styles.spinner} />
              Redirigiendo a Microsoft…
            </>
          ) : (
            <>
              <MicrosoftIcon />
              Iniciar sesión con Microsoft
            </>
          )}
        </button>

        {error && (
          <div style={styles.errorBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#C42B1C" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#C42B1C" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <p style={styles.footer}>
          Al iniciar sesión aceptas las políticas de seguridad de tu organización.
        </p>
      </div>

      <style>{`
        @keyframes meshMove {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, 20px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#F3F2F1',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  meshBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 80% 60% at 20% 20%, #C7E0F4 0%, transparent 60%),' +
                'radial-gradient(ellipse 60% 50% at 80% 80%, #D2E9FF 0%, transparent 55%)',
    animation: 'meshMove 12s ease-in-out infinite', pointerEvents: 'none',
  },
  card: {
    position: 'relative', background: '#FFFFFF', borderRadius: '12px',
    padding: '48px 40px 36px', width: '100%', maxWidth: '400px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
    animation: 'cardIn 0.45s ease both',
  },
  logoArea: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
  logo:     { height: '72px', width: 'auto', objectFit: 'contain' },
  title:    { margin: '0 0 8px', fontSize: '24px', fontWeight: 600, color: '#201F1E', textAlign: 'center', letterSpacing: '-0.3px' },
  subtitle: { margin: '0 0 24px', fontSize: '14px', color: '#605E5C', textAlign: 'center', lineHeight: '1.5' },
  divider:  { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  dividerLine: { flex: 1, height: '1px', background: '#EDEBE9', display: 'block' },
  dividerText: { fontSize: '12px', color: '#A19F9D', whiteSpace: 'nowrap' },
  btn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '12px 20px', background: '#0078D4', color: '#FFFFFF',
    border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.15s ease', letterSpacing: '0.1px',
  },
  btnDisabled: { background: '#E8E8E8', color: '#A19F9D', cursor: 'not-allowed' },
  spinner: {
    display: 'inline-block', width: '14px', height: '14px', border: '2px solid #A19F9D',
    borderTopColor: '#605E5C', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  errorBox: {
    marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px',
    padding: '10px 12px', background: '#FDE7E9', borderRadius: '6px',
    color: '#C42B1C', fontSize: '13px', lineHeight: '1.4',
  },
  footer: { marginTop: '24px', fontSize: '11px', color: '#A19F9D', textAlign: 'center', lineHeight: '1.5' },
};

export default LoginPage;
