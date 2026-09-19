---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: stable
---

# Luma — visuell mätning, "nära dig" och kartan (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (bakgrundsagent, Session 128),
> UPPFÖLJNING till
> [`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md)
> (samma dag, samma session). Kört **oisolerat** i worktreen `s128-docs`
> (gren `docs/s128-fodelse`, `5166902d` vid start). Beställt av
> orkestreraren specifikt för att stänga föregångarens två obesvarade
> delfrågor (visuella exaktvärden + tillgänglighet) genom
> **Playwright-MCP:n** i stället för den `chrome-devtools`-profil som var
> låst av en parallell session. Ingen produktionskod rörd.

---

## Kort svar

**Domen i klartext:** Luma går att mäta fullt ut med Playwright-MCP:n, och
mätningarna bekräftar det mesta av föregångarens citat-baserade bild men
**river två av dess hypoteser** och lägger till substantiellt nytt: (1)
registreringen sker i en **modal**, inte inline på sidan som hjälpdokumentationen
påstod; (2) kartan är **inte en (1) leverantör** — enskilda eventsidor
använder **Google Maps Embed API**, medan flerpunkts-kartvyer (organisatörens
"alla event"-karta) använder **Apple MapKit JS**. "Nära dig" är **inte** en
egen märkt yta utan en **serverdriven IP-geolokaliserings-rankning** av
stadssidor (mätt direkt ur API-svaret, inklusive debug-fält som avslöjar
`ip_city: "Gothenburg"`, `ip_provider: "cloudflare"` och `coordinate: null` —
alltså **ingen** webbläsar-behörighetsfråga, aldrig observerad). Ikonerna är
**bevisat identiska i formspråk** med Lucide (24×24 viewBox, stroke-width 2,
`currentColor`, `fill: none`, rundade ändar) — ett bibliotek vi **redan har
som beroende** (`lucide-react ^1.34.0`, `package.json`). Lighthouse gav
**Tillgänglighet 88/100** och **Prestanda 27/100** (simulerad mobil, se
metod-kaveat) på en eventsida, med tre konkreta fällda granskningar
(`link-name`, `meta-viewport`, `landmark-one-main`) plus fem egna mätta fynd
utöver det (ingen modal-roll, ingen fokusfälla, ofärgad kalenderprick under
kontrastgolvet, sektionsrubriker utan semantisk `<h*>`, nästan obefintlig
`prefers-reduced-motion`-täckning).

**Den avgörande delfrågan** visade sig vara kartleverantören: Marcus mentala
modell ("Apple-kartan") är **delvis rätt** — MapKit JS finns verkligen i
produkten, men inte på den yta ett litet eventflöde med tiotalet event
huvudsakligen skulle använda (den enskilda eventsidan). Rekommendationen
landar därför i Google Maps Embed API, inte MapKit, för Miranon Medias skala.

---

## Vad vi redan visste (läst FÖRE första mätningen)

Läste föregångarens fil i sin helhet (se proveniens ovan) innan något
verktygsanrop gjordes. Den täckte strukturellt: sidtypsinventering,
eventsidans blockordning (citerad, ej mätt), anmälningsflödets textsteg,
väntelistans manuella promoveringsregel och påminnelse-gatningen — allt via
`WebFetch`/`WebSearch` mot `help.luma.com` eftersom `chrome-devtools`-profilen
var låst hela passets körtid. Den lämnade **§5 (visuella exaktvärden)** och
**§6 (tillgänglighet)** helt obesvarade och flaggade uttryckligen att ett
uppföljande pass med fungerande webbläsaråtkomst behövdes — exakt detta pass.

Utöver föregångaren läste jag, per uppdraget:

- **`src/styles/tokens/primitives.css`, `semantic.css`** (fullständigt) —
  vårt eget 3-lagers token-system. Ingen `prefers-color-scheme`- eller
  `data-theme`-hantering finns i `src/styles/` idag (verifierat med `grep`) —
  appen har **inget mörkt läge** att jämföra mot ännu.
- **`src/components/primitives/Dialog.tsx`** — bygger på
  `react-aria-components`, som bär `role="dialog"`, fokushantering och
  Escape-stängning enligt filens egen kommentar. Relevant eftersom Lumas
  registreringsmodal (mätt nedan) saknar precis detta.
- **`package.json`** — `lucide-react: ^1.34.0` är redan ett beroende (rad 88).

**Åldersbedömning:** föregångaren är från samma dag (timmar gammal), så inget
var åldrat — detta pass kompletterar snarare än omprövar den.

---

## Metod

**Verktyg:** `mcp__playwright__*` genomgående (`browser_navigate`,
`browser_resize`, `browser_snapshot`, `browser_evaluate`,
`browser_network_requests`/`browser_network_request`, `browser_press_key`,
`browser_emulate_media`, `browser_take_screenshot`, `browser_click`). Ingen
`chrome-devtools`-process rördes eller avslutades.

**Vad som mättes:** startsidan, `/discover`, stadssidan `/stockholm`,
organisatörskalendern `/creativesgettingcoffee` + dess `/map`-undersida, och
tre publika eventsidor med fysisk plats — samtliga arrangörer är
organisationer/community-konton, inte privatpersoner, förutom ett
undantagsfall (väntelista-exemplet) vars arrangör är en privatperson; **inget
verkligt personnamn återges i denna fil** (repots PII-princip,
`CLAUDE.md` § Instruktioner) trots att Lumas egna sidor visar dem öppet i
klartext (både arrangörsnamn och en publik deltagarlista med för- och
efternamn — noterat som eget fynd, se § 8).

**Tre metod-hinder, redovisade öppet:**

1. **Skärmdumpsverktyget skriver bara till en fast "workspace root"**, satt
   till huvudrepots checkout (`/Users/marcus/Repon/miranon-media-admin`) —
   INTE till den worktree jag kör i, och inte till scratchpad-katalogen
   direkt (ett `filename`-försök mot scratchpad gav
   `File access denied: ... is outside allowed roots`). Lösning: skrev till
   `.playwright-mcp/luma-tmp/` (repots redan etablerade, gitignorade
   verktygskatalog för denna MCP-server — 981 filer låg där redan innan
   passet startade), kopierade omedelbart allt till den beställda
   scratchpad-katalogen, och **raderade hela `luma-tmp/`-katalogen** efteråt.
   Verifierat efteråt: `git status`-relevant yta i huvudrepot och worktreen
   bär inga nya `.png`-filer. Se § Oväntade fynd i slutrapporten.
2. **`browser_take_screenshot` fastnade i en evighets-timeout** ("waiting for
   fonts to load") efter ett antal `evaluate`/`emulate_media`-anrop, trots
   att `document.fonts.status` rapporterade `"loaded"` — ett verktygstillstånd
   i den specifika fliken, inte en Luma-egenskap. Löst genom att öppna en NY
   flik (`browser_tabs` `new`) och stänga den gamla; screenshots fungerade
   omedelbart igen. Ingen mätning gick förlorad, men det kostade tid.
3. **Lighthouse kördes EN gång, framgångsrikt** (se § 6) — `npx --yes
   lighthouse` mot en eventsida, headless Chrome, `13.5.0`. Ingen andra
   körning gjordes (budget).

**Geolokalisering:** ingen behörighetsdialog för plats visades vid någon
navigering under hela passet (0 dialoger fångade), vilket i sig är ett
mätresultat, inte en avsaknad av mätning — se § 4.

---

## 1. Mätta designvärden

Samtliga värden nedan är `getComputedStyle()`-läsningar mot verklig DOM,
inte antagna. Källa där inget annat anges: `https://luma.com/nkurm7qd`
("Event 1", ljust tema) och `https://luma.com/7a7hzy2j` ("Event 2", mörkt
tema), 2026-09-19, viewport 1440×900 om ej annat anges.

### Typsnitt

| Roll | Font-stack (mätt) | Källa |
|---|---|---|
| Rubriker, Event 1 | `factoria, -apple-system, "system-ui", "Apple Color Emoji", Inter, Roboto, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif` — egen webbfont, self-hostad via `luma.com/fonts/factoria.css` | `getComputedStyle(h1)`, `browser_network_requests` |
| Rubriker, Event 2 | `snpro, -apple-system, "system-ui", …` (samma fallback-svans) — annan display-font, hosting ej verifierad | `getComputedStyle(h1)` |
| Brödtext, etiketter, knappar | `-apple-system, "system-ui", "Apple Color Emoji", Inter, Roboto, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif` — **ingen** egen display-font, ren systemfont-stack (Inter förekommer bara som fallback, inte primärt) | `getComputedStyle(body/p/button)` |

**Tolkat:** varje event-tema kan välja EGEN rubrikfont (inte bara egen
kulör) — en bredare temavariation än föregångarens citat antydde. Kroppstext
och UI-text är alltid systemfont-stacken, oavsett tema.

### Typskala

| Element | Storlek | Vikt | Radhöjd | Breddpunkt |
|---|---|---|---|---|
| H1 (Event 1) | 38px | 600 | 43,7px (≈1,15) | 1440px |
| H1 (Event 1) | 24px | 600 | 28,8px (1,2) | 375px |
| H1 (Event 2) | 48px | — | — | 1440px (ej mätt vid 375px) |
| Sektionsetikett ("Om evenemanget") | 14px | 500 | 21px (1,5) | 1440px — **ej semantisk rubrik**, se § 6 |
| Brödtext (beskrivning) | 16px | 400 | 24px (1,5) | 1440px |
| Knapptext ("Registrera") | 16px | 500 | 24px | 1440px |
| Datumbricka, månad ("sep.") | 8px | 600 | 12px | 1440px |
| Datumbricka, dag ("19") | 16px | 500 | — | 1440px |

### Spacing, radier, kolumnbredd

| Egenskap | Värde | Kommentar |
|---|---|---|
| Innehållskolumn (höger, 2-kolumnsläge) | 562–570px | Konsekvent över Registrering/Om evenemanget/Plats-sektionerna |
| Omslagsbild | **1:1 kvadrat**, 329,6px (375px viewport) / 331,7px (1440px) | Samma pixelmått oavsett breakpoint — bilden sitter i en fast kolumn, inte full bredd, ens på mobil |
| Registreringskortets radie | 22px (toppet av kortet, `22px 22px 0 0`) | Enda kortet med synlig radie av de tre sektionerna |
| Knapp-radie ("Registrera") | 16px | Konsekvent Event 1 och Event 2 |
| Modal-inputs radie | 8px | Textbox i registreringsformuläret |
| Kart-omslagets radie | 12px (`overflow: hidden` på `<a>`-wrappern) | Google Maps-inbäddningen |
| Kalenderdagcell | 32,29×32,29px, `border-radius: 100%` (cirkel) | Organisatörskalendern |
| Kalender-"prick" (har event) | 5×5px | Se § 6 för kontrastproblem |

### Skuggor och kantlinjer

**MÄTT: `box-shadow: none` genomgående** — testat på registreringsknappen,
alla sex förälder-nivåer upp till sektionswrappern, registreringsmodalens
inputfält (sju nivåer upp), och kortets bakgrundslager. **Ingen enda
komponent jag undersökte använder en drop shadow.** Elevation/separation
kommuniceras uteslutande via bakgrundstoning (t.ex. registreringskortets
`rgba(59, 41, 31, 0.04)` — en nästan omärklig 4-procentig tint av
mörk-tonen) och radie, aldrig skugga.

Kantlinjer: knappen har `border: 1px solid <samma färg som bakgrunden>`
(dvs. funktionellt osynlig, bara en render-artefakt); inputfälten i modalen
har INGEN synlig kant, bara en halvtransparent vit bakgrund
(`rgba(255, 255, 255, 0.64)`).

### Färgroller, ljust och mörkt läge

| Roll | Event 1, ljust (uppmätt default) | Event 1, `prefers-color-scheme: dark` | Event 2 (uppmätt under samma default-miljö) |
|---|---|---|---|
| Sidbakgrund | `rgb(248, 240, 236)` — varm off-white, INTE ren vit | `rgb(59, 41, 31)` | `rgb(72, 34, 0)` |
| Text (rubrik/brödtext) | `rgb(37, 11, 0)` | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` |
| Dämpad etikett | `rgba(93, 64, 48, 0.8)` | ej mätt | ej mätt |
| Knappbakgrund | `rgb(150, 107, 84)` | ej mätt | `rgb(255, 255, 255)` (text: `rgb(35, 13, 0)`) |
| Fokusring | `rgb(150, 107, 84)` (= knappfärgen) | ej mätt | ej mätt |

`window.matchMedia('(prefers-color-scheme: dark)').matches` returnerade
`false` i miljön hela passet (bekräftat direkt) — Event 1:s mörka värden
kommer alltså från en **explicit** `browser_emulate_media`-forcering, inte
miljöns eget läge, och A/B:t (ljus→mörk, samma event) är därmed en ren,
kontrollerad mätning. **Event 2 renderade sitt mörka utseende UNDER samma
ljusa miljö-preferens** — vilket betyder ANTINGEN att det temat är fast
mörkt (inte adaptivt) ELLER att adaptiv-logiken skiljer sig mellan teman.
Jag testade inte att tvinga Event 2 till explicit ljust läge för att skilja
dessa åt — **öppen fråga, se § Vad jag inte kunde belägga.**

### Kolumnmodell per breakpoint

| Viewport | Layout |
|---|---|
| 375px (mobil) | 1 kolumn, staplat (bild → titel → datum/plats → registrering → om evenemanget → plats/karta) |
| 600px | Fortfarande 1 kolumn, staplat (H1 top 535px, under bildens botten på 485px) |
| 768px | **2 kolumner** (bild/värdblock vänster ~15px från kant, huvudinnehåll höger från ~320px) |
| 1440px | 2 kolumner, höger innehållskolumn 562–570px bred |

**Brytpunkten ligger mellan 601 och 768px** — exakt tröskelvärde inte
itererat fram (budget), men 768px är en vanlig konventionell brytpunkt
(Tailwind `md`) och sannolik kandidat.

### Övergångar

`transition-duration: 0,3s` mätt på bakgrundslagrets mount-övergång (baseline,
ej aktiv vid mätningstillfället). **Endast EN** `@media (prefers-reduced-motion:
reduce)`-regel hittades i HELA det laddade stylesheet-trädet (sökt
programmatiskt genom `document.styleSheets`), och den gäller en enda
label-klass — inte bakgrundens animerade glow-lager, inte hover-övergångar.
Se § 6.

---

## 2. Eventsidans anatomi

### Blockordning (bekräftar och preciserar föregångaren)

1. Omslagsbild (kvadratisk, se ovan)
2. Värdblock: **två separata, delvis oberoende roller** —
   "Presenteras av" (organisation/community, valfri — Event 2 saknar den
   helt) och "Arrangeras av" (värd, alltid närvarande)
3. Deltagarantal ("X Går") + klickbar avatar-rad med **riktiga för- och
   efternamn** i klartext (ej återgivna här, se § Metod)
4. "Kontakta värden" / "Rapportera evenemang" — två knappar
5. Kategori-/taggpills (t.ex. "Träning", "Löpning" på Event 2; "Böcker" på
   Event 3) — länkar till kategorisidor
6. Eventtitel (H1, semantisk rubrik nivå 1)
7. Datumbricka (liten kalenderikon, månad+dag) + textrad (veckodag, datum,
   tidsspann)
8. Platslänk (kort namn + ort, klickbar → Google Maps-sök)
9. **Registreringskort** — rubrik "Registrering", kort text, CTA-knapp
10. "Om evenemanget" — **inte en semantisk rubrik**, se § 6 — brödtext
11. "Plats" — **inte en semantisk rubrik** — adress i text + inbäddad karta
12. Sidfot

### Ovanför vecket (mätt, bounding rects)

| Element | 375×812 (topp) | 1440×900 (topp) |
|---|---|---|
| Omslagsbild | 67px | 83px |
| H1 | 432px | (i högerkolumnen, ej mätt separat) |
| "Registrering"-rubrik | 661px (synlig) | 348px (synlig) |
| **Registrera-knappen** | **765–803px (SYNLIG i sin helhet)** | **428–466px (synlig)** |
| "Om evenemanget" | 840px (**under vecket**) | 507px (synlig) |
| "Plats"/karta | 1576px (långt under vecket) | 1055px (under vecket) |
| Total sidhöjd | 2586px | 1617px |

**Registrera-knappen ryms ovanför vecket på BÅDA breakpoints** utan att
behöva vara sticky — det förklarar sannolikt varför Luma inte byggt en sticky
CTA (se nästa punkt).

### Sticky-beteende — definitivt mätt, INGEN sticky CTA

Sökte `getComputedStyle(el).position` för samtliga element i DOM:en på både
375px och 1440px. **Noll element med `position: sticky`.** De element med
`position: fixed` är uteslutande dekorativa bakgrundslager (temafärgens
"glow"-effekt) — inte registreringsboxen, inte navigationen. Registrera-
knappen scrollar normalt med resten av innehållet på både mobil och desktop.

### Väntelista / fullbokat — mätt live, inte citerat

`https://luma.com/hk5177rz` (2026-09-19) hade status **fullbokat**:

- Rubrik i registreringskortet: "Evenemanget fullt"
- Undertext: "Om du vill kan du gå med på väntelistan."
- Förklaring: "Klicka på knappen nedan för att gå med på väntelistan. Du
  kommer att meddelas om fler platser blir tillgängliga."
- Knapp: "Gå med i väntelistan"

**Mätt, oväntat:** INGEN särskild varningsfärg används för detta läge —
rubriktexten är vit (samma som all annan text i detta mörka tema) och
knappen har exakt samma vit/mörk-stil som en vanlig "Registrera"-knapp.
Fullbokat/väntelista signaleras ENDAST genom text, aldrig genom färg.

---

## 3. Ikonerna

**Fingeravtryck, mätt direkt ur DOM (19 `<svg>`-element inspekterade, inget
icon-font-stylesheet hittat):**

| Egenskap | Mätt värde (vanligaste mönstret) |
|---|---|
| Format | Inline SVG i DOM:en, inte sprite (`<use>`), inte icon-font |
| `viewBox` | `0 0 24 24` (vanligast) — sekundärt mönster `0 0 16 16` |
| `fill` | `none` |
| `stroke` | `currentColor` |
| `stroke-width` | `2` (primär familj) / `1,5` (sekundär, 16×16-varianten) |
| `stroke-linecap`/`stroke-linejoin` | `round` |
| Renderad storlek | 16px (vanligast), 18–20px på vissa |

**Källjämförelse — exakt matchning verifierad mot Lucides egen källkod:**
hämtade `house.svg` direkt från
`https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/house.svg`
(2026-09-19) och fick byte-för-byte samma attributuppsättning:
`viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
stroke-linecap="round" stroke-linejoin="round"`. Detta är alltså inte en
gissning baserad på "ser ut som" — det är en direkt attributjämförelse.

**Tillgänglighetsbrist i ikonanvändningen (mätt, hänger ihop med § 6):** fyra
instanser av Instagram-ikonlänkar på Event 1 saknar BÅDA `aria-hidden` på
SVG:n OCH `aria-label`/textinnehåll på den omslutande länken — roten till
Lighthouse-fyndet `link-name` (se § 6).

### Rekommenderade öppna ikonfamiljer (namn, licens, källa — verifierat 2026-09-19)

| Familj | Licens | Mätt/verifierat mot Lumas fingeravtryck | Status hos oss |
|---|---|---|---|
| **Lucide** | ISC (bekräftat via `lucide.dev`) | **Exakt matchning** (se ovan) | **Redan beroende** — `lucide-react ^1.34.0` i `package.json` rad 88 |
| **Heroicons** (outline, 24px) | MIT (Tailwind Labs, bekräftat via GitHub `LICENSE`-fil) | `viewBox="0 0 24 24"`, `stroke-width="1.5"` (något tunnare än Lumas 2px), ships `aria-hidden="true"` som DEFAULT i exporterad SVG | Ej beroende idag |
| **Phosphor Icons** | MIT (bekräftat via GitHub) | "regular"-vikten är **fylld** (`fill="currentColor"`, `viewBox 0 0 256 256`) — ANNAN rendering-teknik än Lumas streck-stil; "thin"/"light"-vikterna approximerar streck-utseendet | Ej beroende idag |

**Rekommendation (märkt som sådan):** använd Lucide konsekvent på
event-/kalenderytorna — inget nytt beroende krävs, biblioteket finns redan i
projektet och matchar det uppmätta fingeravtrycket exakt.

---

## 4. "Nära dig" — mätt via API-svar, inte gissat

**Ingen behörighetsdialog för plats visades någon gång** under hela passet
(0 dialoger fångade av `browser_press_key`/interaktionsloggen). Detta är
själva mätningen, inte en lucka i den.

**Mekanismen, mätt direkt ur `GET
https://api.luma.com/discover/bootstrap-page`s svarskropp** (anropad av
`/discover`-sidan), fältet `debug_info`:

```json
{
  "coordinate": null,
  "client_ip": "2a02:1406:...",
  "ip_coordinate": { "latitude": 57.70716, "longitude": 11.96679 },
  "ip_city": "Gothenburg",
  "ip_country": "SE",
  "ip_provider": "cloudflare"
}
```

`coordinate: null` bekräftar att INGEN webbläsar-`navigator.geolocation`
användes — platsen kommer uteslutande från serverns IP-geolokalisering
(Cloudflares egen tjänst, `ip_provider: "cloudflare"`). Miljöns faktiska
utgående IP geolokaliserades till Göteborg.

**Rankningsmekanismen:** svarets `places`-array (87 städer) bär ett
`distance_km`-fält per stad, räknat från `ip_coordinate`. Uppmätt sorterad
ordning (stigande avstånd från Göteborg): Köpenhamn (228,8 km) → Oslo
(255,3 km) → Stockholm (397,4 km) → Hamburg (478,4 km) → Berlin (584,0 km)
→ … Göteborg själv finns INTE i listan över 87 lanserade Luma-städer.

**Reservläge, mätt:** `featured_place: null` i svaret (ingen dedikerad
"din stad"-sida existerar för Göteborg) — Luma faller alltså tillbaka på att
lista de NÄRMASTE lanserade städerna i avståndsordning i stället för att
visa ett tomt läge eller gissa fel stad.

**"Byta ort" — ingen dedikerad växlare hittad.** Mekanismen ÄR
stadslistan/kategori-plattorna på `/discover`: att klicka en stad navigerar
till `/<slug>`. Ingen sticky "din ort: X, byt"-widget observerades någonstans
i navigationen.

**Viktig precisering mot uppdragets premiss:** det finns **ingen egen
märkt "Nära dig"-sida eller -sektion** med det namnet. Det närmaste
funktionella motsvarigheten är (a) `/discover`s beskrivande text ("Utforska
populära evenemang **nära dig**") ovanför kategori-/stadslistorna, och (b)
IP-driven avståndssortering av vilka städer som visas först. Ingen dedikerad
"events inom X km"-lista med koordinat-filtrering hittades.

---

## 5. Kartan — TVÅ leverantörer, mätt, inte en

### Enskild eventsida: Google Maps Embed API

Mätt via `browser_network_requests` (samtliga tre eventsidor gav samma
mönster):

```text
GET https://www.google.com/maps/embed/v1/place?center=<lat>%2C<lng>&key=<API-nyckel>&q=place_id%3A<id>&zoom=13
```

Plus stödanrop till `maps.googleapis.com/maps/api/js` (JS SDK, `libraries=
geometry,search`), `StaticMapService.GetMapImage` och `maps.gstatic.com`.
Renderas i ett `<iframe>` (566×199px vid 1440px viewport), omslutet av en
`<a href="https://www.google.com/maps/search/?api=1&query=<koordinat>&
query_place_id=<id>">` med `border-radius: 12px; overflow: hidden`.

| Egenskap | Mätt värde |
|---|---|
| Leverantör | Google Maps Embed API (iframe) |
| Laddning | Direkt vid sidladdning — nätverksanropen syns omedelbart, ingen lazy/klick-gating uppmätt |
| Storlek/placering | 566×199px, i högerkolumnen under "Plats"-rubriken |
| Klickbeteende | Hela kartytan är omsluten av en länk till `google.com/maps/search`; strukturellt en "öppna i Google Maps"-genväg — om själva iframe-innehållet är oberoende pan-/zoombart inuti testades inte (ingen klick gjordes in i kartan) |
| Adress i text | Ja — venue-namn + fullständig adress som VANLIG TEXT bredvid/ovanför kartan, oberoende av kartbilden |
| Mörkt läge | Ej testat separat (kartans egen theming) |

### Flerpunkts-vy (organisatörens "alla event"-karta): Apple MapKit JS

Mätt på `https://luma.com/creativesgettingcoffee/map` (2026-09-19):

```text
https://cdn.apple-mapkit.com/mk/6/mapkit.core.js
https://cdn.apple-mapkit.com/ti/csr/1.x.x/mk-csr.js?mapkitVersion=6.0.128
```

`window.mapkit !== 'undefined'` bekräftat `true`. DOM bär klasserna
`apple-map`, `mk-map-view`, `mk-map-node-element`, renderat till en `<canvas>`
(1024×847px) med positionerade `.apple-map-annotation`-markörer (20×20px).

**Detta bekräftar delvis Marcus mentala modell ("Apple-kartan")** — MapKit
JS finns verkligen i produkten, men på en ANNAN yta (organisatörens
flerpunkts-översikt) än den enskilda eventsidan. En arrangör med ett tiotal
event skulle i praktiken mest möta den ENSKILDA eventsidans karta (Google),
inte flerpunktsvyn.

**Tillgänglighet, mätt (delas med § 6):** markören har varken `tabindex`,
`role` eller `aria-label` — ett obenämnt, ej fokuserbart `<div>`. DOM-klassen
`mk-disable-all-gestures` förekommer på embed-behållaren — gester
(pan/zoom) är alltså avstängda på denna specifika inbäddning.

---

## 6. Tillgänglighet mot vårt golv

**Lighthouse 13.5.0**, `https://luma.com/nkurm7qd`, headless Chrome, mobil
simulerad genomströmning (standardläge, `formFactor: mobile`,
`throttlingMethod: simulate`), 2026-09-19. Rådata:
`lighthouse-eventsida-1.json` (se skärmdumpskatalogen). **Kaveat:** simulerad
mobil-throttling är INTE representativt för en riktig desktop-/bredbands-
upplevelse — talen nedan ska läsas som CI-jämförbara standardmått, inte som
"så känns sidan för en vanlig besökare".

| Kategori | Poäng |
|---|---|
| Tillgänglighet | **88/100** |
| Prestanda | **27/100** (LCP 19,2s, TBT 9 060ms, CLS 0, simulerad mobil-kastning) |

**Fällda Lighthouse-granskningar (score 0):**

1. `link-name` — länkar saknar urskiljbart namn. Rotorsak verifierad direkt:
   4 Instagram-ikonlänkar utan `aria-label` och utan `aria-hidden` på sin SVG.
2. `meta-viewport` — `user-scalable="no"` eller `maximum-scale < 5` används.
   **Pinch-zoom är avstängt på mobil.** Konkret, allvarligt, mätt.
3. `landmark-one-main` — dokumentet saknar `<main>`-landmärke.

**Passerade granskningar (score 1, för balans):** `color-contrast`,
`aria-allowed-attr`, `button-name`, `image-alt`, `heading-order`,
`html-has-lang`, `document-title`.

### Egna, direkt uppmätta fynd utöver Lighthouse

| # | Fynd | Mätmetod | Allvar |
|---|---|---|---|
| 1 | **Registreringsmodalen har varken `role="dialog"`, `aria-modal` eller `<dialog>`-element.** Sökning efter `[role="dialog"]`, `[role="alertdialog"]`, `dialog` gav 0 träffar trots att modalen visuellt fungerar som en (stängningsknapp, `body { overflow: hidden }`). | `document.querySelectorAll` | Hög — skärmläsaranvändare får ingen semantisk signal om att ett modalt lager öppnats |
| 2 | **Ingen fokusfälla i modalen.** Från Namn-fältet: Tab → E-post → Registrera-knapp → Tab en gång till → fokus hamnar på `<BODY>`, utanför modalen. Escape stänger dock modalen korrekt (positivt). | Verkliga `browser_press_key` Tab-tryck, verifierat två gånger (en gång förorenad av eget testartefakt, en gång ren från fräsch sidladdning) | Hög |
| 3 | **Kalenderns "har event"-prick: kontrast 2,30:1** mot vit bakgrund (beräknat WCAG-formel på uppmätt `rgba(21,21,21,0.36)`), under 1.4.11:s 3:1-golv för meningsbärande icke-text-UI. Dagcellen har dessutom `aria-label: null` — INGEN textalternativ, bara färg/form. | `getComputedStyle` + egen kontrastberäkning (Python, WCAG-formeln) | Medel–hög (dubbel brist: kontrast OCH ren färgsignal) |
| 4 | **Sektionsrubriker ("Om evenemanget", "Plats", "Registrering") är INTE semantiska rubriker** — tillgänglighetsträdet exponerar dem som `generic`, inte `heading`. En skärmläsaranvändare som navigerar via rubrikgenväg (mycket vanlig teknik) hoppar aldrig direkt till dessa sektioner. | `browser_snapshot` (tillgänglighetsträdet) | Medel |
| 5 | **`prefers-reduced-motion: reduce`** täcks av EXAKT EN CSS-regel i hela det laddade stylesheet-trädet, och den gäller en label-effekt — INTE bakgrundens animerade "glow"-lager. | Genomsökning av `document.styleSheets` | Medel |
| 6 | **Kartmarkören (MapKit-vyn) saknar `tabindex`/`role`/`aria-label`**, och embedden har klassen `mk-disable-all-gestures` — flerpunktskartan är i praktiken helt otillgänglig för tangentbord/skärmläsare. | `getComputedStyle`/DOM-attribut | Medel (smalare yta, organisatörsvy) |

**Fokusmarkering:** SYNLIG (`outline: solid 2px <temafärg>`, uppmätt
`rgb(150,107,84)` på Event 1, kontrast 4,64:1 mot vit — håller 3:1-golvet för
denna instans). **Men** ringens färg är temaberoende (samma mekanism som
själva CTA-knappen), inte en fast, exklusiv färg — vilket är precis den
risk vårt eget system (`--mm-focus-ring: #1B4965`, EXKLUSIV, aldrig
återanvänd för något annat) är designat för att undvika. Jag testade inte
ett ljust/pastelltema där fokusringen skulle kunna hamna under 3:1 — detta
är en **risk**, inte ett bevisat universellt fel.

**Kontrast, dämpad text:** `rgba(93,64,48,0.8)` blandat mot sidbakgrunden
`rgb(248,240,236)` ger en effektiv färg ≈`rgb(125,102,89)`, kontrast
**5,34:1** — håller AA för normal text gott och väl.

**Bild-alt-texter:** finns (t.ex. `alt="Omslagsbild för <eventnamn>"`),
bekräftat både i tillgänglighetsträdet och av Lighthouse (`image-alt`:
score 1).

**Text över bild:** ingen av de tre undersökta eventsidorna lägger
rubriktext direkt OVANPÅ omslagsbilden (H1 ligger i textkolumnen, separat
från bilden) — frågan var därför inte tillämplig på detta stickprov.

---

## 7. Anmälningsrutan fram till inskick

**Korrigering av föregångarens citat (Mät hellre än citera-principen):**
`help.luma.com` påstår att registrering sker "on the event page itself, not
in a separate modal." **Mätt beteende säger motsatsen** — ett klick på
"Registrera" öppnar en riktig modal (stängningsknapp "Stäng", `body`
scroll-låst, fokus flyttas in). Dokumentationen var inaktuell eller
missvisande på denna punkt; den levande DOM:en är facit.

| Fält | Typ | `required` | `autocomplete` | Etikett-koppling |
|---|---|---|---|---|
| Namn | `text` | ja | `name` | `label[for]` korrekt kopplad |
| E-post | `email` | ja | `email` | `label[for]` korrekt kopplad |

- Placeholder-text: "Ditt namn" / `du@epost.com`
- Inget konto krävs — bekräftar föregångarens citat, nu mätt live
- Inga biljettyper visades i något av de tre undersökta exemplen (samtliga
  var gratis eller hade bara ett pris)
- Inget steg-indikator/wizard — ett enda formulär, en knapp
- **Ingen inlämning gjordes** (hård gräns) — valideringsbeteende vid
  faktiskt submit-försök är därför **omätt**, se nedan
- Modalens inputfält: `rgba(255,255,255,0.64)` bakgrund, `border-radius:
  8px`, **inget** `box-shadow` (samma mönster som resten av sidan)

---

## 8. Överförbarhet, reviderad

### Direkt jämförelse mot vårt eget token-system

| Mätt Luma-värde | Vårt närmaste token | Match? |
|---|---|---|
| Knapp-radie 16px | `--p-radius-xl: 1rem` (16px) | **Exakt** |
| Input-radie 8px | `--p-radius-md: 0.5rem` (8px) | **Exakt** |
| Kart-/kortradie 12px | `--p-radius-lg: 0.75rem` (12px) | **Exakt** |
| Brödtext 16px/1,5 | `--p-text-base: 1rem` + `--p-leading-normal: 1.5` | **Exakt** |
| Sektionsetikett 14px | `--p-text-sm: 0.875rem` (14px) | **Exakt** |
| H1 38–48px | `--p-text-4xl` (36px)/`--p-text-5xl` (40px) — nära, ej exakt | Nära |
| Noll box-shadow-användning | Vi HAR en full `--p-shadow-xs`…`xl`-skala och använder den | **Medveten skillnad, ej ett fel hos oss** |

**Slutsats:** vår befintliga radie- och typskala täcker redan Lumas mätta
värden nästan exakt — ingen ny tokenserie krävs för att närma sig
"Luma-klass" på dessa axlar.

### Per delfråga

**Eventsidan:** blockordningen, den icke-stickiga men ovanför-vecket-synliga
CTA:n, och den textbaserade (inte färgkodade) fullbokat/väntelista-
signaleringen är alla direkt överförbara utan kostnad. Den kvadratiska
omslagsbilden är ett lättbyggt mönster men bör stämmas av mot
Vue-appens/mallarnas befintliga bildformat innan den antas (**ej gjort i
detta pass** — utanför scope).

**"Nära dig":** IP-geolokaliserings-infrastrukturen är **inte** relevant för
Miranon Media — det löser ett multi-stads-marknadsplatsproblem vi inte har
(en arrangör, sannolikt en region). Att bygga IP-geo-rankning för ett
tiotal event vore spekulativ komplexitet utan nuvarande användare
(över-engineering-vakten). Om "Event nära dig" ska realiseras som
lanseringskrav bör det tolkas som en enkel, alltid-synlig kronologisk lista
för Miranon Medias faktiska region — inte en geolokaliserad rankningsmotor.

**Kartan:** rekommendation (markerad som rekommendation) — **Google Maps
Embed API**, inte MapKit JS, för den enskilda eventsidan. Skälet är mätt
komplexitetsskillnad: MapKit JS kräver Apple Developer Program-medlemskap
och JWT-signerad token-infrastruktur (branschkänt krav, ej separat verifierat
i detta pass) för en yta som för en ensam arrangör med ett tiotal event
knappast motiverar den extra driftskostnaden. Google Maps Embed API:t är en
enda `<iframe>`-URL med en API-nyckel — matchar vår skala.

**Ikonerna:** Lucide, redan installerat, matchar exakt. Ingen ny leverantör
behövs — bara konsekvent användning på event-/kalenderytorna.

**Tillgänglighet, det viktigaste att INTE kopiera:** vår egen `Dialog.tsx`
(byggd på `react-aria-components`) bär redan `role="dialog"`,
fokushantering och Escape korrekt — Lumas motsvarande modal gör det INTE.
Vårt fokusringssystem (`--mm-focus-ring`, en EXKLUSIV fast färg) är redan
starkare än Lumas temaberoende lösning. **Regridera inte** mot Lumas mönster
på dessa två punkter när eventsidan/anmälningsflödet byggs — vi ligger
redan före här.

---

## 9. Vad som INTE besvarades

1. **Om klick INUTI Google Maps-iframen** (inte bara på omslutande länk)
   ger pan/zoom eller navigerar bort — ej testat (ingen klick gjordes in i
   kartan, för att undvika oavsiktlig extern navigering mitt i passet).
2. **Om Event 2:s mörka tema är adaptivt (Auto) eller fast mörkt** — testade
   aldrig explicit ljust läge på just det eventet.
3. **Kartans utseende i mörkt läge** (tile-theming) — ej testat.
4. **Exakt brytpunkt** mellan 601–768px för 1→2-kolumnslayouten.
5. **snpro-fontens hosting-mekanism** (self-hostad som `factoria`, eller
   extern?) — nätverksloggen kontrollerades inte för just detta event.
6. **Valideringsbeteende vid faktiskt submit-försök** i registreringsmodalen
   (tom/felaktig e-post) — förbjudet att testa per uppdragets hårda gräns.
7. **Biljettflöde för ett betalt event** — inget av de tre undersökta
   exemplen hade mer än ett gratis prisläge utan biljettval.
8. **QR-biljett/wallet-pass-utseendet** — kräver fullföljd anmälan, ej gjort.
9. **Varför skärmdumpsverktyget fastnade** (§ Metod, punkt 2) — löst genom
   flikbyte, aldrig rotorsaksbestämt.

---

## Dom

Lumas publika ytor är **fullt mätbara** med rätt verktyg, och mätningen ger
en väsentligt skarpare bild än föregångarens citat-baserade genomgång:
strukturen håller vad hjälpdokumentationen lovar på de flesta punkter, men
**registreringsflödet (modal, inte inline) och kartleverantören (två
leverantörer, inte en) var båda felciterade eller ofullständigt beskrivna av
förstapartskällan** — ett konkret bevis för uppdragets "mät hellre än
citera"-princip. Ikonerna är bevisat i Lucides klass eftersom de ÄR Lucides
formspråk, och vi äger redan biblioteket. Tillgänglighetsmässigt är Luma
**bättre än obehandlad** (88/100, korrekta alt-texter, synlig fokusmarkering)
men **klart under vårt eget golv** på flera konkreta, mätta punkter (ingen
modal-semantik, ingen fokusfälla, blockerad pinch-zoom, färgberoende
kalenderindikator under kontrastgolvet) — Luma ska alltså plundras för
mönster, inte för tillgänglighetsimplementation.

---

## Vad jag inte kunde belägga

Se § 9 för den fullständiga listan. Sammanfattat, de tre viktigaste:

- Om Event 2:s mörka tema är adaptivt eller fast (påverkar hur vi ska tänka
  kring "40+ teman"-modellen om den någonsin blir relevant för oss).
- Interaktionsbeteendet INUTI Google Maps-inbäddningen (bara den yttre
  länk-omslutningen mättes).
- Rotorsaken till skärmdumpsverktygets timeout (arbetades runt, aldrig
  diagnostiserad).

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.**

1. **Karta:** bygg mot Google Maps Embed API för eventsidans enskilda
   platskarta. Skjut MapKit JS/flerpunktskartor till en eventuell framtida
   "alla event"-översikt om och när den blir ett verkligt behov — inte nu.
2. **"Nära dig":** tolka lanseringskravet som en enkel, regional,
   kronologisk lista — bygg INGEN IP-geolokaliseringsinfrastruktur för en
   ensam arrangör med ett tiotal event.
3. **Ikoner:** standardisera på `lucide-react` (redan installerat) för
   event-/kalenderytorna. Inget nytt beroende.
4. **Tillgänglighet:** använd vår egen `Dialog.tsx`
   (`react-aria-components`) för registreringsflödet — kopiera INTE Lumas
   modal-mönster på just detta plan. Om ett kalender-"prick"-mönster byggs:
   ge det både tillräcklig kontrast (≥3:1) och ett textalternativ
   (`aria-label`), till skillnad från Lumas uppmätta 2,30:1 och `null`.
5. **Innan cover-bildens 1:1-kvadratformat antas:** stäm av mot Vue-appens
   och mallarnas befintliga bildkonventioner (utanför detta pass).
6. **Ett tredje, ännu snävare pass** kan stänga § 9 punkt 1–2 om frågorna
   blir designkritiska senare — ingen brådska idag.

---

## Källförteckning

### Förstapart — Luma (samtliga hämtade/mätta 2026-09-19)

- Startsida: `https://luma.com`
- Discover: `https://luma.com/discover`
- Stadssida: `https://luma.com/stockholm`
- Organisatörskalender: `https://luma.com/creativesgettingcoffee`
- Organisatörskarta: `https://luma.com/creativesgettingcoffee/map`
- Eventsida 1 (ljust tema, gratis): `https://luma.com/nkurm7qd`
- Eventsida 2 (mörkt tema, gratis, endast värd-roll): `https://luma.com/7a7hzy2j`
- Eventsida 3 (fullbokat/väntelista): `https://luma.com/hk5177rz`
- API: `GET https://api.luma.com/discover/bootstrap-page` (debug_info-fältet)
- Kartleverantörer, mätt via nätverksanrop: `maps.googleapis.com`,
  `www.google.com/maps/embed/*`, `cdn.apple-mapkit.com/mk/6/mapkit.core.js`

### Tredjepart — verifierat teknisk fakta (hämtade 2026-09-19)

- Lucide, ikon-källkod:
  `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/house.svg`
- Lucide, licens: `https://lucide.dev/` (ISC)
- Heroicons, ikon-källkod:
  `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/optimized/24/outline/home.svg`
- Heroicons, licens:
  `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/LICENSE` (MIT)
- Phosphor Icons, ikon-källkod:
  `https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/house.svg`
- Phosphor Icons, licens/repo: `https://github.com/phosphor-icons/core` (MIT)

### Interna källor (detta repo)

- [`luma-studie-monster-for-nya-miranon-se-2026-09-19.md`](luma-studie-monster-for-nya-miranon-se-2026-09-19.md) — föregångarpasset
- `src/styles/tokens/primitives.css`, `semantic.css` — vårt token-system
- `src/components/primitives/Dialog.tsx` — vår egen, korrekta dialog-implementation
- `package.json` (rad 88) — `lucide-react`-beroendet
- Lighthouse-rådata: `lighthouse-eventsida-1.json` (se skärmdumpskatalogen nedan, ej i repot)

### Skärmdumpar (lokalt, ENDAST i scratchpad — inte i repot)

`/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/0d749d3e-4015-4e6a-8477-b1c31a5545c7/scratchpad/luma/`:
`hemsida-1440.png`, `discover-1440.png`, `stad-stockholm-1440.png`,
`stad-stockholm-375.png`, `eventsida-1-ovanfor-vecket-375.png`,
`eventsida-1-fullsida-375.png`, `eventsida-1-morkt-lage-375.png`,
`eventsida-2-morkt-tema-1440.png`, `eventsida-3-vantelista-1440.png`,
`organisatorskalender-1440.png`, `kalender-karta-1440.png`,
`lighthouse-eventsida-1.json`, `lighthouse-run.log`.
