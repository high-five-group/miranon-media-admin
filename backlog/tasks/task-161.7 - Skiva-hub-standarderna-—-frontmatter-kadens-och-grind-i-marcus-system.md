---
id: TASK-161.7
title: 'Skiva: hub-standarderna — frontmatter, kadens och grind i marcus-system'
status: To Do
assignee: []
created_date: '2026-08-07 19:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.1
parent_task_id: TASK-161
ordinal: 297000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: hubbens styrande docs bär samma frontmatter-standard, kadensgrind och ägar-deklaration som spokens — byggt i den form som senare kan lyftas till central tjänst (T137). Täcker användarberättelser: 7, 8
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: hubbens enforcement-ytor inventerade (NOLL CI-workflows mätt 2026-08-07; finns .githooks/pre-commit?) — vägvalet hub-CI kontra pre-commit-hook avgörs mot fyndet och bokförs; agenten kör OISOLERAT eller via git -C-vägen (spoke-matrisens form)
- [ ] #2 Hubbens styrande docs (CLAUDE.md, SYSTEMET.md, IDENTITET.md m.fl. — inventeras) får frontmatter (owner/updated/review_by/status) + ägar-deklaration per 161.1:s form; check-frontmatter-logiken dupliceras som universellt skript + hubbens egen policy-conf (Lesson #6; centraliserings-KOMPATIBELT per T137 — föregrip INTE central tjänst)
- [ ] #3 Ö8-dubbletterna (fem hub/spoke-dubblerade instruktionsrader inkl. kopierade mättal) löses: hubben behåller regeln, spoke-specialiseringen pekar; hubbens stale updated-fält synkas mot git-datum
- [ ] #4 Grind-logiken tvåsidigt testad i hubben; spoke-docs-grindarna gröna för ev. spoke-pekar-ändringar; ändringar committade + pushade i hubben, plugin-bump ENDAST om skill-/plugin-filer rörs
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
