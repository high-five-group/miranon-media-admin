---
id: TASK-284.3
title: 'Skiva: Resolution — koppla anmälan till rätt event i appen'
status: To Do
assignee: []
created_date: '2026-08-21 11:11'
updated_date: '2026-08-21 13:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-284.1
parent_task_id: TASK-284
ordinal: 518000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BETEENDE ÄNDE TILL ÄNDE: Lotta står inför en anmälan som inte kunde kopplas eller som kopplats fel. Hon ser anmälans egna uppgifter — vilket datum, vilken ort, vilken kurs formuläret säger — väljer rätt event, och bekräftar. Anmälan kopplas om, dess beräknade värde blir OK, och den försvinner ur kön. Hon behöver aldrig öppna datakällan.

DETTA ÄR DELEN SOM GÖR KÖN TILL NÅGOT ANNAT ÄN EN SKYLT. Utan den hänvisar appen till ett verktyg Lotta inte ska behöva kunna, vilket är motsatsen till appens syfte — och strider mot branschmönstrets bärande regel att arbetsobjektet ska kunna lösas där det visas.

Täcker användarberättelser: 6, 7, 8, 9, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ny skrivoperation finns i behörighetslistan för att koppla om en anmälan
- [x] #2 Operationen sätter BÅDE eventlänken OCH eventnyckeln i samma skrivning — matchningssteget kör vid varje radskapande och kan annars nollställa en länk satt på annat håll; att skriva båda gör operationen idempotent
- [x] #3 Operationen prövas i behörighetslistans tre lägen: okänd operation nekas, fält utanför listan nekas, tillåten operation muterar och restaurerar
- [x] #4 Eventväljaren visar anmälans EGNA uppgifter (datum, ort, kurs) intill valet, så att kopplingen kan göras utan att gissa
- [x] #5 Efter genomförd koppling får anmälan värdet OK och försvinner ur åtgärdskön
- [x] #6 En misslyckad koppling lämnar anmälan orörd och visar ett fel som säger vad som hände — aldrig ett generiskt felmeddelande
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
