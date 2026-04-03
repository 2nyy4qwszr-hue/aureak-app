#!/bin/bash
# story.sh — Story Factory Aureak
# Usage :
#   story "ta décision en français"
#   story "ta décision" 19          (avec numéro d'epic)
#
# Setup (une seule fois dans ~/.zshrc) :
#   alias story="/Users/jeremydevriendt/Documents/Claude-projets/Application\ Aureak/_agents/scripts/story.sh"

set -e

REPO_ROOT="/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak"
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

DECISION="${1:-}"
EPIC="${2:-}"

if [[ -z "$DECISION" ]]; then
  echo -e "${BOLD}Story Factory — Aureak${RESET}"
  echo ""
  echo "Usage :"
  echo "  story \"ta décision en français\""
  echo "  story \"ta décision\" 19        (avec epic)"
  echo ""
  echo "Exemples :"
  echo "  story \"Ajouter un bouton créer séance sur le dashboard admin\""
  echo "  story \"La card joueur doit afficher la photo avec le personnage qui dépasse\" 18"
  exit 1
fi

EPIC_LINE=""
if [[ -n "$EPIC" ]]; then
  EPIC_LINE="Epic de rattachement : ${EPIC}"
else
  EPIC_LINE="Epic de rattachement : (à déterminer)"
fi

PROMPT="Lis le fichier \`_agents/prompts/story-factory.md\` pour les instructions complètes.

Décision validée :
\"${DECISION}\"

${EPIC_LINE}

Lis d'abord architecture.md, les migrations existantes et les stories existantes.
Produis la story dans : _bmad-output/implementation-artifacts/"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}Story Factory${RESET} — prêt à coller dans Claude Code"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo "$PROMPT"
echo ""

echo "$PROMPT" | pbcopy 2>/dev/null && \
  echo -e "${GREEN}📋 Copié dans le clipboard — colle directement dans Claude Code.${RESET}" || \
  echo -e "${YELLOW}ℹ️  Copier le bloc ci-dessus et coller dans Claude Code.${RESET}"
