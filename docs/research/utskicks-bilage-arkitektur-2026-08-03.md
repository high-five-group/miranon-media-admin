---
owner: marcus803
updated: 2026-08-03
review_by: 2027-02-03
status: stable
---

# Vilken teknisk grund bär enhetliga server-utskick med valbara PDF-bilagor plus server-genererade PDF:er i vår stack? (Code, 2026-08-03)

> **Proveniens:** avgränsat research-pass beställt ur konsoliderings-grillningen
> S93 Del 3 (8/8 kvitterade beslut, Marcus 2026-08-03) — se
> [`tasks/sessions/archive/2026-08/2026-08-02-session-93.md`](../../tasks/sessions/archive/2026-08/2026-08-02-session-93.md)
> Del 3 (landad på grenen `docs/s93-del3-konsolideringsgrillning`, ej ännu
> mergad till `main` vid pass-start). Grillningen kvitterade beslut 4
> (transportform: enhetliga riktiga server-utskick, mailto-eran stängs, ADR-067
> revideras) och beslut 6 (bilage-hemvist: **delad** — bytes i Supabase
> Storage, metadata + eventkoppling som additiv `Bilagor`-tabell i basen; ADR
> vid bygget, research-grundad) samt beslut 7 (dokumentklasserna: A uppladdad,
> B event-mallad, C person-genererad/kvitto). Detta pass provar den tekniska
> grunden för båda mot primärkällor **innan** respektive ADR skrivs — passet
> beslutar ingenting, det stänger eller falsifierar antaganden.
>
> Utgångspunkt (läst före research): `supabase/functions/send-email/index.ts`
> ([ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)),
> [ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md)
> (lager-oberoende fitness-invariant),
> [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
> (Airtable som förstklassig leverabel),
> [`docs/reference/data-model.md`](../reference/data-model.md) och
> [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md).

## Kort svar

**Den delade bilage-hemvisten (bytes i Supabase Storage, metadata i basen)
håller mot varje leverantörskälla som provats i detta pass — den blir
STARKARE grundad, inte falsifierad.** Men passet hittade en enda punkt som
tvingar en verklig ändring i själva SEND-kontraktet, inte bara i
lagringsvalet: **Resends batch-ändpunkt (`/emails/batch`), som
[ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D2
valde för ALLA utskick, stödjer inte bilagor alls** — dokumenterat
ordagrant av Resend själva, och bekräftat community-rapporterat som en
**tyst** brist (bilagan försvinner utan felmeddelande), inte en synlig
avvisning. Ett enhetligt utskick med valbar bilaga kan därför inte gå genom
dagens enda sändväg; det behövs en andra, attachment-bärande sändväg
(loopade singel-`/emails`-anrop, som redan stödjer bilagor, upp till 50
mottagare/anrop, 40 MB/mail efter base64-kodning och samma 24-timmars
idempotens-fönster som batch redan bygger på).

PDF-generering i Deno/Supabase Edge Functions är väl beprövat: `pdf-lib` är
ren JavaScript utan native-beroenden, körs oförändrat i Deno (officiellt
Deno-quickstart), i Cloudflare Workers (workerd) och — community-bekräftat —
inuti en Supabase Edge Function. Detta pass **mätte** (inte bara citerade)
att `pdf-lib` renderar svensk text (å/ä/ö/Å/Ö) korrekt med sitt inbyggda
teckensnitt, utan anpassad typsnitts-inbäddning.

Airtable-attachments — den väg som INTE valdes — har en 2-timmars
utgångstid på sina URL:er (sedan 2022-11-08) och ett 5 MB-tak på
direkt-byte-uppladdning via API:t. Det är precis den sortens
strukturella begränsning som gör "delad hemvist" till ett grundat val,
inte bara en smaksak — se Delfråga 4.

## Delfråga 1 — Resend + bilagor

**Käll-hierarki:** Resends egen API-referens (`resend.com/docs/api-reference/…`)
och dashboard-dokumentation (`resend.com/docs/dashboard/…`), korsläst mot ett
rapporterat community-fynd (`resend-node`-repots issue-spårare) som bekräftar
manifestationen i praktiken.

### Bilage-formen

Attachment-objektet ([`resend.com/docs/api-reference/emails/send-email`](https://resend.com/docs/api-reference/emails/send-email))
accepterar:

- `content` — "Content of an attached file, passed as a buffer or Base64 string."
- `filename` — filnamnet.
- `path` (valfri) — "Path where the attachment file is hosted" — en URL Resend
  själv hämtar bytes ifrån vid sändtillfället.
- `content_type` (valfri) — annars härledd ur filnamnet.
- `content_id` (valfri) — för inbäddade bilder via `cid:`-referens.

Två vägar in alltså: klienten (vår EF) skickar antingen färdiga bytes
(base64/buffer) eller en URL Resend hämtar själv. Det senare är direkt
relevant för Delfråga 2 (en Supabase Storage-signerad URL kan gå rakt in i
`path` utan att EF:en någonsin läser bytes själv).

### Storleksgränser

[`resend.com/docs/dashboard/emails/attachments`](https://resend.com/docs/dashboard/emails/attachments),
ordagrant: **"Emails can be no larger than 40MB (including attachments after
Base64 encoding)."** Detta är ett **per-mail**-tak (efter base64, inte
rå-byte-storlek — base64 är ~33 % större än källan, så praktiskt utrymme är
snarare ~30 MB rådata). Inget separat per-bilaga-tak dokumenteras utöver
detta totaltak.

### Flera mottagare med samma bilaga — den lastbärande begränsningen

Samma sida, ordagrant: **"Emails with attachments cannot be sent using our
batching endpoint."** Detta är inte en marginell detalj — det är exakt den
ändpunkt [ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)
D2 valde för ALLA utskick (`POST /emails/batch`, ≤100 mail/anrop). Community-
rapporterat i [`resend/resend-node#409`](https://github.com/resend/resend-node/issues/409):
en användare observerade att bilagan **tyst uteblir** vid `resend.batch.send`
men levereras korrekt vid `resend.emails.send` — samma payload, olika
ändpunkt. Ingen synlig avvisning, inget fel i svaret — precis den
allvarlighetsklass (`⚠️ tyst korruption`) som
[`airtable-constraints.md`](../reference/airtable-constraints.md) redan
namnger för andra brister i detta system.

**Konsekvens för arkitekturen:** ett enhetligt send-kontrakt med valbar
bilaga kan inte vara EN väg. Attachment-bärande sändningar måste loopa
singel-`/emails`-anrop (en per mottagare), medan attachment-fria sändningar
kan fortsätta gå via batch precis som idag. `to`-fältet på singel-anropet
tillåter tekniskt upp till **"Max 50"** mottagare i samma array
([send-email-referensen](https://resend.com/docs/api-reference/emails/send-email))
— men att lägga flera mottagare i samma `to`-array exponerar varje
mottagares adress för alla andra i samma anrop, vilket redan är MEDVETET
undvikt i vår kodbas: `resend-batch.ts` bygger alltid `to: [spec.email]`
(en mottagare per rad, se
[`_shared/resend-batch.ts:65`](../../supabase/functions/_shared/resend-batch.ts#L65)).
Loopen bör alltså vara **en mottagare per anrop**, oavsett om bilagan är
delad (klass B, samma mall+bilaga till många) eller unik per mottagare
(klass C, kvittot) — skillnaden mellan klasserna är bara vilka bytes som
läses per iteration, inte loopens form.

### Idempotens-implikationer

Singel-`/emails`-ändpunkten stödjer samma `Idempotency-Key`-header som
batch: **24 timmars dedupliceringsfönster**, nyckel max 256 tecken, "unique
per API request" ([`resend.com/docs/api-reference/emails/send-email`](https://resend.com/docs/api-reference/emails/send-email);
mekaniken beskriven i
[`resend.com/changelog/idempotency-keys`](https://resend.com/changelog/idempotency-keys)).
Samma två utfall som redan hanteras i vår kod: **409** vid samma nyckel +
ändrad payload ("Retrying this request is useless without changing the
idempotency key or payload"), och ett separat läge vid en redan pågående
begäran med samma nyckel ("safe to retry this request later"). Dagens
mönster (`${jobId}/b${index}` per batch-index,
[`send-email/index.ts:111`](../../supabase/functions/send-email/index.ts#L111))
bär rakt över till en attachment-lane: `${jobId}/r${recipientIndex}` per
mottagar-index, samma deterministiska-nyckel-princip, ingen ny mekanism
krävs.

### Genomströmning (mätt mot dokumenterade tal, inte antaget)

Rate-limiten är **team-omfattande, inte per ändpunkt**:
[`resend.com/docs/api-reference/introduction`](https://resend.com/docs/api-reference/introduction)
— **"The default maximum rate limit is 10 requests per second per team"**
("This number can be increased for trusted senders by request"), 429 vid
överskridande. En attachment-lane med sekventiella singel-sändningar ger
alltså ~10 mottagare/sekund i stället för batchens ~100 mottagare/anrop. För
detta projekts volymer (ADR-015: ~5–20 mail/dag baseline; S93 Del 3 punkt 5
beskriver åtgärds-sidans sändningar som riktade, händelse-avgränsade listor,
inte hela segment) är detta gott och väl inom
[Supabase Edge Functions wall-clock-budget](https://supabase.com/docs/guides/functions)
(150 s Free / 400 s Paid) — en 200-mottagare-sändning tar ~20 sekunder
sekventiellt vid 10 req/s.

## Delfråga 2 — Supabase Storage server-side

**Käll-hierarki:** Supabases egen dokumentation (`supabase.com/docs/guides/storage/…`,
`supabase.com/docs/reference/javascript/…`), korsläst mot **redan etablerad
praxis i detta repo** (`create-admin-user/index.ts`) som starkaste interna
precedent, plus en GitHub-diskussion i Supabases egen org som tredje
datapunkt.

### Server-side läsmönster: två vägar, båda officiella

**(a) Direkt byte-läsning (service-role, kringgår RLS).** En Edge Function
konstruerar en admin-klient med projektets service-role-nyckel och läser
filen som bytes:

```ts
const supabaseAdmin = createClient(url, serviceRoleKey);
const { data, error } = await supabaseAdmin.storage.from('event-documents').download(path);
```

Detta ÄR redan etablerad praxis i vår egen kodbas, inte bara Supabases
dokumentation: `supabase/functions/create-admin-user/index.ts:93–96`
konstruerar exakt denna klient (`createClient(Deno.env.get('SUPABASE_URL')!,
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)`) för en annan admin-operation
(`auth.admin.createUser`). Samma mönster, samma två miljövariabler
(Supabase-auto-injicerade i varje Edge Function), ny använding.
Officiell bekräftelse av `.download()`-vägen:
[`supabase.com/docs/guides/storage/serving/downloads`](https://supabase.com/docs/guides/storage/serving/downloads).

**(b) Signerad URL, given vidare till Resends `path`-fält.** I stället för
att EF:en själv läser bytes, genererar den en kortlivad signerad URL
(`storage.from(bucket).createSignedUrl(path, expiresInSeconds)`) och skickar
den raka URL:en till Resend som `attachments[].path` (Delfråga 1) — Resend
hämtar själv filen vid sändtillfället. Detta sparar EF:en en
läs-och-base64-kodnings-runda. Officiell dokumentation:
[`supabase.com/docs/guides/storage/serving/downloads`](https://supabase.com/docs/guides/storage/serving/downloads)
— "Storage signed URLs are signed with a dedicated internal key that is
separate from your project's Auth JWT signing key" (URL:ens giltighet är
oberoende av Auth-nyckelrotation).

**Intern precedent för EXAKT detta redan finns i systerprojektet
(psionautics), fast utan signerad URL:** `data-model.md` rad ~973/998
dokumenterar att mail-mallen `medveten-kontakt-deltagarinformation` redan
använder `{{{pdfUrl}}}` för att peka Resend mot en Supabase Storage-fil i
bucket `event-documents` — men den bucketen sattes **helt publik**
(`UPDATE storage.buckets SET public = true WHERE id = 'event-documents'`),
inte tidsbegränsad signerad åtkomst. Det är samma grundmönster (Resend
hämtar en Storage-URL) som redan KÖRT SKARPT i vår ekosystem-familj — men
med en svagare säkerhetsmodell (permanent publik fil) än vad väg (b) ovan
föreslår (kortlivad signerad URL). Rekommendationen nedan bygger vidare på
det beprövade mönstret men stänger den öppna ytan.

### Bucket-struktur för per-event-kopplade filer

Ingen befintlig bucket för detta ändamål finns i repot ännu (grep mot
`supabase/functions/` gav noll träffar på Storage-användning utöver ovan
nämnda `create-admin-user`-mönster för Auth, inte Storage) — detta är
grönfält. Den pragmatiska formen, i linje med grillningens `Bilagor`-tabell
(metadata + eventkoppling i basen): path-prefix per event/entitet
(`{bucket}/{eventId}/{attachmentId}-{filnamn}`), privat bucket som default
(Supabase-buckets skapas privata om inget annat anges), signerad åtkomst per
send i stället för en publik bucket. Ingen extern branschprecedent utöver
Supabase-mönstret behövdes här — bucket-per-tenant/entitet-prefixering är
S3-konventionen Supabase Storage är modellerad på (S3-kompatibelt API,
[`supabase.com/docs/guides/storage`](https://supabase.com/docs/guides/storage)),
inte en egen uppfinning.

### Storlekstak

- **Global projektgräns** (per plan), [`supabase.com/docs/guides/storage/uploads/file-limits`](https://supabase.com/docs/guides/storage/uploads/file-limits):
  Free-plan "the limit can't exceed 50 MB"; Pro/Team "up to 500 GB"; detta är
  en **global** gräns som varje bucket-nivå-gräns måste underskrida.
- **Edge Function-resurser** (relevanta om EF:en läser bytes i minnet, väg a):
  [`supabase.com/docs/guides/functions/limits`](https://supabase.com/docs/guides/functions):
  256 MB minne, 2 s CPU-tid (exkluderar async I/O som nätverksläsning), 150 s
  (Free) / 400 s (Paid) wall-clock. Realistiska brev-/kvitto-PDF:er (typiskt
  under några MB) ryms gott inom detta; Resends egna 40 MB/mail-tak (Delfråga
  1) är i praktiken den snävare gränsen.
- **Uppladdning över 6 MB** rekommenderas gå via TUS-baserad resumable
  upload ([`supabase.com/docs/guides/storage/uploads/resumable-uploads`](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)),
  ett öppet protokoll (tus.io), inte en Supabase-egen uppfinning.

### Upload-vägen från klienten genom adaptern — ADR-057-klassning

[ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md) kräver
(klausul a) att UI når datakällan **ENDAST** via `DataSourceAdapter`, aldrig
via direkt-import av en konkret adapter eller EF-klient. `DataSourceAdapter.ts`
har idag **noll** attachment-/dokument-metoder (verifierat mot disk,
`src/data/adapters/DataSourceAdapter.ts`) — grönfält, ingen befintlig
invariant-konflikt att lösa, bara en ny yta att lägga till rätt.

Konkret innebär det: Dokument-ytan får ALDRIG importera
`@supabase/supabase-js` eller anropa Storage-API:t direkt. Den anropar en ny
adapter-metod (t.ex. `uploadAttachment(input): Promise<Attachment>`), som
BÅDA adaptrarna implementerar (klausul c, full port-paritet) — `AirtableAdapter`
anropar en EF som skriver Storage-bytes + en `Bilagor`-metadatarad i basen;
en framtida `SupabaseAdapter` (Fas E) anropar samma Storage men skriver
metadata till Postgres i stället. Storage-lagret (bytes) är alltså
**oberoende av vilken record-adapter som är aktiv** — det är inte
"Airtable-data" eller "Supabase-data" i ADR-057:s mening, det är en tredje,
delad resurs bakom SAMMA adapter-kontrakt. Två praktiska mönster för själva
uppladdningen, båda EF-medierade (aldrig ett rått klient-SDK-anrop mot
Storage):

1. **Små filer (uppladdade klass A-dokument, typiska brev-mallar):** EF:en
   tar emot bytes direkt i request-body och skriver dem med service-role
   (`storage.from(bucket).upload()`) — kort implementation, men bundet av EF:ens
   request-storlek/minne (ovan).
   2. **Stora filer:** EF:en genererar en `createSignedUploadUrl`-token
   server-side och lämnar tillbaka `{ signedUrl, token, path }`; klienten
   laddar upp direkt mot Storage (TUS/resumable ovan) UTAN att bytes någonsin
   passerar EF:en. Detta HÅLLER ADR-057:s "adapter-enda"-klausul eftersom
   AUKTORISATIONS-BESLUTET (vem får ladda upp vad, till vilken path) fortsatt
   fattas server-side av EF:en — klienten får bara ett tidsbegränsat,
   scopat tillstånd, inte en genväg runt adaptern.

## Delfråga 3 — PDF-generering i Deno-runtime

**Käll-hierarki:** förstaparts-dokumentation (pdf-lib.js.org, Cloudflare Workers
docs), community-bekräftelse i Supabases egen GitHub-org (starkaste
tillgängliga tredjepartskälla för just Supabase Edge Functions-runtimen), samt
**en egen mätning** i detta pass (se nedan) eftersom Deno-CLI inte fanns
tillgängligt i denna sandlåda — mätningen kördes mot `pdf-lib`s identiska,
runtime-agnostiska rena JS-kod under Node i stället, med detta uttryckligen
noterat som en ombytt proxy, inte en direktverifiering mot Supabase Edge
Runtime.

### Kan Supabase Edge Functions generera PDF:er?

Ja — `pdf-lib` är "pure JavaScript. No native code, no Chromium, no
dependencies that touch the filesystem" ([PDF4.dev, Cloudflare Workers-artikel](https://pdf4.dev/blog/pdf-generation-cloudflare-workers)),
och den officiella dokumentationen bär ett eget Deno-snabbstartskommando:
**`deno run --allow-write https://pdf-lib.js.org/deno/quick_start.ts`**
([`pdf-lib.js.org`](https://pdf-lib.js.org/)) — förstaparts-bekräftelse av
Deno-stöd, inte bara "borde fungera".

### Minst 3 namngivna precedent (serverless/edge)

1. **Cloudflare Workers (workerd).** "pdf-lib is pure JavaScript with no
   native dependencies, so it runs unchanged on workerd."
   ([PDF4.dev](https://pdf4.dev/blog/pdf-generation-cloudflare-workers)) —
   samma edge-klass av begränsningar (ingen filsystem-åtkomst, ingen
   Chromium) som Supabase Edge Functions.
2. **Deno / Deno Deploy (förstaparts, ovan) + tredjeparts-tutorial**
   ([Andrew Dillon, "How to Create and Modify PDF Files in Deno With
   pdf-lib", Medium](https://medium.com/swlh/how-to-create-and-modify-pdf-files-in-deno-ffaad7099b0)) —
   samma Deno-runtime-familj som Supabase Edge Functions kör (Supabase
   Edge Runtime är en Deno-baserad sandlåda).
3. **Supabase Edge Functions, community-bekräftat i Supabases egen
   GitHub-org.** [`github.com/orgs/supabase/discussions/19824`](https://github.com/orgs/supabase/discussions/19824):
   en bidragsgivare rapporterar att `pdfmake` ([pdfmake.org](http://pdfmake.org/#/))
   fungerat i en Edge Function — tar in data, genererar PDF-rådata, och
   skriver resultatet till Supabase Storage via Storage-API:t. Samma
   diskussion rapporterar också ett **öppet, oförklarat fel**
   (`"WorkerRequestCancelled: request has been cancelled by supervisor"`)
   som uppstod i en användares miljö men inte i Postman-testning — obelagt
   varför, registreras som öppen risk (se § Vad jag inte kunde belägga).

En fjärde, relaterad datapunkt (ej ett fullt precedent för GENERERING, men
värd att notera): **`unpdf`** är specifikt byggt för edge/serverless-runtimes
(Cloudflare Workers, Vercel Edge, Deno) men löser PDF-**extraktion**, inte
generering — irrelevant för klass B/C men bekräftar att edge-first
PDF-tooling är en etablerad, namngiven kategori, inte ett enda udda fall.

### Mätning: svensk text (åäö) i inbyggt typsnitt — utfört i detta pass

Testat mot `pdf-lib@1.17.1` (npm, Node v24.13.1 — Deno-CLI saknades i denna
sandlåda; `pdf-lib` har noll native-beroenden per källorna ovan, så samma
rena-JS-kod kör identiskt i Deno). Ett dokument byggdes med
`StandardFonts.Helvetica`/`HelveticaBold` (inget anpassat typsnitt, ingen
`fontkit`-inbäddning) och text innehållande å/ä/ö/Å/Ö, em-dash och accenttecken
(`"Kvitto — Åsa Öberg, Café Söderköping"`, `"Moms 25% — Björn Ångström"`, m.fl.).
Ingen kodningsfel kastades vid `drawText`, och den resulterande PDF:en
(1135 byte) extraherades ORD-EXAKT tillbaka via `pdftotext -layout`
(oberoende verktyg, poppler-utils) — samtliga svenska specialtecken
återgavs korrekt utan mojibake. **Slutsats: standardtypsnitten (WinAnsi-
kodning) räcker för svensk brev-/kvittotext utan anpassad typsnitts-
inbäddning.** Detta var INTE en körning mot den skarpa Supabase Edge
Runtime-sandlådan — se § Vad jag inte kunde belägga.

### Begränsning värd att notera (inte en blockerare)

`pdf-lib` är "a programmatic API, not an HTML renderer … CSS is irrelevant;
there is no layout engine" ([PDF4.dev](https://pdf4.dev/blog/pdf-generation-cloudflare-workers)) —
layout byggs med `drawText`/`drawRectangle`/koordinater, inte HTML/CSS. För
klass B (event-mallade brev, "ej redigerbar i v1" per grillningens beslut 7)
och klass C (kvitton, svensk momslayout) är detta en rimlig avvägning: enkla,
tabellartade layouter (rader, belopp, moms-uppdelning) är precis vad
`pdf-lib` är byggt för. En framtida mall-editor (nämnd i grillningen som
"senare") skulle sannolikt kräva en annan renderingsväg (HTML/CSS-baserad)
— registreras här som ett öppet spår, ej utrett i detta pass.

## Delfråga 4 — Airtable attachments (faktastängning)

**Käll-hierarki:** Airtables egen utvecklardokumentation
(`airtable.com/developers/web/api/…`) och supportsida
(`support.airtable.com/docs/…`). Detta stänger den lucka
[`airtable-constraints.md`](../reference/airtable-constraints.md) själv
konstaterar saknas (katalogen har inga attachment-poster).

### Objektform

[`airtable.com/developers/web/api/field-model#multipleattachment`](https://airtable.com/developers/web/api/field-model#multipleattachment):
`id`, `filename`, `type` (MIME), `size` (byte), `url`, `height`/`width` (för
bilder), `thumbnails` (small/large/full).

### Tidsbegränsade URL:er — sedan när, hur länge

[`support.airtable.com/docs/airtable-attachment-url-behavior`](https://support.airtable.com/docs/airtable-attachment-url-behavior),
ordagrant: **"On November 8, 2022, Airtable introduced expiring attachment
URLs across our product surface areas to help increase attachment
security."** Giltighetstid: **"we will ensure that download URLs stay
active for at least 2 hours after receiving them"** (Airtable reserverar
sig för att ändra exakt fönster, men golvet är 2 timmar). Ingen
förnyelsemekanism dokumenteras utöver att hämta record igen (ny URL följer
med ett nytt API-svar); rekommendationen för persistent åtkomst är
uttryckligen: **"use an external hosting service or integration — like
Zapier, Workato, or your code — to store a copy of the attachment separately
from Airtable."**

### Upload-API:ets form och storleksgränser

[`airtable.com/developers/web/api/upload-attachment`](https://airtable.com/developers/web/api/upload-attachment):
`POST /v0/{baseId}/{recordId}/{attachmentFieldIdOrName}/uploadAttachment`,
body `{ contentType, file (base64), filename }` — **"Upload an attachment up
to 5 MB to an attachment cell via the file bytes directly."** Större filer
måste gå via den andra vägen: sätta fältet till `[{ url: "…" }]` vid
record-create/update, där Airtable själv hämtar och lagrar filen (samma
mönster som Resends `path`-fält i Delfråga 1 — Airtable är den hämtande
parten). Det generella per-fil-taket
([`support.airtable.com/docs/attachment-field`](https://support.airtable.com/docs/attachment-field)):
**"Airtable supports individual attachments up to 5GB in size"** (1 GB på
Free-plan). Per-bas total lagringsgräns per plan: Free 1 GB, Team 20 GB,
Business 100 GB, Enterprise Scale 1000 GB. Vårt abonnemang är **Team**-plan
(sekundärkälla, ej live-verifierad i detta pass: `tasks/lessons.md` rad
~2054, Session 19 — "Airtable Team-plan prissätts per-workspace") → 20 GB
per-bas-tak, 5 GB per-fil-tak.

### Vad detta faktiskt underbygger

De 2-timmars-URL:erna är den skarpaste anledningen att INTE lägga
server-genererade PDF:er (klass B/C) i ett Airtable attachment-fält som
enda hemvist: en genererad kvitto-PDF måste kunna refereras (t.ex. från
Utskickslogg eller en framtida omsändning) långt efter 2 timmar, och
Airtables egen dokumentation säger uttryckligen att den use-caset INTE är
vad tjänsten är byggd för ("store a copy … separately from Airtable"). 5
MB-direktuppladdningstaket förstärker samma slutsats: server-sidan skulle
tvingas antingen stanna under 5 MB (client-side/EF-side base64-POST) eller
gå via URL-baserad attach (som i sig kräver att bytes REDAN ligger
någonstans annat — cirkulärt, om Airtable vore den enda hemvisten). **Detta
är den empiriska grunden för att grillningens "delad hemvist"-beslut håller
— inte bara en smaksak, utan ett val som undviker en dokumenterad
strukturell vägg.**

### Kandidat-poster för `airtable-constraints.md` (förslag — katalogen ändras EJ av detta pass)

Katalogen saknar idag attachment-poster helt. Två kandidater, i katalogens
egna fyrdelade format (Begränsning / Kostnad-manifestation / v1-kompensation
/ Fas E-krav), för ägaren att ta ställning till vid nästa uppdatering:

- **Kandidat (nästa lediga nummer, idag P28):** *Attachment-URL:er
  utgår efter 2 timmar (sedan 2022-11-08).* Kostnad: gör Airtable-native
  attachment-fält olämpliga som enda hemvist för filer som ska refereras
  längre än sessionens livstid — direkt relevant för bilage-arkitekturen
  (detta pass, Delfråga 2 och 4). v1-kompensation: **ej tillämplig i vår
  arkitektur** — Bilagor-tabellen håller metadata, inte bytes, så väggen
  träffar oss inte i praktiken, men är skälet till varför. Fas E-krav:
  Postgres/Supabase Storage har ingen motsvarande utgångstid på server-side
  läsning (endast signerade URL:er, som VI väljer utgångstid för).
- **Kandidat (P29):** *Upload Attachment-API:t är kapat till 5 MB
  direkt-byte-uppladdning; större filer kräver URL-baserad attach.* Kostnad:
  samma relevans som ovan. v1-kompensation: ej tillämplig (samma skäl).
  Fas E-krav: Supabase Storage har ett separat, mycket högre tak (50 MB
  Free-plan-golv, upp till 500 GB Pro/Team) hanterat av vår egen
  bucket-konfiguration, inte en leverantörs fast API-gräns.

## Dom

**Grillningens val (delad hemvist: bytes i Supabase Storage, metadata i
basen) FÖRSTÄRKS av detta pass, inte falsifieras.** Varje sten som vändes —
Resends `path`-hämtning, Supabases service-role/signerad-URL-mönster, `pdf-lib`s
edge-kompatibilitet, Airtables 2-timmars-URL:er — pekar åt samma håll: bytes
hör hemma i Storage, inte i ett Airtable-attachment-fält.

**Den avgörande delfrågan var Delfråga 1.** Inte för att den ifrågasätter
hemvist-valet, utan för att den avtäcker att dagens SEND-kontrakt
([ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D2,
`/emails/batch` för ALLA sändningar) strukturellt inte kan bära bilagor —
tyst, utan felmeddelande, om man bara "la till en `attachments`-parameter"
på befintlig kod. Utskicks-arkitektur-ADR:n (S93 Del 3 beslut 4) måste
alltså inte bara byta mailto → riktiga server-sändningar, den måste **grena
sändvägen i två**: attachment-fri (batch, oförändrad) och attachment-bärande
(loopad singel-sändning, ny). Idempotens-, consent- och
suppression-mönstren från ADR-067 D4–D6 bär rakt över till den nya grenen
utan omdesign — bara sändmekaniken (`BatchSender` → en `SingleSender`-variant)
behöver en ny implementation vid sidan av den befintliga.

## Vad jag inte kunde belägga

- **Ingen körning gjordes mot den skarpa Supabase Edge Runtime-sandlådan.**
  Deno-CLI var inte tillgängligt i denna körmiljö; svensk-text-mätningen
  (Delfråga 3) kördes mot `pdf-lib` under Node som en medveten proxy,
  grundad i att biblioteket är runtime-agnostiskt rent JS utan native-
  beroenden (bekräftat av två oberoende förstapartskällor). Detta är inte
  samma sak som en direkt Supabase-körning, och `pdf-lib`s beteende
  SPECIFIKT inuti Supabases Edge Runtime-sandlåda (minne/CPU-gränser vid
  verklig belastning, kallstart-tid) är overifierat i detta pass.
- **`"WorkerRequestCancelled: request has been cancelled by supervisor"`**
  (GitHub-diskussion #19824) förblir oförklarad. Ingen rotorsak hittades i
  denna källa eller i vidare sökning inom passets tidsram — registreras som
  öppen risk, inte som ett löst känt beteende.
- **Vårt Airtable-abonnemang (Team-plan, 20 GB/bas, 5 GB/fil)** är citerat ur
  `tasks/lessons.md` (Session 19-kontext), inte live-verifierat mot
  Airtables egen konto-/faktureringssida i detta pass. Rimligt att lita på
  som sekundär intern källa, men inte förstahandsverifierat här.
- **Resends "50 GB" batch-relaterade siffror eller motsvarande för
  attachment-storlek specifikt vid `path`-baserad (Resend-hämtad) fjärrfil**
  är inte separat dokumenterade — endast det generella 40 MB/mail-efter-
  base64-taket hittades. Oklart om Resend tillämpar samma tak (efter egen
  hämtning + intern base64-kodning) eller ett annat vid `path`-baserad
  hämtning; ingen källa bekräftade skillnaden explicit.
- **`createSignedUploadUrl`s exakta giltighetstid** (2 timmar, enligt
  aggregerade sökträffar) kunde inte citeras direkt ur Supabases
  JavaScript-referenssida — den gav 404 vid direkt hämtning i detta pass
  (möjlig SPA-renderingsfråga i hämtningsverktyget, inte nödvändigtvis att
  sidan saknas). Siffran bör räknas som svagare belagd än övriga
  Supabase-fakta i detta dokument tills en direkt sidhämtning lyckas.
- **Precedent-rymden för PDF-generering är bred, inte tunn** (tre
  oberoende, namngivna edge/serverless-miljöer hittades: Cloudflare
  Workers, Deno, Supabase själv) — ingen deklaration av tunn rymd behövs
  här, till skillnad från vissa tidigare pass i detta repo.

## Rekommendation

Detta är en rekommendation, inte ett beslut — den kommande grillningen/ADR:n
äger valet. Alternativen är bokförda vid varje punkt.

1. **Behåll delad bilage-hemvist** (bytes i Supabase Storage, metadata +
   eventkoppling i en additiv `Bilagor`-tabell i basen), som redan kvitterat
   i grillningen. Alternativ som övervägdes och varför de faller: (a)
   Airtable-native attachment-fält som enda hemvist — faller på
   2-timmars-URL:er + 5 MB-direktuppladdningstak (Delfråga 4); (b) bytes
   direkt i basen som base64-textfält — aldrig seriöst övervägd, ingen
   leverantör i detta pass stödjer eller rekommenderar det, skulle sprängt
   Airtables formel-/API-längdgränser (P20 i `airtable-constraints.md`).
2. **Grena send-kontraktet i två sändvägar** vid ADR-067-revisionen:
   attachment-fri (dagens `/emails/batch`, oförändrad mekanik) och
   attachment-bärande (ny, loopad `/emails`-singelsändning, en mottagare per
   anrop, deterministisk `${jobId}/r${index}`-idempotensnyckel). Alternativ
   som övervägdes: (a) byta ALLA sändningar till singel-loop, även
   attachment-fria — avvisas, ingen anledning att ge upp batchens
   ~100x-genomströmningsfördel för sändningar som aldrig bär en bilaga; (b)
   vänta på att Resend adderar batch+attachments-stöd — inget datum eller
   commitment hittades för detta, och att bygga mot en ohärledd framtida
   API-yta är precis den sortens spekulation projektets
   över-engineering-vakt avvisar.
3. **Server-side Storage-läsning: signerad URL till Resends `path`-fält som
   förstahandsval, EF-side `.download()`+base64 som fallback.** Alternativ
   som övervägdes: EF-side download+base64 alltid — avvisas som
   förstahandsval eftersom det duplicerar en byte-runda Resend redan kan
   göra själv (Resend hämtar via `path`); behålls som fallback ifall
   Resends fjärrhämtning visar sig ha andra begränsningar vid skarp
   användning (se § Vad jag inte kunde belägga, `path`-storleksfrågan).
4. **PDF-generering: `pdf-lib` i Supabase Edge Functions**, byggd på
   `drawText`/koordinat-layout, inga externa tjänster. Alternativ som
   övervägdes: extern HTML-till-PDF-tjänst (Doppio, Browserless m.fl.) —
   avvisas som förstahandsval: extra leverantörsberoende + nätverkshopp för
   ett problem `pdf-lib` redan löser inom plattformen, men värt att hålla i
   minnet om mall-editorn (grillningens "senare"-punkt) kräver HTML/CSS-
   layout som `pdf-lib` strukturellt inte kan ge.
5. **Verifiera `pdf-lib` skarpt mot Supabase Edge Runtime** (inte bara
   Node-proxyn i detta pass) som första steg vid bygget, innan mer
   arkitektur läggs ovanpå antagandet. Billigt att stänga, öppnat här
   medvetet i stället för tyst antaget.

## Källförteckning

**Resend (förstaparts):**

- [Send Email API-referens](https://resend.com/docs/api-reference/emails/send-email) — attachment-form, `to`-max 50, Idempotency-Key
- [Send Batch Emails API-referens](https://resend.com/docs/api-reference/emails/send-batch-emails) — batch-storlek, attachments ej stödda
- [Attachments-dokumentation](https://resend.com/docs/dashboard/emails/attachments) — 40 MB-tak, batch-uteslutning
- [API-introduktion — rate limits](https://resend.com/docs/api-reference/introduction) — 10 req/s/team default
- [Idempotency Keys changelog](https://resend.com/changelog/idempotency-keys) — 24h-fönster, 409-semantik
- [API Rate Limit changelog](https://resend.com/changelog/api-rate-limit)

**Resend (tredjeparts, community-bekräftelse):**

- [`resend/resend-node#409`](https://github.com/resend/resend-node/issues/409) — tyst uteblivande bekräftat i praktiken

**Supabase (förstaparts):**

- [Storage — file limits](https://supabase.com/docs/guides/storage/uploads/file-limits) — globala storlekstak per plan
- [Storage — serving/downloads](https://supabase.com/docs/guides/storage/serving/downloads) — signerad URL + `.download()`
- [Storage — resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) — TUS, 6 MB-tröskel
- [Edge Functions — limits](https://supabase.com/docs/guides/functions/limits) — 256 MB minne, 2s CPU, 150/400s wall-clock
- [Edge Functions — auth](https://supabase.com/docs/guides/functions/auth) — service-role-mönster

**Supabase (community, egen org):**

- [`github.com/orgs/supabase/discussions/19824`](https://github.com/orgs/supabase/discussions/19824) — pdfmake i EF, `WorkerRequestCancelled`
- [`github.com/orgs/supabase/discussions/38327`](https://github.com/orgs/supabase/discussions/38327) — obesvarad, dokumenterar samma användningsfall

**PDF-generering (edge/serverless-precedent):**

- [pdf-lib.js.org](https://pdf-lib.js.org/) — officiell Deno-quickstart
- [PDF4.dev — PDF generation on Cloudflare Workers](https://pdf4.dev/blog/pdf-generation-cloudflare-workers) — workerd-kompatibilitet, layout-begränsning
- [Andrew Dillon — "How to Create and Modify PDF Files in Deno With pdf-lib", Medium](https://medium.com/swlh/how-to-create-and-modify-pdf-files-in-deno-ffaad7099b0)

**Airtable (förstaparts):**

- [Field model — multipleAttachment](https://airtable.com/developers/web/api/field-model#multipleattachment)
- [Upload attachment API](https://airtable.com/developers/web/api/upload-attachment) — 5 MB direktuppladdningstak
- [Attachment URL behavior](https://support.airtable.com/docs/airtable-attachment-url-behavior) — 2022-11-08, 2h-golv
- [Attachment field](https://support.airtable.com/docs/attachment-field) — 5 GB/fil, plan-lagringstak

**Interna källor:**

- [`supabase/functions/send-email/index.ts`](../../supabase/functions/send-email/index.ts)
- [`supabase/functions/_shared/resend-batch.ts`](../../supabase/functions/_shared/resend-batch.ts)
- [`supabase/functions/_shared/send-bulk.ts`](../../supabase/functions/_shared/send-bulk.ts)
- [`supabase/functions/create-admin-user/index.ts`](../../supabase/functions/create-admin-user/index.ts)
- [`src/data/adapters/DataSourceAdapter.ts`](../../src/data/adapters/DataSourceAdapter.ts)
- [`docs/decisions/ADR-067-bulk-mail-segment-send-kontrakt.md`](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)
- [`docs/decisions/ADR-057-lager-oberoende-fitness-invariant.md`](../decisions/ADR-057-lager-oberoende-fitness-invariant.md)
- [`docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
- [`docs/reference/data-model.md`](../reference/data-model.md) — rad ~973, ~998 (psionautics Storage-precedent)
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md)
- [`tasks/sessions/archive/2026-08/2026-08-02-session-93.md`](../../tasks/sessions/archive/2026-08/2026-08-02-session-93.md) Del 3 (grundare S93-dok; grenen `docs/s93-del3-konsolideringsgrillning` bär Del 3-innehållet)
- `tasks/lessons.md` rad ~2054 (Airtable Team-plan, sekundärkälla)
