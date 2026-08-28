---
id: TASK-331
title: >-
  Fynd: kontraktsvaktens fixtur saknar datum + eventmatchning — drift sedan
  TASK-284
status: To Do
assignee: []
created_date: '2026-08-28 03:35'
updated_date: '2026-08-28 04:29'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 604000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ROTORSAK (källmärkt, ADR-086): nightly-jobbet "Kontraktsvakt (fixtur mot skarp staging)" var rött tre nätter i rad med identiskt fel — run 32800998004 (25/8), 32922748733 (26/8), 33065848810 (27/8), 1 failed / 9 passed varje natt. Larm: "[FIXTUREN-BAKOM] Staging levererar 2 nyckel/nycklar som fixturen saknar · datum skarp typ: null | sträng (i 81/81 skarpa poster) · eventmatchning skarp typ: sträng (i 81/81 skarpa poster)". Test: tests/kontraktsvakt/kontraktsvakt.staging.test.ts (rad ~80), körs med npm run vakt:kontrakt (Playwright-projektet kontraktsvakt, mot SKARP staging). Fälten datum + eventmatchning lades till som ADDITIVT-OPTIONAL i src/domain/schemas/Registration.schema.ts (rad 92 + 95) av commit 0667ec8c (TASK-284.1, 2026-08-21) resp 3a355a49 (TASK-284.3, 2026-08-21), utan att ADDITIVA_ANMALNINGSFALT i tests/support/fixturvarld/fixture-data.ts (rad 181-192) uppdaterades i samma commit. Fixturen bär i dag TOLV av de FJORTON additiva fälten schemat deklarerar — eventmatchning och datum saknas helt. Precedent: TASK-255 (Done, 2026-08-17, commit a499018f) löste exakt samma driftklass för Kursfamilj/Kursnivå i EVENTS_RESPONSE — samma vakt, samma FIXTUREN-BAKOM-klass, samma lösning. Läs det kortets Implementation Notes + commit a499018f för formen. Kontraktsvaktens jämförelse (tests/kontraktsvakt/kontraktsjamforelse.ts, granskaKontrakt) jämför FORM (typtoken-mängd per nyckel, null exkluderat via ickeNullTyper), inte exakta värden. eventmatchning observerades ALLTID sträng (81/81, aldrig null — formeln har ingen BLANK-väg), så fixturens värde måste vara en av OK/Avviker/Utan event, ALDRIG null. datum observerades null | sträng (81/81) — fältet är anmälans EGNA fritext-svar (Datum, singleLineText, jämförs av Eventmatchning-formeln mot facit-lookupen Datum from Event per data-model.md rad 1186-1187 [rättat i review-runda 2, PR #2051 — stod tidigare felaktigt som 1134-1135]), så fixturen behöver BÅDA formerna representerade för att provtrycka typparitet, inte bara resolvera saknad-nyckel-avvikelsen. VARFÖR GRINDEN SAKNADES (utanför scope, registreras som fynd i notes): schema-tillägget landade grönt i PR-CI eftersom kontraktsvakten ENDAST körs nightly mot skarp staging (ADR-080 beslut 3) — den kan strukturellt inte fälla en PR. Bedöm i notes om detta är TASK-195-klassen eller motiverar en NY grind-kategori: schema lägger till additivt-optional fält utan motsvarande fixtur-uppdatering fälls i PR-CI i stället för att upptäckas först i nightly. Bygg INTE grinden — bara bedöm och registrera förslaget (ADR-053).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 fixture-data.ts bär datum (sträng|null) + eventmatchning (sträng) med domänsanna värden per data-model.md
- [x] #2 npm run vakt:kontrakt grön mot staging, tvåsidigt bevisad (röd före/grön efter) — loggutdrag i notes
- [x] #3 Registration.schema.ts:s additiva fält och ADDITIVA_ANMALNINGSFALT korsverifierade, ingen tredje drift
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TVASIDIGT BEVIS (npm run vakt:kontrakt, MM_STAGING_PREFLIGHT=off, staging 2026-08-28):

RÖTT FÖRE (git stash av fixture-data.ts, körning mot 96 skarpa poster):
  KontraktsavvikelseError — get-registrations
  1. [FIXTUREN-BAKOM] Staging levererar 2 nyckel/nycklar som fixturen saknar
       · datum   skarp typ: null | sträng   (i 96/96 skarpa poster)
       · eventmatchning   skarp typ: sträng   (i 96/96 skarpa poster)
  1 failed / 1 passed (api-setup)

GRÖNT EFTER (full svit, kontraktsvakt-projektet):
  10 passed (17.4s) — samtliga 7 formfall + 2 felkontraktsfall + api-setup.

STEG 5 — KORSVERIFIERING (AC #3): Registration.schema.ts:s 14 ADDITIVT-OPTIONAL-fält (noteringAnmalningsavgift, noteringSlutbetalning, paminnelseAnmalningsavgiftSkickad, paminnelseSlutbetalningSkickad, kalla, medfoljandeTill, bekraftelseSkickad, deltagarinfoSkickad, antalGenomfordaEvent, borOver, erfarenhetsbadge, kurshistorik, eventmatchning, datum) jämförda mot ADDITIVA_ANMALNINGSFALT rad för rad. Ingen tredje drift — samtliga 14 nu representerade. De 20 obligatoriska (icke-optional) fälten kontrollerades separat och fanns redan direkt på varje av de 6 posterna (zod-parse hade fällt annars, oberoende av vakten).

VÄRDEVAL: eventmatchning='OK' på samtliga 6 poster (matchar 96/96 observerad "alltid sträng, aldrig null"). datum='20 sep 2026' default, override till null på den manuellt skapade posten (recVisualReg000006, kalla:'Manuell') — provtrycker BÅDA formerna (null|sträng, matchar 96/96 observerat).

RÄTTAT I REVIEW-RUNDA 2 (PR #2051, review-agentens FYND 1 — WARNING): Denna sektion påstod tidigare felaktigt "grep-verifierat att ingen vy under src/ läser datum". Det stämmer INTE — AnmalningRadResolution.tsx:140 och KopplaTillEventDialog.tsx:122 renderar båda registration.datum ?? 'Uppgift saknas'. Den PRAKTISKA slutsatsen (inga baselines rör sig) håller ändå, men av en ANNAN grund: AnmalningarSida.tsx (rad ~801/812) villkorar AnmalningRadResolution på behoverAtgard(reg), som kräver eventmatchning==='Avviker'|'Utan event'. Det var false för ALLA poster redan FÖRE denna PR (eventmatchning var då undefined, vilket missar båda likhetsjämförelserna precis som 'OK' gör nu) — övergången undefined→'OK' ändrar alltså inte sanningsvärdet för någon post. Det är DETTA, inte frånvaron av läsande vyer, som håller baselinerna stilla. LATENT RISK, nu dokumenterad (samma text tillagd i fixture-data.ts:s docblock): sätter en framtida fixtur-post som delar ADDITIVA_ANMALNINGSFALT eventmatchning≠'OK', dyker datum-defaulten '20 sep 2026' upp i dialogerna där 'Uppgift saknas' visades tidigare — sätt då datum explicit på den posten.

RÄTTAT I REVIEW-RUNDA 2 (FYND 2 — INFO): data-model.md-radciteringen för Datum (from Event)/Eventmatchning var felaktigt angiven som rad 1134-1135 (både i beskrivningen och i fixture-data.ts:s docblock) — korrekt är rad 1186-1187 på origin/main (dokumentet har växt sedan citeringen skrevs). Rättat på båda ställena.

VARFÖR GRINDEN SAKNADES: INTE TASK-195-klassen. TASK-195 handlar om Deno-EF:ers modul-länkning (boot-fel från felaktiga imports/exports i supabase/functions, osynligt för Node-baserade api-pure-tester). Denna drift är en ANNAN mekanism: ett zod-schema fick ett nytt ADDITIVT-OPTIONAL fält utan att en separat TypeScript-fixtur (tests/support/fixturvarld/fixture-data.ts) uppdaterades i samma commit — inget kompilatorfel uppstår (fixturen är fortfarande giltig JSON-form, bara ofullständig), och ingen befintlig PR-CI-grind parsar fixturen mot schemat för fält-TÄCKNING (bara mot att befintliga fält har rätt typ). FÖRSLAG (ej byggt, endast registrerat per ADR-053): en gatekeeper-testsvit som vid varje PR diffar RegistrationSchema/EventSchema/PersonSchema/PersonDetailSchema m.fl. sina '.optional()'-nycklar mot motsvarande ADDITIVA-konstanter i fixture-data.ts och fäller om schemat har en nyckel fixturen saknar — samma jämförelse kontraktsvakten redan gör, men körd OFFLINE (rent, utan staging) och därmed presubmit-säker. Skulle ha fångat både TASK-255 och detta fynd i PR-CI i stället för i nightly.

OVÄNTAT FYND UTANFÖR SCOPE (registrerat, ej åtgärdat): under verifieringen upptäcktes att git stash är en REPO-BRED, ICKE per-worktree mekanism — refs/stash delas av alla worktrees under samma .git-common-dir. Två stash push/pop-cyklar (körda för att isolera röd-före/grön-efter-bevis) kolliderade med samtidig aktivitet i andra sessioner: en git stash pop applicerade en FRÄMMANDE stash-post (commit ed98ea55, meddelande "On main: S108 resume 13: främmande S112-ändring av task-323 ... — parkerad, ej min") i stället för min egen, och min egna fixture-data.ts-ändring hamnade som en icke-refererad men återvinningsbar commit (8bcee4e2, verifierad git fsck --unreachable). Återställd med git checkout 8bcee4e2 -- tests/support/fixturvarld/fixture-data.ts (ingen ytterligare stash-operation). Ingen dataförlust skedde, men mekanismen är en generell multi-agent-risk (ej miranon-specifik) — flaggas i slutrapporten för orkestrerarens bedömning, ingen tråd/lesson skapad av mig (utanför mitt mandat som bygg-agent på detta kort).
<!-- SECTION:NOTES:END -->
