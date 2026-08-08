/* ============================================================
   FORJA — Service Worker
   Sube la VERSION cada vez que publiques cambios: eso invalida
   el caché viejo y todos reciben la app nueva en la siguiente carga.

   Regla de oro: aquí solo vive la cáscara (HTML, íconos, fuentes).
   Nada de Firestore ni de contenido PRO pasa por el caché.
   ============================================================ */

const VERSION = 'forja-v11';
const CACHE_SHELL = `${VERSION}-shell`;
const CACHE_EXTERNO = `${VERSION}-externo`;

const CASCARA = [
  './',
  './index.html',
  './forja-racha.js',
  './manifest.json',
  './forja-icono-192.png',
  './forja-icono-512.png',
  './forja-icono-maskable-512.png'
];

// Librerias externas: no son datos del usuario, son codigo estatico.
// Guardarlas permite que la app abra completa sin conexion.
const EXTERNOS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics-compat.js',
  'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap'
];

// Solo los ENDPOINTS de datos quedan fuera del caché: sesión, cuentas y Firestore.
// Ojo: aquí no va 'firebase' a secas, porque eso también bloqueaba las
// librerías de gstatic y la app no abría sin conexión.
const SIEMPRE_EN_VIVO = [
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firebaseremoteconfig.googleapis.com',
  'identitytoolkit',
  'securetoken',
  'google-analytics.com',
  'googletagmanager.com'
];

/* ---------- Instalación ---------- */

self.addEventListener('install', evento => {
  evento.waitUntil((async () => {
    const shell = await caches.open(CACHE_SHELL);
    // Uno por uno: si un archivo falla, no se cae el precacheo completo.
    await Promise.all(CASCARA.map(u =>
      shell.add(u).catch(e => console.warn('FORJA SW: no se guardó', u, e))));

    const externo = await caches.open(CACHE_EXTERNO);
    await Promise.all(EXTERNOS.map(u =>
      fetch(u, { mode: 'cors' })
        .then(r => (r && r.ok) ? externo.put(u, r) : null)
        .catch(() => fetch(u, { mode: 'no-cors' })
          .then(r => externo.put(u, r)).catch(() => null))));

    await self.skipWaiting();
  })());
});

/* ---------- Activación: limpia versiones anteriores ---------- */

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(llaves => Promise.all(
        llaves.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- Estrategias ---------- */

function esEnVivo(url) {
  return SIEMPRE_EN_VIVO.some(d => url.includes(d));
}

// Navegación: red primero, caché como respaldo. Así los cambios llegan
// de inmediato y sin conexión sigue abriendo.
async function redPrimero(peticion) {
  const cache = await caches.open(CACHE_SHELL);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta && respuesta.ok) cache.put('./index.html', respuesta.clone());
    return respuesta;
  } catch (e) {
    return (await cache.match('./index.html')) ||
           (await cache.match('./')) ||
           new Response('Sin conexión y sin copia local.', {
             status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
           });
  }
}

// Estáticos: responde del caché al instante y actualiza por detrás.
async function cacheYActualiza(peticion, nombreCache) {
  const cache = await caches.open(nombreCache);
  const enCache = await cache.match(peticion);
  const enRed = fetch(peticion)
    .then(r => {
      if (r && (r.ok || r.type === 'opaque')) cache.put(peticion, r.clone());
      return r;
    })
    .catch(() => null);
  return enCache || (await enRed) || Response.error();
}

self.addEventListener('fetch', evento => {
  const { request } = evento;
  const url = request.url;

  if (request.method !== 'GET') return;          // POST/PUT van directo a la red
  if (esEnVivo(url)) return;                     // Firestore y auth, sin tocar

  if (request.mode === 'navigate') {
    evento.respondWith(redPrimero(request));
    return;
  }

  const mismoOrigen = new URL(url).origin === self.location.origin;
  evento.respondWith(
    cacheYActualiza(request, mismoOrigen ? CACHE_SHELL : CACHE_EXTERNO)
  );
});

/* ---------- Mensajes desde la app ---------- */

self.addEventListener('message', evento => {
  if (evento.data === 'actualizar-ya') self.skipWaiting();
});
