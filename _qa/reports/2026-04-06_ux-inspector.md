# UX Inspector — 2026-04-06

## Résumé

- Flux audités : 5 (+ focus spécifique sur les 3 nouvelles zones story 50-11, la page Évènements 63-2, et la section Développement 63-3)
- Frictions HAUTE priorité (P1) : 4
- Frictions MOYENNE priorité (P2) : 4
- Incohérences : 5
- App vérifiée : ✅ http://localhost:8081 — HTTP 200 (analyse statique + code source, Playwright non lancé)
- Note : rapport précédent `2026-04-05_ux-inspector.md` et version antérieure `2026-04-06_ux-inspector.md` remplacés et enrichis avec les résultats du sprint du jour.

---

## Focus prioritaire — Nouvelles zones dashboard (50-11), Évènements (63-2), Développement (63-3)

---

## Frictions détectées

### ⚡ [UX - P1] Dashboard Zone 1 — Compteur séances reflète LIVE uniquement, pas "aujourd'hui"

**Flux concerné :** Flux 5 — Dashboard admin, Zone 1 Briefing du jour
**Page :** `/dashboard`
**Friction :** La date card affiche `{todaySessionsCount} séance(s) aujourd'hui` en s'appuyant sur `liveCounters.sessionCount` (ligne 2534 → `useLiveSessionCounts()`). Ce hook compte les **séances actuellement en cours** (Realtime), pas toutes les séances planifiées pour la journée. À 8h du matin, avant l'entraînement, le compteur affiche "0 séance aujourd'hui" même si 3 séances sont planifiées. À 10h30, pendant la séance, il passe à "1 séance aujourd'hui". Ce comportement est contre-intuitif pour un "Briefing du jour" censé préparer la journée.
**Impact :** L'admin ne peut pas s'appuyer sur ce chiffre pour planifier sa journée. La date card perd sa valeur de "briefing" — elle devient une carte d'état en temps réel non pas de la journée. Risque de confusion : "0 séance aujourd'hui" peut être interprété comme "jour de repos" alors qu'il y a des séances planifiées.
**Proposition :** Remplacer `todaySessionsCount={liveCounters.sessionCount}` par un compteur dédié `listTodaySessionsCount()` (ou utiliser le résultat de `listNextSessionForDashboard` qui a déjà les données de planning), de sorte que la date card affiche les séances planifiées pour le jour, indépendamment de leur statut live.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ligne 2534

---

### ⚡ [UX - P1] Dashboard — 5 console.error sans guard NODE_ENV (BLOCKER conformité)

**Flux concerné :** Flux 5 — Dashboard admin (toutes zones)
**Page :** `/dashboard`
**Friction :** 5 appels `console.error` sans le guard requis par CLAUDE.md et AC12 de la story 50-11 :
- Ligne 2189 : `getTopStreakPlayers error`
- Ligne 2206 : `getPlayerOfWeek error`
- Ligne 2211 : `getPlayerOfWeek exception`
- Ligne 2225 : `getXPLeaderboard error`
- Ligne 2230 : `getXPLeaderboard exception`

Ces 5 lignes restent non corrigées depuis le gate2 du 2026-04-06. La story 50-11 est marquée `done` mais l'AC12 n'est pas entièrement satisfait.
**Impact :** Logs applicatifs pollués en production. Risque de fuite d'informations sensibles (messages d'erreur Supabase) dans la console navigateur des utilisateurs admin en production.
**Proposition :** Envelopper chacun avec `if ((process.env.NODE_ENV as string) !== 'production')` — pattern déjà utilisé correctement aux lignes 2246, 2251, 2265, 2270, 2286, 2291.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx` — lignes 2189, 2206, 2211, 2225, 2230

---

### ⚡ [UX - P1] Évènements — stub UX "bientôt disponible" déclenché par filtre, pas par modal

**Flux concerné :** Flux 4 — Créer un évènement non-Stage (63-2)
**Page :** `/evenements`
**Friction :** Parcours admin pour créer un Tournoi :
1. Cliquer "+ Nouvel évènement" → modal s'ouvre (OK)
2. Sélectionner "Tournoi Goal à Goal" → cliquer "Continuer"
3. Le modal se ferme, **le filtre "Tournoi" s'active**, et un bandeau "Création bientôt disponible" apparaît dans la liste principale

L'AC6 stipule "afficher 'Création bientôt disponible' après la sélection du type" — implicitement dans le modal, avant de fermer. Le comportement réel ferme le modal, redirige vers la vue filtrée, et affiche le stub en bannière contextuelle dans la liste. L'admin se retrouve sur une page avec 0 résultats + un bandeau — sans retour explicite au modal ni CTA "OK j'ai compris". Pour quitter cet état, l'admin doit cliquer manuellement sur "Tous" pour réinitialiser.

**Impact :** Parcours de 3 clics pour arriver sur un dead-end sans CTA de sortie claire. La rupture "modal fermé → bannière liste" crée une discontinuité cognitive. L'admin peut croire que l'action a partiellement fonctionné ou être désorienté par l'absence de confirmation dans le modal.
**Proposition :** Afficher le message "Création bientôt disponible" DANS le modal (remplacer le bouton "Continuer" par le texte stub + bouton "Fermer"), sans changer de filtre. Cela réduit à 2 clics (Nouvel évènement → sélectionner type → lire stub → fermer) et supprime le dead-end liste filtrée vide.
**Fichier :** `aureak/apps/web/app/(admin)/evenements/page.tsx` — fonction `handleSelectEventType` (ligne 219) et composant `NewEventModal`

---

### ⚡ [UX - P1] Développement — sous-pages sans lien de retour vers le hub

**Flux concerné :** Flux 5 — Section Développement (63-3)
**Page :** `/developpement/prospection`, `/developpement/marketing`, `/developpement/partenariats`
**Friction :** Les 3 pages stub n'ont aucun élément de navigation retour : ni breadcrumb "← Développement", ni lien vers `/developpement`. L'admin qui navigue via la sidebar vers "Prospection" directement (sous-item sidebar de story 63.1) puis veut revenir au hub `/developpement` n'a aucun contrôle UI pour cela — il doit re-cliquer sur "Développement" dans la sidebar (si les sous-items sont distincts) ou utiliser le bouton Retour du navigateur.

La page hub `/developpement` a elle-même correctement un header avec titre et sous-titre, mais les sous-pages ne font pas référence au hub parent.
**Impact :** Non-respect du principe "Retour arrière toujours accessible" de la spec UX. Sur les pages stub (KPIs tous à "—"), l'intérêt de la page est limité — l'admin voudra rapidement revenir au hub ou aller ailleurs. Sur une sidebar avec sous-items repliables, l'accès au hub peut ne pas être évident.
**Proposition :** Ajouter en tête de chaque page stub un breadcrumb minimal :
```
← Développement
```
en `Pressable` → `router.push('/developpement')`. Pattern identique aux autres fiches de l'app (`← Retour`).
**Fichier :** `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx`, `marketing/page.tsx`, `partenariats/page.tsx`

---

### ⚡ [UX - P2] Dashboard Zone 1 — implantations cards : label "Séances planifiées" incorrect

**Flux concerné :** Flux 5 — Dashboard, Zone 1 Briefing du jour
**Page :** `/dashboard`
**Friction :** Dans les cartes implantation de `BriefingDuJour`, la status row "Séances planifiées" affiche en réalité `stat.sessions_total` (le total de séances de la période du bento KPI Zone 2, pas le jour en cours). Le commentaire inline le confirme : `// TODO: utiliser children_count quand disponible`. Le label "Séances planifiées" est trompeur — il devrait soit afficher une vraie donnée journalière, soit être libellé différemment ("Séances sur la période" ou masqué).
**Impact :** L'admin lit "Séances planifiées : 14" sur la carte implantation et croit qu'il y a 14 séances aujourd'hui pour ce site — alors que c'est le total sur la période de filtrage de la Zone 2 (ex. 4 dernières semaines). Crée une fausse impression d'activité.
**Proposition :** Remplacer le label par "Séances (période)" ou supprimer la status row jusqu'à ce que `children_count` soit disponible. Alternative minimale : changer le texte de `Séances planifiées : {childrenCount}` en `Total séances : {childrenCount}`.
**Fichier :** `aureak/apps/web/app/(admin)/dashboard/page.tsx` — ligne 396 (dans `BriefingDuJour`)

---

### ⚡ [UX - P2] Évènements — clic sur card stage ouvre `/stages/[id]` hors page Évènements

**Flux concerné :** Flux 4 — Consulter un évènement
**Page :** `/evenements`
**Friction :** Un clic sur une EventCard navigue vers `/stages/{id}` (`handleCardPress` ligne 231-233). L'admin arrive sur la fiche de stage complète, avec un breadcrumb propre à `/stages`. S'il clique "← Retour" sur la fiche, il retourne vers `/stages` (la liste stages) — pas vers `/evenements`. La page Évènements a donc une navigation "fausse entrée" : elle liste des items mais ceux-ci ont leur retour arrière vers une liste parallèle.
**Impact :** Confusion sur quelle liste est canonique. Si l'admin a filtré par type `stage` dans `/evenements`, il perd ce contexte en naviguant vers la fiche puis en revenant vers `/stages` (sans filtre). 2 clicks supplémentaires pour revenir à `/evenements`.
**Proposition :** Court terme : dans `/stages/[stageId]/page.tsx`, détecter le referrer (ou passer un query param `?from=evenements`) pour adapter le lien de retour. Long terme : les EventCards pointent vers `/evenements/{id}` (route propre) qui affiche la fiche avec retour vers `/evenements`.
**Fichier :** `aureak/apps/web/app/(admin)/evenements/page.tsx` — ligne 230-233 ; `aureak/apps/web/app/(admin)/stages/[stageId]/page.tsx` — retour arrière

---

### ⚡ [UX - P2] Développement — KPI placeholders visuellement ambigus (valeur "—" sur h1)

**Flux concerné :** Flux 5 — Section Développement, sous-pages stub
**Page :** `/developpement/prospection`, `/developpement/marketing`, `/developpement/partenariats`
**Friction :** Les KPI placeholders affichent `"—"` avec le variant `AureakText variant="h1"` (ligne 35 de chaque page stub). Le tiret em-dash s'affiche dans la taille/graisse du h1 (28px, 900 weight), centré sur la carte. Couplé à la couleur `colors.text.subtle` (gris clair), le rendu crée une carte qui ressemble visuellement à un KPI qui a "chargé" mais dont la valeur est absente — l'admin peut confondre avec une erreur de chargement ou des données réellement manquantes.
**Impact :** L'admin peut croire que la section est censée afficher des données et qu'il y a un problème de chargement. Le banner "en cours de développement" est présent mais scrollé hors vue sur petits écrans si les KPI cards apparaissent en premier. La distinction "stub volontaire" vs "erreur de données" n'est pas immédiate.
**Proposition :** Remplacer `variant="h1"` par `variant="h2"` (plus petit) + ajouter un label explicite `"Pas encore disponible"` sous la valeur `"—"` en `caption` italique. Ou utiliser une icône `🔒` à la place du tiret pour signaler explicitement le caractère verrouillé.
**Fichier :** `aureak/apps/web/app/(admin)/developpement/prospection/page.tsx` (ligne 35), `marketing/page.tsx` (ligne 35), `partenariats/page.tsx` (ligne 35)

---

### ⚡ [UX - P2] Flux séance — Step 2 surchargé (friction persistante non corrigée)

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new`
**Friction :** Identifiée dans le rapport du 2026-04-05 et confirmée le 2026-04-06 — non corrigée. Le Step 2 "Détails" agrège méthode, numéro de cycle (jusqu'à 32 chips), contenu pédagogique contextuel, coaches et terrain dans un seul écran. L'admin doit scroller significativement dans un seul step pour remplir 6-8 sous-sections avant de pouvoir avancer.
**Impact :** Violation persistante de la règle "max 3 clics pour toute action courante". Friction P1 désormais dégradée à P2 car aucun parcours critique n'est bloqué — mais reste la friction avec le plus d'interactions dans l'app.
**Proposition :** Extraire coaches + terrain vers un Step 3 "Logistique" — 4 steps cohérents : Contexte / Méthode / Logistique / Date.
**Fichier :** `aureak/apps/web/app/(admin)/seances/new.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance (groupe existant, simple) | 10+ | ~100s | Step 2 surchargé — méthode + numéro + coaches + terrain dans un seul écran |
| Trouver un joueur | 3 + validation manuelle | ~20s | Recherche non temps-réel (bouton "Chercher" requis) |
| Ajouter joueur à club | 7 | ~25s | Recherche club non temps-réel + PlayerPicker en fiche club |
| Créer un évènement Stage | 4 | ~15s | Dashboard → Évènements → "+ Nouvel" → Sélectionner "Stage" → Continuer → `/stages/new` |
| Créer un évènement Tournoi | 4 → dead-end | ~12s | Modal → Tournoi → Continuer → Filtre actif + bannière stub sans CTA de sortie |
| Naviguer dans section Développement | 3 + retour navigateur | ~10s | Hub → Prospection → contenu stub → retour navigateur (pas de lien retour UI) |
| Consulter dashboard Zone 1 | 0 (vue initiale) | < 3s | Compteur "séances aujourd'hui" = live uniquement, pas planning journalier |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/dashboard` Zone 1 — date card | Compteur séances journalières (vs live uniquement) | Admin sous-informé sur la journée à venir |
| `/evenements` modal "Nouvel évènement" | Stub inline dans le modal pour types non-stage | Dead-end liste filtrée vide après confirmation |
| `/developpement/prospection` `/marketing` `/partenariats` | Lien de retour "← Développement" | Violation du principe "retour toujours accessible" |
| `/seances/new` Step 1 | Message si 0 groupes après sélection implantation | Admin voit dropdown vide, sans suggestion de créer un groupe |
| `/clubs` liste | "Réinitialiser les filtres" sur état vide filtré | Admin bloqué si aucun club ne correspond |
| `/stages/[stageId]` | Retour contextuel vers `/evenements` (si arrivé depuis là) | Perte du contexte de navigation |

---

## Incohérences de patterns

**1. Stub "bientôt disponible" — 2 patterns différents dans la même app**
- `/evenements` modal → stub affiché APRÈS fermeture du modal, comme bannière dans la liste filtrée (pattern A)
- `/developpement/*` pages → stub affiché DANS la page, en bannière fixe en haut (pattern B)
- Recommandation : normaliser sur le pattern B (stub dans la page de destination) et corriger `/evenements` pour afficher le stub dans le modal (pattern C, le plus propre).

**2. Recherche temps-réel vs bouton "Chercher" obligatoire (non corrigée depuis 2026-04-05)**
- `/seances/[sessionId]` — guest search : debounce 300ms automatique ✅
- `/clubs/[clubId]` — PlayerPicker : recherche immédiate ✅
- `/children` — recherche globale : bouton "Chercher" obligatoire ❌
- `/clubs` — recherche globale : bouton "Chercher" obligatoire ❌
- `/evenements` — pas de champ de recherche textuelle du tout ⚠️ (chercher un stage par nom = impossible sans savoir sa date ou son statut)

**3. Labels de retour arrière inconsistants**
- `/clubs/[clubId]` : breadcrumb "Clubs / {nom}" ✅
- `/children/[childId]` : bouton "← Retour" seul ✅
- `/seances/[sessionId]` : breadcrumb cliquable + bouton "← Séances" (doublon — friction P1 identifiée 2026-04-05) ❌
- `/developpement/prospection` : aucun contrôle retour ❌
- `/evenements` + stage : retour vers `/stages`, pas `/evenements` ❌

**4. Grille d'implantations — statuts basés sur des données absentes**
- `BriefingDuJour` calcule `getImplantStatus()` sur `terrain_available`, `absences_count`, `coaches_count`
- Ces 3 champs ne sont pas dans `ImplantationStats` — le code utilise des fallbacks (`?? true`, `?? 0`, `?? 1`)
- Résultat : toutes les cartes implantation affichent "statut vert" (tout OK) par défaut, même sans données réelles
- L'admin peut croire que tout est OK alors que l'information n'est tout simplement pas disponible
- Note : TODO explicite dans le code, mais visuellement invisible pour l'admin

**5. Confirmation suppression inconsistante (persistante depuis 2026-04-05)**
- `/clubs/[clubId]` : `ConfirmDialog` ✅
- `/methodologie/seances` : `ConfirmDialog` ✅
- `/stages/[stageId]` : pas de `ConfirmDialog` sur journées/blocs ❌

---

## Analyse grille UX par nouvelle zone

### Zone 1 — Briefing du jour (Story 50-11)

| Critère | Résultat | Observation |
|---------|---------|-------------|
| Action principale évidente | ✅ | Bouton "Voir planning →" visible sans scroller |
| État vide avec CTA | ✅ | "Aucune implantation configurée" affiché |
| État de chargement visible | ✅ | DashboardSkeleton Zone 1 mis à jour |
| Feedback succès après action | N/A | Zone lecture seule |
| Retour arrière accessible | N/A | Zone dashboard (pas de navigation interne) |
| Labels clairs | ⚠️ | "Séances planifiées" trompeur (voir P2 ci-dessus) |
| Cohérence patterns | ⚠️ | Statuts implantation toujours verts (fallbacks) |

### Page Évènements (Story 63-2)

| Critère | Résultat | Observation |
|---------|---------|-------------|
| État vide avec CTA | ✅ | EmptyState avec bouton "+ Nouvel évènement" |
| État de chargement visible | ✅ | 6 SkeletonCard visibles |
| Feedback erreur lisible | ✅ | Banner rouge avec message clair en français |
| Retour arrière accessible | N/A | Page liste (pas de navigation enfant) |
| Action principale évidente | ✅ | Bouton gold "+ Nouvel évènement" en haut droite |
| Confirmation actions destructrices | N/A | Pas de suppression sur cette page |
| Cohérence des patterns | ⚠️ | Stub post-modal incohérent avec stub dans-page Développement |
| Labels filtres | ✅ | "Tous", "Stage", "Tournoi Goal à Goal", etc. — clair |
| URL persistante | ✅ | `?type=stage` dans l'URL — partageable |

### Section Développement (Story 63-3)

| Critère | Résultat | Observation |
|---------|---------|-------------|
| État vide avec CTA | ✅ | Banner "en cours de développement" explicite |
| État de chargement visible | N/A | Pages statiques — pas de chargement async |
| Retour arrière accessible | ❌ | Aucun lien de retour vers `/developpement` dans les sous-pages |
| Action principale évidente | ⚠️ | Pas d'action principale (pages stub) — le "Voir →" du hub fonctionne |
| Labels clairs | ⚠️ | Valeur "—" en h1 peut être confondue avec erreur de chargement |
| Cohérence des patterns | ✅ | 3 pages stub identiques entre elles |
| Design premium | ✅ | Fond beige, cards blanches, accents gold, banner gold |

---

## Recommandations prioritaires

1. **Corriger les 5 console.error sans guard NODE_ENV dans `dashboard/page.tsx`** — 5 lignes à envelopper (`if (process.env.NODE_ENV !== 'production')`), AC12 story 50-11 non satisfait, risque production immédiat.

2. **Afficher le stub "bientôt disponible" dans le modal Évènements** — supprimer `setFilter(type)` pour les types non-stage dans `handleSelectEventType`, afficher le message stub dans `NewEventModal` avant fermeture — élimine le dead-end liste vide filtrée.

3. **Ajouter un lien retour "← Développement" dans les 3 sous-pages stub** — 1 `Pressable` + `router.push('/developpement')` en tête de chaque page, 3 fichiers, ~5 lignes chacun.

4. **Renommer ou supprimer la status row "Séances planifiées" dans BriefingDuJour** — au minimum changer le label en "Total séances (période)" pour éviter la confusion avec les séances du jour.

5. **Remplacer `todaySessionsCount={liveCounters.sessionCount}` par un compteur journalier réel** — la date card doit refléter les séances planifiées pour le jour, pas uniquement les sessions live en cours.

6. **Ajouter une recherche textuelle sur `/evenements`** — sans champ de recherche, trouver un stage par nom (ex. "Stage Namur juin") impose de scroller toute la liste ou de filtrer par type puis scroller. Pattern : `useEffect` debounce 350ms, filtre local côté client ou paramètre `name` dans `listEvents()`.

7. **Mettre en place le retour contextuel depuis `/stages/[stageId]` vers `/evenements`** — passer `?from=evenements` en query param lors du `router.push` dans `handleCardPress`, et adapter le breadcrumb de la fiche stage en conséquence.

8. **Unifier la recherche temps-réel** sur `/clubs/page.tsx` et `/children/index.tsx` — debounce 350ms, supprimer le bouton "Chercher" (friction P2 persistante depuis 2026-04-05).
