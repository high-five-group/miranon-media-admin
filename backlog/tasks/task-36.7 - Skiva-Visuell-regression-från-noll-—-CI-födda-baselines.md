---
id: TASK-36.7
title: 'Skiva: Visuell regression från noll — CI-födda baselines'
status: To Do
assignee: []
created_date: '2026-07-23 17:14'
labels:
  - ready-for-human
dependencies:
  - TASK-36.3
parent_task_id: TASK-36
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UI-klassen ger snabb återkoppling på stiländringar, men utan visuell regression saknas den signal som faktiskt betyder något för just den ytan: SÅG det rätt ut? Idag finns projektdefinitionerna för två vyporter redan i testkonfigurationen medan testkatalogen inte existerar på disk — skarven är förberedd men tom.

Efter denna skiva jämförs varje UI-ändring mot inchecknade referensbilder, och en oavsiktlig förskjutning i layout eller färg fångas innan den når main.

Två principer bär bygget. Baselines föds i CI, aldrig lokalt: skärmbilder är plattformsbundna, och en bild genererad på en Mac kommer aldrig att matcha en jämförelse som körs på Linux. En dedikerad avfyrbar workflow genererar dem därför i rätt miljö och öppnar en PR — så att varje förändring av vad som anses korrekt är en diff någon har tittat på, aldrig en tyst uppdatering.

Data är mockad, inte hämtad från staging: testerna serverar fixturdata, vilket ger noll mutex-beroende och pixlar som inte flyttar sig för att ett testkonto ändrats. Datumkänsliga ytor fryses, så att en bild inte blir röd av att klockan går.

Denna skiva är medvetet klassad för mänsklig hand. Bygget är inte svårt, men baselines är BILDER — och en agent som genererar tolv skärmbilder och godkänner sina egna referenser har byggt en vakt mot allt utom sitt eget misstag. Den första uppsättningen ska granskas av någon som vet hur vyerna SKA se ut. Skivan byggs i egen session.

Täcker användarberättelser: 2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Baselines föds i CI, ALDRIG lokalt: en dedikerad avfyrbar workflow genererar dem i samma miljö de jämförs i och öppnar en baseline-PR
- [ ] #2 Varje baseline-ändring är en granskningsbar diff i en PR — aldrig en tyst uppdatering
- [ ] #3 Endast linux-baselines checkas in; lokalt genererade plattformsbilder är ignorerade
- [ ] #4 Testerna mockar backend-svaren med fixturdata: noll staging-beroende, noll mutex, stabila pixlar
- [ ] #5 Datumkänsliga ytor är frusna via fixtur och vid behov maskning, så en bild inte blir röd av att klockan går
- [ ] #6 Omfattning v1: de facit-tunga vyerna i två vyporter (skrivbord och mobil), cirka tolv bilder, jobbet under ett par minuter
- [ ] #7 Eget CI-jobb som kör på UI-klassen och full-klassen men skippas på dokumentationsklassen, utan mutex
- [ ] #8 Nattkörningen utökas med den fulla visuella sviten (raden som nattnätets skiva medvetet lämnade öppen)
- [ ] #9 Kadens-regeln dokumenterad: uppgradering av webbläsare eller testverktyg ger förväntad baseline-drift och hanteras med en baseline-PR granskad ihop med uppgraderingen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [ ] #6 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
