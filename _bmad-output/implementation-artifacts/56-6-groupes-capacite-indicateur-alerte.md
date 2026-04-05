# Story 56.6 : Groupes — Capacité indicateur + alerte rouge

Status: done

## Story

En tant qu'administrateur ou coach,
Je veux voir la capacité actuelle de chaque groupe (joueurs inscrits / capacité maximale) avec une alerte visuelle si le groupe est plein ou surplein,
Afin de gérer l'espace disponible dans les groupes et éviter le sureffectif lors des séances.

## Contexte & Décisions de Design

### Indicateur de capacité
Format : "12/15 joueurs" (inscrits/max). Affiché dans `GroupCard` et dans la fiche groupe `groups/[groupId]/page.tsx`.

### Seuils visuels
- Normal (< 80% de capacité) : texte `colors.text.muted`, icône joueurs neutre
- Attention (80–99%) : texte orange (`#F59E0B`), icône orange
- Complet (100%) : texte rouge (`colors.accent.red`), badge "Groupe complet" rouge pill
- Surplein (> 100%) : badge "Surplein" rouge vif, icône warning

### Tooltip
Hover sur l'indicateur → tooltip "Groupe complet — plus d'inscriptions possibles" ou "X place(s) disponible(s)".

### Source de la capacité maximale
Colonne `max_players` sur la table `groups` (existante ou à vérifier). Si absent, la migration ajoute la colonne.

## Acceptance Criteria

**AC1 — Indicateur "X/Y joueurs" sur GroupCard**
- **Given** un groupe avec 12 membres et max_players=15
- **When** la `GroupCard` est rendue
- **Then** l'indicateur "12/15 joueurs" est visible sur la card
- **And** la couleur est neutre (< 80%)

**AC2 — Seuils de couleur**
- **Given** un groupe avec 13/15 joueurs (87%)
- **When** la card est rendue
- **Then** l'indicateur est en orange (`#F59E0B`)
- **And** un groupe à 15/15 affiche le badge rouge "Groupe complet"
- **And** un groupe à 16/15 affiche le badge rouge vif "Surplein"

**AC3 — Tooltip au survol**
- **Given** un groupe complet (15/15)
- **When** l'utilisateur survole l'indicateur de capacité
- **Then** un tooltip "Groupe complet — plus d'inscriptions possibles" apparaît
- **And** un groupe à 12/15 affiche "3 place(s) disponible(s)"

**AC4 — Indicateur dans la fiche groupe**
- **Given** la page `groups/[groupId]/page.tsx`
- **When** la section infos du groupe est affichée
- **Then** l'indicateur de capacité est visible avec la même logique de couleur
- **And** un bouton "Modifier la capacité max" est disponible (champ éditable inline)

**AC5 — Migration si max_players absent**
- **Given** la table `groups` sans colonne `max_players`
- **When** la migration est appliquée
- **Then** `max_players INTEGER DEFAULT 20` est ajouté
- **And** les groupes existants reçoivent la valeur par défaut 20

**AC6 — Blocage d'ajout si groupe complet**
- **Given** un groupe à 15/15 (complet)
- **When** un admin tente d'ajouter un joueur via le bouton "Ajouter joueur"
- **Then** une alerte toast "Groupe complet — réduisez la capacité ou transférez un joueur" s'affiche
- **And** l'ajout est bloqué côté UI (le bouton est désactivé ou affiche l'alerte)

## Tasks

- [ ] Vérifier existence colonne `max_players` sur table `groups` (via `ls supabase/migrations/`)
- [ ] Si absent : créer `supabase/migrations/00115_groups_max_players.sql` (ADD COLUMN max_players INTEGER DEFAULT 20)
- [ ] Ajouter `maxPlayers?: number` dans type `Group` dans `@aureak/types/src/entities.ts`
- [ ] Créer composant `CapacityIndicator.tsx` dans `@aureak/ui` (texte coloré + badge + tooltip)
- [ ] Logique seuils couleur : < 80% neutre, 80–99% orange, 100% rouge, > 100% rouge vif
- [ ] Tooltip (title HTML ou composant Tooltip personnalisé)
- [ ] Intégrer `CapacityIndicator` dans `GroupCard.tsx`
- [ ] Intégrer `CapacityIndicator` dans `groups/[groupId]/page.tsx`
- [ ] Champ éditable `max_players` dans la fiche groupe + `updateGroup({maxPlayers})` API
- [ ] Blocage UI si groupe complet lors de l'ajout d'un joueur
- [ ] QA scan : try/finally, console guards
- [ ] Test Playwright : vérifier badge rouge sur groupe complet

## Fichiers concernés

- `supabase/migrations/00115_groups_max_players.sql` (si migration requise)
- `aureak/packages/ui/src/CapacityIndicator.tsx` (nouveau)
- `aureak/packages/ui/src/GroupCard.tsx` (intégration CapacityIndicator)
- `aureak/packages/ui/src/index.ts` (export)
- `aureak/packages/types/src/entities.ts` (Group.maxPlayers)
- `aureak/packages/api-client/src/sessions/implantations.ts` (updateGroup avec maxPlayers)
- `aureak/apps/web/app/(admin)/groups/[groupId]/page.tsx` (CapacityIndicator + champ éditable)

## Dépendances

- Story 56-1 (GroupCard) — requis (CapacityIndicator s'intègre dans GroupCard)

## Notes techniques

- Taux = `memberCount / maxPlayers * 100`
- Tooltip web : `title` HTML natif suffit pour le MVP, ou composant `Tooltip` existant si dispo
- Le `max_players` est modifiable par admin uniquement (vérification rôle côté UI)
