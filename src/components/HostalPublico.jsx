import React, { useEffect, useState, useRef } from 'react'; // useRef kept for roomsRef
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import supabase from '../lib/supabase';
import CalendarioReserva from './CalendarioReserva';


const fmt = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const noches = (e, s) => Math.round((new Date(s) - new Date(e)) / 86400000);
const hoy  = () => new Date().toISOString().split('T')[0];
const manana = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; };

const HERO_FOTO = '/montana.jpg';

const IDIOMAS = [
  { id: 'es', bandera: '🇨🇱', nombre: 'Español' },
  { id: 'en', bandera: '🇺🇸', nombre: 'English' },
  { id: 'pt', bandera: '🇧🇷', nombre: 'Português' },
  { id: 'fr', bandera: '🇫🇷', nombre: 'Français' },
  { id: 'de', bandera: '🇩🇪', nombre: 'Deutsch' },
];

const MONEDAS = [
  { id: 'CLP', simbolo: '$',   nombre: 'Peso Chileno',    bandera: '🇨🇱' },
  { id: 'USD', simbolo: 'US$', nombre: 'Dólar Americano', bandera: '🇺🇸' },
  { id: 'BRL', simbolo: 'R$',  nombre: 'Real Brasileño',  bandera: '🇧🇷' },
  { id: 'EUR', simbolo: '€',   nombre: 'Euro',            bandera: '🇩🇪' },
];

const ROOM_FOTOS   = ['/hcompartida.jpg', '/hdoble.jpg', '/Habitacion1.jpg', '/hdoble.jpg'];
const ROOM_LABELS  = ['Compartida', 'Privada', 'Premium', 'Suite'];
const DESCUENTO_NR = 0.15;


export default function HostalPublico() {
  const { slug } = useParams();
  const navigate      = useNavigate();
  const { state: navState } = useLocation();
  const roomsRef      = useRef(null);

  const [hostal, setHostal]               = useState(null);
  const [habitaciones, setHabitaciones]   = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState(null);
  const [entrada, setEntrada]             = useState(navState?.entrada || hoy());
  const [salida, setSalida]               = useState(navState?.salida || manana());
  const [disponibilidad, setDisponibilidad] = useState({});
  const [expandido, setExpandido]         = useState(null); // 'fechas' | null
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [huespedsPorHab, setHuespedsPorHab] = useState(
    navState?.hab_id ? { [navState.hab_id]: navState.huespedes || 1 } : {}
  );
  const [codigo, setCodigo]               = useState('');
  const [buscado, setBuscado]             = useState(false);
  const [politicas, setPoliticas]         = useState(false);
  const [verDetalles, setVerDetalles]     = useState(null); // id de hab expandida
  const [fechasElegidas, setFechasElegidas] = useState(!!navState?.entrada);
  const [idioma, setIdioma]               = useState('es');
  const [verIdioma, setVerIdioma]         = useState(false);
  const [busqIdioma, setBusqIdioma]       = useState('');
  const [moneda, setMoneda]               = useState('CLP');
  const [verMoneda, setVerMoneda]         = useState(false);
  const [busqMoneda, setBusqMoneda]       = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const { data: h, error: eH } = await supabase
        .from('hostales').select('*')
        .eq('tenant_id', slug).eq('activo', true).single();
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
  }, [slug]);

  useEffect(() => {
    if (!habitaciones.length || !entrada || !salida || entrada >= salida) return;
    async function verificar() {
      const checks = habitaciones.map(async (h) => {
        const { data } = await supabase.rpc('verificar_disponibilidad', {
          p_habitacion_id: h.id, p_entrada: entrada, p_salida: salida,
        });
        return { id: h.id, disponible: data };
      });
      const mapa = {};
      (await Promise.all(checks)).forEach(({ id, disponible }) => { mapa[id] = disponible; });
      setDisponibilidad(mapa);
    }
    verificar();
  }, [habitaciones, entrada, salida]);

  const buscar = () => {
    setBuscado(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  const reservar = (hab, tarifa) => {
    const precioFinal = tarifa === 'nr'
      ? Math.round(hab.precio_noche * (1 - DESCUENTO_NR))
      : hab.precio_noche;
    navigate(`/${slug}/reservar/${hab.id}`, {
      state: { hab: { ...hab, precio_noche: precioFinal, tarifa }, hostal, entrada, salida, huespedes: huespedsPorHab[hab.id] || 1, habitaciones }
    });
  };

  const nn = noches(entrada, salida);

  if (cargando) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f8f8', fontFamily:"'DM Sans',sans-serif" }}>
      <p style={{ color:'#aaa', fontSize:13 }}>Cargando...</p>
    </div>
  );
  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#E24B4A', fontSize:13 }}>{error}</p>
    </div>
  );

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent((hostal.direccion||'')+' '+(hostal.ciudad||''))}`;
  const wspUrl  = hostal.telefono ? `https://wa.me/${hostal.telefono.replace(/\D/g,'')}` : null;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:'0 auto', background:'#f8f8f8', minHeight:'100vh', paddingTop:72 }}>

      {/* ── Header fijo ── */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, zIndex:50, background:'#fff', borderBottom:'0.5px solid #eee', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span onClick={() => navigate('/')} style={{ fontSize:18, fontWeight:700, color:'#111', letterSpacing:'-.02em', cursor:'pointer' }}>{hostal.nombre}</span>

        <div style={{ display:'flex', alignItems:'center', gap:4 }}>

          {/* Globo — abre modal idioma */}
          <button onClick={() => { setVerIdioma(true); setVerMoneda(false); setBusqIdioma(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:8, display:'flex', alignItems:'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#555" strokeWidth="1.6"/>
              <path d="M12 2C9.5 6 8 9 8 12s1.5 6 4 10M12 2c2.5 4 4 7 4 10s-1.5 6-4 10M2 12h20" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>

          {/* CLP — abre modal moneda */}
          <button onClick={() => { setVerMoneda(true); setVerIdioma(false); setBusqMoneda(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', padding:8, display:'flex', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#555', letterSpacing:'.02em' }}>{moneda}</span>
          </button>

        </div>
      </div>

      {/* ── Barra compacta sticky (post-search) ── */}
      {buscado && (
        <div style={{ position:'sticky', top:48, zIndex:40, background:'#fff', borderBottom:'0.5px solid #eee', padding:'10px 16px' }}>

          {/* Pill fechas */}
          <div onClick={() => setExpandido('fechas')} style={{ display:'flex', alignItems:'center', background:'#fff', borderRadius:50, padding:'5px', gap:0, border:'1px solid #e8e8e8', boxShadow:'0 1px 4px rgba(0,0,0,.06)', cursor:'pointer' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#FF6A2F', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke="white" strokeWidth="1.3"/><path d="M4 1v2M10 1v2M1 6h12" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div style={{ flex:1, minWidth:0, padding:'0 14px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ fontSize:14, fontWeight:500, color: fechasElegidas?'#111':'#aaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textAlign:'center' }}>
                {fechasElegidas
                  ? `${new Date(entrada+'T12:00').toLocaleDateString('es-CL',{day:'numeric',month:'short'})} → ${new Date(salida+'T12:00').toLocaleDateString('es-CL',{day:'numeric',month:'short'})}`
                  : 'Check-in  →  Check-out'}
              </div>
              {fechasElegidas && nn > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#555" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize:13, fontWeight:600, color:'#555' }}>{nn}</span>
                </div>
              )}
            </div>
          </div>

          {/* Add Code centrado */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:10, marginBottom:2, cursor:'pointer' }}
            onClick={() => setMostrarCodigo(v => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#aaa" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="7" cy="7" r="1" fill="#aaa"/></svg>
            <span style={{ fontSize:12, color:'#aaa' }}>Add Code</span>
          </div>
          {mostrarCodigo && (
            <input autoFocus value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código de descuento"
              style={{ marginTop:6, width:'100%', border:'none', borderBottom:'0.5px solid #ddd', fontSize:13, color:'#111', outline:'none', fontFamily:"'DM Sans',sans-serif", background:'transparent', paddingBottom:4, boxSizing:'border-box' }}/>
          )}
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{ position:'relative', display: buscado ? 'none' : 'block' }}>
        <div style={{ height:'62svh', backgroundImage:`url(${HERO_FOTO})`, backgroundSize:'cover', backgroundPosition:'center top', backgroundRepeat:'no-repeat', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 30%, rgba(14,80,105,.25) 60%, rgba(14,80,105,.55) 80%, #fff 100%)' }}/>
        </div>

        {/* Tarjeta de búsqueda */}
        <div style={{ margin:'-28px 16px 0', position:'relative', zIndex:10 }}>
          <div style={{ background:'rgba(255,255,255,.97)', backdropFilter:'blur(12px)', borderRadius:22, padding:'18px 16px', boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>

            {/* Óvalo único: fechas + huéspedes */}
            <div style={{ background:'#fff', borderRadius:50, overflow:'hidden', marginBottom:12, border:'1.5px solid #111', boxShadow:'0 2px 12px rgba(0,0,0,.1)' }}>
              <div style={{ display:'flex', alignItems:'stretch' }}>

                {/* Fechas */}
                <div onClick={() => setExpandido(expandido === 'fechas' ? null : 'fechas')}
                  style={{ flex:1, padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  {fechasElegidas ? (
                    <>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 }}>Entrada</div>
                        <div style={{ fontSize:16, fontWeight:700, color: expandido==='fechas'?'#FF6A2F':'#111', letterSpacing:'-.01em' }}>{new Date(entrada+'T12:00').toLocaleDateString('es-CL',{day:'numeric',month:'short'})}</div>
                      </div>
                      <span style={{ color:'#ccc', fontSize:18, fontWeight:300 }}>→</span>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#aaa', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 }}>Salida</div>
                        <div style={{ fontSize:16, fontWeight:700, color: expandido==='fechas'?'#FF6A2F':'#111', letterSpacing:'-.01em' }}>{new Date(salida+'T12:00').toLocaleDateString('es-CL',{day:'numeric',month:'short'})}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                      <span style={{ fontSize:15, fontWeight:500, color:'#aaa' }}>Check-in</span>
                      <span style={{ color:'#ccc', fontSize:16 }}>→</span>
                      <span style={{ fontSize:15, fontWeight:500, color:'#aaa' }}>Check-out</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Add Code */}
            {!mostrarCodigo ? (
              <div onClick={() => setMostrarCodigo(true)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'8px 4px', cursor:'pointer', marginBottom:12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#aaa" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="7" cy="7" r="1" fill="#aaa"/></svg>
                <span style={{ fontSize:13, color:'#aaa' }}>Add Code</span>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px', marginBottom:12, borderBottom:'0.5px solid #ddd' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#555" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="7" cy="7" r="1" fill="#555"/></svg>
                <input autoFocus value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código de descuento"
                  style={{ flex:1, border:'none', background:'transparent', fontSize:13, color:'#111', outline:'none', fontFamily:"'DM Sans',sans-serif" }}/>
              </div>
            )}

            {/* Botón Buscar */}
            <button onClick={buscar}
              style={{ width:'100%', background:'#FF6A2F', border:'none', borderRadius:50, padding:'14px', fontSize:15, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:'-.01em' }}>
              Search
            </button>

          </div>
        </div>
      </div>


      {/* ── Resultados (aparecen al buscar) ── */}
      {buscado && (
        <div ref={roomsRef} style={{ padding:'16px 16px 24px' }}>

          {/* Cards habitaciones */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {habitaciones.map((hab, i) => {
              const disp    = disponibilidad[hab.id];
              const noDisp  = disp === false;
              const precioNR = Math.round(hab.precio_noche * (1 - DESCUENTO_NR));
              const esCompartido = hab.nombre?.toLowerCase().includes('camarote') || hab.nombre?.toLowerCase().includes('compartido');
              const capacidad = esCompartido ? 6 : (hab.capacidad || 2);
              const huespedesHab = huespedsPorHab[hab.id] || 1;
              const setHuespedesHab = (val) => setHuespedsPorHab(prev => ({ ...prev, [hab.id]: Math.min(Math.max(1, val), capacidad) }));
              const precioFlexPorPersona = hab.precio_noche * huespedesHab;
              const precioNRPorPersona   = Math.round(precioNR * huespedesHab);

              return (
                <div key={hab.id} style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.08)', opacity: noDisp ? .6 : 1 }}>

                  {/* Foto */}
                  <div style={{ height:210, position:'relative', overflow:'hidden' }}>
                    <img src={ROOM_FOTOS[i % ROOM_FOTOS.length]} alt={hab.nombre}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 55%)' }}/>

                    {noDisp && (
                      <div style={{ position:'absolute', top:10, left:10, background:'rgba(0,0,0,.6)', color:'#fff', fontSize:10, fontWeight:500, borderRadius:20, padding:'3px 10px' }}>Agotado</div>
                    )}

                    <div style={{ position:'absolute', bottom:10, left:12, background:'rgba(0,0,0,.4)', color:'rgba(255,255,255,.9)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', borderRadius:5, padding:'2px 8px' }}>
                      {ROOM_LABELS[i % ROOM_LABELS.length]}
                    </div>

                    <div style={{ position:'absolute', bottom:8, right:12, textAlign:'right' }}>
                      <div style={{ fontSize:22, fontWeight:600, color:'#fff', lineHeight:1, letterSpacing:'-.02em' }}>{fmt(hab.precio_noche)}</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,.65)' }}>/ noche</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding:'16px 16px 0' }}>
                    <div style={{ fontSize:16, fontWeight:600, color: noDisp?'#aaa':'#111', marginBottom:6 }}>{hab.nombre}</div>
                    {/* Ícono cama — se actualiza con el contador */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <svg width="20" height="15" viewBox="0 0 22 15" fill="none">
                        <rect x="1" y="6" width="20" height="7" rx="2" fill={noDisp?'#e8e8e8':'#f0ece6'} stroke={noDisp?'#ccc':'#888'} strokeWidth="1.3"/>
                        <rect x="3" y="8" width="7" height="3" rx="1" fill={noDisp?'#ddd':'#c8bfb0'}/>
                        <rect x="12" y="8" width="7" height="3" rx="1" fill={noDisp?'#ddd':'#c8bfb0'}/>
                        <path d="M1 6V4a2 2 0 012-2h16a2 2 0 012 2v2" stroke={noDisp?'#ccc':'#888'} strokeWidth="1.3"/>
                        <path d="M2 13v2M20 13v2" stroke={noDisp?'#ccc':'#888'} strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize:15, fontWeight:600, color: noDisp?'#ccc':'#444' }}>{huespedesHab}</span>
                      <span style={{ fontSize:13, color:'#ccc' }}>/ {capacidad}</span>
                    </div>

                    {hab.descripcion && <div style={{ fontSize:14, color:'#999', lineHeight:1.6, marginBottom:8 }}>{hab.descripcion}</div>}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <div onClick={() => setVerDetalles(verDetalles === hab.id ? null : hab.id)}
                        style={{ fontSize:14, fontWeight:600, color:'#111', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
                        {verDetalles === hab.id ? 'Ocultar detalles ↑' : 'Ver detalles ↓'}
                      </div>
                      {/* Noches */}
                      {nn > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <button onClick={() => { const d = new Date(salida+'T12:00'); d.setDate(d.getDate()-1); const nueva = d.toISOString().slice(0,10); if (nueva > entrada) setSalida(nueva); }}
                            style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #ddd', background:'#fff', fontSize:16, cursor: nn<=1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', lineHeight:1, flexShrink:0 }}>−</button>
                          <div onClick={() => setExpandido('fechas')} style={{ position:'relative', width:24, height:24, flexShrink:0, cursor:'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#888" stroke="#888" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div style={{ position:'absolute', top:-3, right:-3, width:15, height:15, borderRadius:'50%', background:'#FF6A2F', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:8, fontWeight:800, color:'#fff', lineHeight:1 }}>{nn}</span>
                            </div>
                          </div>
                          <button onClick={() => { const d = new Date(salida+'T12:00'); d.setDate(d.getDate()+1); setSalida(d.toISOString().slice(0,10)); }}
                            style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #FF6A2F', background:'#FF6A2F', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', lineHeight:1, flexShrink:0 }}>+</button>
                        </div>
                      )}
                      {/* Contador huéspedes */}
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button onClick={() => setHuespedesHab(huespedesHab - 1)} disabled={noDisp || huespedesHab <= 1}
                          style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #ddd', background:'#fff', fontSize:16, cursor: huespedesHab<=1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', lineHeight:1, flexShrink:0 }}>−</button>
                        <div style={{ position:'relative', width:24, height:24, flexShrink:0 }}>
                          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                            <path d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={noDisp?'#ccc':'#999'} strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                          <div style={{ position:'absolute', top:-3, right:-3, width:15, height:15, borderRadius:'50%', background:'#FF6A2F', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:8, fontWeight:800, color:'#fff', lineHeight:1 }}>{huespedesHab}</span>
                          </div>
                        </div>
                        <button onClick={() => setHuespedesHab(huespedesHab + 1)} disabled={noDisp || huespedesHab >= capacidad}
                          style={{ width:28, height:28, borderRadius:'50%', border:`1px solid ${huespedesHab>=capacidad?'#ddd':'#FF6A2F'}`, background: huespedesHab>=capacidad?'#f5f5f5':'#FF6A2F', fontSize:16, cursor: huespedesHab>=capacidad?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: huespedesHab>=capacidad?'#aaa':'#fff', lineHeight:1, flexShrink:0 }}>+</button>
                      </div>
                    </div>

                    {/* Panel detalles expandible */}
                    {verDetalles === hab.id && (
                      <div style={{ borderTop:'0.5px solid #f0f0f0', paddingTop:14, marginBottom:12 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:10 }}>Comodidades</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 12px' }}>
                          {[
                            'Aire acondicionado','Baño compartido','Ventilador de techo',
                            'Casilleros','Wifi incluido','Ropa de cama',
                            'Agua caliente','Desayuno disponible',
                          ].map((item, idx) => (
                            <div key={idx} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'#555' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#FF6A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarifas */}
                  <div style={{ margin:'12px 16px 16px', border:'0.5px solid #f0f0f0', borderRadius:14, overflow:'hidden' }}>

                    <div style={{ display:'flex', alignItems:'center', padding:'12px 14px', borderBottom:'0.5px solid #f7f7f7', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color: noDisp?'#aaa':'#111' }}>Flexible</div>
                        <div style={{ fontSize:12, color:'#aaa' }}>Cancelación gratis 48h antes</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:600, color: noDisp?'#aaa':'#111' }}>{fmt(nn>0 ? precioFlexPorPersona * nn : precioFlexPorPersona)}</div>
                        {nn>0 && !noDisp && <div style={{ fontSize:12, color:'#888' }}>{fmt(hab.precio_noche)} × {nn} noche{nn!==1?'s':''}</div>}
                      </div>
                      <button onClick={() => !noDisp && nn>0 && reservar(hab,'flexible')}
                        disabled={noDisp || nn<=0}
                        style={{ background: noDisp||nn<=0?'#eee':'#FF6A2F', color: noDisp||nn<=0?'#aaa':'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor: noDisp||nn<=0?'default':'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                        {nn<=0?'Fechas':'Reservar'}
                      </button>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', padding:'12px 14px', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color: noDisp?'#aaa':'#111' }}>No reembolsable</div>
                        <div style={{ fontSize:12, color:'#aaa' }}>Sin cancelación · mejor precio</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:12, color:'#bbb', textDecoration:'line-through' }}>{fmt(nn>0 ? precioFlexPorPersona * nn : precioFlexPorPersona)}</div>
                        <div style={{ fontSize:16, fontWeight:600, color: noDisp?'#aaa':'#1D9E75' }}>{fmt(nn>0 ? precioNRPorPersona * nn : precioNRPorPersona)}</div>
                        {nn>0 && !noDisp && <div style={{ fontSize:12, color:'#888' }}>{fmt(precioNR)} × {nn} noche{nn!==1?'s':''}</div>}
                      </div>
                      <button onClick={() => !noDisp && nn>0 && reservar(hab,'nr')}
                        disabled={noDisp || nn<=0}
                        style={{ background: noDisp||nn<=0?'#eee':'#111', color: noDisp||nn<=0?'#aaa':'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor: noDisp||nn<=0?'default':'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                        {nn<=0?'Fechas':'Reservar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Políticas */}
          <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', marginTop:14, boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
              onClick={() => setPoliticas(!politicas)}>
              <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>Políticas de cancelación</span>
              <span style={{ fontSize:11, color:'#aaa', transition:'transform .2s', display:'inline-block', transform: politicas?'rotate(180deg)':'none' }}>▾</span>
            </div>
            {politicas && (
              <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:7 }}>
                {[
                  'Cancelación gratis hasta 48 horas antes del check-in.',
                  'Tarifa no reembolsable: sin devolución en ningún caso.',
                  'Check-in: 14:00 hrs · Check-out: 11:00 hrs',
                  'Solo pagas el 30% al reservar. El resto al llegar.',
                  'No shows serán cobrados en su totalidad.',
                ].map((p,i) => (
                  <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:'#777', lineHeight:1.5 }}>
                    <div style={{ width:4, height:4, borderRadius:'50%', background:'#FF6A2F', flexShrink:0, marginTop:6 }}/>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sobre el hostal */}
          {hostal.descripcion && (
            <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', marginTop:10, boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#111', marginBottom:6 }}>Sobre el hostal</div>
              <div style={{ fontSize:12, color:'#888', lineHeight:1.7 }}>{hostal.descripcion}</div>
            </div>
          )}

          {/* Ubicación */}
          <div style={{ marginTop:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>Ubicación</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="2.5" stroke="#111" strokeWidth="1.5"/>
              </svg>
            </div>
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'block' }}>
              <div style={{ height:110, background:'linear-gradient(135deg,#d4e8d0,#b8d4b0)', borderRadius:14, border:'0.5px solid #c8d8c4', position:'relative', overflow:'hidden', marginBottom:10, cursor:'pointer' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 1px,transparent 22px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 1px,transparent 22px)' }}/>
                <div style={{ position:'absolute', top:'38%', left:'40%', width:14, height:14, background:'#FF6A2F', borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)', border:'2px solid #fff' }}/>
                <div style={{ position:'absolute', top:'22%', left:'56%', background:'#fff', borderRadius:6, padding:'3px 8px', fontSize:9, fontWeight:600, color:'#111', boxShadow:'0 1px 4px rgba(0,0,0,.12)' }}>
                  {hostal.nombre}
                </div>
                <div style={{ position:'absolute', bottom:8, right:10, background:'rgba(255,255,255,.92)', borderRadius:6, padding:'3px 9px', fontSize:9, fontWeight:600, color:'#111', display:'flex', alignItems:'center', gap:4 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#111" strokeWidth="2.5"/><circle cx="12" cy="9" r="2.5" stroke="#111" strokeWidth="2.5"/></svg>
                  Ver en Maps
                </div>
              </div>
            </a>

            {wspUrl && (
              <a href={wspUrl} target="_blank" rel="noreferrer"
                style={{ display:'flex', background:'#25D366', borderRadius:12, padding:'12px', textAlign:'center', fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', alignItems:'center', justifyContent:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 2.5A6.5 6.5 0 002.2 11.1L1 15l4-.9A6.5 6.5 0 0013.5 2.5z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                WhatsApp
              </a>
            )}
          </div>

          <div style={{ textAlign:'center', fontSize:10, color:'#ccc', padding:'20px 0 8px', letterSpacing:'.06em' }}>
            Reservas · ReservasSaaS
          </div>
        </div>
      )}

      {/* ── Modal idioma ── */}
      {verIdioma && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'flex-end' }}
          onClick={() => setVerIdioma(false)}>
          <div style={{ background:'#fff', width:'100%', maxWidth:480, margin:'0 auto', borderRadius:'20px 20px 0 0', padding:'20px 0 32px', maxHeight:'80vh', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Título */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px 16px', borderBottom:'0.5px solid #f0f0f0' }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#111' }}>Select Language</span>
              <button onClick={() => setVerIdioma(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#888', padding:4 }}>×</button>
            </div>
            {/* Buscador */}
            <div style={{ padding:'12px 20px' }}>
              <input autoFocus value={busqIdioma} onChange={e => setBusqIdioma(e.target.value)}
                placeholder="Search"
                style={{ width:'100%', border:'1px solid #e8e8e8', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#111', outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box' }}/>
            </div>
            {/* Lista */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {IDIOMAS.filter(l => l.nombre.toLowerCase().includes(busqIdioma.toLowerCase())).map(l => (
                <div key={l.id} onClick={() => { setIdioma(l.id); setVerIdioma(false); }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', cursor:'pointer', background: idioma === l.id ? '#f9f9f9' : '#fff', borderBottom:'0.5px solid #f5f5f5' }}>
                  <span style={{ fontSize:14, color:'#111' }}>{l.nombre}</span>
                  {idioma === l.id && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal moneda ── */}
      {verMoneda && (
        <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'flex-end' }}
          onClick={() => setVerMoneda(false)}>
          <div style={{ background:'#fff', width:'100%', maxWidth:480, margin:'0 auto', borderRadius:'20px 20px 0 0', padding:'20px 0 32px', maxHeight:'80vh', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Título */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px 16px', borderBottom:'0.5px solid #f0f0f0' }}>
              <span style={{ fontSize:16, fontWeight:700, color:'#111' }}>Select Currency</span>
              <button onClick={() => setVerMoneda(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#888', padding:4 }}>×</button>
            </div>
            {/* Buscador */}
            <div style={{ padding:'12px 20px' }}>
              <input autoFocus value={busqMoneda} onChange={e => setBusqMoneda(e.target.value)}
                placeholder="Search"
                style={{ width:'100%', border:'1px solid #e8e8e8', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#111', outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box' }}/>
            </div>
            {/* Lista */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {MONEDAS.filter(m => `${m.id} ${m.nombre}`.toLowerCase().includes(busqMoneda.toLowerCase())).map(m => (
                <div key={m.id} onClick={() => { setMoneda(m.id); setVerMoneda(false); }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', cursor:'pointer', background: moneda === m.id ? '#f9f9f9' : '#fff', borderBottom:'0.5px solid #f5f5f5' }}>
                  <span style={{ fontSize:14, color:'#111' }}>{m.id} {m.nombre}</span>
                  {moneda === m.id && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Calendario full-screen ── */}
      {expandido === 'fechas' && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'#fff', overflowY:'auto', display:'flex', flexDirection:'column', maxWidth:480, margin:'0 auto', left:'50%', transform:'translateX(-50%)', width:'100%' }}>
          <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,106,47,.5)}50%{box-shadow:0 0 0 6px rgba(255,106,47,0)}}`}</style>
          <CalendarioReserva
            precioNoche={habitaciones[0]?.precio_noche || 12000}
            inicioInicial={entrada}
            finInicial={salida}
            onClose={(ini, fin) => {
              if (ini && fin) {
                setEntrada(ini.toISOString().split('T')[0]);
                setSalida(fin.toISOString().split('T')[0]);
                setFechasElegidas(true);
                setExpandido(null);
              } else {
                setExpandido(null);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
