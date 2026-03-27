import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

export default function Home() {
  const [hostales, setHostales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('hostales')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      setHostales(data || []);
      setCargando(false);
    }
    cargar();
  }, []);

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', fontFamily: "'DM Sans',sans-serif" }}>
      <p style={{ color: '#aaa', fontSize: 13 }}>Cargando...</p>
    </div>
  );

  const hostal = hostales[0] || null;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#fff', minHeight: '100vh' }}>

      {hostales.length === 0 && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#aaa', fontSize: 14 }}>No hay hostales disponibles.</p>
        </div>
      )}

      {hostal && (
        <>
          {/* ── HERO ── */}
          <HeroSection hostal={hostal} onReservar={() => navigate(`/${hostal.tenant_id}`)} />

          {/* ── HABITACIONES ── */}
          <section id="habitaciones" style={{ padding: '72px 28px 56px', background: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>Alojamiento</p>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#111', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 14 }}>Nuestras Habitaciones</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              {hostal.descripcion || 'Encuentra el espacio ideal para tu estadía. Desde habitaciones compartidas hasta privadas, diseñadas para que te sientas como en casa.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
              {[
                { img: '/hcompartida.jpg', label: 'Compartida' },
                { img: '/hdoble.jpg',      label: 'Privada' },
                { img: '/Habitacion1.jpg', label: 'Premium' },
                { img: '/iglu.jpg',        label: 'Especial' },
              ].map(({ img, label }) => (
                <div key={label} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
                  <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 60%)' }} />
                  <span style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 12, fontWeight: 700, color: '#fff' }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(`/${hostal.tenant_id}`)}
              style={{ width: '100%', background: '#FF6A2F', color: '#fff', border: 'none', borderRadius: 50, padding: '15px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 20px rgba(255,106,47,.3)' }}>
              Ver disponibilidad →
            </button>
          </section>

          {/* ── PROMOCIONES ── */}
          <section id="promociones" style={{ padding: '56px 28px', background: '#fff9f5' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>Ofertas</p>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#111', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 28 }}>Promociones</h2>

            {/* Promo 1 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '24px', marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.08em', textTransform: 'uppercase' }}>Estadía larga</span>
                <span style={{ background: '#FF6A2F', color: '#fff', borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>-15%</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>7 noches o más</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 16 }}>
                Quédate más tiempo y ahorra. Descuento automático al reservar 7 noches o más.
              </p>
              <button onClick={() => navigate(`/${hostal.tenant_id}`)}
                style={{ background: 'none', border: '1.5px solid #FF6A2F', color: '#FF6A2F', borderRadius: 50, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Reservar con descuento
              </button>
            </div>

            {/* Promo 2 */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.08em', textTransform: 'uppercase' }}>Sin reembolso</span>
                <span style={{ background: '#111', color: '#fff', borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 800 }}>-10%</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>Tarifa no reembolsable</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 16 }}>
                Si tienes tus fechas claras, paga por adelantado y obtén un precio especial.
              </p>
              <button onClick={() => navigate(`/${hostal.tenant_id}`)}
                style={{ background: 'none', border: '1.5px solid #111', color: '#111', borderRadius: 50, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                Aprovechar oferta
              </button>
            </div>
          </section>

          {/* ── CONTACTO ── */}
          <section id="contacto" style={{ padding: '56px 28px 80px', background: '#fff' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>Encuéntranos</p>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#111', letterSpacing: '-.03em', lineHeight: 1.1, marginBottom: 28 }}>Contacto</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {hostal.ciudad && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px', background: '#f8f8f8', borderRadius: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FF6A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#fff" strokeWidth="1.6"/>
                      <circle cx="12" cy="9" r="2.5" stroke="#fff" strokeWidth="1.6"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#999', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Ubicación</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{hostal.ciudad}</p>
                    {hostal.direccion && <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{hostal.direccion}</p>}
                  </div>
                </div>
              )}

              {hostal.telefono && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px', background: '#f0faf4', borderRadius: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd"
                        d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.47 1.64 6.36L3 29l6.83-1.6A13 13 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm-3.4 7.5c-.3-.66-.62-.67-.9-.68l-.77-.01c-.27 0-.7.1-1.07.5s-1.4 1.37-1.4 3.34 1.44 3.87 1.64 4.14c.2.27 2.77 4.4 6.82 5.99 3.37 1.33 4.06 1.07 4.79 1s2.32-.95 2.65-1.87c.33-.92.33-1.71.23-1.87-.1-.16-.37-.26-.77-.46s-2.4-1.18-2.77-1.32c-.37-.13-.64-.2-.9.2s-1.03 1.32-1.27 1.59c-.23.27-.47.3-.87.1s-1.7-.63-3.24-2c-1.2-1.07-2-2.38-2.24-2.78-.23-.4-.02-.61.18-.81.17-.18.4-.46.6-.69.2-.23.26-.4.4-.66.13-.27.06-.5-.03-.7z"
                        fill="#fff"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1a8a40', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Teléfono</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{hostal.telefono}</p>
                    <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Respondemos rápido</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <footer style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: '#ccc', letterSpacing: '.06em', borderTop: '0.5px solid #f0f0f0' }}>
            ReservasSaaS · Reservas en línea
          </footer>

          {/* ── Botón flotante WhatsApp ── */}
          {hostal.telefono && (
            <a href={`https://wa.me/${hostal.telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
              style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 200, width: 60, height: 60, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(37,211,102,.5)', textDecoration: 'none' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.47 1.64 6.36L3 29l6.83-1.6A13 13 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm-3.4 7.5c-.3-.66-.62-.67-.9-.68l-.77-.01c-.27 0-.7.1-1.07.5s-1.4 1.37-1.4 3.34 1.44 3.87 1.64 4.14c.2.27 2.77 4.4 6.82 5.99 3.37 1.33 4.06 1.07 4.79 1s2.32-.95 2.65-1.87c.33-.92.33-1.71.23-1.87-.1-.16-.37-.26-.77-.46s-2.4-1.18-2.77-1.32c-.37-.13-.64-.2-.9.2s-1.03 1.32-1.27 1.59c-.23.27-.47.3-.87.1s-1.7-.63-3.24-2c-1.2-1.07-2-2.38-2.24-2.78-.23-.4-.02-.61.18-.81.17-.18.4-.46.6-.69.2-.23.26-.4.4-.66.13-.27.06-.5-.03-.7z"
                  fill="#fff"/>
              </svg>
            </a>
          )}
        </>
      )}
    </div>
  );
}

const NAV_ITEMS = ['Home', 'Habitaciones', 'Promociones', 'Contacto'];

function HeroSection({ hostal, onReservar }) {
  const foto = '/castillo.jpg';
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (item) => {
    setMenuAbierto(false);
    const id = item.toLowerCase();
    if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="home" style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero foto */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <img src={foto} alt={hostal.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.55) 80%, rgba(0,0,0,.75) 100%)' }} />
      </div>

      {/* Header fijo */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: scrolled ? '#fff' : 'transparent', boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,.08)' : 'none', transition: 'background .25s, box-shadow .25s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FF6A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: scrolled ? '#111' : '#fff', letterSpacing: '-.01em', transition: 'color .25s' }}>{hostal.nombre}</span>
        </div>

        <button onClick={() => setMenuAbierto(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6"  width="18" height="2" rx="1" fill={scrolled ? '#FF6A2F' : '#fff'}/>
            <rect x="3" y="11" width="18" height="2" rx="1" fill={scrolled ? '#FF6A2F' : '#fff'}/>
            <rect x="3" y="16" width="18" height="2" rx="1" fill={scrolled ? '#FF6A2F' : '#fff'}/>
          </svg>
        </button>
      </div>

      {/* Overlay menú */}
      {menuAbierto && (
        <div onClick={() => setMenuAbierto(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)' }} />
      )}

      {/* Panel menú */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 280, zIndex: 110, background: '#fff', transform: menuAbierto ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .28s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column', padding: '0 28px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '0.5px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FF6A2F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{hostal.nombre}</span>
          </div>
          <button onClick={() => setMenuAbierto(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, color: '#FF6A2F', lineHeight: 1, padding: 4 }}>
            ×
          </button>
        </div>

        <nav style={{ marginTop: 8 }}>
          {NAV_ITEMS.map((item) => (
            <button key={item} onClick={() => scrollTo(item)}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '18px 0', fontSize: 18, fontWeight: 600, color: '#111', borderBottom: '0.5px solid #f0f0f0', fontFamily: "'DM Sans',sans-serif" }}>
              {item}
            </button>
          ))}
        </nav>

      </div>

      {/* Contenido central */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 20px 60px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,.72) 0%, rgba(255,255,255,.52) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: 22,
          padding: '20px 20px 18px',
          maxWidth: 230,
          border: '1px solid rgba(255,255,255,.55)',
          boxShadow: '0 8px 32px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.6)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>
            {hostal.ciudad || 'Chile'}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111', lineHeight: 1.1, marginBottom: 8, letterSpacing: '-.03em' }}>
            {hostal.nombre}
          </h1>
          {hostal.descripcion && (
            <p style={{ fontSize: 11, color: 'rgba(0,0,0,.6)', lineHeight: 1.55, marginBottom: 16 }}>
              {hostal.descripcion.slice(0, 70)}{hostal.descripcion.length > 70 ? '...' : ''}
            </p>
          )}
          <button onClick={onReservar}
            style={{ width: '100%', background: 'linear-gradient(135deg, #FF6A2F 0%, #e85520 100%)', color: '#fff', border: 'none', borderRadius: 50, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(255,106,47,.45)', letterSpacing: '-.01em' }}>
            Reservar ahora →
          </button>
        </div>
      </div>

      {/* Info inferior */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {hostal.direccion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="rgba(255,255,255,.8)" strokeWidth="1.5"/>
              <circle cx="12" cy="9" r="2.5" stroke="rgba(255,255,255,.8)" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{hostal.direccion}</span>
          </div>
        )}
      </div>

    </div>
  );
}
