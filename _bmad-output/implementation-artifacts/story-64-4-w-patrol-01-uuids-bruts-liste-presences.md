# Story 64.4 : W-PATROL-01 — UUIDs bruts dans liste présences

Status: done

Epic: 64 — Bugfix batch avril 2026 #3

## Story

En tant qu'admin ou coach Aureak,
je veux que la liste des présences affiche le nom complet du joueur à la place de son UUID,
afin de pouvoir identifier chaque joueur au premier coup d'oeil sans avoir à naviguer vers sa fiche.

## Acceptance Criteria

1. Chaque ligne de la liste des présences affiche le nom du joueur au format "Prénom NOM" (ou le `display_name` tel qu'il est en DB), jamais son UUID.
2. Si le nom du joueur est absent de la base de données → la ligne affiche "Joueur inconnu" (fallback explicite).
3. Le select API inclut le `display_name` (ou `full_name`) via un JOIN ou un select imbriqué — l'UUID seul n'est jamais le seul champ récupéré.
4. Aucune régression sur les autres colonnes de la liste des présences (statut, heure, boutons action).
5. `npx tsc --noEmit` retourne 0 erreur après correction.

## Tasks / Subtasks

- [x] T1 — Localiser la page et la fonction API concernées (AC: 1, 3)
  - [x] T1.1 — Lire `aureak/apps/web/app/(admin)/presences/` (index.tsx et/ou page.tsx)
  - [x] T1.2 — Lire la section présences de `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` si les présences y sont affichées
  - [x] T1.3 — Identifier la fonction API utilisée (probablement dans `@aureak/api-client/src/`) et son select Supabase actuel

- [x] T2 — Corriger la requête API (AC: 3)
  - [x] T2.1 — Dans la fonction API correspondante, vérifier le `.select()` Supabase
  - [x] T2.2 — La résolution des noms était déjà en place (double requête profiles + child_directory) — le bug était uniquement dans le fallback
  - [x] T2.3 — Aucun type TypeScript à modifier (AttendeeWithStatus.displayName: string déjà correct)

- [x] T3 — Corriger l'affichage UI (AC: 1, 2, 4)
  - [x] T3.1 — 4 occurrences de fallback UUID corrigées vers `'Joueur inconnu'` dans presences.ts (×2) et seances/[sessionId]/page.tsx (×2)
  - [x] T3.2 — Autres colonnes (statut, boutons, coachs) inchangées

- [x] T4 — Validation (AC: 5)
  - [x] T4.1 — `cd aureak && npx tsc --noEmit` → 0 erreur
  - [x] T4.2 — QA scan : aucun state setter sans try/finally dans les fichiers modifiés
  - [x] T4.3 — QA scan : tous les console.error sont guardés NODE_ENV

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais de requête directe dans apps/
- **Try/finally obligatoire** sur tout state setter de chargement
- **Console guards** : `if (process.env.NODE_ENV !== 'production') console.error(...)`

---

### T2 — Patterns Supabase pour les JOINs

Selon la structure de la table `attendance_records` :

```typescript
// Option A — si attendance_records.child_id → auth.users → profiles
const { data, error } = await supabase
  .from('attendance_records')
  .select('*, profiles!attendance_records_child_id_fkey(display_name)')
  .eq('session_id', sessionId)

// Option B — si la relation est sur un autre nom de FK
const { data, error } = await supabase
  .from('attendance_records')
  .select('id, session_id, child_id, status, recorded_at, profiles(display_name)')
  .eq('session_id', sessionId)

// Option C — si child_directory (pas auth.users)
const { data, error } = await supabase
  .from('attendance_records')
  .select('*, child_directory(display_name)')
  .eq('session_id', sessionId)
```

Inspecter le schéma DB pour identifier la FK correcte avant de choisir l'option.

---

### T3 — Pattern d'affichage avec fallback

```tsx
// Dans le composant liste présences
{attendances.map((record) => (
  <View key={record.id} style={styles.row}>
    <Text style={styles.playerName}>
      {record.profiles?.display_name ?? 'Joueur inconnu'}
    </Text>
    <Text style={styles.status}>{record.status}</Text>
    {/* autres colonnes inchangées */}
  </View>
))}
```

---

### T2 — Mise à jour du type TypeScript

Si le type existant ne contient pas `display_name`, l'étendre :

```typescript
// Dans @aureak/api-client/src/ — fonction concernée
export type AttendanceRecordWithProfile = {
  id: string
  sessionId: string
  childId: string
  status: string
  recordedAt: string
  profiles: {
    displayName: string | null
  } | null
}
```

Ne pas modifier `@aureak/types/src/entities.ts` si le type `AttendanceRecord` est utilisé ailleurs — créer un type étendu local dans le fichier API.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/presences/` ou `seances/[sessionId]/page.tsx` | Modifier | Remplacer UUID par display_name |
| `aureak/packages/api-client/src/[module-presences].ts` | Modifier | Ajouter JOIN profiles dans le select |

### Fichiers à NE PAS modifier

- `supabase/migrations/` — aucune migration nécessaire (JOIN via select, pas de colonne ajoutée)
- `aureak/packages/types/src/entities.ts` — ne pas modifier le type `AttendanceRecord` de base
- Autres pages non concernées par les présences

---

### Dépendances à protéger

- La signature de `recordAttendance()` ne doit pas être modifiée (utilisée par story 49-4 et 54-5)
- Le type `AttendanceRecord` de base dans `@aureak/types` ne doit pas changer (rétrocompat)

---

### Multi-tenant

Le filtre tenant est assuré par RLS sur `attendance_records`. Aucun paramètre tenantId supplémentaire nécessaire.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/packages/api-client/src/sessions/presences.ts` | Modifié |
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | Modifié |
