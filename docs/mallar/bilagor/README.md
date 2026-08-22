# Bilage-mallarna — bekräftelsebilagan och deltagarinformationen (TASK-279)

HTML/CSS-mallar för de två bilagorna `ADR-119` beslut 2 lade grunden för
(HTML/CSS-driven rendering, extern motor senare). Denna skiva bygger
**mallarna och en granskningsväg** — ingen renderare, ingen EF, inget
Storage (se kortets § "Vad som INTE görs här").

## Filer

| Fil | Vad |
|---|---|
| `bekraftelsebilaga.html` | Mall — kursbeskrivning/betalningsvillkor (fyra sidor prisinfo + tvåkolumns innehållslista) |
| `deltagarinformation.html` | Mall — praktisk info inför kursstart (tre infobox-rader + nio ämnesstycken) |
| `bilaga-delad.css` | Delad CSS: typsnitt (`@font-face`), färgtokens, layout. ETT ställe att ändra rubrikfont/färger på för båda mallarna. |
| `fixtures/*.exempel.json` | Exempeldata — samma värden som i de riktiga förlagorna, så en granskning kan jämföras rad för rad. |
| `lokala-typsnitt/` | **Gitignorerad symlänk**, se § Granska mallarna lokalt nedan. |
| `*.granskning.html` / `*.granskning.png` | **Gitignorerat**, genereras av granskningsskriptet — checkas aldrig in. |

## Den dynamiska ytan (ADR-119 beslut 3)

Mallarna är parametriserade EXAKT på den yta beslutet anger — inget annat.
Allt annat i mallarna (brödtext, innehållslistorna, sidfotens QR-URL:er) är
FAST FORM per kurstyp och hårdkodat i markupen.

| Mall | Dynamiska fält (`{{fältnamn}}`) |
|---|---|
| Bekräftelsebilagan | `kursnamn`, `datumTid`, `plats`, `pris`, `anmalningsavgift`, `resterandeBelopp`, `sistaBetalningsdatum` |
| Deltagarinformationen | `kursnamn`, `datumTid`, `plats` (endast TRE rader) |

**Ingen persondata förekommer i någon mall** (AC #2) — mottagarens namn hör
till mailkroppen, aldrig till bilagan. Swish/Plusgiro-numren i
bekräftelsebilagan är Roger & Lottas ORGANISATIONS-uppgifter (statiska,
oavsett event) — inte en del av den dynamiska ytan, därför hårdkodade.

`{{fältnamn}}` är INTE en mallmotor-syntax knuten till något specifikt
bibliotek — det är en ren strängersättning (se `scripts/render-bilage-mall.mjs`),
medvetet minimal eftersom denna skiva inte bygger renderings-integrationen.
Den framtida skivan som kopplar mallen till en riktig renderare väljer sin
egen mallmotor (eller behåller den enkla ersättningen) — inget här låser det
valet.

## Granska mallarna med riktig data (AC #3)

Ingen extern tjänst behövs. Kör:

```bash
npm run mall:granska -- bekraftelsebilaga
npm run mall:granska -- deltagarinformation
open docs/mallar/bilagor/bekraftelsebilaga.granskning.html
open docs/mallar/bilagor/deltagarinformation.granskning.html
```

Skriptet fyller mallen med `fixtures/<mall>.exempel.json` och skriver en
fristående HTML-fil i SAMMA katalog som mallen (så alla relativa sökvägar
till CSS/bilder/typsnitt gäller oförändrat). Öppna filen direkt i
webbläsaren — ingen server krävs. Egen data: `npm run mall:granska --
bekraftelsebilaga --data /sökväg/till/egen-fixture.json`.

Output är gitignorerat (`docs/mallar/bilagor/*.granskning.html` +
`*.png`) — genererat innehåll, checkas aldrig in, samma princip som `dist/`.

## Granska mallarna lokalt — Cavolini-typsnittet

Cavolini-filen får **ALDRIG committas** (se § Fontstrategin nedan). För att
se rubriken i den ÄKTA fonten lokalt (i stället för Comic Neue-fallbacken):

```bash
ln -s ~/.miranon-fonts docs/mallar/bilagor/lokala-typsnitt
```

Symlänken är git-ignorerad (`.gitignore`, samma mönster som `node_modules`
i en worktree — symlänka, kopiera aldrig). Saknas symlänken (eller filerna
den pekar på) laddar `@font-face`-regeln för Cavolini aldrig — CSS-stacken
faller AUTOMATISKT till Comic Neue Bold. Detta är AVSIKTLIGT och verifierat
(se § Skarpbevis nedan): mallen ska se avsiktlig ut i fallback-läget, inte
trasig.

## Fontstrategin — väg B (låst, se kortets Implementation Notes)

Rubrikfonten är en CSS-variabel med två lägen, deklarerad i
`bilaga-delad.css`:

```css
--mm-bilaga-rubrik-font: 'Cavolini', 'Comic Neue', cursive;
```

- **Cavolini-Bold** primärt — hämtas via en git-ignorerad lokal symlänk
  (§ ovan), ALDRIG committad.
- **Comic Neue Bold** som fallback — ligger i repot
  (`public/fonts/bilagor/ComicNeue-Bold.ttf`), SIL OFL-licens.

**Licensen är mätt, oberoende verifierad i denna skiva** (inte bara
återgiven ur kortets notes): `fsType`-fältet i `OS/2`-tabellen lästes
direkt ur binärfilen (Python, `struct`-parsning av TTF-header, ingen
extern lib) för alla fyra vikterna i `~/.miranon-fonts/`:

```text
Cavolini-Bold.ttf:        fsType = 0x0008 (Editable Embedding)
Cavolini.ttf:              fsType = 0x0008
Cavolini-Italic.ttf:       fsType = 0x0008
Cavolini-Bold-Italic.ttf:  fsType = 0x0008
```

`0x0008` = Editable Embedding — dokumentinbäddning uttryckligen tillåten,
subsetting och konturinbäddning tillåtet. Filen får ändå ALDRIG distribueras
som fil (det är en annan rättighet) — därför symlänken, aldrig ett commit.
Detta BEKRÄFTAR kortets Implementation Notes-mätning oberoende (samma
resultat, annan metod) och löser samtidigt en skenbar motsägelse mot
`public/fonts/bilagor/LÄSMIG.md` (som beskriver en TIDIGARE, subsettad
källa där `fsType` "aldrig kunde mätas") — de två dokumenten beskriver två
olika källor i tid, inte en verklig konflikt. Se AC #5-avsnittet i kortets
Implementation Notes för hela resonemanget.

## QR-koderna — genererade, aldrig kopierade

Båda QR-koderna i bekräftelsebilagans sidfot är genererade DIREKT ur
URL-strängarna, inbäddade som statisk `<svg>`-markup i mallen — inte
kopierade som bild. Bibliotek: **`qrcode`** (npm, soldair/node-qrcode,
MIT-licens, ~30 miljoner nedladdningar/vecka) — etablerat förstahandsval
för QR-generering i Node; valt framför att skriva en egen QR-encoder
(omfångsrikt algoritmiskt problem — Reed–Solomon-felkorrigering,
version/mask-val — som redan är löst branschstandard-korrekt).

Genererade EN gång (build-time, inte per granskning) med:

```js
import QRCode from 'qrcode';
await QRCode.toString('https://www.instagram.com/se.miranon/', { type: 'svg', errorCorrectionLevel: 'M', margin: 0, color: { dark: '#000000', light: '#00000000' } });
await QRCode.toString('https://miranon.se/', { type: 'svg', errorCorrectionLevel: 'M', margin: 0, color: { dark: '#000000', light: '#00000000' } });
```

`qrcode` är INTE en projekt-dependency (inget i `src/` importerar den) —
den kördes en gång i en isolerad scratch-installation, utanför det delade
`node_modules`, för att inte mutera repots dependency-träd för ett
engångs-kodgenereringssteg. Ändras URL:erna: kör om kommandot ovan och
ersätt `<svg>`-blocket i mallen (sök `ikonruta-qr` i
`bekraftelsebilaga.html`).

**Avsiktlig avvikelse mot förlagan:** förlagans QR-koder bär en logotyp
centrerat INUTI själva QR-mönstret (en "branded QR"-design). Mallen här
placerar ikonen som en separat badge i övre vänstra hörnet av QR-rutan i
stället för ett centrerat överlägg. Skäl: ett korrekt centrerat överlägg
kräver att man räknar ut vilka moduler som täcks vid vald
felkorrigeringsnivå för att koden ska förbli skanningsbar — en risk jag
inte vill introducera i en mall utan ett skarpt skanningstest, vilket är
utanför denna skivas scope (ingen extern tjänst, inget skarpt utskick).
Dokumenterad, inte tyst.

## Visuell jämförelse mot förlagorna (AC #4)

Granskad skärm-mot-skärm (Playwright-screenshot av den renderade mallen
mot `~/Downloads/exempelpdokument/*.pdf`, lästa sida för sida).

### Bekräftelsebilagan — matchar

- Struktur, ordning och samtliga sektioner: logga → rubrik → infobox →
  hälsning → tre brödtextstycken → tvåkolumns innehållslista → tre
  sidfotsrutor.
- Färger: `#2F5597` (yttre ram), `#548235` (meditationsnamn),
  `#4472C4` (tidsangivelser), `#0563C1` (hyperlänk) — samtliga disk-mätta i
  `docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md` § 2.2,
  applicerade exakt.
- Loggan: `public/miranon-media-ordmarke-original.svg` — samma vågform,
  samma originalfärger som förlagan (se forskningsdokumentets RÄTTELSE-block).
- Bokomslaget, Instagram- och globe-ikonerna: rätt bild på rätt plats.
  Globen är sedan F6 (S108 resume 5) en egen, handbyggd konturglob
  (`public/globe-outlined.svg`) i stället för den tidigare
  `globe-material.svg`.

  **Rättad premiss (ADR-086-fynd, mätt vid orkestrerar-granskning av
  PR #1778):** den ursprungliga F6-leveransen påstod att `globe-material.svg`
  var "Material Symbols FYLLD variant" — det var FALSKT, aldrig
  pixel-verifierat. `globe-material.svg` var redan en konturglob med
  jämntjock linjebredd (ring = meridian). Det första ersättningsförsöket
  (Material Symbols "language" Outlined wght700) gjorde matchningen SÄMRE:
  ringen blev 60 % tjockare än meridianerna (2,758 mm mot 1,726 mm) — en
  obalans förlagan inte har (där ring och meridian mäter samma, ~1,22 mm).

  **Mätmetod (pixelanalys, inte tyckande):** förlagans glob i
  `bekräftelsebilaga-exempel.pdf` beskuren vid 1200 dpi, isolerad via
  connected-component-analys (Python/PIL/scipy, ingen extern SVG-lib),
  linjebredd uppmätt via horisontella/vertikala tvärsnitt PLUS radiell
  sampling (för att undvika falsk sammanslagning där ekvator/meridian
  möter ringen). Samma metod applicerad på varje kandidat, renderad vid
  ikonens faktiska 21,05 mm.

  | Mått | Förlaga | `globe-material.svg` (f.d. F6-fil) | Material "language" wght700 (f.d. F6-ersättning) | `globe-outlined.svg` (nuvarande) |
  |---|---|---|---|---|
  | Ring, streckbredd | 1,228 mm | 1,752 mm | 2,758 mm | 1,223 mm |
  | Meridian/breddgrad, streckbredd | 1,213 mm (snitt) | 1,752 mm | 1,737 mm | 1,226 mm (snitt) |
  | Kvot ring/meridian | 1,01 (jämntjockt) | 1,00 (jämntjockt) | 1,59 (ring mkt tjockare) | 1,00 (jämntjockt) |
  | Glob-diameter / ikonrutans fyllnad | ~100 % (21,07/21,05 mm) | 83,3 % | 90,4 % | 99,2 % |
  | Meridianer (vertikala linjer) | 3 (1 rak + 2 kurvade) | 2 (kurvade, ingen rak centrumlinje) | 2 (kurvade, ingen rak centrumlinje) | 3 (1 rak + 2 kurvade) |
  | Breddgrader (horisontella linjer) | 3 (1 rak ekvator + 2 kurvade) | 2 (kurvade, ingen rak ekvator) | 2 (kurvade, ingen rak ekvator) | 3 (1 rak + 2 kurvade) |

  Testade men förkastade (samma 2-linjers-per-axel-struktur som
  `globe-material.svg`, ingen närmare förlagans 3×3-grid eller
  jämntjocka linjer): Material Symbols "language" wght 400/500/600,
  Lucide `globe` (tunnaste, ISC), Tabler `world` (MIT, `stroke-width`-
  baserad — jämntjock men fortfarande bara 2×2 linjer), Phosphor
  `globe-simple` (Apache 2.0). Ingen extern källa återger förlagans TÄTA
  grid; `globe-outlined.svg` är därför en egen, handbyggd SVG (cirkel +
  3 meridianer + 3 breddgrader, se filens eget kommentarsblock för fullt
  mått-facit) — inget licenskrav, ingen extern källa.
- Fetningarna i brödtexten: exakt de sju fraserna kortets Implementation
  Notes anger, ordagrant.

### Bekräftelsebilagan — avviker, med skäl

- **`SegoeUI-Bold` → Selawik Bold (F7, S108 resume 5).** Förlagan bär
  `SegoeUI-Bold` på EXAKT de två listrubrikerna "Innehåll, Dag Ett" /
  "Innehåll, Dag Två" (9 pt), allt annat i Calibri/Carlito. Segoe UI är
  Microsoft-proprietär och får inte bäddas in — samma regel som stoppade
  Cavolini. Selawik är Microsofts EGEN öppna ersättare för Segoe UI (SIL
  OFL 1.1, `github.com/microsoft/Selawik` release 1.01), tillämpad ENDAST
  på de två rubrikerna via klassen `.listrubrik-selawik`. Tidigare stod
  här att mallen använde Carlito Bold genomgående i stället — det var det
  förra läget (innan F7), inaktuellt nu. Se
  `public/fonts/bilagor/LÄSMIG.md` § Selawik Bold för fsType-mätningen.
- **QR-koden bär ingen centrerad logotyp**, se § QR-koderna ovan för skälet.
- **Box-mått (rundning, marginaler, radhöjd) är eyeballade mot den
  renderade bilden, inte pt-uppmätta.** Forskningsunderlaget
  (`dokumentmallarnas-forlagor-2026-08-17.md` § 4.3) bokför uttryckligen
  att den mätningen ALDRIG gjordes ("Öppen, nästa steg vid bygge") — den
  är alltså inte en lucka den här skivan introducerar, utan en känd,
  redan bokförd öppning som kvarstår öppen.
- **Innehållslistans exakta färg-/kursiv-gränser per ord** är en tolkning,
  inte ett andra oberoende mått. Kortets Implementation Notes ger
  AGGREGATET ("meditationsnamn grönt, tider blått") men inte var VARJE
  gräns går ord för ord. Regeln jag tillämpade, konsekvent: en rad som
  börjar med det bokstavliga ordet "Meditation" OCH slutar med en
  varaktighets-token (`\d+\s*min`) får namnet grönt/kursivt/fett och
  varaktigheten blått; alla andra rader (inklusive "Tankeövning 5 min",
  som inte börjar med "Meditation") får varaktigheten blått men namnet
  odekorerat. En vision-baserad OCR-läsning av samma sida gav en delvis
  annan (mindre konsekvent) uppdelning — jag valde att lita på det
  MÄTTA aggregatet framför OCR-gissningen, se motivering i kortets
  Implementation Notes-avsnitt.
- **Sidfotens vänster/höger-etiketter i kortets Implementation Notes
  stämmer INTE med den faktiska förlagan.** Notes säger "nedre vänstra
  hörnet → miranon.se, nedre högra hörnet → instagram"; den faktiska
  PDF:en (läst direkt, `~/Downloads/exempelpdokument/
  bekräftelsebilaga-exempel.pdf`) visar Instagram-rutan LÄNGST TILL
  VÄNSTER och globe/miranon.se-rutan LÄNGST TILL HÖGER — motsatt av vad
  notes beskriver. Mallen matchar den FAKTISKA bilden (Instagram vänster,
  globe höger), eftersom URL-till-ikon-parningen (vilken QR hör till
  vilken ikon och bildtext) är entydig oavsett hörn-beskrivning, och
  bilden är den högre källan för layout. Ingen ändring krävs av notes —
  bokfört här som en mätt, dokumenterad avvikelse (ADR-086).

### Deltagarinformationen — matchar

- Struktur: logga → rubrik → tre-rads infobox → kursiv ingress → nio
  ämnesstycken (fet etikett + löptext i samma stycke, ordagrant ur
  förlagan) → avslutning.
- Ingen yttre ram — förlagan saknar den, mallen har den inte heller
  (till skillnad från bekräftelsebilagan).
- Gul överstrykning på "Parfym och kosmetika"-stycket:
  `background-color: #FFFF00` på hela stycket, matchar förlagans
  blockformade gulmarkering.
- Hyperlänkarna (`lotta@outsidereality.se`, tre förekomster) i
  `#0563C1`, understrukna.

### Deltagarinformationen — avviker, med skäl

- Samma box-mått-eyeballing som ovan (ingen pt-mätning fanns att utgå
  från).
- Ingen känd innehållsavvikelse i övrigt — denna mall är strukturellt
  enklare (ingen tvåkolumnslista, inga sidfotsikoner) och matchningen
  är därför närmare fullständig än bekräftelsebilagans.

## Vad denna skiva INTE gör

Ingen DocRaptor-integration, ingen Edge Function, inget Storage, ingen
invalidering, ingen bilage-lane. `{{fältnamn}}`-ersättningen här är ENDAST
för lokal granskning — den riktiga ihopkopplingen mot en renderare är en
framtida, egen skiva.
