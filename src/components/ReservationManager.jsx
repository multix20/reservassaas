import React, { useState, useEffect, useCallback } from "react";
import supabase from "../lib/supabaseAdmin";

// ─── Helpers ──────────────────────────────────────────────────
const fmtPeso       = (n) => `$${Number(n||0).toLocaleString("es-CL")}`;
const fmtFecha      = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}) : "";
const fmtFechaCorta = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short"}) : "";

const DIAS_SEMANA  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES        = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_LABEL  = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_CFG = {
  en_espera:         { label:"En espera",           color:"#9a9080", bg:"#f5f0e8", dot:"#9a9080" },
  listo_para_cobrar: { label:"¡Listo para cobrar!", color:"#b85c00", bg:"#fff3e0", dot:"#f07700" },
  confirmado:        { label:"Viaje confirmado",     color:"#2d6a4f", bg:"#e8f5e9", dot:"#40916c" },
  cancelado:         { label:"Cancelado",            color:"#991b1b", bg:"#fef2f2", dot:"#dc2626" },
  completado:        { label:"Completado",           color:"#374151", bg:"#f3f4f6", dot:"#6b7280" },
};

const TIPO_VIAJE_CFG = {
  ambos:      { label:"🚌🚐 Ambos",     bg:"#f2f2f2", color:"#6b5e4e" },
  compartido: { label:"🚌 Compartido",  bg:"#eff6ff", color:"#2563eb" },
  privado:    { label:"🚐 Van privada", bg:"#fff7ed", color:"#c2410c" },
};

// ─── CSS ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .rm{font-family:'DM Sans',sans-serif;background:#f7f5f2;min-height:100vh;color:#1a1611}
  .rm-hdr{background:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ede8e0;position:sticky;top:0;z-index:100;box-shadow:0 1px 8px rgba(26,22,17,.06)}
  .rm-hdr-marca{display:flex;align-items:center;gap:10px}
  .rm-hdr-ico{width:36px;height:36px;border-radius:10px;background:#1a1611;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .rm-hdr-textos{display:flex;flex-direction:column;gap:0}
  .rm-hdr h1{font-family:'DM Sans',sans-serif;font-size:.88rem;color:#1a1611;font-weight:800;letter-spacing:-.01em;line-height:1.2;margin:0}
  .rm-hdr small{font-size:.62rem;color:#9a8e80;display:block;font-weight:500}
  .rm-hdr-actions{display:flex;align-items:center;gap:6px}
  .rm-live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:livePulse 1.5s ease-in-out infinite;flex-shrink:0}
  @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
  .rm-burger{width:36px;height:36px;border-radius:10px;border:1.5px solid #ede8e0;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .15s;flex-shrink:0}
  .rm-burger:hover{background:#f7f5f2;border-color:#c0b8b0}
  .rm-burger span{display:block;width:16px;height:1.5px;background:#1a1611;border-radius:2px;transition:all .2s}
  .rm-burger.open span:nth-child(1){transform:translateY(5.5px) rotate(45deg)}
  .rm-burger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
  .rm-burger.open span:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}
  .rm-drawer-ov{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:200;backdrop-filter:blur(2px);animation:fadeIn .15s ease}
  .rm-drawer{position:fixed;top:0;left:0;bottom:0;width:72vw;max-width:280px;background:#fff;z-index:201;display:flex;flex-direction:column;box-shadow:4px 0 24px rgba(0,0,0,.12);animation:slideRight .22s cubic-bezier(.4,0,.2,1)}
  @keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}
  .rm-drawer-hdr{padding:16px;border-bottom:1px solid #ede8e0;display:flex;align-items:center;gap:10px}
  .rm-drawer-ico{width:32px;height:32px;border-radius:8px;background:#1a1611;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .rm-drawer-titulo{font-size:.82rem;font-weight:800;color:#1a1611}
  .rm-drawer-sub{font-size:.62rem;color:#9a8e80;margin-top:1px}
  .rm-drawer-nav{flex:1;overflow-y:auto;padding:8px 0}
  .rm-drawer-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border:none;background:transparent;width:100%;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;color:#6b5e4e;transition:all .12s;text-align:left}
  .rm-drawer-item:hover{background:#f7f5f2;color:#1a1611}
  .rm-drawer-item.on{background:#f0ece4;color:#1a1611;font-weight:700}
  .rm-drawer-item.on .rm-drawer-item-ico{background:#1a1611;color:#F5EDD8}
  .rm-drawer-item-ico{width:32px;height:32px;border-radius:8px;background:#f0ece4;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;transition:all .12s}
  .rm-drawer-ft{padding:12px 16px;border-top:1px solid #ede8e0}
  .rm-btn-salir{width:100%;padding:10px;border-radius:10px;border:1.5px solid #ede8e0;background:#fff;color:#9a8e80;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s}
  .rm-btn-salir:hover{background:#1a1611;color:#F5EDD8;border-color:#1a1611}
  .rm-rol-badge{font-size:.55rem;padding:2px 7px;border-radius:5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;flex-shrink:0}
  .rm-tabs{display:none}
  .rm-tab{display:none}
  .rm-main{padding:20px 24px;max-width:1100px;margin:0 auto}
  .rm-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}
  .rm-kpi{background:#fff;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:3px;border:1px solid #ede8e0}
  .rm-kpi-num{font-size:1.75rem;font-weight:700;color:#1a1611;font-family:'Playfair Display',serif;line-height:1;letter-spacing:-.03em}
  .rm-kpi-num.accent-orange{color:#d97706}
  .rm-kpi-num.accent-green{color:#16a34a}
  .rm-kpi-num.kpi-money{font-size:1.25rem}
  .rm-kpi-label{font-size:.65rem;font-weight:700;color:#9a8e80;text-transform:uppercase;letter-spacing:.08em;margin-top:8px}
  .rm-kpi-sub{font-size:.62rem;color:#c0b8b0}
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
  .rm-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .rm-modal{background:#fff;border-radius:20px;width:100%;max-width:600px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .rm-modal-hdr{background:#1a1611;padding:18px 22px;border-radius:20px 20px 0 0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1}
  .rm-modal-titulo{font-family:'DM Sans',sans-serif;font-size:1rem;color:#fff;font-weight:700}
  .rm-modal-sub{font-size:.7rem;color:#9a8e80;margin-top:2px}
  .rm-modal-close{background:#ffffff18;border:none;color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;justify-content:center}
  .rm-modal-body{padding:18px 22px}
  .rm-modal-seccion{font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#b0a898;margin:14px 0 10px;padding-bottom:5px;border-bottom:1px solid #f2ede6}
  .rm-viaje-card{background:#faf8f5;border:1px solid #ede8e0;border-radius:12px;padding:12px 14px;margin-bottom:8px}
  .rm-viaje-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .rm-viaje-card-ruta{font-weight:700;font-size:.85rem;color:#1a1611}
  .rm-viaje-card-meta{font-size:.68rem;color:#b0a898;margin-top:2px}
  .rm-pasajeros-list{display:flex;flex-direction:column;gap:5px}
  .rm-pax-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#fff;border-radius:10px;border:1px solid #f2ede6}
  .rm-pax-info{flex:1;min-width:0}
  .rm-pax-name{font-size:.8rem;font-weight:600;color:#1a1611}
  .rm-pax-sub{font-size:.65rem;color:#b0a898;margin-top:1px}
  .rm-pax-actions{display:flex;gap:4px;flex-shrink:0}
  .rm-sec-hdr{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b0a898;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #ede8e0}
  .rm-res-card{background:#fff;border-radius:14px;border:1px solid #ede8e0;padding:14px 16px;transition:box-shadow .15s,transform .15s;cursor:pointer}
  .rm-res-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06);transform:translateY(-1px)}
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
  .rm-filters{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
  .rm-fbtn{padding:6px 16px;border-radius:99px;border:1.5px solid #ede8e0;background:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;color:#9a8e80;transition:all .15s}
  .rm-fbtn.on{background:#1a1611;border-color:#1a1611;color:#fff}
  .rm-fbtn:hover:not(.on){border-color:#9a8e80;color:#1a1611}
  .rm-date{padding:6px 14px;border-radius:99px;border:1.5px solid #ede8e0;background:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;color:#1a1611}
  .rm-btn{border:1.5px solid #ede8e0;background:#fff;border-radius:99px;padding:4px 12px;font-size:.7rem;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;transition:all .12s;color:#6b5e4e}
  .rm-btn:hover{background:#f7f5f2;border-color:#c0b8b0}
  .rm-btn.green{border-color:#bbf7d0;color:#15803d;background:#f0fdf4}
  .rm-btn.green:hover{background:#dcfce7}
  .rm-btn.red{border-color:#fecaca;color:#b91c1c;background:#fff5f5}
  .rm-btn:disabled{opacity:.4;cursor:not-allowed}
  .rm-btn-cobrar{background:#f97316;color:#fff;border:none;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer}
  .rm-btn-wa-lg{background:#16a34a;color:#fff;border:none;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer}
  .rm-btn-wa-lg:hover{background:#15803d}
  .rm-btn-ghost{border:1.5px solid #ede8e0;background:#fff;border-radius:99px;padding:6px 14px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;cursor:pointer;color:#9a8e80}
  .rm-btn-ghost:hover{border-color:#9a8e80;color:#1a1611}
  .rm-form-wrap{background:#fff;border-radius:16px;border:1px solid #ede8e0;padding:24px}
  .rm-form-title{font-size:1rem;color:#1a1611;margin-bottom:4px;font-weight:700}
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
  .rm-btn-primary{background:#1a1611;color:#fff;border:none;border-radius:99px;padding:10px 26px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer}
  .rm-btn-primary:hover:not(:disabled){background:#2d2820}
  .rm-btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .rm-preview{background:#f7f5f2;border-radius:12px;padding:14px 16px;margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:center}
  .rm-preview-item{text-align:center}
  .rm-preview-lbl{font-size:.6rem;color:#b0a898;text-transform:uppercase;letter-spacing:.07em;font-weight:700}
  .rm-preview-val{font-size:.9rem;font-weight:700;color:#1a1611;margin-top:2px}
  .rm-toast{position:fixed;bottom:20px;right:20px;background:#1a1611;color:#fff;padding:11px 20px;border-radius:99px;font-size:.8rem;font-weight:600;z-index:999;animation:tin .22s ease;box-shadow:0 6px 20px rgba(0,0,0,.2)}
  @keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .rm-dlg{background:#fff;border-radius:20px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.15)}
  .rm-dlg h3{font-size:1rem;color:#1a1611;margin-bottom:8px;font-weight:700}
  .rm-dlg p{font-size:.8rem;color:#9a8e80;line-height:1.6;margin-bottom:18px}
  .rm-dlg-btns{display:flex;gap:8px;justify-content:flex-end}
  .rm-btn-confirm{background:#1a1611;color:#fff;border:none;border-radius:99px;padding:8px 20px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer}
  .rm-btn-danger{background:#ef4444;color:#fff;border:none;border-radius:99px;padding:8px 20px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer}
  .rm-loading{text-align:center;padding:50px 20px;color:#b0a898}
  .rm-spinner{width:26px;height:26px;border:2.5px solid #ede8e0;border-top-color:#1a1611;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .rm-empty{text-align:center;padding:40px 20px;color:#b0a898;font-size:.82rem}
  .rm-success{text-align:center;padding:36px 20px}
  .rm-success-icon{font-size:2.5rem;margin-bottom:12px}
  .rm-success h3{font-size:1.05rem;color:#1a1611;margin-bottom:6px;font-weight:700}
  .rm-success p{font-size:.8rem;color:#9a8e80;margin-bottom:18px}
  .rm-cards{display:flex;flex-direction:column;gap:8px}

  /* Socios */
  .rm-socio-card{background:#fff;border:1px solid #ede8e0;border-radius:14px;padding:16px;display:flex;align-items:center;gap:14px}
  .rm-socio-avatar{width:46px;height:46px;border-radius:50%;background:#1a1611;color:#F5EDD8;display:flex;align-items:center;justify-content:center;font-size:.88rem;font-weight:800;flex-shrink:0}
  .rm-socio-info{flex:1;min-width:0}
  .rm-socio-nombre{font-weight:700;font-size:.92rem;color:#1a1611}
  .rm-socio-meta{font-size:.72rem;color:#9a8e80;margin-top:2px}
  .rm-socio-actions{display:flex;gap:6px;flex-wrap:wrap}
  .rm-vehiculo-tag{display:inline-flex;align-items:center;gap:5px;background:#f7f5f2;border:1px solid #ede8e0;border-radius:8px;padding:4px 10px;font-size:.72rem;color:#6b5e4e;font-weight:600}

  /* Dashboard socio */
  .rm-socio-banner{background:linear-gradient(135deg,#1a1611 0%,#2d2418 100%);border-radius:16px;padding:20px 24px;color:#F5EDD8;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .rm-socio-banner-titulo{font-size:1.1rem;font-weight:800;margin-bottom:2px}
  .rm-socio-banner-sub{font-size:.78rem;color:#9a8e80}

  @media(max-width:768px){
    .rm-kpi-grid{grid-template-columns:repeat(2,1fr)}
    .rm-main{padding:12px}
    .rm-grid,.rm-grid-3{grid-template-columns:1fr}
    .rm-cal-day{min-height:55px;padding:4px}
  }
`;

const loginCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
  .lg-root{min-height:100vh;background:#2d2820;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',sans-serif}
  .lg-card{background:#EDE5D0;border-radius:24px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
  .lg-logo{font-size:2.2rem;text-align:center;margin-bottom:6px}
  .lg-title{font-size:1.45rem;color:#2d2820;text-align:center;font-weight:700;margin-bottom:4px}
  .lg-sub{font-size:.78rem;color:#9a9080;text-align:center;margin-bottom:28px}
  .lg-field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
  .lg-field label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9a9080}
  .lg-input-wrap{position:relative}
  .lg-input{width:100%;padding:11px 14px;border-radius:11px;border:1.5px solid #D4CBB8;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#2d2820;background:#fff;transition:border-color .2s;outline:none;box-sizing:border-box}
  .lg-input:focus{border-color:#2d2820}
  .lg-input.err{border-color:#dc2626}
  .lg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:#9a9080}
  .lg-error{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 14px;font-size:.8rem;color:#991b1b;margin-bottom:16px}
  .lg-btn{width:100%;padding:13px;border-radius:11px;background:#2d2820;color:#EDE5D0;border:none;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:4px}
  .lg-btn:hover:not(:disabled){background:#3d3829}
  .lg-btn:disabled{opacity:.6;cursor:not-allowed}
  .lg-footer{text-align:center;margin-top:20px;font-size:.72rem;color:#9a9080}
  .lg-spinner{width:18px;height:18px;border:2px solid #D4CBB840;border-top-color:#EDE5D0;border-radius:50%;animation:lgspin .7s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px}
  @keyframes lgspin{to{transform:rotate(360deg)}}
`;

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Credenciales incorrectas. Intenta de nuevo.");
    else onLogin();
  };

  return (
    <>
      <style>{loginCss}</style>
      <div className="lg-root">
        <div className="lg-card">
          <div className="lg-logo">🚐</div>
          <div className="lg-title">Araucanía Viajes</div>
          <div className="lg-sub">Panel de administración · acceso privado</div>
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

// ─── Auth Gate con detección de rol ──────────────────────────
function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [perfil,  setPerfil]  = useState(undefined);

  const verificar = async (s) => {
    if (!s?.user) { setPerfil(null); return; }

    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("user_id", s.user.id)
      .maybeSingle();

    if (error || !data || data.rol === "cliente") {
      await supabase.auth.signOut();
      setPerfil(null);
      return;
    }

    setPerfil(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      verificar(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) { setPerfil(null); return; }
      verificar(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || (session && perfil === undefined)) return (
    <div style={{minHeight:"100vh",background:"#2d2820",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{width:36,height:36,border:"3px solid #D4CBB840",borderTopColor:"#EDE5D0",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{color:"#D4CBB880",fontSize:".8rem",fontFamily:"DM Sans,sans-serif"}}>Verificando acceso…</span>
    </div>
  );

  if (!session || perfil === null) return (
    <LoginScreen onLogin={() =>
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        verificar(s);
      })
    }/>
  );

  return children({ perfil, session });
}

// ─── Calendario ───────────────────────────────────────────────
function CalendarioDashboard({ viajes, bloqueos, onDiaClick }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [año, setAnio] = useState(hoy.getFullYear());

  const primerDia = new Date(año, mes, 1).getDay();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const diasAnterior = new Date(año, mes, 0).getDate();

  const viajesPorFecha = viajes.filter(v=>v.estado!=="cancelado").reduce((acc,v)=>{
    if (!acc[v.fecha]) acc[v.fecha]=[];
    acc[v.fecha].push(v);
    return acc;
  },{});

  const getBloqueosTipo = (fechaStr) => {
    const f = new Date(fechaStr+"T12:00:00");
    const activos = bloqueos.filter(b=>
      (b.tipo==="dia"&&b.fecha===fechaStr)||
      (b.tipo==="mes"&&b.mes===f.getMonth()+1&&b.anio===f.getFullYear())
    );
    if (!activos.length) return new Set();
    const tipos = new Set();
    activos.forEach(b=>{
      const a = b.aplica_a||"ambos";
      if (a==="ambos"){tipos.add("compartido");tipos.add("privado");}
      else tipos.add(a);
    });
    return tipos;
  };

  const navMes = (delta) => {
    let nm=mes+delta, na=año;
    if (nm<0){nm=11;na--;} if (nm>11){nm=0;na++;}
    setMes(nm); setAnio(na);
  };

  const celdas = [];
  for (let i=primerDia-1;i>=0;i--) celdas.push({dia:diasAnterior-i,otroMes:true,fecha:null});
  for (let d=1;d<=diasEnMes;d++){
    const mm=String(mes+1).padStart(2,"0"), dd=String(d).padStart(2,"0");
    const key=`${año}-${mm}-${dd}`;
    celdas.push({dia:d,otroMes:false,fecha:key,viajes:viajesPorFecha[key]||[]});
  }
  const resto=7-(celdas.length%7);
  if (resto<7) for (let i=1;i<=resto;i++) celdas.push({dia:i,otroMes:true,fecha:null});
  const todayKey=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  return (
    <div className="rm-cal-wrap">
      <div className="rm-cal-hdr">
        <button className="rm-cal-nav" onClick={()=>navMes(-1)}>◀</button>
        <span className="rm-cal-mes">{MESES[mes]} {año}</span>
        <button className="rm-cal-nav" onClick={()=>navMes(1)}>▶</button>
      </div>
      <div className="rm-cal-grid">{DIAS_SEMANA.map(d=><div key={d} className="rm-cal-dow">{d}</div>)}</div>
      <div className="rm-cal-grid">
        {celdas.map((celda,i)=>{
          if (celda.otroMes) return <div key={i} className="rm-cal-day vacio"><div className="rm-dia-num otro-mes">{celda.dia}</div></div>;
          const tieneViajes=celda.viajes?.length>0;
          const esHoy=celda.fecha===todayKey;
          const bloqueados=getBloqueosTipo(celda.fecha);
          const totBlq=bloqueados.has("compartido")&&bloqueados.has("privado");
          const parcBlq=bloqueados.size>0&&!totBlq;
          const compartidos=celda.viajes?.filter(v=>v.tipo==="compartido")||[];
          const privados=celda.viajes?.filter(v=>v.tipo==="privado")||[];
          const paxComp=compartidos.reduce((a,v)=>a+(v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+r.num_asientos,0)||0),0);
          const paxPriv=privados.reduce((a,v)=>a+(v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+r.num_asientos,0)||0),0);
          let clases="rm-cal-day";
          if (totBlq&&!tieneViajes) clases+=" bloqueado";
          else if (tieneViajes) clases+=" tiene-viajes";
          if (esHoy) clases+=" hoy";
          return (
            <div key={i} className={clases} onClick={()=>tieneViajes&&onDiaClick(celda.fecha,celda.viajes)}>
              <div className={`rm-dia-num${celda.otroMes?" otro-mes":""}`}>{celda.dia}</div>
              <div className="rm-dia-dots">
                {totBlq&&<div className="rm-dia-dot bloq-tag">🔒 Cerrado</div>}
                {parcBlq&&bloqueados.has("compartido")&&<div className="rm-dia-dot bloq-tag">🔒 Sin comp.</div>}
                {compartidos.length>0&&<div className="rm-dia-dot compartido">🚌 {compartidos.length} · {paxComp}pax</div>}
                {privados.length>0&&<div className="rm-dia-dot privado">🚐 {privados.length} · {paxPriv}pax</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal día ────────────────────────────────────────────────
function ModalDia({ fecha, viajes, onClose, onConfirmarPasajero, onCancelarPasajero, onMarcarPagado, onCancelarViaje, esAdmin }) {
  if (!fecha) return null;
  const compartidos = viajes.filter(v=>v.tipo==="compartido");
  const privados    = viajes.filter(v=>v.tipo==="privado");

  const SeccionViaje = ({ viaje }) => {
    const cfg = ESTADO_CFG[viaje.estado]||ESTADO_CFG.en_espera;
    const reservasActivas = viaje.reservas?.filter(r=>r.estado!=="cancelada")||[];
    return (
      <div className="rm-viaje-card">
        <div className="rm-viaje-card-hdr">
          <div>
            <div className="rm-viaje-card-ruta">{viaje.ruta?.nombre||"Ruta sin nombre"}</div>
            <div className="rm-viaje-card-meta">
              {viaje.hora_salida?.slice(0,5)} · {fmtPeso(viaje.precio_por_pax)}/pax
              {viaje.socio?.nombre_completo ? ` · 👤 ${viaje.socio.nombre_completo}` : ""}
            </div>
          </div>
          <span className="rm-estado" style={{color:cfg.color,background:cfg.bg,fontSize:".62rem",fontWeight:700,padding:"3px 10px",borderRadius:"99px"}}>
            {cfg.label}
          </span>
        </div>
        {reservasActivas.length===0 ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px"}}>
            <span style={{fontSize:".78rem",color:"#9a9080"}}>Sin pasajeros activos</span>
            {esAdmin&&viaje.estado!=="cancelado"&&<button className="rm-btn red" onClick={()=>onCancelarViaje(viaje)}>Cancelar viaje</button>}
          </div>
        ) : (
          <div className="rm-pasajeros-list">
            {reservasActivas.map(r=>{
              const pagado=r.pagos?.some(p=>p.estado==="completado");
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
                    {esAdmin&&r.estado==="pendiente"&&<button className="rm-btn green" onClick={()=>onConfirmarPasajero(r.id)}>✓</button>}
                    {esAdmin&&r.estado==="confirmada"&&!pagado&&<button className="rm-btn green" onClick={()=>onMarcarPagado(r.id,viaje.precio_por_pax*r.num_asientos)}>💳</button>}
                    <button className="rm-btn" onClick={()=>{
                      const msg=encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, te contactamos desde *Araucanía Viajes* por tu reserva del ${fmtFechaCorta(fecha)}.`);
                      window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                    }}>💬</button>
                    {esAdmin&&<button className="rm-btn red" onClick={()=>onCancelarPasajero(r.id,r.nombre)}>✕</button>}
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
            <div className="rm-modal-sub">{viajes.length} viaje(s) · {viajes.reduce((acc,v)=>acc+(v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+(r.num_asientos||1),0)||0),0)} pasajeros</div>
          </div>
          <button className="rm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="rm-modal-body">
          {compartidos.length>0&&(<><div className="rm-modal-seccion">🚌 Compartidos</div>{compartidos.map(v=><SeccionViaje key={v.id} viaje={v}/>)}</>)}
          {privados.length>0&&(<><div className="rm-modal-seccion">🚐 Vans Privadas</div>{privados.map(v=><SeccionViaje key={v.id} viaje={v}/>)}</>)}
        </div>
      </div>
    </div>
  );
}

// ─── Panel Socios (solo admin) ────────────────────────────────
function PanelSocios({ socios, vehiculos, onCrearSocio, onToggleActivo, onCrearVehiculo, onToast }) {
  const FORM_INIT = { nombre_completo:"", telefono:"", rut:"", licencia_clase:"A3", comision_porcentaje:70, notas:"" };
  const VEH_INIT  = { socio_id:"", patente:"", marca:"", modelo:"", anio: new Date().getFullYear(), capacidad_pasajeros:8, color:"" };
  const [form,     setForm]     = useState(FORM_INIT);
  const [formVeh,  setFormVeh]  = useState(VEH_INIT);
  const [vista,    setVista]    = useState("lista");
  const [saving,   setSaving]   = useState(false);
  const [socioDetalle, setSocioDetalle] = useState(null);

  const guardarSocio = async () => {
    if (!form.nombre_completo||!form.telefono) { onToast("⚠️ Nombre y teléfono son obligatorios"); return; }
    setSaving(true);
    await onCrearSocio(form);
    setForm(FORM_INIT); setVista("lista"); setSaving(false);
  };

  const guardarVehiculo = async () => {
    if (!formVeh.socio_id||!formVeh.patente) { onToast("⚠️ Selecciona socio e ingresa la patente"); return; }
    setSaving(true);
    await onCrearVehiculo(formVeh);
    setFormVeh(VEH_INIT); setVista("lista"); setSaving(false);
  };

  if (vista==="nuevo-socio") return (
    <div className="rm-form-wrap">
      <div className="rm-form-title">👤 Agregar socio conductor</div>
      <div className="rm-form-sub">Se creará la cuenta — el socio recibirá sus credenciales por WhatsApp.</div>
      <div className="rm-form-section">Datos personales</div>
      <div className="rm-grid">
        <div className="rm-field rm-col2">
          <label>Nombre completo <span>*</span></label>
          <input placeholder="Ej: Pedro Muñoz Rojas" value={form.nombre_completo} onChange={e=>setForm(f=>({...f,nombre_completo:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Teléfono <span>*</span></label>
          <input placeholder="+56 9 1234 5678" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>RUT</label>
          <input placeholder="12.345.678-9" value={form.rut} onChange={e=>setForm(f=>({...f,rut:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Licencia</label>
          <select value={form.licencia_clase} onChange={e=>setForm(f=>({...f,licencia_clase:e.target.value}))}>
            <option value="A3">A3 — Minibús</option>
            <option value="A2">A2 — Taxi / Auto</option>
            <option value="B">B — Auto particular</option>
          </select>
        </div>
        <div className="rm-field">
          <label>Comisión %</label>
          <input type="number" min="0" max="100" value={form.comision_porcentaje} onChange={e=>setForm(f=>({...f,comision_porcentaje:e.target.value}))}/>
          <span className="rm-field-hint">Porcentaje del viaje que recibe el socio</span>
        </div>
        <div className="rm-field rm-col2">
          <label>Notas internas</label>
          <textarea rows="2" placeholder="Zona de cobertura, disponibilidad…" value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/>
        </div>
      </div>
      <div className="rm-form-actions">
        <button className="rm-btn-ghost" onClick={()=>setVista("lista")}>Cancelar</button>
        <button className="rm-btn-primary" onClick={guardarSocio} disabled={saving}>{saving?"Guardando…":"✓ Crear socio"}</button>
      </div>
    </div>
  );

  if (vista==="nuevo-vehiculo") return (
    <div className="rm-form-wrap">
      <div className="rm-form-title">🚐 Agregar vehículo</div>
      <div className="rm-form-sub">El vehículo queda asociado al socio propietario.</div>
      <div className="rm-form-section">Vehículo</div>
      <div className="rm-grid">
        <div className="rm-field rm-col2">
          <label>Socio propietario <span>*</span></label>
          <select value={formVeh.socio_id} onChange={e=>setFormVeh(f=>({...f,socio_id:e.target.value}))}>
            <option value="">Selecciona un socio…</option>
            {socios.filter(s=>s.activo).map(s=><option key={s.id} value={s.id}>{s.nombre_completo}</option>)}
          </select>
        </div>
        <div className="rm-field">
          <label>Patente <span>*</span></label>
          <input placeholder="BCDF-12" value={formVeh.patente} onChange={e=>setFormVeh(f=>({...f,patente:e.target.value.toUpperCase()}))}/>
        </div>
        <div className="rm-field">
          <label>Capacidad pasajeros</label>
          <input type="number" min="1" max="20" value={formVeh.capacidad_pasajeros} onChange={e=>setFormVeh(f=>({...f,capacidad_pasajeros:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Marca</label>
          <input placeholder="Ej: Mercedes-Benz" value={formVeh.marca} onChange={e=>setFormVeh(f=>({...f,marca:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Modelo</label>
          <input placeholder="Ej: Sprinter 415" value={formVeh.modelo} onChange={e=>setFormVeh(f=>({...f,modelo:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Año</label>
          <input type="number" min="2000" max="2030" value={formVeh.anio} onChange={e=>setFormVeh(f=>({...f,anio:e.target.value}))}/>
        </div>
        <div className="rm-field">
          <label>Color</label>
          <input placeholder="Ej: Blanco" value={formVeh.color} onChange={e=>setFormVeh(f=>({...f,color:e.target.value}))}/>
        </div>
      </div>
      <div className="rm-form-actions">
        <button className="rm-btn-ghost" onClick={()=>setVista("lista")}>Cancelar</button>
        <button className="rm-btn-primary" onClick={guardarVehiculo} disabled={saving}>{saving?"Guardando…":"✓ Agregar vehículo"}</button>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Modal detalle socio */}
      {socioDetalle && (() => {
        const s = socioDetalle;
        const vehs = vehiculos.filter(v=>v.socio_id===s.id);
        const iniciales = s.nombre_completo.split(" ").map(p=>p[0]).join("").toUpperCase().slice(0,2);
        return (
          <div className="rm-ov" onClick={()=>setSocioDetalle(null)}>
            <div className="rm-modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
              <div className="rm-modal-hdr">
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"#F5EDD8",color:"#1a1611",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".85rem",fontWeight:800,flexShrink:0}}>{iniciales}</div>
                  <div>
                    <div className="rm-modal-titulo">{s.nombre_completo}</div>
                    <div className="rm-modal-sub" style={{color:s.activo?"#22c55e":"#ef4444"}}>{s.activo?"● Activo":"● Inactivo"}</div>
                  </div>
                </div>
                <button className="rm-modal-close" onClick={()=>setSocioDetalle(null)}>✕</button>
              </div>
              <div className="rm-modal-body">
                <div className="rm-modal-seccion">Datos personales</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    ["Teléfono", s.telefono||"—"],
                    ["RUT", s.rut||"—"],
                    ["Licencia", s.licencia_clase||"—"],
                    ["Comisión", `${s.comision_porcentaje}%`],
                  ].map(([lbl,val])=>(
                    <div key={lbl} style={{background:"#faf8f5",borderRadius:10,padding:"10px 14px"}}>
                      <div style={{fontSize:".6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#b0a898",marginBottom:3}}>{lbl}</div>
                      <div style={{fontSize:".85rem",fontWeight:700,color:"#1a1611"}}>{val}</div>
                    </div>
                  ))}
                </div>

                {s.telefono && (
                  <button className="rm-btn-wa-lg" style={{width:"100%",marginTop:12,padding:"10px",borderRadius:10,justifyContent:"center"}}
                    onClick={()=>window.open(`https://wa.me/${s.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${s.nombre_completo.split(" ")[0]} 👋, te contactamos desde Araucanía Viajes.`)}`, "_blank")}>
                    💬 Escribir por WhatsApp
                  </button>
                )}

                <div className="rm-modal-seccion" style={{marginTop:16}}>Vehículos ({vehs.length})</div>
                {vehs.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:".78rem",color:"#b0a898"}}>Sin vehículos registrados</span>
                    <button className="rm-btn" onClick={()=>{setSocioDetalle(null);setVista("nuevo-vehiculo");}}>+ Agregar</button>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {vehs.map(v=>(
                      <div key={v.id} style={{background:"#faf8f5",border:"1px solid #ede8e0",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:"#1a1611",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5EDD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
                            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                            <path d="M9 5v7h11"/>
                          </svg>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:".85rem",fontWeight:700,color:"#1a1611"}}>{v.patente} · {v.marca} {v.modelo}</div>
                          <div style={{fontSize:".7rem",color:"#9a8e80",marginTop:2}}>{v.anio} · {v.capacidad_pasajeros} pasajeros · {v.color||""}</div>
                        </div>
                        {!v.activo&&<span style={{fontSize:".6rem",color:"#dc2626",fontWeight:700,background:"#fef2f2",padding:"2px 6px",borderRadius:4}}>INACTIVO</span>}
                      </div>
                    ))}
                  </div>
                )}

                {s.notas && (
                  <>
                    <div className="rm-modal-seccion">Notas internas</div>
                    <p style={{fontSize:".8rem",color:"#6b5e4e",lineHeight:1.6,background:"#faf8f5",borderRadius:10,padding:"10px 14px"}}>{s.notas}</p>
                  </>
                )}

                <div style={{display:"flex",gap:8,marginTop:16,paddingTop:12,borderTop:"1px solid #f2ede6"}}>
                  <button className={`rm-btn ${s.activo?"red":"green"}`} style={{flex:1,padding:"8px"}}
                    onClick={()=>{onToggleActivo(s);setSocioDetalle(null);}}>
                    {s.activo?"Desactivar socio":"Activar socio"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button className="rm-btn-primary" onClick={()=>setVista("nuevo-vehiculo")}>🚐 Nuevo vehículo</button>
        <button className="rm-btn-primary" onClick={()=>setVista("nuevo-socio")}>👤 Nuevo socio</button>
      </div>

      {socios.length===0 ? (
        <div className="rm-empty">
          Sin socios registrados aún.<br/>
          <button className="rm-btn" style={{marginTop:10}} onClick={()=>setVista("nuevo-socio")}>+ Agregar primer socio</button>
        </div>
      ) : (
        socios.map(socio => {
          const vehs = vehiculos.filter(v=>v.socio_id===socio.id);
          const iniciales = socio.nombre_completo.split(" ").map(p=>p[0]).join("").toUpperCase().slice(0,2);
          return (
            <div key={socio.id} className="rm-form-wrap" style={{padding:"16px 20px",cursor:"pointer",transition:"box-shadow .15s"}}
              onClick={()=>setSocioDetalle(socio)}
              onMouseOver={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
              onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
              <div className="rm-socio-card" style={{border:"none",padding:0}}>
                <div className="rm-socio-avatar" style={{opacity:socio.activo?1:0.4}}>{iniciales}</div>
                <div className="rm-socio-info">
                  <div className="rm-socio-nombre" style={{color:socio.activo?"#1a1611":"#9a9080"}}>
                    {socio.nombre_completo}
                    {!socio.activo&&<span style={{fontSize:".65rem",color:"#dc2626",marginLeft:8,fontWeight:700}}>INACTIVO</span>}
                  </div>
                  <div className="rm-socio-meta">
                    {socio.telefono} · Licencia {socio.licencia_clase} · Comisión {socio.comision_porcentaje}%
                  </div>
                  {socio.rut&&<div className="rm-socio-meta">RUT: {socio.rut}</div>}
                </div>
                <div className="rm-socio-actions" onClick={e=>e.stopPropagation()}>
                  <button className={`rm-btn ${socio.activo?"red":"green"}`} onClick={()=>onToggleActivo(socio)}>
                    {socio.activo?"Desactivar":"Activar"}
                  </button>
                </div>
              </div>
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f2ede6",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:".62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"#b0a898"}}>Vehículos ({vehs.length})</span>
                {vehs.map(v=>(
                  <span key={v.id} className="rm-vehiculo-tag" style={{fontSize:".68rem"}}>
                    {v.patente} · {v.marca} {v.modelo}
                  </span>
                ))}
                {vehs.length===0&&<span style={{fontSize:".72rem",color:"#c0b8b0"}}>Sin vehículos</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── BloqueoPanel ─────────────────────────────────────────────
function BloqueoPanel({ bloqueos, onBloqueoDia, onBloqueoMes, onEliminar }) {
  const [tipo,      setTipo]      = useState("dia");
  const [fecha,     setFecha]     = useState("");
  const [mes,       setMes]       = useState("");
  const [anio,      setAnio]      = useState(new Date().getFullYear());
  const [motivo,    setMotivo]    = useState("");
  const [tipoViaje, setTipoViaje] = useState("ambos");

  const handleAgregar = () => {
    if (tipo==="dia") onBloqueoDia(fecha,motivo,tipoViaje);
    else onBloqueoMes(mes,anio,motivo,tipoViaje);
    setFecha(""); setMes(""); setMotivo(""); setTipoViaje("ambos");
  };

  return (
    <div className="rm-form-wrap">
      <div className="rm-form-title">🔒 Bloquear fechas</div>
      <div className="rm-form-sub">Los días o meses bloqueados no permitirán nuevas reservas desde la web.</div>
      <div className="rm-form-section">Período</div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button className={`rm-fbtn ${tipo==="dia"?"on":""}`} onClick={()=>setTipo("dia")}>📅 Por día</button>
        <button className={`rm-fbtn ${tipo==="mes"?"on":""}`} onClick={()=>setTipo("mes")}>🗓️ Por mes</button>
      </div>
      {tipo==="dia" ? (
        <div className="rm-grid">
          <div className="rm-field"><label>Fecha</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
          <div className="rm-field"><label>Motivo</label><input placeholder="Feriado, mantención…" value={motivo} onChange={e=>setMotivo(e.target.value)}/></div>
        </div>
      ) : (
        <div className="rm-grid">
          <div className="rm-field"><label>Mes</label>
            <select value={mes} onChange={e=>setMes(e.target.value)}>
              <option value="">Selecciona…</option>
              {MESES_LABEL.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="rm-field"><label>Año</label><input type="number" min="2025" max="2030" value={anio} onChange={e=>setAnio(e.target.value)}/></div>
          <div className="rm-field rm-col2"><label>Motivo</label><input placeholder="Temporada baja…" value={motivo} onChange={e=>setMotivo(e.target.value)}/></div>
        </div>
      )}
      <div className="rm-form-section" style={{marginTop:18}}>Aplica a</div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {Object.entries(TIPO_VIAJE_CFG).map(([id,cfg])=>(
          <button key={id} className={`rm-fbtn ${tipoViaje===id?"on":""}`} onClick={()=>setTipoViaje(id)}>{cfg.label}</button>
        ))}
      </div>
      <div className="rm-form-actions">
        <button className="rm-btn-primary" onClick={handleAgregar}>🔒 Agregar bloqueo</button>
      </div>
      <div className="rm-form-section" style={{marginTop:28}}>Bloqueos activos ({bloqueos.length})</div>
      {bloqueos.length===0&&<div className="rm-empty">Sin bloqueos activos.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {bloqueos.map(b=>{
          const tvCfg=TIPO_VIAJE_CFG[b.aplica_a||"ambos"];
          return (
            <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#fff5f5",border:"1.5px solid #fecaca",borderRadius:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:".85rem",fontWeight:700,color:"#b91c1c"}}>
                  {b.tipo==="dia"?`📅 ${b.fecha}`:`🗓️ ${MESES_LABEL[b.mes]} ${b.anio}`}
                  <span style={{fontSize:".65rem",fontWeight:700,padding:"2px 8px",borderRadius:99,background:tvCfg.bg,color:tvCfg.color}}>{tvCfg.label}</span>
                </div>
                {b.motivo&&<div style={{fontSize:".7rem",color:"#9a8e80",marginTop:2}}>{b.motivo}</div>}
              </div>
              <button className="rm-btn red" onClick={()=>onEliminar(b.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard Socio ─────────────────────────────────────────
function DashboardSocio({ socioData, viajes, onConfirmarCheckin, onToast }) {
  const hoy = new Date().toISOString().split("T")[0];

  const viajesHoy     = viajes.filter(v=>v.fecha===hoy);
  const viajesProx    = viajes.filter(v=>v.fecha>hoy).slice(0,5);
  const totalPax      = viajes.reduce((acc,v)=>acc+(v.reservas?.filter(r=>r.estado!=="cancelada").reduce((s,r)=>s+r.num_asientos,0)||0),0);
  const viajesActivos = viajes.filter(v=>v.estado!=="cancelado").length;

  const vehiculos = socioData?.vehiculos || [];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Banner de bienvenida */}
      <div className="rm-socio-banner">
        <div>
          <div className="rm-socio-banner-titulo">Hola, {socioData?.nombre_completo?.split(" ")[0]} 👋</div>
          <div className="rm-socio-banner-sub">Tu panel de conductor · Araucanía Viajes</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          {vehiculos.map(v=>(
            <div key={v.id} className="rm-vehiculo-tag" style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",color:"#F5EDD8",marginBottom:4}}>
              🚐 {v.patente} · {v.marca} {v.modelo}
            </div>
          ))}
        </div>
      </div>

      {/* KPIs del socio */}
      <div className="rm-kpi-grid">
        <div className="rm-kpi">
          <div className="rm-kpi-num">{viajesHoy.length}</div>
          <div className="rm-kpi-label">Viajes hoy</div>
        </div>
        <div className="rm-kpi">
          <div className="rm-kpi-num accent-green">{viajesActivos}</div>
          <div className="rm-kpi-label">Viajes asignados</div>
        </div>
        <div className="rm-kpi">
          <div className="rm-kpi-num accent-orange">{totalPax}</div>
          <div className="rm-kpi-label">Pasajeros totales</div>
        </div>
        <div className="rm-kpi">
          <div className="rm-kpi-num" style={{fontSize:"1rem"}}>{socioData?.comision_porcentaje}%</div>
          <div className="rm-kpi-label">Tu comisión</div>
        </div>
      </div>

      {/* Viajes de hoy */}
      {viajesHoy.length > 0 && (
        <div>
          <div className="rm-sec-hdr">VIAJES DE HOY ({viajesHoy.length})</div>
          <div className="rm-cards">
            {viajesHoy.map(v => {
              const reservasActivas = v.reservas?.filter(r=>r.estado!=="cancelada")||[];
              const cfg = ESTADO_CFG[v.estado]||ESTADO_CFG.en_espera;
              return (
                <div key={v.id} className="rm-res-card">
                  <div className="rm-res-card-top">
                    <div className="rm-res-nombre">{v.ruta?.nombre||"Ruta sin nombre"}</div>
                    <span className="rm-estado" style={{color:cfg.color,background:cfg.bg,fontSize:".62rem",fontWeight:700,padding:"3px 10px",borderRadius:"99px"}}>{cfg.label}</span>
                  </div>
                  <div className="rm-res-ruta">🕐 {v.hora_salida?.slice(0,5)} · {v.tipo==="compartido"?"🚌 Compartido":"🚐 Van privada"}</div>
                  <div className="rm-res-meta">
                    <span>👥 {reservasActivas.reduce((s,r)=>s+r.num_asientos,0)} pasajeros</span>
                  </div>
                  {reservasActivas.length>0&&(
                    <div className="rm-res-actions">
                      {reservasActivas.map(r=>(
                        <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 0",borderBottom:"1px solid #f2ede6"}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:".82rem",fontWeight:600,color:"#1a1611"}}>{r.nombre}</div>
                            <div style={{fontSize:".7rem",color:"#9a8e80"}}>{r.num_asientos} asiento(s)</div>
                          </div>
                          <button className="rm-btn" onClick={()=>{
                            const msg=encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, soy tu conductor de hoy en Araucanía Viajes. Estoy en camino.`);
                            window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                          }}>💬</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximos viajes */}
      {viajesProx.length > 0 && (
        <div>
          <div className="rm-sec-hdr">PRÓXIMOS VIAJES</div>
          <div className="rm-cards">
            {viajesProx.map(v=>{
              const reservasActivas = v.reservas?.filter(r=>r.estado!=="cancelada")||[];
              return (
                <div key={v.id} className="rm-res-card">
                  <div className="rm-res-card-top">
                    <div className="rm-res-nombre">{v.ruta?.nombre||"Ruta sin nombre"}</div>
                    <span style={{fontSize:".75rem",fontWeight:700,color:"#6b5e4e"}}>{fmtFechaCorta(v.fecha)}</span>
                  </div>
                  <div className="rm-res-meta">
                    <span>🕐 {v.hora_salida?.slice(0,5)}</span>
                    <span>👥 {reservasActivas.reduce((s,r)=>s+r.num_asientos,0)} pax</span>
                    <span>{v.tipo==="compartido"?"🚌":"🚐"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viajes.length===0&&<div className="rm-empty">No tienes viajes asignados aún.</div>}
    </div>
  );
}

// ─── Manager Principal ────────────────────────────────────────
function ReservationManagerInner({ perfil }) {
  const esAdmin = perfil.rol === "admin";

  const [tab,          setTab]          = useState("dashboard");
  const [viajes,       setViajes]       = useState([]);
  const [rutas,        setRutas]        = useState([]);
  const [bloqueos,     setBloqueos]     = useState([]);
  const [socios,       setSocios]       = useState([]);
  const [vehiculos,    setVehiculos]    = useState([]);
  const [socioActual,  setSocioActual]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [abierto,      setAbierto]      = useState(null);
  const [filtroFecha,  setFiltroFecha]  = useState("");
  const [filtroRuta,   setFiltroRuta]   = useState("todas");
  const [toast,        setToast]        = useState(null);
  const [dialog,       setDialog]       = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [successViaje, setSuccessViaje] = useState(null);
  const [modalDia,     setModalDia]     = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  const FORM_VIAJE_INIT = { ruta_id:"", tipo:"compartido", fecha:"", hora_salida:"08:00", capacidad:8, precio_por_pax:"", socio_id:"", vehiculo_id:"", conductor:"", vehiculo:"", notas_admin:"" };
  const FORM_RES_INIT   = { viaje_id:"", nombre:"", email:"", telefono:"", num_asientos:1, notas:"", origen_reserva:"telefono" };
  const [formViaje, setFormViaje] = useState(FORM_VIAJE_INIT);
  const [formRes,   setFormRes]   = useState(FORM_RES_INIT);
  const [errViaje,  setErrViaje]  = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 3800); };

  // ── Carga ──────────────────────────────────────────────────
  const cargarViajes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("viajes")
      .select(`*, ruta:rutas(nombre,origen,destino),
        socio:socios(id,nombre_completo,comision_porcentaje),
        vehiculo:vehiculos(patente,marca,modelo),
        reservas(id,nombre,email,telefono,num_asientos,estado,notas,origen_reserva,created_at,
          pagos(id,monto,estado,metodo,referencia,fecha_pago))`)
      .order("fecha",      { ascending: true })
      .order("hora_salida",{ ascending: true });

    if (!esAdmin && socioActual) {
      query = query.eq("socio_id", socioActual.id);
    } else if (!esAdmin && !socioActual) {
      setViajes([]); setLoading(false); return;
    }

    const { data, error } = await query;
    if (!error) setViajes(data || []);
    setLoading(false);
  }, [esAdmin, socioActual]);

  const cargarRutas = useCallback(async () => {
    const { data } = await supabase.from("rutas").select("*").eq("activa",true).order("nombre");
    setRutas(data||[]);
  }, []);

  const cargarBloqueos = useCallback(async () => {
    const { data } = await supabase.from("bloqueos").select("*").order("created_at",{ascending:false});
    setBloqueos(data||[]);
  }, []);

  const cargarSocios = useCallback(async () => {
    if (!esAdmin) return;
    const { data: s } = await supabase.from("socios").select("*").order("nombre_completo");
    const { data: v } = await supabase.from("vehiculos").select("*").order("patente");
    setSocios(s||[]); setVehiculos(v||[]);
  }, [esAdmin]);

  const cargarSocioActual = useCallback(async () => {
    if (esAdmin) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase.from("socios")
      .select("*, vehiculos(*)")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setSocioActual(data);
  }, [esAdmin]);

  useEffect(() => {
    const init = async () => {
      await cargarSocioActual();
      await Promise.all([cargarViajes(), cargarRutas(), cargarBloqueos(), cargarSocios()]);
    };
    init();
    const ch = supabase.channel("rm-rt")
      .on("postgres_changes",{event:"*",schema:"public",table:"viajes"  },cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"reservas"},cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"pagos"   },cargarViajes)
      .on("postgres_changes",{event:"*",schema:"public",table:"bloqueos"},cargarBloqueos)
      .on("postgres_changes",{event:"*",schema:"public",table:"socios"  },cargarSocios)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [cargarViajes, cargarRutas, cargarBloqueos, cargarSocios, cargarSocioActual]);

  // ── Stats ──────────────────────────────────────────────────
  const stats = {
    total:       viajes.filter(v=>v.estado!=="cancelado").length,
    cobrar:      viajes.filter(v=>v.estado==="listo_para_cobrar").length,
    confirmados: viajes.filter(v=>v.estado==="confirmado").length,
    ingresos:    viajes.reduce((acc,v)=>acc+(v.reservas?.flatMap(r=>r.pagos||[]).filter(p=>p.estado==="completado").reduce((s,p)=>s+p.monto,0)||0),0),
  };

  // ── Filtrado ───────────────────────────────────────────────
  const filtrados = viajes.filter(v => {
    const fechaOk = !filtroFecha || v.fecha===filtroFecha;
    const rutaOk  = filtroRuta==="todas" || v.ruta?.nombre===filtroRuta;
    const tabOk   = tab==="dashboard"  ? true
                  : tab==="compartido" ? v.tipo==="compartido"
                  : tab==="privado"    ? v.tipo==="privado"
                  : true;
    return fechaOk && tabOk && rutaOk;
  });

  // ── Acciones ───────────────────────────────────────────────
  const confirmarPasajero = async (id) => {
    const { error } = await supabase.from("reservas").update({estado:"confirmada"}).eq("id",id);
    if (!error) { showToast("✅ Pasajero confirmado"); cargarViajes(); }
    else showToast("❌ "+error.message);
  };

  const cancelarPasajero = (reservaId, nombre) => {
    setDialog({ titulo:"Cancelar reserva", mensaje:`¿Cancelar la reserva de ${nombre}?`, danger:true,
      onConfirm: async () => {
        const { error } = await supabase.from("reservas").update({estado:"cancelada"}).eq("id",reservaId);
        if (!error) { showToast("🚫 Reserva cancelada"); cargarViajes(); } else showToast("❌ "+error.message);
        setDialog(null);
      }
    });
  };

  const marcarPagado = async (reservaId, precio) => {
    const { data: ex } = await supabase.from("pagos").select("id").eq("reserva_id",reservaId).eq("estado","completado").maybeSingle();
    if (ex) { showToast("⚠️ Ya tiene un pago registrado"); return; }
    const { error } = await supabase.from("pagos").insert({ reserva_id:reservaId, monto:precio, metodo:"transferencia", estado:"completado", fecha_pago:new Date().toISOString() });
    if (!error) { showToast("💳 Pago registrado"); cargarViajes(); } else showToast("❌ "+error.message);
  };

  const cancelarViaje = (viaje) => {
    setDialog({ titulo:"Cancelar viaje", mensaje:`¿Cancelar el viaje ${viaje.ruta?.nombre} del ${fmtFechaCorta(viaje.fecha)}?`, danger:true,
      onConfirm: async () => {
        await supabase.from("viajes").update({estado:"cancelado"}).eq("id",viaje.id);
        await supabase.from("reservas").update({estado:"cancelada"}).eq("viaje_id",viaje.id);
        showToast("🚫 Viaje cancelado"); setDialog(null); cargarViajes();
      }
    });
  };

  const agregarBloqueoDia = async (fecha, motivo, aplica_a="ambos") => {
    if (!fecha) { showToast("⚠️ Selecciona una fecha"); return; }
    const { error } = await supabase.from("bloqueos").insert({ tipo:"dia", fecha, motivo:motivo||null, aplica_a });
    if (!error) { showToast("🔒 Fecha bloqueada"); cargarBloqueos(); } else showToast("❌ "+error.message);
  };

  const agregarBloqueoMes = async (mes, anio, motivo, aplica_a="ambos") => {
    if (!mes||!anio) { showToast("⚠️ Selecciona mes y año"); return; }
    const { error } = await supabase.from("bloqueos").insert({ tipo:"mes", mes:Number(mes), anio:Number(anio), motivo:motivo||null, aplica_a });
    if (!error) { showToast("🔒 Mes bloqueado"); cargarBloqueos(); } else showToast("❌ "+error.message);
  };

  const eliminarBloqueo = (id) => {
    setDialog({ titulo:"Eliminar bloqueo", mensaje:"¿Eliminar este bloqueo?", danger:true,
      onConfirm: async () => {
        await supabase.from("bloqueos").delete().eq("id",id);
        showToast("✅ Bloqueo eliminado"); cargarBloqueos(); setDialog(null);
      }
    });
  };

  const crearSocio = async (form) => {
    const { error } = await supabase.from("socios").insert(form);
    if (!error) { showToast("✅ Socio creado"); cargarSocios(); }
    else showToast("❌ "+error.message);
  };

  const toggleActivoSocio = (socio) => {
    setDialog({ titulo: socio.activo?"Desactivar socio":"Activar socio",
      mensaje: `¿${socio.activo?"Desactivar":"Activar"} a ${socio.nombre_completo}?`,
      danger: socio.activo,
      onConfirm: async () => {
        await supabase.from("socios").update({activo:!socio.activo}).eq("id",socio.id);
        showToast(socio.activo?"🔴 Socio desactivado":"✅ Socio activado"); cargarSocios(); setDialog(null);
      }
    });
  };

  const crearVehiculo = async (form) => {
    const { error } = await supabase.from("vehiculos").insert(form);
    if (!error) { showToast("✅ Vehículo agregado"); cargarSocios(); }
    else showToast("❌ "+error.message);
  };

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
      ruta_id:        formViaje.ruta_id,
      tipo:           formViaje.tipo,
      fecha:          formViaje.fecha,
      hora_salida:    formViaje.hora_salida,
      capacidad:      Number(formViaje.capacidad),
      precio_por_pax: Number(formViaje.precio_por_pax),
      socio_id:       formViaje.socio_id || null,
      vehiculo_id:    formViaje.vehiculo_id || null,
      conductor:      formViaje.conductor||null,
      vehiculo:       formViaje.vehiculo||null,
      notas_admin:    formViaje.notas_admin||null,
      estado:         "en_espera",
    }).select("*, ruta:rutas(nombre,origen,destino)").single();
    setSaving(false);
    if (!error) { setSuccessViaje(data); setFormViaje(FORM_VIAJE_INIT); setErrViaje({}); cargarViajes(); }
    else showToast("❌ Error: "+error.message);
  };

  const crearReserva = async () => {
    if (!formRes.viaje_id||!formRes.nombre||!formRes.email||!formRes.telefono) { showToast("⚠️ Completa los campos obligatorios"); return; }
    setSaving(true);
    const { error } = await supabase.from("reservas").insert({...formRes,num_asientos:Number(formRes.num_asientos)});
    setSaving(false);
    if (!error) { showToast("✅ Reserva creada"); setFormRes(FORM_RES_INIT); cargarViajes(); }
    else showToast("❌ "+error.message);
  };

  const rutaSel = rutas.find(r=>r.id===formViaje.ruta_id);
  const socioSelVehiculos = vehiculos.filter(v=>v.socio_id===formViaje.socio_id&&v.activo);

  const ICO = {
    dashboard: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    compartido: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="8" width="15" height="10" rx="2"/><path d="M16 11l5 2v5h-5V11z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>,
    privado: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 5v7h11"/></svg>,
    socios: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    bloqueos: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    "nuevo-viaje": <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg>,
    "nueva-reserva": <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  };

  const tabs = esAdmin
    ? [["dashboard","Calendario"],["compartido","Compartido"],["privado","Van Privada"],["socios","Socios"],["bloqueos","Bloqueos"],["nuevo-viaje","Nuevo Viaje"],["nueva-reserva","Nueva Reserva"]]
    : [["dashboard","Mis Viajes"]];

  return (
    <>
      <style>{css}</style>
      <div className="rm">
        {/* Drawer overlay */}
        {drawerOpen && (
          <div className="rm-drawer-ov" onClick={()=>setDrawerOpen(false)}>
            <div className="rm-drawer" onClick={e=>e.stopPropagation()}>
              <div className="rm-drawer-hdr">
                <div className="rm-drawer-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5EDD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
                    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                    <path d="M9 5v7h11"/>
                  </svg>
                </div>
                <div>
                  <div className="rm-drawer-titulo">Araucanía Viajes</div>
                  <div className="rm-drawer-sub">{esAdmin ? "👑 Admin General" : `🚐 ${socioActual?.nombre_completo?.split(" ")[0]||"Conductor"}`}</div>
                </div>
              </div>
              <nav className="rm-drawer-nav">
                {tabs.map(([k,l])=>(
                  <button key={k} className={`rm-drawer-item ${tab===k?"on":""}`}
                    onClick={()=>{setTab(k);setSuccessViaje(null);setDrawerOpen(false);}}>
                    <span className="rm-drawer-item-ico">{ICO[k]}</span>
                    {l}
                  </button>
                ))}
              </nav>
              <div className="rm-drawer-ft">
                <button className="rm-btn-salir" onClick={()=>supabase.auth.signOut()}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="rm-hdr">
          <div className="rm-hdr-marca">
            <div className="rm-hdr-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5EDD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 01-2-2V7a2 2 0 012-2h11l5 7v5h-2"/>
                <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                <path d="M9 5v7h11"/>
              </svg>
            </div>
            <div className="rm-hdr-textos">
              <h1>{esAdmin ? "Araucanía Viajes" : "Panel Conductor"}</h1>
              <small>{tabs.find(([k])=>k===tab)?.[1] || "Dashboard"}</small>
            </div>
          </div>
          <div className="rm-hdr-actions">
            <div className="rm-live-dot"/>
            <button className={`rm-burger ${drawerOpen?"open":""}`} onClick={()=>setDrawerOpen(v=>!v)}>
              <span/><span/><span/>
            </button>
          </div>
        </div>

        <div className="rm-main">

          {/* ── DASHBOARD ── */}
          {tab==="dashboard" && (
            esAdmin ? (
              <>
                <div style={{marginBottom:20}}>
                  {loading
                    ? <div className="rm-loading"><div className="rm-spinner"/><div>Cargando…</div></div>
                    : <CalendarioDashboard viajes={viajes} bloqueos={bloqueos} onDiaClick={(fecha,v)=>setModalDia({fecha,viajes:v})}/>
                  }
                </div>
                <div className="rm-kpi-grid">
                  <div className="rm-kpi"><div className="rm-kpi-num">{stats.total}</div><div className="rm-kpi-label">Viajes activos</div></div>
                  <div className="rm-kpi"><div className="rm-kpi-num accent-orange">{stats.cobrar}</div><div className="rm-kpi-label">Por cobrar</div></div>
                  <div className="rm-kpi"><div className="rm-kpi-num accent-green">{stats.confirmados}</div><div className="rm-kpi-label">Confirmados</div></div>
                  <div className="rm-kpi"><div className="rm-kpi-num kpi-money">{fmtPeso(stats.ingresos)}</div><div className="rm-kpi-label">Ingresos</div></div>
                </div>
              </>
            ) : (
              loading
                ? <div className="rm-loading"><div className="rm-spinner"/><div>Cargando…</div></div>
                : <DashboardSocio socioData={socioActual} viajes={viajes} onConfirmarCheckin={confirmarPasajero} onToast={showToast}/>
            )
          )}

          {/* ── COMPARTIDO / PRIVADO ── */}
          {["compartido","privado"].includes(tab) && (
            <>
              <div className="rm-filters">
                <input type="date" className="rm-date" value={filtroFecha} onChange={e=>setFiltroFecha(e.target.value)}/>
                {filtroFecha&&<button className="rm-fbtn" onClick={()=>setFiltroFecha("")}>✕ Limpiar</button>}
              </div>
              {loading
                ? <div className="rm-loading"><div className="rm-spinner"/><div>Cargando…</div></div>
                : (() => {
                    const reservasFlat = filtrados.flatMap(viaje=>(viaje.reservas||[]).map(r=>({...r,viaje}))).filter(r=>r.estado!=="cancelada");
                    if (reservasFlat.length===0) return <div className="rm-empty">No hay reservas activas.<button className="rm-btn" style={{marginLeft:8}} onClick={()=>setTab("nueva-reserva")}>+ Nueva reserva</button></div>;
                    return (
                      <div>
                        <div className="rm-sec-hdr">{tab==="compartido"?"COMPARTIDO":"VAN PRIVADA"} — RESERVAS ({reservasFlat.length})</div>
                        <div className="rm-cards">
                          {reservasFlat.map(r=>{
                            const viaje=r.viaje;
                            const pagado=r.pagos?.some(p=>p.estado==="completado");
                            const isOpen=abierto===r.id;
                            return (
                              <div key={r.id} className="rm-res-card" onClick={()=>setAbierto(isOpen?null:r.id)}>
                                <div className="rm-res-card-top">
                                  <div className="rm-res-nombre">{r.nombre}</div>
                                  <span className={`rm-res-badge ${viaje.tipo}`}>{viaje.tipo==="compartido"?"Compartido":"Van Privada"}</span>
                                </div>
                                <div className="rm-res-ruta">{viaje.ruta?.nombre||"Ruta sin nombre"}</div>
                                <div className="rm-res-meta">
                                  <span>🕐 {viaje.hora_salida?.slice(0,5)||"—"}</span>
                                  <span>👥 {r.num_asientos} pax</span>
                                  <span style={{color:pagado?"#16a34a":"#d97706",fontWeight:700}}>{fmtPeso(viaje.precio_por_pax*r.num_asientos)}</span>
                                  <span style={{color:pagado?"#16a34a":"#9a8e80",fontSize:".65rem"}}>{pagado?"✓ Pagado":"Pendiente"}</span>
                                </div>
                                {viaje.socio?.nombre_completo&&<div style={{fontSize:".7rem",color:"#9a8e80",marginTop:3}}>🚐 {viaje.socio.nombre_completo}</div>}
                                {isOpen&&(
                                  <div className="rm-res-actions" onClick={e=>e.stopPropagation()}>
                                    {r.estado==="pendiente"&&<button className="rm-btn green" onClick={()=>confirmarPasajero(r.id)}>✓ Confirmar</button>}
                                    {r.estado==="confirmada"&&!pagado&&<button className="rm-btn green" onClick={()=>marcarPagado(r.id,viaje.precio_por_pax*r.num_asientos)}>💳 Marcar pagado</button>}
                                    <button className="rm-btn-wa-lg" onClick={()=>{
                                      const msg=encodeURIComponent(`Hola ${r.nombre.split(" ")[0]} 👋, te contactamos desde *Araucanía Viajes* por tu reserva ${viaje.ruta?.nombre} el ${fmtFechaCorta(viaje.fecha)}.`);
                                      window.open(`https://wa.me/${r.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
                                    }}>💬 WhatsApp</button>
                                    <button className="rm-btn red" onClick={()=>cancelarPasajero(r.id,r.nombre)}>✕ Cancelar</button>
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

          {/* ── SOCIOS (solo admin) ── */}
          {tab==="socios"&&esAdmin&&(
            <PanelSocios socios={socios} vehiculos={vehiculos} onCrearSocio={crearSocio} onToggleActivo={toggleActivoSocio} onCrearVehiculo={crearVehiculo} onToast={showToast}/>
          )}

          {/* ── BLOQUEOS ── */}
          {tab==="bloqueos"&&esAdmin&&(
            <BloqueoPanel bloqueos={bloqueos} onBloqueoDia={agregarBloqueoDia} onBloqueoMes={agregarBloqueoMes} onEliminar={eliminarBloqueo}/>
          )}

          {/* ── NUEVO VIAJE ── */}
          {tab==="nuevo-viaje"&&esAdmin&&(
            successViaje ? (
              <div className="rm-form-wrap rm-success">
                <div className="rm-success-icon">🎉</div>
                <h3>¡Viaje creado!</h3>
                <p>{successViaje.ruta?.nombre} · {fmtFechaCorta(successViaje.fecha)} · {successViaje.hora_salida?.slice(0,5)}</p>
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  <button className="rm-btn-primary" onClick={()=>setSuccessViaje(null)}>+ Crear otro</button>
                  <button className="rm-btn-ghost" onClick={()=>{setFormRes(f=>({...f,viaje_id:successViaje.id}));setTab("nueva-reserva");}}>➕ Agregar reserva</button>
                  <button className="rm-btn-ghost" onClick={()=>setTab("dashboard")}>Ver dashboard</button>
                </div>
              </div>
            ) : (
              <div className="rm-form-wrap">
                <div className="rm-form-title">🗓️ Programar nuevo viaje</div>
                <div className="rm-form-section">1. Ruta y tipo</div>
                <div className="rm-grid">
                  <div className="rm-field rm-col2">
                    <label>Ruta <span>*</span></label>
                    <select className={errViaje.ruta_id?"err":""} value={formViaje.ruta_id} onChange={e=>setFormViaje(f=>({...f,ruta_id:e.target.value}))}>
                      <option value="">Selecciona una ruta…</option>
                      {rutas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
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
                    <input type="number" min="1" max="20" value={formViaje.capacidad} onChange={e=>setFormViaje(f=>({...f,capacidad:e.target.value}))}/>
                  </div>
                </div>

                <div className="rm-form-section">2. Fecha, hora y precio</div>
                <div className="rm-grid-3">
                  <div className="rm-field"><label>Fecha <span>*</span></label><input type="date" className={errViaje.fecha?"err":""} value={formViaje.fecha} onChange={e=>setFormViaje(f=>({...f,fecha:e.target.value}))}/></div>
                  <div className="rm-field"><label>Hora salida <span>*</span></label><input type="time" value={formViaje.hora_salida} onChange={e=>setFormViaje(f=>({...f,hora_salida:e.target.value}))}/></div>
                  <div className="rm-field">
                    <label>Precio/pax (CLP) <span>*</span></label>
                    <input type="number" min="0" placeholder="Ej: 12000" className={errViaje.precio_por_pax?"err":""} value={formViaje.precio_por_pax} onChange={e=>setFormViaje(f=>({...f,precio_por_pax:e.target.value}))}/>
                    {formViaje.precio_por_pax>0&&<span className="rm-field-hint">{fmtPeso(formViaje.precio_por_pax)} por asiento</span>}
                  </div>
                </div>

                <div className="rm-form-section">3. Asignar socio conductor</div>
                <div className="rm-grid">
                  <div className="rm-field">
                    <label>Socio conductor</label>
                    <select value={formViaje.socio_id} onChange={e=>setFormViaje(f=>({...f,socio_id:e.target.value,vehiculo_id:""}))}>
                      <option value="">Sin asignar</option>
                      {socios.filter(s=>s.activo).map(s=><option key={s.id} value={s.id}>{s.nombre_completo}</option>)}
                    </select>
                  </div>
                  <div className="rm-field">
                    <label>Vehículo</label>
                    <select value={formViaje.vehiculo_id} onChange={e=>setFormViaje(f=>({...f,vehiculo_id:e.target.value}))} disabled={!formViaje.socio_id}>
                      <option value="">Sin asignar</option>
                      {socioSelVehiculos.map(v=><option key={v.id} value={v.id}>{v.patente} · {v.marca} {v.modelo} ({v.capacidad_pasajeros}pax)</option>)}
                    </select>
                  </div>
                  <div className="rm-field rm-col2">
                    <label>Notas internas</label>
                    <textarea rows="2" placeholder="Punto de encuentro, indicaciones…" value={formViaje.notas_admin} onChange={e=>setFormViaje(f=>({...f,notas_admin:e.target.value}))}/>
                  </div>
                </div>

                {(rutaSel||formViaje.fecha)&&(
                  <div className="rm-preview">
                    <div style={{fontSize:"1.5rem"}}>{formViaje.tipo==="compartido"?"🚌":"🚐"}</div>
                    {rutaSel&&<div className="rm-preview-item"><div className="rm-preview-lbl">Ruta</div><div className="rm-preview-val">{rutaSel.nombre}</div></div>}
                    {formViaje.fecha&&<div className="rm-preview-item"><div className="rm-preview-lbl">Fecha</div><div className="rm-preview-val">{fmtFechaCorta(formViaje.fecha)}</div></div>}
                    {formViaje.hora_salida&&<div className="rm-preview-item"><div className="rm-preview-lbl">Hora</div><div className="rm-preview-val">{formViaje.hora_salida}</div></div>}
                    {formViaje.socio_id&&<div className="rm-preview-item"><div className="rm-preview-lbl">Conductor</div><div className="rm-preview-val">{socios.find(s=>s.id===formViaje.socio_id)?.nombre_completo?.split(" ")[0]}</div></div>}
                  </div>
                )}
                <div className="rm-form-actions">
                  <button className="rm-btn-ghost" onClick={()=>{setFormViaje(FORM_VIAJE_INIT);setErrViaje({});}}>Limpiar</button>
                  <button className="rm-btn-primary" onClick={crearViaje} disabled={saving}>{saving?"Guardando…":"🗓️ Crear viaje"}</button>
                </div>
              </div>
            )
          )}

          {/* ── NUEVA RESERVA ── */}
          {tab==="nueva-reserva"&&esAdmin&&(
            <div className="rm-form-wrap">
              <div className="rm-form-title">➕ Agregar reserva manual</div>
              <div className="rm-form-sub">Para reservas recibidas por teléfono, WhatsApp o presencialmente.</div>
              <div className="rm-form-section">Viaje</div>
              <div className="rm-field">
                <label>Viaje <span style={{color:"#dc2626"}}>*</span></label>
                <select value={formRes.viaje_id} onChange={e=>setFormRes(f=>({...f,viaje_id:e.target.value}))}>
                  <option value="">Selecciona un viaje…</option>
                  {viajes.filter(v=>!["cancelado","completado"].includes(v.estado)).map(v=>(
                    <option key={v.id} value={v.id}>{v.ruta?.nombre} · {fmtFechaCorta(v.fecha)} {v.hora_salida?.slice(0,5)} · {v.tipo} · {fmtPeso(v.precio_por_pax)}/pax</option>
                  ))}
                </select>
              </div>
              <div className="rm-form-section">Pasajero</div>
              <div className="rm-grid">
                <div className="rm-field"><label>Nombre <span style={{color:"#dc2626"}}>*</span></label><input placeholder="Ana Martínez" value={formRes.nombre} onChange={e=>setFormRes(f=>({...f,nombre:e.target.value}))}/></div>
                <div className="rm-field"><label>Teléfono <span style={{color:"#dc2626"}}>*</span></label><input placeholder="+56 9 1234 5678" value={formRes.telefono} onChange={e=>setFormRes(f=>({...f,telefono:e.target.value}))}/></div>
                <div className="rm-field"><label>Email <span style={{color:"#dc2626"}}>*</span></label><input type="email" placeholder="correo@email.com" value={formRes.email} onChange={e=>setFormRes(f=>({...f,email:e.target.value}))}/></div>
                <div className="rm-field"><label>Nº asientos</label><input type="number" min="1" max="8" value={formRes.num_asientos} onChange={e=>setFormRes(f=>({...f,num_asientos:e.target.value}))}/></div>
                <div className="rm-field">
                  <label>Origen</label>
                  <select value={formRes.origen_reserva} onChange={e=>setFormRes(f=>({...f,origen_reserva:e.target.value}))}>
                    <option value="telefono">📞 Teléfono</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="web">🌐 Web</option>
                    <option value="presencial">🤝 Presencial</option>
                  </select>
                </div>
                <div className="rm-field rm-col2"><label>Notas</label><textarea rows="2" placeholder="Petición especial…" value={formRes.notas} onChange={e=>setFormRes(f=>({...f,notas:e.target.value}))}/></div>
              </div>
              <div className="rm-form-actions">
                <button className="rm-btn-ghost" onClick={()=>setFormRes(FORM_RES_INIT)}>Limpiar</button>
                <button className="rm-btn-primary" onClick={crearReserva} disabled={saving}>{saving?"Guardando…":"✓ Crear reserva"}</button>
              </div>
            </div>
          )}
        </div>

        {toast&&<div className="rm-toast">{toast}</div>}

        {dialog&&!modalDia&&(
          <div className="rm-ov" onClick={()=>setDialog(null)}>
            <div className="rm-dlg" onClick={e=>e.stopPropagation()}>
              <h3>{dialog.titulo}</h3><p>{dialog.mensaje}</p>
              <div className="rm-dlg-btns">
                <button className="rm-btn-ghost" onClick={()=>setDialog(null)}>Cancelar</button>
                <button className={dialog.danger?"rm-btn-danger":"rm-btn-confirm"} onClick={dialog.onConfirm}>{dialog.danger?"Sí, confirmar":"✓ Confirmar"}</button>
              </div>
            </div>
          </div>
        )}

        {modalDia&&(
          <ModalDia fecha={modalDia.fecha} viajes={modalDia.viajes} onClose={()=>setModalDia(null)}
            onConfirmarPasajero={confirmarPasajero} onCancelarPasajero={cancelarPasajero}
            onMarcarPagado={marcarPagado} onCancelarViaje={cancelarViaje} esAdmin={esAdmin}/>
        )}

        {dialog&&modalDia&&(
          <div className="rm-ov" style={{zIndex:300}} onClick={()=>setDialog(null)}>
            <div className="rm-dlg" onClick={e=>e.stopPropagation()}>
              <h3>{dialog.titulo}</h3><p>{dialog.mensaje}</p>
              <div className="rm-dlg-btns">
                <button className="rm-btn-ghost" onClick={()=>setDialog(null)}>Cancelar</button>
                <button className={dialog.danger?"rm-btn-danger":"rm-btn-confirm"} onClick={dialog.onConfirm}>{dialog.danger?"Sí, cancelar":"✓ Confirmar"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ReservationManager() {
  return (
    <AuthGate>
      {({ perfil }) => <ReservationManagerInner perfil={perfil}/>}
    </AuthGate>
  );
}