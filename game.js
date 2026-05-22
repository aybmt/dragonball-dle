// =============================================
//  DRAGON BALL DLE — Logique de jeu
//  • Personnage du jour commun à tous (fuseau Paris)
//  • Reset à minuit Paris
//  • Mémorisation de la victoire (localStorage)
//  • Compteur de joueurs via Supabase (optionnel)
// =============================================

// ═══════════════════════════════════════════════
//  CONFIG SUPABASE — À REMPLIR
//  Si non configuré, le compteur affichera "—"
//  Voir SUPABASE_SETUP.md pour les instructions
// ═══════════════════════════════════════════════
const SUPABASE_URL = "https://xhdldegoccwcmuwnqnak.supabase.co/rest/v1/";       // ex: "https://xxxxx.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZGxkZWdvY2N3Y211d25xbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzgzNzEsImV4cCI6MjA5NTAxNDM3MX0.rVJ4P16QGIM2zNXRuEIkUMucaootUMlXxHmXTfjGz5E";  // clé publique anon

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Attributs ───
const ATTRIBUTES = [
  { key: "sex",     label: "Sexe",    type: "exact" },
  { key: "hair",    label: "Cheveux", type: "exact" },
  { key: "origin",  label: "Origine", type: "exact" },
  { key: "race",    label: "Race",    type: "exact" },
  { key: "episode", label: "Épisode", type: "numeric" },
  { key: "saga",    label: "Saga",    type: "saga" },
  { key: "serie",   label: "Série",   type: "multi" },
];

// ─── Easter egg ───
const EASTER_EGG_NAME = "Lucas Latraube";

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function isEasterEgg(name) {
  return normalize(name) === normalize(EASTER_EGG_NAME);
}

// ═══════════════════════════════════════════════
//  GESTION DU JOUR (fuseau Europe/Paris)
// ═══════════════════════════════════════════════

// Retourne une date YYYY-MM-DD basée sur l'heure de Paris
function getParisDateKey(date = new Date()) {
  // Intl.DateTimeFormat nous donne l'heure dans le fuseau souhaité
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);

  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

// Hash déterministe de la date → index dans CHARACTERS
// Utilise un hash simple (FNV-1a) pour bien randomiser
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // unsigned
}

function getDailyCharacter() {
  const dateKey = getParisDateKey();
  const index = hashString(dateKey) % CHARACTERS.length;
  return { character: CHARACTERS[index], dateKey };
}

// Calcule le temps restant jusqu'à minuit Paris
function getTimeUntilMidnightParis() {
  const now = new Date();
  // Heure actuelle à Paris
  const parisNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  // Heure locale actuelle (pour calculer l'offset Paris vs local)
  const localNow = new Date(now.toLocaleString("en-US"));
  const offsetMs = parisNow.getTime() - localNow.getTime();

  // Construit "minuit prochain à Paris"
  const nextMidnightParis = new Date(parisNow);
  nextMidnightParis.setHours(24, 0, 0, 0); // minuit du lendemain
  // Convertit vers le fuseau UTC absolu en retranchant l'offset
  const targetUtc = nextMidnightParis.getTime() - offsetMs;

  return Math.max(0, targetUtc - now.getTime());
}

function formatTimeLeft(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════
//  ÉTAT
// ═══════════════════════════════════════════════

const daily = getDailyCharacter();
let target = daily.character;
let currentDateKey = daily.dateKey;

let guesses = [];
let guessedNames = new Set();
let gameWon = false;
let hintShown = false;

// ─── DOM refs ───
const input       = document.getElementById("search-input");
const suggestions = document.getElementById("suggestions");
const guessBtn    = document.getElementById("guess-btn");
const guessesContainer = document.getElementById("guesses-container");
const triesSpan   = document.getElementById("tries");
const poolSpan    = document.getElementById("pool-count");
const columnsHeader = document.getElementById("columns-header");
const errorMsg    = document.getElementById("error-msg");
const winScreen   = document.getElementById("win-screen");
const winName     = document.getElementById("win-name");
const winTries    = document.getElementById("win-tries");
const winPlayers  = document.getElementById("win-players");
const winTimer    = document.getElementById("win-timer");
const winCloseBtn = document.getElementById("win-close-btn");
const easterScreen = document.getElementById("easter-screen");
const easterTargetName = document.getElementById("easter-target-name");
const easterCloseBtn = document.getElementById("easter-close-btn");
const hintBox     = document.getElementById("hint-box");
const hintText    = document.getElementById("hint-text");

const gameArea    = document.getElementById("game-area");
const alreadyWon  = document.getElementById("already-won");
const alreadyName = document.getElementById("already-name");
const alreadyTries= document.getElementById("already-tries");
const alreadyPlayers = document.getElementById("already-players");
const alreadyTimer= document.getElementById("already-timer");

const legendModal = document.getElementById("legend-modal");
const legendClose = document.getElementById("legend-close");
const legendStart = document.getElementById("legend-start");
const helpBtn     = document.getElementById("help-btn");

poolSpan.textContent = CHARACTERS.length;

// ═══════════════════════════════════════════════
//  LOCALSTORAGE — sauvegarde de la victoire du jour
// ═══════════════════════════════════════════════
const STATE_KEY = "dbdle_daily_state";

function loadDailyState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Si l'état est d'un autre jour, on l'ignore
    if (state.dateKey !== currentDateKey) return null;
    return state;
  } catch (e) {
    return null;
  }
}

function saveDailyState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) { /* */ }
}

// ═══════════════════════════════════════════════
//  SUPABASE — compteur de joueurs
//  Table attendue : daily_stats
//    - date_key (text, primary key)
//    - winners (int, default 0)
// ═══════════════════════════════════════════════

async function incrementWinnerCount() {
  if (!supabase) return null;
  try {
    // Appel d'une fonction SQL "increment_winners" qu'on va créer côté Supabase
    const { data, error } = await supabase.rpc("increment_winners", {
      p_date_key: currentDateKey
    });
    if (error) { console.warn("Supabase RPC error:", error); return null; }
    return data;
  } catch (e) {
    console.warn("Supabase call failed:", e);
    return null;
  }
}

async function fetchWinnerCount() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("daily_stats")
      .select("winners")
      .eq("date_key", currentDateKey)
      .maybeSingle();
    if (error) { console.warn("Supabase fetch error:", error); return null; }
    return data ? data.winners : 0;
  } catch (e) {
    console.warn("Supabase fetch failed:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════
//  MODALE LÉGENDE
// ═══════════════════════════════════════════════
const LEGEND_KEY = "dbdle_legend_sober";

function openLegend()  { legendModal.classList.remove("hidden"); }
function closeLegend() {
  legendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) {}
}

try {
  if (!localStorage.getItem(LEGEND_KEY)) openLegend();
} catch (e) { openLegend(); }

legendClose.addEventListener("click", closeLegend);
legendStart.addEventListener("click", closeLegend);
helpBtn.addEventListener("click", openLegend);

legendModal.addEventListener("click", (e) => {
  if (e.target === legendModal) closeLegend();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !legendModal.classList.contains("hidden")) closeLegend();
});

// ═══════════════════════════════════════════════
//  AUTOCOMPLÉTION
// ═══════════════════════════════════════════════
input.addEventListener("input", () => {
  const val = input.value.trim().toLowerCase();
  if (val.length < 1) { hideSuggestions(); return; }

  const matches = CHARACTERS
    .filter(c => c.name.toLowerCase().includes(val) && !guessedNames.has(c.name))
    .slice(0, 7);

  if (matches.length === 0) { hideSuggestions(); return; }

  suggestions.innerHTML = "";
  matches.forEach(c => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.textContent = c.name;
    div.addEventListener("click", () => {
      input.value = c.name;
      hideSuggestions();
      submitGuess();
    });
    suggestions.appendChild(div);
  });
  suggestions.classList.remove("hidden");
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-box")) hideSuggestions();
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") submitGuess();
  if (e.key === "Escape") hideSuggestions();
});

guessBtn.addEventListener("click", submitGuess);

function hideSuggestions() {
  suggestions.classList.add("hidden");
  suggestions.innerHTML = "";
}

// ═══════════════════════════════════════════════
//  SOUMISSION D'UN ESSAI
// ═══════════════════════════════════════════════
async function submitGuess() {
  if (gameWon) return;
  const name = input.value.trim();
  if (!name) return;

  // Easter egg
  if (isEasterEgg(name)) {
    gameWon = true;
    input.value = "";
    hideSuggestions();
    clearError();
    setTimeout(showEasterWin, 300);
    return;
  }

  const character = CHARACTERS.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!character) {
    showError("Personnage introuvable !");
    return;
  }
  if (guessedNames.has(character.name)) {
    showError("Déjà essayé !");
    return;
  }

  clearError();
  guessedNames.add(character.name);
  guesses.push(character);
  triesSpan.textContent = guesses.length;

  columnsHeader.classList.remove("hidden");
  renderGuessRow(character);

  input.value = "";
  hideSuggestions();

  if (character.name === target.name) {
    gameWon = true;
    // Sauvegarde la victoire
    saveDailyState({
      dateKey: currentDateKey,
      won: true,
      targetName: target.name,
      tries: guesses.length,
      guessNames: Array.from(guessedNames)
    });
    // Incrémente le compteur côté serveur
    incrementWinnerCount();
    setTimeout(showWin, 600);
    return;
  }

  // Sauvegarde la progression (essais en cours, sans victoire)
  saveDailyState({
    dateKey: currentDateKey,
    won: false,
    guessNames: Array.from(guessedNames)
  });

  if (guesses.length >= 8 && !hintShown) showHint();
}

function makePlaceholder() {
  const d = document.createElement("div");
  d.className = "cell-img-placeholder";
  return d;
}

// ═══════════════════════════════════════════════
//  RENDU LIGNE D'ESSAI
// ═══════════════════════════════════════════════
function renderGuessRow(character, animate = true) {
  const row = document.createElement("div");
  row.className = "guess-row";

  const nameCell = document.createElement("div");
  nameCell.className = "cell cell-name";

  const imgWrap = document.createElement("div");
  imgWrap.className = "cell-img-wrap";

  if (character.image) {
    const img = document.createElement("img");
    img.className = "cell-img";
    img.alt = character.name;
    img.crossOrigin = "anonymous";
    img.src = character.image;
    img.onerror = () => { imgWrap.innerHTML = ""; imgWrap.appendChild(makePlaceholder()); };
    imgWrap.appendChild(img);
  } else {
    imgWrap.appendChild(makePlaceholder());
  }

  const nameSpan = document.createElement("span");
  nameSpan.textContent = character.name;
  nameCell.appendChild(imgWrap);
  nameCell.appendChild(nameSpan);
  row.appendChild(nameCell);

  ATTRIBUTES.forEach((attr, i) => {
    const cell = buildCell(character, attr);
    if (animate) cell.style.animationDelay = `${i * 80}ms`;
    else cell.style.animation = "none";
    row.appendChild(cell);
  });

  guessesContainer.insertBefore(row, guessesContainer.firstChild);
  if (animate) {
    requestAnimationFrame(() => row.classList.add("revealed"));
  } else {
    row.classList.add("revealed");
    row.style.transition = "none";
    row.style.opacity = "1";
    row.style.transform = "none";
  }
}

function buildCell(character, attr) {
  const cell = document.createElement("div");
  cell.className = "cell";

  const gVal = character[attr.key];
  const tVal = target[attr.key];

  if (attr.type === "numeric")   return buildNumericCell(cell, gVal, tVal);
  if (attr.type === "saga")      return buildSagaCell(cell, gVal, tVal);
  if (attr.type === "multi")     return buildMultiCell(cell, gVal, tVal);

  if (gVal === tVal) cell.classList.add("correct");
  else               cell.classList.add("wrong");
  cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  return cell;
}

function computeGradStop(absDiff, scale) {
  if (scale === "episode") {
    if (absDiff <= 3)        return 85;
    else if (absDiff <= 10)  return 70;
    else if (absDiff <= 25)  return 55;
    else if (absDiff <= 50)  return 40;
    else if (absDiff <= 100) return 25;
    else                     return 12;
  }
  if (absDiff <= 1) return 85;
  if (absDiff <= 2) return 70;
  if (absDiff <= 4) return 55;
  if (absDiff <= 7) return 40;
  if (absDiff <= 12) return 25;
  return 12;
}

function buildNumericCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }
  const diff = tVal - gVal;
  const stop = computeGradStop(Math.abs(diff), "episode");
  cell.style.setProperty("--grad-stop", stop + "%");

  if (diff > 0) {
    cell.classList.add("gradient-up");
    cell.innerHTML = `<span class="cell-arrow">▲</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("gradient-down");
    cell.innerHTML = `<span class="cell-arrow">▼</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

function buildSagaCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }
  const gIdx = SAGA_ORDER.indexOf(gVal);
  const tIdx = SAGA_ORDER.indexOf(tVal);
  if (gIdx === -1 || tIdx === -1) {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }
  const diff = tIdx - gIdx;
  const stop = computeGradStop(Math.abs(diff), "saga");
  cell.style.setProperty("--grad-stop", stop + "%");
  if (diff > 0) {
    cell.classList.add("gradient-up");
    cell.innerHTML = `<span class="cell-arrow">▲</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("gradient-down");
    cell.innerHTML = `<span class="cell-arrow">▼</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

function buildMultiCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
  } else {
    const gP = gVal.split("/").map(s => s.trim());
    const tP = tVal.split("/").map(s => s.trim());
    cell.classList.add(gP.some(s => tP.includes(s)) ? "partial" : "wrong");
  }
  cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  return cell;
}

// ═══════════════════════════════════════════════
//  INDICE
// ═══════════════════════════════════════════════
function showHint() {
  hintShown = true;
  const firstLetter = target.name.charAt(0).toUpperCase();
  hintText.textContent = `Le nom commence par « ${firstLetter} »`;
  hintBox.classList.remove("hidden");
}

// ═══════════════════════════════════════════════
//  ERREUR
// ═══════════════════════════════════════════════
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
  setTimeout(clearError, 2500);
}
function clearError() { errorMsg.classList.add("hidden"); }

// ═══════════════════════════════════════════════
//  VICTOIRE
// ═══════════════════════════════════════════════
async function showWin() {
  winName.textContent = target.name;
  winTries.textContent = guesses.length;
  winScreen.classList.remove("hidden");
  // Démarre le timer dans le modal
  startTimerUpdate(winTimer);
  // Récupère le nombre de joueurs
  const count = await fetchWinnerCount();
  winPlayers.textContent = count === null ? "—" : count.toLocaleString("fr-FR");
}

function showEasterWin() {
  easterTargetName.textContent = target.name;
  easterScreen.classList.remove("hidden");
}

winCloseBtn.addEventListener("click", () => {
  winScreen.classList.add("hidden");
  // Affiche le panel "déjà gagné" inline
  showAlreadyWonPanel();
});

easterCloseBtn.addEventListener("click", () => {
  easterScreen.classList.add("hidden");
});

// ═══════════════════════════════════════════════
//  PANEL « DÉJÀ GAGNÉ »
// ═══════════════════════════════════════════════
async function showAlreadyWonPanel() {
  const state = loadDailyState();
  if (!state || !state.won) return;

  // Cache la zone de jeu, affiche le panel inline
  gameArea.classList.add("hidden");
  alreadyWon.classList.remove("hidden");

  alreadyName.textContent = state.targetName;
  alreadyTries.textContent = state.tries;

  startTimerUpdate(alreadyTimer);

  const count = await fetchWinnerCount();
  alreadyPlayers.textContent = count === null ? "—" : count.toLocaleString("fr-FR");
}

// ═══════════════════════════════════════════════
//  TIMER (jusqu'à minuit Paris)
// ═══════════════════════════════════════════════
let timerInterval = null;
function startTimerUpdate(...elements) {
  // Met à jour tous les éléments timer chaque seconde
  function tick() {
    const ms = getTimeUntilMidnightParis();
    const formatted = formatTimeLeft(ms);
    elements.forEach(el => { if (el) el.textContent = formatted; });

    // Si on a passé minuit, on recharge la page pour relancer le jeu
    if (ms <= 0) {
      clearInterval(timerInterval);
      location.reload();
    }
  }
  tick();
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      // Met à jour tous les timers de la page (win + already)
      const ms = getTimeUntilMidnightParis();
      const formatted = formatTimeLeft(ms);
      [winTimer, alreadyTimer].forEach(el => {
        if (el && el.textContent !== "--:--:--") el.textContent = formatted;
        else if (el) el.textContent = formatted;
      });
      if (ms <= 0) {
        clearInterval(timerInterval);
        location.reload();
      }
    }, 1000);
  }
}

// ═══════════════════════════════════════════════
//  RESTAURATION DE LA SESSION
// ═══════════════════════════════════════════════
function restoreSession() {
  const state = loadDailyState();
  if (!state) return;

  // Si déjà gagné aujourd'hui → afficher le panel
  if (state.won) {
    showAlreadyWonPanel();
    return;
  }

  // Sinon : restaurer les essais en cours (sans animation)
  if (state.guessNames && state.guessNames.length > 0) {
    columnsHeader.classList.remove("hidden");
    // On rejoue dans l'ordre, mais l'insertion se fait en tête → inversons l'ordre
    const orderedNames = [...state.guessNames];
    orderedNames.forEach(name => {
      const c = CHARACTERS.find(x => x.name === name);
      if (c) {
        guessedNames.add(c.name);
        guesses.push(c);
        renderGuessRow(c, false); // sans animation
      }
    });
    triesSpan.textContent = guesses.length;
    if (guesses.length >= 8) showHint();
  }
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
restoreSession();
