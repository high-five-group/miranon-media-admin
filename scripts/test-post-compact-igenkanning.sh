#!/usr/bin/env bash
# scripts/test-post-compact-igenkanning.sh
#
# Tvåsidig empirisk testsvit för scripts/post-compact-igenkanning.sh
# (TASK-160.4, ADR-101 § Beslut 5). Samma familjeform som
# scripts/test-deny-precompact.sh / scripts/test-deny-arbetsform-push.sh
# (EXPECT_OUT/NOT_EXPECT_OUT, PATH_NO_JQ-tekniken, äkta git-repo som
# TEST_DIR, cwd i hook-JSON pekar dit).
#
#   I1–I3  INJICERAR (exit 0, additionalContext närvarande):
#     I1  source=compact, markörfilen NÄRVARANDE → injicerar, nämner
#         markörfilens sökväg och att den tas bort som del av
#         omorienteringen
#     I2  source=compact, INGEN markörfil → injicerar ÄNDÅ (AC 1 gatar inte
#         på markörens närvaro — omorienteringen gäller oavsett), texten
#         säger att ingen markör hittades
#     I3  source=compact, .precompact-policy.conf SAKNAS (sekvenslucka
#         TASK-160.2 ej landad) → injicerar ändå, med DEFAULT-filnamnet
#         (.claude/precompact-markor.json) i texten — visar att
#         fallback-vägen fungerar
#   T1–T5  TYST (exit 0, TOMT stdout — ingen additionalContext alls):
#     T1  source=startup → tyst
#     T2  source=resume → tyst
#     T3  source=clear → tyst
#     T4  source=fork → tyst
#     T5  source-fältet SAKNAS helt → tyst (samma gren som ett okänt värde)
#   F1–F5  FAIL-OPEN — internt fel ska INTE hindra sessionen (den kan ändå
#          inte blockeras, se skriptets § FAIL-OPEN) OCH ska vara HELT TYST
#          (exit 0, tomt stdout, inget stderr) — det medvetna valet:
#     F1  jq saknas i PATH → tyst, exit 0
#     F2  tom stdin → tyst, exit 0
#     F3  trasig JSON på stdin → tyst, exit 0
#     F4  cwd saknas i hook-indatan (source=compact i övrigt) → tyst, exit 0
#     F5  cwd pekar på en obefintlig katalog (source=compact) → tyst, exit 0
#   E1  Exit-koden är EXAKT 0 i SAMTLIGA fall (I, T och F) — denna hook har
#       ingen blockerande väg alls (SessionStart kan strukturellt inte
#       blockeras, premiss-passet i skriptets huvud).
#
# Test-isolering: TEST_DIR är ett ÄKTA (minimalt) git-repo — skriptet kräver
# `git rev-parse --show-toplevel` för att hitta arbetsträdets rot (samma
# skäl som test-deny-precompact.sh). Hook-JSON:s `cwd`-fält pekar på
# TEST_DIR.
#
# Användning: bash scripts/test-post-compact-igenkanning.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-160.4 · scripts/post-compact-igenkanning.sh ·
#        scripts/test-deny-precompact.sh (mönster-förebild)
# Etablerad: TASK-160.4, 2026-08-07

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task160-4-test-post-compact-igenkanning"
SKRIPT_SRC="${REPO_ROOT}/scripts/post-compact-igenkanning.sh"
POLICY_SRC="${REPO_ROOT}/.precompact-policy.conf"

SKRIPT="${TEST_DIR}/scripts/post-compact-igenkanning.sh"
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
    # jq-guard.sh (TASK-312) sourcas nu av skriptet.
    cp "${REPO_ROOT}/scripts/lib/jq-guard.sh" "${TEST_DIR}/scripts/lib/jq-guard.sh"
    cp "${REPO_ROOT}/.jq-version-policy.conf" "${TEST_DIR}/.jq-version-policy.conf"
    # § SEKVENSBEROENDE (skriptets huvud): .precompact-policy.conf landar
    # via TASK-160.2 och finns INTE på main ännu i denna byggsession. Om
    # repot ÄNDÅ råkar bära filen (t.ex. körs efter #943 landat) kopieras
    # den in här så I1/I2 speglar det verkliga läget; annars körs I1/I2 mot
    # skriptets inbyggda fallback-default — I3 testar EXPLICIT den
    # sistnämnda grenen genom att peka PRECOMPACT_POLICY på en obefintlig
    # fil oavsett vad repot faktiskt bär.
    if [[ -f "${POLICY_SRC}" ]]; then
        cp "${POLICY_SRC}" "${POLICY}"
    fi
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

# satt_markor — en minimal giltig markör (schema per ADR-101 § Beslut 4 /
# .precompact-policy.conf § JSON-FORMEN). Innehållet gates inte av detta
# skript (bara filens NÄRVARO läses), så en enkel fixtur räcker.
satt_markor() {
    mkdir -p "$(dirname "${MARKORFIL}")"
    jq -nc '{fokus_instruktion: "testens fokus", satt_vid: "2026-08-07T21:00:00Z", sattare: "test"}' > "${MARKORFIL}"
}

rensa_markor() {
    rm -f "${MARKORFIL}"
}

# hook_json <source> — JSON på formen hooken faktiskt tar emot (premiss-
# passet i post-compact-igenkanning.sh:s huvud), med cwd = TEST_DIR.
hook_json() {
    local source="$1"
    jq -nc --arg s "${source}" --arg cwd "${TEST_DIR}" \
        '{hook_event_name: "SessionStart", source: $s, cwd: $cwd, session_id: "test-session"}'
}

# run_case <namn> <väntad exit> <json> [env-tilldelningar...]
EXPECT_OUT=""
NOT_EXPECT_OUT=""
EXPECT_EMPTY="false"

run_case() {
    local name="$1" want="$2" json="$3"
    shift 3
    local got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}" want_empty="${EXPECT_EMPTY}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    EXPECT_EMPTY="false"
    (cd "${TEST_DIR}" && printf '%s' "${json}" | env "$@" bash "${SKRIPT}") > "${TEST_DIR}/out.txt" 2> "${TEST_DIR}/err.txt"
    got=$?

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      stdout: /' "${TEST_DIR}/out.txt" | head -10
        sed 's/^/      stderr: /' "${TEST_DIR}/err.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ "${want_empty}" == "true" ]]; then
        if [[ -s "${TEST_DIR}/out.txt" ]]; then
            printf '  ✗ %s — stdout skulle vara TOMT men innehöll data\n' "${name}"
            sed 's/^/      stdout: /' "${TEST_DIR}/out.txt" | head -10
            FAILED=$((FAILED + 1))
            return
        fi
        if [[ -s "${TEST_DIR}/err.txt" ]]; then
            printf '  ✗ %s — stderr skulle vara TOMT men innehöll data\n' "${name}"
            sed 's/^/      stderr: /' "${TEST_DIR}/err.txt" | head -10
            FAILED=$((FAILED + 1))
            return
        fi
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      stdout: /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      stdout: /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$((FAILED + 1))
        return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$((PASSED + 1))
}

setup
compute_path_no_jq
printf 'test-post-compact-igenkanning: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# I1–I3 — INJICERAR: source=compact, i olika markör-/policylägen.
satt_markor
JSON="$(hook_json 'compact')"
EXPECT_OUT="COMPACT-FORMEN (ADR-101, TASK-160.4)"
run_case "I1  source=compact, markörfil NÄRVARANDE, INJICERAR med markörens sökväg" 0 "${JSON}"

if grep -qF -- "${MARKORFIL}" "${TEST_DIR}/out.txt" && grep -qF -- "tas bort" "${TEST_DIR}/out.txt"; then
    printf '  ✓ I1b  texten nämner markörfilens sökväg + att den tas bort som del av omorienteringen\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ I1b  texten saknade markörens sökväg eller "tas bort"\n'
    FAILED=$((FAILED + 1))
fi
rensa_markor

JSON="$(hook_json 'compact')"
EXPECT_OUT="Ingen markörfil hittades"
run_case "I2  source=compact, INGEN markörfil, INJICERAR ÄNDÅ (gatar inte på markörens närvaro)" 0 "${JSON}"

JSON="$(hook_json 'compact')"
EXPECT_OUT=".claude/precompact-markor.json"
run_case "I3  source=compact, .precompact-policy.conf SAKNAS (sekvenslucka), fallback-DEFAULT-filnamn i texten" 0 "${JSON}" \
    "PRECOMPACT_POLICY=/finns/inte/.precompact-policy.conf"

# ============================================================
# T1–T5 — TYST: alla källor utom compact, samt saknat source-fält.
echo ""
JSON="$(hook_json 'startup')"
EXPECT_EMPTY="true"
run_case "T1  source=startup, TYST (tomt stdout)" 0 "${JSON}"

JSON="$(hook_json 'resume')"
EXPECT_EMPTY="true"
run_case "T2  source=resume, TYST" 0 "${JSON}"

JSON="$(hook_json 'clear')"
EXPECT_EMPTY="true"
run_case "T3  source=clear, TYST" 0 "${JSON}"

JSON="$(hook_json 'fork')"
EXPECT_EMPTY="true"
run_case "T4  source=fork, TYST" 0 "${JSON}"

JSON='{"hook_event_name":"SessionStart","cwd":"'"${TEST_DIR}"'","session_id":"test-session"}'
EXPECT_EMPTY="true"
run_case "T5  source-fältet saknas helt, TYST" 0 "${JSON}"

# ============================================================
# F1–F5 — FAIL-OPEN: internt fel ska vara HELT TYST, aldrig hindra
# sessionen (den kan ändå inte blockeras — se § FAIL-OPEN i skriptets
# huvud). Körs med source=compact i övrigt (utom F2/F3 där stdin ÄR felet)
# för att pröva den STRÄNGASTE tolkningen.
echo ""
JSON="$(hook_json 'compact')"
EXPECT_EMPTY="true"
run_case "F1  jq saknas i PATH, TYST trots source=compact" 0 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

EXPECT_EMPTY="true"
run_case "F2  tom stdin, TYST" 0 ""

EXPECT_EMPTY="true"
run_case "F3  trasig JSON på stdin, TYST" 0 \
    '{"source": detta är inte giltig json'

JSON='{"hook_event_name":"SessionStart","source":"compact","session_id":"test-session"}'
EXPECT_EMPTY="true"
run_case "F4  cwd saknas i hook-indatan (source=compact), TYST" 0 "${JSON}"

JSON='{"hook_event_name":"SessionStart","source":"compact","cwd":"/finns/inte/nagonstans","session_id":"test-session"}'
EXPECT_EMPTY="true"
run_case "F5  cwd pekar på obefintlig katalog (source=compact), TYST" 0 "${JSON}"

# ============================================================
# E1 — exit-koden är EXAKT 0 i samtliga fall (ingen blockerande väg finns).
echo ""
JSON="$(hook_json 'compact')"
(cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}") > /dev/null 2>&1
E1_EXIT=$?
if [[ "${E1_EXIT}" -eq 0 ]]; then
    printf '  ✓ E1  exit-koden är EXAKT 0 (SessionStart har ingen blockerande väg, premiss-passet)\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  gav exit %s, inte 0\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-post-compact-igenkanning: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
