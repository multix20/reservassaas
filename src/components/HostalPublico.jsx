import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import supabase from '../lib/supabase';
import { MONEDAS, precio } from '../lib/moneda';
import CalendarioReserva from './CalendarioReserva';

const HERO = '/montana.jpg';
/* La base no guarda fotos de habitación todavía, así que se reparten estas
   por orden. Cuando exista `habitaciones.foto_url` esto se puede borrar. */
const FOTOS = ['/hcompartida.jpg', '/hdoble.jpg', '/Habitacion1.jpg', '/iglu.jpg'];

const DESCUENTO_NR = 0.15;

const noches = (e, s) => Math.max(0, Math.round((new Date(s) - new Date(e)) / 86400000));
const aISO   = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoy    = () => aISO(new Date());
const manana = () => aISO(new Date(Date.now() + 86400000));
const corta  = (iso) => new Date(iso + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });

const COMODIDADES = [
  'Wifi incluido', 'Ropa de cama', 'Agua caliente', 'Casilleros',
  'Calefacción', 'Cocina equipada', 'Estacionamiento', 'Desayuno disponible',
];

export default function HostalPublico() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state: navState } = useLocation();

  const [hostal, setHostal]             = useState(null);
  const [habitaciones, setHabitaciones] = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState(null);

  const [entrada, setEntrada]     = useState(navState?.entrada || hoy());
  const [salida, setSalida]       = useState(navState?.salida || manana());
  const [huespedes, setHuespedes] = useState(navState?.huespedes || 1);
  const [tarifa, setTarifa]       = useState('flexible');
  const [moneda, setMoneda]       = useState('CLP');

  const [disponibilidad, setDisponibilidad] = useState({});
  const [verCalendario, setVerCalendario]   = useState(false);
  const [detalle, setDetalle]               = useState(null);

  const nn = noches(entrada, salida);
  const p  = (monto) => precio(monto, moneda);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setCargando(true);
      const { data: h, error: eH } = await supabase
        .from('hostales').select('*')
        .eq('tenant_id', slug).eq('activo', true).single();
      if (!vivo) return;
      if (eH || !h) { setError('No encontramos este hostal'); setCargando(false); return; }
      setHostal(h);
      const { data: habs } = await supabase
        .from('habitaciones').select('*')
        .eq('hostal_id', h.id).eq('activa', true)
        .order('precio_noche', { ascending: true });
      if (!vivo) return;
      setHabitaciones(habs || []);
      setCargando(false);
    })();
    return () => { vivo = false; };
  }, [slug]);

  useEffect(() => {
    if (!habitaciones.length || nn <= 0) return;
    let vivo = true;
    (async () => {
      const pares = await Promise.all(habitaciones.map(async (h) => {
        const { data } = await supabase.rpc('verificar_disponibilidad', {
          p_habitacion_id: h.id, p_entrada: entrada, p_salida: salida,
        });
        return [h.id, data];
      }));
      if (vivo) setDisponibilidad(Object.fromEntries(pares));
    })();
    return () => { vivo = false; };
  }, [habitaciones, entrada, salida, nn]);

  const precioNoche = (hab) => tarifa === 'nr'
    ? Math.round(hab.precio_noche * (1 - DESCUENTO_NR))
    : hab.precio_noche;

  const reservar = (hab) => {
    navigate(`/${slug}/reservar/${hab.id}`, {
      state: {
        hab: { ...hab, precio_noche: precioNoche(hab), tarifa },
        hostal, entrada, salida, huespedes, habitaciones,
      },
    });
  };

  if (cargando) return (
    <div className="min-h-screen grid place-items-center bg-white font-sans">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-borde border-t-marca" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen grid place-items-center bg-white px-6 font-sans text-center">
      <div>
        <p className="text-lg font-semibold text-tinta">{error}</p>
        <p className="mt-2 text-sm text-tenue">Revisa el enlace o vuelve a intentarlo.</p>
      </div>
    </div>
  );

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${hostal.direccion || ''} ${hostal.ciudad || ''}`)}`;
  const wspUrl  = hostal.telefono ? `https://wa.me/${hostal.telefono.replace(/\D/g, '')}` : null;

  return (
    <div className="min-h-screen bg-white font-sans text-tinta antialiased">

      {/* ── Encabezado ── */}
      <header className="sticky top-0 z-40 border-b border-borde/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <button onClick={() => navigate('/')} className="text-base font-bold tracking-tight sm:text-lg">
            {hostal.nombre}
          </button>
          <select
            value={moneda} onChange={(e) => setMoneda(e.target.value)}
            aria-label="Moneda"
            className="rounded-lg border border-borde bg-white px-2.5 py-1.5 text-sm font-semibold text-tenue outline-none focus:border-marca"
          >
            {MONEDAS.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
        </div>
      </header>

      {/* ── Portada ── */}
      <section className="relative">
        <img src={HERO} alt="" className="h-[45vh] min-h-[260px] w-full object-cover sm:h-[52vh]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-8 sm:px-8 sm:pb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl">
            {hostal.nombre}
          </h1>
          {hostal.ciudad && (
            <p className="mt-1.5 text-sm text-white/85 sm:text-base">{hostal.ciudad}</p>
          )}
        </div>
      </section>

      {/* ── Buscador ── */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="-mt-7 rounded-2xl border border-borde bg-white p-3 shadow-lg sm:-mt-8 sm:mx-auto sm:max-w-3xl sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

            <button
              onClick={() => setVerCalendario(true)}
              className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-marca-suave"
            >
              <svg className="h-5 w-5 shrink-0 text-marca" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-tenue">Fechas</span>
                <span className="block text-sm font-semibold">
                  {corta(entrada)} → {corta(salida)}
                  <span className="ml-2 font-normal text-tenue">{nn} noche{nn !== 1 ? 's' : ''}</span>
                </span>
              </span>
            </button>

            <div className="hidden h-9 w-px bg-borde sm:block" />

            <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 sm:justify-start">
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-tenue">Huéspedes</span>
                <span className="block text-sm font-semibold">{huespedes} {huespedes === 1 ? 'persona' : 'personas'}</span>
              </span>
              <span className="flex items-center gap-2">
                <BotonPaso onClick={() => setHuespedes(v => Math.max(1, v - 1))} inactivo={huespedes <= 1} signo="−" />
                <BotonPaso onClick={() => setHuespedes(v => Math.min(20, v + 1))} signo="+" primario />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Habitaciones ── */}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Habitaciones</h2>
            <p className="mt-1 text-sm text-tenue">
              {habitaciones.length} disponible{habitaciones.length !== 1 ? 's' : ''} · {corta(entrada)} a {corta(salida)}
            </p>
          </div>

          {/* Tarifa: una sola decisión, para todas las habitaciones */}
          <div className="inline-flex self-start rounded-xl border border-borde p-1 sm:self-auto">
            {[
              ['flexible', 'Flexible'],
              ['nr', `Sin reembolso −${DESCUENTO_NR * 100}%`],
            ].map(([id, texto]) => (
              <button
                key={id} onClick={() => setTarifa(id)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  tarifa === id ? 'bg-tinta text-white' : 'text-tenue hover:text-tinta'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-6 text-xs text-tenue">
          {tarifa === 'flexible'
            ? 'Cancelación gratuita hasta 48 horas antes de la llegada.'
            : 'Precio más bajo pagando por adelantado. No admite cancelación.'}
        </p>

        {habitaciones.length === 0 ? (
          <p className="rounded-2xl border border-borde p-10 text-center text-sm text-tenue">
            Este hostal aún no publica habitaciones.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {habitaciones.map((hab, i) => (
              <Habitacion
                key={hab.id}
                hab={hab} foto={FOTOS[i % FOTOS.length]}
                noches={nn} huespedes={huespedes}
                precioNoche={precioNoche(hab)}
                base={hab.precio_noche}
                conDescuento={tarifa === 'nr'}
                disponible={disponibilidad[hab.id]}
                fmt={p}
                abierta={detalle === hab.id}
                onDetalle={() => setDetalle(d => d === hab.id ? null : hab.id)}
                onReservar={() => reservar(hab)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Información ── */}
      <section className="border-t border-borde bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3">

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-tenue">Condiciones</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                'Llegada desde las 14:00, salida hasta las 11:00.',
                'Se paga el 30% al reservar y el resto al llegar.',
                'Cancelación gratuita hasta 48 horas antes.',
                'La tarifa sin reembolso no admite devolución.',
              ].map(t => (
                <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-tenue">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-marca" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {hostal.descripcion && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-tenue">El hostal</h3>
              <p className="mt-4 text-sm leading-relaxed text-tenue">{hostal.descripcion}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-tenue">Dónde estamos</h3>
            {hostal.direccion && <p className="mt-4 text-sm text-tenue">{hostal.direccion}</p>}
            {hostal.ciudad    && <p className="text-sm text-tenue">{hostal.ciudad}</p>}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="rounded-lg border border-borde bg-white px-3.5 py-2 text-sm font-semibold transition hover:border-tinta">
                Ver en el mapa
              </a>
              {wspUrl && (
                <a href={wspUrl} target="_blank" rel="noreferrer"
                  className="rounded-lg bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95">
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="border-t border-borde py-6 text-center text-xs text-tenue">
          Reservas · ReservasSaaS
        </p>
      </section>

      {/* ── Calendario ── */}
      {verCalendario && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <div className="mx-auto max-w-lg">
            <CalendarioReserva
              precioNoche={habitaciones[0]?.precio_noche || 12000}
              inicioInicial={entrada}
              finInicial={salida}
              onClose={(ini, fin) => {
                if (ini && fin) { setEntrada(aISO(ini)); setSalida(aISO(fin)); }
                setVerCalendario(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Piezas ──────────────────────────────────────────────────────────────────

function BotonPaso({ onClick, signo, inactivo, primario }) {
  return (
    <button
      onClick={onClick} disabled={inactivo}
      className={`grid h-8 w-8 place-items-center rounded-full border text-lg leading-none transition ${
        inactivo
          ? 'cursor-default border-borde bg-[#FAFAFA] text-[#C9C9C9]'
          : primario
            ? 'border-marca bg-marca text-white hover:bg-marca-oscuro'
            : 'border-borde text-tenue hover:border-tinta hover:text-tinta'
      }`}
    >
      {signo}
    </button>
  );
}

function Habitacion({
  hab, foto, noches, huespedes, precioNoche, base, conDescuento,
  disponible, fmt, abierta, onDetalle, onReservar,
}) {
  const capacidad = hab.capacidad || 2;
  const agotada   = disponible === false;
  const noCabe    = huespedes > capacidad;
  const bloqueada = agotada || noCabe || noches <= 0;

  const total     = precioNoche * noches;
  const totalBase = base * noches;

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border border-borde bg-white transition ${
      bloqueada ? 'opacity-60' : 'hover:shadow-lg'
    }`}>

      <div className="relative">
        <img src={foto} alt={hab.nombre} loading="lazy" className="h-48 w-full object-cover" />
        {agotada && (
          <span className="absolute left-3 top-3 rounded-full bg-tinta/85 px-2.5 py-1 text-[11px] font-semibold text-white">
            Sin disponibilidad
          </span>
        )}
        {!agotada && noCabe && (
          <span className="absolute left-3 top-3 rounded-full bg-tinta/85 px-2.5 py-1 text-[11px] font-semibold text-white">
            Máximo {capacidad}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold leading-snug">{hab.nombre}</h3>
        <p className="mt-1 text-xs text-tenue">Hasta {capacidad} {capacidad === 1 ? 'persona' : 'personas'}</p>

        {hab.descripcion && (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-tenue">{hab.descripcion}</p>
        )}

        <button onClick={onDetalle} className="mt-3 self-start text-sm font-semibold text-marca hover:underline">
          {abierta ? 'Ocultar comodidades' : 'Ver comodidades'}
        </button>
        {abierta && (
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {COMODIDADES.map(c => (
              <li key={c} className="flex items-center gap-1.5 text-xs text-tenue">
                <svg className="h-3 w-3 shrink-0 text-marca" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        )}

        {/* Precio y acción, siempre abajo para que las tarjetas se alineen */}
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {conDescuento && !bloqueada && (
                <span className="block text-xs text-tenue line-through">{fmt(totalBase)}</span>
              )}
              <span className={`block text-2xl font-extrabold tracking-tight ${conDescuento ? 'text-exito' : ''}`}>
                {fmt(noches > 0 ? total : precioNoche)}
              </span>
              <span className="block text-xs text-tenue">
                {noches > 0
                  ? `${fmt(precioNoche)} × ${noches} noche${noches !== 1 ? 's' : ''}`
                  : 'por noche'}
              </span>
            </div>
          </div>

          <button
            onClick={onReservar} disabled={bloqueada}
            className={`mt-4 w-full rounded-xl py-3 text-sm font-bold transition ${
              bloqueada
                ? 'cursor-not-allowed bg-[#F3F3F3] text-tenue'
                : 'bg-marca text-white hover:bg-marca-oscuro'
            }`}
          >
            {agotada ? 'Sin disponibilidad'
              : noCabe ? `Máximo ${capacidad} personas`
              : noches <= 0 ? 'Elige las fechas'
              : 'Reservar'}
          </button>
        </div>
      </div>
    </article>
  );
}
