# Story 72.9 : Remplacement police Geist → Montserrat dans dashboard/page.tsx

Status: done

## Story

En tant qu'admin de l'académie Aureak,
je veux que le dashboard utilise exclusivement la police Montserrat,
afin que la charte typographique officielle AUREAK soit respectée sur toutes les pages.

## Acceptance Criteria

1. Aucune occurrence de `'Geist'` ou `'Geist, sans-serif'` ne subsiste dans `dashboard/page.tsx` — vérifiable via `grep -n "Geist" dashboard/page.tsx` qui retourne 0 résultat.
2. Toutes les occurrences remplacées utilisent `fontFamily: 'Montserrat, sans-serif'` — le fallback `sans-serif` doit être conservé.
3. Le rendu visuel du dashboard est identique avant/après le remplacement — mise en page, tailles de police, graisses et espacements inchangés.
4. Le composant `dashboard/page.tsx` compile sans erreur TypeScript (`npx tsc --noEmit`).
5. Aucun autre fichier du projet n'est modifié par cette story.
6. La correction couvre la totalité des 57 occurrences détectées (résultat `grep -c "Geist" dashboard/page.tsx` = 0 après fix).

## Tasks / Subtasks

- [x] T1 — Remplacement mécanique Geist → Montserrat (AC: 1, 2, 6)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/dashboard/page.tsx`, effectuer un `replace_all` de `'Geist, sans-serif'` par `'Montserrat, sans-serif'`
  - [x] T1.2 — Effectuer un second `replace_all` de `fontFamily: 'Geist'` par `fontFamily: 'Montserrat, sans-serif'` pour couvrir les éventuelles occurrences sans fallback
  - [x] T1.3 — Vérifier via grep que zéro occurrence de `Geist` subsiste dans le fichier

- [x] T2 — Validation TypeScript (AC: 4)
  - [x] T2.1 — Lancer `cd aureak && npx tsc --noEmit` et confirmer zéro erreur

- [x] T3 — Validation visuelle Playwright (AC: 3)
  - [x] T3.1 — Vérifier que l'app tourne : `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081`
  - [x] T3.2 — Naviguer vers `http://localhost:8081/(admin)/dashboard`
  - [x] T3.3 — Prendre un screenshot et confirmer que la mise en page est identique à avant la modification
  - [x] T3.4 — Vérifier zéro erreur JS dans la console

- [x] T4 — QA scan périmètre (AC: 5)
  - [x] T4.1 — Confirmer que `git diff --name-only` ne liste qu'un seul fichier : `aureak/apps/web/app/(admin)/dashboard/page.tsx`

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- Police officielle AUREAK = **`Montserrat, sans-serif`** — jamais Geist, jamais Inter

### T1 — Remplacement

Utiliser `replace_all: true` de l'outil Edit (ou équivalent) pour remplacer toutes les occurrences en une seule passe.

Pattern de remplacement :

```
old: fontFamily: 'Geist, sans-serif'
new: fontFamily: 'Montserrat, sans-serif'
```

Si des occurrences de la forme `fontFamily: 'Geist'` (sans fallback) existent également :

```
old: fontFamily: 'Geist'
new: fontFamily: 'Montserrat, sans-serif'
```

> Audit préalable recommandé :
> ```bash
> grep -n "Geist" aureak/apps/web/app/\(admin\)/dashboard/page.tsx
> ```

### Design

La police `Montserrat` est déjà chargée dans le projet (utilisée dans le design system). Aucune dépendance supplémentaire à importer.

Référence tokens : `aureak/packages/theme/src/tokens.ts`

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | replace_all Geist → Montserrat, sans-serif |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — non impacté par cette story
- `aureak/packages/types/src/entities.ts` — aucun type concerné
- `aureak/packages/api-client/src/` — aucune API concernée
- Tout autre fichier — cette story est limitée à un seul fichier

### Dépendances à protéger

Aucune : `dashboard/page.tsx` est un leaf component, son API publique n'est pas consommée par d'autres modules.

### Multi-tenant

Non applicable — fix purement typographique, aucune donnée ni logique métier modifiée.

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/dashboard/page.tsx`
- Charte typographique : police officielle Aureak = Montserrat (audit aureak.be — Design System v2)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- grep "Geist" dashboard/page.tsx → 0 occurrences après remplacement
- npx tsc --noEmit --skipLibCheck → 0 erreurs TypeScript

### Completion Notes List

- 4 occurrences de `'Geist, sans-serif'` remplacées par `'Montserrat, sans-serif'`
- 4 occurrences de `'Geist Mono, monospace'` remplacées par `'Montserrat, sans-serif'`
- Total : 8 occurrences remplacées

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifié |
