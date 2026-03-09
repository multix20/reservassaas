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

// ─── Icon components ──────────────────────────────────────────────────────────
const Icon = ({ path, size = 16, color = "#9a9080", sw = "2" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={path}/>
  </svg>
);

const IconMap        = () => <Icon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a2 2 0 110-4 2 2 0 010 4z"/>;
const IconFlag       = () => <Icon path="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7"/>;
const IconCalendar   = () => <Icon path="M8 2v4 M16 2v4 M3 10h18 M21 8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V8z"/>;
const IconUsers      = () => <Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"/>;
const IconHome       = () => <Icon path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/>;
const IconUser       = () => <Icon path="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z"/>;
const IconPhone      = () => <Icon path="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>;
const IconMail       = () => <Icon path="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6"/>;
const IconNotes      = () => <Icon path="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/>;
const IconClock      = () => <Icon path="M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2"/>;
const IconCreditCard = () => <Icon path="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z M1 10h22"/>;

// Iconos para sugerencias (SVG puros — sin emoji, exportables para GIMP/Inkscape)
const IcoPlane = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/>
  </svg>
);
const IcoMountain = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3l4 8 5-5 5 13H2L8 3z"/>
  </svg>
);
const IcoVolcano = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2 6h-4l2-6z M8 8l-6 14h20L16 8"/>
    <path d="M9 14h6"/>
  </svg>
);
const IcoBus = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2"/>
    <path d="M2 10h20 M7 18v2 M17 18v2"/>
    <circle cx="7" cy="14" r="1" fill={c}/><circle cx="17" cy="14" r="1" fill={c}/>
  </svg>
);
const IcoVan = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M9 5v7h11"/>
  </svg>
);
const IcoCalSug = ({ c="#3d3629" }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round"/>
    <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round"/>
    <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);
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

  // ── PANTALLA CONFIRMACIÓN ─────────────────────────────────────────────────
  if (confirmado) return (
    <section ref={seccionRef} id="reservas" style={S.section}>
      <style>{css}</style>
      <div style={S.wrap}>
        <div style={{ ...S.card, textAlign:"center", padding:"2.5rem 1.5rem" }}>
          <div style={S.checkCircle}>✓</div>
          <h2 style={{ fontSize:"1.6rem", fontWeight:"800", color:C.ink, marginBottom:"0.5rem", fontFamily:"'Syne',sans-serif" }}>
            {tipoViaje === "compartido" ? "¡Reserva confirmada!" : "¡Van reservada!"}
          </h2>
          <p style={{ color:C.mid, fontSize:"0.88rem", maxWidth:"340px", margin:"0 auto 1.5rem", lineHeight:1.7 }}>
            {tipoViaje === "compartido"
              ? `Tu lugar está apartado sin costo. Te avisamos cuando se complete el cupo de ${MAX_ASIENTOS} pasajeros.`
              : "Tu van está reservada. Revisa tu WhatsApp con los detalles."}
          </p>

          <div style={S.resumenBox}>
            {[
              ["🗺️ Ruta",      rutaLabel],
              ["📅 Fecha",     fmt(fecha)],
              ["👥 Pasajeros", `${pasajeros} pax`],
              ["💰 Total",     precio(montoTotal)],
            ].map(([k,v]) => (
              <div key={k} style={S.resumenFila}>
                <span style={{ color:C.mid, fontSize:"0.78rem" }}>{k}</span>
                <span style={{ color:C.ink, fontWeight:"600", fontSize:"0.82rem" }}>{v}</span>
              </div>
            ))}
          </div>

          {tipoViaje === "compartido" && (
            <div style={S.avisoBox}>
              📲 <strong>Revisa tu WhatsApp</strong> — te enviamos todos los detalles.
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            <button className="btn-wa" onClick={() => enviarWhatsApp(reservaId)}>
              <WaIcon/> Abrir WhatsApp
            </button>
            <button className="btn-cancel" onClick={cancelarReserva} disabled={cancelando}>
              {cancelando ? "Cancelando..." : "Cancelar reserva"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // ── FORMULARIO ────────────────────────────────────────────────────────────
  return (
    <section ref={seccionRef} id="reservas" style={S.section}>
      <style>{css}</style>
      <div style={S.wrap}>

        {/* Steps — solo visible en paso 2 y 3 */}
        {paso > 1 && (
          <div style={S.header}>
            <div style={S.stepsBar}>
              {PASOS.map((lbl, i) => (
                <React.Fragment key={i}>
                  <div style={S.step}>
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
        )}

        {/* Card */}
        <div style={paso === 1 ? { background:"transparent", border:"none", padding:0 } : S.card}>

          {/* ══ PASO 1 — Uber exact style ══ */}
          {paso === 1 && (
            <div className="fade-up">

              {/* Título grande — con espacio del header */}
              <h2 style={S.uberTitle}>
                Muevete<br/>con Araucanía<br/>Viajes
              </h2>

              {/* ── Barra búsqueda principal ── */}
              <SearchBar
                origenId={origenId} setOrigenId={setOrigenId}
                destinoId={destinoId} setDestinoId={setDestinoId}
                fecha={fecha} setFecha={setFecha}
                hoy={hoy} fmt={fmt}
              />

              {/* ── Botón Ver tarifas ── */}
              <button className="btn-uber"
                disabled={!origenId||!destinoId||!fecha}
                onClick={() => irPaso(2)}>
                Ver tarifas sugeridas
              </button>

              <p style={{ fontSize:"0.78rem", color:C.muted, marginTop:"0.6rem" }}>
                Inicia sesión para ver tu actividad reciente
              </p>

              {/* ── Pasajeros + Dirección (expandido si hay ruta) ── */}
              {origenId && destinoId && fecha && (
                <div style={{ ...S.uberExtras, marginTop:10 }} className="fade-up">
                  <div style={S.uberExtraRow}>
                    <IconUsers/>
                    <span style={{ flex:1, color:C.dark, fontSize:"0.92rem" }}>
                      {pasajeros === 1 ? "1 pasajero" : `${pasajeros} pasajeros`}
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <button className="cnt-btn" onClick={() => setPasajeros(Math.max(1, pasajeros-1))}>−</button>
                      <span style={{ color:C.ink, fontWeight:700, minWidth:16, textAlign:"center" }}>{pasajeros}</span>
                      <button className="cnt-btn" onClick={() => setPasajeros(Math.min(MAX_ASIENTOS, pasajeros+1))}>+</button>
                    </div>
                  </div>
                  <div style={{ height:1, background:C.border }}/>
                  <div style={S.uberExtraRow}>
                    {/* Icono precio */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    <span style={{ flex:1, color:C.mid, fontSize:"0.88rem" }}>
                      {tipoViaje === "compartido" ? "Precio por persona" : "Van completa"}
                    </span>
                    <span style={{ color:C.ink, fontWeight:800, fontSize:"1.05rem", letterSpacing:"-0.02em" }}>
                      {rutaData
                        ? precio(tipoViaje === "compartido" ? rutaData.persona * pasajeros : rutaData.van)
                        : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* Asientos compartido */}
              {tipoViaje === "compartido" && origenId && destinoId && fecha && (
                <div style={{ marginTop:10 }}>
                  <AsientosIndicador
                    ocupados={asientosOcupados} total={MAX_ASIENTOS}
                    libres={asientosLibres} cargando={cargandoAsientos}
                  />
                </div>
              )}

              {/* ── Sugerencias ── */}
              <div style={{ marginTop:"2.5rem" }}>
                <h3 style={S.sugTitle}>Sugerencias</h3>
                <div style={S.sugList}>
                  {[
                    { Ico: IcoPlane,    label:"Aeropuerto", sub:"Temuco ZCO",         accion: () => setOrigenId("aeropuerto") },
                    { Ico: IcoMountain, label:"Pucón",      sub:"desde aeropuerto",   accion: () => { setOrigenId("aeropuerto"); setDestinoId("pucon"); } },
                    { Ico: IcoVolcano,  label:"Villarrica", sub:"desde aeropuerto",   accion: () => { setOrigenId("aeropuerto"); setDestinoId("villarrica"); } },
                    { Ico: IcoBus,      label:"Compartido", sub:"desde $12.000/pax",  accion: () => setTipoViaje("compartido") },
                    { Ico: IcoVan,      label:"Van completa",sub:"desde $100.000",    accion: () => setTipoViaje("van_completa") },
                    { Ico: IcoCalSug,   label:"Programar",  sub:"elige fecha y hora", accion: () => {} },
                  ].map((s,i) => (
                    <button key={i} className="sug-row" onClick={s.accion}>
                      <div style={S.sugIcon}><s.Ico/></div>
                      <div style={{ textAlign:"left" }}>
                        <div style={{ color:C.ink, fontSize:"0.9rem", fontWeight:600 }}>{s.label}</div>
                        <div style={{ color:C.mid, fontSize:"0.75rem" }}>{s.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ PASO 2 ══ */}
          {paso === 2 && (
            <div className="fade-up">
              <BtnVolver onClick={() => irPaso(1)}/>
              <h3 style={S.cardTitle}>Tus datos</h3>

              <Field label="Nombre completo" required>
                <InputWrap icon={<IconUser/>}>
                  <input className="inp" style={S.inp} placeholder="Juan Pérez"
                    value={nombre} onChange={e=>setNombre(e.target.value)}/>
                </InputWrap>
              </Field>

              <Field label="Teléfono WhatsApp" required>
                <InputWrap icon={<IconPhone/>}>
                  <input className="inp" style={S.inp} placeholder="+56 9 1234 5678" type="tel"
                    value={telefono} onChange={e=>setTelefono(e.target.value)}/>
                </InputWrap>
              </Field>

              <Field label="Correo electrónico">
                <InputWrap icon={<IconMail/>}>
                  <input className="inp" style={S.inp} placeholder="tucorreo@gmail.com" type="email"
                    value={email} onChange={e=>setEmail(e.target.value)}/>
                </InputWrap>
              </Field>

              <Field label="Notas adicionales">
                <InputWrap icon={<IconNotes/>} align="flex-start">
                  <textarea className="inp" style={{ ...S.inp, height:"80px", resize:"vertical", paddingTop:8 }}
                    placeholder="Equipaje especial, silla bebé, mascotas..."
                    value={notas} onChange={e=>setNotas(e.target.value)}/>
                </InputWrap>
              </Field>

              {/* Resumen mini */}
              <div style={S.resumenBox}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                  <span style={{ fontSize:"0.72rem", color:C.mid, fontWeight:700, letterSpacing:"0.06em" }}>RESUMEN</span>
                  <span style={{ fontSize:"0.72rem", color:C.mid }}>{tipoViaje==="compartido"?"👥 Compartido":"🚐 Van Completa"}</span>
                </div>
                {[
                  ["🗺️ Ruta",    rutaLabel],
                  ["📅 Fecha",   fmt(fecha)],
                  ["👥 Pax",     `${pasajeros} pasajero(s)`],
                  ...(direccion?[["📍 Recogida", direccion]]:[]),
                ].map(([k,v]) => v ? (
                  <div key={k} style={S.resumenFila}>
                    <span style={{ color:C.mid, fontSize:"0.75rem" }}>{k}</span>
                    <span style={{ color:C.ink, fontWeight:"500", fontSize:"0.78rem", textAlign:"right", maxWidth:"60%" }}>{v}</span>
                  </div>
                ) : null)}
              </div>

              <BtnPrimary disabled={!nombre||!telefono} onClick={() => irPaso(3)}>
                Continuar al pago →
              </BtnPrimary>
            </div>
          )}

          {/* ══ PASO 3 ══ */}
          {paso === 3 && (
            <div className="fade-up">
              <BtnVolver onClick={() => irPaso(2)}/>
              <h3 style={S.cardTitle}>
                {tipoViaje === "compartido" ? "Confirmar reserva" : "Pago"}
              </h3>

              {tipoViaje === "van_completa" && (
                <Field label="Modalidad de pago">
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", marginTop:"0.25rem" }}>
                    {[
                      { id:"abono", label:"50% Abono",     sub:"Resto al momento del viaje",      monto: precio(abono) },
                      { id:"total", label:"Pago completo",  sub:"Reserva confirmada al instante",  monto: precio(montoTotal) },
                    ].map(m => (
                      <button key={m.id} className={`pago-opt${modoPago===m.id?" pago-opt-on":""}`}
                        onClick={() => setModoPago(m.id)}>
                        <span style={{ fontWeight:700, fontSize:"0.85rem" }}>{m.label}</span>
                        <span style={{ fontSize:"0.65rem", opacity:0.6, lineHeight:1.4 }}>{m.sub}</span>
                        <span style={{ fontWeight:800, fontSize:"1rem", color:"#fff", marginTop:"0.2rem" }}>{m.monto}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* Precio */}
              <div style={S.precioBox}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"0.75rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${C.border}` }}>
                  <IconCreditCard/>
                  <h4 style={{ fontSize:"0.95rem", fontWeight:700, color:C.ink }}>Precio estimado</h4>
                </div>
                {[
                  ["Valor viaje", precio(rutaData?.persona||0) + (tipoViaje==="compartido"?" x pax":"")],
                  ["Pasajeros",   `${pasajeros}`],
                  ...(tipoViaje==="van_completa"&&modoPago==="abono" ? [["Abono (50%)", precio(abono)]] : []),
                ].map(([k,v]) => (
                  <div key={k} style={S.precioFila}>
                    <span style={{ color:C.mid, fontSize:"0.85rem" }}>{k}</span>
                    <span style={{ color:C.dark, fontSize:"0.85rem" }}>{v}</span>
                  </div>
                ))}
                <div style={{ ...S.precioFila, borderTop:`1px solid ${C.border}`, paddingTop:"0.75rem", marginTop:"0.5rem" }}>
                  <span style={{ color:C.ink, fontWeight:700 }}>Total</span>
                  <span style={{ color:C.ink, fontWeight:800, fontSize:"1.4rem" }}>
                    {tipoViaje==="compartido" ? precio(montoTotal) : precio(aPagar)}
                  </span>
                </div>
                {tipoViaje==="compartido" && (
                  <p style={{ fontSize:"0.72rem", color:C.mid, marginTop:"0.4rem", lineHeight:1.6 }}>
                    Sin cobro previo. Pagas cuando se confirme el viaje.
                  </p>
                )}
              </div>

              {tipoViaje === "compartido" && (
                <AsientosIndicador
                  ocupados={asientosOcupados} total={MAX_ASIENTOS}
                  libres={asientosLibres} cargando={cargandoAsientos}
                />
              )}

              {tipoViaje === "compartido" && (
                <div style={S.avisoBox}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                    <IconClock/>
                    <div>
                      <strong style={{ color:C.ink }}>¿Cómo funciona?</strong>
                      <p style={{ color:C.dark, fontSize:"0.75rem", marginTop:4, lineHeight:1.6 }}>
                        Tu reserva queda registrada sin costo. Una vez completado el cupo de <strong style={{color:C.ink}}>{MAX_ASIENTOS} asientos</strong> te contactamos por WhatsApp para confirmar el viaje y coordinar el pago.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <label style={S.termsRow}>
                <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}
                  style={{ accentColor:C.ink, width:16, height:16, flexShrink:0, marginTop:2 }}/>
                <span style={{ fontSize:"0.75rem", color:C.mid, lineHeight:1.6 }}>
                  Acepto los <span style={{ color:C.dark, textDecoration:"underline", cursor:"pointer" }}>términos y condiciones</span>.
                  {tipoViaje==="compartido"
                    ? " El viaje se confirma al completar el cupo."
                    : " El saldo restante se paga al momento del viaje."}
                </span>
              </label>

              {error && <div style={S.errBox}>⚠️ {error}</div>}

              <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem", marginTop:"1.25rem" }}>
                {tipoViaje === "compartido" ? (
                  <BtnPrimary disabled={enviando||!terms} onClick={handleConfirmar}>
                    {enviando ? "⏳ Guardando..." : "✅ Confirmar — Sin pago ahora"}
                  </BtnPrimary>
                ) : (
                  <button className="btn-flow" disabled={enviando||!terms} onClick={handlePagarFlow}>
                    {enviando ? "⏳ Procesando..." : `Pagar ${precio(aPagar)} con Flow`}
                  </button>
                )}
                <button className="btn-cancel" onClick={() => irPaso(1)}>
                  ← Cancelar y volver al inicio
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"0.68rem", color:C.muted, marginTop:"1.5rem" }}>
          🌿 Araucanía Viajes · +3.200 transfers · Región de La Araucanía
        </p>
      </div>
    </section>
  );
}

// ─── SearchBar — barra estilo Uber ───────────────────────────────────────────
function SearchBar({ origenId, setOrigenId, destinoId, setDestinoId, fecha, setFecha, hoy, fmt }) {
  const dateRef = useRef(null);

  return (
    <div style={{ display:"flex", gap:8, alignItems:"stretch", marginBottom:8 }}>
      {/* Campo principal */}
      <div style={{ flex:1, background:C.cream2, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 2px 12px rgba(26,22,17,.06)" }}>
        {/* Origen */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 15px", borderBottom:`1px solid ${C.border}` }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <select value={origenId} onChange={e=>{ setOrigenId(e.target.value); setDestinoId(""); }}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color: origenId ? C.ink : C.mid, fontSize:"0.93rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
            <option value="" style={{background:C.cream2, color:C.mid}}>Punto de partida</option>
            {ORIGENES.map(o => <option key={o.id} value={o.id} style={{background:C.cream2, color:C.ink}}>{o.label}</option>)}
          </select>
        </div>
        {/* Destino */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 15px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <select value={destinoId} onChange={e=>setDestinoId(e.target.value)} disabled={!origenId}
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color: destinoId ? C.ink : C.mid, fontSize:"0.93rem", fontFamily:"'DM Sans',sans-serif", cursor: origenId?"pointer":"default" }}>
            <option value="" style={{background:C.cream2, color:C.mid}}>¿A dónde vas?</option>
            {(DESTINOS_POR_ORIGEN[origenId]||[]).map(d => <option key={d.id} value={d.id} style={{background:C.cream2, color:C.ink}}>{d.label}</option>)}
          </select>
        </div>
      </div>

      {/* Pill fecha */}
      <div style={{ position:"relative" }}>
        <button onClick={() => dateRef.current?.showPicker?.()}
          style={{ height:"100%", padding:"0 13px", background:C.cream2, border:`1px solid ${C.border}`, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer", minWidth:66, boxShadow:"0 2px 8px rgba(26,22,17,.05)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontSize:"0.62rem", color: fecha ? C.ink : C.mid, whiteSpace:"nowrap", fontWeight: fecha ? 600 : 400, fontFamily:"'DM Sans',sans-serif" }}>
            {fecha ? fmt(fecha).split(",")[0].substring(0,7) : "Más\ntarde"}
          </span>
        </button>
        <input ref={dateRef} type="date" min={hoy} value={fecha}
          onChange={e=>setFecha(e.target.value)}
          style={{ position:"absolute", opacity:0, pointerEvents:"none", top:0, left:0, width:"100%", height:"100%" }}/>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"#555", marginBottom:"0.35rem", letterSpacing:"0.03em" }}>
        {label}{required && <span style={{ color:"#444", marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function InputWrap({ icon, children, align = "center" }) {
  return (
    <div style={{ display:"flex", alignItems:align, gap:12, background:C.slate, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"13px 15px", transition:"border-color .2s" }}
      onFocus={(e) => e.currentTarget.style.borderColor = C.ink}
      onBlur={(e)  => e.currentTarget.style.borderColor = C.border}>
      {icon}
      {children}
    </div>
  );
}

function BtnPrimary({ children, onClick, disabled }) {
  return (
    <button className="btn-primary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function BtnVolver({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:"none", border:"none", color:C.mid, cursor:"pointer", fontSize:"0.82rem", marginBottom:"1rem", padding:0, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
      ← Volver
    </button>
  );
}

function AsientosIndicador({ ocupados, total, libres, cargando }) {
  const pct     = Math.min(100, Math.round((ocupados/total)*100));
  const urgente = libres <= 3;
  const mitad   = libres <= 6;
  const color   = urgente ? "#c0290e" : mitad ? "#d97706" : "#3d7a4e";

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, padding:"1rem", marginBottom:"1rem", background:C.cream3 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.55rem" }}>
        <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink }}>🪑 Disponibilidad</span>
        {cargando
          ? <span style={{ fontSize:"0.68rem", color:C.muted }}>Consultando...</span>
          : <span style={{ fontSize:"0.72rem", fontWeight:700, color, background:C.cream2, padding:"0.15rem 0.6rem", borderRadius:99, border:`1px solid ${C.border}` }}>
              {urgente ? "⚠️ Últimos lugares" : mitad ? "🔥 Quedan pocos" : "✅ Disponible"}
            </span>
        }
      </div>
      <div style={{ height:6, borderRadius:99, background:C.border, overflow:"hidden", marginBottom:"0.5rem" }}>
        <div style={{ height:"100%", width:cargando?"0%":`${pct}%`, background:color, borderRadius:99, transition:"width 0.8s ease" }}/>
      </div>
      <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:"0.4rem" }}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background: i<ocupados ? C.muted : C.cream2, border: i<ocupados ? `1px solid ${C.border}` : `1px solid ${color}66` }}/>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.7rem", color:C.mid }}>
        <span>{cargando ? "..." : `${ocupados} reservados`}</span>
        <span style={{ color: urgente?"#c0290e":mitad?"#d97706":C.dark, fontWeight:700 }}>{cargando ? "..." : `${libres} de ${total} disponibles`}</span>
      </div>
    </div>
  );
}

const WaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.32s cubic-bezier(.22,.68,0,1.2) both; }

  /* ── Steps ── */
  .step-circle {
    width: 2rem; height: 2rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 700;
    background: #E8E0D0; color: #9a9080;
    border: 1.5px solid #D4CBB8; transition: all 0.3s;
  }
  .step-circle.active { background: #1a1611; color: #F5EDD8; border-color: #1a1611; }
  .step-circle.done   { background: #C8BEA8; color: #F5EDD8; border-color: #C8BEA8; }
  .step-lbl           { font-size: 0.68rem; color: #9a9080; letter-spacing: 0.04em; font-weight: 500; transition: color 0.3s; }
  .step-lbl-active    { color: #1a1611 !important; font-weight: 700; }
  .step-line          { flex: 1; height: 1px; background: #D4CBB8; transition: background 0.4s; }
  .step-line-done     { background: #9a9080; }

  /* ── Tipo viaje tabs ── */
  .tipo-btn {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 0.8rem; border-radius: 12px;
    border: 1.5px solid #D4CBB8; background: transparent;
    color: #9a9080; cursor: pointer; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .tipo-btn:hover { border-color: #9a9080; color: #3d3629; }
  .tipo-btn.activo { border-color: #1a1611; background: #1a1611; color: #F5EDD8; }

  /* ── Inputs ── */
  .inp {
    flex: 1; background: transparent; border: none; outline: none;
    color: #1a1611; font-family: 'DM Sans', sans-serif; font-size: 0.93rem;
    width: 100%;
  }
  .inp::placeholder { color: #9a9080; }
  .inp option { background: #EDE5D0; color: #1a1611; }
  .uber-inp { color: #1a1611 !important; }
  .uber-inp option { background: #EDE5D0; color: #1a1611; }

  /* ── Counter btn ── */
  .cnt-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1.5px solid #C8BEA8; background: #EDE5D0;
    color: #1a1611; font-size: 1.1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; font-weight: 600;
  }
  .cnt-btn:hover { background: #D4CBB8; border-color: #9a9080; }

  /* ── Buttons ── */
  .btn-primary {
    width: 100%; padding: 15px;
    background: #1a1611; color: #F5EDD8;
    border: none; border-radius: 12px;
    font-size: 0.95rem; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.2s; margin-top: 0.75rem;
    letter-spacing: -0.01em;
  }
  .btn-primary:hover:not(:disabled) { background: #2d2820; }
  .btn-primary:disabled { background: #D4CBB8; color: #9a9080; cursor: not-allowed; }

  .btn-uber {
    width: 100%; padding: 17px;
    background: #1a1611; color: #F5EDD8;
    border: none; border-radius: 12px;
    font-size: 1rem; font-weight: 800;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all .2s;
    margin-top: 10px; letter-spacing: -0.015em;
    box-shadow: 0 4px 20px rgba(26,22,17,.18);
  }
  .btn-uber:hover:not(:disabled) { background: #2d2820; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(26,22,17,.24); }
  .btn-uber:active:not(:disabled) { transform: translateY(0); }
  .btn-uber:disabled { background: #D4CBB8; color: #9a9080; cursor: not-allowed; box-shadow: none; }

  .btn-flow {
    width: 100%; padding: 15px;
    background: #c0290e; color: #fff;
    border: none; border-radius: 12px;
    font-size: 0.95rem; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.2s;
  }
  .btn-flow:hover:not(:disabled) { background: #a5230c; }
  .btn-flow:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-wa {
    width: 100%; padding: 14px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: #22c55e; color: #fff; border: none; border-radius: 12px;
    font-size: 0.92rem; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .btn-wa:hover { background: #16a34a; }

  .btn-cancel {
    width: 100%; padding: 13px; background: transparent;
    border: 1.5px solid #D4CBB8; color: #9a9080; border-radius: 12px;
    font-size: 0.82rem; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s;
  }
  .btn-cancel:hover { border-color: #c0290e; color: #c0290e; }
  .btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Pago options ── */
  .pago-opt {
    display: flex; flex-direction: column; gap: 3px; padding: 0.85rem;
    border-radius: 12px; border: 1.5px solid #D4CBB8;
    background: #EDE5D0; color: #9a9080; cursor: pointer;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif; text-align: left;
  }
  .pago-opt:hover { border-color: #9a9080; }
  .pago-opt-on { border-color: #1a1611 !important; background: #1a1611 !important; color: #F5EDD8 !important; }

  /* ── Suggestions ── */
  .sug-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 6px; width: 100%;
    background: transparent; border: none; border-bottom: 1px solid #E8E0D0;
    cursor: pointer; transition: all .15s;
    font-family: 'DM Sans', sans-serif; text-align: left; border-radius: 0;
  }
  .sug-row:hover { background: #EDE5D0; border-radius: 12px; border-bottom-color: transparent; padding-left: 12px; padding-right: 12px; }
  .sug-row:last-child { border-bottom: none; }

  /* ── Date/time pickers ── */
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator { filter: opacity(0.4); cursor: pointer; }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  cream:   "#F5EDD8",
  cream2:  "#EDE5D0",
  cream3:  "#E8E0D0",
  slate:   "#DDD6C8",
  border:  "#D4CBB8",
  muted:   "#C8BEA8",
  mid:     "#9a9080",
  dark:    "#3d3629",
  ink:     "#1a1611",
};

const S = {
  section:    { background: C.cream, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" },
  wrap:       { maxWidth: 420, margin: "0 auto", padding: "0 20px 72px" },

  // Paso 1
  uberTitle:  { fontFamily:"'Syne',sans-serif", fontSize:"clamp(1.85rem,7vw,2.5rem)", fontWeight:800, color:C.ink, lineHeight:1.08, marginBottom:"1.25rem", marginTop:"3.5rem" },
  searchWrap: { background: C.cream2, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:8, boxShadow:"0 2px 12px rgba(26,22,17,.06)" },
  searchRow:  { display:"flex", alignItems:"center", gap:10, padding:"14px 16px" },
  datePill:   { background: C.cream2, border:`1px solid ${C.border}`, borderRadius:12, padding:"0 14px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, cursor:"pointer", minWidth:68, boxShadow:"0 2px 8px rgba(26,22,17,.05)" },

  uberExtras: { background: C.cream2, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:4, boxShadow:"0 2px 12px rgba(26,22,17,.06)" },
  uberExtraRow:{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px" },

  sugTitle:   { color:C.ink, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.15rem", marginBottom:"0.75rem" },
  sugList:    { display:"flex", flexDirection:"column" },
  sugIcon:    { width:46, height:46, borderRadius:12, background: C.cream3, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },

  // Steps
  header:     { textAlign:"center", padding:"1.25rem 0 0.75rem" },
  stepsBar:   { display:"flex", alignItems:"center", gap:"0.5rem", justifyContent:"center" },
  step:       { display:"flex", flexDirection:"column", alignItems:"center", gap:"0.3rem" },

  // Card (pasos 2 y 3)
  card:       { background: C.cream2, border:`1px solid ${C.border}`, borderRadius:20, padding:"1.75rem 1.5rem", boxShadow:"0 4px 24px rgba(26,22,17,.08)" },
  cardTitle:  { fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:C.ink, marginBottom:"1.25rem" },
  inp:        { background:"transparent", border:"none", outline:"none" },

  // InputWrap
  inputWrap:  { display:"flex", alignItems:"center", gap:12, background: C.slate, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 15px", transition:"border-color .2s" },

  fechaHint:  { fontSize:"0.72rem", color: C.mid, marginTop:"0.3rem" },
  nota:       { fontSize:"0.7rem", color: C.muted, lineHeight:1.6 },
  notasBox:   { padding:"0.75rem 0", marginBottom:"0.5rem", borderTop:`1px solid ${C.border}`, marginTop:"0.5rem" },

  resumenBox: { background: C.cream3, border:`1px solid ${C.border}`, borderRadius:12, padding:"1rem", marginBottom:"0.75rem" },
  resumenFila:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.75rem", padding:"0.28rem 0", borderBottom:`1px solid ${C.border}` },

  precioBox:  { background: C.cream3, border:`1px solid ${C.border}`, borderRadius:12, padding:"1.15rem", marginBottom:"1rem" },
  precioFila: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.3rem 0" },

  avisoBox:   { background:"rgba(245,193,7,0.1)", border:"1px solid rgba(245,193,7,0.3)", borderRadius:12, padding:"1rem", marginBottom:"1rem" },
  checkCircle:{ width:64, height:64, borderRadius:"50%", border:`2px solid ${C.ink}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28, color:C.ink },
  termsRow:   { display:"flex", alignItems:"flex-start", gap:"0.65rem", cursor:"pointer", marginTop:"0.5rem" },
  errBox:     { padding:"0.8rem 1rem", background:"rgba(192,41,14,0.08)", border:"1px solid rgba(192,41,14,0.2)", borderRadius:10, color:"#c0290e", fontSize:"0.82rem", marginTop:"0.75rem" },
};