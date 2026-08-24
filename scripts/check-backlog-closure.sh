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
# ═══ STÄNGNINGSFORMERNA — TVÅ UNDANTAG FRÅN INVARIANT 2 (TASK-281) ═══
#
# Invariant 2 fällde 2026-08-24 på 17 kort. Ingen av fällningarna var det fel
# invarianten skrevs för. Två skilda strukturhål producerade dem, och båda är
# lagade här.
#
# ── HÅL 1: "CI grön per jobb" hade ingen ägare ───────────────────────────────
#
# DoD-raden `CI grön per jobb på pushad commit` (backlog/config.yml:s DoD-mall)
# kan bygg-agenten INTE bocka: dess arbete slutar vid pushen, och CI-utfallet
# finns inte då. TASK-249.5 kommentar #1 säger det verbatim: "DoD-status: #3
# (CI grön per jobb) lämnas obockad — CI-verifikation ägs av orkestrerarens
# svep, inte av mig." Stängnings-commiten flippar sedan bara status; mätt på
# ea1cffbc rördes NOLL kryssrutor. Ingen part äger steget däremellan, så varje
# PRD med bygg-agent-skivor producerade en ny kull falskt röda kort — nattens
# drivande mängd växte från 20 (2026-08-18) till 31 (2026-08-20) på två dygn.
#
# OPTIONS-RYMDEN, VÄGD (TASK-281 AC #2; Marcus GO 2026-08-24 för väg iii):
#
#   (i)  ORKESTRERAREN BOCKAR som ett explicit steg i landnings-svepet.
#        FÖRKASTAD som huvudväg. Den lägger tillbaka exakt den manuella
#        handling som redan bevisligen uteblir: svepet ÄGDE steget hela tiden
#        (ADR-073 beslut 5 beskriver det), och 17 kort visar att beskrivningen
#        inte räckte. Det är ADR-083-felklassen ordagrant — en regel utan
#        mekanism efterlevs inte — och detta kort finns just för att bevisa det.
#        Behålls som MANDATERAD FALLBACK om (iii) faller tekniskt; den föll inte.
#   (ii) BYGG-AGENTEN ARMERAR OCH BOCKAR SJÄLV efter en CI-vakt.
#        FÖRKASTAD, och inte på smak: den bryter ADR-096:s väntekontrakt.
#        Subagenten är Activity — den saknar en framtida tur att vakna i, och
#        Monitor-callbacken levereras aldrig till en subagent (L340, mätt
#        2026-07-25). En agent som väntar in CI är en parkerad agent med färdig
#        leverans; T112 mätte elva sådana på en natt. Vägen kostar alltså exakt
#        den tillståndsklass orkestrerings-arkitekturen är byggd för att undvika.
#   (iii) GRINDEN SLUTAR KRÄVA RUTAN och härleder grönheten maskinellt. VALD.
#
# VAD (iii) FAKTISKT HÄRLEDER, OCH VARFÖR HÄRLEDNINGEN HÅLLER: allt som når
# `main` har gått genom merge-kön. Direktpush avvisas av rulesetet (ADR-076) och
# kön mergar aldrig en post vars required checks är röda. "CI grön per jobb på
# pushad commit" är därför inte något en människa ska intyga — det är en
# EGENSKAP hos landningen. Rutan var en manuell omskrivning av en invariant
# rulesetet redan upprätthåller.
#
# BEVISET KORTET MÅSTE BÄRA ÄR DÄRFÖR PEKAREN, INTE BOCKEN. En obockad DoD-rad
# som matchar BACKLOG_HARLEDD_DOD_MONSTER räknas inte som obockad — FÖRUTSATT
# att kortets Final Summary bär en landnings-pekare som matchar
# BACKLOG_LANDNINGS_PEKARE_MONSTER (`Landning: PR #<nr>`). Saknas pekaren
# räknas raden precis som förut och grinden säger vad som saknas. Bytet är
# alltså ett UTBYTE: ett manuellt påstående ersätts av en maskinläsbar pekare
# till den landning som bär beviset.
#
# PEKAREN KRÄVER ETIKETTORDET, OCH DET ÄR MÄTT: första formen var `PR #[0-9]+`
# rakt av, och den godkände TASK-285 vid provkörningen 2026-08-24 utan att
# någon rört kortet — slutraden nämner `PR #1811` (det visuella baslinje-låset)
# som KONTEXT, medan kortets faktiska landning var PR #1910. Rätt kort, fel
# bevis. Etikettordet skiljer en DEKLARERAD landning från ett omnämnande.
#
# DET LAGAR SAMTIDIGT DEATH POINTER-FORMEN (TASK-281 bifynd a). Sex kort bar
# slutraden "PR: se kortets notes/kommentarer" utan att något nummer fanns i
# notes; numren gick bara att få fram med `git log --grep`. Ett kort som pekar
# på ingenting är en pekare till en död adress. Nu är pekaren det som gör
# kortet grönt, så den kan inte utelämnas utan att någon märker det.
#
# ═══ VARFÖR HÄRLEDNINGEN INTE FRÅGAR gh ELLER git ═══
#
# Den uppenbara formen — slå upp PR:en mot GitHubs API och läsa dess checks —
# är förkastad, och det är ett MÄTT hinder, inte en bedömning:
#
#   * NATTJOBBET CHECKAR UT MED `fetch-depth: 1` (.github/workflows/nightly.yml,
#     jobbet `Backlog-stängning (natt-grind)`). Det finns alltså ingen
#     git-historik att slå `Merge pull request #N` mot i CI. En ancestry-baserad
#     verifiering hade fungerat lokalt och tyst fallit tillbaka i natten — den
#     dyraste sorten av grind.
#   * gh-API:t lägger till ett NÄTVERKSBEROENDE i en grind som i dag inte har
#     något. Rate-limit eller offline hade tvingat fram ett val mellan tyst
#     grönt (oacceptabelt) och falskt rött i en required check i natten (som
#     devalverar nästa larm — se KARENS-sektionen). Jobbet bär dessutom bara
#     `contents: read`.
#
# GRINDEN VERIFIERAR DÄRFÖR PEKARENS NÄRVARO OCH FORM, INTE DESS SANNING. Det
# är en ÖPPEN GRÄNS och skrivs ut som en: ett påhittat nummer passerar. Vad som
# ändå vinns är mätbart — pekaren finns, den står där en läsare av kortet ser
# den, och grinden skriver ut den varje natt. Det är strikt mer bevis än den
# bock den ersätter: bocken var ett påstående av den som stängde kortet, och
# den var dessutom obockad i samtliga 17 fall.
#
# ── HÅL 2: invariant 2 hade ingen undantagsform ──────────────────────────────
#
# `intentionally-open` undantar ÖPPNA kort (invariant 1 och 3). För ett STÄNGT
# kort fanns ingenting. Men det finns en legitim stängning med medvetet obockade
# rutor, och den är mätt fem gånger 2026-08-24 (TASK-283, 283.5, 285, 285.12,
# 286.6 i städvåg A, PR #1910): Marcus avstår QA:n verbatim ("Nej inget Q&A,
# skit i det. Gör klart allt de andra."), kortet stängs som formellt avskrivet i
# stället för genomfört, och AC-rutorna lämnas obockade MED AVSIKT — att bocka
# dem hade varit en osann utsaga om att vandringen gjorts. Samma klass:
# TASK-283 DoD #5/#6, obockade för att bokstaven är strukturellt omöjlig
# respektive inapplicerbar efter en arkitekturpivot.
#
# Den formen gjorde grinden RÖDARE ju mer korrekt den utfördes. En grind som
# straffar den ärligaste stängningen lär ut fel sak.
#
# FORMEN ÄR TVÅFAKTORS, MED FLIT: etiketten BACKLOG_AVSTADD_KRAV_ETIKETT OCH
# markören BACKLOG_AVSTADD_KRAV_MARKOR i kortets Notes eller Final Summary.
# Etikett UTAN markör FÄLLER med eget meddelande. Skälet är asymmetrin mot
# `intentionally-open`: den etiketten tystar ett kort som ännu inte är stängt
# (lågt pris — det prövas igen när det stängs), medan denna tystar ett STÄNGT
# kort för alltid. En enfaktors-form hade varit en blankocheck som vem som helst
# kan skriva ut med ett `--add-label`. Två faktorer kostar en mening och tvingar
# fram tanken.
#
# FÖRKASTAT — låta `wontfix` undanta automatiskt. Etiketten finns redan
# (backlog/config.yml) och TASK-283.1 är stängd med den. Men `wontfix` betyder
# "vi gör inte detta", vilket är ortogonalt mot "rutorna är obockade med
# avsikt", och att ge en befintlig etikett ny tystande verkan hade ändrat
# innebörden för varje kort som redan bär den — retroaktivt och osynligt.
# FÖRKASTAT — undanta per RAD i stället för per kort. Det kräver en
# deklarations-syntax bunden till radnummer, och radnummer flyttar sig när ett
# AC läggs till. Kort-nivån följer dessutom `intentionally-open`-precedenten:
# etiketten säger något om KORTET, inte om en enskild kontroll.
# FÖRKASTAT — en ny status (`Avskriven`). Samma argument som redan står under
# AVSIKTLIGT ÖPPNA KORT: backlog/config.yml deklarerar exakt tre statusar, och
# en fjärde ändrar tavlan för varje kort och varje verktyg.
#
# BÅDA UNDANTAGEN REDOVISAS ÖPPET i täcknings-blocket, med kort-ID. Ett undantag
# som inte syns är samma defekt som TASK-90 lagade: en blind fläck utskriften
# inte redovisar. Ledstjärnan är repots egen — registrera, förkasta aldrig tyst.
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
# Kortens metadata och relationer läses via backlog-CLI:t. Raden sade fram till
# TASK-238 (2026-08-17) att kortens INNEHÅLL lästes så "aldrig genom att parsa
# task-filer" — och grinden gjorde då ett CLI-anrop PER KORT. Det är mätt
# ohållbart: `task view` kostar linjärt i katalogens storlek, så svepet är
# O(n²) och sprängde sitt tak i CI (run 31987759931, cancelled efter 10m16s).
# Fakta-insamlingen bor sedan dess i scripts/backlog-kortfakta.mjs, som tar
# metadata/relationer ur CLI:ts `task list --json` i ETT anrop och ENDAST
# AC/DoD-kryssrutornas antal ur task-filerna — med en korsvalidering mot CLI:t
# varje körning. Hela avvägningen, mätserien och de förkastade alternativen bor
# i den filens huvud; upprepa dem inte här (ADR-100 § karta, aldrig kopia).
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

# ═══ STÄNGNINGSFORMERNAS POLICY-VARIABLER (TASK-281) ═══
#
# Alla fyra är OPTIONELLA var för sig: tomt/saknat = grinden beter sig exakt
# som före TASK-281. Ett repo utan tvåstegsstängning behöver ingen av dem.
#
# MEN DE ÄR PARVIS KOPPLADE, OCH KOPPLINGEN ÄR FAIL-CLOSED. Sätts halva paret
# blir undantaget en blankocheck: en härledd DoD-rad utan pekar-mönster hade
# undantagits utan att kortet behövde bära något bevis alls, och en
# avstådd-krav-etikett utan markör hade tystat ett stängt kort på ett enda
# `--add-label`. Grinden fäller därför till exit 2 (anropsfel) i stället för
# att gissa vilken halva som var avsedd.
if [[ -n "${BACKLOG_HARLEDD_DOD_MONSTER:-}" && -z "${BACKLOG_LANDNINGS_PEKARE_MONSTER:-}" ]]; then
    echo "❌ BACKLOG_HARLEDD_DOD_MONSTER är satt men BACKLOG_LANDNINGS_PEKARE_MONSTER saknas i ${POLICY_FIL}" >&2
    echo "   Utan pekar-mönster undantas den härledda DoD-raden utan att kortet" >&2
    echo "   behöver bära något bevis — det är tyst grönt, inte en härledning." >&2
    exit 2
fi
if [[ -n "${BACKLOG_AVSTADD_KRAV_ETIKETT:-}" && -z "${BACKLOG_AVSTADD_KRAV_MARKOR:-}" ]]; then
    echo "❌ BACKLOG_AVSTADD_KRAV_ETIKETT är satt men BACKLOG_AVSTADD_KRAV_MARKOR saknas i ${POLICY_FIL}" >&2
    echo "   Utan markör räcker ett '--add-label' för att tysta ett stängt kort" >&2
    echo "   för alltid. Undantaget är tvåfaktors med flit — se grindens huvud." >&2
    exit 2
fi
BACKLOG_HARLEDD_DOD_MONSTER="${BACKLOG_HARLEDD_DOD_MONSTER-}"
BACKLOG_LANDNINGS_PEKARE_MONSTER="${BACKLOG_LANDNINGS_PEKARE_MONSTER-}"
BACKLOG_AVSTADD_KRAV_ETIKETT="${BACKLOG_AVSTADD_KRAV_ETIKETT-}"
BACKLOG_AVSTADD_KRAV_MARKOR="${BACKLOG_AVSTADD_KRAV_MARKOR-}"

# ═══ CI-KONTEXTENS check_active_branches-AVSTÄNGNING (TASK-238) ═══
#
# check_active_branches: true (TASK-93) skyddar ID-allokering vid INTERAKTIV
# `task create` — grinden allokerar ALDRIG ett ID (bara `task list` +
# `task <id>`), så flaggan skyddar ingenting här och kostar bara. Fem nätter i
# rad växte körtiden monotont (7m26s→10m15s) och natt 08-16 korsade
# timeout-minutes: 10 (cancelled). Se TASK-238 för forensiken.
#
# LÖSNINGEN ÄR CONFIG-DRIVEN, INTE ETT CLI-HACK — men INTE via `backlog config
# set` heller. Research 2026-08-16 mot backlog.md 1.49.1, i fallande ordning:
#
#   1. En per-anrops-flagga/env-var: FINNS INTE. `task list --help`/
#      `task view --help` bär ingen sådan flagga, och binären känner bara
#      till env-namnen BACKLOG_CWD/BACKLOG_BUNDLE_ASSET_DIR (grep mot
#      strängarna i node_modules/backlog.md-darwin-x64/backlog).
#   2. `backlog config set checkActiveBranches false`: skriver till SAMMA fil
#      interaktiv användning läser (backlog/config.yml) — får inte röras (se
#      ovan) — och är dessutom MÄTT FÖRLUSTFULL som round-trip: en
#      false→true-tur lämnade filen omserialiserad (t.ex. `definition_of_done`
#      normaliserat från YAML-lista till inline JSON-array) trots identiskt
#      booleskt värde. Även i en engångs-CI-checkout hade det varit en
#      onödig risk att förlita sig på.
#   3. `backlog.config.yml` i PROJEKTROTEN (CLI:ts "ROOT_CONFIG", en
#      DOKUMENTERAD mekanism i CLI:ts egen källkod, inte ett reverse-
#      engineering-hack): finns filen äger den ALLA inställningar
#      (`checkActiveBranches` inkluderat), medan uppgiftsdatan fortfarande
#      löses ur den riktiga `backlog/`-mappen. VERIFIERAT LIVE 2026-08-16:
#      med en sådan fil (`check_active_branches: false`, för övrigt en
#      byte-för-byte-kopia av backlog/config.yml) läste
#      `config get checkActiveBranches` "false" och `task list --plain`
#      visade fortfarande de riktiga korten. Väg 3 är den valda.
#
# Filen skapas som en KOPIA av den riktiga config.yml (aldrig via
# `config set`) med endast `check_active_branches`-raden bytt — varje annan
# inställning ärvs exakt, utan att förlita sig på att CLI:ts defaults råkar
# matcha projektets. `trap … EXIT` garanterar att filen tas bort igen vid
# skriptets egna `exit`-vägar OCH vid ett avbrott utifrån — den riktiga
# backlog/config.yml (den INTERAKTIVA flaggan, TASK-93) rörs ALDRIG, varken
# i CI eller lokalt.
#
# STÄDNINGEN ÄR GARANTERAD MEN INTE OMEDELBAR — MÄTT 2026-08-16 under detta
# korts eget byggarbete, kontrollerat A/B med en minimal repro (`$(sleep 30)`
# i stället för det riktiga CLI-anropet): ett `kill` (SIGTERM) medan skriptet
# är blockerat i en pågående `$(${BACKLOG_CMD} …)`-substitution kör INTE
# trappen förrän det just då pågående anropet självt returnerar — även med
# explicita INT/TERM/HUP-trappar (identiskt utfall med och utan; bash kör
# inte pending traps förrän den blockerande wait() på barnprocessen är klar).
# INT/TERM/HUP finns ändå kvar nedan: de kostar inget och täcker den smalare
# tidslucka där skriptet INTE är blockerat i ett CLI-anrop. Konsekvensen av
# den deferrade städningen: CI:s checkout kastas ändå (aldrig committat) så
# en fördröjd städning där är ofarlig — job 95102582546 (kortets forensik,
# "Terminate orphan process… backlog") är exakt den situationen. Lokalt är
# städningen fördröjd, inte utebliven: filen försvinner så snart det
# pågående CLI-anropet returnerar (verifierat i samma A/B).
#
# OPTIONELL: tomt/saknat värde = grinden beter sig precis som innan detta
# kort (ingen override). Universell logik, projekt-specifikt värde i policy —
# samma mönster som resten av filen.
if [[ "${BACKLOG_CI_STANG_AV_AKTIVA_GRENAR:-}" == "true" ]]; then
    if [[ -z "${BACKLOG_CONFIG_YML_SOKVAG:-}" ]]; then
        echo "❌ BACKLOG_CI_STANG_AV_AKTIVA_GRENAR är true men BACKLOG_CONFIG_YML_SOKVAG saknas i ${POLICY_FIL}" >&2
        echo "   Grinden vägrar gissa var config.yml ligger." >&2
        exit 2
    fi
    if [[ ! -f "${BACKLOG_CONFIG_YML_SOKVAG}" ]]; then
        echo "❌ ${BACKLOG_CONFIG_YML_SOKVAG} (BACKLOG_CONFIG_YML_SOKVAG) hittas inte" >&2
        exit 2
    fi
    BACKLOG_CI_ROOT_OVERRIDE="backlog.config.yml"
    if [[ -e "${BACKLOG_CI_ROOT_OVERRIDE}" ]]; then
        echo "❌ ${BACKLOG_CI_ROOT_OVERRIDE} finns redan — grinden skriver aldrig över en befintlig fil" >&2
        exit 2
    fi
    if grep -q '^check_active_branches:' "${BACKLOG_CONFIG_YML_SOKVAG}"; then
        sed -E 's/^check_active_branches:.*/check_active_branches: false/' \
            "${BACKLOG_CONFIG_YML_SOKVAG}" > "${BACKLOG_CI_ROOT_OVERRIDE}"
    else
        cp "${BACKLOG_CONFIG_YML_SOKVAG}" "${BACKLOG_CI_ROOT_OVERRIDE}"
        printf 'check_active_branches: false\n' >> "${BACKLOG_CI_ROOT_OVERRIDE}"
    fi
    # shellcheck disable=SC2064 # sökvägen ska expanderas NU, inte vid trap-tillfället
    trap "rm -f '${BACKLOG_CI_ROOT_OVERRIDE}'" EXIT
    # INT/TERM/HUP anropar bara `exit N` — det UTLÖSER i sin tur EXIT-trappen
    # ovan, så städningen står på EN plats. Täcker den tidslucka där skriptet
    # INTE är blockerat i ett CLI-anrop (se A/B-mätningen i kommentarblocket
    # ovanför BACKLOG_CI_ROOT_OVERRIDE-tilldelningen för vad som mättes och
    # vad som INTE mättes — dessa rader garanterar inte omedelbar städning
    # under ett blockerat CLI-anrop, bara vid ett `exit N` som faktiskt körs).
    trap 'exit 130' INT
    trap 'exit 143' TERM
    trap 'exit 129' HUP
fi

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

# Stängningsformernas redovisning (TASK-281). Ett undantag som inte syns är
# samma defekt TASK-90 lagade: en blind fläck utskriften inte redovisar. Båda
# räknas OCH namnges, i båda utfallen.
antal_harledda=0
antal_avstadda=0
HARLEDDA_IDN=""
AVSTADDA_IDN=""

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

# ═══ KORT-FAKTA I ETT SVEP (TASK-238) ═══
#
# Ett CLI-anrop per kort är strukturellt ohållbart: `task view` laddar hela
# uppgiftskatalogen vid varje anrop (MÄTT 2026-08-17: 0,471 s vid 10 kort →
# 2,654 s vid 502), så svepet är O(n²) — 502 kort ≈ 22 min, och talet växer
# kvadratiskt med backloggen. Natten 2026-08-17 cancellades grinden mot
# timeout-minutes: 10 efter 10m16s med gren-skanningsfixen redan i trädet.
#
# Insamlingen bor därför i scripts/backlog-kortfakta.mjs: `task list --json` i
# ETT anrop för metadata och relationer, AC/DoD-kryssrutorna ur task-filerna,
# plus en korsvalidering mot CLI:t varje körning. Avvägningen mot repots
# "läs kort endast via CLI:t"-konvention är utskriven i den filens huvud och i
# ADR-117 — den är ett medvetet, bevakat undantag, inte en glidning.
#
# Fältordning (status SIST — fältet får svälja resten av raden):
#   id|tid12|ac_totalt|ac_obockat|dod_obockat|dod_obockat_harledd|har_pekare|
#   har_markor|barn_ids|labels|status
#
# PORTABILITET: `mapfile`/`readarray` finns först i bash 4. macOS levererar
# bash 3.2, så en mapfile-form hade fungerat i CI och aldrig lokalt — alltså en
# grind ingen kan pröva på sin egen maskin före push. Den `while read`-form som
# används här kör i båda. Av samma skäl används INGEN associativ array
# (`declare -A`, bash 4) för barn-uppslaget — därav rad-strängen ovan.
#
# Exitkoden fångas SEPARAT: helperns exit 2 (anropsfel) måste nå ut som 2, och
# en pipe hade läst sista ledets kod i stället (L440).
KORTFAKTA_SKRIPT="${BACKLOG_KORTFAKTA_SKRIPT:-scripts/backlog-kortfakta.mjs}"
if [[ ! -f "${KORTFAKTA_SKRIPT}" ]]; then
    echo "❌ ${KORTFAKTA_SKRIPT} saknas — grinden kan inte samla kort-fakta" >&2
    exit 2
fi
KORTFAKTA=""
KORTFAKTA="$(BACKLOG_CMD="${BACKLOG_CMD}" \
    BACKLOG_HARLEDD_DOD_MONSTER="${BACKLOG_HARLEDD_DOD_MONSTER}" \
    BACKLOG_LANDNINGS_PEKARE_MONSTER="${BACKLOG_LANDNINGS_PEKARE_MONSTER}" \
    BACKLOG_AVSTADD_KRAV_MARKOR="${BACKLOG_AVSTADD_KRAV_MARKOR}" \
    node "${KORTFAKTA_SKRIPT}")"
kortfakta_kod=$?
if [[ "${kortfakta_kod}" -ne 0 ]]; then
    echo "❌ ${KORTFAKTA_SKRIPT} gav exitkod ${kortfakta_kod} — korten är OPRÖVADE" >&2
    exit 2
fi
if [[ -z "${KORTFAKTA}" ]]; then
    echo "❌ noll kort hittades — CLI:t svarade inte som väntat" >&2
    echo "   Fail-closed: en tom lista är ett anropsfel, aldrig 'allt är bra'." >&2
    exit 2
fi

# ═══ PASS 1 — läs varje kort en gång, pröva invariant 1 och 2, spara raden ═══

while IFS='|' read -r id tid_siffror ac_totalt ac_obockat dod_obockat dod_obockat_harledd \
                       har_pekare har_markor barn_ids labels status; do
    [[ -z "${id}" ]] && continue
    [[ -z "${status}" ]] && continue
    antal_kort=$((antal_kort + 1))

    # Etiketterna, exakt per token. Fältet är kommaseparerat.
    deklarerad=0
    avstadd_etikett=0
    rest="${labels}"
    while [[ -n "${rest}" ]]; do
        tok="${rest%%,*}"
        if [[ "${tok}" == "${rest}" ]]; then rest=""; else rest="${rest#*,}"; fi
        tok="${tok#"${tok%%[![:space:]]*}"}"   # trimma före
        tok="${tok%"${tok##*[![:space:]]}"}"   # trimma efter
        [[ "${tok}" == "${BACKLOG_AVSIKTLIGT_OPPEN_ETIKETT}" ]] && deklarerad=1
        if [[ -n "${BACKLOG_AVSTADD_KRAV_ETIKETT}" && "${tok}" == "${BACKLOG_AVSTADD_KRAV_ETIKETT}" ]]; then
            avstadd_etikett=1
        fi
    done

    # ── Karensens tidsstämpel ────────────────────────────────────────────────
    #
    # `tid_siffror` (YYYYMMDDHHMM) kommer färdig ur kortfakta-skriptet, som tar
    # `updatedAt` och faller tillbaka på `createdAt`: `updatedAt` är kortets
    # senaste ändring och därmed den tidpunkt då det gick in i sitt nuvarande
    # tillstånd. Saknas fältet har kortet ALDRIG redigerats efter skapandet — och
    # då ÄR `createdAt` den tidpunkten. Fallbacken är alltså inte en
    # approximation utan det korrekta värdet för just de korten.
    #
    # Att fallbacken dessutom är ofarlig går att härleda: tillståndet invariant 1
    # fäller på kräver bockade AC, och AC bockas med `task edit --check-ac`, som
    # SKRIVER `updated_date`. Ett kort utan fältet kan därför inte ha nått
    # tillståndet via arbetsflödet.
    #
    # FÖRKASTAT — låta avsaknad av tidsstämpel betyda "utanför karens" (bedöm
    # direkt). Det hade gjort ett saknat fält till en fällande signal, vilket är
    # att gissa åt det dyraste hållet.
    # FÖRKASTAT — tyst hoppa över kort utan tidsstämpel. Det är exakt TASK-90:s
    # defekt: en blind fläck som utskriften inte redovisar. De räknas i stället
    # öppet i täcknings-blocket.
    #
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

    # ── Stängningsformerna (TASK-281) — gäller ENDAST stängda kort ───────────
    #
    # Båda formerna är avsiktligt inaktiva för öppna kort. En avstådd-krav-
    # etikett på ett To Do-kort säger ingenting (kortet är inte stängt), och att
    # låta blankocheck-spärren fälla där hade gett ett falskt rött på ett kort
    # vars etikett bara ligger i förväg.
    avstadd=0
    if [[ "${ar_klar}" -eq 1 && "${avstadd_etikett}" -eq 1 ]]; then
        if [[ "${har_markor}" -eq 1 ]]; then
            avstadd=1
        else
            # Blankocheck-spärren. Exit 1 (drift), aldrig 2: det är kortets
            # tillstånd som är fel, inte anropet.
            echo "❌ TASK-${id} — bär etiketten '${BACKLOG_AVSTADD_KRAV_ETIKETT}' men ingen motivering"
            echo "   Etiketten undantar ett STÄNGT kort från invariant 2 för alltid."
            echo "   Den kräver därför en utskriven motivering på kortet, som börjar"
            echo "   med markören '${BACKLOG_AVSTADD_KRAV_MARKOR}' i Implementation Notes"
            echo "   eller Final Summary. Utan den är etiketten en blankocheck."
            echo "   Fix: ${BACKLOG_CMD} task edit ${id} --append-notes '${BACKLOG_AVSTADD_KRAV_MARKOR} <varför>'"
            antal_fel=$((antal_fel + 1))
            EXIT_CODE=1
        fi
    fi

    # Härledda DoD-rader dras av när kortet bär sin landnings-pekare. Utan
    # pekare räknas de precis som förut — härledningen är ett UTBYTE (bock mot
    # pekare), aldrig en amnesti.
    dod_kvar="${dod_obockat}"
    pekare_saknas=0
    if [[ "${dod_obockat_harledd}" -gt 0 ]]; then
        if [[ "${har_pekare}" -eq 1 ]]; then
            dod_kvar=$(( dod_obockat - dod_obockat_harledd ))
            antal_harledda=$((antal_harledda + 1))
            HARLEDDA_IDN="${HARLEDDA_IDN}${HARLEDDA_IDN:+, }TASK-${id}"
        else
            pekare_saknas=1
        fi
    fi

    # Invariant 2 — kortet stängt utan att arbetet är bevisat.
    if [[ "${ar_klar}" -eq 1 && "${avstadd}" -eq 0 \
          && ( "${ac_obockat}" -gt 0 || "${dod_kvar}" -gt 0 ) ]]; then
        echo "❌ TASK-${id} — status '${status}' men ${ac_obockat} AC och ${dod_kvar} DoD står obockade"
        echo "   Kortet är stängt utan att kraven är kvitterade."
        if [[ "${pekare_saknas}" -eq 1 ]]; then
            echo "   ${dod_obockat_harledd} av dem är HÄRLEDDA rader (matchar '${BACKLOG_HARLEDD_DOD_MONSTER}')"
            echo "   som inte kräver en bock — men kortets Final Summary bär ingen"
            echo "   landnings-pekare (mönster '${BACKLOG_LANDNINGS_PEKARE_MONSTER}')."
            echo "   Fix: ${BACKLOG_CMD} task edit ${id} --append-final-summary 'Landning: PR #<nr>'"
        fi
        antal_fel=$((antal_fel + 1))
        EXIT_CODE=1
    fi
    if [[ "${avstadd}" -eq 1 ]]; then
        antal_avstadda=$((antal_avstadda + 1))
        AVSTADDA_IDN="${AVSTADDA_IDN}${AVSTADDA_IDN:+, }TASK-${id}"
    fi
    # Herestring, inte pipe: en pipe hade kört loopen i ett SUBSKAL, och då
    # hade antal_kort/KORT_RADER/EXIT_CODE nollställts vid loopens slut —
    # grinden hade rapporterat 0 prövade kort och exit 0. Samma form som pass 2.
done <<< "${KORTFAKTA}"

# Fail-closed mot TYST FORMAT-DRIFT. Karensen läser tidsstämplarna ur CLI:ts
# JSON. Byter verktyget namn på de fälten skulle VARJE kort hamna i
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

# Stängningsformerna (TASK-281). Skrivs bara när de är påslagna i policyn —
# ett repo som inte använder dem ska inte läsa två rader nollor varje natt.
if [[ -n "${BACKLOG_HARLEDD_DOD_MONSTER}" || -n "${BACKLOG_AVSTADD_KRAV_ETIKETT}" ]]; then
    echo ""
    echo "Stängningsformer bland de ${antal_kort} korten:"
    if [[ -n "${BACKLOG_HARLEDD_DOD_MONSTER}" ]]; then
        echo "  ${antal_harledda} med härledd DoD-rad ('${BACKLOG_HARLEDD_DOD_MONSTER}') godkänd via landnings-pekare"
        [[ -n "${HARLEDDA_IDN}" ]] && echo "     ${HARLEDDA_IDN}"
    fi
    if [[ -n "${BACKLOG_AVSTADD_KRAV_ETIKETT}" ]]; then
        echo "  ${antal_avstadda} stängda med avstådda krav (etikett '${BACKLOG_AVSTADD_KRAV_ETIKETT}')"
        [[ -n "${AVSTADDA_IDN}" ]] && echo "     ${AVSTADDA_IDN}"
        if [[ "${antal_avstadda}" -gt 0 ]]; then
            echo "     Dessa är UNDANTAGNA från invariant 2, inte friskförklarade."
            echo "     Motiveringen står på varje kort vid markören '${BACKLOG_AVSTADD_KRAV_MARKOR}'."
        fi
    fi
fi

exit "${EXIT_CODE}"
