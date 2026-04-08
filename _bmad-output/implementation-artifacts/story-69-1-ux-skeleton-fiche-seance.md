# Story 69.1 : UX — Skeleton loading fiche séance

Status: done

## Story
En tant qu'admin, je veux que la fiche séance affiche un skeleton pendant le chargement (au lieu d'un texte "Chargement…"), afin d'avoir une expérience visuelle premium cohérente avec le reste de l'app.

## Acceptance Criteria
1. Pendant le chargement (`loading === true`), afficher un `SessionDetailSkeleton` composé de : un bloc header 80px (fond `colors.light.muted`, radius `radius.card`), 3 blocs KPI en ligne (60px chacun), un bloc liste 200px — le tout dans `colors.light.muted` avec opacity 0.6
2. Le texte "Chargement…" actuel est remplacé par ce skeleton
3. Aucune régression sur l'affichage normal (données chargées)
4. Fond page reste `colors.light.primary`

## Tasks
- [ ] T1 — Dans `seances/[sessionId]/page.tsx`, localiser le bloc `{loading && <AureakText>Chargement…</AureakText>}`
- [ ] T2 — Créer le composant inline `SessionDetailSkeleton` (View + StyleSheet, même fichier)
- [ ] T3 — Remplacer le texte loading par `<SessionDetailSkeleton />`
- [ ] T4 — Vérifier : naviguer `/seances/[sessionId]` → skeleton visible → données chargées normalement

## Dev Notes
React Native Web — utiliser View + StyleSheet + colors tokens uniquement. Pattern skeleton = `backgroundColor: colors.light.muted, opacity: 0.6, borderRadius: radius.card`.

Le fichier page.tsx importe déjà `colors`, `space`, `shadows`, `radius` depuis `@aureak/theme` — pas de nouvel import nécessaire.

Exemple de structure `SessionDetailSkeleton` :
```tsx
function SessionDetailSkeleton() {
  return (
    <View style={{ padding: space.xl, gap: space.md }}>
      {/* Bloc header */}
      <View style={{ height: 80, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
      {/* Blocs KPI en ligne */}
      <View style={{ flexDirection: 'row', gap: space.md }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flex: 1, height: 60, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
        ))}
      </View>
      {/* Bloc liste */}
      <View style={{ height: 200, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
    </View>
  )
}
```

Fichiers : `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` (modifier)

## Dev Agent Record
### Agent Model Used
### File List
| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/seances/[sessionId]/page.tsx` | À modifier |
