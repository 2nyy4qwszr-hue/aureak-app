# Story 110.2 : Refonte filtres Séances en popover compact (mobile + desktop)

Status: done

Dépend de : 110.1 (FAB+rename) — non bloquant, mais cohérence visuelle attendue

## Story

En tant qu'**admin**,
je veux **un seul bouton "Filtres" qui ouvre un popover/sheet compact contenant période + implantation + groupe**,
afin de **ne pas perdre la moitié de l'écran mobile à des contrôles avant même de voir une seule séance, et de retrouver le même geste de filtrage que partout ailleurs dans l'app (sheet mobile, popover desktop)**.

## Contexte

Story 108.2 a aligné les filtres `/activites/seances` sur ceux de `/presences` : segmented Jour/Semaine/Mois + select Implantation + select Groupe. Bonne unification, mais l'affichage reste une **barre wrap horizontale** (`flexWrap: 'wrap'`) qui sur mobile (< 640px) prend ~180px de hauteur avant le tableau (segmented sur 1 ligne, puis 2 selects pleine largeur empilés).

L'utilisateur passe 90% du temps à scroller le tableau, pas à reconfigurer ses filtres. Donc :

- **Mobile** : remplacer la barre par 1 seul bouton « Filtres » (avec un badge si filtres actifs ≠ défaut) qui ouvre un `<FilterSheet>` (existant — story 101.2) contenant les 3 contrôles. La barre temporelle Jour/Semaine/Mois peut rester en surface au-dessus du tableau (compacte, 1 ligne) pour conserver le geste rapide « changer de période », OU rentrer dans le sheet — décision à prendre dans la story.
- **Desktop (≥ 640px)** : remplacer la barre par 1 bouton « Filtres » qui ouvre un popover ancré, avec les mêmes 3 contrôles. Période peut rester en segmented externe (cohérent avec dashboard Aureak qui a souvent un sélecteur période en haut).

État actuel : `aureak/apps/web/app/(admin)/activites/seances/page.tsx` lignes 80-123 (3 blocs : timeToggle + 2 selectField wrap).

## Acceptance Criteria

- **AC1 — Bouton « Filtres » remplace la barre mobile** : sur mobile (< 640px), `/activites/seances` n'affiche plus le bloc 3-contrôles wrap. À la place : 1 bouton « Filtres » (icône `lucide-react-native` `SlidersHorizontal` ou équivalent) + le segmented Jour/Semaine/Mois en compacte sur la même ligne. Le bouton « Filtres » ouvre `FilterSheet` (story 101.2 — `aureak/apps/web/components/admin/FilterSheet.tsx` à confirmer chemin) contenant : sélecteurs Implantation + Groupe.
- **AC2 — Bouton « Filtres » remplace la barre desktop** : sur desktop (≥ 640px), même bouton « Filtres » + segmented période visibles, mais le popover s'ancre à droite du bouton (pas un sheet plein écran). Largeur popover ~320px.
- **AC3 — Badge « filtres actifs »** : si `implantationId !== ''` ou `groupId !== ''`, le bouton « Filtres » affiche un dot gold + le compteur (« Filtres · 1 », « Filtres · 2 »). Si tous les filtres sont sur leur valeur défaut (« Toutes » + « Tous »), bouton sans badge.
- **AC4 — Cascade implantation → groupe préservée** : changer l'implantation dans le sheet/popover réinit le groupe (comportement actuel, ligne 66 `useEffect(() => { setGroupId('') }, [implantationId])`). Doit fonctionner que le sheet soit ouvert ou fermé.
- **AC5 — Ferme au clic externe / overlay** : popover desktop ferme au clic externe ; sheet mobile ferme au swipe-down ou clic overlay.
- **AC6 — Pas de fetch dans le sheet** : `listImplantations` et `listAllGroups` continuent d'être appelés au mount de la page (pattern actuel ligne 53-64), pas au open du sheet (latence inacceptable).
- **AC7 — Reset filtres** : un bouton « Réinitialiser » dans le sheet/popover remet `implantationId` et `groupId` à `''`. La période n'est PAS resetée (elle vit en dehors du sheet).
- **AC8 — Tableau réagit en live** : le `<TableauSeances>` re-fetch à chaque changement de filtre (comportement actuel via props `from/to/implantationId/groupId`). Pas de bouton « Appliquer » dans le sheet.
- **AC9 — Cohérence visuelle Présences** : si /presences applique le même pattern dans la story 110.4 (popover/sheet), les 2 pages doivent partager le même composant ou au moins la même API visuelle. Pour cette story 110.2, on encapsule la logique dans `<SeancesFiltersSheet>` (composant local à `components/admin/activites/`) ; la 110.4 pourra le promouvoir en composant partagé si besoin.
- **AC10 — Respect règles Aureak** :
  - `@aureak/api-client` pour fetch (déjà OK)
  - `@aureak/theme` tokens uniquement (`colors`, `space`, `radius`, `fonts`)
  - try/finally sur tout setState de loading dans le sheet (s'il y en a)
  - console guards `NODE_ENV !== 'production'`
  - pas de `Record<UserRole, ...>` impacté (pas de touche RBAC)

## Tasks / Subtasks

### 1. Vérifier composant FilterSheet existant

- [ ] `find aureak/apps/web -name "FilterSheet*" -type f` — confirmer le chemin du composant story 101.2
- [ ] Lire son API (props, callbacks open/close, contenu via children) → noter pour réutilisation
- [ ] Si pas de FilterSheet utilisable → créer `<SeancesFiltersSheet>` ad hoc avec un overlay + sheet bas mobile / popover desktop

### 2. Créer le composant SeancesFilters

- [ ] Nouveau fichier : `aureak/apps/web/components/admin/activites/SeancesFiltersButton.tsx`
  - Props : `{ implantations, groups, implantationId, groupId, onChange: (filters) => void }`
  - Rendu : bouton « Filtres » + badge actif + ouverture popover/sheet selon breakpoint
  - Internes : 2 `<select>` natifs (cohérent avec /presences) ou Tamagui Select (à choisir — natif = simple et robuste mobile, Tamagui = stylé)
  - Bouton « Réinitialiser » en pied de popover

### 3. Intégrer dans page Séances

- [ ] `aureak/apps/web/app/(admin)/activites/seances/page.tsx` :
  - Retirer le bloc lignes 100-122 (selectField Implantation + Groupe)
  - Garder le segmented Jour/Semaine/Mois (lignes 81-98)
  - Ajouter `<SeancesFiltersButton implantations={...} groups={filteredGroups} implantationId={implantationId} groupId={groupId} onChange={({implantationId, groupId}) => { setImplantationId(...); setGroupId(...) }} />` à droite du segmented
  - Adapter les styles `controls` pour aligner segmented + bouton sur 1 ligne

### 4. Cohérence cascade

- [ ] Tester : ouvrir sheet, changer implantation → groupe se reset bien (l'effect ligne 66 doit toujours fonctionner)

### 5. Tests visuels

- [ ] Playwright mobile (390x844) :
  - `/activites/seances` → barre filtres réduite à 1 ligne segmented + bouton Filtres
  - Tap bouton Filtres → sheet bas s'ouvre avec 2 selects + bouton Réinitialiser
  - Sélectionner implantation → groupe se reset → fermer sheet → tableau filtré
- [ ] Playwright desktop (1280x800) :
  - Bouton Filtres → popover ancré ouvre
  - Badge « 2 » visible quand 2 filtres actifs
- [ ] `cd aureak && npx tsc --noEmit`
- [ ] Commit : `feat(epic-110): story 110.2 — filtres séances en popover compact`

## Fichiers touchés

### Créés
- `aureak/apps/web/components/admin/activites/SeancesFiltersButton.tsx`

### Modifiés
- `aureak/apps/web/app/(admin)/activites/seances/page.tsx` (refonte bloc filtres)

### Possiblement utilisés (lecture seule)
- `aureak/apps/web/components/admin/FilterSheet.tsx` (si existe, story 101.2)

## Notes

- Si la décision est « segmented période rentre aussi dans le sheet » : enlever le segmented externe et ajouter dans le sheet. Mon recommendé : segmented externe pour le geste rapide « semaine ↔ mois » (cas d'usage fréquent).
- Le `<select>` natif a l'avantage d'avoir un picker système mobile (UX Apple/Android) — préférer ça à un Tamagui Select custom sauf si design system impose le contraire.
- Aucun changement de business logic / API client — purement UI.
- Si la story 109.2 (composants `@aureak/ui` filtres) sort avant celle-ci, utiliser `<SelectFilter>` du package au lieu de `<select>` natif. Si pas encore sortie, `<select>` natif et la migration se fera dans 109.4 (lot 2).
