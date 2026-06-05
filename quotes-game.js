// =============================================
//  DRAGON BALL DLE — Jeu "Qui a dit ça ?"
// =============================================

// ─── Utils (dupliqués depuis game.js car game.js n'est pas chargé ici) ───
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

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── State ───
const dateKey = getParisDateKey();
const QUOTE_STATE_KEY = "dbdle_quote_" + dateKey;
const MAX_TRIES = 6;

const quoteIndex = hashString(dateKey + "_quote") % QUOTES.length;
const dailyQuote = QUOTES[quoteIndex];
const quoteCharacter = CHARACTERS.find(function(c) { return c.name === dailyQuote.character; });

let state = {
  solved: false,
  failed: false,
  tries: 0,
  guessNames: []
};

function loadQuoteState() {
  try {
    const raw = localStorage.getItem(QUOTE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function saveQuoteState() {
  try {
    localStorage.setItem(QUOTE_STATE_KEY, JSON.stringify(state));
  } catch (e) {}
}

// ─── DOM refs ───
const quoteBubble      = document.getElementById("quote-bubble");
const qCurrent         = document.getElementById("q-current");
const qSearchInput     = document.getElementById("q-search-input");
const qSuggestions     = document.getElementById("q-suggestions");
const qGuessBtn        = document.getElementById("q-guess-btn");
const qErrorMsg        = document.getElementById("q-error-msg");
const qWrongList       = document.getElementById("quote-wrong-list");
const hintsContainer   = document.getElementById("hints-container");
const qWinOverlay      = document.getElementById("q-win-overlay");
const qLoseOverlay     = document.getElementById("q-lose-overlay");
const qWinTries        = document.getElementById("q-win-tries");
const qWinTimer        = document.getElementById("q-win-timer");
const qLoseTimer       = document.getElementById("q-lose-timer");
const qLoseCharName    = document.getElementById("q-lose-char-name");
const qWinCharImg      = document.getElementById("q-win-char-img");
const qLoseCharImg     = document.getElementById("q-lose-char-img");
const qHelpBtn         = document.getElementById("help-btn");
const qLegendModal     = document.getElementById("legend-modal");
const qLegendClose     = document.getElementById("legend-close");
const qLegendStart     = document.getElementById("legend-start");

// ─── Hints config ───
function getHints(character) {
  if (!character) return [];
  // Gender label
  var genderLabel = character.sex === "Homme" ? "masculin" : character.sex === "Femme" ? "féminin" : "neutre";
  return [
    "Ce personnage apparaît dans <strong>" + character.serie + "</strong>",
    "Sa race est : <strong>" + character.race + "</strong>",
    "Son affiliation : <strong>" + character.affiliation + "</strong>",
    "C'est un personnage <strong>" + genderLabel + "</strong>",
    "Son nom commence par « <strong>" + character.name.charAt(0).toUpperCase() + "</strong> »",
  ];
}

// ─── Autocomplete ───
function hideSuggestions() {
  if (!qSuggestions) return;
  qSuggestions.classList.add("hidden");
  qSuggestions.innerHTML = "";
}

if (qSearchInput) {
  qSearchInput.addEventListener("input", function() {
    const val = qSearchInput.value.trim().toLowerCase();
    if (val.length < 1) { hideSuggestions(); return; }

    const guessedSet = new Set(state.guessNames);
    const matches = CHARACTERS
      .filter(function(c) { return c.name.toLowerCase().indexOf(val) !== -1 && !guessedSet.has(c.name); })
      .slice(0, 7);

    if (matches.length === 0) { hideSuggestions(); return; }

    qSuggestions.innerHTML = "";
    matches.forEach(function(c) {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = c.name;
      div.addEventListener("click", function() {
        qSearchInput.value = c.name;
        hideSuggestions();
        submitQuoteGuess();
      });
      qSuggestions.appendChild(div);
    });
    qSuggestions.classList.remove("hidden");
  });

  qSearchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") submitQuoteGuess();
    if (e.key === "Escape") hideSuggestions();
  });
}

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-box")) hideSuggestions();
});

if (qGuessBtn) qGuessBtn.addEventListener("click", submitQuoteGuess);

// ─── Error handling ───
function showError(msg) {
  if (!qErrorMsg) return;
  qErrorMsg.textContent = msg;
  qErrorMsg.classList.remove("hidden");
  setTimeout(function() { qErrorMsg.classList.add("hidden"); }, 2500);
}

// ─── Render wrong guess chip ───
function addWrongChip(name) {
  if (!qWrongList) return;
  const chip = document.createElement("div");
  chip.className = "quote-wrong-chip";
  chip.textContent = name;
  qWrongList.appendChild(chip);
}

// ─── Render hint ───
function showHintItem(index) {
  if (!hintsContainer || !quoteCharacter) return;
  const hints = getHints(quoteCharacter);
  if (index >= hints.length) return;
  const item = document.createElement("div");
  item.className = "hint-item";
  item.innerHTML = "Indice " + (index + 1) + " : " + hints[index];
  hintsContainer.appendChild(item);
}

// ─── Portrait helper ───
function setCharacterPortrait(imgEl, character) {
  if (!imgEl || !character) return;
  const parent = imgEl.parentNode;
  if (!character.image) {
    imgEl.style.display = "none";
    return;
  }
  imgEl.style.display = "";
  imgEl.alt = character.name;
  imgEl.onerror = function() {
    imgEl.style.display = "none";
  };
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

// ─── Show win overlay ───
function showWin() {
  if (!qWinOverlay) return;
  if (qWinTries) qWinTries.textContent = state.tries;
  setCharacterPortrait(qWinCharImg, quoteCharacter);
  qWinOverlay.classList.remove("hidden");
  startTimerUpdate(qWinTimer, null);
}

// ─── Show lose overlay ───
function showLose() {
  if (!qLoseOverlay) return;
  if (qLoseCharName) qLoseCharName.textContent = dailyQuote.character;
  setCharacterPortrait(qLoseCharImg, quoteCharacter);
  qLoseOverlay.classList.remove("hidden");
  startTimerUpdate(null, qLoseTimer);
}

// ─── Disable input area ───
function disableInput() {
  if (qSearchInput) qSearchInput.disabled = true;
  if (qGuessBtn) qGuessBtn.disabled = true;
}

// ─── Submit guess ───
function submitQuoteGuess() {
  if (state.solved || state.failed) return;

  const name = qSearchInput ? qSearchInput.value.trim() : "";
  if (!name) return;

  const character = CHARACTERS.find(function(c) { return c.name.toLowerCase() === name.toLowerCase(); });
  if (!character) { showError("Personnage introuvable !"); return; }

  if (state.guessNames.indexOf(character.name) !== -1) {
    showError("Déjà essayé !");
    return;
  }

  if (qSearchInput) qSearchInput.value = "";
  hideSuggestions();

  state.tries += 1;
  state.guessNames.push(character.name);

  // Update counter display
  if (qCurrent) qCurrent.textContent = Math.min(state.tries + 1, MAX_TRIES);

  if (character.name === dailyQuote.character) {
    // Win
    state.solved = true;
    saveQuoteState();
    disableInput();
    setTimeout(showWin, 400);
    return;
  }

  // Wrong guess
  addWrongChip(character.name);

  // Show hint for this wrong guess (hint index = tries - 1, max 5 hints)
  if (state.tries <= 5) {
    showHintItem(state.tries - 1);
  }

  saveQuoteState();

  if (state.tries >= MAX_TRIES) {
    // Lose
    state.failed = true;
    saveQuoteState();
    disableInput();
    setTimeout(showLose, 400);
  }
}

// ─── Legend modal ───
const LEGEND_KEY = "dbdle_legend_sober";

function openLegend()  { if (qLegendModal) qLegendModal.classList.remove("hidden"); }
function closeLegend() {
  if (qLegendModal) qLegendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) {}
}

if (qLegendClose) qLegendClose.addEventListener("click", closeLegend);
if (qLegendStart) qLegendStart.addEventListener("click", closeLegend);
if (qHelpBtn)     qHelpBtn.addEventListener("click", openLegend);
if (qLegendModal) {
  qLegendModal.addEventListener("click", function(e) {
    if (e.target === qLegendModal) closeLegend();
  });
}
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && qLegendModal && !qLegendModal.classList.contains("hidden")) closeLegend();
});

// ─── Restore / Init ───
function restoreQuoteState(saved) {
  state = saved;

  // Restore wrong chips
  state.guessNames.forEach(function(name) {
    const ch = CHARACTERS.find(function(c) { return c.name === name; });
    if (ch && ch.name !== dailyQuote.character) {
      addWrongChip(ch.name);
    }
  });

  // Restore hints (one per wrong guess, up to 5)
  var wrongCount = state.guessNames.filter(function(n) { return n !== dailyQuote.character; }).length;
  for (var i = 0; i < Math.min(wrongCount, 5); i++) {
    showHintItem(i);
  }

  // Update counter
  if (qCurrent) qCurrent.textContent = Math.min(state.tries + 1, MAX_TRIES);

  if (state.solved) {
    disableInput();
    showWin();
    return;
  }
  if (state.failed) {
    disableInput();
    showLose();
    return;
  }
}

// ─── Main init ───
(function init() {
  // Show the quote
  if (quoteBubble) quoteBubble.textContent = dailyQuote.quote;

  const saved = loadQuoteState();
  if (saved) {
    restoreQuoteState(saved);
  }
})();
