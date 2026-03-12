# Story 18.4 : Joueurs — Bouton "Ajouter un joueur" + refonte filtre statut

Status: done

## Story

En tant qu'administrateur Aureak,
je veux pouvoir créer un nouveau joueur depuis la page liste et voir le filtre "Prospect" à la place de "Non affilié",
afin d'ajouter manuellement des joueurs sans passer par Notion et d'utiliser la terminologie métier correcte.

## Acceptance Criteria

1. **Bouton créer** — Un bouton "Ajouter un joueur" est visible dans l'en-tête de la page `/children`. Il est positionné à droite du titre "Joueurs", dans la `View style={s.header}`. Cliquer sur le bouton route vers `/children/new`.
2. **Page création** — La route `/children/new` existe et affiche un formulaire de création avec les champs : Nom complet (displayName), Date de naissance (birthDate), Statut (statut picker parmi les valeurs DB), Club actuel (currentClub texte libre), Niveau club (niveauClub texte libre), Actif (switch booléen, défaut `true`).
3. **Création DB** — Le formulaire appelle `createChildDirectoryEntry(params)` depuis `@aureak/api-client`. En cas de succès, l'utilisateur est redirigé vers `/children/[newId]`.
4. **Filtre label** — Dans `acadStatusTabs`, le tab correspondant à la clé `'PROSPECT'` affiche le label `'Prospect'` (et non plus `'Non affilié'`).
5. **Routing** — La route `/children/new` est accessible via le pattern Expo Router : `children/new.tsx` + `children/new/index.tsx` (re-export).
6. **Validation formulaire** — Le champ `displayName` est requis (non vide). Les autres champs sont optionnels. Un message d'erreur s'affiche si `displayName` est vide à la soumission.
7. **Design cohérent** — Le bouton "Ajouter un joueur" utilise `Button variant="primary"` du système `@aureak/ui`. Le formulaire de création utilise les tokens `@aureak/theme` (fond `colors.light.primary`, cards `colors.light.surface`, inputs `Input variant="light"`).

## Tasks / Subtasks

- [x] **T1** — Modifier `children/index.tsx` : label filtre PROSPECT (AC: #4)
  - [x] Ligne 392 : changer `label: 'Non affilié'` → `label: 'Prospect'`

- [x] **T2** — Modifier `children/index.tsx` : bouton créer dans le header (AC: #1)
  - [x] Importer `Button` depuis `@aureak/ui`
  - [x] Dans la `View style={s.header}`, ajout d'une `View style={s.headerActions}` contenant le reset button + le nouveau `<Button label="Ajouter un joueur" variant="primary" />`
  - [x] Style `s.headerActions` ajouté : `flexDirection: 'row', alignItems: 'center', gap: space.sm`

- [x] **T3** — Ajouter `createChildDirectoryEntry` dans `@aureak/api-client/src/admin/child-directory.ts` (AC: #3)
  - [x] Type `CreateChildDirectoryParams` défini avec `tenantId`, `displayName`, champs optionnels
  - [x] Fonction `createChildDirectoryEntry` implémentée : insert + `.select().single()`, retourne `ChildDirectoryEntry`
  - [x] Exporté depuis `@aureak/api-client/src/index.ts`

- [x] **T4** — Créer `apps/web/app/(admin)/children/new.tsx` (AC: #2, #5, #6, #7)
  - [x] Formulaire React avec state local : `displayName`, `birthDate`, `statut`, `currentClub`, `niveauClub`, `actif`
  - [x] Picker statut pill-style : `['Académicien', 'Nouveau', 'Ancien', 'Stagiaire', 'Prospect']`
  - [x] Validation : `displayName.trim() === ''` → `fieldError` inline via prop `error` de `Input`
  - [x] Soumission : `createChildDirectoryEntry(...)`, `router.replace(`/children/${entry.id}`)` on success
  - [x] Design : `ScrollView`, titre "Nouveau joueur", cards `colors.light.surface`, `shadows.sm`, `Button variant="primary"`, `Input variant="light"`

- [x] **T5** — Créer `apps/web/app/(admin)/children/new/index.tsx` (AC: #5)
  - [x] Re-export : `export { default } from '../new'`
  - [x] Pattern standard Expo Router du projet

## Dev Notes

### Contexte précis fichiers à modifier

**`aureak/apps/web/app/(admin)/children/index.tsx`**
- Ligne 392 : `label: 'Non affilié'` → `label: 'Prospect'` dans `acadStatusTabs`
- Ligne ~436 (header View) : ajouter le bouton à droite. La View `s.header` a déjà `flexDirection: 'row', justifyContent: 'space-between'` donc le bouton se place naturellement à droite.
- Import à ajouter : `Button` depuis `@aureak/ui`

**`aureak/packages/api-client/src/admin/child-directory.ts`**
- Ajouter la fonction `createChildDirectoryEntry` après les fonctions existantes
- Le tenantId est obtenu via le client Supabase (RLS le gère automatiquement, mais vérifier si `tenant_id` doit être passé explicitement comme les autres fonctions insert du projet)
- Pattern d'insert existant à suivre dans le projet (ex: `addChildAcademyMembership`, `addChildHistoryEntry`)

**Routing pattern Expo Router (obligatoire) :**
```
children/
├── new.tsx        ← composant réel (formulaire)
└── new/
    └── index.tsx  ← export { default } from '../new'
```

### Champs du formulaire de création

| Champ | Input type | Requis | Valeur par défaut |
|---|---|---|---|
| displayName | TextInput | OUI | '' |
| birthDate | TextInput (ISO date) | NON | null |
| statut | Select/Picker | NON | null |
| currentClub | TextInput | NON | null |
| niveauClub | TextInput | NON | null |
| actif | Switch | NON | true |

Note : Les champs nom/prénom séparés seront ajoutés dans la Story 18-5.

### Statuts valides pour le picker

Les valeurs de `statut` dans `child_directory` sont des strings libres (pas un enum DB strict) :
`['Académicien', 'Nouveau', 'Ancien', 'Stagiaire', 'Prospect']`

À ne pas confondre avec `AcademyStatus` (computed depuis la vue `v_child_academy_status`).

### Composants UI à utiliser

- `Button` (`@aureak/ui`) — bouton "Ajouter un joueur" et boutons du formulaire
- `Input variant="light"` (`@aureak/ui`) — champs texte du formulaire
- `AureakText` — libellés
- Tokens `colors.light.*`, `shadows.sm`, `radius.*` depuis `@aureak/theme`

### Aucune migration DB requise

Cette story ne nécessite aucune migration Supabase. La table `child_directory` supporte déjà tous les champs nécessaires.

### References

- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L386-L393] — acadStatusTabs avec label 'Non affilié'
- [Source: aureak/apps/web/app/(admin)/children/index.tsx#L435-L453] — header avec titre + reset button
- [Source: aureak/packages/api-client/src/admin/child-directory.ts] — fonctions existantes à suivre comme pattern
- [Source: MEMORY.md#Routing pattern] — pattern index.tsx re-export obligatoire pour routes dynamiques

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: Label 'Non affilié' → 'Prospect' dans `acadStatusTabs` (ligne 392 de children/index.tsx)
- T2: Import `Button` ajouté, `View s.headerActions` créée dans le header, `Button label="Ajouter un joueur" variant="primary"` routant vers `/children/new`
- T3: `CreateChildDirectoryParams` + `createChildDirectoryEntry` ajoutés dans child-directory.ts, exportés depuis index.ts
- T4: `children/new.tsx` créé — formulaire complet avec `Input variant="light"`, picker statut pill-style, validation `displayName` requis, `Switch` actif/inactif, redirect vers fiche joueur créé
- T5: `children/new/index.tsx` créé — re-export pattern Expo Router
- ESLint: 0 erreurs sur les fichiers créés/modifiés (erreurs pre-existantes dans index.tsx non introduites)
- TypeScript: erreurs TS2698 (shadows.sm spread) pre-existantes dans tout le codebase, non introduites
- Code Review fixes: validation format `birthDate` (regex AAAA-MM-JJ + message d'erreur UX), `setSaving(false)` avant redirect, cast `fontWeight as TextStyle['fontWeight']` au lieu de `as never`

### File List

- `aureak/apps/web/app/(admin)/children/index.tsx` — +import Button, label PROSPECT, bouton header
- `aureak/apps/web/app/(admin)/children/new.tsx` — nouveau (formulaire création joueur)
- `aureak/apps/web/app/(admin)/children/new/index.tsx` — nouveau (re-export Expo Router)
- `aureak/packages/api-client/src/admin/child-directory.ts` — +CreateChildDirectoryParams, +createChildDirectoryEntry
- `aureak/packages/api-client/src/index.ts` — export createChildDirectoryEntry + type
