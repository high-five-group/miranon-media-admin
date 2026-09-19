---
id: TASK-477
title: >-
  Fynd: svepets omsändning saknar dubbelsändningsskydd — idempotensnyckeln
  slumpas per anrop
status: To Do
assignee: []
created_date: '2026-09-19 09:45'
labels:
  - fynd
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2547'
priority: medium
type: bug
ordinal: 817000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningens runda 1 och 2 på PR #2547 (TASK-455), info-fynd: `idempotencyKey: crypto.randomUUID()` genereras per anrop i `src/data/mutations/svepSendGrupper.ts` rad ~86 (oförändrat ur den ursprungliga `svepSend.ts`). En manuell omsändning efter ett delvis misslyckat svep i en loopad (bilage-bärande) grupp skyddas därför inte mot dubbla mail på transportnivå. Risken dämpas av att servern bara stämplar mottagare som faktiskt fick mailet ("servern är facit"), men själva mekanismen saknas. Förbefintligt läge, inte infört av TASK-455.

Research först: hur gör Resend/branschledarna idempotens för grupperade utskick (deterministisk nyckel per grupp + mottagare + innehåll)? Jämför `_shared/send-bulk.ts`, som redan bär en deterministisk idempotensnyckel per batch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Research-pass: etablerat mönster för idempotens vid omsändning av grupperade utskick, källbelagt
- [ ] #2 Rött-först: test som visar att två identiska svep-anrop i dag får olika nycklar; efter fix samma nyckel för samma (grupp, mottagare, innehåll)
- [ ] #3 En avsiktlig NY sändning (ändrat innehåll eller ny mottagarmängd) får ny nyckel — ingen legitim sändning blockeras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
