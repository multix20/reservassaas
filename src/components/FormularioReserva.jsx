import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import supabase from '../lib/supabase';

const formatPrecio = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const noches = (entrada, salida) =>
  Math.round((new Date(salida) - new Date(entrada)) / 86400000);

const ANTICIPO_PCT = 0.3; // 30%

export default function FormularioReserva() {
  const { tenant_id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Si no hay state (acceso directo a la URL), volver al hostal
  if (!state?.hab) {
    navigate(`/${tenant_id}`);
    return null;
  }

  const { hab, hostal, entrada, salida } = state;
  const nn = noches(entrada, salida);
  const total = hab.precio_noche * nn;
  const anticipo = Math.round(total * ANTICIPO_PCT);
  const resto = total - anticipo;

  const [paso, setPaso] = useState(1); // 1: datos, 2: resumen, 3: pago
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    notas: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validarPaso1 = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.email.includes('@')) return 'El email no es válido';
    if (!form.telefono.trim()) return 'El teléfono es obligatorio';
    return null;
  };

  const avanzar = () => {
    const err = validarPaso1();
    if (err) { setError(err); return; }
    setError(null);
    setPaso(2);
  };

  const confirmarYPagar = async () => {
    setEnviando(true);
    setError(null);
    try {
      // 1. Crear reserva en Supabase con estado 'pendiente'
     const { error: eR } = await supabase
  .from('reservas_hostal')
  .insert({
    hostal_id: hostal.id,
    habitacion_id: hab.id,
    huesped_nombre: form.nombre.trim(),
    huesped_email: form.email.trim().toLowerCase(),
    huesped_telefono: form.telefono.trim(),
    fecha_entrada: entrada,
    fecha_salida: salida,
    precio_por_noche: hab.precio_noche,
    notas: form.notas.trim() || null,
    estado: 'pendiente',
  });

if (eR) throw new Error(eR.message);

// Construimos el objeto reserva manualmente
const reserva = {
  huesped_nombre: form.nombre.trim(),
  huesped_email: form.email.trim().toLowerCase(),
};

      if (eR) throw new Error(eR.message);

      // 2. Crear orden de pago en Flow.cl (via tu backend/edge function)
      // Por ahora simulamos el redirect — en Semana 3 conectas Flow real
      // const flowUrl = await crearOrdenFlow(reserva.id, anticipo, form.email);
      // window.location.href = flowUrl;

      // Simulación: ir a página de éxito
      navigate(`/${tenant_id}/confirmacion`, {
        state: { reserva, hab, hostal, entrada, salida, anticipo, resto }
      });

    } catch (e) {
      setError('Hubo un problema al procesar tu reserva. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => paso === 1 ? navigate(-1) : setPaso(paso - 1)}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
          ←
        </button>
        <div>
          <div className="text-white font-medium text-sm">Confirmar reserva</div>
          <div className="text-white/70 text-xs">{hostal.nombre} · {hostal.ciudad}</div>
        </div>
      </div>

      {/* Barra de pasos */}
      <div className="flex gap-1.5 px-4 py-2 bg-white border-b border-gray-100">
        {[1, 2].map((n) => (
          <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${
            n <= paso ? 'bg-green-500' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Resumen de reserva — siempre visible */}
        <div className="bg-green-50 rounded-xl p-4 mb-5 border border-green-100">
          <div className="text-sm font-medium text-green-900 mb-1">{hab.nombre}</div>
          <div className="flex justify-between text-sm text-green-800">
            <span>{entrada} → {salida} · {nn} noche{nn !== 1 ? 's' : ''}</span>
            <span className="font-medium">{formatPrecio(total)}</span>
          </div>
        </div>

        {/* ── PASO 1: Datos del huésped ── */}
        {paso === 1 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Paso 1 de 2 · Tus datos</p>

            {/* Badges de confianza */}
            <div className="flex flex-wrap gap-2 mb-5">
              {['Cancelación gratis 48h', 'Pago seguro', 'Confirmación inmediata'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-3 py-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px] leading-none">✓</span>
                  {t}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre completo</label>
                <input
                  type="text" value={form.nombre} onChange={set('nombre')}
                  placeholder="María González"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Email</label>
                  <input
                    type="email" value={form.email} onChange={set('email')}
                    placeholder="tu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Teléfono</label>
                  <input
                    type="tel" value={form.telefono} onChange={set('telefono')}
                    placeholder="+56 9 ..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Notas (opcional)</label>
                <textarea
                  value={form.notas} onChange={set('notas')}
                  placeholder="Hora estimada de llegada, peticiones especiales..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <button onClick={avanzar}
              className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl py-3 text-sm transition">
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASO 2: Resumen y pago ── */}
        {paso === 2 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Paso 2 de 2 · Confirmar y pagar</p>

            {/* Datos ingresados */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Reserva a nombre de</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre</span>
                  <span className="font-medium text-gray-900">{form.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-700">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="text-gray-700">{form.telefono}</span>
                </div>
              </div>
              <button onClick={() => setPaso(1)} className="text-xs text-green-600 mt-3">
                Editar datos
              </button>
            </div>

            {/* Anticipo */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Desglose de pago</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{formatPrecio(hab.precio_noche)} × {nn} noches</span>
                  <span className="text-gray-700">{formatPrecio(total)}</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Total</span>
                  <span className="text-gray-900">{formatPrecio(total)}</span>
                </div>
                <div className="bg-green-50 rounded-lg p-3 mt-1">
                  <div className="flex justify-between text-green-800 font-medium">
                    <span>Pagas ahora (30%)</span>
                    <span>{formatPrecio(anticipo)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 text-xs mt-1">
                    <span>Resto al check-in</span>
                    <span>{formatPrecio(resto)}</span>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={confirmarYPagar}
              disabled={enviando}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-xl py-3 text-sm transition mb-3">
              {enviando ? 'Procesando...' : `Pagar ${formatPrecio(anticipo)} con Flow.cl`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Procesado por Flow · Pago 100% seguro
            </div>

            {hostal.telefono && (
              <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`}
                target="_blank" rel="noreferrer"
                className="block text-center text-xs text-gray-400 hover:text-green-600">
                ¿Tienes dudas? Escríbenos por WhatsApp
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
