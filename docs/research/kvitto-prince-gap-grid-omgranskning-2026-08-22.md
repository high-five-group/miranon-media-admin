---
owner: marcus803
updated: 2026-08-23
review_by: 2026-11-22
status: draft
---

# Kvittots gap/grid-omgranskning — Prince mot Chrome, per-ställe mätning (2026-08-22)

> **Proveniens:** kortlöst mätpass, beställt av S108-orkestreraren efter fyndet
> i `tasks/sessions/2026-08-20-session-108.md` Del 10 § CARRY
> ("KVITTOTS GAP/GRID-OMGRANSKNING"). Kört i egen worktree
> (`.claude/worktrees/s108-paus-docs`, gren `docs/s108-resume-7`). **Modell:**
> exakt rad ur egen systemprompt — *"You are powered by the model named
> Sonnet 5. The exact model ID is claude-sonnet-5."*
>
> **Detta är ett MÄTPASS, ingen fix.** `docs/mallar/bilagor/kvitto.css` och
> `kvitto.html` är ORÖRDA. Inga git-kommandon kördes. Alla intermediära
> artefakter (PDF:er, PNG:er, självbärande HTML) ligger i scratchpad, inte i
> repot.

## Kort svar

**Samtliga 3 `display:grid`-ställen renderas ANNORLUNDA av Prince än av
Chrome — men på TVÅ olika, distinkta sätt beroende på om
`grid-template-columns` använder `auto` eller fasta mm-bredder.** De två
`auto auto`-griden (`.kvitto-metarad`, `.kvitto-referensblock`) STAPLAR
fullständigt: varje `dt`/`dd` hamnar på sin egen rad, kolumnlayouten
existerar inte alls i PDF:en. Det tredje griden (`.kvitto-tabellrad`, fasta
mm-bredder) stannar kvar på EN rad men kollapsar alla fem kolumnbredder till
innehållets egen bredd — hela radens 164,6 mm-brett innehåll (i Chrome)
klämmer ihop till 55,5 mm i Prince, en ~109 mm-förskjutning av sista
kolumnen. Av de 4 flex-`gap`-ställena är ETT (`.kvitto-total-betalt`, SEK →
BETALT) HELT bortfallet — 6,60 mm blir 0,00 mm, texten smälter ihop till
"SEK2 500,00". De tre övriga flex-gap-ställena (`.kvitto-totalruta`,
`.kvitto-total-kolumn`, `.kvitto-sidfot`) avviker måttligt (0,85–4,74 mm),
utan att bli olisbara eller kollidera textmässigt. **Kvittot Marcus godkände
i webbläsaren skulle alltså se märkbart annorlunda ut som PDF** — särskilt
referensblocket/metaraden (fullständigt staplade i stället för
tvåkolumns) och SEK/BETALT-raden (sammanslagen text).

## Metod

1. **Självbärande HTML** av `docs/mallar/bilagor/kvitto.granskning.html`
   byggd med den REDAN TESTADE, oförändrade repo-modulen
   `scripts/docraptor-sjalvbarande.mjs` (`gorSjalvbarande()`), importerad
   från ett litet driver-skript i scratchpad — ingen ny inlinings-logik
   skrevs, för att inte riskera en tyst divergens mot det som redan är mätt
   i `docs/research/docraptor-minimaltest-2026-08-22.md`. Kommando:

   ```bash
   node scratchpad/kvitto-prince-matning/build-selfcontained.mjs \
     scratchpad/kvitto-prince-matning/kvitto.sjalvbarande.html
   ```

   **Ett ohämtbart typsnitt hittades och neutraliserades manuellt i
   scratchpad-kopian** (rör INTE `scripts/docraptor-sjalvbarande.mjs`
   själv): `bilaga-delad.css`s `@font-face`-block för Cavolini-Bold pekar på
   `./lokala-typsnitt/Cavolini-Bold.ttf`, en git-ignorerad symlänk som INTE
   finns i denna worktree. `scripts/docraptor-sjalvbarande.mjs`s egen
   fail-safe lämnar en sådan referens ORÖRD (kommenterat i skriptet som en
   medveten webbläsar-parallell), vilket är EXAKT den klass av bugg Del 10
   § B punkt 1 dokumenterade som DocRaptor-fällande (422 "File system access
   is not allowed" — servern läser en relativ `url()` som ett
   filsystems-anrop). Referensen ersattes för hand med `local("")`
   (samma neutralisering som `src/components/dokument/prototyp/
   sjalvbarande.ts` redan gör för webbläsarvägen) i den genererade
   scratchpad-filen, INTE i någon produktionsfil. Detta är i sig ett fynd
   värt att bokföra: **Node-skriptet `scripts/docraptor-sjalvbarande.mjs`
   har INTE samma `local("")`-fix som browser-sidans `sjalvbarande.ts`** —
   se § Övriga avvikelser.

2. **Prince-rendering** via `POST /functions/v1/test-docraptor-render`
   (staging, `pqtshyierkdgwdnxuirz`), inloggad som `staging-user@miranon.test`
   (JWT från `TEST_SUPABASE_URL`/`TEST_USER_EMAIL`/`TEST_USER_PASSWORD` —
   lästa från repo-rotens `.env.test`, samma fil `scripts/
   docraptor-minimaltest.mjs` redan konsumerar). Svar: HTTP 200,
   `content-type: application/pdf`, `x-docraptor-ms: 2956.8`,
   `x-pdf-bytes: 52146`, `x-docraptor-test-mode: true` (gratis testnyckel,
   vattenstämplad — samma läge som det ursprungliga minimaltestet).

3. **Chrome-rendering** av EXAKT SAMMA självbärande HTML-fil, headless:

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --no-pdf-header-footer \
     --print-to-pdf=chrome.pdf \
     "file:///…/kvitto.sjalvbarande.html"
   ```

   Chrome 151.0.7922.170 (samma major-version som Del 10:s egen mätning).
   `pdfinfo` bekräftar båda är **A4, 1 sida, `@page{margin:0}` honorerat** i
   båda motorerna (Prince: 595,276×841,89 pt; Chrome: 594,96×841,92 pt —
   skillnaden är sub-punkts avrundning, inte en marginal-avvikelse):

   | | Prince | Chrome |
   |---|---|---|
   | Producer | Prince 15.1 | Skia/PDF m151 (HeadlessChrome/151) |
   | Sidstorlek | 595,276 × 841,89 pt (A4) | 594,96 × 841,92 pt (A4) |
   | Sidor | 1 | 1 |
   | Filstorlek | 52 146 bytes | 51 601 bytes |

4. **Rastrering** med `pdftoppm -r 150 -png` (poppler, `which pdftoppm` →
   `/usr/local/bin/pdftoppm`, verifierat innan användning) → 1240×1754 px
   (Chrome) respektive 1241×1754 px (Prince) — 1 px skillnad i bredd är
   sub-punkts avrundning, inte en reell sidstorleksskillnad.

5. **Sida-vid-sida + diff** byggda med `sharp` (redan projekt-dependency,
   `package.json`, inget nytt beroende) — ImageMagick (`compare`/`magick`)
   saknas på maskinen (`which compare`/`which magick` → tomt, verifierat).
   Diff via `composite({ blend: 'difference' })` + `normalise()`.

6. **Per-ställe-mätning** med ett litet egenbyggt Node/`sharp`-verktyg
   (`scratchpad/kvitto-prince-matning/analys.mjs`, två funktioner):
   - `detectRowBands`: skannar en rad-remsa och hittar sammanhängande
     text-rader (för att lokalisera VILKEN pixel-rad ett CSS-ställe hamnar
     på i respektive rendering — Prince och Chrome har OLIKA y-koordinater
     för samma innehåll när grid staplar).
   - `detectColumnRuns`: för en given rad, hittar sammanhängande
     "bläck"-kolumner (text, luminans-tröskel) separerade av
     "mellanrum"-kolumner (bakgrund), och rapporterar varje mellanrums
     bredd i px och mm (`px / 150 × 25,4`).

   Threshold 200 (luminans 0–255) skiljer text (nära 0) från BÅDE vit
   bakgrund (255) och den gråa rutans `#F2F2F2` (~242) — verifierat att
   ingen av boxarnas gråtoner triggar falskt som "bläck".

   Varje mätpunkt nedan är verifierad genom BÅDE den numeriska
   kolumn-scanningen OCH en beskuren bild läst visuellt (`Read`-verktyget)
   för att bekräfta att rätt textinnehåll identifierades — ingen mätning
   redovisas utan att motsvarande crop synades.

## Mättabellen — de 7 ställena

Radnummer verifierade mot disk (`grep -n "column-gap\|gap:" docs/mallar/
bilagor/kvitto.css`) innan mätning — identiska med uppdragets angivna rader.

| # | Ställe (kvitto.css) | Primitiv | Spec | Chrome (ist) | Prince (ist) | Avvikelse | Klass |
|---|---|---|---|---|---|---|---|
| 1 | rad 107/109 `.kvitto-metarad` | `grid`, `column-gap`, `auto auto` | 6,82 mm | ~7,28 mm (dt→dd, bredaste dt-raden) | **Ej tillämpligt** — 4 separata rader, ingen kolumn alls | Kolumnlayouten finns inte | **TRASIGT** |
| 2 | rad 151/153 `.kvitto-referensblock` | `grid`, `column-gap`, `auto auto` | 6 mm | ~6,27 mm (dt→dd, bredaste dt-raden "Förfallodatum") | **Ej tillämpligt** — 8 separata rader | Kolumnlayouten finns inte | **TRASIGT** |
| 3 | rad 219/228 `.kvitto-tabellrad` | `grid`, `column-gap` + FASTA mm-kolumner (92,7/7,2/18,4/26,1 mm) | 1 mm | Kolumnstarter matchar spec-positionerna inom ≤1,5 px (≤0,25 mm); hela raden 164,6 mm bred | Alla 5 kolumner kollapsar till innehållsbredd; hela raden ryms på ~55,5 mm — sista kolumnens startposition förskjuten ~93 mm åt vänster | ~109 mm på radbredden / ~93 mm på sista kolumnens startposition | **TRASIGT** (annan brytningsform än #1/#2 — stannar på en rad, men kolumnbredderna är döda) |
| 4 | rad 305 `.kvitto-totalruta` | `flex`, `gap`, 4× `flex:1` + 1 auto-margin | 6 mm | Kolumnsegment 182/195/194 px | Kolumnsegment 192/204/203 px (+10/+9/+9 px), sista segmentet (Öresavr→BETALT) −29 px | +1,69 till +3,22 mm per kolumn (växande), BETALT:s absoluta position nästan opåverkad (Δ0,17 mm) | **AVVIKER** (litet–måttligt, ej fullständigt bortfallet) |
| 5 | rad 320 `.kvitto-total-kolumn` | `flex-direction:column`, `gap` (vertikal) | 1 mm | ~16 px (2,71 mm) etikett→värde | ~10 px (1,69 mm) | −6 px (−1,02 mm) — hela det specade 1 mm-tillägget saknas | **AVVIKER** (helt bortfallet tillägg, men strukturen — etikett ovanför värde — är korrekt) |
| 6 | rad 347 `.kvitto-total-betalt` | `flex`, `gap` (horisontell, SEK→BETALT) | 6,55 mm | 39 px (6,60 mm) | **0 px (0,00 mm)** — "SEK2 500,00" helt hopvuxet, ingen mellanrumskolumn detekterbar | −6,60 mm (100 % bortfall) | **TRASIGT** |
| 7 | rad 369 `.kvitto-sidfot` | `flex`, `gap`, 4× `flex:1` | 4 mm | Kolumnsegment 234/239/239 px | Kolumnsegment 229/232/233 px (−5/−7/−6 px) | −0,85 till −1,19 mm per kolumn (krympande, motsatt riktning mot #4) | **AVVIKER** (litet) |

**Chrome-värdena i kolumn 5 är renderingens FAKTISKA mätta värde, inte
CSS-specen** — de ligger nära men inte exakt på spec-värdet (t.ex. 7,28 mm
mot specade 6,82 mm för #1), vilket är förväntat glyf-/tröskel-brus vid
150 dpi-rastrering (1 px = 0,169 mm), inte ett fel i Chromes
grid-implementation.

## Övriga avvikelser (utanför gap/grid-frågan, bokförda separat)

- **`scripts/docraptor-sjalvbarande.mjs` saknar `local("")`-fixen för
  ohämtbara `url()`-referenser** som `src/components/dokument/prototyp/
  sjalvbarande.ts` (browser-vägen) redan har. Node-skriptets kommentar
  beskriver fail-safe:t uttryckligen som "samma princip som prototypens
  FOUC-fallback" — men Del 10 § B punkt 1 visade att just den principen är
  FEL server-side (en orörd `url()` fäller HELA DocRaptor-jobbet med 422).
  I detta pass slog felet bara till på Cavolini (`bilaga-delad.css`,
  delad med kvittot via `<link>`), eftersom `lokala-typsnitt`-symlänken
  saknas i denna worktree — men skulle slå till på VILKEN SOM HELST
  ohämtbar font-referens i en miljö där Node-skriptet körs mot en
  worktree utan alla lokala tillgångar. Detta är ett fynd om
  `scripts/docraptor-sjalvbarande.mjs` självt, inte om `kvitto.css`, och
  ligger utanför detta pass mandat att fixa — bokfört här, ej åtgärdat.
- **Sidlayouten skiftar vertikalt som en konsekvens av #1/#2:s stapling.**
  Eftersom referensblocket (normalt 4 rader) blir 8 rader i Prince, och
  metaraden (normalt 2 rader) blir 4 rader, trycks tabellen/totalrutan/
  sidfoten nedåt i förhållande till Chrome-renderingen — synligt i
  `diff.png` som en tydlig vertikal isärdragning av allt innehåll under
  loggan. Båda renderingarna ryms ändå på 1 sida (ingen spill), men
  marginalen till sidfotens nederkant krymper i Prince.
- **Adressradens radbrytning skiftar i sidfoten** ("Uttringe Hages väg 17,
  144" / "63 Rönninge, Sverige" i Chrome mot "Uttringe Hages väg 17, 144 63"
  / "Rönninge, Sverige" i Prince) — en följdeffekt av att
  `.kvitto-sidfot-kolumn`s faktiska bredd skiljer några px mellan
  motorerna (se rad 7 ovan), inte ett eget primitiv-fel.
- **Loggan (`MiranonMedia`-ordmärket, SVG) visar en svag färgkanals-
  förskjutning i diff-bilden** (röd/grön-kant syns i `diff.png` runt
  vågformen). Inte undersökt vidare i detta pass — kan vara
  antialiasing-/färghanteringsskillnad mellan Skia (Chrome) och Prince,
  inte nödvändigtvis en reell defekt. Bokförs som observation, ej
  klassificerad.
- **DocRaptor-vattenstämpeln** ("TEST DOCUMENT"-banderoller,
  "Document doesn't look right?") är synlig i Prince-renderingen, som
  väntat för testnyckeln — samma läge som det ursprungliga
  minimaltestet, försvinner med ett skarpt DocRaptor-konto.

## Vad jag inte kunde belägga

- **Den exakta mekanismen bakom #4:s OCH #7:s riktning** (kolumner blir
  BREDARE i `.kvitto-totalruta` men SMALARE i `.kvitto-sidfot` i Prince,
  trots att båda är `flex:1`-kolumner med `gap`) är INTE isolerad till en
  enda orsak. Jag har uteslutit att det är ett rent "gap → 0"-fenomen
  (då hade båda krympt lika mycket), men har inte kunnat skilja ut om
  skillnaden beror på (a) hur mycket av `gap` Prince faktiskt appliceras
  olika i de två fallen, (b) `.kvitto-sidfot-kolumn`s flerradiga
  textinnehåll (adressen radbryter) som ger ett annat
  minsta-innehålls-bredd-beteende än `.kvitto-total-kolumn`s korta
  enradiga värden, eller (c) någon kombination. Detta ligger utanför vad
  en pixel-mätning ensam kan avgöra utan Princes egen renderings-loggning.
- **Om Prince respekterar `gap` på NÅGOT `flex`-ställe fullt ut** kunde
  inte fastställas positivt — samtliga fyra flex-gap-ställen avviker i
  någon grad (0,85 mm till 100 %), ingen är IDENTISK med Chrome inom
  mätningens felmarginal (~0,2–0,3 mm).
- **Huruvida `.kvitto-tabellrad`s 1 mm `column-gap` i sig är honorerat
  eller inte** i Prince kunde inte isoleras rent — kolumnbredds-kollapsen
  (92,7/7,2/18,4/26,1 mm → innehålls-bredd) dominerar så helt att den
  kvarvarande ~0,85–1,02 mm-vita mellanrummet mellan de hopklämda orden
  lika gärna kan vara normalt ord-mellanrum som en respekterad
  `column-gap`. Frågan är i praktiken ovidkommande givet att
  kolumnbredderna redan är trasiga.
- **Färgkanals-förskjutningen i loggan** (se ovan) är obekräftad som
  reell defekt kontra rastrerings-/antialiasing-artefakt.

## Källförteckning

- `docs/mallar/bilagor/kvitto.css` (radnummer 107, 109, 151, 153, 219,
  228, 305, 320, 347, 369 — disk-verifierade via `grep -n` innan mätning)
- `docs/mallar/bilagor/kvitto.granskning.html` (redan genererad,
  `npm run mall:granska -- kvitto`, TASK/S108-fixtur)
- `tasks/sessions/2026-08-20-session-108.md` Del 10 § B punkt 2
  (fyra-fallstestet: flex-`gap` ignoreras, `grid`+`column-gap` "trasig —
  staplar i stället för kolumner") och § CARRY
  ("KVITTOTS GAP/GRID-OMGRANSKNING")
- `docs/research/docraptor-minimaltest-2026-08-22.md` (metod-referens,
  EF-anropsmönster, självbärande-görarens ursprungliga mätning)
- `scripts/docraptor-sjalvbarande.mjs` (återanvänd, oförändrad,
  `gorSjalvbarande()`)
- `scripts/docraptor-minimaltest.mjs` (anropsmönster för
  `test-docraptor-render`, `loggaIn`/`anropaEF`)
- `supabase/functions/test-docraptor-render/index.ts` (staging-only
  testharness-EF, oförändrad)
- `src/components/dokument/prototyp/sjalvbarande.ts` (jämförelsepunkt för
  `local("")`-fixen som `docraptor-sjalvbarande.mjs` saknar)
- `.env.test` (repo-rotens gitignorerade testcredentials, läst för
  `TEST_SUPABASE_URL`/`TEST_SUPABASE_ANON_KEY`/`TEST_USER_EMAIL`/
  `TEST_USER_PASSWORD` — samma fil `scripts/docraptor-minimaltest.mjs`
  redan konsumerar)
- `pdfinfo`/`pdftoppm` (poppler-utils, `/usr/local/bin/pdftoppm`,
  verifierad närvaro innan användning)
- Egenbyggt mätverktyg: `scratchpad/kvitto-prince-matning/analys.mjs`
  (`sharp`-baserad rad-/kolumn-detektor, se § Metod punkt 6) — engångskod
  för detta pass, ingen produktionsfil

## Updates 2026-08-23 (TASK-304 — primitiverna byggda och mätta)

**Premiss-rättelse innan mättabellen läses:** den "före"-baslinjen detta
kort fick utpekad (`chrome.png`/`prince.png` i
`scratchpad/kvitto-prince-matning/`, från mätpasset ovan) visade sig vara
RENDERAD MOT ETT FÖRÅLDRAT FIXTURE-LÄGE — Datum-raden läste "3 augusti
2026" i den bilden, men `fixtures/kvitto.exempel.json` bar redan
`"datum": "2026-08-03"` (ISO, commit `1e8ccb50`, samma S108-dag) när DETTA
kort startade. Sannolik orsak: forskningspassets egen worktree
(`s108-paus-docs`) hade inte hunnit synka `1e8ccb50` när `chrome.png`
genererades. Konsekvens: den bilden dög INTE som "Chrome oförändrad"-facit
rakt av. Åtgärd: en KORREKT "sant före"-baslinje byggdes i detta kort genom
att tillfälligt `git stash` mina CSS/HTML-ändringar, regenerera
`kvitto.granskning.html` från den ORIGINALA grid-baserade `kvitto.css`/
`kvitto.html` (oförändrad, HEAD) mot den AKTUELLA fixturen, rendera i
Chrome, och `git stash pop` tillbaka. Alla jämförelser nedan är mot DENNA
baslinje (`scratchpad/task304-kvitto-matning/true-before/true-before-1.png`),
inte mot forskningspassets `chrome.png`.

**Metod, oförändrad från mätpasset ovan** (samma rigg, egen kopia av
driver-skripten pekande på denna worktree i stället för `s108-paus-docs`,
se `scratchpad/task304-kvitto-matning/`): självbärande HTML via
`scripts/docraptor-sjalvbarande.mjs` (`local("")`-neutralisering av samma
Cavolini-symlänksfynd som ovan), Prince-rendering via
`test-docraptor-render` (samma EF, samma testnyckel — `x-docraptor-ms:
3020.0`, `x-pdf-bytes: 51912`, `x-docraptor-test-mode: true`), Chrome
151.0.7922.170 headless `--print-to-pdf`, `pdftoppm -r 150`. Sidstorlek
oförändrad i båda motorerna (Prince 595,276×841,89pt; Chrome
594,96×841,92pt — samma sub-punkts avrundning som tidigare, 1 sida i båda).

### Mättabellen efter ombyggnaden — de 7 ställena

| # | Ställe | Chrome FÖRE (sant, denna körning) | Chrome EFTER | Prince EFTER | Avvikelse (Prince↔Chrome) | Chrome oförändrad? |
|---|---|---|---|---|---|---|
| 1 | `.kvitto-metarad` dt→dd (bredaste raden, "Kvitto-/OCR-nr:") | 7,28mm (43px) | 7,28mm (43px) | 7,28mm (43px) | **0,00mm** | JA — pixel-identiskt |
| 2 | `.kvitto-referensblock` dt→dd (bredaste raden, "Förfallodatum") | 6,27mm (37px) | 6,27mm (37px) | 6,27mm (37px) | **0,00mm** | JA — pixel-identiskt |
| 3 | `.kvitto-tabellrad` kolumnstarter (Antal/A-pris/Summa) + total radbredd | Antal x=715, A-pris x=878, Summa x=1038; box border-till-border 1045px=176,99mm | identiskt (0px diff på alla tre kolumnstarter) | identiskt (0px diff på alla tre) | **0,00mm** (var ~55,5mm/~109mm-förskjutning FÖRE primitivbytet) | JA |
| 4 | `.kvitto-totalruta` kolumnstarter (Netto/Exkl.moms/Moms/Öresavr/BETALT) | x≈112/332/527/721/996 | 0–1px diff mot före | 0–1px diff mot Chrome EFTER | **≤0,17mm** | JA (≤1px avrundning) |
| 5 | `.kvitto-total-kolumn` etikett→värde (vertikal) | 16px = 2,71mm | 16px = 2,71mm | 16px = 2,71mm | **0,00mm** | JA — pixel-identiskt |
| 6 | `.kvitto-total-betalt` SEK→BETALT | 40px = 6,77mm | 40px = 6,77mm | 40px = 6,77mm | **0,00mm** (var 0mm/hopvuxet FÖRE primitivbytet) | JA — pixel-identiskt |
| 7 | `.kvitto-sidfot` kolumnstarter (Adress/Telefon/Plusgiro/Organisationsnr) | x≈112/400/639/877 | 0–1px diff mot före | 0–1px diff mot Chrome EFTER | **≤0,17mm** | JA (≤1px avrundning) |

**Acceptans (AC #2/#3) uppfylld på alla sju ställen** — Prince↔Chrome
avviker som mest 0,17mm (1px @150dpi), långt innanför ±0,5mm-baren, och
Chrome-renderingen är antingen pixel-identisk (ställe 1/2/3/5/6) eller
avviker ≤0,17mm (ställe 4/7) mot den KORREKTA "före"-baslinjen.

**En avvikelse funnen och bokförd, INTE dold:** `.kvitto-metarad`s
KORTARE rad ("Datum:", ej den officiellt uppmätta "bredaste raden") flyttar
sitt dd-värde 2px (0,34mm) åt vänster i EFTER jämfört med FÖRE — en
konsekvens av att `min-width` (mätt på "Kvitto-/OCR-nr:"s bläckbredd,
114px) inte träffar EXAKT samma pixel som grid:ets auto-kolumnbredd gjorde
för den kortare radens egen linjering. Ligger inom mätningens egen
felmarginal (~0,2–0,3mm, se § Mättabellen — de 7 ställena ovan) och är INTE
ett av de sju officiella mätpunkterna, men bokförs här som en genuin,
uppmätt (inte antagen) skillnad.

**Sida-vid-sida:** `scratchpad/task304-kvitto-matning/` bär
`true-before/true-before-1.png` (sant före), `chrome-after-1.png` (Chrome
efter), `prince-after-1.png` (Prince efter, DocRaptor-testvattenstämplad),
`task304-diff-truebefore-after.png` (Chrome-diff, visar endast den bokförda
0,34mm-avvikelsen ovan + brus).
