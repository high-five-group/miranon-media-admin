---
id: TASK-213.8
title: 'Skiva: Å7 — Är aktiv (1/0) + de tre JS-predikaten (§27, B1 samma landning)'
status: To Do
assignee: []
created_date: '2026-08-14 17:24'
labels:
  - ready-for-human
dependencies:
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 395000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en anmälan med `Status = "Inställt"` räknas ALDRIG som aktiv
någonstans — varken i basens `Anmälningar.Är aktiv (1/0)` (`fld4j7PeckDViTdIB`)
eller i de tre identiska app-predikaten som i dag replikerar bas-defekten
med avsikt. Eventsidans register, Gruppdynamik och Åtgärder visar samma
antal som basen efter fixen.

**B1 — BAS OCH APP LANDAR I SAMMA PR, inte två.** De tre JS-predikaten
(`src/components/events/detail/Deltagare.tsx:153-156`,
`Gruppdynamik.tsx:49-52`, `src/components/events/atgarder/AtgardsSida.tsx:3105`)
bär i dag kommentaren "Aktiv anmälan (basens 'Är aktiv'-formel): endast
Avbokad/Ombokad räknas bort." — fixas basen ensam blir kommentaren en lögn
och appen fortsätter räkna `Inställt` som aktivt, tyst.

Nuvarande exponering, mätt: 2 anmälningar med `Inställt` i prod, båda `Är
aktiv` = 1 i dag — låg volym, strukturellt fel.

**O3 gör denna skiva till en förutsättning för skiva 9 (Fynd 1), inte
tvärtom** — den enda aktiv-signalen i basen är detta fält; görs Fynd 1:s fix
först ärver den nya event-räknaren denna defekt i stället för att laga den.

Riskklass R2: rollupen `Antal anmälningar (aktiva)` ändras för alla
personer; bas-vyer kan filtrera på den (kartlagd i skiva 2).

**HITL — Marcus-moment, obligatoriskt** för bas-halvan (formeländring i
Airtables UI). App-halvan (de tre predikaten + kommentarerna) kan
förberedas AFK men committas i SAMMA PR som bas-fixen, inte separat. Prod-
mutationen sker ALDRIG utan uttalat Marcus-GO för just denna skiva.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P3 · Å7 (B1), med
underlag i `data-model.md` § Kända fällor post 27 och
`src/domain/types/Status.ts`.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Anmälningar.Är aktiv (1/0) (fld4j7PeckDViTdIB) utökad så att Status=Inställt exkluderas — verifierat i staging
- [ ] #2 Samtliga tre JS-predikat (Deltagare.tsx:153-156, Gruppdynamik.tsx:49-52, AtgardsSida.tsx:3105) uppdaterade till samma semantik i SAMMA PR som bas-fixen, kommentarerna rättade så de inte längre påstår att endast Avbokad/Ombokad räknas bort
- [ ] #3 De 2 kända Inställt-anmälningarna i prod går från Är aktiv=1 till 0 efter prod-mutationen; eventsidans register, Gruppdynamik och Åtgärder visar samma antal som basen
- [ ] #4 Rollback-väg: bas-formeltexten sparad verbatim, app-ändringen revert-bar som egen commit
- [ ] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan bas-fixen rör prod
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
