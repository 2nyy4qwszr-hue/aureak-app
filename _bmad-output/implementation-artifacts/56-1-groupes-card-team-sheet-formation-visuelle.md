# Story 56.1 : Groupes — Card team sheet avec formation visuelle

Status: done

## Story

En tant qu'administrateur ou coach,
Je veux voir chaque groupe sous forme d'une card "team sheet" avec un mini-terrain SVG et les informations essentielles du groupe,
Afin d'avoir une vue moderne et intuitive de l'organisation des groupes de l'académie.

## Contexte & Décisions de Design

### Card team sheet
Dimensions : 280×180px (desktop), full-width sur mobile.
Contenu :
- Mini-terrain SVG simplifié (rectangle vert avec ligne médiane, surface de but) — pas de positions joueurs à ce stade
- Nom du groupe en bold en overlay sur le terrain (bas du terrain, fond semi-transparent)
- Couleur accent selon la méthode principale du groupe (via `methodologyMethodColors`)
- Nombre de joueurs (ex. "12 joueurs") en badge supérieur droit
- Implantation en texte petit sous le nom
- Bordure gauche 3px couleur méthode

### Composant GroupCard
Ajouté dans `@aureak/ui/src/GroupCard.tsx`. Utilisé dans `groups/index.tsx` en remplacement du layout liste actuel (ou en vue grille alternative).

## Acceptance Criteria

**AC1 — Rendu card avec mini-terrain SVG**
- **Given** un groupe avec des données
- **When** le `GroupCard` est rendu
- **Then** un mini-terrain SVG (rectangle vert, ligne médiane, surface de but) est visible
- **And** le nom du groupe est affiché en overlay sur le terrain en bas

**AC2 — Couleur accent méthode**
- **Given** un groupe avec une méthode pédagogique principale
- **When** la card est rendue
- **Then** la bordure gauche et les accents de couleur suivent `methodologyMethodColors[method]`
- **And** si aucune méthode, la couleur par défaut est `colors.accent.gold`

**AC3 — Badge nombre joueurs**
- **Given** un groupe avec N membres
- **When** la card est rendue
- **Then** un badge "N joueurs" est visible en haut à droite de la card
- **And** si N > max_players, le badge est rouge (indication de surcharge)

**AC4 — Informations implantation**
- **Given** un groupe lié à une implantation
- **When** la card est rendue
- **Then** le nom de l'implantation est affiché sous le nom du groupe en texte petit `colors.text.muted`

**AC5 — Composant GroupCard réutilisable et typé**
- **Given** le composant `GroupCard`
- **When** il est importé depuis `@aureak/ui`
- **Then** il accepte les props `group: GroupWithMeta`, `onPress?: () => void`, `memberCount: number`
- **And** le composant est pressable (TouchableOpacity ou Pressable)

**AC6 — Intégration dans groups/index.tsx**
- **Given** la page liste des groupes
- **When** elle est chargée
- **Then** les groupes sont affichés en grille de cards `GroupCard` (2 colonnes desktop, 1 mobile)
- **And** le filtre `is_transient = false` est bien appliqué (groupes visibles seulement)

## Tasks

- [x] Créer `aureak/packages/ui/src/GroupCard.tsx` avec mini-terrain SVG inline
- [x] Exporter `GroupCard` depuis `aureak/packages/ui/src/index.ts`
- [x] Implémenter SVG terrain : rectangle vert, ligne médiane blanche, arcs surfaces de but
- [x] Overlay nom groupe (bottom-left, fond `rgba(0,0,0,0.5)`, texte blanc bold)
- [x] Badge nb joueurs (haut droit, rouge si > max_players)
- [x] Couleur bordure gauche via `methodologyMethodColors` ou gold par défaut
- [x] Intégrer `GroupCard` dans `groups/index.tsx` en layout grille
- [x] QA scan : try/finally, console guards
- [ ] Test Playwright : screenshot grille groupes — skipped (app non démarrée)

## Fichiers concernés

- `aureak/packages/ui/src/GroupCard.tsx` (nouveau)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/apps/web/app/(admin)/groups/index.tsx` (intégration grille)
- `aureak/packages/types/src/entities.ts` (GroupWithMeta si absent)

## Dépendances

- `methodologyMethodColors` depuis `@aureak/theme/tokens.ts`
- Types `GroupWithMeta` dans `@aureak/types`
- API `listAllGroups` dans `@aureak/api-client`

## Notes techniques

- SVG terrain inline (pas react-native-svg) pour compatibilité web maximale
- `methodologyMethodColors` exporté depuis `@aureak/theme` (décision MEMORY.md)
- La grille utilise `flexWrap: 'wrap'` + `gap: 16` via tokens
