---
id: TASK-84
title: >-
  Fynd: tre lokala staging-vägar går förbi preflighten — mekanismen täcker inte
  de ytor som saknar setup-projekt
status: To Do
assignee: []
created_date: '2026-07-29 10:34'
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
- [ ] #1 Alla tre ytorna kör preflighten — bevisat per yta med ett kollisionsfall som fäller och ett rent fall som passerar
- [ ] #2 Formen för de två Node-scripten motiverad: de saknar Playwright helt, så haken kan inte vara ett setup-projekt — säg vad den blev i stället och varför
- [ ] #3 Ingen falsk broms: var och en av de tre kör igenom när CI är tyst — exitkod redovisad per yta
- [ ] #4 Samma medvetna förbi-väg som TASK-77 (MM_STAGING_PREFLIGHT=off) fungerar för alla tre, och är dokumenterad
- [ ] #5 CONTRIBUTING.md:s rad om manuell preflight för dessa tre RIVS när mekaniken täcker dem — en kvarstående rad om manuellt arbete som inte längre behövs är en lögn i styrande fil
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
