---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: stable
---

# Publik filuppladdning i kontaktformuläret — hotbild, kontroller och Supabase-lösning för nya miranon.se (Code, 2026-09-19)

> **Proveniens:** avgränsat research-pass (bakgrundsagent, Session 128), kört
> **oisolerat** i worktreen `s128-docs` (gren `docs/s128-fodelse`). Beställt av
> orkestreraren som ett direkt uppföljningspass till
> [`publik-anmalningsvag-utan-inloggning-2026-09-19.md`](publik-anmalningsvag-utan-inloggning-2026-09-19.md)
> (samma dag, samma session) — den publika skrivvägen (honeypot + tidsfälla +
> ALTCHA, Postgres-inkorg, `ADR-129`s jobbmotor) är redan researchad och
> beslutad av det passet; DENNA fråga hakar i samma väg, bygger ingen
> parallell. Ingen produktionskod eller -data rörd — läsning av repot +
> webbforskning + Supabase-dokumentation via context7, plus denna fil. Inga
> Edge Functions anropade, ingen bucket skapad, ingen bas skriven till.

---

## Kort svar

**Domen:** dagens Elfsight-kontaktformulär (upp till 100 MB, ingen typkontroll
bortom vad webbläsarens `<input>` råkar visa) är en risk-yta vi ärver om vi
kopierar den rakt av. Den branschledande, säkra och tillgängliga lösningen är
**inte** att bygga en ny mekanism — det är att **återanvända Miranon Medias
egen, redan byggda och skarpt bevisade mönster** för bilage-uppladdning
(`create-attachment-upload-ticket` → klient PUT direkt mot Supabase Storage →
`finalize-attachment-upload`, `TASK-146.4` mönster 2) och göra tre
riktade tillägg: (1) en **NY, isolerad, privat bucket** skild från den
betrodda `bilagor`-bucketen (annan blast radius, annan livslängd, annan
typ-allowlist), (2) **server-side bild-sanering genom omkodning** (stripper
EXIF/GPS och neutraliserar de flesta payload-klasser i samma steg — OWASP:s
egen rekommendation, se § 1) i stället för att lita på klientens filtyp, och
(3) samma bot-/rate limit-grindar som `publik-anmalningsvag`-passet redan
designat för formuläret i stort, eftersom en filuppladdning utan skydd bara
är en ANNAN väg in till samma DoS-yta (Postgres-lagring i stället för
Airtable-kvoten, men samma sårbarhetsklass — OWASP DoS Cheat Sheet, redan
citerad av systerpasset).

**Den avgörande delfrågan** visade sig vara **HEIC**, inte skanningen. En
majoritet av webbläsarsessioner (uppskattningsvis 65–70 %, Chrome/Firefox/Edge)
kan **inte rendera HEIC i en `<img>`-tagg** (§ 4) — utan server-side
konvertering till JPEG blir Lottas admin-app en lista med trasiga
bild-ikoner för de flesta iPhone-avsändare, vilket direkt bryter mot Marcus
krav ("människor måste kunna skicka bilder ... till Roger och Lotta", implicit
att de ska kunna ÖPPNAS). Den server-side omkodningen som redan behövs för
sanering (EXIF-strippning) löser HEIC-problemet i SAMMA steg — en åtgärd,
två vinster.

**Skannings-domen (krav 2, den explicit efterfrågade frågan "vad gör små
organisationer i praktiken?"):** vid Miranon Medias volym (en arrangör,
enstaka meddelanden per vecka) är realtids-antivirusskanning **BÖR, inte
GOLV**. Den starkaste enskilda belägget är **Open Forms** — Nederländernas
statliga, öppen källkods-formulärbyggare, byggd för PUBLIKA, anonyma
inskick i en myndighetskontext strängare än vår — som gör ClamAV-skanning
**valfri och AVSTÄNGD som standard** (§ 7). Kompenserande kontroller (privat
bucket, typ-allowlist, magic-byte-verifiering, bildomkodning som sanering,
aldrig auto-rendering, Lotta öppnar filer manuellt via en autentiserad
admin-session) täcker det mesta av risken utan skanning; skanning är en
motiverad, billig fast-follow (Cloudmersive, gratisnivå 600 anrop/månad —
räcker gott vid vår volym, se § 2) snarare än en lanseringsspärr.

---

## Vad jag redan hade innan jag sökte

**Läst i sin helhet före första externa sökningen:** `docs/research/`s
filnamnslista (174 filer, `ls`), följt av full läsning av
[`publik-anmalningsvag-utan-inloggning-2026-09-19.md`](publik-anmalningsvag-utan-inloggning-2026-09-19.md)
(1006 rader — den delfråga uppdraget uttryckligen bygger vidare på) och
§ 1.3 + § 4 av
[`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md)
(dagens Elfsight-kontaktformulär, filuppladdning "mindre än 100 MB",
reCAPTCHA-skyddat, ingen automations-följd i Airtable). Vidare:
[`ADR-125`](../decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md)
i sin helhet, `docs/reference/data-model.md` § "Bilagornas datamodell"
(rad 478–620), `docs/reference/airtable-constraints.md` § G (P28/P29,
rad 518–588), samt källkoden för
`supabase/functions/{create-attachment-upload-ticket,
finalize-attachment-upload,upload-attachment,get-attachment-download-url,
delete-attachment,update-attachment-scope}/index.ts`,
`supabase/functions/_shared/{attachments.ts,storage-kopiera.ts}` och
`scripts/provision-attachments-bucket.mjs` (bucket-provisionering,
storleksgräns-motivering, mime-filter). `tasks/sessions/2026-09-19-
session-128.md` Del 1–3 lästes för uppdragets bakgrund och sammanhang.
`docs/decisions/ADR-011-csp-plugin-deferral.md` + `docs/byggplan.md` rad 94
lästes för Fas 7:s CSP-plan (hash-/self-formen, inte nonce — relevant för
om en tredjeparts uppladdnings-widget kan läggas till utan CSP-ändring).

**Vad som redan var avgjort, och som detta pass respekterar snarare än
omprövar:**

- **Bilage-fundamentet finns redan, skarpt bevisat.** `TASK-146.4`s
  två mönster (mönster 1: små filer, base64 i EF-kroppen, tak
  `SMALL_UPLOAD_MAX_BYTES = 6 MB`; mönster 2: signerad uppladdnings-URL +
  direkt PUT mot Storage + `finalize`) är byggda, testade och i drift för
  admin-appens bilagor. `createSignedUploadUrl` (path-scopad, server-genererat
  `attachmentId`, klienten kan aldrig välja path), en **privat** bucket
  (`bilagor`, 25 MB-tak, `application/pdf`-only mime-filter), signerade
  nedladdnings-URL:er (300 s TTL) och en existenskontroll via `.info(path)`
  (aldrig `.list()`, `TASK-196`) är ALLA redan mätta mot skarp staging. Detta
  pass uppfinner ingen ny uppladdningsmekanik — det anpassar den befintliga
  till en anonym avsändare.
- **`publik-anmalningsvag`-passets bot-/DoS-arkitektur gäller identiskt
  här.** Honeypot + tidsfälla + ALTCHA (öppen källkod, self-hosted, ingen
  CSP-ändring), rate limiting i Postgres per IP+event, och regeln "aldrig
  synkront mot Airtable i request-cykeln" är redan beslutade/researchade för
  SJÄLVA formuläret. En filuppladdning utan samma grindar vore en bakväg
  runt dem — se § 3.
- **`ADR-129`s jobbmotor** (pgmq + pg_cron + jobbtabell +
  `EdgeRuntime.waitUntil`) är redan byggd och mätt i staging. Detta pass
  föreslår att den föräldralösa-fil-städningen (§ 3) blir ÄNNU en
  konsument av samma motor, inte en ny mekanism.
- **Fas 7:s CSP-plan är hash-/self, inte nonce** (`byggplan.md` rad 94,
  `ADR-011`) — samma skäl som systerpasset avrådde från
  Turnstile/hCaptcha/reCAPTCHA som förstahandsval gäller en eventuell
  tredjeparts uppladdnings-/skannings-widget: varje extern domän i
  uppladdningsflödet är en framtida CSP-hål.

**Vad som var åldrat eller behövde omprövas:** inget internt var åldrat
(`ADR-125` är tre veckor gammal, bilage-fundamentets kod är i skarp drift).
Den externa delen (browsersupport för HEIC, OWASP-cheatsheets, GDPR-text,
skanningsleverantörers prisnivåer) söktes från grunden — `grep -rn -i
"exif|heic|virus|clamav|malware|polyglot|magic.bytes"` mot `docs/`, `tasks/`
och `supabase/` gav noll relevanta träffar utöver P28/P29 (Airtable-väggarna,
redan lästa ovan). Detta är alltså den FÖRSTA strukturerade genomlysningen av
filuppladdningssäkerhet specifikt i repot.

**Kompletterande fynd, inte i något tidigare pass:** `_shared/attachments.ts`
har redan en `KURSFAMILJ_SLUG`-disciplin för att undvika icke-ASCII i
Storage-path-segment (ett rött-först-belägg, `TASK-275.3`, 2026-08-17: ett
diakritiskt tecken i en path gav Storage-serverns egen 400) — direkt
relevant för hur ett klient-angivet filnamn ska saneras innan det blir en
del av en Storage-path (§ 2, "Slumpade lagringsnamn").

---

## Frågan

Hur tar en publik sajt emot filer från anonyma besökare på ett
branschledande, säkert och tillgängligt sätt — och vilken konkret lösning
bör Miranon Media bygga på Supabase för kontaktformulärets filuppladdning?

---

## 1. Hotbilden

OWASP File Upload Cheat Sheet och ASVS ger den strukturella grunden.
Rangordnad för DENNA yta (låg volym, privat bucket, ingen exekverande
körmiljö i vägen — appen kör aldrig uppladdad kod):

| # | Hot | Allvar här | Källa |
|---|---|---|---|
| 1 | **Lagrings-DoS** — någon fyller bucketen med skräp/stora filer | HÖGST — samma sårbarhetsklass som systerpassets "DoS mot Airtables kvota" (§ 1.1 där), fast mot Storage-utrymme i stället | OWASP File Upload Cheat Sheet: storlekstak är förstaförsvaret |
| 2 | **Skadlig kod i filen** (körbar payload, makro-dokument) | MEDEL — mildras STARKT av typ-allowlist (bilder/PDF, aldrig `.exe`/`.php`/skript) | OWASP File Upload Cheat Sheet § Extension/Type Validation |
| 3 | **Polyglot-filer** (en fil som är giltig i två format samtidigt, t.ex. GIF+HTML eller JPEG+PHP) | MEDEL — typkontroll via ENDAST filändelse/Content-Type ger NOLL skydd; magic bytes krävs | OWASP: *"Do not trust the Content-Type header; users can spoof it trivially"* |
| 4 | **Innehåll som renderas i admin-appen (XSS via SVG/HTML)** | HÖG om SVG tillåts, IRRELEVANT om den utesluts — SVG är ett XML-dokument som kan bära `<script>` och exekverar som HTML om det öppnas/inline:as i en webbläsare | Allmänt känd OWASP-klass (Stored XSS via SVG-upload), se § 2 |
| 5 | **Sökvägs-/filnamnsattacker** (path traversal, NTFS-strömmar, dubbla ändelser) | LÅG med server-genererat filnamn (redan mönstret i repot, `attachmentId` = `crypto.randomUUID()`) | OWASP: *"Generate random filenames... reject filenames containing colons"* |
| 6 | **Olagligt innehåll** (CSAM eller liknande skickat av en anonym avsändare) | LÅG SANNOLIKHET men HÖGSTA ALLVAR om det inträffar — kräver en process, inte bara teknik | Ingen teknisk kontroll eliminerar detta; se § 2 "Karantän" och § 9 |
| 7 | **Persondata ingen bett om** (EXIF/GPS i mobilbilder, känsligt innehåll i en bild) | HÖG SANNOLIKHET, given avsändarprofilen (Gunilla, mobilkamera) | GDPR Art 5(1)(c) dataminimering — se § 6 |
| 8 | **Hotlinking/öppen fillagring** | LÅG — en PRIVAT bucket med signerade URL:er (redan mönstret) utesluter detta strukturellt | Samma skäl `provision-attachments-bucket.mjs` redan dokumenterar för `bilagor`-bucketen |

**ASVS (4.0.3, V12.1 File Upload Requirements), verbatim:**

> **12.1.1** "Verify that the application will not accept large files that
> could fill up storage or cause a denial of service." (CWE 400)
> **12.1.2** "Verify that the application checks compressed files (e.g. zip,
> gz, docx, odt) against maximum allowed uncompressed size and against
> maximum number of files before uncompressing the file." (CWE 409)
> **12.1.3** "Verify that a file size quota and maximum number of files per
> user is enforced to ensure that a single user cannot fill up the storage
> with too many files, or excessively large files." (CWE 770)
> [OWASP/ASVS v4.0.3, 0x20-V12-Files-Resources.md](https://github.com/OWASP/ASVS/blob/v4.0.3/4.0/en/0x20-V12-Files-Resources.md),
> hämtad 2026-09-19

12.1.2 är särskilt relevant: **ingen typ i vår allowlist är ett
arkivformat** (§ 2) — det stänger hela den kravklassen strukturellt i stället
för att implementera zip-bomb-skydd.

**OWASP File Upload Cheat Sheet, sammanfattad (fetchad direkt, ej sekundärkälla):**

> "List allowed extensions. Only allow safe and critical extensions for
> business functionality." ... "Do not trust the Content-Type header; users
> can spoof it trivially — validate file signatures against expected types
> in allowlist format." ... "Create random strings (UUID/GUID) instead of
> accepting user-supplied names." ... "Store on a different host (complete
> segregation from application server)" som förstaval för lagringsplats ...
> "applying image rewriting techniques destroys any kind of malicious
> content injected in an image."
> [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
> hämtad 2026-09-19

**"Store on a different host" är redan uppfyllt GRATIS av vår arkitektur:**
Supabase Storage serveras från `*.supabase.co`, ett annat ursprung än
`miranon.se` och admin-appens domän — signerade URL:er pekar dit, aldrig till
en path under sajtens eget ursprung. Ingen ny mekanism krävs för detta krav.

---

## 2. Kontrollerna

| Kontroll | Primärkälla | Dom vid vår volym |
|---|---|---|
| **Typ-allowlist: JPEG, PNG, WebP, HEIC/HEIF, PDF — INTE SVG** | OWASP File Upload Cheat Sheet (allowlist-princip); SVG uteslutet pga XSS-risk (känd klass, `<script>`/`<foreignObject>` i ett XML-dokument som kan renderas som HTML) | **GOLV** |
| **Magic-byte-verifiering, inte bara `Content-Type`** | OWASP, verbatim ovan | **GOLV** — enkelt att bygga (JPEG `FFD8FF`, PNG `89504E47`, WebP `RIFF….WEBP`, PDF `%PDF-`, HEIC ISOBMFF `ftyp`-box med brand `heic`/`heix`/`mif1`/`heim` vid byte 4–11), ingen extern dependency krävs i Deno |
| **Storlekstak: 15 MB/fil (STARTBEDÖMNING)** | Ingen mätning finns — samma öppna-startbedömnings-disciplin som `ADR-129`s rundtak och systerpassets rate-limit-tal. Motiverat mot: en typisk iPhone HEIC/JPEG-bild ligger 2–8 MB, Zendesks eget inkommande-tak är 50 MB, GOV.UK:s felmeddelandemönster visar att ett konfigurerbart tak är standard, inte en universell siffra | **BÖR** (öppen, omprövas vid mätt incidens) |
| **Antalstak: 5 filer/inskick, 40 MB total (STARTBEDÖMNING)** | Samma skäl som ovan; ASVS 12.1.3 kräver EN gräns per avsändare, inte en specifik siffra | **BÖR** |
| **Slumpade lagringsnamn** | OWASP, verbatim ovan — redan byggt mönster i repot (`crypto.randomUUID()` som `attachmentId`, `_shared/attachment-filename.ts`) | **GOLV, redan uppfyllt av återanvänd kod** |
| **Privat bucket + kortlivade signerade nedladdnings-URL:er** | Redan byggt (`bilagor`-bucketen, `SIGNED_DOWNLOAD_URL_TTL_SECONDS = 300`); AWS Prescriptive Guidance ("shorter expiration times... generally recommended") redan citerad internt | **GOLV, mönstret återanvänds — men NY, egen bucket, se nedan** |
| **Nedladdning som `attachment` med `nosniff`** | Supabase `createSignedUrl(path, expiresIn, { download: true \| 'filnamn' })` sätter `Content-Disposition: attachment` (verifierat mot Supabase-dokumentationen, context7, 2026-09-19); `X-Content-Type-Options: nosniff` sätts explicit av vår egen nedladdnings-väg (samma header-disciplin som Fas 7:s säkerhetsheaders-plan) | **GOLV** |
| **Separat ursprung för användarinnehåll** | Redan uppfyllt gratis — se § 1 | **GOLV, uppfyllt utan ny kod** |
| **EXIF-/GPS-strippning** | Ingen primärkälla specifik för Deno hittad — allmän branschpraxis (WordPress VIP, Twenty CRM-projektets egen PR) är re-encoding, se nedan | **GOLV** (Gunilla-avsändarens mobilbilder bär rutinmässigt GPS — dataminimering, GDPR Art 5(1)(c)) |
| **Bildomkodning som sanering** | OWASP, verbatim ovan ("image rewriting... destroys any kind of malicious content") | **GOLV för bildtyper** — löser EXIF-strippning OCH polyglot-skydd OCH HEIC-visning i samma steg (§ 4) |
| **PDF-sanering (strippa ev. inbäddat JS)** | Ingen primärkälla verifierad i detta pass för en Deno-kompatibel PDF-CDR-lösning | **BÖR/SPEKULATIVT — se "Vad jag inte kunde belägga"** |
| **Skadekods-skanning** | Se § "Skannings-domen" ovan och § 7 (Open Forms-precedentet) | **BÖR, inte GOLV, vid vår volym** |
| **Karantän tills skannad** | Manifesteras hos oss som "aldrig auto-rendering, Lotta öppnar manuellt via signerad URL i en autentiserad session" — inget separat karantänsteg behövs SÅ LÄNGE ingen synkron skanning finns att vänta på | **GOLV i sin lätta form (manuell granskning), SPEKULATIVT som eget skanningssteg** |
| **Automatisk radering (lagringstid)** | Ingen befintlig policy i repot (samma lucka systerpasset flaggade för själva meddelandedatan, § 7 där) — GDPR Art 5(1)(e) kräver en gräns | **GOLV att BESLUTA en siffra, se § 8** |

### Om SVG specifikt

SVG är medvetet UTESLUTET ur allowlisten. Ett SVG-dokument är text/XML och
kan bära `<script>`-element eller händelsehanterare (`onload`) som exekverar
om filen någonsin renderas i en webbläsarkontext (t.ex. om Lottas admin-app
någon gång visar en bildförhandsgranskning genom att sätta `src` till en
signerad URL och webbläsaren tolkar `Content-Type: image/svg+xml` som
renderbart HTML-liknande innehåll). Att kräva SVG-sanering (t.ex. DOMPurifys
SVG-profil) för en yta där avsändaren är en anonym, potentiellt fientlig part
är en helt onödig attackyta att stänga — "bilder och liknande" (Marcus egna
ord) täcks fullt ut av JPEG/PNG/WebP/HEIC.

---

## 3. Uppladdningsvägen på Supabase

**Mönster 2 (signerad uppladdnings-URL + direkt PUT + finalize) är GOLVET,
återanvänt — mönster 1 (bytes i EF-kroppen) är fel val för denna yta.**
Skälet är inte bara `SMALL_UPLOAD_MAX_BYTES`s 6 MB-tak (som redan skulle
tvinga de flesta mobilbilder till mönster 2) utan Deno Edge Functions
runtime-minnesgräns: **150 MB**, dokumenterad av Supabase själva
(*"Edge Functions are subject to a runtime memory limit of 150MB"*,
[Supabase — Troubleshooting Edge Function resource usage](https://supabase.com/docs/guides/troubleshooting/edge-function-monitoring-resource-usage),
hämtad 2026-09-19 via context7) — att basa64-koda flera bilder genom en
enda EF-kropp (mönster 1:s form) multiplicerar minnesavtrycket (~33 %
overhead) helt i onödan när mönster 2 redan finns, är bevisat, och undviker
frågan helt genom att låta bytesen gå DIREKT klient → Storage.

**RLS för en anonym uppladdare som ALDRIG får läsa:** den enklaste, mest
konsekventa lösningen är att INTE ge `anon`-rollen någon RLS-policy alls på
`storage.objects` för den nya bucketen. `createSignedUploadUrl` kräver
`insert`-behörighet på `objects`-tabellen ENDAST för den anropande rollen —
men eftersom Supabase-dokumentationen bekräftar att *"Uploading a file using
a token generated from createSignedUploadUrl requires no direct RLS policy
permissions on the buckets or objects tables"*
([Supabase — JavaScript Storage Reference, `uploadToSignedUrl`](https://supabase.com/docs/reference/javascript/getchannels),
hämtad 2026-09-19 via context7), är hela auktorisationskedjan redan löst av
mönstret: **EF:en som utfärdar tickets kör med `service_role`** (bypassar RLS
helt, precis som `create-attachment-upload-ticket` redan gör), och klienten
använder bara den utfärdade, path-scopade token:en. `anon`-rollen behöver
alltså NOLL policyer på `storage.objects` — varken insert, select eller
delete. Det är samma "allt går via adaptern/EF:en, aldrig direkt
klient-till-data"-disciplin `ADR-057` redan kräver i hela repot, applicerad
på Storage i stället för Postgres.

**Hur ALTCHA-token knyts till rätten att få en uppladdnings-URL:** samma
grind som systerpassets K1–K9 (honeypot, tidsfälla, ALTCHA-lösning,
rate limit, Zod-validering) körs FÖRE ticket-utfärdandet, inte bara före
meddelande-inskicket. Konkret: kontaktformulärets nya publika EF
(`public-contact-upload-ticket`, syskon till `public-create-registration`)
kräver samma ALTCHA-payload i request-kroppen som meddelande-EF:en — annars
kunde en bot hoppa över meddelandeflödets bot-skydd helt genom att bara
anropa uppladdnings-endpointen direkt och fylla bucketen (§ 1, hot #1). Detta
är en NY tillämpning av ett redan beslutat mönster, inte ett nytt beslut.

**Resumable/TUS för stora mobilbilder på dåligt nät:** Supabase stödjer TUS
(`tus-js-client`, endpoint `https://<ref>.storage.supabase.co/storage/v1/
upload/resumable`, `chunkSize` MÅSTE vara 6 MB) och rekommenderar det själva
för filer över samma 6 MB-gräns: *"Standard uploads can transfer files up to
5 GB, although resumable and S3 uploads are recommended for files above 6 MB
for better performance and reliability."*
([Supabase — File size restrictions](https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT),
hämtad 2026-09-19 via context7). Vid vårt föreslagna 15 MB-tak (§ 2) ligger
de flesta mobilbilder UNDER 6 MB (standard-PUT räcker), men en stor HEIC-fil
eller en scannad flersidig PDF kan överstiga det. **Dom: BÖR, inte GOLV vid
lansering** — standard-signerad-PUT (utan TUS) är enklare, kräver ingen
klient-dependency (`tus-js-client`), och täcker merparten av fallen; TUS
läggs till som en v1.1-förbättring om mätt data visar avbrutna uppladdningar
på dåligt mobilnät. Detta är EXAKT samma "spekulativ komplexitet vid vår
volym"-resonemang systerpasset redan tillämpade på Upstash Redis och en äkta
lås-reservation.

**Städning av föräldralösa filer:** en ticket utfärdas innan formuläret
skickas in (samma tvåstegs-natur som det befintliga mönstret) — en besökare
som laddar upp en bild men aldrig trycker "skicka" lämnar en fil i Storage
utan någon motsvarande meddelanderad. Rekommendation: **återanvänd
`ADR-129`s jobbmotor** med en periodisk `pg_cron`-svepuppgift (samma
motor som redan sveper `pågår`-rader var 10:e sekund för kvittojobbet) som
listar objekt i den nya bucketens prefix äldre än 48 timmar UTAN en
motsvarande rad i meddelande-inkorgen, och raderar dem. Detta är samma
princip som repots EGEN interna
`seed:review`-fixturlivstid (`docs/reference/staging-verifiering-runbook.md`
§ Granskningsfixtur: en stämplad utgångstid + ett förfallo-svep) — mönstret
finns redan i repot för en annan yta och återanvänds konceptuellt, inte som
kod (olika domäner, samma idé: en stämpel + ett periodiskt svep i stället för
en tidsstyrd extern process).

**Ny, ISOLERAD bucket — inte `bilagor`-bucketen.** `bilagor` är byggd för
BETRODDA, admin-genererade eller admin-uppladdade PDF:er (event-mallar,
kvitton, deltagarinformation) — allt redan granskat av en inloggad
administratör. Att lägga en anonym, potentiellt fientlig avsändares filer i
SAMMA bucket blandar två helt olika tillitsnivåer och två helt olika
livscykler (permanent kontra 48h-föräldralös-sweep, se § 8). En separat
bucket (`publika-bilagor` eller motsvarande) med egen, striktare
`file_size_limit` och `allowed_mime_types` (bilder + PDF, INTE bara PDF) är
en enkel, billig isolering som håller blast radius liten om något ändå
slinker igenom — samma "försvar i djupet"-princip
`provision-attachments-bucket.mjs`s eget mime-filter redan dokumenterar för
`bilagor`.

---

## 4. HEIC-frågan

**Nej, webbläsaren/OS:et tar INTE hand om konverteringen åt oss.** iPhone
skjuter HEIC som standard sedan iOS 11 (2017), och det finns ingen
webbstandard eller `<input type="file">`-mekanism som konverterar filen till
JPEG vid uppladdning till en godtycklig sajt — det enda inbyggda
konverteringsbeteendet (iOS "Transfer to Mac or PC"-inställningen) gäller
specifika Apple-till-Apple/dator-överföringsvägar, inte webbformulär.

**Vad admin-appen faktiskt kan visa, mätt mot browsersupport:**

> "Chrome, Firefox, and Edge have no native decode support for HEIC in img
> tags or Canvas, so a HEIC file dropped into an img src typically fails to
> render." ... "Approximately 30–35% of browser sessions can display HEIC.
> The remaining 65–70% will see broken images." Endast Safari har fullt
> stöd, eftersom *"Apple controls both the format and the browser"* och
> ships hårdvaru-HEVC-avkodare i varje Mac/iPhone/iPad sedan 2017.
> [HEIC Browser Support 2026 — sammanställning via sökresultat, flera
> oberoende källor (windowsreport.com, testmuai.com, heicify.com)], hämtad
> 2026-09-19 — se § Vad jag inte kunde belägga för källkvaliteten.

Lotta använder sannolikt en icke-Safari-dator (Windows/Chrome vanligast i
svenska småföretag) — utan konvertering ser hon **trasiga bildikoner för
merparten av iPhone-avsändarnas bilder**, vilket är en direkt regression mot
Marcus krav.

**Lösningen är samma steg som redan krävs för sanering (§ 2):**
server-side bildomkodning. Praktiskt betyder det: filen tas emot och
lagras i sitt ORIGINALFORMAT (bevis-syfte, ingen kvalitetsförlust), OCH en
JPEG-derivat genereras server-side vid uppladdningstillfället (eller lazy,
vid första visningen) som admin-appen visar i listan/förhandsgranskningen.
Originalet finns kvar nedladdningsbart för den som faktiskt behöver full
kvalitet.

**Vad som INTE verifierades i detta pass, och som kräver ett minimaltest
(repots egen standardregel) innan bygge:** ett konkret, Deno-kompatibelt
bibliotek som (a) kan AVKODA HEIC och (b) kan omkoda till JPEG server-side i
en Supabase Edge Function. HEIC/HEVC-avkodning är komplex och
patentbelastad — de flesta rena JS/Deno-bildbibliotek (t.ex. `ImageScript`,
populärt i Deno-communityn för JPEG/PNG/WebP-manipulation utan native
dependencies) saknar HEIC-stöd såvitt kunde verifieras i detta pass' tid.
Alternativ att pröva i ett minimaltest: (a) en WASM-portering av `libheif`
körd i Deno (obelagt om den fungerar i Edge Function-runtimen), (b) skjuta
konverteringen till KLIENTEN innan uppladdning (en WASM HEIC→JPEG-lib körd i
webbläsaren, t.ex. `heic-to`/`libheif-js` — kostar extra JS-bundlestorlek
och CPU-tid på Gunillas telefon, men undviker server-side HEIC-avkodning
helt), eller (c) en betald molntjänst för konvertering. **Detta är den
enskilt mest osäkra tekniska punkten i hela detta pass — flaggad explicit,
inte gissad.**

---

## 5. Tillgänglig filuppladdning

**W3C/WAI och GOV.UK Design System är samstämmiga:** knappval och
dra-och-släpp presenteras som EKVIVALENTA vägar, aldrig drag-och-släpp som
enda väg — precis kravet i uppdraget.

> GOV.UK File upload-komponenten: *"Users can interact... through two
> approaches: activating the 'Choose file' button or dragging files directly
> into the designated area"* — **båda presenteras som lika giltiga, inte den
> ena som primär.** Den förbättrade (JS-aktiverade) varianten löser ett
> KONKRET, dokumenterat gap: *"Users of Dragon speech recognition software
> previously couldn't activate native file inputs through voice commands;
> the enhanced version allows them to use standard web control commands."*
> Felmeddelanden ska vara SPECIFIKA per felorsak, exempelvis: "Select a
> [file type]" · "The selected file must be a [list types]" · "The selected
> file must be smaller than [size]" · "The selected file is empty" · "The
> selected file contains a virus" · "The selected file could not be
> uploaded – try again" · "You can only select up to [number] files at the
> same time."
> [GOV.UK Design System — File upload](https://design-system.service.gov.uk/components/file-upload/),
> hämtad 2026-09-19

Repots komponentbibliotek `react-aria-components` ger exakt detta mönster
färdigbyggt (verifierat via context7 mot `react-aria.adobe.com`, 2026-09-19):
`DropZone` med
`FileTrigger` som BARN — `FileTrigger` renderar en vanlig, tangentbords- och
skärmläsar-åtkomlig knapp (`<Button>`), medan `DropZone` lägger till
drag-och-släpp OVANPÅ samma yta, inte i stället för den. `FileTrigger` tar
`acceptedFileTypes` (mime-typer, klient-sidig hint — ALDRIG en ersättning för
server-side magic-byte-kontroll, § 2) och `allowsMultiple`. Detta är redan
repots etablerade komponentbibliotek (`react-aria-components`,
`CLAUDE.md` § Stack) — inget nytt bibliotek behöver introduceras.

**Förlopp, felmeddelanden, borttagning av vald fil:** GOV.UK:s
felmeddelande-katalog ovan ger den kompletta uppsättningen att implementera
(en per feltyp, aldrig ett generiskt "något gick fel"). Borttagning av en
redan vald fil INNAN uppladdning är ren klient-state (react-arias
`FileTrigger onSelect` ger en `FileList`, applikationen håller listan i eget
state och kan filtrera bort ett element) — ingen server-inblandning krävs
förrän "skicka" trycks.

---

## 6. GDPR

Bygger vidare på systerpassets § 7 (rättslig grund Art 6(1)(a)/(b), IMY:s
informationsplikt Art 13) — tillägget här är SPECIFIKT för filbilagor.

**Dataminimering (Art 5(1)(c)) är den mest konkreta risken.** En mobilbild
bär rutinmässigt EXIF-metadata inklusive GPS-koordinater, enhets-ID och
tidsstämpel — data ingen bad om och som formuläret inte behöver. Att
strippa detta server-side (§ 2, § 4) är inte bara en säkerhetsåtgärd, det är
en GDPR-efterlevnadsåtgärd: att LAGRA GPS-koordinater kopplade till ett
meddelande utan att ha frågat efter dem eller informerat om det är precis
den typ av bortglömd, omotiverad insamling Art 5(1)(c) förbjuder.

> Art 9(2): *"Processing of personal data... concerning health... shall be
> prohibited"* om inte ett undantag tillämpas.
> [GDPR Art. 9](https://gdpr-info.eu/art-9-gdpr/) (konveniensspegling av
> EUR-Lex, samma källbegränsning som systerpasset dokumenterar), hämtad
> 2026-09-19

En bild kan OAVSIKTLIGT innehålla särskilda kategorier av data (t.ex. en
skada, ett recept, ett dokument med hälsouppgifter fotograferat "och
liknande" som Marcus formulerade kravet) — detta går inte att filtrera bort
tekniskt vid uppladdningstillfället. Konsekvensen är en PROCESS-fråga, inte
en teknisk kontroll: samma informationsplikt (Art 13) som systerpasset redan
flaggar som ett byggblockerande, icke-tekniskt krav (en integritetspolicy
Marcus/Roger/Lotta måste skriva) MÅSTE nämna att bilagor kan innehålla
persondata och hur länge de sparas.

**Lagringstid (Art 5(1)(e)):** ingen befintlig policy i repot, samma lucka
som systerpasset flaggar för meddelandedata i stort — se § 8 för en konkret
rekommendation.

**Personuppgiftsbiträden:** varje extern part som SER filens innehåll blir
ett biträde som kräver ett DPA (Art 28). Det är ett direkt argument MOT
VirusTotal i sin standardform (se § 2/§ 7 — standardanropet delar filen med
tredjepartsleverantörer i antivirusindustrin) och FÖR antingen ingen
skanning alls (kompenserande kontroller räcker, § "Skannings-domen") eller
en leverantör med tydligt DPA och EU-hosting om skanning väljs som
fast-follow.

---

## 7. Precedenter

Fyra primärkällor, alla verifierade direkt (inte sekundärkälla) utom där
angivet. Precedent-rymden för "litet företag tar emot bilder från
allmänheten via ett kontaktformulär, byggt på Supabase" är TUNN — ingen
källa nedan matchar vår exakta kombination (låg volym + Supabase +
Airtable-mellanlager). Det sägs öppet, precis som systerpasset gjorde för
samma klass av fråga.

**1. Open Forms (Nederländerna, öppen källkod, statlig formulärbyggare för
publika, anonyma inskick).** Starkast relevant precedent i hela detta pass
— en PUBLIK, myndighets-kontext med striktare krav än vår, som ändå gör
virusskanning en OPT-IN:

> "Virus scanning is optional and disabled by default." Administratören
> aktiverar den via en ClamAV-serveradress (host+port). *"If it is found to
> contain malware, the upload is blocked and the file is not saved. The
> user is alerted that the virus scan found the file to be infected."*
> [Open Forms — Virus scan configuration](https://open-forms.readthedocs.io/en/3.5.4/configuration/general/virus_scan.html),
> hämtad 2026-09-19

**Relevans:** om en svensk/nederländsk myndighets formulärbyggare inte
kräver skanning som förutsättning för att ta emot publika filer, är
"BÖR, inte GOLV" en rimlig, branschbelagd nivå för Miranon Media — inte en
genväg vi uppfinner själva.

**2. GOV.UK Notify — filer skickas via länk, aldrig som bilaga.**

> "Notify uses encrypted links instead of email attachments because they're
> more secure... the file content must be smaller than 2MB." Mottagaren
> måste bekräfta sin e-postadress för att låsa upp länken.
> [GOV.UK Notify — Send files by email](https://www.notifications.service.gov.uk/using-notify/send-files-by-email),
> hämtad 2026-09-19

**Relevans:** samma princip vi redan tillämpar (signerad URL, aldrig
bytes i ett mail) — oberoende bekräftelse av mönstret från en annan
myndighetsprodukt, om än i motsatt riktning (UT från en organisation, inte
IN till den).

**3. Zendesk — malware-skanning + strikta storlekstak + "secure downloads
requiring sign-in" som en explicit produktfunktion.**

> Inkommande tak: 50 MB/fil. *"Malware scanning... scans all file
> attachments to tickets and messaging conversations and blocks any that
> are flagged as potentially malicious."* Konfigurerbart: *"attachment
> settings to control file types, size limits, privacy, and secure
> downloads requiring sign-in."* Samtidigt en explicit varning: *"Don't
> rely solely on [vår] attachment scanning to protect users."*
> [Zendesk Help — Allowing attachments in tickets](https://support.zendesk.com/hc/en-us/articles/4408832757146-Allowing-attachments-in-tickets),
> [Managing malicious attachments](https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments),
> hämtad 2026-09-19 (via sökresultat — se § Vad jag inte kunde belägga)

**Relevans:** en etablerad SaaS-helpdesk med FAR högre volym än oss bygger
ändå på samma tre pelare vi rekommenderar — storlekstak, valfri/lagd-ovanpå
skanning, och "kräver inloggning att ladda ner" (vår signerade-URL-modell
är strängare: ingen publik länk alls, bara en tidsbegränsad signerad URL).

**4. Supabase egna dokumenterade mönster (signerad uppladdning, RLS,
storage-serving) — redan citerat § 3, primärkälla, inte precedent i
"annan organisation"-mening men den auktoritativa tekniska grunden.**

**Dom över precedent-rymden:** tre organisationer i olika sektorer
(myndighetsformulär, myndighetsmeddelanden, kommersiell helpdesk) landar
oberoende av varandra på samma kärnprinciper — storlekstak, signerad/länkad
åtkomst i stället för öppna bilagor, och skanning som ETT lager bland flera
snarare än den enda försvarslinjen. Ingen av dem är byggd på Supabase eller
i vår skalklass, vilket gör rymden TUNN specifikt för "Supabase + låg
volym" — men mönstren generaliserar väl, vilket är skälet § 8 syntetiserar i
stället för att kopiera en enda förlaga. **pretix/Indico gav INGEN
substantiell precedent för filuppladdning specifikt** (pretix källkod
handlar om CSV-import av vouchers, inte filbilagor från publika besökare;
Indico har filhantering men dokumentationen som gick att nå beskrev
CERNBox/OwnCloud-integration, inte den egna uppladdningssäkerheten) — det
bokförs öppet som ett svagt/obelagt spår snarare än att tvingas in i
tabellen ovan.

---

## 8. Rekommendation

**Detta är en rekommendation, inte ett beslut** — samma markering
systerpasset höll, i väntan på Marcus grillning.

### Sekvensen, val av fil till Lotta öppnar den

1. **F1 — Besökaren väljer fil(er)** via `FileTrigger`/`DropZone`
   (react-aria-components, § 5) — knapp och drag-och-släpp likvärdiga.
   Klient-sidig hint (`acceptedFileTypes`) visar rätt filbläddrare-filter,
   men avgör INGET på servern.
2. **F2 — Klient-sidig förhandskontroll** (storlek, antal, grov
   MIME-gissning ur `File.type`) ger OMEDELBAR feedback (GOV.UK:s
   felmeddelande-katalog, § 5) — rent UX, ingen säkerhetsfunktion.
3. **F3 — Samma bot-/rate limit-grind som meddelande-inskicket**
   (honeypot, tidsfälla, ALTCHA-token, rate limit per IP — systerpassets
   K1–K5) krävs INNAN en uppladdnings-ticket utfärdas, inte bara innan
   meddelandet skickas (§ 3).
4. **F4 — `public-contact-upload-ticket` (ny, oautentiserad EF)** validerar
   ALTCHA-token + rate limit, väljer den NYA `publika-bilagor`-bucketen
   (§ 3), genererar `attachmentId` (`crypto.randomUUID()`, återanvänt
   mönster) och utfärdar `createSignedUploadUrl` (path-scopad, ingen
   RLS-policy behövs för `anon`, § 3).
5. **F5 — Klienten PUT:ar bytesen DIREKT mot Storage** med den signerade
   token:en — aldrig genom en EF-kropp (§ 3, minnesgränsen).
6. **F6 — `finalize-contact-upload` (ny EF, syskon till
   `finalize-attachment-upload`)** läser objektet via `.info(path)`
   (existenskontroll, ALDRIG `.list()`, § "Vad jag redan hade"),
   **magic-byte-verifierar** typen mot allowlisten (§ 2), avvisar vid
   mismatch, och för godkända BILDTYPER: kör server-side omkodning
   (EXIF-strippning + JPEG-derivat för HEIC-visning, § 4) — original
   bevaras, derivat genereras.
7. **F7 — En referens (attachmentId + path) hålls i klientens formulär-state**
   tills "skicka" trycks — INGEN Airtable/Postgres-metadatarad skrivs än
   (samma "svara direkt, aldrig synkront mot datakällan"-regel som
   systerpasset K12).
8. **F8 — Besökaren skickar formuläret.** `public-create-contact-message`
   (den andra publika EF:en, eget pass) skriver meddelandet till
   Postgres-inkorgen MED filreferenserna — SAMMA atomära skrivning som
   binder filerna till meddelandet, ingen orphan-risk för filer som faktiskt
   skickades in.
9. **F9 — Städsvep (pg_cron, `ADR-129`s motor)** raderar objekt i
   `publika-bilagor` utan en motsvarande inkorg-rad efter 48 timmar
   (§ 3) — fångar avbrutna formulär.
10. **F10 — Lotta öppnar filen i admin-appen** via en NY signerad
    nedladdnings-URL (300 s TTL, `download: true` → `Content-Disposition:
    attachment`, `nosniff`, § 2) från en AUTENTISERAD session — aldrig en
    publik länk. Bildlistan visar JPEG-derivatet (§ 4/§ 6); PDF öppnas via
    nedladdning eller en sandboxad visare, aldrig auto-inline.

### De konkreta talen (samtliga STARTBEDÖMNINGAR, inte mätningar)

| Vad | Värde | Jämfört med |
|---|---|---|
| Tillåtna typer | JPEG, PNG, WebP, HEIC/HEIF, PDF | Dagens Elfsight tillät "allt" upp till 100 MB |
| Max storlek/fil | **15 MB** | Zendesk 50 MB, GOV.UK inget fast tal, mobilbilder 2–8 MB typiskt |
| Max antal filer/inskick | **5** | — |
| Max total storlek/inskick | **40 MB** | Interna `bilagor`-bucketens 25 MB-tak (annan kontext, se § 3) |
| Signerad nedladdnings-URL TTL | **300 s** | Återanvänt oförändrat ur `_shared/attachments.ts` |
| Signerad uppladdnings-URL TTL | **7200 s** (plattformens FASTA värde) | Återanvänt oförändrat |
| Föräldralös-fil-sweep | **48 timmar** | Nytt, motiverat av "gott om tid att slutföra ett formulär, kort nog att inte samla skräp" |
| Lagringstid för länkade filer | **Samma som meddelande-inkorgens egen policy** (obesvarad, se § 9 — den andra passets scope) | — |

### Vad som återanvänds (fil för fil)

`_shared/attachments.ts` (`buildAttachmentPath`/`buildAttachmentLeaf`,
`sanitizeFilnamn`, `isValidAttachmentId`, `SIGNED_DOWNLOAD_URL_TTL_SECONDS`,
`SIGNED_UPLOAD_URL_TTL_SECONDS`-KONSTANTERNA — inte bucket-specifika, kan
återanvändas rakt av) · `create-attachment-upload-ticket/index.ts` OCH
`finalize-attachment-upload/index.ts` som MÖNSTER (ny kod, `requireUser`
bytt mot ALTCHA-grinden, men samma struktur — existenskontroll via
`.info()`, path-derivering server-side, aldrig klient-vald path) ·
`_shared/errors.ts`, `_shared/cors.ts` · `ADR-129`s jobbmotor för
föräldralös-sweepen · `publik-anmalningsvag`-passets hela bot-/rate
limit-arkitektur (honeypot, tidsfälla, ALTCHA, Postgres-rate-limit-tabell) ·
`react-aria-components` (`FileTrigger`/`DropZone`, redan i stacken).

### Vad som är NYTT

En andra, ISOLERAD, privat Storage-bucket (`publika-bilagor`) med egen
`file_size_limit`/`allowed_mime_types` · `public-contact-upload-ticket`
och `finalize-contact-upload` (nya EF:er, mönster kopierat) ·
magic-byte-verifieringsfunktionen (ingen extern dependency, ~5 kända
signaturer) · server-side bildomkodnings-/EXIF-strippnings-steget (KRÄVER
minimaltest, § 4 — den enskilt mest osäkra byggbiten) · en ny jobbtyp
(`stada_foraldralosa_bilagor`) i `ADR-129`s jobbtabell · Postgres-tabellen
som binder filreferenser till kontaktmeddelandet (delas med det andra
passets inkorgsdesign).

### Var filerna bor medan Airtable är datakälla

**Supabase Storage, ALDRIG Airtable-bilagor, med referens (path) i
Postgres/Airtable.** Samma slutsats `TASK-146` redan drog för de INTERNA
bilagorna, och skälen är IDENTISKA här, förstärkta:

- **P28** (Airtable attachment-URL:er går ut efter 2 timmar, *"we will
  ensure that download URLs stay active for at least 2 hours"*,
  [`support.airtable.com/docs/airtable-attachment-url-behavior`](https://support.airtable.com/docs/airtable-attachment-url-behavior))
  gör Airtable strukturellt olämpligt som hemvist för en fil som ska kunna
  öppnas långt senare.
- **P29** (Airtables `uploadAttachment`-API är kapat till 5 MB
  direkt-byte-uppladdning; större filer kräver att Airtable HÄMTAR från en
  URL) — vårt 15 MB-tak skulle för många filer INTE rymmas i
  direkt-byte-vägen, och att först lägga filen i Supabase Storage för att
  sedan låta Airtable hämta den därifrån är ett cirkulärt extra steg som
  inte ger något.
- Airtables `Bilagor`-tabell (`ADR-125`) håller REDAN bara METADATA, aldrig
  bytes — samma disciplin fortsätter: en NY tabell/rad-klass
  (`Kontaktbilagor` eller motsvarande, det andra passets domän) håller
  `path`+`filnamn`+`storlek` i Airtable, bytesen bor i Supabase Storage.

**Detta överlever Fas E oförändrat** (samma `ADR-080`-princip som
systerpasset redan tillämpar): Supabase Storage ÄR redan Postgres-plattformen
— den flyttar ingenstans vid migreringen. Enda skillnaden efter Fas E är att
METADATAN flyttar från Airtable-rader till Postgres-rader; path-formen,
bucket-strukturen och hela uppladdningsflödet (F1–F10) är opåverkat.

### Golv kontra spekulativ komplexitet

**Golv:** typ-allowlist utan SVG · magic-byte-verifiering · slumpade
lagringsnamn (redan uppfyllt) · privat bucket + signerade URL:er (redan
uppfyllt) · `Content-Disposition: attachment` + `nosniff` vid nedladdning
(redan uppfyllt via `download`-parametern) · separat ursprung (redan
uppfyllt) · bildomkodning/EXIF-strippning (löser HEIC OCH sanering i ett
steg) · samma bot-/rate limit-grind som meddelande-inskicket · en NY,
isolerad bucket skild från `bilagor` · föräldralös-fil-sweep · en BESLUTAD
lagringstid (siffran är öppen, men att INTE ha en är GDPR-fel).

**Spekulativ komplexitet att skära vid Miranon Medias volym:** realtids
antivirusskanning som lanseringsspärr (Open Forms-precedentet, § 7) ·
TUS/resumable uploads vid lansering (BÖR, inte GOLV — standard-PUT räcker
under 6 MB, § 3) · PDF-sanering/CDR som eget byggsteg (flagga risken, men
bygg det inte innan PDF visar sig vara en verklig vektor — samma
"asymmetrisk kostnad"-resonemang systerpasset använde för
lås-reservationen) · en egen karantän-tillståndsmaskin (manuell granskning
via signerad URL räcker vid denna volym).

---

## 9. Vad som INTE besvarades

1. **Konkret Deno-kompatibelt bibliotek för HEIC-avkodning + bildomkodning**
   — den enskilt viktigaste öppna frågan (§ 4). Kräver ett minimaltest
   (repots egen standardregel) innan bygge, inte gissat i detta pass.
2. **Var inkorgstabellen/-schemat för kontaktmeddelanden faktiskt bor** och
   hur filreferenser kopplas till en person i basen — uttryckligen ett
   ANNAT, parallellt pass' scope (uppdragstexten: "eget parallellt
   research-pass"). Detta pass förutsätter bara att en sådan koppling
   FINNS och pekar på var filerna bor relativt den.
3. **Exakt lagringstid för länkade (icke-föräldralösa) filer** — en
   PRODUKTBESLUT-fråga (hur länge Lotta behöver kunna slå upp ett gammalt
   kontaktmeddelande), inte en teknisk fråga detta pass kan avgöra. 48h för
   FÖRÄLDRALÖSA filer är väl motiverat; lagringstiden för FÄRDIGA
   meddelanden är öppen.
4. **PDF-specifik sanering (CDR)** — ingen Deno-kompatibel lösning
   verifierad; PDF-format kan strukturellt bära inbäddat JavaScript
   (`/OpenAction`, `/JS`) på ett sätt bildformat inte kan efter omkodning.
5. **Om skanning väljs som fast-follow: vilken leverantör** — Cloudmersive
   (gratisnivå 600 anrop/månad, MEN 2,5 MB filstorlekstak på gratisnivån,
   vilket kolliderar med vårt föreslagna 15 MB-tak för bilder — en betald
   nivå eller en annan leverantör krävs då) kontra ett självhostat ClamAV
   (kräver en långlivad process, passar dåligt i en serverless
   Edge-Function-arkitektur utan en separat, alltid-igång komponent) är
   INTE avgjort här.
6. **Den fullständiga integritetspolicytexten** (Art 13, bilage-specifik
   formulering) — juridiskt innehåll, samma avgränsning systerpasset gjorde.
7. **Exakta talen för storlek/antal** — öppna startbedömningar, inte mätta
   (§ 8).
8. **Om `heic-to`/`libheif-js` (klient-sidig HEIC-konvertering) faktiskt
   fungerar tillförlitligt i Safari-mobil OCH Chrome-mobil** — nämnda som
   ALTERNATIV i § 4, ingen av dem testad eller djupundersökt i detta pass.

---

## Dom

En publik filuppladdning för kontaktformuläret är byggbar UTAN att uppfinna
någon ny mekanism — Miranon Media har redan det svåraste (signerad
uppladdning, path-derivering, existenskontroll) skarpt bevisat för
admin-appens bilagor. Den STÖRSTA enskilda vinsten i detta pass är
insikten att server-side bildomkodning löser TVÅ krav samtidigt (sanering
OCH HEIC-visning) i stället för att kräva två separata mekanismer. Det
enskilt farligaste FÖRBISEDDA valet vore att återanvända `bilagor`-bucketen
rakt av för anonymt innehåll — en ny, isolerad bucket med egen livscykel är
en billig, GOLV-nivå isolering. Skanning är rätt klassad som BÖR snarare än
GOLV vid denna volym, med Open Forms som starkast belägg — men det är ett
Marcus-beslut att fatta med ögonen öppna, inte en teknisk nödvändighet detta
pass kan avgöra åt honom.

---

## Vad jag inte kunde belägga

- **HEIC-browserstödets exakta procentsats (65–70 %)** — sammanställd via
  sökresultats-SAMMANDRAG från flera icke-förstaparts-källor
  (windowsreport.com, testmuai.com, heicify.com), inte en enskild
  auktoritativ mätning (t.ex. caniuse.com hade varit starkare men
  fetchades inte direkt i detta pass). Riktningen (Chrome/Firefox/Edge
  saknar nativt stöd, Safari har det) är väl belagd oberoende av det
  exakta talet.
- **Zendesks malware-skanningsmekanism i detalj** (byggd in-house eller
  tredjepartsleverantör?) — artikeln som skulle svara på det krävde
  inloggning, endast sökresultats-sammandraget kunde läsas.
- **Cloudmersive/AWS GuardDuty Malware Protection som ARKITEKTONISKT
  genomförbara mot Supabase Storage specifikt** — GuardDuty Malware
  Protection for S3 kräver en äkta AWS S3-bucket i det egna AWS-kontot,
  vilket Supabase Storage (S3-kompatibelt API, men inte en bucket i VÅRT
  AWS-konto) sannolikt INTE tillåter; detta är en SLUTSATS av hur tjänsten
  är dokumenterad, inte ett skarpt test.
- **hCaptcha/Friendly Captcha eller andra tredjeparts uppladdnings-widgets
  specifikt för filuppladdning** — inte undersökta, eftersom
  systerpassets ALTCHA-rekommendation redan täcker BOT-skyddet för hela
  formuläret (uppladdningen ärver samma grind, § 3), och en separat
  fil-specifik CAPTCHA-produkt söktes inte.
- **`pretix`/`Indico`s faktiska filuppladdningssäkerhet** — källkoden/
  dokumentationen som gick att nå i detta pass tid täckte inte
  ämnet specifikt (§ 7); bokfört som en TUNN, inte obefintlig, precedent.
- **VirusTotal Private Scanning-nivåns exakta pris och tillgänglighet för
  ett litet företag** — bara att den FINNS och löser delningsproblemet
  verifierades, inte kostnaden.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut** — kräver Marcus grillning
innan den blir ett PRD-kort, precis som systerpasset.

1. Bygg uppladdningsvägen enligt § 8:s sekvens F1–F10: signerad
   ticket + direkt PUT + finalize, mönster återanvänt från
   `TASK-146.4` mönster 2.
2. Kör ett minimaltest (§ 4, § 9 punkt 1) för HEIC-avkodning/
   bildomkodning i Deno INNAN byggarbetet börjar — detta är den mest
   osäkra tekniska biten och kan ändra hela F6-designen.
3. Provisionera en NY, isolerad, privat bucket (`publika-bilagor`) —
   dela ALDRIG blast radius med den betrodda `bilagor`-bucketen.
4. Sätt startbedömningarna i § 8:s tabell (15 MB/fil, 5 filer, 40 MB
   totalt, 48h föräldralös-sweep) och omvärdera dem mot mätt incidens,
   samma disciplin som `ADR-129`s rundtak.
5. Skjut realtidsskanning till en fast-follow-diskussion (§ 9 punkt 5) —
   bygg INTE den som en lanseringsspärr; dokumentera valet öppet om
   Marcus vill ha den ändå (hans beslutsrätt, inte teknikens).
6. Lås en lagringstid för länkade filer (§ 9 punkt 3) TILLSAMMANS med det
   parallella inkorgs-passets beslut — de två får inte divergera.
7. Skriv bilage-specifik text in i integritetspolicyn (§ 6, § 9 punkt 6)
   INNAN lansering — juridiskt arbete, inte kod.

---

## Källförteckning

### Förstapart — säkerhet och standarder

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) — hämtad 2026-09-19
- [OWASP/ASVS v4.0.3 — 0x20-V12-Files-Resources.md](https://github.com/OWASP/ASVS/blob/v4.0.3/4.0/en/0x20-V12-Files-Resources.md) — hämtad 2026-09-19
- [W3C — Inaccessibility of CAPTCHA](https://www.w3.org/TR/turingtest/) — redan citerad av systerpasset, samma princip om icke-interaktiva/ekvivalenta metoder tillämpad här på drag-och-släpp

### Förstapart — Supabase (via context7, 2026-09-19)

- [Supabase — Resumable uploads (TUS)](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [Supabase — Standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase — Upload file size restrictions](https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT)
- [Supabase — Edge Function resource usage / 150MB-minnesgräns](https://supabase.com/docs/guides/troubleshooting/edge-function-monitoring-resource-usage)
- [Supabase — JavaScript Storage reference (`uploadToSignedUrl`, `createSignedUploadUrl`, `createSignedUrl` med `download`)](https://supabase.com/docs/reference/javascript/getchannels)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — redan citerad av systerpasset

### Förstapart — react-aria-components (via context7, 2026-09-19)

- [React Aria — FileTrigger](https://react-aria.adobe.com/FileTrigger)
- [React Aria — DropZone](https://react-aria.adobe.com/DropZone)

### Förstapart — tillgänglighet och offentlig sektor

- [GOV.UK Design System — File upload](https://design-system.service.gov.uk/components/file-upload/) — hämtad 2026-09-19 (via sökresultats-sammandrag)
- [GOV.UK Notify — Send files by email](https://www.notifications.service.gov.uk/using-notify/send-files-by-email) — hämtad 2026-09-19
- [Open Forms — Virus scan configuration](https://open-forms.readthedocs.io/en/3.5.4/configuration/general/virus_scan.html) — hämtad 2026-09-19

### Tredjepart — precedenter och leverantörer

- [Zendesk — Allowing attachments in tickets](https://support.zendesk.com/hc/en-us/articles/4408832757146-Allowing-attachments-in-tickets) — hämtad 2026-09-19 (via sökresultat)
- [Zendesk — Managing malicious attachments](https://support.zendesk.com/hc/en-us/articles/4483794022170-Managing-malicious-attachments) — hämtad 2026-09-19 (via sökresultat)
- [VirusTotal — Private Scanning](https://docs.virustotal.com/docs/private-scanning) — hämtad 2026-09-19 (via sökresultat)
- [Cloudmersive — Virus Scan API / gratisnivå](https://cloudmersive.com/virus-api) — hämtad 2026-09-19 (via sökresultat)
- [Amazon GuardDuty — Pricing/Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html) — hämtad 2026-09-19 (via sökresultat)

### Förstapart/myndighet — GDPR

- [GDPR Art. 5, Art. 9](https://gdpr-info.eu/), samma källbegränsning som systerpasset dokumenterar (konveniensspegling, EUR-Lex ej direkt fetchbar) — hämtad 2026-09-19

### Interna källor (detta repo)

- [`publik-anmalningsvag-utan-inloggning-2026-09-19.md`](publik-anmalningsvag-utan-inloggning-2026-09-19.md) — systerpasset, samma sessions bot-/DoS-arkitektur
- [`miranon-se-intagskedjan-idag-2026-09-19.md`](miranon-se-intagskedjan-idag-2026-09-19.md) § 1.3, § 4 — dagens Elfsight-kontaktformulär
- [ADR-125](../decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md) — bilagornas modell och rendering (utgående dokument, kontrasterat mot inkommande i denna fil)
- [ADR-011](../decisions/ADR-011-csp-plugin-deferral.md) — CSP-plan, hash-/self-formen
- `docs/reference/data-model.md` § "Bilagornas datamodell" (rad 478–620)
- `docs/reference/airtable-constraints.md` § G, P28–P29 (rad 518–588)
- `supabase/functions/{create-attachment-upload-ticket,finalize-attachment-upload,upload-attachment}/index.ts`
- `supabase/functions/_shared/attachments.ts`
- `scripts/provision-attachments-bucket.mjs`
- `tasks/sessions/2026-09-19-session-128.md` Del 1–3
