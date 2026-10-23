/* © 2026 Christian Alejandro Rojas Franco. Todos los derechos reservados.
   R.O.S.A. es software propietario de su autor; esta app la integra con licencia de uso
   no exclusiva y revocable. La integración no transfiere la propiedad de R.O.S.A. */
/* ============================================================
   FORJA — Rosa (asistente de IA)
   Burbuja flotante con chat, voz y accesos a secciones.
   Por ahora SOLO aparece para las cuentas de ROSA_CUENTAS.
   El servidor (Vercel) vuelve a verificar la cuenta con el token
   de Firebase, así que ocultarla aquí es comodidad, no seguridad.
   ============================================================ */
(function(){
'use strict';

/* ---------- Configuración ---------- */
const ROSA_API = 'https://rosa-three-sage.vercel.app/api/forja';
const ROSA_CUENTAS = ['christian.rojas.gerente.r9@gmail.com'];
const LS_HIST = 'forja_rosa_hist', LS_VOZ = 'forja_rosa_voz';
const MAX_HIST = 40;
const SECCION_NOMBRE = {rutinas:'Rutinas', progreso:'Progreso', coaches:'Coaches', calorias:'Calorías', dieta:'Dieta', fotos:'Fotos'};
const CHIPS = ['Explícame un ejercicio de hoy','Adapta mi rutina de hoy','¿Subo peso hoy?','Motívame','Me duele algo'];

/* ---------- Utilidades ---------- */
const leer=(k,d)=>{ try{ const v=localStorage.getItem(k); return v===null?d:JSON.parse(v); }catch(e){ return d; } };
const guardar=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const usuarioActual=()=>{ try{ return (typeof fbAuth!=='undefined' && fbAuth && fbAuth.currentUser) || null; }catch(e){ return null; } };
const autorizado=u=>!!(u && u.email && ROSA_CUENTAS.includes(String(u.email).toLowerCase()));

let historial = leer(LS_HIST, []);
let vozActiva = leer(LS_VOZ, true);
let ocupada = false, montada = false;

/* ---------- Estilos ---------- */
const css=document.createElement('style');
css.textContent=`
.rz-fab{position:fixed;right:18px;bottom:24px;z-index:90;width:60px;height:60px;border-radius:50%;border:0;padding:0;cursor:pointer;
  background:radial-gradient(circle at 50% 50%,#2a1424 0 40%,#120a12 41% 100%);box-shadow:0 8px 26px rgba(0,0,0,.55),0 0 0 1px rgba(255,92,147,.5);display:grid;place-items:center}
.rz-fab:focus-visible{outline:2px solid #FF5C93;outline-offset:3px}
.rz-fab i{position:absolute;border-radius:50%;pointer-events:none}
.rz-fab .r1{inset:4px;border:1px dashed rgba(255,92,147,.55);animation:rzGiro 14s linear infinite}
.rz-fab .r2{inset:10px;border:2px solid transparent;border-top-color:#FF5C93;border-bottom-color:#FF5C93;animation:rzGiro 6s linear infinite reverse}
.rz-fab .nucleo{width:16px;height:16px;border-radius:50%;background:#FF5C93;box-shadow:0 0 14px #FF5C93;animation:rzPulso 3s ease-in-out infinite}
.rz-fab.oculta{display:none}
.rz-panel{position:fixed;right:18px;bottom:96px;z-index:95;width:min(400px,calc(100vw - 24px));height:min(600px,calc(100dvh - 140px));
  display:none;flex-direction:column;background:rgba(12,10,14,.97);border:1px solid #3A2836;border-radius:20px;
  box-shadow:0 20px 60px rgba(0,0,0,.65);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#F3EEF5;overflow:hidden;
  font-family:inherit}
.rz-panel.abierta{display:flex}
.rz-cab{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 16px;border-bottom:1px solid #2E2230}
.rz-cab .t{flex:1;min-width:0}
.rz-cab .n{font-weight:800;letter-spacing:4px;font-size:15px}
.rz-cab .s{font-size:11.5px;color:#A69DB3;margin-top:2px}
.rz-est{margin-top:3px;font-size:10.5px;letter-spacing:2px;color:#FF8AB3;font-family:ui-monospace,monospace}
.rz-ib{width:40px;height:40px;flex:none;border-radius:10px;border:1px solid #3A2836;background:#160F18;color:#F3EEF5;display:grid;place-items:center;cursor:pointer;padding:0}
.rz-ib svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rz-ib:focus-visible,.rz-chip:focus-visible,.rz-in:focus-visible,.rz-ir:focus-visible{outline:2px solid #FF5C93;outline-offset:2px}
.rz-ib[aria-pressed="false"]{color:#8E859C}
.rz-chat{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.rz-m{max-width:88%;font-size:14.5px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.rz-m.yo{align-self:flex-end;background:#2A1C27;padding:9px 13px;border-radius:14px 14px 4px 14px}
.rz-m.rosa{align-self:flex-start;display:flex;flex-direction:column;gap:6px}
.rz-m.rosa .b{background:#160F18;border:1px solid #3A2836;padding:9px 13px;border-radius:14px 14px 14px 4px}
.rz-m.rosa.err .b{border-color:#6B2B3A;color:#FFC2D0}
.rz-m.rosa.esp .b{color:#A69DB3}
.rz-ir{align-self:flex-start;min-height:36px;padding:0 14px;border-radius:99px;border:1px solid #FF5C93;background:transparent;color:#FF8AB3;font-weight:700;font-size:13px;cursor:pointer}
.rz-chips{display:flex;gap:8px;overflow-x:auto;padding:0 12px 10px;scrollbar-width:none}
.rz-chips::-webkit-scrollbar{display:none}
.rz-chip{flex:none;min-height:36px;padding:0 13px;border-radius:99px;border:1px solid #3A2836;background:#160F18;color:#F3EEF5;font-size:13px;cursor:pointer;white-space:nowrap}
.rz-chip:hover{border-color:#FF5C93}
.rz-pie{display:flex;gap:8px;padding:10px 12px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid #2E2230}
.rz-in{flex:1;min-width:0;height:44px;padding:0 13px;border-radius:12px;border:1px solid #3A2836;background:#0E0C14;color:#F3EEF5;font-size:16px;font-family:inherit}
.rz-in::placeholder{color:#8E859C}
.rz-mic{color:#FF5C93;border-color:#FF5C93;width:44px;height:44px}
.rz-env{background:#FF5C93;border-color:#FF5C93;color:#0A0910;width:44px;height:44px}
.rz-panel.oyendo .rz-mic{background:#FF5C93;color:#0A0910}
.rz-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes rzGiro{to{transform:rotate(360deg)}}
@keyframes rzPulso{0%,100%{transform:scale(.9);opacity:.75}50%{transform:scale(1.08);opacity:1}}
@media (max-width:760px){
  .rz-fab{bottom:calc(82px + env(safe-area-inset-bottom,0px));right:14px;width:54px;height:54px}
  .rz-panel{right:8px;left:8px;width:auto;bottom:calc(76px + env(safe-area-inset-bottom,0px));height:calc(100dvh - 150px - env(safe-area-inset-bottom,0px))}
}
@media (prefers-reduced-motion:reduce){.rz-fab i,.rz-fab .nucleo{animation:none}}
`;
document.head.appendChild(css);

/* ---------- Contexto de FORJA que Rosa puede ver ---------- */
function contexto(){
  const c={};
  const intenta=(k,fn)=>{ try{ const v=fn(); if(v!==undefined && v!==null) c[k]=v; }catch(e){} };
  intenta('nombre', ()=>displayName);
  intenta('seccionActual', ()=>location.hash.slice(1)||'inicio');
  intenta('plan', ()=>plan);
  intenta('entorno', ()=>({gym:'gimnasio',home:'casa',park:'parque de calistenia'})[mode]||mode);
  intenta('objetivo', ()=>goal);
  intenta('gruposDeHoy', ()=>gruposElegidosHoy()||gruposDelSplit());
  intenta('rutinaElegidaAMano', ()=>!!gruposElegidosHoy());
  intenta('rutinaDeHoy', ()=>{
    const R=getRoutines(); const grupos=gruposElegidosHoy()||gruposDelSplit();
    const out={};
    grupos.forEach(g=>{
      if(!R[g]) return;
      out[R[g].label||g]=R[g].ex.map(e=>{
        const ov=(typeof exset!=='undefined' && exset[e.n])||{};
        const hecho=(typeof doneToday!=='undefined' && doneToday && doneToday[e.n]);
        return {ejercicio:e.n, series:ov.s||e.s, reps:ov.r||e.r, max:ov.max||e.max, hecho:!!hecho};
      });
    });
    return out;
  });
  intenta('grupoEnPantalla', ()=>currentMuscle);
  intenta('racha', ()=>window.FORJARacha && FORJARacha.calcular());
  intenta('ultimasSeries', ()=>{
    if(typeof series==='undefined') return null;
    const fechas=Object.keys(series).sort().slice(-3);
    const out={};
    fechas.forEach(f=>{ out[f]={}; Object.keys(series[f]).slice(0,12).forEach(ex=>{ out[f][ex]=series[f][ex].slice(0,6).map(s=>`${s.p||0}kg x ${s.r||0}`); }); });
    return out;
  });
  intenta('records', ()=>{
    if(typeof prs==='undefined' || !prs) return null;
    return Object.fromEntries(Object.entries(prs).slice(0,15));
  });
  return c;
}

/* ---------- Interfaz ---------- */
let fab, panel, chat, entrada, estado, btnVoz;
const ESTADOS={espera:'EN ESPERA',oyendo:'● ESCUCHANDO',pensando:'PROCESANDO…',hablando:'HABLANDO'};
function ponerEstado(e){ if(estado) estado.textContent=ESTADOS[e]||''; if(panel) panel.classList.toggle('oyendo', e==='oyendo'); }

function icono(d){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`; }

function montar(){
  if(montada) return; montada=true;
  fab=document.createElement('button');
  fab.type='button'; fab.className='rz-fab'; fab.setAttribute('aria-label','Abrir a Rosa, asistente de FORJA');
  fab.innerHTML='<i class="r1"></i><i class="r2"></i><span class="nucleo"></span>';
  panel=document.createElement('section');
  panel.className='rz-panel'; panel.setAttribute('aria-label','Rosa, asistente de FORJA');
  panel.innerHTML=`
    <div class="rz-cab">
      <div class="t"><div class="n">ROSA</div><div class="s">Asistente de entrenamiento</div><div class="rz-est">EN ESPERA</div></div>
      <button type="button" class="rz-ib rz-voz" aria-label="Activar o silenciar la voz de Rosa" aria-pressed="true">${icono('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>')}</button>
      <button type="button" class="rz-ib rz-borrar" aria-label="Borrar conversación">${icono('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')}</button>
      <button type="button" class="rz-ib rz-cerrar" aria-label="Cerrar">${icono('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
    </div>
    <div class="rz-chat" aria-live="polite"></div>
    <div class="rz-chips">${CHIPS.map(t=>`<button type="button" class="rz-chip">${t}</button>`).join('')}</div>
    <form class="rz-pie" autocomplete="off">
      <label class="rz-sr" for="rzTexto">Mensaje para Rosa</label>
      <input id="rzTexto" class="rz-in" type="text" placeholder="Pregúntele a Rosa…" enterkeyhint="send">
      <button type="button" class="rz-ib rz-mic" aria-label="Hablar con Rosa">${icono('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>')}</button>
      <button type="submit" class="rz-ib rz-env" aria-label="Enviar">${icono('<path d="M5 12h14M13 6l6 6-6 6"/>')}</button>
    </form>`;
  document.body.append(fab, panel);
  chat=panel.querySelector('.rz-chat'); entrada=panel.querySelector('.rz-in');
  estado=panel.querySelector('.rz-est'); btnVoz=panel.querySelector('.rz-voz');

  fab.addEventListener('click', ()=>abrir(!panel.classList.contains('abierta')));
  panel.querySelector('.rz-cerrar').addEventListener('click', ()=>abrir(false));
  panel.querySelector('.rz-borrar').addEventListener('click', ()=>{ historial=[]; guardar(LS_HIST,historial); pintarTodo(); });
  panel.querySelector('.rz-chips').addEventListener('click', e=>{ const b=e.target.closest('.rz-chip'); if(b) enviar(b.textContent); });
  panel.querySelector('.rz-pie').addEventListener('submit', e=>{ e.preventDefault(); enviar(entrada.value); });
  panel.querySelector('.rz-mic').addEventListener('click', escuchar);
  btnVoz.addEventListener('click', ()=>{ vozActiva=!vozActiva; guardar(LS_VOZ,vozActiva); pintarVoz(); if(!vozActiva) callar(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && panel.classList.contains('abierta')) abrir(false); });
  pintarVoz(); pintarTodo();
}

function desmontar(){
  if(!montada) return;
  callar(); fab.remove(); panel.remove(); montada=false;
}

function abrir(si){
  panel.classList.toggle('abierta', si);
  fab.setAttribute('aria-expanded', String(si));
  if(si){ setTimeout(()=>entrada.focus(), 50); chat.scrollTop=chat.scrollHeight; }
  else { callar(); fab.focus(); }
}

function pintarVoz(){ btnVoz.setAttribute('aria-pressed', String(vozActiva)); }

function saludo(){
  const h=new Date().getHours();
  const p = h<12 ? 'Buenos días' : h<19 ? 'Buenas tardes' : 'Buenas noches';
  return `${p}, licenciado. Rosa en línea dentro de FORJA. ¿Revisamos la rutina de hoy?`;
}

function pintarMsg(rol, texto, extra, ir){
  const d=document.createElement('div');
  if(rol==='yo'){ d.className='rz-m yo'; d.textContent=texto; }
  else{
    d.className='rz-m rosa'+(extra?' '+extra:'');
    const b=document.createElement('div'); b.className='b'; b.textContent=texto; d.appendChild(b);
    if(ir && SECCION_NOMBRE[ir]){
      const a=document.createElement('button'); a.type='button'; a.className='rz-ir';
      a.textContent='Ir a '+SECCION_NOMBRE[ir]+' →';
      a.addEventListener('click', ()=>{ try{ go(ir); }catch(e){ location.hash=ir; } if(window.matchMedia('(max-width:760px)').matches) abrir(false); });
      d.appendChild(a);
    }
  }
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
  return d;
}

function pintarTodo(){
  chat.innerHTML='';
  if(!historial.length){ pintarMsg('rosa', saludo()); return; }
  historial.forEach(m=>pintarMsg(m.rol==='rosa'?'rosa':'yo', m.texto, '', m.ir));
}

/* ---------- Conversación ---------- */
async function enviar(texto){
  texto=(texto||'').trim();
  if(!texto || ocupada) return;
  const u=usuarioActual();
  if(!autorizado(u)){ pintarMsg('rosa','Necesito que inicie sesión con su cuenta, licenciado.','err'); return; }
  ocupada=true; callar();
  historial.push({rol:'usuario', texto}); guardar(LS_HIST, historial.slice(-MAX_HIST));
  pintarMsg('yo', texto); entrada.value='';
  ponerEstado('pensando');
  const espera=pintarMsg('rosa','…','esp');
  try{
    const token=await u.getIdToken();
    const r=await fetch(ROSA_API,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({mensajes:historial.slice(-16), contexto:contexto()})
    });
    const datos=await r.json().catch(()=>({}));
    espera.remove();
    if(!r.ok){
      historial.pop(); guardar(LS_HIST, historial);
      pintarMsg('rosa', datos.error||'Algo falló de mi lado. Intente de nuevo.', 'err');
      ponerEstado('espera'); return;
    }
    const msg={rol:'rosa', texto:datos.texto||'', ir:datos.ir||null};
    historial.push(msg); historial=historial.slice(-MAX_HIST); guardar(LS_HIST, historial);
    pintarMsg('rosa', msg.texto, '', msg.ir);
    hablar(msg.texto);
  }catch(e){
    espera.remove(); historial.pop(); guardar(LS_HIST, historial);
    pintarMsg('rosa','No logro conectarme. Revise su internet, licenciado.','err');
    ponerEstado('espera');
  }finally{ ocupada=false; }
}

/* ---------- Voz: hablar ---------- */
let voz=null;
function elegirVoz(){
  if(!('speechSynthesis' in window)) return;
  const vs=speechSynthesis.getVoices().filter(v=>v.lang && v.lang.toLowerCase().startsWith('es'));
  const pref=['dalia','sabina','paulina','elena','female'];
  voz=vs.find(v=>v.lang==='es-MX' && pref.some(p=>v.name.toLowerCase().includes(p))) || vs.find(v=>v.lang==='es-MX') || vs.find(v=>v.lang.startsWith('es-US')) || vs[0] || null;
}
if('speechSynthesis' in window){ elegirVoz(); speechSynthesis.addEventListener('voiceschanged', elegirVoz); }
function hablar(t){
  if(!vozActiva || !('speechSynthesis' in window) || !t || !panel.classList.contains('abierta')){ ponerEstado('espera'); return; }
  const f=new SpeechSynthesisUtterance(t.replace(/[*_#`>]/g,''));
  f.lang=voz?voz.lang:'es-MX'; if(voz) f.voice=voz; f.rate=1.05;
  f.onstart=()=>ponerEstado('hablando'); f.onend=f.onerror=()=>ponerEstado('espera');
  speechSynthesis.cancel(); speechSynthesis.speak(f);
}
function callar(){ try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){} ponerEstado('espera'); }

/* ---------- Voz: escuchar ---------- */
const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
let oyente=null, oyendo=false;
if(Rec){
  oyente=new Rec(); oyente.lang='es-MX'; oyente.interimResults=true; oyente.continuous=false;
  oyente.onresult=e=>{
    let t=''; for(const r of e.results) t+=r[0].transcript;
    entrada.value=t;
    if(e.results[e.results.length-1].isFinal){ oyente.stop(); enviar(t); }
  };
  oyente.onend=()=>{ oyendo=false; if(!ocupada) ponerEstado('espera'); };
  oyente.onerror=e=>{ oyendo=false; ponerEstado('espera'); if(e.error==='not-allowed') pintarMsg('rosa','No tengo permiso para usar el micrófono. Actívelo en el navegador.','err'); };
}
function escuchar(){
  if(!oyente){ pintarMsg('rosa','Este navegador no me deja escuchar. Use Chrome o Edge.','err'); return; }
  if(oyendo){ oyente.stop(); return; }
  callar();
  try{ oyente.start(); oyendo=true; ponerEstado('oyendo'); }catch(e){}
}

/* ---------- Arranque: solo para cuentas autorizadas ---------- */
function revisar(u){ if(autorizado(u)) montar(); else desmontar(); }
function iniciar(){
  try{
    if(typeof fbAuth!=='undefined' && fbAuth){ fbAuth.onAuthStateChanged(revisar); return; }
  }catch(e){}
  /* Firebase aún no está listo: reintenta unos segundos */
  let n=0; const t=setInterval(()=>{ n++; try{ if(typeof fbAuth!=='undefined' && fbAuth){ clearInterval(t); fbAuth.onAuthStateChanged(revisar); } }catch(e){} if(n>40) clearInterval(t); }, 250);
}
iniciar();
window.FORJARosa={ abrir:()=>montada&&abrir(true), contexto };
})();
