---
id: TASK-161.4
title: 'Skiva: ägar-deklarationer + governing-listans komplettering'
status: To Do
assignee: []
created_date: '2026-08-07 19:05'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.1
  - TASK-161.3
parent_task_id: TASK-161
ordinal: 294000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: governing-listan skiljer källor från kartor, varje styrande dok deklarerar sitt ägarskap, och tre styrande-i-praktiken-filer bär nu samma kadensgrind som de fjorton. Täcker användarberättelser: 4, 7 delvis.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje dok i FRONTMATTER_GOVERNING_DOCS bär ägar-deklarationen per amenderingens form (161.1); data-model.md:s fyra spridda auktoritets-anspråk konsolideras till EN deklaration (innehållet i övrigt orört — bas-maximerings-spårets yta)
- [ ] #2 Governing-listan kompletterad: CONTRIBUTING.md + README.md + DESIGN-SYSTEM-SPEC.md in i .frontmatter-policy.conf med frontmatter satt (updated == git-datum, review_by framåt); frontmatter-grindens testsvit utökad för nya poster; schema_reference får INTE grind (frusen, banderoll)
- [ ] #3 Docs-grindarna gröna lokalt (inkl. check-frontmatter mot utökade listan); PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
