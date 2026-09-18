---
id: TASK-450.2
title: 'Skiva: N3 — efterkontrollen klassar hela det pushade spannet'
status: To Do
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 10:34'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.1
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: high
ordinal: 776000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efterkontrollen får i dag bara pushens topp-commit. Landar kön flera ändringsförslag i en push och toppen är en textändring hoppas hela den verifierande sviten över — mätt 60 gånger på nitton dagar. Efter skivan skickas även pushens bas, och klassningen räknar stegen från toppen bakåt via första föräldern: mer än ETT steg ger full svit med skälet utskrivet i loggen; exakt ett steg ger dagens logik orörd. Fail-closed på varje kant (bas tom eller noll-SHA, bas onåbar inom tio steg, API-fel). Detta är tråd T166 vägval 2 — ingen ny klassnings-implementation, ADR-077 beslut 1 orörd. Spec: planens § N3. Landas EFTER N2 så att effekten går att avläsa i natten.

Täcker användarberättelser: 4, 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fem nya fall i klassningsskriptets befintliga testsvit: två merge-commitar med texttopp ger false (fäller mot dagens skript, passerar efter fixen — tvåsidighetsbeviset); en merge-commit ger oförändrat true; bas noll-SHA ger false; bas onåbar inom taket ger false; bas osatt ger false
- [x] #2 Skarpt mot verkliga SHA:n ur granskningens mätning: 269f6d476a (texttopp, kodspann) ger false efter fixen; en enkelposts textlandning förblir true
- [x] #3 Rollback-egenskapen håller: utan bas-variabeln faller skriptet till dagens beteende
- [x] #4 Tråd T166 uppdaterad med att vägval 2 är byggt (pekare till PR), via trådregistrets egen rutin
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
