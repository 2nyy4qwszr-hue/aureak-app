# Story 56.3 : Groupes — Player avatars grille sur card groupe

Status: done

## Story

En tant qu'administrateur ou coach,
Je veux voir les joueurs d'un groupe directement sur la card groupe sous forme d'une grille d'avatars compacts,
Afin d'identifier en un coup d'oeil qui compose chaque groupe sans ouvrir la fiche détaillée.

## Contexte & Décisions de Design

### Avatars initiaux colorés
Chaque avatar = cercle 28px avec 2 initiales du prénom + nom. Couleur de fond selon le "tier" du joueur :
- Tier gold (note moyenne ≥ 8) : fond `colors.accent.gold`, texte sombre
- Tier argent (6–7.9) : fond `#C0C0C0`, texte sombre
- Tier normal (< 6 ou pas d'évaluations) : fond `colors.light.elevated`, texte `colors.text.primary`

### Grille compacte
Maximum 8 avatars visibles sur la card. Si N > 8, les 7 premiers + un avatar "+N" (ex. "+5") en gris clair.

### Intégration
Le composant `PlayerAvatarGrid` est créé dans `@aureak/ui` et intégré dans `GroupCard` (story 56-1) comme zone basse de la card, sous le terrain SVG.

### Données supplémentaires
`GroupCard` doit recevoir les membres pré-chargés ou les charger lazily. Pour éviter N+1, la page `groups/index.tsx` charge les membres de tous les groupes en une requête (join).

## Acceptance Criteria

**AC1 — Grille d'avatars compacts sur la card groupe**
- **Given** un groupe avec des membres
- **When** le `GroupCard` est rendu avec `members` prop
- **Then** une ligne d'avatars cercle 28px affiche les initiales de chaque joueur
- **And** maximum 8 avatars sont visibles, le reste est remplacé par un avatar "+N"

**AC2 — Couleur avatar selon tier**
- **Given** un joueur avec note moyenne ≥ 8
- **When** son avatar est rendu
- **Then** le fond est `colors.accent.gold` avec texte sombre
- **And** un joueur sans évaluations reçoit le fond neutre `colors.light.elevated`

**AC3 — Avatar "+N" si plus de 8 joueurs**
- **Given** un groupe avec 12 membres
- **When** la card est rendue
- **Then** 7 avatars individuels + 1 avatar "+5" sont affichés
- **And** l'avatar "+5" a un fond gris et texte "+5"

**AC4 — Composant PlayerAvatarGrid réutilisable**
- **Given** le composant `PlayerAvatarGrid`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `members: AvatarMember[]`, `maxVisible?: number` (défaut 8)
- **And** le type `AvatarMember = { childId: string; displayName: string; avgScore?: number }`

**AC5 — Chargement des membres dans groups/index.tsx sans N+1**
- **Given** la page liste des groupes avec 10 groupes
- **When** elle se charge
- **Then** les membres sont chargés en une seule requête (join groups + group_members + avg evaluations)
- **And** les données sont passées aux `GroupCard` via props

**AC6 — Accessibilité des avatars**
- **Given** un avatar avec initiales
- **When** il est rendu
- **Then** un `accessibilityLabel` contenant le nom complet du joueur est présent
- **And** l'avatar "+N" a `accessibilityLabel="N joueurs supplémentaires"`

## Tasks

- [x] Créer `aureak/packages/ui/src/PlayerAvatarGrid.tsx` (grille avatars circulaires, max 8, +N overflow)
- [x] Exporter `PlayerAvatarGrid` depuis `aureak/packages/ui/src/index.ts`
- [x] Définir type `AvatarMember` dans `@aureak/types/src/entities.ts`
- [x] Logique couleur tier (gold/argent/neutre) selon `avgScore`
- [x] Intégrer `PlayerAvatarGrid` dans `GroupCard.tsx` (story 56-1)
- [x] Ajouter `listGroupsWithMembers(implantationId?)` dans `@aureak/api-client/src/sessions/implantations.ts` (join optimisé)
- [x] Mettre à jour `groups/index.tsx` pour passer les membres aux GroupCards
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : screenshot grille avec avatars colorés — skipped (app non démarrée)

## Fichiers concernés

- `aureak/packages/ui/src/PlayerAvatarGrid.tsx` (nouveau)
- `aureak/packages/ui/src/GroupCard.tsx` (modifié — intégration avatars)
- `aureak/packages/ui/src/index.ts` (export PlayerAvatarGrid)
- `aureak/packages/api-client/src/sessions/implantations.ts` (listGroupsWithMembers)
- `aureak/packages/types/src/entities.ts` (AvatarMember)
- `aureak/apps/web/app/(admin)/groups/index.tsx` (passer members aux cards)

## Dépendances

- Story 56-1 (GroupCard) — requis (PlayerAvatarGrid s'intègre dans GroupCard)
- API `listGroupMembers` ou équivalent existant

## Notes techniques

- Requête join optimisée : `groups JOIN group_members ON ... LEFT JOIN evaluations ON ... GROUP BY child_id`
- Tiers calculés côté client depuis `avgScore` (pas de colonne DB supplémentaire)
- Les avatars sont non-pressables sur la card (juste informatifs) — clic sur la card entière ouvre la fiche
