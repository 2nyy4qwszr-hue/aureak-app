# Story 35-1 — Empty states: listes principales

**Epic:** 35
**Status:** ready-for-dev
**Priority:** medium

## Story
En tant qu'admin, je veux voir un message clair quand une liste filtrée retourne zéro résultats afin de comprendre que la liste est vide (et non en cours de chargement) et d'avoir un appel à l'action contextuel.

## Acceptance Criteria
- [ ] AC1: Un composant `EmptyState` existe dans `@aureak/ui` avec les props : `icon?: string`, `title: string`, `subtitle?: string`, `ctaLabel?: string`, `onCta?: () => void`
- [ ] AC2: `EmptyState` est exporté depuis `aureak/packages/ui/src/index.ts`
- [ ] AC3: Dans `children/index.tsx`, quand `!loading && joueurs.length === 0`, afficher `<EmptyState title="Aucun joueur trouvé" subtitle="Modifiez vos filtres ou ajoutez un joueur" ctaLabel="Réinitialiser les filtres" onCta={handleResetFilters} />`
- [ ] AC4: Dans `clubs/page.tsx`, quand `!loading && clubs.length === 0`, afficher `<EmptyState title="Aucun club trouvé" subtitle="Modifiez vos filtres ou créez un club" ctaLabel="Nouveau club" onCta={() => router.push('/clubs/new')} />`
- [ ] AC5: Dans `groups/index.tsx` (si existant), quand `!loading && groups.length === 0`, afficher `<EmptyState title="Aucun groupe" subtitle="Créez un groupe pour commencer" ctaLabel="Nouveau groupe" onCta={() => router.push('/groups/new')} />`
- [ ] AC6: L'`EmptyState` n'est JAMAIS affiché pendant le chargement (condition `!loading` stricte)
- [ ] AC7: Le style d'`EmptyState` respecte les tokens theme : fond `colors.light.surface`, texte `colors.text.muted`, bouton CTA style `Button variant="secondary"`

## Tasks
- [ ] Créer `aureak/packages/ui/src/components/EmptyState.tsx` avec les props définies
- [ ] Styler le composant : icône centrée (texte ou emoji si `icon` fourni), titre en `AureakText` bold, subtitle en `AureakText` muted, bouton CTA conditionnel
- [ ] Exporter `EmptyState` depuis `aureak/packages/ui/src/index.ts`
- [ ] Lire `aureak/apps/web/app/(admin)/children/index.tsx` pour identifier l'emplacement de rendu de liste et la condition `loading`
- [ ] Intégrer `EmptyState` dans `children/index.tsx` avec les props appropriées
- [ ] Lire `aureak/apps/web/app/(admin)/clubs/page.tsx` et intégrer `EmptyState`
- [ ] Vérifier si `aureak/apps/web/app/(admin)/groups/index.tsx` existe et intégrer si présent
- [ ] QA: tester en vidant les filtres quand aucun résultat n'existe — vérifier que EmptyState s'affiche bien après chargement terminé

## Dev Notes
- Fichiers à modifier: `aureak/packages/ui/src/components/EmptyState.tsx` (nouveau), `aureak/packages/ui/src/index.ts`, `aureak/apps/web/app/(admin)/children/index.tsx`, `aureak/apps/web/app/(admin)/clubs/page.tsx`
- Tokens à utiliser: `colors.light.surface`, `colors.text.muted`, `colors.text.subtle`, `space.xl`, `space.lg`, `radius.md`
- Structure du composant:
  ```typescript
  import React from 'react'
  import { View, StyleSheet, Pressable } from 'react-native'
  import { AureakText } from '../AureakText'
  import { colors, space, radius } from '@aureak/theme'

  interface EmptyStateProps {
    icon?: string
    title: string
    subtitle?: string
    ctaLabel?: string
    onCta?: () => void
  }

  export function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
    return (
      <View style={styles.container}>
        {icon && <AureakText style={styles.icon}>{icon}</AureakText>}
        <AureakText style={styles.title}>{title}</AureakText>
        {subtitle && <AureakText style={styles.subtitle}>{subtitle}</AureakText>}
        {ctaLabel && onCta && (
          <Pressable onPress={onCta} style={styles.cta}>
            <AureakText style={styles.ctaText}>{ctaLabel}</AureakText>
          </Pressable>
        )}
      </View>
    )
  }
  ```
- Pas de migration DB nécessaire
- Ne pas afficher EmptyState si `loading === true` — condition stricte requise
- Pattern Expo Router : `router.push` pour navigation vers création
