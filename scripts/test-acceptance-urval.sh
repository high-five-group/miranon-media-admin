#!/usr/bin/env bash
# scripts/test-acceptance-urval.sh
#
# Empirisk test-suite för scripts/acceptance-urval.sh (TASK-75).
#
# 15 testfall — båda riktningarna, alltså både att urvalet TILLÄMPAS när det
# ska och att det FALLER när det ska:
#   T1  tom sträng (ren docs-diff)                        → full klass
#   T2  enbart blanksteg                                  → full klass
#   T3  EN spec-fil                                       → urval, den filen
#   T4  TRE spec-filer                                    → urval, alla tre
#   T5  en källfil                                        → full klass
#   T6  sömmen tests/acceptance/acceptance-bas.ts          → full klass
#   T7  en giltig spec + en källfil                       → full klass
#   T8  sökvägs-traversal                                 → full klass
#   T9  fel suffix under tests/acceptance/                → full klass
#   T10 nästlad spec (katalog under tests/acceptance/)    → full klass
#   T11 spec som inte finns på disk                       → full klass
#   T12 workflow-fil (kan aldrig bli klass-lokal)         → full klass
#   T13 användningsfel (0 respektive 2 argument)          → exit 2
#   T14 VERKLIGHETSGRINDEN — klassens faktiska spec-filer
#   T15 KOPPLINGSGRINDEN — mekaniken är faktiskt inkopplad
#
# ═══ VARFÖR T14 FINNS: MÖNSTRET MÅSTE MÖTA DISKEN ═══
# Skriptets `SPEC_MONSTER` är den enda plats där formen på en valbar fil är
# nedskriven. Håller mönstret men matchar det inte klassens FAKTISKA filnamn är
# utfallet tyst full klass på varje PR — mekaniken ser installerad ut och gör
# ingenting. T14 kör därför varje fil som faktiskt ligger i `tests/acceptance/`
# genom skriptet och kräver att den väljs. Döps en spec i framtiden till något
# mönstret inte tar (ett `å`, ett mellanslag) fälls sviten här, inte i tystnad.
#
# ═══ VARFÖR T15 FINNS: EN OINKOPPLAD MEKANIK ÄR EN TYST NOLLA ═══
# Formen är `test-classify-post-merge.sh` T13:s, av samma skäl och med samma
# hårda mönster: grinden ankras på faktiska `run:`- och `with:`-rader, aldrig på
# filnamnet som lös substräng — den lösare formen är bevisat fail-open (samma
# fil, S91), eftersom detta testskripts eget filhuvud innehåller strängen.
#
# ═══ STUBBENS GRÄNS ═══
# Denna svit bevisar LOGIKEN och kopplingen. Att urvalet faktiskt förkortar
# körningen bevisas SKARPT i CI med kontrastbevis-körningar (kortets AC#3), och
# att det som hoppas över fångas av post-merge-lagret med en plantad regression
# (AC#4). En grön svit här är nödvändig men inte tillräcklig.
#
# Test-isolering: /tmp/task75-test-urval/ med en riggad filträd-kopia.
# Återställer via trap. INGEN nätverkstrafik.
#
# Användning: bash scripts/test-acceptance-urval.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: backlog TASK-75 · ADR-039 § lesson→grind (L43) · ADR-077 §§ 1+3
# Etablerad: Session 91 (2026-07-29)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/task75-test-urval"
GATE_SRC="${REPO_ROOT}/scripts/acceptance-urval.sh"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

pass() {
    PASSED=$((PASSED + 1))
    echo "  ✅ $1"
}

fel() {
    FAILED=$((FAILED + 1))
    echo "  ❌ $1"
}

# Riggar ett minimalt filträd med samma FORM som repots, så att skriptets
# disk-kontroll prövas mot riktiga filer i stället för mot en attrapp.
setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/tests/acceptance/nastlad"
    mkdir -p "${TEST_DIR}/src/components/hem"
    mkdir -p "${TEST_DIR}/.github/workflows"
    cp "${GATE_SRC}" "${TEST_DIR}/urval.sh"
    chmod +x "${TEST_DIR}/urval.sh"

    : > "${TEST_DIR}/tests/acceptance/hem.acceptance.test.ts"
    : > "${TEST_DIR}/tests/acceptance/persons-list.acceptance.test.ts"
    : > "${TEST_DIR}/tests/acceptance/mer-segment.acceptance.test.ts"
    : > "${TEST_DIR}/tests/acceptance/hjalpare.test.ts"
    : > "${TEST_DIR}/tests/acceptance/acceptance-bas.ts"
    : > "${TEST_DIR}/tests/acceptance/nastlad/djup.acceptance.test.ts"
    : > "${TEST_DIR}/src/components/hem/Hem.tsx"
    : > "${TEST_DIR}/.github/workflows/ci.yml"
}

# Kör grinden i sandlådan och jämför stdout mot väntat urval.
#
# VIKTIGT: stdout jämförs EXAKT. Skriptets motivering går till stderr just för
# att stdout ska kunna konsumeras rått av workflowen — läcker en motivering ut
# på stdout blir den en del av argumentlistan till Playwright, och detta test
# är platsen den läckan fångas.
prova() {
    local namn="$1" indata="$2" vantat="$3"
    local faktiskt
    faktiskt=$(cd "${TEST_DIR}" && ./urval.sh "${indata}" 2>/dev/null)
    if [[ "${faktiskt}" == "${vantat}" ]]; then
        pass "${namn}"
    else
        fel "${namn} — väntade '${vantat}', fick '${faktiskt}'"
    fi
}

setup

echo "── Urvalet FALLER när det ska (allowlist-golvet) ──"
prova "T1  tom sträng → full klass" "" ""
prova "T2  enbart blanksteg → full klass" "   " ""
prova "T5  källfil → full klass" "src/components/hem/Hem.tsx" ""
prova "T6  sömmen acceptance-bas.ts → full klass" "tests/acceptance/acceptance-bas.ts" ""
prova "T7  giltig spec + källfil → full klass" \
    "tests/acceptance/hem.acceptance.test.ts src/components/hem/Hem.tsx" ""
prova "T8  sökvägs-traversal → full klass" \
    "tests/acceptance/../../etc/passwd" ""
prova "T9  fel suffix → full klass" "tests/acceptance/hjalpare.test.ts" ""
prova "T10 nästlad spec → full klass" \
    "tests/acceptance/nastlad/djup.acceptance.test.ts" ""
prova "T11 spec saknas på disk → full klass" \
    "tests/acceptance/finns-inte.acceptance.test.ts" ""
prova "T12 workflow-fil → full klass" ".github/workflows/ci.yml" ""

echo ""
echo "── Urvalet TILLÄMPAS när det ska ──"
prova "T3  en spec-fil → urval" \
    "tests/acceptance/hem.acceptance.test.ts" \
    "tests/acceptance/hem.acceptance.test.ts"
prova "T4  tre spec-filer → urval" \
    "tests/acceptance/hem.acceptance.test.ts tests/acceptance/persons-list.acceptance.test.ts tests/acceptance/mer-segment.acceptance.test.ts" \
    "tests/acceptance/hem.acceptance.test.ts tests/acceptance/persons-list.acceptance.test.ts tests/acceptance/mer-segment.acceptance.test.ts"

echo ""
echo "── T13: användningsfel är FAIL-LOUD, aldrig tyst full klass ──"
(cd "${TEST_DIR}" && ./urval.sh > /dev/null 2>&1)
kod=$?
if [[ "${kod}" -eq 2 ]]; then
    pass "T13a noll argument → exit 2"
else
    fel "T13a noll argument gav exit ${kod}, väntade 2"
fi

(cd "${TEST_DIR}" && ./urval.sh "a" "b" > /dev/null 2>&1)
kod=$?
if [[ "${kod}" -eq 2 ]]; then
    pass "T13b två argument → exit 2"
else
    fel "T13b två argument gav exit ${kod}, väntade 2"
fi

echo ""
echo "── T14: VERKLIGHETSGRINDEN — klassens faktiska spec-filer ──"
antal_specar=0
misslyckade=""
for spec in "${REPO_ROOT}"/tests/acceptance/*.acceptance.test.ts; do
    [[ -e "${spec}" ]] || continue
    rel="tests/acceptance/$(basename "${spec}")"
    antal_specar=$((antal_specar + 1))
    ut=$(cd "${REPO_ROOT}" && bash "${GATE_SRC}" "${rel}" 2>/dev/null)
    if [[ "${ut}" != "${rel}" ]]; then
        misslyckade="${misslyckade} ${rel}"
    fi
done

if [[ "${antal_specar}" -eq 0 ]]; then
    fel "T14a hittade NOLL spec-filer i tests/acceptance/ — grinden mäter ingenting"
elif [[ -n "${misslyckade}" ]]; then
    fel "T14a dessa faktiska spec-filer väljs INTE av mönstret:${misslyckade}"
    echo "     Fix: vidga SPEC_MONSTER i ${GATE_SRC}, eller döp om filen."
else
    pass "T14a alla ${antal_specar} faktiska spec-filer väljs av mönstret"
fi

# Sömmen får ALDRIG bli valbar — den delas av hela klassen, och ett urval på den
# hade kört en delmängd mot en ändrad gemensam söm. Sedan TASK-123 är sömmen en
# platt fil (`tests/acceptance/acceptance-bas.ts`, tidigare
# `tests/acceptance/support/acceptance-bas.ts`) — SÖKVÄGEN prövas mot disk här
# så en framtida omdöpning av den faktiska sömmen fälls i stället för att tyst
# fortsätta "passera" mot en sökväg som inte längre existerar.
SOM_PATH="tests/acceptance/acceptance-bas.ts"
if [[ ! -f "${REPO_ROOT}/${SOM_PATH}" ]]; then
    fel "T14b den faktiska sömmen finns inte på ${SOM_PATH} — testet mäter fel fil"
else
    som_ut=$(cd "${REPO_ROOT}" && bash "${GATE_SRC}" "${SOM_PATH}" 2>/dev/null)
    if [[ -z "${som_ut}" ]]; then
        pass "T14b den faktiska sömmen ${SOM_PATH} faller till full klass"
    else
        fel "T14b sömmen valdes ('${som_ut}') — en ändrad söm rör hela klassen"
    fi
fi

echo ""
echo "── T15: KOPPLINGSGRINDEN — mekaniken är faktiskt inkopplad ──"
CI_YML="${REPO_ROOT}/.github/workflows/ci.yml"
SUITE_YML="${REPO_ROOT}/.github/workflows/ci-suite.yml"

if grep -qE '^[[:space:]]+urval=\$\(bash scripts/acceptance-urval\.sh' "${CI_YML}"; then
    pass "T15a ci.yml kör faktiskt scripts/acceptance-urval.sh"
else
    fel "T15a ci.yml har inget anrop av scripts/acceptance-urval.sh — urvalet är frånkopplat."
fi

if grep -qE '^[[:space:]]+acceptance_urval:[[:space:]]' "${CI_YML}"; then
    pass "T15b changed-jobbet exponerar outputen acceptance_urval"
else
    fel "T15b changed-jobbet saknar outputen acceptance_urval — utfallet når aldrig suite-jobbet."
fi

if grep -qE '^[[:space:]]+acceptance_selection:[[:space:]]+\$\{\{[[:space:]]*needs\.changed\.outputs\.acceptance_urval' "${CI_YML}"; then
    pass "T15c suite-jobbet får urvalet via acceptance_selection"
else
    fel "T15c suite-jobbet skickar inte needs.changed.outputs.acceptance_urval — urvalet når aldrig sviten."
fi

if grep -qE '^[[:space:]]+acceptance_selection:$' "${SUITE_YML}"; then
    pass "T15d ci-suite.yml deklarerar inputen acceptance_selection"
else
    fel "T15d ci-suite.yml saknar inputen acceptance_selection."
fi

if grep -qE 'ACCEPTANCE_URVAL:[[:space:]]+\$\{\{[[:space:]]*inputs\.acceptance_selection' "${SUITE_YML}"; then
    pass "T15e acceptance-jobbet läser inputen (ACCEPTANCE_URVAL)"
else
    fel "T15e acceptance-jobbet läser aldrig inputen — den är deklarerad men död."
fi

# DEFAULTEN ÄR SKYDDSNÄTET. Vore den något annat än tom sträng hade
# post-merge.yml och nightly.yml — som inte skickar inputen — ärvt ett urval,
# och då hade full-svit-nätet under PR-grinden upphört att finnas.
if awk '/^      acceptance_selection:$/{f=1} f&&/^        default: /{print;exit}' "${SUITE_YML}" | grep -qE "default: ''"; then
    pass "T15f defaulten är tom sträng — post-merge och nightly kör full klass"
else
    fel "T15f defaulten för acceptance_selection är INTE tom sträng — post-merge-nätet är brutet."
fi

echo ""
echo "── Resultat: ${PASSED} passerade, ${FAILED} failade ──"
if [[ "${FAILED}" -gt 0 ]]; then
    exit 1
fi
exit 0
