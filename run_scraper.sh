#!/usr/bin/env bash
# Warm / sanity-check live EGX routes (no static JSON). Requires dev server or deployed URL.
set -euo pipefail
cd "$(dirname "$0")"
BASE_URL="${BASE_URL:-http://localhost:3000}"
LOG_FILE="${EGX_SCRAPER_LOG:-/tmp/egx_scraper.log}"

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

curl -sfS "${BASE_URL}/api/egx-stocks" | head -c 200 >/dev/null
echo "$(stamp) egx-stocks OK" >>"$LOG_FILE"

curl -sfS "${BASE_URL}/api/egx-recommendations" | head -c 200 >/dev/null
echo "$(stamp) egx-recommendations OK" >>"$LOG_FILE"

echo "OK — touched ${BASE_URL}/api/egx-stocks and /api/egx-recommendations (see $LOG_FILE)"
