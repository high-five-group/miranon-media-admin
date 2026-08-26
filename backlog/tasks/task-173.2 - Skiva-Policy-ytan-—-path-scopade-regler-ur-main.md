---
id: TASK-173.2
title: 'Skiva: Policy-ytan — path-scopade regler ur main'
status: To Do
assignee: []
created_date: '2026-08-09 13:12'
updated_date: '2026-08-26 03:11'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 325000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: granskningsregler knutna till path-mönster (t.ex. Airtable-write-ytor mot fällkatalogen, a11y-ytor mot 11-golvet) definieras config-drivet, läses ur main i granskningsögonblicket och injiceras scope-etiketterade i review-agentens input — en pushad gren kan aldrig manipulera sin egen granskning (ADR-105 beslut 7). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Path-scopade regler läses ENDAST ur main/trusted-källan — en regeländring på PR-grenen påverkar inte granskningen av samma gren (tvåsidigt bevisad)
- [x] #2 Regler injiceras endast för filer som matchar sitt mönster, med scope-etikett i utlåtandet så en regel aldrig läses som repo-bred
- [x] #3 Policy-ytan är config-driven per grindvakts-konventionen: värden i config, logik i skript
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [ ] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->
