---
id: TASK-213.10
title: 'Skiva: Å9 — Månad/år permanent: formel + EF-skrivningarna bort (§45/§36, B2)'
status: To Do
assignee: []
created_date: '2026-08-14 17:24'
labels:
  - ready-for-human
dependencies:
  - TASK-213.1
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 397000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: skapas eller ändras ett event över en årsgräns i staging
följer `Månad/år` `Startdatum` automatiskt — ingen skriver det längre, och
drift-risken mellan de två fälten är permanent stängd. Detta är DEN
PERMANENTA fixen som skiva 1:s interim köpte tid för.

**Beror på skiva 1 (samma fält, interimet får inte motsägas av den
permanenta fixen förrän den landar) och skiva 2 (options.formula-provet
avgör om konverteringen kan skriptas eller är handarbete).**

**B2 — BAS OCH APP LANDAR I SAMMA PR, inte två.** Konverteras
`Eventplanering.Månad/år` (`fld2BjFdBd964TzVb`) till en formel härledd ur
`Startdatum` blir fältet beräknat och därmed INTE skrivbart. Två Edge
Functions skriver det i dag: `supabase/functions/create-event/index.ts:204`
och `update-event/index.ts:222` — båda skrivningarna MÅSTE tas bort i samma
landning, annars avvisar Airtable skrivningen och båda funktionerna börjar
fela. `create-event/index.ts:98` läser dessutom fältet via
`selectName(f['Månad/år'])`; en formel returnerar en sträng, inte en
`{name}`-form — läsvägen ses över samtidigt. `Anmälningar.Månad/år (from
Event)` (`fldZ7h3GwTZnvyRfC`) är en lookup och följer med automatiskt.

**R3 — typkonvertering är destruktiv för lagrade värden.** Exportera
kolumnen FÖRE konverteringen, i båda baserna.

**HITL — Marcus-moment, obligatoriskt.** Fälttypskonvertering i Airtables
UI (eller skriptad PATCH om skiva 2 bevisade att det går), riskklass R3.
Prod-mutationen sker ALDRIG utan uttalat Marcus-GO för just denna skiva, och
kolumnexporten sparas FÖRE konverteringen.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P3 · Å9 (B2), med
underlag i `data-model.md` § Kända fällor post 36 och
`supabase/functions/create-event/index.ts:55-60,98,204` samt
`update-event/index.ts:222`.

Täcker användarberättelser: 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Eventplanering.Månad/år (fld2BjFdBd964TzVb) konverterad till formel härledd ur Startdatum i staging — verifierat: skapa/ändra event över en årsgräns, Månad/år följer utan manuell inmatning
- [ ] #2 create-event/index.ts:204 och update-event/index.ts:222s skrivningar mot fältet borttagna i SAMMA PR som bas-konverteringen
- [ ] #3 create-event/index.ts:98s läsning (selectName(f['Månad/år'])) uppdaterad för formelns strängutdata (inte längre en {name}-form)
- [ ] #4 Kolumnen exporterad/sparad FÖRE konverteringen i båda baserna (destruktivt för lagrade värden, R3)
- [ ] #5 Marcus-GO för prod-mutationen inhämtat och citerat innan konverteringen utförs i prod
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
