# Story 81.2 — Méthodologie : uniformisation des pages restantes (programmes, thèmes, situations, évaluations)

Status: cancelled

<!--
  ANNULÉE le 2026-04-21 — décision produit : ne pas créer de MethodologieHeader
  intermédiaire (style 80-1). Les 5 pages Méthodologie seront migrées directement
  vers le template Epic 93 (AdminPageHeader + subtabs with counts + StatsHero)
  via une nouvelle story dédiée. Passer par 81-2 créerait un double refactor
  (80-1 style → puis 93 style) sans valeur ajoutée.
-->


<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 81 — Méthodologie : uniformisation LayoutActivités (réouvert depuis `done` — 81-1 n'a traité que `seances`)
- **Story ID** : 81.2
- **Story key** : `81-2-methodologie-uniformisation-pages-restantes`
- **Priorité** : P1 (dette UX / cohérence visuelle)
- **Dépendances** : **Story 81.1 done** (`seances` uniformisée, pattern validé). Pattern source : `ActivitesHeader.tsx` (Epic 80 done).
- **Source** : demande produit — "Je veux que toutes les pages reprennent notre template" (le template = pattern headerBlock gold d'Activités). Seances Méthodologie déjà faite en 81-1. Reste **4 pages** : programmes, thèmes, situations, évaluations. + sanity-check rapide des 3 pages Activités (déjà conformes en principe).
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **M** (1 composant créé `MethodologieHeader.tsx` + 4 pages refactorées + 1 audit `seances` (déjà done) + 3 audits Activités, 0 migration, 0 nouvelle API, zéro risque régression fonctionnelle)

## Pourquoi rouvrir Epic 81 qui était `done`

Epic 81 a été marqué `done` après la seule story 81-1 (qui a traité `/methodologie/seances`). Les 4 autres pages Méthodologie (programmes, thèmes, situations, évaluations) **n'ont jamais été uniformisées** — elles dupliquent encore chacune un `NAV_TABS` inline + un `headerBlock` JSX + les styles associés (~60 lignes × 4 = ~240 lignes dupliquées au total). Cette dette invalide le sens même du "done" d'Epic 81.

Action : passer Epic 81 de `done` à `in-progress`, ajouter cette story 81-2, remettre `done` quand les 4 pages restantes seront alignées.

## Story

As an admin,
I want all Méthodologie pages (Programmes, Thèmes, Situations, Évaluations) — en plus de `seances` déjà traitée — to use the **exact same** header/NavBar template as Activités (Séances, Présences, Évaluations), through a shared `MethodologieHeader` component — and I want the 3 Activités pages + Méthodologie `seances` audited for strict alignment to this template,
so that la navigation intra-hub soit **identique pixel-près** entre les deux sections, que le design system reste la seule source de vérité pour ce template partagé (changement centralisé), et que les ~60 lignes de JSX+styles dupliquées sur chaque page Méthodologie disparaissent (~240 lignes au total à supprimer sur les 4 pages restantes).

## Acceptance Criteria

1. **Nouveau composant `MethodologieHeader`** — mirror exact de `ActivitesHeader.tsx` (story 80.1) :
   - Localisation : `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`.
   - Titre affiché : `"MÉTHODOLOGIE"` (Montserrat 700 24px letterSpacing 0.5 — identique `ActivitesHeader`).
   - 5 onglets horizontaux : `ENTRAÎNEMENTS | PROGRAMMES | THÈMES | SITUATIONS | ÉVALUATIONS`.
   - Routes associées :
     - `/methodologie/seances`     → `ENTRAÎNEMENTS`
     - `/methodologie/programmes`  → `PROGRAMMES`
     - `/methodologie/themes`      → `THÈMES`
     - `/methodologie/situations`  → `SITUATIONS`
     - `/methodologie/evaluations` → `ÉVALUATIONS`
   - Détection onglet actif via `usePathname()` + `pathname.endsWith('/seances') / '/programmes' / ...` (pattern copié 1:1 de `getActiveTab` dans `ActivitesHeader.tsx` lignes 18-22).
   - Style actif : `color: colors.accent.gold` + underline 2px `colors.accent.gold` (mêmes tokens, mêmes valeurs).
   - Style inactif : `color: colors.text.subtle`, font-weight 700, letterSpacing 1, fontSize 11 uppercase.
   - Fond : `colors.light.primary` (cohérent avec la page), bordure basse onglets `colors.border.divider`.

2. **Props `MethodologieHeader`** — le bouton "+ Nouveau X" diffère par page :
   ```typescript
   type MethodologieHeaderProps = {
     newLabel: string   // ex: "+ Nouvel entraînement" | "+ Nouveau programme" | "+ Nouveau thème" | "+ Nouvelle situation" | "+ Nouvelle évaluation"
     newHref : string   // route vers le formulaire de création (ex: "/methodologie/seances/new")
     /** Si true → bouton masqué (utile si route /new absente sur une page) */
     hideNewButton?: boolean
   }
   ```
   - Le bouton conserve le style gold de `ActivitesHeader` : `backgroundColor: colors.accent.gold`, label `colors.text.dark` 13px 700.
   - Si `hideNewButton` true → le `<Pressable>` du bouton n'est pas rendu ; les onglets s'alignent alors à gauche.

3. **Audit + migration optionnelle page `/methodologie/seances`** (`index.tsx`) — **story 81-1 l'a déjà uniformisée** :
   - Vérifier que `/methodologie/seances` utilise déjà `MethodologieHeader` (si le composant a été créé en 81-1) ou un équivalent local.
   - Si 81-1 a laissé un bloc `headerBlock` + `NAV_TABS` local dupliqué (sans promotion en composant partagé), **migrer** vers le nouveau `MethodologieHeader` de cette story.
   - Si 81-1 a déjà promu en composant partagé → conserver tel quel, mise à jour uniquement si la signature props a besoin d'évoluer.
   - Consigner la décision dans Completion Notes.

4. **Refonte page `/methodologie/programmes`** (`index.tsx`) — **supprimer la duplication** :
   - **Supprimer** : l'array local `NAV_TABS` (lignes ~25-31), le bloc `headerBlock` JSX avec `headerTopRow` + `tabsRow`, les styles CSS associés (`headerBlock, headerTopRow, pageTitle, newBtn, newBtnLabel, tabsRow, tabItem, tabLabel, tabLabelActive, tabUnderline`).
   - **Ajouter** : `import { MethodologieHeader } from '../_components/MethodologieHeader'` + rendu `<MethodologieHeader newLabel="+ Nouveau programme" newHref="/methodologie/programmes/new" />` en remplacement du bloc header.
   - Le reste de la page (contenu : stat cards méthodes, filtres, tableau) reste **strictement inchangé**.
   - Gain attendu : ~60 lignes supprimées (JSX + styles).
   - Supprimer NAV_TABS local + bloc header + styles dupliqués.
   - Remplacer par `<MethodologieHeader newLabel="+ Nouveau programme" newHref="/methodologie/programmes/new" />`.
   - Contenu central inchangé.

5. **Refonte page `/methodologie/themes`** (`index.tsx`) — même refactor :
   - Supprimer NAV_TABS + bloc header + styles.
   - Remplacer par `<MethodologieHeader newLabel="+ Nouveau thème" newHref="/methodologie/themes/new" />`.
   - **Vérifier** : si la route `/methodologie/themes/new` n'existe pas → passer `hideNewButton={true}` + commentaire TODO inline. Sinon, router.push au bouton fonctionne tel quel.

6. **Refonte page `/methodologie/situations`** (`page.tsx` + `index.tsx` re-export) — même refactor :
   - Le fichier contenu est `page.tsx` (pas `index.tsx`). `index.tsx` est un simple `export { default } from './page'`.
   - Modifications appliquées dans `page.tsx`.
   - Remplacer par `<MethodologieHeader newLabel="+ Nouvelle situation" newHref="/methodologie/situations/new" />`.
   - Si route absente → `hideNewButton={true}`.

7. **Refonte page `/methodologie/evaluations`** (`page.tsx` + `index.tsx` re-export) :
   - Modifications dans `page.tsx`.
   - Remplacer par `<MethodologieHeader newLabel="+ Nouvelle évaluation" newHref="/methodologie/evaluations/new" />`.
   - Si route absente → `hideNewButton={true}`.

8. **Audit des 3 pages Activités** — confirmation que le template est strictement appliqué :
   - `/activites` (`page.tsx`) : import + usage de `<ActivitesHeader />` ✅ **déjà en place** (vérifié). Aucun changement attendu.
   - `/activites/presences` (`page.tsx`) : import + usage de `<ActivitesHeader />` ✅ **déjà en place**. Aucun changement.
   - `/activites/evaluations` (`page.tsx`) : import + usage de `<ActivitesHeader />` ✅ **déjà en place**. Aucun changement.
   - **Action** : vérifier via grep que chacune de ces 3 pages **n'a pas** de `headerBlock`/`pageTitle` JSX en plus de l'appel `<ActivitesHeader />` (doublon) → si oui, le supprimer.
   - **Action** : vérifier qu'aucune de ces 3 pages ne déclare localement un `NAV_TABS` orphelin → si oui, le supprimer.
   - Conclusion de l'audit consignée dans les Completion Notes avec les commandes grep utilisées et leurs résultats.

9. **Styles supprimés — cohérence** :
   - Les tokens utilisés par `MethodologieHeader` sont **exclusivement** : `colors.accent.gold`, `colors.text.dark`, `colors.text.subtle`, `colors.light.primary`, `colors.border.divider`, `space.lg`, `space.md`, `fonts.display`.
   - Pas de hex hardcodé, pas de valeurs magiques hors tokens (sauf `24px`, `13px`, `11px`, `2px`, `1` letterSpacing, `0.5` letterSpacing — valeurs typographiques identiques à `ActivitesHeader` pour garantir le mirror).
   - Grep post-refactor : `grep -rn "'#[0-9a-fA-F]" aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` → 0 match.

10. **Tests visuels Playwright** :
    - Naviguer `/methodologie/seances` → header titre "MÉTHODOLOGIE", bouton gold "+ Nouvel entraînement", onglet ENTRAÎNEMENTS actif (underline gold), 4 autres inactifs (subtle). Screenshot.
    - Naviguer `/methodologie/programmes` → onglet PROGRAMMES actif, bouton "+ Nouveau programme". Screenshot.
    - Naviguer `/methodologie/themes` → onglet THÈMES actif, bouton "+ Nouveau thème" (ou masqué si route absente). Screenshot.
    - Naviguer `/methodologie/situations` → onglet SITUATIONS actif, bouton "+ Nouvelle situation" (ou masqué). Screenshot.
    - Naviguer `/methodologie/evaluations` → onglet ÉVALUATIONS actif, bouton "+ Nouvelle évaluation" (ou masqué). Screenshot.
    - Cross-check pixel : overlay ou comparaison manuelle avec `/activites` → même hauteur header, mêmes paddings, même typographie. Différence acceptable uniquement sur le titre ("MÉTHODOLOGIE" vs "ACTIVITÉS") et les labels d'onglets.
    - Clic sur un onglet → navigation vers la route attendue, sans rechargement complet (expo-router client-side), sans flash visuel.
    - Console JS : **zéro erreur** sur les 5 pages Méthodologie + sur les 3 pages Activités (audit).

11. **Qualité & conformité CLAUDE.md** :
    - Aucun state setter nouveau dans `MethodologieHeader` (composant stateless sauf `usePathname`) → pas de try/finally.
    - Pas de `console.*` dans `MethodologieHeader` → pas de guard nécessaire.
    - Styles via tokens `@aureak/theme` uniquement.
    - Pas d'accès Supabase (composant purement visuel/nav).
    - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

12. **Non-régression fonctionnelle** :
    - Sur chaque page Méthodologie refactorée : le comportement métier reste inchangé — le scope de la story est strictement UI/structure.
    - Les listes, filtres, tableaux, modales, CRUD continuent de fonctionner à l'identique.
    - La pagination / défilement vertical n'est pas affecté.
    - Aucun hook `useState`/`useEffect` existant n'est déplacé ou réécrit.

## Tasks / Subtasks

- [ ] **Task 1 — Création de `MethodologieHeader.tsx`** (AC: #1, #2, #9)
  - [ ] Créer `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`.
  - [ ] Copier la structure de `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` comme base.
  - [ ] Adapter :
    - Renommer la fonction exportée en `MethodologieHeader`.
    - Remplacer `TABS` (3 entrées Activités) par les 5 entrées Méthodologie (AC #1).
    - Remplacer `getActiveTab` pour les 5 endings `/seances | /programmes | /themes | /situations | /evaluations`.
    - Remplacer le titre `"ACTIVITÉS"` par `"MÉTHODOLOGIE"`.
    - Remplacer le bouton hardcodé "+ Nouvelle séance" par `{!hideNewButton && <Pressable onPress={() => router.push(newHref)}><AureakText>{newLabel}</AureakText></Pressable>}`.
  - [ ] Signature du composant : `function MethodologieHeader({ newLabel, newHref, hideNewButton }: MethodologieHeaderProps)`.
  - [ ] **Ne pas** importer les styles d'`ActivitesHeader` — définir localement un `StyleSheet.create` (copie 1:1 des styles `ActivitesHeader` hors titre et onglets-labels). Raison : encapsulation (une modification future sur l'un ne doit pas casser l'autre).
  - [ ] Exporter le composant par défaut nommé **et** comme export nommé (pour flexibilité d'import).

- [ ] **Task 2 — Audit + éventuelle migration `/methodologie/seances/index.tsx`** (AC: #3)
  - [ ] Lire le fichier en entier : vérifier l'état réel post-81-1.
  - [ ] **Cas A** — le fichier utilise déjà un composant partagé type `MethodologieHeader` → aligner sur la signature du nouveau composant (AC #2) si nécessaire, sinon laisser intact.
  - [ ] **Cas B** — le fichier contient un bloc headerBlock local + NAV_TABS dupliqué (81-1 n'a pas factorisé) → appliquer la même procédure que Tasks 3-6 : supprimer les duplications, importer `MethodologieHeader`, remplacer par `<MethodologieHeader newLabel="+ Nouvel entraînement" newHref="/methodologie/seances/new" />`.
  - [ ] Consigner dans Completion Notes quel cas a été rencontré.

- [ ] **Task 3 — Refonte `/methodologie/programmes/index.tsx`** (AC: #4)
  - [ ] Lire le fichier en entier avant modifications.
  - [ ] Supprimer l'array `NAV_TABS` local (lignes ~25-31).
  - [ ] Dans le JSX, remplacer le bloc `<View style={st.headerBlock}>...</View>` par `<MethodologieHeader newLabel="+ Nouveau programme" newHref="/methodologie/programmes/new" />`.
  - [ ] Dans le `StyleSheet.create`, supprimer les clés dupliquées : `headerBlock, headerTopRow, pageTitle, newBtn, newBtnLabel, tabsRow, tabItem, tabLabel, tabLabelActive, tabUnderline`.
  - [ ] Ajouter l'import : `import { MethodologieHeader } from '../_components/MethodologieHeader'`.
  - [ ] Vérifier visuellement : le rendu doit être identique avant/après (titre, onglet actif, bouton, couleurs).

- [ ] **Task 4 — Refonte `/methodologie/themes/index.tsx`** (AC: #5)
  - [ ] Même procédure. `newLabel="+ Nouveau thème"`, `newHref="/methodologie/themes/new"`.
  - [ ] **Vérifier** si la route `/methodologie/themes/new/index.tsx` existe → si non, passer `hideNewButton={true}` avec commentaire `// TODO: créer route /methodologie/themes/new (hors scope 80-2)`.

- [ ] **Task 5 — Refonte `/methodologie/situations/page.tsx`** (AC: #6)
  - [ ] Le fichier `index.tsx` (1 ligne : `export { default } from './page'`) reste inchangé.
  - [ ] Modifications appliquées dans `page.tsx`.
  - [ ] `newLabel="+ Nouvelle situation"`, `newHref="/methodologie/situations/new"`, `hideNewButton` si route absente.

- [ ] **Task 6 — Refonte `/methodologie/evaluations/page.tsx`** (AC: #7)
  - [ ] Même procédure que Task 5, dans `page.tsx`.
  - [ ] `newLabel="+ Nouvelle évaluation"`, `newHref="/methodologie/evaluations/new"`, `hideNewButton` si route absente.

- [ ] **Task 7 — Audit des 3 pages Activités** (AC: #8)
  - [ ] Grep pour vérifier l'absence de duplications résiduelles :
    ```bash
    grep -n "pageTitle\|headerBlock" aureak/apps/web/app/(admin)/activites/page.tsx \
                                       aureak/apps/web/app/(admin)/activites/presences/page.tsx \
                                       aureak/apps/web/app/(admin)/activites/evaluations/page.tsx \
                                       | grep -v "//.*"
    ```
    → résultat attendu : aucun bloc styles `pageTitle`/`headerBlock` résiduel (seul `ActivitesHeader.tsx` doit les contenir).
  - [ ] Grep `NAV_TABS` sur les 3 pages Activités → 0 match (le composant centralise les tabs).
  - [ ] Si un doublon est trouvé → le supprimer dans la même PR et documenter dans Completion Notes.
  - [ ] Consigner les résultats des 2 greps dans Completion Notes.

- [ ] **Task 8 — Vérification des routes de création `/new`** (AC: #5, #6, #7)
  - [ ] Pour chaque route candidate, vérifier l'existence :
    ```bash
    ls aureak/apps/web/app/(admin)/methodologie/seances/new/ 2>/dev/null
    ls aureak/apps/web/app/(admin)/methodologie/programmes/new/ 2>/dev/null
    ls aureak/apps/web/app/(admin)/methodologie/themes/new/ 2>/dev/null
    ls aureak/apps/web/app/(admin)/methodologie/situations/new/ 2>/dev/null
    ls aureak/apps/web/app/(admin)/methodologie/evaluations/new/ 2>/dev/null
    ```
  - [ ] Pour chaque route absente, utiliser `hideNewButton={true}` dans le composant consommateur (Tasks 2-6) + ajouter un commentaire TODO inline dans la page appelante.
  - [ ] Ne **pas** créer les routes `/new` manquantes dans cette story (scope creep — laisser pour stories dédiées).

- [ ] **Task 9 — QA & conformité** (AC: #11)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `#[0-9a-fA-F]` dans `MethodologieHeader.tsx` → 0 match (tokens only).
  - [ ] Grep `NAV_TABS` sur toutes les pages Méthodologie **après** refactor → 0 match (tout est dans le composant).
    ```bash
    grep -rn "NAV_TABS" aureak/apps/web/app/(admin)/methodologie/
    ```
    Attendu : 0 résultat (ou uniquement à l'intérieur de `MethodologieHeader.tsx` si local à ce composant — à ajuster).
  - [ ] Grep `pageTitle\|headerBlock\|tabUnderline` dans les 5 `index.tsx`/`page.tsx` Méthodologie **après** refactor → 0 match côté pages (tout est dans le composant).

- [ ] **Task 10 — Tests Playwright manuels** (AC: #10, #12)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] Naviguer les 5 pages Méthodologie séquentiellement → screenshots.
  - [ ] Comparer visuellement avec les 3 pages Activités (même hauteur header, mêmes paddings, mêmes couleurs).
  - [ ] Tester un click onglet sur chaque page Méthodologie → vérifier route de destination correcte.
  - [ ] Tester un click sur bouton "+ Nouveau X" → vérifier qu'il ouvre la route `/new` attendue (ou ne fait rien si masqué).
  - [ ] Console JS = zéro erreur sur les 5 pages Méthodologie + 3 pages Activités.

## Dev Notes

### Le "template" identifié — pattern canonique

`ActivitesHeader.tsx` (Story 80.1) définit le pattern canonique `headerBlock` :
```
┌──────────────────────────────────────────────────────────────┐
│  [TITRE SECTION]                          [+ Nouveau X] gold │  <- headerTopRow
├──────────────────────────────────────────────────────────────┤
│  [TAB1] [TAB2] [TAB3] ...                                    │  <- tabsRow avec underline gold sur l'actif
└──────────────────────────────────────────────────────────────┘
```
Styles canoniques (à ne pas modifier sans raison forte) :
- Titre : `fontSize: 24, fontWeight: '700', fontFamily: fonts.display, letterSpacing: 0.5, color: colors.text.dark`.
- Bouton : `backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8`, label `color: colors.text.dark, fontWeight: '700', fontSize: 13`.
- Onglets : `fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.text.subtle` (inactif) / `colors.accent.gold` (actif), `textTransform: 'uppercase'`.
- Underline : `height: 2, backgroundColor: colors.accent.gold, borderRadius: 1`.

`MethodologieHeader` **doit reproduire ces valeurs à l'identique** — c'est la définition même de "uniformisation".

### Pourquoi 2 composants distincts (`ActivitesHeader` + `MethodologieHeader`) au lieu d'un seul `SectionHeader` générique ?

**Option générique rejetée** pour cette story :
```typescript
<SectionHeader title="MÉTHODOLOGIE" tabs={...} newLabel="..." newHref="..." />
```
- Trop de props → accepte trop de variations → perd la discipline du template (demain, quelqu'un passe un titre custom avec emojis, casse la cohérence).
- Risque : un changement d'implémentation du composant générique casse les 2 sections en cascade sans qu'on s'en rende compte.
- La duplication contrôlée (2 composants presque identiques) **sert la règle "1 template visuel unique"** : si on modifie le header d'Activités, on modifie aussi celui de Méthodologie explicitement, pas implicitement.

**Si dans 3 mois 3+ sections utilisent le même pattern** → refactorer vers un `SectionHeader` générique devient raisonnable. **Pas avant.**

### Pourquoi pas un `_layout.tsx` sur `/methodologie/`

**Option `_layout.tsx` rejetée** :
- Le hub `/academie/_layout.tsx` utilise ce pattern pour rendre `AcademieNavBar` — ok pour Académie car la navbar est **identique partout** (pas de bouton "+ Nouveau" contextualisé).
- Méthodologie a un bouton "+ Nouveau X" **différent par page** → ne peut pas être hoisté dans un layout partagé sans introduire des props drillés depuis la page (anti-pattern expo-router v3).
- Le pattern Activités (import `<ActivitesHeader />` dans chaque page) est le bon pour Méthodologie → on le reproduit.

### Routes `/new` — état actuel à confirmer (Task 8)

Grep rapide (à faire par le Dev agent en Task 8) : toutes les pages Méthodologie ont-elles une route `/new` correspondante ?
- `/methodologie/seances/new` — sans doute oui (entraînements éditables)
- `/methodologie/programmes/new` — oui (cité dans `programmes/index.tsx:78` existing code)
- `/methodologie/themes/new` — **à vérifier**
- `/methodologie/situations/new` — **à vérifier**
- `/methodologie/evaluations/new` — **à vérifier**

Toute route absente → `hideNewButton={true}` sans essayer de la créer (hors scope).

### Fiches détail hors scope

Le fichier `/methodologie/programmes/[programmeId]/index.tsx` contient lui aussi le pattern NAV_TABS dupliqué. **Pas touché dans cette story** — c'est une fiche détail (rôle différent d'une page liste). Si un besoin d'uniformisation s'y pose, créer une story 80-3 dédiée aux fiches détail (probablement avec un `MethodologieHeader` + `backButton` prop).

Documenter ce point dans les Completion Notes comme dette identifiée (pas traitée).

### Design System (tokens — rappel stricte)

Fichier `MethodologieHeader.tsx` : **aucun hex hardcodé**. Tokens utilisés :
```
colors.accent.gold       (underline + bouton bg + tab active)
colors.text.dark          (titre + label bouton)
colors.text.subtle        (tabs inactifs)
colors.light.primary      (fond du header)
colors.border.divider     (bordure basse sous les tabs)
space.lg / space.md       (paddings)
fonts.display             (police titre)
```

### Project Structure Notes

- **Convention `_components/`** : cohérent avec `(admin)/academie/_components/` et `(admin)/profiles/[userId]/_components/` (Epic 87).
- **Convention `components/`** (sans underscore) : utilisée par `(admin)/activites/components/` (Story 80.1 — ancien pattern). On **ne renomme pas** `activites/components/` dans cette story (hors scope ; éviterait de casser les imports existants). Nouvelle convention `_components/` pour Méthodologie.
- **Routing Expo Router** : `(admin)/methodologie/` continue d'utiliser le mix `index.tsx` (seances, programmes, themes) et `page.tsx` + `index.tsx` re-export (situations, evaluations). Cette story ne normalise pas ce mix — hors scope.

### Règles absolues CLAUDE.md (rappel)

- N/A try/finally (aucun state setter).
- N/A console guards (aucun console).
- **OUI** tokens uniquement.
- N/A accès Supabase.
- `tsc --noEmit` EXIT:0 obligatoire.

### Aucune migration DB

Story purement frontend. Zéro table, enum, policy, Edge Function, ou dépendance npm.

### Non-goals explicites

- **Pas de refonte** des fiches détail (`programmes/[programmeId]`, `themes/[themeKey]`, etc.) — voir Dev Notes, dette documentée.
- **Pas de création** des routes `/new` manquantes — `hideNewButton` si absente.
- **Pas de refactor** de `ActivitesHeader.tsx` (composant déjà en prod, pas de raison de le toucher si l'audit Task 7 ne révèle pas de bug).
- **Pas de création** d'un `SectionHeader` générique — voir Dev Notes (décision "1 template = 2 composants mirrors pour l'instant").
- **Pas de déplacement** de `activites/components/` vers `activites/_components/` (renommage = scope creep + risque d'imports cassés).
- **Pas de changement** du label sidebar "Méthodologie" (`_layout.tsx:??` à vérifier si pertinent).
- **Pas de refonte** des pages hors des 8 listées (dashboard exclu explicitement par le produit, reste des hubs — Académie, Événements, Performances, Développement — hors scope ; couverts par d'autres stories si besoin).

### References

- **Story 80.1 (source du template)** : `ActivitesHeader.tsx` — `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` (125 lignes).
- Pages Activités (références de bonne application du template) :
  - `aureak/apps/web/app/(admin)/activites/page.tsx` (63 lignes, séances)
  - `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (1309 lignes, présences)
  - `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (947 lignes, évaluations)
- Pages Méthodologie à refactorer :
  - `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (756 lignes)
  - `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` (462 lignes)
  - `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (499 lignes)
  - `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` (373 lignes)
  - `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` (505 lignes)
- Tokens : `aureak/packages/theme/src/tokens.ts` (`colors.accent.gold`, `colors.text.dark`, `colors.text.subtle`, `colors.light.primary`, `colors.border.divider`, `space.lg`, `space.md`, `fonts.display`).
- UI primitives : `@aureak/ui` (`AureakText`).
- Expo-router hooks utilisés : `useRouter`, `usePathname` (pas de nouveau hook).
- Composant de référence pour pattern Académie (ne pas copier pour Méthodologie) : `(admin)/academie/_components/AcademieNavBar.tsx` — diffère car pas de bouton d'action.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(à compléter par le Dev agent)_

### Completion Notes List

_(à compléter par le Dev agent — noter : lignes supprimées par page (attendu ~50-60 par page), routes `/new` présentes vs absentes, résultats des 2 greps audit Task 7, résultat grep final `NAV_TABS` sur méthodologie après refactor, dette résiduelle identifiée — ex: fiches détail)_

### File List

_(à compléter par le Dev agent — attendu 1 créé, 5 modifiés ; 0 supprimé)_

**Attendus — création :**
- `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx`

**Attendus — modification :**
- `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` (~-55 lignes net)
- `aureak/apps/web/app/(admin)/methodologie/programmes/index.tsx` (~-55 lignes net)
- `aureak/apps/web/app/(admin)/methodologie/themes/index.tsx` (~-55 lignes net)
- `aureak/apps/web/app/(admin)/methodologie/situations/page.tsx` (~-55 lignes net)
- `aureak/apps/web/app/(admin)/methodologie/evaluations/page.tsx` (~-55 lignes net)

**Attendus — audit (aucune modif sauf si doublon détecté) :**
- `aureak/apps/web/app/(admin)/activites/page.tsx`
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Épic 80 (Uniformisation Design Admin)** après cette story :
- 80-1 : ActivitesHeader (done, pattern canonique établi)
- 80-2 : Uniformisation Méthodologie + audit Activités (cette story)
- **80-3 potentielle** : Uniformisation des autres hubs (Performances, Événements, Développement) si le produit le demande — **hors scope 80-2**. Dashboard explicitement exclu.
- **80-4 potentielle** : Uniformisation des fiches détail (`[id]/` routes) — dette identifiée en dev notes, traitement ultérieur.
