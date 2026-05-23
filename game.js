// =============================================
//  DRAGON BALL DLE — Logique de jeu
//  • Personnage du jour commun à tous (fuseau Paris)
//  • Reset à minuit Paris
//  • Mémorisation de la victoire (localStorage)
//  • Compteur de joueurs simulé (déterministe par jour)
// =============================================

const INITIAL_MODE = window.INITIAL_MODE || 'daily';

// ─── Attributs ───
const ATTRIBUTES = [
  { key: "sex",         label: "Sexe",        type: "exact" },
  { key: "hair",        label: "Cheveux",     type: "exact" },
  { key: "origin",      label: "Origine",     type: "exact" },
  { key: "race",        label: "Race",        type: "exact" },
  { key: "affiliation", label: "Affiliation", type: "exact" },
  { key: "episode",     label: "Épisode",     type: "numeric" },
  { key: "saga",        label: "Saga",        type: "saga" },
  { key: "serie",       label: "Série",       type: "multi" },
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
//  COUNTERAPI — Compteur réel de gagnants par jour
//  Service tiers gratuit, sans clé. Fallback simulé si KO.
// ═══════════════════════════════════════════════
const COUNTER_NS = "dragonball-dle-aybmt";
const COUNTER_FLAG_PREFIX = "dbdle_counted_";

function counterUrl(dateKey, action) {
  const base = "https://api.counterapi.dev/v1/" + COUNTER_NS + "/" + dateKey;
  return action ? base + "/" + action : base + "/";
}

function readCounter(dateKey) {
  return fetch(counterUrl(dateKey, ""), { cache: "no-store" })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { return d && typeof d.count === "number" ? d.count : null; })
    .catch(function() { return null; });
}

function bumpCounter(dateKey) {
  return fetch(counterUrl(dateKey, "up"), { cache: "no-store" })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { return d && typeof d.count === "number" ? d.count : null; })
    .catch(function() { return null; });
}

// Incrémente une seule fois par navigateur/jour, sinon lit.
function getDailyWinnerCount(dateKey) {
  const flag = COUNTER_FLAG_PREFIX + dateKey;
  let alreadyCounted = false;
  try { alreadyCounted = !!localStorage.getItem(flag); } catch (e) {}

  const promise = alreadyCounted ? readCounter(dateKey) : bumpCounter(dateKey);
  return promise.then(function(count) {
    if (count !== null && !alreadyCounted) {
      try { localStorage.setItem(flag, "1"); } catch (e) {}
    }
    if (count === null) return getSimulatedPlayerCount(dateKey);
    return count;
  });
}

// ═══════════════════════════════════════════════
//  COMPTEUR SIMULÉ (fallback)
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
//  STATS PERSONNELLES (localStorage)
// ═══════════════════════════════════════════════
const STATS_KEY = "dbdle_stats_v1";

function defaultStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastWonDateKey: null,
    distribution: {}
  };
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw);
    const base = defaultStats();
    for (const k in base) if (parsed[k] !== undefined) base[k] = parsed[k];
    if (!base.distribution || typeof base.distribution !== "object") base.distribution = {};
    return base;
  } catch (e) { return defaultStats(); }
}

function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {}
}

function previousDateKey(dateKey) {
  const parts = dateKey.split("-");
  const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function recordWin(tries, dateKey) {
  const stats = loadStats();
  if (stats.lastWonDateKey === dateKey) return stats; // idempotent
  stats.gamesPlayed += 1;
  stats.gamesWon += 1;
  if (stats.lastWonDateKey === previousDateKey(dateKey)) stats.currentStreak += 1;
  else stats.currentStreak = 1;
  if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
  stats.lastWonDateKey = dateKey;
  const bucket = tries >= 10 ? "10+" : String(tries);
  stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;
  saveStats(stats);
  return stats;
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

let isPracticeMode = (INITIAL_MODE === 'practice');

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
const winnerImg   = document.getElementById("winner-img");
const alreadyImg  = document.getElementById("already-img");
const winStatsBtn = document.getElementById("win-stats-btn");
const alreadyStatsBtn = document.getElementById("already-stats-btn");
const statsBtn    = document.getElementById("stats-btn");
const statsModal  = document.getElementById("stats-modal");
const statsClose  = document.getElementById("stats-close");
const statsCloseBottom = document.getElementById("stats-close-bottom");
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

const practiceEntry   = document.getElementById("practice-entry");
const practiceStart   = document.getElementById("practice-start");
const practiceBanner  = document.getElementById("practice-banner");
const practiceNewBtn  = document.getElementById("practice-new");
const practiceExitBtn = document.getElementById("practice-exit");
const winTitle        = document.getElementById("win-title");
const winDailyInfo    = document.getElementById("win-daily-info");
const winPracticeNote = document.getElementById("win-practice-note");
const winPracticeAgain= document.getElementById("win-practice-again");

if (poolSpan) poolSpan.textContent = CHARACTERS.length;

// ─── Chrono (practice mode) ───
let chronoInterval = null;
let chronoStart = null;
const PRACTICE_BEST_KEY = 'dbdle_practice_best';
const timerDisplayEl = document.getElementById('timer-display');
const winTimeEl = document.getElementById('win-time');
const winRecordMsg = document.getElementById('win-record-msg');

function startChrono() {
  if (!timerDisplayEl) return;
  chronoStart = Date.now();
  chronoInterval = setInterval(function() {
    timerDisplayEl.textContent = formatChrono(Date.now() - chronoStart);
  }, 500);
}
function stopChrono() {
  if (chronoInterval) { clearInterval(chronoInterval); chronoInterval = null; }
  if (!chronoStart) return 0;
  return Date.now() - chronoStart;
}
function resetChrono() {
  stopChrono(); chronoStart = null;
  if (timerDisplayEl) timerDisplayEl.textContent = '--:--';
}
function formatChrono(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

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
  if (isPracticeMode && guesses.length === 1) startChrono();
  triesSpan.textContent = guesses.length;

  columnsHeader.classList.remove("hidden");
  renderGuessRow(character);

  input.value = "";
  hideSuggestions();

  if (character.name === target.name) {
    gameWon = true;
    if (!isPracticeMode) {
      saveDailyState({
        dateKey: currentDateKey,
        won: true,
        targetName: target.name,
        tries: guesses.length,
        guessNames: Array.from(guessedNames)
      });
      recordWin(guesses.length, currentDateKey);
    }
    setTimeout(showWin, 600);
    return;
  }

  if (!isPracticeMode) {
    saveDailyState({
      dateKey: currentDateKey,
      won: false,
      guessNames: Array.from(guessedNames)
    });
  }

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
function setWinnerImage(imgEl, character) {
  if (!imgEl || !character) return;
  const parent = imgEl.parentNode;
  // retire un fallback éventuel laissé par un appel précédent
  const oldFb = parent.querySelector(".winner-img-fallback");
  if (oldFb) parent.removeChild(oldFb);

  function showFallback() {
    imgEl.style.display = "none";
    const fb = document.createElement("div");
    fb.className = "winner-img-fallback";
    fb.textContent = (character.name || "?").charAt(0).toUpperCase();
    parent.appendChild(fb);
  }

  if (!character.image) { showFallback(); return; }
  imgEl.style.display = "";
  imgEl.alt = character.name;
  imgEl.onerror = showFallback;
  imgEl.src = character.image;
}

function showWin() {
  winName.textContent = target.name;
  winTries.textContent = guesses.length;
  setWinnerImage(winnerImg, target);

  if (isPracticeMode) {
    if (winTitle) winTitle.textContent = 'Trouvé !';
    if (winDailyInfo) winDailyInfo.classList.add('hidden');
    if (winPracticeNote) winPracticeNote.classList.remove('hidden');
    if (winPracticeAgain) winPracticeAgain.classList.remove('hidden');
    const elapsed = stopChrono();
    if (winTimeEl) winTimeEl.textContent = formatChrono(elapsed);
    try {
      const prevBest = parseInt(localStorage.getItem(PRACTICE_BEST_KEY) || '999999999');
      if (elapsed > 0 && elapsed < prevBest) {
        localStorage.setItem(PRACTICE_BEST_KEY, String(elapsed));
        if (winRecordMsg) winRecordMsg.classList.remove('hidden');
      }
    } catch(e) {}
    winScreen.classList.remove('hidden');
    return;
  }

  if (winTitle) winTitle.textContent = "Bien joué !";
  if (winDailyInfo) winDailyInfo.classList.remove("hidden");
  if (winPracticeNote) winPracticeNote.classList.add("hidden");
  if (winPracticeAgain) winPracticeAgain.classList.add("hidden");

  winScreen.classList.remove("hidden");
  startTimerUpdate();
  winPlayers.textContent = "…";
  getDailyWinnerCount(currentDateKey).then(function(count) {
    if (typeof count === "number") {
      winPlayers.textContent = count.toLocaleString("fr-FR");
    } else {
      winPlayers.textContent = "—";
    }
  });
}

function showEasterWin() {
  easterTargetName.textContent = target.name;
  easterScreen.classList.remove("hidden");
}

if (winCloseBtn) {
  winCloseBtn.addEventListener("click", function() {
    winScreen.classList.add("hidden");
    if (isPracticeMode) { exitPracticeMode(); return; }
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

  if (alreadyImg) {
    const ch = CHARACTERS.find(function(c) { return c.name === state.targetName; }) || { name: state.targetName };
    setWinnerImage(alreadyImg, ch);
  }

  alreadyPlayers.textContent = "…";
  getDailyWinnerCount(currentDateKey).then(function(count) {
    if (typeof count === "number") {
      alreadyPlayers.textContent = count.toLocaleString("fr-FR");
    } else {
      alreadyPlayers.textContent = "—";
    }
  });

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
//  MODE ENTRAÎNEMENT
// ═══════════════════════════════════════════════
function pickPracticeTarget() {
  // Tire au sort un perso différent du quotidien (et différent du précédent en pratique)
  const exclude = new Set([daily.character.name]);
  if (isPracticeMode && target && target.name) exclude.add(target.name);
  const pool = CHARACTERS.filter(function(c) { return !exclude.has(c.name); });
  return pool[Math.floor(Math.random() * pool.length)];
}

function resetBoard() {
  guesses = [];
  guessedNames = new Set();
  gameWon = false;
  hintShown = false;
  if (guessesContainer) guessesContainer.innerHTML = "";
  if (triesSpan) triesSpan.textContent = "0";
  if (hintBox) hintBox.classList.add("hidden");
  if (columnsHeader) columnsHeader.classList.add("hidden");
  if (errorMsg) errorMsg.classList.add("hidden");
  if (input) input.value = "";
  hideSuggestions();
}

function snapshotDaily() {
  return {
    target: target,
    guesses: guesses.slice(),
    guessedNames: new Set(guessedNames),
    gameWon: gameWon,
    hintShown: hintShown,
    guessesHTML: guessesContainer ? guessesContainer.innerHTML : "",
    triesText: triesSpan ? triesSpan.textContent : "0",
    hintHidden: hintBox ? hintBox.classList.contains("hidden") : true,
    hintTextContent: hintText ? hintText.textContent : "",
    headerHidden: columnsHeader ? columnsHeader.classList.contains("hidden") : true,
    gameAreaHidden: gameArea ? gameArea.classList.contains("hidden") : false,
    alreadyWonHidden: alreadyWon ? alreadyWon.classList.contains("hidden") : true,
  };
}

function enterPracticeMode() {
  if (isPracticeMode) { startNewPractice(); return; }
  dailySnapshot = snapshotDaily();
  isPracticeMode = true;
  if (practiceEntry)  practiceEntry.classList.add("hidden");
  if (practiceBanner) practiceBanner.classList.remove("hidden");
  if (alreadyWon)     alreadyWon.classList.add("hidden");
  if (gameArea)       gameArea.classList.remove("hidden");
  startNewPractice();
}

function startNewPractice() {
  resetChrono();
  target = pickPracticeTarget();
  resetBoard();
  if (winScreen) winScreen.classList.add("hidden");
}

function exitPracticeMode() {
  if (!isPracticeMode || !dailySnapshot) return;
  // Restaure l'état quotidien
  target        = dailySnapshot.target;
  guesses       = dailySnapshot.guesses;
  guessedNames  = dailySnapshot.guessedNames;
  gameWon       = dailySnapshot.gameWon;
  hintShown     = dailySnapshot.hintShown;
  if (guessesContainer) guessesContainer.innerHTML = dailySnapshot.guessesHTML;
  if (triesSpan) triesSpan.textContent = dailySnapshot.triesText;
  if (hintBox) {
    if (dailySnapshot.hintHidden) hintBox.classList.add("hidden");
    else hintBox.classList.remove("hidden");
  }
  if (hintText) hintText.textContent = dailySnapshot.hintTextContent;
  if (columnsHeader) {
    if (dailySnapshot.headerHidden) columnsHeader.classList.add("hidden");
    else columnsHeader.classList.remove("hidden");
  }
  if (gameArea) {
    if (dailySnapshot.gameAreaHidden) gameArea.classList.add("hidden");
    else gameArea.classList.remove("hidden");
  }
  if (alreadyWon) {
    if (dailySnapshot.alreadyWonHidden) alreadyWon.classList.add("hidden");
    else alreadyWon.classList.remove("hidden");
  }
  if (winScreen) winScreen.classList.add("hidden");
  if (practiceBanner) practiceBanner.classList.add("hidden");
  if (practiceEntry)  practiceEntry.classList.remove("hidden");
  if (input) input.value = "";
  hideSuggestions();
  isPracticeMode = false;
  dailySnapshot = null;
}

if (practiceStart)   practiceStart.addEventListener("click", enterPracticeMode);
if (practiceNewBtn)  practiceNewBtn.addEventListener("click", startNewPractice);
if (practiceExitBtn) practiceExitBtn.addEventListener("click", exitPracticeMode);
if (winPracticeAgain) winPracticeAgain.addEventListener("click", function() {
  if (winScreen) winScreen.classList.add("hidden");
  startNewPractice();
});

// ═══════════════════════════════════════════════
//  MODALE STATS
// ═══════════════════════════════════════════════
function renderStatsDistribution(stats) {
  const container = document.getElementById("stats-distribution");
  if (!container) return;

  const buckets = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];
  const counts = buckets.map(function(b) { return stats.distribution[b] || 0; });
  const total = counts.reduce(function(a, b) { return a + b; }, 0);

  if (total === 0) {
    container.innerHTML = '<p class="stats-empty">Aucune victoire enregistrée pour l\'instant.</p>';
    return;
  }

  const max = Math.max.apply(null, counts);

  container.innerHTML = "";
  buckets.forEach(function(b, i) {
    const c = counts[i];
    const row = document.createElement("div");
    row.className = "dist-row";

    const label = document.createElement("span");
    label.className = "dist-label";
    label.textContent = b;
    row.appendChild(label);

    const wrap = document.createElement("div");
    wrap.className = "dist-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "dist-bar" + (c === 0 ? " empty" : "");
    const pct = c === 0 ? 0 : Math.max(8, Math.round((c / max) * 100));
    bar.style.width = pct + "%";
    bar.textContent = c;
    wrap.appendChild(bar);
    row.appendChild(wrap);

    container.appendChild(row);
  });
}

function openStats() {
  if (!statsModal) return;
  const stats = loadStats();
  document.getElementById("stat-played").textContent     = stats.gamesPlayed;
  document.getElementById("stat-won").textContent        = stats.gamesWon;
  document.getElementById("stat-streak").textContent     = stats.currentStreak;
  document.getElementById("stat-maxstreak").textContent  = stats.maxStreak;
  renderStatsDistribution(stats);
  statsModal.classList.remove("hidden");
}
function closeStats() {
  if (statsModal) statsModal.classList.add("hidden");
}

if (statsBtn)        statsBtn.addEventListener("click", openStats);
if (winStatsBtn)     winStatsBtn.addEventListener("click", function() {
  winScreen.classList.add("hidden");
  openStats();
});
if (alreadyStatsBtn) alreadyStatsBtn.addEventListener("click", openStats);
if (statsClose)      statsClose.addEventListener("click", closeStats);
if (statsCloseBottom)statsCloseBottom.addEventListener("click", closeStats);
if (statsModal) {
  statsModal.addEventListener("click", function(e) {
    if (e.target === statsModal) closeStats();
  });
}
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && statsModal && !statsModal.classList.contains("hidden")) closeStats();
});

// ═══════════════════════════════════════════════
//  RESTAURATION DE LA SESSION
// ═══════════════════════════════════════════════
function restoreSession() {
  const state = loadDailyState();
  if (!state) return;

  if (state.won) {
    // restaure aussi gameWon pour éviter les essais ultérieurs
    gameWon = true;
    // rattrape les stats si l'utilisateur avait gagné avant l'ajout du tracking
    recordWin(state.tries || guesses.length || 1, currentDateKey);
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
