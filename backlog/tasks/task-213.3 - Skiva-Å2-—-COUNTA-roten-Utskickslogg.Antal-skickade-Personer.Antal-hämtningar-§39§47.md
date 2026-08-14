---
id: TASK-213.3
title: >-
  Skiva: Å2 — COUNTA-roten: Utskickslogg.Antal skickade + Personer.Antal
  hämtningar (§39+§47)
status: To Do
assignee: []
created_date: '2026-08-14 17:22'
labels:
  - ready-for-human
dependencies:
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 390000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: maillogens "Antal skickade" visar det verkliga antalet
mottagare i stället för att mättas vid 1, och ingen intresserad person i
prod förblir osynlig i personlistan/leadsfiltret på grund av samma
`COUNTA`-rot. Två fel, en rot (`COUNTA` mättas vid 1 på länkfält, bevisat
mot 667 prod-personer: 0 länkar → 0, 1 → 1, 2 länkar → FELAKTIGT 1 för 8
personer).

**Del a (§39):** ersätt `COUNTA({Skickat till})` på `Utskickslogg.Antal
skickade` (`fldqJBTOwErzMdCAO`) med en ROLLUP med `COUNT`-aggregering.
`Öppningsgrad (%)` behöver inte röras. `Utskickslogg` är tom i båda
baserna — verifiera med en syntetisk rad i staging med ≥3 länkade mottagare.

**Del b (§47), dubbelt fel:** `Personer.Antal hämtningar` (`fld4UQOdKTvWixZ9F`)
räknar fel RELATION (Engagemang, inte Touchpoints) OCH samma `COUNTA`-cap.
33 personer i prod är mätt osynliga (M-d, `AND({Antal anmälningar
(totalt)}=0, {Antal hämtningar}=0, {Alla hämtningar}!="")`). Peka om till
Touchpoint-relationen med `COUNT`-rollup; avgör samtidigt om `LEAD_FILTER`
(`get-leads/index.ts:23-24`) ska peka om till den nya relationen eller om
Intresserade-vyns räknarrad ska rivas — 33 är inte försumbart, det talar för
att peka om filtret.

**HITL — Marcus-moment, obligatoriskt.** Bas-fixen (båda delarna) rör en
rollup-typändring/omkonfiguration som kräver Marcus-GO per skiva innan prod
muteras (Utskickslogg + Personer rör mail-domänens och Leads-vyns
automationer, riskklass R2 — bas-sidiga konsumenter kartlagda i skiva 2).
App-delen (`LEAD_FILTER`-omstyrningen) kan förberedas AFK men landar inte
förrän bas-fixen är verifierad i staging.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P1 · Å2, med underlag
i `bas-defekt-kartlaggning-live-2026-08-14.md` (Fälla 39, Fälla 46) och
`bas-defekt-konsumtionskarta-2026-08-14.md` §39/§47.

Täcker användarberättelser: 2, 3
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utskickslogg.Antal skickade (fldqJBTOwErzMdCAO) omformad till rollup med COUNT-aggregering över länkfältet Skickat till — verifierat i staging med en syntetisk rad med minst 3 länkade mottagare (fältet visar 3, inte 1)
- [ ] #2 Personer.Antal hämtningar (fld4UQOdKTvWixZ9F) pekar om till korrekt relation (Touchpoints, inte Engagemang) med COUNT-rollup — M-d:s fråga (33 osynliga) kör om efter fixen och ger 0 träffar eller en dokumenterad förklaring
- [ ] #3 Beslut fattat och dokumenterat: LEAD_FILTER (get-leads/index.ts:23-24) omstyrd till den nya relationen, ELLER Intresserade-vyns räknarrad riven med uttalat skäl
- [ ] #4 Rollback-väg: den gamla formeltexten för båda fälten sparad verbatim före ändring
- [ ] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan bas-fixen (båda delarna) rör prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->
