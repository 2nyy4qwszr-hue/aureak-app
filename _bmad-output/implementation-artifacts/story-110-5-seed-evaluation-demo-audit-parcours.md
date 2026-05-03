# Story 110.5 : Seed évaluation démo + audit parcours création évaluation

Status: done

Dépend de : 110.1 (FAB Évaluations posé) — la décision de routing du FAB est prise ici

## Story

En tant qu'**admin**,
je veux **avoir au moins 1 évaluation visible dans `/activites/evaluations` pour valider l'UI complète, et savoir où me mène le bouton "+ Nouvelle évaluation" du FAB de la story 110.1**,
afin de **ne plus tomber sur un empty state systématique en démo, et avoir un parcours de création évaluation cohérent côté admin (ou la confirmation explicite que la création n'existe pas côté admin et passe par le coach app)**.

## Contexte

État actuel `/activites/evaluations` (`aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`) :

- Affiche un tableau d'évaluations transversal (toutes les évals de tous les coaches sur la période)
- Données viennent de `listEvaluationsAdmin(from, to)` (`@aureak/api-client`)
- 3 sous-onglets : Badges (actif), Connaissances (placeholder), Compétences (placeholder)
- L'admin n'a **aucun bouton de création** sur la page (la story 65-3 a posé une vue transversale lecture-seule)

La création d'évaluation se fait normalement depuis le **coach app** (un coach évalue ses joueurs après une séance). L'admin ne crée pas d'évaluations lui-même dans le modèle métier actuel.

→ **Conséquence** : la story 110.1 ajoute un FAB « Nouvelle évaluation » sur `/activites/evaluations`. Que doit-il faire ?

**Décision à prendre dans cette story 110.5** :

- **Option A — Pas de FAB** : revenir sur la décision de la 110.1, retirer le FAB sur l'onglet Évaluations (pattern vue transversale lecture-seule). Cohérence visuelle perdue mais cohérence métier respectée.
- **Option B — FAB route vers parcours admin de saisie évaluation** : créer une route admin `/activites/evaluations/new` qui permet à l'admin de saisir manuellement une évaluation (ex. compenser un coach absent, corriger une éval erronée). Hors scope métier actuel mais utile.
- **Option C — FAB route vers la sélection de séance** : le FAB ouvre un sheet « Quelle séance évaluer ? », l'admin choisit, redirige vers le parcours coach embedded.

→ **Recommandation** : Option A pour cette story. Cohérence métier > cohérence visuelle stricte. Si l'utilisateur insiste pour un FAB, créer une story 110.5.b avec l'option B ou C.

Par ailleurs, pour pouvoir valider visuellement la page, il faut **seed au moins 1-2 évaluations** dans la DB de dev. Le seed se fait via une migration `00XXX_seed_demo_evaluations.sql` qui insère quelques rows dans `evaluations` (ou la table équivalente — à confirmer dans les types).

## Acceptance Criteria

### Audit parcours

- **AC1 — Décision FAB documentée** : la décision finale (Option A / B / C) est documentée dans le commit + dans une note ADR rapide (`_bmad-output/planning-artifacts/adr/ADR-XXX-fab-evaluation-admin.md` si nécessaire). Recommandation par défaut : Option A.
- **AC2 — Si Option A appliquée** : la story 110.1 est mise à jour (commentaire dans le code + note dans le fichier story 110.1) pour retirer le FAB sur Évaluations. La cohérence visuelle est expliquée à l'admin via une note inline « La création d'évaluation se fait depuis l'app Coach » sur l'empty state.
- **AC3 — Si Option B/C appliquée** : la route + parcours sont créés et le FAB pointe correctement.

### Seed démo

- **AC4 — Migration de seed dev-only** : nouvelle migration `supabase/migrations/00XXX_seed_demo_evaluations.sql` qui :
  - Insère 3-5 évaluations sur des séances et joueurs existants (joindre via subqueries — pas d'IDs en dur)
  - Couvre les 3 signaux : positive, attention, none
  - Couvre 2-3 dates différentes dans les 30 derniers jours pour faire fonctionner le tableau + stats
  - Est marquée `-- DEMO SEED — à exclure en prod via condition` (idempotente : `INSERT ... ON CONFLICT DO NOTHING` ou `WHERE NOT EXISTS`)
- **AC5 — Reset-safe** : la migration peut tourner plusieurs fois sans dupliquer (idempotente).
- **AC6 — Pas en prod** : la migration contient un guard sur l'env (ex. `WHERE current_setting('app.environment', true) IS DISTINCT FROM 'production'`) OU est numérotée dans une plage spéciale `99XXX_seed_*` qui sera ignorée en prod (pattern à confirmer avec Aureak — voir Notes).
- **AC7 — Évaluations visibles UI** : après application de la migration, ouvrir `/activites/evaluations` affiche le tableau peuplé, les 4 stat cards ont des valeurs > 0, et un PlayerSummaryCard apparaît si on filtre sur un joueur précis.

### Règles Aureak

- **AC8 — Conformité** :
  - Migration dans `supabase/migrations/` (racine, PAS `aureak/supabase/`)
  - Numérotation séquentielle : vérifier `ls supabase/migrations/ | tail -3`
  - Format : `NNNNN_seed_demo_evaluations.sql`
  - Pas de modification d'`@aureak/api-client` (la fonction `listEvaluationsAdmin` existe déjà)
  - Pas de modification UI sauf petit ajustement empty state (AC2)

## Tasks / Subtasks

### 1. Audit décision FAB

- [ ] Lire le fichier story 110.1 (FAB Évaluations) — décider Option A/B/C
- [ ] Ouvrir une discussion avec le PO (utilisateur) si Option A → confirmer qu'il accepte la perte de cohérence visuelle
- [ ] **Hypothèse par défaut** : Option A retenue, FAB retiré sur Évaluations

### 2. Mise à jour de la story 110.1 (si Option A)

- [ ] Éditer `story-110-1-fab-unifie-rename-activites-back-nav-mobile.md` :
  - Modifier AC4 : « Pas de FAB sur Évaluations — page transversale lecture-seule »
  - Modifier Tasks/4 : retirer l'ajout du FAB sur Évaluations
- [ ] Si cette story 110.5 est implémentée AVANT 110.1, la 110.1 sera ajustée à l'implémentation. Si APRÈS, le code de 110.1 est à modifier (retirer le FAB).

### 3. Migration seed

- [ ] `ls supabase/migrations/ | tail -3` → identifier le prochain numéro
- [ ] Créer `supabase/migrations/00XXX_seed_demo_evaluations.sql` :
  - Header : `-- DEMO SEED — évaluations de démonstration pour QA UI (story 110.5)`
  - Sélectionner 3-5 sessions existantes (si aucune n'existe, prévoir un seed cascade ou tout simplement abort gracefully via `WHERE EXISTS`)
  - Insérer évaluations avec coach_id réel, child_id réel, signaux variés
  - Idempotent
- [ ] Tester localement : `supabase db reset` puis `supabase db push` → ouvrir `/activites/evaluations` → vérifier rows visibles

### 4. Empty state amélioré (si Option A)

- [ ] `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` ligne ~391-396 (`emptyRow`) :
  - Ajouter sous le texte « Aucune évaluation sur cette période. » une ligne secondaire : « Les évaluations sont saisies depuis l'app Coach après chaque séance. »
- [ ] Cohérent avec décision Option A

### 5. QA

- [ ] Playwright `/activites/evaluations` : tableau peuplé, stats > 0
- [ ] Pas de FAB (Option A) ou FAB fonctionnel (Option B/C) selon décision
- [ ] `cd aureak && npx tsc --noEmit`
- [ ] Commit : `feat(epic-110): story 110.5 — seed démo évaluations + décision FAB option [A|B|C]`

## Fichiers touchés

### Créés
- `supabase/migrations/00XXX_seed_demo_evaluations.sql`
- `_bmad-output/planning-artifacts/adr/ADR-XXX-fab-evaluation-admin.md` (optionnel si décision documentée dans le commit suffit)

### Modifiés (si Option A)
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (empty state texte)
- `_bmad-output/implementation-artifacts/story-110-1-fab-unifie-rename-activites-back-nav-mobile.md` (AC4 ajusté)

## Notes

- **Pattern seed dev** : Aureak n'a pas (à ma connaissance) de mécanique de seed dev-only formalisée. Vérifier si une convention existe (`migrations/9XXXX_*` réservé dev ?) ou si un script `scripts/seed-demo.sql` est utilisé. Si pas de pattern, créer la migration normalement avec un guard explicite sur l'env Supabase.
- Si l'utilisateur confirme l'Option B (parcours admin de saisie éval), prévoir une story 110.5.b dédiée avec architecture (formulaire + API client `createEvaluationAdmin` + permission RLS — non triviale).
- Le seed peut tourner via une fonction edge plutôt qu'une migration si la convention Aureak le préfère. À discuter.
- L'empty state avec « Les évaluations sont saisies depuis l'app Coach » est aussi utile en prod (pas que pour la démo) — donc même si on n'applique pas le seed en prod, l'UI gagne en clarté.
