# Story 72.4 : Évaluations — cercles notes K/C, avatars joueurs, stat cards Figma

Status: done

## Story

En tant qu'admin,
je veux que la page Évaluations affiche les notes K et C sous forme de cercles distinctifs gold/gris, les joueurs avec un avatar carré arrondi et nom lisible, et les 4 stat cards avec les bons labels et la card Top performer en sombre,
afin que l'interface corresponde exactement aux maquettes Figma validées.

## Acceptance Criteria

1. **Note K** (réceptivité) s'affiche dans un cercle 40×40px `borderRadius: 20`, bordure 2px `#c1ac5c` (gold), texte `#6e5d14` — Manrope Bold 14px.
2. **Note C** (gout d'effort) s'affiche dans un cercle 40×40px `borderRadius: 20`, bordure 1px `#cec6b4` (gris), texte `#1c1c17` — Manrope Bold 14px.
3. Les deux cercles remplacent les colonnes NOTE 1 / NOTE 2 actuelles dans le tableau `evalType === 'badges'`.
4. Les valeurs des cercles sont les scores 0-10 calculés via `signalToScore` (Note K = `signalToScore(row.receptivite)`, Note C = `signalToScore(row.goutEffort)`), affichés en entier (pas de décimales).
5. **Avatar joueur** : carré arrondi 40×40px `borderRadius: 12`, fond `colors.light.elevated` (`#f1ede5`), initiales centrées via `getInitials` si pas de photo — Manrope Bold 14px, couleur `colors.text.dark`. Remplace l'avatar cercle actuel (`borderRadius: 16`, fond `colors.accent.gold + '33'`).
6. **Nom joueur** : Manrope Bold 14px, `colors.text.dark`. Sous-titre "Groupe • Niveau" affiché si disponible, 10px `colors.text.muted`. Sinon, badge "⭐ Top séance" (comportement existant conservé).
7. **Stat card 1** : label "Note Moyenne", valeur `{avgDisplay}/10`, badge `+2.4%` statique en vert ou calculé si disponible, picto 📊.
8. **Stat card 2** : label "Évals ce mois", valeur `{evalsThisMonth}`, sans badge, picto 📋.
9. **Stat card 3** : label "Progression Technique", valeur `+15%` statique (pas de calcul requis), badge "Record" violet (`#7C3AED`), picto 📈, valeur en `colors.accent.goldSolid` (`#c1ac5c`).
10. **Stat card 4** : label "Top performer", valeur = nom du joueur avec la meilleure note moyenne (`stats.topName`), fond `#6e5d14` (dark gold), texte clair — même structure card sombre que le pattern existant mais avec `backgroundColor: '#6e5d14'` et `borderColor: '#6e5d14'`.
11. Zéro couleur hardcodée sauf les tokens non encore définis (`#c1ac5c`, `#cec6b4`, `#6e5d14`, `#1c1c17`, `#7C3AED`) — documenter chaque usage dans un commentaire inline.
12. Zéro régression : les filtres scope/temporels, la pagination, les onglets connaissances/compétences, le PlayerSummaryCard restent inchangés.

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` entièrement — comprendre les composants `PlayerAvatar`, `StatCard`, les colonnes NOTE 1 / NOTE 2
- [x] Ajouter le composant inline `NoteCircle` (voir snippet ci-dessous) après `SignalDot`
- [x] Modifier `PlayerAvatar` : passer de cercle `borderRadius: 16` / fond `colors.accent.gold+'33'` à carré arrondi `borderRadius: 12` / fond `colors.light.elevated` — taille 40×40px
- [x] Mettre à jour les styles `avatar` et `avatarText` dans `StyleSheet.create`
- [x] Dans la cellule joueur du tableau : ajouter le sous-titre "Groupe • Niveau" sous le nom (utiliser `row.groupName` si disponible, sinon omettre le sous-titre et conserver le badge topSeance)
- [x] Dans les colonnes NOTE 1 / NOTE 2 du tableau : remplacer le rendu `AureakText noteValue` par `<NoteCircle score={...} variant="K" />` et `<NoteCircle score={...} variant="C" />`
- [x] Note K = `signalToScore(row.receptivite)`, Note C = `signalToScore(row.goutEffort)` — valeurs entières
- [x] Mettre à jour les en-têtes de colonnes : "NOTE K" et "NOTE C" (au lieu de "NOTE 1" / "NOTE 2")
- [x] Modifier le rendu des 4 `StatCard` dans `statCardsRow` :
  - Card 1 : `icon="📊"` `label="Note Moyenne"` `value={stats ? \`${stats.avgDisplay}/10\` : '—'}` `badge="+2.4%"` `badgeColor={colors.status.success}`
  - Card 2 : `icon="📋"` `label="Évals ce mois"` `value={stats ? String(stats.evalsThisMonth) : '—'}` (sans badge)
  - Card 3 : `icon="📈"` `label="Progression Technique"` `value="+15%"` `badge="Record"` `badgeColor="#7C3AED"` `valueColor={colors.accent.gold}`
  - Card 4 : `icon="👤"` `label="Top performer"` `value={stats?.topName ?? '—'}` `dark` avec `backgroundColor: '#6e5d14'`
- [x] Étendre le composant `StatCard` pour accepter les props optionnelles `badge?: string`, `badgeColor?: string`, `valueColor?: string`
- [x] Mettre à jour le style `statCardDark` : `backgroundColor: '#6e5d14'` et `borderColor: '#6e5d14'`
- [x] QA scan : vérifier try/finally et console guards sur les fichiers modifiés
- [x] Vérifier TypeScript (`cd aureak && npx tsc --noEmit`)

## Snippets de référence

### Composant NoteCircle

```tsx
// Cercle distinctif pour Note K (gold) et Note C (gris)
// Couleurs non tokénisées documentées ici en attendant extension de @aureak/theme
function NoteCircle({ score, variant }: { score: number; variant: 'K' | 'C' }) {
  const isK = variant === 'K'
  return (
    <View style={{
      width          : 40,
      height         : 40,
      borderRadius   : 20,
      borderWidth    : isK ? 2 : 1,
      borderColor    : isK ? '#c1ac5c' : '#cec6b4', // gold / gris — tokens à créer en story DS
      justifyContent : 'center',
      alignItems     : 'center',
      backgroundColor: 'transparent',
    }}>
      <AureakText style={{
        fontFamily: 'Manrope',
        fontSize  : 14,
        fontWeight: '700',
        color     : isK ? '#6e5d14' : '#1c1c17', // gold dark / text dark
        lineHeight: 18,
      }}>
        {Math.round(score)}
      </AureakText>
    </View>
  )
}
```

### Composant PlayerAvatar inline mis à jour

```tsx
// Avatar carré arrondi Figma — 40×40 borderRadius:12, fond elevated, initiales
function PlayerAvatar({ name }: { name: string | null }) {
  return (
    <View style={styles.avatar}>
      <AureakText style={styles.avatarText}>{getInitials(name)}</AureakText>
    </View>
  )
}

// Styles correspondants dans StyleSheet.create :
// avatar: {
//   width          : 40,
//   height         : 40,
//   borderRadius   : 12,
//   backgroundColor: colors.light.elevated,  // #f1ede5
//   justifyContent : 'center',
//   alignItems     : 'center',
//   flexShrink     : 0,
// },
// avatarText: {
//   fontFamily: 'Manrope',
//   fontSize  : 14,
//   fontWeight: '700',
//   color     : colors.text.dark,
// },
```

### Layout stat cards Figma (4 cards)

```tsx
<View style={styles.statCardsRow}>
  {/* Card 1 — Note Moyenne */}
  <StatCard
    icon="📊"
    label="Note Moyenne"
    value={stats ? `${stats.avgDisplay}/10` : '—'}
    badge="+2.4%"
    badgeColor={colors.status.success}
  />
  {/* Card 2 — Évals ce mois */}
  <StatCard
    icon="📋"
    label="Évals ce mois"
    value={stats ? String(stats.evalsThisMonth) : '—'}
  />
  {/* Card 3 — Progression Technique (+15% statique, badge Record violet) */}
  <StatCard
    icon="📈"
    label="Progression Technique"
    value="+15%"
    badge="Record"
    badgeColor="#7C3AED"         // violet — token à créer story DS
    valueColor={colors.accent.goldSolid}
  />
  {/* Card 4 — Top performer — fond gold dark #6e5d14 */}
  <StatCard
    icon="👤"
    label="Top performer"
    value={stats?.topName ? truncate(stats.topName, 14) : '—'}
    dark
  />
</View>

// Extension StatCard pour badge + valueColor :
// function StatCard({
//   label, value, sub, icon, dark, badge, badgeColor, valueColor,
// }: {
//   label: string; value: string; sub?: string; icon?: string; dark?: boolean;
//   badge?: string; badgeColor?: string; valueColor?: string;
// }) {
//   ...
//   {badge ? (
//     <View style={{ ...styles.statBadge, backgroundColor: badgeColor ?? colors.status.success }}>
//       <AureakText style={styles.statBadgeText}>{badge}</AureakText>
//     </View>
//   ) : null}
//   ...
// }
//
// styles.statBadge: {
//   alignSelf     : 'flex-start',
//   paddingHorizontal: 6,
//   paddingVertical  : 2,
//   borderRadius     : 4,
//   marginTop        : 4,
// }
// styles.statBadgeText: {
//   fontFamily: fonts.body,
//   fontSize  : 10,
//   fontWeight: '700',
//   color     : colors.text.primary,
// }
//
// statCardDark: { backgroundColor: '#6e5d14', borderColor: '#6e5d14' }
```

## Files

- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (modifier — seul fichier concerné)

## Dependencies

- `colors.light.elevated` ✅ déjà dans `@aureak/theme/tokens.ts`
- `colors.accent.goldSolid` ✅ déjà dans `@aureak/theme/tokens.ts`
- `colors.status.success` ✅ déjà dans `@aureak/theme/tokens.ts`
- `signalToScore`, `computeScore`, `noteColor`, `getInitials` ✅ déjà définis dans le fichier cible
- `AdminEvalRow` ✅ importé depuis `@aureak/api-client`
- Pas de migration DB requise
- Pas de changement API requis
