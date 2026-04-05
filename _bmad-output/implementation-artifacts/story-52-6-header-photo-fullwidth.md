# Story 52-6 — Page joueur plein écran — header photo 280px full-width

**Epic** : 52 — Player Cards Ultimate Squad
**Status** : done
**Priority** : P1
**Dépend de** : story-52-1 (tier config)

---

## Story

En tant qu'admin, je veux que la fiche joueur ait un header visuel immersif de 280px avec la photo ou un avatar grand format, un gradient overlay et le nom/statut affichés en overlay, afin d'avoir une expérience premium à l'ouverture de la fiche.

---

## Acceptance Criteria

1. **AC1 — Hauteur header** : Le header mesure exactement 280px. Il s'étend sur toute la largeur disponible (full-width, sans padding latéral).

2. **AC2 — Background dynamique** :
   - Si le joueur a une photo : la photo est utilisée comme fond (`resizeMode="cover"`, `width: '100%'`, `height: 280`)
   - Si pas de photo : fond dégradé basé sur le tier (Prospect = `#E8E8E8`, Académicien = `#F0F0F0`, Confirmé = `linear-gradient(135deg, #FFF8E8, #EEE0A0)`, Elite = `linear-gradient(135deg, #2A2006, #4A3A0A)`)

3. **AC3 — Overlay gradient** : Un gradient `rgba(0,0,0,0)` → `rgba(0,0,0,0.65)` de haut en bas (30px depuis le bas), positionné en `absolute` sur toute la hauteur du header, garantissant la lisibilité du texte.

4. **AC4 — Avatar initiales grand format** : Si pas de photo, un cercle d'initiales de 100px de diamètre est centré dans le header (position absolue, centré horizontalement et verticalement). Font size 40px, fond coloré via `avatarBgColor(id)`.

5. **AC5 — Nom + statut en overlay** : Dans la zone basse du header (30px depuis le bas), afficher :
   - Nom complet en `typography.h1` (28px weight 700), couleur blanche, ombre texte `0 1px 3px rgba(0,0,0,0.8)`
   - Badge tier (pill Prospect/Académicien/Confirmé/Elite) avec couleur du tier

6. **AC6 — Bouton retour** : Un bouton `← Retour` positionné en `absolute` top-left (16px, 16px) dans le header. Fond `rgba(0,0,0,0.4)`, border-radius 20px, padding 6×12px, texte blanc.

7. **AC7 — Tabs navigation** : En dessous du header (sticky sous le header), une row de tabs : `Profil | Académie | Stages | Historique | Photos`. Le tab actif est souligné avec la couleur du tier.

8. **AC8 — Rétrocompatibilité** : Tout le contenu existant de `children/[childId]/page.tsx` est préservé, simplement réorganisé sous les tabs. Aucune fonctionnalité existante ne disparaît.

---

## Tasks

- [x] **T1** — `PlayerHeader` remplace l'ancien hero dans `page.tsx`
- [x] **T2** — `PlayerHeader` : container 280px, photo/gradient, overlay, avatar, bouton retour, nom+badge
- [x] **T3** — `PlayerTabs` : 5 tabs, `activeTab` state, contenu réorganisé
- [x] **T4** — `computePlayerTier` importé depuis `@aureak/business-logic`
- [x] **T5** — QA scan : try/finally OK, console guards OK

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Modifier — nouveau header + tabs |

---

## Notes techniques

- `linear-gradient` CSS fonctionne sur Platform web via `style={{ background: 'linear-gradient(...)' }}`. Sur native, utiliser `expo-linear-gradient` ou un fallback couleur unie. Cette page est web-only (admin), donc `background` CSS direct est acceptable.
- Conserver la référence au `useToast`, `useAuthStore`, et tous les appels API existants — seul le layout change.
- Le header sticky est obtenu via `position: 'sticky'` sur le conteneur tabs (web uniquement).
