---
id: TASK-213.1
title: 'Skiva: Å1 — Månad/år-horisonten, interim (§45/§36)'
status: To Do
assignee: []
created_date: '2026-08-14 17:21'
updated_date: '2026-08-24 14:44'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-213
ordinal: 388000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta (eller Marcus) skapar ett event med startdatum
2027-01-01 eller senare i staging respektive prod, och `create-event` svarar
200 i stället för dagens 500. Fixen är att lägga till optionerna
`Januari 2027` … `December 2027` på `Eventplanering.Månad/år`
(`fld2BjFdBd964TzVb`) i BÅDA baserna — ett rent tilläggs-jobb i Airtables UI,
noll app-ändring. Detta är INTERIMET (§45/§36): den permanenta fixen
(formelkonvertering + två EF-ändringar) är skiva 10 och behöver inte vänta
på detta.

**HITL — Marcus-moment, obligatoriskt.** Select-optioner kan (troligen) inte
läggas till via Airtables Meta-API (svagt belagt, se skiva 2) och
`mcp__airtable__update_field` exponerar bara namn/beskrivning — detta är
tolv handgrepp i Airtables UI, i BÅDA baserna. Prod-mutationen sker ALDRIG
utan att Marcus uttryckligen gett GO för just denna skiva (PRD-kortets
blast-radius-disciplin).

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P0 · Å1, med underlag
i `bas-defekt-kartlaggning-live-2026-08-14.md` (Fälla 45) och
`data-model.md` § Kända fällor post 36/45.

Täcker användarberättelser: 1
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eventplanering.Månad/år (fld2BjFdBd964TzVb) har optionerna Januari 2027 t.o.m. December 2027 tillagda i BÅDA baserna (staging apphjj8Q7lkXCMsL4 och prod app8uGPrVCVOm6LfD) — verifierat via describe_table: 26 optioner totalt
- [ ] #2 Skarpt bevis i staging: ett event med Startdatum 2027-01-15 skapas via create-event och svarar 200 (i dag 500)
- [ ] #3 Rollback-väg dokumenterad: de tillagda optionerna kan tas bort riskfritt så länge ingen post fått ett 2027-värde — bekräftat innan prod-mutationen
- [ ] #4 Marcus-GO för prod-mutationen inhämtat och citerat innan optionerna läggs till i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112-förberedelse (agent-säkert, 2026-08-24). MARCUS-MOMENT bekräftat: mcp__claude_ai_Airtable__update_field's options-schema stödjer ENDAST formula, inga select-choices — bekräftar (starkare än tidigare, tool-schema-nivå, inte bara "svagt belagt") att optionstillägg inte kan skriptas med tillgängligt Airtable-verktyg; måste ske i UI:t.
Läst live (prod app8uGPrVCVOm6LfD, fld2BjFdBd964TzVb): 14 befintliga val, November 2025 t.o.m. December 2026 — matchar AC#1:s förväntade 14+12=26 exakt. Rollback trivialt säker: inget värde 2027 existerar ännu i data, så borttagning av de 12 nya valen är riskfritt om avbrutet.
Agent kan förbereda: exakt lista över de 12 saknade valen (Januari–December 2027) redo att klistras in i UI:t; staging-verifieringens create-event-anrop (Startdatum 2027-01-15) skriptat och redo att köras direkt efter Marcus UI-ändring.
<!-- SECTION:NOTES:END -->
