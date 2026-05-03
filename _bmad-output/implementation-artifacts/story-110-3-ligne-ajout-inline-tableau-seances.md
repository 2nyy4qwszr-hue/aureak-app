# Story 110.3 : Ligne d'ajout inline dans le tableau Séances

Status: done

Dépend de : 110.2 (filtres compactés) — non bloquant, mais le contexte filtré sera prérempli

## Story

En tant qu'**admin**,
je veux **une ligne « + Ajouter une séance » directement dans le tableau Séances, prérempli avec les filtres courants (date dans le range, implantation/groupe sélectionnés)**,
afin de **créer rapidement une séance dans le contexte que je suis en train de regarder, sans devoir cliquer sur un bouton externe puis re-saisir tous les filtres dans le formulaire**.

## Contexte

Aujourd'hui, créer une séance = clic sur le bouton « + Nouvelle séance » (FAB après story 110.1 / desktop header), qui route vers `/activites/seances/new` (formulaire complet vide). L'admin doit re-sélectionner :
- Date (alors qu'il vient de filtrer sur « cette semaine »)
- Implantation (alors qu'il a filtré sur Bruxelles)
- Groupe (alors qu'il a filtré sur U10)

Friction inutile. Une ligne d'ajout inline dans le tableau permet :
- Soit la création directe inline (ligne éditable avec 3-4 champs minimaux : date, heure, type, groupe)
- Soit un raccourci vers `/activites/seances/new?date=YYYY-MM-DD&implantationId=...&groupId=...` qui prérempli le formulaire

**Décision proposée** : option B (raccourci préfilled) — pas d'inline editing dans le tableau (complexe à styler proprement et à valider). Une row « + Ajouter une séance » apparaît en pied de tableau (sticky en bas du tbody, ou simple last row), clic → navigation vers `/activites/seances/new` avec query params.

## Acceptance Criteria

- **AC1 — Row d'ajout en pied de tableau** : sur `/activites/seances`, le composant `<TableauSeances>` affiche une dernière row « + Ajouter une séance » avec une icône `+` à gauche et le label centré ou à gauche, dans le style d'une row de tableau standard mais avec un fond différent (ex. `colors.light.muted`) pour la distinguer.
- **AC2 — Préfill query params** : clic sur la row → `router.push('/activites/seances/new?from=YYYY-MM-DD&to=YYYY-MM-DD&implantationId=xxx&groupId=yyy')`. Les valeurs viennent des props actuelles de `<TableauSeances>` (`from`, `to`, `implantationId`, `groupId`).
- **AC3 — Préfill consommé par new.tsx** : `aureak/apps/web/app/(admin)/activites/seances/new.tsx` lit les query params via `useLocalSearchParams()` (Expo Router) et préremplit les champs correspondants du formulaire au mount. Si un param est absent, le champ reste vide (pas de défaut artificiel).
- **AC4 — Date par défaut intelligente** : si `from` et `to` sont présents et que la période est ≤ 7 jours, le champ « date séance » du form est prérempli avec `from`. Si la période > 7 jours, le champ est laissé vide (l'admin choisira).
- **AC5 — Pas de row d'ajout sur mobile (sous 640px)** : sur mobile, le tableau Séances est rendu en stack de cards (pas un vrai tableau, voir `TableauSeances` rendu mobile). La row d'ajout n'a pas d'équivalent visuel pertinent → on ne l'affiche pas. Le FAB (story 110.1) reste le point d'entrée mobile (et il bénéficiera aussi du préfill query params, voir Tasks).
- **AC6 — FAB préfill aussi** : pour cohérence, le FAB de la story 110.1 sur `/activites/seances` route lui aussi avec les query params actuels du contexte filtré : `router.push(\`/activites/seances/new?from=\${from}&to=\${to}&implantationId=\${implantationId}&groupId=\${groupId}\`)`. Si les params sont vides, route nue `/activites/seances/new`.
- **AC7 — Empty state cohérent** : si le tableau n'a aucune séance dans la période filtrée, la row « + Ajouter une séance » est encore plus visible (pas de tableau « vide » triste — la row d'ajout devient l'invitation naturelle à créer la première séance du range).
- **AC8 — Respect règles Aureak** :
  - Pas de fetch supplémentaire (pure UI + navigation)
  - `@aureak/theme` tokens pour styles
  - try/finally inutile ici (pas de loading state)

## Tasks / Subtasks

### 1. Ajout row dans TableauSeances

- [ ] `aureak/apps/web/components/admin/activites/TableauSeances.tsx` :
  - Ajouter une nouvelle props `onAddSession?: () => void` (optionnelle — si absente, pas de row)
  - Dans le rendu desktop tableau, ajouter une `<Pressable>` styled-row en dernier `<tr>` du `<tbody>` (ou équivalent RN Web), full-width, fond `colors.light.muted`, avec icône `+` + label « Ajouter une séance »
  - Hover desktop : fond `colors.accent.gold` opacity 0.08
  - Pas de rendu mobile (stack cards) — la prop existe mais le composant l'ignore en breakpoint < 640

### 2. Wire dans page Séances

- [ ] `aureak/apps/web/app/(admin)/activites/seances/page.tsx` :
  - Passer `onAddSession={() => router.push(buildNewSessionUrl({ from, to, implantationId, groupId }))}` à `<TableauSeances>`
  - Helper local `buildNewSessionUrl(params)` qui sérialise les params non-vides en query string (`URLSearchParams`)

### 3. Lecture query params dans new.tsx

- [ ] `aureak/apps/web/app/(admin)/activites/seances/new.tsx` :
  - Importer `useLocalSearchParams` d'Expo Router
  - Au mount, lire `{ from, to, implantationId, groupId }`
  - Si `implantationId` présent → présélectionner dans le sélecteur du form
  - Si `groupId` présent → présélectionner (et déclencher le fetch en cascade selon implantation)
  - Si `from` présent et range ≤ 7j → présélectionner date séance = `from`

### 4. Préfill FAB

- [ ] Mettre à jour la story 110.1 (commentaire dans le code, pas la story md) si l'implémentation de 110.1 est déjà partie : changer le `router.push('/activites/seances/new')` en URL préfilled. Sinon, à intégrer directement dans 110.1.

### 5. QA

- [ ] Test mobile : pas de row d'ajout dans le tableau (stack cards), FAB reste accessible
- [ ] Test desktop : row d'ajout visible en bas, hover OK, clic → URL avec query params, formulaire `new` se prérempli
- [ ] `cd aureak && npx tsc --noEmit`
- [ ] Commit : `feat(epic-110): story 110.3 — ligne ajout inline tableau séances + préfill new`

## Fichiers touchés

### Modifiés
- `aureak/apps/web/components/admin/activites/TableauSeances.tsx` (prop + rendu row)
- `aureak/apps/web/app/(admin)/activites/seances/page.tsx` (wire props + helper URL)
- `aureak/apps/web/app/(admin)/activites/seances/new.tsx` (lecture query params + préfill)

## Notes

- Le helper `buildNewSessionUrl` est trivial mais centralisé — peut être placé dans `aureak/apps/web/lib/admin/seances/utils.ts` (déjà existant après 108.2).
- Si `new.tsx` utilise un wizard multi-steps, le préfill se fait sur le step 1. Les autres steps restent vides.
- Pas d'AC sur la création inline directe (option A décrite dans le contexte) — c'est trop de scope pour cette story. Si l'admin demande plus tard, créer une story 110.3.b.
