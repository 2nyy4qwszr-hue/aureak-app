# Story 18.2 : Joueurs — Refonte UI Cards + Gestion Photos avec Historique

Status: done

---

## Story

En tant qu'Admin,
Je veux une page Joueurs visuellement premium sous forme de grille de cards avec photo de chaque joueur,
afin de reconnaître rapidement les enfants, naviguer efficacement dans l'annuaire et suivre leur évolution dans le temps via un historique photo.

---

## Contexte produit

La page `/children` actuelle affiche les joueurs en lignes verticales plates (composant `JoueurRow`).
L'expérience est fonctionnelle mais peu agréable : impossible de reconnaître un enfant au premier coup d'œil, pas de photo, pas de densité visuelle.

Cette story introduit :
1. Un système de gestion de photos par joueur (table dédiée, Supabase Storage privé, Signed URLs)
2. Une refonte complète de la liste en grille de cards à 2 colonnes (photo + infos)
3. Des filtres améliorés (labels, année de naissance, UX plus compacte)
4. La préparation de la fiche joueur pour exploiter les photos (affichage actuel + historique + upload)

---

## Périmètre — In scope / Out of scope

### ✅ In scope (cette story)
- Migration DB `child_directory_photos` (table + RLS + trigger `is_current`)
- Bucket Supabase Storage `child-photos` privé + policies
- Types TS `ChildDirectoryPhoto` + extension `JoueurListItem.currentPhotoUrl`
- API functions : `listChildPhotos`, `addChildPhoto`, `setCurrentPhoto`, `deleteChildPhoto`
- Enrichissement batch de `listJoueurs` avec URL signée de la photo courante (Phase 4)
- Helper `generateSignedPhotoUrl` (1 path → 1 signed URL, expiration 1h)
- Helper batch `generateSignedPhotoUrls` (N paths → N signed URLs, appel unique)
- Nouveau composant `JoueurCard` (2 colonnes : photo+badge+voir / nom+infos)
- Grille responsive dans `children/index.tsx` (2 col desktop, 1 col mobile)
- Refonte filtres : label "Statut", suppression "annuaire Notion", filtre année de naissance
- Section "Photos" dans la fiche joueur `children/[childId]/page.tsx` :
  - affichage photo actuelle
  - galerie historique
  - upload nouvelle photo (web admin uniquement)
  - bouton "Définir comme photo actuelle"

### ❌ Out of scope (cette story)
- Filtre implantation (complexité SQL via `child_academy_memberships` → story dédiée ultérieure)
- Upload mobile depuis l'app coach
- Prise de photo directe depuis caméra (mobile-first → story dédiée future, voir section fin)
- Compression/resize côté client (Supabase Storage s'en charge via Transform API si activé)
- Sync Notion des photos
- Suppression hard des photos (soft-delete uniquement : flag `deleted_at`)

---

## Structure de données recommandée — Photos

### Migration 00065 : `child_directory_photos`

```sql
-- Migration: 00065_child_directory_photos.sql

CREATE TABLE child_directory_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,

  -- Chemin relatif dans Supabase Storage (bucket: child-photos)
  -- Format : {tenant_id}/{child_id}/{timestamp}_{original_name}
  photo_path  TEXT NOT NULL,

  -- Métadonnées
  taken_at    DATE     NULL,          -- date approximative de la photo (saisie manuelle)
  season      TEXT     NULL,          -- ex: '2024-2025' (saison académie)
  caption     TEXT     NULL,          -- légende optionnelle (ex: "Remise de diplôme")
  uploaded_by UUID     NULL REFERENCES auth.users(id),  -- admin qui a uploadé
  is_current  BOOLEAN  NOT NULL DEFAULT false,

  -- Soft-delete (cohérent avec le reste du projet)
  deleted_at  TIMESTAMPTZ NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de performance : photos courantes d'un joueur (chargement liste)
CREATE UNIQUE INDEX child_directory_photos_current_idx
  ON child_directory_photos (child_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Index liste par joueur
CREATE INDEX child_directory_photos_child_idx
  ON child_directory_photos (child_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Trigger : une seule photo is_current par joueur
-- Quand is_current passe à true, toutes les autres photos du même joueur passent à false
CREATE OR REPLACE FUNCTION fn_ensure_single_current_photo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE child_directory_photos
    SET    is_current = false, updated_at = NOW()
    WHERE  child_id   = NEW.child_id
      AND  id         != NEW.id
      AND  is_current = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_single_current_photo
  AFTER INSERT OR UPDATE OF is_current ON child_directory_photos
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION fn_ensure_single_current_photo();

-- RLS
ALTER TABLE child_directory_photos ENABLE ROW LEVEL SECURITY;

-- Admin : accès complet sur son tenant
CREATE POLICY "admin_all_child_photos" ON child_directory_photos
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Coach : lecture seule (pour afficher la photo dans leurs séances si besoin future)
CREATE POLICY "coach_read_child_photos" ON child_directory_photos
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'coach'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND deleted_at IS NULL
  );
```

### Bucket Supabase Storage : `child-photos`

Configuration :
- **Type** : Privé (pas de `public: true`)
- **Accès** : Signed URLs uniquement, expiration 3600s (1h)
- **Convention de chemin** : `{tenant_id}/{child_id}/{unix_timestamp}_{sanitized_filename}`
  - Exemple : `abc123/def456/1741694400_martin_dupont.jpg`
  - `sanitized_filename` = nom lowercase, espaces → tirets, caractères spéciaux retirés
- **Policies Storage** (via Supabase dashboard ou migration) :
  - `admin` : INSERT + SELECT + DELETE sur `child-photos/{tenant_id}/**`
  - `coach` : SELECT sur `child-photos/{tenant_id}/**` (pour futures uses)
  - Aucun accès public

### Types TypeScript — `@aureak/types/entities.ts`

Ajouter après `ChildDirectoryInjury` :

```typescript
/** ChildDirectoryPhoto — photo d'un joueur (migration 00065) */
export type ChildDirectoryPhoto = {
  id         : string
  tenantId   : string
  childId    : string
  photoPath  : string          // chemin relatif dans bucket child-photos
  photoUrl   : string | null   // Signed URL (générée à la volée, non stockée en DB)
  takenAt    : string | null   // ISO date
  season     : string | null   // ex: '2024-2025'
  caption    : string | null
  uploadedBy : string | null   // UUID auth.users
  isCurrent  : boolean
  deletedAt  : string | null
  createdAt  : string
  updatedAt  : string
}
```

Extension `JoueurListItem` dans `child-directory.ts` :
```typescript
export type JoueurListItem = {
  // ... (champs existants inchangés)
  id              : string
  displayName     : string
  birthDate       : string | null
  currentClub     : string | null
  niveauClub      : string | null
  clubDirectoryId : string | null
  computedStatus  : string | null
  totalAcademySeasons: number
  inCurrentSeason : boolean
  currentSeasonLabel: string | null
  totalStages     : number
  // ✅ NOUVEAU
  currentPhotoUrl : string | null   // Signed URL (null si aucune photo ou expirée)
}
```

---

## API functions — `@aureak/api-client/src/admin/child-directory.ts`

### Helpers Signed URLs (à ajouter)

```typescript
// Génère une Signed URL pour un chemin Storage (expiration 1h)
async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}

// Génère des Signed URLs en batch (1 seul appel Storage)
async function getSignedPhotoUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage
    .from('child-photos')
    .createSignedUrls(paths, 3600)
  if (error || !data) return {}
  const result: Record<string, string> = {}
  for (const item of data) {
    if (item.signedUrl) result[item.path] = item.signedUrl
  }
  return result
}
```

### `listChildPhotos(childId)` — historique photos d'un joueur

```typescript
export async function listChildPhotos(childId: string): Promise<ChildDirectoryPhoto[]> {
  const { data, error } = await supabase
    .from('child_directory_photos')
    .select('*')
    .eq('child_id', childId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as Record<string, unknown>[]
  // Batch sign URLs en 1 appel
  const paths = rows.map(r => r.photo_path as string)
  const signedMap = await getSignedPhotoUrls(paths)
  return rows.map(r => toPhoto(r, signedMap[r.photo_path as string] ?? null))
}
```

### `addChildPhoto(params)` — upload + insert

```typescript
export type AddChildPhotoParams = {
  tenantId   : string
  childId    : string
  file       : File          // HTML File object (web admin uniquement)
  takenAt?   : string | null
  season?    : string | null
  caption?   : string | null
  setCurrent?: boolean       // true = définit comme photo actuelle
}

export async function addChildPhoto(params: AddChildPhotoParams): Promise<ChildDirectoryPhoto> {
  const { tenantId, childId, file, takenAt, season, caption, setCurrent = false } = params

  // 1. Sanitize filename + construire le chemin
  const ts = Date.now()
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
  const photoPath = `${tenantId}/${childId}/${ts}_${safeName}`

  // 2. Upload vers Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('child-photos')
    .upload(photoPath, file, { upsert: false })
  if (uploadError) throw uploadError

  // 3. Insert record en DB
  const { data, error: dbError } = await supabase
    .from('child_directory_photos')
    .insert({
      tenant_id : tenantId,
      child_id  : childId,
      photo_path: photoPath,
      taken_at  : takenAt   ?? null,
      season    : season    ?? null,
      caption   : caption   ?? null,
      is_current: setCurrent,
    })
    .select()
    .single()
  if (dbError) {
    // Rollback Storage si DB échoue
    await supabase.storage.from('child-photos').remove([photoPath])
    throw dbError
  }

  const signedUrl = await getSignedPhotoUrl(photoPath)
  return toPhoto(data as Record<string, unknown>, signedUrl)
}
```

### `setCurrentPhoto(photoId, childId)` — définir photo courante

```typescript
export async function setCurrentPhoto(photoId: string, childId: string): Promise<void> {
  // Le trigger DB fn_ensure_single_current_photo gère l'unicité automatiquement
  const { error } = await supabase
    .from('child_directory_photos')
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq('id', photoId)
    .eq('child_id', childId) // sécurité : s'assurer qu'on ne modifie pas une autre fiche
  if (error) throw error
}
```

### `deleteChildPhoto(photoId)` — soft-delete

```typescript
export async function deleteChildPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('child_directory_photos')
    .update({ deleted_at: new Date().toISOString(), is_current: false })
    .eq('id', photoId)
  if (error) throw error
}
```

### Enrichissement `listJoueurs` — Phase 4 (batch photos)

Dans la fonction `listJoueurs` existante, ajouter **après Phase 3** (statusMap) :

```typescript
// Phase 4 : batch fetch des photos courantes + signed URLs
const photoPathMap: Record<string, string> = {}
if (pageIds.length > 0) {
  const { data: photoRows } = await supabase
    .from('child_directory_photos')
    .select('child_id, photo_path')
    .in('child_id', pageIds)
    .eq('is_current', true)
    .is('deleted_at', null)
  for (const r of (photoRows ?? []) as Record<string, unknown>[]) {
    photoPathMap[r.child_id as string] = r.photo_path as string
  }
}
// Batch generate signed URLs (1 seul appel Storage)
const paths = Object.values(photoPathMap)
const signedMap = paths.length > 0 ? await getSignedPhotoUrls(paths) : {}
```

Et dans le `.map()` final de construction du `JoueurListItem` :
```typescript
const photoPath = photoPathMap[r.id as string] ?? null
return {
  // ...champs existants...
  currentPhotoUrl: photoPath ? (signedMap[photoPath] ?? null) : null,
}
```

### `ListJoueursOpts` — ajout filtre `birthYear`

```typescript
export type ListJoueursOpts = {
  // ...champs existants...
  birthYear?: string   // ex: '2010' — filtre sur birth_date LIKE '2010%'
}
```

Dans `listJoueurs` Phase 2, ajouter :
```typescript
if (birthYear) q = q.gte('birth_date', `${birthYear}-01-01`).lte('birth_date', `${birthYear}-12-31`)
```

### Helper `toPhoto` (mapper DB → TS)

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPhoto(row: any, signedUrl: string | null): ChildDirectoryPhoto {
  return {
    id         : row.id,
    tenantId   : row.tenant_id,
    childId    : row.child_id,
    photoPath  : row.photo_path,
    photoUrl   : signedUrl,
    takenAt    : row.taken_at    ?? null,
    season     : row.season      ?? null,
    caption    : row.caption     ?? null,
    uploadedBy : row.uploaded_by ?? null,
    isCurrent  : row.is_current,
    deletedAt  : row.deleted_at  ?? null,
    createdAt  : row.created_at,
    updatedAt  : row.updated_at,
  }
}
```

### Exports à ajouter dans `@aureak/api-client/src/index.ts`

```typescript
export {
  listChildPhotos, addChildPhoto, setCurrentPhoto, deleteChildPhoto,
} from './admin/child-directory'
export type { AddChildPhotoParams } from './admin/child-directory'
```

Et étendre les types déjà exportés :
```typescript
export type { ..., ChildDirectoryPhoto } from '@aureak/types'
```

---

## Impacts UI — Liste Joueurs (`children/index.tsx`)

### Remplacement `JoueurRow` → `JoueurCard`

**Ancien composant** : `JoueurRow` — ligne horizontale plate sans photo.
**Nouveau composant** : `JoueurCard` — card 2 colonnes.

Structure visuelle attendue :
```
┌─────────────────────────────────────────────────┐
│  [Photo  ]  │  DUPONT Martin                    │
│  [ronde  ]  │  📅 01/01/2011  ·  ⚽ RSC Anderlecht │
│  [Avatar ]  │  Interprovinciaux                 │
│             │                                   │
│  [ACADÉM.]  │  🎓 3 saisons  ·  🏕 1 stage       │
│  [badge  ]  │                                   │
│  [Voir →]   │                                   │
└─────────────────────────────────────────────────┘
```

Spécifications du composant :
- **Colonne gauche** : largeur fixe ~80px
  - `PhotoAvatar` : cercle 56px de diamètre, photo ou initiales en fallback
  - Badge statut : chip compact sous la photo (8px margin-top)
  - Bouton "Voir" : centré dans la colonne gauche, sous le badge

- **Colonne droite** : `flex: 1`
  - Nom : `displayName.toUpperCase()` — weight 700, fontSize 14
  - Ligne dob + club : caption muted, row flex
  - Niveau : caption muted
  - Chips saisons/stages : ligne badges (réutiliser `InfoChip` existant)

- **Card** : padding 12px, borderRadius 10, borderWidth 1, borderColor light, backgroundColor surface, shadow.sm

### Fallback photo (joueur sans photo)

Composant `PhotoAvatar` :
```typescript
// Si currentPhotoUrl est null → afficher cercle gris avec initiales du joueur
// Initiales : premier char du prénom + premier char du nom (si displayName contient un espace)
// Exemple : "Martin DUPONT" → "MD"
// Couleur de fond : dérivée de l'id (hashing simple pour cohérence entre sessions)
```

### Layout grille responsive

Remplacer le `View style={s.list}` actuel (colonne unique) par une grille flex-wrap :

```typescript
const s = StyleSheet.create({
  // ...
  grid: {
    flexDirection : 'row',
    flexWrap      : 'wrap',
    gap           : 12,
  },
  cardWrapper: {
    // Sur web : ~48% pour 2 colonnes avec gap 12
    // En React Native Web, on peut utiliser calc via style prop direct
    // ou passer par une valeur fixe adaptée au breakpoint
    flexBasis: '48%',
    minWidth : 280,
  },
})
```

**Note implémentation** : Sur Expo Router web, utiliser `Platform.OS === 'web'` pour injecter un style CSS `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px` via une `<View style={{ ... }}>` ou directement via un `<div>` pour maximiser la compatibilité responsive. Cette approche est cohérente avec les autres sections admin qui utilisent du HTML inline (ex : `SectionEvalVideo.tsx`).

---

## Impacts UX — Filtres (`children/index.tsx`)

### Changements de labels

| Avant | Après |
|-------|-------|
| `{total} joueurs · annuaire Notion` | `{total} joueur(s)` (supprimer "annuaire Notion") |
| `FilterRow label="Statut académie"` | `FilterRow label="Statut"` |

### Nouveau filtre : Année de naissance

Ajouter state :
```typescript
const [birthYear, setBirthYear] = useState<string>('all')
```

Générer dynamiquement les années disponibles (exemple 2004–2018) :
```typescript
const BIRTH_YEAR_TABS = [
  { key: 'all', label: 'Toutes' },
  ...Array.from({ length: 15 }, (_, i) => {
    const y = (2018 - i).toString()
    return { key: y, label: y }
  }),
]
```

Passer `birthYear !== 'all' ? birthYear : undefined` à `listJoueurs`.

### Organisation UX des filtres — proposition

Structure en 2 lignes compactes :

**Ligne 1 — Statut** (une seule `FilterRow`, chips horizontaux scrollables)
```
Statut : [Tous] [Académicien] [Nouveau] [Ancien] [Stage] [Non affilié]
```

**Ligne 2 — Expérience + Naissance** (2 blocs côte à côte, flex-row)
```
Académie : [Toutes] [1 saison] [2 saisons] [3+]   |   Stage : [Tous] [Aucun] [1] [2] [3+]
Naissance : [Toutes] [2008] [2009] [2010] [2011] [2012] [2013] [2014] [2015] [2016]
```

**Règle UX** :
- Les filtres "Expérience" et "Naissance" peuvent être regroupés dans un bloc `filtersSecondary` avec un fond légèrement différent (`colors.light.muted`) et un contour `colors.border.divider` pour créer une distinction visuelle sans lourdeur
- Les filtres actifs (≠ 'all') affichent un indicateur compact dans le header (`• 2 filtres actifs`) pour signaler qu'un filtre est appliqué sans cacher les valeurs
- Bouton "Réinitialiser" discret (texte ghost, gold) apparaît uniquement quand au moins 1 filtre est actif

Ajouter aussi `birthYear` au `useEffect` de reset page :
```typescript
useEffect(() => { setPage(0) }, [search, acadStatus, seasonFilter, stageFilter, birthYear])
```

---

## Impacts fiche joueur — `children/[childId]/page.tsx`

### Nouvelle section "Photos"

Position dans la fiche : après la section "Identité", avant "Club".

**Mode lecture** :
- Photo actuelle : grande (120px de diamètre), centrée, avec `taken_at` et `season` si renseignés
- Si aucune photo : placeholder avec initiales + message "Aucune photo · Ajoutez une photo pour ce joueur"
- Galerie historique : grille de petites miniatures (48px), chacune avec badge "Actuelle" si `is_current`
- Clic sur miniature → modal ou drawer avec la photo en grand + métadonnées + bouton "Définir comme photo actuelle"

**Upload (admin web uniquement)** :
- Bouton "Ajouter une photo" → `<input type="file" accept="image/*">` (HTML natif)
- Champs optionnels : `taken_at` (DatePicker ou TextInput ISO), `season` (liste déroulante saisons), `caption` (text optionnel)
- Validation : taille max 5MB, types autorisés `image/jpeg`, `image/png`, `image/webp`
- Loading state pendant l'upload + message d'erreur si échec Storage
- Après upload réussi : rechargement de la galerie

**Composant à créer** : `ChildPhotosSection` (ou section inline dans `page.tsx`)

---

## Plan d'implémentation étape par étape

### Étape 1 — Migration DB + Storage (backend)
- [x] Créer `supabase/migrations/00065_child_directory_photos.sql`
  - table `child_directory_photos` avec tous les champs
  - index `is_current` unique partiel
  - trigger `fn_ensure_single_current_photo`
  - RLS admin + coach
- [ ] Créer le bucket Supabase Storage `child-photos` (privé)
  - via migration SQL ou Supabase dashboard + documenter dans la story
  - policies Storage : admin INSERT/SELECT/DELETE, coach SELECT

### Étape 2 — Types TypeScript
- [x] Ajouter `ChildDirectoryPhoto` dans `aureak/packages/types/src/entities.ts`
- [x] Étendre `JoueurListItem` avec `currentPhotoUrl: string | null`
- [x] Exporter `ChildDirectoryPhoto` depuis `aureak/packages/types/src/index.ts`

### Étape 3 — API functions
- [x] Ajouter dans `aureak/packages/api-client/src/admin/child-directory.ts` :
  - helpers `getSignedPhotoUrl` + `getSignedPhotoUrls`
  - `toPhoto` mapper
  - `listChildPhotos`
  - `addChildPhoto` (upload Storage + insert DB + rollback si erreur)
  - `setCurrentPhoto`
  - `deleteChildPhoto` (soft-delete)
  - Modifier `listJoueurs` : Phase 4 batch photos + signed URLs
  - Étendre `ListJoueursOpts` avec `birthYear?: string`
- [x] Exporter depuis `aureak/packages/api-client/src/index.ts`

### Étape 4 — Composants UI (liste)
- [x] Créer `PhotoAvatar` component (cercle, photo ou initiales-fallback)
- [x] Créer `JoueurCard` component (remplace `JoueurRow`)
- [x] Modifier `children/index.tsx` :
  - Remplacer `JoueurRow` par `JoueurCard`
  - Remplacer layout liste par grille responsive
  - Mettre à jour filtres : label "Statut", supprimer "annuaire Notion"
  - Ajouter filtre `birthYear` + state + `FilterRow` correspondant
  - Ajouter `birthYear` au reset page et à `listJoueurs` opts

### Étape 5 — Section photos dans la fiche joueur
- [x] Modifier `children/[childId]/page.tsx` :
  - Ajouter section "Photos" (après Identité)
  - Affichage photo actuelle + fallback
  - Galerie historique (miniatures, badge "Actuelle", modal optionnel)
  - Composant upload HTML `<input type="file">` + formulaire métadonnées
  - Appels API : `listChildPhotos`, `addChildPhoto`, `setCurrentPhoto`, `deleteChildPhoto`
  - Loading states + error handling

### Étape 6 — Skeleton + états de chargement
- [x] Adapter `skeletonRow` → `skeletonCard` dans la liste (hauteur de card)
- [x] Skeleton placeholder photos dans les cards pendant chargement
  - `SkeletonCard` refondu : structure 2 colonnes (left 76px + right flex) miroir exact de `JoueurCard`
  - Left col : cercle 56px + chip statut 46×16 + bouton 38×22 (tous en `colors.border.divider`)
  - Right col : 3 lignes de largeur variable + 2 chips — `card.left`/`card.right` réutilisés
  - `ChildPhotosSection` fallback amélioré : cercle 120px dashed doré + emoji 📷 (au lieu de `?`)
  - Miniatures galerie fallback : emoji 📷 + bordure `gold + '30'`

---

## Critères d'acceptation

**AC1 — Photo actuelle dans la liste**
- **Given** un joueur a une photo définie comme `is_current`
- **When** l'admin charge `/children`
- **Then** la photo apparaît dans sa card sous forme de cercle de 56px
- **And** l'URL utilisée est une Signed URL (non-publique, expiration 1h)
- **And** le chargement N+1 est évité (1 seul batch Storage pour toute la page)

**AC2 — Fallback si pas de photo**
- **Given** un joueur n'a aucune photo
- **When** sa card est affichée
- **Then** un cercle gris avec ses initiales est affiché à la place
- **And** aucune erreur n'est générée dans la console

**AC3 — Grille de cards**
- **Given** l'admin charge `/children`
- **When** le viewport est ≥ 640px
- **Then** les joueurs s'affichent en grille 2 colonnes (ou 3 si viewport ≥ 1200px)
- **When** le viewport est < 640px
- **Then** les cards passent en 1 colonne

**AC4 — Card 2 colonnes**
- **Given** une card joueur
- **Then** colonne gauche : photo ronde + badge statut + bouton "Voir"
- **And** colonne droite : nom en MAJUSCULES + prénom + dob + club + niveau + chips saisons/stages

**AC5 — Suppression "annuaire Notion"**
- **Given** la liste chargée
- **When** l'admin voit le header
- **Then** le texte affiche `{N} joueur(s)` sans mention "annuaire Notion"

**AC6 — Label filtre "Statut"**
- **Given** les filtres de la page
- **Then** le label est "Statut" (non "Statut académie")

**AC7 — Filtre année de naissance**
- **Given** l'admin sélectionne "2010" dans le filtre Naissance
- **Then** seuls les joueurs nés en 2010 (birth_date BETWEEN 2010-01-01 AND 2010-12-31) sont affichés
- **And** la pagination se remet à la page 0

**AC8 — Upload photo depuis la fiche joueur**
- **Given** l'admin est sur `/children/{childId}`
- **When** il clique "Ajouter une photo", sélectionne un fichier (jpg/png/webp, max 5MB)
- **Then** le fichier est uploadé dans Supabase Storage `child-photos/{tenantId}/{childId}/...`
- **And** un record est inséré dans `child_directory_photos`
- **And** la galerie se met à jour sans rechargement de page complet

**AC9 — Définir photo actuelle**
- **Given** l'admin voit l'historique des photos d'un joueur
- **When** il clique "Définir comme photo actuelle" sur une photo
- **Then** `is_current` passe à `true` sur cette photo
- **And** toutes les autres photos du joueur passent à `is_current = false` (via trigger DB)
- **And** la liste Joueurs affiche la nouvelle photo au prochain rechargement

**AC10 — Soft-delete photo**
- **Given** l'admin supprime une photo depuis la fiche
- **Then** `deleted_at` est renseigné (non null)
- **And** la photo n'apparaît plus dans la galerie
- **And** le fichier Storage n'est PAS supprimé (conservation des données)

**AC11 — Multi-tenant**
- **Given** deux tenants différents
- **Then** aucun tenant ne peut accéder aux photos d'un autre tenant
- **And** RLS assure l'isolation via `tenant_id`

**AC12 — Filtres réinitialisés si changement**
- **When** l'admin change un filtre (statut, expérience, naissance, recherche)
- **Then** la pagination repart à la page 0

---

## Dev Notes

### Architecture patterns à respecter

- **`@aureak/api-client` = seul point d'accès Supabase** : toute la logique Storage est dans `child-directory.ts`, jamais dans les composants UI
- **Signed URLs non stockées en DB** : `photo_url` sur `ChildDirectoryPhoto` est toujours généré à la volée, jamais persisté
- **Batch obligatoire** : `createSignedUrls` (pluriel) pour la liste, jamais de boucle de `createSignedUrl` (singulier)
- **Trigger DB pour unicité `is_current`** : ne pas gérer cette logique côté API (fragile, race condition) — le trigger `fn_ensure_single_current_photo` est authoritative
- **Rollback Storage si DB échoue dans `addChildPhoto`** : pattern critique pour éviter les orphelins Storage
- **`deleted_at` soft-delete** : cohérent avec `child_directory`, `club_directory`, etc. Pas de suppression dure en dehors des jobs RGPD

### Composants réutilisables existants

| Composant | Chemin | Réutilisation |
|-----------|--------|---------------|
| `StatusChip` | `children/index.tsx` | Réutiliser tel quel dans `JoueurCard` (badge statut colonne gauche) |
| `InfoChip` | `children/index.tsx` | Réutiliser pour chips saisons/stages dans colonne droite |
| `FilterRow` | `children/index.tsx` | Réutiliser pour les 3 lignes de filtres (Statut, Expérience, Naissance) |
| `Pagination` | `children/index.tsx` | Conserver inchangé |
| `ACADEMY_STATUS_CONFIG` | `@aureak/business-logic` | Pour couleurs badges dans `JoueurCard` et `PhotoAvatar` |

### Nouveaux composants à créer

| Composant | Chemin recommandé | Description |
|-----------|------------------|-------------|
| `PhotoAvatar` | `children/index.tsx` (local) ou `@aureak/ui/src/PhotoAvatar.tsx` (si réutilisé ailleurs) | Cercle photo + fallback initiales |
| `JoueurCard` | `children/index.tsx` (local) | Card 2 colonnes remplaçant `JoueurRow` |
| Section `ChildPhotosSection` | `children/[childId]/page.tsx` (inline) | Galerie + upload dans la fiche |

**Recommandation** : `PhotoAvatar` dans `@aureak/ui` si on anticipe son usage dans d'autres écrans admin (fiche joueur, présences, évaluations). Sinon, local à `children/index.tsx` est acceptable pour cette story.

### Conventions de nommage Storage

```
Bucket     : child-photos         (privé)
Chemin     : {tenantId}/{childId}/{unixTimestamp}_{sanitizedName}
Exemple    : a1b2c3/d4e5f6/1741694400_martin-dupont.jpg
Sanitize   : lowercase + regex /[^a-z0-9.]/g → '-' + collapse '-+'
Extension  : conserver celle du fichier original (jpg/jpeg/png/webp)
```

### Gestion d'erreurs upload

- Erreur Storage `409` (conflict) → fichier existe déjà → changer le timestamp (increment +1)
- Erreur Storage `413` → fichier trop grand → message utilisateur "Le fichier dépasse 5MB"
- Erreur DB après upload réussi → supprimer le fichier Storage (rollback) + throw error
- Pas de retry automatique — l'admin peut relancer manuellement

### Performance — Signed URLs dans la liste

Les Signed URLs expirent après 1h. Sur la page joueurs paginée à 50 items :
- Phase 4 : 1 requête DB `.in('child_id', pageIds)` pour les chemins
- 1 appel `createSignedUrls(paths, 3600)` pour signer tout en batch
- Total : **2 appels supplémentaires** pour 50 joueurs (vs 0 ou 50 sans batch)
- Acceptable pour une page admin (non critique en latence)
- Si la liste est rechargée fréquemment, envisager un cache côté client (TanStack Query `staleTime: 55 * 60 * 1000` pour 55 min)

### Migration — Créer le bucket Storage

Le bucket Supabase Storage ne se crée pas via migration SQL classique.
Deux options :
1. **Dashboard** : Supabase → Storage → New Bucket `child-photos` → Private
2. **Seed SQL** (si Supabase local) : insérer dans `storage.buckets`

**Documenter dans la migration** : ajouter un commentaire dans `00065_child_directory_photos.sql` :
```sql
-- ⚠️  ACTION MANUELLE REQUISE : créer le bucket 'child-photos' (privé) dans Supabase Storage
-- Supabase Dashboard > Storage > New bucket > Name: child-photos > Public: false
-- Configurer les policies Storage (voir section architecture de la story 18.2)
```

---

## Fichiers à créer / modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00065_child_directory_photos.sql` | CRÉER |
| `aureak/packages/types/src/entities.ts` | MODIFIER — ajout `ChildDirectoryPhoto`, extension `JoueurListItem` |
| `aureak/packages/types/src/index.ts` | MODIFIER — export `ChildDirectoryPhoto` |
| `aureak/packages/api-client/src/admin/child-directory.ts` | MODIFIER — helpers Signed URLs, toPhoto, 4 nouvelles functions, Phase 4 dans listJoueurs, birthYear dans ListJoueursOpts |
| `aureak/packages/api-client/src/index.ts` | MODIFIER — exports listChildPhotos, addChildPhoto, setCurrentPhoto, deleteChildPhoto, AddChildPhotoParams, ChildDirectoryPhoto |
| `aureak/apps/web/app/(admin)/children/index.tsx` | MODIFIER — JoueurCard, grille responsive, filtres améliorés, birthYear |
| `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` | MODIFIER — section ChildPhotosSection |

---

## Story future séparée — Upload mobile terrain (coach)

**Titre proposé** : `18-3-joueurs-upload-photo-mobile-terrain`

**Contexte** : Cette story couvre l'upload de photos depuis l'admin web uniquement. L'upload depuis l'app mobile par un coach sur le terrain nécessite une story dédiée avec des contraintes spécifiques.

**Périmètre de la future story** :
- Interface mobile-first pour la prise de photo (expo-image-picker ou expo-camera)
- Compression côté client avant upload (expo-image-manipulator, cible < 800KB)
- Upload progressif avec indicateur de progression (UploadTask Supabase)
- Gestion offline : si pas de réseau, mettre en queue locale et synchroniser dès reconnexion
- UX coach terrain : accès rapide depuis la fiche présences ou la liste joueurs du jour
- Permissions : demande d'accès caméra/galerie en runtime (iOS + Android)
- Contraintes RGPD : consentement parental pour les photos d'enfants mineurs (lier à la table `consents`)
- Notification parent : optionnelle (info que la photo a été ajoutée par le coach)

**Dépendances** : Cette story (18.2) doit être `done` en premier (table DB + API functions existent déjà).

---

## Project Structure Notes

- Route existante `/children` → `aureak/apps/web/app/(admin)/children/index.tsx` : à modifier (ne pas recréer)
- Route existante `/children/[childId]` → `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` : à modifier
- Pattern `index.tsx` re-export `./page` déjà en place pour les routes dynamiques — ne pas modifier `[childId]/index.tsx`
- `child_directory` n'a pas de FK `auth.users` — les joueurs de l'annuaire Notion sont indépendants des comptes app
- Prochaine migration disponible : `00065` (dernière migration = `00064_fix_close_session_coach_ownership.sql`)

### Références

- Code existant liste joueurs : `aureak/apps/web/app/(admin)/children/index.tsx`
- Code existant fiche joueur : `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
- API child-directory : `aureak/packages/api-client/src/admin/child-directory.ts`
- Types `ChildDirectoryEntry`, `ChildDirectoryInjury` : `aureak/packages/types/src/entities.ts` (lignes 944–1022)
- Pattern injuries (modèle pour photos) : migration `supabase/migrations/00060_injuries_and_academy_seasons.sql`
- `ACADEMY_STATUS_CONFIG` : `aureak/packages/business-logic/src/groups/academyStatus.ts`
- `AcademyStatus` type : `aureak/packages/types/src/entities.ts` ligne 470
- Design tokens : `aureak/packages/theme/tokens.ts` — `colors.light.*`, `shadows.sm`, `radius.*`
- Pattern Signed URLs Supabase : `supabase.storage.from('bucket').createSignedUrls(paths[], expiresIn)`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `supabase/migrations/00065_child_directory_photos.sql`
- `aureak/packages/types/src/entities.ts`
- `aureak/packages/types/src/index.ts`
- `aureak/packages/api-client/src/admin/child-directory.ts`
- `aureak/packages/api-client/src/index.ts`
- `aureak/apps/web/app/(admin)/children/index.tsx`
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx`
