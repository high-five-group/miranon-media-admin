---
id: TASK-340.5
title: 'QA: skapa-flödet i prod — manuell testplan'
status: To Do
assignee: []
created_date: '2026-08-29 08:19'
labels:
  - ready-for-human
dependencies:
  - TASK-340.1
  - TASK-340.2
  - TASK-340.3
parent_task_id: TASK-340
ordinal: 624000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (prod, Marcus), efter EF-deploy via fas4-prod-deploy.sh i eget terminalfönster: 1) RIM 1 Rönninge: Förhandsgranska → eget fönster med väntetexten (309.38), PDF utan vattenstämpel. 2) Skapa → INGET nytt fönster; bekräftelsen ersätter formuläret inom ~1–2 s, fokus där, text 'sparad'; 'Visa dokumentet' öppnar exakt den PDF du granskade (jämför sidfoten/innehållet); 'Till dokumenten' landar på fliken Bilagor. 3) Ändra Beskrivning på eventet i appen → Förhandsgranska → ändra igen INNAN Skapa (t.ex. Pris) → Skapa → bekräftelsen säger att underlaget ändrats och dokumentet gjordes om. 4) Tryck Skapa igen på samma event: knappen heter 'Skapa om bekräftelsebilagan'; efteråt finns EN rad i listan, inget '+1 äldre fil'. 5) Kryssa 'spara som platsens standard' → bekräftelsen nämner Rönninge. 6) Deltagarinformation: samma 1–4. 7) Skärmläsare (VoiceOver): bekräftelsen läses en gång; 'Till dokumenten' läses en gång. 8) 375 px: bekräftelsen och de två valen ryms utan horisontell scroll. 9) DIN DOM PÅ FORMEN: research-passet valde bekräftelse på plats med två val i stället för din punkt 3/4 (ingen öppna-knapp; auto-tillbaka med markerad rad) — säg i klartext om formen håller eller ska styras om. Varje avvikelse blir nytt fynd-kort. Efter godkännande: ny facit-baslinje för s108-generering (ADR-074). Täcker användarberättelser: samtliga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela testplanen genomförd i prod av Marcus; varje avvikelse bokförd som nytt fynd-kort; domen på formen (punkt 9) citerad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
