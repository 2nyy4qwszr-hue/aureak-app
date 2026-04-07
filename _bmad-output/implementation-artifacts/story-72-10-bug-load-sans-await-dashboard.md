# Story 72.10 : BUG — `load()` appelé sans `await` dans `handlePresetChange` et `handleApplyCustom`

Status: done

## Story

En tant qu'admin consultant le dashboard,
je veux que le rechargement des données soit correctement attendu lorsque je change la période ou applique une plage personnalisée,
afin d'éviter des états de chargement incohérents causés par des appels asynchrones non contrôlés.

## Acceptance Criteria

1. Dans `handlePresetChange`, l'appel `load(f, t)` est précédé de `await` et la fonction est déclarée `async`.
2. Dans `handleApplyCustom`, l'appel `load(customFrom, customTo)` est précédé de `await` et la fonction est déclarée `async`.
3. Aucun autre appel `load()` dans le composant principal du dashboard n'est non-awaited dans un contexte async (hors `useEffect` non-async volontaire).
4. Le state `loading` passe bien à `false` après chaque rechargement déclenché par un changement de preset ou une plage personnalisée (comportement garanti par le `finally` déjà présent dans `load`).
5. Aucune régression : le `useEffect` initial (`useEffect(() => { load() }, [])`) reste inchangé — il n'est pas async et n'a pas vocation à l'être (fire-and-forget intentionnel avec cleanup controller géré séparément).
6. Aucune nouvelle couleur hardcodée ni style inline ajouté — seule la logique async est corrigée.
7. Le TypeScript compile sans erreur (`npx tsc --noEmit`) après le fix.

## Tasks / Subtasks

- [x] T1 — Corriger `handlePresetChange` (AC: 1, 4)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/dashboard/page.tsx`, ligne ~2274 : changer `const handlePresetChange = (p: Preset) => {` en `const handlePresetChange = async (p: Preset) => {`
  - [x] T1.2 — Ligne ~2279 : changer `load(f, t)` en `await load(f, t)`

- [x] T2 — Corriger `handleApplyCustom` (AC: 2, 4)
  - [x] T2.1 — Ligne ~2283 : changer `const handleApplyCustom = () => {` en `const handleApplyCustom = async () => {`
  - [x] T2.2 — Ligne ~2285 : changer `load(customFrom, customTo)` en `await load(customFrom, customTo)`

- [x] T3 — Audit complet des appels `load()` dans le fichier (AC: 3)
  - [x] T3.1 — Grep `load()` sur `dashboard/page.tsx` et vérifier que tous les autres appels sont soit : (a) dans un `useEffect` fire-and-forget intentionnel, (b) déjà awaités dans un contexte async
  - [x] T3.2 — Ne pas toucher `useEffect(() => { load() }, [])` ligne ~2288 — c'est du fire-and-forget volontaire

- [x] T4 — Validation (AC: tous)
  - [x] T4.1 — Lancer `cd aureak && npx tsc --noEmit` : zéro erreur TypeScript
  - [ ] T4.2 — Naviguer sur http://localhost:8081/(admin)/dashboard — le dashboard se charge correctement
  - [ ] T4.3 — Changer le preset (ex: "7 jours" → "30 jours") : vérifier que `loading` passe à `true` puis `false` sans état suspendu
  - [ ] T4.4 — Sélectionner une plage personnalisée et cliquer "Appliquer" : vérifier le même comportement qu'en T4.3
  - [ ] T4.5 — Vérifier zéro erreur console JS

## Dev Notes

### Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1/T2 — Correction exacte (diff minimal)

**Avant (ligne ~2274) :**
```tsx
const handlePresetChange = (p: Preset) => {
  setPreset(p)
  if (p !== 'custom') {
    const { from: f, to: t } = getPresetDates(p)
    setFrom(f); setTo(t)
    load(f, t)
  }
}

const handleApplyCustom = () => {
  setFrom(customFrom); setTo(customTo)
  load(customFrom, customTo)
}
```

**Après :**
```tsx
const handlePresetChange = async (p: Preset) => {
  setPreset(p)
  if (p !== 'custom') {
    const { from: f, to: t } = getPresetDates(p)
    setFrom(f); setTo(t)
    await load(f, t)
  }
}

const handleApplyCustom = async () => {
  setFrom(customFrom); setTo(customTo)
  await load(customFrom, customTo)
}
```

---

### T3 — Audit des appels `load()` existants

Appels identifiés dans `dashboard/page.tsx` :

| Ligne | Contexte | Action |
|-------|----------|--------|
| ~2279 | `handlePresetChange` (sync → doit être async) | **Ajouter `await`** |
| ~2285 | `handleApplyCustom` (sync → doit être async) | **Ajouter `await`** |
| ~2288 | `useEffect(() => { load() }, [])` | Ne pas modifier — fire-and-forget intentionnel |

La fonction `load` est déjà `async` (ligne ~2233 : `const load = async (f = from, t = to) => {`) et possède déjà un bloc `try/finally` complet qui garantit `setLoading(false)`. Le bug est uniquement dans les appelants non-awaités.

---

### Pourquoi ce bug est bloquant

Sans `await`, si l'utilisateur change rapidement de preset :
1. Deux appels `load()` s'exécutent en concurrence
2. Le second appel peut résoudre avant le premier → les données affichées correspondent au mauvais preset
3. `setLoading(false)` du premier appel peut s'exécuter alors que le second est encore en cours → le spinner disparaît prématurément

---

### Aucune migration DB

Ce fix est 100% frontend — aucune migration Supabase requise.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | Modifier | Ajouter `async` + `await` sur 2 handlers — diff de 4 tokens exactement |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` — tout sauf les 2 handlers ciblés
- `aureak/packages/api-client/src/` — aucune API touchée
- `aureak/packages/types/src/` — aucun type touché
- `supabase/migrations/` — aucune migration

---

### Dépendances à protéger

- La signature de `load(f?, t?)` ne change pas — seuls les appelants sont modifiés
- Le `useEffect(() => { load() }, [])` ligne ~2288 reste intact — ne pas le rendre async

---

### Références

- Fichier cible : `aureak/apps/web/app/(admin)/dashboard/page.tsx` lignes 2274–2286
- Fonction `load` : même fichier, ligne ~2233
- Pattern try/finally : CLAUDE.md — "Try/finally obligatoire sur TOUT state setter de chargement/sauvegarde"

---

### Multi-tenant

Non applicable — ce fix ne touche pas à la logique de données ni aux RLS.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/dashboard/page.tsx` | À modifier |
