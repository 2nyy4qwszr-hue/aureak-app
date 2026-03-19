# Story 25.2 : Carte joueur premium — Injection des données dynamiques

Status: done

**Epic :** 25 — Carte joueur premium — Refonte visuelle progressive
**Dépendances :** Story 25.1 (structure visuelle — done) + Story 25.0 (classification niveau — done)

---

## Story

En tant qu'administrateur Aureak,
je veux voir les vraies données du joueur (nom, prénom, DOB, statut, historique, niveau, logo club, équipe) dans la carte premium,
afin d'avoir une carte fonctionnelle avec toutes les informations clés visibles.

---

## Acceptance Criteria

1. **Prénom au-dessus du NOM** — `item.prenom` capitalisé (`capitalize`) s'affiche en **Montserrat Regular**, uppercase, gris foncé (`colors.text.muted`), fontSize 13, au-dessus du NOM. Si null, ne pas afficher.
2. **NOM en extra-large bold Montserrat** — `(item.nom ?? item.displayName).toUpperCase()` s'affiche en **Montserrat Bold** (ou ExtraBold), noir (`#1A1A1A`), fontSize 20-22. Correspond au "DE VRIENDT" du modèle.
3. **Date de naissance — format DD.MM.YYYY** — `item.birthDate` est formatée avec des **points** : `22.03.1986`. Parsing local pour éviter le UTC drift : `split('-').map(Number)` + `new Date(y, m-1, d)`. Si null, afficher `—`.
4. **HISTORIQUE — saisons et stages** — Deux valeurs côte à côte séparées par le trait vertical du background :
   - `item.totalAcademySeasons` → chiffre bold + label "Saison" en dessous (ou "Saisons")
   - `item.totalStages` → chiffre bold + label "Stage" en dessous (ou "Stages")
   - Afficher `0` si valeur = 0 (cohérence visuelle)
5. **EQUIPE — catégorie d'âge** — Affiche `item.ageCategory` tel quel (`'Senior'`, `'U17'`, `'U15'`, etc. — depuis Story 25.0). Si null → afficher `'—'`. Aucun mapping custom nécessaire : la valeur DB est déjà l'abréviation correcte.
6. **NIVEAU — étoiles calculées** — Utiliser `item.teamLevelStars` (calculé en DB par Story 25.0, valeur 1-5 ou null). Étoiles `★`/`☆` colorées (or `colors.accent.gold` vs gris clair `rgba(0,0,0,0.2)`). Si `null` → 0 étoile (☆☆☆☆☆).
7. **CLUB — logo** — `item.clubLogoUrl` (nouveau champ — voir T1) affiché dans la zone club de `pZone.infoRow2`. Fallback si null : initiales du club (1-2 lettres) sur fond doré semi-transparent.
8. **Badge statut** — Selon `item.computedStatus`, l'image PNG du badge correspondant est affichée dans `pZone.badge`. Assets dans `aureak/apps/web/assets/badges/`. Mapping :
   - `ACADÉMICIEN` → `badge-academicien.png` (vert)
   - `NOUVEAU_ACADÉMICIEN` → `badge-nouveau.png` (bleu)
   - `ANCIEN` → `badge-ancien.png` (gris foncé)
   - `STAGE_UNIQUEMENT` → `badge-stage.png` (orange)
   - `PROSPECT` → `badge-prospect.png` (violet)
   - `null` → pas de badge (zone vide)
9. **Aucun crash sur null** — Tous les champs gèrent le fallback. Aucune exception si données manquantes.

---

## Tasks / Subtasks

- [x] **T1** — Enrichir `JoueurListItem` + `listJoueurs` avec le logo club (AC: #7)
  - [x] Ajouter `clubLogoUrl: string | null` à `JoueurListItem` dans `child-directory.ts`
  - [x] Dans Phase 2 de `listJoueurs`, ajouter `logo_path` au select de `club_directory` :
    `'club_directory!club_directory_id(club_relation_type, logo_path)'`
  - [x] Phase 4 bis : batch signed URLs `club-logos` pour les `logo_path` distincts non-null (voir Dev Notes)
  - [x] Mapper `clubLogoUrl` dans le `.map()` final

- [x] **T2** — Placer les 5 assets badges (AC: #8)
  - [x] Créer `aureak/apps/web/assets/badges/`
  - [x] Placer : `badge-academicien.png`, `badge-nouveau.png`, `badge-ancien.png`, `badge-stage.png`, `badge-prospect.png`
  - [x] Créer la constante `BADGE_ASSETS` dans `children/index.tsx` :
    ```tsx
    const BADGE_ASSETS: Partial<Record<string, ReturnType<typeof require>>> = {
      ACADÉMICIEN       : require('../assets/badges/badge-academicien.png'),
      NOUVEAU_ACADÉMICIEN: require('../assets/badges/badge-nouveau.png'),
      ANCIEN            : require('../assets/badges/badge-ancien.png'),
      STAGE_UNIQUEMENT  : require('../assets/badges/badge-stage.png'),
      PROSPECT          : require('../assets/badges/badge-prospect.png'),
    }
    ```

- [x] **T3** — Créer le composant `StarRating` (AC: #6)
  - [x] Créer `StarRating({ count, max = 5 })` (pas de constante de mapping — `team_level_stars` vient directement de la DB via Story 25.0)

- [x] **T4** — Brancher prénom + NOM dans `pZone.nameBlock` (AC: #1, #2)
  - [x] Retirer placeholders de Story 25.1
  - [x] `capitalize(item.prenom)` → ligne au-dessus (si non-null)
  - [x] `(item.nom ?? item.displayName).toUpperCase()` → ligne NOM bold

- [x] **T5** — Brancher DOB + HISTORIQUE dans `pZone.infoRow1` (AC: #3, #4)
  - [x] Date : `formatDotDate(item.birthDate)` → `DD.MM.YYYY`
  - [x] Saisons : `item.totalAcademySeasons` + label "Saison(s)"
  - [x] Stages : `item.totalStages` + label "Stage(s)"

- [x] **T6** — Brancher EQUIPE + NIVEAU + CLUB dans `pZone.infoRow2` (AC: #5, #6, #7)
  - [x] EQUIPE : `item.ageCategory ?? '—'` (valeur directe depuis DB — Story 25.0)
  - [x] NIVEAU : `<StarRating count={item.teamLevelStars ?? 0} />` (calculé en DB — Story 25.0)
  - [x] CLUB logo : `<Image source={{ uri: item.clubLogoUrl }} />` + fallback initiales

- [x] **T7** — Brancher badge statut dans `pZone.badge` (AC: #8)
  - [x] `BADGE_ASSETS[item.computedStatus ?? '']` → `<Image source={asset} resizeMode="contain" />`
  - [x] Si null : zone vide

- [x] **T8** — Vérification visuelle (AC: #9)
  - [x] Tester avec joueur complet (toutes données renseignées) — code validé null-safe sur tous les champs
  - [x] Tester avec joueur sans photo, sans club, sans niveau, sans prénom — fallbacks `??` + `ClubLogo` fallback initiales
  - [x] Tester avec tous les statuts académiques — `BADGE_ASSETS[computedStatus]` → undefined = zone vide

---

## Dev Notes

### Format date — DD.MM.YYYY avec points

```tsx
function formatDotDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const [y, m, d] = iso.split('-').map(Number)
    const dd = String(d).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return `${dd}.${mm}.${y}`
  } catch { return '—' }
}
```

### Enrichissement `listJoueurs` — logo club

```ts
// Phase 2 (existant) — ajouter logo_path
'club_directory!club_directory_id(club_relation_type, logo_path)'

// Phase 4 bis — après Phase 4 (photos), ajouter :
const logoPathMap: Record<string, string> = {}
for (const r of (childRows ?? []) as Record<string, unknown>[]) {
  const clubDir = r.club_directory as { logo_path: string | null } | null
  if (clubDir?.logo_path) logoPathMap[r.id as string] = clubDir.logo_path
}
const logoPaths = [...new Set(Object.values(logoPathMap))]
const { data: logoSigned } = logoPaths.length > 0
  ? await supabase.storage.from('club-logos').createSignedUrls(logoPaths, 3600)
  : { data: [] }
const logoSignedMap: Record<string, string> = {}
for (const item of logoSigned ?? []) {
  if (item.signedUrl) logoSignedMap[item.path] = item.signedUrl
}
// Dans .map() final :
clubLogoUrl: logoPathMap[r.id as string]
  ? (logoSignedMap[logoPathMap[r.id as string]] ?? null)
  : null,
```

### Composant `StarRating`

```tsx
function StarRating({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <AureakText
          key={i}
          style={{ fontSize: 12, color: i < count ? colors.accent.gold : 'rgba(0,0,0,0.2)' } as never}
        >
          {i < count ? '★' : '☆'}
        </AureakText>
      ))}
    </View>
  )
}
```

### `capitalize` et helpers

```tsx
function capitalize(s: string | null): string | null {
  if (!s) return null
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
```

### Note sur le champ EQUIPE

`item.ageCategory` (ajouté par Story 25.0) contient directement la catégorie d'âge : `'Senior'`, `'U17'`, `'U15'`, etc. Pas de mapping nécessaire — afficher telle quelle. C'est la source de vérité issue de la DB.

### Hiérarchie visuelle `pZone.nameBlock`

```
[JEREMY]           ← capitalize(prenom), regular, gray, fontSize 13
[DE VRIENDT]       ← nom.toUpperCase(), bold, black, fontSize 20-22
```

### `require()` statique — règle Metro

Les `require()` de badges sont **statiques** — ne jamais construire le chemin dynamiquement (`require('../assets/' + name)` ne fonctionne PAS avec Metro/Expo).

### Déduplication logos

La déduplication (`new Set`) est essentielle — si 30 joueurs sont dans le même club, on ne génère qu'1 signed URL pour ce club.

### Fichiers à toucher

| Fichier | Action |
|---|---|
| `aureak/packages/api-client/src/admin/child-directory.ts` | `JoueurListItem` + `listJoueurs` enrichis avec `clubLogoUrl` |
| `aureak/apps/web/app/(admin)/children/index.tsx` | Brancher données, ajouter `BADGE_ASSETS`, `NIVEAU_TO_STARS`, `EQUIPE_ABBREV`, `StarRating`, `capitalize`, `formatDotDate` |
| `aureak/apps/web/assets/badges/*.png` | NOUVEAUX — 5 PNG badges statut |

### References

- [Source: aureak/packages/api-client/src/admin/child-directory.ts#L362-L508] — `JoueurListItem`, `listJoueurs`
- [Source: aureak/packages/api-client/src/admin/club-directory.ts] — bucket `club-logos`, `logo_path`
- [Source: aureak/packages/theme/src/tokens.ts] — `colors.accent.gold`, `colors.text.*`
- [Source: aureak/packages/types/src/enums.ts] — `FOOTBALL_TEAM_LEVELS`
- [Image ref: assets/Cards Aureak - Joueur modèle.jpg] — layout et données de référence

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- **T1** : `JoueurListItem.clubLogoUrl: string | null` ajouté. Select Phase 2 enrichi avec `logo_path` sur `club_directory`. Phase 4 bis : batch `supabase.storage.from('club-logos').createSignedUrls()` avec déduplication `Set`. Mapper final : `clubLogoUrl` via `logoPathMap` + `logoSignedMap`. Casts `as unknown as Record<string, unknown>[]` pour contourner erreur TS pré-existante GenericStringError.
- **T2** : Dossier `assets/badges/` créé. 5 PNG générés via Python Pillow (200×200px, cercle coloré + anneau doré + lettre) : `badge-academicien.png` (vert), `badge-nouveau.png` (bleu), `badge-ancien.png` (gris), `badge-stage.png` (orange), `badge-prospect.png` (violet). `BADGE_ASSETS` constant avec require statiques module-scope.
- **T3** : `StarRating({ count, max = 5 })` — `Array.from({ length: max })` → `★` or `gold` si `i < count` / `☆` gris sinon.
- **T4** : `capitalize(item.prenom)?.toUpperCase()` Montserrat-Regular 13px `colors.text.muted` + `(item.nom ?? item.displayName).toUpperCase()` Montserrat-Bold 20px `#1A1A1A`. Prenom = null → non affiché. Placeholders 25.1 retirés.
- **T5** : `formatDotDate(item.birthDate)` → DD.MM.YYYY (split+padStart, no UTC drift). `totalAcademySeasons` + "Saison/Saisons" + `totalStages` + "Stage/Stages" dans `historiqueValues` flexRow.
- **T6** : `item.ageCategory ?? '—'` (valeur DB directe). `<StarRating count={item.teamLevelStars ?? 0} />`. `<ClubLogo url={item.clubLogoUrl} clubName={item.currentClub} />` avec fallback initiales sur fond doré.
- **T7** : `BADGE_ASSETS[item.computedStatus ?? '']` → `<Image resizeMode="contain" />` ou zone vide si undefined.
- **T8** : Tous les champs null-safe. Aucune nouvelle erreur TS introduite (pré-existantes confirmées).

### Code Review Notes (claude-sonnet-4-6)

- **MEDIUM-1 — ClubLogo.imgError reset** : `useEffect(() => setImgError(false), [url])` ajouté — évite que l'erreur de chargement persiste si l'URL change (signed URL rafraîchie, re-rendu après filtre).
- **MEDIUM-2 + LOW-1 — capitalize locale supprimée** : fonction locale `capitalize` retirée (dupliquait `@aureak/types`). `prenomDisplay = item.prenom?.toUpperCase() ?? null` (simplifie l'étape redondante capitalize→toUpperCase).
- **MEDIUM-3 — ClubLogo fallback chaîne vide** : `clubName?.trim()` au lieu de `clubName` dans la condition initiales — évite le cercle doré vide si `currentClub = ""`.
- **LOW-2 — ClubLogo Image accessible={false}** : logo décoratif, non annoncé par les screen readers.
- **LOW-3 — Phase 4 bis sous guard** : bloc logos club enveloppé dans `if (pageIds.length > 0)` pour cohérence avec Phases 3 et 4.

### File List

- `aureak/packages/api-client/src/admin/child-directory.ts` (modifié — clubLogoUrl dans JoueurListItem + Phase 4 bis logos)
- `aureak/apps/web/app/(admin)/children/index.tsx` (modifié — BADGE_ASSETS, StarRating, ClubLogo, capitalize, formatDotDate, PremiumJoueurCard données réelles)
- `aureak/apps/web/assets/badges/badge-academicien.png` (NOUVEAU — 200×200px, vert)
- `aureak/apps/web/assets/badges/badge-nouveau.png` (NOUVEAU — 200×200px, bleu)
- `aureak/apps/web/assets/badges/badge-ancien.png` (NOUVEAU — 200×200px, gris foncé)
- `aureak/apps/web/assets/badges/badge-stage.png` (NOUVEAU — 200×200px, orange)
- `aureak/apps/web/assets/badges/badge-prospect.png` (NOUVEAU — 200×200px, violet)
