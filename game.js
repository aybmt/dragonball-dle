// =============================================
//  DRAGON BALL DLE — Logique de jeu
// =============================================

const ATTRIBUTES = [
  { key: "sex",     label: "Sexe",    type: "exact" },
  { key: "hair",    label: "Cheveux", type: "exact" },
  { key: "origin",  label: "Origine", type: "exact" },    // planète seule → exact
  { key: "race",    label: "Race",    type: "exact" },
  { key: "episode", label: "Épisode", type: "numeric" },  // dégradé direction + intensité
  { key: "saga",    label: "Saga",    type: "saga" },     // dégradé sur SAGA_ORDER
  { key: "serie",   label: "Série",   type: "multi" },    // partial si au moins une commune
];

// ── Easter egg ──
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

// ── Personnage du jour ──
function getDailyCharacter() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return CHARACTERS[seed % CHARACTERS.length];
}

let target = getDailyCharacter();
let guesses = [];
let guessedNames = new Set();
let gameWon = false;
let hintShown = false;

// ── DOM refs ──
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
const playAgainBtn = document.getElementById("play-again-btn");
const easterScreen = document.getElementById("easter-screen");
const easterTargetName = document.getElementById("easter-target-name");
const easterPlayAgainBtn = document.getElementById("easter-play-again-btn");
const hintBox     = document.getElementById("hint-box");
const hintText    = document.getElementById("hint-text");

const legendModal = document.getElementById("legend-modal");
const legendClose = document.getElementById("legend-close");
const legendStart = document.getElementById("legend-start");
const helpBtn     = document.getElementById("help-btn");

poolSpan.textContent = CHARACTERS.length;

// ── Modale légende ──
const LEGEND_KEY = "dbdle_legend_seen_manga"; // nouvelle clé pour la nouvelle version

function openLegend() { legendModal.classList.remove("hidden"); }
function closeLegend() {
  legendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) { /* */ }
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

// ── Autocomplétion ──
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

// ── Soumission d'un essai ──
function submitGuess() {
  if (gameWon) return;
  const name = input.value.trim();
  if (!name) return;

  // 🥚 Easter egg
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
    setTimeout(showWin, 800);
    return;
  }

  if (guesses.length >= 8 && !hintShown) showHint();
}

function makePlaceholder() {
  const d = document.createElement("div");
  d.className = "cell-img-placeholder";
  return d;
}

// ── Rendu d'une ligne ──
function renderGuessRow(character) {
  const row = document.createElement("div");
  row.className = "guess-row";

  // Nom + image
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
    cell.style.animationDelay = `${i * 90}ms`;
    row.appendChild(cell);
  });

  guessesContainer.insertBefore(row, guessesContainer.firstChild);
  requestAnimationFrame(() => row.classList.add("revealed"));
}

// ── Construit une cellule selon le type ──
function buildCell(character, attr) {
  const cell = document.createElement("div");
  cell.className = "cell";

  const gVal = character[attr.key];
  const tVal = target[attr.key];

  if (attr.type === "numeric") {
    return buildNumericCell(cell, gVal, tVal);
  }
  if (attr.type === "saga") {
    return buildSagaCell(cell, gVal, tVal);
  }
  if (attr.type === "multi") {
    return buildMultiCell(cell, gVal, tVal);
  }

  // exact (sex, hair, origin, race)
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Calcule l'intensité du dégradé selon l'écart absolu et l'échelle max ──
function computeGradStop(absDiff, scale) {
  // scale = "episode" ou "saga"
  // Mappe absDiff → percent de gradient (10% loin → 85% proche)
  if (scale === "episode") {
    if (absDiff <= 3)        return 85;
    else if (absDiff <= 10)  return 70;
    else if (absDiff <= 25)  return 55;
    else if (absDiff <= 50)  return 40;
    else if (absDiff <= 100) return 25;
    else                     return 12;
  }
  // saga (échelle plus courte : 24 sagas)
  if (absDiff <= 1) return 85;
  if (absDiff <= 2) return 70;
  if (absDiff <= 4) return 55;
  if (absDiff <= 7) return 40;
  if (absDiff <= 12) return 25;
  return 12;
}

// ── Cellule numérique (épisode) ──
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

// ── Cellule saga (dégradé sur l'ordre chronologique) ──
function buildSagaCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }

  // Cherche l'index de chaque saga dans SAGA_ORDER
  const gIdx = SAGA_ORDER.indexOf(gVal);
  const tIdx = SAGA_ORDER.indexOf(tVal);

  // Si une saga n'est pas dans la liste → fallback wrong (ne devrait pas arriver)
  if (gIdx === -1 || tIdx === -1) {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }

  const diff = tIdx - gIdx;
  const stop = computeGradStop(Math.abs(diff), "saga");
  cell.style.setProperty("--grad-stop", stop + "%");

  if (diff > 0) {
    // vrai saga PLUS TARD dans la chrono
    cell.classList.add("gradient-up");
    cell.innerHTML = `<span class="cell-arrow">▲</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("gradient-down");
    cell.innerHTML = `<span class="cell-arrow">▼</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Cellule multi-valeurs (série) ──
function buildMultiCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
    return cell;
  }
  const gParts = gVal.split("/").map(s => s.trim());
  const tParts = tVal.split("/").map(s => s.trim());
  if (gParts.some(s => tParts.includes(s))) {
    cell.classList.add("partial");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Indice après 8 essais ──
function showHint() {
  hintShown = true;
  const firstLetter = target.name.charAt(0).toUpperCase();
  hintText.textContent = `Le nom commence par « ${firstLetter} »`;
  hintBox.classList.remove("hidden");
}

// ── Erreur ──
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
  setTimeout(clearError, 3000);
}
function clearError() { errorMsg.classList.add("hidden"); }

// ── Victoire ──
function showWin() {
  winName.textContent = target.name;
  winTries.textContent = guesses.length;
  winScreen.classList.remove("hidden");
  launchParticles(["★", "ドン", "バン", "カッ", "✦", "ZZZ"]);
}

function showEasterWin() {
  easterTargetName.textContent = target.name;
  easterScreen.classList.remove("hidden");
  launchParticles(["★", "✦", "ゴゴ", "ドン", "クッ", "♛"]);
}

function launchParticles(symbols) {
  for (let i = 0; i < 35; i++) {
    setTimeout(() => spawnParticle(symbols), i * 55);
  }
}

function spawnParticle(symbols) {
  const p = document.createElement("div");
  p.className = "particle";
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDuration = (1 + Math.random() * 1.2) + "s";
  p.style.fontSize = (18 + Math.random() * 26) + "px";
  p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 2800);
}

// ── Rejouer ──
function resetGame() {
  const remaining = CHARACTERS.filter(c => c.name !== target.name);
  target = remaining[Math.floor(Math.random() * remaining.length)];
  guesses = [];
  guessedNames = new Set();
  gameWon = false;
  hintShown = false;
  triesSpan.textContent = "0";
  guessesContainer.innerHTML = "";
  columnsHeader.classList.add("hidden");
  hintBox.classList.add("hidden");
  winScreen.classList.add("hidden");
  easterScreen.classList.add("hidden");
  input.focus();
}

playAgainBtn.addEventListener("click", resetGame);
easterPlayAgainBtn.addEventListener("click", resetGame);
