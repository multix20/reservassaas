import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

const fmt = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const fmtFecha = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

const hoy = () => new Date().toISOString().split('T')[0];

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  pagado:     { label: 'Confirmada', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  cancelado:  { label: 'Cancelada',  bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  completado: { label: 'Completada', bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
};

const IconCama = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M2 20V14a2 2 0 012-2h16a2 2 0 012 2v6M2 14V8a2 2 0 012-2h16a2 2 0 012 2v6M6 12V9h12v3" stroke="#888" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconCal = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="#888" strokeWidth="1.6"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="#888" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconDinero = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="13" rx="3" stroke="#888" strokeWidth="1.6"/>
    <path d="M2 10h20" stroke="#888" strokeWidth="1.6"/>
    <rect x="5" y="13" width="4" height="2" rx="1" fill="#888"/>
  </svg>
);
const IconPersona = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="#888" strokeWidth="1.6"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#888" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

function TarjetaReserva({ r, onCambioEstado }) {
  const cfg = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.pendiente;
  const [cambiando, setCambiando] = useState(false);

  const cambiarEstado = async (nuevoEstado) => {
    setCambiando(true);
    await supabase.from('reservas_hostal').update({ estado: nuevoEstado }).eq('id', r.id);
    onCambioEstado();
    setCambiando(false);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${cfg.border}`, padding: '14px 16px', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Fila superior */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <p style={{ fontWeight: 600, color: '#111', fontSize: 14, margin: 0 }}>{r.huesped_nombre}</p>
          <p style={{ fontSize: 11, color: '#999', margin: '2px 0 0' }}>{r.huesped_email} · {r.huesped_telefono}</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap', letterSpacing: '.03em' }}>
          {cfg.label}
        </span>
      </div>

      {/* Detalles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
          <IconCama /> {r.habitaciones?.nombre}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
          <IconCal /> {fmtFecha(r.fecha_entrada)} → {fmtFecha(r.fecha_salida)} · {r.noches} noche{r.noches !== 1 ? 's' : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
          <IconPersona /> {r.num_huespedes || 1} huésped{(r.num_huespedes || 1) !== 1 ? 'es' : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
          <IconDinero /> {fmt(r.total)}
        </span>
      </div>

      {r.notas && (
        <p style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic', margin: '0 0 10px' }}>"{r.notas}"</p>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {r.estado === 'pendiente' && (
          <button onClick={() => cambiarEstado('pagado')} disabled={cambiando}
            style={{ fontSize: 11, fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: cambiando ? .5 : 1 }}>
            Confirmar reserva
          </button>
        )}
        {r.estado === 'pagado' && (
          <button onClick={() => cambiarEstado('completado')} disabled={cambiando}
            style={{ fontSize: 11, fontWeight: 600, background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: cambiando ? .5 : 1 }}>
            Marcar completada
          </button>
        )}
        {(r.estado === 'pendiente' || r.estado === 'pagado') && (
          <button onClick={() => cambiarEstado('cancelado')} disabled={cambiando}
            style={{ fontSize: 11, fontWeight: 600, background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: cambiando ? .5 : 1 }}>
            Cancelar
          </button>
        )}
        {r.huesped_telefono && (
          <a href={`https://wa.me/${r.huesped_telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, fontWeight: 600, color: '#555', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', background: '#fff' }}>
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { slug: tenant_id } = useParams();
  const navigate = useNavigate();

  const [hostal, setHostal]           = useState(null);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [proximas, setProximas]       = useState([]);
  const [historial, setHistorial]     = useState([]);
  const [ingresos, setIngresos]       = useState({ mes: 0, pendiente: 0 });
  const [cargando, setCargando]       = useState(true);
  const [tab, setTab]                 = useState('hoy');

  const cargar = async () => {
    setCargando(true);
    const today = hoy();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { navigate('/admin/login'); return; }

    const { data: h } = await supabase
      .from('hostales').select('*').eq('tenant_id', tenant_id).single();
    if (!h) { navigate('/admin/login'); return; }
    setHostal(h);

    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    const en30   = new Date(); en30.setDate(en30.getDate() + 30);
    const hace90 = new Date(); hace90.setDate(hace90.getDate() - 90);

    const [rHoy, rProx, rHist, rMes] = await Promise.all([
      supabase.from('reservas_hostal').select('*, habitaciones(nombre)')
        .eq('hostal_id', h.id)
        .or(`fecha_entrada.eq.${today},fecha_salida.eq.${today}`)
        .neq('estado', 'cancelado').order('fecha_entrada'),

      supabase.from('reservas_hostal').select('*, habitaciones(nombre)')
        .eq('hostal_id', h.id)
        .gte('fecha_entrada', manana.toISOString().split('T')[0])
        .lte('fecha_entrada', en30.toISOString().split('T')[0])
        .neq('estado', 'cancelado').order('fecha_entrada'),

      supabase.from('reservas_hostal').select('*, habitaciones(nombre)')
        .eq('hostal_id', h.id)
        .lt('fecha_salida', today)
        .gte('fecha_entrada', hace90.toISOString().split('T')[0])
        .order('fecha_entrada', { ascending: false }),

      supabase.from('reservas_hostal').select('total, estado')
        .eq('hostal_id', h.id)
        .gte('fecha_entrada', new Date(new Date().setDate(1)).toISOString().split('T')[0])
        .neq('estado', 'cancelado'),
    ]);

    setReservasHoy(rHoy.data || []);
    setProximas(rProx.data || []);
    setHistorial(rHist.data || []);

    const mes  = (rMes.data || []).filter(r => r.estado === 'pagado' || r.estado === 'completado').reduce((s, r) => s + Number(r.total), 0);
    const pend = (rMes.data || []).filter(r => r.estado === 'pendiente').reduce((s, r) => s + Number(r.total), 0);
    setIngresos({ mes, pendiente: pend });

    setCargando(false);
  };

  useEffect(() => { cargar(); }, [tenant_id]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (cargando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #eee', borderTopColor: '#FF6A2F', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const mesActual = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const today = hoy();

  const TABS = [
    { id: 'hoy',      label: `Hoy (${reservasHoy.length})` },
    { id: 'proximas', label: `Próximas (${proximas.length})` },
    { id: 'historial', label: `Historial (${historial.length})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#FF6A2F', padding: '16px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0, letterSpacing: '-.01em' }}>{hostal?.nombre}</h1>
            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, margin: '2px 0 0' }}>{hostal?.ciudad} · Panel de administración</p>
          </div>
          <button onClick={cerrarSesion}
            style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, border: '1px solid rgba(255,255,255,.35)', borderRadius: 10, padding: '6px 14px', background: 'rgba(255,255,255,.1)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: `Ingresos ${mesActual}`, valor: fmt(ingresos.mes), color: '#16a34a' },
            { label: 'Por confirmar',          valor: fmt(ingresos.pendiente), color: '#d97706' },
            { label: 'Check-ins hoy',          valor: reservasHoy.filter(r => r.fecha_entrada === today).length, color: '#111' },
          ].map(({ label, valor, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '12px 10px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
              <p style={{ fontSize: 10, color: '#aaa', margin: '0 0 6px', lineHeight: 1.3 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0, letterSpacing: '-.02em' }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#efefef', borderRadius: 14, padding: 4, marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, fontSize: 12, fontWeight: 600, borderRadius: 10, padding: '8px 4px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#111' : '#888',
                boxShadow: tab === t.id ? '0 1px 6px rgba(0,0,0,.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido tab Hoy */}
        {tab === 'hoy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reservasHoy.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '40px 16px', textAlign: 'center' }}>
                <p style={{ color: '#ccc', fontSize: 13 }}>Sin check-ins ni check-outs hoy</p>
              </div>
            ) : (
              <>
                {reservasHoy.filter(r => r.fecha_entrada === today).length > 0 && (
                  <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, margin: '4px 0 0' }}>Check-in hoy</p>
                )}
                {reservasHoy.filter(r => r.fecha_entrada === today).map(r => (
                  <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
                ))}
                {reservasHoy.filter(r => r.fecha_salida === today).length > 0 && (
                  <p style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, margin: '8px 0 0' }}>Check-out hoy</p>
                )}
                {reservasHoy.filter(r => r.fecha_salida === today).map(r => (
                  <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Contenido tab Próximas */}
        {tab === 'proximas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proximas.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '40px 16px', textAlign: 'center' }}>
                <p style={{ color: '#ccc', fontSize: 13 }}>Sin reservas en los próximos 30 días</p>
              </div>
            ) : proximas.map(r => (
              <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
            ))}
          </div>
        )}

        {/* Contenido tab Historial */}
        {tab === 'historial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historial.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: '40px 16px', textAlign: 'center' }}>
                <p style={{ color: '#ccc', fontSize: 13 }}>Sin reservas pasadas en los últimos 90 días</p>
              </div>
            ) : historial.map(r => (
              <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
            ))}
          </div>
        )}

        {/* Link público */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <a href={`/${tenant_id}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 13, color: '#FF6A2F', fontWeight: 600, textDecoration: 'none' }}>
            Ver página pública del hostal →
          </a>
        </div>

      </div>
    </div>
  );
}
