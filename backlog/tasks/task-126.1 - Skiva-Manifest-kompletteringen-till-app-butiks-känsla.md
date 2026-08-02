---
id: TASK-126.1
title: 'Skiva: Manifest-kompletteringen till app-butiks-känsla'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-126
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Appens webbmanifest bär efter denna skiva alla fält som ger den rika installationsdialogen i stället för den anonyma infobaren: stabil identitet, svensk beskrivning, kategorier, fokusera-befintligt-fönster-beteendet vid länk-klick, och 2–3 genvägar till appens vanligaste handlingar (urval görs mot aktuell tabb-struktur). Skärmbilder ingår INTE — de är en egen avslutande skiva. Verifikatet bor i preview-skarven som redan bygger appen: fälten granskas i den genererade artefakten, där de uppstår.

Täcker användarberättelser: 5, 6, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Genererat manifest innehåller stabil identitet (id + scope), svensk description, categories och launch_handler focus-existing
- [ ] #2 2–3 genvägar (shortcuts) finns och pekar på befintliga routes
- [ ] #3 Preview-skarven verifierar manifest-fälten mekaniskt och faller rött om ett fält saknas
- [ ] #4 Befintliga PWA-egenskaper (installerbarhet, service worker, offline) utan regression i befintliga sviter
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
