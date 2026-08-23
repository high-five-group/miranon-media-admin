---
id: TASK-303
title: >-
  Fynd: bevakningsradens höjd varierar med copyns längd — anatomi i stället för
  radbrytning
status: To Do
assignee: []
created_date: '2026-08-22 21:48'
updated_date: '2026-08-23 15:06'
labels:
  - ready-for-human
dependencies: []
ordinal: 556000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bevakningsraderna på Hem växer i höjd när texten spricker till två rader. Marcus 2026-08-22: det får aldrig hända — eventinfo-radernas höjd ska vara konstant.

MÄTT PÅ DISK (src/components/hem/Bevakningsrad.tsx, main 24238b1c): båda radtyperna bär line-clamp-2 med min-h-12. Tvåradigheten är alltså ETT MEDVETET VAL, inte ett slarv — kodkommentaren motiverar det med Gunilla-principen: line-clamp-2 i stället för truncate, eftersom en klippt mening är obegriplig. Mätning i samma kodbas: vid 375 px åt frasen 'startar om N dagar' ensam ~19 tecken av radens ~33-teckens enradsbudget, och hela raden (namn + dagar + status) ska rymmas i den.

TRE KRAV SOM INTE KAN HÅLLA SAMTIDIGT så länge raden bär en mening av varierande längd: (1) höjden får aldrig variera, (2) texten får aldrig klippas mitt i ett ord, (3) ordet 'nya' ska stå kvar. En höjdlåsning ensam offrar (2); två reserverade rader offrar (1) i praktiken; kortad copy offrar (3).

BESLUTAD VÄG (Marcus 2026-08-22, verbatim: 'Jag står vid dina rekommendationer på alla punkter'): väg D + C:s badge. Gör tvåradigheten till ANATOMI i stället för till radbrytning — rubrikrad + undertext, alltid båda, alltid samma höjd, samma form som personlistans radanatomi som Marcus själv föreslog i S111:s grillning och som TASK-299.3 bygger in i anmälningssidan. Siffran som varierar lyfts ut ur meningen till en badge med reserverad plats, så längden slutar bero på data. Höjden blir därmed konstant av konstruktion, inte av en spärr.

DIVERGENS SOM MÅSTE AVGÖRAS I SAMMA ARBETE: skarpa appen och prototypen bär OLIKA strängar, båda med en Marcus-motivering i koden. src/components/hem/hem-derivations.ts:319 = 'N nya deltagare saknar eventinfo' (motiv: 'nya friar Lotta från falsk glömske-signal' — utan ordet kan hon läsa en oförändrad siffra som att inget hänt). src/components/dev/hem-prototyp/data.ts:312 = 'N deltagare saknar eventinfo' (motiv: Marcus-granskning 2026-08-16, den gamla klipptes med ellipsis, stryk utfyllnadsordet). De två ytorna har glidit isär och fortsätter göra det tills en av dem vinner.

GRÄNSER SOM ÄRVS: placeringen bland bevakningsraderna är LÅST (ADR-122 beslut 7, TASK-284.4 AC #1/#2). Familjegränsen mot notisfamiljen står (ADR-122 beslut 8 + DESIGN-SYSTEM-SPEC §22): bevakningsraden är arbetsobjekt, tillståndsbundet — den lånar aldrig notistrappans varningsfärg. Golv: TASK-284.4 AC #5, aldrig betydelse enbart genom färg. Ytan är facit-stämplad (tasks/sessions/bilagor/s102-hem-konvergens/facit.json) och kräver amendering med Marcus citat.

REGISTRERAD SOM EGET KORT, inte som utvidgning av TASK-291: 291 är uttryckligen smalt (enbart åtgärdskö-radens särskiljning, AC #1 levererad i PR #1827), medan detta rör BÅDA radtypernas anatomi och höjd. Relaterat: TASK-291, TASK-284.4 DoD #6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bevakningsradens höjd är konstant oavsett copyns längd och oavsett antalet siffror i talet — verifierat som BETEENDE i test, inte som påstående, vid smalaste stödda bredd
- [x] #2 Radanatomin är rubrikrad + undertext, alltid båda renderade, samma form som personlistans radanatomi
- [ ] #3 Ingen text klipps mitt i ett ord i något läge (Gunilla-principen håller)
- [x] #4 Sträng-divergensen mellan hem-derivations.ts och dev/hem-prototyp/data.ts är avgjord åt ETT håll, med Marcus citat daterat på kortet, och båda ytorna bär samma sträng efteråt
- [x] #5 Familjegränsen mot notisfamiljen orörd: ingen varningsfärg, ingen notis-ikon; betydelse aldrig enbart genom färg
- [ ] #6 Hem-facit amenderat i egen commit med Marcus citat, EFTER att formen är godkänd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SCOPE-ÄNDRING 2026-08-22 — löses i TASK-291:s prototyp-varv, inte som separat bygge.

Marcus i klartext: "du bygger en prototyp som vi kan promovera till skarpa bevakningrad.tsx nu va? För det tar vi tag i direkt, problemet med höjd och radbrytning och de som jag pratade om."

Skälet: TASK-291:s prototyp och detta kort rör SAMMA rader och skulle annars kräva två granskningar och två promoveringar av samma yta — och två stämplingar av hem-facit inom loppet av dagar. Anatomin (rubrikrad + undertext, alltid båda, talet i badge med reserverad plats) byggs därför in i 291:s prototyp i samma varv som variant A:s förstärkta ikon-behållare, li-regressionen och variant C:s osynliga cirkel.

Kortet lever kvar som bärare av PROBLEMET, mätningarna och sträng-divergensen — det är inte uppgått i 291. Dess AC prövas mot den gemensamma prototypen och bockas när formen är godkänd.

MÄTT I WEBBLÄSARE 2026-08-22 (localhost, prototyp-ytan, 1055 px): eventinfo-raden 74 px när copyn bryter till två rader, åtgärdskö-raden 50 px. Höjden varierar alltså mellan radtyperna redan i dag, inte bara inom en radtyp. Prototypens tre varianter mätte 58/70/58 px — ytterligare spridning.

BEVISKRAV SATT PÅ AGENTEN: höjden ska hålla vid smalaste stödda bredd med kort OCH lång copy, med ett-, två- och tresiffriga tal, för BÅDA radtyperna, och bevisas med negativkontroll (bryt reserveringen medvetet, mät att testet fäller, återställ). Ett test som inte kan fälla bevisar ingenting — precedent: TASK-299.3:s agent mätte 28,5 px skillnad i sin negativkontroll.

STRÄNG-DIVERGENSEN ÄR INTE AVGJORD. Anatomi D upplöser utrymmesskälet för strykningen av ordet 'nya', så prototypen byggs med skarpa appens fulla sträng ('N nya deltagare saknar eventinfo'). Det är ett BYGGVAL för att kunna visa formen, inte ett beslut — AC #5 kräver fortfarande Marcus ord innan de två ytorna synkas.

GRUNDARBETE AVANCERAT via TASK-291-PR:en (2026-08-23, Marcus-order via orkestreraren mitt i TASK-291s byggpass). AtgardskoRadVarianter.tsx (prototyp-fil, /dev/hem-atgardsko-prototyp) fick den beslutade anatomin (rubrikrad + undertext, alltid båda, tal i reserverad badge, tvåradigt CSS-grid) för BÅDA radtyperna, samt EventinfoRadAnatomi som visar formen för eventinfo-raden. Höjdlås bevisat som beteende (Playwright, negativkontroll, 375/390/768/1280px, 1/2/3-siffriga tal, PR #1388s 91-teckens värsta-fall-namn) — se TASK-291-kortets Implementation Notes för hela mätmatrisen, inte upprepad här.

INTE GJORT HÄR: Bevakningsrad.tsx (skarp yta) rörd = 0 rader, ingen promovering, inget facit amenderat. AC #5 (sträng-divergensen) EJ formellt avgjord — prototypen använder nu skarpa appens fulla sträng som en implementationsdetalj, men Marcus citerade beslut om VILKEN sträng som vinner permanent saknas fortfarande. Detta korts egna ACs/DoD förblir därför obockade — kortet stängs av en separat promoverings-/facit-passering, inte av denna commit.

AC #3 ÄR FALSIFIERAT AV MARCUS EGET SENARE BESLUT — kräver hans ord innan kortet är stängbart.

Kriteriet lyder: "Talet som varierar bärs av en badge med reserverad plats, inte inbakat i meningen."

Marcus 2026-08-23, verbatim: "jag vill ta bort siffer-pillen och sätta chevronen centrerat. Istället för siffer-pillen på bevakningsraden så vill jag att vi skriver ut '3 nya deltagare saknar deltagarinfo', siffran ska alltså in i meningen."

Den levererade och GODKÄNDA formen motsäger alltså kriteriet rakt av. AC #3 kan därför aldrig bockas ärligt. Det är inget misslyckande — det är ett AC som ett senare beslut kastade omkull. Det ska AMENDERAS eller STRYKAS ÖPPET med Marcus citat, aldrig bockas falskt och aldrig lämnas obockat i tysthet, annars är kortet omöjligt att stänga.

AC #5 HAR GLIDIT ÅT FEL HÅLL, inte närmare. Kriteriet kräver att båda ytorna bär SAMMA sträng efteråt. Just nu säger prototypen "3 nya saknar deltagarinfo" medan skarpa hem-derivations.ts fortfarande säger "3 nya deltagare saknar eventinfo" — ytorna är MER isär än när kortet skrevs, eftersom ordbytet Eventinfo→Deltagarinfo bara är gjort i prototypens copy. AC #5 stängs först när det globala ordbytet är gjort OCH formen promoverats.

VAD SOM FAKTISKT ÄR BYGGT OCH GODKÄNT (lokalt, opushat, wip/s111-marcus-iteration): anatomin rubrikrad + undertext alltid båda renderade, höjden konstant 70 px på båda radtyperna, chevron och tid centrerade mot hela raden med 0,0 px avvikelse, tiden i vit pill (PersonsList Pill-formen, 7,91:1 textkontrast), ingen text klippt. Höjdlåset mätt mot 1-, 2-, 3- och 4-siffriga tal.

MENINGEN KORTADES för att rymmas med centrerad tid: "3 nya saknar deltagarinfo" i stället för "3 nya deltagare saknar deltagarinfo" (201 px behov mot 171 tillgängliga). Marcus valde den framför alternativet att sätta bakgrund på siffran — skälet var hans eget: ordet "nya" bär betydelsen.

2026-08-23 (S111 resume 2, fönster 1) — AC #3 STRUKET på Marcus beslut: *"1. Stryk"* som svar på frågan om kriteriet (*"talet bärs av en badge med reserverad plats, inte inbakat i meningen"*) skulle amenderas eller strykas. Bakgrund: Del 5 rev exakt det — siffer-pillen revs, talet in i meningen (eventinfo-raden) respektive rubriken (åtgärdskö-raden), och höjdlåset bärs av radanatomin + 375 px-regressionsvakten i stället. Kriteriet kunde aldrig bockas ärligt. Ordbytet Eventinfo → Deltagarinfo (AC #5:s sträng-divergens) avgörs SAMTIDIGT: Marcus *"4. UI-copy enbart"* — synliga UI-strängar byter ord; actionType 'eventinfo' (SendActionEmail-kontraktet), routen skickade-mail/eventinfo, test-id:t eventinfo-signal-slot och aktivitetsloggens typer rörs INTE.

Omnumrering efter strykningen: CLI:t packar index, så gamla AC #4–#7 är nu #3–#6 — sträng-divergensen (ordbytet) är AC #4, hem-facit-amenderingen AC #6.

ORDBYTET GENOMFÖRT 2026-08-23 (gren feat/s111-ordbyte-deltagarinfo, baserad på wip/s111-marcus-iteration c52a0cdc). Marcus Del 5, verbatim: "Jag vänder beslutet." Gräns, verbatim: "4. UI-copy enbart." Samtliga synliga UI-strängar bär nu "deltagarinfo"/"deltagarinformation": bevakningsradens båda lägen, eventsidans rad "Deltagarinfo skickad", MetaRad-datumraderna (Deltagare.tsx + AtgardsSida.tsx + Betalningar.tsx + AnmalanDetail.tsx), svep-overlayns rubrik/åtgärdsnamn/tomläge/slide-etikett, åtgärdsmallens namn, hållplats-prototypens stegetikett och aktivitetsloggens två verb-copyn. ORDLISTA § Eventinfo omdöpt till § Deltagarinfo med den gamla regeln kvar som öppet riven historik.

IDENTIFIERARE ORÖRDA per gränsen: actionType "eventinfo" (SendActionEmail-kontraktet, EF:en), routen skickade-mail/eventinfo, test-id:t eventinfo-signal-slot, filter-ID:t eventinfo-saknas, SvepTyp-unionens "eventinfo", samtliga variabel-/funktions-/typnamn och Airtable-fältnamnen.

AC #4 EJ BOCKAD — ordbytet ensamt gör den inte sann. Kriteriet kräver att hem-derivations.ts och dev/hem-prototyp/data.ts bär SAMMA sträng. Efter ordbytet säger de "N nya deltagare saknar deltagarinfo" respektive "N deltagare saknar deltagarinfo" — ordet "nya" skiljer dem fortfarande, och hem-atgardsko-prototypens godkända form säger en tredje variant, "N nya saknar deltagarinfo". Detta korts egna notes sade det redan före arbetet: "AC #5 stängs först när det globala ordbytet är gjort OCH formen promoverats." Ordbytet är gjort; promoveringen av Bevakningsrad.tsx återstår och äger ordvalet. AC #4 bockas av det passet.

AC #1/#2/#4/#5 UPPFYLLDA 2026-08-23 — promoveringspasset (gren feat/s111-291-promovering-bevakningsrad, bas wip/s111-marcus-iteration 943639a4). AC #3 och AC #6 STÅR KVAR OBOCKADE, se nedan.

AC #1 — HÖJDLÅSET SOM BETEENDE, mätt mot den PROMOVERADE ytan (inte mot prototypen). Nytt describe i tests/acceptance/hem.acceptance.test.ts, "Bevakningsraden — höjdlåset som beteende (TASK-303 AC #1)": fyra bredder (375 = smalaste stödda, 390, 768, 1280) x fem fall (kort namn + ensiffrigt, kort namn + tvåsiffrigt, 91-teckens värsta-fall-namn + tresiffrigt, 91-teckens namn + fyrsiffrigt, samt ej-skickad-lägets egen copy). BÅDA radtyperna mäts i varje fall. Utfall: exakt [70, 70] px i samtliga 20 mätpunkter, 4/4 tester gröna. Talet 70 är inte ett stickprov utan härlett ur explicita line-heights (24 + 2 + 18 + 24 + 2), därför asserteras det exakt och inte som intervall.

NEGATIVKONTROLL, kortets uttryckliga beviskrav, körd som eget test vid 375 px: höjden mäts till 70, därefter tas truncate bort från undertexten och innehållet förlängs i DOM:en — höjden mäts då till > 70. Mätinstrumentet kan alltså fälla. Grönt.

AC #2 — radanatomin är rubrikrad + undertext, alltid båda renderade, i den DELADE RadInnehall som båda radtyperna konsumerar. Samma form som personlistans radanatomi (ledande markör valfri, textblock, trailing-element med reserverad plats).

AC #4 — SYNKAD. Marcus S111 Del 5, verbatim: "jag vill ta bort siffer-pillen och sätta chevronen centrerat. Istället för siffer-pillen på bevakningsraden så vill jag att vi skriver ut *3 nya deltagare saknar deltagarinfo*, siffran ska alltså in i meningen." Meningen kortades därefter i samma pass, av utrymmesskäl han själv vägde (201 px behov mot 171 tillgängliga när tiden centreras): Del 5-tabellen bokför den godkända formen som "eventinfo-raden bär 3 nya saknar deltagarinfo", och godkännandet är "Ser bra ut. Jag godkänner bevakningsraden och åtgärdskö-raden nu." Båda ytorna bär nu den strängen: src/components/hem/hem-derivations.ts och src/components/dev/hem-prototyp/data.ts. De tre varianterna är därmed EN. Testerna som asserterade den gamla strängen är uppdaterade (hem.acceptance + svep-eventinfo-send.acceptance).

AC #5 — familjegränsen orörd: ingen varningsfärg, ingen notis-ikon. Markören är Link2Off i en cirkel med --mm-atgardsko-markor-bg/-text (alias mot knappens primärpar), inte bg-warning/text-warning/TriangleAlert. Icke-färg-kanalen är ikonformen, och markören är aria-hidden så betydelsen bärs av rubrik + undertext. axe 0 mätt med båda radtyperna på samma sida.

AC #3 KAN INTE BOCKAS ÄRLIGT — och det är inte ett utförandefel utan samma klass som det redan strukna badge-kriteriet. Kriteriet lyder "Ingen text klipps mitt i ett ord i något läge (Gunilla-principen håller)". Den godkända anatomin bär truncate på RUBRIKEN, så ett 91-teckens eventnamn klipps med ellipsis. Det är den avvägning kortets egen beskrivning kallar olöslig ("TRE KRAV SOM INTE KAN HÅLLA SAMTIDIGT"). Vad som HÅLLER, mätt: hela namnet finns kvar i DOM:en (klippningen är visuell, skärmläsaren får hela strängen), och UNDERTEXTEN — meningen — klipps aldrig (scrollWidth <= clientWidth, asserterat i hem.acceptance). Kriteriet behöver alltså AMENDERAS eller STRYKAS med Marcus ord, precis som AC #3 i den gamla numreringen. Denna agent tar inte det beslutet.

AC #6 (hem-facit) EJ RÖRD — ägs av orkestreraren, egen commit efter promoveringen.

REGRESSIONEN SOM ORDBYTET LÄMNADE ÄR LÖST. Mätt på basen 943639a4 före promoveringen: hem.acceptance 28 passed / 1 failed, där felet var geometribeviset vid 1440 px (Expected <= 48, Received 72). Efter promoveringen: 32 passed / 0 failed. Det gamla geometribeviset är ersatt av höjdlåset ovan, eftersom line-clamp-2 — mekanismen det mätte — är riven.
<!-- SECTION:NOTES:END -->
