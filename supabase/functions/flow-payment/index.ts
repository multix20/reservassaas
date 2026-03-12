// supabase/functions/flow-payment/index.ts
// Maneja dos rutas:
//   POST /flow-payment/create  → crea orden en Flow y devuelve URL de pago
//   POST /flow-payment/webhook → Flow confirma el pago, actualiza reserva

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const FLOW_API_URL   = "https://www.flow.cl/api";
const FLOW_API_KEY   = "370F6200-CF3C-40BF-9E4A-1LAE4A764254";
const FLOW_SECRET    = "8466e4f8b116c852779a91266f8308a19ab52ac0";
const SITE_URL       = "https://araucaniaviajes.cl";
const WA_NUMBER      = "56951569704";

const supabase = createClient(
  Deno.env.get("SB_URL")!,
  Deno.env.get("SB_SERVICE_ROLE_KEY")!
);

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
async function crearOrdenFlow(reservaId: string, monto: number, email: string, descripcion: string) {
  const params: Record<string, string> = {
    apiKey:      FLOW_API_KEY,
    commerceOrder: reservaId,
    subject:     descripcion,
    currency:    "CLP",
    amount:      String(Math.round(monto)),
    email:       email,
    urlConfirmation: `${SITE_URL}/api/flow-webhook`,   // POST de Flow al confirmar
    urlReturn:       `${SITE_URL}/reserva/confirmada`, // Redirige al usuario
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
    `✅ *PAGO CONFIRMADO - Araucanía Viajes*\n\n` +
    `👤 ${reserva.nombre} · ${reserva.telefono || reserva.email}\n` +
    `🗺️ ${reserva.ruta || ""}\n` +
    `📅 ${reserva.fecha || ""} · 🕐 ${reserva.hora || ""}\n` +
    `💰 Abono pagado: $${Number(reserva.monto_abono || 0).toLocaleString("es-CL")}\n` +
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
      const { reservaId, monto, email, descripcion } = await req.json();

      if (!reservaId || !monto || !email) {
        return new Response(JSON.stringify({ error: "Faltan parámetros" }), { status: 400, headers });
      }

      const { url: urlPago, token } = await crearOrdenFlow(reservaId, monto, email, descripcion || "Reserva Araucanía Viajes");

      // Guardar token en la reserva para verificar luego
      await supabase
        .from("reservas")
        .update({ flow_token: token, estado: "pago_pendiente" })
        .eq("id", reservaId);

      return new Response(JSON.stringify({ urlPago }), { status: 200, headers });

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
          .from("reservas")
          .update({ estado: "confirmada", flow_pago_id: pago.flowOrder })
          .eq("id", reservaId)
          .select("*, viajes(fecha, hora_salida, rutas(nombre))")
          .single();

        if (reserva) {
          // Construir datos para WA
          const datosWA = {
            id:          reserva.id,
            nombre:      reserva.nombre,
            telefono:    reserva.telefono,
            email:       reserva.email,
            ruta:        reserva.viajes?.rutas?.nombre || "",
            fecha:       reserva.viajes?.fecha || "",
            hora:        reserva.viajes?.hora_salida || "",
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
          .from("reservas")
          .update({ estado: "pago_fallido" })
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