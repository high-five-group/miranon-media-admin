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
#   bash scripts/deploy-prod-functions.sh --audit --project-ref <prod-ref>
#       Read-only: hämtar LIVE-funktionslistan från <prod-ref> och diffar
#       den mot allowlisten. Rapporterar varje live funktion som INTE står
#       i allowlisten och exit 1:ar vid träff — ser historiska rester
#       grinden vid deploy-tid inte kan se (den prövar bara framtida
#       deployer, aldrig vad som redan ligger kvar i prod). Ändrar inget.
#   bash scripts/deploy-prod-functions.sh --project-ref <prod-ref>
#       Deployar varje allowlistad funktion till angivet projekt.
#
# ═══ VARFÖR --audit FINNS (TASK-37) ═══
#
#   Fail-closed-deployen ovan hindrar en framtida icke-allowlistad funktion
#   från att NÅ prod via DETTA skript — men den är blind bakåt: den granskar
#   aldrig vad som redan ligger deployat i prod via en ANNAN väg (manuell
#   `supabase functions deploy <namn>`, en äldre deploy innan allowlisten
#   fanns, etc). test-auth låg i prod i 81 dagar trots allowlist-förbud
#   innan S84 städade det manuellt — allowlist-grinden såg det aldrig,
#   eftersom den bara körs vid en NY deploy. --audit stänger den luckan:
#   den frågar prod direkt (`functions list -o json`) i stället för att lita
#   på att ingenting smugit sig förbi grinden historiskt.
#
#   Källa: TASK-35 AC2-beslutet (2026-07-24, S84) ·
#          docs/research/t39-ef-sync-preflight-2026-07-24.md §7.
#
# Env-override (för test-isolering): FUNCTIONS_DIR, ALLOWLIST_FILE.
#
# Exit 0 vid lyckad list/audit/deploy (audit: 0 icke-allowlistade live).
# Exit 1 vid saknad allowlist, allowlistad funktion som saknas på disk,
# saknad/ogiltig användning, eller (audit) minst en icke-allowlistad
# funktion live i prod.
#
# Källa: docs/decisions/ADR-050-isolerad-staging-miljo.md (steg 2) +
#        tasks/lessons.md L115 (Fas 7-skuld).
# Etablerad: Session 19 (2026-06-13) · --audit tillagd TASK-37

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="${FUNCTIONS_DIR:-supabase/functions}"
ALLOWLIST_FILE="${ALLOWLIST_FILE:-.prod-functions-allowlist.conf}"

usage() {
    cat <<'EOF'
Användning:
  scripts/deploy-prod-functions.sh --list
  scripts/deploy-prod-functions.sh --audit --project-ref <prod-ref>
  scripts/deploy-prod-functions.sh --project-ref <prod-ref>

  --list, --dry-run     Visa deploy-set + exkluderade. Deployar inget.
  --audit               Read-only: diffa LIVE prod-funktioner mot
                         allowlisten (kräver --project-ref). Deployar inget.
  --project-ref <ref>   Deploya allowlistade funktioner till <ref>
                         (eller mål för --audit ovan).
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
        --audit)
            mode="audit"
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

# Defaultar till deploy-läge ENDAST om ingen flagga (--list/--audit) redan
# valde ett läge — annars hade `--audit --project-ref <ref>` tyst blivit en
# skarp deploy, eftersom project_ref alltid är satt i det anropet.
if [[ -z "${mode}" ]] && [[ -n "${project_ref}" ]]; then
    mode="deploy"
fi
if [[ -z "${mode}" ]]; then
    echo "❌ Ange --list, --audit eller --project-ref <ref> (deployar aldrig utan explicit val)." >&2
    usage >&2
    exit 1
fi
if [[ "${mode}" == "audit" ]] && [[ -z "${project_ref}" ]]; then
    echo "❌ --audit kräver --project-ref <ref> (kan inte granska prod utan mål)." >&2
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

# ── Audit-läge: read-only, diffar LIVE prod mot allowlisten (TASK-37) ───────
#
# Detta är en ANNAN diff än deploy_set/excluded ovan: de jämför allowlisten
# mot vad som finns PÅ DISK i detta repo. Audit jämför allowlisten mot vad
# som faktiskt är DEPLOYAT i prod just nu — den enda av de två som kan
# upptäcka en historisk rest som aldrig gick via detta skripts deploy-läge.
if [[ "${mode}" == "audit" ]]; then
    echo "═══ AUDIT — LIVE prod-funktioner mot ${ALLOWLIST_FILE} (read-only) ═══"
    echo "project-ref: ${project_ref}"
    echo ""

    # Samma pinnade CLI-disciplin som deploy-läget (S108) — en oupplöst/fel
    # CLI-version ska larma högljutt här också, inte bara vid skarp deploy.
    # shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/supabase-cli.sh lintas separat via ci.yml:s shellcheck-lista
    source "${SCRIPT_DIR}/lib/supabase-cli.sh"
    # shellcheck disable=SC2310  # avsiktligt: eget läsbart skäl i stället för
    # `set -e`:s tysta död — samma mönster som deploy-läget nedan.
    supabase_cli_guard || {
        echo "❌ Avbryter — fail-closed (ingen granskning utan verifierad CLI-version)." >&2
        exit 1
    }

    # jq krävs för att tolka `functions list -o json` (TASK-312-disciplinen —
    # samma minimiversions-guard som varje annan jq-konsument i repot).
    # shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
    source "${SCRIPT_DIR}/lib/jq-guard.sh"
    jq_version_ok || {
        echo "❌ jq saknas eller är för gammal (.jq-version-policy.conf, TASK-312) — kan inte tolka prod-listan." >&2
        exit 1
    }

    live_json=""
    # shellcheck disable=SC2310  # avsiktligt: eget läsbart skäl i stället för
    # `set -e`:s tysta död — samma mönster som resten av filen.
    live_json="$(supabase_cli functions list --project-ref "${project_ref}" -o json 2> /dev/null)" || {
        echo "❌ Kunde inte hämta funktionslistan för ${project_ref}. Är du inloggad? (npx supabase login)" >&2
        exit 1
    }
    if ! printf '%s' "${live_json}" | jq -e 'type == "array"' > /dev/null 2>&1; then
        echo "❌ Oväntat svar från 'functions list -o json' — kunde inte tolkas som en lista." >&2
        exit 1
    fi

    # Live-funktionens URL-identifierare är `.slug` — matchar katalognamnen
    # under supabase/functions/ och allowlistens rader (Supabase CLI:s
    # dokumenterade -o json-kontrakt, list.encoders.ts:
    # toGoJsonFunction()/encodeFunctionsGoJson).
    #
    # jq-utfallet fångas i en variabel FÖRST (inte en process-substitution
    # rakt in i while-loopen) — en kommandosubstitution i en process-
    # substitution maskerar jq:s returvärde (SC2312), och ett tyst jq-fel
    # hade blivit noll rader = "inget live", vilket är fail-open. Samma
    # mönster som scripts/check-nattvakt-dedup.sh RADER-hämtningen.
    live_slugs_raw=""
    live_slugs_raw="$(printf '%s' "${live_json}" | jq -r '.[].slug')" || {
        echo "❌ jq kunde inte tolka funktionslistan (${project_ref})." >&2
        exit 1
    }

    live_slugs=()
    while IFS= read -r slug; do
        [[ -z "${slug}" ]] && continue
        live_slugs+=("${slug}")
    done <<< "${live_slugs_raw}"

    echo "Live funktioner i ${project_ref} (${#live_slugs[@]}):"
    if [[ ${#live_slugs[@]} -gt 0 ]]; then
        for slug in "${live_slugs[@]}"; do
            echo "  ${slug}"
        done
    fi
    echo ""

    icke_allowlistade=()
    for slug in "${live_slugs[@]}"; do
        is_allowed="no"
        for a in "${allowlist[@]}"; do
            if [[ "${a}" == "${slug}" ]]; then
                is_allowed="yes"
                break
            fi
        done
        if [[ "${is_allowed}" == "no" ]]; then
            icke_allowlistade+=("${slug}")
        fi
    done

    if [[ ${#icke_allowlistade[@]} -eq 0 ]]; then
        echo "✅ 0 icke-allowlistade funktioner live i ${project_ref}."
        exit 0
    fi

    echo "❌ ${#icke_allowlistade[@]} icke-allowlistad(e) funktion(er) LIVE i ${project_ref} (finns i prod, men INTE i ${ALLOWLIST_FILE}):" >&2
    for slug in "${icke_allowlistade[@]}"; do
        echo "  [ICKE-ALLOWLISTAD]  ${slug}" >&2
    done
    exit 1
fi

# Deploy-läge: deploya varje allowlistad funktion explicit (aldrig bare deploy).
#
# CLI-ANROPET ÄR PINNAT — och det är MÄTT, inte stilval (S108, 2026-08-24).
# Denna rad kallade tidigare den GLOBALA binären (bar `supabase`), medan
# anroparen fas4-prod-deploy.sh:s övriga anrop genomgående körde `npx
# supabase` UTAN pin. Samma deploy-väg körde alltså TVÅ olika CLI-versioner,
# och den globala (2.75.0 på Marcus maskin) FALLER på
# `_shared/mallar/kvitto.css.ts` — en 25 kB enkelrads-strängmodul — med
# `failed to read file: open /*\n * Kvitto-mallens EGNA CSS …: invalid
# argument`: den försöker öppna modulens INNEHÅLL som en sökväg. Fällde
# prod-deployen mitt i, efter 18 av 45 funktioner. Full differentialmätning:
# .supabase-cli-policy.conf § VARFÖR FILEN FINNS.
#
# Källan för PINNINGEN (inte bara `npx supabase` utan version) är
# scripts/lib/supabase-cli.sh + .supabase-cli-policy.conf — sju
# anropsställen som tidigare bar var sin form konsoliderade till en.
# shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/supabase-cli.sh lintas separat via ci.yml:s shellcheck-lista
source "${SCRIPT_DIR}/lib/supabase-cli.sh"
# shellcheck disable=SC2310  # avsiktligt: eget läsbart skäl i stället för
# `set -e`:s tysta död — samma mönster som `lanka`-anropen i
# fas4-prod-deploy.sh.
supabase_cli_guard || {
    echo "❌ Avbryter — fail-closed (ingen deploy utan verifierad CLI-version)." >&2
    exit 1
}

echo "Deployar ${#deploy_set[@]} funktion(er) till project-ref ${project_ref} ..."
for fn in "${deploy_set[@]}"; do
    # shellcheck disable=SC2154  # SUPABASE_CLI_VERSION sätts av det sourcade
    # scripts/lib/supabase-cli.sh (supabase_cli_guard körde ovan) — samma
    # cross-file-begränsning som andra sourcade policy-variabler i repot.
    echo "→ npx supabase@${SUPABASE_CLI_VERSION} functions deploy ${fn} --project-ref ${project_ref}"
    supabase_cli functions deploy "${fn}" --project-ref "${project_ref}"
done
echo "✅ Klart — ${#deploy_set[@]} funktion(er) deployade. test-* aldrig rörda."
