---
id: TASK-309.37
title: >-
  Fynd: optimistiska sparhookar (useSavePlace, useSaveEventText) saknar
  concurrent-mutation-skydd — äldre rollback kan skriva över senare lyckad
  ändring
status: To Do
assignee: []
created_date: '2026-08-28 04:34'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 608000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FAKTA (källmärkt: review-runda 1 på PR #2055, TASK-309.36, F2/warning,
granskad av `review-agent`, se PR:ens Riskbedömnings-sektion):

Två optimistiska sparhooks saknar skydd mot samtidiga/snabbt-efterföljande
mutationer på SAMMA cache-nyckel:

- `src/data/mutations/useSavePlace.ts` — `mutationKey: ['save-place']`, ej
  scopad per plats/fält. Spara-knappen i `BlockDialog`/`PlatserYta.tsx`
  gate:as INTE på `spara.isPending`.
- `src/data/mutations/useSaveEventText.ts` (TASK-309.25, PR #1998) — ärver
  SAMMA mönster: mutationKey är scopad per event (`['save-event-text',
  eventId]`) men inte per fält/block, och Spara-knappen i
  `GenereringsVy.tsx` gate:as inte heller på `isPending`.

MEKANISMEN (granskarens beskrivning): klickar användaren Spara på två
block i snabb följd (eller samma block två gånger innan första svaret
kommit) kan mutation A:s `onError`-rollback (`queryClient.setQueryData(key,
context.previous)`) köra EFTER att mutation B:s optimistiska write eller
lyckade `onSettled`-invalidering redan applicerat en NYARE korrekt cache-
state — A:s snapshot (`context.previous`, taget FÖRE A startade) känner
inte till B:s ändring, så rollbacken skriver över B:s lyckade resultat med
ett äldre värde. Samma structural race som TanStack Querys egen
dokumentation varnar för vid överlappande optimistiska mutationer utan
scope/dedup.

TRE KANDIDATLÖSNINGAR (ingen vald här — det är detta kortets jobb):

1. **`useIsMutating`-vakt** — läs `useIsMutating({ mutationKey })` i
   komponenten och blockera ett nytt `mutate()`-anrop medan en tidigare
   mutation med samma nyckel fortfarande är `pending`.
2. **`disabled` under `isPending`** — gate:a Spara-knappen (`aria-disabled`,
   samma mönster `skapaPlats`/`PlatserYta.tsx` redan använder för
   "Skapa"-knappen) på `spara.isPending`, så ett andra klick strukturellt
   inte kan avfyras innan det första avgjorts.
3. **TanStack mutation `scope`** — samma `scope.id`-serialisering
   `registrationPayments.ts`s taktvakt redan använder (kryssens mutation,
   TASK-147.4): köar mutationer med samma scope i stället för att låta dem
   köra parallellt, TanStack Querys egna dokumenterade mekanism för
   seriella mutationer.

GÖR (i det kort som väljer och bygger lösningen): läs TanStack Query-
dokumentationen om `mutation.scope`/`useIsMutating` (context7), välj EN av
de tre kandidaterna (eller motivera en fjärde), applicera den på BÅDA
`useSavePlace.ts` OCH `useSaveEventText.ts` symmetriskt (samma mönster på
båda, de delar samma sårbarhet), och bevisa fixen med ett Playwright-test
som simulerar två snabba Spara-klick och verifierar att den SENARE
lyckade ändringen vinner (inte den äldre rollbacken).

Pekare: PR #2055 (TASK-309.36) Riskbedömnings-sektion — granskningsutlåtandet
som identifierade F2 i sin helhet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vald lösning (useIsMutating-vakt / disabled under isPending / TanStack mutation scope) motiverad och applicerad symmetriskt på useSavePlace.ts OCH useSaveEventText.ts
- [ ] #2 Playwright-bevis: två snabba Spara-klick (samma block/fält) — den senare lyckade ändringen vinner, ingen äldre rollback skriver över den
- [ ] #3 Ingen regression i TASK-309.25s och TASK-309.36s befintliga acceptance-test
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
