# Story 73.1 : Sidebar — suppression headers de groupe redondants + renommage Méthodologie

Status: done

## Story

En tant qu'admin de l'académie Aureak,
je veux que la sidebar ne répète pas les labels de section au-dessus de chaque item individuel,
afin que la navigation soit plus claire et moins chargée visuellement.

## Acceptance Criteria

1. Les headers de section `DASHBOARD`, `ACTIVITÉ` et `MÉTHODE` sont supprimés de la sidebar — ces groupes ne comportaient qu'un ou peu d'items et leur label était redondant avec l'icône et le texte de l'item lui-même.
2. L'item précédemment intitulé `Entraînements` (href `/methodologie/seances`) est renommé en `Méthodologie` dans la sidebar — le href reste inchangé.
3. Les items `Thèmes` (href `/methodologie/themes`) et `Situations` (href `/methodologie/situations`) sont retirés de la sidebar — ils restent accessibles depuis la page Méthodologie elle-même.
4. Les sections `Académie`, `Évènements`, `Développement` et `Performance` conservent leurs headers de groupe et leurs items sans modification.
5. La sidebar reste pleinement fonctionnelle en mode étendu et en mode réduit (icône seule) — aucune régression de navigation.
6. Le fichier `_layout.tsx` compile sans erreur TypeScript (`npx tsc --noEmit`).

## Tasks / Subtasks

- [x] T1 — Restructuration NAV_GROUPS dans `_layout.tsx` (AC: 1, 2, 3)
  - [x] T1.1 — Supprimer le groupe `{ label: 'Dashboard', items: [{ label: 'Dashboard', ... }] }` et intégrer l'item Dashboard directement — ou simplifier en fusionnant les 3 premiers groupes en un groupe sans label (label vide `''` ou sans section header rendu)
  - [x] T1.2 — Supprimer le groupe `{ label: 'Activité', items: [{ label: 'Activités', ... }] }` de la même façon
  - [x] T1.3 — Dans le groupe `Méthode` : renommer l'item `Entraînements` → `Méthodologie`, retirer les items `Thèmes` et `Situations`, supprimer le label de groupe `Méthode`
  - [x] T1.4 — Vérifier que les groupes `Académie`, `Évènements`, `Développement`, `Performance` sont inchangés

- [x] T2 — Vérification rendu sidebar (AC: 5)
  - [x] T2.1 — Confirmer que la sidebar n'affiche plus les headers DASHBOARD / ACTIVITÉ / MÉTHODE
  - [x] T2.2 — Confirmer que l'item `Méthodologie` pointe bien vers `/methodologie/seances`
  - [x] T2.3 — Confirmer que `Thèmes` et `Situations` n'apparaissent plus dans la sidebar

- [x] T3 — Validation TypeScript (AC: 6)
  - [x] T3.1 — `cd aureak && npx tsc --noEmit` — zéro nouvelle erreur introduite par ce changement (4 erreurs pré-existantes dans methodologie/seances/index.tsx sans lien avec cette story)

- [ ] T4 — QA Playwright (AC: 5)
  - [ ] T4.1 — Vérifier que l'app tourne : `curl -s -o /dev/null -w "%{http_code}" http://localhost:8081`
  - [ ] T4.2 — Naviguer vers `http://localhost:8081/(admin)/dashboard`
  - [ ] T4.3 — Screenshot sidebar pour confirmer l'absence des headers redondants et la présence de `Méthodologie`
  - [ ] T4.4 — Cliquer sur `Méthodologie` → vérifier la navigation vers `/methodologie/seances`
  - [ ] T4.5 — Vérifier zéro erreur JS console

## Dev Notes

### Contraintes Stack

- Fichier cible : `aureak/apps/web/app/(admin)/_layout.tsx`
- Structure actuelle : `NAV_GROUPS: NavGroup[]` — tableau de `{ label: string; items: NavItem[] }`
- Le label du groupe est affiché comme header de section dans la sidebar (séparateur visuel + texte uppercase)
- Aucune migration DB, aucun changement d'API, aucun changement de routing

### Approche recommandée

Trois options pour supprimer les headers visuels sans casser le typage `NavGroup` :

**Option A (recommandée) — label vide `''`** : Conserver la structure `NavGroup` mais passer `label: ''` sur les 3 groupes concernés. La logique de rendu sidebar doit déjà gérer `label` vide ou court-circuiter l'affichage si `label === ''`. Vérifier le composant de rendu sidebar avant d'appliquer.

**Option B — fusion en un seul groupe** : Regrouper Dashboard + Activités + Méthodologie dans un seul groupe `{ label: '', items: [...] }`. Plus propre si la sidebar rend correctement un groupe sans header.

**Option C — suppression du header conditionnel** : Si le rendu est inline dans `_layout.tsx`, ajouter une condition `{group.label && <SectionHeader />}`.

Consulter le code de rendu dans `_layout.tsx` (à partir de la ligne ~300+) pour choisir l'approche correcte selon l'implémentation existante.

### État actuel NAV_GROUPS (lignes 105–157)

```typescript
// Groupes à simplifier (supprimer header) :
{ label: 'Dashboard', items: [{ label: 'Dashboard', href: '/dashboard', Icon: HomeIcon }] }
{ label: 'Activité',  items: [{ label: 'Activités', href: '/activites', Icon: CalendarDaysIcon }] }
{
  label: 'Méthode',
  items: [
    { label: 'Entraînements', href: '/methodologie/seances',    Icon: BookOpenIcon },  // → renommer 'Méthodologie'
    { label: 'Thèmes',        href: '/methodologie/themes',     Icon: TagIcon },       // → retirer
    { label: 'Situations',    href: '/methodologie/situations', Icon: LayersIcon },    // → retirer
  ],
}

// Groupes à conserver intacts :
{ label: 'Académie',      items: [...] }
{ label: 'Évènements',    items: [...] }
{ label: 'Développement', items: [...] }
{ label: 'Performance',   items: [...] }
```

### Résultat attendu NAV_GROUPS

```typescript
// Un groupe sans header (ou label vide) regroupant les 3 items individuels :
{
  label: '',
  items: [
    { label: 'Dashboard',    href: '/dashboard',           Icon: HomeIcon },
    { label: 'Activités',    href: '/activites',           Icon: CalendarDaysIcon },
    { label: 'Méthodologie', href: '/methodologie/seances', Icon: BookOpenIcon },
  ],
},
// Groupes avec header conservés :
{ label: 'Académie',      items: [...] },
{ label: 'Évènements',    items: [...] },
{ label: 'Développement', items: [...] },
{ label: 'Performance',   items: [...] },
```

### Icônes à conserver / retirer

- `TagIcon` et `LayersIcon` peuvent rester importés (utilisés potentiellement ailleurs) — ne pas retirer les imports si non confirmé inutilisés
- `BookOpenIcon` reste (utilisé pour Méthodologie)

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier | Restructuration NAV_GROUPS uniquement |

### Fichiers à NE PAS modifier

- `aureak/packages/theme/src/tokens.ts` — non impacté
- `aureak/packages/types/src/entities.ts` — aucun type concerné
- `aureak/packages/api-client/src/` — aucune API concernée
- Tout autre fichier — cette story est limitée à `_layout.tsx`

### Dépendances

Aucune dépendance externe. Cette story est indépendante et n'a pas de prérequis.

### Multi-tenant

Non applicable — modification purement UI/navigation, aucune donnée ni logique métier modifiée.

### Références

- Fichier cible : `aureak/apps/web/app/(admin)/_layout.tsx`
- Structure NAV_GROUPS : lignes 105–157

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
| `aureak/apps/web/app/(admin)/_layout.tsx` | À modifier |
