---
id: TASK-315
title: >-
  Fynd: A2:s två persongrenar söker mot OLIKA e-postfält — Gren 1 råtext, Gren 2
  normaliserad
status: To Do
assignee: []
created_date: '2026-08-24 14:00'
labels:
  - fynd
dependencies: []
ordinal: 578000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-24 (S112, TASK-229.1-passet, live-läsning av A2 wflRPMp5QNGEa7wH1): Gren 2:s sökning matchar 'Normaliserad e-post' (fld0CIF2qC7ufa8UD, formel LOWER(TRIM(...))) medan Gren 1:s sökning matchar rå e-posttexten (fldVY310IdOIbTkE8). Konsekvens: en anmälan vars e-post skiljer sig endast i skiftläge/whitespace från personpostens kan träffas av den ena grenen men inte den andra — subtila luckor i vilken gren som tar hand om personen. EJ åtgärdat i 229.1 (att byta sökaxel ändrar vilka poster Gren 1 alls träffar — egen analys + eget beslut krävs). Samma normaliseringsfamilj som TASK-293 (+-tecken i Datum) — kandidat att analyseras ihop.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Träffmängds-skillnaden mätt: hur många prod-personer/anmälningar skiljer sig mellan rå och normaliserad matchning
- [ ] #2 Beslut (Marcus vid behov): ska Gren 1 byta till normaliserad axel — och i så fall i samma utrullning som Gren 1-fixen eller separat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
