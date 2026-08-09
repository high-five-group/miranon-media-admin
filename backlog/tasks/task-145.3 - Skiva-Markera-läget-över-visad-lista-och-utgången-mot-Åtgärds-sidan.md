---
id: TASK-145.3
title: 'Skiva: Markera-läget över visad lista och utgången mot Åtgärds-sidan'
status: Done
assignee: []
created_date: '2026-08-07 08:58'
updated_date: '2026-08-09 08:19'
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

[TASK-169, backlog-städet, 2026-08-09] DoD #5+#6 bockade mot belägg. DoD#5 (design-review mot S93-facit): TASK-162.5 (PR #1022, merge 8eda0da5, 2026-08-08T19:24:59Z) — Marcus verbatim: 'Jag har tittat på Q&A-kortet och jag godkänner, allt verkar funka och se ut som det ska på eventsidan', checklistpunkt A4 (avdelaren/batch-baren) explicit OK. Granskningen skedde på dev-server-state EFTER 145.3s kod landat (PR #929, merge d210897a, 2026-08-07T17:02:24Z) — reviewen täcker alltså denna skivas yta. DoD#6 (baslinje omtagen EFTER godkänd promovering, ADR-103 B4): baseline-commit cfd76b79 (2026-08-08T21:29:17Z) och PR #1027 (merge 3f716ee5, 2026-08-09T06:50:28Z) ligger BÅDA efter godkännandet (PR #1022, 2026-08-08T19:24:59Z) — uppfyller B4s sekvenskrav.

[TASK-169, backlog-städet, 2026-08-09] KORRIGERING — denna ruta missades i mitt tidigare svep (upptäckt av en faktisk lokal körning av check-backlog-closure.sh, inte av forskningsagenterna). DoD#7 bockad mot belägg: kortets EGNA notes säger uttryckligen 'DoD #7 (skrivvägs-frånvaron mekaniskt bevisad): ägs av TASK-145.5. Denna skiva bevisar sin egen del — bekräftelse-EF:en anropas aldrig.' TASK-145.5 är nu Done med sitt eget DoD#7 checkat (AC#1+#2, mekanisk grind för HELA eventsidan, tvåsidigt bevisad — grön mot faktiskt träd, röd mot injicerad mailto-länk).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Alla AC (1-4) och all DoD (1-8) uppfyllda och bockade. Kod landad 2026-08-07 (PR #929). Design-review + baseline-krav (DoD#5/#6) stängda 2026-08-09 mot TASK-162.5s Marcus-godkännande (PR #1022) och den efterföljande baseline-omtagningen (PR #1027) — se implementation notes för full källkedja. Stängt av TASK-169 (backlog-städet).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 Baslinje omtagen EFTER godkänd promovering (ADR-103 B4)
- [x] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
