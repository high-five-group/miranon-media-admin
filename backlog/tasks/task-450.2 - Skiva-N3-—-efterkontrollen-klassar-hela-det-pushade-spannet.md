---
id: TASK-450.2
title: 'Skiva: N3 — efterkontrollen klassar hela det pushade spannet'
status: Done
assignee: []
created_date: '2026-09-18 09:53'
updated_date: '2026-09-18 22:36'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rättelse (review-runda 2, PR #2526): AC #1:s femte klausul, "bas osatt ger
false", är FELSTÄLLD — den kolliderar ordagrant med AC #3 (rollback: en
literalt OSATT bas-variabel ⇒ dagens beteende, vilket i T27:s scenario är
`true`, inte `false`). Koden är korrekt; AC-texten är fel.

Vad som faktiskt gäller, och vad testerna T24-T27 bevisar:

- AC #1:s "bas osatt" SKA LÄSAS SOM "bas satt men TOMT" (BEFORE="", en
  variabel som FINNS i miljön men saknar värde) — det är T26, och T26 ger
  korrekt `false` (en egen fail-closed-kant, skild från noll-SHA).
- AC #3:s "utan bas-variabeln" är den ANDRA, distinkta kanten: BEFORE
  literalt SAKNAS ur miljön (${BEFORE+x} falsk) — det är T27, som korrekt
  ger `true` (rollback till dagens beteende, inklusive dess kända hål).

AC-texten ändras inte via CLI:t i denna runda (risk: `--acceptance-criteria`
ersätter HELA AC-listan och riskerar att nollställa redan bockade kryss på
ett kort vars arbete är färdigverifierat) — se scripts/test-classify-post-merge.sh
T24/T26/T27 för den exakta, körda semantiken.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
N3 landad via #2526 (e6308887, 2026-09-18T12:17:44Z): efterkontrollens klassning läser hela spannet sedan föregående körning i stället för bara toppen, så en kodlandning under en texttopp inte längre slinker förbi (tråd T166, vägval 2). Fem nya fall i klassningsskriptets testsvit, skarpt prövat mot 269f6d476a; rollback-egenskapen håller utan bas-variabeln. Efterkontrollen på den egna landningen GRÖN: körning 35344474711 (e6308887), följd av grön 35344638454 (cdd1856b). N3 var den hårda förutsättningen för minutbudgetens S1 och S3 (docs/research/actions-minutbudget-2026-09-18.md § C).
<!-- SECTION:FINAL_SUMMARY:END -->
