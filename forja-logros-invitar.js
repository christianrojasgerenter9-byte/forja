/* ============================================================
   FORJA · Invitar amigos desde Logros
   Módulo aislado (mismo patrón que forja-box.js):
   - Se acopla automáticamente al apartado de Logros/Retos si ya
     existe (creado por forja-retos.js) o crea la vista #view-logros
     si aún no está montada.
   - Añade también acceso directo en el modal de nuevo récord (#recModal).
   - Se conecta con el sistema de referidos (?ref=UID&de=Nombre)
     para sumar 10 días de FORJA PRO por cada amigo que entrene.
   - Incluye 3 mensajes listos, compartir por WhatsApp, Web Share,
     copiado de enlace y tarjeta visual descargable/compartible.
   ============================================================ */
(function () {
  "use strict";
  if (window.FORJAInvitarLogros) return;

  const URL_APP = "https://christianrojasgerenter9-byte.github.io/forja/";
  const STORAGE_ENVIADAS = "forja_inv_enviadas";
  const STORAGE_PREMIADOS = "forja_inv_premiados";

  /* ---------- Lectura segura de estado global de FORJA ---------- */
  function getFbUser() {
    try { return typeof fbUser !== "undefined" ? fbUser : null; } catch (e) { return null; }
  }
  function getFbDB() {
    try { return typeof fbDB !== "undefined" ? fbDB : null; } catch (e) { return null; }
  }
  function getNombreUsuario() {
    try {
      if (typeof displayName !== "undefined" && displayName) return String(displayName).trim();
    } catch (e) {}
    try {
      const u = getFbUser();
      if (u && u.displayName) return String(u.displayName).trim();
      if (u && u.email) return String(u.email).split("@")[0];
    } catch (e) {}
    try {
      const el = document.getElementById("userName");
      if (el && el.textContent && el.textContent.trim() !== "—") return el.textContent.trim();
    } catch (e) {}
    return "";
  }
  function getPrimerNombre() {
    const n = getNombreUsuario();
    return n ? n.split(/\s+/)[0] : "";
  }
  function getRachaActual() {
    try {
      if (typeof FORJARacha !== "undefined" && typeof FORJARacha.etiqueta === "function") {
        return Number(FORJARacha.etiqueta().numero) || 0;
      }
    } catch (e) {}
    return 0;
  }
  function getTotalSeries() {
    try {
      const s = typeof series !== "undefined" && series ? series : JSON.parse(localStorage.getItem("forja_series") || "{}");
      let total = 0;
      Object.keys(s).forEach(function (f) {
        Object.keys(s[f] || {}).forEach(function (ex) {
          total += (s[f][ex] || []).length;
        });
      });
      return total;
    } catch (e) { return 0; }
  }
  function getTotalPRs() {
    try {
      const p = typeof prs !== "undefined" && prs ? prs : JSON.parse(localStorage.getItem("forja_prs") || "{}");
      return Object.keys(p || {}).length;
    } catch (e) { return 0; }
  }
  function leerNum(clave) {
    try { return Math.max(0, Number(localStorage.getItem(clave)) || 0); } catch (e) { return 0; }
  }
  function guardarNum(clave, val) {
    try { localStorage.setItem(clave, String(Math.max(0, Number(val) || 0))); } catch (e) {}
  }

  /* ---------- Estado del módulo ---------- */
  let estado = {
    estilo: "juntos", // 'juntos' | 'racha' | 'logros'
    enviadas: leerNum(STORAGE_ENVIADAS),
    premiados: leerNum(STORAGE_PREMIADOS),
    cargandoNube: false
  };

  /* ---------- Enlace personal de invitación ---------- */
  function construirEnlace() {
    const u = getFbUser();
    const nom = getPrimerNombre();
    const params = [];
    if (u && u.uid) params.push("ref=" + encodeURIComponent(u.uid));
    if (nom) params.push("de=" + encodeURIComponent(nom));
    return URL_APP + (params.length ? "?" + params.join("&") : "");
  }

  /* ---------- Plantillas de mensaje ---------- */
  function construirMensaje(tipo) {
    const racha = getRachaActual();
    const nSeries = getTotalSeries();
    const nPrs = getTotalPRs();
    const enlace = construirEnlace();

    if (tipo === "racha") {
      const pref = racha > 0
        ? "Llevo " + racha + (racha === 1 ? " día" : " días") + " de racha entrenando en FORJA 🔥 "
        : "Ya empecé mi racha de entrenamiento en FORJA 🔥 ";
      return pref + "¿Te animas a entrenar conmigo y ver quién aguanta más? Pruébala gratis 21 días con mi enlace: " + enlace;
    }
    if (tipo === "logros") {
      const detalle = nPrs > 0
        ? "Ya llevo " + nPrs + (nPrs === 1 ? " récord personal" : " récords personales") + " en FORJA 🏆 "
        : (nSeries > 0 ? "Ya registré " + nSeries + " series en FORJA 🏆 " : "Estoy desbloqueando mis logros en FORJA 🏆 ");
      return detalle + "Únete con mi enlace, arma tu rutina en gym, casa o calistenia y entrena conmigo (21 días gratis): " + enlace;
    }
    return "Estoy entrenando con FORJA 💪 Rutinas para gym, casa, calistenia y box, con control de progreso y récords. Pruébala gratis 21 días con mi enlace y entrenemos juntos: " + enlace;
  }

  /* ---------- Notificación flotante (sin alert) ---------- */
  let toastTimer = null;
  function mostrarToast(texto) {
    let t = document.getElementById("fjInvToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "fjInvToast";
      t.className = "fj-inv-toast";
      document.body.appendChild(t);
    }
    t.textContent = texto;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }

  function registrarEnvio() {
    estado.enviadas += 1;
    guardarNum(STORAGE_ENVIADAS, estado.enviadas);
    actualizarUI();
  }

  /* ---------- Acciones de invitación ---------- */
  async function invitarNativo(tipo) {
    const msg = construirMensaje(tipo || estado.estilo);
    const url = construirEnlace();
    const soloTexto = msg.replace(url, "").trim();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Entrena conmigo en FORJA", text: soloTexto, url: url });
        registrarEnvio();
        mostrarToast("¡Invitación enviada! Cuando tu amigo entrene ganas 10 días PRO 🔥");
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    invitarWhatsApp(tipo || estado.estilo);
  }

  function invitarWhatsApp(tipo) {
    const msg = construirMensaje(tipo || estado.estilo);
    registrarEnvio();
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
    mostrarToast("Abriendo WhatsApp con tu invitación… 💪");
  }

  async function copiarEnlace() {
    const url = construirEnlace();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      registrarEnvio();
      mostrarToast("Enlace copiado. ¡Pégalo en el chat de tu amigo! 🔗");
    } catch (e) {
      mostrarToast("No se pudo copiar automáticamente. Cópialo desde la casilla.");
    }
  }

  /* ---------- Tarjeta visual compartible (1080×1350) ---------- */
  async function compartirTarjeta(btn) {
    const textoOrig = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Creando tarjeta…"; }
    try {
      const W = 1080, H = 1350;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d");

      // Fondo oscuro FORJA
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#050A10");
      bg.addColorStop(0.55, "#0E1C14");
      bg.addColorStop(1, "#050A10");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Resplandor verde FORJA
      const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 560);
      glow.addColorStop(0, "rgba(142,224,74,0.28)");
      glow.addColorStop(1, "rgba(142,224,74,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Emblema si está disponible
      try {
        const resp = await fetch("forja-emblema.png");
        if (resp.ok) {
          const bmp = await createImageBitmap(await resp.blob());
          ctx.drawImage(bmp, (W - 160) / 2, 110, 160, 160);
        }
      } catch (e) {}

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const F_TIT = '900 72px Anton, Impact, "Arial Black", sans-serif';
      const F_BODY = '700 40px Inter, system-ui, sans-serif';

      ctx.fillStyle = "#8EE04A";
      ctx.font = '900 58px Anton, Impact, sans-serif';
      ctx.fillText("F O R J A", W / 2, 290);

      const nom = getPrimerNombre();
      ctx.fillStyle = "#E6EBDD";
      ctx.font = F_TIT;
      ctx.fillText(nom ? nom.toUpperCase() + " TE INVITA" : "ENTRENA CONMIGO", W / 2, 420);

      ctx.fillStyle = "#C4F07A";
      ctx.font = '900 84px Anton, Impact, sans-serif';
      ctx.fillText("A FORJAR TU MEJOR VERSIÓN", W / 2, 515);

      // Insignia de 21 días gratis
      ctx.fillStyle = "rgba(142,224,74,0.16)";
      ctx.strokeStyle = "#8EE04A";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(170, 670, W - 340, 120, 60);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E6EBDD";
      ctx.font = '800 44px Inter, system-ui, sans-serif';
      ctx.fillText("🔥 21 DÍAS GRATIS CON MI ENLACE", W / 2, 706);

      ctx.fillStyle = "#AEB8A2";
      ctx.font = F_BODY;
      ctx.fillText("Gimnasio · En casa · Calistenia · Box", W / 2, 860);
      ctx.fillText("Rutinas guiadas · Récords · Progreso", W / 2, 925);

      const racha = getRachaActual();
      if (racha > 0) {
        ctx.fillStyle = "#8EE04A";
        ctx.font = '800 42px Inter, system-ui, sans-serif';
        ctx.fillText("Mi racha actual: " + racha + (racha === 1 ? " día activo" : " días activos"), W / 2, 1040);
      }

      ctx.fillStyle = "#E6EBDD";
      ctx.font = '700 32px Inter, system-ui, sans-serif';
      ctx.fillText("christianrojasgerenter9-byte.github.io/forja", W / 2, 1210);

      const blob = await new Promise(function (ok) { cv.toBlob(ok, "image/jpeg", 0.92); });
      const file = new File([blob], "invitacion-forja.jpg", { type: "image/jpeg" });
      const texto = construirMensaje(estado.estilo);

      try { await navigator.clipboard.writeText(texto); } catch (e) {}

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Entrena conmigo en FORJA", text: texto });
        registrarEnvio();
        mostrarToast("¡Tarjeta compartida! Tu enlace también quedó copiado 🔥");
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "invitacion-forja.jpg";
        a.click();
        registrarEnvio();
        mostrarToast("Tarjeta descargada y mensaje copiado. ¡Compártela en tus redes! 📸");
      }
    } catch (e) {
      if (!(e && e.name === "AbortError")) {
        mostrarToast("No se pudo generar la tarjeta. Usa el botón de WhatsApp o Copiar.");
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = textoOrig; }
    }
  }

  /* ---------- Sincronizar amigos premiados desde Firestore ---------- */
  function cargarPremiadosNube() {
    if (estado.cargandoNube) return;
    const u = getFbUser();
    const db = getFbDB();
    if (!u || !db) return;
    estado.cargandoNube = true;
    db.collection("usuarios").doc(u.uid).get().then(function (snap) {
      if (snap.exists) {
        const d = snap.data() || {};
        const n = Number(d.referidosPremiados) || 0;
        if (n !== estado.premiados) {
          estado.premiados = n;
          guardarNum(STORAGE_PREMIADOS, n);
          actualizarUI();
        }
      }
    }).catch(function () {}).finally(function () { estado.cargandoNube = false; });
  }

  /* ---------- Construcción de la tarjeta "Invita a tus amigos" ---------- */
  function crearTarjetaInvitar() {
    const card = document.createElement("div");
    card.id = "fjInvitarLogros";
    card.className = "fj-inv-card";
    card.innerHTML =
      '<div class="fj-inv-head">' +
        '<div class="fj-inv-ico" aria-hidden="true">🤝</div>' +
        '<div>' +
          '<span class="eyebrow">Entrena en equipo</span>' +
          '<h3 class="fj-inv-tit">Invita a tus amigos a FORJA</h3>' +
          '<p class="fj-inv-sub">Por cada amigo que se registre con tu enlace y haga su primer entrenamiento, <b>ganas 10 días de FORJA PRO</b>. Sin límite.</p>' +
        '</div>' +
      '</div>' +
      '<div class="fj-inv-stats">' +
        '<div class="fj-inv-stat"><b id="fjInvPremiados">0</b><span>Amigos entrenando</span></div>' +
        '<div class="fj-inv-stat"><b id="fjInvDias">0</b><span>Días PRO ganados</span></div>' +
        '<div class="fj-inv-stat"><b id="fjInvEnviadas">0</b><span>Invitaciones enviadas</span></div>' +
      '</div>' +
      '<div class="fj-inv-label">Elige el mensaje de invitación:</div>' +
      '<div class="fj-inv-estilos">' +
        '<button type="button" class="fj-inv-chip on" data-est="juntos">💪 Entrenar juntos</button>' +
        '<button type="button" class="fj-inv-chip" data-est="racha">🔥 Reto de racha</button>' +
        '<button type="button" class="fj-inv-chip" data-est="logros">🏆 Presumir logros</button>' +
      '</div>' +
      '<div class="fj-inv-preview" id="fjInvPreview"></div>' +
      '<div class="fj-inv-linkbox">' +
        '<input type="text" id="fjInvUrl" readonly aria-label="Tu enlace personal de invitación">' +
        '<button type="button" id="fjInvCopy">Copiar</button>' +
      '</div>' +
      '<div class="fj-inv-actions">' +
        '<button type="button" class="btn btn-wa fj-inv-wa" id="fjInvWa">Enviar por WhatsApp</button>' +
        '<button type="button" class="btn btn-molten" id="fjInvShare">Compartir enlace</button>' +
        '<button type="button" class="btn btn-ghost" id="fjInvCardBtn">📸 Tarjeta para historias</button>' +
      '</div>' +
      '<div class="fj-inv-badges" id="fjInvBadges"></div>';

    card.querySelectorAll("[data-est]").forEach(function (b) {
      b.addEventListener("click", function () {
        estado.estilo = b.dataset.est;
        card.querySelectorAll("[data-est]").forEach(function (x) {
          x.classList.toggle("on", x.dataset.est === estado.estilo);
        });
        actualizarUI();
      });
    });

    card.querySelector("#fjInvWa").addEventListener("click", function () { invitarWhatsApp(estado.estilo); });
    card.querySelector("#fjInvShare").addEventListener("click", function () { invitarNativo(estado.estilo); });
    card.querySelector("#fjInvCopy").addEventListener("click", copiarEnlace);
    card.querySelector("#fjInvCardBtn").addEventListener("click", function () { compartirTarjeta(this); });

    const urlInput = card.querySelector("#fjInvUrl");
    urlInput.addEventListener("click", function () { this.select(); });

    return card;
  }

  /* ---------- Logros sociales (reclutamiento) ---------- */
  function renderLogrosSociales(box) {
    if (!box) return;
    const metas = [
      { ico: "📣", t: "Primera invitación", d: "Comparte tu enlace con un amigo", ok: estado.enviadas >= 1 || estado.premiados >= 1 },
      { ico: "🤜🤛", t: "Compañero de entreno", d: "1 amigo entrenando en FORJA", ok: estado.premiados >= 1 },
      { ico: "🛡️", t: "Escuadrón FORJA", d: "3 amigos entrenando (+30 días PRO)", ok: estado.premiados >= 3 },
      { ico: "👑", t: "Capitán de la Forja", d: "5 amigos entrenando (+50 días PRO)", ok: estado.premiados >= 5 }
    ];
    box.innerHTML =
      '<div class="fj-inv-label" style="margin-top:4px">Logros de comunidad</div>' +
      '<div class="fj-inv-bgrid">' +
      metas.map(function (m) {
        return '<div class="fj-inv-badge' + (m.ok ? " ok" : "") + '">' +
          '<span class="bi">' + m.ico + '</span>' +
          '<div><b>' + m.t + '</b><span>' + m.d + '</span></div>' +
          '<span class="bs">' + (m.ok ? "✓" : "🔒") + '</span>' +
        '</div>';
      }).join("") +
      '</div>';
  }

  function actualizarUI() {
    const card = document.getElementById("fjInvitarLogros");
    if (!card) return;
    const pEl = card.querySelector("#fjInvPremiados");
    const dEl = card.querySelector("#fjInvDias");
    const eEl = card.querySelector("#fjInvEnviadas");
    const prEl = card.querySelector("#fjInvPreview");
    const uEl = card.querySelector("#fjInvUrl");

    if (pEl) pEl.textContent = String(estado.premiados);
    if (dEl) dEl.textContent = String(estado.premiados * 10);
    if (eEl) eEl.textContent = String(estado.enviadas);
    if (prEl) prEl.textContent = construirMensaje(estado.estilo);
    if (uEl) uEl.value = construirEnlace();

    renderLogrosSociales(card.querySelector("#fjInvBadges"));
  }

  /* ---------- Búsqueda del apartado de Logros existente ---------- */
  function encontrarContenedorLogros() {
    const ids = ["view-logros", "view-retos", "view-insignias", "logros", "retos"];
    for (let i = 0; i < ids.length; i++) {
      const el = document.getElementById(ids[i]);
      if (el) return el;
    }
    // Buscar cualquier sección .view cuyo encabezado hable de logros o retos
    const vistas = document.querySelectorAll(".view");
    for (let j = 0; j < vistas.length; j++) {
      const h = vistas[j].querySelector("h1, h2, h3, .eyebrow");
      if (h && /logro|reto|medalla|insignia/i.test(h.textContent || "")) {
        return vistas[j];
      }
    }
    return null;
  }

  /* ---------- Vista de respaldo si aún no existe #view-logros ---------- */
  function crearVistaLogrosRespaldo() {
    const main = document.querySelector("main.content");
    if (!main || document.getElementById("view-logros")) return null;

    const sec = document.createElement("section");
    sec.className = "view";
    sec.id = "view-logros";
    sec.innerHTML =
      '<div class="section-head">' +
        '<div><span class="eyebrow">Tu camino en la forja</span><h2>Logros</h2></div>' +
      '</div>';
    main.appendChild(sec);

    // Agregar botón en barra lateral (PC)
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && !sidebar.querySelector('[data-go="logros"]')) {
      const refBtn = sidebar.querySelector('[data-go="progreso"]');
      const btn = document.createElement("button");
      btn.className = "nav-btn";
      btn.dataset.go = "logros";
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3"/></svg> Logros';
      btn.addEventListener("click", function () {
        if (typeof go === "function") go("logros");
        cargarPremiadosNube();
        actualizarUI();
      });
      if (refBtn && refBtn.nextSibling) sidebar.insertBefore(btn, refBtn.nextSibling);
      else sidebar.appendChild(btn);
    }

    // Agregar botón en barra inferior (móvil)
    const bnav = document.querySelector(".bottomnav");
    if (bnav && !bnav.querySelector('[data-go="logros"]')) {
      const btnM = document.createElement("button");
      btnM.className = "bn-btn";
      btnM.dataset.go = "logros";
      btnM.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/></svg>Logros';
      btnM.addEventListener("click", function () {
        if (typeof go === "function") go("logros");
        cargarPremiadosNube();
        actualizarUI();
      });
      bnav.appendChild(btnM);
    }

    return sec;
  }

  /* ---------- Montaje dentro de Logros + Modal de Récord ---------- */
  function montarEnLogros(crearSiNoExiste) {
    if (document.getElementById("fjInvitarLogros")) {
      actualizarUI();
      return true;
    }
    let destino = encontrarContenedorLogros();
    if (!destino && crearSiNoExiste) {
      destino = crearVistaLogrosRespaldo();
    }
    if (!destino) return false;

    const card = crearTarjetaInvitar();
    const head = destino.querySelector(".section-head");
    if (head && head.nextSibling) {
      destino.insertBefore(card, head.nextSibling);
    } else {
      destino.appendChild(card);
    }
    cargarPremiadosNube();
    actualizarUI();
    return true;
  }

  function reforzarModalRecord() {
    const btns = document.querySelector("#recModal .rec-btns");
    if (!btns || document.getElementById("recInvitarApp")) return;
    const b = document.createElement("button");
    b.id = "recInvitarApp";
    b.type = "button";
    b.className = "rec-wa";
    b.style.borderColor = "var(--orange)";
    b.textContent = "🤝 Invitar amigo a entrenar (+10 días PRO)";
    b.addEventListener("click", function () { invitarNativo("logros"); });
    btns.appendChild(b);
  }

  /* ---------- Estilos propios (coherentes con las variables de FORJA) ---------- */
  function inyectarEstilos() {
    if (document.getElementById("fjInvLogrosCSS")) return;
    const st = document.createElement("style");
    st.id = "fjInvLogrosCSS";
    st.textContent =
      ".fj-inv-card{background:radial-gradient(520px 240px at 100% 0%,rgba(142,224,74,.18),transparent 62%),var(--surface);border:1px solid rgba(142,224,74,.45);border-radius:var(--radius);padding:20px;margin:16px 0 20px;display:flex;flex-direction:column;gap:14px}" +
      ".fj-inv-head{display:flex;align-items:flex-start;gap:13px}" +
      ".fj-inv-ico{width:46px;height:46px;border-radius:14px;background:var(--molten);display:grid;place-items:center;font-size:23px;flex-shrink:0;box-shadow:var(--glow)}" +
      ".fj-inv-tit{font-family:'Anton',sans-serif;font-size:24px;letter-spacing:.5px;margin:3px 0 4px}" +
      ".fj-inv-sub{font-size:13.5px;color:var(--muted);line-height:1.45;margin:0}" +
      ".fj-inv-sub b{color:var(--amber)}" +
      ".fj-inv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}" +
      ".fj-inv-stat{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:11px 8px;text-align:center}" +
      ".fj-inv-stat b{display:block;font-family:'Anton',sans-serif;font-size:26px;line-height:1;color:var(--orange)}" +
      ".fj-inv-stat span{display:block;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-top:4px}" +
      ".fj-inv-label{font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted-2)}" +
      ".fj-inv-estilos{display:flex;flex-wrap:wrap;gap:7px}" +
      ".fj-inv-chip{padding:8px 13px;border-radius:99px;border:1px solid var(--line);background:var(--surface-2);color:var(--muted);font-size:12.5px;font-weight:700;cursor:pointer;transition:.15s}" +
      ".fj-inv-chip:hover{color:var(--text);border-color:var(--muted-2)}" +
      ".fj-inv-chip.on{background:var(--molten);color:#fff;border-color:transparent;box-shadow:var(--glow)}" +
      ".fj-inv-preview{background:var(--field-bg,#0F130F);border:1px dashed var(--line);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--muted-2);line-height:1.45;word-break:break-word}" +
      ".fj-inv-linkbox{display:flex;gap:8px;align-items:stretch}" +
      ".fj-inv-linkbox input{flex:1;min-width:0;background:var(--field-bg,#0F130F);border:1px solid var(--line);border-radius:11px;padding:10px 12px;color:var(--text);font-size:12.5px}" +
      ".fj-inv-linkbox button{padding:0 16px;border-radius:11px;background:var(--surface-2);border:1px solid var(--line);color:var(--text);font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap}" +
      ".fj-inv-linkbox button:hover{border-color:var(--orange);color:var(--orange)}" +
      ".fj-inv-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}" +
      ".fj-inv-bgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:9px;margin-top:8px}" +
      ".fj-inv-badge{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line);opacity:.72}" +
      ".fj-inv-badge.ok{opacity:1;border-color:rgba(142,224,74,.55);background:var(--molten-soft)}" +
      ".fj-inv-badge .bi{font-size:21px;line-height:1;flex-shrink:0}" +
      ".fj-inv-badge b{display:block;font-size:13px;line-height:1.25}" +
      ".fj-inv-badge span{display:block;font-size:11.5px;color:var(--muted);line-height:1.3}" +
      ".fj-inv-badge .bs{margin-left:auto;font-size:14px;font-weight:800;color:var(--green)}" +
      ".fj-inv-toast{position:fixed;left:50%;bottom:calc(82px + env(safe-area-inset-bottom));transform:translate(-50%,16px);z-index:9999;background:var(--surface-solid,#121612);border:1px solid var(--orange);color:var(--text);padding:11px 18px;border-radius:99px;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;max-width:90vw;text-align:center}" +
      ".fj-inv-toast.show{opacity:1;transform:translate(-50%,0)}" +
      "@media(max-width:520px){.fj-inv-stats{grid-template-columns:1fr}.fj-inv-actions{grid-template-columns:1fr}}";
    document.head.appendChild(st);
  }

  /* ---------- Arranque y observador ---------- */
  function iniciar() {
    inyectarEstilos();
    reforzarModalRecord();

    // Intento inmediato por si forja-retos.js ya montó el apartado de Logros
    if (!montarEnLogros(false)) {
      // Observa si forja-retos.js crea la vista de logros unos milisegundos después
      try {
        const obs = new MutationObserver(function () {
          if (montarEnLogros(false)) obs.disconnect();
        });
        obs.observe(document.body, { childList: true, subtree: true });
        // Si tras 1.2 s no existe ningún apartado de logros, crea #view-logros
        setTimeout(function () {
          obs.disconnect();
          montarEnLogros(true);
        }, 1200);
      } catch (e) {
        montarEnLogros(true);
      }
    }

    // Refresca el enlace y los contadores cuando Firebase termina de iniciar sesión
    try {
      if (typeof fbAuth !== "undefined" && fbAuth) {
        fbAuth.onAuthStateChanged(function () {
          cargarPremiadosNube();
          actualizarUI();
        });
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  window.FORJAInvitarLogros = {
    invitar: invitarNativo,
    whatsapp: invitarWhatsApp,
    copiar: copiarEnlace,
    actualizar: actualizarUI
  };
})();