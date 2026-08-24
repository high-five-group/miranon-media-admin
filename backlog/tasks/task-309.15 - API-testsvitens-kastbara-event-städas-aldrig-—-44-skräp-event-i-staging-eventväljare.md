---
id: TASK-309.15
title: >-
  API-testsvitens kastbara event städas aldrig — 44 skräp-event i staging
  eventväljare
status: Done
assignee: []
created_date: '2026-08-24 16:37'
updated_date: '2026-08-24 18:13'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 578000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AVTÄCKT under Marcus granskning 2026-08-24, och det var granskningens egen felkälla.

Marcus granskade 'Fjärrskådning - text-deny-tom-body'. Mätt: det är ett kastbart event från API-testsviten. tests/api/save-event-text.staging.test.ts § createThrowawayEvent skapar event: 'Fjärrskådning', typ: 'Utbildning', ort: sentinelOrt(suffix) = 'ZZ-TASK-309.3-text-<suffix>-<uuid>', startdatum 2026-09-15. Startdatumet gör dem till KOMMANDE event, så de hamnar i eventväljaren.

MÄTT I STAGING (Airtable apphjj8Q7lkXCMsL4, 2026-08-24): 44 kvarvarande event med ort-prefixet ZZ-TASK-309.3-text-, samtliga med startdatum 2026-09-15. Det är bara en av flera sentinel-familjer.

ROTORSAK: sviten har ingen teardown. Rad 9 i filen konstaterar att ingen 'återställ ursprungsvärden'-teardown behövs — sant om FÄLTVÄRDEN, men den skapar också EVENT, och de raderas aldrig. .purge-staging-policy.json HAR en target (FIND('ZZ-TASK-309.3-', {Ort}) = 1), men setup-purgen kör FÖRE varje staging-CI-jobb, inte efter. Mellan en testkörning och nästa staging-jobb ligger skräpet kvar och syns för den som öppnar appen mot staging.

KONSEKVENS UTÖVER STÄDNING: en granskare som väljer ett sådant event ser en genereringsvy där varje block är tomt (testeventet har varken Eventinnehåll-data eller Plats-länk), vilket läser som ett designfel i vyn. Det kostade en granskningsrunda.

Marcus 2026-08-24: 'INGET lappande' — en manuell engångsradering är inte fixen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 save-event-text.staging.test.ts och save-event-content.staging.test.ts raderar sina egna kastbara event i teardown (afterAll eller motsvarande), oavsett testutfall
- [x] #2 Teardown är robust mot krasch: setup-purgen behålls som andra försvarslinje, den ersätts inte
- [x] #3 De 44 kvarvarande ZZ-TASK-309.3-text-* -eventen i staging är borta efter en körning
- [x] #4 Övriga sentinel-familjer inventerade: vilka svitar skapar event utan teardown — dokumenterat i kortet, åtgärdat eller öppet bokfört per familj
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1956 (merge `4fbc5b4c`, 2026-08-24T17:55:25Z).

**Tre av uppdragets premisser föll vid mätning, och agenten följde verkligheten.** Jag skrev 44 kvarliggande event i `-text-`-familjen; mätt blev det **55**, och **151 totalt** över FEM familjer (`ZZ-create-event-test` 61 · `-text-` 55 · `-plats-` 30 · `-content-` 5 · `-uppdaterad` 2). Jag skrev att setup-purgen inte städar; den gör det — 149 av 151 var yngre än 2,4 h, vilket är beviset för att purgen HADE kört. Fönstret mellan en körning och nästa staging-jobb är strukturellt, inte ett purge-fel.

**Extra fynd ingen letat efter:** `ZZ-create-event-test-uppdaterad` matchade INGEN target och låg kvar i **27 respektive 32 dygn**. `update-event.staging.test.ts` döper om sitt event mitt i testet och återställer i `finally` — faller `finally` är raden opurgbar för alltid.

**Vald form: ägar-manifest, inte teardown i testet.** Mätt först: ingen delete-EF för event finns (50 EF:er, enda delete-operationen är `delete-attachment`), och `ADR-060` punkt 2 förbjuder Airtable-token i testet. Sviten KAN alltså strukturellt inte städa själv. Manifestet (`tests/support/kastbara-poster.ts`, JSONL) bär bara KUNSKAPEN om vilka rader körningen skapade till det jobb där credentialen redan finns — punkt 4 ordagrant, tillämpad på efter-läget. Alt A (delete-EF med användar-JWT) förblir avvisad; ingen ny destruktiv yta.

**`ADR-060` punkt 3 amenderad öppet** (§ Updates 2026-08-24): setup-purge KOMPLETTERAS med efter-körning-purge. Punkt 2 och 4 orörda. Setup-purgen orörd som andra försvarslinje — verifierat: noll borttagna rader i dess flöde.

**AC-belägg mot `origin/main`:** #1 båda sviterna registrerar (`kastbara-poster` 3 resp. 2 träffar) · #2 setup-purgens flöde orört · #3 beståndet 151 → 115, samtliga yngre än 60 min och därmed inom setup-purgens räckvidd; `-uppdaterad` 2 → **0** (mätt oberoende av orkestreraren efter landning) · #4 **åtta** testsviter registrerar; Platser, Anmälningar, Anteckningar, Segment, Bilagor och Agendapunkter öppet bokförda som medvetet utelämnade (når aldrig eventväljaren).

**Skarp CI-verifiering:** jobbet instansieras aldrig på PR-ytan (`ci.yml` skickar `run_staging: false` villkorslöst) — en öppen post agenten själv bokförde. Post-merge-körningen `32759422247` för `4fbc5b4c`: **`Staging sentinel purge (efter körning)` → success.** Posten är därmed stängd.

**Tvåvägsbevis:** drift-vakten (manifest-sökväg ändrad → rött, återställd → grönt) · luckdetektionen (`ZZ-belaggning-fixtur` utan target → exit 2 med `LUCKA`, och fixturen finns kvar — den rapporterar, raderar aldrig) · den bärande negativa: en främmande rad som matchar formel och mönster perfekt raderas ALDRIG utan manifest-post.

DoD #3 är en härledd rad — landnings-pekaren ovan bär den.
<!-- SECTION:FINAL_SUMMARY:END -->
