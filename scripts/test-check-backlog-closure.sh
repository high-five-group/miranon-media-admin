#!/usr/bin/env bash
# test-check-backlog-closure.sh — grindens egen testsvit.
#
# Kör check-backlog-closure.sh mot STUBBAT backlog-CLI (fixtur-data), aldrig mot
# repots verkliga kort. Sviten ska kunna köras utan att någonting installeras och
# utan nätverk.
#
# VARFÖR SVITEN FINNS: en grind som aldrig setts fälla är inte bevisad, den är
# hoppfull. Den lärdomen kostade repot ett halvt dygn 2026-07-29, när restlistans
# statuskontroll visade sig vara strukturellt blind för en hel radklass efter att
# ha "fungerat" i ett dygn. Varje fall nedan finns därför i PAR: ett som ska
# fälla och ett som inte ska.
#
# Portabilitet: ingen mapfile/readarray (bash 3.2 på macOS saknar dem).

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

GRIND="scripts/check-backlog-closure.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

PASS=0
FAIL=0

# Bygger ett stubbat `backlog`-kommando. $1 = katalog med fixturer.
# Stubben svarar på `task list --plain` och `task <id> --plain`.
skapa_stub() {
    local dir="$1"
    cat > "${dir}/backlog" <<'STUB'
#!/usr/bin/env bash
FIXDIR="$(dirname "$0")/fixturer"
if [[ "${1:-}" == "task" && "${2:-}" == "list" ]]; then
    for f in "${FIXDIR}"/*.txt; do
        [[ -e "$f" ]] || continue
        echo "  TASK-$(basename "$f" .txt) - fixtur"
    done
    exit 0
fi
if [[ "${1:-}" == "task" && -n "${2:-}" ]]; then
    cat "${FIXDIR}/${2}.txt" 2>/dev/null
    exit 0
fi
exit 1
STUB
    chmod +x "${dir}/backlog"
}

# $1=namn  $2=förväntad exit  $3=fixtur-innehåll (ett kort, id 1)
prova() {
    local namn="$1" vantad="$2" innehall="$3"
    local d="${TMP}/fall-$$-${RANDOM}"
    mkdir -p "${d}/fixturer"
    printf '%s\n' "${innehall}" > "${d}/fixturer/1.txt"
    skapa_stub "${d}"

    printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\n' > "${d}/policy.conf"

    local ut faktisk
    faktisk=0
    ut=$(BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" \
         bash "${GRIND}" 2>&1) || faktisk=$?

    if [[ "${faktisk}" -eq "${vantad}" ]]; then
        echo "  ✓ ${namn}"
        PASS=$((PASS + 1))
    else
        echo "  ✗ ${namn} — väntade exit ${vantad}, fick ${faktisk}"
        while IFS= read -r r; do echo "      ${r}"; done <<< "${ut}"
        FAIL=$((FAIL + 1))
    fi
}

AC_HDR="Acceptance Criteria:"
DOD_HDR="Definition of Done:"

echo "test-check-backlog-closure:"

# ── Invariant 1: alla AC bockade men kortet öppet ────────────────────────────
prova "T1  alla AC bockade + To Do -> FÄLLER" 1 \
"Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [x] #2 två
${DOD_HDR}
- [x] #1 dod"

prova "T2  alla AC bockade + Done -> passerar" 0 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T3  NÅGOT AC obockat + To Do -> passerar (arbete pågår)" 0 \
"Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [ ] #2 två
${DOD_HDR}
- [ ] #1 dod"

# ── Invariant 2: Done men obockade krav ──────────────────────────────────────
prova "T4  Done + obockat AC -> FÄLLER" 1 \
"Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T5  Done + obockad DoD -> FÄLLER" 1 \
"Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [ ] #1 dod"

# ── Blockavgränsningen: AC och DoD får ALDRIG räknas ihop ────────────────────
# Utan awk-avgränsningen skulle en bockad DoD kunna maskera ett obockat AC.
prova "T6  Done + obockat AC men bockad DoD -> FÄLLER (block hålls isär)" 1 \
"Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod
- [x] #2 dod"

prova "T7  To Do + noll AC -> passerar (inget att sluta sig till)" 0 \
"Status: ○ To Do
${AC_HDR}
${DOD_HDR}
- [ ] #1 dod"

# ── Undantagna statusar ──────────────────────────────────────────────────────
d="${TMP}/undantag"
mkdir -p "${d}/fixturer"
printf 'Status: ✖ Cancelled\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR="Cancelled"\n' > "${d}/policy.conf"
if BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" >/dev/null 2>&1; then
    echo "  ✓ T8  undantagen status fäller inte invariant 1"
    PASS=$((PASS + 1))
else
    echo "  ✗ T8  undantagen status fällde ändå"
    FAIL=$((FAIL + 1))
fi

# ── Fail-closed: anropsfel får ALDRIG läsas som 'allt bra' ───────────────────
d="${TMP}/tomt"
mkdir -p "${d}/fixturer"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\n' > "${d}/policy.conf"
kod=0
BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" >/dev/null 2>&1 || kod=$?
if [[ "${kod}" -eq 2 ]]; then
    echo "  ✓ T9  noll kort -> exit 2 (anropsfel), inte exit 0"
    PASS=$((PASS + 1))
else
    echo "  ✗ T9  noll kort gav inte exit 2"
    FAIL=$((FAIL + 1))
fi

d="${TMP}/ingen-policy"
mkdir -p "${d}/fixturer"
printf 'Status: ✔ Done\n' > "${d}/fixturer/1.txt"
skapa_stub "${d}"
kod=0
BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/finns-inte.conf" bash "${GRIND}" >/dev/null 2>&1 || kod=$?
if [[ "${kod}" -eq 2 ]]; then
    echo "  ✓ T10 saknad policy-fil -> exit 2, grinden gissar aldrig"
    PASS=$((PASS + 1))
else
    echo "  ✗ T10 saknad policy-fil gav inte exit 2"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "test-check-backlog-closure: ${PASS} passerade, ${FAIL} failade"
[[ "${FAIL}" -eq 0 ]] || exit 1
exit 0
