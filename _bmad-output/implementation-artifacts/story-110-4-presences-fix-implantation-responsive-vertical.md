# Story 110.4 : Fix Présences — bug clic implantation reset à aujourd'hui + refonte affichage tableau vertical mobile

Status: ready-for-dev

## Story

En tant qu'**admin**,
je veux **pouvoir changer d'implantation sans perdre la période que j'étais en train de regarder, et lire le tableau de présences sans devoir scroller horizontalement sur mobile**,
afin de **comparer rapidement plusieurs implantations sur la même semaine, et exploiter mon téléphone en tenue verticale (90% des cas) sans gymnastique tactile**.

## Contexte

Page `/presences` (`aureak/apps/web/app/(admin)/presences/page.tsx`, 910 lignes) — observations utilisateur :

### Bug 1 : implantation reset à aujourd'hui

Sur la page Présences, sélectionner une implantation dans le `<select>` (ligne 738) reset l'affichage à « aujourd'hui » (`timeView = 'day'` ou range = today). L'admin perd sa vue Semaine/Mois en cours. Comportement attendu : changer l'implantation **conserve** `timeView`, `from`, `to` actuels — seul le filtre implantation change, les sessions affichées sont recomputées sur le même range.

À investiguer : où se trouve le bug ? Hypothèses :
- Un `useEffect` qui dépend de `implantationId` et reset `timeView` indirectement
- Le `setImplantationId` est passé à un composant qui a son propre state range qui se réinitialise
- Conflit avec la cascade groupe (changer impl reset le groupe — ligne ~530, mais pas timeView)

### Bug 2 : affichage tableau vertical mobile force scroll horizontal

Quand l'admin tient son téléphone en vertical (portrait) sur `/presences`, le tableau de présences (probablement la `PresenceCard` ou drawer détaillé) déborde et oblige à scroller horizontalement pour lire toutes les colonnes (joueur, statut, heure, commentaire, etc.).

Solutions à étudier :
- **Option A — Cards mobile** : sur mobile vertical, remplacer le tableau par une stack de cards (1 card = 1 joueur + son statut) — pas de scroll horizontal, lecture top-bottom
- **Option B — Tableau réduit** : afficher uniquement les 2 colonnes essentielles (joueur + statut) sur mobile vertical, masquer les autres derrière un tap sur la row
- **Option C — Vue horizontale forcée** : suggérer à l'admin de tourner son téléphone (rejet — UX dégradée)

→ **Décision recommandée** : Option A (cards) — pattern déjà utilisé sur les listes d'enfants/joueurs Aureak, cohérent avec le design mobile-first.

## Acceptance Criteria

### Bug 1 — implantation conserve la période

- **AC1 — Investigation root cause** : la cause exacte du reset est identifiée et documentée dans le commit message (ex. « bug : effect ligne X reset timeView quand implantationId change »).
- **AC2 — Fix** : changer la valeur du `<select>` Implantation dans `aureak/apps/web/app/(admin)/presences/page.tsx` n'affecte plus `timeView` ni le range `from/to`. Seule la liste des sessions affichées est recomputée selon le nouveau filtre.
- **AC3 — Cascade groupe préservée** : changer implantation reset toujours le groupe (`useEffect(() => { setGroupId('') }, [implantationId])` ou équivalent), comportement attendu et inchangé.
- **AC4 — Test régression** : un test Playwright (ou simple checklist manuelle dans le commit) couvre :
  - timeView = 'week' → changer implantation → timeView toujours 'week'
  - timeView = 'month' → changer implantation → timeView toujours 'month'

### Bug 2 — responsive vertical mobile

- **AC5 — Affichage cards mobile** : sur breakpoint mobile portrait (< 640px de largeur), le tableau de présences est remplacé par une stack verticale de cards. Chaque card affiche : nom joueur, statut (présent/absent/retard avec badge couleur), heure d'arrivée si présent, et un bouton « Détails » si l'admin veut voir plus.
- **AC6 — Pas de scroll horizontal** : à 390px de large (iPhone 12), aucune partie de l'UI Présences ne nécessite un scroll horizontal. Confirmé par Playwright `take_screenshot` puis vérification visuelle.
- **AC7 — Desktop inchangé** : à ≥ 1024px, le tableau classique est conservé (colonnes joueur/statut/heure/commentaire/actions). Pas de régression.
- **AC8 — Tablet (640-1024px)** : choisir un comportement explicite (cards ou tableau) — recommandation : tableau si la largeur le permet (≥ 768px) sinon cards. Documenter dans le code.
- **AC9 — Filtres mobile fonctionnent** : tester explicitement que les filtres (timeView, implantation, groupe) sont accessibles et fonctionnels sur mobile portrait. Si la barre de filtres est trop large mobile, appliquer le pattern popover de la story 110.2 (bouton « Filtres » + sheet).

### Règles Aureak

- **AC10 — Conformité** :
  - Accès Supabase via `@aureak/api-client` uniquement (pas de changement attendu — purement UI)
  - `@aureak/theme` tokens uniquement
  - `try/finally` sur tout `setLoading`/`setSaving` éventuel touché lors du fix
  - console guards `NODE_ENV !== 'production'`

## Tasks / Subtasks

### 1. Investigation Bug 1 (implantation reset)

- [ ] Lire `aureak/apps/web/app/(admin)/presences/page.tsx` en entier (910 lignes — chercher tous les `useEffect` qui dépendent de `implantationId`)
- [ ] Reproduire le bug : Playwright → naviguer `/presences` → setTimeView('week') → changer implantation → vérifier si timeView/range a changé
- [ ] Identifier la cause exacte (effect, setter caché, dérivation)
- [ ] Documenter la cause dans le commit + commentaire JSDoc sur le fix

### 2. Fix Bug 1

- [ ] Appliquer le fix minimal (typiquement : retirer une dépendance d'effect, ou splitter un effect en deux)
- [ ] Garder la cascade `setGroupId('')` quand implantation change (ne pas casser ce comportement attendu)
- [ ] Vérifier qu'aucun autre filtre n'est cassé en chemin

### 3. Refonte affichage mobile (Bug 2)

- [ ] Identifier le composant qui rend le tableau présences (probablement `PresenceCard` lignes ~530+ déjà côté grid, ou `AttendanceDetailDrawer`, ou un sous-composant dédié)
- [ ] Si déjà en cards : vérifier pourquoi scroll horizontal apparaît (largeur min, padding, etc.)
- [ ] Si en tableau : créer un composant `<PresenceCardMobile>` pour le rendu mobile
  - Layout : nom (ligne 1, 14px medium) + statut badge (ligne 2 gauche) + heure (ligne 2 droite) + bouton détails (icône chevron right)
  - Pleine largeur, padding `space.md`, séparateur 1px `colors.border.divider`
- [ ] Dans `presences/page.tsx`, conditionner le rendu : `width < 640 ? <CardsList /> : <Table />`

### 4. Filtres mobile

- [ ] Vérifier que les filtres timeView + implantation + groupe sont visibles et utilisables à 390px
- [ ] Si trop encombrés : appliquer le pattern de la story 110.2 (bouton « Filtres » + sheet)
- [ ] Recommandation : factoriser avec le composant `<SeancesFiltersButton>` créé dans 110.2 si pertinent (les deux pages partagent les mêmes 3 filtres)

### 5. QA

- [ ] Playwright mobile (390x844 portrait) :
  - `/presences` → cards visibles, pas de scroll horizontal
  - Filtres accessibles, changer implantation conserve timeView
- [ ] Playwright desktop (1280x800) :
  - Tableau classique inchangé
- [ ] Lighthouse a11y mobile sur `/presences` : score ≥ 90
- [ ] `cd aureak && npx tsc --noEmit`
- [ ] Commit : `fix(epic-110): story 110.4 — présences implantation préserve période + cards mobile vertical`

## Fichiers touchés

### Modifiés
- `aureak/apps/web/app/(admin)/presences/page.tsx` (fix bug + branchement responsive)

### Possiblement créés
- `aureak/apps/web/components/admin/presences/PresenceCardMobile.tsx` (si pas déjà existant)

### Possiblement réutilisés
- `aureak/apps/web/components/admin/activites/SeancesFiltersButton.tsx` (créé en 110.2) — promu en composant générique `<ActivitesFiltersButton>` si réutilisé ici

## Notes

- Le fichier `presences/page.tsx` est gros (910 lignes) — éviter de le refactoriser dans cette story, focus sur le fix + mobile cards. Refacto = story dédiée future.
- Si l'investigation révèle que le bug 1 vient d'une dépendance d'effect manquante (et non en trop), considérer la solution avec un bool `userInitiated` ou découpler l'état temporel de l'état filtre.
- L'option A (cards) est recommandée mais si l'investigation révèle un design system « tableau condensé mobile » déjà spec dans Aureak, l'utiliser. Sinon → cards.
- Si la story 109.2 (DataTable tokens) est en cours, coordonner pour ne pas dupliquer le composant tableau côté mobile.
