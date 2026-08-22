#!/usr/bin/env bash
# scripts/test-visual-baselines-scope.sh — tvåsidigt bevis för
# scripts/visual-baselines-scope.sh (TASK-298).
#
# TVÅSIDIGT: skräp-input och noll matchande specar ska FÄLLA jobbet före
# bildgenereringen (SIDA 1); tom input och ett giltigt filter ska SLÄPPA
# IGENOM med rätt scope-utfall (SIDA 2). En grind som bara bevisats grön är
# ingen grind — ADR-039 § lesson-till-grind, L43.
#
# Utöver de två sidorna vaktas fyra INVARIANTER i visual-baselines.yml som
# hela uppdraget vilar på och som en framtida bekvämlighets-refaktor annars
# river tyst:
#   - default-kommandot är BYTE-IDENTISKT med det som kördes före TASK-298
#     (ingen input = hela sviten, exakt som förr),
#   - default-PR-titeln är byte-identisk med den gamla,
#   - inputen når ALDRIG ett run-block via ${{ }}-interpolation, bara via
#     env: (GitHubs egen script-injection-väg),
#   - GITHUB_TOKEN-formen är orörd och ingen PAT/secret har smugit in
#     (workflow-huvudets "noll nya secrets, noll rotationsyta").
#
# Riggen shimmar `npm` på PATH i stället för att fråga Playwright: testet ska
# pröva grindens logik, inte nätverket eller webbläsar-installationen, och
# ska kunna köra i CI utan att en browser finns. Samma rigg-tanke som
# scripts/test-check-nattvakt-dedup.sh (som matar ärenden ur en JSON-fil i
# stället för att fråga GitHub) — men här utan test-only-gren i själva
# grinden: produktionskoden vet inte om att den blir shimmad.
#
# Körs: bash scripts/test-visual-baselines-scope.sh
# Exit 0 = alla fall gröna. Exit 1 = minst ett fall rött.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRIND="${SCRIPT_DIR}/visual-baselines-scope.sh"
WORKFLOW="${SCRIPT_DIR}/../.github/workflows/visual-baselines.yml"

ANTAL=0
FEL=0

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

BIN="${TMP}/bin"
mkdir -p "${BIN}"

# --- npm-shimmen --------------------------------------------------------
# Loggar sitt anrop, skriver ut FAKE_NPM_UT och avslutar med FAKE_NPM_KOD.
# Anropsloggen är hur SIDA 2:s första fall bevisar att normalvägen aldrig
# ens frågar Playwright.
cat >"${BIN}/npm" <<'SHIM'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"${FAKE_NPM_LOGG}"
if [[ -n "${FAKE_NPM_UT:-}" ]]; then
    cat "${FAKE_NPM_UT}"
fi
exit "${FAKE_NPM_KOD:-0}"
SHIM
chmod +x "${BIN}/npm"

# Realistisk --list-utdata för ett filter som matchar en spec.
LIST_TRAFF="${TMP}/list-traff.txt"
cat >"${LIST_TRAFF}" <<'UT'
Listing tests:
  [visual-desktop] › visual/personer-promoverings-grind.spec.ts:89:3 › listläget
  [visual-mobile] › visual/personer-promoverings-grind.spec.ts:89:3 › listläget
Total: 2 tests in 1 file
UT

# Två specar — bevisar att alternation ger BÅDA i specfil-listan.
LIST_TVA="${TMP}/list-tva.txt"
cat >"${LIST_TVA}" <<'UT'
Listing tests:
  [visual-desktop] › visual/notis-visual.spec.ts:5:1 › notisen
  [visual-desktop] › visual/personer.spec.ts:5:1 › personlistan
  [visual-mobile] › visual/notis-visual.spec.ts:5:1 › notisen
  [visual-mobile] › visual/personer.spec.ts:5:1 › personlistan
Total: 4 tests in 2 files
UT

# Playwrights egen text när inget matchar.
LIST_TOM="${TMP}/list-tom.txt"
cat >"${LIST_TOM}" <<'UT'
Error: No tests found.
Make sure that arguments are regular expressions matching test files.
Listing tests:
Total: 0 tests in 0 files
UT

# Exit 0 men noll spec-rader — den tysta varianten grinden också måste fånga.
LIST_TYST="${TMP}/list-tyst.txt"
cat >"${LIST_TYST}" <<'UT'
Listing tests:
Total: 0 tests in 0 files
UT

# kor <filter> <fake-ut-fil> <fake-kod> — returnerar grindens exitkod och
# lämnar utfallet i ${SENAST_GHO} respektive ${SENAST_LOGG}.
SENAST_GHO=''
SENAST_LOGG=''
kor() {
    local filter="$1" fake_ut="$2" fake_kod="$3"
    local kod=0
    ANTAL=$((ANTAL + 1))
    SENAST_GHO="${TMP}/gho-${ANTAL}.txt"
    SENAST_LOGG="${TMP}/npmlogg-${ANTAL}.txt"
    : >"${SENAST_GHO}"
    : >"${SENAST_LOGG}"
    PATH="${BIN}:${PATH}" \
        FAKE_NPM_LOGG="${SENAST_LOGG}" \
        FAKE_NPM_UT="${fake_ut}" \
        FAKE_NPM_KOD="${fake_kod}" \
        VISUAL_SPECFILTER="${filter}" \
        GITHUB_OUTPUT="${SENAST_GHO}" \
        bash "${GRIND}" >"${TMP}/ut-${ANTAL}.txt" 2>&1 || kod=$?
    return "${kod}"
}

gront() {
    printf '  \033[32mOK\033[0m   %s\n' "$1"
}

rott() {
    FEL=$((FEL + 1))
    printf '  \033[31mFEL\033[0m  %s\n' "$1"
    printf '       %s\n' "$2"
}

# faller <beskrivning> <filter> [fake-ut] [fake-kod]
# SIDA 1: grinden ska avsluta med exit 1 och INTE skriva scope=riktad.
faller() {
    local desc="$1" filter="$2" fake_ut="${3:-}" fake_kod="${4:-0}"
    local kod=0
    kor "${filter}" "${fake_ut}" "${fake_kod}" || kod=$?
    if [[ "${kod}" -ne 1 ]]; then
        rott "${desc}" "väntade exit 1 (fail-closed), fick ${kod}"
        return
    fi
    if grep -q '^scope=' "${SENAST_GHO}"; then
        rott "${desc}" 'skrev ett scope-utfall trots att den skulle fälla'
        return
    fi
    gront "${desc}"
}

# slapper <beskrivning> <filter> <fake-ut> <väntat-scope> <väntad-filter-rad>
# SIDA 2: grinden ska avsluta med exit 0 och skriva rätt scope-utfall.
slapper() {
    local desc="$1" filter="$2" fake_ut="$3" vscope="$4" vfilter="$5"
    local kod=0 fick
    kor "${filter}" "${fake_ut}" 0 || kod=$?
    if [[ "${kod}" -ne 0 ]]; then
        fick="$(tr '\n' ' ' <"${TMP}/ut-${ANTAL}.txt")" || fick='(utdata kunde inte läsas)'
        rott "${desc}" "väntade exit 0, fick ${kod} — utdata: ${fick}"
        return
    fi
    if ! grep -qxF "scope=${vscope}" "${SENAST_GHO}"; then
        fick="$(grep '^scope=' "${SENAST_GHO}")" || fick='inget'
        rott "${desc}" "väntade scope=${vscope}, fick: ${fick}"
        return
    fi
    if ! grep -qxF "filter=${vfilter}" "${SENAST_GHO}"; then
        fick="$(grep '^filter=' "${SENAST_GHO}")" || fick='inget'
        rott "${desc}" "väntade filter=${vfilter}, fick: ${fick}"
        return
    fi
    gront "${desc}"
}

# utfallet — hela GITHUB_OUTPUT på en rad, för felmeddelanden.
utfallet() {
    local rad
    rad="$(tr '\n' ' ' <"${SENAST_GHO}")" || rad='(kunde inte läsas)'
    printf '%s' "${rad}"
}

# invariant <beskrivning> <väntat-antal-träffar> <regex>
# Vaktar en literal i visual-baselines.yml. Fäller både när literalen
# försvinner OCH när den dyker upp fler gånger än den ska.
invariant() {
    local desc="$1" vantat="$2" regex="$3"
    local traffar
    ANTAL=$((ANTAL + 1))
    traffar="$(grep -cE "${regex}" "${WORKFLOW}")"
    if [[ "${traffar}" -ne "${vantat}" ]]; then
        rott "${desc}" "väntade ${vantat} träff(ar) på /${regex}/, fick ${traffar}"
        return
    fi
    gront "${desc}"
}

printf '\n== SIDA 1: skräp-input och noll träffar ska FÄLLA ==\n'

faller 'mellanslag i filtret fälls'                      'personer promoverings'
faller 'semikolon fälls'                                 'personer;rm'
# De två nästa payloaderna SKA vara oexpanderade literaler — det är precis
# vad grinden ska vägra ta emot. SC2016 vore rätt varning i annan kod.
# shellcheck disable=SC2016
faller 'dollar-parentes fälls'                           'personer$(id)'
# shellcheck disable=SC2016
faller 'bakåtcitat fälls'                                'personer`id`'
faller 'radbrytning fälls (GITHUB_OUTPUT-injektion)'     'personer
scope=full'
faller 'enbart blanksteg fälls (aldrig tyst full körning)' ' '
faller 'ledande bindestreck fälls (argument-injektion)'  '--reporter=json'
faller 'ensamt bindestreck fälls'                        '-'
faller 'filter över 200 tecken fälls'                    "$(printf 'a%.0s' {1..201})"
faller 'noll matchande specar fälls'                     'zzz-finns-inte' "${LIST_TOM}" 1
faller 'exit 0 men noll spec-rader fälls'                'zzz-tyst' "${LIST_TYST}" 0

printf '\n== SIDA 2: normalvägen och giltiga filter ska SLÄPPA IGENOM ==\n'

slapper 'tom input ger scope=full'            ''  '' 'full' ''
if [[ -s "${SENAST_LOGG}" ]]; then
    NPM_ANROP="$(tr '\n' ' ' <"${SENAST_LOGG}")" || NPM_ANROP='(kunde inte läsas)'
    rott 'normalvägen frågar aldrig Playwright' "npm anropades: ${NPM_ANROP}"
else
    ANTAL=$((ANTAL + 1))
    gront 'normalvägen frågar aldrig Playwright (npm-shimmen orörd)'
fi

slapper 'giltigt filter ger scope=riktad'     'personer-promoverings-grind' "${LIST_TRAFF}" 'riktad' 'personer-promoverings-grind'
ANTAL=$((ANTAL + 1))
if grep -qx 'visual/personer-promoverings-grind.spec.ts' "${SENAST_GHO}" \
    && grep -qx 'antal_tester=2' "${SENAST_GHO}"; then
    gront 'riktat utfall bär spec-sökväg och testantal'
else
    rott 'riktat utfall bär spec-sökväg och testantal' "fick: $(utfallet || true)"
fi

slapper 'alternation släpps igenom'           'notis-visual|personer' "${LIST_TVA}" 'riktad' 'notis-visual|personer'
ANTAL=$((ANTAL + 1))
if grep -qx 'visual/notis-visual.spec.ts' "${SENAST_GHO}" \
    && grep -qx 'visual/personer.spec.ts' "${SENAST_GHO}"; then
    gront 'alternation ger BÅDA specarna i utfallet'
else
    rott 'alternation ger BÅDA specarna i utfallet' "fick: $(utfallet || true)"
fi

slapper 'ankare i slutet släpps igenom'       'personer.spec.ts$' "${LIST_TRAFF}" 'riktad' 'personer.spec.ts$'
slapper 'sökvägsfragment släpps igenom'       'visual/notis-visual' "${LIST_TRAFF}" 'riktad' 'visual/notis-visual'

printf '\n== INVARIANTER i visual-baselines.yml ==\n'

# Default-kommandot måste överleva ordagrant. Raden är den enda som får köra
# hela sviten, och den får inte bära något filter-argument.
invariant 'default-kommandot är byte-identiskt (hela sviten, inget filter)' \
    1 '^ +npm run test:visual -- --update-snapshots$'

# ORDNINGEN ÄR LOAD-BEARING, inte kosmetik. `-u, --update-snapshots [mode]`
# tar ett VALFRITT argument, så formen `--update-snapshots "${FILTER}"`
# läser filtret som LÄGE och dör med "argument ... is invalid. Allowed
# choices are all, changed, missing, none." Mätt skarpt i run 32590344458
# (2026-08-22) — första riktade dispatchen föll på exakt detta. Med filtret
# FÖRE flaggan står --update-snapshots sist utan efterföljande token och
# behåller sitt preset, så båda grenarna bär flaggan i identisk bar form.
invariant 'det riktade kommandot sätter filtret FÖRE flaggan' \
    1 '^ +npm run test:visual -- "\$\{FILTER\}" --update-snapshots$'

# Default-titeln likaså: en granskare som ser den gamla titeln ska kunna
# lita på att körningen var fullständig.
invariant 'default-PR-titeln är oförändrad' \
    1 'test\(visual\): baseline-uppdatering ur CI \(\$\{antal\} bilder\)'

# Inputen får bara nå skalet via env:. Direkt ${{ }}-interpolation i ett
# run-block är GitHubs kanoniska script-injection-väg.
invariant 'inputen når skalet ENDAST via env:' \
    1 '^ +[A-Z_]+: \$\{\{ inputs\.specfilter \}\}$'
invariant 'inputen förekommer ingen annanstans än i den env-raden' \
    1 'inputs\.specfilter'

# GITHUB_TOKEN-formen är medvetet vald (workflow-huvudet: noll nya secrets).
invariant 'GITHUB_TOKEN-formen är orörd' \
    1 '^ +GH_TOKEN: \$\{\{ github\.token \}\}$'
invariant 'ingen PAT eller annan secret har smugit in' \
    0 'secrets\.'

printf '\n'
if [[ "${FEL}" -eq 0 ]]; then
    printf '\033[32mtest-visual-baselines-scope: %d/%d gröna.\033[0m\n' "${ANTAL}" "${ANTAL}"
    exit 0
fi
printf '\033[31mtest-visual-baselines-scope: %d av %d FÖLL.\033[0m\n' "${FEL}" "${ANTAL}"
exit 1
