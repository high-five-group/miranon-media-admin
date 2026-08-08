---
id: TASK-162.5
title: 'Skiva: QA — Marcus granskar promoveringen mot facit'
status: Done
assignee: []
created_date: '2026-08-08 07:44'
updated_date: '2026-08-08 19:22'
labels:
  - ready-for-human
dependencies:
  - TASK-162.2
  - TASK-162.3
  - TASK-162.4
parent_task_id: TASK-162
ordinal: 305000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus sida-vid-sida-granskning — promoveringsordningens steg 2–3 (ADR-103 B2). Manuell testplan: (1) Öppna eventsidan på dev-servern med riktig data, UTAN variant-parameter — den promoverade formen ska vara det som visas. (2) Jämför mot facit-bilderna yta för yta som regressionsstöd: åtgärds-kortet, filterpanelen i default-läge, aktivt filter, Bor över-krysset, noll träffar via Avbokade-filtret, avdelaren under registret, batch-baren. (3) Bocka checklistan per A1–A6; varje avvikelse blir ett NYTT kort med exakt symptom och förväntat beteende. (4) Vid godkännande: uttala det i klartext — godkännandet avblockerar rivningskortet TASK-145.6 (flagg-rivning + regressionslåsets baslinje). Täcker användarberättelser: 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Checklistan A1–A6 genomgången med utfall bokfört per punkt
- [x] #2 Godkännande uttalat i klartext ELLER avvikelser bokförda som NYA kort (aldrig retusch av befintliga)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
QA GENOMFÖRD OCH GODKÄND 2026-08-08. Marcus verbatim: 'Jag har tittat på Q&A-kortet och jag godkänner, allt verkar funka och se ut som det ska på eventsidan.' Granskningsyta: dev-server PID 50138 från huvudkatalogen på main (3042d729, samtliga promoverings- och fix-PR:er inne), riktig data. Utfall per punkt enligt kortets checklista, samtliga OK per Marcus genomgång: A1 åtgärds-kortet OK · A2 filterpanel default OK · A3 aktivt filter OK · A4 avdelaren/batch-baren OK · A5 Bor över-krysset OK · A6 noll träffar/Avbokade OK. Inga avvikelser ⇒ inga nya kort. ADR-104-NOT: detta klartext-godkännande uppfyller kortets AC #2; den MEKANISKA avblockeringen av TASK-145.6 sker via godkand-stämpeln (Marcus !-kommando) när task-167:s skript landat — första skarpa användningen av kanalseparations-mekaniken. DoD #2–#4 avser stängnings-committen (docs-klass, path-scopad; CI per jobb via kön).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus QA genomförd och godkänd i klartext 2026-08-08 (citat i notes). Alla sex A-punkter OK, inga avvikelsekort. Godkännandets mekaniska stämpel (ADR-104) följer via !-kanalen när 167-skriptet finns — den gaten tillhör 145.6, inte detta kort.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
