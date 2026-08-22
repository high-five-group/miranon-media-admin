---
id: TASK-289
title: >-
  Fynd: A2-latensen gör personregistrets invalidering otillräcklig — nya
  personer kan saknas i cachen upp till 30 min
status: To Do
assignee: []
created_date: '2026-08-22 10:44'
updated_date: '2026-08-22 17:38'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
INSTANSEN 2026-08-22 — RISKEN ÄR MÄTT, INTE ANTAGEN

Kortet skrevs 2026-08-22 10:44 UTC och beskrev "ett fel svar cachas nu alltså upp till SEX gånger längre än innan" som en HÄRLEDD risk. Risken materialiserades samma dag, inom timmar, av en ANNAN orsak men i EXAKT samma klass. Bokförd i TASK-286.8 (prod-utrullningskortet, skapat i efterhand).

Vad som hände: prod-frontenden gick live ensam. Vercel deployar Production automatiskt från main (commit d4997b5a, committid 2026-08-22 16:28:33 +0000, Production 16:37:26Z), medan Supabase Edge Functions inte deployas automatiskt alls. Prod-EF:en get-persons bar UPDATED_AT 2026-08-20 07:35:10Z — äldre än både TASK-286.1 (22aed794, 2026-08-21 14:31:02 +0200) och TASK-286.3 (1b226272, 2026-08-22 11:28:06 +0200). Klienten anropade get-persons?register=true mot en EF som inte kände parametern; anropet föll igenom till sök-/cursor-grenen och klampades till DEFAULT_PAGE_SIZE = 50. Personlistan visade 50 av 559.

DET SOM GÖR INSTANSEN RELEVANT FÖR DETTA KORT är inte deploy-glappet i sig — det stängdes av EF-deployen 17:13:34Z (ezbr_sha256 31a8b234… → 85306a63…). Det relevanta är att PROD VAR FORTFARANDE FEL EFTER ATT GLAPPET STÄNGTS. De 50 personerna låg persisterade i localStorage (REACT_QUERY_OFFLINE_CACHE, src/queries/persist.ts, maxAge 24 h, buster __APP_VERSION__, ADR-072), skrivna under den NYA app-versionen eftersom sidan laddades i fönstret MELLAN frontend- och EF-deployen. Bustern matchade alltså vid restore — det enda versionsskydd som finns var strukturellt blint för felet. Och PERSONREGISTER_STALE_TIME_MS = 30 * 60 * 1000 gjorde den persisterade datan FÄRSK, så ingen bakgrundshämtning startade. Felet krävde en manuell localStorage.removeItem för att försvinna.

ORSAKEN VAR EN ANNAN, KLASSEN ÄR DENSAMMA. Detta bevisar INTE A2-racet som kortet beskriver — ingen anmälan var inblandad, ingen rollup väntade på A2. Det bevisar det kortet POSTULERADE: att med 30 minuters staleTime är ett felaktigt registersvar långlivat, och att felkällan inte behöver vara den man förutsåg. Klassen "fel data i registernyckeln" har nu minst två inflöden — A2-latensen (härledd) och deploy-glapp mot ett förändrat EF-kontrakt (mätt). Vägvalet i AC #1 bör därför vägas mot båda, inte bara mot A2.

refetchOnWindowFocus ÄR INTE SKYDDSNÄTET — kodens egen kommentar säger det rakt ut.

Kortets § Mildrande skriver att refetchOnWindowFocus: true och refetchOnReconnect: always är oförändrade och att "i praktiken hinner Lotta ofta navigera bort och tillbaka (fönsterfokus) längre än A2:s 3,6-6,7 s, vilket döljer problemet i normalflödet". Den meningen behöver skärpas, och beviset stod redan i koden när kortet skrevs. src/queries/personregister-farskhet.ts rad 51, verbatim:

  ÖPPET, värt att veta: refetchOnWindowFocus verkar bara på en STALE fråga.
  Med 30 minuters livstid hämtar en fokus-återkomst inom fönstret alltså inte om.
  Det är den avsedda innebörden av att höja staleTime, och det är ofarligt just
  för att skrivvägarna invaliderar.

Konsekvensen: fönsterfokus är INGEN mildring inom staleTime-fönstret. En fokus-cykel efter 30 sekunder, fem minuter eller tjugonio minuter hämtar ingenting — frågan är inte stale, så React Query gör ingen begäran. Mildringen kortet räknar med existerar först EFTER 30 minuter, vilket är samma tidpunkt som datan ändå skulle ha hämtats om. Formuleringen "döljer problemet i normalflödet" är alltså inte bara optimistisk utan bakvänd: den beskriver ett skydd som staleTime-höjningen tog bort.

Kommentarens egen brasklapp — "ofarligt just för att skrivvägarna invaliderar" — håller bara för fel som uppstår GENOM appens egna skrivvägar. Både A2-racet (kortets ursprungliga fall) och deploy-glappet (dagens instans) uppstår UTANFÖR dem: A2 är en Airtable-automation, deploy-glappet är en infrastruktur-asymmetri. Ingen av dem triggar någon invalidering. Det är precis den blinda fläcken kortet finns för.

SLUTSATS FÖR VÄGVALET (AC #1): väg (b), rollback till 5 min, är inte längre bara "billig att agera på snabbt". Den är den enda av de två vägarna som minskar exponeringen för HELA klassen — väg (a) i sina föreslagna former (optimistisk uppdatering, fördröjd invalidering, EF-side person-koppling) adresserar bara A2-inflödet och lämnar deploy-glapp-inflödet orört. Det är ett argument som ska ligga på bordet vid beslutet, inte ett beslut fattat här.

Källor: TASK-286.8 (incidentens fulla bokföring), src/queries/persist.ts, src/queries/personregister-farskhet.ts rad 21 och 51, supabase/functions/get-persons/index.ts rad 13 och 121, tasks/sessions/2026-08-17-session-107.md rad ~285-325 (den tidigare instansen av samma deploy-asymmetri), tasks/lessons.d/tva-deploymekanismer-for-samma-system-skapar-ett-glapp-ingen-grind-ser.md.
<!-- SECTION:NOTES:END -->
