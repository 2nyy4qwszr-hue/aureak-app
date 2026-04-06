# Story 65.1 : Activités — Hub Séances (tableau + pseudo-filtres temporels)

Status: done

Epic: 65 — Activités Hub Unifié (Séances · Présences · Évaluations)

## Référence visuelle

Figma : https://www.figma.com/design/HFoTEXwV01khcWelhoUtD1/Untitled?node-id=0-1
Écran "Body" gauche — page Activités onglet Séances

## Story

En tant qu'admin Aureak,
je veux une page "Activités" unifiée accessible depuis la sidebar, avec un tableau des séances filtrable et des stat cards contextuelles,
afin de visualiser toute l'activité de l'académie en un seul endroit.

## Acceptance Criteria

1. Route `(admin)/activites/` créée — entrée "Activités" dans la sidebar avec icône, active state gold
2. Header : onglets **SÉANCES** · PRÉSENCES · ÉVALUATIONS (underline gold sur actif) + bouton "+ Nouvelle séance" gold aligné à droite
3. Filtres scope (ligne 1) : pills **Global** (défaut, fond gold) · **Implantation ▾** · **Groupe ▾** · **Joueur ▾**
4. Pseudo-filtres temporels (ligne 2, indépendants) : pills **AUJOURD'HUI** · **À VENIR** · **PASSÉES** — filtrent le tableau, pas des sections
5. 4 stat cards (valeurs adaptées au filtre scope actif) :
   - **Présence Moyenne** : "78%" Geist Mono 32px + "↑ +3% ce mois" vert
   - **Total Séances** : "142" + "8 à venir" sous-texte
   - **Annulées** : "6" + badge orange "4%"
   - **Évals Complétées** : "89%" + barre de progression gold
6. Tableau des séances (card blanche, alternance fond blanc/beige #F8F6F1 fort contraste) avec colonnes :
   - **STATUT** — badge pill : réalisée (vert) · planifiée (bleu) · en cours (gold) · annulée (rouge, italique, opacité 55%) · reportée (orange)
   - **DATE** — "Mar 06/04 · 09h00"
   - **MÉTHODE** — badge coloré + icône : ⚽ G&P (#FFB800) · 🎯 Tech (#4FC3F7) · 📐 Sit (#66BB6A) · 🧠 Déc (#CE93D8) · 💎 Perf (#EC4899) · 🔗 Int (#F97316)
   - **GROUPE** — "U14 – A"
   - **COACH** — avatar(s) initiales 32px fond gold clair, max 2 puis "+N"
   - **PRÉSENCE** — "12/14" + mini barre colorée (vert ≥80%, orange ≥60%, rouge <60%)
   - **BADGES** — nombre brut (ex. "3") — gris si 0 — PAS d'icône étoile
   - **ANOMALIE** — icône ⚠️ orange si anomalie, vide sinon
   - **›** — chevron cliquable extrême droite
7. Clic ligne → `(admin)/seances/[sessionId]/`
8. Pagination : "Affichage de 1–20 sur N séances" + flèches
9. Lignes annulées : italique + opacité 55%
10. Fort contraste entre lignes alternées

## Tasks / Subtasks

- [x] T1 — Route + layout
  - [x] T1.1 — Créer `aureak/apps/web/app/(admin)/activites/page.tsx`
  - [x] T1.2 — Créer `aureak/apps/web/app/(admin)/activites/index.tsx` (re-export)
  - [x] T1.3 — Lire `aureak/apps/web/app/(admin)/_layout.tsx` — ajouter entrée "Activités" dans la nav sidebar

- [x] T2 — Composant ActivitesHeader
  - [x] T2.1 — Onglets SÉANCES · PRÉSENCES · ÉVALUATIONS avec underline gold
  - [x] T2.2 — Détection onglet actif via `usePathname()`
  - [x] T2.3 — Bouton "+ Nouvelle séance" → `router.push('/(admin)/seances/new')`
  - [x] T2.4 — Clic PRÉSENCES → `router.push('/(admin)/activites/presences')`
  - [x] T2.5 — Clic ÉVALUATIONS → `router.push('/(admin)/activites/evaluations')`

- [x] T3 — Composant FiltresScope (partagé entre les 3 onglets)
  - [x] T3.1 — Pills : Global · Implantation ▾ · Groupe ▾ · Joueur ▾
  - [x] T3.2 — Dropdown Implantation : `listImplantations()` depuis `@aureak/api-client`
  - [x] T3.3 — Dropdown Groupe : `listGroupsByImplantation(implantationId)` conditionnel
  - [x] T3.4 — Dropdown Joueur : `listJoueurs()` avec search (utilise listJoueurs au lieu de listChildDirectory pour avoir JoueurListItem)
  - [x] T3.5 — State `{ scope, implantationId?, groupId?, childId? }` via URL params (persistance navigation)

- [x] T4 — Composant PseudoFiltresTemporels
  - [x] T4.1 — 3 pills : AUJOURD'HUI · À VENIR · PASSÉES — state local
  - [x] T4.2 — PASSÉES sélectionné par défaut
  - [x] T4.3 — Filtre appliqué côté client sur `session.scheduledAt`

- [x] T5 — Composant StatCards (4 cards)
  - [x] T5.1 — Appel `listSessionsWithAttendance({ implantationId?, groupId? })` depuis `@aureak/api-client`
  - [x] T5.2 — Calcul : taux présence moyen · nb séances total + à venir · nb annulées + % · % évals complètes
  - [x] T5.3 — Cards recalculées au changement de filtre scope
  - [x] T5.4 — Chiffre principal : Geist Mono 32px bold — sous-texte : Montserrat 12px #71717A
  - [x] T5.5 — Card "Évals Complétées" : barre progress gold dessous
  - [x] T5.6 — try/finally sur setLoading

- [x] T6 — Composant TableauSeances
  - [x] T6.1 — Données filtrées par scope + temporalFilter
  - [x] T6.2 — Badge STATUT coloré selon `session.status`
  - [x] T6.3 — Badge MÉTHODE : couleur + icône via `methodologyMethodColors` de `@aureak/theme`
  - [x] T6.4 — PRÉSENCE : barre colorée, données depuis `listSessionsWithAttendance`
  - [x] T6.5 — BADGES : COUNT `topSeance === 'star'` dans évals de la séance via `listEvaluationsBySession`
  - [x] T6.6 — ANOMALIE : vrai si `listActiveAbsenceAlerts` retourne alertes pour le groupe
  - [x] T6.7 — Alternance fond blanc / #F8F6F1 (fort contraste)
  - [x] T6.8 — Lignes annulées : `fontStyle: italic`, opacity 0.55
  - [x] T6.9 — Clic → `router.push('/(admin)/seances/' + session.id)`
  - [x] T6.10 — Pagination 20 lignes/page
  - [x] T6.11 — try/finally sur setLoading

- [x] T7 — QA
  - [x] T7.1 — `cd aureak && npx tsc --noEmit` → zéro erreur
  - [x] T7.2 — console guards sur tous les catch
  - [x] T7.3 — try/finally sur tous les setState loading
  - [ ] T7.4 — Playwright : naviguer `/activites`, vérifier 4 cards + tableau + filtres (skipped — app non démarrée)

## Dev Notes

### Pas de colonnes K / C dans ce tableau
Les colonnes "Éval Connaissance" et "Éval Compétences" ne sont PAS dans ce tableau — modules futurs non implémentés. Le tableau Séances affiche uniquement : STATUT · DATE · MÉTHODE · GROUPE · COACH · PRÉSENCE · BADGES · ANOMALIE · ›

### FiltresScope partagé
Ce composant sera importé tel quel dans les stories 65-2 (Présences) et 65-3 (Évaluations). Le concevoir en composant isolé réutilisable dès le départ.

### URL params pour la persistance
```typescript
// Utiliser searchParams pour que les filtres persistent à la navigation
const router = useRouter()
const searchParams = useSearchParams()
// scope=implantation&implantationId=xxx&temporel=passees
```

### API
```typescript
import { listSessionsAdminView, listImplantations, listGroupsByImplantation } from '@aureak/api-client'
import { listAttendancesBySession } from '@aureak/api-client'
import { listEvaluationsBySession } from '@aureak/api-client'
import { listChildDirectory } from '@aureak/api-client'
```

### Migration DB
Aucune — UI uniquement.

## File List

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/activites/index.tsx` | Créer |
| `aureak/apps/web/app/(admin)/_layout.tsx` | Modifier — entrée Activités |
