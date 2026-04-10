#!/bin/bash
# Preflight check — ensures dev server + Playwright are ready
# Called as a hook before Skill tool calls (morning, patrol, go, feedback)

PROJECT_DIR="/Users/jeremydevriendt/Documents/Claude-projets/Application Aureak"
LOG="/tmp/aureak-dev.log"

# --- 1. Dev server (localhost:8081) ---
# Chercher le port actif (8081 ou 8082)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:8081 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:8082 2>/dev/null || echo "000")
fi

if [ "$HTTP_CODE" != "200" ]; then
  # Check if turbo is already starting
  if pgrep -f "turbo.*dev.*web" > /dev/null 2>&1; then
    echo "⏳ Dev server already starting (PID $(pgrep -fo 'turbo.*dev.*web'))" >&2
  else
    echo "🚀 Starting dev server (localhost:8081)..." >&2
    cd "$PROJECT_DIR/aureak" && nohup npx turbo dev --filter=@aureak/web > "$LOG" 2>&1 &
    echo "   PID=$! — log: $LOG" >&2
  fi
fi

# --- 2. Playwright browser ---
BROWSER_DIR="$HOME/Library/Caches/ms-playwright"
if [ ! -d "$BROWSER_DIR/chromium-"* ] 2>/dev/null; then
  echo "🔧 Installing Playwright browser..." >&2
  npx @playwright/mcp install-browser chrome-for-testing > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "   ✅ Playwright browser installed" >&2
  else
    echo "   ⚠️ Playwright install failed (non-blocking)" >&2
  fi
fi

exit 0
