#!/usr/bin/env bash
# check-mallparitet.sh — TASK-309.4, ADR-125 § Beslut 4.
#
# CI-grind: fäller om de genererade TS-strängmodulerna i
# supabase/functions/_shared/mallar/ (html/css/typsnitt/bilder) inte
# längre är byte-identiska (efter avkodning) mot deras källa i
# docs/mallar/bilagor/ och public/fonts/bilagor/.
#
# EN generator, TVÅ lägen — ingen fjärde handhållen kopia av
# jämförelselogiken (samma "--kontrollera/--deploya"-disciplin som
# scripts/fas4-prod-deploy.sh). Hela grinden ÄR
# `node scripts/synka-bilagemallar.mjs --check`; detta skript är en tunn
# wrapper så ci.yml:s steg har ett stabilt, namngivet kommando att peka på.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "${SCRIPT_DIR}/synka-bilagemallar.mjs" --check
