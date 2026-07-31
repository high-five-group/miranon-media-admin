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
# ═══ KARENSEN — VARFÖR INVARIANT 1 OCH 3 HAR ETT TIDSFÖNSTER ═══
#
# Invariant 1 fäller på tillståndet "alla AC bockade + öppet status". Det är
# EXAKT det tillstånd varje bygg-agents kontrakt KRÄVER: agenten bockar AC men
# får inte sätta Done, eftersom DoD kräver "CI grön per jobb" och den signalen
# inte finns när agenten är klar. Utan karens fäller grinden alltså på KORREKTA
# kort — under en niovåg på nio stycken samtidigt.
#
# Lokalt är det ofarligt och närmast en arbetslista. CI-wirad blir det en falsk
# röd i en required check, och ett falskt larm devalverar nästa (T87).
#
# FÖNSTRETS LÄNGD ÄR MÄTT, INTE BEDÖMD. Metod: rekonstruera varje korts tillstånd
# vid varje commit som rörde dess fil, ur git-historiken, och mät tiden från
# INTRÄDET i det fällande tillståndet till den commit som satte Done. Mellan två
# commits är tillståndet per definition oförändrat, så observationerna är
# fullständiga — inte stickprov. MÄTT 2026-07-31 (TASK-102) över hela historiken:
#
#   n = 91 kort som legat i tillståndet och sedan stängts korrekt
#   min 0,03 h · median 0,73 h · p75 9,5 h · p90 29,6 h · max 117,7 h
#
# Fördelningen är inte en klocka utan tre klasser, och det är klasserna som
# avgör talet — inte percentilen:
#
#   ~0,03–2,3 h   normal tvåstegsstängning (agenten landar, CI verifierar,
#                 orkestreraren stänger). Merparten.
#   ~7–10 h       över natten: kortet landar på kvällen, stängs på morgonen.
#                 Största observation i NUVARANDE våg-regim är 9,55 h.
#   ~10–41 h      2026-07-23 stängdes TASK-17.x/18.x/19.x i en klumpstängning
#                 (allt landar på två commits: 1cb85c5e och 7d35948e). Det är
#                 DRIFTEN grinden finns för att fånga, inte flygtid.
#   117,7 h       TASK-36.8, ensam ytterlighet.
#
# VALT: 24 h. Skälen, i fallande styrka:
#
#   * Det ligger på en PLATÅ. Svepet ger IDENTISKT utfall för varje värde mellan
#     19 h och 28 h — 11 av 91 kort fälls, och det är precis de två drift-
#     händelserna. Ett tröskelvärde som tål att vara några timmar fel är ett
#     tröskelvärde som inte behöver träffas exakt.
#   * Marginalen räcker till BÅDA rimliga läsningar av var flygtiden slutar.
#     Största observation i nuvarande våg-regim är 9,55 h (2,5× marginal).
#     Räknar man i stället största observation UTANFÖR de två klumpstängningarna
#     är den 14,73 h (TASK-48, stängd ensam 2026-07-26) — fortfarande 1,6×.
#     Talet är alltså inte beroende av vilken av gränserna man väljer.
#   * Grinden behåller sitt syfte: den fäller fortfarande på båda drift-
#     händelserna i historiken.
#
# FÖRKASTAT — 12 h: bara 2,4 h marginal till den längsta korrekta natten. En
# leverans 22:00 som stängs 10:00 hade fällts falskt.
# FÖRKASTAT — 48 h: hade fångat 1 av 91, alltså missat hela klumpstängningen
# 2026-07-23. Det neutraliserar grinden i stället för att kalibrera den.
# FÖRKASTAT — percentil rakt av (p90 = 29,6 h): percentilen räknar drift och
# flygtid i samma fördelning och kalibrerar därför grinden mot sitt eget fel.
#
# Talen är mätta i DETTA repo, av EN operatör, över ~4 veckor, och 22 av de 91
# punkterna kommer från en enda klumpstängning — de är alltså inte oberoende.
# Byter arbetssättet karaktär ska talet mätas om, inte ärvas.
#
# Karensen gäller BÅDA öppet-kort-invarianterna (1 och 3), samma snitt som
# etiketten ovan gör. Invariant 2 (Done + obockat) har MED FLIT ingen karens:
# det tillståndet produceras inte av något korrekt flöde — stängningen bockar
# DoD och sätter Done i samma CLI-anrop — så en karens där hade bara fördröjt
# upptäckten av ett äkta fel. Fönstrets längd är mätt för invariant 1; för
# invariant 3 är den ÖVERFÖRD, inte mätt.
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

# ═══ DEFAULTEN ÄR DEN DEKLARERADE LOKALA BINÄREN — ALDRIG `npx backlog` ═══
#
# Paketet heter `backlog.md`. Binären heter `backlog`. Det finns ett ANNAT,
# orelaterat npm-paket som heter just `backlog` — annan författare, egen
# `bin: {"backlog": …}`, ingen provenance. `npx backlog` löser upp BARA NAMNET
# som ett paketnamn och hittar därför fel paket i varje miljö som inte råkar ha
# `backlog.md` globalt installerad. Mätt i isolerad miljö 2026-07-30 (tom cache,
# tomt prefix, ingen global installation):
#
#     npm error npx canceled due to missing packages and no YES option:
#     ["backlog@1.4.56"]
#
# npx auto-installerar utan att fråga när stdin inte är en TTY — vilket den
# aldrig är i CI. Den gamla defaulten var alltså inte "ett opinnat paket" utan
# en namnkollision med tyst exekvering av främmande kod.
#
# En lokal bin kan inte förväxlas med ett registerpaket. Formen är därför
# STRUKTURELL, inte en varning som ska efterlevas — samma skäl som gör
# `node_modules/.bin` rätt även när den globala installationen finns.
#
# Belägg: docs/research/node-cli-deklaration-och-pinning-2026-07-30.md.
# Deklarationen: `backlog.md` som pinnad devDependency i package.json.
BACKLOG_CMD="${BACKLOG_CMD:-node_modules/.bin/backlog}"

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
# Karensen är OBLIGATORISK av exakt samma skäl som etiketten ovan: dess frånvaro
# ger falskt rött, inte tyst grönt. Utan karens fäller invariant 1 på varje
# korrekt agent-leverans i samma stund den landar — se KARENS-sektionen i
# huvudet. Ett default på 0 hade alltså gjort den farligaste konfigurationen till
# den tysta.
#
# 0 ÄR ETT GILTIGT VÄRDE, men bara UTSKRIVET: ett repo utan tvåstegsstängning kan
# genuint vilja ha noll karens, och då ska den siffran stå i policy-filen där en
# läsare ser den.
if [[ -z "${BACKLOG_KARENS_TIMMAR:-}" ]]; then
    echo "❌ BACKLOG_KARENS_TIMMAR saknas i ${POLICY_FIL}" >&2
    echo "   Utan karens fäller invariant 1 på varje korrekt leverans i samma" >&2
    echo "   stund den landar — bygg-agenten bockar AC men får inte sätta Done." >&2
    exit 2
fi
case "${BACKLOG_KARENS_TIMMAR}" in
    ''|*[!0-9]*)
        echo "❌ BACKLOG_KARENS_TIMMAR måste vara ett heltal timmar, fick '${BACKLOG_KARENS_TIMMAR}'" >&2
        exit 2
        ;;
    *) ;;
esac

BACKLOG_UNDANTAGNA_STATUSAR="${BACKLOG_UNDANTAGNA_STATUSAR-}"

# ═══ KARENSENS BRYTPUNKT — RÄKNAS I UTC, EN GÅNG ═══
#
# Kortens tidsstämplar skrivs av backlog-CLI:t i UTC. MÄTT 2026-07-31 över 12
# kort: kortets `Updated:` ligger 2–26 minuter FÖRE samma commits UTC-tid, aldrig
# ~120 minuter före — vilket det hade gjort om fältet vore lokal tid (CEST=UTC+2).
# Därför räknas brytpunkten med `date -u`, och karensen blir då exakt både
# lokalt och på en UTC-runner. En lokal brytpunkt hade gett två timmars skev.
#
# JÄMFÖRELSEN GÖRS PÅ SIFFROR, INTE PÅ STRÄNGAR: `YYYYMMDDHHMM` är monotont, så
# heltalsjämförelse är exakt kronologisk och helt oberoende av locale-collation
# (som kan ignorera bindestreck och blanksteg och därmed jämföra fel).
#
# ORDNINGEN `-d` FÖRE `-r` ÄR AVSIKTLIG. GNU date tar `-d @EPOCH`; BSD/macOS
# saknar `-d` helt och fäller direkt ("illegal option -- d", mätt). BSD tar
# `-r EPOCH`, men GNU:s `-r` betyder "läs en FILS mtime" — hade `-r` prövats
# först och en fil råkat heta som epok-talet, hade GNU tyst gett fel brytpunkt.
# Omvänd ordning har ingen sådan gren.
KARENS_BRYTPUNKT=""
if [[ "${BACKLOG_KARENS_TIMMAR}" -gt 0 ]]; then
    nu_epok=""
    nu_epok="$(date -u +%s 2>/dev/null)" || nu_epok=""
    case "${nu_epok}" in
        ''|*[!0-9]*)
            echo "❌ kunde inte läsa aktuell tid (date -u +%s)" >&2
            echo "   Karensen kan inte bedömas, och en grind som gissar tid är värdelös." >&2
            exit 2
            ;;
        *) ;;
    esac
    brytpunkt_epok=$(( nu_epok - BACKLOG_KARENS_TIMMAR * 3600 ))
    KARENS_BRYTPUNKT="$(date -u -d "@${brytpunkt_epok}" +%Y%m%d%H%M 2>/dev/null)" \
        || KARENS_BRYTPUNKT="$(date -u -r "${brytpunkt_epok}" +%Y%m%d%H%M 2>/dev/null)" \
        || KARENS_BRYTPUNKT=""
    if [[ ! "${KARENS_BRYTPUNKT}" =~ ^[0-9]{12}$ ]]; then
        echo "❌ kunde inte beräkna karensens brytpunkt med vare sig GNU- eller BSD-date" >&2
        echo "   Fail-closed: grinden kör hellre inte alls än med en gissad karens." >&2
        exit 2
    fi
fi

EXIT_CODE=0
antal_kort=0
antal_fel=0
antal_med_tid=0

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

    # ── Karensens tidsstämpel ────────────────────────────────────────────────
    #
    # `Updated:` är kortets senaste ändring och därmed den tidpunkt då det gick
    # in i sitt nuvarande tillstånd. Saknas fältet har kortet ALDRIG redigerats
    # efter skapandet — och då ÄR `Created:` den tidpunkten. Fallbacken är
    # alltså inte en approximation utan det korrekta värdet för just de korten.
    #
    # Att fallbacken dessutom är ofarlig går att härleda: tillståndet invariant 1
    # fäller på kräver bockade AC, och AC bockas med `task edit --check-ac`, som
    # SKRIVER `updated_date`. Ett kort utan fältet kan därför inte ha nått
    # tillståndet via arbetsflödet.
    #
    # FÖRKASTAT — låta avsaknad av `Updated:` betyda "utanför karens" (bedöm
    # direkt). Det hade gjort ett saknat fält till en fällande signal, vilket är
    # att gissa åt det dyraste hållet.
    # FÖRKASTAT — tyst hoppa över kort utan tidsstämpel. Det är exakt TASK-90:s
    # defekt: en blind fläck som utskriften inte redovisar. De räknas i stället
    # öppet i täcknings-blocket.
    tid_rad=""
    tid_rad="$(grep -m1 '^Updated:' <<< "${utdata}")" || true
    [[ -z "${tid_rad}" ]] && { tid_rad="$(grep -m1 '^Created:' <<< "${utdata}")" || true; }
    tid_siffror=""
    if [[ -n "${tid_rad}" ]]; then
        tid_siffror="$(tr -cd '0-9' <<< "${tid_rad#*:}")" || tid_siffror=""
        tid_siffror="${tid_siffror:0:12}"          # YYYYMMDDHHMM, sekunder ignoreras
    fi

    # 0 = bedömbar, 1 = inom karens, 2 = ingen läsbar tidsstämpel
    karens_lage=0
    if [[ "${#tid_siffror}" -ne 12 ]]; then
        karens_lage=2
    else
        antal_med_tid=$((antal_med_tid + 1))
        if [[ -n "${KARENS_BRYTPUNKT}" && "${tid_siffror}" -gt "${KARENS_BRYTPUNKT}" ]]; then
            karens_lage=1
        fi
    fi

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
    #
    # karens_lage ligger FÖRE status, eftersom status läses som sista fältet med
    # `IFS='|' read` och därför får svälja allt som återstår på raden.
    rad_data=""
    rad_data="$(printf '%s|%s|%s|%s|%s|%s|%s|%s|%s' \
        "${id}" "${ar_klar}" "${ar_oppet}" "${undantagen_status}" "${deklarerad}" \
        "${ac_totalt}" "${barn_ids}" "${karens_lage}" "${status}")"
    KORT_RADER="${KORT_RADER}${KORT_RADER:+
}${rad_data}"

    # Invariant 1 — arbetet bevisat klart, kortet inte stängt.
    #
    # KARENSEN GÄLLER HÄR: tillståndet "alla AC bockade + öppet" är EXAKT det en
    # korrekt bygg-agent lämnar efter sig. Utan karens fäller grinden på varje
    # korrekt leverans i det ögonblick den landar.
    if [[ "${ar_oppet}" -eq 1 && "${ac_totalt}" -gt 0 && "${ac_obockat}" -eq 0 \
          && "${karens_lage}" -eq 0 ]]; then
        echo "❌ TASK-${id} — samtliga ${ac_totalt} AC avbockade men status är '${status}'"
        echo "   Arbetet är gjort och bevisat; kortet är aldrig stängt."
        # Åtgärds-tipset visar KOMMANDOT GRINDEN SJÄLV ANVÄNDE, aldrig `npx
        # backlog`: den formen är namnkollisionen ovan, och en grind som skriver
        # ut en landmina som åtgärd hade lärt ut felet den finns för att stänga.
        echo "   Fix: ${BACKLOG_CMD} task edit ${id} --check-dod … -s Done --final-summary '…'"
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

# Fail-closed mot TYST FORMAT-DRIFT. Karensen läser `Updated:`/`Created:` ur
# CLI:ts utdata. Byter verktyget namn på de fälten skulle VARJE kort hamna i
# karens_lage 2 — och grinden gå grön utan att ha prövat någonting. Att noll av
# N kort bar en läsbar tidsstämpel är därför ett anropsfel, aldrig "allt är bra".
# Samma resonemang som "noll kort hittades" ovan, tillämpat på ett fält i
# stället för på listan.
if [[ -n "${KARENS_BRYTPUNKT}" && "${antal_kort}" -gt 0 && "${antal_med_tid}" -eq 0 ]]; then
    echo "❌ inget av ${antal_kort} kort bar en läsbar tidsstämpel (Updated:/Created:)" >&2
    echo "   Karensen kan inte bedömas för något kort — troligen har CLI:ts" >&2
    echo "   utdataformat ändrats. Fail-closed: detta är ett anropsfel." >&2
    exit 2
fi

# ═══ PASS 2 — invariant 3 (förälder/barn) och täcknings-redovisningen ═══

antal_oppna=0                 # allt som inte är KLAR, före undantag
antal_undantagen_status=0
antal_deklarerad=0
antal_pruvat_ac=0
antal_pruvat_barn=0
antal_okant_barn=0
antal_utan_signal=0
antal_inom_karens=0
antal_utan_tid=0

while IFS='|' read -r r_id r_klar r_oppet r_undantag r_dekl r_act r_barn r_karens r_status; do
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

    # Karensen klassas FÖRE AC/barn-uppdelningen: ett kort som nyss ändrats är
    # inte "prövat mot AC" eller "prövat mot barn" — det är ännu inte bedömt
    # alls, och att räkna det som prövat hade blåst upp täckningen. Samma fel
    # som TASK-90 lagade.
    if [[ "${r_karens}" -eq 1 ]]; then
        antal_inom_karens=$((antal_inom_karens + 1))
        continue
    fi
    if [[ "${r_karens}" -eq 2 ]]; then
        antal_utan_tid=$((antal_utan_tid + 1))
        continue
    fi

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
        echo "   ${BACKLOG_CMD} task edit ${r_id} --add-label ${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT}"
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
echo "  ${antal_inom_karens} inom karens (ändrade senaste ${BACKLOG_KARENS_TIMMAR} h) — ännu inte bedömda"
echo "  ${antal_utan_tid} utan läsbar tidsstämpel — karensen kunde inte bedömas"
echo "  ${antal_utan_signal} UTAN STÄNGNINGS-SIGNAL: noll egna AC och inga barn"
if [[ "${antal_utan_signal}" -gt 0 ]]; then
    echo "     Grinden kan inte uttala sig om dessa. Siffran står här därför att"
    echo "     utskriften annars läses som full täckning."
fi
if [[ "${antal_inom_karens}" -gt 0 ]]; then
    echo "     Korten inom karens är INTE friskförklarade — de är för nya för att"
    echo "     kunna skiljas från en pågående leverans. De prövas i nästa körning."
fi

exit "${EXIT_CODE}"
