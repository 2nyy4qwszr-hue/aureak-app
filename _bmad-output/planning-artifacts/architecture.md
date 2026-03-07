---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-Application Aureak-2026-03-02.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-04'
project_name: 'Application Aureak'
user_name: 'Jeremydevriendt'
date: '2026-03-04'
---

# Architecture Decision Document

_Ce document se construit collaborativement à travers une découverte étape par étape. Les sections sont ajoutées au fil des décisions architecturales prises ensemble._

---

## Analyse du Contexte Projet

### Vue d'ensemble des exigences

**Exigences Fonctionnelles :**

109 exigences fonctionnelles organisées en 12 catégories sur 3 phases de développement :

| Catégorie | # FRs | Phase |
|---|---|---|
| Gestion des utilisateurs & accès (RBAC 6 rôles) | FR1–FR9, FR60–FR62 | MVP |
| Opérations terrain & présences (offline-first) | FR10–FR19, FR57–FR59, FR95–FR96 | MVP |
| Évaluation & boucle pédagogique | FR20–FR28, FR72, FR76, FR101–FR109 | MVP + Phase 2 |
| Référentiel technique & contenu pédagogique | FR66–FR81, FR92–FR94, FR105–FR109 | MVP + Phase 2-3 |
| Communication & notifications multi-canal | FR29–FR33 | MVP |
| Tableaux de bord utilisateur | FR34–FR40 | MVP + Phase 2 |
| Supervision admin, qualité & benchmark | FR41–FR45, FR63–FR65 | MVP + Phase 2 |
| Grades coach | FR82–FR86 | MVP |
| Gestion des clubs & partenariats | FR87–FR91 | MVP |
| Gestion médicale | FR53–FR56 | Phase 2 |
| Conformité & intégrité des données (RGPD) | FR46–FR49, FR97–FR100 | MVP |
| Module business (Stripe) | FR50–FR52 | Phase 2 |

**Exigences Non-Fonctionnelles critiques :**

- **Performance** : enregistrement présence <2s (online), immédiat (offline) ; cold start app <3s ; API <300ms P95 ; notification push post-séance <60s
- **Sécurité** : TLS 1.2+, AES-256 au repos, RBAC serveur-side exclusivement, isolation tenant_id sans tolérance de fuite, streaming vidéo uniquement (aucun download)
- **Fiabilité** : disponibilité ≥95%, taux sync offline ≥90%, zéro perte silencieuse de données, persistance locale survie à une fermeture forcée
- **RGPD mineurs** : consentement parental avant tout traitement, effacement médias <24h sur retrait, audit log immuable ≥5 ans, anonymisation systématique des agrégats inter-implantations
- **Scalabilité** : 1 000 utilisateurs simultanés (horizon 2-3 ans), évolutif 5 000, ≤50 implantations sans dégradation

**Échelle & Complexité :**

- Complexité projet : **HIGH** — Vertical SaaS + Sports EdTech + RGPD mineurs + offline-first
- Domaine technique principal : full-stack mobile-first (terrain) + web (admin/bureau/parent)
- Contexte : greenfield, solo developer, ~110 adhérents actuels → cible 1 000+

### Contraintes Techniques & Dépendances

**Décisions de stack déjà arrêtées (UX Spec) :**

- **Mobile** : React Native + Expo Router (iOS + Android depuis une seule codebase)
- **Web** : Expo Router web
- **UI** : Tamagui (composants partagés mobile + web)
- **Structure** : Monorepo — `apps/mobile` + `apps/web` + `packages/ui`, `business-logic`, `api-client`, `types`, `theme`
- **Design tokens** : définis dans `packages/theme/tokens.ts` — aucune valeur hardcodée autorisée

**Contraintes opérationnelles :**
- Budget infrastructure ~250€/mois
- Solo developer — MVP ruthlessly lean
- Beta fermée initiale (110 adhérents connus, consentements manuels) avant DPO désigné
- Pas de PWA pour le terrain — app native obligatoire (offline, GPS, notifications natives)

**Intégrations MVP identifiées :**
- Push notifications : APNs (iOS) + FCM (Android)
- Email transactionnel : annulations, notifications post-séance
- SMS : annulations terrain (canal critique)
- Export calendrier `.ics` : synchro calendrier parent

### Préoccupations Transversales Identifiées

Les éléments suivants affectent plusieurs composants et devront être décidés de manière cohérente :

1. **Offline/Sync Engine** — Stockage local persistant + queue de synchronisation + conflict resolution (priorité serveur) + alertes visibles + rappel J+1. Affecte : toutes les features coach terrain
2. **RBAC & Isolation Tenant** — Filtrage `tenant_id` côté serveur à chaque requête, vérification rôle serveur-side exclusivement. Affecte : toutes les routes API
3. **RGPD & Audit** — Séparation données structurées / médias, consentements trackés, audit log immuable. Affecte : modèle de données entier
4. **Notification Pipeline** — Déclenchement automatique post-validation, multi-canal (push + email + SMS). Affecte : flow de clôture séance, annulations
5. **Video Pipeline (Phase 2)** — CDN streaming only, double verrou admin validation, durée/poids limités, purge automatique sur retrait consentement
6. **Auth multi-mode** — Auth standard + auth rapide géolocalisée (PIN + GPS périmètre), session expirante, logging événements auth rapide

---

## Évaluation du Starter Template

### Domaine Technique Principal

**Full-stack mobile-first** (terrain offline) + web dashboard (admin/parent/bureau)
Stack décidée en amont dans l'UX Spec — évaluation porte sur le meilleur point de départ.

### Options de Starter Considérées

| Option | Stack | Alignement UX Spec | Recommandation |
|---|---|---|---|
| `yarn create tamagui@latest --template expo-router` | Expo Router + Tamagui | ✅ Expo Router web (aligné) | ✅ Retenu |
| `tamagui/starter-free` | Expo + Next.js + Solito + Tamagui | ❌ Next.js au lieu d'Expo Router web | Écarté |
| Setup custom depuis `create-expo-app` | Manuel | ✅ Parfait alignement | ⚙️ Alternatif si friction starter |

### Starter Retenu : `create tamagui` — template expo-router

**Justification :**
- Seul template officiel Tamagui aligné avec Expo Router pour le web (choix UX Spec)
- Tamagui + Metro config web préconfigurés — évite les problèmes d'intégration manuelle
- TypeScript + Expo Router fonctionnel dès l'initialisation
- Maintenu officiellement par l'équipe Tamagui
- Solo developer : évite la configuration manuelle fastidieuse

**Commande d'initialisation :**

```bash
yarn create tamagui@latest --template expo-router
# Nécessite Yarn 4.4.0+
```

**Décisions architecturales fournies par le starter :**

**Langage & Runtime :**
TypeScript configuré, Expo SDK dernière version stable, Node.js LTS requis

**UI & Styling :**
Tamagui installé et configuré (provider, thème de base, babel plugin) — prêt pour les tokens AUREAK

**Build & Bundling :**
Metro configuré avec support web, Expo Router pour le routing universel mobile + web

**Structure de code :**
Structure de base app/ avec Expo Router, à réorganiser en monorepo selon l'UX Spec

**Expérience de développement :**
Hot reload, Expo Go compatible, TypeScript strict, support web intégré

### Structure Monorepo Cible (post-initialisation)

La structure définie dans l'UX Spec sera mise en place après le bootstrapping :

```
apps/
  mobile/         → Expo (iOS + Android) — offline-first, terrain
  web/            → Expo Router web — parents, admin, coach bureau

packages/
  ui/             → Composants Tamagui partagés (@aureak/ui)
  business-logic/ → Règles métier, calculs, validation (100% partagé)
  api-client/     → Appels Supabase (100% partagé)
  types/          → TypeScript types communs
  theme/          → Design tokens AUREAK (tokens.ts)
```

**Note :** La mise en place du projet avec cette commande et la configuration du monorepo constitue la première story d'implémentation.

---

## Décisions Architecturales Fondamentales

### Analyse des Priorités

**Décisions critiques (bloquent l'implémentation) :**
- Architecture de données offline (expo-sqlite + sync queue)
- RBAC & isolation tenant (Supabase RLS + Custom Claims)
- Couche API (Supabase client + Edge Functions)

**Décisions importantes (structurent l'architecture) :**
- State management (Zustand + TanStack Query)
- Validation (Zod partagé client/serveur)
- Notifications (Resend + Twilio)

**Décisions différées (post-MVP) :**
- PowerSync pour l'offline-first avancé (Phase 2 si la sync custom atteint ses limites)
- Supabase Pro au lancement (Free pendant le développement)

---

### Architecture de Données

**Stockage offline local — expo-sqlite**
- Décision : `expo-sqlite` (SQLite natif via Expo SDK)
- Justification : données relationnelles (séances, présences, enfants, évaluations) nécessitant des requêtes SQL ; compatible Expo SDK sans config native custom
- Périmètre : toutes les opérations terrain du Coach — check-in, évaluations, consultation fiche séance
- Fourni par starter : Non — à installer dans `apps/mobile`

**Stratégie de synchronisation offline — Custom Queue MVP**
- Décision : file d'attente locale des opérations en attente, retry automatique à la reconnexion, alerte visible sur tout échec
- Principe directeur PRD : *"sync naïve avec retry, alerte visible — ne pas sur-ingénier l'offline v1"*
- Conflict resolution : priorité serveur par défaut (FR95) — le Coach est notifié si une donnée a été modifiée côté serveur pendant son offline (FR96)
- Rappel J+1 si données non synchronisées (FR18)
- Évaluation Phase 2 : PowerSync si la sync custom montre ses limites à l'échelle
- Fourni par starter : Non — à implémenter dans `packages/business-logic`

**Validation des données — Zod**
- Décision : Zod pour la validation TypeScript-first, partagé entre client et serveur
- Usage : validation des inputs formulaires (React Hook Form), validation des payloads Edge Functions, types partagés via `packages/types`
- Fourni par starter : Non — à installer dans `packages/business-logic` + `packages/types`

**Base de données — PostgreSQL via Supabase**
- Décision : PostgreSQL hébergé Supabase, schéma multi-tenant avec `tenant_id` sur toutes les entités
- Multi-tenancy : `tenant_id` filtré côté serveur à chaque requête via RLS — jamais côté client
- Versioning thèmes : chaque entité pédagogique versionnée (FR92-FR94), données enfants liées à la version active au moment de la séance
- Séparation données structurées / médias : données relationnelles dans PostgreSQL, médias dans Supabase Storage (Phase 2)

---

### Authentification & Sécurité

**Authentification — Supabase Auth**
- Décision : Supabase Auth standard + Custom Access Token Hook pour les custom claims JWT
- Sessions : access token max 24h, refresh token 30 jours
- Auth rapide géolocalisée : PIN 4 chiffres + vérification `expo-location` dans le périmètre de l'implantation (défaut 300m, configurable par admin) — session expirante 4h, logging automatique admin

**RBAC — Supabase RLS + Custom Claims**
- Décision : Row Level Security PostgreSQL + rôles encodés en JWT via Custom Access Token Hook
- Rôles : Admin / Coach (avec grades) / Parent / Child / Club Partenaire / Club Commun
- Règle absolue : permissions vérifiées côté serveur à chaque requête — jamais de vérification uniquement côté client (FR61)
- Isolation tenant : `tenant_id` dans JWT, filtré automatiquement par les policies RLS
- Accès cross-tenant : possible uniquement si Admin accorde une permission explicite, logué en audit trail (FR3)

**Géolocalisation — expo-location**
- Décision : `expo-location` pour vérifier la présence du Coach dans le périmètre de l'implantation
- Usage limité : validation session (auth rapide), guard contre les modifications hors-site
- Rayon configurable par implantation (défaut 300m)
- Transparent si succès, visible uniquement en cas d'échec (auth refusée)

**Sécurité transversale :**
- TLS 1.2+ pour toutes les communications
- AES-256 au repos pour les médias (Supabase Storage)
- Audit log immuable : toutes les opérations sensibles tracées (FR46), conservé ≥5 ans (FR100)
- Vidéos : streaming uniquement, aucun endpoint de téléchargement direct (Phase 2)

---

### API & Patterns de Communication

**Couche API — Supabase Client Direct + Edge Functions**
- Décision : Supabase client TypeScript pour toutes les opérations CRUD standard (types auto-générés depuis le schéma PostgreSQL)
- Supabase Edge Functions (Deno) pour la logique serveur complexe :
  - Déclenchement notifications post-séance (push + email + SMS)
  - Résolution de conflits de synchronisation
  - Automation (rappel J+1 sync en attente, alertes admin inactivité coach)
  - Validation double-verrou vidéos admin (Phase 2)
- Pas de couche REST custom à maintenir pour le MVP — évite la complexité inutile (solo developer)

**Notifications multi-canal**
- Push : Expo Notifications SDK → APNs (iOS) + FCM (Android) — déclenché via Edge Function post-validation séance
- Email : **Resend** — intégration native avec Supabase Edge Functions, developer-friendly
- SMS : **Twilio** — intégration Supabase Auth native, couverture internationale, canal critique (annulations terrain)
- Priorité : push + email + SMS en parallèle pour les cas critiques (annulation), push seul post-séance standard

---

### Architecture Frontend

**State Management — Zustand + TanStack Query**
- Décision : combinaison complémentaire (pas concurrente)
- **Zustand** → état client : session UI, état offline/sync, état formulaires en cours, préférences utilisateur
- **TanStack Query** → état serveur : données Supabase (séances, présences, enfants), cache, invalidation, refetch
- Localisation : `packages/business-logic` pour les stores Zustand partagés, hooks TanStack Query co-localisés avec les features

**Formulaires — React Hook Form + Zod**
- Décision : React Hook Form pour la gestion des formulaires (minimal re-renders), Zod pour la validation partagée client/serveur
- Usage terrain coach : formulaires rapides (évaluation post-séance, check-in invité) — performance critique

---

### Infrastructure & Déploiement

**Builds mobiles — Expo EAS Build**
- Décision : Expo EAS Build pour les builds iOS et Android cloud
- EAS Update pour les mises à jour OTA (over-the-air) sans passer par les stores
- Compatible solo developer, pas d'infrastructure de build à maintenir

**CI/CD — GitHub Actions + Expo EAS**
- Décision : GitHub Actions pour les workflows de CI (lint, tests, type-check), EAS CLI intégré pour les builds et déploiements
- Gratuit pour projets solo sur GitHub

**Hébergement — Supabase**
- Décision : Supabase Free pendant le développement → Supabase Pro (~25$/mois) au lancement
- Budget : dans l'enveloppe de 250€/mois (Supabase Pro + EAS + Resend + Twilio)
- Scalabilité : architecture stateless + Supabase horizontalement scalable → cible 1 000 utilisateurs (évolutif 5 000)

---

### Analyse de l'Impact des Décisions

**Séquence d'implémentation dictée par les décisions :**
1. Monorepo setup (Tamagui starter → structure packages/)
2. Supabase project + schéma PostgreSQL + RLS policies + Custom Claims
3. expo-sqlite + sync queue dans packages/business-logic
4. Auth (standard + auth rapide géolocalisée)
5. Supabase client + types générés dans packages/api-client
6. Features MVP par sprint (A puis B)
7. Edge Functions notifications
8. EAS Build config + GitHub Actions

**Dépendances inter-décisions :**
- RLS (2.1) dépend du schéma PostgreSQL (1.1) — à définir ensemble
- Sync queue (1.2) dépend de expo-sqlite (1.1) — même package
- TanStack Query (4.1) s'interface avec Supabase client (3.1) — hooks dans packages/api-client
- Edge Functions notifications (3.1) dépend de Resend + Twilio (3.2) — configurés comme secrets Supabase

---

## Patterns d'Implémentation & Règles de Cohérence

### Points de conflit identifiés : 8 zones + 4 verrouillages additionnels

---

### Zone 1 — Nommage base de données (PostgreSQL)

- Tables : `snake_case` pluriel → `sessions`, `attendances`, `evaluations`, `children`, `tenants`
- Colonnes : `snake_case` → `tenant_id`, `created_at`, `coach_id`, `child_id`
- Clés étrangères : `{table_singulier}_id` → `session_id`, `coach_id`, `parent_id`
- Index : `idx_{table}_{colonne}` → `idx_attendances_session_id`
- Timestamps systématiques : `created_at`, `updated_at` sur toutes les tables

---

### Zone 2 — Nommage code TypeScript

- Composants : `PascalCase` → `ChildCard`, `SessionHeader`, `IndicatorToggle`
- Fichiers composants : `PascalCase.tsx` → `ChildCard.tsx`
- Fichiers utilitaires/hooks : `camelCase.ts` → `useOfflineSync.ts`, `formatDate.ts`
- Variables & fonctions : `camelCase` → `tenantId`, `getSessionData`, `isOffline`
- Types & interfaces : `PascalCase` → `Session`, `AttendanceStatus`, `CoachRole`
- Constantes : `SCREAMING_SNAKE_CASE` → `MAX_VIDEO_DURATION`, `DEFAULT_PERIMETER_RADIUS`
- Fichiers platform-specific : `{nom}.native.ts` / `{nom}.web.ts` — Expo résout automatiquement

---

### Zone 3 — Nommage API (Supabase)

- PostgREST génère depuis les noms de tables → toujours `snake_case` pluriel, automatique
- Query params Supabase : `snake_case` → `?tenant_id=eq.xxx`
- Edge Functions URL : `kebab-case` → `/send-session-notification`, `/resolve-sync-conflict`
- Headers custom : `X-Tenant-Id`, `X-Coach-Id` — usage informatif uniquement (voir Zone 12)

---

### Zone 4 — Transformation snake_case ↔ camelCase

- Supabase retourne `snake_case` → transformer en `camelCase` dans `packages/api-client` **uniquement**
- `packages/types` définit les types TypeScript en `camelCase` (vision client)
- `packages/api-client` gère la transformation à la frontière — **jamais dans les composants**
- Exemple : `session_id` (DB) → `sessionId` (TypeScript type) — transformation dans `api-client`

---

### Zone 5 — Structure des réponses & erreurs

```typescript
// Réponse standard (pattern Supabase natif conservé)
type ApiResponse<T> = {
  data: T | null
  error: ApiError | null
}

// Erreur standard
type ApiError = {
  code: string      // ex: 'SYNC_FAILED', 'AUTH_EXPIRED', 'TENANT_VIOLATION'
  message: string   // message humain
  details?: unknown // données additionnelles pour debug
}

// Offline queue operation (voir Zone 10 — Idempotency)
type QueueOperation = {
  operationId: string  // UUID v4 généré côté client — clé d'idempotency
  type: string         // 'CREATE_ATTENDANCE' | 'UPDATE_EVALUATION' | ...
  payload: unknown
  createdAt: string    // ISO 8601
  retryCount: number
  status: 'pending' | 'syncing' | 'failed'
}
```

---

### Zone 6 — Formats de données

- Dates : **ISO 8601** partout → `"2026-03-04T10:30:00.000Z"` — jamais de timestamp Unix
- Booléens : `true` / `false` — jamais `1` / `0`
- Valeurs nulles : `null` explicite — jamais `undefined` dans les payloads API
- UUIDs : format standard `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` pour tous les IDs

---

### Zone 7 — State management patterns

```typescript
// Zustand — convention de nommage des stores
// use{Domain}Store → useSessionStore, useOfflineStore, useAuthStore

// TanStack Query — structure des query keys (toujours un tableau)
['sessions', 'list', { tenantId, date }]
['children', 'detail', childId]
['attendances', 'list', { sessionId }]

// Mutations Zustand — actions nommées en verbe impératif
setCurrentSession()
addPendingOperation()
clearOfflineQueue()
```

---

### Zone 8 — Patterns de gestion d'état offline

- **Source unique de vérité offline** : `useOfflineStore` (Zustand) — `isOnline`, `pendingOperations`, `lastSyncAt`
- **Indicateur sync** : toujours visible dans le header mobile — jamais de popup bloquant
- **Guard offline** : hook `useRequireOnline()` pour les opérations qui nécessitent le réseau
- **Règle absolue** : aucune opération terrain ne peut échouer silencieusement — toujours une alerte visible (FR17)

---

### Zone 9 — Enums standards (DB + TypeScript) ✅ Ajout verrouillage

Tous les statuts sont définis comme enums PostgreSQL **et** types TypeScript union — aucun string libre autorisé pour les champs à valeurs contraintes.

**Enums PostgreSQL (créés en migration initiale) :**

```sql
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'injured',
  'late',
  'trial'      -- enfant invité non inscrit
);

CREATE TYPE evaluation_signal AS ENUM (
  'positive',  -- 🟢
  'attention', -- 🟡
  'none'       -- ○ vide — aucune information envoyée
);

CREATE TYPE coach_role AS ENUM (
  'admin',
  'coach',
  'parent',
  'child',
  'club_partner',
  'club_common'
);

CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'failed'
);

CREATE TYPE notification_channel AS ENUM (
  'push',
  'email',
  'sms'
);
```

**Types TypeScript miroir dans `packages/types` :**

```typescript
export type AttendanceStatus = 'present' | 'absent' | 'injured' | 'late' | 'trial'
export type EvaluationSignal = 'positive' | 'attention' | 'none'
export type CoachRole = 'admin' | 'coach' | 'parent' | 'child' | 'club_partner' | 'club_common'
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'
export type NotificationChannel = 'push' | 'email' | 'sms'
```

**Règle :** tout nouveau champ à valeurs contraintes → créer l'enum PostgreSQL + le type TypeScript dans la même migration/PR.

---

### Zone 10 — Idempotency obligatoire pour la sync offline ✅ Ajout verrouillage

**Principe :** chaque opération offline est identifiée par un `operation_id` UUID v4 généré côté client. Le backend ignore toute opération déjà appliquée (anti-doublons lors des retries réseau).

```typescript
// Chaque QueueOperation porte un operationId unique
type QueueOperation = {
  operationId: string  // UUID v4 — généré une seule fois à la création, jamais recréé
  type: OperationType
  payload: unknown
  createdAt: string    // ISO 8601
  retryCount: number
  status: SyncStatus
}
```

**Côté backend (Edge Function / PostgreSQL) :**

```sql
-- Table de déduplication
CREATE TABLE processed_operations (
  operation_id UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES tenants(id)
);

-- Avant chaque INSERT/UPDATE issu d'une sync offline :
-- 1. Vérifier si operation_id existe dans processed_operations
-- 2. Si oui → répondre 200 OK (idempotent, pas d'erreur)
-- 3. Si non → appliquer l'opération + insérer dans processed_operations (atomique)
```

**Règle :** tout agent implémentant une opération offline DOIT vérifier l'idempotency. Un retry réseau ne doit jamais créer de doublon de présence, d'évaluation ou de tout autre enregistrement.

---

### Zone 11 — Soft-delete + audit trail ✅ Ajout verrouillage

**Convention :** toutes les entités métier portent `deleted_at` nullable. La suppression logique est la règle — la suppression physique est réservée aux jobs RGPD automatisés.

```sql
-- Colonnes systématiques sur toutes les tables métier
created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at   TIMESTAMPTZ NULL,           -- NULL = actif, non-NULL = supprimé logiquement
deleted_by   UUID NULL REFERENCES auth.users(id)  -- qui a déclenché la suppression
```

**Règles :**
- Toutes les requêtes de lecture incluent `WHERE deleted_at IS NULL` — via RLS policy ou filtre explicite
- La suppression d'une entité = `UPDATE SET deleted_at = now(), deleted_by = auth.uid()`
- **Jamais de `DELETE` SQL** sur les tables métier dans le code applicatif
- **Exception autorisée** : jobs RGPD automatisés (`purge_expired_media`, `anonymize_expired_data`) — exécutés uniquement via Edge Function schedulée avec rôle `service_role`, jamais via le client public

**Audit trail (FR46) :**

```sql
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  actor_id     UUID NOT NULL,   -- auth.uid() de l'utilisateur ayant déclenché l'action
  action       TEXT NOT NULL,   -- 'CREATE', 'UPDATE', 'SOFT_DELETE', 'CONSENT_REVOKED', ...
  entity_type  TEXT NOT NULL,   -- 'attendance', 'evaluation', 'child', ...
  entity_id    UUID NOT NULL,
  payload      JSONB,           -- snapshot avant/après si pertinent
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Pas de deleted_at sur audit_logs — immuable par design
);
```

**Règle :** audit_logs est **append-only** — aucun UPDATE ni DELETE autorisé, même pour l'admin. Conserver ≥5 ans (FR100).

---

### Zone 12 — Isolation tenant : RLS + JWT comme source d'autorité ✅ Ajout verrouillage

**Principe fondamental :** l'isolation tenant est garantie par **RLS PostgreSQL + JWT claims**. Les headers HTTP custom (`X-Tenant-Id`, etc.) sont **informatifs uniquement** — ils ne constituent pas une source d'autorisation.

**Architecture d'autorité :**

```
JWT claim: { tenant_id, role, coach_grade }
     ↓
Supabase Auth → vérifié à chaque requête
     ↓
RLS Policy → filtre automatique par tenant_id issu du JWT
     ↓
Données retournées
```

**Règle :** aucun agent ne doit implémenter de logique de filtrage tenant côté client basée sur un header. Si le JWT ne contient pas le `tenant_id` d'une ressource, la RLS policy retourne zéro ligne — c'est le comportement attendu, pas une erreur à contourner.

**Policy RLS type (sur toutes les tables) :**

```sql
-- Activation RLS obligatoire
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy lecture : tenant_id issu du JWT uniquement
CREATE POLICY "tenant_isolation" ON sessions
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
```

**Accès cross-tenant (admin uniquement) :**
- Uniquement via `service_role` key dans les Edge Functions schedulées
- Ou via permission explicite admin encodée dans le JWT (`allowed_tenants: [id1, id2]`)
- Toujours journalisé dans `audit_logs`

---

### Règles d'Enforcement — Tous les agents DOIVENT :

1. **Nommer les tables PostgreSQL en `snake_case` pluriel** — jamais PascalCase ou singulier
2. **Transformer `snake_case` → `camelCase` uniquement dans `packages/api-client`** — jamais dans les composants
3. **Vérifier les permissions via RLS + JWT** — jamais de vérification uniquement côté client, jamais via header HTTP
4. **Utiliser ISO 8601 pour toutes les dates** — jamais de timestamp Unix
5. **Filtrer par `tenant_id` via RLS** — jamais de requête sans isolation tenant
6. **Jamais de valeur hardcodée** — design depuis `packages/theme/tokens.ts`, constantes dans `packages/types`
7. **Placer la logique métier dans `packages/business-logic`** — jamais directement dans les composants
8. **Importer depuis `packages/ui` si le composant existe** — ne jamais recréer un composant partagé
9. **Utiliser les enums définis** — jamais de string libre pour les champs à valeurs contraintes (Zone 9)
10. **Générer `operationId` UUID v4 à la création d'une QueueOperation** — vérifier l'idempotency côté backend avant d'appliquer (Zone 10)
11. **Soft-delete uniquement** — `deleted_at = now()` ; jamais de `DELETE` SQL sur les tables métier (Zone 11)
12. **L'autorité tenant = JWT + RLS** — les headers custom sont informatifs, pas des sources d'autorisation (Zone 12)

### Anti-patterns à éviter

```typescript
// ❌ Hardcoder une couleur
style={{ color: '#C1AC5C' }}
// ✅
color={colors.accent.gold}

// ❌ Vérifier le rôle côté client pour afficher/cacher des données sensibles
if (user.role === 'admin') fetchAllTenants()
// ✅ Les RLS policies ne retournent que ce que le JWT autorise — la query est identique

// ❌ Créer un doublon en rejouant une sync
await supabase.from('attendances').insert(operation.payload)
// ✅ Vérifier operationId avant d'appliquer
await applyIfNotProcessed(operation.operationId, () => supabase.from('attendances').insert(...))

// ❌ Supprimer physiquement une entité
await supabase.from('children').delete().eq('id', childId)
// ✅
await supabase.from('children').update({ deleted_at: new Date().toISOString(), deleted_by: userId }).eq('id', childId)

// ❌ String libre pour un statut
status: 'Présent'
// ✅
status: 'present' satisfies AttendanceStatus
```

---

## Structure du Projet & Frontières Architecturales

### Arborescence Complète

```
aureak/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint, type-check, tests (PR)
│       └── eas-build.yml             # build mobile via EAS (merge main)
│
├── .env.example
├── .gitignore
├── package.json                      # workspaces: ["apps/*", "packages/*"]
├── yarn.lock
├── turbo.json                        # Turborepo pipeline (build, lint, test)
├── .eslintrc.js                      # ESLint global — inclut import restrictions
│
├── apps/
│   ├── mobile/                       # Expo iOS + Android — terrain, offline-first
│   │   ├── app.json
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── app/
│   │   │   ├── _layout.tsx           # TamaguiProvider, AuthGuard, OfflineProvider
│   │   │   ├── (auth)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   └── quick-auth.tsx    # PIN 4 chiffres + vérif geo (FR auth rapide)
│   │   │   ├── (coach)/
│   │   │   │   ├── _layout.tsx       # guard rôle coach + sync status header
│   │   │   │   ├── index.tsx         # séance du jour (FR10)
│   │   │   │   ├── session/
│   │   │   │   │   ├── [id].tsx      # détail séance + fiche thèmes (FR11)
│   │   │   │   │   ├── attendance.tsx # phase présences offline-first (FR15)
│   │   │   │   │   └── evaluation.tsx # phase évaluation post-séance (FR20)
│   │   │   │   └── history.tsx
│   │   │   ├── (parent)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx         # tableau de bord parent (FR34)
│   │   │   │   └── child/
│   │   │   │       └── [id].tsx      # profil enfant (FR34-35)
│   │   │   └── (child)/
│   │   │       ├── _layout.tsx
│   │   │       └── quiz/
│   │   │           └── [sessionId].tsx # quiz QCM post-séance (FR22)
│   │   └── assets/
│   │       ├── fonts/
│   │       │   ├── Rajdhani/
│   │       │   └── Geist/
│   │       └── images/
│   │
│   └── web/                          # Expo Router web — admin, parent, coach bureau
│       ├── app.json
│       ├── metro.config.js
│       ├── tsconfig.json
│       ├── package.json
│       └── app/
│           ├── _layout.tsx
│           ├── (auth)/
│           │   └── login.tsx
│           ├── (admin)/
│           │   ├── _layout.tsx
│           │   ├── index.tsx         # vue agrégée multi-implantations (FR41)
│           │   ├── sessions/
│           │   │   ├── index.tsx
│           │   │   ├── new.tsx
│           │   │   └── [id].tsx
│           │   ├── children/
│           │   │   ├── index.tsx
│           │   │   └── [id].tsx
│           │   ├── coaches/
│           │   │   ├── index.tsx     # alertes inactivité (FR42)
│           │   │   └── [id].tsx      # grades (FR82-86)
│           │   ├── content/
│           │   │   ├── themes/
│           │   │   │   ├── index.tsx
│           │   │   │   └── [id].tsx
│           │   │   └── quizzes/
│           │   │       └── [themeId].tsx
│           │   ├── clubs/            # partenariats (FR87-91)
│           │   │   └── index.tsx
│           │   └── reports/          # exports PDF (Phase 2)
│           ├── (coach)/
│           │   ├── _layout.tsx
│           │   ├── sessions/
│           │   │   └── index.tsx
│           │   └── videos/           # Phase 2
│           └── (parent)/
│               ├── _layout.tsx
│               └── child/
│                   └── [id].tsx
│
├── packages/
│   │
│   ├── types/                        # @aureak/types
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── enums.ts              # AttendanceStatus, EvaluationSignal, CoachRole...
│   │       ├── entities.ts           # Session, Child, Attendance, Evaluation, Theme...
│   │       ├── auth.ts               # User, JWTClaims, CoachGrade, TenantContext
│   │       ├── api.ts                # ApiResponse<T>, ApiError, QueueOperation
│   │       └── notifications.ts      # NotificationChannel, NotificationPayload
│   │
│   ├── theme/                        # @aureak/theme — design tokens
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── tokens.ts             # colors, fonts, space, radius — source unique
│   │       └── tamagui.config.ts
│   │
│   ├── ui/                           # @aureak/ui — composants Tamagui partagés
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── components/
│   │           ├── ChildCard/
│   │           │   ├── ChildCard.tsx
│   │           │   └── index.ts
│   │           ├── IndicatorToggle/  # cycle ○ → 🟢 → 🟡 → ○ (DD-01)
│   │           ├── StarToggle/       # Top séance ⭐ binaire
│   │           ├── SessionHeader/
│   │           ├── SyncStatusIndicator/
│   │           ├── AureakNotification/
│   │           ├── AttendanceGrid/
│   │           └── QuizCard/
│   │
│   ├── api-client/                   # @aureak/api-client — seule porte vers Supabase
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── supabase.ts           # createClient Supabase
│   │       ├── transforms.ts         # snake_case → camelCase (frontière unique)
│   │       ├── sessions.ts
│   │       ├── attendances.ts
│   │       ├── evaluations.ts
│   │       ├── children.ts
│   │       ├── quizzes.ts
│   │       ├── content.ts
│   │       ├── auth.ts
│   │       └── queries/              # TanStack Query hooks
│   │           ├── useSession.ts
│   │           ├── useChildren.ts
│   │           ├── useAttendances.ts
│   │           ├── useEvaluations.ts
│   │           └── useQuiz.ts
│   │
│   ├── media-client/                 # @aureak/media-client — Phase 2, frontière définie dès MVP
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── upload.ts             # upload + compression mobile avant envoi
│   │       ├── stream.ts             # signed URLs streaming only (jamais download)
│   │       ├── limits.ts             # MAX_VIDEO_DURATION, MAX_VIDEO_SIZE constants
│   │       └── storage.ts            # Supabase Storage client (service_role isolé)
│   │
│   └── business-logic/              # @aureak/business-logic
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── stores/
│           │   ├── useAuthStore.ts
│           │   ├── useSessionStore.ts
│           │   ├── useOfflineStore.ts
│           │   └── useNotificationStore.ts
│           ├── offline/
│           │   ├── db.ts             # expo-sqlite setup + schema local
│           │   ├── queue.ts          # QueueOperation CRUD (SQLite local)
│           │   ├── sync.ts           # retry loop, conflict resolution, alerte J+1
│           │   └── idempotency.ts    # operationId check avant apply
│           ├── auth/
│           │   ├── roles.ts          # helpers RBAC (UI guards only)
│           │   └── geoAuth.ts        # expo-location, vérif périmètre
│           ├── validation/
│           │   ├── session.schema.ts
│           │   ├── attendance.schema.ts
│           │   ├── evaluation.schema.ts
│           │   ├── child.schema.ts
│           │   └── quiz.schema.ts
│           └── notifications/
│               └── triggers.ts
│
└── supabase/
    ├── config.toml
    ├── seed.ts
    ├── migrations/
    │   ├── 00001_initial_schema.sql  # tenants, extensions (uuid-ossp, pgcrypto)
    │   ├── 00002_create_enums.sql    # tous les enums PostgreSQL
    │   ├── 00003_create_profiles.sql # profiles + grades coach
    │   ├── 00004_create_sessions.sql # sessions, session_themes, locations
    │   ├── 00005_create_attendance.sql
    │   ├── 00006_create_evaluations.sql
    │   ├── 00007_create_content.sql  # themes, criteria, quiz_questions, quiz_answers
    │   ├── 00008_create_quizzes.sql  # quiz_results, session_quiz_config
    │   ├── 00009_create_audit.sql    # audit_logs + processed_operations (idempotency)
    │   └── 00010_rls_policies.sql    # TOUTES les policies RLS sur toutes les tables
    └── functions/
        ├── _shared/
        │   ├── cors.ts
        │   ├── auth.ts               # vérif JWT, extract tenant_id + role
        │   └── clients.ts            # Resend + Twilio init
        ├── send-session-notification/
        │   └── index.ts              # push + email parent post-séance (FR29)
        ├── send-cancellation-alert/
        │   └── index.ts              # push + email + SMS annulation (FR30)
        ├── resolve-sync-conflict/
        │   └── index.ts              # conflict resolution (FR95-96)
        ├── apply-offline-operation/
        │   └── index.ts              # idempotency check + apply (Zone 10)
        └── notify-sync-reminder/
            └── index.ts              # rappel J+1 si données non sync (FR18)
```

---

### Frontières Architecturales

**Frontière données :**
- `packages/api-client` est la **seule** porte d'entrée vers Supabase depuis les apps
- `packages/business-logic/offline` est la seule couche qui écrit dans expo-sqlite
- `packages/media-client` est la seule couche qui accède à Supabase Storage
- Toute donnée traversant la frontière `Supabase → app` passe par `transforms.ts`

**Frontière sécurité :**
- RLS PostgreSQL garantit l'isolation tenant — jamais bypassée côté client
- `supabase/functions/_shared/auth.ts` vérifie le JWT dans toutes les Edge Functions
- `packages/business-logic/auth/roles.ts` pour les guards UI côté client (affichage uniquement — jamais source d'autorité)

**Frontière offline :**
- `useOfflineStore` = source unique de vérité sur l'état réseau
- `packages/business-logic/offline/` = seul endroit où la sync est orchestrée
- Les composants ne lisent jamais directement expo-sqlite

**Frontière media (Phase 2, définie dès maintenant) :**
- `packages/media-client` = seule couche qui touche Supabase Storage
- Streaming uniquement côté parent/enfant — aucun endpoint download direct exposé
- Signed URLs générées par Edge Function avec durée d'expiration courte

---

### Frontière 1 — Interdiction d'accès direct à Supabase ✅ Verrouillage ESLint

Tout import `@supabase/supabase-js` ou `createClient` en dehors de `packages/api-client` ou `packages/media-client` est interdit via règle ESLint.

**Configuration `.eslintrc.js` (racine monorepo) :**

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@supabase/supabase-js', '@supabase/*'],
          // Autorisé uniquement dans packages/api-client et packages/media-client
          importNames: ['createClient'],
          message:
            'Import Supabase uniquement via @aureak/api-client ou @aureak/media-client. ' +
            'Accès direct à Supabase interdit hors de ces packages.'
        }
      ]
    }],
    // Interdire les imports hardcodés de design values
    'no-restricted-syntax': ['error', {
      // Détecter les hex colors hardcodées dans JSX/TSX
      selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
      message:
        'Valeur de couleur hardcodée interdite. Utiliser packages/theme/tokens.ts.'
    }]
  }
}
```

**Règle :** le CI échoue si une PR introduit un import Supabase direct hors des packages autorisés.

---

### Frontière 2 — Source of Truth & Conflict Policy ✅ Verrouillage

**Principe :**
- **Supabase (PostgreSQL) = vérité finale** — la valeur en base fait foi après sync
- **expo-sqlite = cache local + queue d'opérations en attente** — jamais considéré comme authoritative

**Politique de résolution des conflits par entité :**

| Entité | Politique | Justification |
|---|---|---|
| `attendance` (présences) | **Server-wins** | Le coach A peut corriger le check-in du coach B — la dernière valeur serveur est la bonne |
| `evaluation` (indicateurs) | **Server-wins par coach** | Chaque coach a sa propre évaluation — pas de conflit réel entre coaches différents ; si même coach, server-wins |
| `evaluation.comment` (commentaire libre) | **Last-Write-Wins (LWW)** par `updated_at` | Commentaire libre = intention du coach au moment de l'écriture ; le plus récent gagne |
| `session` (métadonnées séance) | **Server-wins** | L'admin crée/modifie les séances — jamais modifiables offline par le coach |
| `quiz_result` (résultats quiz enfant) | **Client-wins** | L'enfant soumet une seule fois par séance — jamais de conflit possible par design |

**Implémentation dans `packages/business-logic/offline/sync.ts` :**

```typescript
// Lors de l'application d'une opération offline, vérifier si la valeur serveur
// a changé depuis la création de l'opération locale
async function resolveConflict(
  entity: 'attendance' | 'evaluation' | 'evaluation_comment' | 'session' | 'quiz_result',
  localOp: QueueOperation,
  serverValue: unknown
): Promise<'apply_local' | 'discard_local' | 'notify_coach'> {
  const policy = CONFLICT_POLICIES[entity] // 'server_wins' | 'lww' | 'client_wins'

  if (policy === 'server_wins') return 'discard_local'
  if (policy === 'client_wins') return 'apply_local'
  if (policy === 'lww') {
    const localTs = (localOp.payload as { updatedAt: string }).updatedAt
    const serverTs = (serverValue as { updated_at: string }).updated_at
    return localTs > serverTs ? 'apply_local' : 'discard_local'
  }
}
```

**Le Coach est notifié (non bloquant)** si une de ses données a été écrasée par server-wins — via `useOfflineStore.addConflictNotice()`.

---

### Frontière 3 — Media/Video Package ✅ Verrouillage Phase 2

`packages/media-client` est défini dès le MVP pour verrouiller les règles — même si les features vidéo sont Phase 2. Aucun code vidéo ne peut exister hors de ce package.

**Contrat de frontière :**

```typescript
// packages/media-client/src/limits.ts
export const MEDIA_LIMITS = {
  MAX_VIDEO_DURATION_SECONDS: 10,      // configurable par thème (FR101), défaut 10s
  MAX_VIDEO_SIZE_BYTES: 40 * 1024 * 1024, // 40 MB (NFR-V2)
  SIGNED_URL_EXPIRY_SECONDS: 3600,     // 1h — streaming uniquement
  ALLOWED_VIDEO_FORMATS: ['mp4', 'mov'] as const,
} as const

// packages/media-client/src/stream.ts
// ✅ Seul moyen d'accéder à une vidéo côté parent/enfant
export async function getVideoStreamUrl(videoId: string): Promise<string> {
  // Appelle une Edge Function qui vérifie le JWT + consentement parental actif
  // Retourne une signed URL Supabase Storage (durée limitée)
  // Jamais d'URL publique permanente exposée
}

// packages/media-client/src/upload.ts
// ✅ Seul moyen d'uploader une vidéo (coach → plateforme, statut 'pending_validation')
export async function uploadCoachVideo(
  localUri: string,
  metadata: VideoUploadMetadata
): Promise<{ videoId: string; status: 'pending_validation' }>
```

**Règles media (toutes les phases) :**
- Jamais d'URL Supabase Storage directe dans les composants — toujours via `getVideoStreamUrl()`
- Toute vidéo uploadée par un coach arrive avec `status = 'pending_validation'` — invisible parent/enfant jusqu'à validation admin (FR28)
- Compression côté mobile avant upload (`MAX_VIDEO_SIZE_BYTES`) — dans `upload.ts` uniquement
- Les durées limites par thème sont configurées par l'admin et stockées en DB — jamais hardcodées dans les composants

---

### Frontière 4 — Design System Strict ✅ Verrouillage

**Règle absolue :** zéro valeur de design hardcodée dans les apps ou les composants features.

**Hiérarchie des sources autorisées :**

```
packages/theme/tokens.ts         ← source unique (couleurs, fonts, spacing, radius)
         ↓
packages/ui/components/          ← composants Tamagui consommant les tokens
         ↓
apps/mobile/app/ + apps/web/app/ ← utilisant uniquement les composants @aureak/ui
```

**Ce qui est interdit :**

```typescript
// ❌ Couleur hardcodée
<View style={{ backgroundColor: '#1A1A1A' }} />

// ❌ Spacing hardcodé
<View style={{ padding: 16 }} />

// ❌ Font hardcodée
<Text style={{ fontFamily: 'Rajdhani', fontSize: 28 }} />

// ❌ Recréer un composant existant dans @aureak/ui
// Dans apps/mobile/app/(coach)/session/attendance.tsx :
function MyChildCard() { ... } // si ChildCard existe dans @aureak/ui
```

**Ce qui est obligatoire :**

```typescript
// ✅ Token via @aureak/theme
import { colors, space, radius } from '@aureak/theme'
<View style={{ backgroundColor: colors.background.primary, padding: space.md }} />

// ✅ Composant partagé via @aureak/ui
import { ChildCard, IndicatorToggle } from '@aureak/ui'
<ChildCard child={child} onIndicatorChange={handleChange} />

// ✅ Tamagui styled component avec tokens
import { styled } from 'tamagui'
const Card = styled(View, {
  backgroundColor: '$backgroundSurface',  // token Tamagui mappé sur colors.background.surface
  borderRadius: '$card',
})
```

**Enforcement :**
- Règle ESLint `no-restricted-syntax` pour détecter les hex colors hardcodées (voir Frontière 1)
- Code review obligatoire sur tout composant feature qui n'importe pas depuis `@aureak/ui` ou `@aureak/theme`
- Turbo pipeline lint bloque le merge si la règle est violée

---

### Mapping FR → Répertoires

| FR Catégorie | Répertoires principaux |
|---|---|
| Auth & RBAC (FR1-9, FR60-62) | `packages/business-logic/auth/`, `supabase/migrations/00010_rls_policies.sql`, `apps/*/app/(auth)/` |
| Terrain & Présences (FR10-19, FR57-59, FR95-96) | `apps/mobile/app/(coach)/session/attendance.tsx`, `packages/business-logic/offline/`, `packages/api-client/src/attendances.ts` |
| Évaluation (FR20-21) | `apps/mobile/app/(coach)/session/evaluation.tsx`, `packages/api-client/src/evaluations.ts` |
| Quiz enfant (FR22-24) | `apps/mobile/app/(child)/quiz/`, `packages/api-client/src/quizzes.ts` |
| Notifications (FR29-33) | `supabase/functions/send-session-notification/`, `supabase/functions/send-cancellation-alert/`, `packages/business-logic/notifications/` |
| Board parent (FR34-40) | `apps/mobile/app/(parent)/`, `apps/web/app/(parent)/` |
| Admin & benchmark (FR41-45, FR63-65) | `apps/web/app/(admin)/` |
| RGPD & Audit (FR46-49, FR97-100) | `supabase/migrations/00009_create_audit.sql`, `supabase/functions/` (jobs purge Phase 2) |
| Référentiel pédagogique (FR66-81) | `apps/web/app/(admin)/content/`, `supabase/migrations/00007_create_content.sql` |
| Grades coach (FR82-86) | `packages/business-logic/auth/roles.ts`, `supabase/migrations/00003_create_profiles.sql` |
| Clubs & partenariats (FR87-91) | `apps/web/app/(admin)/clubs/`, `supabase/migrations/00010_rls_policies.sql` |
| Video/Media (FR25-28, NFR-V1 à V5) | `packages/media-client/` (Phase 2) |
| Idempotency sync | `supabase/functions/apply-offline-operation/`, `supabase/migrations/00009_create_audit.sql` |

---

## Validation Architecturale

### Validation de Cohérence ✅

**Compatibilité des décisions :**

Toutes les technologies choisies sont compatibles et maintenues activement :

| Pair | Compatibilité | Note |
|---|---|---|
| Expo Router + Tamagui | ✅ | Babel plugin requis — inclus dans le starter |
| expo-sqlite + Supabase | ✅ | Couches indépendantes, frontière claire |
| Zustand + TanStack Query | ✅ | Complémentaires, rôles distincts |
| React Hook Form + Zod | ✅ | Pairing standard 2025 |
| Supabase Auth + RLS + Custom Claims | ✅ | Architecture native Supabase |
| Supabase Realtime + TanStack Query | ✅ | Realtime pour double-validation, Query pour les autres données |
| Resend + Twilio + Edge Functions (Deno) | ✅ | Clients compatibles Deno disponibles |
| expo-location + auth rapide | ✅ | API Expo standard |
| EAS Build + GitHub Actions | ✅ | Intégration officielle |

**Cohérence des patterns :**
- snake_case DB → camelCase TS : frontière unique dans `transforms.ts` ✅
- Enums PostgreSQL + types TS union : synchronisés par convention one-PR ✅
- Soft-delete aligné avec RGPD et audit trail ✅
- Idempotency via `operation_id` cohérent avec offline-first ✅
- RLS comme seule autorité : appliqué uniformément dans tous les patterns ✅

**Alignement structure :**
- Boundaries packages ↔ décisions architecturales : correspondance exacte ✅
- ESLint rules verrouillent les frontières au niveau tooling ✅
- Structure monorepo Turborepo compatible pipeline EAS ✅

---

### Couverture des Exigences ✅

**Exigences Fonctionnelles :**

| FR Catégorie | Support architectural | Statut |
|---|---|---|
| Auth & RBAC (FR1-9, FR60-62) | Supabase Auth + RLS + Custom Claims JWT | ✅ |
| Terrain & Présences offline (FR10-19, FR57-59, FR95-96) | expo-sqlite + sync queue + idempotency | ✅ |
| Évaluation post-séance (FR20-21) | Offline-capable, sync identique aux présences | ✅ |
| Quiz enfant (FR22-24) | TanStack Query online (parent/enfant) | ✅ |
| Notifications multi-canal (FR29-33) | Edge Functions + Resend + Twilio | ✅ |
| Board parent (FR34-40) | apps/web + apps/mobile (parent) | ✅ |
| Admin & benchmark (FR41-45, FR63-65) | apps/web (admin) | ✅ |
| RGPD & Audit (FR46-49, FR97-100) | Soft-delete + audit_logs + consent + purge jobs | ✅ |
| Référentiel pédagogique (FR66-81) | Content management admin + versioning thèmes | ✅ |
| Grades coach (FR82-86) | Custom Claims JWT + RLS dynamiques | ✅ |
| Clubs & partenariats (FR87-91) | RLS read-only policies par niveau | ✅ |
| Video/Media (FR25-28, NFR-V1→V5) | packages/media-client (Phase 2, frontière définie) | ✅ |

**Exigences Non-Fonctionnelles :**

| NFR | Support architectural | Statut |
|---|---|---|
| Performance terrain (<2s online, immédiat offline) | expo-sqlite local — zéro latence réseau offline | ✅ |
| API <300ms P95 | Supabase Pro + index sur tenant_id | ✅ |
| Disponibilité ≥95% | Supabase SLA Pro | ✅ |
| Sync offline ≥90% fiable | Retry loop + alerte visible + rappel J+1 | ✅ |
| Sécurité TLS + AES-256 | Supabase natif | ✅ |
| Isolation tenant zero-leak | RLS + JWT — double couche | ✅ |
| RGPD mineurs | Soft-delete + consent + audit + anonymisation | ✅ |
| Scalabilité 1 000 → 5 000 | Supabase stateless + CDN médias | ✅ |
| WCAG AA | Design tokens validés (ratios UX Spec) | ✅ |

---

### Décisions Additionnelles Issues de la Validation

**Décision — Double-validation coach : Supabase Realtime**

La synchronisation entre deux coachs pendant la phase de validation de séance utilise **Supabase Realtime** (WebSocket).

```typescript
// Dans apps/mobile/app/(coach)/session/[id].tsx — phase validation
import { useEffect } from 'react'
import { supabase } from '@aureak/api-client'
import { useSessionStore } from '@aureak/business-logic'

// Écoute les changements de statut de validation en temps réel
const channel = supabase
  .channel(`session-validation:${sessionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'sessions',
    filter: `id=eq.${sessionId}`,
  }, (payload) => {
    useSessionStore.getState().setValidationStatus(payload.new.validation_status)
  })
  .subscribe()
```

- **Scope** : uniquement pendant la phase de validation active (subscribe/unsubscribe)
- **Fallback offline** : si un coach est offline, la validation solo est possible — admin notifié (UX Spec)
- **Pas de Realtime sur les autres entités** — présences et évaluations restent offline-first + sync queue

**Décision — Push notification device tokens**

Ajout de la migration `00004b_create_push_tokens.sql` :

```sql
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit et ne gère que ses propres tokens
CREATE POLICY "own_tokens_only" ON push_tokens
  FOR ALL USING (user_id = auth.uid());
```

- Enregistrement du token à la connexion via `packages/api-client/src/auth.ts`
- Révocation = `DELETE` physique (pas de soft-delete — pas de données métier)
- Les Edge Functions accèdent aux tokens via `service_role` pour l'envoi des notifications

**Règle — Auth rapide géolocalisée : mobile uniquement**

L'auth rapide (PIN + GPS) est strictement réservée à `apps/mobile`. Elle n'existe pas dans `apps/web`.

```typescript
// Dans apps/web — auth uniquement via Supabase Auth standard
// Aucun import de geoAuth.ts dans apps/web autorisé

// Règle ESLint additionnelle dans apps/web/.eslintrc.js
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['@aureak/business-logic/auth/geoAuth'],
    message: 'La géolocalisation auth rapide est réservée à apps/mobile.'
  }]
}]
```

**Stratégie de tests**

| Couche | Outil | Localisation |
|---|---|---|
| Logique pure (stores, sync, validation) | Vitest | `packages/*/src/*.test.ts` — co-localisés |
| Composants UI | React Native Testing Library | `packages/ui/src/components/**/*.test.tsx` |
| E2E mobile | Maestro | `apps/mobile/e2e/` |
| E2E web | Playwright | `apps/web/e2e/` |

CI GitHub Actions exécute Vitest + RNТL à chaque PR. Maestro + Playwright sur la branche `main` uniquement.

---

### Checklist de Complétude Architecturale

**✅ Analyse du contexte**
- [x] Contexte projet analysé (109 FRs, 12 catégories)
- [x] Complexité évaluée (HIGH — Vertical SaaS + RGPD mineurs + offline)
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales mappées (6 zones)

**✅ Décisions architecturales**
- [x] Stack technique complète (Expo Router + Tamagui + Supabase + expo-sqlite)
- [x] Stratégie offline-first (queue + idempotency + conflict policy par entité)
- [x] Sécurité & RBAC (RLS + JWT + soft-delete + audit)
- [x] Infrastructure (EAS + GitHub Actions + Supabase Free → Pro)
- [x] Notifications (Edge Functions + Resend + Twilio)
- [x] Double-validation (Supabase Realtime — scope limité)

**✅ Patterns d'implémentation**
- [x] 12 zones de conflit identifiées et résolues
- [x] Enums PostgreSQL + TypeScript définis
- [x] Idempotency offline obligatoire
- [x] Soft-delete + audit trail systématiques
- [x] Isolation tenant via RLS + JWT (autorité unique)
- [x] Design system strict (tokens + composants partagés)

**✅ Structure du projet**
- [x] Arborescence complète monorepo définie
- [x] 6 packages avec responsabilités claires
- [x] Frontières ESLint verrouillées
- [x] Source of truth + conflict policy par entité
- [x] Media/video package défini (Phase 2 prête)
- [x] Mapping FR → répertoires complet

**✅ Gaps résolus**
- [x] Double-validation coach → Supabase Realtime (scope validation uniquement)
- [x] Push tokens → table `push_tokens` + migration ajoutée
- [x] Auth rapide → mobile uniquement, ESLint guard sur web
- [x] Stratégie de tests → Vitest + RNTL + Maestro + Playwright

---

### Évaluation de Préparation

**Statut global : PRÊT POUR L'IMPLÉMENTATION**

**Niveau de confiance : Élevé**

**Points forts de l'architecture :**
- Frontières très claires entre packages — un agent ne peut pas "déborder" sans violation ESLint détectable
- Offline-first avec conflict policy explicite par entité — pas d'ambiguïté pour les agents
- RGPD intégré structurellement (soft-delete, audit, consentements) — pas une couche ajoutée après
- Stack 2025 éprouvée, documentation abondante pour les agents IA
- Design system verrouillé — cohérence visuelle garantie quelle que soit la story implémentée

**Axes d'évolution future (non bloquants) :**
- PowerSync (si sync custom atteint ses limites à Phase 2+)
- Dashboard benchmark inter-réseau (Phase 3 — flywheel collectif)
- IA analyse gestuelle (Phase 3+)
- Architecture SaaS exportable vers d'autres académies
