# QA Blockers — Epic 104

> Bugs bloquants release identifiés pendant les passes QA Epic 104.
> Mis à jour : 2026-04-24 (passe 104.1).

## Blockers actifs

_Aucun blocker actif au 2026-04-24._

## Warnings (non-bloquants release)

### [104.1 #1] Chip "⊞ Filtres" inerte sur `/activites`
- **Découvert** : 2026-04-24 (story 104.1)
- **Devices** : tous (mobile + tablet)
- **Route** : `/activites` onglet SÉANCES
- **Repro** : tap chip "⊞ Filtres" → aucune action, pas de bottom sheet
- **Attendu** : bottom sheet filtres avancés (Epic 102.4)
- **Fix owner** : à assigner — story corrective 104.1a

### [104.1 #2] Popovers topbar mutuellement non-exclusifs
- **Découvert** : 2026-04-24 (story 104.1)
- **Devices** : mobile
- **Repro** : ouvrir dropdown profil puis tap search → search ne s'ouvre pas (ferme profil)
- **Fix owner** : à assigner — story corrective 104.1a

### [104.1 #3] PWA install banner masque FAB sur iPhone SE
- **Découvert** : 2026-04-24 (story 104.1)
- **Devices** : iPhone SE (petit écran)
- **Fix** : offset FAB safe-area + banner compact ou fermeture plus agressive
- **Fix owner** : à assigner — story corrective 104.1a
