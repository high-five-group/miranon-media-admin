#!/usr/bin/env bash
# scripts/deny-facit-godkand-skrivning.sh — ADR-104 § Beslut 2.
#
# VARFÖR SKRIPTET FINNS: ADR-102 B3 gör "godkand": null till spärren mellan
#   granskning och rivning, men lämnade MEKANIKEN öppen — ingen regel
#   hindrade en agent från att sätta fältet själv och därmed självbetjäna
#   hela kedjan (exakt den felklass fångst-raterna, self-review ~9 %, säger
#   att konvention inte stoppar). ADR-104 löser det med KANALSEPARATION
#   (CIBA-principen, OpenID Foundation): godkännandet ska komma via
#   Marcus egen `!`-prefix-kanal (scripts/facit-godkann.mjs, körd som
#   `npm run facit:godkann`), aldrig via en väg agenten själv kontrollerar.
#   Denna hook ÄR spärren mot den andra vägen — skriptet självt kan INTE
#   skilja anropare (samma binär oavsett vem som kör den), så mekaniken
#   måste sitta HÄR.
#
# VAD DEN PRÖVAR OCH GÖR: matchar Edit, Write OCH Bash (forskningspassets
#   § 3.1, Boucle-citatet: "If you block Write, the model uses Bash
#   heredocs... Tool-level enforcement is a game of whack-a-mole" — en hook
#   som bara matchar Edit|Write, som förlagan deny-backlog-direct-edit.sh,
#   stoppar inte en heredoc/redirect/sed/jq-väg via Bash).
#
#   Edit/Write: nekar en skrivning mot en facit-manifest-sökväg OM
#   resultatet (simulerat för Edit, direkt för Write) skulle sätta
#   "godkand" till något annat än null. Delegerar JSON-tolkningen till
#   scripts/lib/facit-godkand-skrivning.mjs — "bash äger filsystem/grep,
#   node äger JSON", samma snitt som scripts/check-facit.sh mot
#   scripts/lib/facit-validera.mjs.
#
#   Bash: TVÅ oberoende nät, båda medvetet BREDA (§ HELLRE FÖR BRETT nedan):
#     Kanal A — direkt anrop av Marcus egen stämplingskanal
#       (`npm run facit:godkann` / `scripts/facit-godkann.mjs`). Detta är
#       INTE en generisk JSON-mutation utan den mest direkta bypass-vägen:
#       skriptet SJÄLV skriver fältet korrekt formaterat, så ingen
#       heredoc/redirect-heuristik skulle någonsin fånga den — kommandot
#       "ser" aldrig ut som en skrivning, det ÄR en skrivning, dold bakom
#       en process. Forskningspasset namnger detta explicit: "ingenting i
#       !-mekanismen HINDRAR agenten från att, i SAMMA session, skriva
#       samma fält via sitt eget ... Bash-anrop."
#     Kanal B — generisk mutation: kommandot nämner "godkand" OCH en
#       facit-manifest-sökväg OCH ett skriv-vektor-mönster (redirect,
#       heredoc, `tee`, `sed -i`, `jq -i`).
#
# § HELLRE FÖR BRETT ÄN FÖR SMALT (uppdragets egen formulering, TASK-167):
#   en falsk fällning av en agent är billig (agenten ber Marcus stämpla via
#   `!`-prefixet i stället), en missad förfalskning är dyr (hela
#   godkännande-mekanikens syfte urholkat). Kanal B:s mönster matchar
#   därför på RÅ SUBSTRÄNG utan att försöka avgöra om kommandot "verkligen"
#   skulle lyckas — ett kommando som RÅKAR nämna alla tre ledden utan att
#   vara en skrivning (osannolikt, men möjligt) nekas ändå.
#
# ═══ FAIL-OPEN, MEDVETET, OSCOPAT — LÄS INNAN DU ÄNDRAR NÅGOT HÄR ═══
#
#   Varje INFRA-fel (jq saknas, node saknas, tom/otolkbar stdin, tool_name
#   saknas, policyn saknas/otolkbar) SLÄPPER (exit 0) — MEDVETET AVVIKANDE
#   från scripts/deny-resend-send.sh:s fail-closed-kontrakt, trots att
#   BÅDA skyddar mot en aktör som medvetet försöker kringgå en spärr.
#   Skälet är blast-radien: Rogers mail-lås är registrerat mot Bash +ETT
#   smalt MCP-verktygsnamn, aldrig mot Edit/Write — de mest FREKVENTA
#   verktygen i hela sessionen. Ett FAIL-CLOSED här skulle betyda att VARJE
#   Edit/Write/Bash-anrop i HELA repot blockeras av ett internt hook-fel
#   (t.ex. jq saknas), oavsett om anropet har något med facit att göra.
#
#   Den avvägningen är säker ENDAST för att ADR-104 beslut 3 redan bygger
#   ETT OBEROENDE ANDRA LAGER: scripts/check-facit.sh (obligatorisk,
#   redan wirad CI-grind via check:docs) kräver att .facit-policy.conf
#   FINNS och går att läsa för att ens bli grön (`die` vid saknad config).
#   En agent som river policyn för att kringgå DENNA hook river samtidigt
#   en oberoende, SYNLIG, obligatorisk CI-grind — "rivningsprövningen är
#   dubbel" (ADR-104 § Beslut 3), inte en enkel kedja där ett hook-fel är
#   det enda som står mellan en agent och ett falskt godkännande.
#   Detta är SAMMA resonemang som scripts/deny-arbetsform-push.sh § FAIL-
#   OPEN vs FAIL-CLOSED (steg 1: infra-fel på en högfrekvent verktygsyta
#   är återställbart och ska inte blocka allt), applicerat på en HELT
#   annan severity-klass av skäl (dubbla lager, inte "återställbar skada").
#
# INPUT: PreToolUse hook-JSON på stdin — `tool_name`, `tool_input.file_path`
#   /`old_string`/`new_string`/`replace_all` (Edit), `tool_input.file_path`/
#   `content` (Write), `tool_input.command` (Bash). Fältnamnen är samma
#   snake_case-kontrakt som repots övriga hookar (deny-resend-send.sh m.fl.).
#
# SKARPBEVIS ÄR EN ÖPPEN SKULD (CLAUDE.md § "En ny hook kan ALDRIG
#   skarpbevisas i sessionen som byggde den", L450): en hook registrerad i
#   .claude/settings.json mitt i EN session laddas inte i DEN sessionen.
#   Logiken är bevisad TVÅSIDIGT i byggsessionen via
#   scripts/test-deny-facit-godkand-skrivning.sh (planterade nekande OCH
#   släppande fall) + manuell körning mot verkligt tillstånd. Skarpbeviset
#   (differentialmätning mot en REDAN laddad hook, t.ex.
#   deny-grind-genom-pipe.sh, för att skilja "fel logik" från "ej laddad
#   än") betalas som en av NÄSTA sessions första handlingar — bokförs INTE
#   som gjort här.
#
# Testsvit: scripts/test-deny-facit-godkand-skrivning.sh
#
# Källa: docs/decisions/ADR-104-godkannande-mekaniken-kanalseparation.md §
#        Beslut 2 · docs/research/godkannande-mekanik-hitl-branschmonster-
#        2026-08-08.md § 3.1 (Boucle-citatet) · scripts/deny-backlog-direct-
#        edit.sh (Edit|Write-förlagan, medvetet BREDDAD här) ·
#        scripts/deny-resend-send.sh (fail-closed-kontraktets motpol,
#        MEDVETET EJ följd här — se § FAIL-OPEN ovan) ·
#        scripts/deny-arbetsform-push.sh (steg 1-resonemanget, återanvänt)
# Etablerad: TASK-167, 2026-08-08

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACIT_POLICY="${FACIT_GODKANN_POLICY:-${SCRIPT_DIR}/../.facit-policy.conf}"
HELPER="${SCRIPT_DIR}/lib/facit-godkand-skrivning.mjs"

neka() {
    printf 'FACIT-GODKÄNNANDETS KANALSEPARATION (ADR-104): %s\n' "$1" >&2
    printf 'Fältet "godkand" i ett facit-manifest är Marcus egen kanal — npm run facit:godkann, kört av HONOM via !-prefixet. Agenter skriver det ALDRIG: inte via Edit/Write, inte via Bash (heredoc/redirect/sed/jq), inte genom att köra stämplings-skriptet själva.\n' >&2
    exit 2
}

# ── Steg 1: infra. Fail-open på ALLA infra-fel — se § FAIL-OPEN ovan.
command -v jq > /dev/null 2>&1 || exit 0
command -v node > /dev/null 2>&1 || exit 0

INPUT=""
IFS= read -r -d '' INPUT || true
[[ -n "${INPUT}" ]] || exit 0

TOOL_NAME="$(printf '%s' "${INPUT}" | jq -r '.tool_name // empty' 2> /dev/null)"
case "${TOOL_NAME}" in
    Edit | Write | Bash) ;;
    *) exit 0 ;;
esac

[[ -f "${FACIT_POLICY}" ]] || exit 0
# shellcheck source=/dev/null
source "${FACIT_POLICY}" || exit 0
[[ -n "${FACIT_BILAGE_ROT:-}" && -n "${FACIT_MANIFEST_NAMN:-}" ]] || exit 0
[[ -f "${HELPER}" ]] || exit 0

# ar_manifest_sokvag <path> — sant om sökvägen är formad som ett
# facit-manifest (bilage-roten NÅGONSTANS före, manifest-filnamnet i
# slutet). Glob-formen `*A*B` kräver B i slutsträngen (ingen trailing `*`).
ar_manifest_sokvag() {
    local p="$1"
    [[ "${p}" == *"${FACIT_BILAGE_ROT}"*"${FACIT_MANIFEST_NAMN}" ]]
}

case "${TOOL_NAME}" in
    Edit)
        FILE_PATH="$(printf '%s' "${INPUT}" | jq -r '.tool_input.file_path // empty' 2> /dev/null)"
        ar_manifest_sokvag "${FILE_PATH}" || exit 0

        OLD_STRING="$(printf '%s' "${INPUT}" | jq -r '.tool_input.old_string // empty' 2> /dev/null)"
        NEW_STRING="$(printf '%s' "${INPUT}" | jq -r '.tool_input.new_string // empty' 2> /dev/null)"
        REPLACE_ALL="$(printf '%s' "${INPUT}" | jq -r '.tool_input.replace_all // false' 2> /dev/null)"

        NUVARANDE=""
        [[ -f "${FILE_PATH}" ]] && NUVARANDE="$(< "${FILE_PATH}")"

        UTFALL="$(node "${HELPER}" edit "${NUVARANDE}" "${OLD_STRING}" "${NEW_STRING}" "${REPLACE_ALL}" 2> /dev/null)" || UTFALL="DENY"
        [[ "${UTFALL}" = "ALLOW" ]] || neka "Edit mot ${FILE_PATH} skulle sätta \"godkand\" till ett icke-null-värde."
        ;;
    Write)
        FILE_PATH="$(printf '%s' "${INPUT}" | jq -r '.tool_input.file_path // empty' 2> /dev/null)"
        ar_manifest_sokvag "${FILE_PATH}" || exit 0

        CONTENT="$(printf '%s' "${INPUT}" | jq -r '.tool_input.content // empty' 2> /dev/null)"
        UTFALL="$(node "${HELPER}" write "${CONTENT}" 2> /dev/null)" || UTFALL="DENY"
        [[ "${UTFALL}" = "ALLOW" ]] || neka "Write mot ${FILE_PATH} skulle sätta \"godkand\" till ett icke-null-värde."
        ;;
    Bash)
        COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2> /dev/null)"
        [[ -n "${COMMAND}" ]] || exit 0

        # Kanal A — direkt anrop av Marcus egen stämplingskanal. Se
        # skriptets huvud för varför detta är ett EGET, oberoende nät.
        if [[ "${COMMAND}" == *"facit:godkann"* || "${COMMAND}" == *"facit-godkann.mjs"* ]]; then
            neka "Bash-kommandot anropar Marcus egen stämplingskanal (npm run facit:godkann / scripts/facit-godkann.mjs) direkt. Detta skript körs ENDAST av Marcus via !-prefixet (ADR-104 § Beslut 2)."
        fi

        # Kanal B — generisk JSON-mutation mot manifestet. Kräver alla tre:
        # "godkand" nämnt, en manifest-sökväg nämnd, ETT skriv-vektor-
        # mönster. Se § HELLRE FÖR BRETT för varför ren substräng räcker.
        if [[ "${COMMAND}" == *"godkand"* ]] \
            && { [[ "${COMMAND}" == *"${FACIT_BILAGE_ROT}"* ]] || [[ "${COMMAND}" == *"${FACIT_MANIFEST_NAMN}"* ]]; } \
            && { [[ "${COMMAND}" == *">"* ]] || [[ "${COMMAND}" == *"<<"* ]] || [[ "${COMMAND}" == *"tee"* ]] || [[ "${COMMAND}" =~ sed[[:space:]].*-i ]] || [[ "${COMMAND}" =~ jq[[:space:]].*-i ]]; }; then
            neka "Bash-kommandot mönstermatchar en skrivning mot ett facit-manifest som nämner \"godkand\" (heredoc/redirect/tee/sed/jq-väg)."
        fi
        ;;
    *)
        # Ouppnåeligt — TOOL_NAME är redan begränsat till {Edit,Write,Bash}
        # av vaktklausulen ovan. Explicit `*)`-gren (SC2249) i stället för
        # att lita på att den bara aldrig nås.
        exit 0
        ;;
esac

exit 0
