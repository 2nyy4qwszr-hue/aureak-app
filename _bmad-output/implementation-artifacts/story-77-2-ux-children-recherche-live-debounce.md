# Story 77.2 : UX /children — Recherche live avec debounce 300ms (suppression validation manuelle)

Status: done

## Story

En tant qu'admin consultant l'annuaire joueurs (/children),
je veux que la liste se mette à jour automatiquement au fur et à mesure que je tape dans le champ de recherche (debounce 300ms),
afin de ne plus avoir à appuyer sur "Chercher" ou Entrée pour déclencher la recherche.

## Acceptance Criteria

1. La liste de joueurs se met à jour automatiquement 300ms après le dernier caractère saisi dans le champ de recherche — sans action manuelle (pas de bouton, pas de touche Entrée requise).
2. Le bouton "Chercher" est supprimé de l'interface — le `<Pressable style={s.searchBtn}>` et son contenu disparaissent complètement.
3. `onSubmitEditing` est supprimé du `<TextInput>` (ou conservé uniquement pour fermer le clavier mobile, sans effet sur la recherche).
4. Le bouton "✕" (clear) reste fonctionnel et vide immédiatement le champ ET réinitialise `search` (sans délai de debounce).
5. L'état `search` (qui déclenche l'API) et `searchInput` (valeur brute du champ) restent distincts — seul `search` déclenche `load()`.
6. La pagination est réinitialisée à la page 0 lors de chaque nouveau déclenchement de recherche via debounce (comportement identique à l'actuel via `useEffect([search, ...])`).
7. Aucune regression sur les filtres complémentaires (statut académie, saison, stage, année naissance, tier pills) — ils continuent de fonctionner indépendamment.

## Tasks / Subtasks

- [x] T1 — Ajouter le debounce dans `children/index.tsx` (AC: 1, 5, 6)
  - [x] T1.1 — Dans le bloc des états (ligne ~976), ajouter un `useRef` de timer : `const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)`
  - [x] T1.2 — Remplacer le handler `onChangeText` du `<TextInput>` : à chaque changement, (a) appeler `setSearchInput(text)`, (b) annuler le timer précédent via `clearTimeout`, (c) créer un nouveau timer 300ms qui appelle `setSearch(text.trim())`
  - [x] T1.3 — Supprimer la fonction `handleSearch` (ligne 1083) — elle n'est plus nécessaire
  - [x] T1.4 — Supprimer `onSubmitEditing={handleSearch}` du `<TextInput>` (ligne 1377)

- [x] T2 — Supprimer le bouton "Chercher" (AC: 2)
  - [x] T2.1 — Supprimer le bloc `<Pressable style={s.searchBtn} onPress={handleSearch}>…</Pressable>` (lignes 1387–1391)
  - [x] T2.2 — Supprimer le style `searchBtn` de `StyleSheet.create` (ligne ~1701)

- [x] T3 — Adapter le bouton clear pour contourner le debounce (AC: 4)
  - [x] T3.1 — Dans le handler du bouton "✕" (ligne 1393), annuler le timer debounce en cours avant de setter `setSearch('')` et `setSearchInput('')` — garantit un clear immédiat sans attente de 300ms

- [x] T4 — Nettoyage du timer au démontage du composant (AC: 1)
  - [x] T4.1 — Ajouter un `useEffect` de cleanup qui retourne `() => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }` avec dépendances vides `[]`

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Taper "Dupont" lettre par lettre : vérifier que la liste se met à jour 300ms après la dernière frappe, sans appui Entrée ni bouton
  - [x] T5.2 — Vérifier que le bouton "Chercher" n'est plus visible dans la barre de recherche
  - [x] T5.3 — Cliquer "✕" : vérifier que le champ est vidé et la liste revient à l'état non-filtré immédiatement
  - [x] T5.4 — Vérifier qu'un filtre statut (ex: "Académicien") combiné à une recherche live fonctionne correctement
  - [x] T5.5 — Vérifier absence d'erreurs console (NODE_ENV guard respecté)

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, TextInput) — pas de Tailwind, pas de className
- **Tamagui** : XStack, YStack, Text — uniquement dans `_layout.tsx`
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T1 — Pattern debounce via useRef (pas de librairie externe)

Le projet n'utilise pas `lodash.debounce` — implémenter via `useRef` + `setTimeout` natif.

```tsx
import React, { useRef, useEffect, useState, useCallback } from 'react'

// Dans le composant, après les autres useState :
const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

// Handler onChangeText du TextInput :
const handleSearchInput = (text: string) => {
  setSearchInput(text)
  if (debounceTimer.current) clearTimeout(debounceTimer.current)
  debounceTimer.current = setTimeout(() => {
    setSearch(text.trim())
  }, 300)
}

// Cleanup au démontage :
useEffect(() => {
  return () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }
}, [])
```

---

### T3 — Handler clear sans debounce

```tsx
// Bouton ✕ — clear immédiat, annule le debounce en cours
onPress={() => {
  if (debounceTimer.current) clearTimeout(debounceTimer.current)
  setSearch('')
  setSearchInput('')
}}
```

---

### Design

**Type design** : `polish`

Aucun changement visuel significatif — seul le bouton "Chercher" disparaît, l'espace libéré est absorbé naturellement par le `flexDirection: 'row'` existant du `searchRow`. Pas de nouveau token, pas de nouvelle couleur.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | Modifier | Debounce 300ms + suppression bouton Chercher + clear immédiat |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/admin/child-directory.ts` — aucun changement API (la story est UI uniquement)
- `aureak/packages/types/src/entities.ts` — aucun nouveau type
- Tous les autres fichiers de la page `/children/` (`_avatarHelpers.ts`, etc.) — non impactés

---

### Dépendances à protéger

- Story 52-5 (tier pills) utilise `joueurs` filtré côté serveur — ne pas modifier `load()` ni ses dépendances
- Story 52-12 (master-detail split-screen) utilise `selected` dans les params URL — ne pas toucher `router.setParams`
- Story 55-6 (filtre "En danger") utilise `dangerPlayerIds` — non impacté

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/children/index.tsx`
  - État `searchInput` / `search` : lignes 976–977
  - `handleSearch` (à supprimer) : ligne 1083
  - `<TextInput>` avec `onSubmitEditing` : lignes 1373–1386
  - Bouton "Chercher" (à supprimer) : lignes 1387–1391
  - Bouton "✕" clear (à adapter) : lignes 1392–1396
  - Style `searchBtn` (à supprimer) : ligne ~1701

---

### Multi-tenant

Sans impact — aucune donnée tenant-spécifique touchée. RLS gère l'isolation côté Supabase.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/index.tsx` | À modifier |
