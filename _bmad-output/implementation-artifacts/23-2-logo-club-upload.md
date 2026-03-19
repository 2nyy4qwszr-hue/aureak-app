# Story 23.2 : Ajout du logo de club avec upload image

Status: done

## Story

En tant qu'administrateur Aureak,
je veux pouvoir uploader et afficher un logo pour chaque club de l'annuaire,
afin que les cartes et fiches clubs soient visuellement reconnaissables et plus professionnelles.

## Contexte

Le module joueurs dispose déjà d'un système de photos complet (bucket `child-photos`, table `child_directory_photos`, API dans `child-directory.ts`). Cette story s'inspire de ce pattern pour les logos de clubs, avec une version simplifiée : **1 seul logo par club** (pas de galerie), stocké en URL directe dans la table `club_directory`.

**Pattern de référence pour l'upload :** `addChildPhoto()` dans `aureak/packages/api-client/src/admin/child-directory.ts` — même logique Storage + DB mais sans table dédiée (logo_url directement dans `club_directory`).

**Dernier numéro de migration disponible :** 00078 utilisé par Story 23.3 → migration 23.2 = **00079**.

## Objectif

Permettre l'upload, le remplacement et la suppression du logo d'un club. Afficher le logo dans la fiche détail et, à terme, dans les cartes (Story 23.5).

## Scope IN

- Migration 00079 : ajout `logo_url TEXT NULL` dans `club_directory`
- Création bucket Supabase Storage `club-logos` (privé, signed URLs)
- API : `uploadClubLogo()`, `deleteClubLogo()`, mise à jour de `mapRow()` et `ClubDirectoryEntry`
- UI fiche club `clubs/[clubId]/page.tsx` : section upload logo en mode édition + affichage en mode lecture
- Formats acceptés : PNG, JPEG/JPG uniquement
- Taille max recommandée : 2 MB
- Renommage propre du fichier avant upload
- Fallback propre si pas de logo

## Scope OUT

- Pas de recadrage automatique côté client (l'utilisateur est responsable du format de l'image source)
- Pas d'optimisation/compression côté serveur (hors scope, à prévoir en Phase 2)
- Pas d'affichage du logo dans la grille liste (couvert par Story 23.5)
- Pas d'historique des logos (un seul logo actif à la fois)
- Pas de logo dans l'app mobile (scope web admin uniquement)

## Impacts Base de Données

### Migration 00079 : `club_directory_logo_url`

```sql
ALTER TABLE club_directory
  ADD COLUMN logo_url TEXT NULL;

COMMENT ON COLUMN club_directory.logo_url
  IS 'URL signée ou chemin Storage du logo du club. NULL si aucun logo défini.';
```

**Note** : On stocke le **chemin Storage** (`tenantId/clubId/logo.png`) et on génère des signed URLs à la volée — même pattern que `child_directory_photos`. Le champ `logo_url` contiendra le chemin brut, pas l'URL signée. Le type TS exposera une `logoSignedUrl: string | null` générée à la demande.

**Alternative challengée** : stocker directement l'URL publique (bucket public). Rejeté car cohérent avec la politique de bucket privé déjà en place pour les photos joueurs.

## Impacts Storage

### Nouveau bucket Supabase : `club-logos`

- **Type** : privé (accès via signed URL)
- **Path pattern** : `{tenantId}/{clubId}/{timestamp}_{safe_filename}`
- **Politique d'accès** :
  - SELECT (téléchargement) : authentifié, même tenant
  - INSERT : rôle admin uniquement
  - DELETE : rôle admin uniquement
- **Migrations RLS Storage** : à ajouter dans la même migration 00079

```sql
-- Créer le bucket (via SQL ou dashboard Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy upload (INSERT)
CREATE POLICY "club_logos_upload_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'club-logos'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Policy lecture (SELECT)
CREATE POLICY "club_logos_read_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'club-logos');

-- Policy suppression (DELETE)
CREATE POLICY "club_logos_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'club-logos'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );
```

## Impacts Types TypeScript

### `@aureak/types/src/entities.ts`

```ts
export type ClubDirectoryEntry = {
  ...
  logoPath  : string | null  // chemin brut Storage (ex: "tenant/clubId/123_logo.png")
  logoUrl   : string | null  // signed URL générée (null si pas de logo ou expirée)
  ...
}
```

**Note** : `logoPath` est le chemin DB, `logoUrl` est la signed URL temporaire injectée par l'API.

## Impacts API

### `@aureak/api-client/src/admin/club-directory.ts`

#### Helpers Storage (copier le pattern de `child-directory.ts`)

```ts
// Génère une signed URL pour un logo (expiration 1h)
async function getSignedLogoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('club-logos')
    .createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}
```

#### `mapRow()` mise à jour

```ts
function mapRow(r: Record<string, unknown>): ClubDirectoryEntry {
  return {
    ...
    logoPath: (r.logo_url as string | null) ?? null,
    logoUrl : null, // injecté après via signed URL
  }
}
```

#### `getClubDirectoryEntry()` — injecter la signed URL

```ts
export async function getClubDirectoryEntry(clubId: string): Promise<{ data: ClubDirectoryEntry | null; error: unknown }> {
  // ... fetch existant ...
  if (data) {
    const entry = mapRow(data)
    if (entry.logoPath) {
      entry.logoUrl = await getSignedLogoUrl(entry.logoPath)
    }
    return { data: entry, error: null }
  }
}
```

#### `listClubDirectory()` — batch signed URLs (évite N+1)

```ts
// Après fetch des clubs, batch-sign les logos
const logoPaths = rows.filter(r => r.logoPath).map(r => r.logoPath as string)
if (logoPaths.length > 0) {
  const { data: signedItems } = await supabase.storage
    .from('club-logos')
    .createSignedUrls(logoPaths, 3600)
  // injecter dans chaque entry
}
```

#### Nouvelle fonction : `uploadClubLogo()`

```ts
export type UploadClubLogoParams = {
  tenantId  : string
  clubId    : string
  file      : File   // HTML File object — web admin uniquement
  updatedBy : string
}

export async function uploadClubLogo(params: UploadClubLogoParams): Promise<{ logoUrl: string | null; error: unknown }> {
  const { tenantId, clubId, file, updatedBy } = params

  // Validation format
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { logoUrl: null, error: 'Format non supporté. PNG ou JPEG uniquement.' }
  }

  // Validation taille (2 MB max)
  if (file.size > 2 * 1024 * 1024) {
    return { logoUrl: null, error: 'Logo trop volumineux. Maximum 2 MB.' }
  }

  // Sanitize filename
  const ts       = Date.now()
  const ext      = file.type === 'image/png' ? 'png' : 'jpg'
  const logoPath = `${tenantId}/${clubId}/${ts}_logo.${ext}`

  // Supprimer l'ancien logo si existant (rollback si échec)
  const { data: current } = await supabase.from('club_directory').select('logo_url').eq('id', clubId).single()
  const oldPath = current?.logo_url ?? null

  // Upload nouveau logo
  const { error: uploadError } = await supabase.storage
    .from('club-logos')
    .upload(logoPath, file, { upsert: true })
  if (uploadError) return { logoUrl: null, error: uploadError }

  // Mettre à jour la DB
  const { error: dbError } = await supabase
    .from('club_directory')
    .update({ logo_url: logoPath, updated_at: new Date().toISOString() })
    .eq('id', clubId)

  if (dbError) {
    await supabase.storage.from('club-logos').remove([logoPath])
    return { logoUrl: null, error: dbError }
  }

  // Supprimer l'ancien fichier Storage (sans bloquer)
  if (oldPath && oldPath !== logoPath) {
    await supabase.storage.from('club-logos').remove([oldPath])
  }

  // Retourner la signed URL
  const logoUrl = await getSignedLogoUrl(logoPath)
  return { logoUrl, error: null }
}
```

#### Nouvelle fonction : `deleteClubLogo()`

```ts
export async function deleteClubLogo(clubId: string): Promise<{ error: unknown }> {
  const { data } = await supabase.from('club_directory').select('logo_url').eq('id', clubId).single()
  const logoPath = data?.logo_url ?? null

  const { error } = await supabase
    .from('club_directory')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', clubId)

  if (!error && logoPath) {
    await supabase.storage.from('club-logos').remove([logoPath])
  }

  return { error: error ?? null }
}
```

## Impacts Front-End

### `clubs/[clubId]/page.tsx`

#### En mode lecture

Afficher le logo en haut de la section Identité (ou dans le titre) :

```tsx
// Zone logo dans le titleRow
<View style={s.logoContainer}>
  {club.logoUrl ? (
    <Image
      source={{ uri: club.logoUrl }}
      style={s.logoImage}
      resizeMode="contain"
    />
  ) : (
    <View style={s.logoPlaceholder}>
      <AureakText style={{ color: colors.text.muted, fontSize: 22 }}>⚽</AureakText>
    </View>
  )}
</View>
```

#### En mode édition — Section Logo

```tsx
<Section title="Logo du club">
  {/* Prévisualisation */}
  {logoPreview && <Image source={{ uri: logoPreview }} style={s.logoPreview} resizeMode="contain" />}
  {/* Upload button */}
  <input
    type="file"
    accept="image/png, image/jpeg"
    onChange={handleLogoFileChange}
    style={{ display: 'none' }}
    ref={fileInputRef}
  />
  <Pressable onPress={() => fileInputRef.current?.click()} style={s.uploadBtn}>
    <AureakText variant="caption">Choisir un logo (PNG ou JPG, max 2 MB)</AureakText>
  </Pressable>
  {/* Supprimer logo existant */}
  {club.logoUrl && (
    <Pressable onPress={handleDeleteLogo} style={s.deleteLogo}>
      <AureakText variant="caption" style={{ color: '#f87171' }}>Supprimer le logo</AureakText>
    </Pressable>
  )}
  {logoError && <AureakText variant="caption" style={{ color: '#f87171' }}>{logoError}</AureakText>}
</Section>
```

**Note importante** : Utiliser `Platform.OS === 'web'` pour wraper le `<input type="file">` — ce composant n'est disponible qu'en web. Voir le pattern de `PlayerPicker` dans `clubs/[clubId]/page.tsx` qui gère déjà `Platform.OS === 'web'`.

#### Logique d'état local

```ts
const [logoFile,    setLogoFile]    = useState<File | null>(null)
const [logoPreview, setLogoPreview] = useState<string | null>(null)
const [logoError,   setLogoError]   = useState<string | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)

const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  const allowed = ['image/png', 'image/jpeg']
  if (!allowed.includes(file.type)) { setLogoError('PNG ou JPEG uniquement'); return }
  if (file.size > 2 * 1024 * 1024) { setLogoError('Max 2 MB'); return }
  setLogoError(null)
  setLogoFile(file)
  setLogoPreview(URL.createObjectURL(file))
}
```

L'upload se déclenche lors du `handleSave()` si `logoFile !== null`.

## Validations

- Format : PNG ou JPEG/JPG uniquement (`image/png`, `image/jpeg`)
- Taille max : 2 MB
- 1 seul logo par club (upsert — remplace l'existant)
- Validation client-side avant upload (feedback immédiat)

## Dépendances

- **Dépend de** : Story 23.3 (si lancée en premier, la migration 00078 doit être appliquée avant 00079)
  - En pratique, 00079 est indépendant du contenu de 00078 (colonnes différentes)
- **Bloque** : Story 23.5 (la carte club affiche le logo via `logoUrl`)

## Risques / Points d'Attention

1. **`input type="file"` en React Native Web** : Expo Router web supporte les éléments HTML natifs via `Platform.OS === 'web'`. Utiliser le pattern déjà en place dans `PlayerPicker` (cf. `Platform.OS === 'web' ? { type: 'search' } : {}`). Pour un `input file`, créer un composant `LogoUploader` web-only.
2. **Signed URLs dans `listClubDirectory()`** : le batch sign des logos peut introduire de la latence si beaucoup de clubs ont un logo. Envisager de ne signer que sur `getClubDirectoryEntry()` (fiche détail) et d'utiliser uniquement `logoPath` dans la liste (la card affichera le logo seulement si signed URL disponible).
3. **Cleanup Storage** : si l'upload réussit mais la mise à jour DB échoue, rollback Storage automatique (pattern existant dans `addChildPhoto`).
4. **Aspect ratio** : les logos de clubs sont souvent en 1:1 ou 4:3. Utiliser `resizeMode="contain"` dans un container fixe pour harmoniser visuellement.

## Critères d'Acceptation

1. La migration 00079 s'applique sans erreur
2. Le bucket `club-logos` est créé et accessible via signed URLs
3. Depuis la fiche détail d'un club, on peut uploader un logo PNG ou JPEG (max 2 MB)
4. Le logo uploadé s'affiche immédiatement après sauvegarde
5. On peut remplacer un logo existant (l'ancien est supprimé du Storage)
6. On peut supprimer un logo (retour au placeholder)
7. Un fichier avec un format non autorisé (PDF, GIF) est rejeté avec un message clair
8. Un fichier > 2 MB est rejeté avec un message clair
9. Le placeholder s'affiche correctement si aucun logo
10. `ClubDirectoryEntry.logoUrl` est `null` si aucun logo
11. Types TypeScript compilent sans erreur

## Suggestions de Tests

- Test manuel : upload PNG → logo affiché ✓
- Test manuel : upload JPEG → logo affiché ✓
- Test manuel : upload PDF → message d'erreur format ✓
- Test manuel : upload PNG > 2 MB → message d'erreur taille ✓
- Test manuel : remplacer logo → ancien supprimé du Storage ✓
- Test manuel : supprimer logo → placeholder affiché ✓
- Test unitaire : `uploadClubLogo()` avec mock Storage → vérifie la logique de rollback

## Questions Critiques

1. **Bucket privé ou public ?** J'ai proposé privé (signed URLs) pour cohérence avec les photos joueurs. Si vous souhaitez que les logos soient accessibles publiquement (site vitrine futur), il faudrait un bucket public avec URL permanente. À confirmer.
2. **Taille max** : 2 MB est-il suffisant ? Certains logos vectoriels exportés en PNG peuvent être lourds.
3. **Aspect ratio imposé** : voulez-vous forcer un carré (1:1) ou laisser libre ? Un carré impose moins de travail graphique à l'admin.

## Tasks / Subtasks

- [x] Créer migration 00079 (AC: 1)
  - [x] ADD COLUMN `logo_path TEXT NULL` à `club_directory` (note: `logo_path` choisi plutôt que `logo_url` — sémantiquement correct)
  - [x] Créer bucket `club-logos` et ses policies Storage (complété par code review)
- [x] Mettre à jour `@aureak/types/src/entities.ts` (AC: 11)
  - [x] Ajouter `logoPath: string | null` et `logoUrl: string | null` à `ClubDirectoryEntry`
- [x] Mettre à jour `@aureak/api-client/src/admin/club-directory.ts` (AC: 2-6, 10)
  - [x] Helper `getClubLogoSignedUrl()` + batch `createSignedUrls` dans `listClubDirectory`
  - [x] Mettre à jour `mapRow()`, `getClubDirectoryEntry()`, `listClubDirectory()`
  - [x] Implémenter `uploadClubLogo()` avec validation format/taille + audit log + rollback Storage
  - [x] Implémenter `deleteClubLogo()` avec ordre DB-first + audit log
  - [x] Exporter les nouvelles fonctions dans `src/index.ts`
- [x] Mettre à jour `clubs/[clubId]/page.tsx` (AC: 3-9)
  - [x] Affichage logo en mode lecture dans `titleRow` (via `club.logoUrl`)
  - [x] Section Logo en mode édition avec `<input type="file">` natif
  - [x] Logique d'état local (`logoFile`, `logoPreview`) — upload différé au Save
  - [x] Preview local avant sauvegarde
  - [x] Intégrer upload dans `handleSave()`
  - [x] Bouton "Supprimer logo" avec handler
- [x] Vérifier compilation TypeScript (AC: 11)

## Dev Notes

### Structure de fichiers impactée
- `supabase/migrations/00079_club_logo_storage.sql` (NOUVEAU)
- `aureak/packages/types/src/entities.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/admin/club-directory.ts` (MODIFIÉ)
- `aureak/packages/api-client/src/index.ts` (MODIFIÉ — exporter nouvelles fonctions)
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` (MODIFIÉ)

### Pattern de référence complet
- Upload Storage : `addChildPhoto()` dans `child-directory.ts` (lignes 141-181)
- Signed URL batch : `getSignedPhotoUrls()` + usage dans `listJoueurs()` (lignes 77-88, 466-480)
- Input file web-only : pattern `Platform.OS === 'web'` dans `clubs/[clubId]/page.tsx` ligne 218
- Affichage image : `ThemeCard.tsx` banner image avec `resizeMode="cover"` et placeholder

### Dimensions logo recommandées pour l'affichage
- Dans la carte (Story 23.5) : container 64x64px, `resizeMode="contain"`
- Dans la fiche détail : container 120x120px, `resizeMode="contain"`
- Fond du container : blanc ou `colors.light.muted` pour logos sur fond transparent

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Colonne DB nommée `logo_path` (pas `logo_url` comme spécifié) — choix sémantique plus correct (stocke un chemin, pas une URL).
- `logoUrl: string | null` est le champ TS transient généré à la volée par l'api-client (batch `createSignedUrls` dans `listClubDirectory`, individuel dans `getClubDirectoryEntry`).
- Upload UX : sélection fichier → preview local → upload déclenché dans `handleSave()` (pas immédiatement `onChange`). Annuler vide le logo en attente.
- Validation format/taille implémentée côté API (`uploadClubLogo`) ET côté UI (`handleLogoFileChange`) pour un feedback immédiat.
- `deleteClubLogo` : ordre DB-first pour éviter l'état incohérent logo_path + fichier Storage supprimé.
- Audit logs sur upload et suppression logo.

### Senior Developer Review

**Reviewer:** claude-sonnet-4-6 (adversarial)
**Result:** PASS (toutes issues corrigées)

- **H1 FIXED** — Validation `file.type` dans `uploadClubLogo()` (PNG/JPEG only)
- **H2 FIXED** — Validation `file.size > 2MB` dans `uploadClubLogo()`
- **H3 FIXED** — `deleteClubLogo` : DB update avant Storage remove
- **M1 FIXED** — Upload différé au `handleSave()`, `handleLogoFileChange` pour preview local
- **M2 FIXED** — `audit_logs` insérés dans `uploadClubLogo` et `deleteClubLogo`
- **M3 FIXED** — Migration 00079 complétée : bucket `club-logos` + 3 policies Storage
- **M4 FIXED** — Story file mis à jour : status `done`, tasks cochées, File List renseigné
- **L1 FIXED** — Extension depuis `file.type` (plus `file.name`)
- **L2 FIXED** — Rollback Storage si DB update échoue dans `uploadClubLogo`

### File List

- `aureak/supabase/migrations/00079_club_logo_path.sql` — NOUVEAU : ALTER TABLE + bucket + policies Storage
- `aureak/packages/types/src/entities.ts` — `logoPath` + `logoUrl` dans `ClubDirectoryEntry`
- `aureak/packages/api-client/src/admin/club-directory.ts` — `getClubLogoSignedUrl`, `uploadClubLogo`, `deleteClubLogo`, batch signed URLs dans `listClubDirectory`, `mapRow`
- `aureak/packages/api-client/src/index.ts` — exports `uploadClubLogo`, `deleteClubLogo`, `getClubLogoSignedUrl`
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` — logo upload UI (section édition + preview + deferred save)
