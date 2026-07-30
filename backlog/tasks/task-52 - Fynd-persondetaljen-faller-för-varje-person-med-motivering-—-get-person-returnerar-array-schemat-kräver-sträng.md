---
id: TASK-52
title: >-
  Fynd: persondetaljen faller för varje person med motivering — get-person
  returnerar array, schemat kräver sträng
status: To Do
assignee: []
created_date: '2026-07-25 23:43'
updated_date: '2026-07-30 19:22'
labels: []
dependencies: []
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
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
<!-- SECTION:NOTES:END -->
