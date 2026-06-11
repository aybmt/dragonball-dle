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

// Insensible à la casse ET aux accents (« androide » trouve « Androïde »)
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
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Normalisation défensive (anciens états / données corrompues)
    return {
      solved: !!parsed.solved,
      failed: !!parsed.failed,
      tries: typeof parsed.tries === "number" ? parsed.tries : (Array.isArray(parsed.guessNames) ? parsed.guessNames.length : 0),
      guessNames: Array.isArray(parsed.guessNames) ? parsed.guessNames.slice() : []
    };
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
const qProgress        = document.getElementById("quote-progress");
const qSearchInput     = document.getElementById("q-search-input");
const qSuggestions     = document.getElementById("q-suggestions");
const qGuessBtn        = document.getElementById("q-guess-btn");
const qErrorMsg        = document.getElementById("q-error-msg");
const qWrongList       = document.getElementById("quote-wrong-list");
const hintsContainer   = document.getElementById("hints-container");
const qSpeakerAvatar   = document.getElementById("q-speaker-avatar");
const qSpeakerLabel    = document.getElementById("q-speaker-label");
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

// ─── Hints config (icône + texte, du moins révélateur au plus révélateur) ───
function getHints(character) {
  if (!character) return [];
  return [
    { icon: "📺", label: "Série",       value: character.serie },
    { icon: "🧬", label: "Race",        value: character.race },
    { icon: "🛡️", label: "Affiliation", value: character.affiliation },
    { icon: "⚧",  label: "Genre",       value: character.sex },
    { icon: "🔠", label: "Initiale",    value: "« " + character.name.charAt(0).toUpperCase() + " »" }
  ];
}

// ─── Autocomplete ───
let activeSuggestion = -1; // index surligné au clavier

function hideSuggestions() {
  if (!qSuggestions) return;
  qSuggestions.classList.add("hidden");
  qSuggestions.innerHTML = "";
  activeSuggestion = -1;
}

function getSuggestionEls() {
  return qSuggestions ? Array.prototype.slice.call(qSuggestions.querySelectorAll(".suggestion-item")) : [];
}

function highlightSuggestion(idx) {
  const els = getSuggestionEls();
  if (!els.length) return;
  activeSuggestion = (idx + els.length) % els.length;
  els.forEach(function(el, i) {
    el.classList.toggle("active", i === activeSuggestion);
  });
  els[activeSuggestion].scrollIntoView({ block: "nearest" });
}

function renderSuggestions() {
  const val = normalize(qSearchInput.value);
  if (val.length < 1) { hideSuggestions(); return; }

  const guessedSet = new Set(state.guessNames.map(normalize));
  const matches = CHARACTERS
    .filter(function(c) { return normalize(c.name).indexOf(val) !== -1 && !guessedSet.has(normalize(c.name)); })
    .slice(0, 7);

  if (matches.length === 0) { hideSuggestions(); return; }

  qSuggestions.innerHTML = "";
  activeSuggestion = -1;
  matches.forEach(function(c) {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    const img = c.image ? '<img class="suggestion-thumb" src="' + c.image + '" alt="" onerror="this.style.display=\'none\'" />' : '';
    div.innerHTML = img + '<span>' + c.name + '</span>';
    div.addEventListener("mousedown", function(e) {
      e.preventDefault();
      qSearchInput.value = c.name;
      hideSuggestions();
      submitQuoteGuess();
    });
    qSuggestions.appendChild(div);
  });
  qSuggestions.classList.remove("hidden");
}

if (qSearchInput) {
  qSearchInput.addEventListener("input", renderSuggestions);

  qSearchInput.addEventListener("keydown", function(e) {
    const els = getSuggestionEls();
    const open = qSuggestions && !qSuggestions.classList.contains("hidden") && els.length > 0;

    if (e.key === "ArrowDown") {
      if (open) { e.preventDefault(); highlightSuggestion(activeSuggestion + 1); }
      return;
    }
    if (e.key === "ArrowUp") {
      if (open) { e.preventDefault(); highlightSuggestion(activeSuggestion - 1); }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeSuggestion >= 0) {
        qSearchInput.value = els[activeSuggestion].querySelector("span").textContent;
        hideSuggestions();
      }
      submitQuoteGuess();
      return;
    }
    if (e.key === "Escape") hideSuggestions();
  });
}

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-box")) hideSuggestions();
});

if (qGuessBtn) qGuessBtn.addEventListener("click", submitQuoteGuess);

// ─── Error handling ───
let errorTimeout = null;
function showError(msg) {
  if (!qErrorMsg) return;
  qErrorMsg.textContent = msg;
  qErrorMsg.classList.remove("hidden");
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(function() { qErrorMsg.classList.add("hidden"); }, 2500);
}

// ─── Progress dots ───
function renderProgress() {
  if (!qProgress) return;
  const wrongCount = state.solved ? state.tries - 1 : state.tries;
  qProgress.innerHTML = "";
  for (var i = 0; i < MAX_TRIES; i++) {
    const dot = document.createElement("span");
    dot.className = "q-dot";
    if (i < wrongCount) {
      dot.classList.add("miss");
    } else if (state.solved && i === state.tries - 1) {
      dot.classList.add("hit");
    } else if (!state.solved && !state.failed && i === state.tries) {
      dot.classList.add("current");
    }
    qProgress.appendChild(dot);
  }
  if (qCurrent) qCurrent.textContent = Math.min(state.tries + 1, MAX_TRIES);
}

// ─── Render wrong guess chip ───
function addWrongChip(name) {
  if (!qWrongList) return;
  const chip = document.createElement("div");
  chip.className = "quote-wrong-chip";
  chip.innerHTML = '<span class="chip-x">✗</span> ' + name;
  qWrongList.appendChild(chip);
}

// ─── Render hint ───
function showHintItem(index) {
  if (!hintsContainer || !quoteCharacter) return;
  const hints = getHints(quoteCharacter);
  if (index < 0 || index >= hints.length) return;
  const h = hints[index];
  const item = document.createElement("div");
  item.className = "hint-item";
  item.innerHTML =
    '<span class="hint-icon">' + h.icon + '</span>' +
    '<span class="hint-text"><span class="hint-label">' + h.label + '</span>' +
    '<strong>' + h.value + '</strong></span>';
  hintsContainer.appendChild(item);
}

// ─── Portrait helper (avec fallback initiale si image manquante) ───
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

// ─── Révélation inline du « personnage mystère » ───
function revealSpeaker(character, won) {
  if (!qSpeakerAvatar) return;
  qSpeakerAvatar.classList.add("revealed");
  qSpeakerAvatar.classList.toggle("lost", !won);
  qSpeakerAvatar.innerHTML = "";

  function fallback() {
    qSpeakerAvatar.innerHTML = "";
    const fb = document.createElement("span");
    fb.className = "q-speaker-fallback";
    fb.textContent = ((character && character.name) || "?").charAt(0).toUpperCase();
    qSpeakerAvatar.appendChild(fb);
  }

  if (character && character.image) {
    const img = document.createElement("img");
    img.className = "q-speaker-img";
    img.alt = character.name;
    img.onerror = fallback;
    img.src = character.image;
    qSpeakerAvatar.appendChild(img);
  } else {
    fallback();
  }
  if (qSpeakerLabel) qSpeakerLabel.textContent = (character && character.name) || dailyQuote.character;
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
  setPortrait(qWinCharImg, quoteCharacter);
  qWinOverlay.classList.remove("hidden");
  startTimerUpdate(qWinTimer, null);
}

// ─── Show lose overlay ───
function showLose() {
  if (!qLoseOverlay) return;
  if (qLoseCharName) qLoseCharName.textContent = dailyQuote.character;
  setPortrait(qLoseCharImg, quoteCharacter);
  qLoseOverlay.classList.remove("hidden");
  startTimerUpdate(null, qLoseTimer);
}

// ─── Disable input area ───
function disableInput() {
  if (qSearchInput) { qSearchInput.disabled = true; qSearchInput.placeholder = "Partie terminée"; }
  if (qGuessBtn) qGuessBtn.disabled = true;
  hideSuggestions();
}

// ─── Submit guess ───
function submitQuoteGuess() {
  if (state.solved || state.failed) return;

  const raw = qSearchInput ? qSearchInput.value.trim() : "";
  if (!raw) { showError("Entre un nom de personnage."); return; }

  const character = findCharacterByName(raw);
  if (!character) { showError("Personnage introuvable !"); return; }

  if (state.guessNames.indexOf(character.name) !== -1) {
    showError("Déjà essayé !");
    return;
  }

  if (qSearchInput) qSearchInput.value = "";
  hideSuggestions();

  state.tries += 1;
  state.guessNames.push(character.name);

  if (character.name === dailyQuote.character) {
    // Win
    state.solved = true;
    saveQuoteState();
    renderProgress();
    disableInput();
    revealSpeaker(quoteCharacter, true);
    setTimeout(showWin, 650);
    return;
  }

  // Wrong guess
  addWrongChip(character.name);

  // Show hint for this wrong guess (hint index = tries - 1, max 5 hints)
  if (state.tries <= 5) {
    showHintItem(state.tries - 1);
  }

  saveQuoteState();
  renderProgress();

  if (state.tries >= MAX_TRIES) {
    // Lose
    state.failed = true;
    saveQuoteState();
    disableInput();
    revealSpeaker(quoteCharacter, false);
    setTimeout(showLose, 650);
  }
}

// ─── Legend modal ───
const LEGEND_KEY = "dbdle_legend_quotes";

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
    if (name !== dailyQuote.character) addWrongChip(name);
  });

  // Restore hints (one per wrong guess, up to 5)
  var wrongCount = state.guessNames.filter(function(n) { return n !== dailyQuote.character; }).length;
  for (var i = 0; i < Math.min(wrongCount, 5); i++) {
    showHintItem(i);
  }

  renderProgress();

  if (state.solved) {
    disableInput();
    revealSpeaker(quoteCharacter, true);
    showWin();
    return;
  }
  if (state.failed) {
    disableInput();
    revealSpeaker(quoteCharacter, false);
    showLose();
    return;
  }
}

// ─── Main init ───
(function init() {
  // Show the quote
  if (quoteBubble) quoteBubble.textContent = dailyQuote.quote;

  const saved = loadQuoteState();
  if (saved && (saved.solved || saved.failed || saved.guessNames.length > 0)) {
    restoreQuoteState(saved);
  } else {
    renderProgress();
    // Affiche l'aide au tout premier passage
    try { if (!localStorage.getItem(LEGEND_KEY)) openLegend(); } catch (e) {}
  }

  if (qSearchInput && !qSearchInput.disabled) {
    setTimeout(function() { try { qSearchInput.focus(); } catch (e) {} }, 100);
  }
})();
