// =============================================
//  DRAGON BALL DLE — Base de données personnages
//
//  👉 COMMENT AJOUTER UNE IMAGE :
//     1. Télécharge l'image du personnage
//     2. Renomme-la exactement comme indiqué dans image:
//     3. Place-la dans le dossier images/
// =============================================

const CHARACTERS = [

  // ════════════════════════════════════════
  //  SAIYANS
  // ════════════════════════════════════════

  {
    name: "Goku",
    sex: "Homme", race: "Saiyan", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: true,
    image: "images/goku.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Vegeta",
    sex: "Homme", race: "Saiyan", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/vegeta.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Gohan",
    sex: "Homme", race: "Demi-Saiyan", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/gohan.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Goten",
    sex: "Homme", race: "Demi-Saiyan", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/goten.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Trunks (futur)",
    sex: "Homme", race: "Demi-Saiyan", affiliation: "Z-Fighters",
    hair: "Violet", status: "Vivant", saga: "DBZ / Super", transformation: true,
    image: "images/trunks_futur.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Trunks (enfant)",
    sex: "Homme", race: "Demi-Saiyan", affiliation: "Z-Fighters",
    hair: "Violet", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/trunks_enfant.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Pan",
    sex: "Femme", race: "Quart Saiyan", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/pan.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Broly (Légendaire)",
    sex: "Homme", race: "Saiyan", affiliation: "Neutre",
    hair: "Noir", status: "Vivant", saga: "DBZ", transformation: true,
    image: "images/broly_legendaire.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Broly (DBS)",
    sex: "Homme", race: "Saiyan", affiliation: "Neutre",
    hair: "Noir", status: "Vivant", saga: "Super", transformation: true,
    image: "images/broly_dbs.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Raditz",
    sex: "Homme", race: "Saiyan", affiliation: "Ennemi",
    hair: "Noir", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/raditz.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Nappa",
    sex: "Homme", race: "Saiyan", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/nappa.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Bardock",
    sex: "Homme", race: "Saiyan", affiliation: "Neutre",
    hair: "Noir", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/bardock.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Turles",
    sex: "Homme", race: "Saiyan", affiliation: "Ennemi",
    hair: "Noir", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/turles.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  HUMAINS / Z-FIGHTERS
  // ════════════════════════════════════════

  {
    name: "Krillin",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: false,
    image: "images/krillin.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Yamcha",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DB / DBZ / Super", transformation: false,
    image: "images/yamcha.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Tenshinhan",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DB / DBZ / Super", transformation: false,
    image: "images/tenshinhan.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Chaozu",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DB / DBZ / Super", transformation: false,
    image: "images/chaozu.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Maître Roshi",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Blanc", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: true,
    image: "images/maitre_roshi.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Bulma",
    sex: "Femme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Bleu", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: false,
    image: "images/bulma.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Chi-Chi",
    sex: "Femme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: false,
    image: "images/chi_chi.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Videl",
    sex: "Femme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/videl.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Mr. Satan",
    sex: "Homme", race: "Humain", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/mr_satan.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Launch",
    sex: "Femme", race: "Humain", affiliation: "Neutre",
    hair: "Blond", status: "Vivant", saga: "DB / DBZ", transformation: false,
    image: "images/launch.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  NAMEKIENS
  // ════════════════════════════════════════

  {
    name: "Piccolo",
    sex: "Homme", race: "Namekien", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: true,
    image: "images/piccolo.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Nail",
    sex: "Homme", race: "Namekien", affiliation: "Namek",
    hair: "Chauve", status: "Vivant", saga: "DBZ", transformation: false,
    image: "images/nail.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Dende",
    sex: "Homme", race: "Namekien", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/dende.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Grand Guru",
    sex: "Homme", race: "Namekien", affiliation: "Namek",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/grand_guru.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  FREEZER & FAMILLE
  // ════════════════════════════════════════

  {
    name: "Freezer",
    sex: "Homme", race: "Race de Freezer", affiliation: "Ennemi",
    hair: "Chauve", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/freezer.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Cooler",
    sex: "Homme", race: "Race de Freezer", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/cooler.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "King Cold",
    sex: "Homme", race: "Race de Freezer", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/king_cold.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  ANDROÏDES / CYBORGS
  // ════════════════════════════════════════

  {
    name: "Androïde 17",
    sex: "Homme", race: "Androïde", affiliation: "Z-Fighters",
    hair: "Noir", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/androide_17.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Androïde 18",
    sex: "Femme", race: "Androïde", affiliation: "Z-Fighters",
    hair: "Blond", status: "Vivant", saga: "DBZ / GT / Super", transformation: false,
    image: "images/androide_18.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Androïde 16",
    sex: "Homme", race: "Androïde", affiliation: "Neutre",
    hair: "Rouge", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/androide_16.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Androïde 20 (Dr Gero)",
    sex: "Homme", race: "Androïde", affiliation: "Ennemi",
    hair: "Blanc", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/androide_20_dr_gero.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Cell",
    sex: "Homme", race: "Bio-Androïde", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/cell.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  MAJIN / MAGIE
  // ════════════════════════════════════════

  {
    name: "Buu (Innocent)",
    sex: "Homme", race: "Majin", affiliation: "Z-Fighters",
    hair: "Chauve", status: "Vivant", saga: "DBZ / GT / Super", transformation: true,
    image: "images/buu_innocent.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Buu (Super)",
    sex: "Homme", race: "Majin", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/buu_super.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Babidi",
    sex: "Homme", race: "Extraterrestre", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: false,
    image: "images/babidi.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  DIEUX / DIVINS
  // ════════════════════════════════════════

  {
    name: "Beerus",
    sex: "Homme", race: "Dieu Destruction", affiliation: "Divin",
    hair: "Chauve", status: "Vivant", saga: "Super", transformation: false,
    image: "images/beerus.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Whis",
    sex: "Homme", race: "Ange", affiliation: "Divin",
    hair: "Blanc", status: "Vivant", saga: "Super", transformation: false,
    image: "images/whis.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Zamasu",
    sex: "Homme", race: "Kaïô-shin", affiliation: "Ennemi",
    hair: "Blanc", status: "Mort", saga: "Super", transformation: true,
    image: "images/zamasu.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Goku Black",
    sex: "Homme", race: "Kaïô-shin / Saiyan", affiliation: "Ennemi",
    hair: "Blanc", status: "Mort", saga: "Super", transformation: true,
    image: "images/goku_black.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Zeno",
    sex: "Neutre", race: "Omni-Roi", affiliation: "Divin",
    hair: "Chauve", status: "Vivant", saga: "Super", transformation: false,
    image: "images/zeno.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Grand Prêtre",
    sex: "Homme", race: "Ange", affiliation: "Divin",
    hair: "Blanc", status: "Vivant", saga: "Super", transformation: false,
    image: "images/grand_pretre.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Kaïô",
    sex: "Homme", race: "Kaïô", affiliation: "Divin",
    hair: "Chauve", status: "Mort", saga: "DB / DBZ / GT / Super", transformation: false,
    image: "images/kaio.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Grand Kaïô-shin",
    sex: "Homme", race: "Kaïô-shin", affiliation: "Divin",
    hair: "Blanc", status: "Vivant", saga: "DBZ / Super", transformation: false,
    image: "images/grand_kaio_shin.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  TOURNOI DE LA PUISSANCE
  // ════════════════════════════════════════

  {
    name: "Jiren",
    sex: "Homme", race: "Humanoïde", affiliation: "Pride Troopers",
    hair: "Chauve", status: "Vivant", saga: "Super", transformation: false,
    image: "images/jiren.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Hit",
    sex: "Homme", race: "Extraterrestre", affiliation: "Univers 6",
    hair: "Chauve", status: "Vivant", saga: "Super", transformation: false,
    image: "images/hit.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Caulifla",
    sex: "Femme", race: "Saiyan", affiliation: "Univers 6",
    hair: "Noir", status: "Vivant", saga: "Super", transformation: true,
    image: "images/caulifla.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Kale",
    sex: "Femme", race: "Saiyan", affiliation: "Univers 6",
    hair: "Vert", status: "Vivant", saga: "Super", transformation: true,
    image: "images/kale.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Cabba",
    sex: "Homme", race: "Saiyan", affiliation: "Univers 6",
    hair: "Noir", status: "Vivant", saga: "Super", transformation: true,
    image: "images/cabba.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Toppo",
    sex: "Homme", race: "Humanoïde", affiliation: "Pride Troopers",
    hair: "Chauve", status: "Vivant", saga: "Super", transformation: true,
    image: "images/toppo.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  DB CLASSIQUE
  // ════════════════════════════════════════

  {
    name: "Pilaf",
    sex: "Homme", race: "Extraterrestre", affiliation: "Ennemi",
    hair: "Chauve", status: "Vivant", saga: "DB / Super", transformation: false,
    image: "images/pilaf.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Tao Pai Pai",
    sex: "Homme", race: "Humain", affiliation: "Ennemi",
    hair: "Blanc", status: "Vivant", saga: "DB / DBZ", transformation: false,
    image: "images/tao_pai_pai.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Demon King Piccolo",
    sex: "Homme", race: "Namekien", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DB", transformation: true,
    image: "images/demon_king_piccolo.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  DRAGON BALL GT
  // ════════════════════════════════════════

  {
    name: "Baby",
    sex: "Homme", race: "Tuffle", affiliation: "Ennemi",
    hair: "Blanc", status: "Mort", saga: "GT", transformation: true,
    image: "images/baby.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Super 17",
    sex: "Homme", race: "Androïde", affiliation: "Ennemi",
    hair: "Noir", status: "Mort", saga: "GT", transformation: false,
    image: "images/super_17.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Omega Shenron",
    sex: "Homme", race: "Dragon Noir", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "GT", transformation: true,
    image: "images/omega_shenron.jpg"  // 👈 fichier à déposer dans images/
  },

  // ════════════════════════════════════════
  //  DIVERS
  // ════════════════════════════════════════

  {
    name: "Shenron",
    sex: "Neutre", race: "Dragon", affiliation: "Neutre",
    hair: "Aucun", status: "Vivant", saga: "DB / DBZ / GT / Super", transformation: false,
    image: "images/shenron.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Oolong",
    sex: "Homme", race: "Anthropomorphe", affiliation: "Z-Fighters",
    hair: "Aucun", status: "Vivant", saga: "DB / DBZ / Super", transformation: true,
    image: "images/oolong.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Garlic Jr.",
    sex: "Homme", race: "Extraterrestre", affiliation: "Ennemi",
    hair: "Chauve", status: "Vivant", saga: "DBZ", transformation: true,
    image: "images/garlic_jr.jpg"  // 👈 fichier à déposer dans images/
  },

  {
    name: "Janemba",
    sex: "Homme", race: "Démon", affiliation: "Ennemi",
    hair: "Chauve", status: "Mort", saga: "DBZ", transformation: true,
    image: "images/janemba.jpg"  // 👈 fichier à déposer dans images/
  },

];