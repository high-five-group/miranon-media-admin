---
id: TASK-18.19
title: >-
  Skiva: Eventväljaren på eventdetaljsidan — byt event utan att gå via listan
  (review-iteration 5)
status: Done
assignee: []
created_date: '2026-07-23 10:00'
updated_date: '2026-07-25 09:31'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.18
parent_task_id: TASK-18
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg (2026-07-23), idé-utvidgning av 18.18: samma eventväljare på EVENTDETALJSIDAN — byt event högst upp så detaljerna laddas direkt, utan bakåt-navigering till listan (pogo-sticking-elimineringen; NN/g-antimönstret; precedent: Stripes objekt-switcher · Linears issue-hopp · Airtables record-navigering). Komponenten föds i 18.18 och får här sin ANDRA konsument = äkta bibliotekskomponent (dubbel-output-visionen). ÖPPNA DESIGNBESLUT: (A/B) rubrik-hierarkin — väljaren ÄR rubriken (namnet som trigger, Stripe-formen) ELLER kompakt kontroll ovanför H1:an; rollfördelningen mot listan/kalendern hålls: väljaren är snabbspåret, listan är hemmet (väljaren får ALDRIG växa filter/grupperingar). Route-semantiken ärvs från 18.18 beslut a (URL-navigering). Grillnings-kandidat — ready-for-agent flippas på Marcus designbeslut eller grillnings-utfall.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus rubrik-beslut (A: namnet som trigger / B: kontroll ovanför H1) bokfört; grillnings-utfall vid grillning
- [x] #2 Väljaren på eventsidan: förvald = aktuellt event, byte navigerar routen och laddar detaljerna; delad komponent med 18.18 utan ändringar (biblioteks-beviset)
- [x] #3 E2e täcker byte + djuplänk + fokus-/rubrik-semantik; axe 0 på ytan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT LÅST 2026-07-24 (S83 pass 4, konvergens mot Marcus i browsern). **VARIANT A VALD: väljaren ÄR rubriken** ("Variant A - helt klart"; Marcus om baslinjen: "För första gången i detta projekt är jag imponerad över vad du levererar som baslinje").

**Byggkrav:**

**1. H1:an ÄR triggern.** Eventnamnet i full rubrikstorlek (`font-semibold text-3xl`) med chevron-par (20 px) intill; hela ytan klickbar (`-mx-2 … rounded-lg px-2 py-1 hover:bg-bg-emphasized motion-safe:transition-colors`). Ingen separat kontroll ovanför H1 — variant B (kompakt pill över rubriken) FÖRKASTAD: den dubblerade eventnamnet.

**2. Sidhuvudets övriga delar orörda** — EventKey-pillen till höger, tid kvar-raden under, avdelaren. Rubrikpolicyn står: h1 = eventnamnet.

**3. Listan är samma komponentfamilj som 18.18** — kommande event, närmast först (Marcus-kvittens), sök, månadsgruppering i EventsLists form. Se 18.18-kortets punkt 8–10 och 12; ETT väljar-bygge bär båda ytorna.

**4. Bytet navigerar routen** (beslut a): `/event/$eventId` med behållna sökparametrar — URL:en alltid sann och delbar.

**5. INSTANT-KRAVET (nytt, ur passet).** Eventsidans EF-anrop är ~1,1 s (get-event) och ~1,4 s (get-registrations), mätt. Väljarbytet får INTE visa tomt/skeleton på det som listcachen redan bär. Landat i skarp kod PR #163 (`placeholderData` ur `events.list` + prefetch på avsikt i EventCard): direktklick 1315 ms → hover 1500 ms 278 ms; CLS 0,000 vid navigering.
   **VIKTIGT för bygget:** Beläggnings-aggregaten (viaFormular · manuelltTillagda · medfoljande · reserverade · vantelista) finns BARA i get-event och läses med `?? 0`. Sektionen MÅSTE hållas i skeleton medan placeholdern står — annars ritas en sekund av falska nollor. Skeletonet står i slutgeometri (DOM-mätt 336 px mot sektionens 337).

**6. Layouthopp är förbjudet** (Marcus: "absolut förbjudet i denna app"). Kvarvarande känt fall: Anmälda deltagare växer 187 → 627 px när dess egen query landar (CLS 0,045 om man scrollar dit under laddning) — höjden följer antalet anmälda, så skeleton i slutgeometri är omöjlig där. Registrerat i tråd **T90** tillsammans med det öppna belastningsbeslutet (varm registrations-cache för alla event = 11×2 Airtable-anrop, rate limit 5 req/s).

**7. Skeleton-estetiken** är egen designfråga (Marcus: inte branschledarmässig) — **T90 punkt (a)**, eget pass, inte denna skiva.

**Bilagor:** tasks/sessions/bilagor/s83-eventvaljaren-konvergens/

AFK-leverans (batch S86, do-work-agent, ADR-071/ADR-076-landningsform):

TDD rött-först (S80-amenderingen): nya describe-blocket 'Eventväljaren på eventdetaljsidan (task-18.19)' (5 tester) i event-detail-sviten körda FÖRE implementation — observerat utfall 5 failed / 1 passed (2,4 min; passed = auth-setup-projektet): test 1 föll på 'expect(heading.getByRole(button)).toHaveCount(1) … Received: 0' (h1:an saknar trigger), test 2–5 på 'Test timeout … waiting for getByRole(button, name Resor i medvetandet 1, exact)' (väljaren finns inte på sidan). Efter implementation 5/5 gröna (+ titel-defekten nedan), hela event-detail-sviten 54/54. En cykel (e2e-skarven batchar skivans beteenden; rött + grönt pushas ihop).

BYGGT — VARIANT A (väljaren ÄR rubriken): EventValjare får additiv form-prop ('kontextrad' | 'rubrik') — rubrik-formen renderar h1:an SOM trigger (font-semibold text-3xl ärvs; chevron-par 20 px aria-hidden; hela ytan klickbar: -mx-2 inline-flex px-2 py-1 rounded-lg hover:bg-bg-emphasized motion-safe; K54-vakten max-w-full). RUBRIK-SEMANTIKEN: triggern aria-labelledby:as till namn-spannet i SelectValue → h1:ans OCH knappens accessible name är EXAKT eventnamnet ('Välj event'-etiketten hade förorenat rubriken); 'vad kontrollen gör' bärs av aria-description 'Byt event' + aria-haspopup (Stripe-formen). List-/sök-/popover-maskineriet delas OFÖRÄNDRAT med 18.18; EventDetail är andra konsumenten (biblioteks-beviset — se AC-tolkningen under Avvikelser). Bytet navigerar routen /event/\$eventId med behållna sökparametrar (beslut a ärvt, punkt 4). Sidhuvudet i övrigt orört (punkt 2: EventKey-pillen, tid kvar-raden, avdelaren — e2e-asserterat).

INSTANT (ADR-078 + punkt 5): rubriken + Om eventet står DIREKT ur listcachen vid byte (befintlig placeholderData-seedning); beläggnings-aggregaten hålls i skeleton tills get-event landat (aldrig falska nollor — e2e håller detaljen grindad och asserterar skeleton + frånvarande beläggningsgrupp); prefetch på avsikt via delade useForberedEventDetalj — hover OCH tangentbordets virtuella fokus (AvsiktVidFokus ur render-state; aria-activedescendant avger inga DOM-fokusevent), båda vägarna e2e-bevisade utan navigering. document.title följer eventnamnet vid byte; RouteAnnouncer-tävlingen (announcerns generiska 'Event' landar EFTER sidans effekt när placeholdern gör datat omedelbart) löst med pathname-vaktad onResolved-re-assert — grundorsaken routad till task-46. Fokus-semantiken: h1 fokuseras vid första laddningen; efter byte återvänder fokus till rubrik-triggern (React Arias fokus-retur) — e2e-asserterat.

En defekt under körning: INSTANT-e2e:ns toHaveTitle föll mot 'Event — Miranon Media Admin' (RouteAnnouncer-tävlingen ovan) — fångad av eget test, två iterationer (sync-skrivning förlorade; rAF ur objekt-nycklad effekt avbröt sin egen frame) innan onResolved-re-asserten; trail i commiten.

Lokala grindar (rörd fil-klass, L147): typecheck 0 fel · typecheck:tests 0 fel · biome 0 errors (5 warnings/26 infos pre-existerande i orörda filer) · build grön · test:api 381/381 · e2e event-detail 54/54 (inkl. nya 18.19-blocket) + event-ny-anmalan 16/16 (18.18-regressionen: delade komponenten, första konsumenten oförändrad) + events-list/kalender 34/34 (EventCard-lyftet) + de sju EventDetail-renderande sviterna (anmalan-detalj · anteckningar · bekräftelse · bor-över · deltagare · närvaro-register · mark-paid) 57/57. Två anmalan-detalj-fall föll EN gång under 11-fils-parallellkörning (axe-timeout + INSTANT-header-timeout) — klassade som parallell-last-flake via isolerad 7/7-omkörning + grön 4-workers-omkörning (18.18:s klassningsform).

Review-piloten (T86): granskat träd f2cea1aa (bas main f8af246) — 7 fynd (1 spec/6 std); fokuserad ompassering på fix-diffen (träd 75f66211) — 3 nya fynd i F1-omkretsen. Triage: 10 åtgärdade (F1 prefetch-paret lyft till delad useForberedEventDetalj [EventCard + EventDetail konsumerar — en värmning, inte två kopior] + tangentbords-avsikten AvsiktVidFokus + e2e-bevis båda vägarna · F2 RouteAnnouncer-invariantdocen rättad [den beskrev en koherens som dynamisk-titel-sidorna redan bröt], grundorsaken → task-46 · F3 get-events-stubben lyft till tests/e2e/helpers/valjar-lista.ts + applicerad i 7 sviter som annars läckt väljarens listquery mot staging · F4 eventKey i väljar-listraderna + pill-assert FÖRE detalj-släppet [INSTANT-löftet bevisas för hela sidhuvudet] · F5 kommentarstädning · F6 harFokuserat-ref i st.f. id-ref som var boolean i förklädnad · F7 rubrik-skeletonets kommentar ärlig [kontrakts-defensiv gren, nås ej av EventDetail] · N1 sök-värmningens breddade avsikts-semantik [Autocomplete auto-fokuserar första träffen per tangenttryck = Enter-målet] öppet bokförd i kod · N2 sök-fokus inväntas före ArrowDown i prefetch-e2e [flake-fönstret] · N3 useCallback på hook-returen + varmBytesmal [effekt-deps-ärlighet]), 0 avfärdade, 2 routade (task-46 dynamisk sidtitel i route-lagret · task-47 e2e-fixture-konsolidering). Reviewfixarna validerade: full berörd e2e-yta omkörd grön (104 + 57) + test:api 381/381 om + build om. Review-tid ~9 min (två pass).

AVVIKELSER (öppet bokförda): (1) AC #2:s bokstav 'delad komponent med 18.18 utan ändringar' tolkad per facitets punkt 3 ('ETT väljar-bygge bär båda ytorna') och kortets egen beskrivning ('får här sin ANDRA konsument'): rubrik-formen är en ADDITIV variant-prop — 18.18-ytans form, beteende och testkontrakt är oförändrade (16/16 utan teständring), list-/sök-maskineriet delas byte-identiskt; bokstavstolkningen (fryst fil) hade gjort facitets variant A omöjlig. Marcus-kvittens i morgongranskningen. (2) Dep-dispensen (18.18 i granskningsfärdigt läge) behövde INTE aktiveras — 18.18 stod Done vid plock. (3) Visual-baselines: eventsida.png-baselinen driftar av rubrik-formen (chevron-par + hover-platta i h1:an) — visual är inte PR-grind; refresh ingår i T87:s aktiveringssteg 1 (dispatcha visual-baselines.yml), samma läge som nattens övriga UI-skivor. (4) eventName-dubbleringen (EventDetail lokal kopia vs EventCards export) noterad ur reviewn — pre-existing, utanför skivan, tas vid nästa beröring (ingen kort-routning; lyft-klassen bor i task-47:s städfamilj).

ÖPPNA MARCUS-MOMENT (morgongranskningen): (1) AC #2-tolkningens kvittens (additiv variant = biblioteks-beviset); (2) rubrik-triggerns AT-upplevelse i VoiceOver (accname = eventnamnet, beskrivningen 'Byt event' — mekaniskt e2e-bevisad, manuellt pass kvarstår per 18.18-precedenten); (3) N1-semantiken (sök-värmningen) om Marcus vill snäva den.

## Granskningsvågens FIX (S86 morgongranskning, Marcus-beslut 2026-07-25)

FYND: rubrik-triggern (form="rubrik", h1:an) RADBRYTS på långa eventnamn ('Fjärrskådning' bröts; 'Resor i medvetandet 3' värre). Marcus: får aldrig hända.

FIX (branch fix/s86-granskningsvag, EN samlad fix-vågs-PR per ADR-071 S76-amenderingen): namn-spannet i rubrik-formen flippat break-words → block + truncate (nowrap + visuell ellipsis vid överflöd); chevron-paret behåller sin plats (shrink-0); truncaten är ENBART visuell — accessible name förblir HELA namnet (aria-labelledby mot namn-spannet; accname beräknas ur textinnehållet, inte CSS-klippningen). Fil: src/components/events/EventValjare.tsx.

E2E-LÅS (event-detail.staging.test.ts, 18.19-blocket): nytt test 'rubrik-triggern RADBRYTER ALDRIG' — computed nowrap/ellipsis/overflow-x + scrollWidth>clientWidth-bevis att ellipsis är aktiv + geometri-lås (EN rad, <60 px) + chevron innanför viewport + accname = hela namnet + väljaren öppningsbar från truncerad trigger. RÖTT-FÖRST EJ OBSERVERBART LOKALT: e2e-dev-servern är portlåst till 5173 (reuseExistingServer false + strictPort) och porten bärs av Marcus levande dev-server — PR-CI:ts e2e-steg är beviset (pr-ci-bevisformen S66), öppet bokfört i PR-bodyn.

FIXUP (samma PR): PR-CI:ts första pass föll på testets egen locator — 'span[id]' i triggern var tvetydig (RAC:s SelectValue bär eget auto-id; strict mode violation, 2 träffar). Låset omskrivet till aria-labelledby-uppslag (accname-bäraren exakt). Klassad testdefekt, inte produktdefekt — exakt den klass lokal rött-först-körning hade fångat (porten upptagen, bokfört ovan).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 1f950d6acb4a1f226e5e651fff2c937b560ee7cb · CI-run 30148318132 (PR, 8/8 jobb gröna) + 30148621310 (main, grön per jobb; Test suite dedup-skippad by design vid 36.4-träff) · CI-grön-första-pass: ja (enda runnen på branchen) · defekter under körning: 1 (INSTANT-e2e:ns toHaveTitle — RouteAnnouncer-tävlingen, fångad av eget test; grundorsak routad till task-46) · TDD: rött-först — 5 nya e2e röda före implementation (5 failed/1 passed), 5/5 gröna efter, hela event-detail-sviten 54/54, en cykel · AFK-proveniens: batch S86, do-work-agent
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
