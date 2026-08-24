#!/usr/bin/env bash
# scripts/deploy-prod-functions.sh
#
# FAIL-CLOSED prod-deploy av Supabase Edge Functions.
#
# Deployar ENDAST funktioner som står i .prod-functions-allowlist.conf till
# prod. En funktion under supabase/functions/ som INTE är allowlistad deployas
# ALDRIG — så en framtida test-*-bakdörr (t.ex. test-auth) aldrig når prod för
# att någon glömde blocklista den. Ersätter det farliga `supabase functions
# deploy` (utan namn = deployar ALLA funktioner inkl. test-*).
#
# Detta är repots deploy-väg idag: deploy är manuell (ingen CI-pipeline).
# Skriptet är spärren som en framtida deploy-automatik ska respektera — bygg
# inte en CI-deploy-pipeline runt det utan ett eget beslut.
#
# Användning:
#   bash scripts/deploy-prod-functions.sh --list
#       Visar deploy-setet + exkluderade funktioner. Deployar INGET.
#   bash scripts/deploy-prod-functions.sh --project-ref <prod-ref>
#       Deployar varje allowlistad funktion till angivet projekt.
#
# Env-override (för test-isolering): FUNCTIONS_DIR, ALLOWLIST_FILE.
#
# Exit 0 vid lyckad list/deploy. Exit 1 vid saknad allowlist, allowlistad
# funktion som saknas på disk, eller saknad/ogiltig användning.
#
# Källa: docs/decisions/ADR-050-isolerad-staging-miljo.md (steg 2) +
#        tasks/lessons.md L115 (Fas 7-skuld).
# Etablerad: Session 19 (2026-06-13)

set -euo pipefail

FUNCTIONS_DIR="${FUNCTIONS_DIR:-supabase/functions}"
ALLOWLIST_FILE="${ALLOWLIST_FILE:-.prod-functions-allowlist.conf}"

usage() {
    cat <<'EOF'
Användning:
  scripts/deploy-prod-functions.sh --list
  scripts/deploy-prod-functions.sh --project-ref <prod-ref>

  --list, --dry-run     Visa deploy-set + exkluderade. Deployar inget.
  --project-ref <ref>   Deploya allowlistade funktioner till <ref>.
  -h, --help            Visa denna hjälp.
EOF
}

mode=""
project_ref=""
while [[ $# -gt 0 ]]; do
    case "${1}" in
        --list | --dry-run)
            mode="list"
            shift
            ;;
        --project-ref)
            if [[ $# -lt 2 ]]; then
                echo "❌ --project-ref kräver ett värde." >&2
                exit 1
            fi
            project_ref="${2}"
            shift 2
            ;;
        --project-ref=*)
            project_ref="${1#*=}"
            shift
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            echo "❌ Okänt argument: ${1}" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [[ -n "${project_ref}" ]]; then
    mode="deploy"
fi
if [[ -z "${mode}" ]]; then
    echo "❌ Ange --list eller --project-ref <ref> (deployar aldrig utan explicit val)." >&2
    usage >&2
    exit 1
fi

if [[ ! -f "${ALLOWLIST_FILE}" ]]; then
    echo "❌ allowlist saknas: ${ALLOWLIST_FILE} (fail-closed — deployar inget)." >&2
    exit 1
fi
if [[ ! -d "${FUNCTIONS_DIR}" ]]; then
    echo "❌ functions-katalog saknas: ${FUNCTIONS_DIR}/" >&2
    exit 1
fi

# Läs allowlisten (en funktion per rad; # = kommentar; blanksteg ignoreras).
allowlist=()
while IFS= read -r raw || [[ -n "${raw}" ]]; do
    line="${raw%%#*}"
    line="${line//[[:space:]]/}"
    if [[ -z "${line}" ]]; then
        continue
    fi
    allowlist+=("${line}")
done < "${ALLOWLIST_FILE}"

if [[ ${#allowlist[@]} -eq 0 ]]; then
    echo "❌ allowlist tom: ${ALLOWLIST_FILE} (fail-closed — deployar inget)." >&2
    exit 1
fi

# Deploybara funktioner på disk (kataloger utom _shared).
ondisk=()
for dir in "${FUNCTIONS_DIR}"/*/; do
    name="${dir%/}"
    name="${name##*/}"
    if [[ "${name}" == "_shared" ]]; then
        continue
    fi
    ondisk+=("${name}")
done

# Deploy-set = allowlistade som finns på disk. Saknade = allowlistad men ej på
# disk (typo/rename) → fail-closed-abort.
deploy_set=()
missing_from_disk=()
for fn in "${allowlist[@]}"; do
    if [[ -d "${FUNCTIONS_DIR}/${fn}" ]]; then
        deploy_set+=("${fn}")
    else
        missing_from_disk+=("${fn}")
    fi
done

# Exkluderade = på disk men ej allowlistade (t.ex. test-auth + nya funktioner).
excluded=()
if [[ ${#ondisk[@]} -gt 0 ]]; then
    for fn in "${ondisk[@]}"; do
        is_allowed="no"
        for a in "${allowlist[@]}"; do
            if [[ "${a}" == "${fn}" ]]; then
                is_allowed="yes"
                break
            fi
        done
        if [[ "${is_allowed}" == "no" ]]; then
            excluded+=("${fn}")
        fi
    done
fi

echo "═══ PROD-DEPLOY ALLOWLIST (fail-closed) ═══"
echo "allowlist: ${ALLOWLIST_FILE} | functions: ${FUNCTIONS_DIR}/"
echo ""
echo "Deploy-set (${#deploy_set[@]}):"
if [[ ${#deploy_set[@]} -gt 0 ]]; then
    for fn in "${deploy_set[@]}"; do
        echo "  [prod]        ${fn}"
    done
fi
echo ""
echo "Exkluderade (${#excluded[@]}) — deployas ALDRIG till prod:"
if [[ ${#excluded[@]} -gt 0 ]]; then
    for fn in "${excluded[@]}"; do
        echo "  [EXKLUDERAD]  ${fn}"
    done
else
    echo "  (inga)"
fi
echo ""

# Fail-closed: allowlistad funktion utan katalog → avbryt (deployar inget).
if [[ ${#missing_from_disk[@]} -gt 0 ]]; then
    for fn in "${missing_from_disk[@]}"; do
        echo "❌ allowlistad funktion saknas på disk: ${fn}" >&2
    done
    echo "Avbryter — fail-closed (ingen deploy)." >&2
    exit 1
fi

if [[ "${mode}" == "list" ]]; then
    echo "✅ list-läge — inget deployat."
    exit 0
fi

# Deploy-läge: deploya varje allowlistad funktion explicit (aldrig bare deploy).
#
# CLI-ANROPET ÄR `npx supabase`, INTE `supabase` — och det är MÄTT, inte
# stilval (S108 Del 18, 2026-08-24). Denna rad kallade tidigare den GLOBALA
# binären, medan anroparen `fas4-prod-deploy.sh` genomgående kör `npx
# supabase`. Samma deploy-väg körde alltså TVÅ olika CLI-versioner, och den
# globala (2.75.0 på Marcus maskin) FALLER på `_shared/mallar/kvitto.css.ts`
# — en 25 kB enkelrads-strängmodul — med `failed to read file: open /*\n *
# Kvitto-mallens EGNA CSS …: invalid argument`: den försöker öppna modulens
# INNEHÅLL som en sökväg. Fällde prod-deployen mitt i, efter 18 av 45
# funktioner.
#
# Differentialmätning mot SAMMA funktion och SAMMA mål (staging), samma träd:
#   supabase       2.75.0  → FAIL (identiskt fel, reproducerat)
#   npx supabase  2.115.0  → EXIT 0
# Alltså CLI-versionen, inte prod och inte filen.
#
# KVARSTÅENDE SVAGHET, bokförd öppet: `npx supabase` är inte heller PINNAD —
# CLI:t saknas i package.json, så npx hämtar senaste. Bytet gör vägen
# INTERNT KONSEKVENT och avvärjer den mätta stale-globala fällan, men en
# framtida npx-version kan flytta sig under fötterna på oss. Riktig
# lösning (pinning + versionsgolv) är eget kort — se S108 Del 18 § C.
echo "Deployar ${#deploy_set[@]} funktion(er) till project-ref ${project_ref} ..."
for fn in "${deploy_set[@]}"; do
    echo "→ npx supabase functions deploy ${fn} --project-ref ${project_ref}"
    npx supabase functions deploy "${fn}" --project-ref "${project_ref}"
done
echo "✅ Klart — ${#deploy_set[@]} funktion(er) deployade. test-* aldrig rörda."
