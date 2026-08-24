---
id: TASK-229.1
title: >-
  A2 Gren 1-fixen i staging — Person-länk + touchpoint även för namnlösa
  personer
status: To Do
assignee: []
created_date: '2026-08-24 13:35'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-229
ordinal: 575000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsaken ur S112-utredningen (2026-08-24, Opus, mätt mot prod-A2 wflRPMp5QNGEa7wH1): Gren 1 (villkor: Personer.E-post matchar AND Förnamn isEmpty) kör endast updateRecord som fyller namn — Person-länken sätts aldrig och ingen Inskickad anmälan-touchpoint skapas; Gren 2 hoppas över. 61 namnlösa lead-personer är laddade fällor (+~9/mån). Fixen: Gren 1 ska även sätta Anmälningar.Person och skapa touchpointen — byggs och bevisas i STAGING (apphjj8Q7lkXCMsL4, identiska automation-ID:n). Marcus GO 2026-08-24: 'Det är absolut GO på 1+2.'
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ändringsdesign skriven mot A2:s faktiska nodstruktur i staging (läst live, inte ur schema_reference)
- [ ] #2 MCP-skrivvägen MÄTT: kan update_automation skriva de nya noderna? readOnlyNodeType-utfall bokförs per försök (T167-klassen)
- [ ] #3 Om MCP kan: ändringen utförd i staging-A2. Om inte: exakt UI-instruktion för Marcus (T167 väg 1-formen inkl. UI-fällorna: input-variabler skapas bakom Edit code; namn skiftlägeskänsliga)
- [ ] #4 Ände-till-ände-bevis i staging: namnlös person + ny anmälan ger Person-länk + touchpoint; motprov: person MED namn ger oförändrat Gren 2-beteende
- [ ] #5 Prod-utrullningen görs INTE här — den är systerskivans (ready-for-human)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
