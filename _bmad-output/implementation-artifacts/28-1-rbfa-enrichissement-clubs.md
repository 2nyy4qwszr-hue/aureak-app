# Story 28.1 : Enrichissement RBFA — Matching automatique et import de logos clubs

Status: ready-for-dev

---

## Story

En tant qu'administrateur Aureak,
je veux que le système recherche automatiquement chaque club de l'annuaire sur le site RBFA, calcule un score de confiance basé sur le matricule, le nom et la localisation, puis importe automatiquement le logo et les métadonnées RBFA si la confiance est élevée — et crée une demande de validation manuelle si la confiance est intermédiaire,
afin d'enrichir l'annuaire des clubs sans effort manuel et sans risquer de faux matchs.

---

## Acceptance Criteria

### AC1 — Migration DB : colonnes RBFA sur club_directory
- La migration `00081` ajoute les colonnes suivantes à `club_directory` (nullable) :
  - `rbfa_id TEXT` — identifiant interne RBFA du club (ex: numéro extrait de l'URL RBFA)
  - `rbfa_url TEXT` — URL de la fiche club sur rbfa.be
  - `rbfa_logo_url TEXT` — URL directe du logo sur les serveurs RBFA (source, pas notre Storage)
  - `rbfa_confidence NUMERIC(5,2)` — score de matching 0–100
  - `rbfa_status TEXT CHECK IN ('pending','matched','rejected','skipped')` DEFAULT 'pending'
  - `last_verified_at TIMESTAMPTZ` — date du dernier passage de la recherche RBFA
- Index sur `(tenant_id, rbfa_status)` pour le batch

### AC2 — Migration DB : table club_match_reviews
- La migration `00082` crée la table `club_match_reviews` :
  - `id UUID PK DEFAULT gen_random_uuid()`
  - `tenant_id UUID NOT NULL REFERENCES tenants(id)`
  - `club_directory_id UUID NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE`
  - `rbfa_candidate JSONB NOT NULL` — résultat brut RBFA (nom, matricule, logoUrl, rbfaUrl, rbfaId)
  - `match_score NUMERIC(5,2) NOT NULL` — score global 0–100
  - `score_detail JSONB NOT NULL` — détail par champ : `{matricule, nomExact, nomSimilarite, ville, province}`
  - `status TEXT NOT NULL DEFAULT 'pending' CHECK IN ('pending','confirmed','rejected')`
  - `reviewed_by UUID REFERENCES auth.users(id) NULL`
  - `reviewed_at TIMESTAMPTZ NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- RLS : isolation par `tenant_id`, lecture/écriture admin uniquement
- Index sur `(tenant_id, status)` et `(club_directory_id)`

### AC3 — Types TypeScript
- `RbfaClubResult` exporté depuis `@aureak/types` :
  ```ts
  type RbfaClubResult = {
    rbfaId: string        // extrait de l'URL ou du DOM
    nom: string
    matricule: string | null
    ville: string | null
    province: string | null
    logoUrl: string | null  // URL directe image RBFA
    rbfaUrl: string         // URL fiche RBFA
  }
  ```
- `RbfaMatchScore` :
  ```ts
  type RbfaMatchScore = {
    total: number            // 0–100
    matricule: number        // 0 ou 60
    nomExact: number         // 0 ou 20
    nomSimilarite: number    // 0–12
    ville: number            // 0 ou 5
    province: number         // 0 ou 3
    confidence: 'high' | 'medium' | 'low'
  }
  ```
- `RbfaStatus = 'pending' | 'matched' | 'rejected' | 'skipped'`
- `ClubMatchReview` type miroir de la table DB avec camelCase
- `ClubDirectoryEntry` étendu avec les nouveaux champs RBFA (tous nullable)

### AC4 — Module rbfa-search : service de recherche
- Fichier `packages/api-client/src/rbfa/rbfa-search.ts`
- Fonction `searchRbfaClub(query: string): Promise<RbfaClubResult[]>` :
  - Construit l'URL de recherche RBFA avec `query` (nom ou matricule)
  - Header `User-Agent` identifié (non spoofé, identifiable comme "Aureak Club Sync")
  - Délai minimum de **2 secondes** entre deux appels (rate limiting)
  - Cache mémoire (Map) avec TTL de **10 minutes** par query normalisée
  - Retry max **2 fois** sur erreur réseau (pas sur 4xx)
  - Timeout fetch : **10 secondes**
  - En cas d'erreur (timeout, 5xx, parse error) : log `console.warn` + retourne `[]` (jamais throw)
  - Ne jamais appeler en boucle serrée — le batch respecte le rate limiting

### AC5 — Module rbfa-parser : parsing des résultats
- Fichier `packages/api-client/src/rbfa/rbfa-parser.ts`
- Fonction `parseRbfaSearchResults(html: string): RbfaClubResult[]`
- Parsing robuste avec des sélecteurs CSS précis documentés (à adapter selon structure RBFA réelle)
- Si le parsing échoue : log `console.warn` + retourne `[]` (jamais throw)
- Fonctions utilitaires exportées :
  - `normalizeClubName(name: string): string` — lowercase, trim, supprime accents, ponctuation
  - `extractRbfaId(rbfaUrl: string): string | null` — extrait l'ID depuis l'URL RBFA
- **NOTE DEV** : la structure HTML de rbfa.be doit être vérifiée manuellement avant implémentation. Documenter les sélecteurs utilisés en commentaire.

### AC6 — Module club-matching : algorithme de scoring
- Fichier `packages/api-client/src/rbfa/club-matching.ts`
- Fonction pure `scoreMatch(aureak: ClubDirectoryEntry, rbfa: RbfaClubResult): RbfaMatchScore`
- Algorithme de scoring :
  | Critère | Condition | Points |
  |---|---|---|
  | Matricule exact | `aureak.matricule && rbfa.matricule && normalize(a) === normalize(b)` | +60 |
  | Nom exact normalisé | `normalizeClubName(a.nom) === normalizeClubName(b.nom)` | +20 |
  | Similarité nom | Score Jaro-Winkler ou Levenshtein normalisé × 12 | 0–12 |
  | Ville | `normalize(a.ville) === normalize(b.ville)` | +5 |
  | Province | `a.province === mapRbfaProvince(b.province)` | +3 |
  - **Total max : 100** (les points sont cappés à 100)
  - Si `matricule exact` → `confidence: 'high'` peu importe le reste
- Seuils de confiance :
  - `'high'` : total ≥ 75 **OU** matricule exact
  - `'medium'` : total ≥ 40 et < 75 (sans matricule exact)
  - `'low'` : total < 40
- Fonction `findBestMatch(aureak: ClubDirectoryEntry, candidates: RbfaClubResult[]): { best: RbfaClubResult | null; score: RbfaMatchScore | null }` — retourne le meilleur match uniquement

### AC7 — Module club-logo-import : téléchargement et stockage
- Fichier `packages/api-client/src/rbfa/club-logo-import.ts`
- Fonction `downloadAndStoreLogo(params: { clubId, tenantId, rbfaLogoUrl, updatedBy }): Promise<{ logoPath: string | null; error: unknown }>`
  - Fetch de l'image RBFA avec timeout 15s et User-Agent identifié
  - Validation : Content-Type doit être `image/jpeg` ou `image/png` (sinon erreur propre)
  - Taille max : 2 MB (sinon erreur propre)
  - Chemin Storage déterministe : `{tenantId}/{clubId}/logo-rbfa.{ext}` (distinct du logo manuel `logo.{ext}`)
  - Upload vers bucket `club-logos` (upsert)
  - Mise à jour `club_directory.logo_path` si succès
  - Mise à jour `club_directory.rbfa_logo_url` avec l'URL RBFA source
  - Rollback Storage si mise à jour DB échoue (idem pattern `uploadClubLogo` existant)
  - Audit log `club_rbfa_logo_imported`

### AC8 — Service rbfa-sync : orchestration du job batch
- Fichier `packages/api-client/src/admin/rbfa-sync.ts`
- Fonction principale `syncMissingClubLogos(tenantId: string, opts?: { dryRun?: boolean; maxClubs?: number }): Promise<SyncResult>`
- Logique :
  1. Sélectionne les clubs : `rbfa_status = 'pending'` ET (`logo_path IS NULL` OU `last_verified_at IS NULL`)
  2. Limité à `maxClubs` (défaut 50) par appel — prévoir pagination
  3. Pour chaque club (séquentiellement, pas en parallèle — respect rate limiting) :
     a. Appelle `searchRbfaClub` avec matricule si disponible, sinon avec le nom
     b. Calcule `findBestMatch` sur les résultats
     c. Si `confidence = 'high'` et `!dryRun` :
        - Télécharge et stocke le logo (`downloadAndStoreLogo`)
        - Met à jour `club_directory` : `rbfa_status='matched'`, `rbfa_id`, `rbfa_url`, `rbfa_confidence`, `last_verified_at=now()`
     d. Si `confidence = 'medium'` et `!dryRun` :
        - Crée une entrée dans `club_match_reviews` (status='pending')
        - Met à jour `club_directory` : `rbfa_status='pending'`, `rbfa_confidence`, `last_verified_at=now()`
     e. Si `confidence = 'low'` :
        - Met à jour `club_directory` : `rbfa_status='rejected'`, `rbfa_confidence`, `last_verified_at=now()`
     f. Si aucun candidat trouvé :
        - Met à jour `club_directory` : `rbfa_status='skipped'`, `last_verified_at=now()`
  4. Retourne `SyncResult { processed, matched, pendingReview, rejected, skipped, errors }`
- `type SyncResult` exporté depuis `@aureak/types`

### AC9 — Service club-match-reviews : CRUD des révisions manuelles
- Fichier `packages/api-client/src/admin/club-match-reviews.ts`
- Fonctions :
  - `listPendingReviews(tenantId: string): Promise<{ data: ClubMatchReview[]; error: unknown }>`
  - `confirmReview(params: { reviewId, tenantId, reviewedBy }): Promise<{ error: unknown }>`
    - Met `status='confirmed'` dans `club_match_reviews`
    - Déclenche `downloadAndStoreLogo` avec le `rbfa_candidate.logoUrl`
    - Met `club_directory.rbfa_status='matched'`
  - `rejectReview(params: { reviewId, tenantId, reviewedBy }): Promise<{ error: unknown }>`
    - Met `status='rejected'` dans `club_match_reviews`
    - Met `club_directory.rbfa_status='rejected'`
  - `retriggerSearch(params: { clubId, tenantId }): Promise<{ error: unknown }>`
    - Remet `club_directory.rbfa_status='pending'` + `last_verified_at=null`
    - Supprime les reviews pendantes du club

### AC10 — Mise à jour du mapper API club-directory
- `mapRow()` dans `club-directory.ts` inclut les nouveaux champs RBFA :
  `rbfaId`, `rbfaUrl`, `rbfaLogoUrl`, `rbfaConfidence`, `rbfaStatus`, `lastVerifiedAt`
- `ClubDirectoryFields` dans les params de mise à jour ne comprend PAS les champs RBFA (ils sont gérés via rbfa-sync, pas via le formulaire d'édition manuel)

### AC11 — UI Admin : badges et actions RBFA dans ClubCard
- `ClubCard.tsx` affiche :
  - Badge vert "RBFA verifie" si `rbfaStatus === 'matched'` (icône check + couleur `colors.status.success`)
  - Badge orange "A verifier" si une review est pending (icône warning + couleur `colors.accent.goldLight`)
  - Pas de badge si `rbfaStatus === 'pending'` ou `'skipped'`
- Composant `RbfaStatusBadge` créé dans `_components/RbfaStatusBadge.tsx`

### AC12 — UI Admin : actions RBFA dans la fiche club
- La page `clubs/[clubId]/page.tsx` ajoute une section "Enrichissement RBFA" :
  - Affiche le statut courant (`rbfa_status`, `rbfa_confidence`, `last_verified_at`)
  - Si `rbfaStatus === 'matched'` : affiche l'URL RBFA + badge + bouton "Relancer la recherche"
  - Si review pending : affiche les données du candidat RBFA + bouton "Confirmer ce logo" + bouton "Rejeter"
  - Si `rbfaStatus !== 'matched'` : bouton "Lancer la recherche RBFA"
  - Actions appellent les fonctions de `club-match-reviews.ts`

### AC13 — Garde-fous anti-faux-matchs
- Un club dont `rbfa_status = 'matched'` ne sera PAS re-traité par `syncMissingClubLogos` sauf si `retriggerSearch` est appelé explicitement
- Un club avec un logo manuel (`logo_path` non null et `rbfa_status` non concerné) ne se verra pas écraser le logo automatiquement — `downloadAndStoreLogo` utilise un chemin `logo-rbfa.{ext}` distinct. Le logo principal (`logo.{ext}`) n'est touché que si le logo manuel est absent.
- Si un club a déjà `rbfa_status='matched'` mais pas de logo stocké (incohérence), `syncMissingClubLogos` le skip (log warning)

---

## Tasks / Subtasks

- [ ] **Task 1 : Migrations DB** (AC: 1, 2)
  - [ ] 1.1 Écrire `aureak/supabase/migrations/00081_rbfa_enrichment_columns.sql` — colonnes RBFA + index
  - [ ] 1.2 Écrire `aureak/supabase/migrations/00082_club_match_reviews.sql` — table reviews + RLS + index
  - [ ] 1.3 Appliquer les migrations via Supabase MCP

- [ ] **Task 2 : Types TypeScript** (AC: 3)
  - [ ] 2.1 Ajouter `RbfaClubResult`, `RbfaMatchScore`, `RbfaStatus`, `SyncResult` dans `packages/types/src/entities.ts` (ou nouveau fichier `rbfa.ts`)
  - [ ] 2.2 Ajouter `ClubMatchReview` dans `packages/types/src/entities.ts`
  - [ ] 2.3 Étendre `ClubDirectoryEntry` avec les champs RBFA (nullable)
  - [ ] 2.4 Régénérer les types Supabase si nécessaire (`generate_typescript_types` MCP)

- [ ] **Task 3 : Module rbfa-search** (AC: 4)
  - [ ] 3.1 Créer `packages/api-client/src/rbfa/rbfa-search.ts`
  - [ ] 3.2 Implémenter le cache mémoire avec TTL 10 min
  - [ ] 3.3 Implémenter le rate limiter (délai 2s minimum entre requêtes)
  - [ ] 3.4 Implémenter fetch avec timeout 10s, retry x2, User-Agent identifié
  - [ ] 3.5 **PREREQUIS** : inspecter manuellement la structure HTML de rbfa.be pour valider l'URL de recherche et les sélecteurs CSS

- [ ] **Task 4 : Module rbfa-parser** (AC: 5)
  - [ ] 4.1 Créer `packages/api-client/src/rbfa/rbfa-parser.ts`
  - [ ] 4.2 Implémenter `parseRbfaSearchResults(html)` avec sélecteurs documentés
  - [ ] 4.3 Implémenter `normalizeClubName(name)` et `extractRbfaId(url)`
  - [ ] 4.4 Tests unitaires : `packages/api-client/src/rbfa/__tests__/rbfa-parser.test.ts` avec fixtures HTML

- [ ] **Task 5 : Module club-matching** (AC: 6)
  - [ ] 5.1 Créer `packages/api-client/src/rbfa/club-matching.ts`
  - [ ] 5.2 Implémenter `scoreMatch()` — algorithme de scoring documenté
  - [ ] 5.3 Choisir et intégrer une librairie de similarité de chaînes (voir Dev Notes)
  - [ ] 5.4 Implémenter `findBestMatch()`
  - [ ] 5.5 Tests unitaires : `packages/api-client/src/rbfa/__tests__/club-matching.test.ts`
    - Cas: matricule exact → always high
    - Cas: nom exact, villes différentes → medium
    - Cas: nom similaire, même ville → medium ou high selon score
    - Cas: aucune correspondance → low

- [ ] **Task 6 : Module club-logo-import** (AC: 7)
  - [ ] 6.1 Créer `packages/api-client/src/rbfa/club-logo-import.ts`
  - [ ] 6.2 Implémenter `downloadAndStoreLogo()` avec validation, upload, rollback, audit log
  - [ ] 6.3 Créer `packages/api-client/src/rbfa/index.ts` (re-exports propres)

- [ ] **Task 7 : Service rbfa-sync** (AC: 8)
  - [ ] 7.1 Créer `packages/api-client/src/admin/rbfa-sync.ts`
  - [ ] 7.2 Implémenter `syncMissingClubLogos()` avec logique séquentielle + dryRun
  - [ ] 7.3 Exporter depuis `packages/api-client/src/admin/index.ts` (ou index principal)

- [ ] **Task 8 : Service club-match-reviews** (AC: 9)
  - [ ] 8.1 Créer `packages/api-client/src/admin/club-match-reviews.ts`
  - [ ] 8.2 Implémenter `listPendingReviews`, `confirmReview`, `rejectReview`, `retriggerSearch`

- [ ] **Task 9 : Mise à jour club-directory.ts** (AC: 10)
  - [ ] 9.1 Mettre à jour `mapRow()` pour inclure les nouveaux champs RBFA
  - [ ] 9.2 Vérifier que `toDbPayload()` n'inclut PAS les champs RBFA (isolation des responsabilités)

- [ ] **Task 10 : UI — Badges et actions RBFA** (AC: 11, 12)
  - [ ] 10.1 Créer `apps/web/app/(admin)/clubs/_components/RbfaStatusBadge.tsx`
  - [ ] 10.2 Intégrer `RbfaStatusBadge` dans `ClubCard.tsx`
  - [ ] 10.3 Ajouter section "Enrichissement RBFA" dans `clubs/[clubId]/page.tsx`
  - [ ] 10.4 Implémenter les actions "Confirmer", "Rejeter", "Relancer la recherche" (calls API)

- [ ] **Task 11 : Sprint-status et mise à jour** (AC: 13)
  - [ ] 11.1 Mettre à jour `sprint-status.yaml` : ajouter epic-28 + story 28-1

---

## Dev Notes

### Contexte architectural existant

**Table `club_directory`** (migration 00033 + 00078 + 00079 + 00080) :
- Champs existants pertinents : `matricule TEXT`, `nom TEXT`, `ville TEXT`, `province belgian_province`, `logo_path TEXT NULL`
- Bucket Storage `club-logos` (privé), chemin actuel : `{tenant_id}/{club_id}/logo.{ext}`
- Pattern logo existant : `uploadClubLogo` dans `club-directory.ts` gère validation + upload + rollback — **réutiliser ce pattern exactement** pour `downloadAndStoreLogo`
- Signed URLs générées à la volée (1h TTL), pas stockées en DB — idem pour RBFA logos stockés

**Pattern accès Supabase** :
- Toujours via `@aureak/api-client`, jamais direct depuis les composants (règle ESLint)
- `supabase` import depuis `../supabase` (relatif dans le package api-client)
- Mapper DB → TS : `mapRow()` camelCase systématique, jamais accès direct `data.snake_case` dans les composants

**Audit logs** :
- Systématique sur toutes les mutations sensibles via `supabase.from('audit_logs').insert()`
- Actions à ajouter : `club_rbfa_logo_imported`, `club_match_review_confirmed`, `club_match_review_rejected`, `club_rbfa_search_triggered`

### Risques identifiés

1. **Structure HTML rbfa.be fragile** — Le scraping peut casser sans préavis si RBFA change son site. Mitigation : isoler le parsing dans `rbfa-parser.ts`, documenter les sélecteurs en commentaire, prévoir fallback gracieux (retourne `[]`).

2. **CORS / Anti-bot** — rbfa.be peut bloquer les requêtes fetch depuis un browser (CORS) ou une Edge Function (détection bot). Mitigation : utiliser une Supabase Edge Function avec User-Agent identifié. Si bloqué, documenter et proposer une alternative (import CSV manuel RBFA, ou API officielle si elle existe).

3. **Pas d'API officielle RBFA** — On scrape du HTML, pas une API stable. Si RBFA publie une API, migrer vers celle-ci. L'architecture en modules séparés facilite ce remplacement.

4. **Faux matchs avec matricule absent** — Sans matricule, le score peut atteindre `medium` sur de fausses bases (nom similaire, même ville). Le seuil `high` (75+) sans matricule est difficile à atteindre — c'est intentionnel. Ne pas baisser le seuil.

5. **Timeout Deno Edge Functions** — Les Edge Functions Supabase ont un timeout de 2min. `syncMissingClubLogos` pour 50 clubs (avec délai 2s/club = 100s minimum) est à la limite. Limiter à `maxClubs=20` pour les appels Edge Function, ou implémenter en CLI local.

### Hypothèses fragiles

1. **Le matricule RBFA = le matricule dans `club_directory.matricule`** — Si les formats diffèrent (espaces, zéros préfixes), la normalisation dans `scoreMatch()` doit le gérer (`normalizeMatricule = trim + replace(/\s/g,'').toUpperCase()`).

2. **rbfa.be retourne du HTML parseable** — Si RBFA migre vers une SPA React sans SSR, le HTML sera vide. À vérifier en inspectant le network lors d'une recherche sur rbfa.be.

3. **Les URLs de logos RBFA sont stables** — Les URLs `rbfa_logo_url` stockées peuvent devenir invalides si RBFA restructure son CDN. Mitigation : toujours stocker le logo dans notre Storage (`logo-rbfa.{ext}`), l'URL RBFA n'est qu'une référence.

### Librairie de similarité de chaînes

Pour l'algorithme Jaro-Winkler dans `club-matching.ts`, utiliser une des options suivantes (à vérifier compatibilité monorepo) :
- **Option A** : `fastest-levenshtein` (ultra-légère, CommonJS compatible) → `npm install fastest-levenshtein`
- **Option B** : Implémentation inline simple (Levenshtein normalisé sur 12 points, ~20 lignes) — évite une dépendance externe

Recommandation : **Option B** (implémentation inline) pour un module aussi léger, évite une dépendance tierce pour 20 lignes de code.

### Algorithme de scoring — implémentation de référence

```typescript
// Levenshtein normalisé (inline, pas de dépendance)
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const maxLen = Math.max(a.length, b.length)
  // ... implementation standard
  return (maxLen - editDistance(a, b)) / maxLen
}

function scoreMatch(aureak: ClubDirectoryEntry, rbfa: RbfaClubResult): RbfaMatchScore {
  let total = 0
  const detail: RbfaMatchScore = { total: 0, matricule: 0, nomExact: 0, nomSimilarite: 0, ville: 0, province: 0, confidence: 'low' }

  // Matricule : critère dominant
  const matA = normalizeMatricule(aureak.matricule)
  const matB = normalizeMatricule(rbfa.matricule)
  if (matA && matB && matA === matB) {
    detail.matricule = 60
    total += 60
  }

  // Nom exact normalisé
  const nomA = normalizeClubName(aureak.nom)
  const nomB = normalizeClubName(rbfa.nom)
  if (nomA === nomB) {
    detail.nomExact = 20
    total += 20
  } else {
    // Similarité 0–12
    const sim = levenshteinSimilarity(nomA, nomB)
    detail.nomSimilarite = Math.round(sim * 12)
    total += detail.nomSimilarite
  }

  // Ville
  if (aureak.ville && rbfa.ville && normalizeClubName(aureak.ville) === normalizeClubName(rbfa.ville)) {
    detail.ville = 5
    total += 5
  }

  // Province
  if (aureak.province && rbfa.province && mapRbfaProvince(rbfa.province) === aureak.province) {
    detail.province = 3
    total += 3
  }

  total = Math.min(100, total)
  detail.total = total
  detail.confidence = detail.matricule === 60 || total >= 75 ? 'high'
    : total >= 40 ? 'medium' : 'low'

  return detail
}
```

### Structure de fichiers cibles

```
aureak/
├── supabase/migrations/
│   ├── 00081_rbfa_enrichment_columns.sql   [NOUVEAU]
│   └── 00082_club_match_reviews.sql        [NOUVEAU]
│
├── packages/
│   ├── types/src/
│   │   └── entities.ts                     [MODIFIE — types RBFA]
│   │
│   └── api-client/src/
│       ├── rbfa/                           [NOUVEAU dossier]
│       │   ├── rbfa-search.ts              [NOUVEAU]
│       │   ├── rbfa-parser.ts              [NOUVEAU]
│       │   ├── club-matching.ts            [NOUVEAU]
│       │   ├── club-logo-import.ts         [NOUVEAU]
│       │   ├── index.ts                    [NOUVEAU]
│       │   └── __tests__/
│       │       ├── rbfa-parser.test.ts     [NOUVEAU]
│       │       └── club-matching.test.ts   [NOUVEAU]
│       │
│       └── admin/
│           ├── club-directory.ts           [MODIFIE — mapRow + types]
│           ├── rbfa-sync.ts                [NOUVEAU]
│           └── club-match-reviews.ts       [NOUVEAU]
│
└── apps/web/app/(admin)/clubs/
    ├── _components/
    │   ├── ClubCard.tsx                    [MODIFIE — badge RBFA]
    │   └── RbfaStatusBadge.tsx             [NOUVEAU]
    └── [clubId]/
        └── page.tsx                        [MODIFIE — section RBFA]
```

### Points de vigilance design system

- Tokens à utiliser pour les badges (pas de valeurs hardcodées) :
  - Badge "verifie" : `colors.status.success` (#10B981)
  - Badge "a verifier" : `colors.accent.goldLight` (#D6C98E) + `colors.border.gold`
  - Badge "rejete" : `colors.accent.red` (#E05252)
- Composant `Badge` existant dans `@aureak/ui` — utiliser les variants `light` ou `goldOutline`
- Police UI : tokens Geist depuis `assets/fonts/Geist/`

### Ordre d'implémentation recommandé

1. Migrations DB (Task 1) → appliquer immédiatement
2. Types TS (Task 2) → compile check
3. `rbfa-parser.ts` + tests (Task 4) — nécessite inspection manuelle de rbfa.be d'abord
4. `club-matching.ts` + tests (Task 5)
5. `rbfa-search.ts` (Task 3) — dépend de l'exploration rbfa.be
6. `club-logo-import.ts` (Task 6)
7. `rbfa-sync.ts` (Task 7)
8. `club-match-reviews.ts` (Task 8)
9. Mise à jour `club-directory.ts` (Task 9)
10. UI badges + actions (Task 10)

### Contraintes d'architecture à respecter

- **Accès Supabase** : uniquement via `@aureak/api-client` — les fonctions rbfa-sync et club-match-reviews utilisent `supabase` importé depuis `../supabase`
- **Isolation tenant** : `tenant_id` obligatoire dans toutes les requêtes — jamais de requête sans filtre tenant
- **Pas de fetch direct côté composant** : le composant `clubs/[clubId]/page.tsx` appelle uniquement les fonctions exportées de `@aureak/api-client`
- **Logo manuel vs logo RBFA** : chemin distinct (`logo.{ext}` vs `logo-rbfa.{ext}`) — ne jamais écraser le logo manuel

### Références sources

- Architecture monorepo : [Source: `_bmad-output/planning-artifacts/architecture.md` — Monorepo structure]
- Pattern API client Supabase : [Source: `aureak/packages/api-client/src/admin/club-directory.ts` — uploadClubLogo, mapRow]
- Migration club_directory : [Source: `aureak/supabase/migrations/00033_create_club_directory.sql`]
- Migration logo : [Source: `aureak/supabase/migrations/00079_club_logo_path.sql`]
- Bucket club-logos : [Source: `aureak/supabase/migrations/00079_club_logo_path.sql` — policies RLS Storage]
- Design tokens badges : [Source: `aureak/packages/theme/tokens.ts` — colors.status.success, colors.accent.goldLight, colors.accent.red]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `aureak/supabase/migrations/00081_rbfa_enrichment_columns.sql` [NOUVEAU]
- `aureak/supabase/migrations/00082_club_match_reviews.sql` [NOUVEAU]
- `aureak/packages/types/src/entities.ts` [MODIFIE]
- `aureak/packages/api-client/src/rbfa/rbfa-search.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/rbfa-parser.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/club-matching.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/club-logo-import.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/index.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/__tests__/rbfa-parser.test.ts` [NOUVEAU]
- `aureak/packages/api-client/src/rbfa/__tests__/club-matching.test.ts` [NOUVEAU]
- `aureak/packages/api-client/src/admin/club-directory.ts` [MODIFIE]
- `aureak/packages/api-client/src/admin/rbfa-sync.ts` [NOUVEAU]
- `aureak/packages/api-client/src/admin/club-match-reviews.ts` [NOUVEAU]
- `aureak/apps/web/app/(admin)/clubs/_components/RbfaStatusBadge.tsx` [NOUVEAU]
- `aureak/apps/web/app/(admin)/clubs/_components/ClubCard.tsx` [MODIFIE]
- `aureak/apps/web/app/(admin)/clubs/[clubId]/page.tsx` [MODIFIE]
