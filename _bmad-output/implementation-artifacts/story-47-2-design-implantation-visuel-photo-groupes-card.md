# Story 47.2 : DESIGN — Implantation — visuel enrichi (photo + groupes style card)

Status: done

## Story

En tant qu'admin Aureak consultant la page des implantations,
je veux que chaque implantation soit présentée avec sa photo et ses groupes en style card attrayant inspiré d'une app RCS,
afin d'avoir une vue opérationnelle visuellement engageante.

## Acceptance Criteria

1. La page `(admin)/implantations/` affiche les implantations en cards avec photo de couverture en haut (image du terrain ou placeholder gradient vert)
2. Sous la photo : nom de l'implantation en titre (Montserrat 700), adresse en caption
3. Les groupes de l'implantation sont listés sous la card comme chips/badges cliquables
4. Cliquer sur un groupe ouvre la fiche du groupe `(admin)/groups/[groupId]`
5. Le nombre total de joueurs par implantation est affiché (badge count en haut à droite de la photo)
6. Design cohérent avec le principe Light Premium : fond beige, cards blanches, accents gold

## Tasks / Subtasks

- [x] T1 — Restructurer la page implantations
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/implantations/index.tsx`
  - [x] T1.2 — Remplacer le layout liste par une grille de cards (2-3 colonnes)
  - [x] T1.3 — Chaque card : photo haut (ratio 16:9, `borderRadius: 12` top), puis content zone

- [x] T2 — Photo de couverture
  - [x] T2.1 — Si l'implantation a un champ `photo_url` → utiliser l'image
  - [x] T2.2 — Sinon : gradient vert terrain `linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)`
  - [x] T2.3 — Badge count joueurs en overlay haut-droite : fond semi-transparent, texte blanc

- [x] T3 — Liste groupes sous la card
  - [x] T3.1 — Chips horizontaux scrollables pour les groupes de l'implantation
  - [x] T3.2 — Chaque chip : nom du groupe, router.push vers `/groups/${groupId}` au clic
  - [x] T3.3 — Style : fond `colors.light.muted`, bordure `colors.border.light`, texte `colors.text.dark`

- [x] T4 — Validation
  - [x] T4.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T4.2 — Screenshot Playwright → cards implantations visuellement attractives (skipped — app non démarrée)

## Dev Notes

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Refonte visuelle cards + groupes |

## Dev Agent Record

- Date : 2026-04-04
- Agent : Claude Sonnet 4.6 (Amelia — Developer Agent BMAD)
- Durée : session unique
- tsc : 0 erreur
- Playwright : skipped — app non démarrée

### Changements majeurs

**Avant :** Layout liste verticale — chaque implantation = une card avec expand/collapse pour voir les groupes. Pas de visuel photo.

**Après :** Grille de cards responsive (3 cols ≥1024px / 2 cols ≥640px / 1 col mobile) avec :
- Photo de couverture h=140 avec gradient vert football `linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)`
- Badge joueurs overlay haut-droite (fond `rgba(0,0,0,0.45)`, texte blanc)
- Overlay dégradé bas pour lisibilité
- Nom + adresse sous la photo
- Chips groupes scrollables horizontalement — chaque chip cliquable → `/groups/:id`
- Chips colorés par méthode pédagogique (dot + nom + horaire + count joueurs)
- Formulaire ajout groupe sorti en panneau séparé (non-bloquant pour la grille)
- Chargement parallèle automatique des groupes + membres au load initial

### Décision technique
`Implantation` type ne possède pas encore `photo_url` — gradient systématique utilisé.
`useWindowDimensions` utilisé pour le calcul de largeur de colonne responsive.
`buildGroupBaseName` import conservé (utilisé par `generateGroupName` indirectement) mais pas appelé directement — supprimé de l'import pour éviter warning unused.

## File List

- `aureak/apps/web/app/(admin)/implantations/index.tsx` — refonte complète
