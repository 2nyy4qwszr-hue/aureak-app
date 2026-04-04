# Story 44.1 : BUG — Edge Function non-2xx à la création d'un coach

Status: ready-for-dev

## Story

En tant qu'admin,
je veux pouvoir créer une fiche coach sans erreur Edge Function,
afin de gérer les coachs de l'académie sans blocage.

## Acceptance Criteria

1. La création d'un profil coach via `users/new.tsx` (mode "fiche") ne retourne plus d'erreur non-2xx
2. Si l'Edge Function échoue, un message d'erreur clair est affiché (pas un code brut)
3. La console affiche les logs précis de l'étape qui échoue (auth check / insert profile / invite)
4. La création fonctionne pour les modes "fiche" et "invite"

## Technical Tasks

- [ ] Lire `supabase/functions/create-user-profile/index.ts` entièrement
- [ ] Ajouter des logs détaillés à chaque étape : auth check, role check, body parse, insert profile, invite
- [ ] Vérifier le role check : `callerRole !== 'admin'` — tester avec JWT decode fallback
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien configuré dans les secrets Supabase du projet
- [ ] Lire `aureak/apps/web/app/(admin)/users/new.tsx` — vérifier la gestion de l'erreur côté UI
- [ ] Dans l'UI : parser le message d'erreur de la réponse Edge Function et l'afficher proprement (pas le code brut)
- [ ] Console guard `process.env.NODE_ENV !== 'production'` sur les logs UI
- [ ] Tester en local avec `supabase functions serve create-user-profile`

## Files

- `supabase/functions/create-user-profile/index.ts` (modifier — logs + robustesse)
- `aureak/apps/web/app/(admin)/users/new.tsx` (modifier — gestion erreur UI)

## Dependencies

Aucune.

## Notes

L'erreur "EdgeFunctionReturned non-2xx status code" est générique. Les logs Supabase Dashboard → Functions → create-user-profile permettent de voir l'étape exacte. Investiguer avant de modifier.
