---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Shopify — innehållsexport-vägen ur miranon.se, API testas först

> **Proveniens:** avgränsat research-pass, Session 128. Kört OISOLERAT i
> worktreen `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s128-docs`
> (gren `docs/s128-fodelse`), inte huvudkatalogen. Ingen commit, ingen
> git-skrivning, ingen inloggning någonstans, ingen MCP-server installerad
> eller konfigurerad. Frågan: bästa vägen att med admin-åtkomst hämta hela
> nuvarande miranon.se:s innehåll strukturerat ur Shopify, och exakt vad
> Marcus behöver klicka fram.

## Kort svar

**Ingen MCP-server behövs.** Vägen är en kombination av **(a) GraphQL Admin
API via en custom app skapad i Shopifys Dev Dashboard** (för Pages, Blogg/
Artiklar, Meny, Filer, Metaobjects, Policies, URL-omdirigeringar och
Översättningar) **+ (b) samma tokens åtkomst till temats JSON-filer** (via
`theme.files`-frågan i samma API, eller `shopify theme pull` med samma
token) **för det som faktiskt syns på sidan** — mätt i detta pass, INTE en
hypotes längre: varje sidas `body_html` är TOM, och allt synligt innehåll
ligger i temats sektions-JSON. En ren Pages-export hade gett Marcus 18
tomma sidor. `sitemap.xml` (redan hämtad, se § 5) används som facit för
URL-inventeringen, inte som exportkälla. Ingen av Shopifys fyra officiella
MCP-servrar (Storefront, Customer Account, Checkout, Dev) ger admin-
läsåtkomst till en levande butiks Pages/tema/metafields — Dev-servern är en
dokumentations-/schema-assistent, inte en dataanslutning.

**Ett sidofynd väger tyngre än det ser ut:** sajten säljer INTE "ingenting"
längre — sitemapen visar **3 riktiga produkter** till försäljning, och
sajten är **tvåspråkig** (svenska + engelska, `/en/`-prefix, mätt via
identiska sidhandtag i båda sitemaps). Båda punkterna ändrar scope-listan
nedan och bör tillbaka till Marcus innan grillningen (T79/PRD).

## Vad jag redan hade innan jag sökte

**Läst före första sökning:** `docs/research/mcp-verktyg-apify-firecrawl-composio-devtools-higgsfield-2026-09-04.md`
i sin helhet — direkt föregångare till detta pass, samma session-linje
(S118→S128). Den avrådde generellt från att installera nya MCP-servrar utan
registrerat behov och flaggade att `disallowedTools` är en DENYLIST i alla
tre agentfilerna (`bygg-agent.md`, `research-pass.md`, `review-agent.md`) —
en ny server på användarnivå når annars tyst alla tre. Ingen Shopify-MCP
diskuterades där (repo-brett grep gav noll träffar innan detta pass).
`tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`
(hela tråden, kort — en rad) och `tasks/sessions/2026-09-19-session-128.md`
Del 1 (hela, källan för uppdragets bakgrund och Marcus fem besked).
`docs/reference/atkomst-och-nycklar.md` § Register — mönstret för hur
tokens dokumenteras hos oss (macOS-nyckelring, bevis-kommando som INTE
läser ut hemligheten, klass Kontonyckel/Tjänstenyckel) — modellen för
rekommendationen i § 3 nedan.

**Sökning på "shopify" i `docs/decisions/` och `tasks/lessons.md`: inget
ADR eller lärdom styr frågan.** De fyra ADR-träffarna på "Shopify" (ADR-090,
ADR-122, ADR-126, ADR-132) nämner ordet i förbigående (arkitektur-exempel
för "ML-/graf-varianter" respektive presentationsformer) — ingen av dem
avgör hur Shopify-innehåll ska hämtas. Genuint ny mark för den specifika
frågan, med T79 som enda tidigare bäring (framtida VISION om en custom
webbplats, inte dagens export-fråga).

**Ingen ålders-fråga:** ingen tidigare research finns att pröva om åldrad —
detta är det första passet på ämnet.

## 1. Innehålls-ytorna i butiken — var de bor och vad som når dem

Mätt (empiriskt, mot `miranon.se` self, se § "Vad jag mätte direkt") och
källmärkt (shopify.dev, hämtat 2026-09-19).

| Yta | Var den bor | API/verktyg | Läs-scope |
|---|---|---|---|
| **Pages** (statiska sidor) | `Page`-resursen bär bara `title`/`handle`/`seo` — **`body_html` är TOM** (mätt, se nedan). Det faktiska innehållet ligger i temats sektions-JSON, nyckel på sidans template. | GraphQL Admin `pages` **+** `theme.files` (eller CLI, se rad nedan) | `read_content` (ekvivalent med `read_online_store_pages` för samma objekt — se § 2) **+** `read_themes` |
| **Bloggar/artiklar** | `Blog` + `Article` — här ÄR `body_html` fylld (bekräftat: `blogs/podcastmedverkan/….json` gav riktig artikeltext, till skillnad från Pages) | GraphQL Admin `blogs`/`articles` | `read_content` |
| **Navigeringsmenyer** | `Menu`-objektet | GraphQL Admin `menu`/menu-frågorna | `read_online_store_navigation` — *"Accessing the Menu object requires the read_online_store_navigation access scope"* ([Menu-objektet](https://shopify.dev/docs/api/admin-graphql/2026-01/objects/Menu), hämtad 2026-09-19) |
| **Tema-mallar** (`templates/*.json`) + **sektionsinställningar** + **`config/settings_data.json`** | `OnlineStoreTheme` → `files`-connection, full filinnehåll via `body.content` | GraphQL Admin `theme(id).files(filenames:[...])` **ELLER** `shopify theme pull` (samma access-token dög i CLI:t, se § 2) | `read_themes` |
| **Files** (bilder/PDF i original) | `File`-interfacet (`GenericFile`/`MediaImage`/`Video`/`Model3d`) | GraphQL Admin `files`-frågan | `read_files` |
| **Metaobjects/metafields** | `Metaobject` (fristående poster) + `metafields`-connection på varje resurs (Page/Product/Shop m.fl.) | GraphQL Admin `metaobjects`/`metaobjectDefinitions` + `<resurs>.metafields` | `read_metaobjects` (+ `read_metaobject_definitions` för definitionerna) — metafields på en specifik resurs kräver DESSUTOM den resursens egen läs-scope |
| **SEO-fält** (titel/beskrivning per sida) | `seo { title description }`-fältet på `Page`/`Article`/`Product`/`Collection` | Del av respektive resurs-fråga ovan | samma scope som resursen |
| **URL-omdirigeringar** | `UrlRedirect` | GraphQL Admin `urlRedirects` | `read_online_store_navigation` |
| **Policies** | `ShopPolicy` (privacy/terms/refund/shipping) | GraphQL Admin `shop.shopPolicies` | `read_legal_policies` — *"Requires `read_legal_policies` access scope"* ([ShopPolicy-objektet](https://shopify.dev/docs/api/admin-graphql/2026-01/objects/ShopPolicy), hämtad 2026-09-19) |
| **Översättningar** (sidofynd: sajten är SV+EN) | `TranslatableResource`/`Translation` | GraphQL Admin `translatableResource(s)` | `read_translations` |
| **Produkter** (sidofynd: 3 finns) | `Product` | GraphQL Admin `products` | `read_products` |

**Källa för filstrukturen i temat** (vad `templates/`, `sections/`,
`config/`, `locales/`, `layout/`, `assets/` innehåller):
[Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture),
hämtad 2026-09-19 — *"JSON templates act only as a wrapper for sections,
while Liquid templates contain code"*, och `config/settings_data.json`
*"lagrar användarnas konfigurationsvärden"*.

### Vad jag mätte direkt mot miranon.se (offentlig läsning, ingen inloggning)

Shopifys legacy AJAX-JSON-ändelse (`.json` på en resurs-URL) är fortfarande
publikt läsbar utan token för vissa resurstyper — jag använde den ENDAST för
att verifiera hypotesen i uppdraget, inte som exportväg (den täcker inte
teman, menyer, metaobjects, redirects eller policies, och kräver ingen
auktoriserad admin-åtkomst så den är inte lämplig för en fullständig,
strukturerad export).

- `https://miranon.se/pages/kontakt.json` → `"body_html":""`. Testat på
  sex ytterligare sidor (`eventplanering`, `resor-i-medvetandet`, `faq`,
  `roger-och-lotta`, `hypnos`, `anmalan`) — **samtliga sju har
  `body_html` tom och `template_suffix: null`.** Detta är den empiriska
  bekräftelsen av HYPOTES 1 i uppdraget: en ren Pages-export missar allt
  synligt innehåll.
- HTML-källan för `/pages/kontakt` visar native Shopify OS 2.0-sektioner
  (`section-custom-liquid`, `section-map`, `section-slideshow` m.fl.,
  sektions-ID:n av formen `template--25397443887369__custom_liquid_4TkaiA`)
  — **inget** känt tredjeparts-sidbyggarverktyg hittades i den signaturen
  (grep efter PageFly/GemPages/Shogun/Zipify/EComposer/Replo gav noll
  träffar på denna EN sida — inte en uttömmande genomsökning av alla 18
  sidor, se § 8).
- `elfsight-app-<uuid>` + `elfsightcdn.com/platform.js` hittades i BÅDE
  startsidans HTML (5 distinkta widget-UUID:n) och kontakt-sidans HTML —
  mätt bekräftelse av uppdragets bakgrundspåstående: Elfsight-innehållet
  renderas klientsidan från Elfsights eget CDN via ett app-UUID, inte från
  någon Shopify-datakälla. Ingen Shopify-API-väg når det innehållet (se
  § 6).
- `https://miranon.se/meta.json` (butiks-metadata, offentlig) bekräftar
  `myshopify_domain: wirmei-3x.myshopify.com`, `published_products_count:3`,
  `published_collections_count:1`.

## 2. Vägarna jämförda

| Väg | Täckning | Uppsättningskostnad | Säkerhetsyta | Underhåll |
|---|---|---|---|---|
| **(a) GraphQL Admin API, custom app-token** | FULL för Pages/Blogg/Meny/Filer/Metaobjects/Policies/Redirects/Översättningar/Produkter — samma token når ÄVEN temats filer (`theme.files`, se § 1) | Medel: Dev Dashboard-app + client-credentials-utbyte (se § 4) — kräver ett kort skriptsteg, inte bara ett klick | Scopat READ-ONLY, token kortlivad (24 h, se § 4) från en längre-levande Client Secret som lagras separat (§ 3) | Kvartalsvis API-version att följa (§ 6), i övrigt lågt |
| **(b) Shopify CLI (`shopify theme pull` m.fl.)** | ENBART temats filer (`templates/*.json`, `config/settings_data.json`, `sections/`, `locales/`, `layout/`, `assets/`) — täcker INTE Pages/Blogg/Meny/Metaobjects/Policies/Redirects, som lever i admin-databasen, inte i temat | Låg: `npm i -g @shopify/cli` + `shopify theme pull --password <samma admin-token> --store <shop>` | Samma token som (a) om den har `read_themes` — annars kräver CLI:t butiksinloggning i webbläsaren (OAuth) eller en separat Theme Access-lösenord | Lågt, occasional CLI-uppdatering |
| **(c) Officiella Shopify-MCP-servrar** | **Ingen täckning för detta behov.** Fyra officiella servrar finns 2026 (Storefront, Customer Account, Checkout, Dev) — Storefront MCP exponerar *"Connect your AI agent to a specific Shopify store's catalog, shopping cart, and policies"* (produktkatalog/kundvagn/policies för SHOPPARE, inte adminläsning av Pages/tema/metafields); Dev MCP (`@shopify/dev-mcp`, öppen källkod sedan april 2026 under `Shopify/shopify-ai-toolkit`) är en dokumentations-/schema-assistent för APP-UTVECKLARE (`learn_shopify_api`, `introspect_graphql_schema`, `search_docs_chunks` m.fl.) — ingen av dem ansluter till en levande butiks faktiska innehållsdata | N/A — löser inte uppgiften | N/A | N/A |
| **(d) Admin-UI:ts inbyggda exporter** | Native CSV-export finns för Produkter/Kunder/Ordrar — **ingen inbyggd export hittades för Pages eller Blogginlägg** (tredjepartsappar som Mixtable erbjuder det, inte Shopify självt) | Noll uppsättning, men manuellt klipp-och-klistra per sida för innehåll | Ingen (bara mänsklig klickning) | Noll, men inte strukturerat eller skalbart |
| **(e) `sitemap.xml` + rendering** | URL-INVENTERING (för 301-planering, se § 5) + möjlig visuell/text-cross-check av det FÄRDIGT SAMMANSATTA sidresultatet — INTE en strukturerad exportväg (motsvarar Firecrawl/skrapning-alternativet från föregående AXI-resonemang: löser en annan fråga än bulk-strukturerad export) | Noll — redan gjort i detta pass | Ingen (offentlig GET) | Ingen |

**AXI-resonemanget från föregående research** (`docs/research/mcp-verktyg-…md`
§ C: *"Föredra `gh`/`git show` framför ett kvarvarande MCP-verktyg"*)
appliceras rakt av här: (a)+(b) är API/CLI-vägen som en agent kan styra
autonomt och deterministiskt, med låg tokenkostnad per anrop — motsvarande
`gh`/`git`-mönstret. En eventuell skrapningsväg (Firecrawl, redan utvärderad
och EJ installerad enligt föregående pass) vore steget efter, för det API:et
inte når — men enligt mätningen i § 1 når API:et allt utom Elfsight-
innehållet, så skrapning behövs inte alls för detta uppdrag.

## 3. Rekommendation

> Märkt REKOMMENDATION, inte beslut — Marcus äger valet.

**(a) + (b) i kombination, med minsta möjliga läs-scope-uppsättning:**

```text
read_content
read_online_store_navigation
read_themes
read_files
read_metaobjects
read_metaobject_definitions
read_legal_policies
read_translations   ← sidofynd: sajten är SV+EN
read_products        ← sidofynd: 3 riktiga produkter finns
```

Ingen `write_*`-scope behövs — uppdraget är läsning, inte skrivning.

**Token-hantering, i linje med repots befintliga mönster**
(`docs/reference/atkomst-och-nycklar.md` § Register — samma modell som
Supabase CLI:ts PAT i macOS-nyckelringen): det som faktiskt behöver skyddas
långsiktigt är **Client Secret**, inte en enskild access-token — det nya
Dev Dashboard-flödet (§ 4) ger tokens som **går ut efter 24 timmar**
(`expires_in: 86399`, mätt mot [Get API access tokens](https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens),
hämtad 2026-09-19) och byts fram på nytt vid behov via ett
client-credentials-anrop. Lagra Client ID + Client Secret i macOS
nyckelring (samma mekanism som `Supabase CLI`-posten), ALDRIG i repot eller
i en `.env`-fil som committas. Code (agent) utför själva token-utbytet och
API-anropen — Marcus enda uppgift är klicksekvensen i § 4 plus att lämna
över Client ID/Secret via sin egen kanal (chatten), samma modell som
`CLAUDE.md` § Verktygsfakta redan etablerat för prod-refs (kanalen är
öppen för Marcus, låst för agenter — se den globala CLAUDE.md-principen
"Code är default-utförare").

**Varför inte enbart CLI:** CLI:t (väg b) ensamt missar Pages/Blogg/Meny/
Metaobjects/Policies/Redirects/Översättningar helt — de lever i
admin-databasen, inte i temat. **Varför inte enbart GraphQL API:** går
också, men CLI:t är det bekvämare verktyget just för temats filträd
(rekursiv nedladdning, `--only`/`--ignore`-filter) — samma access-token
fungerar i båda, så det finns ingen extra uppsättningskostnad av att
använda båda.

## 4. Marcus steg-för-steg

> Skrivet så att varje klick går att följa utan teknisk bakgrund
> (Gunilla-principen). Verifierat mot shopify.dev 2026-09-19 — flödet
> ÄNDRADES 2026-01-01 (se rutan nedan), så gamla guider/videor som visar
> "Settings → Develop apps → Create an app" med en token som visas direkt
> stämmer INTE längre för en NY app.

<!-- -->

> **Flödet är EN väg, inte två alternativ.** Sedan 1 januari 2026 går det
> INTE längre att skapa en ny "admin-created custom app" med den gamla,
> enkla token-vyn — *"You can no longer create new admin-created custom
> apps"* ([Generate access tokens for admin-created custom apps](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin),
> hämtad 2026-09-19). Det gamla flödet finns bara kvar för APPAR SOM REDAN
> FINNS sedan innan. Eftersom Miranon Media inte har någon existerande
> custom app (overifierat om ni har en sedan tidigare — kolla steg 1)
> används Dev Dashboard-flödet nedan.

1. **Logga in** i Shopify-admin för miranon.se (`wirmei-3x.myshopify.com`,
   den adress som visas i adressfältet när du är inloggad i din butiks
   admin).
2. I vänstermenyn: **Settings** (Inställningar) → **Apps and sales
   channels** (Appar och försäljningskanaler) → **Develop apps**
   (Utveckla appar). Finns redan en app i listan här sedan tidigare —
   STOPPA och fråga Code innan ni skapar en ny (kan krocka).
3. Klicka **"Build apps using Dev Dashboard"** — detta tar dig till en ny
   sida på adressen `dev.shopify.com/dashboard` ([Create apps using the Dev
   Dashboard](https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard),
   hämtad 2026-09-19).
4. På Dev Dashboard-sidan: klicka **Apps** i vänstermenyn, sedan **"Create
   app"** uppe till höger. Välj **"Start from Dev Dashboard"**. Namnge
   appen (förslag: `Miranon innehållsexport — läsbehörighet`) och klicka
   **Create**.
5. Under fliken **Versions**: fyll i **App URL** — eftersom appen inte ska
   visas inuti Shopify-admin, använd standardvärdet
   `https://shopify.dev/apps/default-app-home` (det exakta värde dokumentet
   själv anger för icke-inbäddade appar).
6. Fortfarande på samma flik: kryssa i **läs-scopes** listade i § 3 ovan
   (sök på scope-namnet i sökrutan, t.ex. skriv `read_content` och kryssa
   i träffen — upprepa för alla nio). Kryssa INTE i några `write_*`-scopes.
7. Klicka **Release**.
8. Gå till appens **Home**-flik, scrolla ned, klicka **"Install app"**.
   Välj butiken (miranon.se) om den frågar, bekräfta med **Install**.
9. Gå till appens **Settings**-flik. Där visas **Client ID** och **Client
   secret**. Kopiera BÅDA — secreten visas bara nu, om den försvinner
   måste ni skapa en ny.
10. Klistra in Client ID och Client Secret i chatten till Code (inte i en
    fil, inte i repot) — Code lägger dem i macOS nyckelring och sköter
    resten (token-utbyte, API-anropen, exporten).

**Om steg 2 i stället visar en BEFINTLIG app** (dvs. Miranon Media redan
har en custom app från FÖRE 2026-01-01): det gamla flödet fungerar
fortfarande för den appen specifikt — gå till **Apps → Develop apps →
[appens namn] → API credentials** och token visas där (visas bara EN gång
totalt; går den förlorad krävs avinstallation + ominstallation av appen,
enligt samma källa som ovan). I det läget: lägg till de scopes som saknas
under fliken **Configuration**, spara, och kopiera token från
**API credentials**-fliken. **Detta är overifierat om det gäller er butik**
— Marcus vet om en sådan app redan finns; jag har ingen inloggning att
kontrollera med.

## 5. URL-inventering (sitemap.xml, hämtad 2026-09-19)

`https://miranon.se/sitemap.xml` är en sitemap-INDEX med 9 undersitemaps —
5 unika typer, varav 4 speglas under `/en/`-prefix (den femte,
`sitemap_agentic_discovery.xml`, finns bara på rot-språket).

| Typ | Antal URL:er (SV) | Källa | Mönster |
|---|---|---|---|
| Sidor (`pages`) | **18** | `sitemap_pages_1.xml` | `/pages/{handle}` |
| Produkter (`products`) | **3** produkter + 1 startsideentry i samma fil | `sitemap_products_1.xml` | `/products/{handle}` |
| Kollektioner (`collections`) | **1** (`kommer-snart`) | `sitemap_collections_1.xml` | `/collections/{handle}` |
| Blogg-index + artiklar (`blogs`) | **12** (2 blogg-index: `podcastmedverkan`, `miranon-media-news` + 10 artiklar) | `sitemap_blogs_1.xml` | `/blogs/{blogg-handle}` resp. `/blogs/{blogg-handle}/{artikel-handle}` |
| Agent-upptäckt | **1** (`/agents.md`) | `sitemap_agentic_discovery.xml` | egen, plattforms-genererad 2026-funktion (se § 6) |

**Summa unika SV-innehålls-URL:er att 301-planera: 18 + 3 + 1 + 12 = 34**
(exklusive startsidan och `agents.md`, som inte är innehållssidor att
migrera).

**`/en/`-versionen är BEKRÄFTAT samma underliggande sidor, inte separata
resurser** — jag diffade `sitemap_pages_1.xml` mot `en/sitemap_pages_1.xml`
och handtagen är IDENTISKA (samma 18 `handle`-värden, samma
`id`-intervallparametrar i URL:en). Jag testade INTE samma diff för
produkter/kollektioner/blogg (rimligt antagande att de speglar samma
mönster, men OVERIFIERAT för dem specifikt — se § 8). Praktisk konsekvens:
innehållet finns en gång per resurs, men eventuellt TVÅ SPRÅKVARIANTER av
texten (se `read_translations` i § 1/§ 3).

**Shopifys egna URL-mönster på sajten**, bekräftade direkt (`curl`, HTTP
200 på samtliga testade):

- `/pages/{handle}` — statiska sidor
- `/pages/{handle}.json` — samma sidas metadata i JSON (offentligt läsbart,
  `body_html` tom — se § 1)
- `/blogs/{blogg-handle}` — bloggindex
- `/blogs/{blogg-handle}/{artikel-handle}` — enskild artikel
- `/products/{handle}` — produktsida
- `/collections/{handle}` — kollektionssida
- `/policies/{policy-handle}` — endast `privacy-policy` gav HTTP 200;
  `terms-of-service`/`refund-policy`/`shipping-policy` gav samtliga **404**
  (inte konfigurerade — värt att veta givet att produkter nu säljs, se
  Dom-avsnittet)
- `/en/{samma mönster}` — engelsk språkvariant

## 6. Risker

- **API-versionering.** Shopify släpper en ny API-version **var tredje
  månad**, 5pm UTC första dagen i kvartalet (`2026-01`, `2026-04`, …).
  Varje stabil version supportas **minst 12 månader**, med minst 9 månaders
  överlapp mellan på varandra följande versioner. En deprecation
  annonseras i Shopifys "developer changelog" med migrationsguide innan
  fältet tas bort. Källa: [About Shopify API versioning](https://shopify.dev/docs/api/usage/versioning),
  hämtad 2026-09-19 (sökträff-syntes, ej ordagrant citerad — se § 8).
  **Konsekvens för detta uppdrag:** ett engångs-exportskript pinnat mot
  `2026-01` (eller senaste stabila när det byggs) är tillräckligt robust —
  ingen löpande drift att underhålla om exporten körs EN gång.
- **Rate limits (mätt direkt mot primärkällan).** GraphQL Admin API
  använder kostnadsbaserad "leaky bucket"-throttling.
  [GraphQL Admin API rate limits](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits),
  hämtad 2026-09-19, ger tabellen: **Standard 100 poäng/sek, Advanced
  Shopify 200 poäng/sek, Shopify Plus 1000 poäng/sek, Shopify for
  Enterprise 2000 poäng/sek.** En enskild frågas maxkostnad är **1000
  poäng**, oavsett plan (citat: *"Query cost is 2003, which exceeds the
  single query max cost limit (1000)"*, [GraphQL Admin API-referensen](https://shopify.dev/docs/api/admin-graphql/latest),
  hämtad 2026-09-19). Vilken plan Miranon Media har är **overifierat** av
  mig (kräver inloggning). För 34 sidor + temafiler är detta med bred
  marginal tillräckligt oavsett plan — inget behov av
  **Bulk Operations API** (asynkron JSONL-export som kringgår normal
  throttling, [Bulk Operations](https://shopify.dev/docs/api/usage/bulk-operations/queries),
  hämtad 2026-09-19) för en engångsexport av denna storlek, men värt att
  känna till om exporten någon gång ska köras upprepat/schemalagt.
- **Vad som INTE går att få ut via NÅGOT Shopify-API: Elfsight-
  widgetarnas innehåll.** Mätt (§ 1): widgetarna renderas klientsidan från
  `elfsightcdn.com` via ett app-UUID inbäddat i temat. Shopifys API:er ser
  bara UUID:t (om ens det, beroende på hur embedden är kodad i temat) —
  aldrig kalenderns faktiska events eller formulärens fält/logik. Den
  datan bor hos Elfsight och kräver Elfsights EGEN export/API — helt
  utanför detta uppdrags scope, men en hård gräns att känna till innan
  Marcus tror att "hela innehållet" är hämtat.
- **Bildrättigheter.** Filerna i `Files`-ytan (§ 1) är de filer som
  Miranon Media själva laddat upp till Shopifys CDN — API:et säger ingenting om
  VEM som äger licensen till en bild (stockbild, köpt licens, egen bild).
  **Overifierat av mig** — kräver manuell genomgång av filbiblioteket,
  inget en API-export kan svara på.
- **Nytt 2026-lager, sannolikt ofarligt men värt att känna till:**
  `agents.md` + `/.well-known/ucp` + `/api/ucp/mcp` (Universal Commerce
  Protocol) är en Shopify-PLATTFORMSGENERERAD funktion för AI-shoppingagenter
  — inget Miranon Media konfigurerat själva. Den ger INTE åtkomst till
  Pages/tema/metafields (endast `search_catalog`/`create_cart`/
  `create_checkout`-mönster för produkter), så den påverkar inte
  exportvägen. Nämns här för att den dök upp oväntat i sitemap-indexet och
  är värd att känna till inför en framtida ny sajt (om AI-shoppingagenter
  ska kunna hitta den nya sajten på samma sätt).

## 7. MCP-rekommendation

**Ingen MCP-server rekommenderas.** Ingen av Shopifys fyra officiella
MCP-servrar (Storefront, Customer Account, Checkout, Dev) ger admin-
läsåtkomst till Pages/tema/metafields/policies för en specifik butik — se
§ 2 rad (c). Den enda tredjeparts-kandidat som dök upp i sökningen
(`GeLi2001/shopify-mcp`, community-underhållen, beskriven som "MCP Server
for Shopify API, enabling interaction with store data through GraphQL API")
undersöktes INTE vidare — samma `ADR-106`-princip som föregående MCP-pass
("ingen abstraktion utan faktisk nuvarande användare") gäller här: GraphQL
Admin API direkt via Code, utan ett extra MCP-lager, är enklare, billigare
i tokens (samma AXI-resonemang, § 2) och kräver ingen ny post i någon
agentfils `disallowedTools`. **Ingen ändring behövs i `bygg-agent.md`,
`research-pass.md` eller `review-agent.md`.**

## 8. Vad jag inte kunde belägga

- **Miranon Medias Shopify-plan** (Standard/Advanced/Plus) — avgör den
  faktiska rate limit-budgeten (§ 6). Kräver inloggning jag inte har.
- **Om en custom app redan finns sedan tidigare** i butikens
  `Develop apps`-lista — avgör om Marcus steg 2 (§ 4) möter en tom lista
  eller en befintlig app. Marcus vet detta, jag gör inte.
- **Om produkternas/kollektionernas/bloggarnas `/en/`-sitemaps är
  identiska handtag** som SV-varianterna — jag diffade bara `pages`
  (bekräftat identiska); de andra tre är ett rimligt men OVERIFIERAT
  antagande baserat på samma mönster.
- **Om fler av de 18 sidorna använder ett tredjeparts-sidbyggarverktyg**
  än den ENA jag granskade (`kontakt`) — ingen signatur hittades där, men
  det är inte en uttömmande genomsökning av samtliga 18 sidor.
- **Mekaniken bakom `/en/`-översättningarna exakt** — jag har MÄTT att
  samma Page-ID visas under båda språkprefixen (indikerar Shopifys
  Translation-lager, `read_translations`-scope), men har INTE läst
  Translation-API:ets dokumentation i detalj för att bekräfta att
  ÄVEN anpassade Liquid-sektioners textinnehåll (inte bara standardfält)
  är åtkomligt via samma mekanism.
- **`About Shopify API versioning`-sidans exakta citat** — WebFetch gav en
  sammanfattning (WebSearch-syntes), inte en ordagrann citering av
  primärkällans text på det specifika stycket om release-kadens; siffrorna
  (var tredje månad, 12 månaders support, 9 månaders överlapp) upprepades
  konsekvent över flera sökträffar men jag har inte själv sett den råa
  HTML:en.
- **Exakt bucket-STORLEK (poäng-kapacitet) per plan** — endast
  återfyllnadstakten (poäng/sekund) hittades i primärkällan; startkapaciteten
  är overifierad.
- **Bildlicenser/-rättigheter** i filbiblioteket (§ 6) — kräver manuell
  admin-genomgång.
- **`api/ucp/mcp`-endpointen** (§ 6) undersöktes inte med ett faktiskt
  JSON-RPC-anrop (utanför scope och onödigt att belasta sajten med för
  denna fråga) — dess exakta verktygsyta är därför bara känd genom
  `agents.md`s egen beskrivning, inte oberoende verifierad.

## Dom

**Ingen MCP-server, ingen skrapning — GraphQL Admin API + Shopify CLI via
en custom app skapad i Dev Dashboard, med nio read-only-scopes, är rätt
väg och ger full täckning** utom Elfsight-widgetarnas eget innehåll (aldrig
nåbart via Shopify, oavsett metod). Den avgörande delfrågan var #1: mätningen
att `Page.body_html` är TOM på samtliga sju testade sidor bekräftar
uppdragets HYPOTES 1 konkret — en Pages-only-export hade gett Marcus 18
tomma sidor, och lösningen kräver `read_themes` lika mycket som
`read_content`. Flödet för att skaffa token har bytt fundamentalt sedan
2026-01-01 (Dev Dashboard + client-credentials, 24-timmars tokens från ett
längre-levande Client Secret) — det bekräftar uppdragets HYPOTES 2. Två
sidofynd ändrar scope för den kommande T79/PRD-grillningen: sajten säljer
redan 3 produkter (inte "ingenting"), och är tvåspråkig (SV+EN) — båda
måste in i planeringen för en ny custom-byggd sajt, annars tappas
befintlig funktionalitet vid bytet.

## Rekommendation

> REKOMMENDATION — Marcus beslut, inte ett genomfört val.

1. Följ § 4 steg-för-steg och skapa custom app-token med scopes ur § 3.
2. Lämna Client ID + Client Secret till Code via chatten (aldrig fil/repo).
3. Code bygger ett litet engångs-exportskript (GraphQL Admin API för
   Pages/Blogg/Meny/Metaobjects/Filer/Policies/Redirects/Översättningar/
   Produkter + `theme.files` eller `shopify theme pull` för temat), pinnat
   mot senaste stabila API-version (`2026-01` eller nyare vid byggtillfället).
   Exporten är ETT engångsjobb för detta uppdrag — ingen löpande drift,
   ingen ny CI-yta, inget nytt beroende i repot utöver skriptet självt.
4. Ta med sidofynden (3 produkter, SV+EN, saknade policies) till T79/PRD-
   grillningen innan scope låses.
5. Elfsight-innehållet (kalender + formulär) hämtas INTE via detta spår —
   egen, separat utredning om det behövs (utanför detta uppdrag).

## Källförteckning

**Förstaparts, shopify.dev/help.shopify.com (samtliga hämtade 2026-09-19):**

- [Generate access tokens for admin-created custom apps](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin) — *"You can no longer create new admin-created custom apps"*
- [Create apps using the Dev Dashboard](https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard) — fullständigt steg-för-steg-flöde, `dev.shopify.com/dashboard`
- [Get API access tokens for Dev Dashboard apps](https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens) — client credentials-curl, `expires_in: 86399`
- [Installing and setting up apps](https://help.shopify.com/en/manual/apps/install-setup-apps) — admin-menyvägen till Dev Dashboard
- [About apps — Custom apps](https://help.shopify.com/en/manual/apps/app-types/custom-apps)
- [About access scopes](https://shopify.dev/docs/api/usage/access-scopes) — scope-tabell, `read_content`/`read_online_store_pages`-ekvivalensen
- [Menu-objektet](https://shopify.dev/docs/api/admin-graphql/2026-01/objects/Menu) — scope-krav citerat ordagrant
- [ShopPolicy-objektet](https://shopify.dev/docs/api/admin-graphql/2026-01/objects/ShopPolicy) — scope-krav citerat ordagrant
- [`urlRedirects`-frågan](https://shopify.dev/docs/api/admin-graphql/2026-01/queries/urlRedirects)
- [`theme`-frågan](https://shopify.dev/docs/api/admin-graphql/2026-01/queries/theme) — full filinnehålls-hämtning via `body.content`
- [`files`-frågan](https://shopify.dev/docs/api/admin-graphql/2026-01/queries/files)
- [`metaobjectDefinitions`-frågan](https://shopify.dev/docs/api/admin-graphql/2026-01/queries/metaobjectDefinitions)
- [`articleCreate`-mutationen](https://shopify.dev/docs/api/admin-graphql/2026-01/mutations/articleCreate)
- [`menuCreate`-mutationen](https://shopify.dev/docs/api/admin-graphql/2026-01/mutations/menuCreate)
- [Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture)
- [GraphQL Admin API-referensen (latest)](https://shopify.dev/docs/api/admin-graphql/latest) — enskild frågas maxkostnad (1000 poäng)
- [GraphQL Admin API rate limits per plan](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits) — poäng/sekund-tabellen
- [Bulk Operations (queries)](https://shopify.dev/docs/api/usage/bulk-operations/queries)
- [About Shopify API versioning](https://shopify.dev/docs/api/usage/versioning) — kvartalsrytm, 12 mån support (se § 8, ej ordagrant citerad)
- [Storefront MCP server](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront) — *"Connect your AI agent to a specific Shopify store's catalog, shopping cart, and policies"*
- [`Shopify/shopify-ai-toolkit`, GitHub](https://github.com/Shopify/shopify-ai-toolkit) — Dev MCP-serverns nuvarande källa (flyttad från `Shopify/dev-mcp` april 2026)

**Mätt direkt mot miranon.se (offentlig läsning, ingen inloggning, 2026-09-19):**

- `https://miranon.se/sitemap.xml` + de fem undersitemaparna (`sitemap_pages_1.xml`, `sitemap_products_1.xml`, `sitemap_collections_1.xml`, `sitemap_blogs_1.xml`, `sitemap_agentic_discovery.xml`, samt `/en/`-motsvarigheterna för `pages`)
- `https://miranon.se/agents.md`
- `https://miranon.se/robots.txt`
- `https://miranon.se/meta.json`
- `https://miranon.se/pages/{kontakt,eventplanering,resor-i-medvetandet,faq,roger-och-lotta,hypnos,anmalan}.json`
- `https://miranon.se/pages/kontakt` (rå HTML, sektionssignaturer + Elfsight-embed)
- `https://miranon.se/` (rå HTML, Elfsight-embed-räkning)
- `https://miranon.se/policies/{privacy-policy,terms-of-service,refund-policy,shipping-policy}` (statuskoder)

**Internt:**

- [`docs/research/mcp-verktyg-apify-firecrawl-composio-devtools-higgsfield-2026-09-04.md`](mcp-verktyg-apify-firecrawl-composio-devtools-higgsfield-2026-09-04.md) — direkt föregångare, `disallowedTools`-mönstret, AXI-resonemanget
- [`tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md`](../../tasks/threads/T79-custom-miranon-se-webbplats-app-samverkan-marcus.md)
- `tasks/sessions/2026-09-19-session-128.md` Del 1 — uppdragets bakgrund, Marcus fem besked
- [`docs/reference/atkomst-och-nycklar.md`](../reference/atkomst-och-nycklar.md) § Register — token-hanteringsmönstret

**Tertiärt (sökträffs-synteser, EJ ordagrant citerade, endast som stöd
till primärkällorna ovan):** WebSearch-resultat för "Shopify API versioning
release schedule 2026" och "client credentials grant flow" gav samstämmiga
tal med primärkällorna men konsulterades inte i egen råtext.
