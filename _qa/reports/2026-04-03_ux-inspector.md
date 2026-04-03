# UX Inspector — 2026-04-03

## Résumé

- Flux audités : 5 flux principaux + navigation générale
- Frictions HAUTE priorité (P1) : 4
- Frictions MOYENNE priorité (P2) : 3
- Frictions BASSE priorité (P3) : 2
- **États manquants critiques** : 3 empty states, 0 loading state visible, 0 feedback toast sur actions

---

## Frictions détectées

### ⚡ [UX - P1] Navigation Joueurs introuvable — page list démantelée

**Flux concerné :** Flux 2 — Trouver un joueur et voir sa fiche
**Page :** `/children/` (manquante)
**Friction :** La page.tsx n'existe pas pour `/children/`. La barre latérale pointe vers `/children` (label "Joueurs"), mais le routing utilise `index.tsx` uniquement. Un admin accédant par lien direct `/children` atterrit sur une erreur 404 ou rebascule.
**Impact :** Impossible de naviguer intuitivement vers la liste paginée des joueurs. Le flux devient : "Joueurs" sidebar → 404 → chercher une fiche depuis les détails d'un autre écran. Impact critique sur découvrabilité.
**Proposition :** Créer `/children/page.tsx` qui ré-exporte le contenu de `index.tsx` (ou fusionner les deux fichiers).
**Fichier :** `/aureak/apps/web/app/(admin)/children/index.tsx` + `page.tsx` manquante

---

### ⚡ [UX - P1] Bouton retour manquant sur fiches détail — pas de breadcrumb

**Flux concerné :** Flux 2 & 3 — Affichage fiche joueur / club
**Page :** `/children/[childId]`, `/clubs/[clubId]`
**Friction :** Les pages détail (enfant, club) n'affichent aucun bouton "← Retour" ou breadcrumb. Un utilisateur arrivant sur la fiche d'un joueur n'a aucun moyen visuel de revenir à la liste. Il doit utiliser le bouton retour du navigateur ou la sidebar.
**Impact :** Friction de 1 clic (manque du retour). Sur mobile (usage terrain pour coachs), cela devient 2-3 clics supplémentaires. Incohérence avec la spec UX : "Retour arrière toujours accessible".
**Proposition :** Ajouter un composant `<BackButton>` en haut de chaque page détail avec `← Retour` ou breadcrumb interactif `Joueurs / [Nom]`.
**Fichier :** `/aureak/apps/web/app/(admin)/children/[childId]/page.tsx`, `/aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx`

---

### ⚡ [UX - P1] États vides sans CTA — listes vides = confusion

**Flux concerné :** Flux 1, 3, 4, 5 — Toutes listes
**Page :** `/clubs`, `/groups`, `/stages`, `/coaches`
**Friction :** Quand une liste est vide (e.g., aucun club créé, aucun stage planifié), l'écran montre simplement "0 résultat" ou une grille vide, sans message explicite ni bouton d'action. Un admin ne sait pas si : c'est normal, le système charge, ou il doit créer quelque chose.
**Impact :** Perte de confiance. Zéro guidage vers l'action suivante. Spec UX : "Tout état vide doit avoir un message + CTA".
**Proposition :** Remplacer les grilles vides par une section centrée : icône + "Aucun [ressource] créé." + bouton "+ Nouveau [ressource]".
**Fichier :** `/aureak/apps/web/app/(admin)/clubs/index.tsx`, `/aureak/apps/web/app/(admin)/groups/index.tsx`, `/aureak/apps/web/app/(admin)/stages/index.tsx`

---

### ⚡ [UX - P1] Feedback confirmé absent après actions — aucun toast visible

**Flux concerné :** Flux 1 & 3 — Création séance, club, joueur
**Page :** `/seances/new`, `/clubs/new`, `/children/new`
**Friction :** Après soumission d'un formulaire (créer séance, créer club), l'écran redirige silencieusement ou affiche un état transitoire, sans toast de succès visible. L'utilisateur ne sait pas si l'action a réussi.
**Impact :** Doute utilisateur. Sur terrain (coach), cela peut mener à des doublons (re-submit). Spec : "Feedback visuel immédiat sur toute action (loading, success, error)".
**Proposition :** Déclencher un Toast après `createSession()`, `createClubDirectoryEntry()`, etc. : "✓ Séance créée" (2s, auto-dismiss).
**Fichier :** `/aureak/apps/web/app/(admin)/seances/new.tsx`, `/aureak/apps/web/app/(admin)/clubs/new.tsx`, `/aureak/apps/web/app/(admin)/children/new/page.tsx`

---

### ⚡ [UX - P2] Duplication confuse dans la sidebar — Séances / Dashboard séances

**Flux concerné :** Flux 5 — Navigation générale
**Page :** `/_layout.tsx` (sidebar NAV_GROUPS)
**Friction :** La sidebar affiche :
- "Tableau de bord" (→ /dashboard)
- "Dashboard séances" (→ /dashboard/seances)
- "Séances" (→ /seances)
- "Présences (v2)" (→ /presences)
- "Présences" (→ /attendance)

Redondance. Un admin ne sait pas quelle link cliquer : "Séances" vs "Dashboard séances" ? "Présences" vs "Présences (v2)" ? Cela crée 2 clics inutiles par jour.
**Impact :** Cognitive overload. Séance courants route confuse. Affecte vitesse d'utilisation (objectif coach : max 3 clics).
**Proposition :** Supprimer les doublons ou clarifier les labels. Exemple : "Dashboard" contient "Séances" comme sous-section, pas deux entries top-level. Ou renommer "Dashboard séances" → "Vue d'ensemble" et déprécier "/dashboard".
**Fichier :** `/aureak/apps/web/app/(admin)/_layout.tsx` (NAV_GROUPS)

---

### ⚡ [UX - P2] Formulaire créer séance — nombre de champs non minimal

**Flux concerné :** Flux 1 — Créer une séance
**Page :** `/seances/new.tsx`
**Friction :** Le formulaire comporte 6 steps : groupe, date(s), coachs, thème, atelier, validation. Pour une séance basique (groupe + date + coach), un admin doit 6+ clics. Spec demande : "Max 3 clics pour action courante" + "formulaire minimal" + "< 60s par action".
**Impact :** Friction majeure sur adoption terrain. Sur mobile (usage coach), c'est bloquant.
**Proposition :** Réduire à 3 steps : (1) Groupe + Date, (2) Coachs assignés, (3) Valider. Thème/atelier optionnels en post-création (edit de séance).
**Fichier :** `/aureak/apps/web/app/(admin)/seances/new.tsx` (réduction steps 4-6)

---

### ⚡ [UX - P2] Aucune confirmation pour actions destructrices

**Flux concerné :** Tous les flux suppression
**Page :** `/children/[childId]`, `/clubs/[clubId]`, `/seances/[sessionId]`
**Friction :** Pas de modale de confirmation visible avant suppression. Spec UX : "Toute action destructrice doit avoir une confirmation". Risque : suppression accidentelle de joueur, club, séance.
**Impact :** Perte de données potentielle. Réaction utilisateur : "Pourquoi mon joueur a disparu ?"
**Proposition :** Ajouter modale avant `deleteChildDirectoryEntry()`, etc. : "Êtes-vous sûr ? Cette action ne peut pas être annulée."
**Fichier :** Toutes pages détail avec action delete

---

### ⚡ [UX - P3] Pagination peu intuitive — numérotation confuse

**Flux concerné :** Flux 2 & 3 — Navigation listes paginées (Joueurs, Clubs)
**Page :** `/children/index.tsx`, `/clubs/page.tsx`
**Friction :** Le contrôle pagination affiche `← [Page 2/14] →` sans contexte clair du nombre total d'éléments. Sur page 2, l'utilisateur ne voit pas qu'il y a 13 pages restantes. Labels sont minimalistes (←/→ sans "Précédent"/"Suivant").
**Impact :** Navigation lente. Recherche paginée peu engageante.
**Proposition :** Afficher : "Éléments 26–50 sur 700 | ← Page 2/14 →" + hover labels sur boutons (a11y).
**Fichier :** `/aureak/apps/web/app/(admin)/children/index.tsx`, `/aureak/apps/web/app/(admin)/clubs/page.tsx`

---

### ⚡ [UX - P3] État de chargement non visible — aucun skeleton sur card list

**Flux concerné :** Flux 2, 3, 4 — Listes avec fetch asynchrone
**Page :** `/children/index.tsx`, `/clubs/page.tsx`, `/stages/index.tsx`
**Friction :** Lors du chargement, l'écran reste blanc ou affiche "0 résultat" temporairement. Pas de skeleton, spinner, ou placeholder pour rassurer l'utilisateur que le système charge.
**Impact :** Perception lenteur. Utilisateur clique "retour" avant que la liste charge.
**Proposition :** Afficher skeleton cards (CardSkeleton déjà dans `/components/SkeletonCard.tsx` pour stages) pendant loading.
**Fichier :** `/aureak/apps/web/app/(admin)/children/index.tsx`, `/aureak/apps/web/app/(admin)/clubs/page.tsx`

---

## Mesures par flux

| Flux | Nb clics | Estimation temps | Friction principale |
|------|----------|-----------------|---------------------|
| Créer une séance | 12+ | 90–120s | 6 steps, pas de feedback |
| Trouver un joueur | 3–4 + 404 | 15–20s | Page list 404, pas de retour sur détail |
| Ajouter joueur à club | Non testé | N/A | Flux non accessible actuellement |
| Consulter planning stage | 2 | 5–10s | OK — landing page stable |
| Navigation générale | 1 + confusion | 2–5s | Duplication sidebar (Séances x2, Présences x2) |

---

## États manquants

| Page | État manquant | Impact |
|------|--------------|--------|
| `/children` | Empty state (aucun joueur) | Utilisateur pense système en erreur |
| `/clubs` | Empty state (aucun club) | Pas de CTA pour créer premier club |
| `/stages` | Empty state (aucun stage) | OK — message présent |
| `/seances/new` | Success toast post-création | Utilisateur ne sait pas si séance créée |
| `/children/[childId]` | Back button / breadcrumb | Utilisateur bloqué, doit utiliser navigateur |
| `/clubs/[clubId]` | Back button / breadcrumb | Même problème |

---

## Incohérences de patterns

1. **Sidebar duplication** : Présences vs Présences (v2), Séances vs Dashboard séances — 2 flux différents pour une même action.
2. **Pagination labels** : Clubs utilise "← Précédent" + "Page 1/3", Joueurs utilise "←" + "1/3". Incohérent visuellement.
3. **Empty states** : Stages affiche message, Clubs/Groupes/Enfants n'affichent rien. Patterns divergents.
4. **Confirmations** : Aucune modale de suppression sur aucun écran — absence totale du pattern "destructive action".
5. **Feedback post-action** : Aucun toast visible. Utilisateur doit vérifier manuellement la redirection.

---

## Recommandations prioritaires

1. **[URGENT — P1]** Créer `/children/page.tsx` pour débloquer Flux 2. Fusion ou réexport depuis `index.tsx`.
2. **[URGENT — P1]** Ajouter bouton `← Retour` sur toutes pages détail (`/children/[id]`, `/clubs/[id]`, etc.). Single-line fix : `<BackButton />` composant.
3. **[URGENT — P1]** Ajouter empty state à `/children`, `/clubs`, `/groups` : message centralisé + CTA "Nouveau" quand liste vide.
4. **[HIGH — P2]** Déclencher Toast après création (`createSession`, `createClub`) : simple appel `toast.success("Créé")`.
5. **[HIGH — P2]** Nettoyer sidebar : supprimer "Présences (v2)" OU "Présences", "Dashboard séances" OU fusionner dans Dashboard. Règle : 1 action = 1 entry.
6. **[MEDIUM — P2]** Réduire steps créer séance : 6 → 3 steps, mettre thèmes/ateliers en post-création.
7. **[MEDIUM — P2]** Ajouter modale confirmation avant suppression : "Êtes-vous sûr ?" sur tous les `DELETE`.
8. **[NICE — P3]** Clarifier pagination : afficher "Éléments 26–50 sur 700" + labels complets (Précédent/Suivant).
9. **[NICE — P3]** Ajouter skeleton cards durant loading sur enfants + clubs.
10. **[NICE — P3]** Harmoniser empty states : composant réutilisable `<EmptyState icon={} title={} cta={} />`.

---

## Notes techniques

- **Composants existants** : `SkeletonCard` déjà présent, `Toast` API disponible via `useToast()`, `BackButton` inexistant → créer.
- **Navigation** : Utilise `expo-router` (React Native Web). Breadcrumb standard via `usePathname()`.
- **Spec respectée** : Seulement 2/5 principes UX appliqués actuellement (loading skeleton sur stages uniquement, zéro confirmation déstructive).
- **Scope** : 0 nouvelles features — seulement simplifications et polish UX existant.

---

**Rapport généré** : 2026-04-03  
**Scope** : Admin dashboard, 5 flux principaux  
**Méthodologie** : Audit code + parcours simulés + grille UX spec  
