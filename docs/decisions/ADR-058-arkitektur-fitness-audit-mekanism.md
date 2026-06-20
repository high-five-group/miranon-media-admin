# ADR-058: Arkitektur-fitness-audit — mekanism, rapport-kontrakt, governance-placering

- Status: Accepted (Session 24 — 2026-06-20; ratificerad i direktion denna session; Inc 3a — fastställer Code-side `arch-audit`-skillen, Chat-yt-paret `/audit` deferras till Inc 3b)
- Datum: 2026-06-20
- Fas: Meta (gäller hela arkitektur-fitnessen; rekommenderad vid fas-gränser för Fas 6 + varje framtida produkt på biblioteket)

## Kontext

Post-implementations-arkitektur-auditen kördes första gången **ad hoc** i Session 23
(6a-certifieringen, fritext i ett pausdok). Den **driftade**: fritext-räkningen sa
"14 metoder" där disken hade 15 ([ADR-057](ADR-057-lager-oberoende-fitness-invariant.md)
Kontext). En audit utan fast kontrakt mäter mot omdöme i stunden — den empiriskt
svagaste mekanismen (~9 %, samma svaghetsklass som ADR-043/053 kodade bort för
lifecycle). [ADR-057](ADR-057-lager-oberoende-fitness-invariant.md) levererade en
**checkbar invariant**; denna ADR levererar **mekanismen som mäter mot den** — plus
mot de övriga fitness-egenskaperna — i en kontrakterad, repeterbar form.

### Grundning — architecture fitness functions

En *fitness function* (Ford, Parsons & Kua, *Building Evolutionary Architectures*,
O'Reilly) är en **objektiv integritets-bedömning** av en önskad arkitektur-egenskap.
Modul-/lager-beroenderegler är de **kanoniska** exemplen. Avgörande nyans: fitness
functions **får vara manuella** — arkitekten formulerar dem explicit även när de inte
kan automatiseras. Därför är auditen en **skill med omdöme**, inte ett rent skript:
de mekaniska egenskaperna (riktning, paritet, ribba-närvaro) skriptas; bedömnings-
egenskaperna (är golvet hållet? finns spekulation?) körs som do-confirm med motivering.

### Governance-placering

Auditen fyller nischen mellan två befintliga kadenser:

- **[ADR-039](ADR-039-konsistens-grindar-kadens.md)** — per-push **mekanisk** CI-grind
  (deterministiska dok-/räknings-checks).
- **[ADR-041](ADR-041-session-end-do-confirm-roll.md)** — **session-end** do-confirm
  (Lager 3, sessions-stängning).

Arkitektur-fitness är **motparten på arkitektur-axeln**: kommando-anropad,
**REKOMMENDERAD vid fas-gränser** (innan en fas deklareras förstklassigt klar), **inte**
en tvingad per-push-grind. Post-implementation ≠ sessions-stängning; därför egen skill,
inte en gren i session-end.

## Beslut

### 1. Fem fitness-områden

Auditen verifierar fem områden mot sina deklarerade mätstickor:

| # | Område | Mätsticka | Typ |
|---|--------|-----------|-----|
| i | **Lager-oberoende** | ADR-057-invariantens fyra klausuler (adapter-enda åtkomst, enkelriktat UI→data, port-paritet, dubbel-källa) | mekanisk |
| ii | **Swappbarhet** | Dubbel-källa-visionen (ADR-056): en-rads DI-switch + full port-paritet | mekanisk |
| iii | **EF-ribba** | SECURITY-SPEC §6.10 EF1–EF6, per Edge Function | mekanisk |
| iv | **Dubbelriktad över-engineering-vakt** | Golvet hållet (branschstandard/säkerhet/a11y ej skuret) + ingen spekulation över golvet | omdöme |
| v | **Ärliga betyg** | Kanonisk axel (Tillgänglighet/Teknik/Återanvändbarhet) mot KVALITETSDEFINITIONER 10/10-vs-11/10 | omdöme |

### 2. Fast rapport-kontrakt

Rapporten lånar **code-role-discipline §2:s block-format**: per område → fynd (faktiskt
värde) → `AVVIKELSE:`-flagga vid divergens → betyg. Mekaniska områden (i–iii) körs
deterministiskt via ett buntat fitness-skript; omdömes-områden (iv–v) körs som
do-confirm med skriven motivering. Kontraktet är fast — auditen kan inte "glömma" ett
område, och två körningar mot samma disk ger samma mekaniska utfall (driftar inte som
fritexten gjorde).

### 3. Skill-par-arkitektur (ADR-034 p.9)

Denna ADR fastställer **Code-side `arch-audit`-SKILL** (verifieraren — kör mot disk,
producerar den kontrakterade rapporten). **Chat-yt-skill `/audit` + handoff-kontrakt**
är nästa inkrement (3b). Auditen är en renodlad **verifierare + betygsättare** — den
fixar eller ändrar aldrig kod; åtgärd ägs av Chat (design) + Marcus (beslut).

### 4. Pluginet går 4 → 5 skills

Auditen har ett **kommando-ögonblick** ("kör kontrollaudit") → kvalificerar som skill
per [ADR-034](ADR-034-skill-arkitektur.md) p.8 (mekanism mot beteende-klass). Detta är
inte den spekulativa addition som 4-antal-disciplinen (ADR-034 p.8 + K8) vaktade mot —
de två borttagna var meta-discipliner *utan* kommando-ögonblick; denna har ett.

## Alternativ övervägda

- **A — Rent skript (ingen skill, ingen omdömes-del). Förkastad:** områdena iv–v
  (golv-hållning, spekulations-detektion) går inte att skripta — de kräver arkitekt-
  omdöme. Fitness functions får vara manuella; att tvinga in allt i ett skript skulle
  antingen tappa iv–v eller producera falska gröna.
- **B — Vik in auditen i `session-end`. Förkastad:** annat kommando-ögonblick. Post-
  implementations-fitness ≠ sessions-stängning; session-ends do-confirm är Lager 3-kadens
  (ADR-041), inte arkitektur-fitness. Att slå ihop dem skulle koppla fas-arkitektur-
  granskning till varje sessions-slut (fel kadens, brus).
- **C — Lägg fitness-checken som per-push CI-grind (ADR-039-klassen). Förkastad som
  *enda* form:** de mekaniska delarna (i–iii) *kan* CI-grindas senare (välkommet), men
  omdömes-delarna (iv–v) kan inte — och en audit som bara kör de mekaniska delarna ger
  falsk trygghet. Kommando-anropad skill med omdöme först; mekanisk CI-grind är en
  möjlig additiv förstärkning (jfr T13:s öppna fråga).

## Rationale

- **Fast kontrakt slår fritext.** Session 23:s drift (14 vs 15) var beviset; ett fast
  fem-områdes-kontrakt med deterministiska mekaniska checkar gör samma drift omöjlig.
- **Omdöme + mekanik i rätt proportion.** Förstaparts-mönstret (Ford/Parsons/Kua) säger
  uttryckligen att fitness functions får vara manuella — skillen kodifierar exakt den
  blandningen i stället för att överautomatisera.
- **Rätt kadens, rätt tier.** Kommando-anropad vid fas-gränser fyller glappet mellan
  ADR-039 (per-push) och ADR-041 (sessions-slut) utan att belasta någondera.

## Konsekvenser

- Auditen får ett fast rapport-kontrakt och driftar inte längre.
- `arch-audit` är pluginets **första nya skill sedan Session 6.7** (4 → 5); plugin-
  versionen bumpas (plugin.json + marketplace.json atomiskt).
- Varje framtida produkt på Mm Component Library ärver auditen — fitness blir en
  stående, repeterbar egenskap, inte en engångskontroll.
- **Inc 3b** (Chat-yt-skill `/audit` + handoff-kontrakt) och **Inc 4** (validerings-
  körning mot Fas 6a) bygger ovanpå denna ADR — denna ADR äger mekanismen, inte
  Chat-ytan och inte själva 6a-körningen.
- Knyter an: [ADR-057](ADR-057-lager-oberoende-fitness-invariant.md) (invarianten i
  mäter mot), [ADR-056](ADR-056-list-paginerings-port-cursor-dubbel-kalla.md) (dubbel-
  källa), [ADR-034](ADR-034-skill-arkitektur.md) (skill-klassning + leveransyte-modell),
  [ADR-041](ADR-041-session-end-do-confirm-roll.md) (do-confirm-formen rapporten lånar),
  [ADR-039](ADR-039-konsistens-grindar-kadens.md) (mekanisk-grind-kadensen den kompletterar).

## Källor

- **Architecture fitness functions (definition; manuella fitness functions tillåtna;
  modul-/lager-beroende som kanoniskt exempel):** Ford, Parsons & Kua, *Building
  Evolutionary Architectures* (O'Reilly).
- **Mätstickorna i denna kodbas:** ADR-057 (lager-invariant), SECURITY-SPEC §6.10
  (EF-ribba), KVALITETSDEFINITIONER-11-REACT.md (kanoniska axlar).
- **Skill-klassning + renodlad-verifierare-formen:** ADR-034 (p.8 + p.9), ADR-041
  (session-end do-confirm), code-role-discipline §2 (rapport-blockformatet).
