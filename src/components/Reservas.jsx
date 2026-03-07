import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Configuración ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pyloifgprupypgkhkqmx.supabase.co";
const SUPABASE_KEY = "sb_publishable_UN__-qAOLiEli5p9xY9ypQ_Qr9wxajL";
const WHATSAPP_NUMBER = "56951569704";
const MAX_ASIENTOS     = 12; // capacidad total de la van

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RUTAS = [
  { id: "pucon-aeropuerto",      label: "Pucón → Aeropuerto Temuco",      precio_persona: 15000, precio_van: 120000, emoji: "🏔️", duracion: "~1h 30min", km: "95 km" },
  { id: "aeropuerto-pucon",      label: "Aeropuerto Temuco → Pucón",      precio_persona: 15000, precio_van: 120000, emoji: "✈️", duracion: "~1h 30min", km: "95 km" },
  { id: "villarrica-aeropuerto", label: "Villarrica → Aeropuerto Temuco", precio_persona: 12000, precio_van: 100000, emoji: "🌋", duracion: "~1h 15min", km: "80 km" },
  { id: "aeropuerto-villarrica", label: "Aeropuerto Temuco → Villarrica", precio_persona: 12000, precio_van: 100000, emoji: "🏕️", duracion: "~1h 15min", km: "80 km" },
];

const TRUST_ITEMS = [
  { icon: "⭐", value: "4.9",    label: "Calificación" },
  { icon: "🚐", value: "+3.200", label: "Transfers" },
  { icon: "🔒", value: "100%",   label: "Seguro" },
  { icon: "📍", value: "Puntual",label: "Garantizado" },
];

const fmt    = (str) => { if (!str) return ""; const [y,m,d]=str.split("-"); return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); };
const precio = (n)   => `$${Math.round(n).toLocaleString("es-CL")}`;

export default function Reservas() {
  const [paso,        setPaso]        = useState(1);
  const [rutaId,      setRutaId]      = useState(null);
  const [fecha,       setFecha]       = useState("");
  const [tipoReserva, setTipoReserva] = useState("compartido");
  const [modoPago,    setModoPago]    = useState("abono");
  const [form,        setForm]        = useState({ nombre:"", email:"", telefono:"", pasajeros:1, direccion:"", notas:"" });
  const [enviando,    setEnviando]    = useState(false);
  const [cancelando,  setCancelando]  = useState(false);
  const [error,       setError]       = useState("");
  const [terms,       setTerms]       = useState(false);
  const [asientosOcupados, setAsientosOcupados] = useState(0);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);
  const [reservaId,   setReservaId]   = useState(null);
  const [confirmado,  setConfirmado]  = useState(false);

  const ruta            = RUTAS.find(r => r.id === rutaId);
  const asientosLibres  = Math.max(0, MAX_ASIENTOS - asientosOcupados);
  const porcentajeOcup  = Math.min(100, Math.round((asientosOcupados / MAX_ASIENTOS) * 100));
  const montoTotal      = !ruta ? 0 : tipoReserva === "van_completa" ? ruta.precio_van : ruta.precio_persona * Number(form.pasajeros);
  const abono           = montoTotal * 0.5;
  const aPagar          = tipoReserva === "van_completa" && modoPago === "abono" ? abono : montoTotal;
  const hoy             = new Date().toISOString().split("T")[0];

  // ─── Cargar asientos ocupados cuando se selecciona ruta + fecha ────────────
  useEffect(() => {
    if (!rutaId || !fecha || tipoReserva !== "compartido") return;
    const rutaLabel = RUTAS.find(r => r.id === rutaId)?.label;
    if (!rutaLabel) return;

    setCargandoAsientos(true);
    supabase
      .from("reservas")
      .select("pasajeros")
      .eq("ruta", rutaLabel)
      .eq("fecha", fecha)
      .eq("tipo_reserva", "compartido")
      .neq("estado", "cancelado")
      .then(({ data, error }) => {
        if (!error && data) {
          const total = data.reduce((acc, r) => acc + (r.pasajeros || 1), 0);
          setAsientosOcupados(total);
        }
        setCargandoAsientos(false);
      });
  }, [rutaId, fecha, tipoReserva]);

  // ─── Guardar reserva en Supabase ──────────────────────────────────────────
  const guardarReserva = async () => {
    if (!form.nombre || !form.telefono) { setError("Completa nombre y teléfono."); return null; }
    if (!terms) { setError("Debes aceptar los términos y condiciones."); return null; }
    setError(""); setEnviando(true);

    try {
      const { data, error: dbErr } = await supabase.from("reservas").insert([{
        nombre:       form.nombre,
        email:        form.email || null,
        telefono:     form.telefono,
        ruta:         ruta.label,
        fecha,
        vuelo_numero: "SIN_VUELO",
        pasajeros:    Number(form.pasajeros),
        tipo_reserva: tipoReserva,
        estado:       "pendiente_pago",
        notas:        [
          form.direccion ? `Recogida: ${form.direccion}` : "",
          form.notas || "",
          tipoReserva === "van_completa" ? `Pago: ${modoPago === "abono" ? "50% abono ("+precio(aPagar)+")" : "Completo ("+precio(montoTotal)+")"}` : "Reserva compartida - sin pago previo",
        ].filter(Boolean).join(" | "),
      }]).select().single();

      if (dbErr) throw new Error("Error al guardar reserva");
      setReservaId(data.id);
      setEnviando(false);
      return data.id;
    } catch (err) {
      setError(err.message || "Error al procesar. Intenta de nuevo.");
      setEnviando(false);
      return null;
    }
  };

  // ─── Cancelar reserva ─────────────────────────────────────────────────────
  const cancelarReserva = async () => {
    if (!reservaId) { setPaso(1); setConfirmado(false); setReservaId(null); return; }
    setCancelando(true);
    await supabase.from("reservas").update({ estado: "cancelado" }).eq("id", reservaId);
    setCancelando(false);
    // Reset
    setPaso(1); setRutaId(null); setFecha(""); setTipoReserva("compartido");
    setForm({ nombre:"", email:"", telefono:"", pasajeros:1, direccion:"", notas:"" });
    setTerms(false); setReservaId(null); setConfirmado(false); setError("");
  };

  // ─── Enviar WhatsApp confirmación compartido ───────────────────────────────
  const enviarWhatsApp = (id) => {
    const msg = encodeURIComponent(
      `🚐 *Reserva Compartida Confirmada - Araucanía Viajes*\n\n` +
      `✅ Tu reserva ha sido registrada exitosamente.\n\n` +
      `👤 *${form.nombre}*\n` +
      `📱 ${form.telefono}\n` +
      `${form.email ? `📧 ${form.email}\n` : ""}` +
      `🗺️ ${ruta.label}\n` +
      `📅 ${fmt(fecha)}\n` +
      `👥 ${form.pasajeros} pasajero(s)\n` +
      `${form.direccion ? `📍 Recogida: ${form.direccion}\n` : ""}` +
      `\n💰 Precio por persona: ${precio(ruta.precio_persona)}\n` +
      `💳 Total: ${precio(montoTotal)}\n\n` +
      `⏳ *Importante:* Una vez que se complete el cupo (${MAX_ASIENTOS} pasajeros), recibirás confirmación definitiva del viaje y deberás realizar el pago.\n\n` +
      `❌ Si deseas cancelar tu reserva, escríbenos a este número.\n\n` +
      `🆔 ID reserva: ${id}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const handleConfirmarCompartido = async () => {
    const id = await guardarReserva();
    if (id) {
      setConfirmado(true);
      enviarWhatsApp(id);
    }
  };

  const handlePagarVan = async () => {
    const id = await guardarReserva();
    if (id) {
      window.open("https://www.flow.cl/btn.php?token=o6f0a50ad75e315233752a57fb02bdba9453e509", "_blank");
    }
  };

  // ─── Pantalla de confirmación exitosa ─────────────────────────────────────
  if (confirmado) {
    return (
      <section id="reservas" style={s.section}>
        <style>{css}</style>
        <div style={s.wrap}>
          <div style={{ ...s.card, textAlign:"center", padding:"3rem 2rem" }}>
            <div className="fade-up" style={{ fontSize:"4rem", marginBottom:"1rem" }}>🎉</div>
            <h2 className="fade-up" style={{ ...s.titulo, fontSize:"1.8rem", marginBottom:"0.5rem" }}>
              ¡Reserva registrada!
            </h2>
            <p className="fade-up" style={{ color:"#6b7c6b", fontSize:"0.9rem", maxWidth:"420px", margin:"0 auto 1.5rem", lineHeight:1.6 }}>
              Tu lugar está apartado. Una vez que se complete el cupo de <strong>{MAX_ASIENTOS} pasajeros</strong>, te confirmamos el viaje y coordinas el pago.
            </p>

            <div className="fade-up" style={{ background:"#f0f9f4", border:"1.5px solid #c8ddd0", borderRadius:"1rem", padding:"1.25rem", maxWidth:"360px", margin:"0 auto 1.5rem", textAlign:"left" }}>
              {[
                ["Ruta",      `${ruta?.emoji} ${ruta?.label}`],
                ["Fecha",     fmt(fecha)],
                ["Pasajeros", `${form.pasajeros} pax`],
                ["Total",     precio(montoTotal)],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"0.35rem 0", borderBottom:"1px solid #e0ede5", fontSize:"0.82rem" }}>
                  <span style={{ color:"#6b7c6b" }}>{k}</span>
                  <span style={{ color:"#162112", fontWeight:"600" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="fade-up" style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:"0.85rem", padding:"1rem 1.25rem", maxWidth:"360px", margin:"0 auto 2rem", fontSize:"0.78rem", color:"#7c5c00", lineHeight:1.6, textAlign:"left" }}>
              📲 <strong>Revisa tu WhatsApp</strong> — te enviamos la confirmación con todos los detalles de tu reserva.
            </div>

            <div className="fade-up" style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
              <button
                className="gbtn"
                onClick={() => enviarWhatsApp(reservaId)}
                style={{ ...s.btn, maxWidth:"220px", background:"linear-gradient(135deg,#25D366,#128C7E)" }}
              >
                📲 Abrir WhatsApp
              </button>
              <button
                onClick={cancelarReserva}
                disabled={cancelando}
                style={{ padding:"0.75rem 1.25rem", border:"1.5px solid #fca5a5", borderRadius:"0.75rem", background:"#fff5f5", color:"#dc2626", fontSize:"0.82rem", fontWeight:"600", cursor:"pointer" }}
              >
                {cancelando ? "Cancelando..." : "❌ Cancelar reserva"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reservas" style={s.section}>
      <style>{css}</style>
      <div style={s.wrap}>

        {/* ─── HEADER ─── */}
        <div style={s.hdr}>
          <div style={s.eyebrow}><span style={s.dot}/> ARAUCANÍA VIAJES · TRANSFER OFICIAL</div>
          <h2 style={s.titulo}>Reserva tu <em style={{ fontStyle:"italic", color:"#1a5c38" }}>Transfer</em></h2>
          <p style={s.sub}>Pucón · Villarrica · Aeropuerto Temuco ZCO</p>

          <div style={s.trustBar}>
            {TRUST_ITEMS.map(t => (
              <div key={t.label} style={s.trustItem}>
                <span style={{ fontSize:"1.35rem" }}>{t.icon}</span>
                <div>
                  <div style={s.trustVal}>{t.value}</div>
                  <div style={s.trustLbl}>{t.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"0.7rem" }}>
            {["Ruta & Fecha","Datos & Resumen"].map((lbl,i) => (
              <React.Fragment key={i}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <div style={{
                    width:"1.9rem", height:"1.9rem", borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"0.8rem", fontWeight:"700", transition:"all .3s",
                    background: paso>i+1?"#1a5c38":paso===i+1?"#1a5c38":"#e2ddd5",
                    color:      paso>=i+1?"#fff":"#9aab9a",
                    boxShadow:  paso===i+1?"0 0 0 4px rgba(26,92,56,.14)":"none",
                    transform:  paso===i+1?"scale(1.08)":"scale(1)",
                  }}>{paso>i+1?"✓":i+1}</div>
                  <span style={{ fontSize:"0.76rem", fontWeight:paso===i+1?"600":"400", color:paso===i+1?"#1a5c38":"#9aab9a", transition:"color .3s" }}>{lbl}</span>
                </div>
                {i<1 && <div style={{ width:"2.5rem", height:"1px", background:paso>1?"#1a5c38":"#e2ddd5", transition:"background .4s" }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ─── CARD ─── */}
        <div style={s.card}>

          {/* ══ PASO 1: RUTA, TIPO Y FECHA ══ */}
          {paso === 1 && (
            <div className="fade-up">
              <Tag>PASO 1 DE 2</Tag>
              <h3 style={s.h3}>¿Cuál es tu ruta?</h3>

              <div className="g2" style={s.g2}>
                {RUTAS.map(r => (
                  <button key={r.id} className={`rcard${rutaId===r.id?" on":""}`}
                    onClick={() => setRutaId(r.id)} style={s.rutaCard}>
                    <span style={{ fontSize:"1.75rem", lineHeight:1 }}>{r.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"0.85rem", fontWeight:"600", color:"#162112", lineHeight:1.35 }}>{r.label}</div>
                      <div style={{ display:"flex", gap:"0.45rem", marginTop:"0.38rem" }}>
                        <span style={s.chip}>🕐 {r.duracion}</span>
                        <span style={s.chip}>📏 {r.km}</span>
                      </div>
                      <div style={{ fontSize:"0.82rem", color:"#1a5c38", fontWeight:"700", marginTop:"0.38rem" }}>
                        Desde {precio(r.precio_persona)}/pax
                      </div>
                    </div>
                    <div style={{ ...s.radio, ...(rutaId===r.id?{borderColor:"#1a5c38"}:{}) }}>
                      {rutaId===r.id && <div style={s.radioDot}/>}
                    </div>
                  </button>
                ))}
              </div>

              {rutaId && (<>
                {/* Tipo de servicio */}
                <div style={{ marginTop:"1.75rem" }} className="fade-up">
                  <Tag>TIPO DE SERVICIO</Tag>
                  <div className="g2" style={{ ...s.g2, gridTemplateColumns:"1fr 1fr", marginTop:"0.6rem" }}>

                    {/* Compartido */}
                    <button className={`gchip${tipoReserva==="compartido"?" on-green":""}`}
                      onClick={() => setTipoReserva("compartido")} style={s.gCard}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                        <span style={{ fontSize:"1.45rem" }}>👥</span>
                        <span style={s.badge_green}>ECONÓMICO</span>
                      </div>
                      <div style={{ fontWeight:"700", fontSize:"0.88rem", color:"#162112" }}>Compartido</div>
                      <div style={{ fontSize:"0.72rem", color:"#8a9a8a", marginTop:"0.2rem", lineHeight:1.4 }}>Se confirma al completar el cupo</div>
                      <div style={{ fontSize:"0.84rem", color:"#1a5c38", fontWeight:"700", marginTop:"0.52rem" }}>{precio(ruta?.precio_persona)}/persona</div>
                      <div style={{ marginTop:"0.75rem", padding:"0.45rem 0", borderRadius:"0.6rem", background:"#1a5c38", color:"#fff", fontSize:"0.72rem", fontWeight:"700", textAlign:"center" }}>
                        🎉 Reserva sin pago previo
                      </div>
                    </button>

                    {/* Van Completa */}
                    <button className={`gchip${tipoReserva==="van_completa"?" on-green":""}`}
                      onClick={() => { setTipoReserva("van_completa"); setModoPago("abono"); }} style={s.gCard}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                        <span style={{ fontSize:"1.45rem" }}>🚐</span>
                        <span style={s.badge_gold}>EXCLUSIVO</span>
                      </div>
                      <div style={{ fontWeight:"700", fontSize:"0.88rem", color:"#162112" }}>Van Completa</div>
                      <div style={{ fontSize:"0.72rem", color:"#8a9a8a", marginTop:"0.2rem", lineHeight:1.4 }}>Solo para tu grupo, hasta 12 personas</div>
                      <div style={{ fontSize:"0.84rem", color:"#1a5c38", fontWeight:"700", marginTop:"0.52rem" }}>{precio(ruta?.precio_van)} total</div>
                      <div style={{ marginTop:"0.75rem", padding:"0.45rem 0", borderRadius:"0.6rem", background:"linear-gradient(135deg,#a07c18,#c9a227)", color:"#fff", fontSize:"0.72rem", fontWeight:"700", textAlign:"center" }}>
                        🤝 Reserva con 50%
                      </div>
                    </button>
                  </div>
                </div>

                {/* Fecha */}
                <div style={{ marginTop:"1.4rem" }} className="fade-up">
                  <label style={s.lbl}>Fecha de viaje</label>
                  <input type="date" min={hoy} value={fecha} onChange={e=>setFecha(e.target.value)} className="gin" style={s.inp}/>
                  {fecha && <p style={{ fontSize:"0.75rem", color:"#1a5c38", marginTop:"0.38rem" }}>📅 {fmt(fecha)}</p>}
                </div>

                {/* Indicador asientos disponibles (solo compartido) */}
                {tipoReserva === "compartido" && fecha && (
                  <div className="fade-up" style={{ marginTop:"1.2rem" }}>
                    <AsientosIndicador
                      ocupados={asientosOcupados}
                      total={MAX_ASIENTOS}
                      libres={asientosLibres}
                      porcentaje={porcentajeOcup}
                      cargando={cargandoAsientos}
                    />
                  </div>
                )}
              </>)}

              <button className="gbtn" disabled={!rutaId||!fecha}
                style={{ ...s.btn, marginTop:"2rem", opacity:rutaId&&fecha?1:0.4 }}
                onClick={() => setPaso(2)}>
                Continuar con mis datos →
              </button>
              <div style={s.garantia}>🛡️ Sin cargo si el viaje compartido no se confirma</div>
            </div>
          )}

          {/* ══ PASO 2: DATOS + RESUMEN ══ */}
          {paso === 2 && (
            <div className="fade-up">
              <button style={s.btnVolver} onClick={() => setPaso(1)}>← Volver</button>

              {/* ── 1. DATOS DE CONTACTO ── */}
              <div style={{ marginBottom:"1.75rem" }}>
                <Tag>DATOS DE CONTACTO</Tag>
                <div className="g2" style={{ ...s.g2, marginTop:"0.65rem" }}>
                  <div>
                    <label style={s.lbl}>Nombre completo *</label>
                    <input className="gin" style={s.inp} placeholder="Juan Pérez"
                      value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/>
                  </div>
                  <div>
                    <label style={s.lbl}>Teléfono WhatsApp *</label>
                    <input className="gin" style={s.inp} placeholder="+56 9 1234 5678"
                      value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/>
                  </div>
                </div>
                <div style={{ marginTop:"1rem" }}>
                  <label style={s.lbl}>Correo electrónico</label>
                  <input className="gin" style={s.inp} placeholder="tucorreo@gmail.com" type="email"
                    value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
                </div>
              </div>

              {/* ── 2. DATOS DEL PASAJERO ── */}
              <div style={{ marginBottom:"1.75rem" }}>
                <Tag>DATOS DEL PASAJERO</Tag>
                <div className="g2" style={{ ...s.g2, marginTop:"0.65rem" }}>
                  <div>
                    <label style={s.lbl}>N° de pasajeros</label>
                    <input className="gin" style={s.inp} type="number" min="1" max={MAX_ASIENTOS}
                      value={form.pasajeros} onChange={e=>setForm({...form,pasajeros:e.target.value})}/>
                  </div>
                  <div>
                    <label style={s.lbl}>Dirección de recogida</label>
                    <input className="gin" style={s.inp} placeholder="Hotel o dirección..."
                      value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/>
                  </div>
                </div>
                <div style={{ marginTop:"1rem" }}>
                  <label style={s.lbl}>Notas (opcional)</label>
                  <textarea className="gin" style={{ ...s.inp, height:"68px", resize:"vertical" }}
                    placeholder="Equipaje especial, silla bebé, mascotas..."
                    value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})}/>
                </div>
              </div>

              {/* ── 3. INDICADOR ASIENTOS (solo compartido) ── */}
              {tipoReserva === "compartido" && (
                <div style={{ marginBottom:"1.75rem" }}>
                  <Tag>DISPONIBILIDAD DEL VIAJE</Tag>
                  <div style={{ marginTop:"0.65rem" }}>
                    <AsientosIndicador
                      ocupados={asientosOcupados}
                      total={MAX_ASIENTOS}
                      libres={asientosLibres}
                      porcentaje={porcentajeOcup}
                      cargando={cargandoAsientos}
                    />
                  </div>
                </div>
              )}

              {/* ── 4. MODO DE PAGO (solo van completa) ── */}
              {tipoReserva === "van_completa" && (
                <div style={{ marginBottom:"1.75rem" }}>
                  <Tag>¿CÓMO QUIERES PAGAR?</Tag>
                  <div className="g2" style={{ ...s.g2, gridTemplateColumns:"1fr 1fr", marginTop:"0.65rem" }}>
                    <div className={`gchip${modoPago==="total"?" on-green":""}`}
                      style={s.pagoCard} onClick={() => setModoPago("total")}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                        <span style={{ fontSize:"1.4rem" }}>💳</span>
                        {modoPago==="total" && <span style={s.badge_green}>ELEGIDO</span>}
                      </div>
                      <div style={{ fontWeight:"700", fontSize:"0.88rem", color:"#162112" }}>Pago completo</div>
                      <div style={{ fontSize:"0.71rem", color:"#8a9a8a", marginTop:"0.2rem", lineHeight:1.4 }}>Reserva confirmada al instante</div>
                      <div style={{ fontSize:"1.05rem", fontWeight:"700", color:"#1a5c38", marginTop:"0.58rem" }}>{precio(montoTotal)}</div>
                    </div>
                    <div className={`gchip${modoPago==="abono"?" on-gold":""}`}
                      style={s.pagoCard} onClick={() => setModoPago("abono")}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                        <span style={{ fontSize:"1.4rem" }}>🤝</span>
                        <span style={s.badge_gold}>POPULAR</span>
                      </div>
                      <div style={{ fontWeight:"700", fontSize:"0.88rem", color:"#162112" }}>50% de abono</div>
                      <div style={{ fontSize:"0.71rem", color:"#8a9a8a", marginTop:"0.2rem", lineHeight:1.4 }}>Resto al momento del viaje</div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:"0.4rem", marginTop:"0.58rem" }}>
                        <span style={{ fontSize:"1.05rem", fontWeight:"700", color:"#a07c18" }}>{precio(abono)}</span>
                        <span style={{ fontSize:"0.68rem", color:"#c0c8c0", textDecoration:"line-through" }}>{precio(montoTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. RESUMEN FINAL ── */}
              <div style={{ marginBottom:"1.75rem" }}>
                <Tag>RESUMEN DE TU RESERVA</Tag>
                <div style={{ ...s.resBox, marginTop:"0.65rem" }}>
                  <div style={s.resHead}>
                    <span style={{ fontSize:"0.62rem", fontWeight:"700", letterSpacing:"0.1em", color:"#fff" }}>DETALLE DEL VIAJE</span>
                    <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.65)" }}>{ruta?.emoji} {ruta?.label}</span>
                  </div>
                  <div style={s.resBody}>
                    {[
                      ["Fecha",    fmt(fecha)],
                      ["Servicio", tipoReserva==="van_completa"?"🚐 Van Completa":"👥 Compartido"],
                      ["Pasajeros",`${form.pasajeros} pax`],
                      ...(form.direccion ? [["Recogida", form.direccion]] : []),
                    ].map(([k,v]) => (
                      <div key={k} style={s.resFila}>
                        <span style={s.resK}>{k}</span>
                        <span style={s.resV}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={s.resTotalRow}>
                    <span style={{ fontSize:"0.82rem", fontWeight:"600", color:"#4a5e4a" }}>
                      {tipoReserva === "compartido" ? "Precio total" : `A pagar ahora (${modoPago==="abono"?"50% abono":"completo"})`}
                    </span>
                    <span style={{ fontSize:"1.55rem", fontWeight:"700", color:"#162112", fontFamily:"'Cormorant Garant',serif" }}>
                      {tipoReserva === "compartido" ? precio(montoTotal) : precio(aPagar)}
                    </span>
                  </div>

                  {/* Aviso compartido */}
                  {tipoReserva === "compartido" && (
                    <div style={{ padding:"0.85rem 1.2rem", background:"#fffbeb", borderTop:"1px solid #fde68a" }}>
                      <p style={{ fontSize:"0.75rem", color:"#92400e", lineHeight:1.6, margin:0 }}>
                        ⏳ <strong>¿Cómo funciona?</strong> Tu reserva queda registrada sin costo.
                        Una vez completado el cupo de <strong>{MAX_ASIENTOS} asientos</strong>, te contactamos para confirmar el viaje y coordinar el pago.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"0.7rem", marginTop:"0.5rem", cursor:"pointer" }}>
                <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}
                  style={{ accentColor:"#1a5c38", width:"16px", height:"16px", flexShrink:0, marginTop:"2px" }}/>
                <span style={{ fontSize:"0.75rem", color:"#6b7c6b", lineHeight:1.55 }}>
                  Acepto los <span style={{ color:"#1a5c38", textDecoration:"underline" }}>términos y condiciones</span>.
                  {tipoReserva === "compartido"
                    ? " El viaje compartido se confirma al completar el cupo. Sin cobro si no se completa."
                    : ` El saldo restante se abona al momento del viaje.`}
                </span>
              </label>

              {error && (
                <div style={s.errBox}><span>⚠️</span> {error}</div>
              )}

              {/* ── BOTONES DE ACCIÓN ── */}
              <div style={{ marginTop:"1.5rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>

                {/* COMPARTIDO → botón confirmar reserva (sin pago) */}
                {tipoReserva === "compartido" && (
                  <button
                    className="gbtn"
                    disabled={enviando || !form.nombre || !form.telefono || !terms}
                    style={{ ...s.btn, opacity:form.nombre&&form.telefono&&terms?1:0.4 }}
                    onClick={handleConfirmarCompartido}
                  >
                    {enviando ? "⏳ Guardando reserva..." : "✅ Confirmar reserva — Sin pago ahora"}
                  </button>
                )}

                {/* VAN COMPLETA → botón pagar con Flow */}
                {tipoReserva === "van_completa" && (
                  <button
                    className="flow-btn"
                    disabled={enviando || !form.nombre || !form.telefono || !terms}
                    onClick={handlePagarVan}
                  >
                    {enviando ? (
                      <span>⏳ Procesando...</span>
                    ) : (
                      <>
                        <svg width="52" height="22" viewBox="0 0 120 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
                          <path d="M0 23C0 10.297 10.297 0 23 0h74c12.703 0 23 10.297 23 23s-10.297 23-23 23H23C10.297 46 0 35.703 0 23z" fill="white" fillOpacity="0.15"/>
                          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Arial,sans-serif" letterSpacing="-0.5">flow</text>
                        </svg>
                        <div style={{ width:"1px", height:"28px", background:"rgba(255,255,255,0.25)" }}/>
                        <div style={{ textAlign:"left" }}>
                          <div style={{ fontSize:"0.7rem", opacity:0.75, lineHeight:1.1 }}>Pagar ahora</div>
                          <div style={{ fontSize:"1rem", fontWeight:"800", lineHeight:1.2 }}>{precio(aPagar)}</div>
                        </div>
                        {modoPago==="abono" && (
                          <span style={{ marginLeft:"auto", fontSize:"0.63rem", background:"rgba(255,255,255,0.18)", padding:"0.18rem 0.55rem", borderRadius:"99px", fontWeight:"700" }}>50% abono</span>
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Botón cancelar */}
                <button
                  onClick={() => { setPaso(1); setError(""); }}
                  style={{ width:"100%", padding:"0.75rem", border:"1.5px solid #e5dfd4", borderRadius:"0.75rem", background:"transparent", color:"#9aab9a", fontSize:"0.82rem", fontWeight:"600", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
                >
                  ← Cancelar y volver al inicio
                </button>
              </div>

              <p style={{ textAlign:"center", fontSize:"0.67rem", color:"#9aab9a", marginTop:"0.85rem" }}>
                🔒 Tus datos están protegidos · Araucanía Viajes
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"0.7rem", color:"#9aab9a", marginTop:"2rem", letterSpacing:"0.03em" }}>
          🌿 Araucanía Viajes · +3.200 transfers realizados en la región desde Temuco
        </p>
      </div>
    </section>
  );
}

// ─── Componente indicador de asientos ────────────────────────────────────────
function AsientosIndicador({ ocupados, total, libres, porcentaje, cargando }) {
  const urgente = libres <= 3;
  const mitad   = libres <= 6;

  return (
    <div style={{
      border: `1.5px solid ${urgente ? "#fca5a5" : mitad ? "#fde68a" : "#c8ddd0"}`,
      borderRadius:"1rem", overflow:"hidden",
      background: urgente ? "#fff5f5" : mitad ? "#fffbeb" : "#f0f9f4",
    }}>
      <div style={{ padding:"1rem 1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.6rem" }}>
          <span style={{ fontSize:"0.78rem", fontWeight:"700", color:"#162112" }}>
            🪑 Asientos disponibles
          </span>
          {cargando ? (
            <span style={{ fontSize:"0.7rem", color:"#9aab9a" }}>Consultando...</span>
          ) : (
            <span style={{
              fontSize:"0.72rem", fontWeight:"700", padding:"0.15rem 0.6rem",
              borderRadius:"99px",
              background: urgente ? "rgba(220,38,38,.1)" : mitad ? "rgba(161,98,7,.1)" : "rgba(26,92,56,.1)",
              color:      urgente ? "#dc2626"           : mitad ? "#a16207"           : "#1a5c38",
            }}>
              {urgente ? "⚠️ ¡Últimos lugares!" : mitad ? "🔥 Quedan pocos" : "✅ Disponible"}
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        <div style={{ height:"10px", borderRadius:"99px", background:"#e5e7eb", overflow:"hidden", marginBottom:"0.55rem" }}>
          <div style={{
            height:"100%", borderRadius:"99px",
            width: cargando ? "0%" : `${porcentaje}%`,
            background: urgente
              ? "linear-gradient(90deg,#ef4444,#dc2626)"
              : mitad
              ? "linear-gradient(90deg,#f59e0b,#d97706)"
              : "linear-gradient(90deg,#22c55e,#16a34a)",
            transition:"width 0.8s cubic-bezier(.4,0,.2,1)",
          }}/>
        </div>

        {/* Asientos visuales */}
        {!cargando && (
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"0.6rem" }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width:"18px", height:"18px", borderRadius:"4px",
                background: i < ocupados ? "#6b7280" : "#22c55e",
                transition:"background .3s",
                fontSize:"9px", display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {i < ocupados ? "🧍" : ""}
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem" }}>
          <span style={{ color:"#6b7280" }}>
            {cargando ? "..." : `${ocupados} reservados`}
          </span>
          <span style={{ fontWeight:"700", color: urgente ? "#dc2626" : "#1a5c38" }}>
            {cargando ? "..." : `${libres} de ${total} disponibles`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tag helper ──────────────────────────────────────────────────────────────
const Tag = ({ children }) => (
  <span style={{
    display:"inline-block", fontSize:"0.6rem", fontWeight:"700", letterSpacing:"0.12em",
    color:"#1a5c38", background:"rgba(26,92,56,.07)", borderRadius:"99px",
    padding:"0.2rem 0.7rem", marginBottom:"0.7rem",
  }}>
    {children}
  </span>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
  * { box-sizing:border-box; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes wa-pulse { 0%{box-shadow:0 0 0 0 rgba(37,211,102,.35)} 70%{box-shadow:0 0 0 9px rgba(37,211,102,0)} 100%{box-shadow:0 0 0 0 rgba(37,211,102,0)} }

  .fade-up { animation:fadeUp .4s cubic-bezier(.4,0,.2,1) both; }

  .rcard { transition:all .22s cubic-bezier(.4,0,.2,1); }
  .rcard:hover { transform:translateY(-2px); border-color:#1a5c38!important; box-shadow:0 6px 18px rgba(26,92,56,.12); }
  .rcard.on { border-color:#1a5c38!important; background:#f0f9f4!important; box-shadow:0 0 0 3px rgba(26,92,56,.1); }

  .gchip { transition:all .2s; }
  .gchip:hover { border-color:#1a5c38!important; }
  .gchip.on-green { border-color:#1a5c38!important; background:#f0f9f4!important; box-shadow:0 0 0 3px rgba(26,92,56,.09); }
  .gchip.on-gold  { border-color:#a07c18!important; background:#fdf8ec!important; box-shadow:0 0 0 3px rgba(160,124,24,.1); }

  .gbtn { background:linear-gradient(135deg,#1a5c38 0%,#0f3d25 50%,#1a5c38 100%); background-size:200% auto; transition:all .3s; font-family:'Outfit',sans-serif; }
  .gbtn:hover:not(:disabled) { background-position:right center; transform:translateY(-2px); box-shadow:0 14px 38px rgba(26,92,56,.3); }
  .gbtn:disabled { opacity:.35; cursor:not-allowed; }

  .gin { background:#fff!important; border:1.5px solid #ddd8ce!important; color:#162112!important; font-family:'Outfit',sans-serif; transition:all .2s; }
  .gin::placeholder { color:#c0c8c0!important; }
  .gin:focus { border-color:#1a5c38!important; outline:none; box-shadow:0 0 0 3px rgba(26,92,56,.08); }

  .flow-btn {
    width:100%; display:flex; align-items:center; gap:1rem;
    padding:0.9rem 1.4rem;
    background: linear-gradient(135deg, #e8321e 0%, #c0240e 50%, #e8321e 100%);
    background-size: 200% auto;
    border:none; border-radius:0.85rem; cursor:pointer;
    color:#fff; font-family:'Outfit',sans-serif;
    transition: all 0.3s;
    box-shadow: 0 4px 18px rgba(232,50,30,0.3);
  }
  .flow-btn:hover:not(:disabled) { background-position:right center; transform:translateY(-2px); box-shadow:0 10px 32px rgba(232,50,30,0.4); }
  .flow-btn:disabled { opacity:0.4; cursor:not-allowed; }
  input[type=number]::-webkit-inner-spin-button { opacity:.4; }

  @media(max-width:580px){ .g2 { grid-template-columns:1fr!important; } }
`;

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  section: {
    position:"relative", padding:"5rem 1rem 4rem",
    background:"linear-gradient(155deg,#f7f3ec 0%,#eef5ef 55%,#f4f0e8 100%)",
    fontFamily:"'Outfit',sans-serif", overflow:"hidden",
  },
  wrap: { position:"relative", maxWidth:"780px", margin:"0 auto" },
  hdr:  { textAlign:"center", marginBottom:"2.5rem" },
  eyebrow: {
    display:"inline-flex", alignItems:"center", gap:"0.45rem",
    fontSize:"0.63rem", fontWeight:"700", letterSpacing:"0.12em",
    color:"#1a5c38", background:"rgba(26,92,56,.07)",
    border:"1px solid rgba(26,92,56,.15)", padding:"0.3rem 0.95rem",
    borderRadius:"99px", marginBottom:"1rem",
  },
  dot: { display:"inline-block", width:"5px", height:"5px", borderRadius:"50%", background:"#1a5c38", boxShadow:"0 0 5px rgba(26,92,56,.5)" },
  titulo: {
    fontSize:"clamp(1.85rem,5vw,2.9rem)", fontWeight:"700",
    color:"#162112", fontFamily:"'Cormorant Garant',serif",
    marginBottom:"0.4rem", lineHeight:"1.15", letterSpacing:"-0.01em",
  },
  sub: { color:"#6b7c6b", fontSize:"0.92rem", marginBottom:"1.7rem", letterSpacing:"0.04em" },
  trustBar: {
    display:"flex", justifyContent:"center", gap:"1.25rem", flexWrap:"wrap",
    marginBottom:"2rem", padding:"1rem 1.4rem",
    background:"#fff", border:"1px solid #e5dfd4", borderRadius:"1rem",
    boxShadow:"0 2px 10px rgba(22,33,18,.05)",
  },
  trustItem: { display:"flex", alignItems:"center", gap:"0.5rem" },
  trustVal:  { fontWeight:"700", fontSize:"0.95rem", color:"#162112", lineHeight:"1.1" },
  trustLbl:  { fontSize:"0.66rem", color:"#8a9a8a", letterSpacing:"0.03em" },
  card: {
    background:"#ffffff", border:"1px solid #e2dcd2", borderRadius:"2rem",
    padding:"clamp(1.5rem,5vw,2.75rem)",
    boxShadow:"0 1px 0 rgba(255,255,255,.9) inset,0 4px 6px rgba(22,33,18,.03),0 12px 40px rgba(22,33,18,.07),0 40px 80px rgba(22,33,18,.04)",
  },
  h3: { fontSize:"1.45rem", fontWeight:"700", color:"#162112", fontFamily:"'Cormorant Garant',serif", marginBottom:"1.2rem", lineHeight:"1.2" },
  g2: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:"0.78rem" },
  rutaCard: {
    display:"flex", gap:"0.78rem", alignItems:"flex-start",
    padding:"1.05rem", border:"1.5px solid #e2dcd2", borderRadius:"1.1rem",
    cursor:"pointer", background:"#faf7f2", textAlign:"left", color:"inherit", width:"100%",
  },
  chip: { fontSize:"0.67rem", color:"#8a9a8a", background:"#ede9e0", padding:"0.12rem 0.48rem", borderRadius:"99px" },
  radio: { width:"17px", height:"17px", borderRadius:"50%", border:"2px solid #cec8be", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"2px", transition:"border .2s" },
  radioDot: { width:"7px", height:"7px", borderRadius:"50%", background:"#1a5c38" },
  gCard: { padding:"1.05rem", border:"1.5px solid #e2dcd2", borderRadius:"1.1rem", cursor:"pointer", background:"#faf7f2", textAlign:"left", color:"inherit", width:"100%" },
  pagoCard: { padding:"1.05rem", border:"2px solid #e2dcd2", borderRadius:"1.1rem", background:"#faf7f2", textAlign:"left", color:"inherit", width:"100%", cursor:"pointer" },
  lbl: { display:"block", fontSize:"0.74rem", fontWeight:"600", color:"#4a5e4a", marginBottom:"0.38rem", letterSpacing:"0.03em" },
  inp: { width:"100%", padding:"0.76rem 0.95rem", borderRadius:"0.72rem", fontSize:"0.91rem", boxSizing:"border-box", fontFamily:"'Outfit',sans-serif" },
  resBox: { border:"1.5px solid #c8ddd0", borderRadius:"1.25rem", overflow:"hidden" },
  resHead: { background:"linear-gradient(135deg,#1a5c38,#0f3d25)", padding:"0.72rem 1.2rem", display:"flex", alignItems:"center", justifyContent:"space-between" },
  resBody: { padding:"0.9rem 1.2rem 0.7rem", display:"flex", flexDirection:"column", gap:"0.38rem" },
  resFila: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" },
  resK: { fontSize:"0.76rem", color:"#6b7c6b", flexShrink:0 },
  resV: { fontSize:"0.78rem", color:"#162112", fontWeight:"500", textAlign:"right" },
  resTotalRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.8rem 1.2rem", background:"#f0f9f4", borderTop:"1.5px solid #c8ddd0" },
  btn: { width:"100%", padding:"0.95rem 1.4rem", color:"#fff", border:"none", borderRadius:"0.85rem", fontSize:"0.95rem", fontWeight:"700", cursor:"pointer", letterSpacing:"0.015em" },
  btnVolver: { background:"none", border:"none", color:"#9aab9a", cursor:"pointer", fontSize:"0.82rem", marginBottom:"1.2rem", padding:0, fontFamily:"'Outfit',sans-serif" },
  garantia: { textAlign:"center", fontSize:"0.72rem", color:"#8a9a8a", marginTop:"0.85rem", padding:"0.5rem 0.7rem", background:"#f5f1ea", borderRadius:"0.55rem", border:"1px solid #e5dfd4" },
  errBox: { padding:"0.82rem 0.95rem", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"0.72rem", color:"#dc2626", fontSize:"0.83rem", marginTop:"0.95rem", display:"flex", gap:"0.5rem", alignItems:"center" },
  badge_green: { fontSize:"0.57rem", fontWeight:"700", letterSpacing:"0.08em", padding:"0.18rem 0.48rem", borderRadius:"99px", background:"rgba(26,92,56,.1)", color:"#1a5c38" },
  badge_gold:  { fontSize:"0.57rem", fontWeight:"700", letterSpacing:"0.08em", padding:"0.18rem 0.48rem", borderRadius:"99px", background:"rgba(160,124,24,.1)", color:"#a07c18" },
};