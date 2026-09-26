/* ============================================================
   FORJA — Rutinas y videos de coach
   El coach (Diego, Christian…) entra con su cuenta, crea sus rutinas
   y sube videos. Los alumnos las ven en Rutinas y los videos salen
   en "Cómo se hace".
   Firestore: coachRutinas/{id}  ·  coachVideos/{slug}
   Storage:   videos-coach/{uid}/archivo
   ============================================================ */
(function(){
'use strict';
const GRUPOS={pecho:'Pecho',espalda:'Espalda',hombro:'Hombro',brazo:'Brazo',pierna:'Pierna',abs:'Abdomen'};
const LS_ACT='forja_coach_activa', LS_CACHE='forja_coach_cache';
let RUTS=[], VIDS={}, draft=null, tab='rutinas', busca='';
try{ const c=JSON.parse(localStorage.getItem(LS_CACHE)||'{}'); RUTS=c.r||[]; VIDS=c.v||{}; }catch(e){}
let activa=(()=>{ try{ return localStorage.getItem(LS_ACT)||''; }catch(e){ return ''; } })();

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,120)||'x';
const nube=()=>{ try{ return FB_ON && fbDB && fbUser; }catch(e){ return false; } };
const miCoach=()=>{ try{ return coachDelUsuario(); }catch(e){ return null; } };
const guardaCache=()=>{ try{ localStorage.setItem(LS_CACHE,JSON.stringify({r:RUTS,v:VIDS})); }catch(e){} };

/* ---------- Estilos (mismo lenguaje visual de FORJA) ---------- */
const css=document.createElement('style');
css.textContent=`
.cr-box{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin-bottom:16px;display:flex;flex-direction:column;gap:12px}
.cr-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.cr-t{font-weight:800;font-size:15px}.cr-d{font-size:12.5px;color:var(--muted);margin-top:2px}
.cr-list{display:flex;gap:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.cr-item{flex:0 0 auto;min-width:190px;max-width:240px;background:var(--surface-2);border:1px solid var(--line);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
.cr-item.on{border-color:var(--orange);box-shadow:0 0 0 1px var(--orange) inset}
.cr-n{font-weight:800;font-size:14px;line-height:1.25}
.cr-m{font-size:12px;color:var(--muted)}
.cz-btn{background:var(--surface-2);border:1px solid var(--line);color:var(--text);font-weight:700;font-size:13px;padding:9px 14px;border-radius:99px;white-space:nowrap;cursor:pointer}
.cz-btn:hover{border-color:var(--orange);color:var(--orange)}
.cz-btn.pri{background:var(--molten,var(--orange));border-color:transparent;color:#EAF6FB}
.cz-btn.pri:hover{color:#fff;filter:brightness(1.1)}
.cz-btn.sm{padding:6px 11px;font-size:12px}
.cz-btn.dan:hover{border-color:#e05656;color:#e05656}
.cr-act{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:rgba(31,155,196,.12);border:1px solid var(--orange);border-radius:14px;padding:10px 12px;font-size:13px}
.cz-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9990;display:flex;align-items:flex-end;justify-content:center;padding:12px}
@media(min-width:700px){.cz-bg{align-items:center}}
.cz-card{background:var(--surface-solid);border:1px solid var(--line);border-radius:22px;width:100%;max-width:680px;max-height:90vh;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:14px;color:var(--text)}
.cz-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cz-h{font-family:Anton,sans-serif;font-size:24px;letter-spacing:.5px}
.cz-x{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--surface-2);color:var(--text);font-size:20px;cursor:pointer}
.cz-tabs{display:inline-flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:99px;padding:4px;align-self:flex-start}
.cz-tab{padding:8px 16px;border-radius:99px;font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;background:none;border:0}
.cz-tab.on{background:var(--molten,var(--orange));color:#EAF6FB}
.cz-row{background:var(--surface-2);border:1px solid var(--line);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px}
.cz-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cz-in,.cz-sel{background:var(--field-bg);border:1px solid var(--line);color:var(--text);border-radius:12px;padding:10px 12px;font-size:14px;font-family:inherit;min-width:0}
.cz-in:focus,.cz-sel:focus{outline:2px solid var(--orange);outline-offset:1px}
.cz-in.w{flex:1 1 220px}.cz-in.n{width:70px;text-align:center}
.cz-lbl{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.cz-vid{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}
.cz-vid.ok{color:var(--green,#3fbf7f)}
.cz-bar{height:6px;border-radius:9px;background:var(--line);overflow:hidden}.cz-bar i{display:block;height:100%;background:var(--orange);width:0;transition:width .2s}
.cz-empty{font-size:13px;color:var(--muted);padding:6px 2px}
.cz-foot{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:-18px;background:var(--surface-solid);padding:10px 0 4px}
.cz-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--surface-solid);border:1px solid var(--orange);color:var(--text);padding:10px 16px;border-radius:99px;font-size:13px;font-weight:700;z-index:9999;max-width:90vw}
.tec-coach{position:absolute;right:12px;top:10px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#EAF6FB;background:var(--molten,var(--orange));padding:4px 9px;border-radius:99px;z-index:2}
.tec-ifr{width:100%;height:min(46vh,420px);border:0;border-radius:16px;background:#000;display:block}
.tec-link{height:min(46vh,420px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:20px}
`;
document.head.appendChild(css);

function toast(t,ms){ const d=document.createElement('div'); d.className='cz-toast'; d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),ms||2600); return d; }

/* ---------- Datos: nube en vivo ---------- */
function escuchar(){
  if(!nube() || escuchar._on) return; escuchar._on=true;
  fbDB.collection('coachRutinas').onSnapshot(qs=>{
    RUTS=qs.docs.map(d=>Object.assign({id:d.id},d.data())).sort((a,b)=>(b.t||0)-(a.t||0));
    guardaCache(); pintarTodo();
  },()=>{});
  fbDB.collection('coachVideos').onSnapshot(qs=>{
    VIDS={}; qs.docs.forEach(d=>{ const x=d.data(); if(x&&x.n&&x.url) VIDS[x.n]=x; });
    guardaCache();
  },()=>{});
}
try{ fbAuth && fbAuth.onAuthStateChanged(u=>{ if(u) setTimeout(()=>{ escuchar(); pintarTodo(); },300); }); }catch(e){}

async function guardarRutina(r){
  const c=miCoach(); r.coachId=c.id; r.coachN=c.n; r.t=Date.now();
  if(nube()){ const id=r.id; const d=Object.assign({},r); delete d.id; await fbDB.collection('coachRutinas').doc(id).set(d); }
  const i=RUTS.findIndex(x=>x.id===r.id); if(i>=0) RUTS[i]=r; else RUTS.unshift(r);
  guardaCache();
}
async function borrarRutina(id){
  if(nube()) await fbDB.collection('coachRutinas').doc(id).delete();
  RUTS=RUTS.filter(x=>x.id!==id); if(activa===id) usar('');
  guardaCache();
}
async function guardarVideo(n,url){
  const c=miCoach();
  if(url){ const d={n,url,coachId:c.id,coachN:c.n,t:Date.now()}; if(nube()) await fbDB.collection('coachVideos').doc(slug(n)).set(d); VIDS[n]=d; }
  else { if(nube()) await fbDB.collection('coachVideos').doc(slug(n)).delete(); delete VIDS[n]; }
  guardaCache();
}

/* ---------- Subida de video a Firebase Storage ---------- */
let storageListo=null;
function cargarStorage(){
  if(window.firebase && firebase.storage) return Promise.resolve();
  if(storageListo) return storageListo;
  storageListo=new Promise((ok,mal)=>{ const s=document.createElement('script'); s.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js'; s.onload=ok; s.onerror=mal; document.head.appendChild(s); });
  return storageListo;
}
async function subirArchivo(file){
  if(!nube()) throw new Error('Inicia sesión con tu cuenta de coach para subir videos.');
  if(file.size>300*1024*1024) throw new Error('El video pesa más de 300 MB. Recórtalo o bájale la calidad.');
  await cargarStorage();
  const ref=firebase.storage().ref('videos-coach/'+fbUser.uid+'/'+Date.now()+'-'+slug(file.name.replace(/\.[^.]+$/,''))+'.'+((file.name.split('.').pop()||'mp4').toLowerCase()));
  const t=toast('Subiendo video… 0%',9e9);
  try{
    const task=ref.put(file,{contentType:file.type||'video/mp4'});
    task.on('state_changed',s=>{ t.textContent='Subiendo video… '+Math.round(s.bytesTransferred/s.totalBytes*100)+'%'; });
    await task; const url=await ref.getDownloadURL(); t.remove(); toast('Video listo ✓'); return url;
  }catch(e){
    t.remove();
    const c=(e&&e.code)||'';
    if(c.indexOf('unauthorized')>=0) throw new Error('Tu cuenta no tiene permiso de subir videos. Revisa las reglas de Storage.');
    throw new Error('No se pudo subir. Verifica que Storage esté activo en Firebase, o pega un enlace de YouTube/Drive.');
  }
}
/* Pide un video: archivo del cel o enlace. Llama cb(url) */
function pedirVideo(cb, actual){
  const bg=document.createElement('div'); bg.className='cz-bg'; bg.style.zIndex='9995';
  bg.innerHTML='<div class="cz-card" style="max-width:420px"><div class="cz-top"><div class="cz-h" style="font-size:20px">Video del ejercicio</div><button class="cz-x" data-x>×</button></div>'+
    '<button class="cz-btn pri" data-f>🎥 Subir desde mi celular</button>'+
    '<div class="cz-lbl">o pega un enlace</div><div class="cz-line"><input class="cz-in w" data-u placeholder="YouTube, Google Drive o .mp4" value="'+esc(actual||'')+'"><button class="cz-btn" data-ok>Usar enlace</button></div>'+
    (actual?'<button class="cz-btn sm dan" data-del style="align-self:flex-start">Quitar video</button>':'')+
    '<input type="file" accept="video/*" data-file style="display:none"></div>';
  document.body.appendChild(bg);
  const fin=u=>{ bg.remove(); cb(u); };
  bg.querySelector('[data-x]').onclick=()=>bg.remove();
  bg.onclick=e=>{ if(e.target===bg) bg.remove(); };
  const fi=bg.querySelector('[data-file]');
  bg.querySelector('[data-f]').onclick=()=>fi.click();
  fi.onchange=async()=>{ const f=fi.files[0]; if(!f) return; bg.style.display='none';
    try{ fin(await subirArchivo(f)); }catch(e){ bg.style.display=''; alert(e.message); } };
  bg.querySelector('[data-ok]').onclick=()=>{ const u=bg.querySelector('[data-u]').value.trim(); if(!/^https?:\/\//i.test(u)){ alert('Pega un enlace que empiece con https://'); return; } fin(u); };
  const d=bg.querySelector('[data-del]'); if(d) d.onclick=()=>fin('');
}

/* ---------- Rutina activa → reemplaza las rutinas de la app ---------- */
const rutActiva=()=>activa?RUTS.find(r=>r.id===activa):null;
function gruposDe(r){
  const G={};
  (r.ex||[]).forEach(e=>{ const k=GRUPOS[e.g]?e.g:'brazo'; (G[k]=G[k]||{label:GRUPOS[k],ex:[]}).ex.push({n:e.n,s:+e.s||3,r:e.r||'10',max:e.max||'',_v:e.v||''}); });
  return G;
}
const _getR=getRoutines;
getRoutines=function(){ const r=rutActiva(); if(r && (r.ex||[]).length) return gruposDe(r); return _getR(); };
function usar(id){
  activa=id; try{ id?localStorage.setItem(LS_ACT,id):localStorage.removeItem(LS_ACT); }catch(e){}
  try{ const R=getRoutines(); if(!R[currentMuscle]) currentMuscle=Object.keys(R)[0]; musculosSel=[currentMuscle]; }catch(e){}
  try{ renderMuscleTabs(); renderExercises(); renderHome(); fillProgSelects(); }catch(e){}
}

/* ---------- Caja en Rutinas ---------- */
function pintarCaja(){
  const mt=document.getElementById('modeToggle'); if(!mt) return;
  let box=document.getElementById('coachRutBox');
  if(!box){ box=document.createElement('div'); box.id='coachRutBox'; mt.insertAdjacentElement('afterend',box); }
  const c=miCoach(), r=rutActiva();
  mt.style.display=r?'none':'';
  if(!RUTS.length && !c){ box.innerHTML=''; box.className=''; return; }
  box.className='cr-box';
  box.innerHTML=
    '<div class="cr-head"><div><div class="cr-t">Rutinas de tus coaches</div><div class="cr-d">'+(RUTS.length?'Elige una y se carga con sus videos.':'Aún no hay rutinas publicadas.')+'</div></div>'+
    (c?'<button class="cz-btn pri" data-cz-panel>Panel de coach</button>':'')+'</div>'+
    (r?'<div class="cr-act"><span>Entrenando <b>'+esc(r.nombre)+'</b> de '+esc((r.coachN||'').split(' ')[0])+'</span><button class="cz-btn sm" data-cz-salir>Volver a rutinas FORJA</button></div>':'')+
    (RUTS.length?'<div class="cr-list">'+RUTS.map(x=>{
      const on=x.id===activa, nv=(x.ex||[]).filter(e=>e.v||VIDS[e.n]).length;
      return '<div class="cr-item'+(on?' on':'')+'"><div class="cr-n">'+esc(x.nombre)+'</div><div class="cr-m">'+esc(x.coachN||'Coach')+' · '+(x.ex||[]).length+' ejercicios'+(nv?' · '+nv+' videos':'')+(x.modo==='home'?' · En casa':' · Gimnasio')+'</div>'+
        (on?'<span class="cr-m" style="color:var(--orange);font-weight:800">✓ Activa</span>':'<button class="cz-btn sm" data-cz-usar="'+esc(x.id)+'">Usar esta rutina</button>')+'</div>';
    }).join('')+'</div>':'');
  box.querySelectorAll('[data-cz-usar]').forEach(b=>b.onclick=()=>{ usar(b.dataset.czUsar); toast('Rutina cargada ✓'); });
  const s=box.querySelector('[data-cz-salir]'); if(s) s.onclick=()=>usar('');
  const p=box.querySelector('[data-cz-panel]'); if(p) p.onclick=abrirPanel;
}
const _renderEx=renderExercises;
renderExercises=function(){ _renderEx.apply(this,arguments); try{ pintarCaja(); }catch(e){} };
function pintarTodo(){ try{ if(activa && !rutActiva() && RUTS.length) usar(''); pintarCaja(); if(document.getElementById('czPanel')) pintarPanel(); }catch(e){} }

/* ---------- Panel del coach ---------- */
function todosLosEjercicios(){
  const s=new Set();
  [typeof ROUTINES!=='undefined'&&ROUTINES,typeof HOME_ROUTINES!=='undefined'&&HOME_ROUTINES,typeof GYM_VOL!=='undefined'&&GYM_VOL,typeof GYM_DEF!=='undefined'&&GYM_DEF,typeof HOME_VOL!=='undefined'&&HOME_VOL,typeof HOME_DEF!=='undefined'&&HOME_DEF]
    .forEach(R=>{ if(R) Object.values(R).forEach(g=>g.ex.forEach(e=>s.add(e.n))); });
  return [...s].sort((a,b)=>a.localeCompare(b,'es'));
}
function abrirPanel(){
  const c=miCoach(); if(!c){ alert('Solo los coaches pueden entrar aquí.'); return; }
  if(!nube()) toast('Sin sesión en la nube: lo que hagas solo se guarda en este dispositivo',3500);
  let bg=document.getElementById('czPanel');
  if(!bg){ bg=document.createElement('div'); bg.id='czPanel'; bg.className='cz-bg'; document.body.appendChild(bg);
    bg.onclick=e=>{ if(e.target===bg && !draft) cerrarPanel(); }; }
  draft=null; tab='rutinas'; pintarPanel();
}
function cerrarPanel(){ const bg=document.getElementById('czPanel'); if(bg) bg.remove(); draft=null; }
function pintarPanel(){
  const bg=document.getElementById('czPanel'); if(!bg) return;
  const c=miCoach()||{n:'Coach',id:''};
  const scroll=(bg.firstChild&&bg.firstChild.scrollTop)||0;
  let h='<div class="cz-card"><div class="cz-top"><div><div class="cz-lbl">Panel de coach</div><div class="cz-h">'+esc(c.n)+'</div></div><button class="cz-x" data-x>×</button></div>';
  if(draft) h+=htmlEditor();
  else{
    h+='<div class="cz-tabs"><button class="cz-tab'+(tab==='rutinas'?' on':'')+'" data-tab="rutinas">Mis rutinas</button><button class="cz-tab'+(tab==='videos'?' on':'')+'" data-tab="videos">Videos de ejercicios</button></div>';
    if(tab==='rutinas'){
      const mias=RUTS.filter(r=>r.coachId===c.id);
      h+=(mias.length?mias.map(r=>'<div class="cz-row"><div class="cz-line" style="justify-content:space-between"><div><div class="cr-n">'+esc(r.nombre)+'</div><div class="cr-m">'+(r.ex||[]).length+' ejercicios · '+(r.modo==='home'?'En casa':'Gimnasio')+'</div></div><div class="cz-line"><button class="cz-btn sm" data-ed="'+esc(r.id)+'">Editar</button><button class="cz-btn sm dan" data-bo="'+esc(r.id)+'">Borrar</button></div></div></div>').join('')
        :'<div class="cz-empty">Todavía no subes rutinas. Crea la primera y tus alumnos la verán en Rutinas.</div>')+
        '<button class="cz-btn pri" data-nueva style="align-self:flex-start">+ Nueva rutina</button>';
    }else{
      const q=busca.trim().toLowerCase(), L=todosLosEjercicios().filter(n=>!q||n.toLowerCase().includes(q));
      h+='<div class="cr-d">Sube tu video a cualquier ejercicio de FORJA: reemplaza la animación en “Cómo se hace”.</div>'+
        '<input class="cz-in" data-busca placeholder="Buscar ejercicio…" value="'+esc(busca)+'">'+
        L.map(n=>{ const v=VIDS[n]; return '<div class="cz-row" style="padding:10px 12px"><div class="cz-line" style="justify-content:space-between"><div style="min-width:0;flex:1"><div class="cr-n" style="font-size:13.5px">'+esc(n)+'</div><div class="cz-vid'+(v?' ok':'')+'">'+(v?'● Video de '+esc((v.coachN||'').split(' ')[0]):'Sin video · usa la animación')+'</div></div><button class="cz-btn sm" data-vx="'+esc(n)+'">'+(v?'Cambiar':'🎥 Subir')+'</button></div></div>'; }).join('');
    }
  }
  bg.innerHTML=h+'</div>';
  bg.firstChild.scrollTop=scroll;
  bg.querySelector('[data-x]').onclick=()=>{ if(draft && !confirm('¿Salir sin guardar la rutina?')) return; cerrarPanel(); };
  bg.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ tab=b.dataset.tab; pintarPanel(); });
  const nu=bg.querySelector('[data-nueva]'); if(nu) nu.onclick=()=>{ draft={id:'r'+Date.now().toString(36),nombre:'',modo:'gym',ex:[{n:'',g:'pecho',s:4,r:'10',max:'12',v:''}]}; pintarPanel(); };
  bg.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{ const r=RUTS.find(x=>x.id===b.dataset.ed); draft=JSON.parse(JSON.stringify(r)); pintarPanel(); });
  bg.querySelectorAll('[data-bo]').forEach(b=>b.onclick=async()=>{ const r=RUTS.find(x=>x.id===b.dataset.bo); if(!confirm('¿Borrar «'+r.nombre+'»? Tus alumnos dejarán de verla.')) return; try{ await borrarRutina(r.id); toast('Rutina borrada'); }catch(e){ alert('No se pudo borrar: '+(e.message||e)); } pintarPanel(); pintarCaja(); });
  const bu=bg.querySelector('[data-busca]'); if(bu) bu.oninput=()=>{ busca=bu.value; pintarPanel(); const n=document.querySelector('#czPanel [data-busca]'); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
  bg.querySelectorAll('[data-vx]').forEach(b=>b.onclick=()=>{ const n=b.dataset.vx; pedirVideo(async u=>{ try{ await guardarVideo(n,u); toast(u?'Video guardado ✓':'Video quitado'); }catch(e){ alert('No se pudo guardar: '+(e.message||e)); } pintarPanel(); }, VIDS[n]&&VIDS[n].url); });
  if(draft) ligarEditor(bg);
}
function htmlEditor(){
  const d=draft, opt=k=>Object.keys(GRUPOS).map(g=>'<option value="'+g+'"'+(g===k?' selected':'')+'>'+GRUPOS[g]+'</option>').join('');
  return '<div class="cz-row"><div class="cz-lbl">Nombre de la rutina</div><input class="cz-in" data-nom placeholder="Ej. Torso fuerza · semana 1" value="'+esc(d.nombre)+'">'+
    '<div class="cz-line"><span class="cz-lbl">Dónde</span><div class="cz-tabs"><button class="cz-tab'+(d.modo!=='home'?' on':'')+'" data-modo="gym">🏋️ Gimnasio</button><button class="cz-tab'+(d.modo==='home'?' on':'')+'" data-modo="home">🏠 En casa</button></div></div></div>'+
    '<div class="cz-lbl">Ejercicios ('+d.ex.length+')</div>'+
    d.ex.map((e,i)=>'<div class="cz-row" data-i="'+i+'">'+
      '<div class="cz-line"><span class="cr-n" style="color:var(--orange)">'+(i+1)+'.</span><input class="cz-in w" data-f="n" placeholder="Nombre del ejercicio" value="'+esc(e.n)+'"><select class="cz-sel" data-f="g">'+opt(e.g)+'</select></div>'+
      '<div class="cz-line"><label class="cz-line" style="gap:6px"><span class="cz-lbl">Series</span><input class="cz-in n" data-f="s" inputmode="numeric" value="'+esc(e.s)+'"></label><label class="cz-line" style="gap:6px"><span class="cz-lbl">Reps</span><input class="cz-in n" data-f="r" style="width:90px" value="'+esc(e.r)+'"></label><label class="cz-line" style="gap:6px"><span class="cz-lbl">Máx</span><input class="cz-in n" data-f="max" value="'+esc(e.max)+'"></label></div>'+
      '<div class="cz-line" style="justify-content:space-between"><span class="cz-vid'+(e.v?' ok':'')+'">'+(e.v?'● Con video':(VIDS[e.n]?'● Usa el video general del ejercicio':'Sin video'))+'</span><div class="cz-line"><button class="cz-btn sm" data-v>'+(e.v?'Cambiar video':'🎥 Video')+'</button>'+
        (i>0?'<button class="cz-btn sm" data-up title="Subir">↑</button>':'')+'<button class="cz-btn sm dan" data-rm>Quitar</button></div></div></div>').join('')+
    '<button class="cz-btn" data-add style="align-self:flex-start">+ Agregar ejercicio</button>'+
    '<div class="cz-foot"><button class="cz-btn" data-cancel>Cancelar</button><button class="cz-btn pri" data-save>Publicar rutina</button></div>';
}
function ligarEditor(bg){
  const d=draft;
  bg.querySelector('[data-nom]').oninput=e=>{ d.nombre=e.target.value; };
  bg.querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>{ d.modo=b.dataset.modo; pintarPanel(); });
  bg.querySelectorAll('[data-i]').forEach(row=>{
    const i=+row.dataset.i, e=d.ex[i];
    row.querySelectorAll('[data-f]').forEach(inp=>{ const f=inp.dataset.f; inp.oninput=inp.onchange=()=>{ e[f]=inp.value; }; });
    row.querySelector('[data-v]').onclick=()=>pedirVideo(u=>{ e.v=u; pintarPanel(); }, e.v);
    row.querySelector('[data-rm]').onclick=()=>{ d.ex.splice(i,1); pintarPanel(); };
    const up=row.querySelector('[data-up]'); if(up) up.onclick=()=>{ d.ex.splice(i-1,0,d.ex.splice(i,1)[0]); pintarPanel(); };
  });
  bg.querySelector('[data-add]').onclick=()=>{ const u=d.ex[d.ex.length-1]; d.ex.push({n:'',g:u?u.g:'pecho',s:u?u.s:4,r:u?u.r:'10',max:u?u.max:'12',v:''}); pintarPanel(); const a=bg.querySelectorAll('[data-f="n"]'); a[a.length-1].focus(); };
  bg.querySelector('[data-cancel]').onclick=()=>{ draft=null; pintarPanel(); };
  bg.querySelector('[data-save]').onclick=async ev=>{
    d.nombre=d.nombre.trim(); d.ex=d.ex.map(e=>Object.assign(e,{n:String(e.n||'').trim(),s:parseInt(e.s,10)||3,r:String(e.r||'').trim()||'10',max:String(e.max||'').trim()})).filter(e=>e.n);
    if(!d.nombre){ alert('Ponle nombre a la rutina.'); pintarPanel(); return; }
    if(!d.ex.length){ alert('Agrega al menos un ejercicio.'); d.ex.push({n:'',g:'pecho',s:4,r:'10',max:'12',v:''}); pintarPanel(); return; }
    const vistos={}; if(d.ex.some(e=>vistos[e.n]?1:(vistos[e.n]=0))){ alert('Hay ejercicios con el mismo nombre. Cambia uno (ej. agrega "· 2").'); pintarPanel(); return; }
    ev.target.disabled=true; ev.target.textContent='Publicando…';
    try{ await guardarRutina(d); draft=null; toast('Rutina publicada ✓'); pintarPanel(); pintarCaja(); if(activa===d.id) usar(d.id); }
    catch(e){ ev.target.disabled=false; ev.target.textContent='Publicar rutina'; alert('No se pudo publicar: '+(e.code==='permission-denied'?'tu cuenta no tiene permiso de coach en Firebase (revisa las reglas).':(e.message||e))); }
  };
}

/* ---------- "Cómo se hace": video del coach si existe ---------- */
function videoDe(n){
  const r=rutActiva(); const e=r&&(r.ex||[]).find(x=>x.n===n);
  if(e&&e.v) return {url:e.v, quien:r.coachN};
  const v=VIDS[n]; return v?{url:v.url, quien:v.coachN}:null;
}
function embed(u){
  let m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i);
  if(m) return 'https://www.youtube.com/embed/'+m[1]+'?autoplay=1&mute=1&loop=1&playlist='+m[1]+'&rel=0&playsinline=1&modestbranding=1';
  m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/i);
  if(m) return 'https://drive.google.com/file/d/'+m[1]+'/preview';
  return null;
}
function limpiarTec(bg){
  if(!bg) return;
  bg.querySelectorAll('.tec-ifr,.tec-link,.tec-coach').forEach(x=>x.remove());
  const f=bg.querySelector('.tec-fase'); if(f) f.style.display='';
  const v=bg.querySelector('.tec-vid'); if(v){ v.muted=true; v.controls=false; }
}
const _tec=abrirTecnica;
abrirTecnica=function(n,k){
  limpiarTec(document.getElementById('tecModal'));
  _tec(n,k);
  const cv=videoDe(n); if(!cv) return;
  const bg=document.getElementById('tecModal'), st=bg.querySelector('.tec-stage'), vid=bg.querySelector('.tec-vid'), svg=st.querySelector('svg');
  cancelAnimationFrame(tecRAF); svg.style.display='none'; bg.querySelector('.tec-fase').style.display='none';
  st.insertAdjacentHTML('afterbegin','<span class="tec-coach">Video de '+esc((cv.quien||'tu coach').split(' ')[0])+'</span>');
  const e=embed(cv.url);
  if(e){ vid.onerror=null; vid.oncanplay=null; vid.removeAttribute('src'); vid.style.display='none';
    st.insertAdjacentHTML('beforeend','<iframe class="tec-ifr" src="'+esc(e)+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'); return; }
  if(/^https?:\/\//.test(cv.url) && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(cv.url) && !/firebasestorage|googleapis\.com/i.test(cv.url)){
    vid.onerror=null; vid.oncanplay=null; vid.removeAttribute('src'); vid.style.display='none';
    st.insertAdjacentHTML('beforeend','<div class="tec-link"><div class="cr-d">Este video está en otra app.</div><a class="cz-btn pri" href="'+esc(cv.url)+'" target="_blank" rel="noopener">Ver video →</a></div>'); return; }
  vid.controls=true; vid.muted=false;
  vid.oncanplay=()=>{ vid.style.display='block'; svg.style.display='none'; vid.play().catch(()=>{ vid.muted=true; vid.play().catch(()=>{}); }); };
  vid.onerror=()=>{ vid.onerror=null; limpiarTec(bg); _tec(n,k); };
  vid.src=cv.url;
};
document.addEventListener('click',e=>{
  const bg=document.getElementById('tecModal'); if(!bg) return;
  if((e.target.closest&&e.target.closest('.tec-x'))||e.target===bg) setTimeout(()=>limpiarTec(bg),0);
},true);

/* ---------- Arranque ---------- */
escuchar(); pintarTodo();
if(activa && rutActiva()) usar(activa);
})();
