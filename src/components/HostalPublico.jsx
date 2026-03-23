import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';

// ─── Utilidades ──────────────────────────────────────────────
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

// ─── Componente principal ────────────────────────────────────
export default function HostalPublico() {
  const { tenant_id } = useParams();
  const navigate = useNavigate();

  const [hostal, setHostal]           = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState(null);

  // Fechas seleccionadas (compartidas para todas las habitaciones)
  const [entrada, setEntrada] = useState(hoy());
  const [salida, setSalida]   = useState(manana());

  // Disponibilidad por habitacion_id → true/false/null(cargando)
  const [disponibilidad, setDisponibilidad] = useState({});

  // ── Cargar hostal y habitaciones ──────────────────────────
  useEffect(() => {
    async function cargar() {
      setCargando(true);
      // Buscar hostal por tenant_id
      const { data: h, error: eH } = await supabase
        .from('hostales')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('activo', true)
        .single();

      if (eH || !h) { setError('Hostal no encontrado'); setCargando(false); return; }
      setHostal(h);

      // Cargar habitaciones activas
      const { data: habs } = await supabase
        .from('habitaciones')
        .select('*')
        .eq('hostal_id', h.id)
        .eq('activa', true)
        .order('precio_noche', { ascending: true });

      setHabitaciones(habs || []);
      setCargando(false);
    }
    cargar();
  }, [tenant_id]);

  // ── Verificar disponibilidad cuando cambian las fechas ────
  useEffect(() => {
    if (!habitaciones.length || !entrada || !salida || entrada >= salida) return;
    async function verificar() {
      const checks = habitaciones.map(async (h) => {
        const { data } = await supabase
          .rpc('verificar_disponibilidad', {
            p_habitacion_id: h.id,
            p_entrada: entrada,
            p_salida: salida,
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

  // ── Ir al formulario de reserva ───────────────────────────
  const reservar = (hab) => {
    navigate(`/${tenant_id}/reservar/${hab.id}`, {
      state: { hab, hostal, entrada, salida }
    });
  };

  // ── Estados de carga / error ──────────────────────────────
  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  );

  const nn = noches(entrada, salida);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero del hostal ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {hostal.logo_url && (
            <img src={hostal.logo_url} alt={hostal.nombre} className="h-12 mb-4 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{hostal.nombre}</h1>
          <p className="text-gray-500 text-sm mb-3">{hostal.ciudad} · {hostal.direccion}</p>
          {hostal.descripcion && (
            <p className="text-gray-600 max-w-2xl leading-relaxed">{hostal.descripcion}</p>
          )}
          {hostal.telefono && (
            <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`}
               target="_blank" rel="noreferrer"
               className="inline-block mt-4 text-sm text-green-700 border border-green-300 rounded-full px-4 py-1 hover:bg-green-50 transition">
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* ── Selector de fechas ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Entrada</label>
            <input type="date" value={entrada} min={hoy()}
              onChange={e => setEntrada(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Salida</label>
            <input type="date" value={salida} min={entrada}
              onChange={e => setSalida(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {nn > 0 && (
            <span className="text-xs text-gray-400">{nn} noche{nn !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* ── Lista de habitaciones ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Habitaciones disponibles</h2>

        {habitaciones.length === 0 && (
          <p className="text-gray-400 text-sm">No hay habitaciones configuradas aún.</p>
        )}

        <div className="flex flex-col gap-4">
          {habitaciones.map((hab) => {
            const disp = disponibilidad[hab.id];
            const total = nn > 0 ? hab.precio_noche * nn : null;
            return (
              <div key={hab.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{hab.nombre}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      hasta {hab.capacidad} {hab.capacidad === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  {hab.descripcion && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-2">{hab.descripcion}</p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">{formatPrecio(hab.precio_noche)}</span>
                    <span className="text-xs text-gray-400">/ noche</span>
                    {total && (
                      <span className="ml-2 text-sm text-green-700 font-medium">
                        Total: {formatPrecio(total)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Acción */}
                <div className="sm:text-right">
                  {disp === false && (
                    <span className="inline-block text-xs text-red-500 bg-red-50 rounded-full px-3 py-1.5 font-medium">
                      No disponible
                    </span>
                  )}
                  {(disp === true || disp === undefined) && (
                    <button
                      onClick={() => reservar(hab)}
                      disabled={nn <= 0 || entrada >= salida}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition">
                      Reservar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer mínimo ── */}
      <div className="text-center py-8 text-xs text-gray-300">
        Reservas powered by ReservasSaaS
      </div>
    </div>
  );
}
