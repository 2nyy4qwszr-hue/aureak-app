# Admin Page Template — Source de verite

> **Reference** : `/activites/presences` (gold standard)
> **Derniere MAJ** : 2026-04-17

Ce document decrit le gabarit exact que chaque page admin doit respecter.
Toute nouvelle page ou refactoring de page existante doit etre visuellement indiscernable de `/activites/presences` au niveau structure.

---

## 1. Architecture globale

```
XStack (flex:1, height:100vh)
  YStack [Sidebar]   width: 220px (expanded) / 52px (collapsed)
                      backgroundColor: #2D2318
                      transition: width 0.28s ease
  YStack [Content]    flex:1, overflowY:auto
                      backgroundColor: colors.light.primary (#F3EFE7)
    <Slot />          <- page.tsx renders here
```

La page ne doit **jamais** ajouter de `maxWidth` ni `alignSelf: 'center'` sur le contenu.
Le contenu s'etale sur toute la largeur disponible (`100vw - sidebar`).

---

## 2. Structure d'une page

```
View [container]                    flex:1, bg: #F3EFE7
  PageHeader                        header titre + tabs (optionnel)
  ScrollView [scroll]               flex:1, bg: #F3EFE7
    View [scrollContent]
      StatCards                     4 cartes KPI
      View [filtresRow]            filtre scope + filtre temporel
      View [tableContainer]        tableau de donnees
```

### Styles page obligatoires

```typescript
const pageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,       // #F3EFE7
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  scrollContent: {
    paddingTop: space.md,                         // 16
    paddingBottom: space.xxl,                      // 48
    backgroundColor: colors.light.primary,
    // INTERDIT: maxWidth, alignSelf: 'center', width: '100%'
  },
  filtresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,                  // 24
    paddingVertical: space.sm,                    // 8
    zIndex: 9999,                                 // OBLIGATOIRE — dropdowns au-dessus du tableau
  },
  loadingWrapper: {
    padding: space.xl,                            // 32
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.muted,                     // #71717A
    fontSize: 14,
    fontFamily: fonts.body,                       // Poppins
  },
})
```

---

## 3. Header de page

Deux cas de figure :

### 3a. Header avec tabs (type Activites)

```typescript
const headerStyles = StyleSheet.create({
  headerBlock: {
    backgroundColor: colors.light.primary,        // #F3EFE7
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,                  // 24
    paddingTop: space.lg,                         // 24
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.display,                    // Montserrat
    color: colors.text.dark,                      // #18181B
    letterSpacing: 0.5,
  },
  // Bouton CTA (optionnel, ex: "+ Nouvelle seance")
  cta: {
    backgroundColor: colors.accent.gold,          // #C1AC5C
    paddingHorizontal: space.md,                  // 16
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaLabel: {
    color: colors.text.dark,
    fontWeight: '700',
    fontSize: 13,
  },
  // Barre d'onglets
  tabsRow: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,     // #E8E4DC
    paddingHorizontal: space.lg,                  // 24
  },
  tabItem: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text.subtle,                    // #A1A1AA
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: colors.accent.gold,                    // #C1AC5C
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent.gold,
    borderRadius: 1,
  },
})
```

### 3b. Header simple (sans tabs)

Meme `headerTopRow` avec titre + CTA, sans `tabsRow`.

---

## 4. Stat Cards (4 cartes KPI)

### Container

```typescript
row: {
  flexDirection: 'row',
  gap: space.md,                                  // 16
  paddingHorizontal: space.lg,                    // 24
  paddingVertical: space.md,                      // 16
  flexWrap: 'wrap',
}
```

### Carte individuelle

```typescript
card: {
  flex: 1,
  minWidth: 160,
  backgroundColor: colors.light.surface,          // #FFFFFF
  borderRadius: radius.card,                      // 16
  padding: space.md,                              // 16
  borderWidth: 1,
  borderColor: colors.border.divider,             // #E8E4DC
  boxShadow: shadows.sm,                          // '0 1px 2px rgba(0,0,0,0.06)'
}
```

### Carte 4 (accent) — deux variantes

| Variante | Style |
|----------|-------|
| Border gold | meme que `card` + `borderColor: colors.accent.gold` (#C1AC5C) |
| Fond sombre | `backgroundColor: colors.accent.goldDark` (#6e5d14), pas de border |

### Typographie dans les cartes

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Icone emoji | — | 22 | — | — |
| Label (uppercase) | Montserrat | 10 | 700 | #71717A, letterSpacing: 1 |
| Valeur principale | Montserrat | 28 | 900 | #18181B |
| Sous-texte | Poppins | 11 | 400 | #71717A |
| Barre de progression track | — | h:4 | — | #E8E4DC, borderRadius: 2 |
| Barre de progression fill | — | h:4 | — | #C1AC5C, borderRadius: 2 |

---

## 5. Filtres

### FiltresScope (pills)

```
[Toutes] [Implantation v] [Groupe v] [Joueur v]
```

| Etat | backgroundColor | borderColor | textColor |
|------|-----------------|-------------|-----------|
| Actif | #C1AC5C | #C1AC5C | #18181B |
| Inactif | #F8F6F1 | #E5E7EB | #71717A |
| Disabled | opacity: 0.45 | — | — |

```typescript
pill: {
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: radius.badge,                     // 999
  borderWidth: 1,
}
pillText: {
  fontSize: 12,
  fontWeight: '600',
  fontFamily: fonts.body,                         // Poppins
}
```

### Dropdown (quand une pill est ouverte)

```typescript
dropdown: {
  position: 'absolute',
  top: 38,
  left: 0,
  zIndex: 9999,
  backgroundColor: '#FFFFFF',
  borderRadius: radius.xs,                        // 6
  borderWidth: 1,
  borderColor: '#E5E7EB',
  width: 220,                                     // 260 pour Joueur (avec search input)
  boxShadow: shadows.lg,                          // '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
}
dropdownItem: {
  paddingHorizontal: space.md,                    // 16
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#E8E4DC',
}
dropdownItemText: {
  fontSize: 13,
  fontFamily: fonts.body,                         // Poppins
  color: '#18181B',
}
```

### PseudoFiltresTemporels (toggle segmente)

```
[AUJOURD'HUI | A VENIR | PASSEES]
```

```typescript
toggleRow: {
  flexDirection: 'row',
  gap: 0,
  alignSelf: 'flex-start',
  borderRadius: radius.xs,                        // 6
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#E5E7EB',
}
segment: {
  paddingVertical: 8,
  paddingHorizontal: space.lg,                    // 24
}
// Actif:  backgroundColor: #C1AC5C
// Inactif: backgroundColor: #FFFFFF
segmentLabel: {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.8,
}
// Actif:  color: #18181B
// Inactif: color: #71717A
```

---

## 6. Tableau de donnees

### Container

```typescript
tableContainer: {
  marginHorizontal: space.lg,                     // 24
  marginBottom: space.lg,                         // 24
  borderRadius: 10,
  borderWidth: 1,
  borderColor: colors.border.divider,             // #E8E4DC
  overflow: 'hidden',
}
```

### Header du tableau

```typescript
tableHeaderRow: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: colors.light.muted,            // #F8F6F1
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,       // #E8E4DC
}
tableHeaderText: {
  fontSize: 10,
  fontFamily: fonts.display,                      // Montserrat
  fontWeight: '700',
  color: colors.text.subtle,                      // #A1A1AA
  letterSpacing: 1,
  textTransform: 'uppercase',
}
```

### Lignes de donnees

```typescript
tableRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  minHeight: 52,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,       // #E8E4DC
}
// Alternance: pair = #FFFFFF, impair = #F8F6F1
// Pressed: backgroundColor: #EDE9DF
```

### Pagination

```typescript
pagination: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: space.md,                    // 16
  paddingVertical: space.sm,                      // 8
  borderTopWidth: 1,
  borderTopColor: colors.border.divider,          // #E8E4DC
  backgroundColor: colors.light.muted,            // #F8F6F1
}
```

---

## 7. Tokens de reference complets

### Couleurs

| Token | Valeur | Usage |
|-------|--------|-------|
| `colors.light.primary` | #F3EFE7 | Fond de page, scroll bg |
| `colors.light.surface` | #FFFFFF | Cartes, dropdowns, inputs |
| `colors.light.muted` | #F8F6F1 | Headers tableau, lignes impaires, pills inactives |
| `colors.light.hover` | #EDE9DF | Row pressed |
| `colors.accent.gold` | #C1AC5C | CTAs, pills actives, tabs actifs, borders accent |
| `colors.accent.goldDark` | #6e5d14 | Carte 4 fond sombre |
| `colors.accent.goldPale` | #F9E28C | Texte sur goldDark |
| `colors.border.divider` | #E8E4DC | Separateurs, borders tableau, border tabs |
| `colors.border.light` | #E5E7EB | Pills inactives, inputs, dropdowns |
| `colors.border.goldSolid` | rgba(193,172,92,0.5) | Valeurs stat secondaires |
| `colors.text.dark` | #18181B | Texte principal |
| `colors.text.muted` | #71717A | Labels secondaires, sous-textes |
| `colors.text.subtle` | #A1A1AA | Headers tableau, tabs inactifs |
| `colors.status.present` | #4CAF50 | Vert present |
| `colors.status.absent` | #F44336 | Rouge absent |
| `colors.status.attention` | #FFC107 | Jaune retard |

### Espacements (`space.*`)

| Token | Valeur | Usage principal |
|-------|--------|-----------------|
| `space.xs` | 4 | Micro-gaps |
| `space.sm` | 8 | Gap pills, padding filtres vertical |
| `space.md` | 16 | Padding cartes, gap cartes, paddingTop scroll |
| `space.lg` | 24 | Padding horizontal page, tabs, header, segments |
| `space.xl` | 32 | Loading wrapper |
| `space.xxl` | 48 | Padding bottom scroll |

### Rayons (`radius.*`)

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius.xs` | 6 | Inputs, dropdowns, pagination, toggles |
| `radius.card` | 16 | Stat cards |
| `radius.badge` | 999 | Pills (fully rounded) |

### Ombres (`shadows.*`)

| Token | Valeur |
|-------|--------|
| `shadows.sm` | `0 1px 2px rgba(0,0,0,0.06)` |
| `shadows.lg` | `0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)` |

### Polices (`fonts.*`)

| Token | Valeur | Usage |
|-------|--------|-------|
| `fonts.display` | Montserrat | Titre page (24/700), valeur stat (28/900), headers tableau |
| `fonts.heading` | Montserrat | Labels cartes (10/700) |
| `fonts.body` | Poppins | Texte UI general, pills, dropdowns |
| `fonts.mono` | Geist Mono | Donnees numeriques, taux, pagination |

---

## 8. Patterns obligatoires

### State loading — try/finally

```typescript
setSaving(true)
try {
  await someApiCall()
} finally {
  setSaving(false)
}
```

### Console guards

```typescript
if (process.env.NODE_ENV !== 'production') console.error('[Component] context:', err)
```

### Data fetching

```typescript
useEffect(() => {
  setLoading(true)
  ;(async () => {
    try {
      const result = await apiFunction(params)
      setState(result)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Page] fetch error:', err)
    } finally {
      setLoading(false)
    }
  })()
}, [dependency])
```

---

## 9. Checklist de conformite

Avant de valider une page admin, verifier :

- [ ] **Pas de `maxWidth`** ni `alignSelf: 'center'` sur scrollContent
- [ ] **`backgroundColor: colors.light.primary`** sur container + scroll + scrollContent
- [ ] **`paddingHorizontal: space.lg` (24)** sur filtresRow, header, table margins
- [ ] **`zIndex: 9999`** sur filtresRow
- [ ] **4 stat cards** avec `flex:1`, `minWidth:160`, `borderRadius: radius.card`, `gap: space.md`
- [ ] **Tableau** avec `borderRadius: 10`, alternance pair/impair, headers uppercase Montserrat 10/700
- [ ] **Try/finally** sur tout state setter loading/saving
- [ ] **Console guards** (`NODE_ENV !== 'production'`) sur tout `console.*`
- [ ] **Pas de couleurs hardcodees** — tout via `@aureak/theme` tokens
- [ ] **Pas d'import Supabase direct** — tout via `@aureak/api-client`
- [ ] **Fonts** : titres = Montserrat, corps = Poppins, chiffres = Geist Mono

---

## 10. Anti-patterns (INTERDIT)

| Interdit | Correct |
|----------|---------|
| `maxWidth: 1200` sur scrollContent | Pas de maxWidth, le contenu s'etale |
| `position: 'sticky'` sur les filtres | `zIndex: 9999` seul (pas de sticky) |
| Couleur hex inline `'#C1AC5C'` | `colors.accent.gold` |
| `import { supabase }` dans apps/ | `import { apiFunction } from '@aureak/api-client'` |
| `catch(() => {})` silencieux | `catch (err) { if (NODE_ENV...) console.error(...) }` |
| `setLoading(false)` hors finally | `try { ... } finally { setLoading(false) }` |
| TanStack Query / SWR | useState + useEffect (pattern actuel) |
