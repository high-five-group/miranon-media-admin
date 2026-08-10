---
id: TASK-184
title: Touchpointen ska bära kurs och ort - utred minsta möjliga väg
status: To Do
assignee: []
created_date: '2026-08-10 09:16'
updated_date: '2026-08-10 09:30'
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
- [ ] #1 Utredningen redovisar minsta möjliga väg med belägg per steg,Backfill-behovet är avgjort mot faktisk data och inte antaget,Vägen är prövad i staging innan prod,Båda basernas paritet är verifierad och inte antagen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UTREDNING KLAR 2026-08-10 (read-only, inget ändrat i någon bas). Full text: docs/research/touchpoint-kurs-och-ort-2026-08-10.md (ocommittad i worktree s103-t97-personvyerna).

SVAR: Ingen backfill krävs - men inte av det skäl invändningen antog. (1) Touchpointen kan INTE bära kurs/ort utan nytt länkfält, och ett länkfält kan inte fyllas av formel (Airtable-förstapart: 'Lookup fields can only pull data from tables that are already connected via a linked record field' + 'no built-in way to have a linked record field computed automatically by a formula'). Den vägen kräver backfill. (2) Men den vägen behövs inte: anmälnings-grenen läses direkt ur Anmälningar via den REDAN FYLLDA länken Personer.Anmälningar (fld8pOivka8YdiywK) - 7 anmälningar i hela prod saknar person-länk. Lookups/formler/rollups är beräknade och får värde på alla gamla rader direkt.

HÄRLEDNING FÖLL PÅ MÄTNING: 12 personer med >=4 anmälningar i prod - TP-antal lika med anmälnings-antal i 4 fall, LÄGRE i 5, HÖGRE i 3. Ej 1:1 åt något håll. Mekanism läst live ur A2 (wflRPMp5QNGEa7wH1): grenen 'Om person utan namn hittades' skapar ingen touchpoint alls.

ÖVRIGT MÄTT: Metadata tomt i 100% av Touchpoints (kontrollmätt), Kanal likaså. Kontaktlogg har ingen väg till Anmälningar/Eventplanering. Anmälningar.Inskickad är patchig - använd Rad skapad. Backfill-anmälningar har tom egen Ort/Vill anmäla sig till, så kurs+ort måste hämtas från Eventplanering via Event-länken (2 nya lookups).

MINSTA VÄG (7 steg): lookups Ort+Event(text) från Event på Anmälningar -> formelfält Anmälan (sammanfattning) -> rollup på Personer -> rollup MAX(Rad skapad) -> utvidga Senaste interaktion (text)/(datum) till trevägsval med explicit tie-break -> staging före prod (nya fält får olika ID per bas) -> bokför i data-model.md + ny post i airtable-constraints.md.

OMÄTT: rollupens aggregeringsfunktion (API exponerar den inte - måste läsas i UI); staging-automationerna (connectorn nekar staging, P24 blockar PAT-servern); överskotts-touchpointerna saknar läst mekanism; målsträngens datumval (eventdatum vs interaktionsdatum) och kortformen 'RIM 1' finns inte i data - kräver Marcus-beslut.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
