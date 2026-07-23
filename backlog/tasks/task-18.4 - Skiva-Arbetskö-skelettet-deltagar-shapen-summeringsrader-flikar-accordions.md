---
id: TASK-18.4
title: >-
  Skiva: Arbetskö-skelettet (deltagar-shapen + summeringsrader + flikar +
  accordions)
status: Done
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-23 12:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
  - TASK-17.1
parent_task_id: TASK-18
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Anmälda deltagare-kortet får arbetsköns skelett ände-till-ände: deltagar-shapen utökas (Inskickad med klockslag, de tre skickad-tidsstämplarna, antal genomförda event, medföljande-kopplingen), fyra klickbara summeringsrader i Lottas utskicksordning med filter + Rensa filtret, kategori-flikar i kapsel-primitiven, Obekräftade-gruppen äldst först öppen och Bekräftade senast först stängd som accordions, och eventinfo-signalens slot (dags-att-skicka-badgen härledd ur tvåveckorsgränsen) alltid reserverad och placerad UTANFÖR den interaktiva raden (L303). Språket Obekräftad/Bekräftad exakt per basens Status-ord. Täcker användarberättelser: 12, 13 samt 18-visningen (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Deltagar-shape-utökningen kontraktstestad i api-sviten
- [x] #2 Summeringsradernas klickfilter och accordion-grupperingen bevisade i e2e; ordningen äldst-först respektive senast-först verifierad
- [x] #3 Signal-slotten renderar per facit i båda lägena (badge respektive tom reserv) utan geometri-hopp
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (task/18.4)

### Snittet
Arbetskö-SKELETTET: deltagar-shapens utökning (server + domän) + fyra klickbara
summeringsrader i Lottas utskicksordning + kategori-flikar i kapsel-primitiven +
Obekräftade/Bekräftade som accordions + eventinfo-signalens alltid reserverade
slot. Ny komponent `src/components/events/detail/Deltagare.tsx` ersätter 18.1:s
interim-länk till den gamla anmälda-vyn i EventDetail.

### Deltagar-shapen (5 additiva LÄS-fält, additivt-optional)
`kalla` · `medfoljandeTill` · `bekraftelseSkickad` · `deltagarinfoSkickad` ·
`antalGenomfordaEvent`. Ny konstant `RegistrationSource` (Manuell/+1/Väntelista;
TOM = via formulär) i Status.ts. Schema + modell + paritetsfilen (via typecheck)
i samma commit. INGA nya bas-fält — samtliga FANNS redan; fält-existensen
LIVE-verifierad mot staging-schemat 2026-07-22 (L294) FÖRE mappningen:
Källa fldwk2sl7CkBv9epw · Medföljande till fld39KEXJxyulXfsN · Bekräftelse
skickad fld0jnbkIbuFAumgG · Deltagarinfo skickad fld3WBS0QQrqLpYtK ·
Personer.Antal genomförda event flddy8JND3YnlgZxe. Ingen allowlist-post
(18.4 är en ren LÄS-skiva) — DoD #7 därmed uppfyllt utan bas-schemaändring.

### Person-batchen (FAS-direktivet)
`Antal genomförda event` bor på PERSONER → get-registrations gör en ANDRA
chunkad `OR(RECORD_ID()=…)`-batch (get-person-mallen, ceil(N/50) anrop, ALDRIG
ett per person) med fält-projektion. **Medveten asymmetri, öppet bokförd i
EF:ens doc:** batchen körs ENDAST i eventId-grenen. Den event-lösa grenen
hämtar hela basens anmälningar (Hem-vyn/anmälningslistan) — en person-batch där
vore O(hela basen) läsanrop per request utan konsument. Där är fältet null;
nyckeln finns alltid i shapen.

### Semantik-beslut (öppet bokförda)
- **Gruppering på `Status`, inte tidsstämpeln** (ORDLISTA + S73 K53). Raden
  "Anmälningsbekräftelse skickad" läser däremot `Bekräftelse skickad`: raden är
  en UTSKICKS-logg, gruppen är anmälans TILLSTÅND. Divergens visas som den är.
  ORDLISTA-posten Obekräftad/Bekräftad preciserad + ny post **Eventinfo**
  (UI-ordet vs basens `Deltagarinfo skickad`).
- **Avbokade/ombokade räknas bort överallt** (`arAktiv`, samma basformel-
  disciplin som 18.8:s Betalningar). Facit/prototypen saknade avbokad-modell.
- **Källa 'Väntelista' klumpas INTE ihop med formulär-normen** — egen pill
  "Från väntelistan". Tyst hopslagning vore en osanning; flikarna är oförändrat
  Alla/Manuella/Medföljande per K41.
- **Bor över-raden ingår INTE** — bas-fältet föds i 18.7; en rad som alltid
  visar 0 vore en osanning. Personkorten (18.5) och hantera-flödet (18.6) växer
  in i samma skelett; deltagaren renderas här som namn-rad med pillar.

### Staging-fixtur (PERMANENT, additiv, ADR-063/ADR-050)
Nytt event `ZZ-arbetsko-fixtur` (`recZyRIzbqWSifAQO`, EventKey Event-845) +
4 anmälningar + person `ZZ-Arbetsko Person 01` (`rec7F8jYc7rczwwkM`) med EN
Deltagande-rad → `Antal genomförda event` = 1. EGET event så 18.2:s
BELAGGNING_EXPECTED står orört. Beskriven i `tests/api/fixtures.ts`
(ARBETSKO_EVENT_ID/ARBETSKO_EXPECTED). PROD ORÖRD.
**Fångst under seedingen:** första försöket länkade fixtur-anmälan till
18.2/get-person:s `ZZ-History Person 01` — Personer.`Ort`-rollupen växte då
till `['ZZ-Skövde','ZZ-Göteborg',null]` och hade riskerat get-person-testets
`toHaveLength(2)`. Länken backades omedelbart, rollupen verifierad återställd,
och en EGEN person seedades i stället. Andras fixtur-invarianter orörda.

### EF-deploy
get-registrations deployad till STAGING (`--project-ref pqtshyierkdgwdnxuirz`,
T34-disciplinen: explicit ref). PROD ej deployad — separat Marcus-auktoriserad
handling. **Prod-deploy-not:** EF:en läser bara befintliga fält och tål en bas
utan dem (`?? null`) — ingen hård prod-förutsättning à la fälla 37.

### Bevis
- **api (AC #1):** 4 nya kontraktstester — nyckel-närvaro (aldrig undefined) ·
  Källa-mappningen TOM→null/Manuell/+1 · tidsstämplar + self-link (och null när
  osatta) · antalGenomfordaEvent number-vs-null (person-batchens skarpa bevis;
  en `?? 0`-genväg hade fällt det). RÖTT observerat före deploy (4 failed /
  5 passed), GRÖNT efter (9/9). Hela api-sviten 317/317.
- **e2e (AC #2/#3):** ny svit `tests/e2e/event-deltagare.staging.test.ts`, 8
  tester, mockad route (18.1/18.8-precedenten). RÖTT observerat mekaniskt med
  EventDetail-inkopplingen tillfälligt bortstashad (8 failed), GRÖNT efter
  (9/9 inkl. setup). Hela e2e-sviten 220 passed / 3 skipped / 0 failed.
- **Defekt fångad RÖTT-FÖRST (AC #3):** signal-slottens `min-h-7` (28 px) växte
  till 29 px när badgen tändes → 1 px geometri-hopp. Mekaniskt fångat i
  boundingBox-mätningen, läkt till `min-h-8` (32 px i BÅDA lägena).
- **Renderad facit-verifiering (L245/L246):** 390×844-skärmdumpar i grundläge,
  filtrerat läge och med båda accordions öppna + mätvärden: signal-badge
  "Dags att skicka — eventet är om 9 dagar" i warning-tonen rgb(163,73,28),
  slot 32 px · summeringsraderna i utskicksordning · flikräknarna · kö äldst
  först · arkiv senast först. Jämförd punkt för punkt mot
  FACIT-eventsidan-helsida.png (inkl. att "Medföljande (1)" radbryter i
  flikkapseln även i facit).
- **Övriga grindar:** typecheck 0 · biome 0 · build grön · a11y 62/62 ·
  vale 0 errors · markdownlint 0 issues.

### Rörd fil i annan skivas testyta
`tests/e2e/event-detail.staging.test.ts` (18.1:s svit): testet
'interim-sektionerna behåller funktionen' asserterade 'Öppna anmälda-vyn'-länken
som denna skiva river. Uppdaterad till `toHaveCount(0)` med samma formulering
som 18.8 använde när betalnings-vyns länk revs. Filen ligger i kortets yta.

### e2e-körformen
Kortets instruktion sa att e2e inte kan köras lokalt (5173-låset). Vägen runt
UTAN att röra Marcus dev-server: egen dev-server på port **5188** +
`PLAYWRIGHT_TEST_BASE_URL` (hoppar över webServer-blocket). Sviten är helt
route-mockad, så staging-CORS aldrig i spel. Därmed är e2e-beviset LOKALT
observerat, inte bara PR-CI-buret — RÖD-fasen inkluderad. Port 5173 orörd.

## Post-CI-bokföring (merge-agenten, 2026-07-22)

Mergad till main som merge-commit `431233e` (PR #81, merge-commit ALLTID —
aldrig squash, SHA-beviset bevaras).

**PR-CI run 29945860514** — grön per jobb, fil-läst: Detect changed files ·
Lint + Audit + TypeCheck · Staging sentinel purge · Docs link check ·
Test + Build · CI Passed or Skipped (6/6 success).
**main-CI run 29946401652** på `431233e` — grön per jobb, samma sex jobb (6/6).

**e2e-beviset uttryckligen (pr-ci-bevisformen):** `E2E tests (staging)` inne i
Test + Build: 220 passed / 3 skipped / 0 failed i BÅDA runnen.
Test-count-delta mot main-baseline (run 29938873266 @ 4560c4d):
api staging 128 → 132 (+4 kontraktstester, AC #1) · e2e 212 → 220 passed
(+8 tester, AC #2/#3) · api pure 185 oförändrat · a11y 62/62 oförändrat.
Deltat matchar kortets bevisrader exakt.

**Claims-kvitto:** 12/12 ändrade filer inom kortets deklarerade yta —
noll fil utanför. `src/routeTree.gen.ts` ej committad (gitignorad, korrekt).
`tasks/lessons.md` och `docs/reference/data-model.md` orörda.
Merge-tree-grinden mot färsk main gav exit 0 (ingen konflikt, inget
upplösnings-mandat behövde användas).

**DoD #3 bockad** — bevis är CI-runnen ovan.

**GRANSKNINGSFÄRDIG — väntar design-review (Marcus).** Kortet står kvar
In Progress: DoD #5 (design-review mot S73-facit i webbläsaren) är öppen och
kan bara bockas av Marcus. Ingen final-summary skriven, status ej satt Done.
Commit-SHA att granska: `431233e` (branch-head `231f504`).

**Merge-agentens observation (blockerar inte, ej åtgärdad):** ORDLISTA-posten
**Eventinfo** lades mellan `Lugnt laddläge` och `Obekräftad/Bekräftad`. Den
sektionen är inte strikt alfabetisk redan på main (Mina sidor → Lugnt laddläge),
så placeringen följer omgivningen snarare än FAS-direktivets alfabet-regel.
Hunken är egen och orsakade ingen merge-friktion; noteras öppet i stället för
att tyst omsorteras (omsortering är uttryckligen förbjuden under batchen).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Arbetskö-skelettet (deltagar-shapen + summeringsrader + flikar + accordions) levererat i S75-batchen (CI grön per jobb). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (omgransknings-protokollet Yta 3, granskad mot arbetsko-fixturen recZyRIzbqWSifAQO: flikarna Alla 4 / Manuella 1 / Medföljande 1 / Obekräftade 3). DoD #5 bockad; alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
