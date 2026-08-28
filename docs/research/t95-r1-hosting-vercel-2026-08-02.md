---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: draft
---

# Är Vercel rätt hosting-val 2026, och hur löser CSP-nonce-mönstret där? (Code, 2026-08-02)

> **Proveniens:** Research-pass R1 för tråd T95 (Session 95). Riktningsbeslutet
> Vercel är REDAN Marcus-kvitterat i grillning 2026-08-02
> (`tasks/sessions/archive/2026-08/2026-08-02-session-95.md` Del 2, beslut 2: *"Vercel — ADR
> mintas EFTER research-pass (2026-läge, CSP-nonce-mönstret); tre specs antog
> redan Vercel, inget ADR låste"*). Detta pass är ADR-underlag som verifierar/
> falsifierar 2026-läget FÖRE mintning — inte ett omval.
>
> **Mätningarna** kördes mot en riktig Chromium-instans, `Chrome/150.0.7871.184`
> (headless, chrome-devtools MCP, 2026-08-02) — tre minimala HTTP-servrar
> (Python 3.14.5, `python3 -m http.server`-variant) med äkta CSP-headers, inga
> `<meta>`-taggar. Källkod och testservrar kastade efter mätning; inget av
> testet rör arbetsträdet. Dokumentations-hämtningarna är mot `vercel.com/docs`
> (sidfooter `last_updated` 2026-02-27 till 2026-07-01, alltså färska),
> `developers.cloudflare.com`, `web.dev`, `developer.mozilla.org` och
> `cheatsheetseries.owasp.org`, hämtade 2026-08-02.

---

## Kort svar

**Vercel som hosting-plattform STÅR** — verifierat mot 2026-dokumentationen,
stött av konkret branschprecedent och utan platt formsspecifika hinder för
denna app. Men **CSP-nonce-mönstret i `SECURITY-SPEC.md` (rad 58–156) är
FALSIFIERAT på tre punkter** och skulle om det byggdes som skrivet antingen
inte fungera alls (nonce-mismatch bryter appen helt) eller aldrig aktiveras
(fel header-mekanism för Vercel). Den korrekta branschmallen 2026 för en
100 %-statisk SPA utan SSR är **inte** nonce-baserad CSP — det är Googles
egen uttryckliga rekommendation, verifierad ordagrant nedan.

Den avgörande delfrågan var #2 (CSP-nonce-mönstret): den ändrar
implementationen oavsett vilken hostingplattform som väljs, eftersom felet
sitter i hur nonce fungerar generellt (build-time vs. per-request), inte i
något Vercel-specifikt.

---

## 1. Vercel 2026 — tier-gränser, SPA-deploy, domän

### 1.1 Hobby-tier: KRÄVS INTE — kommersiell användning är förbjuden på den

Vercels egen "Fair Use Guidelines"-sida säger ordagrant:

> "Hobby teams are restricted to non-commercial personal use only. All
> commercial usage of the platform requires either a Pro or Enterprise plan."
>
> "Commercial usage is defined as any Deployment that is used for the purpose
> of financial gain of **anyone** involved in **any part of the production**
> of the project, **including a paid employee or consultant writing the
> code**."

KÄLLA: <https://vercel.com/docs/limits/fair-use-guidelines> (`last_updated:
2026-06-16`).

Miranon Media (Roger & Lotta) är ett kommersiellt bolag och appen byggs av en
betald aktör. Hobby-planen är alltså kontraktsmässigt uteslutet — **Pro-planen
är golvet**, inte ett val. Det är inte tidigare verifierat på disk: ingen av de
tre antagande specarna nämner tier eller kostnad.

Praktisk konsekvens: Pro kostar $20/utvecklarplats/månad (Viewer-platser
gratis), enligt <https://vercel.com/docs/plans/hobby> § "Upgrading to Pro". Med
två användare (Roger + Lotta) och Marcus som utvecklare blir det sannolikt en
(1) betald plats.

### 1.2 Övriga Pro-gränser — ingen är i närheten av relevant för 2 användare

KÄLLA: <https://vercel.com/docs/limits> (`last_updated: 2026-07-01`).

| Resurs | Hobby | Pro | Relevans för denna app |
|---|---|---|---|
| Fast Data Transfer | 100 GB/mån | 1 TB/mån (usage-based därefter) | Irrelevant — 2 interna användare |
| Edge Requests | 1M/mån | 10M inkluderade | Irrelevant |
| Deployments/dag | 100 | 6000 | Irrelevant |
| Domains per projekt | 50 | Unlimited | Irrelevant — 1 domän behövs |
| Build-tid/deploy | 45 min | 45 min | Vite-bygget tar sekunder, inte minuter |
| Static file uploads | 100 MB | 1 GB | Irrelevant för en SPA-bundle |

**Dom:** kostnads-/gräns-bilden falsifierar INTE Vercel-valet — den lägger
bara till en explicit Pro-kostnad ($20/mån) som tidigare inte stod på disk.

### 1.3 SPA-deploy: `vercel.json`-rewrite krävs — repot saknar den idag

Vercels egen Vite-sida säger ordagrant:

> "If your Vite app is configured to deploy as a Single Page Application
> (SPA), deep linking won't work out of the box. To enable deep linking in SPA
> Vite apps, create a `vercel.json` file at the root of your project."

Med exakt config:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

KÄLLA: <https://vercel.com/docs/frameworks/frontend/vite> § "Using Vite to make
SPAs" (`last_updated: 2026-07-01`).

Detta gäller **exakt** denna app: TanStack Router med klient-side routing, ingen
`vite.config.ts`-`appType`-satsning till `mpa`. BEVIS: `vite.config.ts` (hela
filen läst, ingen `vercel.json` i repo-roten — `ls -a` bekräftar). Utan denna
rewrite ger t.ex. `admin.miranon.dev/event/123` en 404 vid direktnavigering
eller sid-omladdning — appen fungerar bara om man alltid navigerar från `/`.

### 1.4 Custom subdomän: bekräftat enkel, matchar beslutad domänschema

Vercels domän-dokumentation:

> "If you're using a **Subdomain** (e.g. docs.example.com), you will need to
> configure it with a **CNAME** record. Each project has a unique CNAME
> record."

KÄLLA: <https://vercel.com/docs/domains/working-with-domains/add-a-domain>
(`last_updated: 2026-02-27`).

`admin.miranon.dev` (Session 95 Del 2, beslut 3) är en subdomän → en CNAME-post
räcker. Ingen A-post/apex-komplikation. Detta är okomplicerat och stöder
beslutet som taget.

---

## 2. CSP-nonce-mönstret — den avgörande delfrågan

### 2.1 Vad `SECURITY-SPEC.md` faktiskt föreskriver (läst i sin helhet, rad 16–168)

Tre mekanismer, tänkta att samverka:

1. En Vite-plugin (`vite-plugin-csp-nonce.ts`, rad 58–104) vars
   `transformIndexHtml`-hook injicerar `nonce="{slumptal}"` i alla
   `<script>`/`<style>`-taggar och en CSP `<meta>`-tagg.
2. En `public/_headers`-fil (rad 122–127) med en statisk CSP-header för
   produktion.
3. Ett Vercel Edge Middleware (`middleware.ts`, rad 132–156) som genererar ETT
   NYTT slumptal per request och sätter det i CSP-svarshuvudet.

### 2.2 Fel 1 (falsifierat, dokumenterat): `public/_headers` är fel mekanism för Vercel

`_headers`-filkonventionen är Netlifys och Cloudflare Pages egen syntax — inte
Vercels. Vercels fullständiga `vercel.json`-referens (samtliga giltiga
toppnycklar uppräknade: `buildCommand`, `headers`, `redirects`, `rewrites`,
`routes`, `functions`, m.fl.) nämner **`_headers`-filen ingenstans**. Den enda
dokumenterade mekanismen för anpassade svarshuvuden är `headers`-arrayen i
`vercel.json`:

```json
{
  "headers": [
    { "source": "/(.*)", "headers": [{ "key": "X-Content-Type-Options", "value": "nosniff" }] }
  ]
}
```

KÄLLA: <https://vercel.com/docs/project-configuration/vercel-json> §
"headers" (`last_updated: 2026-06-17`). Fulltextsökning i den hämtade
referensen efter `_headers` gav noll träffar.

**Konsekvens om detta byggdes som skrivet:** en `public/_headers`-fil på
Vercel blir en overksam statisk asset — den serveras som en vanlig fil på
`/_headers`, den tolkas inte som header-config. CSP-headern i steg 2 skulle
**aldrig appliceras**. Detta är slutsats ur dokumentationens frånvaro av
stöd, inte en mätning mot en live Vercel-deploy (repot har ingen sådan att
mäta mot ännu) — markerat som LUCKA nedan.

### 2.3 Fel 2 (mätt, empiriskt): nonce-generering på fel tidpunkt — appen skulle gå sönder

`transformIndexHtml` körs i Vite **en gång vid `vite build`**, inte per
request — det är byggverktygets dokumenterade beteende för produktionsbygge
(skiljer sig från dev-servern, som kör hooken per request). Det innebär att
nonce-värdet i steg 1 bakas in i `dist/index.html` en gång per deploy och är
**identiskt för varje besökare** tills nästa bygge.

Middleware i steg 3 genererar ETT NYTT `crypto.randomUUID()`-baserat nonce
**per request**, men sätter det bara i svarshuvudet (`response.headers.set`)
— koden rör aldrig HTML-kroppen. Den statiska filen från steg 1 skickas
oförändrad.

**Resultatet: header-nonce ≠ HTML-nonce på varje enda request** (utom av ren
slump en gång per bygge). Jag mätte vad webbläsaren gör vid en sådan
mismatch (Chrome 150, headless, egen minimal HTTP-server med äkta
CSP-header):

- `<script nonce="X">` mot header `script-src 'nonce-X'` → körs (bekräftat:
  `document.title` ändrades).
- Ändra ENDAST scriptets nonce-attribut till ett annat värde än headerns →
  blockeras, exakt samma fellogik som en attackerad/förfalskad nonce.

Med andra ord: **hela appen skulle visa en blank sida på varje sidladdning**
i produktion, eftersom CSP är fail-closed och ingen skriptexekvering någonsin
matchar. Detta är inte en marginell bugg — det är releaseblockerande om
byggt exakt enligt specen.

### 2.4 Fel 3 (verifierat mot förstapartskälla + mätt): nonce är fel branschmönster här — hash eller `'self'` är rätt

Googles egen strikta CSP-guide säger, ordagrant:

> "Use a nonce-based CSP for HTML pages rendered on the server. For these
> pages, you can create a new random number for every response."
>
> "Use a hash-based CSP for HTML pages served statically, or pages that need
> to be cached. For example, you can use a hash-based CSP for single-page
> web applications built with frameworks such as Angular, React or others,
> **that are statically served without server-side rendering**."

KÄLLA: <https://web.dev/articles/strict-csp>. OWASPs Content Security Policy
Cheat Sheet bekräftar samma linje (nonce kräver "an actual HTML templating
engine", dvs. en server som genererar HTML per request) och hänvisar själv
vidare till web.dev-artikeln för SPA-fallet. KÄLLA:
<https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html>.

Denna app är exakt fallet artikeln beskriver: `index.html` (läst i sin
helhet) innehåller **noll inline `<script>`- och `<style>`-block** — enda
skript-taggen är `<script type="module" src="/src/main.tsx">`, en extern
referens som Vite ersätter med en hash:ad extern fil vid bygge. Tailwind
kompileras till en extern CSS-fil, inte en inline `<style>`.

Jag mätte konsekvensen direkt (Chrome 150, egen server, äkta header, ingen
nonce eller hash alls):

- `script-src 'self'` (inget nonce, ingen hash, inget `strict-dynamic`) →
  det externa modulskriptet **körde** (`document.title` ändrades till
  `EXTERNAL-MODULE-RAN`), samtidigt som ett inline `<script>`-block på samma
  sida **blockerades** av CSP (exakt Chrome-felet citerat nedan).
- **Viktig korollarie, också mätt:** `script-src 'self' 'strict-dynamic'`
  **utan** nonce/hash blockerar ALLT, inklusive samma-origin-skript. Chromes
  exakta fel: *"'strict-dynamic' is present, so host-based allowlisting is
  disabled."* Det betyder att man inte kan bara stryka `nonce-{RANDOM}` ur
  den befintliga policysträngen och behålla `'strict-dynamic'` — båda måste
  bort tillsammans, annars byter man ett trasigt läge mot ett annat.

**Slutsats:** för denna apps faktiska produktionsbygge behövs varken nonce
eller hash för `script-src`/`style-src` (element) — `'self'` räcker, eftersom
det inte finns något inline-innehåll att tillåta. Detta är enklare, billigare
(ingen Edge Middleware, ingen CPU-tid, ingen 50ms-gräns att bry sig om) och
fullt cache-bart på CDN:n — precis den arkitektur `SPA-ARCHITECTURE-DECISION.md`
redan valde av andra skäl (rad 60–73: "CDN cachelar allt", "Ingen server att
underhålla").

### 2.5 Sidofynd inom samma delfråga: inline `style`-attribut är ett separat, orört problem

Jag mätte samma sak för stil-ATTRIBUT (skilt från `<style>`-ELEMENT), eftersom
`style-src` täcker båda men nonce/hash bara verkar på element om inte
`'unsafe-hashes'` läggs till explicit. Chromes exakta fel vid ett `nonce`:at
`style="color:red"`-attribut:

> "Applying inline style violates the following Content Security Policy
> directive 'style-src 'nonce-...''. […] Note that hashes do not apply to
> event handlers, style attributes and javascript: navigations unless the
> 'unsafe-hashes' keyword is present."

Detta bekräftades empiriskt: elementet fick INTE sin röda färg (blockerad),
medan ett `<style>`-block med samma nonce fungerade normalt (blev blått som
avsett).

Repot har **8 filer** som använder Reacts `style={{...}}` (kompileras till
`style="..."` HTML-attribut): `NastaEventCard.tsx`, `AppError.tsx`,
`SlideToConfirm.tsx`, `PersonDetailPrototyp.tsx`, `EventCard.tsx`,
`Belaggning.tsx`, `CheckinPrototyp.tsx`, `Gruppdynamik.tsx` (BEVIS: `grep -rln
"style={{" src/ --include="*.tsx"`). Ingen CSP-variant (nonce, hash eller
`'self'`) tillåter dessa utan antingen `'unsafe-inline'` i `style-src` (som
urholkar hela policyn) eller `'unsafe-hashes'` + en hash per unikt
attributvärde (opraktiskt för dynamiskt beräknade stilar). Detta är **inte**
ett Vercel- eller nonce-specifikt problem — det gäller lika mycket
hash-baserad CSP — men det är ett konkret arbete som måste in i Fas
7-planeringen oavsett vilken CSP-variant som väljs: antingen refaktorera bort
inline-stilarna till CSS-klasser/custom properties, eller acceptera en
explicit `'unsafe-inline'`/`'unsafe-hashes'`-eftergift för just `style-src`.

---

## 3. Cloudflare Pages — jämförelsepunkt

KÄLLOR: <https://developers.cloudflare.com/pages/configuration/serving-pages/>,
<https://developers.cloudflare.com/pages/platform/limits/>, bekräftat via
webbsökning mot flera 2026-källor för bandbreddsdetaljen.

| Egenskap | Cloudflare Pages (Free) | Vercel (Pro, krävs här) |
|---|---|---|
| SPA-fallback | Automatisk om ingen `404.html` finns — matchar allt mot `/` | Kräver explicit `vercel.json`-rewrite |
| Header-mekanism | `_headers`-fil (statisk, samma begränsning som Vercel saknar den för) | `vercel.json` `headers`-array |
| Bandbredd, statiska assets | Uppges obegränsad för statiskt innehåll (icke-Functions-requests) | 1 TB/mån inkluderat, sedan usage-based |
| Custom domains/projekt | 100 (Free) | Unlimited (Pro) |
| Kommersiell användning | Ingen motsvarande spärr hittad i dokumentationen | Kräver Pro (§1.1) |
| Per-request dynamisk HTML/nonce | Kräver Cloudflare Workers/Functions, samma grundproblem som Vercel Edge Middleware | Kräver Edge Middleware |

**Dom för denna delfråga:** Cloudflare Pages skulle fungera lika bra
arkitektoniskt — SPA-fallbacken är till och med enklare (automatisk, ingen
config-fil krävs) — och saknar den kommersiella spärr jag hittade hos Vercel.
Men CSP-mismatchen i §2 är identisk oavsett plattform: problemet är
nonce-vs-static-build, inte Vercel-specifikt. Jag hittade ingen anledning i
denna research att byta bort från Vercel till Cloudflare Pages — det är inte
en del av det redan Marcus-kvitterade beslutet, och specarna (tre dokument)
är redan skrivna mot Vercel. En fullständig Cloudflare-jämförelse (pris,
DX, teamets erfarenhet) var uttryckligen INTE del av denna fråga.

---

## 4. Branschprecedent för Vite-SPA-hosting-valet

Precedent-rymden är **inte tunn** för mönstret "Vite-SPA på en hanterad
statisk/edge-plattform" — men den är tunn specifikt för "Vercel framför
Netlify/Cloudflare Pages"; de tre plattformarna visar sig vara sinsemellan
utbytbara i praktiken hos precedenten nedan, vilket direkt stöder
`SPA-ARCHITECTURE-DECISION.md`:s egen rad 156 ("Fullt oberoende av hosting —
Fungerar på Vercel, Netlify, Cloudflare Pages, S3").

1. **Excalidraw** (128 816 GitHub-stjärnor, verifierat via `gh api
   repos/excalidraw/excalidraw`) — Vite + React, deployad på Vercel med ett
   committat `vercel.json` i repo-roten. KÄLLA:
   <https://github.com/excalidraw/excalidraw/blob/master/vercel.json>.
2. **shadcn-admin** (12 790 stjärnor) — "Admin Dashboard UI built with Shadcn
   and Vite", samma kategori app som denna (admin-dashboard). Deployad på
   Netlify (`netlify.toml` i repot, live på `shadcn-admin.netlify.app`).
   KÄLLA: `gh api repos/satnaing/shadcn-admin`.
3. **Vuestic Admin** (10 955 stjärnor) — Vite-baserad admin-dashboard,
   deployad på Netlify men bakom en **egen subdomän**,
   `admin.vuestic.dev` — samma domänmönster (`admin.*`) som det Marcus
   redan beslutat (`admin.miranon.dev`). KÄLLA: `gh api
   repos/epicmaxco/vuestic-admin`.
4. **Vite-projektets egen officiella dokumentation** listar Vercel, Netlify
   och Cloudflare (Pages/Workers) som likvärdiga, "zero-config"-vänliga
   deploy-mål för `dist/`-outputen, i samma stycke, utan att föredra någon.
   KÄLLA: <https://vite.dev/guide/static-deploy>.

**Deklaration om precedent-rymdens tunnhet:** jag hittade INGEN
industriledande produkt som explicit motiverar Vercel FRAMFÖR Netlify eller
Cloudflare Pages för just en Vite-SPA — de tre exemplen ovan fördelar sig
1 Vercel / 2 Netlify. Precedenten stöder alltså mönstret ("en hanterad
statisk/edge-plattform framför självhostat") starkt, men stöder INTE
specifikt Vercel som bättre än sina två närmaste konkurrenter. Det Marcus
redan beslutat vilar rimligen på andra grunder (redan skrivna specar, TanStack
Router-ekosystemets Vercel-dokumentation, teamets bekantskap) — inte på att
"alla branschledare väljer Vercel".

---

## Dom

- **Vercel som plattform: STÅR.** Ingen strukturell blockerare, korrekt
  SPA-stöd (med en rewrite-fil som saknas idag), enkel subdomän-konfiguration,
  och tre verifierbara precedent-projekt i samma kategori. Den enda nya,
  tidigare overifierade faktan är att **Pro-planen är obligatorisk** (inte
  Hobby) på grund av kommersiell användning — en kostnad ($20/mån) som inte
  stod på disk innan detta pass.
- **CSP-nonce-mönstret i SECURITY-SPEC.md: FALSIFIERAT.** Tre konkreta fel,
  varav ett (nonce-mismatch) skulle göra appen obrukbar om byggt som skrivet,
  och ett (fel header-mekanism) skulle göra att CSP-headern aldrig
  appliceras alls. Den korrekta branschmallen 2026 för en 100 %-statisk SPA
  utan SSR är `script-src 'self'; style-src 'self'` (inget nonce, inget
  `strict-dynamic`, inget hash-behov eftersom appen har noll inline
  script/style-ELEMENT) — inte nonce-baserad CSP via Edge Middleware.

---

## Vad jag inte kunde belägga

- Jag har INTE deployat appen till en riktig Vercel-instans. Slutsatsen att
  `public/_headers` är overksam på Vercel är dragen ur att mekanismen saknas
  i den fullständiga `vercel.json`-referensen — en dokumentations-frånvaro,
  inte en mätning mot en live-deploy. Det finns ingen prod-frontend-deploy i
  repot att mäta mot ännu (bekräftat i bakgrundsbilagan `a4-riktig-webbapp-
  inbjudan.md` LUCKOR-sektion).
- Jag har INTE verifierat om Vercel Edge Middleware faktiskt KAN rewrite:a en
  statisk HTML-kropp per request (vilket skulle kunna rädda nonce-mönstret om
  man byggde om middleware till att göra textsubstitution i stället för bara
  header-sättning). Vercels egen dokumentation visar bara header-manipulation
  i sina exempel; jag hittade inget förstapartsexempel på body-rewrite av
  statiska filer i Edge Middleware. Om det är tekniskt möjligt är det under
  alla omständigheter en betydligt dyrare lösning (varje sidladdning måste gå
  via en Function i stället för ren CDN-cache) än hash- eller `'self'`-vägen,
  och motverkar poängen med statisk hosting.
- Jag har INTE bedömt en fullständig Vercel-vs-Cloudflare-Pages-kostnads- och
  DX-jämförelse (t.ex. byggtider i praktiken, teamets tidigare erfarenhet,
  observability). Det var uttryckligen utanför frågans scope (§3 var en kort
  jämförelsepunkt, inte ett omval).
- Jag har INTE verifierat om `'unsafe-hashes'` skulle vara praktiskt
  genomförbart för de 8 filerna med `style={{...}}` (kräver att varje unikt
  attributvärde är hashbart, vilket bryter ihop för dynamiskt beräknade
  stilvärden). Bedömningen i §2.5 att det är "opraktiskt" är omdöme, inte
  mätning.
- Jag har INTE testat mot någon annan webbläsarmotor än Chromium (Chrome
  150). CSP nonce/hash/`strict-dynamic`-beteendet är CSP Level 3-standard och
  bör vara identiskt i Firefox/Safari, men det är inte mätt i detta pass.

---

## Rekommendation

Rekommendation, inte beslut — Marcus/ADR-mintningen avgör.

1. Låt Vercel-valet stå. Grillnings-kvittensen faller inte på denna research.
2. Innan Fas 7-implementation: skriv om `SECURITY-SPEC.md` §1 (rad 16–168)
   till hash-baserad ELLER `'self'`-baserad CSP för `script-src`/`style-src`
   (element), och ta bort `vite-plugin-csp-nonce.ts`, `public/_headers` och
   `middleware.ts`-mönstret i sin helhet. Ersätt med en `vercel.json`
   `headers`-post (§2.2) plus en `vercel.json` `rewrites`-post för SPA-fallback
   (§1.3) — båda saknas i repot idag och behövs oavsett CSP-val.
3. Ta upp de 8 filerna med `style={{...}}` (§2.5) som en explicit fråga i
   Fas 7-planeringen: refaktorera till CSS-klasser/custom properties, eller
   acceptera en dokumenterad `'unsafe-inline'`-eftergift enbart för
   `style-src` (aldrig för `script-src`).
4. Bokför Pro-plan-kostnaden ($20/mån, §1.1) i den kommande ADR:n som en
   explicit, tidigare overifierad konsekvens av hosting-valet.
5. ADR:n bör citera web.dev-källan (§2.4) som den bärande motiveringen för
   att välja hash/`'self'` i stället för nonce — det är den mest direkta,
   förstapartskälla-belagda branschregeln som finns för exakt denna arkitektur.

---

## Källförteckning

- Vercel — Fair Use Guidelines (kommersiell användning):
  <https://vercel.com/docs/limits/fair-use-guidelines>
- Vercel — Hobby Plan (pris, Pro-uppgradering):
  <https://vercel.com/docs/plans/hobby>
- Vercel — Limits (alla tier-gränser):
  <https://vercel.com/docs/limits>
- Vercel — Vite on Vercel (SPA-rewrite-krav):
  <https://vercel.com/docs/frameworks/frontend/vite>
- Vercel — Adding & Configuring a Custom Domain (CNAME för subdomän):
  <https://vercel.com/docs/domains/working-with-domains/add-a-domain>
- Vercel — Static Configuration with vercel.json (fullständig `headers`-referens):
  <https://vercel.com/docs/project-configuration/vercel-json>
- web.dev — Mitigate cross-site scripting with a strict Content Security
  Policy (nonce vs. hash, SPA-rekommendationen):
  <https://web.dev/articles/strict-csp>
- OWASP — Content Security Policy Cheat Sheet:
  <https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html>
- MDN — CSP `script-src` (nonce, `strict-dynamic`):
  <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src>
- MDN — CSP `style-src` (inline-attribut vs. element):
  <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src>
- Cloudflare Pages — Serving Pages (SPA-fallback):
  <https://developers.cloudflare.com/pages/configuration/serving-pages/>
- Cloudflare Pages — Limits:
  <https://developers.cloudflare.com/pages/platform/limits/>
- GitHub — `excalidraw/excalidraw` (stjärnor + `vercel.json`):
  <https://github.com/excalidraw/excalidraw/blob/master/vercel.json>
- GitHub — `satnaing/shadcn-admin` (Vite-admin-dashboard på Netlify):
  <https://github.com/satnaing/shadcn-admin>
- GitHub — `epicmaxco/vuestic-admin` (Vite-admin-dashboard, `admin.*`-subdomän):
  <https://github.com/epicmaxco/vuestic-admin>
- Vite — Deploying a Static Site (officiell plattformslista):
  <https://vite.dev/guide/static-deploy>
- Repo: `docs/specs/SPA-ARCHITECTURE-DECISION.md` (hela filen läst)
- Repo: `docs/specs/SECURITY-SPEC.md` rad 1–175 (CSP-sektionen i sin helhet)
- Repo: `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` rad 444, 561
- Repo: `vite.config.ts`, `index.html` (hela filerna läst)
- Repo: `tasks/sessions/archive/2026-08/2026-08-02-session-95.md` Del 2 (grillnings-besluten)
- Repo: `tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md`
