---
id: TASK-289
title: >-
  Fynd: A2-latensen gör personregistrets invalidering otillräcklig — nya
  personer kan saknas i cachen upp till 30 min
status: To Do
assignee: []
created_date: '2026-08-22 10:44'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 533000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur ett rent registerpass 2026-08-22, källa: TASK-286.4-agentens slutrapport (PR #1760) + disk-verifiering av denna agent.

create-registration-EF:en (`supabase/functions/_shared/field-allowlists.ts` § create-registration) sätter MEDVETET inte Anmälans Person-länk — kommentaren i filen säger uttryckligen "Person-länk EJ med — den delegeras till A2". Airtable-automationen A2 gör kopplingen några sekunder EFTER anmälan skapas: mätt spann 2026-08-10, `docs/reference/data-model.md` § "Tie-break — anmälan slår touchpoint samma dygn" (rad ~680), är **3,6–6,7 s över fyra anmälningar**.

`get-persons`s `BAS_FILTER = '{Antal anmälningar (totalt)} > 0'` (`supabase/functions/get-persons/index.ts`) exkluderar en person tills rollupen "Antal anmälningar (totalt)" är >0 — vilket den inte är förrän A2 har kört. Konsekvens: skapas en anmälan och personregistret invalideras (eller hämtas om) inom det spannet, kommer svaret sakna den nyss skapade personen — invalideringen "lyckas" tekniskt (nytt EF-anrop görs) men returnerar samma ofullständiga bild.

TASK-286.4 (landad, PR #1760, commit 6fa82a32) höjde personregistrets `staleTime` från globalens 5 min till **30 min** (`src/queries/personregister-farskhet.ts`, `PERSONREGISTER_STALE_TIME_MS = 30 * 60 * 1000`, satt via `setQueryDefaults` på `queryKeys.persons.register`), EFTER att skrivvägs-invalidering byggdes och bevisad (samma skiva, ADR-123 beslut 6). Ett fel svar cachas nu alltså upp till SEX gånger längre än innan.

TASK-286-familjens uttalade löfte (ADR-123 § Kontext / TASK-286 PRD) är att en ny person ska synas i registret utan väntan. A2-racet gör att löftet inte alltid håller — särskilt eftersom TASK-286.4:s egen invalidering triggas av APPENS EGNA skrivvägar (mutations mot personer), inte av A2:s asynkrona Airtable-automation, som ligger helt utanför appens kontroll.

**Mildrande, ska stå kvar i lösningen:** `refetchOnWindowFocus: true` och `refetchOnReconnect: 'always'` (`src/router.ts`) är OFÖRÄNDRADE av TASK-286.4 (verifierat: bara `staleTime` sätts i defaults-objektet, källäst mot query-core:s merge-ordning). I praktiken hinner Lotta ofta navigera bort och tillbaka (fönsterfokus) längre än A2:s 3,6–6,7 s, vilket döljer problemet i normalflödet — men `TabBar`:s prefetch-på-hover/fokus (ADR-078 beslut 3) kan träffa INUTI det korta fönstret, och en användare som stannar kvar på listan (ingen fokus-cykel) ser inte heller någon refetch förrän 30 min gått.

Kortet ska bära BÅDA lösningsvägarna utan att välja mellan dem — det är en produkt-/arkitekturavvägning, inte en teknisk självklarhet:

(a) **Lös A2-väntan strukturellt.** T.ex. optimistisk klient-uppdatering av den nyskapade personen i cachen direkt vid skapande (utan att vänta på servern), en fördröjd/upprepad invalidering (t.ex. en andra invalidering ~7-8 s efter skrivningen, efter A2:s mätta fönster), eller att `create-registration`-EF:en själv sätter Person-länken i stället för att delegera till A2 (kräver research mot varför delegeringen designades så ursprungligen — jfr `data-model.md` §Kända fällor 21/22/40/42 om A2:s grenordning och dubblett-risker; en EF-side person-koppling måste replikera samma matchnings-/dubblettlogik för att inte introducera en NY defektklass).

(b) **Rulla tillbaka `staleTime` till 5 min** tills (a) är löst. Detta är en ENRADSÄNDRING (`src/queries/personregister-farskhet.ts`, `PERSONREGISTER_STALE_TIME_MS = 5 * 60 * 1000`) och gör kortet billigt att agera på snabbt om (a) tar tid — kostar tillbaka en del av TASK-286.4:s prestandavinst (~336 KiB/sex-anrops-hämtning varje 5:e minut i stället för var 30:e) men återställer den gamla, kända risknivån i stället för att sexdubbla den.

Referenser: TASK-286.4 (`src/queries/personregister-farskhet.ts`, commit 6fa82a32, PR #1760), ADR-123 beslut 6, `data-model.md` § A2:s decision / § Tie-break, `supabase/functions/_shared/field-allowlists.ts` § create-registration, `supabase/functions/get-persons/index.ts` § BAS_FILTER.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vägvalet (a: strukturell A2-kompensation, eller b: staleTime-rollback till 5 min) är fattat och dokumenterat — av Marcus eller via grillning, inte av den agent som plockar kortet.
- [ ] #2 Vald väg är implementerad: (a) ett nytt registret-svar innehåller den nyss skapade personen inom A2:s mätta fönster (3,6–6,7 s) utan att invalideringen behöver upprepas manuellt, ELLER (b) PERSONREGISTER_STALE_TIME_MS är 5 * 60 * 1000 och kommentaren i personregister-farskhet.ts uppdaterad till att förklara varför (denna kortets skäl, inte bara talet).
- [ ] #3 Regressionstest: ett test som visar att en nyskapad person blir synlig i registret inom rimlig tid efter skrivningen, körd mot den faktiska A2-latensen (eller en mockad variant av den) — inte bara mot appens egen skrivväg-invalidering isolerat.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
