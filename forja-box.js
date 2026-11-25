/*
 * FORJA · Box
 * Entrenamiento de box por rondas, en cualquier lugar. Módulo aislado:
 *  - El temporizador y el conteo de rondas viven SOLO dentro de #view-box.
 *  - No toca series, PRs, logs ni retos del resto de la app. Solo LEE plan/proHasta/displayName.
 *  - Todo lo propio se guarda en claves "forja_box_*" de localStorage.
 * Se carga al final de index.html: <script src="forja-box.js"></script>
 */
(function(){
"use strict";
if(window.FORJABox||!document.getElementById("view-progreso"))return;

/* ===================== CONFIG (todo lo "POR CONFIRMAR" se llena con datos reales) ===================== */
var BOX={
  MODO_PRUEBA:true,     /* true: un pase registrado por el staff vale en este mismo dispositivo (solo para probar). En producción va en false: solo valen los pases de la nube. */
  CONFIRMADO:false,     /* false: muestra la cinta "versión de prueba". Pasar a true cuando Balam confirme condiciones. */
  WHATSAPP:"",          /* número del coach con lada: 521234567890. Vacío = botón deshabilitado */
  COACH:"POR CONFIRMAR",
  GYM:{nombre:"POR CONFIRMAR",direccion:"POR CONFIRMAR",horario:"POR CONFIRMAR"},
  PRECIOS:{dia:"POR CONFIRMAR",mes:"POR CONFIRMAR"},
  STAFF:[{nombre:"Staff de prueba",pin:"1234"}]  /* PIN SOLO PARA PRUEBAS: antes de publicar se cambia por login real con cuenta de staff */
};

/* ===================== Catálogo técnico ===================== */
var GOLPES=[
 {n:"1",t:"Jab",d:"Recto con la mano adelantada. Sale rápido desde la guardia y regresa igual de rápido.",c:"Gira el puño al final, hombro protege la barbilla.",e:"Bajar la mano trasera al lanzarlo."},
 {n:"2",t:"Cruzado (recto trasero)",d:"Recto con la mano trasera. La fuerza nace en el pie trasero, la cadera y el hombro.",c:"Pivota el pie trasero y rota la cadera hacia el frente.",e:"Quedarse con el brazo estirado al terminar."},
 {n:"3",t:"Gancho adelantado",d:"Golpe en arco con la mano adelantada, codo a la altura del puño.",c:"Gira desde el pie y la cadera, no empujes con el hombro.",e:"Abrir demasiado el codo."},
 {n:"4",t:"Gancho trasero",d:"Golpe en arco con la mano trasera, rotando todo el cuerpo.",c:"Mantén la otra mano pegada a la cara.",e:"Perder el equilibrio hacia adelante."},
 {n:"5",t:"Uppercut adelantado",d:"Golpe ascendente con la mano adelantada, doblando un poco las rodillas.",c:"Sube desde las piernas; el puño viaja corto.",e:"Cargar el golpe hacia atrás antes de lanzarlo."},
 {n:"6",t:"Uppercut trasero",d:"Golpe ascendente con la mano trasera.",c:"Rota la cadera y empuja con el pie trasero.",e:"Dejar la guardia abierta del otro lado."}
];
var DEFENSA=[
 {t:"Guardia",d:"Puños a la altura de la cara, codos pegados a las costillas, barbilla baja. Es tu posición de regreso después de cada golpe."},
 {t:"Esquiva lateral (slip)",d:"Mueve la cabeza unos centímetros a un lado de la línea del golpe, con una ligera rotación del tronco."},
 {t:"Esquiva en U (bob & weave)",d:"Dobla las rodillas, baja el torso y pasa por debajo del golpe dibujando una U con la cabeza."},
 {t:"Bloqueo",d:"Recibe el golpe en los antebrazos y guantes, con la guardia cerrada y los codos protegiendo el cuerpo."},
 {t:"Parry (desvío)",d:"Un toque corto con la palma para desviar el golpe, sin abrir la guardia."},
 {t:"Retroceso",d:"Un paso atrás para salir de rango, manteniendo la postura y sin cruzar los pies."}
];
var FOOTWORK=[
 {t:"Postura base",d:"Pies un poco más abiertos que los hombros, uno ligeramente adelante. Peso repartido, rodillas suaves."},
 {t:"Paso adelante / atrás",d:"Mueve primero el pie que va hacia la dirección y arrastra el otro. Nunca cruces los pies."},
 {t:"Desplazamiento lateral",d:"Mueve primero el pie del lado hacia donde vas. Mantén la distancia entre los pies."},
 {t:"Pivote",d:"Gira sobre la punta del pie adelantado para cambiar el ángulo sin retroceder."}
];
var PASOS={
 "Jab":["Parte de la guardia: la mano adelantada sale en línea recta desde la barbilla hacia el frente.","Estira el brazo y gira el puño para que la palma quede hacia abajo justo al llegar.","El hombro adelantado sube y cubre la barbilla; la mano trasera se queda pegada a la cara.","Regresa el puño por el mismo camino, igual de rápido, hasta la guardia."],
 "Cruzado (recto trasero)":["Parte de la guardia con el peso repartido entre los dos pies.","Empuja con el pie trasero y gira la cadera y el hombro trasero hacia el frente.","El puño trasero sale recto por el centro del cuerpo; el talón trasero se levanta y pivotas sobre la punta del pie.","Mantén la mano adelantada en la cara. Al terminar, regresa el puño y la cadera a la guardia."],
 "Gancho adelantado":["Dobla el brazo adelantado a unos 90°, con el codo a la altura del puño.","Gira el pie adelantado, la cadera y el tronco hacia el lado contrario al del golpe.","El puño viaja en arco horizontal, sin subir ni bajar el codo.","Termina con el hombro cubriendo la barbilla y regresa girando a la guardia."],
 "Gancho trasero":["Dobla el brazo trasero a unos 90°, con el codo alto.","Empuja con el pie trasero y gira la cadera y el tronco hacia el frente.","El puño viaja en arco horizontal; la mano adelantada se queda pegada a la cara.","Regresa girando y recupera tu postura base antes del siguiente golpe."],
 "Uppercut adelantado":["Dobla un poco las rodillas y baja ligeramente el hombro adelantado.","Empuja con las piernas hacia arriba y gira un poco la cadera.","El puño sube en trayectoria corta, con la palma hacia ti, como hacia la barbilla.","Regresa a la guardia sin bajar la otra mano."],
 "Uppercut trasero":["Dobla un poco las rodillas y carga el peso sobre el pie trasero.","Empuja con el pie trasero y gira la cadera hacia el frente.","El puño trasero sube corto, con la palma hacia ti.","Regresa a la guardia y recupera la base."],
 "Guardia":["Colócate en postura base (pies un poco más abiertos que los hombros).","Sube los puños a cada lado de la barbilla, sin apretarlos.","Pega los codos a las costillas.","Baja la barbilla y mira por encima de los guantes."],
 "Esquiva lateral (slip)":["Parte de la guardia, relajado.","Flexiona un poco la rodilla del lado hacia donde vas a esquivar.","Mueve la cabeza unos centímetros fuera de la línea del golpe, girando el tronco.","Vuelve al centro y, si quieres, responde con un golpe."],
 "Esquiva en U (bob & weave)":["Dobla las rodillas, no la cintura.","Baja el torso y pasa por debajo de la línea del golpe dibujando una U con la cabeza.","Sube por el lado contrario al que empezaste.","Mantén la guardia arriba y la mirada al frente todo el movimiento."],
 "Bloqueo":["Cierra la guardia y sube los codos para proteger las costillas.","Recibe el golpe en antebrazos y guantes.","Mantén la barbilla baja y los pies firmes.","Abre la guardia solo cuando respondas."],
 "Parry (desvío)":["Parte de la guardia con las manos relajadas.","Con la palma abierta, toca el golpe de lado para desviarlo.","El movimiento es corto: la mano no se aleja de tu cara.","Regresa a la guardia de inmediato."],
 "Retroceso":["Empuja con el pie adelantado.","Da un paso atrás con el pie trasero.","Acomoda el pie adelantado para recuperar la distancia.","Termina en postura base, sin haber cruzado los pies."],
 "Postura base":["Separa los pies un poco más que el ancho de hombros.","Adelanta un pie; el otro queda atrás con el talón ligeramente levantado.","Reparte el peso entre los dos pies y dobla un poco las rodillas.","Sube la guardia y relaja los hombros."],
 "Paso adelante / atrás":["Desde la postura base, mueve primero el pie que va hacia la dirección.","Arrastra el otro pie para recuperar la distancia entre ambos.","No cruces los pies ni te pares sobre los talones.","Termina de nuevo en postura base."],
 "Desplazamiento lateral":["Desde la postura base, mueve primero el pie del lado hacia el que vas.","Arrastra el otro pie para recuperar la separación.","Mantén las rodillas flexionadas y la guardia arriba.","Repite en pasos cortos."],
 "Pivote":["Apoya el peso en la punta del pie adelantado.","Gira sobre esa punta moviendo el pie trasero en arco.","Mantén la guardia mientras giras.","Termina en postura base con el nuevo ángulo."]
};
var TOK={"1":"jab","2":"cruzado","3":"gancho adelantado","4":"gancho trasero","5":"uppercut adelantado","6":"uppercut trasero"};
function expl(c){return c.split(" - ").map(function(t){t=t.trim();return TOK[t]||t}).join(" + ")}
var COMBOS={
 1:["1","1 - 2","1 - 1 - 2","1 - 2 - esquiva","1 - 2 - 3"],
 2:["1 - 2 - 3 - 2","1 - 2 - esquiva - 2","2 - 3 - 2","1 - 2 - 5 - 2","1 - 6 - 3 - 2"],
 3:["1 - 2 - 3 - 6 - 3 - 2","1 - 1 - 2 - 3 - 2 - esquiva","1 - 2 - esquiva U - 3 - 2","3 - 4 - 3 - 2","2 - 3 - 6 - 3 - 2 - pivote"]
};
var NIVELES={1:"Inicio",2:"Intermedio",3:"Avanzado"};

var CALENT=[
 {n:"Círculos de muñeca",d:30,t:"Giros lentos en ambos sentidos, con los dedos relajados."},
 {n:"Círculos de hombros",d:30,t:"Hacia atrás y hacia adelante, grandes y controlados."},
 {n:"Rotación de tronco",d:30,t:"Brazos sueltos, gira de lado a lado sin forzar."},
 {n:"Movilidad de cuello",d:20,t:"Inclina y gira suave. No hagas círculos completos hacia atrás."},
 {n:"Cuerda imaginaria",d:60,t:"Saltitos ligeros sobre la punta de los pies."},
 {n:"Sombra suave",d:60,t:"Jab y cruzado al 30 % de intensidad, moviendo los pies."}
];
var RUTINAS=[
 {id:"r1",nivel:1,nombre:"Primeros rounds",rondas:3,work:120,rest:45,focos:["Postura y jab (1)","Jab y cruzado (1 - 2)","1 - 2 con pasos adelante y atrás"]},
 {id:"r2",nivel:2,nombre:"Combinaciones",rondas:4,work:180,rest:60,focos:["1 - 2 - 3 - 2","Esquivas y regreso (1 - 2 - esquiva - 2)","Ganchos y uppercuts","Libre: tus mejores combinaciones"]},
 {id:"r3",nivel:3,nombre:"Ritmo de pelea",rondas:6,work:180,rest:60,focos:["Jab constante y movimiento","Combinaciones largas de 4 a 6 golpes","Defensa y contragolpe","Trabajo al cuerpo y cabeza","Ritmo alto: 3 combos seguidos","Libre: cierra con técnica limpia"]}
];

/* ===================== Utilidades ===================== */
var ls={
 get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
 del:function(k){try{localStorage.removeItem(k)}catch(e){}}
};
function p2(n){return(n<10?"0":"")+n}
function mmss(s){s=Math.max(0,s|0);return p2(Math.floor(s/60))+":"+p2(s%60)}
function hoy(){try{if(typeof hoyKey==="function")return hoyKey()}catch(e){}var d=new Date();return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function sumaDias(k,n){var p=k.split("-").map(Number);var d=new Date(p[0],p[1]-1,p[2],12);d.setDate(d.getDate()+n);return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function fechaLarga(k){try{return new Date(k+"T12:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}catch(e){return k}}
function planPro(){try{return typeof plan!=="undefined"&&plan==="pro"}catch(e){return false}}
function proHastaV(){try{return typeof proHasta!=="undefined"?String(proHasta||""):""}catch(e){return ""}}
function nombreU(){try{if(typeof displayName!=="undefined"&&displayName)return displayName}catch(e){}try{if(typeof fbUser!=="undefined"&&fbUser&&fbUser.email)return fbUser.email}catch(e){}return "Usuario FORJA"}
function uidU(){try{return typeof fbUser!=="undefined"&&fbUser?fbUser.uid:""}catch(e){return ""}}
function codigo(){var u=uidU();if(u)return u.slice(0,8);var c=ls.get("forja_box_cod","");if(!c){c=Math.random().toString(36).slice(2,10);ls.set("forja_box_cod",c)}return c}
function h(tag,p,kids){var e=document.createElement(tag);for(var k in p||{}){if(k==="text")e.textContent=p[k];else if(k==="class")e.className=p[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),p[k]);else if(p[k]!==false&&p[k]!=null)e.setAttribute(k,p[k])}(kids||[]).forEach(function(c){if(c==null||c===false)return;e.appendChild(typeof c==="string"?document.createTextNode(c):c)});return e}

/* ===================== Acceso (Pro o pase del gimnasio) ===================== */
function paseVigente(){
  var lista=[];if(BOX.MODO_PRUEBA)lista.push(ls.get("forja_box_pase",null));lista.push(ls.get("forja_box_pase_nube",null));
  var t=hoy();
  for(var i=0;i<lista.length;i++){var p=lista[i];if(p&&p.hasta&&p.hasta>=t&&(!p.desde||p.desde<=t))return p}
  return null;
}
function acceso(){
  if(planPro()){var hh=proHastaV();return{tipo:"pro",txt:"FORJA PRO activo"+(hh?" hasta "+hh:"")}}
  var p=paseVigente();
  if(p){var n={prueba:"Clase de prueba (hoy)",dia:"Pase del día (hoy)",mes:"Mensualidad hasta "+p.hasta}[p.tipo]||"Pase activo";return{tipo:p.tipo,txt:n}}
  return null;
}
function leerNube(){
  try{
    if(typeof fbDB==="undefined"||!fbDB||!uidU())return;
    fbDB.collection("box_pases_gym").doc(codigo()).get().then(function(d){
      if(d.exists)ls.set("forja_box_pase_nube",d.data());else ls.del("forja_box_pase_nube");
      if(vistaActiva()&&!E.run&&!ov)pintar();
    }).catch(function(){});
  }catch(e){}
}
function escribirNube(cod,pase){
  return new Promise(function(ok){
    try{
      if(typeof fbDB==="undefined"||!fbDB){ok(false);return}
      fbDB.collection("box_pases_gym").doc(cod).set(pase).then(function(){ok(true)},function(){ok(false)});
    }catch(e){ok(false)}
  });
}

/* ===================== Responsiva (borrador) ===================== */
var RESP_V="borrador-1";
function aceptoResp(){var a=ls.get("forja_box_resp",null);return !!(a&&a.v===RESP_V)}
function mostrarResp(despues){
  var ch=h("input",{type:"checkbox",id:"bxChk"});
  var btn=h("button",{"class":"btn btn-molten",type:"button",disabled:"disabled",text:"Aceptar y continuar",onclick:function(){ls.set("forja_box_resp",{v:RESP_V,ts:Date.now(),nombre:nombreU()});cerrarOv();despues&&despues()}});
  ch.addEventListener("change",function(){if(ch.checked)btn.removeAttribute("disabled");else btn.setAttribute("disabled","disabled")});
  abrirOv(h("div",{"class":"bx-modal"},[
    h("span",{"class":"eyebrow",text:"Antes de entrenar"}),h("h3",{text:"Aviso de responsabilidad"}),
    h("p",{"class":"muted",text:"BORRADOR · pendiente de revisión por el gimnasio y por una persona con conocimiento legal."}),
    h("p",{text:"Entrenar box implica esfuerzo físico y contacto con el equipo. Declaro que estoy en condiciones de realizar actividad física, que entrenaré dentro de mis límites y que me detendré si siento dolor, mareo o falta de aire. Si tengo alguna condición de salud, consultaré a un médico antes de entrenar."}),
    h("label",{"class":"bx-chk"},[ch,h("span",{text:"He leído y acepto."})]),
    h("div",{"class":"bx-row"},[btn,h("button",{"class":"btn btn-ghost",type:"button",text:"Cancelar",onclick:cerrarOv})])
  ]));
}

/* ===================== Overlay genérico ===================== */
var ov=null,ovT=null;
function abrirOv(contenido,full){cerrarOv();ov=h("div",{"class":"bx-ov"+(full?" bx-full":"")},[contenido]);document.body.appendChild(ov)}
function cerrarOv(){if(ovT){clearInterval(ovT);ovT=null}if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);ov=null}

/* ===================== Audio y temporizador ===================== */
var AC=null;
function audio(){try{if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==="suspended")AC.resume()}catch(e){}return AC}
function tono(f,dur,t0,vol){var a=audio();if(!a)return;try{var o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.value=f;var t=a.currentTime+(t0||0);g.gain.setValueAtTime(vol||.5,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur)}catch(e){}}
function campana(n){for(var i=0;i<n;i++){tono(880,1.1,i*.45,.5);tono(1320,.8,i*.45,.25)}try{if(navigator.vibrate)navigator.vibrate(n===1?[300]:[200,100,200,100,200])}catch(e){}}
var wl=null;
function wake(){try{if(navigator.wakeLock)navigator.wakeLock.request("screen").then(function(l){wl=l}).catch(function(){})}catch(e){}}
function unwake(){try{if(wl){wl.release();wl=null}}catch(e){}}

var E={run:false,paused:false,segs:[],i:0,endAt:0,left:0,pausaMs:0,r:null,t:null,avisado:false,fin:false,ref:{}};
function segsDe(r){
  var s=[{k:"prep",d:10,n:"Prepárate",t:"Guardia arriba, pies al ancho de hombros, hombros relajados."}];
  if(r.calent)CALENT.forEach(function(c){s.push({k:"warm",d:c.d,n:c.n,t:c.t})});
  for(var i=0;i<r.rondas;i++){
    s.push({k:"round",d:r.work,n:"Ronda "+(i+1)+" de "+r.rondas,t:r.focos[i%r.focos.length],i:i+1});
    if(i<r.rondas-1)s.push({k:"rest",d:r.rest,n:"Descanso",t:"Respira por la nariz, hidrátate y suelta hombros y manos."});
  }
  return s;
}
function empezar(r){
  if(!acceso()){pintar();return}
  if(!aceptoResp()){mostrarResp(function(){empezar(r)});return}
  audio();E.r=r;E.segs=segsDe(r);E.run=true;E.paused=false;E.fin=false;fijaSeg(0);
  if(E.t)clearInterval(E.t);E.t=setInterval(tick,200);wake();pintar();
}
function fijaSeg(i){var sg=E.segs[i];E.i=i;E.left=sg.d;E.endAt=Date.now()+sg.d*1000;E.avisado=false;if(sg.k==="round")campana(1);else if(sg.k==="rest")campana(3);else if(i>0&&sg.k==="warm")tono(700,.15,0,.3)}
function tick(){
  if(!E.run||E.paused)return;
  if(!vistaActiva()){detener();return}
  var l=Math.ceil((E.endAt-Date.now())/1000);
  var sg=E.segs[E.i];
  if(l<=0){
    if(E.i+1>=E.segs.length){terminar();return}
    fijaSeg(E.i+1);pintarTimer();return;
  }
  E.left=l;
  if(l===10&&sg.k==="round"&&!E.avisado){E.avisado=true;tono(660,.15,0,.4);tono(660,.15,.25,.4)}
  pintarTimer();
}
function pausar(){if(!E.run)return;if(!E.paused){E.paused=true;E.pausaMs=E.endAt-Date.now()}else{E.paused=false;E.endAt=Date.now()+E.pausaMs}pintarTimer()}
function saltar(){if(!E.run)return;if(E.i+1>=E.segs.length){terminar();return}fijaSeg(E.i+1);E.paused=false;pintarTimer()}
function detener(){if(E.t){clearInterval(E.t);E.t=null}E.run=false;E.paused=false;unwake();if(vistaActiva())pintar()}
function terminar(){
  var r=E.r;campana(3);
  if(r){var hist=ls.get("forja_box_hist",[]);hist.push({ts:Date.now(),fecha:hoy(),rutina:r.nombre,rondas:r.rondas,work:r.work});ls.set("forja_box_hist",hist.slice(-80));ls.set("forja_box_ultima",r.nombre)}
  if(E.t){clearInterval(E.t);E.t=null}E.run=false;E.fin=true;unwake();pintar();
}

/* ===================== Estado de UI ===================== */
var tab="entrenar",nivel=ls.get("forja_box_nivel",1),custom=ls.get("forja_box_custom",{rondas:3,work:180,rest:60});
var boxOn=false;
function vistaActiva(){var v=document.getElementById("view-rutinas");return !!(boxOn&&v&&v.classList.contains("active"))}

/* ===================== Vistas ===================== */
function lock(){
  return h("div",{"class":"bx-card bx-lock"},[
    h("div",{"class":"bx-big",text:"🔒"}),
    h("h3",{text:"Rutinas de box: exclusivas de FORJA PRO"}),
    h("p",{"class":"muted",text:"Con Modo PRO se desbloquean las rutinas por rondas, el temporizador con campana y el calentamiento de muñecas y hombros. Si ya pagaste tu pase en el gimnasio, el staff lo registra y se activa aquí."}),
    h("div",{"class":"bx-row"},[
      h("button",{"class":"btn btn-molten",type:"button",text:"Activar Modo PRO",onclick:function(){try{if(typeof openPro==="function")openPro()}catch(e){}}}),
      h("button",{"class":"btn btn-ghost",type:"button",text:"Ver dónde entrenar",onclick:function(){tab="gimnasio";pintar()}})
    ])
  ]);
}
function rutinaCard(r){
  var min=Math.round((r.rondas*r.work+(r.rondas-1)*r.rest)/60);
  return h("div",{"class":"bx-card"},[
    h("div",{"class":"bx-rowb"},[h("div",null,[h("span",{"class":"bx-pill",text:"Nivel "+r.nivel+" · "+NIVELES[r.nivel]}),h("h3",{text:r.nombre})]),h("div",{"class":"bx-meta",text:r.rondas+" rondas · "+mmss(r.work)+" / "+mmss(r.rest)+" · ~"+min+" min"})]),
    h("ul",{"class":"bx-list"},r.focos.slice(0,r.rondas).map(function(f,i){return h("li",{text:"Ronda "+(i+1)+": "+f})})),
    h("div",{"class":"bx-row"},[
      h("button",{"class":"btn btn-molten",type:"button",text:"Empezar",onclick:function(){empezar(r)}}),
      h("button",{"class":"btn btn-ghost",type:"button",text:"Con calentamiento",onclick:function(){var c=JSON.parse(JSON.stringify(r));c.calent=true;empezar(c)}}),
      h("button",{"class":"btn btn-ghost",type:"button",text:"Cómo se hace",onclick:function(){tab="tecnica";pintar();window.scrollTo({top:0,behavior:"smooth"})}})
    ])
  ]);
}
function stepper(lbl,val,min,max,step,fmt,set){
  var v=h("b",{text:fmt(val)});
  return h("div",{"class":"bx-step"},[h("span",{text:lbl}),h("div",null,[
    h("button",{type:"button","aria-label":"menos",text:"−",onclick:function(){val=Math.max(min,val-step);set(val);v.textContent=fmt(val)}}),v,
    h("button",{type:"button","aria-label":"más",text:"+",onclick:function(){val=Math.min(max,val+step);set(val);v.textContent=fmt(val)}})
  ])]);
}
function vistaEntrenar(){
  var k=[];
  if(!acceso()){k.push(lock());return k}
  var a=acceso();
  k.push(h("div",{"class":"bx-ok",text:"✔ "+a.txt}));
  k.push(h("div",{"class":"bx-card"},[
    h("h3",{text:"Tu nivel"}),
    h("div",{"class":"bx-seg"},[1,2,3].map(function(n){return h("button",{type:"button","class":n===nivel?"on":"",text:NIVELES[n],onclick:function(){nivel=n;ls.set("forja_box_nivel",n);pintar()}})})),
    h("p",{"class":"muted",text:"Empieza por el nivel que te cuadre. Si tienes dudas, escríbele al coach."})
  ]));
  RUTINAS.filter(function(r){return r.nivel===nivel}).forEach(function(r){k.push(rutinaCard(r))});
  RUTINAS.filter(function(r){return r.nivel!==nivel}).forEach(function(r){k.push(rutinaCard(r))});
  k.push(h("div",{"class":"bx-card"},[
    h("h3",{text:"Calentamiento de muñecas y hombros"}),
    h("p",{"class":"muted",text:"Unos 4 minutos de movilidad guiada por tiempo. Úsalo antes de cualquier ronda."}),
    h("button",{"class":"btn btn-ghost",type:"button",text:"Solo calentamiento",onclick:function(){empezar({nombre:"Calentamiento",rondas:0,work:0,rest:0,focos:[""],calent:true})}})
  ]));
  var c=custom;
  k.push(h("div",{"class":"bx-card"},[
    h("h3",{text:"Rondas a tu medida"}),
    stepper("Rondas",c.rondas,1,12,1,function(v){return String(v)},function(v){c.rondas=v;ls.set("forja_box_custom",c)}),
    stepper("Trabajo",c.work,30,300,15,mmss,function(v){c.work=v;ls.set("forja_box_custom",c)}),
    stepper("Descanso",c.rest,15,120,15,mmss,function(v){c.rest=v;ls.set("forja_box_custom",c)}),
    h("button",{"class":"btn btn-molten",type:"button",text:"Empezar",onclick:function(){empezar({nombre:"Rondas libres",rondas:c.rondas,work:c.work,rest:c.rest,focos:["Trabajo libre: sombra, combos y defensa"]})}})
  ]));
  var hist=ls.get("forja_box_hist",[]);
  if(hist.length){
    var ult=hist.slice(-5).reverse();
    k.push(h("div",{"class":"bx-card"},[h("h3",{text:"Tus últimas sesiones de box"}),h("ul",{"class":"bx-list"},ult.map(function(s){return h("li",{text:s.fecha+" · "+s.rutina+(s.rondas?" · "+s.rondas+" rondas":"")})}))]));
  }
  return k;
}
function vistaTimer(){
  var sg=E.segs[E.i],R=E.ref={};
  var panel=h("div",{"class":"bx-timer k-"+sg.k});
  R.panel=panel;
  R.tag=h("div",{"class":"bx-tag"});R.time=h("div",{"class":"bx-time"});R.name=h("div",{"class":"bx-name"});R.tip=h("div",{"class":"bx-tip"});R.bar=h("div",{"class":"bx-bar"},[h("i")]);R.next=h("div",{"class":"bx-next"});R.cnt=h("div",{"class":"bx-cnt"});
  [R.cnt,R.tag,R.time,R.bar,R.name,R.tip,R.next].forEach(function(n){panel.appendChild(n)});
  R.bp=h("button",{"class":"btn btn-ghost",type:"button",onclick:pausar});
  panel.appendChild(h("div",{"class":"bx-row"},[R.bp,h("button",{"class":"btn btn-ghost",type:"button",text:"Cómo se hace",onclick:guia}),h("button",{"class":"btn btn-ghost",type:"button",text:"Saltar",onclick:saltar}),h("button",{"class":"btn btn-ghost",type:"button",text:"Terminar",onclick:function(){if(confirm("¿Terminar la sesión?"))detener()}})]));
  setTimeout(pintarTimer,0);
  return [panel];
}
function pintarTimer(){
  var R=E.ref;if(!R||!R.time||!E.run)return;
  var sg=E.segs[E.i],sig=E.segs[E.i+1];
  var lab={prep:"PREPÁRATE",warm:"CALENTAMIENTO",round:"RONDA",rest:"DESCANSO"}[sg.k];
  R.panel.className="bx-timer k-"+sg.k+(E.paused?" paused":"");
  R.tag.textContent=lab;
  R.time.textContent=mmss(E.paused?Math.ceil(E.pausaMs/1000):E.left);
  R.name.textContent=sg.n;R.tip.textContent=sg.t||"";
  R.bar.firstChild.style.width=Math.max(0,Math.min(100,100*(1-(E.paused?E.pausaMs/1000:E.left)/sg.d)))+"%";
  R.next.textContent=sig?"Sigue: "+(sig.k==="round"?sig.n+" · "+sig.t:sig.n):"Última parte";
  var tot=E.r.rondas;R.cnt.textContent=tot&&sg.k==="round"?"Ronda "+sg.i+" / "+tot:(tot?"":"");
  R.bp.textContent=E.paused?"Reanudar":"Pausa";
}
function guia(){
  var k=[h("span",{"class":"eyebrow",text:"Consulta rápida"}),h("h3",{text:"Cómo se hace"}),h("p",{"class":"muted",text:"El temporizador sigue corriendo mientras lees."})];
  GOLPES.concat(DEFENSA).forEach(function(g){k.push(h("div",{"class":"bx-g"},[h("b",{text:(g.n?g.n+" · ":"")+g.t}),h("ol",{"class":"bx-list"},(PASOS[g.t]||[]).map(function(x){return h("li",{text:x})}))]))});
  k.push(h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:"Cerrar",onclick:cerrarOv})]));
  abrirOv(h("div",{"class":"bx-modal bx-wide"},k));
}
function vistaFin(){
  return [h("div",{"class":"bx-card bx-lock"},[h("div",{"class":"bx-big",text:"🥊"}),h("h3",{text:"¡Sesión terminada!"}),h("p",{"class":"muted",text:"Buen trabajo. Hidrátate, estira hombros y muñecas y descansa."}),h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:"Volver",onclick:function(){E.fin=false;pintar()}}),h("button",{"class":"btn btn-ghost",type:"button",text:"Hablar con el coach",onclick:function(){E.fin=false;tab="coach";pintar()}})])])];
}
/* Videos demostrativos por movimiento (archivo junto al index). Se pueden sustituir con window.FORJA_BOX_VIDEOS */
var VIDEOS={"Jab":"forja-box-jab.mp4","Cruzado (recto trasero)":"forja-box-cruzado.mp4","Gancho adelantado":"forja-box-gancho-adelantado.mp4","Gancho trasero":"forja-box-gancho-trasero.mp4","Uppercut adelantado":"forja-box-uppercut-adelantado.mp4","Uppercut trasero":"forja-box-uppercut-trasero.mp4"};
try{var _vo=window.FORJA_BOX_VIDEOS||{};for(var _k in _vo)VIDEOS[_k]=_vo[_k]}catch(e){}
function aBlob(u){try{if(u.indexOf("data:")!==0)return u;var i=u.indexOf(","),m=/^data:([^;,]+)/.exec(u)[1],bin=atob(u.slice(i+1)),a=new Uint8Array(bin.length);for(var k=0;k<bin.length;k++)a[k]=bin.charCodeAt(k);return URL.createObjectURL(new Blob([a],{type:m}))}catch(e){return u}}
function videoDe(t){
  var src=VIDEOS[t];if(!src)return h("div",{"class":"bx-video",text:"Video demostrativo: próximamente"});
  var po=(window.FORJA_BOX_POSTERS||{})[t]||(src.indexOf("data:")===0?"":src.replace(/\.mp4$/,".jpg"));
  var nota=h("div",{"class":"bx-cap",text:"Video de referencia generado con IA. Tu coach tiene la última palabra."});
  var v=h("video",{"class":"bx-vid",controls:"controls",playsinline:"",loop:"",preload:"auto","aria-label":"Video demostrativo: "+t});
  if(po)v.setAttribute("poster",po);
  v.muted=true;v.src=aBlob(src);
  v.addEventListener("error",function(){
    nota.textContent="No se pudo cargar el video. Revisa tu conexión o intenta en un momento. ";
    var rb=h("button",{type:"button","class":"bx-link",text:"Reintentar",onclick:function(){nota.textContent="Video de referencia generado con IA. Tu coach tiene la última palabra.";v.src=aBlob(src);try{v.load()}catch(e){}}});
    nota.appendChild(rb);
  });
  setTimeout(function(){if(v.readyState===0&&!v.error){try{v.load()}catch(e){}}},3000);
  return h("div",null,[v,nota]);
}
function tecCard(g){var ps=PASOS[g.t];return h("div",{"class":"bx-card"},[h("h3",{text:(g.n?g.n+" · ":"")+g.t}),h("p",{text:g.d}),ps?h("div",null,[h("div",{"class":"bx-sub",text:"Paso a paso"}),h("ol",{"class":"bx-list"},ps.map(function(x){return h("li",{text:x})}))]):null,g.c?h("p",{"class":"muted",text:"Clave: "+g.c}):null,g.e?h("p",{"class":"muted",text:"Error común: "+g.e}):null,videoDe(g.t)])}
function vistaTecnica(){
  var k=[h("div",{"class":"bx-card"},[h("h3",{text:"Numeración de golpes"}),h("p",{"class":"muted",text:"Mano adelantada = la del lado que llevas al frente. 1 jab, 2 cruzado, 3 y 4 ganchos, 5 y 6 uppercuts. Así se cantan las combinaciones."})])];
  k.push(h("h4",{"class":"bx-h",text:"Golpes"}));GOLPES.forEach(function(g){k.push(tecCard(g))});
  k.push(h("h4",{"class":"bx-h",text:"Defensa"}));DEFENSA.forEach(function(g){k.push(tecCard(g))});
  k.push(h("h4",{"class":"bx-h",text:"Juego de pies"}));FOOTWORK.forEach(function(g){k.push(tecCard(g))});
  k.push(h("h4",{"class":"bx-h",text:"Combinaciones por nivel"}));
  [1,2,3].forEach(function(n){k.push(h("div",{"class":"bx-card"},[h("h3",{text:"Nivel "+n+" · "+NIVELES[n]}),h("ul",{"class":"bx-list"},COMBOS[n].map(function(c){return h("li",{text:c+"  →  "+expl(c)})}))]))});
  return k;
}
function vistaCoach(){
  var ult=ls.get("forja_box_ultima","");
  var msg="Hola coach, soy "+nombreU()+" (FORJA). Nivel: "+NIVELES[nivel]+"."+(ult?" Mi última rutina: "+ult+".":"")+" Mi duda es: ";
  var ok=!!BOX.WHATSAPP;
  return [h("div",{"class":"bx-card"},[
    h("h3",{text:"Habla con el coach de box"}),
    h("p",{text:"¿Dudas con una técnica, una combinación o tu rutina? Escríbele por WhatsApp. Si prefieres una videollamada, se agenda por el mismo chat."}),
    h("p",{"class":"muted",text:"Coach: "+BOX.COACH}),
    h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:ok?"Abrir WhatsApp":"WhatsApp: por confirmar",disabled:ok?null:"disabled",onclick:function(){if(ok)window.open("https://wa.me/"+BOX.WHATSAPP+"?text="+encodeURIComponent(msg),"_blank","noopener")}})]),
    h("p",{"class":"muted",text:"El mensaje ya lleva tu nombre, tu nivel y tu última rutina."})
  ])];
}
function vistaGym(){
  var a=acceso(),G=BOX.GYM;
  var k=[h("div",{"class":"bx-card"},[
    h("span",{"class":"eyebrow",text:"Entrena en persona"}),h("h3",{text:"Gimnasio de box: "+G.nombre}),
    h("p",{text:"Dirección: "+G.direccion}),h("p",{text:"Horario: "+G.horario}),
    h("p",{"class":"muted",text:"Propuesta (por confirmar con el gimnasio): primera clase de prueba sin costo, una vez por persona. Después, puedes entrenar mientras tu FORJA PRO esté activo. Si aún no lo tienes, puedes pagar un pase del día ("+BOX.PRECIOS.dia+") o la mensualidad ("+BOX.PRECIOS.mes+") directamente en el gimnasio."})
  ]),
  h("div",{"class":"bx-card"},[
    h("h3",{text:"Cómo se verifica tu acceso"}),
    h("ul",{"class":"bx-list"},[h("li",{text:"En el gimnasio te piden abrir FORJA y entrar a Box."}),h("li",{text:"Muestras tu pantalla de acceso: nombre, fecha y hora en vivo."}),h("li",{text:"Si no tienes acceso activo, el staff registra tu pago y se habilita en tu app."})]),
    h("p",{"class":"muted",text:"Tu estado: "+(a?a.txt:"sin acceso activo")}),
    h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:"Mostrar mi pantalla de acceso",onclick:function(){if(!aceptoResp())mostrarResp(pantallaVisitante);else pantallaVisitante()}})])
  ]),
  h("div",{"class":"bx-foot"},[h("button",{type:"button","class":"bx-link",text:"Acceso del personal del gimnasio",onclick:staffLogin})])];
  return k;
}

/* ===================== Pantalla del visitante ===================== */
function pantallaVisitante(){
  var a=acceso();
  var clk=h("div",{"class":"bx-clock"}),fch=h("div",{"class":"bx-date",text:(function(t){return t.charAt(0).toUpperCase()+t.slice(1)})(fechaLarga(hoy()))});
  function t(){var d=new Date();clk.textContent=p2(d.getHours())+":"+p2(d.getMinutes())+":"+p2(d.getSeconds())}
  t();
  var cuerpo=h("div",{"class":"bx-vis "+(a?"ok":"no")},[
    h("div",{"class":"bx-stripes"}),
    h("div",{"class":"bx-brand",text:"FORJA · BOX"}),
    h("div",{"class":"bx-vname",text:nombreU()}),
    h("div",{"class":"bx-vstat",text:a?a.txt:"SIN ACCESO ACTIVO"}),
    clk,fch,
    h("div",{"class":"bx-code",text:"Código "+codigo()}),
    h("p",{"class":"bx-vhint",text:a?"Ahora inicia la rutina de box para que el staff lo verifique.":"Paga tu pase en recepción o activa FORJA PRO."}),
    h("div",{"class":"bx-row"},[
      a?h("button",{"class":"btn btn-molten",type:"button",text:"Iniciar rutina de box",onclick:function(){cerrarOv();tab="entrenar";pintar()}}):null,
      h("button",{"class":"btn btn-ghost",type:"button",text:"Cerrar",onclick:cerrarOv})
    ])
  ]);
  abrirOv(cuerpo,true);ovT=setInterval(t,250);
}

/* ===================== Panel del staff ===================== */
function staffLogin(){
  var pin=h("input",{type:"password",inputmode:"numeric",placeholder:"PIN",autocomplete:"off","class":"bx-in"});
  var err=h("div",{"class":"bx-err"});
  function ir(){var s=BOX.STAFF.filter(function(x){return x.pin===pin.value})[0];if(!s){err.textContent="PIN incorrecto";return}panelStaff(s)}
  pin.addEventListener("keydown",function(e){if(e.key==="Enter")ir()});
  abrirOv(h("div",{"class":"bx-modal"},[h("span",{"class":"eyebrow",text:"Personal del gimnasio"}),h("h3",{text:"Ingresar"}),pin,err,h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:"Entrar",onclick:ir}),h("button",{"class":"btn btn-ghost",type:"button",text:"Cancelar",onclick:cerrarOv})])]));
  setTimeout(function(){pin.focus()},50);
}
function logGym(){return ls.get("forja_boxgym_log",[])}
function resumenMes(){
  var d=new Date(),pre=d.getFullYear()+"-"+p2(d.getMonth()+1),r={};
  logGym().filter(function(x){return x.fecha.indexOf(pre)===0}).forEach(function(x){var o=r[x.tipo]||(r[x.tipo]={n:0,m:0});o.n++;o.m+=Number(x.monto)||0});
  return r;
}
function csvLog(){
  var rows=[["fecha","hora","staff","codigo","tipo","monto","metodo","nube"]];
  logGym().forEach(function(x){rows.push([x.fecha,x.hora,x.staff,x.codigo,x.tipo,x.monto,x.metodo,x.nube?"si":"no"])});
  return rows.map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"'}).join(",")}).join("\n");
}
function panelStaff(staff){
  var cod=h("input",{"class":"bx-in",placeholder:"Código del visitante",value:codigo()});
  var tipo=h("select",{"class":"bx-in"},[h("option",{value:"prueba",text:"Clase de prueba (gratis, 1 vez)"}),h("option",{value:"dia",text:"Pase del día"}),h("option",{value:"mes",text:"Mensualidad (30 días)"})]);
  var monto=h("input",{"class":"bx-in",type:"number",min:"0",placeholder:"Monto cobrado (MXN)",inputmode:"decimal"});
  var met=h("select",{"class":"bx-in"},[h("option",{value:"efectivo",text:"Efectivo"}),h("option",{value:"transferencia",text:"Transferencia"}),h("option",{value:"tarjeta",text:"Tarjeta"}),h("option",{value:"otro",text:"Otro"})]);
  var msg=h("div",{"class":"bx-msg"}),lista=h("div"),res=h("div");
  function pintaLista(){
    lista.textContent="";res.textContent="";
    var t=hoy(),hoyL=logGym().filter(function(x){return x.fecha===t}).reverse();
    lista.appendChild(h("h4",{"class":"bx-h",text:"Hoy ("+hoyL.length+")"}));
    if(!hoyL.length)lista.appendChild(h("p",{"class":"muted",text:"Sin registros."}));
    lista.appendChild(h("ul",{"class":"bx-list"},hoyL.map(function(x){return h("li",{text:x.hora+" · "+x.codigo+" · "+x.tipo+(x.monto?" · $"+x.monto:"")+" · "+x.staff+(x.nube?"":" · sin sincronizar")})})));
    var rm=resumenMes(),ks=Object.keys(rm);
    res.appendChild(h("h4",{"class":"bx-h",text:"Resumen del mes"}));
    if(!ks.length)res.appendChild(h("p",{"class":"muted",text:"Sin movimientos."}));
    res.appendChild(h("ul",{"class":"bx-list"},ks.map(function(q){return h("li",{text:q+": "+rm[q].n+" · $"+rm[q].m})})));
  }
  function registrar(){
    var c=cod.value.trim();if(!c){msg.textContent="Escribe el código del visitante.";return}
    var ty=tipo.value;
    if(ty==="prueba"&&logGym().some(function(x){return x.codigo===c&&x.tipo==="prueba"})){msg.textContent="Esta persona ya usó su clase de prueba.";return}
    var d0=hoy(),hasta=ty==="mes"?sumaDias(d0,30):d0;
    var pase={tipo:ty,desde:d0,hasta:hasta,monto:Number(monto.value)||0,por:staff.nombre,ts:Date.now()};
    var n=new Date();
    var reg={fecha:d0,hora:p2(n.getHours())+":"+p2(n.getMinutes()),staff:staff.nombre,codigo:c,tipo:ty,monto:pase.monto,metodo:met.value,nube:false};
    if(BOX.MODO_PRUEBA&&c===codigo())ls.set("forja_box_pase",pase);
    msg.textContent="Registrando…";
    escribirNube(c,pase).then(function(ok){
      reg.nube=ok;var L=logGym();L.push(reg);ls.set("forja_boxgym_log",L);
      msg.textContent="Registrado: "+ty+" para "+c+(ok?" (sincronizado).":" (guardado en este dispositivo; la nube aún no está habilitada).");
      monto.value="";pintaLista();
    });
  }
  function copiar(){
    var t=csvLog();
    try{navigator.clipboard.writeText(t).then(function(){msg.textContent="CSV copiado."},function(){msg.textContent="No se pudo copiar."})}catch(e){msg.textContent="No se pudo copiar."}
  }
  pintaLista();
  abrirOv(h("div",{"class":"bx-modal bx-wide"},[
    h("span",{"class":"eyebrow",text:"Panel del gimnasio · "+staff.nombre}),h("h3",{text:"Registrar pago o clase"}),
    cod,tipo,monto,met,
    h("div",{"class":"bx-row"},[h("button",{"class":"btn btn-molten",type:"button",text:"Registrar",onclick:registrar}),h("button",{"class":"btn btn-ghost",type:"button",text:"Copiar CSV del historial",onclick:copiar}),h("button",{"class":"btn btn-ghost",type:"button",text:"Salir",onclick:cerrarOv})]),
    msg,lista,res
  ]));
}

/* ===================== Montaje ===================== */
function pintar(){
  var sec=document.getElementById("view-box");if(!sec)return;
  sec.textContent="";
  var w=h("div",{"class":"bx-wrap"});
  if(!BOX.CONFIRMADO)w.appendChild(h("div",{"class":"bx-ribbon",text:"VERSIÓN DE PRUEBA · precios, horarios, dirección y condiciones por confirmar"}));
  var body;
  if(E.run){body=vistaTimer()}
  else if(E.fin){body=vistaFin()}
  else{
    var tabs=[["entrenar","Entrenar"],["tecnica","Técnica"],["gimnasio","Dónde entrenar"],["coach","Coach"]];
    w.appendChild(h("div",{"class":"bx-tabs"},tabs.map(function(t){return h("button",{type:"button","class":t[0]===tab?"on":"",text:t[1],onclick:function(){tab=t[0];pintar()}})})));
    body={entrenar:vistaEntrenar,tecnica:vistaTecnica,gimnasio:vistaGym,coach:vistaCoach}[tab]();
  }
  body.forEach(function(n){w.appendChild(n)});
  w.appendChild(h("p",{"class":"bx-disc",text:"Entrena dentro de tus límites. Si sientes dolor, mareo o falta de aire, detente. Los resultados dependen de cada persona."}));
  sec.appendChild(w);
}
var CSS="#view-box .bx-wrap{display:flex;flex-direction:column;gap:14px;max-width:760px}"+
"#view-box .bx-ribbon{background:rgba(255,196,0,.12);border:1px dashed #d9a400;color:#ffd85e;border-radius:12px;padding:8px 12px;font-size:12px;font-weight:700;letter-spacing:.4px}"+
"#view-box .bx-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:10px}"+
"#view-box .bx-card h3{font-size:20px}#view-box .bx-card p{font-size:14px;line-height:1.45}"+
"#view-box .bx-tabs{display:flex;gap:6px;overflow-x:auto}"+
"#view-box .bx-tabs button,#view-box .bx-seg button{flex:1;min-width:80px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--muted-2);font-weight:700;font-size:13px}"+
"#view-box .bx-tabs button.on,#view-box .bx-seg button.on{background:var(--orange);color:#0a0f06;border-color:var(--orange)}"+
"#view-box .bx-seg{display:flex;gap:6px}"+
"#view-box .bx-row{display:flex;gap:10px;flex-wrap:wrap}#view-box .bx-rowb{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}"+
"#view-box .bx-pill{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:var(--surface-2);border:1px solid var(--line);color:var(--muted)}"+
"#view-box .bx-meta{font-size:12.5px;color:var(--muted)}"+
"#view-box .bx-list{padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:14px}"+
"#view-box .bx-ok{background:rgba(47,208,122,.1);border:1px solid rgba(47,208,122,.4);color:var(--green);border-radius:12px;padding:8px 12px;font-weight:700;font-size:13px}"+
"#view-box .bx-lock{align-items:center;text-align:center}#view-box .bx-big{font-size:42px}"+
"#view-box .bx-h{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--orange);margin-top:6px}"+
"#view-box .bx-video{border:1px dashed var(--line);border-radius:12px;padding:14px;text-align:center;color:var(--muted);font-size:12.5px}"+
"#view-box .bx-step{display:flex;justify-content:space-between;align-items:center;gap:10px}#view-box .bx-step>div{display:flex;align-items:center;gap:12px}"+
"#view-box .bx-step button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface-2);color:var(--text);font-size:20px}#view-box .bx-step b{min-width:48px;text-align:center;font-size:18px}"+
"#view-box .bx-sub{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);font-weight:700;margin:4px 0}.bx-g{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}.bx-g .bx-list{font-size:13px}"+
"#view-box .bx-foot{text-align:center}#view-box .bx-link{background:none;border:0;color:var(--muted);text-decoration:underline;font-size:12px}"+
"#view-box .bx-disc{font-size:11.5px;color:var(--muted);text-align:center;margin-top:6px}"+
"#view-box .bx-timer{border-radius:22px;padding:26px 18px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;background:var(--surface);border:2px solid var(--line)}"+
"#view-box .bx-timer.k-round{border-color:#ff5a3c;background:rgba(255,90,60,.1)}#view-box .bx-timer.k-rest{border-color:#2fd07a;background:rgba(47,208,122,.1)}#view-box .bx-timer.k-warm,#view-box .bx-timer.k-prep{border-color:#ffc400;background:rgba(255,196,0,.08)}#view-box .bx-timer.paused{opacity:.75}"+
"#view-box .bx-tag{font-size:13px;letter-spacing:4px;font-weight:800;color:var(--muted-2)}#view-box .bx-cnt{font-size:15px;font-weight:700}"+
"#view-box .bx-time{font-size:clamp(84px,24vw,150px);font-weight:900;line-height:1;font-variant-numeric:tabular-nums}"+
"#view-box .bx-bar{width:100%;height:10px;border-radius:9px;background:var(--surface-2);overflow:hidden}#view-box .bx-bar i{display:block;height:100%;width:0;background:var(--orange);transition:width .25s linear}"+
"#view-box .bx-name{font-size:22px;font-weight:800}#view-box .bx-tip{font-size:15px;color:var(--muted-2);max-width:480px}#view-box .bx-next{font-size:12.5px;color:var(--muted)}"+
"#view-box .bx-vid{display:block;width:100%;max-width:300px;margin:0 auto;border-radius:12px;background:#000}"+
".bx-ov .bx-list{padding-left:20px;display:flex;flex-direction:column;gap:5px;font-size:14px}.bx-ov h3{font-size:20px}.bx-ov .eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--orange);font-weight:700}"+
".bx-ov{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}"+
".bx-modal{background:var(--surface-solid,#121612);border:1px solid var(--line);border-radius:18px;padding:22px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:12px;color:var(--text)}.bx-modal.bx-wide{max-width:520px;max-height:92vh;overflow:auto}"+
".bx-chk{display:flex;gap:10px;align-items:center;font-size:14px}.bx-in{width:100%;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--field-bg,#0f130f);color:var(--text);font-size:15px}"+
".bx-err,.bx-msg{font-size:13px;color:#ffb199;min-height:16px}.bx-msg{color:var(--amber,#c4f07a)}"+
".bx-full{padding:0;background:#050a10}.bx-vis{position:relative;width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px;color:#fff;overflow:hidden}"+
".bx-vis.ok{background:#0a2a14}.bx-vis.no{background:#2a1010}.bx-stripes{position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.06) 0 28px,transparent 28px 56px);background-size:200% 100%;animation:bxmove 3s linear infinite}@keyframes bxmove{to{background-position:112px 0}}"+
".bx-vis>*{position:relative}.bx-brand{letter-spacing:6px;font-weight:800;font-size:14px;color:#c4f07a}.bx-vname{font-size:clamp(28px,8vw,48px);font-weight:900}.bx-vstat{font-size:18px;font-weight:700}.bx-clock{font-size:clamp(54px,18vw,110px);font-weight:900;font-variant-numeric:tabular-nums}.bx-date{font-size:16px}.bx-code{font-family:monospace;font-size:15px;opacity:.8}.bx-vhint{font-size:14px;opacity:.85;max-width:380px}";
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
var rut=document.getElementById("view-rutinas"),tog=document.getElementById("modeToggle");
if(!rut||!tog)return;
st.textContent+="#view-rutinas.bx-on>*:not(.section-head):not(#modeToggle):not(#view-box){display:none!important}#view-rutinas:not(.bx-on) #view-box{display:none}#view-rutinas.bx-on #exCountPill{display:none}";
var sec=document.createElement("div");sec.id="view-box";
tog.insertAdjacentElement("afterend",sec);
var bb=document.createElement("button");bb.className="mode-btn";bb.type="button";bb.setAttribute("data-box","1");bb.title="Box";bb.textContent="\uD83E\uDD4A Box";
tog.appendChild(bb);
function abrir(){
  boxOn=true;rut.classList.add("bx-on");
  tog.querySelectorAll(".mode-btn").forEach(function(b){b.classList.toggle("active",b===bb)});
  leerNube();pintar();
}
function cerrar(){if(!boxOn)return;if(E.run)detener();boxOn=false;rut.classList.remove("bx-on");bb.classList.remove("active")}
bb.addEventListener("click",abrir);
tog.addEventListener("click",function(e){if(e.target.closest("[data-mode]"))cerrar()});
try{new MutationObserver(function(){if(!rut.classList.contains("active"))cerrar()}).observe(rut,{attributes:true,attributeFilter:["class"]})}catch(e){}
window.addEventListener("hashchange",function(){if(location.hash==="#box"){try{go("rutinas")}catch(e){}abrir()}});
window.FORJABox={pintar:pintar,acceso:acceso,abrir:abrir,_cfg:BOX};
if(location.hash==="#box"){try{go("rutinas")}catch(e){}abrir()}
})();
