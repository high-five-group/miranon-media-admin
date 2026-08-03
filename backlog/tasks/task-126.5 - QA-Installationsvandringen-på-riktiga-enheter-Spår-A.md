---
id: TASK-126.5
title: 'QA: Installationsvandringen på riktiga enheter (Spår A)'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-human
dependencies:
  - TASK-126.1
  - TASK-126.2
  - TASK-126.3
  - TASK-126.4
parent_task_id: TASK-126
ordinal: 204000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (FÖRKRAV: Grind 0 — publik HTTPS-URL — klar; se T46-kartan):

1. iPad: öppna appen i Safari → Mer-fliken → följ install-instruktionen → ikon på hemskärmen → öppna från ikonen: eget fönster utan Safari-chrome.
2. Mac Safari: Lägg till i Dock → egen Dock-ikon → eget fönster.
3. Chromium på Mac: install-knappen → rika dialogen visar namn, beskrivning och skärmbilder → installera → genvägarna syns i appikonens meny → klick på app-länk fokuserar befintligt fönster i stället för nytt.
4. Per enhet: install-ytan visar rätt väg överst, och bekräftelse-läget efter installation.

Täcker användarberättelse: 9 + manuell helhet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra vandringarna genomförda på riktiga enheter och godkända av Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) efter Grind 0
<!-- DOD:END -->
