# UX Inspector — 2026-04-08

> APP_STATUS=000 — PLAYWRIGHT_STATUS=unavailable.
> Audit réalisé par analyse statique du code source (pages, composants, nav).

## Résumé

- Flux audités : 5
- Frictions HAUTE priorité (P1) : 4
- Frictions MOYENNE priorité (P2) : 5
- Incohérences : 3

---

## Frictions détectées

### [UX - P1] Wizard séance — 6 étapes pour une action quotidienne

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Le wizard de création comprend 6 steps (Contexte → Détails → Thèmes → Ateliers → Date → Résumé). Pour la majorité des séances hebdomadaires répétitives (groupe existant, même coach, même terrain), l'admin doit traverser les 6 étapes même si seule la date change.
**Impact :** ~12-18 clics minimum pour une séance simple. La valeur cible "max 3 clics pour toute action courante" est violée d'un facteur 4 à 6.
**Proposition :** Ajouter un mode "Séance rapide" depuis la liste (groupe + date pré-remplis depuis la dernière séance du groupe) qui saute les étapes 3-4 optionnelles.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

### [UX - P1] Stages non accessible directement depuis la sidebar

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/evenements` → `/stages/[stageId]`
**Friction :** "Stages" n'est pas un item direct dans la sidebar `NAV_GROUPS`. Il est accessible uniquement via "Tous les évènements" (label `/evenements`) qui est une page hub. L'admin doit : cliquer "Évènements" → chercher le stage dans la liste → ouvrir la fiche. Aucun raccourci clavier enregistré pour `/stages`.
**Impact :** 2 clics supplémentaires par rapport à un accès direct. Aucune visibilité du count de stages actifs dans la sidebar.
**Proposition :** Ajouter "Stages" comme sous-item dans la section "Évènements" avec count badge, ou exposer le filtre rapide "Stages" sur la page `/evenements` en vue par défaut.
**Fichier :** `aureak/apps/web/app/(admin)/_layout.tsx` (NAV_GROUPS l.125-128)

---

### [UX - P1] Suppression de blocs dans un stage sans confirmation

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/[stageId]`
**Friction :** Le bouton "Suppr." sur une `BlockCard` et le bouton "Supprimer la journée" appellent directement `handleDeleteBlock` / `handleDeleteDay` sans modale de confirmation. La suppression est irréversible (aucun soft-delete ni undo).
**Impact :** Un clic accidentel détruit un bloc ou une journée entière sans possibilité de récupération.
**Proposition :** Wrapper les deux handlers dans un `ConfirmDialog` identique à celui déjà présent dans `clubs/[clubId]/page.tsx` (pattern déjà disponible dans `@aureak/ui`).
**Fichier :** `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` (l.100-103, l.885)

---

### [UX - P1] État vide "séances" sans CTA sur les vues Mois et Année

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances` (vues month / year)
**Friction :** L'état vide avec CTA "Créer une séance" est conditionné par `period !== 'month' && period !== 'year'` (l.808). Sur les vues Mois et Année, si aucune séance n'existe, rien ne s'affiche — la condition tombe dans MonthView/YearView qui reçoivent un tableau vide sans gestion d'état vide interne.
**Impact :** Un admin sur un tenant neuf ou filtrant une période vide voit un écran blanc sans savoir quoi faire.
**Proposition :** Retirer la condition `period !==` de la page principale pour que l'emptyState s'affiche sur toutes les vues, ou propager un prop `empty` vers MonthView/YearView.
**Fichier :** `aureak/apps/web/app/(admin)/seances/page.tsx` (l.808)

---

### [UX - P2] Création de stage non accessible depuis la fiche stage

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/[stageId]`
**Friction :** La fiche détail d'un stage n'expose pas de lien "Créer un autre stage". Le seul chemin retour est "← Stages" vers la liste, puis il faut re-cliquer "+ Nouveau stage".
**Impact :** 2 clics additionnels pour enchaîner des créations (cas typique lors de la planification de saison).
**Proposition :** Ajouter un bouton secondaire "Nouveau stage" dans la barre header de la fiche détail, à côté du bouton "Exporter PDF" existant (l.708-722).
**Fichier :** `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`

---

### [UX - P2] PlayerPicker limité à 8 résultats sans indicateur de troncature

**Flux concerné :** Flux 3 — Ajouter un joueur à un club
**Page :** `/clubs/[clubId]`
**Friction :** Le `PlayerPicker` filtre `.slice(0, 8)` les résultats. Si l'admin tape un nom partiel et que son joueur est au rang 9+, il ne voit pas le joueur sans être informé que des résultats sont masqués.
**Impact :** L'admin croit que le joueur n'existe pas et peut créer un doublon ou abandonner.
**Proposition :** Afficher "+N autres résultats — affinez la recherche" sous les 8 premiers quand la liste filtrée dépasse 8 entrées.
**Fichier :** `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (PlayerPicker, l.206-212)

---

### [UX - P2] Fiche joueur — onglets nombreux potentiellement tronqués

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/children/[childId]`
**Friction :** La fiche joueur supporte de nombreuses sections via tabs. Sur un écran 13", les onglets peuvent dépasser la largeur sans indicateur de défilement visible (rangée `flexDirection: row` sans `ScrollView horizontal`).
**Impact :** L'admin ne découvre pas certains onglets (Badges, Heatmap) et manque des fonctionnalités pourtant implémentées.
**Proposition :** Utiliser `ScrollView horizontal showsHorizontalScrollIndicator` pour la rangée d'onglets, ou regrouper à 5 onglets max (ex. Évaluations + Badges → "Progression").
**Fichier :** `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (tabs row)

---

### [UX - P2] Champ date "Ajouter une journée" en saisie texte libre YYYY-MM-DD

**Flux concerné :** Flux 4 — Consulter le planning d'un stage
**Page :** `/stages/[stageId]`
**Friction :** Le champ "Ajouter une journée" est un `TextInput` avec placeholder `"YYYY-MM-DD"`. L'admin doit saisir la date manuellement au format ISO, sans aide ni validation en temps réel. Une erreur de format retourne juste "Date déjà existante ou invalide." (message peu actionnable).
**Impact :** Friction cognitive élevée, risque d'erreur de saisie.
**Proposition :** Remplacer par le composant `MiniCalendar` déjà implémenté dans `seances/new.tsx` (réutilisable sans développement nouveau).
**Fichier :** `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` (l.860-890)

---

### [UX - P2] État de chargement initial absent sur la liste joueurs

**Flux concerné :** Flux 2 — Trouver un joueur
**Page :** `/children`
**Friction :** La liste des joueurs n'expose pas d'indicateur visible pendant le fetch initial. `ListRowSkeleton` est disponible dans `@aureak/ui` mais non utilisé dans la liste principale.
**Impact :** L'admin peut croire la page vide si le réseau est lent (1-2 secondes sans feedback visuel).
**Proposition :** Ajouter des `ListRowSkeleton` pendant l'état `loading` dans `children/index.tsx`.
**Fichier :** `aureak/apps/web/app/(admin)/children/index.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance | 12-18 | 90-150s | Wizard 6 étapes, steps Thèmes et Ateliers obligatoires à traverser |
| Trouver un joueur | 3 | 15s | Recherche locale rapide ; loading initial sans skeleton |
| Ajouter joueur à club | 4 | 20s | PlayerPicker limité 8 résultats sans indicateur de troncature |
| Consulter planning stage | 4 | 20s | Stages non accessible directement depuis la sidebar |
| Navigation générale | — | — | Sidebar correcte ; raccourcis clavier absents pour Stages |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/seances` (vue Mois) | État vide + CTA | Admin sur tenant neuf voit écran blanc |
| `/seances` (vue Année) | État vide + CTA | Idem vue Mois |
| `/stages/[stageId]` (ajout journée) | Validation temps réel du format date | Message d'erreur générique et peu actionnable |
| `/children` | Skeleton pendant chargement initial | Perception de lenteur sur réseau moyen |

---

## Incohérences de patterns

1. **Suppression avec confirmation** : présente sur `clubs/[clubId]` (ConfirmDialog) et `children/[childId]` (ConfirmDialog sur blessures et historique) mais absente sur `stages/[stageId]` (blocs et journées supprimés directement).

2. **Champ de date** : `MiniCalendar` visuel dans `seances/new.tsx` vs `TextInput "YYYY-MM-DD"` dans `stages/[stageId]`. Même contexte (saisir une date), deux patterns incompatibles.

3. **État vide avec CTA** : présent sur les vues Jour et Semaine de `/seances`, absent sur les vues Mois et Année du même écran. Le comportement varie selon le même sélecteur de période.

---

## Recommandations prioritaires

1. **[P1] Supprimer blocs/journées stage sans confirmation** — appliquer `ConfirmDialog` existant (correction rapide, pattern déjà disponible dans `@aureak/ui`).
2. **[P1] État vide manquant sur vues Mois/Année** — retirer la condition `period !== 'month' && period !== 'year'` dans `seances/page.tsx` l.808.
3. **[P1] Stages hors sidebar** — ajouter "Stages" comme sous-item de la section "Évènements" dans `_layout.tsx`.
4. **[P2] Remplacer TextInput date dans stage** par `MiniCalendar` (composant déjà disponible, aucun nouveau développement requis).
5. **[P1] Wizard séance — mode rapide** — à planifier : CTA "Répéter la dernière séance" depuis la card session dans MonthView/WeekView.
