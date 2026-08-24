#!/usr/bin/env bash
# scripts/test-fas4-prod-deploy.sh — tvåsidig testsvit för fas4-prod-deploy.sh.
#
# TÄCKER: argumentvalidering och ref-validering, alltså allt som körs FÖRE
#   någon nätverksoperation. De skarpa vägarna (link/deploy/verifiering) kan
#   inte täckas här — de kräver prod-project-refen, som scripts/deny-prod-ref.sh
#   avsiktligt spärrar för varje agent-anrop. Den spärren ÄR ett testfall i sig
#   (fall 7 nedan): att skriptet inte utgör en väg förbi prod-låset.
#
# VARFÖR TVÅSIDIG: en svit som bara prövar att fel input NEKAS kan gå grön mot
#   ett skript som nekar allting. Fall 2 (--help) och fall 7:s andra halva
#   prövar därför att rätt input SLÄPPS respektive når fram till spärren.
#
# Sista fyra fallen (S108, 2026-08-24) prövar STRUKTURELLT att den pinnade
# Supabase CLI-vägen (scripts/lib/supabase-cli.sh) faktiskt är inkopplad i
# fas4-prod-deploy.sh — RUNTIME-beteendet (stubbad npx) täcks i stället av
# scripts/test-supabase-cli-policy.sh + T5–T7 i
# scripts/test-deploy-prod-functions.sh, samma "kan inte nätverkstestas här"-
# skäl som resten av filen.
#
# Körs av: CI (shellcheck-strict + denna svit), och för hand vid ändring.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAL="${SCRIPT_DIR}/fas4-prod-deploy.sh"
POLICY="${SCRIPT_DIR}/../.prod-ref-policy.conf"

# shellcheck source=/dev/null
source "${POLICY}"
# Policyn ovan sätter dessa; shellcheck kan inte följa `source` av en variabel
# sökväg och rapporterar dem annars som otilldelade (SC2154). Defaultar till
# tomt så en trasig policy ger ett tydligt testfel i stället för `set -u`-död.
PROD_REF_STAGING="${PROD_REF_STAGING:-}"
PROD_REF_PROD="${PROD_REF_PROD:-}"
[[ -n "${PROD_REF_STAGING}" && -n "${PROD_REF_PROD}" ]] \
    || { echo "❌ Policyn ${POLICY} saknar refer — sviten kan inte köra." >&2; exit 1; }

FALL=0
FEL=0

pafall() {
    local namn="$1" forvantad_kod="$2" forvantat_utdrag="$3"
    shift 3
    FALL=$((FALL + 1))
    local utdata kod
    utdata="$("$@" 2>&1)"
    kod=$?

    if [[ "${kod}" -ne "${forvantad_kod}" ]]; then
        printf '✗ FALL %d (%s): exitkod %d, förväntade %d\n' "${FALL}" "${namn}" "${kod}" "${forvantad_kod}" >&2
        FEL=$((FEL + 1))
        return
    fi
    if [[ -n "${forvantat_utdrag}" ]] && [[ "${utdata}" != *"${forvantat_utdrag}"* ]]; then
        printf '✗ FALL %d (%s): utdatan saknade "%s"\n' "${FALL}" "${namn}" "${forvantat_utdrag}" >&2
        printf '  fick: %s\n' "${utdata}" >&2
        FEL=$((FEL + 1))
        return
    fi
    printf '✓ FALL %d — %s\n' "${FALL}" "${namn}"
}

echo "══ fas4-prod-deploy.sh — testsvit ══"

# ── NEKANDE SIDAN ───────────────────────────────────────────────────────────
pafall "inga argument nekas" 1 "gissar aldrig läge" \
    bash "${MAL}"

pafall "okänt läge nekas" 1 "gissar aldrig läge" \
    bash "${MAL}" --deploy-allt

pafall "läge utan ref nekas" 1 "anges explicit, aldrig ur config" \
    bash "${MAL}" --deploya

pafall "staging-ref nekas explicit" 1 "Du angav STAGING-refen" \
    bash "${MAL}" --deploya "${PROD_REF_STAGING}"

pafall "okänd ref nekas" 1 "Stoppar hellre än gissar" \
    bash "${MAL}" --deploya "abcdefghijklmnopqrst"

pafall "kontrollera kräver också ref" 1 "anges explicit" \
    bash "${MAL}" --kontrollera

# ── SLÄPPANDE SIDAN ─────────────────────────────────────────────────────────
pafall "--help släpps och beskriver båda lägena" 0 "--kontrollera" \
    bash "${MAL}" --help

# ── PROD-LÅSETS INTEGRITET ──────────────────────────────────────────────────
# Skriptet får ALDRIG bli en väg förbi scripts/deny-prod-ref.sh. Låset matchar
# refens närvaro i kommandosträngen; eftersom skriptet KRÄVER refen som
# argument bär varje skarpt anrop den, och hooken ser den.
#
# Detta prövas STRUKTURELLT (hooken kan inte anropas härifrån — den lever i
# harnessets PreToolUse-lager, inte i skalet): vi verifierar att skriptet inte
# har någon kodväg som hämtar prod-refen ur policyn i stället för ur argumentet.
# Prövar OPERATIONS-positionen, inte blotta förekomsten: PROD_REF_PROD får
# jämföras mot (valideringen), men aldrig SKICKAS till en operation. En
# tidigare version av detta fall matchade all förekomst och föll på skriptets
# egen valideringsrad — ett falskt positivt i testet, inte ett fel i koden.
FALL=$((FALL + 1))
if grep -nE '(--project-ref|^[[:space:]]*lanka|deploy-prod-functions\.sh)' "${MAL}" \
    | grep -v '^[0-9]*:[[:space:]]*#' \
    | grep -q 'PROD_REF_PROD'; then
    printf '✗ FALL %d (prod-låsets integritet): policyns prod-ref skickas till en operation — det vore en bypass\n' "${FALL}" >&2
    FEL=$((FEL + 1))
else
    printf '✓ FALL %d — prod-refen kommer ur argumentet, aldrig ur policyn\n' "${FALL}"
fi

# Motsatt riktning: varje operation MÅSTE bära den angivna refen (eller
# staging-refen vid återlänkning). Fångar en framtida ändring som råkar
# tappa argumentet.
FALL=$((FALL + 1))
# shellcheck disable=SC2016  # enkelfnuttarna ÄR avsikten — mönstren ska matcha
# den LITERALA texten "${ANGIVEN_REF}" i målfilen, inte expandera här.
if grep -cE '\-\-project-ref "\$\{ANGIVEN_REF\}"' "${MAL}" > /dev/null \
    && grep -q 'lanka "\${ANGIVEN_REF}"' "${MAL}" \
    && grep -q 'lanka "\${PROD_REF_STAGING}"' "${MAL}"; then
    printf '✓ FALL %d — operationerna bär ANGIVEN_REF; återlänkningen bär staging-refen\n' "${FALL}"
else
    printf '✗ FALL %d: en operation saknar sin ref-parameter\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

# PROD_REF_PROD får förekomma, men BARA som valideringsjämförelse.
FALL=$((FALL + 1))
if grep -q 'PROD_REF_PROD' "${MAL}"; then
    printf '✓ FALL %d — policyns värde används (för validering av angiven ref)\n' "${FALL}"
else
    printf '✗ FALL %d: skriptet validerar inte den angivna refen mot policyn\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

# ── ÅTERLÄNKNINGENS TRAP ────────────────────────────────────────────────────
# Det steg som glöms oftast och kostar mest. Verifiera att det sitter i en
# EXIT-trap och inte bara sist i lyckoflödet.
FALL=$((FALL + 1))
if grep -q 'trap aterstall_staging EXIT' "${MAL}"; then
    printf '✓ FALL %d — återlänkningen sitter i en EXIT-trap\n' "${FALL}"
else
    printf '✗ FALL %d: återlänkningen till staging är inte trap-skyddad\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

# ── BUCKET-KONTROLLEN (TASK-308) ─────────────────────────────────────────────
# Den skarpa vägen (kontrollera-bilagor-bucket.sh:s riktiga nyckel-hämtning +
# nätverksanrop) kan inte täckas här av samma skäl som ovan — men logiken den
# omsluter är UTFLYTTAD ur fas4-prod-deploy.sh till en egen fil precis för
# att göras testbar i isolering: KONTROLL_CMD-injektionen (samma mönster som
# FUNCTIONS_DIR/ALLOWLIST_FILE i test-deploy-prod-functions.sh) låter oss
# bevisa BÅDA RIKTNINGARNA utan en enda riktig project-ref eller nätverksanrop.
BUCKET_SKRIPT="${SCRIPT_DIR}/kontrollera-bilagor-bucket.sh"

FALL=$((FALL + 1))
KONTROLL_CMD=true bash "${BUCKET_SKRIPT}" ZZ-TEST-REF > /dev/null 2>&1
KOD_KONVERGERAD=$?
if [[ "${KOD_KONVERGERAD}" -eq 0 ]]; then
    printf '✓ FALL %d — bucket-kontroll: konvergerad → exit 0 (grönt)\n' "${FALL}"
else
    printf '✗ FALL %d (bucket-kontroll konvergerad): exit %d, förväntade 0\n' \
        "${FALL}" "${KOD_KONVERGERAD}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
KONTROLL_CMD=false bash "${BUCKET_SKRIPT}" ZZ-TEST-REF > /dev/null 2>&1
KOD_SAKNAS=$?
if [[ "${KOD_SAKNAS}" -eq 1 ]]; then
    printf '✓ FALL %d — bucket-kontroll: saknas/avviker → exit 1 (rapporteras)\n' "${FALL}"
else
    printf '✗ FALL %d (bucket-kontroll saknas/avviker): exit %d, förväntade 1\n' \
        "${FALL}" "${KOD_SAKNAS}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
UTDATA_UTAN_REF="$(bash "${BUCKET_SKRIPT}" 2>&1)"
KOD_UTAN_REF=$?
if [[ "${KOD_UTAN_REF}" -eq 1 ]] && [[ "${UTDATA_UTAN_REF}" == *"Project-ref saknas"* ]]; then
    printf '✓ FALL %d — bucket-kontroll utan ref nekas, exit 1\n' "${FALL}"
else
    printf '✗ FALL %d: bucket-kontroll utan ref gav exit %d (förväntade 1 + "Project-ref saknas")\n' \
        "${FALL}" "${KOD_UTAN_REF}" >&2
    FEL=$((FEL + 1))
fi

# ── BUCKET-GRINDENS WIRING I fas4-prod-deploy.sh ─────────────────────────────
FALL=$((FALL + 1))
ANTAL_ANROP="$(grep -c 'kontrollera-bilagor-bucket\.sh' "${MAL}")"
if [[ "${ANTAL_ANROP}" -ge 2 ]]; then
    printf '✓ FALL %d — fas4-prod-deploy.sh anropar bucket-kontrollen i BÅDA lägena (%d ställen)\n' \
        "${FALL}" "${ANTAL_ANROP}"
else
    printf '✗ FALL %d: fas4-prod-deploy.sh anropar bucket-kontrollen på färre än 2 ställen (%d)\n' \
        "${FALL}" "${ANTAL_ANROP}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
BUCKET_RAD="$(grep -n 'kontrollera-bilagor-bucket\.sh' "${MAL}" | tail -1 | cut -d: -f1)"
DEPLOY_RAD="$(grep -n 'deploy-prod-functions\.sh' "${MAL}" | tail -1 | cut -d: -f1)"
if [[ -n "${BUCKET_RAD}" ]] && [[ -n "${DEPLOY_RAD}" ]] && [[ "${BUCKET_RAD}" -lt "${DEPLOY_RAD}" ]]; then
    printf '✓ FALL %d — bucket-kontrollen körs FÖRE EF-deployen (rad %s < rad %s)\n' \
        "${FALL}" "${BUCKET_RAD}" "${DEPLOY_RAD}"
else
    printf '✗ FALL %d: bucket-kontrollen ligger inte strukturellt före EF-deployen\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
# Den exakta strängen i --deploya-grenens `doden`-anrop (se fas4-prod-deploy.sh
# § DEPLOYA) — förekommer ENDAST där, inte i --kontrollera-lägets `rott`-gren,
# så träff bevisar att avvikelse verkligen FÄLLER deployen, inte bara rapporteras.
if grep -qF 'doden "Bucket \"bilagor\" saknas eller avviker i prod (TASK-308)' "${MAL}"; then
    printf '✓ FALL %d — --deploya FÄLLER (doden) om bucketen inte konvergerar\n' "${FALL}"
else
    printf '✗ FALL %d: hittar ingen doden-gate för bucket-avvikelse i --deploya\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

# ── SUPABASE CLI-PINNING (S108, 2026-08-24) ──────────────────────────────────
# Den skarpa vägen (npx faktiskt anropat, guarden verifierad mot en riktig
# CLI-version) kan inte täckas här av samma skäl som ovan — men den STRUKTUR-
# ELLA wiringen kan, och det är precis vad som gick sönder i incidenten:
# fem av sju anropsställen bar VAR SIN form. scripts/test-deploy-prod-
# functions.sh:s T5–T7 bevisar RUNTIME-beteendet (stubbad npx, offline) för
# anropsställe A1; dessa fall bevisar STRUKTUREN i fas4-prod-deploy.sh (A2–A6).

FALL=$((FALL + 1))
# shellcheck disable=SC2016  # enkelfnuttarna ÄR avsikten — mönstret ska matcha
# den LITERALA texten i målfilen, inte expandera här (samma mönster som
# ANGIVEN_REF-fallen ovan).
if grep -qF 'source "${SCRIPT_DIR}/lib/supabase-cli.sh"' "${MAL}"; then
    printf '✓ FALL %d — scripts/lib/supabase-cli.sh sourcas\n' "${FALL}"
else
    printf '✗ FALL %d: scripts/lib/supabase-cli.sh sourcas inte\n' "${FALL}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
PREFLIGHT_RAD="$(grep -n 'rubrik "Preflight"' "${MAL}" | head -1 | cut -d: -f1)"
GUARD_RAD="$(grep -n 'supabase_cli_guard' "${MAL}" | head -1 | cut -d: -f1)"
# shellcheck disable=SC2016  # enkelfnuttarna ÄR avsikten, samma skäl som ovan.
CD_REPO_RAD="$(grep -n 'cd "\${REPO_ROT}"' "${MAL}" | head -1 | cut -d: -f1)"
if [[ -n "${PREFLIGHT_RAD}" ]] && [[ -n "${GUARD_RAD}" ]] && [[ -n "${CD_REPO_RAD}" ]] \
    && [[ "${GUARD_RAD}" -gt "${PREFLIGHT_RAD}" ]] && [[ "${GUARD_RAD}" -lt "${CD_REPO_RAD}" ]]; then
    printf '✓ FALL %d — supabase_cli_guard körs INNE I Preflight-blocket (rad %s, mellan %s och %s)\n' \
        "${FALL}" "${GUARD_RAD}" "${PREFLIGHT_RAD}" "${CD_REPO_RAD}"
else
    printf '✗ FALL %d: supabase_cli_guard ligger inte strukturellt i Preflight (preflight=%s guard=%s cd=%s)\n' \
        "${FALL}" "${PREFLIGHT_RAD:-saknas}" "${GUARD_RAD:-saknas}" "${CD_REPO_RAD:-saknas}" >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
# Enda tillåtna kvarvarande "npx supabase " (obar, opinnad) är hint-texten
# "npx supabase login" i felmeddelandet — INTE ett exekverat CLI-anrop.
OPINNADE="$(grep -n 'npx supabase ' "${MAL}" | grep -vc 'npx supabase login')"
if [[ "${OPINNADE}" -eq 0 ]]; then
    printf '✓ FALL %d — inga opinnade "npx supabase "-anrop kvar (utöver login-hintens text)\n' "${FALL}"
else
    printf '✗ FALL %d: %d opinnat "npx supabase "-anrop kvar\n' "${FALL}" "${OPINNADE}" >&2
    grep -n 'npx supabase ' "${MAL}" | grep -v 'npx supabase login' >&2
    FEL=$((FEL + 1))
fi

FALL=$((FALL + 1))
ANTAL_SUPABASE_CLI="$(grep -c 'supabase_cli ' "${MAL}")"
if [[ "${ANTAL_SUPABASE_CLI}" -ge 4 ]]; then
    printf '✓ FALL %d — supabase_cli() används på ≥4 operationsställen (%d, A2–A5)\n' \
        "${FALL}" "${ANTAL_SUPABASE_CLI}"
else
    printf '✗ FALL %d: supabase_cli() används på färre än 4 ställen (%d) — ett anropsställe kan ha regredierat\n' \
        "${FALL}" "${ANTAL_SUPABASE_CLI}" >&2
    FEL=$((FEL + 1))
fi

echo
if [[ "${FEL}" -eq 0 ]]; then
    printf '✅ %d/%d gröna\n' "${FALL}" "${FALL}"
    exit 0
fi
printf '❌ %d av %d föll\n' "${FEL}" "${FALL}" >&2
exit 1
