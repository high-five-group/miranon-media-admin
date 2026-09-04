#!/usr/bin/env bash
# scripts/test-heartbeat-svep.sh
#
# Empirisk testsvit för scripts/heartbeat-svep.sh (TASK-119 + TASK-128 +
# TASK-135 + fynd 2026-08-04 om HEARTBEAT_EXEMPT_AUTHORS). Räkningen längst
# ned i filen ("X passerade") är den AUKTORITATIVA totalen — mätt, aldrig
# handräknad hit (TASK-106-disciplinen: en kopierad räkning kan bli fel utan
# att någon märker det). Tyngdpunkt på AC#1:s krav: tvåsidigt bevis per väg
# (planterat fall fälls, rent fall släpps), för VAR OCH EN av de tre
# namngivna vägarna plus den fjärde (armerings-kandidat) ur samma tabell:
#
#   T1  RÖTT planterat (check-rollup FAILURE)              → bit 1 satt
#   T2  RÖTT rent (samma PR, rollup SUCCESS)                → bit 1 EJ satt
#   T3  DIRTY planterat (mergeStateStatus DIRTY)            → bit 2 satt
#   T4  DIRTY rent (mergeStateStatus CLEAN, armerad)         → bit 2 EJ satt
#   T5  KANDIDAT planterat (CLEAN, ej armerad, ej draft)     → bit 4 satt
#   T6  KANDIDAT rent — redan ARMERAD                        → bit 4 EJ satt
#   T7  KANDIDAT rent — DRAFT                                 → bit 4 EJ satt
#   T8  KANDIDAT rent — BLOCKED (varken CLEAN eller UNSTABLE) → bit 4 EJ satt
#   T9  KANDIDAT planterat — UNSTABLE räknas också             → bit 4 satt
#   T9b KANDIDAT rent — KÖAD (isInMergeQueue=true), PR #617-mönstret,   (TASK-128)
#       annars identisk med T5 — en armerad OCH köad PR ska INTE larma  → bit 4 EJ satt
#   T9c KANDIDAT planterat — genuint UTSPARKAD (isInMergeQueue=false,   (TASK-128)
#       i övrigt identiskt med T9b) → ska FORTFARANDE larma             → bit 4 satt
#   T10 KOMBINERAT — en RÖD-PR + en DIRTY-PR samtidigt         → bitmask 3
#   T11 main-SHA AVANCERAR mellan två sopningar (delat state)  → larmrad
#   T12 main-SHA OFÖRÄNDRAD mellan två sopningar               → ingen larmrad
#   T13 fail-closed: gh-anropet för main-SHA misslyckas        → 77
#   T14 fail-closed: gh-anropet för pr-listan misslyckas       → 77
#   T15 användningsfel: REPO saknas (ingen config, ingen flagga) → 64
#   T16 användningsfel: ogiltigt --interval (0)                  → 64
#   T17 användningsfel: ogiltigt --timeout (icke-numeriskt)      → 64
#   T18 --once loopar ALDRIG (även med stort --interval)         → snabb
#   T19 loop-läge, --timeout-bundet, flera iterationer            → sista verdikt
#   T20 tom PR-lista → 0 granskade, ALLT LUGNT                    → 0
#   T21 --quiet dämpar rutin-rader men ALDRIG larm-rader (L443)    → RÖTT syns
#   T22 --quiet vid STABILT, KÄNT läge → helt tyst stdout           → tomt
#   T23 KALLSTART: "main-SHA-baslinje satt" syns ÄVEN under --quiet (TASK-135)
#       — fäller på det orörda skriptet (kallstart gick via say()), passerar
#       efter fixen (alarm())                                       → ALLTID-PÅ
#   T24 --help visar den utökade ALLTID-PÅ/KALLSTART-texten (TASK-135) → syns
#   T25 undantagen PR (author=dependabot) → PARKERAD-rutinrad, INGET
#       kandidat-larm, ALDRIG "ARMERINGS-KANDIDAT" i utdatan    → bit 4 EJ satt
#   T25b samma undantagna PR under --quiet → PARKERAD-raden dämpas (helt
#        tyst stdout, samma --quiet-immunitet-KLASS som T22, inte ALLTID-PÅ)
#   T26 icke-undantagen författare (t.ex. en människas PR) → larmar
#       FORTFARANDE som kandidat — undantaget överexkluderar inte  → bit 4 satt
#   T27 HEARTBEAT_EXEMPT_AUTHORS SAKNAS helt i policyn (odefinierad
#       variabel) → fail-open, dependabot-PR:en larmar ändå        → bit 4 satt
#   T27b HEARTBEAT_EXEMPT_AUTHORS definierad men TOM (()) → samma
#        fail-open, samma larm                                     → bit 4 satt
#
# Test-isolering: /tmp/task119-test-heartbeat-svep/ med en gh-stub som svarar
# ur ett scenario-katalog (main-sha / rows / fail-mainsha / fail-prlist).
# INGEN nätverkstrafik, inget riktigt gh-anrop, ingen ändring i real-repot,
# eget HEARTBEAT_STATE_DIR (rör aldrig det riktiga tillståndet).
#
# LAYOUTEN SPEGLAR PRODUKTIONEN: skriptet kopieras till
# ${TEST_DIR}/scripts/heartbeat-svep.sh och den RIKTIGA policy-filen till
# ${TEST_DIR}/.heartbeat-svep-policy.conf — samma relation som i repot, så
# den FAKTISKA default-upplösningen av policy-sökvägen provas (T15 är
# undantaget: den pekar HEARTBEAT_SVEP_POLICY på en sökväg som inte finns).
#
# STUBBENS GRÄNS, öppet skriven (samma disciplin som test-staging-semaphore.sh
# § "STUBBENS GRÄNS"): gh:s `--jq`/`-f query=` körs INNE i den riktiga `gh`-
# binären, så stubben här levererar redan färdig, förberäknad TSV-utdata —
# den kör aldrig det verkliga GraphQL-uttrycket. Sviten bevisar därmed
# SKRIPTETS EGEN klassningslogik (RÖTT/DIRTY/KANDIDAT-besluten i bash), inte
# att GraphQL-frågan matchar det verkliga API:t. Den kopplingen är i stället
# verifierad SKARPT mot live-API:t under TASK-119-bygget 2026-08-02:
#   - `gh api graphql` med exakt samma fråga kördes mot
#     high-five-group/miranon-media-admin (PR #611, ett stängt ärende) och
#     gav `{"number":611,"red":false,"verdicts":["OK","OK",...]}` — alla åtta
#     jobb SUCCESS, korrekt klassat som icke-rött.
#   - `commits(last:1).commit.statusCheckRollup.state` verifierades via
#     introspektion vara ett NON_NULL StatusState-enum med exakt fem värden
#     (SUCCESS, FAILURE, ERROR, PENDING, EXPECTED) — den uttömmande listan
#     bash-klassningen nedan (T1/T2 m.fl.) bygger på.
#   - `gh api repos/<repo>/commits/<branch> --jq .sha` kördes skarpt mot
#     samma repo och gav samma SHA som `git fetch` redan visat lokalt.
# Ändras GraphQL-frågan eller fält-antagandena ska en ny skarp körning göras.
#
# Användning: bash scripts/test-heartbeat-svep.sh
# Exit 0 om alla testfall passerar, 1 annars.
#
# Källa: CLAUDE.md § Landning · tasks/lessons.md L443 · TASK-119 · TASK-135 ·
#        .heartbeat-svep-policy.conf § "PR-författare vars öppna PR:ar
#        ALDRIG larmar som ARMERINGS-KANDIDAT"
# Etablerad: TASK-119, 2026-08-02 · utökad TASK-128 (2026-08-03) · TASK-135
# (2026-08-04, T23/T24 — kallstart-rad + --help-täckning) · fynd 2026-08-04
# (T25–T27b — HEARTBEAT_EXEMPT_AUTHORS, dependabot-kvartetten #632–#635)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="/tmp/task119-test-heartbeat-svep"
SKRIPT_SRC="${REPO_ROOT}/scripts/heartbeat-svep.sh"
POLICY_SRC="${REPO_ROOT}/.heartbeat-svep-policy.conf"

SKRIPT="${TEST_DIR}/scripts/heartbeat-svep.sh"
SCEN="${TEST_DIR}/scenario"
STATE_DIR="${TEST_DIR}/state"

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
    mkdir -p "${TEST_DIR}/bin" "${TEST_DIR}/scripts" "${SCEN}" "${STATE_DIR}"
    cp "${SKRIPT_SRC}" "${SKRIPT}"
    chmod +x "${SKRIPT}"
    cp "${POLICY_SRC}" "${TEST_DIR}/.heartbeat-svep-policy.conf"

    # gh-stub. Svarar ur ${SCEN}:
    #   main-sha       en rad, SHA:t "commits/<branch>"-anropet ska returnera
    #   rows           förberäknade TSV-rader, som gh:s --jq redan hade gjort
    #   fail-mainsha   NÄRVARO ⇒ main-SHA-anropet misslyckas (exit 1)
    #   fail-prlist    NÄRVARO ⇒ pr-lista-anropet (graphql) misslyckas (exit 1)
    cat > "${TEST_DIR}/bin/gh" <<'STUB'
#!/usr/bin/env bash
SCEN="${T119_SCEN}"
if [ "${1:-}" = "api" ]; then
    if [ "${2:-}" = "graphql" ]; then
        if [ -f "${SCEN}/fail-prlist" ]; then exit 1; fi
        [ -f "${SCEN}/rows" ] && cat "${SCEN}/rows"
        exit 0
    fi
    # övriga `gh api`-anrop i detta skript är alla main-SHA-uppslaget:
    # "repos/<repo>/commits/<branch>" --jq .sha
    if [ -f "${SCEN}/fail-mainsha" ]; then exit 1; fi
    [ -f "${SCEN}/main-sha" ] && cat "${SCEN}/main-sha"
    exit 0
fi
exit 0
STUB
    chmod +x "${TEST_DIR}/bin/gh"

    # Baseline-scenario: inga fel, inga PR:ar, ett stabilt SHA.
    printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
    : > "${SCEN}/rows"
    rm -f "${SCEN}/fail-mainsha" "${SCEN}/fail-prlist"
}

# reset_scen: återställ scenariot till en ren baseline MELLAN testfall, utan
# att riva hela TEST_DIR (state-katalogen ska normalt nollställas per fall
# så main-SHA-baseline inte läcker mellan oberoende testfall — T11/T12
# hanterar sitt eget delade state explicit och anropar INTE denna).
reset_scen() {
    printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
    : > "${SCEN}/rows"
    rm -f "${SCEN}/fail-mainsha" "${SCEN}/fail-prlist"
    rm -rf "${STATE_DIR}"
    mkdir -p "${STATE_DIR}"
}

set_rows() { printf '%b' "$1" > "${SCEN}/rows"; }

# EXPECT_OUT sätts FÖRE ett run_case-anrop för att dessutom kräva en sträng i
# utdatan. NOT_EXPECT_OUT sätts för att kräva att en sträng SAKNAS (används
# för T2/T4/T6/T7/T8/T12/T21/T22 — "rent fall släpps" bevisas genom att
# larmraden INTE finns, inte bara av exit-koden). Båda nollställs av
# run_case så de aldrig läcker till nästa fall.
EXPECT_OUT=""
NOT_EXPECT_OUT=""

# run_case <namn> <förväntad exit> <max sekunder eller "-"> <env-tilldelningar...> -- <args...>
run_case() {
    local name="$1" want="$2" maxsec="$3"; shift 3
    local start elapsed got expect="${EXPECT_OUT}" nexpect="${NOT_EXPECT_OUT}"
    EXPECT_OUT=""
    NOT_EXPECT_OUT=""
    start="$(date +%s)"
    ( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
        HEARTBEAT_STATE_DIR="${STATE_DIR}" \
        "$@" ) >"${TEST_DIR}/out.txt" 2>&1
    got=$?
    elapsed=$(( $(date +%s) - start ))

    if [[ "${got}" -ne "${want}" ]]; then
        printf '  ✗ %s — exit %s, väntade %s\n' "${name}" "${got}" "${want}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ "${maxsec}" != "-" && "${elapsed}" -gt "${maxsec}" ]]; then
        printf '  ✗ %s — tog %ss, max %ss\n' "${name}" "${elapsed}" "${maxsec}"
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${expect}" ]] && ! grep -qF -- "${expect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan saknade "%s"\n' "${name}" "${expect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    if [[ -n "${nexpect}" ]] && grep -qF -- "${nexpect}" "${TEST_DIR}/out.txt"; then
        printf '  ✗ %s — utdatan innehöll oväntat "%s"\n' "${name}" "${nexpect}"
        sed 's/^/      /' "${TEST_DIR}/out.txt" | head -10
        FAILED=$(( FAILED + 1 )); return
    fi
    printf '  ✓ %s\n' "${name}"
    PASSED=$(( PASSED + 1 ))
}

setup
# INGET hårdkodat antal här (TASK-106-disciplinen: en kopierad räkning kan
# bli fel mot skriptets egen slutrad utan att någon märker det — det hände
# just den raden en gång: "nio" mot "tio"). Den enda AUKTORITATIVA totalen
# är "X passerade" på slutraden, räknad av PASSED/FAILED-motorn nedan i
# samma körning som producerar den — inte handräknad hit.
printf 'test-heartbeat-svep: kör mot %s\n\n' "${SKRIPT_SRC}"

# ============================================================
# T1/T2 — RÖTT: tvåsidigt bevis (planterat fälls, rent släpps).
# mergeStateStatus=BLOCKED här medvetet: isolerar RÖTT-vägen från
# KANDIDAT-vägen (som kräver CLEAN/UNSTABLE), så testet bara mäter EN sak.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
EXPECT_OUT="RÖTT — PR #572"
run_case "T1  RÖTT planterat (check-rollup FAILURE) → bit 1" 1 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="RÖTT"
run_case "T2  RÖTT rent (samma PR, rollup SUCCESS) → bit 1 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T3/T4 — DIRTY: tvåsidigt bevis. automerge=true här medvetet: isolerar
# DIRTY-vägen från KANDIDAT-vägen (som kräver automerge=false).
reset_scen
set_rows '575\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\n'
EXPECT_OUT="DIRTY — PR #575"
run_case "T3  DIRTY planterat (mergeStateStatus DIRTY) → bit 2" 2 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '575\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="DIRTY"
run_case "T4  DIRTY rent (CLEAN, armerad) → bit 2 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T5–T9c — ARMERINGS-KANDIDAT: fjärde vägen (§ Landning-tabellen,
# "armering-är-inte-minne"). Sju fall: ett planterat, tre rena varianter
# (armerad / draft / fel mergeStateStatus), ett andra planterat fall
# (UNSTABLE räknas också, inte bara CLEAN), och TASK-128:s par — köad
# (isInMergeQueue=true) som INTE ska larma vs. genuint utsparkad
# (isInMergeQueue=false) som FORTFARANDE ska larma. Alla T1–T9 sätter
# isInMergeQueue=false explicit (6:e TSV-kolumnen) — den dimensionen
# ska inte påverka RÖTT/DIRTY/de äldre KANDIDAT-varianterna.
reset_scen
set_rows '565\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #565"
run_case "T5  KANDIDAT planterat (CLEAN, ej armerad, ej draft) → bit 4" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tCLEAN\ttrue\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T6  KANDIDAT rent — redan armerad → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\ttrue\tCLEAN\tfalse\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T7  KANDIDAT rent — draft → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tBLOCKED\tfalse\tSUCCESS\tfalse\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T8  KANDIDAT rent — BLOCKED (ej CLEAN/UNSTABLE) → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '565\tfalse\tUNSTABLE\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #565"
run_case "T9  KANDIDAT planterat — UNSTABLE räknas också → bit 4" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# T9b/T9c (TASK-128) — isInMergeQueue är den enda skillnaden mellan raderna:
# samma nummer (#617, det verkligt mätta PR:et), samma CLEAN/ej-draft/
# ej-automerge-villkor. Det ISOLERAR exakt den nya diskriminatorn.
reset_scen
set_rows '617\tfalse\tCLEAN\tfalse\tSUCCESS\ttrue\n'
NOT_EXPECT_OUT="KANDIDAT"
run_case "T9b KANDIDAT rent — KÖAD (isInMergeQueue=true, PR #617-mönstret) → bit 4 EJ satt" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '617\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #617"
run_case "T9c KANDIDAT planterat — genuint UTSPARKAD (isInMergeQueue=false) → bit 4 fortfarande satt" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T10 — KOMBINERAT. En RÖD PR och en DIRTY PR samtidigt, olika PR-nummer.
# Bitmask-summering: 1 (RÖTT) | 2 (DIRTY) = 3. Båda larmraderna ska synas.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n575\tfalse\tDIRTY\ttrue\tSUCCESS\tfalse\n'
run_case "T10 KOMBINERAT — RÖD + DIRTY samtidigt → bitmask 3" 3 - \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF "RÖTT — PR #572" "${TEST_DIR}/out.txt" && grep -qF "DIRTY — PR #575" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T10b  båda larmraderna syns i samma svep\n'; PASSED=$(( PASSED + 1 ))
else
    printf '  ✗ T10b  saknar en av larmraderna\n'; FAILED=$(( FAILED + 1 ))
fi

# ============================================================
# T11/T12 — main-SHA: AVANCEMANG är edge-triggered (en landning är en
# diskret händelse, inte ett ihållande larm-tillstånd) — till skillnad från
# RÖTT/DIRTY ovan som är level-triggered (L443). Två sopningar i SAMMA
# testfall, delat state, för att mäta övergången.
echo ""
reset_scen
printf 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' > "${SCEN}/main-sha"
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once ) >/dev/null 2>&1
printf 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' > "${SCEN}/main-sha"
EXPECT_OUT="main AVANCERADE aaaaaaaa → bbbbbbbb"
run_case "T11 main-SHA AVANCERAR mellan två sopningar → larmrad" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
printf 'cccccccccccccccccccccccccccccccccccccccc' > "${SCEN}/main-sha"
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once ) >/dev/null 2>&1
NOT_EXPECT_OUT="AVANCERADE"
run_case "T12 main-SHA OFÖRÄNDRAD mellan två sopningar → ingen larmrad" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T13/T14 — FAIL-CLOSED. Ett obesvarat instrument är farligare tystnat än
# fällt (samma princip och samma exit-kod, 77, som staging-semaphore.sh).
echo ""
reset_scen
touch "${SCEN}/fail-mainsha"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — main-SHA"
run_case "T13 fail-closed: main-SHA-anropet misslyckas → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
touch "${SCEN}/fail-prlist"
EXPECT_OUT="SONDEN KUNDE INTE SVARA — pr-lista"
run_case "T14 fail-closed: pr-lista-anropet misslyckas → 77" 77 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T15–T17 — ANVÄNDNINGSFEL (config/flagga saknas eller ogiltig) → 64,
# sysexits EX_USAGE, samma konvention som staging-semaphore.sh.
echo ""
reset_scen
run_case "T15 användningsfel: REPO saknas (ingen config, ingen flagga) → 64" 64 - \
    env HEARTBEAT_SVEP_POLICY=/finns/inte.conf \
    bash ./scripts/heartbeat-svep.sh --once

run_case "T16 användningsfel: ogiltigt --interval (0) → 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --interval 0

run_case "T17 användningsfel: ogiltigt --timeout (icke-numeriskt) → 64" 64 - \
    bash ./scripts/heartbeat-svep.sh --once --timeout abc

# ============================================================
# T18 — --once LOOPAR ALDRIG. Ett stort --interval (50s) skulle avslöja en
# regression direkt: om --once av misstag går in i loop-grenen hänger
# testet i minst 50s. Bunden till 5s ger bred marginal utan att vara skör.
echo ""
reset_scen
run_case "T18 --once loopar aldrig (stort --interval, ändå snabb)" 0 5 \
    bash ./scripts/heartbeat-svep.sh --once --interval 50

# ============================================================
# T19 — LOOP-LÄGE, --timeout-bundet. interval=1, timeout=3 ⇒ flera
# iterationer inom en kort, deterministisk budget. Sista sopningens verdikt
# (RÖTT planterat i scenariot) ska vara skriptets slutliga exit-kod.
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
run_case "T19 loop-läge, --timeout-bundet, sista verdikt vinner → 1" 1 8 \
    bash ./scripts/heartbeat-svep.sh --interval 1 --timeout 3
if [[ "$(grep -c 'RÖTT — PR #572' "${TEST_DIR}/out.txt" 2>/dev/null || true)" -ge 2 ]]; then
    printf '  ✓ T19b  minst två sopningar hann köras inom loop-fönstret\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T19b  färre än två sopningar sågs — loopen körde inte\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T20 — TOM PR-lista. Grundfallet: inga öppna PR:ar alls ska vara ALLT
# LUGNT, inte ett fel.
echo ""
reset_scen
EXPECT_OUT="0 öppna PR:ar granskade"
run_case "T20 tom PR-lista → 0 granskade, ALLT LUGNT" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T21/T22 — --quiet dämpar RUTIN-rader men ALDRIG larm-rader (L443: ett
# tillstånd som håller i ska synas lika tydligt varje gång — att låta
# --quiet tysta det vore att återintroducera exakt den envägs-blindheten
# kortet finns för att åtgärda).
echo ""
reset_scen
set_rows '572\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\n'
EXPECT_OUT="RÖTT — PR #572"
NOT_EXPECT_OUT="öppna PR:ar granskade"
run_case "T21 --quiet dämpar rutin men ALDRIG larm (RÖTT syns ändå)" 1 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet

# T22 mäter den STABILA tystnaden — känt tidigare SHA, oförändrat, inga
# PR-larm — INTE kallstart (TASK-135, se T23 nedan). En färsk tillstånds-
# katalog har inget att jämföra mot och skriver därför sin EGEN ALLTID-PÅ-
# rad ("main-SHA-baslinje satt"); en preliminär sopning (utdata kastad,
# samma tvåsopnings-mönster som T11/T12) etablerar baslinjen FÖRE
# mättillfället, så detta fall isolerar den riktiga steady-state-tystnaden.
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
run_case "T22 --quiet vid stabilt, känt läge → helt tyst stdout" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T22b  förväntade tom utdata, fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T22b  stdout helt tomt vid stabilt, känt, tyst läge\n'
    PASSED=$(( PASSED + 1 ))
fi

# ============================================================
# T23 — KALLSTART (TASK-135, 2026-08-04): explicit "main-SHA-baslinje
# satt"-rad krävs ÄVEN under --quiet. En avancemang-rad KRÄVER ett känt
# tidigare SHA; saknas det (färsk/tömd tillstånds-katalog) finns inget att
# jämföra mot. Utan denna rad är en genuin kallstart och en tystad,
# uteblivet-larm-sopning OMÖJLIGA att skilja åt i en --quiet rå-logg —
# EXAKT den förväxling som startade TASK-135: svepet observerades aldrig
# visa en avancemang-rad efter PR #684 landade (10:19:45Z); förklaringen
# var kallstart/förlorad tillståndskontinuitet, inte trasig
# --quiet-hantering (den var, mätt via T11/T12/T21/T22 ovan, redan korrekt
# — de vägde bara aldrig kallstarts-fallet specifikt, samma lucka i
# TÄCKNING som orsakade att förväxlingen kunde uppstå obemärkt).
# TVÅSIDIGT BEVIS (kortets AC #2): detta fall FÄLLER på det orörda
# skriptet (kallstarten gick tidigare via say(), tystad av --quiet — noll
# rader, identiskt med den gamla T22-formen ovan) och PASSERAR efter
# fixen (kallstarten går nu via alarm()).
echo ""
reset_scen
EXPECT_OUT="main-SHA-baslinje satt"
run_case "T23 KALLSTART — baslinje-rad syns ÄVEN under --quiet (TASK-135)" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet

# ============================================================
# T24 — --help ljuger inte tyst (samma disciplin som ci-wait.sh, se
# skriptets egen kommentar vid `-h|--help`-grenen). Radintervallet
# `sed -n '61,104p'` MÅSTE följa § ANVÄNDNING-blockets faktiska gränser;
# TASK-135 utökade blocket (61,81 → 61,104) för ALLTID-PÅ-klassen +
# kallstart-stycket. Detta fall bevisar att --help FAKTISKT visar det nya
# innehållet OCH blockets svans, inte bara att sed-anropet kör utan fel.
echo ""
EXPECT_OUT="ALLTID-PÅ"
run_case "T24 --help visar den nya ALLTID-PÅ/KALLSTART-texten (TASK-135)" 0 - \
    bash ./scripts/heartbeat-svep.sh --help
if grep -qF "KALLSTART" "${TEST_DIR}/out.txt" && grep -qF "Startform som bakgrunds-monitor" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T24b  --help täcker hela det uppdaterade ANVÄNDNING-blocket\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T24b  --help saknar KALLSTART-stycket eller blockets svans\n'; FAILED=$((FAILED+1))
fi
# T24c (TASK-323) — den DESTRUKTIVA bieffekten måste synas i --help. Ett
# skript som kan radera grenar får inte dölja det i ett block --help hoppar
# över; detta fall fäller om radintervallet inte följer med blockets nya slut.
if grep -qF "UNDERHÅLL — GLES GREN-STÄDNING" "${TEST_DIR}/out.txt"; then
    printf '  ✓ T24c  --help visar § UNDERHÅLL (gren-städningen är synlig, inte dold)\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T24c  --help saknar § UNDERHÅLL — radintervallet följde inte med blocket\n'; FAILED=$((FAILED+1))
fi

# ============================================================
# T25/T25b/T26/T27/T27b — HEARTBEAT_EXEMPT_AUTHORS (fynd 2026-08-04,
# dependabot-kvartetten #632–#635). setup() kopierar den RIKTIGA
# .heartbeat-svep-policy.conf (samma relation som produktionen, § LAYOUTEN
# ovan) — den bär redan HEARTBEAT_EXEMPT_AUTHORS=("dependabot"), så T25/T26
# prövar mekanismen mot den FAKTISKA konfigurationen, inte en testdouble.
echo ""
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="PARKERAD (undantagen) — PR #632"
NOT_EXPECT_OUT="ARMERINGS-KANDIDAT"
run_case "T25 undantagen PR (author=dependabot) → PARKERAD-rutinrad, INGET kandidat-larm" 0 - \
    bash ./scripts/heartbeat-svep.sh --once

# T25b isolerar --quiet-dämpningen från kallstartens ALLTID-PÅ-rad (samma
# tvåsopnings-teknik som T22: en preliminär, kastad sopning sätter
# SHA-baslinjen FÖRE mättillfället).
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
run_case "T25b samma undantagna PR under --quiet, stabilt SHA → helt tyst stdout" 0 - \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T25c  förväntade tom utdata (PARKERAD dämpad av --quiet), fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T25c  stdout helt tomt — PARKERAD-raden är en rutin-rad, inte ett larm\n'
    PASSED=$(( PASSED + 1 ))
fi

reset_scen
set_rows '640\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\toctocat\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #640"
NOT_EXPECT_OUT="PARKERAD"
run_case "T26 icke-undantagen författare (octocat, en människas PR) → larmar FORTFARANDE" 4 - \
    bash ./scripts/heartbeat-svep.sh --once

# T27/T27b: två ODEFINIERAD-varianter av "tom/saknad" (kortets krav-text
# nämner uttryckligen båda) mot en HANDSKRIVEN policy-fil utan (T27) eller
# med tom (T27b) HEARTBEAT_EXEMPT_AUTHORS — bevisar att skriptets EGEN
# fail-open-default (HEARTBEAT_EXEMPT_AUTHORS=() FÖRE source, se
# scripts/heartbeat-svep.sh) håller oavsett vilken av de två formerna
# policy-filen råkar sakna.
echo ""
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    > "${TEST_DIR}/.no-exempt-policy.conf"
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #632"
NOT_EXPECT_OUT="PARKERAD"
run_case "T27 HEARTBEAT_EXEMPT_AUTHORS SAKNAS helt i policyn → fail-open, larmar ändå" 4 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.no-exempt-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once

printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_EXEMPT_AUTHORS=()' \
    > "${TEST_DIR}/.empty-exempt-policy.conf"
reset_scen
set_rows '632\tfalse\tCLEAN\tfalse\tSUCCESS\tfalse\tdependabot\n'
EXPECT_OUT="ARMERINGS-KANDIDAT — PR #632"
NOT_EXPECT_OUT="PARKERAD"
run_case "T27b HEARTBEAT_EXEMPT_AUTHORS definierad TOM (()) → fail-open, larmar ändå" 4 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.empty-exempt-policy.conf" \
    bash ./scripts/heartbeat-svep.sh --once

# ============================================================
# T28–T36 — FEMTE VÄGEN: gles gren-städning (TASK-323).
#
# Vad som bevisas TVÅSIDIGT, och varför just dessa par:
#   fyrar/tiger      T28 (intervall passerat ⇒ körs) mot T29 (samma stub
#                    direkt efter ⇒ glesningen håller den tyst).
#   på/av            T28 mot T30 (INTERVALL=0 ⇒ stubben anropas ALDRIG,
#                    bevisat med en argv-markörfil, inte med tyst utdata —
#                    tyst utdata bevisar bara att inget SKREVS, inte att
#                    inget KÖRDES).
#   tyst vid noll    T31 — designkravet "tyst vid noll kandidater": en
#                    idempotent körning utan fynd skriver ingenting alls.
#   larmar aldrig    T32 (städning exit 1 ⇒ svepets verdikt fortfarande 0)
#                    och T33 (städning exit 1 + en RÖD PR ⇒ verdikt exakt 1,
#                    inte förorenat). T33 är det egentliga beviset: den
#                    skiljer "städningen tystade sig" från "städningen råkade
#                    inte påverka en redan tom bitmask".
#   fail-safe        T34 — STADA_BIN saknas på disk ⇒ tyst, exit 0. Det är
#                    exakt läget för varje spoke som kopierar heartbeat men
#                    inte stada-grenar.sh.
#   rutin, ej larm   T35 — --quiet dämpar UNDERHÅLL-raden. Om den vore ett
#                    larm hade den överlevt --quiet (jfr T21/T22).
#   kontraktet       T36 — stubben tar emot `--utfor` och INTE
#                    `--ingen-fetch`. Argumentvalet är ett medvetet beslut
#                    (stada-grenar.sh: en stale bas under-rapporterar) och
#                    ska fällas om någon "optimerar" bort fetchen.
echo ""

# Stub för stada-grenar.sh: loggar sin argv, ekar en summering i skriptets
# riktiga format, och kan fås att fallera. T323_RADERADE styr talet som
# heartbeat parsar ut.
cat > "${TEST_DIR}/stada-stub.sh" <<'STADASTUB'
#!/usr/bin/env bash
[ -n "${T323_ARGV:-}" ] && printf '%s\n' "$*" > "${T323_ARGV}"
printf '=== GRENSTADNING ===\n'
printf -- '-- Summering --\n'
printf 'Raderade grenar:  %s\n' "${T323_RADERADE:-0}"
printf 'Skonade grenar:    2\n'
exit "${T323_EXIT:-0}"
STADASTUB
chmod +x "${TEST_DIR}/stada-stub.sh"
STADA_STUB="${TEST_DIR}/stada-stub.sh"
ARGV_FIL="${TEST_DIR}/stada-argv.txt"

reset_scen
rm -f "${ARGV_FIL}"
EXPECT_OUT="UNDERHÅLL — 3 mergade lokala grenar städade"
run_case "T28 intervall passerat (kallstart) + 3 raderade → UNDERHÅLL-rutinrad, exit 0" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=3 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once

# T29 — INGEN reset_scen: stämpeln från T28 ligger kvar i STATE_DIR, så
# glesningen ska hålla nästa svep tyst trots att stubben skulle rapportera
# fynd. Bevisar att intervallet faktiskt läses, inte bara skrivs.
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T29 andra svepet direkt efter → glesningen håller städningen tyst" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=3 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✗ T29b  stubben KÖRDES trots att intervallet inte passerat\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T29b  stubben anropades aldrig — glesningen är en spärr, inte bara tystnad\n'; PASSED=$((PASSED+1))
fi

# T30 — AV-läget. Egen policy-fil med INTERVALL=0.
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_STADA_GRENAR_INTERVALL=0' \
    > "${TEST_DIR}/.stada-av-policy.conf"
reset_scen
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T30 HEARTBEAT_STADA_GRENAR_INTERVALL=0 → städningen är AV" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-av-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=9 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✗ T30b  stubben KÖRDES trots INTERVALL=0\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T30b  stubben anropades aldrig vid INTERVALL=0\n'; PASSED=$((PASSED+1))
fi

# T31 — tyst vid noll (designkrav b).
reset_scen
rm -f "${ARGV_FIL}"
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T31 städning körd men 0 raderade → helt tyst om städningen" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=0 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -f "${ARGV_FIL}" ]]; then
    printf '  ✓ T31b  stubben KÖRDES — tystnaden är "inget att rapportera", inte "hoppade över"\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T31b  stubben kördes aldrig — fel orsak till tystnaden\n'; FAILED=$((FAILED+1))
fi

# T32/T33 — LARMAR ALDRIG. T33 är det skarpa fallet: en RÖD PR ger verdikt 1,
# och en samtidigt fallerande städning får inte ändra den siffran.
reset_scen
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T32 städningen fallerar, inga PR-fynd → verdikt ÄNDÅ 0" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once

reset_scen
set_rows '701\tfalse\tBLOCKED\ttrue\tFAILURE\tfalse\toctocat\n'
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T33 städningen fallerar + RÖD PR → verdikt exakt 1, bitmasken oförorenad" 1 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once

# T34 — fail-safe: skriptet finns inte på disk (varje spoke utan
# stada-grenar.sh).
reset_scen
NOT_EXPECT_OUT="UNDERHÅLL"
run_case "T34 STADA_BIN saknas på disk → tyst, exit 0 (ingen spoke kraschar)" 0 - \
    env HEARTBEAT_STADA_BIN="${TEST_DIR}/finns-inte.sh" \
    bash ./scripts/heartbeat-svep.sh --once

# T35 — UNDERHÅLL-raden är en RUTIN-rad: --quiet ska dämpa den. Tvåsopnings-
# tekniken från T22/T25b sätter SHA-baslinjen först så kallstart-raden inte
# förorenar mätningen; STATE_DIR behålls, så andra sopningen måste få ett
# eget städ-fönster — därav den egna policyfilen med INTERVALL=1.
printf '%s\n' \
    'HEARTBEAT_REPO="owner/repo"' \
    'HEARTBEAT_BRANCH="main"' \
    'HEARTBEAT_INTERVAL=90' \
    'HEARTBEAT_TIMEOUT=0' \
    'HEARTBEAT_STADA_GRENAR_INTERVALL=1' \
    > "${TEST_DIR}/.stada-tat-policy.conf"
reset_scen
( cd "${TEST_DIR}" && env PATH="${TEST_DIR}/bin:${PATH}" T119_SCEN="${SCEN}" \
    HEARTBEAT_STATE_DIR="${STATE_DIR}" \
    HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-tat-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=4 \
    bash ./scripts/heartbeat-svep.sh --once --quiet ) >/dev/null 2>&1
sleep 2
run_case "T35 UNDERHÅLL-raden dämpas av --quiet (rutin-rad, inget larm)" 0 - \
    env HEARTBEAT_SVEP_POLICY="${TEST_DIR}/.stada-tat-policy.conf" \
    HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=4 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if [[ -s "${TEST_DIR}/out.txt" ]]; then
    printf '  ✗ T35b  förväntade tom utdata under --quiet, fick:\n'
    sed 's/^/      /' "${TEST_DIR}/out.txt" | head -5
    FAILED=$(( FAILED + 1 ))
else
    printf '  ✓ T35b  stdout helt tomt — UNDERHÅLL är rutin, inte larm\n'; PASSED=$((PASSED+1))
fi

# T36 — argv-kontraktet mot stada-grenar.sh.
reset_scen
rm -f "${ARGV_FIL}"
run_case "T36 anropet bär --utfor" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=1 T323_ARGV="${ARGV_FIL}" \
    bash ./scripts/heartbeat-svep.sh --once
if grep -qF -- "--utfor" "${ARGV_FIL}" 2>/dev/null; then
    printf '  ✓ T36b  --utfor skickas (annars vore städningen en evig torrkörning)\n'; PASSED=$((PASSED+1))
else
    ARGV_SETT="$(cat "${ARGV_FIL}" 2>/dev/null || true)"
    printf '  ✗ T36b  --utfor saknades i argv: %s\n' "${ARGV_SETT}"; FAILED=$((FAILED+1))
fi
if grep -qF -- "--ingen-fetch" "${ARGV_FIL}" 2>/dev/null; then
    printf '  ✗ T36c  --ingen-fetch skickades — basen blir stale och städningen under-rapporterar\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T36c  --ingen-fetch skickas INTE (färsk bas, medvetet val)\n'; PASSED=$((PASSED+1))
fi

# ============================================================
# T37/T38 — OBSERVABILITET: fel tystas ALDRIG av --quiet (TASK-323 runda 2,
# granskningsfynd 2 och 4).
#
# Varför detta är en egen klass, skild från T35: en persistent monitor körs
# rimligen MED --quiet (det är hela poängen med rutin/larm-distinktionen).
# Skickas ett FEL på say()-kanalen blir en kontinuerligt trasig städning helt
# osynlig — ingen stdout, bara en loggfil ingen läser om man inte redan vet
# att den finns. Samma observabilitets-felklass som TASK-135 en gång fixade
# för kallstart-raden. Därför går fel via alltid_pa(), som är --quiet-immun
# men INTE bär någon exit-bit.
#
# TVÅSIDIGHETEN sitter i paret T35 ↔ T37: SUCCESS-raden dämpas (T35b bevisar
# helt tom stdout), FAILURE-raden syns (T37). Vore båda på samma kanal kunde
# bara en av dem hålla.
echo ""

reset_scen
EXPECT_OUT="gren-städningen gav exit 1"
run_case "T37 städningen fallerar UNDER --quiet → felraden syns ändå (ALLTID-PÅ)" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_EXIT=1 \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if grep -qF "LARM (bitmask" "${TEST_DIR}/out.txt"; then
    printf '  ✗ T37b  felraden drog med sig ett LARM — städningen ska aldrig bära en exit-bit\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T37b  ingen LARM-rad — synlig utan att vara ett larm\n'; PASSED=$((PASSED+1))
fi

# T38 — stämpel-skrivningen fallerar. Mockas genom att göra .tmp-sökvägen till
# en KATALOG: `printf > <katalog>` fallerar ("Is a directory") utan att röra
# något annat state, så main-SHA-vägen är opåverkad och felet isoleras till
# exakt den skrivning fyndet gäller.
reset_scen
mkdir -p "${STATE_DIR}/last-stada-grenar.tmp"
EXPECT_OUT="kunde inte stämpla"
run_case "T38 stämpel-skrivfel UNDER --quiet → synlig rad, inte tyst || true" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=2 \
    bash ./scripts/heartbeat-svep.sh --once --quiet
if grep -qF "LARM (bitmask" "${TEST_DIR}/out.txt"; then
    printf '  ✗ T38b  stämpel-felet drog med sig ett LARM — får inte påverka verdiktet\n'; FAILED=$((FAILED+1))
else
    printf '  ✓ T38b  ingen LARM-rad — stämpel-felet är synligt men bär ingen exit-bit\n'; PASSED=$((PASSED+1))
fi
rm -rf "${STATE_DIR}/last-stada-grenar.tmp"

# T39 — den lyckade stämplingen lämnar INGEN .tmp-fil kvar (atomiciteten får
# inte läcka skräp in i STATE_DIR vid varje svep).
reset_scen
run_case "T39 lyckad stämpling → atomär mv, ingen kvarlämnad .tmp" 0 - \
    env HEARTBEAT_STADA_BIN="${STADA_STUB}" T323_RADERADE=1 \
    bash ./scripts/heartbeat-svep.sh --once
if [[ -e "${STATE_DIR}/last-stada-grenar.tmp" ]]; then
    printf '  ✗ T39b  .tmp-filen ligger kvar efter en lyckad körning\n'; FAILED=$((FAILED+1))
elif [[ -f "${STATE_DIR}/last-stada-grenar" ]]; then
    printf '  ✓ T39b  stämpeln på plats, ingen .tmp kvar\n'; PASSED=$((PASSED+1))
else
    printf '  ✗ T39b  stämpeln saknas helt\n'; FAILED=$((FAILED+1))
fi

printf '\ntest-heartbeat-svep: %s passerade, %s failade\n' "${PASSED}" "${FAILED}"
[[ "${FAILED}" -eq 0 ]] || exit 1
exit 0
