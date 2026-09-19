---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Stackprov: Next.js mot Astro för nya miranon.se (2026-09-19)

> **Proveniens:** tekniskt PROV (Session 128), kört av orkestreraren i
> worktreen `.claude/worktrees/s128-docs` (gren `docs/s128-batch-3`).
> Två KASTBARA prototyper byggdes UTANFÖR repot
> (`scratchpad/stackprov/next/` och `scratchpad/stackprov/astro/`),
> mättes, och lämnas kvar på disk för Marcus att titta på. Inget i repot
> ändrades utöver denna fil. Frågan detta prov svarar på: vilken av
> Next.js (App Router) och Astro (med React-öar) ger bäst utfall på
> Marcus beslutsordning (prestanda → stackpassning → CSP-nivå) när SAMMA
> eventsida byggs i båda — mätt, inte bedömt. Bakgrund:
> `tasks/sessions/2026-09-19-session-128.md` Del 6, samt
> `docs/research/miranon-se-stack-och-repoform-2026-09-19.md` (den
> okvitterade Next.js-rekommendationen detta prov prövar mot verklighet).

## Kort svar

**Astro vinner på alla tre axlar i Marcus beslutsordning, mätt:**

1. **Prestanda** — Astro Lighthouse mobil: Performance 98 (stabilt, 5/5
   körningar), Next.js: 90 median (spridning 85–91). LCP Astro ~2 262 ms
   mot Next ~2 627 ms. TBT Astro 36–103 ms mot Next 281–435 ms. Skillnaden
   är STOR NOG att vara beslutsgrundande, inte brus (se § Mätpunkt 3).
2. **Stackpassning** — primitiverna (Button/Dialog/Input/Modal) och
   token-filerna gick att importera OFÖRÄNDRADE i båda, men bara efter
   samma ovanliga workaround (symlänk i projektroten) i båda; Astro krävde
   därefter noll extra buggfixar, Next krävde sex separata
   build-blockerande fixar (se § Mätpunkt 1).
3. **CSP-nivå** — Astro når en FULLSTÄNDIGT strikt, hash-baserad CSP (noll
   `unsafe-inline`, noll nonce) medan sidan förblir 100 % statisk. Next.js
   kan INTE nå strängare än `'unsafe-inline'` för script-src och behålla
   både förgenerering och interaktivitet — bekräftat empiriskt, inte bara
   citerat ur dokumentationen (se § Mätpunkt 4).

**Den STÖRSTA enskilda risken med Next.js-rekommendationen i
`miranon-se-stack-och-repoform-2026-09-19.md` var alltså korrekt
identifierad (Lumas 27/100-varning) men UNDERSKATTAD i konsekvens:** det är
inte bara "kräver disciplin" — det är en strukturell egenskap hos App
Routers flight-data-arkitektur som Astros ö-modell inte delar.

**Vad som talar för Next.js ändå:** inget i detta prov. Next.js repo-
precedenten (Luma, Eventbrite) och Vercel-inlåsningsargumentet från
stack-passet kvarstår som giltiga skäl utanför de tre mätta axlarna — men
uppdraget bad uttryckligen att avgöra stackfrågan MED provet, i den
angivna ordningen, och på alla tre platser vinner Astro mätbart.

---

## Exakta versioner

| Paket | Next-provet | Astro-provet |
|---|---|---|
| Ramverk | `next@16.3.5` | `astro@7.3.3` |
| React | `react@19.2.8` / `react-dom@19.2.8` (se § Mätpunkt 1-fynd 6) | `react@19.3.0` / `react-dom@19.3.0` |
| TypeScript | `typescript@7.0.2` | `typescript@7.0.2` |
| Tailwind CSS | `tailwindcss@4.3.3` + `@tailwindcss/postcss@4.3.3` | `tailwindcss@4.3.3` + `@tailwindcss/vite@4.3.3` |
| React Aria Components | `react-aria-components@1.21.1` | `react-aria-components@1.21.1` |
| React-integration | — (kärnan) | `@astrojs/react@6.0.6` |
| MDX/innehåll | `gray-matter@4.0.3` + `next-mdx-remote@6.0.0` | `@astrojs/mdx@8.0.1` (oanvänd i slutversionen, Content Collections räckte, se § Mätpunkt 6) |
| i18n | `next-intl@4.14.5` | inbyggt (`astro:i18n`) |
| Cross-island/komponent-state | React Context (inbyggt) | `nanostores@1.5.3` + `@nanostores/react@2.0.1` |
| Bildoptimering | `sharp@0.35.4` | inbyggt (Sharp under huven, ingen egen dep) |
| pnpm | `12.4.2` (given) | `12.4.2` |
| Node | `v24.13.1` | `v24.13.1` |
| Playwright (mätverktyg) | `playwright@1.63.0`, Chromium 153.0.8010.12 | samma |
| Lighthouse (mätverktyg) | `13.5.0` (`npx --yes lighthouse`) | samma |
| macOS | 26.6.2 (build 25G83) | samma maskin |

Versionerna är de SENASTE STABILA vid mättillfället (`npm view <paket>
version`, 2026-09-19), utom React i Next-provet: se § Mätpunkt 1-fynd 6 för
varför 19.2.8 användes där (kontrollmätning, inte en preferens).

---

## pnpm-installation — godkända byggskript

`pnpm` blockerar livscykelskript som standard (`ERR_PNPM_IGNORED_BUILDS`).
Exakt vad som godkändes, och ingenting annat:

- **Next-provet:** `pnpm approve-builds @parcel/watcher @swc/core --yes`
  — Next.js egen Rust-kompilator (`@swc/core`) och dev-filbevakaren
  (`@parcel/watcher`). Utan dessa startar `next build`/`next dev` inte
  alls. `sharp` krävde INGET godkännande (ingen postinstall flaggades).
- **Astro-provet:** `pnpm approve-builds esbuild --yes` — Astros
  Vite-baserade verktygskedja använder esbuild internt; utan det körs
  inte `astro build`.

Inget annat paket krävde godkännande i någotdera provet.

---

## Tabellen sida vid sida

| Mätpunkt | Next.js (App Router) | Astro (React-öar) |
|---|---|---|
| **1. Delning utan ändring** | Fungerade, efter 6 separata fixar (se nedan) | Fungerade, efter 1 fix (symlänk) applicerad i förväg + samma delade Modal-bugg som Next |
| **2. JS till webbläsaren (event-sidan)** | 628 645 B rått / 189 331 B gzip / 162 933 B brotli | 345 307 B rått / 109 150 B gzip / 95 333 B brotli — **Astro ≈ 45 % mindre rått, ≈ 42 % mindre gzippat** |
| **3. Lighthouse mobil, Performance (median, 5 körn.)** | **90** (spridning 85–91) | **98** (spridning 98–98) |
| **3. LCP (median)** | 2 627 ms | 2 262 ms |
| **3. TBT (median)** | 314 ms | 61 ms |
| **3. Speed Index (median)** | 921 ms (mycket spridning, 776–2 039 ms — se brus-notering) | 2 356 ms (mycket spridning, 1 127–2 422 ms) |
| **3. CLS** | 0,000 (alla körningar) | 0,000 (alla körningar) |
| **3. Accessibility** | 96 (alla körningar, efter fix — se text) | 96 (alla körningar, efter fix — se text) |
| **4. Strängaste FUNGERANDE CSP** | `'unsafe-inline'` krävs (nivå c) — nivå a/b BEVISAT trasiga | Rent hash-baserad, NOLL `unsafe-inline` (nivå b, Astros auto-hash + 1 manuellt tillagd hash) |
| **5. Cross-komponent/ö-state, kod** | 83 rader (React Context, inbyggt) | 63 rader + `nanostores`-beroende |
| **5. Cross-komponent/ö-state, JS-kostnad** | ~0 extra (Context är del av React, redan skickat) | +2 839 B rått i tre små chunkar (`ort.js` 1 490 B, `OrtValjareIsland.js` 613 B, `FlerEventIsland.js` 736 B) |
| **6. Innehåll som filer** | 51 rader, 2 bibliotek (`gray-matter`+`next-mdx-remote`) | 50 rader, INBYGGT (Content Collections, `astro:content`) |
| **6. i18n-grund** | 28 rader + plugin-rad, bibliotek (`next-intl`) — **KROCKAR med SSG i sin enklaste form** (se text) | 5 rader, INBYGGT (`astro:i18n`), NOLL SSG-konflikt |
| **6. JSON-LD** | 2 rader (inline `<script>` + `JSON.stringify`) | 2 rader, identisk teknik |
| **7. Kall byggtid** | 22,9 s (tidigare mätning under högre last: 41,5 s) | 16,3 s |
| **7. Konfigfiler (rot)** | 5 (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts` auto) | 3 (`package.json`, `tsconfig.json`, `astro.config.mjs`) |
| **7. Byggvarningar** | 0 (slutlig build) | 1 (Shiki/CSP-varning, irrelevant — vi använder ingen Shiki) |
| **8. Cache-tömning på begäran** | Kräver Vercel — se § Mätpunkt 8, inte mätt | Kräver Vercel — se § Mätpunkt 8, inte mätt |

---

## Mätpunkt 1 — Delning utan ändring

**Slutresultat: JA, alla fyra primitiver (`Button`, `Dialog`, `Input`,
`Modal`) och alla tre token-filer importeras OFÖRÄNDRADE i båda
prototyperna** — ingen rad kopierad, ingen rad ändrad i
`src/components/primitives/*.tsx` eller `src/styles/tokens/*.css`. Vägen
dit var däremot allt annat än friktionsfri, och identisk friktion drabbade
BÅDA ramverken lika (fynd 5–6 nedan är inte stack-specifika).

### Fynd 1 — Turbopack vägrar bunta ALLT utanför projektroten (Next-specifikt)

Både ett CSS `@import` och ett JS/TS-alias som pekade UTANFÖR Next-appens
egen katalog gav `Module not found`, oavsett om sökvägen var absolut eller
relativ (`../../../…/Users/marcus/…`). En relativ sökväg med `../`-segment
klipptes TYST till `./Users/…` av Turbopacks alias-upplösning — inget
felmeddelande, bara ett tomt resultat. **Minsta ändring som fungerade:**
en SYMLÄNK inuti projektroten (`./worktree-src → <worktree>/src`), pekad
ut av `tsconfig.json`s `paths` och `next.config.ts`s
`turbopack.resolveAlias`. Detta krävde i sin tur att `turbopack.root`
sattes till `'/'` — annars: `Symlink … is invalid, it points out of the
filesystem root`. Astro (Vite) behövde SAMMA symlänk-teknik (tillämpad i
förväg, se fynd 5) men INGEN motsvarighet till `turbopack.root` — Vite
följde symlänken utan extra konfiguration.

### Fynd 2 — TypeScript 7 tog bort `baseUrl`

`tsconfig.json`s `"baseUrl": "."` gav `error TS5102: Option 'baseUrl' has
been removed`. Löst genom att ta bort raden (paths löses ändå relativt
tsconfig-filens katalog). Ramverksoberoende TS7-friktion, träffade bara
Next-provet eftersom Astro-provets `tsconfig.json` ärver
`astro/tsconfigs/strict` och aldrig satte `baseUrl` självt.

### Fynd 3 — `revalidateTag` kräver numera 2 argument (Next 16)

`revalidateTag(tag)` → `error TS2554: Expected 2 arguments, but got 1`.
Next.js 16-formen kräver en `cacheLife`-profil som andra argument:
`revalidateTag(tag, 'max')`. Ren Next.js-API-drift, bekräftar
stack-passets § E-observation om att Next.js 16 är en snabbrörlig,
Vercel-styrd release-takt.

### Fynd 4 — `params` är ett Promise i App Router-sidor (Next 16)

Synkron destrukturering (`{ params }: { params: { slug: string } }`) gav
`undefined` vid statisk prerendering (ENOENT på filen
`content/poddmedverkan/undefined.md`) UTAN kompileringsfel — TypeScript
såg inget fel eftersom typen matchade den GAMLA formen. Måste vara
`params: Promise<{ slug: string }>` + `await params`. Detta är en tyst
runtime-regression, inte en byggfälla — allvarligare klass av friktion än
fynd 2–3.

### Fynd 5 — Astros Tailwind-scanning missade EGNA `.astro`-filer

Efter att `@source`-glober lagts till för `.tsx`-filer (primitiverna) och
provets EGNA `.tsx`-öar, renderades en knapptext-färg FEL i Astro-bygget
— `text-(color:--mm-primary)` fick INGEN genererad CSS-regel, och
webbläsaren föll tillbaka till arvd (mörk) textfärg. Next.js-bygget
genererade regeln korrekt med IDENTISK källkod. Grundorsak, verifierad
genom att diffa kompilerad CSS: min `@source`-lista täckte bara `**/*.tsx`
— Astros egna sidfiler är `.astro`, en HELT ANNAN filändelse som Tailwind
v4:s `source(none)`-avstängning (samma explicita mönster som repots
`src/styles/tailwind.css` använder) aldrig såg. **Minsta ändring:**
`@source "../**/*.astro";`. Detta är ett EXTRA krav Astro har som en ren
React/Next-uppsättning inte har — Astros egna mallfiler är en tredje
filtyp utöver `.ts`/`.tsx`. Efter fixen renderar båda IDENTISKT
(`rgb(212, 150, 10)` text på `rgb(240, 214, 138)` bakgrund — mätt via
Playwrights `getComputedStyle`).

### Fynd 6 — Dialog-primitiven är INTE självbärande i någotdera ramverket

Det AL LVARLIGASTE fyndet i denna sektion, och identiskt i BÅDA
prototyperna. Uppdraget namngav tre primitiver (Button/Input/Dialog) —
men `Dialog.tsx`s eget docblock visar att den komponeras med en FJÄRDE,
`Modal.tsx` (`src/components/primitives/Modal.tsx`), som jag först
missade. Att i stället handrulla `ModalOverlay`/`Modal` direkt ur
`react-aria-components` (strukturellt nästan identiskt) gav ett TYST fel:
`DialogTrigger`s `aria-expanded` blev `true`, `onPress` avfyrades korrekt,
men INGET portal-renderades till DOM:en — noll konsolfel, noll CSP-
relaterat (verifierat med en fullt tillåtande CSP som kontrollmätning).
Bytet till den riktiga `Modal`-primitiven löste det omedelbart i BÅDA
ramverken. Detta är alltså INTE en Next-mot-Astro-skillnad — det är ett
bevis på att "importera primitiverna oförändrade" kräver att KONSUMENTEN
förstår primitivernas INBÖRDES beroenden, inte bara de tre namngivna
filerna. En React 19.3.0-mot-19.2.8-kontrollmätning uteslöt en
React-versionsbugg som orsak (identiskt fel i båda).

**Friktionsräkning:** Next.js krävde sex separata, build- eller
funktions-blockerande fixar (1–4, 6, plus CSP-arbetet i § Mätpunkt 4).
Astro krävde fynd 5–6 — och fynd 5 hade varit UNDVIKBART om jag läst
Astros `@source`-dokumentation lika noga som Tailwind v4:s
arbiträr-värde-syntax. Applicerat man symlänk-tekniken (fynd 1) i FÖRVÄG
(vilket jag gjorde för Astro, informerad av Next-passets fynd), krävde
Astro noll extra Turbopack-liknande workarounds.

---

## Mätpunkt 2 — JavaScript till webbläsaren

Mätt två sätt: (a) ur byggutdatan (`.next/static/`, `dist/_astro/`) med
Node `zlib` (gzip nivå 9, brotli kvalitet 11), (b) ur NÄTVERKET via en
riktig Chromium-sida (Playwright, `networkidle`) mot `next start`
(port 4001) resp. `astro preview` (port 4002) — samma filer, samma
byte-tal i båda mätmetoderna (kryssat).

| | Next.js | Astro | Diff |
|---|---|---|---|
| Rått (okomprimerat) | 628 645 B | 345 307 B | Astro **45,1 %** mindre |
| Gzip | 189 331 B | 109 150 B | Astro **42,3 %** mindre |
| Brotli | 162 933 B | 95 333 B | Astro **41,5 %** mindre |
| Antal JS-request | 8 | 8 | lika |

**Uppdelat, Next.js (approximativt — se friktions-notering nedan):**
Turbopacks produktionschunkar har OPAKA hash-namn
(`2lgjddh9oomy4.js`, `3veu8lcteslso.js` …) utan sourcemap i detta prov.
Grepp efter kända strängar gav en grov attribution: `2lgjddh9oomy4.js`
(228 921 B, störst) innehåller en referens till `react-dom` — sannolikt
React+React-DOM+Next-runtime hopslaget; `44achwmdwwpdv.js` (123 265 B)
innehåller `AnmalDialog`, `FlerEvent` och tre `lucide`-referenser —
sannolikt sid-/komponentspecifik kod; `3veu8lcteslso.js` (178 001 B, näst
störst) gav INGA matchande strängar alls — sannolikt
`react-aria-components` själv, helt minifierad utan spår.
**Friktion:** Turbopack-produktionsbygget ger ingen enkel väg att
attribuera byte till ramverk/React/egen kod utan en bundle-analyzer eller
sourcemaps — inget i standardflödet visar detta.

**Uppdelat, Astro (exakt, ramverkets egen fil-per-modul-namngivning):**

| Del | Rått | Gzip |
|---|---|---|
| Astro-runtime (`client.js`, ö-hydrering) | 209 191 B | 64 824 B |
| React + React-DOM + jsx-runtime | 12 679 B | 4 908 B |
| Egen kod (tre öar + store) | 123 437 B | 39 418 B |

Av "egen kod" är `AnmalDialogIsland.js` (120 598 B) i särklass störst —
den bär `react-aria-components`s FocusScope/Overlay/Press-maskineri
eftersom den är den ENDA ön som importerar Button/Dialog/Input/Modal.
`OrtValjareIsland.js` (613 B) och `FlerEventIsland.js` (736 B) är
triviala, eftersom de bara använder `<select>`/`<a>`/`<div>` + nanostores.
**Detta är korrekt per-ö-kodsplittning, inte duplicering** — biblioteket
laddas bara på den sida som faktiskt behöver det.

---

## Mätpunkt 3 — Lighthouse mobil

**Metod:** `npx --yes lighthouse <url> --only-categories=performance,accessibility
--output=json --chrome-flags="--headless=new"`, INTERFOLIERAT
(N,A,N,A,…), 5 körningar per ramverk, `uptime`-loadavg loggad före VARJE
körning. Mot `next start -p 4001` (produktionsserver, `CSP_NIVA=c`
— den enda FUNGERANDE nivån för Next, se § Mätpunkt 4 — annars hade
Lighthouse mätt en TRASIG sida) och `astro preview --port 4002` (statisk
fil-server). Rådata: `scratchpad/stackprov/lighthouse/next-{1..5}.json`
och `astro-{1..5}.json` (kvar på disk).

**Dataintegritets-korrigering, öppet redovisad:** den FÖRSTA `next-1`-
körningen (arkiverad som `archive-run1/next-1-CORRUPTED-discarded.json`)
kolliderade med en samtidig ombyggnad av Next-appen (`rm -rf .next && next
build` kördes av misstag medan Lighthouse redan var igång) — sidan
serverade bara 39 277 B totalt (mot normalt ~230 000 B), ett tydligt
tecken på en avbruten/ofullständig sida. Körningen kasserades och gjordes
om mot en STABIL server. Hela batchen kördes sedan om en andra gång i sin
helhet efter att ÄVEN ett a11y-relaterat build-fel upptäckts och rättats
(se nedan) — talen i tabellen är från den SISTA, rena körningen
(`scratchpad/stackprov/lighthouse/next-*.json`/`astro-*.json`, inte
`archive-run1/`).

### Rådata

| Körning | Next Perf | Next A11y | Next LCP | Next TBT | Next SI | Astro Perf | Astro A11y | Astro LCP | Astro TBT | Astro SI |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 85 | 96 | 2 768 ms | 435 ms | 921 ms | 98 | 96 | 2 268 ms | 103 ms | 1 330 ms |
| 2 | 87 | 96 | 2 711 ms | 396 ms | 831 ms | 98 | 96 | 2 264 ms | 84 ms | 1 127 ms |
| 3 | 90 | 96 | 2 627 ms | 314 ms | 2 039 ms | 98 | 96 | 2 261 ms | 61 ms | 2 422 ms |
| 4 | 91 | 96 | 2 591 ms | 281 ms | 2 019 ms | 98 | 96 | 2 262 ms | 43 ms | 2 356 ms |
| 5 | 91 | 96 | 2 600 ms | 288 ms | 776 ms | 98 | 96 | 2 260 ms | 36 ms | 2 356 ms |
| **Median** | **90** | **96** | **2 627 ms** | **314 ms** | 921 ms | **98** | **96** | **2 262 ms** | **61 ms** | 2 356 ms |

**Loadavg under mätfönstret** (delad maskin, andra agenter aktiva —
`scratchpad/stackprov/lighthouse/loadavg-log.txt`): sjönk stadigt från
~19 till ~8 (1-min snitt) över de ~3 minuter batchen tog. Eftersom N/A är
INTERFOLIERADE påverkar detta båda serierna lika inom varje par — men
Speed Index-kolumnens STORA spridning i BÅDA serierna (Next 776–2 039 ms,
Astro 1 127–2 422 ms) är sannolikt till stor del maskinbrus, inte en
ramverksegenskap. Performance/LCP/TBT visar däremot en KONSEKVENT
riktning i samtliga 5 par (Astro bättre varje gång) — det mönstret
överlever bruset.

### Accessibility-fyndet — en genuin, delad defekt, INTE en stack-skillnad

Båda ramverken landade på IDENTISKT 96 i den slutliga, rena mätningen —
en `color-contrast`-varning på datumbrickan (`text-(color:--mm-primary)`
på `bg-(--mm-primary-pale)`, dvs. guldtext på blekt guld). **Detta är en
ren designval-defekt i provets EGEN markup** (samma två tokens, `--p-
gold-500` på `--p-gold-300`, i BÅDA byggena — verifierat identiskt via
`getComputedStyle`), inte en ramverksskillnad. En TIDIGARE mätomgång
visade Next=96/Astro=100 — det var Fynd 5 (§ Mätpunkt 1) i verkan: Astros
build renderade AV MISSTAG fel (arvd mörk) textfärg och råkade DÄRIGENOM
klara kontrastkravet. Efter att `@source`-glob-buggen rättades (samma
fix som § Mätpunkt 1 fynd 5) visar båda ramverken korrekt SAMMA defekt.
**Detta demonstrerar varför "mät, tolka inte i förhand" är rätt
disciplin** — den initiala skillnaden hade varit lätt att felaktigt boka
som "Astro är mer tillgängligt", när den i själva verket var en
byggkonfigurationsbugg som DOLDE en riktig defekt.

### Dom på mätpunkt 3

**STOR NOG att vara beslutsgrundande.** Performance-skillnaden (90 mot 98
median, med Astro ALDRIG under 98 och Next ALDRIG över 91) och TBT-
skillnaden (5–7× lägre för Astro, konsekvent i alla 5 par) är för stora
och för konsekventa för att vara mätbrus. LCP-skillnaden (~365 ms median)
är mindre dramatisk men går åt samma håll i alla 5 par.

---

## Mätpunkt 4 — Säkerhetsregeln (CSP)

**Metod:** en RIKTIG HTTP-header (inte `<meta>`-tagg, utom där Astros
EGEN mekanism uttryckligen levererar via `<meta>` — se nedan) serverad av
respektive produktionsserver, verifierad med en fristående Playwright/
Chromium-instans som lyssnar på riktiga `securitypolicyviolation`-
händelser OCH konsolfel — inte antagen ur dokumentationen.

### Next.js — tre nivåer testade, endast (c) fungerar

Konfiguration (`next.config.ts`):

```ts
experimental: { sri: { algorithm: 'sha256' } },
async headers() {
  return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: csp }] }];
}
```

- **Nivå (a) — `script-src 'self'; style-src 'self'` (SRI aktiverat, inga
  hashar/unsafe):** TRASIG. Chromium blockerade exakt 2 inline-skript
  (flight-data, `self.__next_f.push(...)`) och 1 inline-stil, vilket gav
  `Error: Minified React error #412` (hydreringsfel) och en HELT icke-
  fungerande dialog. `experimental.sri` lägger `integrity`-attribut på
  `<script src="...">`-taggar men genererar INGA hashar och skriver INGEN
  header/meta-tagg för de INLINE flight-data-skripten — precis den kända
  begränsningen orkestreraren redan hittat i Next.js källkod/tester
  (session-doket Del 6).
- **Nivå (b) — self + de EXAKTA hashar Chromium efterfrågade:** BEVISAT
  OGENOMFÖRBART, inte bara skört. Jag byggde om Next.js-appen TVÅ GÅNGER
  UTAN NÅGON KÄLLKODSÄNDRING (bara `CSP_NIVA`-miljövariabeln ändrad) och
  jämförde de hashar Chromium krävde: ett av de två skript-hasharna VAR
  DIFFERENT mellan byggena
  (`sha256-ATKMghDJtMgp9h5qO6H2jFPIYzytjFI0o75iaBwVOh0=` →
  `sha256-eLj96t0BD5gXmkYXjn3Td8CwyoxBRQ40Cc9kn26xKtM=`), trots identisk
  källkod. Detta är INTE "hashen skiljer sig per sida" — det är "hashen
  skiljer sig mellan två byggen av EXAKT SAMMA källkod", sannolikt på
  grund av icke-deterministiskt inbäddade modul-/chunk-ID:n i RSC-flight-
  formatet. Det gör en statisk hash-allowlist STRUKTURELLT ogenomförbar:
  headers() för statiskt förrenderade sidor löses vid BYGGTID (mätt: en
  server-omstart utan ombyggnad ändrade INTE den servade headern — bara en
  fullständig `next build` gjorde det), men flight-datans hash är bara
  känd EFTER att bygget är klart. Ett kylkedje-moment-22, inte en
  optimeringsuppgift.
- **Nivå (c) — `'unsafe-inline'` för både script-src och style-src:**
  FUNGERAR. Dialog öppnar, klientvalidering kör, noll konsolfel, noll CSP-
  violations. Detta är den STRIKTASTE nivån Next.js App Router kan nå i
  detta prov utan att antingen (i) göra sidan dynamisk (nonce kräver
  request-tidsrendering, vilket bryter krav 1) eller (ii) bygga ett eget
  build-tids-hash-extraktionssystem för flight-data som Next.js själv inte
  levererar.

### Astro — en fullt strikt, hash-baserad CSP, statisk hela vägen

Konfiguration (`astro.config.mjs`):

```js
security: {
  csp: {
    styleDirective: { hashes: ['sha256-38RhXrc7EdReTKsOm23ZPOCUgniTUUcjky8QOOrQx6o='] },
  },
}
```

Levereras som en `<meta http-equiv="content-security-policy">`-tagg i
`<head>` — INTE en HTTP-header (bekräftat mot Astros egen dokumentation
via context7, och mot `astro preview`s faktiska svarshuvuden, som
saknar CSP helt). Detta är en verklig, dokumenterad begränsning
(`security.csp` "adds a `<meta>` element", fungerar ENDAST i
build+preview, inte i `astro dev`).

- **Astros AUTO-genererade hashar** (7 script- + 2 style-hashar,
  beräknade av Astro själv vid byggtid ur den FAKTISKA renderade HTML:en)
  täcker 100 % av Astros EGET inline-innehåll (ö-hydreringsskript,
  Content-Collection-data) med NOLL manuell insats.
- **En (1) kvarvarande violation** upptäcktes: `react-aria-components`
  injicerar en egen inline-`style` VID RUNTIME (scroll-lock på `<body>`
  när Modal öppnas) — INTE Astros eget genererade innehåll, och därför
  INTE automatiskt hashat. Detta är samma UNDERLIGGANDE bibliotekskälla
  som orsakade ETT AV Next.js egna style-violations (`style-src-attr`),
  men i Astro räckte EN manuellt tillagd hash
  (`security.csp.styleDirective.hashes`) för att stänga hela luckan —
  eftersom scroll-lock-stilen har ETT deterministiskt, stabilt
  CSS-innehåll (verifierat: samma hash höll över en fullständig ombyggnad,
  till skillnad från Next.js flight-data).
- **Efter den manuella hashen: FULLT FUNGERANDE på en RENT hash-baserad
  CSP.** Dialog öppnar, klientvalidering kör, noll konsolfel, noll
  violations, noll `unsafe-inline` NÅGONSTANS i policyn.

### Dom på mätpunkt 4

**Kategoriskt STÖRRE skillnad än de andra två axlarna.** Astro uppnår
kravets ANDRA strikthetsnivå (self + hashar, INGEN `unsafe-inline`) medan
sidan förblir 100 % statisk. Next.js App Router kan BEVISLIGEN inte nå
längre än den TREDJE, svagaste nivån (`unsafe-inline`) i denna arkitektur
— inte på grund av bristande ansträngning, utan på grund av en
strukturell egenskap (icke-deterministisk flight-data-hashning) som
`experimental.sri` uttryckligen INTE löser. Detta var precis den lucka
session-doket (Del 6) flaggade som okvitterad och som detta prov skulle
avgöra — nu avgjord empiriskt, inte teoretiskt.

**Viktig brasklapp:** Astros CSP levereras via `<meta>`, inte header —
`frame-ancestors`, `report-uri`/`report-to` och `sandbox` går INTE att
sätta via `<meta>` (webbplattforms-begränsning, inte Astro-specifik). En
produktionssajt som behöver dessa direktiv måste komplettera med en RIKTIG
header (t.ex. via Vercels `headers`-konfiguration) parallellt med Astros
`<meta>`-tagg — går utmärkt, men är en extra rad att komma ihåg.

---

## Mätpunkt 5 — Interaktivitet över komponent-/ö-gränser

**Uppgift:** en "Byt ort"-väljare i sidhuvudet ska dela tillstånd med
"Fler event"-listan (vald ort framhäver matchande poster).

**Next.js:** löst med vanlig React Context (`OrtProvider.tsx`, 23 rader)
— HELA sidan är ETT React-träd i App Router, så Context fungerar precis
som i vilken React-app som helst. INGEN extra beroende krävs; kostnaden är
0 extra bytes utöver React självt (redan skickat). Nackdelen, mätt
indirekt: eftersom allt är EN trädstruktur går det INTE att hydrera BARA
väljaren och BARA listan separat — hela sidans klient-yta blir i praktiken
en enda stor "ö" (Next har inget koncept för selektiv del-hydrering på
komponentnivå, till skillnad från Astro).

**Astro:** öar delar INTE React Context (varje `client:load`-ö är sin egen
isolerade React-rot — bekräftat mot Astros egen dokumentation). Astros
EGEN rekommendation är Nano Stores (`nanostores` + `@nanostores/react`,
`src/stores/ort.ts`, 7 rader). Kostnad: ett NYTT bibliotek (2 paket) och
+2 839 B rått fördelat på tre små chunkar (`ort.js` 1 490 B,
`OrtValjareIsland.js` 613 B, `FlerEventIsland.js` 736 B). Fördelen: varje
ö förblir sin egen, minimala hydreringsenhet — `OrtValjareIsland.js` är
613 B, en bråkdel av vad motsvarande Next-komponent skulle kosta ISOLERAT
(omöjligt att isolera i Next, se ovan).

**Dom:** Next.js "vinner" på ren kodenkelhet (inbyggt, inga nya
beroenden) för DENNA specifika uppgift. Astro "vinner" på total
sid-JS-budget (mätpunkt 2) eftersom modellen som helhet skickar mindre —
men det är en helhetseffekt av ö-arkitekturen, inte specifikt av
state-delningen. Skillnaden i denna enskilda mätpunkt är för liten
(under 3 KB) för att vara egen beslutsgrund.

---

## Mätpunkt 6 — Innehåll som filer, i18n-grund, JSON-LD

### Innehåll som filer

| | Next.js | Astro |
|---|---|---|
| Mekanism | `gray-matter` (frontmatter) + `next-mdx-remote/rsc` (MDX-kompilering) | `astro:content` Content Collections (`glob()`-loader + Zod-schema) |
| Inbyggt/bibliotek | **Bibliotek** — två separata npm-paket, ingen namngiven kärnfunktion | **Inbyggt** — namngiven, typad kärnfunktion sedan Astro 5 (Content Layer API) |
| Rader | 51 (sida + frontmatter-fil) | 50 (config + sida + frontmatter-fil) |

Radantalet är nästan identiskt — skillnaden är KVALITATIV, inte
kvantitativ: Astros lösning ger TYPSÄKER frontmatter via Zod-schema
(`z.object({...})`, valideras vid `astro build`) utan extra kod; Next.js-
lösningen validerar INGET (fri `data.bild`/`data.lank`-åtkomst, inga
typer) om man inte SKRIVER den Zod-valideringen själv ovanpå
`gray-matter`.

### i18n-grund

**Astro:** 5 rader i `astro.config.mjs` (`i18n: { locales, defaultLocale,
routing }`), INBYGGT, fungerar med `output: 'static'` utan avvägning.

**Next.js: det VIKTIGASTE fyndet i denna sektion.** `next-intl`s egen
dokumenterade "utan routing"-variant (den ENKLASTE vägen, ingen
`[locale]`-mappflytt) läser locale via `cookies()` — men `cookies()`/
`headers()` gör OVILLKORLIGEN en App Router-route DYNAMISK. **Mätt
konkret:** med den cookie-baserade varianten flippade SAMTLIGA fem sidor
i byggutdatan från `● (SSG)` till `ƒ (Dynamic)` — precis den regression
uppdragets krav 1 (sidorna FÖRGENERERAS ALLTID) förbjuder. Den slutliga
prototypen använder därför en HÅRDKODAD locale (ingen cookie-läsning) för
att förbli statisk — vilket betyder att den "enkla" i18n-vägen Next.js
själv rekommenderar för icke-routing-fallet ÄR OFÖRENLIG med krav 1. **Den
ENDA vägen till både i18n-grund OCH SSG i Next.js App Router är FULL
URL-baserad `[locale]`-routing** (`app/` flyttas under `app/[locale]/`,
middleware läggs till) — en väsentligt större refaktor som INTE byggdes i
detta prov (kostnaden är känd men omätt här). Astro betalar noll sådan
avvägning.

### JSON-LD

Identisk teknik i båda: ett server-genererat `schema.org Event`-objekt
skrivet till en inline `<script type="application/ld+json">` (Next:
`dangerouslySetInnerHTML`; Astro: `set:html`) — 2 rader i båda, ingen
skillnad. Verifierat att JSON-LD:t faktiskt renderas i den statiska
HTML:en i BÅDA byggena (grep mot `dist/`/`​.next`-utdatan).

---

## Mätpunkt 7 — Byggtid och utvecklarfriktion

| | Next.js | Astro |
|---|---|---|
| Kall byggtid (`rm -rf .next`/`dist` → bygg) | 22,9 s (senaste mätning, lugnare maskin) — en TIDIGARE mätning under högre systemlast gav 41,5 s | 16,3 s |
| Konfigfiler i roten | 5: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `next-env.d.ts` (auto-genererad) | 3: `package.json`, `tsconfig.json`, `astro.config.mjs` |
| Byggvarningar (slutlig build) | 0 | 1 (Shiki/CSP-not, irrelevant — ingen Shiki används) |

**Byggtiden är INTE en ren ramverksjämförelse** — maskinen delas med
andra agenter (samma loadavg-fenomen som § Mätpunkt 3), och Next.js-talet
varierade nästan 2× mellan två mätningar utan källkodsändring (41,5 s vid
hög last → 22,9 s vid lägre last). Riktningen (Astro snabbare) håller i
båda mätningarna, men den EXAKTA multipeln bör inte tolkas bokstavligt.

**Friktionslistan i sin helhet (kronologisk, båda ramverken):**

1. Turbopack: absolut/relativ import utanför projektroten → `Module not
   found` (Next).
2. TypeScript 7: `baseUrl` borttaget (Next).
3. Turbopack: `outputFileTracingRoot` + `turbopack.root` måste vara
   IDENTISKA eller bygget kraschar med `Invalid distDirRoot` (Next).
4. Turbopack: symlänk som pekar utanför filsystemsroten vägras EXPLICIT
   (`points out of the filesystem root`) tills `turbopack.root: '/'`
   sätts (Next).
5. `revalidateTag` kräver 2 argument i Next 16 (Next).
6. `params` är ett Promise i App Router-sidor, tyst runtime-fel annars
   (Next).
7. Tailwind v4 + PostCSS: saknad `postcss.config.mjs` gav en helt annan,
   kryptisk CSS-parsningsfelkedja (`Unknown at rule: @source`) innan den
   verkliga orsaken (symlänken) hittades (Next).
8. Astros Tailwind-scanning missade egna `.astro`-filer, dolde en
   kontrastdefekt (Astro, § Mätpunkt 1 fynd 5 / § Mätpunkt 3).
9. Dialog-primitivens dolda beroende av `Modal.tsx` — TYST portal-fel,
   identiskt i båda (§ Mätpunkt 1 fynd 6).
10. `next-intl`s enklaste i18n-väg gör SSG omöjligt (Next, § Mätpunkt 6).
11. `@astrojs/check@0.9.10` saknar TypeScript 7 i sin `peerDependencies`
    (`^5.0.0 || ^6.0.0`) — mätt via `pnpm peers check`, ingen faktisk
    körningsfelfunktion observerad, men en öppen, obelagd risk.

**Räkning: 7 Next-specifika friktionspunkter (1–7, plus 10) mot 1
Astro-specifik (8, plus 11 som en obekräftad risk) mot 1 delad (9).**

---

## Mätpunkt 8 — Cache-tömning på begäran (INTE mätt — kräver Vercel)

Per uppdraget: detta krävs INTE i detta prov. Vad som SKULLE behöva mätas
på Vercel, så orkestreraren kan avgöra om ett Vercel-steg behövs som
utslagsfråga:

- **Next.js (`revalidateTag`):** tag-baserad fan-out — EN webhook-anrop
  kan invalidera flera sidor/komponenter som delar samma tagg. Vad som
  bör mätas: faktisk latens från EF-anrop till att Vercels CDN serverar
  ny HTML (stack-passets § E nämner Vercels egen ISR-mekanism, `x-vercel-
  cache`-headern är den mätbara signalen).
- **Astro (Vercel-adaptern, `isr.bypassToken`):** PATH-baserad — EF måste
  känna till och anropa VARJE påverkad URL individuellt
  (`x-prerender-revalidate`-header). Vad som bör mätas: samma latens-mått,
  PLUS hur många URL:er en enskild eventändring i praktiken kräver
  (eventets egen sida + ev. listnings-/"nära dig"-sidor).
- **Gemensamt att mäta på Vercel:** faktisk global purge-tid (Vercel
  utlovar ~300 ms), om `x-vercel-cache: HIT/MISS/STALE` beter sig som
  förväntat för BÅDA ramverken, och om Astro-adapterns `bypassToken`-flöde
  kräver extra secret-hantering utöver Next.js egen.

Detta prov ger INGET underlag för att avgöra mätpunkt 8 — det kräver ett
riktigt Vercel-projekt, vilket uppdraget uttryckligen utesluter.

---

## DOM mot Marcus beslutsordning

**1. Prestanda (mätpunkt 3) — Astro vinner, STOR NOG att vara
beslutsgrundande.** Performance 98 mot 90 median, TBT 5–7× lägre,
konsekvent i alla 5 interfolierade körningspar. Detta är den axel Marcus
uttryckligen rankade högst ("Jag kan inte acceptera sämre prestanda").

**2. Stackpassning (mätpunkt 1, 5, 6, 7) — Astro vinner, marginalen är
mindre men entydig.** Båda kan importera primitiverna oförändrat, men
Astro nådde dit med mindre egen friktion (1 Astro-specifik bugg mot 7
Next-specifika). Astros inbyggda content collections och i18n är
kärnfunktioner; Next.js motsvarigheter är bibliotek, och Next.js i18n-
grund har en DOLD krock med SSG-kravet som Astro helt saknar.

**3. CSP-nivå (mätpunkt 4) — Astro vinner kategoriskt.** Detta är den
STÖRSTA, mest entydiga skillnaden i hela provet: Astro når en fullt
hash-baserad CSP utan `unsafe-inline` NÅGONSTANS, medan Next.js BEVISAT
inte kan komma förbi `'unsafe-inline'` för script-src utan att antingen
ge upp statisk generering eller bygga ett eget, opraktiskt hash-
extraktionssystem för icke-deterministisk flight-data.

**Är skillnaden STOR NOG eller inom mätbruset?** STOR NOG, på alla tre
axlar. Mätpunkt 3:s Performance/TBT-skillnad är konsekvent i 5/5 par (inte
slumpmässig varians). Mätpunkt 4 är en BINÄR skillnad (fungerar/fungerar
inte vid strikt CSP), inte en gradskillnad som kan vara brus. Mätpunkt 1:s
friktionsräkning (7 mot 1) är en räknad, inte skattad, skillnad. De enda
platserna med genuint mätbrus i detta prov är Speed Index (båda ramverken
visar stor spridning, sannolikt maskinlast) och byggtiden (2× variation
utan källkodsändring).

**Vad detta INTE avgör:** stack-passets Vercel-inlåsnings-argument
(Cloudflare äger Astro sedan 2026-01-16) och branschprecedens-argumentet
(Luma/Eventbrite kör Next.js, ingen namngiven Astro-precedent i
event-bokningsklassen) kvarstår OFÖRÄNDRADE av detta prov — de är
riskbedömningar om FRAMTIDEN, inte mätbara idag. Uppdraget bad dock
uttryckligen att stackfrågan avgörs MED provet i Marcus egen
beslutsordning, och på de tre mätta axlarna är utfallet entydigt Astro.

---

## Vad provet INTE visar

- **Lokal server ≠ CDN.** `next start`/`astro preview` är INTE Vercels
  produktionsmiljö — Edge-nätverk, riktig geografisk latens, och Vercels
  egna Image Optimization-pipeline är alla omätta här.
- **En sida ≠ en hel sajt.** Endast eventsidan + poddmedverkan-sidan
  byggdes. Listnings-/kalendersidor, sökfunktion, en riktig anmälnings-
  backend och en verklig mängd innehåll kan förskjuta bilden, särskilt för
  mätpunkt 7 (byggtid skalar med sidantal).
- **Påhittad data.** Alla fem event och podd-innehållet är påhittade
  (Kursgården Exempel, Rönninge m.fl.) — inga verkliga personer, platser
  eller bokningar.
- **Ingen verklig trafik/second visit.** Lighthouse mäter EN kall
  sidladdning per körning — repeat-visit-cachning, Service Workers och
  verklig nätverksvariation (3G/4G-throttling i fält) är inte testat
  utöver Lighthouses inbyggda mobilstrypning.
- **CSP nivå (b) för Next.js visades OGENOMFÖRBAR i DETTA prov** (en
  ensam sida, en enda build-pipeline) — ett STÖRRE, dedikerat
  Next.js-team SKULLE kunna bygga ett eget build-tids-hash-
  extraktionssystem för flight-data; det finns bara inte färdigt i
  ramverket idag, och att bygga det själv är utanför vad detta prov
  omfattar.
- **`@astrojs/check`+TypeScript 7-varningen** (§ Mätpunkt 7, fynd 11) är
  en obelagd RISK, inte en bekräftad bugg — `astro check` kördes inte
  till slut i detta prov (tidsbudget), så den faktiska konsekvensen av
  peer-mismatchen är omätt.

---

## Hur man startar prototyperna

```bash
# Next.js (port 4001) — CSP_NIVA styr säkerhetsnivån (a=strikt/trasig,
# b=hash/instabil, c=unsafe-inline/fungerande — default är a)
cd scratchpad/stackprov/next
pnpm install
CSP_NIVA=c pnpm build && CSP_NIVA=c pnpm start

# Astro (port 4002)
cd scratchpad/stackprov/astro
pnpm install
pnpm build && pnpm preview

# Mätverktyg (Playwright-baserade skript, funktionstest + JS-nätverksmätning)
cd scratchpad/stackprov/tools
pnpm install && npx playwright install chromium
node matning.mjs            # funktionstest + JS-byte per sida, båda servrar måste köra
node debug-contrast.mjs     # jämför beräknad text-/bakgrundsfärg på datumbrickan

# Lighthouse-batchen (kräver båda servrarna igång)
cd scratchpad/stackprov/lighthouse
bash run.sh                 # 5+5 interfolierade körningar, loggar loadavg
```

Prototyperna ligger kvar orörda i `scratchpad/stackprov/` för Marcus att
titta på. Symlänkarna (`next/worktree-src`, `astro/worktree-src`) pekar in
i DENNA worktree (`s128-docs`) — de slutar fungera om worktreen tas bort.

---

## Källor

**Förstaparts-dokumentation (context7, 2026-09-19):** Next.js CSP-guide
(`/vercel/next.js`, `experimental.sri`), Astro i18n/Content
Collections/`security.csp` (`/withastro/docs`), `next-intl`s
"without-routing"-recept (`/amannn/next-intl`).

**Mätningar utförda i detta pass:** samtliga siffror i denna fil är
producerade av kommandona listade ovan mot de två prototyperna i
`scratchpad/stackprov/`, 2026-09-19. Ingen siffra är hämtad ur
dokumentation eller antagen.

**Internt (detta repo):** `tasks/sessions/2026-09-19-session-128.md` Del
6, `docs/research/miranon-se-stack-och-repoform-2026-09-19.md`,
`src/components/primitives/{Button,Dialog,Input,Modal}.tsx`,
`src/styles/tokens/{primitives,semantic,components}.css`.
