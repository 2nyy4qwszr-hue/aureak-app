# Story 71.2 : Design — StatCards Présences & Évaluations : pictos + ordre + 4ème card dark

Status: done

## Story

En tant qu'admin,
je veux que les stat cards des onglets Présences et Évaluations aient le même template visuel que l'onglet Séances (picto → label → valeur + 4ème card dark),
afin que les 3 onglets forment une identité graphique cohérente.

## Acceptance Criteria

### Présences (référence `Activites presences-redesign.png`)

1. Card 1 "Présence Générale" : picto `📊` → label → valeur `{avgRate}%` + barre progression
2. Card 2 "Groupes sous 70%" : picto `👥` → label → valeur `{groupsUnder70}`
3. Card 3 "Total Séances" : picto `📅` → label → valeur `{totalSessions}`
4. Card 4 "Tendance Global" : fond `colors.text.dark`, picto `↗` blanc, label blanc muted, valeur `+X.X` en vert/rouge (couleur dynamique existante), sous-texte "pts vs moyenne période" en blanc muted

### Évaluations (référence `Activites evaluations-redesign.png`)

5. Card 1 "Note Moyenne" : picto `⭐` → label → valeur `{avgDisplay}/10`
6. Card 2 "Évaluations" : picto `📋` → label → valeur `{totalEvals}`
7. Card 3 "Progression Technique" : picto `📈` → label → valeur `+{progression}%` (couleur verte si positif)
8. Card 4 "Top Performer" : fond `colors.text.dark`, picto `👤` blanc, label "TOP PERFORMER" blanc muted, valeur = nom du top joueur (tronqué 14 chars) en blanc bold, ou "—" si aucun

### Commun

9. L'ordre dans chaque card est strictement : picto (fontSize 22, marginBottom 4) → label (10px uppercase muted) → valeur (28px bold dark ou blanc selon fond)
10. Les 3 premières cards de chaque onglet gardent le fond `colors.light.surface` — seule la 4ème est dark
11. TypeScript compile sans erreur

## Tasks / Subtasks

- [x] T1 — Présences : restructurer les 4 cards (AC: 1-4)
  - [x] T1.1 — Dans `activites/presences/page.tsx`, `StatCardsPresences` : ajouter pictos en tête de chaque card (📊, 👥, 📅)
  - [x] T1.2 — Inverser l'ordre : picto → `cardLabel` → `cardStat` (au lieu de `cardLabel` → `cardStat`)
  - [x] T1.3 — Card 4 "Tendance Global" : ajouter `cardDark: { backgroundColor: colors.text.dark, borderColor: colors.text.dark }` si absent. Picto `↗` en blanc. Modifier `cardLabelDark` (déjà en place?) et `cardSubDark` pour être bien définis en blanc/muted clair.
  - [x] T1.4 — Ajouter `statIcon: { fontSize: 22, marginBottom: 4 }` dans `cardStyles`

- [x] T2 — Évaluations : restructurer les 4 cards (AC: 5-8)
  - [x] T2.1 — Dans `activites/evaluations/page.tsx`, trouver les 4 `<StatCard>` : card Note Moyenne, card Évals ce mois, card Progression, card Top Performer (ou équivalent)
  - [x] T2.2 — Le composant `StatCard` dans evaluations est probablement un composant inline avec props `label`, `value`, `sub`. Modifier son template interne pour ajouter un prop `icon?: string` affiché en premier
  - [x] T2.3 — Passer `icon="⭐"` à Note Moyenne, `icon="📋"` à Évaluations (total), `icon="📈"` à Progression, `icon="👤"` à Top Performer
  - [x] T2.4 — Card Top Performer : ajouter prop `dark?: boolean` → si true, fond `colors.text.dark`, texte blanc

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — `npx tsc --noEmit` = 0 erreurs
  - [x] T3.2 — Onglet Présences : vérifier que chaque card affiche picto → label → valeur
  - [x] T3.3 — Onglet Évaluations : même vérification
  - [x] T3.4 — Vérifier que les 4ème cards sont bien sombres sur les deux onglets

## Dev Notes

### ⚠️ Contraintes Stack

**React Native Web** (View, StyleSheet). Tokens `@aureak/theme` uniquement.

---

### T1 — Pattern Présences card cible

```tsx
{/* Card 1 — Présence Générale (APRÈS) */}
<View style={[cardStyles.card, { flex: 1 }]}>
  <AureakText style={cardStyles.statIcon}>📊</AureakText>
  <AureakText style={cardStyles.cardLabel}>Présence Générale</AureakText>
  <AureakText style={cardStyles.cardStat}>{stats.avgRate} %</AureakText>
  <View style={cardStyles.progressTrack}>
    <View style={[cardStyles.progressFill, { width: `${Math.min(stats.avgRate, 100)}%` as unknown as number }]} />
  </View>
</View>

{/* Card 4 — Tendance Global (APRÈS) */}
<View style={[cardStyles.card, cardStyles.cardDark, { flex: 1 }]}>
  <AureakText style={cardStyles.statIconLight}>↗</AureakText>
  <AureakText style={cardStyles.cardLabelDark}>Tendance Global</AureakText>
  <AureakText style={{ ...(cardStyles.cardStatGold as object), color: trendPositive ? colors.status.present : colors.status.absent } as import('react-native').TextStyle}>
    {stats.totalSessions >= 2 ? trendDisplay : '—'}
  </AureakText>
  <AureakText style={cardStyles.cardSubDark}>
    {stats.totalSessions >= 2 ? 'pts vs moyenne période' : 'Données insuffisantes'}
  </AureakText>
</View>

// Styles à ajouter dans cardStyles
statIcon: { fontSize: 22, marginBottom: 4 },
statIconLight: { fontSize: 22, marginBottom: 4, color: colors.text.primary },
```

---

### T2 — Pattern Évaluations — ajout prop icon au composant StatCard

```tsx
// StatCard (evaluations/page.tsx) — ajouter prop icon + dark
type StatCardProps = {
  label : string
  value : string
  sub  ?: string
  icon ?: string   // ← ajout
  dark ?: boolean  // ← ajout
}

function StatCard({ label, value, sub, icon, dark }: StatCardProps) {
  return (
    <View style={[evalStyles.statCard, dark && evalStyles.statCardDark]}>
      {icon && <AureakText style={dark ? evalStyles.statIconLight : evalStyles.statIcon}>{icon}</AureakText>}
      <AureakText style={dark ? evalStyles.statLabelDark : evalStyles.statLabel}>{label}</AureakText>
      <AureakText style={dark ? evalStyles.statValueLight : evalStyles.statValue}>{value}</AureakText>
      {sub && <AureakText style={dark ? evalStyles.statSubDark : evalStyles.statSub}>{sub}</AureakText>}
    </View>
  )
}

// Usage
<StatCard icon="⭐" label="Note Moyenne" value={...} />
<StatCard icon="📋" label="Évaluations" value={...} />
<StatCard icon="📈" label="Progression" value={...} />
<StatCard icon="👤" label="Top Performer" value={...} dark />

// Styles à ajouter
statCardDark  : { backgroundColor: colors.text.dark, borderColor: colors.text.dark },
statIcon      : { fontSize: 22, marginBottom: 4 },
statIconLight : { fontSize: 22, marginBottom: 4, color: colors.text.primary },
statLabelDark : { fontSize: 10, fontFamily: 'Montserrat', color: colors.accent.goldLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
statValueLight: { fontSize: 28, fontWeight: '900', fontFamily: 'Montserrat', color: colors.text.primary, lineHeight: 36 },
statSubDark   : { fontSize: 12, fontFamily: 'Montserrat', color: colors.text.primary + '99', marginTop: 4 },
```

---

### Dépendances

- Story 71-1 doit être implémentée en premier (établit le pattern) — mais cette story peut être implementée en parallèle car fichiers différents
- Story 67-3 (done) : ne pas revenir sur les styles de fond/tableau déjà implémentés, uniquement ajouter les pictos et refaire l'ordre

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifier | Pictos + ordre cards + card 4 dark |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifier | Prop icon + card 4 dark |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/activites/components/StatCards.tsx` — couvert par 71-1
- `supabase/migrations/` — aucune migration

---

### Multi-tenant

Sans objet — UI uniquement.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun.

### Completion Notes List

- `presences/page.tsx` : pictos 📊/👥/📅 ajoutés en tête des 3 premières cards. Card 4 : fond `colors.text.dark`, picto `↗` style `statIconLight` (blanc), `cardLabelDark` en `colors.accent.goldLight`, `cardSubDark` en blanc semi-transparent.
- `evaluations/page.tsx` : composant `StatCard` enrichi avec props `icon?` et refonte du rendu (ordre picto → label → valeur). Card Top Performer : fond `colors.text.dark`, valeur tronquée à 14 chars. `statCardDark`, `statValueDark`, `statLabelDark`, `statSubDark`, `statIcon`, `statIconLight` ajoutés/mis à jour.
- `npx tsc --noEmit` = 0 erreurs.

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/presences/page.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Modifié |
