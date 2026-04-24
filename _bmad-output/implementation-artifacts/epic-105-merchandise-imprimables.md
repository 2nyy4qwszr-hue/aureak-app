# Epic 105 — Merchandise & supports imprimables

Status: in-progress
Date: 2026-04-23

## Objectif

Regrouper les fonctionnalités de génération de supports visuels imprimables à destination des parents, enfants, coachs et clubs : cartes Panini pour stages, diplômes, affiches d'équipe, cartes de membres. Ces supports créent un lien physique avec l'académie (souvenirs, goodies, merchandising).

## Périmètre

- Générateurs côté front (canvas / SVG compositing) sans nouvelle API complexe
- Accès réservé aux admins (v1) + éventuellement coachs avec grade suffisant (v1.1)
- Export JPEG/PDF haute résolution (300 DPI)
- Réutilisation des données existantes (stages, enfants, clubs, équipes) — zéro nouvelle migration

## Stories

- [x] **105-1** : génération de cartes Panini pour stages (souvenir participation) — 2026-04-24
- [ ] **105-2** : diplôme individuel fin de stage (à planifier)
- [ ] **105-3** : affiche équipe stage (tous les enfants sur une planche) (à planifier)
- [ ] **105-4** : carte de membre (photo joueur + infos club) (à planifier)

## Non-scope

- Impression directe depuis l'app (v1 = download puis impression par l'utilisateur)
- Upload de templates custom par utilisateur (v1 = template global unique par générateur)
- Mobile (web-only en v1 — usage administratif/préparation d'impression)
