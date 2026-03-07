import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pyloifgprupypgkhkqmx.supabase.co";
const SUPABASE_KEY = "sb_publishable_UN__-qAOLiEli5p9xY9ypQ_Qr9wxajL";
const WHATSAPP_NUMBER = "56951569704";
const MAX_PASAJEROS_VAN = 12;
const MIN_PASAJEROS_COMPARTIDO = 10;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Rutas y precios ──────────────────────────────────────────────────────────
const RUTAS = [
  { id: "pucon-aeropuerto", label: "Pucón → Aeropuerto Temuco", precio_persona: 15000, precio_van: 120000, emoji: "🏔️", duracion: "~1h 30min" },
  { id: "aeropuerto-pucon", label: "Aeropuerto Temuco → Pucón", precio_persona: 15000, precio_van: 120000, emoji: "✈️", duracion: "~1h 30min" },
  { id: "villarrica-aeropuerto", label: "Villarrica → Aeropuerto Temuco", precio_persona: 12000, precio_van: 100000, emoji: "🌋", duracion: "~1h 15min" },
  { id: "aeropuerto-villarrica", label: "Aeropuerto Temuco → Villarrica", precio_persona: 12000, precio_van: 100000, emoji: "🏕️", duracion: "~1h 15min" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFecha = (str) => { if (!str) return ""; const [y, m, d] = str.split("-"); return new Date(y, m - 1, d).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
const formatPrecio = (n) => `CLP ${n.toLocaleString("es-CL")}`;
const calcularTotal = (ruta, tipo, pasajeros) => { if (!ruta) return 0; return tipo === "van_completa" ? ruta.precio_van : ruta.precio_persona * pasajeros; };

const crearOrdenFlow = async (reservaId, monto, email, nombre, rutaLabel) => {
  const response = await fetch(
    "https://pyloifgprupypgkhkqmx.supabase.co/functions/v1/flow-payment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservaId, monto, email, nombre, rutaLabel }),
    }
  );
  const data = await response.json();
  if (data.url) return data.url;
  throw new Error(data.error || "Error al crear orden de pago");
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Reservas() {
  const [paso, setPaso] = useState(1);
  const [rutaId, setRutaId] = useState(null);
  const [fecha, setFecha] = useState("");
  const [tipoReserva, setTipoReserva] = useState("compartido");
  const [form, setForm] = useState({ nombre: "", email: "", emailConfirm: "", telefono: "", pasajeros: 1, direccion: "", notas: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const ruta = RUTAS.find((r) => r.id === rutaId);
  const total = calcularTotal(ruta, tipoReserva, Number(form.pasajeros));
  const hoy = new Date().toISOString().split("T")[0];

  const handlePagar = async () => {
    if (!form.nombre || !form.email || !form.telefono) { setError("Completa todos los campos obligatorios."); return; }
    if (form.email !== form.emailConfirm) { setError("Los emails no coinciden."); return; }
    if (!aceptaTerminos) { setError("Debes aceptar los términos y condiciones."); return; }
    setError("");
    setEnviando(true);
    try {
      const reservaData = {
        nombre: form.nombre, email: form.email, telefono: form.telefono,
        ruta: ruta.label, fecha,
        vuelo_numero: "SIN_VUELO",
        pasajeros: Number(form.pasajeros),
        tipo_reserva: tipoReserva,
        estado: "pendiente_pago",
        notas: form.notas || "",
      };
      const { data: reservaGuardada, error: dbError } = await supabase.from("reservas").insert([reservaData]).select().single();
      if (dbError) throw new Error("Error al guardar reserva");
      const urlPago = await crearOrdenFlow(reservaGuardada.id, total, form.email, form.nombre, ruta.label);
      const msg = encodeURIComponent(
        `🚐 *Nueva Reserva - Araucanía Viajes*\n\n` +
        `👤 ${form.nombre}\n📱 ${form.telefono}\n📧 ${form.email}\n` +
        `🗺️ ${ruta.label}\n📅 ${fecha}\n` +
        `👥 ${form.pasajeros} pasajero(s) · ${tipoReserva === "van_completa" ? "Van completa" : "Compartido"}\n` +
        `💰 Total: ${formatPrecio(total)}\n📍 ${form.direccion || "—"}\n📝 ${form.notas || "—"}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
      window.location.href = urlPago;
    } catch (err) {
      setError(err.message || "Error al procesar. Intenta de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <section id="reservas" style={s.section}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rv-ruta:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(5,150,105,0.15); }
        .rv-btn:hover { background:linear-gradient(135deg,#047857,#065f46) !important; transform:translateY(-1px); box-shadow:0 8px 24px rgba(5,150,105,0.35); }
        .rv-input:focus { border-color:#059669 !important; box-shadow:0 0 0 3px rgba(5,150,105,0.1); outline:none; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.badge}>TRANSFER · ARAUCANÍA VIAJES</div>
        <h2 style={s.titulo}>Reserva tu Transfer</h2>
        <p style={s.subtitulo}>Pucón · Villarrica · Aeropuerto Temuco ZCO</p>

        {/* Pasos */}
        <div style={s.stepBar}>
          {["Ruta & Fecha", "Datos & Pago"].map((label, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ ...s.stepDot, background: paso > i+1 ? "#059669" : paso === i+1 ? "#064e3b" : "#e5e7eb", color: paso >= i+1 ? "white" : "#9ca3af", transform: paso === i+1 ? "scale(1.15)" : "scale(1)" }}>
                {paso > i+1 ? "✓" : i+1}
              </div>
              <span style={{ fontSize:"0.8rem", fontWeight: paso === i+1 ? "600" : "400", color: paso === i+1 ? "#064e3b" : "#9ca3af" }}>{label}</span>
              {i < 1 && <div style={{ width:"3rem", height:"2px", background: paso > i+1 ? "#059669" : "#e5e7eb", transition:"background 0.3s" }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>

        {/* ── PASO 1: Ruta y fecha ── */}
        {paso === 1 && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <h3 style={s.pasoTitulo}>¿Cuál es tu ruta?</h3>
            <div style={s.grid2}>
              {RUTAS.map((r) => (
                <button key={r.id} className="rv-ruta" onClick={() => setRutaId(r.id)}
                  style={{ ...s.rutaCard, ...(rutaId === r.id ? s.rutaActiva : {}) }}>
                  <span style={{ fontSize:"1.8rem" }}>{r.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:"700", fontSize:"0.88rem", color:"#064e3b" }}>{r.label}</div>
                    <div style={{ fontSize:"0.76rem", color:"#6b7280", marginTop:"0.15rem" }}>{r.duracion}</div>
                    <div style={{ fontSize:"0.8rem", color:"#059669", fontWeight:"600", marginTop:"0.25rem" }}>Desde {formatPrecio(r.precio_persona)}/persona</div>
                  </div>
                  {rutaId === r.id && <div style={s.check}>✓</div>}
                </button>
              ))}
            </div>

            {rutaId && (
              <div style={{ marginTop:"1.5rem", animation:"fadeUp 0.3s ease" }}>
                <label style={s.label}>Tipo de reserva</label>
                <div style={s.grid2}>
                  {[
                    { id:"compartido", emoji:"👥", title:"Compartido", desc:`Se confirma con ${MIN_PASAJEROS_COMPARTIDO} pax`, precio: formatPrecio(ruta?.precio_persona)+"/persona" },
                    { id:"van_completa", emoji:"🚐", title:"Van Completa", desc:`Exclusivo hasta ${MAX_PASAJEROS_VAN} pax`, precio: formatPrecio(ruta?.precio_van)+" total" }
                  ].map((t) => (
                    <button key={t.id} onClick={() => setTipoReserva(t.id)}
                      style={{ ...s.tipoCard, ...(tipoReserva === t.id ? s.tipoActivo : {}) }}>
                      <span style={{ fontSize:"1.4rem" }}>{t.emoji}</span>
                      <div>
                        <div style={{ fontWeight:"700", fontSize:"0.88rem" }}>{t.title}</div>
                        <div style={{ fontSize:"0.76rem", color:"#6b7280" }}>{t.desc}</div>
                        <div style={{ fontSize:"0.8rem", color:"#059669", fontWeight:"600" }}>{t.precio}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rutaId && (
              <div style={{ marginTop:"1.25rem", animation:"fadeUp 0.3s ease" }}>
                <label style={s.label}>Fecha de viaje</label>
                <input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className="rv-input" style={s.input} />
              </div>
            )}

            <button className={rutaId && fecha ? "rv-btn" : ""} disabled={!rutaId || !fecha}
              style={{ ...s.btnPrimario, marginTop:"1.5rem", opacity: rutaId && fecha ? 1 : 0.45 }}
              onClick={() => setPaso(2)}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASO 2: Datos y pago ── */}
        {paso === 2 && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <button style={s.btnVolver} onClick={() => setPaso(1)}>← Volver</button>
            <h3 style={s.pasoTitulo}>Datos del pasajero</h3>

            {/* Resumen */}
            <div style={s.resumenBox}>
              {[
                ["Ruta", ruta?.label],
                ["Fecha", formatFecha(fecha)],
                ["Tipo", tipoReserva === "van_completa" ? "Van completa" : "Compartido"],
              ].map(([k, v]) => (
                <div key={k} style={s.resumenFila}><span>{k}</span><strong>{v}</strong></div>
              ))}
              <div style={{ ...s.resumenFila, borderTop:"1px solid #d1fae5", paddingTop:"0.75rem", marginTop:"0.25rem" }}>
                <span style={{ fontWeight:"700", fontSize:"1rem" }}>Total</span>
                <strong style={{ fontSize:"1.25rem", color:"#059669" }}>{formatPrecio(total)}</strong>
              </div>
            </div>

            <div style={s.grid2}>
              <div><label style={s.label}>Nombre completo *</label><input className="rv-input" style={s.input} placeholder="Juan Pérez" value={form.nombre} onChange={(e) => setForm({...form, nombre:e.target.value})} /></div>
              <div><label style={s.label}>Teléfono *</label><input className="rv-input" style={s.input} placeholder="+56 9 1234 5678" value={form.telefono} onChange={(e) => setForm({...form, telefono:e.target.value})} /></div>
            </div>
            <div style={{ marginTop:"1rem" }}><label style={s.label}>Email *</label><input className="rv-input" style={s.input} type="email" placeholder="juan@email.com" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} /></div>
            <div style={{ marginTop:"1rem" }}>
              <label style={s.label}>Confirmar email *</label>
              <input className="rv-input" style={{ ...s.input, borderColor: form.emailConfirm && form.email !== form.emailConfirm ? "#dc2626" : "" }}
                type="email" placeholder="Repite tu email" value={form.emailConfirm} onChange={(e) => setForm({...form, emailConfirm:e.target.value})} />
            </div>
            <div style={{ ...s.grid2, marginTop:"1rem" }}>
              <div><label style={s.label}>N° de pasajeros</label>
                <input className="rv-input" style={s.input} type="number" min="1"
                  max={tipoReserva === "van_completa" ? MAX_PASAJEROS_VAN : MIN_PASAJEROS_COMPARTIDO}
                  value={form.pasajeros} onChange={(e) => setForm({...form, pasajeros:e.target.value})} />
              </div>
              <div><label style={s.label}>Dirección de recogida</label>
                <input className="rv-input" style={s.input} placeholder="Hotel o dirección..." value={form.direccion} onChange={(e) => setForm({...form, direccion:e.target.value})} />
              </div>
            </div>
            <div style={{ marginTop:"1rem" }}><label style={s.label}>Notas adicionales</label>
              <textarea className="rv-input" style={{ ...s.input, height:"70px", resize:"vertical" }}
                placeholder="Equipaje especial, silla bebé, mascotas..." value={form.notas} onChange={(e) => setForm({...form, notas:e.target.value})} />
            </div>

            <label style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", marginTop:"1.25rem", cursor:"pointer" }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)}
                style={{ marginTop:"3px", accentColor:"#059669", width:"16px", height:"16px" }} />
              <span style={{ fontSize:"0.8rem", color:"#6b7280", lineHeight:"1.5" }}>
                Acepto los <span style={{ color:"#059669", textDecoration:"underline" }}>términos y condiciones</span>. El viaje compartido se confirma 24h antes si se completan {MIN_PASAJEROS_COMPARTIDO} pasajeros. Sin cargo si no se confirma.
              </span>
            </label>

            {error && <div style={s.error}>{error}</div>}

            <div style={s.metodoPago}>
              <span style={{ fontSize:"0.75rem", color:"#9ca3af" }}>Pago seguro con</span>
              {["💳 Crédito","💳 Débito","🏦 Transferencia","🔴 RedCompra"].map((c) => <span key={c} style={s.chipPago}>{c}</span>)}
            </div>

            <button className="rv-btn" style={{ ...s.btnPrimario, marginTop:"1rem", fontSize:"1.05rem" }} onClick={handlePagar} disabled={enviando}>
              {enviando ? "⏳ Procesando..." : `💳 Pagar ${formatPrecio(total)} con Flow`}
            </button>
            <p style={{ textAlign:"center", fontSize:"0.73rem", color:"#9ca3af", marginTop:"0.75rem" }}>🔒 Pago 100% seguro · Procesado por Flow.cl</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  section: { padding:"5rem 1rem", background:"linear-gradient(160deg,#f0fdf4 0%,#ecfdf5 40%,#d1fae5 100%)", fontFamily:"'DM Sans',sans-serif" },
  header: { textAlign:"center", maxWidth:"640px", margin:"0 auto 2.5rem" },
  badge: { display:"inline-block", fontSize:"0.7rem", fontWeight:"700", letterSpacing:"0.1em", color:"#059669", background:"#d1fae5", padding:"0.3rem 1rem", borderRadius:"99px", marginBottom:"1rem" },
  titulo: { fontSize:"clamp(1.8rem,4vw,2.8rem)", fontWeight:"800", color:"#064e3b", fontFamily:"'Playfair Display',serif", marginBottom:"0.5rem", lineHeight:"1.15" },
  subtitulo: { color:"#065f46", fontSize:"1rem", marginBottom:"1.75rem" },
  stepBar: { display:"flex", justifyContent:"center", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" },
  stepDot: { width:"2.1rem", height:"2.1rem", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.85rem", fontWeight:"700", transition:"all 0.3s" },
  card: { background:"white", borderRadius:"1.75rem", padding:"clamp(1.5rem,4vw,2.5rem)", maxWidth:"700px", margin:"0 auto", boxShadow:"0 25px 80px rgba(6,78,59,0.12),0 4px 16px rgba(0,0,0,0.04)" },
  pasoTitulo: { fontSize:"1.4rem", fontWeight:"800", color:"#064e3b", fontFamily:"'Playfair Display',serif", marginBottom:"1.25rem" },
  grid2: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:"0.85rem" },
  rutaCard: { display:"flex", gap:"0.85rem", alignItems:"flex-start", padding:"1.1rem", border:"2px solid #e5e7eb", borderRadius:"1rem", cursor:"pointer", background:"white", textAlign:"left", transition:"all 0.2s", position:"relative" },
  rutaActiva: { border:"2px solid #059669", background:"#f0fdf4" },
  check: { position:"absolute", top:"0.6rem", right:"0.6rem", width:"1.4rem", height:"1.4rem", background:"#059669", color:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:"700" },
  tipoCard: { display:"flex", gap:"0.75rem", alignItems:"flex-start", padding:"1rem", border:"2px solid #e5e7eb", borderRadius:"1rem", cursor:"pointer", background:"white", textAlign:"left", transition:"all 0.2s" },
  tipoActivo: { border:"2px solid #059669", background:"#f0fdf4" },
  label: { display:"block", fontSize:"0.82rem", fontWeight:"600", color:"#374151", marginBottom:"0.4rem" },
  input: { width:"100%", padding:"0.75rem 1rem", border:"1.5px solid #e5e7eb", borderRadius:"0.75rem", fontSize:"0.93rem", color:"#111827", background:"#fafafa", boxSizing:"border-box", transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" },
  btnPrimario: { width:"100%", padding:"1rem", background:"linear-gradient(135deg,#059669,#047857)", color:"white", border:"none", borderRadius:"0.875rem", fontSize:"1rem", fontWeight:"700", cursor:"pointer", transition:"all 0.2s" },
  btnVolver: { background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:"0.88rem", marginBottom:"1rem", padding:0 },
  resumenBox: { background:"#f0fdf4", borderRadius:"1rem", padding:"1.1rem 1.25rem", marginBottom:"1.25rem", border:"1px solid #d1fae5" },
  resumenFila: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.35rem 0", fontSize:"0.88rem", color:"#374151" },
  metodoPago: { display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap", padding:"0.75rem 0", marginTop:"1rem", borderTop:"1px solid #f3f4f6" },
  chipPago: { fontSize:"0.73rem", padding:"0.25rem 0.6rem", background:"#f3f4f6", borderRadius:"99px", color:"#374151", fontWeight:"500" },
  error: { padding:"0.875rem 1rem", background:"#fee2e2", borderRadius:"0.75rem", color:"#b91c1c", fontSize:"0.88rem", marginTop:"0.75rem" },
};