import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

const formatPrecio = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const noches = (entrada, salida) => {
  if (!entrada || !salida) return 0;
  return Math.round((new Date(salida) - new Date(entrada)) / 86400000);
};

const hoy = () => new Date().toISOString().split('T')[0];
const manana = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

// Fotos del hero — Patagonia chilena (Unsplash, uso libre)
const HERO_FOTOS = [
  { url: '/capillas.jpg',  label: 'Capillas de Mármol' },
  { url: '/castillo.jpg',  label: 'Cerro Castillo' },
  { url: '/tortel.jpg',    label: 'Tortel' },
  { url: '/VillaO.jpg',    label: "Villa O'Higgins" },
  { url: '/jinete.jpeg',   label: 'Patagonia chilena' },
  { url: '/iglu.jpg',      label: 'Refugio de montaña' },
  { url: '/hostal.jpg',    label: 'Hostal Patagonia' },
];

const ROOM_FOTOS = [
  '/hcompartida.jpg',
  '/hdoble.jpg',
  '/Habitacion1.jpg',
  '/hdoble.jpg',
];

const ROOM_LABELS = ['Compartida', 'Privada', 'Premium', 'Suite'];

export default function HostalPublico() {
  const { tenant_id } = useParams();
  const navigate = useNavigate();

  const [hostal, setHostal]               = useState(null);
  const [habitaciones, setHabitaciones]   = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState(null);
  const [entrada, setEntrada]             = useState(hoy());
  const [salida, setSalida]               = useState(manana());
  const [disponibilidad, setDisponibilidad] = useState({});
  const [heroIdx, setHeroIdx]             = useState(0);
  const heroTimer = useRef(null);

  // Carrusel automático cada 4 segundos
  useEffect(() => {
    heroTimer.current = setInterval(() => {
      setHeroIdx(i => (i + 1) % HERO_FOTOS.length);
    }, 4000);
    return () => clearInterval(heroTimer.current);
  }, []);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data: h, error: eH } = await supabase
        .from('hostales').select('*')
        .eq('tenant_id', tenant_id).eq('activo', true).single();
      if (eH || !h) { setError('Hostal no encontrado'); setCargando(false); return; }
      setHostal(h);
      const { data: habs } = await supabase
        .from('habitaciones').select('*')
        .eq('hostal_id', h.id).eq('activa', true)
        .order('precio_noche', { ascending: true });
      setHabitaciones(habs || []);
      setCargando(false);
    }
    cargar();
  }, [tenant_id]);

  useEffect(() => {
    if (!habitaciones.length || !entrada || !salida || entrada >= salida) return;
    async function verificar() {
      const checks = habitaciones.map(async (h) => {
        const { data } = await supabase.rpc('verificar_disponibilidad', {
          p_habitacion_id: h.id, p_entrada: entrada, p_salida: salida,
        });
        return { id: h.id, disponible: data };
      });
      const resultados = await Promise.all(checks);
      const mapa = {};
      resultados.forEach(({ id, disponible }) => { mapa[id] = disponible; });
      setDisponibilidad(mapa);
    }
    verificar();
  }, [habitaciones, entrada, salida]);

  const reservar = (hab) => {
    navigate(`/${tenant_id}/reservar/${hab.id}`, { state: { hab, hostal, entrada, salida } });
  };

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f6' }}>
      <p style={{ color: '#aaa', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cargando...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#E24B4A', fontSize: 13 }}>{error}</p>
    </div>
  );

  const nn = noches(entrada, salida);
  const foto = HERO_FOTOS[heroIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f6', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' }}>

      {/* ── Hero con carrusel ── */}
      <div style={{ height: 280, position: 'relative', overflow: 'hidden' }}>

        {/* Imagen de fondo con transición */}
        {HERO_FOTOS.map((f, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${f.url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === heroIdx ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }} />
        ))}

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,20,12,.78) 0%,rgba(10,20,12,.15) 55%,transparent 100%)' }} />

        {/* Silueta montañas */}
        <svg viewBox="0 0 480 55" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 55, zIndex: 1 }}>
          <path d="M0 55 L0 38 L60 14 L110 32 L170 7 L230 28 L290 4 L350 22 L400 11 L480 18 L480 55Z" fill="rgba(255,255,255,.05)" />
        </svg>

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,.3)', borderRadius: 20, padding: '4px 10px', fontSize: 10, color: '#fff', letterSpacing: '.04em', backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9FE1CB' }} />
            {foto.label}
          </div>
          {hostal.telefono && (
            <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 2.5A6.5 6.5 0 002.2 11.1L1 15l4-.9A6.5 6.5 0 0013.5 2.5z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            </a>
          )}
        </div>

        {/* Indicadores del carrusel */}
        <div style={{ position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
          {HERO_FOTOS.map((_, i) => (
            <div key={i} onClick={() => setHeroIdx(i)} style={{
              width: i === heroIdx ? 18 : 5, height: 5, borderRadius: 3,
              background: i === heroIdx ? '#fff' : 'rgba(255,255,255,.4)',
              transition: 'all .3s', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Contenido hero */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px', zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 5 }}>
            {hostal.ciudad} · Aysén
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 300, color: '#fff', lineHeight: 1.1, letterSpacing: '-.01em', marginBottom: 6 }}>
            {(() => {
              const partes = hostal.nombre.split(' ');
              if (partes.length > 1) return <>{partes[0]} <em style={{ fontStyle: 'italic', color: '#9FE1CB' }}>{partes.slice(1).join(' ')}</em></>;
              return <em style={{ fontStyle: 'italic', color: '#9FE1CB' }}>{hostal.nombre}</em>;
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.85)' }}><span style={{ color: '#febb02' }}>★</span> 4.9 · 48 reseñas</span>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>{hostal.direccion}</span>
          </div>
        </div>
      </div>

      {/* ── Selector de fechas ── */}
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '0.5px solid #ece9e2', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, border: '1.5px solid #1a2e1e', borderRadius: 10, padding: '7px 11px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginBottom: 1 }}>Entrada</div>
          <input type="date" value={entrada} min={hoy()} onChange={e => setEntrada(e.target.value)}
            style={{ fontSize: 12, fontWeight: 500, color: '#1a1a18', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }} />
        </div>
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 10, padding: '7px 11px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginBottom: 1 }}>Salida</div>
          <input type="date" value={salida} min={entrada} onChange={e => setSalida(e.target.value)}
            style={{ fontSize: 12, fontWeight: 500, color: '#1a1a18', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }} />
        </div>
        {nn > 0 && (
          <div style={{ background: '#E1F5EE', color: '#085041', fontSize: 10, fontWeight: 500, borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {nn} noche{nn !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '14px 16px' }}>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, border: '0.5px solid #ece9e2', padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 300, color: '#1a1a18', lineHeight: 1 }}>4.9</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#E8593C', fontSize: 12, letterSpacing: 2, marginBottom: 2 }}>★★★★★</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>48 reseñas verificadas</div>
          </div>
          <div style={{ fontSize: 10, background: '#FFF3E0', color: '#E8593C', borderRadius: 6, padding: '3px 9px', fontWeight: 500 }}>Superhost</div>
        </div>

        {/* Título */}
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: '#1a1a18', marginBottom: 12 }}>
          Habitaciones disponibles
        </div>

        {/* Cards habitaciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {habitaciones.map((hab, i) => {
            const disp = disponibilidad[hab.id];
            const noDisp = disp === false;
            const total = nn > 0 ? hab.precio_noche * nn : null;

            return (
              <div key={hab.id} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #ece9e2', overflow: 'hidden', opacity: noDisp ? .65 : 1 }}>

                {/* Foto de la habitación */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={ROOM_FOTOS[i % ROOM_FOTOS.length]}
                    alt={hab.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  {/* overlay sutil */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 50%)' }} />
                  {/* badge tipo */}
                  <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(0,0,0,.45)', color: 'rgba(255,255,255,.92)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 5, padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
                    {ROOM_LABELS[i % ROOM_LABELS.length]}
                  </div>
                  {/* indicador disponibilidad */}
                  {!noDisp
                    ? <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#9FE1CB', boxShadow: '0 0 0 2px rgba(255,255,255,.6)' }} />
                    : <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,.45)', color: 'rgba(255,255,255,.8)', fontSize: 9, borderRadius: 5, padding: '3px 8px' }}>No disponible</div>
                  }
                  {/* precio sobre imagen */}
                  <div style={{ position: 'absolute', bottom: 10, right: 12 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: '#fff', lineHeight: 1, textAlign: 'right' }}>{formatPrecio(hab.precio_noche)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', textAlign: 'right' }}>/ noche</div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '11px 13px 13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a18', flex: 1 }}>{hab.nombre}</div>
                    {total && <div style={{ fontSize: 11, color: '#0F6E56', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>Total {formatPrecio(total)}</div>}
                  </div>
                  {hab.descripcion && (
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5, marginBottom: 10 }}>{hab.descripcion}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ fontSize: 10, background: '#f5f3ef', color: '#777', borderRadius: 6, padding: '3px 7px' }}>
                        {hab.capacidad} {hab.capacidad === 1 ? 'persona' : 'personas'}
                      </span>
                      <span style={{ fontSize: 10, background: '#f5f3ef', color: '#777', borderRadius: 6, padding: '3px 7px' }}>WiFi</span>
                    </div>
                    <button onClick={() => !noDisp && nn > 0 && reservar(hab)}
                      disabled={noDisp || nn <= 0}
                      style={{ fontSize: 12, fontWeight: 500, background: noDisp || nn <= 0 ? '#e8e5de' : '#1a2e1e', color: noDisp || nn <= 0 ? '#aaa' : '#fff', borderRadius: 10, padding: '7px 16px', border: 'none', cursor: noDisp || nn <= 0 ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'background .15s' }}>
                      {noDisp ? 'No disponible' : nn <= 0 ? 'Elige fechas' : 'Reservar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Descripción */}
        {hostal.descripcion && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #ece9e2', padding: '13px 14px', marginTop: 14 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, color: '#1a1a18', marginBottom: 5 }}>Sobre el hostal</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7 }}>{hostal.descripcion}</div>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div style={{ background: '#fff', borderTop: '0.5px solid #ece9e2', padding: '12px 16px', display: 'flex', gap: 8, marginTop: 8 }}>
        {hostal.telefono && (
          <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 11, padding: 11, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#444', textDecoration: 'none', display: 'block' }}>
            WhatsApp
          </a>
        )}
        <a href={`https://maps.google.com/?q=${encodeURIComponent((hostal.direccion||'')+' '+(hostal.ciudad||''))}`}
          target="_blank" rel="noreferrer"
          style={{ flex: 1, background: '#1a2e1e', borderRadius: 11, padding: 11, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#fff', textDecoration: 'none', display: 'block' }}>
          Ver en el mapa
        </a>
      </div>

      <div style={{ textAlign: 'center', fontSize: 9, color: '#ccc', padding: 10, letterSpacing: '.06em' }}>
        Reservas · ReservasSaaS
      </div>
    </div>
  );
}