---
owner: marcus803
updated: 2026-08-17
review_by: 2027-02-17
status: draft
---

# Hur löser branschen "rännsten"-strimman på en helskärmsbakgrund? (Code, 2026-08-17)

> **Proveniens — vad som redan var känt när detta pass startade.** Repot bär
> redan en djup, primärkälle-grundad utredning av EXAKT samma mekanism:
> [`docs/research/full-bredds-fond-scrollbar-gutter-2026-08-03.md`](full-bredds-fond-scrollbar-gutter-2026-08-03.md)
> (S96, 2 veckor gammal, 13 mätta kandidater i Playwright-Chromium 149,
> Firefox 151, WebKit 26.5). Den etablerar redan, mätt och citerat mot
> spec-text: (1) `background-image` (gradient/bild) MÅLAS ALDRIG i en
> `scrollbar-gutter: stable`-reserverad yta i Chromium — ett öppet,
> namngivet CSSWG-spec-gap, inte en lokal bugg; (2) `background-color` på
> `<html>` MÅLAS korrekt där, eftersom det är canvas-bakgrundslagret; (3)
> tolv andra tekniker (fixed-attachment, `100vw`+negativ margin,
> `position:fixed`-lager, JS-mätt explicit offset) mättes och FÖRKASTADES —
> ingen av dem löser klippningen. Detta pass byggde INTE om den
> utredningen. Den är fortfarande giltig (spec-gapets CSSWG-ärenden är
> färska verifierade nedan, samtliga fortfarande öppna) och används här som
> grund, inte ifrågasatt.
>
> Vad SOM VAR NYTT när Marcus rapporterade "jag ser den vita strimman
> fortfarande ganska väl" **efter** att kamouflaget redan var byggt enligt
> S96:s recept (`src/styles/base.css` § RÄNNSTENS-KAMOUFLAGE,
> `src/styles/tokens/components.css` `--mm-forberedelseskarm-fond-kamouflage`,
> commit `00ccc852`, TASK-276 runda 2): **VARFÖR** en redan
> forsknings-grundad, korrekt implementerad kamouflagefärg ändå kan
> uppfattas som en vit strimma. S96-passet testade mekanismen med en
> syntetisk gradient på 1600×900 — det testade aldrig OM den flata
> kamouflage-tekniken faktiskt matchar ett RIKTIGT FOTO över olika
> fönsterformat. Det är den frågan detta pass mäter, med den faktiska
> produktionsbilden (`public/roger-och-lotta.webp`) och den faktiska
> produktions-CSS:en, i fem realistiska viewportstorlekar. Ingen tidigare
> lesson (`tasks/lessons.md`) täcker detta specifikt — `L311/L312/L341/L342`
> (sökta, se § Källförteckning) handlar om `scrollbar-gutter`s canvas-origo-
> förskjutning för RAC-overlayers POSITIONERING, en helt annan symptomklass
> än bakgrundsmålning. Ingen ADR reglerar frågan (sökt `docs/decisions/` —
> träff bara på `ADR-019-background-sync-defer.md`, orelaterat namn-krock).
> Detta ligger alltså under ADR-baren: en session/tråd-fråga, inte ett
> ADR-ämne.
>
> **Mätmetod, konsekvent med S96:s disciplin.** Isolerad Playwright-repro i
> scratchpad (ej committad), med den ÄKTA `roger-och-lotta.webp`-filen och
> ordagrant samma CSS-regler som `src/styles/base.css` §
> RÄNNSTENS-KAMOUFLAGE + `Forberedelseskarm.tsx`s bakgrundslager. Mätt mot
> **Playwright 1.62.1, HeadlessChrome 151.0.7922.34** (nyare byggd än S96:s
> 149.0.7827.55 — beteendet höll i båda, se § 3). Pixelvärden lästa med
> `sharp` 0.35.3 (repots egen version) ur 1×1-`clip`-skärmdumpar, samma
> teknik som S96.

## Kort svar

**Vilken yta det är:** `scrollbar-gutter: stable both-edges`-rännstenen på
`<html>` (11 px per sida, ≥640 px, redan känd och redan rätt diagnostiserad
i koden). Ingen av de andra fem kandidatytorna i uppdraget (overscroll-
bounce, viewport-enhetsrundning, `background-attachment:fixed`-artefakter,
safe-area-insets) matchar Marcus symptom eller ens är NÅBARA i denna app —
se § 1 för varför var och en utesluts, mätt eller resonerat.

**Varför strimman syns TROTS ett redan korrekt implementerat kamouflage:**
mätt, inte gissat. Kamouflagefärgen (`color-mix(in srgb, var(--mm-bg) 85%, #888a6b)`,
en färg SAMPLAD ur fotots kantkolumner) matchar det FAKTISKA fotot bra — men bara i BRETT format (landskap, sidförhållande ≥ ~1,51,
t.ex. maximerat 1440×900 eller 1920×1080: skillnad 0–8 av 255 i de flesta
mätpunkter). I SMALARE/HÖGRE fönster (t.ex. halvskärms-delat läge,
1024×1366, eller till och med precis vid 640 px-tröskeln) byter
`background-size: cover` beskärningsaxel — den skär i SIDLED i stället för
i höjdled — och pixeln som då hamnar mot rännstenen är INTE längre fotots
egen kant, utan en skiva nära bildens HORISONTELLA MITT. I detta pass mätta
fönster gav det en skarp, tydligt synlig vit missmatchning: kamouflaget
`rgb(237,237,233)` mot en faktisk sömpixel på **`rgb(255,255,255)`** —
exakt vitt, exakt det Marcus beskrev. Se § 3 för siffror, skärmdumpar och
en testad men INTE fullt tillräcklig motåtgärd.

**Branschprecedent för problemet i sig är tunt** (bekräftar och
kompletterar S96:s slutsats — se § 2): ingen av Tailwind/Bootstrap/MUI
löser "foto/gradient in i rännstenen". EN produktionsfix hittades
(Bootstrap `#42545`, sammanslagen 2026-06-27) — men den löser ett annat,
smalare problem (en nativ `<dialog>`s `::backdrop` i ett scroll-låst läge),
inte en ständigt synlig, icke-låst helskärmsbakgrund. Se § 2.3 för varför
den inte överförs till vårt fall.

**Strukturellt tak, oavsett teknik:** rännstenen kan ALDRIG visa mer än EN
flack `background-color` (§ 1, § 3.3 — bekräftat både genom S96:s
spec-läsning och genom att jag TESTADE en tvåhinks-variant och mätte att den
FLYTTAR missmatchningen snarare än eliminerar den). Det sätter ett golv för
hur bra NÅGON lösning kan bli mot ett foto med verklig färgvariation.

## 1. Differentialdiagnos — vilken vit yta är det?

| # | Kandidatyta | Yttrar sig som | Avgörande DevTools-test | Bedömning för vårt fall |
|---|---|---|---|---|
| 1 | **`scrollbar-gutter: stable both-edges`-rännstenen** | En PERSISTENT, orörlig lodrät remsa i BÅDA kanterna, samma bredd oavsett scroll-läge, synlig utan någon interaktion. | Console: `getComputedStyle(document.documentElement).scrollbarGutter` → `"stable both-edges"` på ≥640 px. Mät bredden: `window.innerWidth - document.body.getBoundingClientRect().width` (i vår app: **22 px totalt, 11 px/sida**, konsekvent i alla mätta viewports, matchar redan `base.css`s kod-kommentar "11 px uppmätt … vid 1280"). Elements-panelen: markera `<html>`, sök "scrollbar-gutter" i Computed-fliken. | **MATCH.** Detta är ytan Marcus ser — bekräftat av att appens egen kod redan explicit hanterar exakt denna yta (`data-forberedelse-fond`-markören). |
| 2 | **Overscroll/rubber-band (`overscroll-behavior`, macOS/iOS)** | TRANSIENT — syns ENDAST medan man aktivt drar förbi en scrollbar gräns (topp/botten) med två-fingrar-gest eller mushjul, och försvinner när man släpper. Uppträder LODRÄTT (topp/botten), inte i sidled. | Kan INTE ses i en statisk skärmdump eller i Elements-panelen — måste provoceras fram fysiskt: scrolla förbi kantens gräns och observera om tom canvas blixtrar fram bortom innehållet. Kontrollera `getComputedStyle(html).overscrollBehaviorY` (default `auto` = studsen är påslagen). | **UTESLUTEN.** Fel axel (lodrätt vs sidled) och fel varaktighet (transient vs Marcus persistenta observation). Dessutom saknar Förberedelseskärmen egen scrollbar överflöde (`h-full`, innehållet ryms) — det finns ingenting att studsa mot. |
| 3 | **`<html>` vs `<body>`-bakgrundspropagering** | Om `<html>` INTE har egen bakgrund (varken färg eller bild) propagerar `<body>`s bakgrund till canvasen per CSS Backgrounds §2.11.2 — men bara DÅ. Har `<html>` en EGEN bakgrund (vilket vår kod har) sker INGEN propagering, och `<body>`s bakgrund stannar inom sin egen — gutter-krympta — box. | Console: sätt temporärt `document.body.style.background = 'red'` och observera om rännstenen färgas röd. Blir den INTE röd (vårt fall, eftersom `<html>` redan har en egen `background-color`) bekräftar det att propagering inte är den aktiva mekanismen just nu. | **RELEVANT MEN INTE PROBLEMET.** Redan korrekt hanterad i koden: `html[data-forberedelse-fond="true"]` har en egen färg (stänger av propagering, gör html:s EGNA färg auktoritativ), och en SEPARAT regel (`html[data-auth-fond="true"] body { background: transparent }` för login/inbjudan) tvingar body transparent så dess EGEN opaka `--mm-bg` inte målar över foto/gradient-lagren INUTI body (ett paint-ORDNINGS-problem i innehållsytan, inte ett propagerings-problem i rännstenen — två olika mekanismer som råkar kräva samma sorts fix). |
| 4 | **Viewport-enheters avrundning (`100vw` vs `100%`)** | Ett element satt till `100vw` blir BREDARE än den synliga viewporten på en sida med klassisk scrollbar (`100vw` räknar INTE bort scrollbarens bredd) — ger en SJÄLVFÖRVÅLLAD horisontell överflödning/egen scrollbar, ett helt annat symptom än en färgmissmatchning. | Console: `document.documentElement.scrollWidth > document.documentElement.clientWidth` → `true` avslöjar ett `100vw`-orsakat överflöde. | **UTESLUTEN för vår kod.** `Forberedelseskarm.tsx` använder `w-full` (100 %), inte `100vw`, någonstans i kedjan. Redan mätt och förkastad som teknik i S96 § 2.1 (kandidat 9): även när `100vw`+negativ margin TVINGADE fram en box som mätbart täckte hela viewporten, målades kanten ändå tom — bekräftar att detta inte ens är rätt ANGREPPSVINKEL, oavsett om vår kod använde tekniken. |
| 5 | **`background-attachment: fixed` + `background-size: cover`** | Attachment:fixed "frikopplar" bakgrunden från skrollning — bakgrunden STÅR STILL medan innehållet skrollar förbi. Ett helt annat visuellt tecken (rörelse-frikoppling) än en statisk kant-strimma. | Computed-panelen: `background-attachment: fixed`. Beteendetest: skrolla sidan och se om bakgrunden rör sig eller står stilla. | **UTESLUTEN.** Redan mätt i S96 (kandidat 3, 5): ändrar gradientens POSITIONERINGS-matematik marginellt (± 1–2 per kanal) men rör INTE klipp-gränsen — kanten förblir tom. Vår kod använder det inte (`Forberedelseskarm`s foto är ett vanligt `absolute inset-0`-lager, ingen `fixed`-attachment). |
| 6 | **Safe-area-insets / `env()`** | Reserverar utrymme för hak/home-indicator på NOTCHADE mobila enheter (iPhone i PWA-standalone-läge). Yttrar sig som en marginal vid EN specifik kant (oftast botten eller en sida i landskap), inte symmetriskt i båda. | Console: `getComputedStyle(document.documentElement).paddingLeft` efter en `env(safe-area-inset-*)`-regel — resolverar till `0px` på varje icke-notchad enhet/emulering. Kräver DevTools Device Toolbar med en notchad enhet (t.ex. "iPhone 15 Pro") för att alls vara mätbar. | **STRUKTURELLT OMÖJLIG för denna yta.** Vår `scrollbar-gutter`-regel gäller ENDAST `≥640px` bredd (`base.css` rad 92) — notchade telefoner ligger under den bredden och kör dessutom overlay-scrollbars (ingen gutter reserveras där alls). De två mekanismerna kan strukturellt inte samverka i denna kodbas. |

**Slutsats för del 1:** ytan är entydigt kandidat 1 (`scrollbar-gutter`-
rännstenen) — appens egen kod har redan rätt diagnos. Den öppna frågan är
inte VILKEN yta, utan VARFÖR den redan byggda motåtgärden inte räcker, vilket
§ 3 mäter.

## 2. Branschlösningarna

Rangordnat efter hur väl belagt och hur brett använt varje mönster är.

### 2.1 `background-color` på canvas-elementet — DEN etablerade lösningen (välbelagd, brett känd)

Detta ÄR standardmönstret, och det är redan implementerat i vår kod. Källor,
oberoende av varandra:

- **CSS Overflow Module Level 3 § 4.2** (redan citerad i S96, återbekräftad
  här): "the background of the scrollbar gutter must be painted as an
  extension of the padding" — spec-mandatet är att `background-color`
  (padding-liknande extension) är den enda garanterade målningsvägen.
  [w3.org/TR/css-overflow-3/#scrollbar-gutter-property](https://www.w3.org/TR/css-overflow-3/#scrollbar-gutter-property)
- **CSS-Tricks, bram.us, DEV Community, zachleat.com** (community-konsensus,
  sökt brett 2026-08-17): samtliga beskriver samma mönster utan variation —
  "sätt din bakgrundsfärg på root/body, den når gutter-ytan naturligt av sig
  själv." Ingen av dem föreslår något mer sofistikerat.
- **Tailwind CSS egen dokumentation** (`tailwindcss.com/docs/scrollbar-gutter`,
  hämtad 2026-08-17): exponerar utility-klasserna
  (`scrollbar-gutter-auto/stable/both-edges`, v4.3+) men nämner INGENTING om
  bakgrundsfärg-matchning i gutter-ytan — mönstret är så etablerat att det
  inte ens dokumenteras som ett separat problem.

**Detta är alltså inte en nyhet — det är redan applicerat korrekt i vår
kod.** Rangordningen här bekräftar att inget SEPARAT, bättre CSS-only-mönster
existerar i branschen som vi missat.

### 2.2 `color-scheme` — verifierat mot spec, RELEVANT men löser inte vårt problem

Uppdraget bad specifikt om att undersöka detta. Hämtat direkt ur primärkälla,
inte sekundärkälla (WebFetch-sammanfattningen antydde först fel omfattning —
se § "Vad jag inte kunde belägga" för den korrigeringen):

> "For all elements, the user agent must match the following to the used
> color scheme: the default colors of scrollbars and other interaction UI
> […] On the root element, the used color scheme additionally must affect
> the surface color of the canvas, and the viewport's scrollbars."
> — [CSS Color Adjustment Module Level 1, § 2.2 Effects of the Used Color Scheme](https://www.w3.org/TR/css-color-adjust-1/#color-scheme-effect)
> (verifierad rå HTML 2026-08-17, sektion `#color-scheme-effect`)

**Vad detta faktiskt betyder:** `color-scheme` styr canvasens **default**-yta
(inklusive gutter) NÄR inget author-`background-color` är satt — det är en
UA-fallback-mekanism, inte ett sätt att MATCHA ett foto. Ett explicit
`background-color` på `<html>` (vår situation) VINNER alltid över
`color-scheme`s automatik. `color-scheme` är alltså rätt verktyg för "se till
att en OSTYLAD sida inte visar en vit gutter i mörkt läge" — ett värdefullt,
billigt golv att sätta app-brett (`color-scheme: light dark` eller motsvarande
på `:root`, om det inte redan finns — INTE verifierat i denna kodbas, se §
Vad jag inte kunde belägga) — men det tillför NOLL för att matcha en specifik
bild, vilket är vårt faktiska problem.

### 2.3 Bootstrap `#42545` — den ENDA hittade produktionsfixen, men löser ett annat problem

Ny sedan S96-passet (som bara citerade det ÖPPNA issue-läget): Bootstrap
**stängde** `twbs/bootstrap#40659` genom en sammanslagen PR,
[`twbs/bootstrap#42545`](https://github.com/twbs/bootstrap/pull/42545)
("Dialog/Drawer: lock scroll on the root element to prevent layout shift"),
sammanslagen **2026-06-27** (bekräftat via `gh pr view`, `mergedAt` läst
direkt ur GitHub API, inte antaget ur en sammanfattning).

**Mekanismen, citerad ur PR-beskrivningen:**

> "Apply the `dialog-open` lock to the root element (`<html>`), co-locating
> `overflow: hidden` with `scrollbar-gutter: stable`. The gutter stays
> reserved while the scrollbar hides (no shift), and since `<html>` is the
> viewport scroller the `::backdrop` covers the gutter (no white strip)."

**Varför detta INTE överförs till vårt fall:** fixen fungerar för en nativ
`<dialog>`s `::backdrop` — ett **top-layer**-element med särskilda
målningsregler (samma särbehandling som diskuteras, ännu olöst, i
[`w3c/csswg-drafts#9904`](https://github.com/w3c/csswg-drafts/issues/9904),
öppen, senast uppdaterad 2026-06-19) — OCH kräver att scrollningen faktiskt
LÅSES (`overflow: hidden`) på SAMMA element som bär `scrollbar-gutter:
stable`. Vår Förberedelseskärm är varken en `<dialog>` eller scroll-låst —
den ska förbli en vanlig, icke-modal helskärmsyta utan att skrollningen
stängs av — Marcus-direktivet från S96 ("INGET får hoppa") gäller lika mycket
här, och att låsa scroll bara för denna färgmatchnings skull hade varit en
helt oproportionerlig sidoeffekt. **Detta är den enda produktionsfix jag
hittade för symptomet "vit gutter", och den bekräftar snarare S96:s tunna
precedens-slutsats än motsäger den:** ingen bibliotek löser "foto/gradient
i gutter-ytan för en ständigt synlig, icke-låst yta".

### 2.4 `::-webkit-scrollbar` / `scrollbar-color` — redan applicerat, orelaterat problem

Standardiserad styling av SJÄLVA scrollbar-widgeten (tumme/spår), inte
gutter-BAKGRUNDEN. Redan korrekt använt i vår kod
(`base.css`: `scrollbar-width: thin; scrollbar-color: var(--mm-scrollbar-thumb)
transparent`) — spåret är satt till `transparent` specifikt så att
gutter-bakgrunden (kamouflaget) syns IGENOM den, vilket är rätt
komposition. Ingen ny branschinsikt att hämta här; nämns för fullständighet
eftersom uppdraget efterfrågade det explicit.

### 2.5 `position: fixed; inset: 0; z-index: -1`-mönstret — redan TESTAT och FÖRKASTAT (S96)

Uppdraget frågade specifikt om detta löser problemet. Svaret finns redan,
mätt, i S96 (kandidat 6/7): **nej.** Ett `position:fixed`-lager med
`inset:0` KRYMPS till samma 1570/1600-box som allt annat när
`scrollbar-gutter:stable` är aktivt på root — elementets EGEN box blir
gutter-smal, så att flytta bakgrunden dit löser ingenting; det är samma
klipp-mekanism som drabbar `<html>` direkt. Detta pass gjorde ingen ny
mätning av detta (S96:s är entydig och färsk), men bekräftar att
CSSWG-ärendet `#9904` (§ 2.3 ovan) diskuterar EXAKT denna begränsning för
top-layer-element specifikt — vanliga `position:fixed`-element (icke
top-layer) omfattas inte av den diskussionen alls.

### Rangordning, sammanfattat

| Rang | Lösning | Belägg | Löser VÅRT problem? |
|---|---|---|---|
| 1 | `background-color` på canvas-elementet (`<html>`) | Spec-mandat + universell community-konsensus + redan i vår kod | Delvis — se § 3 för gränserna |
| 2 | `color-scheme` som app-brett golv | Spec-verifierat (§2.2) | Nej, för vårt specifika foto-matchnings-problem |
| 3 | Bootstrap-mönstret (root-scroll-lock + native `::backdrop`) | En (1) verifierad produktionsfix | Nej — fel elementklass, fel scroll-läge |
| — | `position:fixed`-bakgrundslager | Redan förkastat, mätt (S96) | Nej |
| — | `100vw`+negativ margin | Redan förkastat, mätt (S96) | Nej |

## 3. Läsning av vår kod + ny mätning — varför strimman syns trots fixen

### 3.1 Koden, som den faktiskt ser ut

Sökt på "rännsten", "gutter", "kamouflage" i `src/` (repots egen
sanningskälla, inte antaget ur commit-meddelanden). Mekanismen:

- `src/components/AppShell/Forberedelseskarm.tsx` rad 297–310: en
  referensräknad `useEffect` sätter `data-forberedelse-fond="true"` på
  `document.documentElement` vid mount, tar bort den vid sista unmount
  (`/dev/primitives` renderar tre instanser samtidigt — referensräkningen
  finns för att hantera det).
- `src/styles/base.css` rad 187–189: `html[data-forberedelse-fond="true"] {
  background-color: var(--mm-forberedelseskarm-fond-kamouflage); }` — en
  ren `background-color`, exakt § 2.1-mönstret.
- `src/styles/tokens/components.css` rad 386: `--mm-forberedelseskarm-fond-kamouflage:
  color-mix(in srgb, var(--mm-bg) 85%, #888a6b);` — `--mm-bg` är
  `--p-neutral-0` = `#ffffff` (verifierat, `primitives.css` rad 174).
  `#888a6b` är en TIDIGARE mätt medelfärg av fotots **kantkolumner** (2 %
  bredd = 32 px, hela bildhöjden 1061 px), inte hela bildens medelfärg (en
  tidigare, för ljus, version fanns i runda 1 av samma skiva och rättades i
  runda 2 — commit `00ccc852`, se kommentaren i filen).

Detta ÄR § 2.1-mönstret, korrekt applicerat. Ingen bugg i implementationen
mot S96:s recept.

### 3.2 Mätningen: matchar kamouflaget fotot i PRAKTIKEN?

Byggde en isolerad repro (scratchpad, ej committad) med den ÄKTA
`public/roger-och-lotta.webp` och ordagrant samma CSS som ovan
(`scrollbar-gutter: stable both-edges !important` ≥640 px, samma
`color-mix`-uttryck, samma `bg-cover bg-center`-fotolager + 85 %-scrim).
Mätte pixelfärgen PRECIS i gutter-remsan mot pixelfärgen PRECIS innanför
kroppens kant (den faktiska synliga fotokanten) vid fem lodräta punkter, i
fem realistiska fönsterstorlekar.

**Rännstenens mätta bredd i alla fem viewports: 11 px per sida** — matchar
`base.css`s kommentar från S72/S96 exakt, oberoende bekräftat i en NYARE
Chromium-build (151.0.7922.34 mot S96:s 149.0.7827.55).

**Breda (landskap) viewports — kamouflaget håller relativt väl:**

| Viewport | Aspekt | Största mätta avvikelse (0–255-skala, medel över R/G/B) |
|---|---|---|
| 1440×900 | 1,60 | 18 (endast vid ett enda mätpunkt, botten-höger) — övriga 0–8 |
| 1920×1080 | 1,78 | 6 |

**Smala/höga viewports — kamouflaget missar dramatiskt vid vissa punkter:**

| Viewport | Aspekt | Mätt seampixel | Kamouflagets färg | Avvikelse |
|---|---|---|---|---|
| 640×900 (exakt tröskelbredden) | 0,71 | **rgb(255,255,255)** | rgb(237,237,233) | 19 |
| 800×1200 | 0,67 | **rgb(255,255,255)** | rgb(237,237,233) | 19 |
| 1024×1366 | 0,75 | rgb(231,231,230) / rgb(237,238,240) | rgb(237,237,233) | 12–20 |

Vid de tre smala fallen är sömpixeln **exakt eller nästan exakt vitt**
(255,255,255) direkt mot kamouflagets `rgb(237,237,233)` — en skarp, väl
synlig gräns. Detta är, mätt med den riktiga bilden, **exakt** det Marcus
beskrev.

**Zoomade skärmdumpar** (60 px bred remsa, vänsterkant, 640×900;
40 px bred remsa, högerkant, 1440×900) bekräftar visuellt: en distinkt
sage-tonad kolumn (kamouflaget) bredvid en tydligt varmare/vitare
fotoyta, med en skarp, följbar lodrät linje däremellan — precis den typ av
gräns som är svår att kamouflera bort ens vid ett litet numeriskt RGB-gap,
eftersom ögat är starkt känsligt för RAKA kanter (simultankontrast), inte
bara för absoluta färgskillnader.

### 3.3 Rotorsaken till missmatchningen: `cover` byter beskärningsaxel vid smalare fönster

`background-size: cover` skalar bilden så att BÅDA dimensionerna täcker
behållaren, och beskär den dimension som "sticker ut". Fotots
sidförhållande är **1600/1061 ≈ 1,508** (verifierat, `sharp` metadata).

- **Vid viewport-aspekt ≥ 1,508** (bredare/flackare än fotot — de flesta
  maximerade landskapsfönster): `cover` beskär LODRÄTT (topp/botten).
  Bildens FULLA bredd visas, alltså är pixeln som möter rännstenen
  fortfarande fotots EGEN kant — precis det antagande "kantkolumnerna"-
  mätningen (§ 3.1) byggde på. Håller relativt väl (§ 3.2, breda kolumnen).
- **Vid viewport-aspekt < 1,508** (smalare/högre än fotot — halvskärms-läge,
  ett fönster nära 640 px-tröskeln, en portrait-orienterad platta): `cover`
  beskär i SIDLED i stället. Bildens fulla HÖJD visas, men bredden krymps
  in mot MITTEN — pixeln som möter rännstenen är INTE längre fotots
  kantkolumn, utan en skiva närmare bildens HORISONTELLA MITT (i vårt
  foto: Roger & Lottas vita/ljusa kläder, alltså riktigt nära rent vitt).
  Detta är EXAKT källan till 255,255,255-missmatchningen i § 3.2.

Detta CSS-beteende är dokumenterat MDN-standard
(`background-size: cover`) — mekanismen i sig är inte kontroversiell, det
är samspelet med en flat-färgs-kamouflage tunet mot BARA det ena
beskärningsfallet som inte var testat tidigare.

### 3.4 Testad motåtgärd: ett andra kamouflage-värde för smala fönster — HJÄLPER, LÖSER INTE

Eftersom brytpunkten är exakt beräkningsbar (fotots egen aspect-ratio)
byggde jag och mätte en andra CSS-regel: ett kamouflage-värde sampla ur
bildens HORISONTELLA MITTKOLUMN (samma 2 %-metodik som kantkolumnerna,
bara centrerad) i stället för kantkolumnerna, gated bakom
`@media (max-aspect-ratio: 1600/1061)`:

```css
--mm-forberedelseskarm-fond-kamouflage-smal: color-mix(in srgb, var(--mm-bg) 85%, rgb(223,223,225));
```

(mittkolumnens uppmätta medelfärg: `rgb(223,223,225)`, `sharp`-extraherad ur
den faktiska filen — betydligt ljusare än kantfärgen `rgb(136,138,107)`,
vilket bekräftar § 3.3:s hypotes direkt).

**Resultat, mätt i samma harness:** den DRAMATISKA vita missmatchningen vid
fönstrets topp/botten (y ≈ 5 %/95 %) FÖRSVINNER nästan helt — avvikelsen
föll från 19 till 5 vid 640×900 och 800×1200. **Men en NY, likvärdigt stor
missmatchning uppstår i MITTEN** (y ≈ 50 %): avvikelsen där steg från 5 till
**19–20** vid samma viewports. Största uppmätta avvikelse totalt sett ändrades
INTE (18–20 i båda varianterna) — bara VAR i bilden den sitter flyttades.

**Strukturell slutsats, mätt inte antagen:** ett bakgrundslager kan bara
någonsin visa EN flat `background-color` i rännstenen (bekräftat i S96 —
`background-image`, inklusive en lodrät gradient som skulle kunna följa
fotots verkliga färgvariation längs Y-axeln, målas ALDRIG där). Fotots FAKTISKA
färg varierar rejält längs höjden (ett ansikte/hår mot en ljus tröja mot en
mörkare bakgrund) OAVSETT vilken X-skiva som råkar visas — så INGEN enda
flat färg, hur den än samplas, kan matcha hela höjden samtidigt. Ett
tvåhinks-värde flyttar var missmatchningen sitter; det eliminerar den inte.

## Dom

**Ytan är `scrollbar-gutter: stable both-edges`-rännstenen — redan korrekt
diagnostiserad i koden.** Ingen av de fem andra kandidatytorna
(overscroll-studs, viewport-enhetsrundning, `background-attachment:fixed`,
safe-area-insets, ren propageringsbugg) matchar symptomet eller är ens
nåbar i denna app, mätt/resonerat post för post i § 1.

**Den redan implementerade kamouflage-fixen (§ 2.1-mönstret,
branschstandard, spec-belagd) är KORREKT till sin FORM, men dess
KALIBRERING var bara verifierad för ETT beskärningsfall.** Mätt med den
faktiska bilden i fem realistiska fönsterformat (§ 3.2): fixen håller
relativt väl i breda/landskaps-fönster (sidförhållande ≥ ~1,51 — de flesta
maximerade skärmar) men missar DRAMATISKT (upp mot exakt vitt mot en
sage-ton, en skarp synlig gräns) i smalare/högre fönster — vilket bland
annat inkluderar precis den bredd (640 px) där rännstenen först aktiveras,
och varje halvskärms-delat arbetsläge, ett realistiskt scenario för ett
admin-verktyg som ofta körs bredvid andra fönster.

**Rotorsaken är `background-size: cover`s beskärningsaxel-byte** vid
viewport-sidförhållanden smalare än fotots egna (1,508) — mätt och
bekräftat genom att extrahera fotots faktiska mittkolumnsfärg och visa att
den, INTE kantfärgen, är vad som faktiskt möter rännstenen i de smala
fallen.

**Inget CSS-only-recept kan lösa detta HELT** — bekräftat genom att
faktiskt BYGGA och MÄTA en till synes bättre tvåhinks-variant: den flyttar
missmatchningen (från topp/botten till mitten) men eliminerar den inte,
eftersom gutter-ytan strukturellt bara kan visa EN flat färg medan fotot
varierar längs hela höjden. Detta är samma "måla-lager-klipp"-tak som
S96 redan fastslog för `background-image` — den här mätningen visar att
taket gäller lika mycket för hur bra en `background-color`-approximation
NÅGONSIN kan bli mot en riktig fotografisk bild.

## Vad jag inte kunde belägga

1. **Om `color-scheme` faktiskt är satt någonstans i appen** (`:root` eller
   motsvarande) är INTE verifierat i detta pass — grep:ades inte. Om den
   saknas helt är det ett billigt, generellt förbättringsförslag (§ 2.2) men
   OBEROENDE av rännsten-strimman, och detta pass kan inte uttala sig om
   nuvarande status.
2. **En första WebFetch-sammanfattning av `color-scheme`-specen påstod
   felaktigt** att egenskapen "does NOT control scrollbar-gutter" utan
   nyansen om canvas-ytan — korrigerat genom att läsa rå spec-HTML direkt
   (§ 2.2). Noterat explicit eftersom disciplinen kräver det: en
   sekundärkälle-sammanfattning var missvisande tills primärkällan lästes
   själv.
3. **En WebSearch-syntes påstod att "CSSWG agreed" att top-layer-element ska
   ignorera gutter-reservationen** (`#9904`). Verifierat FALSKT genom att
   läsa ärendet direkt via `gh issue view`: det är fortfarande en ÖPPEN
   FRÅGA ("Maybe the top layer fixed-pos containing block should actually
   start at zero…?"), ingen resolution, inget merge. Sökverktygets egen
   sammanfattning överdrev alltså en spec-diskussion till en beslutad
   regel — flaggat här som en konkret instans av "verifiera, gissa
   aldrig", inte bara en generell varning.
4. **Marcus faktiska fönsterstorlek/sidförhållande vid granskningen är
   inte känd av mig.** Jag har mätt fem REALISTISKA storlekar, inte HANS
   specifika. Om hans fönster råkar ligga i den breda (landskaps-)
   kategorin borde missmatchningen vara liten (0–8/255) enligt denna
   mätning — vilket i så fall pekar mot att strimman han ser är
   PERCEPTUELLT mer påtaglig än en ren RGB-diff antyder (simultankontrast
   vid en skarp, 11 px bred, helskärmshög linje), snarare än det dramatiska
   255-mot-237-fallet. Båda förklaringarna pekar mot SAMMA
   rotorsaksklass (en flat färg mot en varierande bild) men med olika
   allvarlighetsgrad — jag kan inte avgöra vilken utan hans faktiska
   fönstermått.
5. **Firefox/WebKit är INTE mätta i detta pass** (samma lucka som S96
   lämnade öppen, se den filens § 5) — allt ovan gäller verifierat
   Chromium (151.0.7922.34, nyare än S96:s 149.0.7827.55, samma beteende
   höll).
6. **Om `overflow-y` explicit sätts någonstans i kedjan** (utöver
   `scrollbar-gutter`) på ett sätt som kunde ändra gutter-reservationens
   faktiska aktivering är inte grepad separat i detta pass — jag litar på
   den redan etablerade, flera gånger CI-verifierade 11 px-mätningen i
   `base.css`s egna kod-kommentarer och min egen ombekräftelse av samma
   tal.

## Rekommendation

Detta är en rekommendation, inte ett beslut — Marcus avgör vägen.

**Sätt förväntan korrekt innan något mer byggs:** den nuvarande fixen är
INTE trasig eller fel implementerad — den är branschstandard-mönstret,
korrekt applicerat, och löser problemet helt i det VANLIGASTE fallet
(breda/maximerade fönster). Vad den inte kan göra är att vara pixel-perfekt
mot en riktig fotografisk bild i VARJE fönsterformat — och ingen känd CSS-
eller JS-teknik (mätt, inte antaget, § 3.4) kan ändra på det taket helt.

**Om Marcus fönster vid granskningen var i den smala kategorin (< ~1,51
sidförhållande — t.ex. ett delat halvskärmsläge):** den näst-billigaste,
redan mätta åtgärden (§ 3.4) — ett andra `color-mix`-värde samplat ur
bildens mittkolumn, gated bakom `@media (max-aspect-ratio: 1600/1061)` —
är värd att landa. Den är samma mönster, samma kostnad (en ny CSS-token +
en media query) som den befintliga fixen, och den TAR BORT den mest
uppseendeväckande felklassen (en skarp, nästan exakt vit linje) även om
den inte gör missmatchningen noll. Detta är EN rad kod-mönster som redan
finns i filen, inte en ny abstraktion — bedöms INTE som over-engineering
givet att det är ett Marcus-rapporterat, mätt, kvarstående fel.

**Rekommenderas INTE just nu:** en JS-baserad canvas-pixel-sampling-lösning
(läs den faktiska renderade kantpixeln dynamiskt vid varje storleksändring).
Mätningen i § 3.4 visar att ÄVEN en perfekt vald färg per viewport bara
FLYTTAR missmatchningen, inte eliminerar den — den extra komplexiteten
(en `ResizeObserver`, en offscreen-canvas, CSP/taint-hänsyn) köper alltså
inte en proportionerlig förbättring. Om § 3.4-fixen visar sig fortsatt
otillräcklig efter att Marcus granskat den, är det rätt tillfälle att
omvärdera — inte innan.

**Minimalt test FÖRE en eventuell implementation** (repots egen disciplin):
harnessen som byggde denna mätning ligger kvar, ej committad, i
`/private/tmp/claude-501/…/scratchpad/rannsten-repro/` (fil-URL-baserad
Playwright-repro med den äkta bilden och ordagrant produktions-CSS). Innan
§ 3.4-fixen (eller någon annan) landas: kör om samma harness med den
FÖRESLAGNA CSS-ändringen mot samtliga fem viewports och verifiera att (a)
den smala kategorins värsta avvikelse sjunker, och (b) den breda
kategorins REDAN GODA värden inte regredierar (media queryn ska vara
disjunkt från den befintliga regeln). Detta är samma "2 noder, 1 linje"-
princip som `~/.claude/CLAUDE.md` kräver, applicerad på CSS via pixelmätning
i stället för på kod via enhetstest.

## Källförteckning

**Primärkällor, verifierade mot rå källa i detta pass:**

- [CSS Overflow Module Level 3 — § 4.2 scrollbar-gutter](https://www.w3.org/TR/css-overflow-3/#scrollbar-gutter-property)
  (återanvänd citering, redan verifierad i S96)
- [CSS Color Adjustment Module Level 1 — § 2.2 Effects of the Used Color
  Scheme](https://www.w3.org/TR/css-color-adjust-1/#color-scheme-effect)
  — hämtad rå HTML 2026-08-17, citat verifierat mot källtext (`curl` + grep
  mot `/TR/css-color-adjust-1/`, sektion `color-scheme-effect`)
- [w3c/csswg-drafts#8099](https://github.com/w3c/csswg-drafts/issues/8099) —
  status verifierad ÖPPEN via `gh issue view` 2026-08-17 (`updatedAt`
  2025-03-10)
- [w3c/csswg-drafts#5232](https://github.com/w3c/csswg-drafts/issues/5232) —
  status verifierad ÖPPEN via `gh issue view` 2026-08-17 (`updatedAt`
  2025-05-29)
- [w3c/csswg-drafts#9904](https://github.com/w3c/csswg-drafts/issues/9904) —
  status verifierad ÖPPEN via `gh issue view` 2026-08-17 (`updatedAt`
  2026-06-19, nyaste av de tre); innehåll verifierat via `gh issue view
  --json body,comments` — INGEN resolution, motsäger en felaktig
  WebSearch-syntes (se § Vad jag inte kunde belägga punkt 3)
- [twbs/bootstrap#40659](https://github.com/twbs/bootstrap/issues/40659) —
  status STÄNGD, `stateReason: COMPLETED`, verifierad via `gh issue view`
  2026-08-17
- [twbs/bootstrap#42545](https://github.com/twbs/bootstrap/pull/42545) —
  sammanslagen PR, `mergedAt: 2026-06-27T03:15:08Z`, läst i sin helhet via
  `gh pr view --json body,files,state,mergedAt`

**Tredjekälla (community-konsensus, sökt 2026-08-17, ingen enskild källa
central nog för egen sektion):**

- [Tailwind CSS — scrollbar-gutter docs](https://tailwindcss.com/docs/scrollbar-gutter)
- [tailwindlabs/tailwindcss Discussion #5430](https://github.com/tailwindlabs/tailwindcss/discussions/5430)
- [tailwindlabs/tailwindcss Discussion #11129](https://github.com/tailwindlabs/tailwindcss/discussions/11129)
- [bram.us — Prevent unwanted Layout Shifts caused by Scrollbars](https://www.bram.us/2021/07/23/prevent-unwanted-layout-shifts-caused-by-scrollbars-with-the-scrollbar-gutter-css-property/)
- [zachleat.com — A tiny bit-o-CSS for Stable Scrollbar Gutters](https://www.zachleat.com/web/stable-scrollbar-gutters/)
- [CSS-Tricks — scrollbar-gutter almanac-post](https://css-tricks.com/almanac/properties/s/scrollbar-gutter/)

**Repo-interna källor:**

- [`docs/research/full-bredds-fond-scrollbar-gutter-2026-08-03.md`](full-bredds-fond-scrollbar-gutter-2026-08-03.md)
  — S96, grundforskningen detta pass bygger vidare på
- `src/styles/base.css` rad 87–195 (§ RÄNNSTENS-KAMOUFLAGE + § FULL-BREDDS-FOND)
- `src/styles/tokens/components.css` rad 330–386
- `src/components/AppShell/Forberedelseskarm.tsx` (helhet, inkl. rad 297–310)
- `tasks/sessions/2026-08-17-session-107.md` Del 6 (Marcus-fångsten, citatet
  som utlöste detta pass)
- Commit `00ccc852` (TASK-276 runda 2, kamouflage-omräkningen mot
  kantkolumner) och `5d2d0735` (TASK-276 runda 1, kamouflagets första
  landning)
- Sökt, inga träffar för denna specifika fråga: `tasks/lessons.md` (grep
  "rännsten|gutter|kamouflage|scrollbar" — 0 rader; närmaste grannar
  `L311/L312/L341/L342` gäller RAC-overlayers canvas-origo-FÖRSKJUTNING,
  en annan symptomklass), `docs/decisions/` (grep, enda träff
  `ADR-019-background-sync-defer.md`, orelaterad namnkrock)

**Egen mätning:** Playwright 1.62.1, HeadlessChrome 151.0.7922.34, `sharp`
0.35.3 (repots egen version). Fem viewports (640×900, 800×1200, 1024×1366,
1440×900, 1920×1080), fem lodräta mätpunkter vardera, båda kanterna, den
äkta `public/roger-och-lotta.webp` och ordagrant produktions-CSS. Rådata,
repro-HTML och mätskript (ej committade, utanför repot per uppdrag):
`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/34a858c8-1fd4-4cf5-9e41-13475e90871e/scratchpad/rannsten-repro/`.
