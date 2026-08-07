---
id: TASK-145.3
title: 'Skiva: Markera-läget över visad lista och utgången mot Åtgärds-sidan'
status: To Do
assignee: []
created_date: '2026-08-07 08:58'
updated_date: '2026-08-07 16:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
  - TASK-145.2
parent_task_id: TASK-145
ordinal: 235000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta filtrerar fram de nio som saknar slutbetalning, slår på Markera, bockar sex av dem och trycker Åtgärder. Urvalet följer med vidare. Hon kan lika gärna markera utan att först filtrera. När hon slår på markera-läget hoppar inte sidan.

Täcker användarberättelser: 11, 12, 13, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Att slå på och av markera-läget förskjuter inte sidans innehåll vertikalt (mätt i renderad DOM)
- [x] #2 Batch-barens primärknapp bär texten Åtgärder och tar urvalet vidare; bekräfta-flödet med kontrollfråga är RIVET ur eventsidan, inte dolt
- [x] #3 Utgången är en ärlig interim-platshållare så länge Åtgärds-sidan inte finns — ingen chevron som lovar en navigation som saknas
- [x] #4 Avprickningens E2E-täckning hanteras EXPLICIT när bekräfta-flödet rivs: filen tas inte bort tyst utan att TASK-147 bär skulden att återupprätta täckningen på Åtgärds-sidan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-145.3 — markera-läget över visad lista, utgången mot Åtgärds-sidan.

RÖRDA FILER
- src/components/events/detail/Deltagare.tsx — bekräfta-flödet rivet; registrets
  filtrerade och ofiltrerade gren enade; batch-baren bär alltid Åtgärder.
- tests/e2e/event-bekraftelse.staging.test.ts — täckningen omtagen (se AC #4).
- tests/e2e/event-deltagare.staging.test.ts — sex PRE-EXISTERANDE röda lagade
  (145.2:s rivna summeringsrader + 145.4:s inflyttade arbetsyta i DOM).

AC-UTFALL, MÄTT (26/26 gröna, chromium-authenticated, EXIT=0)
- AC #1: registrets top (scroll-justerad), documentElement.scrollHeight och
  batch-barens höjd mätta i renderad DOM över fyra tillstånd (vilande → aktivt →
  med urval → efter avbryt). Delta ≤ 1 px i samtliga.
- AC #2: primärknappen bär "Åtgärder"; noll träffar på /^Bekräfta \d+ anmäl/ i
  båda lägena; noll role=dialog; confirmCalls.length === 0 efter Markera alla +
  Åtgärder. Markera-läget verkar över filtrerad vy (3 ofiltrerat → 2 filtrerat,
  live-räknaren "2 av 2 markerade", filtret kvar efter Åtgärder).
- AC #3: knappen är disclosure (aria-expanded/aria-controls), inget <a> mot
  /atgarder i sektionen, noll <a> i platshållaren, texten "Åtgärds-sidan är inte
  byggd ännu".
- AC #4: sju test borttagna med skulden bokförd på TASK-147, ett borttaget utan
  skuld (arkivet är rivet av 145.1), tio adapterade, fyra tillkomna. Filen står
  kvar. Uppräkningen per test i describe-blockets docblock.

DIVERGENS ATT VETA
- Registrets FILTRERADE vy sorterades inte alls före denna skiva (visade.filter,
  källordning). Den läser nu registerLista (steg-hink + FIFO), och avbokade
  FIFO-sorteras. Samma register kunde annars visa samma personer i två ordningar.

EJ KLARADE DoD, MOTIVERADE
- DoD #3 (CI grön per jobb): ägs av orkestrerarens svep efter push.
- DoD #5 (design-review mot S93:s FACIT-bilder): bilderna finns inte i repot och
  fanns inte i uppdraget. Renderad yta granskad mot visual-fixturens faktiska
  utfall i stället; drift bokförd.
- DoD #6 (test:visual omtagen): KAN INTE göras lokalt. De committade
  baslinjerna är *-linux.png; *-darwin.png är gitignorade (.gitignore:97).
  Etablerad praxis är "baseline-uppdatering ur CI (run N)". FYND: den
  committade linux-baslinjen visar formen FÖRE TASK-145.1 (Obekräftade
  anmälningar / Anmälningsbekräftelse skickad / accordion-paret / eget
  Betalningar-block) — stale sedan tre landade skivor, senast uppdaterad i
  37e638df (run 30295150783).
- DoD #7 (skrivvägs-frånvaron mekaniskt bevisad): ägs av TASK-145.5. Denna skiva
  bevisar sin egen del — bekräftelse-EF:en anropas aldrig.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
