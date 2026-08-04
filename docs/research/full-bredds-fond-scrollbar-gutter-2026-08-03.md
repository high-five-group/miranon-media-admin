---
owner: marcus803
updated: 2026-08-03
review_by: 2027-02-03
status: draft
---

# Kan en bakgrund täcka en `scrollbar-gutter: stable both-edges`-reserverad yta? (Code, 2026-08-03)

> **Proveniens:** avgränsat research-pass 2026-08-03, beställt direkt av Marcus
> efter tre misslyckade egna försök att få auth-vyernas gradient (login +
> inbjudan) att nå kant till kant utan att röra `src/styles/base.css` rad
> 87–98 (`scrollbar-gutter: stable both-edges !important` på `html`, ≥ 640px).
> Ingen kod i `src/` är rörd av detta pass. Reproduktionen och mätscriptet
> ligger utanför repot, i scratchpad
> (`/private/tmp/claude-501/.../scrollbar-gutter-repro/`), och committas inte.
>
> **Mätning före citat, konsekvent.** 13 kandidat-sidor byggdes (`pages/0-…`
> till `pages/12-…`) och mättes med Playwright **1.61.1** i tre motorer:
> HeadlessChrome **149.0.7827.55**, Firefox **151.0**, WebKit/Safari
> **26.5** (AppleWebKit 605.1.15) — samtliga Playwrights egna bundlade
> browser-builds, körda på värdmaskinens macOS (Darwin 25.5.0). Viewport
> 1600×900 (matchar uppdragets x-koordinater). Varje mätning läser en 1×1
> `page.screenshot({clip})`, avkodar rå RGBA med `sharp`, och jämför både
> md5-hash och rå-RGB — inte bara hash, för att kunna visa den faktiska
> kulören i tabellerna nedan.

## Kort svar

**Nej — inte pixel-perfekt, och inte med någon av de 13 testade teknikerna,
i Chromium (149).** `scrollbar-gutter: stable both-edges` på `html` gör att
Chromium klipper MÅLNINGEN (inte bara layouten) vid gutter-gränsen för allt
som räknas som ett `background-image` — gradient, `url()`, eller ett
`position:fixed`-element med en bild-bakgrund — oavsett hur elementets EGEN
box är dimensionerad. Detta gäller även när ett elements `getBoundingClientRect()`
bevisligen täcker hela viewporten (0–1600 av 1600, uppmätt, kandidat 9 och 10).

**Men en `background-color` (platt, ingen bild) MÅLAS korrekt ut i gutter-ytan
— om den sitter på canvas-bakgrunden (`html`/propagerad `body`).** Det är den
enda målningsvägen som fungerar av alla 13 testade, och den ger en fungerande,
om än approximativ, lösning: lägg en platt "kamouflage"-färg som
`background-color` UNDER den riktiga gradienten (`background-image`) på
`html`. Gutter-remsan (11–17 px typiskt) visar då en enfärgad ton i stället
för dagens vita/tomma glipa — inte gradientens exakta matematiska fortsättning,
men heller inte ett synligt hål. Se § Rekommendation.

**Rännstenens bredd är ORÖRD i varje testad teknik** — ingen av dem ändrar
`scrollbar-gutter`-regeln, villkorar den, eller stänger av den. Hopp-kravet
är därmed inte i konflikt med någon av slutsatserna nedan.

**Cross-browser är ofullständigt mätt, och det ska sägas rakt ut:** i denna
testmiljö (macOS, Playwright-bundlade Firefox + WebKit) reserverade VARKEN
Firefox eller WebKit någon gutter-yta alls — `body`s bredd förblev 1600 av
1600 i alla 13 kandidater, mot Chromiums 1570 av 1600. Se § 5 för varför, och
§ Vad jag inte kunde belägga för vad det betyder för slutsatsens räckvidd.

---

## 1. Vad säger CSS-specen om bakgrunds-propagering och `scrollbar-gutter`?

### 1.1 Canvas-bakgrunden (CSS Backgrounds Level 3 § 2.11)

Hämtat direkt ur `https://www.w3.org/TR/css-backgrounds-3/` (rå HTML,
sparad lokalt och grep:ad för exakt citat, 2026-08-03):

> "The background of the root element becomes the canvas background and its
> background painting area extends to cover the entire canvas. However, any
> images are sized and positioned relative to the root element's box as if
> they were painted for that element alone. (In other words, the background
> positioning area is determined as for the root element.) The root element
> does not paint this background again, i.e., the used value of its
> background is transparent."
> — [CSS Backgrounds and Borders Module Level 3, § 2.11.1](https://www.w3.org/TR/css-backgrounds-3/#root-background)

Och för propagering från `body` (§ 2.11.2, samma sida):

> "if the computed value of background-image on the root element is none and
> its background-color is transparent, user agents must instead propagate the
> computed values of the background properties from that element's first
> HTML BODY or XHTML body child element. The used values of that BODY
> element's background properties are their initial values, and the
> propagated values are treated as if they were specified on the root
> element."

**Två separata påståenden i samma stycke, och det är den andra som är
avgörande för vårt fall:** (1) *painting area* ska täcka **hela canvasen**
— alltså, i teorin, även gutter-remsan. (2) Men *positioning area* — boxen
som gradientens 0%/100%-stopp beräknas mot — är **root-elementets EGNA box**,
inte canvasen. Det är denna distinktion (målnings-yta vs. positionerings-yta)
som gör att en naiv läsning ("painting area extends to cover the entire
canvas" ⇒ "det borde funka") inte håller i praktiken — se § 2 för det
uppmätta avsteget från punkt (1).

### 1.2 `scrollbar-gutter` på root-elementet (CSS Overflow Level 3 § 4.2)

Hämtat ur `https://www.w3.org/TR/css-overflow-3/`, samma metod:

> "When the scrollbar gutter is present but the scrollbar is not, or the
> scrollbar is transparent or otherwise does not fully obscure the scrollbar
> gutter, the background of the scrollbar gutter must be painted as an
> extension of the padding. As for the overflow property, when
> scrollbar-gutter is set on the root element, the user agent must apply it
> to the viewport instead, and the used value on the root element itself is
> scrollbar-gutter: auto. However, unlike the overflow property, the user
> agent must not propagate scrollbar-gutter from the HTML body element."
> — [CSS Overflow Module Level 3, § 4.2](https://www.w3.org/TR/css-overflow-3/#scrollbar-gutter-property)

Detta är nyckelmeningen: **"the user agent must apply it to the viewport
instead"** — `scrollbar-gutter: stable both-edges` på `html` är alltså per
spec INTE en egenskap hos `html`s egen box (dess used-value är `auto`), utan
en instruktion till webbläsaren att krympa/förskjuta **viewporten** (den
initiala innehållande blocket, ICB). Specen säger också att gutter-ytan ska
"målas som en förlängning av paddingen" — men den formuleringen gäller den
generella (icke-root) fallet; för root-fallet är hela mekanismen omdirigerad
till viewport-nivå, och specen ger ingen motsvarande garanti där.

### 1.3 `background-attachment: fixed` och positionerings-ytan (§ 2.5, § 2.8)

> "fixed — The background is fixed with regard to the viewport."
> — [§ 2.5](https://www.w3.org/TR/css-backgrounds-3/#the-background-attachment)

Och för positioneringsytan när attachment är `fixed` (§ 2.8, samma källa):

> "If the background-attachment value for this layer is fixed, then this
> property [background-origin] has no effect: in this case the background
> positioning area is the initial containing block."
> — [§ 2.8](https://www.w3.org/TR/css-backgrounds-3/#the-background-origin)

Så `background-attachment: fixed` byter POSITIONERINGS-ytan till ICB — men
rör INTE painting-area/clip-frågan. Det här förklarar den uppmätta
mikro-skillnaden i § 5, och varför tekniken ändå inte löser huvudproblemet.

**Sammanfattning av specens löfte vs. det uppmätta gapet:** specen lovar att
canvas-bakgrundens *painting area* täcker hela canvasen. Mätningen i § 2 visar
att Chromium 149, när `scrollbar-gutter: stable` är aktiv på root, INTE
uppfyller det löftet för `background-image` — påvisat direkt, inte antaget.

---

## 2. Går det överhuvudtaget? — mätt, kandidat för kandidat (Chromium 149)

Alla kandidater kör samma gradient (`linear-gradient(to right, #7c3aed 0%, #f59e0b 100%)`
— horisontell, för att isolera x-axeln rent; produktionens
`to bottom right` med tokens ändrar inget i mekanismen, se § Vad jag inte
kunde belägga för den enda öppna frågan kring det). Viewport 1600×900,
`scrollbar-gutter: stable both-edges` på `html` i alla utom kandidat 0
(kontroll). Chromium reserverar mätbart **30 px totalt** (15 px per kant):
`body`/`html.offsetWidth` = **1570** av 1600, `body.getBoundingClientRect().left`
= **15** — konsekvent i alla kandidater 1–12.

| # | Teknik | x=3 | x=60 | x=1592 | x=1597 | Dom |
|---|---|---|---|---|---|---|
| 0 | Kontroll: **ingen** `scrollbar-gutter` | (125,59,237) | (128,61,228) | (244,157,12) | (245,158,12) | Gradient når kant — bekräftar mätmetoden |
| 1 | **Baseline** (nuvarande `base.css`): gradient på `html`, `body` transparent | **(255,255,255)** | (128,61,231) | **(255,255,255)** | **(255,255,255)** | Reproducerat: vit/tom glipa |
| 2 | Gradient på `body`, ingen `html`-bakgrund (propagerings-vägen) | (255,255,255) | (128,61,231) | (255,255,255) | (255,255,255) | Identiskt med #1 — propagering ändrar inget |
| 3 | `html { background-attachment: fixed }` | (255,255,255) | (129,62,229) | (255,255,255) | (255,255,255) | Samma glipa; mitten-tonen skiftar marginellt (§5) |
| 4 | `html { background-size: 100vw 100vh }` | (255,255,255) | (128,61,231) | (255,255,255) | (255,255,255) | Ingen effekt på glipan |
| 5 | attachment:fixed + size:100vw 100vh kombinerat | (255,255,255) | (129,62,229) | (255,255,255) | (255,255,255) | Ingen effekt på glipan |
| 6 | `position:fixed;inset:0`-div, `z-index:-1` | (255,255,255) | (128,61,231) | (255,255,255) | (255,255,255) | Elementets EGEN box krymps till 1570 (mätt, se § 5.2) |
| 7 | `html::before { position:fixed; inset:0 }` | (255,255,255) | (128,61,231) | (255,255,255) | (255,255,255) | Samma som #6 |
| 8 | Gradient på `body` (ej propagerad, dekoy `html{background:#000}`), attachment:fixed+size | **(0,0,0)** | (128,61,228) | **(0,0,0)** | **(0,0,0)** | Kanten visar dekoyen, inte gradienten — `body`s EGEN box slutar vid gutterns kant |
| 9 | `w-100vw` + `margin-left: calc(50% - 50vw)` (Marcus försök 1, reproducerat isolerat) | (255,255,255) | (129,62,229) | (255,255,255) | (255,255,255) | Elementets box mätt **exakt** 0–1600 (`getBoundingClientRect`) — ändå tom glipa |
| 10 | JS-mätt `position:fixed` med explicit `left`/`width` i px (ej `inset:0`) | (255,255,255) | (128,61,228) | (255,255,255) | (255,255,255) | Samma som #9 — se § 2.1 |
| 11 | **Kontroll:** platt `background-color` på `html`, INGEN bild | **(124,58,237)** | (124,58,237) | **(124,58,237)** | **(124,58,237)** | Målas korrekt överallt — se § 2.2 |
| 12 | `background-color` (kamouflage) **under** `background-image` (gradient) på `html` | **(185,149,161)** | (128,61,231) | **(185,149,161)** | **(185,149,161)** | Fungerande kompromiss — se § Rekommendation |

Rådata: `out/results.json` i scratchpad-repot (13 sidor × 3 motorer × 5
x-punkter, md5 + rå-RGBA per punkt).

### 2.1 Den viktigaste enskilda mätningen i passet

Kandidat 9 och 10 slår hål på den mest naturliga hypotesen — att problemet
bara är att elementets EGEN box blir för smal. Båda konstruerades för att
tvinga fram en box som TVERTOM är bevisat exakt viewport-bred:

- **#9** (`w-100vw` + negativ margin — samma teknik Marcus redan mätte och
  förkastade i sitt första försök): `getBoundingClientRect()` gav
  `{x: 0, width: 1600, right: 1600}` — pixel-exakt hela viewporten.
- **#10** (JS läser `window.innerWidth - document.documentElement.offsetWidth`
  och sätter `left`/`width` explicit i px på ett `position:fixed`-element, i
  stället för `inset:0`): samma resultat, `{x: 0, width: 1600, right: 1600}`.

**Ändå målas kanten tom i båda.** Det betyder att felet INTE sitter i
layout/box-modellen (dit alla tre "vanliga" fix-idéer — `100vw`, `fixed`,
JS-mätning — siktar), utan i ett **måla-lager-klipp** vid gutter-gränsen som
appliceras oavsett hur boxen som ska målas är dimensionerad. Det förklarar
exakt varför Marcus första försök gav "rätt mått i headless men löste inte
det i riktig webbläsare" (`base.css` rad 108–110): måttet VAR rätt, men
målningen klipptes ändå.

### 2.2 Den andra viktiga mätningen: `background-color` klarar sig, `background-image` gör det aldrig

Kandidat 11 bevisar att en helt vanlig, platt `background-color` på `html`
målas **perfekt likformigt** över hela bredden, gutter inkluderad — alla fem
x-punkter identiska (124,58,237). Det är alltså inte "gutter-ytan är
omålningsbar" som generell regel.

Men det gäller EJ generellt för alla element: samma platta färg testad på ett
`position:fixed;inset:0`-element (fristående extra-test, inte i
huvudmatrisen) gav **fortfarande** tom kant — (255,255,255) vid x=3/1592/1597,
mot (0,255,0) i mitten. Alltså: undantaget "platt färg målas i gutter-ytan"
gäller **specifikt canvas-bakgrunds-mekanismen** (§ 2.11 — `html`/propagerad
`body`), inte position:fixed-element i allmänhet. Det är en skarp, smal
lucka — men den räcker för § Rekommendation.

---

## 3. `background-attachment: fixed` tvärs Chromium / Firefox / WebKit

Uppdraget bad specifikt om detta. Det mätbara svaret är **delvis**, av ett
konkret skäl:

**Chromium (149):** `background-attachment: fixed` mätbart ändrar
gradientens MITTEN-toner (positionerings-ytan blir ICB i stället för
root-boxen, per § 1.3): x=60 går från (128,61,231) i baseline till
(129,62,229) med attachment:fixed; x=800 från (185,108,124) till
(186,109,122). Skillnaden är liten (± 1–2 per kanal) men konsekvent
reproducerbar över flera körningar. Kanterna (x=3/1592/1597) förblir dock
identiskt vita i båda — attachment:fixed rör alltså positionerings-matematiken,
inte klipp-gränsen.

**Firefox (151.0) och WebKit (26.5):** **inte mätbart** i denna miljö, av ett
skäl som är viktigt att redovisa öppet snarare än att gissa bort: i vår
Playwright-körning (macOS-värd) reserverade **ingen av de två** någon
gutter-yta alls — `body`s bredd förblev exakt 1600 av 1600 i samtliga 13
kandidater, identiskt med kontroll-kandidat 0. Se § 5 för varför. Eftersom
det inte finns någon gutter att måla i, finns det heller ingen skillnad att
mäta mellan attachment:fixed och baseline i dessa två motorer — alla
x-punkter är identiska med kontrollen. Detta är INTE ett belägg för att
attachment:fixed fungerar annorlunda (bättre eller sämre) i Firefox/WebKit —
det är frånvaro av en testbar situation. Se § Vad jag inte kunde belägga.

---

## 4. Hur gör branschledarna? Vad säger CSSWG:s egen spårning?

**Detta är inte en o-dokumenterad quirk vi råkat ut för — det är ett öppet,
namngivet CSSWG-spec-gap.**

### 4.1 `w3c/csswg-drafts#8099` — exakt vår observation, från spec-gruppen själv

Öppnad av @bramus 2022-11-18, status **fortfarande öppen**:
[w3c/csswg-drafts#8099](https://github.com/w3c/csswg-drafts/issues/8099)

Ärendet dokumenterar EXAKT den interop-skillnad vi själva mätte, fast för
webbläsarnas produktionsversioner (2022/2024-data, inte vår Playwright-bygg):

> Firefox: "Always resizes the ICB. Always repositions the ICB. Always
> resizes the LVP. Never repositions the LVP."
> Chrome: "Always resizes the ICB... Always repositions the ICB. Only
> resizes the LVP if scrollbars are actually there."
> Safari (TP 158, 2022): inget stöd alls för `scrollbar-gutter` då.

Författarens uttryckliga önskelista (fortfarande ouppfylld, ärendet är
öppet) inkluderar ordagrant:

> "Avoid repositioning the layout viewport, even with `stable both-edges`,
> to allow fixed-position elements to cover the entire viewport."

**Det är bokstavligen kandidat #6/#7 i vår matris** — och CSSWG:s egen
spårning bekräftar att detta INTE fungerar i dag, av design, i väntan på ett
beslut som aldrig fattats.

### 4.2 `w3c/csswg-drafts#5232` — frågan "kan man rita över gutter-ytan" är öppen sedan 2020

Öppnad av @felipeerias 2020-06-17, status **öppen**:
[w3c/csswg-drafts#5232](https://github.com/w3c/csswg-drafts/issues/5232)

Ber uttryckligen om möjligheten att låta innehåll (i original-fallet:
list-rubriker) "step over" den reserverade gutter-ytan. Ingen spec-text,
ingen PR, ingen resolution i ärendet.

### 4.3 CSSWG-mejllistan, juni 2024 — samma "vit/felfärgad kant"-bugg, både Chrome och Firefox

[lists.w3.org/…/2024Jun/0368.html](https://lists.w3.org/Archives/Public/public-css-archive/2024Jun/0368.html),
svar från @yisibl i tråden för #8099:

> beskriver att en modal med `html { overflow: hidden }` + `scrollbar-gutter:
> stable` ger en felaktigt färgad bakgrund på höger sida, **i både Chrome och
> Firefox**, och att `stable both-edges` gör det "even more serious".

### 4.4 Bootstrap `#40659` — samma symptom i en produktions-komponent, på Windows

[twbs/bootstrap#40659](https://github.com/twbs/bootstrap/issues/40659),
stängd, rapporterad mot Bootstrap v5.3:

> `<html style="scrollbar-gutter: stable both-edges">` + en Bootstrap-modal
> ⇒ innehållet skiftar och **vita gutters** visas i stället för det gråa
> overlayet. Rapporterat mot **Firefox på Windows** — alltså en riktig
> klassisk-scrollbar-plattform, till skillnad från vår macOS-testmiljö.

**Detta är den observationen som gör vår Firefox/WebKit-lucka (§ 3, § 5)
mindre allvarlig än den ser ut:** Bootstrap-rapporten visar att SAMMA
"vit gutter"-symptom vi mätte i Chromium på macOS **även** uppstår i Firefox
— men bara på en plattform (Windows) där Firefox faktiskt reserverar en
klassisk scrollbar. Det är oberoende, tredjeparts-bekräftat, om än inte
mätt av oss själva.

### 4.5 Praktiker-precedent: samma döda ände som Marcus redan hittade

[dbushell.com, "Fixing full-bleed CSS", 2026-07-03](https://dbushell.com/2026/07/03/fixing-full-bleed-css/)
— en månad före detta pass. Artikeln beskriver `w-100vw` +
`margin-left: calc(50% - 50vw)` (Andy Bells klassiska teknik — samma som
Marcus försök 1 och vår kandidat 9) och varnar uttryckligen:

> "100vw can be wider than the viewport" — exakt den plattforms-specifika
> fällan som gör tekniken opålitlig på Windows med klassiska scrollbars.

Artikeln nämner `scrollbar-gutter: stable` som ett LAYOUT-stabiliserings-
alternativ, men adresserar aldrig frågan om bakgrunder som ska MÅLAS in i
gutter-ytan — den frågan verkar inte ha en publicerad lösning någonstans jag
hittade.

### 4.6 Precedent-rymden, ärligt räknad

**Noll produktionssystem hittade som löser exakt detta** (gradient/bild
kant-till-kant genom en reserverad `scrollbar-gutter`-yta). Sökningen
omfattade GitHub-kodsök och webbsök mot Bootstrap, Primer (GitHub Design
System), GOV.UK Design System, Shopify Polaris/bootstrap-polaris — ingen av
dem visade en implementation av just detta, bara Bootstrap-ISSUE:n i § 4.4
som beskriver SAMMA problem, olöst. **Detta räknas som en tunn precedent-rymd
och redovisas som sådan, inte som "löst mönster som branschen redan
etablerat".** Det finns dock stark MEKANISM-precedent på att detta är ett
KÄNT gap: två öppna CSSWG-ärenden (§ 4.1, § 4.2) plus en mejllista-tråd
(§ 4.3) plus en produktionsbugg i ett av världens mest använda CSS-ramverk
(§ 4.4) — fyra oberoende källor, samma symptom.

---

## 5. Varför Firefox och WebKit inte gav någon mätbar gutter i denna körning

Kontrollerat direkt (inte antaget): `CSS.supports('scrollbar-gutter',
'stable both-edges')` returnerar `true` i alla tre motorer. Egenskapen är
alltså **erkänd** — MDN:s egen compat-data
([raw.githubusercontent.com/mdn/browser-compat-data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/scrollbar-gutter.json),
hämtad 2026-08-03) bekräftar: Chrome 94+, Firefox 97+, **Safari 18.2+**
("Baseline 2024" — stödet är alltså brett tillgängligt idag, inte en
experimentell flagga).

Men ett extra test (`overflow-y: scroll` UTAN `scrollbar-gutter`, samma
viewport) visade **0 px** skillnad mellan `window.innerWidth` och
`document.documentElement.clientWidth` i **alla tre** motorer på denna
macOS-värd — inte bara Firefox/WebKit. Det pekar mot att värdmiljöns
scrollbar-rendering (macOS default = overlay-stil, ingen utrymmes-konsumtion)
styr vad `stable` har att reservera utrymme FÖR. Spec-texten (§ 1.2) säger
uttryckligen att `stable` bara reserverar plats "for classic scrollbars" —
"Overlay scrollbars do not consume space." **Att Chromium ändå reserverade
30 px är alltså den byggen som avviker från den regeln, inte tvärtom** —
vilket matchar CSSWG-ärende #8099:s observation (§ 4.1) att Chrome "always
resizes the ICB" oavsett om en scrollbar faktiskt syns.

**Slutsats för § 3-frågan:** vår motor-jämförelse för
`background-attachment: fixed` är fullständig för Chromium men **inte
prövningsbar** för Firefox/WebKit på denna värdmaskin — inte för att
egenskapen saknas, utan för att denna specifika macOS-körning aldrig satte
någon gutter i spel att jämföra mot. Se § 4.4 för tredjeparts-belägg att
samma symptom ÄNDÅ existerar i Firefox på en klassisk-scrollbar-plattform.

---

## Dom

**Fullständig, pixel-exakt lösning: nej — belagt genom 13 mätta kandidater,
inte antaget.** Chromium 149 klipper målningen av `background-image`
(gradient, bild, eller en `position:fixed`-boxs bild-bakgrund) vid
`scrollbar-gutter`-gränsen, oavsett hur boxen som ska målas är dimensionerad
— bevisat genom att TVINGA fram en box som mätbart TÄCKER hela viewporten
(kandidat 9 och 10) och ändå se tom kant. Detta matchar ett öppet,
namngivet CSSWG-spec-gap (§ 4.1–4.2) och en identisk, oberoende rapporterad
"vit gutter"-bugg i Bootstrap (§ 4.4) — det är alltså inte en lokal miss i
`base.css`, det är plattformens nuvarande, odokumenterat-ofärdiga beteende.

**Praktisk, icke-perfekt lösning: ja.** En `background-color` på `html`
MÅLAS korrekt in i gutter-ytan (kandidat 11, entydigt) om den ligger i
canvas-bakgrunds-lagret. Lagrad UNDER den riktiga gradienten
(`background-image`) på samma element (kandidat 12) ger en fungerande
kompromiss: gutter-remsan visar en enfärgad kamouflage-ton i stället för
dagens vita glipa. Ingen `scrollbar-gutter`-regel rörs, ingen
bredd-förändring i något läge — hopp-kravet är intakt.

---

## Vad jag inte kunde belägga

1. **Firefox/WebKit på en riktig klassisk-scrollbar-plattform (Windows/
   Linux) är INTE mätt av mig.** Endast Bootstrap-issue #40659 (§ 4.4, tredje
   part, Firefox/Windows) ger indirekt belägg för att samma symptom
   reproduceras där. WebKit/Safari på klassisk scrollbar är helt omätt,
   varken av mig eller av någon källa jag hittade.
2. **Produktionens faktiska gradient (`to bottom right`, tokens
   `--mm-primary-tint`/`--mm-accent-tint`) är inte testad ordagrant** — jag
   körde en horisontell `to right`-gradient med fasta hex-värden för att
   isolera x-axeln rent. Mekanismen (paint-clip vid gutter-gränsen) beror
   inte på gradientens riktning eller färgvärden — det bekräftas indirekt av
   att kandidat 11 (helt utan gradient, bara platt färg) uppvisar samma
   mönster som kandidat 1 (gradient) i motsatt riktning (målas / målas inte)
   — men jag har inte kört exakt produktionens CSS-sträng.
3. **Varför Marcus fynd 3 ("enfärgad rännsten", identisk hash x=3/8/1592/1597")
   visade EXAKT samma hash på alla fyra punkter** är inte fullt förklarat.
   Min mätning visar VIT (255,255,255) i Chromium — canvas-surface-defaulten
   per spec ("typically an opaque white"). Om produktionens faktiska
   uppmätta färg också var vit (eller om `--mm-bg`/annan bakgrund lyste
   igenom och gav en annan enfärgad ton) är inte verifierat mot den körningen
   — jag har bara min egen isolerade repro, inte tillgång till Marcus
   ursprungliga skärmdumpar.
4. **Kandidat 12:s kamouflage-färg (`#b995a1`) är en naiv RGB-medelvärdering**
   av gradientens två stopp, inte en `color-mix()`-beräkning mot de faktiska
   design-tokens. Om den ser bra ut i en diagonal `to bottom right`-gradient
   med de RIKTIGA tint-tokens (som har annat kulör-avstånd än mina
   testfärger) är overifierat — se § Rekommendation för hur den bör
   beräknas i produktion, men själva beräkningen är inte körd.
5. **Chromium-versionen jag mätte mot (HeadlessChrome 149.0.7827.55,
   Playwright-bundlad) är INTE nödvändigtvis identisk med den Chrome/Edge
   Marcus faktiskt använde** när han observerade felet i "riktig
   webbläsare". Beteendet är dock konsekvent med CSSWG-ärendets historik
   sedan 2022, så sannolikheten att en annan Chromium-version beter sig
   fundamentalt annorlunda bedöms låg — men det är bedömning, inte mätning.
6. **Om `color-mix()` (använd i rekommendationen nedan) i sig fungerar
   korrekt SOM `background-color`-lager i canvas-mekanismen är inte
   separat testat** — jag testade bara en literal hex-färg (#b995a1) som
   `background-color`, inte en `color-mix()`-uttryck på samma plats. Given
   att `color-mix()` evalueras till ett vanligt `<color>`-värde vid
   beräkning bedöms risken låg, men det är inte mätt.

---

## Rekommendation

**Förstahandsval: lägg en approximerad `background-color` UNDER den
befintliga gradienten på `html[data-auth-fond="true"]`, som ett andra
CSS-deklaration i SAMMA regel — rör ingenting annat.**

```css
html[data-auth-fond="true"] {
  /* Kamouflage-lager: målas KORREKT ut i scrollbar-gutter-ytan (mätt,
     kandidat 11+12, detta pass) eftersom det är background-COLOR, inte
     background-IMAGE, på canvas-bakgrunds-elementet. Ett representativt
     mellanläge mellan gradientens två stopp — gutter-remsan (11–17 px
     typiskt) visar denna platta ton i stället för dagens vita glipa.
     background-color är ALLTID understa lagret (CSS Backgrounds §3.8);
     gradienten nedan målas ovanpå överallt UTOM i gutter-remsan, där
     Chromium (mätt) aldrig målar background-image alls när
     scrollbar-gutter: stable är aktiv på root. */
  background-color: color-mix(in oklab, var(--mm-primary-tint), var(--mm-accent-tint));
  background-image: linear-gradient(to bottom right, var(--mm-primary-tint), var(--mm-accent-tint));
}
```

`body`-regeln (`background: transparent` vid `data-auth-fond`) rörs inte —
den är fortfarande nödvändig av samma skäl som ursprungskommentaren i
`base.css` beskriver (body:s opaka `--mm-bg` skulle annars måla över
gradienten i den synliga mitten).

**Varför denna väg och inte de andra 12:**

- Kandidat 1–10 (attachment:fixed, background-size, fixed div/pseudo-element,
  JS-mätt explicit offset, `w-100vw`+negativ margin) **löser inte
  problemet** — samtliga mätt tomma i gutter-ytan, inklusive de två (#9, #10)
  där elementets egen box bevisligen täckte hela viewporten. Att bygga om
  någon av dem vore att upprepa ett redan mätt misslyckande.
- Kandidat 8 (gradient direkt på `body`, ej propagerad) är sämre än
  baseline: kanten visar en HELT ANNAN färg (dekoyens) än gradienten, ingen
  fördel.
- Kandidat 12 är den ENDA som byter ut "vitt hål" mot "kontrollerad,
  förutsägbar färg" — utan att röra `scrollbar-gutter`-regeln, utan JS, utan
  en enda extra DOM-nod.

**Vad den INTE ger:** en pixel-perfekt fortsättning av gradientens
matematiska kurva ut i gutter-remsan. Kompromissen är en enda platt ton för
BÅDA kanterna (vänster och höger gutter får samma kamouflage-färg, eftersom
`background-color` bara kan vara EN färg — inte två olika per kant). Given
gutter-remsans ringa bredd (11 px uppmätt i befintlig kod-kommentar vid 1280,
sannolikt 15–17 px på bredare Windows-uppsättningar) och att den ligger i
absolut skärm-periferi, bedöms avvikelsen vara visuellt försumbar — men det
är en bedömning, inte en mätning (se § Vad jag inte kunde belägga, punkt 4).

**Om exakthet krävs framför enkelhet:** det finns inget CSS-only-alternativ
som ger det, baserat på denna körnings 13 mätta kandidater och de två öppna
CSSWG-ärendena (§ 4.1–4.2) som visar att plattformen själv saknar en
lösning. Nästa steg vore i så fall att följa och rösta på
`w3c/csswg-drafts#5232`, inte att fortsätta jaga en CSS-teknik som redan är
uttömd av detta pass.

**Alternativ, avfärdad:** att ändra `scrollbar-gutter`-regeln (villkora den,
stänga av den för auth-vyer, eller byta till enkelsidig). Redan förkastat av
Marcus-direktivet i uppdraget — och detta pass adderar inget nytt skäl att
riva det beslutet.

---

## Källförteckning

- [CSS Backgrounds and Borders Module Level 3 — § 2.11.1 The Canvas
  Background and the Root Element](https://www.w3.org/TR/css-backgrounds-3/#root-background)
  och [§ 2.11.2 … the HTML `<body>` Element](https://www.w3.org/TR/css-backgrounds-3/#body-background)
  (canvas-bakgrund, root-propagering, body-propagering) — verifierat mot rå
  HTML-källa 2026-08-03.
- [CSS Backgrounds Level 3 — § 2.5 background-attachment](https://www.w3.org/TR/css-backgrounds-3/#the-background-attachment)
- [CSS Backgrounds Level 3 — § 2.8 background-origin](https://www.w3.org/TR/css-backgrounds-3/#the-background-origin)
  (`fixed` ⇒ positioneringsyta = ICB)
- [CSS Overflow Module Level 3 — § 4.2 scrollbar-gutter](https://www.w3.org/TR/css-overflow-3/#scrollbar-gutter-property)
  ("apply it to the viewport instead", "must not propagate … from the HTML
  body element")
- [w3c/csswg-drafts#8099 — Effect of scrollbar-gutter on viewport](https://github.com/w3c/csswg-drafts/issues/8099)
  (öppen; Chrome/Firefox/Safari-jämförelse, ICB-repositionering)
- [w3c/csswg-drafts#5232 — drawing over the space reserved by
  scrollbar-gutter](https://github.com/w3c/csswg-drafts/issues/5232) (öppen
  sedan 2020)
- [CSSWG public-css-archive, 2024-06, svar från @yisibl i #8099-tråden](https://lists.w3.org/Archives/Public/public-css-archive/2024Jun/0368.html)
  ("colored background … Chrome and Firefox", "stable both-edges … even more
  serious")
- [twbs/bootstrap#40659 — vita gutters vid modal-öppning med
  scrollbar-gutter:stable](https://github.com/twbs/bootstrap/issues/40659)
  (Firefox/Windows, stängd)
- [MDN browser-compat-data — scrollbar-gutter (raw JSON)](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/scrollbar-gutter.json)
  (Chrome 94+, Firefox 97+, Safari 18.2+, Baseline 2024)
- [dbushell.com — "Fixing full-bleed CSS", 2026-07-03](https://dbushell.com/2026/07/03/fixing-full-bleed-css/)
  (samma `100vw`+negativ-margin-fälla som Marcus försök 1)
- Egen mätning: Playwright 1.61.1, HeadlessChrome 149.0.7827.55, Firefox
  151.0, WebKit/Safari 26.5 (AppleWebKit 605.1.15) — 13 kandidat-sidor, 3
  motorer, 5 x-punkter, rå-RGBA + md5. Scratchpad:
  `/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/8439d93c-9a4b-4003-b636-530e9db7d0d7/scratchpad/scrollbar-gutter-repro/`
  (ej committad — utanför repot per uppdrag).
- `src/styles/base.css` rad 25–137 (befintlig kod-kommentar: rännstens-
  arkitekturen, tidigare förkastade vägar, overlay-origo-fixen).
