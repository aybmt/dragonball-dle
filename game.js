// =============================================
//  DRAGON BALL DLE — Logique de jeu
// =============================================

const ATTRIBUTES = [
  { key: "sex",     label: "Sexe",    type: "exact" },
  { key: "hair",    label: "Cheveux", type: "exact" },
  { key: "origin",  label: "Origine", type: "origin" },   // partial si même planète OU même univers
  { key: "race",    label: "Race",    type: "exact" },
  { key: "episode", label: "Épisode", type: "numeric" },  // dégradé direction + intensité
  { key: "saga",    label: "Saga",    type: "exact" },
  { key: "serie",   label: "Série",   type: "multi" },    // partial si au moins une série commune
];

// ────────────────────────────────────────────
//  EASTER EGG : Lucas Latraube
// ────────────────────────────────────────────
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
  const index = seed % CHARACTERS.length;
  return CHARACTERS[index];
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
const easterPlayAgainBtn = document.getElementById("easter-play-again-btn");
const hintBox     = document.getElementById("hint-box");
const hintText    = document.getElementById("hint-text");

const legendModal = document.getElementById("legend-modal");
const legendClose = document.getElementById("legend-close");
const legendStart = document.getElementById("legend-start");
const helpBtn     = document.getElementById("help-btn");

poolSpan.textContent = CHARACTERS.length;

// ── Modale légende ──
const LEGEND_KEY = "dbdle_legend_seen_v2"; // v2 = nouvelle légende avec dégradé

function openLegend() { legendModal.classList.remove("hidden"); }
function closeLegend() {
  legendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) { /* ignore */ }
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

  // 🥚 EASTER EGG
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
    showError("Personnage introuvable ! Vérifie l'orthographe.");
    return;
  }
  if (guessedNames.has(character.name)) {
    showError("Tu as déjà essayé ce personnage !");
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
  d.textContent = "🐉";
  return d;
}

// ── Rendu d'une ligne d'essai ──
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

  // Attributs comparés
  ATTRIBUTES.forEach((attr, i) => {
    const cell = buildCell(character, attr);
    cell.style.animationDelay = `${i * 100}ms`;
    row.appendChild(cell);
  });

  guessesContainer.insertBefore(row, guessesContainer.firstChild);
  requestAnimationFrame(() => row.classList.add("revealed"));
}

// ── Construit une cellule selon le type d'attribut ──
function buildCell(character, attr) {
  const cell = document.createElement("div");
  cell.className = "cell";

  const gVal = character[attr.key];
  const tVal = target[attr.key];

  if (attr.type === "numeric") {
    // Épisode : dégradé direction + intensité
    return buildNumericCell(cell, gVal, tVal);
  }

  if (attr.type === "multi") {
    // Série : multi-valeurs
    return buildMultiCell(cell, gVal, tVal);
  }

  if (attr.type === "origin") {
    // Origine : "Planète, Univers X"
    return buildOriginCell(cell, gVal, tVal);
  }

  // Exact (sex, hair, race, saga)
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-icon">✅</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-icon">❌</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Cellule numérique (épisode) avec dégradé direction + intensité ──
function buildNumericCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-icon">✅</span><span class="cell-val">${gVal}</span>`;
    return cell;
  }

  const diff = tVal - gVal; // >0 → vrai est plus haut, <0 → plus bas
  const absDiff = Math.abs(diff);

  // Intensité : plus l'écart est petit, plus le vert prend de place
  // grad-stop : 10% (très loin) à 80% (très proche)
  // Échelle basée sur la plage typique d'épisodes (0-300+)
  let gradStop;
  if (absDiff <= 5)        gradStop = 80;
  else if (absDiff <= 15)  gradStop = 65;
  else if (absDiff <= 30)  gradStop = 50;
  else if (absDiff <= 60)  gradStop = 35;
  else if (absDiff <= 120) gradStop = 20;
  else                     gradStop = 10;

  cell.style.setProperty("--grad-stop", gradStop + "%");

  if (diff > 0) {
    // Vrai est PLUS HAUT
    cell.classList.add("gradient-up");
    cell.innerHTML = `<span class="cell-arrow">↑</span><span class="cell-val">${gVal}</span>`;
  } else {
    // Vrai est PLUS BAS
    cell.classList.add("gradient-down");
    cell.innerHTML = `<span class="cell-arrow">↓</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Cellule multi-valeurs (série) ──
function buildMultiCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-icon">✅</span><span class="cell-val">${gVal}</span>`;
    return cell;
  }
  const gParts = gVal.split("/").map(s => s.trim());
  const tParts = tVal.split("/").map(s => s.trim());
  if (gParts.some(s => tParts.includes(s))) {
    cell.classList.add("partial");
    cell.innerHTML = `<span class="cell-icon">🟡</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-icon">❌</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Cellule origine ("Planète, Univers X") ──
function buildOriginCell(cell, gVal, tVal) {
  if (gVal === tVal) {
    cell.classList.add("correct");
    cell.innerHTML = `<span class="cell-icon">✅</span><span class="cell-val">${gVal}</span>`;
    return cell;
  }

  // Découpe en planète + univers
  const gParts = gVal.split(",").map(s => s.trim());
  const tParts = tVal.split(",").map(s => s.trim());

  const samePlanet = gParts[0] && tParts[0] && gParts[0].toLowerCase() === tParts[0].toLowerCase();
  const sameUniverse = gParts[1] && tParts[1] && gParts[1].toLowerCase() === tParts[1].toLowerCase();

  if (samePlanet || sameUniverse) {
    cell.classList.add("partial");
    cell.innerHTML = `<span class="cell-icon">🟡</span><span class="cell-val">${gVal}</span>`;
  } else {
    cell.classList.add("wrong");
    cell.innerHTML = `<span class="cell-icon">❌</span><span class="cell-val">${gVal}</span>`;
  }
  return cell;
}

// ── Indice après 8 essais ──
function showHint() {
  hintShown = true;
  const firstLetter = target.name.charAt(0).toUpperCase();
  hintText.textContent = `Le nom du personnage commence par la lettre « ${firstLetter} »`;
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
  launchKamehameha();
}

function showEasterWin() {
  easterScreen.classList.remove("hidden");
  launchEasterParticles();
}

function launchKamehameha() {
  for (let i = 0; i < 30; i++) {
    setTimeout(() => spawnParticle(["⭐", "✨", "🌟", "💥", "🔥", "⚡"]), i * 60);
  }
}

function launchEasterParticles() {
  for (let i = 0; i < 50; i++) {
    setTimeout(() => spawnParticle(["👑", "💜", "✨", "🌟", "⭐", "🔮"]), i * 50);
  }
}

function spawnParticle(emojis) {
  const p = document.createElement("div");
  p.className = "particle";
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDuration = (0.8 + Math.random() * 1.2) + "s";
  p.style.fontSize = (16 + Math.random() * 24) + "px";
  p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 2500);
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
