# Story 105.1 : Génération de cartes Panini pour stages

Status: done

## Story

En tant qu'admin,
je veux générer des cartes "Panini" (style vignette sportive) pour chaque enfant participant à un stage, avec sa photo, son nom/prénom et le titre du stage,
afin d'offrir un souvenir imprimable à chaque participant sans sortir de l'app Aureak.

## Contexte

Un proto autonome a été construit dans un workspace séparé : `/Users/jeremydevriendt/Documents/Claude-projets/Photos stage/`. Le code (React/Vite/TS) est fonctionnel et doit être porté dans le monorepo Aureak en respectant les conventions du projet.

## Acceptance Criteria

- AC1 : Nouvelle route `/(admin)/stages/[stageId]/photos` accessible depuis la fiche stage (bouton/lien "Générer cartes Panini" dans l'en-tête de `stages/[stageId]/page.tsx`)
- AC2 : La page charge le stage et la liste des enfants via `@aureak/api-client` (voir fonction à créer `listStageChildren(stageId)` basée sur la table `child_stage_participations` → `profiles`)
- AC3 : UI en 3 zones : pool photos (gauche), grille des cartes enfant (centre), actions d'export (bas)
- AC4 : L'utilisateur uploade un batch de photos (drag & drop OU input file) → les fichiers nommés `prenom_nom.*` sont auto-assignés au bon enfant (badge "auto" visible)
- AC5 : Drag & drop d'une photo du pool vers une carte enfant pour assigner manuellement
- AC6 : Bouton ↔ sur chaque carte assignée → ouvre un modal d'ajustement avec :
  - Cropper interactif (zoom 1-4×, déplacement)
  - Preview live du rendu final (photo + calque + textes) mis à jour en < 200ms
- AC7 : Les cartes enfant dans la grille affichent le rendu Panini miniature (pas la photo brute)
- AC8 : Export par 2 boutons en bas : "JPEG individuels" (téléchargements séparés) + "ZIP" (archive regroupée)
- AC9 : Nom des fichiers exportés : `{stage_court}_{nom}_{prenom}.jpg`, JPEG qualité 95, dimensions 2341×3512 (≈ 19.8×29.7 cm à 300 DPI)
- AC10 : Persistance localStorage : stageId + assignments + crops ; banner "Re-uploade tes photos" au retour si les photos ne sont plus en mémoire ; restore auto par nom de fichier ; bouton "Réinitialiser"
- AC11 : Zéro nouvelle migration DB
- AC12 : Respect des règles Aureak absolues (voir "Règles" ci-dessous)

## Règles Aureak à respecter

1. **Accès Supabase** uniquement via `@aureak/api-client` (pas de client direct dans `apps/` ou `packages/business-logic/`)
2. **Styles** uniquement via `@aureak/theme` tokens (remplacer les couleurs/espacements hardcodés du proto)
3. **try/finally** obligatoire sur tout state setter de loading/saving (upload, export)
4. **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`
5. **Routing Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export de `./page`
6. **Pas de fichiers non-routes dans `app/`** : tout composant/util/hook vit sous `apps/web/components/admin/stages/photos/`, `lib/panini/`

## Tasks

### Préparation

- [ ] Lire le proto : `/Users/jeremydevriendt/Documents/Claude-projets/Photos stage/src/` (App.tsx, components/, lib/)
- [ ] Lire le backlog aureak pour confirmer l'epic 105 (ce fichier parent)
- [ ] Lire `aureak/packages/api-client/src/admin/stages.ts` → vérifier si `child_stage_participations` expose déjà les enfants ; si non, créer une fonction

### API client (si manquant)

- [ ] Créer/adapter dans `aureak/packages/api-client/src/admin/stages.ts` :
  ```ts
  export type StageChild = {
    id: string          // child/profile id
    stageId: string
    prenom: string
    nom: string
    categorie?: string | null
  }
  export async function listStageChildren(stageId: string): Promise<StageChild[]>
  ```
  Requête : `from('child_stage_participations').select('id, stage_id, profiles(id, first_name, last_name, category)').eq('stage_id', stageId).is('deleted_at', null)`
- [ ] Ajouter export dans `aureak/packages/api-client/src/index.ts`

### Port du code proto → Aureak

| Source proto | Destination Aureak |
|---|---|
| `src/App.tsx` | `apps/web/app/(admin)/stages/[stageId]/photos/page.tsx` |
| `src/components/StageSelector.tsx` | supprimé (le stage est dans l'URL) |
| `src/components/PhotoPool.tsx` | `apps/web/components/admin/stages/photos/PhotoPool.tsx` |
| `src/components/ChildCard.tsx` | `apps/web/components/admin/stages/photos/ChildCard.tsx` |
| `src/components/PhotoAdjuster.tsx` | `apps/web/components/admin/stages/photos/PhotoAdjuster.tsx` |
| `src/components/PaniniPreview.tsx` | `apps/web/components/admin/stages/photos/PaniniPreview.tsx` |
| `src/components/ExportButtons.tsx` | `apps/web/components/admin/stages/photos/ExportButtons.tsx` |
| `src/lib/svg.ts` | `apps/web/lib/panini/svg.ts` |
| `src/lib/render.ts` | `apps/web/lib/panini/render.ts` |
| `src/lib/render-queue.ts` | `apps/web/lib/panini/render-queue.ts` |
| `src/lib/match.ts` | `apps/web/lib/panini/match.ts` |
| `src/lib/storage.ts` | `apps/web/lib/panini/storage.ts` |
| `src/lib/hooks.ts` | (merger avec hooks existants ou créer `apps/web/hooks/useDebouncedValue.ts`) |
| `src/types.ts` (types métier) | ajouter les types `CropArea`, `CropState`, `PhotoSlot` dans `@aureak/types` OU en local dans `lib/panini/types.ts` (décision produit) |
| `public/calque.svg` | `apps/web/public/assets/panini/calque.svg` |

- [ ] Copier les dépendances npm : `react-easy-crop`, `jszip`, `file-saver`, `@types/file-saver` → vérifier si déjà présentes dans `apps/web/package.json`, sinon ajouter
- [ ] Remplacer le chargement de `public/stages.json` par l'appel API `listStageChildren(stageId)` (le stage lui-même vient de `getStage(stageId)`)
- [ ] Convertir `src/styles.css` → styles via `@aureak/theme` tokens. Vérifier quelle convention d'écriture (CSS modules, styled-components, inline styles) est utilisée dans les autres pages `(admin)/stages/`

### UI entry point

- [ ] Dans `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx`, ajouter un bouton "Générer cartes Panini" dans l'en-tête, lien vers `/(admin)/stages/[stageId]/photos`
- [ ] Suivre le pattern visuel des autres boutons d'action admin (icône Lucide + label)

### QA obligatoires (voir CLAUDE.md)

- [ ] Grep try/finally sur les setters de chargement dans la nouvelle page
- [ ] Grep console guards dans `apps/web/` modifiés
- [ ] Grep catch silencieux `catch(() => {})` → aucun

### Test Playwright

- [ ] Vérifier app up : `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081`
- [ ] `mcp__playwright__browser_navigate` → `http://localhost:8081/(admin)/stages/{stageId}/photos`
- [ ] Screenshot + `mcp__playwright__browser_console_messages` → zéro erreur JS
- [ ] Tester : upload 1 photo → drag & drop sur une carte → validation modal crop

### Review locale

- [ ] Lancer 4 sous-agents en parallèle : Code Reviewer, Security Auditor, Design Critic, Regression Detector (skip Migration Validator car pas de migration)
- [ ] Fix BLOCKERs, documenter WARNINGs

### Commit

- [ ] Message : `feat(epic-105): story 105.1 — génération cartes Panini pour stages`
- [ ] Mettre `Status: done` dans ce fichier

## Dev Notes

### Spécifications du calque SVG

Le calque est dans `public/assets/panini/calque.svg` (copier depuis le proto). Dimensions : viewBox `0 0 2341 3512`. Contient :
- Un `<rect>` avec id `id--photo-slot-` (fill:none) définissant la zone photo (parent transform à appliquer)
- Deux `<text>` avec placeholders :
  - `{{titre}}` : Arial 62.5px, text-anchor="end", x=1307.21, y=3386.05 (dans parent translate 932.789, -83.94) → bord droit absolu à x=2240
  - `{{nom}} {{prenom}}` : Arial Bold 83.33px, text-anchor="end", x=1564.81, y=3400.93 (dans parent translate 675.192, -8.89) → bord droit absolu à x=2240

Le code (`lib/panini/svg.ts`) extrait dynamiquement la zone photo (en résolvant les transforms SVG) et retire le rect avant rendu. Les placeholders sont remplacés par substitution de chaîne `{{key}}` → valeur.

### Placeholders supportés

Tokens disponibles dans le SVG (tous optionnels, ignorés si non présents) :
- `{{prenom}}`, `{{nom}}`
- `{{prenom_nom}}`, `{{nom_prenom}}` (nom_prenom = `NOM Prénom` style sportif)
- `{{titre}}`, `{{stage}}`, `{{stage_court}}`
- `{{date}}`, `{{annee}}`, `{{categorie}}`
- `{{numero}}` (index de la carte — à câbler si besoin)

### Rendu canvas

Pipeline de `renderToCanvas` :
1. Canvas 2341×3512, fond blanc
2. `drawImage(photo, sx, sy, sw, sh, slotX, slotY, slotW, slotH)` avec `cropArea` (zone en pixels source) venant de `react-easy-crop`
3. SVG texte → remplacement tokens → Blob → ObjectURL → `<img>` → `drawImage(svg, 0, 0, 2341, 3512)`
4. `canvas.toBlob('image/jpeg', 0.95)` pour export

### Performance

- Queue de rendu `src/lib/panini/render-queue.ts` : max 3 renders parallèles pour éviter UI jank avec 20+ cartes
- `useDebouncedValue(area, 200)` dans le modal pour ne pas re-render le preview à chaque pixel
- Cancellation token dans `PaniniPreview` pour ignorer les renders obsolètes

### Questions ouvertes à valider avec Jeremy

1. **Accès** : admin uniquement (v1) ou aussi coach avec grade suffisant ? → reco v1 admin-only, ouvrir v1.1 si demande
2. **Calque custom par stage** : v1 = 1 calque global. Si stages spéciaux (ex. Noël, Halloween) nécessitent calques différents → v1.1 : upload de calque par stage (nouvelle colonne `stages.panini_template_url`)
3. **Table `child_stage_participations`** : confirmer que la jointure `profiles(first_name, last_name)` fonctionne et respecte RLS (admin a accès aux enfants du tenant)

### Dépendances

- `child_stage_participations` + `profiles` en base (✅ existe déjà en prod)
- `getStage(id)` dans `@aureak/api-client/src/admin/stages.ts` (✅ existe)
- Aucune migration DB à créer pour cette story

## Completion Notes

**Implémenté** : 2026-04-24 sur branche `feat/epic-105-story-105-1-cartes-panini-stages`.

### Fichiers créés
- `aureak/apps/web/lib/panini/types.ts` — CropArea, CropState, PhotoSlot, PhotoAssignment (types locaux)
- `aureak/apps/web/lib/panini/svg.ts` — parse calque SVG, extrait photo-slot, applique tokens
- `aureak/apps/web/lib/panini/render.ts` — rendu canvas 2341×3512, export JPEG 95
- `aureak/apps/web/lib/panini/render-queue.ts` — queue max 3 renders parallèles
- `aureak/apps/web/lib/panini/match.ts` — auto-match nom fichier → enfant
- `aureak/apps/web/lib/panini/storage.ts` — localStorage par stageId (clé `aureak-panini-v1:{stageId}`)
- `aureak/apps/web/hooks/useDebouncedValue.ts` — debounce générique (200ms crop preview)
- `aureak/apps/web/components/admin/stages/photos/styles.ts` — tous styles via @aureak/theme tokens
- `aureak/apps/web/components/admin/stages/photos/PhotoPool.tsx`
- `aureak/apps/web/components/admin/stages/photos/ChildCard.tsx`
- `aureak/apps/web/components/admin/stages/photos/PaniniPreview.tsx`
- `aureak/apps/web/components/admin/stages/photos/PhotoAdjuster.tsx` (react-easy-crop)
- `aureak/apps/web/components/admin/stages/photos/ExportButtons.tsx` (JPEG + ZIP)
- `aureak/apps/web/app/(admin)/evenements/stages/[stageId]/photos/page.tsx` (orchestration)
- `aureak/apps/web/app/(admin)/evenements/stages/[stageId]/photos/index.tsx` (re-export)
- `aureak/apps/web/public/panini/calque.svg` (copié depuis proto)

### Fichiers modifiés
- `aureak/packages/api-client/src/admin/stages.ts` — fonction `listStageChildren(stageId)` + type `StageChild`
- `aureak/packages/api-client/src/index.ts` — export `listStageChildren`, type `StageChild`
- `aureak/apps/web/app/(admin)/evenements/stages/[stageId]/page.tsx` — bouton "🃏 Cartes Panini" dans l'en-tête
- `aureak/apps/web/package.json` — deps ajoutées : `file-saver`, `jszip`, `react-easy-crop`, `@types/file-saver`

### Décisions techniques
1. **Route canonique** : `/(admin)/evenements/stages/[stageId]/photos` (pas `/(admin)/stages/[stageId]/photos` comme écrit dans la story — la route `(admin)/stages/` est un redirect legacy vers `(admin)/evenements/stages/`)
2. **Jointure DB** : `child_stage_participations → child_directory` (pas `profiles` comme indiqué dans la story — les enfants de stage sont dans l'annuaire, pas dans auth)
3. **Asset path** : `public/panini/calque.svg` (pas `public/assets/panini/` car Metro/Expo Web réserve le préfixe `/assets/` aux assets bundlés internes — le sous-dossier `public/assets/` n'est donc pas servi statiquement)
4. **Rendering** : HTML natif (`<div>`, `<canvas>`, `<input type="file">`) plutôt que React Native primitives. La feature est strictement web-only (drag&drop HTML5, canvas API, react-easy-crop = lib DOM). Les styles utilisent 100 % `@aureak/theme` tokens via un fichier `styles.ts` central.
5. **Persistance** : `localStorage` clé par stageId (`aureak-panini-v1:{stageId}`) — permet de travailler sur plusieurs stages en parallèle sans conflit.

### WARNINGs documentés
- Les boutons export déclenchent des downloads séquentiels (JPEG individuels) — sur certains navigateurs cela peut déclencher le popup "Autoriser les téléchargements multiples ?". Pas de mitigation v1 : UX acceptable en admin.
- Le calque SVG est chargé via `fetch()` à chaque init (pas de cache applicatif) — OK en admin, plus lourd serait over-kill pour un SVG de 190 Ko.
- L'auto-match regarde les accents / casse, mais pas les trémas composés (ex. `GÉRARD` vs `GERARD`) — déjà géré par `.normalize('NFD')` → les deux matcheront. En revanche `O'BRIEN` vs `OBRIEN` peut rater un match (l'apostrophe disparaît dans la normalisation). Accepté v1.

### Questions à dérouler en v1.1
1. **Accès coach** : ouvrir aux coachs avec grade suffisant ?
2. **Calque custom par stage** : actuellement 1 calque global. Ajouter `stages.panini_template_url` (nullable) pour override par stage (Noël, Halloween).
3. **Impression directe** : intégrer au navigateur via `window.print()` avec CSS print dédié ?

### QA verified
- try/finally sur tous state setters loading/export (page.tsx ligne 102, ExportButtons.tsx lignes 66 / 92) ✅
- console guards `NODE_ENV` partout ✅
- aucun catch silencieux ✅
- typecheck : 0 erreur introduite (15 erreurs pré-existantes sur main) ✅
- Playwright test : route OK, 33 enfants chargés, calque SVG servi, 0 erreur console ✅
