# Design Vision — Aureak
> Référence permanente pour le Design Critic agent et toutes les décisions UI/UX.
> Construit lors de la session d'exploration des 5 blocs de références (avril 2026).

---

## La phrase clé

> "Une app de gestion d'académie qui donne envie de revenir comme un jeu — premium, lumineux, gamifié, où chaque coach et chaque enfant sent qu'il participe à une aventure."

---

## Références explorées

### Bloc 1 — Style Manager
- Football Manager 24 ✅ (animations, pictos navigation, panel-in-panel)
- FIFA Manager 14 ✅ (fond clair, bento, drag & drop terrain)
- LF Manager ❌ (trop sombre, trop dense)
- Top Eleven ✅ (épuré game, pictos, liste formation)
- OSM ✅ (roleplay, univers, personnage game)
- Club Soccer Director ✅ (photos aériennes terrains)

### Bloc 2 — Cards / Collection
- EA FC FUT ✅✅ (cartes iconiques, fond travaillé, familier)
- Sorare ✅ (personnage découpé hors cadre)
- LaLiga Fantasy ✅ (liste mobile horizontal + avatar rond)
- Panini Digital ❌ (trop flat)
- FIFA Rivals ⚠️ (bento menus OK, reste moyen)

### Bloc 3 — Stats / Data
- SofaScore ✅ (background flouté, bento calendrier)
- Fotmob ✅ (terrain + points data pour situationnel)
- Transfermarkt ❌ (trop formel, trop plat)
- FlashScore ❌ (Microsoft UI, sans âme)

### Bloc 4 — Gaming Arcade
- Dream League Soccer ✅✅ (bento home screen = référence principale)
- Score Hero ✅ (pictos simples, très lisible)
- Football Strike ⚠️ (disposition intéressante, finition insuffisante)
- eFootball 2024 ❌ (trop épuré, sans personnalité)

### Bloc 5 — Platforms Premium
- Premier League App ⚠️ (logos sympas, trop corporate)
- Bundesliga App ❌ (trop flat)
- Champions League App → non exploré
- LaLiga App → non exploré

---

## Les 12 principes design Aureak

1. **Fond clair** — blanc (#FFFFFF) ou beige (#F3EFE7), jamais dark dominant
2. **Bento cards** — toute page d'accueil = cases cliquables avec visuels
3. **Profondeur obligatoire** — box-shadow, relief léger, jamais flat
4. **Pictos navigation** — icônes simples et reconnaissables, on sait où on va sans lire
5. **Personnage qui dépasse** — les cards joueurs ont le personnage découpé hors cadre
6. **Photos terrains aériennes** — chaque implantation a une identité photo
7. **Background flouté** — contexte en arrière-plan flouté, contenu en premier plan
8. **Panel dans panel** — clic sur un élément = fiche contextuelle sans quitter la vue
9. **Terrain + data points** — visualisation situationnelle sur schéma pitch football
10. **Home screen DLS** — page d'accueil = bento avec entrées visuelles par section
11. **L'académie = univers** — le responsable, le coach, l'enfant participent à une aventure
12. **Animations progressives** — les éléments s'animent, la progression se voit

---

## Les 6 anti-patterns absolus

```
❌ FLAT DESIGN          → éliminatoire, jamais acceptable
❌ DARK DOMINANT        → fond sombre généralisé = non
❌ SURCHARGE D'INFO     → jamais entasser, aérer toujours
❌ CORPORATE/FORMEL     → Transfermarkt style = l'enfer
❌ RONDS SUR TERRAIN    → représentation joueurs sur pitch = silhouettes ou jersey
❌ CHEAP/INACHEVÉ       → dégradés mal faits, effets flous cheap = non
```

---

## Palette & tokens

```
Fond principal       → #F3EFE7  (beige chaud)
Cards surface        → #FFFFFF  (blanc pur)
Accent gold          → #C1AC5C  (gold premium)
Texte principal      → #18181B  (quasi-noir)
Texte secondaire     → #71717A  (gris moyen)
Ombre card repos     → 0 2px 8px rgba(0,0,0,0.08)
Ombre card hover     → 0 8px 24px rgba(193,172,92,0.15)
Border radius cards  → 16px minimum
Backdrop blur        → blur(12px) pour les overlays
```

---

## Dashboard Admin — Design validé (2026-04-03)

> Prototype HTML de référence : `_agents/design-references/desktop-admin-bento-v2.html`

### Structure validée
- **Pas de topbar** — le bento démarre immédiatement sous le sidebar, plein écran
- **Layout** : sidebar dark `#111111` (216px) + bento grid full-height
- **Grid** : 3 colonnes (1.5fr / 1fr / 1.15fr), 3 rangées (1fr / 1fr / 0.75fr), gap 12px
- **Padding** : 14px autour du bento uniquement

### Tiles validées
| Position | Contenu | Style |
|----------|---------|-------|
| Col 1, rows 1-2 (tall) | Hero académie — photo gardien + headline + 3 stats | Fond `#2A2827`, overlay gradient, texte blanc/gold |
| Col 2, row 1 | Séances du jour | Blanc, liste 3 items avec pills statut |
| Col 3, rows 1-2 (tall) | Joueurs actifs — chips U15/17/19 + liste + total | Blanc |
| Col 2, row 2 | Planning semaine — 2 chiffres + barres jours | Blanc |
| Cols 1-2, row 3 (wide) | Progression académie — big number + 3 barres | Blanc |
| Col 3, row 3 | Alertes système | Blanc |

### Couleurs clés validées
```
Hero card background  → #2A2827  (brun-gris chaud, référence card Confiance aureak.be)
Sidebar background    → #111111  (gris section aureak.be)
Fond bento            → #F0EBE1  (beige légèrement plus chaud que F3EFE7)
Cards                 → #FFFFFF
Chips / sous-éléments → #F8F5EF
Gold accent           → #C1AC5C
Gold dark (texte)     → #8B7830
Border                → rgba(0,0,0,0.06)
```

### Règles de la hero tile
- Photo gardien en `background-image` avec `opacity: 0.55`
- Gradient overlay : transparent haut → `rgba(10,10,12,0.96)` bas
- Badge gold en haut gauche, pill saison en haut droite
- Eyebrow gold + headline blanc 28px weight 900 + 3 stats séparées par dividers

---

## Les 5 patterns UI prioritaires

### 1. Home Screen Bento (référence Dream League Soccer + Apple Titanium)
Toute page d'accueil rôle (admin/coach/parent/enfant) :
- Grille asymétrique — tiles de tailles variées (pas une grille égale)
- **Pas de topbar** — bento plein écran immédiat
- Une tile hero visuelle (photo/illustration) obligatoire par dashboard
- Chaque case = visuel + titre court + indicateur chiffre

### 2. Card Joueur (référence FUT + Sorare)
- Background travaillé (dégradé, texture subtile)
- Photo/illustration du joueur découpée qui dépasse le haut de la carte
- Nom, position, 2-3 stats clés avec pictos
- Gold border pour les profils premium/avancés

### 3. Panel-in-Panel (référence FIFA Manager 14)
- Liste à gauche, fiche contextuelle qui s'ouvre à droite
- Jamais de navigation vers une nouvelle page pour une info rapide
- Slide-in depuis la droite, fond légèrement assombri

### 4. Terrain Data Viz (référence Fotmob/WhoScored)
- Schéma terrain vert standard pour les modules situationnels
- Points/zones cliquables pour les données décisionnelles
- Utilisé dans : analyse séance, fiche évaluation, module situationnel

### 5. Navigation Pictos (référence FM24 Apple Arcade)
- 5 icônes max dans la nav principale
- Picto + label court en dessous
- Active state = gold underline ou background gold léger

---

## Ambiance par rôle

| Rôle | Ambiance | Couleur accent |
|------|----------|----------------|
| Admin | Centre de commandement premium | Gold #C1AC5C |
| Coach | Vestiaire pro, focus performance | Bleu acier (à définir) |
| Enfant | Aventure, gamifié, badges, XP | Orange/vert dynamique |
| Parent | Rassurant, clair, informatif | Neutre beige/blanc |

---

## Ce que l'enfant doit ressentir
Ouvrir l'app = entrer dans son univers de jeu. Ses badges, sa progression, son avatar.
Chaque séance terminée = récompense visuelle. Pas un formulaire — une quête accomplie.

## Ce que le coach doit ressentir
Ouvrir l'app le matin avant une séance = centre de commandement. Il a tout sous la main,
les infos sont belles, il a envie de la préparer. Pas une corvée administrative.

## Ce que l'admin doit ressentir
Créer un groupe, assigner des enfants = c'est fun. Comme créer son équipe dans FUT.
Voir la progression de l'académie = fierté visuelle, pas un tableau Excel.

---

## Fichiers de références
Dossier : `_agents/design-references/`
- `01-manager-style/`     ← FM24, FIFA Manager 14, OSM captures
- `02-cards-collection/`  ← FUT, Sorare, LaLiga Fantasy captures
- `03-stats-data/`        ← SofaScore, Fotmob captures
- `04-gaming-arcade/`     ← Dream League Soccer, Score Hero captures
- `05-platforms-premium/` ← Premier League App captures
- `06-mes-captures/`      ← captures personnelles Jeremy
- `desktop-admin-bento-v2.html` ← **PROTOTYPE HTML VALIDÉ** — dashboard admin référence

---

## Typographie — Montserrat

> Décision validée Story 45.1 (2026-04-04) : Montserrat remplace Rajdhani (display/heading) et Geist (body).
> Une seule famille pour tout le texte UI — clarté premium, forte lisibilité, 5 poids distincts.

| Weight | Valeur | Usage dans l'app |
|--------|--------|-----------------|
| Black  | 900    | Display hero, stats clés (KPI, XP, scores) |
| Bold   | 700    | H1, H2, titres de cards, tile headers |
| SemiBold | 600  | H3, labels de section, badges |
| Medium | 500    | Corps texte important, sous-titres |
| Regular | 400   | Corps standard, descriptions, légendes |

**Cas particulier** : `typography.stat` conserve `Geist Mono` pour les chiffres tabulaires (présences, XP bars, compteurs) — chiffres à largeur fixe.

---

## Gamification visuelle

> Source de vérité dans `tokens.ts` — objet `gamification` (Story 45.1).

### XP System
- **Gains** : +10 pts par présence validée, +5 pts par exercice méthodologique complété
- **Affichage** : barre de progression horizontale, hauteur 8px, or AUREAK (#C1AC5C), fond gris (#E5E7EB)
- **Glow** : halo gold `rgba(193,172,92,0.4)` sur la barre active
- **Animation fill** : `0.6s cubic-bezier(0.4, 0, 0.2, 1)` — smooth ease

### Badges — États locked / unlocked
| État | Opacité | Filtre | Ombre |
|------|---------|--------|-------|
| Locked | 35% | `grayscale(100%)` | aucune |
| Unlocked | 100% | aucun | `0 0 8px rgba(193,172,92,0.5)` |

**Animation unlock** : spring bounce `0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` — scale 0 → 1.2 → 1

**Sizes** : sm=32px / md=48px / lg=64px

### Les 6 tiers de niveau

| Tier | Couleur | Label | XP min | XP max |
|------|---------|-------|--------|--------|
| Bronze   | `#CD7F32` | Bronze  | 0      | 499    |
| Argent   | `#9BA0A7` | Argent  | 500    | 1 499  |
| Or       | `#C1AC5C` | Or      | 1 500  | 3 499  |
| Platine  | `#60A5FA` | Platine | 3 500  | 6 999  |
| Diamant  | `#A78BFA` | Diamant | 7 000  | 9 999  |
| Légende  | `#F97316` | Légende | 10 000 | ∞      |

**Level up animation** : flash gold `0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`

---

## Roadmap redesign séquentiel

> Ordre d'implémentation des redesign screens — chaque étape s'appuie sur la précédente.

1. **Dashboard admin** (bento tiles, hero card, KPIs) — Epic 42
2. **Séances** (liste, planning, fiche séance avec méthodologie) — Epic 43
3. **Présences** (fiche présence, QR/manuel, évaluation inline) — Epic 44
4. **Évaluations** (fiches joueur, radar stats, historique progression) — Epic 45+

Chaque redesign consomme les tokens `gamification`, `transitions.slide`, et `typography` Montserrat définis dans Story 45.1.

---

*Dernière mise à jour : 2026-04-04*
*À relire au début de chaque session design*
