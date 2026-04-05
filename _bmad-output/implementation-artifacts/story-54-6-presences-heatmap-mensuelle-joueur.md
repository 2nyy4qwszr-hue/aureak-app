# Story 54-6 — Présences : Heatmap mensuelle joueur

## Metadata

- **Epic** : 54 — Présences "Squad Status Board"
- **Story** : 54-6
- **Status** : done
- **Priority** : P2
- **Type** : Feature / Nouveau composant
- **Estimated effort** : L (5–8h)
- **Dependencies** : Story 18-2 (done — fiche joueur `children/[childId]/page.tsx`)

---

## User Story

**En tant qu'admin**, quand je consulte la fiche d'un joueur, je veux voir une heatmap mensuelle de ses présences (cellule verte/rouge/grise par séance, avec tooltip détail au hover), afin d'identifier les patterns d'absence et de présence d'un seul coup d'œil visuel.

---

## Contexte technique

### Fichiers cibles
- Nouveau composant : `aureak/packages/ui/src/AttendanceHeatmap.tsx`
- Modification : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — section présences

### API à créer
`listAttendancesByChild(childId: string, startDate: string, endDate: string)` — retourne les présences d'un joueur sur une période.

Structure retour :
```typescript
type AttendanceHistoryRow = {
  sessionId   : string
  sessionDate : string
  sessionType : string
  groupName   : string
  status      : AttendanceStatus
}
```

### Schéma DB
La table `attendances` a `child_id` + `session_id`. La table `sessions` a `session_date`, `group_id`, `session_type`. Un JOIN est nécessaire.

---

## Acceptance Criteria

1. **AC1** — La section "Présences" dans `children/[childId]/page.tsx` affiche une heatmap mensuelle sur 12 mois glissants.

2. **AC2** — La heatmap est une grille de cellules : 1 ligne par mois, les colonnes représentant les jours du mois (1→31). Les cellules sans séance sont grises (`colors.light.muted`).

3. **AC3** — Couleurs des cellules selon le statut de présence : vert foncé (`#059669`) = présent; rouge (`colors.accent.red`) = absent; orange (`#F59E0B`) = late/trial; gris = pas de séance ce jour.

4. **AC4** — Au hover sur une cellule avec séance, un tooltip est affiché avec : date formatée, nom du groupe, type de séance, statut de présence.

5. **AC5** — Un sélecteur de mois de référence (≤12 mois en arrière) permet de naviguer dans l'historique.

6. **AC6** — Sous la heatmap, un résumé chiffré : "X présences / Y séances (Z%)" sur la période affichée.

7. **AC7** — Le composant `AttendanceHeatmap` est exporté depuis `@aureak/ui`.

8. **AC8** — Si aucune séance n'est trouvée sur la période, le composant affiche "Aucune séance enregistrée sur cette période" (pas une grille vide confuse).

---

## Tasks

- [x] **T1 — Créer `listAttendancesByChild` dans `@aureak/api-client`**

  ```typescript
  export async function listAttendancesByChild(
    childId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceHistoryRow[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select(`
        session_id,
        status,
        sessions!inner(session_date, session_type, group_id,
          groups!inner(name)
        )
      `)
      .eq('child_id', childId)
      .gte('sessions.session_date', startDate)
      .lte('sessions.session_date', endDate)
      .order('sessions.session_date', { ascending: true })
    if (error) throw error
    return (data ?? []).map(row => ({
      sessionId  : row.session_id,
      sessionDate: (row.sessions as any).session_date,
      sessionType: (row.sessions as any).session_type,
      groupName  : (row.sessions as any).groups?.name ?? '',
      status     : row.status as AttendanceStatus,
    }))
  }
  ```

- [x] **T2 — Créer `AttendanceHeatmap.tsx` dans `@aureak/ui/src/`**

  Props :
  ```typescript
  type AttendanceHeatmapProps = {
    data         : AttendanceHistoryRow[]
    referenceYear: number
    referenceMonth: number  // 0-11
  }
  ```

  Layout : 12 lignes (mois) × 31 colonnes (jours). Cellule = 14px × 14px, gap 2px.

  Tooltip : `useState<{ row: AttendanceHistoryRow; x: number; y: number } | null>` + `View` positionné en `position: absolute`.

- [x] **T3 — Exporter depuis `@aureak/ui`**
  - `export { AttendanceHeatmap } from './AttendanceHeatmap'`
  - Exporter aussi le type `AttendanceHistoryRow` depuis `@aureak/types` si non existant

- [x] **T4 — Intégrer dans `children/[childId]/page.tsx`**
  - Charger les données des 12 derniers mois dans le `load()` existant
  - Ajouter section "Présences" avec `<AttendanceHeatmap>`
  - Résumé chiffré sous la heatmap

- [x] **T5 — Sélecteur mois de référence**
  - `useState<Date>` : `heatmapRef` initialisé à `new Date()`
  - Boutons prev/next month qui recalculent la fenêtre de 12 mois

- [x] **T6 — QA scan**
  - try/finally sur le chargement des attendances child
  - Console guard sur l'erreur API
  - Export correct depuis `@aureak/ui`

---

## Design détaillé

```
Présences (12 mois glissants)

        1  2  3  4  5  6  7 ... 31
Avr  26 ░  ░  ░  ░  █  ░  ░     ░
Mar  26 ░  █  ░  ░  ░  █  ░     ░
Fév  26 █  ░  ░  █  ░  ░  ░     ░
Jan  26 ░  ░  █  ░  ░  ░  █     ░
...

🟢 = présent   🔴 = absent   🟠 = retard   ░ = pas de séance

32 présences / 38 séances (84%)
```

Tooltip au hover :
```
Mercredi 05 mars 2026
U12 Gardiens Liège A
Technique
✓ Présent
```

---

## Fichiers à créer/modifier

| Fichier | Modification |
|---------|-------------|
| `aureak/packages/api-client/src/attendances.ts` | Ajouter `listAttendancesByChild` |
| `aureak/packages/api-client/src/index.ts` | Exporter |
| `aureak/packages/ui/src/AttendanceHeatmap.tsx` | CREATE — composant heatmap |
| `aureak/packages/ui/src/index.ts` | Exporter `AttendanceHeatmap` |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | Ajouter section présences heatmap |

---

## Pas de migration SQL

Lit les tables `attendances` + `sessions` + `groups` existantes.

---

## Commit

```
feat(epic-54): story 54-6 — heatmap mensuelle présences joueur dans sa fiche
```
