import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const fmt = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const ROOM_FOTOS = ['/hcompartida.jpg', '/hdoble.jpg', '/Habitacion1.jpg', '/hdoble.jpg'];

const fmtLargo = (d) =>
  new Date(d + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

const fmtCorto = (d) =>
  new Date(d + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

const diaSemana = (d) =>
  new Date(d + 'T12:00').toLocaleDateString('es-CL', { weekday: 'long' });

const noches = (e, s) => Math.round((new Date(s) - new Date(e)) / 86400000);

const TERMINOS = [
  { icon: '🕐', titulo: 'Horarios', detalle: 'Check-in desde las 14:00 hrs · Check-out hasta las 11:00 hrs' },
  { icon: '❌', titulo: 'Cancelación', detalle: 'Gratis hasta 48 horas antes. Tarifa no reembolsable sin devolución.' },
  { icon: '💳', titulo: 'Pago al llegar', detalle: 'El saldo restante se abona en efectivo o tarjeta al momento del check-in.' },
  { icon: '🚫', titulo: 'No-show', detalle: 'La inasistencia sin cancelar previa será cobrada en su totalidad.' },
  { icon: '🏠', titulo: 'Normas del hostal', detalle: 'Prohibido fumar en interiores. Silencio después de las 22:00 hrs.' },
  { icon: '📋', titulo: 'Identidad', detalle: 'Se requiere presentar documento de identidad válido al check-in.' },
];

export default function Confirmacion() {
  const { slug } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const [verTerminos, setVerTerminos] = useState(false);

  if (!state?.reserva) { navigate(`/${slug}`); return null; }

  const { reserva, hab, hostal, entrada, salida, anticipo, resto } = state;
  const nn = noches(entrada, salida);

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>

      {/* ── Hero éxito ── */}
      <div style={{ background: '#fff', paddingTop: 48, paddingBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '0.5px solid #eee' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 4px 20px rgba(29,158,117,.2)' }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M7 16l6 6L25 10" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, color: '#111', marginBottom: 6, textAlign: 'center', lineHeight: 1.2 }}>
          ¡Reserva <em style={{ fontStyle: 'italic', color: '#1D9E75' }}>confirmada!</em>
        </h1>
        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', paddingInline: 24 }}>
          Enviamos la confirmación a <span style={{ fontWeight: 600, color: '#111' }}>{reserva.huesped_email}</span>
        </p>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* ── Card habitación ── */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.08)', marginBottom: 12 }}>
          <div style={{ height: 150, position: 'relative', overflow: 'hidden' }}>
            <img src={ROOM_FOTOS[0]} alt={hab.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: '#fff', fontStyle: 'italic' }}>{hab.nombre}</div>
            </div>
          </div>
          <div style={{ background: '#1a2e1e', padding: '10px 16px' }}>
            <div style={{ fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 2 }}>Hostal</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{hostal.nombre}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{hostal.ciudad}{hostal.direccion ? ` · ${hostal.direccion}` : ''}</div>
          </div>
        </div>

        {/* ── Fechas destacadas ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)', padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 4 }}>Check-in</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FF6A2F', letterSpacing: '-.01em' }}>{fmtCorto(entrada)}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'capitalize' }}>{diaSemana(entrada)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <svg width="20" height="14" viewBox="0 0 24 14" fill="none">
                <path d="M1 7h22M16 1l6 6-6 6" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ background: '#f5f5f5', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: '#666' }}>
                🌙 {nn} noche{nn !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 4 }}>Check-out</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FF6A2F', letterSpacing: '-.01em' }}>{fmtCorto(salida)}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'capitalize' }}>{diaSemana(salida)}</div>
            </div>
          </div>
        </div>

        {/* ── Detalle reserva ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)', padding: '2px 16px', marginBottom: 12 }}>
          {[
            ['Entrada',  fmtLargo(entrada)],
            ['Salida',   fmtLargo(salida)],
            ['Huésped',  reserva.huesped_nombre],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '0.5px solid #f5f5f5', fontSize: 13 }}>
              <span style={{ color: '#aaa' }}>{l}</span>
              <span style={{ fontWeight: 500, color: '#111' }}>{v}</span>
            </div>
          ))}
          <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 12px', margin: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 4 }}>
              <span>Anticipo pagado</span>
              <span>{fmt(anticipo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#1D9E75' }}>
              <span>Resto al check-in</span>
              <span>{fmt(resto)}</span>
            </div>
          </div>
        </div>

        {/* ── Aviso ── */}
        <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 14, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#633806', lineHeight: 1.6 }}>
            Recuerda llegar con tu nombre para el check-in. Si necesitas cancelar, hazlo con al menos 48 horas de anticipación.
          </span>
        </div>

        {/* ── Términos y condiciones ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden', marginBottom: 12 }}>
          <div onClick={() => setVerTerminos(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="3" stroke="#FF6A2F" strokeWidth="1.5"/>
                  <path d="M5 7h10M5 10h10M5 13h6" stroke="#FF6A2F" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Términos y condiciones</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>Condiciones de tu reserva</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
              style={{ transform: verTerminos ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
              <path d="M3 6l5 5 5-5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {verTerminos && (
            <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '4px 0 8px' }}>
              {TERMINOS.map(({ icon, titulo, detalle }) => (
                <div key={titulo} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '0.5px solid #f9f9f9' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 2 }}>{titulo}</div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{detalle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Acciones ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hostal.telefono && (
            <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1a2e1e', color: '#fff', borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 2.5A6.5 6.5 0 002.2 11.1L1 15l4-.9A6.5 6.5 0 0013.5 2.5z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              Contactar al hostal por WhatsApp
            </a>
          )}
          <button onClick={() => navigate(`/${slug}`)}
            style={{ width: '100%', background: 'transparent', border: '0.5px solid #ddd', borderRadius: 14, padding: 13, fontSize: 13, color: '#666', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            Volver al hostal
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: '#ccc', marginTop: 20, letterSpacing: '.06em' }}>
          Reservas · ReservasSaaS
        </div>
      </div>
    </div>
  );
}
