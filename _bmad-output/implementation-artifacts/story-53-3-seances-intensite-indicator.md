# Story 53-3 — Séances : Indicateur d'intensité 5 niveaux

## Metadata

- **Epic** : 53 — Séances "Training Ground"
- **Story** : 53-3
- **Status** : done
- **Priority** : P2
- **Type** : Feature
- **Estimated effort** : M (3–5h)
- **Dependencies** : Story 19-5 (done — fiche séance), Story 53-2 (ready — header, peut être développé indépendamment)

---

## User Story

**En tant qu'admin ou coach**, quand je consulte ou clôture une séance, je veux pouvoir indiquer le niveau d'intensité de la séance via une barre visuelle de 5 niveaux (⬤⬤⬤⬤○), colorée en or pour les niveaux 1–3 et en rouge pour 4–5, afin de suivre la charge d'entraînement et anticiper la récupération des joueurs.

---

## Contexte technique

### Fichiers cibles
- `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` — affichage + interaction
- `aureak/packages/api-client/src/sessions.ts` (ou fichier API existant) — `updateSessionIntensity`
- `supabase/migrations/` — migration pour ajouter colonne `intensity_level`

### Schéma DB actuel
Table `sessions` — vérifier si `intensity_level` existe déjà. Si non, la migration ajoute :
```sql
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS intensity_level SMALLINT CHECK (intensity_level BETWEEN 1 AND 5);
```

### Type TS actuel
`Session` dans `@aureak/types` — ajouter `intensityLevel?: number | null`.

---

## Acceptance Criteria

1. **AC1** — La fiche séance affiche une section "Intensité" avec 5 cercles cliquables (⬤ rempli / ○ vide). Le niveau actuel est prérempli depuis `session.intensityLevel`.

2. **AC2** — Niveaux 1–3 : cercles colorés `colors.accent.gold`. Niveaux 4–5 : cercles colorés `colors.accent.red` (#E05252). Cercles non remplis : `colors.border.light`.

3. **AC3** — Sous les cercles, un label textuel contextuel : `1 = Récupération active`, `2 = Charge légère`, `3 = Charge standard`, `4 = Charge élevée`, `5 = Haute intensité`.

4. **AC4** — Cliquer un cercle appelle `updateSessionIntensity(sessionId, level)` via `@aureak/api-client`. Mise à jour optimiste immédiate. Toast de confirmation en cas de succès.

5. **AC5** — En cas d'erreur API, rollback de l'état optimiste et affichage d'un message d'erreur inline dans la section.

6. **AC6** — La section Intensité est désactivée (opacity 0.5, non cliquable) si `session.status === 'annulée'`.

7. **AC7** — La migration SQL ajoute la colonne `intensity_level` sans valeur par défaut (nullable) — une séance sans intensité définie est acceptable.

8. **AC8** — Le type `Session.intensityLevel` est ajouté dans `@aureak/types/entities.ts` comme `intensityLevel?: number | null`.

---

## Tasks

- [x] **T1 — Migration SQL**
  - Numéroter après la dernière migration (`ls supabase/migrations/ | tail -3`)
  - Fichier : `NNNNN_sessions_intensity_level.sql`
  - Contenu : `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS intensity_level SMALLINT CHECK (intensity_level BETWEEN 1 AND 5);`

- [x] **T2 — Type TS**
  - Ajouter `intensityLevel?: number | null` dans l'interface `Session` de `@aureak/types/entities.ts`

- [x] **T3 — API `updateSessionIntensity`**
  - Dans `@aureak/api-client/src/sessions.ts` (ou fichier approprié) :
    ```typescript
    export async function updateSessionIntensity(sessionId: string, level: number): Promise<void> {
      const { error } = await supabase
        .from('sessions')
        .update({ intensity_level: level })
        .eq('id', sessionId)
      if (error) throw error
    }
    ```
  - Exporter depuis `@aureak/api-client/src/index.ts`

- [x] **T4 — Composant `IntensityPicker`**
  - Composant local dans `page.tsx`
  - Props : `{ value: number | null; onChange: (level: number) => void; disabled?: boolean }`
  - 5 `Pressable` en ligne `flexDirection: 'row', gap: 8`
  - Cercle 28px × 28px, border-radius 14px
  - Couleur : or si `i <= 3 && i <= value`, rouge si `i >= 4 && i <= value`, light sinon

- [x] **T5 — Intégration dans la fiche séance**
  - Ajouter state : `intensityLevel: number | null` initialisé depuis `session.intensityLevel`
  - Ajouter state : `intensitySaving: boolean`, `intensityError: string | null`
  - Handler `handleIntensityChange(level: number)` avec try/finally obligatoire
  - Placer la section "Intensité" après le header et avant les thèmes pédagogiques

- [x] **T6 — QA scan**
  - try/finally sur `handleIntensityChange`
  - Console guards sur catch
  - Colonne DB bien nullable

---

## Design détaillé

```
Intensité de la séance
⬤  ⬤  ⬤  ⬤  ○
━━━━━━━━━━━━━━━━ Charge standard (niveau 3)
```

- Cercles : 28px, gap 12px
- Or pour 1–3, Rouge pour 4–5
- Label sous : `fontSize: 11, color: colors.text.muted`

---

## Fichiers à modifier/créer

| Fichier | Modification |
|---------|-------------|
| `supabase/migrations/NNNNN_sessions_intensity_level.sql` | CREATE — colonne `intensity_level` |
| `aureak/packages/types/src/entities.ts` | Ajouter `intensityLevel` dans `Session` |
| `aureak/packages/api-client/src/sessions.ts` | Ajouter `updateSessionIntensity` |
| `aureak/packages/api-client/src/index.ts` | Exporter `updateSessionIntensity` |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Ajouter section Intensité + handler |

---

## Commit

```
feat(epic-53): story 53-3 — indicateur intensité 5 niveaux sur fiche séance
```
