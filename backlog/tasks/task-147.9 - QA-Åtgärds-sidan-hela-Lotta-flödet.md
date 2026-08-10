---
id: TASK-147.9
title: 'QA: Åtgärds-sidan hela Lotta-flödet'
status: To Do
assignee: []
created_date: '2026-08-10 07:05'
updated_date: '2026-08-10 07:41'
labels:
  - ready-for-human
dependencies:
  - TASK-147.10
parent_task_id: TASK-147
priority: high
ordinal: 346000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell QA-vandring på riktiga enheter, hela flödet:

1. Markera 2 deltagare på eventdetaljen → Åtgärder → mottagarna är SAMMA kort, avmarkera en.
2. Skicka bekräftelsemail: granska med ifyllda platshållare → skicka → ärligt utfall.
3. Betalningspåminnelse till obetald delmängd — bara de obetalda träffas.
4. Fritt utskick med redigerad ämnesrad + text — redigeringen går ut, inte mallen.
5. Utskick med klass A-bilaga → bilagan FRAMME i riktig mailklient (iPad + dator).
6. Avprickning: anmälningsavgift + slutbetalning + ångra + notering — registret visar rätt.
7. Kvitto: generera ur betalning, nummer löper, två snabba genereringar ger olika nummer.
8. Skärmläsarpass: körningens förlopp + resultat annonseras.
9. Mailto-frånvaro: ingen åtgärd öppnar mailklient någonstans.

Godkännande i klartext per ADR-104-kanalen där stämpel krävs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 9 steg genomförda och godkända av Marcus i klartext
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
