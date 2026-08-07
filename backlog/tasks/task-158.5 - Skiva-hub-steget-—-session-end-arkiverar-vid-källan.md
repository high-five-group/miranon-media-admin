---
id: TASK-158.5
title: 'Skiva: hub-steget — session-end arkiverar vid källan'
status: To Do
assignee: []
created_date: '2026-08-07 12:31'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.2
parent_task_id: TASK-158
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en session som stängs via session-end i ett repo med arkiverings-skriptet lämnar en rot inom fönstret utan att någon minns ett manuellt steg; i repon utan skriptet är momentet vilande, inte ett fel. Täcker användarberättelser: 3, 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: aktiva plugin-versionens session-end-skill läst i sin helhet FÖRE ändring (cache-versions-fällan, S99 Del 3-mönstret)
- [ ] #2 session-end-skillen får arkiverings-momentet (kör spoke-skriptet där det finns; vilande annars — heartbeat-mönstrets formulering)
- [ ] #3 Plugin-bump + Code-reinstall i samma landning per reinstall-praxisen; hub- och spoke-ändringar i separata commits
- [ ] #4 KÖRS OISOLERAT: agenten arbetar i spokens huvudkatalog mot hub-repot — aldrig i egen worktree (S99 Del 3-beslutet, worktree-matrisen)
- [ ] #5 PR armerad respektive hub-commit pushad, per-jobb-grönt där CI finns
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
