import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/*
 * Vitrina comercial de Hostelia (B2B).
 * Audiencia: dueños de hostales. Vende el sistema, no camas.
 * "Ver demo" → landing del Hostal Patagonia ("/").
 */

const WA = 'https://wa.me/56900000000'; // ← reemplazar por el WhatsApp comercial real
const PLAN_PRO = 39900;

const fmt = (n) => '$' + n.toLocaleString('es-CL');

export default function VitrinaHostelia() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState(1500000);
  const comision = Math.round(ventas * 0.15);

  return (
    <div className="vh">
      <style>{`
        .vh{--bosque:#1a2e1e;--bosque2:#24402a;--crema:#faf7f0;--tinta:#1c1c1a;--acento:#FF6A2F;--verde:#1D9E75;--gris:#6b7264;
          font-family:'DM Sans',sans-serif;color:var(--tinta);background:var(--crema);line-height:1.6}
        .vh h1,.vh h2,.vh h3{font-family:'Cormorant Garamond',Georgia,serif;line-height:1.15}
        .vh .wrap{max-width:1040px;margin:0 auto;padding:0 24px}
        .vh .btn{display:inline-block;padding:14px 28px;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
        .vh .btn-p{background:var(--acento);color:#fff;box-shadow:0 6px 24px rgba(255,106,47,.35)}
        .vh .btn-s{background:transparent;color:var(--crema);border:1.5px solid rgba(250,247,240,.4)}
        .vh .btn-o{background:var(--bosque);color:var(--crema)}
        .vh nav{position:sticky;top:0;background:rgba(26,46,30,.97);z-index:50;padding:16px 0}
        .vh nav .wrap{display:flex;justify-content:space-between;align-items:center}
        .vh .logo{font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;color:var(--crema)}
        .vh .logo span{color:var(--acento)}
        .vh nav a.lnk,.vh nav button.lnk{color:rgba(250,247,240,.75);text-decoration:none;font-size:14px;margin-left:22px;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif}
        .vh .hero{background:linear-gradient(180deg,var(--bosque),var(--bosque2));color:var(--crema);padding:88px 0 96px;text-align:center}
        .vh .hero h1{font-size:clamp(38px,6vw,64px);font-weight:600;max-width:820px;margin:0 auto 20px}
        .vh .hero h1 em{font-style:italic;color:var(--acento)}
        .vh .hero .sub{font-size:19px;color:rgba(250,247,240,.8);max-width:620px;margin:0 auto 36px}
        .vh .ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .vh .badges{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:44px;font-size:13px;color:rgba(250,247,240,.65)}
        .vh .badges span::before{content:"✓ ";color:var(--verde);font-weight:700}
        .vh .dolor{padding:84px 0}
        .vh .dolor .grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
        .vh .dolor h2{font-size:clamp(30px,4vw,42px);margin-bottom:18px}
        .vh .dolor p{color:var(--gris);font-size:16px;margin-bottom:14px}
        .vh .calc{background:#fff;border-radius:20px;padding:32px;box-shadow:0 8px 40px rgba(26,46,30,.10)}
        .vh .calc label{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gris)}
        .vh .calc input[type=range]{width:100%;margin:18px 0 6px;accent-color:var(--acento)}
        .vh .monto{font-size:28px;font-weight:700}
        .vh .fila{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px solid #eee9df}
        .vh .fila:last-child{border-bottom:none}
        .vh .perdida{color:#C0392B;font-weight:700}
        .vh .ahorro{color:var(--verde);font-weight:700;font-size:22px}
        .vh .nota{font-size:11px;color:#a8a396;margin-top:10px}
        .vh .feat{background:var(--bosque);color:var(--crema);padding:84px 0}
        .vh .feat h2{font-size:clamp(30px,4vw,42px);text-align:center;margin-bottom:12px}
        .vh .feat .sub{text-align:center;color:rgba(250,247,240,.7);margin-bottom:48px}
        .vh .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
        .vh .card{background:rgba(250,247,240,.06);border:1px solid rgba(250,247,240,.12);border-radius:16px;padding:26px}
        .vh .card .ico{font-size:26px;margin-bottom:12px}
        .vh .card h3{font-size:20px;margin-bottom:8px}
        .vh .card p{font-size:14px;color:rgba(250,247,240,.72)}
        .vh .pasos{padding:84px 0;text-align:center}
        .vh .pasos h2{font-size:clamp(30px,4vw,42px);margin-bottom:48px}
        .vh .pasos .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:28px}
        .vh .num{width:52px;height:52px;border-radius:50%;background:var(--bosque);color:var(--crema);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin:0 auto 16px;font-family:'Cormorant Garamond',Georgia,serif}
        .vh .paso h3{font-size:21px;margin-bottom:8px}
        .vh .paso p{font-size:14px;color:var(--gris)}
        .vh .destaque{margin-top:40px;font-size:15px;color:var(--bosque);font-weight:700}
        .vh .precios{background:#f1ede3;padding:84px 0}
        .vh .precios h2{font-size:clamp(30px,4vw,42px);text-align:center;margin-bottom:48px}
        .vh .planes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:22px;align-items:stretch}
        .vh .plan{background:#fff;border-radius:20px;padding:34px 28px;text-align:center;position:relative;display:flex;flex-direction:column}
        .vh .plan.pro{border:2px solid var(--acento);box-shadow:0 12px 48px rgba(255,106,47,.18)}
        .vh .tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--acento);color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;padding:5px 14px;border-radius:20px}
        .vh .plan h3{font-size:24px;margin-bottom:6px}
        .vh .precio{font-size:38px;font-weight:700;margin:10px 0 2px}
        .vh .precio small{font-size:14px;font-weight:400;color:var(--gris)}
        .vh .plan ul{list-style:none;text-align:left;margin:22px 0 28px;flex:1;padding:0}
        .vh .plan li{font-size:14px;color:#444;padding:7px 0;border-bottom:1px solid #f2efe8}
        .vh .plan li::before{content:"✓  ";color:var(--verde);font-weight:700}
        .vh .plan .btn{width:100%}
        .vh .final{background:linear-gradient(180deg,var(--bosque2),var(--bosque));color:var(--crema);text-align:center;padding:90px 0}
        .vh .final h2{font-size:clamp(32px,5vw,48px);max-width:700px;margin:0 auto 18px}
        .vh .final p{color:rgba(250,247,240,.75);margin-bottom:36px}
        .vh footer{background:var(--bosque);color:rgba(250,247,240,.5);font-size:12px;text-align:center;padding:26px 0;border-top:1px solid rgba(250,247,240,.1)}
        @media(max-width:760px){.vh .dolor .grid{grid-template-columns:1fr}}
      `}</style>

      <nav>
        <div className="wrap">
          <div className="logo">Hostel<span>ia</span></div>
          <div>
            <a className="lnk" href="#como">Cómo funciona</a>
            <a className="lnk" href="#precios">Precios</a>
            <button className="lnk" onClick={() => navigate('/')}>Ver demo</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <h1>Tu hostal con reservas online propias.<br /><em>Cero comisiones.</em></h1>
          <p className="sub">La página de reservas de tu hostal, con tu marca, pagos y panel de administración — por una suscripción fija. Deja de regalarle el 15% de cada cama a Booking.</p>
          <div className="ctas">
            <a className="btn btn-p" href={`${WA}?text=Hola,%20quiero%20saber%20más%20de%20Hostelia`} target="_blank" rel="noreferrer">Hablemos por WhatsApp</a>
            <button className="btn btn-s" onClick={() => navigate('/')}>Ver una página real →</button>
          </div>
          <div className="badges">
            <span>Funcionando en 24 horas</span>
            <span>Hecho en la Patagonia</span>
            <span>Sin permanencia</span>
          </div>
        </div>
      </header>

      <section className="dolor">
        <div className="wrap grid">
          <div>
            <h2>¿Cuánto le regalas a Booking cada año?</h2>
            <p>Cada reserva que entra por Booking.com te descuenta entre un 15% y un 25% de comisión. Es tu cliente, tu cama y tu trabajo — pero una parte importante se va afuera.</p>
            <p>Con Hostelia las reservas entran por <strong>tu propia página</strong> y el dinero completo queda contigo. Mueve el control y compara.</p>
          </div>
          <div className="calc">
            <label>Ventas mensuales vía Booking</label>
            <input type="range" min={300000} max={6000000} step={100000} value={ventas}
              onChange={(e) => setVentas(+e.target.value)} />
            <div className="monto">{fmt(ventas)}</div>
            <div className="fila"><span>Comisión Booking (15%)</span><span className="perdida">−{fmt(comision)} /mes</span></div>
            <div className="fila"><span>Al año le regalas</span><span className="perdida">−{fmt(comision * 12)}</span></div>
            <div className="fila"><span>Hostelia plan Pro</span><span>{fmt(PLAN_PRO)} fijos /mes</span></div>
            <div className="fila"><span>Tu ahorro anual</span><span className="ahorro">+{fmt(comision * 12 - PLAN_PRO * 12)}</span></div>
            <p className="nota">*Cálculo referencial con comisión del 15%. Muchos hostales pagan más.</p>
          </div>
        </div>
      </section>

      <section className="feat">
        <div className="wrap">
          <h2>Todo lo que tu hostal necesita para recibir reservas</h2>
          <p className="sub">Sin saber de tecnología. Sin contratar a nadie.</p>
          <div className="cards">
            <div className="card"><div className="ico">🌐</div><h3>Tu página propia</h3><p>Con tus fotos, tus precios y tu marca. Comparte el link en Instagram, WhatsApp y Google.</p></div>
            <div className="card"><div className="ico">📅</div><h3>Calendario y disponibilidad</h3><p>Las habitaciones ocupadas se bloquean solas. Nada de reservas duplicadas.</p></div>
            <div className="card"><div className="ico">📊</div><h3>Panel de administración</h3><p>Reservas, ingresos y ocupación en un solo lugar, desde tu celular.</p></div>
            <div className="card"><div className="ico">💬</div><h3>Aviso por WhatsApp</h3><p>Cada reserva nueva llega con los datos del huésped listos para contactarlo en un toque.</p></div>
          </div>
        </div>
      </section>

      <section className="pasos" id="como">
        <div className="wrap">
          <h2>De cero a recibir reservas en 3 pasos</h2>
          <div className="grid">
            <div className="paso"><div className="num">1</div><h3>Conversamos</h3><p>Me cuentas de tu hostal: habitaciones, precios, fotos. 30 minutos por WhatsApp bastan.</p></div>
            <div className="paso"><div className="num">2</div><h3>Configuramos todo</h3><p>Nosotros armamos tu página y tu panel. Tú no tocas nada técnico.</p></div>
            <div className="paso"><div className="num">3</div><h3>Recibes tu link</h3><p>Lo pones en tu Instagram y Google. Las reservas empiezan a llegar a tu panel.</p></div>
          </div>
          <p className="destaque">⏱ Tu página funcionando en menos de 24 horas — garantizado.</p>
        </div>
      </section>

      <section className="precios" id="precios">
        <div className="wrap">
          <h2>Un precio fijo. Sin sorpresas, sin porcentajes.</h2>
          <div className="planes">
            <div className="plan">
              <h3>Básico</h3>
              <div className="precio">$19.900<small> /mes</small></div>
              <ul>
                <li>Página de reservas propia</li>
                <li>Hasta 5 habitaciones</li>
                <li>Panel de administración</li>
                <li>Soporte por WhatsApp</li>
              </ul>
              <a className="btn btn-o" href={WA} target="_blank" rel="noreferrer">Empezar</a>
            </div>
            <div className="plan pro">
              <div className="tag">MÁS ELEGIDO</div>
              <h3>Pro</h3>
              <div className="precio">$39.900<small> /mes</small></div>
              <ul>
                <li>Todo lo del plan Básico</li>
                <li>Habitaciones ilimitadas</li>
                <li>Pago online (Flow / MercadoPago)</li>
                <li>Métricas de ocupación e ingresos</li>
                <li>Bloqueo de fechas y reserva manual</li>
              </ul>
              <a className="btn btn-p" href={WA} target="_blank" rel="noreferrer">Empezar</a>
            </div>
            <div className="plan">
              <h3>Enterprise</h3>
              <div className="precio">$79.900<small> /mes</small></div>
              <ul>
                <li>Todo lo del plan Pro</li>
                <li>Dominio propio (tuhostal.cl)</li>
                <li>Varios hostales en una cuenta</li>
                <li>Soporte prioritario</li>
              </ul>
              <a className="btn btn-o" href={WA} target="_blank" rel="noreferrer">Conversemos</a>
            </div>
          </div>
        </div>
      </section>

      <section className="final">
        <div className="wrap">
          <h2>El próximo huésped puede reservar directo contigo</h2>
          <p>Agenda una demo de 15 minutos y te mostramos tu hostal funcionando en el sistema.</p>
          <a className="btn btn-p" href={`${WA}?text=Hola,%20quiero%20una%20demo%20de%20Hostelia`} target="_blank" rel="noreferrer">Quiero mi demo gratis</a>
        </div>
      </section>

      <footer>
        Hostelia · Sistema de reservas para hostales · Hecho en la Patagonia chilena 🌲
      </footer>
    </div>
  );
}
