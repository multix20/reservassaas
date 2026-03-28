import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

const IconOjo = ({ abierto }) => abierto ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" stroke="#aaa" strokeWidth="1.6"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M10.73 10.73a3 3 0 004.24 4.24" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showPass, setShowPass]       = useState(false);
  const [recovery, setRecovery]       = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState(null);

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user?.email) {
        const { data: hostal } = await supabase
          .from('hostales')
          .select('tenant_id')
          .eq('admin_email', data.session.user.email)
          .single();
        if (hostal) { navigate(`/admin/${hostal.tenant_id}`); return; }
      }
      setLoading(false);
    });
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: eAuth } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (eAuth || !data.user) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    const { data: hostal } = await supabase
      .from('hostales')
      .select('tenant_id')
      .eq('admin_email', data.user.email)
      .single();

    if (!hostal) {
      setError('No tienes un hostal asociado a este email');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate(`/admin/${hostal.tenant_id}`);
  };

  const enviarRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error: eR } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/admin/login`,
    });
    setLoading(false);
    setRecoveryMsg(eR ? 'No se pudo enviar el correo.' : 'Revisa tu email para restablecer la contraseña.');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #eee', borderTopColor: '#FF6A2F', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#FF6A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-.02em', margin: 0 }}>Panel del hostal</h1>
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>ReservasSaaS</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,.08)', padding: '28px 24px' }}>

          {!recovery ? (
            <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tuhostal.cl"
                  required
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#FF6A2F'}
                  onBlur={e => e.target.style.borderColor = '#eee'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 12, padding: '12px 44px 12px 14px', fontSize: 14, color: '#111', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#FF6A2F'}
                    onBlur={e => e.target.style.borderColor = '#eee'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                    <IconOjo abierto={showPass} />
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fdd', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#c0392b' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: '#FF6A2F', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(255,106,47,.35)', marginTop: 4 }}>
                Ingresar al panel
              </button>

              <button type="button" onClick={() => { setRecovery(true); setError(null); }}
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#FF6A2F', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', padding: 0 }}>
                ¿Olvidaste tu contraseña?
              </button>

            </form>
          ) : (
            <form onSubmit={enviarRecovery} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, margin: 0 }}>Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tuhostal.cl"
                  required
                  style={{ width: '100%', border: '1.5px solid #eee', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111', fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {recoveryMsg && (
                <div style={{ background: recoveryMsg.includes('Revisa') ? '#f0faf4' : '#fff5f5', border: `1px solid ${recoveryMsg.includes('Revisa') ? '#b7dfc7' : '#fdd'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: recoveryMsg.includes('Revisa') ? '#1D9E75' : '#c0392b' }}>
                  {recoveryMsg}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: '#FF6A2F', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(255,106,47,.35)' }}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <button type="button" onClick={() => { setRecovery(false); setRecoveryMsg(null); }}
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#aaa', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', padding: 0 }}>
                ← Volver al login
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 24 }}>
          ¿Problemas para ingresar? Contacta a soporte por WhatsApp
        </p>
      </div>
    </div>
  );
}
