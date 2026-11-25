/*
 * FORJA · Mundo
 * Ranking opcional de la comunidad dentro de Retos. Es opt-in: nadie aparece si no lo activa.
 * Publica SOLO: alias, avatar (emoji), nivel, XP total, XP de la semana, racha y días en 30.
 * Nunca publica correo, nombre real, pesos, medidas, fotos, nutrición ni la hora de conexión.
 * Firestore: mundo/{uid}. Cada quien escribe/borra solo su documento (ver reglas-firebase-mundo.md).
 */
(function(){
"use strict";
if(window.FORJAMundo)return;
var LS_OK="forja_mundo_ok", LS_PERFIL="forja_mundo_perfil";
var AVATARES=["🔥","⚡","🦾","🐺","🦅","🦁","🐉","🛡️","⚔️","🏔️","🌋","🧗"];
var vistaAct="semana", estado={cargando:false,lista:[],err:null,t:0};

var CSS="#view-retos .mu-sub{display:flex;gap:6px;margin-bottom:12px}"+
"#view-retos .mu-sub button{border:1px solid var(--line);background:transparent;color:var(--text);padding:7px 12px;border-radius:999px;cursor:pointer;font:inherit;font-size:13px;font-weight:600}"+
"#view-retos .mu-sub button[aria-pressed=true]{background:var(--molten);color:#06120a;border-color:transparent}"+
"#view-retos .mu-row{display:grid;grid-template-columns:34px 38px 1fr auto;gap:10px;align-items:center;padding:10px 8px;border-bottom:1px solid var(--line)}"+
"#view-retos .mu-row:last-child{border-bottom:0}"+
"#view-retos .mu-row.yo{background:var(--molten-soft);border-radius:12px;border-bottom-color:transparent}"+
"#view-retos .mu-pos{font-weight:800;text-align:center;color:var(--muted)}"+
"#view-retos .mu-av{font-size:24px;text-align:center}"+
"#view-retos .mu-n{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
"#view-retos .mu-m{font-size:12.5px;color:var(--muted)}"+
"#view-retos .mu-xp{font-weight:800;text-align:right}"+
"#view-retos .mu-av-pick{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}"+
"#view-retos .mu-av-pick button{font-size:22px;border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:4px 8px;cursor:pointer}"+
"#view-retos .mu-av-pick button[aria-pressed=true]{border-color:var(--molten);box-shadow:0 0 0 2px var(--molten)}"+
"#view-retos .mu-in{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit}"+
"#view-retos .mu-chk{display:flex;gap:8px;align-items:flex-start;margin:10px 0;font-size:13.5px}"+
"#view-retos .mu-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}"+
"#view-retos .mu-err{color:#ff8a7a;font-size:13px;margin-top:8px}";
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

function h(tag,p,kids){var e=document.createElement(tag);for(var k in p||{}){if(k==="text")e.textContent=p[k];else if(k==="class")e.className=p[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),p[k]);else e.setAttribute(k,p[k])}
  (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==="string"?document.createTextNode(c):c)});return e}
function fmt(n){return Number(n).toLocaleString("es-MX")}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}

/* ---------- Firebase (globales de la app) ---------- */
function nube(){try{return (FB_ON&&fbDB&&fbUser)?{db:fbDB,u:fbUser}:null}catch(e){return null}}
function SER(){try{return (typeof series!=="undefined"&&series)||{}}catch(e){return {}}}

/* ---------- Fechas ---------- */
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function lunesSemana(){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}

/* XP de la semana con las mismas reglas de Retos: 10 por serie, 100 por día entrenado, 50 por récord de peso. */
function xpSemana(){
  var S=SER(),fechas=Object.keys(S).sort(),lun=lunesSemana(),maxEj={},xp=0;
  fechas.forEach(function(f){
    var dia=S[f]||{},hubo=false,en=f>=lun;
    Object.keys(dia).forEach(function(ex){
      var sets=dia[ex]||[];if(!sets.length)return;
      hubo=true;var prev=maxEj[ex]||0,mejor=0,pr=false;
      sets.forEach(function(s){var p=Number(s.p)||0;if(en)xp+=10;if(p>mejor)mejor=p;if(prev>0&&p>prev)pr=true});
      if(pr&&en)xp+=50;
      if(mejor>prev)maxEj[ex]=mejor;
    });
    if(hubo&&en)xp+=100;
  });
  return xp;
}

/* ---------- Perfil local (alias y avatar elegidos) ---------- */
function perfil(){try{return JSON.parse(lsGet(LS_PERFIL)||"null")}catch(e){return null}}
function activo(){return lsGet(LS_OK)==="1"&&!!perfil()}

function validarAlias(a){
  a=String(a||"").replace(/\s+/g," ").trim();
  if(a.length<3||a.length>20)return null;
  if(!/^[\p{L}\p{N} _.-]+$/u.test(a))return null;
  if(/@|https?:|www\./i.test(a))return null;
  return a;
}

/* Documento público: lista cerrada de campos, nada más. */
function armarDoc(C,p){
  return {alias:p.alias,avatar:p.avatar,nivel:C.n+1,titulo:C.nombre,xp:C.xp,xpSem:xpSemana(),sem:lunesSemana(),
    racha:C.racha,d30:C.d30,t:Date.now()};
}
function calc(){try{return window.FORJARetos&&window.FORJARetos.calc()}catch(e){return null}}

var ultimoSync=0;
function sincronizar(forzar){
  var f=nube(),p=perfil();if(!f||!p||!activo())return Promise.resolve(false);
  if(!forzar&&Date.now()-ultimoSync<60000)return Promise.resolve(false);
  var C=calc();if(!C)return Promise.resolve(false);
  ultimoSync=Date.now();
  return f.db.collection("mundo").doc(f.u.uid).set(armarDoc(C,p)).then(function(){return true},function(){return false});
}

function cargar(cb){
  var f=nube();if(!f){estado.err="Inicia sesión para ver Mundo.";cb();return}
  estado.cargando=true;estado.err=null;cb();
  var col=f.db.collection("mundo"),q;
  if(vistaAct==="semana")q=col.where("sem","==",lunesSemana()).limit(100);
  else q=col.orderBy("xp","desc").limit(50);
  q.get().then(function(qs){
    var l=qs.docs.map(function(d){var x=d.data();x._id=d.id;return x});
    var campo=vistaAct==="semana"?"xpSem":"xp";
    l.sort(function(a,b){return (b[campo]||0)-(a[campo]||0)});
    estado.lista=l.slice(0,50);estado.cargando=false;estado.err=null;cb();
  },function(){estado.cargando=false;estado.err="No pude cargar Mundo en este momento. Intenta más tarde.";cb()});
}

/* ---------- Vista ---------- */
function vista(){
  var box=h("div",{"class":"rt-wrap"});
  function repintar(){
    box.textContent="";
    if(!nube()){box.appendChild(h("section",{"class":"rt-card"},[h("h3",{text:"Mundo"}),h("p",{"class":"sub",style:"margin-top:8px",text:"Inicia sesión para ver el ranking de la comunidad."})]));return}
    if(!activo()){box.appendChild(tarjetaActivar(repintar));return}
    box.appendChild(tarjetaRanking(repintar));
    box.appendChild(tarjetaPrivacidad(repintar));
  }
  repintar();
  if(activo()){sincronizar(true).then(function(){cargar(repintar)})}
  return box;
}

function tarjetaActivar(repintar){
  var avSel=AVATARES[0],inp=h("input",{"class":"mu-in",maxlength:"20",placeholder:"Tu alias (no uses tu nombre real)","aria-label":"Alias"});
  var err=h("div",{"class":"mu-err",role:"alert"}),chk=h("input",{type:"checkbox",id:"mu-chk"});
  var pick=h("div",{"class":"mu-av-pick"});
  function pintaAv(){pick.textContent="";AVATARES.forEach(function(a){pick.appendChild(h("button",{type:"button",text:a,"aria-pressed":a===avSel?"true":"false","aria-label":"Avatar "+a,onclick:function(){avSel=a;pintaAv()}}))})}
  pintaAv();
  var go=h("button",{type:"button","class":"btn",text:"Aparecer en Mundo",onclick:function(){
    var a=validarAlias(inp.value);
    if(!a){err.textContent="El alias debe tener de 3 a 20 letras o números, sin correos ni enlaces.";return}
    if(!chk.checked){err.textContent="Confirma que eres mayor de 18 años y aceptas aparecer.";return}
    lsSet(LS_PERFIL,JSON.stringify({alias:a,avatar:avSel}));lsSet(LS_OK,"1");
    sincronizar(true).then(function(ok){if(!ok){err.textContent="No pude publicar tu perfil. Revisa tu conexión.";lsSet(LS_OK,null);return}vistaAct="semana";cargar(repintar)});
  }});
  return h("section",{"class":"rt-card"},[
    h("h3",{text:"Mundo"}),
    h("p",{"class":"sub",style:"margin-top:8px",text:"Compara tu nivel con la comunidad de FORJA. Es opcional: si no lo activas, nadie te ve."}),
    h("p",{"class":"sub",style:"margin-top:8px",text:"Se muestra únicamente: tu alias, tu avatar, tu nivel, tus XP, tu racha y tus días entrenados en 30. Nunca tu correo, nombre, pesos, medidas, fotos ni nutrición. Puedes salir cuando quieras y tu registro se borra."}),
    inp,pick,
    h("label",{"class":"mu-chk","for":"mu-chk"},[chk,h("span",{text:"Soy mayor de 18 años y acepto que mi alias y estos datos de juego se muestren a otros usuarios de FORJA."})]),
    err,h("div",{"class":"mu-btns"},[go])
  ]);
}

function tarjetaRanking(repintar){
  var f=nube(),yo=f?f.u.uid:"",campo=vistaAct==="semana"?"xpSem":"xp";
  var sub=h("div",{"class":"mu-sub",role:"group","aria-label":"Tipo de ranking"});
  [["semana","Esta semana"],["total","Histórico"]].forEach(function(t){
    sub.appendChild(h("button",{type:"button",text:t[1],"aria-pressed":vistaAct===t[0]?"true":"false",onclick:function(){vistaAct=t[0];cargar(repintar)}}));
  });
  var cuerpo=h("div");
  if(estado.cargando)cuerpo.appendChild(h("p",{"class":"sub",text:"Cargando…"}));
  else if(estado.err)cuerpo.appendChild(h("p",{"class":"sub",text:estado.err}));
  else if(!estado.lista.length)cuerpo.appendChild(h("p",{"class":"sub",text:vistaAct==="semana"?"Aún nadie suma XP esta semana. Entrena y sé el primero.":"Aún no hay nadie en Mundo."}));
  else estado.lista.forEach(function(x,i){
    var esYo=x._id===yo;
    cuerpo.appendChild(h("div",{"class":"mu-row"+(esYo?" yo":"")},[
      h("div",{"class":"mu-pos",text:String(i+1)}),
      h("div",{"class":"mu-av","aria-hidden":"true",text:String(x.avatar||"🔥")}),
      h("div",{style:"min-width:0"},[h("div",{"class":"mu-n",text:String(x.alias||"Anónimo")+(esYo?" (tú)":"")}),
        h("div",{"class":"mu-m",text:"Nivel "+(x.nivel||1)+" · "+(x.titulo||"")+" · racha "+(x.racha||0)+" · "+(x.d30||0)+" días en 30"})]),
      h("div",{"class":"mu-xp num",text:fmt(x[campo]||0)+" XP"})
    ]));
  });
  return h("section",{"class":"rt-card"},[
    h("div",{"class":"row between"},[h("h3",{text:"Mundo"}),h("span",{"class":"pill num",text:vistaAct==="semana"?"Semana del "+lunesSemana().slice(8)+"/"+lunesSemana().slice(5,7):"Top 50"})]),
    h("p",{"class":"sub",style:"margin:6px 0 12px",text:"La comunidad de FORJA. El ranking semanal reinicia cada lunes."}),
    sub,cuerpo]);
}

function tarjetaPrivacidad(repintar){
  var err=h("div",{"class":"mu-err",role:"alert"});
  return h("section",{"class":"rt-card"},[
    h("h3",{text:"Tu privacidad"}),
    h("p",{"class":"sub",style:"margin-top:8px",text:"Apareces como «"+((perfil()||{}).alias||"")+"». Solo se publican alias, avatar, nivel, XP, racha y días en 30."}),
    err,h("div",{"class":"mu-btns"},[h("button",{type:"button","class":"btn",text:"Salir de Mundo y borrar mi registro",onclick:function(){
      var f=nube();
      if(!f){err.textContent="Necesitas conexión para borrar tu registro.";return}
      f.db.collection("mundo").doc(f.u.uid).delete().then(function(){lsSet(LS_OK,null);lsSet(LS_PERFIL,null);estado.lista=[];repintar()},
        function(){err.textContent="No pude borrar tu registro. Intenta de nuevo."});
    }})])
  ]);
}

/* Mantiene tu registro al día al abrir la app (solo si ya activaste Mundo). */
try{ if(typeof fbAuth!=="undefined"&&fbAuth)fbAuth.onAuthStateChanged(function(u){if(u)setTimeout(function(){sincronizar(false)},4000)}) }catch(e){}

window.FORJAMundo={vista:vista,_xpSemana:xpSemana,_validarAlias:validarAlias};
})();
