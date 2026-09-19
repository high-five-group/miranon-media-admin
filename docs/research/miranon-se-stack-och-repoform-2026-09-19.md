---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Vilken stack och repo-form för nya miranon.se? (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (Session 128), kört **oisolerat**
> i worktreen `.claude/worktrees/s128-docs` (gren `docs/s128-fodelse`).
> Ingen produktionskod eller -data rörd, ingen ny config skriven, inget
> installerat — passet är läsning av repot + webbforskning/context7 plus
> denna fil.

## Vad jag redan hade — och vad som är nytt i detta pass

Läst i sin helhet före första sökningen:

- `tasks/sessions/2026-09-19-session-128.md` Del 1–3 (hela sessionen hittills)
  — de tio grillnings-besluten, Marcus höga designkrav för v1, "innehåll som
  filer", översättningsgrunden, och att stack-frågan **medvetet väntade**
  till efter grillningen eftersom den rör S126:s CI-budget (Del 1, "Ej i
  scope").
- Fyra av S128:s egna sju research-pass:
  `publik-anmalningsvag-utan-inloggning-2026-09-19.md` (EF-lager, jobbmotor,
  bot-skydd — bekräftar att sajten ALDRIG anropar Airtable direkt),
  `publicerings-kontrakt-event-synlighet-bokningsbarhet-2026-09-19.md`
  (fyra-axla livscykelmodell, schema.org `Event`-fälten, och ett helt
  avsnitt om flerspråkighet på DATAMODELL-nivå — återanvänt rakt av i detta
  pass, se § 4 nedan i stället för att göra om det arbetet),
  `event-nara-dig-och-karta-2026-09-19.md` (kartleverantörs-jämförelse med
  CSP-krav per leverantör — återanvänd i § Krav 10),
  `luma-visuell-matning-och-nara-dig-2026-09-19.md` (Lumas Lighthouse-tal:
  tillgänglighet 88, **prestanda 27 på mobil** — en central, mätt varning
  jag väger in nedan).
- `tasks/sessions/2026-09-17-session-126.md` Del 17–18 (`git show
  origin/main:...`, eftersom denna worktree kan vara efter) — CI-budgetens
  grillade beslut: mål **< 50 000** fakturerade CI-minuter/månad, snubbeltråd
  vid **40 000**, väntetidstak dokument ≤ 5 min / kod ≤ 12 min median / 15 min
  p95, och att repot blir **privat** detta veckoslut. Kostnadstalen per
  landningstyp (§ Krav 8 nedan) är hämtade direkt härifrån, inte omräknade.
- `docs/research/repo-privat-konsekvenser-2026-09-18.md` — bekräftar att
  merge queue, ruleset och `gh`-flödet är oberoende av synlighet (org redan
  Enterprise Cloud), och att Actions-minuter blir en verklig kostnad från och
  med privat-bytet.
- `docs/research/t95-r1-hosting-vercel-2026-08-02.md` — **den viktigaste
  enskilda källan för krav 10.** Den falsifierade redan 2026-08-02
  nonce-CSP-mönstret för dagens statiska Vite-SPA (fel header-mekanism för
  Vercel, nonce-mismatch, fel branschmönster för statiskt innehåll) och
  landade på `script-src 'self'` som korrekt 2026-mall, citerat mot Googles
  egen `web.dev`-guide. Detta pass **återanvänder den domen** för
  Vite-SPA-noll-alternativet och **prövar den mot varje ny kandidat** i
  stället för att göra om mätningen.
- `.github/workflows/ci.yml`s `paritet:start klassning-d0`-block (läst direkt
  ur denna worktrees kopia) — D0-allowlistens exakta form, se § Krav 8.
- `package.json`, `tsconfig*.json`, `biome.json`, `vercel.json`,
  `vite.config.ts` — dagens faktiska versioner och konfiguration, se § C.

**Vad som är NYTT i detta pass** (fanns inte i något av ovanstående): hela
ramverksjämförelsen (Next.js, Astro, TanStack Start, React Router,
Vite-SPA-noll-alternativet) mot de tretton kraven, versions- och
peer-dependency-verifiering mot repots faktiska `package.json` (React
19.2.8, Vite 8.2.2, TypeScript 7.0.2, Biome 2.5.11), branschprecedent mätt
via HTTP-headers och HTML-fingeravtryck (inte gissad), repo-formsanalysen
(§ C), Vercel-monorepo-mekaniken (§ D), cache-invalideringens konkreta
mekanik per kandidat (§ E), i18n-ramverksjämförelsen (§ F), och — det
enskilt mest oväntade fyndet — att **Astro sedan 2026-01-16 ägs av
Cloudflare**, en direkt konkurrent till det hostingval uppdraget kräver
(§ G, § Oväntade fynd).

**Åldersbedömning:** allt ovanstående är från SAMMA session (2026-09-19,
timmar gammalt) och behövde ingen omprövning — bara nytt arbete ovanpå.

---

## Kort svar

**Domen:** **Next.js (App Router) på Vercel, i samma repo som admin-appen,
via npm workspaces**, med en STEGVIS, reversibel migrationsväg för delade
tokens och komponenter — inte en engångsflytt av hela `src/`.

Den avgörande delfrågan var **inte** "vilket ramverk är bäst för en
innehållssajt" (där Astro objektivt vinner på pappret: inbyggd i18n-routing,
inbyggd hash-baserad CSP, content collections, minst JavaScript som
standard). Den avgörande delfrågan blev **"vilket val minimerar risk mot ett
hostingkrav vi inte kontrollerar"**: Astro Technology Company förvärvades av
**Cloudflare** 2026-01-16 — en direkt konkurrent till Vercel, som uppdraget
namnger som obligatoriskt hostingval (krav 6). Det är inte bevisat att
`@astrojs/vercel`-adaptern kommer försummas, men det är ett nytt,
verifierbart styrningsrisk-lager som inte fanns när Astro var ett
fristående, plattformsneutralt bolag — och som väger tungt i en
treårs-bedömning (krav "ånger om tre år"). Next.js är **byggt av Vercel**:
noll motsvarande risk mot det hostingkrav vi redan är låsta vid.

Näst starkast vägande: **branschprecedenten är inte jämnstark.** Luma —
Marcus egen uttryckliga designinspiration — kör mätbart Next.js på Vercel
(HTTP-huvuden bekräftar det, se § B), liksom Eventbrite (samma
produktklass: innehåll + dynamisk eventdata + formulär). Jag hittade
**ingen** namngiven, verifierbar produktionssajt som kombinerar Astro med
just event-bokning; en tutorial (Astro + Directus, "How to build an event
ticketing system") är inte en precedent. Astros fyra precedenter i detta
pass (astro.build, docs.astro.build, netlify.com, ikea.com) är samtliga
innehålls-/marknadsföringssajter utan dynamisk bokningsflora av vår typ.

**Men Lumas eget Lighthouse-mobilbetyg (27/100, mätt i ett tidigare S128-pass)
är en konkret varning mot att kopiera stacken blint** — Next.js garanterar
inte bra Core Web Vitals (krav 9); det kräver disciplin (statisk/ISR-
rendering som norm, minimal klient-komponentyta). Rekommendationen nedan är
därför Next.js **plus** en uttrycklig arkitekturregel som lånar Astros
princip utan att byta ramverk.

**Repo-formen:** npm workspaces (verktyget finns redan i `package.json`/
`package-lock.json` — ingen ny CLI, inget paketbyte). Turborepo/pnpm/Nx
avvisas INTE på sikt, men byggs inte nu — det vore att bygga "ifall", exakt
det S126:s CI-grillning nyss beslutade att aldrig göra (beslut 2).

---

## A. Jämförelsetabell — kandidat × de tretton kraven

Källmärkning: **V** = verifierat mot förstapartskälla/mätning i detta pass
(URL/kommando i löptexten nedan), **H** = hypotes/branschkunskap ej
verifierad i detta pass, **–** = ej relevant för den raden.

| Krav | Next.js (App Router) | Astro | TanStack Start | React Router (ramverksläge) | Vite-SPA + förrendering (nollalternativ) |
|---|---|---|---|---|---|
| 1. Delar tokens+komponenter, samma repo | V — npm workspaces, se § C | V — samma mekanik | V — samma mekanik | V — samma mekanik | V — trivialt, redan samma app |
| 2. React-baserad | V — React är kärnan | V — React-öar via `@astrojs/react` (peer `^19.0.0`, mätt `npm view`) | V — React är kärnan | V — React är kärnan | V — redan React |
| 3. SSR/SSG + JSON-LD | V — App Router SSG/ISR/SSR; Luma bevisar mönstret (§ B) | V — `output: static\|hybrid\|server`, dokumenterat | V — SSR + selektiv SSR (`ssr:'data-only'\|false`), dokumenterat | V — `ssr:true`+`prerender`, dokumenterat | V — förrendering kräver EGET verktyg (t.ex. `vite-plugin-ssg` eller en build-tids-crawl) — inte inbyggt, se § Krav 3 nedan |
| 4. i18n-grund (adress, språkfiler, `lang`/hreflang) | H/V — App Router saknar INBYGGD locale-routing i länkar (`next/link`s `locale`-prop stöds inte, mätt i Next-källkod); kräver `next-intl` (mätt: npm `4.14.5`) | **V** — inbyggd `i18n`-config (`locales`, `routing.prefixDefaultLocale`, `fallback`), dokumenterat | H — ingen inbyggd i18n-routing hittad i detta pass; kräver bibliotek | H — ingen inbyggd i18n-routing; kräver bibliotek | H — kräver bibliotek + egen route-struktur, som idag |
| 5. Innehåll som filer | H — inget NATIVT content-collection-system; kräver enkel fs+frontmatter-lösning (bedömning, ej mätt produkt) | **V** — Content Collections är en NAMNGIVEN, inbyggd, typad funktion (stabiliserad Astro 5, bekräftad i dokumentationen) | H — filbaserat via egna loaders, ej ett namngivet subsystem | H — samma | H — samma som Next |
| 6. Vercel + servrkod (IP-ort) | V — `x-vercel-ip-city` läses i valfri Node/Edge-funktion; Next har Route Handlers/Middleware | V — Vercel Edge Middleware ger `geolocation()`/`ipAddress()`-hjälpare DIREKT (mätt i Vercels egen Astro-sida, se § E) | V — Nitro-serverfunktioner kan läsa samma header | V — Vercel Functions via `@vercel/react-router`-preset (mätt, se § E) | H — Vercel Edge/Serverless Function bredvid SPA:n, extra rörligt del |
| 7. Cache-invalidering (EF → publicera → cache töms) | **V** — `revalidateTag(tag, profil)`, TAG-baserad fan-out, en enda HTTP-anrop kan invalidera flera sidor | V — `isr:true`/`bypassToken`+`x-prerender-revalidate`-header, men PATH-baserad (en URL åt gången) | H — endast `Cache-Control`+egen CDN-purge; **inget dokumenterat Vercel-ISR-läge** | H — samma; **React Router/TanStack Start finns INTE i Vercels egen ISR-tabell** (mätt, se § E) | H — statisk build måste triggas om helt (t.ex. Vercel Deploy Hook) — grövst möjliga granularitet |
| 8. CI-fotavtryck (separat från admin-appens tunga sviter) | V — kräver NY path-klassning i `ci.yml` (D0-mönstret finns, men `apps/site/**` är INTE i dagens allowlist) | Samma som Next | Samma | Samma | Samma — men SPA:ns EGNA sviter (Playwright-klasserna) kan i teorin återanvändas rakare |
| 9. Core Web Vitals mobil, a11y-11 | H — UPPNÅBART men INTE garanterat (Luma: 27/100 mobil, mätt tidigare S128-pass, se § Kort svar) | H — Astros "minst JS som standard"-arkitektur ger en STRUKTURELLT bättre startpunkt (öar, inte helsidas-hydrering) | H — samma generella SSR-hydrerings-profil som Next/React Router | H — samma | H — dagens app är redan mätt mot 11/11/11-ribban internt, men aldrig publikt CWV-mätt |
| 10. Strikt CSP hash/self (Fas 7) | **V — GAP:** officiell CSP-guide är NONCE-baserad och kräver dynamisk rendering per sidvisning; INGEN dokumenterad hash-väg för RSC-flödesdata hittad i detta pass | **V — starkast:** inbyggt, dokumenterat hash-baserat CSP-system sedan v6.0.0, fungerar med statisk OCH on-demand-rendering | H — ej undersökt i detta pass | H — ej undersökt i detta pass | V — `t95-r1` visade redan `'self'` räcker (noll inline script/style-ELEMENT) |
| 11. Stänger inte dörren för biljettkassa v2 | H — generellt ramverk, Route Handlers/Server Actions bär betalflöden lika bra som allt annat | H — samma, via Server Endpoints | H — samma | H — samma | H — samma |
| 12. Cookiefri statistik utan banner | – (ramverksoberoende) | – | – | – | – |
| 13. SEO "till max" | **V — starkast:** `generateMetadata` med `alternates.canonical`+`alternates.languages` (hreflang), filbaserad `sitemap.ts`/`robots.ts`, `next/og` för dynamiska OG-bilder — allt inbyggt | V — `@astrojs/sitemap` (officiellt tillägg), `Astro.site` för kanonisk URL, OG-bilder kräver mer handpåläggning/community-lösning | V — route-nivå `head()` med meta+JSON-LD, automatisk sitemap-crawl VID prerender — nyare, mindre standardiserat mönster | V — route-`meta()`-export, kanonisk länk via `tagName:'link'`-descriptor — mer manuellt än Next | V — helt manuellt, inget ramverksstöd alls idag |

**Metod bakom raderna ovan:** varje "V" bär en källa i löptexten nedan
(§ B–§ G); ingen cell är gissad utan markering.

---

## B. Branschprecedent per allvarlig kandidat

### Vad Luma själv kör — mätt, inte citerat

`curl -sI https://luma.com/` (2026-09-19): `x-powered-by: Next.js`,
`x-vercel-id: arn1::pdx1::…`, `x-vercel-cache: MISS`. HTML-kroppen
innehåller `_next/static`-referenser och `__NEXT_DATA__`. En enskild
eventsida (`luma.com/gv331avt`) renderar server-side ett komplett
`application/ld+json`-block (`data-next-head=""`, dvs. injicerat av Next.js
`Head`) med `@type: Event`, `eventStatus`, `eventAttendanceMode`,
`location.geo`, `image`, `description` — exakt schema.org-formen
`publicerings-kontrakt`-passet redan hade dokumenterat teoretiskt. **Detta
är den starkaste enskilda datapunkten i hela passet**, eftersom Luma är
Marcus egen, uttryckliga designinspiration.

Både `luma.com/` och eventsidan svarar `cache-control: private, no-cache,
no-store, must-revalidate` och `x-vercel-cache: MISS` — Luma cachar alltså
INTE dessa sidor på CDN-nivå (troligen på grund av personalisering/
inloggningsstatus). Det är inte bevis för att ISR aldrig används på lu.ma,
bara att just de sidorna jag mätte serveras dynamiskt. **Vad jag inte kunde
belägga:** om Luma använder ISR för NÅGON sida.

### Next.js — fyra namngivna, mätta precedent

| Sajt | Bevis (mätt 2026-09-19) | Klass |
|---|---|---|
| Luma (`luma.com`) | Se ovan | Event + innehåll + formulär — **exakt vår klass**, uttrycklig inspiration |
| Vercel (`vercel.com`) | `server: Vercel`, `x-powered-by: Next.js, Payload`, `x-vercel-cache: HIT` | Innehåll + produkt, ISR-mönster synligt (`cache-control: public, max-age=0, must-revalidate`) |
| Notion (`notion.com`) | `x-powered-by: Next.js`, `x-vercel-id`, `x-vercel-cache: MISS` | Innehåll + app-marknadsföring |
| Eventbrite (`eventbrite.com`) | `x-powered-by: Next.js`, `server: CloudFront` (AWS, EJ Vercel — visar att Next fungerar host-oberoende), `cache-control: max-age=300, s-maxage=600, stale-while-revalidate=3600` | **Event-ticketing, samma produktklass som miranon.se**, tydligt CDN-ISR-mönster |

### Astro — fyra namngivna, mätta precedent (ingen i vår produktklass)

| Sajt | Bevis (mätt 2026-09-19) | Klass |
|---|---|---|
| astro.build | `generator" content="Astro v7.3.2"` | Dogfooding, ramverkets egen sajt |
| docs.astro.build | `generator" content="Astro v7.2.10"` + `Starlight v0.42.0` | Dokumentationssajt |
| netlify.com | `astro-island`/`data-astro-cid`-markörer | Marknadsföring + produktsida |
| ikea.com (global) | `astro-island`/`data-astro-cid`-markörer (hittad via `astro.build/showcase`) | Global e-handels-/marknadsföringssajt |

**Deklaration om tunnhet (krav J):** jag sökte specifikt efter "Astro +
event booking/ticketing produktion" och "Astro content collections + React
island booking form production 2026". Jag hittade EN tutorial
("How To Build An Event Ticketing System with Astro and Directus",
echobind.com) — en instruktionsartikel, INTE en namngiven, verifierbar
produktionssajt, och den räknas alltså inte som precedent. **Precedent-
rymden för "Astro i vår exakta produktklass" är tunn — jag deklarerar det
öppet, räkningen är inte fejkad.** Astros fyra precedenter ovan bevisar att
ramverket bär skala och innehållstyngd väl (IKEA, Netlify) — de bevisar
INTE att det bär dynamisk eventbokning i produktion hos någon namngiven
aktör.

### TanStack Start — ingen produktionsprecedent hittad

`tanstack.com` (ramverkets egen sajt) fingeravtrycks som en Vite-SPA med
TanStack Router (`/assets/index-*.js`-hashning, `tsr-`-markörer) — **inte**
bevisat byggd med Start själv. Jag hittade ingen annan namngiven
produktionssajt i detta pass. Detta är den TUNNASTE precedent-rymden av de
fyra kandidaterna — deklarerat öppet, inte gissat bort.

### React Router (ramverksläge) — en indirekt, namngiven precedent med en nyansviktig brasklapp

Shopifys Hydrogen (`hydrogen.shopify.dev`, mätt via `WebFetch` 2026-09-19)
säger ORDAGRANT: *"Hydrogen is built on Remix, the framework from the
creators of React Router."* Det är alltså **Remix**, inte det omdöpta
`react-router`-paketet självt, som är den namngivna precedenten — en
verklig skillnad, inte en teknikalitet: Remix v2:s motor slogs samman in i
React Router från och med v7 (samma team, ny branding), men Shopifys EGEN
dokumentation har inte uppdaterats till att kalla det React Router. Jag
hittade ingen annan namngiven produktionssajt som uttryckligen kör
`react-router`-paketets ramverksläge (postv7/v8-branding) i detta pass.

---

## C. Repo-formen

### Dagens läge, mätt

`package.json` saknar `workspaces`-fältet — repot är EN paket-rot med npm
(inte pnpm/yarn: `package-lock.json` finns, `lockfileVersion: 3`).
`tsconfig.app.json` har redan `paths: {"@/*": ["./src/*"]}` — ett enkelt
relativt alias, inte ett workspace-medvetet paketsystem. Projekt-referenser
finns REDAN (`tsconfig.json` refererar `tsconfig.app.json`,
`tsconfig.node.json`, `tsconfig.tests.json`, `tsconfig.edge-shared.json`) —
mönstret för "flera TypeScript-projekt i samma repo" är alltså redan
etablerat och fungerande, bara inte ännu som npm-workspace-paket.
`biome.json`s `files.includes` är `**` med explicita undantag — den
skannar redan HELA repot rekursivt, en ny katalog kräver ingen ändring där.

### npm workspaces kontra pnpm/Turborepo/Nx kontra "andra ramverksrot i samma paket"

| Alternativ | Kostnad att införa | Vad det ger utöver dagens läge | Bedömning |
|---|---|---|---|
| **npm workspaces** | Lägst — `"workspaces": ["apps/*", "packages/*"]` i root-`package.json`, `npm install` länkar lokalt, INGEN ny CLI, INGEN ny lockfile-typ | Delning av paket utan publicering (`file:`-länkning sker automatiskt) | **Golvet** — noll ny inlärning, noll ny CI-yta att härda |
| **pnpm workspaces** | Medel — byter paketmanager helt (`package-lock.json` → `pnpm-lock.yaml`), rör VARJE `npm run`-anrop i skript, CI, `.githooks/`, `postinstall`-hooken | Snabbare install, striktare dependency-isolering | Inte motiverat av något av de tretton kraven — spekulativ komplexitet just nu |
| **Turborepo** (ovanpå npm/pnpm workspaces) | Låg-medel — `turbo.json` + `npx turbo build`, Vercel-ägt, GRATIS fjärrcache när kopplat till Vercel (mätt: `turborepo.dev/blog/free-vercel-remote-cache`) | Byggcache mellan CI-körningar och lokalt — sänker CI-minuter vid TVÅ-appars-skala | **Bygg INTE nu** — S126 beslut 2: "Inget byggs ifall." Infogas när mätning visar att build-tiden för två appar faktiskt gör ont, inte i förväg |
| **Nx** | Hög — egen graf-motor, plugin-ekosystem, betydligt större inlärningskurva än Turborepo för samma nytta i vår skala | Avancerad task-orkestrering, generatorer | Överdimensionerat för två appar + ett par delade paket — avvisas |
| **"Andra ramverksrot i samma paket"** (t.ex. `site/` som en helt egen Next-app UTAN workspace-länkning, delning via kopiering) | Lägst kortsiktigt, HÖGST långsiktigt | Inget — kopierade tokens/komponenter DRIFTAR isär inom veckor (exakt det krav 1 vill undvika) | Avvisas — bryter krav 1 rakt av |

**Rekommendation: npm workspaces, Turborepo som medveten, deferred
uppgradering.**

### Vad krävs av dagens `src/`-struktur, och vad det kostar

En FULL flytt av `src/` till `packages/admin/src/` rör alla ~167 `.tsx`-
filer, samtliga `import`-sökvägar, CI:s path-baserade klassning (varje
gatekeeper-svit och den D0-allowlisten ovan pekar på dagens rotnivå-sökvägar
som `src/**`, `tests/**`), och riskerar att kollidera med de MÅNGA öppna
grenarna (S126/S127 body aktiva parallellt, se ingångstillståndet i
sessionsdoket). **Det är fel första steg.**

**Stegvis, reversibel migrationsväg (varje steg körbart och testbart för
sig):**

1. **Flytta ENDAST `src/styles/tokens/` → `packages/tokens/`** (tre CSS-
   filer, ingen logik, `--p-`/`--mm-`-prefix orörda). Admin-appen pekar om
   sina tre `@import`-rader till den nya workspace-sökvägen. Detta är en
   mekanisk, lågriskändring som kan verifieras med `npm run build` +
   visuell diff — inget nytt beteende, bara en ny fil-adress. **Kan göras
   OAVSETT vilket ramverk sajten till slut väljer.**
2. **Skapa `apps/site/`** som en ny, tom Next.js-app i samma npm-workspace,
   konsumerar `@miranon/tokens`. Admin-appens `src/` rörs INTE.
3. **Extrahera enskilda primitiv-komponenter till `packages/ui/` FÖRST NÄR
   sajten faktiskt behöver återanvända en** (extraktion vid faktiskt behov,
   inte i förväg — samma princip som repots egen
   över-engineerings-vakt: "ingen abstraktion utan en faktisk nuvarande
   användare"). Första kandidaten är sannolikt en knapp/länk-primitiv från
   `src/components/primitives/`.
4. **Turborepo (steg 4, VÄNTAR):** infogas bara om `npm run build`-tiden
   för två appar mätbart gör ont — se § D0-tabellen ovan.

**Vad som kan VÄNTA helt:** att flytta admin-appens ÖVRIGA `src/`-innehåll
(routes, domain, data, auth …) in i ett `packages/`- eller `apps/admin/`-
paket. Det finns inget krav i uppdraget som tvingar fram det, och kostnaden
(167 filer, alla CI-sökvägar, alla öppna grenar) är för hög för en vinst
ingen efterfrågat.

---

## D. Vercel: två projekt ur ett repo

**Root Directory per projekt** (Vercel — Using Monorepos, hämtat
2026-09-19): varje app blir ett EGET Vercel-"Project" med en relativ sökväg
(från repo-roten) satt under **General → Root Directory**. Detta är
etablerad, dokumenterad mekanik — inget ovanligt eller experimentellt.

**Ignored Build Step** (samma källa): ett skal-kommando per projekt; bygget
fortsätter bara om kommandot returnerar exitkod **1**. `npx turbo-ignore`
är Vercels egen färdiga variant, MEN eftersom vi rekommenderar att INTE
adoptera Turborepo än (§ C), är den naturliga vägen i stället ett eget,
litet skript byggt på SAMMA path-glob-mönster som `ci.yml`s befintliga
D0-klassning — konfig-drivet, inte en ny verktygsberoende, i linje med
repots etablerade princip ("Custom CI-grindvakts-logik i spokes är alltid
config-driven", `~/.claude/CLAUDE.md`). Delade paket (`packages/**`) måste
träffa BÅDA projektens Ignored-Build-Step-regler.

**Förhandsvisningar per PR:** ärvs automatiskt — Vercel skapar en preview-
deploy per projekt och PR oavsett Root-Directory-uppdelning; ingen extra
konfiguration behövs utöver att koppla båda projekten till samma repo
(samma mekanik som admin-appen redan använder, `t95-r1`).

**Miljövariabler:** satta PER Vercel-projekt (inte delade automatiskt) —
sajten behöver sin egen uppsättning (Supabase EF-URL, ev. kart-API-nycklar)
oberoende av admin-appens.

**Kostnadspåverkan på Pro:** `t95-r1` (2026-08-02) fastslog redan att Pro-
planen är obligatorisk för admin-appen på grund av kommersiell användning
($20/utvecklarplats/månad). Vercels egen gräns-dokumentation (samma källa)
visar INGET tak på ANTAL projekt per team på Pro — gränserna är per-projekt
(data transfer, edge requests, etc.), inte en projekträknare. **Jag kunde
INTE verifiera i detta pass** om ett andra projekt drar en helt separat
resurskvot eller delar teamets Pro-kvot (rimligt antagande: delar kvoten,
men obelagt här — verifiera mot Vercels aktuella pris-/gränssida innan
beslut).

---

## E. Cache-invalideringen (krav 7) — konkret per kandidat

**Next.js (`revalidateTag`):** en Route Handler (t.ex.
`app/api/revalidate/route.ts`) läser ett hemligt token ur query-parametern,
validerar det, och anropar `revalidateTag(tag, 'max')` (Next.js 16-formen —
en `cacheLife`-profil krävs numera som andra argument, mätt i Next.js
16-bloggen). Supabase Edge Function POST:ar en signerad request dit vid
publicera/ändra. **Fan-out är TAG-baserad**: en tagg som `event-<id>` OCH
en delad tagg `events-lista` kan invalideras separat eller tillsammans i EN
anrops-sekvens, och Next propagerar automatiskt till varje sida/komponent
som konsumerade den taggen — den enda kandidaten med denna granularitet.

**Astro (Vercel-adaptern):** `adapter: vercel({ isr: { bypassToken } })`.
Invalideringen sker genom att EF anropar den SPECIFIKA sidans egen URL med
headern `x-prerender-revalidate: <bypassToken>` (Vercels ISR-primitiv,
samma mekanism Next.js använder under huven). **Path-baserad, inte
tag-baserad:** publicerar Lotta ett event måste EF känna till och anropa
VARJE påverkad URL (eventets egen sida, ev. listnings-/kalendersida,
"nära dig"-sidan om den listar eventet) individuellt — mer skrivarbete i
EF-lagret, men fullt görbart med en känd, ändlig uppsättning URL-mönster.

**TanStack Start:** dokumentationen (`tanstack.com/start/.../guide/isr`)
visar ENDAST HTTP `Cache-Control`-headers (`s-maxage`,
`stale-while-revalidate`) plus ett HANDBYGGT exempel där en egen endpoint
anropar CDN-leverantörens (Cloudflare, i deras exempel) purge-API med ett
hemligt token. **Ingen Vercel-specifik ISR-integration är dokumenterad**,
och Vercels EGEN ISR-tabell (`vercel.com/docs/incremental-static-
regeneration`, `last_updated: 2026-08-28`) listar EXPLICIT: *"Next.js,
SvelteKit, Nuxt, Astro, Gatsby"* plus Build Output API — **TanStack Start
och React Router är INTE med i den listan.** Det betyder inte att
invalidering är omöjlig (Cache-Control + manuell purge fungerar), bara att
den saknar Vercels hanterade fördelar (300 ms global purge, durabel
lagring 31 dagar, request-collapsing) som Next.js och Astro får gratis.

**React Router (ramverksläge):** samma brist som TanStack Start — inte i
Vercels ISR-tabell. `@vercel/react-router`-presetet ger SSR via Vercel
Functions, men cache-invalidering blir samma hand-byggda
`Cache-Control`-väg. **Vad jag inte kunde belägga:** om ett framtida
`@vercel/react-router`-tillägg kommer lägga till ISR-stöd — inget i
dokumentationen antyder en tidslinje.

**Vite-SPA-noll-alternativet:** grövst möjliga granularitet — hela sajten
är en statisk build; "invalidering" betyder ett nytt Vercel-deploy (t.ex.
via en Deploy Hook som EF anropar). Fungerar, men ger ingen sida-för-sida-
finess alls, och tvingar en fullständig ombyggnad för varje enskild
eventändring — ett dåligt svar mot krav 8 (CI-/byggkostnad per ändring).

---

## F. i18n per kandidat — grund nu, engelska senare

Datamodell-axeln (vilka fält, hur de namnges, Airtable/Postgres-formen) är
redan fullständigt besvarad av `publicerings-kontrakt`-passet (§ 4.4 där) —
återanvänds rakt av, görs inte om. Denna sektion gäller enbart
RAMVERKS-/ROUTING-lagret: hur URL:en bär språket och hur `hreflang`
genereras.

| Kandidat | Inbyggd routing? | Bibliotek som ändå krävs/rekommenderas | Grund nu vs sen |
|---|---|---|---|
| Next.js (App Router) | **Nej** — `next/link`s `locale`-prop är explicit avvisad i App Router (mätt i Next.js källkod), ADR-krav om App Router-specifik i18n pekar mot middleware + route groups | `next-intl` (npm `4.14.5`, mätt 2026-09-19) — väletablerat, stort community-fotavtryck | Grund NU: `/sv/`-route-grupp läggs in från start (tom, singulärt språk), `alternates.languages` i `generateMetadata` för hreflang är billigt att skriva redan i v1 |
| Astro | **Ja** — `i18n.locales`, `i18n.routing.prefixDefaultLocale`, `i18n.fallback`, `astro:i18n`-hjälpfunktioner, allt dokumenterat kärnfunktion | Inget nödvändigt för ren routing; ett meddelande-bibliotek (t.ex. Paraglide, `@inlang/paraglide-js` `2.25.4`) behövs ändå för sträng-hantering om innehållsmängden växer | Grund NU är BILLIGAST här — noll extra beroende för själva route-strukturen |
| TanStack Start | Nej, ej hittat i detta pass | Bibliotek krävs (t.ex. Paraglide, som är ramverksoberoende och fungerar via Vite-plugin) | Samma arbete som Next, fast utan `next-intl`s Next-specifika integrationer |
| React Router | Nej, ej hittat i detta pass | Bibliotek krävs | Samma |

**Dom:** Astro är objektivt starkast på just denna enskilda rad. Next.js
kräver ett extra, väletablerat bibliotek (`next-intl`) — en verklig men
liten kostnad, inte en blockerare.

---

## G. Risker

**Ramverkets förändringstakt:**

- **Next.js:** 16.3.5 idag (npm, 2026-09-19); Next 16 släpptes 2025-10-21
  (`nextjs.org/blog/next-16`) och introducerade Cache Components/`"use
  cache"` som ett NYTT programmeringsmönster ovanpå det gamla — appens
  App Router-kod bygger dessutom uttryckligen på en **React Canary-kanal**
  (samma blogginlägg: *"The App Router in Next.js 16 uses the latest React
  Canary release"*), inte bara stabil React. Det är en snabbrörlig, Vercel-
  styrd release-takt.
- **Astro:** 7.3.3 idag; Astro 7.0 släpptes 2026-06-22 (Astro-bloggen).
  Färre brytande arkitekturomtag historiskt (samma ö-modell sedan Astro 1),
  men se Cloudflare-fyndet nedan.
- **TanStack Start:** 1.168.56 (i lockstep med `@tanstack/react-router`
  1.170.35). Ramverket självt beskriver sin status som **"Release
  Candidate… feature-complete and its API is considered stable"** (egen
  dokumentation, `tanstack.com/start/latest/docs/framework/react/overview`,
  hämtad 2026-09-19) — INTE 1.0/GA. Detta är mognare än jag väntade mig
  innan jag mätte, men fortfarande inte en fullbordad, garanterat stabil
  release.
- **React Router:** v8.4.0 (senaste, 2026-09-15). v8 släpptes 2026-06-17
  och beskrivs branschmässigt som en **"deliberately boring release"**
  (InfoQ, `infoq.com/news/2026/08/react-route-v8`) — ESM-only, middleware
  som förvalt beteende, ÅRLIG major-cykel utlovad. v7 hålls kvar parallellt
  (`version-7`-dist-tag, `7.18.4`) för dem som inte migrerat. Detta är den
  LUGNASTE förändringstakten av de fyra, enligt egen källa.

**Inlåsning — det viktigaste enskilda fyndet i hela passet:**

**Cloudflare förvärvade The Astro Technology Company 2026-01-16**
(officiellt pressmeddelande, `cloudflare.com/press/press-releases/2026/
cloudflare-acquires-astro-…`, hämtat 2026-09-19; bekräftat av minst sex
oberoende nyhetskällor samma dag). Cloudflares egen VD citeras: *"we're
going to ensure Astro continues to be the best web framework for
content-driven websites."* Pressmeddelandet lovar uttryckligen
plattforms-neutralitet ("whether they host on Cloudflare or elsewhere") och
namnger en fortsatt "Astro Ecosystem Fund" med partners **Netlify, Webflow,
Wix och Sentry** — **Vercel nämns INTE** som namngiven fondpartner. Det är
inte bevis på att `@astrojs/vercel` (aktivt versionerad, `11.0.10` idag)
försummas — men det är en ny, verifierbar styrningsrisk för ett ramverk vi
skulle basera en flerårig, Vercel-låst satsning på. Next.js har motsatt
egenskap: det ÄGS av Vercel, noll motsvarande risk mot vårt hostingkrav.

- **Next.js↔Vercel-inlåsning, omvänt håll:** Next.js KAN köras utanför
  Vercel (Eventbrite kör det på CloudFront/AWS, mätt ovan) men vissa
  funktioner (ISR:s fulla fördelar, Image Optimization, delar av Cache
  Components) är som mest polerade på Vercel. Detta är en känd, symmetrisk
  avvägning — vi VILL redan vara på Vercel (krav 6), så denna "inlåsning"
  är i praktiken en fördel, inte en risk, för just detta uppdrag.

**Deno-EF + Node-ramverk i samma repo:** redan löst idag — admin-appen har
KÖRT Deno (Supabase Edge Functions, `supabase/functions/`) sida vid sida med
Node/npm-verktygskedjan sedan Fas 4 (`task-103-deno-verktygskedjan-i-node-
repo-2026-07-31.md`, ej omläst i detta pass men känt existerande). En ny
sajt-app ändrar INGET i den gränsytan — den anropar EF-lagret som klient,
precis som admin-appen redan gör.

**Biome-stöd för filtyper:** `.astro`/`.vue`/`.svelte`-stöd i Biome är
**experimentellt sedan v2.3.0** (Biomes egen dokumentation,
`biomejs.dev/internals/language-support`, hämtat 2026-09-19: *"support must
be considered experimental"*, kräver explicit konfiguration). Repots
Biome-version (`2.5.11`) har detta, men det är fortfarande märkt
experimentellt av Biome själva — en verklig, om än liten, risk endast för
Astro-kandidaten (Next/React Router/TanStack Start är ren `.tsx`, redan
100 % täckt av Biomes STABILA TypeScript-stöd).

**TypeScript 7 — en färsk, delad risk för ALLA kandidater:** TypeScript 7.0
(den Go-baserade "native"-kompilatorn) nådde GA **2026-07-08**
(`devblogs.microsoft.com/typescript/announcing-typescript-7-0/`, bekräftat
av InfoQ samma dag) — **mindre än tre månader gammal**. Dess programmatiska
API är enligt samma källor **INTE stabilt förrän version 7.1**. Repot
kör redan `typescript@^7.0.2` och har verifierat `tsc -b` fungerar för egna
project references (`CLAUDE.md`), men VERKTYG som lutar sig mot TypeScripts
programmatiska API (språkservrar, typegenererings-plugins) kan vara
skörare. Mätt, konkret gott tecken: `@react-router/dev`s egen
`peerDependencies` accepterar explicit `"typescript": "^5.1.0 || ^6.0.0 ||
^7.0.0"` — React Router-teamet har alltså redan testat mot TS7. Jag
**kunde inte verifiera** motsvarande explicit TS7-stöd i Next.js,
Astro eller TanStack Starts egna `peerDependencies` i detta pass (Next.js
deklarerar ingen `typescript`-peer alls; Astro/TanStack Start likaså) — det
är inte bevis på inkompatibilitet, bara en obelagd lucka.

**Testbarhet mot repots Playwright-/axe-uppsättning:** samtliga fyra
kandidater renderar till vanlig HTML/DOM och är därmed körbara mot
`@axe-core/playwright` och repots befintliga Playwright-projekt-mönster
utan ramverksspecifik anpassning — INGEN av dem introducerar en
fundamentalt annorlunda testyta än dagens Vite-SPA. Detta är alltså INTE en
differentierande rad; jag markerar den som sådan snarare än att fylla på
med spekulation.

---

## H. Rekommendation

> Rekommendation, inte beslut. Marcus/en kommande ADR avgör.

**Stack: Next.js (App Router), hostat som ett EGET Vercel-projekt i samma
repo.**

**Varför inte de andra, kort:**

- **Astro** — starkast på pappret (i18n, CSP, content collections,
  JS-diet), men (a) precedent för vår exakta produktklass (event + bokning)
  är TUNN — inte en enda namngiven produktionssajt hittad, och (b)
  Cloudflare-ägandet (§ G) introducerar en ny, overifierbar styrningsrisk
  mot ett hostingkrav vi inte kontrollerar. Om detta ADR-beslut om tre år
  visar sig fel, är det troligast HÄR — se § I.
- **TanStack Start** — tekniskt lovande (RC, "feature-complete" enligt egen
  källa, samma familj som appens befintliga router), men: ingen
  produktionsprecedent hittad, INGEN Vercel-ISR-integration dokumenterad
  (§ E), och ingen "Official Partner"-status hos Vercel motsvarande
  Cloudflare/Netlify/Railway (mätt i egen hosting-dokumentation). För tidigt
  för ett flerårigt åtagande på just detta hostingkrav.
- **React Router (ramverksläge)** — mognast av de "yngre" alternativen
  (lugnast release-takt, egen "boring release"-linje), men delar samma
  ISR-lucka som TanStack Start på Vercel, och precedenten (Shopify Hydrogen)
  är Remix, inte bokstavligen `react-router`s ramverksläge under dagens
  namn.
- **Vite-SPA + förrendering** — enda kandidaten utan NÅGOT inbyggt SSR/SSG,
  ingen tag- eller path-baserad cache-invalidering (bara hela-sajten-
  ombyggnad), inget ramverksstöd för Metadata/sitemap/OG. Löser krav 3, 7
  och 13 sämst av alla fem — avvisas trots att den är den enda kandidaten
  utan NÅGON ny beroende-yta.

**Golv kontra spekulativ komplexitet:**

- GOLV: App Router med statisk/ISR-rendering som NORM för innehålls- och
  eventsidor (inte full dynamisk SSR som standard) — en uttrycklig
  arkitekturregel, motiverad direkt av Lumas eget uppmätta 27/100-
  mobilbetyg (§ Kort svar). `next-intl` för i18n-grunden. `revalidateTag`
  anropad från en ny, tunn Supabase Edge Function-webhook.
- SPEKULATIVT (skärs bort tills bevisat behov): Turborepo/pnpm/Nx (§ C),
  en tung headless-CMS-integration för innehåll (grillningens beslut 9
  säger redan "filer i repot… CMS eventuellt senare"), och en förbyggd
  content-collections-motsvarighet innan Marcus faktiskt bloggar
  regelbundet.

**Repo-form:** npm workspaces, med migrationsvägen i § C (tokens flyttas
FÖRST, komponenter extraheras vid faktiskt behov, admin-appens övriga
`src/` rörs inte).

**Cookiefri statistik (krav 12), separat delbeslut:** **Plausible**
rekommenderas framför Vercel Web Analytics och Fathom — EU-hostat
(Tyskland, mätt via sökresultat), öppen källkod och självhostbart (minskar
ytterligare inlåsning ovanpå Vercel+ramverksvalet), och billigare än Fathom
(~9 USD/mån mot ~15 USD/mån för vår sannolika volym). Vercel Web Analytics
är enklast (nollkonfiguration, redan i Pro-planen) men saknar dokumenterad
EU-datahosting — acceptabelt om Marcus prioriterar enkelhet över den
extra oberoende-marginalen.

### Minimalt test (repots regel: 1 komponent, 1 hook — konkret)

Bygg en KASTBAR prototyp-app (`prototype`-skillens LOGIC/UI-throwaway-
kontrakt) i en egen worktree, `apps/site-prototyp/`, som en riktig
Next.js App Router-app:

1. **Delad komponent, oförändrad:** importera EN existerande primitiv ur
   `src/components/primitives/` (t.ex. knapp-primitiven) plus de tre
   CSS-token-filerna via den nya `packages/tokens/`-workspace-sökvägen —
   UTAN att kopiera eller ändra koden. Detta bevisar eller motbevisar krav 1
   ("delar … utan ändringar") empiriskt i stället för teoretiskt.
2. **En eventsida** (`/event/[slug]`), statiskt/ISR-renderad, med ett
   server-genererat `schema.org Event`-JSON-LD-block (samma form som
   Luma mätt i § B).
3. **En stub-Supabase-Edge-Function** som POST:ar till
   `/api/revalidate?tag=event-test&secret=X` — mät (klocka, inte antagande)
   hur lång tid det tar från anrop till att sidans HTML faktiskt ändras.
4. **CSP-provet, den mest riskabla premissen:** rendera sidan bakom en
   RIKTIG `Content-Security-Policy`-header (samma metod som `t95-r1`: äkta
   Chromium, äkta header, ingen `<meta>`-tagg) med `script-src 'self'`
   (ingen nonce, inget `unsafe-inline`) och mät om App Router-hydreringen
   (RSC-flödesdatan) går sönder. **Detta är GAPET i § A/rad 10 — om testet
   visar att det INTE går att köra `'self'`-only utan nonce, är det ett
   konkret skäl att antingen (a) hålla klient-komponentytan så minimal att
   nonce+dynamisk-rendering bara krävs på enstaka sidor, eller (b) öppna om
   frågan mot Astro trots dess svagare precedent — en uttrycklig,
   förberedd reträttväg, inte ett stängt beslut.**

---

## I. Beslutets permanens

**Svårt att återställa:**

- Repo-formens FÖRSTA steg (`packages/tokens/`) är billigt att ångra
  (tre filer, en `git mv` + import-omskrivning). **Men** en gång sajten
  har lanserats och crawlats av Google/sociala plattformar blir
  URL-strukturen (särskilt `/sv/`-prefixet eller avsaknaden av det, och
  eventsidornas path-mönster) DYR att ändra — 301-omdirigeringar
  (krav 13, redan planerade för Shopify-migreringen) är rätt verktyg, men
  varje omstrukturering efter lansering kostar SEO-momentum.
- Ramverksvalet (Next.js) är MEDELDYRT att ångra: appkoden (routing,
  Metadata-anrop, `revalidateTag`-anrop) är ramverksspecifik och skulle
  behöva skrivas om vid ett byte, men INNEHÅLLET (Markdown/MDX-filer,
  Airtable-data, EF-kontraktet) är helt ramverksoberoende och överlever ett
  byte orört.
- Cloudflare/Astro-risken (§ G) är den enda posten i detta pass som kan
  förändras UTAN att vi gör något — om `@astrojs/vercel` försummas eller
  Cloudflare aktivt styr bort från Vercel-stöd, är det en extern händelse
  vi bara kan bevaka, inte kontrollera. Det är ett skäl att INTE välja
  Astro nu, inte ett skäl att aldrig ompröva det.

**Billigt att byta:**

- Analytics-leverantören (Plausible/Vercel/Fathom) — ett skript-byte,
  ingen datamodell-koppling.
- Turborepo-adoptionen (§ C steg 4) — additiv, kan läggas till eller tas
  bort utan att röra applikationskoden.
- Kart-leverantören (redan flaggad som en egen, separat prototyp-fråga i
  grillningens beslut 10).

---

## J. Vad som INTE besvarades

- **Om Vercels Pro-kvot delas eller dupliceras för ett andra projekt**
  (§ D) — jag hittade ingen explicit gräns i dokumentationen, men
  verifierade inte det positivt heller.
- **Exakt CI-minutkostnad för sajtens EGNA pipeline** (krav 8) — sajten
  finns inte än. Jag ger en HÄRLEDD uppskattning nedan, inte en mätning:
  baserat på S126:s egna tal (docs-landning ≈ 13 fakt. min bunt-optimerad,
  kod-landning ≈ 94 fakt. min efter S1–S3-optimeringarna), och att en ny,
  medvetet SLIMMAD sajt-pipeline (typecheck+lint+bygge+en liten a11y-svit,
  INGEN Acceptance-klass, INGEN Webblasarbeteende-klass) rimligen hamnar i
  samma storleksordning eller lägre — **grovt uppskattat 30–60 fakt.
  min/landning**, men detta är en hypotes tills sajten faktiskt byggs och
  mäts mot `npm run metrics:ci`.
- **Lighthouse-budgettröskeln** för krav 9 — jag rekommenderar att MÄTA en
  baslinje först (samma "mät, sätt inte tak i förväg"-disciplin som
  `flake-matserie`/`verify-ci-parity` redan följer i repot), inte att gissa
  ett tal här.
- **Huruvida `@astrojs/vercel` faktiskt kommer försummas** efter
  Cloudflare-förvärvet — ren spekulation om framtiden, redovisad som risk,
  inte som prognos.
- **RSC-flödesdatans hash-stabilitet** för statiska Next.js-sidor (§ Krav
  10-gapet) — jag hittade ingen officiell Next.js-dokumentation om en
  hash-baserad väg alls, bara nonce. Det minimala testet i § H punkt 4
  finns specifikt för att stänga denna lucka innan Fas 7-arbetet börjar.
- **Astros egna React-island-hydreringsscripts prestandaprofil** jämfört
  med Next.js RSC-hydrering, mätt sida vid sida — jag har bara Lumas
  (Next.js) uppmätta 27/100-mobilvärde, inget motsvarande mätt Astro-tal
  i vår produktklass eftersom ingen sådan produktionssajt hittades (§ B).
- **Om en andra Vercel-projekt-koppling kräver en andra `vercel.json`**
  eller om root-directory-uppdelningen räcker ensam — dokumentationen
  antyder det senare men jag testade det inte skarpt.

---

## Oväntade fynd utanför frågan

- **Cloudflare äger Astro sedan 2026-01-16** (§ G) — registrerat här,
  inte tyst förkastat, eftersom det påverkar varje framtida Astro-
  relaterat beslut i detta repo, inte bara detta.
- **TypeScript 7.0 (native Go-kompilator) är GA sedan 2026-07-08**, mindre
  än tre månader gammal, med instabilt programmatiskt API till 7.1 — repot
  kör redan denna version. Värt att hålla ett öga på för ALLA framtida
  tooling-tillägg (linters, typegenererings-plugins), inte bara denna
  fråga.
- **`react-router` bytte till v8 2026-06-17** medan `v7`-linjen underhålls
  parallellt (`version-7`-dist-tag) — ett dubbelspårs-utgivningsmönster
  värt att känna till om repot någonsin refererar React Router-dokumentation
  utan att specificera version.
- **Vercels egen ISR-stödtabell namnger fem ramverk explicit** (Next.js,
  SvelteKit, Nuxt, Astro, Gatsby) — SvelteKit och Nuxt låg helt utanför
  uppdragets kandidatlista men dyker upp som en påminnelse om att
  "React-baserad" (krav 2) medvetet utesluter två ramverk som annars
  skulle fått förstklassig Vercel-ISR-behandling.

---

## Källförteckning

**Förstaparts-dokumentation (hämtad/mätt 2026-09-19 om inte annat anges):**

- Next.js — `revalidateTag`/`updateTag`/caching-guider, App Router CSP-guide
  (nonce+Proxy), Metadata API (`sitemap.ts`/`robots.ts`/`opengraph-image.tsx`/
  `alternates.canonical`/`languages`), i18n App Router-begränsning: context7
  `/vercel/next.js` (canary-dokumentation)
- Next.js 16 — <https://nextjs.org/blog/next-16> (publicerad 2025-10-21,
  hämtad 2026-09-19)
- Astro — i18n-routing, on-demand-rendering/server islands, `security.csp`
  (hash-baserat, sedan v6.0.0), sitemap-integration: context7
  `/withastro/docs`
- Astro-bloggen — <https://astro.build/blog/> (versionshistorik 6.4/7.0)
- Astro showcase — <https://astro.build/showcase/> (namngivna produktions-
  sajter)
- TanStack Start — översikt/stabilitetsstatus:
  <https://tanstack.com/start/latest/docs/framework/react/overview>;
  hosting: `.../guide/hosting`; ISR: `.../guide/isr`; SEO: `.../guide/seo`
- React Router — deploying/framework mode/prerender: context7
  `/remix-run/react-router`; deploying-sida:
  <https://reactrouter.com/start/framework/deploying>
- React Router v8 — <https://remix.run/blog/react-router-v8>; InfoQ,
  <https://www.infoq.com/news/2026/08/react-route-v8/> (2026-08)
- Vercel — Using Monorepos: <https://vercel.com/docs/monorepos>; ISR:
  <https://vercel.com/docs/incremental-static-regeneration>
  (`last_updated: 2026-08-28`); Astro on Vercel:
  <https://vercel.com/docs/frameworks/frontend/astro>
  (`last_updated: 2026-08-26`); React Router on Vercel:
  <https://vercel.com/docs/frameworks/frontend/react-router>
- Biome — språkstöd: <https://biomejs.dev/internals/language-support/>
- TypeScript 7.0 —
  [devblogs.microsoft.com: Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/);
  InfoQ,
  [infoq.com: TypeScript 7 Released](https://www.infoq.com/news/2026/08/typescript-7-released/)
  (release 2026-07-08)
- Cloudflare — pressmeddelande om Astro-förvärvet:
  [cloudflare.com: Cloudflare Acquires Astro](https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/)
  (2026-01-16)
- Hydrogen (Shopify) — <https://hydrogen.shopify.dev/> (Remix-grund citerad
  ordagrant)
- Vercel Fair Use / Limits / Vite-hosting — redan citerat i
  `t95-r1-hosting-vercel-2026-08-02.md`, återanvänt utan omhämtning

**Mätningar utförda i detta pass (`curl`, `npm view`, `npm view … dist-tags`
m.fl., 2026-09-19):** `luma.com` + en eventsida (`luma.com/gv331avt`) och
`luma.com/discover`, `vercel.com`, `notion.com`, `eventbrite.com`,
`tanstack.com`, `astro.build`, `docs.astro.build`, `netlify.com`,
`ikea.com`, `hydrogen.shopify.dev`, `cal.com` (Framer, inte Next.js — mätt,
inte antaget), samt npm-registrets versions-/peer-dependency-/engine-data
för `next`, `astro`, `@tanstack/react-start`, `@tanstack/start`,
`react-router`, `@react-router/dev`, `vite`, `@astrojs/vercel`,
`@astrojs/react`, `next-intl`, `@inlang/paraglide-js`, `typescript`.

**Interna (detta repo):**
`tasks/sessions/2026-09-19-session-128.md` Del 1–3,
`tasks/sessions/2026-09-17-session-126.md` Del 17–18 (`origin/main`),
`docs/research/publik-anmalningsvag-utan-inloggning-2026-09-19.md`,
`docs/research/publicerings-kontrakt-event-synlighet-bokningsbarhet-2026-09-19.md`,
`docs/research/event-nara-dig-och-karta-2026-09-19.md`,
`docs/research/luma-visuell-matning-och-nara-dig-2026-09-19.md`,
`docs/research/repo-privat-konsekvenser-2026-09-18.md`,
`docs/research/t95-r1-hosting-vercel-2026-08-02.md`,
`.github/workflows/ci.yml`, `package.json`, `tsconfig*.json`, `biome.json`,
`vercel.json`, `vite.config.ts`.
