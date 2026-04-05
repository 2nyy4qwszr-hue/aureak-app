# Story 53-10 — Séances : Assignation coach drag-and-drop

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-10
- **Status** : done
- **Priority** : P3
- **Type** : Feature / UX
- **Estimated effort** : L (6–8h)
- **Dependencies** : Story 19-4 (done — new.tsx step coaches), Story 19-5 (done — fiche séance édition coaches)

---

## User Story

**En tant qu'admin**, quand j'assigne des coaches à une séance (création ou édition), je veux pouvoir glisser-déposer les coaches d'une zone "Disponibles" vers une zone "Assignés" (et vice-versa) via DnD natif HTML5, sans librairie externe, afin d'avoir une interface intuitive similaire à un tableau tactique.

---

## Contexte technique

### Fichiers cibles
- `aureak/apps/web/app/(admin)/seances/new.tsx` — Step coaches (step 2 ou 3 selon la config actuelle)
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — section édition coaches

### Contraintes techniques
- **Pas de librairie DnD externe** (pas de `react-dnd`, `dnd-kit`, etc.)
- Utiliser les events natifs HTML5 `draggable`, `onDragStart`, `onDragOver`, `onDrop`
- React Native Web supporte les handlers DnD sur `View` via les props DOM directes

### Coaches disponibles
- `listAvailableCoaches()` — retourne la liste des coaches de la plateforme
- `coaches: SessionCoach[]` — coaches déjà assignés à la séance

---

## Acceptance Criteria

1. **AC1** — L'interface d'assignation des coaches est composée de deux colonnes : "Disponibles" (gauche) et "Assignés" (droite). Les coaches sont représentés par des cartes draggables.

2. **AC2** — Chaque carte coach affiche : avatar initiales (fond or), nom complet, et rôle (si disponible).

3. **AC3** — Glisser un coach de "Disponibles" vers "Assignés" l'ajoute à la liste d'assignés avec animation de drop (background de la zone cible verte pendant le survol).

4. **AC4** — Glisser un coach de "Assignés" vers "Disponibles" le retire de la liste.

5. **AC5** — Cliquer sur un coach (sans drag) fait basculer son assignation (double-clic ou simple clic en fallback mobile-friendly).

6. **AC6** — La zone de drop est mise en évidence (bordure or + fond or 10%) quand un drag est actif au-dessus d'elle (`onDragOver`).

7. **AC7** — L'état des coaches assignés est synchronisé avec le state parent (`selectedCoachIds: string[]` ou équivalent dans `new.tsx`).

8. **AC8** — L'interface est fonctionnelle sans JavaScript DnD (fallback clavier) : les coaches peuvent être assignés/désassignés via des boutons "+" et "−" visibles sur chaque carte.

---

## Tasks

- [x] **T — Lire le step coaches dans `new.tsx`**
  - Identifier les lignes exactes du sélecteur de coaches actuel
  - Identifier le state `selectedCoachIds` ou équivalent
  - Identifier comment `availableCoaches` est chargé

- [x] **T — Créer le composant `CoachDndBoard`**
  - Composant local (dans `new.tsx` ou fichier `_components/CoachDndBoard.tsx`)
  - Props :
    ```typescript
    type CoachDndBoardProps = {
      availableCoaches: { id: string; name: string }[]
      assignedCoachIds: string[]
      onAssign: (coachId: string) => void
      onUnassign: (coachId: string) => void
    }
    ```

- [x] **T — Logique DnD HTML5**
  - `draggedCoachId: string | null` — state local au composant
  - `dragSourceZone: 'available' | 'assigned' | null`
  - Carte coach : `<div draggable onDragStart={() => { setDraggedCoachId(id); setDragSource('available') }}>`
  - Zone drop : `<div onDragOver={e => e.preventDefault()} onDrop={() => { if (draggedCoachId) onAssign(draggedCoachId) }}>`

  Note : utiliser `View` avec spread de props DOM via `(View as any)` ou wrapping `<div>` natif — à adapter selon ce qui est déjà utilisé dans `new.tsx`.

- [x] **T — Fallback boutons +/−**
  - Sur chaque carte dans "Disponibles" : bouton "+" en overlay à droite
  - Sur chaque carte dans "Assignés" : bouton "−" en overlay à droite
  - Accessibilité clavier maintenue

- [x] **T — Style drag actif**
  - Zone "Assignés" : `dragOverAssigned` state boolean
  - Si `true` : `borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '12'`
  - Card en drag : opacity 0.5

- [x] **T — Remplacer l'ancien sélecteur dans `new.tsx`**
  - Intégrer `<CoachDndBoard>` à la place de l'interface de sélection actuelle

- [x] **T — Intégrer dans `[sessionId]/page.tsx` pour édition coaches**
  - Identifier la section édition coaches existante
  - Remplacer ou augmenter avec `<CoachDndBoard>` en mode édition (avec handlers `assignCoach`/`removeCoach` API)

- [x] **T — QA scan**
  - try/finally sur les appels API d'assignation dans la page fiche séance
  - Console guards sur les erreurs
  - Vérifier comportement sur mobile (touch events — limiter l'ambition DnD, garder le fallback boutons)

---

## Design détaillé

```
┌──────────────────────────┐  ┌──────────────────────────┐
│  Disponibles (3)         │  │  Assignés (2)            │
│                          │  │  ┌──────────────────────┐│
│  [JD] Jean Dupont      + │  │  │[MD] Marc Durand    -  ││
│                          │  │  └──────────────────────┘│
│  [AL] Anne Leroy       + │  │  ┌──────────────────────┐│
│                          │  │  │[SB] Sarah Bernard  -  ││
│  [PT] Paul Thomas      + │  │  └──────────────────────┘│
│                          │  │                          │
│                          │  │  ↓ Glisser ici           │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Fichiers à modifier/créer

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Remplacer sélecteur coaches par `CoachDndBoard` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Augmenter section coaches avec DnD |
| `aureak/apps/web/app/(admin)/seances/_components/CoachDndBoard.tsx` | CREATE — composant DnD |

---

## Pas de migration SQL

Cette story est 100% front-end.

---

## Commit

```
feat(epic-53): story 53-10 — assignation coach drag-and-drop natif HTML5
```
