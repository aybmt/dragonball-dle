# Configuration Supabase — Compteur de joueurs

Ce guide t'accompagne pas à pas pour activer le compteur de joueurs ayant gagné chaque jour. C'est **100% gratuit** pour un usage personnel (largement sous le quota gratuit de Supabase).

## 1. Créer un projet Supabase

1. Va sur **https://supabase.com** et clique sur **Start your project**
2. Connecte-toi avec GitHub (ou email)
3. Clique sur **New Project**
4. Remplis :
   - **Name** : `dbdle` (ou ce que tu veux)
   - **Database Password** : génère un mot de passe fort (garde-le quelque part, on n'en aura pas besoin pour ce projet mais c'est bon à avoir)
   - **Region** : choisis **West EU (Paris)** ou **Central EU (Frankfurt)** pour la latence
5. Clique sur **Create new project** et patiente ~2 minutes

## 2. Créer la table `daily_stats`

1. Dans le menu de gauche, clique sur **SQL Editor**
2. Clique sur **New query**
3. Colle ce code :

```sql
-- Table qui stocke le nombre de gagnants par jour
create table daily_stats (
  date_key text primary key,
  winners integer not null default 0,
  created_at timestamptz default now()
);

-- Fonction qui incrémente le compteur (crée la ligne si elle n'existe pas)
create or replace function increment_winners(p_date_key text)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into daily_stats (date_key, winners)
  values (p_date_key, 1)
  on conflict (date_key)
  do update set winners = daily_stats.winners + 1
  returning winners into new_count;

  return new_count;
end;
$$;

-- Permet à n'importe qui (clé anon) d'appeler la fonction
grant execute on function increment_winners(text) to anon;

-- Active Row Level Security et autorise la lecture publique
alter table daily_stats enable row level security;

create policy "Allow public read"
  on daily_stats for select
  to anon
  using (true);
```

4. Clique sur **Run** (ou Ctrl+Enter)
5. Tu devrais voir "Success. No rows returned"

## 3. Récupérer tes clés

1. Dans le menu de gauche, clique sur l'icône ⚙ **Project Settings**
2. Va dans **API**
3. Copie :
   - **Project URL** (ex: `https://abcdefghij.supabase.co`)
   - **anon public** key (longue chaîne qui commence par `eyJ...`)

## 4. Configurer dans game.js

Ouvre `game.js` et trouve ces lignes tout en haut (vers la ligne 8) :

```javascript
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
```

Remplace par tes valeurs :

```javascript
const SUPABASE_URL = "https://abcdefghij.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...ta_clé_complète";
```

## 5. Tester

1. Recharge le site
2. Joue et gagne
3. Ouvre la console (F12) — tu ne devrais voir **aucune erreur** Supabase
4. Va dans Supabase → **Table Editor** → `daily_stats` : tu devrais voir une ligne avec `date_key` du jour et `winners: 1`
5. Si tu rejoues avec un autre navigateur (ou en navigation privée), le compteur passe à 2

## Notes

- La clé **anon public** est faite pour être exposée publiquement, c'est OK de la mettre dans `game.js`. La sécurité repose sur les policies Row Level Security qu'on a configurées.
- Si tu veux **réinitialiser le compteur d'un jour**, va dans Table Editor → `daily_stats` → supprime/édite la ligne concernée.
- Le quota gratuit Supabase : 500 MB de DB, 5 GB de bandwidth/mois. Tu seras très très loin du plafond avec ce projet.

## Si tu ne veux pas configurer Supabase

Pas grave : le site fonctionne sans. Le compteur affichera simplement "**—**" au lieu d'un nombre. Tout le reste (jeu, timer, victoire, localStorage) fonctionne quand même.
