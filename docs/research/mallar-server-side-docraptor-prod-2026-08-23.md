---
owner: marcus803
updated: 2026-08-23
review_by: 2026-11-23
status: draft
---

# Hur bär en prod-duglig Edge Function HTML-mallarna server-side mot DocRaptor? (2026-08-23)

> **Proveniens:** avgränsat research-pass, kört OISOLERAT i huvudkatalogen på
> `miranon-media-admin`, committar aldrig. **Modell:** exakt rad ur egen
> systemprompt — *"You are powered by the model named Sonnet 5. The exact
> model ID is claude-sonnet-5."* Gren `docs/s109-hub-lyft`, SHA `e47a4278`
> vid pass-start, arbetsträdet rent.

## Vad som redan var grundat — läst innan något nytt söktes

Tre pass läste jag i sin helhet innan jag sökte något nytt:

- **`docraptor-minimaltest-2026-08-22.md`** (1 dag gammalt, INTE åldrat):
  bevisar att DocRaptor fungerar från en staging-EF, mäter 2,8–3,6 s/dokument,
  bekräftar Carlito-inbäddning fungerar och att Cavolinis frånvaro faller
  tillbaka till Comic Neue korrekt. Detta pass tar vid EXAKT där det slutade
  (§ Rekommendation punkt 2: "en riktig `generate-*-attachment`-EF per mall").
- **`pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`** (5 dagar gammalt,
  INTE åldrat för sitt syfte): grundar HELA delfråga 5 (branschprecedent) —
  DocRaptor/Shopify/Square/HubSpot/Accenture/Wiley, Gotenberg, och Supabases
  EGNA `@vercel/og`-exempel som edge-native CSS-motor. Jag återanvänder denna
  precedent i stället för att researcha om den; detta pass sökte bara EFTER
  ny precedent specifikt för "bundlade mallfiler + extern HTML→PDF-tjänst"
  (snävare fråga än "HTML→PDF i serverless" som redan var täckt) — se § 5.
- **`utskicks-bilage-arkitektur-2026-08-03.md`** (3 veckor gammalt, delvis
  ÅLDRAT på transportlagret men INTE på Storage-mönstret som är relevant
  här): grundar service-role-läsning av Storage i denna kodbas
  (`create-admin-user/index.ts:93–96`) — samma mönster en Bilagor-läsande EF
  redan skulle använda.

**Ingen ADR eller lesson täcker den faktiska frågan i detta pass** (hur
Edge Function-BUNDLING av statiska mallfiler fungerar). Jag sökte
`docs/decisions/`, `tasks/lessons.md` och hela `docs/research/` för
`static_files`, `DOMParser`, `deno-dom`, `linkedom` — noll träffar. Detta är
genuint ny grund, inte en omskrivning.

**Två korrigeringar av uppdragets premisser**, källmärkta mot faktisk disk
(ADR-086-disciplinen):

1. `src/components/dokument/prototyp/sjalvbarande.ts` **existerar inte**.
   Fyllningslogiken (`renderaDokument`) ligger inline i
   `GenereringsPrototyp.tsx` rad 542–713 — läst i sin helhet, se § 4.
2. `docs/mallar/bilagor/lokala-typsnitt/` är en **git-ignorerad symlänk**
   (`.gitignore` rad 132–139), inte en committad katalog. Den pekar på
   `~/.miranon-fonts/` och innehåller **Cavolini** — en font som **aldrig
   får committas** (licens tillåter inbäddning i dokument, `fsType=0x0008`,
   men inte fildistribution; `docs/mallar/bilagor/README.md` § Fontstrategin).
   **Konsekvens för hela detta pass:** ingen bundlingsväg (static_files,
   Storage, TS-strängmoduler) kan någonsin bära Cavolini — den finns bara
   på Marcus lokala maskin. Server-side rendering kommer ALLTID falla
   tillbaka till Comic Neue Bold för rubrikfonten, exakt det redan mätta
   och AVSIKTLIGA beteendet (minimaltestets negativa typsnittstest). Detta
   är inget att lösa — det är redan löst design, och det förenklar
   bundling-frågan: bara 6 typsnittsfiler (Carlito×4 + ComicNeue-Bold +
   Selawik-Bold, **2,7 MB totalt**, `git ls-files public/fonts/bilagor/`)
   behöver någonsin bäras server-side.

## Kort svar

**Rekommendation: `static_files` i `config.toml` (alternativ a), med en
tunn synk-kopia från `docs/mallar/` till `supabase/functions/_shared/mallar/`
vakad av en CI-parity-grind — inte Storage, inte TS-strängmoduler.**
`static_files` är Supabases EGET, förstklassigt dokumenterat
bundlingskontrakt sedan CLI 2.7.0 (vi kör 2.115.0), löser HTML+CSS+typsnitt
i ETT steg, kostar noll extra nätverkshopp per rendering, och vårt eget
`fas4-prod-deploy.sh`/`deploy-prod-functions.sh` kör redan exakt den
Docker-baserade `supabase functions deploy`-vägen som stödjer den. Den enda
verkliga begränsningen — Supabases egen dokumentation säger uttryckligen att
filvägar måste ligga INOM `functions`-katalogen — gör att `docs/mallar/`
(utanför `supabase/`) inte kan pekas på direkt; en liten synk-kopia med
CI-vakt löser det utan att ge upp "Marcus-granskad förlaga är sanningen".

Server-side ifyllning bör göra sig av med DOM helt: Deno saknar nativt
`DOMParser` (community-konsensus + `deno-dom`s egen källa), och den enda
edge-kompatibla polyfillen (WASM-backend) är en extra beroendetyngd för ett
problem en ren strängmall löser utan den. **Eta** (redan Deno-native,
`autoEscape: true` som standard) ersätter både DOM-manipulationen och
platshållar-regexen med en enda, XSS-säker mall-rendering, laddad via
`https://esm.sh/eta@<version>` — samma importmönster repot redan använder
för `pdf-lib`/`resend`/`zod`.

DocRaptors `test`-flagga är **oberoende av vilken nyckel som används** —
samma produktionsnyckel kan alltså sitta i BÅDE staging- och prod-secrets,
med `test: true` i staging och `test: false` i prod, precis som
`test-docraptor-render/index.ts` redan är skrivet för att göra
(`arPlatshallare`-logiken generaliserar direkt till en `ENVIRONMENT`-flagga).

## Delfråga 1 — Statiska filer i Edge Functions

**`static_files` är en riktig, dokumenterad funktion, inte en hypotes.**
Supabase changelog, verbatim: *"Supabase CLI 2.7.0 introduces capability for
bundling Edge Functions with static files, accessible through Deno's
file-system APIs."*
(<https://supabase.com/changelog/32815-add-static-files-to-edge-functions>)
Exempel ur samma sida, verbatim:

```toml
[functions.buy-book]
static_files = [ "./functions/buy-book/my-book.pdf" ]
```

```ts
Deno.serve(async () => {
  return new Response(await Deno.readFile("./my-book.pdf"), { ... });
});
```

Glob-mönster stöds (`"./functions/email-templates/*.html"`, samma sida).
CLI-referensens (`supabase.com/docs/guides/local-development/cli/config`)
exakta fältbeskrivning: *"Specify an array of static files to be bundled
with the function. Supports glob patterns."* med en uttrycklig begränsning:
**"NOTE: only file paths within `functions` directory are supported at the
moment."** Vår version (`npx supabase --version` → **2.115.0**) är långt
över 2.7.0-kravet.

**Verifierat i CLI:ts EGEN källkod** (`packages/config/src/functions.ts` +
`apps/cli/src/shared/functions/deploy.ts`, hämtat via `gh api
repos/supabase/cli/contents/...`, inte gissat): `static_files` är ett
`Schema.Array(Schema.String)` utan inbyggd path-restriktion i schemat
självt (`functions.ts` rad 54–67); path-uppslaget sker som
`join(input.supabaseDir, pathname)` (`deploy.ts` rad 1984–1986) och globen
expanderas med en egen `globToRegExp` som hanterar `**` som rekursivt
wildcard (rad 822–856) — så en glob som `./functions/_shared/mallar/**/*`
FUNGERAR mekaniskt för att fånga en delad katalog **inom** `supabase/functions/`.
Deployen sker via `docker run ... --static <path>`-flaggor (rad 1429–1431)
när `--use-api` INTE anges. **Vårt eget `scripts/deploy-prod-functions.sh`
rad 192 kör exakt `supabase functions deploy <fn> --project-ref <ref>` UTAN
`--use-api`** — alltså den Docker-baserade vägen `static_files` är byggd
för. **Ny operativ konsekvens, obelagd i repot innan detta pass:** detta
gör **Docker (Docker Desktop, igång)** till ett hårt krav på den maskin som
kör prod-deployen, för VARJE funktion som bär `static_files` — inte bara
för lokal `functions serve`. Ett community-fynd (GitHub-diskussion #32815)
pekar på att `--use-api`-vägen historiskt INTE bundlat static files
korrekt; `deploy.ts`s nuvarande källa (rad 1099–1113) visar att den
NYARE TS-CLI:n faktiskt läser och laddar upp filerna även i API-läget —
men eftersom vårt skript aldrig använder `--use-api` är frågan moot för
oss. **Obelagt i detta pass:** om Docker Desktop faktiskt är installerat/
igång på Marcus deploy-maskin — `docker info` gav inget svar i denna
sandlåda (ingen Docker här), och ingen tidigare deploy-research
(`fas4-ef-deploy-underlag-2026-08-17.md`, `tasks/lessons.md`) nämner Docker
alls, vilket antingen betyder att det redan finns (troligast, då `supabase
start` för lokal utveckling redan kräver det) eller att inga tidigare
deploys stötte på static_files och därför aldrig triggade behovet.

**Storleksbudget.** Bundle-taket är **20 MB via CLI-bundling** (den väg vi
använder), **5 MB via Management API/server-side-bundling**
(<https://supabase.com/docs/guides/troubleshooting/edge-function-bundle-size-issues>,
redan citerad i `pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`, återgiven
här disk-verifierad på nytt). Vår faktiska nyttolast per mall: HTML
(några KB) + CSS (någon KB) + 6 typsnittsfiler à **2,7 MB totalt**
(`du -ch public/fonts/bilagor/*.ttf`, mätt i detta pass) — cirka 14 % av
20 MB-taket, med gott om marginal för `pdf-lib`/`@supabase/supabase-js`-
importerna som redan finns i andra funktioner av jämförbar storlek.

**Delning mellan funktioner: JA, via delad KATALOG, inte delad runtime.**
Eftersom static_files-vägen kopierar/laddar upp bytes VID DEPLOY (inte en
körtids-referens), "delar" tre funktioner en mallkatalog genom att var och
en peka sin egen `static_files`-rad på SAMMA sökväg
(`./functions/_shared/mallar/**/*`) — ingen duplicerad KÄLLA, men var
funktion bär sin egen kopia av bytesen i sitt eget bundle (ingen
runtime-koppling mellan funktionerna). Detta är redan hur `_shared/*.ts`
fungerar för kod i detta repo (`import ... from '../_shared/auth.ts'`,
verifierat i `test-docraptor-render/index.ts` rad 52) — samma
bundlingsprincip, nu tillämpad på binära/text-assets i stället för TS.

### De fyra alternativen, avvägda

| Alt. | Håller mot ADR-083/100 (aldrig kopia som kan glida)? | Extra nätverkshopp/render | Ny mekanik krävd |
|---|---|---|---|
| **(a) `static_files`** | Kräver en tunn synk-kopia `docs/mallar/` → `_shared/mallar/`, vakad av CI-parity-grind (samma klass som `check-listparitet.sh` redan är, se `scripts/`) | Noll | En synk-skript + en grind |
| (b) text-import (`with { type: 'text' }`) | Samma synk-kravet som (a), plus varje `.woff2`/`.ttf` kräver EGEN import-sats (ingen glob) | Noll | Mer boilerplate än (a), ingen fördel |
| (c) Storage, privat bucket | Ingen synk-kopia alls — filerna laddas upp EN gång, `docs/mallar/` förblir enda sanningen fram till uppladdning | +1 round-trip PER FIL PER RENDERING (eller cachead i minnet mellan invokationer, overifierat hur långlivad en Edge Function-instans är) | En uppladdnings-pipeline + cache-strategi + signerad-URL-hantering |
| (d) TS-strängmoduler | Samma synk-kravet som (a) — bara ANNAT MÅLFORMAT (text→TS-sträng) | Noll | En byggstegs-generator PLUS måste ändå falla tillbaka till (a)/(c) för de 6 binära typsnittsfilerna (base64-i-TS-fil är klart sämre än en riktig static-file för binärdata) |

**Rekommendation: (a).** (b) ger ingen fördel över (a) och är mer kod. (c)
lägger till en körtidskostnad (nätverkshopp) och en cache-fråga som inte
finns i (a) — och `ADR-119`s hela poäng (beslut 3) är att rendering sker EN
gång per event, aldrig i en väntande användares kritiska väg, så
Storage-vägens enda fördel (ingen omdeploy vid malländring) väger inte upp
mot ett nytt beroende. (d) löser text men inte binärdata, och adderar ett
onödigt konverteringssteg för de filer som redan är i rätt format. **(a)
är den enda vägen som håller mallarna i sitt NATURLIGA format (riktig
`.html`/`.css`/`.ttf`), återanvänder `npm run mall:granska` och
`docraptor-sjalvbarande.mjs` oförändrade för granskning, och löser
"aldrig kopia som kan glida" med samma sorts CI-grind repot redan har
flera av.**

**Konkret mekanism för synken (ny, föreslagen — inte byggd i detta pass):**
ett skript (`scripts/synka-bilagemallar.mjs`, i stil med
`render-bilage-mall.mjs`) kopierar `docs/mallar/bilagor/{*.html,*.css}` och
`public/fonts/bilagor/*.ttf` **byte-för-byte** till
`supabase/functions/_shared/mallar/`, körs som en committad build-artefakt
(inte gitignorerad — Edge Function-bundling sker från disk vid deploy, inte
från ett CI-genererat temp-steg, så kopian måste finnas i repot). En
CI-grind (`check-mallparitet.sh`, samma mönster som `check-listparitet.sh`)
diffar käll- och målkatalogen och fäller om de divergerar — exakt
"karta, aldrig kopia"-disciplinen, applicerad på binära/HTML-filer i
stället för på prosa.

## Delfråga 2 — DocRaptor i prod

**`test`-semantiken är nyckel-OBEROENDE.** DocRaptors dokumentation,
verbatim (citerat i `docraptor-minimaltest-2026-08-22.md`s premiss-test och
bekräftat brett i DocRaptors dokumentation): *"test documents are free but
watermarked"* — och *"unlimited test documents"* utan koppling till
kontotyp. Vårt eget minimaltest bevisade detta empiriskt: platshållar-
nyckeln (`YOUR_API_KEY_HERE`, som fungerar utan konto alls) gav `test:
true`-beteende identiskt med vad dokumentationen beskriver för ett SKARPT
konto med `test: true` satt manuellt. `test-docraptor-render/index.ts`s
egen kod (rad 108, 121) sätter `test: arPlatshallare` — bytt till en
miljöflagga (`Deno.env.get('ENVIRONMENT') !== 'production'`) generaliserar
mönstret direkt: **samma produktionsnyckel i BÅDA secrets-uppsättningarna**
(staging: `test: true` alltid; prod: `test: false` alltid) är korrekt och
källbelagt, ingen separat testnyckel behövs framöver.

**Synkront är rätt val för våra dokument.** DocRaptors dokumenterade tak:
*"DocRaptor attempts to create documents using synchronous creation by
default. We set a time limit of 60 seconds for synchronous creation."*
(docraptor.com/documentation/api). Våra mätta latenser (2,8–3,6 s/dokument,
minimaltestet) ligger på **~5 % av det synkrona taket** — asynkront
(`async: true`, 600 s-tak, status-URL + valfri callback) är inte motiverat.
Samtidighetstaket är **30 samtidiga requests**
(docraptor.com/documentation/api/limits, verbatim: *"Simultaneous Request
Limit: 30"*) — irrelevant vid ADR-119:s per-event-modell (en generering per
event och dokumenttyp, inte per mottagare).

**Inget dokumenterat `document_content`-tak.** Samma sida, verbatim: *"We
do not impose hard limits on numbers of pages, document complexity, input
size, or output size (except for hosted documents)."* Enda uttryckliga
gränsen: **hostade dokument (DocRaptors egen lagring av resultatet) är
100 MB** — irrelevant för oss, vi hämtar bytesen direkt i samma anrop och
lagrar dem själva i Supabase Storage. Vår faktiska payload (självbärande
HTML med 4 Carlito-typsnitt base64-inbäddade) låg på 51–310 kB i
minimaltestet — flera storleksordningar under varje relevant gräns.

**URL-hämtning från Storage är TEKNISKT MÖJLIGT men INTE rekommenderat.**
`prince_options.baseurl` löser RELATIVA sökvägar i `document_content` mot
en angiven bas-URL; en fristående `<img src="https://...supabase.co/
storage/v1/object/sign/...">` (absolut, signerad URL) skulle också fungera
eftersom Prince hämtar externa resurser under rendering, styrt av
`http_timeout` (1–60 s, default 10 s, docraptor.com/documentation/api).
**Rekommendationen är ändå att BEHÅLLA den redan valda självbärande
data-URI-vägen** (ingen extern hämtning alls) — `docraptor-sjalvbarande.mjs`s
eget filhuvud ger skälet, oförändrat giltigt server-side: *"deterministiskt,
inga CORS-/publik-URL-beroenden, och identiskt oavsett var anropet görs
ifrån."* En signerad URL introducerar en TTL att hantera (URL:en kan hinna
gå ut mellan generering och en eventuell re-rendering) — en komplexitet
självbärande-vägen redan har löst bort.

**`prince_options` att sätta:** `media: 'print'` är redan Princes
DEFAULT (docraptor.com/documentation/api, verbatim: *"media: applies
'print' or 'screen' CSS media rules; defaults to 'print'"*) — ingen
explicit sättning behövs om mallarna inte har egna `@media screen`-regler
(overifierat om de har det; ett `grep '@media' docs/mallar/bilagor/*.css`
är en billig kontroll värd att göra i byggskivan). `javascript: false`
(redan satt i `test-docraptor-render/index.ts` rad 125) är korrekt — våra
mallar kräver ingen JS-körning. `baseurl` behövs INTE i den självbärande
vägen (inga relativa referenser kvar efter inlining).

**Nyckelskydd — DocRaptor säger det själva.** Verbatim
(docraptor.com/documentation): *"This code exposes your API key in your
website source code. This code should not be used in a publicly-accessible
location, instead try using a server-side agent."* Vår arkitektur (nyckeln
lever i Supabase secrets, anropas EXKLUSIVT server-side från en Edge
Function) är redan korrekt — samma mönster `test-docraptor-render` redan
etablerat, ingen ändring behövs.

**Rate limit/retry:** inget dokumenterat requests/sekund-tak utöver
30-samtidiga-taket ovan. **Obelagt i detta pass:** en specifik
retry-/idempotens-rekommendation från DocRaptor själva för nätverksfel —
ingen sida gav en sådan. Rekommendation (egen, inte DocRaptors): återanvänd
mönstret `test-docraptor-render/index.ts` redan har (`AbortController`
plus strukturerat `{fel, status, ms}`-svar) och lägg EN retry med kort
backoff endast på 5xx/timeout — aldrig på 4xx (ogiltig payload retryas
inte till något annat resultat).

## Delfråga 3 — Deno-portabilitet av inlinaren

**`sjalvbarande.ts` existerar inte** (§ ovan) — den relevanta koden är
`GenereringsPrototyp.tsx`s `renderaDokument()` (rad 542–713, webbläsar-DOM)
och `scripts/docraptor-sjalvbarande.mjs` (233 rader — nej, **173 rader**,
disk-verifierat via `cat -n`; uppdragets "233 rader" är en felaktig premiss
för DENNA fil specifikt, men stämmer möjligen på en annan mätpunkt).

**API-inventering, disk-läst:**

- `renderaDokument()` (klient): `fetch()` (relativ mot `/docs/mallar/...`,
  bara möjligt eftersom Vite serverar `docs/` statiskt i dev — finns inte
  alls i prod-server-kontext), `DOMParser`, `document.createElement`,
  `querySelector(All)`, `.textContent`, `.remove()`, `.append()`,
  `window.location.origin`. **Rent webbläsar-API, noll Deno-motsvarighet
  utan en polyfill.**
- `docraptor-sjalvbarande.mjs` (Node, redan körd i minimaltestet): `node:fs`
  (`readFile`/`writeFile`/`existsSync`), `node:path`, regex-baserad
  `<link>`/`<img>`/`url()`-inlining — **inget DOM-beroende alls**, redan
  Deno-närmare än klientkoden. `node:fs`/`node:path` är tillgängliga i
  Supabase Edge Runtime via Denos Node-kompatibilitetslager (samma
  mekanism som gör att `npm:`-paket fungerar) — regex-delen av denna fil
  är i praktiken redan portabel med minimal justering (`node:fs/promises`
  → `Deno.readFile`/`Deno.writeFile` eller behåll `node:fs`-importen rakt
  av, båda fungerar).

**Deno har INGET nativt `DOMParser`.** Bekräftat av en öppen Deno-issue
(`denoland/deno#24995`, "Request: `DOMParser` (again)") och av `deno-dom`s
egen positionering som lösningen. `deno-dom` (`b-fuze/deno-dom`,
<https://github.com/b-fuze/deno-dom>) har två backends: en WASM-backend som
*"works with all Deno restrictions"* och en native-backend som *"requires
the --unstable-ffi --allow-ffi --allow-env --allow-read --allow-net=deno.land
flags"* — flaggor en managed Supabase Edge Function inte kan sätta. **Endast
WASM-backend är teoretiskt användbar i vår runtime**, men den lägger till en
hel WASM-modul i bundlet för ett problem som inte behöver DOM alls (nästa
stycke). `linkedom` undersöktes inte djupare eftersom rekommendationen
under Delfråga 4 gör frågan moot.

**Rekommendation: bygg INGEN DOM server-side.** Både `renderaDokument()`s
och `docraptor-sjalvbarande.mjs`s uppgifter (platshållarersättning,
villkorlig blockborttagning, listgenerering) löses fullständigt av en
mallmotor utan DOM — se Delfråga 4. `deno-dom` registreras som en fungerande
men ONÖDIG väg, inte som huvudrekommendationen.

## Delfråga 4 — Mall-ifyllning server-side

**Klientens nuvarande metod (`GenereringsPrototyp.tsx` rad 590–712,
disk-läst i sin helhet):** ren DOM-manipulation. `rad(id)`/`textEller(id)`
slår upp värden i en `Rad[]`-array; `.textContent = ...` sätter text (detta
ÄR redan XSS-säkert — `textContent` HTML-parsar aldrig sitt argument,
till skillnad från `.innerHTML`); tomma block tas bort med `.remove()`;
listor byggs om med `doc.createElement('li')` + `.append()` per rad,
inklusive en `<span class="meditationsnamn">`-injektion för fetstilta
meditationsnamn (rad 660–664). Kvarvarande `{{platshållare}}` ersätts sist
med en global regex mot `doc.documentElement.outerHTML` (rad 709–712) —
**denna sista regex-ersättningen är INTE escaped** (ren strängsubstitution
i redan seriaiserad HTML) men körs bara på ett fast set nycklar
(`kursnamn`, `datumTid`, etc.) vars värden kommer från eventdata, inte
fri text — samma riskyta en server-side mall ärver rakt av.

**Branschmönster: en logikfri/logik-lätt mallmotor med autoescape, inte
DOM.** Rekommendation: **Eta** (<https://eta.js.org/>), Deno-native sedan
tidigare versioner, verbatim från egen webbplats: *"Eta supports Deno,
out-of-the-box"* (länkad till `deno.land/x/eta`; JSR-paketet
`@eta-dev/eta` är den moderna registreringen, community-bekräftat). Eta:s
`autoEscape`-inställning är **`true` som standard** (community/JSR-
dokumentation) — `<%= värde %>` escapar automatiskt, `<%~ värde %>` skriver
rått (samma `~`-konvention `docraptor-sjalvbarande.mjs` INTE använder men
Eta:s egen dokumentation gör). Supabase Edge Functions stödjer redan
`jsr:`-specifikationer (CLI ≥ 1.166.1, community-diskussion #25842,
förstapartsdokumentation `supabase.com/docs/guides/functions/dependencies`)
— men **repots EGEN konvention** är genomgående `https://esm.sh/<paket>@
<version>` (`pdf-lib@1.17.1`, `resend@6`, `zod@4`, `@supabase/supabase-js@2`
— samtliga grep-verifierade i `supabase/functions/`). Rekommendationen
följer den konventionen: `import { Eta } from 'https://esm.sh/eta@<vX>'`
i stället för `jsr:`, för konsekvens med varje annan Deno-import i detta
repo — INTE för att `jsr:` skulle vara sämre.

**Vad Eta ersätter, konkret:**

- Platshållarersättning (`{{fältnamn}}` → värde): `<%= data.kursnamn %>`
  i mallen, autoescapead.
- Villkorlig blockborttagning (`if (!r || r.tomt) p.remove()`): `<% if
  (!data.datumTidTomt) { %>...<% } %>` runt blocket i mallen — samma
  logik, uttryckt i mallen i stället för i JS-DOM-kod.
- Listgenerering (agenda-punkter): `<% for (const punkt of
  data.dagEttAgenda) { %><li>...<% } %>` — direkt motsvarighet till
  `ul.append(li)`-loopen, utan att röra en enda DOM-nod.
- Selektiv fetstil (`meditationsnamn`-span): `<% if (punkt.meditation) {
  %><span class="meditationsnamn"><%= punkt.text %></span><% } else { %>
  <%= punkt.text %><% } %>` — samma villkor, uttryckt i mallen.

**XSS-ytan att aktivt skydda:** eventdata (kursnamn, ort, agenda-texter)
kommer från Airtable — en person med skrivbehörighet i basen KAN i teorin
lägga in `<script>` i ett fritextfält. Eta:s `autoEscape: true` gör
`<%= %>`-taggar säkra mot detta AUTOMATISKT; disciplinen som krävs av
byggskivan är att **aldrig** använda `<%~ %>` (rått läge) för något fält
som ytterst härstammar från Airtable-fritext, bara för hårdkodad markup
(HTML-strukturen i mallen själv). Detta är en enklare, mer verifierbar
regel än DOM-vägens implicita "vi råkar bara använda `.textContent`
överallt" — en framtida ändrare kan av misstag introducera `.innerHTML`
utan att det syns lika tydligt som en `<%~ %>` i en mall-diff.

## Delfråga 5 — Precedent

**Redan grundat i `pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md` § 1**
(återanvänt, inte omresearchat): DocRaptor har Shopify/Square/HubSpot/
Accenture/Wiley som namngivna kunder (docraptor.com, egen sida);
Supabase demonstrerar SJÄLVA CSS-driven rendering (`@vercel/og`/Satori)
inuti en Edge Function (`supabase.com/docs/guides/functions/examples/
og-image`); Gotenberg är det ledande självhostade MIT-alternativet.
**Detta pass sökte specifikt EFTER ny precedent för den SNÄVARE frågan
"bundlade mallfiler + extern HTML→PDF-tjänst från en edge-runtime" — och
hittade ingen ytterligare namngiven instans utöver vad 18-augusti-passet
redan dokumenterat.** Precedent-rymden för just KOMBINATIONEN
(`static_files`-bundling + extern PDF-motor, specifikt i Supabase Edge
Functions) är **tunn** — Supabases egen changelog för `static_files`
(§ Delfråga 1) nämner själv *"HTML email templates"* som ett av tre
namngivna användningsfall, vilket är strukturellt samma mönster (bundlad
mall, extern konsumtion), men ingen tredje part dokumenterar offentligt
att de kombinerar `static_files` med en HTML→PDF-tjänst specifikt. Detta
deklareras öppet — räkningen fejkas inte: **1 förstaparts-signal (Supabase
själva namnger use-caset), 0 tredjeparts-instanser hittade.**

## Domen

1. **Bundling: `static_files`** (config.toml, glob mot en delad
   `supabase/functions/_shared/mallar/`-katalog), synkad från `docs/mallar/`
   via ett litet script + en CI-parity-grind. Docker måste vara igång på
   deploy-maskinen (ny operativ förutsättning, se § 1).
2. **DocRaptor i prod:** samma produktionsnyckel i staging (`test: true`)
   och prod (`test: false`) secrets, synkront anrop (60 s-tak, vi ligger på
   ~3 s), självbärande HTML (ingen `baseurl`/signerad-URL-väg), en retry på
   5xx/timeout.
3. **Ingen DOM server-side.** `deno-dom` fungerar men är onödig extra vikt.
4. **Mallmotor: Eta** via `https://esm.sh/eta@<version>`, `autoEscape: true`,
   disciplin: aldrig `<%~ %>` på Airtable-härledd fritext.
5. **Precedent är tunn för den exakta kombinationen** — vägd, inte fejkad.

**Föreslagen filstruktur för ADR-125:**

- `scripts/synka-bilagemallar.mjs` — kopierar `docs/mallar/bilagor/*.{html,css}`
  och `public/fonts/bilagor/*.ttf` → `supabase/functions/_shared/mallar/`.
- `scripts/check-mallparitet.sh` — CI-grind, diffar käll- mot målkatalog.
- `supabase/functions/_shared/mall-render.ts` — REN funktion
  `renderaMallPdf(mall, data)`: läser bundlade filer (`Deno.readFile(new
  URL(...))`), kör Eta, gör-självbärande (portering av
  `docraptor-sjalvbarande.mjs`s regex-logik till Deno), POST:ar till
  DocRaptor. Samma "ren funktion, inget I/O-beroende på anroparen"-mönster
  som `_shared/receipt-pdf.ts`s `renderKvittoPdf` redan etablerat.
- **Tre EF:er, samma renderare:** en klient-triggad förhandsgranskning
  (mönster: `generate-event-attachment`s befintliga `preview: true`-gren),
  en persisterande generate-EF per bilageklass (Storage + Bilagor-rad,
  samma mönster `generate-event-attachment` redan har), och kvittots
  betalnings-triggade väg (`send-receipt-email`, byter `renderKvittoPdf`
  mot `renderaMallPdf('kvitto', ...)`) — alla tre anropar SAMMA
  `_shared/mall-render.ts`, ingen egen HTML-byggnadslogik per EF.
- `config.toml`: `static_files`-rad i VARJE av de tre produktionsfunktionerna
  (glob mot `_shared/mallar/**/*`), plus `.prod-functions-allowlist.conf`-
  uppdatering för de nya generate-EF:erna (kvittots EF finns redan där).
- **Deployordning:** synka mallarna → `npm run check:docs`/CI-parity-grind
  grön → `bash scripts/fas4-prod-deploy.sh --deploya <prod-ref>` (redan
  Docker-baserad, ingen ändring av skriptet krävs).

## Vad jag inte kunde belägga

- **Om Docker Desktop faktiskt körs på Marcus deploy-maskin.** Kritisk
  förutsättning för att `static_files` ska bundla korrekt vid prod-deploy
  (§ 1) — overifierat i denna sandlåda (ingen Docker här) och onämnt i all
  tidigare deploy-research. Måste kontrolleras (`docker info`) INNAN första
  skarpa deploy med static_files.
- **Exakt sökvägsupplösning för en `static_files`-fil bundlad från en
  ANNAN katalog än funktionens egen** (`../_shared/mallar/x.html` läst via
  `Deno.readFile(new URL(...))`). Härlett analogt från hur `_shared/*.ts`-
  TS-importer redan fungerar i denna kodbas, men INTE separat mätt för
  static assets specifikt — kräver minimaltest (repots egen disciplin:
  "testa nytt bibliotek/approach med minimalt test innan full
  implementation") innan full byggskiva.
- **Om `--use-api`-vägens historiska static-files-begränsning** (community-
  rapporterad, GitHub-diskussion #32815) fortfarande gäller i CLI 2.115.0,
  eller om den nyare TS-CLI-koden (som SYNES läsa/ladda upp static files
  även i API-läget) har löst den. Moot för oss (vi använder aldrig
  `--use-api`) men lämnas explicit obelagt snarare än gissat.
- **Eta:s exakta `autoEscape`-standardvärde ur en förstaparts-sida** — jag
  fick detta via en sammanfattad websökning (JSR/community-dokumentation),
  inte ett verbatim-citat direkt ur `eta.js.org`s källkod. Rekommendationen
  (sätt `autoEscape: true` EXPLICIT i konfigurationen, lita inte på
  standardvärdet) eliminerar denna osäkerhet i praktiken.
- **Om bekräftelsebilagans/deltagarinformationens CSS har egna `@media
  screen`-regler** som skulle kräva en explicit `media: 'print'` i
  `prince_options` — inte kontrollerat i detta pass (billig kontroll,
  `grep '@media' docs/mallar/bilagor/*.css`, lämnad till byggskivan).
- **DocRaptors retry-/idempotens-rekommendation specifikt för nätverksfel**
  — ingen sida gav en uttrycklig sådan; min rekommendation (§ 2) är egen,
  inte leverantörens.

## Oväntade fynd utanför frågan

- **RÄTTELSE (orkestreraren, 2026-08-23, samma dag):** passet läste
  huvudkatalogen medan den stod på den gamla grenen `docs/s109-hub-lyft`
  (`e47a4278`), inte på `origin/main`. Dess två "premisskorrigeringar" —
  att `sjalvbarande.ts` inte finns som egen fil och att uppdragets 233
  rader var en förväxling — var därför FEL: på `origin/main` (`583fcd45`)
  finns `src/components/dokument/prototyp/sjalvbarande.ts` med exakt 233
  rader (`wc -l`, verifierat i förgrunden), och `docraptor-sjalvbarande.mjs`
  är 173. Uppdragets premisser höll; passets disk gjorde det inte. Lärdom
  av `L521`-klassen: ett oisolerat pass läser det träd det står i — trädet
  synkas FÖRE passet, av den som skickar det. Rekommendationerna ovan
  påverkas inte (de vilar på förstapartskällor, inte på repots fil-läge),
  men § 3:s portabilitetsanalys gjordes mot den inlinade
  prototyp-varianten och ska läsas mot `sjalvbarande.ts` vid bygget.
- **Cavolini-licensbegränsningen (§ ovan) gäller VARJE bundlingsväg lika**
  — den är inte specifik för `static_files`. Om ADR-125 någon gång
  omprövar bundlingsvalet är detta en konstant, inte en variabel att räkna
  om.

## Källförteckning

- Supabase — changelog, static files:
  <https://supabase.com/changelog/32815-add-static-files-to-edge-functions>
- Supabase — GitHub-diskussion, static files:
  <https://github.com/orgs/supabase/discussions/32815>
- Supabase CLI — config-referens (`static_files`-fältet):
  <https://supabase.com/docs/guides/local-development/cli/config>
- Supabase — Edge Function bundle-storlekstak:
  <https://supabase.com/docs/guides/troubleshooting/edge-function-bundle-size-issues>
- Supabase — JSR-modulstöd i Edge Functions:
  <https://github.com/orgs/supabase/discussions/25842>
- Supabase — dependency-hantering (jsr:/npm:-specifikationer):
  <https://supabase.com/docs/guides/functions/dependencies>
- `supabase/cli` källkod (GitHub, hämtat via `gh api`):
  `packages/config/src/functions.ts`,
  `apps/cli/src/shared/functions/deploy.ts`
- DocRaptor — dokumentation (huvudsida, tutorial, API-referens, limits):
  <https://docraptor.com/documentation> ·
  <https://docraptor.com/documentation/api> ·
  <https://docraptor.com/documentation/api/limits> ·
  <https://docraptor.com/documentation/faq>
- Deno — `DOMParser`-issue: <https://github.com/denoland/deno/issues/24995>
- `deno-dom` — GitHub: <https://github.com/b-fuze/deno-dom>
- Eta — egen webbplats: <https://eta.js.org/>
- Intern: `docs/research/docraptor-minimaltest-2026-08-22.md`
- Intern: `docs/research/pdf-renderingsvagen-html-vs-pdflib-2026-08-18.md`
- Intern: `docs/research/utskicks-bilage-arkitektur-2026-08-03.md`
- Intern: `docs/decisions/ADR-119-pdf-renderingsvagen-extern-motor-per-event.md`
- Intern: `docs/mallar/bilagor/README.md`, `.gitignore` rad 132–139
- Intern: `src/components/dokument/prototyp/GenereringsPrototyp.tsx`
  rad 542–713
- Intern: `scripts/docraptor-sjalvbarande.mjs`,
  `supabase/functions/test-docraptor-render/index.ts`,
  `supabase/functions/_shared/receipt-pdf.ts`,
  `supabase/functions/generate-event-attachment/index.ts`,
  `scripts/deploy-prod-functions.sh`, `scripts/fas4-prod-deploy.sh`

---

Arbetsträdet bär vid avslut endast denna nya fil under `docs/research/` —
inget annat rört, inget stagat, inget committat.
