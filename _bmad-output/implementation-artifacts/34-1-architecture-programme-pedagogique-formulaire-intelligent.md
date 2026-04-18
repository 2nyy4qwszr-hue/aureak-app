# Story 34.1 : Architecture programme pédagogique — Formulaire intelligent

Status: done

## Story

En tant qu'admin,
je veux que le formulaire de création de programme pédagogique soit intelligent (auto-suggestion de titre, feedback visuel par méthode, pré-remplissage du total selon la méthode),
afin de créer des programmes plus rapidement et plus cohérents.

## Acceptance Criteria

1. **Sélection méthode visuelle** : remplacer les chips par de grandes tuiles visuelles (icône, couleur, description courte) — pattern identique à Story 53-4 (MethodTileGrid) mais adapté aux MethodologyMethod.
2. **Auto-titre** : quand méthode + saison sont sélectionnés, un titre est auto-suggéré (ex: "Programme Technique Académie 2025-2026"). L'admin peut l'éditer librement.
3. **Total pré-rempli** : un total par défaut est proposé selon la méthode (configurable). L'admin peut le modifier.
4. **Preview card** : un aperçu live du programme (cercle méthode coloré + titre + saison + total) s'affiche à droite du formulaire (ou en bas sur mobile).
5. **Validation enrichie** : les champs obligatoires sont visuellement marqués, et un message d'erreur contextuel s'affiche sous le champ concerné.
6. try/finally sur tous les setters de loading/saving, console guards en place.

## Tasks / Subtasks

- [x] T1 — Tuiles méthode visuelles dans new.tsx
- [x] T2 — Auto-titre basé sur méthode + saison
- [x] T3 — Total pré-rempli par méthode
- [x] T4 — Preview card live
- [x] T5 — Validation contextuelle
- [x] T6 — QA try/finally + console guards

## Dev Notes

### Fichiers modifiés
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` | Modifier — tuiles, auto-titre, preview |

### Pas de migration SQL
### Pas de nouveaux types

## Dev Agent Record

### Agent Model Used
claude-opus-4-6

### Completion Notes List
- Formulaire enrichi : tuiles visuelles méthode, auto-titre, total pré-rempli, preview card live, validation contextuelle
- Aucune migration, aucun type ajouté — 100% front-end

### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/programmes/new.tsx` | Modifié |
