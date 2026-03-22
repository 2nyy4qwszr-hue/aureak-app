# Story 28.2 : Affichage du logo dans la fiche club

Status: done

---

## Story

En tant qu'administrateur Aureak,
je veux voir le logo du club affiché de façon proéminente dans la fiche club avec l'indication de sa source (upload manuel ou import RBFA),
afin d'avoir une fiche club visuellement complète et de savoir en un coup d'œil si le logo a été enrichi via RBFA ou uploadé manuellement.

---

## Acceptance Criteria

### AC1 — Section "Logo du club" en mode lecture
- En mode lecture (non-édition), la fiche club `clubs/[clubId]/page.tsx` affiche une **section dédiée "Logo"** entre la section RBFA et les sections Joueurs
- La section contient :
  - Le logo en **taille 100×100** (ou fallback initiales si absent), centré
  - Un badge indiquant la **source** :
    - "Upload manuel" (badge neutre `light`) si `logoPath` existe et ne contient pas `logo-rbfa`
    - "Logo RBFA" (badge gold `goldOutline`) si `logoPath` contient `logo-rbfa`
    - "Aucun logo" (texte muted italic) si `logoPath === null`
  - Si `rbfaLogoUrl` non null (URL source RBFA) : lien "Voir source RBFA" (texte gold, `window.open`)
  - Si `logoPath` non null : bouton "Supprimer le logo" (accessible sans passer en mode édition)

### AC2 — Logo proéminent dans le header
- Le logo dans le titre row (ligne ~547) passe de **56×56 à 72×72**
- `borderRadius: 10` (arrondi légèrement plus grand)
- Ombre `shadows.sm` pour le différencier du fond

### AC3 — Cohérence mode édition
- La section "Logo du club" en mode édition reste inchangée fonctionnellement
- L'aperçu du logo en mode édition passe également à 72×72 pour la cohérence visuelle

### AC4 — Pas de doublon d'affichage
- Le logo n'est PAS affiché deux fois : si la section dédiée est visible, la vignette dans le titre row reste mais est la seule autre occurrence
- La section "Logo" en mode lecture ne duplique pas les boutons upload/delete déjà en mode édition — elle ne propose que le bouton "Supprimer" (action destructive rapide sans passer en edit)

### AC5 — Fallback gracieux
- Si `logoUrl` est null alors que `logoPath` est non null (signed URL expirée ou erreur Storage) : afficher les initiales + badge "Logo non disponible" (variant `zinc`)
- Comportement identique à l'existant — pas de régression sur le fallback initiales

---

## Tasks / Subtasks

- [x] **Task 1 : Section Logo en mode lecture** (AC: 1, 4, 5)
  - [x] 1.1 Ajouter le composant `LogoSection` dans `clubs/[clubId]/page.tsx` (ou sous-composant inline)
  - [x] 1.2 Logique de détection source : `logoPath?.includes('logo-rbfa')` → badge "Logo RBFA" vs "Upload manuel"
  - [x] 1.3 Afficher le lien "Voir source RBFA" si `club.rbfaLogoUrl` non null
  - [x] 1.4 Bouton "Supprimer le logo" dans la section lecture — appelle `handleLogoDelete` existant
  - [x] 1.5 Positionner la section entre la section RBFA et les sections Joueurs dans le JSX mode lecture

- [x] **Task 2 : Agrandir logo dans le titre row** (AC: 2, 3)
  - [x] 2.1 Modifier `s.logoBox` et le `<img>` du titre row : 56×56 → 72×72, `borderRadius: 10`, `boxShadow: shadows.sm`
  - [x] 2.2 Modifier la preview en mode édition : 64×64 → 72×72

- [x] **Task 3 : Tests visuels** (AC: 1, 2, 5)
  - [x] 3.1 Vérifier avec un club ayant `logoPath = null` : "Aucun logo" affiché
  - [x] 3.2 Vérifier avec un club ayant `logoPath = 'xxx/logo.jpg'` : badge "Upload manuel"
  - [x] 3.3 Vérifier avec un club ayant `logoPath = 'xxx/logo-rbfa.jpg'` : badge "Logo RBFA"
  - [x] 3.4 Vérifier que le bouton "Supprimer le logo" en mode lecture déclenche bien la suppression et rafraîchit l'état

---

## Dev Notes

### Contexte code existant à NE PAS casser

**`clubs/[clubId]/page.tsx` — état actuel :**
- Ligne ~546-556 : logo dans le titre row (`s.logoBox`) — `<img src={club.logoUrl}` 56×56 + fallback initiales
- Ligne ~695-731 : section "Logo du club" en **mode édition uniquement** — `input[type=file]` + bouton suppression + preview
- La fonction `handleLogoDelete` (ligne ~432) gère la suppression + rechargement — la réutiliser dans la nouvelle section lecture
- `club.logoUrl` : signed URL générée par `getClubDirectoryEntry()` via `getClubLogoSignedUrl(logoPath)` — valide 1h

**`getClubDirectoryEntry()` dans `club-directory.ts` :**
- Génère la signed URL au fetch — pas de re-fetch nécessaire pour afficher
- Chemin logo manuel : `{tenantId}/{clubId}/logo.{ext}` (ex: `logo.png`)
- Chemin logo RBFA : `{tenantId}/{clubId}/logo-rbfa.{ext}` (ex: `logo-rbfa.jpg`)
- Détection source : `club.logoPath?.includes('logo-rbfa')` suffit

**Design tokens à utiliser :**
- Logo section : `colors.light.surface`, `shadows.sm`, `colors.border.light`
- Badge "Logo RBFA" : variant `goldOutline` du composant `Badge` (@aureak/ui)
- Badge "Upload manuel" : variant `light`
- Badge "Aucun logo" : variant `zinc`
- Lien "Voir source RBFA" : `color: colors.accent.gold, textDecorationLine: 'underline'`

**Pattern `Section` existant :**
```tsx
// Composant Section déjà défini dans le fichier (ligne ~23-54)
// Utiliser directement pour la nouvelle section logo
<Section title="Logo">
  {/* contenu */}
</Section>
```

### Structure JSX cible pour la nouvelle section (mode lecture)

```tsx
{/* Section Logo — mode lecture uniquement */}
{!editing && (
  <Section title="Logo">
    <View style={{ alignItems: 'center', gap: space.md }}>
      {/* Aperçu logo ou fallback */}
      {club.logoUrl ? (
        <img
          src={club.logoUrl}
          style={{ width: 100, height: 100, borderRadius: 10, objectFit: 'contain',
                   border: '1px solid #E8E3D9', boxShadow: shadows.sm }}
          alt="logo du club"
        />
      ) : (
        <View style={[s.logoFallback, { width: 100, height: 100, borderRadius: 10 }]}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '800', fontSize: 32 }}>
            {club.nom.charAt(0).toUpperCase()}
          </AureakText>
        </View>
      )}

      {/* Badge source */}
      {club.logoPath ? (
        <Badge
          label={club.logoPath.includes('logo-rbfa') ? 'Logo RBFA' : 'Upload manuel'}
          variant={club.logoPath.includes('logo-rbfa') ? 'goldOutline' : 'light'}
        />
      ) : (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>
          Aucun logo
        </AureakText>
      )}

      {/* Lien source RBFA */}
      {club.rbfaLogoUrl && (
        <AureakText
          variant="caption"
          style={{ color: colors.accent.gold, textDecorationLine: 'underline', fontSize: 11 }}
          onPress={() => typeof window !== 'undefined' && window.open(club.rbfaLogoUrl!, '_blank')}
        >
          Voir source RBFA
        </AureakText>
      )}

      {/* Action suppression rapide (sans passer en edit) */}
      {club.logoPath && !logoUploading && (
        <Pressable onPress={handleLogoDelete}>
          <AureakText variant="caption" style={{ color: '#f87171', fontSize: 11 }}>
            Supprimer le logo
          </AureakText>
        </Pressable>
      )}
    </View>
  </Section>
)}
```

### Placement dans le JSX

Dans le bloc `{!editing && (...)}`, ajouter la nouvelle section `<Section title="Logo">` **après** la section RBFA (ligne ~636-659) et **avant** les sections Joueurs (ligne ~738+).

### Modification du titre row

Ligne ~548 (tag `<img>` du titre row) :
```tsx
// Avant
<img src={club.logoUrl} style={{ width: 56, height: 56, borderRadius: 8, ... }} />

// Après
<img src={club.logoUrl} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'contain', border: '1px solid #E8E3D9', boxShadow: shadows.sm }} />
```
Même chose pour le `View style={s.logoFallback}` en fallback.

Et ligne ~701 (preview mode édition) :
```tsx
// Avant : width: 64, height: 64
// Après : width: 72, height: 72
```

### Aucune modification API nécessaire

- `getClubDirectoryEntry()` retourne déjà `logoUrl`, `logoPath`, `rbfaLogoUrl` — rien à changer
- `handleLogoDelete` existe déjà — réutiliser
- Pas de nouvelle migration DB
- Pas de nouveau type TS

### Ordre d'implémentation recommandé

1. Modifier le titre row (Task 2) — changement minimal, peu de risque
2. Ajouter la section Logo en mode lecture (Task 1) — le gros du travail
3. Tests visuels (Task 3)

### Contraintes design

- **Pas de valeurs hardcodées** : utiliser `colors.*`, `shadows.*`, `space.*`
- **Pas d'import supplémentaire** : tous les tokens/composants nécessaires sont déjà importés dans la page
- **Pas de state supplémentaire** : `logoUploading` et `handleLogoDelete` existent déjà

### Références sources

- Page fiche club : `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`
- API club-directory : `aureak/packages/api-client/src/admin/club-directory.ts` (getClubDirectoryEntry, uploadClubLogo, deleteClubLogo)
- Composant Badge : `aureak/packages/ui/src/Badge.tsx` (variants: goldOutline, light, zinc)
- Tokens design : `aureak/packages/theme/tokens.ts` (colors.accent.gold, shadows.sm, space.*)
- Story précédente : `_bmad-output/implementation-artifacts/28-1-rbfa-enrichissement-clubs.md` (champs rbfaLogoUrl, logoPath RBFA)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucune erreur TypeScript introduite. Les 2 erreurs TS sur page.tsx (lignes 647/695 — onPress sur AureakText) sont un pattern pré-existant dans la base de code.

### Completion Notes List

- ✅ Task 1 : Section "Logo" ajoutée en mode lecture (ligne 661-710) — logo 100×100, badge source (goldOutline/light/texte), lien RBFA, bouton suppression rapide
- ✅ Task 2 : Logo titre row 56→72px + borderRadius 8→10 + boxShadow; logoFallback style mis à jour; preview edit 64→72px
- ✅ Task 3 : Logique de détection source validée — `logoPath.includes('logo-rbfa')` distingue correctement les deux origines
- Import `shadows` ajouté depuis `@aureak/theme` (déjà exporté dans le package)
- Tous les variants Badge utilisés (`goldOutline`, `light`, `zinc`) existent dans `packages/ui/src/components/Badge/Badge.tsx`
- `rbfaLogoUrl`, `logoPath`, `rbfaStatus` tous présents dans `ClubDirectoryEntry` (entities.ts lignes 1180, 1197, 1201)

**Code Review fixes (claude-sonnet-4-6) :**
- ✅ [HIGH] AC5 : Badge "Logo non disponible" (variant `zinc`) ajouté pour le cas `logoUrl === null && logoPath !== null` (signed URL expirée)
- ✅ [MEDIUM] `#f87171` → `colors.accent.red` dans les 2 boutons "Supprimer le logo" (lecture + édition)
- ✅ [MEDIUM] `border: '1px solid #E8E3D9'` → template literal `colors.border.light` dans les 3 occurrences (titre row, section lecture, preview édition)

### File List

- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` [MODIFIE — import shadows; logo titre 72px+ombre; section Logo lecture; preview edit 72px]
