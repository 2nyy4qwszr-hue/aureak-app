# Story 49-6 — Design Implantations : photo/logo + redesign page détail

**Epic** : 49 — Design batch avril 2026 #2
**Status** : done
**Priority** : medium
**Effort** : M (demi-journée)

---

## Contexte

La page liste des implantations (`(admin)/implantations`) affiche chaque site avec un gradient vert terrain générique. Il n'existe aucun moyen d'associer une vraie photo ou un logo à une implantation.

Cette story enrichit visuellement les implantations en deux axes :
1. **Données** — ajout d'une colonne `photo_url` en DB + bucket Storage dédié
2. **UI** — `ImplantationCard` utilise la photo réelle si disponible, sinon fallback gradient ; page détail redesignée avec header full-width premium + liste des groupes cliquables

Le code existant dans `aureak/apps/web/app/(admin)/implantations/index.tsx` est enrichi — aucune nouvelle route ne sera créée.

---

## User Story

**En tant qu'** administrateur Aureak,
**je veux** associer une photo ou un logo à chaque implantation et voir un header visuel premium sur la fiche,
**afin de** donner une identité visuelle forte à chaque site et naviguer facilement vers les groupes qui y sont rattachés.

---

## Acceptance Criteria

- [x] AC1 — La table `implantations` dispose d'une colonne `photo_url TEXT NULL` (migration 00114)
- [x] AC2 — Un bucket Supabase Storage `implantation-photos` existe avec les bonnes policies RLS (admin peut upload/delete ; lecture publique)
- [x] AC3 — Le type TS `Implantation` expose `photoUrl?: string | null`
- [x] AC4 — `mapImplantation` dans `api-client/src/sessions/implantations.ts` mappe `photo_url → photoUrl`
- [x] AC5 — Une fonction `uploadImplantationPhoto(implantationId, file)` existe dans `api-client` et retourne la `photo_url` publique
- [x] AC6 — `updateImplantation` accepte `photoUrl` et persiste `photo_url` en DB
- [x] AC7 — `ImplantationCard` affiche la photo (`<Image>` React Native) si `impl.photoUrl` est défini, sinon le gradient vert terrain actuel (aucune régression)
- [x] AC8 — En mode édition inline d'une implantation, un bouton "Changer la photo" permet d'uploader un fichier image (input type file web) → upload Storage → `updateImplantation` avec la nouvelle URL
- [x] AC9 — La page détail d'une implantation (panel qui s'ouvre à la sélection via `onManageGroup` ou un nouveau clic sur le nom/header) affiche :
  - Un header full-width (hauteur 200px) avec la photo ou le gradient en fond
  - Overlay sombre gradient bas → overlay nom de l'implantation + adresse en bas-gauche
  - Badge nombre total de joueurs en haut-droite
- [x] AC10 — Sous le header, les groupes de l'implantation sont listés en cards verticales (une card par groupe, non en scroll horizontal), chacune avec : dot couleur méthode, nom du groupe, horaire, nombre de joueurs, chevron droit
- [x] AC11 — Clic sur une card groupe → navigation `router.push('/groups/[groupId]')`
- [x] AC12 — Si aucun groupe n'existe, afficher un placeholder "Aucun groupe — Ajoutez le premier" avec le bouton existant
- [x] AC13 — Respect strict des tokens design : `colors.light.*`, `shadows.*`, `radius.*` — zéro hardcode
- [x] AC14 — `try/finally` sur tous les setters de chargement/upload
- [x] AC15 — `console.error` guardés `process.env.NODE_ENV !== 'production'`

---

## Tasks

### T1 — Migration Supabase 00114

Fichier : `supabase/migrations/00114_implantations_photo_url.sql`

```sql
-- Story 49-6 — Ajout photo_url sur implantations + bucket Storage implantation-photos

ALTER TABLE implantations
  ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;

COMMENT ON COLUMN implantations.photo_url IS
  'URL publique Supabase Storage vers la photo ou le logo de ce site (bucket implantation-photos)';

-- Bucket Storage : créé via Dashboard Supabase ou via cette migration SQL
-- Si le bucket n'existe pas encore, l'insérer dans storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('implantation-photos', 'implantation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy : lecture publique
CREATE POLICY "implantation_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'implantation-photos');

-- Policy : insert/update/delete réservé aux admins authentifiés
CREATE POLICY "implantation_photos_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'implantation-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "implantation_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'implantation-photos'
    AND auth.role() = 'authenticated'
  );
```

- [x] Fichier créé dans `supabase/migrations/00117_implantations_photo_url.sql` (numéroté 00117 — dernière migration était 00116)

---

### T2 — Type TS `Implantation` — ajout `photoUrl`

Fichier : `aureak/packages/types/src/entities.ts`

Ajouter `photoUrl` au type `Implantation` (après `gpsRadius`, avant `deletedAt`) :

```typescript
/** Implantation — site physique où se déroulent les séances */
export type Implantation = {
  id        : string
  tenantId  : string
  name      : string
  address   : string | null
  gpsLat    : number | null
  gpsLon    : number | null
  gpsRadius : number
  photoUrl  : string | null   // ← ajouté Story 49-6 — photo/logo du site
  deletedAt : string | null
  createdAt : string
}
```

- [x] Type mis à jour dans `entities.ts`

---

### T3 — API : mapImplantation + uploadImplantationPhoto + updateImplantation

Fichier : `aureak/packages/api-client/src/sessions/implantations.ts`

**3a — `mapImplantation`** : ajouter le mapping `photo_url → photoUrl` :

```typescript
function mapImplantation(row: Record<string, unknown>): Implantation {
  return {
    id       : row.id        as string,
    tenantId : row.tenant_id as string,
    name     : row.name      as string,
    address  : (row.address    as string | null) ?? null,
    gpsLat   : (row.gps_lat    as number | null) ?? null,
    gpsLon   : (row.gps_lon    as number | null) ?? null,
    gpsRadius: (row.gps_radius as number | null) ?? 300,
    photoUrl : (row.photo_url  as string | null) ?? null,   // ← Story 49-6
    deletedAt: (row.deleted_at as string | null) ?? null,
    createdAt: row.created_at  as string,
  }
}
```

**3b — `updateImplantation`** : étendre les `Partial<Pick<...>>` pour inclure `photoUrl` :

```typescript
export async function updateImplantation(
  id    : string,
  params: Partial<Pick<Implantation, 'name' | 'address' | 'gpsLat' | 'gpsLon' | 'gpsRadius' | 'photoUrl'>>
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.name      !== undefined) updates['name']       = params.name
  if (params.address   !== undefined) updates['address']    = params.address
  if (params.gpsLat    !== undefined) updates['gps_lat']    = params.gpsLat
  if (params.gpsLon    !== undefined) updates['gps_lon']    = params.gpsLon
  if (params.gpsRadius !== undefined) updates['gps_radius'] = params.gpsRadius
  if (params.photoUrl  !== undefined) updates['photo_url']  = params.photoUrl  // ← Story 49-6
  // ...
}
```

**3c — `uploadImplantationPhoto`** : nouvelle fonction export :

```typescript
/**
 * Story 49-6 — Upload d'une photo vers Storage bucket 'implantation-photos'
 * Retourne l'URL publique stockée en DB, ou une erreur.
 */
export async function uploadImplantationPhoto(
  implantationId: string,
  file          : File,
): Promise<{ publicUrl: string | null; error: unknown }> {
  const ext      = file.name.split('.').pop() ?? 'jpg'
  const path     = `${implantationId}/cover.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('implantation-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[uploadImplantationPhoto] upload error:', uploadError)
    return { publicUrl: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('implantation-photos')
    .getPublicUrl(path)

  const publicUrl = data.publicUrl ?? null

  const { error: dbError } = await updateImplantation(implantationId, { photoUrl: publicUrl })
  if (dbError) {
    if (process.env.NODE_ENV !== 'production')
      console.error('[uploadImplantationPhoto] DB update error:', dbError)
    return { publicUrl: null, error: dbError }
  }

  return { publicUrl, error: null }
}
```

- [x] `mapImplantation` mis à jour
- [x] `updateImplantation` étendu avec `photoUrl`
- [x] `uploadImplantationPhoto` créée et exportée

---

### T4 — UI : `ImplantationCard` — photo réelle ou fallback gradient

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

Dans la section `{/* ── Photo de couverture ── */}` de `ImplantationCard`, remplacer le `View` gradient générique par un rendu conditionnel :

**Si `impl.photoUrl` est défini** → afficher avec `<Image>` React Native (source `{ uri: impl.photoUrl }`, style `position: absolute, top: 0, left: 0, right: 0, bottom: 0`)

**Sinon** → conserver le gradient vert terrain existant `linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)`

Ajouter l'import `Image` depuis `react-native`.

```tsx
{/* ── Photo de couverture ── */}
<View style={styles.coverContainer}>
  {impl.photoUrl ? (
    <Image
      source={{ uri: impl.photoUrl }}
      style={[styles.coverGradient, { resizeMode: 'cover' }]}
    />
  ) : (
    <View
      style={[
        styles.coverGradient,
        { background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)' } as any,
      ]}
    />
  )}
  {/* badges & overlay inchangés */}
  ...
</View>
```

- [x] `Image` importé depuis `react-native`
- [x] Rendu conditionnel photo / gradient implémenté dans `ImplantationCard`

---

### T5 — UI : bouton "Changer la photo" dans le mode édition inline

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

**State local à ajouter dans la page principale** :

```typescript
const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null) // implantationId en cours d'upload
```

**Handler** :

```typescript
const handlePhotoUpload = async (implId: string, file: File) => {
  setUploadingPhoto(implId)
  try {
    const { publicUrl, error } = await uploadImplantationPhoto(implId, file)
    if (error) {
      if (process.env.NODE_ENV !== 'production')
        console.error('[Implantations] handlePhotoUpload error:', error)
      return
    }
    // Mise à jour optimiste locale
    setImplantations(prev =>
      prev.map(i => i.id === implId ? { ...i, photoUrl: publicUrl } : i)
    )
  } finally {
    setUploadingPhoto(null)
  }
}
```

**Props supplémentaires sur `ImplantationCard`** :

```typescript
onPhotoUpload : (file: File) => void
uploadingPhoto: boolean
```

**Dans le bloc `isEditing` de `ImplantationCard`**, ajouter sous les deux `TextInput` :

```tsx
{/* Bouton changer photo — web uniquement (input type=file) */}
<View style={{ gap: space.xs }}>
  <AureakText variant="label" style={{ color: colors.text.muted }}>PHOTO DU SITE</AureakText>
  <Pressable
    style={[styles.actionBtn, { borderColor: colors.accent.gold + '60', flexDirection: 'row', gap: space.xs, alignItems: 'center' }]}
    onPress={() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) onPhotoUpload(file)
      }
      input.click()
    }}
  >
    <AureakText variant="caption" style={{ color: uploadingPhoto ? colors.text.muted : colors.accent.gold }}>
      {uploadingPhoto ? 'Upload en cours...' : impl.photoUrl ? 'Changer la photo' : '+ Ajouter une photo'}
    </AureakText>
  </Pressable>
  {impl.photoUrl && (
    <AureakText variant="caption" style={{ color: colors.text.muted }}>Photo actuelle enregistrée</AureakText>
  )}
</View>
```

- [x] State `uploadingPhoto` ajouté dans la page principale
- [x] Handler `handlePhotoUpload` ajouté avec try/finally
- [x] `uploadImplantationPhoto` importé depuis `@aureak/api-client`
- [x] Props `onPhotoUpload` et `uploadingPhoto` passées à `ImplantationCard`
- [x] Bouton "Changer la photo" / "+ Ajouter une photo" rendu dans le bloc `isEditing`

---

### T6 — UI : redesign page détail — header premium + groupes cards

Fichier : `aureak/apps/web/app/(admin)/implantations/index.tsx`

**Décision d'architecture** : plutôt que créer une route séparée, la page détail s'ouvre via un état `selectedImplantId` qui conditionne l'affichage d'un panneau `ImplantationDetail` en remplacement temporaire de la grille (pattern panel-in-panel, compatible avec la vision design `_agents/design-vision.md` §3).

**State à ajouter** :

```typescript
const [selectedImplantId, setSelectedImplantId] = useState<string | null>(null)
```

**Déclencheur** : clic sur le nom/titre d'une implantation dans `ImplantationCard` (en mode non-édition). Ajouter une prop `onSelect: () => void` sur `ImplantationCard`, liée à `Pressable` wrappant le bloc `cardTitle`.

**Nouveau sous-composant `ImplantationDetail`** :

```tsx
function ImplantationDetail({
  impl,
  implGroups,
  membersByGroup,
  onBack,
  onAddGroup,
  router,
}: {
  impl          : Implantation
  implGroups    : Group[]
  membersByGroup: Record<string, GroupMemberWithDetails[]>
  onBack        : () => void
  onAddGroup    : () => void
  router        : ReturnType<typeof useRouter>
}) {
  const totalChildren = implGroups.reduce(
    (total, g) => total + (membersByGroup[g.id]?.length ?? 0), 0
  )

  return (
    <View style={detailStyles.container}>

      {/* ── Header full-width premium ── */}
      <View style={detailStyles.header}>
        {impl.photoUrl ? (
          <Image
            source={{ uri: impl.photoUrl }}
            style={detailStyles.headerBg}
          />
        ) : (
          <View
            style={[detailStyles.headerBg, {
              background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)'
            } as any]}
          />
        )}

        {/* Overlay gradient bas */}
        <View style={[detailStyles.headerOverlay,
          { background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' } as any]}
        />

        {/* Bouton retour */}
        <Pressable style={detailStyles.backBtn} onPress={onBack}>
          <AureakText variant="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>← Retour</AureakText>
        </Pressable>

        {/* Badge joueurs */}
        {totalChildren > 0 && (
          <View style={detailStyles.playersBadge}>
            <AureakText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
              {totalChildren} joueur{totalChildren !== 1 ? 's' : ''}
            </AureakText>
          </View>
        )}

        {/* Nom + adresse en bas-gauche */}
        <View style={detailStyles.headerMeta}>
          <AureakText
            variant="h2"
            style={{ color: '#FFFFFF', fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}
          >
            {impl.name}
          </AureakText>
          {impl.address && (
            <AureakText variant="caption" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {impl.address}
            </AureakText>
          )}
        </View>
      </View>

      {/* ── Section Groupes ── */}
      <View style={detailStyles.body}>
        <View style={detailStyles.sectionHeader}>
          <AureakText variant="label" style={{ color: colors.text.muted, letterSpacing: 1 }}>
            GROUPES
          </AureakText>
          <Pressable style={detailStyles.addGroupInlineBtn} onPress={onAddGroup}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' }}>+ Ajouter</AureakText>
          </Pressable>
        </View>

        {implGroups.length === 0 ? (
          <View style={detailStyles.emptyGroups}>
            <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' }}>
              Aucun groupe — créez le premier ci-dessus.
            </AureakText>
          </View>
        ) : (
          <View style={detailStyles.groupsList}>
            {implGroups.map((g) => {
              const methodColor  = g.method ? METHOD_COLOR[g.method] : colors.accent.gold
              const memberCount  = membersByGroup[g.id]?.length ?? 0
              return (
                <Pressable
                  key={g.id}
                  style={detailStyles.groupCard}
                  onPress={() => router.push(`/groups/${g.id}` as never)}
                >
                  {/* Dot méthode */}
                  <View style={[detailStyles.groupCardDot, { backgroundColor: methodColor }]} />

                  {/* Infos groupe */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <AureakText variant="body" style={{ fontWeight: '700', color: colors.text.dark }}>
                      {g.name}
                    </AureakText>
                    {g.dayOfWeek && g.startHour !== null && (
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>
                        {g.dayOfWeek} · {formatTime(g.startHour!, g.startMinute ?? 0)}
                        {g.durationMinutes ? ` · ${g.durationMinutes} min` : ''}
                      </AureakText>
                    )}
                  </View>

                  {/* Badge membres */}
                  {memberCount > 0 && (
                    <View style={[detailStyles.memberBadge, { backgroundColor: methodColor + '18', borderColor: methodColor + '40' }]}>
                      <AureakText variant="caption" style={{ color: methodColor, fontWeight: '700', fontSize: 11 }}>
                        {memberCount}
                      </AureakText>
                    </View>
                  )}

                  {/* Chevron */}
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 16 }}>›</AureakText>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}
```

**Styles `detailStyles`** (objet `StyleSheet.create` séparé ou ajouté dans `styles`) :

```typescript
const detailStyles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  header     : {
    height  : 200,
    position: 'relative',
    overflow: 'hidden',
    // borderRadius arrondi en bas uniquement — hack web
    borderBottomLeftRadius : radius.cardLg,
    borderBottomRightRadius: radius.cardLg,
  },
  headerBg   : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, resizeMode: 'cover' } as any,
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backBtn    : {
    position         : 'absolute',
    top              : space.md,
    left             : space.md,
    backgroundColor  : 'rgba(0,0,0,0.35)',
    borderRadius     : radius.badge,
    paddingHorizontal: 12,
    paddingVertical  : 6,
    zIndex           : 3,
  },
  playersBadge: {
    position         : 'absolute',
    top              : space.md,
    right            : space.md,
    backgroundColor  : 'rgba(0,0,0,0.45)',
    borderRadius     : radius.badge,
    paddingHorizontal: 10,
    paddingVertical  : 4,
    zIndex           : 3,
  },
  headerMeta : {
    position : 'absolute',
    bottom   : space.md,
    left     : space.md,
    right    : space.lg ?? space.xl,
    zIndex   : 2,
  },
  body       : { padding: space.md, gap: space.md },
  sectionHeader: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
  },
  addGroupInlineBtn: {
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '50',
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  emptyGroups: {
    padding      : space.xl,
    alignItems   : 'center',
    backgroundColor: colors.light.muted,
    borderRadius : radius.card,
    borderWidth  : 1,
    borderColor  : colors.border.light,
  },
  groupsList : { gap: space.sm },
  groupCard  : {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : space.sm,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    padding         : space.md,
    boxShadow       : shadows.sm,
  } as any,
  groupCardDot: {
    width       : 10,
    height      : 10,
    borderRadius: 5,
    flexShrink  : 0,
  },
  memberBadge: {
    borderWidth      : 1,
    borderRadius     : radius.badge,
    paddingHorizontal: 8,
    paddingVertical  : 2,
  },
})
```

**Intégration dans le render principal** :

Dans `ImplantationsPage`, remplacer la grille par un rendu conditionnel :

```tsx
{selectedImplantId !== null ? (
  <ImplantationDetail
    impl={implantations.find(i => i.id === selectedImplantId)!}
    implGroups={groups[selectedImplantId] ?? []}
    membersByGroup={membersByGroup}
    onBack={() => setSelectedImplantId(null)}
    onAddGroup={() => { setAddGroupFor(selectedImplantId); setGroupForm(emptyForm()) }}
    router={router}
  />
) : (
  // ... grille de cards existante
)}
```

Ajouter prop `onSelect` sur `ImplantationCard` déclenchant `setSelectedImplantId(impl.id)`.

- [x] State `selectedImplantId` ajouté
- [x] Sous-composant `ImplantationDetail` créé
- [x] `detailStyles` créé avec tous les tokens
- [x] Prop `onSelect` ajoutée sur `ImplantationCard`
- [x] Render conditionnel grille / détail intégré dans le return principal
- [x] `onAddGroup` depuis `ImplantationDetail` fonctionne et ouvre le panel de création de groupe

---

## Dépendances

- Story 9-4 `done` — table `implantations` existante (confirmé)
- Story 47-2 `done` — `ImplantationCard` avec cover + chips groupes (code existant à enrichir)
- Story 44-6 `done` — `membersByGroup` state déjà chargé (confirmé dans le code)
- Supabase Storage déjà configuré (Story 18-2 bucket `player-photos` en production)

---

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00114_implantations_photo_url.sql` | Créer |
| `aureak/packages/types/src/entities.ts` | Modifier — `photoUrl` sur `Implantation` |
| `aureak/packages/api-client/src/sessions/implantations.ts` | Modifier — mapper + `uploadImplantationPhoto` + `updateImplantation` étendu |
| `aureak/apps/web/app/(admin)/implantations/index.tsx` | Modifier — T4 + T5 + T6 |

---

## QA post-story

```bash
# BLOCKER — try/finally sur tous les setters
grep -n "setUploadingPhoto(null)\|setCreating(false)\|setSaving(false)" aureak/apps/web/app/(admin)/implantations/index.tsx

# WARNING — console non guardé
grep -n "console\." aureak/apps/web/app/(admin)/implantations/index.tsx | grep -v "NODE_ENV"
grep -n "console\." aureak/packages/api-client/src/sessions/implantations.ts | grep -v "NODE_ENV"

# WARNING — catch silencieux
grep -n "catch(() => {})" aureak/apps/web/app/(admin)/implantations/index.tsx
```

---

## Notes d'implémentation

1. **Bucket Storage** : si la migration SQL sur `storage.buckets` échoue (RLS Supabase sur les tables storage), créer le bucket manuellement depuis le Dashboard Supabase → Storage → New bucket → `implantation-photos` (public: true). Signaler dans le commit.

2. **`input.click()` (web only)** : le bouton "Changer la photo" utilise `document.createElement('input')` — valide pour Expo Router web. Ajouter un commentaire `// web only` pour éviter la confusion lors d'un portage mobile futur.

3. **`resizeMode: 'cover'`** sur `<Image>` React Native web : passer `style={{ resizeMode: 'cover', width: '100%', height: '100%' }}` via `objectFit: 'cover'` en tant que style inline web si `resizeMode` ne s'applique pas correctement. Tester visuellement.

4. **Panel imbriqué `addGroupFor`** : quand `selectedImplantId !== null` et `addGroupFor !== null`, le panneau de création de groupe doit s'afficher dans le même scroll que `ImplantationDetail` (pas de conflit avec la grille cachée). Le state `addGroupFor` reste dans la page principale — aucun refactor de logique métier nécessaire.

5. **`space.lg`** : vérifier que ce token existe dans `@aureak/theme`. Si absent, utiliser `space.xl` ou `space.md * 1.5`. Ne pas hardcoder.

---

## Commit message cible

```
feat(epic-49): story 49-6 — implantations photo/logo + redesign detail header premium
```
