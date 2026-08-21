---
id: TASK-286.5
title: >-
  Beslut: Ska personsökningen bli diakritik-tolerant (asa hittar Åsa), som
  eventväljaren redan är?
status: To Do
assignee: []
created_date: '2026-08-21 11:52'
labels:
  - ready-for-human
dependencies:
  - TASK-286.2
parent_task_id: TASK-286
ordinal: 520000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HITL — produktbeslut, Marcus. Dagens sök (och klientsöken efter bytet, per ADR-123 beslut 2) är diakritik-KÄNSLIG: 'asa' hittar inte Åsa, 'ostergren' hittar inte Östergren. Det är paritet med Airtables SEARCH(), mätt i staging. Appens eventväljare är däremot diakritik-TOLERANT (React Arias useFilter med sensitivity base). Två ytor, två beteenden.

FRÅGAN: ska personsökningen breddas till tolerant matchning? För: Lotta slipper träffa rätt tecken, samma beteende som eventväljaren och som iOS Kontakter. Emot: det är en synlig förändring av träffmängden som måste kommuniceras, och paritetstestet byter då facit (klienten ska INTE längre ge samma som EF:en).

Om JA: nytt litet kort (ready-for-agent) som byter klientfiltret till Intl.Collator('sv', { sensitivity: 'base' })-baserad matchning eller samma useFilter som eventväljaren, uppdaterar paritetstestet till ett likvärdighetstest mot eventväljarens filter, och bokför beslutet som Update på ADR-123 beslut 2. Om NEJ: stäng detta kort med motiveringen, inget ändras.

Täcker användarberättelser: 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har tagit ställning i klartext (ja/nej) och svaret är bokfört i kortets notes med datum
- [ ] #2 Vid ja: uppföljningskort skapat (ready-for-agent) med paritetstestets nya facit utskrivet; vid nej: kortet stängt med motivering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
