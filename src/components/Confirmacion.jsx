import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const formatPrecio = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function Confirmacion() {
  const { tenant_id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.reserva) {
    navigate(`/${tenant_id}`);
    return null;
  }

  const { reserva, hab, hostal, entrada, salida, anticipo, resto } = state;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">

      {/* Ícono de éxito */}
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 16l6 6L25 10" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">¡Reserva confirmada!</h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        Te enviamos la confirmación a <span className="font-medium text-gray-700">{reserva.huesped_email}</span>
      </p>

      {/* Tarjeta de reserva */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">

        <div className="bg-green-600 px-5 py-4">
          <div className="text-white/70 text-xs uppercase tracking-wide mb-1">Hostal</div>
          <div className="text-white font-medium">{hostal.nombre}</div>
          <div className="text-white/70 text-xs">{hostal.ciudad} · {hostal.direccion}</div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Habitación</span>
            <span className="font-medium text-gray-900">{hab.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Entrada</span>
            <span className="text-gray-700">{entrada}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Salida</span>
            <span className="text-gray-700">{salida}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Huésped</span>
            <span className="text-gray-700">{reserva.huesped_nombre}</span>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex justify-between">
            <span className="text-gray-500">Anticipo pagado</span>
            <span className="font-medium text-green-700">{formatPrecio(anticipo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Resto al check-in</span>
            <span className="text-gray-700">{formatPrecio(resto)}</span>
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="w-full max-w-sm bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        Recuerda llegar con tu nombre para el check-in. Si necesitas cancelar, hazlo con al menos 48 horas de anticipación.
      </div>

      {/* Acciones */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {hostal.telefono && (
          <a href={`https://wa.me/${hostal.telefono.replace(/\D/g,'')}`}
            target="_blank" rel="noreferrer"
            className="w-full text-center bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl py-3 text-sm transition">
            Contactar al hostal por WhatsApp
          </a>
        )}
        <button
          onClick={() => navigate(`/${tenant_id}`)}
          className="w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3 text-sm transition">
          Volver al hostal
        </button>
      </div>

    </div>
  );
}
