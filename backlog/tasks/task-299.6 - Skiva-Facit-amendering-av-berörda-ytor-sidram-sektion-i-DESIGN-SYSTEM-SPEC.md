---
id: TASK-299.6
title: 'Skiva: Facit-amendering av berörda ytor + sidram-sektion i DESIGN-SYSTEM-SPEC'
status: To Do
assignee: []
created_date: '2026-08-22 19:26'
labels:
  - ready-for-human
dependencies:
  - TASK-299.2
  - TASK-299.5
parent_task_id: TASK-299
ordinal: 546000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De stämplade ytor som byter sidram i den omfattning Marcus valde får sina manifest amenderade — öppet, med hans citat, i egen commit skild från formändringen. Samtidigt får designsystem-specen den sidram-sektion den saknar helt i dag: det var frånvaron av en sådan sektion som lät två dialekter divergera obemärkt, så utan den upprepas felet. Sektionen ska beskriva den valda formen och dess gräns mot andra ytklasser. Täcker användarberättelser: 11, 12, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje stämplat manifest vars yta bytt sidram är amenderat med daterad post och Marcus citat, i EGEN commit
- [ ] #2 Ingen yta utanför den omfattning Marcus valde i skiva 2 är rörd
- [ ] #3 DESIGN-SYSTEM-SPEC bär en sidram-sektion som beskriver den valda formen och dess familjegräns mot andra ytklasser
- [ ] #4 check-facit grön; inga ytor lämnas med manifest som beskriver en form de inte längre bär
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [ ] #6 Facit-amendering av berörda stämplade manifest sker i EGEN commit med Marcus citat daterat (ADR-102/103) — aldrig i samma commit som formändringen
<!-- DOD:END -->
