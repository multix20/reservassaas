import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import supabase from '../lib/supabase';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = ['pendiente', 'pagado', 'cancelado', 'completado'];
const ESTADO_COLOR = {
  pendiente:  { bg: 'rgba(234,179,8,0.15)',   text: '#ca8a04' },
  pagado:     { bg: 'rgba(34,197,94,0.15)',   text: '#16a34a' },
  cancelado:  { bg: 'rgba(239,68,68,0.15)',   text: '#dc2626' },
  completado: { bg: 'rgba(148,163,184,0.15)', text: '#64748b' },
};
const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;
const fmtFecha = (d) => new Date(d + 'T12:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
const hoy = () => new Date().toISOString().split('T')[0];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { slug: tenant_id } = useParams();
  const navigate = useNavigate();

  const [hostal, setHostal]             = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [reservas, setReservas]         = useState([]);
  const [bloqueos, setBloqueos]         = useState([]);
  const [metricas, setMetricas]         = useState({ ingresos: 0, porConfirmar: 0, checkinsHoy: 0 });
  const [ocupacionMes, setOcupacionMes] = useState([]);
  const [tab, setTab]                   = useState('hoy');
  const [loading, setLoading]           = useState(true);
  const [modalReserva, setModalReserva] = useState(false);
  const [modalBloqueo, setModalBloqueo] = useState(false);
  const chartRef      = useRef(null);
  const chartInstance = useRef(null);

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: h } = await supabase
        .from('hostales').select('*').eq('tenant_id', tenant_id).single();
      if (!h) { navigate('/login'); return; }
      setHostal(h);

      await Promise.all([
        cargarReservas(h.id),
        cargarHabitaciones(h.id),
        cargarBloqueos(h.id),
        cargarOcupacion(h.id),
      ]);
      setLoading(false);
    };
    init();
  }, [tenant_id]);

  // ─── Gráfico Chart.js ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current || ocupacionMes.length === 0) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    script.onload = () => {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ocupacionMes.map(d => d.semana),
          datasets: [{
            label: 'Reservas',
            data: ocupacionMes.map(d => d.cantidad),
            backgroundColor: 'rgba(255,106,47,0.6)',
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
          },
        },
      });
    };
    document.body.appendChild(script);
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [ocupacionMes]);

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const cargarReservas = async (hostalId) => {
    const { data } = await supabase
      .from('reservas_hostal')
      .select('*, habitaciones(nombre)')
      .eq('hostal_id', hostalId)
      .order('fecha_entrada', { ascending: true });
    if (!data) return;
    setReservas(data);

    const today = hoy();
    const ingresos     = data.filter(r => r.estado === 'pagado' || r.estado === 'completado').reduce((s, r) => s + (r.total || 0), 0);
    const porConfirmar = data.filter(r => r.estado === 'pendiente').reduce((s, r) => s + (r.total || 0), 0);
    const checkinsHoy  = data.filter(r => r.fecha_entrada === today).length;
    setMetricas({ ingresos, porConfirmar, checkinsHoy });
  };

  const cargarHabitaciones = async (hostalId) => {
    const { data } = await supabase.from('habitaciones').select('*').eq('hostal_id', hostalId);
    setHabitaciones(data || []);
  };

  const cargarBloqueos = async (hostalId) => {
    const { data, error } = await supabase
      .from('bloqueos')
      .select('*, habitaciones(nombre)')
      .eq('hostal_id', hostalId)
      .gte('fecha_fin', hoy());
    if (!error) setBloqueos(data || []);
  };

  const cargarOcupacion = async (hostalId) => {
    const semanas = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (5 - i) * 7);
      return d.toISOString().split('T')[0];
    });
    const { data } = await supabase
      .from('reservas_hostal')
      .select('fecha_entrada')
      .eq('hostal_id', hostalId)
      .gte('fecha_entrada', semanas[0]);

    const buckets = semanas.map((inicio, i) => {
      const fin      = semanas[i + 1] || hoy();
      const cantidad = (data || []).filter(r => r.fecha_entrada >= inicio && r.fecha_entrada < fin).length;
      const label    = new Date(inicio + 'T12:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      return { semana: label, cantidad };
    });
    setOcupacionMes(buckets);
  };

  // ─── Cambiar estado reserva ──────────────────────────────────────────────────
  const cambiarEstado = async (id, nuevoEstado) => {
    await supabase.from('reservas_hostal').update({ estado: nuevoEstado }).eq('id', id);
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
  };

  // ─── Filtrar reservas según tab ──────────────────────────────────────────────
  const today = hoy();
  const reservasFiltradas = reservas.filter(r => {
    if (tab === 'hoy')      return r.fecha_entrada === today || r.fecha_salida === today;
    if (tab === 'proximas') return r.fecha_entrada > today && r.estado !== 'cancelado';
    return true;
  });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1a10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #4a7c59', borderTopColor: '#FF6A2F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f1a10', color: '#e8ede9', fontFamily: "'DM Sans', sans-serif", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>{hostal?.nombre}</div>
          <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{hostal?.ciudad} · Panel de administración</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to={`/${tenant_id}`} style={{ fontSize: 12, color: '#FF6A2F', textDecoration: 'none', fontWeight: 500 }}>Ver página →</Link>
          <button onClick={logout} style={btnGhost}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: `Ingresos ${new Date().toLocaleString('es-CL', { month: 'long' })}`, value: fmt(metricas.ingresos), color: '#e8ede9' },
            { label: 'Por confirmar', value: fmt(metricas.porConfirmar), color: '#ca8a04' },
            { label: 'Check-ins hoy', value: metricas.checkinsHoy, color: '#FF6A2F' },
          ].map((m, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6, lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Gráfico ocupación */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Reservas últimas 6 semanas</div>
          <div style={{ position: 'relative', height: 140 }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Tabs + Reservas */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['hoy', 'Hoy'], ['proximas', 'Próximas'], ['todas', 'Todas']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                ...tabBtn,
                background: tab === id ? 'rgba(255,106,47,0.15)' : 'transparent',
                color: tab === id ? '#FF6A2F' : '#6b7280',
                borderColor: tab === id ? 'rgba(255,106,47,0.4)' : 'rgba(255,255,255,0.08)',
              }}>
                {label}{tab === id ? ` (${reservasFiltradas.length})` : ''}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={() => setModalReserva(true)} style={btnPrimary}>+ Reserva manual</button>
          </div>

          {reservasFiltradas.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#6b7280', padding: '32px 16px', fontSize: 13 }}>
              Sin reservas en esta vista
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reservasFiltradas.map(r => (
                <div key={r.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.huesped_nombre}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {r.habitaciones?.nombre} · {fmtFecha(r.fecha_entrada)} → {fmtFecha(r.fecha_salida)}
                        {r.num_huespedes ? ` · ${r.num_huespedes} huésped${r.num_huespedes > 1 ? 'es' : ''}` : ''}
                      </div>
                      {r.huesped_email && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{r.huesped_email}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e8ede9', flexShrink: 0, marginLeft: 10 }}>{fmt(r.total)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ ...badge, background: ESTADO_COLOR[r.estado]?.bg, color: ESTADO_COLOR[r.estado]?.text }}>
                      {r.estado}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {r.huesped_telefono && (
                        <a href={`https://wa.me/${r.huesped_telefono.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: '#6b7280', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', textDecoration: 'none' }}>
                          WhatsApp
                        </a>
                      )}
                      <select value={r.estado} onChange={e => cambiarEstado(r.id, e.target.value)} style={selectStyle}>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  {r.notas && <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', margin: '8px 0 0' }}>"{r.notas}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloqueos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bloqueos activos</div>
            <button onClick={() => setModalBloqueo(true)} style={btnGhost}>+ Bloquear fechas</button>
          </div>
          {bloqueos.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#6b7280', padding: '24px 16px', fontSize: 13 }}>
              Sin bloqueos activos
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bloqueos.map(b => (
                <div key={b.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.habitaciones?.nombre}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {fmtFecha(b.fecha_inicio)} → {fmtFecha(b.fecha_fin)}
                      {b.motivo && ` · ${b.motivo}`}
                    </div>
                  </div>
                  <button onClick={async () => {
                    await supabase.from('bloqueos').delete().eq('id', b.id);
                    setBloqueos(prev => prev.filter(x => x.id !== b.id));
                  }} style={{ ...btnGhost, fontSize: 11, color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Reserva manual */}
      {modalReserva && (
        <ModalReservaManual
          hostal={hostal}
          habitaciones={habitaciones}
          onClose={() => setModalReserva(false)}
          onGuardar={async (nueva) => {
            const { data } = await supabase.from('reservas_hostal').insert([nueva]).select().single();
            if (data) setReservas(prev => [data, ...prev]);
            setModalReserva(false);
          }}
        />
      )}

      {/* Modal: Bloqueo */}
      {modalBloqueo && (
        <ModalBloqueo
          hostal={hostal}
          habitaciones={habitaciones}
          onClose={() => setModalBloqueo(false)}
          onGuardar={async (nuevo) => {
            const { data, error } = await supabase.from('bloqueos').insert([nuevo]).select('*, habitaciones(nombre)').single();
            if (!error && data) setBloqueos(prev => [data, ...prev]);
            setModalBloqueo(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Reserva Manual ─────────────────────────────────────────────────────
function ModalReservaManual({ hostal, habitaciones, onClose, onGuardar }) {
  const [form, setForm] = useState({
    huesped_nombre: '', huesped_email: '', huesped_telefono: '',
    habitacion_id: habitaciones[0]?.id || '',
    fecha_entrada: '', fecha_salida: '',
    num_huespedes: 1, estado: 'pagado', notas: '',
  });

  const hab    = habitaciones.find(h => h.id === form.habitacion_id);
  const noches = form.fecha_entrada && form.fecha_salida
    ? Math.max(0, (new Date(form.fecha_salida) - new Date(form.fecha_entrada)) / 86400000)
    : 0;
  const total = noches * (hab?.precio_noche || 0) * form.num_huespedes;

  const guardar = () => {
    if (!form.huesped_nombre || !form.fecha_entrada || !form.fecha_salida) return;
    onGuardar({
      hostal_id: hostal.id,
      habitacion_id: form.habitacion_id,
      huesped_nombre: form.huesped_nombre,
      huesped_email: form.huesped_email,
      huesped_telefono: form.huesped_telefono,
      fecha_entrada: form.fecha_entrada,
      fecha_salida: form.fecha_salida,
      num_huespedes: form.num_huespedes,
      precio_por_noche: hab?.precio_noche || 0,
      estado: form.estado,
      notas: form.notas || null,
    });
  };

  return (
    <Modal title="Nueva reserva manual" onClose={onClose}>
      <Campo label="Nombre del huésped">
        <input style={inputStyle} value={form.huesped_nombre} onChange={e => setForm(f => ({ ...f, huesped_nombre: e.target.value }))} placeholder="Nombre completo" />
      </Campo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="Email">
          <input style={inputStyle} value={form.huesped_email} onChange={e => setForm(f => ({ ...f, huesped_email: e.target.value }))} placeholder="email@..." />
        </Campo>
        <Campo label="Teléfono">
          <input style={inputStyle} value={form.huesped_telefono} onChange={e => setForm(f => ({ ...f, huesped_telefono: e.target.value }))} placeholder="+56 9..." />
        </Campo>
      </div>
      <Campo label="Habitación">
        <select style={inputStyle} value={form.habitacion_id} onChange={e => setForm(f => ({ ...f, habitacion_id: e.target.value }))}>
          {habitaciones.map(h => <option key={h.id} value={h.id}>{h.nombre} — ${h.precio_noche?.toLocaleString('es-CL')}/noche</option>)}
        </select>
      </Campo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="Check-in">
          <input type="date" style={inputStyle} value={form.fecha_entrada} onChange={e => setForm(f => ({ ...f, fecha_entrada: e.target.value }))} />
        </Campo>
        <Campo label="Check-out">
          <input type="date" style={inputStyle} value={form.fecha_salida} onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))} />
        </Campo>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="Huéspedes">
          <input type="number" min={1} style={inputStyle} value={form.num_huespedes} onChange={e => setForm(f => ({ ...f, num_huespedes: parseInt(e.target.value) || 1 }))} />
        </Campo>
        <Campo label="Estado">
          <select style={inputStyle} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </Campo>
      </div>
      {noches > 0 && (
        <div style={{ background: 'rgba(255,106,47,0.1)', border: '1px solid rgba(255,106,47,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF6A2F' }}>
          {noches} noche{noches > 1 ? 's' : ''} × ${hab?.precio_noche?.toLocaleString('es-CL')} × {form.num_huespedes} pax = <strong>${total.toLocaleString('es-CL')}</strong>
        </div>
      )}
      <Campo label="Notas internas">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones..." />
      </Campo>
      <button onClick={guardar} style={{ ...btnPrimary, width: '100%', marginTop: 4, padding: '12px' }}>Guardar reserva</button>
    </Modal>
  );
}

// ─── Modal Bloqueo ────────────────────────────────────────────────────────────
function ModalBloqueo({ hostal, habitaciones, onClose, onGuardar }) {
  const [form, setForm] = useState({ habitacion_id: habitaciones[0]?.id || '', fecha_inicio: '', fecha_fin: '', motivo: '' });

  return (
    <Modal title="Bloquear fechas" onClose={onClose}>
      <Campo label="Habitación">
        <select style={inputStyle} value={form.habitacion_id} onChange={e => setForm(f => ({ ...f, habitacion_id: e.target.value }))}>
          {habitaciones.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
        </select>
      </Campo>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Campo label="Desde">
          <input type="date" style={inputStyle} value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        </Campo>
        <Campo label="Hasta">
          <input type="date" style={inputStyle} value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
        </Campo>
      </div>
      <Campo label="Motivo (opcional)">
        <input style={inputStyle} value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Mantención, uso propio..." />
      </Campo>
      <button onClick={() => { if (form.fecha_inicio && form.fecha_fin) onGuardar({ ...form, hostal_id: hostal.id }); }}
        style={{ ...btnPrimary, width: '100%', marginTop: 4, padding: '12px' }}>
        Bloquear fechas
      </button>
    </Modal>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#131f14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ ...btnGhost, padding: '4px 10px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

// ─── Estilos inline reutilizables ─────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14, padding: '14px 16px',
};
const badge = {
  display: 'inline-block', borderRadius: 6, fontSize: 11,
  padding: '3px 8px', fontWeight: 500, textTransform: 'capitalize',
};
const btnPrimary = {
  background: '#FF6A2F', border: 'none', borderRadius: 10,
  padding: '8px 14px', fontSize: 12, fontWeight: 600,
  color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  boxShadow: '0 2px 12px rgba(255,106,47,.3)',
};
const btnGhost = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '6px 12px', fontSize: 12,
  color: '#9ca3af', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
};
const tabBtn = {
  border: '1px solid', borderRadius: 8, padding: '6px 14px',
  fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 12px',
  fontSize: 13, color: '#e8ede9', outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
};
const selectStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '5px 10px',
  fontSize: 11, color: '#e8ede9', cursor: 'pointer',
  outline: 'none', fontFamily: "'DM Sans', sans-serif",
};
