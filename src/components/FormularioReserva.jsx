import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import supabase from '../lib/supabase';
import CalendarioReserva from './CalendarioReserva';


const noches = (e, s) => Math.round((new Date(s) - new Date(e)) / 86400000);
const ANTICIPO_PCT = 0.3;

const MEDIOS_PAGO = [
  { id: 'flow',   nombre: 'Flow.cl',              desc: 'Transferencia bancaria Chile',  color: '#1a6b3c', bg: '#e8f4e8' },
  { id: 'mp',     nombre: 'MercadoPago',           desc: 'Tarjeta, débito o saldo MP',    color: '#fff',    bg: '#009EE3' },
  { id: 'stripe', nombre: 'Tarjeta internacional', desc: 'Visa, Mastercard, Amex',        color: '#fff',    bg: '#635BFF' },
];

const MONEDAS = [
  { id: 'CLP', simbolo: '$',   nombre: 'Peso Chileno',     tasa: 1,        decimales: 0 },
  { id: 'USD', simbolo: 'US$', nombre: 'Dólar Americano',  tasa: 0.00106,  decimales: 2 },
  { id: 'EUR', simbolo: '€',   nombre: 'Euro',             tasa: 0.00096,  decimales: 2 },
  { id: 'BRL', simbolo: 'R$',  nombre: 'Real Brasileño',   tasa: 0.00526,  decimales: 2 },
  { id: 'ARS', simbolo: 'AR$', nombre: 'Peso Argentino',   tasa: 1.12,     decimales: 0 },
  { id: 'MXN', simbolo: 'MX$', nombre: 'Peso Mexicano',    tasa: 0.019,    decimales: 0 },
];

const IDIOMAS = [
  { id: 'es', bandera: '🇨🇱', nombre: 'Español' },
  { id: 'en', bandera: '🇺🇸', nombre: 'English' },
  { id: 'pt', bandera: '🇧🇷', nombre: 'Português' },
  { id: 'fr', bandera: '🇫🇷', nombre: 'Français' },
  { id: 'de', bandera: '🇩🇪', nombre: 'Deutsch' },
];

/* ── Íconos ── */
const IconPersona = ({ c = '#FF6A2F' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconEmail = ({ c = '#FF6A2F' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="3" stroke={c} strokeWidth="1.6"/>
    <path d="M2 8l10 7 10-7" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconTel = ({ c = '#FF6A2F' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={c} strokeWidth="1.6"/>
    <circle cx="12" cy="18" r="1" fill={c}/>
    <path d="M9 5h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconNota = ({ c = '#FF6A2F' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={c} strokeWidth="1.6"/>
    <path d="M7 8h10M7 12h10M7 16h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconPago = ({ c = '#FF6A2F' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="13" rx="3" stroke={c} strokeWidth="1.6"/>
    <path d="M2 10h20" stroke={c} strokeWidth="1.6"/>
    <rect x="5" y="13" width="4" height="2" rx="1" fill={c}/>
  </svg>
);
const IconCalendario = ({ c = '#fff' }) => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2" width="12" height="11" rx="2" stroke={c} strokeWidth="1.3"/>
    <path d="M4 1v2M10 1v2M1 6h12" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const fmtFecha = (d) =>
  new Date(d + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

const inputStyle = {
  width: '100%', border: 'none', borderBottom: '0.5px solid #eee',
  padding: '4px 0', fontSize: 14, color: '#111',
  fontFamily: "'DM Sans',sans-serif", background: 'transparent', outline: 'none',
};

function Campo({ icon, label, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 4 }}>{label}</div>
        {children}
      </div>
    </div>
  );
}

export default function FormularioReserva() {
  const { slug } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();

  if (!state?.hab) { navigate(`/${slug}`); return null; }

  const { hab: habInicial, hostal, entrada: entradaInicial, salida: salidaInicial, huespedes: huespedesInicial = 1, habitaciones = [] } = state;

  const [hab, setHab]                 = useState(habInicial);
  const [entrada, setEntrada]         = useState(entradaInicial);
  const [salida, setSalida]           = useState(salidaInicial);
  const [huespedes, setHuespedes]     = useState(huespedesInicial);
  const [verCalendario, setVerCalendario] = useState(false);
  const [verHuespedes, setVerHuespedes]   = useState(false);
  const [carrusel, setCarrusel]           = useState(null); // { fotos, idx, nombre }

  const FOTOS_HAB = [
    ['/hcompartida.jpg', '/Habitacion1.jpg', '/iglu.jpg'],
    ['/hdoble.jpg', '/Habitacion1.jpg', '/hcompartida.jpg'],
    ['/Habitacion1.jpg', '/hdoble.jpg', '/iglu.jpg'],
    ['/iglu.jpg', '/hcompartida.jpg', '/hdoble.jpg'],
  ];

  const nn       = noches(entrada, salida);
  const total    = hab.precio_noche * nn * huespedes;
  const anticipo = Math.round(total * ANTICIPO_PCT);
  const resto    = total - anticipo;

  const [paso, setPaso]           = useState(1);
  const [enviando, setEnviando]   = useState(false);
  const [error, setError]         = useState(null);
  const [medioPago, setMedioPago] = useState('flow');
  const [verResumen, setVerResumen] = useState(false);
  const [moneda, setMoneda]       = useState('CLP');
  const [idioma, setIdioma]       = useState('es');
  const [verMoneda, setVerMoneda] = useState(false);
  const [verIdioma, setVerIdioma] = useState(false);

  const monedaActual = MONEDAS.find(m => m.id === moneda);
  const fmtM = (n) => {
    const v = n * monedaActual.tasa;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency', currency: moneda, maximumFractionDigits: monedaActual.decimales
    }).format(v);
  };
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validar = () => {
    if (!form.nombre.trim())       return 'El nombre es obligatorio';
    if (!form.email.includes('@')) return 'El email no es válido';
    if (!form.telefono.trim())     return 'El teléfono es obligatorio';
    return null;
  };

  const avanzar = () => {
    const err = validar();
    if (err) { setError(err); return; }
    setError(null); setPaso(2);
  };

  const confirmarYPagar = async () => {
    setEnviando(true); setError(null);
    try {
      const { error: eR } = await supabase.from('reservas_hostal').insert({
        hostal_id: hostal.id, habitacion_id: hab.id,
        huesped_nombre: form.nombre.trim(),
        huesped_email: form.email.trim().toLowerCase(),
        huesped_telefono: form.telefono.trim(),
        fecha_entrada: entrada, fecha_salida: salida,
        precio_por_noche: hab.precio_noche,
        num_huespedes: huespedes,
        notas: form.notas.trim() || null,
        estado: 'pendiente',
      });
      if (eR) throw new Error(eR.message);
      navigate(`/${slug}/confirmacion`, {
        state: { reserva: { huesped_nombre: form.nombre.trim(), huesped_email: form.email.trim().toLowerCase() }, hab, hostal, entrada, salida, anticipo, resto }
      });
    } catch {
      setError('Hubo un problema al procesar tu reserva. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  const medio = MEDIOS_PAGO.find(m => m.id === medioPago);


  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 88 }}>

      {/* ── Header ── */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', position: 'sticky', top: 0, zIndex: 50 }}>

        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Izquierda: volver + nombre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <button onClick={() => paso === 1 ? navigate(`/${slug}`, { state: { entrada, salida, huespedes, hab_id: hab.id } }) : setPaso(1)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3L6 8l4 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostal.nombre}</span>
          </div>

          {/* Derecha: globo + moneda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, marginLeft: 16 }}>

            {/* Globo → idioma */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setVerIdioma(v => !v); setVerMoneda(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={verIdioma ? '#FF6A2F' : '#555'} strokeWidth="1.6"/>
                  <path d="M12 2C9.5 6 8 9 8 12s1.5 6 4 10M12 2c2.5 4 4 7 4 10s-1.5 6-4 10M2 12h20" stroke={verIdioma ? '#FF6A2F' : '#555'} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
              {verIdioma && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.15)', overflow: 'hidden', minWidth: 170, zIndex: 300 }}>
                  {IDIOMAS.map(l => (
                    <div key={l.id} onClick={() => { setIdioma(l.id); setVerIdioma(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', background: idioma === l.id ? '#fff5f0' : '#fff', borderBottom: '0.5px solid #f5f5f5' }}>
                      <span style={{ fontSize: 18 }}>{l.bandera}</span>
                      <span style={{ fontSize: 13, fontWeight: idioma === l.id ? 700 : 400, color: idioma === l.id ? '#FF6A2F' : '#111' }}>{l.nombre}</span>
                      {idioma === l.id && <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#FF6A2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Código moneda */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setVerMoneda(v => !v); setVerIdioma(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: verMoneda ? '#FF6A2F' : '#555', letterSpacing: '.02em' }}>{moneda}</span>
              </button>
              {verMoneda && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.15)', overflow: 'hidden', minWidth: 200, zIndex: 300 }}>
                  {MONEDAS.map(m => (
                    <div key={m.id} onClick={() => { setMoneda(m.id); setVerMoneda(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', background: moneda === m.id ? '#fff5f0' : '#fff', borderBottom: '0.5px solid #f5f5f5' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#333', minWidth: 38 }}>{m.id}</span>
                      <span style={{ fontSize: 12, color: '#888', flex: 1 }}>{m.nombre}</span>
                      {moneda === m.id && <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#FF6A2F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Barra progreso ── */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px 10px' }}>
          {[1, 2].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= paso ? '#FF6A2F' : '#eee', transition: 'background .3s' }} />
          ))}
        </div>

      </div>

      <div style={{ padding: '14px 16px 0' }}>

        {/* ── Pill de fechas + huéspedes ── */}
        <div style={{ background: '#fff', borderRadius: 50, border: '1px solid #e8e8e8', boxShadow: '0 1px 6px rgba(0,0,0,.06)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '5px' }}>
            {/* Lado izquierdo — abre calendario */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0 }}>
              <div onClick={() => setVerCalendario(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: '#FF6A2F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <IconCalendario />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 6px' }}>
                <button
                  onClick={() => {
                    const d = new Date(salida + 'T12:00');
                    d.setDate(d.getDate() - 1);
                    const nueva = d.toISOString().slice(0, 10);
                    if (nueva > entrada) setSalida(nueva);
                  }}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #ddd', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', lineHeight: 1, flexShrink: 0 }}>−</button>
                <div onClick={() => setVerCalendario(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#111', cursor: 'pointer' }}>
                  <span>{fmtFecha(entrada)} → {fmtFecha(salida)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#555" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{nn}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const d = new Date(salida + 'T12:00');
                    d.setDate(d.getDate() + 1);
                    setSalida(d.toISOString().slice(0, 10));
                  }}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #FF6A2F', background: '#FF6A2F', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', lineHeight: 1, flexShrink: 0 }}>+</button>
              </div>
            </div>
            {/* Divisor */}
            <div style={{ width: 1, height: 22, background: '#e8e8e8', flexShrink: 0 }} />
            {/* Lado derecho — selector huéspedes */}
            <div onClick={(e) => { e.stopPropagation(); setVerHuespedes(v => !v); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke={verHuespedes ? '#FF6A2F' : '#555'} strokeWidth="1.6"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={verHuespedes ? '#FF6A2F' : '#555'} strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: verHuespedes ? '#FF6A2F' : '#111' }}>{huespedes}</span>
            </div>
          </div>

          {/* Selector inline */}
          {verHuespedes && (
            <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>Huéspedes</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => setHuespedes(h => Math.max(1, h - 1))}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #ddd', background: '#fff', fontSize: 18, cursor: huespedes <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', lineHeight: 1 }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111', minWidth: 18, textAlign: 'center' }}>{huespedes}</span>
                <button onClick={() => setHuespedes(h => Math.min(20, h + 1))}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #FF6A2F', background: '#FF6A2F', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', lineHeight: 1 }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Card resumen precio (desplegable) ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,.07)', marginBottom: 14, overflow: 'hidden' }}>

          {/* Cabecera siempre visible */}
          <div onClick={() => setVerResumen(v => !v)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#aaa' }}>{fmtFecha(entrada)} → {fmtFecha(salida)}</span>
              {hab.tarifa === 'nr' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#E1F5EE', borderRadius: 20, padding: '3px 10px' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.4l-3.7 2.2.7-4.1-3-2.9 4.2-.6z" fill="#1D9E75"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75', letterSpacing: '.04em' }}>NO REEMBOLSABLE</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff5f0', borderRadius: 20, padding: '3px 10px' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM8 5v4l2.5 2.5" stroke="#FF6A2F" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#FF6A2F', letterSpacing: '.04em' }}>FLEXIBLE</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 8 }}>{hab.nombre}</div>
            {habitaciones.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
                {habitaciones.map((h, i) => {
                  const fotos = FOTOS_HAB[i % FOTOS_HAB.length];
                  const precio = hab.tarifa === 'nr' ? Math.round(h.precio_noche * 0.9) : h.precio_noche;
                  const activa = h.id === hab.id;
                  return (
                    <div key={h.id} onClick={() => { setHab({ ...h, precio_noche: precio, tarifa: hab.tarifa }); setCarrusel({ fotos, idx: 0, nombre: h.nombre }); }}
                      style={{ flexShrink: 0, width: 80, borderRadius: 10, overflow: 'hidden', border: activa ? '2px solid #FF6A2F' : '1.5px solid #eee', cursor: 'pointer', opacity: activa ? 1 : 0.75 }}>
                      <img src={fotos[0]} alt={h.nombre} style={{ width: '100%', height: 52, objectFit: 'cover' }} />
                      <div style={{ padding: '4px 6px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: activa ? '#FF6A2F' : '#555', lineHeight: 1.2, marginBottom: 2 }}>{h.nombre}</div>
                        <div style={{ fontSize: 9, color: '#888' }}>${(precio/1000).toFixed(0)}K/n</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#111', letterSpacing: '-.03em', lineHeight: 1 }}>
                {fmtM(total)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Noches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 20, padding: '5px 10px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#555" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{nn}</span>
                </div>
                {/* Personas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f5', borderRadius: 20, padding: '5px 10px' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{huespedes}</span>
                </div>
                {/* Toggle */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ transform: verResumen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M3 6l5 5 5-5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Detalle desplegable */}
          {verResumen && (
            <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '12px 16px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                <span>Subtotal · {fmtM(hab.precio_noche)} × {nn} noche{nn!==1?'s':''}{huespedes > 1 ? ` × ${huespedes} pax` : ''}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{fmtM(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 10 }}>
                <span>Impuestos y tasas</span>
                <span style={{ color: '#111', fontWeight: 500 }}>$0</span>
              </div>
              <div style={{ background: '#fff8f5', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#FF6A2F' }}>Pagas ahora (30%)</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>Resto al check-in: {fmtM(resto)}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#FF6A2F' }}>{fmtM(anticipo)}</div>
              </div>
            </div>
          )}
        </div>

        {/* ══ PASO 1 ══ */}
        {paso === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 3L6 8l4 5" stroke="#333" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Agregar huésped</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Ingresa los datos del titular de la reserva</div>
              </div>
            </div>

            <Campo icon={<IconPersona />} label="Nombre completo *">
              <input type="text" value={form.nombre} onChange={set('nombre')}
                placeholder="María González"
                style={{ ...inputStyle, borderBottomColor: form.nombre ? '#FF6A2F' : '#eee' }} />
            </Campo>

            <Campo icon={<IconEmail />} label="Email *">
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="tu@email.com"
                style={{ ...inputStyle, borderBottomColor: form.email ? '#FF6A2F' : '#eee' }} />
            </Campo>

            <Campo icon={<IconTel />} label="Teléfono *">
              <input type="tel" value={form.telefono} onChange={set('telefono')}
                placeholder="+56 9 1234 5678"
                style={{ ...inputStyle, borderBottomColor: form.telefono ? '#FF6A2F' : '#eee' }} />
            </Campo>

            <Campo icon={<IconNota />} label="Notas (opcional)">
              <textarea value={form.notas} onChange={set('notas')} rows={2}
                placeholder="Hora de llegada, peticiones especiales..."
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
            </Campo>

            {/* Badges confianza */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
              {[
                { label: 'Cancelación gratis 48h', color: '#1D9E75' },
                { label: 'Pago seguro', color: '#1D9E75' },
                { label: 'Confirmación inmediata', color: '#FF6A2F' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#555', background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 20, padding: '3px 8px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>

            {error && <p style={{ color: '#E24B4A', fontSize: 12, margin: '8px 0' }}>{error}</p>}
          </>
        )}

        {/* ══ PASO 2 ══ */}
        {paso === 2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPago c="#333" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Método de pago</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Elige cómo quieres pagar el anticipo</div>
              </div>
            </div>

            {/* Resumen datos */}
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '12px 14px', marginBottom: 12 }}>
              {[
                { icon: <IconPersona c="#aaa" />, label: 'Huésped', val: form.nombre },
                { icon: <IconEmail c="#aaa" />,   label: 'Email',   val: form.email },
                { icon: <IconTel c="#aaa" />,     label: 'Teléfono', val: form.telefono },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '0.5px solid #f5f5f5' }}>
                  {icon}
                  <span style={{ fontSize: 11, color: '#aaa', minWidth: 60 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#111', flex: 1, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
              <button onClick={() => setPaso(1)}
                style={{ fontSize: 10, color: '#FF6A2F', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                ← Editar datos
              </button>
            </div>

            {/* Medios de pago */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {MEDIOS_PAGO.map(m => (
                <div key={m.id} onClick={() => setMedioPago(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: medioPago === m.id ? '1.5px solid #FF6A2F' : '0.5px solid #eee', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', boxShadow: medioPago === m.id ? '0 2px 12px rgba(255,106,47,.15)' : '0 1px 6px rgba(0,0,0,.05)', transition: 'all .15s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: medioPago === m.id ? '1.5px solid #FF6A2F' : '1.5px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {medioPago === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6A2F' }} />}
                  </div>
                  <div style={{ width: 44, height: 26, borderRadius: 7, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: m.color }}>
                      {m.id === 'flow' ? 'Flow' : m.id === 'mp' ? 'MP' : 'Stripe'}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{m.nombre}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{m.desc}</div>
                  </div>
                  {m.id === 'mp' && <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#E1F5EE', color: '#085041', fontWeight: 600 }}>LATAM</div>}
                  {m.id === 'stripe' && <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#EEF0FF', color: '#4338CA', fontWeight: 600 }}>Mundial</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10, color: '#bbb', marginBottom: 4 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M5 7V5a3 3 0 016 0v2M4 7h8a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="#bbb" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Pago 100% seguro · Datos encriptados
            </div>

            {hostal.telefono && (
              <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                style={{ display: 'block', textAlign: 'center', fontSize: 10, color: '#aaa', textDecoration: 'none', marginBottom: 4 }}>
                ¿Dudas? Escríbenos por WhatsApp
              </a>
            )}

            {error && <p style={{ color: '#E24B4A', fontSize: 12, margin: '8px 0' }}>{error}</p>}
          </>
        )}
      </div>

      {/* ── Barra inferior fija ── */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '0.5px solid #eee', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 -4px 20px rgba(0,0,0,.08)', zIndex: 100 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>{fmtFecha(entrada)} · {fmtFecha(salida)}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-.02em' }}>{fmtM(paso === 2 ? anticipo : total)}</div>
          {paso === 2 && <div style={{ fontSize: 10, color: '#FF6A2F', fontWeight: 600 }}>Anticipo 30%</div>}
        </div>
        <button
          onClick={paso === 1 ? avanzar : confirmarYPagar}
          disabled={enviando}
          style={{ background: enviando ? '#ddd' : '#FF6A2F', color: '#fff', border: 'none', borderRadius: 50, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: enviando ? 'default' : 'pointer', fontFamily: "'DM Sans',sans-serif", flexShrink: 0, boxShadow: enviando ? 'none' : '0 4px 16px rgba(255,106,47,.4)', letterSpacing: '-.01em' }}>
          {enviando ? 'Procesando...' : paso === 1 ? 'Continuar →' : `Pagar con ${medio?.nombre}`}
        </button>
      </div>

      {/* ── Carrusel de imágenes ── */}
      {carrusel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: 480, margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
          onClick={() => setCarrusel(null)}>
          {/* Botón cerrar */}
          <button onClick={() => setCarrusel(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Nombre habitación */}
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-.01em', padding: '0 56px' }}>
            {carrusel.nombre}
          </div>

          {/* Imagen principal */}
          <div style={{ width: '100%', padding: '0 16px', marginTop: 40 }} onClick={e => e.stopPropagation()}>
            <img
              src={carrusel.fotos[carrusel.idx]}
              alt=""
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 16, display: 'block' }}
            />
          </div>

          {/* Flechas navegación */}
          {carrusel.fotos.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setCarrusel(c => ({ ...c, idx: (c.idx - 1 + c.fotos.length) % c.fotos.length }))}
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L6 8l4 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 7 }}>
                {carrusel.fotos.map((_, i) => (
                  <div key={i} onClick={() => setCarrusel(c => ({ ...c, idx: i }))}
                    style={{ width: i === carrusel.idx ? 18 : 7, height: 7, borderRadius: 4, background: i === carrusel.idx ? '#FF6A2F' : 'rgba(255,255,255,.4)', transition: 'all .2s', cursor: 'pointer' }} />
                ))}
              </div>

              <button
                onClick={() => setCarrusel(c => ({ ...c, idx: (c.idx + 1) % c.fotos.length }))}
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l4 5-4 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}

          {/* Thumbnails */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }} onClick={e => e.stopPropagation()}>
            {carrusel.fotos.map((f, i) => (
              <div key={i} onClick={() => setCarrusel(c => ({ ...c, idx: i }))}
                style={{ width: 56, height: 42, borderRadius: 8, overflow: 'hidden', border: i === carrusel.idx ? '2px solid #FF6A2F' : '2px solid transparent', cursor: 'pointer', opacity: i === carrusel.idx ? 1 : 0.55, transition: 'all .2s' }}>
                <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Calendario full-screen ── */}
      {verCalendario && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
          <CalendarioReserva
            precioNoche={Math.round(hab.precio_noche * monedaActual.tasa)}
            inicioInicial={entrada}
            finInicial={salida}
            onClose={(ini, fin) => {
              if (ini && fin) {
                setEntrada(ini.toISOString().split('T')[0]);
                setSalida(fin.toISOString().split('T')[0]);
              }
              setVerCalendario(false);
            }}
          />
        </div>
      )}

    </div>
  );
}
