---
id: TASK-158.1
title: 'Skiva: ADR-099 — rullande fönstret för sessionsdok-roten'
status: In Progress
assignee: []
created_date: '2026-08-07 12:25'
updated_date: '2026-08-07 14:07'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-158
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: beslutet som styr hela arbetsenheten finns publicerat och citerbart — en läsare av ADR-041 ser öppet att fas-avslut-bindningen är riven och var efterträdaren bor; en läsare av ADR-099 ser fönsterregeln, dess konfig-hemvist och rivningens motiv (Fas 6-längden falsifierade premissen; synk-föroreningen per ADR-048). Täcker användarberättelser: 8 (grund för 3, 5)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: ADR-041, ADR-023 och ADR-048 lästa i sin helhet FÖRE författande; avvikelse mot PRD:ns premisser → stanna och flagga
- [x] #2 ADR-099 kodifierar fönsterregeln (~10 senast stängda + samtliga paused/active i roten; talet pekas ut som konfig-värde, inte hårdkodat i prosa)
- [x] #3 Fas-avslut-bindningen (ADR-041) rivs ÖPPET med amenderings-block i ADR-041 + kvittens-referens till S99 Del 5 — aldrig tyst
- [x] #4 ADR-index/README-räkningen stämmer efter mintningen
- [ ] #5 PR armerad, per-jobb-grön
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
