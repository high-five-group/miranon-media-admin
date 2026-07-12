#!/usr/bin/env bash
# check-staging-bundle.sh — verifierar att dist/ är ett STAGING-bygge (task-10 AC 1).
#
# Fälla 1-klassen (T76-pilot, task-8.1): `npm run build` utan mode-flagga bakar
# in incheckade .env.production → bundeln pekar på PROD-instansen och lokal
# browser-verifiering mot staging ger login-400. Detta skript är den mekaniska
# grinden mellan bygge och servering: staging-referensen SKA förekomma i
# dist/assets, prod-referensen SKA INTE göra det.
#
# Körs via `npm run verify:staging-bundle`, och som steg 2 i kedjan
# `npm run test:preview:staging` (build:staging → denna grind → Playwright).
# Runbook: docs/reference/staging-verifiering-runbook.md.
#
# Greppen matchar FULLA HOSTAR (<ref>.supabase.co), aldrig nakna projekt-refs:
# prod-refen ensam ('lvjsfnphlauldxqlncpl') förekommer LEGITIMT i varje bundle
# som jämförelsekonstant (src/lib/env-coherence.ts PROD_SUPABASE_REF, ADR-061
# Pelare 2-runtime-grinden) — en ref-grep hade fällt även korrekta
# staging-byggen (empiriskt bevisat vid task-10-implementationen 2026-07-12).
# Anrops-hostar bakas däremot in som fulla URL:er ur mode-filens
# VITE_SUPABASE_URL — full-host-grep skiljer miljöerna åt exakt.
#
# Host-källor (stabila per miljö, ADR-050/ADR-061):
#   STAGING_HOST — .env.staging VITE_SUPABASE_URL
#   PROD_HOST    — .env.production VITE_SUPABASE_URL

set -euo pipefail

STAGING_HOST="pqtshyierkdgwdnxuirz.supabase.co"
PROD_HOST="lvjsfnphlauldxqlncpl.supabase.co"
ASSETS_DIR="dist/assets"

if [[ ! -d "${ASSETS_DIR}" ]]; then
    echo "FEL: ${ASSETS_DIR} saknas — bygg först: npm run build:staging" >&2
    exit 1
fi

if ! grep -rqF "${STAGING_HOST}" "${ASSETS_DIR}"; then
    echo "FEL: staging-hosten (${STAGING_HOST}) saknas i ${ASSETS_DIR}." >&2
    echo "     Bundeln är INTE ett staging-bygge — kör: npm run build:staging" >&2
    exit 1
fi

if grep -rqF "${PROD_HOST}" "${ASSETS_DIR}"; then
    echo "FEL: prod-hosten (${PROD_HOST}) förekommer i ${ASSETS_DIR}." >&2
    echo "     Bundeln läcker prod — bygg om: npm run build:staging" >&2
    exit 1
fi

echo "OK: ${ASSETS_DIR} är ett staging-bygge (staging-host funnen, prod-host frånvarande)."
