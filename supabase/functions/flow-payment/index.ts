// supabase/functions/flow-payment/index.ts
// Maneja dos rutas:
//   POST /flow-payment/create  → crea orden en Flow y devuelve URL de pago
//   POST /flow-payment/webhook → Flow confirma el pago, actualiza la reserva

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Credenciales SIEMPRE desde secrets (supabase secrets set) — nunca hardcodeadas
const FLOW_API_URL = Deno.env.get("FLOW_API_URL") ?? "https://www.flow.cl/api";
const FLOW_API_KEY = Deno.env.get("FLOW_API_KEY")!;
const FLOW_SECRET  = Deno.env.get("FLOW_SECRET")!;
const SITE_URL     = Deno.env.get("SITE_URL") ?? "";
const WA_NUMBER    = Deno.env.get("WA_NUMBER") ?? "";

// URL pública de esta misma función; Flow hace POST aquí al procesar el pago.
// Ej: https://<proyecto>.supabase.co/functions/v1/flow-payment/webhook
const FLOW_WEBHOOK_URL = Deno.env.get("FLOW_WEBHOOK_URL") ?? "";

if (!FLOW_API_KEY || !FLOW_SECRET) {
  console.error("FALTAN SECRETS: configura FLOW_API_KEY y FLOW_SECRET con `supabase secrets set`");
}
if (!FLOW_WEBHOOK_URL) {
  console.error("FALTA FLOW_WEBHOOK_URL: sin ella Flow no puede confirmar el pago");
}

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

// Estados de reservas_hostal — deben coincidir con ESTADOS del panel admin
const ESTADO_PAGADO    = "pagado";
const ESTADO_PENDIENTE = "pendiente";
const ESTADO_CANCELADO = "cancelado";

// ── Firma Flow (HMAC-SHA256) ──────────────────────────────────────────────────
async function firmarFlow(params: Record<string, string>): Promise<string> {
  // 1. Ordenar keys alfabéticamente y concatenar
  const keys   = Object.keys(params).sort();
  const cadena = keys.map(k => `${k}${params[k]}`).join("");

  // 2. HMAC-SHA256 con el secret
  const encoder = new TextEncoder();
  const key     = await crypto.subtle.importKey(
    "raw", encoder.encode(FLOW_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(cadena));

  // 3. Convertir a hex
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Crear orden Flow ──────────────────────────────────────────────────────────
async function crearOrdenFlow(reservaId: string, monto: number, email: string, descripcion: string, slug: string) {
  const params: Record<string, string> = {
    apiKey:        FLOW_API_KEY,
    commerceOrder: reservaId,
    subject:       descripcion,
    currency:      "CLP",
    amount:        String(Math.round(monto)),
    email:         email,
    urlConfirmation: FLOW_WEBHOOK_URL,                        // POST de Flow al confirmar
    urlReturn:       `${SITE_URL}/${slug}/confirmacion`,      // Redirige al huésped
  };

  params.s = await firmarFlow(params);

  const body = new URLSearchParams(params);
  const res  = await fetch(`${FLOW_API_URL}/payment/create`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!data.url || !data.token) throw new Error(data.message || "Error creando orden Flow");

  // URL final de pago = url + "?token=" + token
  return { url: `${data.url}?token=${data.token}`, token: data.token };
}

// ── Verificar pago Flow ───────────────────────────────────────────────────────
async function verificarPagoFlow(token: string) {
  const params: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };
  params.s = await firmarFlow(params);

  const qs  = new URLSearchParams(params);
  const res = await fetch(`${FLOW_API_URL}/payment/getStatus?${qs}`);
  return await res.json();
}

// ── Generar mensaje WhatsApp ──────────────────────────────────────────────────
function generarMsgWA(reserva: Record<string, unknown>): string {
  return encodeURIComponent(
    `✅ *PAGO CONFIRMADO*\n\n` +
    `🏠 ${reserva.hostal || ""}\n` +
    `👤 ${reserva.nombre} · ${reserva.telefono || reserva.email}\n` +
    `🛏️ ${reserva.habitacion || ""}\n` +
    `📅 ${reserva.entrada || ""} → ${reserva.salida || ""}\n` +
    `💰 Anticipo pagado: $${Number(reserva.monto_abono || 0).toLocaleString("es-CL")}\n` +
    `🆔 Reserva: ${reserva.id}\n\n` +
    `_Pago procesado vía Flow_`
  );
}

// ── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  const url     = new URL(req.url);
  const path    = url.pathname;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...headers, "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  // ── RUTA 1: Crear orden ───────────────────────────────────────────────────
  if (path.endsWith("/create") && req.method === "POST") {
    try {
      const { reservaId, monto, email, descripcion, slug } = await req.json();

      if (!reservaId || !monto || !email) {
        return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400, headers });
      }

      // El monto se recalcula desde la base: aceptarlo del cliente permitiría
      // que cualquiera pagara $1 por una reserva de $100.000.
      const { data: reserva, error: eReserva } = await supabase
        .from("reservas_hostal")
        .select("id, huesped_email, precio_por_noche, num_huespedes, fecha_entrada, fecha_salida, total")
        .eq("id", reservaId)
        .single();

      if (eReserva || !reserva) {
        return new Response(JSON.stringify({ error: "Reserva no encontrada" }), { status: 404, headers });
      }

      const noches = Math.max(
        0,
        Math.round((new Date(reserva.fecha_salida).getTime() - new Date(reserva.fecha_entrada).getTime()) / 86400000)
      );
      const totalReal = reserva.total != null
        ? Number(reserva.total)
        : (reserva.precio_por_noche || 0) * noches * (reserva.num_huespedes || 1);

      // Anticipo del 30% — mismo criterio que ANTICIPO_PCT en el formulario
      const montoCobrar = Math.round(totalReal * 0.3);

      if (montoCobrar <= 0) {
        return new Response(JSON.stringify({ error: "Monto inválido" }), { status: 400, headers });
      }

      const { url: urlPago, token } = await crearOrdenFlow(
        reservaId,
        montoCobrar,
        reserva.huesped_email || email,
        descripcion || "Reserva de alojamiento",
        slug || ""
      );

      // Guardar token en la reserva para verificar luego
      await supabase
        .from("reservas_hostal")
        .update({ flow_token: token, estado: ESTADO_PENDIENTE })
        .eq("id", reservaId);

      return new Response(JSON.stringify({ urlPago, monto: montoCobrar }), { status: 200, headers });

    } catch (e) {
      console.error("Error /create:", e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // ── RUTA 2: Webhook Flow ──────────────────────────────────────────────────
  // Flow hace POST con el token cuando el pago se procesa (exitoso o fallido)
  if (path.endsWith("/webhook") && req.method === "POST") {
    try {
      const body  = await req.formData();
      const token = body.get("token") as string;

      if (!token) return new Response("ok", { status: 200 });

      // Consultar estado real del pago a Flow
      const pago = await verificarPagoFlow(token);

      // Estado 2 = pagado, 3 = rechazado, 4 = anulado
      // Ref: https://www.flow.cl/apidoc/payment.html#payment_getStatus
      const reservaId = pago.commerceOrder;

      if (pago.status === 2) {
        // ✅ Pago exitoso → confirmar reserva
        const { data: reserva } = await supabase
          .from("reservas_hostal")
          .update({ estado: ESTADO_PAGADO, flow_pago_id: pago.flowOrder })
          .eq("id", reservaId)
          .select("*, habitaciones(nombre), hostales(nombre)")
          .single();

        if (reserva) {
          // Construir datos para WA
          const datosWA = {
            id:          reserva.id,
            nombre:      reserva.huesped_nombre,
            telefono:    reserva.huesped_telefono,
            email:       reserva.huesped_email,
            hostal:      reserva.hostales?.nombre || "",
            habitacion:  reserva.habitaciones?.nombre || "",
            entrada:     reserva.fecha_entrada || "",
            salida:      reserva.fecha_salida || "",
            monto_abono: pago.amount,
          };

          // Log para debugging — en producción aquí dispararías
          // la WhatsApp Business API si la tienes configurada
          console.log("✅ Reserva confirmada:", reservaId);
          console.log("WA URL:", `https://wa.me/${WA_NUMBER}?text=${generarMsgWA(datosWA)}`);
        }

      } else if (pago.status === 3 || pago.status === 4) {
        // ❌ Rechazado o anulado
        await supabase
          .from("reservas_hostal")
          .update({ estado: ESTADO_CANCELADO })
          .eq("id", reservaId);

        console.log("❌ Pago fallido/anulado:", reservaId, "status:", pago.status);
      }

      // Flow espera siempre un 200
      return new Response("ok", { status: 200 });

    } catch (e) {
      console.error("Error /webhook:", e);
      // Igual responder 200 para que Flow no reintente indefinidamente
      return new Response("ok", { status: 200 });
    }
  }

  return new Response(JSON.stringify({ error: "Ruta no encontrada" }), { status: 404, headers });
});
