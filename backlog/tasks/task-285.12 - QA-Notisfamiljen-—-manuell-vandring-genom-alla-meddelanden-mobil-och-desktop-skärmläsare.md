---
id: TASK-285.12
title: >-
  QA: Notisfamiljen — manuell vandring genom alla meddelanden, mobil och
  desktop, skärmläsare
status: Done
assignee: []
created_date: '2026-08-21 11:22'
updated_date: '2026-08-24 13:58'
labels:
  - ready-for-human
dependencies:
  - TASK-285.1
  - TASK-285.2
  - TASK-285.3
  - TASK-285.4
  - TASK-285.5
  - TASK-285.6
  - TASK-285.7
  - TASK-285.8
  - TASK-285.9
  - TASK-285.10
  - TASK-285.11
parent_task_id: TASK-285
ordinal: 527000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, efter rivningen, mot staging-preview eller prod-kandidat):

1. NY VERSION. Öppna appen på mobil (390 px) och desktop, stå på /personer med en sökning igång. Trigga en ny version (deploy eller DEV-eventet). Förväntat: notisen dyker upp nere till höger ovanför TabBar-pillen utan att listan flyttar sig; 'Inte nu' döljer den; navigera till /hem och tillbaka — den är fortfarande dold; öppna ny flik — den syns igen. Den försvinner aldrig av sig själv.
2. CHUNK-FEL. Låt en session överleva en deploy och klicka på en annan flik. Förväntat: bannern under sidans rubrik i innehållets bredd, 'Sidan behöver laddas om', varningen om osparad text, 'Ladda om' fungerar; uppdateringsnotisen syns inte samtidigt.
3. OFFLINE. Stäng av nätet. Förväntat: 'Du är offline' som överlagrad notis, ingen knapp, sidan flyttar sig inte; slå på nätet — den försvinner. Slå av nätet medan en ny version väntar — båda syns staplade och helt inom skärmen på mobil.
4. FEL INNE PÅ SIDOR. Provocera ett sparfel (t.ex. felaktigt lösenord på /nytt-losenord) och ett sektionsfel (/dev-fel i DEV). Förväntat: samma ruta överallt — ingen kontur, vänsterkant, rubrik i färg, knappar höger under texten; felrutor saknar kryss, kvitton har det på rubrikens linje.
5. APPFEL. Provocera appfel (DEV-väg). Förväntat: centrerat kort utan kontur, 'Appen kunde inte visas', mörk 'Ladda om'.
6. SKÄRMLÄSARE (VoiceOver). Ny version: annonseras artigt utan att fokus flyttas. Chunk-fel: annonseras direkt. Navigera landmärken: ingen tom alert-region någonstans.
7. TANGENTBORD. Från sidans början: Tab till notisens knappar inom ett fåtal steg, fokusring synlig, Enter laddar om.
8. HÖGKONTRAST + REDUCED MOTION (systeminställningar). Rutorna får kontur i sin färg; inget animeras.
9. COPY. Läs varje text högt: säger den vad som hände, vad som hände med det jag skrev, och vad jag gör? Ingen 'Något gick fel'.
10. PRINT. Skriv ut en vy med notis synlig — notisen finns inte på pappret.

Varje avvikelse blir ett NYTT fynd-kort med exakt symptom och förväntat beteende.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Punkt 1–10 genomgångna av Marcus på mobil och desktop; utfall per punkt bokfört i notes
- [ ] #2 Varje avvikelse har ett eget fynd-kort; inga avvikelser är lösta ad hoc utan kort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVSTÅDD PÅ MARCUS BESLUT 2026-08-22, verbatim: 'Nej inget Q&A, skit i det. Gör klart allt de andra.' — citatet står källmärkt i föräldrakortet TASK-285 § Implementation Notes rad 134 (verifierat: grep -n 'Nej inget Q&A' mot task-285-filen ger exakt den raden). Den 10-punkts manuella vandringen körs därmed inte; AC #1/#2 kan inte bockas mot belägg — lämnas OBOCKADE med avsikt, inte tyst. DoD #1 ('alla AC avbockade') lämnas ALLTSÅ ocheckad med avsikt — dess bokstav är osann, och kortets Done-status vilar i stället på Marcus explicita avskrivning, inte på DoD #1. DoD #2/3/4 checkade: ingen kod ändrad (backlog-endast), path-scopad diff, CI verifieras av orkestreraren efter push. STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad).

RÄTTELSE: DoD #3 (CI grön per jobb på pushad commit) avbockad igen — denna bokföringscommit är ännu opushad, och CI-verifieringen är orkestrerarens ansvar efter push (samma konvention TASK-169 dokumenterar för S112:s bokföringspass).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Marcus avstod QA verbatim 2026-08-22 ('Nej inget Q&A, skit i det. Gör klart allt de andra.'), källa: TASK-285 § Implementation Notes rad 134. Kortet stängs som formellt avskrivet, inte som genomfört — den 10-punkts vandringen kördes aldrig. Bokförd stängning, S112 städvåg A.
<!-- SECTION:FINAL_SUMMARY:END -->
