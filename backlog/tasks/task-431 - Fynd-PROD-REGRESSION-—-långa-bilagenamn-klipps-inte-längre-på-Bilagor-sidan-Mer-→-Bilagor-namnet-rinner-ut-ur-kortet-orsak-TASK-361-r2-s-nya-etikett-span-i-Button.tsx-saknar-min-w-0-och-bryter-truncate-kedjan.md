---
id: TASK-431
title: >-
  Fynd: PROD-REGRESSION — långa bilagenamn klipps inte längre på Bilagor-sidan
  (Mer → Bilagor), namnet rinner ut ur kortet; orsak TASK-361 r2:s nya
  etikett-span i Button.tsx saknar min-w-0 och bryter truncate-kedjan
status: To Do
assignee: []
created_date: '2026-09-07 16:46'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 759000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Marcus i prod 2026-09-07 (S123 resume 1), verbatim: 'Jag gick in på RIM 1 i Rönninge 12-13 sep, där ligger en bekräftelsebilaga med långt namn, och HELA namnet skrivs ut långt utanför själva kortet!!! Så var det inte förut. Namnet måste ju klippas!!' Forensik (orkestreraren, samma dag): src/components/dokument/DokumentYta.tsx är oförändrad sedan 2026-08-30 och bygger uttryckligen klippningen på min-w-0 i varje flex-led (docblock 'NAMNET TRUNKERAS I STÄLLET FÖR ATT RADBRYTA … min-w-0 på kolumnen, knappen och namn-spannet', rad ~1781; namn-spannet rad ~1905 'min-w-0 truncate'). src/components/primitives/Button.tsx ändrades av TASK-361 (c4c65e40 + ac2143f7, 2026-09-02, PR #2212): r2 renderar children inuti ett NYTT span 'inline-flex items-center justify-center' (rad ~338, 'ETIKETTEN ÄGER MÅTTET, ENSAM') — ett flex-item utan min-w-0 (och utan w-full/max-w-full) mellan knappen och konsumentens truncate-span. Ett flex-item har min-width:auto och kan inte krympa under sitt innehåll, så truncate når aldrig sin gräns och namnet rinner ut. Prod deployades efter 09-02, därav 'så var det inte förut'. Hypotesen är härledd ur diffen, INTE reproducerad — steg 1 är att reproducera hermetiskt. Åtgärd: (1) reproducera i fixturvärlden: DokumentYta (route /mer/dokument) med en bilaga vars namn är längre än kortets bredd, mät med boundingBox att namn-spannets högerkant ligger utanför kortets (rött först); (2) fix i Button.tsx: etikett-spannet får 'min-w-0 max-w-full' (och behåll r2:s invariant att laddläget inte ändrar måttet — kör TASK-361:s befintliga tester); (3) samma test grönt efter fixen (namn-spannets högerkant ≤ kortets, text-overflow synlig via scrollWidth > clientWidth); (4) svep: grep alla Button-konsumenter som skickar truncate/min-w-0-barn (t.ex. AtgardsSida rad ~704, ~1812 om de sitter i Button) och pröva minst två till; (5) mobil viewport 390 px ingår i mätningen. Lotta-blockerare: prioritet HIGH, byggs före allt annat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hermetiskt acceptance-test (fixturvärlden) på /mer/dokument med långt bilagenamn: rött FÖRE fixen (boundingBox: namnets högerkant > kortets högerkant), grönt EFTER, på desktop och mobil 390 px
- [ ] #2 Button.tsx: etikett-spannet bär min-w-0 max-w-full; TASK-361:s befintliga tester (laddläget ändrar aldrig måttet) fortsatt gröna, tvåsidigt bevisat
- [ ] #3 Svep över Button-konsumenter med truncate-barn bokfört i notes (minst två ytterligare prövade), inga nya överflöden
- [ ] #4 DoD-kommandona gröna; hermetik-självtestet grönt för den nya filen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
