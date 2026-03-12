# Story 18.7 : Fiche joueur — Redesign complet (header + sections A→I)

Status: done

**Dépendances :** Story 18-5 (formatNomPrenom, nom/prenom dans ChildDirectoryEntry)

## Story

En tant qu'administrateur Aureak,
je veux que la fiche joueur affiche une photo grande et un en-tête clair avec nom, statut et club, puis des sections organisées dans un ordre logique (identité → historique → club → parcours → blessures → adresse → parents → notes),
afin de trouver l'information d'un joueur rapidement sans avoir à scroller dans tous les sens.

## Acceptance Criteria

1. **Nouveau header** — La `heroCard` actuelle est remplacée par un header avec : (a) photo joueur circulaire grande (120px, `currentPhoto.photoUrl` ou initiales fallback), (b) `formatNomPrenom(child.nom, child.prenom, child.displayName)` en `variant="h2"` couleur `colors.accent.gold`, (c) badge de statut académie calculé (`AcademyStatusHeader`), (d) nom du club actuel (`child.currentClub`) en `variant="caption"`, (e) toggle actif/inactif conservé en haut à droite.
2. **Migration DB** — La table `child_directory` possède deux nouvelles colonnes nullable : `email TEXT` et `tel TEXT` (contact direct du joueur, distinct des contacts parents). Numérotation migration : `00071`.
3. **Type TypeScript** — `ChildDirectoryEntry` inclut `email: string | null` et `tel: string | null`. `UpdateChildDirectoryParams` inclut ces champs.
4. **Section A — Identité** — Remplace la section actuelle "Identité" qui n'avait que `displayName` et `birthDate`. La nouvelle section inclut en lecture/édition : nom, prénom, date de naissance, email (joueur), téléphone joueur (optionnel). Le `displayName` reste en vue read-only (`InfoRow`) avec label "Nom complet (Notion)" — utile pour les joueurs importés sans nom/prenom séparés.
5. **Section B — Historique** — `HistoriqueSection` (académie + stages) est déplacée APRÈS la section Identité. Position actuelle : ligne 1297 (avant Identité) → nouvelle position : après section A.
6. **Section C — Club actuel** — Conservée telle quelle, positionnée après Historique.
7. **Section D — Parcours football** — La section "Parcours football" (historique `child_directory_history`) est déplacée à la position D, juste après Club actuel. Position actuelle : ligne 1518 (après Notes) → nouvelle position : après Club.
8. **Section E — Blessures** — `BlessuresSection` conservée, déplacée juste après Parcours football.
9. **Section F — Adresse** — Déplacée après Blessures.
10. **Section G — Parent 1** — Après Adresse.
11. **Section H — Parent 2** — Après Parent 1.
12. **Section I — Notes** — En dernier. Section "Notes internes" déplacée à la fin.
13. **Photos** — La section `ChildPhotosSection` (upload/galerie) est placée juste après le header, avant la Section A Identité. Elle sert à gérer la photo affichée dans le header.
14. **Section Métadonnées** — Conservée à la toute fin (après Notes).
15. **`saveIdentite`** — Mis à jour pour inclure les nouveaux champs : `nom`, `prenom`, `email`, `tel`, `birthDate`, `displayName`.

## Tasks / Subtasks

- [x] **T1** — Migration DB `supabase/migrations/00075_child_directory_email_tel_joueur.sql` (AC: #2)
  - [x] `ALTER TABLE child_directory ADD COLUMN IF NOT EXISTS email TEXT;`
  - [x] `ALTER TABLE child_directory ADD COLUMN IF NOT EXISTS tel TEXT;`
  - [x] Commentaires : "Email direct du joueur (≠ email parent)" et "Téléphone du joueur (facultatif)"
  - [x] Migration appliquée (numérotée 00075, conflit 00071 déjà pris)

- [x] **T2** — Mise à jour types TS (AC: #3)
  - [x] `packages/types/src/entities.ts` → `email: string | null` et `tel: string | null` ajoutés dans `ChildDirectoryEntry`
  - [x] `packages/api-client/src/admin/child-directory.ts` → `email` et `tel` dans `UpdateChildDirectoryParams`
  - [x] `toEntry` mapper mis à jour : `email: row.email ?? null, tel: row.tel ?? null`
  - [x] `updateChildDirectoryEntry` : payload.email et payload.tel conditionnels

- [x] **T3** — Refonte du header hero (AC: #1)
  - [x] `const currentPhoto = photos.find(p => p.isCurrent) ?? photos[0] ?? null` ajouté avant return
  - [x] heroCard redesigné : `flexDirection: 'row'`, photo 120px circulaire (img ou fallback initiales), infos + toggle actif
  - [x] Styles `s.heroPicFallback` et `s.heroInitials` ajoutés au StyleSheet
  - [x] `formatNomPrenom` utilisé dans le hero (nom, initiales fallback)
  - [x] Club actuel + statut académie dans le hero

- [x] **T4** — Refonte section Identité (Section A) (AC: #4)
  - [x] Read mode : InfoRow pour Nom, Prénom, DOB, Email, Téléphone + Nom complet (Notion) si nom/prenom null
  - [x] Edit mode : EditRow pour nom, prenom, birthDate, email, tel
  - [x] `saveIdentite` mis à jour : inclut email et tel
  - [x] Draft via `Partial<ChildDirectoryEntry>` — email/tel inclus automatiquement

- [x] **T5** — Réordonnancement des sections (AC: #5-#14)
  - [x] Nouvel ordre : Photos → [A] Identité → [B] Historique → [C] Club → [D] Parcours football → [E] Blessures → [F] Adresse → [G] Parent 1 → [H] Parent 2 → [I] Notes → Métadonnées

- [x] **T6** — `getChildDirectoryEntry` retourne email et tel via `toEntry` mapper — vérifié

## Dev Notes

### Localisation précise — fichier unique à modifier

**Seul fichier principal :** `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` (1658 lignes)

**Fichiers secondaires :**
- `supabase/migrations/00071_child_directory_email_tel_joueur.sql` — nouveau
- `aureak/packages/types/src/entities.ts` — +email, +tel dans ChildDirectoryEntry
- `aureak/packages/api-client/src/admin/child-directory.ts` — getChildDirectoryEntry, UpdateChildDirectoryParams

### Ordre actuel vs. Nouvel ordre

| Position actuelle | Section | Nouvelle position |
|---|---|---|
| 1 | Hero card (nom + statut) | 1 (redesigné) |
| 2 | HISTORIQUE | 5 (B) |
| 3 | Identité | 3 (A) — après photos |
| 4 | Photos | 2 (entre hero et A) |
| 5 | Club actuel | 6 (C) |
| 6 | Adresse | 9 (F) |
| 7 | Parent 1 | 10 (G) |
| 8 | Parent 2 | 11 (H) |
| 9 | Notes internes | 12 (I) |
| 10 | Parcours football | 7 (D) |
| 11 | Blessures | 8 (E) |
| 12 | Métadonnées | 13 (fin) |

### Header hero — structure cible

```tsx
<View style={s.heroCard}>
  {/* Row : photo + infos + toggle actif */}
  <View style={{ flexDirection: 'row', gap: 20, alignItems: 'flex-start' }}>

    {/* Photo joueur 120px */}
    <View>
      {currentPhoto?.photoUrl ? (
        <img src={currentPhoto.photoUrl}
          style={{ width: 120, height: 120, borderRadius: 60, objectFit: 'cover' }} />
      ) : (
        <View style={s.heroPicFallback}>
          {/* Initiales depuis nom/prenom ou displayName */}
          <AureakText style={s.heroInitials}>{getInitials(child.displayName, child.nom, child.prenom)}</AureakText>
        </View>
      )}
    </View>

    {/* Infos joueur */}
    <View style={{ flex: 1, gap: 6 }}>
      <AureakText variant="h2" color={colors.accent.gold}>
        {formatNomPrenom(child.nom, child.prenom, child.displayName)}
      </AureakText>
      {child.currentClub && (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>{child.currentClub}</AureakText>
      )}
      {academyData ? (
        <AcademyStatusHeader data={academyData} />
      ) : (
        child.statut && <Badge label={child.statut} variant="zinc" />
      )}
    </View>

    {/* Toggle actif — identique à l'actuel */}
    <Pressable onPress={handleToggleActif} disabled={togglingActif} style={s.actifToggle}>
      ...
    </Pressable>
  </View>
</View>
```

### Section A Identité — champs complets

| Champ | Type | Label affiché | Condition affichage |
|---|---|---|---|
| nom | string \| null | Nom | toujours |
| prenom | string \| null | Prénom | toujours |
| birthDate | string \| null | Date de naissance | toujours |
| email | string \| null | Email | toujours |
| tel | string \| null | Téléphone | optionnel (caption "facultatif") |
| displayName | string | Nom complet (Notion) | read-only, visible si nom ou prenom est null |

### Migration 00071

```sql
-- supabase/migrations/00071_child_directory_email_tel_joueur.sql
-- Contact direct du joueur (≠ contact parents)
-- email : adresse email propre au joueur (formulaires d'inscription)
-- tel   : téléphone du joueur (facultatif, ados/adultes)

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS tel   TEXT;

COMMENT ON COLUMN child_directory.email IS 'Email direct du joueur (distinct des emails parents)';
COMMENT ON COLUMN child_directory.tel   IS 'Téléphone du joueur (facultatif)';
```

### `saveIdentite` mise à jour

```typescript
// Ligne 1188 — saveIdentite actuel :
const saveIdentite = () => saveEdit({
  displayName: draft.displayName || child!.displayName,
  birthDate  : draft.birthDate   ?? null,
})

// Nouvelle version :
const saveIdentite = () => saveEdit({
  displayName: draft.displayName || child!.displayName,
  nom        : draft.nom        ?? null,
  prenom     : draft.prenom     ?? null,
  birthDate  : draft.birthDate  ?? null,
  email      : draft.email      ?? null,
  tel        : draft.tel        ?? null,
})
```

### `currentPhoto` dans le header

La variable `currentPhoto` est déjà dans `photos` state (chargé en `loadChild` via `listChildPhotos`). Il faut juste l'extraire en haut du render :

```typescript
// À ajouter juste avant le return, dans ChildDetailPage
const currentPhoto = photos.find(p => p.isCurrent) ?? photos[0] ?? null
```

### Considérations photos dans le header

Le header utilise `photos` (déjà loadé), pas un appel API supplémentaire. `ChildPhotosSection` reste dessous pour upload/gestion. Les deux partagent le même `photos` state + `loadChild` refresh.

### Aucun nouveau composant complexe

Cette story ne crée pas de nouveau composant — elle réorganise et étend `page.tsx` existant. Les composants sub (`SectionHeader`, `InfoRow`, `EditRow`, etc.) sont réutilisés.

### References

- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L1253-L1295] — heroCard actuelle
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L1310-L1335] — section Identité actuelle
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L1518-L1558] — Parcours football actuel
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L1186-L1192] — saveIdentite actuel
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L1147-L1152] — startEdit / draft spread
- [Source: aureak/apps/web/app/(admin)/children/[childId]/page.tsx#L56-L58] — type EditSection
- [Source: Story 18-5] — formatNomPrenom, ChildDirectoryEntry.nom/prenom
- [Source: MEMORY.md#Design System v2] — colors.light.*, shadows, radius

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- T1: Migration 00075 (pas 00071 — conflit de numérotation) — email + tel ajoutés à child_directory, appliquée via supabase db push ✅
- T2: ChildDirectoryEntry + UpdateChildDirectoryParams + toEntry mapper + updateChildDirectoryEntry — tous mis à jour ✅
- T3: heroCard redesigné — photo 120px circulaire (img web natif ou fallback initiales gold), NOM Prénom h2 gold, club caption, AcademyStatusHeader, toggle actif en haut droite. Styles heroPicFallback + heroInitials ajoutés ✅
- T4: Section Identité — read mode: Nom/Prénom/DOB/Email/Téléphone séparés + Nom complet Notion si nom||prenom null. Edit mode: EditRow pour chaque champ. saveIdentite étendu avec email + tel ✅
- T5: Sections réordonnées — Photos → [A] Identité → [B] Historique → [C] Club → [D] Parcours → [E] Blessures → [F] Adresse → [G] P1 → [H] P2 → [I] Notes → Métadonnées ✅
- T6: toEntry mapper gère email/tel depuis migration 00075 ✅
- TS pré-existantes conservées : TS2578 (JSX @ts-expect-error), TS2698 (spread shadows.sm dans StyleSheet) — non introduites par cette story

### Code Review Fixes (post-review)

- H1: `supabase/migrations/00075_themes_position_index.sql` renommé en `00077_themes_position_index.sql` — doublon préfixe 00075 résolu
- M1: Edit mode Identité — ajout InfoRow read-only `displayName` (label "Nom complet (Notion)", italic muted) avant EditActions
- M2: Commentaire `@next/next/no-img-element` → `// web-only — Expo Router admin`
- L1: `entities.ts` — commentaires `migration 00072` → `migration 00073` pour nom/prenom
- L2: `saveIdentite` — suppression de `displayName` (non modifiable depuis ce formulaire, toujours redondant)

### Code Review Fixes (2nd pass)

- CR-M1: `children/index.tsx` ajouté à la File List — JoueurCard layout changé horizontal→vertical (photo en haut, infos dessous), PhotoAvatar étendu avec initiales nom/prenom, `formatNomPrenom` intégré, skeleton mis à jour en conséquence

### File List

- `supabase/migrations/00075_child_directory_email_tel_joueur.sql` — nouveau
- `aureak/packages/types/src/entities.ts` — +email, +tel dans ChildDirectoryEntry
- `aureak/packages/api-client/src/admin/child-directory.ts` — getChildDirectoryEntry, UpdateChildDirectoryParams mis à jour
- `aureak/apps/web/app/(admin)/children/[childId]/page.tsx` — refonte hero + section Identité + réordonnancement sections
- `aureak/apps/web/app/(admin)/children/index.tsx` — JoueurCard layout horizontal→vertical, PhotoAvatar avec initiales nom/prenom, formatNomPrenom intégré, skeleton mis à jour
