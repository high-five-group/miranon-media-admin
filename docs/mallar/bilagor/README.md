# Bilage-mallarna - bekräftelsebilagan, deltagarinformationen och kvittot (TASK-279 + S108)

HTML/CSS-mallar för de tre dokumenten `ADR-119` beslut 2 lade grunden för
(HTML/CSS-driven rendering, extern motor senare). Bekräftelsebilagan och
deltagarinformationen byggdes i TASK-279 (**mallarna och en granskningsväg**,
utan renderare, EF eller Storage, se kortets § "Vad som INTE görs här").
Kvittot är ett SEPARAT, kortlöst S108-prototyp-uppdrag (MARCUS-SEKVENS
punkt 2, S108 Del 8 § D); se § Kvittots FORM nedan för dess egen scope,
källor och mätunderlag.

## Filer

| Fil | Vad |
|---|---|
| `bekraftelsebilaga.html` | Mall - kursbeskrivning/betalningsvillkor (fyra sidor prisinfo + tvåkolumns innehållslista) |
| `deltagarinformation.html` | Mall - praktisk info inför kursstart (tre infobox-rader + nio ämnesstycken) |
| `kvitto.html` | Mall - kvitto på Rogers sektionsstruktur (referensblock, radtabell, totalruta, fyrkolumns sidfot). Se § Kvittots FORM. |
| `bilaga-delad.css` | Delad CSS: typsnitt (`@font-face`), färgtokens, layout - för bekräftelsebilagan/deltagarinformationen. ETT ställe att ändra rubrikfont/färger på för de TVÅ mallarna. **Rörs INTE av kvittot**, se § Kvittots FORM för varför. |
| `kvitto.css` | Kvittots EGNA CSS - monokrom svart/grå palett, tre gråfyllda rundade rutor. Delar bara `@page`/`.sida`-basboxen/Carlito-typsnittet med `bilaga-delad.css`, allt annat är eget. |
| `fixtures/*.exempel.json` | Exempeldata - samma värden som i de riktiga förlagorna, så en granskning kan jämföras rad för rad. |
| `lokala-typsnitt/` | **Gitignorerad symlänk**, se § Granska mallarna lokalt nedan. |
| `*.granskning.html` / `*.granskning.png` | **Gitignorerat**, genereras av granskningsskriptet - checkas aldrig in. |

## Den dynamiska ytan (ADR-119 beslut 3, UTVIDGAD av ADR-125)

**[TASK-309.4/.5, ADR-125 § Beslut 4] ALLA TRE mallarna
(`bekraftelsebilaga.html`, `deltagarinformation.html`, `kvitto.html`) är
Eta-mallar (`<%= data.x %>`/`<% if/for %>`, `autoEscape: true`), fyllda av
`supabase/functions/_shared/mall-render.ts`. `kvitto.html` konverterades
från den gamla `{{fältnamn}}`-strängersättningen i TASK-309.5 — se
`byggKvittoData` i tabellen nedan.**

ADR-119 beslut 3:s ursprungliga gräns ("brödtext, innehållslistorna … är
FAST FORM per kurstyp") är delvis SUPERSEDAD av ADR-125:s relationella
datamodell (Eventinnehåll/Agendapunkter): Beskrivningen och de två
innehållslistorna i bekräftelsebilagan, samt VARJE ämnesstycke i
deltagarinformationen, är nu likaså dynamiska — hämtade ur Eventinnehåll
(standard) eller eventets egen `(bilagetext)`-kopia, tomt block utelämnat.

| Mall | Eta-datat (`_shared/mall-data.ts`) |
|---|---|
| Bekräftelsebilagan | `kursnamn`, `datumTid`, `plats`, `pris`, `anmalningsavgift`, `visaResterande`, `resterandeBelopp`, `sistaBetalningsdatum`, `beskrivning[]`, `dagEttAgenda[]`, `dagTvaAgenda[]` |
| Deltagarinformationen | `kursnamn`, `datumTid`, `plats`, `forberedelser`, `klader`, `tagMed`, `rokning`, `parfym`, `mat`, `overnattning`, `parkering`, `transport`, `utrustning` (var och en `string \| null` — `null` utelämnar ämnesstycket helt) |
| Kvittot [TASK-309.5] | `kvittonummer`, `datum`, `orgReferens`, `kundnamn`, `kundEpost`, `benamning`, `netto`, `moms`, `brutto`, `orgNamn`, `orgGatuadress`, `orgPostadress`, `orgLand`, `orgNummer`, `orgMomsregnummer` — byggs av `byggKvittoData(spec: KvittoradSpec)`, ANNAN indataform än de två ovan (`KvittoradSpec` ur `_shared/receipt-content.ts`, inte `DocumentSourcesResult`) — se § "Kvittots dynamiska yta" nedan för käll-tabellen |

**Ingen persondata förekommer i någon mall** (AC #2) — mottagarens namn hör
till mailkroppen, aldrig till bilagan. Swish/Plusgiro-numren i
bekräftelsebilagan, sidfotens QR-URL:er och de fasta hälsnings-/
kontaktraderna FÖRBLIR fast form (organisationsuppgifter, oavsett event) —
inte en del av den dynamiska ytan, därför hårdkodade oförändrat.

**KÄND, MEDVETEN FÖRENKLING** (`_shared/mall-data.ts`s filhuvud): de
inbäddade mailto-länkarna och den fetstilta markupen den GAMLA hårdkodade
brödtexten/ämnesstyckena bar finns INTE kvar när fälten blir Lotta-
redigerbar Airtable-fritext — plain text kan inte bära en länk eller
`<strong>`. Bokfört, inte tyst tappat; en visuell-QA-fråga för
promoverings-skivorna (TASK-309.7/.8), inte TASK-309.4:s AC.

`<%= %>` (autoEscape) används GENOMGÅENDE — ALDRIG `<%~ %>` (rått läge) på
ett fält som ytterst härstammar från Airtable-fritext, se
`mall-render.test.ts` för det mekaniska beviset.

## Granska mallarna med riktig data (AC #3)

Ingen extern tjänst behövs. Kör:

```bash
npm run mall:granska -- bekraftelsebilaga
npm run mall:granska -- deltagarinformation
npm run mall:granska -- kvitto
open docs/mallar/bilagor/bekraftelsebilaga.granskning.html
open docs/mallar/bilagor/deltagarinformation.granskning.html
open docs/mallar/bilagor/kvitto.granskning.html
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

**RÄTTAT 2026-08-22 (S108 Del 7 § B, mall-diffen mot förlagorna):** detta
stycke påstod tidigare en *"avsiktlig avvikelse mot förlagan"* — att
förlagans QR-koder bär en logotyp centrerat INUTI QR-mönstret och att
mallen därför lade ikonen som en hörnbricka. **Båda leden var fel.**
Förlagan har fem separata bilder; ingen QR bär något överlägg, så
skanningsbarhets-resonemanget löste ett problem som inte fanns. Sidfoten
är sedan mall-diffen ombyggd efter förlagans faktiska form — två mörkblå
rutor (51,31 × 31,67 mm) med ikon och QR BREDVID varandra och bildtexten
inuti, bokomslaget fritt emellan — och QR-SVG:erna är kopierade verbatim.
Rättelsen står här i stället för att stycket tyst tagits bort, för att en
läsare av git-historiken ska se vad som påstods och varför det föll.

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

[TASK-309.4/.5, SUPERSEDAD] Detta stycke beskriver `TASK-279`:s
URSPRUNGLIGA scope-gräns (mall-SKAPANDET, ingen renderare) — kvar som
historik, INTE längre en beskrivning av dagens system. DocRaptor-
integration, Edge Function-koppling och `{{fältnamn}}`-ersättning finns
inte längre: ALLA TRE mallarna (inklusive kvittot, sedan TASK-309.5) är
Eta-mallar kopplade till `_shared/mall-render.ts`/DocRaptor via
`generate-event-attachment`, `preview-receipt` och `send-receipt-email`.
Ursprungstexten:

> Ingen DocRaptor-integration, ingen Edge Function, inget Storage, ingen
> invalidering, ingen bilage-lane. `{{fältnamn}}`-ersättningen här är
> ENDAST för lokal granskning — den riktiga ihopkopplingen mot en
> renderare är en framtida, egen skiva.

---

## Kvittots FORM (S108 MARCUS-SEKVENS punkt 2)

**[TASK-309.5, ADR-125 § Beslut 4-5] KOPPLINGEN SOM SAKNADES HÄR FINNS NU.**
Stycket nedan beskriver läget FÖRE TASK-309.5 (historik, kvar som facit
för mallens FORM/mått) — `renderKvittoPdf`/`_shared/receipt-pdf.ts` är
RIVNA, och kvittot renderas sedan TASK-309.5 genom SAMMA `_shared/
mall-render.ts`/DocRaptor-väg som bekräftelsebilagan/deltagarinformationen
(se § "Den dynamiska ytan" ovan). `kvitto.html`/`kvitto.css` ÄR alltså inte
längre "inte en ny renderingsväg" — de ÄR den skarpa renderingsvägen.

`renderKvittoPdf` (`supabase/functions/_shared/receipt-pdf.ts`) ritade FRAM
TILL TASK-309.5 kvittots text på koordinater med pdf-lib - 500×420pt, en
enda Helvetica-storlek, Marcus dom: *"det fulaste gräsligaste kvittot jag
någonsin sett"* (sessionsdok `2026-08-20-session-108.md` Del 6 § B).
`kvitto.html` + `kvitto.css` var FORMEN på `ADR-119`:s väg (HTML/CSS i
stället för koordinat-ritning) - byggd mot Rogers skarpa kvitto
(`~/Desktop/Miranon Media/exempelpdokument/2026-08-03 kvitto-forlaga.pdf`,
tråd `T170`). `ADR-119` beslut 7:s krav på ett minimaltest FÖRE en skarp
koppling löstes i TASK-309.1 (se ADR-125 § Updates 2026-08-23).

**Varför `kvitto.css` är en EGEN fil och `bilaga-delad.css` inte rörs
alls:** kvittot är en helt annan ART av dokument - monokrom svart/grå
(#F2F2F2) i stället för sage/gult/blått, Calibri-imitation (Carlito, redan
i `bilaga-delad.css`, återanvänd oförändrad) i stället för
Cavolini-rubriker, tre gråfyllda rundade rutor i stället för vita
ikonrutor/gul överstrykning. `kvitto.css` länkas som en ANDRA
`<link rel="stylesheet">` efter `bilaga-delad.css` och lägger till allt
kvitto-specifikt, inklusive sidans egen padding (`.sida--kvitto`) - i
stället för att följa `.sida--bekraftelse`/`.sida--deltagarinformation`s
mönster och lägga den posten i `bilaga-delad.css`. Skälet är dubbelt: det
håller `bilaga-delad.css` HELT ORÖRD (noll rader ändrade av detta uppdrag)
OCH minimerar kollisionsytan mot S108 Del 8 § D:s SYSKON-uppdrag (F6+F7,
gren `feat/s108-f6-f7-konturglob-selawik`), som rör exakt den filen
samtidigt.

### Kvittots dynamiska yta - tokenytan är 1:1 med `receipt-content.ts`

Hårt krav (S108 Del 8 § D): varje token i `kvitto.html` härleds ur
`supabase/functions/_shared/receipt-content.ts` - ingen ny datamodell
uppfinns i mallen. [TASK-309.5] Sedan Eta-konverteringen går härledningen
via EN extra namngiven datastruktur i mitten: `kvitto.html`s
`<%= data.x %>`-uttryck läser `_shared/mall-data.ts`s `byggKvittoData(spec)`
(`KvittoMallData`), som i sin tur ÅTERANVÄNDER `receipt-content.ts`s rena
hjälpfunktioner (`beraknaMoms`/`formatBelopp`/`formatKvittoDatum`/
`kvittoBenamning`/`MIRANON_ORG`) för att räkna fram varje fält — SAMMA
källa som förut (tabellen nedan), en extra, testad byggsten i mitten i
stället för en direkt fält-referens.

**[TASK-306] 1:1-kravets RIKTNING, förtydligad:** regeln betyder *inget i
mallen UTAN källa* - den betyder INTE *allt i källan MÅSTE synas i mallen*.
Beslut c) (2026-08-23) tar bort "Betalsätt"-raden UR MARKUPEN utan att röra
`KvittoradSpec.betalsatt` eller `kvittoRader()` - uppgiften finns kvar i
Kvitton-tabellen (skriven av `send-receipt-email`s `makeRealFinalizer`) och
mailtextens egen `Betalsätt: …`-rad, se § nedan. En källa utan mall-token är
alltså helt i sin ordning; en mall-token utan källa är den regeln FÄLLER.

| Token | Källa i `receipt-content.ts` |
|---|---|
| `kvittonummer` | `KvittoradSpec.kvittonummer` |
| `datum` | `formatKvittoDatum(spec.datum)` - ISO `YYYY-MM-DD` sedan S108 (Marcus-beslut 2026-08-22, "Kör dina rekommendationer": kvittot är en bokföringshandling; se ADR-109 § Updates 2026-08-22) - VERIFIERAT mot `tests/api/receipt-content.test.ts` (`formatKvittoDatum('2026-08-03T00:00:00.000Z')` -> `'2026-08-03'`) |
| `kundnamn` | `KvittoradSpec.kundnamn` |
| `kundEpost` | `KvittoradSpec.kundEpost` (PR #1791, Marcus-beslut 2026-08-22) - skrivs under kundnamnet i Fakturaadress-blocket, Rogers ordning namn -> e-post |
| `benamning` | [TASK-306 rättelsevarv] `kvittoBenamning(spec)` — `<Typ> <Datumspann>, <Bokföringstext>`, INGET kursnamn längre, se § nedan för formen |
| `netto` | `beraknaMoms(spec.belopp).netto`, formaterat via `formatBelopp()` - [TASK-306] även A-pris/Summa i radposten (beslut b, se § nedan); TIDIGARE `{{brutto}}` på båda cellerna, en verklig FEL-avvikelse mot totalrutans egen Netto-rad, inte en smaksak |
| `moms` | `beraknaMoms(spec.belopp).moms`, formaterat via `formatBelopp()` |
| `brutto` | `spec.belopp`, formaterat via `formatBelopp()` - mallen prefixar `SEK` EN gång på BETALT-raden (mätt: 6,55 mm gap, 13 pt, på beloppets baslinje), som Roger. [TASK-306] Sedan beslut b) ENDAST i totalrutans BETALT-rad - radpostens A-pris/Summa använder `netto` (ovan) |
| `orgNamn` | `MIRANON_ORG.namn` - sidfoten ("Miranon Media AB"), OFÖRÄNDRAD av rättelsevarvet |
| `orgReferens` | [TASK-306 rättelsevarv] `MIRANON_ORG.varReferens` ("Miranon Media/Lotta Gotthardsson") - "Vår referens"-raden, se § "Förlage-fält utan källa" nedan för GAP-historiken |
| `orgNummer` | `MIRANON_ORG.orgnummer` |
| `orgGatuadress` | `MIRANON_ORG.gatuadress` - adressen är TRE fält sedan S108 (Marcus-beslut 2026-08-22), ej en enradssträng - se stycket "Adressen är tre fält" nedan |
| `orgPostadress` | `MIRANON_ORG.postadress` |
| `orgLand` | `MIRANON_ORG.land` |
| `orgMomsregnummer` | `MIRANON_ORG.momsregnummer` |

**`momssatsProcent`-token BORTTAGEN ur markupen (S108, uppföljning av PR #1781,
RAPPORT.md § 2b).** Totalrutans etikett skrev tidigare
`Moms ({{momssatsProcent}} %)`; förlagan skriver bara `Moms` (BB-mätt: inget
procenttal i innehållsströmmen, se RAPPORT.md § 2b). Ändrat till statisk
`Moms` i `kvitto.html`. `MOMSSATS_PROCENT` (= 25) finns kvar i
`receipt-content.ts` och kan tokeniseras igen om ett framtida behov (flera
momssatser, en tydligare kvittorad) uppstår - ingen kodändring gjord, bara
markupens användning av värdet.

**Beloppsformateringen matchar förlagan sedan PR #1791 (S108 resume 5,
Marcus-beslut 2026-08-22: "matcha Rogers beloppsformat").** Rogers kvitto
skriver `2 500,00` (tusentalsmellanslag, alltid två decimaler, valutan som
`SEK`-prefix EN gång på BETALT-raden); `formatBelopp()` ger nu exakt den
formen (sv-SE-avgränsare normaliserad till vanligt mellanslag, pdf-lib/
WinAnsi-säkert) utan valutasuffix, och mallen sätter `SEK` framför BETALT.
Före #1791 skrev `formatBelopp()` `2500 kr`, och mallen visade den faktiska
formateringen i stället för en gissad - avvikelsen var bokförd här, inte
gömd. Fixturen `fixtures/kvitto.exempel.json` bär de nya värdena.

**Datumet är ISO och adressen är tre fält sedan S108 (2026-08-22,
Marcus-beslut "Kör dina rekommendationer" - slutbild av MARCUS-SEKVENS
punkt 2, se `tasks/sessions/2026-08-20-session-108.md` § Del 9 C och
ADR-109 § Updates 2026-08-22).** `formatKvittoDatum()` gav tidigare
`"3 augusti 2026"`; kvittot är en bokföringshandling, alltså ISO
`YYYY-MM-DD` - matchar dessutom Rogers egen datumsträng (`"2026-08-03"`)
exakt, se `~/Desktop/Miranon Media/exempelpdokument/2026-08-03
kvitto-forlaga.pdf`. `MIRANON_ORG.adress` var EN sträng
(`"Uttringe Hages väg 17, 144 63 Rönninge, Sverige"`) som radbröt i
mallens sidfotskolumn mitt i postnumret ("…väg 17, 144 / 63 Rönninge,
Sverige", upptäckt vid en side-by-side mot förlagan) - ersatt av
`gatuadress`/`postadress`/`land`, tre `<p>`-rader i sidfoten som nu matchar
förlagans egna fem rader (org-namn/gata/postort/land/webb) exakt. Fixturen
bär de nya fälten.

### Förlage-fält utan källa i `receipt-content.ts` - byggda, bokförda som GAP

Uppdraget kräver att dessa byggs i mallen men aldrig hittas på i kod:

| Fält | I mallen | Källa/motivering |
|---|---|---|
| Vår referens | `{{orgReferens}}` (= "Miranon Media/Lotta Gotthardsson") | **GAP STÄNGT** (TASK-306 rättelsevarv, Marcus dom 3, 2026-08-23): tidigare skrev raden `{{orgNamn}}` ("Miranon Media AB") eftersom ingen per-transaktion personattribuering fanns - Marcus granskade förlagan igen och pekade ut att den skriver "Miranon Media/Lotta Gotthardsson". `MIRANON_ORG.varReferens` bär nu det värdet, separat från `namn` (sidfoten, oförändrad) |
| Förfallodatum | Statisk `-` | Strukturellt konstant för ett KVITTO - `T170` rekommenderade uttryckligen att INTE ärva fältet som ett riktigt datafält |
| Vårt ordernr | `{{kvittonummer}}` (samma token som Kvitto-/OCR-nr) | Ingen egen "ordernr"-modell finns; Rogers EGET dokument duplicerar samma nummer i båda fälten |
| Öresavr | Statisk `0,00` | `beraknaMoms()` avrundar momsen till hela ören FÖRST (se dess docstring), så `netto + moms === brutto` alltid EXAKT - resten är matematiskt garanterat noll |
| Köparens e-post | `{{kundEpost}}` | **GAP STÄNGT** (S108 resume 5, PR #1791): `KvittoradSpec.kundEpost` finns sedan Marcus-beslutet 2026-08-22 och trådas från `send-receipt-email`s `email` - raden ovan beskrev läget före beslutet |
| Telefon/Plusgiro/Swish/Webb/Epost (sidfoten) | Statisk text | Källa `T170` (samma redan publicerade org-uppgifter). `MIRANON_ORG` bär bara `namn`/`orgnummer`/`gatuadress`/`postadress`/`land`/`momsregnummer` - INTE dessa fyra. Samma klass statisk data som `bekraftelsebilaga.html` redan hårdkodar (Swish/Plusgiro ovan) |
| "Godkänd för F-skatt" | Statisk text | Boilerplate, källa `T170`, ingen datamodell behövs |

### Visuell jämförelse och mätunderlag

Fullständig mätning (sidantal, radtabellens fem kolumnpositioner,
BETALT-gradens förhållande till brödtexten, sidfotens fyra kolumner) och
side-by-side-bevis: `test-results/kvittodiff/RAPPORT.md` +
`jamforelse-kvitto.png` (gitignorerat, samma princip som `test-results/
malldiff/` för de andra två mallarna). Sammanfattning:

- **1 sida = 1 sida.** Ingen spill.
- **Radtabellens fem kolumner: < 3 mm avvikelse** efter en mätt rättelse
  (ett första utkast låg 13-25 mm fel - se rapportens § 6 för bevis i
  BÅDA riktningarna, inklusive två egna CSS-buggar som fångades av samma
  mät-och-rendera-loop innan leverans).
- **BETALT-gradens förhållande till brödtexten: 13pt/9pt = 1,444x i BÅDA
  dokumenten**, mätt två oberoende vägar (typgrad ur PDF:ens
  innehållsström och bbox-höjd).
- **Sidfotens fyra kolumner: 0,6-9,4 mm avvikelse** (flex-jämna kolumner
  mot förlagans nästan-men-inte-helt jämna spridning) - bedömt, inte
  rättat, se rapportens § 5.
- **Strukturfynd:** alla TRE rundade rutor (tabellhuvud, totalruta,
  sidfot) är GRÅFYLLDA (#F2F2F2) med svart kant, mätt via `pdftocairo -svg`
  - inte en vit ram med gråfylld huvudrad.

Öppna frågor som kräver Marcus omdöme (sidfotens kolumnbredder,
"Vår referens"-fältets räckvidd, köparens e-post på kvittot): rapportens
§ 10.

### Kvittots layout-primitiver är motor-honorerade (TASK-304)

`kvitto.css`/`kvitto.html` bar tidigare `display:grid` (tre ställen:
metarad, referensblock, tabellraden) och flex-`gap` (fyra ställen:
totalrutan, total-kolumn, total-betalt, sidfoten). Prince 15.1 honorerar
INGET av de sju: grid staplar kolumnerna helt (metarad/referensblock) eller
kollapsar dem till innehållets egen bredd (tabellraden, 164,6mm→~55,5mm),
och flex-`gap` ignoreras helt (SEK↔BETALT-gapet blev 0mm — "SEK2 500,00"
hopvuxet). Mätt och bokfört i
[`docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md`](../../research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md).

**Ersatt med primitiv Prince faktiskt honorerar, formen oförändrad:**

- **Metarad + referensblock** (`display:grid` → flex-rad per dt/dd-par):
  markupen grupperar nu varje dt/dd-par i en `<div class="…-rad">` (HTML5.1
  tillåter `<div>`-omslutna grupper i en `<dl>`), och `.kvitto-metarad dt`/
  `.kvitto-referensblock dt` bär ett mätt `min-width` (bredaste dt-cellens
  bläckbredd i Chrome, samma pixel-scan-metod som forskningsfilen) så
  dd-kolumnen linjerar mellan raderna trots att grid:ets delade
  kolumn-track är borta. Högerjusteringen (`justify-content:end`) ersätts
  av `width:fit-content` + `margin-left:auto` — samma mönster
  `.kvitto-referensblock` redan bar för en annan regression.
- **Tabellraden** (`display:grid` fasta mm-kolumner → `<table>`):
  `kvitto.html` bär nu ett `<table>` per rad-grupp (tabellhuvudet, sedan
  posten) med delad `<colgroup>`/`<col>`-bredd via de befintliga
  `kvitto-col-*`-klasserna, `table-layout:fixed`, `width:100%`. Det forna
  `column-gap:1mm` är vikt in i varje kolumns egen `<col>`-bredd (samma
  kumulativa kolumnstarter som grid:et gav).
- **De fyra flex-`gap`-ställena** → `margin` på barnet, ENSAM (INTE
  parallellt med `gap`, se § nedan för varför).

**Mätt fynd om `bilaga-delad.css` § `.ikonruta-media` (utanför detta korts
scope att ändra):** att behålla `gap` PARALLELLT med `margin` på samma
flex-rad (mönstret den sektionen använder, "gap bär webbvyn, margin bär
PDF:en") är ADDITIVT i en riktig webbläsare — isolerat testat (2 flex-barn,
`gap:10mm` + `margin-right:10mm` på första barnet): 20,15mm uppmätt
mellanrum, inte 10mm. `bilaga-delad.css`s egen instans av mönstret HADE
exakt den dubbleringen — mätt oberoende samma natt (Chrome 8,81/9,14 mm mot
Prince 4,40/4,57 mm, `docs/research/bilagor-prince-omgranskning-2026-08-23.md`
ställe 3) och åtgärdad i `#1837`: `gap` borttagen, marginalen ensam bär
mellanrummet i båda motorerna. `kvitto.css` använder av samma skäl margin
ENSAM på alla sju platser — det enda sättet att både fixa Prince OCH hålla
Chrome-renderingen oförändrad.

**Verifierat mekaniskt (grep):** `kvitto.css` bär noll `display: grid` och
noll flex-`gap` utan motsvarande margin-ersättning. Mätt Chrome↔Prince per
ställe: research-filens § Updates.

### Kvittots benämning (TASK-306) — ursprungligt beslut 2026-08-23 (SUPERSPELAT, se rättelsevarvet nedan)

Marcus granskade kvittots Prince-form 2026-08-23 mot Lottas skarpa kvitto
(`2026-08-03 kvitto-forlaga.pdf`, T170) och fann tre innehållsavvikelser
(benämningen, A-pris/Summa-beloppet, en Betalsätt-rad som saknas i
förlagan). Tre beslut, samtliga i `kvittoBenamning()`
(`_shared/receipt-content.ts`, enhetstestad i
`tests/api/receipt-content.test.ts` § "kvittoBenamning"):

- **a) Benämning = `<Typ>, <Startdatum> - <Slutdatum>, <Kursnamn>[,
  <Bokföringstext>]`** — **SUPERSPELAT samma dag** av rättelsevarvet nedan
  (Marcus dömde Prince-renderingen av just DENNA form för lång, tre rader
  mot förlagans en). Historik kvar för spårbarhet: kort bindestreck mellan
  datumen (repo-policyn `.langa-streck-policy.json`, Marcus 2026-08-09:
  "korta streck vinner även i datumspann"). Endagars-event (samma
  start-/slutdatum, eller slutdatum saknas): ETT datum. Saknas ett fält:
  LEDET utelämnas helt, aldrig en platshållare. Betalningsetiketten
  (Anmälningsavgift/Slutbetalning) var INTE en del av benämningen - den var
  en egen synlig sub-rad (`.kvitto-betalningsetikett`) UNDER
  benämningstexten - **BORTTAGEN HELT** av rättelsevarvet (Marcus dom 2).
- **b) A-pris och Summa i radposten visar `{{netto}}`, inte `{{brutto}}`.**
  Mallen skrev tidigare `{{brutto}}` på båda cellerna - en verklig
  AVVIKELSE mot totalrutans egen `Netto`-rad (samma belopp, två olika
  siffror på samma sida), inte en smaksak. Totalrutan är OFÖRÄNDRAD (bär
  fortfarande `netto`/`moms`/`brutto` som förut). **OFÖRÄNDRAT av
  rättelsevarvet.**
- **c) "Betalsätt"-RADEN är borttagen ur `kvitto.html`** (Rogers förlaga
  saknar den) - se § "1:1-kravets RIKTNING" ovan för varför detta INTE
  bryter tokenytans 1:1-regel: uppgiften finns kvar i Kvitton-tabellen och
  mailtextens `kvittoRader()`. **OFÖRÄNDRAT av rättelsevarvet.**

**Nytt Event-fält `Bokföringstext (kvitto)` (singleLineText, frivilligt).**
Lotta skriver sina egna kategoriord; ifyllt → sist i benämningen, tomt →
utelämnat. Fält-ID:n: `docs/reference/data-model.md` (Eventplanering,
create-fält-tabellen). Läses BY NAME av `preview-receipt`/
`send-receipt-email` (`Typ`/`Startdatum`/`Slutdatum`/`Event (source)`/
`Bokföringstext (kvitto)`) - samma mönster som VARJE annan Airtable-
fältläsning i denna kodbas (ADR-050: samma EF-kod mot båda baserna via
`AIRTABLE_BASE_ID`-secreten, fält-NAMNET är identiskt även när ID:t skiljer
sig). Fullt resonemang + avvikelsen mot ett uppdragsdirektiv om ID-baserad
läsning: `send-receipt-email/index.ts` § `readEventKvittoFalt`. **Fältet
självt är OFÖRÄNDRAT av rättelsevarvet** - bara hur dess värde placeras i
strängen (se nedan) och kursnamnet (som INTE längre är med) ändrades.

### Kvittots benämning — RÄTTELSEVARV samma dag (TASK-306, Marcus tre domar, 2026-08-23)

Marcus granskade den FÄRDIGA Prince-PDF:en (`kvitto-prince-306.pdf`, byggd
på beslut a-c ovan) och fann tre nya fel — samma dag, innan kortet ens
hunnit stängas. Tre domar, verbatim:

1. *"Benämningen är för lång! Den tar ju upp tre rader!! Orginalet tar upp
   EN rad. Kan vi skriva 'Utbildning 2026-07-25/26, personlig utveckling,
   meditation' bara och få plats med det på en rad utan att det ser
   konstigt ut? Lotta får ju plats med det på orginalet, med marginal."*
2. *"Varför har vi fortfarande med ordet 'Slutbetalning'. Det är FEL. Det
   är bara en betalning, varken slut eller början."*
3. *"på originalkvittot så har hon efter 'Vår referens' skrivit
   'Miranon Media/Lotta Gotthardsson', vi har i vår mall skrivit
   'Miranon Media AB'. Ändra det också."*

**Åtgärdat, samtliga i `receipt-content.ts` (enhetstestad,
`tests/api/receipt-content.test.ts` § "kvittoBenamning — TASK-306
rättelsevarv"):**

- **Dom 1 → ny benämningsform: `<Typ> <Datumspann>, <Bokföringstext>`.**
  Kursnamnet är HELT BORTA (Lottas egen rad saknar det redan - hennes
  bokföringssystem är per ARTIKEL, bokföringstexten ensam identifierar
  raden - `eventNamn` lever kvar som raw fixturdata men konsumeras inte
  längre av `kvittoBenamning`, se `fixtures/kvitto.exempel.json` § `_kalla`).
  Typ och datumspann skiljs av ETT MELLANSLAG, inte kommatecken. Datumspannet
  KOMPRIMERAS till Lottas kompakta form (`formaterDatumspann` i
  `receipt-content.ts`): samma år+månad → bara slutdagen
  (`"2026-07-25/26"`), samma år olika månad → månad-dag
  (`"2026-07-31/08-01"`), olika år → hela slutdatumet
  (`"2026-12-31/2027-01-01"`), endagars/saknat slutdatum → ett datum.
- **Dom 2 → betalningsetiketten borttagen HELT**, både ur `kvitto.html`
  (`.kvitto-betalningsetikett`-spannet och dess CSS-regel är RADERADE, inte
  bara tomma) och ur mailtextens `Avser:`-rad (`kvittoRader()` skriver nu
  bara benämningen). `KvittoradSpec.betalning` lever kvar oförändrat -
  Kvitton-tabellens ledger (`send-receipt-email/index.ts`s
  `makeRealFinalizer`) skriver fortfarande `Anmälningsavgift`/
  `Slutbetalning` dit, det är bara den SYNLIGA kvittotexten som tappar
  ordet.
- **Dom 3 → `MIRANON_ORG.varReferens`, nytt fält.** "Vår referens"-raden
  bytte token från `{{orgNamn}}` till `{{orgReferens}}` =
  `MIRANON_ORG.varReferens` = `"Miranon Media/Lotta Gotthardsson"` (Lottas
  EGEN skrivning på förlagan, snedstreck utan mellanslag). `orgNamn`
  (sidfoten, "Miranon Media AB") är OFÖRÄNDRAD - se § "Förlage-fält utan
  källa" ovan för GAP-historiken denna dom stänger.

**Kapacitetsgräns, mätt BÅDE teoretiskt och empiriskt, BÅDA renderingsmotorerna
(2026-08-23):** benämningskolumnen (`.kvitto-col-benamning`, 93,7 mm bred,
Carlito 400 9pt, `receipt-content.ts` § `kvittoBenamning`) **rymmer ~72
tecken på EN rad** innan den bryter till rad två.

- **Teoretiskt:** 93,7 mm (= 354,1 px @96dpi) ÷ 4,908 px/tecken
  (canvas `measureText`, Carlito 400 9pt, en 77-tecken svensk exempelmening)
  = **72,2 tecken**.
- **Empiriskt (Chrome, binärsökning på en riktig ord-för-ord-sträng i den
  FAKTISKA `.kvitto-post td.kvitto-col-benamning`-cellen):** exakt **72
  tecken** ryms på en rad, **73 tecken bryter** till rad två — de två
  metoderna slår i **exakt samma tal**.
- **Bekräftat i Prince** (samma 72-/73-teckensträngar, `test-docraptor-render`,
  `pdftotext -layout`): 72 tecken → EN rad; 73 tecken → bryter (rad två
  börjar med "för"). Prince ≡ Chrome vid brytpunkten, tecken för tecken.
- **Marcus-facitet** ("Utbildning 2026-07-25/26, personlig utveckling,
  meditation") är **58 tecken** — 14 tecken marginal innan kolumnen bryter,
  vilket bekräftar Marcus egen observation ("Lotta får ju plats med det på
  orginalet, med marginal").
- **Konsekvens vid en LÄNGRE bokföringstext:** en benämning över ~72 tecken
  bryter till rad två - INGET FEL (samma `white-space: normal`-mekanism som
  redan hanterar det, TASK-304), men Lotta SER det. Kolumnbredden
  (93,7 mm) rörs INTE för att kompensera - se `kvitto.css` §
  `col.kvitto-col-benamning` för varför bredderna är mätta mot förlagan
  och låsta.

**Verifierat mekaniskt + visuellt (2026-08-23, rättelsevarvet):**
`kvittoBenamning()` är enhetstestad (Marcus-facit verbatim, datumspann i
alla tre klasser + endagars, alla-fält-null, bara-Typ, bara-bokföringstext).
`kvittoRader()`s Avser-rad enhetstestad utan etikett. `MIRANON_ORG`s nya
`varReferens`-fält enhetstestat. Prince ≡ Chrome på fixturens facit-sträng
(EN rad i båda, `pdftotext -layout` byte-för-byte samma text) OCH vid
kapacitetsgränsens 72-/73-teckensträngar (se ovan).
