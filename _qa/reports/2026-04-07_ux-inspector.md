# UX Inspector — Rapport 2026-04-07

**Auditeur :** UX Inspector (agent autonome)
**Date :** 2026-04-07
**App :** http://localhost:8081 (200 OK confirmé)
**Méthode :** Navigation Chrome DevTools + analyse statique code source

---

## Résumé exécutif

5 frictions critiques et 5 frictions majeures identifiées. Le problème le plus impactant est un bug de navigation dans `/activites` : les onglets Présences et Évaluations redirigent vers des pages inattendues (Implantations et Joueurs) au lieu d'afficher leur contenu. Le wizard "Nouvelle séance" est trop long (6 étapes) pour une action courante.

---

## Mesures par flux

### Flux 1 — Créer une séance

| Étape | Action | Clics cumulés |
|-------|--------|---------------|
| 1 | Dashboard visible | 0 |
| 2 | Clic "Activités" sidebar → `/activites` | 1 |
| 3 | Clic "+ Nouvelle séance" | 2 |
| 4–9 | Wizard 6 étapes (Contexte → Détails → Thèmes → Ateliers → Date → Résumé) | 2 + N |

**Total minimum :** 2 clics pour atteindre le formulaire. Le wizard lui-même impose 6 étapes obligatoires pour créer la moindre séance, même basique. Violation du principe "max 3 clics pour toute action courante" sur le flux complet.

**Observation clé :** Depuis le Dashboard, le lien "Voir le planning →" pointe vers `/seances` (planning calendrier), pas vers `/activites`. Ces deux entrées coexistent sans que l'admin comprenne la différence.

---

### Flux 2 — Trouver un joueur

| Étape | Action | Clics cumulés |
|-------|--------|---------------|
| 1 | Clic "Joueurs" sidebar → `/children` | 1 |
| 2 | Saisie dans la recherche | 2 (frappe) |
| 3 | Clic sur la card joueur | 3 |

**Total :** 3 actions — conforme au principe. La page liste est complète et bien structurée (cards visuelles, filtres statut, recherche visible).

**Friction mineure :** La page Joueurs affiche "774 joueurs" dans le titre mais "Tous (50)" dans le premier onglet de tier — ce compteur 50 représente la première page affichée et non un filtre, ce qui crée une confusion immédiate.

---

### Flux 3 — Consulter Activités → Présences

| Étape | Action | Résultat réel |
|-------|--------|---------------|
| 1 | Clic "Activités" sidebar → `/activites` | OK — affiche Séances tab |
| 2 | Clic onglet "PRÉSENCES" | REDIRECT vers `/implantations` |
| 2 bis | Navigation directe `/activites/presences` | REDIRECT vers `/implantations` |
| 2 ter | Navigation directe `/activites/evaluations` | REDIRECT vers `/children` |

**Bug confirmé :** Les deux sous-onglets du hub Activités sont inatteignables.

---

### Flux 4 — Navigation générale (sidebar)

**Points forts :** Sections bien séparées, raccourcis clavier visibles (G D, G I…), indicateur actif doré côté gauche.

**Friction :** La page `/stages` (14 stages existants) n'a aucune entrée dans la navigation latérale.

---

## Grille d'analyse par écran

| Écran | État vide + CTA | Loading visible | Retour accessible |
|-------|----------------|----------------|-------------------|
| Dashboard | Partiel — "Aucune séance prévue" sans CTA création | Oui (splash screen) | N/A |
| Activités / Séances | Oui — message + indirection vers "À VENIR" | Oui | N/A |
| Activités / Présences | NON — page inaccessible (bug redirect) | N/A | N/A |
| Activités / Évaluations | NON — page inaccessible (bug redirect) | N/A | N/A |
| Joueurs | Oui (liste avec données) | Oui | N/A |
| Nouvelle séance (vide) | Oui — "Créer une implantation →" | Oui | Oui — "← Retour" |

---

## Frictions identifiées

### CRITIQUE

**[F-01] Bug : onglets Présences et Évaluations redirigent vers des pages inattendues**
- Clic onglet "PRÉSENCES" dans Activités → redirect vers `/implantations`
- Clic onglet "ÉVALUATIONS" dans Activités → redirect vers `/children`
- Navigation directe par URL produit le même résultat
- Cause : `ActivitesHeader.tsx` utilise `router.push('/(admin)/activites/presences')` — le préfixe `/(admin)/` résout vers une route différente en Expo Router web. Retirer le préfixe et utiliser `router.push('/activites/presences')` suffit à corriger.
- Impact : 2 des 3 onglets du module central Activités sont complètement inaccessibles

**[F-02] "Voir le planning" et "Activités" sont deux entrées séances sans distinction claire**
- Dashboard → "Voir le planning →" → `/seances` (vue calendrier Jour/Semaine/Mois/Année)
- Sidebar → "Activités" → `/activites` (tableau de bord séances + présences + évaluations)
- Un admin non-technique ne peut pas distinguer ces deux espaces — les deux semblent répondre à "voir les séances"
- Impact : désorientation à chaque visite pour les admins nouveaux

**[F-03] Wizard "Nouvelle séance" : 6 étapes pour un cas simple**
- Pour une séance académie basique (groupe existant, date unique), l'admin traverse : Contexte → Détails → Thèmes → Ateliers → Date → Résumé
- Les étapes 3 (Thèmes) et 4 (Ateliers) sont optionnelles côté validation (`step3Valid = true`, `step4Valid = true`) mais l'admin doit quand même les traverser sans possibilité de les sauter
- Principe "max 3 clics" non respecté pour l'action la plus courante de l'admin

### MAJEUR

**[F-04] Activités / Séances : état vide par défaut sans redirection automatique**
- Le filtre temporel par défaut est "AUJOURD'HUI" — or s'il n'y a aucune séance ce jour (cas fréquent), le tableau est vide
- Le message affiché "Aucune séance aujourd'hui. Consultez l'onglet « À VENIR »" suggère une action sans la déclencher
- L'admin doit cliquer manuellement sur "À VENIR" pour voir du contenu utile

**[F-05] Stages accessible mais absent de la sidebar**
- La route `/stages` contient 14 stages et un bouton "+ Nouveau stage" fonctionnel
- Aucune entrée dans la navigation latérale ne pointe vers cette page
- Seul un accès par URL directe ou par mémorisation est possible
- La section "Évènements" de la sidebar pointe vers `/evenements` uniquement

**[F-06] Dashboard : état vide "LA JOURNÉE" sans CTA de création**
- Le bloc "LA JOURNÉE" affiche "Aucune séance prévue aujourd'hui" comme texte statique
- Aucun bouton "Créer une séance" n'est proposé dans ce contexte vide
- Le seul CTA disponible ("Voir le planning →") navigue vers le calendrier, pas vers la création
- Violation de la règle : "tout état vide doit avoir un message + CTA"

**[F-07] Page Joueurs : compteur "Tous (50)" trompeur avec 774 joueurs**
- Le titre page indique "774 joueurs"
- Le premier onglet de filtre tier affiche "Tous (50)" — ce 50 représente les résultats de la première page, pas le total sans filtre tier
- Un admin pense d'abord que seuls 50 joueurs existent avant de comprendre le système de tiers + pagination

**[F-08] Chargement initial — splash screen à chaque navigation**
- Chaque navigation vers une nouvelle page déclenche un splash screen Aureak (logo sur fond noir, ~1-2s)
- Ce comportement est conditionné à `!isAppReady` dans `_layout.tsx` mais semble se déclencher à chaque accès URL direct
- En navigation SPA normale, les transitions ne devraient pas déclencher ce splash complet
- Les redirects non intentionnels de F-01 amplifient ce symptôme : l'admin voit 2× le splash pour une seule action

**[F-09] Formulaires sans attributs id/name (8 occurrences)**
- La console Chrome remonte "A form field element should have an id or name attribute" sur le dashboard
- Les champs sans `id`/`name` ne sont pas identifiables par les gestionnaires de mots de passe ni les lecteurs d'écran
- Présent sur plusieurs pages (8 occurrences relevées sur le dashboard seul)

**[F-10] Sidebar Stages manquant dans section Évènements**
- Mineur mais cohérence de navigation : `/stages` et `/evenements` sont deux sections de gestion d'évènements sans lien entre elles dans la sidebar
- Un admin qui cherche les stages en partant des évènements ne trouve pas

---

## Recommandations par priorité

| Priorité | ID | Action |
|----------|-----|--------|
| P0 | F-01 | Dans `ActivitesHeader.tsx` lignes 12-13, remplacer `'/(admin)/activites/presences'` par `'/activites/presences'` et idem pour evaluations |
| P1 | F-05 | Ajouter `{ label: 'Stages', href: '/stages', Icon: CalendarDaysIcon }` dans la section "Évènements" du tableau `NAV_SECTIONS` dans `_layout.tsx` |
| P1 | F-04 | Dans `activites/page.tsx`, initialiser `temporalFilter` à `'upcoming'` si les séances "today" sont vides au chargement |
| P2 | F-06 | Ajouter un bouton "Créer une séance" dans le bloc LA JOURNÉE vide du dashboard |
| P2 | F-03 | Ajouter un bouton "Passer cette étape →" sur les étapes 3 et 4 du wizard séances |
| P3 | F-09 | Ajouter des attributs `id` et `name` aux `TextInput` des formulaires |
| P3 | F-07 | Corriger le label "Tous (50)" → afficher le total tier réel ou libeller "Page 1 (50)" |
| P3 | F-02 | Différencier par label : "Activités" (tableau de bord) vs "Planning" (calendrier) dans la sidebar |
| P3 | F-08 | Conditionner le splash screen à `sessionStorage.getItem('aureak_booted')` pour éviter les rerenders |
| P3 | F-10 | Regrouper Stages dans la section Évènements de la sidebar |
