# Story 52-1 — Player Cards FUT-style 160×220px avec tiers visuels

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P1

---

## Story

En tant qu'admin, je veux voir les joueurs présentés sous forme de cartes FUT (Football Ultimate Team) 160×220px avec un fond visuel correspondant à leur tier, afin de distinguer immédiatement le niveau de chaque joueur dans la grille.

---

## Acceptance Criteria

1. **AC1 — Dimensions exactes** : La `PlayerCard` mesure exactement 160px de large × 220px de haut. Sur mobile (< 768px), elle réduit proportionnellement à 140×193px.

2. **AC2 — Tiers visuels distincts** :
   - `Prospect` : fond gris neutre `#E8E8E8`, texte sombre, bordure `#C0C0C0`
   - `Académicien` : fond blanc `#FFFFFF`, texte sombre, bordure `#E5E7EB`
   - `Confirmé` : fond or clair `#FFF8E8`, texte sombre, bordure dorée `rgba(193,172,92,0.4)`
   - `Elite` : fond dégradé `linear-gradient(135deg, #2A2006 0%, #4A3A0A 50%, #2A2006 100%)`, texte clair, bordure or solide `#C1AC5C`

3. **AC3 — Photo avatar** : L'avatar occupe 80×80px, centré en haut de la card (marge-top 20px), avec border-radius 50%. Si pas de photo : cercle initiales coloré via `avatarBgColor(id)`.

4. **AC4 — Nom + statut** : Nom en `fonts.display` weight 700, taille 13px, tronqué à 1 ligne. Badge statut en pied (10px, pill colorée selon tier).

5. **AC5 — Composant exporté** : `PlayerCard` exporté depuis `@aureak/ui/index` avec les props `{ joueur: JoueurListItem; onPress?: () => void; size?: 'normal' | 'compact' }`.

6. **AC6 — Tokens uniquement** : Zéro valeur de couleur ou espacement hardcodée dans `PlayerCard.tsx` — tout via `@aureak/theme` tokens.

---

## Tasks

- [x] **T1** — Créer `aureak/packages/ui/src/PlayerCard.tsx`
  - Importer `colors`, `fonts`, `typography`, `space`, `radius`, `shadows` depuis `@aureak/theme`
  - Définir `TIER_CONFIG` constant (Prospect/Académicien/Confirmé/Elite) avec bg, border, textColor, badgeBg, badgeText
  - Implémenter le layout View 160×220px avec overflow hidden
  - Section avatar : `PhotoAvatar` réutilisé (copier/extraire le pattern existant de `children/index.tsx`)
  - Section nom : `AureakText` tronquée 1 ligne
  - Section badge statut : pill colorée en pied

- [x] **T2** — Exporter `PlayerCard` depuis `aureak/packages/ui/src/index.ts`

- [x] **T3** — Définir `PLAYER_TIER_LABELS` dans `@aureak/types/enums.ts` : mapping `AcademyStatus → PlayerTier`
  - `NOUVEAU_ACADÉMICIEN` → `Prospect`
  - `ACADÉMICIEN` → `Académicien`
  - `ANCIEN` → `Confirmé`
  - `STAGE_UNIQUEMENT` → `Prospect`
  - `PROSPECT` → `Prospect`
  - Note : `Elite` = tier future (story 52-2 calculera si stats suffisantes)

- [x] **T4** — QA scan : vérifier absence de couleurs hardcodées dans `PlayerCard.tsx`

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/packages/ui/src/PlayerCard.tsx` | Créer |
| `aureak/packages/ui/src/index.ts` | Modifier — ajouter export |
| `aureak/packages/types/src/enums.ts` | Modifier — ajouter `PLAYER_TIER_LABELS` |

---

## Dépendances

- `@aureak/theme` tokens (tokens.ts existant)
- `@aureak/types` → `AcademyStatus`, `JoueurListItem`
- `@aureak/ui` → `AureakText`

---

## Notes techniques

- La `PhotoAvatar` dans `children/index.tsx` est un composant interne non exporté. L'implémenter directement dans `PlayerCard.tsx` sans import circulaire. Si `@aureak/ui` exporte déjà un Avatar — l'utiliser à la place.
- `JoueurListItem` est le type retourné par `listJoueurs()` dans `@aureak/api-client`.
- Story 52-2 viendra ajouter la section stats 6 attributs dans la zone inférieure de la card.
- Story 52-4 intègre cette card dans `children/index.tsx`.
