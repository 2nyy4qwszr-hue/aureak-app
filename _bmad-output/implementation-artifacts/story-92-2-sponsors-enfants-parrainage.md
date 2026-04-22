# Story 92.2 — Sponsors liés à enfants (parrainage académie)

Status: ready-for-dev

<!-- Validation optionnelle. Lancer validate-create-story pour vérification qualité avant dev-story. -->

## Metadata

- **Epic** : 92 — Partenariat
- **Story ID** : 92.2
- **Story key** : `92-2-sponsors-enfants-parrainage`
- **Priorité** : P2
- **Dépendances** : Story 92.1 done (hub `/partenariat` + placeholder `/partenariat/sponsors` existent)
- **Source** : brainstorming 2026-04-18 idée #32 (Sponsor = lié à un enfant — parrainage)
- **Agent modèle** : claude-sonnet-4-6
- **Effort estimé** : M (1 migration, 2 tables, 1 enum, types + API CRUD + UI liste/création/détail/lien enfant)

## Story

En tant qu'admin,
je veux créer des sponsors et lier un ou plusieurs enfants de l'académie à un sponsor (parrainage),
afin de suivre quel joueur est financé par quel sponsor et produire des reportings internes de parrainage.

## Acceptance Criteria

1. La page `/partenariat/sponsors` affiche une liste des sponsors (nom, type, nb d'enfants parrainés, statut actif/inactif, montant annuel optionnel) + bouton "Nouveau sponsor"
2. Un admin peut créer un sponsor via une modale avec : `name` (obligatoire), `sponsor_type` enum (`entreprise` / `individuel` / `association` / `club`), `annual_amount_cents` (optionnel), `active_from` (default = aujourd'hui), `active_until` (optionnel, ISO date), `contact_email`, `contact_phone`, `notes`
3. Un admin peut ouvrir la fiche d'un sponsor `/partenariat/sponsors/[sponsorId]` qui affiche : infos sponsor + liste des enfants parrainés + bouton "Ajouter un enfant"
4. Un admin peut lier un enfant existant au sponsor via une modale avec autocomplete (recherche par nom/prénom dans `profiles` `user_role='child'`), date de début (default = aujourd'hui), date de fin (optionnel), montant alloué à cet enfant optionnel
5. Un admin peut révoquer un lien sponsor↔enfant (soft-delete : pose `ended_at` = aujourd'hui sans supprimer la ligne)
6. Un sponsor est considéré **actif** si `active_from <= now()` ET (`active_until IS NULL` OU `active_until >= now()`)
7. Un enfant peut être parrainé par **plusieurs sponsors en même temps** (la table de lien accepte plusieurs lignes actives par `child_id`)
8. Le compteur d'enfants parrainés affiché dans la liste sponsors ne compte que les liens **actifs** (`ended_at IS NULL` ET sponsor actif)
9. RLS : seuls les admins du tenant peuvent lire/écrire les sponsors et les liens (policies RLS admin-only, tenant-isolated via `tenant_id`)
10. Console guards (`if (process.env.NODE_ENV !== 'production') console.error`) + try/finally sur tous les state setters de chargement/sauvegarde

## Tasks / Subtasks

- [ ] T1 — Migration `00168_sponsors_and_links.sql` (AC: #2, #5, #6, #7, #9)
  - [ ] Créer l'enum `sponsor_type` (`entreprise`, `individuel`, `association`, `club`)
  - [ ] Créer la table `sponsors` (colonnes ci-dessous)
  - [ ] Créer la table `sponsor_child_links` (colonnes ci-dessous)
  - [ ] RLS admin-only tenant-isolated sur les 2 tables
  - [ ] Index `(tenant_id, active_from)` sur `sponsors` et `(child_id, ended_at)` + `(sponsor_id, ended_at)` sur `sponsor_child_links`

- [ ] T2 — Types TypeScript (AC: #1, #2, #3)
  - [ ] Ajouter `SponsorType`, `Sponsor`, `SponsorChildLink`, `SponsorWithCounts` dans `aureak/packages/types/src/entities.ts`
  - [ ] Exporter depuis `aureak/packages/types/src/index.ts`

- [ ] T3 — API `@aureak/api-client/src/admin/sponsors.ts` (AC: #1–#5)
  - [ ] `listSponsors()` → `{ data: SponsorWithCounts[] }` (join agrégé count liens actifs)
  - [ ] `getSponsor(sponsorId)` → `{ data: Sponsor | null }`
  - [ ] `createSponsor(params)` → `{ data: Sponsor | null, error }`
  - [ ] `updateSponsor(sponsorId, patch)` → `{ data: Sponsor | null, error }`
  - [ ] `listSponsorChildren(sponsorId)` → `{ data: Array<{ link: SponsorChildLink, child: { id, full_name, birth_date } }> }`
  - [ ] `linkChildToSponsor(params)` → `{ data: SponsorChildLink | null, error }`
  - [ ] `unlinkChildFromSponsor(linkId)` → pose `ended_at = today` (soft-delete)
  - [ ] `searchChildrenForSponsor(query)` → autocomplete par nom (min 2 chars, limit 20, filtre `user_role='child'` + `deleted_at IS NULL`)
  - [ ] Exporter depuis `aureak/packages/api-client/src/index.ts`
  - [ ] Console guards obligatoires + try/finally côté consumer

- [ ] T4 — Page liste `/partenariat/sponsors` (AC: #1, #8)
  - [ ] Remplacer le placeholder créé en Story 92.1 par la vraie page
  - [ ] StatCards en haut : "Sponsors actifs" | "Total parrainages actifs" | "Montant annuel total"
  - [ ] Tableau ou grille de cards : nom / type / nb enfants parrainés actifs / statut (badge Actif/Inactif) / montant annuel formaté / bouton "Voir"
  - [ ] Bouton "Nouveau sponsor" en haut à droite → ouvre `SponsorFormModal`
  - [ ] Empty state si aucun sponsor

- [ ] T5 — Modale création sponsor `SponsorFormModal` (AC: #2, #10)
  - [ ] Composant `aureak/apps/web/components/admin/partenariat/SponsorFormModal.tsx`
  - [ ] RHF + Zod validation (name requis ≥ 2 chars, `sponsor_type` enum, dates cohérentes `active_until > active_from`, montant optionnel ≥ 0, email optionnel format valide)
  - [ ] Appelle `createSponsor` puis refresh la liste
  - [ ] try/finally sur `setSubmitting(false)`

- [ ] T6 — Page détail `/partenariat/sponsors/[sponsorId]` (AC: #3, #5)
  - [ ] Créer `aureak/apps/web/app/(admin)/partenariat/sponsors/[sponsorId]/page.tsx` + `index.tsx`
  - [ ] Header : nom sponsor + badge statut + boutons "Modifier" / "Ajouter un enfant"
  - [ ] Section infos : type / montant annuel / période / contact email+phone / notes
  - [ ] Section "Enfants parrainés" : liste des liens actifs (nom enfant + date début + montant alloué + bouton "Révoquer")
  - [ ] Section "Historique" : liens archivés (`ended_at IS NOT NULL`) — masqué par défaut, toggle "Afficher l'historique"

- [ ] T7 — Modale "Ajouter un enfant" `LinkChildModal` (AC: #4, #7, #10)
  - [ ] Composant `aureak/apps/web/components/admin/partenariat/LinkChildModal.tsx`
  - [ ] Autocomplete (input + appel `searchChildrenForSponsor` debounced 300ms)
  - [ ] Sélection → affiche nom/prénom + date naissance
  - [ ] Champs : date début (default today), date fin (optionnel), montant alloué cents (optionnel)
  - [ ] Appelle `linkChildToSponsor` puis refresh la fiche sponsor
  - [ ] Pas de garde-fou "enfant déjà lié" : AC #7 autorise le multi-parrainage

- [ ] T8 — Action révoquer lien (AC: #5)
  - [ ] Dans la fiche sponsor, bouton "Révoquer" sur chaque lien actif → appelle `unlinkChildFromSponsor(linkId)` avec confirm dialog
  - [ ] Le lien passe en historique (affichage uniquement si "Afficher l'historique" activé)

- [ ] T9 — Validation (AC: tous)
  - [ ] `npx tsc --noEmit` OK
  - [ ] `supabase db reset` en local → migration 00168 passe sans erreur
  - [ ] Créer 1 sponsor "Entreprise ACME" type `entreprise`, lier 2 enfants → voir compteur = 2 dans la liste
  - [ ] Révoquer 1 enfant → compteur = 1, lien apparaît dans l'historique
  - [ ] Créer 2e sponsor "Association XYZ", parrainer 1 des 2 enfants précédents → AC #7 vérifié (multi-sponsor sur même enfant)
  - [ ] Console browser sans erreur sur `/partenariat/sponsors` + `/partenariat/sponsors/[id]`
  - [ ] `grep -rn "setLoading(false)\|setSaving(false)\|setSubmitting(false)\|setCreating(false)" aureak/apps/web/app/(admin)/partenariat/sponsors/ aureak/apps/web/components/admin/partenariat/` → toutes occurrences sous `finally {}`
  - [ ] `grep -rn "console\." aureak/packages/api-client/src/admin/sponsors.ts aureak/apps/web/components/admin/partenariat/ aureak/apps/web/app/(admin)/partenariat/sponsors/ | grep -v "NODE_ENV"` → aucune occurrence

## Dev Notes

### ⚠️ Contraintes Stack
- React Native Web : `View`, `Pressable`, `ScrollView`, `StyleSheet`, `TextInput`, `Modal`
- Tokens `@aureak/theme` uniquement — jamais de couleurs hardcodées
- Forms : React Hook Form + Zod
- Accès Supabase UNIQUEMENT via `@aureak/api-client/src/admin/sponsors.ts`
- Try/finally obligatoire sur tout state setter de chargement/sauvegarde
- Console guards obligatoires dans `apps/web/` et `packages/api-client/`
- Soft-delete uniquement (colonne `ended_at` pour les liens, `deleted_at` non requis ici)
- Migrations dans `supabase/migrations/` (racine dépôt) — pas `aureak/supabase/`

---

### T1 — Migration `00168_sponsors_and_links.sql`

> ⚠️ Vérifier `ls supabase/migrations/ | tail -3` avant de coder. Au moment de la rédaction de la story (2026-04-22) la dernière migration est `00160_idx_child_directory_candidat.sql`. Réservations actives intermédiaires : 00161-00165 (Epic 88), 00166-00167 (Epic 90). Si ces stories ont été mergées entretemps, **incrémenter** au prochain numéro disponible.

```sql
-- Story 92.2 — Sponsors liés à enfants (parrainage académie)
-- Epic 92 — Partenariat

-- 1. Enum sponsor_type ------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_type') THEN
    CREATE TYPE sponsor_type AS ENUM ('entreprise', 'individuel', 'association', 'club');
  END IF;
END $$;

-- 2. Table sponsors --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsors (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid           NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                 text           NOT NULL,
  sponsor_type         sponsor_type   NOT NULL DEFAULT 'entreprise',
  annual_amount_cents  integer        NULL CHECK (annual_amount_cents IS NULL OR annual_amount_cents >= 0),
  active_from          date           NOT NULL DEFAULT current_date,
  active_until         date           NULL,
  contact_email        text           NULL,
  contact_phone        text           NULL,
  notes                text           NULL,
  created_at           timestamptz    NOT NULL DEFAULT now(),
  updated_at           timestamptz    NOT NULL DEFAULT now(),
  created_by           uuid           NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT sponsors_dates_check CHECK (active_until IS NULL OR active_until >= active_from)
);

CREATE INDEX IF NOT EXISTS idx_sponsors_tenant_active_from
  ON public.sponsors (tenant_id, active_from DESC);

-- 3. Table sponsor_child_links --------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsor_child_links (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sponsor_id           uuid        NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  child_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at           date        NOT NULL DEFAULT current_date,
  ended_at             date        NULL,
  allocated_amount_cents integer   NULL CHECK (allocated_amount_cents IS NULL OR allocated_amount_cents >= 0),
  notes                text        NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid        NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT sponsor_child_dates_check CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_sponsor_active
  ON public.sponsor_child_links (sponsor_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_child_active
  ON public.sponsor_child_links (child_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_child_links_tenant
  ON public.sponsor_child_links (tenant_id);

-- 4. RLS -----------------------------------------------------------------
ALTER TABLE public.sponsors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_child_links  ENABLE ROW LEVEL SECURITY;

-- Admin-only tenant-isolated
DROP POLICY IF EXISTS sponsors_admin_select ON public.sponsors;
CREATE POLICY sponsors_admin_select ON public.sponsors
  FOR SELECT USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

DROP POLICY IF EXISTS sponsors_admin_insert ON public.sponsors;
CREATE POLICY sponsors_admin_insert ON public.sponsors
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

DROP POLICY IF EXISTS sponsors_admin_update ON public.sponsors;
CREATE POLICY sponsors_admin_update ON public.sponsors
  FOR UPDATE USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id())
  WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

DROP POLICY IF EXISTS sponsor_child_links_admin_select ON public.sponsor_child_links;
CREATE POLICY sponsor_child_links_admin_select ON public.sponsor_child_links
  FOR SELECT USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

DROP POLICY IF EXISTS sponsor_child_links_admin_insert ON public.sponsor_child_links;
CREATE POLICY sponsor_child_links_admin_insert ON public.sponsor_child_links
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

DROP POLICY IF EXISTS sponsor_child_links_admin_update ON public.sponsor_child_links;
CREATE POLICY sponsor_child_links_admin_update ON public.sponsor_child_links
  FOR UPDATE USING (current_user_role() = 'admin' AND tenant_id = current_tenant_id())
  WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id());

-- 5. Trigger updated_at ----------------------------------------------------
DROP TRIGGER IF EXISTS trg_sponsors_updated_at ON public.sponsors;
CREATE TRIGGER trg_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

Contraintes :
- `IF NOT EXISTS` sur enum/table/index
- `CHECK` pour dates cohérentes et montants positifs
- RLS obligatoire — admin tenant-isolated (pas de role `commercial`/`manager` dans cette story)
- `set_updated_at()` existe déjà côté DB (utilisé par d'autres migrations — vérifier si `CREATE OR REPLACE FUNCTION set_updated_at` existe, sinon déclarer la fonction dans cette migration)

---

### T2 — Types TypeScript

```ts
// aureak/packages/types/src/entities.ts (ajout)
export type SponsorType = 'entreprise' | 'individuel' | 'association' | 'club'

export interface Sponsor {
  id                   : string
  tenantId             : string
  name                 : string
  sponsorType          : SponsorType
  annualAmountCents    : number | null
  activeFrom           : string           // ISO date
  activeUntil          : string | null    // ISO date
  contactEmail         : string | null
  contactPhone         : string | null
  notes                : string | null
  createdAt            : string
  updatedAt            : string
  createdBy            : string | null
}

export interface SponsorChildLink {
  id                    : string
  tenantId              : string
  sponsorId             : string
  childId               : string
  startedAt             : string           // ISO date
  endedAt               : string | null    // ISO date
  allocatedAmountCents  : number | null
  notes                 : string | null
  createdAt             : string
  createdBy             : string | null
}

export interface SponsorWithCounts extends Sponsor {
  activeChildrenCount   : number
  isActive              : boolean
}
```

---

### T3 — API `@aureak/api-client/src/admin/sponsors.ts`

Pattern référence (mapping snake→camel + console guards) : `aureak/packages/api-client/src/admin/partnerships.ts` (Story 11.3).

```ts
import { supabase } from '../supabase'
import type { Sponsor, SponsorChildLink, SponsorType, SponsorWithCounts } from '@aureak/types'

function mapSponsorRow(row: any): Sponsor {
  return {
    id                : row.id,
    tenantId          : row.tenant_id,
    name              : row.name,
    sponsorType       : row.sponsor_type,
    annualAmountCents : row.annual_amount_cents,
    activeFrom        : row.active_from,
    activeUntil       : row.active_until,
    contactEmail      : row.contact_email,
    contactPhone      : row.contact_phone,
    notes             : row.notes,
    createdAt         : row.created_at,
    updatedAt         : row.updated_at,
    createdBy         : row.created_by,
  }
}

function mapLinkRow(row: any): SponsorChildLink {
  return {
    id                   : row.id,
    tenantId             : row.tenant_id,
    sponsorId            : row.sponsor_id,
    childId              : row.child_id,
    startedAt            : row.started_at,
    endedAt              : row.ended_at,
    allocatedAmountCents : row.allocated_amount_cents,
    notes                : row.notes,
    createdAt            : row.created_at,
    createdBy            : row.created_by,
  }
}

export async function listSponsors(): Promise<{ data: SponsorWithCounts[]; error: unknown }> {
  try {
    const { data: rows, error } = await supabase
      .from('sponsors')
      .select('*, sponsor_child_links!inner(ended_at)')
      .order('created_at', { ascending: false })
    if (error) throw error
    const today = new Date().toISOString().slice(0, 10)
    const result: SponsorWithCounts[] = (rows ?? []).map((row: any) => {
      const base = mapSponsorRow(row)
      const links = Array.isArray(row.sponsor_child_links) ? row.sponsor_child_links : []
      const activeChildrenCount = links.filter((l: any) => l.ended_at === null).length
      const isActive = base.activeFrom <= today && (base.activeUntil === null || base.activeUntil >= today)
      return { ...base, activeChildrenCount, isActive }
    })
    return { data: result, error: null }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[sponsors] listSponsors error:', err)
    return { data: [], error: err }
  }
}

// ... autres fonctions suivent le même pattern try/catch/console guard
```

Contraintes :
- Toujours mapper snake→camel après `select('*')` (voir CLAUDE.md gotcha)
- `searchChildrenForSponsor(query)` : filtrer `.eq('user_role', 'child').is('deleted_at', null).ilike('full_name', '%' + query + '%')`
- `unlinkChildFromSponsor(linkId)` : `update({ ended_at: new Date().toISOString().slice(0,10) })`

---

### T4–T8 — UI

Pattern référence StatCards + tableau : `aureak/apps/web/app/(admin)/academie/...` (pages hub académie).
Pattern modale RHF+Zod : `aureak/apps/web/components/admin/` (chercher `*Modal.tsx` récent — Story 88.2 fournit un modèle avec RHF+Zod).

**Styles obligatoires** :
```tsx
import { colors, space, radius, shadows } from '@aureak/theme'

backgroundColor : colors.light.primary    // fond page
backgroundColor : colors.light.surface    // card / modale
borderRadius    : radius.md
boxShadow       : shadows.sm
color           : colors.text.dark
padding         : space.lg
```

Format montant : diviser `annualAmountCents / 100`, afficher avec `new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.

---

### Design

**Type design** : `polish` (aligner sur patterns existants : StatCards + tableau/grille + modale RHF).

Principes design à respecter :
- Bento premium : StatCards en tête, liste structurée en dessous
- Gold pour les accents actifs (statut, montants)
- Pas de fond sombre, pas de hardcode couleurs

---

### Fichiers à créer / modifier

| Fichier | Action | Notes |
|---------|--------|-------|
| `supabase/migrations/00168_sponsors_and_links.sql` | CRÉER | Migration idempotente |
| `aureak/packages/types/src/entities.ts` | MODIFIER | Ajouter Sponsor, SponsorChildLink, SponsorType, SponsorWithCounts |
| `aureak/packages/types/src/index.ts` | MODIFIER | Exporter les nouveaux types |
| `aureak/packages/api-client/src/admin/sponsors.ts` | CRÉER | API CRUD + autocomplete |
| `aureak/packages/api-client/src/index.ts` | MODIFIER | Re-export `./admin/sponsors` |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/page.tsx` | MODIFIER | Remplacer placeholder Story 92.1 par liste réelle |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/[sponsorId]/page.tsx` | CRÉER | Fiche sponsor |
| `aureak/apps/web/app/(admin)/partenariat/sponsors/[sponsorId]/index.tsx` | CRÉER | Re-export |
| `aureak/apps/web/components/admin/partenariat/SponsorFormModal.tsx` | CRÉER | Modale création/édition |
| `aureak/apps/web/components/admin/partenariat/LinkChildModal.tsx` | CRÉER | Modale autocomplete enfants |
| `aureak/apps/web/components/admin/partenariat/SponsorCard.tsx` | CRÉER si utile | Composant carte sponsor réutilisable |

### Fichiers à NE PAS modifier

- `aureak/apps/web/components/admin/partenariat/PartenariatNavBar.tsx` — livré par Story 92.1, ne pas toucher
- `aureak/apps/web/app/(admin)/partenariat/_layout.tsx` — Story 92.1, intact
- `aureak/apps/web/app/(admin)/partenariat/clubs/**` — périmètre Story 92.3
- `aureak/apps/web/app/(admin)/partnerships/**` — page Epic 11, intacte (refonte couverte par 92.3)
- `aureak/packages/api-client/src/admin/partnerships.ts` — API Story 11.3 intacte
- `aureak/apps/web/lib/admin/nav-config.ts` — ne pas toucher

---

### Dépendances à protéger

- Story 92.1 : page placeholder `sponsors/page.tsx` sera **remplacée** (pas supprimée) — vérifier que `/partenariat` redirige toujours bien via `_layout.tsx` + `page.tsx` racine
- `profiles` table : read-only depuis cette story, jamais modifier son schéma ni ses policies
- `tenants` table : FK uniquement, pas de modification

---

### Références

- Migration référence (enum + table + RLS tenant-isolated) : `supabase/migrations/00147_add_commercial_user_role.sql` et `00161` (Story 88.2 si mergée)
- Pattern API CRUD + mapping snake→camel : `aureak/packages/api-client/src/admin/partnerships.ts` (Story 11.3)
- Pattern autocomplete children : `aureak/packages/api-client/src/admin/prospection.ts` (Story 89.1 — `searchChildDirectoryByName`)
- Pattern UI StatCards + tableau : pages `(admin)/academie/joueurs`, `(admin)/academie/coachs`
- Pattern modale RHF+Zod : chercher `*Modal.tsx` dans `aureak/apps/web/components/admin/` (Story 88.2 quand mergée)
- Types existants : `aureak/packages/types/src/entities.ts`
- Story 92.1 (dépendance directe) : `_bmad-output/implementation-artifacts/story-92-1-partenariat-sidebar-page-hub.md`

---

### Multi-tenant

- RLS gère l'isolation via `tenant_id = current_tenant_id()` dans les policies (voir T1)
- Côté API : ne **jamais** passer `tenant_id` manuellement depuis le client — laisser RLS filtrer
- Trigger ou default côté insert : `tenant_id` doit être fourni. Pattern recommandé : helper fonction qui lit `current_tenant_id()` et le passe dans l'insert. Ou `DEFAULT current_tenant_id()` sur la colonne (voir pattern `commercial_contacts`).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

| Fichier | Statut |
|---------|--------|
