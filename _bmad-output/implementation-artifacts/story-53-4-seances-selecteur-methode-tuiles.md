# Story 53-4 — Séances : Sélecteur méthode visuel grandes tuiles

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-4
- **Status** : ready-for-dev
- **Priority** : P2
- **Type** : UX / Design
- **Estimated effort** : S (2–3h)
- **Dependencies** : Story 19-4 (done — formulaire new.tsx avec étapes)

---

## User Story

**En tant qu'admin ou coach**, quand je crée une nouvelle séance et que je dois choisir la méthode pédagogique (Step 1), je veux sélectionner via de grandes tuiles visuelles avec icône, couleur et nom, plutôt qu'un dropdown texte, afin de choisir plus rapidement et de visualiser la couleur associée à la méthode avant même de créer la séance.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/new.tsx`

### État actuel
Dans `new.tsx`, le Step 1 contient un sélecteur de `sessionType` via le `GenerateModal` (chips textuelles). Le formulaire multi-étapes expose la méthode en Step 1 ou 2 — lire le fichier pour identifier l'emplacement exact.

La constante `SESSION_TYPE_TO_METHOD` est définie localement et mappes les `SessionType` vers des labels.

`TYPE_COLOR` est importé depuis `_components/constants.ts`.

### Ce qui est demandé
Remplacer le sélecteur de méthode (chips/dropdown texte) dans la création de séance par une grille de grandes tuiles visuelles (minimum 2 colonnes).

---

## Acceptance Criteria

1. **AC1** — Le sélecteur de méthode pédagogique dans `new.tsx` est remplacé par une grille de tuiles, 3 colonnes sur desktop, 2 colonnes sur mobile.

2. **AC2** — Chaque tuile affiche : une icône en haut (emoji 28px), la couleur de la méthode comme accent (bordure gauche 4px ou fond coloré à 15% opacité), le nom de la méthode en bold, et une courte description (1 ligne).

3. **AC3** — La tuile sélectionnée a : fond coloré à 25% opacité, bordure pleine colorée 2px, et un checkmark ✓ en haut à droite.

4. **AC4** — Les tuiles non sélectionnées ont : fond `colors.light.surface`, bordure `colors.border.light` 1px. Hover : fond `colors.light.hover`.

5. **AC5** — Une seule tuile peut être sélectionnée à la fois. La sélection met à jour `sessionType` dans le state parent de `new.tsx`.

6. **AC6** — La validation du Step 1 (`step1Valid`) requiert qu'une tuile soit sélectionnée (comportement inchangé).

7. **AC7** — Les descriptions courtes de chaque méthode sont définies comme constante locale dans `new.tsx` :
   - `goal_and_player` : "Travail combiné gardien + joueur de champ"
   - `technique` : "Fondamentaux techniques du gardien"
   - `situationnel` : "Situations de jeu réelles"
   - `decisionnel` : "Prise de décision sous pression"
   - `perfectionnement` : "Affinement des habiletés avancées"
   - `integration` : "Intégration équipe complète"

---

## Tasks

- [x] **T1 — Lire le Step 1 actuel dans `new.tsx`**
  - Identifier les lignes exactes du sélecteur `sessionType` à remplacer
  - Vérifier que `sessionType` est bien un `useState<SessionType>` dans le composant parent

- [x] **T2 — Créer le composant `MethodTileGrid`**
  - Composant local dans `new.tsx`
  - Props : `{ value: SessionType | null; onChange: (t: SessionType) => void }`
  - Grille : `flexDirection: 'row', flexWrap: 'wrap', gap: space.sm`
  - Chaque tuile : `width: 'calc(33% - space.sm)'` (desktop) / `width: 'calc(50% - space.sm)'` (mobile)
  - Tuile = `Pressable` avec `borderRadius: radius.sm`, `padding: space.md`, `borderWidth: 2`

- [x] **T3 — Constantes descriptions**
  - Définir `SESSION_TYPE_DESCRIPTIONS: Record<SessionType, string>` avec les 6 descriptions ci-dessus
  - Définir `SESSION_TYPE_ICON` (si pas déjà dans constants.ts) : `{ goal_and_player: '⚽', technique: '🎯', situationnel: '📐', decisionnel: '🧠', perfectionnement: '💎', integration: '🔗' }`

- [x] **T4 — Remplacer l'ancien sélecteur**
  - Supprimer les chips textuelles actuelles
  - Intégrer `<MethodTileGrid value={sessionType} onChange={setSessionType} />`

- [x] **T5 — QA scan**
  - Vérifier que `step1Valid` reste fonctionnel
  - Vérifier qu'aucun style hardcodé n'a été introduit
  - Vérifier le bon affichage sur le `GenerateModal` (qui a ses propres chips — ne pas le modifier)

---

## Design détaillé

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ⚽              ✓ │  │ 🎯               │  │ 📐               │
│ Goal & Player   │  │ Technique        │  │ Situationnel    │
│ Travail combiné │  │ Fondamentaux…   │  │ Situations…     │
│ gardien+joueur  │  │                  │  │                  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
  fond or 25%         fond surface          fond surface
  bordure or 2px      bordure light 1px     bordure light 1px
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/new.tsx` | Remplacer sélecteur sessionType par `MethodTileGrid` |

---

## Pas de migration SQL

Cette story est 100% front-end.

---

## Commit

```
feat(epic-53): story 53-4 — sélecteur méthode grandes tuiles visuelles dans création séance
```
