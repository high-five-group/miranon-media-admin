---
id: TASK-213.6
title: 'Skiva: Å5 — Stäm av de 16 oavstämda föreläsnings-Deltagandena (§34)'
status: To Do
assignee: []
created_date: '2026-08-14 17:23'
updated_date: '2026-08-24 14:44'
labels:
  - ready-for-human
dependencies:
  - TASK-213.5
parent_task_id: TASK-213
ordinal: 393000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: de 16 oavstämda föreläsnings-Deltagandena (spridda över 4
historiska event, `Status = "Ej avstämt"` → `Närvaropoäng = 0`) stäms av i
basen, och ett föreläsnings-segment i segmentbyggaren går från 0 till ett
tal som matchar antalet distinkta personer i stället för att felaktigt visa
"ingen gick föreläsningen". Ren datahandling — ingen formel ändras.

**O1 är OBLIGATORISK och kodad som `--dep` på denna skiva:** bekräfta att
Å4 (skiva 5, `Fjärrskådning ×` modalitets-distinkt) är landad och verifierad
INNAN dessa 16 rader stäms av — annars aktiveras ett fel för 14 rader som i
dag är osynligt.

**R3 — datamutation, ingen formel.** Rollback kräver att de 16 record-ID:na
och deras `Status`-värde FÖRE ändringen sparas — utan förbilden går
handlingen inte att ångra exakt.

**HITL — Marcus-moment, obligatoriskt.** Manuell datahandling i Airtables
UI (avstämning av 16 rader), riskklass R3. Prod-mutationen sker ALDRIG utan
uttalat Marcus-GO för just denna skiva, och rollback-förbilden (record-ID:n
+ ursprungligt `Status`) sparas FÖRE handlingen — inte efter.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P2 · Å5, med underlag
i `bas-defekt-kartlaggning-live-2026-08-14.md` (Fälla 34) och
`data-model.md` § Kända fällor post 34.

Täcker användarberättelser: 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De 16 identifierade föreläsnings-Deltagandena (Event typ = Föreläsning, Status = Ej avstämt) avstämda i staging — Närvaropoäng blir 1
- [ ] #2 Ett föreläsnings-segment i segmentbyggaren räknar det verkliga antalet distinkta personer i stället för 0, verifierat efter avstämningen
- [ ] #3 Rollback-förbild sparad FÖRE handlingen: samtliga 16 record-ID:n plus deras Status-värde före ändring
- [ ] #4 Skiva 5 (Å4/O1) bekräftat landad och verifierad innan denna skivas datahandling utförs
- [ ] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan de 16 raderna stäms av i prod
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112-förberedelse (2026-08-24) — PREMISSDIVERGENS FUNNEN (ADR-086, byggs inte tyst vidare på): kortets "16 identifierade Deltaganden" (data-model.md §34, verifierat MCP 2026-06-25) är NU 11, spridda över 3 event (ej 4), mätt live i prod (app8uGPrVCVOm6LfD) 2026-08-24 via filterByFormula AND({Event typ}="Föreläsning",{Status}="Ej avstämt"). Troligen har 5 rader stämts av manuellt mellan 2026-06-25 och nu. AC#1:s "16" och AC-listans exakta tal behöver uppdateras/omprövas i S113 innan avstämning.
Rollback-förbild (AC#3), redan insamlad (read-only): 11 record-ID:n + nuvarande Status="Ej avstämt" — Varberg FS 2026-02-05 (4 st: recPhYgKEz49Up5Tq, recfeh2sNe3bmywNh, rectGNsXqPp9l2xI9, recut1m0Uwzr8pztY), Falköping FS 2026-03-19 (5 st: recVXJqNRH1juZAGz, recXdnLkSUP1FHavo, recoBN6545z2CTIof, recwnrzB2k9KOoZRt, recx2zXe5oFAWP1Ci), Varberg RIM 2026-02-06 (2 st: recA31AxDBiFL6MeJ, recLdjKa3HRTs2sFM).
Staging-gap: samma query mot staging (apphjj8Q7lkXCMsL4) gav bara 1 rad, en synthetic ZZ-Checkin-fixtur — staging speglar INTE denna defekt. AC#1:s "verifierat i staging"-krav går inte att uppfylla mot verklig data i nuvarande staging-bestånd; kräver antingen en seedad motsvarighet eller en omtolkning av verifieringsvägen. Flaggas för Marcus-beslut i S113, inte löst här.
<!-- SECTION:NOTES:END -->
