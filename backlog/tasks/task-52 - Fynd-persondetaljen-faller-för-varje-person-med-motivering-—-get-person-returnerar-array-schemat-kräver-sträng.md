---
id: TASK-52
title: >-
  Fynd: persondetaljen faller för varje person med motivering — get-person
  returnerar array, schemat kräver sträng
status: To Do
assignee: []
created_date: '2026-07-25 23:43'
updated_date: '2026-07-28 14:34'
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
<!-- SECTION:NOTES:END -->
