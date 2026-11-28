
(function () {
  "use strict";

  if (window.FORJAYoga) return;
  const POSTURAS_YOGA = {
    perro_abajo: {
      nombre: "perro boca abajo",
      segundos: 30,
      respiracion: "Inhala al alargar la espalda, exhala bajando talones con suavidad."
    },
    cobra: {
      nombre: "cobra suave",
      segundos: 25,
      respiracion: "Inhala abriendo el pecho sin forzar lumbar, exhala al bajar."
    }
  };
  function renderizarRutina(contenedor) {
    if (!contenedor) return;

    const tarjetas = Object.entries(POSTURAS_YOGA)
      .map(function ([clave, postura]) {
        return (
          "<div style=\"border:1px solid #2b332e;border-radius:12px;padding:12px;margin-bottom:10px;\">" +
          "<strong>" + postura.nombre + "</strong> (" + postura.segundos + "s)<br>" +
          "<small>" + postura.respiracion + "</small><br>" +
          "<button type=\"button\" data-postura=\"" + clave + "\">Iniciar</button>" +
          "</div>"
        );
      })
      .join("");

    contenedor.innerHTML =
      "<section id=\"forja-yoga-app\">" +
      tarjetas +
      "<div id=\"forja-yoga-timer\" style=\"margin-top:12px;padding:12px;border-radius:10px;background:#0b0e0c;color:#fff;display:none;\"><\div>" +
      "<\section>";

    contenedor.querySelectorAll("button[data-postura]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        const clave = boton.getAttribute("data-postura");
        iniciarTemporizador(POSTURAS_YOGA[clave]);
      });
    }); let intervaloYoga = null;

    function iniciarTemporizador(postura) {
      const caja = document.getElementById("forja-yoga-timer");
      if (!postura || !caja) return;

      if (intervaloYoga) clearInterval(intervaloYoga);

      let restante = postura.segundos;
      caja.style.display = "block";
      caja.innerHTML = "<strong>" + postura.nombre + ":</strong> <span id=\"yoga-seg\">" + restante + "</span>s";

      intervaloYoga = setInterval(function () {
        restante -= 1;
        const span = document.getElementById("yoga-seg");
        if (span) span.textContent = String(restante);

        if (restante <= 0) {
          clearInterval(intervaloYoga);
          caja.innerHTML = "<strong>¡Listo!</strong> Completaste <strong>" + postura.nombre + "</strong>.";
        }
      }, 1000);
    }
    function montarModulo() {
      // Busca un contenedor existente o usa el body como respaldo seguro
      const destino = document.getElementById("vista-yoga") || document.body; renderizarRutina(destino);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", montarModulo);
    } else {
      montarModulo();
    }



    window.FORJAYoga = {
      montar: montarModulo,
      posturas: POSTURAS_YOGA
    };
  }) ()