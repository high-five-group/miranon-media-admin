---
id: TASK-145.2
title: 'Skiva: Summeringsblocket — steg-räknarna, logistik-gruppen och Avbokade'
status: To Do
assignee: []
created_date: '2026-08-07 08:58'
updated_date: '2026-08-07 11:26'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.1
parent_task_id: TASK-145
ordinal: 234000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta ser summeringsblocket i toppen: fyra steg-rader som räknar hur många som står i varje steg — hennes att-göra-lista för dagen — och därunder, visuellt avskild, logistik-gruppen med Eventinfo-raden, Bor över och Avbokade. Hon klickar 'Anmälningsavgifter' och listan visar bara de som saknar avgift. Hon klickar 'Avbokade' och ser de avbokade i registret. Hon klickar Rensa och ALLA filter försvinner, inte bara det hon råkade slå på sist.

BLOCKET ÄR FACIT-LÅST I SIN HELHET. Grillad samsyn beslut 2 (sessionsdok S93 Del 3) räknar upp raduppsättningen och namnger ENDAST tre rivningar — auto-kryssen, påminnelse-räknaren och 'Anmälningsbekräftelse skickad'-raden. Bor över och Avbokade är INTE bland dem; de överlever, med samma vikt som varje annan rad.

Denna skiva äger HELA blocket. Den ursprungliga skivningen (S93 Del 8) specade bara 'fyra klickbara steg-räknare' och lämnade logistik-gruppen utan ägare — ett hål som upptäcktes när TASK-145.1 byggdes och som rättas här.

Täcker användarberättelser: 7, 8, 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fyra klickbara steg-rader står överst och räknar personer per steg; betalnings-raden är delad i Anmälningsavgifter/Slutbetalningar i Betalningar-blockets grammatik (facit § 2)
- [ ] #2 Ett klick på en steg-rad filtrerar registret till det steget; den filtrerade vyn renderas platt utan sektionsrubriker
- [ ] #3 Logistik-gruppen renderas visuellt avskild från steg-raderna (egen divide-y-grupp, gap-2 mellan grupperna) och bär Eventinfo-signalraden + Bor över-raden ORÖRDA i sin facit-låsta form
- [ ] #4 Avbokade är en riktig SummeringsRad (term='Avbokade', värde=N) placerad SIST i logistik-gruppen, under Bor över — inte den gamla <details>-raden, och aldrig grammatiken 'N har avbokat'
- [ ] #5 Ett klick på Avbokade filtrerar registret på de avbokade, läst ur hela registreringar oberoende av annat filterval — avbokade är i övrigt bortfiltrerade ur aktiva
- [ ] #6 Rensa-filter nollar SAMTLIGA filtertillstånd inklusive Avbokade-filtret, inte bara ett — den latenta buggen där tre av fyra tillstånd överlevde är stängd
- [ ] #7 Ett aktivt filter är synligt som aktivt, och räknarnas tal förblir koherenta med basens egna fält
- [ ] #8 E2E-täckningen för Bor över är återställd — testet som TASK-145.1 en gång raderade är återskapat mot den nya formen, inte tyst borta
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
- [ ] #9 Bor över och Avbokade verifierade mot facit-bilderna (variant-a-avbokade-oppnad.png m.fl.) — inte mot minnet av hur de såg ut
<!-- DOD:END -->
