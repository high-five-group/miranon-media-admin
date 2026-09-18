---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Mallväljare + mall-editor — kan Resend Templates bära steg 1, och vad bygger branschen för steg 2? (2026-09-18)

> **Proveniens:** avgränsat research-pass (marcus-system:research), kört
> OISOLERAT i huvudkatalogen (`main`, `7bc4c352`). Ingen kod ändrad, ingen
> commit gjord, inga git-kommandon som rör arbetsträdet.
>
> **Frågan:** kan Resends egna mallar (Templates — dashboard-editorn + REST-
> API:t) bära STEG 1 av en "mallväljare" i vår admin-app, och hur bygger
> branschledarna en inbäddad mall-editor för transaktionella utskick — så att
> vi kan välja väg för steg 2 (egen mall-editor-sida "lite som Resends") på
> källbelagd grund?

## Inventering FÖRE första sökningen — vad repot redan bar

`grep` över `docs/research/` och `docs/decisions/` för `resend|mall|template`
gav TRE relevanta ADR:er och FYRA relevanta research-pass. Alla fyra lästes i
sin helhet innan någon extern sökning gjordes.

- **[ADR-120](../decisions/ADR-120-e-postleverantoren-resend-medvetet-valt.md)
  (2026-08-19)** avgjorde REDAN leverantörsfrågan: Resend behålls medvetet
  (inte som arv), domänverifieringen (`miranon.dev` SPF/DKIM/DMARC) bär
  beslutet, och en nedskriven bytes-trigger finns (>~200 mottagare med
  bilaga, en andra tyst leverantörsbrist, ett funktionsbehov Resend saknar
  och en konkurrent har, eller att Resends "yet" om batch-bilagor infrias).
  **Detta pass byter INTE leverantör** — frågan här är om Resends
  Templates-funktion (en annan yta än sändvägen ADR-120 handlar om) kan bära
  mallväljarens steg 1, vilket är en NY fråga ADR-120 aldrig ställde.
- **[ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md) D9
  (2026-08-10)** delar redan dagens sändväg i TVÅ grenar: en bilage-fri
  batch-gren (`/emails/batch`, ≤100 mottagare/anrop) och en bilage-bärande
  loopad singel-gren (`/emails`, ett anrop per mottagare). Det är denna
  gren-uppdelning en flytt till Resend Templates måste RESPEKTERA, inte
  ersätta — se § Delfråga 1 och § Options-rymd steg 1.
- **[ADR-015](../decisions/ADR-015-send-email-direct-resend.md)
  (superseded)** slog fast att Lotta är **ensam användare** av mailfunktionen
  (~5–20 mail/dag på höga volymer). Det är relevant för steg 2: TipTap Clouds
  betalda realtidssamarbete (se § Delfråga 4) löser ett problem — flera
  redaktörer samtidigt — som vi högst sannolikt aldrig har.
- **`utskicks-bilage-arkitektur-2026-08-03.md`** och den research den byggde
  på fällde redan att Resends `/emails/batch` inte bär bilagor och att
  bristen är TYST (ingen felkod). Detta pass upprepar INTE den mätningen —
  den citeras, inte duplicerad.
- **`mall-ifyllnadsvyer-branschmonster-2026-08-21.md`** svarar på en
  ANNAN fråga (hur en användare FYLLER I en redan vald dokumentmall inför
  PDF-generering — GOV.UK Summary List-mönstret) och gäller PDF-bilagor
  (deltagarinformation/bekräftelsebilaga), inte e-postens brödtext. Ingen
  överlappning att komplettera.
- **`mottagar-preview-monster-2026-08-07.md`** svarar på hur MOTTAGARE
  förhandsvisas (pills/avatarer), inte hur MALLINNEHÅLLET förhandsvisas.
  Ingen överlappning.
- **`dokumentmallarnas-forlagor-2026-08-17.md`** gäller PDF-bilagornas
  Lotta-designade FÖRLAGOR (PowerPoint-original), en annan artefaktklass än
  e-postens brödtext.

**Kodläsning FÖRE sökning (samma disciplin):**
`src/components/segment/SegmentMailCompose.tsx` är det "utskicks-block" Marcus
syftar på — ett fritt `amne`+`mailtext`-par (`Input`+`TextArea`), inget
mall-koncept alls. `supabase/functions/_shared/action-mail-template.ts` visar
att appen REDAN har en egen, primitiv mall-mekanik: fem hårdkodade
platshållare (`{förnamn}`, `{event}`, `{datum}`, `{ort}`, `{deadline}`),
enkel-klammer-syntax, en server-side (`fillPlaceholders`) och en
klient-speglad (`AtgardsSida.tsx:459` `fyllPlatshallare`) implementation som
måste hållas manuellt i synk, och kontraktet "ofyllda platshållare lämnas
LITERALT, aldrig tyst blankade". Det är precis den sortens skuld en riktig
mallmotor (Resends eller egen) löser strukturellt.

**Inget i repot var åldrat** — allt ovan skrevs 2026-08-03–2026-08-21, och
inget av det berör Resend Templates-funktionen specifikt. Detta pass körs
alltså i full bredd på en genuint ny fråga, med befintlig arkitekturkunskap
(ADR-067 D9, ADR-015, ADR-120) som RAM, inte som duplicerat underlag.

---

## Kort svar (för Gunilla — utan tekniska förkunskaper)

Resend (företaget som skickar våra mail) har en egen funktion som heter
**Templates** ("mallar"): ett ställe i Resends webbgränssnitt där man skriver
en mall en gång — med luckor som `{{{FÖRNAMN}}}` som fylls i automatiskt per
mottagare — och sedan använder om och om igen. **Ja, den kan bära steg 1**,
men med tre praktiska hakar: (1) Resend har bara två roller för personer man
bjuder in — "Medlem" och "Admin" — och båda ser MER än bara mallar (alla
skickade mail, domän-inställningar, webhooks), så Lotta bör INTE logga in i
Resend själv; i stället väljer hon bland färdiga mallar i VÅR app, medan
Marcus/Code skapar och redigerar mallarna i Resend åt henne. (2) Resend har
INGEN egen "visa hur det ser ut"-funktion utan att skicka ett riktigt mail —
vi måste bygga en enkel förhandsvisning själva (fullt görbart, luck-syntaxen
är enkel och dokumenterad). (3) Bilagor (PDF:er) och Resends "skicka många
mail på en gång"-funktion (batch) går fortfarande INTE ihop — den regeln
(ADR-067) ändras inte av att mallar används.

För steg 2 (en egen mall-editor-sida "lite som Resends") är den STARKASTE
kandidaten `@react-email/editor` — en gratis (MIT-licensierad), öppen
byggsten som **Resend själva äger och underhåller**, byggd på **exakt samma
teknik** (TipTap/ProseMirror) som Resends EGEN mall-editor. Det betyder att
"se ut lite som Resends" inte bara blir en stilkopiering utan bokstavligen
kan bli samma sorts editor, fast vår egen — utan att någonsin betala Resend
eller en tredje part för det.

---

## Delfråga 1 — Resend Templates: exakt kontrakt

**Källor:** samtliga citat hämtade verbatim ur `resend.com/docs/…` 2026-09-18
via WebFetch (auktoritativ förstapartskälla), kompletterat av Resends egna
officiella Claude-skill-repo `github.com/resend/resend-skills` (paketerat av
Resend själva, inte en tredjepartstolkning).

### Livscykel: draft → published

> *"Editing a published template creates a new draft — the published version
> keeps sending until you publish again."* (`resend-skills` templates.md,
> speglar `resend.com/docs/dashboard/templates/version-history`, hämtat
> 2026-09-18)

Version-history-sidan bekräftar samma sak i egna ord: *"your changes are
saved as a draft"* och *"Reverting creates a new draft based on the selected
version's content, without affecting the published Template."* En mall måste
vara **published** för att kunna skickas — draft-mallar kan inte användas i
ett `send`-anrop.

### Variabelsyntax och typer

**Trippel-klammer**, inte dubbel: `{{{VARIABLE_NAME}}}`. Verbatim ur
create-template-referensen (hämtat 2026-09-18):

> *variables (array): Template variables, max 50 per template. Each variable
> object contains: key (required; cannot use FIRST_NAME, LAST_NAME, EMAIL,
> RESEND_UNSUBSCRIBE_URL, contact, or this), type ('string' | 'number'),
> fallback_value (optional; type must match).*

Endast plain substitution — **ingen** `{{#each}}`/`{{#if}}`-logik (till
skillnad från Handlebars-familjen Postmark/SendGrid/Mandrill använder, se
§ Delfråga 5). Dynamiska listor måste förrenderas server-side till EN
HTML-variabel.

**Diskrepans mätt, flaggad öppet:** den paketerade skill-referensen
(`resend-skills`) listar den reserverade listan som `FIRST_NAME · LAST_NAME ·
EMAIL · UNSUBSCRIBE_URL · RESEND_UNSUBSCRIBE_URL · contact · this` — sju
poster. Den LIVE create-template-sidan (hämtad 2026-09-18) nämner bara SEX:
`FIRST_NAME`, `LAST_NAME`, `EMAIL`, `RESEND_UNSUBSCRIBE_URL`, `contact`,
`this` — plain `UNSUBSCRIBE_URL` saknas. Den live-hämtade sidan är
auktoritativ här; skill-kopian är sannolikt en äldre ögonblicksbild. Skriv
INTE `UNSUBSCRIBE_URL` som en garanterat reserverad nyckel utan att
återverifiera mot den då-aktuella dokumentationen.

**Constraints** (create-template-referensen, hämtat 2026-09-18): max 50
variabler/mall, nyckel-tecken endast ASCII-bokstäver/siffror/understreck, max
50 tecken/nyckel, sträng-värde max 2 000 tecken, tal-värde max 2^53−1.

### Skicka via template-id

Verbatim (`send-email`-referensen, hämtat 2026-09-18):

> *"template (object): To send using a template, provide a template object
> with id and variables"* — `id` kan vara antingen det auto-genererade
> UUID:t eller en **alias** (en stabil, mänskligt läsbar slug satt vid
> skapande).

**Subject/from-överskrivning — BELAGT, verbatim:**

> *"When sending a template, the payload for `from`, `subject`, and
> `reply_to` take precedence over the template's defaults for these fields."*

Saknar mallen egna defaults för dessa fält MÅSTE de anges i sändningsanropet.
**Ömsesidigt uteslutande:** *"If a `template` is provided, you cannot send
`html`, `text`, or `react`"* — API:t avvisar det.

### Attachments + template — DELVIS BELAGT, en lucka kvarstår

Den fullständiga parameterlistan för `/emails` (enkel-send, hämtat
2026-09-18) innehåller BÅDE `attachments` (array, max 40 MB/mail efter
base64) OCH `template` (object) som separata, samtidigt dokumenterade fält.
**Ingen textrad på sidan förbjuder eller bekräftar explicit att de två
kombineras.** Detta är en genuin dokumentationslucka, inte en tolkning —
motsvarar ADR-120:s redan öppna fynd om `attachments.path`. Rekommendation:
mät skarpt (ADR-119-stil minimaltest) innan arkitekturen förutsätter att
kombinationen fungerar, snarare än att anta det.

**Vad SOM ÄR belagt, entydigt:** batch-ändpunkten (`/emails/batch`) stödjer
`template` som fält per rad (*"To send using a template, provide a template
object with: id … variables …"*, hämtat 2026-09-18) men **bär aldrig
attachments**, oavsett om raden är template-baserad eller html-baserad:
*"The `attachments` field is not supported yet."* Detta ändrar INGET i
ADR-067 D9:s gren-uppdelning — mallar byter BARA vad batch-anropets `html`-
fält ersätts med, inte batch-ändpunktens grundläggande bilage-begränsning.

### Idempotens

Samma `Idempotency-Key`-header som all annan sändning (24-timmarsfönster, max
256 tecken, samma nyckel+samma payload → samma svar, samma nyckel+ändrad
payload → `409`). Formatet skiljer sig inte för template-sändningar — det är
samma `/emails`- respektive `/emails/batch`-ändpunkt, bara ett annat
body-fält.

### Storlek/gränser, sammanställt

| Gräns | Värde | Källa |
|---|---|---|
| Max variabler/mall | 50 | create-template, hämtat 2026-09-18 |
| Max nyckel-längd | 50 tecken | samma |
| Max sträng-variabelvärde | 2 000 tecken | samma |
| Max batch-storlek | 100 mail/anrop | send-batch-emails, hämtat 2026-09-18 |
| Max lista-sida | 100 (default 20) | list-templates, hämtat 2026-09-18 |
| Max attachments | 40 MB/mail efter base64 | send-email, hämtat 2026-09-18 |
| Rate limit, default | **10 req/s per team** (mätt 2026-09-18) | api-reference/introduction |

**Mätning, inte antagande, om rate limit:** den paketerade
`resend-skills`-referensen anger *"default rate limit: 2 req/s"* i sin
felhanteringstabell. Den LIVE `api-reference/introduction`-sidan, hämtad
samma dag som detta pass, säger uttryckligen: *"The default maximum rate
limit is 10 requests per second per team."* Detta är en verklig, mätbar
diskrepans mellan en paketerad skill-kopia och Resends nuvarande live-
dokumentation — den senare vinner. Skriv aldrig vidare "2 req/s" utan att
återverifiera.

### SDK-metoder (fullständighet)

`create` · `get` · `list` (cursor-paginerad, `after`/`before`, ömsesidigt
uteslutande) · `update` (partiell) · `publish` · `duplicate` (kedjebar med
`.publish()`) · `remove` (**inte** `.delete()`). `get`-svaret (hämtat
2026-09-18, exempel-JSON) innehåller `html`, `text`, `variables`, `status`,
`alias`, `subject`, `from`, `current_version_id`, `has_unpublished_versions`
— alltså FULL brödtext, inte bara metadata.

---

## Delfråga 2 — kan Lotta nå editorn utan att bli "utvecklare"?

**Roller:** Resend har enligt sin egen dokumentation (`dashboard/settings/
team`, hämtat 2026-09-18) exakt **två** team-roller:

> *"Members have access to manage emails, domains and webhooks. Admins have
> all Member permissions plus the ability to invite users, update payments,
> and delete the team."*

**Det finns INGEN roll begränsad till bara mall-innehåll.** Den svagaste
rollen ("Member") ser fortfarande domän-DNS-konfiguration, webhooks och
sannolikt hela teamets sändningslogg — inte bara Lottas egna utskick. Om
"Member" specifikt kan se API-nycklar bekräftar dokumentationen INTE
uttryckligen (obelagt, se § Vad jag inte kunde belägga).

**Prissättning:** `resend.com/pricing` (hämtat 2026-09-18) nämner INGEN
per-seat-kostnad eller medlemsgräns på någon nivå — team-medlemskap kostar
alltså i sig ingenting extra, men risken ovan kvarstår oavsett pris.

**Djuplänk till en specifik mall:** BELAGT indirekt men konkret — Resends
egen officiella MCP-server-källkod (`github.com/resend/resend-mcp`,
klonad och läst 2026-09-18, senaste commit samma dag) accepterar och
dokumenterar URL-formen `https://resend.com/templates/<id>` som giltig
resurs-identifierare i flera verktygs input-scheman. Deep-linking till en
specifik mall i dashboarden fungerar alltså.

**Inbäddningsbar editor / editor-SDK för VÅR app:** Resends EGEN
dashboard-editor är INTE embeddbar i tredjepartsappar (den är
Resend-hostad, del av deras dashboard). Det som ÄR embeddbart är en helt
ANNAN, öppen komponent — `@react-email/editor` — se § Delfråga 4. Den
komponenten är byggd på SAMMA underliggande teknik (TipTap/ProseMirror) som
Resends dashboard-editor men är ett separat, MIT-licensierat projekt vi själva
skulle hosta.

**"Connect to editor"/samarbetsläge:** finns, men är riktat mot **AI-agenter
och utvecklarteam**, inte mot en icke-teknisk slutanvändare. Verbatim
(`resend.com/blog/ai-email-editor`, hämtat 2026-09-18): *"With the Resend MCP
server, you can give your own agent direct access to the visual editor…
real-time cursor support and presence indicators."* Källkoden
(`src/tools/editor.ts`, `connect-to-editor`-verktyget) bekräftar samma sak:
syftet är att visa en "agent-avatar" för mänskliga dashboard-användare medan
en AI-agent (t.ex. Code via Resends MCP) redigerar — inte ett flöde för
Lotta.

**Språkstöd i UI:** **OBELAGT.** Ingen av de granskade sidorna nämner
lokalisering/språkval, och ingen officiell källa om svenskt UI-stöd hittades.
Alla sidor som lästes var på engelska, men frånvaro av ett uttryckligt
"endast engelska"-påstående gör detta till en observation, inte ett belägg.

**Risken sammanfattad:** att ge Lotta ett Resend-konto (oavsett roll)
exponerar minst domän-/DNS-konfiguration, webhooks och en sändningslogg som
sannolikt omfattar HELA teamets trafik, inte bara hennes egna mail — en yta
som är betydligt bredare än "redigera en mall". Detta pekar mot **Options-B**
i § Options-rymd steg 1 nedan: Lotta väljer bland färdiga, publicerade mallar
i VÅR app; Marcus/Code sköter skapande/redigering i Resend (direkt eller via
MCP-editorn).

---

## Delfråga 3 — listning för en mallväljare

**Fält i `list`-svaret** (hämtat 2026-09-18, `list-templates`-referensen):
`id`, `name`, `status`, `published_at`, `created_at`, `updated_at`, `alias`.
**INTE** `variables`, `html` eller en preview-representation i list-svaret —
för det krävs ett separat `get`-anrop per mall (som DÄR ger `html`, `text`,
`variables` fullt ut, se § Delfråga 1).

**Paginering:** cursor-baserad, `limit` (default 20, max 100), `after`/
`before` (ömsesidigt uteslutande), `has_more`-flagga.

**Förhandsvisning UTAN att skicka — INGEN dokumenterad API-väg hittades.**
Den fullständiga listan över officiella Templates-ändpunkter är `create` ·
`get` · `list` · `update` · `publish` · `duplicate` · `remove` — INGET
`preview`/`render`-anrop. Detta är en **frånvaro**, inte ett bevisat
"finns inte": jag hittade ingen sådan ändpunkt i den officiella
API-referensen, men kan inte utesluta att en odokumenterad väg existerar (jfr
den odokumenterade `/api/agent/prompt`-ändpunkten MCP-servern använder, se
§ Delfråga 6). **Praktisk konsekvens:** en förhandsvisning i vår app måste
byggas själv — hämta mallens `html`/`text`/`variables` via `get`, och göra
{{{VAR}}}-substitutionen klient- eller serversidan med Resends egen,
enkla, dokumenterade regex-vänliga syntax. Det är en låg-kostnads-uppgift,
inte ett hinder.

**Rate limits:** se tabellen i § Delfråga 1 (10 req/s/team, default,
mätt 2026-09-18).

---

## Delfråga 4 — byggsubstrat för en egen mall-editor (steg 2)

**Metod:** varje kandidats licens, senaste release/aktivitet och output-form
verifierades mot GitHub REST-API:t (`api.github.com`) och npm-registrets
JSON-API (`registry.npmjs.org`) — INTE mot npmjs.com:s webbfrontend, som är
känt bot-skyddad (`.lycheeignore` rad 239 i detta repo bekräftar samma
mätning: 403 både med och utan Chrome-UA). Alla siffror nedan mättes
2026-09-18.

| Kandidat | Licens | Senaste aktivitet (mätt) | React-native | Output | Underhåll |
|---|---|---|---|---|---|
| **`@react-email/editor`** (Resend/react.email) | MIT | **v1.7.8, publicerad 2026-09-17** (npm registry); repo `pushed_at` 2026-09-17 | Ja | "Email-ready HTML" + text direkt, serialiserar även till React Email-komponenter | Förstaparts (Resend äger repot), 19 752 stars, 36 öppna issues |
| **Maily.to** (`@maily-to/core`+`render`) | MIT | Repo `pushed_at` 2026-08-28; `@maily-to/render` npm senast uppdaterad 23 jan 2026 | Ja (React/Next.js) | TipTap-JSON → eget renderingspaket (`@maily-to/render`) → HTML | Tredjepart (en utvecklare), 3 962 stars, 5 öppna issues |
| **Unlayer** (`react-email-editor`) | MIT (wrapper) | Repo `pushed_at` 2026-09-16 | Ja (iframe-wrapper) | HTML+JSON via `exportHtml()` | Wrapper är öppen, men SELVA editorn är Unlayers hostade SaaS — kräver konto, export-krediter kostar över viss volym |
| **GrapesJS** + `grapesjs-mjml` | BSD-3-Clause | Repo `pushed_at` 2026-08-26 | Nej (kräver `@grapesjs/react`-wrapper) | MJML → e-postsäker HTML via plugin | Störst community (26 248 stars), 41 öppna issues, ramverks-agnostiskt (bredare scope än email) |
| **Easy Email** (`zalify/easy-email-editor`) | MIT | Repo `pushed_at` 2026-08-13 | Ja | MJML-baserad drag-and-drop → HTML | Aktivt, 3 063 stars, 30 öppna issues |
| **Novel** (`steven-tey/novel`) | Apache-2.0 | Repo `pushed_at` **2025-01-18** — ~20 månader gammal | Ja | Generell TipTap-baserad HTML, INTE e-postsäkert fokus | **Förkastas: inaktiv** |
| **BlockNote** | MPL-2.0 (kärna/`react`), GPL-3.0 (`xl-*`-paket) | Repo `pushed_at` 2026-09-17 | Ja | JSON ↔ Markdown ↔ HTML, generellt block-format | Aktivt (10 192 stars), men INTE email-specifikt — inget garanterat e-postsäkert HTML-läge |
| **Plate** (`udecode/plate`) | MIT | Repo `pushed_at` 2026-09-17 | Ja | HTML-serialisering, generellt rich-text-ramverk | Aktivt (16 599 stars), INTE email-specifikt |

**TipTap/ProseMirror-substratet i grunden:** kärnan (`ueberdosis/tiptap`) är
**MIT-licensierad och gratis** (`tiptap.dev/pricing`, hämtat 2026-09-18:
*"The Tiptap Editor is open source (MIT) and free. Only platform features
and cloud documents are priced."*). Realtidssamarbete, molnbaserad
versionshistorik och kommentarer är BETALDA plattformsfunktioner, från 59
USD/mån (Start-nivån) och uppåt. Eftersom Lotta är **ensam användare** av
mailfunktionen (`ADR-015`) är det högst sannolikt att vi ALDRIG behöver
TipTap Clouds betalda realtidssamarbete — en enanvändar-editor med egen,
enkel versionshistorik (lagrad i vår egen databas/Airtable) räcker.

**Tillgänglighet:** TipTap har en dedikerad, officiell
tillgänglighetsguide (`tiptap.dev/docs/guides/accessibility`, hämtat
2026-09-18) och sedan v2.9 ett default `role="textbox"` för
skärmläsar-/tangentbordsstöd. Ingen av de andra kandidaterna (GrapesJS,
Unlayer, Easy Email) hade en jämförbar, namngiven tillgänglighetssida i
sökningarna — detta är INTE ett belägg på att de saknar
tangentbordsstöd, bara att jag inte hittade en motsvarande officiell
dokumentationssida för dem. Flaggat, inte gissat.

**E-postsäker HTML vs. eget renderingssteg:**

- Producerar direkt e-postsäker HTML **utan** separat renderingssteg:
  `@react-email/editor` (serialiserar direkt till "email-ready HTML"),
  Unlayer, Easy Email (MJML-baserad).
- Kräver ett **eget, medföljande** renderingssteg: Maily.to
  (TipTap-JSON → `@maily-to/render`), GrapesJS-MJML (kompileringssteg via
  MJML), BlockNote/Plate/Novel (generella HTML-serialiserare, INGEN garanti
  om Outlook/Gmail-tabell-layout-kompatibilitet — kräver egen
  e-postsäkerhets-lösning ovanpå).

**Slutsats för delfråga 4:** `@react-email/editor` är den enda kandidaten
som är BÅDE (a) första-parts underhållen av samma bolag som äger
sändvägen, (b) byggd på samma substrat som Resends egen editor ("se ut lite
som Resends" blir bokstavligt görbart), (c) fri från extern SaaS-
beroende/kostnad, och (d) producerar e-postsäker HTML direkt. Maily.to är
den starkaste tvåan om vi vill ha mer färdigbyggd transaktionell
variabel-/villkorslogik ("Show If Condition") på bekostnad av att vara
tredjeparts-underhållen med ett mindre community.

---

## Delfråga 5 — precedent hos branschledare

**Metod och tillförlitlighet, öppet redovisad:** Resend, Postmark och
SendGrid citeras nedan mot direkt hämtade, verbatim primärkällor. **Loops och
Customer.io kunde INTE hämtas direkt** (Loops docs-URL gav 404 vid direkt
WebFetch-försök, Customer.io redirectade till en URL som också gav 404) —
deras rader nedan bygger på WebSearch-syntes av flera sökträffar, en SVAGARE
källklass än en direkt sidhämtning. Flaggat konsekvent i tabellen.
Mailchimp Transactional (Mandrill) och Brevo citeras mot en blandning av
direkt hämtning och sök-syntes, specificerat per rad.

| Leverantör | Mall-modell | Variabler | Version/utkast | Förhandsvisning m. testdata | Testutskick | Källa/tillförlitlighet |
|---|---|---|---|---|---|---|
| **Resend** | draft→published, en aktiv version | `{{{VAR}}}`, typ+fallback, INGEN logik | full versionshistorik, redigering av published skapar ny draft | **Ingen dokumenterad API-väg** (se § Delfråga 3) | Test-läge (`RESEND_TEST_API_KEY`), simulerar leverans/bounce | Direkt hämtat, förstaparts |
| **Postmark** | Template + separat Layout-koncept (delade header/footer) | Mustache-liknande `{{var}}`, `TemplateModel`-objekt | version via API, "Templates FAQ" | **JA** — egen test-variabel-editor som live-uppdaterar preview | Ja (via dashboard) | Direkt hämtat (`templates-api`), förstaparts + sök-syntes för layouts |
| **SendGrid** (Dynamic Templates) | Template med FLERA namngivna versioner, en `active` | Handlebars **med** loop/villkor (`{{#each}}`, `{{#if}}`) — mer uttrycksfullt än Resend | flera versioner, "Make Active" väljer levande | JSON-testdata i `dynamic_template_data`, Design/Code-editor-preview | Ja (dashboard "Send Test") | Direkt hämtat (Twilio/SendGrid docs), förstaparts |
| **Brevo** | Design-flik, visuell byggare ELLER egen HTML | `{{params.variableName}}` | "Save and Activate" | **JA** — dedikerad `POST /preview-smtp-email-templates`-ändpunkt som returnerar renderad HTML | Ja, dedikerad `send-test-template`-ändpunkt, max 50 test-mail/dag | Sök-syntes av `developers.brevo.com`-sidor, ej direkt WebFetch (fick 404 på gissad URL) |
| **Mailchimp Transactional (Mandrill)** | Template med `code` (HTML) | Handlebars, öppen `mailchimp/mandrill`-merge-språk ELLER Handlebars | export från Mailchimp-huvudkonto till Mandrill | Ej verifierat i detta pass | Ej verifierat i detta pass | Sök-syntes |
| **Loops** | Editor ELLER MJML-import | "Data variables", markerbara som valfria | Ej djupgranskat | Ej verifierat i detta pass | Ej verifierat i detta pass | Sök-syntes ENDAST (direkt hämtning misslyckades) |
| **Customer.io** | Ej djupgranskat denna pass | Fusion/Liquid (KÄNT från allmän branschkunskap, EJ verifierat i detta pass mot primärkälla) | Ej verifierat | Ej verifierat | Ej verifierat | **Ingen sida gick att hämta — raden är i praktiken obelagd** |

### Attachments ↔ mall-koppling, per leverantör

- **Postmark:** BELAGT verbatim — `/email/withTemplate/`-ändpunkten listar
  `Attachments` (array) som ett fullt dokumenterat parameter-fält i SAMMA
  tabell som `TemplateId`/`TemplateModel` (hämtat 2026-09-18). Postmark är
  alltså en leverantör där mall + bilaga går ihop på den vanliga
  send-ändpunkten, utan reservation.
- **SendGrid:** INDIKERAT, INTE verbatim-bekräftat. Sök-syntesen pekar mot
  att `attachments` och `dynamic_template_id` kan samexistera i samma
  `/v3/mail/send`-anrop (de är separata top-level-fält utan dokumenterat
  ömsesidigt uteslutande), men jag hittade ingen förstaparts-mening som
  uttryckligen säger det — till skillnad från Postmarks tydliga tabellrad.
  Svagare belägg, flaggat.
- **Resend:** se § Delfråga 1 — samma dokumentationslucka som ovan, på
  enkel-send-ändpunkten; garanterat FRÅNVARANDE på batch-ändpunkten oavsett
  mall eller ej.
- **Brevo, Mailchimp Transactional, Loops, Customer.io:** ej undersökt i
  detta pass utöver vad tabellen ovan visar.

### Den specifika frågan: "mallen bär per-mottagare-genererade PDF-bilagor"

**Ingen av de sex undersökta leverantörerna dokumenterar en mall-nivå-
mekanik för PER-MOTTAGARE-UNIK, dynamiskt genererad bilaga** (t.ex. ett
kvitto eller en bekräftelse-PDF som skiljer sig mellan mottagare). I samtliga
fall är bilagan ett fält CALLERN sätter per sändningsanrop — leverantören
kopplar aldrig ihop "denna mall" med "generera och bifoga denna specifika
fil". Det är alltså **applikationsnivå-orkestrering hos oss**, inte en
leverantörsfunktion, i samtliga granskade fall. Detta bekräftar (river inte)
ADR-067 D9:s befintliga design: sändvägen grenas hos OSS, inte hos Resend —
och samma mönster hade gällt oavsett vilken av de sex leverantörerna vi
använt. **Detta är frånvaro av bevis korrekt redovisad, inte ett påstått
"finns inte"** — jag har inte uttömt varje leverantörs fullständiga
API-yta, bara deras huvuddokumenterade send-med-mall-flöden.

---

## Delfråga 6 — portabilitet och inlåsning

**Vad som ÄR exporterbart, belagt:** varje malls `html`, `text`, `subject`,
`from`, `reply_to` och `variables`-lista är hämtbara i klartext via det
publika, dokumenterade `GET /templates/{id}`-anropet (se § Delfråga 1,
exempel-JSON verifierat 2026-09-18). Ett leverantörsbyte kostar alltså
INTE mallinnehållet — det går att skripta ut varje mall som HTML+text+
variabel-lista och mappa in i valfri annan leverantörs format (Handlebars-
konvertering av `{{{VAR}}}` → `{{var}}` är ett rakt textbyte).

**Vad som INTE är exporterbart via publikt, dokumenterat API:** Resends
EGEN dashboard-editor lagrar mallens redigerbara struktur som **TipTap-JSON**
— bekräftat direkt i Resends officiella MCP-serverkällkod
(`github.com/resend/resend-mcp`, `src/tools/editor.ts`,
`src/lib/dashboard-client.ts`, klonad och läst 2026-09-18): verktyget
`get-tiptap-json-content` hämtar denna representation, men gör det mot
`${dashboardUrl}/api/agent/prompt` — en ändpunkt som INTE finns i den
officiella, publika API-referensen (`resend.com/docs/api-reference/…`).
Den är alltså **använd men odokumenterad**: ett giltigt, mätt faktum om hur
Resends EGEN MCP-integration fungerar idag, men INTE ett stabilt,
supporterat kontrakt att bygga en migrationsväg på. Skillnaden mot `html`/
`text`-fälten (som ÄR del av det officiella, versionerade API:t) är
avgörande.

**Jämförelse "mallar hos leverantören" vs. "mallar hos oss":**

| Modell | Fördelar | Nackdelar |
|---|---|---|
| **Mallar bor i Resend** (steg 1-vägen) | Lotta (eller Marcus/Code) redigerar i ett färdigt, versionsspårat gränssnitt utan eget bygge; variabel-substitution sker leverantörssidan | Redigerbar STRUKTUR (TipTap-JSON) är inlåst bakom ett odokumenterat API; ett byte kräver att man extraherar `html` och accepterar att den redigerbara formen går förlorad, bara den FÄRDIGA HTML:en följer med |
| **Mallar bor hos oss, leverantören får färdig HTML** (dagens arkitektur + steg 2) | Full portabilitet — mallens KÄLLA (t.ex. TipTap-JSON från en egen `@react-email/editor`) och den RENDERADE HTML:en ägs båda av oss; leverantörsbyte rör bara sändvägen, aldrig mallinnehållet | Vi bär hela byggkostnaden och underhållskostnaden för editorn själva (se § Delfråga 4) |

Detta är exakt den avvägning Marcus egna ord antyder ("steg 1 … använda
mallarna i Resend … steg 2 … en helt ny sida som är en mall-editor"): steg 1
accepterar den smalare inlåsningen mot Resends UI-editor för snabb leverans;
steg 2 tar tillbaka ägarskapet över mall-KÄLLAN (inte bara den slutliga
HTML:en) genom en egen, TipTap-baserad editor — och kan då välja att antingen
fortsätta skicka via Resend Templates ELLER via ren `html`, utan att någon
gång vara beroende av Resends odokumenterade `/api/agent/prompt`.

---

## Delfråga 7 — datamodell-skiss som GOLV (inte design)

Syntetiserat ur de granskade leverantörernas gemensamma fältmängd (Resend,
Postmark, SendGrid, Brevo — de fyra med direkt verifierade scheman) plus
appens EGNA, redan byggda kontrakt (ADR-067 D9, `action-mail-template.ts`).
**Detta är inte ett förslag på vår tabellstruktur** — det är golvet varje
granskad leverantör redan bygger på, som en framtida ADR måste förhålla sig
till, inte uppfinna på nytt.

| Fält | Finns hos | Vår motsvarighet idag |
|---|---|---|
| Namn (visningsnamn) | Alla fyra | — (saknas: `amne`/`mailtext` är anonyma) |
| Stabil identifierare/alias | Resend, Postmark, SendGrid, Brevo | — |
| Ämne (kan bära variabler) | Alla fyra | `amne`-fältet, fritext |
| Brödtext/struktur (HTML + text-fallback) | Alla fyra | `mailtext` → `html`/`text` deriveras (D8) |
| Variabeldeklaration (nyckel, typ, fallback/valfri) | Alla fyra | Fem hårdkodade platshållare, INGEN deklaration — hela poängen med en mallmotor |
| Status (draft/published, eller version med `active`-flagga) | Alla fyra | Saknas helt |
| Version/historik | Alla fyra | Saknas helt |
| **Bilageregler** (statisk fil vs. per-mottagare-genererad PDF, se § Delfråga 5) | **Ingen** leverantör — vår egen domän | ADR-067 D9:s gren (bilage-fri/bilage-bärande) — MÅSTE kopplas till mallen, inte bara till sändvägen |
| **Målgrupp/åtgärdstyp** (segment-bulk vs. de fyra event-bundna åtgärdstyperna) | **Ingen** leverantör — vår egen domän | Styr idag vilken EF (`send-bulk` vs. `send-action-email`) och vilka platshållare som är tillgängliga |

De två sista raderna är repots EGNA tillägg ovanpå leverantörsgolvet — ingen
av de sex undersökta leverantörerna modellerar "vilken sändväg" eller
"vilken bilaga" som en del av mall-objektet, eftersom ingen av dem bygger
bilagor in i mall-konceptet alls (se § Delfråga 5).

---

## Options-rymd

### Steg 1 — mallväljare via Resend Templates

| Option | Beskrivning | Kostnad | Risk |
|---|---|---|---|
| **A — Lotta i Resend direkt** | Lotta får ett Resend-konto (Member), redigerar mallar i Resends dashboard själv | Lägst utvecklingskostnad (mest av jobbet är Resends UI) | **Hög**: exponerar domän/DNS, webhooks, hela teamets sändningslogg — se § Delfråga 2. Motsäger "Gunilla-principen" (Resends UI är inte byggt för en icke-teknisk slutanvändare, och risken är inte bara begriplighet utan faktisk data-exponering |
| **B — Lotta väljer, Marcus/Code redigerar** (bäst matchar Marcus formulering "skapa nya mallar där … länka dit") | Vår app visar en Mallväljare (`templates.list()`, filtrerad på `published`); Marcus/Code skapar/redigerar mallar i Resend (dashboard eller MCP:s TipTap-editor-verktyg) | Låg-till-medel: kräver att send-bulk.ts/send-action-email.ts bygger om body-komposition till `template:{id,variables}`, samt en egen förhandsvisnings-vy (ingen Resend-API för det, se § Delfråga 3) | **Låg**: ingen extern dashboard-exponering för Lotta. Kvarvarande risk: attachments+template-kombinationen på enkel-send är obelagd (§ Delfråga 1) — måste mätas skarpt innan bilage-bärande mallar (bekräftelse/deltagarinfo) flyttas hit |
| **C — Endast prefill, ingen live-koppling** | Mallväljaren hämtar `html`/`text`/`subject` en gång och SKRIVER IN i dagens fria `amne`/`mailtext`-fält; sändningen förblir ren `html`, `template`-objektet används aldrig | Lägst risk (rör inte sändkontraktet alls) | Ger minst värde — ingen variabel-substitution vid sändtillfället, ingen versionsspårning, "mallväljaren" blir bara "kopiera text en gång" — svarar sämst mot Marcus vision |

**Oavsett option A/B/C:** ADR-067 D9:s tvåvägs-gren (bilage-fri batch /
bilage-bärande loop) består oförändrad. Mallar byter ENDAST vad som fyller
`html`/`template`-fältet i ett redan existerande anrop, inte vilket anrop
som görs.

### Steg 2 — egen mall-editor-sida

| Option | Beskrivning | Kostnad | Risk |
|---|---|---|---|
| **`@react-email/editor`** (rekommenderas utredas vidare) | Bädda in Resends/React Emails egen open-source editor-komponent i en ny sida i vår app | Medel: paketet är nytt (`1.7.8`, sedan igår) — API:t kan fortfarande röra sig; kräver eget backend för att spara/versionera TipTap-JSON (vi ARM egna versions-/status-fält, se § Delfråga 7) | Lägst av steg-2-alternativen: MIT, förstaparts, samma substrat som Resends UI, ingen extern SaaS-beroende. Omoget-risk pga färsk release |
| **Maily.to** | Bädda in `@maily-to/core`+`render` | Medel: mer färdig variabel-/villkorslogik för transaktionella mönster | Medel: tredjeparts, mindre community, separat renderingssteg att underhålla |
| **GrapesJS + grapesjs-mjml** | Generellt sidbyggarramverk + MJML-preset | Högre: kräver `@grapesjs/react`-wrapper, MJML-kompileringssteg, bredare API-yta än vi behöver | Lägst underhålls-/upphör-risk (störst, äldst community) men störst integrationskostnad för vårt smala scope |
| **Unlayer** | Iframe-inbäddad hosted SaaS-editor | Låg utvecklingskostnad, men LÖPANDE kostnad (export-krediter över viss volym) | Externt SaaS-beroende — data/rendering hos en TREDJE leverantör utöver Resend, motsäger principen om att hålla data hos valda leverantörer |
| **Easy Email** | MJML-baserad drag-and-drop | Medel | Medel — mindre dokumentation/community än GrapesJS, ursprung delvis kinesiskspråkigt, bör verifieras djupare innan val |
| **Novel / BlockNote / Plate** | Generella rich-text/block-editorer | Novel: FÖRKASTAS (inaktiv sedan 2025-01-18). BlockNote/Plate: aktiva men kräver EGET arbete för att garantera e-postsäker HTML | Högre — ingen av de tre är byggd för e-postens table-layout-begränsningar; vi bär hela det ansvaret själva |

**Rekommenderad utredningsordning om Marcus vill gå vidare med steg 2:**
`@react-email/editor` FÖRST (minimaltest: 1 fält, embed i en isolerad
prototyp-route, per CLAUDE.md:s "testa alltid nytt bibliotek med minimalt
test innan full implementation") — falerar det av omognadsskäl, Maily.to som
näst bästa TipTap-baserade kandidat.

---

## Vad jag inte kunde belägga

1. **Attachments + `template` på Resends enkel-send-ändpunkt (`/emails`).**
   Dokumentationen listar båda fälten men uttalar sig aldrig om samspelet.
   Kräver ett skarpt minimaltest (ADR-119-stil), inte antagande.
2. **`attachments.path` som fjärr-URL-hämtning** — redan känd öppen fråga
   från ADR-120, fortsatt obelagd idag.
3. **Om "Member"-rollen specifikt kan se API-nycklar** i Resend-dashboarden.
   Dokumentationen säger "manage emails, domains and webhooks" utan att
   nämna nycklar explicit.
4. **Resend-dashboardens språkstöd** (svenska eller endast engelska). Ingen
   källa hittades i någondera riktningen.
5. **Om Templates-funktionen är låst till vissa betalplaner.** Pricing-sidan
   nämnde ingen sådan begränsning, men uttalade sig heller inte uttryckligen
   om att den är fri på ALLA nivåer.
6. **Loops.so och Customer.io:s fulla mall-kontrakt** — direkt sidhämtning
   misslyckades för båda (404/redirect-404); raderna i § Delfråga 5 bygger på
   svagare sök-syntes, inte verbatim-citat.
7. **SendGrid dynamic templates + attachments i samma anrop** — indikerat av
   fältens oberoende existens, men ingen förstaparts-mening bekräftar det
   uttryckligen (till skillnad från Postmarks tydliga tabellrad).
8. **Stabiliteten hos Resends `/api/agent/prompt`-ändpunkt** — bevisligen
   ANVÄND (av Resends egen MCP-server) men INTE del av det dokumenterade,
   versionerade publika API:t. Byggs en migrationsväg på den är den byggd på
   ett kontrakt Resend inte lovat att hålla stabilt.
9. **TipTap-tillgänglighetsläget hos GrapesJS/Unlayer/Easy Email** — ingen
   motsvarande officiell tillgänglighetssida hittades för dessa tre; det är
   frånvaro av hittat belägg, inte ett bevis på avsaknad.
10. **Skarpt bevis att Resends dashboard-editor FAKTISKT renderar TipTap
    JSON till exakt samma HTML `@react-email/editor` skulle producera.** De
    delar substrat (TipTap/ProseMirror) enligt källkoden, men ingen källa
    bekräftar att de två implementationernas SERIALISERING är identisk eller
    utbytbar rakt av.

---

## Dom

**Steg 1 är görbart med Resend Templates, i Options-B-formen** (Lotta väljer
i vår app, Marcus/Code äger Resend-sidan) — det matchar Marcus egen
formulering ("skapa nya mallar där och använda dem/länka dit") bäst, undviker
Delfråga 2:s dashboard-exponeringsrisk, och rör inte ADR-067 D9:s redan
avgjorda bilage-gren. Den enda tekniska osäkerheten (attachments+template på
enkel-send) är mätbar med ett minimaltest innan bygget påbörjas, inte en
blockerare.

**Steg 2:s starkaste källbelagda kandidat är `@react-email/editor`** —
första-parts, MIT, samma substrat som Resends egen editor, färskast
underhållen av samtliga åtta granskade alternativ, och producerar e-postsäker
HTML utan separat renderingssteg. Detta är en dom om VILKET substrat som är
starkast källbelagt, inte en order att bygga — se § Rekommendation.

## Rekommendation (REKOMMENDATION, inte beslut)

1. **Steg 1:** bygg mallväljaren mot Option B. Innan send-bulk.ts/
   send-action-email.ts byggs om: kör ett skarpt minimaltest av
   attachments+template på `/emails` (obelagd punkt 1 ovan) — det avgör om
   den bilage-bärande grenen (ADR-067 D9) kan använda `template` eller måste
   fortsätta bygga `html` själv för just de mallarna.
2. **Steg 2, om/när Marcus vill gå vidare:** utred `@react-email/editor`
   FÖRST med ett minimalt inbäddnings-test (en route, ett fält, spara till en
   egen `Mallar`-tabell) innan något större bygge planeras — paketets
   omognad (v1.7.8, dagsfärsk) är en reell risk att pröva konkret, inte bara
   läsa om.
3. **Skriv ett ADR** för mallvalet innan steg 1 börjar landa kod — tre
   villkor håller: leverantörsvalet för mallar är svårt att återställa i
   koherens (send-kontraktet + UI byggs ovanpå det), det är överraskande att
   mallens KÄLLA (inte bara HTML:en) förblir hos Resend tills steg 2, och tre
   alternativ (A/B/C) vägdes mot varandra med konkreta skäl.
4. Detta pass beslutar ingenting om DATAMODELLEN i § Delfråga 7 utöver att
   ange golvet — en egen mall-tabell (Airtable eller Supabase) kräver sin
   egen grillning innan fälten låses.

---

## Källförteckning

Samtliga URL:er hämtade 2026-09-18 om inget annat anges.

**Resend, förstaparts:**

- <https://resend.com/docs/api-reference/emails/send-email>
- <https://resend.com/docs/api-reference/emails/send-batch-emails>
- <https://resend.com/docs/api-reference/templates/create-template>
- <https://resend.com/docs/api-reference/templates/get-template>
- <https://resend.com/docs/api-reference/templates/list-templates>
- <https://resend.com/docs/api-reference/templates/update-template>
- <https://resend.com/docs/api-reference/templates/publish-template>
- <https://resend.com/docs/api-reference/introduction>
- <https://resend.com/docs/dashboard/emails/attachments>
- <https://resend.com/docs/dashboard/templates/introduction>
- <https://resend.com/docs/dashboard/templates/version-history>
- <https://resend.com/docs/dashboard/settings/team>
- <https://resend.com/pricing>
- <https://resend.com/features/templates>
- <https://resend.com/blog/introducing-templates>
- <https://resend.com/blog/ai-email-editor>
- <https://resend.com/changelog/introducing-the-new-email-editor>
- <https://github.com/resend/resend-mcp> (klonad lokalt, källkod läst direkt —
  `src/tools/editor.ts`, `src/tools/templates.ts`, `src/tools/broadcasts.ts`,
  `src/lib/dashboard-client.ts`; commit `e6f9faa`, 2026-09-14)
- <https://github.com/resend/resend-skills> (Resends egna paketerade
  skill-dokumentation, `skills/resend/references/templates.md`)

**React Email / steg 2-substrat, förstaparts eller MIT-licensierat
open-source:**

- <https://react.email/docs/editor/overview>
- <https://github.com/resend/react-email> (license MIT, `pushed_at`
  2026-09-17, 19 752 stars, 36 öppna issues — verifierat via GitHub REST-API)
- `registry.npmjs.org/@react-email/editor` (npm registry JSON-API, INTE
  `www.npmjs.com` som är känt bot-skyddad — se `.lycheeignore` rad 239 i
  detta repo; v1.7.8 publicerad 2026-09-17T18:39:35Z)
- <https://tiptap.dev/pricing>
- <https://tiptap.dev/docs/guides/accessibility>
- <https://github.com/arikchakma/maily.to> (MIT, `pushed_at` 2026-08-28)
- <https://github.com/unlayer/react-email-editor> (MIT wrapper, `pushed_at`
  2026-09-16)
- <https://unlayer.com/pricing>
- <https://github.com/GrapesJS/grapesjs> (BSD-3-Clause, `pushed_at`
  2026-08-26, 26 248 stars)
- <https://github.com/steven-tey/novel> (Apache-2.0, `pushed_at`
  **2025-01-18** — inaktiv)
- <https://github.com/TypeCellOS/BlockNote> (MPL-2.0/GPL-3.0, `pushed_at`
  2026-09-17)
- <https://github.com/udecode/plate> (MIT, `pushed_at` 2026-09-17)
- <https://github.com/zalify/easy-email-editor> (MIT, `pushed_at`
  2026-08-13)

**Precedent, transaktionella mall-leverantörer:**

- <https://postmarkapp.com/developer/api/templates-api> (direkt hämtat)
- <https://www.twilio.com/docs/sendgrid/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates>
  (direkt hämtat)
- <https://developers.brevo.com/reference/post-preview-smtp-email-templates>,
  <https://developers.brevo.com/reference/send-test-template> (sök-syntes,
  ej direkt hämtat verbatim)
- <https://mailchimp.com/developer/transactional/docs/templates-dynamic-content/>
  (sök-syntes)
- <https://loops.so/docs/transactional> (sök-syntes, direkt hämtning
  misslyckades — 404)
- Customer.io: ingen sida gick att hämta; ingen URL citeras som belagd källa

**Internt (detta repo), lästa som ram/kontext:**

- [ADR-120](../decisions/ADR-120-e-postleverantoren-resend-medvetet-valt.md)
- [ADR-067](../decisions/ADR-067-bulk-mail-segment-send-kontrakt.md)
- [ADR-015](../decisions/ADR-015-send-email-direct-resend.md)
- [`utskicks-bilage-arkitektur-2026-08-03.md`](utskicks-bilage-arkitektur-2026-08-03.md)
- [`mall-ifyllnadsvyer-branschmonster-2026-08-21.md`](mall-ifyllnadsvyer-branschmonster-2026-08-21.md)
- [`mottagar-preview-monster-2026-08-07.md`](mottagar-preview-monster-2026-08-07.md)
- [`dokumentmallarnas-forlagor-2026-08-17.md`](dokumentmallarnas-forlagor-2026-08-17.md)
- `src/components/segment/SegmentMailCompose.tsx`
- `supabase/functions/_shared/action-mail-template.ts`
