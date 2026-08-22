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
#   Bash: TVÅ oberoende nät (§ HELLRE FÖR BRETT nedan gäller fortsatt, men
#   se § TASK-168 — POSITION, INTE FRI SUBSTRÄNG för vad som ändrades):
#     Kanal A — direkt anrop av Marcus egen stämplingskanal
#       (`npm run facit:godkann` / `scripts/facit-godkann.mjs`). Detta är
#       INTE en generisk JSON-mutation utan den mest direkta bypass-vägen:
#       skriptet SJÄLV skriver fältet korrekt formaterat, så ingen
#       heredoc/redirect-heuristik skulle någonsin fånga den — kommandot
#       "ser" aldrig ut som en skrivning, det ÄR en skrivning, dold bakom
#       en process. Forskningspasset namnger detta explicit: "ingenting i
#       !-mekanismen HINDRAR agenten från att, i SAMMA session, skriva
#       samma fält via sitt eget ... Bash-anrop."
#     Kanal B — generisk mutation: kommandot nämner "godkand" OCH ett
#       skriv-vektor-mönster (redirect, `tee`, `sed -i`, `jq -i`) vars MÅL
#       är en facit-manifest-sökväg.
#
# § HELLRE FÖR BRETT ÄN FÖR SMALT (uppdragets egen formulering, TASK-167):
#   en falsk fällning av en agent är billig (agenten ber Marcus stämpla via
#   `!`-prefixet i stället), en missad förfalskning är dyr (hela
#   godkännande-mekanikens syfte urholkat). Denna princip STÅR KVAR —
#   TASK-168 (nedan) smalnar INTE av vad som räknas som en skrivning, bara
#   VAR i kommandotexten mönstret måste sitta.
#
# ═══ TASK-168 — POSITION, INTE FRI SUBSTRÄNG ═══
#
#   Mätt 2026-08-08/09 (fem falsk-positiva klasser, TASK-168-kortet bär hela
#   listan med källor): fri substräng över HELA kommandotexten fällde även
#   (1) rena LÄSNINGAR av manifestet (en python3-heredoc som bara `open()`ar
#   filen matchade "heredoc"-mönstret trots att heredocen aldrig är en
#   skriv-operation i sig — den är stdin till en tolk; den FAKTISKA
#   skrivningen, om någon, sker via en redirect/`tee` som prövas separat),
#   (2) kommandon som bara NÄMNER skriptets FILNAMN (`grep`/`git add`/en
#   testsvit-invokering), (3) att köra facit-godkann.mjs:s EGEN testsvit —
#   `node scripts/test-facit-godkann.mjs` matchade Kanal A:s gamla
#   substräng-check eftersom "test-facit-godkann.mjs" RÅKAR SLUTA på
#   "facit-godkann.mjs", (4)–(5) CLI-payload-TEXT (`backlog task
#   create -d "..."` / `--append-notes "..."`) som nämner
#   stämplingskommandot i sitt ARGUMENT, inte som en anropsväg.
#
#   FIXEN, i två delar:
#     Kanal A matchar nu KOMMANDO-POSITION — är detta segmentet FAKTISKT ett
#     anrop (`npm run <script>` i position 0/1/2, eller `node`/direkt-exec
#     av skriptfilen i position 0/1)? — inte fri text någonstans i
#     kommandot. Skriptnamnets GRÄNS krävs EXAKT eller efter `/` (inte fri
#     suffix-match), annars matchar t.ex. "test-facit-godkann.mjs" falskt
#     eftersom den strängen råkar SLUTA på skriptnamnet (klass 3 ovan).
#     Kommandot segmenteras på samma sätt som
#     scripts/deny-arbetsform-push.sh:s `ar_git_push` (§ MÖNSTER-MATCHNING
#     där) — `;`/`&`/`|` OCH varje `$(`/backtick-öppning — så ett kedjat
#     `echo x && npm run facit:godkann` fångas fortfarande.
#
#     Kanal B kräver att skriv-vektorns MÅL (token efter `>`/`>>`, eller
#     manifest-sökvägen NÅGONSTANS i SAMMA SEGMENT som `tee`/`sed -i`/
#     `jq -i`) är manifestet — inte att manifest-sökvägen förekommer
#     NÅGONSTANS i HELA kommandot, oavsett om den delen faktiskt skriver
#     någonstans. `tee`/`sed -i`/`jq -i` förblir segment-scopade (inget
#     exakt målfönster extraheras för dem) — samma medvetna, dokumenterade
#     grovhet som deny-arbetsform-push.sh ("ingen fullständig shell-parser
#     byggs"); § HELLRE FÖR BRETT gäller fortfarande där.
#
#   Källa: TASK-168-kortet (fem instanser + källor) ·
#          scripts/deny-arbetsform-push.sh § MÖNSTER-MATCHNING
#          (segmenterings-förlagan, "kommando-position, inte
#          argument-position") · scripts/deny-grind-genom-pipe.sh (samma
#          princip, den ANDRA riktningen: `grep "grind" fil | head` nämner
#          men kör aldrig grinden)
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
#        scripts/deny-arbetsform-push.sh (steg 1-resonemanget, återanvänt +
#        segmenterings-/kommando-positions-tekniken, TASK-168)
# Etablerad: TASK-167, 2026-08-08. Position i stället för fri substräng:
#            TASK-168, 2026-08-09.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACIT_POLICY="${FACIT_GODKANN_POLICY:-${SCRIPT_DIR}/../.facit-policy.conf}"
HELPER="${SCRIPT_DIR}/lib/facit-godkand-skrivning.mjs"

neka() {
    printf 'FACIT-GODKÄNNANDETS KANALSEPARATION (ADR-104): %s\n' "$1" >&2
    printf 'Fältet "godkand" i ett facit-manifest är Marcus egen kanal — npm run facit:godkann, kört av HONOM via !-prefixet. Agenter skriver det ALDRIG: inte via Edit/Write, inte via Bash (heredoc/redirect/sed/jq), inte genom att köra stämplings-skriptet själva.\n' >&2
    exit 2
}

# ── Neka-skälets DIAGNOSTIK (ADR-102 § Updates 2026-08-22) ────────────────
#
# facit_neka_skrivning <verktyg> <sokvag> <nuvarande-filinnehall>
#
# VERDIKTET ÄR OFÖRÄNDRAT — båda grenarna nekar med exit 2. Det som skiljer
# är SKÄLET, och skillnaden är mätt dyr: fram till 2026-08-22 sade hooken
# alltid "skulle sätta 'godkand' till ett icke-null-värde", också när
# skrivningen inte rörde "godkand" alls. Två agenter läste den texten som
# att de av misstag råkat skriva fältet, letade efter ett fel i sin egen
# diff, och hittade ingenting — den verkliga regeln var en ANNAN: ett
# STÄMPLAT manifest är agent-fruset i SIN HELHET.
#
# Skillnaden avgörs av manifestets NUVARANDE innehåll, inte av skrivningen:
# bär filen redan ett satt "godkand" är den frusen (gren 1); gör den inte
# det är det skrivningen själv som sätter fältet (gren 2, den ursprungliga
# förfalsknings-vägen ADR-104 mintades för).
facit_neka_skrivning() {
    local verktyg="$1" sokvag="$2" nuvarande="$3" redan=""

    redan="$(node "${HELPER}" write "${nuvarande}" 2> /dev/null)" || redan=""
    if [[ "${redan}" = "DENY" ]]; then
        neka "${verktyg} mot ${sokvag} nekas därför att manifestet är STÄMPLAT (\"godkand\" är satt). Ett stämplat manifest är agent-fruset i SIN HELHET — även en ändring som inte rör \"godkand\". Amenderingen bor i en SIDOFIL bredvid manifestet: ${sokvag%/*}/AMENDERING-<datum>-<slug>.md (ADR-102 § Updates 2026-08-22 § A3). Inbakningen i manifestet är ett Marcus-moment via !-kanalen."
    fi
    neka "${verktyg} mot ${sokvag} skulle sätta \"godkand\" till ett icke-null-värde."
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
[[ -n "${FACIT_BILAGE_ROT:-}" && -n "${FACIT_MANIFEST_NAMN:-}" \
    && -n "${FACIT_GODKANN_NPM_SCRIPT:-}" && -n "${FACIT_GODKANN_SKRIPT_NAMN:-}" ]] || exit 0
[[ -f "${HELPER}" ]] || exit 0

# ar_manifest_sokvag <path> — sant om sökvägen är formad som ett
# facit-manifest (bilage-roten NÅGONSTANS före, manifest-filnamnet i
# slutet). Glob-formen `*A*B` kräver B i slutsträngen (ingen trailing `*`).
ar_manifest_sokvag() {
    local p="$1"
    [[ "${p}" == *"${FACIT_BILAGE_ROT}"*"${FACIT_MANIFEST_NAMN}" ]]
}

# ═══ Kanal A — kommando-POSITION (TASK-168) ═══
#
# _ar_facit_segmentera <command> — delar på `;`/`&`/`|` OCH på varje
# `$(`/backtick-öppning (en substitution KÖR sitt innehåll även inbäddat i
# en sträng) — samma delnings-PRINCIP som
# scripts/deny-arbetsform-push.sh:s `ar_git_push` (§ MÖNSTER-MATCHNING där).
# SKILJER SIG i ETT: separatorn är en MARKÖRSTRÄNG (`@@FACIT_SEG@@`), INTE
# en nyradstecken. En heredoc-BODY (BD4-fallet: `cat <<EOF > sökväg` följt
# av JSON-rader) bär EGNA, RIKTIGA nyradstecken som måste stanna INUTI sitt
# segment — en nyrad som separator hade splittat en sådan body i flera
# separata "segment" och därmed skilt en redirects MÅL från "godkand"-
# nämningen på NÄSTA rad (mätt: BD4 föll igenom vid första implementationen
# av denna fix, 2026-08-09 — differentialbevis i slutrapporten).
_ar_facit_segmentera() {
    local cmd="$1"
    # shellcheck disable=SC2016  # enkelfnuttarna ÄR avsikten (se förlagan).
    printf '%s' "${cmd}" \
        | sed -e 's/\$(/@@FACIT_SEG@@/g' -e 's/`/@@FACIT_SEG@@/g' \
        | sed -e 's/[;&|]/@@FACIT_SEG@@/g'
}

# _ar_facit_for_varje_segment <command> <funktionsnamn> — anropar
# <funktionsnamn> med varje segment som enda argument (markör-delat, se
# _ar_facit_segmentera ovan — INTE `read`/herestring, som hade återinfört
# nyrads-splittringen). Returnerar 0 så fort <funktionsnamn> returnerar 0
# för något segment, annars 1.
_ar_facit_for_varje_segment() {
    local cmd="$1" fn="$2" rest segment
    rest="$(_ar_facit_segmentera "${cmd}")@@FACIT_SEG@@"
    while [[ "${rest}" == *"@@FACIT_SEG@@"* ]]; do
        segment="${rest%%@@FACIT_SEG@@*}"
        rest="${rest#*@@FACIT_SEG@@}"
        [[ -n "${segment//[[:space:]]/}" ]] || continue
        "${fn}" "${segment}" && return 0
    done
    return 1
}

# _ar_facit_arg_ar_skriptet <arg> — sant om argumentet ÄR skriptfilen:
# exakt namnet, eller namnet efter en `/`. INTE fri suffix-match — annars
# matchar t.ex. "test-facit-godkann.mjs" (testsvitens EGET namn, som RÅKAR
# SLUTA på skriptnamnet) falskt (mätt, klass 3).
# shellcheck disable=SC2329  # anropas från _ar_facit_kanal_a_segment, som
# i sin tur bara anropas INDIREKT via funktionsnamn (se
# _ar_facit_for_varje_segment) — shellcheck spårar inte den kedjan.
_ar_facit_arg_ar_skriptet() {
    local a="${1:-}"
    [[ "${a}" = "${FACIT_GODKANN_SKRIPT_NAMN}" || "${a}" = *"/${FACIT_GODKANN_SKRIPT_NAMN}" ]]
}

# _ar_facit_kanal_a_segment <segment> — sant om SEGMENTET faktiskt anropar
# stämplingskanalen: `npm run <FACIT_GODKANN_NPM_SCRIPT>` (position 0 "npm",
# 1 "run"/"run-script", 2 exakt scriptnamnet — vad som följer, t.ex.
# `-- --pass x`, spelar ingen roll), `node <skriptsökväg>`, eller DIREKT
# körning av skriptfilen (samma gränsregel).
# shellcheck disable=SC2329  # anropas INDIREKT via funktionsnamn, se
# _ar_facit_for_varje_segment (`"${fn}" "${segment}"`) — shellcheck spårar
# inte namn-via-variabel-anrop.
_ar_facit_kanal_a_segment() {
    local seg="$1"
    # shellcheck disable=SC2086  # avsiktlig ordklyvning — kommando-POSITION.
    set -- ${seg}
    case "${1:-}" in
        npm | */npm)
            shift
            case "${1:-}" in
                run | run-script) ;;
                *) return 1 ;;
            esac
            shift
            [[ "${1:-}" = "${FACIT_GODKANN_NPM_SCRIPT}" ]]
            ;;
        node | */node)
            shift
            _ar_facit_arg_ar_skriptet "${1:-}"
            ;;
        *)
            _ar_facit_arg_ar_skriptet "${1:-}"
            ;;
    esac
}

# ar_facit_kanal_a <command> — sant om NÅGOT segment i kommandot faktiskt
# anropar stämplingskanalen.
ar_facit_kanal_a() {
    _ar_facit_for_varje_segment "$1" _ar_facit_kanal_a_segment
}

# ═══ Kanal B — skriv-vektorns MÅL (TASK-168) ═══
#
# _ar_facit_redirect_mot_manifest <segment> — sant om NÅGOT redirect-mål
# (token omedelbart efter `>`/`>>`) i segmentet är manifestet. Detta är den
# direkta fixen för den mätta falska fällningen "python3-läsning via <<EOF
# nämnde fältnamn+sökväg utan att skriva någonstans": en bar heredoc har
# INGET redirect-mål alls, så den ger ingen träff här.
# shellcheck disable=SC2329  # anropas från _ar_facit_kanal_b_segment, som
# i sin tur bara anropas INDIREKT via funktionsnamn — se
# _ar_facit_kanal_a_segment ovan för samma mönster.
_ar_facit_redirect_mot_manifest() {
    local seg="$1" traffar mal
    traffar="$(printf '%s\n' "${seg}" | grep -oE '>>?[[:space:]]*[^[:space:]<>]+' | sed -E 's/^>>?[[:space:]]*//')" || true
    [[ -n "${traffar}" ]] || return 1
    while IFS= read -r mal; do
        [[ -n "${mal}" ]] || continue
        ar_manifest_sokvag "${mal}" && return 0
    done <<< "${traffar}"
    return 1
}

# _ar_facit_kanal_b_segment <segment> — sant om SEGMENTET nämner "godkand"
# OCH har en skriv-vektor vars mål (redirect) eller vars SEGMENT (tee/
# sed -i/jq -i — segment-scopat, se hookens huvud § TASK-168) är
# manifestet.
# shellcheck disable=SC2329  # anropas INDIREKT via funktionsnamn, se
# _ar_facit_for_varje_segment (`"${fn}" "${segment}"`).
_ar_facit_kanal_b_segment() {
    local segment="$1"
    [[ "${segment}" == *"godkand"* ]] || return 1

    _ar_facit_redirect_mot_manifest "${segment}" && return 0

    if ar_manifest_sokvag "${segment}"; then
        [[ "${segment}" =~ (^|[[:space:]])tee([[:space:]]|$) ]] && return 0
        [[ "${segment}" =~ sed[[:space:]].*-i ]] && return 0
        [[ "${segment}" =~ jq[[:space:]].*-i ]] && return 0
    fi
    return 1
}

# ar_facit_kanal_b <command> — sant om NÅGOT SEGMENT matchar
# _ar_facit_kanal_b_segment. Segmenteringen (samma som Kanal A) är i sig en
# del av fixen: en manifest-sökväg nämnd i ETT LEDLÖST kommando i en kedja
# fäller inte ett helt ANNAT, ofarligt kommando i SAMMA kedja. Den billiga
# helkommando-prefiltreringen ("godkand" nämnt ÖVERHUVUDTAGET) körs FÖRST
# så segmenteringen (en process, tre pipe-led) hoppas över för den
# överväldigande majoriteten av Bash-anrop som aldrig nämner ordet alls.
ar_facit_kanal_b() {
    local cmd="$1"
    [[ "${cmd}" == *"godkand"* ]] || return 1
    _ar_facit_for_varje_segment "${cmd}" _ar_facit_kanal_b_segment
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
        [[ "${UTFALL}" = "ALLOW" ]] || facit_neka_skrivning "Edit" "${FILE_PATH}" "${NUVARANDE}"
        ;;
    Write)
        FILE_PATH="$(printf '%s' "${INPUT}" | jq -r '.tool_input.file_path // empty' 2> /dev/null)"
        ar_manifest_sokvag "${FILE_PATH}" || exit 0

        NUVARANDE=""
        [[ -f "${FILE_PATH}" ]] && NUVARANDE="$(< "${FILE_PATH}")"

        CONTENT="$(printf '%s' "${INPUT}" | jq -r '.tool_input.content // empty' 2> /dev/null)"
        UTFALL="$(node "${HELPER}" write "${CONTENT}" 2> /dev/null)" || UTFALL="DENY"
        [[ "${UTFALL}" = "ALLOW" ]] || facit_neka_skrivning "Write" "${FILE_PATH}" "${NUVARANDE}"
        ;;
    Bash)
        COMMAND="$(printf '%s' "${INPUT}" | jq -r '.tool_input.command // empty' 2> /dev/null)"
        [[ -n "${COMMAND}" ]] || exit 0

        # Kanal A — direkt anrop av Marcus egen stämplingskanal, matchat
        # på KOMMANDO-POSITION (TASK-168). Se skriptets huvud för varför
        # detta är ett EGET, oberoende nät, och § TASK-168 för fixen.
        if ar_facit_kanal_a "${COMMAND}"; then
            neka "Bash-kommandot ANROPAR (kommando-position, inte fri text) Marcus egen stämplingskanal (npm run ${FACIT_GODKANN_NPM_SCRIPT} / ${FACIT_GODKANN_SKRIPT_NAMN}) direkt. Detta skript körs ENDAST av Marcus via !-prefixet (ADR-104 § Beslut 2)."
        fi

        # Kanal B — generisk skrivning MOT manifestet, matchad på
        # skriv-vektorns MÅL i stället för fri substräng (TASK-168). Kräver
        # "godkand" nämnt i SAMMA SEGMENT som skriv-vektorn. Se § HELLRE
        # FÖR BRETT för varför tee/sed -i/jq -i förblir segment-scopade.
        if ar_facit_kanal_b "${COMMAND}"; then
            neka "Bash-kommandot skriver (redirect/tee/sed -i/jq -i) MOT ett facit-manifest som nämner \"godkand\"."
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
