#!/usr/bin/env bash
# scripts/test-check-facit.sh
#
# Empirisk test-suite för scripts/check-facit.sh (ADR-102-grind).
# 11 testfall, TVÅSIDIGA: varje invariant prövas både i sitt gröna och sitt
# röda läge. En grind som bara bevisats grön är inte bevisad — den kan vara
# blind (L43, ADR-039 § lesson→grind).
#
#   T1  rent manifest                                    → 0
#   T2  facit-bild utan manifest            (invariant a) → 1
#   T3  deklarerad bild saknas på disk      (invariant b) → 1
#   T4  föräldralös facit-bild              (invariant b) → 1
#   T5  yta saknar nyckeln "bilder"         (R5)          → 1
#   T6  toppnivåns "godkand" saknas         (B3)          → 1
#   T7  tom bilder[] = deklarerad frånvaro  (R5, grön)    → 0
#   T8  proto-markör riven, godkand null    (B3, röd)     → 1
#   T9  proto-markör riven, godkand satt    (B3, grön)    → 0
#   T10 config saknas                                     → 3
#   T11 trasig JSON                                       → 1
#
# Test-isolering: skapar /tmp/s93-test-facit/ med bilage-fixtur + src-fixtur.
# Återställer (rm -rf) via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-facit.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s93-test-facit"
GATE_SRC="${REPO_ROOT}/scripts/check-facit.sh"
LIB_SRC="${REPO_ROOT}/scripts/lib/facit-validera.mjs"

BILAGE="tasks/sessions/bilagor/s93-test-prototyp"

PASSED=0
FAILED=0

# shellcheck disable=SC2329  # invoked via trap
cleanup() {
    cd / || true
    rm -rf "${TEST_DIR}"
}
trap cleanup EXIT

setup() {
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}/scripts/lib"
    mkdir -p "${TEST_DIR}/${BILAGE}"
    mkdir -p "${TEST_DIR}/src/komponenter"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-facit.sh"
    cp "${LIB_SRC}" "${TEST_DIR}/scripts/lib/facit-validera.mjs"
    chmod +x "${TEST_DIR}/scripts/check-facit.sh"
    write_config
    write_kalla
    printf 'png\n' > "${TEST_DIR}/${BILAGE}/facit-yta.png"
}

write_config() {
    cat > "${TEST_DIR}/.facit-policy.conf" <<'CONF'
FACIT_BILAGE_ROT="tasks/sessions/bilagor"
FACIT_MANIFEST_NAMN="facit.json"
FACIT_BILD_GLOB="facit-*"
FACIT_PROTO_MARKORER=("protoAktiv")
FACIT_PROTO_SOKVAG="src"
CONF
}

# Källfilen som manifestets kallor[] pekar på, med prototyp-markören i.
write_kalla() {
    printf 'export const x = protoAktiv ? 1 : 2;\n' \
        > "${TEST_DIR}/src/komponenter/Yta.tsx"
}

# Källfilen UTAN markören — simulerar en rivning.
riv_markor() {
    printf 'export const x = 1;\n' > "${TEST_DIR}/src/komponenter/Yta.tsx"
}

# write_manifest <godkand-json> <bilder-json> [extra-yta-json]
write_manifest() {
    local godkand=$1 bilder=$2
    cat > "${TEST_DIR}/${BILAGE}/facit.json" <<JSON
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": ${godkand},
  "ytor": [
    {
      "yta": "yta",
      "bilder": ${bilder},
      "kallor": ["src/komponenter/Yta.tsx"]
    }
  ]
}
JSON
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-facit.sh 2>&1 )
}

run_exit() {
    ( cd "${TEST_DIR}" && bash scripts/check-facit.sh >/dev/null 2>&1 )
    echo $?
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" = "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (förväntat ${expected})"
    FAILED=$((FAILED + 1))
    return 1
}

# check_utdata <label> <mönster> — fäller om mönstret INTE finns i utdatan.
# Skiljer "grinden föll" från "grinden föll av RÄTT skäl": en röd exitkod
# från fel invariant är ett falskt bevis.
check_utdata() {
    local label=$1 monster=$2 utdata
    utdata=$(run_gate)
    if grep -qE "${monster}" <<< "${utdata}"; then
        echo "  ✅ ${label}: utdatan nämner det förväntade skälet"
        PASSED=$((PASSED + 1))
        return 0
    fi
    echo "  ❌ ${label}: utdatan saknar mönstret '${monster}'"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "${utdata}" | sed 's/^/       /'
    FAILED=$((FAILED + 1))
    return 1
}

echo "=== test-check-facit.sh ==="

# --- T1: rent manifest ---------------------------------------------------
setup
write_manifest "null" '["facit-yta.png"]'
check_exit "T1 rent manifest" 0 "$(run_exit)"

# --- T2: facit-bild utan manifest (invariant a) --------------------------
setup
rm -f "${TEST_DIR}/${BILAGE}/facit.json"
check_exit "T2 facit-bild utan manifest" 1 "$(run_exit)"
check_utdata "T2 skäl" "saknar facit\.json"

# --- T3: deklarerad bild saknas på disk (invariant b) --------------------
setup
write_manifest "null" '["facit-saknas.png"]'
check_exit "T3 deklarerad bild saknas" 1 "$(run_exit)"
check_utdata "T3 skäl" "facit-saknas\.png"

# --- T4: föräldralös facit-bild (invariant b / R4) -----------------------
setup
write_manifest "null" '["facit-yta.png"]'
printf 'png\n' > "${TEST_DIR}/${BILAGE}/facit-odeklarerad.png"
check_exit "T4 föräldralös facit-bild" 1 "$(run_exit)"
check_utdata "T4 skäl" "facit-odeklarerad\.png"

# --- T5: yta saknar nyckeln "bilder" (R5) --------------------------------
setup
cat > "${TEST_DIR}/${BILAGE}/facit.json" <<'JSON'
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "godkand": null,
  "ytor": [{ "yta": "yta", "kallor": ["src/komponenter/Yta.tsx"] }]
}
JSON
check_exit "T5 yta saknar bilder-nyckeln" 1 "$(run_exit)"
check_utdata "T5 skäl" "saknar nyckeln \"bilder\""

# --- T6: toppnivåns "godkand" saknas (B3) --------------------------------
setup
cat > "${TEST_DIR}/${BILAGE}/facit.json" <<'JSON'
{
  "prototyp": "s93-test",
  "last": "2026-08-06",
  "lasning": "Lås som facit.",
  "ytor": [
    { "yta": "yta", "bilder": ["facit-yta.png"], "kallor": ["src/komponenter/Yta.tsx"] }
  ]
}
JSON
check_exit "T6 godkand-nyckeln saknas" 1 "$(run_exit)"
check_utdata "T6 skäl" "nyckeln \"godkand\" saknas"

# --- T7: tom bilder[] = deklarerad frånvaro (R5, GRÖN sida) --------------
# Ytan har medvetet ingen låst facit-bild. Det ska INTE fälla — poängen är
# att frånvaron är deklarerad i stället för gissad.
setup
rm -f "${TEST_DIR}/${BILAGE}/facit-yta.png"
write_manifest "null" '[]'
check_exit "T7 tom bilder[] är deklarerad frånvaro" 0 "$(run_exit)"

# --- T8: proto-markör riven medan godkand=null (B3, RÖD) -----------------
setup
write_manifest "null" '["facit-yta.png"]'
riv_markor
check_exit "T8 rivning före godkännande" 1 "$(run_exit)"
check_utdata "T8 skäl" "rivs ALDRIG före Marcus godkännande"

# --- T9: proto-markör riven men godkand satt (B3, GRÖN) ------------------
# Samma rivning som T8. Skillnaden är ENBART godkännandet — spärren ska
# släppa, annars vore den ett permanent hinder i stället för en ordning.
setup
write_manifest '"2026-08-10"' '["facit-yta.png"]'
riv_markor
check_exit "T9 rivning efter godkännande" 0 "$(run_exit)"

# --- T10: config saknas --------------------------------------------------
setup
write_manifest "null" '["facit-yta.png"]'
rm -f "${TEST_DIR}/.facit-policy.conf"
check_exit "T10 config saknas" 3 "$(run_exit)"

# --- T11: trasig JSON ----------------------------------------------------
setup
printf '{ detta är inte json\n' > "${TEST_DIR}/${BILAGE}/facit.json"
check_exit "T11 trasig JSON" 1 "$(run_exit)"
check_utdata "T11 skäl" "JSON"

echo
echo "=== Resultat: ${PASSED} passerade, ${FAILED} failade ==="
[[ "${FAILED}" -eq 0 ]] || exit 1
