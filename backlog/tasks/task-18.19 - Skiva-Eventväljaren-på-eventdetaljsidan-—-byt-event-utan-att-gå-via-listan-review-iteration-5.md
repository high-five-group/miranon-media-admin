---
id: TASK-18.19
title: >-
  Skiva: Eventväljaren på eventdetaljsidan — byt event utan att gå via listan
  (review-iteration 5)
status: To Do
assignee: []
created_date: '2026-07-23 10:00'
updated_date: '2026-07-24 21:40'
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
- [ ] #2 Väljaren på eventsidan: förvald = aktuellt event, byte navigerar routen och laddar detaljerna; delad komponent med 18.18 utan ändringar (biblioteks-beviset)
- [ ] #3 E2e täcker byte + djuplänk + fokus-/rubrik-semantik; axe 0 på ytan
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
