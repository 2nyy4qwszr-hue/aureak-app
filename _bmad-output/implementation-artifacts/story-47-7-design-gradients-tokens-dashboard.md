# Story 47-7 — Design : gradients hardcodés → tokens @aureak/theme dans dashboard/page.tsx

**Epic** : 47 — Design/UX batch
**Status** : done
**Priority** : P1 — BLOCKER design tokens
**Effort** : XS (1 fichier, 3 occurrences)

---

## Contexte

`dashboard/page.tsx` contient trois gradients CSS avec des couleurs hexadécimales hardcodées hors tokens :

1. **Ligne 26** — constante module `TERRAIN_GRADIENT` : `linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)`
2. **Ligne 640** — style inline header implantation card : `linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)`
3. **Ligne 849** — style inline CountdownTile : `linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)`

Ces valeurs violent la règle absolue CLAUDE.md : **"Styles UNIQUEMENT via `@aureak/theme` tokens — jamais de couleurs/espacements hardcodés"**.

Les tokens `@aureak/theme` existants à utiliser :
- `colors.dark.background` → `#0F0F0F` (noir profond)
- `colors.dark.surface` → `#1A1A1A` (card dark)
- `colors.dark.elevated` → `#242424` (card surélevée)
- `colors.dark.primary` → `#1A1A1A`

Pour les gradients verts terrain (football pitch), aucun token vert foncé n'existe dans `tokens.ts`. La story doit ajouter ces tokens dans `@aureak/theme/src/tokens.ts`.

---

## Acceptance Criteria

### AC1 — Tokens terrain ajoutés dans `@aureak/theme/src/tokens.ts`
- Un objet `terrain` est ajouté dans `colors` (ou comme export de niveau supérieur) avec au minimum :
  - `darkForest` : `#1a472a` — vert forêt sombre (base terrain)
  - `midGreen` : `#2d6a4f` — vert moyen terrain
  - `lightGreen` : `#40916c` — vert clair accent terrain
  - `deepForest` : `#1B4332` — vert forêt profond (variante foncée)
- Les gradients pré-construits sont définis comme constantes exportées nommées dans `tokens.ts` ou dans un fichier `gradients.ts` adjacent exporté par `@aureak/theme` :
  - `TERRAIN_GRADIENT_DARK` : `linear-gradient(135deg, #1a472a 0%, #2d6a4f 60%, #1a472a 100%)`
  - `TERRAIN_GRADIENT_HEADER` : `linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)`
- Ces constantes sont construites à partir des tokens couleur définis ci-dessus (pas de hex inline dans les constantes gradient)

### AC2 — `dashboard/page.tsx` ne contient plus aucune couleur hexadécimale terrain hardcodée
- La constante locale `TERRAIN_GRADIENT` (ligne 26) est remplacée par l'import de `TERRAIN_GRADIENT_DARK` depuis `@aureak/theme`
- Le style inline ligne ~640 (header implantation card) utilise `TERRAIN_GRADIENT_HEADER` depuis `@aureak/theme`
- Le commentaire `// ── Constantes locales terrain (pas de token pour ces valeurs spécifiques) ─────` est supprimé (les tokens existent désormais)

### AC3 — Le gradient dark de `CountdownTile` (ligne ~849) utilise les tokens existants
- `linear-gradient(135deg, #2A2827 0%, #1A1A1A 100%)` est remplacé par une expression construite depuis les tokens `colors.dark` existants :
  - `#2A2827` → `colors.dark.hover` (`#2A2A2A`) — valeur la plus proche disponible
  - `#1A1A1A` → `colors.dark.surface` (`#1A1A1A`) — correspondance exacte
  - Forme finale : `` `linear-gradient(135deg, ${colors.dark.hover} 0%, ${colors.dark.surface} 100%)` ``
- Aucun hex literal ne subsiste pour ce gradient

---

## Tasks

- [ ] **T1** — Lire `aureak/packages/theme/src/tokens.ts` pour vérifier les tokens existants avant modification
- [ ] **T2** — Dans `tokens.ts`, ajouter `colors.terrain` avec les 4 nuances de vert identifiées en AC1
- [ ] **T3** — Dans `tokens.ts` (ou `gradients.ts` adjacent), ajouter et exporter `TERRAIN_GRADIENT_DARK` et `TERRAIN_GRADIENT_HEADER` construits depuis `colors.terrain`
- [ ] **T4** — Mettre à jour l'export agrégé `tokens` (ligne `const tokens = { ... }`) pour inclure `terrain` et/ou `gradients`
- [ ] **T5** — Dans `dashboard/page.tsx` : remplacer la constante locale `TERRAIN_GRADIENT` par l'import de `TERRAIN_GRADIENT_DARK` depuis `@aureak/theme`
- [ ] **T6** — Dans `dashboard/page.tsx` ligne ~640 : remplacer le gradient inline par `TERRAIN_GRADIENT_HEADER`
- [ ] **T7** — Dans `dashboard/page.tsx` ligne ~849 : remplacer le gradient inline par l'expression template utilisant `colors.dark.hover` et `colors.dark.surface`
- [ ] **T8** — Supprimer le commentaire "Constantes locales terrain (pas de token)" devenu obsolète
- [ ] **T9** — QA scan : `grep -n "#[0-9a-fA-F]" dashboard/page.tsx` doit retourner 0 résultat hex terrain (les hex restants doivent être dans des tokens importés, pas inline)
- [ ] **T10** — `cd aureak && npx tsc --noEmit` — 0 erreur TypeScript

---

## Fichiers modifiés

1. `aureak/packages/theme/src/tokens.ts` — ajout `colors.terrain` + constantes gradient exportées
2. `aureak/apps/web/app/(admin)/dashboard/page.tsx` — remplacement des 3 gradients hardcodés

---

## Dépendances

Aucune story en dépendance. Modification purement cosmétique / tokens, aucune migration Supabase requise.

---

## Notes techniques

- **Aucun nouveau composant** — uniquement migration de valeurs hardcodées vers tokens
- **Compatibilité** : `colors.dark.hover = #2A2A2A` vs `#2A2827` (original) — différence imperceptible (2 pts), acceptable pour alignement sur les tokens
- **Pas de breaking change** : les tokens `colors.terrain` sont additifs, aucun token existant n'est modifié
- **Pattern attendu dans tokens.ts** :
  ```typescript
  terrain: {
    darkForest : '#1a472a',
    midGreen   : '#2d6a4f',
    lightGreen : '#40916c',
    deepForest : '#1B4332',
  },
  ```
  Et les gradients :
  ```typescript
  export const TERRAIN_GRADIENT_DARK   = `linear-gradient(135deg, ${colors.terrain.darkForest} 0%, ${colors.terrain.midGreen} 60%, ${colors.terrain.darkForest} 100%)`
  export const TERRAIN_GRADIENT_HEADER = `linear-gradient(135deg, ${colors.terrain.deepForest} 0%, ${colors.terrain.midGreen} 50%, ${colors.terrain.lightGreen} 100%)`
  ```
- **Ordre dans tokens.ts** : ajouter `terrain` après `entity` (même bloc couleurs thématiques) ; exporter les constantes gradient après l'export `colors`

---

## Commit attendu

```
fix(design): gradients terrain dashboard → tokens @aureak/theme (story 47-7)
```
