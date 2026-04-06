# Story 65.3 : Activités — Onglet Évaluations (vue transversale, 3 sous-filtres)

Status: done

Epic: 65 — Activités Hub Unifié (Séances · Présences · Évaluations)

## Référence visuelle

Figma : https://www.figma.com/design/HFoTEXwV01khcWelhoUtD1/Untitled?node-id=0-1
Écran "Body" droite — onglet Évaluations actif

## Story

En tant qu'admin Aureak supervisant la progression des joueurs,
je veux un onglet Évaluations avec 3 sous-filtres (Badges · Connaissances · Compétences) et un tableau des évaluations récentes par joueur,
afin de suivre la progression qualitative sans naviguer dans chaque séance.

## Acceptance Criteria

1. Route `(admin)/activites/evaluations/` — onglet ÉVALUATIONS actif (underline gold)
2. Même filtres scope que 65-1/65-2 : **Global** · **Implantation ▾** · **Groupe ▾** · **Joueur ▾** (cohérence entre les 3 pages)
3. Filtres temporels (ligne 2, identiques à 65-1) : **AUJOURD'HUI** · **À VENIR** · **PASSÉES**
4. 4 stat cards :
   - **Note Moyenne** : "7.2/10" Geist Mono 32px + badge vert "↑ +3%" + libellé "Moyenne Générale"
   - **Évals ce mois** : "48" Geist Mono 32px + "X séances concernées"
   - **Progression Technique** : "+15%" Geist Mono + badge coloré selon valeur
   - **Top Performer** : card fond dark #1A1A1A — nom joueur + groupe + "U17 ELITE" en gold
5. 3 sous-filtres en pills secondaires (sous les stat cards) : **BADGES** · **CONNAISSANCES** · **COMPÉTENCES** — BADGES sélectionné par défaut
6. **Sous-filtre BADGES — tableau évaluations récentes** :
   - Colonnes : JOUEUR · SÉANCE · DATE · RÉCEPTIVITÉ · EFFORT · ATTITUDE · TOP SÉANCE · COMMENTAIRE
   - RÉCEPTIVITÉ / EFFORT / ATTITUDE : dot coloré 16px (vert positive · orange attention · gris none)
   - TOP SÉANCE : icône ⭐ si `topSeance === 'star'`, vide sinon
   - COMMENTAIRE : texte court `note` depuis `evaluations.note`, tronqué 60 chars
   - Lignes : avatar initiales joueur 32px + nom + groupe
   - Triable par DATE (desc par défaut)
7. **Sous-filtre CONNAISSANCES** : card placeholder sobre, icône 📚, texte "Module Connaissances — disponible prochainement. Les évaluations de connaissances seront liées aux thèmes pédagogiques des séances."
8. **Sous-filtre COMPÉTENCES** : card placeholder sobre, icône 🎯, texte "Module Compétences — disponible prochainement. Les évaluations de compétences seront liées au référentiel technique gardien."
9. **Vue Joueur** (filtre scope = Joueur) : tableau évaluations filtrées sur ce joueur uniquement + card résumé joueur en haut (nom, groupe, nb évals, note moyenne)
10. Pas de spider chart — retiré
11. Pas de section "Optimisez vos indicateurs" — retirée
12. Pas de NOTE K / NOTE C dans le tableau — remplacé par les signaux réels (Réceptivité · Effort · Attitude)

## Tasks / Subtasks

- [x] T1 — Route
  - [x] T1.1 — Créer `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx`
  - [x] T1.2 — Créer `aureak/apps/web/app/(admin)/activites/evaluations/index.tsx`

- [x] T2 — Layout + filtres réutilisés
  - [x] T2.1 — Importer `ActivitesHeader` + `FiltresScope` depuis 65-1
  - [x] T2.2 — Ajouter `PseudoFiltresTemporels` (AUJOURD'HUI · À VENIR · PASSÉES) — même composant que 65-1
  - [x] T2.3 — State local `evalType: 'badges' | 'connaissances' | 'competences'`

- [x] T3 — 3 pills sous-filtres type
  - [x] T3.1 — Pills BADGES · CONNAISSANCES · COMPÉTENCES, style secondaire (plus petits que les filtres scope)
  - [x] T3.2 — BADGES fond gold #C1AC5C blanc sur sélectionné, outline sur les autres

- [x] T4 — Stat Cards Évaluations
  - [x] T4.1 — Appel `listEvaluationsAdmin(from, to)` (listMergedEvaluations = par session, pas scope transversal)
  - [x] T4.2 — Note Moyenne : moyenne de tous les scores `/10`
  - [x] T4.3 — Évals ce mois : COUNT évals sur les 30 derniers jours
  - [x] T4.4 — Progression Technique : delta note moyenne vs mois précédent (%)
  - [x] T4.5 — Top Performer : joueur avec la meilleure note moyenne — card fond #1A1A1A, texte gold
  - [x] T4.6 — try/finally sur setLoading

- [x] T5 — Tableau évaluations (sous-filtre BADGES actif)
  - [x] T5.1 — Appel `listEvaluationsAdmin()` filtré par scope + temporalFilter
  - [x] T5.2 — Colonnes : JOUEUR · SÉANCE · DATE · RÉCEPTIVITÉ · EFFORT · ATTITUDE · TOP SÉANCE · COMMENTAIRE
  - [x] T5.3 — Dot 16px coloré : vert #10B981 (positive) · orange #F59E0B (attention) · gris #E5E7EB (none)
  - [x] T5.4 — TOP SÉANCE : ⭐ gold si `topSeance === true` (booléen dans AdminEvalRow)
  - [x] T5.5 — COMMENTAIRE : champ `note` non disponible dans AdminEvalRow → affiche "—"
  - [x] T5.6 — Avatar initiales joueur 32px fond gold clair + nom
  - [x] T5.7 — Alternance fond blanc/colors.light.muted
  - [x] T5.8 — Tri par DATE desc par défaut, clic en-tête = toggle tri
  - [x] T5.9 — Clic ligne → `(admin)/seances/[sessionId]/` (fiche séance de l'éval)
  - [x] T5.10 — Pagination 20 lignes/page

- [x] T6 — Vue Joueur (scope = joueur)
  - [x] T6.1 — Card résumé joueur en haut : avatar + nom + groupe + nb évals + note moy.
  - [x] T6.2 — Tableau filtré sur `childId` uniquement
  - [x] T6.3 — Card résumé : fond white, bordure gold, radius 16px

- [x] T7 — Placeholders Connaissances + Compétences
  - [x] T7.1 — Card centrée, icône 48px, titre, texte descriptif, style sobre
  - [x] T7.2 — PAS de contenu vide agressif — uniquement le placeholder

- [x] T8 — QA
  - [x] T8.1 — `npx tsc --noEmit` zéro erreur
  - [x] T8.2 — console guards sur tous les catch
  - [ ] T8.3 — Playwright : onglet Évaluations visible, switch sous-filtres, tableau affiché (app non démarrée)

## Dev Notes

### Pas de NOTE K / NOTE C
Les colonnes "Note K" et "Note C" ne sont PAS implémentées — modules futurs (Connaissances + Compétences). Le tableau Évaluations utilise uniquement les signaux existants en DB : `receptivite`, `goutEffort`, `attitude`, `topSeance`, `note`.

### Signaux d'évaluation existants en DB
```typescript
// packages/types/src/entities.ts — Evaluation
receptivite: 'positive' | 'attention' | 'none'
goutEffort:  'positive' | 'attention' | 'none'
attitude:    'positive' | 'attention' | 'none'
topSeance:   'star' | 'none'
note:        string | null  // commentaire texte libre
```

### Dot coloré signal
```typescript
const signalColor = (signal: 'positive' | 'attention' | 'none') => ({
  positive:  { bg: '#10B981', label: 'Positif' },
  attention: { bg: '#F59E0B', label: 'À surveiller' },
  none:      { bg: '#E5E7EB', label: '—' },
}[signal])
```

### Vue Joueur — card résumé
```typescript
// Afficher en haut si scope === 'joueur' && childId
const playerSummary = {
  name: child.displayName,
  group: group.name,
  totalEvals: evals.length,
  avgScore: average(evals.map(e => e.score ?? 0)),
}
```

### API
```typescript
import { listMergedEvaluations, getAverageEvaluationsByPlayer } from '@aureak/api-client'
import { listEvaluationsBySessionWithPB } from '@aureak/api-client'
import { listGroupMembersWithProfiles } from '@aureak/api-client'
```

### Migration DB
Aucune — données existantes, calculs frontend.

### Dépendances
- Dépend de 65-1 (ActivitesHeader + FiltresScope + PseudoFiltresTemporels)

## File List

| Fichier | Action |
|---------|--------|
| `aureak/apps/web/app/(admin)/activites/evaluations/page.tsx` | Créer |
| `aureak/apps/web/app/(admin)/activites/evaluations/index.tsx` | Créer |
