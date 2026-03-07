import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FLOW_SECRET = "8466e4f8b116c852779a91266f8308a19ab52ac0";
const FLOW_API_URL = "https://www.flow.cl/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSHA256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  try {
    const { reservaId, monto, email, nombre, rutaLabel } = await req.json();
    const params: Record<string, string | number> = {
      apiKey: "370F6200-CF3C-40BF-9E4A-1LAE4A764254",
      commerceOrder: `AV-${reservaId}`,
      subject: `Transfer ${rutaLabel}`,
      currency: "CLP",
      amount: monto,
      email,
      paymentMethod: 9,
      urlConfirmation: "https://araucaniaviajes.cl/api/flow-confirm",
      urlReturn: "https://araucaniaviajes.cl/reserva-exitosa",
    };
    const sorted = Object.keys(params).sort().reduce((acc: Record<string, string | number>, key) => { acc[key] = params[key]; return acc; }, {});
    const toSign = Object.entries(sorted).map(([k, v]) => `${k}${v}`).join("");
    params.s = await hmacSHA256(FLOW_SECRET, toSign);
    const response = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params as Record<string, string>).toString(),
    });
    const data = await response.json();
    if (data.url && data.token) {
      return new Response(JSON.stringify({ url: `${data.url}?token=${data.token}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error(data.message || "Error Flow");
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
