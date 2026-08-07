---
id: TASK-23
title: >-
  Fynd: mapEvent-/deriveManadAr-dupliceringen har växt till fyra EF-kopior med
  manuell håll-i-synk-plikt
status: To Do
assignee: []
created_date: '2026-07-21 23:26'
updated_date: '2026-08-07 11:18'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-18.1.

Symptom: samma berikade läs-mappning + månads-härledning kopieras i get-event, get-events, create-event/mapCreatedEvent och nya update-event — håll-i-synk-plikten bärs av kod-kommentarer, driftrisken växer per kopia.

Förväntat: gemensam modul i supabase/functions/_shared/ (samma SSOT-mönster som field-allowlists) — refactor-kandidat, ingen beteendeändring.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FÖRSTÄRKT av S75 batch 3 (task-18.4): den chunkade OR(RECORD_ID()=…)-batchen finns nu i TRE EF:er — get-attendance, get-person och get-registrations — med nästan identiska kopior av chunk() + fetchByRecordIds(). Dupliceringen växer alltså i två oberoende dimensioner: mapEvent ×4 och batch-läsningen ×3. Rimlig _shared-kandidat när baren nås.

S75 batch 4 (17.5): mapEvent-kopiorna hölls i synk för LÄS-shapen igen — borOverAntal-aggregeringen lades avsiktligt bara i läs-EF:erna (get-events/get-event), write-EF:erna utelämnar den (samma form som viaFormular/medfoljande). Ingen NY drift införd, men fyra-kopior-skulden kvarstår och växer per läs-fält.
<!-- SECTION:NOTES:END -->
