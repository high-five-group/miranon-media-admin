#!/usr/bin/env bash
#
# test-check-listparitet.sh — self-test för check-listparitet.sh.
#
# ARTON FALL. Grinden är billig att göra GRÖN och det bevisar ingenting; varje
# fall nedan finns för att bevisa att den FÄLLER när den ska, eller att den
# vägrar uttala sig när den inte kan läsa det den ska pröva.
#
#   Paritet, båda riktningarna
#     T1  två listor i synk                                  → 0
#     T2  post borttagen ur B                                → 1
#     T3  post tillagd i B                                   → 1
#     T4  samma asymmetri deklarerad som undantag            → 0
#     T5  a-till-b: B bär extra                              → 0
#     T6  a-till-b: post saknas i B                          → 1
#     T7  undantag som inte längre behövs                    → 1
#
#   Fail-closed — grinden kunde inte läsa paret
#     T8  policy-fil saknas                                  → 2
#     T9  LISTPARITET_PAR tom                                → 2
#     T10 fel antal fält i par-posten                        → 2
#     T11 en sidas fil saknas                                → 2
#     T12 start-markören saknas                              → 2
#     T13 slut-markören står före start-markören             → 2
#     T14 NOLL poster extraherade                            → 2
#     T15 undantag pekar på okänt par                        → 2
#     T16 undantag utan skäl                                 → 2
#     T17 undantag på B-sidan av ett a-till-b-par            → 2
#     T18 ogiltig riktning                                   → 2
#
# T14 är det viktigaste fallet i sviten. Ett uttryck som slutar matcha ger två
# TOMMA mängder, och tom == tom är grönt — grinden hade då rapporterat paritet
# på ett par den inte längre läser. Felläget är inte hypotetiskt: det inträffade
# under bygget, när ett uttryck som börjar med `--` lästes som en grep-flagga.
#
# T7 är det näst viktigaste. Ett undantag som ligger kvar efter att asymmetrin
# försvunnit maskerar nästa drift på samma post, alltså återinför grindens egen
# config precis den tysta lucka grinden finns för att stänga.
#
# Test-isolering: allt sker i en temp-katalog, städad via trap. INGEN ändring av
# real-repo.
#
# Användning: bash scripts/test-check-listparitet.sh
# Exit 0 om alla arton passerar, annars 1.
#
# Källa: TASK-85 · ADR-039 § lesson→grind (L43: en grind är inte en grind förrän
# dess fyrning fortlöpande verifieras).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATE="${REPO_ROOT}/scripts/check-listparitet.sh"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/test-listparitet.XXXXXX")"
trap 'rm -rf "${TEST_DIR}"' EXIT

pass=0
fail=0

report() {
    local namn="${1}" vantat="${2}" faktiskt="${3}"
    if [[ "${vantat}" == "${faktiskt}" ]]; then
        printf '  ✅ %-56s exit=%s\n' "${namn}" "${faktiskt}"
        pass=$((pass + 1))
    else
        printf '  ❌ %-56s exit=%s (väntat %s)\n' "${namn}" "${faktiskt}" "${vantat}"
        fail=$((fail + 1))
    fi
}

# Radera KATALOGEN, inte dess glob: `rm -rf dir/*` matchar inte dotfiles, och
# policy-filen börjar med punkt. Utan detta överlever den mellan fallen och gör
# "config saknas"-fallet grönt av fel skäl.
nollstall() {
    rm -rf "${TEST_DIR:?}"
    mkdir -p "${TEST_DIR}"
}

# En lista mellan markörer. Posterna står i kolumn 0; markörraderna bär
# blanksteg och plockas därför inte upp av uttrycket `^[a-z]+$`.
skriv_lista() {
    local fil="${1}"; shift
    {
        printf '# paritet:start p\n'
        printf '%s\n' "$@"
        printf '# paritet:slut p\n'
    } > "${TEST_DIR}/${fil}"
}

# $1 = riktning, $2 = undantags-block (flerradigt, kan vara tomt),
# $3 = A-uttryck (default ^[a-z]+$), $4 = B-fil (default b.txt)
skriv_policy() {
    local riktning="${1}" undantag="${2}" uttryck="${3:-^[a-z]+\$}" bfil="${4:-b.txt}"
    {
        printf '# shellcheck shell=bash\n'
        printf '# shellcheck disable=SC2034\n'
        printf 'LISTPARITET_PAR="\n'
        printf 'p:::%s:::a.txt:::# paritet:start p:::# paritet:slut p:::%s:::%s:::# paritet:start p:::# paritet:slut p:::^[a-z]+\\$\n' \
            "${riktning}" "${uttryck}" "${bfil}"
        printf '"\n'
        printf 'LISTPARITET_UNDANTAG="\n%s\n"\n' "${undantag}"
    } > "${TEST_DIR}/.listparitet-policy.conf"
}

kor() {
    (cd "${TEST_DIR}" && bash "${GATE}" >/dev/null 2>&1; echo $?)
}

printf '\ntest-check-listparitet — arton fall\n'
printf '%.0s─' {1..70}; printf '\n'

# ─── Paritet ────────────────────────────────────────────────────────────────

# T1 — grundfallet. Utan det vet vi inte om något av de röda fallen är rött av
# rätt skäl.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta gamma
skriv_policy bada ""
ec="$(kor)"
report "T1 två listor i synk" 0 "${ec}"

# T2 — DEN RIKTNING SOM BÄR FAIL-OPEN i repots klassnings-par: en post finns i
# A och inte i B.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta
skriv_policy bada ""
ec="$(kor)"
report "T2 post borttagen ur B → fäller" 1 "${ec}"

# T3 — omvänd riktning. `bada` kräver LIKHET, inte bara täckning.
nollstall
skriv_lista a.txt alpha beta
skriv_lista b.txt alpha beta gamma
skriv_policy bada ""
ec="$(kor)"
report "T3 post tillagd i B → fäller" 1 "${ec}"

# T4 — samma asymmetri som T2, men deklarerad. Utan denna väg vore grinden
# oanvändbar: repot HAR nio avsiktliga asymmetrier.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta
skriv_policy bada "p:::A:::gamma:::Avsiktlig — prövad i detta test."
ec="$(kor)"
report "T4 asymmetrin deklarerad som undantag → grönt" 0 "${ec}"

# T5/T6 — riktningen `a-till-b`. Den finns för prosa-sidan, som legitimt bär
# mer än den lista den ska täcka.
nollstall
skriv_lista a.txt alpha beta
skriv_lista b.txt alpha beta gamma delta
skriv_policy a-till-b ""
ec="$(kor)"
report "T5 a-till-b: B bär extra → grönt" 0 "${ec}"

nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta
skriv_policy a-till-b ""
ec="$(kor)"
report "T6 a-till-b: post saknas i B → fäller" 1 "${ec}"

# T7 — undantaget överlever asymmetrin. Här är listorna i synk OCH ett undantag
# står kvar; det maskerar nästa drift på just den posten.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta gamma
skriv_policy bada "p:::A:::gamma:::Kvarliggande undantag som inte längre svarar mot någon asymmetri."
ec="$(kor)"
report "T7 obehövligt undantag → fäller" 1 "${ec}"

# ─── Fail-closed ────────────────────────────────────────────────────────────

# T8 — utan config vet grinden inte vad den ska pröva. Att då säga grönt vore
# den värsta av alla utsagor.
nollstall
skriv_lista a.txt alpha
skriv_lista b.txt alpha
ec="$(kor)"
report "T8 policy-fil saknas" 2 "${ec}"

# T9 — tom par-lista är ett anropsfel, aldrig "inga par att vakta".
nollstall
skriv_lista a.txt alpha
skriv_lista b.txt alpha
printf '# shellcheck shell=bash\nLISTPARITET_PAR=""\n' > "${TEST_DIR}/.listparitet-policy.conf"
ec="$(kor)"
report "T9 LISTPARITET_PAR tom" 2 "${ec}"

# T10 — fel fältantal. Detta är också skyddsnätet under separator-valet: skulle
# ett värde någon gång bära `:::` fälls posten i stället för att tolkas fel.
nollstall
skriv_lista a.txt alpha
skriv_lista b.txt alpha
printf '# shellcheck shell=bash\nLISTPARITET_PAR="\np:::bada:::a.txt\n"\n' > "${TEST_DIR}/.listparitet-policy.conf"
ec="$(kor)"
report "T10 fel antal fält i par-posten" 2 "${ec}"

# T11 — en sida pekar på en fil som inte finns. Utan kontrollen hade regionen
# blivit tom och paret grönt.
nollstall
skriv_lista a.txt alpha
skriv_policy bada "" '^[a-z]+$' 'finns-inte.txt'
ec="$(kor)"
report "T11 en sidas fil saknas" 2 "${ec}"

# T12 — markören borttagen (någon skrev om ci.yml och tog markören med sig).
nollstall
skriv_lista a.txt alpha
printf 'alpha\n' > "${TEST_DIR}/b.txt"
skriv_policy bada ""
ec="$(kor)"
report "T12 start-markören saknas" 2 "${ec}"

# T13 — markörerna i omvänd ordning. Regionen blir tom, och tom region är exakt
# det tysta gröna T14 handlar om.
nollstall
skriv_lista a.txt alpha
printf '# paritet:slut p\nalpha\n# paritet:start p\n' > "${TEST_DIR}/b.txt"
skriv_policy bada ""
ec="$(kor)"
report "T13 slut-markör före start-markör" 2 "${ec}"

# T14 — uttrycket matchar inget. Tom == tom hade varit grönt.
nollstall
skriv_lista a.txt alpha beta
skriv_lista b.txt alpha beta
skriv_policy bada "" '^SIFFROR-SOM-INTE-FINNS[0-9]+$'
ec="$(kor)"
report "T14 NOLL poster extraherade" 2 "${ec}"

# T15 — felstavat par-namn i ett undantag. Undantaget gör då ingenting, och
# ingen märker det.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta
skriv_policy bada "fel-namn:::A:::gamma:::Skäl som aldrig läses eftersom par-namnet är fel."
ec="$(kor)"
report "T15 undantag pekar på okänt par" 2 "${ec}"

# T16 — undantag utan skäl. Ett undantag utan skrivet skäl är en tystad
# avvikelse; den formen accepteras inte.
nollstall
skriv_lista a.txt alpha beta gamma
skriv_lista b.txt alpha beta
skriv_policy bada "p:::A:::gamma:::"
ec="$(kor)"
report "T16 undantag utan skäl" 2 "${ec}"

# T17 — undantag på B-sidan av ett a-till-b-par. B får bära extra per
# riktningen, så undantaget är verkningslöst — och ett verkningslöst undantag
# ser ut att skydda något.
nollstall
skriv_lista a.txt alpha
skriv_lista b.txt alpha gamma
skriv_policy a-till-b "p:::B:::gamma:::Verkningslöst — B får bära extra i ett a-till-b-par."
ec="$(kor)"
report "T17 undantag på B-sidan av a-till-b" 2 "${ec}"

# T18 — ogiltig riktning. Grinden gissar inte.
nollstall
skriv_lista a.txt alpha
skriv_lista b.txt alpha
skriv_policy sidledes ""
ec="$(kor)"
report "T18 ogiltig riktning" 2 "${ec}"

# ─── Sammanfattning ─────────────────────────────────────────────────────────

printf '%.0s─' {1..70}; printf '\n'
printf '  %d gröna, %d röda\n\n' "${pass}" "${fail}"
[[ "${fail}" -eq 0 ]] || exit 1
exit 0
