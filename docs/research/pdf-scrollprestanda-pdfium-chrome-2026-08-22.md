---
owner: marcus803
updated: 2026-08-22
review_by: 2026-11-22
status: stable
---

# Varför en 174 KB Prince-genererad PDF scrollar hackigt i Chromes inbyggda visare (2026-08-22)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> oisolerat i huvudkatalogens worktree `s108-bilagesparet`. Committar
> inget — filen är fristående och orörd i Git tills orkestreraren landar
> den.
>
> **Inventering FÖRE första sökningen:** `grep -rliE
> "scroll|hackig|lagg|jank|PDFium|pdfium"` över `docs/research/`,
> `docs/decisions/`, `tasks/lessons.md` och `tasks/sessions/` gav **noll
> träffar på klientsidans renderings-prestanda för en genererad PDF**.
> Fyra angränsande pass lästes i sin helhet och bekräftas INTE täcka
> frågan:
>
> - [`docraptor-minimaltest-2026-08-22.md`](docraptor-minimaltest-2026-08-22.md)
>   — mäter DocRaptors **serverlatens** (2,8–3,6 s motortid) och
>   filstorlek, aldrig klientens scroll-prestanda. Ger dock värdefull
>   grunddata som återanvänds nedan: embäddade typsnitt (Carlito×3,
>   ComicNeue-Bold, Selawik-Bold — exakt de fem `emb=yes`-posterna) och
>   filstorlekar 51–309 kB för de tre mallarna.
> - [`pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`](pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md)
>   — motiverar VILKEN motor (Prince/DocRaptor) som producerar PDF:en,
>   inte hur den renderade filen beter sig i en visare.
> - [`pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md`](pdf-bifoga-eller-lanka-branschmonster-2026-08-19.md)
>   — täcker leveransform (bifoga/länka), en annan fråga.
> - [`forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md`](forhandsgranskning-dokumentgenerering-branschmonster-2026-08-22.md)
>   — täcker VILKEN YTA (ny flik vs iframe) förhandsgranskningen ska
>   visas i, inte varför innehållet i den ytan scrollar ojämnt. Etablerar
>   dock att ny flik (Chromes fullskaliga PDF-visare) redan är det
>   konvergerade mönstret — vilket gör just PDFium-visarens
>   scroll-beteende till en direkt konsumtionsväg för Lotta, inte en
>   sidosak.
>
> [`ADR-119`](../decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md)
> § Konsekvenser flaggar redan *"latenssiffran för ett HTML→PDF-anrop är
> obelagd"* — men det är GENERERINGS-latens (server, engångskostnad per
> event), en annan axel än detta pass fråga (klientens
> scroll-rendering, varje gång Lotta öppnar filen). Ingen dubblering.
>
> **Kompletterande kodforensik, inte bara extern research:** eftersom
> frågan gäller en KONKRET fil kontrollerades den faktiska mallkällan
> (`docs/mallar/bilagor/bekraftelsebilaga.html` +
> `bilaga-delad.css`) mot disk. Bildmåtten (256×256 PNG, 383×624 JPEG)
> och antalet embäddade typsnitt (fem, matchar
> `docraptor-minimaltest`s `pdffonts`-utdata exakt) bekräftar att detta
> är samma dokumentfamilj som frågan beskriver — analysen nedan är
> alltså grundad i den FAKTISKA mallkällan, inte en generisk PDF.
>
> Alla externa källor hämtade **2026-08-22**; ingen version pinnad i
> förväg utöver den redan kända Prince 15.1 (ADR-119, `docraptor-
> minimaltest`s uppmätta `Producer "Prince 15.1"`).

## Kort svar

**Chromes PDF-visare (PDFium) rasteriserar om sidans objekt on-demand, i
löpande dirty-rects, varje gång ett nytt område av sidan blir synligt —
det finns ingen sidgenomgripande cache som "scroll" bara kan blitta
runt i.** Källkoden bekräftar att varje sidobjekt med en soft mask,
`blend`-läge annat än `Normal`, gruppalfa < 1 eller isolerad
transparensgrupp körs genom `ProcessTransparency`, som allokerar en
NY off-screen-bitmap, rar om objektet i den, och kompositerar in
resultatet — en dyr väg som upprepas per objekt, per repaint, alltså
potentiellt varje scrollframe om objektet ligger i den nyexponerade
randen. Det här är PDFiums (och därmed Chromes) mest belagda,
källkodsverifierade prestandaflaskhals.

**Den goda nyheten för just detta dokument:** kodforensiken visar att
INGEN av dessa dyra konstruktioner faktiskt förekommer i
`bekraftelsebilaga.html`/`bilaga-delad.css` — inget `mask`,
`clip-path`, `filter`, `mix-blend-mode` eller `opacity` någonstans i
CSS:en, och den enda konstruktion som HADE triggat en soft mask
(`box-shadow` med `rgba(...)`-alfa och blur på `.sida`) är EXPLICIT
avstängd i `@media print { .sida { box-shadow: none; } }` — och Prince
(bekräftat i egen dokumentation) liksom DocRaptor (bekräftat i egen
dokumentation) använder `print` som DEFAULT-medietyp om inget annat
anges, vilket vår pipeline inte gör. QR-koderna är dessutom inte
"tusen fyllda rutor" (frågans hypotes) utan radkomprimerade SVG-paths
på **213 respektive 170 sub-path-segment** — en etablerad,
prestandamedveten kodningsteknik, långt under de volymer PDFium-
communityn faktiskt rapporterar som problematiska (hundratusentals
linjer).

**Slutsatsen är därför att den mest sannolika förklaringen INTE ligger
i de klassiska "exotiska PDF-konstruktioner" som QR-vektorer eller
transparens** — de är, mätt mot den faktiska filen, sannolikt inte
skyldiga. Kvar står två overifierade men plausibla förklaringar:
(a) en miljöfaktor på Marcus dator (GPU-rasterisering av/på, se
Rekommendation), eller (b) något i textlagret/typsnitts-hanteringen
eller sidans grundgeometri som detta pass inte kunnat verifiera utan
att öppna den faktiska genererade PDF:ens innehållsström — se § Vad
jag inte kunde belägga.

## 1. PDFium/Chrome-specifikt — vilka konstruktioner är kända för att göra scroll/zoom långsamt

### 1.1 Transparens, soft masks och blend-lägen — den STARKAST belagda flaskhalsen

Primärkälla, PDFiums egen källkod
(`core/fpdfapi/render/cpdf_renderstatus.cpp`, hämtad 2026-08-22 via
`pdfium.googlesource.com`, `refs/heads/main`), funktionen
`CPDF_RenderStatus::ProcessTransparency`:

```cpp
bool CPDF_RenderStatus::ProcessTransparency(CPDF_PageObject* pPageObj,
                                            const CFX_Matrix& mtObj2Device) {
  const BlendMode blend_type = pPageObj->general_state().GetBlendType();
  RetainPtr<CPDF_Dictionary> pSMaskDict =
      pPageObj->mutable_general_state().GetMutableSoftMask();
  ...
  if (!pSMaskDict && group_alpha == 1.0f && blend_type == BlendMode::kNormal &&
      !bTextClip && !bGroupTransparent && initial_alpha == 1.0f) {
    return false;
  }
  ...
  FX_RECT rect = pPageObj->GetTransformedBBox(mtObj2Device);
  ...
  std::unique_ptr<CFX_RenderDevice> bitmap_device =
      CFX_RenderDevice::CreateForNewBitmapWithBackdrop(
          width, height, GetCompatibleArgbFormat(), std::move(backdrop));
  ...
  CPDF_RenderStatus bitmap_render(context_, bitmap_device.get());
  ...
```

Med andra ord: om ett sidobjekt har en soft mask (`/SMask`), ett
blend-läge skilt från `Normal`, en gruppalfa under 1, en isolerad
transparensgrupp, eller en text-klippbana — allokeras en HELT NY
bitmap i objektets bounding box, objektet renderas om rekursivt in i
den (en ny `CPDF_RenderStatus`), och resultatet kompositeras in. Detta
sker i `RenderSingleObject`, som anropas för VARJE objekt i
`RenderObjectList` — och `RenderObjectList` körs på nytt för varje
dirty-rect PDFium behöver fylla, alltså potentiellt varje scrollsteg
för objekt som ligger i den nyexponerade randen (verifierat via samma
källträd, `pdf/pdfium/pdfium_engine.cc`, funktionerna kring
`FPDF_RenderPageBitmap_Start`/`FPDF_RenderPage_Continue` — progressiv,
regionbaserad rendering, ingen hel-dokument-cache).

Community-rapporterna bekräftar effekten i praktiken. PDFium-buggtracker
(`Issue 723`, sammanfattat i sökresultat 2026-08-22 eftersom
`bugs.chromium.org`s Monorail-gränssnitt inte gick att hämta som
statisk text):

> "The implementation of CPDF_RenderStatus::ProcessTransparency
> immediately rasterizes all objects with transparency and then
> composes them with the background image. When there are many such
> objects, the rendering speed becomes very slow."

`pdfium-bugs`-gruppen, Issue 537 ("Performance of this pdf is bad",
hämtad 2026-08-22 via `groups.google.com/g/pdfium-bugs/c/HaauKs6Zxu0`):
ett dokument med "ett stort antal lager" tog ~35 sekunder att rendera
i release-läge, och en jämförelse mot Okular noterades explicit:
*"Okular also spends about 1 minute to fully render the PDF. However,
once it finishes rendering, the scrolling is fast."* — alltså en
konkret bekräftelse på att PROBLEMET är just att PDFium rar om vid
VARJE scroll snarare än att cacha en gång.

### 1.2 Renderingsbackend: AGG vs Skia

Samma buggtracker (Issue 1589, `groups.google.com/g/pdfium-bugs/c/
ECDqbMCwRjw`, hämtad 2026-08-22) dokumenterar ett separat, oberoende
fynd:

> "The slowdown is in AGG. Rendering with Skia is roughly 4 times
> faster."

PDFium har två parallella rasteriseringsbackender (AGG och Skia),
växlingsbara via `FPDF_InitLibraryWithConfig` (`FPDF_RENDERERTYPE_SKIA`
/ `FPDF_RENDERERTYPE_AGG`) och i Chrome styrbart via
företagspolicyn `PdfUseSkiaRendererEnabled`
(chromeenterprise.google, sidan renderas via JavaScript och gick inte
att hämta som statisk text — se § Vad jag inte kunde belägga för vilket
läge som är DEFAULT i en icke-hanterad Chrome-installation 2026-08-22).
Det går alltså INTE att utesluta att en del av observerad tröghet är en
ren backend-artefakt snarare än ett dokument-egenskap — men det är inte
något vi kan styra från PDF-genereringssidan.

### 1.3 Shading- och tiling-patterns

Samma sökning (`groups.google.com/g/pdfium/c/Y8u6YHQ7wfw`, "Rendering
this document is slow", community-tråd hämtad 2026-08-22) rapporterar:

> "A significant amount of time is spent on shading in some PDFs [...]
> other viewers like PDF.js render it fine."

och profileringen i samma tråd pekar mot
`CFX_ScanlineCompositor::CompositeRgbBitmapLine()` som hotspot — samma
kompositeringsväg `ProcessTransparency` slår in i. Tiling patterns med
extrema `XStep`/`YStep`-värden är en separat, dokumenterad brist
(`github.com/mozilla/pdf.js/issues/6496`, gäller pdf.js men beskriver
samma PDF-konstruktion) — irrelevant här: vår mall innehåller inga
`pattern`- eller `gradient`-konstruktioner alls (verifierat, se § 1.4).

### 1.4 Vad kodforensiken faktiskt hittade i VÅR mall

```text
$ grep -n -E "mask|clip-path|opacity|blend|filter|box-shadow|border-radius|overflow" \
    docs/mallar/bilagor/bilaga-delad.css
147:  box-shadow: 0 0 0.5mm rgba(0, 0, 0, 0.3);
180:    box-shadow: none;
196:  border-radius: 15.7mm;
278:  border-radius: 7mm;
285:  border-radius: 4.3mm;
458:  border-radius: 5.15mm;
```

Ingen `mask`, `clip-path`, `filter`, `mix-blend-mode` eller `opacity`
någonstans. Enda alfa+oskärpa-konstruktionen (`box-shadow` med
`rgba(0,0,0,0.3)` och 0,5 mm blur på `.sida`) släcks uttryckligen i
`@media print` (rad 180) — och Prince (`princexml.com/doc/css-media-
queries/`, hämtad 2026-08-22) bekräftar: *"Prince defaults to the media
type print."* DocRaptor (`docraptor.com/documentation/article/
8358342-media-queries`, hämtad 2026-08-22) bekräftar samma sak för sin
tjänst: *"By default, DocRaptor documents are rendered using the print
media type"* — och kan ändras via `prince_options[media]`, ett
API-fält som INTE förekommer någonstans i vår kod (verifierat: `grep
-rn "media\|prince_options" supabase/functions/test-docraptor-render/
index.ts scripts/docraptor-*.mjs` → 0 träffar). Slutsatsen —
box-shadowen finns aldrig i den genererade PDF:en — vilar alltså på
KÄLLKODSFAKTA (vår CSS) plus TVÅ oberoende förstapartskällor (Prince +
DocRaptor), men INTE på en direkt inspektion av en faktiskt genererad
PDF:s innehållsström (ingen sådan fanns kvar på disk för detta pass,
se § Vad jag inte kunde belägga).

`border-radius` förekommer på flera element, men ALDRIG kombinerat med
`overflow: hidden` runt en bild (verifierat: `grep -n overflow
bilaga-delad.css` → 0 träffar) — det är just den kombinationen som
tvingar fram en klippbana runt rasterinnehåll. De rundade hörnen här är
bara på tomma ramar/rutor (`border-radius` på en `<div>` med
`border`), vilket PDFium ritar som en vanlig fylld/streckad path utan
klippning.

## 2. Vektorkomplexitet — QR-koder och tröskelvärden

**Inget publicerat numeriskt tröskelvärde hittades** för när
path-antal börjar kosta märkbart (varken i PDFium-projektet, PDF.js-
projektet eller allmänna prestandaguider) — se § Vad jag inte kunde
belägga. Det kvalitativa mönstret är dock samstämmigt över flera
källor:

- Nutrient (tidigare PSPDFKit), tredjepartskälla,
  `nutrient.io/blog/what-contributes-to-slow-pdf-rendering/` (hämtad
  2026-08-22): *"a PDF floorplan made up of hundreds of thousands of
  little lines, where each line needs to be read from the content
  stream and rendered on the screen"* nämns som exempel på genuint
  dyrt vektorinnehåll, och: *"Vector graphics must render pixel-perfect
  [...] they cannot be rendered once and cache them — we have to
  render them for each zoom level."*
- Adobes egen Preflight/flattener-dokumentation (`helpx.adobe.com`,
  sekundärt refererad via sökresultat 2026-08-22) beskriver att
  extremt komplex vektorgrafik (typiskt fotorealistiska
  vektor-illustrationer eller gradient-nät, INTE enkla geometriska
  former) medvetet rastreras i prepress-flöden av prestandaskäl — men
  detta är en RIP/tryck-kontext, inte en webbläsar-scroll-kontext, och
  ingen sifferbaserad gräns anges.

**QR-koderna i vår faktiska mall, uppmätta direkt ur källfilen**
(`docs/mallar/bilagor/bekraftelsebilaga.html`, `qrcode`-npm-paketets
`type: 'svg'`-utdata, se `docs/mallar/bilagor/README.md` rad 125–139):

```text
path 0 (Instagram-QR, viewBox 29×29): 213 sub-path-segment (M+h-par)
path 1 (miranon.se-QR, viewBox 25×25): 170 sub-path-segment (M+h-par)
```

Detta är **radkomprimerad** SVG (soldair/node-qrcode-teknik): varje
sammanhängande vågrät sträng av mörka moduler blir EN
`M x y h <längd>`-sekvens i stället för ett separat `<rect>` per
modul. En naiv "en ruta per modul"-rendering av en 29×29-QR hade
kunnat ge upp till 841 separata fyllda rektanglar; den faktiska
tekniken landar på 213. **Frågans hypotes — "≈1000 fyllda rutor
styck" — är alltså för hög för DENNA kodningsteknik**, mätt direkt:
två QR-koder ger tillsammans ~380 path-segment, vilket ligger flera
storleksordningar under de "hundratusentals linjer" som PDFium-
communityn faktiskt flaggar som problematiska.

**Den vedertagna lösningen "rastrera QR-koder" är en etablerad
avvägning i branschen** (`vectosolve.com/blog/qr-code-vector-print-
quality`, tredjepartskälla, hämtad 2026-08-22) men motiveras där av
SKALBARHET/redigerbarhet-avvägningen, inte av ett mätt
prestandaproblem vid just detta path-antal. Ingen källa styrker att
~200 path-segment i en enkel svartvit SVG är en prestandarisk i sig.

## 3. Prince-specifikt — inställningar som påverkar renderingsprestandan

**`-prince-image-resolution` — bekräftat, matchar er egen mätning.**
Egen dokumentation (`princexml.com/doc/properties/prince-image-
resolution`, hämtad 2026-08-22): egenskapen styr vilken FYSISK storlek
en bild placeras med på sidan (`normal` = 96dpi, `auto` = bildens
egen metadata, eller ett explicit dpi-tal) — dokumentationen anger
INGENSTANS att pixel-data omsamplas. Er tidigare mätning (att
egenskapen inte nedsamplar pixlar) är alltså konsistent med hur
egenskapen är dokumenterad, inte bara en observation utan stöd.

**`-prince-image-magic` — en annan, delvis överlappande lösning.**
Denna CSS-egenskap (dokumenterad under Prince 11:s bildsektion, hämtad
via sökresultat 2026-08-22) STYR FILSTORLEK/kompression, inte
pixel-dimensioner: `recompress-jpeg(quality%)` komprimerar om JPEG-
bilder till angiven kvalitetsnivå, `convert-to-jpeg` konverterar
icke-JPEG-bilder till JPEG. Detta reducerar PDF:ens FILSTORLEK men
ändrar inte antalet PIXLAR PDFium måste avkoda/blitta — relevant för
nedladdningstid, sannolikt irrelevant för scroll-hackighet vid våra
redan små bildmått (256×256, 383×624).

**Transparens och PDF-profil.** Prince-forumet (`princexml.com/forum/
topic/1334/flatten-pdf-on-output`, hämtat 2026-08-22): *"Prince does
not support automatically flattening PDF files that contain
transparency at this time."* och Prince 15 lade till
`--fail-stripped-transparency` för att UPPTÄCKA (inte fixa) när en
vald PDF-profil (PDF/A, PDF/X utom X-4) tyst strippar transparens. Vi
sätter ingen PDF-profil (verifierat: ingen `--pdf-profile`/`PDF.profile`
i vår pipeline) — så detta är en icke-fråga för oss: standard-Prince-
output behåller live PDF-transparens (om sådan hade funnits, vilket den
enligt § 1.4 inte gör i vårt fall).

**SVG `<mask>` → PDF soft mask, den viktigaste enskilda Prince-
mekanismen för denna fråga.** Prince-forumet
(`princexml.com/forum/topic/4617/svg-pdf-unnecessary-incorrect-
rasterization-of-embedded`, hämtat 2026-08-22), Prince-utvecklaren
`wangp` citerad verbatim:

> "The SVG 'mask' property and `<mask>` elements corresponds to 'Soft
> Masks' in PDF, that's all."

Alltså: om vår SVG (loggan, globe-ikonen, eller QR-koderna) någonsin
skulle använda ett `<mask>`-element skulle Prince konvertera det till
en PDF soft mask — samma konstruktion `ProcessTransparency` (§ 1.1)
rasteriserar dyrt. Verifierat att INGET av våra SVG-element använder
`<mask>` (grep på `docs/mallar/bilagor/bekraftelsebilaga.html` gav
noll träffar på `<mask`). Samma tråd noterar en fix 2022-02-02 mot
onödig omrastrering av soft masks — irrelevant här eftersom vi inte
har några.

**`pdf-min-version`.** Ingen egen dokumentationssida hittades under
detta exakta namn under passets tidsram (se § Vad jag inte kunde
belägga) — profilrelaterade flaggor (`--pdf-profile`) hittades och
beskrivs ovan, men ett fristående `pdf-min-version`-CSS/CLI-namn
kunde inte beläggas eller vederläggas källbelagt.

## 4. Branschpraxis — Stripe, Fortnox, Xero, QuickBooks

**Inget publicerat tekniskt material hittades** från någon av dessa
leverantörer specifikt om PDF-SCROLLPRESTANDA i mottagarens
webbläsare. Sökningar mot Stripes engineering-blogg
(`stripe.com/blog/engineering`), Fortnox, Xero och QuickBooks gav
produktdokumentation om FUNKTIONER (mallar, förhandsgranskning — redan
täckt av `forhandsgranskning-dokumentgenerering-branschmonster-
2026-08-22.md`) men ingenting om hur de håller sina genererade PDF:er
renderingssnabba. Detta sägs rakt ut i stället för att spekuleras
fram: **EJ BELAGT**, ingen av de fyra leverantörerna.

Det enda indirekt relevanta fyndet: Stripes fakturaeditor delar
renderingsväg med den slutgiltiga PDF:en (redan dokumenterat i
`forhandsgranskning-...-2026-08-22.md` § 1) — det säger något om
KONSISTENS mellan förhandsgranskning och leverans, ingenting om
scroll-hastighet i mottagarens visare.

## 5. Alternativ visningsväg — Chromes inbyggda visare kontra PDF.js

**Blandad, inte entydig bild — och beroende av VILKEN typ av
komplexitet dokumentet har.** Flera tredjepartskällor (Syncfusion,
Apryse/PDFTron, Nutrient — samtliga PDF-SDK-leverantörer med
kommersiellt intresse i frågan, läs med den reservationen) hävdar att
PDFium generellt slår PDF.js på komplexa/obskyra PDF-konstruktioner:

> "The render quality of PDFium surpasses PDF.js on many documents,
> especially those that use obscure PDF features [...] A prototype
> using PDFium was much faster than a PDF.js-based viewer."
> (Syncfusion-blogginlägg, hämtat 2026-08-22 via sökresultat — ingen
> mätmetod eller siffra anges, ren påstående-nivå)

Detta talar EMOT hypotesen att byta till en PDF.js-baserad visare
skulle lösa scrollhackigheten — om PDFium redan är den snabbare motorn
för det mesta innehåll, är ett byte till PDF.js sannolikt en
FÖRSÄMRING, inte en förbättring, för just transparenstunga dokument.
Men för VÅR fil (som enligt § 1.4 sannolikt saknar de dyra
konstruktionerna) är skillnaden mellan motorerna sannolikt irrelevant
— ingen av dem har något att kämpa mot.

**Ingen kontrollerad, sifferbaserad jämförande mätning hittades**
mellan Chromes inbyggda PDFium-visare och PDF.js specifikt för
scrollprestanda på ett litet (< 1 MB), transaktionellt,
vektor+text-dokument av vår typ. Mozillas egen "How fast is PDF.js?"
(`hacks.mozilla.org/2014/05/how-fast-is-pdf-js/`, 2014, alltså över
tio år gammalt och sannolikt inaktuellt för nutida PDFium/PDF.js-
versioner) mäter INITIAL RENDERING-hastighet, inte scroll — fel
mätdimension för vår fråga även om källan vore färsk. **EJ BELAGT** för
den specifika, kvantifierade jämförelsen.

## Dom

Frågans premiss — att en 174 KB-fil med modest bildinnehåll och
subsettade typsnitt "borde" vara billig att scrolla — stämmer mot
PDFiums egen dokumenterade prestandamodell: FILSTORLEK korrelerar
INTE med scroll-kostnad. Det som korrelerar, källkodsbelagt, är
NÄRVARON av soft masks/blend-lägen/gruppalfa (`ProcessTransparency`,
§ 1.1) och extrema vektor-path-volymer (§ 2) — ingendera är, mätt
direkt mot den faktiska mallkällan, närvarande i
`bekraftelsebilaga.html`. QR-koderna (frågans starkaste misstänkta)
är radkomprimerade till ~200 segment styck, en storleksordning under
vad som faktiskt flaggas som problematiskt i PDFium-communityn, och
den enda alfa+oskärpa-konstruktionen i CSS:en (page-skuggan) är
avstängd i `print`-läge — vilket är DocRaptors och Princes bekräftade
default och den läge vår pipeline faktiskt kör i.

**Den mest sannolika förklaringen, given denna kodforensik, ligger
alltså UTANFÖR de "exotiska PDF-konstruktioner" frågan primärt
misstänkte.** Två kandidater kvarstår öppna och overifierade: en
miljöfaktor (Chromes rasteriseringsbackend/GPU-status på den specifika
maskinen, § 1.2) eller något i textlagret/sidgeometrin som bara syns
genom att faktiskt öppna den genererade PDF:ens innehållsström — vilket
detta pass inte hade en fil tillgänglig för att göra (se nedan).

## Vad jag inte kunde belägga

- **Inget publicerat numeriskt tröskelvärde** för när ett path-antal
  börjar kosta märkbart scroll-prestanda i PDFium eller PDF.js.
  Kvalitativa uttalanden ("hundratusentals linjer") hittades, ingen
  siffra i tusental eller en kurva.
- **PDFiums verkliga DEFAULT-renderingsbackend (AGG eller Skia) i en
  vanlig, ohanterad Chrome-installation 2026-08-22** kunde inte
  fastställas — `chromeenterprise.google/policies/pdf-use-skia-
  renderer-enabled/` renderas via JavaScript och gick inte att hämta
  som statisk text (två försök, WebFetch + curl). Policyn EXISTERAR
  (bekräftat via sökresultat) men dess default-tillstånd och om den
  fortfarande är relevant i senaste stabila Chrome kunde inte
  verifieras källbelagt.
- **Ingen inspektion av en faktiskt genererad PDF:s innehållsström.**
  Slutsatsen i § 1.4 (inga soft masks i den genererade filen) vilar på
  KÄLLKOD + dokumenterat default-beteende, inte på att faktiskt öppna
  en PDF och leta efter `/SMask`/`/Group /S /Transparency`/`gs`-
  operatorer. `test-results/docraptor/` (där `docraptor-minimaltest`
  sparade sina PDF:er) var tomt vid detta pass — artefakterna städades
  av en senare `npm run test:api`-körning, per det passets egen
  dokumentation. En körning av `npm run docraptor:minimaltest` följt
  av `qpdf --qdf --object-streams=disable` eller `mutool trace` på
  resultatet vore den definitiva verifieringen, men ligger utanför
  detta research-pass mandat (kräver staging-länk + secret).
  **Detta är den viktigaste enskilda luckan i detta pass.**
  Det unikt "modest" i just den mätning som VI har (docraptor-
  minimaltest: 51–309 kB) skiljer sig från frågans 174 kB — samma
  dokumentfamilj, men troligen inte byte-identisk fil, vilket är
  ytterligare ett skäl till att en färsk mätning mot den FAKTISKA filen
  vore starkare än denna kodforensik.
- **Ingen leverantör (Stripe/Fortnox/Xero/QuickBooks) publicerar
  något om PDF-scrollprestanda.** Se § 4 — ärligt tomt, inte gissat fram.
- **`pdf-min-version` som exakt Prince-egenskapsnamn** kunde varken
  beläggas eller vederläggas — hittades inte i de dokumentationssidor
  detta pass nådde inom sin tidsram.
- **Ingen kontrollerad, sifferbaserad Chrome-PDFium-vs-PDF.js-mätning**
  för dokument av vår typ och storlek. Endast icke-mätta
  påstående-nivå-källor (delvis från kommersiella PDF-SDK-leverantörer
  med eget intresse i jämförelsen).
- **Hårdvaruacceleration/GPU-status på Marcus specifika maskin** är
  inte undersökt i detta pass — det är en lokal miljöfråga, inte en
  dokumentfråga, och kräver ett test PÅ maskinen (se rekommendation).

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus avgör.**
Rangordnad efter (a) hur starkt varje post vilar på faktiskt belägg,
och (b) hur billig åtgärden är att pröva.

1. **Mät mot den FAKTISKA filen innan något ändras.** Kör `npm run
   docraptor:minimaltest` (eller motsvarande skarp generering) och
   inspektera resultatet med `qpdf --qdf --object-streams=disable
   in.pdf out.qdf` (sökbar text) eller `mutool trace`/`pdftk … dump_data`
   för att leta efter `/SMask`, `/Group << /S /Transparency >>` och
   `gs`-anrop med `/BM` (blend mode). Detta är den EXAKTA verifieringen
   § 1.4:s slutsats (ingen transparens i den genererade filen) i dag
   vilar på härledning, inte direkt inspektion — 15–20 minuters arbete
   som antingen BEKRÄFTAR att § 1.4 stämmer (då är denna kategori av
   fix uttömd) eller falsifierar den (då är det EXAKT vilket objekt som
   är boven, inte en gissning).
2. **Uteslut miljön som variabel, billigast först.** Öppna `chrome://gpu`
   på Marcus maskin och kontrollera om "Hardware accelerated" står
   grönt för "Rasterization"/"Video Decode". Testa sedan samma PDF med
   hårdvaruacceleration TEMPORÄRT avslagen
   (`chrome://settings/system` → "Använd grafikacceleration…") — flera
   oberoende community-källor (se § 5-angränsande sökning, ej
   primärkälla men samstämmig över flera oberoende trådar) pekar ut
   just detta som en vanlig, dokument-oberoende orsak till "alla PDF:er
   känns hackiga i Chrome." Om AV löser det är felet i miljön, inte i
   vår mall — och rätt åtgärd är en supportartikel till Lotta, inte en
   mallomskrivning.
3. **Om steg 1 FAKTISKT hittar en soft mask/blend-konstruktion:**
   sök reda på exakt vilket CSS-uttryck som orsakar den (troligast
   kandidat om något hittas: `box-shadow`-hanteringen om `@media print`
   av någon anledning INTE tillämpas i produktionsanropet — verifiera
   då `prince_options[media]` i den faktiska EF-koden, inte bara
   test-harnessen detta pass läste). Åtgärd: ta bort konstruktionen
   eller ersätt den med en förrastrerad `<img>` (samma princip som
   Prince självt föreslår för SVG-masker: `prince-filter-resolution`
   för att styra rastreringskvaliteten om masken måste finnas kvar).
4. **QR-koderna kan sannolikt LÄMNAS SOM VEKTOR.** Mätt path-antal
   (170–213 segment styck) ligger flera storleksordningar under det
   PDFium-communityn faktiskt flaggar som dyrt. En förebyggande
   rastrering (QR som PNG i stället för SVG) skulle offra
   skärpa/skalbarhet för en prestandavinst som inget hittat belägg
   stödjer att den faktiskt behövs. **Gör inte detta byte utan att
   steg 1 först visar att QR-objekten specifikt är inblandade.**
5. **Om steg 1–2 inte hittar någon förklaring:** nästa steg är en
   Chrome DevTools Performance-trace (`chrome://inspect` eller
   DevTools Performance-panelen) TAGEN UNDER en scroll av den faktiska
   PDF-fliken — den visar exakt vilken fas (Rasterize, Composite,
   Paint) som dominerar frame-tiden, vilket avgör om nästa steg är ett
   PDFium-spårat problem alls eller något i Chrome-fönstrets egen
   compositing (t.ex. en `blob:`-URL som triggar en extra kopiering).
   Detta pass har inte kunnat köra ett sådant trace (kräver interaktiv
   Chrome-session mot en riktig, öppen PDF-flik) — se § Vad jag inte
   kunde belägga.

## Källförteckning

### Primärkällor

- PDFium källkod — `CPDF_RenderStatus::ProcessTransparency`,
  `core/fpdfapi/render/cpdf_renderstatus.cpp`, `refs/heads/main`:
  <https://pdfium.googlesource.com/pdfium/+/refs/heads/main/core/fpdfapi/render/cpdf_renderstatus.cpp>
  (hämtad 2026-08-22, verifierad rad-för-rad via `curl … ?format=TEXT`
  och `base64 -D`)
- Chromium `pdf/paint_manager.cc` (scroll-blit-optimering,
  `ScrollCanvas`):
  <https://raw.githubusercontent.com/chromium/chromium/main/pdf/paint_manager.cc>
  (hämtad 2026-08-22)
- Chromium `pdf/pdfium/pdfium_engine.cc` (progressiv, dirty-rect-
  baserad rendering, `FPDF_RenderPageBitmap_Start`/
  `FPDF_RenderPage_Continue`):
  <https://raw.githubusercontent.com/chromium/chromium/main/pdf/pdfium/pdfium_engine.cc>
  (hämtad 2026-08-22)
- Prince — CSS Media Queries (default `print`):
  <https://www.princexml.com/doc/css-media-queries/> (hämtad 2026-08-22)
- Prince — `-prince-image-resolution`-egenskapen:
  <https://princexml.com/doc/properties/prince-image-resolution>
  (hämtad 2026-08-22)
- Prince — Prince Output (PDF-profiler, transparens, typsnittsinbäddning):
  <https://www.princexml.com/doc/14/prince-output/> (hämtad 2026-08-22)
- Prince-forum — flatten PDF/transparens ej auto-flattenad:
  <https://www.princexml.com/forum/topic/1334/flatten-pdf-on-output>
  (hämtad 2026-08-22)
- Prince-forum — SVG `<mask>` → PDF soft mask, Prince-utvecklare
  `wangp` citerad:
  <https://www.princexml.com/forum/topic/4617/svg-pdf-unnecessary-incorrect-rasterization-of-embedded>
  (hämtad 2026-08-22)
- DocRaptor — Media Queries-dokumentation (default `print`,
  `prince_options[media]`):
  <https://docraptor.com/documentation/article/8358342-media-queries>
  (hämtad 2026-08-22)
- `qrcode`-npm-paketet (soldair/node-qrcode), refererat via
  `docs/mallar/bilagor/README.md` § QR-koderna (intern källa för
  vilken generator + inställningar som producerade SVG-utdatan).

### Community-/sekundärkällor (tydligt märkta som sådana)

- PDFium-buggtracker, Issue 723 (transparens/rastrering) — nåddes
  endast som websearch-sammanfattning, Monorail-gränssnittet gick
  inte att hämta statiskt:
  <https://bugs.chromium.org/p/pdfium/issues/detail?id=723> (försökt
  2026-08-22)
- `pdfium-bugs`-gruppen, Issue 537 ("Performance of this pdf is bad"):
  <https://groups.google.com/g/pdfium-bugs/c/HaauKs6Zxu0> (hämtad
  2026-08-22)
- `pdfium-bugs`-gruppen, Issue 1589 (AGG vs Skia, 4× skillnad):
  <https://groups.google.com/g/pdfium-bugs/c/ECDqbMCwRjw> (hämtad
  2026-08-22)
- `pdfium`-gruppen — "Rendering this document is slow" (shading-
  prestanda, profileringshotspot):
  <https://groups.google.com/g/pdfium/c/Y8u6YHQ7wfw> (hämtad 2026-08-22)
- Chrome Enterprise — `PdfUseSkiaRendererEnabled`-policyn (existens
  bekräftad via sökresultat, sidans fulltext ej hämtningsbar statiskt):
  <https://chromeenterprise.google/policies/pdf-use-skia-renderer-enabled/>
  (försökt 2026-08-22)
- Nutrient (fd. PSPDFKit) — "What Contributes to Slow PDF Rendering?":
  <https://www.nutrient.io/blog/what-contributes-to-slow-pdf-rendering/>
  (hämtad 2026-08-22, kommersiell PDF-SDK-leverantör — läs med den
  reservationen)
- Syncfusion — "PDF Rendering Engines Compared" (PDFium vs PDF.js,
  påstående-nivå, ingen mätmetod angiven):
  <https://www.syncfusion.com/blogs/post/pdf-rendering-engines-comparison>
  (hämtad 2026-08-22, kommersiell PDF-SDK-leverantör)
- Mozilla Hacks — "How fast is PDF.js?" (2014, mäter initial rendering
  inte scroll, sannolikt inaktuell version):
  <https://hacks.mozilla.org/2014/05/how-fast-is-pdf-js/> (refererad
  via sökresultat 2026-08-22, ej djupfetchad pga ålder/relevans)
- vectosolve.com — QR-kod vektor-vs-raster för utskrift (annan
  avvägning: skalbarhet, inte scrollprestanda):
  <https://vectosolve.com/blog/qr-code-vector-print-quality> (refererad
  via sökresultat 2026-08-22)
- Adobe Acrobat — transparency flattening/RIP-rastrering av komplex
  vektorgrafik (prepress-kontext, inte webbläsar-scroll):
  <https://helpx.adobe.com/acrobat/using/transparency-flattening-acrobat-pro.html>
  (refererad via sökresultat 2026-08-22, ej djupfetchad)

### Interna källor (repot, kodforensik för detta pass)

- `docs/mallar/bilagor/bekraftelsebilaga.html` — QR-SVG-path-strängarna
  mätta direkt (rad 143–144, 156–157).
- `docs/mallar/bilagor/bilaga-delad.css` — fullständig grep av
  `mask|clip-path|opacity|blend|filter|box-shadow|border-radius|overflow`
  (rad 147, 180, 196, 278, 285, 458) samt `@font-face`-blocken (rad
  22–90-ish, sex deklarationer).
- `docs/mallar/bilagor/README.md` § "QR genererad ur URL-strängen" —
  `qrcode`-npm-paketets exakta anropssignatur
  (`type: 'svg', errorCorrectionLevel: 'M'`).
- `public/instagram-glyf-gradient.png` (256×256, `sips` verifierad,
  ingen alfakanal) och `public/utanfor-verkligheten-omslag.jpeg`
  (383×624, `sips` verifierad) — matchar frågans bildbeskrivning
  exakt.
- `docs/research/docraptor-minimaltest-2026-08-22.md` § Mättabellen —
  `pdffonts`-utdata (fem embäddade typsnitt, `emb=yes` för samtliga)
  som matchar frågans "5 subsettade TrueType-typsnitt".
- `supabase/functions/test-docraptor-render/index.ts`,
  `scripts/docraptor-minimaltest.mjs`,
  `scripts/docraptor-sjalvbarande.mjs` — grep-verifierat: inget
  `media`/`prince_options`-fält satt någonstans i pipelinen.
