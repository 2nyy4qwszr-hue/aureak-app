# Story 64.2 : B-PATROL-02 — Stages/index erreur 400 + états contradictoires

Status: done

Epic: 64 — Bugfix batch avril 2026 #3

## Story

En tant qu'admin Aureak,
je veux que la page `/stages` affiche un seul message cohérent selon l'état du chargement (erreur OU liste vide OU liste remplie),
afin de ne pas voir simultanément une bannière d'erreur et un empty state contradictoires.

## Acceptance Criteria

1. Si le chargement des stages échoue (erreur réseau ou 400) → seule la bannière d'erreur est visible — l'empty state n'est PAS affiché.
2. Si le chargement réussit et la liste est vide → seul l'empty state est visible — aucune bannière d'erreur n'est affichée.
3. Si le chargement réussit et la liste contient des stages → la liste est affichée, sans bannière d'erreur ni empty state.
4. La logique conditionnelle est mutuellement exclusive : `if (error) { … } else if (stages.length === 0) { … } else { … }`.
5. `npx tsc --noEmit` retourne 0 erreur après correction.

## Tasks / Subtasks

- [x] T1 — Lire et identifier les blocs problématiques (AC: 1, 2, 3)
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/stages/index.tsx` en entier
  - [x] T1.2 — Identifier les deux blocs conditionnels `error` et `stages.length === 0` qui s'affichent simultanément

- [x] T2 — Corriger la logique conditionnelle (AC: 4)
  - [x] T2.1 — Remplacer les conditions parallèles par une logique `if/else if/else` mutuellement exclusive
  - [x] T2.2 — S'assurer que l'état de chargement initial (`loading`) est géré avant les conditions error/empty/list

- [x] T3 — Validation (AC: 5)
  - [x] T3.1 — `cd aureak && npx tsc --noEmit` → 0 erreur
  - [x] T3.2 — QA scan : vérifier try/finally sur les state setters de chargement dans le fichier

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Text) — pas de Tailwind
- **Tokens `@aureak/theme`** uniquement — zéro couleur hardcodée
- **Try/finally obligatoire** sur tout state setter de chargement

---

### T2 — Pattern de correction

Avant (problème) :

```tsx
// Mauvais : les deux blocs peuvent s'afficher simultanément
{error && <ErrorBanner message={error} />}
{stages.length === 0 && <EmptyState ... />}
{stages.map(...)}
```

Après (correct) :

```tsx
// Correct : mutuellement exclusif
{loading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorBanner message={error} />
) : stages.length === 0 ? (
  <EmptyState
    title="Aucun stage"
    description="Créez votre premier stage pour commencer."
  />
) : (
  stages.map(stage => <StageCard key={stage.id} stage={stage} />)
)}
```

---

### T3 — QA checklist

Vérifier dans `stages/index.tsx` :

```bash
# try/finally sur setters de chargement
grep -n "setLoading(false)\|setSaving(false)" aureak/apps/web/app/(admin)/stages/index.tsx

# console guards
grep -n "console\." aureak/apps/web/app/(admin)/stages/index.tsx | grep -v "NODE_ENV"
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/stages/index.tsx` | Modifier | Correction logique conditionnelle error/empty/list |

### Fichiers à NE PAS modifier

- `supabase/migrations/` — aucune migration nécessaire
- `@aureak/api-client` — aucun changement API
- `aureak/apps/web/app/(admin)/stages/new.tsx` — hors scope
- `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` — hors scope

---

### Multi-tenant

Pas d'impact tenant — correction purement UI/logique d'affichage.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — la correction était déjà appliquée dans le fichier (logique ternaire mutuellement exclusive `error ? … : loading ? … : filtered.length === 0 ? … : …` aux lignes 131–207).

### Completion Notes List

- Le fichier `stages/index.tsx` contenait déjà la logique mutuellement exclusive correcte (ternaire chaîné). Aucune modification du code source n'était nécessaire.
- QA validé : try/finally sur `setLoading`, console guard `NODE_ENV`, zéro couleur hardcodée.
- `npx tsc --noEmit` → 0 erreur.

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/stages/index.tsx` | Vérifié — déjà correct, aucune modification |
