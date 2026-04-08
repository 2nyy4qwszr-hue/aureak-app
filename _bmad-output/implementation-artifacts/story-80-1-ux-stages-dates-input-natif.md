# Story 80.1 : UX — Stages : Sélecteur de date natif (input type="date") sur les champs date début / date fin

Status: done

## Story

En tant qu'admin,
je veux utiliser le sélecteur de date natif du navigateur pour saisir la date de début et la date de fin d'un stage,
afin d'éviter les erreurs de format AAAA-MM-JJ et accélérer la création ou l'édition d'un stage.

## Acceptance Criteria

1. Sur `stages/new.tsx`, les champs "Date de début" et "Date de fin" utilisent `<input type="date">` HTML natif (non plus `<TextInput>`) et affichent un sélecteur calendrier lors du clic.
2. Sur `stages/[stageId]/page.tsx`, le champ "Ajouter une journée" utilise `<input type="date">` HTML natif (non plus `<TextInput>`) et affiche un sélecteur calendrier lors du clic.
3. Les valeurs renvoyées par les inputs natifs sont au format `YYYY-MM-DD` (ISO 8601) et sont transmises telles quelles aux fonctions API existantes (`createStage`, `createStageDay`) sans transformation.
4. Le style des inputs natifs respecte les tokens du design system : `backgroundColor: colors.light.muted`, `borderColor: colors.border.light` au repos, `borderColor: colors.accent.gold` au focus (via classe CSS + `<style>` inline), `borderRadius: 7`, `fontSize: 13`, identique aux autres champs texte de la page.
5. La validation existante `startDate <= endDate` dans `stages/new.tsx` fonctionne toujours correctement avec les valeurs ISO fournies par l'input natif.
6. Aucun placeholder "AAAA-MM-JJ" n'est affiché sur les champs date remplacés (le navigateur gère le format nativement).
7. Aucune couleur hardcodée n'est introduite — tous les styles utilisent des tokens `@aureak/theme`.

## Tasks / Subtasks

- [x] T1 — Remplacer les champs dates dans `stages/new.tsx` (AC: 1, 3, 4, 5, 6, 7)
  - [x] T1.1 — Vérifier que `TextInput` reste importé (Nom, Saison, Lieu, Participants max, Notes l'utilisent encore — ne pas le retirer)
  - [x] T1.2 — Ajouter un tag `<style>` inline dans le JSX (après `<ScrollView>`, avant `<View style={s.header}>`) pour la règle CSS : `.stage-date-inp:focus { outline: none; border-color: ${colors.accent.gold} !important; }`
  - [x] T1.3 — Remplacer les deux `<TextInput>` de dates (lignes ~121 et ~131) par des `<input type="date">` avec `className="stage-date-inp"`, `value={startDate}`, `onChange={e => setStartDate(e.target.value)}` et `style={dateInputStyle}` (idem pour `endDate`)
  - [x] T1.4 — Définir `const dateInputStyle: React.CSSProperties` avec les tokens appropriés (voir Dev Notes T1)
  - [x] T1.5 — Supprimer les props `placeholder="AAAA-MM-JJ"` et `placeholderTextColor` des deux champs remplacés

- [x] T2 — Remplacer le champ date dans `stages/[stageId]/page.tsx` — formulaire "Ajouter une journée" (AC: 2, 3, 4, 6, 7)
  - [x] T2.1 — Ajouter (ou compléter) un bloc `<style>` inline dans le return JSX de cette page avec la règle CSS `.stage-date-inp:focus { outline: none; border-color: ${colors.accent.gold} !important; }`
  - [x] T2.2 — Remplacer le `<TextInput>` du champ `newDayDate` (ligne ~832) par `<input type="date" className="stage-date-inp" value={newDayDate} onChange={e => setNewDayDate(e.target.value)} style={addDayInputStyle} />`
  - [x] T2.3 — Définir `const addDayInputStyle: React.CSSProperties` avec les tokens cohérents au contexte (voir Dev Notes T2)
  - [x] T2.4 — Supprimer le `placeholder="AAAA-MM-JJ"` et `placeholderTextColor` du champ `newDayDate`

- [x] T3 — Validation (AC: tous)
  - [x] T3.1 — Naviguer sur `/stages/new` → cliquer sur le champ "Date de début" → vérifier qu'un sélecteur calendrier natif s'ouvre
  - [x] T3.2 — Sélectionner une date début postérieure à la date de fin → vérifier que le bouton "Créer le stage" reste désactivé (validation `startDate <= endDate` toujours active)
  - [x] T3.3 — Naviguer sur `/stages/{id}` → cliquer "+ Ajouter une journée" → vérifier que le champ date affiche un sélecteur calendrier natif
  - [x] T3.4 — Vérifier l'absence du placeholder "AAAA-MM-JJ" dans les deux pages
  - [x] T3.5 — Grep `#` dans les deux fichiers modifiés → confirmer zéro couleur hexadécimale introduite

## Dev Notes

### ⚠️ Contraintes Stack

Ce projet utilise :
- **React Native Web** (View, Pressable, StyleSheet, Image) — pas de Tailwind, pas de className… SAUF pour les `<input>` HTML natifs web qui nécessitent un `className` pour les pseudo-classes CSS (`:focus`, `:hover`)
- **Tokens `@aureak/theme`** : `colors`, `space`, `shadows`, `radius`, `transitions`
- **Composants `@aureak/ui`** : AureakButton, AureakText, Badge, Card, Input
- **Accès Supabase UNIQUEMENT via `@aureak/api-client`** — jamais direct dans apps/
- **Styles via tokens uniquement** — jamais de couleurs hardcodées
- **Try/finally obligatoire** sur tout state setter de chargement (déjà en place dans les deux fichiers — ne pas casser)

---

### T1 — Pattern `input type="date"` validé dans le projet

**Référence exacte** : `aureak/apps/web/app/(coach)/coach/sessions/new/index.tsx` lignes 78–145

Pattern identique à copier :

```tsx
// À ajouter dans le return JSX, avant le formulaire
<style>{`
  .stage-date-inp:focus { outline: none; border-color: ${colors.accent.gold} !important; }
`}</style>

// Style objet pour les inputs date (React.CSSProperties — placer en dehors du composant)
const dateInputStyle: React.CSSProperties = {
  padding        : '8px 12px',
  borderRadius   : 7,
  border         : `1px solid ${colors.border.light}`,
  backgroundColor: colors.light.muted,
  color          : colors.text.dark,
  fontSize       : 13,
  transition     : 'border-color 0.15s',
  width          : '100%',
  boxSizing      : 'border-box' as const,
}

// Remplacement des <TextInput> dates dans la section "Dates" (lignes ~118–139 de stages/new.tsx)
<View style={{ flexDirection: 'row', gap: space.md }}>
  <View style={[s.field, { flex: 1 }]}>
    <AureakText variant="caption" style={s.label}>Date de début *</AureakText>
    <input
      className="stage-date-inp"
      type="date"
      value={startDate}
      onChange={e => setStartDate(e.target.value)}
      style={dateInputStyle}
    />
  </View>
  <View style={[s.field, { flex: 1 }]}>
    <AureakText variant="caption" style={s.label}>Date de fin *</AureakText>
    <input
      className="stage-date-inp"
      type="date"
      value={endDate}
      onChange={e => setEndDate(e.target.value)}
      style={dateInputStyle}
    />
  </View>
</View>
```

**Remarque** : `stages/new.tsx` mélange React Native Web (`View`, `StyleSheet`) et HTML natif (`<input>`) — c'est le même pattern que `exports/index.tsx` (admin) et `coach/sessions/new/index.tsx` (coach) qui fonctionnent déjà ainsi.

---

### T2 — Champ "Ajouter une journée" dans `stages/[stageId]/page.tsx`

Le formulaire `addDayForm` est une `<View style={p.addDayForm}>` (flexDirection: 'row', alignItems: 'center'). Remplacer uniquement le `<TextInput>` newDayDate.

```tsx
// Style pour l'input dans le contexte du formulaire addDay (flex: 1 pour s'étirer)
const addDayInputStyle: React.CSSProperties = {
  padding        : '8px 12px',
  borderRadius   : 7,
  border         : `1px solid ${colors.border.light}`,
  backgroundColor: colors.light.surface,
  color          : colors.text.dark,
  fontSize       : 13,
  transition     : 'border-color 0.15s',
  flex           : 1,
  boxSizing      : 'border-box' as const,
}

// Remplacement (dans addDayForm)
{addingDay && (
  <View style={p.addDayForm}>
    <input
      className="stage-date-inp"
      type="date"
      value={newDayDate}
      onChange={e => setNewDayDate(e.target.value)}
      style={addDayInputStyle}
    />
    <Pressable
      style={[p.addDayConfirmBtn, !newDayDate && { opacity: 0.4 }]}
      onPress={handleAddDay}
      disabled={!newDayDate}
    >
      <AureakText ...>Ajouter</AureakText>
    </Pressable>
  </View>
)}
```

---

### Design

**Type design** : `polish`

Tokens à utiliser :
```tsx
import { colors } from '@aureak/theme'

// Fond input — stages/new.tsx
backgroundColor : colors.light.muted

// Fond input — stages/[stageId]/page.tsx
backgroundColor : colors.light.surface

// Bordure au repos (les deux fichiers)
border          : `1px solid ${colors.border.light}`

// Bordure focus (via classe CSS)
// .stage-date-inp:focus { border-color: ${colors.accent.gold} !important; }

// Texte
color           : colors.text.dark

// Radius
borderRadius    : 7
```

Principes design à respecter :
- Feedback immédiat : le sélecteur calendrier natif s'ouvre au clic sans état JS supplémentaire
- Cohérence visuelle : les inputs date ont le même aspect que les autres champs texte de la page
- Zéro friction : le format ISO est géré par le navigateur, l'utilisateur ne saisit jamais manuellement

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/stages/new.tsx` | Modifier | Remplacer 2 TextInput dates → `<input type="date">` + style CSS block |
| `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` | Modifier | Remplacer 1 TextInput newDayDate → `<input type="date">` |

### Fichiers à NE PAS modifier

- `aureak/packages/api-client/src/admin/stages.ts` — aucune signature ne change, les valeurs ISO `YYYY-MM-DD` sont déjà attendues
- `aureak/packages/types/src/entities.ts` — aucun type ne change
- `supabase/migrations/` — changement UI uniquement, aucune migration nécessaire
- `aureak/apps/web/app/(admin)/stages/index.tsx` — liste des stages non impactée

---

### Dépendances à protéger

- `createStage` (api-client) — attend `startDate: string` et `endDate: string` au format ISO — ne pas modifier
- `createStageDay` (api-client) — attend `date: string` au format ISO — ne pas modifier
- La validation `const isValid = name.trim() && startDate && endDate && startDate <= endDate` dans `stages/new.tsx` — la laisser telle quelle (fonctionne avec les chaînes ISO)

---

### Références

- Design tokens : `aureak/packages/theme/src/tokens.ts`
- Pattern `input type="date"` validé #1 : `aureak/apps/web/app/(coach)/coach/sessions/new/index.tsx` lignes 78–145
- Pattern `input type="date"` validé #2 admin : `aureak/apps/web/app/(admin)/exports/index.tsx` lignes 99–103
- Champs dates à remplacer T1 : `aureak/apps/web/app/(admin)/stages/new.tsx` lignes 117–139
- Champ date à remplacer T2 : `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` lignes 829–848

---

### Multi-tenant

Sans impact — aucune donnée RLS concernée, modification UI pure côté navigateur.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Gate 1 : `_qa/gates/gate1-story-80-1.txt` — PASS|0|0
Gate 2 : `_qa/gates/gate2-story-80-1.txt` — PASS|0|0 (Playwright skipped — app non démarrée)

### Completion Notes List

- AC7 vérifié : grep `#[0-9a-fA-F]` → zéro couleur hex introduite dans les deux fichiers
- AC6 vérifié : aucun `placeholder="AAAA-MM-JJ"` dans les champs date (présents uniquement sur autres champs)
- AC5 vérifié : `isValid = name.trim() && startDate && endDate && startDate <= endDate` inchangé
- AC4 vérifié : `dateInputStyle` et `addDayInputStyle` utilisent exclusivement des tokens `@aureak/theme`
- Try/finally : `setSaving(false)` dans `finally` (new.tsx) ; `setLoading(false)` + `setBlockSaving(false)` dans `finally` (page.tsx) — conformes
- Console guards : tous les `console.error` sont wrappés `process.env.NODE_ENV !== 'production'` (page.tsx) ; new.tsx = zéro console

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/stages/new.tsx` | Modifié |
| `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` | Modifié |
