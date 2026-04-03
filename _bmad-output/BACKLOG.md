# Backlog d'implémentation — Aureak

> Ordre d'exécution recommandé basé sur les dépendances inter-épics.
> Dernière mise à jour : 2026-04-01 (décisions produit finales)

---

## Légende
- `[x]` = done
- `[ ]` = ready-for-dev
- `[~]` = review
- `[d]` = deferred (mobile phase 2 ou hors scope)
- `[2]` = phase-2 (après fonctionnalités opérationnelles)

---

## Notes transversales (règles absolues avant de coder)

1. **Migrations** : toujours utiliser **00090+** (00001–00089 occupées). Ignorer les numéros dans les story files — ils sont obsolètes.
2. **Chemin UI `sessions` → `seances`** : les stories écrivent `(admin)/sessions/`. L'app réelle utilise `(admin)/seances/`.
3. **Chemin UI `referentiel` → `methodologie`** : les stories écrivent `(admin)/referentiel/`. L'app réelle utilise `(admin)/methodologie/`.
4. **Architecture packages** :
   - `@aureak/api-client` = accès Supabase / requêtes / mapping DB→TS uniquement
   - `@aureak/business-logic` = règles métier, validations, use cases, orchestration (EXISTS à `aureak/packages/business-logic/src/`)
5. **App mobile** : `apps/mobile/` différée. Stories mobile-only = `[d]`.
6. **DB remote vs repo** : le remote Supabase a ~30 tables sans migration dans le repo. Chantier séparé "DB baseline recovery" à traiter en parallèle (ne bloque pas le dev).

---

## Stories complétées (référence)

- [x] Epic 1 : Fondation monorepo (1-1, 1-2, 1-3)
- [x] Epic 2 partial : Accès clubs + RLS policies (2-5)
- [x] Epic 3 : Référentiel pédagogique (3-1, 3-2, 3-3, 3-4, 3-5, 3-6)
- [x] Epic 4 : Séances terrain (4-1, 4-2, 4-3, 4-5, 4-6, 4-7)
- [x] Epic 6 partial : Évaluations (6-1, 6-4)
- [x] Epic 7 partial : Notifications (7-2)
- [x] Epic 9 : Dashboard admin + anomalies + messagerie (9-1, 9-2, 9-3, 9-4, 9-5)
- [x] Epic 10 : RGPD + consentements + audit (10-1, 10-2, 10-3, 10-4, 10-5)
- [x] Epic 11 : Grades coaches + permissions contenu + partenariats (11-1, 11-2, 11-3)
- [x] Epic 13 : Séances v2 (13-1, 13-3)
- [x] Epic 18 : Joueurs admin (18-1, 18-2, 18-4, 18-5, 18-6, 18-7)
- [x] Epic 19 : Séances admin UI (19-4, 19-5)
- [x] Epic 20 : Méthodologie UX (20-1 → 20-5)
- [x] Epic 21 : Training builder (21-1, 21-2, 21-3)
- [x] Epic 22 : Création joueur qualité (22-1a, 22-1b, 22-2a, 22-2b, 22-3)
- [x] Epic 23 : Clubs visuels (23-1 → 23-5)
- [x] Epic 24 : Sections thème (24-1 → 24-7)
- [x] Epic 25 : Carte joueur premium (25-0 → 25-8)
- [x] Epic 26 : Carte club premium (26-1, 26-2)
- [x] Epic 27 : Theme card design (27-1, 27-2)
- [x] Epic 28 partial : Logos clubs (28-2, 28-3)
- [x] Epic 29 : Matricules RBFA (29-1)
- [x] Epic 30 : Script détection gardiens (30-1)
- [x] Epic 31 : Filtre saison académie (31-1)

---

## En attente de review

- [~] 1-4 : pipeline-ci-cd-tests-standards-de-code
- [~] 13-2 : sessions-calendrier-auto-generation-gestion-exceptions
- [~] 24-6 : mini-exercices-terrain

---

## Deferred — mobile phase 2 ou hors scope

- [d] 2-4 : auth-rapide-geolocalisee-pin-gps
- [d] 5-3 : enregistrement-presence-offline-2s
- [d] 6-2 : ux-evaluation-rapide-10s-par-enfant
- [d] 8-3 : ux-enfant-acquired-not-acquired-avatar-badges
- [d] 12-3 : avatar-system-equipement-items-debloquables
- [d] 12-5 : carte-de-progression-theme-collection-de-skill-cards

---

## Phase 2 — après fonctionnalités opérationnelles

- [2] 12-1 : modele-de-donnees-badges-points-ledger-cosmetiques-avatar
- [2] 12-2 : event-bus-gamification-traitement-des-4-evenements-declencheurs
- [2] 12-4 : quetes-hebdomadaires-attribution-progression-recompenses
- [2] 4-4 : planification-recurrente-gestion-des-exceptions
- [2] 6-3 : double-validation-coach-realtime-fallback-polling

---

## Backlog ordonné — ready-for-dev

**✅ Tout le backlog Phase 1 est implémenté** (stories 2-1→2-3, 5-1→5-6, 7-1→7-4, 8-1→8-5, 9-1→9-5, 10-1→10-5, 11-1→11-3, 28-1)

*Prochaine étape : DB Baseline Recovery + tests end-to-end*

---

## Chantier parallèle — DB Baseline Recovery

> Ne bloque pas le développement immédiat. À traiter en parallèle.

**Problème** : ~30 tables existent en remote Supabase sans migration dans le repo. Si la DB est recréée from scratch, elle sera incomplète.

**Objectif** : rendre la base recréable à 100% depuis `supabase/migrations/`.

**Étapes** :
1. Dumper le schéma remote : `supabase db dump --linked --schema public > /tmp/remote_schema.sql`
2. Identifier les tables/fonctions sans migration correspondante
3. Reconstituer les migrations manquantes (numérotées 00090+, intercalées logiquement)
4. Valider avec `supabase db reset` + `supabase db diff` = clean

---

## Migrations à créer (ordre priorité)

| Migration | Contenu | Pour story |
|-----------|---------|------------|
| `00090_rls_policies_complete.sql` | functions helpers durcies + toutes policies + coach_access_grants | 2-2, 2-3 |
| `00091_grade_content_permissions.sql` | table + RLS | 11-2 |
| `00092_support_tickets.sql` | table + RLS | 7-4 |
| `00093_user_consents.sql` | table + RLS | 10-2 |
