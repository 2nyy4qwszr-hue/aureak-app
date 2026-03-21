# GK Detector — Script de détection automatique des gardiens de but

Script Python standalone qui identifie les gardiens de but dans un fichier CSV de licenciés RBFA
en croisant les données avec les feuilles de match officielles RBFA.

## Contexte

Le CSV d'entrée est un export RBFA provincial (ex: "Membres namur.csv") contenant les licenciés d'une province.
Le script croise ces données avec l'API GraphQL RBFA pour récupérer les compositions de matchs et identifier
quels joueurs sont apparus comme gardien de but (badge `(GK)` dans les feuilles de match officielles).

## Installation

```bash
cd scripts/gk-detector
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Utilisation

```bash
# Mode test (10 premiers joueurs)
python -m src.main --test 10 --input path/to/Membres\ namur.csv

# Mode complet
python -m src.main --full --input path/to/Membres\ namur.csv

# Dry-run (3 joueurs, pas de sortie)
python -m src.main --dry-run --input path/to/Membres\ namur.csv

# Reprendre après interruption
python -m src.main --full --resume output/partial_20260320_143000.csv

# Vider le cache avant de relancer
python -m src.main --full --clear-cache
```

## Format du CSV d'entrée

Séparateur `;`, encodage Latin-1 (typique des exports RBFA).

| Colonne | Obligatoire | Description |
|---|---|---|
| `nom` | Oui | Nom de famille (MAJUSCULES) |
| `prénom` | Oui | Prénom (MAJUSCULES) |
| `matricule` | Recommandé | Matricule du club (ex: `6027` → RBFA `06027`) |
| `club` | Recommandé | Nom du club |
| `datenaiss` | Optionnel | Date naissance `M/DD/YY` |
| `numaffil` | Optionnel | N° affiliation RBFA du joueur (traçabilité) |
| `province` | Optionnel | Province belge |
| `cdesexe` | Optionnel | Sexe H/F |

## Format du CSV de sortie

Fichier `output/results_YYYYMMDD_HHMMSS.csv` :

| Colonne | Description |
|---|---|
| `prenom`, `nom`, `club` | Données d'origine |
| `numaffil` | N° d'affiliation RBFA (traçabilité) |
| `matches_trouves` | Nombre de feuilles de match analysées pour ce club |
| `apparitions_GK` | Fois où le joueur est apparu comme GK |
| `apparitions_champ` | Fois où le joueur est apparu comme joueur de champ |
| `statut_final` | `gardien` / `non_gardien` / `incertain` |
| `confiance` | `haute` / `moyenne` / `faible` |
| `commentaire` | Explication lisible |
| `sources_urls` | URLs des feuilles de match analysées (`;` séparé) |
| `score_matching` | Score de similarité nom (0.0 – 1.0) |

## Logique de classification

```
si apparitions_GK >= 1  →  gardien
  haute  si GK >= 2
  moyenne si GK == 1

si apparitions_GK == 0 ET apparitions_champ >= 3  →  non_gardien
  haute  si champ >= 5
  moyenne si champ 3-4

sinon  →  incertain, faible
```

## Configuration (config.yaml)

```yaml
min_gk_appearances: 1        # Seuil GK
min_champ_for_non_gk: 3      # Seuil non-GK
min_match_score: 0.65        # Score min pour valider un matching nom
max_matches_per_club: 50     # Limite matchs par club
request_delay_seconds: 1.5   # Délai entre requêtes
season_start: "2025/09/01"   # Début de saison
```

## Stratégie technique

1. **Groupement par club** — les joueurs sont groupés par club (via `matricule`)
2. **Résolution RBFA** — `DoSearch` par nom de club → vérifié par `registrationNumber`
3. **Collecte matchs** — `clubMatchesAssignations` APQ → matchs `finished` uniquement
4. **Feuilles de match** — `GetMatchDetail` APQ → `lineup[].badges` contient `"(GK)"`
5. **Matching joueur** — fuzzy name matching (seuil configurable)
6. **Classification** — logique AC4

**Aucun Playwright requis** — l'API GraphQL RBFA est accessible via `requests` standard.

## Tests

```bash
pytest tests/ -v
```

## Cache

Les réponses API sont mises en cache dans `cache/` (par hash MD5 de la requête, TTL 72h).
Pour vider : `python -m src.main --clear-cache`.

## Limites connues

- Les joueurs sans apparition dans les feuilles de match → `incertain`
- Les homonymes dans le même club → ambiguïté détectée, commentaire explicite
- Les clubs non trouvables dans RBFA → `incertain`
- Le `numaffil` n'est pas un identifiant URL sur rbfa.be (404) — traçabilité uniquement
