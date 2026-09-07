---
id: TASK-420
title: >-
  Fynd: startvärmningens intresserade-post ärver global retry 3 medan
  Intresserade.tsx aldrig retry:ar 4xx — två konsumenter av samma queryKey med
  motstridig retry-policy
status: Done
assignee: []
created_date: '2026-09-06 17:11'
updated_date: '2026-09-07 16:48'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 748000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: review-runda 2 på PR #2395 (TASK-416.8, S123 2026-09-06), sidofynd utanför skivan. src/router.ts:20–21 sätter global retry: 3 med retryDelay 200·2^n (max 2 000 ms). src/data/warmup/startvarmningen.ts:277–283 värmer queryKeys.intresserade.all via ensureQueryData utan retry-override och ärver därför retry 3 även på 4xx. src/components/intresserade/Intresserade.tsx:185–187 sätter för SAMMA nyckel retry som hoppar över 4xx (EdgeFunctionError 400–499) och annars max 3. Granskaren observerade fyra get-leads-anrop vid sidladdning. Konsekvens: vilken policy som gäller beror på vem som råkar starta hämtningen först; ett 4xx-fel (t.ex. utgången session) retry:as tre gånger med backoff ur startvärmningen fast vyn själv aldrig skulle göra det. Åtgärd: lägg retry-policyn på nyckelnivå med queryClient.setQueryDefaults(queryKeys.intresserade.all, { retry }) (TanStack Query, verifiera i docs) så båda konsumenterna delar den, ta bort per-anrops-overriden i Intresserade.tsx; behåll den strängare formen (aldrig retry på 4xx). Mät antal get-leads-anrop vid sidladdning före/efter i fixturvärlden (MSW-räknare) och bifoga. Kontrollera om övriga värmda nycklar (waitlist, maillog, segment) bär samma dubbelpolicy och bokför dem i notes utan att åtgärda i denna skiva.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En retry-policy per queryKey via setQueryDefaults; Intresserade.tsx bär ingen egen retry-override; 4xx retry:as aldrig oavsett vem som startar hämtningen
- [x] #2 Mätning bifogad: antal get-leads-anrop vid sidladdning före/efter, med 4xx-fixtur (förväntat 1 efter)
- [x] #3 Övriga värmda nycklar inventerade i notes (dubbelpolicy ja/nej per nyckel)
- [x] #4 Befintliga tester gröna, hermetik-självtestet grönt för rörda acceptance-filer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Fix:** `src/queries/intresserade-retry-policy.ts` (ny) exporterar `registreraIntresseradeRetryPolicy(qc)` — sätter retry-policyn (aldrig retry på 4xx, max 3 försök annars) på `queryKeys.intresserade.all` via `queryClient.setQueryDefaults`, wirad i `src/router.ts` direkt efter `registreraPersonregistretsFarskhet`. `Intresserade.tsx` bär ingen egen `retry` längre (och den nu överflödiga `EdgeFunctionError`-importen är borttagen) — startvärmningens `ensureQueryData` och komponentens `useQuery` delar nu SAMMA policy på nyckelnivå.

**Källa (setQueryDefaults-semantik):** context7 `/tanstack/query/v5.90.3`, `docs/reference/QueryClient.md` + `docs/framework/react/guides/testing.md`, verifierat 2026-09-07 mot installerad `@tanstack/react-query` 5.102.2. Tre punkter citerade i modulens docblock: (1) `getQueryDefaults` prefix-matchar (`partialMatchKey`); (2) `QueryCache.build()` bygger VARJE `Query` — både `useQuery` och `ensureQueryData`/`fetchQuery` — via `client.defaultQueryOptions(options)` + `client.getQueryDefaults(queryKey)`, samma väg för båda konsumenterna; (3) anropsställets egna options vinner ALLTID över `setQueryDefaults` ("if a specific useQuery call has an explicit retry count set, that value will take precedence over the provider's defaults") — därför måste Intresserade.tsx:s inline-override bort, inte bara läggas till på nyckeln.

**AC #2 — mätning (hermetiskt, `tests/api/intresserade-retry-policy.test.ts` § 3):** avviker MEDVETET från kortets "MSW-räknare" — `acceptance-bas.ts`s eget filhuvud förbjuder uttryckligen att räkna handler-anrop i acceptance-klassen ("Klassen testar EXTERNT BETEENDE — aldrig att en handler anropades eller hur många gånger. Det vore att testa fixturen."), och `AirtableAdapter.fetchIntresserade`s riktiga nätverksväg går inte att fejka i api-pure (kräver en levande `supabase.auth.getSession()`, samma begränsning `cursorWalk.ts`s filhuvud bokför). Mätt i stället direkt mot en riktig `QueryClient` med `queryClient.fetchQuery` (samma byggväg som `ensureQueryData` tar vid kall cache) + en räknande stub-`queryFn`:
- 4xx (404): **1 anrop** EFTER fixen (§3 test 1) — matchar AC #2:s "förväntat 1 efter".
- 4xx (404) UTAN registreringen (kontrollgrupp, §3 test 3 — TVÅSIDIGT): **4 anrop** — reproducerar buggen (routerns blinda `retry:3`) och bevisar att registreringen är vad som ändrar utfallet.
- 5xx (500): **4 anrop** (1 + 3 omprök) både med och utan registreringen — policyn retry:ar transienta fel oförändrat.
Grinden falsifierad manuellt i båda riktningarna under bygget (dokumenterat i slutrapporten): borttagen `registreraIntresseradeRetryPolicy(queryClient)`-rad i router.ts fällde låstestet (§5); återinförd inline-`retry` i Intresserade.tsx fällde disk-läsnings-testet (§4). Båda återställda till fixad form efter provningen.

**AC #3 — inventering, övriga värmda nycklar (dubbelpolicy JA/NEJ):**

| Nyckel | Warmup-override? | Real konsument(er) | Override? | Dubbelpolicy |
|---|---|---|---|---|
| `waitlist.all` | Nej (ärver global) | `Waitlist.tsx` | Ja (aldrig 4xx-retry) | **JA** |
| `maillog.all` | Nej (ärver global) | `MailLog.tsx` | Ja (aldrig 4xx-retry) | **JA** |
| `segment.saved` | Nej (ärver global) | `SavedSegmentsList.tsx` | Ja (aldrig 4xx-retry) | **JA** |
| `registrations.all` | Nej (ärver global) | `AnmalningarSida.tsx` | Ja (aldrig 4xx-retry) | **JA** |
| `events.list` | Nej (ärver global) | `EventsList.tsx` (huvudkonsument) | Nej (ärver global, matchar warmup) — MEN `CreateEventForm.tsx` sätter EN EGEN override (aldrig 4xx-retry) på SAMMA nyckel | **JA (delvis — tre-vägs divergens: warmup+EventsList blint, CreateEventForm strikt)** |
| `activityLog.latest(N)` | Nej (ärver global) | `useLatestActivity` (`SenasteAktivitetKompakt.tsx`) | Nej (ärver global, matchar warmup) | **NEJ — konsekvent** |
| `intresserade.all` | — | `Intresserade.tsx` | — | **FIXAD i denna skiva** |

Fem av sex övriga varma nycklar (waitlist, maillog, segment, registrations, events.list) bär samma dubbelpolicy-mönster som intresserade.all gjorde — INTE åtgärdade i denna skiva (kortets scope), bokförda här för ett framtida kort. `activityLog.latest(N)` är den enda som redan var konsekvent (ingen konsument sätter någon override).

**Övrig avvikelse mot kortets ordalydelse:** ingen delad retry-hjälpfunktion extraherades trots att lambdan nu finns på fem-sex ställen i repot — `src/data/betalningar/useBetalningar.ts`s `husetsRetryPolicy`-docblock (TASK-346.7.1) bokför ett EXPLICIT beslut att INTE extrahera ("att extrahera en delad export här hade varit att uppfinna ett fjärde mönster där tre redan finns"). Samma konvention följd här (dupliceringen i `intresserade-retry-policy.ts` är avsiktlig, inte glömd).

STÄNGNING (S123 resume 1, 2026-09-07): PR #2440 → fb814734; post-merge fb814734 GRÖN (hela staging-sviten). Review runda 1 (Sonnet): 3 info (ensureQueryData/fetchQuery @deprecated i query-core 5.102.2 — migreras till queryClient.query() vid nästa major; AC #2:s metodsubstitution mot acceptance-bas.ts:s förbud mot handler-räkning; CI-läge), risk låg, konvergerad. Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
