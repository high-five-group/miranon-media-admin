---
id: TASK-303
title: >-
  Fynd: bevakningsradens höjd varierar med copyns längd — anatomi i stället för
  radbrytning
status: To Do
assignee: []
created_date: '2026-08-22 21:48'
updated_date: '2026-08-22 23:25'
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
- [ ] #1 Bevakningsradens höjd är konstant oavsett copyns längd och oavsett antalet siffror i talet — verifierat som BETEENDE i test, inte som påstående, vid smalaste stödda bredd
- [ ] #2 Radanatomin är rubrikrad + undertext, alltid båda renderade, samma form som personlistans radanatomi
- [ ] #3 Talet som varierar bärs av en badge med reserverad plats, inte inbakat i meningen
- [ ] #4 Ingen text klipps mitt i ett ord i något läge (Gunilla-principen håller)
- [ ] #5 Sträng-divergensen mellan hem-derivations.ts och dev/hem-prototyp/data.ts är avgjord åt ETT håll, med Marcus citat daterat på kortet, och båda ytorna bär samma sträng efteråt
- [ ] #6 Familjegränsen mot notisfamiljen orörd: ingen varningsfärg, ingen notis-ikon; betydelse aldrig enbart genom färg
- [ ] #7 Hem-facit amenderat i egen commit med Marcus citat, EFTER att formen är godkänd
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
<!-- SECTION:NOTES:END -->
