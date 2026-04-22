# Story 97.12 — Marketing : template + titres sur médiathèque et réseaux

Status: done

## Metadata

- **Epic** : 97 — Admin UI Polish Phase 2
- **Story ID** : 97.12
- **Story key** : `97-12-template-marketing`
- **Priorité** : P2
- **Dépendances** : **97.3** (AdminPageHeader v2)
- **Source** : Audit UI 2026-04-22. User : "Marketing, médiathèque, c'est bon. Réseau, ça, c'est bon aussi." → L'essentiel du fonctionnel existe, il manque l'alignement template.
- **Effort estimé** : S (~3-4h — 4 pages à aligner)

## Story

As an admin,
I want que les pages de la zone Marketing (hub, médiathèque, réseaux, analytics marketing, campagnes) utilisent le template `<AdminPageHeader />` v2 avec titre = sous-section active,
So that la zone Marketing est visuellement cohérente avec Activités, Méthodologie et le reste de l'admin.

## Contexte

### Pages existantes

- `/marketing` — hub (Story 91.1)
- `/marketing/mediatheque` — Story 91.2 (upload coachs + validation admin)
- `/marketing/reseaux` — gestion réseaux sociaux
- `/marketing/campagnes` — campagnes
- `/marketing/analytics` — analytics marketing

### `_layout.tsx`

Il existe un `marketing/_layout.tsx` — à vérifier son contenu (probablement un Context ou wrapper).

### Titres cibles

| URL | Titre |
|---|---|
| `/marketing` | "Marketing" (hub) |
| `/marketing/mediatheque` | "Médiathèque" |
| `/marketing/reseaux` | "Réseaux sociaux" |
| `/marketing/campagnes` | "Campagnes" |
| `/marketing/analytics` | "Analytics" |

## Acceptance Criteria

1. **Hub `/marketing`** : `<AdminPageHeader title="Marketing" />`, retrait de tout eyebrow/subtitle custom si présents.

2. **`/marketing/mediatheque`** : title "Médiathèque", action "+ Uploader" si applicable.

3. **`/marketing/reseaux`** : title "Réseaux sociaux".

4. **`/marketing/campagnes`** : title "Campagnes".

5. **`/marketing/analytics`** : title "Analytics".

6. **Nav secondaire** : si un composant de tabs `MarketingHeader` existe, le conserver sous le `<AdminPageHeader />`. Sinon, ne pas en créer dans cette story (hors scope).

7. **Cleanup** :
   - Retirer eyebrow/subtitle custom
   - Grep `<View style={styles.header}>` inline → remplacer par AdminPageHeader
   - Grep hex → 0 match
   - StyleSheets orphelins supprimés

8. **try/finally + console guards**.

9. **Conformité CLAUDE.md** : tsc OK, tokens, api-client, Expo Router patterns.

10. **Test Playwright** :
    - 5 pages chargent avec bon titre
    - Console zéro erreur
    - Screenshots before/after

11. **Non-goals explicites** :
    - **Pas de refonte fonctionnelle** — la médiathèque, les réseaux, les campagnes conservent leur logique actuelle
    - **Pas de création de composant nav secondaire** si inexistant

## Tasks / Subtasks

- [ ] **T1 — Hub Marketing** (AC #1)
  - [ ] Header v2 + cleanup

- [ ] **T2 — Médiathèque** (AC #2)
  - [ ] Header v2 + action si applicable

- [ ] **T3 — Réseaux** (AC #3)
  - [ ] Header v2

- [ ] **T4 — Campagnes** (AC #4)
  - [ ] Header v2

- [ ] **T5 — Analytics Marketing** (AC #5)
  - [ ] Header v2

- [ ] **T6 — Cleanup + QA** (AC #7, #8, #9, #10)
  - [ ] Grep headers locaux + hex
  - [ ] `tsc --noEmit` OK
  - [ ] Playwright

## Dev Notes

### Pattern de référence

Zone Activités + Méthodologie post-97.3. Alignement mécanique — juste remplacer le header et retirer eyebrow/subtitle.

### Actions headers

- Médiathèque : bouton "+ Uploader un média" si pattern
- Autres : pas nécessairement de bouton action, à voir page par page

### References

- Pages : `app/(admin)/marketing/`
- Layout : `app/(admin)/marketing/_layout.tsx`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
- Stories associées : 91.1 (hub marketing), 91.2 (médiathèque)
