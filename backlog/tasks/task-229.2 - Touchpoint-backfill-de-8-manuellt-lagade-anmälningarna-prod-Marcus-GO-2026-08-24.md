---
id: TASK-229.2
title: >-
  Touchpoint-backfill: de 8 manuellt lagade anmälningarna (prod, Marcus-GO
  2026-08-24)
status: To Do
assignee: []
created_date: '2026-08-24 13:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-229
ordinal: 576000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De 8 anmälningar som Person-länk-lagades via manuell PATCH (2026-08-15) fick aldrig sina 'Inskickad anmälan'-touchpoints — Gren 2:s createRecord uteblev. CRM-historiken (Senaste interaktion, TP sammanfattning) är ofullständig för de 8 personerna tills backfill. Marcus GO 2026-08-24: 'Det är absolut GO på 1+2.' EXAKT SPEC (record-ID:n, fältkontrakt tbl22SCvlHrgcAiZi, dedup-procedur, sidoeffekter): S112-utredningens backfill-spec 2026-08-24 — återges i sin helhet i utförar-uppdraget och ska verifieras mot prod före varje skrivning. OBS: städar historik, hindrar INTE återfall — det gör endast A2-fixen (229.1/229.3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dedup-kontroll körd per post omedelbart före createRecord (Typ='Inskickad anmälan' inom ±5 min av måldatum → hoppa över)
- [ ] #2 8 touchpoints skapade i prod (tbl22SCvlHrgcAiZi) med exakt tre fält: Person-länk, Typ=Inskickad anmälan, Datum=anmälans Inskickad-tidsstämpel
- [ ] #3 Read-back per post: personens Touchpoints-array vuxit med exakt 1; slutsvep ger 15 poster (7 befintliga + 8 nya) med utredningens datumfilter
- [ ] #4 Backfillen bokförd som ny post i docs/backfill/execute-log.md (spårbarhet — Touchpoints saknar fritextfält)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
