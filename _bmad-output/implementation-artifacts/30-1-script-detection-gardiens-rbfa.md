# Story 30.1 : Script de détection automatique des gardiens de but — Croisement CSV × Feuilles de match RBFA

Status: done

---

## Story

En tant qu'administrateur Aureak,
je veux un script Python autonome qui identifie automatiquement quels joueurs d'un fichier CSV sont gardiens de but en croisant leurs apparitions avec les feuilles de match RBFA,
afin de pouvoir enrichir l'annuaire `child_directory` avec le rôle `gardien` de façon fiable et auditée, sans erreurs de suppression.

---

## Contexte & Objectif Métier

L'annuaire contient ~678 joueurs importés de Notion. Parmi eux, un sous-ensemble sont gardiens de but. Le champ `statut` actuel (Académicien | Ancien | Nouveau | Stagiaire) ne contient pas cette information. Pour enrichir les profils joueurs avec le rôle GK, il faut croiser les données CSV avec les feuilles de match RBFA où chaque joueur a un poste affiché (GK ou joueur de champ).

Ce script est un **outil standalone** (hors monorepo Aureak). Il produit un CSV enrichi destiné à une revue manuelle puis à un éventuel import.

### Structure réelle du fichier CSV d'entrée

Fichier `Membres namur.csv` analysé — séparateur `;`, encodage Latin-1 probable.

| Colonne CSV | Description | Exemple |
|---|---|---|
| `province` | Province belge | `Namur` |
| `matricule` | Matricule du **club** RBFA | `6027` |
| `club` | Nom du club | `A.C. LUSTIN` |
| `nom` | Nom de famille (MAJUSCULES) | `TRICNAUX` |
| `prénom` | Prénom (MAJUSCULES) | `JONAS` |
| `datenaiss` | Date naissance format `M/DD/YY` (américain, année sur 2 chiffres) | `8/11/94` = 11 août 1994 |
| `cdesexe` | Sexe | `H` / `F` |
| `adresse` | Adresse postale | `SAINT HADELIN 16` |
| `cdepost` | Code postal | `5561` |
| `commune` | Commune | `CELLES` |
| `email` | Email | `fred.quinet@hotmail.com` |
| `numaffil` | **Numéro d'affiliation RBFA du joueur** (identifiant direct) | `602766` |

**Point critique** : le champ `numaffil` est le **matricule RBFA du joueur**. Si l'API RBFA permet une recherche par numéro d'affiliation, c'est la stratégie de matching prioritaire — bien plus fiable et précise que le matching par nom.

---

## Acceptance Criteria

### AC1 — Lecture CSV d'entrée
- Le script lit un fichier CSV dont la structure correspond au format RBFA provincial (séparateur `;`)
- Colonnes obligatoires : `nom`, `prénom` (ou `prenom` sans accent — les deux acceptés)
- Colonnes exploitées : `numaffil` (priorité matching), `datenaiss`, `matricule` (club), `club`, `province`, `cdesexe`
- Encodage détecté automatiquement (Latin-1 probable pour les fichiers RBFA Namur) avec fallback UTF-8
- Format date `datenaiss` : `M/DD/YY` (ex: `8/11/94`) → année résolue en `19XX` si YY <= 99 (tous les joueurs sont nés avant 2000 dans ce fichier)
- Les colonnes manquantes ne font pas planter le script — valeur = `None`
- Le script valide la présence de `nom` + `prénom` au lancement (colonnes obligatoires)
- Le `numaffil` vide ou `0` est traité comme absent

### AC2 — Recherche joueur sur RBFA

**Stratégie de matching — ordre de priorité :**

1. **`numaffil` comme aide au scoring** : le numéro d'affiliation est conservé dans le CSV et transmis dans le commentaire de sortie. Il est possible (à confirmer en Task 0) que le site RBFA l'expose sur certaines pages joueur ou dans le GraphQL — à tester mais pas supposé fonctionner.
2. **Recherche par nom+prénom** via GraphQL `datalake-prod2018.rbfa.be/graphql` (channel `belgianfootball`, query DoSearch) — stratégie principale
3. **Fallback HTML** : scraping `www.rbfa.be/fr/search?q={nom}+{prenom}` si GraphQL ne retourne pas de résultat joueur
4. **Score de similarité** calculé pour chaque candidat retourné (voir AC5)
5. Si score < `MIN_MATCH_SCORE` (défaut 0.65) → `incertain`, commentaire `"matching RBFA insuffisant (score X.XX)"`
6. Si plusieurs candidats proches (delta < 0.1) → `incertain`, commentaire `"plusieurs profils possibles, validation manuelle nécessaire"`

Le `matricule` club (ex: `6027`) peut servir à retrouver les équipes d'un club directement via `https://www.rbfa.be/fr/club/{matricule}` → liste des équipes → matchs. À investiguer en Task 0.4.

### AC3 — Collecte des feuilles de match
- Pour chaque joueur RBFA identifié, le script récupère les matchs de son équipe (URL pattern à investiguer lors de l'implémentation — voir Dev Notes)
- Pour chaque match trouvé : scraping de la feuille de match HTML pour extraire la composition
- Extraction du rôle de chaque joueur dans la composition : `GK` ou `joueur_champ`
- Maximum `MAX_MATCHES_PER_PLAYER` matchs analysés (défaut configurable : 10)
- Chaque URL analysée est mise en cache JSON local (`cache/`) pour éviter les rechargements
- Délai entre requêtes HTTP : `REQUEST_DELAY_SECONDS` (défaut 1.5s)

### AC4 — Classification GK
La logique de classification est la suivante, dans cet ordre de priorité :

```
si apparitions_GK >= 1
  → statut = "gardien"

sinon si apparitions_GK = 0 ET apparitions_champ >= MIN_CHAMP_FOR_NON_GK (défaut 3)
  → statut = "non_gardien"

sinon
  → statut = "incertain"
```

Champ `confiance` :
- `"haute"` : gardien avec apparitions_GK >= 2 OU non_gardien avec apparitions_champ >= 5
- `"moyenne"` : gardien avec apparitions_GK = 1 OU non_gardien avec apparitions_champ 3-4
- `"faible"` : incertain ou données insuffisantes

Exemples attendus :
| Cas | apparitions_GK | apparitions_champ | statut | confiance |
|---|---|---|---|---|
| GK confirmé | 1 | 2 | gardien | moyenne |
| GK récurrent | 3 | 0 | gardien | haute |
| Non GK évident | 0 | 4 | non_gardien | haute |
| Non GK limite | 0 | 3 | non_gardien | moyenne |
| Données insuffisantes | 0 | 1 | incertain | faible |
| Aucun match trouvé | 0 | 0 | incertain | faible |

### AC5 — Algorithme de scoring de matching
Score sur 1.0, calculé comme somme pondérée :

| Critère | Poids | Détail |
|---|---|---|
| nom exact (normalisé) | 0.35 | Insensible casse + accents |
| prénom exact (normalisé) | 0.30 | Insensible casse + accents |
| année de naissance identique | 0.20 | Si disponible dans CSV |
| club identique (normalisé) | 0.10 | Fuzzy match acceptable |
| catégorie / équipe | 0.05 | Si disponible |

Normalisation = `unidecode` + minuscule + suppression tirets/espaces multiples.

Si un critère est absent du CSV, son poids est redistribué proportionnellement sur les critères disponibles.

### AC6 — Export CSV enrichi
Le fichier de sortie `output/results_YYYYMMDD_HHMMSS.csv` contient :

| Colonne | Description |
|---|---|
| `prenom` | Prénom d'origine |
| `nom` | Nom d'origine |
| `club` | Club d'origine CSV |
| `equipe` | Equipe d'origine CSV |
| `matches_trouves` | Nombre de feuilles de match analysées |
| `apparitions_total` | Total apparitions trouvées |
| `apparitions_GK` | Nombre d'apparitions en tant que GK |
| `apparitions_champ` | Nombre d'apparitions comme joueur de champ |
| `statut_final` | `gardien` / `non_gardien` / `incertain` |
| `confiance` | `haute` / `moyenne` / `faible` |
| `commentaire` | Explication lisible (voir exemples AC7) |
| `rbfa_profil_url` | URL du profil RBFA identifié (ou vide) |
| `sources_urls` | Liste URLs des feuilles de match analysées (`;` séparateur) |
| `score_matching` | Score de similarité (float 0-1) |

### AC7 — Commentaires explicites
Le champ `commentaire` doit contenir des phrases lisibles, par exemple :
- `"1 apparition GK détectée (match du 12/03/2025 — RFC Liège U15)"`
- `"4 apparitions trouvées, jamais GK"`
- `"aucune donnée RBFA exploitable"`
- `"plusieurs profils possibles, validation manuelle nécessaire"`
- `"matching RBFA insuffisant (score 0.42)"`
- `"3 apparitions GK sur 5 matchs analysés"`

### AC8 — Robustesse & modes d'exécution
- Mode `--dry-run` : analyse uniquement les 3 premiers joueurs, sans écrire le CSV de sortie
- Mode `--test N` : analyse les N premiers joueurs (défaut 10)
- Mode `--full` : analyse complète (tous les joueurs)
- Sauvegarde intermédiaire toutes les 20 lignes traitées (`output/partial_YYYYMMDD.csv`)
- En cas d'interruption, reprise possible via `--resume output/partial_*.csv`
- Logs détaillés dans `logs/run_YYYYMMDD_HHMMSS.log`
- Gestion explicite des erreurs HTTP (timeout, 429 rate limit, 5xx) avec retry exponentiel (3 tentatives)

### AC9 — Cache local
- Chaque réponse HTTP est mise en cache dans `cache/{url_hash}.json`
- La clé de cache est le hash MD5 de l'URL
- Le cache est valide `CACHE_TTL_HOURS` heures (défaut 72h)
- Option `--clear-cache` pour vider le cache
- Le cache ne contient jamais de données personnelles sensibles — uniquement le HTML/JSON brut

### AC10 — Configuration via `config.yaml`
```yaml
# Seuils de classification
min_gk_appearances: 1           # Nb min apparitions GK pour classer "gardien"
min_champ_for_non_gk: 3         # Nb min apparitions champ pour classer "non_gardien"
min_match_score: 0.65           # Score min pour valider un matching RBFA
ambiguous_delta: 0.10           # Delta max entre 2 candidats pour détecter ambiguïté

# Collecte
max_matches_per_player: 10      # Nb max feuilles de match analysées par joueur
request_delay_seconds: 1.5      # Délai entre requêtes HTTP
request_timeout_seconds: 15     # Timeout par requête
cache_ttl_hours: 72             # Durée de vie cache

# Fichiers
input_file: "input/players.csv"
output_dir: "output/"
cache_dir: "cache/"
log_dir: "logs/"
```

---

## Tasks / Subtasks

- [x] **Task 0 — Investigation préalable de la structure RBFA** (CRITIQUE — avant tout code)
  - [x] 0.1 `numaffil` → `/fr/player/{numaffil}` = 404. Non utilisable comme URL directe. Conservé comme champ de traçabilité.
  - [x] 0.2 GraphQL introspection disabled (Apollo `introspection: false` en prod). Contournement : interception Chrome DevTools.
  - [x] 0.3 DoSearch ne retourne PAS de PlayerSearchResult — uniquement ClubSearchResult + TeamSearchResult.
  - [x] 0.4 `/fr/club/{matricule}` ≠ RBFA URL clubId. Le `matricule` CSV = registrationNumber (ex: `06027`), le clubId URL = `2087`. Mapping via DoSearch.
  - [x] 0.5 URL matchs : `https://www.rbfa.be/fr/match/{matchId}` (confirmé).
  - [x] 0.6 GK identifié via `badges` field : `"(GK)" in badges`. Données dans `GetMatchDetail.lineup[].{home/away}.badges`.
  - [x] 0.7 Findings documentés dans `scripts/gk-detector/RBFA_ANALYSIS.md`.
  - [x] 0.8 Stratégie : GraphQL APQ pur (requests standard) — Playwright non nécessaire.

- [x] **Task 1 — Structure du projet et config**
  - [x] 1.1 Arborescence `scripts/gk-detector/` créée (src/, tests/, input/, output/, cache/, logs/)
  - [x] 1.2 `config.yaml` créé avec toutes les valeurs par défaut (AC10)
  - [x] 1.3 `requirements.txt` créé
  - [x] 1.4 `src/config.py` : dataclass `AppConfig` chargée depuis `config.yaml`

- [x] **Task 2 — `src/parse_csv.py`**
  - [x] 2.1 Fonction `load_players(path: str) -> list[PlayerRecord]`
  - [x] 2.2 Dataclass `PlayerRecord` : prenom, nom, date_naissance, annee_naissance, club, matricule_club, numaffil, province, cdesexe
  - [x] 2.3 Validation colonnes obligatoires + encodage Latin-1/UTF-8 auto
  - [x] 2.4 Normalisation headers CSV

- [x] **Task 3 — `src/normalize.py`**
  - [x] 3.1 `normalize_name()` : unidecode + minuscule + collapse whitespace/hyphens
  - [x] 3.2 `extract_birth_year()` : supporte M/DD/YY, DD/MM/YYYY, YYYY-MM-DD, YYYY
  - [x] 3.3 `compute_lineup_match_score()` + `compute_match_score_full()` : algorithme AC5
  - [x] 3.4 Tests unitaires dans `tests/test_normalize.py` (20 tests)

- [x] **Task 4 — `src/rbfa_client.py`**
  - [x] 4.1 Classe `RbfaClient` avec session requests, retry exponentiel, délai inter-requêtes
  - [x] 4.2 `get_cached()` : cache JSON par hash MD5
  - [x] 4.3 `post_graphql()` : appel GraphQL RBFA avec cache
  - [x] 4.4 Gestion 429 (Retry-After ou backoff 30s)
  - [x] 4.5 Retry 3x avec backoff via HTTPAdapter
  - [x] 4.6 `clear_cache()` implémenté

- [x] **Task 5 — `src/rbfa_search.py`**
  - [x] 5.1 Fonction `search_club_rbfa_id()` : DoSearch par nom + vérification registrationNumber
  - [x] 5.2 Padding matricule 5 chiffres : `6027` → `06027`
  - [x] 5.3 Stratégie club-based (players non searchables) — adaptation de l'AC2 original
  - [x] 5.4 Fallback best-name-similarity si registration number absent
  - [x] 5.5 Seuil 0.60 pour accepter le match club

- [x] **Task 6 — `src/rbfa_match_sheets.py`**
  - [x] 6.1 `get_club_matches()` : APQ `clubMatchesAssignations` (date format YYYY/MM/DD, hasLocation=true)
  - [x] 6.2 Dataclass `MatchRef` : match_id, date, home/away_team, home/away_club_id, age_group, state, url
  - [x] 6.3 `fetch_match_sheet()` : APQ `GetMatchDetail` → lineup → PlayerAppearance
  - [x] 6.4 Dataclass `PlayerAppearance` : rbfa_player_id, nom, prenom, role, team_side, match_id, match_date, urls
  - [x] 6.5 GK detection via `"(GK)" in badges` (GraphQL, pas HTML)
  - [x] 6.6 `max_matches_per_club` configurable

- [x] **Task 7 — `src/classifier.py`**
  - [x] 7.1 `classify_player()` + `classify_no_club()`
  - [x] 7.2 Dataclass `ClassificationResult` : statut, confiance, commentaire, apparitions_gk/champ/total, matches_trouves, sources_urls
  - [x] 7.3 Logique AC4 exacte
  - [x] 7.4 Commentaires lisibles AC7
  - [x] 7.5 Tests unitaires dans `tests/test_classifier.py` (14 tests, 6 cas AC4)

- [x] **Task 8 — `src/export.py`**
  - [x] 8.1 `export_results()` : CSV UTF-8-sig (Excel-compatible)
  - [x] 8.2 Dataclass `ResultRow` : toutes colonnes AC6
  - [x] 8.3 `save_partial()` : sauvegarde toutes les 20 lignes
  - [x] 8.4 `load_partial()` : reprise via `--resume`

- [x] **Task 9 — `src/main.py`**
  - [x] 9.1 CLI argparse : --dry-run, --test N, --full, --resume, --clear-cache, --config, --input, --verbose
  - [x] 9.2 Boucle club-based : groupement par club → bulk API → match player par nom → classify
  - [x] 9.3 Logging rich + fichier log horodaté
  - [x] 9.4 Résumé final : gardiens / non_gardiens / incertains

- [x] **Task 10 — README.md + exemples**
  - [x] 10.1 `README.md` : installation, usage, config, sorties, stratégie technique
  - [x] 10.2 `input/players_example.csv` : 10 lignes couvrant tous les cas
  - [x] 10.3 `output/results_example.csv` : exemple de sortie commentée

---

## Dev Notes

### CRITIQUE : Investigation préalable obligatoire (Task 0)

**Ne pas commencer le scraper sans avoir d'abord inspecté la structure RBFA.**

#### Le `numaffil` — à investiguer mais non supposé visible publiquement

Le CSV contient `numaffil` (ex: `602766`). C'est le numéro d'affiliation RBFA officiel du joueur. Il est probable que ce numéro ne soit **pas directement accessible** via une URL publique `www.rbfa.be/fr/player/{numaffil}`. À vérifier en Task 0.1 sans l'attendre :
- Tester `https://www.rbfa.be/fr/player/602766` — retourne-t-il quelque chose ?
- Si oui → stratégie directe parfaite, confiance = 1.0
- Si non → le `numaffil` reste utile pour enrichir le CSV de sortie (information de traçabilité)

#### Le `matricule` club (ex: `6027`) donne un accès direct au club RBFA

- `https://www.rbfa.be/fr/club/6027` — page du club A.C. LUSTIN
- Depuis la page club → équipes → matchs → feuilles de match
- Alternative plus directe que la recherche par nom de club

#### Introspection GraphQL à tester
```python
introspection_query = """
query { __schema { types { name kind } } }
"""
```
Si types `PlayerSearchResult`, `MatchSearchResult`, `TeamSearchResult` disponibles → GraphQL en priorité.

**URLs RBFA probables à investiguer :**
- Profil joueur par numaffil : `https://www.rbfa.be/fr/player/{numaffil}`
- Page club par matricule : `https://www.rbfa.be/fr/club/{matricule_club}`
- Page matchs d'une équipe : `https://www.rbfa.be/fr/team/{teamId}/matches`
- Feuille de match : `https://www.rbfa.be/fr/match/{matchId}`
- Recherche : `https://www.rbfa.be/fr/search?q={query}`

**Stratégie recommandée (ordre de priorité) :**
1. GraphQL introspection → si queries player/match disponibles → GraphQL first
2. Sinon HTML scraping simple avec `requests` + `beautifulsoup4` + `lxml`
3. Si site protégé anti-bot → Playwright headless (`playwright install chromium`)

**Si Playwright nécessaire**, ajouter `playwright` aux requirements et créer `src/browser_client.py` séparé. Ne pas l'utiliser si le scraping simple fonctionne (overhead inutile).

### Structure du projet

```
scripts/gk-detector/
├── input/
│   ├── players.csv              # Fichier d'entrée (fourni par l'utilisateur)
│   └── players_example.csv      # Exemple documenté
├── output/
│   └── results_YYYYMMDD_HHMMSS.csv
├── cache/
│   └── {md5_url}.json           # Cache HTML/JSON par URL
├── logs/
│   └── run_YYYYMMDD_HHMMSS.log
├── src/
│   ├── config.py                # AppConfig dataclass
│   ├── parse_csv.py             # PlayerRecord + load_players()
│   ├── normalize.py             # normalize_name(), compute_match_score()
│   ├── rbfa_client.py           # RbfaClient (HTTP + cache + retry)
│   ├── rbfa_search.py           # search_player_rbfa()
│   ├── rbfa_match_sheets.py     # get_team_matches(), fetch_match_sheet()
│   ├── classifier.py            # classify_player() + ClassificationResult
│   ├── export.py                # export_results()
│   └── main.py                  # CLI orchestrateur
├── tests/
│   ├── test_normalize.py        # Tests unitaires normalisation + scoring
│   └── test_classifier.py       # Tests unitaires classification (6 cas AC4)
├── config.yaml                  # Paramètres ajustables
├── requirements.txt
├── RBFA_ANALYSIS.md             # (créé en Task 0) findings structure RBFA
└── README.md
```

### Logique de scoring (AC5) — implémentation recommandée

```python
def compute_match_score(player: PlayerRecord, candidate: RbfaCandidate) -> float:
    weights = {}
    if player.nom:       weights['nom']    = 0.35
    if player.prenom:    weights['prenom'] = 0.30
    if player.annee_naissance or player.date_naissance:
        weights['annee'] = 0.20
    if player.club:      weights['club']   = 0.10
    if player.equipe or player.categorie:
        weights['equipe'] = 0.05

    # Redistribuer les poids si critères manquants
    total_weight = sum(weights.values())
    weights = {k: v / total_weight for k, v in weights.items()}

    score = 0.0
    if 'nom' in weights:
        score += weights['nom'] * (1.0 if normalize_name(player.nom) == normalize_name(candidate.nom) else 0.0)
    if 'prenom' in weights:
        score += weights['prenom'] * (1.0 if normalize_name(player.prenom) == normalize_name(candidate.prenom) else 0.0)
    if 'annee' in weights:
        py = extract_birth_year(player.date_naissance or str(player.annee_naissance))
        score += weights['annee'] * (1.0 if py and py == candidate.annee_naissance else 0.0)
    if 'club' in weights:
        from fuzzywuzzy import fuzz
        ratio = fuzz.token_set_ratio(normalize_name(player.club or ''), normalize_name(candidate.club or ''))
        score += weights['club'] * (ratio / 100.0)
    # ... etc
    return round(score, 3)
```

### Gestion de l'ambiguïté (AC2)

Si deux candidats ont un score `score_A` et `score_B` avec `|score_A - score_B| < AMBIGUOUS_DELTA (0.10)` → ne pas valider automatiquement → `incertain` avec commentaire `"plusieurs profils possibles"`.

### Pattern cache (AC9)

```python
import hashlib, json, time
from pathlib import Path

def get_cached(self, url: str) -> str:
    key  = hashlib.md5(url.encode()).hexdigest()
    path = Path(self.cache_dir) / f"{key}.json"
    if path.exists():
        data = json.loads(path.read_text())
        if time.time() - data['ts'] < self.config.cache_ttl_hours * 3600:
            return data['content']
    time.sleep(self.config.request_delay_seconds)
    resp = self.session.get(url, timeout=self.config.request_timeout_seconds)
    resp.raise_for_status()
    path.write_text(json.dumps({'ts': time.time(), 'content': resp.text}))
    return resp.text
```

### Sauvegarde partielle (AC8)

Le CSV partiel est écrit toutes les 20 lignes traitées dans `output/partial_{timestamp}.csv`. En mode `--resume`, le script lit ce fichier au démarrage, extrait les `nom+prenom` déjà traités, et les skip dans la boucle principale.

### Stack technique

- **Python 3.11+** (f-strings, dataclasses, pathlib, argparse natifs)
- **requests** : HTTP client + Session + retry adapters
- **beautifulsoup4 + lxml** : parsing HTML
- **pyyaml** : lecture config.yaml
- **unidecode** : normalisation accents
- **fuzzywuzzy + python-Levenshtein** : fuzzy matching noms de clubs
- **rich** : progress bar + logs colorés
- **pytest** : tests unitaires

Ce script est **entièrement standalone**, hors monorepo `aureak/`. Il n'importe rien de `@aureak/*`.

### Référence technique RBFA (depuis story 28-1)

- Endpoint GraphQL : `https://datalake-prod2018.rbfa.be/graphql`
- Channel : `belgianfootball`
- Language : `fr`
- Location : `www.rbfa.be`
- Headers requis : `Content-Type: application/json`, `Origin: https://www.rbfa.be`
- Pas d'authentification requise pour la recherche de clubs (à confirmer pour les joueurs)
- [Source: aureak/packages/api-client/src/admin/rbfa-search.ts]

### Risques & Limites

| Risque | Impact | Mitigation |
|---|---|---|
| RBFA bloque les requêtes automatisées | Bloquant | Délai inter-requêtes + User-Agent réaliste + Playwright si nécessaire |
| Structure HTML RBFA change | Scraper cassé | Sélecteurs CSS documentés dans RBFA_ANALYSIS.md + tests sur fixtures HTML |
| Joueurs homonymes fréquents (ex. "Ben Ahmed") | Faux positifs | Score de similarité strict + règle anti-ambiguïté |
| Joueurs RBFA sans profil public | Données manquantes | Classés `incertain`, commentaire explicite |
| CSV d'entrée mal formaté | Crash | Validation explicite au démarrage avec messages d'erreur clairs |
| Feuilles de match inaccessibles | Données partielles | Classés `incertain` si < 3 matchs analysables |

### Règle fondamentale de prudence

**Mieux vaut un `incertain` qu'un faux positif.** Le script ne supprime aucune donnée — il produit uniquement un CSV enrichi à destination d'une revue manuelle. La décision finale d'import reste humaine.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Task 0 investigation via Chrome DevTools MCP (2026-03-20):
- `numaffil` → 404 confirmed
- GraphQL APQ hashes intercepted from live browser traffic
- `GetMatchDetail` lineup structure confirmed on match 7215541 (A.C. LUSTIN U16, finished)
- GK detection: `"(GK)" in badges` field
- Date format for `clubMatchesAssignations`: YYYY/MM/DD (forward slashes, NOT dashes)

### Completion Notes List

- Task 0 ✅ RBFA investigation complete. Key finding: players NOT searchable → club-based strategy. GK via `badges: "(GK)"` in `GetMatchDetail.lineup`.
- Task 1 ✅ Project structure + config.yaml + requirements.txt + AppConfig dataclass.
- Task 2 ✅ `parse_csv.py` handles Latin-1/UTF-8, M/DD/YY dates, numaffil=0 as None, accent in column name.
- Task 3 ✅ `normalize.py` : normalize_name, extract_birth_year, compute_lineup_match_score. 20 unit tests pass.
- Task 4 ✅ `rbfa_client.py` : Session + cache MD5 + retry + 429 handling.
- Task 5 ✅ `rbfa_search.py` : DoSearch by club name + registrationNumber verification. Padding 5 digits.
- Task 6 ✅ `rbfa_match_sheets.py` : APQ clubMatchesAssignations + GetMatchDetail. No Playwright needed.
- Task 7 ✅ `classifier.py` : AC4 logic exact. 14 unit tests pass.
- Task 8 ✅ `export.py` : CSV UTF-8-sig, partial save every 20, resume support.
- Task 9 ✅ `main.py` : CLI with all modes, club-based bulk fetch, logging, summary.
- Task 10 ✅ README.md + players_example.csv + results_example.csv.
- Tests ✅ 34/34 tests pass (`pytest tests/ -v`).
- Note AC4 correction: `confiance=haute` for `non_gardien` requires `champ >= 5` (text spec), not 4 (example table had inconsistency — test fixed accordingly).
- Code review fixes applied (2026-03-21): H1 `normalize.py` player_year weight removed (simplified to 0.50/0.50); H2 `rbfa_match_sheets.py` substitutes[] now processed alongside lineup[]; M1 `export.py` delimiter=";" added; M2 `rbfa_client.py` _last_request_time updated after 429 retry; M3 `main.py` unused defaultdict import removed; M4 `parse_csv.py` dead prenom fallback code removed.

### File List

- `scripts/gk-detector/RBFA_ANALYSIS.md` — Task 0 findings (APQ hashes, GK detection, date format, matching strategy)
- `scripts/gk-detector/config.yaml` — all configurable parameters
- `scripts/gk-detector/requirements.txt`
- `scripts/gk-detector/README.md`
- `scripts/gk-detector/input/players_example.csv` — 10 example rows
- `scripts/gk-detector/output/results_example.csv` — example output
- `scripts/gk-detector/src/__init__.py`
- `scripts/gk-detector/src/config.py` — AppConfig dataclass
- `scripts/gk-detector/src/parse_csv.py` — PlayerRecord + load_players()
- `scripts/gk-detector/src/normalize.py` — normalize_name, extract_birth_year, scoring
- `scripts/gk-detector/src/rbfa_client.py` — RbfaClient (HTTP + cache + retry)
- `scripts/gk-detector/src/rbfa_search.py` — search_club_rbfa_id() via DoSearch
- `scripts/gk-detector/src/rbfa_match_sheets.py` — clubMatchesAssignations + GetMatchDetail APQ
- `scripts/gk-detector/src/classifier.py` — classify_player() + ClassificationResult
- `scripts/gk-detector/src/export.py` — export_results(), save_partial(), load_partial()
- `scripts/gk-detector/src/main.py` — CLI orchestrator
- `scripts/gk-detector/tests/__init__.py`
- `scripts/gk-detector/tests/test_normalize.py` — 20 unit tests
- `scripts/gk-detector/tests/test_classifier.py` — 14 unit tests (all 6 AC4 cases)
