# ADR-057: Lager-oberoende som fitness-invariant

- Status: Accepted (Session 24 — 2026-06-20; ratificerad i direktion denna session; deklarerar invarianten som Inc 3:s post-implementations-audit mäter mot)
- Datum: 2026-06-20
- Fas: Meta (gäller hela datalager-arkitekturen; kanonisk för Fas 6 + varje framtida produkt på biblioteket)

## Kontext

Datalager-oberoendet är **praktiserat men aldrig deklarerat**. Det lever i koden —
`DataSourceAdapter`-interfacet, en-rads DI-switchen (`src/data/dataSource.ts:16`,
[ADR-055](ADR-055-datakalla-atkomst-router-context-di.md)) och adaptrarnas
port-paritet — och det har **ad hoc-auditerats** (Session 23:s 6a-arkitektur-audit,
fritext i ett pausdok). Men det finns ingen styrande invariant skriven någonstans:
ingen CLAUDE.md, ingen PI, ingen spec, ingen ADR säger "UI når data ENDAST via
adaptern" som en **checkbar regel**.

Inc 3 i denna session bygger en post-implementations-arkitektur-audit. En audit utan
en namngiven, checkbar mätsticka mäter mot omdöme i stunden — den empiriskt svagaste
mekanismen (~9 %, samma svaghetsklass som ADR-043/053 kodade bort). Auditen behöver
en deklarerad invariant att mäta emot. Denna ADR levererar den.

### Grundning — architecture fitness functions

En *fitness function* (Ford, Parsons & Kua, *Building Evolutionary Architectures*)
är en objektiv, körbar mätning av hur väl en arkitektur håller en önskad egenskap
över tid. **Modulgräns- och beroende-riktnings-regler** (en modul får bara nå en
annan via dess publika kontrakt; beroenden går en väg) är de **kanoniska** exemplen
på fitness functions — exakt den klass av regel detta dokument deklarerar. Att skriva
invarianten är att göra oberoendet till en mätbar fitness-egenskap i stället för en
underförstådd kodvana.

### Empirisk drivkraft — underförstått räcker inte

Session 23:s ad hoc-audit räknade **14 metoder** i `DataSourceAdapter`; faktisk disk
hade **15** (Inc 1:s LÄS-pass). En oförankrad fritext-räkning driftade på en session.
Det är beviset att "oberoendet syns ju i koden" inte är en tillräcklig garanti — en
namngiven invariant + en audit som mäter mot den är vad som håller egenskapen sann.

## Beslut

Deklarera **lager-oberoende** som en styrande fitness-invariant med fyra checkbara
klausuler:

- **(a) Adapter-enda dataåtkomst.** UI-/presentationslagret når datakällan ENDAST via
  `DataSourceAdapter` (injicerad i router-context, ADR-055) — aldrig via direkt-import
  av en konkret adapter (`AirtableAdapter`, `SupabaseAdapter`) eller av en
  Edge-Function-klient. Enda tillåtna direkt-importören av `dataSource` är
  kompositions-roten (`src/router.ts`).
- **(b) Enkelriktat beroende.** Beroenden går en väg: UI → data. Datalagret känner
  aldrig till, importerar aldrig och kallar aldrig uppåt i UI-/presentationslagret.
- **(c) Full port-paritet.** Varje datakälla implementerar HELA
  `DataSourceAdapter`-interfacet (ingen partiell adapter) — så datakälle-bytet förblir
  en mekanisk **en-rads DI-switch** och ingen anropssida behöver känna till vilken
  backend som svarar.
- **(d) Gäller mot dubbel-källa, ej migration.** Invarianten tjänar
  DUBBEL-KÄLLA-visionen ([ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md)):
  Airtable och Supabase/Postgres **samexisterar permanent** bakom ett kontrakt — inte
  en migration där den ena ersätter den andra. Oberoendet är därför en stående
  egenskap att bevara, inte ett övergångstillstånd.

Invarianten är **checkbar**: klausul (a)/(b) via import-riktnings-grep (ingen UI-fil
importerar en konkret adapter/EF-klient; inget data-lager importerar UI), klausul (c)
via interface-vs-implementation-metodparitet. Inc 3:s audit kodifierar dessa kontroller
till ett rapport-kontrakt — **denna ADR äger invarianten, inte audit-designen**.

## Alternativ övervägda

- **A — Lämna oberoendet underförstått i kod. Förkastad.** Det är nuläget, och det
  driftade redan (14 vs 15 metoder i 6a-fritextauditen). Underförstått = omätbart =
  ingen mätsticka för Inc 3:s audit.
- **B — Koda invarianten enbart som ett CI-lint/dependency-cruiser-steg utan ADR.**
  Förkastad som *enda* åtgärd: en grind utan deklarerad princip är "dead config" så
  fort den tas bort eller kringgås (ADR-036-klassen). Principen måste bo i en ADR;
  grinden är dess verkställighet (Inc 3). (Mekanisk verkställighet är välkommen ovanpå
  denna deklaration, inte i stället för.)
- **C — Skriv invarianten i CLAUDE.md i stället för en ADR.** Förkastad: CLAUDE.md bär
  alltid-på *principen* ("bygg i oberoende lager", Inc 1) — den **checkbara invarianten**
  med klausuler + rationale + audit-koppling är ett arkitekturbeslut och hör i en ADR
  (ADR-034: en regel, ett ställe; rätt tier).

## Rationale

- **En namngiven mätsticka slår omdöme i stunden.** Inc 3:s audit får fyra checkbara
  klausuler att mäta mot i stället för en fritext-bedömning.
- **Fitness-function-mönstret är förstaparts-kanon.** Modulgräns/beroende-riktning är
  läroboksexemplet på en fitness function (Ford/Parsons/Kua) — golvet, inte uppfinning.
- **Biblioteks-arvet.** Varje framtida produkt på Mm Component Library
  (Passionslyftet, Maxat Event, kommande SaaS) ärver invarianten — oberoendet är en
  bärande egenskap hos biblioteket, inte en Miranon-detalj.

## Konsekvenser

- Inc 3:s post-implementations-audit får en namngiven, checkbar invariant som
  rapport-kontrakt — utan denna ADR mäter auditen mot omdöme.
- Varje framtida datakälla (Postgres i Fas E) måste implementera HELA interfacet innan
  den kan bli live bakom DI-switchen — partiell adapter är ett invariant-brott, inte en
  mellanstation.
- Direkt-import av en konkret adapter eller EF-klient från UI blir ett **deklarerat**
  brott (tidigare bara en odokumenterad kodlukt) — gripbart av audit + ev. framtida
  CI-grind.
- Knyter an: [ADR-055](ADR-055-datakalla-atkomst-router-context-di.md) (DI-mekaniken
  invarianten vilar på), [ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md)
  (dubbel-källa-visionen invarianten skyddar).

## Källor

- **Architecture fitness functions (modulgräns/beroende-riktning som kanonisk
  fitness function):** Ford, Parsons & Kua, *Building Evolutionary Architectures*
  (O'Reilly) — fitness-function-definitionen + dependency/module-boundary-exemplen.
- **DI-söm + opak decoupling i denna kodbas:** ADR-055 (router-context-DI), ADR-056
  (opak cursor, permanent dubbel källa).
- **Empirisk drift-grund:** Session 24 Inc 1 LÄS-pass (14-vs-15-metoder-divergensen i
  Session 23:s 6a-fritextaudit).
