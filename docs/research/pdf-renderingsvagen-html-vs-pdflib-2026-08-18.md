---
owner: marcus803
updated: 2026-08-18
review_by: 2026-11-18
status: draft
---

# PDF-renderingsvägen — branschmönster mot `pdf-lib`, för Roger & Lottas två verkliga dokument (2026-08-18)

> **Proveniens:** avgränsat research-pass (`marcus-system:research`-skillen),
> kört OISOLERAT i huvudkatalogen på `miranon-media-admin`, committar
> aldrig. **Modell:** exakt rad ur egen systemprompt — *"You are powered by
> the model named Sonnet 5. The exact model ID is claude-sonnet-5."*
> Arbetsträdet delas med en aktiv orkestrerar-session vars gren bytte tre
> gånger under passet (`docs/s107-paus-4` → `spec/s107-241-8-paritet` →
> `spec/s107-personlistan`, sista läst SHA `67b48563`) — förväntat
> och dokumenterat beteende, ingenting annat i trädet rördes.
>
> **Styrning mitt i passet:** uppdraget öppnade med frågan inramad som
> *"går HTML→PDF i VÅR Edge-runtime?"* — Marcus pushbackade (nära-verbatim,
> 2026-08-18): *"alla proffsföretag har ju bilagor och pdf:er som bifogas i
> mail, hur svårt kan det va? Vi ska göra detta BRANSCHLEDARMÄSSIGT!"* Passet
> styrdes om att börja i branschmönstret (§1) och först därefter pröva vår
> egen begränsning mot det — se § 3 för hur `task-146`s "inget externt
> beroende"-linje omprövas i ljuset av det.

## Kort svar

**Branschledarmönstret för dokument av den här visuella komplexiteten
(rundade ramar, inbäddad logga, mitt-i-mening-fetning, flerkolumnslayout) är
en HTML/CSS-driven renderingsmotor — inte koordinat-ritning.** Det görs
strukturellt ALDRIG inuti en Deno-baserad edge-runtime (Supabase Edge
Functions inkluderat) — headless Chrome/Chromium får inte plats i Supabase
Edge Functions bundle-tak (20 MB mot Chromiums ~150–300 MB) och Supabases
**egen** dokumentation pekar uttryckligen till en **extern** tjänst
(Browserless.io) för just detta. Namngivna branschaktörer (Shopify, Square —
bekräftat kunder hos en Prince-motor-baserad HTML→PDF-tjänst enligt
leverantörens egen webbplats) löser det via en extern renderare eller en
självhostad container, aldrig via ren koordinat-ritning.

`task-146`s beslut ("PDF-generering inom plattformen — inget externt
beroende") fattades **innan** någon sett de faktiska dokumenten, och dess
motivering ("ett problem som redan är löst inom plattformen") höll för den
smala frågan (kan Deno rita svensk text) men aldrig för den faktiska visuella
komplexiteten — det är nu mätt (§2) att varje CSS-egenskap förlagorna
använder måste handkodas i `pdf-lib`.

**Rekommendation (inte beslut):** byt bort strikt koordinat-ritning för
dessa två mallar. Två vägar finns, båda grundade i primärkällor — se § 3 för
den fullständiga avvägningen och vad varje väg kostar.

## 0. Vad som redan var grundat, och vad detta pass lägger till

Två pass läste jag i sin helhet innan jag sökte något nytt:

- **`docs/research/utskicks-bilage-arkitektur-2026-08-03.md`** grundade att
  `pdf-lib` kör i Deno/Supabase Edge Functions (tre precedent: Cloudflare
  Workers, Deno-quickstart, Supabase-community) och mätte svensk
  teckenkodning. Den flaggade själv, redan då: *"`pdf-lib` är 'a programmatic
  API, not an HTML renderer … there is no layout engine'"* och att en
  framtida mall-editor *"sannolikt kräver en annan renderingsväg
  (HTML/CSS-baserad)"* — **öppnat men aldrig utrett**, till nu.
- **`docs/research/dokumentmallarnas-forlagor-2026-08-17.md`** läste Roger &
  Lottas VERKLIGA dokument (andra filnamn än detta pass — Word-genererade
  brev) och drog slutsatsen "behåll `pdf-lib`, men använd dess fulla API"
  — men testade **aldrig** `embedPng`/`embedFont` skarpt, och flaggade
  rundade hörn som en öppen avvägningsfråga, inte en löst sådan.
- **`backlog/tasks/task-146`** (PRD) och **`task-146.1`** (Done, runtime-bevis)
  läste jag i sin helhet. `task-146.1` bevisade — skarpt, mot staging
  `pqtshyierkdgwdnxuirz`, 2026-08-07 — att `pdf-lib` kör i den riktiga Edge
  Runtimen (`supabase-edge-runtime-1.74.2`, Deno v2.1.4-kompatibel), med
  svensk text verifierad två oberoende vägar och minne/CPU/kallstart långt
  under plattformstaket. Det beviset **står kvar oomtvistat** — frågan i
  detta pass är inte "kan `pdf-lib` köra", utan "är det rätt VERKTYG för
  dessa TVÅ dokument, och vad gör branschen".

**Nytt i detta pass, mot de VERKLIGA filerna Marcus pekade ut**
(`bekräftelsebilaga-exempel.pdf` + `deltagarinformation-exempel.pdf`, andra
filer än 17-augusti-passets — dessa är **PowerPoint**-exporterade
(`Creator: PowerPoint`, `Producer: macOS … Quartz PDFContext`), inte
Word-brev): disk-verifierade fonter, färger och bildobjekt (§2), en full
kartläggning av branschmönstret för PDF-i-transaktionsmail 2026 (§1, helt
ny — fanns inte i något tidigare pass), och en omprövning av `task-146`s
motivering mot det mönstret (§3).

**Åldersbedömning:** utskicks-bilage-passet (2026-08-03) och
dokumentmallar-passet (2026-08-17) är två respektive en dag gamla —
inget av det är föråldrat. Ingenting i detta pass river deras
runtime-fynd; det utmanar bara verktygsvalet för just dessa två mallar.

## 1. Branschmönstret 2026 — hur genereras och bifogas PDF till transaktionsmail?

**Käll-hierarki:** förstaparts-dokumentation och -webbplatser i första hand
(Supabase, Gotenberg, DocRaptor, Vercel/Satori, react-pdf); väletablerade
utvecklarbloggar (pdfbolt.com, pdf4.dev, pdfnoodle.com — samtliga
PDF-tjänste-leverantörer som skriver om det egna fältet, läses med den
skepsis en leverantörsblogg kräver men korsläses mot varandra och mot
förstaparts-källor) i andra hand. Precedent-rymden är **inte tunn** här —
det här är ett av de mest bloggade, mest kommersialiserade delfälten inom
serverless/edge-utveckling.

### 1.1 Fyra namngivna mönster, var de kör och vad de kräver

| Mönster | Var körs renderingen | Teknik | Sync/async | Namngivet exempel |
|---|---|---|---|---|
| **A — Headless-browser, DIY-mikrotjänst** | Egen container/serverless-funktion (Cloud Run, Lambda, EC2) — **inte** en edge-isolat | Puppeteer/Playwright mot riktig Chromium | Oftast synkront för enstaka dokument, kö vid volym | Vitt spritt DIY-mönster, se källor nedan |
| **B — Managed HTML→PDF-API** | Leverantörens infrastruktur, anropas via HTTP | Prince-motor (DocRaptor) eller Chromium (Api2Pdf m.fl.) | Synkront HTTP-anrop | **DocRaptor** — kund hos **Shopify, Square, HubSpot, Accenture, Wiley** enligt egen webbplats |
| **C — Självhostad container** | Egen Docker-container (Fly.io/Render/eget kluster) | Gotenberg (bäddar in Chromium + LibreOffice) | Synkront HTTP-anrop | **Gotenberg** (MIT, `gotenberg.dev`) |
| **D — Edge-native CSS-lager utan browser** | INUTI edge-isolatet (V8/Deno/Workers) | Satori (JSX+CSS→SVG) + resvg (SVG→PNG), sedan inbäddad i en PDF | Synkront, i samma request | **Vercel `@vercel/og`** — Supabase **egen** dokumentation importerar samma paket direkt i en Edge Function |
| **E — Koordinat-ritning, ingen CSS** | Var som helst inkl. edge-isolat | `pdf-lib`, `PDFKit` | Synkront | Vad appen redan har |

Källor per rad:

- **A:** "Puppeteer, a powerful headless browser automation tool for Node.js,
  makes it easy to convert HTML into high-quality PDFs" — typisk
  arbetsgång: HTML-mall → Handlebars-databindning → Puppeteer-rendering
  ([PDFBolt](https://pdfbolt.com/blog/generate-pdf-nodejs-puppeteer)).
  Serverless-varianten körs på Cloud Run/Lambda, **inte** i en edge-isolat,
  just för att Chromium behöver riktigt OS-utrymme
  ([OneUptime](https://oneuptime.com/blog/post/2026-02-17-how-to-build-a-serverless-pdf-generation-service-using-cloud-run-and-puppeteer/view),
  [PDF Noodle](https://pdfnoodle.com/blog/how-to-scale-html-to-pdf-with-serverless-and-puppeteer)).
- **B:** DocRaptors egen webbplats: *"DocRaptor is the only HTML to PDF API
  that uses the Prince PDF generator"* och *"Trusted PDF generator for
  organizations like Shopify, Wiley, HubSpot, Square, Accenture, and
  thousands more"* ([docraptor.com](https://docraptor.com/)). En oberoende
  jämförelse säger rakt ut: *"For invoices, statements, and formal reports,
  DocRaptor is the recommended choice"*
  ([PDF4.dev](https://pdf4.dev/blog/best-pdf-generation-apis-2026-compared)).
- **C:** Gotenbergs egen webbplats: *"A Docker-based API built for PDF
  conversion"*, *"Chromium, LibreOffice, and PDF engines included"*, MIT-
  licens ([gotenberg.dev](https://gotenberg.dev/)). Referensdrift på Render:
  512 MB RAM / 0,5 CPU räcker för demoinstansen
  ([Gotenberg installation docs](https://gotenberg.dev/docs/getting-started/installation)).
  Managed variant (Elestio) ~11 USD/månad.
- **D:** *"Satori runs entirely in JavaScript with no native dependencies,
  making it ideal for edge runtimes"* — Satori (JSX+CSS→SVG, Yoga-layout,
  **inte** en fullständig CSS-implementation) + `resvg` (SVG→PNG) är motorn
  bakom Vercels egna Open Graph-bilder
  (Vercel — OG Image Generation: <https://vercel.com/docs/og-image-generation>,
  Satori — GitHub: <https://github.com/vercel/satori>). **Supabase
  egen dokumentation** — inte tredjepart — importerar samma paket rakt in i
  en Edge Function: `"npm:@vercel/og@^0"` tillsammans med
  `"npm:react@^19"`, deployad med `--no-verify-jwt` som publik
  bild-endpoint
  (Supabase — Generating OG Images: <https://supabase.com/docs/guides/functions/examples/og-image>).
  Detta är den **starkaste** enskilda källan i hela detta pass — det är
  plattformsägaren själv som visar CSS-driven rendering INUTI samma
  runtime `task-146.1` redan bevisat för `pdf-lib`.
- **E:** Redan grundat i `utskicks-bilage-arkitektur-2026-08-03.md` och
  omprövat i § 2 nedan.

### 1.2 Vad Supabase SJÄLVA säger när frågan är "PDF/skärmdump i en Edge Function"

Supabases officiella exempel för skärmdumpar med Puppeteer säger rakt ut att
en riktig Chromium-instans **inte** kan köra i Edge Function-sandlådan och
löser det genom att koppla mot en **extern** tjänst:

> *"Puppeteer is a handy tool to programmatically take screenshots and
> generate PDFs, however trying to do so in Edge Functions can be
> challenging due to the size restrictions. Luckily there is a serverless
> browser offering available that we can connect to via WebSockets."*
> (Supabase — Taking Screenshots with Puppeteer: <https://supabase.com/docs/guides/functions/examples/screenshots>)

Sidans egna utgående länk (disk-verifierat i denna sandlåda via `curl` mot
sidans råmarkup) pekar till **`browserless.io`** med `aria-label="External
Source: serverless browser offering available"` — inte en gissning, ordagrant
ur sidans egen HTML.

Ett fristående, Supabase-specifikt vendor-exempel bekräftar samma mönster:
**Doppio** ("HTML to PDF & Screenshots API") marknadsför en egen quick-start
för Supabase Edge Functions där hela integrationen är ett enda
`fetch()`-anrop mot `api.doppio.sh/v1/render/pdf/sync`
([doc.doppio.sh](https://doc.doppio.sh/common/quick-start-serverless/supabase))
— ett tecken på att mönstret är vanligt nog att en leverantör byggt en
produkt specifikt riktad mot just denna runtime, inte ett udda specialfall.

**Bundle-taket gör headless Chrome omöjligt oavsett behörighet:** Supabase
Edge Functions har ett **20 MB**-bundletak lokalt via CLI (5 MB via
Management API/Dashboard)
([Supabase — Edge Function bundle size issues](https://supabase.com/docs/guides/troubleshooting/edge-function-bundle-size-issues)).
En Chromium-binär väger typiskt 150–300 MB — den får **strukturellt** inte
plats, oavsett om subprocess-spawning vore tillåten (obelagt om den är det
— se § 4). Kombinerat med det redan grundade minnestaket (256 MB,
`utskicks-bilage-arkitektur-2026-08-03.md`) är svaret entydigt: **headless
Chrome/Chromium kan inte köra INUTI en Supabase Edge Function, punkt.**

### 1.3 Vad jag INTE kunde belägga om namngivna aktörers interna stack

- **Stripe.** Ingen offentlig engineering-blogg hittad som beskriver hur
  Stripes fakturamotor faktiskt renderar sina PDF:er. Sökningen gav bara
  produktdokumentation (`docs.stripe.com/invoicing/dashboard/manage-invoices`)
  och tredjeparts-guider för hur man laddar ner Stripe-fakturor via API:t —
  ingenting om den interna renderingsmotorn. **Obelagt, inte falsifierat.**
- **Eventbrite.** Bekräftat att biljett-PDF:er genereras och bifogas
  ordererkännande-mail, men ingen källa specificerade VILKET bibliotek/
  vilken motor. **Obelagt.**
- **Shopify (internt).** Shopifys EGEN Order Printer (första-parts) och
  tredjeparts-appar i App Store genererar PDF:er, men ingen källa beskrev
  Shopifys interna renderingsmotor. Det som ÄR belagt: Shopify står listat
  som DocRaptor-kund på DocRaptors egen webbplats — vilket säger att
  ekosystemet KRING Shopify (om än inte nödvändigtvis Shopifys kärnprodukt)
  använder en Prince-baserad extern tjänst.

## 2. Vad kostar `pdf-lib`-vägen FÖR DESSA TVÅ DOKUMENT — mätt, inte gissat

Filerna lästes med `pdfinfo`/`pdffonts`/`pdftocairo -svg`/`pdfimages -list`
(poppler-utils, samma metodik som 17-augusti-passet) mot de VERKLIGA filerna
Marcus pekade ut i `/Users/marcus/Downloads/exempelpdokument/`.

**Disk-verifierat grundfaktum:** båda är exakt A4 (`595.276 × 841.89 pts`),
1 sida, exporterade ur **PowerPoint** (`Creator: PowerPoint`, `Producer:
macOS Version 15.6 … Quartz PDFContext`) — INTE Word som 17-augusti-passets
andra exempelfiler. Det ändrar inget om typsnitten (fortfarande
Calibri-familjen + `Cavolini-Bold`), men bekräftar att Roger/Lotta bygger
sina mallar i minst två olika Office-verktyg.

| Fil | Inbäddade typsnitt (`pdffonts`) |
|---|---|
| `bekräftelsebilaga-exempel.pdf` | `Cavolini-Bold`, `Calibri`, `Calibri-Bold` (×2 instanser), `SegoeUI-Bold`, `Calibri-BoldItalic` |
| `deltagarinformation-exempel.pdf` | `Calibri-Bold`, `Calibri`, `Calibri-Italic`, `Cavolini-Bold` |

**Loggan** (`pdfimages -list`): objekt 0 i BÅDA filerna, `1152×238 px`,
`icc`-färgrymd, `36.7K/4.6%` — bit-identisk storlek/kompression i båda,
samma fynd som 17-augusti-passet gjorde på andra filer. **Bekräftelsebilagan
har fem YTTERLIGARE bildobjekt** (`pdfimages -list`, objekt 1–8, flera med
egna `smask`-kanaler för genomskinlighet): en fotobild ~378×616 (bokomslaget
i sidfoten), tre ikon-/QR-liknande bilder (313×313, 437×440, 256×256,
425×427) — matchar det visuellt observerade sidfots-mönstret med tre rutor
(Instagram-QR, bokomslag, webb-QR).

### 2.1 Element för element, mot `pdf-lib.js.org` (förstaparts-API)

- **Logga via `embedPng`.** Trivialt — en enda `doc.embedPng(bytes)` +
  `page.drawImage()`. Ingen ny research behövs, redan dokumenterat API.
- **Rundade hörn.** `pdf-lib.js.org`s egen `drawSvgPath`-exempel visar bara
  fri-form-kurvor, inte en `borderRadius`-parameter:

  ```js
  page.drawSvgPath(svgPath, { borderColor: rgb(0, 1, 0), borderWidth: 5 })
  ```

  Sidans egen `drawRectangle`-dokumentation nämner INGEN
  rundad-hörn-parameter. **Disk-verifierat i denna sandlåda:** de rundade
  rutorna i `bekräftelsebilaga-exempel.pdf` är, enligt `pdftocairo -svg`,
  ritade som slutna kubiska Bézier-vägar (`C`-kommandon i path-datat, sex
  segment per rundad rektangel) — exakt den typ av handmålad path
  `pdf-lib` skulle kräva. Det finns INGEN genväg i `pdf-lib`; varje rundad
  ruta (infoboxen i båda dokumenten, radtabellen/totalrutan i tidigare
  kvitto-passet, de tre sidfots-rutorna i bekräftelsebilagan) blir en
  handskriven path-funktion.
- **Selektiv fetning mitt i mening.** Inget hjälp-API finns — varje segment
  (fet/icke-fet, färgad/svart) blir ett eget `drawText`-anrop med manuell
  x-position-uträkning via `font.widthOfTextAtSize()`. Realistiskt utdrag
  för EN mening med tre feta ord (mönstret syns i den faktiska
  bekräftelsebilagan: *"…ge dig en djupare insikt om **medvetandet**…"*):

  ```ts
  type Segment = { text: string; bold: boolean }
  const segments: Segment[] = [
    { text: 'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om ', bold: false },
    { text: 'medvetandet', bold: true },
    { text: ', både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt ', bold: false },
    { text: 'djupa meditationer', bold: true },
    { text: '.', bold: false },
  ]

  let cursorX = marginX
  for (const seg of segments) {
    const font = seg.bold ? calibriBold : calibriRegular
    page.drawText(seg.text, { x: cursorX, y: cursorY, size, font, color: black })
    cursorX += font.widthOfTextAtSize(seg.text, size)
  }
  ```

  Detta är BARA x-positionering på EN rad — det säger inget om
  RADBRYTNING (nästa punkt), som denna kod ännu inte hanterar.
- **Tvåkolumnslistan.** `pdf-lib` har **ingen** inbyggd radbrytning —
  `drawText` tar en sträng och ritar den rakt av, utan `maxWidth`. Två
  fasta x-koordinater räcker EJ ensamt: varje listrad i den verkliga
  bekräftelsebilagan har olika längd och måste radbrytas för att inte
  rinna ut ur sin kolumn (synligt i renderingen: "- Meditation: Kraftfältet
  Plus 30min" är en rad, men flera poster i högerkolumnen är längre). Att
  reproducera detta korrekt kräver en egen ord-för-ord-radbrytningsfunktion
  byggd ovanpå `widthOfTextAtSize()` — samma kod som föregående punkt,
  men nu upprepad per kolumn OCH kombinerad med den tredje accentfärgen
  (disk-verifierat `#548235`, se nedan) på vissa poster. Detta är,
  disk-mätt mot den faktiska filen, den **mest kodintensiva** enskilda
  komponenten av hela dokumentet.
- **Gult överstryk bakom text.** Trivialt: en `drawRectangle` med
  `color: rgb(1, 1, 0)` ritad FÖRE textanropet i samma z-ordning. Ingen ny
  research krävs — API:t är redan citerat.
- **Inbäddad TTF via `embedFont` + `fontkit`.** `pdf-lib.js.org`s eget
  exempel, verbatim:

  ```js
  import fontkit from '@pdf-lib/fontkit'
  pdfDoc.registerFontkit(fontkit)
  const customFont = await pdfDoc.embedFont(fontBytes)
  ```

  Trivialt att koppla in — men kräver en licensklar TTF (§ 4).

### 2.2 Exakta färger, disk-verifierade i detta pass (bekräftelsebilagan)

`pdftocairo -svg` → `fill=`/`stroke=`-attribut, omräknat till hex:

| Färg | Hex | Källa i dokumentet |
|---|---|---|
| Svart | `#000000` | all brödtext |
| Hyperlänk-blå | `#0563C1` | `lotta@outsidereality.se`-länken (Words standardblå — matchar 17-augusti-fyndet exakt) |
| Accent-blå | `#4472C4` | Office "Accent 1" |
| Mörkblå ram | `#2F5597` | den stora rundade ytterramen (Office "Accent 1, Darker 25%") |
| **Tredje accentfärgen** (efterfrågad i uppdraget) | **`#548235`** | fetstilta meditationsnamn i tvåkolumnslistan — SAMMA grönt som loggans vågform (Office "Accent 6"-familjen) |

Inget av detta är en Miranon-specifik varumärkesfärg — samtliga är
Microsoft Office-standardvärden, samma slutsats 17-augusti-passet drog om
de andra dokumenten.

## 3. Domen

**Vad en branschledare skulle göra med exakt dessa två dokument:** rendera
dem som HTML/CSS mot en riktig layoutmotor — antingen en betald tjänst med
en print-kvalitets-motor (DocRaptor/Prince, som Shopify och Square redan
använder för just denna dokumentklass enligt leverantörens egen kundlista)
eller en självhostad container (Gotenberg, MIT-licens, bäddar in Chromium).
Ingen av de branschmönster som hittades i § 1 bygger sina fakturor/kvitton/
biljetter genom att handkoda koordinater — det är exakt vad varje CSS-
egenskap (border-radius, span-vis fetning/färg, flexbox-kolumner) finns för
att slippa.

**Vad som hindrar oss är INTE teknik och INTE kostnad — det är
`task-146`s tidigare beslut, fattat innan dokumenten var sedda.** Beslutets
egen ordalydelse: *"Externa HTML-till-PDF-tjänster avvisades som
förstahandsval — extra leverantörsberoende och ett nätverkshopp för ett
problem som redan är löst inom plattformen."* Den motiveringen vilade på
ett i sig korrekt men OFULLSTÄNDIGT faktum: `pdf-lib` KAN generera en PDF
med svensk text i Deno (`task-146.1`s runtime-bevis står kvar). Men
"redan löst" gällde bara den smala frågan — inte förmågan att reproducera
rundade ramar, mitt-i-mening-fetning eller en flerkolumns-lista utan att
skriva en egen layoutmotor för hand (§ 2 mäter exakt den kostnaden).
Roger & Lottas volym — tiotals till hundratals mail per event, inte
miljoner — gör dessutom "extra leverantörsberoende"-kostnaden försumbar i
kronor: DocRaptors billigaste betalplan (125 dokument/månad) kostar 15
USD; Gotenberg self-hosted (managed) ligger runt 11 USD/månad. Vad som
KVARSTÅR som en verklig, ej försumbar kostnad: en NY hemlighet (API-nyckel
eller tjänste-URL) och en NY felyta (tjänsten kan svara långsamt eller inte
alls — kräver samma typ av felhantering som redan finns för Resend-anropet).
Latensen för ett enskilt HTML→PDF-anrop kunde INTE beläggas med en konkret
siffra i detta pass (se § 5) — bara att mönstret genomgående är synkront,
inte async/kö-baserat, hos de granskade tjänsterna.

**Rekommendation (inte beslut) — två vägar, rangordnade:**

1. **Primär: riv `task-146`s "inget externt beroende"-linje SPECIFIKT för
   PDF-rendering** (lagrings-/adapterarkitekturen i övrigt är opåverkad —
   den frågan rör var BYTES:en hamnar, inte hur SIDAN ritas) och lägg en
   HTML/CSS-mall bakom ett `fetch()`-anrop till antingen Gotenberg
   (självhostad, full kontroll, ingen extern leverantörs SLA) eller
   DocRaptor (betald, Prince-motor, samma leverantör som Shopify/Square).
   Detta är branschmönstret, det är billigt vid vår volym, och det
   eliminerar HELA § 2:s handkodningskostnad eftersom CSS redan ger
   `border-radius`, span-vis fetning och flexbox-kolumner gratis.
2. **Alternativ, om Marcus vill hålla fast vid "inget externt beroende":**
   Satori + `resvg` (paketet `@vercel/og`, redan officiellt demonstrerat
   INUTI en Supabase Edge Function av Supabase själva, § 1.1 rad D) —
   samma CSS-fördelar, noll extern tjänst, till priset av att
   slutresultatet blir en rastrerad bild inbäddad i en `pdf-lib`-genererad
   A4-sida (via `embedPng`) i stället för sökbar/kopierbar text. Detta är
   INTE vad de granskade branschledarna faktiskt gör för denna
   dokumentklass (de vill ha en riktig textlager, inte en bild) — det är
   en genuin, källbelagd MELLANVÄG för den som prioriterar att aldrig
   lämna plattformen framför att matcha branschens fulla praxis.

**Om domen hade varit "behåll ren `pdf-lib`":** den dyraste enskilda delen,
mätt mot den faktiska filen, är den tvåkolumniga listan med blandad
fetning/färg och radbrytning (§ 2.1, sista punkten) — det är den enda
komponenten som kräver en egen textlayoutmotor byggd från grunden, snarare
än ett engångs-API-anrop.

**Vad ett byte till väg 1 (extern tjänst) skulle kräva som runtime-bevis,
samma disciplin som `task-146.1` redan etablerat:** ett skarpt anrop från en
Edge Function i staging till den valda tjänsten (Gotenberg eller
DocRaptor), som visar (a) att den returnerade PDF:en har SÖKBAR text och
korrekt svensk teckenkodning, (b) end-to-end-latens uppmätt, inte gissad,
(c) filstorlek inom Resends redan grundade 40 MB-tak
(`utskicks-bilage-arkitektur-2026-08-03.md`), och (d) ärligt felbeteende
när tjänsten svarar sent eller inte alls.

**Vad ett byte till väg 2 (Satori+resvg, edge-native) skulle kräva:**
biblioteket är `@vercel/og` (Deno-status: BEKRÄFTAD, Supabase egen
dokumentation kör det direkt i en Edge Function, § 1.1). Runtime-beviset
skulle behöva visa (a) en renderad PNG som matchar förlagans layout
sida-vid-sida (samma metod 17-augusti-passet redan föreslog), (b) att
PNG:n embeddas i en giltig, öppningsbar A4-PDF via `pdf-lib` inom
minnes-/CPU-taket, (c) att egen TTF (Carlito/Cavolini-alternativ) laddas
korrekt via Satoris `fonts`-option, och (d) filstorlek — ett eget
`pdftocairo -png -r 150`-referensrender av bekräftelsebilagan vägde i
detta pass **476 657 byte**, en rimlig proxy för vad en jämförbar
`resvg`-rendering skulle väga.

## 4. Fontfrågan — `Cavolini`, kort

**Kan inte falsifieras eller bekräftas fullt ut i denna sandlåda** —
`Cavolini` finns INTE installerat i något av de sökta typsnittskatalogerna
här (`/System/Library/Fonts`, `/Library/Fonts`, `~/Library/Fonts`), vilket
är väntat: den föregående pdffonts-läsningen (§ 2) läser typsnittsnamnet UR
den redan embeddade/subsettade PDF-filen — den kräver inte att fonten är
installerad lokalt för att se ATT den är embeddad. Att KONTROLLERA
inbäddnings-RÄTTIGHETEN (fsType-biten i fontfilen) kräver däremot att öppna
själva fontfilen i Font Book på en Mac som faktiskt har `Cavolini`
installerad — det kunde INTE göras i denna miljö.

**Apples egen licenstext, verbatim** (macOS Sequoia Software License
Agreement, § 1.E, hämtad direkt från `apple.com/legal/sla/docs/
macOSSequoia.pdf` och läst med `pdftotext`):

> *"E. Fonts. Subject to the terms and conditions of this License, you may
> use the fonts included with the Apple Software to display and print
> content while running the Apple Software; however, you may only embed
> fonts in content if that is permitted by the embedding restrictions
> accompanying the font in question. These embedding restrictions can be
> found in the Font Book/Preview/Show Font Info panel."*

Det betyder: Apple ger INGEN generell rätt att bädda in `Cavolini` i en
distribuerad PDF — rätten beror på fontens EGEN `fsType`-inbäddningsbit,
som Marcus (eller vem som helst med `Cavolini` installerat) måste
kontrollera manuellt: **Font Book → markera Cavolini → Arkiv → Visa
typsnittsinformation**, leta efter embedding-status
("Installerbar"/"Redigerbar"/"Endast förhandsgranskning"/"Begränsad"). Tills
den kontrollen är gjord är licensläget **öppet, inte klart** — samma
slutsats 17-augusti-passet redan drog, nu med den exakta lagtexten bakom.

**Tre fria alternativ med liknande rundad/lekfull handstils-känsla**
(samtliga SIL Open Font License via Google Fonts, ingen ytterligare
licensfråga):

1. **Caveat** — halvkursiv handstil, finns i Bold-vikt, visuellt närmast
   Cavolini-rubrikernas rundade, lite studsiga karaktär.
2. **Kalam** — handstilskänsla med tjockare streck, bra läsbarhet i
   rubrikstorlek.
3. **Patrick Hand** — mer "skolskrivstil"-rundad, mindre kursiv än de två
   ovan — ett tredje alternativ om Caveat/Kalam känns för informella för en
   utbildningsrubrik.

(`Calibri` → `Carlito` var redan klart per 17-augusti-passet — opåverkat
av detta pass.)

## 5. Vad jag INTE kunde belägga

- **Stripes, Eventbrites och Shopifys interna renderingsteknik** — ingen
  offentlig förstapartskälla hittades för någon av de tre (§ 1.3). Det
  som ÄR belagt är Shopifys/Squares kundrelation till DocRaptor, vilket är
  en indikation, inte ett bevis på vad respektive företags KÄRNPRODUKT gör.
- **Konkret latenssiffra för ett HTML→PDF-anrop** (Gotenberg eller
  DocRaptor) mot vår faktiska dokumentstorlek — ingen källa gav en mätt
  siffra, bara att mönstret är synkront. Måste mätas skarpt om väg 1 väljs.
- **Om Deno.Command/subprocess-spawning är tillåtet i Supabase Edge
  Runtime.** Irrelevant för slutsatsen (bundle-taket gör headless Chrome
  omöjligt oavsett, § 1.2) men lämnas uttryckligen obelagd snarare än
  gissad.
- **`Cavolini`s fsType-inbäddningsbit** — kräver Font Book på en maskin med
  fonten installerad, inte tillgängligt i denna sandlåda (§ 4).
- **`typst.ts`s Deno-stöd specifikt.** Undersöktes som en tredje möjlig
  edge-native väg (vektor-PDF, riktig text, ingen browser) men det
  officiella `README`:t (Myriad-Dreamin/typst.ts på GitHub) nämner
  uttryckligen browser och Node.js, INTE Deno — och en tredjeparts-blogg
  (`formepdf.com`, själv en Typst-baserad PDF-tjänsteleverantör, läst med
  motsvarande skepsis) hävdar edge-kompatibilitet utan att det kunde
  verifieras mot förstapartskällan. **Registreras som en öppen, oprövad
  tredje väg** — inte rekommenderad i § 3 eftersom den inte kunde
  bekräftas, men värd ett eget minimaltest om Marcus vill ha riktig
  (sökbar) text UTAN extern tjänst och UTAN Satoris rastrerings-avvägning.
- **`react-pdf`/`@react-pdf/renderer`s Deno-kompatibilitet.** Paketets egen
  `react-pdf.org/compatibility`-sida nämner Node.js 18/20/21 och (obekräftat
  av community) Bun — INTE Deno. Kan installeras via `deno add
  npm:@react-pdf/renderer` men ingen körd verifiering hittades. Utesluten
  ur § 3:s rekommendationer på grund av denna lucka, inte på grund av ett
  negativt fynd.

## Oväntade fynd utanför frågan

- De två filerna Marcus pekade ut i detta pass (`bekräftelsebilaga-exempel.pdf`,
  `deltagarinformation-exempel.pdf`) är PowerPoint-exporter, medan
  17-augusti-passets motsvarande filer var Word-brev. Roger/Lotta bygger
  alltså mallar i MINST två olika Office-verktyg — värt att veta om en
  framtida mall-editor ska täcka "allt de redan gör".
- Arbetsträdets gren bytte tre gånger under detta enda pass (§ Proveniens)
  — ren observation av delat-arbetsträd-mekaniken, inget agerat på.

## Källförteckning

- Supabase — Puppeteer/skärmdumpar i Edge Functions:
  <https://supabase.com/docs/guides/functions/examples/screenshots>
- Supabase — OG-bildgenerering (Satori/`@vercel/og` i en Edge Function):
  <https://supabase.com/docs/guides/functions/examples/og-image>
- Supabase — Edge Function bundle-storlekstak:
  <https://supabase.com/docs/guides/troubleshooting/edge-function-bundle-size-issues>
- Supabase — pdfkit `Deno.readFileSync is blocklisted`-ärendet:
  <https://github.com/supabase/supabase/issues/30378>
- Supabase community — PDF-generering från Edge Functions (obesvarad tråd):
  <https://github.com/orgs/supabase/discussions/38327>
- Doppio — Supabase-specifik HTML→PDF-integration:
  <https://doc.doppio.sh/common/quick-start-serverless/supabase>
- Vercel — OG Image Generation (Satori + resvg, Edge Runtime):
  <https://vercel.com/docs/og-image-generation>
- Vercel Satori — GitHub (CSS-subset, runtime-stöd):
  <https://github.com/vercel/satori>
- DocRaptor — egen webbplats (Prince-motor, kundlista):
  <https://docraptor.com/>
- PDF4.dev — jämförelse HTML→PDF-API:er 2026:
  <https://pdf4.dev/blog/best-pdf-generation-apis-2026-compared>
- Gotenberg — egen webbplats/dokumentation:
  <https://gotenberg.dev/> ·
  <https://gotenberg.dev/docs/getting-started/installation>
- PDFBolt — Puppeteer PDF-generering i Node.js:
  <https://pdfbolt.com/blog/generate-pdf-nodejs-puppeteer>
- OneUptime — serverless PDF-tjänst med Cloud Run + Puppeteer:
  <https://oneuptime.com/blog/post/2026-02-17-how-to-build-a-serverless-pdf-generation-service-using-cloud-run-and-puppeteer/view>
- react-pdf — kompatibilitetssida:
  <https://react-pdf.org/compatibility>
- typst.ts — GitHub:
  <https://github.com/Myriad-Dreamin/typst.ts>
- pdf-lib — officiell dokumentation (`drawSvgPath`, `embedFont`/`fontkit`,
  `drawRectangle`): <https://pdf-lib.js.org/>
- Apple — macOS Sequoia Software License Agreement (§ 1.E, Fonts):
  <https://www.apple.com/legal/sla/docs/macOSSequoia.pdf>
- Intern: `docs/research/utskicks-bilage-arkitektur-2026-08-03.md`
- Intern: `docs/research/dokumentmallarnas-forlagor-2026-08-17.md`
- Intern: `backlog/tasks/task-146` (PRD) och `task-146.1` (runtime-bevis)

---

Arbetsträdet bär vid avslut endast denna nya fil under `docs/research/` —
inget annat rört, inget stagat, inget committat.
