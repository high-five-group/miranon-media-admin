#!/usr/bin/env bash
# scripts/visual-baselines-scope.sh — avgör och VALIDERAR vilken delmängd av
# visual-sviten en baseline-dispatch ska köra (TASK-298).
#
# VARFÖR DEN FINNS. visual-baselines.yml var allt-eller-inget: den kör hela
# sviten med --update-snapshots och failar hårt, så EN familjs röda test
# blockerar hela födseln. Mätt 2026-08-22, run 32587783890: 238 passed,
# 8 failed — samtliga åtta i hem-familjen — och därmed skapades ingen PR
# alls, så notisfamiljens och personlistans baslinjer kunde inte födas.
#
# VARFÖR DEN ÄR EN EGEN FIL OCH INTE INLINE YAML. Det här är en fail-closed
# grind, och en grind är inte en grind förrän dess fyrning FORTLÖPANDE
# verifieras (ADR-039 § lesson-till-grind, L43). Som scripts/*.sh ligger den
# dessutom i shellcheck-strict-scopet (ADR-033 § Del 3) — inline run-block i
# workflow-YAML gör det inte. Tvåsidigt bevis:
# scripts/test-visual-baselines-scope.sh (CI-wirad i ci.yml:s lint-jobb).
#
# KONTRAKT.
#   In:  VISUAL_SPECFILTER  — rå workflow_dispatch-input. Tom/osatt = hela
#                             sviten (NORMALVÄGEN — riktad körning är ett
#                             medvetet undantag, aldrig default).
#   Ut:  nyckel=värde-rader till ${GITHUB_OUTPUT:-/dev/stdout}:
#          scope=full|riktad
#          filter=<mönstret, tomt vid full>
#          antal_tester=<N, tomt vid full>
#          specfiler<<DELIM ... DELIM  (spec-sökvägar, tomt vid full)
#   Exit 0 = scopet avgjort. 1 = skräp-input eller noll matchande specar
#            (FAIL-CLOSED — jobbet ska dö före bildgenereringen).
#            2 = anropsfel (kan inte skriva utfallet).
#
# VARFÖR TECKENUPPSÄTTNINGEN ÄR SNÄV. Värdet når skalet enbart som en
# ENV-variabel i citerad expansion, så skal-injektion är utesluten redan av
# formen — men tre andra vägar återstår och stängs här: ett ledande
# bindestreck blir argument-injektion i Playwright-CLI:t, en radbrytning kan
# injicera egna nycklar i GITHUB_OUTPUT, och en obegränsad längd är en
# onödig yta. Allowlisten räcker för spec-basnamn, sökvägsfragment,
# alternation och ankare — allt annat fälls med utskriven tillåten mängd.
#
# URVALET ÄRVS, DUPLICERAS ALDRIG. Skriptet frågar `npm run test:visual --
# --list`, alltså exakt samma kommando som bildgenereringen använder. Att i
# stället skriva av --project-flaggorna hit hade skapat en andra kopia av
# vilka projekt visual-sviten består av (ADR-100 §2: karta, aldrig kopia).
# --list startar varken webbserver eller webbläsare — mätt 2026-08-22:
# 2,3 s lokalt, och exit 0 med PLAYWRIGHT_BROWSERS_PATH pekad på en tom
# katalog. Därför kan steget ligga FÖRE `playwright install chromium` och
# fälla skräp-input innan den dyra halvan av jobbet ens börjar.
#
# Körs: VISUAL_SPECFILTER=<mönster> bash scripts/visual-baselines-scope.sh

set -uo pipefail

# Tillåtna tecken i filtret. Literalen används BÅDE i prövningen och i
# felmeddelandet — de kan därför inte drifta isär.
TILLATNA='A-Za-z0-9._/|()*+^$-'
MAXLANGD=200

UTFIL="${GITHUB_OUTPUT:-/dev/stdout}"

fel() {
    printf 'visual-baselines-scope: %s\n' "$1" >&2
}

# skriv_utfall <scope> <filter> <antal> <specfiler>
# Delimitern genereras per körning och kontrolleras mot innehållet: en
# specfil-lista som bar delimitern hade kunnat injicera egna nycklar i
# GITHUB_OUTPUT. Fail-closed (exit 2) i stället för att skriva ändå.
skriv_utfall() {
    local scope="$1" filter="$2" antal="$3" specfiler="$4"
    local delim tid
    tid="$(date +%s)"
    delim="VBSCOPE_$$_${tid}_EOF"
    if printf '%s' "${specfiler}" | grep -qF "${delim}"; then
        fel 'INTERNT: delimitern förekommer i specfil-listan — skriver inte utfallet.'
        return 2
    fi
    {
        printf 'scope=%s\n' "${scope}"
        printf 'filter=%s\n' "${filter}"
        printf 'antal_tester=%s\n' "${antal}"
        printf 'specfiler<<%s\n' "${delim}"
        printf '%s\n' "${specfiler}"
        printf '%s\n' "${delim}"
    } >>"${UTFIL}"
    local skrivkod=$?
    if [[ "${skrivkod}" -ne 0 ]]; then
        fel "INTERNT: kunde inte skriva till ${UTFIL} (exit ${skrivkod})."
        return 2
    fi
    return 0
}

FILTER="${VISUAL_SPECFILTER:-}"

# --- NORMALVÄGEN: ingen input = hela sviten -----------------------------
if [[ -z "${FILTER}" ]]; then
    printf 'SCOPE: FULL — hela visual-sviten (ingen filter-input).\n'
    skriv_utfall 'full' '' '' ''
    exit $?
fi

# --- Fail-closed-prövningen av inputen ----------------------------------
if [[ "${#FILTER}" -gt "${MAXLANGD}" ]]; then
    fel "FILTRET ÄR FÖR LÅNGT: ${#FILTER} tecken, taket är ${MAXLANGD}."
    fel 'Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
    exit 1
fi

case "${FILTER}" in
    -*)
        fel "FILTRET BÖRJAR MED BINDESTRECK: ${FILTER}"
        fel 'Ett ledande bindestreck blir en flagga till Playwright-CLI:t, inte ett'
        fel 'sökvägsfilter. Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
        exit 1
        ;;
    *) ;;
esac

if ! printf '%s' "${FILTER}" | grep -Eq "^[${TILLATNA}]+\$"; then
    fel 'FILTRET INNEHÅLLER OTILLÅTNA TECKEN.'
    fel "Tillåtna tecken: ${TILLATNA} (regex-teckenklass)."
    fel 'Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
    exit 1
fi

# --- Upplösningen: matchar mönstret någon spec över huvud taget? --------
LISTA="$(mktemp)"
trap 'rm -f "${LISTA}"' EXIT

LISTKOD=0
npm run test:visual -- --list "${FILTER}" >"${LISTA}" 2>&1 || LISTKOD=$?

if [[ "${LISTKOD}" -ne 0 ]]; then
    fel "FILTRET MATCHAR INGEN SPEC: ${FILTER} (playwright --list exit ${LISTKOD})."
    fel 'Playwrights eget svar:'
    sed 's/^/    /' "${LISTA}" >&2
    fel 'Kör "npm run test:visual -- --list" utan filter för att se hela urvalet.'
    fel 'Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
    exit 1
fi

# Sökvägarna rapporteras VERBATIM som Playwright skriver dem (relativa
# testDir) — att normalisera dem hit hade duplicerat testDir-värdet.
SPECFILER="$(grep -oE '[A-Za-z0-9._/-]+\.spec\.ts' "${LISTA}" | sort -u)"

if [[ -z "${SPECFILER}" ]]; then
    fel "FILTRET GAV NOLL SPECAR trots exit 0 från --list: ${FILTER}"
    fel 'Playwrights eget svar:'
    sed 's/^/    /' "${LISTA}" >&2
    fel 'Avbryter FÖRE bildgenereringen — ingen PR öppnas.'
    exit 1
fi

ANTAL="$(sed -n 's/^Total: \([0-9][0-9]*\) test.*/\1/p' "${LISTA}" | tail -n 1)"
if [[ -z "${ANTAL}" ]]; then
    ANTAL='okänt antal'
fi

printf 'SCOPE: RIKTAD — filter %s\n' "${FILTER}"
printf 'Matchande specar:\n'
printf '%s\n' "${SPECFILER}" | sed 's/^/  - /'
printf 'Matchande tester: %s\n' "${ANTAL}"

skriv_utfall 'riktad' "${FILTER}" "${ANTAL}" "${SPECFILER}"
exit $?
