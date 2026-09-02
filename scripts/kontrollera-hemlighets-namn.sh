#!/usr/bin/env bash
# scripts/kontrollera-hemlighets-namn.sh — read-only kontroll att en känd,
# config-driven mängd Supabase-hemligheter FINNS (namn, inte värde) i ett
# projekt. Anropad av scripts/fas4-prod-deploy.sh --kontrollera (TASK-359).
#
# VARFÖR SKRIPTET FINNS: `INVITE_REDIRECT_URL` saknades i BÅDA Supabase-
# projekten sedan de skapades (prod 2026-03-30, staging 2026-06-13) fram
# till 2026-09-02 — `supabase/functions/invite-user/index.ts:260`
# normaliserar tomt till `undefined`, ingen `redirectTo` skickas (rad 269),
# och Supabase Auth faller tillbaka på projektets bara `site_url`
# (`https://admin.miranon.dev`, UTAN sökväg) i stället för accept-sidan
# `/valkommen`. `fas4-prod-deploy.sh --kontrollera` skrev redan en PROSA-
# notis om exakt detta ("LÄS DETTA I UTDATAN OVAN") — mätt tre gånger
# (S107, S108, S113) att prosan INTE fångades som åtgärdbart av den som
# läste utdatan. Se `docs/reference/atkomst-och-nycklar.md` § "Bifynd,
# bokfört" för hela incidenthistoriken.
#
# VARFÖR EGEN FIL, INTE INLINE I fas4-prod-deploy.sh: samma skäl som
# `kontrollera-bilagor-bucket.sh` (TASK-308) — fas4-prod-deploy.sh är ett
# top-level-skript med `set -euo pipefail` och omedelbar argumentparsning;
# att testa logiken i isolering utan att köra HELA skriptet (preflight,
# git-kontroller, ev. länkning) kräver en egen, avgränsad fil som anropas
# som SUBPROCESS.
#
# VARFÖR CONFIG-DRIVEN (CLAUDE.md § "Custom CI-grindvakts-logik i spokes är
# alltid config-driven"): skriptets LOGIK (lista namn, jämför mot
# `secrets list`-utdata, ✓/✗ per namn) är universell och kan duplicera till
# andra spokes utan refactor; den KRÄVDA MÄNGDEN NAMN är projektspecifik
# data och bor i `.hemlighets-namn-policy.conf` — samma separation som
# `.prod-ref-policy.conf` (scripts/deny-prod-ref.sh) och
# `.hemlighet-utskrift-policy.conf` (scripts/deny-hemlighet-utskrift.sh).
#
# ANVÄNDNING:
#   bash scripts/kontrollera-hemlighets-namn.sh <project-ref>
#
# ENV-OVERRIDE (test-isolering, samma mönster som KONTROLL_CMD i
# kontrollera-bilagor-bucket.sh):
#   HEMLIGHET_LISTA_CMD        Ersätter HELA `supabase secrets list`-anropet
#                              med ett eget kommando (får <ref> som $1,
#                              förväntas skriva secrets-list-liknande text
#                              till stdout). Testsviten
#                              (test-fas4-prod-deploy.sh) använder detta
#                              för att simulera "alla namn finns" resp.
#                              "ett namn saknas" utan riktig Supabase-
#                              åtkomst eller prod-ref i kommandoraden.
#   HEMLIGHETS_NAMN_POLICY_FILE  Policyfilens sökväg. Default: repo-roten
#                              relativt denna fil, ".hemlighets-namn-
#                              policy.conf" — samma cwd-oberoende mönster
#                              som SUPABASE_CLI_POLICY_FILE i
#                              scripts/lib/supabase-cli.sh.
#
# Exit 0 = alla krävda namn hittades i listnings-utdatan.
# Exit 1 = minst ett krävt namn saknas, ref saknas, policyn saknas/är tom,
#          eller listnings-anropet självt misslyckades — FAIL-CLOSED, samma
#          doktrin som resten av fas4-sviten.
#
# Källa: TASK-359 · .hemlighets-namn-policy.conf ·
#        docs/reference/atkomst-och-nycklar.md § Bifynd ·
#        scripts/fas4-prod-deploy.sh · scripts/kontrollera-bilagor-bucket.sh
#        (formmall för env-override + fail-closed-doktrin)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROT="$(cd "${SCRIPT_DIR}/.." && pwd)"
POLICY="${HEMLIGHETS_NAMN_POLICY_FILE:-${REPO_ROT}/.hemlighets-namn-policy.conf}"
REF="${1:-}"

if [[ -z "${REF}" ]]; then
    echo "❌ Project-ref saknas (anges explicit, aldrig ur config)." >&2
    exit 1
fi

if [[ ! -f "${POLICY}" ]]; then
    echo "❌ Policyfilen ${POLICY} saknas — kan inte veta vilka hemligheter som krävs." >&2
    exit 1
fi

# Förinitierad TOM före källning — INTE kosmetiskt. macOS systembash (3.2,
# fortfarande `/bin/bash` på utvecklingsmaskinen) behandlar en HELT osatt
# array-referens under `set -u` inkonsekvent (uppmätt: ibland tyst tomt
# resultat, ibland ett skript-avbrott mitt i, beroende på vilket uttryck som
# refererar den) — snarare än det dokumenterade "icke-interaktivt skal
# avslutar" för skalär `nounset`. Genom att garantera att arrayen ALLTID är
# DEKLARERAD (tom eller fylld av policyn) innan den läses blir efterföljande
# `${#KRAVDA_HEMLIGHETER[@]}`-räkning portabel över bash 3.2 → 5.x utan att
# förlita sig på detta kvirk.
KRAVDA_HEMLIGHETER=()

# shellcheck source=/dev/null  # dynamisk REPO_ROT-relativ path, override-bar via HEMLIGHETS_NAMN_POLICY_FILE (test-isolering)
if ! source "${POLICY}"; then
    echo "❌ Kunde inte läsa ${POLICY} (syntaxfel?)." >&2
    exit 1
fi

if [[ "${#KRAVDA_HEMLIGHETER[@]}" -eq 0 ]]; then
    echo "❌ Policyn ${POLICY} definierar noll krävda hemlighets-namn (KRAVDA_HEMLIGHETER)." >&2
    exit 1
fi

if [[ -n "${HEMLIGHET_LISTA_CMD:-}" ]]; then
    # shellcheck disable=SC2086  # medveten word-splitting: env-overriden är
    # en kommandorad ("cmd arg1 arg2"), inte en enda token — test-isolering,
    # samma mönster som KONTROLL_CMD i kontrollera-bilagor-bucket.sh.
    UTDATA="$(${HEMLIGHET_LISTA_CMD} "${REF}" 2>&1)"
    KOD=$?
else
    # shellcheck source=/dev/null  # dynamisk SCRIPT_DIR-relativ path; scripts/lib/supabase-cli.sh lintas separat via ci.yml:s shellcheck-lista
    source "${SCRIPT_DIR}/lib/supabase-cli.sh"
    UTDATA="$(supabase_cli secrets list --project-ref "${REF}" 2>&1)"
    KOD=$?
fi

if [[ "${KOD}" -ne 0 ]]; then
    echo "❌ Kunde inte lista hemligheter för ${REF} (inloggad? \`npx supabase login\`)." >&2
    printf '%s\n' "${UTDATA}" >&2
    exit 1
fi

SAKNAS=0
for NAMN in "${KRAVDA_HEMLIGHETER[@]}"; do
    # Ordgräns på BÅDA sidor mot HELA listnings-utdatan — samma mönster som
    # övriga policy-drivna kommandomatchningar i repot
    # (.hemlighet-utskrift-policy.conf), fast mot ETT namn i taget här i
    # stället för ett regex-mönster. `secrets list` visar NAMN i en tabell
    # (kolumn 1) — en enkel ordgräns-substräng är robust mot varierande
    # kolumnbredd/whitespace utan att behöva parsa tabellformatet.
    if grep -qE "(^|[^A-Za-z0-9_])${NAMN}([^A-Za-z0-9_]|$)" <<< "${UTDATA}"; then
        printf '  ✓ %s\n' "${NAMN}"
    else
        printf '  ✗ %s SAKNAS\n' "${NAMN}" >&2
        SAKNAS=1
    fi
done

exit "${SAKNAS}"
