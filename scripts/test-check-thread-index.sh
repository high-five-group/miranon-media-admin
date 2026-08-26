#!/usr/bin/env bash
# scripts/test-check-thread-index.sh
#
# Empirisk test-suite för scripts/check-thread-index.sh (ADR-053-grind).
#
# VARFÖR SVITEN FINNS OCH INTE BARA EN ENGÅNGSKÖRNING:
#   Restlistans lärdom om den brustna regexen är uttrycklig — "lärdomen är inte
#   att regexen var slarvig utan att den aldrig prövades mot ett känt fel".
#   En grind som bara visats grön har inte bevisat något; grönt är förenligt
#   med att grinden inte gör någonting alls. T104/TASK-60 etablerade formen:
#   beviset ska vara körbart i repot, inte en mening i en agentrapport.
#
# 29 testfall, varav 23 planterar ett känt fel och 6 prövar att grinden är grön
# på korrekt indata (utan de gröna mäter fällnings-testerna ingenting):
#   T1     — ren fixtur passerar (annars mäter resten ingenting)
#   T2–T4  — enum + tillstånds-KOLUMN (T4 är falskpositiv-regressionen: ordet
#            "paused" i prosan får aldrig räknas som radens tillstånd)
#   T5–T7  — numrering: dubblett, omkastad ordning, lucka
#   T8     — kolumnstruktur (oescapad pipe förskjuter tillstånds-kolumnen)
#   T9–T11 — index↔fil åt båda håll; T11 är TÄCKNINGS-REGRESSIONEN: en trådfil
#            UTAN lifecycle:-fält, alltså exakt den klass check-lifecycle.sh
#            tyst hoppar över
#   T12–T14— degenererade indata: tomt index, saknat index, saknad policy
#   T16–T17— policy som sourcar men tappat en nyckel (farligare än en som
#            saknas: utan tomhetskontroll validerar grinden mot tom sträng och
#            rapporterar grönt)
#   T15    — ledande nollor (T01→T02) läses som 1→2, inte som en lucka
#   T18–T24— Inv 6 (barn-manifest, ADR-095 beslut 4, TASK-141): T18/T19 släpper
#            ett giltigt tråd- respektive kort-barn; T20–T23 fäller ett
#            barn-tråd-ID som saknas, ett barn-kort-ID som saknas, en förälder
#            som saknas i registret, och ett ID på okänd form; T24 bevisar att
#            ett SAKNAT manifest är grönt (opt-in, additivt startläge — inte
#            samma sak som ett manifest som pekar fel).
#   T25–T28— Inv 7 (radlängds-tak, ADR-098 beslut 1–2, TASK-157.3): T25 fäller
#            en fet fixtur-rad (800 tecken); T26 bevisar gränsfallet EXAKT vid
#            taket (500) släpps (inte en "-gt" av misstag som skulle fälla
#            gränsen själv); T27 bevisar gränsfallet EN tecken över taket
#            (501) fälls med den EXAKT uppmätta längden i felmeddelandet;
#            T28 bevisar fail-closed — policy utan THREAD_ROW_MAX_LEN fälls,
#            inte tyst passerar mot en tom/nollställd gräns.
#   T29    — TASK-138: en ESCAPAD pipe (\|) fälls ÄNDÅ, samma klass som T8.
#            Bevisar att felmeddelandets tidigare rekommendation ("escapa
#            pipe-tecken som \|") aldrig var en giltig kringgång —
#            ${line//[^|]/} stryker alla icke-pipe-tecken (inklusive det
#            inledande \), så en escapad pipe räknas identiskt med en
#            oescapad. Grunden till att felmeddelandet nu säger "undvik"
#            i stället för "escapa".
#
# Test-isolering: skapar sandbox under /tmp med egna fixturer och en KOPIA av
# grinden + policyn. Återställer (rm -rf) via trap. INGEN ändring av real-repo.
#
# Användning: bash scripts/test-check-thread-index.sh
# Exit 0 om alla testfall passerar. Exit 1 om någon failar.
#
# Källa: docs/decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md
# Etablerad: TASK-108 (2026-07-31)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/task-108-test-thread-index"
GATE_SRC="${REPO_ROOT}/scripts/check-thread-index.sh"
POLICY_SRC="${REPO_ROOT}/.thread-index-policy.conf"

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
    mkdir -p "${TEST_DIR}/tasks/threads" "${TEST_DIR}/scripts" "${TEST_DIR}/backlog/tasks"
    cp "${GATE_SRC}" "${TEST_DIR}/scripts/check-thread-index.sh"
    cp "${POLICY_SRC}" "${TEST_DIR}/.thread-index-policy.conf"
    chmod +x "${TEST_DIR}/scripts/check-thread-index.sh"
}

# index — skriver stdin till sandboxens tasks/threads/README.md
index() {
    cat > "${TEST_DIR}/tasks/threads/README.md"
}

# card <filnamn> — skriver stdin till sandboxens tasks/threads/<filnamn>
card() {
    cat > "${TEST_DIR}/tasks/threads/$1"
}

# manifest — skriver stdin till sandboxens tasks/threads/barn.md (Inv 6,
# ADR-095 beslut 4, TASK-141)
manifest() {
    cat > "${TEST_DIR}/tasks/threads/barn.md"
}

# backlog_card <filnamn> — skriver stdin till sandboxens backlog/tasks/<filnamn>,
# fixtur för Inv 6:s kort-halva (card_exists())
backlog_card() {
    cat > "${TEST_DIR}/backlog/tasks/$1"
}

# row_of_len <tid> <target_len> — bygger en väl-formad tabellrad (rätt
# pipe-antal, giltigt tillstånd) med EXAKT angiven total radlängd. Fyllnaden
# läggs i Titel-kolumnen som en obruten teckensvit. Isolerar Inv 7
# (radlängd) från Inv 1a (pipe-antal) — en fet rad byggd så här fäller
# ENDAST radlängds-invarianten, inget annat.
row_of_len() {
    local tid="$1" target="$2"
    local head="| \`${tid}\` | "
    local tail=" | \`active\` | _x_ |"
    local pad_len=$(( target - ${#head} - ${#tail} ))
    printf '%s' "${head}"
    printf '%*s' "${pad_len}" '' | tr ' ' 'x'
    printf '%s\n' "${tail}"
}

run_gate() {
    ( cd "${TEST_DIR}" && bash scripts/check-thread-index.sh 2>&1 )
}

gate_exit() {
    ( cd "${TEST_DIR}" && bash scripts/check-thread-index.sh >/dev/null 2>&1 )
    echo $?
}

# assert <namn> <förväntad exit> <förväntat delsträngs-fragment i utdata>
assert() {
    local name="$1" want_exit="$2" want_text="${3:-}"
    local out code
    out=$(run_gate)
    code=$(gate_exit)
    if [[ "${code}" != "${want_exit}" ]]; then
        echo "❌ ${name}: exit ${code}, förväntat ${want_exit}"
        echo "   utdata: ${out}"
        FAILED=$((FAILED + 1))
        return
    fi
    if [[ -n "${want_text}" ]] && [[ "${out}" != *"${want_text}"* ]]; then
        echo "❌ ${name}: exit ${code} korrekt MEN utdata saknar '${want_text}'"
        echo "   utdata: ${out}"
        FAILED=$((FAILED + 1))
        return
    fi
    echo "✅ ${name}"
    PASSED=$((PASSED + 1))
}

# Ren tabell-header som varje fixtur delar.
HEADER='| Tråd | Titel | Tillstånd | Ingång |
|---|---|---|---|'

# ── T1: ren fixtur passerar ──────────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första tråden | \`active\` | [T01-slug.md](T01-slug.md) |
| \`T02\` | Andra tråden | \`paused\` | _(inget kort än)_ |
| \`T03\` | Tredje tråden | \`closed\` | _Löst_ |
EOF
card "T01-slug.md" <<'EOF'
# T01
EOF
assert "T1 ren fixtur passerar" 0 "tråd-index OK"

# ── T2: ogiltigt tillstånd fälls ─────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`done\` | _x_ |
EOF
assert "T2 ogiltigt tillstånd fälls" 1 "har tillstånd 'done'"

# ── T3: tillstånd helt saknat i kolumn 3 ─────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | | _x_ |
EOF
assert "T3 tomt tillstånd fälls" 1 "kolumn 3"

# ── T4: FALSKPOSITIV-REGRESSION — tillstånds-ordet i prosan, ej i kolumnen ───
# En bar substrängs-matchning på raden hade sett \`paused\` i ingångs-texten
# och godkänt raden. Tillståndet MÅSTE läsas ur sin kolumn.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`nonsens\` | _tidigare \`paused\`, se noten_ |
EOF
assert "T4 tillstånds-ord i prosa räknas inte som tillstånd" 1 "har tillstånd 'nonsens'"

# ── T5: dubblett-nummer fälls ────────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
| \`T01\` | Kopia | \`paused\` | _x_ |
EOF
assert "T5 dubblett fälls" 1 "DUBBLETT"

# ── T6: omkastad ordning fälls (T74/T73-mönstret) ────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
| \`T03\` | Tredje | \`paused\` | _x_ |
| \`T02\` | Andra | \`paused\` | _x_ |
EOF
assert "T6 omkastad ordning fälls" 1 "omkastad ordning"

# ── T7: lucka i numreringen fälls ────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
| \`T04\` | Fjärde | \`paused\` | _x_ |
EOF
assert "T7 lucka fälls" 1 "LUCKA"

# ── T8: oescapad pipe förskjuter kolumnerna ──────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Titel med | pipe | \`active\` | _x_ |
EOF
assert "T8 extra pipe fälls" 1 "pipe-tecken"

# ── T9: index länkar en trådfil som inte finns ───────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | [T01-saknas.md](T01-saknas.md) |
EOF
assert "T9 länk till saknad trådfil fälls" 1 "som inte finns"

# ── T10: trådfil utan indexrad ───────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
card "T02-foraldralos.md" <<'EOF'
---
lifecycle: paused
---
# T02
EOF
assert "T10 föräldralös trådfil fälls" 1 "föräldralös trådfil"

# ── T11: TÄCKNINGS-REGRESSIONEN ──────────────────────────────────────────────
# Trådfil UTAN lifecycle:-frontmatter och utan indexrad. check-lifecycle.sh
# hoppar tyst över den (frånvaro=skip, dess rad 94). Mätt i real-repot vid
# byggtillfället: 8 av 21 trådfiler saknar fältet. Denna grind måste se den.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
card "T02-utan-frontmatter.md" <<'EOF'
# T02 — en trådfil helt utan frontmatter
EOF
assert "T11 föräldralös trådfil UTAN lifecycle-fält fälls" 1 "föräldralös trådfil"

# ── T12: tomt index (noll trådrader) ─────────────────────────────────────────
setup
index <<EOF
${HEADER}
EOF
assert "T12 noll trådrader fälls" 1 "noll trådrader"

# ── T13: indexet saknas helt ─────────────────────────────────────────────────
setup
rm -f "${TEST_DIR}/tasks/threads/README.md"
assert "T13 saknat index fälls" 1 "bruten ryggrad"

# ── T14: policy-filen saknas ─────────────────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
rm -f "${TEST_DIR}/.thread-index-policy.conf"
assert "T14 saknad policy fälls" 1 "config-driven"

# ── T16: policy finns men har tappat en nyckel ───────────────────────────────
# En conf som sourcar utan fel men saknar ett värde är farligare än en som
# saknas helt: utan tomhetskontrollen hade grinden validerat mot tom sträng och
# rapporterat grönt. Samma klass som lärdomen kortet bär.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
grep -v '^THREAD_INDEX=' "${POLICY_SRC}" > "${TEST_DIR}/.thread-index-policy.conf"
assert "T16 policy utan THREAD_INDEX fälls" 1 "THREAD_INDEX är tom"

# ── T17: policy med tom tillstånds-lista ─────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
sed 's/^    "active"$//; s/^    "paused"$//; s/^    "closed"$//' "${POLICY_SRC}" \
    > "${TEST_DIR}/.thread-index-policy.conf"
assert "T17 policy med tom THREAD_VALID_STATES fälls" 1 "THREAD_VALID_STATES är tom"

# ── T15: ledande nollor läses som bas 10 ─────────────────────────────────────
# T08→T09 får inte tolkas som oktal (08/09 är ogiltiga oktaltal och hade
# gjort grinden röd på ett korrekt register).
setup
index <<EOF
${HEADER}
| \`T07\` | Sju | \`active\` | _x_ |
| \`T08\` | Åtta | \`paused\` | _x_ |
| \`T09\` | Nio | \`paused\` | _x_ |
| \`T10\` | Tio | \`closed\` | _x_ |
EOF
assert "T15 ledande nollor läses som bas 10" 0 "tråd-index OK"

# ── T18: Inv 6 — giltig barn-TRÅD släpps ─────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
| \`T02\` | Andra | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T01\` | \`T02\` |
EOF
assert "T18 barn-manifest: giltig barn-tråd passerar" 0 "tråd-index OK"

# ── T19: Inv 6 — giltigt barn-KORT släpps ────────────────────────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T01\` | \`TASK-1\` |
EOF
backlog_card "task-1 - Exempel.md" <<'EOF'
---
id: TASK-1
---
EOF
assert "T19 barn-manifest: giltigt barn-kort passerar" 0 "tråd-index OK"

# ── T20: Inv 6 — barn-tråd som INTE finns i registret fälls ─────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T01\` | \`T99\` |
EOF
assert "T20 barn-manifest: barn-tråd som saknas fälls" 1 "INTE finns i registret"

# ── T21: Inv 6 — barn-kort som INTE finns på disk fälls ──────────────────────
# Ingen backlog_card() anropad — TASK-999 har ingen fixturfil.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T01\` | \`TASK-999\` |
EOF
assert "T21 barn-manifest: barn-kort som saknas fälls" 1 "TASK-999"

# ── T22: Inv 6 — förälder som INTE finns i registret fälls ──────────────────
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T05\` | \`T01\` |
EOF
assert "T22 barn-manifest: förälder som saknas i registret fälls" 1 "T05 (förälder) finns INTE i tråd-registret"

# ── T23: Inv 6 — okänd ID-form i barn-cellen fälls ───────────────────────────
# Varken tråd-ID:t (T<siffror>) eller kort-ID:t (TASK-<siffror>) matchas.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
manifest <<EOF
| Tråd | Barn |
|---|---|
| \`T01\` | \`XYZ-1\` |
EOF
assert "T23 barn-manifest: okänd ID-form fälls" 1 "okänd form"

# ── T24: Inv 6 — SAKNAT manifest är grönt (opt-in) ───────────────────────────
# Ingen manifest() anropad alls — filen finns inte i sandboxen. Additivt
# startläge (ADR-095 beslut 4): frånvaro betyder "inga barn deklarerade ännu",
# inte ett fel. Skiljer sig från T20–T23, som alla har en FIL som pekar fel.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
assert "T24 barn-manifest: saknat manifest är grönt" 0 "tråd-index OK"

# ── T25: Inv 7 — fet fixtur-rad (800 tecken) fälls ───────────────────────────
setup
{
    printf '%s\n' "${HEADER}"
    row_of_len "T01" 800
} | index
assert "T25 radlängd: fet rad (800 tecken) fälls" 1 "800 tecken lång (tak 500)"

# ── T26: Inv 7 — gränsfall EXAKT vid taket (500) släpps ──────────────────────
# "-gt", inte "-ge" — en rad exakt vid gränsen är GILTIG, inte över den. Ett
# strikt-taget-fel tecken i jämförelsen (-ge i stället för -gt) hade fällt
# denna rad, och detta test är det som skulle fånga det.
setup
{
    printf '%s\n' "${HEADER}"
    row_of_len "T01" 500
} | index
assert "T26 radlängd: rad exakt vid taket (500) släpps" 0 "tråd-index OK"

# ── T27: Inv 7 — gränsfall EN tecken över taket (501) fälls ─────────────────
# Bevisar att felmeddelandet bär den FAKTISKT uppmätta längden, inte en
# avrundad eller schablonmässig siffra.
setup
{
    printf '%s\n' "${HEADER}"
    row_of_len "T01" 501
} | index
assert "T27 radlängd: rad en tecken över taket (501) fälls exakt" 1 "501 tecken lång (tak 500)"

# ── T28: Inv 7 — policy utan THREAD_ROW_MAX_LEN fälls fail-closed ───────────
# Samma klass som T16/T17: en conf som sourcar utan fel men saknat värdet
# hade — utan explicit tomhetskontroll — validerat mot 0 och antingen fällt
# ALLT (0 är inte > 0) eller, värre, tyst passerat en verkligt fet rad om
# kontrollen saknades helt. Grinden ska fälla på CONFIG-defekten direkt,
# innan den ens läser en rad.
setup
index <<EOF
${HEADER}
| \`T01\` | Första | \`active\` | _x_ |
EOF
grep -v '^THREAD_ROW_MAX_LEN=' "${POLICY_SRC}" > "${TEST_DIR}/.thread-index-policy.conf"
assert "T28 policy utan THREAD_ROW_MAX_LEN fälls fail-closed" 1 "THREAD_ROW_MAX_LEN måste vara > 0"

# ── T29: escapad pipe (\|) fälls ÄNDÅ — TASK-138 ─────────────────────────────
# Samma planterade fel som T8 (en extra pipe förskjuter tillstånds-kolumnen),
# men här FÖREGÅS pipen av ett \ — den form det tidigare felmeddelandet
# rekommenderade som fix. ${line//[^|]/} stryker alla icke-pipe-tecken,
# inklusive \, så escapet syns aldrig i räkningen och raden fälls identiskt
# med T8. Beviset för att felmeddelandet nu säger "undvik" i stället för
# "escapa" — en regression här (grinden börjar plötsligt släppa igenom en
# escapad pipe) vore ett tecken på att ${line//[^|]/}-mekaniken ändrats
# under fötterna på den här dokumentationen.
setup
index <<EOF
${HEADER}
| \`T01\` | Titel med \| pipe | \`active\` | _x_ |
EOF
assert "T29 escapad pipe (\\|) fälls ändå (escape kringgår inte kontrollen)" 1 "pipe-tecken"

echo
echo "── Resultat ──"
echo "Passerade: ${PASSED}"
echo "Failade:   ${FAILED}"
[[ "${FAILED}" -eq 0 ]] && exit 0
exit 1
