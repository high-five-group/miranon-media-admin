---
id: TASK-172
title: >-
  Bindestrecks-svepet scope A: långa streck ersätts med korta i UI-strängar i
  src/ + mekanisk grind
status: Done
assignee: []
created_date: '2026-08-09 08:08'
updated_date: '2026-08-10 04:13'
labels:
  - ready-for-agent
dependencies: []
ordinal: 315000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-09 (S93-resumen, ur S100:s blockerande fråga; S100 sessionsdok § PAUSLÄGE fjärde pausen + § Del 7): scope A — UI-strängar i hela src/, det Lotta och Marcus ser i appen. Marcus ord: 'Ta bort alla långa bindestreck överallt, jag gillar de korta bindestrecken (-)'. Långa streck (tankstreck — och en-dash –) i användar-synlig text ersätts med kort bindestreck (-) eller omformuleras. Kodkommentarer (scope B) och dokumentation (scope C) ingår INTE — C avråddes som svep (docs-typografin är etablerad stil; ev. rivning är ett redaktionellt beslut av BYGGPLAN-LÄTTLÄST-klassen). Följdbeslut samma dag: commit-meddelanden/sessionsdok behåller etablerad form; tom-markören '—' (symbol för inget värde, t.ex. 'Ämne: —' i AtgardsSida) BEHÅLLS och undantas explicit. Grinden: mekanisk vakt som fäller NYA långa streck i UI-strängar — att skilja strängliteral/JSX-text från kommentarer kräver AST-läsning, implementationsvalet är utförarens (research först: finns etablerad lint-regel/plugin innan egen byggs); värden (undantagslistan: tom-markören m.fl.) bor i config-fil per CLAUDE.md-regeln om config-drivna grindvakter. SEKVENS-VILLKOR mot task-171: åtgärds-/granskningsytans filer (AtgardsSida.tsx + dess routes) är redan kortstreckade i synlig text (S100 varv 23); ändrar svepet ändå dem måste det ske FÖRE promoverings-PRD:ns referenstagning eller EFTER rivningen — aldrig mitt i kedjan, ariaSnapshot-referenserna fäller på varje textskillnad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Inga långa streck (— eller –) i användar-synliga strängar i src/, utom config-listade undantag (tom-markören)
- [x] #2 Mekanisk grind fäller nya förekomster — tvåsidigt bevis: seedat fel fälls, ren kod passerar
- [x] #3 Undantagen bor i config-fil, inte hårdkodade i skriptet
- [x] #4 Sekvens-villkoret mot task-171:s referenser efterlevt och bokfört i notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sekvens-villkor (AC #4): task-171-kedjan Done + riven (PR #1046, 54e3ff36) FORE detta svep - verifierat, ingen mitt-i-kedjan-risk.

AC #1 DELVIS, ej avbockad. Traffyta (AST, @babel/parser): 93 rentat forekomster. 73 ersatta. 9 KEEP (tom-markoren, namngiven exception). 12 REST (NYA fil-scopade exceptions utover tom-markoren) - eventsida-/event-lista-las: Atgarder.tsx, Betalningar.tsx, DatumFalt.tsx, Deltagare.tsx(4), DetaljGrupp.tsx, Gruppdynamik.tsx, Narvaro.tsx, datumSpann.ts(3), EventCard.tsx. Se .langa-streck-policy.json for rationale per post. AC #1 kan inte bockas arligt eftersom fler an tom-markoren undantas - REST kraver ny iteration + Marcus-godkannande (ADR-104 beslut 4).

UPPTACKT: datumSpann.ts rad 4-8 dokumenterar ett aldre Marcus-direktiv (tatt tankstreck for datumspann, svensk skrivregel) som KAN sta i konflikt mot task-172s blankettinstruktion. Filen ligger i REST och rordes ej - konflikten olost, flaggad for nasta iteration.

Obesläktat, ej fixat (scope creep): verify:ci-parity:fast visade tva pre-existing roda poster - biome.json $schema 2.5.4 vs CLI 2.5.5, och markdownlint MD004 i tasks/sessions/archive/2026-08/2026-08-02-session-93.md:2259. Ingen fil rord av detta kort.

CI-FYND (2026-08-09, samma dag, PR #1055 run 31316595089): Acceptance-hermetisk fallde tests/acceptance/anmalan-detalj.acceptance.test.ts rad 371 - testet asserterar datumspannet med en-dash (10 augusti 2026 EN-DASH 12 augusti 2026) i AnmalanDetail.tsx-s Avser-block (Datum-raden). Forsta passets sweep konverterade den raden till kort bindestreck utan att kanna igen den som en datumspann-yta (klassad bara som eventsida-lokal narrativ, inte som samma typografiklass som datumSpann.ts). Detta ar EXAKT den datumspann-konflikt jag sjalv flaggade som olost i forsta rapporten - nu SKARPT bekraftad av CI, inte bara en teoretisk risk.

Atgard: AnmalanDetail.tsx rad 423 ATERSTALLD till en-dash. EventsCalendar.tsx rad 74-75 (samma semantiska monster - kalenderns datumspann-header) ATERSTALLD i SAMMA svep, konservativt, aven om CI inte fallde pa den (inget lokalt korbart test tacker den). Bada tillagda som REST-undantag i .langa-streck-policy.json, samma klass som datumSpann.ts - vantar ett explicit Marcus-beslut om datumspann-typografin innan NAGON av de tre filerna ändras at nagot hall.

Lardom for min egen verify:ci-parity:fast-rationale: den taeckte CI-STEGENS struktur (mina tva nya steg), men INTE sjalva strang-andringarnas Acceptance-yta - Acceptance skippades medvetet i --fast-laget. En strang-sweep av detta slag borde ha kort mot Acceptance innan push, inte bara mot test:api+test:visual. Bokfort har for framtida liknande svep.

Lokalt verifierat efter fix: tests/acceptance/anmalan-detalj.acceptance.test.ts direkt (6/6 passed), typecheck 0, biome check 0, build gront, test:api 465 passed, test:visual 160 passed, check-langa-streck.mjs 0 ofangade (174 filer, 14 fil-undantag nu), test-check-langa-streck.mjs 16/16.

CI-FYND #2 (2026-08-09, run 31317280866, samma commit 462113a7): Acceptance fallde pa FEM specs (inte de tva jag forst antog) - fullstandig logg last (881 rader, gh run view --log-failed):

1. mer-intresserade.acceptance.test.ts:177 - getByText(Namnlos person EM-DASH namnlos@example.se) - klass (b)
2. mer-segment.acceptance.test.ts:174 - getByRole(radiogroup, name: Resor i medvetandet EM-DASH fristaende forelasning...) - klass (b), FALLA-35-etiketten, samma sträng som tests/api/segment-taxonomy.test.ts (redan fixad i forsta passet, men acceptance-tvillingen missad)
3. mer-segment.acceptance.test.ts:215 (assertion rad 225-226) - getByText(0 personer matchar EM-DASH inga med genomford narvaro annu.) - klass (b)
4. mer-segment.acceptance.test.ts:308 (assertion rad 320-321) - SAMMA strang som #3, annan test - klass (b)
5. person-detail.acceptance.test.ts:173 (assertion rad 178-179) - getByRole(heading, name: Namnlos person EM-DASH anna@example.test) - klass (b)

Ingen av de fem ar datumspann (klass a) - alla ar separator-/etikett-UI-text som Marcus scope A-beslut tacker. Kod-andringen (kort bindestreck) BEHALLEN, alla fem assertions uppdaterade till kort bindestreck. Testens EGNA test()-namnstrangar (dokumentation, ej assertions) lamnades ORORDA med avsikt - de citerar bara den gamla texten som beskrivning, paverkar inget mekaniskt.

SYSTEMATISKT SVEP (direktiv): AST-skannade tests/acceptance/ (samma check-langa-streck.mjs-motor, tom policy) - 97 rentat traffar. Genomgangna en och en: cirka 75 ar test-namn/describe-strangar (dokumentation, aldrig assertion - lamnas), ~15 ar FIXTUR-data (mockade personnamn/kursnamn som RIM 1 EM-DASH Skovde, ORORD - representerar verklig data, inte nagon strang jag svepte i src/), och de fem ovan var de enda FAKTISKA assertion-traffarna som matchar en strang jag konverterat.

TREDJE TACKNINGSLUCKAN (samma leverans): forsta passet svepte tests/api + tests/visual (via ac lokala korningar) men INTE tests/acceptance/ - en hel testyta missad tills CI sjalv fallde den. Detta ar samma rotorsak som datumspann-missen (CI-fynd #1): mitt eget verify:ci-parity:fast-rationale tackte CI-STEGENS struktur men aldrig KONSEKVENSERNA av sjalva strang-andringarna over alla konsument-ytor. Larr for framtida strang-svep: identifiera ALLA testkonsument-ytor (api, acceptance, visual, e2e) INNAN sista push, inte iterativt efter varje CI-rod.

Lokalt verifierat: HELA acceptance-sviten (npx playwright test --project=acceptance) - forsta korningen 176/177 (1 fallande, ISOLERAT verifierad som OBESLAKTAD pre-existing lokal flake: hem.acceptance.test.ts dagar-kvar-pillen, passerade i isolerad korning, ror ingen fil i min diff, sannolikt 8-worker-resurskonkurrens); ANDRA fulla korningen 177/177 rent. Plus typecheck 0, biome check 0 (aven efter en självorsakad regression av import-ordningen i check-langa-streck.mjs - rattad, biome stabil), build gront, test:api 465 passed, check-langa-streck.mjs 0 ofangade, self-test 16/16.

MARCUS-BESLUT 2026-08-09 (S93, vid paus 10): 'Nej det funkar inte. ALLA 15 långa bindestreck i användarsynlig text MÅSTE bort.' — REST-undantagen kvitteras INTE som permanenta; datumspann-frågan är därmed också AVGJORD (korta streck vinner även i datumspann; det äldre tätt-tankstreck-direktivet i datumSpann.ts rivs öppet). SCHEMALAGT SOM NÄSTA RESUMES HUVUDSPÅR: (1) ändra alla 15 REST-strängar till korta streck, (2) synka ALLA test-konsumenter i samma pass (api/acceptance/visual — inkl. anmalan-detalj.acceptance rad 371 som asserterar en-dash-spannet), (3) referens-/baseline-omtagning för berörda facit-låsta ytor + Marcus omgodkännande-stämpling via !-kanalen (ny iteration per ADR-104 beslut 4, --ersatt-flaggan), (4) töm fil-undantagen ur .langa-streck-policy.json så endast tom-markörens 9 KEEP återstår, (5) därefter bockas AC #1 och kortet Done-flippas. Tom-markören '—' (9 st) FÖRBLIR undantagen — Marcus namngivna symbol för inget värde.

FEMSTEGSPLANEN UTFÖRD (2026-08-09, S93 resume 10, agent-worktree agent-a325d5ad5ec85e8b6):

PREMISS-DIVERGENS (ADR-086): policyfilens _readme och kortets tidigare notes pastod "15 REST-strängar i 11 filer". Provat mot disk med tom REST-policy + skriptets egen AST-korning: FAKTISKT 17 raw-forekomster i 11 filer (EventCard.tsx:237, EventsCalendar.tsx:74+75, Atgarder.tsx:188 [2 em-dash i samma JSXText], Betalningar.tsx:611, DatumFalt.tsx:52, Deltagare.tsx:251+252+253+591, DetaljGrupp.tsx:114, Gruppdynamik.tsx:62, Narvaro.tsx:194, datumSpann.ts:28+31+32, AnmalanDetail.tsx:423). Filantalet (11) stammer - forekomst-antalet gjorde det inte. Bokfort har per ADR-086, byggde INTE vidare pa "15"-talet.

STEG 1 (strängarna): samtliga 17 forekomster andrade till kort bindestreck (-). datumSpann.ts rad 4-8-kommentaren (det aldre "tatt tankstreck, svenska skrivregler"-direktivet) riven oppet och ersatt med kallhanvisad text till MARCUS-BESLUTET 2026-08-09 (denna notes-sektion).

STEG 2 (test-konsumenter, SAMMA pass): systematiskt AST/grep-svep over api+acceptance+visual+e2e EFTER varje sträng-andring, INNAN push (larr fran forra passets CI-fynd). 9 verkliga assertion-traffar fixade: tests/acceptance/events-list-kalender.acceptance.test.ts:365 (kalenderspann), tests/acceptance/anmalan-detalj.acceptance.test.ts:371 (kant fran forra CI-fyndet), tests/acceptance/event-ny-anmalan.acceptance.test.ts:385+586 (tva datumspann-assertions - missade av forsta filsokningen, fangade av en bred sakerhetsnats-grep i andra passet), tests/e2e/event-detail.staging.test.ts:240+258+323+596+599 (datumspann x3 + Atgarder-platshallare x2), tests/e2e/mark-paid.staging.test.ts:533 (Betalningar-platshallare). Testens EGNA test()-namnstrangar och kommentarer lamnades ORORDA med avsikt (dokumentation, ej assertion - samma etablerade princip som forra passet). Fixtur-data ("Resenär steg 1-2" i event-detail.staging.test.ts, "eventlabel"-falt) rord EJ - representerar verklig data, ej en sträng jag svepte i src/.

STEG 3 (referens-/baseline-omtagning): eventsida-promoverings-grind.spec.ts + atgardssida-promoverings-grind.spec.ts (ariaSnapshot-laset, ADR-103 B4) korda lokalt EFTER strang-andringarna - samtliga GRONA ORORDA (de andrade strangarna forekom inte i de incheckade .aria.yml-referenserna alls, verifierat med grep fore andring). Ingen lokal ariaSnapshot-regenerering behovdes. Pixel-baseline (toHaveScreenshot, CI-only per policyns _readme): npm run test:visual lokalt gav 148 passed + 12 failed - samtliga 12 ar "-darwin.png saknas, skriver actual" pa en FARSK worktree (linux.png-filerna ar de enda git-sparade, darwin ar .gitignore-rad 105, personliga lokala jamforelsebaslinjer som en ny worktree aldrig ärver). Bekraftat strukturellt, ej diff-orsakat: timestamp pa linux.png = worktree-checkout (20:06), darwin.png = just denna testkorning (20:26). 148+12=160, exakt kortets egna "160 vid forra passet"-tal. De 6 incheckade linux.png-baslinjerna (hem/event-lista/event-anmalda/eventsida/mer-anmalningar/personer) ar nu STALE mot ny text men INGEN PR-gate lases mot dem (grep over .github/workflows/*.yml: npm run test:visual anropas ENDAST i visual-baselines.yml, workflow_dispatch, aldrig i ci.yml/ci-suite.yml) - de sjalvlaker automatiskt nasta gang visual-baselines.yml dispatchas (oppnar en granskningsbar baseline-PR per befintlig mekanism, ingen sarskild atgard kravs av detta kort.

Marcus omgodkannande-stämpling (ADR-104 beslut 4, ny iteration): Atgarder.tsx, Betalningar.tsx, Deltagare.tsx, Gruppdynamik.tsx ar samtliga "kallor" i tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json (godkand redan satt, icke-null). Andringen ar en medveten andring av en godkand promoverad yta - kräver nytt godkannande per beslut 4. check-facit.sh bar INGEN staleness-grind (verifierat i skriptets kallkod: den lasererar bara "ar faltet null" for B3-sparren, aldrig SHA-match) - CI fäller INTE pa detta, men principen kravs anda. Kommando Marcus kor sjalv via !-kanalen:
npm run facit:godkann -- --pass s93-hallplats-prototyp --citat "<Marcus eget citat efter granskning>" --ersatt
DatumFalt.tsx/DetaljGrupp.tsx/Narvaro.tsx/EventCard.tsx/EventsCalendar.tsx/AnmalanDetail.tsx ar INTE "kallor" i nagot facit-manifest (grep-verifierat over samtliga tasks/sessions/bilagor/*/facit.json) - inget omgodkannande kravs for dem.

STEG 4 (policy-tomning): .langa-streck-policy.json fil-value-undantagen tomda helt (0 kvar, var 14 poster tackande 17 forekomster). Endast tom-markorens ("—") globala undantag kvarstar. _readme omskriven till att beskriva det nya laget, kallhanvisar MARCUS-BESLUTET.

STEG 5 (kortet): AC #1 bockad denna commit. Done-flippen INTE utford - orkestreraren stanger kortet efter CI-verifiering per do-work-kadensen.

GRINDAR (samtliga korda i FORGRUNDEN i denna session, exitkod last separat fran $?/pipe): check-langa-streck.mjs exit 0 (174 filer skannade, 0 ofangade, 1 globalt undantag, 0 fil-undantag). test-check-langa-streck.mjs exit 0 (16/16). typecheck exit 0. biome check exit 0 (0 fel - 6 pre-existing warnings + 27 pre-existing infos ORORDA, ingen fil jag andrat). build exit 0. test:api exit 0 (465 passed). test:acceptance (med RATT env-flagga PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 - se PREMISS-DIVERGENS nedan) exit 1 bada fulla korningarna (176/177 bagge gangerna), samma kanda pre-existing flake som forra passet (hem.acceptance.test.ts:476 dagar-kvar-pillen) - ISOLERAT verifierad 1/1 gron, ror ingen fil i denna diff. check-facit.sh exit 0 (2 manifest, 8 ytor, 0 ogodkanda).

PREMISS-DIVERGENS #2: uppdragets exakta verifieringskommando "npx playwright test --project=acceptance" (utan PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1) misslyckas hart - webServer-konfigurationen faller da tillbaka pa E2E_DEV_PORT (5173, portlast for staging-CORS), inte den dedikerade acceptance-porten, och gav "port already in use". package.json:s egen test:acceptance-script bar env-flaggan; anvande den korrekta formen i stallet (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance), vilket motsvarar npm run test:acceptance.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fullbordad i två leveranser: forsta passet PR #1055 (73 ersatta + AST-grinden check-langa-streck + policy + tvasidig testsvit 16/16) och 15-strecks-rundan PR #1064 (merge 90ce4477): alla 17 kvarvarande REST-forekomster till korta streck, datumSpann-direktivet rivet oppet, 9 assertion-konsumenter synkade over acceptance+e2e, policyn tomd till tom-markorens globala undantag (9 KEEP). Marcus omgodkannande-stampling via !-kanalen 2026-08-10: av/datum/citat/sha i manifestet, sha e25efd05 = granskade tradet (forsta stampeln bar fel trad f7360100 — resolveMainSha laser lokala main-refen; omstamplad efter ref-synk, lesson-kandidat bokford). AC #1-#4 betalda; DoD #2 agentens grindtabell (typecheck/biome/build/test:api 465/acceptance 177/visual 148+12 darwin-artefakt/check-langa-streck 0), #3 kon + grona jobb pa 90ce4477, #4 diffen = 11 REST-filer + 5 testfiler + policy + kortet.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
