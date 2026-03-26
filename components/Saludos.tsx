import React, { useEffect, useState } from 'react';
import LogoLoto from '../utils/Logo loto-.svg';

interface SaludosProps {
  displayName: string;
  onFinish: () => void;
}

const Saludos: React.FC<SaludosProps> = ({ displayName, onFinish }) => {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out'>('in');

  useEffect(() => {
    // Entra → se queda → sale automáticamente
    const inTimer = setTimeout(() => setPhase('visible'), 50);
    const outTimer = setTimeout(() => setPhase('out'), 2800);
    const doneTimer = setTimeout(() => onFinish(), 3500);

    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const opacity = phase === 'visible' ? 1 : 0;
  const translateY = phase === 'visible' ? '0px' : phase === 'in' ? '32px' : '-24px';

  return (
    <div style={{ ...styles.root, opacity, transition: 'opacity 0.55s ease, transform 0.55s ease', transform: `translateY(${translateY})` }}>
      <div style={styles.meshA} />
      <div style={styles.meshB} />

      <div style={styles.card}>
        <img src={LogoLoto} alt="Logo" style={styles.logo} />

        <p style={styles.greeting}>{greeting}</p>

        <h1 style={styles.name}>
          Bienvenido,{' '}
          <span style={styles.nameHighlight}>
            {displayName}
          </span>
        </h1>

        <p style={styles.sub}>
          Tu panel de extracción está listo.
        </p>

        <div style={styles.barTrack}>
          <div style={styles.barFill} />
        </div>

        <button style={styles.skipBtn} onClick={onFinish}>
          Ir al panel →
        </button>
      </div>

      <style>{`
        @keyframes meshFloat {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(20px, 15px) scale(1.04); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes barGrow {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
    zIndex: 9998,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: 'hidden',
  },
  meshA: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    top: '-120px',
    left: '-120px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
    animation: 'meshFloat 10s ease-in-out infinite',
    pointerEvents: 'none',
  },
  meshB: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    bottom: '-100px',
    right: '-80px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    animation: 'meshFloat 14s ease-in-out infinite reverse',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    textAlign: 'center',
    padding: '0 24px',
    maxWidth: '520px',
    width: '100%',
  },
  logo: {
    height: '64px',
    width: 'auto',
    objectFit: 'contain',
    marginBottom: '28px',
  },
  greeting: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#93C5FD',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  name: {
    fontSize: 'clamp(28px, 6vw, 48px)',
    fontWeight: 800,
    color: '#F8FAFC',
    lineHeight: 1.15,
    margin: '0 0 16px',
    letterSpacing: '-0.5px',
  },
  nameHighlight: {
    background: 'linear-gradient(90deg, #60A5FA, #A78BFA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: {
    fontSize: '16px',
    color: '#94A3B8',
    marginBottom: '40px',
    lineHeight: 1.5,
  },
  barTrack: {
    width: '200px',
    height: '3px',
    borderRadius: '9999px',
    background: 'rgba(255,255,255,0.1)',
    margin: '0 auto 32px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '9999px',
    background: 'linear-gradient(90deg, #60A5FA, #A78BFA)',
    animation: 'barGrow 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  skipBtn: {
    border: '1px solid rgba(148,163,184,0.3)',
    background: 'transparent',
    color: '#94A3B8',
    borderRadius: '999px',
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'color 0.2s, border-color 0.2s',
  },
};

export default Saludos;
