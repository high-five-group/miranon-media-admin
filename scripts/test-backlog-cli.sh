#!/usr/bin/env bash
# test-backlog-cli.sh — wrapperns egen testsvit (TASK-250, ADR-117).
#
# Wrappern har EN farlig felriktning: att den stänger av gren-skanningen för ett
# ALLOKERANDE anrop och därmed river TASK-93:s kollisionsskydd. Sviten prövar
# därför i par — att skyddet står kvar där det ska, och att kostnaden försvinner
# där den inte skyddar något.
#
# Kör mot ett STUBBAT backlog-CLI som rapporterar vad det såg (argument,
# BACKLOG_CWD, och den effektiva check_active_branches). Ingen nätverksåtkomst,
# ingen riktig binär, inga riktiga kort.
#
# Portabilitet: ingen mapfile/readarray (bash 3.2 på macOS saknar dem).

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

WRAPPER="scripts/backlog-cli.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

PASS=0
FAIL=0

rapportera() {
    local ok="$1" namn="$2" forklaring="$3" utdata="$4"
    if [[ "${ok}" -eq 1 ]]; then
        echo "  ✓ ${namn}"
        PASS=$((PASS + 1))
    else
        echo "  ✗ ${namn} — ${forklaring}"
        while IFS= read -r r; do echo "      ${r}"; done <<< "${utdata}"
        FAIL=$((FAIL + 1))
    fi
}

# Ett falskt repo: backlog/config.yml + en stubbad binär som skriver ut vad den
# fick se. Stubben läser den config som FAKTISKT gäller för anropet — repots
# egen om BACKLOG_CWD saknas, den isolerade om den är satt.
BAS="${TMP}/repo"
mkdir -p "${BAS}/backlog/tasks" "${BAS}/node_modules/.bin" "${BAS}/scripts"
cp "${WRAPPER}" "${BAS}/scripts/backlog-cli.sh"
printf 'project_name: "prov"\ncheck_active_branches: true\nactive_branch_days: 30\n' \
    > "${BAS}/backlog/config.yml"
cat > "${BAS}/node_modules/.bin/backlog" <<'STUB'
#!/usr/bin/env bash
if [[ -n "${BACKLOG_CWD:-}" && -f "${BACKLOG_CWD}/backlog.config.yml" ]]; then
    KONF="${BACKLOG_CWD}/backlog.config.yml"
else
    KONF="$(dirname "$0")/../../backlog/config.yml"
fi
echo "ARGV: $*"
echo "BACKLOG_CWD: ${BACKLOG_CWD:-<osatt>}"
echo "EFFEKTIV: $(grep -m1 '^check_active_branches:' "${KONF}" 2>/dev/null || echo 'saknas')"
if [[ -n "${BACKLOG_CWD:-}" ]]; then
    echo "KORT-SYNS: $(find "${BACKLOG_CWD}/backlog/tasks" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
fi
exit 0
STUB
chmod +x "${BAS}/node_modules/.bin/backlog"
printf -- '---\nid: TASK-1\nstatus: To Do\n---\n' > "${BAS}/backlog/tasks/task-1 - prov.md"
printf -- '---\nid: TASK-2\nstatus: Done\n---\n' > "${BAS}/backlog/tasks/task-2 - prov.md"

kor() { bash "${BAS}/scripts/backlog-cli.sh" "$@" 2>&1; }

echo "test-backlog-cli:"

# ── Kollisionsskyddet: create MÅSTE behålla gren-skanningen (AC3) ────────────
ut="$(kor task create "Nytt kort")"
ok=0
if grep -q 'BACKLOG_CWD: <osatt>' <<< "${ut}" \
   && grep -q 'EFFEKTIV: check_active_branches: true' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W1  task create -> gren-skanningen ORÖRD (TASK-93 intakt)" \
    "create isolerades, vilket river kollisionsskyddet" "${ut}"

ut="$(kor draft create "Nytt utkast")"
ok=0
if grep -q 'BACKLOG_CWD: <osatt>' <<< "${ut}" \
   && grep -q 'EFFEKTIV: check_active_branches: true' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W2  draft create -> gren-skanningen ORÖRD" \
    "draft create isolerades" "${ut}"

ut="$(kor doc create "Nytt dok")"
ok=0
if grep -q 'BACKLOG_CWD: <osatt>' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W3  doc create -> gren-skanningen ORÖRD (allokerar egna ID)" \
    "doc create isolerades" "${ut}"

# Fail-safe-riktningen: 'create' som VÄRDE ger ett långsammare anrop, aldrig ett
# oskyddat. Den kostar, och det är den billiga felriktningen.
ut="$(kor task edit 5 --title create)"
ok=0
if grep -q 'BACKLOG_CWD: <osatt>' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W4  'create' som VÄRDE -> går igenom orört (fail-safe åt rätt håll)" \
    "wrappern isolerade ett anrop den inte kunde klassa säkert" "${ut}"

# ── Paret: icke-allokerande anrop SKA isoleras ──────────────────────────────
ut="$(kor task list --plain)"
ok=0
if grep -q 'BACKLOG_CWD: ' <<< "${ut}" && ! grep -q 'BACKLOG_CWD: <osatt>' <<< "${ut}" \
   && grep -q 'EFFEKTIV: check_active_branches: false' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W5  task list -> isolerat, skanningen AV (kostnaden bort)" \
    "list isolerades inte" "${ut}"

ut="$(kor task 1 --plain)"
ok=0
if grep -q 'EFFEKTIV: check_active_branches: false' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W6  task view -> isolerat, skanningen AV" "view isolerades inte" "${ut}"

ut="$(kor task edit 1 --check-ac 1)"
ok=0
if grep -q 'EFFEKTIV: check_active_branches: false' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W7  task edit -> isolerat (allokerar inget ID)" "edit isolerades inte" "${ut}"

# ── De riktiga korten MÅSTE synas genom symlänken ───────────────────────────
ut="$(kor task list --plain)"
ok=0
if grep -q 'KORT-SYNS: 2' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W8  isoleringen ser de RIKTIGA korten (symlänken bär)" \
    "korten syntes inte genom isoleringen" "${ut}"

# ── Repots egen config får ALDRIG muteras ───────────────────────────────────
fore="$(cat "${BAS}/backlog/config.yml")"
kor task list --plain >/dev/null 2>&1
kor task create "x" >/dev/null 2>&1
efter="$(cat "${BAS}/backlog/config.yml")"
ok=0
[[ "${fore}" == "${efter}" ]] && ok=1
rapportera "${ok}" "W9  backlog/config.yml är byte-identisk efteråt (TASK-93-flaggan orörd)" \
    "wrappern skrev i repots egen config" "$(diff <(printf '%s' "${fore}") <(printf '%s' "${efter}") || true)"

# ── Ingen delad muterbar fil i projektroten (skillnaden mot ROOT_CONFIG) ────
kor task list --plain >/dev/null 2>&1
ok=0
[[ ! -e "${BAS}/backlog.config.yml" ]] && ok=1
rapportera "${ok}" "W10 ingen backlog.config.yml lämnas i projektroten (fleet-säkert)" \
    "wrappern lämnade en delad muterbar fil i roten" "$(ls -a "${BAS}" || true)"

# ── Temporärkatalogen städas ────────────────────────────────────────────────
fore_antal=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'tmp.*' 2>/dev/null | wc -l | tr -d ' ')
kor task list --plain >/dev/null 2>&1
efter_antal=$(find "${TMPDIR:-/tmp}" -maxdepth 1 -type d -name 'tmp.*' 2>/dev/null | wc -l | tr -d ' ')
ok=0
[[ "${efter_antal}" -le "${fore_antal}" ]] && ok=1
rapportera "${ok}" "W11 isolerings-katalogen städas (ingen läcka per anrop)" \
    "temporärkataloger blev kvar: ${fore_antal} -> ${efter_antal}" ""

# ── Exitkoden måste gå igenom oförvanskad ───────────────────────────────────
cat > "${BAS}/node_modules/.bin/backlog" <<'STUB'
#!/usr/bin/env bash
exit 42
STUB
chmod +x "${BAS}/node_modules/.bin/backlog"
kod=0
kor task list --plain >/dev/null 2>&1 || kod=$?
ok=0
[[ "${kod}" -eq 42 ]] && ok=1
rapportera "${ok}" "W12 CLI:ts exitkod går igenom oförvanskad (isolerad väg)" \
    "väntade exit 42, fick ${kod}" ""
kod=0
kor task create "x" >/dev/null 2>&1 || kod=$?
ok=0
[[ "${kod}" -eq 42 ]] && ok=1
rapportera "${ok}" "W13 CLI:ts exitkod går igenom oförvanskad (pass-through-vägen)" \
    "väntade exit 42, fick ${kod}" ""

# ── Fail-closed: saknad binär och saknad config gissas aldrig ───────────────
rm -f "${BAS}/node_modules/.bin/backlog"
kod=0
ut="$(kor task list --plain)" || kod=$?
ok=0
if [[ "${kod}" -eq 2 ]] && grep -q 'hittas inte' <<< "${ut}"; then ok=1; fi
rapportera "${ok}" "W14 saknad binär -> exit 2, aldrig tyst 0" "fick exit ${kod}" "${ut}"

# ── Sökvägarna i utdatan får aldrig peka på den raderade isoleringen ────────
#
# CLI:t skriver ut den sökväg det löste igenom. Utan omskrivningen är det
# isolerings-katalogens — som är borta när anropet returnerat, alltså en död
# sökväg i handen på den som läser.
cat > "${BAS}/node_modules/.bin/backlog" <<'STUB'
#!/usr/bin/env bash
echo "File: ${BACKLOG_CWD:-.}/backlog/tasks/task-1 - prov.md"
exit 0
STUB
chmod +x "${BAS}/node_modules/.bin/backlog"
ut="$(kor task 1 --plain)"
ok=0
# EXAKT jämförelse, inte "innehåller inte tmp." — testrepot ligger självt under
# en mktemp-katalog, så en tmp-heuristik hade fällt på rätt svar.
if [[ "${ut}" == "File: ${BAS}/backlog/tasks/task-1 - prov.md" ]]; then ok=1; fi
rapportera "${ok}" "W15 utdatans sökväg pekar på det RIKTIGA trädet, ej isoleringen" \
    "sökvägen pekar på en katalog som raderas när anropet returnerar" "${ut}"

# Paret: sökvägen får inte skrivas om till något annat än det riktiga trädet —
# en rad UTAN isolerings-sökväg ska passera oförändrad.
cat > "${BAS}/node_modules/.bin/backlog" <<'STUB'
#!/usr/bin/env bash
echo "Status: To Do"
echo "Titel med ordet backlog i sig"
exit 0
STUB
chmod +x "${BAS}/node_modules/.bin/backlog"
ut="$(kor task 1 --plain)"
ok=0
if [[ "${ut}" == "Status: To Do
Titel med ordet backlog i sig" ]]; then ok=1; fi
rapportera "${ok}" "W16 rader utan isolerings-sökväg passerar oförändrade" \
    "omskrivningen rörde rader den inte skulle röra" "${ut}"

echo ""
echo "test-backlog-cli: ${PASS} passerade, ${FAIL} failade"
[[ "${FAIL}" -eq 0 ]] || exit 1
exit 0
