# Story 99.1 — Hub `/administration` + structure navigation 5 groupes

Status: done

## Metadata

- **Epic** : 99 — Administration restructuration
- **Story ID** : 99.1
- **Story key** : `99-1-hub-administration-structure-nav`
- **Priorité** : P1 (prérequis structurel)
- **Dépendances** : **97.3** (AdminPageHeader v2) ; **bloque 99.2, 99.3-6**
- **Source** : Audit UI 2026-04-22. La zone Administration (accès via bas de sidebar) n'a pas de hub structuré — les ~15 pages sont dispersées entre racine et sous-dossiers sans nav cohérente.
- **Effort estimé** : M (~4-6h — création hub + nav secondaire + cadrage permissions)

## Story

As an admin,
I want une page hub `/administration` qui liste visuellement les 5 groupes de sections admin (Utilisateurs & accès, Paramètres académie, Conformité, Communication, Exports) avec une nav secondaire cohérente,
So that j'aie un point d'entrée clair vers toutes les pages de gestion administrative de l'académie.

## Contexte

### État actuel

Aucun hub `/administration`. L'accès se fait via :
- Bouton "Administration" en bas de sidebar (cf. capture utilisateur 18 du 2026-04-22)
- URL racine `/users` (par défaut `nav-config.ts:60`) — à remplacer

### Groupes cibles

| Groupe | Pages concernées |
|---|---|
| **Utilisateurs & accès** | profile, access-grants, grade-permissions, waitlist, onboarding |
| **Paramètres académie** | settings/permissions, settings/school-calendar |
| **Conformité (RGPD & Audit)** | gdpr, audit, anomalies, admin/rgpd/prospect-access |
| **Communication** | tickets, tickets/[id], messages |
| **Exports** | exports |

### Pattern de nav

Plusieurs options :
- **A** — Grid de cartes sur le hub : 5 grandes cartes cliquables, chacune menant à la sous-section (ou à la première page du groupe)
- **B** — Tabs horizontaux au-dessus du contenu : 5 onglets, le contenu de la page hub montre une vue globale
- **C** — Sidebar secondaire (comme VSCode) : 5 sections verticales cliquables à gauche, contenu à droite

**Recommandation** : **A (cartes grid)** pour le hub + breadcrumbs `Administration / <Groupe> / <Page>` sur chaque page enfant. Simple à implémenter, cohérent avec le dashboard bento.

## Acceptance Criteria

1. **Page `/administration/page.tsx`** créée :
   - `<AdminPageHeader title="Administration" />` (pas d'eyebrow, pas de subtitle)
   - Grid de 5 cartes (responsive : 2 cols tablet, 3 cols desktop, 1 col mobile)
   - Chaque carte :
     - Icône représentative (Users, Settings, Shield, MessageSquare, Download)
     - Titre du groupe
     - Description courte (1 ligne)
     - Count éventuel (ex. "3 tickets en attente")
     - Au clic : navigate vers la première page du groupe

2. **Cartes** :
   - Carte 1 — "Utilisateurs & accès" → `/administration/utilisateurs` (ou route racine du groupe si hub de groupe existe)
   - Carte 2 — "Paramètres académie" → `/administration/parametres`
   - Carte 3 — "Conformité (RGPD & Audit)" → `/administration/conformite`
   - Carte 4 — "Communication" → `/administration/communication`
   - Carte 5 — "Exports" → `/administration/exports`

3. **`index.tsx`** re-export de `page.tsx` (pattern Expo Router).

4. **Sidebar nav-config** (`lib/admin/nav-config.ts:60`) : mettre à jour `admin` entry :
   ```typescript
   admin: { label: 'Administration', href: '/administration', Icon: UserIcon }
   ```
   (Le composant `UserIcon` reste jusqu'à ce qu'un meilleur picto "settings" soit retenu.)

5. **Composant `<AdministrationHubCard />`** : extraire la carte dans un composant réutilisable `components/admin/administration/AdministrationHubCard.tsx`. Props : `{ icon, title, description, count?, href }`.

6. **Placeholder pour sous-hub de groupe** (optionnel) : si le dev estime que chaque groupe mérite aussi un hub intermédiaire (`/administration/utilisateurs` = grid des 5 pages du groupe), l'implémenter dans une story 99.1b séparée. Dans 99.1, les cartes du hub principal peuvent pointer directement vers la **première page** de chaque groupe (ex. `/administration/utilisateurs/profile`) en attendant.

7. **Navigation depuis pages enfants** : breadcrumb ou lien "← Administration" sur chaque page de 99.3-99.6 (implémenté dans ces stories). Dans 99.1, prévoir le pattern.

8. **Permissions** : le hub et chaque page enfant sont restreintes au rôle `admin` uniquement (cf. RBAC). Vérifier que les helpers de permission actuels s'appliquent.

9. **Styles tokenisés** : 0 hex hardcodé.

10. **Conformité CLAUDE.md** : tsc OK, patterns Expo Router, api-client si counts fetch.

11. **Test Playwright** :
    - `/administration` charge hub
    - 5 cartes visibles
    - Click sur chaque carte → navigation
    - Responsive OK
    - Console zéro erreur

12. **Non-goals explicites** :
    - **Pas de migration URL des pages enfants** (99.2)
    - **Pas de refonte fonctionnelle** des pages enfants
    - **Pas de modification RBAC** profonde — juste usage des helpers existants

## Tasks / Subtasks

- [ ] **T1 — Page hub** (AC #1, #2, #3)
  - [ ] Créer `page.tsx` + `index.tsx`
  - [ ] Header v2 + grid cartes

- [ ] **T2 — Composant `<AdministrationHubCard />`** (AC #5)
  - [ ] Créer `components/admin/administration/AdministrationHubCard.tsx`
  - [ ] Props + design

- [ ] **T3 — Mise à jour nav-config sidebar** (AC #4)
  - [ ] Ligne 60 href `/administration`

- [ ] **T4 — Counts optionnels** (AC #1)
  - [ ] Si facile : fetch counts par groupe (ex. tickets en attente)
  - [ ] Sinon : pas de count initial

- [ ] **T5 — QA** (AC #9-11)
  - [ ] Tsc OK, Playwright, screenshots

## Dev Notes

### Cadre permissions

Toutes les pages Administration = admin-only. Vérifier que le `_layout.tsx` racine admin applique bien les guards RBAC (via `current_user_role()` RLS côté DB + check UI). Pas besoin d'ajouter de logique — juste valider empiriquement au QA.

### Counts par groupe (optionnel)

Ex. :
- Utilisateurs & accès → count `profiles WHERE user_role = 'admin' AND created_this_month` ?
- Communication → count tickets status = 'open'
- Exports → count exports générés ce mois

Si pas trop coûteux → les afficher ; sinon laisser sans count.

### Convention URL enfants

Le pattern proposé :
```
/administration/utilisateurs/profile
/administration/utilisateurs/access-grants
/administration/parametres/permissions
/administration/conformite/rgpd
/administration/communication/tickets
...
```

2 niveaux : groupe + page. Raisonnable vs tout plat `/administration/<page>` (moins lisible avec 15 pages).

Les migrations URL concrètes sont traitées par 99.2.

### References

- Référence nav hub : MEMORY.md `project_design_dashboard.md`
- nav-config : `lib/admin/nav-config.ts:60`
- Header : `components/admin/AdminPageHeader.tsx` (v2)
- Capture sidebar : user image 18, 2026-04-22 (bouton Administration bas sidebar)
