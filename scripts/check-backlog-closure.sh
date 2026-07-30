#!/usr/bin/env bash
# check-backlog-closure.sh — fångar kort vars ARBETE är klart men vars STATUS inte är det.
#
# ═══ VARFÖR GRINDEN FINNS ═══
#
# 2026-07-29 (S91, femtonde resumen) landade TASK-77, TASK-78 och TASK-82 med
# gröna grindar och noll öppna PR:er — och alla tre stod kvar som `To Do` tills
# Marcus frågade varför ingenting hände. Orkestreraren hade sagt sig ta svansen
# "när PR:erna landat", och gjorde det inte.
#
# Samma dag skrevs lärdomen `registret-mot-disk-ar-den-obevakade-axeln`
# [UNIVERSAL] efter att TASK-72 hittats färdigbyggt men obockat. Den lärdomen
# namngav till och med signalen som skulle ha fångat detta:
#
#     "alla AC bockade + DoD obockad + status To Do är ett internt
#      inkonsistent kort"
#
# Lärdomen skrevs, landade — och fyra timmar senare gick samma aktör i samma
# fälla tre gånger. Det är beviset för att en nedskriven regel utan mekanism
# inte efterlevs (jfr L328, samma slutsats för landnings-ordningen).
#
# ═══ VAD GRINDEN FAKTISKT PRÖVAR ═══
#
# Invariant 1: ett kort där SAMTLIGA EGNA acceptanskriterier är avbockade men
# vars status inte är Done är internt inkonsistent. Någon har gjort arbetet och
# bevisat det — men aldrig stängt kortet.
#
# Invariant 2: den omvända riktningen — status Done med obockat AC eller DoD.
#
# Invariant 3: ett ÖPPET föräldrakort vars SAMTLIGA barn är Done. Arbetet är
# bevisat i barnen; föräldern är aldrig stängd. Samma inkonsistens som
# invariant 1, men beviset bor i relationen i stället för i kryssrutorna.
#
# ═══ 0-AC-FALLET — VALD FORM OCH FÖRKASTADE ALTERNATIV (TASK-90) ═══
#
# Invariant 1 kräver `ac_totalt > 0`. Ett kort utan egna AC hoppades därför
# över helt, och utskriften "N kort prövade, 0 inkonsistenta" lästes som full
# täckning. MÄTT vid b8ca291 (2026-07-30): 46 öppna kort, varav 30 utan egna
# AC — grinden utvärderade 16.
#
# VALD FORM: fäll på bevis, REDOVISA frånvaron av bevis. 0-AC-fallet är inte
# ett fall utan två, och de skiljs åt av vilket bevis kortet faktiskt bär:
#
#   * 0 AC MED barn (6 av 30 vid b8ca291) — barnens status ÄR kortets bevis.
#     Invariant 3 nedan. Det är den klass som gav TASK-17/19/36/54/59.
#   * 0 AC UTAN barn (24 av 30) — kortet bär inget maskinläsbart färdig-bevis
#     alls. Här FÄLLER grinden inte. Den redovisar i stället siffran öppet i
#     täcknings-blocket, så att "0 inkonsistenta" aldrig igen kan läsas som
#     "allt är prövat".
#
# FÖRKASTAT — DoD-bockarna som fällande signal för 0-AC-kort. Kortet TASK-90
# nämnde dem som kandidat. MÄTT vid b8ca291: NOLL av 46 öppna kort bär en
# icke-tom, fullt bockad DoD. De nio kort där `dod_obockat == 0` (TASK-20…28)
# har noll DoD-rader ÖVERHUVUDTAGET — en naiv form hade fällt på alla nio, det
# vill säga nio falska röda direkt. Korrekt kodad (`dod_totalt > 0 &&
# dod_obockat == 0`) utvärderar den 15 kort och fäller på noll, eftersom
# stängningsflödet (ADR-073 beslut 5) bockar DoD och sätter Done i SAMMA
# CLI-anrop — fönstret där signalen är sann är strukturellt ~noll. Att räkna
# de 15 som "täckta" hade blåst upp täckningssiffran, vilket är exakt den
# defekt detta kort finns för att laga.
#
# FÖRKASTAT — "varje öppet kort utan AC fälls" (kortet måste ha AC). Hade fällt
# på 30 kort vid b8ca291. Massivt falskt rött, och kortet slår uttryckligen
# fast att falskt rött är dyrare än tyst grönt här: grinden körs i natten och
# ett falskt larm devalverar nästa. Dessutom fel grind — det är en
# kort-HYGIEN-invariant (kortets form), inte en STÄNGNINGS-invariant (kortets
# tillstånd).
#
# FÖRKASTAT — härled förälder/barn ur ID-mönstret `TASK-N.M`. Numreringen är
# GLES: `TASK-17.6` och `TASK-18.14` finns inte. Ett ID-mönster hade fått gissa
# vilka barn som existerar. CLI:ts eget `Subtasks (N):`-block är den
# auktoritativa relationen och kräver ingen gissning.
#
# ═══ AVSIKTLIGT ÖPPNA KORT ═══
#
# Ett föräldrakort kan vara öppet med flit — TASK-54 och TASK-59 är båda
# dokumenterat avsiktliga. De deklarerar det med en ETIKETT, vars namn
# policy-filen äger (`BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT`). Etiketten undantar
# kortet från BÅDA öppet-kort-invarianterna (1 och 3) — den säger "detta kort
# ska inte stängas ännu", inte "hoppa över just en kontroll".
#
# Matchningen är EXAKT per etikett-token, aldrig delsträng: `Labels:`-raden är
# kommaseparerad, och en delsträngs-match hade låtit `intentionally-open-x`
# undanta ett kort som deklarerat något helt annat.
#
# FÖRKASTAT — kort-ID-lista i policy-filen. En andra sanningskälla som driftar
# (samma argument som redan står i .backlog-closure-policy.conf för varför det
# inte finns någon lista över "öppna" statusar), och deklarationen hade bott
# BORTA från kortet: en läsare av TASK-54 hade inte sett den.
#
# FÖRKASTAT — ny status (`Parked`/`Blocked`) i BACKLOG_UNDANTAGNA_STATUSAR.
# backlog/config.yml deklarerar exakt tre statusar; en ny status ändrar tavlan
# för varje kort och varje verktyg — mycket större sprängradie än en etikett.
# Undantags-statusarna svarar dessutom på en annan fråga (statusar där bockade
# AC inte implicerar stängning), inte på "detta enskilda kort är avsiktligt
# öppet".
#
# ═══ VARFÖR NATTEN OCH INTE PR-GRINDEN ═══
#
# Repots stängning är TVÅSTEGS (ADR-073 beslut 5): leverans-commiten bär kod +
# AC-bockar, stängnings-commiten bär final-summary + Done och kommer EFTER
# CI-verifiering. Ett kort som är obockat direkt efter landning är alltså
# NORMALT, inte ett fel. Felet är när det FÖRBLIR obockat.
#
# Detta är därför en inaktuellt-tillstånd-kontroll, inte en "denna ändring är
# fel"-kontroll. Den hör i natten, där larmkedjan redan öppnar ett tilldelat
# ärende — inte i PR-grinden, där den hade fällt varje korrekt leverans-commit.
#
# ═══ L226 OCH VERKTYGSÄGD YTA ═══
#
# `backlog/` är medvetet undantagen från PROSA-lintning (markdownlint/Vale) —
# att grinda ett annat verktygs output-format. L226 räknar samtidigt upp
# klassens RIKTIGA grindar, och en av dem är ordagrant "mall-/DoD-nivåns
# semantiska grind". Det är exakt vad detta är. Ingen konflikt.
#
# Kortens innehåll läses via backlog-CLI:t, aldrig genom att parsa task-filer.
#
# Exit 0 = inga inkonsistenta kort. Exit 1 = drift funnen. Exit 2 = anropsfel.
#
# Config: .backlog-closure-policy.conf (per-projekt; skriptets logik är universell)

set -uo pipefail

POLICY_FIL="${BACKLOG_CLOSURE_POLICY:-.backlog-closure-policy.conf}"
BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"

if [[ ! -f "${POLICY_FIL}" ]]; then
    echo "❌ policy-fil saknas: ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilka statusar som räknas som öppna." >&2
    exit 2
fi
# shellcheck source=/dev/null
. "${POLICY_FIL}"

# De obligatoriska variablerna prövas med EXPLICIT test, inte med `${VAR:?...}`.
#
# VARFÖR: `${VAR:?...}` avslutar skalet med exit 1 — inte 2. Grindens egen
# kontraktsrad säger "Exit 1 = drift funnen. Exit 2 = anropsfel", så en
# ofullständig policy rapporterades som ETT FUNNET INKONSISTENT KORT. En
# anropare som larmar på exit 1 hade öppnat fel ärende. MÄTT mot b8ca291:
# policy utan BACKLOG_KLAR_STATUS gav exitkod 1. Fil-saknas-vägen ovan gav
# korrekt 2 hela tiden, vilket är varför luckan aldrig syntes: testfallet
# prövade filen, inte variabeln.
if [[ -z "${BACKLOG_KLAR_STATUS:-}" ]]; then
    echo "❌ BACKLOG_KLAR_STATUS saknas i ${POLICY_FIL}" >&2
    echo "   Grinden vägrar gissa vilken status som betyder KLAR." >&2
    exit 2
fi
# Etiketten är OBLIGATORISK, inte valfri. Saknas den kan inget kort deklarera
# sig avsiktligt öppet, och varje avsiktligt öppen förälder blir ett falskt
# rött — den dyraste feltypen för en nattlig grind.
if [[ -z "${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT:-}" ]]; then
    echo "❌ BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT saknas i ${POLICY_FIL}" >&2
    echo "   Utan den kan inget kort deklarera sig avsiktligt öppet, och varje" >&2
    echo "   avsiktligt öppen förälder blir ett återkommande falskt larm." >&2
    exit 2
fi
BACKLOG_UNDANTAGNA_STATUSAR="${BACKLOG_UNDANTAGNA_STATUSAR-}"

EXIT_CODE=0
antal_kort=0
antal_fel=0

# Insamlad kort-data för andra passet. Förälder/barn-invarianten behöver
# barnens STATUS, och den får aldrig kosta ett extra CLI-anrop per barn: varje
# kort läses exakt EN gång i pass 1, raden sparas här, och pass 2 slår upp
# barnen i den sparade datan.
#
# EN VARIABEL, INTE EN TEMPORÄRFIL: datan är en rad per kort (169 rader i detta
# repo 2026-07-30) och ryms utan vidare i minnet. Att undvika filen tar bort
# mktemp, dess trap, och hela frågan om vem som äger scratch-sökvägen när flera
# grind-körningar pågår samtidigt.
KORT_RADER=""

# Kort-ID:n ur EN listning — aldrig ett CLI-anrop per kort för att hitta dem.
#
# PORTABILITET: `mapfile`/`readarray` finns först i bash 4. macOS levererar
# bash 3.2, så en mapfile-form hade fungerat i CI och aldrig lokalt — alltså en
# grind ingen kan pröva på sin egen maskin före push. Den `while read`-form som
# används här kör i båda. Av samma skäl används INGEN associativ array
# (`declare -A`, bash 4) för barn-uppslaget — därav temporärfilen ovan.
KORT=()
lista_ut=""
lista_ut="$(${BACKLOG_CMD} task list --plain 2>/dev/null)" || true
rader=""
rader="$(printf '%s\n' "${lista_ut}" | grep -oE 'TASK-[0-9]+(\.[0-9]+)?' | sort -u -V)" || true
while IFS= read -r rad; do
    [[ -z "${rad}" ]] && continue
    KORT+=("${rad#TASK-}")   # parameterexpansion, inte sed (SC2001)
done <<< "${rader}"

if [[ "${#KORT[@]}" -eq 0 ]]; then
    echo "❌ noll kort hittades — CLI:t svarade inte som väntat" >&2
    echo "   Fail-closed: en tom lista är ett anropsfel, aldrig 'allt är bra'." >&2
    exit 2
fi

# ═══ PASS 1 — läs varje kort en gång, pröva invariant 1 och 2, spara raden ═══

for id in "${KORT[@]}"; do
    utdata="$(${BACKLOG_CMD} task "${id}" --plain 2>/dev/null)" || continue
    [[ -z "${utdata}" ]] && continue
    antal_kort=$((antal_kort + 1))

    status_rad=""
    status_rad="$(grep -m1 '^Status:' <<< "${utdata}")" || true
    status="${status_rad#Status:}"
    status="${status#"${status%%[![:space:]]*}"}"   # trimma inledande blanksteg
    [[ -z "${status}" ]] && continue

    # AC-blocket är raderna mellan "Acceptance Criteria:" och "Definition of Done:".
    # DoD-blocket är raderna efter "Definition of Done:". Båda använder samma
    # kryssruteform, så de MÅSTE avgränsas — annars räknas de ihop och grinden
    # blir osann i båda riktningar.
    ac_block=""
    ac_block="$(awk '/^Acceptance Criteria:/{f=1;next} /^Definition of Done:/{f=0} f' <<< "${utdata}")" || true
    dod_block=""
    dod_block="$(awk '/^Definition of Done:/{f=1;next} f' <<< "${utdata}")" || true

    ac_totalt=0;   ac_totalt="$(grep -cE '^- \[[ x]\] ' <<< "${ac_block}")"   || ac_totalt=0
    ac_obockat=0;  ac_obockat="$(grep -cE '^- \[ \] '   <<< "${ac_block}")"   || ac_obockat=0
    dod_obockat=0; dod_obockat="$(grep -cE '^- \[ \] '  <<< "${dod_block}")"  || dod_obockat=0

    # Barn-ID:n ur CLI:ts eget Subtasks-block. Blocket består av rader som
    # börjar `- TASK-`; första raden som inte gör det avslutar blocket.
    # Ankringen på radstart är avsiktlig: en skiv-titel kan nämna ett ANNAT
    # kort-ID, och en oankrad matchning hade plockat upp det som ett barn.
    barn_rader=""
    barn_rader="$(awk '/^Subtasks \(/{f=1;next} f && /^- TASK-/{print;next} f{f=0}' <<< "${utdata}")" || true
    barn_ids=""
    while IFS= read -r brad; do
        [[ -z "${brad}" ]] && continue
        b="${brad#- TASK-}"
        b="${b%% *}"
        # Bara rena numeriska ID:n accepteras — allt annat är en rad vi inte
        # förstår, och en missförstådd rad får aldrig bli ett antaget barn.
        case "${b}" in
            ''|*[!0-9.]*) continue ;;
            *) ;;
        esac
        barn_ids="${barn_ids}${barn_ids:+,}${b}"
    done <<< "${barn_rader}"

    # Etiketterna, exakt per token. `Labels:`-raden är kommaseparerad.
    labels_rad=""
    labels_rad="$(grep -m1 '^Labels:' <<< "${utdata}")" || true
    labels="${labels_rad#Labels:}"
    deklarerad=0
    rest="${labels}"
    while [[ -n "${rest}" ]]; do
        tok="${rest%%,*}"
        if [[ "${tok}" == "${rest}" ]]; then rest=""; else rest="${rest#*,}"; fi
        tok="${tok#"${tok%%[![:space:]]*}"}"   # trimma före
        tok="${tok%"${tok##*[![:space:]]}"}"   # trimma efter
        [[ "${tok}" == "${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT}" ]] && deklarerad=1
    done

    ar_klar=0
    case "${status}" in *"${BACKLOG_KLAR_STATUS}"*) ar_klar=1 ;; *) ;; esac

    # Allt som inte är KLAR räknas som öppet — ingen andra lista att drifta.
    undantagen_status=0
    for s in ${BACKLOG_UNDANTAGNA_STATUSAR}; do
        case "${status}" in *"${s}"*) undantagen_status=1 ;; *) ;; esac
    done

    ar_oppet=1
    [[ "${ar_klar}" -eq 1 ]] && ar_oppet=0
    [[ "${undantagen_status}" -eq 1 ]] && ar_oppet=0
    [[ "${deklarerad}" -eq 1 ]] && ar_oppet=0

    # Endast de fält pass 2 faktiskt använder sparas. ac_obockat och dod_obockat
    # är förbrukade här nere i invariant 1 och 2 och följer därför inte med.
    rad_data=""
    rad_data="$(printf '%s|%s|%s|%s|%s|%s|%s|%s' \
        "${id}" "${ar_klar}" "${ar_oppet}" "${undantagen_status}" "${deklarerad}" \
        "${ac_totalt}" "${barn_ids}" "${status}")"
    KORT_RADER="${KORT_RADER}${KORT_RADER:+
}${rad_data}"

    # Invariant 1 — arbetet bevisat klart, kortet inte stängt.
    if [[ "${ar_oppet}" -eq 1 && "${ac_totalt}" -gt 0 && "${ac_obockat}" -eq 0 ]]; then
        echo "❌ TASK-${id} — samtliga ${ac_totalt} AC avbockade men status är '${status}'"
        echo "   Arbetet är gjort och bevisat; kortet är aldrig stängt."
        echo "   Fix: npx backlog task edit ${id} --check-dod … -s Done --final-summary '…'"
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi

    # Invariant 2 — kortet stängt utan att arbetet är bevisat.
    if [[ "${ar_klar}" -eq 1 && ( "${ac_obockat}" -gt 0 || "${dod_obockat}" -gt 0 ) ]]; then
        echo "❌ TASK-${id} — status '${status}' men ${ac_obockat} AC och ${dod_obockat} DoD står obockade"
        echo "   Kortet är stängt utan att kraven är kvitterade."
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi
done

# ═══ PASS 2 — invariant 3 (förälder/barn) och täcknings-redovisningen ═══

antal_oppna=0                 # allt som inte är KLAR, före undantag
antal_undantagen_status=0
antal_deklarerad=0
antal_pruvat_ac=0
antal_pruvat_barn=0
antal_okant_barn=0
antal_utan_signal=0

while IFS='|' read -r r_id r_klar r_oppet r_undantag r_dekl r_act r_barn r_status; do
    [[ -z "${r_id}" ]] && continue
    [[ "${r_klar}" -eq 1 ]] && continue
    antal_oppna=$((antal_oppna + 1))

    if [[ "${r_undantag}" -eq 1 ]]; then
        antal_undantagen_status=$((antal_undantagen_status + 1))
        continue
    fi
    if [[ "${r_dekl}" -eq 1 ]]; then
        antal_deklarerad=$((antal_deklarerad + 1))
        continue
    fi
    [[ "${r_oppet}" -eq 1 ]] || continue

    # Kortet har egna AC → invariant 1 äger bedömningen. Invariant 3 håller sig
    # borta med FLIT: ett obockat eget AC är genuint återstående arbete och
    # måste vinna över barnens fullbordan. Vore villkoret bara "alla barn Done"
    # hade en förälder med egen kvarvarande QA-skiva fällts falskt.
    if [[ "${r_act}" -gt 0 ]]; then
        antal_pruvat_ac=$((antal_pruvat_ac + 1))
        continue
    fi

    if [[ -z "${r_barn}" ]]; then
        antal_utan_signal=$((antal_utan_signal + 1))
        continue
    fi

    alla_barn_klara=1
    nagot_barn_okant=0
    barn_kvar="${r_barn}"
    antal_barn=0
    while [[ -n "${barn_kvar}" ]]; do
        bid="${barn_kvar%%,*}"
        if [[ "${bid}" == "${barn_kvar}" ]]; then barn_kvar=""; else barn_kvar="${barn_kvar#*,}"; fi
        [[ -z "${bid}" ]] && continue
        antal_barn=$((antal_barn + 1))
        bklar=""
        # `$1 "" == x ""` tvingar STRÄNG-jämförelse. Utan de tomma strängarna
        # jämför awk numeriskt när båda sidor ser ut som tal — och kort-ID:n
        # GÖR det. `18.2 == 18.20` är sant numeriskt och falskt som ID.
        # MÄTT 2026-07-30: den formen läste TASK-18.20:s status ur TASK-18.2:s
        # rad och rapporterade TASK-18 som "samtliga 19 barn Done" fastän
        # TASK-18.20 stod To Do — ett falskt rött, den dyraste feltypen här.
        bklar="$(awk -F'|' -v x="${bid}" '$1 "" == x "" {print $2; exit}' <<< "${KORT_RADER}")" || true
        if [[ -z "${bklar}" ]]; then
            # Barnet finns i förälderns Subtasks-block men inte i listningen
            # (arkiverat, eller en CLI-avvikelse). Då VET vi inte om arbetet är
            # klart — och en gissning åt fällande håll är precis det falska
            # röda som devalverar nästa larm. Grinden håller tyst.
            nagot_barn_okant=1
        elif [[ "${bklar}" -ne 1 ]]; then
            alla_barn_klara=0
        fi
    done

    if [[ "${nagot_barn_okant}" -eq 1 ]]; then
        antal_okant_barn=$((antal_okant_barn + 1))
        continue
    fi

    antal_pruvat_barn=$((antal_pruvat_barn + 1))

    # Invariant 3 — barnen bevisar arbetet, föräldern är aldrig stängd.
    if [[ "${alla_barn_klara}" -eq 1 ]]; then
        echo "❌ TASK-${r_id} — samtliga ${antal_barn} barn är '${BACKLOG_KLAR_STATUS}' men status är '${r_status}'"
        echo "   Arbetet är bevisat i barnen; föräldern är aldrig stängd."
        echo "   Är kortet öppet med FLIT? Deklarera det:"
        echo "   npx backlog task edit ${r_id} --add-label ${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT}"
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi
done <<< "${KORT_RADER}"

if [[ "${EXIT_CODE}" -eq 0 ]]; then
    echo "✅ backlog-stängning konsekvent: ${antal_kort} kort prövade, 0 inkonsistenta."
else
    echo ""
    echo "${antal_fel} inkonsistenta kort av ${antal_kort} prövade."
    echo "Grinden finns för att en nedskriven regel utan mekanism inte efterlevs —"
    echo "se skriptets huvud för incidenten som gav den dess form."
fi

# Täcknings-redovisningen skrivs ALLTID, i båda utfallen. Utan den läses
# "0 inkonsistenta" som "allt är prövat" — och det var precis fyndet i TASK-90:
# grinden var blind för 30 av 41 öppna kort och sade det inte.
echo ""
echo "Täckning bland de ${antal_oppna} öppna korten:"
echo "  ${antal_pruvat_ac} prövade mot egna AC (invariant 1)"
echo "  ${antal_pruvat_barn} prövade mot barn-relationen (invariant 3)"
echo "  ${antal_deklarerad} deklarerat avsiktligt öppna (etikett '${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT}')"
echo "  ${antal_undantagen_status} undantagen status"
echo "  ${antal_okant_barn} obedömbara: barn i Subtasks saknas i listningen"
echo "  ${antal_utan_signal} UTAN STÄNGNINGS-SIGNAL: noll egna AC och inga barn"
if [[ "${antal_utan_signal}" -gt 0 ]]; then
    echo "     Grinden kan inte uttala sig om dessa. Siffran står här därför att"
    echo "     utskriften annars läses som full täckning."
fi

exit "${EXIT_CODE}"
