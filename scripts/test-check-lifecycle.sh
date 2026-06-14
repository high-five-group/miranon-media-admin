#!/usr/bin/env bash
# scripts/test-check-lifecycle.sh
#
# Empirisk test-suite för scripts/check-lifecycle.sh (ADR-052 beslut 4-grind).
# 9 testfall: enum + biimplikation paus-markör⟺paused + frånvaro=skip +
# falskpositiv-regression (session-18-mönstret) + UTF-8-härdning.
#
# Test-isolering: skapar /tmp/s20-test-lifecycle/ med tasks/sessions/-fixturer.
# Återställer (rm -rf) via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-lifecycle.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-052-lifecycle-frontmatter-falt.md
# Etablerad: Session 20 inkrement 2b

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/s20-test-lifecycle"
GATE_SRC="${REPO_ROOT}/scripts/check-lifecycle.sh"

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
    mkdir -p "${TEST_DIR}/tasks/sessions" "${TEST_DIR}/scripts"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-lifecycle.sh"
    chmod +x "${TEST_DIR}/scripts/check-lifecycle.sh"
}

# doc <filename> — skriver stdin till ${TEST_DIR}/tasks/sessions/<filename>
doc() {
    cat > "${TEST_DIR}/tasks/sessions/$1"
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-lifecycle.sh 2>&1 )
}

check_exit() {
    local label=$1 expected=$2 actual=$3
    if [[ "${actual}" = "${expected}" ]]; then
        echo "  ✅ ${label}: exit=${actual}"
        return 0
    fi
    echo "  ❌ ${label}: exit=${actual} (expected ${expected})"
    return 1
}

check_contains() {
    local label=$1 needle=$2 hay=$3
    if echo "${hay}" | grep -qF -- "${needle}"; then
        echo "  ✅ ${label} contains: '${needle}'"
        return 0
    fi
    echo "  ❌ ${label} missing: '${needle}'"
    # shellcheck disable=SC2001  # sed på multi-line är klarast här
    echo "${hay}" | sed 's/^/    /'
    return 1
}

mark() {
    if [[ "$1" -eq 0 ]]; then
        PASSED=$((PASSED + 1)); echo "  → PASS"
    else
        FAILED=$((FAILED + 1)); echo "  → FAIL"
    fi
}

# ============================================================
echo "═══ T1: active, ingen paus-markör → exit 0 ═══"
setup
doc session-1.md <<'EOF'
---
owner: marcus803
updated: 2026-06-14
review_by: 2026-09-14
status: stable
lifecycle: active
---

# Session 1 — aktiv

Pågående arbete, ingen paus.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T1" 0 "${ec}" || ok=1
check_contains "T1" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T2: paused + förankrad paus-markör → exit 0 ═══"
setup
doc session-9.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: paused
---

# Session 9 — pausad

## PAUSLÄGE — Session 9 pausad (ADR-051 session-paus)

Sessionen är durabelt parkerad. Återupptas via `/session-resume`.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T2" 0 "${ec}" || ok=1
check_contains "T2" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T3: closed, ingen paus-markör → exit 0 ═══"
setup
doc session-3.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: closed
---

# Session 3 — avslutad

## Del 2 — K-trail + K-sista (fas-avslut)

Avslutat och arkiverat.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T3" 0 "${ec}" || ok=1
check_contains "T3" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T4: INGET lifecycle-fält (bara status:) → exit 0 (frånvaro=giltig, beslut 6) ═══"
setup
doc session-4.md <<'EOF'
---
owner: marcus803
updated: 2026-06-14
review_by: 2026-09-14
status: stable
---

# Session 4 — ej livscykel-spårad

Inget lifecycle-fält; ska skip:as.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T4" 0 "${ec}" || ok=1
check_contains "T4" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T5: lifecycle: bogus → exit 1, token 'ogiltigt' ═══"
setup
doc session-5.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: bogus
---

# Session 5 — ogiltigt enum-värde

Body.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T5" 1 "${ec}" || ok=1
check_contains "T5" "ogiltigt" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T6: active MEN förankrad paus-markör → exit 1, token 'förväntat: paused' ═══"
setup
doc session-6.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: active
---

# Session 6 — motsägelse

## PAUSLÄGE — Session 9 pausad (ADR-051 session-paus)

Fält säger active men kroppen bär paus-markör.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T6" 1 "${ec}" || ok=1
check_contains "T6" "förväntat: paused" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T7: paused MEN ingen paus-markör → exit 1, token 'ingen förankrad paus-markör' ═══"
setup
doc session-7.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: paused
---

# Session 7 — motsägelse

Fält säger paused men ingen förankrad markör i kroppen.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T7" 1 "${ec}" || ok=1
check_contains "T7" "ingen förankrad paus-markör" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T8: [KRITISK falskpositiv-regression] closed + session-18-mönstret (bar 'PAUSLÄGE' ×2, INGEN förankrad rubrik) → exit 0 ═══"
setup
doc session-8.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: closed
---

# Session 8 — stängd, arbetet pausat

## Del 2 — Förlopp och PAUSLÄGE (K1 + paus)

Sessionen pausas mitt i Fas 5.5 (ej fas-avslut).

### Pausorsak

Arbetet parkeras; sessionen själv stängdes vid sessionsavslut.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T8" 0 "${ec}" || ok=1
check_contains "T8" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
echo "═══ T9: [UTF-8-härdning] paused + förankrad rubrik med Ä → exit 0 ═══"
setup
doc session-12.md <<'EOF'
---
owner: marcus803
status: stable
lifecycle: paused
---

# Session 12 — pausad (UTF-8)

## PAUSLÄGE — Session 12 pausad (ADR-051 session-paus)

Bekräftar att non-ASCII-rubriken (Ä i PAUSLÄGE) matchas av grinden.
EOF
out=$(run_gate); ec=$?
ok=0
check_exit "T9" 0 "${ec}" || ok=1
check_contains "T9" "lifecycle-validering OK" "${out}" || ok=1
mark "${ok}"

# ============================================================
TOTAL=$((PASSED + FAILED))
echo ""
echo "RESULT: ${PASSED}/${TOTAL} PASS, ${FAILED} FAIL"
if [[ "${FAILED}" -eq 0 ]]; then
    exit 0
fi
exit 1
