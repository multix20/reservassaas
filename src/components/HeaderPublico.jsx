import React, { useState } from 'react';

const NAV_ITEMS = ['Home', 'Habitaciones', 'Promociones', 'Contacto'];

export default function HeaderPublico({ hostal }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleNav = (item) => {
    setMenuAbierto(false);
    const id = item.toLowerCase();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Barra superior ── */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 50,
        background: '#fdf6ee', borderBottom: '0.5px solid #e8ddd0',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo circular */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#c97a3a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1 }}>
              {hostal?.nombre?.split(' ')[0] || 'Hostal'}
            </span>
            {hostal?.nombre?.split(' ').length > 1 && (
              <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,.8)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {hostal.nombre.split(' ').slice(1).join(' ')}
              </span>
            )}
          </div>

          {/* Tagline */}
          <span style={{
            fontFamily: "'Georgia', serif",
            fontSize: 15, fontStyle: 'italic',
            color: '#7a6a5a', letterSpacing: '.01em',
          }}>
            {hostal?.descripcion?.split('.')[0] || hostal?.nombre || ''}
          </span>
        </div>

        {/* Botón hamburguesa */}
        <button
          onClick={() => setMenuAbierto(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6"  width="18" height="2" rx="1" fill="#c97a3a"/>
            <rect x="3" y="11" width="18" height="2" rx="1" fill="#c97a3a"/>
            <rect x="3" y="16" width="18" height="2" rx="1" fill="#c97a3a"/>
          </svg>
        </button>
      </div>

      {/* ── Menú lateral / overlay ── */}
      {menuAbierto && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.4)',
          }}
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: `translateX(-50%) translateX(${menuAbierto ? '0px' : '480px'})`,
        width: '100%', maxWidth: 480, height: '100vh',
        background: '#fdf6ee', zIndex: 110,
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        padding: '0 28px 40px',
        overflowY: 'auto',
      }}>

        {/* Cabecera del menú */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 0 24px',
          borderBottom: '0.5px solid #e0d4c8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#c97a3a',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1 }}>
                {hostal?.nombre?.split(' ')[0] || 'Hostal'}
              </span>
              {hostal?.nombre?.split(' ').length > 1 && (
                <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,.8)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  {hostal.nombre.split(' ').slice(1).join(' ')}
                </span>
              )}
            </div>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontStyle: 'italic', color: '#7a6a5a' }}>
              {hostal?.descripcion?.split('.')[0] || hostal?.nombre || ''}
            </span>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={() => setMenuAbierto(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 26, color: '#c97a3a', lineHeight: 1, padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Items de navegación */}
        <nav style={{ marginTop: 12 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => handleNav(item)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '18px 0',
                fontSize: 20, fontWeight: 600, color: '#3a2e25',
                letterSpacing: '-.01em',
                borderBottom: '0.5px solid #ecddd0',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Datos de contacto al pie */}
        {(hostal?.telefono || hostal?.ciudad) && (
          <div style={{ marginTop: 'auto', paddingTop: 32 }}>
            {hostal.ciudad && (
              <p style={{ fontSize: 13, color: '#9a8878', marginBottom: 6 }}>
                {hostal.ciudad}
              </p>
            )}
            {hostal.telefono && (
              <a
                href={`https://wa.me/${hostal.telefono.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: '#c97a3a', textDecoration: 'none', fontWeight: 600 }}
              >
                WhatsApp →
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
