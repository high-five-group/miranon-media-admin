---
id: TASK-273.4
title: 'Skiva: Dokument-ytans preview- och nedladdningsikoner med ny flik'
status: To Do
assignee: []
created_date: '2026-08-17 14:57'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-273
ordinal: 492000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta klickar på förhandsvisnings-ikonen och dokumentet öppnas i en egen webbläsarflik i full storlek där hon faktiskt kan läsa det, eller på nedladdnings-ikonen och filen sparas. Ände-till-ände över alla tre dokumentklasser mot befintliga hämtvägar (signerad lagrings-adress respektive transient genererad PDF). Täcker användarberättelser: 6, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Minimalt beteendetest i riktig webbläsare bevisar ny-fliks-öppning för BÅDE signerad lagrings-adress (klass A) och transient genererad PDF (klass B/C) INNAN huvudbygget; faktiskt utfall bokfört i rapporten och testet kastat (throwaway-kontraktet)
- [ ] #2 Varje dokumentrad bär två ikonknappar: förhandsvisning som öppnar dokumentet i NY webbläsarflik i webbläsarens egen visare (synkron fliköppning i klicket, omstyrning när adressen anlänt — popup-blockerar-säker), och nedladdning som sparar filen; gamla Visa-dialogen ersatt för alla tre dokumentklasser
- [ ] #3 Tillgängligheten håller ribban 11: ikonknappar med namngivna tillgängliga etiketter, bevarad fokusordning, contrast-more och reduced-motion gröna
- [ ] #4 Dokument-ytan är i övrigt identisk med facit tasks/sessions/bilagor/s102-dokument-konvergens/facit.json ytan Dokument-ytan lista + Visa-overlayens tre klasser; den beslutade avvikelsen (Visa-dialog ersatt av ikonpar + flik) bokförd i amenderings-sidofil, redo för Marcus omstämpling — godkand-fältet rörs aldrig
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-dokument-konvergens/facit.json (ADR-102 R3) — avvikelser utöver den beslutade: noll
<!-- DOD:END -->
