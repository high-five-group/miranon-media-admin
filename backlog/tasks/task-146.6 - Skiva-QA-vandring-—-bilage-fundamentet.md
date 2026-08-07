---
id: TASK-146.6
title: 'Skiva: QA-vandring — bilage-fundamentet'
status: To Do
assignee: []
created_date: '2026-08-07 09:09'
labels:
  - ready-for-human
dependencies:
  - TASK-146.1
  - TASK-146.2
  - TASK-146.3
  - TASK-146.4
  - TASK-146.5
parent_task_id: TASK-146
ordinal: 245000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan. OBS: fundamentet har ingen egen UI-yta i detta kort — Dokument-ytan är utbruten till eget spår. Vandringen sker därför delvis mot funktionerna direkt.

1. Kör runtime-beviset och öppna den genererade PDF:en. Kontrollera att å, ä och ö ser rätt ut.
2. Ladda upp en liten PDF via mönster 1. Kontrollera att den syns i metadatat med rätt event.
3. Ladda upp en stor fil via mönster 2. Kontrollera att appen inte hänger sig och att filen kommer fram.
4. Försök ladda upp en fil strax över taket. Kontrollera att felet kommer FÖRE uppladdningen och går att förstå.
5. Hämta en signerad länk och öppna den. Vänta ut giltighetstiden och försök igen — den ska nekas.
6. Generera ett klass B-brev. Kontrollera att det får samma sorts metadata som den uppladdade filen.
7. Kontrollera i basen att inga befintliga fält eller tabeller ändrats.
8. Kör provisionerings-skripten en gång till. Kontrollera att de är idempotenta — ingen dubblett, ingen förändring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Manuell vandring genomförd mot staging, alla steg nedan prövade
- [ ] #2 Avvikelser bokförda öppet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
