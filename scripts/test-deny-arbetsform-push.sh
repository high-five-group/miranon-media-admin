#!/usr/bin/env bash
# scripts/test-deny-arbetsform-push.sh
#
# Tvåsidig empirisk testsvit för scripts/deny-arbetsform-push.sh (TASK-149.3,
# ADR-097 § Beslut del 2 — "(a) Spärr vid handlingen"). Samma familjeform som
# scripts/test-deny-subagent-vantan.sh (D/A/F/E-uppdelning, EXPECT_OUT/
# NOT_EXPECT_OUT, PATH_NO_JQ-tekniken).
#
#   D1–D6  Fäller: git push i olika FORMER (direkt, &&-kedjad, $(...)-
#          inbäddad, backtick-inbäddad, sudo-prefixad, -C-prefixad) medan
#          en push-förbjudande arbetsform är aktiv i tillståndsfilen.
#   A1–A7  Släpper: FRÅNVARO av fil (den viktigaste — normalflödet ska
#          ALDRIG träffas), en satt men ICKE-förbjudande arbetsform,
#          icke-push-kommandon (även med förbjudande arbetsform aktiv —
#          bevisar SCOPNINGEN), "git push" nämnt i argument-position (inte
#          kommando-position), ett helt orelaterat verktyg, en pipe-läsning
#          som bara SÖKER efter ordet "push".
#   F1–F6  FAIL-OPEN (unscoped, avsiktligt AVVIKANDE från
#          deny-subagent-vantan.sh F1–F4 — se skriptets § FAIL-OPEN vs
#          FAIL-CLOSED): jq saknas, tom stdin, trasig JSON, tool_name
#          saknas — samtliga SLÄPPER (exit 0), eftersom en missad push är
#          återställbar (T116/T126: 10–30 min mutex-kö) medan att neka
#          VARJE Bash-anrop i hela repot vid ett internt hook-fel vore en
#          oproportionerlig blast-radie.
#   F7–F11 SCOPAT FAIL-CLOSED (spegling av deny-subagent-vantan.sh F5/F6):
#          korrupt tillståndsfil UNDER ett push-försök NEKAS (F7); SAMMA
#          korrupta fil men INTE ett push-försök SLÄPPS (F8) — bevisar att
#          scopningen faktiskt håller. Policyn saknas HELT + tillståndsfil
#          med arbetsform NEKAS (F9); policyn saknas + INGEN tillståndsfil
#          SLÄPPS ändå (F10) — frånvaro vinner alltid över trasig policy.
#          Policyn LADDAS men förbjuden-listan är TOM + arbetsform satt
#          NEKAS (F11) — skilt fall från F9, ett urvattnat regelverk är
#          inte samma sak som ett saknat.
#   E1     Exit-koden på en deny-väg är EXAKT 2.
#
# Test-isolering: TEST_DIR är ett ÄKTA (minimalt) git-repo — hooken kräver
# `git rev-parse --show-toplevel` för att hitta arbetsträdets rot (se
# scripts/deny-arbetsform-push.sh § ARBETSTRÄDETS ROT), en mockad
# katalogstruktur utan .git hade prövat mocken, inte mekanismen. Hook-JSON:s
# `cwd`-fält pekar på TEST_DIR — INTE ${CLAUDE_PROJECT_DIR:-.} — samma
# mekanism som produktionshooken faktiskt använder (premiss-passet i
# skriptets eget huvud).
#
# Användning: bash scripts/test-deny-arbetsform-push.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: TASK-149.3 · scripts/deny-arbetsform-push.sh ·
#        scripts/test-deny-subagent-vantan.sh (mönster-förebild)
# Etablerad: TASK-149.3, 2026-08-07

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task149-3-test-deny-arbetsform-push"
SKRIPT_SRC="${REPO_ROOT}/scripts/deny-arbetsform-push.sh"
POLICY_SRC="${REPO_ROOT}/.arbetsform-push-policy.conf"

SKRIPT="${TEST_DIR}/scripts/deny-arbetsform-push.sh"
POLICY="${TEST_DIR}/.arbetsform-push-policy.conf"
TILLSTANDSFIL="${TEST_DIR}/.claude/arbetsform-tillstand.json"

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
    # jq-guard.sh (TASK-312) sourcas nu av skriptet — samma kopierings-
    # mönster som scripts/lib/supabase-cli.sh i test-deploy-prod-functions.sh.
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

# PATH utan katalogen som äger den riktiga jq-binären (F1). Beräknas en gång
# mot den FAKTISKA jq-platsen — ingen hårdkodning av en specifik katalog.
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

satt_tillstand() {
    local arbetsform="$1" sattare="${2:-test}"
    mkdir -p "$(dirname "${TILLSTANDSFIL}")"
    jq -nc --arg a "${arbetsform}" --arg s "2026-08-07T12:00:00Z" --arg vem "${sattare}" \
        '{arbetsform: $a, satt_vid: $s, sattare: $vem}' > "${TILLSTANDSFIL}"
}

rensa_tillstand() {
    rm -f "${TILLSTANDSFIL}"
}

# hook_json <command> — JSON på formen hooken faktiskt tar emot, med
# cwd = TEST_DIR (den mätt korrekta mekanismen, se skriptets § ARBETSTRÄDETS
# ROT).
hook_json() {
    local cmd="$1"
    jq -nc --arg cmd "${cmd}" --arg cwd "${TEST_DIR}" \
        '{tool_name: "Bash", tool_input: {command: $cmd}, cwd: $cwd}'
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
printf 'test-deny-arbetsform-push: kör testsvit mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# D1–D6 — Fäller: push-förbjudande arbetsform aktiv, olika push-FORMER.
satt_tillstand "iteration" "prototype-skill"

JSON="$(hook_json 'git push origin main')"
EXPECT_OUT="push nekad"
run_case "D1  git push (direkt) NEKAS" 2 "${JSON}"

JSON="$(hook_json 'npm run typecheck && git push')"
EXPECT_OUT="push nekad"
run_case "D2  git push (&&-kedjad) NEKAS" 2 "${JSON}"

# shellcheck disable=SC2016
# Enkelfnuttarna ÄR avsikten: strängen är ett TESTFALL som skickas till
# hooken, inte kod som ska expandera här — samma disciplin som
# scripts/test-deny-grind-genom-pipe.sh.
JSON="$(hook_json 'OUT=$(git push origin main 2>&1)')"
EXPECT_OUT="push nekad"
# shellcheck disable=SC2016
run_case 'D3  git push ($(...)-inbäddad) NEKAS' 2 "${JSON}"

# shellcheck disable=SC2016
JSON='{"tool_name":"Bash","tool_input":{"command":"echo \"`git push origin main`\""},"cwd":"'"${TEST_DIR}"'"}'
EXPECT_OUT="push nekad"
run_case "D4  git push (backtick-inbäddad) NEKAS" 2 "${JSON}"

JSON="$(hook_json 'sudo git push origin main')"
EXPECT_OUT="push nekad"
run_case "D5  sudo git push NEKAS" 2 "${JSON}"

JSON="$(hook_json "git -C ${TEST_DIR} push origin main")"
EXPECT_OUT="push nekad"
run_case "D6  git -C <path> push (globalt flagg-hopp) NEKAS" 2 "${JSON}"

rensa_tillstand

# ============================================================
# A1–A7 — Släpper: den viktigaste halvan. Falsklarm här kostar friktion på
# VARJE git push i hela repot.
echo ""
JSON="$(hook_json 'git push origin main')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A1  git push, INGEN tillståndsfil (frånvaro-regeln) SLÄPPS" 0 "${JSON}"

satt_tillstand "granskning" "test"
JSON="$(hook_json 'git push origin main')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A2  git push, arbetsform satt men EJ i förbjuden-listan SLÄPPS" 0 "${JSON}"
rensa_tillstand

satt_tillstand "iteration" "test"
JSON="$(hook_json 'npm run typecheck')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A3  icke-push-kommando, förbjudande arbetsform AKTIV, SLÄPPS (scopning)" 0 "${JSON}"

JSON="$(hook_json 'git status')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A4  git status (annat git-subkommando), förbjudande arbetsform AKTIV, SLÄPPS" 0 "${JSON}"

JSON="$(hook_json 'echo "kom ihåg: git push när Marcus säger klart"')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A5  \"git push\" i ARGUMENT-position (echo-sträng), ej kommando-position, SLÄPPS" 0 "${JSON}"

JSON='{"tool_name":"Read","tool_input":{"file_path":"/tmp/x"},"cwd":"'"${TEST_DIR}"'"}'
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A6  helt orelaterat verktyg (Read), förbjudande arbetsform AKTIV, SLÄPPS" 0 "${JSON}"

JSON="$(hook_json 'git log --oneline | grep push')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "A7  git log | grep push (söker EFTER ordet, pushar inte) SLÄPPS" 0 "${JSON}"
rensa_tillstand

# ============================================================
# F1–F6 — FAIL-OPEN (unscoped, avsiktligt AVVIKANDE från
# deny-subagent-vantan.sh F1–F4 — se § FAIL-OPEN vs FAIL-CLOSED i
# skriptets huvud). Push-kommando i samtliga, för att pröva den
# STRÄNGASTE tolkningen (om hooken ändå släpper HÄR med ett push-kommando
# framme, är den garanterat fail-open i det svagare fallet också).
echo ""
JSON="$(hook_json 'git push origin main')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F1  fail-open: jq saknas i PATH → SLÄPPS (exit 0) trots push-kommando" 0 "${JSON}" \
    "PATH=${PATH_NO_JQ}"

NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F2  fail-open: tom stdin → SLÄPPS (exit 0)" 0 ""

NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F3  fail-open: trasig JSON på stdin → SLÄPPS (exit 0)" 0 \
    '{"tool_name": detta är inte giltig json'

JSON='{"tool_input":{"command":"git push"},"cwd":"'"${TEST_DIR}"'"}'
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F4  fail-open: tool_name saknas → SLÄPPS (exit 0)" 0 "${JSON}"

JSON='{"tool_name":"Bash","cwd":"'"${TEST_DIR}"'"}'
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F5  fail-open: tool_input.command saknas → SLÄPPS (exit 0)" 0 "${JSON}"

JSON='{"tool_name":"Bash","tool_input":{"command":"git push"},"cwd":"/finns/inte/nagonstans"}'
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F6  fail-open: cwd pekar på en obefintlig katalog → SLÄPPS (exit 0)" 0 "${JSON}"

# ============================================================
# F7–F10 — SCOPAT FAIL-CLOSED, spegling av deny-subagent-vantan.sh F5/F6.
echo ""
mkdir -p "$(dirname "${TILLSTANDSFIL}")"
printf 'detta är inte giltig json' > "${TILLSTANDSFIL}"
JSON="$(hook_json 'git push origin main')"
EXPECT_OUT="korrupt fil"
run_case "F7  scopat fail-closed: KORRUPT tillståndsfil + push-försök → NEKAS (exit 2)" 2 "${JSON}"

JSON="$(hook_json 'npm run typecheck')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F8  SAMMA korrupta fil, EJ push-försök → SLÄPPS (exit 0) — scopningen håller" 0 "${JSON}"
rensa_tillstand

satt_tillstand "iteration" "test"
JSON="$(hook_json 'git push origin main')"
EXPECT_OUT="EXISTERAR"
run_case "F9  scopat fail-closed: policyn saknas HELT + tillståndsfil MED arbetsform + push → NEKAS (exit 2)" 2 "${JSON}" \
    "ARBETSFORM_POLICY=/finns/inte/.arbetsform-push-policy.conf"
rensa_tillstand

JSON="$(hook_json 'git push origin main')"
NOT_EXPECT_OUT="ARBETSFORMENS"
run_case "F10  policyn saknas MEN ingen tillståndsfil → SLÄPPS ändå (exit 0) — frånvaro vinner alltid" 0 "${JSON}" \
    "ARBETSFORM_POLICY=/finns/inte/.arbetsform-push-policy.conf"

# F11 — policyn LADDAS (giltig fil), men ARBETSFORM_PUSH_FORBJUDNA är TOM —
# skilt fall från F9 (policy saknas helt): här går policyn att läsa, men
# regelverket den definierar är urvattnat. Samma princip som
# deny-subagent-vantan.sh F7 ("ett tomt regelverk är inte 'inget att
# neka'").
TOM_POLICY="${TEST_DIR}/.tom-arbetsform-policy.conf"
{
    printf 'ARBETSFORM_TILLSTAND_FILNAMN=".claude/arbetsform-tillstand.json"\n'
    printf 'ARBETSFORM_PUSH_FORBJUDNA=()\n'
} > "${TOM_POLICY}"
satt_tillstand "iteration" "test"
JSON="$(hook_json 'git push origin main')"
EXPECT_OUT="ett trasigt lås"
run_case "F11  policyn LADDAS men förbjuden-listan är TOM + arbetsform satt + push → NEKAS (exit 2)" 2 "${JSON}" \
    "ARBETSFORM_POLICY=${TOM_POLICY}"
rensa_tillstand

# ============================================================
# E1 — exit-koden på en deny-väg är EXAKT 2.
echo ""
satt_tillstand "iteration" "test"
JSON="$(hook_json 'git push origin main')"
(cd "${TEST_DIR}" && printf '%s' "${JSON}" | bash "${SKRIPT}") > /dev/null 2>&1
E1_EXIT=$?
rensa_tillstand
if [[ "${E1_EXIT}" -eq 2 ]]; then
    printf '  ✓ E1  deny-vägens exit-kod är EXAKT 2 (Claude Codes enda garanterat blockerande kod)\n'
    PASSED=$((PASSED + 1))
else
    printf '  ✗ E1  deny-vägen gav exit %s, inte 2\n' "${E1_EXIT}"
    FAILED=$((FAILED + 1))
fi

printf '\ntest-deny-arbetsform-push: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
