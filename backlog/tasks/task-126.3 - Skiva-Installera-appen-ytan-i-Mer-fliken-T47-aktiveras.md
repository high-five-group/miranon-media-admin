---
id: TASK-126.3
title: 'Skiva: Installera appen-ytan i Mer-fliken (T47 aktiveras)'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-126.2
parent_task_id: TASK-126
ordinal: 202000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-fliken får en Installera appen-yta och aktiverar därmed T47:s vilande Inställnings-hemvist. iOS/iPadOS-instruktionen är huvudpersonen — steg-för-steg så att Lotta klarar den ensam på första försöket — med Mac-Safari Lägg till i Dock och Chromium-knappen (via bibliotekskomponenten) som sekundära vägar. Ytan visar rätt väg för besökarens plattform först, och bekräftar i stället för instruerar när appen redan är installerad.

Täcker användarberättelser: 1, 2, 3, 4, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Besökarens plattform avgör vilken instruktion som visas överst; övriga vägar nås men dominerar inte
- [ ] #2 iOS/iPadOS-instruktionen är komplett steg-för-steg utan en enda oförklarad teknisk term (Gunilla-principen)
- [ ] #3 På Chromium utlöser knappen riktig installationsdialog; efter installation visar ytan installerat-läget
- [ ] #4 Redan installerad (standalone) ger bekräftelse-läge i stället för instruktion
- [ ] #5 a11y-sviten grön på hela ytan — ribban är 11, inga undantag
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) efter Grind 0
- [ ] #6 Install-ytans instruktioner klarar Gunilla-principen: begriplig utan tekniska förkunskaper
<!-- DOD:END -->
