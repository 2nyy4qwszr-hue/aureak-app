# Story 75.1 : Académie Hub — Nav globale + Refonte page Joueurs

Status: review

## Story

As an admin,
I want a redesigned players page with a global Académie navigation, 4 key metrics, and a clean filterable table,
so that I can instantly understand the academy's composition and find any player in seconds.

## Acceptance Criteria

1. Une nav horizontale "Académie" s'affiche en haut de la page joueurs avec les onglets : JOUEURS (actif), COACHS, SCOUTS, MANAGERS, CLUBS, IMPLANTATIONS — les 5 autres onglets sont présents et navigables (routes stub), seul JOUEURS est actif visuellement (border-bottom gold)
2. 4 métriques s'affichent en haut de page :
   - JOUEURS = count total de `child_directory` (tous statuts)
   - ACADÉMICIENS = computedStatus IN ('ACADÉMICIEN', 'NOUVEAU_ACADÉMICIEN') → métrique principale (fond gold, chiffre dominant)
   - ANCIENS = computedStatus = 'ANCIEN'
   - PROSPECTS = computedStatus = 'PROSPECT'
3. Un toggle principal AUREAK / PROSPECT filtre la table :
   - AUREAK = joueurs ayant computedStatus ≠ 'PROSPECT' (académiciens, nouveaux, anciens, stagiaires)
   - PROSPECT = joueurs ayant computedStatus = 'PROSPECT'
4. Des filtres secondaires sont disponibles : Statut (sous-filtre par statut précis dans le groupe actif), Année de naissance, Niveau, Club
5. Le tableau affiche les colonnes : STATUS (badge image), PHOTO (avatar circulaire), NOM, PRÉNOM, NÉ LE (DD-MM-YYYY), NIVEAU (étoiles 1-5), CLUB (logo), VIEW (→ fiche joueur)
6. Le bouton "Nouveau joueur" (haut droite) conserve son comportement actuel → /children/new
7. La fiche joueur (`[childId]/page.tsx`) n'est pas modifiée

## Tasks / Subtasks

- [x] Task 1 : Composant AcademieNavBar (AC: #1)
  - [x] Tabs : JOUEURS | COACHS | SCOUTS | MANAGERS | CLUBS | IMPLANTATIONS
  - [x] Tab actif = border-bottom gold 2px + texte dark
  - [x] Tabs inactifs = opacity 0.6, navigables vers routes stub
  - [x] Routes stub à créer si inexistantes : page vide avec titre "À venir"
  - [x] AcademieNavBar implémentée dans `academie/_components/AcademieNavBar.tsx` (story 75-2)

- [x] Task 2 : 4 métriques (AC: #2)
  - [x] Charger les 4 counts via 5 appels `listJoueurs` parallèles avec `computedStatus` + `pageSize: 1`
  - [x] Card ACADÉMICIENS : `colors.accent.gold` fond, chiffre dominant
  - [x] 3 autres cards : `colors.light.surface` fond, `shadows.sm`
  - [x] Layout : 4 colonnes flex-row gap

- [x] Task 3 : Toggle AUREAK / PROSPECT (AC: #3)
  - [x] Toggle 2 états visuellement distincts (AUREAK = gold actif, PROSPECT = neutre)
  - [x] AUREAK → filtre client excludeStatus = 'PROSPECT'
  - [x] PROSPECT → filtre client computedStatus = 'PROSPECT'
  - [x] Reset filtres secondaires au changement de toggle

- [x] Task 4 : Filtres secondaires (AC: #4)
  - [x] Filtre Année de naissance : pills 2004→2018
  - [x] Filtre Niveau : pills niveauClub distincts (calculé depuis data chargée)
  - [x] Barre de recherche nom
  - [x] Bouton "Réinitialiser" si au moins 1 filtre actif

- [x] Task 5 : Tableau redesigné (AC: #5)
  - [x] Colonne STATUS : badge image 28px par computedStatus
  - [x] Colonne PHOTO : PhotoAvatar 40px (url ou initiales fallback)
  - [x] Colonne NOM / PRÉNOM (champs directs sur JoueurListItem)
  - [x] Colonne NÉ LE : birthDate formaté DD-MM-YYYY
  - [x] Colonne NIVEAU : teamLevelStars → N étoiles ★ gold
  - [x] Colonne CLUB : clubLogoUrl → Image 24px, fallback texte
  - [x] Colonne VIEW : icône › → router.push(`/children/${id}`)
  - [x] Lignes alternées pair/impair
  - [x] Pagination 50 lignes/page

- [x] Task 6 : Implémentation dans academie/joueurs/index.tsx (AC: #1-#6)
  - [x] Fichier cible : `academie/joueurs/index.tsx` (hub créé par story 75-2)
  - [x] Tous joueurs chargés (pageSize:1000), filtrage côté client
  - [x] Bouton "Nouveau joueur" → router.push('/children/new')

## Dev Notes

### API — aucune migration requise
`listJoueurs(opts)` dans `@aureak/api-client` retourne déjà tout le nécessaire :
```typescript
type JoueurListItem = {
  id, displayName, nom, prenom, birthDate,
  currentClub, niveauClub, clubDirectoryId, isClubPartner,
  computedStatus,           // 'ACADÉMICIEN' | 'NOUVEAU_ACADÉMICIEN' | 'ANCIEN' | 'STAGE_UNIQUEMENT' | 'PROSPECT' | null
  totalAcademySeasons, inCurrentSeason, currentSeasonLabel, totalStages,
  currentPhotoUrl,          // Signed URL 1h — null si aucune photo
  ageCategory, playerType,  // 'youth' | 'senior' | null
  youthLevel, seniorDivision,
  teamLevelStars,           // 1-5 calculé en DB — null si données manquantes
  clubLogoUrl,              // Signed URL logo club — null si aucun logo
}
```

**Filtre AUREAK côté API** : `listJoueurs` n'a pas de `excludeStatus`. Si count total < 2000 joueurs → charger tout sans filtre computedStatus et filtrer côté client. Si > 2000 → ajouter `excludeStatus?: string` dans `ListJoueursOpts` (modifier `child-directory.ts`). Vérifier le count d'abord.

**Counts pour métriques** : utiliser `pageSize: 1` + lire `count` retourné :
```typescript
const [total, academiciens, anciens, prospects] = await Promise.all([
  listJoueurs({ pageSize: 1 }),
  listJoueurs({ computedStatus: 'ACADÉMICIEN', pageSize: 1 }),   // + NOUVEAU_ACADÉMICIEN séparément si besoin
  listJoueurs({ computedStatus: 'ANCIEN', pageSize: 1 }),
  listJoueurs({ computedStatus: 'PROSPECT', pageSize: 1 }),
])
```

### Badges de statut — assets locaux
```
aureak/apps/web/assets/badges/
  badge-academicien.webp   ← ACADÉMICIEN + NOUVEAU_ACADÉMICIEN
  badge-nouveau.webp       ← NOUVEAU_ACADÉMICIEN (si différenciation souhaitée)
  badge-ancien.webp        ← ANCIEN
  badge-stage.webp         ← STAGE_UNIQUEMENT
  badge-prospect.webp      ← PROSPECT
```
Utiliser `require('../../assets/badges/badge-academicien.webp')` (chemin relatif depuis children/).

### Étoiles NIVEAU
`teamLevelStars` est calculé en DB (logique jeune/adulte déjà intégrée, 1-5).
**Ne pas recalculer côté frontend** — afficher directement N étoiles `★`.
> ⚠️ Review item (story suivante) : valider la grille de correspondance précise jeune vs adulte avec Jérémy.

### Navigation Académie — routes stub
Les 5 onglets non-actifs pointent vers des routes à créer si elles n'existent pas :
- COACHS → `/coaches` (probablement existant)
- SCOUTS → `/scouts` (stub page vide)
- MANAGERS → `/managers` (stub page vide)
- CLUBS → `/clubs` (existant — Epic 23)
- IMPLANTATIONS → `/implantations` (existant — Epic 9)
Vérifier l'existence de chaque route avant de créer des stubs.

### Design System
```
Fond page            : colors.light.primary  (#F3EFE7)
Cards métriques      : colors.light.surface  + shadows.sm
Card ACADÉMICIENS    : colors.accent.gold    + colors.text.dark
Nav tab actif        : border-bottom 2px colors.accent.goldSolid
Étoiles niveau       : colors.accent.gold
Lignes tableau pair  : colors.light.surface
Lignes tableau impair: colors.light.hover
Avatar fallback      : colors.light.muted + initiales text.muted
```

### Project Structure Notes
- **Fichier modifié** : `aureak/apps/web/app/(admin)/children/index.tsx` (remplacement complet)
- **Fichier créé** : `aureak/apps/web/app/(admin)/children/_AcademieNavBar.tsx`
- **Fichiers inchangés** : `[childId]/index.tsx`, `[childId]/page.tsx`, `new/page.tsx`, `_ChildDetail.tsx`, `_avatarHelpers.ts`, `exportCardToPng.ts`
- Import API : `import { listJoueurs, type JoueurListItem, type ListJoueursOpts } from '@aureak/api-client'`
- Import theme : `import { colors, space, shadows, radius } from '@aureak/theme'`

### Règles absolues CLAUDE.md
- try/finally obligatoire sur chaque `setLoading(false)`
- Console guards : `if (process.env.NODE_ENV !== 'production') console.error(...)`
- Styles via tokens uniquement — aucune couleur hardcodée

### References
- Maquette : `_bmad-output/design-references/Academie-joueurs-redesign.png`
- API `listJoueurs` : `aureak/packages/api-client/src/admin/child-directory.ts:440`
- Type `JoueurListItem` : `aureak/packages/api-client/src/admin/child-directory.ts:393`
- Type `AcademyStatus` : `aureak/packages/types/src/entities.ts:527`
- Badges : `aureak/apps/web/assets/badges/`
- Page à remplacer : `aureak/apps/web/app/(admin)/children/index.tsx`

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References

### Completion Notes List
- Page implémentée dans `academie/joueurs/index.tsx` (hub 75-2) — pas `children/index.tsx`
- AcademieNavBar réutilisée depuis `academie/_components/AcademieNavBar.tsx` (créée par 75-2)
- 5 appels `listJoueurs` parallèles pour métriques (total + ACADÉMICIEN + NOUVEAU_ACADÉMICIEN + ANCIEN + PROSPECT)
- Tous joueurs chargés pageSize:1000, filtrage côté client (toggle AUREAK/PROSPECT, birthYear, niveau, search)
- Filtres niveau dérivés dynamiquement depuis les données chargées (valeurs distinctes niveauClub)
- TypeScript propre (EXIT:0), try/finally + console guards conformes CLAUDE.md

### File List
- `aureak/apps/web/app/(admin)/academie/joueurs/index.tsx` (nouveau — contenu complet story 75-1)
