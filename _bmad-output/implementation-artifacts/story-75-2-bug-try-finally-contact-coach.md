# Story 75.2 : Bug — try/finally manquant sur setSending et setLoadingHistory dans contact.tsx

Status: done

## Story

En tant qu'admin,
je veux que le formulaire de contact coach reste utilisable après une erreur réseau,
afin que les états "Envoi en cours…" et "Chargement de l'historique…" ne restent pas bloqués à `true` si l'appel API échoue.

## Acceptance Criteria

1. `setSending(false)` est appelé dans un bloc `finally` dans `handleSend` — garanti même si `sendAdminMessage` lève une exception.
2. `setLoadingHistory(false)` est appelé dans un bloc `finally` dans `loadHistory` — garanti même si `listAdminMessages` lève une exception.
3. Aucune valeur `true` résiduelle sur `sending` ou `loadingHistory` après une erreur simulée (appel API qui rejette).
4. Le bouton "Envoyer" redevient cliquable après une erreur d'envoi (état `sending` réinitialisé).
5. Le spinner de chargement de l'historique disparaît après une erreur de chargement (état `loadingHistory` réinitialisé).
6. Les `console.error` de chaque catch sont gardés derrière `if (process.env.NODE_ENV !== 'production')`.
7. Aucun autre comportement visible n'est modifié (formulaire, historique, urgence, succès).

## Tasks / Subtasks

- [x] T1 — Corriger handleSend dans contact.tsx (AC: 1, 3, 4, 6)
  - [x] T1.1 — Déplacer `setSending(false)` du bloc `catch` vers un bloc `finally` dédié dans `handleSend` (`aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx`)
  - [x] T1.2 — Vérifier que le `console.error` existant est bien gardé par `process.env.NODE_ENV !== 'production'`

- [x] T2 — Corriger loadHistory dans contact.tsx (AC: 2, 3, 5, 6)
  - [x] T2.1 — Déplacer `setLoadingHistory(false)` du bloc `catch` (ou de la position inline) vers un bloc `finally` dédié dans `loadHistory`
  - [x] T2.2 — Vérifier que le `console.error` existant est bien gardé par `process.env.NODE_ENV !== 'production'`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Naviguer sur `/coaches/{un-coach-id}/contact` et vérifier que l'historique se charge et que le spinner disparaît
  - [x] T3.2 — Envoyer un message valide et vérifier que le bouton redevient actif après envoi
  - [x] T3.3 — Vérifier avec un grep que `setSending(false)` et `setLoadingHistory(false)` se trouvent uniquement dans des blocs `finally`
  - [x] T3.4 — Vérifier zéro `console.` non-guardé dans le fichier modifié

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

### T1/T2 — Pattern try/finally obligatoire

Le pattern exact à appliquer sur les deux handlers :

```tsx
// handleSend — CORRECT
const handleSend = async () => {
  if (!message.trim()) return
  setSending(true)
  setSuccess(false)
  try {
    const result = await sendAdminMessage(coachId, message.trim(), urgency)
    if (!result.error) {
      setMessage('')
      setSuccess(true)
      await loadHistory()
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[ContactCoachPage] handleSend error:', err)
  } finally {
    setSending(false)   // ← garanti même si exception
  }
}

// loadHistory — CORRECT
const loadHistory = async () => {
  setLoadingHistory(true)
  try {
    const result = await listAdminMessages(coachId)
    setHistory((result.data as AdminMessage[]) ?? [])
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[ContactCoachPage] loadHistory error:', err)
  } finally {
    setLoadingHistory(false)   // ← garanti même si exception
  }
}
```

Pattern de référence déjà appliqué dans le projet :
- `aureak/apps/web/app/(admin)/messages/index.tsx:56-70` — même pattern setSending dans finally
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx:1654-1694` — même pattern setLoadingHistory dans finally

**QA grep à passer après correction :**
```bash
grep -n "setSending(false)\|setLoadingHistory(false)" aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx
# Toutes les occurrences doivent être dans des blocs finally (vérifier visuellement le contexte)
grep -n "console\." aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx | grep -v "NODE_ENV"
# Zéro résultat attendu
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx` | Modifier | Ajouter `finally` sur `handleSend` et `loadHistory` |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/coaches/[coachId]/page.tsx` — non impacté par ce bug
- `aureak/packages/api-client/src/` — aucune modification API nécessaire
- `supabase/migrations/` — pas de migration pour ce bug UI

---

### Dépendances à protéger

- `sendAdminMessage` et `listAdminMessages` dans `@aureak/api-client` — ne pas modifier leur signature
- Le reste de l'UI contact.tsx (styles, rendu JSX, logique urgence) — ne pas toucher

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Fichier cible : `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx`
- Pattern de référence try/finally : `aureak/apps/web/app/(admin)/messages/index.tsx` lignes 56-70
- Pattern de référence try/finally historique : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` lignes 1654-1694

---

### Multi-tenant

RLS gère l'isolation — aucun paramètre tenantId à ajouter. Cette correction est purement UI/état local.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
N/A

### Completion Notes List
- Le fichier contact.tsx était déjà conforme avant l'implémentation : `setSending(false)` en ligne 54 (finally), `setLoadingHistory(false)` en ligne 34 (finally), zéro console non-guardé. La story était déjà résolue par un commit précédent (patrouille).

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/coaches/[coachId]/contact.tsx` | Déjà conforme — aucune modification nécessaire |
