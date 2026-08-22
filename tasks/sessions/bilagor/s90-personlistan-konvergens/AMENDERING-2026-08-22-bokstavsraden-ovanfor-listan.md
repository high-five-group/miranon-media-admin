# Amendering 2026-08-22 — bokstavsraden läggs ovanför listan (TASK-283.2)

**Pass:** TASK-283.2 (Skiva: Bokstavsraden under sökrutan — tracer bullet),
barn av PRD TASK-283 (bokstavsindex i personlistan).

**Berört manifest:** `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`,
yta `personlistan` (godkänd 2026-08-10, citat *"Ser bra ut, godkänner"*, sha
`4ebdcfc85a78df14c47cff058472d1b4da0d8adf`).

**Skäl för sidofilen, inte ett fält i manifestet:** ett stämplat manifest är
agent-fruset i sin helhet. `scripts/deny-facit-godkand-skrivning.sh` prövar det
simulerade RESULTATET av en Edit/Write, och varje stämplat manifest har per
definition ett satt `godkand` — alltså nekas även en ändring som inte rör
fältet ([`ADR-104`](../../../../docs/decisions/ADR-104-facit-stampeln-kanalseparation.md)
§ Beslut 2). En `amendering`-nyckel i JSON:en är därför inte en möjlig form.
Bokföringen bor i denna fil enligt
[`ADR-102`](../../../../docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
§ A3. Föregångare i samma katalog:
`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md` (TASK-286.3) och
`AMENDERING-2026-08-22-task-286-2-referenser.md`.

## Avvikelsen

**Vad som ändrades:** en `role="toolbar"` med 30 knappar (A till Z, sedan Å, Ä,
Ö, plus hinken `Utan namn`) monteras mellan sökrutan och räknarraden, i alla
tre render-grenarna (laddläge, felläge, listläge). Ett tryck filtrerar den
laddade klientarrayen; ett andra tryck släpper filtret; valet lever i
`?bokstav=`.

**Grunden:** PRD `TASK-283` och dess skiva `TASK-283.2`, byggd mot
[`ADR-123`](../../../../docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md)
beslut 3 (*"Bokstavsindexet och räknarraden blir härledningar ur samma
array"*). Marcus beslut om VÄGEN för denna ytas facit-amendering är väg A
(kortets § Implementationsbeslut, 2026-08-21, `T157`): bygget landar först,
Marcus granskar raden visuellt, och FÖRST DÄREFTER regenereras
ARIA-referenserna i en egen commit — `TASK-283.4`. Att låta bygget regenerera
dem själv är uttryckligen förkastat.

**Vad som INTE ändrades i listan:** ingenting. Bokstavsraden är ett TILLÄGG
OVANFÖR listan. Radens och listans form är byte för byte orörd — se § Vad som
inte är amenderat.

## Mätning: fönstret blev INTE bredare, tvärtemot kortets antagande

`TASK-283.2` AC #10 säger att *"promoverings-grindens sex referenser fäller så
snart raden finns, eftersom de låser den gamla formen"*. **Det är falsifierat
av mätning.** Samma kommando, samma maskin, före och efter ändringen
(`npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`):

| | passerade | fällda |
|---|---|---|
| `main` (`0900079f`), FÖRE denna skiva | 10 | 6 |
| efter denna skiva | 10 | **6** |

Och det är **samma sex fall** i båda körningarna: `listläget` samt de två
`?variant=`-degraderingsfallen, på båda vyporterna. Orsaken är oförändrad —
sentinel-radens flytt i `TASK-286.3`, redan bokförd i
`AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md`. Denna skiva
tillför **noll** nya fällningar.

**Mekanismen, för att slutsatsen inte ska läsas som tur:** Playwrights
`toMatchAriaSnapshot` matchar PARTIELLT. Extra syskonnoder i det faktiska
trädet tolereras så länge referensens egna noder står kvar i samma inbördes
ordning. Bokstavsraden är just en sådan extra nod, och den läggs mellan noder
vars ordning inte rubbas. `listläget` fäller därför fortfarande på ORDNING
(sentinel-raden), aldrig på tillägget. `sokning-traff` och `tomlage` passerar
av samma skäl.

**Att de passerar betyder INTE att de beskriver ytan.** Alla sex referenserna
saknar numera bokstavsraden helt. De är gröna men ofullständiga — ett svagare
lås än det som stämplades 2026-08-10, eftersom en framtida ändring av raden
inte kan fällas av dem. Det är den egentliga skulden `TASK-283.4` ärver, och
den är större än den enda ordningsavvikelse en röd grind visar.

## Klassning: **(c)** — formen ändras faktiskt

`ADR-102` § A2 steg 1 är mekaniskt: `godkand` är satt, alltså inte klass (a).

Steg 2:s test — **"Påverkar ändringen vad en användare ser i prod?"** — besvaras
**JA**, utan gränsdragning: 30 nya kontroller monteras permanent på ytan och
syns för Lotta vid varje besök på `/personer`. `ADR-102` § A4 namnger dessutom
klassen exakt: detta är en **utvidgning av formen**, och B1 (*"vid motsägelse
vinner prototypen"*) gäller INOM den låsta formen, aldrig mot en avsiktlig
utvidgning av den.

Att mätningen ovan visar noll NYA röda referenser ändrar inte klassningen.
Klass (b) kräver att skillnaden mot prod är en ARTEFAKT (fixtur, rendering,
miljö) och att det kan sägas med en mätning. Här är skillnaden tvärtom exakt
det avsiktliga, prod-synliga tillägget — och att grindens partiella matchning
råkar tolerera det är en egenskap hos MATCHAREN, inte ett bevis för att formen
står still. Osäkerhet eskalerar dessutom uppåt, aldrig nedåt (§ A2).

## Vad som INTE är amenderat

Manifestets `not`-fält räknar upp de låsta formbesluten. Samtliga är orörda,
och det är mätt i samma körning som ovan (de tio gröna fallen täcker sökläget,
tomläget och axe-golvet på båda vyporterna):

- tonal kortyta med `divide-y`-avdelare — orörd
- låst radhöjd — orörd
- status (`Aktiv anmälan`) som egen kolumn med reserverad plats — orörd
- e-post ensam på kontaktraden — orörd
- interaktionsraden avskild med 4 px, utan ikon — orörd

Ingen nod inuti `list "Personer"` har lagts till, tagits bort eller döpts om.
Sid-inseten (`pt-2 lg:pt-10`, `gap-6`) och h1-formen i
`src/routes/_authenticated/personer/index.tsx` är likaså orörda; den filen
ingår inte i diffen.

**Tomlägets copy är däremot utvidgad, och det hör till formen.** Ett valt
bokstavsfilter utan träffar gav med den gamla grenen beskedet *"Personer dyker
upp här när någon anmäler sig eller lämnar sin e-post"*, vilket är osant när
Lotta just tryckt på Ö. Rena sökfallets ordalydelse (`Ingen person matchar
"X".`, TASK-277:s låsta copy) är ORÖRD; tillskotten är `Ingen person börjar på
X.`, `Ingen person saknar namn.` och `Ingen person <på X | utan namn> matchar
"Y".`.

`slutlage-tonal-{desktop,mobil}.png` och pixel-baselinen `personer.png` är
orörda och därmed en generation bakom vad gäller bokstavsraden. Baselines föds
i CI, aldrig lokalt (`CONTRIBUTING.md` § Visuell regression).

**Referens + hash:** ytan `personlistan` deklarerar INGEN `referenser`-array i
`facit.json`, så `check-facit.sh` invariant (d) hash-jämför ingenting här
(mätt 2026-08-22 på denna gren: `bash scripts/check-facit.sh` → exit 0). Ingen
hash-rad är alltså tillämplig. Det betyder också att den mekaniska bevakningen
av just denna ytas referenser saknas — `ADR-102` § A5 punkt 2 kräver att
`referenser` deklareras MEDAN manifestet är ogodkänt, vilket gör `TASK-283.4`
till det naturliga tillfället.

## Omstämplings-läge

**VÄNTAR MARCUS OMSTÄMPLING.** `godkand` rörs aldrig av en agent
(`ADR-104` § Beslut 2), och för klass (c) avgörs omstämplingen i Marcus egen
kanal — `ADR-102` § A2: *"En agent avgör detta ALDRIG själv."*

Agenten har därför:

- **INTE** rört `facit.json`.
- **INTE** rört någon av de sex `.aria.yml`-referenserna.
- Bockat kortets AC #1 till #11 (de mäter bygget), och lämnat DoD #1/#3
  åt orkestreraren respektive CI.

**Vad Marcus beslut gäller:** ska bokstavsraden stå kvar i den form som landat
(30 knappar med `aria-pressed`, radbrytande, ovanför listan), och ska de sex
referenserna därmed fångas om med stämpeln förnyad? Bekräftas det regenererar
`TASK-283.4` referenserna i egen commit och sätter om `godkand` via Marcus
kanal.
