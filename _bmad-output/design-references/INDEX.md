# Design References — Index

> Source de vérité pour le matching automatique PNG ↔ routes.
> Utilisé par : story-factory.md (Étape 1), design-critic.md (Étape 0).

---

| PNG | Routes couvertes | Modules | Mots-clés de détection |
|-----|-----------------|---------|------------------------|
| `dashboard-redesign.png` | `/(admin)` | Dashboard admin — bento 3 colonnes, sessions du jour, performance sites, classement XP, quêtes, score académie | dashboard, bento, hero, KPI, sessions du jour, classement |
| `Activites seances-redesign.png` | `/(admin)/seances`, `/(admin)/activites` | Liste séances — stat cards, tableau STATUS/DATE/GROUPE/COACH/PRÉSENCE/SAISON/FAUVE/ORDRE, filtres saison/implantation/groupe/joueur | séances, activités, tableau séances, stat cards séances |
| `Activites presences-redesign.png` | `/(admin)/presences` | Liste présences — stat cards, tableau présences par joueur | présences, liste présences, feuille de présence |
| `Activites evaluations-redesign.png` | `/(admin)/evaluations` | Liste évaluations — Note Moyenne, Évals ce mois, Progression Technique, tableau joueur/notes/commentaire | évaluations, notes, tableau évaluations |
| `Methodologie entrainement-redesign.png` | `/(admin)/methodologie/seances`, `/(admin)/methodologie` | Hub méthodologie — 6 stat cards, tableau MÉTHODE/NOM/TYPE/THÈMES/SITUATIONS/PAF/STATUT/DONE | méthodologie, entraînements, tableau méthodologie |

---

## Règle de matching

Pour une story UI, le SM agent :
1. Lit ce fichier
2. Compare le module de la story aux "Mots-clés de détection" de chaque ligne
3. Si match → le PNG correspondant est la référence visuelle de vérité
4. Si aucun match → pas de PNG disponible → audit polish uniquement

---

## Ajouter un nouveau PNG de référence

Quand Jeremy fournit une nouvelle image de redesign :
1. La placer dans `_bmad-output/design-references/`
2. Ajouter une ligne dans ce tableau avec routes, modules et mots-clés
