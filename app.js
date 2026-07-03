/* ==========================================================================
   Alexfit - LÓGICA DE APLICACIÓN DE ENTRENAMIENTO Y NUTRICIÓN
   ========================================================================== */

// Estado Global de la Aplicación (con datos iniciales por defecto)
let appState = {
    user: {
        name: "Christian",
        status: "En volumen 💪"
    },
    metrics: {
        weightActual: 83.5,
        weightGoal: 95.0,
        armLeft: 37.0,
        armRight: 39.0
    },
    nutrition: {
        goalCalories: 2500,
        goalProtein: 160,
        goalCarbs: 300,
        goalFats: 70,
        foodLog: [
            { id: 1, name: "Avena con leche y plátano", kcal: 450, protein: 18, carbs: 70, fats: 8 },
            { id: 2, name: "Pechuga de pollo con arroz blanco", kcal: 650, protein: 48, carbs: 80, fats: 10 },
            { id: 3, name: "Licuado de proteína y crema de cacahuate", kcal: 500, protein: 35, carbs: 35, fats: 20 },
            { id: 4, name: "Huevo revuelto con pan integral", kcal: 250, protein: 19, carbs: 25, fats: 12 }
        ]
    },
    weightHistory: [
        { date: "2026-05-20", weight: 81.2 },
        { date: "2026-05-27", weight: 82.0 },
        { date: "2026-06-03", weight: 82.5 },
        { date: "2026-06-10", weight: 82.8 },
        { date: "2026-06-17", weight: 83.1 },
        { date: "2026-06-24", weight: 83.5 }
    ],
    calendarEvents: {
        // Formato: "YYYY-MM-DD": "completed" | "planned" | "rest"
        "2026-06-01": "completed",
        "2026-06-03": "completed",
        "2026-06-05": "completed",
        "2026-06-08": "completed",
        "2026-06-10": "completed",
        "2026-06-12": "completed",
        "2026-06-15": "completed",
        "2026-06-17": "completed",
        "2026-06-19": "completed",
        "2026-06-22": "completed",
        "2026-06-24": "completed",
        "2026-06-26": "planned",
        "2026-06-29": "planned"
    }
};

// Configuración del Calendario (Mes actual de visualización)
let currentCalendarDate = new Date(2026, 5, 24); // Junio 2026 (Meses son 0-indexados)

// Instancia del Temporizador de Descanso
let timerInterval = null;
let timerSecondsTotal = 90;
let timerSecondsRemaining = 90;
let timerIsRunning = false;

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadStateFromLocalStorage();
    initializeTabs();
    initializeModals();
    initializeMetricsForm();
    initializeFoodTracker();
    initializeWeightTracker();
    initializeRestTimer();
    initializeCalendar();
    
    // Renderizado Inicial
    updateDashboardUI();
    renderFoodLog();
    renderWeightChart();
    renderCalendar();
});

/* ==========================================================================
   PERSISTENCIA DE DATOS (localStorage)
   ========================================================================== */
function saveStateToLocalStorage() {
    localStorage.setItem("fitTrack_appState", JSON.stringify(appState));
}

function loadStateFromLocalStorage() {
    const saved = localStorage.getItem("fitTrack_appState");
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Error cargando el estado local, usando valores por defecto", e);
        }
    }
}

/* ==========================================================================
   CONTROLADOR DE PESTAÑAS (TAB SYSTEM)
   ========================================================================== */
function initializeTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabName = item.getAttribute("data-tab");
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Actualizar clase activa en botones de menú lateral
    document.querySelectorAll(".nav-item").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Cambiar visibilidad de las secciones de contenido
    document.querySelectorAll(".tab-content").forEach(section => {
        section.classList.remove("active");
    });
    
    const targetSection = document.getElementById(`tab-${tabName}`);
    if (targetSection) {
        targetSection.classList.add("active");
    }

    // Acciones especiales al cambiar de pestaña
    if (tabName === "progreso") {
        // Redibujar gráfico SVG por si cambió el tamaño del contenedor
        setTimeout(renderWeightChart, 50);
    } else if (tabName === "calendario") {
        renderCalendar();
    }
}

/* ==========================================================================
   ACTUALIZACIÓN DEL DASHBOARD PRINCIPAL
   ========================================================================== */
function updateDashboardUI() {
    // Nombre de usuario y estado
    document.getElementById("welcome-title").innerHTML = `¡Bienvenido, ${appState.user.name}! <span class="emoji">💪</span>`;
    document.getElementById("sidebar-user-name").textContent = appState.user.name;
    document.getElementById("sidebar-avatar").textContent = appState.user.name.charAt(0).toUpperCase();

    // Peso Actual y Meta
    const weightActual = appState.metrics.weightActual;
    const weightGoal = appState.metrics.weightGoal;
    document.getElementById("val-peso-actual").textContent = weightActual.toFixed(1);
    document.getElementById("val-peso-meta").textContent = weightGoal.toFixed(1);
    document.getElementById("progress-goal-txt").textContent = weightGoal.toFixed(1);

    // Calcular Diferencia de Peso
    const diff = weightGoal - weightActual;
    const diffStatus = document.getElementById("peso-diff-status");
    const weightRemaining = document.getElementById("peso-restante");
    
    if (diff > 0) {
        diffStatus.innerHTML = `<span>Gana masa muscular</span>`;
        diffStatus.className = "metric-trend positive";
        weightRemaining.textContent = `Faltan ${diff.toFixed(1)} kg`;
    } else if (diff < 0) {
        diffStatus.innerHTML = `<span>Déficit para definir</span>`;
        diffStatus.className = "metric-trend warning";
        weightRemaining.textContent = `Te sobran ${Math.abs(diff).toFixed(1)} kg`;
    } else {
        diffStatus.innerHTML = `<span>Peso ideal alcanzado</span>`;
        diffStatus.className = "metric-trend positive";
        weightRemaining.textContent = `¡En la meta!`;
    }

    // Brazos Izq y Der
    const armL = appState.metrics.armLeft;
    const armR = appState.metrics.armRight;
    document.getElementById("val-brazo-izq").textContent = armL.toFixed(1);
    document.getElementById("val-brazo-der").textContent = armR.toFixed(1);

    // Barra de Progreso Hacia la Meta (Fórmula: Peso actual / Peso Meta)
    let percent = (weightActual / weightGoal) * 100;
    if (percent > 100) percent = 100; // Cap
    if (percent < 0) percent = 0;
    
    document.getElementById("val-progress-percent").textContent = `${percent.toFixed(1)}%`;
    document.getElementById("val-progress-bar").style.width = `${percent.toFixed(1)}%`;
    document.getElementById("progress-desc-txt").textContent = `Llevas completado el ${percent.toFixed(1)}% de tu peso objetivo.`;

    // Nutrición Rápida en Dashboard
    updateNutritionTotals();
}

/* ==========================================================================
   MÓDULO DE NUTRICIÓN
   ========================================================================== */
function initializeFoodTracker() {
    // Rutinas de Nutrición
    document.getElementById("btn-clear-food").addEventListener("click", () => {
        appState.nutrition.foodLog = [];
        saveStateToLocalStorage();
        renderFoodLog();
        updateNutritionTotals();
    });
}

function updateNutritionTotals() {
    const foodLog = appState.nutrition.foodLog;
    const goalCal = appState.nutrition.goalCalories;
    const goalProt = appState.nutrition.goalProtein;
    const goalCarbs = appState.nutrition.goalCarbs;
    const goalFats = appState.nutrition.goalFats;

    // Calcular Totales Consumidos
    let totalKcal = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    foodLog.forEach(food => {
        totalKcal += food.kcal;
        totalProt += food.protein;
        totalCarbs += food.carbs;
        totalFats += food.fats;
    });

    // Actualizar UI - Dashboard Vista Rápida
    const kcalValueMain = document.getElementById("kcal-value-main");
    if (kcalValueMain) kcalValueMain.textContent = totalKcal;
    
    const kcalGoalTxt = document.getElementById("kcal-goal-txt");
    if (kcalGoalTxt) kcalGoalTxt.textContent = goalCal;

    // Anillo de progreso de Kcal en Dashboard (Perímetro es 439.8 para r=70)
    const kcalRingMain = document.getElementById("kcal-ring-main");
    if (kcalRingMain) {
        const perimeter = 439.8;
        const pct = Math.min(totalKcal / goalCal, 1);
        const offset = perimeter - (pct * perimeter);
        kcalRingMain.style.strokeDashoffset = offset;
    }

    // Barras de proteína y carb en el Dashboard
    const pValMain = document.getElementById("p-val-main");
    if (pValMain) pValMain.textContent = totalProt;
    const pBarMain = document.getElementById("p-bar-main");
    if (pBarMain) pBarMain.style.width = `${Math.min((totalProt / goalProt) * 100, 100)}%`;

    const cValMain = document.getElementById("c-val-main");
    if (cValMain) cValMain.textContent = totalCarbs;
    const cBarMain = document.getElementById("c-bar-main");
    if (cBarMain) cBarMain.style.width = `${Math.min((totalCarbs / goalCarbs) * 100, 100)}%`;

    // Actualizar UI - Pestaña Detallada de Nutrición
    const kcalConsumed = document.getElementById("kcal-consumed");
    if (kcalConsumed) kcalConsumed.textContent = totalKcal;
    
    const kcalGoalNut = document.getElementById("kcal-goal-nut");
    if (kcalGoalNut) kcalGoalNut.textContent = goalCal;

    const kcalRemainingTxt = document.getElementById("kcal-remaining-txt");
    if (kcalRemainingTxt) {
        const remaining = goalCal - totalKcal;
        if (remaining > 0) {
            kcalRemainingTxt.textContent = `Faltan ${remaining} kcal`;
            kcalRemainingTxt.className = "kcal-remaining-large";
        } else if (remaining < 0) {
            kcalRemainingTxt.textContent = `Exceso de ${Math.abs(remaining)} kcal`;
            kcalRemainingTxt.className = "kcal-remaining-large text-rose";
        } else {
            kcalRemainingTxt.textContent = `¡Calorías exactas logradas!`;
            kcalRemainingTxt.className = "kcal-remaining-large text-cyan";
        }
    }

    const kcalBarNut = document.getElementById("kcal-bar-nut");
    if (kcalBarNut) kcalBarNut.style.width = `${Math.min((totalKcal / goalCal) * 100, 100)}%`;

    // Macros Detallados con Anillos (Perímetro es 226.2 para r=36)
    const perimeterMacro = 226.2;
    
    // Proteína
    const nutPVal = document.getElementById("nut-p-val");
    if (nutPVal) nutPVal.textContent = totalProt;
    const nutPPct = document.getElementById("nut-p-pct");
    const pPctVal = Math.min((totalProt / goalProt) * 100, 100);
    if (nutPPct) nutPPct.textContent = `${pPctVal.toFixed(0)}%`;
    const ringProtein = document.getElementById("ring-protein");
    if (ringProtein) {
        const offset = perimeterMacro - ((pPctVal / 100) * perimeterMacro);
        ringProtein.style.strokeDashoffset = offset;
    }

    // Carbohidratos
    const nutCVal = document.getElementById("nut-c-val");
    if (nutCVal) nutCVal.textContent = totalCarbs;
    const nutCPct = document.getElementById("nut-c-pct");
    const cPctVal = Math.min((totalCarbs / goalCarbs) * 100, 100);
    if (nutCPct) nutCPct.textContent = `${cPctVal.toFixed(0)}%`;
    const ringCarbs = document.getElementById("ring-carbs");
    if (ringCarbs) {
        const offset = perimeterMacro - ((cPctVal / 100) * perimeterMacro);
        ringCarbs.style.strokeDashoffset = offset;
    }

    // Grasas
    const nutFVal = document.getElementById("nut-f-val");
    if (nutFVal) nutFVal.textContent = totalFats;
    const nutFPct = document.getElementById("nut-f-pct");
    const fPctVal = Math.min((totalFats / goalFats) * 100, 100);
    if (nutFPct) nutFPct.textContent = `${fPctVal.toFixed(0)}%`;
    const ringFats = document.getElementById("ring-fats");
    if (ringFats) {
        const offset = perimeterMacro - ((fPctVal / 100) * perimeterMacro);
        ringFats.style.strokeDashoffset = offset;
    }
}

function renderFoodLog() {
    const logBody = document.getElementById("food-log-body");
    if (!logBody) return;
    
    logBody.innerHTML = "";

    if (appState.nutrition.foodLog.length === 0) {
        logBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); font-style: italic;">No hay alimentos registrados hoy</td></tr>`;
        return;
    }

    appState.nutrition.foodLog.forEach((food) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${food.name}</strong></td>
            <td>${food.kcal} kcal</td>
            <td>${food.protein}g</td>
            <td>${food.carbs}g</td>
            <td>${food.fats}g</td>
            <td><button class="btn-delete" data-id="${food.id}">Eliminar</button></td>
        `;
        logBody.appendChild(tr);
    });

    // Eventos para eliminar alimento
    logBody.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const foodId = parseInt(btn.getAttribute("data-id"));
            appState.nutrition.foodLog = appState.nutrition.foodLog.filter(f => f.id !== foodId);
            saveStateToLocalStorage();
            renderFoodLog();
            updateNutritionTotals();
        });
    });
}

/* ==========================================================================
   MODALES CONTROLES
   ========================================================================== */
function initializeModals() {
    // Modal de Métricas
    const metricsModal = document.getElementById("metrics-modal");
    const btnOpenMetrics = document.getElementById("btn-open-metrics-modal");
    const btnCloseMetrics = document.getElementById("btn-close-metrics-modal");

    btnOpenMetrics.addEventListener("click", () => {
        // Cargar valores actuales en el formulario
        document.getElementById("input-name").value = appState.user.name;
        document.getElementById("input-weight").value = appState.metrics.weightActual;
        document.getElementById("input-goal").value = appState.metrics.weightGoal;
        document.getElementById("input-arm-l").value = appState.metrics.armLeft;
        document.getElementById("input-arm-r").value = appState.metrics.armRight;
        
        metricsModal.classList.add("active");
    });

    btnCloseMetrics.addEventListener("click", () => {
        metricsModal.classList.remove("active");
    });

    // Modal de Comida
    const foodModal = document.getElementById("food-modal");
    const btnOpenFood = document.getElementById("btn-open-food-modal");
    const btnCloseFood = document.getElementById("btn-close-food-modal");

    btnOpenFood.addEventListener("click", () => {
        document.getElementById("form-add-food").reset();
        foodModal.classList.add("active");
    });

    btnCloseFood.addEventListener("click", () => {
        foodModal.classList.remove("active");
    });

    // Cerrar modales haciendo click fuera
    window.addEventListener("click", (e) => {
        if (e.target === metricsModal) {
            metricsModal.classList.remove("active");
        }
        if (e.target === foodModal) {
            foodModal.classList.remove("active");
        }
    });
}

function initializeMetricsForm() {
    const form = document.getElementById("form-metrics");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Obtener valores
        const name = document.getElementById("input-name").value.trim();
        const weightActual = parseFloat(document.getElementById("input-weight").value);
        const weightGoal = parseFloat(document.getElementById("input-goal").value);
        const armL = parseFloat(document.getElementById("input-arm-l").value);
        const armR = parseFloat(document.getElementById("input-arm-r").value);

        // Actualizar estado
        appState.user.name = name;
        appState.metrics.weightActual = weightActual;
        appState.metrics.weightGoal = weightGoal;
        appState.metrics.armLeft = armL;
        appState.metrics.armRight = armR;

        // Añadir peso actual al historial con la fecha de hoy si no se registró hoy
        const todayStr = getLocalDateString();
        const existingEntryIndex = appState.weightHistory.findIndex(h => h.date === todayStr);
        if (existingEntryIndex !== -1) {
            appState.weightHistory[existingEntryIndex].weight = weightActual;
        } else {
            appState.weightHistory.push({ date: todayStr, weight: weightActual });
            appState.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date));
        }

        // Guardar y renderizar
        saveStateToLocalStorage();
        updateDashboardUI();
        renderWeightChart();
        renderWeightHistoryList();

        // Cerrar modal
        document.getElementById("metrics-modal").classList.remove("active");
    });

    // Agregar Alimento Formulario
    const foodForm = document.getElementById("form-add-food");
    foodForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("food-name").value.trim();
        const kcal = parseInt(document.getElementById("food-kcal").value);
        const protein = parseInt(document.getElementById("food-protein").value);
        const carbs = parseInt(document.getElementById("food-carbs").value);
        const fats = parseInt(document.getElementById("food-fats").value);

        const newFood = {
            id: Date.now(),
            name,
            kcal,
            protein,
            carbs,
            fats
        };

        appState.nutrition.foodLog.push(newFood);
        saveStateToLocalStorage();
        renderFoodLog();
        updateNutritionTotals();

        // Cerrar modal
        document.getElementById("food-modal").classList.remove("active");
    });
}

/* ==========================================================================
   TEMPORIZADOR DE DESCANSO INTERACTIVO
   ========================================================================== */
function initializeRestTimer() {
    const playBtn = document.getElementById("btn-timer-play");
    const resetBtn = document.getElementById("btn-timer-reset");
    const playIcon = document.getElementById("play-icon");
    const pauseIcon = document.getElementById("pause-icon");
    const timeDisplay = document.getElementById("timer-display-time");
    
    // Quick select chips
    const chips = document.querySelectorAll(".timer-quick-select .btn-chip");
    
    // Cargar tiempo por defecto
    timerSecondsTotal = 90;
    timerSecondsRemaining = 90;
    updateTimerDisplay();

    // Toggle Play / Pause
    playBtn.addEventListener("click", () => {
        if (timerIsRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    // Reset Timer
    resetBtn.addEventListener("click", () => {
        resetTimer();
    });

    // Chips Select
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            
            const seconds = parseInt(chip.getAttribute("data-time"));
            timerSecondsTotal = seconds;
            resetTimer();
        });
    });

    // Pestañas internas de rutinas (Pecho, Brazo, Espalda)
    const routineTabBtns = document.querySelectorAll(".routine-tab-btn");
    routineTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            routineTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const rType = btn.getAttribute("data-routine");
            document.querySelectorAll(".routine-group").forEach(group => {
                group.classList.remove("active");
            });
            document.getElementById(`routine-${rType}`).classList.add("active");
        });
    });

    // Manejar checkboxes de series realizadas
    document.querySelectorAll(".checkbox-container input").forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            // Cuando completan una serie, podemos sugerir/iniciar el cronómetro
            if (checkbox.checked && !timerIsRunning) {
                // Autoplay timer si el usuario marca una serie
                startTimer();
            }
        });
    });
}

function startTimer() {
    timerIsRunning = true;
    document.getElementById("play-icon").classList.add("hidden");
    document.getElementById("pause-icon").classList.remove("hidden");
    
    timerInterval = setInterval(() => {
        timerSecondsRemaining--;
        updateTimerDisplay();
        
        if (timerSecondsRemaining <= 0) {
            clearInterval(timerInterval);
            timerIsRunning = false;
            document.getElementById("play-icon").classList.remove("hidden");
            document.getElementById("pause-icon").classList.add("hidden");
            
            // Sonar alarma e iniciar efecto visual de destello
            playTimerDoneSound();
            flashTimerDisplay();
            timerSecondsRemaining = timerSecondsTotal;
            updateTimerDisplay();
        }
    }, 1000);
}

function pauseTimer() {
    timerIsRunning = false;
    document.getElementById("play-icon").classList.remove("hidden");
    document.getElementById("pause-icon").classList.add("hidden");
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timerSecondsRemaining = timerSecondsTotal;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsRemaining / 60);
    const secs = timerSecondsRemaining % 60;
    document.getElementById("timer-display-time").textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function flashTimerDisplay() {
    const display = document.getElementById("timer-display-time");
    display.style.color = "var(--accent-rose)";
    display.style.textShadow = "0 0 25px var(--accent-rose)";
    
    setTimeout(() => {
        display.style.color = "";
        display.style.textShadow = "";
    }, 2000);
}

// Alarma Sintética con Web Audio API (Offline friendly)
function playTimerDoneSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        const now = ctx.currentTime;
        
        // Melodía corta y agradable para indicar fin de descanso
        osc.frequency.setValueAtTime(523.25, now); // C5 (Do)
        osc.frequency.setValueAtTime(659.25, now + 0.15); // E5 (Mi)
        osc.frequency.setValueAtTime(783.99, now + 0.3); // G5 (Sol)
        osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6 (Do octava)
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
    } catch (e) {
        console.error("No se pudo iniciar el AudioContext:", e);
    }
}

/* ==========================================================================
   MÓDULO DE SEGUIMIENTO DE PESO (GRÁFICO SVG DINÁMICO)
   ========================================================================== */
function initializeWeightTracker() {
    const form = document.getElementById("form-add-weight");
    // Set current date in the input
    document.getElementById("weight-date-input").value = getLocalDateString();
    
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const weightVal = parseFloat(document.getElementById("weight-input").value);
        const dateVal = document.getElementById("weight-date-input").value;
        
        if (weightVal && dateVal) {
            // Agregar al historial o actualizar existente
            const existingIndex = appState.weightHistory.findIndex(h => h.date === dateVal);
            if (existingIndex !== -1) {
                appState.weightHistory[existingIndex].weight = weightVal;
            } else {
                appState.weightHistory.push({ date: dateVal, weight: weightVal });
            }
            
            // Ordenar por fecha
            appState.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Actualizar peso actual de métricas si es la fecha más reciente
            const latestWeight = appState.weightHistory[appState.weightHistory.length - 1];
            appState.metrics.weightActual = latestWeight.weight;
            
            saveStateToLocalStorage();
            updateDashboardUI();
            renderWeightChart();
            renderWeightHistoryList();
            
            form.reset();
            document.getElementById("weight-date-input").value = getLocalDateString();
        }
    });

    renderWeightHistoryList();
}

function renderWeightHistoryList() {
    const list = document.getElementById("weight-history-list");
    if (!list) return;
    list.innerHTML = "";
    
    // Mostrar de más nuevo a más viejo
    const sortedDesc = [...appState.weightHistory].reverse();
    sortedDesc.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="history-date">${formatSpanishDateShort(item.date)}</span>
            <span class="history-val">${item.weight.toFixed(1)} kg</span>
        `;
        list.appendChild(li);
    });
}

function renderWeightChart() {
    const svg = document.getElementById("weight-svg-chart");
    if (!svg) return;
    
    svg.innerHTML = ""; // Limpiar
    
    const history = appState.weightHistory;
    if (history.length === 0) {
        svg.innerHTML = `<text x="300" y="150" fill="var(--text-muted)" text-anchor="middle">No hay historial para graficar</text>`;
        return;
    }

    const width = 600;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 50, left: 50 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calcular min/max pesos e incluir un margen para simular escala
    let minWeight = Math.min(...history.map(h => h.weight));
    let maxWeight = Math.max(...history.map(h => h.weight));
    
    // Forzar que el rango incluya la meta por estética si está cerca
    const goalWeight = appState.metrics.weightGoal;
    minWeight = Math.min(minWeight, goalWeight) - 2;
    maxWeight = Math.max(maxWeight, goalWeight) + 2;

    const rangeY = maxWeight - minWeight;

    // Elementos Base: Definiciones y degradados en el SVG
    const defsHtml = `
        <defs>
            <linearGradient id="chart-blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#06b6d4" />
            </linearGradient>
            <linearGradient id="chart-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(59, 130, 246, 0.25)" />
                <stop offset="100%" stop-color="rgba(6, 182, 212, 0.0)" />
            </linearGradient>
        </defs>
    `;
    svg.insertAdjacentHTML("beforeend", defsHtml);

    // Dibujar Rejilla y Eje Y (Pesos)
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
        const pct = i / ySteps;
        const valY = minWeight + (pct * rangeY);
        const pixelY = padding.top + (chartHeight - (pct * chartHeight));
        
        // Grid Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding.left);
        line.setAttribute("y1", pixelY);
        line.setAttribute("x2", width - padding.right);
        line.setAttribute("y2", pixelY);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // Etiqueta del peso
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", padding.left - 10);
        text.setAttribute("y", pixelY + 4);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("class", "chart-axis-text");
        text.textContent = `${valY.toFixed(0)} kg`;
        svg.appendChild(text);
    }

    // Dibujar Eje X (Fechas)
    const pointsCount = history.length;
    const xCoords = [];
    const yCoords = [];

    history.forEach((point, idx) => {
        // Coordenada X
        let pixelX;
        if (pointsCount === 1) {
            pixelX = padding.left + chartWidth / 2;
        } else {
            pixelX = padding.left + (idx / (pointsCount - 1)) * chartWidth;
        }
        xCoords.push(pixelX);

        // Coordenada Y
        const pctY = (point.weight - minWeight) / rangeY;
        const pixelY = padding.top + (chartHeight - (pctY * chartHeight));
        yCoords.push(pixelY);

        // Etiqueta de la fecha en eje X
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pixelX);
        text.setAttribute("y", height - padding.bottom + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-text");
        text.textContent = formatSpanishDateShort(point.date);
        svg.appendChild(text);
    });

    // Línea de la meta de peso (línea discontinua horizontal)
    const goalPctY = (goalWeight - minWeight) / rangeY;
    const goalPixelY = padding.top + (chartHeight - (goalPctY * chartHeight));
    
    const goalLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    goalLine.setAttribute("x1", padding.left);
    goalLine.setAttribute("y1", goalPixelY);
    goalLine.setAttribute("x2", width - padding.right);
    goalLine.setAttribute("y2", goalPixelY);
    goalLine.setAttribute("stroke", "var(--accent-rose)");
    goalLine.setAttribute("stroke-width", "1.5");
    goalLine.setAttribute("stroke-dasharray", "6, 4");
    goalLine.setAttribute("opacity", "0.4");
    svg.appendChild(goalLine);

    const goalLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    goalLabel.setAttribute("x", width - padding.right);
    goalLabel.setAttribute("y", goalPixelY - 6);
    goalLabel.setAttribute("text-anchor", "end");
    goalLabel.setAttribute("fill", "var(--accent-rose)");
    goalLabel.setAttribute("font-size", "9px");
    goalLabel.setAttribute("font-weight", "600");
    goalLabel.textContent = `Meta: ${goalWeight} kg`;
    svg.appendChild(goalLabel);

    // Dibujar el degradado del área inferior
    if (pointsCount > 1) {
        let areaPathD = `M ${xCoords[0]} ${height - padding.bottom} `;
        for (let i = 0; i < pointsCount; i++) {
            areaPathD += `L ${xCoords[i]} ${yCoords[i]} `;
        }
        areaPathD += `L ${xCoords[pointsCount - 1]} ${height - padding.bottom} Z`;

        const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        areaPath.setAttribute("d", areaPathD);
        areaPath.setAttribute("class", "chart-gradient-fill");
        svg.appendChild(areaPath);
    }

    // Dibujar la línea de tendencia (Stroke)
    let linePathD = `M ${xCoords[0]} ${yCoords[0]} `;
    for (let i = 1; i < pointsCount; i++) {
        linePathD += `L ${xCoords[i]} ${yCoords[i]} `;
    }

    const trendLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trendLine.setAttribute("d", linePathD);
    trendLine.setAttribute("class", "chart-trend-line");
    trendLine.setAttribute("fill", "none");
    svg.appendChild(trendLine);

    // Dibujar puntos interactivos (círculos)
    history.forEach((point, idx) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", xCoords[idx]);
        circle.setAttribute("cy", yCoords[idx]);
        circle.setAttribute("r", "5");
        circle.setAttribute("class", "chart-dot");
        
        // Agregar tooltip al pasar el cursor (interactividad)
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${point.weight.toFixed(1)} kg - ${formatSpanishDateFull(point.date)}`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
    });
}

/* ==========================================================================
   MÓDULO DE CALENDARIO INTERACTIVO
   ========================================================================== */
function initializeCalendar() {
    document.getElementById("btn-calendar-prev").addEventListener("click", () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById("btn-calendar-next").addEventListener("click", () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById("btn-mark-today-complete").addEventListener("click", () => {
        const todayStr = getLocalDateString();
        appState.calendarEvents[todayStr] = "completed";
        saveStateToLocalStorage();
        renderCalendar();
        updateDashboardUI();
    });
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthYearText = document.getElementById("calendar-month-year");
    if (monthYearText) {
        monthYearText.textContent = getMonthYearString(currentCalendarDate);
    }

    const grid = document.getElementById("calendar-days");
    if (!grid) return;
    grid.innerHTML = "";

    // Primer día del mes
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Último día del mes anterior (para días inactivos iniciales)
    const prevLastDay = new Date(year, month, 0).getDate();

    // Renderizar días inactivos del mes anterior
    for (let x = firstDayIndex; x > 0; x--) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day-cell inactive";
        dayCell.innerHTML = `<span class="day-num">${prevLastDay - x + 1}</span>`;
        grid.appendChild(dayCell);
    }

    // Renderizar días del mes actual
    let completedCount = 0;
    const todayStr = getLocalDateString();

    for (let i = 1; i <= lastDay; i++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day-cell";
        
        // Formatear fecha del día en loop
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        
        // Comprobar si es hoy
        if (dateStr === todayStr) {
            dayCell.classList.add("today");
        }

        // Comprobar eventos en el estado
        const status = appState.calendarEvents[dateStr];
        if (status) {
            dayCell.classList.add(status);
            if (status === "completed") {
                completedCount++;
            }
        }

        dayCell.innerHTML = `<span class="day-num">${i}</span>`;
        
        // Cambiar el estado al hacer clic (Secuencia: rest -> planned -> completed -> rest)
        dayCell.addEventListener("click", () => {
            const currentStatus = appState.calendarEvents[dateStr];
            let nextStatus;
            
            if (!currentStatus) {
                nextStatus = "planned";
            } else if (currentStatus === "planned") {
                nextStatus = "completed";
            } else if (currentStatus === "completed") {
                nextStatus = "rest";
            } else {
                nextStatus = null; // Quita el evento (regresa a normal)
            }

            if (nextStatus) {
                appState.calendarEvents[dateStr] = nextStatus;
            } else {
                delete appState.calendarEvents[dateStr];
            }

            saveStateToLocalStorage();
            renderCalendar();
        });

        grid.appendChild(dayCell);
    }

    // Actualizar Estadísticas del Mes en Calendario
    const calCompleted = document.getElementById("cal-completed-count");
    if (calCompleted) {
        calCompleted.textContent = completedCount;
    }
}

/* ==========================================================================
   MÉTODOS DE AYUDA (FECHAS Y FORMATOS)
   ========================================================================== */
function getLocalDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function formatSpanishDateShort(dateStr) {
    // Convierte "2026-06-24" a "24 Jun"
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const day = parseInt(parts[2]);
    const monthIdx = parseInt(parts[1]) - 1;
    return `${day} ${months[monthIdx]}`;
}

function formatSpanishDateFull(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function getMonthYearString(date) {
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
