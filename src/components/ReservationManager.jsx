import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://pyloifgprupypgkhkqmx.supabase.co",
  "sb_publishable_UN__-qAOLiEli5p9xY9ypQ_Qr9wxajL"
);

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Credenciales incorrectas. Intenta de nuevo.");
    else onLogin();
  };

  const loginCss = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
    .lg-root{min-height:100vh;background:#2d2820;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',sans-serif}
    .lg-card{background:#EDE5D0;border-radius:24px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
    .lg-logo{font-size:2.2rem;text-align:center;margin-bottom:6px}
    .lg-title{font-family:'Playfair Display',serif;font-size:1.45rem;color:#2d2820;text-align:center;font-weight:500;margin-bottom:4px}
    .lg-sub{font-size:.78rem;color:#9a9080;text-align:center;margin-bottom:28px}
    .lg-field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
    .lg-field label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9a9080}
    .lg-input-wrap{position:relative}
    .lg-input{width:100%;padding:11px 14px;border-radius:11px;border:1.5px solid #D4CBB8;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#2d2820;background:#fff;transition:border-color .2s;outline:none}
    .lg-input:focus{border-color:#2d2820}
    .lg-input.err{border-color:#dc2626}
    .lg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:#9a9080}
    .lg-error{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;font-size:.8rem;color:#991b1b;margin-bottom:16px;display:flex;align-items:center;gap:7px}
    .lg-btn{width:100%;padding:13px;border-radius:11px;background:#2d2820;color:#EDE5D0;border:none;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:4px}
    .lg-btn:hover:not(:disabled){background:#3d3829;transform:translateY(-1px)}
    .lg-btn:disabled{opacity:.6;cursor:not-allowed}
    .lg-footer{text-align:center;margin-top:20px;font-size:.72rem;color:#9a9080}
    .lg-spinner{width:18px;height:18px;border:2px solid #D4CBB840;border-top-color:#EDE5D0;border-radius:50%;animation:lgspin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px}
    @keyframes lgspin{to{transform:rotate(360deg)}}
  `;

  return (
    <>
      <style>{loginCss}</style>
      <div className="lg-root">
        <div className="lg-card">
          <div className="lg-logo">🚐</div>
          <div className="lg-title">Araucanía Viajes</div>
          <div className="lg-sub">Panel de administración — acceso privado</div>
          {error && <div className="lg-error">⚠️ {error}</div>}
          <form onSubmit={handleLogin}>
            <div className="lg-field">
              <label>Correo electrónico</label>
              <input className={`lg-input ${error?"err":""}`} type="email" placeholder="tu@correo.com"
                value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
            </div>
            <div className="lg-field">
              <label>Contraseña</label>
              <div className="lg-input-wrap">
                <input className={`lg-input ${error?"err":""}`} type={showPass?"text":"password"} placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/>
                <button type="button" className="lg-eye" onClick={()=>setShowPass(s=>!s)}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>
            <button className="lg-btn" type="submit" disabled={loading}>
              {loading ? <><span className="lg-spinner"/>Verificando…</> : "Entrar al panel"}
            </button>
          </form>
          <div className="lg-footer">araucaniaviajes.cl · MULTIX SPA</div>
        </div>
      </div>
    </>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────
function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (session === undefined) return (
    <div style={{minHeight:"100vh",background:"#2d2820",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:36,height:36,border:"3px solid #D4CBB840",borderTopColor:"#EDE5D0",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!session) return <LoginScreen onLogin={() => supabase.auth.getSession().then(({data})=>setSession(data.session))} />;
  return children;
}

// ─── Helpers ──────────────────────────────────────────────────
const fmtPeso  = (n) => `$${Number(n||0).toLocaleString("es-CL")}`;
const fmtFecha = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}) : "";
const fmtFechaCorta = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short"}) : "";

const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_LABEL = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_CFG = {
  en_espera:         { label:"En espera",           color:"#9a9080", bg:"#f5f0e8", dot:"#9a9080" },
  listo_para_cobrar: { label:"¡Listo para cobrar!", color:"#b85c00", bg:"#fff3e0", dot:"#f07700" },
  confirmado:        { label:"Viaje confirmado",     color:"#2d6a4f", bg:"#e8f5e9", dot:"#40916c" },
  cancelado:         { label:"Cancelado",            color:"#991b1b", bg:"#fef2f2", dot:"#dc2626" },
  completado:        { label:"Completado",           color:"#374151", bg:"#f3f4f6", dot:"#6b7280" },
};

// ─── CSS Global ───────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .rm{font-family:'DM Sans',sans-serif;background:#f7f5f2;min-height:100vh;color:#1a1611}

  /* ── Header oscuro (igual al wireframe) ── */
  .rm-hdr{background:#1a1611;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
  .rm-hdr h1{font-family:'DM Sans',sans-serif;font-size:1.1rem;color:#fff;font-weight:700;display:flex;align-items:center;gap:8px}
  .rm-hdr small{font-size:.68rem;color:#9a8e80;display:block;margin-top:1px;font-weight:400}
  .rm-live{background:#16a34a;border:none;color:#fff;font-size:.65rem;padding:4px 12px;border-radius:99px;font-weight:700;letter-spacing:.04em;display:flex;align-items:center;gap:4px}

  /* ── Tabs limpios sobre fondo blanco ── */
  .rm-tabs{background:#fff;padding:0 24px;display:flex;gap:0;border-bottom:1.5px solid #ede8e0;overflow-x:auto}
  .rm-tab{padding:13px 20px;border:none;background:transparent;color:#9a8e80;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;flex-shrink:0}
  .rm-tab.on{color:#1a1611;border-bottom-color:#1a1611}
  .rm-tab:hover:not(.on){color:#4a3f35}

  /* ── Main ── */
  .rm-main{padding:20px 24px;max-width:1100px;margin:0 auto}

  /* ── KPIs ── */
  .rm-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
  .rm-kpi{background:#fff;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:3px;border:1px solid #ede8e0}
  .rm-kpi-num{font-size:1.75rem;font-weight:700;color:#1a1611;font-family:'Playfair Display',serif;line-height:1;letter-spacing:-.03em}
  .rm-kpi-num.accent-orange{color:#d97706}
  .rm-kpi-num.accent-green{color:#16a34a}
  .rm-kpi-num.kpi-money{font-size:1.25rem}
  .rm-kpi-label{font-size:.65rem;font-weight:700;color:#9a8e80;text-transform:uppercase;letter-spacing:.08em;margin-top:8px}
  .rm-kpi-sub{font-size:.62rem;color:#c0b8b0}

  /* ── Calendario ── */
  .rm-cal-wrap{background:#fff;border-radius:16px;border:1px solid #ede8e0;overflow:hidden}
  .rm-cal-hdr{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f2ede6}
  .rm-cal-mes{font-family:'DM Sans',sans-serif;font-size:1rem;color:#1a1611;font-weight:700}
  .rm-cal-nav{background:#f7f5f2;border:1px solid #ede8e0;color:#6b5e4e;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .rm-cal-nav:hover{background:#ede8e0;color:#1a1611}
  .rm-cal-grid{display:grid;grid-template-columns:repeat(7,1fr)}
  .rm-cal-dow{padding:8px 0;text-align:center;font-size:.62rem;font-weight:700;color:#c0b8b0;text-transform:uppercase;letter-spacing:.06em;background:#faf8f5}
  .rm-cal-day{min-height:76px;padding:7px;border-right:1px solid #f2ede6;border-bottom:1px solid #f2ede6;position:relative;transition:background .12s}
  .rm-cal-day:nth-child(7n){border-right:none}
  .rm-cal-day.vacio{background:#faf8f5}
  .rm-cal-day.bloqueado{background:#fff0f0;cursor:not-allowed}
  .rm-cal-day.bloqueado .rm-dia-num{text-decoration:line-through;color:#f87171}
  .rm-cal-day.hoy .rm-dia-num{background:#1a1611;color:#fff;border-radius:99px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .rm-cal-day.tiene-viajes{cursor:pointer}
  .rm-cal-day.tiene-viajes:hover{background:#faf5ee}
  .rm-dia-num{font-size:.75rem;font-weight:600;color:#1a1611;margin-bottom:4px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .rm-dia-num.otro-mes{color:#d4cfc8}
  .rm-dia-dots{display:flex;flex-direction:column;gap:3px}
  .rm-dia-dot{display:flex;align-items:center;gap:3px;padding:1px 6px;border-radius:99px;font-size:.55rem;font-weight:700;white-space:nowrap;overflow:hidden}
  .rm-dia-dot.compartido{background:#eff6ff;color:#2563eb}
  .rm-dia-dot.privado{background:#fff7ed;color:#c2410c}
  .rm-dia-dot.bloq-tag{background:#fee2e2;color:#b91c1c}
  .rm-dia-total{margin-top:2px;font-size:.55rem;color:#b0a898;font-weight:600}

  /* ── Modal ── */
  .rm-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .rm-modal{background:#fff;border-radius:20px;width:100%;max-width:600px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .rm-modal-hdr{background:#1a1611;padding:18px 22px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1}
  .rm-modal-titulo{font-family:'DM Sans',sans-serif;font-size:1rem;color:#fff;font-weight:700}
  .rm-modal-sub{font-size:.7rem;color:#9a8e80;margin-top:2px}
  .rm-modal-close{background:#ffffff18;border:none;color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .rm-modal-close:hover{background:#ffffff30}
  .rm-modal-body{padding:18px 22px}
  .rm-modal-seccion{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#b0a898;margin:14px 0 10px;padding-bottom:5px;border-bottom:1px solid #f2ede6}
  .rm-modal-seccion:first-child{margin-top:0}
  .rm-viaje-card{background:#faf8f5;border:1px solid #ede8e0;border-radius:12px;padding:12px 14px;margin-bottom:8px}
  .rm-viaje-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .rm-viaje-card-ruta{font-weight:700;font-size:.85rem;color:#1a1611}
  .rm-viaje-card-meta{font-size:.68rem;color:#b0a898;margin-top:2px}
  .rm-pasajeros-list{display:flex;flex-direction:column;gap:5px}
  .rm-pax-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#fff;border-radius:10px;border:1px solid #f2ede6}
  .rm-pax-info{flex:1;min-width:0}
  .rm-pax-name{font-size:.8rem;font-weight:600;color:#1a1611;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rm-pax-sub{font-size:.65rem;color:#b0a898;margin-top:1px}
  .rm-pax-actions{display:flex;gap:4px;flex-shrink:0}
  .rm-modal-empty{text-align:center;padding:28px 20px;color:#b0a898;font-size:.82rem}

  /* ── Sección header en tabs ── */
  .rm-sec-hdr{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b0a898;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #ede8e0}

  /* ── Tarjetas de reserva (por pasajero, como wireframe) ── */
  .rm-res-card{background:#fff;border-radius:14px;border:1px solid #ede8e0;padding:14px 16px;transition:box-shadow .15s,transform .15s;cursor:pointer}
  .rm-res-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06);transform:translateY(-1px)}
  .rm-res-card.cancelado-card{background:#fffafa;border-color:#ffd6d6;opacity:.7}
  .rm-res-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px}
  .rm-res-nombre{font-size:.9rem;font-weight:700;color:#1a1611}
  .rm-res-badge{font-size:.62rem;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
  .rm-res-badge.compartido{background:#eff6ff;color:#2563eb}
  .rm-res-badge.privado{background:#fff7ed;color:#c2410c}
  .rm-res-badge.cancelado{background:#f2f2f2;color:#9a8e80}
  .rm-res-ruta{font-size:.78rem;color:#6b5e4e;margin-bottom:6px;font-weight:500}
  .rm-res-meta{display:flex;align-items:center;gap:12px;font-size:.75rem;color:#9a8e80}
  .rm-res-meta span{display:flex;align-items:center;gap:3px;font-weight:500}
  .rm-res-actions{display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #f2ede6;flex-wrap:wrap}

  /* ── Filtros ── */
  .rm-filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
  .rm-fbtn{padding:6px 16px;border-radius:99px;border:1.5px solid #ede8e0;background:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;color:#9a8e80;transition:all .15s}
  .rm-fbtn.on{background:#1a1611;border-color:#1a1611;color:#fff}
  .rm-fbtn:hover:not(.on){border-color:#9a8e80;color:#1a1611}
  .rm-date{padding:6px 14px;border-radius:99px;border:1.5px solid #ede8e0;background:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;color:#1a1611}

  /* ── Botones de acción ── */
  .rm-btn{border:1.5px solid #ede8e0;background:#fff;border-radius:99px;padding:4px 12px;font-size:.7rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;transition:all .12s;color:#6b5e4e}
  .rm-btn:hover{background:#f7f5f2;border-color:#c0b8b0}
  .rm-btn.green{border-color:#bbf7d0;color:#15803d;background:#f0fdf4}
  .rm-btn.green:hover{background:#dcfce7}
  .rm-btn.red{border-color:#fecaca;color:#b91c1c;background:#fff5f5}
  .rm-btn:disabled{opacity:.4;cursor:not-allowed}
  .rm-btn-cobrar{background:#f97316;color:#fff;border:none;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .15s}
  .rm-btn-cobrar:hover{background:#ea6c0a}
  .rm-btn-eliminar{background:transparent;color:#ef4444;border:1.5px solid #fecaca;border-radius:99px;padding:5px 12px;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;transition:all .15s}
  .rm-btn-eliminar:hover{background:#fff5f5}
  .rm-btn-wa-lg{background:#16a34a;color:#fff;border:none;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .15s}
  .rm-btn-wa-lg:hover{background:#15803d}
  .rm-btn-ghost{border:1.5px solid #ede8e0;background:#fff;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;cursor:pointer;color:#9a8e80;transition:all .15s}
  .rm-btn-ghost:hover{border-color:#9a8e80;color:#1a1611}

  /* ── Formularios ── */
  .rm-form-wrap{background:#fff;border-radius:16px;border:1px solid #ede8e0;padding:24px}
  .rm-form-title{font-family:'DM Sans',sans-serif;font-size:1rem;color:#1a1611;margin-bottom:4px;font-weight:700}
  .rm-form-sub{font-size:.78rem;color:#b0a898;margin-bottom:20px;line-height:1.5}
  .rm-form-section{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#b0a898;margin:18px 0 10px;padding-bottom:5px;border-bottom:1px solid #f2ede6}
  .rm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .rm-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .rm-col2{grid-column:1/-1}
  .rm-field{display:flex;flex-direction:column;gap:4px}
  .rm-field label{font-size:.65rem;font-weight:700;color:#b0a898;text-transform:uppercase;letter-spacing:.06em}
  .rm-field label span{color:#ef4444}
  .rm-field input,.rm-field select,.rm-field textarea{padding:9px 12px;border-radius:10px;border:1.5px solid #ede8e0;font-family:'DM Sans',sans-serif;font-size:.83rem;color:#1a1611;background:#faf8f5;transition:border-color .12s}
  .rm-field input:focus,.rm-field select:focus,.rm-field textarea:focus{outline:none;border-color:#1a1611;background:#fff}
  .rm-field input.err,.rm-field select.err{border-color:#ef4444}
  .rm-field-hint{font-size:.65rem;color:#b0a898;margin-top:2px}
  .rm-form-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid #f2ede6}
  .rm-btn-primary{background:#1a1611;color:#fff;border:none;border-radius:99px;padding:10px 26px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .15s}
  .rm-btn-primary:hover:not(:disabled){background:#2d2820;transform:translateY(-1px)}
  .rm-btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .rm-preview{background:#f7f5f2;border-radius:12px;padding:14px 16px;margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center}
  .rm-preview-item{text-align:center}
  .rm-preview-lbl{font-size:.6rem;color:#b0a898;text-transform:uppercase;letter-spacing:.07em;font-weight:700}
  .rm-preview-val{font-size:.9rem;font-weight:700;color:#1a1611;margin-top:2px}

  /* ── Toast / Dialog / Utils ── */
  .rm-toast{position:fixed;bottom:20px;right:20px;background:#1a1611;color:#fff;padding:11px 20px;border-radius:99px;font-size:.8rem;font-weight:600;z-index:999;animation:tin .22s ease;box-shadow:0 6px 20px rgba(0,0,0,.2);max-width:300px}
  @keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .rm-dlg{background:#fff;border-radius:20px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.15)}
  .rm-dlg h3{font-family:'DM Sans',sans-serif;font-size:1rem;color:#1a1611;margin-bottom:8px;font-weight:700}
  .rm-dlg p{font-size:.8rem;color:#9a8e80;line-height:1.6;margin-bottom:18px}
  .rm-dlg-btns{display:flex;gap:8px;justify-content:flex-end}
  .rm-btn-confirm{background:#1a1611;color:#fff;border:none;border-radius:99px;padding:8px 20px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer}
  .rm-btn-confirm:hover{background:#2d2820}
  .rm-btn-danger{background:#ef4444;color:#fff;border:none;border-radius:99px;padding:8px 20px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer}
  .rm-btn-danger:hover{background:#dc2626}
  .rm-loading{text-align:center;padding:50px 20px;color:#b0a898}
  .rm-spinner{width:26px;height:26px;border:2.5px solid #ede8e0;border-top-color:#1a1611;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .rm-empty{text-align:center;padding:40px 20px;color:#b0a898;font-size:.82rem}
  .rm-success{text-align:center;padding:36px 20px}
  .rm-success-icon{font-size:2.5rem;margin-bottom:12px}
  .rm-success h3{font-size:1.05rem;color:#1a1611;margin-bottom:6px;font-weight:700}
  .rm-success p{font-size:.8rem;color:#9a8e80;margin-bottom:18px}

  /* ── Tarjetas viejas (compatibilidad) ── */
  .rm-cards{display:flex;flex-direction:column;gap:8px}
  .rm-card{background:#fff;border-radius:14px;border:1px solid #ede8e0;overflow:hidden}
  .rm-card.cancelado-card{opacity:.65}
  .rm-card-hd{padding:13px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border-bottom:1px solid transparent}
  .rm-card.open .rm-card-hd{border-bottom-color:#f2ede6}
  .rm-card-l{display:flex;align-items:center;gap:10px}
  .rm-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
  .rm-ruta{font-size:.88rem;font-weight:700;color:#1a1611}
  .rm-meta{font-size:.7rem;color:#b0a898;margin-top:2px}
  .rm-card-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .rm-prog{text-align:right}
  .rm-prog-lbl{font-size:.62rem;color:#b0a898;margin-bottom:2px}
  .rm-prog-bar{width:72px;height:3px;background:#f2ede6;border-radius:99px;overflow:hidden}
  .rm-prog-fill{height:100%;border-radius:99px;transition:width .4s}
  .rm-estado{font-size:.62rem;font-weight:700;padding:3px 10px;border-radius:99px;white-space:nowrap}
  .rm-dot{width:5px;height:5px;border-radius:50%;display:inline-block;margin-right:4px}
  .rm-chevron{color:#c0b8b0;font-size:.55rem;transition:transform .15s;margin-left:3px}
  .rm-card.open .rm-chevron{transform:rotate(180deg)}
  .rm-detail{padding:14px 16px}
  .rm-table{width:100%;border-collapse:collapse}
  .rm-table th{text-align:left;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:#b0a898;font-weight:700;padding:5px 8px;border-bottom:1px solid #f2ede6}
  .rm-table td{padding:9px 8px;font-size:.78rem;color:#1a1611;border-bottom:1px solid #f7f5f2;vertical-align:middle}
  .rm-table tr:last-child td{border-bottom:none}
  .rm-table tr:hover td{background:#faf8f5}
  .rm-pax-name{font-weight:600}
  .rm-pax-sub2{font-size:.65rem;color:#b0a898;margin-top:1px}
  .rm-act{display:flex;gap:4px;flex-wrap:wrap}
  .rm-detail-ft{display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f2ede6;align-items:center;flex-wrap:wrap}
  .rm-detail-ft-info{flex:1;font-size:.72rem;color:#b0a898}

  @media(max-width:768px){
    .rm-kpi-grid{grid-template-columns:repeat(2,1fr)}
    .rm-main{padding:12px}
    .rm-prog{display:none}
    .rm-grid,.rm-grid-3{grid-template-columns:1fr}
    .rm-table th:nth-child(3),.rm-table td:nth-child(3){display:none}
    .rm-cal-day{min-height:55px;padding:4px}
    .rm-cal-dow{font-size:.55rem}
  }
`;


// ─── BloqueoPanel ─────────────────────────────────────────────
const TIPO_VIAJE_CFG = {
  ambos:      { label:"🚌🚐 Ambos",       bg:"#f2f2f2", color:"#6b5e4e" },
  compartido: { label:"🚌 Compartido",    bg:"#eff6ff", color:"#2563eb" },
  privado:    { label:"🚐 Van privada",   bg:"#fff7ed", color:"#c2410c" },
};

function BloqueoPanel({ bloqueos, onBloqueoDia, onBloqueoMes, onEliminar }) {
  const [tipo,      setTipo]      = useState("dia");
  const [fecha,     setFecha]     = useState("");
  const [mes,       setMes]       = useState("");
  const [anio,      setAnio]      = useState(new Date().getFullYear());
  const [motivo,    setMotivo]    = useState("");
  const [tipoViaje, setTipoViaje] = useState("ambos");

  const handleAgregar = () => {
    if (tipo === "dia") onBloqueoDia(fecha, motivo, tipoViaje);
    else onBloqueoMes(mes, anio, motivo, tipoViaje);
    setFecha(""); setMes(""); setMotivo(""); setTipoViaje("ambos");
  };

  return (
    <div className="rm-form-wrap">
      <div className="rm-form-title">🔒 Bloquear fechas</div>
      <div className="rm-form-sub">Los días o meses bloqueados no permitirán nuevas reservas desde la web.</div>

      <div className="rm-form-section">Período</div>
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button className={`rm-fbtn ${tipo==="dia"?"on":""}`} onClick={()=>setTipo("dia")}>📅 Por día</button>
        <button className={`rm-fbtn ${tipo==="mes"?"on":""}`} onClick={()=>setTipo("mes")}>🗓️ Por mes</button>
      </div>

      {tipo === "dia" ? (
        <div className="rm-grid">
          <div className="rm-field">
            <label>Fecha a bloquear</label>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
          </div>
          <div className="rm-field">
            <label>Motivo (opcional)</label>
            <input placeholder="Ej: Feriado, mantención…" value={motivo} onChange={e=>setMotivo(e.target.value)}/>
          </div>
        </div>
      ) : (
        <div className="rm-grid">
          <div className="rm-field">
            <label>Mes</label>
            <select value={mes} onChange={e=>setMes(e.target.value)}>
              <option value="">Selecciona…</option>
              {MESES_LABEL.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="rm-field">
            <label>Año</label>
            <input type="number" min="2025" max="2030" value={anio} onChange={e=>setAnio(e.target.value)}/>
          </div>
          <div className="rm-field rm-col2">
            <label>Motivo (opcional)</label>
            <input placeholder="Ej: Temporada baja, sin conductor…" value={motivo} onChange={e=>setMotivo(e.target.value)}/>
          </div>
        </div>
      )}

      <div className="rm-form-section" style={{marginTop:18}}>Aplica a</div>
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        {Object.entries(TIPO_VIAJE_CFG).map(([id, cfg]) => (
          <button key={id} className={`rm-fbtn ${tipoViaje===id?"on":""}`} onClick={()=>setTipoViaje(id)}>
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="rm-form-actions">
        <button className="rm-btn-primary" onClick={handleAgregar}>🔒 Agregar bloqueo</button>
      </div>

      <div className="rm-form-section" style={{marginTop:28}}>
        Bloqueos activos ({bloqueos.length})
      </div>
      {bloqueos.length === 0 && <div className="rm-empty">Sin bloqueos activos.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {bloqueos.map(b => {
  const tvCfg = TIPO_VIAJE_CFG[b.aplica_a||"ambos"];
  return (
            <div key={b.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fff5f5", border:"1.5px solid #fecaca", borderRadius:12 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem", fontWeight:700, color:"#b91c1c" }}>
                  {b.tipo==="dia" ? `📅 ${b.fecha}` : `🗓️ ${MESES_LABEL[b.mes]} ${b.anio}`}
                  <span style={{ fontSize:".65rem", fontWeight:700, padding:"2px 8px", borderRadius:99, background:tvCfg.bg, color:tvCfg.color }}>
                    {tvCfg.label}
                  </span>
                </div>
                {b.motivo && <div style={{ fontSize:".7rem", color:"#9a8e80", marginTop:2 }}>{b.motivo}</div>}
              </div>
              <button className="rm-btn red" onClick={()=>onEliminar(b.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendario Dashboard ─────────────────────────────────────
function CalendarioDashboard({ viajes, bloqueos, onDiaClick }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [año, setAnio] = useState(hoy.getFullYear());

  const primerDia    = new Date(año, mes, 1).getDay();
  const diasEnMes    = new Date(año, mes + 1, 0).getDate();
  const diasAnterior = new Date(año, mes, 0).getDate();

  const viajesPorFecha = viajes
    .filter(v => v.estado !== "cancelado")
    .reduce((acc, v) => {
      if (!acc[v.fecha]) acc[v.fecha] = [];
      acc[v.fecha].push(v);
      return acc;
    }, {});

  const getBloqueosTipo = (fechaStr) => {
  const f = new Date(fechaStr + "T12:00:00");
  const activos = bloqueos.filter(b =>
    (b.tipo === "dia" && b.fecha === fechaStr) ||
    (b.tipo === "mes" && b.mes === f.getMonth()+1 && b.anio === f.getFullYear())
  );
  if (!activos.length) return new Set();
  const tipos = new Set();
  activos.forEach(b => {
    const a = b.aplica_a || "ambos";
    if (a === "ambos") { tipos.add("compartido"); tipos.add("privado"); }
    else tipos.add(a);
  });
  return tipos;
};
  const navMes = (delta) => {
    let nm = mes + delta, na = año;
    if (nm < 0)  { nm = 11; na--; }
    if (nm > 11) { nm = 0;  na++; }
    setMes(nm); setAnio(na);
  };

  const celdas = [];
  for (let i = primerDia - 1; i >= 0; i--) {
    celdas.push({ dia: diasAnterior - i, otroMes: true, fecha: null });
  }
  for (let d = 1; d <= diasEnMes; d++) {
    const mm  = String(mes + 1).padStart(2,"0");
    const dd  = String(d).padStart(2,"0");
    const key = `${año}-${mm}-${dd}`;
    celdas.push({ dia: d, otroMes: false, fecha: key, viajes: viajesPorFecha[key] || [] });
  }
  const resto = 7 - (celdas.length % 7);
  if (resto < 7) {
    for (let i = 1; i <= resto; i++) celdas.push({ dia: i, otroMes: true, fecha: null });
  }

  const todayKey = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  return (
    <div className="rm-cal-wrap">
      <div className="rm-cal-hdr">
        <button className="rm-cal-nav" onClick={() => navMes(-1)}>◀</button>
        <span className="rm-cal-mes">{MESES[mes]} {año}</span>
        <button className="rm-cal-nav" onClick={() => navMes(1)}>▶</button>
      </div>
      <div className="rm-cal-grid">
        {DIAS_SEMANA.map(d => <div key={d} className="rm-cal-dow">{d}</div>)}
      </div>
      <div className="rm-cal-grid">
        {celdas.map((celda, i) => {
          if (celda.otroMes) return (
            <div key={i} className="rm-cal-day vacio">
              <div className="rm-dia-num otro-mes">{celda.dia}</div>
            </div>
          );

          const tieneViajes = celda.viajes?.length > 0;
const esHoy       = celda.fecha === todayKey;
const bloqueados  = getBloqueosTipo(celda.fecha);
const totBlq      = bloqueados.has("compartido") && bloqueados.has("privado");
const parcBlq     = bloqueados.size > 0 && !totBlq;
const compartidos = celda.viajes?.filter(v => v.tipo === "compartido") || [];
const privados    = celda.viajes?.filter(v => v.tipo === "privado")    || [];
const paxComp     = compartidos.reduce((a,v) => a + (v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+r.num_asientos,0)||0), 0);
const paxPriv     = privados.reduce((a,v)    => a + (v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+r.num_asientos,0)||0), 0);

let clases = "rm-cal-day";
if (totBlq && !tieneViajes)     clases += " bloqueado";
else if (totBlq && tieneViajes) clases += " bloqueado-con-viaje";
else if (parcBlq)               clases += " parcial-bloqueado";
else if (tieneViajes)           clases += " tiene-viajes";
if (esHoy) clases += " hoy";

          return (
            <div
              key={i}
              className={clases}
              onClick={() => tieneViajes && onDiaClick(celda.fecha, celda.viajes)}
            >
             <div className="rm-dia-dots">
  {totBlq && <div className="rm-dia-dot bloq-tag">🔒 Cerrado</div>}
  {parcBlq && bloqueados.has("compartido") && (
    <div className="rm-dia-dot bloq-tag">🔒 Sin compartido</div>
  )}
  {parcBlq && bloqueados.has("privado") && (
    <div className="rm-dia-dot bloq-tag">🔒 Sin privados</div>
  )}
  {compartidos.length > 0 && (
    <div className="rm-dia-dot compartido">
      🚌 {compartidos.length} viaje{compartidos.length>1?"s":""} · {paxComp} pax
    </div>
  )}
  {privados.length > 0 && (
    <div className="rm-dia-dot privado">
      🚐 {privados.length} viaje{privados.length>1?"s":""} · {paxPriv} pax
    </div>
  )}
</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal día ────────────────────────────────────────────────
function ModalDia({ fecha, viajes, onClose, onConfirmarPasajero, onCancelarPasajero, onMarcarPagado, onCancelarViaje }) {
  if (!fecha) return null;

  const compartidos = viajes.filter(v => v.tipo === "compartido");
  const privados    = viajes.filter(v => v.tipo === "privado");

  const SeccionViaje = ({ viaje }) => {
    const cfg = ESTADO_CFG[viaje.estado] || ESTADO_CFG.en_espera;
    const reservasActivas = viaje.reservas?.filter(r => r.estado !== "cancelada") || [];

    return (
      <div className="rm-viaje-card">
        <div className="rm-viaje-card-hdr">
          <div>
            <div className="rm-viaje-card-ruta">{viaje.ruta?.nombre || "Ruta sin nombre"}</div>
            <div className="rm-viaje-card-meta">
              {viaje.hora_salida?.slice(0,5)} · {fmtPeso(viaje.precio_por_pax)}/pax
              {viaje.conductor ? ` · 👤 ${viaje.conductor}` : ""}
            </div>
          </div>
          <div className="rm-viaje-card-r">
            <span className="rm-estado" style={{color:cfg.color,background:cfg.bg}}>
              <span className="rm-dot" style={{background:cfg.dot}}/>{cfg.label}
            </span>
          </div>
        </div>
        {reservasActivas.length === 0 ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px"}}>
            <span style={{fontSize:".78rem",color:"#9a9080"}}>Sin pasajeros activos</span>
            {viaje.estado !== "cancelado" && (
              <button className="rm-btn red" onClick={()=>onCancelarViaje(viaje)}>Cancelar viaje</button>
            )}
          </div>
        ) : (
          <div className="rm-pasajeros-list">
            {reservasActivas.map(r => {
              const pagado = r.pagos?.some(p=>p.estado==="completado");
              return (
                <div key={r.id} className="rm-pax-row">
                  <div className="rm-pax-info">
                    <div className="rm-pax-name">{r.nombre}</div>
                    <div className="rm-pax-sub">
                      {r.num_asientos} asiento(s) · {r.telefono} ·{" "}
                      <span style={{color:r.estado==="confirmada"?"#2d6a4f":"#9a9080",fontWeight:600}}>{r.estado}</span>
                      {" · "}<span style={{color:pagado?"#2d6a4f":"#b45309",fontWeight:600}}>{pagado?"✓ pagado":"pendiente"}</span>
                    </div>
                  </div>
                  <div className="rm-pax-actions">
                    {r.estado === "pendiente" && (
                      <button className="rm-btn green" onClick={()=>onConfirmarPasajero(r.id)}>✓</button>
                    )}
                    {r.estado === "confirmada" && !pagado && (
                      <button className="rm-btn green" onClick={()=>onMarcarPagado(r.id, viaje.precio_por_pax * r.num_asientos)}>💳</button>
                    )}
                    <button className="rm-btn" onClick={()=>{
                      const msg = encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, te contactamos desde *Araucanía Viajes* por tu reserva del ${fmtFechaCorta(fecha)}.`);
                      window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                    }}>💬</button>
                    <button className="rm-btn red" onClick={()=>onCancelarPasajero(r.id, r.nombre)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rm-ov" onClick={onClose}>
      <div className="rm-modal" onClick={e=>e.stopPropagation()}>
        <div className="rm-modal-hdr">
          <div>
            <div className="rm-modal-titulo">📅 {fmtFecha(fecha)}</div>
            <div className="rm-modal-sub">
              {viajes.length} viaje(s) · {viajes.reduce((acc,v)=>
                acc+(v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(r.num_asientos||1),0)||0),0)} pasajeros
            </div>
          </div>
          <button className="rm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="rm-modal-body">
          {compartidos.length > 0 && (
            <>
              <div className="rm-modal-seccion">🚌 Compartidos ({compartidos.length})</div>
              {compartidos.map(v => <SeccionViaje key={v.id} viaje={v}/>)}
            </>
          )}
          {privados.length > 0 && (
            <>
              <div className="rm-modal-seccion">🚐 Vans Privadas ({privados.length})</div>
              {privados.map(v => <SeccionViaje key={v.id} viaje={v}/>)}
            </>
          )}
          {viajes.length === 0 && (
            <div className="rm-modal-empty">No hay viajes activos en este día.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manager Principal ────────────────────────────────────────
function ReservationManagerInner() {
  const [tab,          setTab]          = useState("dashboard");
  const [viajes,       setViajes]       = useState([]);
  const [rutas,        setRutas]        = useState([]);
  const [bloqueos,     setBloqueos]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [abierto,      setAbierto]      = useState(null);
  const [filtroTipo,   setFiltroTipo]   = useState("todos");
  const [filtroFecha,  setFiltroFecha]  = useState("");
  const [filtroRuta,   setFiltroRuta]   = useState("todas");
  const [toast,        setToast]        = useState(null);
  const [dialog,       setDialog]       = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [successViaje, setSuccessViaje] = useState(null);
  const [modalDia,     setModalDia]     = useState(null);

  const FORM_VIAJE_INIT = { ruta_id:"", tipo:"compartido", fecha:"", hora_salida:"08:00", capacidad:8, precio_por_pax:"", conductor:"", vehiculo:"", notas_admin:"" };
  const FORM_RES_INIT   = { viaje_id:"", nombre:"", email:"", telefono:"", num_asientos:1, notas:"", origen_reserva:"telefono" };
  const [formViaje, setFormViaje] = useState(FORM_VIAJE_INIT);
  const [formRes,   setFormRes]   = useState(FORM_RES_INIT);
  const [errViaje,  setErrViaje]  = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 3800); };

  // ── Carga ──────────────────────────────────────────────────
  const cargarViajes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("viajes")
      .select(`*, ruta:rutas(nombre,origen,destino),
        reservas(id,nombre,email,telefono,num_asientos,estado,notas,origen_reserva,created_at,
          pagos(id,monto,estado,metodo,referencia,fecha_pago))`)
      .order("fecha",      { ascending: true })
      .order("hora_salida",{ ascending: true });
    if (!error) setViajes(data || []);
    setLoading(false);
  }, []);

  const cargarRutas = useCallback(async () => {
    const { data } = await supabase.from("rutas").select("*").eq("activa",true).order("nombre");
    setRutas(data||[]);
  }, []);

  const cargarBloqueos = useCallback(async () => {
    const { data } = await supabase.from("bloqueos").select("*").order("created_at", { ascending: false });
    setBloqueos(data || []);
  }, []);

  useEffect(() => {
    cargarViajes(); cargarRutas(); cargarBloqueos();
    const ch = supabase.channel("rm-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"viajes"  },cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"reservas"},cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"pagos"   },cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"bloqueos"},cargarBloqueos)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [cargarViajes, cargarRutas, cargarBloqueos]);

  // ── Stats ──────────────────────────────────────────────────
  const stats = {
    total:       viajes.filter(v=>v.estado!=="cancelado").length,
    cobrar:      viajes.filter(v=>v.estado==="listo_para_cobrar").length,
    confirmados: viajes.filter(v=>v.estado==="confirmado").length,
    ingresos:    viajes.reduce((acc,v)=>
      acc+(v.reservas?.flatMap(r=>r.pagos||[]).filter(p=>p.estado==="completado").reduce((s,p)=>s+p.monto,0)||0),0),
  };

  // ── Filtrado ───────────────────────────────────────────────
  const filtrados = viajes.filter(v => {
    const tipoOk  = filtroTipo==="todos" || v.tipo===filtroTipo;
    const fechaOk = !filtroFecha || v.fecha===filtroFecha;
    const rutaOk  = tab!=="privado" || filtroRuta==="todas" || v.ruta?.nombre===filtroRuta;
    const tabOk   = tab==="dashboard"  ? true
                  : tab==="compartido" ? v.tipo==="compartido"
                  : tab==="privado"    ? v.tipo==="privado"
                  : true;
    return tipoOk && fechaOk && tabOk && rutaOk;
  });

  // ── Acciones reservas ──────────────────────────────────────
  const confirmarPasajero = async (id) => {
    const { error } = await supabase.from("reservas").update({estado:"confirmada"}).eq("id",id);
    if (!error) { showToast("✅ Pasajero confirmado"); cargarViajes(); }
    else showToast("❌ "+error.message);
  };

  const cancelarPasajero = (reservaId, nombre) => {
    setDialog({
      titulo:"Cancelar reserva",
      mensaje:`¿Cancelar la reserva de ${nombre}? Esta acción no se puede deshacer.`,
      danger:true,
      onConfirm: async () => {
        const { error } = await supabase.from("reservas").update({estado:"cancelada"}).eq("id",reservaId);
        if (!error) { showToast("🚫 Reserva cancelada"); cargarViajes(); }
        else showToast("❌ "+error.message);
        setDialog(null);
      }
    });
  };

  const marcarPagado = async (reservaId, precio) => {
    const { data: ex } = await supabase.from("pagos").select("id").eq("reserva_id",reservaId).eq("estado","completado").maybeSingle();
    if (ex) { showToast("⚠️ Ya tiene un pago registrado"); return; }
    const { error } = await supabase.from("pagos").insert({ reserva_id:reservaId, monto:precio, metodo:"transferencia", estado:"completado", fecha_pago:new Date().toISOString() });
    if (!error) { showToast("💳 Pago registrado"); cargarViajes(); }
    else showToast("❌ "+error.message);
  };

  const enviarCobro = (viaje) => {
    const pendientes = viaje.reservas?.filter(r=>r.estado==="confirmada"&&!r.pagos?.some(p=>p.estado==="completado"))||[];
    if (!pendientes.length) { showToast("ℹ️ Todos los pasajeros ya pagaron"); return; }
    setDialog({
      titulo:"Enviar solicitud de pago",
      mensaje:`Se enviará cobro a ${pendientes.length} pasajero(s) del viaje ${viaje.ruta?.nombre} el ${fmtFechaCorta(viaje.fecha)} por ${fmtPeso(viaje.precio_por_pax)} c/u.`,
      onConfirm: async () => {
        await supabase.from("notificaciones").insert(
          pendientes.map(r=>({
            reserva_id:r.id, viaje_id:viaje.id, canal:"whatsapp", tipo:"solicitud_pago",
            destinatario:r.telefono,
            mensaje:`Hola ${r.nombre.split(" ")[0]} 👋, el cupo del viaje ${viaje.ruta?.nombre} (${fmtFechaCorta(viaje.fecha)}) está completo. Realiza tu pago de ${fmtPeso(viaje.precio_por_pax)} para confirmar. — Araucanía Viajes 🚐`,
            estado:"enviado", enviado_at:new Date().toISOString()
          }))
        );
        showToast(`📨 Cobro enviado a ${pendientes.length} pasajero(s)`);
        setDialog(null);
      }
    });
  };

  const cancelarViaje = (viaje) => {
    setDialog({
      titulo:"Cancelar viaje",
      mensaje:`¿Cancelar el viaje ${viaje.ruta?.nombre} del ${fmtFechaCorta(viaje.fecha)}? Todas las reservas quedarán canceladas.`,
      danger:true,
      onConfirm: async () => {
        await supabase.from("viajes").update({estado:"cancelado"}).eq("id",viaje.id);
        await supabase.from("reservas").update({estado:"cancelada"}).eq("viaje_id",viaje.id);
        showToast("🚫 Viaje cancelado"); setDialog(null); cargarViajes();
      }
    });
  };

  const eliminarViajeCancelado = (viaje) => {
    setDialog({
      titulo:"🗑️ Eliminar viaje cancelado",
      mensaje:`¿Eliminar permanentemente el viaje ${viaje.ruta?.nombre} del ${fmtFechaCorta(viaje.fecha)}? Se borrarán también todas sus reservas y pagos.`,
      danger:true,
      onConfirm: async () => {
        const reservaIds = (viaje.reservas||[]).map(r=>r.id);
        if (reservaIds.length>0) {
          await supabase.from("pagos").delete().in("reserva_id",reservaIds);
          await supabase.from("reservas").delete().in("id",reservaIds);
        }
        const { error } = await supabase.from("viajes").delete().eq("id",viaje.id);
        if (!error) { showToast("🗑️ Viaje eliminado"); setAbierto(null); cargarViajes(); }
        else showToast("❌ Error al eliminar: "+error.message);
        setDialog(null);
      }
    });
  };

  // ── Bloqueos ───────────────────────────────────────────────
  const agregarBloqueoDia = async (fecha, motivo, aplica_a = "ambos") => {
  if (!fecha) { showToast("⚠️ Selecciona una fecha"); return; }
  const { error } = await supabase.from("bloqueos").insert({
    tipo: "dia", fecha, motivo: motivo || null, aplica_a
  });
  if (!error) { showToast("🔒 Fecha bloqueada"); cargarBloqueos(); }
  else showToast("❌ " + error.message);
};

  const agregarBloqueoMes = async (mes, anio, motivo, aplica_a = "ambos") => {
  if (!mes || !anio) { showToast("⚠️ Selecciona mes y año"); return; }
  const { error } = await supabase.from("bloqueos").insert({
    tipo: "mes", mes: Number(mes), anio: Number(anio), motivo: motivo || null, aplica_a
  });
  if (!error) { showToast("🔒 Mes bloqueado"); cargarBloqueos(); }
  else showToast("❌ " + error.message);
};

  const eliminarBloqueo = (id) => {
    setDialog({
      titulo: "Eliminar bloqueo",
      mensaje: "¿Eliminar este bloqueo? Los usuarios podrán volver a reservar en esa fecha.",
      danger: true,
      onConfirm: async () => {
        await supabase.from("bloqueos").delete().eq("id", id);
        showToast("✅ Bloqueo eliminado"); cargarBloqueos(); setDialog(null);
      }
    });
  };

  // ── Crear viaje ────────────────────────────────────────────
  const validarViaje = () => {
    const e = {};
    if (!formViaje.ruta_id) e.ruta_id=true;
    if (!formViaje.fecha)   e.fecha=true;
    if (!formViaje.hora_salida) e.hora_salida=true;
    if (!formViaje.precio_por_pax||Number(formViaje.precio_por_pax)<=0) e.precio_por_pax=true;
    if (!formViaje.capacidad||Number(formViaje.capacidad)<=0) e.capacidad=true;
    setErrViaje(e);
    return Object.keys(e).length===0;
  };

  const crearViaje = async () => {
    if (!validarViaje()) { showToast("⚠️ Completa los campos obligatorios"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("viajes").insert({
      ruta_id:       formViaje.ruta_id,
      tipo:          formViaje.tipo,
      fecha:         formViaje.fecha,
      hora_salida:   formViaje.hora_salida,
      capacidad:     Number(formViaje.capacidad),
      precio_por_pax:Number(formViaje.precio_por_pax),
      conductor:     formViaje.conductor||null,
      vehiculo:      formViaje.vehiculo||null,
      notas_admin:   formViaje.notas_admin||null,
      estado:        "en_espera",
    }).select("*, ruta:rutas(nombre,origen,destino)").single();
    setSaving(false);
    if (!error) { setSuccessViaje(data); setFormViaje(FORM_VIAJE_INIT); setErrViaje({}); cargarViajes(); }
    else showToast("❌ Error: "+error.message);
  };

  const crearReserva = async () => {
    if (!formRes.viaje_id||!formRes.nombre||!formRes.email||!formRes.telefono) {
      showToast("⚠️ Completa los campos obligatorios"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("reservas").insert({...formRes,num_asientos:Number(formRes.num_asientos)});
    setSaving(false);
    if (!error) { showToast("✅ Reserva creada"); setFormRes(FORM_RES_INIT); cargarViajes(); }
    else showToast("❌ "+error.message);
  };

  const rutaSel = rutas.find(r=>r.id===formViaje.ruta_id);
  const rutasVanPrivada = [...new Set(viajes.filter(v=>v.tipo==="privado").map(v=>v.ruta?.nombre).filter(Boolean))];

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="rm">

        {/* Header */}
        <div className="rm-hdr">
          <div><h1>🚐 Manager de Reservas</h1><small>Araucanía Viajes · araucaniaviajes.cl</small></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span className="rm-live">● En vivo</span>
            <button onClick={()=>supabase.auth.signOut()} style={{background:"#ffffff18",border:"none",color:"#9a8e80",borderRadius:"99px",padding:"6px 14px",fontFamily:"inherit",fontSize:".72rem",fontWeight:600,cursor:"pointer"}}>
              Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="rm-tabs">
          {[
            ["dashboard",    "Calendario"],
            ["compartido",   "Compartido"],
            ["privado",      "Van Privada"],
            ["bloqueos",     "Bloqueos"],
            ["nuevo-viaje",  "Nuevo Viaje"],
            ["nueva-reserva","Nueva Reserva"],
          ].map(([k,l]) => (
            <button key={k} className={`rm-tab ${tab===k?"on":""}`} onClick={()=>{setTab(k);setSuccessViaje(null);}}>{l}</button>
          ))}
        </div>

        <div className="rm-main">

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <>
              <div style={{marginBottom:20}}>
                <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".75rem"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#2563eb",display:"inline-block"}}/>
                    <span style={{color:"#6b5e4e",fontWeight:500}}>Compartido</span>
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".75rem"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#c2410c",display:"inline-block"}}/>
                    <span style={{color:"#6b5e4e",fontWeight:500}}>Van privada</span>
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".75rem"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block"}}/>
                    <span style={{color:"#6b5e4e",fontWeight:500}}>Bloqueado</span>
                  </span>
                </div>
                {loading
                  ? <div className="rm-loading"><div className="rm-spinner"/><div>Cargando…</div></div>
                  : <CalendarioDashboard viajes={viajes} bloqueos={bloqueos} onDiaClick={(fecha,viajesDia)=>setModalDia({fecha,viajes:viajesDia})}/>
                }
              </div>
              <div className="rm-kpi-grid">
                <div className="rm-kpi">
                  <div className="rm-kpi-num">{stats.total}</div>
                  <div className="rm-kpi-label">Viajes activos</div>
                  <div className="rm-kpi-sub">en el sistema</div>
                </div>
                <div className="rm-kpi">
                  <div className="rm-kpi-num accent-orange">{stats.cobrar}</div>
                  <div className="rm-kpi-label">Por cobrar</div>
                  <div className="rm-kpi-sub">pendientes de pago</div>
                </div>
                <div className="rm-kpi">
                  <div className="rm-kpi-num accent-green">{stats.confirmados}</div>
                  <div className="rm-kpi-label">Confirmados</div>
                  <div className="rm-kpi-sub">pagos completos</div>
                </div>
                <div className="rm-kpi">
                  <div className="rm-kpi-num kpi-money">{fmtPeso(stats.ingresos)}</div>
                  <div className="rm-kpi-label">Ingresos</div>
                  <div className="rm-kpi-sub">cobrados este mes</div>
                </div>
              </div>
            </>
          )}

          {/* ── COMPARTIDO / PRIVADO ── */}
          {["compartido","privado"].includes(tab) && (
            <>
              <div className="rm-filters">
                <input type="date" className="rm-date" value={filtroFecha} onChange={e=>setFiltroFecha(e.target.value)}/>
                {filtroFecha && <button className="rm-fbtn" onClick={()=>setFiltroFecha("")}>✕ Limpiar</button>}
              </div>

              {tab === "privado" && rutasVanPrivada.length > 0 && (
                <div className="rm-filters" style={{marginTop:-6}}>
                  <button className={`rm-fbtn ${filtroRuta==="todas"?"on":""}`} onClick={()=>setFiltroRuta("todas")}>Todas</button>
                  {rutasVanPrivada.map(ruta => (
                    <button key={ruta} className={`rm-fbtn ${filtroRuta===ruta?"on":""}`} onClick={()=>setFiltroRuta(ruta)}>
                      {ruta.split("→")[0].trim().split(" ").slice(-1)[0]} → {ruta.split("→")[1]?.trim().split(",")[0]}
                    </button>
                  ))}
                </div>
              )}

              {loading
                ? <div className="rm-loading"><div className="rm-spinner"/><div>Cargando…</div></div>
                : (() => {
                    // Aplanar reservas por pasajero (como el wireframe)
                    const reservasFlat = filtrados.flatMap(viaje =>
                      (viaje.reservas||[]).map(r => ({ ...r, viaje }))
                    ).filter(r => r.estado !== "cancelada" || abierto === r.id);

                    if (reservasFlat.length === 0) return (
                      <div className="rm-empty">
                        No hay reservas activas.
                        <button className="rm-btn" style={{marginLeft:8,marginTop:8}} onClick={()=>setTab("nueva-reserva")}>+ Nueva reserva</button>
                      </div>
                    );

                    return (
                      <div>
                        <div className="rm-sec-hdr">
                          {tab==="compartido"?"COMPARTIDO":"VAN PRIVADA"} — RESERVAS ACTIVAS ({reservasFlat.length})
                        </div>
                        <div className="rm-cards">
                          {reservasFlat.map(r => {
                            const viaje  = r.viaje;
                            const pagado = r.pagos?.some(p=>p.estado==="completado");
                            const isOpen = abierto === r.id;

                            return (
                              <div key={r.id} className={`rm-res-card ${r.estado==="cancelada"?"cancelado-card":""}`}
                                onClick={()=>setAbierto(isOpen?null:r.id)}>
                                <div className="rm-res-card-top">
                                  <div className="rm-res-nombre">{r.nombre}</div>
                                  <span className={`rm-res-badge ${viaje.estado==="cancelado"?"cancelado":viaje.tipo}`}>
                                    {viaje.tipo==="compartido"?"Compartido":"Van Privada"}
                                  </span>
                                </div>
                                <div className="rm-res-ruta">{viaje.ruta?.nombre||"Ruta sin nombre"}</div>
                                <div className="rm-res-meta">
                                  <span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    {viaje.hora_salida?.slice(0,5)||"—"}
                                  </span>
                                  <span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    {r.num_asientos} pax
                                  </span>
                                  <span style={{color:pagado?"#16a34a":"#d97706",fontWeight:700}}>
                                    {fmtPeso(viaje.precio_por_pax * r.num_asientos)}
                                  </span>
                                  <span style={{color:pagado?"#16a34a":"#9a8e80",fontSize:".65rem"}}>
                                    {pagado?"✓ Pagado":"Pendiente"}
                                  </span>
                                </div>

                                {isOpen && (
                                  <div className="rm-res-actions" onClick={e=>e.stopPropagation()}>
                                    {r.estado==="pendiente" && (
                                      <button className="rm-btn green" onClick={()=>confirmarPasajero(r.id)}>✓ Confirmar</button>
                                    )}
                                    {r.estado==="confirmada" && !pagado && (
                                      <button className="rm-btn green" onClick={()=>marcarPagado(r.id, viaje.precio_por_pax*r.num_asientos)}>💳 Marcar pagado</button>
                                    )}
                                    <button className="rm-btn-wa-lg" onClick={()=>{
                                      const msg=encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, te contactamos desde *Araucanía Viajes* por tu reserva ${viaje.ruta?.nombre} el ${fmtFechaCorta(viaje.fecha)}.`);
                                      window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                                    }}>💬 WhatsApp</button>
                                    {r.estado!=="cancelada" && (
                                      <button className="rm-btn red" onClick={()=>cancelarPasajero(r.id,r.nombre)}>✕ Cancelar</button>
                                    )}
                                    {viaje.estado==="listo_para_cobrar" && (
                                      <button className="rm-btn-cobrar" onClick={()=>enviarCobro(viaje)}>💳 Enviar cobro</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
              }
            </>
          )}

          {/* ── BLOQUEOS ── */}
          {tab === "bloqueos" && (
            <BloqueoPanel
              bloqueos={bloqueos}
              onBloqueoDia={agregarBloqueoDia}
              onBloqueoMes={agregarBloqueoMes}
              onEliminar={eliminarBloqueo}
            />
          )}

          {/* ── NUEVO VIAJE ── */}
          {tab === "nuevo-viaje" && (
            <>
              {successViaje ? (
                <div className="rm-form-wrap rm-success">
                  <div className="rm-success-icon">🎉</div>
                  <h3>¡Viaje creado exitosamente!</h3>
                  <p>{successViaje.ruta?.nombre} · {fmtFechaCorta(successViaje.fecha)} · {successViaje.hora_salida?.slice(0,5)}</p>
                  <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                    <button className="rm-btn-primary" onClick={()=>setSuccessViaje(null)}>+ Crear otro viaje</button>
                    <button className="rm-btn-ghost" onClick={()=>{setFormRes(f=>({...f,viaje_id:successViaje.id}));setTab("nueva-reserva");}}>➕ Agregar reserva</button>
                    <button className="rm-btn-ghost" onClick={()=>setTab("dashboard")}>Ver dashboard</button>
                  </div>
                </div>
              ) : (
                <div className="rm-form-wrap">
                  <div className="rm-form-title">🗓️ Programar nuevo viaje</div>
                  <div className="rm-form-sub">Los campos con <span style={{color:"#dc2626"}}>*</span> son obligatorios.</div>

                  <div className="rm-form-section">1. Ruta y tipo de transporte</div>
                  <div className="rm-grid">
                    <div className="rm-field rm-col2">
                      <label>Ruta <span>*</span></label>
                      <select className={errViaje.ruta_id?"err":""} value={formViaje.ruta_id} onChange={e=>setFormViaje(f=>({...f,ruta_id:e.target.value}))}>
                        <option value="">Selecciona una ruta…</option>
                        {rutas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                      {errViaje.ruta_id && <span className="rm-field-hint" style={{color:"#dc2626"}}>Selecciona una ruta</span>}
                    </div>
                    <div className="rm-field">
                      <label>Tipo <span>*</span></label>
                      <select value={formViaje.tipo} onChange={e=>setFormViaje(f=>({...f,tipo:e.target.value}))}>
                        <option value="compartido">🚌 Compartido</option>
                        <option value="privado">🚐 Van privada</option>
                      </select>
                    </div>
                    <div className="rm-field">
                      <label>Capacidad <span>*</span></label>
                      <input type="number" min="1" max="20" className={errViaje.capacidad?"err":""} value={formViaje.capacidad} onChange={e=>setFormViaje(f=>({...f,capacidad:e.target.value}))}/>
                    </div>
                  </div>

                  <div className="rm-form-section">2. Fecha, hora y precio</div>
                  <div className="rm-grid-3">
                    <div className="rm-field">
                      <label>Fecha <span>*</span></label>
                      <input type="date" className={errViaje.fecha?"err":""} value={formViaje.fecha} onChange={e=>setFormViaje(f=>({...f,fecha:e.target.value}))}/>
                    </div>
                    <div className="rm-field">
                      <label>Hora salida <span>*</span></label>
                      <input type="time" value={formViaje.hora_salida} onChange={e=>setFormViaje(f=>({...f,hora_salida:e.target.value}))}/>
                    </div>
                    <div className="rm-field">
                      <label>Precio/pax (CLP) <span>*</span></label>
                      <input type="number" min="0" placeholder="Ej: 12000" className={errViaje.precio_por_pax?"err":""} value={formViaje.precio_por_pax} onChange={e=>setFormViaje(f=>({...f,precio_por_pax:e.target.value}))}/>
                      {formViaje.precio_por_pax > 0 && <span className="rm-field-hint">{fmtPeso(formViaje.precio_por_pax)} por asiento</span>}
                    </div>
                  </div>

                  <div className="rm-form-section">3. Conductor y vehículo (opcional)</div>
                  <div className="rm-grid">
                    <div className="rm-field">
                      <label>Conductor</label>
                      <input placeholder="Nombre del conductor" value={formViaje.conductor} onChange={e=>setFormViaje(f=>({...f,conductor:e.target.value}))}/>
                    </div>
                    <div className="rm-field">
                      <label>Vehículo / Patente</label>
                      <input placeholder="Ej: BCDF-12 · Van Hyundai" value={formViaje.vehiculo} onChange={e=>setFormViaje(f=>({...f,vehiculo:e.target.value}))}/>
                    </div>
                    <div className="rm-field rm-col2">
                      <label>Notas internas</label>
                      <textarea rows="2" placeholder="Punto de encuentro, indicaciones especiales…" value={formViaje.notas_admin} onChange={e=>setFormViaje(f=>({...f,notas_admin:e.target.value}))}/>
                    </div>
                  </div>

                  {(rutaSel||formViaje.fecha) && (
                    <div className="rm-preview">
                      <div style={{fontSize:"1.5rem"}}>{formViaje.tipo==="compartido"?"🚌":"🚐"}</div>
                      {rutaSel && <div className="rm-preview-item"><div className="rm-preview-lbl">Ruta</div><div className="rm-preview-val">{rutaSel.nombre}</div></div>}
                      {formViaje.fecha && <div className="rm-preview-item"><div className="rm-preview-lbl">Fecha</div><div className="rm-preview-val">{fmtFechaCorta(formViaje.fecha)}</div></div>}
                      {formViaje.hora_salida && <div className="rm-preview-item"><div className="rm-preview-lbl">Hora</div><div className="rm-preview-val">{formViaje.hora_salida}</div></div>}
                      {formViaje.precio_por_pax>0&&formViaje.capacidad && <div className="rm-preview-item"><div className="rm-preview-lbl">Potencial</div><div className="rm-preview-val" style={{color:"#2d6a4f"}}>{fmtPeso(formViaje.precio_por_pax*formViaje.capacidad)}</div></div>}
                    </div>
                  )}

                  <div className="rm-form-actions">
                    <button className="rm-btn-ghost" onClick={()=>{setFormViaje(FORM_VIAJE_INIT);setErrViaje({});}}>Limpiar</button>
                    <button className="rm-btn-primary" onClick={crearViaje} disabled={saving}>{saving?"Guardando…":"🗓️ Crear viaje"}</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── NUEVA RESERVA ── */}
          {tab === "nueva-reserva" && (
            <div className="rm-form-wrap">
              <div className="rm-form-title">➕ Agregar reserva manual</div>
              <div className="rm-form-sub">Para reservas recibidas por teléfono, WhatsApp o presencialmente.</div>

              <div className="rm-form-section">Viaje</div>
              <div className="rm-field">
                <label>Viaje <span style={{color:"#dc2626"}}>*</span></label>
                <select value={formRes.viaje_id} onChange={e=>setFormRes(f=>({...f,viaje_id:e.target.value}))}>
                  <option value="">Selecciona un viaje…</option>
                  {viajes.filter(v=>!["cancelado","completado"].includes(v.estado)).map(v=>(
                    <option key={v.id} value={v.id}>
                      {v.ruta?.nombre} · {fmtFechaCorta(v.fecha)} {v.hora_salida?.slice(0,5)} · {v.tipo} · {fmtPeso(v.precio_por_pax)}/pax
                    </option>
                  ))}
                </select>
              </div>

              <div className="rm-form-section">Pasajero</div>
              <div className="rm-grid">
                <div className="rm-field">
                  <label>Nombre completo <span style={{color:"#dc2626"}}>*</span></label>
                  <input placeholder="Ej: Ana Martínez" value={formRes.nombre} onChange={e=>setFormRes(f=>({...f,nombre:e.target.value}))}/>
                </div>
                <div className="rm-field">
                  <label>Teléfono <span style={{color:"#dc2626"}}>*</span></label>
                  <input placeholder="+56 9 1234 5678" value={formRes.telefono} onChange={e=>setFormRes(f=>({...f,telefono:e.target.value}))}/>
                </div>
                <div className="rm-field">
                  <label>Email <span style={{color:"#dc2626"}}>*</span></label>
                  <input type="email" placeholder="correo@email.com" value={formRes.email} onChange={e=>setFormRes(f=>({...f,email:e.target.value}))}/>
                </div>
                <div className="rm-field">
                  <label>Nº asientos</label>
                  <input type="number" min="1" max="8" value={formRes.num_asientos} onChange={e=>setFormRes(f=>({...f,num_asientos:e.target.value}))}/>
                </div>
                <div className="rm-field">
                  <label>Origen</label>
                  <select value={formRes.origen_reserva} onChange={e=>setFormRes(f=>({...f,origen_reserva:e.target.value}))}>
                    <option value="telefono">📞 Teléfono</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="web">🌐 Web</option>
                    <option value="presencial">🤝 Presencial</option>
                  </select>
                </div>
                <div className="rm-field rm-col2">
                  <label>Notas</label>
                  <textarea rows="2" placeholder="Petición especial, punto de encuentro…" value={formRes.notas} onChange={e=>setFormRes(f=>({...f,notas:e.target.value}))}/>
                </div>
              </div>

              <div className="rm-form-actions">
                <button className="rm-btn-ghost" onClick={()=>setFormRes(FORM_RES_INIT)}>Limpiar</button>
                <button className="rm-btn-primary" onClick={crearReserva} disabled={saving}>{saving?"Guardando…":"✓ Crear reserva"}</button>
              </div>
            </div>
          )}

        </div>

        {/* Toast */}
        {toast && <div className="rm-toast">{toast}</div>}

        {/* Dialog */}
        {dialog && !modalDia && (
          <div className="rm-ov" onClick={()=>setDialog(null)}>
            <div className="rm-dlg" onClick={e=>e.stopPropagation()}>
              <h3>{dialog.titulo}</h3>
              <p>{dialog.mensaje}</p>
              <div className="rm-dlg-btns">
                <button className="rm-btn-ghost" onClick={()=>setDialog(null)}>Cancelar</button>
                <button className={dialog.danger?"rm-btn-danger":"rm-btn-confirm"} onClick={dialog.onConfirm}>
                  {dialog.danger?"Sí, eliminar":"✓ Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal día */}
        {modalDia && (
          <ModalDia
            fecha={modalDia.fecha}
            viajes={modalDia.viajes}
            onClose={()=>setModalDia(null)}
            onConfirmarPasajero={confirmarPasajero}
            onCancelarPasajero={cancelarPasajero}
            onMarcarPagado={marcarPagado}
            onCancelarViaje={cancelarViaje}
          />
        )}

        {/* Dialog dentro del modal */}
        {dialog && modalDia && (
          <div className="rm-ov" style={{zIndex:300}} onClick={()=>setDialog(null)}>
            <div className="rm-dlg" onClick={e=>e.stopPropagation()}>
              <h3>{dialog.titulo}</h3>
              <p>{dialog.mensaje}</p>
              <div className="rm-dlg-btns">
                <button className="rm-btn-ghost" onClick={()=>setDialog(null)}>Cancelar</button>
                <button className={dialog.danger?"rm-btn-danger":"rm-btn-confirm"} onClick={dialog.onConfirm}>
                  {dialog.danger?"Sí, cancelar":"✓ Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default function ReservationManager() {
  return <AuthGate><ReservationManagerInner /></AuthGate>;
}