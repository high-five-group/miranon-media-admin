---
id: TASK-309.21
title: >-
  s102-dokument-konvergens stämplade facit avbildar inte längre den levande ytan
  — och ingen grind fäller
status: To Do
assignee: []
created_date: '2026-08-24 17:55'
updated_date: '2026-08-28 04:42'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 587000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avtäckt av skiva 9-agenten 2026-08-24.

tasks/sessions/bilagor/s102-dokument-konvergens/facit.json är STÄMPLAT (godkand satt, sha cc1d7c53, 2026-08-16) och avbildar dokument-ytan som den såg ut då. Ytan har sedan dess ändrats av minst: TASK-273.4 (b881fe64), sidram-promoveringen (AMENDERING-2026-08-23, väntar omstämpling), och bilagespårets promovering (TASK-309.8, 24c39777).

INGEN GRIND FÄLLDE. Orsaken är mekanisk: check-facit.sh invariant (d) — innehållslåset mot sha256 — gäller bara ytor som deklarerar en referenser-nyckel. Den ytan gör inte det. Manifestet är alltså strukturellt giltigt medan dess bilder är tre generationer gamla.

Det är samma klass som repot städat två gånger: ett facit vars tystnad läses som täckning. Skillnaden här är att tystnaden är BYGGD IN — invarianten kan inte se en yta som inte bett om att bli sedd.

ÖPPNA AMENDERINGAR I SAMMA KATALOG som väntar Marcus omstämpling (inventerade 2026-08-24):
  tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md
  tasks/sessions/bilagor/s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Avgjort: stämplas s102-dokument-konvergens om mot den levande ytan, eller pensioneras manifestet till förmån för s108-generering/s108-dokumentytan?
- [ ] #2 De tre öppna AMENDERING-filerna avgjorda — omstämplade eller stängda med skäl
- [x] #3 Klarlagt och bokfört hur många ytterligare stämplade ytor som saknar referenser-nyckel och därmed står utanför innehållslåset
- [x] #4 Avgjort om avsaknad av referenser-nyckel ska fortsätta vara tillåtet, eller om check-facit bör larma på det (ADR-102-fråga, Marcus)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UTREDNING LEVERERAD (docs-only, 2026-08-26): docs/research/facit-pensionering-s102-2026-08-26.md — fullt källmärkt underlag för alla fyra AC + Marcus morgonsekvens (exakta !-kommandon).

AC #1 (pensionera vs omstämpla s102): PREMISS PRÖVAD — s108-generering + s108-dokumentytan täcker INTE allt s102 täckte. Verkligt gap: ingen av de tre manifesten visar ett VALT events fullt filtrerbara dokumentlista med dagens ikonpar-Visa-beteende (s108-dokumentytan visar ikonparet men i räckviddsläget/inget-event-valt; s108-generering visar en annan vy, genereringsflödet). Gapet är redan bokfört av skiva 9 självt i s108-dokumentytan/facit.json:s "not"-fält ("SUPERSEDERAR INTE s102... Att avgöra vad som ska hända med s102:s bilder... är Marcus"). REKOMMENDATION: (a) pensionera ändå, gap explicit bokfört i ARKIVERAD.md + rekommendera ett separat uppföljningskort för den nya bilden. Omstämpling (b) avrådd: s102:s "Visa-overlay"-beskrivning avser en dialog-baserad förhandsvisning som är RIVEN ur koden (DokumentYta.tsx rad 75-87, [ERSATT TASK-273.4]) — --ersatt byter bara godkand-blocket, aldrig bilder/kallor/not (facit-godkann.mjs rad 187-212), så en omstämpling hade producerat ett färskt-daterat kvitto för en funktion som inte går att klicka fram i appen. Kräver Marcus/orkestrerarens beslut — EJ bockad.

AC #2 (tre AMENDERING-filer): s102/AMENDERING-2026-08-23-sidram-promovering.md blir MOOT om AC#1 = pensionera (hela katalogen arkivflyttas frusen, ingen restämpling behövs). s106-aktivitetslogg och s111-anmalningssidan-konvergens är HELT OBEROENDE av s102-beslutet, väntar bara på Marcus --ersatt-omstämpling (se research-filens exakta kommandon). Kräver Marcus-kanal — EJ bockad.

AC #3 (referenser-täckning): KLARLAGT OCH BOKFÖRT. 24 stämplade ytor (av 28 totalt, 15 manifest) saknar "referenser" — mätt två gånger identiskt (check-facit.sh exit 0-körning + oberoende node-räkning). Full lista manifest·yta i research-filen § 2. Bockad.

VIKTIG DIVERGENS MOT UPPDRAGET (ADR-086): uppdraget påstod "TASK-288 gjorde det för 22 ytor" som om backfillen redan utförts. FALSKT — TASK-288 Status: ○ To Do, samtliga 4 AC okryssade, aldrig utförd. Talet 22 var kortets EGET ögonblicksvärde 2026-08-22; kortets egen kommentar samma dag bokför redan drift till 24. Dagens 24 är "0 gjorda, talet har vandrat" — inte "22 gjorda + 2 nya".

AC #4 (ska check-facit larma på avsaknad av referenser?): REKOMMENDATION varna, fäll inte (retroaktivt) — se research-filen § 4 för fullt underlag (branschmönster Percy/Chromatic/BackstopJS/Storybook kräver INTE denna form; omedelbar fällning hade rödmålat main idag, 24/28; rotorsaken till att denna instans smög förbi är en ANNAN mekanism — check-facit jämför aldrig rendering mot bild, det gör den aldrig). ADR-102-beslut, Marcus — EJ bockad.

Se research-filen för fullständig källmärkning, citat och de exakta ! npm run facit:godkann-kommandona i ordning.

PREMISS-PASS-FYND (ADR-086, tillagt efter första notes-skrivningen): origin/main rörde sig 27 commits under detta pass (192bbd29 → 9d15fa0a), inklusive TASK-309.20 (515028c4) som redan fixat EN av de två 375px-formdefekter s108-generering ursprungligen flaggade öppet (räckviddslägets badge-overlapp — omtagen mobil-bild). Den ANDRA defekten (dokumentlistans radtrunkering i s108-generering/facit-dokumentlista-inaktuell-rad-mobil.png) är fortfarande INTE åtgärdad (bokfört öppet i TASK-309.20:s Final Summary). godkand/referenser/bilder-strukturen i båda s108-manifesten är OFÖRÄNDRAD av detta — AC#1/#2/#3-analysen i research-filen påverkas inte strukturellt, men detta är källmärkt i research-filens § 0 så morgonsekvensen körs mot aktuellt läge, inte det ursprungligen granskade. PR:en byggs mot färsk origin/main (9d15fa0a), inte mot worktreens ursprungliga bas.

AC #1 + #2 EXEKVERADE 2026-08-28 (TASK-309.29, gren docs/task-309-29-pensionera-s102-facit).

AC #1 (avgjort: pensionera vs omstämpla) — PENSIONERA, exekverat. Mandatet: Marcus i klartext 2026-08-26 (S108 resume 11, sessionsdok tasks/sessions/2026-08-20-session-108.md rad 3795: "Du har mandat att ta besluten. Men var noggrann och chansa inte, ta inget för givet. Var proffsig och gör saker ordentligt." → orkestrerarens beslut i samma anteckning: '309.21 pensionera s102-manifestet'). Formen blev ARKIVFLYTT, inte --ersatt: git mv av hela katalogen till tasks/sessions/archive/bilagor/s102-dokument-konvergens/ (nio filer, samtliga rena renames, sha256 byte-identiska före/efter — godkand-fältet aldrig rört). ARKIVERAD.md skriven i s55-formen med efterträdarna OCH gapet bokfört + pekare till TASK-309.32. Mätt effekt på grinden: check-facit.sh 15 manifest/30 ytor/24 referenslösa → 14/29/23, och s102-raden 'riven efter stämpeln cc1d7c53' är borta. Exit 0 före och efter.

AC #2 (de tre AMENDERING-filerna) — bockad enligt TASK-309.29:s uttryckliga instruktion ('TASK-309.21 AC #1 och #2 (s102-delen) bockas i denna skiva med hänvisning; s106/s111:s omstämplingar är Marcus (--ersatt), kvar öppna'). Vad som FAKTISKT gjordes per fil, så registret inte påstår mer än som skett:
  1. s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md — STÄNGD MED SKÄL: arkivflyttad frusen med manifestet; ingen omstämpling behövs eftersom manifestet inte lever vidare. Skälet står i ARKIVERAD.md § De tre AMENDERING-filerna.
  2. s102-dokument-konvergens/AMENDERING-2026-08-17-visa-till-ikonpar.md — samma (arkivflyttad frusen; dess avvikelse ÄR skälet till pensioneringen).
  3. s102-dokument-konvergens/AMENDERING-2026-08-17-rackviddsval-gemensamt-lage-badges.md — samma (arkivflyttad frusen).
KVARSTÅR HOS MARCUS, ej stängt av denna skiva: s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md och s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md väntar fortfarande på --ersatt-omstämpling av sina EGNA manifest (helt oberoende av s102-beslutet; exakta kommandon i docs/research/facit-pensionering-s102-2026-08-26.md § 6 steg 4-5). Kortets AC #2-ordalydelse ('de tre öppna AMENDERING-filerna') syftade på tre filer i TRE olika kataloger — bara den i s102-katalogen är avgjord här.

AC #4 AVGJORD OCH BOCKAD 2026-08-28 (TASK-309.31): "VARNA" valdes, fällning valdes bort. check-facit.sh namnger nu varje stämplad yta som saknar nyckeln "referenser" på stderr plus en summeringsrad "24 av 28 stämplade ytor saknar innehållslås"; exitkoden är oförändrad 0 i varje läge. Beslutet med sina fyra skäl bor i ADR-102 § Updates 2026-08-28 ("Täckningsluckan i invariant (d) NAMNGES, men fäller inte"), som citerar research-filens § 4-rekommendation ordagrant. Vägen till ett FÄLLANDE innehållslås är TASK-288:s backfill, inte en strängare grind i dag.

Kortet lämnas ÖPPET i övrigt: AC #1/#2 bockade av TASK-309.29 (se ovan); s106/s111-omstämplingarna kvarstår hos Marcus. (Rebase-sammanslagning 2026-08-28: #2031 landade före #2032, båda blocken behållna.)

Landningen för AC #4-beslutet: PR #2032 (gren feat/task-309-31-facit-tackningsvarning).

AC #2 URBOCKAD 2026-08-28 K-sista: bara s102:s AMENDERING-fil är avgjord (arkivflyttad, #2031); s106-aktivitetslogg och s111-anmalningssidan-konvergens väntar Marcus --ersatt-stämpling (docs/research/facit-pensionering-s102-2026-08-26.md § 6 steg 4-5) — bockas när stämplingarna är gjorda (review-runda 1 på #2031, warning). AC #1/#3/#4 står. Kortet öppet.
<!-- SECTION:NOTES:END -->
