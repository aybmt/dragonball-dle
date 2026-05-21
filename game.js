// =============================================
//  DRAGON BALL DLE — Logique de jeu
// =============================================

const ATTRIBUTES = [
  { key: "sex",            label: "Sexe" },
  { key: "race",           label: "Race" },
  { key: "affiliation",    label: "Affiliation" },
  { key: "hair",           label: "Cheveux" },
  { key: "status",         label: "Statut" },
  { key: "saga",           label: "Saga" },
  { key: "transformation", label: "Transformation" },
];

// ────────────────────────────────────────────
//  EASTER EGG : Lucas Latraube
// ────────────────────────────────────────────
const EASTER_EGG_NAME = "Lucas Latraube";

// Normalise une chaîne pour comparaison robuste
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/\s+/g, " ")                              // espaces multiples → simple
    .trim();
}

function isEasterEgg(name) {
  return normalize(name) === normalize(EASTER_EGG_NAME);
}

// Personnage du jour (basé sur la date pour que tout le monde ait le même)
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

// Legend modal
const legendModal = document.getElementById("legend-modal");
const legendClose = document.getElementById("legend-close");
const legendStart = document.getElementById("legend-start");
const helpBtn     = document.getElementById("help-btn");

// Affiche le nombre total de personnages
poolSpan.textContent = CHARACTERS.length;

// ────────────────────────────────────────────
//  MODALE LÉGENDE — première visite
// ────────────────────────────────────────────
const LEGEND_KEY = "dbdle_legend_seen";

function openLegend() {
  legendModal.classList.remove("hidden");
}
function closeLegend() {
  legendModal.classList.add("hidden");
  try { localStorage.setItem(LEGEND_KEY, "1"); } catch (e) { /* ignore */ }
}

// Affichage automatique si jamais vue
try {
  if (!localStorage.getItem(LEGEND_KEY)) openLegend();
} catch (e) {
  // localStorage indisponible (mode privé strict) — on ouvre quand même
  openLegend();
}

legendClose.addEventListener("click", closeLegend);
legendStart.addEventListener("click", closeLegend);
helpBtn.addEventListener("click", openLegend);

// Fermer en cliquant sur le fond
legendModal.addEventListener("click", (e) => {
  if (e.target === legendModal) closeLegend();
});

// Esc pour fermer
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !legendModal.classList.contains("hidden")) {
    closeLegend();
  }
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

  // 🥚 EASTER EGG : si le joueur tape Lucas Latraube → victoire instantanée
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

  // Indice après 8 essais
  if (guesses.length >= 8 && !hintShown) {
    showHint();
  }
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
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.animationDelay = `${i * 100}ms`;

    const result = compareAttr(character, target, attr.key);
    cell.classList.add(result === "correct" ? "correct" : result === "partial" ? "partial" : "wrong");

    let display;
    if (attr.key === "transformation") {
      display = character[attr.key] ? "Oui" : "Non";
    } else {
      display = character[attr.key];
    }

    const icon = result === "correct" ? "✅" : result === "partial" ? "🟡" : "❌";
    cell.innerHTML = `<span class="cell-icon">${icon}</span><span class="cell-val">${display}</span>`;
    row.appendChild(cell);
  });

  guessesContainer.insertBefore(row, guessesContainer.firstChild);

  // Animation d'entrée
  requestAnimationFrame(() => row.classList.add("revealed"));
}

// ── Comparaison d'attributs ──
function compareAttr(guess, target, key) {
  const gVal = guess[key];
  const tVal = target[key];

  if (key === "transformation") {
    return gVal === tVal ? "correct" : "wrong";
  }

  if (key === "saga") {
    // Partiel si au moins une saga en commun
    const gSagas = gVal.split("/").map(s => s.trim());
    const tSagas = tVal.split("/").map(s => s.trim());
    if (gVal === tVal) return "correct";
    if (gSagas.some(s => tSagas.includes(s))) return "partial";
    return "wrong";
  }

  if (gVal === tVal) return "correct";
  return "wrong";
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
function clearError() {
  errorMsg.classList.add("hidden");
}

// ── Victoire ──
function showWin() {
  winName.textContent = target.name;
  winTries.textContent = guesses.length;
  winScreen.classList.remove("hidden");
  launchKamehameha();
}

// ── Victoire EASTER EGG ──
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
  // En mode "rejouer" on prend un perso aléatoire (différent du précédent)
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
