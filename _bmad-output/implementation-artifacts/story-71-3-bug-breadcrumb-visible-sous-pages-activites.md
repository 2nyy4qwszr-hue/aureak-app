# Story 71.3 : Bug — Breadcrumb visible sur les sous-pages Activités (Présences, Évaluations)

Status: done

## Story

En tant qu'admin,
je veux que la bande de chemin (breadcrumb) ne s'affiche pas sur les sous-pages Activités (/activites/presences, /activites/evaluations),
afin que l'expérience soit identique à l'onglet principal Séances (/activites).

## Acceptance Criteria

1. Sur `/activites/presences` : aucun composant breadcrumb affiché — le header ActivitesHeader apparaît directement sous la sidebar, sans bande de chemin au-dessus
2. Sur `/activites/evaluations` : même comportement
3. Sur `/activites` (Séances) : comportement inchangé
4. Sur les autres pages admin (ex: `/dashboard`, `/children`) : le breadcrumb reste intact
5. TypeScript compile sans erreur

## Tasks / Subtasks

- [x] T1 — Conditionner le breadcrumb dans le layout admin (AC: 1, 2, 3, 4)
  - [x] T1.1 — Dans `aureak/apps/web/app/(admin)/_layout.tsx`, ligne ~1091, trouver `{!isMobile && <Breadcrumb />}`
  - [x] T1.2 — Importer `usePathname` depuis `expo-router` (vérifier s'il est déjà importé — ligne ~6)
  - [x] T1.3 — Ajouter la logique : `const pathname = usePathname()` (si pas déjà présent dans le composant parent qui rend le breadcrumb)
  - [x] T1.4 — Remplacer `{!isMobile && <Breadcrumb />}` par `{!isMobile && !pathname.startsWith('/activites') && <Breadcrumb />}`

- [x] T2 — Validation (AC: tous)
  - [x] T2.1 — `npx tsc --noEmit` = 0 erreurs
  - [x] T2.2 — Naviguer sur `/activites/presences` : aucun breadcrumb visible au-dessus du header "ACTIVITÉS"
  - [x] T2.3 — Naviguer sur `/activites/evaluations` : même constat
  - [x] T2.4 — Naviguer sur `/dashboard` : le breadcrumb est toujours présent

## Dev Notes

### ⚠️ Contraintes Stack

`_layout.tsx` utilise Tamagui (XStack, YStack, Text). La modification est minimaliste — uniquement une condition sur le rendu du breadcrumb.

- Le composant `Breadcrumb` est importé depuis `'../../components/Breadcrumb'` (ligne 60)
- `usePathname` est importé depuis `expo-router` (vérifier ligne ~6 si déjà présent dans le scope)

---

### T1 — Vérification usePathname dans le layout

Le layout admin est un composant fonctionnel `AdminLayout` (ou équivalent). Vérifier si `usePathname` est déjà appelé dans ce composant.

Si non, l'ajouter dans le composant qui contient la ligne 1091 :
```tsx
const pathname = usePathname()
// ...
{!isMobile && !pathname.startsWith('/activites') && <Breadcrumb />}
```

Si `usePathname` est déjà utilisé dans un sous-composant interne, trouver le bon niveau et ajouter la condition au bon endroit.

---

### T1.4 — Modification exacte (ligne 1091)

```tsx
// AVANT
{!isMobile && <Breadcrumb />}

// APRÈS
{!isMobile && !pathname.startsWith('/activites') && <Breadcrumb />}
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Conditionner le breadcrumb |

### Fichiers à NE PAS modifier

- `aureak/apps/web/components/Breadcrumb.tsx` — composant inchangé
- `aureak/apps/web/app/(admin)/contexts/BreadcrumbContext.tsx` — inchangé
- Aucun fichier Activités

---

### Références

- Breadcrumb render : `aureak/apps/web/app/(admin)/_layout.tsx` ligne 1091
- `usePathname` import : `aureak/apps/web/app/(admin)/_layout.tsx` ligne ~6

---

### Multi-tenant

Sans objet.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun.

### Completion Notes List

- `usePathname` déjà importé ligne 6 et `pathname` déjà déclaré ligne 212 — aucun ajout nécessaire
- Fix minimaliste : une seule condition ajoutée sur le rendu du breadcrumb
- `npx tsc --noEmit` : 0 erreurs

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié |
