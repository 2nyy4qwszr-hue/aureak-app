# Story 54-5 — Présences : Validation groupée "Tous présents"

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-5
- **Status** : done
- **Priority** : P2
- **Type** : Feature / UX
- **Estimated effort** : S (2–3h)
- **Dependencies** : Story 54-1 (ready — squad overview avec grille), Story 49-4 (ready — recordAttendance)

---

## User Story

**En tant qu'admin ou coach**, quand tous les joueurs d'un groupe sont présents à une séance (cas le plus fréquent), je veux pouvoir valider toutes les présences en un seul clic via un bouton "Tous présents", avec une animation de validation et un micro-confetti sobre, afin d'éviter de cliquer un par un sur 8–12 joueurs.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### API
`recordAttendance` existant — appelé en batch pour tous les membres du groupe.

### Micro-confetti sobre
L'animation confetti est implémentée en CSS/React pur (pas de librairie canvas) :
- 8 petits cercles colorés qui s'envolent depuis le bouton (animation `transform: translate + scale → 0`)
- Couleurs : `colors.accent.gold`, `colors.status.success`, `colors.accent.red`
- Durée : 600ms
- Implémenté via `useState<boolean>` qui déclenche une classe CSS ou des styles absolus temporaires

---

## Acceptance Criteria

1. **AC1** — Un bouton "✓ Tous présents" est affiché dans le header de la section présences.

2. **AC2** — Le bouton est désactivé si tous les joueurs du groupe sont déjà marqués "présent" (aucune action à faire).

3. **AC3** — Cliquer le bouton déclenche un **optimistic update** : tous les joueurs non-présents sont immédiatement affichés en "présent" dans l'UI.

4. **AC4** — En parallèle de l'optimistic update, les appels `recordAttendance(sessionId, childId, 'present')` sont lancés en batch (`Promise.allSettled`) pour tous les joueurs non-présents.

5. **AC5** — Une animation micro-confetti sobre (8 particules depuis le bouton) est déclenchée au moment de l'optimistic update.

6. **AC6** — Si certains appels échouent dans le batch, les joueurs concernés sont rollback (retour à leur statut précédent) et un message d'erreur discret est affiché : "X présences n'ont pas pu être enregistrées".

7. **AC7** — Un toast vert "✓ X présences enregistrées" est affiché en cas de succès complet.

8. **AC8** — Le bouton affiche un état de chargement ("En cours…") pendant le batch, puis revient à son état normal.

---

## Tasks

- [x] **T1 — Identifier les membres non-présents**
  - `useMemo` : `notPresentMembers = groupMembers.filter(m => attendanceMap[m.childId] !== 'present')`
  - Si `notPresentMembers.length === 0` → bouton désactivé

- [x] **T2 — Handler `handleMarkAllPresent`**

  ```typescript
  const handleMarkAllPresent = async () => {
    if (saving || notPresentMembers.length === 0) return
    const previousMap = { ...attendanceMap }
    // Optimistic update
    const newMap = { ...attendanceMap }
    notPresentMembers.forEach(m => { newMap[m.childId] = 'present' })
    setAttendanceMap(newMap)
    triggerConfetti()
    setSaving(true)
    try {
      const results = await Promise.allSettled(
        notPresentMembers.map(m =>
          recordAttendance({ sessionId, childId: m.childId, tenantId: session!.tenantId, status: 'present', recordedBy: '' })
        )
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        // Rollback failed ones
        setAttendanceError(`${failed.length} présence(s) n'ont pas pu être enregistrées`)
        // partial rollback...
      }
    } finally {
      setSaving(false)
    }
  }
  ```

- [x] **T3 — Animation confetti**
  - `useState<boolean>` : `showConfetti`
  - Quand `showConfetti = true` : rendre 8 `View` absolus animés (via `useEffect + setTimeout`)
  - Chaque particule : cercle 8px, couleur aléatoire parmi les tokens, `transform: translateY(-30px) scale(0)` après 600ms
  - `useEffect` : reset `showConfetti` à `false` après 700ms

- [x] **T4 — Bouton dans le header de section**
  - À droite du label "Présences (X/Y)"
  - Fond `colors.status.success`, texte blanc, désactivé si tous présents

- [x] **T5 — QA scan**
  - try/finally obligatoire sur `handleMarkAllPresent` ✓
  - Console guards sur les rejections du batch
  - Vérifier que le rollback partiel est correct (ne pas rollback les présences réussies)

---

## Design détaillé

```
Section header :
Présences (7/8 joueurs)                     [✓ Tous présents]

Au clic :
Présences (8/8 joueurs)   🎊 (confetti)     [✓ Tous présents ✓]
                                              grisé (tous déjà présents)

Toast vert : "✓ 1 présence enregistrée"
```

---

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter bouton "Tous présents" + handler batch + confetti |

---

## Pas de migration SQL

Utilise `recordAttendance` existant.

---

## Commit

```
feat(epic-54): story 54-5 — validation groupée "Tous présents" avec confetti sobre
```
