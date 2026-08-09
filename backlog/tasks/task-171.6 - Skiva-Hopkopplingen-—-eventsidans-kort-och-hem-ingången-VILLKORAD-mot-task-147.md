---
id: TASK-171.6
title: >-
  Skiva: Hopkopplingen — eventsidans kort och hem-ingången (VILLKORAD mot
  task-147)
status: To Do
assignee: []
created_date: '2026-08-09 08:27'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.5
  - TASK-147
parent_task_id: TASK-171
ordinal: 321000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: eventsidans Gå till åtgärder-kort byter utfällnings-beteendet mot navigation till åtgärdssidan med det markerade urvalet medfört, och hem-vyns ingång till sidan utan event byggs (eventväljar-läget). VILLKORET som styr sekvensen: sidan får inte bli produktions-nåbar medan dess handlingar ljuger — sändvägen ägs av task-147, därav den hårda dep:en på PRD-kortet (147:s sändvägs-skiva finns inte än; dep:en flyttas till den när den mintas). Öppet sekvenserad, aldrig tyst parkerad — bokfört i sessionsdok S100 Del 7 + S93 Del 15. Täcker användarberättelser: 1, 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eventsidans kort navigerar till åtgärdssidan med markerat urval medfört
- [ ] #2 Hem-vyns ingång når sidan utan event (eventväljar-läget)
- [ ] #3 Ingen produktions-exponering före 147:s sändväg — prövat och bokfört
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
<!-- DOD:END -->
