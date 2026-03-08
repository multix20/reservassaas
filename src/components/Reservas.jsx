import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL    = "https://pyloifgprupypgkhkqmx.supabase.co";
const SUPABASE_KEY    = "sb_publishable_UN__-qAOLiEli5p9xY9ypQ_Qr9wxajL";
const WHATSAPP_NUMBER = "56951569704";
const MAX_ASIENTOS    = 12;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORIGENES = [
  { id: "pucon",      label: "🏔️ Pucón" },
  { id: "villarrica", label: "🌋 Villarrica" },
  { id: "aeropuerto", label: "✈️ Aeropuerto Temuco ZCO" },
];

const DESTINOS_POR_ORIGEN = {
  pucon:      [{ id: "aeropuerto", label: "✈️ Aeropuerto Temuco ZCO" }],
  villarrica: [{ id: "aeropuerto", label: "✈️ Aeropuerto Temuco ZCO" }],
  aeropuerto: [
    { id: "pucon",      label: "🏔️ Pucón" },
    { id: "villarrica", label: "🌋 Villarrica" },
  ],
};

const PRECIOS = {
  "pucon-aeropuerto":      { persona: 15000, van: 120000, km: "95 km",  duracion: "~1h 30min" },
  "villarrica-aeropuerto": { persona: 12000, van: 100000, km: "80 km",  duracion: "~1h 15min" },
  "aeropuerto-pucon":      { persona: 15000, van: 120000, km: "95 km",  duracion: "~1h 30min" },
  "aeropuerto-villarrica": { persona: 12000, van: 100000, km: "80 km",  duracion: "~1h 15min" },
};

const PASOS = ["Ubicación", "Tus datos", "Pago"];

const fmt    = (str) => { if (!str) return ""; const [y,m,d]=str.split("-"); return new Date(y,m-1,d).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); };
const precio = (n)   => `$${Math.round(n).toLocaleString("es-CL")}`;

export default function Reservas() {
  const seccionRef = useRef(null);

  const [paso,        setPaso]        = useState(1);
  const [tipoViaje,   setTipoViaje]   = useState("compartido");
  const [origenId,    setOrigenId]    = useState("");
  const [destinoId,   setDestinoId]   = useState("");
  const [fecha,       setFecha]       = useState("");
  const [pasajeros,   setPasajeros]   = useState(1);
  const [direccion,   setDireccion]   = useState("");
  const [nombre,      setNombre]      = useState("");
  const [email,       setEmail]       = useState("");
  const [telefono,    setTelefono]    = useState("");
  const [notas,       setNotas]       = useState("");
  const [modoPago,    setModoPago]    = useState("abono");
  const [terms,       setTerms]       = useState(false);
  const [enviando,    setEnviando]    = useState(false);
  const [cancelando,  setCancelando]  = useState(false);
  const [error,       setError]       = useState("");
  const [reservaId,   setReservaId]   = useState(null);
  const [confirmado,  setConfirmado]  = useState(false);
  const [asientosOcupados, setAsientosOcupados] = useState(0);
  const [cargandoAsientos, setCargandoAsientos] = useState(false);

  const hoy          = new Date().toISOString().split("T")[0];
  const rutaKey      = origenId && destinoId ? `${origenId}-${destinoId}` : null;
  const rutaData     = rutaKey ? PRECIOS[rutaKey] : null;
  const rutaLabel    = origenId && destinoId
    ? `${ORIGENES.find(o=>o.id===origenId)?.label?.replace(/^.{2}/,"")} → ${DESTINOS_POR_ORIGEN[origenId]?.find(d=>d.id===destinoId)?.label?.replace(/^.{2}/,"")}`
    : "";
  const montoTotal   = !rutaData ? 0 : tipoViaje === "van_completa" ? rutaData.van : rutaData.persona * pasajeros;
  const abono        = montoTotal * 0.5;
  const aPagar       = tipoViaje === "van_completa" && modoPago === "abono" ? abono : montoTotal;
  const asientosLibres = Math.max(0, MAX_ASIENTOS - asientosOcupados);

  const scrollTop = () => setTimeout(() => {
    seccionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);

  const irPaso = (n) => { setPaso(n); scrollTop(); };

  // Cargar asientos ocupados
  useEffect(() => {
    if (!origenId || !destinoId || !fecha || tipoViaje !== "compartido") return;
    setCargandoAsientos(true);
    supabase.from("reservas").select("pasajeros")
      .eq("ruta", rutaLabel).eq("fecha", fecha)
      .eq("tipo_reserva", "compartido").neq("estado", "cancelado")
      .then(({ data }) => {
        setAsientosOcupados(data ? data.reduce((a,r) => a+(r.pasajeros||1), 0) : 0);
        setCargandoAsientos(false);
      });
  }, [origenId, destinoId, fecha, tipoViaje]);

  // Guardar reserva
  const guardarReserva = async () => {
    setError(""); setEnviando(true);
    try {
      const { data, error: dbErr } = await supabase.from("reservas").insert([{
        nombre, email: email||null, telefono,
        ruta: rutaLabel, fecha,
        vuelo_numero: "SIN_VUELO",
        pasajeros: Number(pasajeros),
        tipo_reserva: tipoViaje,
        estado: "pendiente_pago",
        notas: [
          direccion ? `Recogida: ${direccion}` : "",
          notas || "",
          tipoViaje === "van_completa"
            ? `Pago: ${modoPago==="abono"?"50% abono ("+precio(aPagar)+")":"Completo ("+precio(montoTotal)+")"}`
            : "Reserva compartida - sin pago previo",
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

  const enviarWhatsApp = (id) => {
    const msg = encodeURIComponent(
      `🚐 *${tipoViaje==="compartido"?"Reserva Compartida":"Van Completa"} - Araucanía Viajes*\n\n` +
      `✅ Reserva registrada exitosamente\n\n` +
      `👤 *${nombre}*\n📱 ${telefono}\n${email?`📧 ${email}\n`:""}` +
      `🗺️ ${rutaLabel}\n📅 ${fmt(fecha)}\n` +
      `👥 ${pasajeros} pasajero(s)\n` +
      `${direccion?`📍 Recogida: ${direccion}\n`:""}` +
      `\n💰 Total: ${precio(montoTotal)}\n` +
      (tipoViaje==="compartido"
        ? `\n⏳ *Tu reserva está apartada sin costo.* Una vez completado el cupo de ${MAX_ASIENTOS} pasajeros, te avisamos para coordinar el pago.\n`
        : `💳 Pago ahora: ${precio(aPagar)} (${modoPago==="abono"?"50% abono":"completo"})\n`) +
      `\n❌ Para cancelar responde este mensaje.\n🆔 Ref: ${id}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  const handleConfirmar = async () => {
    if (!nombre || !telefono) { setError("Completa nombre y teléfono."); return; }
    if (!terms) { setError("Debes aceptar los términos."); return; }
    const id = await guardarReserva();
    if (id) { setConfirmado(true); if (tipoViaje === "compartido") enviarWhatsApp(id); }
  };

  const handlePagarFlow = async () => {
    if (!nombre || !telefono) { setError("Completa nombre y teléfono."); return; }
    if (!terms) { setError("Debes aceptar los términos."); return; }
    const id = await guardarReserva();
    if (id) {
      enviarWhatsApp(id);
      window.open("https://www.flow.cl/btn.php?token=o6f0a50ad75e315233752a57fb02bdba9453e509", "_blank");
    }
  };

  const cancelarReserva = async () => {
    setCancelando(true);
    if (reservaId) await supabase.from("reservas").update({ estado:"cancelado" }).eq("id", reservaId);
    setCancelando(false);
    setPaso(1); setOrigenId(""); setDestinoId(""); setFecha("");
    setPasajeros(1); setDireccion("");
    setNombre(""); setEmail(""); setTelefono(""); setNotas("");
    setTerms(false); setReservaId(null); setConfirmado(false); setError("");
    scrollTop();
  };

  // ── PANTALLA CONFIRMACIÓN ──────────────────────────────────────────────────
  if (confirmado) return (
    <section ref={seccionRef} id="reservas" style={s.section}>
      <style>{css}</style>
      <div style={s.wrap}>
        <div style={{ ...s.card, textAlign:"center", padding:"2.5rem 1.5rem" }}>
          <div style={{ fontSize:"3.5rem", marginBottom:"0.75rem" }}>🎉</div>
          <h2 style={{ fontSize:"1.6rem", fontWeight:"800", color:"#fff", marginBottom:"0.5rem" }}>
            ¡Reserva confirmada!
          </h2>
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.88rem", maxWidth:"380px", margin:"0 auto 1.5rem", lineHeight:1.7 }}>
            {tipoViaje === "compartido"
              ? `Tu lugar está apartado sin costo. Te avisamos cuando se complete el cupo de ${MAX_ASIENTOS} pasajeros para coordinar el pago.`
              : "Tu van está reservada. Revisa tu WhatsApp con los detalles."}
          </p>

          <div style={s.resumenBox}>
            {[
              ["Ruta",      rutaLabel],
              ["Fecha",     fmt(fecha)],
              ["Pasajeros", `${pasajeros} pax`],
              ["Total",     precio(montoTotal)],
            ].map(([k,v]) => (
              <div key={k} style={s.resumenFila}>
                <span style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.78rem" }}>{k}</span>
                <span style={{ color:"#fff", fontWeight:"600", fontSize:"0.82rem" }}>{v}</span>
              </div>
            ))}
          </div>

          {tipoViaje === "compartido" && (
            <div style={{ background:"rgba(255,193,7,0.12)", border:"1px solid rgba(255,193,7,0.3)", borderRadius:"0.85rem", padding:"0.9rem 1.1rem", marginBottom:"1.25rem", fontSize:"0.78rem", color:"#ffc107", lineHeight:1.6, textAlign:"left" }}>
              📲 <strong>Revisa tu WhatsApp</strong> — te enviamos todos los detalles. Una vez completado el cupo se confirma el viaje y deberás realizar el pago.
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            <button className="btn-wa" onClick={() => enviarWhatsApp(reservaId)}>
              <WaIcon/> Abrir WhatsApp
            </button>
            <button className="btn-cancel" onClick={cancelarReserva} disabled={cancelando}>
              {cancelando ? "Cancelando..." : "❌ Cancelar reserva"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // ── FORMULARIO ─────────────────────────────────────────────────────────────
  return (
    <section ref={seccionRef} id="reservas" style={s.section}>
      <style>{css}</style>
      <div style={s.wrap}>

        {/* Encabezado */}
        <div style={s.header}>
          <p style={s.eyebrow}>Transfer compartido</p>
          <h2 style={s.titulo}>Reserva en línea</h2>

          {/* Tipo de viaje */}
          <div style={s.tipoBar}>
            {[
              { id:"compartido",   label:"👥 Compartido",   sub:"Desde "+precio(rutaData?.persona||15000)+"/pax" },
              { id:"van_completa", label:"🚐 Van Completa",  sub:"Desde "+precio(rutaData?.van||120000) },
            ].map(t => (
              <button key={t.id} className={`tipo-btn${tipoViaje===t.id?" activo":""}`}
                onClick={() => setTipoViaje(t.id)}>
                <span style={{ fontWeight:"700", fontSize:"0.88rem" }}>{t.label}</span>
                <span style={{ fontSize:"0.68rem", opacity:0.75 }}>{t.sub}</span>
              </button>
            ))}
          </div>

          {/* Steps */}
          <div style={s.stepsBar}>
            {PASOS.map((lbl, i) => (
              <React.Fragment key={i}>
                <div style={s.step}>
                  <div className={`step-circle${paso>i+1?" done":paso===i+1?" active":""}`}>
                    {paso>i+1 ? "✓" : i+1}
                  </div>
                  <span className={`step-lbl${paso===i+1?" step-lbl-active":""}`}>{lbl}</span>
                </div>
                {i < 2 && <div className={`step-line${paso>i+1?" step-line-done":""}`}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={s.card}>

          {/* ══ PASO 1: UBICACIÓN ══ */}
          {paso === 1 && (
            <div className="fade-up">
              <h3 style={s.cardTitle}>Información del viaje</h3>

              <div style={s.field}>
                <label style={s.lbl}>* Desde:</label>
                <select className="inp-sel" style={s.inp}
                  value={origenId} onChange={e=>{ setOrigenId(e.target.value); setDestinoId(""); }}>
                  <option value="">Selecciona origen...</option>
                  {ORIGENES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>* Hacia:</label>
                <select className="inp-sel" style={s.inp}
                  value={destinoId} onChange={e=>setDestinoId(e.target.value)}
                  disabled={!origenId}>
                  <option value="">Selecciona destino...</option>
                  {(DESTINOS_POR_ORIGEN[origenId]||[]).map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>* Fecha de recogida del pasajero:</label>
                <input type="date" min={hoy} className="inp-sel" style={s.inp}
                  value={fecha} onChange={e=>setFecha(e.target.value)}/>
                {fecha && <p style={s.fechaHint}>📅 {fmt(fecha)}</p>}
              </div>

              <div style={s.field}>
                <label style={s.lbl}>* Cantidad de pasajeros:</label>
                <select className="inp-sel" style={s.inp}
                  value={pasajeros} onChange={e=>setPasajeros(Number(e.target.value))}>
                  {Array.from({length: MAX_ASIENTOS},(_,i)=>i+1).map(n=>(
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>* Dirección de recogida:</label>
                <input className="inp-sel" style={s.inp} placeholder="Hotel, hostal o dirección..."
                  value={direccion} onChange={e=>setDireccion(e.target.value)}/>
              </div>

              {/* Indicador asientos */}
              {tipoViaje === "compartido" && origenId && destinoId && fecha && (
                <div style={{ marginTop:"1rem" }}>
                  <AsientosIndicador
                    ocupados={asientosOcupados}
                    total={MAX_ASIENTOS}
                    libres={asientosLibres}
                    cargando={cargandoAsientos}
                  />
                </div>
              )}

              <p style={s.nota}>* Campos requeridos.</p>
              <p style={s.nota}>* Su pasaje es válido solo para el día seleccionado. Para cambios contáctenos vía WhatsApp.</p>
              {tipoViaje === "compartido" && (
                <p style={s.nota}>* El valor del equipaje de bodega (ej. bicicletas) tiene el valor de un pasaje según el tramo elegido.</p>
              )}

              <button className="btn-primary"
                disabled={!origenId||!destinoId||!fecha}
                onClick={() => irPaso(2)}>
                Continuar →
              </button>
            </div>
          )}

          {/* ══ PASO 2: TUS DATOS ══ */}
          {paso === 2 && (
            <div className="fade-up">
              <button style={s.volver} onClick={() => irPaso(1)}>← Volver</button>
              <h3 style={s.cardTitle}>Tus datos</h3>

              <div style={s.field}>
                <label style={s.lbl}>* Nombre completo:</label>
                <input className="inp-sel" style={s.inp} placeholder="Juan Pérez"
                  value={nombre} onChange={e=>setNombre(e.target.value)}/>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>* Teléfono WhatsApp:</label>
                <input className="inp-sel" style={s.inp} placeholder="+56 9 1234 5678" type="tel"
                  value={telefono} onChange={e=>setTelefono(e.target.value)}/>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>Correo electrónico:</label>
                <input className="inp-sel" style={s.inp} placeholder="tucorreo@gmail.com" type="email"
                  value={email} onChange={e=>setEmail(e.target.value)}/>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>Notas adicionales:</label>
                <textarea className="inp-sel" style={{ ...s.inp, height:"80px", resize:"vertical" }}
                  placeholder="Equipaje especial, silla bebé, mascotas..."
                  value={notas} onChange={e=>setNotas(e.target.value)}/>
              </div>

              {/* Resumen mini */}
              <div style={s.resumenMini}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.6rem" }}>
                  <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.6)", fontWeight:"600", letterSpacing:"0.06em" }}>RESUMEN</span>
                  <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.5)" }}>{tipoViaje==="compartido"?"👥 Compartido":"🚐 Van Completa"}</span>
                </div>
                {[
                  ["Ruta",     rutaLabel],
                  ["Fecha",    fmt(fecha)],
                  ["Pax",      `${pasajeros} pasajero(s)`],
                  ...(direccion?[["Recogida", direccion]]:[]),
                ].map(([k,v]) => v ? (
                  <div key={k} style={s.resumenFila}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.76rem" }}>{k}</span>
                    <span style={{ color:"#fff", fontWeight:"500", fontSize:"0.78rem", textAlign:"right", maxWidth:"60%" }}>{v}</span>
                  </div>
                ) : null)}
              </div>

              <button className="btn-primary"
                disabled={!nombre||!telefono}
                onClick={() => irPaso(3)}>
                Continuar al pago →
              </button>
            </div>
          )}

          {/* ══ PASO 3: PAGO ══ */}
          {paso === 3 && (
            <div className="fade-up">
              <button style={s.volver} onClick={() => irPaso(2)}>← Volver</button>
              <h3 style={s.cardTitle}>
                {tipoViaje === "compartido" ? "Confirmar reserva" : "Pago"}
              </h3>

              {/* Modo pago solo van completa */}
              {tipoViaje === "van_completa" && (
                <div style={{ marginBottom:"1.25rem" }}>
                  <label style={s.lbl}>Modalidad de pago:</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginTop:"0.5rem" }}>
                    {[
                      { id:"abono", label:"50% Abono",    sub:"Resto al momento del viaje",      monto: precio(abono) },
                      { id:"total", label:"Pago completo", sub:"Reserva confirmada al instante",  monto: precio(montoTotal) },
                    ].map(m => (
                      <button key={m.id} className={`pago-opt${modoPago===m.id?" pago-opt-on":""}`}
                        onClick={() => setModoPago(m.id)}>
                        <span style={{ fontWeight:"700", fontSize:"0.85rem" }}>{m.label}</span>
                        <span style={{ fontSize:"0.65rem", opacity:0.7, lineHeight:1.4 }}>{m.sub}</span>
                        <span style={{ fontWeight:"800", fontSize:"1rem", color:"#52e896", marginTop:"0.2rem" }}>{m.monto}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Precio */}
              <div style={s.precioBox}>
                <h4 style={{ fontSize:"1.1rem", fontWeight:"800", color:"#fff", marginBottom:"1rem", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"0.75rem" }}>
                  Precio
                </h4>
                {[
                  ["Valor viaje", precio(rutaData?.persona||0) + (tipoViaje==="compartido"?" x pax":"")],
                  ["Pasajeros",   `${pasajeros}`],
                  ...(tipoViaje==="van_completa"&&modoPago==="abono" ? [["Abono (50%)", precio(abono)]] : []),
                ].map(([k,v]) => (
                  <div key={k} style={s.precioFila}>
                    <span style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.85rem" }}>{k}</span>
                    <span style={{ color:"#fff", fontSize:"0.85rem" }}>{v}</span>
                  </div>
                ))}
                <div style={{ ...s.precioFila, borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:"0.75rem", marginTop:"0.5rem" }}>
                  <span style={{ color:"#fff", fontWeight:"700", fontSize:"0.95rem" }}>Total</span>
                  <span style={{ color:"#52e896", fontWeight:"800", fontSize:"1.35rem" }}>
                    {tipoViaje==="compartido" ? precio(montoTotal) : precio(aPagar)}
                  </span>
                </div>
                {tipoViaje==="compartido" && (
                  <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.45)", marginTop:"0.5rem", lineHeight:1.6 }}>
                    * Sin cobro previo. Pagas cuando se confirme el viaje.
                  </p>
                )}
              </div>

              {/* Indicador asientos paso 3 */}
              {tipoViaje === "compartido" && (
                <div style={{ marginBottom:"1.25rem" }}>
                  <AsientosIndicador
                    ocupados={asientosOcupados}
                    total={MAX_ASIENTOS}
                    libres={asientosLibres}
                    cargando={cargandoAsientos}
                  />
                </div>
              )}

              {/* Aviso compartido */}
              {tipoViaje === "compartido" && (
                <div style={s.avisoCompartido}>
                  ⏳ <strong>¿Cómo funciona?</strong> Tu reserva queda registrada sin costo.
                  Una vez completado el cupo de <strong>{MAX_ASIENTOS} asientos</strong> te contactamos
                  por WhatsApp para confirmar el viaje y coordinar el pago.
                </div>
              )}

              {/* Terms */}
              <label style={s.termsRow}>
                <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}
                  style={{ accentColor:"#52e896", width:"16px", height:"16px", flexShrink:0, marginTop:"2px" }}/>
                <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
                  Acepto los <span style={{ color:"#52e896", textDecoration:"underline", cursor:"pointer" }}>términos y condiciones</span>.
                  {tipoViaje==="compartido"
                    ? " El viaje se confirma al completar el cupo. Sin cobro si no se completa."
                    : " El saldo restante se paga al momento del viaje."}
                </span>
              </label>

              {error && <div style={s.errBox}>⚠️ {error}</div>}

              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginTop:"1.25rem" }}>
                {tipoViaje === "compartido" ? (
                  <button className="btn-primary" disabled={enviando||!terms} onClick={handleConfirmar}>
                    {enviando ? "⏳ Guardando..." : "✅ Confirmar reserva — Sin pago ahora"}
                  </button>
                ) : (
                  <button className="btn-flow" disabled={enviando||!terms} onClick={handlePagarFlow}>
                    {enviando ? "⏳ Procesando..." : (
                      <>
                        <svg width="48" height="20" viewBox="0 0 120 46" fill="none">
                          <path d="M0 23C0 10.3 10.3 0 23 0h74c12.7 0 23 10.3 23 23S109.7 46 97 46H23C10.3 46 0 35.7 0 23z" fill="white" fillOpacity="0.2"/>
                          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Arial">flow</text>
                        </svg>
                        <span>Pagar {precio(aPagar)}</span>
                      </>
                    )}
                  </button>
                )}
                <button className="btn-cancel" onClick={() => irPaso(1)}>
                  ← Cancelar y volver al inicio
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"0.68rem", color:"rgba(255,255,255,0.3)", marginTop:"1.5rem" }}>
          🌿 Araucanía Viajes · +3.200 transfers · Región de La Araucanía
        </p>
      </div>
    </section>
  );
}

// ─── Indicador de asientos ────────────────────────────────────────────────────
function AsientosIndicador({ ocupados, total, libres, cargando }) {
  const pct     = Math.min(100, Math.round((ocupados/total)*100));
  const urgente = libres <= 3;
  const mitad   = libres <= 6;
  const color   = urgente ? "#ef4444" : mitad ? "#f59e0b" : "#52e896";

  return (
    <div style={{ border:`1px solid ${color}30`, borderRadius:"0.9rem", padding:"1rem", marginBottom:"1rem", background:`${color}08` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.55rem" }}>
        <span style={{ fontSize:"0.78rem", fontWeight:"700", color:"#fff" }}>🪑 Disponibilidad</span>
        {cargando
          ? <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.4)" }}>Consultando...</span>
          : <span style={{ fontSize:"0.72rem", fontWeight:"700", color, background:`${color}20`, padding:"0.15rem 0.6rem", borderRadius:"99px" }}>
              {urgente ? "⚠️ Últimos lugares" : mitad ? "🔥 Quedan pocos" : "✅ Disponible"}
            </span>
        }
      </div>
      <div style={{ height:"8px", borderRadius:"99px", background:"rgba(255,255,255,0.1)", overflow:"hidden", marginBottom:"0.5rem" }}>
        <div style={{ height:"100%", width:cargando?"0%":`${pct}%`, background:color, borderRadius:"99px", transition:"width 0.8s ease" }}/>
      </div>
      <div style={{ display:"flex", gap:"3px", flexWrap:"wrap", marginBottom:"0.45rem" }}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{ width:"16px", height:"16px", borderRadius:"3px", background: i<ocupados ? "rgba(255,255,255,0.2)" : color, fontSize:"8px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {i<ocupados ? "●" : ""}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.7rem", color:"rgba(255,255,255,0.45)" }}>
        <span>{cargando ? "..." : `${ocupados} reservados`}</span>
        <span style={{ color, fontWeight:"700" }}>{cargando ? "..." : `${libres} de ${total} disponibles`}</span>
      </div>
    </div>
  );
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.35s ease both; }

  .step-circle {
    width: 2rem; height: 2rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 700;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
    border: 2px solid rgba(255,255,255,0.15);
    transition: all 0.3s;
  }
  .step-circle.active {
    background: #52e896; color: #0a2016;
    border-color: #52e896;
    box-shadow: 0 0 0 4px rgba(82,232,150,0.2);
  }
  .step-circle.done {
    background: rgba(82,232,150,0.2); color: #52e896;
    border-color: rgba(82,232,150,0.4);
  }
  .step-lbl {
    font-size: 0.68rem; color: rgba(255,255,255,0.35);
    letter-spacing: 0.04em; font-weight: 500; transition: color 0.3s;
  }
  .step-lbl-active { color: #52e896 !important; font-weight: 700; }
  .step-line {
    flex: 1; height: 1px;
    background: rgba(255,255,255,0.12); transition: background 0.4s;
  }
  .step-line-done { background: rgba(82,232,150,0.4); }

  .tipo-btn {
    flex: 1; display: flex; flex-direction: column; gap: 2px;
    padding: 0.7rem 1rem; border-radius: 0.75rem;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: transparent; color: rgba(255,255,255,0.5);
    cursor: pointer; transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }
  .tipo-btn:hover { border-color: rgba(82,232,150,0.3); color: rgba(255,255,255,0.8); }
  .tipo-btn.activo {
    border-color: #52e896; background: rgba(82,232,150,0.08);
    color: #fff; box-shadow: 0 0 0 3px rgba(82,232,150,0.12);
  }

  .inp-sel {
    background: rgba(255,255,255,0.06) !important;
    border: 1.5px solid rgba(255,255,255,0.12) !important;
    color: #fff !important;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s; appearance: auto;
  }
  .inp-sel::placeholder { color: rgba(255,255,255,0.3) !important; }
  .inp-sel:focus {
    border-color: #52e896 !important; outline: none;
    box-shadow: 0 0 0 3px rgba(82,232,150,0.12);
  }
  .inp-sel option { background: #0f2d1c; color: #fff; }

  .btn-primary {
    width: 100%; padding: 0.95rem;
    background: #52e896; color: #0a2016;
    border: none; border-radius: 0.85rem;
    font-size: 0.95rem; font-weight: 800;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.25s;
    margin-top: 1rem;
  }
  .btn-primary:hover:not(:disabled) { background: #3dd880; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(82,232,150,0.3); }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-flow {
    width: 100%; padding: 0.9rem 1.4rem;
    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
    background: linear-gradient(135deg, #e8321e, #c0240e);
    color: #fff; border: none; border-radius: 0.85rem;
    font-size: 1rem; font-weight: 800;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.25s;
    box-shadow: 0 4px 18px rgba(232,50,30,0.3);
  }
  .btn-flow:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(232,50,30,0.4); }
  .btn-flow:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-wa {
    width: 100%; padding: 0.85rem;
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    background: #25D366; color: #fff;
    border: none; border-radius: 0.85rem;
    font-size: 0.92rem; font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.25s;
  }
  .btn-wa:hover { background: #20bd5a; transform: translateY(-1px); }

  .btn-cancel {
    width: 100%; padding: 0.75rem;
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.4);
    border-radius: 0.75rem;
    font-size: 0.82rem; font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-cancel:hover { border-color: #ef4444; color: #ef4444; }
  .btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

  .pago-opt {
    display: flex; flex-direction: column; gap: 3px;
    padding: 0.85rem; border-radius: 0.85rem;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6);
    cursor: pointer; transition: all 0.2s;
    font-family: 'Outfit', sans-serif; text-align: left;
  }
  .pago-opt:hover { border-color: rgba(82,232,150,0.3); }
  .pago-opt-on {
    border-color: #52e896 !important;
    background: rgba(82,232,150,0.08) !important;
    color: #fff !important;
    box-shadow: 0 0 0 3px rgba(82,232,150,0.1);
  }

  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
`;

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  section: {
    background: "linear-gradient(160deg, #071a0d 0%, #0d2b1a 50%, #091408 100%)",
    padding: "0 0 4rem",
    fontFamily: "'Outfit', sans-serif",
    minHeight: "100vh",
  },
  wrap:    { maxWidth: "480px", margin: "0 auto", padding: "0 1rem" },
  header:  { textAlign: "center", padding: "3rem 0 1.5rem" },
  eyebrow: { color: "#52e896", fontSize: "0.85rem", fontWeight: "600", letterSpacing: "0.04em", marginBottom: "0.3rem" },
  titulo:  { fontSize: "clamp(2rem,6vw,2.8rem)", fontWeight: "800", color: "#fff", marginBottom: "1.5rem", lineHeight: 1.15 },
  tipoBar: { display: "flex", gap: "0.65rem", marginBottom: "1.5rem", justifyContent: "center" },
  stepsBar:{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" },
  step:    { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1.5rem",
    padding: "1.75rem 1.5rem",
    backdropFilter: "blur(12px)",
  },
  cardTitle: { fontSize: "1.35rem", fontWeight: "800", color: "#fff", marginBottom: "1.25rem" },
  field:     { marginBottom: "1rem" },
  lbl:       { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "rgba(255,255,255,0.6)", marginBottom: "0.38rem", letterSpacing: "0.02em" },
  inp:       { width: "100%", padding: "0.78rem 0.95rem", borderRadius: "0.72rem", fontSize: "0.92rem", fontFamily: "'Outfit',sans-serif" },
  fechaHint: { fontSize: "0.72rem", color: "#52e896", marginTop: "0.3rem" },
  nota:      { fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginTop: "0.5rem" },
  volver:    { background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.82rem", marginBottom: "1rem", padding: 0, fontFamily: "'Outfit',sans-serif" },
  resumenMini: {
    background: "rgba(82,232,150,0.06)", border: "1px solid rgba(82,232,150,0.15)",
    borderRadius: "1rem", padding: "1rem 1.1rem", marginBottom: "0.5rem",
  },
  resumenBox: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "1rem", padding: "1rem 1.1rem", marginBottom: "1.25rem",
  },
  resumenFila: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  precioBox: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "1rem", padding: "1.15rem 1.25rem", marginBottom: "1.25rem",
  },
  precioFila: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0" },
  avisoCompartido: {
    background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.2)",
    borderRadius: "0.85rem", padding: "0.85rem 1rem",
    fontSize: "0.76rem", color: "rgba(255,193,7,0.85)", lineHeight: 1.65, marginBottom: "1rem",
  },
  termsRow: { display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer", marginTop: "0.5rem" },
  errBox:   { padding: "0.8rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.72rem", color: "#ef4444", fontSize: "0.82rem", marginTop: "0.75rem" },
};