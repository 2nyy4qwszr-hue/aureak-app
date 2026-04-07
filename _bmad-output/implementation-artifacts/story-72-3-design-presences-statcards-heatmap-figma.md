# Story 72.3 : Présences — Alignement Figma stat cards + cellules heatmap

Status: done

## Story

En tant qu'admin,
je veux que les 4 stat cards de l'onglet Présences et les cellules de la grille heatmap correspondent exactement à la maquette Figma,
afin d'avoir une interface cohérente avec le design system validé.

## Acceptance Criteria

1. **Card 1 — MOYENNE GÉNÉRALE** : picto 📊, label "MOYENNE GÉNÉRALE", valeur `{avgRate}%`, aucun badge, fond blanc, valeur couleur `colors.text.dark`, barre de progression or en dessous
2. **Card 2 — GROUPES SOUS 70%** : picto 📉, label "GROUPES SOUS 70%", valeur `{groupsUnder70}` (nombre entier), aucun badge ni alerte visuelle, fond blanc, valeur couleur `colors.text.dark`
3. **Card 3 — TOTAL SÉANCES** : picto 📅, label "TOTAL SÉANCES", valeur `{totalSessions}` en `colors.accent.goldSolid` (= `rgba(193,172,92,0.5)`), badge "+12%" → fond `rgba(110,93,20,0.05)` texte `colors.accent.goldLight`, fond blanc
4. **Card 4 — TENDANCE GLOBAL** : fond `#6e5d14`, icône flèche haut-droite (↗), label "TENDANCE GLOBAL" en `colors.accent.goldLight`, valeur `+{tendance}%` en blanc ou rouge selon signe
5. **Cellules heatmap** : taille 48×48px, borderRadius 8, couleurs selon seuils Figma — vert `#22c55e` si ≥90%, jaune `#eab308` si 70–89%, orange `#f97316` si 60–69%, rouge `#ef4444` si <60%, texte blanc `#ffffff`, fontFamily `Space Grotesk` (fallback `Montserrat`), fontWeight `700`, fontSize 12
6. La métrique GROUPES SOUS 70% est calculée côté client depuis `sessions` (via `groupMap`) — logique existante conservée, seul le rendu visuel change
7. Zéro migration, zéro changement API

## Technical Tasks

- [x] Lire `aureak/apps/web/app/(admin)/activites/presences/page.tsx` entièrement
- [x] Corriger le rendu JSX de `StatCardsPresences` : 4 cards selon spec Figma (voir snippet ci-dessous)
- [x] Corriger `getCellStyle` : nouveaux seuils et couleurs hex Figma (voir snippet ci-dessous)
- [x] Corriger les styles `cell` dans `tableStyles` : width 48, height 48, borderRadius 8
- [x] Supprimer le badge rouge "!" sur Card 2 — Figma ne l'a pas
- [x] Ajouter badge doré "+12%" sur Card 3 (valeur statique affichée telle quelle pour le moment — la tendance réelle sera calculée dans une story ultérieure)
- [x] QA scan : vérifier try/finally et console guards dans le fichier modifié
- [x] TypeScript `npx tsc --noEmit` — zéro erreur

## Snippets de référence

### `getCellStyle` corrigée

```typescript
function getCellStyle(rate: number): { bg: string; text: string } {
  if (rate >= 90) return { bg: '#22c55e', text: '#ffffff' }
  if (rate >= 70) return { bg: '#eab308', text: '#ffffff' }
  if (rate >= 60) return { bg: '#f97316', text: '#ffffff' }
  return               { bg: '#ef4444', text: '#ffffff' }
}
```

### Style `cell` corrigé dans `tableStyles`

```typescript
cell: {
  alignItems      : 'center',
  justifyContent  : 'center',
  width           : 48,
  height          : 48,
  borderRadius    : 8,
  marginHorizontal: 2,
},
```

### Section stat cards JSX corrigée (`StatCardsPresences`)

```tsx
return (
  <View style={cardStyles.row}>
    {/* Card 1 — Moyenne Générale */}
    <View style={[cardStyles.card, { flex: 1 }]}>
      <AureakText style={cardStyles.statIcon}>📊</AureakText>
      <AureakText style={cardStyles.cardLabel}>Moyenne Générale</AureakText>
      <AureakText style={cardStyles.cardStat}>{stats.avgRate}%</AureakText>
      <View style={cardStyles.progressTrack}>
        <View style={[cardStyles.progressFill, { width: `${Math.min(stats.avgRate, 100)}%` as unknown as number }]} />
      </View>
    </View>

    {/* Card 2 — Groupes sous 70% */}
    <View style={[cardStyles.card, { flex: 1 }]}>
      <AureakText style={cardStyles.statIcon}>📉</AureakText>
      <AureakText style={cardStyles.cardLabel}>Groupes sous 70%</AureakText>
      <AureakText style={cardStyles.cardStat}>{stats.groupsUnder70}</AureakText>
      <AureakText style={cardStyles.cardSub}>
        {stats.implantationsCount} groupe{stats.implantationsCount > 1 ? 's' : ''} suivis
      </AureakText>
    </View>

    {/* Card 3 — Total Séances */}
    <View style={[cardStyles.card, { flex: 1 }]}>
      <AureakText style={cardStyles.statIcon}>📅</AureakText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <AureakText style={cardStyles.cardLabel}>Total Séances</AureakText>
        <View style={cardStyles.badgeGold}>
          <AureakText style={cardStyles.badgeGoldText}>+12%</AureakText>
        </View>
      </View>
      <AureakText style={cardStyles.cardStatGoldSolid}>{stats.totalSessions}</AureakText>
      <AureakText style={cardStyles.cardSub}>Période sélectionnée</AureakText>
    </View>

    {/* Card 4 — Tendance Global (fond dark gold) */}
    <View style={[cardStyles.card, cardStyles.cardDarkGold, { flex: 1 }]}>
      <AureakText style={cardStyles.statIconLight}>↗</AureakText>
      <AureakText style={cardStyles.cardLabelDark}>Tendance Global</AureakText>
      <AureakText style={[
        cardStyles.cardStatGold,
        { color: trendPositive ? colors.text.primary : colors.status.absent },
      ]}>
        {stats.totalSessions >= 2 ? trendDisplay : '—'}
      </AureakText>
      <AureakText style={cardStyles.cardSubDark}>
        {stats.totalSessions >= 2 ? 'pts vs moyenne période' : 'Données insuffisantes'}
      </AureakText>
    </View>
  </View>
)
```

### Styles à ajouter / modifier dans `cardStyles`

```typescript
// Remplacer cardDark par :
cardDarkGold: {
  backgroundColor: '#6e5d14',
  borderColor    : '#6e5d14',
},

// Ajouter :
cardStatGoldSolid: {
  fontSize    : 28,
  fontFamily  : 'Montserrat',
  fontWeight  : '900',
  color       : 'rgba(193,172,92,0.5)',  // = colors.border.goldSolid
  marginBottom: space.xs,
},
badgeGold: {
  backgroundColor  : 'rgba(110,93,20,0.05)',
  borderRadius     : radius.badge,
  paddingHorizontal: 8,
  paddingVertical  : 2,
},
badgeGoldText: {
  color     : colors.accent.goldLight,
  fontSize  : 10,
  fontWeight: '700',
  fontFamily: fonts.heading,
},
```

> **Note tokens** : `colors.border.goldSolid` = `rgba(193,172,92,0.5)` — déjà défini dans tokens.ts.
> Le fond card 4 `#6e5d14` n'a pas de token dédié — utiliser la valeur hex directement avec un commentaire `// Figma card Tendance fond gold foncé`.

## Files

- `aureak/apps/web/app/(admin)/activites/presences/page.tsx` (modifier — unique fichier impacté)

## Dependencies

- `@aureak/theme` tokens existants ✅ (`colors.accent.goldLight`, `colors.border.goldSolid`, `colors.text.primary`, `colors.status.absent`)
- Aucune migration Supabase
- Aucun changement API ou types

## Notes d'implémentation

- Le badge "+12%" sur Card 3 est **statique** pour cette story (valeur affichée en dur). La tendance réelle par rapport à la période précédente sera calculée dans une story dédiée ultérieure.
- Les couleurs hex des cellules heatmap (`#22c55e`, `#eab308`, `#f97316`, `#ef4444`) ne sont pas dans `tokens.ts`. Les utiliser directement avec un commentaire `// Figma heatmap seuils` — ne pas les ajouter aux tokens (trop spécifiques à ce composant).
- `cardDark` (fond `colors.text.dark`) devient `cardDarkGold` (fond `#6e5d14`) — renommer dans le StyleSheet et mettre à jour la référence dans le JSX.
- Supprimer `badgeRed` et `badgeRedText` de `cardStyles` s'ils ne sont plus utilisés ailleurs dans le fichier.
