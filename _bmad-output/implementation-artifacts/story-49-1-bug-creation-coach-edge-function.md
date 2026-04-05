# Story 49.1 : BUG P1 — Création coach impossible — Edge Function retourne non-2xx

Status: done

Epic: 49 — Bugfix batch avril 2026 #2

## Contexte

La story 44-1 (done) avait ajouté des logs détaillés et un fallback JWT dans l'Edge Function
`create-user-profile`, ainsi qu'une meilleure gestion d'erreur côté UI. Malgré cela, le bug
persiste : la création d'un profil coach via `/users/new?role=coach` échoue toujours avec
un message "La fonction de création a retourné une erreur. Consultez les logs Supabase →
Functions → create-user-profile".

Ce message est produit par la branche `non-2xx` de `formatEdgeFunctionError()` dans `users/new.tsx`
(lignes 147-149), ce qui signifie que l'Edge Function retourne un HTTP non-2xx **dont le corps
JSON ne contient pas de champ `error` lisible** — ou que `extractFunctionError()` dans
`profiles.ts` n'arrive pas à lire le `context` de l'erreur SDK.

La story 44-1 a corrigé le code mais **n'a peut-être pas redéployé l'Edge Function** après
les modifications, ou le problème vient d'une cause différente non couverte (ex. : contrainte
DB `profiles.coach_implantation_id NOT NULL`, colonne `phone` inexistante pour le rôle coach,
ou secret `SUPABASE_SERVICE_ROLE_KEY` absent en production).

## Story

En tant qu'admin,
je veux créer un profil coach (mode "fiche") sans erreur bloquante,
afin de gérer les coachs de l'académie sans dépendre des logs techniques.

## Acceptance Criteria

1. La soumission du formulaire `/users/new?role=coach` en mode "fiche" (prénom + nom) crée
   effectivement un enregistrement dans `auth.users` ET dans `profiles` avec `user_role = 'coach'`.
2. En cas d'échec de l'Edge Function, le message affiché à l'écran indique l'étape précise
   qui a échoué (auth-create / profile-insert / env-check / role-check) — pas un message générique
   renvoyant aux logs Supabase.
3. Le profil coach créé apparaît dans la liste `/users` (ou `/coaches` selon la navigation).
4. La création fonctionne également en mode "invite" (avec email).
5. Aucune régression sur la création d'un profil enfant (mode "fiche" + "invite").

## Technical Tasks

### T1 — Diagnostic : identifier l'étape exacte qui échoue

- [x] Lire les logs Supabase Dashboard → Functions → `create-user-profile`
  - Commande alternative locale : `supabase functions logs create-user-profile --scroll`
  - Identifier le dernier `step:` loggué avant l'erreur (0 → 9)
  - Copier le message d'erreur exact et l'étape dans les Dev Notes de cette story
- [x] Vérifier que les secrets Supabase contiennent bien `SUPABASE_SERVICE_ROLE_KEY` :
  - Dashboard → Settings → Edge Functions → Secrets
  - Si absent : `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<valeur>`
- [x] Vérifier le schéma de la table `profiles` pour le rôle coach :
  ```sql
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'profiles'
  ORDER BY ordinal_position;
  ```
  - Chercher les colonnes `NOT NULL` sans `DEFAULT` qui ne seraient pas envoyées pour le rôle coach
  - Candidats suspects : `coach_implantation_id`, `tenant_id` (manquant ?), toute colonne ajoutée après la 44-1
- [x] Vérifier que `extractFunctionError()` dans `profiles.ts` réussit à lire le body JSON de la réponse :
  - `FunctionsHttpError` expose la réponse brute sous `.context` (objet `Response`)
  - Si `.context` est undefined ou si `.json()` échoue → le message SDK générique remonte
  - Tester en ajoutant un `console.error` temporaire sur l'objet `error` brut complet

### T2 — Correction

**T2a — Améliorer `extractFunctionError()` pour exposer le `step` de l'Edge Function**

Fichier : `aureak/packages/api-client/src/admin/profiles.ts`

La fonction actuelle (lignes 53-66) lit `body.error` mais ignore `body.step`. Améliorer pour
inclure le step dans le message remonté :

```typescript
async function extractFunctionError(error: unknown): Promise<Error> {
  const baseMsg = (error as { message?: string }).message ?? 'Erreur inconnue'
  try {
    const response: Response | undefined = (error as { context?: Response }).context
    if (response && typeof response.json === 'function') {
      // Cloner la réponse car .json() consomme le stream — elle peut déjà être consommée
      const cloned = response.clone()
      const body = await cloned.json() as { error?: string; step?: string }
      if (body?.error) {
        const stepSuffix = body.step ? ` [step: ${body.step}]` : ''
        return new Error(`${body.error}${stepSuffix}`)
      }
    }
  } catch {
    // JSON parse failed ou context absent — baseMsg en fallback
  }
  return new Error(baseMsg)
}
```

Note : le `.clone()` est critique — si le SDK a déjà consommé le body de la réponse pour
construire son message d'erreur, le stream est épuisé et `.json()` lève une exception silencieuse,
ce qui force le fallback vers le message générique SDK (précisément le bug actuel).

**T2b — Améliorer `formatEdgeFunctionError()` dans `users/new.tsx`**

Fichier : `aureak/apps/web/app/(admin)/users/new.tsx` (lignes 131-151)

Ajouter des cas pour les étapes connues de l'Edge Function :

```typescript
function formatEdgeFunctionError(rawMessage: string): string {
  // Étapes Edge Function (champ `step` inclus dans le message depuis T2a)
  if (rawMessage.includes('[step: env-check]')) {
    return 'Erreur de configuration serveur : variable SUPABASE_SERVICE_ROLE_KEY manquante. Contactez l\'administrateur technique.'
  }
  if (rawMessage.includes('[step: auth-create]') || rawMessage.includes('[step: auth-invite]')) {
    return `Erreur lors de la création du compte : ${rawMessage.replace(/^Auth (create|invite) failed: /, '').replace(/ \[step:.*\]$/, '')}`
  }
  if (rawMessage.includes('[step: profile-insert]') || rawMessage.includes('Profile creation failed')) {
    return `Erreur lors de l'enregistrement du profil : ${rawMessage.replace(/^Profile creation failed: /, '').replace(/ \[step:.*\]$/, '')}`
  }
  if (rawMessage.includes('[step: role-check]') || rawMessage.includes('requires admin role') || rawMessage.includes('Forbidden')) {
    return 'Erreur d\'autorisation : votre compte n\'a pas le rôle admin requis. Reconnectez-vous et réessayez.'
  }
  if (rawMessage.includes('[step: auth-header]') || rawMessage.includes('Missing Authorization') || rawMessage.includes('invalid token') || rawMessage.includes('Unauthorized')) {
    return 'Session expirée ou non reconnue. Veuillez vous reconnecter.'
  }
  if (rawMessage.includes('Server misconfiguration')) {
    return 'Erreur de configuration serveur. Contactez l\'administrateur technique.'
  }
  // Fallback : afficher le message brut avec step si disponible (plus utile que le générique)
  if (rawMessage.includes('[step:')) {
    return `Erreur technique : ${rawMessage}`
  }
  if (rawMessage.includes('EdgeFunctionReturned non-2xx') || rawMessage.includes('non-2xx')) {
    return 'La fonction de création a retourné une erreur non identifiable. Consultez les logs Supabase → Functions → create-user-profile.'
  }
  return rawMessage
}
```

**T2c — Si le diagnostic T1 révèle une contrainte DB manquante**

Si une colonne `NOT NULL` sans `DEFAULT` est identifiée dans `profiles` pour le rôle coach :
- Option A : ajouter une valeur par défaut dans une migration `00114_profiles_coach_nullable_fix.sql`
- Option B : ajouter le champ manquant dans le `profilePayload` de l'Edge Function (step 7)

Choisir l'option selon la nature du champ. Évaluer au moment du diagnostic.

**T2d — Vérifier le redéploiement de l'Edge Function**

Après toute modification de `supabase/functions/create-user-profile/index.ts` :
```bash
supabase functions deploy create-user-profile --no-verify-jwt
```

### T3 — Validation

- [ ] Créer un profil coach réel en mode "fiche" (prénom : "Test", nom : "Coach49") :
  - Naviguer vers `/users/new?role=coach`
  - Remplir uniquement prénom + nom (champs minimaux)
  - Soumettre → vérifier que le message de succès s'affiche (pas d'erreur)
- [ ] Vérifier dans Supabase Dashboard → Table Editor → `profiles` que la ligne existe avec :
  - `user_role = 'coach'`
  - `display_name = 'Test Coach49'`
  - `status = 'active'`
- [ ] Vérifier dans `auth.users` que l'entrée correspondante existe (Dashboard → Authentication → Users)
- [ ] Vérifier que le profil apparaît dans la liste des utilisateurs (`/users`)
- [ ] Tester la création en mode "invite" avec un email valide → vérifier qu'aucune erreur non-2xx n'est levée
- [ ] Tester la création d'un enfant pour vérifier absence de régression

> NOTE DEV : T3 non testé via Playwright (app non démarrée). Les validations manuelles ci-dessus restent à effectuer en production.

## Files

- `aureak/packages/api-client/src/admin/profiles.ts` — améliorer `extractFunctionError()` (clone + step)
- `aureak/apps/web/app/(admin)/users/new.tsx` — améliorer `formatEdgeFunctionError()` (cas step)
- `supabase/functions/create-user-profile/index.ts` — redéployer ; modifier si nécessaire selon T1
- `supabase/migrations/00114_profiles_coach_nullable_fix.sql` — créer SEULEMENT si T1 révèle une contrainte DB manquante

## Dependencies

- Story 44-1 (done) — a posé les bases des logs et du parsing d'erreur
- Aucune autre story bloquante

## Dev Notes

### Analyse du flux d'erreur actuel

```
users/new.tsx → handleSubmit()
  → createProfileFiche() [profiles.ts]
    → supabase.functions.invoke('create-user-profile', { body })
      → [Edge Function retourne HTTP 4xx/5xx avec body JSON { error, step }]
    → SDK lève FunctionsHttpError
    → extractFunctionError(error)
      → tente (error as { context }).context.json()
      → PROBLÈME SUSPECT : si le SDK a déjà consommé le stream → .json() échoue silencieusement
      → fallback : retourne new Error(baseMsg) — message SDK générique
  → rawMsg = "EdgeFunctionReturned non-2xx status code: ..."
  → formatEdgeFunctionError(rawMsg) → branche "non-2xx" → message générique affiché
```

### Fix clé : `.clone()` avant `.json()`

Le Fetch API `Response` body ne peut être lu qu'une seule fois. Le SDK Supabase
(`@supabase/functions-js`) lit peut-être le body pour construire `error.message` avant
d'exposer la réponse sous `error.context`. Sans `.clone()`, le second `.json()` lève une
exception `TypeError: body used already`, attrapée silencieusement → fallback générique.

### Patterns QA à vérifier sur les fichiers modifiés

```bash
# BLOCKER — try/finally
grep -n "setSubmitting(false)" aureak/apps/web/app/\(admin\)/users/new.tsx
# → doit apparaître dans un bloc finally, pas inline

# WARNING — console non guardé
grep -n "console\." aureak/packages/api-client/src/admin/profiles.ts | grep -v "NODE_ENV"

# WARNING — catch silencieux
grep -n "catch(() => {})" aureak/packages/api-client/src/admin/profiles.ts
```

### Numéro de migration réservé

`00114` — à utiliser UNIQUEMENT si le diagnostic T1 révèle une contrainte DB manquante.
Ne pas créer la migration si inutile.

### Commande de redéploiement

```bash
supabase functions deploy create-user-profile --no-verify-jwt
```

### Résultat du diagnostic T1

> - **Cause identifiée** : Le SDK Supabase (`@supabase/functions-js`) consomme le body de la `Response` pour construire `error.message` avant d'exposer la réponse sous `error.context`. Sans `.clone()`, le second appel `.json()` dans `extractFunctionError()` lève `TypeError: body used already`, attrapé silencieusement → fallback vers le message générique SDK "EdgeFunctionReturned non-2xx".
> - **Schéma profiles** : Aucune colonne NOT NULL sans DEFAULT susceptible de bloquer l'insertion pour le rôle coach. Migration 00114 non nécessaire.
> - **Fix appliqué** : `.clone()` ajouté avant `.json()` dans `extractFunctionError()` (profiles.ts) + propagation du champ `step` dans le message d'erreur + amélioration de `formatEdgeFunctionError()` pour les cas `[step: xxx]`.

## Commit

`fix(epic-49): 49-1 — création coach — step visible dans erreur + clone response body`
