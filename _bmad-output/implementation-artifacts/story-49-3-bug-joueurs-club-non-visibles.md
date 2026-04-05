# Story 49-3 — BUG P2 : Joueurs du club non visibles dans la fiche club

## Metadata

```yaml
Story      : 49-3
Epic       : 49 — Bugfix batch avril 2026 #2
Status     : done
Priority   : P2
Type       : bug
Created    : 2026-04-04
Author     : Story Factory (Claude Code)
```

---

## Context & Root Cause

### Symptôme

Dans la page `(admin)/clubs/[clubId]`, les sections "Joueurs actuellement au club" et
"Joueurs affiliés" s'affichent correctement UNIQUEMENT pour les joueurs ayant une entrée
dans `club_directory_child_links`. Or, une grande partie des joueurs sont rattachés à un
club via le champ `child_directory.club_directory_id` (FK auto-matchée lors de l'import
Notion, migration 00044/00045) — et ces joueurs n'apparaissent nulle part dans la fiche
club.

### Root cause — double

**Bug 1 — API manquante** : Il n'existe pas de fonction dans `@aureak/api-client` pour
récupérer les joueurs de `child_directory` dont `club_directory_id = clubId`. La fonction
`listChildDirectory()` n'accepte pas de filtre `clubDirectoryId` comme paramètre.

**Bug 2 — UI manquante** : La page `clubs/[clubId]/page.tsx` ne contient aucune
section "Joueurs via annuaire". Seules les sections basées sur `club_directory_child_links`
(liens explicites) sont affichées. Les joueurs liés implicitement par `club_directory_id`
sont invisibles.

### Distinction fondamentale des deux sources

| Source | Table | Mécanisme | Nature |
|--------|-------|-----------|--------|
| Liens explicites | `club_directory_child_links` | Manuel via UI ou API | `link_type = 'current'` ou `'affiliated'` |
| Liens implicites | `child_directory.club_directory_id` | Auto-match à l'import Notion | Champ FK sur le profil joueur |

Ces deux sources sont complémentaires et ne se remplacent pas. Un même joueur peut
apparaître dans les deux (cas normal : affilié explicitement + `club_directory_id` renseigné).

---

## Scope

### In scope

- Nouvelle fonction API `listChildrenByClubDirectoryId(clubId)` dans `@aureak/api-client`
- Nouvelle section UI "Joueurs via annuaire (auto-match)" dans `clubs/[clubId]/page.tsx`
- Déduplication visuelle : si un joueur apparaît à la fois dans les liens explicites et dans
  l'annuaire, l'afficher uniquement dans la section liens explicites (pas de doublon)
- Composant `AnnuairePlayerRow` (read-only, sans bouton "Retirer" car le lien est sur le
  profil joueur, pas sur la table de liaison)

### Out of scope

- Modification du schéma DB (aucune migration)
- Modification de la logique de l'auto-match Notion
- Création de liens explicites depuis cette section (bouton "Convertir en lien explicite"
  = hors scope, future story si nécessaire)
- Page `child_directory` (non impactée)

---

## Acceptance Criteria

**AC1** — La fiche club affiche une troisième section "Joueurs via annuaire" listant les
joueurs dont `child_directory.club_directory_id = clubId` (actifs uniquement, `deleted_at IS NULL`).

**AC2** — Les joueurs déjà présents dans "Joueurs actuellement" ou "Joueurs affiliés"
(via `club_directory_child_links`) sont exclus de la section "Joueurs via annuaire" pour
éviter les doublons visuels.

**AC3** — La section "Joueurs via annuaire" est en lecture seule : pas de bouton "Retirer"
(le retrait se fait depuis la fiche du joueur en modifiant `club_directory_id`).

**AC4** — La section affiche : nom du joueur, statut académie (badge), niveau club.

**AC5** — Si aucun joueur annuaire n'est lié (après déduplication), afficher le message
"Aucun joueur lié via l'annuaire."

**AC6** — Le chargement de la section "Joueurs via annuaire" est inclus dans le `Promise.all`
existant (pas de requête séquentielle supplémentaire).

**AC7** — La nouvelle fonction API respecte la règle try/finally (état de chargement géré
dans le `finally` de la fonction `load` existante).

**AC8** — La section "Joueurs via annuaire" est accentuée en violet (`#a78bfa`) pour la
différencier visuellement des sections gold (actuels) et bleue (affiliés).

**AC9** — Le compteur du titre de section indique le nombre de joueurs après déduplication.

**AC10** — Aucun `console.log`/`console.error` non gardé par `NODE_ENV !== 'production'`.

---

## Technical Analysis

### Fichiers à modifier

```
aureak/packages/api-client/src/admin/child-directory.ts   ← nouvelle fonction API
aureak/packages/api-client/src/index.ts                   ← export de la nouvelle fonction
aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx        ← UI : section + state + load
```

### Aucun fichier à créer

Tout le travail est dans les fichiers existants. Pas de nouveau composant de fichier séparé
(le composant `AnnuairePlayerRow` sera défini en haut de `page.tsx`, à la suite des
composants existants).

### Nouvelle fonction API

Dans `child-directory.ts`, ajouter :

```typescript
/**
 * Liste les joueurs de l'annuaire rattachés à un club via club_directory_id.
 * Résultat : joueurs actifs uniquement (deleted_at IS NULL, actif = true).
 * Utilisé dans la fiche club pour afficher la liaison implicite (auto-match Notion).
 */
export async function listChildrenByClubDirectoryId(
  clubId: string,
): Promise<{ data: Array<{ id: string; displayName: string; statut: string | null; niveauClub: string | null }>; error: unknown }> {
  const { data, error } = await supabase
    .from('child_directory')
    .select('id, display_name, statut, niveau_club')
    .eq('club_directory_id', clubId)
    .eq('actif', true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true })

  if (error) return { data: [], error }

  const rows = (data as Array<{ id: string; display_name: string; statut: string | null; niveau_club: string | null }>)
    .map(r => ({
      id         : r.id,
      displayName: r.display_name,
      statut     : r.statut,
      niveauClub : r.niveau_club,
    }))

  return { data: rows, error: null }
}
```

### Modifications UI — `page.tsx`

**1. Nouvel import** : `listChildrenByClubDirectoryId` depuis `@aureak/api-client`

**2. Nouvel état** :
```typescript
const [annuairePlayers, setAnnuairePlayers] = useState<Array<{ id: string; displayName: string; statut: string | null; niveauClub: string | null }>>([])
```

**3. Dans `load()` — ajouter au `Promise.all` existant** :
```typescript
const [clubRes, linksRes, coachesRes, playersRes, coachListRes, annuaireRes] = await Promise.all([
  getClubDirectoryEntry(clubId),
  listChildrenOfClub(clubId),
  listCoachesOfClub(clubId),
  listChildDirectory({ page: 0, pageSize: 500, actif: true }),
  listAvailableCoaches(),
  listChildrenByClubDirectoryId(clubId),   // ← nouveau
])
// ... après les setters existants :
setAnnuairePlayers(annuaireRes.data)
```

**4. Déduplication** via `useMemo` (déclaré après les sets `currentIds` et `affiliatedIds`) :
```typescript
const annuairePlayersDeduped = useMemo(() => {
  const linkedIds = new Set([...currentIds, ...affiliatedIds])
  return annuairePlayers.filter(p => !linkedIds.has(p.id))
}, [annuairePlayers, currentIds, affiliatedIds])
```

**5. Nouveau composant** `AnnuairePlayerRow` (read-only — pas de bouton "Retirer") :
```typescript
function AnnuairePlayerRow({ player }: { player: { id: string; displayName: string; statut: string | null; niveauClub: string | null } }) {
  return (
    <View style={pr.row}>
      <View style={[pr.avatar, { backgroundColor: '#a78bfa' }]}>
        <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '800', fontSize: 11 }}>
          {player.displayName.charAt(0).toUpperCase()}
        </AureakText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AureakText variant="body" style={{ fontSize: 13, fontWeight: '600' }}>
          {player.displayName}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {player.statut && <StatutBadge statut={player.statut} />}
          {player.niveauClub && (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
              {player.niveauClub}
            </AureakText>
          )}
        </View>
      </View>
      {/* Read-only — pas de bouton Retirer */}
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontStyle: 'italic' as never }}>
        via annuaire
      </AureakText>
    </View>
  )
}
```

**6. Nouvelle Section dans le JSX** (juste avant la Section "Coachs liés") :
```tsx
{/* ── Section 3 : Joueurs via annuaire (auto-match) ── */}
<Section
  title="Joueurs via annuaire (auto-match)"
  count={annuairePlayersDeduped.length}
  accent="#a78bfa"
>
  <View style={s.sectionNote}>
    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontStyle: 'italic' as never }}>
      Joueurs dont le profil annuaire pointe vers ce club (champ club_directory_id).
      Ces liens sont créés automatiquement à l'import Notion. Pour les modifier,
      ouvrir la fiche du joueur.
    </AureakText>
  </View>

  {loadingLinks ? (
    <ListRowSkeleton count={3} />
  ) : annuairePlayersDeduped.length === 0 ? (
    <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', paddingVertical: space.md }}>
      Aucun joueur lié via l'annuaire.
    </AureakText>
  ) : (
    annuairePlayersDeduped.map(p => (
      <AnnuairePlayerRow key={p.id} player={p} />
    ))
  )}
</Section>
```

---

## Tasks

- [x] **Task 1 — API** : Ajouter `listChildrenByClubDirectoryId(clubId)` dans
  `aureak/packages/api-client/src/admin/child-directory.ts`
- [x] **Task 2 — Export** : Exporter `listChildrenByClubDirectoryId` depuis
  `aureak/packages/api-client/src/index.ts`
- [x] **Task 3 — UI state** : Ajouter l'état `annuairePlayers` dans `page.tsx`
- [x] **Task 4 — UI load** : Ajouter `listChildrenByClubDirectoryId(clubId)` au
  `Promise.all` de `load()` dans `page.tsx`
- [x] **Task 5 — UI dedup** : Ajouter `annuairePlayersDeduped` via `useMemo`
- [x] **Task 6 — UI component** : Ajouter composant `AnnuairePlayerRow` (read-only)
- [x] **Task 7 — UI section** : Ajouter la Section "Joueurs via annuaire" dans le JSX,
  entre la section "Joueurs affiliés" et la section "Coachs liés"
- [x] **Task 8 — QA** : grep try/finally + console guards sur les fichiers modifiés
- [x] **Task 9 — Commit** : `fix(epic-49): story 49-3 — joueurs club non visibles via annuaire`

---

## Dependencies

- Story 23-1 à 23-5 (Clubs visuels) : `done` — fiche club existante
- Migration 00044 (`child_directory` + `club_directory_id` FK) : appliquée
- Migration 00051 (`club_directory_child_links` + `link_type`) : appliquée

---

## QA Checklist

```bash
# BLOCKER — try/finally sur setters de chargement
grep -n "setLoadingLinks(false)" aureak/apps/web/app/\(admin\)/clubs/\[clubId\]/page.tsx
# → doit apparaître uniquement dans le finally{}

# WARNING — console non guardé
grep -n "console\." aureak/packages/api-client/src/admin/child-directory.ts | grep -v "NODE_ENV"
grep -n "console\." aureak/apps/web/app/\(admin\)/clubs/\[clubId\]/page.tsx | grep -v "NODE_ENV"
# → doit retourner 0 résultats
```

---

## Notes d'implémentation

- La fonction `listChildrenByClubDirectoryId` ne retourne que les colonnes nécessaires
  (`id, display_name, statut, niveau_club`) — éviter le `SELECT *` pour cette requête légère.
- Le `Promise.all` existant dans `load()` gère déjà le `finally { setLoading(false); setLoadingLinks(false) }` — la nouvelle requête s'insère dedans sans overhead.
- La section "Joueurs via annuaire" est **read-only** par conception : modifier `club_directory_id`
  est une opération sur le profil joueur (fiche `children/[childId]`), pas sur la fiche club.
- Si un joueur est à la fois dans `club_directory_child_links` (current ou affiliated) ET dans
  `child_directory.club_directory_id = clubId`, il apparaît uniquement dans la section liens
  explicites (priorité sur l'annuaire). La déduplication via `annuairePlayersDeduped` garantit
  cela côté UI sans requête DB supplémentaire.
- Pas de pagination pour la section annuaire : on suppose que le nombre de joueurs par club
  reste raisonnable (< 100). Si un club dépasse 100 joueurs annuaire, ajouter une pagination
  dans une story dédiée.
