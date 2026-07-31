---
id: TASK-53
title: 'Fynd: 429-backoffen i airtable-client väntar 1 s där Airtable kräver 30 s'
status: Done
assignee: []
created_date: '2026-07-27 14:52'
updated_date: '2026-07-31 08:15'
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
- [x] #1 Alla tre 429-hanterare i airtable-client.ts väntar enligt Airtables dokumenterade krav (>= 30 s för första omförsöket)
- [x] #2 Backoff-strategin är enhetstestad med mockad 429 — väntetid verifierad, inte antagen
- [x] #3 Omförsöks-loopen har ett explicit tak; oändlig retry är borta
- [x] #4 airtable-constraints.md P4:s öppna-avvikelse-not uppdaterad till åtgärdad med commit-referens
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
429-backoffen väntar nu 30 s enligt Airtables dokumenterade krav — den enda defekten i PRODUKTIONSKOD som Session 91 öppnade. Alla tre 429-hanterare i airtable-client.ts delar en ny, Deno-fri mekanism (airtable-retry.ts): 30 000 ms första omförsöket, 60 000 ms andra, jitter-tak 37 500 / 75 000. Symptomet var latent — under 5 req/s-taket manifesteras det aldrig, vilket är varför det kunnat leva; vid faktisk 429 föll omförsöken INOM lockout-fönstret och förlängde det. DESIGNVAL: rekommendationen (b) följdes men SKÄRPTES — jittern är additiv uppåt. AWS klassiska equal jitter kan ge väntan UNDER basen, vilket hade brutit 30 s-kontraktet och återinfört exakt defekten. TAKET ÄR HÄRLETT, INTE VALT: Supabase EF har Request idle timeout 150 s (primärkälla); värsta väntan 112,5 s ryms, ett tredje omförsök gav 262,5 s och därmed 504 i stället för ett ärligt fel. Testet asserterar härledningen. Tvåsidigt bevis: basen återställd till 1 s → 4 av 10 fäller inkl. regressionsvakten; taket höjt till 3 → idle-timeout-härledningen fäller. 10 fall gröna, väntetid mätt via injicerad sleep. Latent bugg lagad på köpet: gamla loopen konsumerade aldrig 429-svarets body före omförsök — resursläcka i Deno, nu annullerad. P4-noten i airtable-constraints.md uppdaterad till åtgärdad med commit 123dbca. ÖPPET, större än kortet: airtable-client.ts är HELT otypkollad (utanför alla tsconfig-program, 7x TS2304 Deno vid sond) och hela supabase/functions/ är exkluderad ur Biome — EF-koden har varken typecheck eller lint. Registrerat, eget kort. Fixen är inte skarp förrän någon deployar; EF-deploy sker via skript, inte CI. Landad #500 (123dbca + d3242c6), merge_group grön (e17b8f88).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
