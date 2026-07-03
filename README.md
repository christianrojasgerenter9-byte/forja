# 🔥 FORJA — Sistema de Entrenamiento Físico

App web de entrenamiento físico que funciona en **PC y celular** desde un solo archivo, sin instalar nada. Rutinas guiadas, control de progreso, calorías, dieta y comunicación con coaches — con una estética *molten* de alto impacto (negro obsidiana + degradado naranja→magenta).

> **Demo en vivo:** 👉 https://christianrojasgerenter9-byte.github.io/forja/
---

## ✨ Características

- **🏋️ Rutinas** de brazo, pierna, hombro, espalda y abdomen. Cada ejercicio muestra series, reps, **máximo de repeticiones** y enlace directo a **YouTube** para ver la técnica correcta.
- **🏆 Récord Personal (PR)** editable por ejercicio, guardado en el dispositivo.
- **📈 Progreso** — registra peso y reps; se grafica el volumen por sesión con historial.
- **🔥 Calculadora de calorías** con fórmula real (Mifflin-St Jeor): BMR, TDEE, meta diaria y macros.
- **🥗 Dieta** de 5 comidas que se ajusta a las calorías calculadas.
- **💬 Coaches** — chat interno + llamadas y **videollamadas** (plan PRO).
- **💳 Suscripción** Gratis vs PRO ($199 MXN/mes).
- **▶️ Playlist** directa de YouTube en la pantalla de inicio.
- **📱 100% responsivo** — menú lateral en escritorio, barra inferior en móvil.

---

## 🛠️ Tecnología

HTML + CSS + JavaScript **vanilla**, sin frameworks ni dependencias externas (solo Google Fonts). Todo en un archivo (`index.html`), fácil de desplegar en cualquier hosting estático.

El progreso, PRs y suscripción se guardan con `localStorage` (con respaldo en memoria para entornos restringidos).

---

## 🚀 Cómo publicarlo en GitHub Pages

1. Sube este repositorio a GitHub.
2. Ve a **Settings → Pages**.
3. En *Source*, elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. En 1–2 minutos tu app estará en línea en `https://TU-USUARIO.github.io/forja/`.

---

## ⚙️ Personalización rápida

Abre `index.html` y busca `const CONFIG` (arriba del `<script>`):

```js
const CONFIG = {
  YOUTUBE_PLAYLIST: "https://...",  // 👈 pega el link de TU playlist
  PRECIO_PRO: 199                    // precio del plan PRO (MXN/mes)
};
```

---

## 👤 Autor

**Christian Rojas** — Marketing, branding y desarrollo web.
📞 Contacto para el proyecto: **56 4646 3204**

## 📄 Licencia

© 2026 Christian Rojas. **Todos los derechos reservados.** Ver [LICENSE](LICENSE).
