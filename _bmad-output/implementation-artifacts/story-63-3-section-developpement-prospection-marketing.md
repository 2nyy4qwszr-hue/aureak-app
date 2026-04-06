# Story 63.3 : Section Développement — hub Prospection / Marketing / Partenariats

Status: done

Epic: 63 — Navigation refactoring orientée usage

## Story

En tant qu'admin Aureak,
je veux une section "Développement" dans la sidebar avec des pages dédiées à la croissance de l'académie (Prospection, Marketing, Partenariats),
afin de centraliser le suivi des activités de développement commercial sans sortir de l'application.

## Acceptance Criteria

1. La route `/developpement` affiche un hub avec 3 cartes cliquables : Prospection, Marketing, Partenariats — chacune avec une icône, un titre, une description courte et un lien vers sa sous-page.
2. `/developpement/prospection` affiche une page avec : header titre + sous-titre, une zone "KPIs à venir" avec 3 placeholders (Contacts prospectés / Rendez-vous planifiés / Taux de conversion), et une note "Fonctionnalité en développement — disponible prochainement".
3. `/developpement/marketing` affiche une page similaire avec placeholders : Campagnes actives / Inscriptions depuis campagnes / Reach total.
4. `/developpement/partenariats` affiche une page avec placeholders : Partenariats actifs / Clubs partenaires / Valeur totale partenariats.
5. Chaque page stub affiche un design premium cohérent avec le reste de l'app (fond `colors.light.primary`, cards `colors.light.surface`, accents `colors.gold`).
6. Les pages sont accessibles depuis la sidebar "Développement" (sous-items Prospection / Marketing / Partenariats) mise en place en story 63.1.
7. Aucune migration SQL n'est nécessaire — les pages sont purement frontend avec données statiques.
8. `npx tsc --noEmit` retourne 0 erreur.

## Tasks / Subtasks

- [x] T1 — Hub `/developpement` (AC: 1, 5)
  - [x] T1.1 — Créer `aureak/apps/web/app/(admin)/developpement/page.tsx` (hub avec 3 DevCard)
  - [x] T1.2 — Créer `aureak/apps/web/app/(admin)/developpement/index.tsx` (re-export)
  - [x] T1.3 — Implémenter le composant `DevSectionCard` local : icône + titre + description + lien "Voir →"

- [x] T2 — Page Prospection (AC: 2, 5)
  - [x] T2.1 — Créer `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx`
  - [x] T2.2 — Créer `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx`
  - [x] T2.3 — 3 KPI placeholders : Contacts prospectés / Rendez-vous planifiés / Taux de conversion (valeurs `—`)
  - [x] T2.4 — Banner "Fonctionnalité en développement" avec style info (or/beige)

- [x] T3 — Page Marketing (AC: 3, 5)
  - [x] T3.1 — Créer `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx`
  - [x] T3.2 — Créer `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx`
  - [x] T3.3 — 3 KPI placeholders : Campagnes actives / Inscriptions depuis campagnes / Reach total

- [x] T4 — Page Partenariats (AC: 4, 5)
  - [x] T4.1 — Créer `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx`
  - [x] T4.2 — Créer `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx`
  - [x] T4.3 — 3 KPI placeholders : Partenariats actifs / Clubs partenaires / Valeur totale

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Naviguer vers `/developpement` → 3 cards visibles avec liens fonctionnels
  - [x] T5.2 — Clic "Prospection" → `/developpement/prospection` chargée sans erreur
  - [x] T5.3 — Sidebar → "Développement" → sous-items cliquables et navigables
  - [x] T5.4 — `npx tsc --noEmit` → 0 erreur

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Text)
- **Tokens `@aureak/theme`** uniquement — zéro couleur hardcodée
- **Routing Expo Router** : `page.tsx` = contenu, `index.tsx` = re-export
- **Aucune dépendance Supabase** sur cette story (pages statiques)

---

### T1 — Hub page pattern

```tsx
// aureak/apps/web/app/(admin)/developpement/page.tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space, radius, shadows } from '@aureak/theme'

const SECTIONS = [
  {
    href       : '/developpement/prospection',
    icon       : '🎯',
    title      : 'Prospection',
    description: 'Suivez vos contacts, rendez-vous et taux de conversion pour développer l\'académie.',
  },
  {
    href       : '/developpement/marketing',
    icon       : '📣',
    title      : 'Marketing',
    description: 'Campagnes, inscriptions et portée de vos actions de communication.',
  },
  {
    href       : '/developpement/partenariats',
    icon       : '🤝',
    title      : 'Partenariats',
    description: 'Clubs partenaires, conventions et valeur des collaborations actives.',
  },
]

export default function DeveloppementPage() {
  const router = useRouter()
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Développement</Text>
        <Text style={styles.sub}>Croissance et rayonnement de l'académie Aureak</Text>
      </View>
      <View style={styles.grid}>
        {SECTIONS.map(s => (
          <Pressable
            key={s.href}
            onPress={() => router.push(s.href as any)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.cardIcon}>{s.icon}</Text>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardDesc}>{s.description}</Text>
            <Text style={styles.cardLink}>Voir →</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary, padding: space[6] },
  header    : { marginBottom: space[8] },
  title     : { fontSize: 28, fontWeight: '900', color: colors.text.primary, marginBottom: space[2] },
  sub       : { fontSize: 15, color: colors.text.muted },
  grid      : { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  card      : {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.lg,
    padding         : space[6],
    minWidth        : 240,
    flex            : 1,
    maxWidth        : 360,
    ...shadows.sm,
  },
  cardIcon  : { fontSize: 36, marginBottom: space[3] },
  cardTitle : { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: space[2] },
  cardDesc  : { fontSize: 13, color: colors.text.muted, lineHeight: 20, marginBottom: space[4] },
  cardLink  : { fontSize: 13, fontWeight: '700', color: colors.gold },
})
```

---

### T2/T3/T4 — Pattern page stub KPIs

```tsx
// aureak/apps/web/app/(admin)/developpement/prospection/page.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, space, radius, shadows } from '@aureak/theme'

const KPI_ITEMS = [
  { label: 'Contacts prospectés',   value: '—' },
  { label: 'Rendez-vous planifiés', value: '—' },
  { label: 'Taux de conversion',    value: '—' },
]

export default function ProspectionPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prospection</Text>
      <Text style={styles.sub}>Suivi des contacts et opportunités de développement</Text>

      {/* Banner "bientôt disponible" */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          🚀 Cette section est en cours de développement. Les fonctionnalités complètes arrivent prochainement.
        </Text>
      </View>

      {/* KPIs placeholder */}
      <View style={styles.kpiRow}>
        {KPI_ITEMS.map(k => (
          <View key={k.label} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{k.value}</Text>
            <Text style={styles.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary, padding: space[6] },
  title     : { fontSize: 24, fontWeight: '900', color: colors.text.primary, marginBottom: space[1] },
  sub       : { fontSize: 14, color: colors.text.muted, marginBottom: space[6] },
  banner    : {
    backgroundColor : 'rgba(201,168,76,0.10)',
    borderWidth     : 1,
    borderColor     : 'rgba(201,168,76,0.25)',
    borderRadius    : radius.md,
    padding         : space[4],
    marginBottom    : space[6],
  },
  bannerText: { fontSize: 13, color: colors.gold, lineHeight: 20 },
  kpiRow    : { flexDirection: 'row', gap: space[4], flexWrap: 'wrap' },
  kpiCard   : {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.lg,
    padding         : space[5],
    minWidth        : 160,
    alignItems      : 'center',
    ...shadows.sm,
  },
  kpiValue  : { fontSize: 32, fontWeight: '900', color: colors.text.subtle, marginBottom: space[2] },
  kpiLabel  : { fontSize: 12, color: colors.text.muted, textAlign: 'center' },
})
```

Utiliser le même pattern pour `marketing/page.tsx` et `partenariats/page.tsx` en changeant `KPI_ITEMS` et les textes.

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/developpement/page.tsx` | Créer | Hub 3 sections |
| `aureak/apps/web/app/(admin)/developpement/index.tsx` | Créer | Re-export |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Créer | Stub KPIs |
| `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx` | Créer | Re-export |
| `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` | Créer | Stub KPIs |
| `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` | Créer | Re-export |
| `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` | Créer | Stub KPIs |
| `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx` | Créer | Re-export |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/_layout.tsx` — déjà mis à jour en story 63.1
- `supabase/migrations/` — aucune migration nécessaire
- `@aureak/api-client` — aucun appel Supabase sur cette story

---

### Dépendances prérequises

- Story 63.1 doit être `done` (sidebar "Développement" avec sous-items)

---

### Multi-tenant

Pas de logique tenant — pages statiques.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — implémentation sans erreur, `npx tsc --noEmit` → 0 erreur.

### Completion Notes List

- Stubs 63.1 remplacés par implémentation premium complète sur les 4 pages
- `space` keys nommées (xs/sm/md/lg/xl) conformes aux tokens — zéro index numérique
- `shadows.sm` utilisé via `boxShadow` (web string) avec `@ts-ignore` approprié
- `radius.card` (16) et `radius.cardLg` (24) utilisés — `radius.md`/`radius.lg` absents des tokens
- `colors.text.dark` (#18181B) utilisé pour texte sur fond clair (et non `colors.text.primary` = blanc)
- `colors.accent.gold` utilisé (et non `colors.gold` qui n'existe pas)
- QA clean : zéro console non-guardé, zéro state setter sans finally, pages statiques

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/developpement/page.tsx` | Modifié — hub 3 DevSectionCard |
| `aureak/apps/web/app/(admin)/developpement/index.tsx` | Existant — inchangé |
| `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` | Modifié — KPIs + banner premium |
| `aureak/apps/web/app/(admin)/developpement/prospection/index.tsx` | Existant — inchangé |
| `aureak/apps/web/app/(admin)/developpement/marketing/page.tsx` | Modifié — KPIs + banner premium |
| `aureak/apps/web/app/(admin)/developpement/marketing/index.tsx` | Existant — inchangé |
| `aureak/apps/web/app/(admin)/developpement/partenariats/page.tsx` | Modifié — KPIs + banner premium |
| `aureak/apps/web/app/(admin)/developpement/partenariats/index.tsx` | Existant — inchangé |
