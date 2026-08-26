#!/usr/bin/env bash
# check-thread-index.sh — validerar tråd-registrets INDEX (tabellen i
# tasks/threads/README.md). Komplement till scripts/check-lifecycle.sh.
#
# VARFÖR DEN FINNS — TÄCKNINGS-LUCKAN, MÄTT (TASK-108, 2026-07-31):
#   check-lifecycle.sh validerar tråd-KORT (tasks/threads/T*.md) och deras
#   fält↔index-konsistens. Den loopar över FILER och hoppar tyst över varje
#   fil som saknar lifecycle:-fältet (dess rad 94, frånvaro=skip per ADR-052
#   beslut 6 — korrekt för sin egen invariant, men konsekvensen är en lucka).
#   Mätt vid byggtillfället: 21 trådfiler varav 8 saknar fältet, och 88 av
#   109 trådar har ingen fil alls. Faktisk täckning: 13 av 109 = 11,9 %.
#   Registrets EGEN integritet — numrering, radform, tillstånds-kolumn —
#   validerades av ingenting.
#   Det är restlistans farligaste klass: en kontroll som tyst inte täcker en
#   radklass läses som täckande. check-docs.sh kallar grinden "Lifecycle på
#   sessionsdok + trådkort" och skriptets header säger "validerar även
#   tråd-kort" — båda sanna, båda smalare än de låter.
#
# GRINDEN VALIDERAR (sju invarianter, ingen överlappar check-lifecycle.sh):
#   1. RADFORM — varje trådrad har rätt antal kolumner och ett enum-giltigt
#      tillstånd i tillstånds-kolumnen. Gäller ALLA rader, med eller utan fil.
#   2. NUMRERING — stigande, inga dubbletter, inga luckor. Registret har
#      historik av omkastade rader (T74/T73 + T79/T78, rättade 2026-07-29).
#   3. INDEX → FIL — en rad som länkar en trådfil pekar på en fil som finns.
#   4. FIL → INDEX — varje trådfil har en rad i indexet. Detta är den klass
#      check-lifecycle.sh ser för 13 filer och missar för 8.
#   5. BESLÄKTAD → REFERENTIELL INTEGRITET (ADR-095 beslut 2–3) — varje
#      backtick-citerat tråd-ID som nämns efter nyckelordet `besläktad`
#      (config: THREAD_RELATED_KEYWORD) i VILKEN innehålls-kolumn som helst
#      måste finnas i registret. Relationen är SYMMETRISK: valideras EN gång
#      per omnämnande, ingen spegelpost krävs i målets egen rad — det är
#      skillnaden mot den framtida ASYMMETRISKA `barn`-relationen (TASK-141),
#      som härleds i EN riktning och aldrig speglas manuellt. Ordets egen
#      TERMreferens (backtick-omsluten, t.ex. denna kommentars "`besläktad`")
#      och negationen ("obesläktad") exkluderas explicit — se Inv 5-blocket.
#   6. BARN-MANIFEST → REFERENTIELL INTEGRITET (ADR-095 beslut 4) — varje
#      förälder-rad i THREAD_CHILDREN_MANIFEST (config: tasks/threads/barn.md)
#      måste peka på ett tråd-ID som finns i registret, och varje ID i dess
#      Barn-cell måste vara antingen ett existerande tråd-ID ELLER ett
#      existerande backlog-kort (fil under THREAD_CHILDREN_CARD_DIR).
#      Relationen är ASYMMETRISK: deklareras i EN riktning (tråden pekar på
#      sina egna barn), och grinden kräver INGEN spegelpost i barnets egen
#      rad eller kort — det är skillnaden mot Inv 5 (besläktad, symmetrisk).
#      "Båda riktningar" i ADR-095/kortets ordalag betyder BÅDA ID-NAMNRYMDERNA
#      (tråd-ID:n och kort-ID:n valideras var för sig) — INTE ett bidirektionellt
#      par likt Inv 3/4 (index↔fil), eftersom ett sådant par vore precis den
#      manuella spegling beslut 2 uttryckligen förbjuder. Manifestfilen får
#      saknas helt (opt-in, tomt startläge räknas som grönt).
#   7. RADLÄNGDS-TAK (ADR-098 beslut 1–2) — varje trådrads rå längd (${#line},
#      radbrytningen exkluderad) får inte överstiga THREAD_ROW_MAX_LEN
#      (config: .thread-index-policy.conf, 500 vid detta skrivtillfälle).
#      Narrativ som spränger taket hör hemma i trådens EGET kort, inte i
#      indexraden — ADR-098 beslut 2 skärper ADR-053 beslut 2 (progressiv
#      disclosure) från discretionär till mekaniskt framtvingad. Kontrollen
#      körs INUTI huvudloopen (samma pass som Inv 1/2/3/5-insamling) och
#      lägger till noll nya loopar — TASK-157.3-triage: skriptet mättes till
#      >2 min/100 % CPU vid 132 trådar FÖRE radlängds-migrationen (TASK-157.2)
#      p.g.a. cut/grep-kostnad på enstaka rader upp mot 8 410 tecken; Inv 7
#      ärver INTE det mönstret — en enda jämförelse (O(1)) per redan besökt
#      rad, alltså O(n) totalt över registret.
#
# MEDVETET UTANFÖR SCOPE (ej glömda kontroller):
#   (a) TILLSTÅNDSDRIFT fil↔index — ägs av check-lifecycle.sh rad 108–129.
#       Att duplicera den vore två grindar med rätt att säga emot varandra.
#   (b) updated:-stämpelns färskhet mot git-historik — T20:s domän, och den
#       kräver git-historik som en shallow CI-checkout inte garanterat har.
#       En grind vars utfall beror på klon-djup är en falsk-röd-fabrik.
#   (c) Innehållets SANNING (att ett stängningsskäl håller, att ett
#       kort-påstående stämmer mot backlog-CLI:t) — det är omdöme mot en
#       extern källa, inte en filinvariant. Bärs av kort, inte av grind.
#
# Idiom speglar scripts/check-lifecycle.sh (EXIT_CODE-ackumulering,
# set -euo pipefail, explicit exit). Som check-skripten i detta repo förlitar
# sig grinden på cwd=repo-root (ingen cd) — CI kör från repo-roten; testsviten
# cd:ar in i sin sandbox före anrop.
#
# Exit 0 om indexet passerar alla sju invarianter. Exit 1 vid drift.
#
# Källa: docs/decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md
# Etablerad: TASK-108 (2026-07-31)
# Inv 5 källa: docs/decisions/ADR-095-relationsmodellen-dokumentationssubstratet.md
# Inv 5 etablerad: TASK-140 (2026-08-05)
# Inv 6 källa: docs/decisions/ADR-095-relationsmodellen-dokumentationssubstratet.md
# Inv 6 etablerad: TASK-141 (2026-08-05)
# Inv 7 källa: docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md
# Inv 7 etablerad: TASK-157.3 (2026-08-07)

set -euo pipefail

POLICY_FILE="${THREAD_INDEX_POLICY_FILE:-.thread-index-policy.conf}"
if [[ ! -f "${POLICY_FILE}" ]]; then
    echo "❌ policy-filen ${POLICY_FILE} saknas — grinden är config-driven (Lesson #6)"
    echo "   Fix: återställ ${POLICY_FILE} i repo-roten."
    exit 1
fi

# Deklarera FÖRE source. shellcheck kan inte spåra variabler över filgränser
# (SC2154); husets mönster är förhandsdeklaration plus explicit tomhetskontroll
# efteråt — se scripts/check-permissions-claims.sh rad 36–50. Kontrollen är inte
# bara shellcheck-kosmetik: en conf som tappat en nyckel ska fälla med ett tydligt
# besked, inte tyst validera mot en tom sträng och rapportera grönt.
THREAD_INDEX=""
THREAD_CARD_GLOB=""
THREAD_ID_PREFIX=""
THREAD_COLUMN_COUNT=0
THREAD_STATE_COLUMN=0
THREAD_RELATED_KEYWORD=""
THREAD_CHILDREN_MANIFEST=""
THREAD_CHILDREN_CARD_PREFIX=""
THREAD_CHILDREN_CARD_DIR=""
THREAD_ROW_MAX_LEN=0
declare -a THREAD_VALID_STATES=()

# shellcheck source=/dev/null
source "${POLICY_FILE}"

die_conf() { echo "❌ ${POLICY_FILE}: $1"; exit 1; }
[[ -n "${THREAD_INDEX}" ]] || die_conf "THREAD_INDEX är tom"
[[ -n "${THREAD_CARD_GLOB}" ]] || die_conf "THREAD_CARD_GLOB är tom"
[[ -n "${THREAD_ID_PREFIX}" ]] || die_conf "THREAD_ID_PREFIX är tom"
[[ "${THREAD_COLUMN_COUNT}" -gt 0 ]] || die_conf "THREAD_COLUMN_COUNT måste vara > 0"
[[ "${THREAD_STATE_COLUMN}" -gt 0 ]] || die_conf "THREAD_STATE_COLUMN måste vara > 0"
[[ "${#THREAD_VALID_STATES[@]}" -gt 0 ]] || die_conf "THREAD_VALID_STATES är tom"
[[ -n "${THREAD_RELATED_KEYWORD}" ]] || die_conf "THREAD_RELATED_KEYWORD är tom"
[[ -n "${THREAD_CHILDREN_MANIFEST}" ]] || die_conf "THREAD_CHILDREN_MANIFEST är tom"
[[ -n "${THREAD_CHILDREN_CARD_PREFIX}" ]] || die_conf "THREAD_CHILDREN_CARD_PREFIX är tom"
[[ -n "${THREAD_CHILDREN_CARD_DIR}" ]] || die_conf "THREAD_CHILDREN_CARD_DIR är tom"
[[ "${THREAD_ROW_MAX_LEN}" -gt 0 ]] || die_conf "THREAD_ROW_MAX_LEN måste vara > 0"

EXIT_CODE=0
BT='`'  # backtick-token för förankrad (ej bar-substräng) matchning

if [[ ! -f "${THREAD_INDEX}" ]]; then
    echo "❌ indexet ${THREAD_INDEX} saknas (bruten ryggrad)"
    echo "   Fix: återställ ${THREAD_INDEX} (registrets navigerbara ryggrad)."
    exit 1
fi

# Pipe-antal = kolumner + 1 (tabellraden inleds OCH avslutas med pipe).
EXPECTED_PIPES=$((THREAD_COLUMN_COUNT + 1))
# awk -F'|' på "| a | b |" ger $1="" → innehålls-kolumn N ligger i fält N+1.
STATE_FIELD=$((THREAD_STATE_COLUMN + 1))
# Länkarna i indexet är relativa indexfilens katalog. Beräknas EN gång här och
# inte per rad: värdet beror inte på loopvariabeln, och shellcheck läser dessutom
# en kommandosubstitution på indexfilen inuti dess egen läs-loop som möjlig
# samtidig skrivning (SC2094).
INDEX_DIR="$(dirname "${THREAD_INDEX}")"

# ── Förberedelse för Inv 5 (besläktad) ───────────────────────────────────────
# Bracket-klassen för båda skiftlägena ("besläktad"/"Besläktad") härleds ur
# THREAD_RELATED_KEYWORD så skriptets LOGIK förblir språkoberoende — bara
# ORDET är config (Lesson #6 UNIVERSAL). RELATED_TERM_PATTERN exkluderar
# ordets egen backtick-omslutna TERMreferens (prosa OM begreppet, ingen
# deklaration — se T122-raden i registret för ett levande exempel).
# RELATED_NEGATION_PATTERN exkluderar negationen ("obesläktad").
RELATED_REST="${THREAD_RELATED_KEYWORD:1}"
RELATED_FIRST="${THREAD_RELATED_KEYWORD:0:1}"
RELATED_FIRST_UPPER="$(printf '%s' "${RELATED_FIRST}" | tr '[:lower:]' '[:upper:]')"
RELATED_PATTERN="[${RELATED_FIRST}${RELATED_FIRST_UPPER}]${RELATED_REST}"
RELATED_NEGATION_PATTERN="[Oo]${RELATED_PATTERN}"
RELATED_TERM_PATTERN="${BT}${RELATED_PATTERN}${BT}"
LAST_CONTENT_FIELD=$((THREAD_COLUMN_COUNT + 1))

declare -a ALL_TIDS=()
declare -a PENDING_LINE=()
declare -a PENDING_ROW_TID=()
declare -a PENDING_TARGET=()

# Referentiell-integritets-koll mot ALL_TIDS. Definieras här (behöver bara
# finnas vid ANROP, inte vid definition) och används av Inv 5 nedan, efter
# att huvudloopen fyllt ALL_TIDS komplett — en rad kan besläktad-nämna en
# SENARE tråd, så valideringen måste vänta tills hela registret är läst.
tid_exists() {
    local needle="$1" known
    for known in "${ALL_TIDS[@]}"; do
        [[ "${known}" == "${needle}" ]] && return 0
    done
    return 1
}

# Referentiell-integritets-koll för Inv 6 (barn-manifest) — kort-halvan.
# Filnamnet på disk är GEMENER ("task-49 - <slug>.md"); manifestet skriver
# ID:t VERSALT ("TASK-49", README:s egen konvention). Gemenifierar bara
# PREFIXET (Bash 3.2-golvet, macOS: ingen ${var,,}, se
# scripts/deny-frammande-huvudkatalog.sh rad 341). Samma icke-nullglob-idiom
# som Inv 4:s fil→index-loop nedan: ett uteblivet träff lämnar mönstret
# obytt, och [[ -e ]] på den bokstavliga strängen är då per definition falskt.
card_exists() {
    local kort_id="$1" glob_id match found=0
    glob_id="$(printf '%s' "${kort_id}" | tr '[:upper:]' '[:lower:]')"
    for match in "${THREAD_CHILDREN_CARD_DIR}/${glob_id} - "*.md; do
        [[ -e "${match}" ]] && found=1
    done
    [[ "${found}" -eq 1 ]]
}

# ── Inv 1 + 2: radform, enum, numrering ──────────────────────────────────────
PREV_NUM=0
PREV_ID=""
SEEN_ANY=0
LINE_NO=0

while IFS= read -r line; do
    LINE_NO=$((LINE_NO + 1))

    # En trådrad känns igen på backtickat ID i kolumn 1. Rader som inte
    # matchar är rubriker, prosa eller not-blockquotes → ej vår yta.
    if [[ ! "${line}" =~ ^\|[[:space:]]*${BT}${THREAD_ID_PREFIX}([0-9]+)${BT}[[:space:]]*\| ]]; then
        continue
    fi
    TID="${THREAD_ID_PREFIX}${BASH_REMATCH[1]}"
    # Ledande nollor bort så T01 jämförs som 1 (10#-prefix = tvinga bas 10).
    NUM=$((10#${BASH_REMATCH[1]}))
    SEEN_ANY=1
    ALL_TIDS+=("${TID}")

    # (7) radlängds-tak (ADR-098 beslut 1–2) — rå radlängd, radbrytningen
    # exkluderad (${#line}, samma mått som (1a) nedan använder för
    # pipe-räkningen). Körs oberoende av (1a)/(1b) — en rad kan ha rätt
    # pipe-antal och ändå spränga taket. O(1) per rad, ingen ny loop.
    if [[ "${#line}" -gt "${THREAD_ROW_MAX_LEN}" ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} är ${#line} tecken lång (tak ${THREAD_ROW_MAX_LEN})"
        echo "   Fix: flytta narrativet till trådens EGET kort (ADR-098 beslut 2) — indexraden bär bara ID · titel · tillstånd · ingång."
        EXIT_CODE=1
    fi

    # (1a) kolumnantal — en extra pipe i titeln förskjuter tillstånds-kolumnen
    PIPES="${line//[^|]/}"
    if [[ "${#PIPES}" -ne "${EXPECTED_PIPES}" ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} har ${#PIPES} pipe-tecken (förväntat ${EXPECTED_PIPES}, dvs ${THREAD_COLUMN_COUNT} kolumner)"
        echo "   Fix: undvik literala pipe-tecken i titel/ingång helt — ett \\|-escape löser INTE detta, kontrollen ovan räknar \${line//[^|]/} som stryker alla icke-pipe-tecken (inklusive ett inledande \\), så en escapad pipe räknas ändå (TASK-138)."
        EXIT_CODE=1
        continue
    fi

    # (1b) enum-giltigt tillstånd i RÄTT kolumn (ej var som helst på raden —
    #      prosan nämner tillstånds-orden ofta, och en bar substrängs-matchning
    #      hade räknat dem som tillstånd).
    STATE_RAW=$(printf '%s' "${line}" | cut -d'|' -f"${STATE_FIELD}")
    STATE="${STATE_RAW//[[:space:]]/}"
    STATE="${STATE//${BT}/}"
    state_ok=0
    for v in "${THREAD_VALID_STATES[@]}"; do
        [[ "${STATE}" == "${v}" ]] && state_ok=1
    done
    if [[ "${state_ok}" -eq 0 ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} har tillstånd '${STATE}' i kolumn ${THREAD_STATE_COLUMN} (förväntat: ${THREAD_VALID_STATES[*]})"
        echo "   Fix: sätt ett enum-giltigt tillstånd, backtickat: ${BT}paused${BT}"
        EXIT_CODE=1
    fi
    # Tillstånds-token får inte stå backtickad i kolumn 3 mer än en gång
    if [[ "${STATE_RAW}" != "${STATE_RAW/${BT}${STATE}${BT}*${BT}${STATE}${BT}/}" ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} har flera tillstånds-token i kolumn ${THREAD_STATE_COLUMN}"
        EXIT_CODE=1
    fi

    # (2) numrering: stigande, ingen dubblett, ingen lucka
    if [[ "${NUM}" -eq "${PREV_NUM}" ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} är en DUBBLETT av föregående rad"
        echo "   Fix: två trådar kan inte dela nummer — ge den senare ett eget."
        EXIT_CODE=1
    elif [[ "${NUM}" -lt "${PREV_NUM}" ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} står EFTER ${PREV_ID} (omkastad ordning)"
        echo "   Fix: sortera raderna stigande. Precedent: T74/T73 + T79/T78, rättade 2026-07-29."
        EXIT_CODE=1
    elif [[ "${NUM}" -gt $((PREV_NUM + 1)) ]] && [[ "${PREV_NUM}" -ne 0 ]]; then
        echo "❌ ${THREAD_INDEX}:${LINE_NO} — LUCKA mellan ${PREV_ID} och ${TID}"
        echo "   Fix: ett hoppat nummer betyder antingen en förlorad rad eller en felnumrerad tråd. Avgör vilket."
        EXIT_CODE=1
    fi
    PREV_NUM="${NUM}"
    PREV_ID="${TID}"

    # (3) index → fil: en länkad trådfil måste finnas
    if [[ "${line}" =~ \(([^\)]*${THREAD_ID_PREFIX}[0-9]+-[^\)]*\.md)\) ]]; then
        TARGET="${BASH_REMATCH[1]}"
        if [[ "${TARGET}" != */* ]] && [[ ! -f "${INDEX_DIR}/${TARGET}" ]]; then
            echo "❌ ${THREAD_INDEX}:${LINE_NO} — ${TID} länkar ${TARGET} som inte finns"
            echo "   Fix: skapa filen, eller ersätt länken med radens egen text."
            EXIT_CODE=1
        fi
    fi

    # (5-samling) besläktad → samla mål-ID:n för validering EFTER loopen.
    # Deklarationen kan bo i VILKEN innehållskolumn som helst (Titel eller
    # Ingång, båda formerna finns i registret — se T119/T122 kontra
    # T71/T76/T90 m.fl.), så alla innehållskolumner skannas.
    for ((FIELD_NUM = 2; FIELD_NUM <= LAST_CONTENT_FIELD; FIELD_NUM++)); do
        CELL=$(printf '%s' "${line}" | cut -d'|' -f"${FIELD_NUM}")
        FILTERED="${CELL}"
        FILTERED="${FILTERED//${RELATED_NEGATION_PATTERN}/}"
        FILTERED="${FILTERED//${RELATED_TERM_PATTERN}/}"
        [[ "${FILTERED}" == *${RELATED_PATTERN}* ]] || continue
        # Girig substitution → allt EFTER den SISTA kvarvarande (=enda äkta,
        # termreferenser redan borttagna) nyckelords-träffen i cellen.
        REST="${FILTERED/*${RELATED_PATTERN}/}"
        while IFS= read -r tid_token; do
            [[ -z "${tid_token}" ]] && continue
            PENDING_LINE+=("${LINE_NO}")
            PENDING_ROW_TID+=("${TID}")
            PENDING_TARGET+=("${tid_token//${BT}/}")
        done < <(grep -oE "${BT}${THREAD_ID_PREFIX}[0-9]+${BT}" <<< "${REST}" || true)
    done
done < "${THREAD_INDEX}"

if [[ "${SEEN_ANY}" -eq 0 ]]; then
    echo "❌ ${THREAD_INDEX} — noll trådrader hittades (indexet är tomt eller tabellformen har ändrats)"
    echo "   Fix: en tom tabell är alltid ett fel här; registret är systemets ryggrad."
    EXIT_CODE=1
fi

# ── Inv 4: fil → index ───────────────────────────────────────────────────────
# Detta är klassen check-lifecycle.sh ser för filer MED lifecycle:-fält och
# tyst hoppar över för filer utan. Här gäller den varje trådfil.
for file in ${THREAD_CARD_GLOB}; do
    [[ -e "${file}" ]] || continue
    TID=$(basename "${file}" | grep -oE "^${THREAD_ID_PREFIX}[0-9]+" || echo "")
    [[ -z "${TID}" ]] && continue
    if ! grep -qF "${BT}${TID}${BT}" "${THREAD_INDEX}"; then
        echo "❌ ${file} — ${TID} saknas i indexet ${THREAD_INDEX} (föräldralös trådfil, ej navigerbar)"
        echo "   Fix: lägg en rad för ${TID} i indexet (Tråd-ID | Titel | Tillstånd | Ingång)."
        EXIT_CODE=1
    fi
done

# ── Inv 5: besläktad → referentiell integritet (ADR-095 beslut 2–3) ─────────
# SYMMETRISK relation — valideras EN gång per omnämnande. Ingen spegelpost
# krävs i målets egen rad (det är skillnaden mot den framtida ASYMMETRISKA
# `barn`-relationen, TASK-141). ALL_TIDS är komplett här — huvudloopen ovan
# är klar — så framåtreferenser (en rad som nämner en SENARE tråd) valideras
# lika korrekt som bakåtreferenser.
for ((PENDING_IDX = 0; PENDING_IDX < ${#PENDING_TARGET[@]}; PENDING_IDX++)); do
    # shellcheck disable=SC2310  # returkoden ÄR svaret (finns/finns inte) —
    # vi vill fortsätta loopen och samla ALLA brutna referenser, inte
    # avbryta vid första träff. Samma disciplin som check-permissions-claims.sh
    # rad 115 (key_exists) och heartbeat-svep.sh rad 416/459/475.
    if ! tid_exists "${PENDING_TARGET[${PENDING_IDX}]}"; then
        echo "❌ ${THREAD_INDEX}:${PENDING_LINE[${PENDING_IDX}]} — ${PENDING_ROW_TID[${PENDING_IDX}]} besläktad-omnämner ${PENDING_TARGET[${PENDING_IDX}]} som INTE finns i registret"
        echo "   Fix: rätta ID:t, eller ta bort omnämnandet om tråden aldrig fanns."
        EXIT_CODE=1
    fi
done

# ── Inv 6: barn-manifest → referentiell integritet (ADR-095 beslut 4) ───────
# ASYMMETRISK relation: tråden deklarerar sina egna barn (backlog-kort
# och/eller barn-trådar) i EN riktning. Grinden kräver INGEN spegelpost i
# barnets egen rad eller kort — det är skillnaden mot Inv 5 (besläktad,
# symmetrisk) och mot Inv 3/4 (index↔fil, en äkta bidirektionell struktur).
# "Båda riktningar" här betyder BÅDA ID-NAMNRYMDERNA (tråd-ID:n OCH
# kort-ID:n valideras var för sig) — se skriptets huvud för resonemanget.
#
# Manifestet är OPT-IN: saknas THREAD_CHILDREN_MANIFEST helt är det INTE ett
# fel — det speglar att ingen tråd än fått en post (ADR-095 beslut 4,
# "additivt och glest"). ALL_TIDS är komplett här (huvudloopen är klar).
if [[ -f "${THREAD_CHILDREN_MANIFEST}" ]]; then
    MANIFEST_LINE_NO=0
    while IFS= read -r manifest_line; do
        MANIFEST_LINE_NO=$((MANIFEST_LINE_NO + 1))

        # En manifest-rad känns igen på backtickat tråd-ID i kolumn 1 —
        # samma idiom som huvudloopens radigenkänning. Rubrik/separator/prosa
        # matchar inte och hoppas tyst över.
        if [[ ! "${manifest_line}" =~ ^\|[[:space:]]*${BT}${THREAD_ID_PREFIX}([0-9]+)${BT}[[:space:]]*\| ]]; then
            continue
        fi
        PARENT_TID="${THREAD_ID_PREFIX}${BASH_REMATCH[1]}"

        # Kolumnstruktur: Tråd | Barn → 2 innehållskolumner, 3 pipe-tecken.
        MANIFEST_PIPES="${manifest_line//[^|]/}"
        if [[ "${#MANIFEST_PIPES}" -ne 3 ]]; then
            echo "❌ ${THREAD_CHILDREN_MANIFEST}:${MANIFEST_LINE_NO} — raden har ${#MANIFEST_PIPES} pipe-tecken (förväntat 3, dvs två kolumner: Tråd | Barn)"
            echo "   Fix: undvik literala pipe-tecken i cellerna helt — ett \\|-escape löser INTE detta, kontrollen ovan räknar \${manifest_line//[^|]/} som stryker alla icke-pipe-tecken (inklusive ett inledande \\), så en escapad pipe räknas ändå (TASK-138)."
            EXIT_CODE=1
            continue
        fi

        # shellcheck disable=SC2310  # returkoden ÄR svaret; fortsätt loopen
        # och samla alla brutna referenser i stället för att avbryta vid
        # första träff — samma disciplin som Inv 5 ovan.
        if ! tid_exists "${PARENT_TID}"; then
            echo "❌ ${THREAD_CHILDREN_MANIFEST}:${MANIFEST_LINE_NO} — ${PARENT_TID} (förälder) finns INTE i tråd-registret"
            echo "   Fix: rätta ID:t, eller ta bort raden om tråden aldrig fanns."
            EXIT_CODE=1
        fi

        BARN_CELL=$(printf '%s' "${manifest_line}" | cut -d'|' -f3)
        while IFS= read -r barn_token; do
            [[ -z "${barn_token}" ]] && continue
            BARN_ID="${barn_token//${BT}/}"
            if [[ "${BARN_ID}" =~ ^${THREAD_ID_PREFIX}[0-9]+$ ]]; then
                # shellcheck disable=SC2310
                if ! tid_exists "${BARN_ID}"; then
                    echo "❌ ${THREAD_CHILDREN_MANIFEST}:${MANIFEST_LINE_NO} — ${PARENT_TID} barn-pekar på tråden ${BARN_ID} som INTE finns i registret"
                    echo "   Fix: rätta ID:t, eller ta bort omnämnandet om tråden aldrig fanns."
                    EXIT_CODE=1
                fi
            elif [[ "${BARN_ID}" =~ ^${THREAD_CHILDREN_CARD_PREFIX}[0-9]+(\.[0-9]+)*$ ]]; then
                # shellcheck disable=SC2310
                if ! card_exists "${BARN_ID}"; then
                    echo "❌ ${THREAD_CHILDREN_MANIFEST}:${MANIFEST_LINE_NO} — ${PARENT_TID} barn-pekar på kortet ${BARN_ID} som INTE finns i ${THREAD_CHILDREN_CARD_DIR}"
                    echo "   Fix: rätta ID:t, eller ta bort omnämnandet om kortet aldrig fanns."
                    EXIT_CODE=1
                fi
            else
                echo "❌ ${THREAD_CHILDREN_MANIFEST}:${MANIFEST_LINE_NO} — ${PARENT_TID} barn-cellen har ett ID på okänd form: ${BT}${BARN_ID}${BT}"
                echo "   Fix: barn-ID:n ska vara ${THREAD_ID_PREFIX}<siffror> (tråd) eller ${THREAD_CHILDREN_CARD_PREFIX}<siffror> (kort)."
                EXIT_CODE=1
            fi
        done < <(grep -oE "${BT}[^${BT}]+${BT}" <<< "${BARN_CELL}" || true)
    done < "${THREAD_CHILDREN_MANIFEST}"
fi

[[ "${EXIT_CODE}" -eq 0 ]] && echo "✅ tråd-index OK (radform + enum + numrering + index↔fil + besläktad↔registret + barn-manifest↔registret + radlängd↔tak)"
exit "${EXIT_CODE}"
