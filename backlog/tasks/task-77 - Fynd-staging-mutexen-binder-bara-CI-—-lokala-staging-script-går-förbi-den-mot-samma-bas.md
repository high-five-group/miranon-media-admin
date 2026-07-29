---
id: TASK-77
title: >-
  Fynd: staging-mutexen binder bara CI — lokala staging-script går förbi den mot
  samma bas
status: To Do
assignee: []
created_date: '2026-07-28 23:39'
updated_date: '2026-07-29 10:25'
labels:
  - ready-for-agent
dependencies: []
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Concurrency-gruppen staging-tests serialiserar alla staging-rörande CI-körningar (PR mot PR, PR mot main-push, PR mot natt). Den binder INGENTING lokalt. En utvecklare eller agent som kör

  npm run test:api:staging
  npm run test:e2e:staging
  npm run vakt:kontrakt

träffar samma staging-bas (apphjj8Q7lkXCMsL4) utan att ta gruppen, samtidigt som ett CI-jobb håller den.

Verifierat 2026-07-29: strängen 'staging-tests' förekommer INTE i package.json och inte i scripts/*.mjs — den lever enbart som concurrency-nyckel i workflow-filerna. Det finns alltså ingen mekanism, bara en outtalad konvention.

### VARFÖR DET INTE RÄCKER MED EN REGEL

Fyndet kom ur TASK-70.3:s bygg-agent, som rapporterade det själv — TVÅ gånger under ETT pass:

1. npm run test:api:staging medan CI:s staging-jobb kördes
2. npm run test:e2e:staging + vakt:kontrakt under samma betingelse

Båda gångerna gick lokalt grönt och ingen skada skedde. Men agenten VISSTE om problemet vid tillfälle 2, efter att ha flaggat tillfälle 1. Det är det bärande argumentet: en agent med full kännedom om regeln bröt den ändå, i samma pass. En regel som inte efterlevs av den som känner till den är en regel som behöver en mekanism.

Samma slutsatsform som TASK-70.1 vilar på: landnings-ordningen var korrekt nedskriven sedan S81 och brast ändå två gånger under en resume, vilket gjorde merge queue till svaret.

### VARFÖR DET BLIR VÄRRE, INTE BÄTTRE

Riktningen i A7 är fler parallella agenter. Varje ny agent är en ny lokal körning som kan kollidera med CI. Efter TASK-70.3 flyttas dessutom staging till post-merge, vilket betyder att staging kör oftare utan att någon tittar — och en lokal körning som stör den ger en röd post-merge med tilldelat revert-ärende, inte bara ett rött lokalt test.

Angränsar TASK-76 (purge-racet) men är EN ANNAN mekanism: 76 handlar om två CI-jobb som konkurrerar, detta om CI mot lokalt. Fixen för 76 gör inte detta ofarligt.

### FORMER SOM SKA VÄGAS — ingen är vald

(a) Distribuerat lås i basen: lokala script tar en sentinel-post före körning och släpper efter. Fungerar över CI/lokal-gränsen men lägger en ny felkälla i testvägen, och ett kvarglömt lås blockerar alla.
(b) Preflight-varning: skriptet frågar gh om ett staging-jobb kör just nu och varnar eller vägrar. Billigt, kräver gh-auth lokalt, och är rådgivande om det inte fail-closar.
(c) Acceptera och dokumentera: skriv ned att lokala staging-körningar är på egen risk. FÖRKASTA denna om den väljs utan att först väga (a) och (b) — repot har precedent för att rådgivande lägen inte efterlevs (L321-klassen).

Rekommendationen ska motiveras mot alla tre, och det förkastade bära sitt skäl. Airtables P26/P27 (ingen per-run-isolering) är premissen och löses inte här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mekanismen fäller eller varnar när ett lokalt staging-script startas medan CI håller staging-tests — bevisat skarpt med en avsiktligt framkallad kollision
- [x] #2 Valet motiverat mot alla tre formerna (a/b/c) i PR:n; de förkastade bär sina skäl
- [x] #3 Mekanismen blockerar INTE en legitim lokal körning när CI är tyst — negativt self-test redovisat, annars byter vi en tyst risk mot en ständig broms
- [x] #4 Vägen förbi mekanismen är dokumenterad och medveten (en utvecklare måste kunna köra ändå när hen vet vad hen gör) — men den ska kräva ett aktivt val, inte vara default
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VÄGVAL: (b) preflight — FAIL-CLOSED, inte rådgivande. Mekanismen är ett nytt subkommando i den befintliga semaforen: `bash scripts/staging-semaphore.sh preflight <ägare>` frågar GitHubs körnings-API om ett staging-rörande jobb är igång/köat och fäller med exit 76. Wirad i Playwrights setup-projekt (tests/api/auth.setup.ts → api-staging + kontraktsvakt; tests/e2e/auth.setup.ts → chromium-authenticated). Värden i .staging-semaphore-policy.conf, testsvit scripts/test-staging-semaphore.sh (19 fall).

(a) DISTRIBUERAT LÅS I BASEN — FÖRKASTAD. Den kräver en gemensam sanningskälla och att BÅDA sidor tar/släpper låset, alltså en ändring i ci-suite.yml + varje lokal väg. Tre skäl: (1) det är ett arkitektur-val, inte en avgränsad rättning — ägs av Marcus, inte av detta kort; (2) ett kvarglömt lås blockerar allt, och en trasig städning i testvägen är en ny felkälla i just det led som ska bevisa att systemet fungerar; (3) den lägger skrivningar i den bas den skyddar, mot Airtables P26/P27-vägg (samma bas, ingen per-run-isolering). Riktningen ägs redan av T85 våg 3.

(c) ACCEPTERA OCH DOKUMENTERA — FÖRKASTAD, och kortets eget skäl står: repot har precedent för att rådgivande lägen inte efterlevs. Fyndet ÄR det beviset — TASK-70.3:s agent kände till regeln vid tillfälle 2 och bröt den ändå. En rad till i CONTRIBUTING hade lagt en femte regel ovanpå en fjärde som inte höll.

LÄGET OMMÄTT 2026-07-29, inte ärvt från kortskrivningen: ci.yml skickar `run_staging: false` VILLKORSLÖST (rad 829), så PR-grinden tar inte mutexen alls. Bärarna är post-merge.yml och nightly.yml. Preflighten pekar därför på de två — med lift-villkor skrivet i conf-filen om ci.yml åter börjar köra staging.

PRECISION FRAMFÖR RUN-NIVÅ (AC#3): jobb-nivå, inte körnings-nivå. En docs-landning ärver D0 och ger `completed/skipped` på svit-raden (verifierat mot körning 30440662509) — den fäller inte. Run-nivå hade blockerat lokalt arbete vid VARJE landning, vilket är den ständiga broms AC#3 varnar för. Anropar-raden räknas dock som hållare tills den är completed: innan reusable-jobben expanderats finns bara den raden, och att läsa den frånvaron som grönt ljus vore L322-klassen.

ÄRLIG GRÄNS, skriven i CONTRIBUTING: preflighten är en kontroll vid START, inte ett hållet lås. En CI-körning som startar EFTER din lokala start fångas inte. Fönstret krymper kraftigt men stängs inte — det kräver (a). Två ytor bär medvetet inte mekanismen: purge:staging och seed:review (egna Node-script) samt test:preview:staging (inget setup-projekt); de har manuell preflight dokumenterad.

BEVIS. Skarpt, mot ÄKTA CI: körning 30443445340 (post-merge) med `Staging sentinel purge` queued→in_progress medan `npm run test:api:staging` startades → NPM_EXIT=1, "172 did not run", noll begäran mot staging. Sonden ensam mot körning 30442315955 med `Staging (API + E2E)` in_progress → exit 76; samma körning completed → exit 0. Negativt självtest (AC#3): npm run test:api med CI tyst → 419 passed, exit 0, hela vägen genom preflighten. Förbi-vägen (AC#4) i identiska betingelser: utan flagga exit 1, med MM_STAGING_PREFLIGHT=off exit 0. Testsviten 19/19; mutationsprov i båda riktningar — nästlad namnmatchning borttagen ⇒ 3 fall faller, fail-closed→fail-open ⇒ 2 fall faller.

RÖRD YTA UTANFÖR KORTET, öppet: .github/workflows/ci.yml rad ~690 — shellcheck-grindens scope räknar upp sourcade conf-filer en och en, och ADR-033 § Del 3 säger att en conf utanför scopet är samma lucka. Den nya conf-filen lades därför till (en rad). package.json rördes INTE.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
