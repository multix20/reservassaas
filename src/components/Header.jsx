import React, { useState, useEffect } from 'react';
import { ChevronRight, MapPin, LogIn, UserPlus, X, Eye, EyeOff, LogOut } from 'lucide-react';
import supabase from '../lib/supabase';

export default function Header() {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const [modal,      setModal]        = useState(null);
  const [user,       setUser]         = useState(null);
  const [userMenu,   setUserMenu]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (drawerOpen || modal) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, modal]);

  const openModal  = (type) => { setModal(type); setDrawerOpen(false); setUserMenu(false); };
  const closeModal = () => setModal(null);

  const displayName = user
    ? (user.user_metadata?.full_name ?? user.email.split('@')[0])
    : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserMenu(false);
  };

  const navLinks = [
    { href: '#inicio',    label: 'Inicio'    },
    { href: '#servicios', label: 'Servicios' },
    { href: '#ventajas',  label: 'Ventajas'  },
    { href: '#reservas',  label: 'Reservar'  },
  ];

  const drawerItems = [
    { href: '#inicio',    label: 'Inicio',    desc: 'Bienvenida'        },
    { href: '#servicios', label: 'Servicios', desc: 'Lo que ofrecemos'  },
    { href: '#ventajas',  label: 'Ventajas',  desc: 'Por qué elegirnos' },
    { href: '#reservas',  label: 'Reservar',  desc: 'Elige tu viaje'    },
    { href: '#contacto',  label: 'Contacto',  desc: 'Escríbenos'        },
  ];

  return (
    <>
      <style>{CSS}</style>

      <header className={`hdr ${scrolled ? 'hdr--scrolled' : ''}`}>
        <div className="hdr__inner">

          <a href="#inicio" className="hdr__logo" aria-label="LLEVU">
            <span className="hdr__logo-mark">LL</span>
            <span className="hdr__logo-name">LLEVU</span>
          </a>

          <nav className="hdr__nav">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} className="hdr__nav-link">{label}</a>
            ))}
          </nav>

          <div className="hdr__actions">
            {user ? (
              <div style={{ position: 'relative' }}>
                <button className="hdr__user-pill" onClick={() => setUserMenu(v => !v)}>
                  <span>{displayName}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {userMenu && (
                  <>
                    <div className="user-menu-overlay" onClick={() => setUserMenu(false)}/>
                    <div className="user-menu">
                      <div className="user-menu__email">{user.email}</div>
                      {user.user_metadata?.phone && (
                        <div className="user-menu__phone">{user.user_metadata.phone}</div>
                      )}
                      <button className="user-menu__item" onClick={handleSignOut}>
                        <LogOut size={14}/> Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button className="hdr__signin"   onClick={() => openModal('login')}>Inicia sesión</button>
                <button className="hdr__register" onClick={() => openModal('register')}>Regístrate</button>
              </>
            )}
            <button className="hdr__hamburger" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />

      <aside className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer__header">
          <div className="drawer__logo">
            <span className="hdr__logo-mark" style={{ width: 30, height: 30, fontSize: 11 }}>LL</span>
            <span className="drawer__logo-name">LLEVU</span>
          </div>
          <button className="drawer__close" onClick={() => setDrawerOpen(false)}><X size={18}/></button>
        </div>

        {user && (
          <div className="drawer__user">
            <div className="drawer__user-avatar">{displayName[0].toUpperCase()}</div>
            <div>
              <div className="drawer__user-name">{displayName}</div>
              <div className="drawer__user-email">{user.email}</div>
              {user.user_metadata?.phone && (
                <div className="drawer__user-phone">{user.user_metadata.phone}</div>
              )}
            </div>
          </div>
        )}

        <nav className="drawer__nav">
          {drawerItems.map(({ href, label, desc }, i) => (
            <a key={href} href={href} className="drawer__item"
              style={{ animationDelay: `${i * 0.06 + 0.04}s` }}
              onClick={() => setDrawerOpen(false)}>
              <div>
                <div className="drawer__item-label">{label}</div>
                <div className="drawer__item-desc">{desc}</div>
              </div>
              <ChevronRight size={15} className="drawer__item-arrow"/>
            </a>
          ))}
        </nav>

        <div className="drawer__footer">
          {!user ? (
            <div className="drawer__auth-btns">
              <button className="drawer__btn-ghost" onClick={() => openModal('login')}>
                <LogIn size={15}/> Inicia sesión
              </button>
              <button className="drawer__btn-solid" onClick={() => openModal('register')}>
                <UserPlus size={15}/> Regístrate
              </button>
            </div>
          ) : (
            <button className="drawer__btn-ghost" style={{ width: '100%' }} onClick={handleSignOut}>
              <LogOut size={15}/> Cerrar sesión
            </button>
          )}
          <div className="drawer__location">
            <MapPin size={11}/><span>Región de La Araucanía, Chile</span>
          </div>
        </div>
      </aside>

      {modal && (
        <AuthModal
          mode={modal}
          onClose={closeModal}
          onSwitch={(m) => setModal(m)}
          onSuccess={closeModal}
        />
      )}
    </>
  );
}

/* ── Auth Modal ─────────────────────────────────────────────────────────────── */
function AuthModal({ mode, onClose, onSwitch, onSuccess }) {
  const isLogin = mode === 'login';
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');   // ← NUEVO
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const handleSubmit = async () => {
    reset();
    if (!email || !password) { setError('Completa todos los campos.'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      } else {
        if (!name)  { setError('Ingresa tu nombre.');    setLoading(false); return; }
        if (!phone) { setError('Ingresa tu teléfono.');  setLoading(false); return; }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone:     phone,   // ← se guarda en user_metadata
            },
          },
        });
        if (error) throw error;
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('Invalid login'))   setError('Email o contraseña incorrectos.');
      else if (msg.includes('registered')) setError('Este email ya está registrado.');
      else setError(msg || 'Error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}/>
      <div className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18}/></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          <span className="hdr__logo-mark">LL</span>
          <span className="hdr__logo-name" style={{ color: '#000' }}>LLEVU</span>
        </div>

        <h2 className="modal-title">{isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h2>
        <p className="modal-sub">
          {isLogin ? 'Inicia sesión para ver tus reservas' : 'Regístrate y reserva tu próximo viaje'}
        </p>

        <div className="modal-fields">
          {!isLogin && (
            <>
              {/* Nombre */}
              <div className="modal-field">
                <label className="modal-label">Nombre completo</label>
                <input className="modal-input" type="text" placeholder="Juan Pablo Pérez"
                  value={name} onChange={e => setName(e.target.value)} disabled={loading}/>
              </div>

              {/* Teléfono ← NUEVO */}
              <div className="modal-field">
                <label className="modal-label">Teléfono</label>
                <div className="modal-phone-wrap">
                  <span className="modal-phone-prefix">+56</span>
                  <input
                    className="modal-input modal-input--phone"
                    type="tel"
                    placeholder="9 1234 5678"
                    value={phone}
                    onChange={e => {
                      // Solo números y espacios
                      const val = e.target.value.replace(/[^\d\s]/g, '');
                      setPhone(val);
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="modal-field">
            <label className="modal-label">Email</label>
            <input className="modal-input" type="email" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={loading}/>
          </div>

          {/* Contraseña */}
          <div className="modal-field">
            <label className="modal-label">Contraseña</label>
            <div className="modal-pwd-wrap">
              <input className="modal-input modal-input--pwd"
                type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={loading}/>
              <button className="modal-pwd-eye" onClick={() => setShowPwd(v => !v)} type="button" tabIndex={-1}>
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
        </div>

        {error   && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}

        {!success && (
          <button className="modal-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="modal-spinner"/> : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        )}

        <p className="modal-switch">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button className="modal-switch-btn"
            onClick={() => { reset(); onSwitch(isLogin ? 'register' : 'login'); }}>
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </>
  );
}

/* ── Hamburger ───────────────────────────────────────────────────────────────── */
const HamburgerIcon = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
    <rect x="0" y="0"  width="20" height="2" rx="1" fill="currentColor"/>
    <rect x="4" y="6"  width="16" height="2" rx="1" fill="currentColor"/>
    <rect x="2" y="12" width="18" height="2" rx="1" fill="currentColor"/>
  </svg>
);

/* ── CSS ─────────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  .hdr*,.drawer*,.modal-card*{box-sizing:border-box}

  .hdr{position:fixed;top:0;left:0;right:0;z-index:200;background:#000;border-bottom:1px solid transparent;transition:border-color .3s,background .3s;font-family:'DM Sans',sans-serif}
  .hdr--scrolled{border-bottom-color:#1a1a1a;background:rgba(0,0,0,.96);backdrop-filter:blur(10px)}
  .hdr__inner{max-width:1100px;margin:0 auto;padding:0 1.25rem;height:64px;display:flex;align-items:center;justify-content:space-between;gap:1rem}

  .hdr__logo{display:flex;align-items:center;gap:6px;text-decoration:none;flex-shrink:0;transition:opacity .2s}
  .hdr__logo:hover{opacity:.85}
  .hdr__logo-mark{width:34px;height:34px;border-radius:8px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;letter-spacing:-0.5px;flex-shrink:0}
  .hdr__logo-name{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:-0.5px;line-height:1}

  .hdr__nav{display:none;align-items:center;gap:.25rem;flex:1;margin-left:2rem}
  @media(min-width:768px){.hdr__nav{display:flex}}
  .hdr__nav-link{padding:6px 14px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:500;color:#bbb;transition:all .18s}
  .hdr__nav-link:hover{color:#fff;background:#111}

  .hdr__actions{display:flex;align-items:center;gap:4px;flex-shrink:0}
  .hdr__signin{padding:8px 14px;border-radius:8px;border:none;background:transparent;font-size:15px;font-weight:500;color:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .18s;white-space:nowrap}
  .hdr__signin:hover{background:#111}
  .hdr__register{padding:8px 16px;border-radius:99px;border:1.5px solid #fff;background:transparent;font-size:15px;font-weight:600;color:#fff;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;white-space:nowrap}
  .hdr__register:hover{background:#fff;color:#000}
  .hdr__user-pill{display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:99px;border:1.5px solid #333;background:transparent;font-size:15px;font-weight:600;color:#fff;cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif}
  .hdr__user-pill:hover{border-color:#fff;background:#111}

  .user-menu-overlay{position:fixed;inset:0;z-index:299}
  .user-menu{position:absolute;top:calc(100% + 8px);right:0;background:#111;border:1px solid #222;border-radius:12px;padding:8px;min-width:200px;z-index:300;box-shadow:0 8px 30px rgba(0,0,0,.5);animation:fadeDown .18s ease both}
  @keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  .user-menu__email{padding:6px 10px 4px;font-size:12px;color:#555}
  .user-menu__phone{padding:0 10px 10px;font-size:12px;color:#444;border-bottom:1px solid #1e1e1e;margin-bottom:4px}
  .user-menu__item{display:flex;align-items:center;gap:8px;width:100%;padding:10px;border-radius:8px;border:none;background:transparent;color:#ccc;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s}
  .user-menu__item:hover{background:#1a1a1a;color:#fff}

  .hdr__hamburger{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:8px;background:transparent;border:none;color:#fff;cursor:pointer;transition:background .18s;margin-left:6px}
  .hdr__hamburger:hover{background:#1a1a1a}
  @media(min-width:768px){.hdr__hamburger{display:none}}

  .drawer-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .3s}
  .drawer-overlay.open{opacity:1;pointer-events:all}

  .drawer{position:fixed;top:0;right:0;bottom:0;width:min(300px,82vw);z-index:400;background:#050505;border-left:1px solid #1a1a1a;transform:translateX(100%);transition:transform .38s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;font-family:'DM Sans',sans-serif}
  .drawer.open{transform:translateX(0)}
  .drawer__header{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.25rem;border-bottom:1px solid #141414}
  .drawer__logo{display:flex;align-items:center;gap:6px}
  .drawer__logo-name{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#fff;letter-spacing:-0.3px}
  .drawer__close{width:34px;height:34px;border-radius:8px;border:1px solid #222;background:transparent;color:#888;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
  .drawer__close:hover{border-color:#444;color:#fff}

  .drawer__user{display:flex;align-items:center;gap:12px;padding:1rem 1.25rem;border-bottom:1px solid #141414;background:#0a0a0a}
  .drawer__user-avatar{width:40px;height:40px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:16px;flex-shrink:0}
  .drawer__user-name{font-size:15px;font-weight:600;color:#fff}
  .drawer__user-email{font-size:12px;color:#555;margin-top:1px}
  .drawer__user-phone{font-size:12px;color:#444;margin-top:1px}

  .drawer__nav{flex:1;padding:.75rem;display:flex;flex-direction:column;overflow-y:auto}
  .drawer__item{display:flex;align-items:center;justify-content:space-between;padding:.85rem;border-radius:12px;text-decoration:none;opacity:0;animation:drawerSlide .35s ease both;transition:background .18s}
  .drawer__item:hover{background:#111}
  .drawer__item:hover .drawer__item-arrow{transform:translateX(3px);color:#fff}
  .drawer__item-label{font-size:16px;font-weight:600;color:#fff}
  .drawer__item-desc{font-size:11px;color:#444;margin-top:1px}
  .drawer__item-arrow{color:#333;transition:all .18s;flex-shrink:0}
  @keyframes drawerSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}

  .drawer__footer{padding:1rem 1.25rem;border-top:1px solid #141414}
  .drawer__auth-btns{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
  .drawer__btn-ghost{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:transparent;border:1.5px solid #222;border-radius:10px;color:#bbb;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
  .drawer__btn-ghost:hover{border-color:#555;color:#fff}
  .drawer__btn-solid{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px;background:#fff;border:none;border-radius:10px;color:#000;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
  .drawer__btn-solid:hover{background:#e8e8e8}
  .drawer__location{display:flex;align-items:center;gap:5px;justify-content:center;margin-top:10px;color:#333;font-size:11px}

  /* Modal */
  .modal-overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);animation:fadeIn .2s ease both}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal-card{position:fixed;top:50%;left:50%;z-index:501;transform:translate(-50%,-50%);background:#fff;border-radius:20px;padding:2rem 1.75rem;width:min(420px,92vw);box-shadow:0 24px 80px rgba(0,0,0,.4);animation:modalUp .28s cubic-bezier(.22,.68,0,1.2) both;font-family:'DM Sans',sans-serif;max-height:90vh;overflow-y:auto}
  @keyframes modalUp{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  .modal-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:8px;border:1px solid #e5e5e5;background:transparent;color:#999;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s}
  .modal-close:hover{background:#f5f5f5;color:#000}
  .modal-title{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#000;margin-bottom:4px}
  .modal-sub{font-size:.87rem;color:#888;margin-bottom:1.5rem}
  .modal-fields{display:flex;flex-direction:column;gap:12px;margin-bottom:1rem}
  .modal-field{display:flex;flex-direction:column;gap:5px}
  .modal-label{font-size:.78rem;font-weight:600;color:#555;letter-spacing:.02em}
  .modal-input{width:100%;padding:12px 14px;border:1.5px solid #e5e5e5;border-radius:10px;font-size:.93rem;font-family:'DM Sans',sans-serif;color:#000;background:#fafafa;outline:none;transition:border-color .2s}
  .modal-input:focus{border-color:#000;background:#fff}
  .modal-input::placeholder{color:#bbb}
  .modal-input:disabled{opacity:.5}

  /* Teléfono con prefijo */
  .modal-phone-wrap{display:flex;align-items:center;border:1.5px solid #e5e5e5;border-radius:10px;background:#fafafa;overflow:hidden;transition:border-color .2s}
  .modal-phone-wrap:focus-within{border-color:#000;background:#fff}
  .modal-phone-prefix{padding:12px 10px 12px 14px;font-size:.93rem;font-weight:600;color:#555;border-right:1.5px solid #e5e5e5;white-space:nowrap;flex-shrink:0}
  .modal-input--phone{border:none !important;border-radius:0 !important;background:transparent !important;padding-left:10px}
  .modal-input--phone:focus{border:none;outline:none}

  .modal-pwd-wrap{position:relative}
  .modal-input--pwd{padding-right:44px}
  .modal-pwd-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#aaa;cursor:pointer;padding:4px;display:flex;align-items:center}
  .modal-pwd-eye:hover{color:#000}
  .modal-error{padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#c0290e;font-size:.82rem;margin-bottom:.75rem}
  .modal-success{padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;color:#166534;font-size:.82rem;margin-bottom:.75rem}
  .modal-submit{width:100%;padding:14px;background:#000;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:.75rem}
  .modal-submit:hover:not(:disabled){background:#1a1a1a}
  .modal-submit:disabled{opacity:.5;cursor:not-allowed}
  .modal-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
  @keyframes spin{to{transform:rotate(360deg)}}
  .modal-switch{text-align:center;font-size:.83rem;color:#888}
  .modal-switch-btn{background:none;border:none;color:#000;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;font-size:.83rem;text-decoration:underline}
  .modal-switch-btn:hover{color:#555}
`;