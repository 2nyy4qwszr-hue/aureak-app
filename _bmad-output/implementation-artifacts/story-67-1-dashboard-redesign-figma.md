# Story 67.1 : Dashboard admin — refonte complète (design Figma)

Status: done

## Story

En tant qu'admin,
je veux un tableau de bord entièrement refondu basé sur le design Figma validé,
afin d'avoir une vue opérationnelle de la journée, de l'académie et de la performance sur une seule page 4K sans scroll.

## Référence design

Fichier : `_bmad-output/design-references/dashboard-redesign.png`

Ce fichier contient le design Figma de référence à reproduire à l'identique.

## Description visuelle

### Layout global
- **Sidebar sombre** (existante, 220px) — inchangée
- **Top bar** : date · météo par créneau · badge clôture séances · icône notification
- **3 colonnes** : La Journée (25%) · L'Académie (45%) · Performance (30%)
- Fond : `colors.light.primary` (#F3EFE7)
- Cartes : blanc (#FFFFFF), border-radius 16px, shadow sm

---

### TOP BAR (header fixe, carte blanche pleine largeur)

**Gauche** : date en grand — "6 avril 2026" (Montserrat 700, 28px, dark)

**Centre** : strip météo par créneau d'entraînement
- Format : `16H ☀ 11°` · `18H ☀ 9°` · `20H 🌧 7°`
- Badge rond vert (✓) si terrain praticable · rouge (⛔) si conditions défavorables
- Données depuis Open-Meteo (déjà implémenté dans `WeatherWidget`)

**Droite** :
- Pill alerte clôture : `● 2 SÉANCES NON CLÔTURÉES` (bordure rouge, texte rouge) — disparaît si 0
- Icône cloche notification (existante)

---

### COLONNE GAUCHE — "LA JOURNÉE"

**Titre section** : `LA JOURNÉE` — 10px uppercase, letter-spacing 2px, `colors.accent.gold`

**Card 1 — Sessions du jour**

Header : "Sessions du jour" (bold 18px) + badge date "6 AVR." (gold pill)

Chaque session :
- Heure (bold, 16px, dark) — ex: `16:00`
- Nom groupe (bold, 15px) — ex: `Elite U19`
- Point couleur implantation (8px dot, couleur par implantation)
- Avatar coach (24px initiales) + nom coach — ex: `Coach M. Valmont`
- Pill statut :
  - `À VENIR` — bordure verte, fond transparent, texte vert
  - `EN COURS` — fond vert plein, texte blanc
  - `CLÔTURÉE` — fond gris clair, texte gris
  - `NON CLÔTURÉE` — fond rouge, texte blanc (alerte)
- Session EN COURS : bordure gauche 3px verte sur la ligne
- Session CLÔTURÉE : texte heure/groupe en gris atténué

**Card 2 — Urgences & Anomalies**

Header : "Urgences & Anomalies" (bold 18px)

Chaque anomalie :
- Label type : `CRITIQUE` (rouge, 10px uppercase) ou `WARNING` (orange) + heure/date (gris, droite)
- Texte description (14px, dark)
- Séparateur : bordure gauche 3px (rouge si critique, orange si warning)

Lien footer : "Voir toutes les anomalies →" (`colors.accent.gold`, 13px)

---

### COLONNE CENTRE — "L'ACADÉMIE"

**Titre section** : `L'ACADÉMIE` — 10px uppercase, letter-spacing 2px, `colors.accent.gold`

**Row 1 — 4 KPI mini-cards côte à côte**

| JOUEURS | COACHS | GROUPES | SITES |
|---------|--------|---------|-------|
| 247 ↑+12 | 8 | 14 | 3 |

Chaque card : label (10px uppercase gris) + chiffre (32px Montserrat 900 dark) + delta badge (+12 vert si positif)
Données : `getDashboardKpiCounts()`

**Card 2 — Activité 4 semaines**

Header : "Activité 4 semaines" (bold 18px) + 2 dots filtre (vert · gold) en haut droite

Deux lignes de stats :
- `PRÉSENCE` (label gris 11px) — `78%` (bold gold) — barre verte pleine largeur
- `MAÎTRISE` (label gris 11px) — `64%` (bold gold) — barre gold/dark partielle

Section séances clôturées :
- `SÉANCES CLÔTURÉES` (label gris 11px) — `34 / 37` (bold, droite)
- Barre bicolore : vert foncé (clôturées) + rose/rouge (non clôturées)

Données : `getImplantationStats()`

**Card 3 — Performance Sites**

Header : "Performance Sites" (bold 18px)

Tableau compact :
- Colonnes : IMPLANTATION · SÉANCES · PRÉSENCE · MAÎTRISE
- Header colonnes : 10px uppercase gris
- 1 ligne par implantation, 14px
- Présence colorée : vert ≥ 75% · orange 50-74% · rouge < 50%
- Maîtrise colorée : idem seuils

Données : `getImplantationStats()`

**Card 4 — Prochains événements**

Header : "Prochains événements" (bold 18px)

Chaque événement :
- Badge date sombre (fond #2A2520) : mois 3 lettres + jour grand — ex: `AVR / 09`
- Nom événement (bold 15px)
- Sous-label : icône 👤 + "X inscrits" (gris 13px)
- Tag type : `STAGE` · `ÉVAL` · `MATCH` (pill gris clair, 11px uppercase)

---

### COLONNE DROITE — "PERFORMANCE"

**Titre section** : `PERFORMANCE` — 10px uppercase, letter-spacing 2px, `colors.accent.gold`

**Card 1 — Classement XP Top 5** (fond sombre #1A1A1A)

Header : icône trophée gold + "Classement XP (Top 5)" (bold 16px, blanc)
Watermark : logo/étoile Aureak en opacity 8% centré en background

Chaque ligne (top 3 visible) :
- Médaille : 🥇 🥈 🥉 (emoji natif)
- Avatar initiales : cercle 36px (gold #1, silver #2, bronze #3)
- Nom complet (bold 14px, blanc)
- XP : `12,450 XP` (gris clair 13px)
- Flèche évolution : ↑ vert / → gris / ↓ rouge

Données : `getXPLeaderboard(5)`

**Card 2 — Quêtes actives** (fond blanc)

Header : "Quêtes actives" (bold 18px)

Chaque quête :
- Nom quête (14px bold)
- Si complétée : checkmark gold à droite
- Si en cours : `14/20` (gris 12px) + barre de progression gold

Lien footer : "Voir toutes les quêtes →" (gold, 13px)

**Card 3 — Score Académie** (fond blanc)

Header : `SCORE ACADÉMIE` (10px uppercase, gold, letter-spacing 2px)

Centre : donut circulaire SVG (stroke gold, fond gris clair)
- Valeur centrale : `72` (Montserrat 900, 48px) + `/ 100` (gris 14px)

Footer :
- `NIVEAU INTERMÉDIAIRE` (12px uppercase, bold, dark, centré)
- `+5 pts cette semaine 📈` (vert, 13px, centré)

Données : `getAcademyScore()`

---

## Acceptance Criteria

1. Le top bar affiche date live + météo 3 créneaux + badge clôture séances (rouge si > 0, vert si 0)
2. La colonne gauche affiche les sessions du jour avec statut correct (À VENIR / EN COURS / CLÔTURÉE / NON CLÔTURÉE) et les anomalies actives
3. La colonne centre affiche les 4 KPIs, activité 4 semaines avec barres, tableau Performance Sites, prochains événements
4. La colonne droite affiche leaderboard XP (card sombre), quêtes actives avec progression, score académie avec donut SVG
5. L'ensemble tient sur un écran 4K (2560×1440 min) sans scroll vertical
6. Zéro couleur hardcodée — tokens `@aureak/theme` uniquement
7. Zéro erreur console JS au chargement
8. Tous les blocs ont un skeleton loading cohérent
9. Le design correspond fidèlement à `_bmad-output/design-references/dashboard-redesign.png`

## Technical Tasks

- [ ] Lire `_bmad-output/design-references/dashboard-redesign.png` (référence visuelle)
- [ ] Lire `aureak/apps/web/app/(admin)/dashboard/page.tsx` entièrement
- [ ] Supprimer les composants devenus obsolètes : `SeasonTrophyTile`, `StreakTile`, `LeaderboardTile` (remplacés), `AcademyScoreTile` (refait), drag-drop KPI logic
- [ ] Implémenter `TopBar` : date live + `WeatherStrip` (réutiliser logique Open-Meteo existante) + `SessionClosurePill`
- [ ] Implémenter colonne gauche : `SessionsDuJour` + `UrgencesAnomalies`
- [ ] Implémenter colonne centre : `KpiMiniRow` + `Activite4Semaines` + `PerformanceSites` + `ProchainsEvenements`
- [ ] Implémenter colonne droite : `ClassementXP` (dark card) + `QuetesActives` + `ScoreAcademie` (donut SVG)
- [ ] Implémenter `DashboardSkeleton` adapté au nouveau layout 3 colonnes
- [ ] QA scan : try/finally + console guards sur tous les state setters
- [ ] Playwright : screenshot + vérif console zéro erreur

## Files

- `aureak/apps/web/app/(admin)/dashboard/page.tsx` (réécriture complète)

## Dependencies

Toutes les APIs nécessaires existent déjà :
- `getDashboardKpiCounts()` → KPI row
- `getImplantationStats()` → Activité 4 semaines + Performance Sites
- `listAnomalies()` → Urgences & Anomalies
- `listNextSessionForDashboard()` → Sessions du jour
- `getXPLeaderboard(5)` → Classement XP
- `getAcademyScore()` → Score Académie
- Open-Meteo API (déjà dans WeatherWidget) → WeatherStrip

Quêtes actives : vérifier si `listActiveQuests()` existe dans `@aureak/api-client` — sinon créer une fonction stub retournant `[]` avec TODO.

## Notes

- Aucune migration DB nécessaire — UI uniquement
- Supprimer complètement : trophée saison, player of week, streaks, KPI drag-drop, focus mode
- Le donut SVG Score Académie : cercle SVG avec `stroke-dasharray` calculé depuis le score (0-100)
- Sessions du jour : filtrer sur `scheduled_at::date = CURRENT_DATE`, trier par heure ASC
- Badge `NON CLÔTURÉE` = séance dont `status != 'closed'` ET `scheduled_at < NOW()`
