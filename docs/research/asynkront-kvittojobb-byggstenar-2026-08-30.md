---
owner: marcus803
updated: 2026-08-30
review_by: 2026-11-30
status: stable
---

# Asynkront kvittojobb — byggstenar i vår stack (underlag för skivning)

> **Syfte:** Session 113 grillade fram en samsyn samma dag (2026-08-30) —
> en global inbetalnings-inkorg där Lotta registrerar inbetalningar
> (Enter, inget mail) och trycker EN gång på "Skicka N kvitton". Marcus
> krav, ordagrant: *"1 snabbt klick för att skicka hundratals kvitton och
> användaren behöver aldrig vänta på något, du klickar 'skicka' och en
> halv sekund efter får du notisen '100 kvitton skickade'"*. Det här
> passet svarar på EN fråga: **vilka byggstenar finns i vår stack
> (Supabase, Resend, DocRaptor, Airtable) för att bygga just det, och vad
> kostar/kräver var och en?** Ingen kod skrivs i detta pass.

## Vad jag redan hade — och vad som är nytt i detta pass

**Läst i sin helhet innan research startade:**

- [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md)
  — hela dagens kod-kedja: en mottagare/en betalning per EF-anrop,
  singelloop-mönstret, ingen bakgrundsmotor någonstans i repot.
- [`kvitto-beslutsunderlag-2026-08-30.md`](kvitto-beslutsunderlag-2026-08-30.md)
  — grillningsunderlaget, orkestrerarens rekommendation (beloppskälla
  före trigger, aktiv handling bevaras) och Marcus fem svarsfrågor.
  Detta pass tillför INGET om UX/trigger-frågan — den är redan besvarad
  av dagens grillning (den globala inkorgen). Det som är nytt här är
  renodlat infrastruktur: vad HÄNDER servern när knappen trycks.
- [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md)
  — svensk rätt + tolv systems UX-mönster. Täcker Pretix/Stripe/Tito ur
  ett TRIGGER-perspektiv (när skickas ett kvitto), inte ur ett
  BAKGRUNDSJOBB-perspektiv (hur körs sändningen utan att blockera
  användaren). Detta pass går in i Pretix källkod (Celery-arkitekturen)
  för första gången — inget av det fanns i det tidigare passet.
- [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  i sin helhet, alla tre Updates — nummerformat, allokeringsprotokollet,
  samtidighetsbeviset (8-/16-vägs), server-side-exklusiviteten.
- [`mallar-server-side-docraptor-prod-2026-08-23.md`](mallar-server-side-docraptor-prod-2026-08-23.md)
  § Delfråga 2 — DocRaptors synkrona/asynkrona gränser var redan
  researchade 2026-08-23 (mätta latenser 2,8–3,6 s/dokument,
  samtidighetstak 30). Detta pass CITERAR de talen men verifierar dem
  ÄVEN EN GÅNG SJÄLV, direkt mot `docraptor.com/documentation/api` och
  `/limits`, samma dag som detta dokument skrivs — ingen avvikelse
  hittades mot 2026-08-23 års siffror.
- `docs/reference/airtable-constraints.md` §P4 (5 req/s/bas, delat tak,
  429 + 30 s lockout) och §A (P1–P3, varför ADR-109:s protokoll ser ut
  som det gör) — auktoritativ källa per `CLAUDE.md`, återanvänd oförändrad.
- Egen läsning av koden: `supabase/functions/send-receipt-email/index.ts`,
  `_shared/send-receipt.ts`, `_shared/receipt-numbering.ts`,
  `_shared/airtable-client.ts`, `_shared/mall-render.ts`, `_shared/send-bulk.ts`,
  `_shared/send-action-email.ts`. Ingen tidigare research har räknat
  Airtable-anropen PER KVITTO — det är kärnfyndet i detta pass (§ 5).

**Vad som är nytt här:** hela infrastrukturkatalogen (Supabase Background
Tasks/Queues/Cron/Realtime, Resend batch-API, DocRaptors asynkrona läge —
verifierat direkt av mig, 2026-08-30), Pretix källkodsläsning (Celery-
arkitekturen), Stripes async-bekräftelse, PostgreSQL-sekvensers
race-fria egenskap som kontrast till Airtables protokoll, och en räknad
Airtable-anropsbudget per kvitto som inte fanns i något tidigare pass.

---

## Kort svar

**Dagens kod klarar INTE hundratals kvitton på ett klick — inte för att
DocRaptor eller Resend är för långsamma, utan för att Airtables delade
5-anrop/sekund-tak (`airtable-constraints.md` §P4) multiplicerat med
dagens PER-BETALNING-formade kod (≈6 Airtable-anrop per kvitto) ger
≈600 anrop för 100 kvitton — **≈120 sekunder ren väntan på Airtables
kö, innan DocRaptor eller Resend ens rört ett dokument**, farligt nära
Supabase Edge Functions egen 150 s-gräns för ett synkront svar.** Detta
är den avgörande delfrågan (§ 5) — inte vilken Supabase-byggsten som
väljs.

**Ingen ny infrastruktur krävs för att lösa TIMEOUT-problemet** — Supabase
Edge Functions har redan `EdgeRuntime.waitUntil` inbyggt (bakgrundstask,
svarar direkt, jobbet fortsätter upp till 400 s på vår Pro-plan). Men det
löser bara SVARSTIDEN, inte anropsbudgeten. Den verkliga vinsten ligger i
att BATCHA Airtable-anropen (en delad läsning i stället för en per
kvitto, `createAirtableRecords`/`deleteAirtableRecords` som redan finns i
`_shared/airtable-client.ts` och redan chunk:ar i grupper om 10) — då
krymper budgeten från ≈600 anrop till ≈20–25 för hela batchen, och
totalt ≈120 s krymper till en uppskattad ≈30–90 s för 100 kvitton (räknat
öppet i § 7, inte mätt end-to-end).

**Rekommendation (inte beslut):** `EdgeRuntime.waitUntil` + en batchad
Airtable-omdesign av numrerings-/läs-/skrivstegen + Supabase Realtime
Broadcast för push-notisen, med polling-vid-appöppning som reservväg.
Ingen kö (pgmq), ingen cron behövs för Miranon Medias volymer i dag — de
blir motiverade först om batchstorleken växer långt bortom hundratalet
eller om jobbet behöver överleva ett serverbyte/en flera-dygns paus. Se
§ 7–8.

---

## 1. Supabase — byggstenarna

### 1.1 Edge Functions Background Tasks (`EdgeRuntime.waitUntil`)

Källa: [`supabase.com/docs/guides/functions/background-tasks`](https://supabase.com/docs/guides/functions/background-tasks),
läst direkt 2026-08-30 (fullständig sidtext extraherad och citerad
nedan, inte en sammanfattning).

- **Mekanik, ordagrant:** *"You can use `EdgeRuntime.waitUntil(promise)`
  to explicitly mark background tasks. The Function instance continues
  to run until the promise provided to `waitUntil` completes."* Anropas
  i request-handlern UTAN `await` — svaret returneras direkt (*"Won't
  block the request, runs in background"*), och funktionsinstansen lever
  kvar tills löftet är klart.
- **Klienten kan stänga fliken utan att stoppa jobbet.** Bakgrundsarbetet
  är knutet till FUNKTIONSINSTANSEN, inte till den ursprungliga HTTP-
  anslutningen — exakt det Marcus kravet "användaren behöver aldrig
  vänta" kräver strukturellt, inte bara upplevelsemässigt.
- **`beforeunload`-eventet** varnar innan instansen stängs av (tidsgräns
  nådd) — kan användas för att logga ofullständig status, men sparar
  INGET automatiskt; det är kod som måste skrivas.
- **Tidsgränsen är EXAKT samma som request-gränserna** (§1.2 nedan) —
  *"The maximum duration is capped based on the wall-clock, CPU, and
  memory limits. The function will shut down when it reaches one of
  these limits."* Ingen separat, större budget för bakgrundsarbete.
- **Gotcha, lokal testning:** instanser dödas automatiskt efter varje
  request i lokal CLI-körning om inte `[edge_runtime] policy =
  "per_worker"` sätts i `supabase/config.toml` — annars avbryts
  bakgrundstasken före den hinner klart, ett fel som ser ut som en bugg i
  koden men är en testmiljö-inställning.

### 1.2 Edge Functions — gränserna (Runtime limits)

Källa: [`supabase.com/docs/guides/functions/limits`](https://supabase.com/docs/guides/functions/limits),
läst direkt 2026-08-30, citerat ordagrant.

| Gräns | Värde | Gäller |
|---|---|---|
| Maximum Memory | 256 MB | alla planer |
| Maximum Duration (wall clock) | **Free: 150 s · Paid: 400 s** | hela instansens livstid, inklusive `waitUntil`-arbete |
| Maximum CPU Time | 2 s per request | *"does not include async I/O"* — nätverksväntan (Airtable/DocRaptor/Resend) räknas INTE in |
| Request idle timeout | **150 s** | om inget svar skickats inom 150 s → HTTP 504, oavsett plan |

**Vad detta betyder konkret:** ett SYNKRONT anrop (ingen `waitUntil`)
måste alltid svara inom 150 s eller dödas med 504 — detta är repots
redan kända gräns (`airtable-constraints.md:116`, kalibrerad mot
Airtable-retryn). Ett `waitUntil`-bakgrundsjobb får upp till 400 s på vår
Pro-plan (`ADR-050` bekräftar Pro för staging-projektet 2026-05;
prod-tiern är inte färskt live-verifierad i detta pass, se § Vad jag
inte kunde belägga) — men fortfarande en HÅRD gräns, inte obegränsad.
CPU-tidens 2-sekundersgräns undantar uttryckligen nätverksväntan, vilket
gör den irrelevant för ett I/O-dominerat jobb som kvittoflödet (Airtable/
DocRaptor/Resend-anrop, inte tung JS-beräkning) — men det är OKLART av
dokumentationstexten om ett `waitUntil`-jobb delar SAMMA 2-sekunders-pott
som request:en som spawnade det, eller får en egen; flaggat obelagt.

### 1.3 Supabase Queues (pgmq)

Källor: [`supabase.com/docs/guides/queues`](https://supabase.com/docs/guides/queues),
[`.../queues/pgmq`](https://supabase.com/docs/guides/queues/pgmq),
[`.../queues/consuming-messages-with-edge-functions`](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions),
alla lästa direkt 2026-08-30.

- **Postgres-native, byggd på pgmq-extensionen.** Ingen extern
  meddelandekö-tjänst — meddelanden lever som rader i Postgres.
- **Leveransgaranti, ordagrant Supabases egen formulering:**
  *'"exactly once" delivery of messages to a consumer within a
  visibility timeout'*. **Reservation:** detta är leverantörens EGEN
  marknadsföringstext för pgmq/SQS-familjens mönster (synlighetsfönster +
  radering vid lyckad bearbetning) — branschstandarden för den familjen
  kallas normalt *at-least-once med ett synlighetsfönster*, inte äkta
  exactly-once (ett konsumentkrasch mitt i bearbetningen KAN ge en andra
  leverans efter att fönstret löpt ut). Jag har inte hittat en
  oberoende, teknisk motivering för "exactly once" på sidorna jag läste
  — citerat, inte verifierat djupare.
- **Officiellt rekommenderat konsumtionsmönster (kodexempel citerat i
  sin helhet, verifierat 2026-08-30):** en Edge Function anropar
  `supabase.schema('pgmq_public').rpc('read', { queue_name, sleep_seconds:
  0, n: 5 })`, bearbetar varje meddelande, och `rpc('delete', { queue_name,
  msg_id })` vid lyckad bearbetning. Fel → meddelandet ligger kvar, läses
  igen nästa körning. Sidan säger explicit: *"You might find this kind of
  setup handy to run with Supabase Cron."* — dvs. Supabases EGEN
  rekommendation för "batch processing" är Cron+Queue+EF i kombination,
  inte ett enda stort EF-anrop.
- **Meddelandestorlek/max payload:** INTE hittat på någon av de tre
  lästa sidorna — obelagt i detta pass (se § Vad jag inte kunde belägga).
- **Kostnad/plan-krav:** ingen plan-specifik gräns nämnd på de lästa
  sidorna utöver den generella Postgres-resursbudgeten för projektets
  plan.

### 1.4 Supabase Cron (pg_cron)

Källor: [`supabase.com/docs/guides/cron`](https://supabase.com/docs/guides/cron),
[`.../cron/quickstart`](https://supabase.com/docs/guides/cron/quickstart),
lästa direkt 2026-08-30.

- **Minsta intervall: SEKUNDER**, inte minuter — ordagrant: *"can run
  anywhere from every second to once a year"*, och quickstarten visar ett
  konkret exempel som anropar en Edge Function **var 30:e sekund** via
  `net.http_post` (pg_net-extensionen). Villkor: *"You can input seconds
  for your Job schedule interval as long as you're on Postgres version
  15.1.1.61 or later"* — vår Postgres-version är INTE verifierad i detta
  pass.
- **Hur cron anropar en EF:** `pg_net`s `net.http_post(url, headers,
  body, timeout_milliseconds)` — ett vanligt HTTP POST från Postgres
  själv, ingen separat orkestrator.
- **Rekommenderad belastning:** *"For best performance, we recommend no
  more than 8 Jobs run concurrently. Each Job should run no more than 10
  minutes."* — en mjuk rekommendation, inte en hård spärr.

### 1.5 Supabase Realtime

Källa: [`supabase.com/docs/guides/realtime`](https://supabase.com/docs/guides/realtime),
läst direkt 2026-08-30 (översiktsnivå — detaljsidorna för Broadcast/
Postgres Changes är JS-renderade och gav inget extraherbart innehåll via
`curl` i detta pass, se § Vad jag inte kunde belägga).

- **Tre mekanismer:** Broadcast (*"low-latency messages between
  clients... custom notifications"*), Presence (vem är online), Postgres
  Changes (lyssna på databasändringar).
- **Broadcast är den lättaste vägen till "notis när klart"** — kräver
  INGEN backande Postgres-tabell; en Edge Function kan sända ett
  godtyckligt meddelande på en kanal när jobbet är klart, och en
  ansluten klient tar emot det direkt. Nackdel: om klienten inte lyssnar
  i EXAKT det ögonblicket missas meddelandet (ingen historik) — kräver
  antingen att klienten alltid håller kanalen öppen medan jobbet pågår,
  eller en fallback (polling/status-rad) för "kom tillbaka efter att ha
  stängt appen".
- **Postgres Changes kräver att jobbstatusen bor i en Postgres-tabell**
  Realtime kan bevaka — vårt jobb-tillstånd i dag lever i Airtable, inte
  Supabase Postgres, så detta alternativ förutsätter en NY, liten
  statustabell (en additiv migration, inte en stor omläggning).
- **Klientkoden har REDAN `@supabase/supabase-js`** (`package.json`,
  `src/data/config/supabase-client.ts`, används i dag för auth) — Realtime
  är alltså INTE ett nytt beroende att lägga till, bara ett nytt
  användningsmönster. `grep` mot `src/` för `.channel(`/`realtime`/
  `broadcast` gav noll träffar 2026-08-30 — ingen befintlig kod att
  bygga vidare på, men heller ingen konflikt att reda ut.

### 1.6 Sammanfattande tabell — Supabase-byggstenar

| Byggsten | Vad den ger | Gränser | Källa · datum |
|---|---|---|---|
| `EdgeRuntime.waitUntil` | Svara direkt, jobbet fortsätter i samma instans | Wall clock 150 s (Free)/400 s (Paid); CPU 2 s/request (exkl. I/O); dödas hårt vid gräns | [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks), [Limits](https://supabase.com/docs/guides/functions/limits) — 2026-08-30 |
| Supabase Queues (pgmq) | Durabel kö i Postgres, "exactly once"-leverans inom synlighetsfönster (leverantörens egen term) | Meddelandestorlek ej hittad; kräver EF+Cron-konsument (officiellt mönster) | [Queues](https://supabase.com/docs/guides/queues), [pgmq](https://supabase.com/docs/guides/queues/pgmq) — 2026-08-30 |
| Supabase Cron (pg_cron) | Schemalagd anrop av SQL/DB-funktion/EF via `pg_net` | Ner till EN SEKUND (kräver Postgres ≥15.1.1.61, overifierat hos oss); rekommenderat max 8 samtidiga jobb, 10 min/jobb | [Cron](https://supabase.com/docs/guides/cron), [Quickstart](https://supabase.com/docs/guides/cron/quickstart) — 2026-08-30 |
| Realtime Broadcast | Push-notis till ansluten klient, ingen ny tabell krävs | Ingen historik — missas om klienten inte lyssnar just då; delivery-detaljer ej djupresearchade | [Realtime](https://supabase.com/docs/guides/realtime) — 2026-08-30 |
| Realtime Postgres Changes | Push driven av en Postgres-radändring, har historik via tabellen | Kräver att jobbstatus flyttas/speglas till en Postgres-tabell (ny, liten migration) | [Realtime](https://supabase.com/docs/guides/realtime) — 2026-08-30 |

---

## 2. Resend — batch-API och gränser

Källor: [resend.com/docs/api-reference/emails/send-batch-emails](https://resend.com/docs/api-reference/emails/send-batch-emails),
[.../emails/send-email](https://resend.com/docs/api-reference/emails/send-email),
[.../api-reference/introduction](https://resend.com/docs/api-reference/introduction),
alla lästa direkt 2026-08-30 (params extraherade ur den renderade
sidans egna datastruktur, inte gissade).

**Den avgörande raden, ordagrant:** *"The attachments field is not
supported yet"* under batch-endpointens § Limitations. **Batch-API:et
kan alltså INTE användas för kvitton** — varje kvitto bär en unik PDF,
och batchen stödjer inga bilagor alls. Detta bekräftar att dagens
singelloop-mönster (`_shared/send-receipt.ts`, ett `/emails`-anrop per
mottagare) inte är en genväg som glömdes bort — det är den ENDA vägen
Resends API tillåter för bilagebärande mail, batch eller ej.

Övriga fakta, citerade:

| Egenskap | Batch (`/emails/batch`) | Singel (`/emails`) |
|---|---|---|
| Max mottagare/objekt | 100 mailobjekt per anrop; `to` max 50 adresser | `to` max 50 adresser |
| Bilagor | **Stöds INTE** | Max 40 MB/mail (efter base64) |
| Idempotency-Key | En nyckel per HELA API-anropet (inte per mail i arrayen), 24 h TTL, max 256 tecken | Samma header, samma regler, gäller det enskilda anropet |
| `scheduled_at` | Finns per mailobjekt (naturligt språk eller ISO 8601) — bekräftat i rå sidkod, ej relevant för vårt "skicka nu"-behov | Finns, samma format |
| Rate limit | **10 req/s per TEAM, delat över ALLA API-nycklar** — gäller båda endpointerna lika | Samma |

**Konsekvens för N=100:** eftersom batch-API:et är uteslutet, blir
Resend-delen av jobbet 100 SEPARATA `/emails`-anrop, som ALLA delar
samma 10 req/s-tak med varenda annan mailsändning kontot gör samtidigt
(bekräftelser, påminnelser, testmail). Ren rate-limit-tid för 100 anrop:
≥10 sekunder, i praktiken något mer eftersom varje anrops egen
svarslatens (typiskt hundratals millisekunder) redan ger en naturlig
paus mellan sekventiella anrop.

---

## 3. DocRaptor — synkront vs asynkront, verifierat direkt

Källor: [docraptor.com/documentation/api](https://docraptor.com/documentation/api)
och [.../api/limits](https://docraptor.com/documentation/api/limits),
lästa direkt av mig 2026-08-30 (INTE en återanvändning av 2026-08-23-
passets citat, utan en oberoende omkörning mot samma sidor — ingen
avvikelse hittad).

- **Synkront är default, ordagrant:** *"DocRaptor attempts to create
  documents using synchronous creation by default. We set a time limit
  of 60 seconds for synchronous creation."*
- **Asynkront läge finns**, ordagrant: sätt `async: true` — *"Setting
  this to true will extend the time spent on your job to 600 seconds,
  queue your document for background creation and DocRaptor will return
  JSON with a status_id key set."* Man kan pollra en statussida eller ange
  `callback_url` (POST vid lyckad completion — INGET callback vid fel,
  status-sidan måste läsas för felorsak).
- **Limits-sidan, ordagrant:** Synchronous Document Generation Time: **1
  minute**. Asynchronous Document Generation Time: **10 minutes**.
  **Simultaneous Request Limit: 30.** Hosted Document Output Size: 100
  MB. *"We do not impose hard limits on numbers of pages, document
  complexity, input size, or output size (except for hosted
  documents)."*
- **Vår egen mätning (2026-08-23-passet, återanvänd, inte omgjord i
  detta pass):** 2,8–3,6 sekunder per kvitto-/bilagedokument — ~5 % av
  60-sekunderstaket. Asynkront läge är alltså INTE motiverat för ETT
  dokuments genereringstid. Den relevanta gränsen för en batch är i
  stället **samtidighetstaket på 30** — vid N=100 renderingar med en
  pool på t.ex. 8 samtidiga anrop (medveten marginal under 30-taket,
  eftersom andra mallgenereringar — bekräftelser, deltagarinformation —
  kan pågå samtidigt på samma konto) tar det ceil(100/8) × 3,6 s ≈ 45 s;
  med full 30-vägs samtidighet ≈ ceil(100/30) × 3,6 s ≈ 14 s.

---

## 4. Precedent — hur branschledarna bygger det

### 4.1 Pretix (öppen källkod) — Celery-arkitekturen, läst direkt ur GitHub 2026-08-30

Källor (raw.githubusercontent.com, `pretix/pretix`, branch `master`,
hämtade och lästa rad för rad 2026-08-30):
[`base/services/mail.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/mail.py)
(1149 rader), [`base/services/invoices.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/invoices.py)
(813 rader), [`base/services/tasks.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/tasks.py)
(187 rader).

Detta är GENUINT nytt underlag — det tidigare branschpraxis-passet
(2026-08-30, tidigare samma dag) läste bara Pretix egna ANVÄNDARDOKUMENT
(triggerbeteende), aldrig källkoden. Fyndet här handlar om HUR ett
kvitto/en faktura faktiskt produceras bakom kulisserna, inte NÄR.

- **Celery, inte en synkron loop.** Varje utgående mail representeras av
  en `OutgoingMail`-databasrad SOM SKAPAS FÖRST, innan något skickas.
  Behöver mailet bilagor som måste renderas (fakturor) byggs en
  Celery-**kedja**: `invoice_pdf_task.si(invoice.pk)` (en uppgift per
  faktura, SKIPPAD om filen redan finns — `if not i.file` — cache-
  medveten, regenererar aldrig i onödan) `.on_error(send_task)`
  (degraderar snällt: mailet skickas ändå även om PDF-genereringen
  kraschar) → kedjad med `mail_send_task.si(outgoing_mail=m.id)`.
- **Dispatchen väntar på databas-committet, ordagrant kommentar i
  koden:** kedjan triggas via `transaction.on_commit(lambda:
  chain(*task_chain).apply_async())` — Celery-arbetaren kan alltså ALDRIG
  plocka upp en uppgift vars databas-rad inte redan är synlig, en
  klassisk race som annars uppstår när en bakgrundsarbetare är snabbare
  än den egna transaktionen som skapade jobbet.
- **Ett jobb per mottagare, inte en loop i en process.** `mail_send_task`
  och `invoice_pdf_task` är EGNA Celery-`@app.task`-funktioner, dispatchade
  var för sig — matchar exakt vårt eget "singelloop"-mönster
  (`_shared/send-receipt.ts`), bara distribuerat över en arbetarpool
  i stället för en sekventiell `await`-loop i en process.
- **Självläkande sweeps, inte bara try/catch.** Två separata funktioner i
  `mail.py` läser periodiskt: (1) mail fast i `"inflight"`
  (Celery-arbetaren dog mitt i sändningen) och (2) mail fast i
  `"queued"` (uppgiften startade aldrig) — båda görs om via
  `mail_send_task.apply_async(...)` igen. En tredje funktion
  uppskattar `"om det för närvarande finns en lång Celery-kö för
  mail"` innan fler jobb trycks in — ett medvetet mottryck mot att
  svämma över en redan trög kö.
- **Egna Task-basklasser** (`TransactionAwareTask`, `EventTask`/
  `OrganizerTask` som auto-laddar rätt databasobjekt ur ett ID,
  `ProfiledTask` som mäter varje uppgifts körtid och utfall som en
  metrik) — infrastruktur för OBSERVERBARHET runt varje enskild
  bakgrundsuppgift, inte bara att den körs.

**Slutsats:** Pretix arkitektur är den STARKASTE branschprecedenten för
kandidat C nedan (kö + arbetare + periodisk läkningssvep) — den
validerar mönstret som moget och etablerat, inte en uppfinning för detta
pass.

### 4.2 Stripe — bekräftar det redan kända mönstret, ingen ny research

Källa: [docs.stripe.com/receipts](https://docs.stripe.com/receipts),
läst direkt 2026-08-30 (kort, konfirmerande läsning — huvuddjupet ligger
redan i `kvitto-branschpraxis`-passet).

Ordagrant: *"Delayed or asynchronous payment methods can therefore take
longer to trigger receipts"* — kvittot är HÄNDELSEDRIVET (triggat av
betalningens egen `succeeded`-status, inte av en admin-knapp) och kan
alltså komma FÖRSENAT relativt betalningsdatumet, en accepterad
konsekvens av asynkronitet Stripe själva dokumenterar öppet. En manuell
"skicka kvitto"-knapp finns per enskild betalning i Dashboard — ingen
"skicka N nya kvitton"-knapp hittad, samma slutsats som det tidigare
passets Mönster 4.

### 4.3 Vad detta betyder ihop

Det gemensamma mönstret hos varje undersökt branschledare (nu inklusive
Pretix källkod) är: **köa jobbet → svara/kvittera direkt → en arbetare
(process/uppgift) gör det tunga arbetet per mottagare → status per rad →
notis när klart.** Ingen av dem bygger en enda lång synkron loop som
håller en HTTP-anslutning öppen i minuter.

---

## 5. Airtable-anropsbudgeten — den avgörande delfrågan

Räknat direkt ur `supabase/functions/send-receipt-email/index.ts` och
`_shared/receipt-numbering.ts`, 2026-08-30. **Detta är den siffra ingen
tidigare research i repot har räknat fram.**

**Per kvitto, dagens kod, bästa fall (ingen numreringskollision):**

| Steg | Airtable-anrop |
|---|---|
| Läs Anmälan (`fetchAirtableRecord`) | 1 GET |
| Läs Event (`fetchAirtableRecord`) | 1 GET |
| Numrering steg 1 — läs hela årets ledger | 1 GET |
| Numrering steg 2 — skriv kandidat | 1 POST |
| Numrering steg 3 — läs om, verifiera ensam | 1 GET |
| Finalisera (PATCH efter accepterad sändning) | 1 PATCH |
| **Summa, bästa fall** | **6 anrop** |

Vid en numreringskollision (ADR-109 § Beslut 2, steg iv–v) tillkommer
ytterligare minst 2 anrop (DELETE + ett nytt varv av steg 1–3) — och
kollisionsrisken STIGER med antalet samtidiga allokeringar, exakt det
100-kvitton-scenariot skapar om numren allokeras parallellt.

**Airtables tak är 5 anrop/sekund PER BAS, delat mellan ALLA samtidiga
klienter** (`airtable-constraints.md` §P4, verbatim: *"Airtable tillåter
5 API-anrop per sekund per bas; översvämning → HTTP 429 + 30s lockout.
Ingen förhandling, fast straff."*). Detta tak gäller INTE bara
kvittojobbet — Lottas egen appanvändning, andra Edge Functions, och
eventuella parallella agent-körningar mot samma bas delar samma budget.

**Räknat rakt av — dagens kod, loopad N gånger, ingen batchning:**

| N | Airtable-anrop (bästa fall) | Ren väntetid på 5 req/s-taket |
|---|---|---|
| 8 | 48 | ≈ 9,6 s |
| 100 | 600 | **≈ 120 s** |

För N=100 äter Airtable-väntan ENSAM nästan hela den synkrona
150-sekundersgränsen (§1.2) — INNAN DocRaptor har renderat ett enda
dokument eller Resend skickat ett enda mail. Detta är den verkliga
flaskhalsen, inte DocRaptors 60-sekundersgräns eller Resends 10 req/s.

**En batchad omdesign krymper detta dramatiskt.** Repot har REDAN
byggstenarna: `_shared/airtable-client.ts` bär `createAirtableRecords`/
`deleteAirtableRecords`, båda dokumenterade i sin egen kodkommentar
(*"Airtable tillåter max 10 records per anrop"*) och redan chunkande i
grupper om 10. En genomtänkt batch-väg för N=100 skulle kunna se ut så
här (RÄKNEEXEMPEL, ingen implementation):

| Steg | Anrop (optimerat) |
|---|---|
| Läs alla N anmälningar i EN filtrerad `list`-fråga (`OR(RECORD_ID()=…)`, upp till 100/sida — **väletablerat Airtable-mönster, ej separat verifierat i detta pass**) | 1 |
| Läs Event en gång, cacha (om alla betalningar hör till samma event) | 1 |
| Läs ledger för året en gång | 1 |
| Batch-skapa N kandidatnummer i grupper om 10 | 10 |
| Verifiera hela batchen med en andra ledger-läsning | 1 |
| Batch-finalisera (PATCH) i grupper om 10 — **kräver en NY `updateAirtableRecords`-hjälpfunktion, finns inte i dag** | 10 |
| **Summa** | **≈ 24 anrop** |

24 anrop / 5 req/s ≈ **5 sekunder** i stället för 120. Detta ÄR den
enskilt viktigaste designfrågan för hela funktionen — inte vilken
Supabase-byggsten som väljs för att svara snabbt. **Kollisionshanteringen
för en batchad allokering (10 kandidater i EN skrivning i stället för 1)
är en NY, oprövad generalisering av ADR-109:s befintliga tie-break-
algoritm** — konceptuellt en rak utvidgning (samma "läs om, tie-breaka på
lägsta record-ID, förloraren raderas, gör om"-princip, applicerad på en
grupp i stället för en post), men INTE byggd eller testad. Se § 8.

---

## 6. Numreringen under parallellism — en jämförelse mot Postgres

Källa: [postgresql.org/docs/current/functions-sequence.html](https://www.postgresql.org/docs/current/functions-sequence.html),
läst direkt 2026-08-30.

Ordagrant om `nextval()`: värden är garanterat unika mellan samtidiga
transaktioner, och sekvensen **rullas aldrig tillbaka** även om
transaktionen som anropade den avbryts — *"transaction aborts or database
crashes can result in gaps in the sequence of assigned values"*, ett
ACCEPTERAT normalläge, inte ett fel.

Detta är den STRUKTURELLA skillnaden mot ADR-109:s protokoll: en riktig
databas-sekvens i Supabase Postgres skulle ge EXAKT det ADR-109 vill ha
(täta, race-fria, monotont ökande nummer) med **NOLL retry-logik** —
Postgres garanterar unikheten atomiskt, till skillnad från Airtables
läs-skriv-verifiera-dans som finns just för att Airtable SAKNAR denna
primitiv (`airtable-constraints.md` §A, P1–P3).

**Detta är INTE en rekommendation att flytta ledgern.** Det är en
options-rymd-punkt: att flytta räknaren (eller hela `Kvitton`-tabellen)
till Supabase Postgres skulle kräva en NY ställningstagande mot
`ADR-063` (Airtable som förstklassig leverabel) och `ADR-109` § Beslut 5
(ledgern är uttryckligen SAMMA Airtable-tabell som kvittots beständiga
metadata) — ett beslut av en helt annan magnitud än detta research-pass
mandat. Se § 8.

**Praktisk mellanväg, utan att flytta ledgern:** allokera numren i EN
sekventiell, ej parallelliserad, batchad omgång (§5:s räkneexempel) —
Airtables kollisionsrisk existerar bara vid SAMTIDIGA skrivningar; kör
batchens numrering som en enda sekventiell process (inte N parallella
allokeringar) och kollisionsrisken sjunker till ungefär samma nivå som
dagens en-i-taget-flöde, fast med färre anrop totalt.

---

## 7. Tre kandidatarkitekturer

Alla tre BEHÅLLER ADR-109 § Beslut 4 (server-side-exklusiv allokering)
och § Beslut 1 (nummerformatet) oförändrade — de skiljer sig bara i HUR
jobbet körs och HUR notisen når Lotta.

### A — Synkront men batchat (ingen ny infrastruktur)

**Sekvens (prosa):** Lotta trycker "Skicka 100 kvitton" → klienten POSTar
EN gång till en ny bulk-EF → EF:en batchar sina Airtable-anrop (§5:s
≈24-anropsräkneexempel) → renderar PDF:er med en begränsad samtidighets-
pool (t.ex. 8 parallella, under DocRaptors 30-tak) → skickar via Resend
singelloop, throttlad mot 10 req/s → EF:en svarar med HELA
resultatlistan (per mottagare: skickat/misslyckat) när ALLT är klart →
klienten visar "100 kvitton skickade" ur SVARET.

**Tid till notis (öppet räknat, ej mätt end-to-end):**

| N | Airtable (batchat) | DocRaptor (pool 8) | Resend (throttlad) | Total, grovt |
|---|---|---|---|---|
| 8 | ≈1 s | ≈3,6 s (ett varv) | ≈1–2 s | **≈10–15 s** |
| 100 | ≈5 s | ≈45 s | ≈10–15 s | **≈60–90 s**, om stegen delvis pipelinas |

**Vad som krävs:** ENDAST kod — ingen migration, ingen cron, ingen kö.
Återanvänder `createAirtableRecords`/`deleteAirtableRecords` som redan
finns; kräver en NY `updateAirtableRecords` (finns inte i dag) och en NY
generalisering av ADR-109:s tie-break till en grupp-batch (§5, §8).

**Risk, INTE verifierad i detta pass:** om Lotta stänger fliken/appen
INNAN svaret kommer — fortsätter Deno-processen köra klart requesten på
servern ändå, eller avbryts den när TCP-anslutningen dör? Jag har inte
hittat ett Supabase-dokument som svarar på detta specifika beteende.
**Rekommendationen är att ALDRIG förlita sig på det** — kombinera alltid
med `waitUntil` (arkitektur B) som säkerhetsnät, oavsett vilken
arkitektur som väljs. Denna arkitektur är alltså egentligen bara ett
delsteg mot B, inte ett självständigt slutmål.

### B — Synkront svar, jobbet i bakgrunden (`waitUntil` + Realtime) — REKOMMENDERAD

**Sekvens (prosa):** Lotta trycker "Skicka 100 kvitton" → EF:en gör
BILLIGA valideringar (finns registreringarna, är beloppen ifyllda) →
skapar en liten jobbstatus-rad (ny, additiv Postgres-tabell, t.ex.
`kvitto_jobb`) → svarar OMEDELBART (< 1 s) med "Jobb mottaget, 100
kvitton" → `EdgeRuntime.waitUntil(korBatch())` fortsätter i SAMMA
instans, samma batchade pipeline som A, och uppdaterar jobbstatus-raden
per mottagare allteftersom → när alla 100 är klara: sänder ett Realtime
Broadcast-meddelande ("100 kvitton skickade, 0 misslyckade") till en
kanal klienten prenumererar på SÅ LÄNGE appen är öppen; om Lotta har
stängt appen ser hon i stället jobbstatus-raden (eller en sammanfattning
av `Kvitton`-tabellen) NÄSTA gång hon öppnar appen (poll-vid-appstart som
reservväg, samma mönster som befintliga sändningars status-läsning).

**Tid till notis:** samma UNDERLIGGANDE bearbetningstid som A (≈10–15 s
för N=8, ≈60–90 s för N=100) — skillnaden är att Lotta INTE behöver
hålla appen öppen och väntande under tiden; klicket ger henne en
omedelbar kvittens ("mottaget"), och den RIKTIGA "100 skickade"-notisen
kommer när jobbet faktiskt är klart, via push om hon är kvar i appen
eller vid nästa öppning annars. Detta matchar Marcus krav bäst: klicket
i sig känns omedelbart, väntan flyttas bort från användarens
uppmärksamhet snarare än att elimineras (den kan strukturellt inte
elimineras — PDF-rendering och mailsändning tar den tid de tar).

**Vad som krävs:** en NY, liten Postgres-migration (jobbstatus-tabell),
Realtime Broadcast-kanalkod (klienten har redan `@supabase/supabase-js`
— nytt MÖNSTER, inget nytt beroende), samma batchade Airtable-omdesign
som A. Ingen kö, ingen cron.

**Gotcha (Supabase-dokumenterad, ej gissad):** lokal CLI-testning dödar
bakgrundsinstanser efter varje request om inte `[edge_runtime] policy =
"per_worker"` sätts i `supabase/config.toml` — en byggagent som skriver
ett lokalt test för detta UTAN den inställningen kommer se jobbet
avbrytas i förtid och kan mistolka det som en kodbugg.

### C — Kö + periodisk konsument (Supabase Queues + Cron)

**Sekvens (prosa):** Lotta trycker "Skicka 100 kvitton" → EF:en lägger
100 meddelanden i en pgmq-kö (`kvitto_jobb`, ETT meddelande per
betalning) → svarar omedelbart ("100 kvitton köade") → en `pg_cron`-post
anropar en KONSUMENT-EF var t.ex. 5:e–10:e sekund → konsumenten läser en
handfull meddelanden (`pgmq_public.read`), kör EXAKT samma
per-mottagare-pipeline som i dag (numrering → rendering → sändning),
raderar meddelandet vid lyckat utfall (`pgmq_public.delete`) — ett
misslyckat meddelande ligger kvar och görs om NÄSTA tick, samma
självläkande sweep-princip som Pretix (§4.1) — → progress
("62 av 100 skickade") läses ur kölängden eller en statustabell → notis
när kön för den batchen är tom.

**Tid till notis:** beror på cron-intervallet och hur många meddelanden
varje tick bearbetar — INGEN enskild invokation behöver klara HELA
batchen inom en gräns, så N kan i princip växa obegränsat utan att röra
vid 150 s/400 s-taken. För N=100 med t.ex. 10-sekundersintervall och 10
meddelanden/tick: ≈10 tick × 10 s ≈ **100 s** minsta möjliga (grovt,
cron-schemalagt — jämförbart med B, men strukturellt mer motståndskraftigt
mot stora N och serveromstarter mitt i).

**Vad som krävs:** pgmq-extensionen aktiverad, en ny kö, en ny
konsument-EF, en ny `pg_cron`-post, en statustabell/progress-läsning för
UI:t. Genuint NY infrastruktur på tre punkter (extension, cron-jobb,
konsument-EF) — den enda av de tre som kräver det.

### Rekommendation (REKOMMENDATION, inte beslut — Marcus/skivningen avgör)

**Arkitektur B**, byggd PÅ en batchad Airtable-omdesign (§5), inte på en
enkel loop av dagens per-betalning-kod. Motivering: den möter Marcus krav
bokstavligt (omedelbar klick-respons, notis när klart, ingen väntan) utan
att kräva ny infrastruktur utöver en liten statustabell — `waitUntil` och
`@supabase/supabase-js`/Realtime finns redan tillgängliga. **Arkitektur
C (kö + cron) är rätt VÄXLINGSSPÅR, inte startpunkten** — den blir
motiverad om Miranon Medias batchstorlekar växer långt bortom hundratalet,
eller om ett jobb behöver överleva en serveromstart eller en flerdygns
paus (t.ex. ett årsskifte-batch-jobb). Att bygga C:s kö-infrastruktur för
dagens volymer vore spekulativ komplexitet ovanför golvet
(`~/.claude/CLAUDE.md` § Dubbelriktad över-engineering-vakt).

---

## 8. Vad detta betyder för ADR-109

- **§ Beslut 1 (format `MM-<år>-<löpnummer>`, start 1001) — OFÖRÄNDRAT.**
  Ortogonalt mot vilken arkitektur som väljs.
- **§ Beslut 4 (server-side-exklusiv allokering) — OFÖRÄNDRAT, förstärkt.**
  I alla tre kandidatarkitekturer är det FORTFARANDE en Edge Function
  (den ursprungliga, eller en kö-konsument i C) som ensam anropar
  `allocateReceiptNumber` — klienten skickar aldrig ett nummer, oavsett
  hur jobbet trigg­as.
- **§ Beslut 2 (läs-högsta + skriv-kandidat + verifiera + retry) — HÅLLER
  I PRINCIP, men är SKRIVET FÖR EN ALLOKERING I TAGET.** En bulk-funktion
  kan antingen (a) anropa protokollet N gånger i en loop — fungerar
  oförändrat, men bär hela §5:s ≈120-sekunders Airtable-kostnad för
  N=100 — eller (b) generalisera SAMMA tie-break-princip till att
  reservera k nummer per omgång (§5:s ≈24-anropsräkneexempel). (b) är
  INTE byggt eller testat — det är en ÖPPEN FRÅGA denna research
  identifierar, inte en lösning. En eventuell `ADR-109`-uppdatering (eller
  ett nytt kort) bör ta explicit ställning till (a) kontra (b) innan en
  bulk-skiva skrivs, eftersom valet avgör om N=100 tar ≈120 s eller ≈5 s
  Airtable-bunden tid.
- **§ Öppna punkter, "En klient-retry FÖRE serverns svar... kan
  förbruka ett extra nummer" — BLIR MER RELEVANT under Arkitektur A,
  MINDRE relevant under B/C.** En lång öppen HTTP-anslutning (A) ger
  klienten fler tillfällen att time:a ut och retry:a; B/C ger klienten
  ett OMEDELBART svar (mottagningskvitto eller könummer) och håller ALDRIG
  en lång anslutning öppen — detta är ett ytterligare argument FÖR B/C
  utöver svarstidsmatematiken i §7.
- **§ Beslut 5 (ledgern = SAMMA Airtable-tabell som kvittots metadata) —
  UTMANAS INTE av detta pass, men §6:s Postgres-sekvens-jämförelse visar
  att en STRUKTURELLT enklare lösning (noll retry-logik) finns UTANFÖR
  Airtable. Detta är en öppen options-rymd-punkt för Marcus, kopplad till
  `ADR-063`s "Airtable som förstklassig leverabel" — INTE en
  rekommendation att flytta ledgern i detta pass.
- **`_shared/send-receipt.ts`s egen filhuvud-kommentar** (*"inget
  tekniskt hinder mot en framtida bulk-brygga (samma orkestrator anropad
  i loop av en klientsida bulk-knapp), men ingen sådan knapp finns i
  v1"*) förutsåg exakt denna fråga redan vid bygget. Detta pass
  bekräftar att den enkla loop-vägen FUNGERAR men har en mätbar, icke-
  trivial kostnad (§5) — informationen ADR-109s författare inte hade
  när den raden skrevs.

---

## Vad jag inte kunde belägga

- **Airtables PATCH-batchgräns (uppdatering av flera records i ett
  anrop).** `createAirtableRecords`/`deleteAirtableRecords` i
  `_shared/airtable-client.ts` dokumenterar båda "max 10 per anrop" —
  jag antar att PATCH/update följer samma plattformsgräns (Airtables
  REST-API är genomgående konsekvent på denna punkt), men jag har INTE
  verifierat det självständigt mot Airtables egen dokumentation i detta
  pass (`airtable.com/developers/web/api/rate-limits` och angränsande
  sidor är en JS-renderad SPA som `curl` inte kan rendera — samma hinder
  som mötte det tidigare branschpraxis-passet för Pretix/Acuitys
  webbsidor). Ingen `updateAirtableRecords`-hjälpfunktion finns i repot
  i dag.
- **pgmq:s dokumenterade maximala meddelandestorlek.** Sökt på tre
  Supabase-sidor (Queues, pgmq-extensionen, konsumtionsguiden) — ingen
  nämnde ett explicit tal.
- **Om en Supabase Edge Function fortsätter köra klart en pågående
  request på servern efter att klienten stängt sin TCP-anslutning, UTAN
  `waitUntil`.** Ingen av de lästa sidorna svarade på detta specifika
  beteende. Rekommendationen i §7 (Arkitektur A) är att ALDRIG förlita
  sig på det oavsett — kombinera alltid med `waitUntil`.
- **Verklig, mätt latens vid 100 SAMTIDIGA DocRaptor-renderingar eller
  100 sekventiella Resend-sändningar.** De citerade talen (2,8–3,6 s/
  dokument, 10 req/s-tak) är dokumenterade gränser/tidigare enskilda
  mätningar, inte en levande belastningstest i detta pass — mina
  tid-till-notis-siffror i §7 är därför UTTRYCKLIGEN öppna
  uppskattningar, inte mätningar, precis som uppdraget bad om.
- **En egen, ren mätning av Airtables råa REST-latens.** Jag försökte en
  läsning mot staging-basens `Kvitton`-tabell via Airtable-MCP:t
  (read-only `list_records`, INGEN mutation av ledgern) och tog tiden
  runt anropet: ≈5,3 sekunder. Detta talet är INTE tillförlitligt som ett
  mått på Edge Function-kodens egen `fetch()`-latens — det är
  förorenat av MCP-verktygets egen rundtur (stdio till en separat
  serverprocess, plus min egen modell-tur emellan), inte en ren
  HTTP-mätning. Jag har medvetet INTE skapat eller mutrat några
  `Kvitton`-poster för att mäta skriv-latens, eftersom det hade lagt
  spårlösa testrader i en bokföringsledger — repots §5-räkning bygger i
  stället på det tidigare passets öppet deklarerade antagande
  (~200–500 ms/anrop) plus P4:s HÅRDA 5 req/s-tak, som är den
  dimensionerande siffran oavsett per-anrops exakta latens.
- **Om Miranon Medias PROD-Supabase-projekt faktiskt är på Pro-plan
  just nu.** `ADR-050` mandaterade Pro för STAGING-projektet 2026-05 och
  noterade explicit att CLI:t döljer plan-tiern (`ADR-050` § T1,
  *"obekräftad"*). Jag har antagit Pro (400 s wall-clock) för §7:s
  räkning baserat på detta, inte en färsk kontroll av dagens
  billing-sida.
- **Om ett `waitUntil`-bakgrundsjobb delar SAMMA 2-sekunders CPU-budget
  som requesten som spawnade det, eller får en egen.** Dokumentationstexten
  klargör inte detta. Sannolikt ofarligt för vårt I/O-dominerade jobb
  (CPU-tid exkluderar uttryckligen nätverksväntan), men inte
  bekräftat.
- **Supabase Realtime Broadcasts exakta leveransgaranti/latens.**
  Översiktssidan beskriver funktionen; detaljsidorna (`/realtime/
  broadcast`, `/realtime/postgres-changes`) gav ingen extraherbar text
  via `curl` i detta pass (JS-renderade, för stora för att vara rena
  dokumentsidor — 1–2,5 MB rå HTML vardera).

---

## Källförteckning

**Supabase (7 källor, alla lästa direkt 2026-08-30):**

- [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks) — `EdgeRuntime.waitUntil`
- [Edge Functions Limits](https://supabase.com/docs/guides/functions/limits) — minne/wall-clock/CPU/idle timeout
- [Supabase Queues](https://supabase.com/docs/guides/queues) — översikt
- [pgmq-extensionen](https://supabase.com/docs/guides/queues/pgmq) — visibility timeout, arkivering
- [Consuming Messages with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions) — det officiella EF+Cron-konsumtionsmönstret
- [Supabase Cron](https://supabase.com/docs/guides/cron) — pg_cron, sekundintervall
- [Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart) — `net.http_post`-exemplet
- [Realtime](https://supabase.com/docs/guides/realtime) — Broadcast/Presence/Postgres Changes-översikt

**Resend (3 källor, lästa direkt 2026-08-30):**

- [Send Batch Emails](https://resend.com/docs/api-reference/emails/send-batch-emails) — 100/anrop, INGA bilagor, idempotensnyckelns räckvidd
- [Send Email](https://resend.com/docs/api-reference/emails/send-email) — bilagor (40 MB), `scheduled_at`
- [API Reference Introduction](https://resend.com/docs/api-reference/introduction) — 10 req/s/team-taket

**DocRaptor (2 källor, verifierade direkt av mig 2026-08-30, oberoende
av 2026-08-23-passets citat — ingen avvikelse):**

- [API-dokumentationen](https://docraptor.com/documentation/api) — synkront default, 60 s-tak, `async`-flaggan
- [Limits](https://docraptor.com/documentation/api/limits) — 1 min synkront / 10 min asynkront / 30 samtidiga

**Precedent (2 källor, nytt djup i detta pass):**

- Pretix — [`base/services/mail.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/mail.py), [`base/services/invoices.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/invoices.py), [`base/services/tasks.py`](https://github.com/pretix/pretix/blob/master/src/pretix/base/services/tasks.py) — Celery-arkitekturen, läst rad för rad
- Stripe — [Receipts](https://docs.stripe.com/receipts) — händelsedriven, asynkron leverans

**PostgreSQL (1 källa):**

- [Sequence Manipulation Functions](https://www.postgresql.org/docs/current/functions-sequence.html) — `nextval()`s race-fria, icke-rullande-tillbaka-garanti

**Internt, auktoritativt (läst i sin helhet, ej ny research):**

- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) §A (P1–P3), §P4 (5 req/s/bas) — den dimensionerande gränsen i hela detta pass
- [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md) — alla beslut och tre Updates
- [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md), [`kvitto-beslutsunderlag-2026-08-30.md`](kvitto-beslutsunderlag-2026-08-30.md), [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md), [`mallar-server-side-docraptor-prod-2026-08-23.md`](mallar-server-side-docraptor-prod-2026-08-23.md)
- Egen läsning: `supabase/functions/send-receipt-email/index.ts`,
  `supabase/functions/_shared/send-receipt.ts`,
  `supabase/functions/_shared/receipt-numbering.ts`,
  `supabase/functions/_shared/airtable-client.ts`,
  `supabase/functions/_shared/send-bulk.ts`,
  `supabase/functions/_shared/send-action-email.ts`,
  `package.json`, `src/data/config/supabase-client.ts`
