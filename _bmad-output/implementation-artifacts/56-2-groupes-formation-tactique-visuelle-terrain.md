# Story 56.2 : Groupes — Formation tactique visuelle terrain

Status: done

## Story

En tant que coach ou administrateur,
Je veux assigner les joueurs d'un groupe à des positions tactiques sur un terrain visuel vu du dessus,
Afin de planifier et communiquer les formations tactiques de manière intuitive et visuelle.

## Contexte & Décisions de Design

### Terrain SVG
Terrain de foot vu du dessus : fond vert (`#2D7A2D`), lignes blanches (bordures, ligne médiane, cercle central, surfaces de but, arcs de coin). Dimensions : 400×600px (ratio ~2:3 portrait).

### Positions
11 cercles cliquables répartis en formation 1-4-2-3-1 par défaut. Chaque cercle :
- Vide : fond blanc semi-transparent, numéro de position
- Assigné : fond gold avec initiales joueur (2 lettres) ou miniature photo
- Clic sur cercle vide → modal de sélection joueur (liste membres du groupe)
- Clic sur cercle assigné → modal de ré-assignation ou suppression

### Persistance
La formation est sauvegardée dans `group_formations` (nouvelle table ou colonne JSON dans `groups`). Pour cette story : stockage JSON dans `groups.formation_data JSONB` (migration requise).

### Intégration
Composant `TacticalBoard.tsx` dans `@aureak/ui`. Intégré dans `groups/[groupId]/page.tsx` comme section "Formation tactique" (accordéon ou tab).

## Acceptance Criteria

**AC1 — Terrain SVG rendu avec lignes**
- **Given** la section formation tactique d'un groupe
- **When** le `TacticalBoard` est rendu
- **Then** un terrain de foot vu du dessus est visible avec : bordures, ligne médiane, cercle central, surfaces de but
- **And** 11 cercles de position sont affichés en formation 1-4-2-3-1

**AC2 — Assignation joueur à une position**
- **Given** un cercle de position vide
- **When** le coach clique sur ce cercle
- **Then** un modal s'ouvre avec la liste des membres du groupe non encore assignés
- **And** la sélection d'un joueur assigne ses initiales/photo sur le cercle
- **And** le modal se ferme automatiquement après sélection

**AC3 — Suppression d'assignation**
- **Given** un cercle de position assigné
- **When** le coach clique sur ce cercle
- **Then** un modal propose "Changer de joueur" et "Retirer de cette position"
- **And** "Retirer" vide le cercle et remet le joueur disponible pour d'autres positions

**AC4 — Sauvegarde de la formation**
- **Given** une formation complétée (ou partielle)
- **When** le coach clique sur "Sauvegarder formation"
- **Then** la formation est sauvegardée dans `groups.formation_data` (JSON positions → childId)
- **And** au rechargement de la page, la formation est restaurée

**AC5 — Migration DB `formation_data`**
- **Given** la table `groups`
- **When** la migration est appliquée
- **Then** une colonne `formation_data JSONB DEFAULT NULL` existe sur la table
- **And** aucune donnée existante n'est altérée

**AC6 — Composant TacticalBoard typé et réutilisable**
- **Given** le composant `TacticalBoard`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `members: GroupMemberWithName[]`, `formationData?: FormationData`, `onSave: (data: FormationData) => void`
- **And** `FormationData = Record<string, string | null>` (position_key → childId)

## Tasks

- [x] Migration `supabase/migrations/00121_groups_formation_data.sql` (numéro 00121, pas 00114 déjà utilisé)
- [x] Créer `aureak/packages/ui/src/TacticalBoard.tsx` (SVG terrain + 11 positions cliquables)
- [x] Exporter `TacticalBoard` depuis `aureak/packages/ui/src/index.ts`
- [x] Modal sélection joueur (liste membres, filtre déjà assignés)
- [x] Modal ré-assignation / suppression
- [x] Ajouter `updateGroupFormation(groupId, formationData)` dans `@aureak/api-client/src/sessions/implantations.ts`
- [x] Ajouter `formation_data` dans type `Group` dans `@aureak/types/src/entities.ts`
- [x] Intégrer `TacticalBoard` dans `groups/[groupId]/page.tsx`
- [x] Bouton "Sauvegarder formation" avec try/finally sur `setSaving`
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : ouvrir fiche groupe, assigner un joueur, vérifier rendu — skipped (app non démarrée)

## Fichiers concernés

- `supabase/migrations/00114_groups_formation_data.sql` (nouveau)
- `aureak/packages/ui/src/TacticalBoard.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/packages/api-client/src/sessions/implantations.ts` (updateGroupFormation)
- `aureak/packages/types/src/entities.ts` (Group.formationData, type FormationData)
- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` (section TacticalBoard)

## Dépendances

- Story 56-1 (GroupCard) recommandée mais non bloquante
- Types `GroupMemberWithName` existants dans `@aureak/types`

## Notes techniques

- Coordonnées des 11 positions en % du terrain (responsive) : ex. GK à 50%×90%, DC à 30%×75%
- Formation 1-4-2-3-1 : GK, DC×2, LB, RB, CM×2, LW, RW, CAM, ST
- JSON FormationData : `{ "GK": "uuid-child-1", "DC_L": "uuid-child-2", ... }`
