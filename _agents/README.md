# Système d'Agents Autonomes — Aureak

> Version : 1.0
> Dernière mise à jour : 2026-03-31

---

## Vue d'ensemble

Ce dossier contient le système de contrôle qualité automatisé du projet Aureak.
Il s'intègre dans le pipeline BMAD → Implémentation → Contrôle → Production.

**Principe fondamental** : les agents analysent et rapportent. L'humain décide et valide.

---

## Structure

```
_agents/
├── README.md               ← ce fichier
├── config/
│   ├── agent-config.md     ← stack, règles d'architecture, périmètre des agents
│   └── thresholds.md       ← définition BLOCKER / WARNING / INFO
├── prompts/
│   ├── code-reviewer.md    ← Gate 1 : code quality & architecture
│   ├── security-auditor.md ← Gate 1 : sécurité, RLS, données sensibles
│   ├── migration-validator.md ← Gate 1 : migrations Supabase
│   ├── ux-auditor.md       ← Gate 2 : Design System & UX patterns
│   └── bug-hunter.md       ← Gate 2 : edge cases & synthèse finale
└── templates/
    ├── report-template.md  ← format standard des rapports
    └── gate-checklist.md   ← checklist de validation humaine

_qa/
├── reports/                ← rapports générés par les agents
├── gates/
│   ├── pre-pr/             ← checklists Gate 1 complétées
│   └── pre-deploy/         ← checklists Gate 2 complétées
└── summary.md              ← état courant de tous les gates
```

---

## Pipeline

```
Story ready-for-dev
        ↓
  Implémentation
        ↓
  ┌─ GATE 1 ────────────────────────┐
  │  Code Reviewer (obligatoire)    │
  │  Security Auditor (si applicable)│
  │  Migration Validator (si migration)│
  └─────────────────────────────────┘
        ↓
  Validation humaine + PR
        ↓
  ┌─ GATE 2 ────────────────────────┐
  │  UX Auditor                     │
  │  Bug Hunter (synthèse finale)   │
  └─────────────────────────────────┘
        ↓
  Validation humaine finale
        ↓
      PRODUCTION
```

---

## Utilisation

### Lancer un agent dans Claude Code

1. Ouvrir Claude Code dans le projet
2. Copier le prompt depuis `_agents/prompts/{agent}.md`
3. Remplacer les variables `{STORY_ID}`, `{LISTE_DES_FICHIERS}`, etc.
4. Lancer l'agent — le rapport est généré dans `_qa/reports/`
5. Lire le rapport et compléter la checklist `_agents/templates/gate-checklist.md`
6. Copier la checklist complétée dans `_qa/gates/pre-pr/` ou `_qa/gates/pre-deploy/`

### Ordre recommandé par gate

**Gate 1** :
1. Code Reviewer (toujours)
2. Migration Validator (si nouveau fichier `.sql`)
3. Security Auditor (si auth/RLS/données sensibles)

**Gate 2** :
1. UX Auditor (toujours)
2. Bug Hunter (toujours — lit aussi les rapports du Gate 1)

---

## Agents

| Agent | Gate | Déclenchement | Prompt |
|-------|------|---------------|--------|
| Code Reviewer | 1 | Toujours | `prompts/code-reviewer.md` |
| Security Auditor | 1 | Auth/RLS/data sensible | `prompts/security-auditor.md` |
| Migration Validator | 1 | Nouveau `.sql` | `prompts/migration-validator.md` |
| UX Auditor | 2 | Toujours (fichiers `.tsx`) | `prompts/ux-auditor.md` |
| Bug Hunter | 2 | Toujours (synthèse finale) | `prompts/bug-hunter.md` |

---

## Règles non-négociables

1. **Zéro BLOCKER** pour franchir un gate
2. **Validation humaine obligatoire** à chaque gate — les agents ne peuvent pas approuver
3. **Warnings du Gate 1** non traités = BLOCKERS automatiques au Gate 2
4. **Summary.md** mis à jour après chaque story
5. **Jamais d'agent en production** directement — toujours via validation humaine

---

## Roadmap

- **V1 (actuelle)** : 5 agents, déclenchement manuel, rapports markdown
- **V2** : hooks Claude Code pour déclenchement automatique post-edit
- **V3** : agent Regression Detector + script de synthèse automatique
