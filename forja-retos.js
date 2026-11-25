/*
 * FORJA · Retos y medallas
 * Lee las series reales del usuario (series, prs) y calcula nivel, racha, retos y medallas.
 * No escribe en las series. Solo guarda los retos reclamados (forja_retos) con save()/load() de la app.
 * Se carga al final de index.html: <script src="forja-retos.js"></script>
 */
(function(){
"use strict";
if(window.FORJARetos||!document.getElementById("view-progreso"))return;
var CSS="#view-retos .rt-wrap{display:flex;flex-direction:column;gap:14px;max-width:760px}\n#view-retos .rt-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:18px;min-width:0}\n#view-retos .rt-hero{background:var(--molten-soft)}\n#view-retos h3{font-size:18px;margin:0}\n#view-retos .sub{color:var(--muted);font-size:13px;margin:0}\n#view-retos .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}\n#view-retos .between{justify-content:space-between}\n#view-retos .grow{flex:1;min-width:0}\n#view-retos .lvl{display:flex;gap:14px;align-items:center}\n#view-retos .badge{width:62px;height:62px;border-radius:50%;background:var(--molten);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#06120a;flex:none}\n#view-retos .rt-bar{height:10px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin:8px 0}\n#view-retos .rt-bar>i{display:block;height:100%;background:var(--molten);border-radius:99px;transition:width .4s}\n#view-retos .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}\n#view-retos .stat{background:rgba(255,255,255,.06);border-radius:12px;padding:10px;text-align:center}\n#view-retos .stat b{display:block;font-size:22px;font-variant-numeric:tabular-nums}\n#view-retos .stat span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em}\n#view-retos .week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:14px}\n#view-retos .day{text-align:center;font-size:11px;color:var(--muted)}\n#view-retos .dot{margin:4px auto 0;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px}\n#view-retos .dot.on{background:var(--molten);border-color:transparent;color:#06120a;font-weight:800}\n#view-retos .dot.rest{border-style:dashed}\n#view-retos .dot.today{border-color:var(--orange)}\n#view-retos .rt-tabs{display:flex;gap:6px;flex-wrap:wrap}\n#view-retos .rt-tabs button,#view-retos .btn{border:1px solid var(--line);background:var(--surface);color:var(--text);padding:9px 14px;border-radius:10px;cursor:pointer;font:inherit;font-weight:600}\n#view-retos .rt-tabs button[aria-pressed=\"true\"]{background:var(--molten);color:#06120a;border-color:transparent}\n#view-retos .btn.pri{background:var(--molten);color:#06120a;border-color:transparent}\n#view-retos .msg{min-height:1.3em;font-size:14px;margin:8px 0 0;color:var(--green)}\n#view-retos .reto{display:flex;flex-direction:column;gap:6px}\n#view-retos .pill{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid var(--line);color:var(--muted)}\n#view-retos .pill.done{color:var(--green);border-color:var(--green)}\n#view-retos .num{font-variant-numeric:tabular-nums}\n#view-retos .chart{width:100%;height:auto;display:block}\n#view-retos .chart text{fill:var(--muted);font:11px sans-serif}\n#view-retos .list{list-style:none;margin:8px 0 0;padding:0}\n#view-retos .list li{display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}\n#view-retos .list li:last-child{border-bottom:0}\n#view-retos select{background:var(--field-bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:9px 10px;font:inherit;max-width:100%}\n#view-retos .medals{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px}\n#view-retos .medal{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:14px;padding:14px 8px 12px;text-align:center;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px}\n#view-retos .medal .mbox{width:92px;max-width:100%}\n#view-retos .medal svg{width:100%;height:auto;display:block}\n#view-retos .medal.on .mbox{filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}\n#view-retos .medal b{display:block;font-size:14px;text-transform:uppercase;letter-spacing:.04em;margin-top:6px}\n#view-retos .medal span{font-size:12px;color:var(--muted)}\n#view-retos .medal.off b{color:var(--muted)}\n@media(prefers-reduced-motion:reduce){#view-retos .rt-bar>i{transition:none}}";
var MAPA={"Flexiones inclinadas (manos en banca)": "pecho", "Flexiones con rodillas apoyadas": "pecho", "Fondos en banca con rodillas dobladas": "pecho", "Plancha alta (brazos estirados)": "pecho", "Colgado en barra (hold)": "espalda", "Remo australiano (barra a la altura del pecho)": "espalda", "Dominada negativa (bajar lento)": "espalda", "Superman en el piso": "espalda", "Flexión en pica con manos en banca": "hombro", "Plancha con toque de hombro (rodillas)": "hombro", "Pájaros en barra (a la altura del pecho)": "hombro", "Elevaciones Y-T boca abajo": "hombro", "Curl australiano (barra a la altura del pecho)": "brazo", "Chin-up negativa (bajar lento)": "brazo", "Flexiones diamante con rodillas": "brazo", "Sentadilla a la banca": "pierna", "Zancada atrás agarrado de la barra": "pierna", "Step-up en escalón bajo": "pierna", "Puente de glúteo": "pierna", "Elevación de pantorrilla en escalón": "pierna", "Plancha en antebrazos": "pierna", "Bicho muerto (dead bug)": "pierna", "Rodillas al pecho sentado en banca": "pierna", "Plancha lateral con rodilla apoyada": "pierna", "Flexiones clásicas": "pecho", "Flexiones con pies en banca": "pecho", "Fondos en paralelas (inclinado al frente)": "pecho", "Flexiones en barra baja": "pecho", "Flexiones diamante": "pecho", "Dominadas agarre prono": "espalda", "Remo australiano en barra baja": "espalda", "Dominadas supinas (chin-ups)": "espalda", "Colgado activo en barra (scapular pull)": "espalda", "Pike push-ups (flexión en pica)": "hombro", "Plancha con toque de hombro": "hombro", "Pájaros en barra baja (deltoide posterior)": "hombro", "Fondos en paralelas (torso vertical)": "hombro", "Flexiones lentas (tempo 3 seg)": "hombro", "Chin-ups agarre cerrado (bíceps)": "brazo", "Fondos en banca (tríceps)": "brazo", "Curl de bíceps en barra baja (australiano)": "brazo", "Fondos en paralelas (tríceps)": "brazo", "Sentadilla libre": "pierna", "Zancadas caminando": "pierna", "Step-ups en banca": "pierna", "Sentadilla búlgara en banca": "pierna", "Rodillas al pecho colgado": "pierna", "Plancha (plank)": "pierna", "Mountain climbers": "pierna", "Hollow body con piernas dobladas": "pierna", "Plancha lateral": "pierna", "Fondos en paralelas profundos (tempo 3 seg)": "pecho", "Flexiones arqueras": "pecho", "Flexiones pseudo planche (manos a la cadera)": "pecho", "Flexiones explosivas (con palmada)": "pecho", "Dominadas agarre ancho": "espalda", "Dominadas arqueras": "espalda", "Dominadas en L (L-sit pull-up)": "espalda", "Remo australiano con pies en banca": "espalda", "Front lever recogido (tuck hold)": "espalda", "Flexión en pica con pies en banca": "hombro", "Flexión en parada de manos contra pared (negativa)": "hombro", "Parada de manos contra pared (hold)": "hombro", "Pseudo planche lean (hold)": "hombro", "Extensión de tríceps en barra baja": "brazo", "Pistol squat asistida (barra)": "pierna", "Sentadilla con salto": "pierna", "Shrimp squat asistida": "pierna", "Elevación de pantorrilla en escalón (1 pierna)": "pierna", "Elevación de piernas colgado": "pierna", "L-sit en paralelas": "pierna", "Windshield wipers colgado (oblicuos)": "pierna", "Dragon flag en banca (negativas)": "pierna", "Hollow body hold": "pierna", "Press de banca con barra (pesado)": "pecho", "Press inclinado con barra": "pecho", "Press con mancuernas en banco plano": "pecho", "Fondos en paralelas con lastre": "pecho", "Aperturas con mancuernas en banco inclinado": "pecho", "Cruce de poleas (pesado)": "pecho", "Curl de bíceps con barra (pesado)": "brazo", "Curl martillo con mancuernas": "brazo", "Press francés con barra Z": "brazo", "Curl predicador (banca Scott)": "brazo", "Press cerrado en banca": "brazo", "Curl sentado en banco inclinado con mancuernas": "brazo", "Sentadilla con barra (pesada)": "pierna", "Prensa de pierna": "pierna", "Peso muerto rumano": "pierna", "Hack squat": "pierna", "Extensión de cuádriceps": "pierna", "Elevación de pantorrilla de pie": "pierna", "Press militar con barra (pesado)": "hombro", "Press Arnold con mancuernas": "hombro", "Elevaciones laterales": "hombro", "Remo al mentón con barra": "hombro", "Face pull en polea": "hombro", "Press tras nuca (controlado)": "hombro", "Peso muerto convencional": "espalda", "Dominadas con lastre": "espalda", "Remo con barra pesado": "espalda", "Remo en polea baja": "espalda", "Jalón al pecho agarre ancho": "espalda", "Pullover con mancuerna": "espalda", "Elevación de piernas colgado con lastre": "abs", "Crunch en polea alta": "abs", "Plancha con peso": "abs", "Rueda abdominal (ab wheel)": "abs", "Woodchopper en polea": "abs", "Sit-up con disco": "abs", "Press de banca con barra (media carga, ritmo)": "pecho", "Superserie: press inclinado mancuernas + aperturas": "pecho", "Aperturas en peck deck (ritmo alto)": "pecho", "Cruce de poleas (bombeo)": "pecho", "Flexiones al fallo (finisher)": "pecho", "Superserie: curl mancuernas + extensión en polea": "brazo", "Curl martillo (ritmo alto)": "brazo", "Extensión de tríceps en polea (cuerda)": "brazo", "Curl en banco inclinado": "brazo", "Patada de tríceps": "brazo", "Fondos entre bancas (al fallo)": "brazo", "Sentadilla (media carga, ritmo)": "pierna", "Zancadas caminando con mancuernas": "pierna", "Prensa a una pierna": "pierna", "Extensión de cuádriceps (dropset)": "pierna", "Curl femoral tumbado": "pierna", "Sentadilla con salto (finisher)": "pierna", "Press de hombro con mancuernas (ritmo)": "hombro", "Superserie: laterales + frontales": "hombro", "Elevaciones laterales en polea": "hombro", "Pájaros (deltoide posterior)": "hombro", "Face pull": "hombro", "Circuito de hombro con banda": "hombro", "Jalón al pecho (ritmo alto)": "espalda", "Remo en máquina": "espalda", "Remo en polea baja (agarre estrecho)": "espalda", "Pull-over en polea": "espalda", "Remo unilateral con mancuerna": "espalda", "Superman con banda (finisher)": "espalda", "Circuito: crunch + bicicleta + plancha": "abs", "Russian twist con disco": "abs", "Elevación de piernas": "abs", "Burpees (finisher)": "abs", "Flexiones lastradas (mochila cargada)": "pecho", "Flexiones con pies muy elevados": "pecho", "Flexiones diamante lentas (tempo 3s)": "pecho", "Press de pecho con mancuernas o ladrillos": "pecho", "Cristos con mancuernas (totalmente acostado)": "pecho", "Press inclinado en silla con mancuernas o ladrillos": "pecho", "Cristos inclinados en silla con mancuernas": "pecho", "Press militar con mochila (respaldo muy inclinado)": "pecho", "Dominadas (barra o puerta resistente)": "espalda", "Remo con mochila muy cargada": "espalda", "Remo invertido bajo mesa (pies elevados)": "espalda", "Remo a una mano pesado": "espalda", "Peso muerto rumano con mochila": "espalda", "Press militar con ladrillos": "hombro", "Elevaciones laterales con ladrillos": "hombro", "Elevaciones frontales con ladrillos": "hombro", "Pájaros con ladrillos (deltoide posterior)": "hombro", "Remo al mentón con mochila": "hombro", "Elevación de piernas con pausa": "hombro", "Rueda abdominal / deslizamiento con trapo": "hombro", "Plancha con mochila": "hombro", "Crunch con peso (botella/mochila)": "hombro", "V-ups": "hombro", "Hollow hold": "hombro", "Curl de bíceps con mochila cargada": "brazo", "Curl martillo con mochila cargada": "brazo", "Fondos de tríceps en silla con lastre": "brazo", "Curl sentado alternado": "brazo", "Curl concentrado con botella pesada": "brazo", "Extensión de tríceps con mochila (nuca)": "brazo", "Sentadilla búlgara con mochila": "pierna", "Sentadilla con mochila cargada": "pierna", "Peso muerto rumano a una pierna con botella": "pierna", "Zancadas con carga": "pierna", "Puente de glúteo con peso (pausa)": "pierna", "Elevación de pantorrilla con carga": "pierna", "Flexiones estándar (ritmo alto)": "pecho", "Superserie: inclinadas + declinadas": "pecho", "Flexiones explosivas": "pecho", "Aperturas con botellas ligeras": "pecho", "Remo con mochila (ritmo)": "espalda", "Superman dinámico": "espalda", "Remo invertido bajo mesa": "espalda", "Pull-apart con banda/toalla": "espalda", "Remo a una mano rápido": "espalda", "Buenos días con mochila ligera": "espalda", "Press de hombro con botellas (ritmo)": "hombro", "Pike push-ups": "hombro", "Círculos de brazos con botellas": "hombro", "Pájaros con botellas": "hombro", "Russian twist con botella": "hombro", "Superserie: curl botellas + fondos silla": "brazo", "Curl martillo rápido": "brazo", "Extensión de tríceps con botella": "brazo", "Fondos de tríceps en silla (al fallo)": "brazo", "Curl concentrado ligero": "brazo", "Sentadillas (ritmo alto)": "pierna", "Sentadilla búlgara": "pierna", "Puente de glúteo (reps altas)": "pierna", "Sentadilla isométrica en pared": "pierna"};
var NIVELES=[[0,"Hierro"],[300,"Bronce"],[700,"Acero"],[1200,"Titanio"],[1800,"Obsidiana"],[2600,"Espartano"],[3600,"Titán"]];
var GNOM={pecho:"Pecho",espalda:"Espalda",hombro:"Hombro",brazo:"Brazo",pierna:"Pierna",abs:"Abdomen"};
var UMBRAL=[[30,"oro"],[15,"plata"],[5,"bronce"]];
var tab="retos",msg=null,ejSel=null;

function h(tag,p,kids){var e=document.createElement(tag);for(var k in p||{}){if(k==="text")e.textContent=p[k];else if(k==="class")e.className=p[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),p[k]);else if(p[k]!==false&&p[k]!=null)e.setAttribute(k,p[k]===true?"":p[k])}(kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==="string"?document.createTextNode(c):c)});return e}
var NS="http://www.w3.org/2000/svg";
function sv(tag,a,txt){var e=document.createElementNS(NS,tag);for(var k in a||{})e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e}
function bar(v,m,label){var pct=Math.max(0,Math.min(100,m?v/m*100:0));var b=h("div",{class:"rt-bar",role:"progressbar","aria-label":label,"aria-valuemin":"0","aria-valuemax":String(m),"aria-valuenow":String(Math.max(0,Math.min(v,m)))});var i=h("i");i.style.width=pct+"%";b.appendChild(i);return b}
function fmt(n){return Number(n).toLocaleString("es-MX")}

/* ---------- datos reales ---------- */
function SER(){try{return (typeof series!=="undefined"&&series)||{}}catch(e){return {}}}
function grupoDe(n){
  if(MAPA[n])return MAPA[n];
  var s=String(n).toLowerCase();
  if(/abdom|crunch|plancha|rueda|sit-?up|elevaci[oó]n de piernas|woodchop/.test(s))return "abs";
  if(/pecho|press de banca|apertura|flexion|cruce|fondos/.test(s))return "pecho";
  if(/remo|jal[oó]n|dominada|espalda|peso muerto|pullover/.test(s))return "espalda";
  if(/hombro|militar|lateral|vuelo|elevaci[oó]n/.test(s))return "hombro";
  if(/curl|b[ií]ceps|tr[ií]ceps|martillo|brazo|patada/.test(s))return "brazo";
  if(/sentadilla|pierna|zancada|prensa|gl[uú]teo|femoral|cu[aá]driceps|pantorrilla|hip thrust/.test(s))return "pierna";
  return null;
}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function offKey(o){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return iso(d)}
function esFin(o){var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);var w=d.getDay();return w===0||w===6}
function num(x){x=Number(x);return isFinite(x)?x:0}
function calc(){
  var S=SER(),fechas=Object.keys(S).sort(),ent={},sesEj={},grDias={},nSeries=0,prs=0,xp=0,maxEj={},repsPorDia={};
  fechas.forEach(function(f){
    var dia=S[f]||{},hubo=false;
    Object.keys(dia).forEach(function(ex){
      var sets=dia[ex]||[];if(!sets.length)return;
      hubo=true;
      var g=grupoDe(ex);if(g){(grDias[g]=grDias[g]||{})[f]=1}
      var mejorDia=0,repsMejor=0,prev=maxEj[ex]||0,huboPR=false;
      sets.forEach(function(s){
        var p=num(s.p),r=num(s.r);nSeries++;xp+=10;
        repsPorDia[f]=(repsPorDia[f]||0)+r;
        if(p>mejorDia||(p===mejorDia&&r>repsMejor)){mejorDia=p;repsMejor=r}
        if(prev>0&&p>prev&&!huboPR){huboPR=true}
      });
      if(huboPR){prs++;xp+=50}
      if(mejorDia>prev)maxEj[ex]=mejorDia;
      (sesEj[ex]=sesEj[ex]||[]).push({f:f,p:mejorDia,r:repsMejor});
    });
    if(hubo){ent[f]=1;xp+=100}
  });
  var rec=recl();Object.keys(rec).forEach(function(k){if(rec[k]&&RETOXP[k])xp+=RETOXP[k]});
  var r=0;for(var o=0;o>-120;o--){var k=offKey(o);if(esFin(o))continue;if(ent[k])r++;else if(o===0)continue;else break}
  var d30=0,reps30=0;for(var o2=0;o2>-30;o2--){var k2=offKey(o2);if(ent[k2])d30++;reps30+=repsPorDia[k2]||0}
  var gr={};Object.keys(GNOM).forEach(function(g){gr[g]=grDias[g]?Object.keys(grDias[g]).length:0});
  var estrella=null;Object.keys(sesEj).forEach(function(ex){if(!estrella||sesEj[ex].length>sesEj[estrella].length)estrella=ex});
  var gan=0,ini=0;if(estrella){var a=sesEj[estrella];ini=a[0].p;gan=(maxEj[estrella]||0)-ini}
  var n=0;for(var i=0;i<NIVELES.length;i++)if(xp>=NIVELES[i][0])n=i;
  var sig=NIVELES[n+1];
  return {xp:xp,n:n,nombre:NIVELES[n][1],desde:NIVELES[n][0],hasta:sig?sig[0]:null,sigNombre:sig?sig[1]:null,
    racha:r,d30:d30,reps30:reps30,ent:ent,gr:gr,sesEj:sesEj,maxEj:maxEj,nSeries:nSeries,prs:prs,
    estrella:estrella,gan:gan,ini:ini,dias:fechas.length};
}
var RETOXP={const:150,racha:200,fuerza:250,reps:200};
function recl(){try{return (typeof load==="function"?load("forja_retos",{}):{})||{}}catch(e){return {}}}
function guardarRecl(o){try{if(typeof save==="function")save("forja_retos",o)}catch(e){}}
function tierG(C,g){var n=C.gr[g];for(var i=0;i<UMBRAL.length;i++)if(n>=UMBRAL[i][0])return UMBRAL[i][1];return null}
function fmtF(f){var p=f.split("-");return p[2]+"/"+p[1]}

function retos(C){
  return [
    {id:"const",t:"Constancia de 30 días",d:"Entrena 18 días en los últimos 30.",v:C.d30,m:18,u:"días",xp:150},
    {id:"racha",t:"Racha de 10",d:"Entrena 10 días hábiles seguidos.",v:C.racha,m:10,u:"días",xp:200},
    {id:"fuerza",t:"+10 kg en tu ejercicio estrella",d:C.estrella?"Sube 10 kg desde tu primer registro en "+C.estrella+" ("+C.ini+" kg).":"Registra series para elegir tu ejercicio estrella.",v:Math.max(0,C.gan),m:10,u:"kg",xp:250},
    {id:"reps",t:"1,500 repeticiones",d:"Suma repeticiones de todos tus ejercicios en 30 días.",v:C.reps30,m:1500,u:"reps",xp:200}
  ];
}

/* ---------- gráfica ---------- */
function grafica(C,ex){
  var d=C.sesEj[ex].slice(-12),W=320,H=190,pl=34,pr=10,pt=26,pb=56;
  var ws=d.map(function(s){return s.p}),mn=Math.min.apply(null,ws),mx=Math.max.apply(null,ws);
  var lo=Math.max(0,Math.floor(mn*0.85)),hi=Math.ceil(mx*1.1);if(hi<=lo)hi=lo+1;
  var mr=Math.max(1,Math.max.apply(null,d.map(function(s){return s.r})));
  var x=function(i){return pl+(d.length===1?(W-pl-pr)/2:i*(W-pl-pr)/(d.length-1))};
  var y=function(v){return pt+(hi-v)/(hi-lo)*(H-pt-pb)};
  var s=sv("svg",{viewBox:"0 0 "+W+" "+H,"class":"chart",role:"img","aria-label":"Peso por sesión de "+ex});
  [0,.5,1].forEach(function(f){var v=lo+(hi-lo)*f,yy=y(v);s.appendChild(sv("line",{x1:pl,x2:W-pr,y1:yy,y2:yy,stroke:"#3B4138","stroke-width":1}));s.appendChild(sv("text",{x:pl-6,y:yy+4,"text-anchor":"end"},String(Math.round(v))))});
  s.appendChild(sv("text",{x:pl-6,y:10,"text-anchor":"end"},"kg"));
  s.appendChild(sv("polyline",{points:d.map(function(q,i){return x(i)+","+y(q.p)}).join(" "),fill:"none",stroke:"#8EE04A","stroke-width":2.5,"stroke-linejoin":"round"}));
  var rec=0;
  d.forEach(function(q,i){
    var esPR=q.p>rec;if(esPR)rec=q.p;
    s.appendChild(sv("circle",{cx:x(i),cy:y(q.p),r:esPR?5:3.5,fill:esPR?"#FFC247":"#8EE04A",stroke:"#050A10","stroke-width":1.5}));
    var bh=q.r/mr*28;
    s.appendChild(sv("rect",{x:x(i)-4,y:H-pb+22+(28-bh),width:8,height:bh,rx:2,fill:"#C4F07A",opacity:.8}));
  });
  s.appendChild(sv("text",{x:pl-6,y:H-pb+40,"text-anchor":"end"},"reps"));
  s.appendChild(sv("text",{x:x(0),y:H-pb+14,"text-anchor":"start"},fmtF(d[0].f)));
  s.appendChild(sv("text",{x:x(d.length-1),y:H-pb+14,"text-anchor":"end"},fmtF(d[d.length-1].f)));
  return s;
}

/* ---------- medallas ---------- */
var TIER={
  bronce:["#ffbf8a","#c8662d","#6e2f0e","Bronce","#2b1105"],
  plata:["#f4f6fa","#a9b3c2","#566073","Plata","#1b2230"],
  oro:["#ffe69a","#ffc247","#a8680c","Oro","#2e1c02"],
  obsidiana:["#6b5a72","#2c2432","#0e0d0f","Obsidiana","#ffc247"]
};
var GLIFO={
  yunque:'<path d="M30 58h34c8 0 8 6 6 8-3 3-8 3-12 3l-3 4v5h8v4H35v-4h8v-5l-3-4c-6 0-9-3-10-7z"/>',
  llama:'<path d="M50 47c3 9 13 13 13 25a13 13 0 0 1-26 0c0-7 4-10 7-16 2 4 5 5 7 2 0-4-3-7-1-11z"/><path d="M50 70c2 4 6 6 6 10a6 6 0 0 1-12 0c0-3 3-5 6-10z" fill-opacity=".45" style="fill:#fff"/>',
  rayo:'<path d="M56 48L36 72h12l-5 18 22-26H52z"/>',
  grados:'<path d="M34 64l16-11 16 11v7L50 60 34 71z"/><path d="M34 77l16-11 16 11v7L50 73 34 84z"/>',
  escudo:'<path d="M50 50l17 6v12c0 11-7 17-17 21-10-4-17-10-17-21V56z"/><path d="M41 69l7 7 12-14" fill="none" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:#fff;stroke-opacity:.9"/>',
  pesa:'<rect x="29" y="55" width="7" height="22" rx="2"/><rect x="38" y="59" width="5" height="14" rx="1.5"/><rect x="43" y="64" width="14" height="4" rx="1.5"/><rect x="57" y="59" width="5" height="14" rx="1.5"/><rect x="64" y="55" width="7" height="22" rx="2"/><path d="M50 50l-6 7h12z"/>',
  pecho:'<path d="M31 58c0-5 9-7 18-3v24c-9 4-18 2-18-4z"/><path d="M69 58c0-5-9-7-18-3v24c9 4 18 2 18-4z"/>',
  espalda:'<path d="M29 54l21 7 21-7-4 24-17 9-17-9z"/><path d="M50 61v26" stroke-width="2.5" style="stroke:#0e0d0f;stroke-opacity:.45"/>',
  hombro:'<path d="M27 84c0-19 10-31 23-31s23 12 23 31z"/><path d="M36 76c2-9 7-14 14-14" fill="none" stroke-width="3" stroke-linecap="round" style="stroke:#fff;stroke-opacity:.5"/>',
  brazo:'<rect x="32" y="53" width="36" height="29" rx="9"/><rect x="38" y="82" width="24" height="8" rx="2"/><path d="M41 54v13M50 54v13M59 54v13" fill="none" stroke-width="2.2" stroke-linecap="round" style="stroke:#0e0d0f;stroke-opacity:.45"/><path d="M36 74c4 3 10 4 16 3" fill="none" stroke-width="2.5" stroke-linecap="round" style="stroke:#fff;stroke-opacity:.4"/>',
  pierna:'<path d="M37 50h26l-3 25 3 15H55l-5-13-5 13h-8l3-15z"/><path d="M50 52v18" stroke-width="2" style="stroke:#0e0d0f;stroke-opacity:.4"/>',
  abs:'<rect x="36" y="52" width="12" height="10" rx="3"/><rect x="52" y="52" width="12" height="10" rx="3"/><rect x="36" y="65" width="12" height="10" rx="3"/><rect x="52" y="65" width="12" height="10" rx="3"/><rect x="37" y="78" width="11" height="10" rx="3"/><rect x="52" y="78" width="11" height="10" rx="3"/>',
  casco:'<path d="M34 80V68c0-9 7-16 16-16s16 7 16 16v12h-8l-2-8h-12l-2 8z"/><path d="M40 51c3-9 17-9 20 0-6-3-14-3-20 0z" style="fill:#e0245e"/><rect x="41" y="64" width="18" height="3.5" rx="1" style="fill:#0e0d0f"/>'
};
var C0=null;
var MEDALLAS=[
  {id:"serie",t:"Primera serie",d:"Registra una serie",g:"yunque",tier:"bronce",forma:"circ",ok:function(){return C0.nSeries>0}},
  {id:"r3",t:"Racha de 3",d:"3 días hábiles seguidos",g:"llama",tier:"bronce",forma:"hex",ok:function(){return C0.racha>=3}},
  {id:"r7",t:"Racha de 7",d:"7 días hábiles seguidos",g:"llama",tier:"plata",forma:"hex",ok:function(){return C0.racha>=7}},
  {id:"pr",t:"Primer récord",d:"Rompe tu mejor peso",g:"rayo",tier:"oro",forma:"circ",ok:function(){return C0.prs>0}},
  {id:"ti",t:"Titanio",d:"Llega al nivel 4",g:"grados",tier:"plata",forma:"escu",ok:function(){return C0.n>=3}},
  {id:"con",t:"Constante",d:"18 días en 30",g:"escudo",tier:"plata",forma:"escu",ok:function(){return C0.d30>=18}},
  {id:"p10",t:"Fuerza +10",d:"Sube 10 kg en un ejercicio",g:"pesa",tier:"oro",forma:"hex",ok:function(){return C0.gan>=10}},
  {id:"esp",t:"Espartano",d:"Llega al nivel 6",g:"casco",tier:"obsidiana",forma:"escu",ok:function(){return C0.n>=5}}
];
var mid=0;
function medalla(m){
  var tr=m.dyn?m.dyn():m.tier,on=m.dyn?tr!==null:m.ok(),T=TIER[tr||"bronce"],id="m"+(++mid);
  var forma={circ:'<circle cx="50" cy="66" r="35"/>',hex:'<path d="M50 29l31 18v38L50 103 19 85V47z"/>',escu:'<path d="M50 29l33 11v26c0 20-14 33-33 40-19-7-33-20-33-40V40z"/>'}[m.forma];
  var inner={circ:'<circle cx="50" cy="66" r="29"/>',hex:'<path d="M50 36l25 14.5v31L50 96 25 81.5v-31z"/>',escu:'<path d="M50 36l27 9v21c0 16-11 27-27 33-16-6-27-17-27-33V45z"/>'}[m.forma];
  var c1=on?T[0]:"#3a343d",c2=on?T[1]:"#2a252d",c3=on?T[2]:"#1f1b22",gl=on?T[4]:"#5a535c";
  var rib=on?"#e0245e":"#3a343d";
  var svg='<svg viewBox="0 0 100 112" aria-hidden="true">'+
   '<defs><linearGradient id="'+id+'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset=".55" stop-color="'+c2+'"/><stop offset="1" stop-color="'+c3+'"/></linearGradient>'+
   '<linearGradient id="'+id+'b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c3+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient>'+
   '<linearGradient id="'+id+'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+(on?"#ff6a1a":"#4a444c")+'"/><stop offset="1" stop-color="'+rib+'"/></linearGradient>'+
   '<linearGradient id="'+id+'s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+
   '<path d="M27 2h19l13 40H40z" fill="url(#'+id+'r)"/><path d="M73 2H54L41 42h19z" fill="url(#'+id+'r)" opacity=".85"/>'+
   '<g fill="url(#'+id+'a)" stroke="'+(on?T[0]:"#4a444c")+'" stroke-width="2" stroke-linejoin="round">'+forma+'</g>'+
   '<g fill="url(#'+id+'b)" stroke="'+(on?T[2]:"#2a252d")+'" stroke-width="1.5" stroke-linejoin="round">'+inner+'</g>'+
   '<g fill="'+gl+'" stroke="none">'+GLIFO[m.g]+'</g>'+
   (on?'<g fill="url(#'+id+'s)">'+forma+'</g>':'')+
   (on?'':'<g transform="translate(62 82)"><circle cx="11" cy="11" r="11" fill="#171518" stroke="#3a343d"/><rect x="6" y="10" width="10" height="8" rx="1.5" fill="#a79fa6"/><path d="M8 10V8a3 3 0 0 1 6 0v2" fill="none" stroke="#a79fa6" stroke-width="1.8"/></g>')+
   '</svg>';
  var el=h("div",{class:"medal"+(on?" on t-"+tr:" off")});
  var box=h("div",{class:"mbox"});box.innerHTML=svg; // SVG armado solo con constantes del código
  el.appendChild(box);
  el.appendChild(h("b",{text:m.t}));
  el.appendChild(h("span",{text:m.sub?m.sub():(on?T[3]+" · conseguida":m.d)}));
  return el;
}
var FORMAS={pecho:"circ",espalda:"hex",hombro:"circ",brazo:"escu",pierna:"hex",abs:"escu"};
var MEDALLAS_G=Object.keys(GNOM).map(function(g){
  return {id:"g-"+g,t:GNOM[g],g:g,forma:FORMAS[g],
    dyn:function(){return tierG(C0,g)},
    sub:function(){
      var n=C0.gr[g],t=tierG(C0,g),sig=null;
      for(var i=UMBRAL.length-1;i>=0;i--)if(n<UMBRAL[i][0]){sig=UMBRAL[i];break}
      var nom=t?TIER[t][3]+" · "+n+" sesiones":n+" de 5 sesiones";
      return sig&&t?nom+" · "+(sig[0]-n)+" para "+TIER[sig[1]][3]:nom
    }};
});

/* ---------- vistas ---------- */
function hero(C){
  var box=h("section",{"class":"rt-card rt-hero","aria-label":"Tu nivel"});
  box.appendChild(h("div",{"class":"lvl"},[
    h("div",{"class":"badge","aria-hidden":"true",text:String(C.n+1)}),
    h("div",{"class":"grow"},[
      h("div",{"class":"row between"},[h("h3",{text:"Nivel "+(C.n+1)+" · "+C.nombre}),h("span",{"class":"num sub",text:fmt(C.xp)+" XP"})]),
      C.hasta?bar(C.xp-C.desde,C.hasta-C.desde,"Avance al siguiente nivel"):bar(1,1,"Nivel máximo"),
      h("p",{"class":"sub",text:C.hasta?"Te faltan "+fmt(C.hasta-C.xp)+" XP para "+C.sigNombre+".":"Llegaste al nivel máximo."})
    ])
  ]));
  box.appendChild(h("div",{"class":"stats"},[
    h("div",{"class":"stat"},[h("b",{text:String(C.racha)}),h("span",{text:"Racha (días)"})]),
    h("div",{"class":"stat"},[h("b",{text:String(C.d30)}),h("span",{text:"Días en 30"})]),
    h("div",{"class":"stat"},[h("b",{text:String(C.prs)}),h("span",{text:"Récords"})])
  ]));
  var hoy=new Date(),ini=-((hoy.getDay()+6)%7),nom=["L","M","M","J","V","S","D"],w=h("div",{"class":"week","aria-label":"Esta semana"});
  for(var i=0;i<7;i++){var o=ini+i,on=C.ent[offKey(o)];
    w.appendChild(h("div",{"class":"day"},[nom[i],h("div",{"class":"dot"+(on?" on":"")+(esFin(o)&&!on?" rest":"")+(o===0?" today":""),text:on?"✓":""})]))}
  box.appendChild(w);
  box.appendChild(h("p",{"class":"sub",style:"margin-top:10px",text:"Cada serie da 10 XP, cada día de entreno 100 XP y cada récord de peso 50 XP. Sábado y domingo son descanso y no rompen la racha."}));
  return box;
}
function vistaRetos(C){
  var lista=retos(C).map(function(r){
    var hecho=r.v>=r.m,R=recl(),rec=R[r.id],acc=null;
    if(hecho&&!rec)acc=h("button",{"class":"btn pri",text:"Reclamar +"+r.xp+" XP",onclick:function(){var o=recl();o[r.id]=true;guardarRecl(o);msg="Reto cumplido: "+r.t+". +"+r.xp+" XP.";pintar()}});
    return h("article",{"class":"rt-card reto"},[
      h("div",{"class":"row between"},[h("h3",{text:r.t}),rec?h("span",{"class":"pill done",text:"Cumplido"}):h("span",{"class":"pill num",text:"+"+r.xp+" XP"})]),
      h("p",{"class":"sub",text:r.d}),
      bar(r.v,r.m,r.t),
      h("div",{"class":"row between"},[h("span",{"class":"num sub",text:fmt(Math.max(0,Math.min(r.v,r.m)))+" de "+fmt(r.m)+" "+r.u}),acc])
    ]);
  });
  var vacio=C.nSeries?null:h("section",{"class":"rt-card"},[h("p",{"class":"sub",text:"Aún no hay series registradas. Registra la primera con ⊕ Serie en tu rutina y aquí empieza tu nivel."})]);
  return h("div",{"class":"rt-wrap"},[msg?h("p",{"class":"msg",role:"status",text:msg}):null,vacio].concat(lista));
}
function vistaProgreso(C){
  var exs=Object.keys(C.sesEj).sort(function(a,b){return C.sesEj[b].length-C.sesEj[a].length});
  if(!exs.length)return h("div",{"class":"rt-wrap"},[h("section",{"class":"rt-card"},[h("p",{"class":"sub",text:"Cuando registres series verás aquí tu peso y repeticiones por ejercicio."})])]);
  if(!ejSel||!C.sesEj[ejSel])ejSel=exs[0];
  var sel=h("select",{"aria-label":"Ejercicio",onchange:function(e){ejSel=e.target.value;pintar()}},exs.map(function(e){var o=h("option",{value:e,text:e});if(e===ejSel)o.selected=true;return o}));
  var d=C.sesEj[ejSel],cambio=C.maxEj[ejSel]-d[0].p;
  var filas=d.slice().reverse().slice(0,6).map(function(q){return h("li",null,[h("span",{"class":"grow num",text:fmtF(q.f)}),h("b",{"class":"num",text:q.p+" kg × "+q.r})])});
  return h("div",{"class":"rt-wrap"},[
    h("section",{"class":"rt-card"},[h("div",{"class":"row between"},[h("h3",{text:"Mi progreso"}),sel]),
      h("div",{"class":"stats"},[
        h("div",{"class":"stat"},[h("b",{text:C.maxEj[ejSel]+" kg"}),h("span",{text:"Mejor peso"})]),
        h("div",{"class":"stat"},[h("b",{text:(cambio>=0?"+":"")+cambio+" kg"}),h("span",{text:"Desde el inicio"})]),
        h("div",{"class":"stat"},[h("b",{text:String(d.length)}),h("span",{text:"Sesiones"})])]),
      h("div",{style:"margin-top:14px"},[grafica(C,ejSel)]),
      h("p",{"class":"sub",text:"Línea verde: peso máximo de cada sesión. Punto dorado: récord. Barras: repeticiones de esa serie."})]),
    h("section",{"class":"rt-card"},[h("h3",{text:"Últimas sesiones"}),h("ul",{"class":"list"},filas)])
  ]);
}
function vistaAmigos(){
  return h("div",{"class":"rt-wrap"},[h("section",{"class":"rt-card"},[
    h("h3",{text:"Liga de amigos"}),
    h("p",{"class":"sub",style:"margin-top:8px",text:"Próximamente: compara nivel y racha con tus amigos y reta a quien quieras. Nunca se compartirán fotos ni medidas corporales."})])]);
}
function vistaMundo(){
  if(window.FORJAMundo)return window.FORJAMundo.vista();
  return h("div",{"class":"rt-wrap"},[h("section",{"class":"rt-card"},[h("h3",{text:"Mundo"}),h("p",{"class":"sub",style:"margin-top:8px",text:"Cargando…"})])]);
}
function vistaLogros(){
  var todas=MEDALLAS.concat(MEDALLAS_G);
  var n=todas.filter(function(m){return m.dyn?m.dyn()!==null:m.ok()}).length;
  return h("div",{"class":"rt-wrap"},[
    h("section",{"class":"rt-card"},[
      h("div",{"class":"row between"},[h("h3",{text:"Constancia y récords"}),h("span",{"class":"pill num",text:n+" de "+todas.length+" en total"})]),
      h("p",{"class":"sub",text:"Se ganan solas al entrenar y registrar. Las bloqueadas muestran qué falta."}),
      h("div",{"class":"medals"},MEDALLAS.map(medalla))]),
    h("section",{"class":"rt-card"},[
      h("h3",{text:"Grupos musculares"}),
      h("p",{"class":"sub",text:"Cada grupo sube de metal: bronce a 5 sesiones, plata a 15 y oro a 30."}),
      h("div",{"class":"medals"},MEDALLAS_G.map(medalla))])
  ]);
}

function pintar(){
  var sec=document.getElementById("view-retos");if(!sec)return;
  C0=calc();mid=0;
  sec.textContent="";
  sec.appendChild(h("div",{"class":"section-head"},[h("div",null,[h("span",{"class":"eyebrow",text:"Constancia, récords y medallas"}),h("h2",{text:"Retos"})])]));
  var wrap=h("div",{"class":"rt-wrap"});
  wrap.appendChild(hero(C0));
  var nav=h("div",{"class":"rt-tabs",role:"group","aria-label":"Secciones de Retos"});
  [["retos","Retos"],["progreso","Progreso"],["mundo","Mundo"],["amigos","Amigos"],["logros","Medallas"]].forEach(function(t){
    nav.appendChild(h("button",{type:"button",text:t[1],"aria-pressed":tab===t[0]?"true":"false",onclick:function(){tab=t[0];msg=null;pintar()}}));
  });
  wrap.appendChild(nav);
  wrap.appendChild({retos:vistaRetos,progreso:vistaProgreso,mundo:vistaMundo,amigos:vistaAmigos,logros:vistaLogros}[tab](C0));
  sec.appendChild(wrap);
}

/* ---------- montaje: estilo, sección y botones de navegación ---------- */
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
var sec=document.createElement("section");sec.className="view";sec.id="view-retos";
document.getElementById("view-progreso").insertAdjacentElement("afterend",sec);
var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
var navD=document.querySelector('.nav-btn[data-go="progreso"]');
if(navD){var b=document.createElement("button");b.className="nav-btn";b.setAttribute("data-go","retos");b.innerHTML=ICON+"Retos";navD.insertAdjacentElement("afterend",b);b.addEventListener("click",function(){go("retos")})}
var navM=document.querySelector('.bn-btn[data-go="progreso"]');
if(navM){var b2=document.createElement("button");b2.className="bn-btn";b2.setAttribute("data-go","retos");b2.innerHTML=ICON+"Retos";navM.insertAdjacentElement("afterend",b2);b2.addEventListener("click",function(){go("retos")})}
/* Repinta al abrir la sección y cuando cambian las series */
window.addEventListener("hashchange",function(){if(location.hash==="#retos")pintar()});
document.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest('[data-go="retos"]');if(t)setTimeout(pintar,0)});
window.FORJARetos={pintar:pintar,calc:function(){return calc()}};
/* Carga el módulo Mundo (ranking opcional) sin tocar index.html */
(function(){try{if(window.FORJAMundo)return;var sm=document.createElement("script");sm.src="forja-mundo.js?v=1";sm.async=true;sm.onload=function(){if(tab==="mundo")pintar()};document.body.appendChild(sm)}catch(e){}})();
if(location.hash==="#retos"){pintar();try{go("retos")}catch(e){}}
})();
