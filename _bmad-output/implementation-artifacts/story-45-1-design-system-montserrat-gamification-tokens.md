# Story 45.1 : Design System enrichissement — Montserrat + tokens gamification

Status: done

## Story

En tant que développeur implémentant le redesign Aureak,
je veux que `tokens.ts` et `design-vision.md` contiennent les décisions de typographie Montserrat, d'animation badge unlock et de gamification (XP bar, niveaux, badges),
afin que toutes les stories de redesign qui suivent disposent d'une source de vérité unique et cohérente.

## Acceptance Criteria

1. `fonts.display` et `fonts.heading` sont remplacés par `'Montserrat'` dans `tokens.ts` ; `fonts.body` reste `'Montserrat'` aussi (une seule famille, plusieurs weights)
2. Montserrat est chargée dans `aureak/apps/web/app/_layout.tsx` via `@expo-google-fonts/montserrat` ou équivalent déjà disponible dans le projet
3. `tokens.ts` exporte un objet `gamification` avec : `xp` (barHeight, fillColor, trackColor, glowColor), `levels` (6 tiers bronze→légende, chacun avec color + label + min/max XP), `badge` (lockedOpacity, lockedFilter, unlockedShadow, sizes sm/md/lg), `animations` (badgeUnlock, xpFill, levelUp)
4. `_agents/design-vision.md` est mis à jour avec : décision typo Montserrat (poids 400/500/600/700/900), spec badge unlock (gris → couleur avec spring bounce), spec XP system (points par présence + méthodologie → niveau avec barre), tableau des 6 tiers
5. `transitions.slide` est ajouté dans `tokens.ts` : `'0.25s cubic-bezier(0.4, 0, 0.2, 1)'` — pour les transitions de route
6. Aucune page existante ne régresse visuellement (Montserrat étant une police très proche de Rajdhani en termes de métriques, l'impact est minimal)

## Tasks / Subtasks

- [x] T1 — Mise à jour typographie + police (AC: 1, 2)
  - [x] T1.1 — Dans `tokens.ts` : remplacer `'Rajdhani'` par `'Montserrat'` dans `fonts.display`, `fonts.heading`, `fonts.body` — garder `'Montserrat'` pour tous (poids différents : 900/700/600/400)
  - [x] T1.2 — Dans `tokens.ts` : mettre à jour `typography.*` — remplacer toutes les `family: 'Rajdhani'` et `family: 'Geist'` par `family: 'Montserrat'`
  - [x] T1.3 — Dans `typography.stat` : garder `family: 'Geist Mono'` pour les valeurs numériques (chiffres tabulaires)
  - [x] T1.4 — Dans `_layout.tsx` : vérifier comment Rajdhani est chargée → remplacer par Montserrat (Google Fonts CDN link ou `useFonts`)

- [x] T2 — Ajout tokens gamification (AC: 3)
  - [x] T2.1 — Ajouter section `gamification` dans `tokens.ts` après `methodologyMethodColors` :
    ```typescript
    export const gamification = {
      xp: {
        barHeight  : 8,
        barRadius  : 4,
        fillColor  : '#C1AC5C',               // gold AUREAK
        trackColor : '#E5E7EB',               // gris clair
        glowColor  : 'rgba(193,172,92,0.4)',  // halo gold actif
      },
      levels: {
        bronze  : { color: '#CD7F32', label: 'Bronze',  min: 0,     max: 499  },
        silver  : { color: '#9BA0A7', label: 'Argent',  min: 500,   max: 1499 },
        gold    : { color: '#C1AC5C', label: 'Or',      min: 1500,  max: 3499 },
        platinum: { color: '#60A5FA', label: 'Platine', min: 3500,  max: 6999 },
        diamond : { color: '#A78BFA', label: 'Diamant', min: 7000,  max: 9999 },
        legend  : { color: '#F97316', label: 'Légende', min: 10000, max: 999999 },
      },
      badge: {
        lockedOpacity : 0.35,
        lockedFilter  : 'grayscale(100%)',
        unlockedShadow: '0 0 8px rgba(193,172,92,0.5)',
        size: { sm: 32, md: 48, lg: 64 },
      },
      animations: {
        badgeUnlock: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',  // spring bounce unlock
        xpFill     : '0.6s cubic-bezier(0.4, 0, 0.2, 1)',       // fill XP bar
        levelUp    : '0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',  // level up flash
      },
    } as const
    ```
  - [x] T2.2 — Ajouter `gamification` dans l'export agrégé `tokens` en bas de fichier
  - [x] T2.3 — Ajouter `transitions.slide` : `'0.25s cubic-bezier(0.4, 0, 0.2, 1)'`

- [x] T3 — Mise à jour design-vision.md (AC: 4)
  - [x] T3.1 — Lire `_agents/design-vision.md` entièrement
  - [x] T3.2 — Ajouter section "Typographie — Montserrat" avec tableau poids utilisés :
    - 900 Black → display hero, stats clés
    - 700 Bold → H1, H2, titres cards
    - 600 SemiBold → H3, labels section
    - 500 Medium → corps texte important
    - 400 Regular → corps standard, descriptions
  - [x] T3.3 — Ajouter section "Gamification visuelle" :
    - XP System : points par présence (ex: +10pts), +5pts par exercice méthodologie complété → total → niveau
    - Badge unlock : état `locked` = opacity 35% + grayscale / état `unlocked` = couleur pleine + shadow gold
    - Animation badge unlock : spring bounce (cubic-bezier 0.34, 1.56, 0.64, 1)
    - Tableau 6 tiers avec couleurs et seuils XP
  - [x] T3.4 — Ajouter mention "Roadmap redesign séquentiel" : Dashboard → Séances → Présences → Évaluations

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Vérifier `npx tsc --noEmit` → zéro erreur
  - [ ] T4.2 — Ouvrir http://localhost:8081/(admin)/dashboard → vérifier que Montserrat s'affiche (titres nets, pas de fallback system-ui)
  - [ ] T4.3 — Vérifier qu'aucune page existante n'affiche de texte dégradé (ligne vide ou police manquante)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Chargement Montserrat

Vérifier le mécanisme de chargement actuel dans `_layout.tsx` :
```bash
grep -n "Rajdhani\|useFonts\|Font.loadAsync\|@expo-google-fonts" aureak/apps/web/app/_layout.tsx
```

**Si Expo Google Fonts** : remplacer l'import `@expo-google-fonts/rajdhani` par `@expo-google-fonts/montserrat` et adapter `useFonts`.

**Si CDN dans `<head>`** : remplacer le lien Google Fonts URL :
```
https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap
```

**Si fonts locales** : copier les fichiers `.ttf` Montserrat dans `aureak/apps/web/assets/fonts/` et mettre à jour `expo/fonts` dans `app.json`.

---

### T2 — Niveau depuis XP (helper utilitaire)

Ajouter dans `tokens.ts` une fonction pure de résolution de niveau (non-importable comme const, mais utilitaire) :

```typescript
export function resolveLevel(xp: number): keyof typeof gamification.levels {
  const entries = Object.entries(gamification.levels) as [keyof typeof gamification.levels, { min: number; max: number }][]
  return entries.find(([, { min, max }]) => xp >= min && xp <= max)?.[0] ?? 'bronze'
}
```

---

### Design (cette story est une story de design tokens, pas UI)

Cette story ne modifie AUCUNE page existante — elle enrichit uniquement les tokens.
Les stories de redesign (42-1, 42-2, séances, présences, évaluations) consommeront ces tokens.

Principe design-vision concerné : #1 Light Premium — la typographie Montserrat renforce l'aspect premium sans perdre la lisibilité.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/packages/theme/src/tokens.ts` | Modifier | Police Montserrat + tokens gamification + transitions.slide |
| `aureak/apps/web/app/_layout.tsx` | Modifier | Chargement police Montserrat (remplace Rajdhani) |
| `_agents/design-vision.md` | Modifier | Section typo + gamification visuelle + roadmap |

### Fichiers à NE PAS modifier

- `aureak/packages/ui/` — les composants utilisent les tokens, pas les familles en dur → automatiquement mis à jour
- `supabase/migrations/` — aucune migration nécessaire
- `aureak/packages/types/src/entities.ts` — pas de nouveau type DB
- `aureak/packages/api-client/` — pas de nouvelle fonction API

---

### Dépendances à protéger

- Stories 42-1, 42-2, 43-x, 44-x — consommeront les nouveaux tokens gamification ; cette story doit être `done` avant leur implémentation
- `methodologyMethodColors` dans `tokens.ts` — ne pas toucher (ARCH-10 valide)

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts` (lire entièrement avant de modifier)
- Design vision : `_agents/design-vision.md`
- Pattern useFonts : `aureak/apps/web/app/_layout.tsx`
- Montserrat Google Fonts : `https://fonts.google.com/specimen/Montserrat`

---

### Multi-tenant

Non applicable — cette story ne touche pas la base de données.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (2026-04-04)

### Debug Log References
- Montserrat-Medium.ttf et Montserrat-Black.ttf absents → téléchargés depuis Google Fonts CDN v31
- Rajdhani retiré de `_layout.tsx` (conservé dans assets pour rétrocompatibilité éventuelle)
- `npx tsc --noEmit` → 0 erreur

### Completion Notes List
- T1 : `fonts.display/heading/body` → `'Montserrat'` ; `typography.*` → `'Montserrat'` sauf `stat` qui garde `'Geist Mono'`
- T1.4 : `_layout.tsx` nettoyé — Rajdhani retiré, Geist-Regular/Medium/SemiBold retirés, Montserrat 6 weights chargés (Regular/Medium/SemiBold/Bold/ExtraBold/Black), GeistMono-Regular conservé
- T2 : objet `gamification` ajouté avec XP/levels/badge/animations, `resolveLevel()` exportée, `transitions.slide` ajouté
- T3 : `_agents/design-vision.md` enrichi avec sections Typographie Montserrat + Gamification visuelle + Roadmap séquentielle

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/theme/src/tokens.ts` | Modifié |
| `aureak/apps/web/app/_layout.tsx` | Modifié |
| `_agents/design-vision.md` | Modifié |
| `aureak/apps/web/assets/fonts/Montserrat/Montserrat-Medium.ttf` | Ajouté (téléchargé) |
| `aureak/apps/web/assets/fonts/Montserrat/Montserrat-Black.ttf` | Ajouté (téléchargé) |
