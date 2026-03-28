import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

const fmt = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const fmtFecha = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

const hoy = new Date().toISOString().split('T')[0];

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  pagado:     { label: 'Confirmada', bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  cancelado:  { label: 'Cancelada',  bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'   },
  completado: { label: 'Completada', bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'border-gray-200'  },
};

// ── Tarjeta de reserva ────────────────────────────────────────
function TarjetaReserva({ r, onCambioEstado }) {
  const cfg = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.pendiente;
  const [cambiando, setCambiando] = useState(false);

  const cambiarEstado = async (nuevoEstado) => {
    setCambiando(true);
    await supabase
      .from('reservas_hostal')
      .update({ estado: nuevoEstado })
      .eq('id', r.id);
    onCambioEstado();
    setCambiando(false);
  };

  return (
    <div className={`bg-white rounded-xl border p-4 ${cfg.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-medium text-gray-900 text-sm">{r.huesped_nombre}</p>
          <p className="text-xs text-gray-500">{r.huesped_email} · {r.huesped_telefono}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        <span>🛏 {r.habitaciones?.nombre}</span>
        <span>📅 {fmtFecha(r.fecha_entrada)} → {fmtFecha(r.fecha_salida)} · {r.noches} noche{r.noches !== 1 ? 's' : ''}</span>
        <span>💰 {fmt(r.total)}</span>
      </div>

      {r.notas && (
        <p className="text-xs text-gray-400 italic mb-3">"{r.notas}"</p>
      )}

      {/* Acciones de estado */}
      <div className="flex gap-2 flex-wrap">
        {r.estado === 'pendiente' && (
          <button onClick={() => cambiarEstado('pagado')} disabled={cambiando}
            className="text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 transition disabled:opacity-50">
            Confirmar reserva
          </button>
        )}
        {r.estado === 'pagado' && (
          <button onClick={() => cambiarEstado('completado')} disabled={cambiando}
            className="text-xs bg-gray-700 text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition disabled:opacity-50">
            Marcar completada
          </button>
        )}
        {(r.estado === 'pendiente' || r.estado === 'pagado') && (
          <button onClick={() => cambiarEstado('cancelado')} disabled={cambiando}
            className="text-xs border border-red-200 text-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50 transition disabled:opacity-50">
            Cancelar
          </button>
        )}
        {r.huesped_telefono && (
          <a href={`https://wa.me/${r.huesped_telefono.replace(/\D/g,'')}`}
            target="_blank" rel="noreferrer"
            className="text-xs border border-gray-200 text-gray-500 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function AdminDashboard() {
  const { slug: tenant_id } = useParams();
  const navigate      = useNavigate();

  const [hostal, setHostal]           = useState(null);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [proximas, setProximas]       = useState([]);
  const [ingresos, setIngresos]       = useState({ mes: 0, pendiente: 0, total: 0 });
  const [cargando, setCargando]       = useState(true);
  const [tab, setTab]                 = useState('hoy');

  // Verificar sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin/login');
    });
  }, []);

  const cargar = async () => {
    setCargando(true);

    const { data: h } = await supabase
      .from('hostales')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single();

    if (!h) { navigate('/admin/login'); return; }
    setHostal(h);

    // Reservas de hoy (check-in o check-out hoy)
    const { data: rHoy } = await supabase
      .from('reservas_hostal')
      .select('*, habitaciones(nombre)')
      .eq('hostal_id', h.id)
      .or(`fecha_entrada.eq.${hoy},fecha_salida.eq.${hoy}`)
      .neq('estado', 'cancelado')
      .order('fecha_entrada');

    setReservasHoy(rHoy || []);

    // Próximas reservas (desde mañana, 30 días)
    const manana = new Date(); manana.setDate(manana.getDate() + 1);
    const en30   = new Date(); en30.setDate(en30.getDate() + 30);
    const { data: rProx } = await supabase
      .from('reservas_hostal')
      .select('*, habitaciones(nombre)')
      .eq('hostal_id', h.id)
      .gte('fecha_entrada', manana.toISOString().split('T')[0])
      .lte('fecha_entrada', en30.toISOString().split('T')[0])
      .neq('estado', 'cancelado')
      .order('fecha_entrada');

    setProximas(rProx || []);

    // Ingresos del mes actual
    const inicioMes = new Date(); inicioMes.setDate(1);
    const { data: rMes } = await supabase
      .from('reservas_hostal')
      .select('total, estado')
      .eq('hostal_id', h.id)
      .gte('fecha_entrada', inicioMes.toISOString().split('T')[0])
      .neq('estado', 'cancelado');

    const totMes  = (rMes || []).filter(r => r.estado === 'pagado' || r.estado === 'completado').reduce((s, r) => s + Number(r.total), 0);
    const totPend = (rMes || []).filter(r => r.estado === 'pendiente').reduce((s, r) => s + Number(r.total), 0);
    setIngresos({ mes: totMes, pendiente: totPend, total: totMes + totPend });

    setCargando(false);
  };

  useEffect(() => { cargar(); }, [tenant_id]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando panel...</p>
    </div>
  );

  const mesActual = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-600 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold">{hostal?.nombre}</h1>
            <p className="text-white/70 text-xs">{hostal?.ciudad} · Panel de administración</p>
          </div>
          <button onClick={cerrarSesion}
            className="text-white/70 text-xs border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/10 transition">
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Métricas del mes */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Ingresos {mesActual}</p>
            <p className="text-lg font-bold text-green-700">{fmt(ingresos.mes)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Por confirmar</p>
            <p className="text-lg font-bold text-amber-600">{fmt(ingresos.pendiente)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Check-ins hoy</p>
            <p className="text-lg font-bold text-gray-900">
              {reservasHoy.filter(r => r.fecha_entrada === hoy).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          {[
            { id: 'hoy',     label: `Hoy (${reservasHoy.length})` },
            { id: 'proximas', label: `Próximas (${proximas.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 text-sm rounded-lg py-2 font-medium transition ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        {tab === 'hoy' && (
          <div className="flex flex-col gap-3">
            {reservasHoy.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Sin check-ins ni check-outs hoy</p>
              </div>
            ) : (
              <>
                {reservasHoy.filter(r => r.fecha_entrada === hoy).length > 0 && (
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Check-in hoy</p>
                )}
                {reservasHoy.filter(r => r.fecha_entrada === hoy).map(r => (
                  <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
                ))}
                {reservasHoy.filter(r => r.fecha_salida === hoy).length > 0 && (
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mt-2">Check-out hoy</p>
                )}
                {reservasHoy.filter(r => r.fecha_salida === hoy).map(r => (
                  <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'proximas' && (
          <div className="flex flex-col gap-3">
            {proximas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Sin reservas en los próximos 30 días</p>
              </div>
            ) : (
              proximas.map(r => (
                <TarjetaReserva key={r.id} r={r} onCambioEstado={cargar} />
              ))
            )}
          </div>
        )}

        {/* Botón ir al hostal público */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <a href={`/${tenant_id}`} target="_blank" rel="noreferrer"
            className="block text-center text-sm text-green-600 hover:text-green-700">
            Ver página pública del hostal →
          </a>
        </div>

      </div>
    </div>
  );
}
