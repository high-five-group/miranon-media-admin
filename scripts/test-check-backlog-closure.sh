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

# Etikettnamnet som fixtur-policyn deklarerar. Sviten sätter det SJÄLV och ärver
# det aldrig från repots .backlog-closure-policy.conf — annars hade ett byte av
# projektets etikettnamn tyst ändrat vad testerna påstår sig bevisa.
ETIKETT="intentionally-open"

# Karensen som fixtur-policyn deklarerar. Sviten sätter den SJÄLV av samma skäl
# som etiketten: ärvdes den från repots policy hade ett byte av projektets
# karens tyst ändrat vad testerna påstår sig bevisa.
KARENS_H=24

# Tidsstämplar för karens-fallen. Kortens tidsstämplar skrivs i UTC, så FARSK
# räknas i UTC — annars hade en maskin i CEST fått en "färsk" stämpel som ligger
# två timmar i framtiden och testet blivit sant av fel skäl.
GAMMAL="2020-01-01 00:00"
FARSK="$(date -u +'%Y-%m-%d %H:%M')"

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

# Ger en fixtur en GAMMAL tidsstämpel om den inte redan bär en egen.
#
# VARFÖR DEFAULTEN ÄR GAMMAL OCH INTE FÄRSK: varje test som fanns före karensen
# prövar en invariant, inte ett tidsfönster. En färsk default hade satt dem alla
# innanför karensen och gjort dem gröna av fel skäl — sviten hade fortsatt visa
# 30 gröna medan den slutat pröva det den påstår. En gammal default håller varje
# äldre test på exakt den fråga det ställdes för, och karens-fallen nedan sätter
# sin stämpel explicit.
med_tid() {
    if grep -qE '^(Updated|Created):' <<< "$1"; then
        printf '%s\n' "$1"
    else
        printf 'Updated: %s\n%s\n' "${GAMMAL}" "$1"
    fi
}

# Bygger fixtur-katalog + stub + policy. $1 = katalog, därefter PAR av: id innehåll
bygg_fixturer() {
    local d="$1"; shift
    mkdir -p "${d}/fixturer"
    while [[ "$#" -ge 2 ]]; do
        med_tid "$2" > "${d}/fixturer/$1.txt"
        shift 2
    done
    skapa_stub "${d}"
    {
        printf 'BACKLOG_KLAR_STATUS="Done"\n'
        printf 'BACKLOG_UNDANTAGNA_STATUSAR=""\n'
        printf 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\n' "${ETIKETT}"
        printf 'BACKLOG_KARENS_TIMMAR="%s"\n' "${KARENS_H}"
    } > "${d}/policy.conf"
}

SISTA_UT=""
SISTA_KOD=0

kor_fixtur() {
    local d="$1"
    SISTA_KOD=0
    SISTA_UT="$(BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" \
                bash "${GRIND}" 2>&1)" || SISTA_KOD=$?
}

rapportera() {
    local ok="$1" namn="$2" forklaring="$3"
    if [[ "${ok}" -eq 1 ]]; then
        echo "  ✓ ${namn}"
        PASS=$((PASS + 1))
    else
        echo "  ✗ ${namn} — ${forklaring}"
        while IFS= read -r r; do echo "      ${r}"; done <<< "${SISTA_UT}"
        FAIL=$((FAIL + 1))
    fi
}

# $1=namn  $2=förväntad exit  därefter PAR av: id innehåll
prova_flera() {
    local namn="$1" vantad="$2"; shift 2
    local d="${TMP}/flera-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    kor_fixtur "${d}"
    local ok=0
    [[ "${SISTA_KOD}" -eq "${vantad}" ]] && ok=1
    rapportera "${ok}" "${namn}" "väntade exit ${vantad}, fick ${SISTA_KOD}"
}

# $1=namn  $2=förväntad exit  $3=fixtur-innehåll (ett kort, id 1)
prova() {
    prova_flera "$1" "$2" 1 "$3"
}

# Policy-varianter mot en fixtur som i sig ALLTID är konsekvent (Done + allt
# bockat). Enda variabeln i experimentet är policy-filens innehåll — så en
# fällning kan bara komma från policy-hanteringen.
# $1=namn  $2=policy-innehåll  $3=förväntad exit  $4=mönster ('' = ingen kontroll)
prova_policy() {
    local namn="$1" policy="$2" vantad="$3" monster="$4"
    local d="${TMP}/policy-$$-${RANDOM}"
    mkdir -p "${d}/fixturer"
    printf 'Updated: %s\nStatus: ✔ Done\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
        "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
    skapa_stub "${d}"
    printf '%s\n' "${policy}" > "${d}/policy.conf"
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]]; then
        if [[ -z "${monster}" ]]; then
            ok=1
        elif grep -qE "${monster}" <<< "${SISTA_UT}"; then
            ok=1
        fi
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

# $1=namn  $2=förväntad exit  $3=mönster som MÅSTE finnas i utskriften
#                             därefter PAR av: id innehåll
prova_utskrift() {
    local namn="$1" vantad="$2" monster="$3"; shift 3
    local d="${TMP}/utskrift-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]] && grep -qE "${monster}" <<< "${SISTA_UT}"; then
        ok=1
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

AC_HDR="Acceptance Criteria:"
DOD_HDR="Definition of Done:"

# Återanvända fixtur-kroppar för förälder/barn-fallen.
BARN_KLART="Status: ✔ Done
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

BARN_OPPET="Status: ○ To Do
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [ ] #1 dod"

FORALDER_UTAN_AC="Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

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
printf 'Updated: %s\nStatus: ✖ Cancelled\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
    "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR="Cancelled"\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
if BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" >/dev/null 2>&1; then
    echo "  ✓ T8  undantagen status fäller inte invariant 1"
    PASS=$((PASS + 1))
else
    echo "  ✗ T8  undantagen status fällde ändå"
    FAIL=$((FAIL + 1))
fi

# ── Fail-closed: anropsfel får ALDRIG läsas som 'allt bra' ───────────────────
# Varje fall nedan prövar BÅDE exitkoden OCH att den utlöstes av RÄTT orsak.
# Utan orsaks-kontrollen hade T9 kunnat passera på fel grund: en policy som
# saknar en obligatorisk variabel ger också exit 2.
d="${TMP}/tomt"
mkdir -p "${d}/fixturer"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'noll kort hittades' <<< "${ut}"; then
    echo "  ✓ T9  noll kort -> exit 2 (anropsfel), inte exit 0"
    PASS=$((PASS + 1))
else
    echo "  ✗ T9  noll kort gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

d="${TMP}/ingen-policy"
mkdir -p "${d}/fixturer"
printf 'Status: ✔ Done\n' > "${d}/fixturer/1.txt"
skapa_stub "${d}"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/finns-inte.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'policy-fil saknas' <<< "${ut}"; then
    echo "  ✓ T10 saknad policy-fil -> exit 2, grinden gissar aldrig"
    PASS=$((PASS + 1))
else
    echo "  ✗ T10 saknad policy-fil gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

# ── Invariant 3: förälder öppen medan alla barn är Done (TASK-90) ────────────
prova_flera "T11 förälder öppen + ALLA barn Done -> FÄLLER" 1 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T12 förälder öppen + ETT barn öppet -> passerar (arbete kvar)" 0 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_OPPET}"

# Fail-safe: ett barn i Subtasks-blocket som saknas i listningen (arkiverat,
# eller en CLI-avvikelse) gör förälderns tillstånd OKÄNT. En gissning åt
# fällande håll är precis det falska röda som devalverar nästa larm.
prova_flera "T13 förälder öppen + barn SAKNAS i listningen -> passerar (ingen gissning)" 0 \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}"

# Förälderns EGNA AC vinner över barnens fullbordan: ett obockat eget kriterium
# är genuint återstående arbete (typiskt en QA-skiva som ligger på föräldern).
prova_flera "T14 förälder + alla barn Done men EGET AC obockat -> passerar" 0 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
- [ ] #1 egen QA
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T15 förälder + alla barn Done + EGNA AC alla bockade -> FÄLLER" 1 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
- [x] #1 egen QA
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# En skiv-titel kan nämna ett ANNAT kort-ID. Barn-utvinningen är ankrad på
# radstart, så den raden får inte kunna smuggla in ett påhittat barn.
prova_flera "T16 barn-ID i en skiv-TITEL räknas inte som barn -> FÄLLER ändå" 1 \
    1 "Status: ○ To Do
Subtasks (2):
- TASK-1.1 - Barn ett (jfr TASK-9.9 som INTE är ett barn)
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Kort-ID:n SER UT som tal, och en awk-jämförelse `$1==x` blir då numerisk:
# `18.2 == 18.20` är sant numeriskt och falskt som ID. Barn-uppslaget läste
# därför TASK-18.20:s status ur TASK-18.2:s rad och rapporterade TASK-18 som
# färdigt fastän 18.20 stod To Do. Paret nedan låser fast strängjämförelsen.
FORALDER_GLES="Status: ○ To Do
Subtasks (2):
- TASK-1.2 - Barn två
- TASK-1.20 - Barn tjugo

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

prova_flera "T17 barn 1.20 öppet medan 1.2 är Done -> passerar (ID är sträng, ej tal)" 0 \
    1 "${FORALDER_GLES}" \
    1.2 "${BARN_KLART}" \
    1.20 "${BARN_OPPET}"

prova_flera "T18 barn 1.2 OCH 1.20 båda Done -> FÄLLER" 1 \
    1 "${FORALDER_GLES}" \
    1.2 "${BARN_KLART}" \
    1.20 "${BARN_KLART}"

# ── Avsiktligt öppna kort deklarerar sig med etikett (TASK-90 AC #3) ─────────
prova_flera "T19 förälder + alla barn Done + ETIKETTEN satt -> passerar" 0 \
    1 "Status: ○ To Do
Labels: ${ETIKETT}
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Delsträngs-matchning hade undantagit detta kort. Matchningen är per token.
prova_flera "T20 etikett som bara INNEHÅLLER den deklarerade -> FÄLLER" 1 \
    1 "Status: ○ To Do
Labels: ready-for-agent, ${ETIKETT}-tillfallig
Subtasks (2):
- TASK-1.1 - Barn ett
- TASK-1.2 - Barn två

${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Etiketten säger "kortet ska inte stängas ännu" — den undantar därför BÅDA
# öppet-kort-invarianterna, inte bara förälder/barn.
prova "T21 alla AC bockade + To Do + ETIKETTEN satt -> passerar" 0 \
"Status: ○ To Do
Labels: ${ETIKETT}
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

prova "T22 alla AC bockade + To Do + ANNAN etikett -> FÄLLER" 1 \
"Status: ○ To Do
Labels: ready-for-agent
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

# ── Fail-closed på OFULLSTÄNDIG policy — exit 2, aldrig exit 1 ───────────────
# Grindens kontrakt är "exit 1 = drift funnen, exit 2 = anropsfel". En
# ofullständig policy är ett anropsfel. Formen `${VAR:?...}` gav exit 1 och
# hade alltså rapporterat en trasig konfiguration som ett inkonsistent KORT.
POLICY_FULL='BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="24"'

# Varje ofullständig policy nedan bär ALLA ÖVRIGA variabler. Annars hade testet
# kunnat passera på fel grund: två saknade variabler ger också exit 2, och
# mönster-kontrollen är det enda som skiljer orsakerna åt.
prova_policy "T23 policy utan etikett-variabeln -> exit 2 (anropsfel)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT'

prova_policy "T24 samma fixtur med FULLSTÄNDIG policy -> exit 0" \
    "${POLICY_FULL}" 0 ''

prova_policy "T25 policy utan BACKLOG_KLAR_STATUS -> exit 2, inte exit 1" \
    'BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="x"
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_KLAR_STATUS'

prova_policy "T26 policy med TOM etikett-variabel -> exit 2 (tomt är inte ett val)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT=""
BACKLOG_KARENS_TIMMAR="24"' \
    2 'BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT'

# Karensen är obligatorisk av SAMMA skäl som etiketten: dess frånvaro ger falskt
# rött, inte tyst grönt. Ett tyst default på 0 hade gjort den farligaste
# konfigurationen till den som inte syns.
prova_policy "T31 policy utan BACKLOG_KARENS_TIMMAR -> exit 2 (anropsfel)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"' \
    2 'BACKLOG_KARENS_TIMMAR'

prova_policy "T32 karens som inte är ett heltal -> exit 2, aldrig tyst 0" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="24h"' \
    2 'BACKLOG_KARENS_TIMMAR'

# ── Täcknings-redovisningen — den VALDA formen för 0-AC-utan-barn ────────────
# Kortet utan AC och utan barn fälls INTE, men får inte heller försvinna tyst:
# hela fyndet i TASK-90 var att "0 inkonsistenta" lästes som full täckning.
prova_utskrift "T27 öppet kort utan AC och utan barn -> redovisas som UTAN SIGNAL" 0 \
    '^  1 UTAN STÄNGNINGS-SIGNAL' \
    1 "Status: ○ To Do
${AC_HDR}
No acceptance criteria defined
${DOD_HDR}
- [ ] #1 dod"

prova_utskrift "T28 öppet kort MED barn -> redovisas som prövat, inte som utan signal" 0 \
    '^  0 UTAN STÄNGNINGS-SIGNAL' \
    1 "${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_OPPET}"

prova_utskrift "T29 öppet kort med egna AC -> räknas mot invariant 1 i täckningen" 0 \
    '^  1 prövade mot egna AC' \
    1 "Status: ○ To Do
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [ ] #1 dod"

prova_utskrift "T30 deklarerat avsiktligt öppet -> redovisas som deklarerat, ej som prövat" 0 \
    '^  1 deklarerat avsiktligt öppna' \
    1 "Status: ○ To Do
Labels: ${ETIKETT}
${AC_HDR}
- [x] #1 ett
${DOD_HDR}
- [x] #1 dod"

# ── KARENSEN — det tvåsidiga beviset (TASK-102) ──────────────────────────────
#
# Grinden fäller på "alla AC bockade + öppet status". Det är EXAKT det tillstånd
# varje bygg-agents kontrakt KRÄVER: agenten bockar AC men får inte sätta Done,
# eftersom DoD kräver "CI grön per jobb" och den signalen saknas när agenten är
# klar. Utan karens fäller grinden alltså på korrekta kort — under en niovåg på
# nio samtidigt.
#
# Paret T33/T34 är hela poängen, och det måste vara ett PAR: ett grönt utfall
# ensamt bevisar ingenting, eftersom en grind som aldrig fäller också är grön.

# $1=namn $2=policy $3=förväntad exit $4=mönster ('' = ingen kontroll)
#                                     därefter PAR av: id innehåll
prova_policy_flera() {
    local namn="$1" policy="$2" vantad="$3" monster="$4"; shift 4
    local d="${TMP}/pf-$$-${RANDOM}"
    bygg_fixturer "${d}" "$@"
    printf '%s\n' "${policy}" > "${d}/policy.conf"   # ersätter default-policyn
    kor_fixtur "${d}"
    local ok=0
    if [[ "${SISTA_KOD}" -eq "${vantad}" ]]; then
        if [[ -z "${monster}" ]] || grep -qE "${monster}" <<< "${SISTA_UT}"; then ok=1; fi
    fi
    rapportera "${ok}" "${namn}" "väntade exit ${vantad} + /${monster}/, fick exit ${SISTA_KOD}"
}

LEVERERAT="Status: ○ To Do
${AC_HDR}
- [x] #1 ett
- [x] #2 två
${DOD_HDR}
- [ ] #1 dod"

prova "T33 nyss levererat kort (alla AC bockade, INOM karens) -> passerar" 0 \
"Updated: ${FARSK}
${LEVERERAT}"

prova "T34 SAMMA kort men bortom karensen -> FÄLLER (det är glömt)" 1 \
"Updated: ${GAMMAL}
${LEVERERAT}"

# Karensen undantar BÅDA öppet-kort-invarianterna, precis som etiketten gör.
prova_flera "T35 förälder + alla barn Done men föräldern INOM karens -> passerar" 0 \
    1 "Updated: ${FARSK}
${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

prova_flera "T36 samma förälder bortom karensen -> FÄLLER" 1 \
    1 "Updated: ${GAMMAL}
${FORALDER_UTAN_AC}" \
    1.1 "${BARN_KLART}" \
    1.2 "${BARN_KLART}"

# Invariant 2 har MED FLIT ingen karens: "Done + obockat krav" produceras inte av
# något korrekt flöde — stängningen bockar DoD och sätter Done i SAMMA CLI-anrop.
# En karens där hade bara fördröjt upptäckten av ett äkta fel.
prova "T37 Done + obockat AC INOM karens -> FÄLLER ändå (invariant 2 har ingen karens)" 1 \
"Updated: ${FARSK}
Status: ✔ Done
${AC_HDR}
- [ ] #1 ett
${DOD_HDR}
- [x] #1 dod"

# Karens 0 är ett giltigt val — men bara utskrivet. Då ska ett färskt kort fällas.
prova_policy_flera "T38 karens=0 -> färskt kort fälls (karensen är avstängbar)" \
    'BACKLOG_KLAR_STATUS="Done"
BACKLOG_UNDANTAGNA_STATUSAR=""
BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="'"${ETIKETT}"'"
BACKLOG_KARENS_TIMMAR="0"' \
    1 'TASK-1' \
    1 "Updated: ${FARSK}
${LEVERERAT}"

# `Created:`-fallbacken för kort som aldrig redigerats efter skapandet. Paret
# visar att fallbacken är en RIKTIG tidsstämpel, inte ett tyst undantag.
prova "T39 endast Created:, gammalt -> bedöms och FÄLLER" 1 \
"Created: ${GAMMAL}
${LEVERERAT}"

prova "T40 endast Created:, färskt -> inom karens, passerar" 0 \
"Created: ${FARSK}
${LEVERERAT}"

# Ett kort utan läsbar tidsstämpel fälls inte — men får inte försvinna tyst.
# Samma val som 0-AC-utan-barn: redovisa frånvaron av bevis.
#
# FIXTUREN BYGGS FÖR HAND. `bygg_fixturer` ger varje fixtur en gammal tidsstämpel
# om den saknar egen, vilket är rätt för alla andra test — men hade tagit bort
# precis det detta test finns för att pröva.
d="${TMP}/utan-tid-blandat"
mkdir -p "${d}/fixturer"
printf 'Updated: %s\nStatus: ✔ Done\n%s\n- [x] #1 ett\n%s\n- [x] #1 dod\n' \
    "${GAMMAL}" "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/1.txt"
printf 'Status: ○ To Do\n%s\n- [x] #1 ett\n%s\n- [ ] #1 dod\n' \
    "${AC_HDR}" "${DOD_HDR}" > "${d}/fixturer/2.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kor_fixtur "${d}"
if [[ "${SISTA_KOD}" -eq 0 ]] && grep -qE '^  1 utan läsbar tidsstämpel' <<< "${SISTA_UT}"; then
    echo "  ✓ T41 kort utan tidsstämpel -> fälls inte, redovisas i täckningen"
    PASS=$((PASS + 1))
else
    echo "  ✗ T41 kort utan tidsstämpel gav inte exit 0 + redovisning (kod=${SISTA_KOD})"
    while IFS= read -r r; do echo "      ${r}"; done <<< "${SISTA_UT}"
    FAIL=$((FAIL + 1))
fi

# Men om INGET kort bär en tidsstämpel har CLI:ts format troligen ändrats, och då
# hade grinden gått grön utan att pröva någonting. Fail-closed: exit 2.
d="${TMP}/ingen-tid"
mkdir -p "${d}/fixturer"
printf 'Status: ○ To Do\n%s\n- [x] #1 ett\n%s\n- [ ] #1 dod\n' "${AC_HDR}" "${DOD_HDR}" \
    > "${d}/fixturer/1.txt"
skapa_stub "${d}"
printf 'BACKLOG_KLAR_STATUS="Done"\nBACKLOG_UNDANTAGNA_STATUSAR=""\nBACKLOG_AVSIKTLIGT_OPPEN_ETIKETT="%s"\nBACKLOG_KARENS_TIMMAR="%s"\n' \
    "${ETIKETT}" "${KARENS_H}" > "${d}/policy.conf"
kod=0
ut=""
ut="$(BACKLOG_CMD="${d}/backlog" BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'läsbar tidsstämpel' <<< "${ut}"; then
    echo "  ✓ T42 inget kort med tidsstämpel -> exit 2 (format-drift), inte tyst grönt"
    PASS=$((PASS + 1))
else
    echo "  ✗ T42 inget kort med tidsstämpel gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

prova_utskrift "T43 kort inom karens redovisas öppet, aldrig som 'prövat'" 0 \
    '^  1 inom karens' \
    1 "Updated: ${FARSK}
${LEVERERAT}"

# ── date-fallbacken måste hålla i BÅDA formerna (TASK-102) ──────────────────
#
# Karensens brytpunkt räknas med `date -u -d @EPOCH` (GNU) och faller tillbaka
# på `date -u -r EPOCH` (BSD/macOS). Varje maskin kör bara EN av grenarna:
# macOS tar alltid fallbacken, en ubuntu-runner alltid förstahandsformen. Utan
# stubbe prövar alltså ingen miljö den gren den inte själv använder — och ett
# fel i den andra grenen hade synts först i CI, eller aldrig.
#
# Stubben tvingar grinden ned i en bestämd gren. Den räknar inte tid själv utan
# delegerar till /bin/date i den form som råkar finnas, eftersom det som ska
# bevisas är grindens GRENVAL, inte datumaritmetiken.
# Stubbarna skrivs med CITERAD heredoc (<<'X'), samma form som skapa_stub ovan.
# Innehållet ska nå filen ORÖRT — `$1` i stubben är stubbens eget argument, inte
# sviten. En ociterad heredoc (eller printf med dubbla citattecken) hade expanderat
# dem här och skrivit en stubbe som läser sviten argument.
skapa_date_stubbe() {
    local dir="$1" stil="$2"
    mkdir -p "${dir}"
    cat > "${dir}/date" <<'HUVUD'
#!/usr/bin/env bash
stampel() { /bin/date -u -d "@$1" +%Y%m%d%H%M 2>/dev/null || /bin/date -u -r "$1" +%Y%m%d%H%M; }
if [[ "$1" == "-u" && "$2" == "+%s" ]]; then exec /bin/date -u +%s; fi
HUVUD
    if [[ "${stil}" == "gnu" ]]; then
        # GNU: -d @EPOCH fungerar; -r betyder "läs en FILS mtime" och fäller här.
        cat >> "${dir}/date" <<'GNUGREN'
if [[ "$1" == "-u" && "$2" == "-d" ]]; then e="${3#@}"; stampel "$e"; exit $?; fi
if [[ "$1" == "-u" && "$2" == "-r" ]]; then exit 1; fi
GNUGREN
    else
        # BSD: -d finns inte alls ("illegal option -- d"); -r EPOCH fungerar.
        cat >> "${dir}/date" <<'BSDGREN'
if [[ "$1" == "-u" && "$2" == "-d" ]]; then exit 1; fi
if [[ "$1" == "-u" && "$2" == "-r" ]]; then stampel "$3"; exit $?; fi
BSDGREN
    fi
    cat >> "${dir}/date" <<'SVANS'
exec /bin/date "$@"
SVANS
    chmod +x "${dir}/date"
}

# $1=stil  $2=fixtur-innehåll  $3=förväntad exit  $4=namn
prova_date_gren() {
    local stil="$1" innehall="$2" vantad="$3" namn="$4"
    local d="${TMP}/date-${stil}-$$-${RANDOM}"
    bygg_fixturer "${d}" 1 "${innehall}"
    skapa_date_stubbe "${d}/datebin" "${stil}"
    local kod=0 ut=""
    ut="$(PATH="${d}/datebin:${PATH}" BACKLOG_CMD="${d}/backlog" \
          BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
    SISTA_UT="${ut}"; SISTA_KOD="${kod}"
    local ok=0
    [[ "${kod}" -eq "${vantad}" ]] && ok=1
    rapportera "${ok}" "${namn}" "väntade exit ${vantad}, fick ${kod}"
}

prova_date_gren gnu "Updated: ${FARSK}
${LEVERERAT}" 0 "T44 GNU-grenen (date -d @EPOCH): färskt kort -> passerar"

prova_date_gren gnu "Updated: ${GAMMAL}
${LEVERERAT}" 1 "T45 GNU-grenen: gammalt kort -> FÄLLER"

prova_date_gren bsd "Updated: ${FARSK}
${LEVERERAT}" 0 "T46 BSD-grenen (date -r EPOCH): färskt kort -> passerar"

prova_date_gren bsd "Updated: ${GAMMAL}
${LEVERERAT}" 1 "T47 BSD-grenen: gammalt kort -> FÄLLER"

# Faller BÅDA formerna kan brytpunkten inte beräknas. Då kör grinden hellre inte
# alls än med en gissad karens.
d="${TMP}/date-trasig"
bygg_fixturer "${d}" 1 "Updated: ${GAMMAL}
${LEVERERAT}"
mkdir -p "${d}/datebin"
cat > "${d}/datebin/date" <<'TRASIG'
#!/usr/bin/env bash
if [[ "$1" == "-u" && "$2" == "+%s" ]]; then exec /bin/date -u +%s; fi
exit 1
TRASIG
chmod +x "${d}/datebin/date"
kod=0
ut=""
ut="$(PATH="${d}/datebin:${PATH}" BACKLOG_CMD="${d}/backlog" \
      BACKLOG_CLOSURE_POLICY="${d}/policy.conf" bash "${GRIND}" 2>&1)" || kod=$?
if [[ "${kod}" -eq 2 ]] && grep -q 'brytpunkt' <<< "${ut}"; then
    echo "  ✓ T48 ingen date-form fungerar -> exit 2, aldrig en gissad karens"
    PASS=$((PASS + 1))
else
    echo "  ✗ T48 trasig date gav inte exit 2 av rätt orsak (kod=${kod})"
    FAIL=$((FAIL + 1))
fi

# ── Namnkollisionen får aldrig krypa tillbaka in i defaulten (TASK-102) ──────
#
# `npx backlog` löser upp till paketet `backlog` — ett ANNAT paket av en annan
# författare — och npx auto-installerar det utan att fråga när stdin inte är en
# TTY, vilket den aldrig är i CI. Defaulten måste peka på den deklarerade lokala
# binären. Detta är en käll-assertion och inte ett beteendetest, eftersom
# felläget bara uppstår i en miljö utan global installation.
standard_cmd=""
standard_cmd="$(grep -m1 '^BACKLOG_CMD=' "${GRIND}")" || true
if [[ -n "${standard_cmd}" ]] && ! grep -q 'npx' <<< "${standard_cmd}"; then
    echo "  ✓ T49 BACKLOG_CMD-defaulten löser inte upp via npx"
    PASS=$((PASS + 1))
else
    echo "  ✗ T49 BACKLOG_CMD-defaulten är tillbaka på en npx-form: ${standard_cmd}"
    FAIL=$((FAIL + 1))
fi

if ! grep -nE '^[[:space:]]*echo .*npx ' "${GRIND}" > /dev/null; then
    echo "  ✓ T50 grinden skriver aldrig ut ett npx-kommando som åtgärd"
    PASS=$((PASS + 1))
else
    echo "  ✗ T50 grinden lär ut namnkollisionen i sin egen åtgärds-utskrift:"
    grep -nE '^[[:space:]]*echo .*npx ' "${GRIND}" | while IFS= read -r r; do echo "      ${r}"; done
    FAIL=$((FAIL + 1))
fi

echo ""
echo "test-check-backlog-closure: ${PASS} passerade, ${FAIL} failade"
[[ "${FAIL}" -eq 0 ]] || exit 1
exit 0
