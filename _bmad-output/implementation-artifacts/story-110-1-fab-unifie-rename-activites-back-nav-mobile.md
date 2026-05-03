# Story 110.1 : FAB unifié sur 4 onglets Activités + rename "Activités" + suppression back-nav mobile détail séance

Status: done

## Story

En tant qu'**admin**,
je veux **un FAB « + » identique sur les 4 onglets de la section Activités, un onglet hub clairement nommé « Activités », et plus de back-nav « Séance » qui pollue le top mobile**,
afin de **comprendre du premier coup d'œil quel est l'onglet actif et comment créer rapidement quelque chose, sans réapprendre une UI différente par onglet ni perdre de l'écran à un fil de navigation redondant sur mobile**.

## Contexte

Section Activités = 4 onglets : Vue d'ensemble · Séances · Présences · Évaluations.

État actuel (post-epic 108) :

1. `/activites` (hub) : FAB mobile « + Nouvelle séance » via `<PrimaryAction>` ✅
2. `/activites/seances` : bouton pilule « + Nouvelle séance » dans un header local ❌
3. `/activites/presences` : bouton pilule « + Nouvelle séance » via `ActivitesHeader.tsx` ligne 55 (`isMobile && activeTab !== 'overview' && activeTab !== 'seances'`) ❌
4. `/activites/evaluations` : aucune action de création visible ❌

Trois patterns différents pour la même action « + », plus un onglet sans CTA. Le but : tout passe par `<PrimaryAction label="..." onPress={...} />` (FAB mobile auto, no-op desktop) avec le bouton desktop équivalent en `<AdminPageHeader actionButton={...}>`.

Par ailleurs, l'onglet hub s'appelle « VUE D'ENSEMBLE » dans `ActivitesHeader.TABS`. La section parente du menu s'appelle déjà « Activités ». Quand l'admin est dans `/activites` il voit « Activités » dans la sidebar et « VUE D'ENSEMBLE » dans le header → confusion. Le label devient simplement « ACTIVITÉS ».

Enfin, le détail d'une séance `/activites/seances/[sessionId]` affiche sur mobile une zone de retour avec le mot « Séance » en haut. À retirer (pattern desktop = pas de back-nav). L'utilisateur revient via le burger drawer ou le geste navigateur natif.

## Acceptance Criteria

- **AC1 — Rename onglet hub** : dans `aureak/apps/web/components/admin/activites/ActivitesHeader.tsx`, l'entrée TABS `key: 'overview'` a `label: 'ACTIVITÉS'` (au lieu de `"VUE D'ENSEMBLE"`). Aucune autre modification du composant. Le tab actif sur `/activites` affiche donc « ACTIVITÉS » en gras + underline gold.
- **AC2 — FAB Séances** : sur `/activites/seances` mobile, un FAB « Nouvelle séance » est rendu en bas-droite via `<PrimaryAction label="Nouvelle séance" onPress={() => router.push('/activites/seances/new' as never)} />`. Le bouton actuel « + Nouvelle séance » dans la page Séances (s'il en reste un) est retiré. Sur desktop, le bouton « + Nouvelle séance » est rendu via `<AdminPageHeader actionButton={...}>` (ou conserve sa position actuelle si elle utilise déjà ce pattern).
- **AC3 — FAB Présences** : sur `/activites/presences` (alias) et `/presences` (page principale `app/(admin)/presences/page.tsx`), un FAB « Saisir présences » est rendu sur mobile, qui route vers la création de séance OU vers la page de saisie présence du jour (à confirmer pendant l'impl — voir Tasks). Le bouton « + Nouvelle séance » conditionnel dans `ActivitesHeader.tsx` lignes 55-64 est **supprimé** (retirer le `if (isMobile && activeTab !== 'overview' && activeTab !== 'seances')` et le `<View style={styles.headerTopRow}>`). Sur desktop, action équivalente via `AdminPageHeader actionButton`.
- **AC4 — FAB Évaluations** : sur `/activites/evaluations` mobile, un FAB « Nouvelle évaluation » est rendu, qui route vers le parcours de création évaluation existant (à confirmer dans la story 110.5 ; pour 110.1 on route vers `/activites/evaluations/new` même si la route est en TBD — la story 110.5 fournira le parcours réel).
- **AC5 — Suppression back-nav mobile détail séance** : sur `/activites/seances/[sessionId]` mobile, aucune zone « Séance » avec flèche retour n'est rendue en haut. L'identification de la source (header local de la page, Stack header, breadcrumb, etc.) fait partie de la story — voir Tasks. Sur desktop, comportement inchangé.
- **AC6 — Pas de régression onglets** : les counts (`SubtabCount`) restent affichés sur les onglets Séances/Présences/Évaluations. Le scroll horizontal mobile fonctionne toujours. L'onglet actif (texte noir + underline gold) est correctement appliqué sur la nouvelle valeur `'ACTIVITÉS'`.
- **AC7 — Cohérence visuelle FAB** : les 4 FAB partagent label/icône/position/z-index identiques (même composant `PrimaryAction`, mêmes tokens). Aucun FAB n'est rendu sur desktop (≥ 640px) — confirmé par test Playwright à 1280x800.
- **AC8 — Respect règles Aureak** :
  - Accès Supabase via `@aureak/api-client` uniquement (rien ne devrait être fetché ici, mais au cas où)
  - Styles via `@aureak/theme` tokens
  - Console guards `if (process.env.NODE_ENV !== 'production')`
  - Pas de couleur/spacing hardcodé
  - `page.tsx` = contenu, `index.tsx` = re-export (inchangé)

## Tasks / Subtasks

### 1. Rename onglet hub

- [ ] `aureak/apps/web/components/admin/activites/ActivitesHeader.tsx` :
  - Ligne 16 : remplacer `label: "VUE D'ENSEMBLE"` par `label: 'ACTIVITÉS'`
- [ ] `grep -rn "VUE D'ENSEMBLE\|Vue d'ensemble" aureak/apps/web/` : vérifier qu'aucun test/composant ne dépend de ce label (commentaires OK, mais matchers `getByText('Vue d\'ensemble')` à corriger). Si un test existe, mettre à jour pour matcher « ACTIVITÉS ».

### 2. FAB Séances + suppression bouton header

- [ ] `aureak/apps/web/app/(admin)/activites/seances/page.tsx` :
  - Importer `PrimaryAction` depuis `'../../../../components/admin/PrimaryAction'`
  - Ajouter `<PrimaryAction label="Nouvelle séance" onPress={() => router.push('/activites/seances/new' as never)} />` après le `<ScrollView>` (à la racine du `<View style={styles.container}>`, comme dans `/activites/page.tsx` lignes 41-44)
  - Si la page contient encore un bouton local « Nouvelle séance » → le retirer
- [ ] Vérifier sur desktop qu'un bouton « + Nouvelle séance » existe (header ou top-right). Si pas via `AdminPageHeader`, l'ajouter (ou laisser tel quel si déjà présent — état après 108.2).

### 3. FAB Présences + nettoyage ActivitesHeader

- [ ] `aureak/apps/web/components/admin/activites/ActivitesHeader.tsx` :
  - Supprimer le bloc lignes ~53-64 (commentaire 103.2 + `if (isMobile && activeTab !== 'overview' && activeTab !== 'seances')` + `<View style={styles.headerTopRow}>` + Pressable « + Nouvelle séance »)
  - Supprimer les styles devenus inutilisés : `headerTopRow`, `newBtn`, `newBtnLabel` (lignes ~103-121)
- [ ] `aureak/apps/web/app/(admin)/presences/page.tsx` (page principale, 910 lignes) :
  - Importer `PrimaryAction`
  - Ajouter en bas du composant : `<PrimaryAction label="Saisir présences" onPress={...} />` — la cible exacte est à déterminer (création séance vs saisie séance du jour). Décision : router vers `/activites/seances/new` pour rester cohérent avec les autres FAB (le FAB ne « saisit » pas, il crée le contexte de saisie).
  - **DÉCISION** : pour cette story 110.1, le FAB Présences route vers `/activites/seances/new` (cohérent avec les autres). Si l'admin veut « saisir présences sur séance existante », il passe par la card → drawer (déjà existant). Le label du FAB devient donc `"Nouvelle séance"` aussi (cohérent label+route).

### 4. FAB Évaluations

- [ ] `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` :
  - Importer `PrimaryAction`
  - Ajouter `<PrimaryAction label="Nouvelle évaluation" onPress={() => router.push('/activites/evaluations/new' as never)} />`
  - **NOTE** : la route `/activites/evaluations/new` n'existe peut-être pas encore (à confirmer). Si elle n'existe pas, le clic FAB tombera sur l'écran 404 d'Expo Router → la story 110.5 la créera (ou pointera vers une route existante). Pour 110.1, on pose le FAB avec la route attendue ; la 110.5 résout le parcours.

### 5. Suppression back-nav mobile détail séance

- [ ] Identifier la source du label « Séance » + flèche en haut sur mobile sur `/activites/seances/[sessionId]` :
  - Vérifier `aureak/apps/web/app/(admin)/activites/seances/[sessionId]/page.tsx` (header local)
  - Vérifier `aureak/apps/web/app/_layout.tsx` (Stack.Screen) — actuellement `(admin)` a `headerShown: false`, donc pas le Stack
  - Vérifier `AdminTopbar` MobileTopbar (lignes 67-108 du fichier) — pas de breadcrumb, donc pas là
  - **Hypothèse principale** : un mini-header local dans `[sessionId]/page.tsx` ou un wrapper ; à confirmer en lançant la page sur mobile (375px).
- [ ] Retirer ce header sur mobile (preserver desktop si différent — mais d'après l'utilisateur : déjà retiré desktop).
- [ ] Si le header est utilisé pour afficher le titre/contexte de la séance, le déplacer **dans** le contenu de la page (titre h1 mobile-first) plutôt qu'en barre top.

### 6. QA

- [ ] `cd aureak && npx tsc --noEmit`
- [ ] QA patterns sur fichiers modifiés (try/finally, console guards) — peu de loaders touchés ici
- [ ] Test Playwright mobile (390x844) :
  - `/activites` → tab actif « ACTIVITÉS »
  - `/activites/seances` → FAB visible bas-droite, clic → `/activites/seances/new`
  - `/activites/presences` → FAB visible, plus de bouton pilule en haut
  - `/activites/evaluations` → FAB visible
  - `/activites/seances/[id]` → pas de back-nav « Séance » en haut
- [ ] Test Playwright desktop (1280x800) : aucun FAB rendu, boutons header cohérents
- [ ] Commit : `feat(epic-110): story 110.1 — FAB unifié activités + rename + back-nav mobile`

## Fichiers touchés

### Modifiés
- `aureak/apps/web/components/admin/activites/ActivitesHeader.tsx` (label + suppression bouton conditionnel + styles morts)
- `aureak/apps/web/app/(admin)/activites/seances/page.tsx` (ajout FAB)
- `aureak/apps/web/app/(admin)/presences/page.tsx` (ajout FAB)
- `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` (ajout FAB)
- `aureak/apps/web/app/(admin)/activites/seances/[sessionId]/page.tsx` ou wrapper (suppression back-nav mobile — fichier exact à identifier en task 5)

### Inchangés (rappel)
- `aureak/apps/web/components/admin/PrimaryAction.tsx` — composant déjà OK
- `aureak/apps/web/app/(admin)/activites/page.tsx` — déjà avec FAB

## Notes

- Le label « ACTIVITÉS » utilise le même `textTransform: 'uppercase'` que les autres tabs ; le caractère É majuscule s'écrit littéralement ou via uppercase CSS (les deux marchent — préférer le littéral pour cohérence avec « SÉANCES » et « PRÉSENCES » dans le même array).
- Si la route `/activites/evaluations/new` 404, c'est OK pour 110.1 — la 110.5 résout. Le FAB ne doit PAS être conditionnel sur l'existence de la route.
- Pour le back-nav mobile (task 5), si l'investigation révèle que c'est un comportement Expo Router Stack inhérent à la route dynamique, prévoir une option `<Stack.Screen options={{ headerShown: false }} />` au niveau du layout `[sessionId]/_layout.tsx` ou similaire.
