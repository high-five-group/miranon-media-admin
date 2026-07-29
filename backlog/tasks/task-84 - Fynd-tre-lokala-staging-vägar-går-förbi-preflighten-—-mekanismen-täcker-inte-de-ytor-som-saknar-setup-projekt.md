---
id: TASK-84
title: >-
  Fynd: tre lokala staging-vägar går förbi preflighten — mekanismen täcker inte
  de ytor som saknar setup-projekt
status: Done
assignee: []
created_date: '2026-07-29 10:34'
updated_date: '2026-07-29 17:59'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`TASK-77` landade en preflight som hindrar lokala staging-körningar från att kollidera med CI. Wiringen sitter i Playwrights **setup-projekt** (`api-setup` → `api-staging` + `kontraktsvakt`; `setup` → `chromium-authenticated`), vilket ger projekt-precision och täcker även rå `npx playwright test --project=…`.

**Men tre ytor har inget setup-projekt att haka i, och går därför förbi mekanismen helt:**

- `npm run purge:staging` — eget Node-script, ingen Playwright
- `npm run seed:review` — eget Node-script, ingen Playwright
- `npm run test:preview:staging` — Playwright, men utan setup-projekt

Rapporterat av `TASK-77`:s egen agent, som dokumenterade manuell preflight för dem i `CONTRIBUTING.md` i stället för att tiga om luckan.

### VARFÖR DET INTE ÄR EN DETALJ

`purge:staging` är den skarpaste av de tre. `TASK-76` visade att två samtidiga purge-körningar racar om samma poster — och den fixen gör skriptet robust, inte kollisionsfritt. En lokal `purge:staging` mot en pågående CI-purge är exakt det race `TASK-76` beskriver, bara med en aktör som mekanismen inte ser.

`seed:review` är näst skarpast: den skapar granskningsdata åt Marcus, och `CLAUDE.md` bär redan en rad om att jobbet gjordes för hand två gånger innan skriptet fanns. Kolliderar den med en CI-purge kan granskningsdata försvinna mitt i en pågående granskning — vilket är precis vad skriptets korsläsning mot `.purge-staging-policy.json` finns för att förhindra.

**Mönstret att undvika:** en mekanism som täcker de flesta vägar läses som att den täcker alla. Det är samma klass som `TASK-82` (två guard-sviter utanför CI bland femton innanför) och som restlistans kontroll som var blind för en hel radklass — **partiell täckning som inte är utskriven blir läst som fullständig.**

### AVGRÄNSNING

Kortet utvidgar `TASK-77`:s preflight till de tre ytorna. Det bygger INTE ett distribuerat lås — form (a) förkastades i `TASK-77` som arkitekturval och den riktningen ägs av `T85` våg 3 (staging-per-run-isolering). Den ärliga gränsen står kvar: preflight är kontroll vid START, inte ett hållet lås.

### KÄNT UNDERLAG SOM SPARAR TID

`TASK-77`:s agent fann empiriskt att `config.projects` i Playwrights `globalSetup` **inte** filtreras av `--project` — en körning med `--project=api-pure` listade samtliga tio projekt. Den vägen kan alltså inte skilja staging-körningar från övriga. Det är skälet till att wiringen ligger i dependency-projekten, och det gäller även här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla tre ytorna kör preflighten — bevisat per yta med ett kollisionsfall som fäller och ett rent fall som passerar
- [x] #2 Formen för de två Node-scripten motiverad: de saknar Playwright helt, så haken kan inte vara ett setup-projekt — säg vad den blev i stället och varför
- [x] #3 Ingen falsk broms: var och en av de tre kör igenom när CI är tyst — exitkod redovisad per yta
- [x] #4 Samma medvetna förbi-väg som TASK-77 (MM_STAGING_PREFLIGHT=off) fungerar för alla tre, och är dokumenterad
- [x] #5 CONTRIBUTING.md:s rad om manuell preflight för dessa tre RIVS när mekaniken täcker dem — en kvarstående rad om manuellt arbete som inte längre behövs är en lögn i styrande fil
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FORMEN: TASK-77:s, utvidgad — INTE en andra mekanism. Ingen ny logik: både Node-haken (scripts/lib/staging-preflight.mjs) och den befintliga Playwright-haken (tests/support/staging-preflight.ts) anropar samma `scripts/staging-semaphore.sh preflight`, som förblir enda sanningskällan. Semaforen och .staging-semaphore-policy.conf är ORÖRDA.

YTA 3 (test:preview:staging) — SETUP-PROJEKT, precis som TASK-77. Nytt villkorat projekt `preview-setup` (tests/preview/preflight.setup.ts) som `staging-preview` beror på. Båda existerar bara under PLAYWRIGHT_STAGING_PREVIEW=1, så precisionen är redan given av projekt-instansieringen. Dependency-vägen valdes framför en rad i testfilen: den täcker PROJEKTET, inte en fil — en ny fil i tests/preview/ ärver preflighten utan att någon behöver minnas den. `staging-preview` fick testIgnore för **/*.setup.ts explicit; Playwrights default-testMatch hade inte tagit setup-filen ändå, men att luta sig mot en default är att luta sig mot något som kan ändras.

YTA 1+2 (purge:staging, seed:review) — AC#2: HAKEN BLEV ETT ANROP I main(), inte ett prefix i package.json. Skälet är TASK-77:s eget, oförändrat: ett kommandonamns-prefix bevakar kommandonamnet, inte kodvägen. `node scripts/purge-staging-sentinels.mjs` är den form CI SJÄLVT använder (ci-suite.yml rad 125) och den en agent lika gärna skriver lokalt — den hade gått rakt förbi ett prefix. Placeringen i main() är EFTER policy-/token-guarderna (saknas token är det felet som ska synas) och FÖRE första begäran mot Airtable. Gäller även --dry-run, som läser basen och delar dess 5 req/s-budget.

EXIT-KODEN PROPAGERAS ORÖRD (76/77) i stället för att mappas till skriptens egen 1, som redan betyder guard-/konfigurationsfel. Att slå ihop dem hade gjort felet tvetydigt i loggen.

NO-OP UNDER GITHUB_ACTIONS är skarpare här än på Playwright-sidan: purge-staging-sentinels.mjs ÄR CI-jobbet `Staging sentinel purge`. En preflight som körde där hade fällt purge-jobbet varje gång. Bevisat separat per Node-yta.

BEVIS — 3 ytor x 4 fall, alla exitkoder mätta separat (aldrig via pipe). gh-sonden stubbad via GH_BIN (samma stub-form som scripts/test-staging-semaphore.sh) för kollisionsfallen; ÄKTA gh för de rena fallen (CI verifierat tyst vid mätningen).

purge:staging (--dry-run genomgående, noll radering):
  kollision -> exit 76, och skriptets banner "Sentinel-purge mot apphjj8Q7lkXCMsL4" SAKNAS i utdatan (0 träffar) = noll begäran mot Airtable
  rent (äkta gh) -> exit 0, PREFLIGHT OK, full läsning: 12/25/12 träffar över de tre målen, "Dry run klar"
  MM_STAGING_PREFLIGHT=off + stub BUSY -> exit 0, "PREFLIGHT AVSTÄNGD" i loggen
  GITHUB_ACTIONS=true + stub BUSY -> exit 0, noll "CI HÅLLER STAGING"

seed:review (--dry-run; create-vägens dry run returnerar FÖRE första Airtable-anropet, alltså noll bas-kontakt alls):
  kollision -> exit 76, banner "Granskningsfixtur mot" saknas (0 träffar)
  rent (äkta gh) -> exit 0, PREFLIGHT OK -> "Dry run klar — inget skrevs"
  seed:review:clean samma hake (samma main()): kollision exit 76, rent exit 0 ("Inget att städa")
  MM_STAGING_PREFLIGHT=off + stub BUSY -> exit 0
  GITHUB_ACTIONS=true + stub BUSY -> exit 0

test:preview:staging (full kanonisk kedja, inkl. bygge + bundelgrind):
  kollision -> exit 1, "1 failed [preview-setup]" + "1 did not run" (staging-preview kördes ALDRIG)
  rent (äkta gh) -> exit 0, 2 passed (preview-setup 2,9 s + staging-preview 3,2 s)
  MM_STAGING_PREFLIGHT=off + stub BUSY -> exit 0, 2 passed
  GITHUB_ACTIONS=true + stub BUSY -> exit 0 (preview-setup ensamt)

INGEN NY FALSK BROMS, mätt: `npx playwright test --list` utan PLAYWRIGHT_STAGING_PREVIEW ger 0 preview-träffar — projekten instansieras inte alls. Dependency-wiringen bevisad med --list: --project=staging-preview drar in [preview-setup]. Och `npm run test:api` gick 419 passed genom den BEFINTLIGA api-setup-haken, alltså ingen regression där.

VERIFIERINGEN RÖRDE ALDRIG BASENS DATA. Kollisionsfallen fäller före första Airtable-anropet; de rena fallen kördes med --dry-run (purge: läser + raderar inget; seed create: returnerar före första anropet). Motiverat av att en annan agent arbetade parallellt mot samma delade bas.

ÄRLIG GRÄNS, ÄRVD OCH INTE UTÖKAD: preflighten är en kontroll vid START, inte ett hållet lås — en CI-körning som startar EFTER din lokala start fångas inte. Utskrivet i CONTRIBUTING. Dessutom nyskrivet där: en fällning på preview-ytan kommer EFTER det lokala bygget (webServer + build startar före projekten), så den sparar noll begäran mot staging men inte byggtiden. Att flytta haken före bygget hade krävt just det prefix i package.json som går bredvid rå --project-anrop.

AC#5: CONTRIBUTING.md § Staging-preflighten omskriven. Stycket "Två ytor bär den MEDVETET inte ... eller kör preflighten för hand" är BORTTAGET. Ersatt av en per-yta-tabell över alla fem ytorna + var haken sitter, plus varför den sitter i kodvägen och inte i kommandonamnet.

INGEN NY TESTSVIT BYGGD, medvetet: semaforens logik är redan täckt av scripts/test-staging-semaphore.sh (19 fall, kördes grön). Den nya koden är wiring, och TASK-77 bevisade sin wiring empiriskt av samma skäl. Registrerat som avvikelse att en refaktorering som tappar anropsraden i main() inte fångas av någon grind — samma sak gäller TASK-77:s setup-filer.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (S91, sextonde resumen). PR #456, landad 17:56:51Z genom merge queue, CI grön per jobb.

FORMEN: TASK-77:s, UTVIDGAD — inte en andra mekanism. Både Node-haken (scripts/lib/staging-preflight.mjs) och den befintliga Playwright-haken anropar samma scripts/staging-semaphore.sh preflight, som förblir enda sanningskällan. Semaforen och .staging-semaphore-policy.conf ORÖRDA.

De tre ytorna: test:preview:staging fick ett nytt setup-projekt (preview-setup), precis som api-setup/setup — dependency-vägen täcker PROJEKTET, så en ny fil i tests/preview/ ärver preflighten utan att någon behöver minnas den. purge:staging och seed:review fick anrop i main(), av TASK-77:s eget skäl: ett kommandonamns-prefix bevakar kommandonamnet, inte kodvägen, och `node scripts/purge-staging-sentinels.mjs` är formen CI självt använder.

BEVIS — 3 ytor x 4 fall, exitkoder mätta separat, aldrig via pipe:

  kollision                     purge 76 · seed 76 · preview 1
  rent (ÄKTA gh)                0 · 0 · 0
  MM_STAGING_PREFLIGHT=off      0 · 0 · 0
  GITHUB_ACTIONS=true           0 · 0 · 0

Att fällningen sker FÖRE basen nås är mätt, inte antaget: skriptens banner-rad ("Sentinel-purge mot apphjj8Q7lkXCMsL4", "Granskningsfixtur mot …") saknas helt i utdatan, 0 träffar — bannern skrivs före första list-anropet.

TVÅ VAL VÄRDA GRANSKNING, båda godkända av orkestreraren: exitkoden propageras ORÖRD (76/77) i stället för att kollapsa till skriptens 1, som redan betyder guard-fel — annars blir felet tvetydigt i loggen. Och GITHUB_ACTIONS-no-op:en är skarpare här än på Playwright-sidan eftersom purge-scriptet ÄR CI-jobbet "Staging sentinel purge"; utan den hade preflighten fällt purge-jobbet varje körning.

VERIFIERINGEN RÖRDE ALDRIG BASENS DATA. Inga destruktiva staging-operationer. Kollisionsfallen fäller före första Airtable-anropet; de rena kördes med --dry-run.

AC#5: stycket "Två ytor bär den MEDVETET inte …" är borttaget ur CONTRIBUTING.md och ersatt av en per-yta-tabell över samtliga fem ytor.

ÖPPEN LUCKA, RAPPORTERAD AV AGENTEN OM SIG SJÄLV: ingen ny testsvit byggd (semaforens logik täcks av 19 befintliga fall, och den nya koden är wiring). Konsekvensen står utskriven: en refaktorering som tappar anropsraden i main() fångas inte av någon grind — och samma gap finns i TASK-77:s setup-filer. Mintat som TASK-91 med GitLab-skälet: frånvaron av en säkerhetsmekanism syns inte.

NYUPPTÄCKT GRÄNS, inskriven i CONTRIBUTING: en fällning på preview-ytan kommer EFTER det lokala bygget, eftersom bundeln byggs och grindas innan Playwright startar. Den sparar noll begäran mot staging men inte byggtiden.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
