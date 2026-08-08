---
id: TASK-162.4
title: 'Skiva: Härdning + bokföringssynk'
status: To Do
assignee: []
created_date: '2026-08-08 07:43'
updated_date: '2026-08-08 18:08'
labels:
  - ready-for-agent
dependencies:
  - TASK-162.2
  - TASK-162.3
parent_task_id: TASK-162
ordinal: 304000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Härdningen efter flipparna (T6-kraven ur ADR-103): tillgänglighetsbeviset på promoverade ytor, bokföringssynken av korten som promoveringsordningen omdefinierar, och död-kod-kontrollen efter de borttagna grenarna. Täcker användarberättelser: 12 (förberedelsen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Axe-pass på de promoverade ytorna: 0 violations — nivå 11 består
- [x] #2 DoD-posten om visual-baslinjen på TASK-145.3 och TASK-145.5 omskriven via CLI till: baslinje omtagen EFTER godkänd promovering
- [x] #3 TASK-145.6 omdefinierad via CLI per ADR-103: riv flaggan/variant-maskineriet efter godkänd promovering + dra regressionslåsets baslinje; fortsatt blocked
- [x] #4 Död-kod-koll efter flipparna: inga föräldralösa exporter ur de borttagna grenarna (mätt och bokfört i skivans PR)
- [ ] #5 Samtliga sviter gröna
- [x] #6 TASK-145.5 AC #1-kravtexten omskriven via CLI per Marcus 1A-beslut (Bor över-krysset står kvar): texten ska säga vad den menar i stället för "inga muterande kryssrutor" rakt av
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-162.4 — Härdning + bokföringssynk (ADR-103).

PREMISS-PASS (ADR-086), UTFÖRT FÖRE DESIGN
- `git fetch origin` kört först; origin/main bekräftad vid d256bfa3 (matchar uppdragets angivna SHA exakt — TASK-162.2/162.3 Done, mergade c64b16ec/a53195de).
- ADR-103 läst i sin helhet, TASK-145.3/145.5/145.6 lästa direkt via `backlog task <id> --plain` (inte antaget ur uppdragstexten) — bekräftade exakt DoD #6-lydelsen som skulle bytas ut, och att 145.5 AC #1 stod okryssad med en redan komplett men ordagrant motsägande motivering.
- EventDetail.tsx:287–289 verifierat rad-för-rad mot uppdragets citat (`<CheckInKort .../><AtgarderKort /><SkrivUtKort />`) — stämde exakt. Deltagare.tsx `data-testid="register-yta"` bekräftad.
- "Repot har en A11y-svit (axe-runner-jobbet)" verifierad mot ci-suite.yml — sant, men ADR-045 gör jobbet DEV-route-bundet (/dev/primitives, /dev/patterns) och det kan strukturellt INTE nå eventsidan. Uppdragets "kör dess lokala motsvarighet" tolkad bokstavligt: eftersom ingen körbar motsvarighet fanns byggdes en (se AC #1 nedan) i stället för att anta att befintlig infrastruktur räckte.
- "Staging-e2e kan INTE köras lokalt (5173-förbudet)" — INTE bara citerad: bekräftad KONKRET när `npm run test:api` stoppades av staging-preflight.ts:s mutex mitt i byggpasset (nightly.yml run 31270626838, in_progress, mätt 2026-08-08 18:03 UTC) — se § EJ KLARAD.
- Inga blockerande divergenser. En hanterad, icke-blockerande skillnad: axe-runner-jobbet kan inte nå eventsidan (bokfört ovan/AC #1). TASK-145.6:s tidigare kända "104 förekomster"-talsdivergens (redan bokförd av tidigare agent i kortets egna notes) lämnad ORÖRD — utanför mitt mandat att korrigera ett tal jag inte blivit ombedd att räkna om.

RÖRDA FILER
- backlog/tasks/task-145.3 …: DoD #6 omskriven (AC #2).
- backlog/tasks/task-145.5 …: DoD #6 omskriven (AC #2); AC #1 omskriven + checkad, DoD #1 checkad i samma pass (AC #6).
- backlog/tasks/task-145.6 …: Description omskriven ("riv prototypen" → "riv flaggan/variant-maskineriet EFTER godkänd promovering, TASK-162.5"), DoD #6 omskriven, append-notes med varning till framtida utförare om att § EXEKVERINGSKARTAN delvis föregår TASK-162.2/162.3:s landade promovering (AC #3). Label "blocked" och dependencies-fältet ORÖRDA — "fortsatt blocked" hålls som prosa/label, ingen ny cross-PRD-beroendekant lades till (STOPPA-vid-scope-tvekan: inte efterfrågat av uppdraget).
- backlog/tasks/task-162.4 …: detta kort — AC #6 tillagd (uppdragets item 5), AC/DoD checkade i takt med utfört arbete.
- tests/visual/eventsida-promoverings-grind.spec.ts: ny describe-svit "TASK-162.4 — axe-pass på de promoverade ytorna" — fem axe-scanningar (åtgärds-korten + registret i fyra lägen), samma gotoPromoverad-helper och lokatorer som den befintliga ariaSnapshot-grinden (AC #1).
- tests/e2e/event-deltagare.staging.test.ts: docblocket rad ~746–757 omskrivet från "ÖPPEN FRÅGA TILL MARCUS, EJ AVGJORD HÄR" till "BESLUTET" — refererar Marcus 1A-beslutet i stället för att ställa frågan (uppdragets item 5, "om du rör den filen"; jag rörde den för samma sak AC #6 gäller).

AC-UTFALL, MÄTT
- AC #1 (axe-pass 0 violations): 26/26 gröna (npm run test:visual, visual-desktop + visual-mobile, EXIT=0) — AtgarderKort+SkrivUtKort och registret (default/aktivt filter/Bor över/noll träffar). TVÅSIDIGT bevisat: injicerade en accessible-name-lös <button type="button" /> i AtgarderKort → RÖD ([critical] button-name: Buttons must have discernible text, exit 1) → reverterad (git diff tomt, bekräftat) → 26/26 GRÖNA igen. Detta ÄR den lokala motsvarigheten till axe-runner-jobbet för en yta jobbet självt inte når (DEV-guardat).
- AC #2: TASK-145.3/145.5 DoD #6 → "Baslinje omtagen EFTER godkänd promovering (ADR-103 B4)", verifierat via backlog task <id> --plain.
- AC #3: TASK-145.6 omdefinierad (Description + DoD #6 + varnande append-note) per ADR-103 Konsekvenser; kortet förblir "blocked".
- AC #4 (död-kod-koll): Atgarder.tsx bär endast CheckInKort/AtgarderKort/SkrivUtKort (gamla Atgarder-komponenten helt riven av 162.2, inget kvarlämnat spöke). Deltagare.tsx: FlikNyckel-typen och RensaFiltretKnapp-funktionen helt borttagna (endast kommentarer nämner dem) — ingen orphan. ToggleButtonGroup-importen riven ur Deltagare.tsx, men primitiven själv lever vidare (EventsList.tsx, CheckinPrototyp.tsx, dev/primitives.tsx) — inte orphanad. kategori()/DeltagarKategori/KATEGORI_PILL fortsatt konsumerade (kort-pillen, orört av flik-rivningen) — alive. hallplats-steg-prototyp.ts: vagInTest/VAG_IN_LABEL/VagInFilter/TOMT_REGISTER_FILTER/RegisterFilter/REGISTER_STEG_LABEL alla konsumerade av DeltagareHallplatsPrototyp.tsx/Deltagare.tsx. DeltagareHallplatsPrototyp.tsx: HallplatsMarke/HallplatsToppA/RegisterFilterRad konsumerade av Deltagare.tsx; HallplatsRad konsumerad INTERNT av HallplatsToppA i samma fil. npx @biomejs/biome check på samtliga sex berörda filer: 0 fixes, rent. EN känd vestige HITTAD men UTANFÖR scope: Betalningar/BetalningsInnehall (Betalningar.tsx) — orphanad av TASK-145.4, redan dokumenterad i EventDetail.tsx:321–326 och explicit "Utanför omfattningen" i PRD TASK-145 ("Skarpa betalningsvyns kvarvarande kod utanför det som flyttar") — mätt och bokfört här, INTE riven (uppdraget: "riv bara det 162.2/162.3-flipparna själva lämnade föräldralöst").
- AC #5: se § EJ KLARAD.
- AC #6: TASK-145.5 AC #1 omskriven till att uttryckligen undanta Bor över-krysset (Marcus 1A-beslut, S93 Del 3, 2026-08-07) i stället för att motsäga sig själv ("inga muterande kryssrutor" rakt av). Checkad tillsammans med DoD #1 på samma kort — de underliggande mätningarna var redan kompletta i 145.5:s egna notes (§ "AC #1 — OKRYSSAD…"), bara texten var fel. Testfilens motsvarande docblock synkad (se § RÖRDA FILER).

QA-INPUT BOKFÖRD (item 6, ingen kodändring)
Registrets Visa-dropdown bär valt värde i sitt tillgängliga namn ("Väntar på bekräftelse Visa") — observation ur #1000-arbetet. Facit-låst per ADR-103 tills QA: tas upp av Marcus i TASK-162.5 eller en framtida yta-iteration, INTE åtgärdat här.

EJ KLARAD, MOTIVERAD
- AC #5 (samtliga sviter gröna): DoD-kvartetten körd och grön LOKALT — npm run typecheck EXIT=0, npx @biomejs/biome check . (hela repot) EXIT=0 (404 filer, 6 pre-existerande varningar/27 infos, INGEN av mina filer), npm run build EXIT=0, npm run test:api:pure 271/271 gröna EXIT=0. npm run test:api (fulla, med api-setup/api-staging) BLOCKERAD av staging-preflight-mutexen mitt i byggpasset (nightly.yml run 31270626838, in_progress vid mätning) — en legitim resurskonflikt, inte ett kodfel; ingen av mina ändringar rör API-lagret. .staging.test.ts-sviterna (inklusive event-deltagare.staging.test.ts, som jag rörde med en kommentar-ändring) kräver chromium-authenticated/riktig staging-inloggning och kan INTE köras lokalt (5173-förbudet) — post-merge-nätet äger den signalen. npm run test:visual (den nya axe-sviten OVANPÅ befintliga ariaSnapshot-par) kördes lokalt: 26/26 gröna, EXIT=0, tvåsidigt bevisad (se AC #1). AC #5 lämnas därför OKRYSSAT enligt uppdraget — bokfört öppet, inte gissat grönt.
- DoD #1 (samtliga AC avbockade): väntar på AC #5.
- DoD #3 (CI grön per jobb): ägs av orkestrerarens svep efter push, per uppdraget.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
