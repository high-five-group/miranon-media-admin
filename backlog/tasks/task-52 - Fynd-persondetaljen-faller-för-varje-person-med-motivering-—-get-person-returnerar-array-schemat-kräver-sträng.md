---
id: TASK-52
title: >-
  Fynd: persondetaljen faller för varje person med motivering — get-person
  returnerar array, schemat kräver sträng
status: Done
assignee: []
created_date: '2026-07-25 23:43'
updated_date: '2026-08-10 07:22'
labels:
  - ready-for-human
dependencies: []
modified_files:
  - supabase/functions/get-person/index.ts
  - src/domain/schemas/PersonDetail.schema.ts
  - src/components/persons/PersonDetail.tsx
  - src/components/persons/PersonDetailPrototyp.tsx
  - tests/support/fixturvarld/fixture-data.ts
  - tests/acceptance/person-detail.acceptance.test.ts
  - tests/acceptance/person-note-edit.acceptance.test.ts
  - tests/api/coerce.test.ts
  - tests/api/kontraktsvakt-jamforelse.test.ts
  - tests/kontraktsvakt/kontraktsfall.ts
  - docs/reference/data-model.md
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt i S90:s persondetalj-prototyppass (2026-07-26) och LIVE-VERIFIERAT mot staging-basen via MCP.

SYMPTOM: /personer/$personId visar felvy i stället för persondetaljen för varje person som har fyllt i motivering i anmälningsformuläret.

GRUNDORSAK (live-belagd, inte antagen): Airtables 'Motivering (text)' (fld4ENxbma679wvcC på Personer, tbl6ZyCm3V026iFTU) är en LOOKUP och returnerar därför en ARRAY av strängar — verifierat mot två skarpa poster i staging-vyn 'Motiveringar' (viwWkH5kn900Ygurh): värdet kommer som ["Jag har länge varit nyfiken på medvetandeutveckling..."], aldrig som naken sträng. supabase/functions/get-person/index.ts:128 mappar fältet rakt av (f['Motivering (text)'] ?? null), och src/domain/schemas/PersonDetail.schema.ts:44 deklarerar motivering: z.string().nullable(). Zod-parsningen fäller alltså svaret.

OMFATTNING: träffar ALLA personer med minst en motivering, alltså i praktiken varje deltagare som anmält sig via formuläret. Personer utan motivering (rena leads) är opåverkade — vilket förklarar varför defekten kunnat leva: e2e-sviten och fixturvärlden använder schema-trogna strängar, så ingen grind ser den.

ATT AVGÖRA I SKIVAN: (a) ska schemat ta emot arrayen och klienten joina den (flera anmälningar = flera motiveringar), eller (b) ska EF:en platta den server-side per 3.8 källa-vs-implementation-skiktningen? Motiveringar hör till ANMÄLNINGAR, inte till personen — flera anmälningar ger flera motiveringar, och att tyst ta första elementet vore en osanning. Rekommendation: (b) med bevarad flerhet, dvs. shape-utökning till lista.

BEVIS-KRAV: fixturvärlden och e2e MÅSTE få ett fall med array-form, annars återuppstår klassen. Samma klass finns potentiellt i andra lookup-fält som mappas rakt av i get-person — en genomgång av mapPerson mot faktiska fälttyper hör till skivan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FAKTARÄTTELSE 2026-07-28 (TASK-68, verifierad direkt mot staging-schemat via Airtable-MCP): fältet är INTE ett lookup. 'Motivering (text)' (fld4ENxbma679wvcC) är en FORMULA — IF({fldIuuv4orI0DyLro} & "" = "", "", {fldIuuv4orI0DyLro}) — över ROLLUPEN 'Motivering (från anmälningsformulär)' (fldIuuv4orI0DyLro), som i sin tur rollar upp fldAv80U5ssqOYguK via Anmälningar-länken fld8pOivka8YdiywK.

SYMPTOMET ÄR OFÖRÄNDRAT (array när flera anmälningar finns), men ÅTGÄRDEN PÅVERKAS: värdet kan inte skrivas på personen. Det sätts på en länkad Anmälan och propagerar därifrån. Kortets ursprungliga formulering 'är en LOOKUP' står kvar i beskrivningen som historik — läs denna not som facit.

BEVISLÄGE EFTER TASK-68: defekten fälls nu av kontraktsvaktens negativa self-test i api-pure vid VARJE PR, utan staging — TASK-52:s exakta form (motivering: ['Det är dags', null]) spelas upp och ger SCHEMA-STAGING + TYPDIVERGENS. Den nattliga vakten är dock BLIND för fältet på sitt ankare (ZZ-History Person 01 har motivering: null, och typjämförelsen hoppar över null-nycklar). Att stänga den blindheten kräver permanent staging-data med ifylld motivering — eget arbete, ej del av TASK-52.

ORSAKSKEDJAN VERIFIERAD 2026-07-30 (TASK-89, egen mätning mot staging + repots egen kod). Kortets huvuddiagnos HÅLLER — men en av dess egna noter faller.

KEDJAN LED FÖR LED, VARJE LED MÄTT:

1. AIRTABLE RETURNERAR ARRAY. 'Motivering (text)' (fld4ENxbma679wvcC, Personer tbl6ZyCm3V026iFTU, staging) läst via MCP: ["Jag har länge varit nyfiken på medvetandeutveckling..."]. Fälttypen bekräftad självständigt via describe_table: FORMULA, inte lookup — TASK-68:s rättelse står.

2. get-person/index.ts:128 mappar rakt av: motivering: f['Motivering (text)'] ?? null. Ingen scalarString/stringArray — till skillnad från grannraderna 98 (ort) och 127 (allaHamtningar).

3. DEN DEPLOYADE EF:EN SVARAR HTTP 200 MED ARRAYEN ORÖRD. Anropat live mot staging med giltig user-JWT:
   get-person?id=rec2ChwRvXAjwdr4m (Greta Granskning) -> 200, motivering: ["Jag har länge varit nyfiken..."], Array.isArray=true, längd 1
   get-person?id=recw3SNa4ulwSN3tZ (Frida Granskning) -> 200, motivering: ["Har gått en introduktionskväll..."], längd 1
   EF:en fäller alltså INTE. Felet uppstår först i klienten.

4. AirtableAdapter.ts:131 PersonDetailSchema.parse(data.person).

5. PersonDetail.schema.ts:44 motivering: z.string().nullable() AVVISAR. Repots EGET schema kört mot de FAKTISKA EF-svaren (importerat från källfilen, ingen kopia):
   path=["motivering"] code=invalid_type — 'Invalid input: expected string, received array'

BEVIS I BÅDA RIKTNINGAR:
- Kontrollprov: ZZ-History Person 01 (recqxaFNwHAdQlAqb, ingen motivering) -> motivering: null -> parse GRÖN.
- Isoleringsprov: samma Greta-post med ENDAST motivering plattad till sträng -> parse GRÖN, noll kvarvarande issues. Motivering är ensam orsak, inte en av flera.

FALSIFIERAT — KORTETS EGEN NOT. 'SYMPTOMET ÄR OFÖRÄNDRAT (array när flera anmälningar finns)' STÄMMER INTE. Båda observerade personerna har 'Antal anmälningar (totalt)' = 1 och får ändå array (längd 1). Arrayformen är OBEROENDE av antalet anmälningar — den uppstår redan vid FÖRSTA motiveringen. Kortets titel och beskrivning ('varje person med motivering') är alltså den korrekta formuleringen; Implementation-notens kvalificering är fel och skulle leda fixen fel — den antyder att enfallet är säkert.

MEKANISMEN (varför just detta fält). Formeln är IF({fldIuuv4orI0DyLro} & "" = "", "", {fldIuuv4orI0DyLro}). Villkorsgrenen konkatenerar (& "") och tvingar sträng — men den grenen returnerar bara tomma strängen. ELSE-grenen returnerar ROLLUP-REFERENSEN ORÖRD, och en orörd rollup-referens bär sin flervärda form hela vägen till REST-svaret. Airtables schema DEKLARERAR samtidigt result: {type: singleLineText} — den som slår upp fälttypen får ett svar som motsäger API:ets faktiska form. Det är skälet defekten var lätt att missa.

FLERHET ÄR INTE OBSERVERAD. Ingen staging-post bär mer än ETT element (2 av 28 personer har motivering alls; båda med en anmälan). Kortets rekommendation (b) 'shape-utökning till lista med bevarad flerhet' vilar därmed på ett rimligt men OMÄTT antagande om att flera motiveringar ger flera element. Prod är inte mätt (förbjuden bas). Skivan bör pröva flerhet explicit innan formen låses.

SAMMA FORMELMÖNSTER I TRE SYSKONFÄLT — STRUKTURELL MISSTANKE, EJ BELAGD. Kortets punkt 'genomgång av mapPerson mot faktiska fälttyper' har en konkret start: 'Nästa event (text)' (fldc0Zdap83E3jMwi), 'Senast deltagande (text)' (fldcvEZBNvkl1MCN3) och 'Senast touchpoint (text)' (fld8y8pf87Lq09F91) bär alla formen IF({rollup}, IF(FIND(nyrad,{rollup}), LEFT(...), {rollup}), BLANK()) — där den INRE else-grenen returnerar rollupen rakt av, exakt som motivering. De mappas rakt av på get-person:120 respektive :106 (via 'Senaste interaktion (text)') mot z.string().nullable() (PersonDetail.schema.ts:37, Person.schema.ts:21). I de tre observerade svaren var nastaEvent null hos ALLA tre och senasteInteraktion en sträng hos kontrollpersonen — alltså varken belagt eller avfärdat. nastaEvent är i praktiken alltid null i drift (noterat i fixture-data.ts), så fältet är OPRÖVAT snarare än grönt.

FIX (2026-08-10): motivering var/är i praktiken alltid f['Motivering (text)'] ?? null — get-person mappade rått, PersonDetail.schema.ts krävde z.string().nullable(). Live-verifierat mot staging via Airtable-MCP (describe_table, apphjj8Q7lkXCMsL4/tbl6ZyCm3V026iFTU): fältet ÄR en FORMEL (fld4ENxbma679wvcC, IF({fldIuuv4orI0DyLro}&""="","",{fldIuuv4orI0DyLro})) över rollupen 'Motivering (från anmälningsformulär)' (1→MÅNGA över Anmälningar) — bekräftar TASK-68:s rättelse (INTE ett lookup, kortets ursprungliga ordval). ELSE-grenen returnerar rollupen ORÖRD vilket ger array så fort minst en motivering finns, trots deklarerad singleLineText.

PREMISS-PASS-DIVERGENS (ADR-086, registreras oppet): TASK-89:s ankarposter Greta (rec2ChwRvXAjwdr4m) och Frida (recw3SNa4ulwSN3tZ) EXISTERAR INTE LANGRE i staging (troligen sopade av en granskningsfixtur-sweep). Live-sokning 2026-08-10 (list_records, filter Antal anmalningar>0): NOLL av 18 traffade personer har ett ifyllt Motivering (text) just nu. Blockerar INTE - bug-mekanismen ar verifierad strukturellt (formel + schema, ej beroende av specifika rader) - men bokfors eftersom kortets tva skarpa poster i vyn Motiveringar inte gar att aterfinna idag.

FIXEN, RATT LAGER: get-person/index.ts coercar nu med stringArray (befintlig _shared/coerce.ts-hjalpare, samma monster som ort/allaHamtningar) i stallet for ra passthrough. PersonDetailSchema.motivering: z.string().nullable() -> z.array(z.string()) - flerhet bevaras (kortets egen rekommendation (b) i ATT AVGORA I SKIVAN), aldrig tyst forsta-element. BEVIS-KRAV - genomgang av mapPerson (kortets egen ask): live-verifierade ALLA falt i mapPersonDetail mot faktisk Airtable-schema (describe_table). Tva syskonfalt delar EXAKT samma formelmonster (IF/FIND/LEFT, ELSE returnerar kallrollupen orort): Nasta event (text) och Senast touchpoint/deltagande (text) (via Senaste interaktion (text)). Lade defensiv scalarString pa bada - NOLL observerbar skillnad idag (nastaEvent ar i praktiken alltid null i drift, senasteInteraktion bar redan skalara strangar) men stanger samma riskklass om kallrollupen nagonsin blir fler-vard. EJ ett bekraftat fel (TASK-89: strukturell misstanke, ej belagd) - separat fran motiverings bekraftade fix. Ovriga raw-mappade falt verifierade INTE dela risken (direkta primitiv-falt eller formler over numeriska rollups) - ingen andring dar.

KASKAD (samma commit): PersonDetail.tsx (DescRow .join, empty-state-guard) - PersonDetailPrototyp.tsx (KASTBAR men maste typechecka, 3 stallen) - fixture-data.ts (RIK_DETALJ->array, TUNN/HARLEDD->[]) - person-detail.acceptance.test.ts + person-note-edit.acceptance.test.ts (fixtur-typ) - coerce.test.ts (nytt test.describe, ROTT-FORST FAKTISKT KORT via git stash-differential mot gamla schemat, se slutrapport) - kontraktsvakt-jamforelse.test.ts (TASK-52-self-testet skrevs om till att prova REGRESSIONS-riktningen array->skalar, verifierat gront) - kontraktsfall.ts (prosa till STANGD-status, plus en pre-existing faltnamn/ID-felmarkning fldrMT8cWP3NmBc9T->fld4ENxbma679wvcC rattad, den horde till fel tabell) - data-model.md paragraf 46 (app-konsekvens STANGD, bas-deklarationen kvarstar oppen som T16).

VIKTIG DRIFT-KONSEKVENS: 3 av 8 get-person.staging.test.ts-fall failar LOKALT (ZodError: motivering expected array, received null) - EXPECTED deploy-lag, INTE en regression. Differentialbevisat: samma 8 test 8/8 grona pa oror main, 5/8 grona + 3 ZodError efter fixen (git stash/pop). Orsak: EF-deploy ar MANUELL (ADR-050: Ingen deploy-automatik, Fas 7-skuld), staging kor dessutom POST-MERGE (ci.yml skickar run_staging:false ovillkorligt till ci-suite.yml, bekraftat i .github/workflows/ci.yml + post-merge.yml), sa PR-grinden (test-fast/api-pure) paverkas INTE - test:api:pure 275/275 gront. Post-merge-jobbet KOMMER dock falla pa get-person tills funktionen redeployas manuellt till staging - och motsvarande i PROD tills prod-deploy kors. Utanfor denna skivas rackvidd (ingen deploy-behorighet i denna korning) men bokfort sa ingen tolkar en post-merge-rod get-person.staging.test.ts som en ny regression.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1079 (14a2479e, mergad ddd0bd82): coercion i EF + schema + två syskonfält defensivt; tvåsidigt bevis (coerce.test.ts rött mot pre-fix, grönt efter). EF deployad till staging + prod 2026-08-10 (refs disk-verifierade ur .env-modefilerna). DoD 3-beviset: post-merge-run 31364858043 (main 644d0412) GRÖN inkl. get-person.staging.test.ts. Persondetalj-sidan felar inte längre för personer med motivering.
<!-- SECTION:FINAL_SUMMARY:END -->
