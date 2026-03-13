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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .rm{font-family:'DM Sans',sans-serif;background:#EDE5D0;min-height:100vh;color:#2d2820}

  .rm-hdr{background:#2d2820;padding:18px 28px;display:flex;align-items:center;justify-content:space-between}
  .rm-hdr h1{font-family:'Playfair Display',serif;font-size:1.35rem;color:#EDE5D0;font-weight:500}
  .rm-hdr small{font-size:.72rem;color:#9a9080;display:block;margin-top:2px}
  .rm-live{background:#22c55e18;border:1px solid #22c55e40;color:#22c55e;font-size:.68rem;padding:4px 12px;border-radius:20px;font-weight:700;letter-spacing:.08em}

  .rm-tabs{background:#2d2820;padding:0 28px;display:flex;gap:2px;border-bottom:1px solid #ffffff12;overflow-x:auto}
  .rm-tab{padding:11px 16px;border:none;background:transparent;color:#9a9080;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;flex-shrink:0}
  .rm-tab.on{color:#EDE5D0;border-bottom-color:#22c55e}
  .rm-tab:hover:not(.on){color:#D4CBB8}

  .rm-main{padding:24px 28px;max-width:1180px;margin:0 auto}

  .rm-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:4px}
  .rm-kpi{background:#f2f2f2;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:3px}
  .rm-kpi-num{font-size:1.75rem;font-weight:700;color:#1a1a1a;font-family:'Playfair Display',serif;line-height:1;letter-spacing:-.02em}
  .rm-kpi-num.accent-orange{color:#c2650a}
  .rm-kpi-num.accent-green{color:#1a7a3c}
  .rm-kpi-num.kpi-money{font-size:1.35rem}
  .rm-kpi-label{font-size:.72rem;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.07em;margin-top:6px}
  .rm-kpi-sub{font-size:.67rem;color:#aaa;font-weight:400}

  .rm-cal-wrap{background:#fff;border-radius:18px;border:1.5px solid #D4CBB8;overflow:hidden;box-shadow:0 2px 16px rgba(26,22,17,.06)}
  .rm-cal-hdr{background:#2d2820;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
  .rm-cal-mes{font-family:'Playfair Display',serif;font-size:1.2rem;color:#EDE5D0;font-weight:500}
  .rm-cal-nav{background:transparent;border:1px solid #ffffff20;color:#D4CBB8;border-radius:8px;width:34px;height:34px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .rm-cal-nav:hover{background:#ffffff15;color:#EDE5D0}
  .rm-cal-grid{display:grid;grid-template-columns:repeat(7,1fr)}
  .rm-cal-dow{padding:10px 0;text-align:center;font-size:.68rem;font-weight:700;color:#9a9080;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #EDE5D0}
  .rm-cal-day{min-height:90px;padding:8px;border-right:1px solid #EDE5D0;border-bottom:1px solid #EDE5D0;position:relative;transition:background .15s;vertical-align:top}
  .rm-cal-day:nth-child(7n){border-right:none}
  .rm-cal-day.vacio{background:#faf8f5}
  .rm-cal-day.bloqueado{background:#fef2f2;cursor:not-allowed}
  .rm-cal-day.bloqueado .rm-dia-num{text-decoration:line-through;color:#dc2626}
  .rm-cal-day.hoy .rm-dia-num{background:#2d2820;color:#EDE5D0;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .rm-cal-day.tiene-viajes{cursor:pointer}
  .rm-cal-day.tiene-viajes:hover{background:#f5f0e8}
  .rm-cal-day.tiene-viajes:active{background:#ede5d0}
  .rm-dia-num{font-size:.8rem;font-weight:600;color:#2d2820;margin-bottom:5px;width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .rm-dia-num.otro-mes{color:#C8BEA8}
  .rm-dia-dots{display:flex;flex-direction:column;gap:3px}
  .rm-dia-dot{display:flex;align-items:center;gap:4px;padding:2px 5px;border-radius:5px;font-size:.62rem;font-weight:600;white-space:nowrap;overflow:hidden}
  .rm-dia-dot.compartido{background:#dbeafe;color:#1e40af}
  .rm-dia-dot.privado{background:#fff3e0;color:#b45309}
  .rm-dia-dot.bloq-tag{background:#fecaca;color:#991b1b;font-size:.58rem}
  .rm-dia-total{margin-top:4px;font-size:.62rem;color:#9a9080;font-weight:500}

  .rm-ov{position:fixed;inset:0;background:rgba(26,22,17,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .rm-modal{background:#fff;border-radius:20px;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.28)}
  .rm-modal-hdr{background:#2d2820;padding:20px 24px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1}
  .rm-modal-titulo{font-family:'Playfair Display',serif;font-size:1.1rem;color:#EDE5D0;font-weight:500}
  .rm-modal-sub{font-size:.75rem;color:#9a9080;margin-top:2px}
  .rm-modal-close{background:transparent;border:1px solid #ffffff20;color:#9a9080;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .rm-modal-close:hover{background:#ffffff15;color:#EDE5D0}
  .rm-modal-body{padding:20px 24px}
  .rm-modal-seccion{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9a9080;margin:16px 0 10px;padding-bottom:6px;border-bottom:1px solid #EDE5D0}
  .rm-modal-seccion:first-child{margin-top:0}
  .rm-viaje-card{background:#faf8f5;border:1.5px solid #E8E0D0;border-radius:12px;padding:14px 16px;margin-bottom:10px}
  .rm-viaje-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .rm-viaje-card-ruta{font-weight:700;font-size:.9rem;color:#2d2820}
  .rm-viaje-card-meta{font-size:.72rem;color:#9a9080;margin-top:2px}
  .rm-viaje-card-r{text-align:right}
  .rm-pasajeros-list{display:flex;flex-direction:column;gap:6px}
  .rm-pax-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#fff;border-radius:8px;border:1px solid #E8E0D0}
  .rm-pax-info{flex:1;min-width:0}
  .rm-pax-name{font-size:.82rem;font-weight:600;color:#2d2820;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rm-pax-sub{font-size:.7rem;color:#9a9080;margin-top:1px}
  .rm-pax-actions{display:flex;gap:5px;flex-shrink:0}
  .rm-modal-empty{text-align:center;padding:32px 20px;color:#9a9080;font-size:.85rem}

  .rm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
  .rm-stat{background:#fff;border-radius:14px;padding:18px 20px;border:1.5px solid #D4CBB8;position:relative;overflow:hidden}
  .rm-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
  .rm-stat.s1::before{background:#3b82f6}.rm-stat.s2::before{background:#f07700}
  .rm-stat.s3::before{background:#22c55e}.rm-stat.s4::before{background:#7c3aed}
  .rm-sval-lg{font-size:1.9rem;font-weight:700;color:#2d2820;font-family:'Playfair Display',serif;line-height:1}

  .rm-filters{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;align-items:center}
  .rm-fbtn{padding:7px 16px;border-radius:20px;border:1.5px solid #D4CBB8;background:transparent;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;cursor:pointer;color:#9a9080;transition:all .2s}
  .rm-fbtn.on{background:#2d2820;border-color:#2d2820;color:#EDE5D0}
  .rm-fbtn:hover:not(.on){border-color:#9a9080;color:#2d2820}
  .rm-date{padding:7px 14px;border-radius:20px;border:1.5px solid #D4CBB8;background:transparent;font-family:'DM Sans',sans-serif;font-size:.8rem;color:#2d2820}

  .rm-cards{display:flex;flex-direction:column;gap:14px}
  .rm-card{background:#fff;border-radius:16px;border:1.5px solid #D4CBB8;overflow:hidden;transition:box-shadow .2s}
  .rm-card:hover{box-shadow:0 4px 18px rgba(26,22,17,.1)}
  .rm-card.cancelado-card{background:#fef9f9;border-color:#fca5a580}
  .rm-card-hd{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;border-bottom:1px solid transparent;transition:border-color .2s}
  .rm-card.open .rm-card-hd{border-bottom-color:#EDE5D0}
  .rm-card-l{display:flex;align-items:center;gap:12px}
  .rm-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:1.15rem;flex-shrink:0}
  .rm-ruta{font-size:.95rem;font-weight:700;color:#2d2820}
  .rm-meta{font-size:.75rem;color:#9a9080;margin-top:2px}
  .rm-card-r{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .rm-prog{text-align:right}
  .rm-prog-lbl{font-size:.7rem;color:#9a9080;margin-bottom:3px}
  .rm-prog-bar{width:88px;height:5px;background:#EDE5D0;border-radius:10px;overflow:hidden}
  .rm-prog-fill{height:100%;border-radius:10px;transition:width .4s}
  .rm-estado{font-size:.7rem;font-weight:700;padding:4px 11px;border-radius:20px;white-space:nowrap;letter-spacing:.03em}
  .rm-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:5px}
  .rm-btn-cobrar{background:#2d2820;color:#EDE5D0;border:none;border-radius:9px;padding:8px 14px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s;animation:pulse 2s infinite}
  .rm-btn-cobrar:hover{background:#3d3829;transform:translateY(-1px)}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(240,119,0,.35)}50%{box-shadow:0 0 0 7px rgba(240,119,0,0)}}
  .rm-btn-eliminar{background:transparent;color:#dc2626;border:1.5px solid #fca5a5;border-radius:9px;padding:7px 13px;font-family:'DM Sans',sans-serif;font-size:.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s;white-space:nowrap}
  .rm-btn-eliminar:hover{background:#fef2f2;border-color:#dc2626}
  .rm-chevron{color:#9a9080;font-size:.65rem;transition:transform .2s;margin-left:4px}
  .rm-card.open .rm-chevron{transform:rotate(180deg)}

  .rm-detail{padding:20px}
  .rm-table{width:100%;border-collapse:collapse}
  .rm-table th{text-align:left;font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:#9a9080;font-weight:700;padding:7px 10px;border-bottom:1.5px solid #EDE5D0}
  .rm-table td{padding:10px 10px;font-size:.82rem;color:#2d2820;border-bottom:1px solid #EDE5D0;vertical-align:middle}
  .rm-table tr:last-child td{border-bottom:none}
  .rm-table tr:hover td{background:#faf8f5}
  .rm-pax-name{font-weight:600}
  .rm-pax-sub2{font-size:.7rem;color:#9a9080;margin-top:1px}
  .rm-act{display:flex;gap:5px;flex-wrap:wrap}
  .rm-btn{border:1.5px solid #D4CBB8;background:transparent;border-radius:7px;padding:4px 10px;font-size:.72rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;transition:all .15s;color:#2d2820}
  .rm-btn:hover{background:#EDE5D0}
  .rm-btn.green{border-color:#22c55e50;color:#2d6a4f;background:#e8f5e9}
  .rm-btn.green:hover{background:#c6e6cc}
  .rm-btn.red{border-color:#fca5a5;color:#991b1b;background:#fef2f2}
  .rm-btn:disabled{opacity:.45;cursor:not-allowed}
  .rm-detail-ft{display:flex;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid #EDE5D0;align-items:center;flex-wrap:wrap}
  .rm-detail-ft-info{flex:1;font-size:.78rem;color:#9a9080}
  .rm-btn-wa-lg{background:#22c55e;color:#fff;border:none;border-radius:9px;padding:9px 14px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s}
  .rm-btn-wa-lg:hover{background:#16a34a}
  .rm-btn-ghost{border:1.5px solid #D4CBB8;background:transparent;border-radius:9px;padding:9px 14px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;color:#9a9080;transition:all .2s}
  .rm-btn-ghost:hover{border-color:#9a9080;color:#2d2820}

  .rm-form-wrap{background:#fff;border-radius:16px;border:1.5px solid #D4CBB8;padding:28px}
  .rm-form-title{font-family:'Playfair Display',serif;font-size:1.1rem;color:#2d2820;margin-bottom:6px}
  .rm-form-sub{font-size:.82rem;color:#9a9080;margin-bottom:22px}
  .rm-form-section{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9a9080;margin:20px 0 12px;padding-bottom:6px;border-bottom:1px solid #EDE5D0}
  .rm-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .rm-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
  .rm-col2{grid-column:1/-1}
  .rm-field{display:flex;flex-direction:column;gap:5px}
  .rm-field label{font-size:.73rem;font-weight:600;color:#9a9080;text-transform:uppercase;letter-spacing:.05em}
  .rm-field label span{color:#dc2626}
  .rm-field input,.rm-field select,.rm-field textarea{padding:9px 13px;border-radius:10px;border:1.5px solid #D4CBB8;font-family:'DM Sans',sans-serif;font-size:.85rem;color:#2d2820;background:#faf8f5;transition:border-color .2s}
  .rm-field input:focus,.rm-field select:focus,.rm-field textarea:focus{outline:none;border-color:#9a9080;background:#fff}
  .rm-field input.err,.rm-field select.err{border-color:#dc2626}
  .rm-field-hint{font-size:.7rem;color:#9a9080;margin-top:2px}
  .rm-form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px;padding-top:18px;border-top:1px solid #EDE5D0}
  .rm-btn-primary{background:#2d2820;color:#EDE5D0;border:none;border-radius:10px;padding:11px 26px;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .2s}
  .rm-btn-primary:hover:not(:disabled){background:#3d3829}
  .rm-btn-primary:disabled{opacity:.5;cursor:not-allowed}
  .rm-preview{background:#EDE5D0;border-radius:12px;padding:16px 20px;margin-top:20px;display:flex;gap:20px;flex-wrap:wrap;align-items:center}
  .rm-preview-item{text-align:center}
  .rm-preview-lbl{font-size:.68rem;color:#9a9080;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
  .rm-preview-val{font-size:1rem;font-weight:700;color:#2d2820;margin-top:2px}

  .rm-toast{position:fixed;bottom:24px;right:24px;background:#2d2820;color:#EDE5D0;padding:13px 20px;border-radius:11px;font-size:.85rem;font-weight:500;z-index:999;animation:tin .3s ease;box-shadow:0 6px 20px rgba(0,0,0,.22);max-width:320px}
  @keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .rm-dlg{background:#fff;border-radius:18px;padding:28px;max-width:460px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.22)}
  .rm-dlg h3{font-family:'Playfair Display',serif;font-size:1.15rem;color:#2d2820;margin-bottom:10px}
  .rm-dlg p{font-size:.85rem;color:#9a9080;line-height:1.6;margin-bottom:20px}
  .rm-dlg-btns{display:flex;gap:10px;justify-content:flex-end}
  .rm-btn-confirm{background:#2d2820;color:#EDE5D0;border:none;border-radius:9px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:.83rem;font-weight:700;cursor:pointer}
  .rm-btn-confirm:hover{background:#3d3829}
  .rm-btn-danger{background:#dc2626;color:#fff;border:none;border-radius:9px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-size:.83rem;font-weight:700;cursor:pointer}
  .rm-loading{text-align:center;padding:60px 20px;color:#9a9080}
  .rm-spinner{width:30px;height:30px;border:3px solid #D4CBB8;border-top-color:#2d2820;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .rm-empty{text-align:center;padding:50px 20px;color:#9a9080;font-size:.88rem}
  .rm-success{text-align:center;padding:40px 20px}
  .rm-success-icon{font-size:3rem;margin-bottom:16px}
  .rm-success h3{font-family:'Playfair Display',serif;font-size:1.2rem;color:#2d2820;margin-bottom:8px}
  .rm-success p{font-size:.85rem;color:#9a9080;margin-bottom:20px}

  @media(max-width:768px){
    .rm-kpi-grid,.rm-stats{grid-template-columns:repeat(2,1fr)}
    .rm-main{padding:16px}
    .rm-prog{display:none}
    .rm-grid,.rm-grid-3{grid-template-columns:1fr}
    .rm-table th:nth-child(3),.rm-table td:nth-child(3){display:none}
    .rm-cal-day{min-height:65px;padding:5px}
    .rm-cal-dow{font-size:.6rem}
  }
`;

// ─── BloqueoPanel ─────────────────────────────────────────────
function BloqueoPanel({ bloqueos, onBloqueoDia, onBloqueoMes, onEliminar }) {
  const [tipo,   setTipo]   = useState("dia");
  const [fecha,  setFecha]  = useState("");
  const [mes,    setMes]    = useState("");
  const [anio,   setAnio]   = useState(new Date().getFullYear());
  const [motivo, setMotivo] = useState("");

  const handleAgregar = () => {
    if (tipo === "dia") onBloqueoDia(fecha, motivo);
    else onBloqueoMes(mes, anio, motivo);
    setFecha(""); setMes(""); setMotivo("");
  };

  return (
    <div className="rm-form-wrap">
      <div className="rm-form-title">🔒 Bloquear fechas</div>
      <div className="rm-form-sub">Los días o meses bloqueados no permitirán nuevas reservas desde la web.</div>

      <div className="rm-form-section">Tipo de bloqueo</div>
      <div style={{ display:"flex", gap:10, marginBottom:18 }}>
        <button className={`rm-fbtn ${tipo==="dia"?"on":""}`} onClick={()=>setTipo("dia")}>📅 Por día</button>
        <button className={`rm-fbtn ${tipo==="mes"?"on":""}`} onClick={()=>setTipo("mes")}>🗓️ Por mes completo</button>
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

      <div className="rm-form-actions">
        <button className="rm-btn-primary" onClick={handleAgregar}>🔒 Agregar bloqueo</button>
      </div>

      <div className="rm-form-section" style={{marginTop:28}}>
        Bloqueos activos ({bloqueos.length})
      </div>
      {bloqueos.length === 0 && <div className="rm-empty">Sin bloqueos activos.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {bloqueos.map(b => (
          <div key={b.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:12 }}>
            <div>
              <div style={{ fontSize:".85rem", fontWeight:600, color:"#991b1b" }}>
                {b.tipo==="dia" ? `📅 ${b.fecha}` : `🗓️ ${MESES_LABEL[b.mes]} ${b.anio}`}
              </div>
              {b.motivo && <div style={{ fontSize:".72rem", color:"#9a9080", marginTop:2 }}>{b.motivo}</div>}
            </div>
            <button className="rm-btn red" onClick={()=>onEliminar(b.id)}>✕ Eliminar</button>
          </div>
        ))}
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

  const esBloqueado = (fechaStr) => {
    const f = new Date(fechaStr + "T12:00:00");
    return bloqueos.some(b =>
      (b.tipo === "dia" && b.fecha === fechaStr) ||
      (b.tipo === "mes" && b.mes === f.getMonth()+1 && b.anio === f.getFullYear())
    );
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

          const tieneViajes  = celda.viajes?.length > 0;
          const esHoy        = celda.fecha === todayKey;
          const bloqueado    = esBloqueado(celda.fecha);
          const compartidos  = celda.viajes?.filter(v => v.tipo === "compartido") || [];
          const privados     = celda.viajes?.filter(v => v.tipo === "privado")    || [];
          const totalMonto   = celda.viajes?.reduce((acc, v) =>
            acc + (v.reservas?.flatMap(r=>r.pagos||[]).filter(p=>p.estado==="completado").reduce((s,p)=>s+p.monto,0)||0), 0) || 0;

          let clases = "rm-cal-day";
          if (bloqueado) clases += " bloqueado";
          else if (tieneViajes) clases += " tiene-viajes";
          if (esHoy) clases += " hoy";

          return (
            <div
              key={i}
              className={clases}
              onClick={() => !bloqueado && tieneViajes && onDiaClick(celda.fecha, celda.viajes)}
            >
              <div className="rm-dia-num">{celda.dia}</div>
              {bloqueado && <div className="rm-dia-dot bloq-tag">🔒 Bloqueado</div>}
              {!bloqueado && tieneViajes && (
                <div className="rm-dia-dots">
                  {compartidos.length > 0 && (
                    <div className="rm-dia-dot compartido">
                      🚌 {compartidos.length} · {compartidos.reduce((acc,v) =>
                        acc + (v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(r.num_asientos||1),0)||0),0)} pax
                    </div>
                  )}
                  {privados.length > 0 && (
                    <div className="rm-dia-dot privado">
                      🚐 {privados.length} · {privados.reduce((acc,v) =>
                        acc + (v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(r.num_asientos||1),0)||0),0)} pax
                    </div>
                  )}
                  {totalMonto > 0 && (
                    <div className="rm-dia-total">{fmtPeso(totalMonto)}</div>
                  )}
                </div>
              )}
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
  const agregarBloqueoDia = async (fecha, motivo) => {
    if (!fecha) { showToast("⚠️ Selecciona una fecha"); return; }
    const { error } = await supabase.from("bloqueos").insert({ tipo:"dia", fecha, motivo: motivo||null });
    if (!error) { showToast("🔒 Fecha bloqueada"); cargarBloqueos(); }
    else showToast("❌ "+error.message);
  };

  const agregarBloqueoMes = async (mes, anio, motivo) => {
    if (!mes || !anio) { showToast("⚠️ Selecciona mes y año"); return; }
    const { error } = await supabase.from("bloqueos").insert({ tipo:"mes", mes: Number(mes), anio: Number(anio), motivo: motivo||null });
    if (!error) { showToast("🔒 Mes bloqueado"); cargarBloqueos(); }
    else showToast("❌ "+error.message);
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
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span className="rm-live">● EN VIVO</span>
            <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:"1px solid #ffffff20",color:"#9a9080",borderRadius:"8px",padding:"5px 12px",fontFamily:"inherit",fontSize:".75rem",cursor:"pointer"}}>Salir</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="rm-tabs">
          {[
            ["dashboard",    "📅 Dashboard"],
            ["compartido",   "🚌 Compartido"],
            ["privado",      "🚐 Van Privada"],
            ["bloqueos",     "🔒 Bloqueos"],
            ["nuevo-viaje",  "🗓️ Nuevo viaje"],
            ["nueva-reserva","➕ Nueva reserva"],
          ].map(([k,l]) => (
            <button key={k} className={`rm-tab ${tab===k?"on":""}`} onClick={()=>{setTab(k);setSuccessViaje(null);}}>{l}</button>
          ))}
        </div>

        <div className="rm-main">

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:".7rem",color:"#aaa",letterSpacing:".06em",textTransform:"uppercase",fontWeight:600}}>Leyenda</span>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".72rem"}}>
                    <span style={{width:9,height:9,borderRadius:2,background:"#dbeafe",display:"inline-block",border:"1px solid #bfdbfe"}}/>
                    <span style={{color:"#1e40af",fontWeight:500}}>Compartido</span>
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".72rem"}}>
                    <span style={{width:9,height:9,borderRadius:2,background:"#fff3e0",display:"inline-block",border:"1px solid #fed7aa"}}/>
                    <span style={{color:"#b45309",fontWeight:500}}>Van privada</span>
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:5,fontSize:".72rem"}}>
                    <span style={{width:9,height:9,borderRadius:2,background:"#fecaca",display:"inline-block",border:"1px solid #fca5a5"}}/>
                    <span style={{color:"#991b1b",fontWeight:500}}>Bloqueado</span>
                  </span>
                  <span style={{fontSize:".7rem",color:"#bbb",marginLeft:"auto"}}>Pincha un día para ver detalles</span>
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
                <div className="rm-filters" style={{marginTop:-8}}>
                  <span style={{fontSize:".72rem",color:"#9a9080",fontWeight:600}}>Ruta:</span>
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
                : (
                  <div className="rm-cards">
                    {filtrados.length === 0 && <div className="rm-empty">No hay viajes con estos filtros.</div>}
                    {filtrados.map(viaje => {
                      const cfg  = ESTADO_CFG[viaje.estado] || ESTADO_CFG.en_espera;
                      const conf = viaje.reservas?.filter(r=>r.estado==="confirmada").length||0;
                      const pagados = viaje.reservas?.filter(r=>r.pagos?.some(p=>p.estado==="completado")).length||0;
                      const pct  = viaje.capacidad ? Math.min((conf/viaje.capacidad)*100,100) : 0;
                      const isOpen = abierto===viaje.id;
                      const ingresos = viaje.reservas?.flatMap(r=>r.pagos||[]).filter(p=>p.estado==="completado").reduce((s,p)=>s+p.monto,0)||0;
                      const isCancelado = viaje.estado==="cancelado";

                      return (
                        <div key={viaje.id} className={`rm-card ${isOpen?"open":""} ${isCancelado?"cancelado-card":""}`}>
                          <div className="rm-card-hd" onClick={()=>setAbierto(isOpen?null:viaje.id)}>
                            <div className="rm-card-l">
                              <div className="rm-icon" style={{background:isCancelado?"#fef2f2":viaje.tipo==="compartido"?"#EDE5D0":"#f0f0f0",opacity:isCancelado?0.7:1}}>
                                {viaje.tipo==="compartido"?"🚌":"🚐"}
                              </div>
                              <div>
                                <div className="rm-ruta" style={{opacity:isCancelado?0.6:1,textDecoration:isCancelado?"line-through":"none"}}>
                                  {viaje.ruta?.nombre||"Ruta sin nombre"}
                                </div>
                                <div className="rm-meta">
                                  {fmtFechaCorta(viaje.fecha)} · {viaje.hora_salida?.slice(0,5)} · {fmtPeso(viaje.precio_por_pax)}/pax
                                  {viaje.vehiculo?` · ${viaje.vehiculo}`:""}
                                  {viaje.conductor?` · 👤 ${viaje.conductor}`:""}
                                </div>
                              </div>
                            </div>
                            <div className="rm-card-r">
                              {viaje.tipo==="compartido" && !isCancelado && (
                                <div className="rm-prog">
                                  <div className="rm-prog-lbl">{conf}/{viaje.capacidad} pax</div>
                                  <div className="rm-prog-bar">
                                    <div className="rm-prog-fill" style={{width:`${pct}%`,background:pct>=100?"#22c55e":pct>50?"#f07700":"#D4CBB8"}}/>
                                  </div>
                                </div>
                              )}
                              <span className="rm-estado" style={{color:cfg.color,background:cfg.bg}}>
                                <span className="rm-dot" style={{background:cfg.dot}}/>{cfg.label}
                              </span>
                              {viaje.estado==="listo_para_cobrar" && (
                                <button className="rm-btn-cobrar" onClick={e=>{e.stopPropagation();enviarCobro(viaje)}}>💳 Enviar cobro</button>
                              )}
                              {isCancelado && (
                                <button className="rm-btn-eliminar" onClick={e=>{e.stopPropagation();eliminarViajeCancelado(viaje);}}>🗑️ Eliminar</button>
                              )}
                              <span className="rm-chevron">▼</span>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="rm-detail">
                              {(!viaje.reservas||viaje.reservas.length===0) ? (
                                <div className="rm-empty" style={{padding:"20px 0"}}>
                                  Sin reservas.
                                  {!isCancelado && (
                                    <button className="rm-btn" style={{marginLeft:8}} onClick={()=>{setFormRes(f=>({...f,viaje_id:viaje.id}));setTab("nueva-reserva");}}>+ Agregar</button>
                                  )}
                                </div>
                              ) : (
                                <table className="rm-table">
                                  <thead><tr>
                                    <th>Pasajero</th><th>Estado</th><th>Contacto</th><th>Pago</th><th>Acciones</th>
                                  </tr></thead>
                                  <tbody>
                                    {viaje.reservas.map(r => {
                                      const pagado = r.pagos?.some(p=>p.estado==="completado");
                                      return (
                                        <tr key={r.id}>
                                          <td>
                                            <div className="rm-pax-name">{r.nombre}</div>
                                            <div className="rm-pax-sub2">{r.num_asientos} asiento(s) · {r.origen_reserva}</div>
                                          </td>
                                          <td>
                                            <span className="rm-estado" style={{
                                              color:r.estado==="confirmada"?"#2d6a4f":r.estado==="cancelada"?"#991b1b":"#9a9080",
                                              background:r.estado==="confirmada"?"#e8f5e9":r.estado==="cancelada"?"#fef2f2":"#f5f0e8",
                                              fontSize:".68rem"
                                            }}>
                                              <span className="rm-dot" style={{background:r.estado==="confirmada"?"#40916c":r.estado==="cancelada"?"#dc2626":"#9a9080"}}/>
                                              {r.estado}
                                            </span>
                                          </td>
                                          <td>
                                            <div className="rm-pax-sub2">📧 {r.email}</div>
                                            <div className="rm-pax-sub2">📱 {r.telefono}</div>
                                          </td>
                                          <td>
                                            <span className="rm-estado" style={{color:pagado?"#2d6a4f":"#b85c00",background:pagado?"#e8f5e9":"#fff3e0",fontSize:".68rem"}}>
                                              {pagado?"✓ Pagado":"Pendiente"}
                                            </span>
                                          </td>
                                          <td>
                                            <div className="rm-act">
                                              {!isCancelado && r.estado==="pendiente"  && <button className="rm-btn" onClick={()=>confirmarPasajero(r.id)}>✓</button>}
                                              {!isCancelado && r.estado==="confirmada" && !pagado && <button className="rm-btn green" onClick={()=>marcarPagado(r.id,viaje.precio_por_pax*r.num_asientos)}>💳</button>}
                                              {!isCancelado && r.estado!=="cancelada"  && <button className="rm-btn red" onClick={()=>cancelarPasajero(r.id,r.nombre)}>✕</button>}
                                              <button className="rm-btn" onClick={()=>{
                                                const msg=encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, te contactamos desde *Araucanía Viajes* por tu reserva ${viaje.ruta?.nombre} el ${fmtFechaCorta(viaje.fecha)}.`);
                                                window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                                              }}>💬</button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                              <div className="rm-detail-ft">
                                <div className="rm-detail-ft-info">
                                  {pagados}/{conf} pagaron · Recaudado: {fmtPeso(ingresos)}
                                  {viaje.notas_admin && <span> · 📝 {viaje.notas_admin}</span>}
                                </div>
                                {viaje.estado==="listo_para_cobrar" && (
                                  <button className="rm-btn-cobrar" onClick={()=>enviarCobro(viaje)}>💳 Enviar cobro</button>
                                )}
                                {!isCancelado && (
                                  <button className="rm-btn-ghost" style={{borderColor:"#fca5a5",color:"#991b1b"}} onClick={()=>cancelarViaje(viaje)}>🚫 Cancelar viaje</button>
                                )}
                                {isCancelado && (
                                  <button className="rm-btn-eliminar" onClick={()=>eliminarViajeCancelado(viaje)}>🗑️ Eliminar permanentemente</button>
                                )}
                                {!isCancelado && <button className="rm-btn-wa-lg" onClick={()=>showToast("📨 Función de grupo próximamente")}>📢 Grupo</button>}
                                <button className="rm-btn-ghost" onClick={cargarViajes}>🔄</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
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