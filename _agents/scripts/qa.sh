#!/bin/bash
# qa.sh — Gestionnaire QA Aureak
# V2 : génère les blocs LAUNCH (manuel → Claude Code)
# V3 : lance les agents automatiquement via l'API Claude
#
# Usage :
#   qa scope  <story-id>   crée le fichier scope
#   qa gate1  <story-id>   génère bloc LAUNCH Gate 1 (clipboard)
#   qa gate2  <story-id>   génère bloc LAUNCH Gate 2 (clipboard)
#   qa run gate1 <story-id>  lance tous les agents Gate 1 automatiquement (V3)
#   qa run gate2 <story-id>  lance tous les agents Gate 2 automatiquement (V3)
#   qa summary               régénère _qa/summary.md automatiquement (V3)

set -e

REPO_ROOT="/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak"
QA_REPORTS="$REPO_ROOT/_qa/reports"
QA_GATES_PR="$REPO_ROOT/_qa/gates/pre-pr"
QA_GATES_DEPLOY="$REPO_ROOT/_qa/gates/pre-deploy"
DATE=$(date +%Y-%m-%d)

# ─── Couleurs ────────────────────────────────────────────────
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RED="\033[31m"
RESET="\033[0m"

# ─── Validation des arguments ─────────────────────────────────
GATE=${1:-}
STORY_ID=${2:-}

# ─── Commandes V3 interceptées avant la validation d'arguments ───────────────

# qa run gate1|gate2 <story-id>
if [[ "$GATE" == "run" ]]; then
  RUN_GATE=${2:-}
  RUN_STORY=${3:-}
  if [[ -z "$RUN_GATE" || -z "$RUN_STORY" ]]; then
    echo -e "${RED}Usage : qa run <gate1|gate2> <story-id>${RESET}"
    exit 1
  fi
  echo -e "${CYAN}🤖 Lancement orchestrateur V3 — $RUN_GATE / story-$RUN_STORY${RESET}"
  python3 "$REPO_ROOT/_agents/scripts/orchestrator.py" "$RUN_GATE" "$RUN_STORY"
  exit $?
fi

# qa summary
if [[ "$GATE" == "summary" ]]; then
  echo -e "${CYAN}📊 Génération summary.md...${RESET}"
  python3 "$REPO_ROOT/_agents/scripts/summary-gen.py"
  exit $?
fi

# ─── Validation des arguments (mode V2 manuel) ────────────────────────────────
if [[ -z "$GATE" || -z "$STORY_ID" ]]; then
  echo -e "${BOLD}Usage (V2 — blocs manuels):${RESET}"
  echo "  qa gate1 <story-id>          → génère bloc Gate 1 (clipboard)"
  echo "  qa gate2 <story-id>          → génère bloc Gate 2 (clipboard)"
  echo "  qa scope <story-id>          → crée le fichier scope"
  echo ""
  echo -e "${BOLD}Usage (V3 — automatique):${RESET}"
  echo "  qa run gate1 <story-id>      → lance tous les agents Gate 1 via API Claude"
  echo "  qa run gate2 <story-id>      → lance tous les agents Gate 2 via API Claude"
  echo "  qa summary                   → régénère _qa/summary.md"
  echo ""
  echo "Exemple : qa run gate1 20-1"
  exit 1
fi

# ─── Détection des fichiers modifiés via git ──────────────────
detect_files() {
  cd "$REPO_ROOT"
  # Fichiers modifiés (staged + unstaged + untracked pertinents)
  git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|sql)$' || true
  git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx|sql)$' || true
}

ALL_FILES=$(detect_files | sort -u)
TSX_FILES=$(echo "$ALL_FILES" | grep -E '\.tsx$' || true)
SQL_FILES=$(echo "$ALL_FILES" | grep -E '\.sql$' || true)
TS_FILES=$(echo "$ALL_FILES" | grep -E '\.ts$' | grep -v '\.tsx$' || true)

# ─── Détection sécurité (heuristique) ────────────────────────
SECURITY_SIGNALS=$(echo "$ALL_FILES" | grep -E '(migrations|functions|api-client|auth|rls)' || true)
NEEDS_SECURITY=""
if [[ -n "$SECURITY_SIGNALS" ]]; then
  NEEDS_SECURITY="oui"
fi

# ─── Détection story path ─────────────────────────────────────
STORY_PATH=$(find "$REPO_ROOT/_bmad-output/implementation-artifacts" -name "story-${STORY_ID}.md" 2>/dev/null | head -1 || true)
if [[ -z "$STORY_PATH" ]]; then
  STORY_PATH="_bmad-output/implementation-artifacts/story-${STORY_ID}.md  ← VÉRIFIER CE CHEMIN"
fi

# ─── Fonction : formater une liste de fichiers ────────────────
format_file_list() {
  local files="$1"
  if [[ -z "$files" ]]; then
    echo "  (aucun fichier détecté — vérifier git diff)"
  else
    echo "$files" | while read -r f; do
      echo "- $f"
    done
  fi
}

# ─── Commande : scope ─────────────────────────────────────────
if [[ "$GATE" == "scope" ]]; then
  SCOPE_FILE="$QA_GATES_PR/story-${STORY_ID}-scope.md"
  if [[ -f "$SCOPE_FILE" ]]; then
    echo -e "${YELLOW}⚠️  Scope déjà existant : $SCOPE_FILE${RESET}"
    exit 0
  fi

  cat > "$SCOPE_FILE" << SCOPE_EOF
# Scope — Story ${STORY_ID}

**Story** : ${STORY_ID}
**Date début** : ${DATE}
**Branche** : \`feature/story-${STORY_ID}-slug\`

---

## Fichiers modifiés

### Fichiers TypeScript / TSX
$(format_file_list "$TSX_FILES
$TS_FILES")

### Migrations SQL
$(format_file_list "$SQL_FILES")

---

## Agents à déclencher

- [x] Code Reviewer — toujours
- [$([ -n "$SQL_FILES" ] && echo "x" || echo " ")] Migration Validator — $([ -n "$SQL_FILES" ] && echo "OUI (migration détectée)" || echo "non")
- [$([ -n "$NEEDS_SECURITY" ] && echo "x" || echo " ")] Security Auditor — $([ -n "$NEEDS_SECURITY" ] && echo "OUI (auth/migrations détectées)" || echo "à confirmer")

---

## Notes
SCOPE_EOF

  echo -e "${GREEN}✅ Scope créé : $SCOPE_FILE${RESET}"
  exit 0
fi

# ─── Génération du bloc LAUNCH ────────────────────────────────
generate_gate1() {
  local all_files="$1"

  OUTPUT=""
  OUTPUT+="────────────────────────────────────────────────\n"
  OUTPUT+="${BOLD}GATE 1 — Story ${STORY_ID} — ${DATE}${RESET}\n"
  OUTPUT+="────────────────────────────────────────────────\n\n"

  # Agent 1 : Code Reviewer
  OUTPUT+="${CYAN}── Agent 1 : Code Reviewer ──────────────────────${RESET}\n"
  OUTPUT+="Lis le fichier \`_agents/prompts/code-reviewer.md\` pour les instructions.\n\n"
  OUTPUT+="Story analysée : story-${STORY_ID}\n"
  OUTPUT+="Story path : ${STORY_PATH}\n\n"
  OUTPUT+="Fichiers modifiés :\n"
  OUTPUT+="$(format_file_list "$all_files")\n\n"
  OUTPUT+="Produis le rapport dans : _qa/reports/${DATE}_story-${STORY_ID}_code-review.md\n\n"

  # Agent 2 : Migration Validator (si SQL)
  if [[ -n "$SQL_FILES" ]]; then
    OUTPUT+="${CYAN}── Agent 2 : Migration Validator (SQL détecté) ───${RESET}\n"
    OUTPUT+="Lis le fichier \`_agents/prompts/migration-validator.md\` pour les instructions.\n\n"
    OUTPUT+="Migrations à valider :\n"
    OUTPUT+="$(format_file_list "$SQL_FILES")\n\n"
    OUTPUT+="Story associée : story-${STORY_ID}\n"
    OUTPUT+="Lis toutes les migrations précédentes + packages/types/src/entities.ts + enums.ts\n"
    OUTPUT+="Produis le rapport dans : _qa/reports/${DATE}_migration-validator.md\n\n"
  else
    OUTPUT+="${YELLOW}── Agent 2 : Migration Validator → NON requis (aucun .sql détecté)${RESET}\n\n"
  fi

  # Agent 3 : Security Auditor
  if [[ -n "$NEEDS_SECURITY" ]]; then
    OUTPUT+="${CYAN}── Agent 3 : Security Auditor (signaux détectés) ─${RESET}\n"
    OUTPUT+="Lis le fichier \`_agents/prompts/security-auditor.md\` pour les instructions.\n\n"
    OUTPUT+="Fichiers à analyser :\n"
    OUTPUT+="$(format_file_list "$SECURITY_SIGNALS")\n\n"
    OUTPUT+="Story associée : story-${STORY_ID}\n"
    OUTPUT+="Produis le rapport dans : _qa/reports/${DATE}_story-${STORY_ID}_security.md\n\n"
  else
    OUTPUT+="${YELLOW}── Agent 3 : Security Auditor → à confirmer manuellement${RESET}\n\n"
  fi

  echo -e "$OUTPUT"
}

generate_gate2() {
  local tsx_files="$1"
  local all_files="$2"

  OUTPUT=""
  OUTPUT+="────────────────────────────────────────────────\n"
  OUTPUT+="${BOLD}GATE 2 — Story ${STORY_ID} — ${DATE}${RESET}\n"
  OUTPUT+="────────────────────────────────────────────────\n\n"

  # Agent 4 : UX Auditor
  OUTPUT+="${CYAN}── Agent 4 : UX Auditor ──────────────────────────${RESET}\n"
  OUTPUT+="Lis le fichier \`_agents/prompts/ux-auditor.md\` pour les instructions.\n\n"
  OUTPUT+="Fichiers .tsx à analyser :\n"
  OUTPUT+="$(format_file_list "$tsx_files")\n\n"
  OUTPUT+="Consulte packages/theme/tokens.ts et ux-design-specification.md.\n"
  OUTPUT+="Produis le rapport dans : _qa/reports/${DATE}_story-${STORY_ID}_ux.md\n\n"

  # Agent 5 : Bug Hunter
  OUTPUT+="${CYAN}── Agent 5 : Bug Hunter (synthèse finale) ────────${RESET}\n"
  OUTPUT+="Lis le fichier \`_agents/prompts/bug-hunter.md\` pour les instructions.\n\n"
  OUTPUT+="Story analysée : story-${STORY_ID}\n"
  OUTPUT+="Story path : ${STORY_PATH}\n\n"
  OUTPUT+="Fichiers modifiés :\n"
  OUTPUT+="$(format_file_list "$all_files")\n\n"
  OUTPUT+="Rapports Gate 1 à lire :\n"
  OUTPUT+="- _qa/reports/${DATE}_story-${STORY_ID}_code-review.md\n"
  OUTPUT+="- _qa/reports/${DATE}_story-${STORY_ID}_security.md  (si existant)\n\n"
  OUTPUT+="Produis le rapport dans : _qa/reports/${DATE}_story-${STORY_ID}_bugs.md\n"
  OUTPUT+="Mets à jour _qa/summary.md avec le verdict final.\n\n"

  echo -e "$OUTPUT"
}

# ─── Exécution ────────────────────────────────────────────────
if [[ -z "$ALL_FILES" ]]; then
  echo -e "${RED}⚠️  Aucun fichier .ts/.tsx/.sql modifié détecté via git diff HEAD.${RESET}"
  echo "Vérifie que tu es sur la bonne branche ou que tes modifications sont enregistrées."
  echo ""
  echo "Tu peux quand même utiliser _agents/LAUNCH.md pour un lancement manuel."
  exit 1
fi

echo -e "${GREEN}✅ ${#ALL_FILES} fichiers détectés — Story ${STORY_ID}${RESET}\n"

BLOCK=""
if [[ "$GATE" == "gate1" ]]; then
  BLOCK=$(generate_gate1 "$ALL_FILES")
elif [[ "$GATE" == "gate2" ]]; then
  BLOCK=$(generate_gate2 "$TSX_FILES" "$ALL_FILES")
else
  echo -e "${RED}Gate inconnu : $GATE. Utiliser 'gate1', 'gate2' ou 'scope'.${RESET}"
  exit 1
fi

echo -e "$BLOCK"

# ─── Copie dans le clipboard (macOS) ─────────────────────────
PLAIN_BLOCK=$(echo -e "$BLOCK" | sed 's/\x1b\[[0-9;]*m//g')  # strip ANSI
echo "$PLAIN_BLOCK" | pbcopy 2>/dev/null && \
  echo -e "${GREEN}📋 Bloc copié dans le clipboard — coller directement dans Claude Code.${RESET}" || \
  echo -e "${YELLOW}ℹ️  pbcopy non disponible — copier le bloc ci-dessus manuellement.${RESET}"
