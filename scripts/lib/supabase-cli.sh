#!/usr/bin/env bash
# scripts/lib/supabase-cli.sh — delad resolver för en PINNAD Supabase CLI-
# version. Sourcas av varje skript som anropar Supabase CLI:t; anropas
# ALDRIG direkt.
#
# VARFÖR FILEN FINNS: sju anropsställen (scripts/deploy-prod-functions.sh,
# scripts/fas4-prod-deploy.sh × 4, scripts/kontrollera-bilagor-bucket.sh)
# bar var sin form — bar `supabase`, `npx supabase` utan pin — och den bara
# formen FÄLLDE skarpt i prod (S108, 2026-08-24): den globala CLI:n 2.75.0
# kunde inte öppna `_shared/mallar/kvitto.css.ts` (25 kB enkelrads-
# strängmodul) som fil-asset och avbröt deployen efter 18 av 45 funktioner.
# `npx supabase` (2.115.0, husets ANDRA CLI-väg) klarade samma funktion mot
# samma mål utan fel — se .supabase-cli-policy.conf § VARFÖR FILEN FINNS
# för hela differentialmätningen. Full motivering för VARFÖR delad fil i
# stället för sju separata fixar, och VARFÖR scripts/lib/ (hittills bara
# .mjs-hjälpare) i stället för flat scripts/*.sh: se § PLACERING nedan.
#
# ═══ PLACERING — VARFÖR scripts/lib/ OCH INTE FLAT scripts/*.sh ═══
#
#   Varje skript under scripts/*.sh i detta repo är i dag ett SJÄLVSTÄNDIGT,
#   direkt körbart program (usage/exit, egen `set -eu[o pipefail]`) — det
#   finns INGEN befintlig "sourcas av flera syskon"-fil i den flata
#   scripts/-katalogen. scripts/lib/ är däremot REDAN husets utpekade plats
#   för delad, återanvändbar kod som flera andra skript importerar
#   (facit-validera.mjs, staging-preflight.mjs, farg.mjs, skala.mjs) — bara
#   som .mjs hittills, eftersom allt tidigare delat-kod-behov var
#   JS-sidan. Den här filen är den FÖRSTA .sh-filen där, men SYFTET matchar
#   katalogens etablerade roll exakt: en fil ingen kör direkt, som flera
#   andra filer sourcar. Att lägga den flat i scripts/ hade krävt att bryta
#   mönstret att flat scripts/*.sh alltid är körbara program — scripts/lib/
#   bryter INGET, det fyller en tom lucka i en redan existerande katalogs
#   redan existerande syfte.
#
#   KÄND KONSEKVENS, öppet bokförd: CI:s shellcheck-strict-scope är
#   `scripts/*.sh` (FLAT glob, ej rekursiv — .github/workflows/ci.yml §
#   Validate bash scripts with shellcheck-strict) plus en explicit lista av
#   sourcade .conf-filer. En fil i scripts/lib/ täcks INTE automatiskt av
#   den globen — denna fil är därför explicit tillagd till shellcheck-
#   listan i ci.yml (samma "en sourcad fil utanför scopet är samma lucka
#   som de övriga redan stänger"-princip som .conf-filerna där, TASK-203-
#   kommentaren i ci.yml).
#
# ═══ ANVÄNDNING ═══
#
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   # shellcheck source=lib/supabase-cli.sh
#   source "${SCRIPT_DIR}/lib/supabase-cli.sh"
#
#   supabase_cli_guard || doden "..." 2   # EN gång, tidigt i preflighten —
#                                          # se § GUARDEN nedan för varför.
#   supabase_cli functions deploy "${fn}" --project-ref "${ref}"
#   supabase_cli link --project-ref "${ref}"
#   supabase_cli functions list --project-ref "${ref}"
#   supabase_cli secrets list --project-ref "${ref}"
#   supabase_cli projects api-keys --project-ref "${ref}" -o json
#
#   `supabase_cli` ÄR den enda anropsformen — den ersätter varje `supabase`/
#   `npx supabase`-rad i repot rakt av (samma argument, samma stdout/stderr/
#   exitkod-kontrakt som en vanlig `npx <paket> <args...>`-invokering).
#
# DENNA FIL SOURCAS, KÖRS ALDRIG DIREKT — den sätter därför INGA globala
# `set`-flaggor (`set -e`/`set -u`/`set -o pipefail` sourcat in i
# anroparens skal skulle byta ANROPARENS shell-semantik bakom dess rygg).
# Anroparen äger sina egna `set`-flaggor; funktionerna nedan är skrivna för
# att bete sig korrekt oavsett om `set -e` är på eller av hos anroparen
# (explicit `||`/`if`-felhantering genomgående, aldrig implicit på `set -e`).
#
# ═══ ENV-OVERRIDE (test-isolering) ═══
#
#   Samma mönster som ALLOWLIST_FILE/FUNCTIONS_DIR i
#   scripts/deploy-prod-functions.sh — cwd-relativ default, overridebar via
#   env så testsviter kan köra i sandlåda utan att röra repots riktiga
#   policyfil:
#
#   SUPABASE_CLI_POLICY_FILE   Policyfilens sökväg. Default: cwd-relativt
#                              ".supabase-cli-policy.conf".
#
#   Sviterna (scripts/test-supabase-cli-policy.sh, utökningen i
#   scripts/test-deploy-prod-functions.sh) stubbar dessutom `npx` på PATH —
#   se resp. svit för formen. Ingen nätverkstrafik i någon testkörning.
#
# ═══ GUARDEN — VARFÖR "EN GÅNG, TIDIGT" OCH INTE "VID VARJE ANROP" ═══
#
#   `supabase_cli_guard` kör `npx --yes "supabase@${SUPABASE_CLI_VERSION}"
#   --version` en gång och jämför UTDATAN mot policyns värde — inte bara att
#   policyn syntaktiskt går att läsa, utan att den FAKTISKT UPPLÖSTA
#   versionen är exakt den pinnade. `supabase_cli()` själv gör INTE denna
#   extra --version-runda vid varje anrop (det hade dubblerat varje
#   operations kostnad i onödan för en kontroll vars svar inte ändras mellan
#   anrop inom samma körning) — poängen med "en gång, tidigt" är att ett
#   trasigt/omöjligt-att-lösa CLI upptäcks INNAN första funktionen deployas,
#   aldrig mitt i en halv deploy (exakt den skada S108:s incident orsakade).
#
# ═══ --yes ÄR INTE KOSMETISKT ═══
#
#   `npx <paket>@<version>` FRÅGAR "Ok to proceed?" om paketet/versionen inte
#   redan finns i npx-cachen OCH stdin är en TTY (npm-dokumenterat
#   beteende). Marcus egen terminal ÄR en TTY — utan `--yes` hade den FÖRSTA
#   körningen mot en ny pinnad version sett ut som en hängning, exakt den
#   felklass fas4-prod-deploy.sh:s `lanka()`-hjälpare redan skyddar mot för
#   `supabase link` (se den filens § header, fälla (a): "en hängning är
#   inget felmeddelande"). `--yes` gör pinnningen deterministisk oavsett
#   TTY-läge.

SUPABASE_CLI_POLICY_FILE="${SUPABASE_CLI_POLICY_FILE:-.supabase-cli-policy.conf}"
SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-}"

# _supabase_cli_load_policy — lazy, memoized. Fail-closed: saknad policyfil
# eller saknad SUPABASE_CLI_VERSION i den är ett HÅRT fel (returnerar 1 med
# ett läsbart skäl på stderr), aldrig en tyst gissning.
_supabase_cli_load_policy() {
    [[ -n "${SUPABASE_CLI_VERSION}" ]] && return 0

    if [[ ! -f "${SUPABASE_CLI_POLICY_FILE}" ]]; then
        echo "❌ Supabase CLI-policyn saknas: ${SUPABASE_CLI_POLICY_FILE} (fail-closed — vägrar gissa CLI-version)." >&2
        return 1
    fi

    # shellcheck source=/dev/null
    if ! source "${SUPABASE_CLI_POLICY_FILE}"; then
        echo "❌ Kunde inte läsa ${SUPABASE_CLI_POLICY_FILE} (syntaxfel?)." >&2
        return 1
    fi

    if [[ -z "${SUPABASE_CLI_VERSION:-}" ]]; then
        echo "❌ ${SUPABASE_CLI_POLICY_FILE} saknar SUPABASE_CLI_VERSION (fail-closed — vägrar gissa CLI-version)." >&2
        return 1
    fi
    return 0
}

# supabase_cli <args...> — DEN ENA anropsformen alla sju ställen använder.
# Ersätter varje `supabase`/`npx supabase`-rad rakt av.
supabase_cli() {
    # shellcheck disable=SC2310  # avsiktligt: vill ge eget, tydligt skäl via
    # echo/return i stället för `set -e`:s tysta död — se filhuvudets
    # "skrivna för att bete sig korrekt oavsett anroparens set -e"-stycke.
    _supabase_cli_load_policy || return 1
    npx --yes "supabase@${SUPABASE_CLI_VERSION}" "$@"
}

# supabase_cli_guard — fail-closed, körs EN gång tidigt i preflighten.
# Verifierar att den FAKTISKT UPPLÖSTA CLI-versionen är EXAKT policyns —
# se filhuvudets § GUARDEN för varför detta är mer än ett syntax-check av
# policyfilen.
supabase_cli_guard() {
    # shellcheck disable=SC2310  # samma avsiktliga mönster som ovan.
    _supabase_cli_load_policy || return 1

    local faktisk
    if ! faktisk="$(npx --yes "supabase@${SUPABASE_CLI_VERSION}" --version 2> /dev/null)"; then
        echo "❌ Kunde inte köra 'npx supabase@${SUPABASE_CLI_VERSION} --version' — CLI-versionen gick inte att slå upp/köra. Kontrollera nätverk/npm-registret." >&2
        return 1
    fi

    if [[ "${faktisk}" != "${SUPABASE_CLI_VERSION}" ]]; then
        echo "❌ Supabase CLI upplöstes till '${faktisk}', policyn (${SUPABASE_CLI_POLICY_FILE}) kräver EXAKT '${SUPABASE_CLI_VERSION}'. Stoppar hellre än att deploya med fel CLI-version — se S108-incidenten i .supabase-cli-policy.conf." >&2
        return 1
    fi

    echo "✓ Supabase CLI verifierad: ${faktisk} (pinnad, ${SUPABASE_CLI_POLICY_FILE})"
    return 0
}
