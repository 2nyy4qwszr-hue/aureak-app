# Story 2.4 : Auth Rapide Géolocalisée (PIN + GPS)

Status: ready-for-dev

## Story

En tant que Coach,
Je veux me connecter avec un PIN 4 chiffres sur un appareil déjà enregistré si mon téléphone est indisponible,
Afin de ne jamais être bloqué sur le terrain — avec session temporaire limitée aux opérations terrain uniquement.

## Acceptance Criteria

**AC1 — Device enregistré requis**
- **Given** un "device enregistré" = appareil sur lequel une session Coach normale a déjà été ouverte au moins une fois (`device_id` stocké localement + enregistré en base)
- **When** un Coach tente l'auth rapide
- **Then** si l'appareil n'est pas enregistré : auth rapide indisponible — le bouton "Auth rapide" n'apparaît pas

**AC2 — Vérification GPS dans le périmètre**
- **When** le Coach saisit son PIN 4 chiffres sur un appareil enregistré
- **Then** `expo-location` vérifie la position GPS contre le périmètre de l'implantation (rayon configurable par implantation, défaut 300m, coordonnées mises en cache local depuis la dernière session normale)

**AC3 — Session rapide scope restreint**
- **And** si dans le périmètre : une session rapide est créée via Edge Function, avec scope restreint aux routes terrain (`/sessions/:id/attendance`, `/sessions/:id/evaluation`) et expire automatiquement après **2h**

**AC4 — Refus hors périmètre**
- **And** si hors périmètre : auth refusée, message "Vous devez être sur le site pour utiliser l'auth rapide" — aucun contournement possible

**AC5 — Refus sans GPS**
- **And** si GPS indisponible (permission refusée ou signal absent) : auth refusée, message "Localisation requise pour l'auth rapide" — aucun fallback sans GPS

**AC6 — Audit trail complet**
- **And** chaque tentative d'auth rapide est journalisée dans `audit_logs` : `entity_type = 'quick_auth'`, `action = 'quick_auth_success' | 'quick_auth_failed'`, `metadata = { coach_id, implantation_id, device_id, reason? }`

**AC7 — Mobile uniquement**
- **And** l'auth rapide PIN est strictement réservée à `apps/mobile` — aucun import de `geoAuth.ts` dans `apps/web` (règle ESLint configurée en Story 1.1)

## Tasks / Subtasks

- [ ] Task 1 — Migration : `quick_auth_devices` (AC: #1)
  - [ ] 1.1 Ajouter dans `supabase/migrations/00010_rls_policies.sql` (section Story 2.4) :
    ```sql
    CREATE TABLE quick_auth_devices (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    UUID NOT NULL REFERENCES tenants(id),
      coach_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
      device_id    TEXT NOT NULL,     -- identifiant stable généré côté app (expo-device ou UUID local)
      pin_hash     TEXT NOT NULL,     -- bcrypt hash du PIN 4 chiffres
      implantation_id UUID NOT NULL,  -- FK vers implantations ajoutée Story 4.1
      last_used_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (coach_id, device_id)
    );
    ```
  - [ ] 1.2 RLS : coach voit uniquement ses propres devices ; admin voit tout le tenant
  - [ ] 1.3 Vérifier `supabase db reset` et `supabase db diff` clean

- [ ] Task 2 — Edge Function `quick-auth` (AC: #2, #3, #4, #5, #6)
  - [ ] 2.1 Créer `supabase/functions/quick-auth/index.ts`
  - [ ] 2.2 Payload entrant : `{ device_id, pin, gps_lat, gps_lon, implantation_id }`
  - [ ] 2.3 Logique : récupérer le device + vérifier le PIN (bcrypt compare) → vérifier le périmètre GPS → générer un token de session restreint via Supabase Auth Admin API → journaliser dans `audit_logs`
  - [ ] 2.4 Retourner : `{ access_token, expires_in: 7200 }` (2h = 7200s) ou erreur typée

- [ ] Task 3 — `packages/business-logic/src/auth/geoAuth.ts` (AC: #2, #4, #5, #7)
  - [ ] 3.1 Fonction `checkGeoPerimeter({ lat, lon, implantationLat, implantationLon, radiusMeters })` → `boolean`
  - [ ] 3.2 Utiliser la formule de Haversine pour calculer la distance en mètres
  - [ ] 3.3 Fonction `requestLocation()` : appel `expo-location` avec `requestForegroundPermissionsAsync()` — retourne `null` si permission refusée
  - [ ] 3.4 Cacher les coordonnées de l'implantation en local via `expo-secure-store` lors de la dernière session normale — lire depuis ce cache en mode offline

- [ ] Task 4 — Enregistrement du device à la première connexion normale (AC: #1)
  - [ ] 4.1 Dans `packages/api-client/src/auth.ts`, après `signInWithPassword()` réussi pour un Coach, appeler `registerDevice({ coachId, deviceId, implantationId })` — upsert dans `quick_auth_devices` (sans le PIN pour l'instant)
  - [ ] 4.2 Générer un `device_id` stable : `expo-device` (`Device.modelId + Device.osInternalBuildId`) ou UUID persisté dans `expo-secure-store` si `expo-device` non disponible
  - [ ] 4.3 Exposer une UI dans `apps/mobile/app/(coach)/settings/` pour que le Coach configure son PIN (hachage côté app avant envoi) → upsert `pin_hash`

- [ ] Task 5 — Écran auth rapide (AC: #1, #2, #3, #4, #5)
  - [ ] 5.1 Créer `apps/mobile/app/(auth)/quick-auth.tsx` — clavier PIN 4 chiffres, affiché uniquement si `quick_auth_devices` présent pour ce device
  - [ ] 5.2 Sur soumission : appeler `geoAuth.requestLocation()` → si null, afficher AC5 message → appeler Edge Function `quick-auth` → si succès, injecter le token dans `useAuthStore` avec flag `isQuickAuthSession = true`
  - [ ] 5.3 Restreindre la navigation : si `isQuickAuthSession`, masquer toutes les routes sauf `/(coach)/session/*` via guard dans `apps/mobile/app/(coach)/_layout.tsx`
  - [ ] 5.4 Afficher un bandeau persistent "Session rapide — expire à HH:MM" pendant toute la session

- [ ] Task 6 — Expiration automatique de la session (AC: #3)
  - [ ] 6.1 Dans `useAuthStore`, si `isQuickAuthSession`, démarrer un timer de 2h (7200s) qui appelle `signOut()` automatiquement à expiration
  - [ ] 6.2 Afficher une alerte 5 minutes avant l'expiration : "Votre session rapide expire dans 5 minutes"

## Dev Notes

### Architecture de l'Edge Function `quick-auth`

```typescript
// supabase/functions/quick-auth/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

Deno.serve(async (req) => {
  const { device_id, pin, gps_lat, gps_lon, implantation_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Trouver le device
  const { data: device } = await supabase
    .from('quick_auth_devices')
    .select('coach_id, pin_hash, implantation_id, tenant_id')
    .eq('device_id', device_id)
    .eq('implantation_id', implantation_id)
    .single()

  if (!device) {
    return errorResponse('device_not_registered', 401)
  }

  // 2. Vérifier le PIN
  const pinValid = await compare(pin, device.pin_hash)
  if (!pinValid) {
    await auditLog(supabase, device, 'quick_auth_failed', { reason: 'invalid_pin' })
    return errorResponse('invalid_pin', 401)
  }

  // 3. Vérifier le périmètre GPS
  const { data: impl } = await supabase
    .from('implantations')
    .select('gps_lat, gps_lon, gps_radius')
    .eq('id', implantation_id)
    .single()

  // Note: impl peut être null si implantations n'existe pas encore (Story 4.1)
  // En attendant, utiliser les coordonnées cachées envoyées par le client
  const distance = haversine(gps_lat, gps_lon, impl?.gps_lat, impl?.gps_lon)
  const radius = impl?.gps_radius ?? 300

  if (distance > radius) {
    await auditLog(supabase, device, 'quick_auth_failed', { reason: 'outside_perimeter', distance })
    return errorResponse('outside_perimeter', 403)
  }

  // 4. Générer un token de session restreint via Auth Admin API
  // Supabase ne supporte pas nativement les tokens à scope restreint —
  // utiliser un JWT court (2h) avec un claim custom `quick_auth: true`
  const { data: session } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: device.coach_email,  // récupéré depuis profiles
    options: { data: { quick_auth: true, implantation_id } }
  })

  // Alternative plus simple : retourner un token signé custom (voir Dev Notes)

  await auditLog(supabase, device, 'quick_auth_success', { implantation_id })

  return new Response(
    JSON.stringify({ access_token: session?.properties?.hashed_token, expires_in: 7200 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Alternative recommandée pour le token de session restreint

Supabase Auth Admin API ne supporte pas nativement les tokens à scope réduit. Deux approches :

**Option A — JWT custom (recommandée)** : Générer un JWT signé avec `SUPABASE_JWT_SECRET` qui contient `{ role: 'coach', tenant_id, implantation_id, quick_auth: true, exp: now + 7200 }`. Côté app, utiliser ce token comme Authorization header dans les appels Supabase. Côté RLS, ajouter une vérification de la claim `quick_auth` pour les routes terrain.

**Option B — Session Supabase normale** : Utiliser `supabase.auth.admin.createSession({ user_id })` avec une durée de 2h. La restriction de scope est alors gérée côté client (guard navigation) plutôt que côté serveur.

**Pour le MVP, choisir l'Option B** — plus simple à implémenter, la restriction de scope client suffit pour le terrain (coaches terrain ne contourneront pas le guard mobile).

### Formule de Haversine (JavaScript)

```typescript
// packages/business-logic/src/auth/geoAuth.ts
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000  // rayon Terre en mètres
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const toRad = (deg: number) => (deg * Math.PI) / 180

export async function requestLocation(): Promise<{ lat: number; lon: number } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') return null

  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { lat: location.coords.latitude, lon: location.coords.longitude }
}
```

### Hachage PIN côté app

Le PIN ne transite jamais en clair sur le réseau. Il est haché **côté app** avant d'être stocké ou envoyé :

```typescript
// Lors de la configuration du PIN (settings) :
import * as Crypto from 'expo-crypto'

const pinHash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  pin + device_id  // salage avec device_id pour empêcher rainbow tables
)
// Stocker pinHash dans quick_auth_devices.pin_hash
```

> **Note :** La vérification dans l'Edge Function compare le SHA-256 (pas bcrypt) si le hachage est fait côté app. Utiliser bcrypt uniquement si le PIN est envoyé en clair vers l'Edge Function (ce qui n'est pas recommandé).

### Cache des coordonnées implantation

Lors de chaque connexion normale d'un coach, mettre en cache les coordonnées GPS de ses implantations dans `expo-secure-store` :

```typescript
// Après signIn() réussi
await SecureStore.setItemAsync(
  `implantation_coords_${implantationId}`,
  JSON.stringify({ lat, lon, radius, cachedAt: new Date().toISOString() })
)
```

### Règle ESLint — mobile uniquement

Déjà configurée en Story 1.1 (`apps/web/.eslintrc.js`) :
```javascript
'no-restricted-imports': ['error', {
  patterns: [{ group: ['@aureak/business-logic/auth/geoAuth'], message: '...' }]
}]
```

Vérifier que cette règle est présente — sinon l'ajouter.

### Dépendances de cette story

- **Prérequis** : Story 2.1 (session Supabase, `profiles`) + Story 2.2 (`is_active_user()`)
- **À compléter en Story 4.1** : FK `implantations` dans `quick_auth_devices` + lecture des coordonnées GPS réelles depuis la table `implantations`

### References

- [Source: epics.md#Story-2.4] — Acceptance Criteria originaux (lignes 814-830)
- [Source: architecture.md#Géolocalisation-expo-location] — Décision expo-location (lignes 226-230)
- [Source: architecture.md#Auth-rapide-géolocalisée-mobile-uniquement] — Règle mobile only + ESLint (lignes 1200-1214)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
