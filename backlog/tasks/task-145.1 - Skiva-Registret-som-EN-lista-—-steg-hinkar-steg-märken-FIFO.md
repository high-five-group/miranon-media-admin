---
id: TASK-145.1
title: 'Skiva: Registret som EN lista — steg-hinkar, steg-märken, FIFO'
status: To Do
assignee: []
created_date: '2026-08-07 08:57'
updated_date: '2026-08-07 11:39'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-145
ordinal: 233000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta öppnar ett event och ser alla anmälda i en enda lista, sorterad efter vad som återstår: de som väntar på bekräftelse överst, sedan de som saknar anmälningsavgift, sedan de som saknar slutbetalning, sist de klara. Inom varje grupp ligger den som anmälde sig först överst. Hon ser var varje person står på personens eget märke — inga rubriker behövs. Listan scrollar som förut när den blir lång.

Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 10, 25
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Obekräftade- och Bekräftade-rubrikerna är rivna; registret renderas som EN deltagarlista
- [ ] #2 Listan sorteras på fyra steg-hinkar i ordningen väntar på bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist
- [ ] #3 Inom varje hink sorteras personerna i anmälningsordning (äldst registrerad först)
- [ ] #4 Steg-märket ÄR grupperingen — inga sektionsrubriker renderas
- [ ] #5 Exakt ETT märke per person även när flera steg är ogjorda; undantagen (Avbokad, Inställt, På väg till väntelistan) bär egna ärliga märken
- [ ] #6 Inline-scrollen är återanvänd med samma klipphöjd som kön hade — ingen ny höjd mintas
- [ ] #7 Scroll-ytans tillgänglighetsetikett följer sektionen och ärver INTE köns hårdkodade namn
- [ ] #8 Summeringsblocket lämnas ORÖRT av denna skiva — steg-raderna OCH logistik-gruppen (Eventinfo-signalraden, Bor över, Avbokade) står kvar exakt som förut; blocket ägs av TASK-145.2
- [ ] #9 Inga befintliga E2E-filer raderas i denna skiva; ett test vars subjekt flyttar hör till skivan som äger subjektet, inte till denna
- [ ] #10 Markera-lägets kandidatmängd är den RENDERADE listan, inte den gamla obekräftade-kön — samma form facit redan bär (registerListaA), så att senare filtrering följer med automatiskt
- [ ] #11 Markera-knappen har en egen förankring utanför de rivna sektionsrubrikerna; ingen del av markera-lägets ÖVRIGA form (batch-barens knapptext, bekräfta-flödets rivning, interim-utgången) rörs här — den ägs av TASK-145.3
<!-- AC:END -->





## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [ ] #6 test:visual omtagen med granskade baslinjer — drift är väntad, inte accepterad osedd
- [ ] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [ ] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->
