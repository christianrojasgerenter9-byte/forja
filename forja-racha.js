/* ============================================================
   FORJA — Racha real e historial de días

   Problema que resuelve:
   La tarjeta "Racha activa" cuenta días distintos con registros en
   Progreso, así que solo sube y nunca se rompe: eso no es una racha.
   Además, cuando el día cambia se borran los "Hecho" sin dejar rastro,
   así que no queda historial de qué se entrenó.

   Este módulo guarda un registro por día y calcula la racha de verdad:
   días consecutivos entrenados, saltando los de descanso programado
   (sábado y domingo en tu split) sin romper la cuenta.

   Uso mínimo (ver forja-racha-patch.md):
     FORJARacha.registrarHoy({ hechos, total, grupos });
     const r = FORJARacha.calcular();   // { actual, mejor, entrenoHoy, ... }
   ============================================================ */

const FORJARacha = (() => {
  'use strict';

  const LLAVE = 'forja_dias';
  const LLAVE_MEJOR = 'forja_racha_mejor';
  const MAX_DIAS = 400;            // ~13 meses de historial
  const DIA_MS = 86400000;

  // Días de descanso del split: 0 = domingo, 6 = sábado.
  // No cuentan para la racha, pero tampoco la rompen.
  let DIAS_DESCANSO = [0, 6];

  // Un día cuenta como entrenado a partir de este porcentaje de la rutina.
  // 0.5 evita que marcar un solo ejercicio "salve" el día.
  let UMBRAL = 0.5;

  /* ---------- Almacenamiento ---------- */

  function leer() {
    try {
      return JSON.parse(localStorage.getItem(LLAVE)) || {};
    } catch (e) {
      return {};
    }
  }

  function escribir(dias) {
    // Recorta el historial viejo para no inflar localStorage.
    const claves = Object.keys(dias).sort();
    while (claves.length > MAX_DIAS) delete dias[claves.shift()];
    try {
      localStorage.setItem(LLAVE, JSON.stringify(dias));
    } catch (e) {}
    if (typeof api.alCambiar === 'function') api.alCambiar(dias);
    return dias;
  }

  function clave(fecha) {
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function desdeClave(k) {
    const [a, m, d] = k.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  function esDescanso(fecha) {
    return DIAS_DESCANSO.indexOf(fecha.getDay()) !== -1;
  }

  /* ---------- Registro ---------- */

  /* Se llama cada vez que se repinta Inicio: mantiene fresco el día de hoy.
     Cuando el reloj cruza la medianoche, el día anterior ya quedó guardado. */
  function registrarHoy({ hechos = 0, total = 0, grupos = [] } = {}) {
    const dias = leer();
    const k = clave(new Date());

    if (hechos <= 0) {
      // Si desmarcó todo, el día deja de contar.
      if (dias[k]) { delete dias[k]; escribir(dias); }
      return calcular();
    }

    const previo = dias[k] || {};
    dias[k] = {
      h: hechos,
      t: total || previo.t || hechos,
      g: grupos.slice(0, 4)
    };
    escribir(dias);
    return calcular();
  }

  /* Marca un día a mano (por si quiere corregir el historial). */
  function marcarDia(fechaISO, { hechos = 1, total = 1, grupos = [] } = {}) {
    const dias = leer();
    dias[fechaISO] = { h: hechos, t: total, g: grupos };
    escribir(dias);
    return calcular();
  }

  function borrarDia(fechaISO) {
    const dias = leer();
    delete dias[fechaISO];
    escribir(dias);
    return calcular();
  }

  /* ---------- Cálculo ---------- */

  function entrenado(dias, fecha) {
    const r = dias[clave(fecha)];
    if (!r) return false;
    const total = r.t || 0;
    if (!total) return r.h > 0;
    return (r.h / total) >= UMBRAL;
  }

  /* Recorre hacia atrás desde hoy:
       · día entrenado          -> suma
       · día de descanso        -> se salta, la racha sigue viva
       · día hábil sin entrenar -> corta (salvo que sea hoy mismo, que
                                   todavía tiene horas por delante)     */
  function calcular() {
    const dias = leer();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    let actual = 0;
    let cursor = new Date(hoy);
    let esHoy = true;

    for (let i = 0; i < MAX_DIAS; i++) {
      if (entrenado(dias, cursor)) {
        actual++;
      } else if (esDescanso(cursor)) {
        // descanso programado: no suma pero no rompe
      } else if (esHoy) {
        // el día aún no termina: no lo tomamos como fallo
      } else {
        break;
      }
      esHoy = false;
      cursor = new Date(cursor.getTime() - DIA_MS);
      cursor.setHours(0, 0, 0, 0);
    }

    let mejor = 0;
    try { mejor = Number(localStorage.getItem(LLAVE_MEJOR)) || 0; } catch (e) {}
    if (actual > mejor) {
      mejor = actual;
      try { localStorage.setItem(LLAVE_MEJOR, String(mejor)); } catch (e) {}
    }

    const claves = Object.keys(dias).sort();
    return {
      actual,
      mejor,
      entrenoHoy: entrenado(dias, hoy),
      diasTotales: claves.length,
      ultimoDia: claves.length ? claves[claves.length - 1] : null,
      enRiesgo: !entrenado(dias, hoy) && !esDescanso(hoy) && actual > 0
    };
  }

  /* Días entrenados de la semana en curso (lunes a domingo),
     para pintar la lista de la semana en Inicio. */
  function semana() {
    const dias = leer();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));

    const salida = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes.getTime() + i * DIA_MS);
      const k = clave(d);
      salida.push({
        fecha: k,
        entrenado: entrenado(dias, d),
        descanso: esDescanso(d),
        futuro: d > hoy,
        grupos: (dias[k] && dias[k].g) || []
      });
    }
    return salida;
  }

  /* ---------- Texto para la tarjeta ---------- */

  function etiqueta() {
    const r = calcular();
    if (r.actual === 0) return { numero: 0, unidad: 'días', pie: 'Empieza hoy' };
    if (r.enRiesgo)     return { numero: r.actual, unidad: 'días', pie: 'Hoy la sostienes' };
    return { numero: r.actual, unidad: r.actual === 1 ? 'día' : 'días', pie: 'Récord: ' + r.mejor };
  }

  /* ---------- Sincronización con Firestore ---------- */

  function datos() { return leer(); }

  /* Al iniciar sesión: mezcla lo que venga de la nube con lo local.
     Gana el registro con más ejercicios hechos ese día. */
  function fusionar(remotos) {
    if (!remotos || typeof remotos !== 'object') return leer();
    const dias = leer();
    Object.keys(remotos).forEach(k => {
      const r = remotos[k], l = dias[k];
      if (!l || (r && (r.h || 0) > (l.h || 0))) dias[k] = r;
    });
    return escribir(dias);
  }

  function configurar({ diasDescanso, umbral } = {}) {
    if (Array.isArray(diasDescanso)) DIAS_DESCANSO = diasDescanso;
    if (typeof umbral === 'number') UMBRAL = umbral;
  }

  const api = {
    registrarHoy, marcarDia, borrarDia, calcular, semana, etiqueta,
    datos, fusionar, configurar, clave, desdeClave,
    alCambiar: null
  };
  return api;
})();

if (typeof window !== 'undefined') window.FORJARacha = FORJARacha;
if (typeof module !== 'undefined' && module.exports) module.exports = FORJARacha;
