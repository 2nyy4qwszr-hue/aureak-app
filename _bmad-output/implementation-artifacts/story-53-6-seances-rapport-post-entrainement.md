# Story 53-6 — Séances : Rapport post-entraînement automatique

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-6
- **Status** : done
- **Priority** : P2
- **Type** : Feature
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 19-5 (done — fiche séance), Story 49-4 (ready — présences avec toggle)

---

## User Story

**En tant qu'admin ou coach**, après avoir clôturé une séance, je veux voir un résumé automatique affiché sur la fiche — taux de présence, note moyenne des évaluations, et "joueur du match" de la séance — afin d'avoir une synthèse rapide sans devoir naviguer vers plusieurs sections.

---

## Contexte technique

### Fichier cible
`aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx`

### Données disponibles dans la page
- `attendances: Attendance[]` — contient `childId` et `status`
- `groupMembers: GroupMemberWithDetails[]` — taille du groupe (dénominateur du taux)
- Pas d'évaluations chargées actuellement — il faudra les charger depuis `@aureak/api-client`

### API disponibles
- `listEvaluationsBySession(sessionId)` — à vérifier/créer si non existant
- Les évaluations ont un champ `score` ou équivalent dans la table `evaluations`

### Ce qui est demandé
Une section "Résumé de séance" visible uniquement si `session.status === 'réalisée'` ou `'réalisée'`, affichant 3 métriques auto-calculées.

---

## Acceptance Criteria

1. **AC1** — La section "Résumé" n'est visible que si `session.status === 'réalisée'`. Elle est masquée pour les statuts `planifiée`, `en_cours`, `annulée`, `reportée`.

2. **AC2** — La section affiche la métrique **Taux de présence** : `(nb présents / nb membres du groupe) * 100` arrondi à l'entier. Affiché en grand chiffre (32px bold) avec label "Présents" et barre de progression colorée (vert ≥80%, orange 60–79%, rouge <60%).

3. **AC3** — La section affiche la métrique **Note moyenne** : moyenne des scores d'évaluation pour la séance. Si aucune évaluation, affiche "—". Format : chiffre sur 10 avec 1 décimale.

4. **AC4** — La section affiche le **Joueur du match** : l'enfant qui a la meilleure note d'évaluation pour cette séance. En cas d'ex-æquo, prendre le premier alphabétiquement. Affiche avatar initiales + nom + badge "⭐ Top joueur".

5. **AC5** — Si aucune évaluation n'est disponible, les métriques Note moyenne et Joueur du match affichent "Non évalué" avec `color: colors.text.muted`.

6. **AC6** — Les évaluations sont chargées dans le `load()` existant (en parallèle avec les autres requêtes) uniquement si `session.status === 'réalisée'` pour éviter des requêtes inutiles.

7. **AC7** — La section est stylisée comme une card premium : fond `colors.light.surface`, bordure or (`colors.border.gold`), ombre `shadows.md`, titre "Résumé de séance" en gold.

8. **AC8** — Les données du résumé sont calculées en `useMemo` pour éviter les recalculs inutiles.

---

## Tasks

- [x] **T1 — Vérifier l'API `listEvaluationsBySession`**
  - Chercher dans `@aureak/api-client/src/` si une fonction pour lister les évaluations par séance existe
  - Si elle n'existe pas, créer `listEvaluationsBySession(sessionId: string)` dans le fichier approprié
  - L'évaluation contient au minimum : `childId`, `score` (ou `globalScore`), `coachId`

- [x] **T2 — State évaluations**
  - Ajouter `useState<EvaluationRow[]>` : `evaluations`
  - Dans `load()` : si `session.status === 'réalisée'`, charger les évaluations en parallèle avec les autres requêtes

- [x] **T3 — useMemo résumé**
  - Calculer en `useMemo` depuis `attendances`, `groupMembers`, `evaluations` :
    ```typescript
    const sessionSummary = useMemo(() => {
      const presentCount = attendances.filter(a => a.status === 'present').length
      const totalCount = groupMembers.length || 1
      const presenceRate = Math.round((presentCount / totalCount) * 100)
      const scores = evaluations.map(e => e.score).filter(Boolean)
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
      const topEval = evaluations.length ? evaluations.reduce((a, b) => (b.score > a.score ? b : a)) : null
      return { presenceRate, avgScore, topEval, presentCount, totalCount }
    }, [attendances, groupMembers, evaluations])
    ```

- [x] **T4 — Composant `SessionSummaryCard`**
  - Composant local dans `page.tsx`
  - Props : `{ summary: SessionSummaryData; childNameMap: Record<string, string> }`
  - 3 colonnes de métriques (ou 1 colonne mobile)
  - Chaque métrique : label en caps 9px muted, valeur en 32px bold, sous-label contextuel

- [x] **T5 — Intégrer dans la page**
  - Afficher `<SessionSummaryCard>` en premier élément du contenu (après le header) si `session.status === 'réalisée'`

- [x] **T6 — QA scan**
  - try/finally sur le chargement des évaluations dans `load()`
  - Console guard sur les erreurs de chargement
  - `useMemo` correctement dépendant de `[attendances, groupMembers, evaluations]`

---

## Design détaillé

```
┌─────────────────────────────────────────────── bordure or ──┐
│  Résumé de séance                            (gold titre)    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 87%          │  │ 7.4/10       │  │ ⭐ Martin D.      │  │
│  │ PRÉSENTS     │  │ NOTE MOY.    │  │ TOP JOUEUR       │  │
│  │ 7 / 8 joueurs│  │ 3 évaluations│  │ 9.2/10           │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ████████░░░ 87%                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fichiers à modifier/créer

| Fichier | Modification |
|---------|-------------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter chargement évaluations + useMemo résumé + `SessionSummaryCard` |
| `aureak/packages/api-client/src/evaluations.ts` | Ajouter `listEvaluationsBySession` si absent |
| `aureak/packages/api-client/src/index.ts` | Exporter si nouvelle fonction |

---

## Pas de migration SQL

Cette story n'ajoute pas de colonne. Elle lit des données existantes.

---

## Commit

```
feat(epic-53): story 53-6 — rapport post-entraînement automatique sur fiche séance clôturée
```
