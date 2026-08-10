---
id: TASK-147.10
title: 'Skiva: Testmail till mig — se mailet som mottagaren ser det'
status: To Do
assignee: []
created_date: '2026-08-10 07:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.1
parent_task_id: TASK-147
priority: high
ordinal: 348000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lottas (och Marcus) trygghetsbehov, S102 2026-08-10: före ett skarpt utskick vill avsändaren se det FAKTISKA renderade mailet i sin egen inkorg — avsändare, Reply-To, ämne, platshållare ifyllda — inte bara klient-preview. Branschstandard i varje professionellt mailverktyg.

Bygget: 'Skicka test till mig'-knapp i åtgärdssidans granskningsläge → sänder det renderade utskicket (platshållare fyllda ur FÖRSTA mottagaren i urvalet, tydligt märkt TEST i ämnesraden) till den INLOGGADE användarens adress via 147.1:s singelsändningsväg. Ingen mottagare i urvalet berörs. T53-trådens options-rymd avgjord: väg C, legitimerad av ADR-067-revisionen (147.1) — revisionen ska uttryckligen rymma test-sändvägen.

OBS FORM: granskningsläget är facit-låst (s93-atgardssida-promovering). Knappen är ett form-DELTA → Marcus omgodkännande-stämpel på den utökade granskningsytan krävs (samma mönster som eventsidans omstämpling, ADR-104-kanalen).

Täcker: förlängning av användarberättelse 9; T53.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testmail landar i inloggad användares inkorg med korrekt avsändare/Reply-To, TEST-märkt ämne och ifyllda platshållare
- [ ] #2 Ingen adress ur urvalet kontaktas av testvägen — bevisat i test
- [ ] #3 Granskningsytans utökade form Marcus-omstämplad (ADR-104-kanalen)
- [ ] #4 T53-tråden stängd med pekare hit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
