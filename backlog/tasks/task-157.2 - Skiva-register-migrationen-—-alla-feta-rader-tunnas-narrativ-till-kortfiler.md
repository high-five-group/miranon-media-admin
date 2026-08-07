---
id: TASK-157.2
title: 'Skiva: register-migrationen — alla feta rader tunnas, narrativ till kortfiler'
status: To Do
assignee: []
created_date: '2026-08-07 11:33'
labels:
  - ready-for-agent
dependencies:
  - TASK-157.1
parent_task_id: TASK-157
ordinal: 268000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: registret läses i ett svep långt under Read-taket, varje tråds narrativ nås via dess kort, och forensisk läsbarhet består — inget raderat. Täcker användarberättelser: 1, 2, 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Premiss-pass: ADR-098:s radform + radlängds-tak lästa på main; registret ommätt; lista över rader som överskrider taket byggd mekaniskt före någon redigering
- [ ] #2 Varje fet rad tunnad till ADR-098-formen; narrativ flyttat till trådens kortfil (kort fött där det saknades); besläktad-deklarationer flyttade per ADR-098:s hemvist-beslut; INGET innehåll raderat — mekanisk innehålls-bevarande-kontroll redovisad rad för rad i slutrapporten
- [ ] #3 check-thread-index.sh:s befintliga invarianter gröna efter migrationen; registrets nya storlek redovisad (rader + KB); docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
