# Story 28.3 : Import massif des logos RBFA pour tous les clubs

Status: review

---

## Story

En tant qu'administrateur Aureak,
je veux déclencher l'importation des logos de tous les clubs depuis rbfa.be directement depuis l'interface d'administration,
afin que chaque club de l'annuaire ait son logo automatiquement récupéré et stocké sans intervention manuelle club par club.

---

## Acceptance Criteria

### AC1 — Migrations DB : colonnes RBFA sur club_directory
- La migration `00086` ajoute les colonnes suivantes à `club_directory` (toutes nullable) :
  - `rbfa_id TEXT` — identifiant interne RBFA (extrait de l'URL)
  - `rbfa_url TEXT` — URL de la fiche club sur rbfa.be
  - `rbfa_logo_url TEXT` — URL source du logo sur le CDN RBFA (référence, pas stocké)
  - `rbfa_confidence NUMERIC(5,2)` — score de matching 0–100
  - `rbfa_status TEXT CHECK (rbfa_status IN ('pending','matched','rejected','skipped')) DEFAULT 'pending'`
  - `last_verified_at TIMESTAMPTZ` — date du dernier passage
- Index `(tenant_id, rbfa_status)` pour les requêtes batch

### AC2 — Migration DB : table club_match_reviews
- La migration `00087` crée la table `club_match_reviews` :
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `tenant_id UUID NOT NULL REFERENCES tenants(id)`
  - `club_directory_id UUID NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE`
  - `rbfa_candidate JSONB NOT NULL`
  - `match_score NUMERIC(5,2) NOT NULL`
  - `score_detail JSONB NOT NULL`
  - `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected'))`
  - `reviewed_by UUID REFERENCES auth.users(id) NULL`
  - `reviewed_at TIMESTAMPTZ NULL`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- RLS : isolation par `tenant_id`, accès admin uniquement
- Index sur `(tenant_id, status)` et `(club_directory_id)`

### AC3 — Page admin `/clubs/rbfa-sync`
- Page accessible depuis la page liste clubs (`/clubs`) via un bouton "Import logos RBFA"
- La page affiche :
  - Statistiques actuelles : nombre de clubs par `rbfa_status` (pending / matched / rejected / skipped)
  - Bouton principal **"Lancer l'import"** — déclenche `syncMissingClubLogos` sur tous les clubs en `pending`
  - Bouton secondaire **"Relancer tout"** — remet tous les clubs non-matched à `rbfa_status='pending'` puis lance l'import
  - Zone de résultats : après exécution, affiche `SyncResult` (processed / matched / pendingReview / rejected / skipped / errors)

### AC4 — Comportement du bouton "Lancer l'import"
- Pendant l'exécution : bouton désactivé + spinner + texte "Import en cours…"
- Appelle `syncMissingClubLogos(tenantId)` depuis `@aureak/api-client`
- À la fin : affiche le résumé des résultats sous forme de cards colorées :
  - ✅ `matched` — vert (`colors.status.success`)
  - ⏳ `pendingReview` — or (`colors.accent.goldLight`) — "à valider manuellement"
  - ❌ `rejected` — rouge (`colors.accent.red`) — "score trop faible"
  - ⏭️ `skipped` — gris — "aucun résultat RBFA"
  - ⚠️ `errors` — orange — "erreurs techniques"

### AC5 — Bouton "Relancer tout"
- Confirmation demandée avant exécution : "Cela remettra tous les clubs non-matchés en file d'attente. Continuer ?"
- Appelle une nouvelle fonction `resetAllClubsForSync(tenantId)` qui :
  - Met `rbfa_status = 'pending'` pour tous les clubs où `rbfa_status IN ('rejected','skipped')`
  - Ne touche PAS les clubs `matched` (on ne réimporte pas un logo déjà validé)
  - Supprime les `club_match_reviews` pending associés à ces clubs
- Puis déclenche automatiquement l'import

### AC6 — Fallback logo depuis la page de détail RBFA
- Dans `rbfa-sync.ts`, quand `confidence === 'high'` mais `candidate.logoUrl === null` :
  - Tenter de récupérer le logo depuis la page `https://www.rbfa.be/fr/club/{rbfaId}`
  - Parser le HTML à la recherche d'une balise `<img>` contenant le logo du club (sélecteur à documenter en commentaire)
  - Si logo trouvé → `importRbfaLogo` avec cette URL
  - Si toujours pas de logo → sauvegarder le matching RBFA sans logo (`logo_path` inchangé)
- Cette tentative est silencieuse (log warning en cas d'échec, jamais throw)

### AC7 — Bouton "Import logos RBFA" sur la page liste clubs
- Dans `apps/web/app/(admin)/clubs/index.tsx` (ou page.tsx), ajouter un bouton dans la toolbar
- Bouton label : "Import RBFA" avec icône téléchargement
- Navigue vers `/clubs/rbfa-sync`

### AC8 — Nouvelle fonction `resetAllClubsForSync` dans l'API
- Fichier : `packages/api-client/src/admin/rbfa-sync.ts`
- Fonction `resetAllClubsForSync(tenantId: string): Promise<{ count: number; error: unknown }>`
- Met `rbfa_status = 'pending'` + `last_verified_at = null` pour les clubs `rejected` ou `skipped`
- Supprime les reviews pending associées (`DELETE FROM club_match_reviews WHERE club_directory_id IN (...) AND status='pending'`)

---

## Tasks / Subtasks

- [x] **Task 1 : Migrations DB** (AC: 1, 2)
  - [x] 1.1 Créer `supabase/migrations/00086_rbfa_enrichment_columns.sql` — colonnes RBFA + index
  - [x] 1.2 Créer `supabase/migrations/00087_club_match_reviews.sql` — table reviews + RLS + index
  - [x] 1.3 Appliquer via `supabase db push`

- [x] **Task 2 : Fonction `resetAllClubsForSync`** (AC: 5, 8)
  - [x] 2.1 Ajouter `resetAllClubsForSync(tenantId)` dans `packages/api-client/src/admin/rbfa-sync.ts`
  - [x] 2.2 Exporter depuis l'index admin

- [x] **Task 3 : Fallback logo page de détail RBFA** (AC: 6)
  - [x] 3.1 Dans `rbfa-sync.ts`, dans `processClub`, ajouter la tentative fallback quand `confidence=high && logoUrl=null`
  - [x] 3.2 Créer `fetchLogoFromClubPage(rbfaId: string): Promise<string | null>` dans `rbfa-search.ts`
  - [x] 3.3 Parser le HTML de `https://www.rbfa.be/fr/club/{rbfaId}` — documenter le sélecteur CSS du logo en commentaire
  - [x] 3.4 Tester manuellement sur 2-3 clubs pour valider le sélecteur (sélecteurs AWS S3 + "logo" URL documentés)

- [x] **Task 4 : Page admin `/clubs/rbfa-sync`** (AC: 3, 4, 5)
  - [x] 4.1 Créer `apps/web/app/(admin)/clubs/rbfa-sync/index.tsx` (re-export pattern)
  - [x] 4.2 Créer `apps/web/app/(admin)/clubs/rbfa-sync/page.tsx`
  - [x] 4.3 Afficher les stats par `rbfa_status` via `getClubRbfaStats(tenantId)`
  - [x] 4.4 Bouton "Lancer l'import" + état loading + affichage `SyncResult`
  - [x] 4.5 Bouton "Relancer tout" + modal de confirmation
  - [x] 4.6 Cartes résultats colorées (matched/pendingReview/rejected/skipped/errors)

- [x] **Task 5 : Bouton dans la liste clubs** (AC: 7)
  - [x] 5.1 Ajouter bouton "Import RBFA" dans la toolbar de `clubs/page.tsx`

- [x] **Task 6 : Mise à jour sprint-status** (AC: -)
  - [x] 6.1 `28-3-rbfa-import-logos-tous-clubs: in-progress` dans `sprint-status.yaml`

---

## Dev Notes

### Contexte critique — Infrastructure 28-1 déjà implémentée

**Tous ces fichiers existent et sont fonctionnels :**
```
aureak/packages/api-client/src/admin/
├── rbfa-search.ts       — GraphQL endpoint datalake-prod2018.rbfa.be/graphql
├── rbfa-parser.ts       — normalise résultats, filtre no_logo.jpg
├── club-matching.ts     — scoring Levenshtein (W_MATRICULE=60, W_NOM_EXACT=20, W_NOM_SIM=12)
├── club-logo-import.ts  — télécharge logo CDN RBFA → Supabase Storage club-logos
├── rbfa-sync.ts         — batch séquentiel syncMissingClubLogos(tenantId)
└── club-match-reviews.ts — CRUD reviews manuelles
```

**⚠️ BLOCAGE** : les migrations 00081/00082 planifiées en 28-1 n'ont jamais été créées — les numéros ont été pris par d'autres stories (`faults_independent`, `mini_exercises_sequence_link`). Les colonnes `rbfa_id`, `rbfa_status`, etc. n'existent PAS en DB. **Task 1 est donc un prérequis absolu.**

### GraphQL RBFA — endpoint découvert via Playwright

```
POST https://datalake-prod2018.rbfa.be/graphql
Headers: { Origin: 'https://www.rbfa.be', Content-Type: 'application/json' }
Query: DoSearch — variables: { first, offset, filter: { query }, language: 'fr', channel: 'belgianfootball', location: 'www.rbfa.be' }
Response: { data: { search: { results: [{ id, logo, clubName, registrationNumber }] } } }
```

Le champ `logo` retourne souvent `...no_logo.jpg` pour les clubs sans logo dans GraphQL.
Dans ce cas, le fallback (AC6) doit aller chercher sur la page HTML `rbfa.be/fr/club/{id}`.

### Pattern routing Expo Router (CRITIQUE)

- `page.tsx` = composant réel — jamais accessible directement comme route
- `index.tsx` = re-export `./page` pour rendre la route accessible
- Toujours créer les deux fichiers pour chaque nouvelle route

```tsx
// rbfa-sync/index.tsx
export { default } from './page'
```

### Design tokens à utiliser

```ts
// Résultats import
matched      → colors.status.success   (#10B981)
pendingReview → colors.accent.goldLight (#D6C98E) + colors.border.gold
rejected     → colors.accent.red       (#E05252)
skipped      → colors.text.muted
errors       → colors.accent.red (variante warning)

// Fond page
colors.light.primary      (#F3EFE7)
colors.light.surface      (#FFFFFF)  ← cards résultats
colors.border.light       ← bordures
shadows.sm                ← cards
```

### Structure SQL migration 00086

```sql
-- 00086_rbfa_enrichment_columns.sql
ALTER TABLE club_directory
  ADD COLUMN IF NOT EXISTS rbfa_id          TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_url         TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_logo_url    TEXT,
  ADD COLUMN IF NOT EXISTS rbfa_confidence  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS rbfa_status      TEXT DEFAULT 'pending'
                           CHECK (rbfa_status IN ('pending','matched','rejected','skipped')),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_club_directory_rbfa_status
  ON club_directory(tenant_id, rbfa_status)
  WHERE deleted_at IS NULL;
```

### Structure SQL migration 00087

```sql
-- 00087_club_match_reviews.sql
CREATE TABLE IF NOT EXISTS club_match_reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  club_directory_id UUID        NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE,
  rbfa_candidate    JSONB       NOT NULL,
  match_score       NUMERIC(5,2) NOT NULL,
  score_detail      JSONB       NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','rejected')),
  reviewed_by       UUID        REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_match_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access club_match_reviews"
  ON club_match_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.tenant_id = club_match_reviews.tenant_id
    )
  );

CREATE INDEX idx_club_match_reviews_status
  ON club_match_reviews(tenant_id, status);

CREATE INDEX idx_club_match_reviews_club
  ON club_match_reviews(club_directory_id);
```

### Page rbfa-sync — structure JSX cible

```tsx
// La page affiche 3 zones :
// 1. Stats actuelles (cards par rbfa_status)
// 2. Boutons d'action (Lancer import / Relancer tout)
// 3. Résultats après exécution (SyncResult cards)

// Stats : requête directe Supabase groupée
const { data } = await supabase
  .from('club_directory')
  .select('rbfa_status')
  .eq('tenant_id', tenantId)
  .is('deleted_at', null)
// côté client : compter les occurrences de chaque status

// Lancer import
const result = await syncMissingClubLogos(tenantId)
// Afficher result.matched, result.pendingReview, result.rejected, result.skipped, result.errors
```

### Fallback logo — implémentation cible

```ts
// Dans rbfa-search.ts, ajouter :
export async function fetchLogoFromClubPage(rbfaId: string): Promise<string | null> {
  const url = `https://www.rbfa.be/fr/club/${rbfaId}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Aureak Club Sync' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const html = await res.text()
    // Sélecteur à documenter après inspection manuelle de la page club RBFA
    // Exemple : <img class="club-logo" src="..."> ou <img data-src="...logo...">
    // TODO: inspecter rbfa.be/fr/club/{id} manuellement pour valider le sélecteur
    const match = html.match(/class="[^"]*logo[^"]*"[^>]*src="([^"]+\.(png|jpg|jpeg|svg))"/i)
                   ?? html.match(/src="(https:\/\/[^"]+logo[^"]+\.(png|jpg|jpeg))"/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}
```

### Ordre d'implémentation recommandé

1. **Task 1** — Migrations DB (prérequis absolu — le code existant plantera sans ces colonnes)
2. **Task 2** — `resetAllClubsForSync` (simple, dans fichier existant)
3. **Task 3** — Fallback logo (inspecter rbfa.be/fr/club/{id} manuellement avant d'écrire le sélecteur)
4. **Task 4** — Page rbfa-sync (UI principale)
5. **Task 5** — Bouton liste clubs (trivial)
6. **Task 6** — Sprint-status

### Contraintes architecture à respecter

- **Accès Supabase** : uniquement via `@aureak/api-client` — la page `.tsx` n'importe jamais `supabase` directement
- **Isolation tenant** : `tenantId` obligatoire dans toutes les requêtes
- **Pattern routing** : créer `index.tsx` + `page.tsx` pour la nouvelle route `/clubs/rbfa-sync`
- **Logo manuel protégé** : `syncMissingClubLogos` utilise le chemin `logo-rbfa.{ext}`, le logo manuel `logo.{ext}` n'est jamais écrasé
- **Rate limiting RBFA** : délai 2s entre requêtes (déjà dans `rbfa-sync.ts` — ne pas retirer)

### Points de vigilance

1. **Timeout long** — `syncMissingClubLogos` sur 100+ clubs prend plusieurs minutes (2s/club). L'UI doit gérer un état "loading" prolongé. Ne pas utiliser de `Promise.all` parallèle — le rate limiting RBFA est séquentiel par design.
2. **CORS possible** — Si `fetchLogoFromClubPage` est appelé depuis le browser (côté web), rbfa.be peut refuser. Si CORS bloque, cette fonction ne doit être appelée QUE côté serveur (Edge Function ou script CLI). Documenter dans le code si tel est le cas.
3. **`rbfa_status` DEFAULT 'pending'** — Tous les clubs existants sans `rbfa_status` obtiennent `pending` par défaut après migration — c'est le comportement voulu pour que le premier import les traite tous.

### Références sources

- Infrastructure 28-1 : `aureak/packages/api-client/src/admin/rbfa-sync.ts` — `syncMissingClubLogos`
- Search RBFA : `aureak/packages/api-client/src/admin/rbfa-search.ts` — endpoint GraphQL
- Import logo : `aureak/packages/api-client/src/admin/club-logo-import.ts` — `importRbfaLogo`
- Matching : `aureak/packages/api-client/src/admin/club-matching.ts` — `findBestMatch`
- Page liste clubs : `aureak/apps/web/app/(admin)/clubs/` — toolbar existante
- Design tokens : `aureak/packages/theme/tokens.ts`
- Pattern routing : `aureak/apps/web/app/(admin)/clubs/rbfa-sync/` à créer

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Migration 00087 : premier push échoué — `profiles.id` n'existe pas (clé primaire = `user_id`), corrigé en `profiles.user_id = auth.uid()` et `profiles.user_role = 'admin'`

### Completion Notes List

- ✅ Task 1 : Migrations 00086 (colonnes RBFA) + 00087 (club_match_reviews) créées et appliquées via `supabase db push`
- ✅ Task 2 : `resetAllClubsForSync(tenantId)` + `getClubRbfaStats(tenantId)` + `RbfaStats` type ajoutés dans `rbfa-sync.ts`, exportés depuis `index.ts`
- ✅ Task 3 : `fetchLogoFromClubPage(rbfaId)` ajouté dans `rbfa-search.ts` — 2 sélecteurs regex (AWS S3 CDN + "logo" URL). Intégré dans `processClub` de `rbfa-sync.ts` comme fallback sur confidence=high && logoUrl=null
- ✅ Task 4 : Page `/clubs/rbfa-sync` complète — stats actuelles (4 StatCards), bouton Lancer import, bouton Relancer tout + Modal confirmation, 6 ResultCards après sync
- ✅ Task 5 : Bouton "Import RBFA" avec style `rbfaBtn` ajouté dans la toolbar de `clubs/page.tsx`
- Aucune erreur TS dans les fichiers modifiés (erreurs pré-existantes dans autres fichiers non touchées)

### File List

- `supabase/migrations/00086_rbfa_enrichment_columns.sql` [NOUVEAU]
- `supabase/migrations/00087_club_match_reviews.sql` [NOUVEAU]
- `aureak/packages/api-client/src/admin/rbfa-sync.ts` [MODIFIE — getClubRbfaStats, RbfaStats, resetAllClubsForSync, fallback logo dans processClub]
- `aureak/packages/api-client/src/admin/rbfa-search.ts` [MODIFIE — fetchLogoFromClubPage]
- `aureak/packages/api-client/src/index.ts` [MODIFIE — exports resetAllClubsForSync, getClubRbfaStats, RbfaStats]
- `aureak/apps/web/app/(admin)/clubs/rbfa-sync/index.tsx` [NOUVEAU]
- `aureak/apps/web/app/(admin)/clubs/rbfa-sync/page.tsx` [NOUVEAU]
- `aureak/apps/web/app/(admin)/clubs/page.tsx` [MODIFIE — bouton Import RBFA + style rbfaBtn]
