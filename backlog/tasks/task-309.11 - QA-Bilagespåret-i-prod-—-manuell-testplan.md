---
id: TASK-309.11
title: 'QA: Bilagespåret i prod — manuell testplan'
status: To Do
assignee: []
created_date: '2026-08-23 14:52'
labels:
  - ready-for-human
dependencies:
  - TASK-309.1
  - TASK-309.2
  - TASK-309.3
  - TASK-309.4
  - TASK-309.5
  - TASK-309.6
  - TASK-309.7
  - TASK-309.8
  - TASK-309.9
  - TASK-309.10
parent_task_id: TASK-309
ordinal: 572000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (prod): 1) Mer → Dokument → välj ett kommande riktigt event → Skapa bekräftelsebilaga: blocken förifyllda ur Eventinnehåll/Plats; ändra Pris; 'Förhandsgranska först' öppnar PDF utan vattenstämpel; 'Skapa' sparar och öppnar; raden syns med Mall. 2) Ändra Beskrivning på eventet → listan visar INAKTUELL → Skapa om → samma rad, aktuell. 3) Deltagarinformation: redigera agendan (lägg till rad med tid + meditation) → skapa → PDF visar raden. 4) Fyll parkering, kryssa 'spara som platsens standard' → Skapa → Mer → Platser visar värdet; nytt event på samma plats får det. 5) Åtgärds-sidan: bilageväljaren listar den skapade bilagan; skicka bekräftelse till testmottagare → bilagan bifogad. 6) Kvitto: förhandsgranska för en betald anmälan → nya mallen, utan vattenstämpel; skicka → mailets kvitto identiskt. 7) Mer → Eventinnehåll: ändra en standardtext → nytt event får den, redan skapad bilaga på annat event står som INAKTUELL först när dess eget underlag ändrats (kopia tom = påverkas). 8) Dubbeltryck på Skapa ger en fil. 9) Tillgänglighet: tabordning genom genereringsvyn och Mer-raderna; reduced-motion. Täcker användarberättelser: samtliga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela testplanen i Description genomförd i prod-appen av Marcus; varje avvikelse bokförd som nytt fynd-kort med exakt symptom och förväntat beteende
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
