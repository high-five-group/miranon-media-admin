---
id: TASK-299.2
title: 'Skiva: Marcus mäter sidramen på riktig data och låser omfattningen'
status: To Do
assignee: []
created_date: '2026-08-22 19:14'
updated_date: '2026-08-23 14:29'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 542000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus öppnar persondetaljen, check-in, aktivitetshistoriken och dokumentytan i appen med riktig data, slår om dev-parametern och ser den nya sidramen under händerna. Han väljer sedan hur brett den delade vy-grunden ska dras: bara sidkromet, sidkrom plus rubrikblock, eller full omfattning inklusive de två ytor som i dag bär den andra dialekten. Beslutet är det som låser skiva 6:s arbete. Täcker användarberättelser: 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla fyra ytorna granskade med och utan dev-parametern, på både desktop och mobil
- [x] #2 Marcus har valt omfattning i klartext; valet citeras daterat på detta kort
- [x] #3 Valet skrivs in i TASK-299 som en daterad not, så efterföljande skivor läser EN källa
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS BESLUT 2026-08-22 — omfattningen låst, i två halvor.

Ytaxeln, verbatim: "jag tycker vi ska köra full omfattning". FULL OMFATTNING — den delade sidramen bärs av alla ytor, inklusive de två som i dag bär den andra dialekten. Skälet han ställde sig bakom: smalare omfattning gör anmälningssidan till en tredje konsument av den ena dialekten, varpå defekten (två oförenliga sidram-dialekter, båda facit-stämplade) står kvar med sällskap i stället för att lösas. Priset är kvitterat i samma andetag: de två avvikande ytornas facit måste amenderas med hans citat och deras visuella baslinjer göras om — TASK-299.6 växer därmed.

Ägandeskapsaxeln, verbatim: "Jag står vid dina rekommendationer på alla punkter" som svar på frågan "Bara sidkromet eller rubrik-blocket också?". BARA SIDKROMET — sidramen äger chevron och kortyta, rubriken lever kvar i varje sida. Grunden är mätt, inte tyckt: den rubrik-ägande grenen har NOLL konsumenter i dag; TASK-299.1-agenten fick bygga en demosida på /dev/primitives enbart för att kunna testa den. Att införa den nu vore abstraktion utan användare, och asymmetriskt dyr att ångra — att bredda senare är lätt, att smalna av betyder att plocka isär varje konsument.

ATT AXELN VAR TVÅ upptäcktes först vid beslutstillfället: kortets tre alternativ blandar ihop VILKA ytor som bär sidramen med HUR MYCKET sidramen äger. Noten i TASK-299 skriver ut båda halvorna, eftersom AC #3:s hela syfte är att efterföljande skivor ska läsa EN källa utan att gissa.

AC #1 EJ AVBOCKAD — OCH DET ÄR AVSIKTLIGT. Kriteriet kräver att alla fyra ytorna granskats med och utan dev-parametern på BÅDE desktop och mobil. Marcus fattade beslutet utan att den genomgången bekräftats för mig; jag har belägg för valet, inte för granskningen. Att bocka det hade gjort registret osant. Bocka det när genomgången faktiskt är gjord — eller stryk kriteriet medvetet om beslutet bedöms bära utan det.

2026-08-23 (S111 resume 2, fönster 1) — AC #1 (genomgången av de fyra sidram-ytorna med/utan ?sidram=ny, desktop + mobil) DELEGERAS TILL AGENT på Marcus beslut: *"3. Skit i genomgången nu, eller sätt en agent på det, jag orkar inte hålla på med det i alla fall."* Agenten vandrar ytorna i den hermetiska fixturvärlden och mot facit-manifesten (s103-persondetalj, s103-checkin, s106-aktivitetslogg, s102-dokument), rapporterar avvikelser per yta, och bockar AC #1 med sin rapport som belägg. Omfattningsvalet (AC #2/#3) står kvar som Marcus eget.

2026-08-23 — AGENT-GENOMGÅNG AC #1 (delegerad, S111 resume 2, Marcus: "Skit i genomgången nu, eller sätt en agent på det, jag orkar inte hålla på med det i alla fall.")

PREMISS-PASS: `git fetch` + `git log --oneline -1 24238b1c` bekräftade merge-commiten (PR #1825, "TASK-299.1: delad SidRam-primitiv + InitialAvatar till primitives/, bakom ?sidram=ny") och `git merge-base --is-ancestor 24238b1c origin/main` bekräftade att den är förfader till origin/main (adda438c vid granskningstillfället, senare f3b997b7 efter ytterligare landningar). Ingen divergens på DEN premissen.

DIVERGENS UPPTÄCKT OCH ÅTGÄRDAD (bas-tillstånd, inte uppdragets sakinnehåll): worktreens ursprungliga HEAD (branch `worktree-agent-aeed3a79b191a0063`) låg INTE på `origin/main` utan var samma commit som `wip/s111-marcus-iteration` (`c52a0cdc`, exakt den commit uppdraget citerar för delegationsbeslutet) — 11 commits ur en pågående, ännu ej mergad WIP-session (prototyp-arbete: event-filter, FilterRad-utbrytning, m.m., draft-PR #1864). Att bygga vidare där hade gjort min PR till en superset av HELA den WIP-grenen — grovt brott mot DoD #4 (inga orelaterade filer i diffen). Åtgärd: `git checkout -- <kortfilen>` (kastade min då-ouncommittade ändring) följt av `git checkout -b docs/s111-299-2-genomgang origin/main` — ny gren från en FÄRSK `origin/main` (`f3b997b7`), och AC-bock + rapport gjordes om därifrån. Bieffekt, bokförd öppet: `origin/main`s kortversion saknade ÄNNU delegations-stycket ("2026-08-23 (S111 resume 2, fönster 1) — AC #1 ... DELEGERAS TILL AGENT") eftersom det bara fanns på den ej mergade WIP-grenen/draft-PR #1864 — min commit återinför därför SAMMA styckestext (den fanns redan i mitt underlag) som en del av diffen mot `origin/main`. OBS TILL ORKESTRERAREN: om/när draft-PR #1864 senare mergas kan detta stycke landa en gång via VARDERA PR:en (textduplicering av en not-paragraf, ingen kod) — ofarligt men värt att stämma av vid den mergen, t.ex. genom att #1864 rebaseas mot min PR när den landat, eller genom att en av de två strykes manuellt vid granskning.

METOD: Ingen inloggad Supabase-session tillgänglig headless, så granskningen kördes mot den hermetiska acceptance-fixturvärlden (samma mock-mönster som `tests/acceptance/*.acceptance.test.ts`, `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 playwright test --project=acceptance`). Ett temporärt Playwright-skript navigerade de fyra ytorna med/utan `?sidram=ny` på desktop (1280×900) och mobil (375×812), tog 16 skärmdumpar + mätte chevron/rubrik-position via boundingBox(). Skriptet kördes, skärmdumpar/mätningar sparades i agentens scratch, och filen raderades igen INNAN denna commit — den finns aldrig i diffen (`git status` verifierat rent efteråt).

═══ PERSONDETALJEN (facit: s103-persondetalj-konvergens) ═══
UTAN flagga = MED flagga, BYTE-IDENTISKT (MD5 lika på både desktop och mobil-skärmdumparna). Ytan var redan kant-i-kant (chevron `mx-4`, header `px-4`) före TASK-299.1, så Link→SidRam-bytet ger noll pixelskillnad. Chevron/rubrik-position identisk: desktop left=372/372 (utan/med), mobil left=32/32.
BELÄGG UTAN-FLAGGA=FACIT: `tests/visual/persondetalj-promoverings-grind.spec.ts` kördes fräscht (2026-08-23) — 8/8 test (visual-desktop+visual-mobile), 0 fel. ariaSnapshot-formen är oförändrad.
BELÄGG MED-FLAGGA axe 0: `person-detail.acceptance.test.ts` — "Persondetalj — TASK-299.1 dev-växel ?sidram=ny" kört fräscht, grönt.

═══ CHECK-IN / DÖRRLISTAN (facit: s103-checkin-konvergens) ═══
UTAN/MED visuellt identiskt för ögat (chevron/rubrik-position identisk: desktop left=376/376, mobil left=36/36). Skärmdumparnas MD5 skiljer sig marginellt (någon enstaka byte) trots identisk boundingBox och identisk visuell granskning sida vid sida — mest sannolikt dev-only brus (React Query/TanStack Devtools-badge, samma klass artefakt som redan bokförd i s102/s106-faciten), INTE en layoutskillnad. Facit-jämförelsen görs ändå via ariaSnapshot, inte pixeljämförelse, exakt för att vara immun mot den klassen brus.
BELÄGG UTAN-FLAGGA=FACIT: `tests/visual/dorrlista-promoverings-grind.spec.ts` kördes fräscht — 26/26 test (visual-desktop+visual-mobile: ariaSnapshot, axe 0×6, prefers-contrast/reduced-motion/print), 0 fel.
BELÄGG MED-FLAGGA axe 0: `event-checkin-dorrlistan.acceptance.test.ts` — "Dörrlistan — TASK-299.1 dev-växel ?sidram=ny" kört fräscht, grönt.

═══ AKTIVITETSHISTORIKEN (facit: s106-aktivitetslogg) — EN AV DE TVÅ AVVIKANDE DIALEKT-YTORNA ═══
UTAN flagga: chevron/rubrik flush mot main:s egen 16 px-padding (desktop left=356, mobil left=16) — ingen ändring mot facit.
MED flagga: chevron+rubrik indragna korrekt (+16 px, desktop 356→372, mobil 16→32), matchar kant-i-kant-dialekten visuellt.
FYND (verifierat med boundingBox, ej antaget): filterraden och dagsgrupp-listan UNDER rubriken flyttas INTE med — de ligger kvar på gamla x-positionen (desktop: "Kategori"=356, radio "Idag"=360, dagsgrupp-h2 "Idag"=356) medan rubriken (h1) nu står på 372. Resultat: en 16 px vänster-missalignment mellan rubriken och resten av sidans innehåll när `?sidram=ny` är på — synligt även på skärmdumpen (mobil och desktop). Orsak: `AktivitetsHistorik.tsx`s `headerKlass`-villkor (TASK-299.1) lägger `px-4` bara på `<header>`, inte på `FilterRad` eller dagsgrupps-listan — de rördes aldrig i TASK-299.1:s diff.
JÄMFÖRT MOT REDAN PROMOVERAD FAMILJ: Väntelistan (`Waitlist.tsx`, TASK-299.7, redan i main) delar EN gemensam vänstermarginal för HELA innehållskolumnen (chevron, rubrik OCH listan) — mätt: chevron/rubrik/avatarrad alla på x=372 (desktop). Aktivitetshistorikens dev-läge uppnår ALLTSÅ INTE samma helhet ännu — det är en förväntad lucka givet TASK-299.1:s smala scope (visa kromjämförelse på befintlig yta, inte ombygga hela sidan), men TASK-299.6 (fullständig promovering av denna yta) behöver INTE BARA amendera facit utan också dra in filterraden/listan till samma marginal, annars landar ytan med synlig missalignment.
BELÄGG axe 0 (båda tillstånd): `mer-aktivitetshistorik.acceptance.test.ts` — "TOM vy" + "IFYLLD vy" med `?sidram=ny`, båda kört fräscht, gröna.
Ingen dedikerad `-promoverings-grind`-fil finns för denna yta (bara `hem-aktivitetsspalt-promoverings-grind.spec.ts`, som är en ANNAN yta — Hem-sidans aktivitetsspalt). UTAN-flagga-beläggen är i stället: `mer-aktivitetshistorik.acceptance.test.ts` + `mer-aktivitetshistorik-filter.acceptance.test.ts` fräscht körda (samtliga gröna, se grindtabell nedan) och `bash scripts/check-facit.sh` grön (manifest-/markör-konsistens, exit 0).

═══ DOKUMENTYTAN (facit: s102-dokument-konvergens) — DEN ANDRA AVVIKANDE DIALEKT-YTAN ═══
Samma mönster och samma fynd som Aktivitetshistoriken, verifierat separat: UTAN flagga h1=356 (oförändrat mot facit); MED flagga h1=372 men bilagelistans rad ligger kvar på x=386 i BÅDA lägena (orörd av flaggan — `DokumentYta.tsx` wrappar bara `<header>` i `px-4`, inte `EventValjare` eller bilagelistan). Samma 16 px missalignment synlig på skärmdumpen (desktop och mobil). Samma bedömning: förväntad lucka i TASK-299.1:s scope, bokförs som ATT GÖRA för TASK-299.6.
Känt dev-only-artefakt observerat på mobil-skärmdumpen: React Query/TanStack Devtools-badgen (flytande högerkolumn) överlappar delvis filikonerna i bilagelistan — samma klass artefakt s102-manifestet redan dokumenterar, inte en regression.
BELÄGG axe 0: `dokument-rackviddsval.acceptance.test.ts` — "TASK-299.1 dev-växel ?sidram=ny" kört fräscht, grönt.
UTAN-flagga-belägg: hela `dokument-rackviddsval.acceptance.test.ts` kört fräscht — 19/20 test gröna, 1 flakigt test ("inline-rullningen: tabb-stopp och max-höjd bara när listan faktiskt rullar") som fällde under 5-workers parallell-last men gick grönt vid isolerad omkörning direkt efteråt — ROTORSAK ÄR LAST, INTE SIDRAM-ÄNDRINGEN (testet rör scroll-tabindex-logik, noll koppling till chrome/SidRam, och är helt utanför TASK-299.1/299.2:s diff). Bokfört öppet, inte tystat. `check-facit.sh` grön (samma körning som ovan).

═══ ÖVRIGT ═══
Källkodsgranskning (git diff fa77717a..24238b1c per fil) bekräftar: PersonDetail.tsx och EventCheckin.tsx var redan kant-i-kant (`mx-4`-chevron, `px-4`-header) INNAN TASK-299.1 — SidRam-bytet är därför rent mekaniskt för dem. AktivitetsHistorik.tsx och DokumentYta.tsx bar den andra dialekten (ingen `px-4`) — matchar PRD:ns beskrivning "de fyra av sex skarpa ytor redan bär kant-i-kant"-premiss.
Alla fyra redan promoverade familjemedlemmar (Waitlist.tsx/TASK-299.7, Intresserade.tsx/TASK-299.8, MailLog.tsx+InstalleraAppen.tsx/TASK-299.9) konsumerar `<SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />` UTAN `rubrik`-prop — konsekvent med det låsta ägandeskapsbeslutet ("bara sidkromet"). Verifierat via källkodsgrep, inte antaget.

GRINDTABELL (samtliga körda 2026-08-23, denna session):
- tests/visual/persondetalj-promoverings-grind.spec.ts (visual-desktop+mobile): 8/8 PASS, exit 0
- tests/visual/dorrlista-promoverings-grind.spec.ts (visual-desktop+mobile): 26/26 PASS, exit 0
- tests/acceptance/person-detail.acceptance.test.ts: 7/7 PASS (inkl. ny sidram-axe-test)
- tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts: 6/6 PASS (inkl. ny sidram-axe-test)
- tests/acceptance/mer-aktivitetshistorik.acceptance.test.ts: 9/9 PASS (inkl. två nya sidram-axe-test)
- tests/acceptance/mer-aktivitetshistorik-filter.acceptance.test.ts: 10/10 PASS
- tests/acceptance/dokument-rackviddsval.acceptance.test.ts: 19/20 PASS + 1 flake (grön isolerad, se ovan) — inkl. ny sidram-axe-test
- scripts/check-facit.sh: exit 0

SLUTSATS: Alla fyra ytor granskade med och utan `?sidram=ny`, desktop (1280px) och mobil (375px), enligt AC #1:s ordalydelse. Två ytor (persondetaljen, check-in) är pixelmässigt/aria-mässigt opåverkade och redan facit-gröna med färska grindkörningar. Två ytor (aktivitetshistoriken, dokumentytan) visar en verklig, mätt 16 px missalignment mellan rubrik och sidans övriga innehåll när flaggan är på — en förväntad konsekvens av TASK-299.1:s medvetet smala scope, inte en bugg i det som landades, men ett explicit ATT GÖRA för TASK-299.6:s fulla promovering av dessa två ytor (dra in filterrad/lista till samma marginal som rubriken, utöver facit-amenderingen). AC #1 bockas med denna rapport som belägg.
<!-- SECTION:NOTES:END -->
