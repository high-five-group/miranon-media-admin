---
id: TASK-59.5
title: 'Skiva: Mer-ytan till acceptance-klassen'
status: To Do
assignee: []
created_date: '2026-07-27 20:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.4
parent_task_id: TASK-59
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-ytans sex filer — anmälningar, intresserade, maillogg, väntelista, segment och segment-utskick — flyttas till acceptance-klassen.

BETEENDET ÄNDE-TILL-ÄNDE: hela Mer-ytan svarar ur det mutexfria jobbet. Segment-filerna är ytans tyngsta: de rör beräknat medlemskap och utskick, alltså vyer vars svar är sammansatta. De bevisar efter flytten samma sak som före — att appen renderar och beter sig rätt givet svar av rätt form.

VARFÖR SEX FILER I EN SKIVA: de delar yta, och en granskare som ser Mer-ytan flytta i ett stycke kan hålla hela ändringen i huvudet. Sex godtyckliga filer hade krävt att granskaren håller sex separata sammanhang.

SÄRSKILT ATT SE UPP MED: utskicks-filen rör en muterande Edge Function. Den skriver inte skarpt — anropet är avlyssnat och testet verifierar payloaden appen skickar plus hur gränssnittet reagerar på svaret. Skrivbeviset ligger i API-sviten och ska ligga kvar där. Flyttas något som faktiskt skriver är klassningen fel och skivan ska stanna.

Täcker användarberättelser: 1, 5, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mer-ytans sex filer kör i acceptance-klassen och är gröna
- [ ] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [ ] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [ ] #4 Klassningen av de sex filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [ ] #5 Utskicks-filen verifierar fortfarande PAYLOADEN appen skickar — inget skrivbevis har flyttats ur API-sviten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Klassningen av varje flyttad fil är HÄRLEDD ur hermetik-mätdatan och räkningen redovisad — ingen handplockning
- [ ] #6 Varje flyttad fil har tvåsidigt bevis: passerar hermetiskt OCH vakten fäller när dess mockar tas bort
- [ ] #7 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
