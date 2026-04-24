# Story 103.7 — Marketing mobile-first (5 pages)

Status: done

## Metadata

- **Epic** : 103 — Appliquer mobile-first aux zones admin
- **Story ID** : 103.7
- **Story key** : `103-7-mobile-marketing`
- **Priorité** : P2
- **Dépendances** : Epic 100 + 101 + 102 · Epic 97.12 (template déjà appliqué)
- **Effort estimé** : M (~1j — 5 pages dont médiathèque upload)

## Story

As an admin,
I want que les 5 pages Marketing (hub, médiathèque, réseaux, campagnes, analytics) s'adaptent mobile-first, avec une attention particulière à la médiathèque qui doit gérer l'upload de médias depuis le téléphone (photo/vidéo caméra),
So que je puisse uploader un contenu coach ou consulter des statistiques marketing depuis mon téléphone.

## Contexte

Pages :
- `/marketing` — hub (Epic 91.1)
- `/marketing/mediatheque` — upload + validation (Epic 91.2)
- `/marketing/reseaux`
- `/marketing/campagnes`
- `/marketing/analytics`

## Acceptance Criteria

1. **Hub `/marketing`** : 4 cartes sous-sections → stack mobile, grid desktop.

2. **Médiathèque** (`/marketing/mediatheque`) :
   - Grid images/vidéos → 2 cols mobile (au lieu de 4-6 desktop)
   - FAB "Uploader" → ouvre picker natif (caméra/galerie via `expo-image-picker` si disponible)
   - FilterSheet : type (image/vidéo), validation status

3. **Réseaux sociaux** (`/marketing/reseaux`) :
   - Cards par réseau (Facebook, Instagram, etc.) stack mobile
   - Stats par réseau visibles

4. **Campagnes** (`/marketing/campagnes`) :
   - DataCard campagnes
   - FAB "Nouvelle campagne"

5. **Analytics marketing** (`/marketing/analytics`) :
   - Charts → responsive (fallback message si trop complexe)
   - KPIs cards stack mobile

6. **Tokens `@aureak/theme` uniquement**.

7. **Conformité CLAUDE.md** : tsc OK, try/finally, console guards.

8. **Test Playwright** :
   - Viewport 375×667 sur 5 URLs
   - Médiathèque : tap upload → picker s'ouvre (fallback file input sur web)

9. **Non-goals** :
   - **Pas de refonte upload workflow** (Epic 91.2 préservé)
   - **Pas de nouvelle fonctionnalité**

## Tasks / Subtasks

- [ ] **T1 — Hub** (AC #1)
- [ ] **T2 — Médiathèque + upload** (AC #2)
- [ ] **T3 — Réseaux** (AC #3)
- [ ] **T4 — Campagnes** (AC #4)
- [ ] **T5 — Analytics** (AC #5)
- [ ] **T6 — QA** (AC #6-8)

## Dev Notes

- Pages : `app/(admin)/marketing/**/*`
- Upload mobile : `expo-image-picker` (à vérifier si déjà dépendance) ou fallback `<input type="file">` web
- Epic 91 composants réutilisables

## References

- Epic 91 (marketing hub + médiathèque)
- Epic 97.12 (template)
