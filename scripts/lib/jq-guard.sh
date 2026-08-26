#!/usr/bin/env bash
# scripts/lib/jq-guard.sh — delad presence+MINIMIVERSION-guard för jq.
# Sourcas av varje skript som anropar jq i grind-/landningsvägen; anropas
# ALDRIG direkt.
#
# VARFÖR FILEN FINNS: TASK-312 kartlade ~25 anropsställen (hela hook-/
# grindlagret: .claude/settings.json:9, samtliga deny-*.sh, stop-vakt.sh,
# katalogagarskap-*.sh, arbetsform-tillstand.sh, check-claims-tackning.sh,
# check-obesvarade-larm.sh m.fl.) som alla anropar en bar systembinär UTAN
# NÅGON versionskontroll — bara en presence-check (`command -v jq`). Till
# skillnad från shellcheck/actionlint/vale (CI-pinnade + lokalt
# version-asserterade via verify-ci-parity.mjs) och Supabase-CLI:t
# (scripts/lib/supabase-cli.sh, exakt npx-pinnad efter S108-incidenten) fanns
# ingen mekanism alls som skulle upptäcka en för gammal jq innan den tyst
# producerade fel utdata eller en förvirrande jq-syntaxfel mitt i en
# hook-körning.
#
# ═══ ANVÄNDNING — ERSÄTTER `command -v jq` RAKT AV ═══
#
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   # shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path;
#   # scripts/lib/jq-guard.sh lintas separat via ci.yml:s shellcheck-lista
#   source "${SCRIPT_DIR}/lib/jq-guard.sh"
#
#   jq_version_ok || <SAMMA action skriptet redan hade för `command -v jq`>
#   # t.ex.: jq_version_ok || exit 0
#   #        jq_version_ok || deny "jq saknas eller är för gammal — …"
#   #        jq_version_ok || die "jq krävs men saknas/är för gammal i PATH"
#
# `jq_version_ok` ÄNDRAR ALDRIG anroparens fail-semantik — den svarar bara
# 0/1 (plus ett skäl på stderr) och lämnar VILKEN åtgärd som följer helt åt
# anroparen, exakt som den bara `command -v jq`-checken redan gjorde. Detta
# är medvetet annorlunda än scripts/lib/supabase-cli.sh:s guard (som SJÄLV
# skriver en "✓ verifierad"-rad och äger hela avbrottet) — jq_version_ok är
# tänkt att droppas in på EXAKT samma plats en presence-check redan stod,
# utan att ändra kringliggande kod.
#
# ═══ VARFÖR MINIMIVERSION OCH INTE EXAKT PIN ═══
#
# Se .jq-version-policy.conf § VARFÖR MINIMIVERSION — jq är en systembinär
# vi inte äger installationsvägen för (Homebrew lokalt, ubuntu-latest-
# runnerns förinstallerade paket i CI), till skillnad från Supabase-CLI:t
# (npx-installerat, exakt pinningsbart).
#
# ═══ VARFÖR INGEN CACHE/MEMOIZERING ÖVER PROCESSER ═══
#
# Varje hook-anrop är en FRISTÅENDE process (harnesset spawnar ett nytt
# skal per PreToolUse-händelse) — en fil-baserad cache hade krävt egen
# race-hantering mellan parallella agenter (exakt den namnrymds-fälla den
# här repots egen scratchpad-konvention varnar för). `jq --version` kostar
# ~4 ms lokalt mätt (macOS, 2026-08-24, `time jq --version`) — samma
# storleksordning som den `command -v jq`-check den ersätter. Cachning hade
# löst ett problem som inte finns: kostnaden är redan försumbar mot att
# starta bash-processen som kör den.
#
# ═══ DEN ENA UNDANTAGNA ANROPSPUNKTEN ═══
#
# .claude/settings.json:9 (inline PreToolUse-kommandosträng, "CI-vakt-
# grinden") är MEDVETET INTE wirad till denna guard: den är redan repots
# hetaste kodväg (körs på VARJE Bash-anrop i VARJE session), och att
# source:a ett bash-bibliotek in i en redan citat-tung inline
# JSON-kommandosträng hade lagt sköra citat-lager till exakt den fil som,
# om den går sönder, stoppar Bash-verktyget för hela flottan. Täckningen är
# ändå reell: SAMMA PreToolUse "Bash"-matchare kör åtta ANDRA hook-skript i
# samma händelse (deny-resend-send.sh, deny-frammande-huvudkatalog.sh,
# deny-grind-genom-pipe.sh, deny-subagent-vantan.sh, deny-arbetsform-push.sh,
# deny-facit-godkand-skrivning.sh, deny-hemlighet-utskrift.sh,
# deny-prod-ref.sh) — samtliga nu wirade till jq_version_ok. Om jq är
# trasig/för gammal är den det för HELA batchen samtidigt (samma PATH,
# samma binär, samma tidpunkt); en `deny` från VILKEN SOM HELST av dessa
# åtta stoppar tool-anropet, oavsett körordning mellan hooks (ordningen
# mellan olika registrerade PreToolUse-block är INTE dokumenterat
# garanterad av Claude Code och antas därför inte här). Den inline-
# kommandosträngens EGET jq-anrop saknar dessutom redan i dag en
# presence-check (ingen `command -v jq`-rad finns där) — detta kort
# utökar inte den bristen, det dokumenterar den öppet i stället för att
# tyst lämna den.
#
# ═══ POLICYFILENS SÖKVÄG — LIB-RELATIV, INTE CWD-RELATIV ═══
#
# Varje ANNAN sourcad policy i detta repo (.arbetsform-push-policy.conf,
# .mail-lock-policy.conf, .facit-policy.conf, .precompact-policy.conf m.fl.)
# löses av sin ANROPARE som "${SCRIPT_DIR}/../.<namn>-policy.conf" — SCRIPT_DIR
# härlett ur ANROPARENS EGEN ${BASH_SOURCE[0]}, ALDRIG cwd. Skälet står i
# varje sådan fil: hook-skript körs med cwd = sessionens AKTUELLA
# arbetskatalog (dit en agent kan ha `cd`:at), inte nödvändigtvis repo-roten.
#
# Denna guard är en LIB, sourcad från MÅNGA olika anropare med olika
# SCRIPT_DIR-värden — att kräva att VARJE anropare räknar ut och skickar in
# sin egen "${SCRIPT_DIR}/../.jq-version-policy.conf" hade dupplicerat exakt
# den sökvägslogik denna fil finns för att centralisera. I stället härleder
# jq-guard.sh SIN EGEN plats (_JQ_GUARD_LIB_DIR, satt vid `source`-tillfället
# nedan — ${BASH_SOURCE[0]} pekar då på DENNA fil, oavsett vem som sourcar
# den) och räknar policyfilen relativt DÄR den bor: scripts/lib/jq-guard.sh
# → ../../.jq-version-policy.conf → repo-roten. Robust mot varje anropares
# cwd, utan att en enda anropare behöver känna till sökvägen.
_JQ_GUARD_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly _JQ_GUARD_LIB_DIR
_JQ_GUARD_DEFAULT_POLICY_FILE="${_JQ_GUARD_LIB_DIR}/../../.jq-version-policy.conf"
readonly _JQ_GUARD_DEFAULT_POLICY_FILE
#
# ═══ ENV-OVERRIDE (test-isolering) ═══
#
#   JQ_GUARD_POLICY_FILE   Policyfilens sökväg. Default: ovanstående,
#                          lib-relativt. Samma env-override-mönster som
#                          SUPABASE_CLI_POLICY_FILE i scripts/lib/
#                          supabase-cli.sh — sviten (scripts/test-jq-guard.sh)
#                          pekar om HELA filen, rör aldrig repots riktiga.
#
# DENNA FIL SOURCAS, KÖRS ALDRIG DIREKT — den sätter därför INGA globala
# `set`-flaggor. Anroparen äger sina egna `set`-flaggor; funktionerna nedan
# är skrivna för att bete sig korrekt oavsett om `set -e` är på eller av
# hos anroparen (explicit `||`/`if`-felhantering genomgående).

# jq_version_ok — fail-closed. Returnerar 0 om jq FINNS och dess version är
# >= policyns JQ_MIN_VERSION, annars 1 (skäl på stderr).
jq_version_ok() {
    local policy_file="${JQ_GUARD_POLICY_FILE:-${_JQ_GUARD_DEFAULT_POLICY_FILE}}"
    local JQ_MIN_VERSION=""

    if ! command -v jq > /dev/null 2>&1; then
        echo "jq saknas i PATH." >&2
        return 1
    fi

    if [[ ! -f "${policy_file}" ]]; then
        echo "jq-versionspolicyn saknas: ${policy_file} (fail-closed — vägrar gissa lägsta jq-version)." >&2
        return 1
    fi

    # shellcheck disable=SC2310  # avsiktligt: eget, tydligt skäl via if/echo
    # i stället för set -e:s tysta död — se filhuvudets "skrivna för att
    # bete sig korrekt oavsett anroparens set -e"-stycke.
    # shellcheck source=/dev/null
    if ! source "${policy_file}"; then
        echo "Kunde inte läsa ${policy_file} (syntaxfel?)." >&2
        return 1
    fi

    if [[ -z "${JQ_MIN_VERSION}" ]]; then
        echo "${policy_file} saknar JQ_MIN_VERSION (fail-closed — vägrar gissa lägsta jq-version)." >&2
        return 1
    fi

    local raw actual
    raw="$(jq --version 2> /dev/null)"
    # jq --version svarar "jq-1.7.1" eller "jq-1.7.1-apple" (Homebrew).
    actual="$(printf '%s' "${raw}" | sed -nE 's/^jq-([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/p')"

    if [[ -z "${actual}" ]]; then
        echo "Kunde inte tolka 'jq --version'-utdata ('${raw}')." >&2
        return 1
    fi

    # shellcheck disable=SC2310  # samma avsiktliga mönster som ovan.
    if ! _jq_guard_version_ge "${actual}" "${JQ_MIN_VERSION}"; then
        echo "jq ${actual} < policyns lägsta ${JQ_MIN_VERSION} (${policy_file}). Uppgradera jq (macOS: brew upgrade jq)." >&2
        return 1
    fi

    return 0
}

# _jq_guard_version_ge A B — sant (exit 0) om version A >= B (punktad,
# numerisk jämförelse komponent för komponent; saknade komponenter räknas
# som 0). Privat hjälpfunktion — anropas aldrig direkt utifrån.
_jq_guard_version_ge() {
    local a="$1" b="$2"
    local -a av bv
    IFS='.' read -ra av <<< "${a}"
    IFS='.' read -ra bv <<< "${b}"
    local max=${#av[@]}
    if ((${#bv[@]} > max)); then
        max=${#bv[@]}
    fi
    local i ai bi
    for ((i = 0; i < max; i++)); do
        ai="${av[i]:-0}"
        bi="${bv[i]:-0}"
        if ((10#${ai} > 10#${bi})); then
            return 0
        elif ((10#${ai} < 10#${bi})); then
            return 1
        fi
    done
    return 0
}
