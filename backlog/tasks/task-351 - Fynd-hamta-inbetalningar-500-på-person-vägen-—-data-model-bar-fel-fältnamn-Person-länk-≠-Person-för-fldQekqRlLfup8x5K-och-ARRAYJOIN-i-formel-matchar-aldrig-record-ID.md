---
id: TASK-351
title: >-
  Fynd: hamta-inbetalningar 500 på person-vägen — data-model bar fel fältnamn
  (Person (länk) ≠ Person) för fldQekqRlLfup8x5K, och ARRAYJOIN-i-formel matchar
  aldrig record-ID
status: To Do
assignee: []
created_date: '2026-08-31 10:04'
updated_date: '2026-08-31 10:25'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Fynd (S113-slutvandringen, orkestreraren, 2026-08-31)

`GET hamta-inbetalningar?personId=<rec>` returnerade HTTP 500 (Internal error) i staging, för BÅDE ett verkligt personId och ett obefintligt men giltigt-format personId. Felet ligger FÖRE datat.

### Grundorsak, mätt live 2026-08-31 mot staging (apphjj8Q7lkXCMsL4) och prod (app8uGPrVCVOm6LfD)

1. **Fel fältnamn.** `supabase/functions/hamta-inbetalningar/index.ts` byggde `filterByFormula: buildLinkedRecordFilter('Person (länk)', personId)` mot tabellen `Anmälningar`. Fältet `fldQekqRlLfup8x5K` heter i verkligheten **`Person`** (utan `(länk)`) i BÅDA baserna — `describe_table`-verifierat. Källan till felnamnet var `docs/reference/data-model.md` rad ~1053 (”Anmälningar — write-fält”-tabellen), som stod i självmotsägelse mot rad 950 i samma fil (§Kritiska länkfält), som redan hade rätt namn. Formeln föll med `422 INVALID_FILTER_BY_FORMULA: Unknown field names: person (länk)`, vilket EF:en mappade till en generisk `500`.

2. **Ett rent namnbyte hade INTE räckt — och hade varit en VÄRRE bugg.** Även med rätt namn matchar `FIND(personId, ARRAYJOIN({Person}))` ALDRIG: `ARRAYJOIN` på ett länkfält i en Airtable-FORMEL renderar de länkade posternas PRIMÄRFÄLT (personens NAMN), aldrig record-ID:t. Mätt: `FIND("rec2JwV3Bh0x5qlvl", ARRAYJOIN({Person}))` → 0 träffar, trots att den posten faktiskt länkar just den personen; `FIND("Cecilia Ödman", ARRAYJOIN({Person}))` (namnet) → träff. Ett namnbyte utan att åtgärda semantiken hade alltså bytt en 500:a mot en TYST tom sektion för varje person — en värre felklass, och namnkollisioner (samma namn, olika personer) hade gjort ett namn-baserat filter direkt farligt.

3. **Rätt design: API-READ av reverse-länken, ingen formel.** `Personer.Anmälningar (länkat fält)` (`fld8pOivka8YdiywK`, samma fält-ID i staging OCH prod) bär samma relation från andra hållet. Ett record-GET av Personens EGEN rad returnerar den länkens record-ID:n rakt av (API-läsning ≠ formel-rendering). Fixen läser `Personer/<personId>` och tar `anmalanIds` ur det fältet, respekterar befintlig `MAX_ANMALNINGAR_PER_PERSON`-tak via slice.

### Scope för denna skiva

- `supabase/functions/hamta-inbetalningar/index.ts`: byt person-vägen till record-GET mot Personer + reverse-länk, enligt ovan. Ta bort den nu oanvända `buildLinkedRecordFilter`/`fetchFromAirtable`-importen.
- `docs/reference/data-model.md`: rätta rad ~1053 (`Person (länk)` → `Person`, fält-id oförändrat) + rätta rad ~954 (`Personer.Anmälningar`-fältnamnet saknade `(länkat fält)`-suffixet) + ny §Kända fällor-post om ARRAYJOIN-i-formel vs API-READ-semantiken, med mätbeviset.
- Tvåsidigt bevis (ingen befintlig testsvit för denna EF:s formelbygge): manuell mätning bokförd i PR-kroppen — FÖRE (422/0-träffar) och EFTER (200/korrekt anmälan-lista, verifierat mot personens faktiska reverse-länk).
- INTE i scope: `_shared/airtable-filter.ts`s `buildLinkedRecordFilter`-hjälpare eller övriga formel-callers mot länkfält (get-attendance, segment-resolution) — de gör existens-/närvarotest, inte ID-uppslag, och rörs inte här. Flaggas som öppen granskningsfråga i §Kända fällor-posten.
- EF-DEPLOY till staging görs av orkestreraren efter landning, INTE av byggagenten.

### AC

1. `hamta-inbetalningar/index.ts` person-vägen använder record-GET mot Personer + `Anmälningar (länkat fält)`, ingen formel.
2. `docs/reference/data-model.md` rad ~1053 och rad ~954 rättade, med öppen rättelsenot + mätbevis.
3. Ny §Kända fällor-post om ARRAYJOIN-i-formel-semantiken.
4. DoD-grindar gröna (typecheck, biome, build, test:api).
5. Manuellt före/efter-bevis bokfört i PR-kroppen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 hamta-inbetalningar/index.ts person-vägen använder record-GET mot Personer + fältet Anmälningar (länkat fält), ingen formel mot Anmälningar
- [x] #2 docs/reference/data-model.md rad ~1053 och rad ~954 rättade (fältnamn), med öppen rättelsenot + mätbevis
- [x] #3 Ny §Kända fällor-post dokumenterar ARRAYJOIN-i-formel-semantiken (renderar primärfält, inte record-ID) med mätbevis
- [x] #4 DoD-grindar gröna: typecheck, biome, build, test:api
- [x] #5 Manuellt före/efter-bevis (Airtable-nivå) bokfört i PR-kroppen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## R1-granskning (review-agent, orkestrerarens svep) — 2 fynd, båda åtgärdade

**WARNING (rättad):** ursprungliga §Kända fällor-posten 53 + PR-kroppen påstod
felaktigt att get-attendance och _shared/segment-resolution.ts var "andra
callers" av buildLinkedRecordFilter som gjorde säker existens-läsning.
Grep-verifierat FALSKT — ingen av de två anropar helpern över huvud taget.
get-attendance undviker den MEDVETET (egen kommentar, citerar uttryckligen
"T15-klass-bugg"); segment-resolution.ts läser fältvärdet direkt utan filter.

**Viktigt sidofynd under rättelsen:** detta ÄR tasks/threads/README.md §T15
igen — en tråd stängd Session 26 (6c-completion) som redan dokumenterade
EXAKT samma ARRAYJOIN-mekanism och konstaterade "buildLinkedRecordFilter har
noll live-callers, dormant kod". hamta-inbetalningar (TASK-346.4, commit
23e74c01, långt efter T15s stängning) återinförde en live-caller utan att
kopplas till T15s varning. Efter denna PRs fix har buildLinkedRecordFilter
ÅTER noll live-callers repo-brett — samma läge som vid T15s stängning.

Avvecklings-kandidat registrerad här (INTE åtgärdad i denna skiva, ren
targeted bug-fix): ta bort den dormanta buildLinkedRecordFilter-helpern, eller
@deprecated + lint-vakt mot nya callers, så klassen inte kan återinföras tyst
en tredje gång. Öppen fråga till orkestreraren: bör tasks/threads/README.md
§T15 uppdateras/återöppnas för att fånga denna återkomst? Bedömt utanför
scopet för en riktad review-fix i denna PR — flaggat i stället för att ändras
ensidigt.

**INFO (åtgärdat):** person-vägens identiska tomma 200-svar för "person
saknas" vs "person finns men har noll anmälningar" är AVSIKTLIGT — speglar
anmalanRecordId-vägens beteende (samma fil). Dokumenterat med docstring-
kommentar i hamta-inbetalningar/index.ts vid person-branchen.
<!-- SECTION:NOTES:END -->
