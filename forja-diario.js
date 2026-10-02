/* ============================================================
   FORJA — Registro de comidas del día y conteo de kcal
   - "Ya me la comí" en cada opción del plan (macros de la receta)
   - "Agregar comida" con buscador de alimentos comunes en México
   - Guarda por día en forja_diario {AAAA-MM-DD:[{n,q,kc,p,c,g,m}]}
   ============================================================ */
(function(){
'use strict';
const KEY='forja_diario';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hoy=()=>{ try{ return hoyKey(); }catch(e){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); } };
const COMIDAS=['Desayuno','Snack AM','Comida','Snack PM','Cena'];
const comidaAhora=()=>{ const h=new Date().getHours(); return h<11?'Desayuno':h<13?'Snack AM':h<17?'Comida':h<20?'Snack PM':'Cena'; };

/* [nombre, porción, kcal, proteína, carbs, grasa] */
const ALIM=[
['Huevo entero','1 pieza',72,6,0.4,5],['Clara de huevo','1 pieza',17,3.6,0.2,0],['Pechuga de pollo','100 g cocida',165,31,0,3.6],
['Muslo de pollo','100 g cocido',209,26,0,11],['Bistec de res','100 g cocido',217,26,0,12],['Carne molida de res','100 g cocida',250,26,0,15],
['Cerdo (lomo)','100 g cocido',242,27,0,14],['Atún en agua','1 lata (140 g)',150,33,0,1.5],['Salmón','100 g cocido',208,22,0,13],
['Tilapia / pescado blanco','100 g cocido',128,26,0,2.7],['Camarón','100 g cocido',99,24,0.2,0.3],['Jamón de pavo','2 rebanadas',60,9,2,1.5],
['Queso panela','60 g',150,11,2,11],['Queso Oaxaca','30 g',95,7,1,7],['Leche entera','1 vaso (250 ml)',150,8,12,8],
['Leche light','1 vaso (250 ml)',105,8,12,2.5],['Yogur griego natural','200 g',146,20,8,4],['Proteína en polvo','1 scoop',120,24,3,1.5],
['Tortilla de maíz','1 pieza',52,1.4,11,0.7],['Tortilla de harina','1 pieza',140,3.5,22,4],['Arroz blanco','1 taza cocido',205,4.3,45,0.4],
['Arroz integral','1 taza cocido',216,5,45,1.8],['Frijoles de la olla','1/2 taza',114,7.6,20,0.5],['Frijoles refritos','1/2 taza',170,7,20,7],
['Avena','40 g',150,5,27,2.6],['Pan integral','1 rebanada',80,4,13,1],['Bolillo','1 pieza',230,7,46,2],
['Pasta cocida','1 taza',220,8,43,1.3],['Papa cocida','1 mediana (170 g)',150,4,34,0.2],['Camote','100 g',86,1.6,20,0.1],
['Granola','40 g',180,4,28,6],['Plátano','1 pieza',105,1.3,27,0.4],['Manzana','1 pieza',95,0.5,25,0.3],
['Papaya','1 taza',62,0.7,16,0.4],['Fresas','1 taza',50,1,12,0.5],['Mango','1 pieza',200,2.8,50,1.3],
['Naranja','1 pieza',62,1.2,15,0.2],['Aguacate','1/2 pieza',120,1.5,6,11],['Almendras','20 g',116,4.2,4.3,10],
['Cacahuates','30 g',170,7,5,14],['Crema de cacahuate','1 cda',95,3.5,3.5,8],['Aceite de oliva','1 cda',120,0,0,14],
['Verduras mixtas','1 taza',50,2,10,0.3],['Ensalada verde','1 plato',25,1.5,4,0.3],['Nopales','1 taza',22,2,4.5,0.1],
['Taco de pastor','1 pieza',150,8,14,7],['Taco de bistec','1 pieza',140,9,13,6],['Taco de suadero','1 pieza',190,8,13,12],
['Quesadilla de harina','1 pieza',300,13,25,16],['Torta de jamón','1 pieza',450,20,55,16],['Tamal','1 pieza',280,7,30,15],
['Chilaquiles verdes con pollo','1 plato',520,28,55,22],['Enchiladas (3)','1 plato',480,22,45,23],['Pozole','1 plato',380,25,35,14],
['Hamburguesa','1 pieza',540,28,40,29],['Pizza','1 rebanada',285,12,36,10],['Sushi (rollo)','8 piezas',350,12,55,8],
['Refresco','1 lata (355 ml)',150,0,39,0],['Cerveza','1 lata (355 ml)',150,1.6,13,0],['Café con leche y azúcar','1 taza',90,3,14,2.5],
['Galletas','3 piezas',150,2,21,6],['Pan dulce (concha)','1 pieza',300,6,48,10],['Papas fritas','1 bolsa (45 g)',240,3,24,15],
/* Sándwiches y tortas */
['Sándwich de jamón y queso','1 pieza',320,18,30,14],['Sándwich de pollo','1 pieza',350,26,32,12],['Sándwich de atún','1 pieza',330,25,30,11],
['Sándwich de pavo (integral)','1 pieza',280,20,30,8],['Sándwich de huevo','1 pieza',340,16,30,16],['Sincronizada','1 pieza',330,15,26,18],
['Torta de milanesa','1 pieza',650,30,65,28],['Torta de pierna','1 pieza',580,28,60,24],['Torta ahogada','1 pieza',600,26,62,26],
['Torta cubana','1 pieza',900,42,70,48],['Torta de tamal (guajolota)','1 pieza',520,12,75,19],['Hot dog','1 pieza',300,11,25,17],
['Molletes','2 piezas',420,18,50,16],['Club sándwich','1 pieza',600,32,45,32],
/* Antojitos */
['Taco al pastor con piña','1 pieza',165,8,16,7],['Taco de carnitas','1 pieza',180,10,13,10],['Taco de barbacoa','1 pieza',170,11,13,8],
['Taco de cochinita','1 pieza',165,10,14,8],['Taco de pescado','1 pieza',200,10,18,10],['Taco de canasta','1 pieza',140,4,16,7],
['Taco dorado (flauta)','1 pieza',150,6,13,8],['Taco de chorizo','1 pieza',200,8,13,13],['Taco de birria','1 pieza',190,12,13,10],
['Gringa','1 pieza',400,20,32,21],['Quesadilla de maíz','1 pieza',190,8,18,10],['Quesadilla frita','1 pieza',280,9,22,17],
['Sope','1 pieza',220,8,25,10],['Gordita de chicharrón','1 pieza',310,9,32,16],['Tlacoyo','1 pieza',230,8,35,6],
['Huarache','1 pieza',450,18,50,20],['Tostada de tinga','1 pieza',190,11,16,9],['Tostada de ceviche','1 pieza',130,11,13,3],
['Tostada horneada','1 pieza',50,1,9,1],['Tamal verde de pollo','1 pieza',280,10,30,13],['Tamal de rajas','1 pieza',260,7,30,12],
['Tamal dulce','1 pieza',300,4,45,12],['Elote cocido con mayonesa','1 pieza',260,5,30,14],['Esquite','1 vaso mediano',320,7,38,16],
['Empanada','1 pieza',280,8,30,14],['Pambazo','1 pieza',480,15,50,24],['Tortas de papa','2 piezas',280,8,28,15],
/* Platillos */
['Arroz rojo','1 taza',240,4,45,5],['Sopa de fideo','1 plato',180,5,28,5],['Caldo de pollo','1 plato',230,22,15,8],
['Caldo de res','1 plato',300,25,20,12],['Mole con pollo','1 plato',520,32,25,32],['Tinga de pollo','1 taza',250,24,10,12],
['Picadillo','1 taza',290,22,15,15],['Milanesa de res','1 pieza (150 g)',380,30,18,20],['Milanesa de pollo','1 pieza (150 g)',340,32,18,15],
['Pollo asado','1/4 de pollo',320,35,0,19],['Pollo rostizado','1/4 de pollo',350,34,0,23],['Carne asada','150 g',330,38,0,19],
['Arrachera','150 g',300,36,0,17],['Chicharrón en salsa','1 taza',380,20,8,30],['Chile relleno capeado','1 pieza',380,15,18,28],
['Bistec a la mexicana','1 plato',350,30,10,20],['Albóndigas en caldillo','4 piezas',360,24,15,22],['Huevos a la mexicana','2 huevos',220,13,5,16],
['Huevos rancheros','2 huevos',360,15,26,22],['Huevos con jamón','2 huevos',240,17,2,18],['Huevo con chorizo','2 huevos',370,20,3,30],
['Enfrijoladas (3)','1 plato',420,18,48,18],['Entomatadas (3)','1 plato',400,18,45,17],['Flautas (4) con crema','1 plato',600,24,50,34],
['Enchiladas suizas (3)','1 plato',560,28,42,30],['Menudo','1 plato',350,30,15,18],['Birria / consomé','1 plato',420,35,10,26],
['Barbacoa','150 g',330,35,0,20],['Carnitas','150 g',420,36,0,30],['Cochinita pibil','150 g',300,32,4,17],
['Ceviche de pescado','1 taza',150,22,8,3],['Coctel de camarón','1 copa',220,24,20,4],['Pescado empanizado','1 filete',300,24,15,16],
['Mojarra frita','1 pieza',450,40,5,30],['Sopa de tortilla','1 plato',300,9,28,17],['Crema de verduras','1 plato',180,5,18,10],
['Frijoles charros','1 taza',260,14,30,9],['Lentejas','1 taza',230,18,40,1],['Calabacitas a la mexicana','1 taza',90,3,10,4],
['Ensalada de nopales','1 taza',60,3,8,2],['Guacamole','1/2 taza',180,2,9,16],['Pico de gallo','1/2 taza',20,1,4,0],
['Spaghetti rojo / blanco','1 plato',380,10,55,13],['Sopa de pasta','1 plato',190,6,30,5],
/* Comida rápida y botanas */
['Hamburguesa doble','1 pieza',800,45,42,50],['Papas a la francesa','porción mediana',360,4,46,17],['Nuggets de pollo','6 piezas',280,15,16,17],
['Alitas de pollo','6 piezas',480,36,4,35],['Boneless','6 piezas',450,28,30,24],['Pizza pepperoni','1 rebanada',310,13,35,13],
['Burrito de carne','1 pieza',600,30,60,26],['Nachos con queso','1 plato',550,14,55,31],['Chilaquiles rojos con huevo','1 plato',500,18,50,25],
['Hot cakes (3) con miel','1 plato',520,10,90,13],['Waffle','1 pieza',300,7,38,13],['Ramen instantáneo','1 vaso',380,8,52,15],
['Palomitas naturales','3 tazas',95,3,19,1],['Palomitas con mantequilla','1 bolsa microondas',400,6,40,24],['Doritos / totopos','1 bolsa (60 g)',290,4,36,15],
['Cacahuates japoneses','50 g',250,8,25,13],['Chicharrón de harina','1 bolsa (50 g)',260,3,30,14],['Gomitas','50 g',170,3,38,0],
['Chocolate','1 barra (40 g)',210,3,25,12],['Helado','1 bola',140,2,16,7],['Paleta de hielo','1 pieza',70,0,18,0],
['Churro','1 pieza',120,1,13,7],['Dona glaseada','1 pieza',250,3,30,14],['Pastel','1 rebanada',350,4,50,15],
['Flan','1 rebanada',230,6,35,7],['Gelatina de leche','1 porción',150,4,25,4],['Arroz con leche','1 taza',280,7,48,7],
['Barra de granola','1 pieza',110,2,19,3],['Barra de proteína','1 pieza',200,20,22,7],
/* Panadería y desayuno */
['Pan blanco de caja','1 rebanada',75,2.5,14,1],['Telera','1 pieza',220,7,44,2],['Cuernito','1 pieza',230,5,26,12],
['Bísquet','1 pieza',280,6,38,12],['Oreja / hojaldra','1 pieza',300,4,30,18],['Cereal de caja','1 taza',150,3,33,1],
['Cereal con leche','1 tazón',260,10,45,5],['Avena con leche','1 tazón',300,12,45,8],['Mantequilla','1 cda',100,0,0,11],
['Mermelada','1 cda',50,0,13,0],['Miel','1 cda',64,0,17,0],['Azúcar','1 cdita',16,0,4,0],
['Crema','1 cda',50,0.5,1,5],['Mayonesa','1 cda',95,0,0,10],['Queso amarillo','1 rebanada',70,4,1,6],
['Queso fresco','30 g',80,5,1,6],['Requesón','1/2 taza',100,12,4,4],['Salchicha de pavo','1 pieza',50,5,1,3],
['Chorizo','50 g',230,12,1,20],['Tocino','2 tiras',90,6,0,7],['Pechuga de pavo (embutido)','2 rebanadas',50,9,1,1],
/* Bebidas */
['Agua de horchata','1 vaso',180,1,38,3],['Agua de jamaica','1 vaso',100,0,25,0],['Agua de limón / tamarindo','1 vaso',110,0,28,0],
['Jugo de naranja','1 vaso',110,2,26,0],['Licuado de plátano','1 vaso',300,10,50,7],['Licuado de fresa','1 vaso',250,9,42,6],
['Atole','1 vaso',220,5,40,4],['Champurrado','1 vaso',260,5,45,7],['Chocolate caliente','1 taza',230,8,32,8],
['Café americano','1 taza',5,0,0,0],['Capuchino','1 taza',130,7,12,6],['Frappé','1 vaso grande',400,6,65,14],
['Refresco de dieta','1 lata',0,0,0,0],['Bebida energética','1 lata',160,0,40,0],['Bebida deportiva','600 ml',150,0,38,0],
['Leche de almendra','1 vaso',40,1,2,3],['Yakult','1 pieza',50,1,11,0],['Michelada','1 vaso',200,2,18,0],
['Tequila / mezcal','1 caballito',100,0,0,0],['Cuba','1 vaso',230,0,25,0],
/* Frutas y verduras */
['Sandía','1 taza',46,1,11,0.2],['Melón','1 taza',60,1.5,14,0.3],['Piña','1 taza',82,1,22,0.2],
['Uvas','1 taza',100,1,27,0.2],['Pera','1 pieza',100,0.6,27,0.2],['Guayaba','1 pieza',37,1.4,8,0.5],
['Mandarina','1 pieza',47,0.7,12,0.3],['Kiwi','1 pieza',42,0.8,10,0.4],['Jícama','1 taza',46,0.9,11,0.1],
['Pepino','1 taza',16,0.7,4,0.1],['Zanahoria','1 pieza',25,0.6,6,0.1],['Brócoli','1 taza',31,2.6,6,0.3],
['Elote desgranado','1/2 taza',70,2.5,15,1],['Ejotes','1 taza',35,2,8,0.2],['Champiñones','1 taza',20,3,3,0.3],
['Fruta picada con chile','1 vaso',120,2,28,0.5],['Coctel de frutas en almíbar','1/2 taza',90,0.5,23,0],
/* Básicos extra */
['Pechuga empanizada','1 pieza',330,30,15,16],['Pechuga asada','150 g',230,45,0,5],['Pollo deshebrado','1/2 taza',120,22,0,3],
['Sardinas en tomate','1 lata',250,24,4,15],['Salmón ahumado','50 g',60,9,0,2],['Tofu','100 g',80,8,2,5],
['Quinoa','1 taza cocida',220,8,39,3.5],['Garbanzos','1/2 taza',135,7,22,2],['Chía','1 cda',60,2,5,4],
['Nueces','20 g',130,3,3,13],['Semillas de girasol','20 g',115,4,4,10],['Pistaches','30 g',160,6,8,13]
];
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

const leer=()=>{ try{ return load(KEY,{}); }catch(e){ return {}; } };
const escribir=d=>{ /* conserva solo 60 días */ const ks=Object.keys(d).sort(); while(ks.length>60) delete d[ks.shift()]; try{ save(KEY,d); }catch(e){} };
const delDia=()=>leer()[hoy()]||[];
function agrega(it){ const d=leer(), k=hoy(); (d[k]=d[k]||[]).push(Object.assign({t:Date.now()},it)); escribir(d); pinta(); if(window.toast) try{ toast('Registrado: '+it.kc+' kcal ✓'); }catch(e){} }
function quita(i){ const d=leer(), k=hoy(); if(!d[k]) return; d[k].splice(i,1); escribir(d); pinta(); }

/* ---------- estilos ---------- */
const css=document.createElement('style');
css.textContent=`
.fd-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;margin-bottom:20px;display:flex;flex-direction:column;gap:14px}
.fd-top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}
.fd-lbl{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.fd-big{font-family:'Anton';font-size:34px;line-height:1.05}
.fd-big small{font-family:'Inter';font-size:14px;color:var(--muted);font-weight:600}
.fd-rest{font-size:13px;font-weight:700;color:var(--green)}
.fd-rest.over{color:#FF7A6B}
.fd-bar{height:10px;border-radius:99px;background:var(--surface-2);border:1px solid var(--line);overflow:hidden}
.fd-bar i{display:block;height:100%;background:var(--molten);border-radius:99px;transition:width .4s}
.fd-bar.over i{background:linear-gradient(120deg,#C2453A,#FF7A6B)}
.fd-mac{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fd-mac div{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:9px 11px}
.fd-mac b{display:block;font-size:16px}
.fd-mac span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px}
.fd-list{display:flex;flex-direction:column;gap:6px}
.fd-it{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius-sm);background:var(--surface-2);border:1px solid var(--line);font-size:13.5px}
.fd-it .n{flex:1;min-width:0}
.fd-it .n small{display:block;color:var(--muted);font-size:11.5px}
.fd-it .k{font-weight:700;color:var(--orange);white-space:nowrap}
.fd-it button{width:30px;height:30px;border-radius:99px;color:var(--muted);font-size:16px;flex:none}
.fd-it button:hover{color:#FF7A6B;background:rgba(255,122,107,.12)}
.fd-vacio{font-size:13px;color:var(--muted)}
.fd-add{align-self:flex-start;padding:12px 20px;border-radius:99px;background:var(--molten);color:#fff;font-weight:800;font-size:14px}
.fd-add:active{transform:scale(.97)}
.meal-comi{margin:0 18px 16px;width:calc(100% - 36px);padding:10px;border-radius:99px;border:1px solid var(--green);color:var(--green);font-weight:800;font-size:13px;background:rgba(47,208,122,.08)}
.meal-comi.ok{background:var(--green);color:#04210F}
.fd-bg{position:fixed;inset:0;z-index:9000;background:rgba(2,6,10,.72);display:flex;align-items:flex-end;justify-content:center}
.fd-sh{width:100%;max-width:520px;max-height:88vh;background:var(--surface-solid);border:1px solid var(--line);border-radius:22px 22px 0 0;padding:18px 18px 22px;display:flex;flex-direction:column;gap:12px}
@media(min-width:700px){.fd-bg{align-items:center}.fd-sh{border-radius:22px}}
.fd-sh h3{font-family:'Anton';font-size:22px;font-weight:400;display:flex;justify-content:space-between;align-items:center}
.fd-sh h3 button{width:36px;height:36px;border-radius:99px;color:var(--muted);font-size:20px}
.fd-in{width:100%;padding:12px 16px;border-radius:99px;background:var(--field-bg);border:1px solid var(--line);color:var(--text);font-size:15px}
.fd-in:focus{outline:2px solid var(--orange);outline-offset:1px}
.fd-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.fd-chips button{flex:none;padding:7px 12px;border-radius:99px;border:1px solid var(--line);font-size:12px;font-weight:700;color:var(--muted);background:var(--surface-2)}
.fd-chips button.on{border-color:var(--orange);color:var(--text);background:var(--molten-soft)}
.fd-res{overflow-y:auto;display:flex;flex-direction:column;gap:6px;min-height:120px}
.fd-res button{display:flex;justify-content:space-between;gap:10px;text-align:left;padding:11px 14px;border-radius:var(--radius-sm);background:var(--surface-2);border:1px solid var(--line);font-size:14px;color:var(--text)}
.fd-res button:hover{border-color:var(--orange)}
.fd-res small{color:var(--muted);font-size:12px}
.fd-res .k{color:var(--orange);font-weight:700;white-space:nowrap}
.fd-q{display:flex;flex-direction:column;gap:12px}
.fd-qs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.fd-qs button{padding:10px 0;border-radius:99px;border:1px solid var(--line);font-weight:800;color:var(--muted);background:var(--surface-2)}
.fd-qs button.on{border-color:var(--orange);color:var(--text);background:var(--molten-soft)}
.fd-tot{font-size:14px;color:var(--muted)}
.fd-tot b{font-family:'Anton';font-size:26px;font-weight:400;color:var(--text)}
.fd-man{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.fd-link{align-self:center;font-size:13px;color:var(--orange);font-weight:700;padding:6px}
`;
document.head.appendChild(css);

/* ---------- tarjeta del día ---------- */
function asegura(){
  let c=document.getElementById('fdCard'); if(c) return c;
  const head=document.querySelector('#view-dieta .diet-head'); if(!head) return null;
  c=document.createElement('div'); c.id='fdCard'; c.className='fd-card';
  head.insertAdjacentElement('afterend',c); return c;
}
function pinta(){
  const c=asegura(); if(!c) return;
  const meta=(typeof dietTarget!=='undefined'&&dietTarget)||2000;
  const L=delDia(), s=L.reduce((a,x)=>({kc:a.kc+x.kc,p:a.p+(x.p||0),c:a.c+(x.c||0),g:a.g+(x.g||0)}),{kc:0,p:0,c:0,g:0});
  const pct=Math.min(100,Math.round(s.kc/meta*100)), over=s.kc>meta, rest=Math.abs(meta-s.kc);
  const orden=[...L.map((x,i)=>[x,i])].sort((a,b)=>COMIDAS.indexOf(a[0].m)-COMIDAS.indexOf(b[0].m)||a[0].t-b[0].t);
  c.innerHTML=`
    <div class="fd-top">
      <div><div class="fd-lbl">Hoy llevas</div><div class="fd-big">${s.kc.toLocaleString('es-MX')} <small>/ ${meta.toLocaleString('es-MX')} kcal</small></div></div>
      <div class="fd-rest${over?' over':''}">${over?'Te pasaste '+rest.toLocaleString('es-MX'):'Te faltan '+rest.toLocaleString('es-MX')} kcal</div>
    </div>
    <div class="fd-bar${over?' over':''}"><i style="width:${pct}%"></i></div>
    <div class="fd-mac">
      <div><b>${Math.round(s.p)} g</b><span>Proteína</span></div>
      <div><b>${Math.round(s.c)} g</b><span>Carbs</span></div>
      <div><b>${Math.round(s.g)} g</b><span>Grasa</span></div>
    </div>
    <div class="fd-list">${orden.length?orden.map(([x,i])=>`<div class="fd-it"><div class="n">${esc(x.n)}<small>${esc(x.m)} · ${esc(x.q||'')}</small></div><div class="k">${x.kc} kcal</div><button type="button" data-del="${i}" aria-label="Quitar">×</button></div>`).join('')
      :'<div class="fd-vacio">Aún no registras nada hoy. Marca la opción del plan que comiste o agrega lo que sea que hayas comido.</div>'}</div>
    <button type="button" class="fd-add" data-add>＋ Agregar comida</button>`;
  c.querySelector('[data-add]').onclick=()=>abrir();
  c.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>quita(+b.dataset.del));
  botonesPlan();
}

/* ---------- "Ya me la comí" en cada tarjeta del plan ---------- */
function botonesPlan(){
  const plan=load('forja_diet_plan','volumen'), picks=load('forja_diet_pick',{}), L=delDia();
  document.querySelectorAll('#mealGrid .meal').forEach(el=>{
    const m=(el.querySelector('.meal-top .t')||{}).textContent; if(!m) return;
    const sel=picks[plan+'|'+m]||0, id=plan+'|'+m+'|'+sel;
    const nombre=(el.querySelector('li')||{}).firstChild; const nm=nombre?nombre.textContent:m;
    let b=el.querySelector('.meal-comi');
    if(!b){ b=document.createElement('button'); b.type='button'; b.className='meal-comi'; el.appendChild(b); }
    const ya=L.findIndex(x=>x.id===id);
    b.classList.toggle('ok',ya>=0);
    b.textContent=ya>=0?'✓ Registrada · '+L[ya].kc+' kcal':'Ya me la comí';
    b.onclick=()=>{
      if(ya>=0){ quita(ya); return; }
      const mc=window.FORJA_RECETA&&FORJA_RECETA.macros?FORJA_RECETA.macros(plan,m,sel):null;
      let kc,p=0,c=0,g=0;
      if(mc){ p=mc.p;c=mc.c;g=mc.g; kc=Math.round(p*4+c*4+g*9); }
      else{ const t=(el.querySelector('.meal-top .kc')||{}).textContent||''; kc=parseInt(t.replace(/\D/g,''))||0; }
      agrega({id,n:nm,q:'Opción '+(sel+1)+' del plan',m,kc,p,c,g});
    };
  });
}

/* ---------- hoja para agregar ---------- */
function abrir(){
  let comida=comidaAhora();
  const bg=document.createElement('div'); bg.className='fd-bg';
  bg.innerHTML=`<div class="fd-sh" role="dialog" aria-label="Agregar comida">
    <h3>Agregar comida<button type="button" data-x aria-label="Cerrar">×</button></h3>
    <div class="fd-chips" data-com>${COMIDAS.map(x=>`<button type="button" data-c="${x}" class="${x===comida?'on':''}">${x}</button>`).join('')}</div>
    <div data-body></div></div>`;
  document.body.appendChild(bg);
  const cerrar=()=>bg.remove();
  bg.onclick=e=>{ if(e.target===bg) cerrar(); };
  bg.querySelector('[data-x]').onclick=cerrar;
  bg.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ comida=b.dataset.c; bg.querySelectorAll('[data-c]').forEach(x=>x.classList.toggle('on',x===b)); });
  const body=bg.querySelector('[data-body]');

  function buscar(q){
    body.className='fd-q';
    body.innerHTML=`<input class="fd-in" data-q placeholder="Busca: pollo, tortilla, taco…" value="${esc(q||'')}" autocomplete="off">
      <div class="fd-res" data-r></div>
      <button type="button" class="fd-link" data-man>¿No está? Escríbelo a mano</button>`;
    const inp=body.querySelector('[data-q]'), r=body.querySelector('[data-r]');
    const lista=()=>{
      const ws=norm(inp.value.trim()).replace(/sanswich|sandwich|sanwich|sandwhich/g,'sandwich').split(/\s+/).filter(Boolean);
      const hits=ALIM.map((a,i)=>[a,i]).filter(([a])=>{ const n=norm(a[0]).replace('sandwich','sandwich'); return ws.every(w=>n.includes(w)); }).slice(0,60);
      r.innerHTML=hits.length?hits.map(([a,i])=>`<button type="button" data-i="${i}"><span>${esc(a[0])}<br><small>${esc(a[1])}</small></span><span class="k">${a[2]} kcal</span></button>`).join('')
        :'<div class="fd-vacio">Sin resultados. Agrégalo a mano abajo.</div>';
      r.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>cantidad(ALIM[+b.dataset.i]));
    };
    inp.oninput=lista; lista();
    body.querySelector('[data-man]').onclick=()=>manual(inp.value.trim());
    setTimeout(()=>inp.focus(),60);
  }
  function cantidad(a){
    let x=1; const Q=[0.5,1,1.5,2,3];
    const tot=()=>Math.round(a[2]*x);
    body.innerHTML=`<div class="fd-res" style="min-height:0"><button type="button" style="pointer-events:none"><span>${esc(a[0])}<br><small>${esc(a[1])} = ${a[2]} kcal</small></span></button></div>
      <div class="fd-lbl">¿Cuántas porciones?</div>
      <div class="fd-qs">${Q.map(q=>`<button type="button" data-x="${q}" class="${q===1?'on':''}">${q===0.5?'½':q===1.5?'1½':q}</button>`).join('')}</div>
      <div class="fd-tot">Total: <b data-t>${tot()}</b> kcal</div>
      <button type="button" class="fd-add" data-ok style="align-self:stretch">Registrar en ${esc(comida)}</button>
      <button type="button" class="fd-link" data-back>← Buscar otro</button>`;
    body.querySelectorAll('.fd-qs [data-x]').forEach(b=>b.onclick=()=>{ x=+b.dataset.x; body.querySelectorAll('.fd-qs button').forEach(y=>y.classList.toggle('on',y===b)); body.querySelector('[data-t]').textContent=tot(); body.querySelector('[data-ok]').textContent='Registrar en '+comida; });
    body.querySelector('[data-back]').onclick=()=>buscar('');
    body.querySelector('[data-ok]').onclick=()=>{
      const qtxt=(x===1?'':(x===0.5?'½':x===1.5?'1½':x)+' × ')+a[1];
      agrega({n:a[0],q:qtxt,m:comida,kc:tot(),p:+(a[3]*x).toFixed(1),c:+(a[4]*x).toFixed(1),g:+(a[5]*x).toFixed(1)}); cerrar();
    };
  }
  function manual(nm){
    body.innerHTML=`<input class="fd-in" data-n placeholder="¿Qué comiste?" value="${esc(nm||'')}">
      <input class="fd-in" data-k type="number" inputmode="numeric" placeholder="Calorías (kcal)">
      <div class="fd-lbl">Opcional</div>
      <div class="fd-man"><input class="fd-in" data-p type="number" inputmode="decimal" placeholder="Proteína g"><input class="fd-in" data-cb type="number" inputmode="decimal" placeholder="Carbs g"></div>
      <input class="fd-in" data-g type="number" inputmode="decimal" placeholder="Grasa g">
      <button type="button" class="fd-add" data-ok style="align-self:stretch">Registrar</button>
      <button type="button" class="fd-link" data-back>← Volver al buscador</button>`;
    const v=s=>parseFloat(body.querySelector(s).value)||0;
    body.querySelector('[data-back]').onclick=()=>buscar(nm);
    body.querySelector('[data-ok]').onclick=()=>{
      const n=body.querySelector('[data-n]').value.trim(); let kc=Math.round(v('[data-k]'));
      const p=v('[data-p]'),c=v('[data-cb]'),g=v('[data-g]');
      if(!kc&&(p||c||g)) kc=Math.round(p*4+c*4+g*9);
      if(!n||!kc){ body.querySelector(n?'[data-k]':'[data-n]').focus(); return; }
      agrega({n,q:'a mano',m:comida,kc,p,c,g}); cerrar();
    };
  }
  buscar('');
}

/* ---------- engancha al render de la dieta ---------- */
try{
  const orig=window.renderDiet;
  if(typeof orig==='function'){ window.renderDiet=function(){ const r=orig.apply(this,arguments); try{ pinta(); }catch(e){ console.warn('[FORJA diario]',e); } return r; }; }
}catch(e){}
window.FORJA_DIARIO={pinta,abrir};
try{ pinta(); }catch(e){}
})();
