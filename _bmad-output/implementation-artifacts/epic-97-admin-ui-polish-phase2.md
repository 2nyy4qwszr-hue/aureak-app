# Epic 97 — Admin UI Polish Phase 2 (extension template + uniformisation navigation)

Status: ready-for-dev

## Metadata

- **Epic ID** : 97
- **Nom** : Admin UI Polish Phase 2
- **Scope** : Étendre le template admin (composant `AdminPageHeader` + pattern Méthodologie/Activités) à toutes les zones Admin qui ne l'ont pas encore, uniformiser les titres par sous-section, migrer les URLs racines vers des hiérarchies cohérentes, moderniser la sidebar (icônes + palette).
- **Prédécesseurs** : Epic 93 (template premium sur Activités + Méthodologie, mergé) · Epic 95 (routing cleanup Expo Router, mergé)
- **Source** : Audit UI par l'utilisateur après clôture Epic 94 (stories clôturées 2026-04-22). Besoin produit : cohérence visuelle et navigation lisible sur l'ensemble de la zone admin.
- **Dépendances externes** : aucune (pas de migration DB, pas d'API nouvelle, pas de RLS).
- **Durée estimée** : ~10-15 jours dev (13 stories, efforts S/M/L).
- **Out of scope** : Performance (analytics) et Administration (profil/settings/RGPD/…) — couverts par **Epic 98** et **Epic 99** respectivement. Zone Dashboard Admin — non touchée (déjà validée, préservation intentionnelle).

## Objectif produit

1. **Cohérence visuelle** : toutes les pages admin hors Dashboard, Performance et Administration adoptent le même header (`AdminPageHeader` v2, sans eyebrow/subtitle obligatoires) et les mêmes tokens `@aureak/theme`.
2. **Navigation claire** : quand l'utilisateur est sur `/activites/seances`, le titre de page affiche "Séances" (pas "Activités") ; breadcrumbs parent/enfant implicites via titre + URL.
3. **URLs hiérarchiques** : les pages vivent sous leur zone sidebar (`/activites/seances`, `/academie/joueurs`, `/prospection/clubs`, `/evenements/stages`) — fin des routes orphelines à la racine.
4. **Sidebar modernisée** : icônes Lucide du template design (stroke 1.7, pictos métiers) + palette anthracite/noir dégradé.

## Stories

### Tranche A — Fondations composant + sidebar

- **[97.1](story-97-1-sidebar-icones-lucide.md)** — Sidebar : 7 icônes Lucide du template + 5 nouveaux composants `@aureak/ui` (S)
- **[97.2](story-97-2-sidebar-palette-anthracite.md)** — Sidebar : palette anthracite fond dégradé (S)
- **[97.3](story-97-3-admin-page-header-v2.md)** — `<AdminPageHeader />` v2 — retirer eyebrow/subtitle obligatoires + rétro-appliquer aux 8 pages Activités + Méthodologie (M)

### Tranche B — Migrations URL

- **[97.4](story-97-4-migration-url-prospection.md)** — Migrer `/developpement/prospection/*` → `/prospection/*` avec redirects (M)
- **[97.5](story-97-5-migration-url-racines.md)** — Supprimer routes racines : `/seances`, `/players`, `/coaches`, `/groups`, `/stages` → sous-hiérarchies correspondantes (L)

### Tranche C — Template + titres par zone

- **[97.6](story-97-6-template-academie-pages-saines.md)** — Académie — template + titres sur 6 pages saines (joueurs, coaches, groupes, manager, commercial, marketeur) (M)
- **[97.7](story-97-7-refonte-academie-scout.md)** — Académie / Scout — refonte complète (M)
- **[97.8](story-97-8-refonte-academie-club.md)** — Académie / Club — refonte complète (M)
- **[97.9](story-97-9-refonte-academie-implantation.md)** — Académie / Implantation — refonte complète (M)
- **[97.10](story-97-10-restructure-evenements-sous-pages.md)** — Événements — hub + 5 sous-pages (stage, tournoi, fun_day, detect_day, seminaire) (L)
- **[97.11](story-97-11-template-prospection.md)** — Prospection — template + titres 3 pages (dépend 97.4) (M)
- **[97.12](story-97-12-template-marketing.md)** — Marketing — template + titres (médiathèque, réseaux) (S)
- **[97.13](story-97-13-template-partenariat.md)** — Partenariat — template + titres (sponsors, clubs) + fix bug runtime (M)

## Ordre d'implémentation suggéré

1. **97.3** (composant v2) — prérequis de toutes les stories template
2. **97.1** puis **97.2** (sidebar, indépendants)
3. **97.5** puis **97.4** (migrations URL ; 97.5 avant 97.6/97.10 car déplace les pages cibles)
4. **97.6** (Académie pages saines)
5. **97.10** (Événements — gros chantier, dépend de 97.5 pour `/stages`)
6. **97.11** (Prospection, dépend de 97.4)
7. **97.12** (Marketing)
8. **97.13** (Partenariat)
9. **97.7, 97.8, 97.9** (refontes Académie — les plus lourdes, en dernier)

## Principes d'exécution

- **1 commit par story** (sauf migrations URL 97.4/97.5 où un commit par batch URL peut être nécessaire pour faciliter le revert).
- **Redirects 301 pour toute migration d'URL publique** (évite casser les bookmarks admin).
- **Pas de régression fonctionnelle** : le périmètre fonctionnel de chaque page est préservé, sauf mentions explicites dans la story (ex: 97.7, 97.8, 97.9 = refontes).
- **Conformité CLAUDE.md** : try/finally, console guards, tokens `@aureak/theme`, accès DB via `@aureak/api-client`, Expo Router `page.tsx` + `index.tsx` re-export, non-routes hors `app/`.
- **Tests Playwright post-story** : navigation vers la page, screenshot, console sans erreur, interaction principale validée.

## Risques et mitigations

| Risque | Mitigation |
|---|---|
| 97.5 casse des liens internes ou bookmarks | Redirects 301 pour chaque URL supprimée · grep `href="/seances\|/players\|/coaches\|/groups\|/stages"` avant merge |
| 97.3 casse les 8 pages déjà alignées (Activités + Méthodologie) | Rendre `eyebrow` et `subtitle` optionnels (pas obligatoires) + QA Playwright sur les 8 pages avant merge |
| 97.10 change le comportement de `/evenements` (hub actuellement vue unifiée) | Conserver la vue unifiée derrière un toggle/onglet "Tous" ou une page hub séparée qui liste les 5 types |
| Icônes `@aureak/ui` manquantes (97.1) | Créer les 5 composants manquants (ActivityIcon, CompassIcon, MegaphoneIcon, HandshakeIcon, TrendingUpIcon) dans la même story |

## Références

- **Template design source** : `_bmad-output/design-references/_template_extracted/{shell.jsx,icons.jsx,admin.css}`
- **Composant actuel** : `aureak/apps/web/components/admin/AdminPageHeader.tsx`
- **Config sidebar actuelle** : `aureak/apps/web/lib/admin/nav-config.ts`
- **Pages déjà alignées (93.5/6/7)** : `(admin)/activites/*`, `(admin)/methodologie/*`
- **ADR pertinent** : `_bmad-output/planning-artifacts/adr/005-expo-router-v6-no-underscore-convention.md`
