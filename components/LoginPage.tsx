import React, { useState } from 'react';
import LogoLoto from '../utils/Logo loto-.svg';

type UserProfile = {
  displayName?: string;
  email?: string;
};

type LoginPageProps = {
  onLoginSuccess: (profile: UserProfile) => void;
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const loginUrl = `${baseUrl}/api/auth/login/`;
  const registerUrl = `${baseUrl}/api/auth/register/`;

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Ingresa tu correo o usuario y tu contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      if (!response.ok) {
        setError(response.status === 401
          ? 'Credenciales inválidas. Intenta nuevamente.'
          : 'No fue posible iniciar sesión. Verifica la configuración del servidor.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (!data?.access) {
        setError('La respuesta del servidor no incluye token de acceso.');
        setLoading(false);
        return;
      }

      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      const profile: UserProfile = {
        displayName: data.user?.display_name ?? data.user?.name ?? data.user?.username ?? identifier,
        email: data.user?.email ?? '',
      };
      localStorage.setItem('user_profile', JSON.stringify(profile));
      onLoginSuccess(profile);
    } catch (err: any) {
      setError(`Error al iniciar sesión: ${err?.message ?? 'Error desconocido'}`);
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      setError('Completa usuario, correo y contraseña para registrarte.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const body: Record<string, string> = {
      username: username.trim(),
      email: email.trim(),
      password,
    };

    if (firstName.trim()) {
      body.first_name = firstName.trim();
    }
    if (lastName.trim()) {
      body.last_name = lastName.trim();
    }

    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const detail = data?.detail || data?.message || 'No fue posible registrar el usuario.';
        setError(String(detail));
        setLoading(false);
        return;
      }

      setMode('login');
      setIdentifier(username.trim() || email.trim());
      setPassword('');
      setSuccessMessage('Registro exitoso. Ahora inicia sesión con tu usuario o correo.');
      setLoading(false);
    } catch (err: any) {
      setError(`Error al registrar usuario: ${err?.message ?? 'Error desconocido'}`);
      setLoading(false);
    }
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
          {mode === 'login'
            ? 'Inicia sesión con tu correo o usuario y contraseña.'
            : 'Registra tu cuenta para ingresar al sistema.'}
        </p>

        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tabBtn, ...(mode === 'login' ? styles.tabBtnActive : {}) }}
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMessage(null);
            }}
            type="button"
            disabled={loading}
          >
            Iniciar sesión
          </button>
          <button
            style={{ ...styles.tabBtn, ...(mode === 'register' ? styles.tabBtnActive : {}) }}
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMessage(null);
            }}
            type="button"
            disabled={loading}
          >
            Registrarse
          </button>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>{mode === 'login' ? 'Credenciales' : 'Datos de registro'}</span>
          <span style={styles.dividerLine} />
        </div>

        {mode === 'login' ? (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="identifier">Correo o usuario</label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.input}
                placeholder="usuario@empresa.com o juanperez"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    void handleLogin();
                  }
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="juanperez"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="usuario@empresa.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroupHalf}>
                <label style={styles.label} htmlFor="firstName">Nombre (opcional)</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={styles.input}
                  placeholder="Juan"
                  autoComplete="given-name"
                  disabled={loading}
                />
              </div>
              <div style={styles.formGroupHalf}>
                <label style={styles.label} htmlFor="lastName">Apellido (opcional)</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={styles.input}
                  placeholder="Pérez"
                  autoComplete="family-name"
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="registerPassword">Contraseña</label>
              <input
                id="registerPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    void handleRegister();
                  }
                }}
              />
            </div>
          </>
        )}

        <button
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#0078D4'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = loading ? '#E8E8E8' : '#005A9E'; }}
        >
          {loading ? (
            <>
              <span style={styles.spinner} />
              {mode === 'login' ? 'Iniciando sesión...' : 'Registrando usuario...'}
            </>
          ) : (
            mode === 'login' ? 'Entrar' : 'Crear cuenta'
          )}
        </button>

        {successMessage && (
          <div style={styles.successBox}>{successMessage}</div>
        )}

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
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '16px',
  },
  tabBtn: {
    border: '1px solid #D2D0CE',
    background: '#FFFFFF',
    color: '#605E5C',
    borderRadius: '6px',
    padding: '9px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabBtnActive: {
    border: '1px solid #005A9E',
    color: '#005A9E',
    background: '#EFF6FC',
  },
  divider:  { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  dividerLine: { flex: 1, height: '1px', background: '#EDEBE9', display: 'block' },
  dividerText: { fontSize: '12px', color: '#A19F9D', whiteSpace: 'nowrap' },
  formGroup: { display: 'flex', flexDirection: 'column', marginBottom: '14px', gap: '6px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  formGroupHalf: { display: 'flex', flexDirection: 'column', marginBottom: '14px', gap: '6px' },
  label: { fontSize: '12px', color: '#605E5C', fontWeight: 600 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '6px',
    border: '1px solid #C8C6C4',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#201F1E',
    outline: 'none',
    background: '#FFFFFF',
  },
  btn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '12px 20px', background: '#005A9E', color: '#FFFFFF',
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
  successBox: {
    marginTop: '16px',
    padding: '10px 12px',
    background: '#E9F6EC',
    borderRadius: '6px',
    color: '#107C10',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  footer: { marginTop: '24px', fontSize: '11px', color: '#A19F9D', textAlign: 'center', lineHeight: '1.5' },
};

export default LoginPage;
