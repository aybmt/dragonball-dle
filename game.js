// =============================================
//  DRAGON BALL DLE — Logique de jeu
//  • Personnage du jour commun à tous (fuseau Paris)
//  • Reset à minuit Paris
//  • Mémorisation de la victoire (localStorage)
//  • Compteur de joueurs simulé (déterministe par jour)
// =============================================

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

function getParisDateKey(date) {
  date = date || new Date();
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    const d = parts.find(p => p.type === "day").value;
    return y + "-" + m + "-" + d;
  } catch (e) {
    // fallback : date locale
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
}

// Hash déterministe FNV-1a
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getDailyCharacter() {
  const dateKey = getParisDateKey();
  const index = hashString(dateKey) % CHARACTERS.length;
  return { character: CHARACTERS[index], dateKey: dateKey };
}

function getTimeUntilMidnightParis() {
  try {
    const now = new Date();
    const parisNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const localNow = new Date(now.toLocaleString("en-US"));
    const offsetMs = parisNow.getTime() - localNow.getTime();
    const nextMidnightParis = new Date(parisNow);
    nextMidnightParis.setHours(24, 0, 0, 0);
    const targetUtc = nextMidnightParis.getTime() - offsetMs;
    return Math.max(0, targetUtc - now.getTime());
  } catch (e) {
    // fallback : minuit local
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return Math.max(0, next.getTime() - now.getTime());
  }
}

function formatTimeLeft(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ═══════════════════════════════════════════════
//  COMPTEUR SIMULÉ DÉTERMINISTE
//  Génère un nombre de joueurs crédible basé sur la date,
//  qui augmente progressivement au fil de la journée.
// ═══════════════════════════════════════════════

function getSimulatedPlayerCount(dateKey) {
  // Base déterministe : entre ~80 et ~250 par jour selon le hash
  const dayHash = hashString(dateKey + "_players");
  const baseTotal = 80 + (dayHash % 170);

  // Progression dans la journée : 0% à minuit, ~100% à 23h59
  // On suppose une courbe : croissance lente le matin, pic en soirée
  try {
    const now = new Date();
    const parisHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Paris", hour: "numeric", hour12: false
      }).format(now), 10
    );
    const parisMin = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Paris", minute: "numeric"
      }).format(now), 10
    );
    const minutesIntoDay = parisHour * 60 + parisMin;
    // Courbe : sinusoïdale lente le matin, plus de monde en soirée
    const progress = Math.min(1, minutesIntoDay / (24 * 60));
    // Courbe accélérée vers le soir (puissance 0.6)
    const adjusted = Math.pow(progress, 0.6);
    return Math.floor(baseTotal * adjusted) + 1;
  } catch (e) {
    return Math.floor(baseTotal * 0.5);
  }
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

if (poolSpan) poolSpan.textContent = CHARACTERS.length;

// ═══════════════════════════════════════════════
//  LOCALSTORAGE
// ═══════════════════════════════════════════════
const STATE_KEY = "dbdle_daily_state";

function loadDailyState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
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
//  MODALE LÉGENDE
// ═══════════════════════════════════════════════
const LEGEND_KEY = "dbdle_legend_sober";

function openLegend()  { if (legendModal) legendModal.classList.remove("hidden"); }
function closeLegend() {
  if (legendModal) legendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) {}
}

try {
  if (!localStorage.getItem(LEGEND_KEY)) openLegend();
} catch (e) { openLegend(); }

if (legendClose) legendClose.addEventListener("click", closeLegend);
if (legendStart) legendStart.addEventListener("click", closeLegend);
if (helpBtn)     helpBtn.addEventListener("click", openLegend);

if (legendModal) {
  legendModal.addEventListener("click", function(e) {
    if (e.target === legendModal) closeLegend();
  });
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && legendModal && !legendModal.classList.contains("hidden")) closeLegend();
});

// ═══════════════════════════════════════════════
//  AUTOCOMPLÉTION
// ═══════════════════════════════════════════════
if (input) {
  input.addEventListener("input", function() {
    const val = input.value.trim().toLowerCase();
    if (val.length < 1) { hideSuggestions(); return; }

    const matches = CHARACTERS
      .filter(function(c) { return c.name.toLowerCase().indexOf(val) !== -1 && !guessedNames.has(c.name); })
      .slice(0, 7);

    if (matches.length === 0) { hideSuggestions(); return; }

    suggestions.innerHTML = "";
    matches.forEach(function(c) {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = c.name;
      div.addEventListener("click", function() {
        input.value = c.name;
        hideSuggestions();
        submitGuess();
      });
      suggestions.appendChild(div);
    });
    suggestions.classList.remove("hidden");
  });

  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") submitGuess();
    if (e.key === "Escape") hideSuggestions();
  });
}

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-box")) hideSuggestions();
});

if (guessBtn) guessBtn.addEventListener("click", submitGuess);

function hideSuggestions() {
  if (!suggestions) return;
  suggestions.classList.add("hidden");
  suggestions.innerHTML = "";
}

// ═══════════════════════════════════════════════
//  SOUMISSION D'UN ESSAI
// ═══════════════════════════════════════════════
function submitGuess() {
  if (gameWon) return;
  const name = input.value.trim();
  if (!name) return;

  if (isEasterEgg(name)) {
    gameWon = true;
    input.value = "";
    hideSuggestions();
    clearError();
    setTimeout(showEasterWin, 300);
    return;
  }

  const character = CHARACTERS.find(function(c) { return c.name.toLowerCase() === name.toLowerCase(); });
  if (!character) { showError("Personnage introuvable !"); return; }
  if (guessedNames.has(character.name)) { showError("Déjà essayé !"); return; }

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
    saveDailyState({
      dateKey: currentDateKey,
      won: true,
      targetName: target.name,
      tries: guesses.length,
      guessNames: Array.from(guessedNames)
    });
    setTimeout(showWin, 600);
    return;
  }

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
function renderGuessRow(character, animate) {
  if (animate === undefined) animate = true;

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
    img.src = character.image;
    img.onerror = function() { imgWrap.innerHTML = ""; imgWrap.appendChild(makePlaceholder()); };
    imgWrap.appendChild(img);
  } else {
    imgWrap.appendChild(makePlaceholder());
  }

  const nameSpan = document.createElement("span");
  nameSpan.textContent = character.name;
  nameCell.appendChild(imgWrap);
  nameCell.appendChild(nameSpan);
  row.appendChild(nameCell);

  ATTRIBUTES.forEach(function(attr, i) {
    const cell = buildCell(character, attr);
    if (animate) cell.style.animationDelay = (i * 80) + "ms";
    else cell.style.animation = "none";
    row.appendChild(cell);
  });

  guessesContainer.insertBefore(row, guessesContainer.firstChild);
  if (animate) {
    requestAnimationFrame(function() { row.classList.add("revealed"); });
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
  cell.innerHTML = '<span class="cell-val">' + gVal + '</span>';
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
    cell.innerHTML = '<span class="cell-val">' + gVal + '</span>';
    return cell;
  }
  const diff = tVal - gVal;
  const stop = computeGradStop(Math.abs(diff), "episode");
  cell.style.setProperty("--grad-stop", stop + "%");

  if (diff > 0) {
    cell.classList.add("gradient-up");
    cell.innerHTML = '<span class="cell-arrow">▲</span><span class="cell-val">' + gVal + '</span>';
  } else {
    cell.classList.add("gradient-down");
    cell.innerHTML = '<span class="cell-arrow">▼</span><span class="cell-val">' + gVal + '</span>';
  }
  return cell;
}

function buildSagaCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = '<span class="cell-val">' + gVal + '</span>';
    return cell;
  }
  const gIdx = SAGA_ORDER.indexOf(gVal);
  const tIdx = SAGA_ORDER.indexOf(tVal);
  if (gIdx === -1 || tIdx === -1) {
    cell.classList.add("wrong");
    cell.innerHTML = '<span class="cell-val">' + gVal + '</span>';
    return cell;
  }
  const diff = tIdx - gIdx;
  const stop = computeGradStop(Math.abs(diff), "saga");
  cell.style.setProperty("--grad-stop", stop + "%");
  if (diff > 0) {
    cell.classList.add("gradient-up");
    cell.innerHTML = '<span class="cell-arrow">▲</span><span class="cell-val">' + gVal + '</span>';
  } else {
    cell.classList.add("gradient-down");
    cell.innerHTML = '<span class="cell-arrow">▼</span><span class="cell-val">' + gVal + '</span>';
  }
  return cell;
}

function buildMultiCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
  } else {
    const gP = gVal.split("/").map(function(s) { return s.trim(); });
    const tP = tVal.split("/").map(function(s) { return s.trim(); });
    cell.classList.add(gP.some(function(s) { return tP.indexOf(s) !== -1; }) ? "partial" : "wrong");
  }
  cell.innerHTML = '<span class="cell-val">' + gVal + '</span>';
  return cell;
}

// ═══════════════════════════════════════════════
//  INDICE
// ═══════════════════════════════════════════════
function showHint() {
  hintShown = true;
  const firstLetter = target.name.charAt(0).toUpperCase();
  hintText.textContent = "Le nom commence par « " + firstLetter + " »";
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
function showWin() {
  winName.textContent = target.name;
  winTries.textContent = guesses.length;
  winScreen.classList.remove("hidden");
  startTimerUpdate();
  winPlayers.textContent = getSimulatedPlayerCount(currentDateKey).toLocaleString("fr-FR");
}

function showEasterWin() {
  easterTargetName.textContent = target.name;
  easterScreen.classList.remove("hidden");
}

if (winCloseBtn) {
  winCloseBtn.addEventListener("click", function() {
    winScreen.classList.add("hidden");
    showAlreadyWonPanel();
  });
}

if (easterCloseBtn) {
  easterCloseBtn.addEventListener("click", function() {
    easterScreen.classList.add("hidden");
  });
}

// ═══════════════════════════════════════════════
//  PANEL « DÉJÀ GAGNÉ »
// ═══════════════════════════════════════════════
function showAlreadyWonPanel() {
  const state = loadDailyState();
  if (!state || !state.won) return;

  gameArea.classList.add("hidden");
  alreadyWon.classList.remove("hidden");

  alreadyName.textContent = state.targetName;
  alreadyTries.textContent = state.tries;
  alreadyPlayers.textContent = getSimulatedPlayerCount(currentDateKey).toLocaleString("fr-FR");

  startTimerUpdate();
}

// ═══════════════════════════════════════════════
//  TIMER (jusqu'à minuit Paris)
// ═══════════════════════════════════════════════
let timerInterval = null;
function startTimerUpdate() {
  function tick() {
    const ms = getTimeUntilMidnightParis();
    const formatted = formatTimeLeft(ms);
    if (winTimer)     winTimer.textContent = formatted;
    if (alreadyTimer) alreadyTimer.textContent = formatted;
    if (ms <= 0) {
      clearInterval(timerInterval);
      location.reload();
    }
  }
  tick();
  if (!timerInterval) {
    timerInterval = setInterval(tick, 1000);
  }
}

// ═══════════════════════════════════════════════
//  RESTAURATION DE LA SESSION
// ═══════════════════════════════════════════════
function restoreSession() {
  const state = loadDailyState();
  if (!state) return;

  if (state.won) {
    // restaure aussi gameWon pour éviter les essais ultérieurs
    gameWon = true;
    showAlreadyWonPanel();
    return;
  }

  if (state.guessNames && state.guessNames.length > 0) {
    columnsHeader.classList.remove("hidden");
    state.guessNames.forEach(function(name) {
      const c = CHARACTERS.find(function(x) { return x.name === name; });
      if (c) {
        guessedNames.add(c.name);
        guesses.push(c);
        renderGuessRow(c, false);
      }
    });
    triesSpan.textContent = guesses.length;
    if (guesses.length >= 8) showHint();
  }
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════
try {
  restoreSession();
} catch (e) {
  console.warn("Restore session failed:", e);
}
