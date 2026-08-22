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
- Fetningarna i brödtexten: exakt de sju fraserna kortets Implementation
  Notes anger, ordagrant.

### Bekräftelsebilagan — avviker, med skäl

- **`SegoeUI-Bold` → Carlito Bold.** Förlagan bär `SegoeUI-Bold` på ETT
  ställe (§ 2.2 i research-passet identifierar det men specificerar inte
  exakt vilket ord); mallen använder Carlito Bold genomgående i stället,
  per uppdragets explicita instruktion. Ingen visuell skillnad av
  betydelse (båda är sans-serif bold vid brödtextstorlek).
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

---

## Kvittots FORM (S108 MARCUS-SEKVENS punkt 2)

`renderKvittoPdf` (`supabase/functions/_shared/receipt-pdf.ts`) ritar i dag
kvittots text på koordinater med pdf-lib - 500×420pt, en enda Helvetica-
storlek, Marcus dom: *"det fulaste gräsligaste kvittot jag någonsin sett"*
(sessionsdok `2026-08-20-session-108.md` Del 6 § B). `kvitto.html` +
`kvitto.css` är FORMEN på `ADR-119`:s väg (HTML/CSS i stället för
koordinat-ritning) - byggd mot Rogers skarpa kvitto
(`~/Desktop/Miranon Media/exempelpdokument/2026-08-03 Ulrika Berge.pdf`,
tråd `T170`), INTE en ny renderingsväg. Ingen EF-koppling, ingen
DocRaptor-integration - samma "vad som INTE görs" som resten av denna sida,
plus `ADR-119` beslut 7:s krav på ett minimaltest FÖRE en skarp koppling.

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

Hårt krav (S108 Del 8 § D): varje `{{token}}` i `kvitto.html` härleds
direkt ur `supabase/functions/_shared/receipt-content.ts` - ingen ny
datamodell uppfinns i mallen.

| Token | Källa i `receipt-content.ts` |
|---|---|
| `kvittonummer` | `KvittoradSpec.kvittonummer` |
| `datum` | `formatKvittoDatum(spec.datum)` - VERIFIERAT mot `tests/api/receipt-content.test.ts` rad 193 (`formatKvittoDatum('2026-08-03T00:00:00.000Z')` -> `'3 augusti 2026'`) |
| `kundnamn` | `KvittoradSpec.kundnamn` |
| `eventNamn` | `KvittoradSpec.eventNamn` |
| `betalningLabel` | Samma härledning som `kvittoRader()`s lokala variabel (`spec.betalning === 'avgift' ? 'Anmälningsavgift' : 'Slutbetalning'`) |
| `betalsatt` | `KvittoradSpec.betalsatt` |
| `netto` | `beraknaMoms(spec.belopp).netto`, formaterat via `formatBelopp()` |
| `moms` | `beraknaMoms(spec.belopp).moms`, formaterat via `formatBelopp()` |
| `brutto` | `spec.belopp`, formaterat via `formatBelopp()` |
| `orgNamn` | `MIRANON_ORG.namn` |
| `orgNummer` | `MIRANON_ORG.orgnummer` |
| `orgAdress` | `MIRANON_ORG.adress` |
| `orgMomsregnummer` | `MIRANON_ORG.momsregnummer` |

**`momssatsProcent`-token BORTTAGEN ur markupen (S108, uppföljning av PR #1781,
RAPPORT.md § 2b).** Totalrutans etikett skrev tidigare
`Moms ({{momssatsProcent}} %)`; förlagan skriver bara `Moms` (BB-mätt: inget
procenttal i innehållsströmmen, se RAPPORT.md § 2b). Ändrat till statisk
`Moms` i `kvitto.html`. `MOMSSATS_PROCENT` (= 25) finns kvar i
`receipt-content.ts` och kan tokeniseras igen om ett framtida behov (flera
momssatser, en tydligare kvittorad) uppstår - ingen kodändring gjord, bara
markupens användning av värdet.

**Beloppsformateringen avviker synligt från förlagan, med källa i koden -
inte en brist i mallen.** Rogers kvitto skriver `2 500,00`
(tusentalsmellanslag, alltid två decimaler); `formatBelopp()` skriver
`2500 kr` för heltal (inget tusentalsmellanslag, ingen decimal, `" kr"`
som suffix i stället för ett `SEK`-prefix) - verifierat mot
`tests/api/receipt-content.test.ts` rad 198
(`expect(formatBelopp(2500)).toBe('2500 kr')`). `receipt-content.ts` är
förbjudet att röra i detta uppdrag, så mallen visar den FAKTISKA
formateringen i stället för en gissad, snyggare variant.

### Förlage-fält utan källa i `receipt-content.ts` - byggda, bokförda som GAP

Uppdraget kräver att dessa byggs i mallen men aldrig hittas på i kod:

| Fält | I mallen | Källa/motivering |
|---|---|---|
| Vår referens | `{{orgNamn}}` (= "Miranon Media AB") | `MIRANON_ORG.namn` - ingen per-transaktion personattribuering finns (Rogers "Lotta Gotthardsson" har ingen motsvarighet i `KvittoradSpec`) |
| Förfallodatum | Statisk `-` | Strukturellt konstant för ett KVITTO - `T170` rekommenderade uttryckligen att INTE ärva fältet som ett riktigt datafält |
| Vårt ordernr | `{{kvittonummer}}` (samma token som Kvitto-/OCR-nr) | Ingen egen "ordernr"-modell finns; Rogers EGET dokument duplicerar samma nummer i båda fälten |
| Öresavr | Statisk `0,00` | `beraknaMoms()` avrundar momsen till hela ören FÖRST (se dess docstring), så `netto + moms === brutto` alltid EXAKT - resten är matematiskt garanterat noll |
| Köparens e-post | UTESLUTEN helt | Ingen kodväg (`KvittoradSpec`, `preview-receipt`s `TYPEXEMPEL` eller `send-receipt-email`s PDF-innehåll) skriver ut köparens e-post på kvittot i dag - `send-receipt-email`s `SkarpSpec.email` finns bara som SÄNDNINGSadress, aldrig som en `kvittoRader()`-rad |
| Telefon/Plusgiro/Swish/Webb/Epost (sidfoten) | Statisk text | Källa `T170` (samma redan publicerade org-uppgifter). `MIRANON_ORG` bär bara `namn`/`orgnummer`/`adress`/`momsregnummer` - INTE dessa fyra. Samma klass statisk data som `bekraftelsebilaga.html` redan hårdkodar (Swish/Plusgiro ovan) |
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
