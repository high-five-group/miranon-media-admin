---
id: TASK-309.36
title: >-
  Mer → Platser: sparningen ser osparad ut i flera sekunder (samma klass som
  309.25)
status: Done
assignee: []
created_date: '2026-08-28 03:04'
updated_date: '2026-09-04 13:44'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 607000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FAKTA (källmärkta, verifierade 2026-08-28):

- `tasks/sessions/2026-08-20-session-108.md` rad 3827: "`#1998` | `309.25` |
  optimistisk sparning (`useSaveEventText` onMutate/onError/onSettled), mätt
  1,95 s → omedelbar | medel (Platser-ytan har samma bugg → kort)".
- Samma dok rad 3909, "Agent-svans"-listan: "Kandidat att minta: **Mer →
  Platser har samma osparat-bugg** (`useSavePlace` pessimistisk + synkron
  stängning, review `#1998`)."
- PR #1998 (MERGED, merge-SHA `48f85315`, 2026-08-26): fixade exakt samma
  buggklass i `GenereringsVy.tsx`/`useSaveEventText.ts` — dialogen stänger
  SYNKRONT vid Spara, och utan en optimistisk cache-write visade listan det
  GAMLA värdet tills `onSettled`s invalidering hunnit refetcha (mätt i
  staging: sekventiell kedja `save-event-text` + `get-document-sources`
  ~1953 ms snitt, se `src/data/mutations/useSaveEventText.ts`s filhuvud för
  full mätning).
- Kodläsning 2026-08-28 bekräftar mönstret i `useSavePlace.ts`:
  `src/data/mutations/useSavePlace.ts` har INGEN `onMutate` — bara
  `mutationFn` → `onSuccess` (skärmläsar-alert) → `onSettled`
  (invalidateQueries mot `queryKeys.places.list` och
  `queryKeys.documentSources.all`). Ingen optimistisk cache-write sker
  alltså mellan klick och serversvar — samma pessimistiska form som
  `useSaveEventText` hade FÖRE PR #1998.
- `src/components/platser/PlatserYta.tsx` rad ~99/105: `spara.mutate(...)`
  anropas direkt utan föregående optimistisk uppdatering av UI-state; se
  `onSpara`-callbacken rad ~273 för stängnings-timingen (samma
  synkron-stängningsform som `GenereringsVy.tsx` hade före fixet).

GÖR: applicera samma TanStack-mönster (ADR-016 fem komponenter: onMutate
cancelQueries+setQueryData+snapshot / onError rollback / onSettled
invalidate) på `useSavePlace.ts`, med `applieraOptimistiskt`-motsvarighet för
Platser-ytans fält. Följ `useSaveEventText.ts` som mall/precedent — samma
hook-form, samma kommentarsstandard.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samma optimistiska mönster (onMutate/onError/onSettled) implementerat i useSavePlace.ts, med rollback vid fel
- [x] #2 Playwright-bevis: sparningen syns omedelbart i UI:t, ingen flera-sekunders osparad-känsla — snapshot-par före/efter, samma bevisform som 309.25
- [x] #3 Ingen regression i 309.25:s yta (GenereringsVy.tsx/useSaveEventText) — dess testsvit körs grön oförändrad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S119 stangningsbatch 2a (2026-09-04): PR #2055 mergad i origin/main, merge-SHA 0b172e7f (verifierat mot origin/main-loggen). Review konvergerad runda 3, risk LAG (granskad SHA 0fcfc4c8) -- runda 2:s enda ask-user-fynd loste av Marcus egen commit med tvasidig manuell verifiering + nytt CI-gront test; kvarstaende punkter bokforda info utan blockerande allvar. Diff (PR-namn-lista): backlog/tasks/task-309.36, src/components/platser/PlatserYta.tsx, src/data/mutations/useSavePlace.ts, tests/acceptance/mer-platser-optimistisk-sparning.acceptance.test.ts, samt backlog/tasks/task-309.37 (nytt fynd-kort mintat under skivan -- optimistiska sparhookar saknar concurrent-mutation-skydd) -- inga orelaterade filer, task-309.37 ar sjalva skivans eget arbetsprodukt.
<!-- SECTION:FINAL_SUMMARY:END -->
