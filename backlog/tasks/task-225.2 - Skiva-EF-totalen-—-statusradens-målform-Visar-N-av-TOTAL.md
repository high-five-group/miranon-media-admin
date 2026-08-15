---
id: TASK-225.2
title: 'Skiva: EF-totalen — statusradens målform ''Visar N av TOTAL'''
status: Done
assignee: []
created_date: '2026-08-15 09:19'
updated_date: '2026-08-15 10:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-225.1
parent_task_id: TASK-225
ordinal: 414000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Läs-EF:en utökas med exakt radräkning på samma filtrerade fråga (Supabase count 'exact' som head-räkning), och statusraden byter från interimsformen till målformen Marcus beställde 2026-08-15. Staging-deploy av EF:en ingår i skivan; PROD-deployen är ett Marcus-moment per runbook-formen (prod-låset, TASK-203) och bokförs i slutrapporten som väntande. Täcker användarberättelse: 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-activity-log returnerar totalantalet för den filtrerade frågan som ADDITIVT svarsfält — befintliga konsumenter obrutna
- [ ] #2 Statusraden visar 'Visar N av TOTAL poster.' när fler finns och 'Visar alla N poster.' när allt är laddat
- [ ] #3 Acceptance-sviten täcker den nya statusrads-copyn
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i PR #1335 (merge b924fb1b). Additivt total-fält i get-activity-log (exakt head-count, samma filter minus cursor); skew-säker statusrad (äldre EF → interimsformen); staging-deployad och live-bevisad 'Visar 20 av 279 poster.'; PROD-deploy återstår som Marcus runbook-moment (bokfört i sessionsdok).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [ ] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->
