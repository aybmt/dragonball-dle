// =============================================
//  DRAGON BALL DLE — Jeu "Qui est-ce ?" (Silhouette)
// =============================================

// ─── Utils (dupliqués car game.js n'est pas chargé ici) ───
function getParisDateKey(date) {
  date = date || new Date();
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const y = parts.find(function(p) { return p.type === "year"; }).value;
    const m = parts.find(function(p) { return p.type === "month"; }).value;
    const d = parts.find(function(p) { return p.type === "day"; }).value;
    return y + "-" + m + "-" + d;
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

// Insensible à la casse ET aux accents
function normalize(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCharacterByName(input) {
  const n = normalize(input);
  if (!n) return null;
  return CHARACTERS.find(function(c) { return normalize(c.name) === n; }) || null;
}

// ─── State ───
const dateKey = getParisDateKey();
const SILH_STATE_KEY = "dbdle_silhouette_" + dateKey;
const MAX_TRIES = 6;

// Personnages sans image disponible → exclus du tirage (silhouette impossible)
const NO_IMAGE = ["Bardock", "Buu (Super)"];
const SILH_POOL = CHARACTERS.filter(function(c) {
  return c.image && NO_IMAGE.indexOf(c.name) === -1;
});

const silhIndex = hashString(dateKey + "_silhouette") % SILH_POOL.length;
const target = SILH_POOL[silhIndex];

// Niveaux de révélation : du plus obscur (0 erreur) au presque clair (5 erreurs).
// La victoire / défaite révèle l'image complète (filtre "none").
const REVEAL_FILTERS = [
  "brightness(0.16) contrast(0.5) blur(9px)",      // 0 — ombre, masse à peine devinable
  "brightness(0.32) grayscale(1) blur(6px)",       // 1 — silhouette qui se précise
  "brightness(0.5) grayscale(1) blur(4.5px)",      // 2 — sort de l'ombre
  "brightness(0.68) grayscale(0.55) blur(3px)",    // 3 — couleurs naissantes
  "brightness(0.85) grayscale(0.2) blur(1.6px)",   // 4 — presque visible
  "brightness(0.95) blur(0.6px)"                   // 5 — dernière chance
];

let state = {
  solved: false,
  failed: false,
  tries: 0,
  guessNames: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(SILH_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      solved: !!parsed.solved,
      failed: !!parsed.failed,
      tries: typeof parsed.tries === "number" ? parsed.tries : (Array.isArray(parsed.guessNames) ? parsed.guessNames.length : 0),
      guessNames: Array.isArray(parsed.guessNames) ? parsed.guessNames.slice() : []
    };
  } catch (e) { return null; }
}

function saveState() {
  try { localStorage.setItem(SILH_STATE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ─── DOM refs ───
const silhImg          = document.getElementById("silh-img");
const silhFrame        = document.getElementById("silh-frame");
const silhCaption      = document.getElementById("silh-caption");
const sCurrent         = document.getElementById("silh-current");
const sProgress        = document.getElementById("silh-progress");
const sSearchInput     = document.getElementById("silh-search-input");
const sSuggestions     = document.getElementById("silh-suggestions");
const sGuessBtn        = document.getElementById("silh-guess-btn");
const sErrorMsg        = document.getElementById("silh-error-msg");
const sWrongList       = document.getElementById("silh-wrong-list");
const sWinOverlay      = document.getElementById("silh-win-overlay");
const sLoseOverlay     = document.getElementById("silh-lose-overlay");
const sWinTries        = document.getElementById("silh-win-tries");
const sWinTimer        = document.getElementById("silh-win-timer");
const sLoseTimer       = document.getElementById("silh-lose-timer");
const sWinName         = document.getElementById("silh-win-char-name");
const sLoseName        = document.getElementById("silh-lose-char-name");
const sWinCharImg      = document.getElementById("silh-win-char-img");
const sLoseCharImg     = document.getElementById("silh-lose-char-img");
const sHelpBtn         = document.getElementById("help-btn");
const sLegendModal     = document.getElementById("legend-modal");
const sLegendClose     = document.getElementById("legend-close");
const sLegendStart     = document.getElementById("legend-start");

// ─── Révélation progressive ───
function applyReveal() {
  if (!silhImg) return;
  if (state.solved || state.failed) {
    silhImg.style.filter = "none";
    if (silhFrame) {
      silhFrame.classList.add("revealed");
      silhFrame.classList.toggle("lost", state.failed && !state.solved);
    }
    if (silhCaption) silhCaption.textContent = state.solved ? "Démasqué !" : "C'était " + target.name + ".";
    return;
  }
  const lvl = Math.min(state.tries, REVEAL_FILTERS.length - 1);
  silhImg.style.filter = REVEAL_FILTERS[lvl];
}

// ─── Autocomplete ───
let activeSuggestion = -1;

function hideSuggestions() {
  if (!sSuggestions) return;
  sSuggestions.classList.add("hidden");
  sSuggestions.innerHTML = "";
  activeSuggestion = -1;
}

function getSuggestionEls() {
  return sSuggestions ? Array.prototype.slice.call(sSuggestions.querySelectorAll(".suggestion-item")) : [];
}

function highlightSuggestion(idx) {
  const els = getSuggestionEls();
  if (!els.length) return;
  activeSuggestion = (idx + els.length) % els.length;
  els.forEach(function(el, i) { el.classList.toggle("active", i === activeSuggestion); });
  els[activeSuggestion].scrollIntoView({ block: "nearest" });
}

function renderSuggestions() {
  const val = normalize(sSearchInput.value);
  if (val.length < 1) { hideSuggestions(); return; }
  const guessedSet = new Set(state.guessNames.map(normalize));
  const matches = CHARACTERS
    .filter(function(c) { return normalize(c.name).indexOf(val) !== -1 && !guessedSet.has(normalize(c.name)); })
    .slice(0, 7);
  if (matches.length === 0) { hideSuggestions(); return; }
  sSuggestions.innerHTML = "";
  activeSuggestion = -1;
  matches.forEach(function(c) {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    const img = c.image ? '<img class="suggestion-thumb" src="' + c.image + '" alt="" onerror="this.style.display=\'none\'" />' : '';
    div.innerHTML = img + '<span>' + c.name + '</span>';
    div.addEventListener("mousedown", function(e) {
      e.preventDefault();
      sSearchInput.value = c.name;
      hideSuggestions();
      submitGuess();
    });
    sSuggestions.appendChild(div);
  });
  sSuggestions.classList.remove("hidden");
}

if (sSearchInput) {
  sSearchInput.addEventListener("input", renderSuggestions);
  sSearchInput.addEventListener("keydown", function(e) {
    const els = getSuggestionEls();
    const open = sSuggestions && !sSuggestions.classList.contains("hidden") && els.length > 0;
    if (e.key === "ArrowDown") { if (open) { e.preventDefault(); highlightSuggestion(activeSuggestion + 1); } return; }
    if (e.key === "ArrowUp")   { if (open) { e.preventDefault(); highlightSuggestion(activeSuggestion - 1); } return; }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeSuggestion >= 0) {
        sSearchInput.value = els[activeSuggestion].querySelector("span").textContent;
        hideSuggestions();
      }
      submitGuess();
      return;
    }
    if (e.key === "Escape") hideSuggestions();
  });
}

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-box")) hideSuggestions();
});

if (sGuessBtn) sGuessBtn.addEventListener("click", submitGuess);

// ─── Error ───
let errorTimeout = null;
function showError(msg) {
  if (!sErrorMsg) return;
  sErrorMsg.textContent = msg;
  sErrorMsg.classList.remove("hidden");
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(function() { sErrorMsg.classList.add("hidden"); }, 2500);
}

// ─── Progress dots ───
function renderProgress() {
  if (!sProgress) return;
  const wrongCount = state.solved ? state.tries - 1 : state.tries;
  sProgress.innerHTML = "";
  for (var i = 0; i < MAX_TRIES; i++) {
    const dot = document.createElement("span");
    dot.className = "q-dot";
    if (i < wrongCount) dot.classList.add("miss");
    else if (state.solved && i === state.tries - 1) dot.classList.add("hit");
    else if (!state.solved && !state.failed && i === state.tries) dot.classList.add("current");
    sProgress.appendChild(dot);
  }
  if (sCurrent) sCurrent.textContent = Math.min(state.tries + 1, MAX_TRIES);
}

// ─── Wrong chip ───
function addWrongChip(name) {
  if (!sWrongList) return;
  const chip = document.createElement("div");
  chip.className = "quote-wrong-chip";
  chip.innerHTML = '<span class="chip-x">✗</span> ' + name;
  sWrongList.appendChild(chip);
}

// ─── Portrait helper (fallback initiale) ───
function setPortrait(imgEl, character) {
  if (!imgEl || !character) return;
  const parent = imgEl.parentNode;
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

// ─── Timer ───
let timerInterval = null;
function startTimerUpdate(winTimerEl, loseTimerEl) {
  function tick() {
    const ms = getTimeUntilMidnightParis();
    const formatted = formatTimeLeft(ms);
    if (winTimerEl)  winTimerEl.textContent = formatted;
    if (loseTimerEl) loseTimerEl.textContent = formatted;
    if (ms <= 0) { clearInterval(timerInterval); location.reload(); }
  }
  tick();
  if (!timerInterval) timerInterval = setInterval(tick, 1000);
}

function showWin() {
  if (!sWinOverlay) return;
  if (sWinTries) sWinTries.textContent = state.tries;
  if (sWinName) sWinName.textContent = target.name;
  setPortrait(sWinCharImg, target);
  sWinOverlay.classList.remove("hidden");
  startTimerUpdate(sWinTimer, null);
}

function showLose() {
  if (!sLoseOverlay) return;
  if (sLoseName) sLoseName.textContent = target.name;
  setPortrait(sLoseCharImg, target);
  sLoseOverlay.classList.remove("hidden");
  startTimerUpdate(null, sLoseTimer);
}

function disableInput() {
  if (sSearchInput) { sSearchInput.disabled = true; sSearchInput.placeholder = "Partie terminée"; }
  if (sGuessBtn) sGuessBtn.disabled = true;
  hideSuggestions();
}

// ─── Submit ───
function submitGuess() {
  if (state.solved || state.failed) return;
  const raw = sSearchInput ? sSearchInput.value.trim() : "";
  if (!raw) { showError("Entre un nom de personnage."); return; }
  const character = findCharacterByName(raw);
  if (!character) { showError("Personnage introuvable !"); return; }
  if (state.guessNames.indexOf(character.name) !== -1) { showError("Déjà essayé !"); return; }

  if (sSearchInput) sSearchInput.value = "";
  hideSuggestions();

  state.tries += 1;
  state.guessNames.push(character.name);

  if (character.name === target.name) {
    state.solved = true;
    saveState();
    renderProgress();
    applyReveal();
    disableInput();
    setTimeout(showWin, 700);
    return;
  }

  addWrongChip(character.name);
  saveState();
  renderProgress();
  applyReveal();

  if (state.tries >= MAX_TRIES) {
    state.failed = true;
    saveState();
    applyReveal();
    disableInput();
    setTimeout(showLose, 700);
  }
}

// ─── Legend ───
const LEGEND_KEY = "dbdle_legend_silhouette";
function openLegend()  { if (sLegendModal) sLegendModal.classList.remove("hidden"); }
function closeLegend() {
  if (sLegendModal) sLegendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) {}
}
if (sLegendClose) sLegendClose.addEventListener("click", closeLegend);
if (sLegendStart) sLegendStart.addEventListener("click", closeLegend);
if (sHelpBtn)     sHelpBtn.addEventListener("click", openLegend);
if (sLegendModal) {
  sLegendModal.addEventListener("click", function(e) { if (e.target === sLegendModal) closeLegend(); });
}
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && sLegendModal && !sLegendModal.classList.contains("hidden")) closeLegend();
});

// ─── Restore / Init ───
function restoreState(saved) {
  state = saved;
  state.guessNames.forEach(function(name) {
    if (name !== target.name) addWrongChip(name);
  });
  renderProgress();
  applyReveal();
  if (state.solved) { disableInput(); showWin(); return; }
  if (state.failed) { disableInput(); showLose(); return; }
}

(function init() {
  // Charge l'image cible (avec filtre silhouette appliqué via CSS/JS)
  if (silhImg) {
    silhImg.alt = "Personnage mystère";
    silhImg.src = target.image;
  }

  const saved = loadState();
  if (saved && (saved.solved || saved.failed || saved.guessNames.length > 0)) {
    restoreState(saved);
  } else {
    renderProgress();
    applyReveal();
    try { if (!localStorage.getItem(LEGEND_KEY)) openLegend(); } catch (e) {}
  }

  if (sSearchInput && !sSearchInput.disabled) {
    setTimeout(function() { try { sSearchInput.focus(); } catch (e) {} }, 100);
  }
})();
