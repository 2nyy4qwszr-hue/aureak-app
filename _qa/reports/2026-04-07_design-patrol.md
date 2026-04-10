# Design Patrol — 2026-04-07

## Résumé

- Pages scannées : 14
- BLOCKER détectés : 3
- WARNING détectés : 11
- Pages conformes : 4

---

## Dérives par page

### /(admin)/activites/components/TableauSeances.tsx

🔴 **BLOCKER** — Couleurs hardcodées (non-token) pour les avatars coach
→ Fichier : `TableauSeances.tsx`
→ Ligne 133 : `const ALPHA_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']`
→ Observé : 5 couleurs hex inline hors token system
→ Attendu : Palette de couleurs dans `@aureak/theme` (ex. `colors.entity.*` ou tokens dédiés avatars)

⚠️ **WARNING** — Couleurs hardcodées texte sur avatar
→ Fichier : `TableauSeances.tsx`
→ Ligne 545 : `color: '#FFFFFF'` sur `avatarText`
→ Attendu : `colors.dark.text` ou token blanc existant

⚠️ **WARNING** — Couleurs statut planifiée/en_cours hardcodées
→ Fichier : `TableauSeances.tsx`
→ Lignes 67–68 : `text: '#1D4ED8'` (planifiée) et `text: '#92400E'` (en_cours)
→ Attendu : extraire vers des tokens `colors.status.infoText` et `colors.status.warningText`

⚠️ **WARNING** — Rows du tableau sans transition hover
→ Fichier : `TableauSeances.tsx`
→ Lignes 341–358 : `Pressable` sans `transition` ni retour visuel hover
→ Attendu : `transitions.fast` (150ms) sur les rows cliquables, retour visuel au survol

---

### /(admin)/activites/presences/page.tsx

🔴 **BLOCKER** — Carte "Tendance Globale" avec fond dark dans une section light
→ Fichier : `presences/page.tsx`
→ Lignes 152–158, cardStyles.cardDark : `backgroundColor: colors.dark.surface` inlinée dans une row de stat cards (fond light)
→ Observé : Mélange fond dark (#1A1A1A environ) sur une page fond clair `colors.light.primary`
→ Attendu : Toutes les stat cards devraient être sur fond `colors.light.surface` avec accent gold pour la différenciation. Utiliser `borderColor: colors.accent.gold` + gold text si mise en valeur nécessaire.

⚠️ **WARNING** — Couleur hardcodée texte sur badge rouge
→ Fichier : `presences/page.tsx`
→ Ligne 249 : `color: '#FFFFFF'` sur `badgeRedText`
→ Attendu : token blanc (ex. `colors.dark.text`)

⚠️ **WARNING** — Couleur hardcodée `#18181B` sur heatmap player
→ Fichier : `presences/page.tsx`
→ Ligne 729 : `color: '#18181B'`
→ Attendu : `colors.text.dark` (déjà défini à `#18181B` dans les tokens, à utiliser via token)

---

### /(admin)/activites/evaluations/page.tsx

⚠️ **WARNING** — Stat card "Top Performer" avec fond dark (`statCardDark`)
→ Fichier : `evaluations/page.tsx`
→ Lignes 133–136 : `statCardDark` avec `backgroundColor: colors.dark.surface`
→ Même dérive que dans presences — fond dark dans contexte light. Utiliser un traitement gold plutôt que dark.

⚠️ **WARNING** — `borderRadius: 16` hardcodé sur playerSummaryCard
→ Fichier : `evaluations/page.tsx`
→ Ligne 809 : `borderRadius: 16` (valeur numérique inline)
→ Attendu : `radius.card` (token existant à 16px, valeur identique mais doit passer par le token)

---

### /(admin)/activites/components/ActivitesHeader.tsx

⚠️ **WARNING** — Couleur hardcodée `#18181B` sur le bouton "Nouvelle séance"
→ Fichier : `ActivitesHeader.tsx`
→ Ligne 105 : `color: '#18181B'` sur `newBtnText`
→ Attendu : `colors.text.dark`

⚠️ **WARNING** — Header sans `paddingBottom` visible — underline onglet actif coupé visuellement
→ Fichier : `ActivitesHeader.tsx`
→ Ligne 82 : `tabItem` n'a que `paddingBottom: space.sm`. L'underline absolue (bottom:0) peut être masquée par la `borderBottomWidth` du container.
→ Attendu : Vérifier que l'underline active est visible — ajouter `paddingBottom: space.md` sur `tabItem` si nécessaire.

---

### /(admin)/evenements/page.tsx

🔴 **BLOCKER** — `Text` natif React Native utilisé à la place de `AureakText`
→ Fichier : `evenements/page.tsx`
→ Lignes 57, 66, 286, 303, 338, 361 : `<Text style={...}>` au lieu de `<AureakText>`
→ Observé : `import { ..., Text, ... } from 'react-native'` (ligne 6), utilisé directement pour les pills, filtres et icônes empty state
→ Attendu : Typographie UNIQUEMENT via `AureakText` (principe 12 du design system). `Text` natif bypasse les styles de typographie globaux (font Montserrat non appliquée).

⚠️ **WARNING** — `borderRadius: 20` et `borderRadius: 999` hardcodés sur les pills
→ Fichier : `evenements/page.tsx`
→ Lignes 420, 432 : `borderRadius: 20` (filterPill) et `borderRadius: 999` (pill inline)
→ Attendu : `radius.badge` ou `radius.button` selon les tokens définis

---

### /(admin)/children/index.tsx

⚠️ **WARNING** — Couleurs hardcodées `#fff` et `#10B981`/`#9E9E9E` pour actif/inactif
→ Fichier : `children/index.tsx`
→ Lignes 132, 462, 1779 : `color: '#fff'` (initiales avatars, bouton toggle)
→ Lignes 2072–2073 : `backgroundColor: child.actif ? '#10B981' : '#9E9E9E'` et `color: child.actif ? '#10B981'`
→ Attendu : `colors.dark.text` (blanc), `colors.status.success` (vert), `colors.text.subtle` (gris neutre)

---

### /(admin)/children/[childId]/page.tsx

⚠️ **WARNING** — Couleurs hardcodées multiples
→ Fichier : `children/[childId]/page.tsx`
→ Ligne 335 : `bg: '#2A2006', textColor: '#FFE566'` (Elite tier badge) — valeurs proches des tokens gold mais non référencées
→ Lignes 425, 435, 446 : `color: '#fff'` / `color: '#ffffff'` répétés
→ Ligne 1424 : `color: '#fff'` inline dans JSX
→ Ligne 2146 : `color: '#fff'` inline
→ Attendu : Toutes ces valeurs via `colors.dark.text` ou token blanc. Pour Elite : token de niveau `gamification.tiers.elite` à créer/utiliser.

---

### /(admin)/developpement/prospection/page.tsx
### /(admin)/developpement/marketing/page.tsx
### /(admin)/developpement/partenariats/page.tsx

Pages conformes au design system light — tokens utilisés correctement, pas de couleur hardcodée, fond `colors.light.primary`, cards `colors.light.surface` avec `shadows.sm`. Pattern KPI placeholder cohérent sur les 3 pages.

---

### /(admin)/activites/page.tsx
### /(admin)/activites/components/FiltresScope.tsx

Pages conformes. Tous les styles passent par les tokens `@aureak/theme`. `FiltresScope` utilise des fonctions `pillStyle()` et `pillTextStyle()` dynamiques correctement basées sur tokens. `ActivitesPage` : fond `colors.light.primary`, padding via `space.*`.

---

### /(admin)/dashboard/page.tsx

Page conforme au design bento validé. Utilise `colors.dark.surface` intentionnellement pour les tiles hero et la date card (pattern validé Story 50-11). Pas de couleurs hardcodées hex détectées. Structure bento CSS grid avec tokens `radius.card`, `shadows.md`. Skeleton conforme.

---

## Actions recommandées

| Priorité | Page | Fichier | Action |
|----------|------|---------|--------|
| P1 | /activites (tableau) | `TableauSeances.tsx:133` | Extraire `ALPHA_COLORS` vers tokens `@aureak/theme` (avatars palette) |
| P1 | /activites/presences | `presences/page.tsx:152` | Remplacer card dark "Tendance Globale" par card light avec accent gold |
| P1 | /evenements | `evenements/page.tsx:57,66,286,303,338,361` | Remplacer tous les `<Text>` par `<AureakText>` |
| P2 | /activites (tableau) | `TableauSeances.tsx:67-68` | Extraire `#1D4ED8` et `#92400E` vers tokens status |
| P2 | /activites/evaluations | `evaluations/page.tsx:133` | Remplacer statCardDark par card light + accent gold pour "Top Performer" |
| P2 | /activites (tableau) | `TableauSeances.tsx` | Ajouter retour visuel hover sur les rows `Pressable` (transitions.fast) |
| P2 | /children/[childId] | `[childId]/page.tsx:335` | Utiliser tokens gamification.tiers.elite pour le badge Elite |
| P3 | /activites/presences | `presences/page.tsx:249,729` | Remplacer `'#FFFFFF'` et `'#18181B'` par tokens |
| P3 | /activites/evaluations | `evaluations/page.tsx:809` | Remplacer `borderRadius: 16` par `radius.card` |
| P3 | /activites/components | `ActivitesHeader.tsx:105` | Remplacer `'#18181B'` par `colors.text.dark` |
| P3 | /children | `children/index.tsx:132,2072` | Remplacer `'#fff'`, `'#10B981'`, `'#9E9E9E'` par tokens status |
| P3 | /evenements | `evenements/page.tsx:420,432` | Remplacer `borderRadius: 20/999` par `radius.badge` |

---

## Pages conformes ✅

- `/(admin)/activites/page.tsx` — fond light, tokens corrects, structure propre
- `/(admin)/activites/components/FiltresScope.tsx` — pills dynamiques via tokens, dropdowns conformes
- `/(admin)/developpement/prospection/page.tsx` — placeholder KPI conforme
- `/(admin)/developpement/marketing/page.tsx` — placeholder KPI conforme
- `/(admin)/developpement/partenariats/page.tsx` — placeholder KPI conforme
- `/(admin)/dashboard/page.tsx` — bento validé, dark tiles intentionnelles (pattern Story 50-11)

---

## Chiffres

| Métrique | Valeur |
|----------|--------|
| BLOCKER | 3 |
| WARNING | 11 |
| Pages inspectées | 14 |
| Pages conformes | 6 |

---

---

## Inspection visuelle Playwright — 2026-04-07 (run complémentaire)

App démarrée sur http://localhost:8081. 6 pages scannées via Chrome DevTools MCP.

### Dashboard (`/`)

**Statut visuel : CONFORME**
- Fond beige `#F0EBE1` correct, sidebar dark `#111111` correct
- Cards blanches avec ombres légères, structure lisible
- KPIs (96 joueurs, 4 coachs, 0 créneaux, 0 sites) bien affichés
- Section "Prochaine séance" et "Progression académie" présentes
- Aucune erreur console

Observations visuelles :
- La page n'est pas encore le bento DLS 3 colonnes validé — c'est encore une mise en page linéaire avec sidebar + contenu vertical. La tile hero gardien + bento asymétrique définie dans le prototype `desktop-admin-bento-v2.html` n'est pas implémentée.
- ⚠️ WARNING : Absence de tile hero visuelle (photo gardien) — principe 1 du dashboard validé (col 1, rows 1-2 tall avec fond `#2A2827`)

### Joueurs (`/children`)

**Statut visuel : CONFORME (design ambitieux en place)**
- Cards joueurs avec background travaillé (photo terrain + overlay), bordure gold
- Nom joueur en bold blanc sur fond sombre — pattern card FUT/Sorare en place
- Photo/avatar découpé en haut de carte — principe 5 respecté
- Grille de 4 colonnes, bonne densité
- Tabs statut fonctionnels (Tous, Prospect, Académicien, Confirmé, Elite)
- Aucune erreur console

Observations :
- ✅ Page la plus conforme au design vision — cards avec depth, gold accent, personnage hors cadre
- ⚠️ WARNING : Fond des cards semble utiliser un gradient sombre (acceptable car intentionnel pour les cards joueurs), mais vérifier que c'est bien `#2A2827` et non un gradient violet/bleu

### Activités — Séances (`/activites`)

**Statut visuel : CONFORME**
- Fond beige `#F0EBE1`, header "ACTIVITÉS" en typo bold
- Tabs Séances / Présences / Évaluations visibles
- Pills filtres (Global, Implantation, Groupe, Joueur, Aujourd'hui/À venir/Passées)
- 4 KPI cards blanches avec ombres légères : "0% Présence moyenne", "0 Total séances", "0 Anomalies", "0% Séances complétées"
- Empty state propre : "Aucune séance aujourd'hui. Consultez l'onglet À VENIR..."
- Aucune erreur console

Observations :
- ⚠️ WARNING : Les KPI cards ont toutes la même taille et le même style — la card "Tendance" référencée dans le rapport statique comme card dark n'est pas visible ici (aucune séance active). À surveiller quand des données sont présentes.

### Stages (`/stages`)

**Statut visuel : GLOBALEMENT CONFORME**
- Fond beige correct, liste cards stages avec fond blanc
- Pills statut colorés (Planifiée en vert/gold, Terminé en gris)
- Layout 3 colonnes, cards avec infos dates/participants, bouton "Planifier"
- Aucune erreur console

Observations :
- ✅ Bonne lisibilité, typographie cohérente
- ⚠️ WARNING : Cards stages en flat design — ombres très légères ou absentes visuellement. Principe 3 (profondeur obligatoire) à renforcer : shadow `0 2px 8px rgba(0,0,0,0.08)` attendue
- ⚠️ WARNING : Pas de tile hero ou visuel d'ambiance — page liste fonctionnelle mais sans identité visuelle forte (photos terrains absentes, principe 6)

### Clubs (`/clubs`)

**Statut visuel : CONFORME avec réserve**
- Cards clubs avec fond clair + bordure gold circulaire autour du logo
- Nom club bold, ville + province, badges "ACADÉMICIEN × L'ACADÉMIE" en gold
- Grille 4 colonnes propre
- Aucune erreur console

Observations :
- ✅ Cards avec depth correct, gold accent bien utilisé pour les badges
- ⚠️ WARNING : Le fond des cards semble légèrement grisé (pas pure `#FFFFFF`) — pourrait être un background image ou gradient subtil sur les cards — vérifier que ce n'est pas du glassmorphism (`backdrop-filter`)
- ⚠️ WARNING : Texte blanc sur fond sombre dans les badges "ACADÉMICIEN × L'ACADÉMIE" — acceptable car le badge est gold foncé, mais vérifier la valeur exacte de la couleur fond du badge

### Méthodologie (`/methodologie`)

**Statut visuel : CONFORME**
- Fond beige correct, header "Méthodologie" en bold
- Encart "Thème de la semaine" avec titre bold + description + barre de progression dorée
- 4 sections cards : Séances Pédagogiques, Situations, Thèmes, Groupes Thématiques
- Aucune erreur bloquante (1 warning `style.resizeMode deprecated` — non bloquant)

Observations :
- ✅ Présentation claire, bonnes cards blanches avec ombres
- ⚠️ WARNING : Cards sections trop petites et flat — icons emoji (📚, 🎯, etc.) au lieu de pictos vectoriels. Principe 4 (pictos navigation simples reconnaissables) partiellement respecté mais emoji = cheap visuellement
- ⚠️ WARNING : La page n'a pas de tile hero visuelle — un visuel d'ambiance (terrain, exercice) renforcerait le sentiment "univers académie"

---

## Récapitulatif Playwright

| Page | Statut visuel | BLOCKERs visuels | WARNINGs visuels |
|------|--------------|-----------------|-----------------|
| `/` (dashboard) | ⚠️ Partiel | 0 | 1 (tile hero manquante) |
| `/children` | ✅ Conforme | 0 | 1 (gradient à vérifier) |
| `/activites` | ✅ Conforme | 0 | 1 (card dark à surveiller) |
| `/stages` | ⚠️ Partiel | 0 | 2 (flat, pas de photos) |
| `/clubs` | ✅ Conforme | 0 | 2 (fond cards, badges) |
| `/methodologie` | ✅ Conforme | 0 | 2 (emoji, pas de hero) |

**Aucun BLOCKER visuel détecté lors du scan Playwright.**
Les BLOCKERs identifiés dans la section précédente (code source) restent valides.

---

*Généré par Design Patrol Agent — 2026-04-07*
*Inspection statique (code source) + inspection visuelle Playwright (Chrome DevTools MCP)*
