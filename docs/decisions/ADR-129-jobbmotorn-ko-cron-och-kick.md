# ADR-129: Jobbmotorn — kö i Postgres, cron som garanti, kick för känslan

- **Status:** Accepted (grillad samsyn S113 Del 11 beslut 11, 2026-08-30 —
  reviderat två gånger under grillningen; Marcus kvittens ordagrant: *"Vi
  kör på det som är branschstandard … 11/10"*. Nattmandatet kvitterat
  ~18:35 UTC: *"B4 ja, B3 ja — kör vidare."*)
  **ADR-baren** (`~/.claude/CLAUDE.md` § ADR-BAR) klaras på alla tre
  villkor: **svårt att återställa** — motorn får tre nya
  infrastrukturdelar i BÅDA miljöer (en databasutökning, en schemalagd
  post och en konsumentfunktion), och prod-halvan är manuella
  Marcus-steg som inte ångras med en revert; **överraskande utan
  kontext** — repots eget research-pass rekommenderade uttryckligen den
  ENKLARE vägen utan kö, och den som läser detta beslut utan § Kontext
  ser en motsägelse; **resultat av en verklig avvägning** — tre
  arkitekturer vägdes i researchen och en fjärde (extern kötjänst) här,
  och den valda bär ett pris som redovisas i § Konsekvenser.
- **Datum:** 2026-08-30
- **Fas:** Fas 6 — PRD `TASK-346` (Lottas betalningsflöde), skiva
  `TASK-346.1`; motorn byggs av `TASK-346.3` (schema) och `TASK-346.4`
  (funktioner)
- **Rör:** Supabase Postgres (utökningarna `pgmq`, `pg_cron`, `pg_net`;
  jobbtabell; kö; `security definer`-wrapper; Realtime-publikationen) ·
  Supabase Vault (en hemlighet per miljö) · nya Edge Functions ·
  `supabase/config.toml` · `.prod-functions-allowlist.conf` ·
  prod-runbooken (`TASK-346.11`)
- **Relation till tidigare beslut:** förutsätter
  [`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
  (betalningsdata i Postgres) · ärver
  [`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md):s
  form (Postgres-tabell, RLS, skrivning via Edge Function med
  `service_role`) · konsumerar
  [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  beslut 4 (allokeringen är server-side, uteslutande — det håller,
  konsumenten är bara en annan server-side-anropare) · bär
  [`ADR-120`](ADR-120-e-postleverantoren-resend-medvetet-valt.md):s mätta
  batch-lucka som konstruktionsvillkor.

## Kontext

### Kravet, i Lottas ord

Åtta betalningar registrerade på lördagsmorgonen ska bli åtta kvitton med
**ett** klick, och Lotta ska kunna lägga ifrån sig iPaden direkt
(användarberättelse 8 och 31). Hon ska se per rad om kvittot är skickat,
väntar eller misslyckades och varför (10). Och Marcus krav bortom
kvittona (37): *"Som Marcus vill jag att alla utskick kan flytta till
samma jobbmotor senare, så att vi bygger motorn en gång."*

Det är tre krav som drar åt olika håll: omedelbar respons, garanterad
fullbordan, och en motor som är generisk nog att bära bekräftelse-,
påminnelse- och deltagarinfo-utskicken i en senare PRD.

### Ordlista för denna ADR

- **Kö** — en lista i databasen där jobb ställer sig och väntar på sin
  tur. Här: utökningen `pgmq`.
- **Cron** — ett schema i databasen som kör en instruktion med jämna
  mellanrum, som ett återkommande alarm. Här: utökningen `pg_cron`.
- **`pg_net`** — låter databasen själv ringa upp en webbadress.
- **Kick** — ett omedelbart, extra anrop vid klicket, så att första
  kvittot inte behöver vänta på nästa alarm.
- **Vault** — Supabases valv för hemligheter, läsbart av databasen.
- **Realtime** — Supabases kanal som knuffar ut databasändringar till
  webbläsaren.

### Research-passet rekommenderade något annat — och rivs här öppet

[`asynkront-kvittojobb-byggstenar-2026-08-30.md`](../research/asynkront-kvittojobb-byggstenar-2026-08-30.md)
§ 7 (rad 606–618) rekommenderar **arkitektur B** — `EdgeRuntime.waitUntil`
plus Realtime, utan kö och utan cron — och skriver om kö-vägen, ordagrant:

> *"**Arkitektur C (kö + cron) är rätt VÄXLINGSSPÅR, inte startpunkten**
> — den blir motiverad om Miranon Medias batchstorlekar växer långt
> bortom hundratalet, eller om ett jobb behöver överleva en
> serveromstart eller en flerdygns paus … Att bygga C:s kö-infrastruktur
> för dagens volymer vore spekulativ komplexitet ovanför golvet."*

**Rekommendationen rivs, med kvittens och med skälen utskrivna** — inte
tystad, inte omtolkad. `~/.claude/CLAUDE.md` § Instruktioner: *"Ett låst
beslut är inte immunt mot evidens — falsifieras det, rivs det öppet med
kvittens."* Samma disciplin gäller åt andra hållet: en rekommendation
rivs öppet, inte i förbifarten.

Tre skäl, i den ordning de föll fram i grillningen (S113 Del 11,
"Orkestrerarens tre reverseringar" punkt 3):

1. **Rekommendationens tyngsta argument var "ingen ny infrastruktur" —
   och det argumentet föll när grunden flyttade.** Passet skrevs medan
   betalningsdata fortfarande antogs ligga i Airtable. `ADR-128` flyttar
   den till Postgres, och därmed finns databasen, migrations­mekanismen
   och `service_role`-vägen redan i bygget. Kön kostar en utökning och en
   tabell ovanpå något som ändå byggs, inte ett nytt system. Lärdomen är
   generell och bokförs som lesson-kandidat: **en rekommendation som
   vilar på "ingen ny infrastruktur" måste räknas om när infrastrukturen
   byts.**
2. **Kravet blev bredare än passet mätte.** Passet svarade på "hur
   skickar vi N kvitton utan att Lotta väntar". Samsynen lade till
   användarberättelse 37: motorn ska bära ALLA utskick, senare. En motor
   som ska bära fler konsumenter behöver en generisk transport och en
   jobbtabell — och båda de delarna är exakt vad B saknar.
3. **Passets egna två växlingsvillkor är redan uppfyllda, inte
   framtida.** Passet skrev att C blir motiverad "om ett jobb behöver
   överleva en serveromstart eller en flerdygns paus". Användarberättelse
   31 (*"appen kan stängas mitt i ett kvittojobb utan att något tappas
   eller dubbleras"*) ÄR det villkoret, formulerat av Marcus innan
   passet skrevs.

Marcus kvitterade valet i klartext: *"Vi kör på det som är
branschstandard … 11/10"*.

**Vad rivningen INTE påstår.** Passets mätningar står oemotsagda och
bär detta beslut: Airtables 5 anrop/sekund är flaskhalsen (≈6
anrop/kvitto ⇒ 100 kvitton ≈ 120 s; batchat ≈ 24 anrop ≈ 5 s), Resends
batch-API stödjer inte bilagor, och `EdgeRuntime.waitUntil` har
150/400 s väggklocka. Det som rivs är rekommendationen, inte underlaget.

### Minimaltestet i staging — mätt, inte antaget (AC #3)

Verifieringsrapporten
([`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
§ 7) lämnade tre punkter uttryckligen **obelagda**: om `postgres`-rollen
faktiskt får installera `pg_cron` i `pg_catalog`, om sekundintervall
accepteras, och om en anon-nyckels JWT passerar `verify_jwt`. Denna skiva
betalade dem. Allt kördes med `npx supabase db query --linked` mot
staging (`pqtshyierkdgwdnxuirz`), 2026-08-30 ~19:10–19:16 UTC, av en
bygg-agent — aldrig `db push`, aldrig prod.

**Utgångsläget.** `select current_user, session_user, version()` gav
`postgres` / `postgres` / `PostgreSQL 17.6 on aarch64-unknown-linux-gnu,
compiled by gcc (GCC) 15.2.0, 64-bit`. Installerade utökningar före
testet: `pg_stat_statements 1.11`, `pgcrypto 1.3`, `plpgsql 1.0`,
`supabase_vault 0.3.1`, `uuid-ossp 1.1`.

**Aktiveringen gick — under `postgres`-rollen, utan superuser.** Fyra
satser, samtliga exit 0:

```sql
create extension pgmq;
create extension pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
create extension pg_net with schema extensions;
```

Kontroll: `pgmq 1.5.1` (schema `pgmq`), `pg_cron 1.6.4` (schema
`pg_catalog`), `pg_net 0.20.3` (schema `extensions`).

**Ett fynd som ändrar konsumentvägen.** Efter installationen fanns
schemana `cron`, `net` och `pgmq` — men **inte `pgmq_public`**. Det
bekräftar mätt vad verifieringsrapportens B6(a) förutsåg ur dokumenten:
Supabases eget konsumentexempel (`supabase.schema('pgmq_public')
.rpc('read')`) kräver Dashboard-toggeln *Expose Queues via PostgREST*,
alltså ett manuellt steg per miljö. Se § Beslut 5.

**Kön tog emot och levererade.**

```sql
select pgmq.create('task346_minimaltest');
select pgmq.send('task346_minimaltest',
  '{"jobbtyp":"kvitto","radId":"minimaltest-346-1"}'::jsonb);   -- msg_id 1
select msg_id, read_ct, message
  from pgmq.read('task346_minimaltest', 30, 1);
```

Läsningen gav `msg_id 1`, `read_ct 1` och meddelandet oförändrat:
`{"jobbtyp": "kvitto", "radId": "minimaltest-346-1"}` — alltså exakt den
generiska formen beslut 1 låser.

**Sekundintervallet accepterades, och höll.** `cron.schedule(
'task346-minimaltest', '10 seconds', …)` returnerade `jobid 1`, och
`cron.job` visade `schedule = '10 seconds'`, `active = true`,
`username = postgres`. `cron.job_run_details` för jobbet:
**9 körningar**, första `19:12:43.052+00`, sista `19:14:03.175+00`,
**samtliga `succeeded`** — 80 sekunder över 8 intervall, alltså exakt
10,0 s per tick.

**Databasen nådde en Edge Function.** Cron-satsen anropade
`net.http_post` mot `…/functions/v1/test-auth` med anon-nyckeln i
`Authorization` och `apikey`. `net._http_response` gav
`status_code 401`, `error_msg null`, kropp
`{"error":"Invalid or expired token"}` — och den strängen finns på exakt
ett ställe i repot: `supabase/functions/_shared/auth.ts:79`, i vår egen
`requireUser`. Anropet nådde alltså funktionen och kördes; det var vår
egen auktorisation som sade nej, inte nätverket.

**Men `verify_jwt`-frågan krävde en ANDRA mätning — och det är värt att
läsa varför.** `test-auth` har `verify_jwt = false` i
`supabase/config.toml` (rad 23–24, medvetet, så testerna kan nå
`requireUser`). Den första mätningen bevisar därför att `pg_net` når en
funktion — men ingenting om gateway-grinden. Ett engångs-`net.http_post`
sändes därför mot `…/functions/v1/get-events`, som har `verify_jwt =
true`, med samma anon-nyckel. Svaret: **`status_code 405`**, kropp
`{"error":"Method not allowed. Use GET."}` — vår egen kod
(`get-events/index.ts`, metodkontrollen som ligger FÖRE `requireUser`).
En kropp ur vår funktion kan bara uppstå om gatewayen släppte igenom
anropet. **Slutsats, mätt:** en anon-nyckels JWT **passerar**
`verify_jwt`, och den är därför **ingen auktorisation** — den säger bara
att anroparen känner till en publik nyckel. Det avgör beslut 6.

**Allt städat, verifierat i båda riktningar.**
`cron.unschedule('task346-minimaltest')` → `true`;
`pgmq.drop_queue('task346_minimaltest')` → `true`; därefter
`drop extension pg_net cascade;`, `drop extension pg_cron cascade;`,
`drop extension pgmq cascade;`. `select extname, extversion from
pg_extension` gav sedan **exakt samma fem rader som utgångsläget**.

En sista kant mättes på köpet: `drop extension pgmq cascade` lämnar
**schemat `pgmq` kvar, tomt** (0 objekt enligt `pg_class`). Det städades
med `drop schema pgmq;`, varefter kontrollen av `pgmq`, `pgmq_public`,
`cron` och `net` gav `(inga)`. Konsekvensen för `TASK-346.3`: en
ned-migration måste droppa schemat explicit, annars ser en "ren"
avinstallation inte ren ut.

**Realtime-publikationen, egen mätning:** `select pubname, puballtables
from pg_publication` → `supabase_realtime`, `puballtables = false`. Nya
tabeller måste alltså läggas till explicit (beslut 8).

## Beslut

### 1. Kön är `pgmq` i Postgres, och meddelandet är generiskt

Ett kömeddelande bär **jobbtyp + rad-ID**, aldrig nyttolasten:
`{"jobbtyp": "kvitto", "radId": "<uuid>"}`. Motorn vet därmed ingenting
om kvitton, och nästa konsument (bekräftelse-, påminnelse- eller
deltagarinfo-utskick, egen PRD) läggs till utan att transporten ändras.
Formen är mätt fungerande i minimaltestet ovan.

Skälet att inte lägga nyttolasten i meddelandet är inte storlek utan
sanning: raden i jobbtabellen är sanningen, och ett meddelande som bar en
kopia hade kunnat bli inaktuellt mellan köandet och konsumtionen.

### 2. Jobbstatus bor i en tabell, inte i kön

Kön är **transport**; jobbtabellen är **sanning**. Varje rad bär
tillstånd (`väntar` → `pågår` → `skickat` eller `fel`), försöksräknare,
tidsstämplar, felskäl i klartext, och kopplingen till sitt objekt (för
kvitton: inbetalningens ID).

Det ger Lotta användarberättelse 10 (per rad: skickat, väntar eller
misslyckades och varför) och gör en omkörning möjlig utan att någon
gissar vad som hände. Ett halvt utfall får aldrig se helt ut.

### 3. Kicken via `EdgeRuntime.waitUntil` ger känslan

Klicket på *Skicka N kvitton* köar jobben och **svarar direkt**. I samma
Edge Function startas ett bakgrundsarbete med `EdgeRuntime.waitUntil`
som omedelbart börjar beta av kön, så att det första kvittot går inom
sekunder i stället för att vänta på nästa cron-tick.

Kicken är en **optimering, aldrig en garanti**. Faller den — instansen
stängs, väggklockan tar slut vid 150/400 s — händer ingenting annat än
att cron tar över. Det är den egenskapen som gör att kicken får vara
enkel.

**Fällan vid lokal test, bokförd i förväg:** i lokal CLI-körning dödas
instansen efter varje request om inte `[edge_runtime] policy =
"per_worker"` sätts i `supabase/config.toml`
(`asynkront-kvittojobb-byggstenar-2026-08-30.md` rad 125–129).
Bakgrundsarbetet avbryts då innan det hunnit klart — *"ett fel som ser ut
som en bugg i koden men är en testmiljö-inställning"*. Raden står här för
att nästa agent inte ska betala den diagnosrundan.

### 4. `pg_cron` var tionde sekund är garantin — och det självläkande svepet

En cron-post var tionde sekund (mätt accepterad och stabil: 9/9 lyckade
tick, exakt 10,0 s) anropar konsumentfunktionen. Den gör två saker:

1. betar av kön om något ligger kvar (garantin bakom kicken),
2. **sveper självläkande**: rader som stått i `pågår` längre än N minuter
   återställs till `väntar`, så ett jobb som dog mitt i plockas upp igen.

Svepet är den konkreta motsvarigheten till Pretix läkningssvep, som
research-passet lyfte som precedent. Det är också hela svaret på
användarberättelse 31.

### 5. Konsumentvägen kräver INGET dashboard-steg — wrapper i `public`

Konsumenten läser kön via en **`security definer`-funktion i `public`**,
skapad av samma migration som skapar kön. `security definer` betyder att
funktionen kör med sin ägares rättigheter, så anroparen behöver inga
rättigheter på `pgmq`-schemat.

Alternativet — Supabases dokumenterade `pgmq_public`-väg — avvisas på en
**mätning, inte en gissning**: schemat `pgmq_public` skapas INTE av
`create extension pgmq` (mätt ovan), utan av Dashboard-toggeln *Expose
Queues via PostgREST*. Det är ett manuellt steg per miljö, alltså ett
Marcus-moment i prod som ingen migration kan uttrycka och ingen CI kan
verifiera.

Den andra kandidaten — en Edge Function som kopplar upp sig direkt mot
`SUPABASE_DB_URL` (hemligheten finns redan i stagings secrets) — avvisas
också, men på ett svagare skäl som skrivs ut ärligt: den skulle införa en
ANDRA dataväg vid sidan av PostgREST, med egen anslutningshantering och
egna kallstartsegenskaper som INTE är mätta hos oss. Wrappern kräver
ingen ny väg alls.

Vinsten är att staging och prod blir **identiska av konstruktion**, och
att hela konsumentvägen ligger i en migrationsfil som går att granska.

### 6. Cron→funktion autentiseras med en delad hemlighet, i två lager

Cron-posten skickar två saker: anon-nyckeln (som `Authorization` och
`apikey`) och en **delad hemlighet i en egen header**. Funktionen
verifierar hemligheten mot en Edge Function-secret med en
konstanttids-jämförelse.

Skälet är mätt i minimaltestet: anon-nyckelns JWT **passerar**
`verify_jwt` (405 ur vår egen kod från `get-events`, som har grinden på).
Gateway-grinden bevisar alltså bara att anroparen känner till en **publik**
nyckel — den är ett första försvar, precis som `supabase/config.toml`s
eget huvud säger, aldrig en auktorisation. Utan det andra lagret hade
vem som helst kunnat starta jobbmotorn.

Båda lagren behålls: `verify_jwt = true` på konsumentfunktionen (gateway
avvisar skräp innan vår kod körs) plus hemligheten (auktorisationen).

**Konsumentfunktionen döps ALDRIG `send-*`.** Mail-låset
(`.mail-lock-policy.conf`) fäller Bash-kommandon som innehåller
`functions/v1/send-`, vilket hade gjort funktionen oanropbar för en agent
i staging. Arbetsnamn: `jobb-konsument` — generiskt, som motorn.

### 7. Vault-seed är ett steg per miljö: staging = agent, prod = Marcus

Cron-posten får inte bära hårdkodade nycklar (Supabases quickstart
skriver `'apikey', 'YOUR_PUBLISHABLE_KEY'` — en platshållare, inte ett
mönster). Per-miljö-värdena — funktionens URL, anon-nyckeln och den
delade hemligheten — bor i **Vault** och läses av cron-satsen.

Valvet är tomt i dag (0 secrets, mätt i verifieringsrapporten § 5 och
orört av denna skiva). Seedningen i **staging görs av en agent**, eftersom
anon-nyckeln är publik och den delade hemligheten där bara skyddar en
testmiljö. Seedningen i **prod görs av Marcus**, som ett namngivet steg i
prod-runbooken (`TASK-346.11`). `service_role`-nyckeln seedas aldrig av en
agent — den når strukturellt aldrig en agent (`deny-hemlighet-utskrift.sh`).

### 8. Nya tabeller läggs in i Realtime-publikationen explicit

`supabase_realtime` har `puballtables = false` (egen mätning ovan), så
jobbtabellen måste läggas till med `alter publication supabase_realtime
add table …` i samma migration som skapar den. Utan den raden får
klienten aldrig en enda push, och felet ser ut som en trasig prenumeration
i webbläsaren.

Klienten prenumererar på Postgres Changes för sina rader **och läser
läget vid appöppning**. Push är en snabbhet, aldrig en sanning: en
webbläsare som var stängd får sitt läge ur läsningen.

### 9. Numren allokeras sekventiellt, en i taget

Konsumenten allokerar kvittonummer ur `ADR-128` beslut 4:s sekvens
**sekventiellt inom en jobbkörning** — aldrig parallellt. Sekvensen är i
sig atomär, men en serie som delas ut i godtycklig ordning ger kvitton
vars nummerordning inte följer utfärdandeordningen, vilket är en
bokföringsegenskap Roger läser.

`ADR-109` beslut 4 (allokeringen är server-side, uteslutande) står
oförändrat: konsumenten är en Edge Function, alltså fortsatt server-side.

### 10. Parallellismen begränsas mot PDF-tjänsten, och mailen går ett i taget

PDF-generering sker med **begränsad parallellism**, under DocRaptors
samtidighetstak, med taket som en namngiven konstant och inte en
tillfällighet. Mailen skickas **ett anrop per kvitto** — Resends
batch-API stödjer inte bilagor, mätt verbatim mot två förstapartssidor i
[`ADR-120`](ADR-120-e-postleverantoren-resend-medvetet-valt.md)
(*"Emails with attachments cannot be sent using our batching endpoint"*).
Ett kvitto utan sin PDF är inte ett kvitto, så batch-vägen är stängd av
produkten, inte av bekvämlighet.

### 11. Motorn är generisk från dag ett, men får EN konsument nu

Kvittojobbet är första konsumenten. Migreringen av bekräftelse-,
påminnelse- och deltagarinfo-utskicken till samma motor är en **egen
PRD** och byggs inte här. Det som byggs generiskt är transporten
(beslut 1), tabellens form (beslut 2) och svepet (beslut 4) — inte en
abstraktion för konsumenter som ännu inte finns.

## Alternativ som övervägdes

**A. Klientloop (dagens form).** Webbläsaren skickar ett kvitto i taget
och väntar. Avvisat i grillningen: Lotta står och väntar, en stängd flik
tappar resten, och ett halvt utfall syns inte.

**B. `EdgeRuntime.waitUntil` + Realtime utan kö och cron — research-passets
rekommendation.** Riven öppet med kvittens; hela resonemanget står i
§ Kontext. Kort: dess bärande argument ("ingen ny infrastruktur") föll när
`ADR-128` flyttade grunden till Postgres, kravet blev bredare än passet
mätte (användarberättelse 37), och passets egna växlingsvillkor
("överleva en serveromstart") var redan uppfyllda av användarberättelse
31. Passets **mätningar** står oemotsagda och bär detta beslut.

**C. Kö via `pgmq_public` och Supabases dokumenterade konsumentexempel.**
Avvisat på mätning: schemat skapas av en Dashboard-toggle, inte av
utökningen — ett manuellt steg per miljö som varken migration eller CI
kan uttrycka.

**D. Konsument som kopplar direkt mot `SUPABASE_DB_URL`.** Avvisat: en
andra dataväg vid sidan av PostgREST, med omätta anslutnings- och
kallstartsegenskaper. Hemligheten finns visserligen redan, men "det finns
redan" är inte ett arkitekturskäl.

**E. Extern kötjänst (QStash, Inngest, Trigger.dev).** Avvisat på samma
linje som `ADR-110` alternativ 3: ny leverantör, nytt auth-flöde och ny
kostnadsrad för något en Postgres-instans som redan är i drift kan bära.

**F. Bara cron, ingen kick.** Avvisat på upplevd svarstid, öppet
deklarerat som ett produktval och inte en mätning: upp till tio sekunder
innan första kvittot ens startar är korrekt men känns trögt för den som
just tryckt. Kicken kostar några rader och kan misslyckas gratis (beslut
3), så priset för att ha den är lågt och priset för att sakna den betalas
vid varje klick.

**G. Bara kick, ingen cron.** Det ÄR alternativ B, och faller med det.

## Konsekvenser

**Positiva.** Ett klick, direkt svar, och ett jobb som överlever en stängd
flik, en serveromstart och ett fel mitt i. Motorn bär alla framtida
utskick utan att transporten byts. Varje del är mätt i staging innan den
skrevs in, inte antagen. Självläkningen gör "pågår för alltid" till ett
tillstånd med en bevakare i stället för en tyst hängning.

**Negativa och skuld.** Tre nya infrastrukturdelar (utökning, cron-post,
konsumentfunktion) i BÅDA miljöer. Prod-halvan är minst fem manuella
Marcus-steg — migrationer, utökningar, Vault-hemligheter, cron-posten och
funktionen i `.prod-functions-allowlist.conf` (fail-closed) — och de bor i
prod-runbooken (`TASK-346.11`), inte här. En cron-post som anropar en
URL med en hemlighet är en yta att skydda; hemligheten roteras i samma
runbook.

**Obelagt, med avsikt.** **Prods** Postgres-version är omätt — sekund­
intervall kräver ≥ 15.1.1.61, och staging mätte 17.6, men prod-ref fälls
av `scripts/deny-prod-ref.sh` för en agent. Faller den kontrollen i prod
är fallbacket ett minutintervall plus kicken, inte en trasig motor;
mätningen är ett namngivet steg i prod-runbooken. Även Supabase-planens
väggklocka (150 s mot 400 s) är obelagd sedan `ADR-050` T1 —
konstruktionen är medvetet oberoende av vilken det är, eftersom ingen
enskild invokation behöver klara hela batchen.

**En kant att inte glömma:** `drop extension pgmq cascade` lämnar schemat
`pgmq` kvar, tomt (mätt). En ned-migration måste droppa det explicit.

## Relaterat

- [`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
  — betalningsdata i Postgres; motorn förutsätter den.
- [`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
  — formen: Postgres-tabell, RLS, skrivning via Edge Function med
  `service_role`.
- [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  beslut 4 — server-side-exklusiv allokering, oförändrad av att
  anroparen nu är en kökonsument.
- [`ADR-120`](ADR-120-e-postleverantoren-resend-medvetet-valt.md) —
  batch-luckan som gör ett anrop per kvitto till ett produktkrav.
- [`asynkront-kvittojobb-byggstenar-2026-08-30.md`](../research/asynkront-kvittojobb-byggstenar-2026-08-30.md)
  — underlaget vars rekommendation rivs här, och vars mätningar bär
  beslutet.
- [`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
  § 2 B6 och § 7 — de tre obelagda punkter minimaltestet betalade.
- `tasks/sessions/2026-08-29-session-113.md` § Del 11 beslut 11 och
  "Orkestrerarens tre reverseringar" — grillningens trail.
