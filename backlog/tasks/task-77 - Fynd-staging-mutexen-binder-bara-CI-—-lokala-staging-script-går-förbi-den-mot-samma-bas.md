---
id: TASK-77
title: >-
  Fynd: staging-mutexen binder bara CI — lokala staging-script går förbi den mot
  samma bas
status: To Do
assignee: []
created_date: '2026-07-28 23:39'
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
- [ ] #1 Mekanismen fäller eller varnar när ett lokalt staging-script startas medan CI håller staging-tests — bevisat skarpt med en avsiktligt framkallad kollision
- [ ] #2 Valet motiverat mot alla tre formerna (a/b/c) i PR:n; de förkastade bär sina skäl
- [ ] #3 Mekanismen blockerar INTE en legitim lokal körning när CI är tyst — negativt self-test redovisat, annars byter vi en tyst risk mot en ständig broms
- [ ] #4 Vägen förbi mekanismen är dokumenterad och medveten (en utvecklare måste kunna köra ändå när hen vet vad hen gör) — men den ska kräva ett aktivt val, inte vara default
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
