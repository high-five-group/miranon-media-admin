---
id: TASK-173.1
title: 'Skiva: Utlåtande-kontraktet + review-agenten'
status: Done
assignee: []
created_date: '2026-08-09 13:11'
updated_date: '2026-08-24 15:47'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies: []
parent_task_id: TASK-173
ordinal: 324000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en granskningsagent i färsk kontext tar emot kortets AC verbatim + diffen + path-scopade regler, granskar adversarialt och returnerar ett schema-giltigt JSON-utlåtande; grind-steget står i orkestrerar- och bygg-agent-kontrakten (ADR-105 beslut 1–3, 5, 7). Demonstrerbar ensam via manuell körning mot en verklig PR. Täcker användarberättelser: 1, 7, 8, 10, 11, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En manuell körning av review-agenten mot en verklig PR producerar ett utlåtande som validerar mot JSON-schemat (severity error/warning/info · action auto-fix/ask-user · risknivå låg/medel/hög + enmenings-motivering · bevisreferenser)
- [x] #2 Saknad action-klassning i ett fynd failar closed till ask-user
- [x] #3 Review-agenten körs i färsk kontext och är aldrig driv-/bygg-agenten; orkestrerar- och bygg-agent-kontrakten bär grind-steget: spawn efter push, före armering
- [x] #4 HÖG risknivå bokförd som orkestrerar-regel: armering väntar på Marcus explicita granskning
- [x] #5 Kortets AC hämtas verbatim via CLI:t och prövas som antaganden — fel-ställda AC flaggas i utlåtandet
- [x] #6 PR utan kort-ID granskas med PR-text som intent och utlåtandet flaggar öppet lägre intent-konfidens
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [x] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OBOCKAT MED AVSIKT: DoD #6 (CI-backstopp) och #7 (instrumentering) hör till skivorna 173.4/173.6 — att bocka dem här vore falsk klarrapportering.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1927 · post-merge grönt på main 2026-08-24 (S112 slutbatch)
<!-- SECTION:FINAL_SUMMARY:END -->
