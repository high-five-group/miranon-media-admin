#!/usr/bin/env bash
# scripts/kontrollera-bilagor-bucket.sh — read-only konvergenskontroll för
# Storage-bucketen "bilagor", anropad av fas4-prod-deploy.sh (TASK-308).
#
# VARFÖR EGEN FIL, INTE INLINE I fas4-prod-deploy.sh: det skriptet är ett
# top-level-skript med `set -euo pipefail` och omedelbar argumentparsning —
# att källa in det för att testa en enskild funktion i isolering skulle köra
# HELA skriptet (preflight, git-kontroller, ev. länkning). Samma mönster som
# `deploy-prod-functions.sh`: en egen, avgränsad fil som fas4-prod-deploy.sh
# anropar som SUBPROCESS, testbar för sig utan den risken.
#
# ANVÄNDNING:
#   bash scripts/kontrollera-bilagor-bucket.sh <project-ref>
#
# Hämtar service-role-nyckeln engångs via `supabase projects api-keys`
# (LEVER ALDRIG PÅ DISK, se provision-attachments-bucket.mjs § header) och
# anropar den filens read-only `--kontrollera`-läge.
#
# ENV-OVERRIDE (test-isolering, samma mönster som FUNCTIONS_DIR/
# ALLOWLIST_FILE i deploy-prod-functions.sh):
#   KONTROLL_CMD   Ersätter HELA nyckel-hämtning+node-anropet med ett eget
#                  kommando (får <ref> som $1). Testsviten
#                  (test-fas4-prod-deploy.sh) använder detta för att
#                  simulera "konvergerad" respektive "saknas/avviker" utan
#                  riktig Supabase-åtkomst eller prod-ref i kommandoraden.
#
# Exit 0 = bucketen finns och matchar BUCKET_DESIRED_CONFIG.
# Exit 1 = bucketen saknas, avviker, nyckeln kunde inte hämtas, eller ref
#          saknas — FAIL-CLOSED, samma doktrin som resten av fas4-sviten.
#
# Källa: TASK-308 · scripts/provision-attachments-bucket.mjs
#        (§ KONTROLLERA-LÄGET) · scripts/fas4-prod-deploy.sh ·
#        scripts/deploy-prod-functions.sh (formmall för env-override)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REF="${1:-}"

if [[ -z "${REF}" ]]; then
    echo "❌ Project-ref saknas (anges explicit, aldrig ur config)." >&2
    exit 1
fi

if [[ -n "${KONTROLL_CMD:-}" ]]; then
    # shellcheck disable=SC2086  # medveten word-splitting: env-overriden är
    # en kommandorad ("cmd arg1 arg2"), inte en enda token — test-isolering,
    # se test-fas4-prod-deploy.sh.
    ${KONTROLL_CMD} "${REF}"
    exit $?
fi

NYCKEL="$(npx supabase projects api-keys --project-ref "${REF}" -o json 2> /dev/null \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        try {
          const k = JSON.parse(s).find((x) => x.name === "service_role");
          if (k) process.stdout.write(k.api_key);
        } catch { /* tom NYCKEL nedan → guarden fäller med eget skäl */ }
      })')"

if [[ -z "${NYCKEL}" ]]; then
    echo "❌ Kunde inte hämta service-role-nyckeln för ${REF} (inloggad? \`npx supabase login\`)." >&2
    exit 1
fi

SUPABASE_URL="https://${REF}.supabase.co" SUPABASE_SERVICE_ROLE_KEY="${NYCKEL}" \
    node "${SCRIPT_DIR}/provision-attachments-bucket.mjs" --kontrollera "${REF}"
exit $?
