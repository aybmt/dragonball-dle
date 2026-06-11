// =============================================
//  DRAGON BALL DLE — Base de données personnages
//
//  CHAMPS :
//  - name        : nom du personnage
//  - sex         : Masculin / Féminin / Neutre
//  - hair        : couleur de cheveux
//  - origin      : planète natale uniquement (Terre, Vegeta, Namek, Sadala...)
//  - race        : race / espèce
//  - episode     : NUMBER — épisode de 1ère apparition tous animes/specials confondus
//  - saga        : saga (clé exacte parmi celles définies dans SAGA_ORDER ci-dessous)
//                  les sagas sont chronologiques et comparées par DÉGRADÉ
//  - serie       : "DB" / "DBZ" / "DBGT" / "DBS" — séries séparées par " / " si plusieurs
//  - affiliation : groupe / faction principale du perso
//  - image       : chemin de l'image
// =============================================

// Ordre chronologique des sagas (utilisé pour le dégradé)
// Plus l'écart est petit dans cette liste, plus la cellule sera "verte"
const SAGA_ORDER = [
  "Saga Pilaf",
  "Saga Tournoi",
  "Saga Red Ribbon",
  "Saga 22e Tenkaichi",
  "Saga Piccolo Daimaô",
  "Saga 23e Tenkaichi",
  "Saga des Saiyans",
  "Saga Namek",
  "Saga Freezer",
  "Saga Garlic Jr",
  "TV Special Bardock",
  "Films DBZ",
  "Saga Trunks",
  "Saga des Cyborgs",
  "Saga Cell",
  "Saga Boo",
  "Saga Batailles des Dieux",
  "Saga Univers 6",
  "Saga Trunks du Futur",
  "Tournoi du Pouvoir",
  "Saga Broly",
  "Saga Baby",
  "Saga Super 17",
  "Saga Dragons Maléfiques",
];

const CHARACTERS = [

  // ════════════ SAIYANS ════════════
  { name: "Goku",            sex: "Masculin", hair: "Noir",   origin: "Vegeta",  race: "Saiyan",          episode: 1,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBGT / DBS", affiliation: "Z-Fighters",       image: "images/goku.jpg" },
  { name: "Vegeta",          sex: "Masculin", hair: "Noir",   origin: "Vegeta",  race: "Saiyan",          episode: 5,   saga: "Saga des Saiyans",      serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/vegeta.jpg" },
  { name: "Gohan",           sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Demi-Saiyan",     episode: 1,   saga: "Saga des Saiyans",      serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/gohan.jpg" },
  { name: "Goten",           sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Demi-Saiyan",     episode: 195, saga: "Saga Boo",              serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/goten.jpg" },
  { name: "Trunks (futur)",  sex: "Masculin", hair: "Violet", origin: "Terre",   race: "Demi-Saiyan",     episode: 122, saga: "Saga Trunks",           serie: "DBZ / DBS",             affiliation: "Z-Fighters",       image: "images/trunks_futur.jpg" },
  { name: "Trunks (enfant)", sex: "Masculin", hair: "Violet", origin: "Terre",   race: "Demi-Saiyan",     episode: 195, saga: "Saga Boo",              serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/trunks_enfant.jpg" },
  { name: "Pan",             sex: "Féminin",  hair: "Noir",   origin: "Terre",   race: "Quart Saiyan",    episode: 288, saga: "Saga Boo",              serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/pan.jpg" },
  { name: "Broly (Légendaire)", sex: "Masculin", hair: "Noir", origin: "Vegeta",  race: "Saiyan",          episode: 165, saga: "Films DBZ",             serie: "DBZ",                   affiliation: "Indépendant",      image: "images/broly_legendaire.jpg" },
  { name: "Broly (DBS)",     sex: "Masculin", hair: "Noir",   origin: "Vampa",   race: "Saiyan",          episode: 132, saga: "Saga Broly",            serie: "DBS",                   affiliation: "Indépendant",      image: "images/broly_dbs.jpg" },
  { name: "Raditz",          sex: "Masculin", hair: "Noir",   origin: "Vegeta",  race: "Saiyan",          episode: 1,   saga: "Saga des Saiyans",      serie: "DBZ",                   affiliation: "Armée Saiyan",     image: "images/raditz.jpg" },
  { name: "Nappa",           sex: "Masculin", hair: "Chauve", origin: "Vegeta",  race: "Saiyan",          episode: 5,   saga: "Saga des Saiyans",      serie: "DBZ",                   affiliation: "Armée Saiyan",     image: "images/nappa.jpg" },
  { name: "Bardock",         sex: "Masculin", hair: "Noir",   origin: "Vegeta",  race: "Saiyan",          episode: 40,  saga: "TV Special Bardock",    serie: "DBZ / DBS",             affiliation: "Armée Saiyan",     image: "images/bardock.jpg" },
  { name: "Turles",          sex: "Masculin", hair: "Noir",   origin: "Vegeta",  race: "Saiyan",          episode: 50,  saga: "Films DBZ",             serie: "DBZ",                   affiliation: "Indépendant",      image: "images/turles.jpg" },

  // ════════════ HUMAINS / Z-FIGHTERS ════════════
  { name: "Krillin",         sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Humain",          episode: 14,  saga: "Saga Tournoi",          serie: "DB / DBZ / DBGT / DBS", affiliation: "Z-Fighters",       image: "images/krillin.jpg" },
  { name: "Yamcha",          sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Humain",          episode: 7,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBS",        affiliation: "Z-Fighters",       image: "images/yamcha.jpg" },
  { name: "Tenshinhan",      sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Humain",          episode: 75,  saga: "Saga 22e Tenkaichi",    serie: "DB / DBZ / DBS",        affiliation: "Z-Fighters",       image: "images/tenshinhan.jpg" },
  { name: "Chaozu",          sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Humain",          episode: 75,  saga: "Saga 22e Tenkaichi",    serie: "DB / DBZ / DBS",        affiliation: "Z-Fighters",       image: "images/chaozu.jpg" },
  { name: "Maître Roshi",    sex: "Masculin", hair: "Blanc",  origin: "Terre",   race: "Humain",          episode: 4,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBGT / DBS", affiliation: "Z-Fighters",       image: "images/maitre_roshi.jpg" },
  { name: "Bulma",           sex: "Féminin",  hair: "Bleu",   origin: "Terre",   race: "Humain",          episode: 1,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBGT / DBS", affiliation: "Famille / Civils", image: "images/bulma.jpg" },
  { name: "Chi-Chi",         sex: "Féminin",  hair: "Noir",   origin: "Terre",   race: "Humain",          episode: 6,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBGT / DBS", affiliation: "Famille / Civils", image: "images/chi_chi.jpg" },
  { name: "Videl",           sex: "Féminin",  hair: "Noir",   origin: "Terre",   race: "Humain",          episode: 200, saga: "Saga Boo",              serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/videl.jpg" },
  { name: "Mr. Satan",       sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Humain",          episode: 158, saga: "Saga Cell",             serie: "DBZ / DBGT / DBS",      affiliation: "Famille / Civils", image: "images/mr_satan.jpg" },
  { name: "Launch",          sex: "Féminin",  hair: "Blond",  origin: "Terre",   race: "Humain",          episode: 18,  saga: "Saga Tournoi",          serie: "DB / DBZ",              affiliation: "Famille / Civils", image: "images/launch.jpg" },

  // ════════════ NAMEKIENS ════════════
  { name: "Piccolo",         sex: "Masculin", hair: "Chauve", origin: "Namek",   race: "Namekien",        episode: 102, saga: "Saga Piccolo Daimaô",   serie: "DB / DBZ / DBGT / DBS", affiliation: "Z-Fighters",       image: "images/piccolo.jpg" },
  { name: "Nail",            sex: "Masculin", hair: "Chauve", origin: "Namek",   race: "Namekien",        episode: 58,  saga: "Saga Freezer",          serie: "DBZ",                   affiliation: "Z-Fighters",       image: "images/nail.jpg" },
  { name: "Dende",           sex: "Masculin", hair: "Chauve", origin: "Namek",   race: "Namekien",        episode: 47,  saga: "Saga Namek",            serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/dende.jpg" },
  { name: "Grand Guru",      sex: "Masculin", hair: "Chauve", origin: "Namek",   race: "Namekien",        episode: 53,  saga: "Saga Namek",            serie: "DBZ",                   affiliation: "Z-Fighters",       image: "images/grand_guru.jpg" },

  // ════════════ FREEZER & FAMILLE ════════════
  { name: "Freezer",         sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Race de Freezer", episode: 44,  saga: "Saga Freezer",          serie: "DBZ / DBGT / DBS",      affiliation: "Force Freezer",    image: "images/freezer.jpg" },
  { name: "Cooler",          sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Race de Freezer", episode: 78,  saga: "Films DBZ",             serie: "DBZ",                   affiliation: "Force Freezer",    image: "images/cooler.jpg" },
  { name: "King Cold",       sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Race de Freezer", episode: 120, saga: "Saga Trunks",           serie: "DBZ",                   affiliation: "Force Freezer",    image: "images/king_cold.jpg" },

  // ════════════ ANDROÏDES / CYBORGS ════════════
  { name: "Androïde 17",     sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Androïde",        episode: 135, saga: "Saga des Cyborgs",      serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/androide_17.jpg" },
  { name: "Androïde 18",     sex: "Féminin",  hair: "Blond",  origin: "Terre",   race: "Androïde",        episode: 135, saga: "Saga des Cyborgs",      serie: "DBZ / DBGT / DBS",      affiliation: "Z-Fighters",       image: "images/androide_18.jpg" },
  { name: "Androïde 16",     sex: "Masculin", hair: "Roux",   origin: "Terre",   race: "Androïde",        episode: 135, saga: "Saga des Cyborgs",      serie: "DBZ",                   affiliation: "Patrouille Rouge", image: "images/androide_16.jpg" },
  { name: "Androïde 20 (Dr Gero)", sex: "Masculin", hair: "Blanc", origin: "Terre", race: "Androïde",      episode: 132, saga: "Saga des Cyborgs",      serie: "DBZ",                   affiliation: "Patrouille Rouge", image: "images/androide_20_dr_gero.jpg" },
  { name: "Cell",            sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Bio-Androïde",    episode: 140, saga: "Saga Cell",             serie: "DBZ",                   affiliation: "Patrouille Rouge", image: "images/cell.jpg" },

  // ════════════ MAJIN / MAGIE ════════════
  { name: "Buu (Innocent)",  sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Majin",           episode: 232, saga: "Saga Boo",              serie: "DBZ / DBGT / DBS",      affiliation: "Majin",            image: "images/buu_innocent.jpg" },
  { name: "Buu (Super)",     sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Majin",           episode: 253, saga: "Saga Boo",              serie: "DBZ",                   affiliation: "Majin",            image: "images/buu_super.jpg" },
  { name: "Babidi",          sex: "Masculin", hair: "Chauve", origin: "Inconnue",race: "Extraterrestre",  episode: 220, saga: "Saga Boo",              serie: "DBZ",                   affiliation: "Majin",            image: "images/babidi.jpg" },

  // ════════════ DIEUX / DIVINS ════════════
  { name: "Beerus",          sex: "Masculin", hair: "Chauve", origin: "Monde de Beerus", race: "Dieu Destruction", episode: 5,  saga: "Saga Batailles des Dieux", serie: "DBS",                   affiliation: "Divinités",        image: "images/beerus.jpg" },
  { name: "Whis",            sex: "Masculin", hair: "Blanc",  origin: "Monde de Beerus", race: "Ange",             episode: 5,  saga: "Saga Batailles des Dieux", serie: "DBS",                   affiliation: "Divinités",        image: "images/whis.jpg" },
  { name: "Zamasu",          sex: "Masculin", hair: "Blanc",  origin: "Monde des Kaïô",  race: "Kaïô-shin",        episode: 55, saga: "Saga Trunks du Futur",     serie: "DBS",                   affiliation: "Divinités",        image: "images/zamasu.jpg" },
  { name: "Goku Black",      sex: "Masculin", hair: "Noir",   origin: "Monde des Kaïô",  race: "Kaïô-shin / Saiyan", episode: 47, saga: "Saga Trunks du Futur",   serie: "DBS",                   affiliation: "Divinités",        image: "images/goku_black.jpg" },
  { name: "Zeno",            sex: "Neutre",   hair: "Chauve", origin: "Palais du Roi de Tout", race: "Omni-Roi",   episode: 41, saga: "Saga Univers 6",            serie: "DBS",                   affiliation: "Divinités",        image: "images/zeno.jpg" },
  { name: "Grand Prêtre",    sex: "Masculin", hair: "Blanc",  origin: "Palais du Roi de Tout", race: "Ange",       episode: 82, saga: "Tournoi du Pouvoir",        serie: "DBS",                   affiliation: "Divinités",        image: "images/grand_pretre.jpg" },
  { name: "Kaïô",            sex: "Masculin", hair: "Chauve", origin: "Planète Kaïô",   race: "Kaïô",              episode: 17, saga: "Saga des Saiyans",          serie: "DBZ / DBGT / DBS",      affiliation: "Divinités",        image: "images/kaio.jpg" },
  { name: "Grand Kaïô-shin", sex: "Masculin", hair: "Blanc",  origin: "Monde des Kaïô", race: "Kaïô-shin",         episode: 212, saga: "Saga Boo",                 serie: "DBZ / DBS",             affiliation: "Divinités",        image: "images/grand_kaio_shin.jpg" },

  // ════════════ TOURNOI DE LA PUISSANCE / UNIVERS 6 ════════════
  { name: "Jiren",           sex: "Masculin", hair: "Chauve", origin: "Inconnue", race: "Humanoïde",      episode: 85,  saga: "Tournoi du Pouvoir",    serie: "DBS",                   affiliation: "Pride Troopers",   image: "images/jiren.jpg" },
  { name: "Hit",             sex: "Masculin", hair: "Chauve", origin: "Inconnue", race: "Extraterrestre", episode: 38,  saga: "Saga Univers 6",        serie: "DBS",                   affiliation: "Univers 6",        image: "images/hit.jpg" },
  { name: "Caulifla",        sex: "Féminin",  hair: "Noir",   origin: "Sadala",   race: "Saiyan",         episode: 88,  saga: "Tournoi du Pouvoir",    serie: "DBS",                   affiliation: "Univers 6",        image: "images/caulifla.jpg" },
  { name: "Kale",            sex: "Féminin",  hair: "Vert",   origin: "Sadala",   race: "Saiyan",         episode: 89,  saga: "Tournoi du Pouvoir",    serie: "DBS",                   affiliation: "Univers 6",        image: "images/kale.jpg" },
  { name: "Cabba",           sex: "Masculin", hair: "Noir",   origin: "Sadala",   race: "Saiyan",         episode: 34,  saga: "Saga Univers 6",        serie: "DBS",                   affiliation: "Univers 6",        image: "images/cabba.jpg" },
  { name: "Toppo",           sex: "Masculin", hair: "Chauve", origin: "Inconnue", race: "Humanoïde",      episode: 78,  saga: "Tournoi du Pouvoir",    serie: "DBS",                   affiliation: "Pride Troopers",   image: "images/toppo.jpg" },

  // ════════════ DB CLASSIQUE ════════════
  { name: "Pilaf",           sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Extraterrestre",  episode: 9,   saga: "Saga Pilaf",            serie: "DB / DBS",              affiliation: "Indépendant",      image: "images/pilaf.jpg" },
  { name: "Tao Pai Pai",     sex: "Masculin", hair: "Blanc",  origin: "Terre",   race: "Humain",          episode: 81,  saga: "Saga Red Ribbon",       serie: "DB / DBZ",              affiliation: "Patrouille Rouge", image: "images/tao_pai_pai.jpg" },
  { name: "Demon King Piccolo", sex: "Masculin", hair: "Chauve", origin: "Terre", race: "Namekien",        episode: 102, saga: "Saga Piccolo Daimaô",   serie: "DB",                    affiliation: "Démons",           image: "images/demon_king_piccolo.jpg" },

  // ════════════ DRAGON BALL GT ════════════
  { name: "Baby",            sex: "Masculin", hair: "Blanc",  origin: "Tuffle",  race: "Tuffle",          episode: 16,  saga: "Saga Baby",             serie: "DBGT",                  affiliation: "Méchants GT",      image: "images/baby.jpg" },
  { name: "Super 17",        sex: "Masculin", hair: "Noir",   origin: "Terre",   race: "Androïde",        episode: 35,  saga: "Saga Super 17",         serie: "DBGT",                  affiliation: "Patrouille Rouge", image: "images/super_17.jpg" },
  { name: "Omega Shenron",   sex: "Masculin", hair: "Chauve", origin: "Terre",   race: "Dragon Noir",     episode: 59,  saga: "Saga Dragons Maléfiques", serie: "DBGT",                affiliation: "Méchants GT",      image: "images/omega_shenron.jpg" },

  // ════════════ DIVERS ════════════
  { name: "Shenron",         sex: "Neutre",   hair: "Aucun",  origin: "Terre",   race: "Dragon",          episode: 11,  saga: "Saga Pilaf",            serie: "DB / DBZ / DBGT / DBS", affiliation: "Indépendant",      image: "images/shenron.jpg" },
  { name: "Oolong",          sex: "Masculin", hair: "Aucun",  origin: "Terre",   race: "Anthropomorphe",  episode: 4,   saga: "Saga Pilaf",            serie: "DB / DBZ / DBS",        affiliation: "Famille / Civils", image: "images/oolong.jpg" },
  { name: "Garlic Jr.",      sex: "Masculin", hair: "Chauve", origin: "Terre Sacrée des Kaïô", race: "Extraterrestre", episode: 1,   saga: "Saga Garlic Jr",       serie: "DBZ",                   affiliation: "Démons",           image: "images/garlic_jr.jpg" },
  { name: "Janemba",         sex: "Masculin", hair: "Chauve", origin: "Enfer",   race: "Démon",           episode: 195, saga: "Films DBZ",             serie: "DBZ",                   affiliation: "Démons",           image: "images/janemba.jpg" },

];
