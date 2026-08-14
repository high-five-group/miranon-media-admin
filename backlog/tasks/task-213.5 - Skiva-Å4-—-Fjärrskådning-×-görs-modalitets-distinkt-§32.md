---
id: TASK-213.5
title: 'Skiva: Å4 — Fjärrskådning × görs modalitets-distinkt (§32)'
status: To Do
assignee: []
created_date: '2026-08-14 17:23'
labels:
  - ready-for-human
dependencies:
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 392000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: `Fjärrskådning ×` görs modalitets-distinkt — räknaren skiljer
`Typ`/`Session` (Utbildning vs. Föreläsning) i stället för att summera över
alla 322 FS-Deltaganden oavsett modalitet. Antingen ett sessionsfilter i
källformeln (mall B, `Genomfört event`-mönstret som redan finns i basen)
eller en separat föreläsnings-räknare — vilken form beror på om fältet ska
betyda "FS-kurs" eller "FS totalt" (`ADR-064`:s taxonomi styr valet).

**Detta är en SKYDDSRÄCKE-skiva, inte en värde-skiva i sig — skriv det i
kortet, annars ser den ut som lågprioriterat arbete.** §32 konsumeras inte
av appen i dag (segmentmotorn räknar från Deltaganden, noll träffar i
konsumtionskartan). Den görs ändå, och FÖRE skiva 6, eftersom **O1** kräver
det: stäms de 16 oavstämda föreläsnings-Deltagandena (skiva 6, §34) av
INNAN denna skiva landar, får 14 föreläsningsrader `Närvaropoäng` = 1 och
räknas felaktigt in som FS-kurs — ett nytt, latent fel aktiverat av fel
ordning.

Verifiering: efter fixen summerar `Fjärrskådning ×` endast över de 308
utbildningsraderna, inte alla 322.

**HITL — Marcus-moment, obligatoriskt.** Formeländring i Airtables UI (eller
nytt fält), riskklass R1, men prod-mutationen sker ALDRIG utan uttalat
Marcus-GO för just denna skiva.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P2 · Å4, med underlag
i `bas-defekt-kartlaggning-live-2026-08-14.md` (Fällorna 31/32/34) och
`data-model.md` § Kända fällor post 32/34.

Täcker användarberättelser: 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fjärrskådning × räknar endast de 308 utbildningsraderna (Event typ ≠ Föreläsning), inte alla 322 FS-Deltaganden — verifierat i staging
- [ ] #2 Formvalet (sessionsfilter i källformeln vs. separat föreläsningsräknare) beslutat mot ADR-064:s taxonomi och dokumenterat i Implementation Notes
- [ ] #3 Rollback-väg: den gamla formeltexten sparad verbatim
- [ ] #4 Marcus-GO för prod-mutationen inhämtat och citerat innan formeln ändras i prod
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
