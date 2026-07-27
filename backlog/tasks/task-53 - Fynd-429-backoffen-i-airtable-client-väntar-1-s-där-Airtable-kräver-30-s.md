---
id: TASK-53
title: 'Fynd: 429-backoffen i airtable-client väntar 1 s där Airtable kräver 30 s'
status: To Do
assignee: []
created_date: '2026-07-27 14:52'
labels: []
dependencies: []
priority: medium
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt i S91:s research-pass (parallell-e2e-mot-delad-backend-2026-07-26.md § 5, Kvot och tid) och bokförd i docs/reference/airtable-constraints.md P4 som öppen avvikelse. Ej åtgärdad där — katalogposten är bokföring, detta kort är åtgärden.

SYMPTOM: latent. Under 5 req/s-taket manifesterar defekten sig inte alls, vilket är varför den kunnat leva. Vid faktisk 429 blir beteendet aktivt skadligt.

GRUNDORSAK: Airtables dokumentation är explicit — efter 429 'you will need to wait 30 seconds before subsequent requests will succeed' (https://airtable.com/developers/web/api/rate-limits). Vår klient väntar 1 sekund och försöker igen, på tre ställen i supabase/functions/_shared/airtable-client.ts: rad 84-88 (full-walk), rad 162-166 (fetchAirtablePage) och motsvarande i fetchAirtableRecord (~rad 189-ff). Backoffen är alltså 30x för kort mot dokumenterat kontrakt.

KONSEKVENS: omförsöken faller inom lockout-fönstret och får nya 429:or, vilket FÖRLÄNGER lockouten i stället för att invänta den. Klienten arbetar aktivt mot sin egen återhämtning. I värsta fall blir en enda överskridning till en utdragen serie misslyckade anrop.

OMFATTNING: alla Edge Functions som läser Airtable via de tre helpers. Träffar hårdast vid burst-last — backfill-skript, full-walk över stora tabeller, och parallella staging-körningar (jfr P26: hela sviten delar samma 5 req/s-budget).

ATT AVGÖRA I SKIVAN: (a) rak 30 s fast väntan enligt dokumentationen, eller (b) exponentiell backoff med 30 s som golv för första omförsöket? Rekommendation: (b) med jitter — 30 s fast över tre helpers riskerar att synkronisera omförsök från parallella anrop till samma sekund, vilket återskapar bursten. Överväg också ett tak på antal omförsök; nuvarande loop har inget.

BEVIS-KRAV: enhetstest som mockar 429 och verifierar väntetiden — annars är fixen overifierbar utan att faktiskt slå i taket. En skarp 429-framkallning mot staging är möjlig men bränner kvot och lockout för andra körningar; mockat test är rätt form här.

RELATERAT: airtable-constraints.md P4 (posten bokförs som åtgärdad när detta kort landar) · P26 (delad kvot över hela testsviten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla tre 429-hanterare i airtable-client.ts väntar enligt Airtables dokumenterade krav (>= 30 s för första omförsöket)
- [ ] #2 Backoff-strategin är enhetstestad med mockad 429 — väntetid verifierad, inte antagen
- [ ] #3 Omförsöks-loopen har ett explicit tak; oändlig retry är borta
- [ ] #4 airtable-constraints.md P4:s öppna-avvikelse-not uppdaterad till åtgärdad med commit-referens
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
