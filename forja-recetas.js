/* ============================================================
   FORJA — Recetas de la dieta (3 opciones por comida)
   Ficha: foto, ingredientes, pasos, tiempo y macros.
   El coach sube la foto real, un link de video y una nota
   (colección Firestore "recetas", doc = plan-comida-opción).
   ============================================================ */
(function(){
'use strict';
const LS='forja_recetas_extra';
let EXTRA=(()=>{ try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } })();
const nube=()=>{ try{ return FB_ON && fbDB && fbUser; }catch(e){ return false; } };
const coach=()=>{ try{ return coachDelUsuario(); }catch(e){ return null; } };
const docId=k=>k.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const guarda=()=>{ try{ localStorage.setItem(LS,JSON.stringify(EXTRA)); }catch(e){} };

/* R[plan][comida][opción] = {min, p, c, g, ing[], pasos[]} */
const R={
volumen:{
 'Desayuno':[
  {min:10,p:34,c:78,g:22,ing:['80 g de avena','250 ml de leche','1 plátano','3 huevos enteros','1 cda de crema de cacahuate','Canela al gusto'],
   pasos:['Calienta la leche y agrega la avena; cocina 4–5 min moviendo.','Rebana el plátano encima y agrega la crema de cacahuate y canela.','En un sartén con unas gotas de aceite, revuelve los 3 huevos a fuego medio hasta que cuajen.','Sirve la avena y los huevos juntos.']},
  {min:20,p:42,c:70,g:18,ing:['150 g de pechuga de pollo cocida y deshebrada','6 tortillas en triángulos (horneadas o doradas con poco aceite)','1 taza de salsa verde','1/2 taza de frijoles','2 tortillas para acompañar','Cebolla, cilantro y un poco de queso fresco'],
   pasos:['Hornea los triángulos de tortilla a 200 °C por 10 min hasta que estén crujientes.','Calienta la salsa verde en un sartén y agrega el pollo deshebrado.','Integra los totopos a la salsa y mezcla 1 min para que no se aguaden.','Sirve con frijoles, cebolla, cilantro y queso; acompaña con las 2 tortillas.']},
  {min:15,p:36,c:74,g:10,ing:['60 g de avena molida','1 plátano maduro','2 claras + 1 huevo (masa)','1/2 cdita de polvo para hornear','4 claras extra (aparte)','1 cda de miel','1 taza de fresas'],
   pasos:['Licúa avena, plátano, 2 claras, el huevo y el polvo para hornear.','En sartén antiadherente, vierte 1/3 de la mezcla y cocina 2 min por lado. Repite para 3 hot cakes.','Cocina las 4 claras extra revueltas con sal.','Sirve los hot cakes con miel y fresas y las claras a un lado.']}],
 'Snack AM':[
  {min:3,p:24,c:40,g:16,ing:['200 g de yogur griego natural','40 g de granola','20 g de almendras'],
   pasos:['Sirve el yogur en un bowl.','Agrega la granola y las almendras encima justo antes de comer para que queden crujientes.']},
  {min:5,p:30,c:38,g:8,ing:['1 lata de atún en agua escurrido','2 rebanadas de pan integral','1 cda de mayonesa light o yogur','Jitomate, lechuga y limón','1 manzana'],
   pasos:['Mezcla el atún con la mayonesa, limón, sal y pimienta.','Arma el sándwich con lechuga y jitomate.','Acompaña con la manzana.']},
  {min:4,p:20,c:60,g:14,ing:['300 ml de leche','1 plátano','40 g de avena','1 cda de crema de cacahuate','Hielo'],
   pasos:['Pon todo en la licuadora.','Licúa 40 segundos hasta que quede cremoso. Tómalo de inmediato.']}],
 'Comida':[
  {min:25,p:52,c:90,g:16,ing:['200 g de pechuga de pollo','1 1/2 taza de arroz cocido','2 tazas de verduras (brócoli, zanahoria, calabaza)','1 cda de aceite de oliva','Ajo, sal, pimienta y limón'],
   pasos:['Sazona la pechuga con ajo, sal, pimienta y limón; deja reposar 5 min.','Cocina en plancha caliente 5–6 min por lado hasta que esté bien cocida.','Saltea las verduras 5 min con la mitad del aceite.','Sirve con el arroz y rocía el resto del aceite.']},
  {min:25,p:50,c:72,g:22,ing:['200 g de bistec de res','250 g de papa','1/2 taza de frijoles de la olla','Cebolla, jitomate y chile para salsa','Sal y pimienta'],
   pasos:['Cuece la papa en agua con sal 15–18 min; pártela en cubos.','Sazona el bistec y cocínalo en sartén caliente 3 min por lado.','Asa jitomate, cebolla y chile y licúa para una salsa rápida.','Sirve el bistec con papa, frijoles y salsa.']},
  {min:20,p:48,c:80,g:24,ing:['200 g de salmón o tilapia','1 1/2 taza de pasta integral cocida','1/2 aguacate','1 diente de ajo','Limón, sal y pimienta','Espinaca al gusto'],
   pasos:['Cuece la pasta según el paquete.','Sazona el pescado con sal, pimienta y limón; cocínalo 4 min por lado.','Saltea el ajo y la espinaca 1 min y mézclalos con la pasta.','Sirve con el pescado encima y el aguacate en rebanadas.']}],
 'Snack PM':[
  {min:2,p:32,c:36,g:6,ing:['1 scoop de proteína','300 ml de leche','1 plátano'],
   pasos:['Mezcla la proteína con la leche en un shaker.','Acompaña con el plátano (ideal después de entrenar).']},
  {min:10,p:30,c:34,g:12,ing:['3 tostadas horneadas','120 g de pollo deshebrado','1/4 de aguacate','Lechuga, jitomate y salsa'],
   pasos:['Calienta el pollo con un poco de salsa.','Arma las tostadas con lechuga, pollo y jitomate.','Termina con el aguacate en rebanadas.']},
  {min:3,p:18,c:42,g:18,ing:['2 rebanadas de pan integral','1 1/2 cda de crema de cacahuate','1 vaso de leche (250 ml)'],
   pasos:['Tuesta el pan si quieres.','Unta la crema de cacahuate y acompaña con la leche.']}],
 'Cena':[
  {min:15,p:40,c:60,g:12,ing:['150 g de pechuga de pollo en tiras','4 tortillas de maíz','1/2 taza de frijoles','Cebolla, cilantro, limón y salsa'],
   pasos:['Sazona el pollo y cocínalo en sartén 6–8 min.','Calienta las tortillas en el comal.','Arma los tacos con cebolla, cilantro y salsa; acompaña con frijoles.']},
  {min:10,p:34,c:28,g:24,ing:['3 huevos','30 g de queso panela o Oaxaca','1 taza de espinaca','2 rebanadas de pan integral','Sal y pimienta'],
   pasos:['Bate los huevos con sal y pimienta.','Saltea la espinaca 1 min, vierte el huevo y cocina a fuego bajo.','Agrega el queso, dobla el omelette y tapa 1 min.','Sirve con el pan tostado.']},
  {min:5,p:32,c:46,g:16,ing:['1 lata de atún en agua','1 taza de arroz cocido','1/2 aguacate','Limón, sal y salsa al gusto'],
   pasos:['Escurre el atún y mézclalo con limón y sal.','Calienta el arroz y sirve el atún encima.','Agrega el aguacate y salsa al gusto.']}]
},
definicion:{
 'Desayuno':[
  {min:10,p:30,c:28,g:7,ing:['5 claras + 1 huevo','1 taza de espinaca','40 g de avena','Canela','Café negro sin azúcar'],
   pasos:['Cocina la avena con agua y canela 4 min.','Saltea la espinaca 1 min y agrega las claras y el huevo; revuelve hasta cuajar.','Sirve con el café negro.']},
  {min:10,p:28,c:26,g:12,ing:['2 huevos','60 g de pechuga de pavo en cubos','1 tortilla de maíz','1 taza de papaya','Cebolla y jitomate picados'],
   pasos:['Saltea cebolla, jitomate y pavo 2 min.','Agrega los huevos batidos y cocina a fuego bajo; dobla el omelette.','Acompaña con la tortilla caliente y la papaya.']},
  {min:3,p:22,c:24,g:6,ing:['200 g de yogur griego natural sin azúcar','1 taza de frutos rojos','1 cda de chía'],
   pasos:['Sirve el yogur en un bowl.','Agrega los frutos rojos y la chía. Déjalo 5 min para que la chía se hidrate.']}],
 'Snack AM':[
  {min:2,p:4,c:22,g:9,ing:['1 manzana','15 g de almendras (unas 12)'],
   pasos:['Lava y rebana la manzana.','Acompaña con las almendras.']},
  {min:5,p:12,c:10,g:6,ing:['1 pepino','1/2 jícama','60 g de queso panela','Limón, sal y chile en polvo'],
   pasos:['Corta pepino, jícama y panela en bastones.','Agrega limón, sal y chile en polvo al gusto.']},
  {min:2,p:24,c:3,g:1,ing:['1 scoop de proteína','300 ml de agua fría'],
   pasos:['Mezcla en un shaker 20 segundos y tómalo.']}],
 'Comida':[
  {min:25,p:44,c:38,g:8,ing:['180 g de pechuga de pollo','1/2 taza de arroz integral cocido','Ensalada verde libre (lechuga, pepino, jitomate)','Limón, ajo, sal y pimienta'],
   pasos:['Sazona la pechuga con ajo, limón, sal y pimienta.','Cocínala en plancha 5–6 min por lado.','Sirve con el arroz y la ensalada aderezada con limón.']},
  {min:20,p:42,c:30,g:6,ing:['200 g de pescado blanco (tilapia o basa)','2 dientes de ajo','1 taza de brócoli y calabaza','100 g de camote','Limón y perejil'],
   pasos:['Cuece el camote en agua o al vapor 12 min.','Dora el ajo picado con unas gotas de aceite y cocina el pescado 3–4 min por lado.','Cocina las verduras al vapor 6 min.','Sirve con limón y perejil.']},
  {min:20,p:40,c:22,g:12,ing:['160 g de carne magra (res o sirloin)','3 nopales','1/3 taza de frijoles de la olla','Sal, pimienta y salsa'],
   pasos:['Asa los nopales en el comal hasta que cambien de color.','Sazona la carne y cocínala en plancha 3 min por lado.','Sirve con los frijoles y salsa.']}],
 'Snack PM':[
  {min:2,p:24,c:3,g:1,ing:['1 scoop de proteína','300 ml de agua'],
   pasos:['Mezcla en un shaker y tómalo (ideal después de entrenar).']},
  {min:12,p:13,c:8,g:10,ing:['2 huevos','2 zanahorias en bastones'],
   pasos:['Cuece los huevos 10 min en agua hirviendo y pásalos a agua fría.','Pélalos y acompaña con la zanahoria.']},
  {min:3,p:18,c:4,g:3,ing:['4 rebanadas de pechuga de pavo','1 pepino en bastones','Mostaza o limón al gusto'],
   pasos:['Unta un poco de mostaza en cada rebanada de pavo.','Enrolla un bastón de pepino en cada una.']}],
 'Cena':[
  {min:5,p:28,c:8,g:8,ing:['1 lata de atún en agua','1 taza de verduras picadas (pepino, jitomate, cebolla)','1/4 de aguacate','Limón y sal'],
   pasos:['Escurre el atún y mézclalo con las verduras.','Agrega limón y sal; sirve con el aguacate.']},
  {min:15,p:34,c:8,g:9,ing:['150 g de pollo o res en tiras','Hojas grandes de lechuga','Pico de gallo (jitomate, cebolla, cilantro, limón)'],
   pasos:['Cocina la carne en sartén con sal y pimienta 6–8 min.','Prepara el pico de gallo.','Usa las hojas de lechuga como tortilla y arma los tacos.']},
  {min:15,p:32,c:6,g:18,ing:['150 g de salmón','1 taza de espárragos','Limón, ajo, sal y pimienta'],
   pasos:['Sazona el salmón con ajo, sal, pimienta y limón.','Cocínalo en sartén 4 min por lado (o al horno 12 min a 200 °C).','Asa los espárragos en el mismo sartén 4–5 min.']}]
}};

function get(plan,meal,i){ return (R[plan]&&R[plan][meal]&&R[plan][meal][i])||null; }
function extra(key){ return EXTRA[docId(key)]||{}; }

function escuchar(){
  if(!nube()||escuchar._on) return; escuchar._on=true;
  fbDB.collection('recetas').onSnapshot(qs=>{
    EXTRA={}; qs.docs.forEach(d=>EXTRA[d.id]=d.data()); guarda();
    try{ renderDiet(); }catch(e){}
  },()=>{});
}
setInterval(escuchar,3000); escuchar();

async function guardarExtra(key,cambios){
  const c=coach(); const id=docId(key);
  const d=Object.assign({},EXTRA[id]||{},cambios,{coachN:c?c.n:'',t:Date.now()});
  Object.keys(d).forEach(k=>{ if(d[k]===''||d[k]==null) delete d[k]; });
  if(nube()) await fbDB.collection('recetas').doc(id).set(d);
  EXTRA[id]=d; guarda();
}
function comprimir(file){
  return new Promise((ok,err)=>{
    const img=new Image(), u=URL.createObjectURL(file);
    img.onload=()=>{ const W=720, s=Math.min(1,W/img.width); const cv=document.createElement('canvas');
      cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s);
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); URL.revokeObjectURL(u);
      ok(cv.toDataURL('image/jpeg',.72)); };
    img.onerror=err; img.src=u;
  });
}

const css=document.createElement('style');
css.textContent=`
.meal-foto{height:130px;margin:12px 18px 0;border-radius:14px;background:var(--surface-2) center/cover no-repeat;border:1px solid var(--line)}
.meal-rec{margin:0 18px 16px;width:calc(100% - 36px);padding:10px;border-radius:99px;border:1px solid var(--line);background:var(--surface-2);color:var(--text);font-size:13px;font-weight:700}
.meal-rec:hover{border-color:var(--orange);color:var(--orange)}
.rc-sheet{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9990;display:flex;align-items:flex-end;justify-content:center;padding:12px}
@media(min-width:700px){.rc-sheet{align-items:center}}
.rc-card{background:var(--surface-solid);border:1px solid var(--line);border-radius:22px;width:100%;max-width:480px;max-height:90dvh;overflow:auto;color:var(--text);box-sizing:border-box}
.rc-foto{height:200px;background:var(--surface-2) center/cover no-repeat;border-radius:22px 22px 0 0;display:grid;place-items:center;color:var(--muted-2);font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;text-align:center;padding:0 20px}
.rc-body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:16px}
.rc-body h3{margin:0;font-family:Anton,sans-serif;font-weight:400;font-size:26px;letter-spacing:.5px}
.rc-sub{font-size:12px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-top:4px}
.rc-mac{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.rc-mac div{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:9px 6px;text-align:center}
.rc-mac b{display:block;font-family:Anton,sans-serif;font-weight:400;font-size:19px}
.rc-mac span{font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--muted-2);text-transform:uppercase}
.rc-body h4{margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.rc-ing{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;font-size:14px}
.rc-ing li{display:flex;gap:10px}.rc-ing li::before{content:"";flex:0 0 6px;height:6px;margin-top:8px;border-radius:50%;background:var(--orange)}
.rc-pasos{margin:0;padding:0;list-style:none;counter-reset:p;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.45}
.rc-pasos li{counter-increment:p;display:flex;gap:12px}
.rc-pasos li::before{content:counter(p);flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--molten);color:#fff;font-weight:800;font-size:12.5px}
.rc-nota{background:var(--molten-soft);border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13.5px}
.rc-nota b{display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.rc-acts{display:flex;gap:8px;flex-wrap:wrap}
.rc-a{flex:1;padding:12px;border-radius:99px;font-weight:700;font-size:13.5px;border:1px solid var(--line);background:var(--surface-2);color:var(--text);text-align:center;cursor:pointer}
.rc-a.pri{background:var(--molten);border:0;color:#fff}
.rc-coach{border-top:1px dashed var(--line);padding-top:14px;display:flex;flex-direction:column;gap:9px}
.rc-coach input,.rc-coach textarea{width:100%;box-sizing:border-box;background:var(--field-bg);border:1px solid var(--line);border-radius:12px;padding:10px 12px;color:var(--text);font-size:13.5px;font-family:inherit}
.rc-coach textarea{min-height:60px;resize:vertical}
.rc-msg{font-size:12px;color:var(--muted)}
`;
document.head.appendChild(css);

function abrir(plan,meal,i,titulo,kcal){
  const r=get(plan,meal,i); if(!r) return;
  const key=plan+'|'+meal+'|'+i, x=extra(key), c=coach();
  const s=document.createElement('div'); s.className='rc-sheet';
  s.innerHTML=`<div class="rc-card" role="dialog" aria-label="Receta">
    <div class="rc-foto" style="${x.foto?`background-image:url('${x.foto}')`:''}">${x.foto?'':esc(titulo)+'<br>Foto pendiente del coach'}</div>
    <div class="rc-body">
      <div><h3>${esc(titulo)}</h3><div class="rc-sub">${meal} · ${plan==='volumen'?'Volumen':'Definición'} · Opción ${i+1} · ${r.min} min</div></div>
      <div class="rc-mac"><div><b>${kcal}</b><span>kcal</span></div><div><b>${r.p}g</b><span>Prot</span></div><div><b>${r.c}g</b><span>Carbs</span></div><div><b>${r.g}g</b><span>Grasa</span></div></div>
      ${x.nota?`<div class="rc-nota"><b>Nota de ${esc(x.coachN||'tu coach')}</b>${esc(x.nota)}</div>`:''}
      <div><h4>Ingredientes</h4><ul class="rc-ing">${r.ing.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h4>Preparación</h4><ol class="rc-pasos">${r.pasos.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>
      <div class="rc-acts">${x.video?`<a class="rc-a pri" href="${esc(x.video)}" target="_blank" rel="noopener">▶ Ver video</a>`:''}<button type="button" class="rc-a" data-x>Cerrar</button></div>
      ${c?`<div class="rc-coach"><h4 style="margin:0">Panel de coach</h4>
        <label class="rc-a" style="flex:none">📷 ${x.foto?'Cambiar foto':'Subir foto del platillo'}<input type="file" accept="image/*" hidden data-f></label>
        <input type="url" placeholder="Link de video (YouTube, Instagram, Drive)" value="${esc(x.video||'')}" data-v>
        <textarea placeholder="Nota para tus alumnos (tips, sustituciones…)" data-n>${esc(x.nota||'')}</textarea>
        <button type="button" class="rc-a pri" style="flex:none" data-s>Guardar</button><div class="rc-msg" data-m></div></div>`:''}
    </div></div>`;
  const cerrar=()=>s.remove();
  s.onclick=e=>{ if(e.target===s) cerrar(); };
  s.querySelector('[data-x]').onclick=cerrar;
  if(c){
    const m=s.querySelector('[data-m]');
    s.querySelector('[data-f]').onchange=async e=>{
      const f=e.target.files[0]; if(!f) return; m.textContent='Subiendo foto…';
      try{ const foto=await comprimir(f); await guardarExtra(key,{foto});
        const fo=s.querySelector('.rc-foto'); fo.textContent=''; fo.style.backgroundImage=`url('${foto}')`;
        m.textContent='Foto guardada ✓'; try{ renderDiet(); }catch(_){}
      }catch(err){ m.textContent='No se pudo subir la foto. Revisa las reglas de Firebase (colección "recetas").'; }
    };
    s.querySelector('[data-s]').onclick=async()=>{
      m.textContent='Guardando…';
      try{ await guardarExtra(key,{video:s.querySelector('[data-v]').value.trim(),nota:s.querySelector('[data-n]').value.trim()});
        m.textContent='Guardado ✓ — tus alumnos ya lo ven.'; try{ renderDiet(); }catch(_){}
      }catch(err){ m.textContent='No se pudo guardar. Revisa las reglas de Firebase (colección "recetas").'; }
    };
  }
  document.body.appendChild(s);
}

window.FORJA_RECETA={abrir, foto:(plan,meal,i)=>extra(plan+'|'+meal+'|'+i).foto||'',
  macros:(plan,meal,i)=>{ const r=R[plan]&&R[plan][meal]&&R[plan][meal][i]; return r?{p:r.p,c:r.c,g:r.g}:null; }};
try{ renderDiet(); }catch(e){}
})();
