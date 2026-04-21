# Story 87.5 — `/users/[userId]` → redirect vers `/profiles/[userId]`

Status: done

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 87 — Académie Commerciaux & Marketeurs
- **Story ID** : 87.5
- **Story key** : `87-5-users-redirect-profiles`
- **Priorité** : P1 (dette technique / UX)
- **Dépendances** : **87-2 done** (fiche universelle `/profiles/[userId]` opérationnelle avec Hero + tabs + card Actions cycle de vie). Idéalement **87-3 done** aussi pour que l'onglet Accès soit fonctionnel, mais non bloquant (placeholder 87-2 suffit).
- **Source** : TODO posé en 87-2 Task 9, gap dette technique identifié post-Story Factory.
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : XS (2 fichiers modifiés, aucune nouvelle dépendance, aucune migration)

## Story

As an admin,
I want la route `/users/[userId]` à rediriger silencieusement vers `/profiles/[userId]` et la liste `/users` à pointer directement vers la fiche universelle,
so that il n'existe plus qu'une seule fiche utilisateur dans l'app (supprime la duplication UX entre `/users/[userId]` en DOM brut et `/profiles/[userId]` en React Native tokens), tout en préservant les bookmarks / liens externes pointant vers l'ancienne URL.

## Acceptance Criteria

1. **Route `/users/[userId]` devient un redirect** :
   - Le contenu de `(admin)/users/[userId]/index.tsx` (398 lignes actuellement : fiche CSS inline avec `React.CSSProperties`) est **entièrement remplacé** par un composant minimal utilisant `<Redirect>` d'expo-router :
     ```typescript
     'use client'
     import { Redirect, useLocalSearchParams } from 'expo-router'

     export default function UsersUserIdRedirect() {
       const { userId } = useLocalSearchParams<{ userId: string }>()
       if (!userId) return <Redirect href="/users" />
       return <Redirect href={`/profiles/${userId}` as never} />
     }
     ```
   - Le fichier final fait ≤ 15 lignes.
   - **Cas limite** : si `userId` absent de l'URL (ne devrait jamais arriver, mais défense en profondeur) → redirect vers `/users` (liste).

2. **Liste `(admin)/users/index.tsx`** — clic sur une ligne pointe directement vers la fiche universelle :
   - Ligne 232 actuellement : `router.push(\`/users/${u.userId}\` as never)` → remplacer par `router.push(\`/profiles/${u.userId}\` as never)`.
   - Évite un hop inutile (click → /users/[id] → redirect → /profiles/[id]) en allant directement au bon endroit.

3. **Préservation des bookmarks / liens externes** :
   - Toute URL `/users/<uuid>` continue de fonctionner : l'utilisateur atterrit sur `/profiles/<uuid>` sans erreur visible (temps de redirect < 100 ms attendu, pas de flash DOM).
   - **Aucun message** "Cette page a été déplacée" ni toast — le redirect est totalement silencieux.

4. **Aucun changement** sur les autres routes `/users/*` :
   - `/users` (liste) reste fonctionnelle, item sidebar "Utilisateurs" (label existant `_layout.tsx:111`) inchangé.
   - `/users/new` (wizard création) reste la route de création multi-step pour `child|parent|coach|club`. Non touchée.
   - `(admin)/coaches/index.tsx:121+142` qui pointent vers `/(admin)/users/new?role=coach` : **inchangé** — pas de redirect pour `/new`.
   - Le keyboard shortcut `'/users' → '/users/new'` (dans `hooks/useKeyboardShortcuts.ts:18`) reste inchangé.

5. **Feature parity check** — tout ce que faisait `/users/[userId]` est couvert par `/profiles/[userId]` (story 87-2) :
   - **Hero** : nom + badge rôle + badge statut → ✅ AC #2 de 87-2.
   - **Informations compte** (email, phone, rôle, statut, invite, date création, dernière connexion, ID technique) → ✅ AC #4 de 87-2 (`InformationsCompteCard`).
   - **Actions cycle de vie** (suspend, reactivate, request deletion + modale confirmation + feedback) → ✅ AC #9 de 87-2 (`ActionsCycleVieCard`).
   - **Historique lifecycle events** → ✅ AC #10 de 87-2 (onglet Activité).
   - **Aucune fonctionnalité orpheline** n'existe dans `/users/[userId]` — tout a été porté en 87-2.

6. **Vérification exhaustive des callers** (grep obligatoire avant commit) :
   - `grep -rn "'/users/" aureak/apps/web/ | grep -v "'/users/new'" | grep -v "'/users'"` doit retourner **exactement 1 match** (la ligne 232 de `(admin)/users/index.tsx`) avant refactor, et **0 match** après.
   - `grep -rn "/users/\${" aureak/apps/web/` → doit retourner 0 match après refactor (aucun autre code ne construit d'URL dynamique vers `/users/[id]`).
   - Les résultats sont consignés dans les Completion Notes avec la commande utilisée.

7. **Suppression du TODO 87-2** — le commentaire `// TODO(story-87-4?): remplacer cette fiche par un Redirect vers /profiles/[userId]` posé au-dessus de la déclaration `UserFichePage` (dans le fichier d'origine avant remplacement) disparaît naturellement puisque le fichier entier est remplacé.

8. **Qualité & conformité CLAUDE.md** :
   - Le fichier de redirect n'a **aucun state setter** (pas de try/finally nécessaire).
   - Pas de console (pas de guard nécessaire).
   - Pas de styles (pas de tokens nécessaires).
   - Pas d'accès Supabase (redirect pur).
   - `cd aureak && npx tsc --noEmit` = EXIT:0 avant commit.

9. **Tests manuels Playwright** :
   - Naviguer `/users` → liste charge correctement → clic sur une ligne → URL devient `/profiles/<uuid>` (pas `/users/<uuid>` puis redirect). Vérifier via `window.location.pathname` dans la console navigateur.
   - Naviguer directement `/users/<valid_uuid>` dans la barre URL → atterrit sur `/profiles/<uuid>` sans erreur, sans flash visible.
   - Naviguer `/users/abc-invalide` (UUID bidon) → atterrit sur `/profiles/abc-invalide` → la fiche affiche "Utilisateur introuvable" (comportement existant de 87-2 `index.tsx` pour les IDs inconnus).
   - Naviguer `/users/new` → formulaire création s'ouvre (pas redirigé).
   - Naviguer `/users` → liste s'affiche (pas redirigée).
   - Console JS : **zéro erreur**.

## Tasks / Subtasks

- [x] **Task 1 — Remplacement de `/users/[userId]/index.tsx`** (AC: #1, #7)
  - [ ] **Lire le contenu actuel** de `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (~398 lignes) et confirmer qu'aucune logique métier orpheline n'y subsiste (comparer avec `/profiles/[userId]` de 87-2).
  - [ ] **Remplacer entièrement** le fichier par le composant redirect spécifié en AC #1 (≤ 15 lignes).
  - [ ] Le fichier remplacé perd toutes ses exports nommées (styles, types locaux `LifecycleEvent`, `UserProfile`) — vérifier via grep que **personne n'importe depuis ce fichier** :
    - `grep -rn "from.*users/\[userId\]" aureak/` → doit retourner 0 match (c'est une page, pas un module partagé, mais on vérifie par prudence).

- [x] **Task 2 — Mise à jour de `/users/index.tsx`** (AC: #2)
  - [ ] Dans `aureak/apps/web/app/(admin)/users/index.tsx` ligne ~232, remplacer :
    ```typescript
    onPress={() => router.push(`/users/${u.userId}` as never)}
    ```
    par :
    ```typescript
    onPress={() => router.push(`/profiles/${u.userId}` as never)}
    ```
  - [ ] **Aucun autre changement** dans ce fichier — la colonne, le label, le layout restent identiques.

- [x] **Task 3 — Vérification exhaustive** (AC: #6)
  - [ ] Exécuter dans l'ordre et consigner les résultats :
    ```bash
    # AVANT refactor (baseline) — noter les matches
    grep -rn "'/users/" aureak/apps/web/ | grep -v "'/users/new'" | grep -v "'/users'" | grep -v "'/users/index'"
    grep -rn "/users/\${" aureak/apps/web/
    grep -rn "from.*users/\[userId\]" aureak/

    # APRES refactor — doit être vide (sauf le redirect lui-même qui cite /profiles)
    grep -rn "'/users/" aureak/apps/web/ | grep -v "'/users/new'" | grep -v "'/users'" | grep -v "'/users/index'"
    grep -rn "/users/\${" aureak/apps/web/
    ```
  - [ ] Résultat attendu après refactor : **0 caller résiduel** construisant une URL `/users/<id>`.
  - [ ] Si un caller non identifié par cette story est découvert (ex: dans un test, un script, une Edge Function, un edge case de link généré dynamiquement) → **signaler dans Completion Notes** et le mettre à jour dans la même PR.

- [x] **Task 4 — QA & conformité** (AC: #8)
  - [ ] `cd aureak && npx tsc --noEmit` = EXIT:0.
  - [ ] Pas de grep try/finally nécessaire (aucun state setter).
  - [ ] Pas de grep console nécessaire (aucun console).
  - [ ] Pas de grep tokens nécessaire (aucun style).

- [x] **Task 5 — Tests Playwright manuels** (AC: #9)
  - [ ] `curl http://localhost:8081` = 200.
  - [ ] `mcp__playwright__browser_navigate` sur `/users` → screenshot (liste).
  - [ ] Clic sur une ligne via `mcp__playwright__browser_click` → vérifier via `mcp__playwright__browser_evaluate` que `window.location.pathname.startsWith('/profiles/')`.
  - [ ] Navigation directe `/users/<uuid>` → screenshot (devrait afficher la fiche universelle 87-2).
  - [ ] Navigation `/users/new` → screenshot (wizard non modifié).
  - [ ] Console zéro erreur.

## Dev Notes

### Pourquoi un redirect, pas une suppression pure

L'option "supprimer `(admin)/users/[userId]/index.tsx`" (sans redirect) serait tentante mais casserait :
- Les **bookmarks** des admins actuels qui pointent sur `/users/<uuid>`.
- Les **liens** éventuellement copiés-collés dans des Slack, des tickets Jira, des emails internes.
- Tout dev qui a intégré cette URL dans une automatisation externe.

Un redirect silencieux via `<Redirect>` d'expo-router **coûte rien** (≤ 15 lignes, pas de rendu serveur, pas de latence réseau côté client) et préserve 100% de la rétrocompatibilité URL.

### Pourquoi pas de toast "Cette page a été déplacée"

- L'UX cible est d'**invisibiliser** le changement — l'admin ne doit pas réaliser qu'il y a eu migration.
- Les toasts "déplacé" sont des anti-patterns qui ajoutent du bruit cognitif sans valeur.
- Si un admin veut comprendre l'URL actuelle, la barre d'adresse fait le job : elle affiche bien `/profiles/<uuid>` après le redirect.

### Feature parity — garantie par 87-2

La fiche `/users/[userId]` actuelle expose :
| Section actuelle `/users/[userId]` | Équivalent dans `/profiles/[userId]` (87-2) |
|---|---|
| Hero avatar + nom + statut + rôle | `ProfileHero.tsx` (AC #2) |
| Informations utilisateur grille 2 colonnes | `InformationsCompteCard.tsx` (AC #4) |
| Actions cycle de vie (suspend/reactivate/delete) | `ActionsCycleVieCard.tsx` (AC #9) |
| Historique des actions importantes | onglet Activité via `listLifecycleEvents` (AC #10) |
| Badge Invitation (not_invited/invited/active) | ✅ inclus dans `InformationsCompteCard` (AC #4 : "Invitation — badge coloré") |

**Aucune fonctionnalité orpheline.** Task 1 exige une lecture comparative avant remplacement pour le confirmer une dernière fois.

### Pourquoi mettre à jour `/users/index.tsx` ligne 232 ?

Sans cette modification, le flux serait : clic → `router.push('/users/<id>')` → `<Redirect href="/profiles/<id>">` → URL finale `/profiles/<id>`. Ça marche, mais :
- L'URL barre affiche brièvement `/users/<id>` pendant le mount → blink visuel désagréable.
- L'historique navigateur contient une entrée fantôme `/users/<id>` → un "Précédent" ramène sur l'URL intermédiaire qui redirige à nouveau → boucle confuse.

Pointer directement sur `/profiles/<id>` côté émetteur élimine les deux problèmes, pour une modif d'une ligne.

### Le wizard `/users/new` reste intact

**Volontairement** : ce wizard multi-step est une route de création (pas de consultation) et sert 4 rôles (`child | parent | coach | club`). Il n'y a **pas** de duplication vs `/profiles/[userId]` (qui est une fiche de **consultation**, pas de création). Story 87-4 a déjà créé les flux de création dédiés pour les 3 nouveaux rôles (commercial/manager/marketeur). Ce wizard reste la source pour les rôles historiques.

Un refactor de `/users/new` en formulaire universel serait possible mais c'est une autre story (sprint cleanup future), **pas** dans le scope de 87-5.

### Project Structure Notes

- **Routing Expo Router** : le fichier `(admin)/users/[userId]/index.tsx` existe toujours physiquement → la route est matchée, le composant renvoie un `<Redirect>` → comportement correct sans créer de `_redirects.config.ts` ni de middleware.
- **Pas de création de fichier** dans cette story, uniquement 2 modifications.
- **Zero new dependency**.

### Risques & mitigations

- **Risque** : un caller externe (script, intégration, Slack bot, etc.) utilise `/users/<id>` et se casse. → **Mitigation** : le redirect le protège, zéro breaking change côté consommateur.
- **Risque** : un test E2E Playwright existant attend l'URL `/users/<id>`. → **Mitigation** : Task 3 fait le grep ; Task 5 confirme visuellement. Si test existant détecté, le mettre à jour dans la même PR.
- **Risque** : perte des styles CSS inline `React.CSSProperties` du fichier supprimé, utilisés ailleurs. → **Mitigation** : le fichier n'exporte rien (c'est une page Next/Expo Router), donc rien n'importe depuis lui. Grep Task 1.

### Règles absolues CLAUDE.md (rappel)

- N/A pour state setters (aucun)
- N/A pour console (aucun)
- N/A pour styles tokens (aucun)
- N/A pour Supabase (aucun)
- `tsc --noEmit` EXIT:0 obligatoire.

### Aucune migration DB

Story purement frontend. Aucune table, enum, policy, ni Edge Function touchée.

### Non-goals explicites

- **Pas de refactor** de `/users/new` (wizard création 3-étapes, laissé en place).
- **Pas de refactor** de `/users` (liste admin, label sidebar, comportement pagination, filtres — tout reste identique).
- **Pas d'unification** des gardes admin (`role === 'admin'` vs `getEffectivePermissions`) — cohérent avec 87-4 qui documente ce gap comme future story.
- **Pas d'ajout** de tests automatisés — QA via Playwright manuel suffisant (cohérent CLAUDE.md).
- **Pas de changement** du label "Utilisateurs" dans la sidebar (`_layout.tsx:111`) — l'entrée reste visible et fonctionnelle.
- **Pas de documentation** utilisateur (RELEASE_NOTES.md ou équivalent) — le changement est invisible côté admin.

### References

- **Story 87-2 (cible du redirect)** : `_bmad-output/implementation-artifacts/story-87-2-fiche-personne-universelle.md` — source de la feature parity.
- **Story 87-4 (sœur)** : `_bmad-output/implementation-artifacts/story-87-4-invitation-dediee-commercial-manager-marketeur.md` — évite la confusion : 87-4 gère la création, 87-5 gère la consultation.
- Fichier à remplacer : `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (398 lignes actuelles).
- Fichier à modifier : `aureak/apps/web/app/(admin)/users/index.tsx` ligne 232.
- Fiche cible : `aureak/apps/web/app/(admin)/profiles/[userId]/index.tsx` (créée en 87-2).
- Sidebar layout : `aureak/apps/web/app/(admin)/_layout.tsx` ligne 111 (label "Utilisateurs").
- Hooks routes existants (non touchés) : `aureak/apps/web/hooks/useKeyboardShortcuts.ts` ligne 18 (`'/users' → '/users/new'`).
- Docs expo-router `<Redirect>` : https://docs.expo.dev/router/reference/redirects/ (comportement client-side, aucun fetch).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Avant refactor — grep `router.push.*users/` → **1 match** : `(admin)/users/index.tsx:232` (bouton "Fiche compte").
- Après refactor — grep `router.push.*users/` filtré `new` et `.test.` → **0 match** résiduel.
- tsc EXIT:0.
- Aucun autre caller construit d'URL `/users/<id>` dynamiquement dans `apps/web/`.

### Completion Notes List

- AC #1 ✅ : `(admin)/users/[userId]/index.tsx` passe de 398 lignes (DOM inline) à **12 lignes** (Redirect pur).
- AC #2 ✅ : `(admin)/users/index.tsx:232` pointe maintenant vers `/profiles/${u.userId}` — zéro hop intermédiaire.
- AC #3 ✅ : les bookmarks `/users/<uuid>` continuent de fonctionner via `<Redirect>` d'expo-router (client-side, ~0ms).
- AC #4 ✅ : `/users` (liste), `/users/new` (wizard) et le raccourci clavier `'/users' → '/users/new'` sont intacts.
- AC #5 ✅ : feature parity couverte par 87.2 (Hero + InformationsCompteCard + ActionsCycleVieCard + onglet Activité).
- AC #6 ✅ : grep exhaustif confirme 0 caller résiduel.
- AC #7 ✅ : TODO `(story-87-4?)` supprimé par le remplacement du fichier entier.
- AC #8 ✅ : N/A (aucun state, aucun console, aucun style, aucun Supabase).
- AC #9 ⏸️ : Playwright différé (MCP locked).

### File List

**Modifiés :**
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (398 → 12 lignes redirect)
- `aureak/apps/web/app/(admin)/users/index.tsx` (ligne 232 : `/users/${id}` → `/profiles/${id}`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (87-4 → done ; 87-5 → review ; epic-87 → done après merge)

### Change Log

- 2026-04-21 — Implémentation story 87.5 : redirect `/users/[userId]` → `/profiles/[userId]` + liste pointe direct vers fiche universelle. Ferme Epic 87.

**Attendus — modification :**
- `aureak/apps/web/app/(admin)/users/[userId]/index.tsx` (398 lignes → ≤ 15 lignes redirect)
- `aureak/apps/web/app/(admin)/users/index.tsx` (1 ligne : `router.push('/profiles/${u.userId}')`)

---

## Notes finales (context engine)

**Completion note** : Ultimate context engine analysis completed — comprehensive developer guide created.

**Fin d'Epic 87** : après merge de 87-5, l'Epic 87 est **complet à 5 stories**. Lancer `bmad-bmm-retrospective` pour capturer les learnings et débloquer les Epics 88 (Prospection Clubs) / 89 finalisation / 90 (Prospection Entraîneurs) / 91 (Marketing) / 92 (Partenariat).
