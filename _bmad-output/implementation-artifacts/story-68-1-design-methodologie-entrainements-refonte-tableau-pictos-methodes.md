# Story 68.1 : DESIGN — Méthodologie Entraînements : refonte visuelle (tableau + stat cards méthodes + pictos)

Status: done

## Story

En tant qu'admin,
je veux que la page Entraînements de la Méthodologie affiche un tableau premium avec des stat cards par méthode (pictos spécifiques) et un tableau de données à la place de la grille de cards actuelle,
afin d'avoir une vue claire, lisible et alignée avec la référence visuelle `Methodologie entrainement-redesign.png`.

## Acceptance Criteria

### Layout & navigation

1. **Header de page** : titre "MÉTHODOLOGIE" en Montserrat 24px bold `colors.text.dark` + 3 onglets de navigation (ENTRAÎNEMENTS | THÈMES | SITUATIONS) en 11px uppercase `colors.text.subtle`, onglet actif surligné gold, + bouton "Nouvel entraînement" gold aligné à droite
2. **Onglets** : ENTRAÎNEMENTS = `/methodologie/seances`, THÈMES = `/methodologie/themes`, SITUATIONS = `/methodologie/situations` — navigation via `router.push`

### Stat cards méthodes

3. **7 stat cards** en ligne horizontale scrollable (une par méthode) — fond blanc, border `colors.border.divider`, radius `radius.card`, shadow sm
4. **Chaque card** affiche : picto méthode (32px), nombre d'entraînements de cette méthode en 22px bold Montserrat `colors.text.dark`, label méthode en 10px uppercase `colors.text.muted`
5. **Pictos méthodes** (emojis) :
   - Goal and Player → ⚽
   - Technique → 📚
   - Situationnel → 📐
   - Perfectionnement → 🎯
   - Performance → 💪
   - Décisionnel → 🧠
   - Intégration → 👥
6. **Couleur accent** : une fine bordure gauche (3px) de la couleur token de la méthode (`methodologyMethodColors[method]`) sur chaque card

### Tableau

7. **Tableau à la place de la grille** : remplacer le CSS grid de cards par un tableau avec header et lignes
8. **Header tableau** : colonnes METHODE | NUM | TITRE | THÈMES | SITUATIONS | PDF | STATUT — fond `colors.light.muted`, 10px uppercase `colors.text.subtle`, letter-spacing 1, padding vertical 10px
9. **Lignes** : hauteur ~52px, padding horizontal 16px, border-bottom `colors.border.divider`, alternance fond pair/impair (`colors.light.surface` / `colors.light.muted`)
10. **Colonne METHODE** : picto emoji (20px) de la méthode avec cercle coloré `methodologyMethodColors[method] + '22'` de 32px diameter
11. **Colonne NUM** : `session.trainingRef` en 13px fontWeight 700 `colors.accent.gold` — ex: "#5"
12. **Colonne TITRE** : titre en 13px fontWeight 600 `colors.text.dark`, cliquable → `/methodologie/seances/[id]`
13. **Colonne THÈMES** : noms des thèmes liés affichés en chips texte 10px (`colors.text.muted`, fond `colors.light.muted`, borderRadius 4) — si aucun thème : tiret "—"
14. **Colonne SITUATIONS** : count des situations liées en badge 11px (fond `colors.accent.gold + '22'`, couleur `colors.accent.gold`) — si 0 : "—"
15. **Colonne PDF** : dot vert 8px si `session.pdfUrl` existe, gris sinon
16. **Colonne STATUT** : dot vert `colors.status.present` si `session.isActive`, gris `colors.border.light` sinon
17. **Ligne cliquable** : clic sur une ligne → `router.push('/methodologie/seances/[id]')`
18. **Fond page** : `colors.light.primary` — aucun fond sombre

### Filtres

19. **Barre de filtres** conservée : search textuel + pills méthodes + pills contexte — mais positionnée entre les stat cards et le tableau
20. **Zéro couleur hardcodée** dans les nouveaux styles

## Tasks / Subtasks

- [x] T1 — Header + onglets (AC: 1, 2)
  - [x] T1.1 — Dans `methodologie/seances/index.tsx`, remplacer le header actuel "Entraînements pédagogiques" par "MÉTHODOLOGIE" avec barre d'onglets
  - [x] T1.2 — Onglets : `[{ label: 'ENTRAÎNEMENTS', href: '/methodologie/seances' }, { label: 'THÈMES', href: '/methodologie/themes' }, { label: 'SITUATIONS', href: '/methodologie/situations' }]` — onglet actif = underline gold 2px
  - [x] T1.3 — Bouton "Nouvel entraînement" conservé, aligné à droite

- [x] T2 — Stat cards méthodes (AC: 3, 4, 5, 6)
  - [x] T2.1 — Déclarer `METHOD_PICTOS` constant : `{ 'Goal and Player': '⚽', 'Technique': '📚', 'Situationnel': '📐', 'Perfectionnement': '🎯', 'Performance': '💪', 'Décisionnel': '🧠', 'Intégration': '👥' }`
  - [x] T2.2 — Calculer les counts par méthode depuis `sessions` (après chargement) : `METHODOLOGY_METHODS.map(m => ({ method: m, count: sessions.filter(s => s.method === m).length }))`
  - [x] T2.3 — Rendre les 7 cards en ScrollView horizontal : picto (32px) + count (22px bold gold) + label method (10px uppercase muted) + borderLeft 3px `methodologyMethodColors[method]`

- [x] T3 — Tableau (AC: 7–18)
  - [x] T3.1 — Remplacer le `gridStyle` (CSS grid) par un composant `View` tableau avec header + lignes
  - [x] T3.2 — Header : 7 colonnes (widths approximatifs: 52 | 52 | flex-1 | 120 | 80 | 40 | 40) — style pattern story 67-2
  - [x] T3.3 — Pour chaque `session` filtré : rendre une ligne avec les colonnes METHODE / NUM / TITRE / THÈMES / SITUATIONS / PDF / STATUT
  - [x] T3.4 — Colonne METHODE : `View` cercle 32px fond `methodologyMethodColors[method] + '22'`, picto 20px centré
  - [x] T3.5 — Colonne THÈMES : champ absent dans le type actuel → afficher "—" (les thèmes liés seront ajoutés dans une story ultérieure)
  - [x] T3.6 — Colonne SITUATIONS : champ absent → "—"
  - [x] T3.7 — Alternance fond pair/impair : `idx % 2 === 0 ? colors.light.surface : colors.light.muted`
  - [x] T3.8 — Rendre la ligne `Pressable` → `router.push`

- [x] T4 — Filtres repositionnés (AC: 19)
  - [x] T4.1 — Déplacer les filtres (search + pills méthode + pills contexte) entre les stat cards et le tableau
  - [x] T4.2 — Conserver la logique de filtrage existante

- [x] T5 — Validation (AC: tous)
  - [x] T5.1 — Naviguer sur `/methodologie/seances` → vérifier header MÉTHODOLOGIE + 3 onglets + bouton
  - [x] T5.2 — Vérifier 7 stat cards scrollables avec pictos et counts corrects
  - [x] T5.3 — Vérifier tableau : header, lignes alternées, pictos méthode, cliquabilité
  - [x] T5.4 — Grep `#[0-9a-fA-F]` sur le fichier modifié → zéro occurrence

## Dev Notes

### ⚠️ Contraintes Stack

**React Native Web** (View, Pressable, StyleSheet) dans `methodologie/seances/index.tsx`.

- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `methodologyMethodColors`
- **Types `@aureak/types`** : `METHODOLOGY_METHODS`, `MethodologyMethod`
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter

---

### METHOD_PICTOS constant (à déclarer en haut du fichier)

```typescript
const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}
```

---

### Pattern onglets (T1.2)

```tsx
const TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances' },
  { label: 'THÈMES',        href: '/methodologie/themes' },
  { label: 'SITUATIONS',    href: '/methodologie/situations' },
]

// Dans le JSX :
<View style={{ flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}>
  {TABS.map(tab => {
    const active = tab.href === '/methodologie/seances'
    return (
      <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
        <AureakText style={{
          fontSize: 11, fontWeight: '700', letterSpacing: 1,
          color: active ? colors.accent.gold : colors.text.subtle,
          paddingBottom: 10,
          borderBottomWidth: active ? 2 : 0,
          borderBottomColor: colors.accent.gold,
        }}>
          {tab.label}
        </AureakText>
      </Pressable>
    )
  })}
</View>
```

---

### Pattern stat card méthode (T2.3)

```tsx
<View style={{
  backgroundColor : colors.light.surface,
  borderRadius    : radius.card,
  borderWidth     : 1,
  borderColor     : colors.border.divider,
  borderLeftWidth : 3,
  borderLeftColor : methodologyMethodColors[method],
  boxShadow       : shadows.sm,
  padding         : space.md,
  minWidth        : 110,
  alignItems      : 'center',
  gap             : 4,
} as unknown as object}>
  <AureakText style={{ fontSize: 28 }}>{METHOD_PICTOS[method]}</AureakText>
  <AureakText style={{ fontSize: 22, fontWeight: '900', fontFamily: 'Montserrat', color: colors.text.dark }}>
    {count}
  </AureakText>
  <AureakText style={{ fontSize: 9, fontWeight: '700', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'center' }}>
    {method}
  </AureakText>
</View>
```

---

### Pattern header tableau (T3.2)

```typescript
// Widths colonnes (flex)
const COL_WIDTHS = { method: 52, num: 52, title: 1, themes: 120, situations: 80, pdf: 40, status: 40 }
```

Identique au pattern story 67-2 :
```typescript
tableHeader: {
  flexDirection    : 'row',
  alignItems       : 'center',
  paddingHorizontal: 16,
  paddingVertical  : 10,
  backgroundColor  : colors.light.muted,
  borderBottomWidth: 1,
  borderBottomColor: colors.border.divider,
},
thText: {
  fontSize     : 10,
  fontWeight   : '700',
  fontFamily   : 'Montserrat',
  color        : colors.text.subtle,
  textTransform: 'uppercase',
  letterSpacing: 1,
},
```

---

### Sur les champs thèmes/situations

Le type `MethodologySession` dans `@aureak/types` peut ne pas exposer encore les thèmes liés directement. Dans ce cas :
- Colonne THÈMES → afficher "—" (les liaisons seront visibles dans la story dédiée thèmes)
- Colonne SITUATIONS → afficher "—" (même raison)

Ne pas enrichir l'API pour cette story — visual only.

---

### Référence visuelle

Fichier : `_bmad-output/design-references/Methodologie entrainement-redesign.png`

Structure cible :
- Header : MÉTHODOLOGIE + onglets ENTRAÎNEMENTS/THÈMES/SITUATIONS + bouton "Nouvel entraînement"
- Stat cards : 7 cards horizontales scrollables (une par méthode avec picto spécifique)
- Filtres : search + pills méthodes
- Tableau : header 10px uppercase + lignes 52px alternées + colonnes METHODE/NUM/TITRE/THÈMES/SITUATIONS/PDF/STATUT

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifier | Refonte complète layout — seul fichier concerné |

### Fichiers à NE PAS modifier

- `aureak/apps/web/app/(admin)/methodologie/index.tsx` — hub existant (non concerné)
- `aureak/apps/web/app/(admin)/methodologie/themes/` — deferred (story ultérieure)
- `aureak/apps/web/app/(admin)/methodologie/situations/` — deferred (story ultérieure)
- `aureak/apps/web/app/(admin)/methodologie/seances/new.tsx` — non concerné
- `aureak/apps/web/app/(admin)/methodologie/seances/[sessionId]/` — non concerné
- `supabase/migrations/` — aucune migration (7 méthodes déjà dans l'enum TS + theme tokens)
- `aureak/packages/theme/src/tokens.ts` — `methodologyMethodColors` déjà complet avec les 7 méthodes

---

### Multi-tenant

RLS gère l'isolation — aucun changement API.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun.

### Completion Notes List

- Grille CSS grid remplacée par tableau RN View avec header/lignes alternées
- `AureakText` n'accepte pas `StyleProp<TextStyle>` (seulement `TextStyle`) — styles onglet actif mergés via spread `{ ...st.tabLabel, ...st.tabLabelActive }`
- Thèmes et situations affichent "—" (champs absents du type `MethodologySession`, réservés stories ultérieures)
- QA : try/finally OK, console guard OK, zéro hex hardcodé
- TypeScript : zéro erreur

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/methodologie/seances/index.tsx` | Modifié |
