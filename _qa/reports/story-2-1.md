# Rapport story 2-1 — Auth Standard (Email/MDP)

**Date** : 2026-04-01
**Commit** : d50b2fe
**Statut** : ✅ done

---

## Changements apportés

| Fichier | Action | Raison |
|---------|--------|--------|
| `supabase/functions/custom-access-token-hook/index.ts` | Créé | Gap critique : hook JWT absent → `role`/`tenant_id` non injectés |
| `supabase/functions/admin-disable-user/index.ts` | Créé | Requis par `disableUser()` dans `api-client/src/auth.ts` |
| `supabase/config.toml` | Modifié | Activation `[auth.hook.custom_access_token]` pour dev local Docker |
| `2-1-...md` (story) | Status → done | — |

**Non modifiés (déjà présents et complets) :**
- `packages/api-client/src/auth.ts` — signIn, signOut, inviteUser, disableUser, getUserRoleFromProfile
- `packages/business-logic/src/stores/useAuthStore.ts` — Zustand store + fallback DB si hook absent
- `packages/business-logic/src/auth/roles.ts` — isAdmin, isCoach, isParent, isChild
- `apps/web/app/(auth)/login.tsx` — formulaire connexion
- `apps/web/app/(admin)/users/` — new.tsx, [userId]/index.tsx
- `apps/web/app/_layout.tsx` — `_init()` appelé au démarrage
- `supabase/migrations/00003_create_profiles.sql` — table profiles + parent_child_links

---

## Comportement du custom-access-token-hook

1. Supabase Auth appelle le hook à chaque login et refresh de token
2. Le hook lit `profiles.user_role` + `profiles.tenant_id` + `status` via service_role
3. Si profil absent → JWT retourné sans enrichissement (RLS bloque)
4. Si `status = 'disabled'` → JWT retourné sans `role`/`tenant_id` (RLS bloque + `useAuthStore` déclenche `signOut()`)
5. Si OK → `app_metadata.role` + `app_metadata.tenant_id` injectés dans le JWT

**Fallback dans `useAuthStore`** : si le hook n'est pas encore configuré sur le Dashboard remote, le store lit `profiles` directement (requête supplémentaire à chaque init, mais fonctionnel).

---

## Action manuelle requise (Dashboard Supabase remote)

> ⚠️ **À faire une seule fois par l'utilisateur :**
>
> 1. Déployer la function : `supabase functions deploy custom-access-token-hook --project-ref tuiicxlkvzvanikbkmmf`
> 2. Supabase Dashboard → Authentication → Hooks → **Custom Access Token**
> 3. Renseigner l'URL : `https://tuiicxlkvzvanikbkmmf.supabase.co/functions/v1/custom-access-token-hook`
> 4. Sauvegarder
>
> Sans cette configuration, le fallback DB de `useAuthStore` prend le relais (aucune panne, mais performance dégradée).

---

## Risques

| Risque | Niveau | Mitigation |
|--------|--------|------------|
| Hook non configuré sur Dashboard remote | Moyen | Fallback DB actif dans useAuthStore — app fonctionnelle mais avec requête supplémentaire |
| `ban_duration: '876000h'` pour désactivation | Bas | Comportement intentionnel (100 ans ≈ ban permanent) ; réactivation via `updateUserById(userId, { ban_duration: 'none' })` |
| Erreurs TS pré-existantes dans children/index.tsx | Non bloquant | Hors scope story 2-1 — pré-existantes avant cette implémentation |

---

## QA Gates

| Gate | Résultat |
|------|----------|
| try/finally state setters | ✅ N/A (Edge Functions, pas de state React) |
| console sans NODE_ENV guard | ✅ OK (Edge Functions = Deno serveur, règle ne s'applique pas) |
| catch vides | ✅ Aucun |
| Playwright login render | ✅ Login page rendue correctement |
| Playwright AuthGuard | ✅ Redirection /users → /login sans session |
| Build TypeScript | ✅ Aucune nouvelle erreur |

---

## Points à vérifier avant mise en production

- [ ] Déployer `custom-access-token-hook` sur remote Supabase
- [ ] Configurer le hook dans Dashboard (Authentication → Hooks)
- [ ] Tester login avec un vrai compte → vérifier que JWT contient `app_metadata.role` et `app_metadata.tenant_id`
- [ ] Tester désactivation de compte → vérifier que l'utilisateur est déconnecté immédiatement
