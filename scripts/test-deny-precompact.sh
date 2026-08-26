#!/usr/bin/env bash
# scripts/test-deny-precompact.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-precompact.sh (TASK-160.2,
# ADR-101 § Beslut 5). Samma familjeform som
# scripts/test-deny-arbetsform-push.sh / scripts/test-deny-subagent-vantan.sh
# (EXPECT_OUT/NOT_EXPECT_OUT, PATH_NO_JQ-tekniken, äkta git-repo som TEST_DIR).
#
#   N1–N8  Nekar (exit 2):
#     N1  trigger=auto, INGEN markör → nekas (grundfallet)
#     N2  trigger=auto, en FÄRSK GILTIG markör NÄRVARANDE → nekas ÄNDÅ (auto
#         nekas ALLTID, oavsett markörens skick — bevisar att auto-grenen
#         kortsluter FÖRE markörläsningen)
#     N3  trigger=manual, INGEN markörfil → nekas (frånvaro-regeln, MOTSATT
#         riktning mot deny-arbetsform-push.sh:s frånvaro-släpper)
#     N4  trigger=manual, markör GAMMAL (18 min, fönstret är 15) → nekas
#     N5  trigger=manual, markör KORRUPT JSON → nekas (fail-closed)
#     N6  trigger=manual, markör saknar satt_vid-fältet → nekas (fail-closed)
#     N7  trigger=manual, markörens satt_vid är en otolkbar tidsstämpel →
#         nekas (fail-closed)
#     N8  trigger har ett OKÄNT värde (varken manual eller auto) → nekas
#         (fail-closed)
#   S1–S3  Släpper (exit 0) — den viktigaste halvan, en kontrollerad
#          kompaktering ska ALDRIG blockeras i onödan:
#     S1  trigger=manual, markör FÄRSK (satt just nu) → släpps
#     S2  trigger=manual, markör EXAKT vid fönstrets gräns (15 min) → släpps
#         (">"-jämförelsen är strikt, gränsen själv räknas som färsk)
#     S3  trigger=manual, markör FÄRSK men saknar fokus_instruktion/sattare
#         (bara satt_vid) → släpps ändå — de fälten gate:ar inte separat
#         (se .precompact-policy.conf § JSON-FORMEN)
#   F1–F8  FAIL-CLOSED, OVILLKORLIGT (till skillnad från
#          deny-arbetsform-push.sh:s scopade fail-open — se skriptets § FAIL-
#          CLOSED, OVILLKORLIGT). Samtliga körs med trigger=manual + en
#          FÄRSK, GILTIG markör redan på plats, för att pröva den STRÄNGASTE
#          tolkningen (om hooken ändå nekar HÄR trots ett i övrigt perfekt
#          läge, är den garanterat fail-closed i det svagare fallet också):
#     F1  jq saknas i PATH → nekas
#     F2  tom stdin → nekas
#     F3  trasig JSON på stdin → nekas
#     F4  trigger-fältet saknas helt → nekas
#     F5  cwd saknas i hook-indatan → nekas
#     F6  cwd pekar på en obefintlig katalog → nekas
#     F7  policyfilen saknas helt → nekas
#     F8  policyfilen är otolkbar (syntaxfel) → nekas
#   E1  Exit-koden på en neka-väg är EXAKT 2.
#
# Test-isolering: TEST_DIR är ett ÄKTA (minimalt) git-repo — hooken kräver
# `git rev-parse --show-toplevel` för att hitta arbetsträdets rot (samma skäl
# som test-deny-arbetsform-push.sh). Hook-JSON:s `cwd`-fält pekar på TEST_DIR.
#
# Användning: bash scripts/test-deny-precompact.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-160.2 · scripts/deny-precompact.sh ·
#        scripts/test-deny-arbetsform-push.sh (mönster-förebild)
# Etablerad: TASK-160.2, 2026-08-07

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task160-2-test-deny-precompact"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-precompact.sh"
POLICY_SRC="${REPO_ROOT}/.precompact-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-precompact.sh"
POLICY="${TEST_DIR}/.precompact-policy.conf"
MARKORFIL="${TEST_DIR}/.claude/precompact-markor.json"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # anropas via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${POLICY_SRC}" "${POLICY}"
    # jq-guard.sh (TASK-312) sourcas nu av skriptet.
    cp "${REPO_ROOT}/scripts/lib/jq-guard.sh" "${TEST_DIR}/scripts/lib/jq-guard.sh"
    cp "${REPO_ROOT}/.jq-version-policy.conf" "${TEST_DIR}/.jq-version-policy.conf"
    (
        cd "${TEST_DIR}" \
            && git init -q \
            && git config user.email "test@test.invalid" \
            && git config user.name "test"
    ) > /dev/null 2>&1 || {
        printf 'setup: kunde inte initiera testrepo\n' >&2
        exit 1
    }
}

# PATH utan katalogen som äger den riktiga jq-binären (F1). Beräknas mot den
# FAKTISKA jq-platsen — ingen hårdkodning av en specifik katalog.
PATH_NO_JQ=""
compute_path_no_jq() {
    local jq_path jq_dir out="" seg segs
    jq_path="$(command -v jq)"
    jq_dir="$(dirname "${jq_path}")"
    IFS=':' read -r -a segs <<< "${PATH}"
    for seg in "${segs[@]}"; do
        [[ "${seg}" == "${jq_dir}" ]] && continue
        out="${out:+${out}:}${seg}"
    done
    PATH_NO_JQ="${out}"
}

# iso_for_epoch <epoch> — cross-platform (BSD -r / GNU -d), samma mönster
# som scripts/deny-precompact.sh:s egen ålders-beräkning (och
# scripts/test-check-pausade-sessioner.sh).
iso_for_epoch() {
    local epoch="$1"
    date -u -r "${epoch}" +%Y-%m-%dT%H:%M:%SZ 2> /dev/null \
        || date -u -d "@${epoch}" +%Y-%m-%dT%H:%M:%SZ
}

# satt_markor <satt_vid_iso> [fokus_instruktion] [sattare]
satt_markor() {
    local satt_vid="$1" fokus="${2:-testens fokus-instruktion}" sattare="${3:-test}"
    mkdir -p "$(dirname "${MARKORFIL}")"
    jq -nc --arg f "${fokus}" --arg s "${satt_vid}" --arg vem "${sattare}" \
        '{fokus_instruktion: $f, satt_vid: $s, sattare: $vem}' > "${MARKORFIL}"
}

rensa_markor() {
    rm -f "${MARKORFIL}"
}

# hook_json <trigger> — JSON på formen hooken faktiskt tar emot (premiss-
# passet i deny-precompact.sh:s huvud), med cwd = TEST_DIR.
hook_json() {
    local trigger="$1"
    jq -nc --arg t "${trigger}" --arg cwd "${TEST_DIR}" \
        '{hook_event_name: "PreCompact", trigger: $t, cwd: $cwd, custom_instructions: ""}'
}

# run_case <namn> <väntad exit> <json> [env-tilldelningar...]
EXPECT_OUT=""
NOT_EXPECT_OUT=""

run_case() {
    local name="$1" want="$2" json="$3"
    shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    (cd "${TEST_DIR}" && printf '%s' "${json}" | env "$@" bash "${SKRIPT}") > "${TEST_DIR}/out.txt" 2>&1
    got=$?

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$((PASSED + 1))
}

setup
compute_path_no_jq
NU_S="$(date -u +%s)"
# Tidsstämplarna beräknas EN gång, in i variabler — en inline
# `$(iso_for_epoch ...)` som argument till satt_markor/jq maskerar
# `iso_for_epoch`s eget returvärde (SC2312), samma disciplin som
# scripts/deny-frammande-huvudkatalog.sh:s § kommandosubstitution.
ISO_NU="$(iso_for_epoch "${NU_S}")"
ISO_15MIN_GRANS="$(iso_for_epoch "$(( NU_S - 15 * 60 ))")"
ISO_18MIN_GAMMAL="$(iso_for_epoch "$(( NU_S - 18 * 60 ))")"
printf 'test-deny-precompact: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# N1–N2 — trigger=auto nekas ALLTID.
JSON="$(hook_json 'auto')"
EXPECT_OUT="auto-compact nekas ALLTID"
run_case "N1  trigger=auto, ingen markör, NEKAS" 2 "${JSON}"

satt_markor "${ISO_NU}"
JSON="$(hook_json 'auto')"
EXPECT_OUT="auto-compact nekas ALLTID"
run_case "N2  trigger=auto, FÄRSK GILTIG markör närvarande, NEKAS ÄNDÅ (kortslutning före markörläsning)" 2 "${JSON}"
rensa_markor

# ============================================================
# N3–N8 — trigger=manual, olika nekande markörlägen.
echo ""
JSON="$(hook_json 'manual')"
EXPECT_OUT="ingen markörfil"
run_case "N3  trigger=manual, INGEN markörfil, NEKAS (frånvaro-regeln)" 2 "${JSON}"

satt_markor "${ISO_18MIN_GAMMAL}"
JSON="$(hook_json 'manual')"
EXPECT_OUT="äldre än färskhetsfönstret"
run_case "N4  trigger=manual, markör 18 min gammal (fönster 15), NEKAS" 2 "${JSON}"
rensa_markor

mkdir -p "$(dirname "${MARKORFIL}")"
printf 'detta är inte giltig json' > "${MARKORFIL}"
JSON="$(hook_json 'manual')"
EXPECT_OUT="korrupt markör"
run_case "N5  trigger=manual, markör KORRUPT JSON, NEKAS (fail-closed)" 2 "${JSON}"
rensa_markor

mkdir -p "$(dirname "${MARKORFIL}")"
jq -nc '{fokus_instruktion: "x", sattare: "test"}' > "${MARKORFIL}"
JSON="$(hook_json 'manual')"
EXPECT_OUT="korrupt markör"
run_case "N6  trigger=manual, markör saknar satt_vid, NEKAS (fail-closed)" 2 "${JSON}"
rensa_markor

mkdir -p "$(dirname "${MARKORFIL}")"
jq -nc '{fokus_instruktion: "x", satt_vid: "inte-en-tidsstämpel", sattare: "test"}' > "${MARKORFIL}"
JSON="$(hook_json 'manual')"
EXPECT_OUT="korrupt markör"
run_case "N7  trigger=manual, satt_vid otolkbar tidsstämpel, NEKAS (fail-closed)" 2 "${JSON}"
rensa_markor

JSON="$(hook_json 'banan')"
EXPECT_OUT="okänt trigger-värde"
run_case "N8  trigger='banan' (okänt värde), NEKAS (fail-closed)" 2 "${JSON}"

# ============================================================
# S1–S3 — Släpper: den viktigaste halvan. Falsklarm här blockerar VARJE
# kontrollerad kompaktering i hela repot.
echo ""
satt_markor "${ISO_NU}"
JSON="$(hook_json 'manual')"
NOT_EXPECT_OUT="COMPACT-FORMEN"
run_case "S1  trigger=manual, markör FÄRSK (satt nu), SLÄPPS" 0 "${JSON}"
rensa_markor

satt_markor "${ISO_15MIN_GRANS}"
JSON="$(hook_json 'manual')"
NOT_EXPECT_OUT="COMPACT-FORMEN"
run_case "S2  trigger=manual, markör EXAKT vid 15 min-gränsen, SLÄPPS (strikt \">\")" 0 "${JSON}"
rensa_markor

mkdir -p "$(dirname "${MARKORFIL}")"
jq -nc --arg s "${ISO_NU}" '{satt_vid: $s}' > "${MARKORFIL}"
JSON="$(hook_json 'manual')"
NOT_EXPECT_OUT="COMPACT-FORMEN"
run_case "S3  trigger=manual, markör FÄRSK men saknar fokus_instruktion/sattare, SLÄPPS ändå" 0 "${JSON}"
rensa_markor

# ============================================================
# F1–F8 — FAIL-CLOSED, OVILLKORLIGT. Alla körs med en i övrigt PERFEKT läge
# (trigger=manual + färsk giltig markör) för att pröva den STRÄNGASTE
# tolkningen.
echo ""
satt_markor "${ISO_NU}"

JSON="$(hook_json 'manual')"
EXPECT_OUT="jq saknas"
run_case "F1  jq saknas i PATH, NEKAS trots i övrigt perfekt läge" 2 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

run_case "F2  tom stdin, NEKAS" 2 ""

run_case "F3  trasig JSON på stdin, NEKAS" 2 \
    '{"trigger": detta är inte giltig json'

JSON='{"hook_event_name":"PreCompact","cwd":"'"${TEST_DIR}"'"}'
EXPECT_OUT="saknar ett trigger-fält"
run_case "F4  trigger-fältet saknas helt, NEKAS" 2 "${JSON}"

JSON='{"hook_event_name":"PreCompact","trigger":"manual"}'
EXPECT_OUT="cwd saknas"
run_case "F5  cwd saknas i hook-indatan, NEKAS" 2 "${JSON}"

JSON='{"hook_event_name":"PreCompact","trigger":"manual","cwd":"/finns/inte/nagonstans"}'
EXPECT_OUT="cwd saknas"
run_case "F6  cwd pekar på obefintlig katalog, NEKAS" 2 "${JSON}"

JSON="$(hook_json 'manual')"
EXPECT_OUT="policyfilen"
run_case "F7  policyfilen saknas helt, NEKAS" 2 "${JSON}" \
    "PRECOMPACT_POLICY=/finns/inte/.precompact-policy.conf"

TRASIG_POLICY="${TEST_DIR}/.trasig-precompact-policy.conf"
# shellcheck disable=SC2016
# Enkelfnuttarna ÄR avsikten: strängen är FIXTUR-INNEHÅLL (en trasig
# bash-syntax som policyfilens `source` ska snubbla på), inte kod som ska
# expandera här — samma disciplin som test-deny-arbetsform-push.sh D4.
printf 'detta ar $(inte giltig bash syntax\n' > "${TRASIG_POLICY}"
JSON="$(hook_json 'manual')"
EXPECT_OUT="gick inte att läsa"
run_case "F8  policyfilen är otolkbar (syntaxfel), NEKAS" 2 "${JSON}" \
    "PRECOMPACT_POLICY=${TRASIG_POLICY}"

rensa_markor

# ============================================================
# E1 — exit-koden på en neka-väg är EXAKT 2.
echo ""
JSON="$(hook_json 'auto')"
(cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}") > /dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  neka-vägens exit-kod är EXAKT 2 (Claude Codes enda garanterat blockerande kod)\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  neka-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-deny-precompact: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
