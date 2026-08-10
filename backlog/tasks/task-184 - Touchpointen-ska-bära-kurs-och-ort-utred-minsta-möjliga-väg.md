---
id: TASK-184
title: Touchpointen ska bära kurs och ort - utred minsta möjliga väg
status: To Do
assignee: []
created_date: '2026-08-10 09:16'
updated_date: '2026-08-10 10:16'
labels:
  - bas-maximering
  - utredning
dependencies: []
ordinal: 349000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Senaste interaktion-texten på Personer ska kunna säga 'Anmälde sig till RIM 1 i Trollhättan 7 maj 2026', men Touchpoints-tabellen har i dag ingen väg till kursen eller orten. Utred vad som FAKTISKT krävs - antagandet att det behövs backfill är oprövat (Marcus invändning 2026-08-10: ett länkat fält plus lookup kan räcka om länken går att härleda). Gäller BÅDA baserna. Föregås av S103:s formeländring som redan ger erbjudande- och deltagandegrenarna rätt text.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Utredningen redovisar minsta möjliga väg med belägg per steg,Backfill-behovet är avgjort mot faktisk data och inte antaget,Vägen är prövad i staging innan prod,Båda basernas paritet är verifierad och inte antagen
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BYGGT OCH VERIFIERAT 2026-08-10 i BÅDA baserna (prod app8uGPrVCVOm6LfD, staging apphjj8Q7lkXCMsL4). Anmälningsgrenen i Personer.Senaste interaktion (text) bär nu kurs och ort: 'Anmälde sig · 19 apr 2026' -> 'Anmälde sig · RIM 1, Rönninge · 19 apr 2026'. Noll backfill, ingen automationsändring, inget nytt länkfält.

ÅTTA NYA FÄLT (alla beräknade -> fick värde på alla befintliga rader direkt). Anmälningar: Ort (from Event) prod fld5560T3pQZSUBaJ / stg fldUhHceqBud4BHvf; Kurs (from Event) prod fldfqU6MfBQdaeLUk / stg fldcTDSzGBG0bHjl3; Anmälan datetimekey prod fldfQqBjqGHLSazAs / stg fldDdlU7w1aItf8XA; Person - senaste anmälan datetimekey prod fldoSStIK36rdxKtj / stg fldBtpOlRnWXspbip; Senaste anmälan (sammanfattning) prod fldEos4UvVBpk2reB / stg fldwgo1fJirUwUiOC. Personer: Senaste anmälan datum prod fldmx8O7LQPdopD6T / stg fldEEdTZA9sUpVQaI; Senaste anmälan datetimekey prod fldj5IxwmjJ3giZhT / stg fldeiyO7B8xDzBB2D; Senaste anmälan (text) prod fldmNo7XJBdfs8heT / stg fldIvGODBIoW9TZbn. Två ändrade formler: fldRnujWHT3ADToC1 + fldXZyVlSKg5mX8rP (originalen verbatim i data-model.md-noten och i slutrapporten).

GRINDEN I STÄLLET FÖR RADORDNING: sammanfattningen fylls bara på personens senaste anmälan (radens datetimekey == personens max), så rollupen får exakt ett värde. Nödvändigt, inte omväg: MÄTT att länkcellens ordning är STIGANDE (recPyHkKMh7kJyZJ4) medan de befintliga rollupparnas utdata är FALLANDE -> ordningen kommer från en vy-/filterinställning som API:t varken visar eller kan sätta. En API-byggd rollup hade tagit ÄLDSTA raden.

TIE-BREAK: anmälan slår touchpoint så länge touchpointen inte ligger på en SENARE DAG, jämfört på heltalsnycklar (rollupens datumvärde exponeras som datum-typ, så tidsprecision får ej vara bärande). A2:s lagg mätt 3,6-6,7 s. SKARPT BEVIS prod: 6 verkliga personer flippade från fattig till rik sträng (rec0C4Rdo8Wg5esRH 'Anmälde sig · 19 apr 2026' -> 'Anmälde sig · RIM 1, Rönninge · 19 apr 2026'). Regression: recPyHkKMh7kJyZJ4 (deltagande 1 maj > anmälan 19 apr) oförändrad; personer utan anmälan oförändrade; touchpoint senare dag vinner fortfarande (rec1qhf7bahzX8vr0). Negativt kontrolltest i staging med temporär touchpoint-fixtur (skapad, flyttad ett dygn, raderad).

OMÄTT/ÖPPET: 3 prod-personer visar fortfarande fattig sträng - samtliga har 0 anmälningar (föräldralös anmälnings-touchpoint, känd klass F.1/fälla 12). Tre systerfält (fldT1yVpCFa5Zyrji, fld6wQp5K9VAcFskd, fld9wrmfhSParaxOz) räknar fortfarande senaste interaktion utan anmälningskandidaten - läses INTE av appen, lämnade utanför scope, bokförd som öppen skuld i data-model.md. Midnattskanten dokumenterad.

NYTT MÄTT FAKTUM (stänger kortets omätt-punkt): staging BÄR samma automationer A1-A11 inkl. A2 wflRPMp5QNGEa7wH1 (samma ID som prod, samma nodstruktur) men samtliga är deploymentStatus undeployed.

DOCS: data-model.md ny sektion 'Fält tillagda i augusti 2026'; airtable-constraints.md ny post P30 (formler når bara länkade tabeller; länkfält kan ej beräknas) + ändringslogg; CLAUDE.md 29->30 poster. markdownlint + vale + npm run check:docs (14/14) gröna. Ocommittat i worktree s103-t97-personvyerna.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
