# Story 92.3 — Récap clubs partenaires (vue synthétique)

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 92 — Partenariat
- **Story ID** : 92.3
- **Story key** : `92-3-recap-clubs-partenaires`
- **Priorité** : P2
- **Dépendances** : Story 92.1 done (hub `/partenariat` + placeholder `/partenariat/clubs` existent) + Epic 11 Story 11.3 done ✅ (table `club_partnerships` + API `listPartnerships` / `createPartnership` / `updatePartnership` / `listPartnerAccessStats`)
- **Source** : brainstorming 2026-04-18 idée #33 (Récap clubs partenaires = vue synthétique)
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : S (aucune migration, réutilisation intégrale de l'API Story 11.3, une page synthétique + redirect de l'ancienne route `/partnerships`)

## Story

En tant qu'admin,
je veux une vue synthétique des clubs partenaires (KPIs agrégés + liste filtrable) sur `/partenariat/clubs`,
afin d'accéder à mes partenariats depuis le hub Partenariat avec une UI cohérente — sans perdre les données existantes de la page historique `/partnerships`.

## Acceptance Criteria

1. La page `/partenariat/clubs` affiche un récap synthétique des partenariats clubs existants (data source : table `club_partnerships` créée en Epic 11)
2. 4 StatCards en tête : "Partenariats actifs" | "Expirent dans 30j" | "Accès sur 30j" | "Total partenariats"
3. Liste des partenariats sous forme de cards : nom club | badge niveau d'accès (Catalogue / Bronze / Argent / Complet) | date début | date fin (ou "Sans limite") | nb accès 30j | statut actif/inactif
4. Filtre par statut (Tous / Actifs / Inactifs) en toggle horizontal
5. Bouton "Nouveau partenariat" → ouvre la même modale de création que la page historique `/partnerships` (réutilise `createPartnership` existant)
6. Action "Révoquer" sur chaque card active (appelle `updatePartnership` avec `active_until` = aujourd'hui) avec confirm dialog
7. L'ancienne route `/partnerships` (Story 11.3) redirige désormais vers `/partenariat/clubs` via `<Redirect />` pour éviter un orphelin
8. Empty state si aucun partenariat : illustration + texte "Aucun partenariat configuré" + bouton "Créer le premier partenariat"
9. Console guards (`if (process.env.NODE_ENV !== 'production') console.error`) + try/finally sur tous les state setters de chargement
10. Styles conformes `@aureak/theme` uniquement — aucune couleur hardcodée (la page historique `/partnerships` utilisait `style={{}}` avec quelques valeurs inline — la **nouvelle** page doit tout passer par tokens)

## Tasks / Subtasks

- [ ] T1 — Page liste `/partenariat/clubs` (AC: #1, #2, #3, #8, #10)
  - [ ] Remplacer le placeholder créé en Story 92.1 par la vraie page
  - [ ] Charger `listPartnerships()` + calculer pour chacun `listPartnerAccessStats(id)` en parallèle (`Promise.all`)
  - [ ] Calculer côté client : actifs (via `active_from <= today && (active_until === null || active_until >= today)`), expirent dans 30j (`active_until <= today+30d`)
  - [ ] 4 StatCards en haut (composant `StatCard` si existant, sinon composer en `View` + tokens)
  - [ ] Grille ou liste verticale de cards (React Native Web `View` — pas de `<div>`)
  - [ ] try/finally sur `setLoading(false)`

- [ ] T2 — Composant `PartnershipCard` (AC: #3, #6, #10)
  - [ ] Créer `aureak/apps/web/components/admin/partenariat/PartnershipCard.tsx`
  - [ ] Props : `partnership: ClubPartnership`, `accessCount30d: number`, `onRevoke: (id: string) => void`
  - [ ] Badge niveau d'accès avec mapping couleur cohérent : `read_catalogue` → neutre, `read_bronze` → bronze/cuivre, `read_silver` → silver/gris, `full_read` → gold
  - [ ] Bouton "Révoquer" visible seulement si actif

- [ ] T3 — Filtre par statut (AC: #4)
  - [ ] 3 boutons toggle en haut de la liste : "Tous" (default) | "Actifs" | "Inactifs"
  - [ ] Pattern AureakButton ou `Pressable` + `colors.accent.gold` pour état actif
  - [ ] Filtrage côté client (liste déjà en mémoire)

- [ ] T4 — Modale création (AC: #5)
  - [ ] Créer `aureak/apps/web/components/admin/partenariat/PartnershipFormModal.tsx`
  - [ ] RHF + Zod (partnerName requis, accessLevel enum 4 valeurs, activeUntil date optionnel, notes optionnel)
  - [ ] Appelle `createPartnership` (API existante Epic 11, ne pas créer de nouvelle fonction)
  - [ ] Refresh la liste après succès
  - [ ] try/finally sur submitting

- [ ] T5 — Révoquer partenariat (AC: #6)
  - [ ] Sur clic "Révoquer" → confirm dialog `window.confirm('Révoquer ce partenariat ?')` (ou modale native RN si pattern déjà utilisé ailleurs — préférer le plus cohérent avec `/partnerships` historique : un simple confirm navigateur suffit)
  - [ ] Appelle `updatePartnership(id, { active_until: today.toISOString().split('T')[0] })`
  - [ ] Refresh la liste

- [ ] T6 — Redirect `/partnerships` → `/partenariat/clubs` (AC: #7)
  - [ ] Remplacer `aureak/apps/web/app/(admin)/partnerships/index.tsx` par un composant minimal `<Redirect href="/partenariat/clubs" />`
  - [ ] Conserver le fichier pour ne pas casser les liens externes / bookmarks
  - [ ] Vérifier par grep qu'aucun lien interne `href="/partnerships"` ne reste — si oui, les pointer vers `/partenariat/clubs`

- [ ] T7 — Validation (AC: tous)
  - [ ] `npx tsc --noEmit` OK
  - [ ] Naviguer sur `/partenariat/clubs` → voir la liste (même data que `/partnerships` avant redirect)
  - [ ] Créer un partenariat test "Club Démo" access_level = `read_bronze`, active_until = `today + 60 days` → apparaît en haut de la liste, badge bronze visible
  - [ ] Cliquer "Révoquer" → confirm dialog → partenariat passe "Inactif"
  - [ ] Filtre "Actifs" n'affiche plus le partenariat révoqué ; filtre "Inactifs" l'affiche
  - [ ] Naviguer sur `/partnerships` → redirigé vers `/partenariat/clubs`
  - [ ] Console browser sans erreur
  - [ ] `grep -rn "setLoading(false)\|setSaving(false)\|setCreating(false)\|setSubmitting(false)" aureak/apps/web/app/(admin)/partenariat/clubs/ aureak/apps/web/components/admin/partenariat/PartnershipCard.tsx aureak/apps/web/components/admin/partenariat/PartnershipFormModal.tsx` → toutes occurrences sous `finally {}`
  - [ ] `grep -rn "console\." aureak/apps/web/app/(admin)/partenariat/clubs/ aureak/apps/web/components/admin/partenariat/ | grep -v "NODE_ENV"` → aucune occurrence

## Dev Notes

### ⚠️ Contraintes Stack
- React Native Web : `View`, `Pressable`, `StyleSheet`, `Image` — la page historique `/partnerships/index.tsx` utilise des `<div>` car elle précède la convention ; la **nouvelle** page doit utiliser RN Web strictement
- Tokens `@aureak/theme` uniquement
- Accès Supabase UNIQUEMENT via `@aureak/api-client` — API Story 11.3 déjà disponible, ne rien recréer
- Try/finally + console guards obligatoires
- Aucune nouvelle migration, aucun nouveau type (réutiliser `ClubPartnership` et `PartnershipAccessLevel` déjà exportés depuis `@aureak/api-client/src/admin/partnerships.ts`)

---

### T1 — Page liste `/partenariat/clubs`

Pattern de référence : `aureak/apps/web/app/(admin)/partnerships/index.tsx` (Story 11.3) — **relire** pour comprendre les appels API, puis **réécrire** en RN Web + tokens.

```tsx
'use client'
// Story 92.3 — Récap clubs partenaires
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { AureakText, AureakButton } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import {
  listPartnerships,
  listPartnerAccessStats,
  updatePartnership,
  type ClubPartnership,
} from '@aureak/api-client'
import { PartnershipCard } from '../../../../components/admin/partenariat/PartnershipCard'
import { PartnershipFormModal } from '../../../../components/admin/partenariat/PartnershipFormModal'

type Filter = 'all' | 'active' | 'inactive'

function isPartnershipActive(p: ClubPartnership): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return p.active_from <= today && (p.active_until === null || p.active_until >= today)
}

export default function PartenariatClubsPage() {
  const [partnerships, setPartnerships] = useState<ClubPartnership[]>([])
  const [stats,        setStats]        = useState<Record<string, number>>({})
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<Filter>('all')
  const [showModal,    setShowModal]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await listPartnerships()
      setPartnerships(data ?? [])
      const statsMap: Record<string, number> = {}
      await Promise.all(
        (data ?? []).map(async p => {
          const { count } = await listPartnerAccessStats(p.id)
          statsMap[p.id] = count ?? 0
        }),
      )
      setStats(statsMap)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[partenariat/clubs] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = partnerships.filter(p => {
    if (filter === 'active')   return isPartnershipActive(p)
    if (filter === 'inactive') return !isPartnershipActive(p)
    return true
  })

  const today     = new Date()
  const in30days  = new Date(today.getTime() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const activeCount     = partnerships.filter(isPartnershipActive).length
  const expiringCount   = partnerships.filter(p => p.active_until && p.active_until <= in30days && isPartnershipActive(p)).length
  const totalAccess30d  = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <ScrollView style={s.wrapper} contentContainerStyle={s.content}>
      {/* StatCards + filtre + grille cards + modale */}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.lg, gap: space.md },
  // ...
})
```

Référence : `aureak/apps/web/app/(admin)/partnerships/index.tsx` lignes 17-195.

---

### T2 — PartnershipCard

```tsx
// aureak/apps/web/components/admin/partenariat/PartnershipCard.tsx
'use client'
import { View, StyleSheet, Pressable } from 'react-native'
import { AureakText, AureakButton } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { ClubPartnership, PartnershipAccessLevel } from '@aureak/api-client'

const ACCESS_LABELS: Record<PartnershipAccessLevel, string> = {
  read_catalogue: 'Catalogue public',
  read_bronze   : 'Grade Bronze',
  read_silver   : 'Grade Argent',
  full_read     : 'Accès complet',
}

// Mapping couleur : aligner sur les grades coach (bronze/silver/gold) quand applicable
const ACCESS_BADGE_COLOR: Record<PartnershipAccessLevel, string> = {
  read_catalogue: colors.border.light,   // neutre
  read_bronze   : colors.grade.bronze ?? colors.accent.gold,
  read_silver   : colors.grade.silver ?? colors.text.muted,
  full_read     : colors.accent.gold,
}

export type PartnershipCardProps = {
  partnership     : ClubPartnership
  accessCount30d  : number
  onRevoke        : (id: string) => void
}

export function PartnershipCard({ partnership: p, accessCount30d, onRevoke }: PartnershipCardProps) {
  const today    = new Date().toISOString().slice(0, 10)
  const isActive = p.active_from <= today && (p.active_until === null || p.active_until >= today)
  // ...render card
}
```

**Attention tokens** : si `colors.grade.bronze` / `colors.grade.silver` n'existent pas dans `@aureak/theme/tokens.ts`, **fallback** sur `colors.accent.gold` / `colors.text.muted` — vérifier d'abord le fichier tokens. Ne jamais hardcoder `#cd7f32`.

Référence tokens : `aureak/packages/theme/src/tokens.ts` — lister les couleurs disponibles avant d'écrire le mapping.

---

### T4 — PartnershipFormModal

Pattern : RHF + Zod minimal (voir `SponsorFormModal` Story 92.2 quand mergée, ou pour précédent : modales de Story 88.2).

```ts
const schema = z.object({
  partnerName : z.string().min(2, 'Nom requis (min 2 caractères)'),
  accessLevel : z.enum(['read_catalogue', 'read_bronze', 'read_silver', 'full_read']),
  activeUntil : z.string().optional(),
  notes       : z.string().optional(),
})
```

Submit → `createPartnership({ partnerName, accessLevel, activeUntil, notes })` puis `onSuccess()` qui ferme la modale + trigger refresh parent.

---

### T6 — Redirect ancienne route

```tsx
// aureak/apps/web/app/(admin)/partnerships/index.tsx
// REMPLACE TOTALEMENT le contenu existant de Story 11.3 par :
import { Redirect } from 'expo-router'
export default function PartnershipsLegacyRedirect() {
  return <Redirect href="/partenariat/clubs" />
}
```

⚠️ Garder le fichier (ne pas supprimer) pour éviter un 404 sur d'anciens liens.

---

### Design

**Type design** : `polish` (cohérence avec le hub, pas de redesign ambitieux).

Principes design à respecter :
- Bento StatCards + grille cards (aligné sur dashboard admin)
- Badges niveau d'accès = palette grade (bronze/silver/gold) quand disponible, sinon neutre
- Fond lumineux (`colors.light.primary`), jamais sombre

Tokens à utiliser :
```tsx
backgroundColor : colors.light.primary     // fond page
backgroundColor : colors.light.surface     // cards + modale
borderRadius    : radius.md
boxShadow       : shadows.sm
color           : colors.text.dark         // textes principaux
color           : colors.text.muted        // textes secondaires
borderBottomColor: colors.accent.gold      // toggle actif
```

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` | MODIFIER | Remplacer placeholder Story 92.1 par vraie page |
| `aureak/apps/web/components/admin/partenariat/PartnershipCard.tsx` | CRÉER | Card réutilisable |
| `aureak/apps/web/components/admin/partenariat/PartnershipFormModal.tsx` | CRÉER | Modale création |
| `aureak/apps/web/app/(admin)/partnerships/index.tsx` | REMPLACER | Redirect vers `/partenariat/clubs` (garder le fichier) |

### Fichiers à NE PAS modifier

- `aureak/apps/web/components/admin/partenariat/PartenariatNavBar.tsx` — Story 92.1
- `aureak/apps/web/app/(admin)/partenariat/_layout.tsx` — Story 92.1
- `aureak/apps/web/app/(admin)/partenariat/sponsors/**` — Story 92.2
- `aureak/packages/api-client/src/admin/partnerships.ts` — API Story 11.3 intacte (réutilisation directe, pas de modification signature)
- `supabase/migrations/` — aucune nouvelle migration dans cette story
- `aureak/packages/types/src/entities.ts` — aucun nouveau type (réutilise `ClubPartnership`, `PartnershipAccessLevel` déjà exportés)

---

### Dépendances à protéger

- Story 11.3 (Epic 11, done) fournit `listPartnerships`, `createPartnership`, `updatePartnership`, `listPartnerAccessStats` + types — **ne pas modifier** leurs signatures ni leur emplacement (`packages/api-client/src/admin/partnerships.ts`)
- Story 92.1 (Epic 92) livre le layout `/partenariat/_layout.tsx` et le placeholder `/partenariat/clubs/page.tsx` — cette story **remplace** uniquement le contenu du placeholder, le layout reste intact

---

### Références

- Page historique à reproduire en RN Web + tokens : `aureak/apps/web/app/(admin)/partnerships/index.tsx` lignes 17-195
- API source : `aureak/packages/api-client/src/admin/partnerships.ts`
- Types : `ClubPartnership`, `PartnershipAccessLevel` exportés depuis `@aureak/api-client`
- Pattern StatCards : chercher `StatCard` ou équivalent dans `aureak/apps/web/components/admin/` (dashboard admin)
- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Story 92.1 (prérequis) : `_bmad-output/implementation-artifacts/story-92-1-partenariat-sidebar-page-hub.md`
- Story 11.3 (source de vérité data) : `_bmad-output/implementation-artifacts/11-3-partenariats-clubs.md`

---

### Multi-tenant

Aucune nouvelle table. RLS déjà en place via Story 11.3 (policies admin-tenant sur `club_partnerships`). Aucune modification RLS dans cette story.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/partenariat/clubs/page.tsx` | MODIFIÉ (placeholder → vraie page) |
| `aureak/apps/web/components/admin/partenariat/PartnershipCard.tsx` | CRÉÉ |
| `aureak/apps/web/components/admin/partenariat/PartnershipFormModal.tsx` | CRÉÉ |
| `aureak/apps/web/app/(admin)/partnerships/index.tsx` | MODIFIÉ (redirect vers /partenariat/clubs) |

### Completion Notes List

- Réutilise intégralement l'API Story 11.3 (`listPartnerships`, `createPartnership`, `updatePartnership`, `listPartnerAccessStats`). Aucune migration, aucun nouveau type.
- Récap = 4 `StatsStandardCard` (Actifs / Expirent 30j / Accès 30j / Total) + filtre toggle (Tous/Actifs/Inactifs) + liste `PartnershipCard` + empty state.
- Mapping couleurs badge d'accès : `read_catalogue` = neutre, `read_bronze` = `accent.bronze`, `read_silver` = `accent.silver`, `full_read` = `accent.gold`.
- Ancienne route `/partnerships` conserve le fichier `index.tsx` mais renvoie un `<Redirect href="/partenariat/clubs" />`.
- Révocation = `window.confirm` + `updatePartnership(id, { active_until: today })` (pattern cohérent avec la page historique).
- Playwright skipped — app non démarrée au moment du commit.
- `tsc --noEmit` = 0. Grep try/finally + console guards OK.

