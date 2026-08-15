---
id: TASK-214.4
title: >-
  Skiva: Flippen — D blir den ovillkorliga formen, A/B/C rivs,
  test-konsument-svepet
status: Done
assignee: []
created_date: '2026-08-14 19:17'
updated_date: '2026-08-15 00:11'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.3
parent_task_id: TASK-214
ordinal: 405000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Formvillkoret flippas per ADR-103 B2 steg 1: D-formen blir den ovillkorliga på närvaro-routen, A/B/C rivs i samma landning (persondetalj-precedenten — stämpeln skyddar D, inte alternativen), och alla test-konsumenter av ytan sveps och uppdateras i samma skiva. Växlaren och railen står kvar till rivningsskivan (ADR-102 B3). Täcker användarberättelser: 1, 6, 7, 11, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Utan variant-parameter renderar närvaro-routen dörrlistan (D-formen) — variant-villkoret för D är borta och läs-datavägarna är orörda (samma query-nycklar och DI)
- [x] #2 Varianterna A/B/C är rivna ur prototypfilen — den stämplade D-formen är orörd; det som rivs är villkor och förkastade alternativ, aldrig form
- [x] #3 ariaSnapshot EFTER flippen är identisk med referenserna FÖRE (B4-paret grönt)
- [x] #4 Dörrlistan är identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' efter flippen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [x] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [x] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [x] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FLIPPEN: narvaro.tsx renderar CheckinPrototyp ovillkorligt, UTANFOR DEV-grinden
(routens egen useQueryState/CheckinProtoVariant-lasning riven — kompilatorn
pekade ut den som dod). PrototypeSwitcher/CHECKIN_PROTO_VARIANTS star kvar
(ADR-102 B3), krympt till EN post ('Dorrlistan - promoverad', steg/stegLabel
OFORANDRADE — foljer persondetalj-precedentens dc0eb4ec-form). Switcherns EGEN
interna useQueryState('variant') ar den lasning som lever kvar.

A/B/C-RIVNINGEN (CheckinPrototyp.tsx, 897 rader netto): VariantA/B/C +
useDorrLage, Raknare, Framsteg, TillbakaLank, SessionsRad, DorrRad,
SenastListan, AvbokadeNot, statusKort, ALLA_STATUSAR, CheckinProtoVariant-typen
— samtliga utpekade av tsc/biome (TS6133/TS6192), ingen gissad. D:s egen kod
(VariantD, byggRaderD, useDorrLageD, FramstegskortD, DorrRadD, SessionsRadD,
initialerD, useSessionsval, byggRader/useDorrData) ORORD.

TEST-KONSUMENT-SVEPET (grep over narvaro-routen/EventAttendance/
CheckinPrototyp/varianterna, alla traffar uppdaterade i denna skiva):
- tests/acceptance/event-narvaro.acceptance.test.ts — PARKERAD (describe.skip),
  EventAttendance ar onabar via routen; rivs TILLSAMMANS med
  EventAttendance.tsx i TASK-214.7 (person-note-edit.acceptance.test.ts-
  precedenten, commit f3c25520).
- tests/api/mutation-hemvist-vakt.test.ts — negativkontrollens kommentar
  rattad: citerade en rad (useDorrLage-STUB) som nu ar riven; testlogiken
  ORORD (fristaende regex-fixture, kravde ingen live rad).
- src/components/persons/PersonsList.tsx — en radnummer-citat
  (CheckinPrototyp.tsx:233-244) pekade pa fel kod redan fore denna skiva
  och skulle blivit annu mer fel efter rivningen; andrad till en
  sok-baserad referens (FramstegskortD + "Breddlaset") som inte driver.
- tests/visual/dorrlista-promoverings-grind.spec.ts +
  tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts — INGA
  andringar (navigerar via ?variant=d, som fortsatt renderar D oforandrat);
  bada korda om och gront efter flippen.
- EventAttendance.tsx, EventRegistrations.tsx, Waitlist.tsx, Atgarder.tsx,
  Narvaro.tsx (detalj), AtgardsSida.tsx, attendance.ts, index.ts — traffade i
  svepet men INGEN andring: citaten/kommentarerna dar beskriver ANNAT
  (delad a11y-monster, orelaterad breddlas-instans i D, "flippen" = den
  lokala optimistiska UI-flippen i useDorrLageD, inte promoverings-flippen).

BEVIS: ariaSnapshot-paret 12/12 gront tva ganger, __aria__/-referenserna
ORORDA (git status tomt bade fore och efter). Skarmdump av den promoverade
ytan (temporar testfil, borttagen efter korning) visuellt jamford mot
facit.json-bilderna slutlage-{desktop,mobil}.png — strukturellt/visuellt
identiskt, enda skillnaden ar fixturdata (4 vs 16 personer) och railens
antal chips (1 vs 4 — vantat, registret kromp med avsikt). test:api 750/750,
acceptance-sviten for rorda filer grona, typecheck/biome/build EXIT=0.

RÄTTELSE (samma session, efter CI-fynd på PR #1306): CI:s Acceptance-jobb
fällde hermetik-sjalvtestets tvåsidiga bevis — scripts/hermetik-sjalvtest.mjs
har INGEN skip-ventil med avsikt (varje test i acceptance-klassen ska
bevisbart hänga på fixturvärlden; ett hoppat test bevisar inget och räknas
som drift). Parkering (describe.skip) av event-narvaro.acceptance.test.ts
var alltså fel form — strukturellt otillåtet i denna svit, till skillnad
från persondetalj-precedentens person-note-edit.acceptance.test.ts (annan
testklass utan detta självtest-krav).

ÅTGÄRD: filen RADERAD helt (git rm), inte parkerad. Verifierat FÖRE
raderingen att samtliga sju tester hade samma subjekt (EventAttendance via
routen, plain page.goto utan ?variant=) — inget test hade ett annat
subjekt, så hela filen kunde raderas utan att tappa täckning av något
oberoende.

EventAttendance.tsx SJÄLV rörs INTE (ADR-102 B3 skyddar prototyp-formen
till TASK-214.7 — men skyddar inte den ersatta ytans DÖDA TESTER, som är
skillnaden mot ADR-102 B3-resonemanget jag drog fel första gången).

Verifierat: npm run test:acceptance (full svit) 229/229 EXIT=0 (en
isolerad flake i mer-aktivitetshistorik-filter.acceptance.test.ts vid
parallell last, omkörd och grön, bekräftat orelaterad — filen rör
Aktivitetshistorik, delar ingen fil med denna diff) · test:acceptance:
sjalvtest 229 tester/229 fällda/229 med OmockadRequestError, 0 avvikelser
· hermetik-sjalvtest.mjs --negativ-kontroll EXIT=0 ("NEGATIV KONTROLL
GRÖN") — 2 fällda/0 med OmockadRequestError UTAN self-test-flaggan, vilket
BEVISAR att skriptet kan detektera drift (den positiva och negativa
kontrollen pekar åt motsatta håll, som avsett) · typecheck/biome/build
EXIT=0 efter raderingen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad av bygg-agent (Sonnet) 2026-08-14/15, PR #1306, merge 26b1e724 via kön. Två varv: flippen c198d2fb (D ovillkorlig på närvaro-routen; A/B/C + exklusiva hjälpare rivna, 897 rader netto; routens dubblerade variant-läsning riven som död kod per dc0eb4ec-precedenten; konsument-svep med bilagd träffyta; ariaSnapshot 12/12 två gånger, referenser orörda; facit-jämförelse ren; AC 1-4 avbockade) + hermetik-fixen b66711f5/def534c0 (CI:s hermetik-självtest fällde de describe.skip-parkerade event-narvaro-testerna — självtestet har INGEN skip-ventil med avsikt; filen raderad efter subjekt-bekräftelse [7/7 tester hade den ersatta ytan som subjekt], EventAttendance.tsx orörd; självtest 229/229 noll avvikelser + negativ kontroll grön). Grindar: typecheck 0, biome 0, build 0, test:api 750/750, langa-streck 0, mailto 0, acceptans 229/229. Premiss-divergenser bokförda: worktree bakom vid start (ff:ad), CheckinPrototyp-radnummer ~144 rader fel i uppdraget. TASK-215-flaken observerad ÄNNU EN GÅNG (instans 2) i agentens fulla svit — bokförd på fyndkortet. Stängd efter landningsverifikat. DÖRRLISTAN ÄR NU DEN SKARPA FORMEN.
<!-- SECTION:FINAL_SUMMARY:END -->
