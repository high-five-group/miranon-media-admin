---
owner: marcus803
updated: 2026-08-23
review_by: 2026-11-23
status: draft
---

# Bilagornas Prince-omgranskning — deltagarinformation + bekräftelsebilaga (2026-08-23)

> **Proveniens:** kortlöst mätpass, samma familj som
> `docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md` men för de
> ANDRA två bilage-mallarna (`deltagarinformation.html`,
> `bekraftelsebilaga.html`). Kört i egen worktree
> (`.claude/worktrees/s108-paus-docs`). **Modell:** exakt rad ur egen
> systemprompt — *"You are powered by the model named Sonnet 5. The exact
> model ID is claude-sonnet-5."*
>
> **Detta är ett MÄTPASS, ingen fix.** `docs/mallar/bilagor/bilaga-delad.css`,
> `bekraftelsebilaga.html` och `deltagarinformation.html` är ORÖRDA. Inga
> git-kommandon kördes. Alla intermediära artefakter (PDF:er, PNG:er,
> självbärande HTML) ligger i scratchpad, inte i repot.

## Kort svar

**`bilaga-delad.css` innehåller INGET `display: grid`** — till skillnad från
kvittots tre trasiga grid-ställen finns här bara TRE flex-`gap`-primitiv, och
alla tre är instängda i `bekraftelsebilaga.html`s markup;
`deltagarinformation.html` använder INGEN av dem (ingen `.innehallslistor`,
`.sidfot` eller `.ikonruta-media` i det dokumentets DOM). Av de tre:

1. **`.innehallslistor`** (`gap: 0`) — kolumn-runs är BYTE-IDENTISKA mellan
   Chrome och Prince ner till pixeln. Trivialt IDENTISKT, eftersom värdet
   redan är noll.
2. **`.sidfot`** (`gap: 6mm` + `justify-content: space-between`, den
   dokumenterade Prince-kompensationen) — mätningen visar **IDENTISKA**
   mellanrum i båda motorerna (19,98 mm och 20,15 mm, båda vägar, ingen
   mätbar avvikelse). Kompensationen fungerar exakt som avsett.
3. **`.ikonruta-media`** (`gap: 4.5mm` + `margin-right: 4.5mm` på
   förstabarnet, den andra dokumenterade Prince-kompensationen) —
   **KOMPENSATIONEN GER INTE SAMMA RESULTAT.** Chrome visar ~8,8–9,1 mm
   mellanrum mellan ikon och QR (gap OCH margin adderas — flexbox-`gap` och
   `margin` på samma barn är inte alternativ, de SUMMERAS), medan Prince
   visar ~4,4–4,6 mm (endast marginalen, eftersom Prince ignorerar
   flex-`gap`). Webbläsarvyn visar alltså UNGEFÄR DUBBELT så stort mellanrum
   som PDF:en — precis den typ av tyst glidning kommentaren i CSS-filen
   ("Båda sätts till samma värde så de två vyerna inte glider isär") avsåg
   att förhindra, men som den mätta verkligheten visar INTE förhindras.
   Bieffekt: det för-breda flex-blocket (48 mm i Chrome mot 43,5 mm
   tillgänglig plats) centreras av `.ikonruta-ram`s `align-items: center`
   och tränger därför in i padding-zonen symmetriskt på båda sidor i Chrome
   (padding krymper till ~0,5–1,4 mm mot Princes ~2,7–2,9 mm, nära det
   specade 3 mm-värdet).

**Utöver gap/grid-frågan renderas båda dokumenten i övrigt visuellt
identiskt** — samma sidstorlek (A4, 1 sida), samma typsnittsfall
(Comic Neue-fallbacken, Selawik, Carlito), samma radbrytningar, samma
bildskalning (ikoner, QR, bokomslag, logga). Enda observerade skillnader
utanför gap-frågan är kända, förväntade artefakter (DocRaptor-vattenstämpel,
svag antialiasing-kantfärgning på loggan) — se § Övriga avvikelser.

## Metod

Identisk pipeline som kvitto-passet (`docs/research/
kvitto-prince-gap-grid-omgranskning-2026-08-22.md` § Metod), applicerad på
de två andra mallarna:

1. **Fylld variant** av båda mallarna byggd med det redan befintliga
   granskningsverktyget:

   ```bash
   node scripts/render-bilage-mall.mjs bekraftelsebilaga
   node scripts/render-bilage-mall.mjs deltagarinformation
   ```

   Fixturerna `docs/mallar/bilagor/fixtures/bekraftelsebilaga.exempel.json`
   och `deltagarinformation.exempel.json` (redan i repot, samma värden som
   i de riktiga förlagorna) användes oförändrade. Ingen ofylld token kvar i
   någon av utdatafilerna (verifierat, skriptets egen varningsrad tyst i
   båda körningarna).

2. **Självbärande HTML** byggd med den REDAN TESTADE, oförändrade
   repo-modulen `scripts/docraptor-sjalvbarande.mjs` (`gorSjalvbarande()`),
   importerad från en liten driver-kopia i scratchpad (identisk princip som
   kvitto-passets `build-selfcontained.mjs`, parametriserad på mallnamn i
   stället för hårdkodad).

   **Samma kända fälla som kvitto-passet, neutraliserad på samma sätt:**
   `bilaga-delad.css`s `@font-face`-block för Cavolini-Bold pekar på
   `./lokala-typsnitt/Cavolini-Bold.ttf`, en git-ignorerad symlänk som INTE
   finns i denna worktree (`ls docs/mallar/bilagor/lokala-typsnitt` →
   "No such file or directory", verifierat). `gorSjalvbarande()` lämnar en
   sådan ohämtbar `url()`-referens ORÖRD (fail-safe), vilket DocRaptor
   fäller med HTTP 422 ("File system access is not allowed") om den lämnas.
   Referensen ersattes för hand med `local("")` i BÅDA de genererade
   scratchpad-filerna (`bekraftelsebilaga.sjalvbarande.html`,
   `deltagarinformation.sjalvbarande.html`), inte i någon produktionsfil —
   verifierat att exakt EN förekomst per fil neutraliserades och att inga
   andra icke-`data:`-`url()`-referenser fanns kvar (`grep -oE
   'url\([^)]*\)' … | grep -v '^url("data:'` → endast Cavolini-raden, i
   båda filerna, före neutralisering).

3. **Prince-rendering** via `POST /functions/v1/test-docraptor-render`
   (staging, `pqtshyierkdgwdnxuirz`), inloggad som `staging-user@miranon.test`.
   Body-kontraktet är oförändrat sedan kvitto-passet — `{ html, namn }`,
   svar som rena PDF-bytes (verifierat mot `supabase/functions/
   test-docraptor-render/index.ts`, disk-läst i sin helhet inför detta pass:
   INGET `leverans`-fält existerar i denna funktion, så default-beteendet
   "bytes" användes oförändrat, precis som kvitto-passet redan gjorde).

   | | Bekräftelsebilaga | Deltagarinformation |
   |---|---|---|
   | HTTP-status | 200 | 200 |
   | `content-type` | `application/pdf` | `application/pdf` |
   | `x-docraptor-ms` | 3036,2 | 2991,8 |
   | `x-pdf-bytes` | 149 628 | 68 368 |
   | `x-docraptor-test-mode` | `true` | `true` |

4. **Chrome-rendering** av EXAKT SAMMA självbärande HTML-filer, headless:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --no-pdf-header-footer \
     --print-to-pdf=<ut>.pdf "file://…/<mall>.sjalvbarande.html"
   ```

   Chrome 151.0.7922.170 (samma major-version som kvitto-passet).
   `pdfinfo` bekräftar A4, 1 sida, i samtliga fyra PDF:er:

   | | Chrome | Prince |
   |---|---|---|
   | Producer | Skia/PDF m151 | Prince 15.1 |
   | Sidstorlek (båda mallarna) | 594,96 × 841,92 pt (A4) | 595,276 × 841,89 pt (A4) |
   | Sidor (båda mallarna) | 1 | 1 |
   | Bekräftelsebilaga, filstorlek | 163 401 bytes | 149 628 bytes |
   | Deltagarinformation, filstorlek | 65 526 bytes | 68 368 bytes |

   Skillnaden i sidstorlek är sub-punkts avrundning (samma mönster som
   kvitto-passet), inte en marginal-avvikelse — `@page{margin:0}` honoreras
   i alla fyra PDF:er.

5. **Rastrering** med `pdftoppm -r 150 -png` (poppler,
   `/usr/local/bin/pdftoppm`) → 1240×1754 px (Chrome) respektive
   1241×1754 px (Prince) för båda mallarna — samma 1 px sub-punkts-skillnad
   som kvitto-passet, inte en reell storleksskillnad.

6. **Sida-vid-sida + diff** byggda med `sharp` (redan projekt-dependency,
   nås via en read-only-symlänk till huvudkatalogens `node_modules/sharp`
   och `node_modules/@img` i scratchpad, eftersom denna worktree saknar
   `sharp` i sitt eget `node_modules` — ingen skrivning mot huvudkatalogen,
   bara modul-läsning, samma princip som `.env.test`-läsningen nedan).
   `composite({blend:'difference'})` + `normalise()`, samma metod som
   kvitto-passet.

7. **Per-ställe-mätning** med samma `analys.mjs`-verktyg som kvitto-passet
   (`detectRowBands`/`detectColumnRuns`, luminans-tröskel 200,
   150 dpi → 1 px = 0,169 mm). Y-banden för `.ikonruta-media`-mätningen
   valdes SNÄVT (t.ex. y=1520–1600) för att INTE korsa boxens horisontella
   ram-linjer — en bredare y-band (som fungerade för `.sidfot`s
   helsidesmätning) slår annars ihop hela ikonrutans bredd till en enda
   sammanhängande "bläck"-körning, eftersom en horisontell ramlinje som
   korsar HELA boxens bredd gör varje kolumn i intervallet "bläck" minst en
   gång. Verifierat genom att första försöket (bredare y-band) gav exakt
   detta artefaktbeteende (`.ikonruta-media`s inre gap doldes helt) innan
   bandet smalnades.

   Varje mätpunkt verifierad genom BÅDE den numeriska kolumn-scanningen
   OCH en beskuren bild läst visuellt (`Read`-verktyget) — se
   `crop-chrome-ikon-zoom.png`/`crop-prince-ikon-zoom.png` och
   `crop-chrome-footer.png`/`crop-prince-footer.png` i scratchpad.

**Autentiseringskällan:** `.env.test` saknas i denna worktree
(`ls .env.test` → "No such file or directory"); credentials lästes via
`Read`-verktyget mot huvudkatalogens kopia
(`/Users/marcus/Repon/miranon-media-admin/.env.test`), enligt uppdragets
egen anvisning, och kopierades till en scratchpad-lokal `.env.local-secrets`
— aldrig till någon repo-fil.

## Layoutprimitiverna i `bilaga-delad.css` — fullständig genomsökning

`grep -n "display: grid\|display: flex\|gap:"` gav **NOLL träffar på
`display: grid`** i hela filen (519 rader). Ingen mallspecifik CSS finns för
dessa två mallar (`kvitto.css` är kvittots egen, uttryckligen frikopplad —
se `docs/mallar/bilagor/README.md`). De tre flex-`gap`-primitiven, samtliga
radnummer disk-verifierade:

| # | Selektor | Rader | Primitiv | Används i |
|---|---|---|---|---|
| 1 | `.innehallslistor` | 354–356 | `display: flex; gap: 0;` | Endast `bekraftelsebilaga.html` |
| 2 | `.sidfot` | 440–445 | `display: flex; justify-content: space-between; align-items: center; gap: 6mm; margin-top: auto;` | Endast `bekraftelsebilaga.html` |
| 3 | `.ikonruta-media` (+ `:first-child`-kompensation) | 490–492, 496–497 | `display: flex; gap: 4.5mm;` samt `margin-right: 4.5mm` på förstabarnet | Endast `bekraftelsebilaga.html` (två instanser: Instagram-rutan och globe-rutan) |

**`deltagarinformation.html` har NOLL av dessa selektorer i sin markup**
(grep av HTML-filen mot `innehallslistor|sidfot|ikonruta` → inga träffar).
Dokumentet är ett rent flödesdokument (rubrik, inforuta, löpande stycken)
utan flex/grid-layout alls utöver `.sida--bekraftelse`s (som INTE gäller
här — deltagarinformationen använder `.sida--deltagarinformation`, som
saknar `display` helt och förblir ett vanligt blockflöde).

## Mättabellen

### Bekräftelsebilagan — de tre ställena

| # | Ställe (rad) | Spec | Chrome uppmätt | Prince uppmätt | Avvikelse | Klass |
|---|---|---|---|---|---|---|
| 1 | `.innehallslistor` (354–356) | `gap: 0` | Kolumn-runs 100 % identiska (se detaljtabell nedan) | Samma, byte-för-byte | 0 mm, 0 px | **IDENTISKT** |
| 2 | `.sidfot` (440–445) | `gap: 6mm` + `space-between` (Prince-kompensation) | Box1→omslag: 19,98 mm. Omslag→box2: 20,15 mm | Box1→omslag: 19,98 mm. Omslag→box2: 20,15 mm | 0,00 mm (identiska segmentgränser, ±1 px sub-punkts brus på ett enskilt inre delsegment) | **IDENTISKT** |
| 3 | `.ikonruta-media` (490–492, 496–497) | `gap: 4.5mm` OCH `margin-right: 4.5mm` (avsett att vara SAMMA värde i båda vyer) | Box1 (Instagram): 8,81 mm. Box2 (globe): 9,14 mm | Box1: 4,40 mm. Box2: 4,57 mm | Chrome ≈ 2× Prince (+4,3 till +4,6 mm, ≈ 96–104 % relativ skillnad) | **AVVIKER** (kompensationen ger INTE samma resultat) |

**Ställe #1, detaljtabell (rubrikraden "Innehåll, Dag Ett"/"Innehåll, Dag
Två", y=1081–1130, x=100–1150):** samtliga 27 kolumn-segment (bläck och
mellanrum om vartannat) har EXAKT samma start-/slutpixel i Chrome och
Prince — verifierat genom att jämföra hela `detectColumnRuns`-utdatan
rad för rad, ingen enda avvikelse.

**Ställe #2, detaljmätning (helsidesscan y=1483–1668, x=0–1240/1241):**

| Segment | Chrome | Prince |
|---|---|---|
| Vänster sidmarginal | 8,13 mm | 8,13 mm |
| Yttre ramens vänsterkant (border) | 2,71 mm | 2,54 mm |
| Padding till ikonruta 1 | 12,87 mm | 13,04 mm |
| **Ikonruta 1 (hel bredd, spec 51,1 mm)** | 51,14 mm | 51,14 mm |
| **Gap: ikonruta 1 → bokomslag** | **19,98 mm** | **19,98 mm** |
| Bokomslag (två delsegment pga intern bildkontrast) | 18,97 + 1,02 mm | 18,97 + 1,02 mm |
| **Gap: bokomslag → ikonruta 2** | **20,15 mm** | **20,15 mm** |
| **Ikonruta 2 (hel bredd, spec 51,1 mm)** | 51,14 mm | 51,31 mm |
| Padding + yttre ram höger + marginal | 13,04 + 2,54 + 8,13 mm | 12,87 + 2,71 + 8,13 mm |

Beräknad förväntad `space-between`-fördelning (162,6 mm innehållsyta minus
124,3 mm faktiskt innehåll, fördelat över 2 mellanrum) = **19,15 mm** —
mätvärdena (19,98/20,15 mm) ligger nära detta, med samma lilla avvikelse i
BÅDA motorerna, vilket bekräftar att `justify-content: space-between`
dominerar över det specade `gap: 6mm` (fritt utrymme > gap-golvet) i båda
renderarna identiskt.

**Ställe #3, detaljmätning (snävt band y=1520–1600, undviker
horisontella ramlinjer):**

| | Chrome (box1) | Prince (box1) | Chrome (box2) | Prince (box2) |
|---|---|---|---|---|
| Padding före ikon | 0,17 mm | 2,71 mm | 0,68 mm | 2,88 mm |
| Ikon-bredd | 19,81 mm | 19,64 mm | 19,47 mm | 19,47 mm |
| **Gap ikon→QR** | **8,81 mm** | **4,40 mm** | **9,14 mm** | **4,57 mm** |
| QR-bredd | 19,47 mm | 19,47 mm | 19,30 mm | 19,47 mm |
| Padding efter QR | 0,68 mm | 2,88 mm | 0,51 mm | 2,71 mm |

**Mekanismen bakom avvikelsen (verifierad, inte gissad):** Chromes
uppmätta gap (8,81/9,14 mm) ligger nära summan av CSS-`gap`(4,5 mm) +
`margin-right`(4,5 mm) = 9,0 mm — flexbox-specifikationen säger uttryckligen
att `gap` och en items egen `margin` är ADDITIVA, inte alternativ. Princes
uppmätta gap (4,40/4,57 mm) ligger nära ENBART `margin-right`-värdet
(4,5 mm), konsekvent med att Prince ignorerar flex-`gap` helt (samma
etablerade fynd som kvitto-passets fyra-fallstest). Det för-breda
flex-blocket (48 mm i Chrome: 19,5+4,5+4,5+19,5) mot den tillgängliga
innehållsytan i `.ikonruta-ram` (≈43,5 mm: 51,1 mm boxbredd minus 2×
border minus 2×3 mm padding) centreras av `.ikonruta-ram`s
`align-items: center`, vilket förklarar varför padding-zonen krymper
symmetriskt till nära noll i Chrome (0,17–0,68 mm) men förblir nära det
specade 3 mm-värdet i Prince (2,71–2,88 mm).

### Deltagarinformationen — inga primitiv att mäta

Mättabellen för `deltagarinformation.html` är TOM, eftersom dokumentets
markup inte innehåller någon av de tre klasserna ovan (se § Layoutprimitiverna).
Visuell + diff-granskning (sida-vid-sida, `composite difference + normalise`)
visar identisk sidstruktur, identiska radbrytningar i samtliga tio
ämnesstycken, identisk position för `.overstrykning`-gula highlighten (den
enda inline-bakgrundsfärgen i dokumentet), och identisk sidbrytning
(1 sida i båda motorerna, ingen spill).

## Övriga avvikelser (utanför gap/grid-frågan, bokförda separat)

- **DocRaptor-vattenstämpeln** ("TEST DOCUMENT"-banderoller längst upp och
  ned) syns i BÅDA Prince-renderingarna, som väntat för testnyckeln — samma
  läge som kvitto-passet, försvinner med ett skarpt DocRaptor-konto.
- **Loggan (`MiranonMedia`-ordmärket, SVG) visar samma svaga
  färgkanals-förskjutning i diff-bilden** som kvitto-passet observerade
  (röd/grön-kant runt vågformen), i BÅDA mallarna. Samma oklassificerade
  observation som förra passet — inte undersökt vidare, kan vara
  antialiasing-/färghanteringsskillnad mellan Skia och Prince snarare än
  en reell defekt.
- **`.overstrykning`-highlighten i deltagarinformationen** visar en tunn
  färgad kant i diff-bilden längs sin nederkant. Crop-jämförelse
  (`crop-chrome-highlight2.png` mot `crop-prince-highlight2.png`, läst
  visuellt) visar INGEN synlig skillnad — sannolikt samma sub-pixel
  antialiasing-brus som loggan, inte en strukturell avvikelse. Bokförs som
  observation, inte klassificerad.
- **`scripts/docraptor-sjalvbarande.mjs` saknar fortfarande
  `local("")`-fixen** för ohämtbara `url()`-referenser (samma fynd som
  kvitto-passet redan bokförde om samma skript) — bekräftat igen här
  eftersom felet slog till på EXAKT samma sätt (Cavolini-symlänken) i BÅDA
  dessa mallars självbärande-görning. Inte åtgärdat i detta pass (utanför
  mandatet), men nu bekräftat en andra gång oberoende av kvittot.
- **Sidstorlek och sidantal (1 sida, A4) är identiska mellan motorerna för
  BÅDA mallarna** — till skillnad från kvittot, som fick sitt innehåll
  vertikalt isärdraget av grid-stapling, finns ingen sådan effekt här
  eftersom ingen `display: grid` förekommer alls.

## Vad jag inte kunde belägga

- **Om Chromes `gap`+`margin`-summering är specifikt för denna
  centrerade `align-items: center`-kontext**, eller om samma summering
  (utan den sekundära padding-intrångseffekten) skulle synas även i ett
  icke-centrerat flex-flöde. Detta är CSS-flexbox-specens generella regel
  (gap och margin är alltid additiva), men den sekundära
  centrerings-bieffekten (padding-intrånget) är specifik för att
  `.ikonruta-media`s block råkar bli bredare än sin förälders
  innehållsyta — jag har inte testat ett minimalt fyra-fallsdokument för
  att isolera de två effekterna åt.
- **Den exakta pixelbredden på `.ikonruta-ram`s border och padding** i
  denna mätning är en HÄRLEDNING ur CSS-källkoden (2,25 pt border, 3 mm
  padding), inte en oberoende pixel-mätning av just border/padding-
  gränserna var för sig — den sammanlagda `.ikonruta-ram`-bredden (51,1–
  51,3 mm) är däremot direkt uppmätt och stämmer mot spec.
  Padding-siffrorna i ställe #3-tabellen ovan är alltså en DERIVERAD
  storhet (det som blir kvar mellan uppmätt boxkant och uppmätt
  ikon-/QR-kant), inte en direkt mätning av en synlig padding-gräns (det
  finns ingen synlig linje mellan border och innehåll att mäta mot).
- **Färgkanals-förskjutningen i loggan och highlight-kanten** är, precis
  som i kvitto-passet, obekräftad som reell defekt kontra
  rastrerings-/antialiasing-artefakt — ingen djupare undersökning gjord
  i detta pass.
- **Om samma `.sidfot`-typ av `justify-content`-kompensation skulle hålla
  lika bra vid ANNAT innehåll** (t.ex. fler eller bredare flex-barn, där
  det fria utrymmet blir MINDRE än det specade `gap`-golvet) är inte
  testat här — mätningen gäller specifikt denna fixtur, där det fria
  utrymmet (≈19–20 mm per mellanrum) råkar vara gott och väl större än
  det specade golvet (6 mm).

## Källförteckning

- `docs/mallar/bilagor/bilaga-delad.css` (radnummer 354–356, 440–445,
  490–492, 496–497 — disk-verifierade via `grep -n` innan mätning; NOLL
  träffar på `display: grid` i hela 519-radersfilen)
- `docs/mallar/bilagor/bekraftelsebilaga.html`,
  `docs/mallar/bilagor/deltagarinformation.html` (disk-lästa i sin helhet
  för att bekräfta vilka klasser respektive dokument faktiskt använder)
- `docs/mallar/bilagor/fixtures/bekraftelsebilaga.exempel.json`,
  `deltagarinformation.exempel.json` (redan i repot, oförändrade)
- `docs/mallar/bilagor/README.md` (mall-mekanik, granskningsväg,
  Prince-kompensationernas historik i `.ikonruta-media`/`.sidfot`)
- `scripts/render-bilage-mall.mjs` (granskningsvägen, `npm run
  mall:granska`)
- `scripts/docraptor-sjalvbarande.mjs` (återanvänd, oförändrad,
  `gorSjalvbarande()`)
- `supabase/functions/test-docraptor-render/index.ts` (disk-läst i sin
  helhet, 198 rader — bekräftar body-kontraktet `{html, namn}` → PDF-bytes,
  inget `leverans`-fält existerar i denna funktion)
- `docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md`
  (metod- och verktygsreferens — build-selfcontained.mjs, rendera-prince.mjs,
  analys.mjs återanvända/anpassade härifrån)
- `.env.test` (repo-rotens gitignorerade testcredentials, lästa via
  `Read`-verktyget mot huvudkatalogens kopia eftersom denna worktree
  saknar filen)
- `pdfinfo`/`pdftoppm` (poppler-utils, `/usr/local/bin/pdftoppm`)
- Google Chrome 151.0.7922.170 (`/Applications/Google Chrome.app`)
- Egenbyggda/anpassade mätverktyg i scratchpad
  (`bilagor-prince-matning/build-selfcontained.mjs`,
  `rendera-prince.mjs`, `bygg-diff.mjs`, `analys.mjs`) — engångskod för
  detta pass, ingen produktionsfil

## Updates — 2026-08-23, efter gap-borttaget

**Om-mätningsvarv, samma rigg, ingen fix i detta varv.** Orkestreraren tog
bort `gap: 4.5mm;` ur `.ikonruta-media` i `docs/mallar/bilagor/
bilaga-delad.css` (rad ~490–492) sedan ovanstående pass; `margin-right:
4.5mm` på förstabarnet är kvar oförändrad (rad ~496–497). Disk-verifierat
via `git diff` + `grep -n "gap"` innan mätning: **noll** träffar på `gap`
inuti `.ikonruta-media`-blocket. Pipelinen är IDENTISK med ovanstående
(samma `build-selfcontained.mjs`/`rendera-prince.mjs`/`analys.mjs`, samma
Cavolini-`local("")`-neutralisering — exakt EN icke-`data:`-`url()`
återfunnen och neutraliserad, identiskt med förra passet), applicerad på en
NY självbärande HTML byggd ur den ändrade CSS:en. Endast
`bekraftelsebilaga` mätt (den enda mallen som använder `.ikonruta-media`).

**Kalibrering före mätning:** samma kolumn-scan (x=0–bredd, y=1520–1600
för ställe 3, y=1483–1668 för ställe 2, tröskel 200) kördes FÖRST mot de
ORÖRDA FÖRE-PNG:erna från förra passet och gav siffror byte-för-byte
identiska med tabellerna ovan (8,81/9,14 mm Chrome, 4,40/4,57 mm Prince på
ställe 3; 19,98/20,15 mm på ställe 2, båda motorer) — bekräftar att exakt
samma mätmetod återanvänds, inte en ny approximation.

**Renderingskvittens (identisk pipeline-hälsa som förra passet):** Prince
(staging `test-docraptor-render`) → HTTP 200, `application/pdf`,
`x-docraptor-ms: 3469,1`, `x-pdf-bytes: 149 628`, `x-docraptor-test-mode:
true`. Chrome 151.0.7922.170 headless → 163 395 bytes. `pdfinfo` bekräftar
A4, 1 sida, samma sidstorlekar som förra passet i båda motorerna
(oförändrat av CSS-ändringen, som väntat). PDF-filstorleken för Prince
(149 628 bytes) råkar vara TALMÄSSIGT identisk med förra passets FÖRE-PDF
— verifierat att det INTE är samma fil: `md5` skiljer sig
(`afa2aa38…` FÖRE mot `baf0476d…` EFTER), och `.ikonruta-media`-blocket i
den nya självbärande HTML:n saknar `gap` (grep-verifierat i den byggda
filen, inte bara i källfilen).

### Ställe 3 (ikon↔QR) — före/efter per motor

| | Chrome box1 | Prince box1 | Chrome box2 | Prince box2 |
|---|---|---|---|---|
| **FÖRE** (gap+margin, Chrome; margin, Prince) | 8,81 mm | 4,40 mm | 9,14 mm | 4,57 mm |
| **EFTER** (endast margin, båda motorer) | **4,40 mm** | **4,40 mm** | **4,40 mm** | **4,57 mm** |
| Chrome−Prince, FÖRE | +4,41 mm | — | +4,57 mm | — |
| Chrome−Prince, EFTER | **0,00 mm** | — | **−0,17 mm** | — |

Fullständig segmentnedbrytning EFTER (samma format som FÖRE-tabellen ovan):

| | Chrome (box1) | Prince (box1) | Chrome (box2) | Prince (box2) |
|---|---|---|---|---|
| Padding före ikon | 2,54 mm | 2,71 mm | 2,71 mm | 2,88 mm |
| Ikon-bredd | 19,81 mm | 19,64 mm | 19,64 mm | 19,47 mm |
| **Gap ikon→QR** | **4,40 mm** | **4,40 mm** | **4,40 mm** | **4,57 mm** |
| QR-bredd | 19,30 mm | 19,47 mm | 19,64 mm | 19,47 mm |
| Padding efter QR | 2,88 mm | 2,88 mm | 2,71 mm | 2,71 mm |

**Acceptans uppfylld på alla tre villkor:**

1. **Chrome ≡ Prince inom ±0,5 mm:** box1-differensen är nu **0,00 mm**
   (identisk), box2-differensen är **0,17 mm** — båda ruggigt inom
   ±0,5 mm-golvet, mot +4,4–4,6 mm FÖRE.
2. **Prince-värdet oförändrat:** 4,40/4,57 mm EFTER mot 4,40/4,57 mm FÖRE
   — **exakt samma**, som väntat (Prince ignorerade redan `gap`, så att ta
   bort den primitiv Prince aldrig honorerade kan inte flytta Princes eget
   värde).
3. **Sekundäreffekten (padding-intrånget) försvann också:** Chromes
   padding-siffror gick från 0,17–0,68 mm (FÖRE, hoptryckt av det
   för-breda 48 mm-blocket) till 2,54–2,88 mm (EFTER) — nu i linje med
   Princes 2,71–2,88 mm och nära det specade 3 mm-värdet i båda motorerna.
   Detta var INTE ett separat mätmål i uppdraget, men bekräftar mekanismen
   som beskrevs i FÖRE-passet: med `gap` borta krymper flex-blockets
   totalbredd till 19,5+4,5+19,5=43,5 mm, vilket får plats i den
   tillgängliga ≈43,5 mm-ytan utan att tränga in i padding-zonen.

Visuell dubbelkontroll (`Read`-verktyget mot
`crop-chrome-ikon-zoom-EFTER.png`/`crop-prince-ikon-zoom-EFTER.png`,
box1/Instagram-rutan): de två beskurna bilderna visar nu SAMMA
mellanrumsbredd mellan ikon och QR-kod för ögat — till skillnad från
FÖRE-passets crops, där Chrome-mellanrummet var synbart bredare.

### Ställe 2 (sidfoten) — kontroll: inget annat rört

| Segment | Chrome FÖRE | Chrome EFTER | Prince FÖRE | Prince EFTER |
|---|---|---|---|---|
| Vänster sidmarginal | 8,13 mm | 8,13 mm | 8,13 mm | 8,13 mm |
| Yttre ramens vänsterkant | 2,71 mm | 2,71 mm | 2,54 mm | 2,54 mm |
| Padding till ikonruta 1 | 12,87 mm | 12,87 mm | 13,04 mm | 13,04 mm |
| Ikonruta 1 (hel bredd) | 51,14 mm | 51,14 mm | 51,14 mm | 51,14 mm |
| **Gap: ikonruta 1 → bokomslag** | 19,98 mm | **19,98 mm** | 19,98 mm | **19,98 mm** |
| Bokomslag | 18,97+1,02 mm | 18,97+1,02 mm | 18,97+1,02 mm | 18,97+1,02 mm |
| **Gap: bokomslag → ikonruta 2** | 20,15 mm | **20,15 mm** | 20,15 mm | **20,15 mm** |
| Ikonruta 2 (hel bredd) | 51,14 mm | 51,14 mm | 51,31 mm | 51,31 mm |
| Padding + ram + marginal höger | 13,04+2,54+8,13 mm | 13,04+2,54+8,13 mm | 12,87+2,71+8,13 mm | 12,87+2,71+8,13 mm |

**Ställe 2 är BYTE-FÖR-BYTE identiskt FÖRE/EFTER i båda motorerna** — hela
`detectColumnRuns`-utdatan (samtliga 13 segment) matchar exakt, ingen enda
pixel-avvikelse. Väntat: `.sidfot` (rad 440–445) rördes inte av denna
ändring, och `.ikonruta-media`-blockets totalbredd-krympning (48→43,5 mm)
påverkar inte `.sidfot`s egen `justify-content: space-between`-fördelning,
eftersom `.ikonruta-ram`s YTTRE bredd (51,1 mm) är oförändrad — endast
INNEHÅLLET i rutan flyttade sig.

### Slutsats

Fixen (ta bort `gap`, behåll `margin-right` som ensam bärare i båda
motorerna) löser exakt den avvikelse FÖRE-passet mätte, utan att röra
någon annan del av dokumentet. `.ikonruta-media` går från **AVVIKER** till
**IDENTISKT** (inom mätmetodens ±0,5 mm-upplösning — 1 px vid 150 dpi =
0,169 mm, så en kvarvarande 0,17 mm-differens på box2 är i
storleksordningen ETT pixel-steg, inte en reell layoutskillnad).
