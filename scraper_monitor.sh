#!/usr/bin/env bash
# Monitor live EGX API health (static egx_*.json files are deprecated).
set -euo pipefail
WORKSPACE="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3000}"
LOG_FILE="${EGX_SCRAPER_LOG:-/tmp/egx_scraper.log}"

echo "EGX live API check"
echo "===================================================="
echo "BASE_URL: $BASE_URL"
echo ""

echo "Cron / scheduler:"
if crontab -l 2>/dev/null | grep -q "run_scraper.sh"; then
  echo "Active entries:"
  crontab -l 2>/dev/null | grep "run_scraper.sh" || true
else
  echo "No crontab entries matching run_scraper.sh (optional)"
fi
echo ""

echo "Last log lines ($LOG_FILE):"
if [[ -f "$LOG_FILE" ]]; then
  tail -5 "$LOG_FILE"
else
  echo "(no log yet)"
fi
echo ""

echo "GET /api/egx-stocks:"
if curl -sfS "${BASE_URL}/api/egx-stocks" | head -c 120; then
  echo ""
  echo "… OK"
else
  echo "FAILED (is the app running at BASE_URL?)"
fi
echo ""

echo "GET /api/egx-recommendations:"
if curl -sfS "${BASE_URL}/api/egx-recommendations" | head -c 120; then
  echo ""
  echo "… OK"
else
  echo "FAILED"
fi
echo ""

echo "Commands:"
echo "  Warm caches:  BASE_URL=$BASE_URL bash $WORKSPACE/run_scraper.sh"
echo "  Follow log:   tail -f $LOG_FILE"
