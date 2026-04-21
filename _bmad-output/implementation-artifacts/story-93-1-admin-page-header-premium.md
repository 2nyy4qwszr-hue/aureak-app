# Story 93.1 — AdminPageHeader : composant partagé premium (eyebrow + title + subtitle + période/action)

Status: review

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 93 — Premium UX Upgrade (pattern Template Admin Aureak)
- **Story ID** : 93.1
- **Story key** : `93-1-admin-page-header-premium`
- **Priorité** : P1 (fondation Epic 93 — consommée par 93-2/93-3/93-4)
- **Dépendances** : Pattern `ActivitesHeader.tsx` (Epic 80 done) comme base de tokens. **Indépendante** de 81-2 (MethodologieHeader) — l'application Méthodologie est conditionnelle (voir AC #9).
- **Source** : Template `/tmp/aureak-template/app.jsx` (zip `_bmad-output/design-references/Template - page admin Dashboard.zip`) — bloc `page-header` (eyebrow "Pilotage · Avril 2026" + H1 "Activités" + paragraph subtitle + bouton période à droite).
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : **M** (1 composant partagé créé + 2 composants existants dégonflés + 3-5 pages instrumentées, 0 migration, 0 nouvelle API)

## Story

As an admin,
I want un **page-header premium** unique, réutilisable, composé d'un eyebrow contextualisant (ex: "Pilotage · Avril 2026"), d'un titre éditorial (H1), d'un sous-titre descriptif, et à droite d'un bouton période optionnel ou d'une action principale,
so that chaque section admin (Activités, Méthodologie, plus tard Académie/Événements/Performances) adopte la même identité visuelle premium du template Aureak — et que l'ajout de contexte (période, description) devienne une action 1-ligne dans chaque page plutôt qu'un bloc JSX dupliqué.

## Acceptance Criteria

1. **Nouveau composant partagé `AdminPageHeader`** — localisation : `aureak/apps/web/app/(admin)/_components/AdminPageHeader.tsx`.
   - Fichier ≤ 180 lignes (composant + StyleSheet + types exportés).
   - Rendu React Native pur : `View`, `Pressable`, `AureakText`, `StyleSheet` — aucun DOM `<div>`/`<h1>` brut.
   - Tokens `@aureak/theme` uniquement (pas un seul hex hardcodé).
   - Exporte `AdminPageHeader` (composant) et `AdminPageHeaderProps` (type).

2. **Signature props** :
   ```typescript
   type AdminPageHeaderProps = {
     eyebrow      : string                   // ex: "Pilotage · Avril 2026"
     title        : string                   // ex: "Activités"
     subtitle?    : string                   // paragraphe descriptif (optional)
     periodButton?: {                        // bouton dropdown "Avril 2026 ▾" à droite
       label  : string
       onPress: () => void
     }
     actionButton?: {                        // bouton CTA gold plein à droite
       label  : string                       // ex: "+ Nouvelle séance"
       onPress: () => void
     }
     /** Les deux boutons peuvent coexister (période à gauche, action à droite). */
   }
   ```
   - `eyebrow` et `title` sont **obligatoires**. `subtitle`, `periodButton`, `actionButton` sont optionnels.
   - Si **aucun** des deux boutons n'est passé → zone droite vide, le layout se rééquilibre (title prend toute la largeur).

3. **Rendu visuel** (pixel-près inspiré du template `app.jsx` lignes 70-85) :
   - **Zone gauche** (colonne, flex 1, gap `space.xs`) :
     - `eyebrow` : fontSize 11, fontWeight 600, letterSpacing 1, `textTransform: 'uppercase'`, color `colors.text.muted`, Poppins body.
     - `title` : fontSize 32, fontWeight 700, fontFamily `fonts.display` (Montserrat), color `colors.text.dark`, letterSpacing -0.02em, lineHeight 1.2.
     - `subtitle` (si présent) : fontSize 14, fontWeight 400, color `colors.text.subtle`, lineHeight 1.5, maxWidth 520 (pour éviter une ligne trop large qui nuit à la lisibilité).
   - **Zone droite** (row, gap `space.sm`, `alignItems: flex-start` pour s'aligner sur le haut du title) :
     - `periodButton` : bouton bordure fine, `backgroundColor: 'transparent'`, `borderWidth: 1`, `borderColor: colors.border.divider`, `paddingHorizontal: space.md`, `paddingVertical: 8`, `borderRadius: 8`. Label color `colors.text.dark`, fontWeight 500, fontSize 13. Chevron down icon 12px à droite (via lucide ou AureakText emoji `▾`).
     - `actionButton` : bouton gold plein, `backgroundColor: colors.accent.gold`, `paddingHorizontal: space.md`, `paddingVertical: 8`, `borderRadius: 8`. Label color `colors.text.dark`, fontWeight 700, fontSize 13.
   - **Container externe** : `paddingHorizontal: space.lg`, `paddingTop: space.xl`, `paddingBottom: space.lg`, `backgroundColor: colors.light.primary`, `flexDirection: row`, `justifyContent: space-between`, `alignItems: flex-start`, `gap: space.lg`.

4. **Application sur `/activites/*`** (pages existantes conformes Story 80.1) :
   - `aureak/apps/web/app/(admin)/activites/page.tsx` : ajouter `<AdminPageHeader />` **au-dessus de** `<ActivitesHeader />`. Props :
     ```typescript
     <AdminPageHeader
       eyebrow="Pilotage · {mois courant en français}"
       title="Activités"
       subtitle="Séances programmées, présences des joueurs et évaluations des coachs — tout le pouls de l'académie au même endroit."
     />
     ```
   - Le mois courant est calculé via `new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })` → "avril 2026" → capitalisé "Avril 2026". Helper à créer dans `(admin)/_components/formatPeriodLabel.ts` (fonction pure 3 lignes).
   - Idem pour `/activites/presences/page.tsx` et `/activites/evaluations/page.tsx` : ajouter `<AdminPageHeader />` avec le même eyebrow, title "Activités", subtitle adapté à chaque sous-section (OU le même subtitle global — voir AC #8).

5. **Dédoublonnage avec `ActivitesHeader.tsx`** — le composant `ActivitesHeader` contient actuellement un `pageTitle` ("ACTIVITÉS" uppercase 24px) + bouton "+ Nouvelle séance" + tabs. Après ajout de `AdminPageHeader` au-dessus, le `pageTitle` ferait doublon.
   - **Modifier** `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` : **supprimer** la ligne `<AureakText style={styles.pageTitle}>ACTIVITÉS</AureakText>` et le style `pageTitle` associé.
   - **Garder** le bouton "+ Nouvelle séance" (ne pas le migrer vers `AdminPageHeader.actionButton` dans cette story — scope creep, voir Non-goals).
   - **Garder** les tabs `SÉANCES | PRÉSENCES | ÉVALUATIONS`.
   - Le composant devient donc : `[headerTopRow avec juste le bouton à droite] + [tabsRow]`.
   - Ajuster le padding-top si nécessaire : le bouton doit rester visuellement accroché à droite sans déséquilibrer la mise en page.

6. **Application conditionnelle sur `/methodologie/*`** (5 pages) — **seulement si `MethodologieHeader.tsx` existe déjà** (sera créé en Story 81-2 si pas encore mergée) :
   - **Cas A (81-2 mergée)** : même pattern que AC #4/#5. Ajouter `<AdminPageHeader eyebrow="Bibliothèque · {mois}" title="Méthodologie" subtitle="..."  />` au-dessus de `<MethodologieHeader />` sur les 5 pages, + retirer `pageTitle` de `MethodologieHeader.tsx`.
   - **Cas B (81-2 pas encore mergée)** : **ne pas toucher** aux pages Méthodologie dans cette story. Consigner dans Completion Notes. L'application sera faite en story 93-1b (follow-up léger ≤ 1h) quand 81-2 sera merged.
   - Dev Agent **vérifie l'existence** de `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` avant de décider.

7. **Subtitle paragraphe — ton éditorial Aureak** (à valider avec produit si besoin) :
   - Activités : "Séances programmées, présences des joueurs et évaluations des coachs — tout le pouls de l'académie au même endroit."
   - Méthodologie (cas A) : "Bibliothèque pédagogique : entraînements, programmes, thèmes, situations et évaluations utilisés sur le terrain."
   - Ces phrases sont **identiques** pour toutes les sous-pages d'un même hub (Séances, Présences, Évaluations partagent le même subtitle Activités — on n'a pas 3 descriptions différentes pour 1 hub).

8. **Responsive** — le `AdminPageHeader` doit rester lisible jusqu'à ~640px de largeur :
   - Mobile (<640px) : le container passe en `flexDirection: 'column'`, `gap: space.md`. La zone droite se positionne sous la zone gauche (boutons en ligne).
   - Subtitle : `maxWidth: '100%'` en mobile (vs 520 en desktop).
   - Cette responsivité est implémentée via le pattern existant Aureak : media query sur la largeur d'écran ou via `useWindowDimensions` de `react-native`.

9. **Non-régression fonctionnelle** :
   - Les 3 pages Activités doivent afficher le même contenu métier avant/après (stat cards, tableaux, filtres).
   - Aucun hook `useState`/`useEffect` existant dans les pages n'est déplacé.
   - Les routes, redirects et shortcuts clavier restent identiques.
   - La navigation entre les 3 sous-onglets Activités doit rester fluide (pas de remount inutile).

10. **Qualité & conformité CLAUDE.md** :
    - `AdminPageHeader` stateless (aucun state setter) → pas de try/finally.
    - Pas de `console.*` → pas de guard nécessaire.
    - Styles via tokens `@aureak/theme` uniquement.
    - Pas d'accès Supabase.
    - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

11. **Tests Playwright manuels** :
    - `curl http://localhost:8081` = 200.
    - Naviguer `/activites` → eyebrow "PILOTAGE · AVRIL 2026" visible uppercase muted, titre "Activités" éditorial grand serif, subtitle paragraphe sur 1-2 lignes en dessous, zone droite vide (pas de périodButton passé dans cette story). ActivitesHeader en dessous avec bouton "+ Nouvelle séance" à droite et tabs en-dessous. Aucun doublon "ACTIVITÉS / Activités".
    - Naviguer `/activites/presences` → mêmes eyebrow/title/subtitle, onglet PRÉSENCES actif dans ActivitesHeader.
    - Naviguer `/activites/evaluations` → mêmes, onglet ÉVALUATIONS actif.
    - Resize fenêtre à 500px → le layout passe en colonne (vérifier via `resize_page` Chrome DevTools ou CSS responsive), pas de texte tronqué ni débordement horizontal.
    - Console JS : **zéro erreur** sur les 3 pages.
    - Cas A seulement : screenshots des 5 pages Méthodologie avec le même pattern appliqué.

## Tasks / Subtasks

- [x] **Task 1 — Création du composant `AdminPageHeader.tsx`** (AC: #1, #2, #3, #8)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/AdminPageHeader.tsx` avec la signature spécifiée (AC #2).
  - [ ] Implémenter le rendu responsive (AC #3, #8) :
    - Mode desktop : `flexDirection: 'row'`.
    - Mode mobile (<640px) : `flexDirection: 'column'`.
    - Utiliser `useWindowDimensions()` de `react-native` pour la détection dynamique.
  - [ ] Exporter `AdminPageHeader` en export nommé **et** default.
  - [ ] Exporter le type `AdminPageHeaderProps`.

- [x] **Task 2 — Helper `formatPeriodLabel`** (AC: #4)
  - [ ] Créer `aureak/apps/web/app/(admin)/_components/formatPeriodLabel.ts` :
    ```typescript
    export function formatPeriodLabel(date: Date = new Date()): string {
      const raw = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      return raw.charAt(0).toUpperCase() + raw.slice(1)  // "avril 2026" → "Avril 2026"
    }

    export function formatEyebrow(context: string, date: Date = new Date()): string {
      return `${context} · ${formatPeriodLabel(date)}`.toUpperCase()
    }
    ```
  - [ ] Pas de tests unitaires requis (fonction pure triviale).

- [x] **Task 3 — Dégonflage de `ActivitesHeader.tsx`** (AC: #5)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx`.
  - [ ] Supprimer :
    - La ligne `<AureakText style={styles.pageTitle}>ACTIVITÉS</AureakText>`.
    - La clé `pageTitle` dans le `StyleSheet.create` (et ses dépendances si orphelines — `letterSpacing: 0.5` etc.).
  - [ ] Ajuster `headerTopRow` si besoin : le bouton doit rester aligné à droite, `justifyContent: 'flex-end'` au lieu de `'space-between'`.
  - [ ] **Ne pas** retirer le bouton "+ Nouvelle séance" (hors scope).
  - [ ] **Ne pas** retirer les tabs (hors scope).
  - [ ] Vérifier visuellement : la NavBar garde ses onglets + son bouton ; seul le titre disparaît.

- [x] **Task 4 — Application sur `/activites/page.tsx`** (AC: #4)
  - [ ] Ouvrir `aureak/apps/web/app/(admin)/activites/page.tsx`.
  - [ ] Importer : `import { AdminPageHeader } from '../_components/AdminPageHeader'` et `import { formatEyebrow } from '../_components/formatPeriodLabel'`.
  - [ ] Dans le JSX, **au-dessus** du `<ActivitesHeader />` existant, ajouter :
    ```jsx
    <AdminPageHeader
      eyebrow={formatEyebrow('Pilotage')}
      title="Activités"
      subtitle="Séances programmées, présences des joueurs et évaluations des coachs — tout le pouls de l'académie au même endroit."
    />
    ```
  - [ ] Vérifier que le padding top de la page (`scrollContent`) n'a pas besoin d'ajustement (le `AdminPageHeader` apporte son propre paddingTop).

- [x] **Task 5 — Application sur `/activites/presences/page.tsx`** (AC: #4)
  - [ ] Mêmes modifications que Task 4.
  - [ ] Props `AdminPageHeader` strictement identiques (même eyebrow, même title "Activités", même subtitle).

- [x] **Task 6 — Application sur `/activites/evaluations/page.tsx`** (AC: #4)
  - [ ] Mêmes modifications que Tasks 4/5.

- [x] **Task 7 — Vérification conditionnelle Méthodologie** (AC: #6)
  - Résultat : **Cas B** — `MethodologieHeader.tsx` absent (81-2 pas mergée). Application Méthodologie skippée, reportée en 93-1b follow-up.
  - [ ] `ls aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` :
    - **Si existe** (Story 81-2 mergée) → **Cas A** : répéter Task 4 sur les 5 pages Méthodologie (`seances/index.tsx`, `programmes/index.tsx`, `themes/index.tsx`, `situations/page.tsx`, `evaluations/page.tsx`) avec `eyebrow={formatEyebrow('Bibliothèque')}`, `title="Méthodologie"`, subtitle AC #7. + Dégonfler `MethodologieHeader.tsx` comme Task 3.
    - **Si absent** → **Cas B** : skipper les 5 pages Méthodologie. Consigner dans Completion Notes : "Story 81-2 pas encore mergée au moment du dev — application Méthodologie reportée à une 93-1b follow-up". Pas de tâche bloquante.

- [x] **Task 8 — QA & conformité** (AC: #10)
  - `npx tsc --noEmit` → **EXIT 0** ✅
  - Grep `#[0-9a-fA-F]{3,6}` sur `AdminPageHeader.tsx` → 0 match ✅
  - Grep `<h1|<div` sur `AdminPageHeader.tsx` → 0 match (RN pur) ✅
  - Grep `pageTitle` sur `ActivitesHeader.tsx` → 1 match (commentaire explicatif uniquement, pas de code) ✅
  - Import `fonts` orphelin retiré de `ActivitesHeader.tsx`
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Grep `#[0-9a-fA-F]{3,6}` dans `AdminPageHeader.tsx` → 0 match.
  - [ ] Grep `<h1\|<div` dans `AdminPageHeader.tsx` → 0 match (RN pur, pas de DOM).
  - [ ] Grep `pageTitle` dans `ActivitesHeader.tsx` → 0 match (retiré proprement).
  - [ ] Vérifier qu'aucun import orphelin ne reste dans `ActivitesHeader.tsx` après retrait du titre.

- [x] **Task 9 — Tests Playwright manuels** (AC: #11)
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081` → `000` (serveur non démarré)
  - **Playwright skipped** — app non démarrée (conforme règle CLAUDE.md fallback).
  - Validation visuelle à faire par l'utilisateur une fois `npx turbo dev --filter=web` lancé.
  - [ ] Navigation séquentielle sur les 3 pages Activités + screenshots.
  - [ ] Test responsive : resize à 500px de largeur, vérifier que le layout passe en colonne.
  - [ ] Cas A uniquement : screenshots des 5 pages Méthodologie.
  - [ ] Console JS zéro erreur sur toutes les pages testées.

## Dev Notes

### Pourquoi `_components/` au niveau `(admin)/` (racine)

Le composant `AdminPageHeader` est **transversal** à tous les hubs admin (Activités, Méthodologie, Académie, Événements, Performances…). Le placer dans `(admin)/_components/` (racine du groupe admin) plutôt que dans un hub spécifique (`activites/components/` ou `academie/_components/`) signale son scope transverse.

Convention actuelle du projet :
- `(admin)/activites/components/` — composants spécifiques Activités (`ActivitesHeader`, `StatCards`, `TableauSeances`…).
- `(admin)/academie/_components/` — composants spécifiques Académie (`AcademieNavBar`).
- `(admin)/methodologie/_components/` — composants spécifiques Méthodologie (`MethodologieHeader` à créer en 81-2).
- **NOUVEAU** `(admin)/_components/` — composants **partagés** entre hubs (cette story ouvre ce dossier).

Future addition à ce dossier (au fil des stories Epic 93) : `SubtabsWithCount.tsx`, `StatsHeroCard.tsx`, `SparklineSVG.tsx`, etc.

### Le template ne remplace pas ActivitesHeader — il le complète

Le template `app.jsx` du zip combine **4 zones** dans son `page-header` :
1. Eyebrow + H1 + subtitle + période bouton
2. Subtabs avec count badges
3. StatsHero
4. Toolbar filtres

Cette story 93-1 traite **uniquement la zone 1**. Les zones 2/3/4 sont :
- Zone 2 (subtabs + count) → Story 93-2
- Zone 3 (StatsHero premium) → Story 93-3
- Zone 4 (toolbar) → déjà en place via `FiltresScope` + `PseudoFiltresTemporels`, pas besoin de refondre.

L'ordre de rendu final visé (après Epic 93 complet) :
```
<AdminPageHeader />       ← 93-1 (cette story)
<Subtabs withCount />     ← 93-2
<StatsHero />             ← 93-3
<Toolbar />               ← existant
<Table />                 ← existant
```

### Pourquoi on retire `pageTitle` de ActivitesHeader mais on garde les tabs

**Raison** : éviter le doublon visuel "Activités" (grand H1 serif du nouveau AdminPageHeader) + "ACTIVITÉS" (petit uppercase gold du vieux ActivitesHeader).

**On garde** les tabs (`SÉANCES | PRÉSENCES | ÉVALUATIONS`) et le bouton "+ Nouvelle séance" **dans ActivitesHeader** pour cette story car :
- Les tabs + bouton action forment un bloc cohérent (nav entre les sous-sections d'un même hub).
- Les migrer vers `AdminPageHeader.actionButton` + créer un `SubtabsWithCount` dans cette story = scope creep.
- Story 93-2 s'occupera de la migration vers `SubtabsWithCount`.

### Éléments visuels typographiques — décisions justifiées

- **Eyebrow uppercase + letterSpacing 1** : pattern éditorial premium pour contextualiser (qui + quand). Cohérent template.
- **H1 fontFamily `fonts.display` (Montserrat)** : nos tokens définissent `fonts.display` comme Montserrat. Le template utilise Montserrat aussi. Cohérent.
- **H1 fontSize 32 (vs 24 actuellement dans ActivitesHeader)** : passage à une taille éditoriale "page-level", pas "section-level". Le 24px uppercase était correct pour un header de section, le 32px convient mieux pour un H1 de page.
- **Subtitle color `colors.text.subtle` (entre dark et muted)** : lisible mais secondaire. Tokens actuels : `colors.text.dark` > `colors.text.subtle` > `colors.text.muted`. Si `colors.text.subtle` n'existe pas, utiliser `colors.text.muted`.

### Format "Avril 2026" — localization

- Le navigateur affiche le mois en français via `toLocaleDateString('fr-FR', { month: 'long' })`.
- Capitalisation manuelle du premier caractère (JavaScript renvoie "avril" en minuscule).
- Si plus tard la date courante devient dynamique (filtre période utilisateur), le prop `eyebrow` restera un simple string → le parent est responsable du formatage.

### Responsive — choix `useWindowDimensions`

- `useWindowDimensions()` est disponible dans `react-native` et `react-native-web`.
- Refresh automatique sur resize, pas besoin de listener manuel.
- Breakpoint 640px choisi arbitrairement (mobile moyen) — ajustable si le design system Aureak a un breakpoint canonique (à vérifier).

### Règles absolues CLAUDE.md (rappel)

- N/A try/finally (composant stateless).
- N/A console guards (aucun console).
- **OUI** tokens `@aureak/theme` uniquement.
- N/A accès Supabase.
- `tsc --noEmit` EXIT:0 obligatoire.

### Aucune migration DB, aucune nouvelle API

Story 100% frontend, purement visuelle. Rien à toucher côté backend/Supabase.

### Project Structure Notes

- **Nouveau dossier** : `(admin)/_components/` — pattern `_components` (avec underscore) cohérent avec `(admin)/academie/_components/` et `(admin)/methodologie/_components/`.
- **Anti-pattern à éviter** : ne **pas** placer dans `(admin)/activites/components/` (sans underscore), car le composant n'est pas spécifique Activités.
- **Import pattern** : `import { AdminPageHeader } from '../_components/AdminPageHeader'` depuis les pages hub-level, `import { AdminPageHeader } from '../../_components/AdminPageHeader'` depuis les pages hub/sub-level (ex: `/activites/presences/page.tsx`).

### Non-goals explicites

- **Pas de migration** du bouton "+ Nouvelle séance" de `ActivitesHeader` vers `AdminPageHeader.actionButton` — scope creep. Le prop existe pour de futures stories mais n'est pas consommé ici.
- **Pas de dropdown période fonctionnel** — le prop `periodButton` existe dans l'API mais n'est pas consommé dans cette story (aucune page ne le passe). Il sera utilisé quand un filtre période sera implémenté (hors Epic 93).
- **Pas de refonte** des pages Académie (`/academie/*`), Événements, Performances, Développement — le template cible Activités + Méthodologie comme premier jet, les autres hubs suivront (potentiel Epic 93-5 ou follow-up).
- **Pas de subtabs avec count** dans cette story → 93-2.
- **Pas de StatsHero redesign** → 93-3.
- **Pas de NextSessionHero** → 93-4.
- **Pas de modification de la sidebar** (le template propose une sidebar regroupée Pilotage/Opérations/Communication différente de l'actuelle — changement global, hors Epic 93).
- **Pas d'ajout de topbar breadcrumbs** (pas dans l'app actuelle, pas nécessaire pour ce jet).
- **Pas de density selector** (feature builder Figma, hors scope).

### References

- **Template source** : `_bmad-output/design-references/Template - page admin Dashboard.zip`
  - Fichier principal : `app.jsx` lignes 70-85 (bloc `page-header`).
  - CSS associée : `admin.css` (classes `.page-header`, `.page-eyebrow`, `.page-title`, `.page-subtitle`).
  - Tokens : `assets/colors_and_type.css` (palette gold/zinc cohérente avec Aureak actuel).
- Composant pattern actuel : `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` (Story 80.1 done).
- Futur sibling (dépendance conditionnelle) : `aureak/apps/web/app/(admin)/methodologie/_components/MethodologieHeader.tsx` (Story 81-2 ready-for-dev).
- Pages Activités à instrumenter :
  - `aureak/apps/web/app/(admin)/activites/page.tsx`
  - `aureak/apps/web/app/(admin)/activites/presences/page.tsx`
  - `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
- Tokens : `aureak/packages/theme/src/tokens.ts` (`colors.accent.gold`, `colors.text.dark`, `colors.text.subtle`, `colors.text.muted`, `colors.light.primary`, `colors.border.divider`, `space.lg/md/sm/xs`, `fonts.display`).
- UI primitive : `@aureak/ui` (`AureakText`).
- Hooks RN : `useWindowDimensions` de `react-native`.
- Story 80.1 (pattern référence) : `_bmad-output/implementation-artifacts/80-1-*.md` (à trouver si besoin de voir le code original du `pageTitle` actuellement dans ActivitesHeader).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TSC full-repo check : EXIT 0 (aucune erreur type introduite)
- Grep QA all-pass (cf. Task 8)

### Completion Notes List

- **État 81-2 au moment du dev** : **Cas B** — `MethodologieHeader.tsx` absent. Application Méthodologie non faite dans cette story, à reporter en 93-1b quand 81-2 sera mergée.
- **Breakpoint responsive retenu** : 640px (constante `MOBILE_BREAKPOINT`). Switch `flexDirection: 'row' → 'column'` + subtitle `maxWidth: 520 → '100%'`.
- **Alignement typographique** :
  - Eyebrow : 11px / 600 / letterSpacing 1 / uppercase / `colors.text.muted` / `fonts.body` (Poppins).
  - Title : 32px / 700 / letterSpacing -0.5 / lineHeight 38 / `fonts.display` (Montserrat) / `colors.text.dark`.
  - Subtitle : 14px / 400 / lineHeight 21 / `colors.text.subtle` / maxWidth 520.
- **Tokens utilisés** : `colors.light.primary` (fond), `colors.text.dark/subtle/muted`, `colors.accent.gold`, `colors.border.divider`, `space.lg/md/sm/xs/xl`, `fonts.display/body`.
- **Décisions d'implémentation** :
  - Utilisation de `useWindowDimensions()` (RN) plutôt que CSS media query pour détection responsive — cohérent cross-platform.
  - Chevron du bouton période implémenté via texte inline `' ▾'` (pas d'import d'icônes additionnelles pour minimiser les deps).
  - Composant stateless (pas de `useState`/`useEffect`) → aucun try/finally nécessaire.
- **Dégonflage `ActivitesHeader.tsx`** :
  - `pageTitle` JSX + style associé supprimés.
  - `justifyContent: 'space-between'` → `'flex-end'` dans `headerTopRow`.
  - `paddingTop: space.lg` → `space.sm` (moins d'air entre AdminPageHeader et bouton).
  - Import `fonts` retiré (orphelin après retrait du titre).
- **Pages instrumentées** : 3 pages Activités (seances, presences, evaluations) utilisent désormais `<AdminPageHeader>` au-dessus de `<ActivitesHeader>`.
- **Pas de dérive** vs la spec : signature props, rendu, tokens conformes AC #1-#3.
- **Test Playwright visuel** reporté : dev server non démarré au moment du dev (`curl :8081` = 000).

### File List

**Créés :**
- `aureak/apps/web/app/(admin)/_components/AdminPageHeader.tsx` ✅
- `aureak/apps/web/app/(admin)/_components/formatPeriodLabel.ts` ✅

**Modifiés :**
- `aureak/apps/web/app/(admin)/activites/components/ActivitesHeader.tsx` (retrait `pageTitle`, ajustement `headerTopRow` justify + paddingTop, retrait import `fonts` orphelin) ✅
- `aureak/apps/web/app/(admin)/activites/page.tsx` (ajout `<AdminPageHeader>`) ✅
- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (ajout `<AdminPageHeader>`) ✅
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (ajout `<AdminPageHeader>`) ✅

**Reportés (Cas B — 81-2 pas mergée) :**
- Pages Méthodologie (5) → follow-up 93-1b quand 81-2 mergée.

### Change Log

- 2026-04-21 — Story 93.1 implémentée : `AdminPageHeader` + helper `formatPeriodLabel` créés, instrumentés sur 3 pages Activités, `pageTitle` retiré de `ActivitesHeader` pour éviter doublon. TSC EXIT 0. Application Méthodologie reportée (81-2 pas mergée).

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Epic 93 roadmap après cette story** :
- 93-1 : AdminPageHeader ← **cette story**
- 93-2 : Subtabs avec count badges (enrichissement ActivitesHeader + MethodologieHeader + AcademieNavBar)
- 93-3 : StatsHero premium (1 card hero avec sparkline + 3 cards mini-bars/progress)
- 93-4 : NextSessionHero (état vide premium `/activites/seances`)
- 93-5 (facultatif) : Extension aux hubs Académie/Événements/Performances/Développement.
