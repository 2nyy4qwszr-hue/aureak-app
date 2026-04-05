# Story 49-7 — Affiliation automatique joueur → club par saison (auto-calcul depuis historique)

**Epic** : 49 — Bugfix + UX batch avril 2026 #2
**Status** : done
**Priority** : P3 — Feature données (affichage enrichi)
**Créée le** : 2026-04-04

---

## Contexte

Le champ `child_directory.current_club` est un champ texte libre saisi manuellement.
Il est souvent vide ou désynchronisé avec les données réelles d'affiliation.

La table `child_directory_history` contient pourtant le parcours football de chaque joueur
par saison (`saison TEXT`, `club_nom TEXT`, `club_directory_id UUID nullable`).
Pour chaque joueur ayant une entrée dans `child_directory_history` pour la saison courante
(déterminée par `academy_seasons WHERE is_current = true`), il est possible de déduire
automatiquement son club de la saison en cours **sans saisie manuelle**.

Ce calcul doit être fait côté SQL (vue idempotente) et exposé en lecture seule dans la fiche
joueur, en complément du champ manuel existant — sans jamais écraser `current_club`.

---

## User Story

**En tant qu'** admin,
**je veux** voir automatiquement le club calculé depuis l'historique football du joueur pour
la saison courante dans sa fiche,
**afin de** disposer d'une information fiable et à jour sans devoir mettre à jour manuellement
le champ "Club actuel" pour chaque joueur.

---

## Acceptance Criteria

### AC1 — Vue SQL `v_child_current_club`
- La vue `v_child_current_club` est créée (idempotente via `CREATE OR REPLACE VIEW`)
- Elle retourne, pour chaque `child_id` ayant un historique pour la saison courante :
  - `child_id UUID`
  - `saison TEXT` (ex : '2025-2026')
  - `club_nom TEXT`
  - `club_directory_id UUID nullable`
  - `club_nom_annuaire TEXT nullable` (nom officiel depuis `club_directory.nom` si FK renseignée)
- La saison courante est déterminée par `academy_seasons WHERE is_current = true`
- Si plusieurs lignes `is_current = true` existent (anomalie), utiliser la plus récente (`start_date DESC`)
- Si aucune saison `is_current = true`, la vue retourne 0 lignes (comportement sûr)
- La vue respecte l'isolation tenant : filtre `tenant_id` transmis via `current_tenant_id()`

### AC2 — Fonction API `getChildCurrentClubFromHistory`
- Une fonction `getChildCurrentClubFromHistory(childId: string)` est ajoutée dans
  `@aureak/api-client/src/admin/child-directory.ts`
- Elle retourne un objet de type `ChildCurrentClubFromHistory | null`
- `null` si aucune entrée pour la saison courante
- Le type `ChildCurrentClubFromHistory` est défini dans `@aureak/types` (nouveau type)
- La fonction utilise `supabase.from('v_child_current_club')` — pas de logique JS côté client

### AC3 — Type TypeScript séparé
- Le type `ChildCurrentClubFromHistory` est ajouté dans `@aureak/types/src/entities.ts`
  (ne pas modifier `ChildDirectoryEntry`)
- Champs : `childId`, `saison`, `clubNom`, `clubDirectoryId`, `clubNomAnnuaire`
- Le type est exporté depuis `@aureak/types/src/index.ts`

### AC4 — Affichage dans la fiche joueur
- Dans `(admin)/children/[childId]/page.tsx`, section "Club actuel & Affiliations" :
  - Une ligne "Club saison courante (calculé automatiquement)" est ajoutée AVANT la ligne
    "Club actuel" (champ manuel)
  - Elle affiche `clubNomAnnuaire ?? clubNom` de la réponse de la vue
  - Un badge "AUTO" (variant `goldOutline` ou `light`) est affiché à côté du nom
  - Si `clubDirectoryId` est renseigné, le nom du club est un lien cliquable vers
    `/admin/clubs/[clubDirectoryId]` (utiliser `useRouter().push(...)`)
  - Si la fonction retourne `null` (pas de donnée pour la saison courante), la ligne
    affiche "Non renseigné pour la saison courante" en texte muted — pas d'erreur
- Le champ manuel "Club actuel" (`child.currentClub`) reste présent et inchangé

### AC5 — Chargement respectant les règles de code
- L'appel `getChildCurrentClubFromHistory` est effectué dans un `useEffect` au montage
  (parallèle au chargement de la fiche, pas bloquant)
- `try/finally` obligatoire sur le state setter de chargement
- `console.error` avec guard `NODE_ENV !== 'production'` sur les erreurs catchées
- Si l'appel échoue (erreur réseau, vue non existante), la section affiche silencieusement
  "Non disponible" — pas de crash de la page

### AC6 — Pas de modification de `child_directory.current_club`
- La story ne crée **aucune logique d'écriture** sur `child_directory.current_club`
- La vue est strictement en lecture
- Aucun trigger, cron, ou Edge Function ne met à jour `current_club`

---

## Technical Notes

### SQL — Vue `v_child_current_club`

```sql
CREATE OR REPLACE VIEW v_child_current_club AS
WITH effective_season AS (
  SELECT DISTINCT ON (tenant_id)
    id        AS season_id,
    tenant_id,
    label     AS saison_label
  FROM academy_seasons
  WHERE is_current = true
  ORDER BY tenant_id, start_date DESC
)
SELECT
  h.child_id,
  h.tenant_id,
  h.saison,
  h.club_nom,
  h.club_directory_id,
  cd.nom AS club_nom_annuaire
FROM child_directory_history h
JOIN effective_season es
  ON es.tenant_id = h.tenant_id
 AND es.saison_label = h.saison
LEFT JOIN club_directory cd
  ON cd.id = h.club_directory_id;
```

**Notes importantes :**
- La vue joint sur `es.saison_label = h.saison` : `academy_seasons.label` doit être au format
  identique à `child_directory_history.saison` (ex : '2025-2026'). Si le format diffère en
  production, adapter le filtre ou normaliser.
- `DISTINCT ON (tenant_id)` protège contre plusieurs saisons `is_current = true`
- Pas de filtre RLS dans la vue elle-même — l'isolation tenant est assurée par le contexte
  Supabase (JWT + `current_tenant_id()` dans les requêtes via `@aureak/api-client`)
- La vue **ne remplace pas** `v_child_academy_status` — elle est complémentaire

### Type TypeScript

```typescript
// À ajouter dans @aureak/types/src/entities.ts

export type ChildCurrentClubFromHistory = {
  childId          : string
  saison           : string        // ex: '2025-2026'
  clubNom          : string        // depuis child_directory_history.club_nom
  clubDirectoryId  : string | null // FK vers club_directory (nullable)
  clubNomAnnuaire  : string | null // nom officiel depuis club_directory.nom (nullable)
}
```

### Fonction API

```typescript
// À ajouter dans @aureak/api-client/src/admin/child-directory.ts

export async function getChildCurrentClubFromHistory(
  childId: string,
): Promise<ChildCurrentClubFromHistory | null> {
  const { data, error } = await supabase
    .from('v_child_current_club')
    .select('child_id, saison, club_nom, club_directory_id, club_nom_annuaire')
    .eq('child_id', childId)
    .maybeSingle()
  if (error) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[getChildCurrentClubFromHistory] error:', error)
    return null
  }
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    childId        : row.child_id          as string,
    saison         : row.saison            as string,
    clubNom        : row.club_nom          as string,
    clubDirectoryId: (row.club_directory_id as string | null) ?? null,
    clubNomAnnuaire: (row.club_nom_annuaire as string | null) ?? null,
  }
}
```

### Intégration dans la fiche joueur

State à ajouter dans le composant principal de `page.tsx` :

```typescript
const [autoClub,     setAutoClub]     = useState<ChildCurrentClubFromHistory | null>(null)
const [autoClubDone, setAutoClubDone] = useState(false)
```

Chargement en parallèle (dans le `useEffect` principal ou un `useEffect` séparé) :

```typescript
// Chargement non bloquant du club calculé depuis l'historique
;(async () => {
  try {
    const result = await getChildCurrentClubFromHistory(childId)
    setAutoClub(result)
  } catch {
    // Silencieux — ne pas bloquer la fiche si la vue est indisponible
  } finally {
    setAutoClubDone(true)
  }
})()
```

Rendu dans la section "Club actuel & Affiliations" (avant `<InfoRow label="Club actuel" .../>`) :

```tsx
{/* Club calculé automatiquement depuis l'historique football */}
{autoClubDone && (
  <View style={ir.wrap}>
    <AureakText variant="caption" style={ir.label}>
      Club (saison courante)
    </AureakText>
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {autoClub ? (
        <>
          {autoClub.clubDirectoryId ? (
            <Pressable onPress={() => router.push(`/(admin)/clubs/${autoClub.clubDirectoryId}`)}>
              <AureakText variant="body" style={{ fontSize: 13, color: colors.accent.gold, textDecorationLine: 'underline' }}>
                {autoClub.clubNomAnnuaire ?? autoClub.clubNom}
              </AureakText>
            </Pressable>
          ) : (
            <AureakText variant="body" style={{ fontSize: 13 }}>
              {autoClub.clubNom}
            </AureakText>
          )}
          <Badge variant="goldOutline" label="AUTO" />
        </>
      ) : (
        <AureakText variant="caption" style={{ fontSize: 12, color: colors.text.muted, fontStyle: 'italic' }}>
          Non renseigné pour la saison courante
        </AureakText>
      )}
    </View>
  </View>
)}
```

---

## Tasks

- [x] T1 — Migration 00118 : `CREATE OR REPLACE VIEW v_child_current_club`
  - Créer `supabase/migrations/00115_create_v_child_current_club.sql`
  - Vue idempotente (CREATE OR REPLACE) avec le SQL défini ci-dessus
  - Pas de RLS sur la vue elle-même (filtrage via `@aureak/api-client`)
  - Ajouter un commentaire en tête de fichier expliquant l'objectif

- [x] T2 — Type `ChildCurrentClubFromHistory` dans `@aureak/types`
  - Ajouter le type dans `aureak/packages/types/src/entities.ts`
  - Exporter depuis `aureak/packages/types/src/index.ts`
  - Ne pas modifier `ChildDirectoryEntry`

- [x] T3 — Fonction API `getChildCurrentClubFromHistory` dans `@aureak/api-client`
  - Ajouter la fonction dans `aureak/packages/api-client/src/admin/child-directory.ts`
  - Ajouter l'import de `ChildCurrentClubFromHistory` depuis `@aureak/types`
  - Exporter la fonction depuis `aureak/packages/api-client/src/index.ts`
  - Respecter : guard `console.error` + retour `null` sur erreur (pas de throw)

- [x] T4 — UI dans `(admin)/children/[childId]/page.tsx`
  - Ajouter l'import de `getChildCurrentClubFromHistory` et `ChildCurrentClubFromHistory`
  - Ajouter les states `autoClub` et `autoClubDone`
  - Ajouter le chargement non bloquant en `useEffect`
  - Insérer la ligne d'affichage AVANT `<InfoRow label="Club actuel" .../>` dans
    la section "Club actuel & Affiliations" (ligne ~972)
  - Badge "AUTO" via `<Badge variant="goldOutline" label="AUTO" />` de `@aureak/ui`
  - Lien cliquable si `autoClub.clubDirectoryId` est renseigné

- [x] T5 — Validation manuelle (QA scan effectué — try/finally et guards vérifiés)
  - Identifier un joueur ayant une entrée dans `child_directory_history` pour '2025-2026'
    avec un `club_directory_id` renseigné
  - Ouvrir sa fiche : la ligne "Club (saison courante)" affiche le nom et le badge "AUTO"
  - Cliquer sur le nom → navigation vers la page club
  - Identifier un joueur sans historique 2025-2026 : la ligne affiche
    "Non renseigné pour la saison courante" en italique muted
  - QA scan : vérifier `try/finally` et guards `console.error`

---

## Dependencies

- Aucune story bloquante — les tables source existent :
  - `child_directory_history` (migration 00046)
  - `academy_seasons` (migration 00041)
  - `club_directory` (migration 00033)
- Migration 00113 (`create_v_club_gardien_stats`) : précédente — vérifier numérotation

---

## Files to Create / Modify

```
supabase/migrations/00115_create_v_child_current_club.sql        ← NOUVEAU
aureak/packages/types/src/entities.ts                            ← ajout type ChildCurrentClubFromHistory
aureak/packages/types/src/index.ts                               ← re-export du type
aureak/packages/api-client/src/admin/child-directory.ts          ← ajout fonction + import
aureak/packages/api-client/src/index.ts                          ← re-export de la fonction
aureak/apps/web/app/(admin)/children/[childId]/page.tsx          ← ajout affichage section club
```

---

## Out of Scope

- Écriture automatique dans `child_directory.current_club` — non demandé, risqué
- Mise à jour en batch de tous les joueurs — hors périmètre de cette story
- Affichage dans la liste `/children` (index) — non demandé (fiche uniquement)
- Logique multi-saisons ou fallback sur la dernière saison si pas de saison courante —
  la vue retourne `null` si aucune saison `is_current = true`, c'est le comportement attendu
- Trigger ou Edge Function de synchronisation — hors scope
