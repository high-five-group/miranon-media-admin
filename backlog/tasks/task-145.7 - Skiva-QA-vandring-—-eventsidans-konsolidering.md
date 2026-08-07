---
id: TASK-145.7
title: 'Skiva: QA-vandring — eventsidans konsolidering'
status: To Do
assignee: []
created_date: '2026-08-07 09:03'
labels:
  - ready-for-human
dependencies:
  - TASK-145.1
  - TASK-145.2
  - TASK-145.3
  - TASK-145.4
  - TASK-145.5
  - TASK-145.6
parent_task_id: TASK-145
ordinal: 239000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan i browsern, mot ett event med anmälningar i blandade tillstånd:

1. Öppna eventet. Kontrollera att registret är EN lista, att ordningen är väntar-på-bekräftelse → avgift saknas → slutbetalning saknas → klara, och att äldst anmäld ligger överst inom varje grupp.
2. Kontrollera att varje person bär exakt ett märke, och att en avbokad person bär Avbokad — inte en vanlig hink.
3. Klicka varje steg-räknare i tur och ordning. Kontrollera att listan filtreras och att talen stämmer.
4. Slå på ett filter, klicka Rensa filter, kontrollera att ALLA filter försvann.
5. Slå på Markera utan filter. Kontrollera att sidan inte hoppar. Markera tre personer, tryck Åtgärder, kontrollera att rätt tre namn följer med.
6. Filtrera först, slå sedan på Markera. Kontrollera att bara de filtrerade går att markera.
7. Fäll ut betalningsytan. Läs en person med lång notering och flera utskick — kontrollera att noteringen är läsbar i full bredd och att utskicken står som tidslinje med klockslag.
8. Försök skriva någonstans på sidan. Försök klicka ett betalningskryss. Kontrollera att INGENTING går att ändra.
9. Kontrollera att en mottagen betalning visar antingen datum eller bara Mottagen — aldrig ett påhittat datum.
10. Testa med tangentbord: tabba genom listan, öppna markera-läget, stäng med Esc, kontrollera att fokus lämnas tillbaka rätt.
11. Kör en skärmläsare över registret och kontrollera att scroll-ytans etikett beskriver rätt sektion.
12. Ladda en stale variant-URL och kontrollera att den degraderar till den skarpa vyn.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Manuell vandring genomförd mot granskningsfixturen i staging, alla steg nedan prövade
- [ ] #2 Avvikelser mot facitbilderna bokförda öppet — inte tysta
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
