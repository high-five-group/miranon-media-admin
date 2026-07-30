---
id: TASK-89
title: 'Fynd: person-detail-fallets orsakskedja mot TASK-52 är ej verifierad'
status: Done
assignee: []
created_date: '2026-07-29 17:36'
updated_date: '2026-07-30 19:49'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`TASK-52` säger att persondetaljen faller för varje person med motivering, och att orsaken är att `get-person` returnerar en array där schemat kräver en sträng.

Restlistan bär posten `person-detail kontra TASK-52 — orsakskedjan ej verifierad`. Alltså: **vi har en trolig orsak, inte en belagd.**

Det finns dessutom ett angränsande fynd som gör verifieringen värd att göra ordentligt: `TASK-64`:s diagnos visade sig delvis falsifierad — `person-detail:140` föll sex rader FÖRE `T26`:s data-grind, så grinden vaktar rätt sak av fel skäl. Samma yta har alltså redan burit en felaktig orsaksförklaring en gång.

**Denna skiva verifierar orsakskedjan. Den fixar ingenting** — fixen hör till `TASK-52` och ska bygga på ett belagt fel, inte ett antaget.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Orsakskedjan reproducerad: exakt vilket anrop som returnerar vad, och exakt var schemat avvisar det — med rad-referens, inte prosa
- [x] #2 Verifierat mot KODEN och ett faktiskt svar, inte mot kortets påstående
- [x] #3 Utfallet skrivet in i TASK-52 så fixen bygger på belägg — även om utfallet är att kortets diagnos INTE stämmer
- [x] #4 Om diagnosen faller: det redovisas som resultat, inte tystas — jfr TASK-64:s delvis falsifierade diagnos på samma yta
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UTFALL 2026-07-30: HUVUDDIAGNOSEN HÅLLER, EN DELNOT FALLER. Kortet prövade TASK-52:s orsakskedja som hypotes, inte som premiss.

METOD — tre oberoende led, inget hämtat från kortets egen text:
(a) Airtable-schemat och fältvärdet lästa direkt ur staging (apphjj8Q7lkXCMsL4) via MCP.
(b) Den DEPLOYADE get-person-EF:en anropad live med giltig user-JWT — faktiskt HTTP-svar, ej simulerat.
(c) Repots EGET PersonDetailSchema importerat från källfilen och kört mot de faktiska EF-svaren. Ingen kopia av schemat, ingen omskrivning av mappningen.

BELAGD KEDJA (AC 1):
  Airtable 'Motivering (text)' fld4ENxbma679wvcC -> ["..."] (array)
  -> supabase/functions/get-person/index.ts:128  motivering: f['Motivering (text)'] ?? null  (rakt av)
  -> EF svarar HTTP 200 med arrayen orörd — EF:en fäller inte
  -> src/data/adapters/AirtableAdapter.ts:131    PersonDetailSchema.parse(data.person)
  -> src/domain/schemas/PersonDetail.schema.ts:44  motivering: z.string().nullable()  AVVISAR
  ZodError: path=["motivering"] code=invalid_type — 'Invalid input: expected string, received array'
Båda rad-referenserna i TASK-52 (get-person:128, PersonDetail.schema.ts:44) stämmer exakt.

BEVIS I BÅDA RIKTNINGAR:
  Greta Granskning (rec2ChwRvXAjwdr4m, motivering)        -> parse FÄLLER
  Frida Granskning (recw3SNa4ulwSN3tZ, motivering)        -> parse FÄLLER
  ZZ-History Person 01 (recqxaFNwHAdQlAqb, ingen motiv.)  -> parse GRÖN
  Greta med ENDAST motivering plattad till sträng         -> parse GRÖN, noll kvarvarande issues

DELVIS FALSIFIERAT (AC 4). TASK-52:s Implementation-not sade 'array när flera anmälningar finns'. Fel: båda observerade personerna har 'Antal anmälningar (totalt)' = 1 och får ändå array (längd 1). Arrayformen uppstår redan vid FÖRSTA motiveringen och är oberoende av anmälningsantalet. Kortets titel/beskrivning ('varje person med motivering') var alltså rätt och noten fel — motsatt riktning mot TASK-64:s precedent, där beskrivningen bar felet.

MEKANISM SOM SAKNADES I KORTET: formelns ELSE-gren returnerar rollup-referensen ORÖRD, medan villkorsgrenen konkatenerar och därmed tvingar sträng. Airtable-schemat deklarerar samtidigt result-typen som singleLineText — uppslag av fälttypen ger alltså ett svar som motsäger API:ets faktiska form.

ÖPPET LED, EJ MÄTT: flerhet (>1 element) är INTE observerad någonstans i staging. TASK-52:s rekommendation (b) 'bevarad flerhet' vilar på ett omätt antagande. Registrerat i TASK-52, ej avgjort här — formvalet är fixens beslut, inte verifieringens.

DETTA KORT FIXAR INGENTING. Ingen produktionskod rörd; leveransen är belägget.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Orsakskedjan reproducerad med rad-referenser: get-person/index.ts:128 → EF HTTP 200 med array orörd → AirtableAdapter.ts:131 → PersonDetail.schema.ts:44 avvisar med invalid_type, expected string received array. Verifierat mot deployad EF med giltig user-JWT och mot repots EGET schema importerat från källfilen. TASK-52:s not FALSIFIERAD i motsatt riktning: arrayen uppstår vid FÖRSTA motiveringen, inte vid flera anmälningar — båda observerade personerna har Antal anmälningar totalt = 1. Mekanismen: formelns ELSE-gren returnerar rollup-referensen orörd medan Airtable deklarerar result: singleLineText, alltså schema mot API-form. Utfallet skrivet i TASK-52 och registrerat som fälla 46 i data-model.md. PR #476, CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
