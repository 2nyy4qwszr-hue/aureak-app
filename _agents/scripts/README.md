# Scripts QA — Aureak

## qa.sh

Génère automatiquement le bloc LAUNCH pré-rempli pour les agents, en lisant `git diff`.
Le bloc est copié dans le clipboard — tu colles directement dans Claude Code.

### Installation (une seule fois)

```bash
# Depuis la racine du repo
alias qa="/Users/jeremydevriendt/Documents/Claude-projets/Application\ Aureak/_agents/scripts/qa.sh"
```

Ajouter cette ligne dans ton `~/.zshrc` pour que l'alias persiste.

### Usage

```bash
# Créer le fichier scope au début de l'implémentation
qa scope 20-1

# Générer le bloc Gate 1 (après implémentation)
qa gate1 20-1

# Générer le bloc Gate 2 (après preview)
qa gate2 20-1
```

### Ce que fait le script

1. Lit `git diff --name-only HEAD` → détecte les fichiers `.ts` / `.tsx` / `.sql` modifiés
2. Identifie automatiquement si Migration Validator est nécessaire (fichier `.sql` présent)
3. Identifie automatiquement si Security Auditor est recommandé (migrations / api-client / auth)
4. Génère le bloc LAUNCH complet avec les fichiers pré-remplis
5. Copie dans le clipboard macOS (`pbcopy`)

### Workflow complet

```
Début story          →  qa scope 20-1     (crée _qa/gates/pre-pr/story-20-1-scope.md)
Implémentation       →  coder normalement
Fin implémentation   →  qa gate1 20-1     (génère + copie → coller dans Claude Code)
Rapport reçu         →  lire _qa/reports/ → compléter gate-checklist.md
PR créée             →  preview testée
Avant deploy         →  qa gate2 20-1     (génère + copie → coller dans Claude Code)
Rapport reçu         →  lire _qa/reports/ → mettre à jour _qa/summary.md
```
