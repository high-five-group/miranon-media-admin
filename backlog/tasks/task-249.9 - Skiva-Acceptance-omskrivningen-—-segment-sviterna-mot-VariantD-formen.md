---
id: TASK-249.9
title: 'Skiva: Acceptance-omskrivningen — segment-sviterna mot VariantD-formen'
status: To Do
assignee: []
created_date: '2026-08-17 05:33'
updated_date: '2026-08-17 06:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.5
  - TASK-249.6
parent_task_id: TASK-249
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Segment-ytans acceptance-skydd skrivs om så den promoverade VariantD-formen bär samma testtäckning som den gamla SegmentBuilder-ytan hade. TASK-249.5 flippade /mer/segment till VariantD (ADR-103 B2 steg 1); de fyra befintliga sviterna (mer-segment.acceptance.test.ts, mer-segment-send.acceptance.test.ts, mer-segment-send-aktivitetslogg.acceptance.test.ts, mer-segment-spara-aktivitetslogg.acceptance.test.ts, 17 tester totalt) testade alla SegmentBuilder-UI:t ("Bygg segment"-rubriken, RadioGroup Inkludera/Exkludera/Ignorera) som inte längre renderas på den route.

KORRIGERAT UNDER TASK-249.5:s BYGGE (2026-08-17, CI-rundan 31999164757 fällde först): test.skip visade sig vara STRUKTURELLT OTILLÅTET i acceptance-klassen — hermetik-självtestet (scripts/hermetik-sjalvtest.mjs) kräver att VARJE test fälls med OmockadRequestError när fixturvärlden töms, och ett skippat test rapporterar skipped i stället för unexpected, vilket räknas som en avvikelse (redan dokumenterat: tasks/lessons.d/acceptance-klassens-sjalvtest-tillater-ingen-parkering.md, TASK-214.4-precedentet). Fixen: de tre filerna (send/send-aktivitetslogg/spara-aktivitetslogg, 7 tester) RADERADE helt (git rm); mer-segment.acceptance.test.ts skrevs om till att bara innehålla ett nytt, LIVE axe-smoke-test mot den promoverade formen (de nio SegmentBuilder-specifika testerna borttagna, inte skippade). Innehållet finns kvar i git-historien (commit före denna rättning) om det behövs som referens vid omskrivningen.

OBSERVERA: sändningen (send-email) och sparandet (save-segment) är fortfarande NO-OP/simulerade i VariantD (AC#1 i TASK-249.5: den promoverade formen är identisk med den körande prototypen i variant d-läge) — send-/spara-relaterade tester kan därför inte återskapas mot verkligt beteende förrän/om den skarpa mutations-wiringen byggs i ett separat kort. Detta korts scope är därför primärt mer-segment.acceptance.test.ts (läs-/räkne-vägen, som ÄR skarp efter TASK-249.5); send-/spara-testerna återskapas bara om mutations-wiringen byggs, eller arkiveras medvetet om PRD:n beslutar att no-op-formen är permanent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De skippade testerna i mer-segment.acceptance.test.ts (läs-/räkne-vägen) omskrivna mot VariantD:s faktiska DOM/flöden (mallvyn, verkstaden, segment-detaljvyn); beteendet de bevisade (taxonomi-rendering, klartext-spegling, tomt-resultat-neutralitet, export) bevaras
- [ ] #2 mer-segment-send*.test.ts och mer-segment-spara-aktivitetslogg.acceptance.test.ts: antingen omskrivna (om skarp mutations-wiring byggts i ett separat kort dessförinnan) eller medvetet kvarlämnade skippade med uppdaterad motivering — aldrig tyst bortglömda
- [ ] #3 Samtliga sviter gröna lokalt och i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
