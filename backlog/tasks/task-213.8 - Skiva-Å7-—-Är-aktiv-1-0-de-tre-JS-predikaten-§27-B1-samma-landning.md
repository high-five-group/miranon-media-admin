---
id: TASK-213.8
title: 'Skiva: Å7 — Är aktiv (1/0) + de tre JS-predikaten (§27, B1 samma landning)'
status: Done
assignee: []
created_date: '2026-08-14 17:24'
updated_date: '2026-09-04 08:13'
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
- [x] #1 Anmälningar.Är aktiv (1/0) (fld4j7PeckDViTdIB) utökad så att Status=Inställt exkluderas — verifierat i staging
- [x] #2 Samtliga tre JS-predikat (Deltagare.tsx:153-156, Gruppdynamik.tsx:49-52, AtgardsSida.tsx:3105) uppdaterade till samma semantik i SAMMA PR som bas-fixen, kommentarerna rättade så de inte längre påstår att endast Avbokad/Ombokad räknas bort
- [x] #3 De 2 kända Inställt-anmälningarna i prod går från Är aktiv=1 till 0 efter prod-mutationen; eventsidans register, Gruppdynamik och Åtgärder visar samma antal som basen
- [x] #4 Rollback-väg: bas-formeltexten sparad verbatim, app-ändringen revert-bar som egen commit
- [x] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan bas-fixen rör prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [x] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus-GO för prod-mutationen (citat, källa TASK-368.1 Implementation Notes, S115 Del 4, 2026-09-03): 'Du har GO på fältbytet i prodbasen sedan'. Prod-mutationen (Är aktiv-formeln, exkludera Inställt) utfördes av orkestreraren via claude.ai-Airtable-connectorn 2026-09-03 med detta GO som underlag. Citatet flyttat hit vid nattgrindens stängning 2026-09-04 eftersom DoD #6 kräver citatet i skivans EGNA Implementation Notes, inte enbart i syskonkortet 368.1.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-03 08:54
---
Utförd via TASK-368.1 (S115, 2026-09-03). AC1: Är aktiv-formeln uppdaterad i staging (connectorn), bevisad med fixtur. AC2: de tre predikaten (fyra förekomster: Deltagare.tsx, Gruppdynamik.tsx, AtgardsSida.tsx ×2) konsoliderade till arAktivAnmalan i src/lib/aktiv-anmalan.ts som exkluderar AVBOKAD+INSTALLT, kommentarer rättade, 7 testfall med tvåsidigt bevis — PR #2232, samma leverans som basfixen. AC3: de två Inställt-anmälningarna i prod (Varberg RIM 2026-02-06) går Är aktiv 1→0, eventet 2 anmälningar / 0 aktiva. AC4: Rollback (formeltext verbatim, mätt före ändring, identisk i staging och prod): Är aktiv (1/0) fld4j7PeckDViTdIB = IF({fldWr5cCPNx9HEKtL}="Avbokad/Ombokad", 0, 1); Antal anmälda fldTQkYOz9O2BGEIZ = {fldU5MCQmagdHtz4G} + {fld8pUb6x2G3YIovs}. Återställ = sätt tillbaka de två formlerna och radera rollup-fältet Antal aktiva anmälningar (staging fld1LGJ6HVCLDJhFC, prod fldO9pTic9Mm8G6P4). Antal anmälningar (count, fldU5MCQmagdHtz4G) rördes aldrig. App-ändringen ligger i egna commits (4b7b8cb2 refactor, e1846b80 fix). AC5: Marcus GO citerat i 368.1.
---
<!-- COMMENTS:END -->
