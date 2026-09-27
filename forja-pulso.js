/* ============================================================
   FORJA — Pulso en vivo desde el reloj / banda (Bluetooth)
   Servicio estándar Heart Rate (0x180D). Funciona en Android con
   Chrome. Cada serie registrada guarda el pulso del momento (h).
   ============================================================ */
(function(){
'use strict';
const LS_DIA='forja_hr_dias';
let dev=null, car=null, bpm=0, ultimo=0, intentos=0, manual=false;
let dias=(()=>{ try{ return JSON.parse(localStorage.getItem(LS_DIA)||'{}'); }catch(e){ return {}; } })();
const soportado=()=>!!(navigator.bluetooth && navigator.bluetooth.requestDevice);
const hoy=()=>{ try{ return hoyKey(); }catch(e){ return new Date().toISOString().slice(0,10); } };
const edad=()=>{ const v=parseInt((document.getElementById('cAge')||{}).value,10); return v>=12&&v<=90?v:30; };
const fcMax=()=>220-edad();
const ZONAS=[
  {z:1,n:'Calentamiento',c:'#8FB8CC'},
  {z:2,n:'Quema grasa',c:'#3fbf7f'},
  {z:3,n:'Aeróbico',c:'#1F9BC4'},
  {z:4,n:'Intenso',c:'#e8a13a'},
  {z:5,n:'Máximo',c:'#e05656'}];
function zona(b){ const p=b/fcMax(); return ZONAS[p<.6?0:p<.7?1:p<.8?2:p<.9?3:4]; }

const css=document.createElement('style');
css.textContent=`
.hr-btn{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);color:var(--text);font-weight:700;font-size:13px;padding:9px 14px;border-radius:99px;cursor:pointer;margin:0 0 16px 8px;vertical-align:top}
.hr-btn:hover{border-color:var(--orange);color:var(--orange)}
.hr-btn.on{border-color:#e05656}
.hr-btn .hb{color:#e05656;font-size:15px;line-height:1}
.hr-pill{position:fixed;right:14px;bottom:86px;z-index:9980;display:flex;align-items:center;gap:10px;background:var(--surface-solid);border:1px solid var(--line);border-radius:99px;padding:8px 14px 8px 10px;box-shadow:0 8px 24px rgba(0,0,0,.45);cursor:pointer;color:var(--text)}
@media(min-width:900px){.hr-pill{bottom:24px}}
.hr-pill .hh{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:15px;color:#fff}
.hr-pill .hv{font-family:Anton,sans-serif;font-size:24px;line-height:1;letter-spacing:.5px}
.hr-pill .hu{font-size:10px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase}
.hr-pill .hz{font-size:11px;font-weight:800}
.hr-pill.perdido{opacity:.55}
.hr-sheet{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9991;display:flex;align-items:flex-end;justify-content:center;padding:12px}
@media(min-width:700px){.hr-sheet{align-items:center}}
.hr-card{background:var(--surface-solid);border:1px solid var(--line);border-radius:22px;width:100%;max-width:420px;padding:18px;display:flex;flex-direction:column;gap:14px;color:var(--text);box-sizing:border-box}
.hr-card h3{margin:0;font-family:Anton,sans-serif;font-size:22px;letter-spacing:.5px;font-weight:400}
.hr-card p{margin:0;font-size:13.5px;color:var(--muted);line-height:1.45}
.hr-card ol{margin:0;padding-left:18px;font-size:13.5px;line-height:1.55;color:var(--text)}
.hr-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.hr-stat{background:var(--surface-2);border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}
.hr-stat b{display:block;font-family:Anton,sans-serif;font-size:22px;font-weight:400}
.hr-stat span{font-size:10.5px;font-weight:800;letter-spacing:1px;color:var(--muted);text-transform:uppercase}
.hr-zbar{display:flex;gap:3px;height:8px}.hr-zbar i{flex:1;border-radius:9px;opacity:.3}.hr-zbar i.on{opacity:1}
.hr-acts{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.hr-a{background:var(--surface-2);border:1px solid var(--line);color:var(--text);font-weight:700;font-size:13px;padding:9px 14px;border-radius:99px;cursor:pointer}
.hr-a:hover{border-color:var(--orange);color:var(--orange)}
.hr-a.pri{background:var(--molten,var(--orange));border-color:transparent;color:#EAF6FB}
.sc-hr{font-size:11px;font-weight:800;color:#e05656;margin-left:4px;white-space:nowrap}
`;
document.head.appendChild(css);

/* ---------- Botón en Rutinas ---------- */
function pintarBoton(){
  const mt=document.getElementById('modeToggle'); if(!mt) return;
  let b=document.getElementById('hrBtn');
  if(!b){ b=document.createElement('button'); b.type='button'; b.id='hrBtn'; b.className='hr-btn'; mt.insertAdjacentElement('afterend',b); b.onclick=()=>car?abrirPanel():conectar(); }
  b.classList.toggle('on',!!car);
  b.innerHTML=car?'<span class="hb">❤</span> Reloj conectado':'<span class="hb">❤</span> Conectar reloj';
}

/* ---------- Conexión ---------- */
function parse(dv){
  const f=dv.getUint8(0);
  return (f&1)?dv.getUint16(1,true):dv.getUint8(1);
}
function alLeer(e){
  const v=parse(e.target.value); if(!v||v<30||v>240) return;
  bpm=v; ultimo=Date.now();
  const d=dias[hoy()]||(dias[hoy()]={max:0,min:999,s:0,n:0});
  d.max=Math.max(d.max,v); d.min=Math.min(d.min,v); d.s+=v; d.n++;
  if(d.n%15===0) guardaDias();
  pintarPill();
}
function guardaDias(){
  const k=Object.keys(dias).sort(); while(k.length>60) delete dias[k.shift()];
  try{ localStorage.setItem(LS_DIA,JSON.stringify(dias)); }catch(e){}
}
async function enlazar(){
  const srv=await dev.gatt.connect();
  const s=await srv.getPrimaryService('heart_rate');
  car=await s.getCharacteristic('heart_rate_measurement');
  car.addEventListener('characteristicvaluechanged',alLeer);
  await car.startNotifications();
  intentos=0; pintarBoton(); pintarPill();
}
async function conectar(){
  if(!soportado()){ abrirAyuda(); return; }
  try{
    dev=await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}]});
    manual=false;
    dev.addEventListener('gattserverdisconnected',alPerder);
    await enlazar();
    aviso('❤ Conectado a '+(dev.name||'tu reloj'));
  }catch(e){
    if(e&&e.name==='NotFoundError') return; /* canceló el selector */
    abrirAyuda('No pude conectar. Revisa que tu reloj esté transmitiendo el pulso y vuelve a intentar.');
  }
}
async function alPerder(){
  car=null; pintarPill(); pintarBoton();
  if(manual||!dev) return;
  if(intentos++<5){ setTimeout(async()=>{ try{ await enlazar(); aviso('❤ Reconectado'); }catch(e){ alPerder(); } }, 1500*intentos); }
  else aviso('Se perdió la conexión con el reloj');
}
function desconectar(){
  manual=true; guardaDias();
  try{ if(car) car.removeEventListener('characteristicvaluechanged',alLeer); }catch(e){}
  try{ dev&&dev.gatt.connected&&dev.gatt.disconnect(); }catch(e){}
  car=null; dev=null; bpm=0; pintarPill(); pintarBoton();
}

/* ---------- Pastilla flotante ---------- */
function pintarPill(){
  let p=document.getElementById('hrPill');
  if(!car&&!bpm){ if(p) p.remove(); return; }
  if(!p){ p=document.createElement('div'); p.id='hrPill'; p.className='hr-pill'; p.setAttribute('role','button'); p.title='Tu pulso en vivo'; p.onclick=abrirPanel; document.body.appendChild(p); }
  const z=zona(bpm||60), viejo=!car||Date.now()-ultimo>8000;
  p.classList.toggle('perdido',viejo);
  p.innerHTML='<span class="hh" style="background:'+z.c+'">❤</span><span><span class="hv">'+(bpm||'--')+'</span> <span class="hu">lpm</span><br><span class="hz" style="color:'+z.c+'">Zona '+z.z+' · '+z.n+'</span></span>';
  const h=p.querySelector('.hh');
  if(!viejo && h.animate) h.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:Math.max(300,60000/bpm*.6)});
}
setInterval(()=>{ if(car) pintarPill(); },5000);

/* ---------- Hojas ---------- */
function hoja(html){
  const bg=document.createElement('div'); bg.className='hr-sheet';
  bg.innerHTML='<div class="hr-card">'+html+'</div>';
  bg.onclick=e=>{ if(e.target===bg||e.target.closest('[data-cerrar]')) bg.remove(); };
  document.body.appendChild(bg); return bg;
}
function abrirPanel(){
  const d=dias[hoy()], z=zona(bpm||60);
  const bg=hoja('<h3>❤ Pulso en vivo</h3>'+
    '<p>'+(dev&&dev.name?esc(dev.name)+' · ':'')+'FC máxima estimada '+fcMax()+' lpm (edad '+edad()+', de la calculadora de calorías).</p>'+
    '<div class="hr-zbar">'+ZONAS.map(x=>'<i class="'+(x.z===z.z&&bpm?'on':'')+'" style="background:'+x.c+'"></i>').join('')+'</div>'+
    '<div class="hr-stats"><div class="hr-stat"><b>'+(bpm||'--')+'</b><span>Ahora</span></div><div class="hr-stat"><b>'+(d&&d.n?Math.round(d.s/d.n):'--')+'</b><span>Promedio hoy</span></div><div class="hr-stat"><b>'+(d&&d.max?d.max:'--')+'</b><span>Máximo hoy</span></div></div>'+
    '<p>Cada serie que registres guarda el pulso de ese momento (❤ en la serie).</p>'+
    '<div class="hr-acts"><button class="hr-a" data-off>Desconectar</button><button class="hr-a pri" data-cerrar>Listo</button></div>');
  bg.querySelector('[data-off]').onclick=()=>{ desconectar(); bg.remove(); };
}
function abrirAyuda(msg){
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  hoja('<h3>Conectar tu reloj</h3>'+
    (msg?'<p style="color:var(--text)">'+esc(msg)+'</p>':'')+
    (!soportado()?'<p style="color:var(--text)">'+(ios?'En iPhone, Safari no permite conectar relojes por Bluetooth. Abre FORJA en un Android con Chrome.':'Este navegador no permite Bluetooth. Abre FORJA en Chrome (Android o computadora).')+'</p>':'')+
    '<ol><li>En tu reloj activa <b>“Transmitir frecuencia cardiaca”</b> (Garmin: Ajustes › Sensores › Transmitir FC · Amazfit: Detección FC › Compartir · Polar: Ajustes › Conexión).</li><li>Deja el reloj cerca del celular con Bluetooth y ubicación encendidos.</li><li>Toca <b>Conectar reloj</b> y elígelo en la lista.</li></ol>'+
    '<p>Funciona con Polar, Garmin, Amazfit, Coros, Wahoo y bandas de pecho. Apple Watch y Galaxy Watch no transmiten pulso por Bluetooth sin una app extra.</p>'+
    '<div class="hr-acts">'+(soportado()?'<button class="hr-a pri" data-retry>Intentar de nuevo</button>':'')+'<button class="hr-a" data-cerrar>Cerrar</button></div>')
    .querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>{ b.closest('.hr-sheet').remove(); conectar(); });
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function aviso(t){ const d=document.createElement('div'); d.className='cz-toast'; d.style.cssText='position:fixed;left:50%;bottom:150px;transform:translateX(-50%);background:var(--surface-solid);border:1px solid #e05656;color:var(--text);padding:10px 16px;border-radius:99px;font-size:13px;font-weight:700;z-index:9999'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }

/* ---------- Guardar el pulso en cada serie ---------- */
const _add=agregarSerie;
agregarSerie=function(ex,peso,reps,drop){
  _add.apply(this,arguments);
  if(car && bpm && Date.now()-ultimo<10000){
    try{ const a=series[hoyKey()][ex]; a[a.length-1].h=bpm; save('forja_series',series); }catch(e){}
  }
};
const _render=renderExercises;
renderExercises=function(){ _render.apply(this,arguments); try{ pintarBoton(); }catch(e){} };
window.addEventListener('pagehide',guardaDias);
pintarBoton();
})();
