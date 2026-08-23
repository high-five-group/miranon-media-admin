# Amendering 2026-08-23 — husets delade SidRam-primitiv ersätter det inline byggda sidkromet (TASK-299.11)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSET: `ADR-104`-hooken
> (`scripts/deny-facit-godkand-skrivning.sh`) nekar varje agent-`Edit`/`Write`
> mot ett manifest vars `godkand` är satt — oavsett om skrivningen rör fältet
> självt. Bokföringen bor därför i en sidofil bredvid manifestet, formen
> kanoniserad i `ADR-102` § Updates 2026-08-22 § A3. `godkand`-fältet i
> `facit.json` är INTE rört av denna commit.

**Yta:** Aktivitetshistorik-sidan (`facit.json`s enda `ytor`-post, godkänd
2026-08-15, citat "Godkänd mot facit 2026-08-15", `sha
871ae4f47a06ed048a3ba8c80ec660152f340054`; källor
`src/components/aktivitetshistorik/AktivitetsHistorik.tsx` m.fl.).

**Avvikelse:** Sidkromet — som facit-noten beskriver som "44 px rund
chevron-Link (`size-11 rounded-full bg-bg-muted`, `ChevronLeft 26`,
`aria-label 'Tillbaka till Mer'`) + h1 'Aktivitetshistorik' font-semibold
text-3xl" byggt INLINE i `AktivitetsHistorik.tsx` — är ersatt av husets
delade `SidRam`-primitiv (`src/components/primitives/SidRam.tsx`, TASK-299.1,
PRD `TASK-299` beslut 3+5). `SidRam` renderar SAMMA chevron-geometri
(`size-11 rounded-full bg-bg-muted`, `ChevronLeft` 26 px, `aria-label
"Tillbaka till Mer"`) — ingen visuell chevron-skillnad. Rubriken lever kvar
som egen `<h1>` i sidans eget `<header>` (PRD `TASK-299` § OMFATTNINGEN LÅST
punkt 2 — bara sidkromet, SidRams rubrik-ägande gren används INTE här).

Den GENUINA formskillnaden: sidramens `mx-4`-indragna chevron gav tidigare
ett 16 px missalignment mot resten av innehållet (filterraden och
dagsgruppernas lista satt kvar på `<main>`s egen marginal, medan rubriken
fick ett eget `px-4`-tillägg — mätt av `TASK-299.2`-agenten 2026-08-23 med
`boundingBox()`: chevron/h1 vid x=372, filterrad/dagsgrupp-lista vid x=356 i
en 1280 px-vy). Denna skiva ger HELA innehållskolumnen (filterraden,
dagsgruppernas kort, tomlägena, "Ladda fler"-knappen) samma `px-4`-marginal
som rubriken — mätt efter fixen: samtliga block vid x=372, ingen
missalignment kvar (samma acceptanskriterium väntelistans redan promoverade
form uppfyller, `TASK-299.7`).

Radanatomin, dagsgrupperingen, filterradens tre kontroller, statusraden och
"Ladda fler"-mekaniken är I ÖVRIGT OFÖRÄNDRADE mot det godkända
facit-manifestet — avvikelsen är avgränsad till sidkromets IMPLEMENTATION
(delad primitiv i stället för inline-kopia) och till innehållskolumnens
vänstermarginal (nu konsekvent `px-4` genomgående, i stället för att bara
rubriken bar den).

**Marcus-grunden** (`TASK-299.2` Implementation Notes, 2026-08-22, citerad i
`TASK-299` § OMFATTNINGEN LÅST): ytaxeln — *"jag tycker vi ska köra full
omfattning"* — den delade sidramen bärs av alla ytor, inklusive de två som
bar den andra dialekten (denna yta en av dem). Ägandeskapsaxeln — *"Jag står
vid dina rekommendationer på alla punkter"*, svar på frågan "Bara sidkromet
eller rubrik-blocket också?" — bara sidkromet, rubriken lever kvar i sidan.
Samma beslut bär även PRD `TASK-299` beslut 3: sidramen blir kant-i-kant,
"Valet avgör husets två levande dialekter till förmån för den fyra av sex
skarpa ytor redan bär."

## Klassning: **(c)** — formen ändras faktiskt, prod-synligt

`ADR-102` § A2 steg 2: **påverkar ändringen vad en användare ser i prod?**

**Ja.** Innehållskolumnens vänstermarginal flyttar 16 px åt höger för
filterraden, dagsgruppernas kort, tomlägestexterna och "Ladda fler"-knappen
— en mätbar, renderad skillnad (dokumenterad ovan med `boundingBox()`-tal
före/efter). Detta är inte en artefakt av testfixturen eller miljön (`ADR-102`
§ A2 skärpning 1) — det är en avsiktlig layoutändring som en riktig Lotta ser
i prod. Osäkerhetsregeln ("osäkert ⇒ klass (c)") gör klassningen entydig även
om skillnaden hade varit mindre tydlig.

## Vad som INTE är amenderat

- Facit-bilderna (`facit-aktivitetshistorik-desktop.png`/`-mobil.png`) visar
  fortfarande den GAMLA chevron-positionen (flush mot `<main>`s egen `px-4`,
  utan sidramens extra `mx-4`-indrag) och den gamla, ojämna
  vänstermarginalen. De blir därmed EN GENERATION BAKOM den promoverade
  formen för just chevron-position och kolumn-marginal — resten av det
  visuella innehållet (radgrammatik, dagsgruppering, filterkontroller) är
  oförändrat och bilderna förblir korrekta referenser för DET.
- Det mekaniska facit (manifestets `not`-fält, ariaSnapshot-avsikten) är
  inte omskrivet — `not`-fältets prosa beskriver fortfarande sidkromets
  BETEENDE och struktur (44 px chevron, tillgängligt namn, rubrikens
  programfokus) korrekt; bara den exakta pixel-positionen har flyttat.
- Manifestet deklarerar ingen `referenser`-nyckel (mekaniskt facit-lås) —
  denna amendering påverkar därför inget hash-låst innehåll
  (`scripts/check-facit.sh` invariant (d) berörs inte).

## Omstämplings-läge

**Väntar på Marcus omstämpling** (`ADR-104` beslut 1–2, `!`-kanalen,
`--ersatt`-formen). `godkand`-fältet i `facit.json` rörs INTE av denna
agent-commit.
