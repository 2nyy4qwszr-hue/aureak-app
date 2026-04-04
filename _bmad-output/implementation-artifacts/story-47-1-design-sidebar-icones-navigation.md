# Story 47.1 : DESIGN — Sidebar — icônes navigation manquantes

Status: done

## Story

En tant qu'admin Aureak naviguant dans l'application,
je veux que chaque entrée de la sidebar dispose d'une icône pertinente à gauche du label,
afin d'identifier visuellement et rapidement les sections de navigation.

## Acceptance Criteria

1. Toutes les entrées de navigation dans `_layout.tsx` (admin) ont une icône à gauche du label
2. Les icônes sont cohérentes visuellement : même taille (18px), même style (outline ou filled uniformément)
3. L'icône active est dorée (`colors.accent.gold`) — l'icône inactive est grisée (`colors.text.secondary`)
4. Les icônes utilisées :
   - Dashboard → 🏠 (ou icône maison)
   - Séances → 📅 (ou calendrier)
   - Présences → ✅ (ou check-circle)
   - Évaluations → ⭐ (ou star)
   - Joueurs → 👥 (ou users)
   - Groupes → 🏆 (ou trophy)
   - Implantations → 🏟️ (ou map-pin)
   - Coaches → 👨‍🏫 (ou person)
   - Clubs → 🏅 (ou shield)
   - Méthodologie → 📚 (ou book)
   - Stages → 🎯 (ou flag)
   - Messagerie → 💬 (ou chat)
   - Audit → 🔍 (ou search)
   - Anomalies → ⚠️ (ou alert)
   - Analytics → 📊 (ou chart)
5. Sur mobile (sidebar collapsed), seule l'icône est visible (label masqué)

## Tasks / Subtasks

- [x] T1 — Lire le layout actuel
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/_layout.tsx` — identifier la structure des nav items
  - [x] T1.2 — Identifier si les items utilisent déjà une prop icon ou si c'est à ajouter

- [x] T2 — Ajouter les icônes
  - [x] T2.1 — Créer ou mettre à jour le type NavItem pour inclure `icon: string` (emoji)
  - [x] T2.2 — Assigner une icône à chaque entrée de navigation (voir liste AC-4)
  - [x] T2.3 — Afficher l'icône à gauche du label dans le composant NavItem
  - [x] T2.4 — Style icône active : opacity 1 ; inactive : opacity 0.55
  - [x] T2.5 — Taille : 16-18px, marginRight: 8

- [x] T3 — Validation
  - [x] T3.1 — `npx tsc --noEmit` → zéro erreur
  - [ ] T3.2 — Screenshot Playwright → sidebar avec icônes visibles (app non démarrée)

## Dev Notes

### Fichiers à modifier
| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Ajouter icônes nav items |

## Dev Agent Record

- **Date** : 2026-04-04
- **Agent** : Amelia (Developer BMAD)
- **Fichiers modifiés** : 1
- **Items nav mis à jour** : 22 items répartis sur 6 groupes
- **TypeScript** : `npx tsc --noEmit` → 0 erreur
- **Playwright** : skipped — app non démarrée
- **Notes** : Nouveau type `NavItem` créé avec champ `icon: string`. Mode collapsed affiche l'icône seule (fontSize 18, opacity active/inactive). Mode expanded affiche `XStack` icône + label. Opacité 1 pour actif, 0.55 pour inactif (rendu natif emoji sans filtre CSS couleur).

## File List

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifié — type NavItem, icônes, rendu |
